/**
 * Team side of the gift box (/admin/gift). Same gate as /admin/campaign
 * (ADMIN_EMAILS + CAMPAIGN_TEAM_EMAIL, confirmed accounts only).
 *
 *   GET  /api/giftbox-admin                         products (incl. hidden), links, orders
 *   POST { action: 'save_product', id?, brand, name, notes, priceCents, imageUrl, productUrl, maxPerOrder, isActive, sortOrder }
 *   POST { action: 'create_link', winnerName, winnerEmail?, label?, budgetCents, expiresInDays? }
 *   POST { action: 'revoke_link', id }
 *   POST { action: 'order_status', id, status, trackingNumber?, carrier?, notify? }
 *        Moving an order to preparing / shipped / delivered / canceled emails the
 *        customer (cc GIFTBOX_CC_EMAILS, default the three founders) unless
 *        notify === false. Best effort: a failed email never fails the save.
 *   POST { action: 'order_tracking', id, trackingNumber, carrier, notify? }
 *        Saves tracking. If the order is already shipped and the number is new,
 *        emails the customer the tracking link (unless notify === false).
 *   POST { action: 'sync_sheet' }                    re-read the Google Sheet now
 */
import { randomBytes } from 'node:crypto';
import { verifyUser } from './_usageLimit.js';
import { isCampaignAdmin, setPrivateHeaders } from './_campaign.js';
import { sheetEditUrl, syncFromSheet } from './_giftboxSheet.js';
import { CARRIERS, EMAILED_STATUSES, EMAIL_RE, ORDER_STATUSES, UUID_RE, cleanTracking, giftboxCcRecipients, orderStatusEmail, safeUrl, sendGiftboxEmail } from './_giftbox.js';

/** Tracking fields from the body. { fields } to save, or { error }. Missing keys are left alone. */
function parseTracking(body) {
  const fields = {};
  if ('trackingNumber' in body) {
    const raw = String(body.trackingNumber ?? '').trim();
    if (raw) {
      const n = cleanTracking(raw);
      if (!n) return { error: 'trackingNumber' };
      fields.tracking_number = n;
    } else fields.tracking_number = null;
  }
  if ('carrier' in body) {
    const c = String(body.carrier ?? '').trim().toLowerCase();
    if (c && !(c in CARRIERS)) return { error: 'carrier' };
    fields.carrier = c || null;
  }
  return { fields };
}

/** Emails the customer about their order. Never throws. */
async function emailCustomer(admin, order) {
  try {
    const message = orderStatusEmail({
      status: order.status, name: order.ship_name, items: order.items,
      carrier: order.carrier, trackingNumber: order.tracking_number,
    });
    if (!message || !order.ship_email) return { ok: false, skipped: true };
    const r = await sendGiftboxEmail(order.ship_email, message, { cc: giftboxCcRecipients() });
    if (r.ok) {
      await admin.from('giftbox_orders').update({ last_emailed_status: order.status, last_emailed_at: new Date().toISOString() }).eq('id', order.id);
    } else if (!r.skipped) console.error('[giftbox-admin] status email', r.error);
    return r;
  } catch (e) {
    console.error('[giftbox-admin] status email', e?.message || e);
    return { ok: false, error: 'email_failed' };
  }
}

const intIn = (v, min, max) => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};
const text = (v, max) => String(v ?? '').trim().slice(0, max);

export function newToken() {
  return randomBytes(18).toString('base64url');
}

export default async function handler(req, res) {
  setPrivateHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const { user, error, admin } = await verifyUser(req);
  if (error === 'server_misconfigured' || error === 'auth_error') return res.status(503).json({ error: 'unavailable' });
  if (error || !user) return res.status(401).json({ error: 'auth_required' });
  if (!isCampaignAdmin(user)) return res.status(403).json({ error: 'forbidden' });

  try {
    if (req.method === 'GET') {
      // The team page always re-reads the sheet, and says so if it couldn't.
      const sync = await syncFromSheet(admin, { force: true });
      const [p, i, o] = await Promise.all([
        admin.from('giftbox_products').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        admin.from('giftbox_invites').select('*').order('created_at', { ascending: false }).limit(200),
        admin.from('giftbox_orders').select('*').order('created_at', { ascending: false }).limit(500),
      ]);
      const err = p.error || i.error || o.error;
      if (err) throw err;
      return res.status(200).json({ products: p.data || [], links: i.data || [], orders: o.data || [], sheetUrl: sheetEditUrl(), sync });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (body.action === 'save_product') {
      const name = text(body.name, 200);
      const price = intIn(body.priceCents, 0, 1000000);
      if (!name || price === null) return res.status(400).json({ error: 'bad_request', field: !name ? 'name' : 'price' });
      if (body.imageUrl && !safeUrl(body.imageUrl)) return res.status(400).json({ error: 'bad_request', field: 'imageUrl' });
      if (body.productUrl && !safeUrl(body.productUrl)) return res.status(400).json({ error: 'bad_request', field: 'productUrl' });
      const row = {
        category: text(body.category, 60),
        brand: text(body.brand, 120),
        name,
        notes: String(body.notes ?? '').trim().slice(0, 2000),
        price_cents: price,
        image_url: safeUrl(body.imageUrl),
        product_url: safeUrl(body.productUrl),
        max_per_order: intIn(body.maxPerOrder ?? 1, 1, 20) ?? 1,
        is_active: body.isActive === undefined ? true : Boolean(body.isActive),
        sort_order: intIn(body.sortOrder ?? 0, -100000, 100000) ?? 0,
        updated_at: new Date().toISOString(),
      };
      if (body.id) {
        if (!UUID_RE.test(String(body.id))) return res.status(400).json({ error: 'bad_request' });
        const { data, error: upErr } = await admin.from('giftbox_products').update(row).eq('id', body.id).select().maybeSingle();
        if (upErr) throw upErr;
        if (!data) return res.status(404).json({ error: 'not_found' });
        return res.status(200).json({ ok: true, product: data });
      }
      const { data, error: insErr } = await admin.from('giftbox_products').insert(row).select().single();
      if (insErr) throw insErr;
      return res.status(200).json({ ok: true, product: data });
    }

    if (body.action === 'sync_sheet') {
      const result = await syncFromSheet(admin, { force: true });
      return res.status(result.ok ? 200 : 502).json(result);
    }

    if (body.action === 'create_link') {
      const winnerName = text(body.winnerName, 120);
      const budget = intIn(body.budgetCents, 100, 1000000);
      const email = text(body.winnerEmail, 254).toLowerCase();
      if (!winnerName || budget === null || (email && !EMAIL_RE.test(email))) return res.status(400).json({ error: 'bad_request' });
      const days = body.expiresInDays ? intIn(body.expiresInDays, 1, 365) : null;
      const row = {
        token: newToken(),
        winner_name: winnerName,
        winner_email: email || null,
        label: text(body.label, 120),
        budget_cents: budget,
        expires_at: days ? new Date(Date.now() + days * 864e5).toISOString() : null,
        created_by: user.email,
      };
      const { data, error: insErr } = await admin.from('giftbox_invites').insert(row).select().single();
      if (insErr) throw insErr;
      return res.status(200).json({ ok: true, link: data });
    }

    if (body.action === 'revoke_link') {
      if (!UUID_RE.test(String(body.id || ''))) return res.status(400).json({ error: 'bad_request' });
      const { data, error: upErr } = await admin.from('giftbox_invites').update({ status: 'revoked' }).eq('id', body.id).eq('status', 'open').select().maybeSingle();
      if (upErr) throw upErr;
      if (!data) return res.status(409).json({ error: 'not_open' });
      return res.status(200).json({ ok: true });
    }

    if (body.action === 'order_status' || body.action === 'order_tracking') {
      const isStatus = body.action === 'order_status';
      if (!UUID_RE.test(String(body.id || '')) || (isStatus && !ORDER_STATUSES.includes(body.status))) return res.status(400).json({ error: 'bad_request' });
      const tracking = parseTracking(body);
      if (tracking.error) return res.status(400).json({ error: 'bad_request', field: tracking.error });
      const { data: before, error: readErr } = await admin.from('giftbox_orders').select('*').eq('id', body.id).maybeSingle();
      if (readErr) throw readErr;
      if (!before) return res.status(404).json({ error: 'not_found' });
      const patch = { ...tracking.fields, updated_at: new Date().toISOString() };
      if (isStatus) patch.status = body.status;
      const { data, error: upErr } = await admin.from('giftbox_orders').update(patch).eq('id', body.id).select().maybeSingle();
      if (upErr) throw upErr;
      if (!data) return res.status(404).json({ error: 'not_found' });
      const statusChanged = isStatus && before.status !== data.status && EMAILED_STATUSES.includes(data.status);
      const newTrackingWhileShipped = !isStatus && data.status === 'shipped' && data.tracking_number && data.tracking_number !== before.tracking_number;
      let email = { ok: false, skipped: true };
      if (body.notify !== false && (statusChanged || newTrackingWhileShipped)) email = await emailCustomer(admin, data);
      return res.status(200).json({ ok: true, emailed: Boolean(email.ok), emailError: email.ok || email.skipped ? null : email.error || 'email_failed', emailsOff: Boolean(email.skipped && (statusChanged || newTrackingWhileShipped) && body.notify !== false) });
    }

    return res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    console.error('[giftbox-admin]', e?.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
}

/**
 * Team side of the gift box (/admin/gift). Same gate as /admin/campaign
 * (ADMIN_EMAILS + CAMPAIGN_TEAM_EMAIL, confirmed accounts only).
 *
 *   GET  /api/giftbox-admin                         products (incl. hidden), links, orders
 *   POST { action: 'save_product', id?, brand, name, notes, priceCents, imageUrl, productUrl, maxPerOrder, isActive, sortOrder }
 *   POST { action: 'create_link', winnerName, winnerEmail?, label?, budgetCents, expiresInDays? }
 *   POST { action: 'revoke_link', id }
 *   POST { action: 'order_status', id, status }
 *   POST { action: 'sync_sheet' }                    re-read the Google Sheet now
 */
import { randomBytes } from 'node:crypto';
import { verifyUser } from './_usageLimit.js';
import { isCampaignAdmin, setPrivateHeaders } from './_campaign.js';
import { sheetEditUrl, syncFromSheet } from './_giftboxSheet.js';
import { EMAIL_RE, ORDER_STATUSES, UUID_RE, safeUrl } from './_giftbox.js';

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

    if (body.action === 'order_status') {
      if (!UUID_RE.test(String(body.id || '')) || !ORDER_STATUSES.includes(body.status)) return res.status(400).json({ error: 'bad_request' });
      const { data, error: upErr } = await admin.from('giftbox_orders').update({ status: body.status, updated_at: new Date().toISOString() }).eq('id', body.id).select().maybeSingle();
      if (upErr) throw upErr;
      if (!data) return res.status(404).json({ error: 'not_found' });
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'unknown_action' });
  } catch (e) {
    console.error('[giftbox-admin]', e?.message || e);
    return res.status(500).json({ error: 'server_error' });
  }
}

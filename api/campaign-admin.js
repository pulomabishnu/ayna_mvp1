/**
 * Team view of the free product campaign (/admin/campaign). ADMIN_EMAILS only,
 * same gate as /admin/reviews.
 *
 *   GET  /api/campaign-admin                                   everything
 *   POST { action: 'fulfillment', claimId, status }            needs_shipping|preparing|shipped|delivered|canceled
 *   POST { action: 'inventory', rewardProductId, inventoryTotal?, isActive? }
 *   POST { action: 'add_product', inventoryTotal, productId }   adds a catalog product to the pool
 *   POST { action: 'add_product', inventoryTotal, brand, name, size?, category?, imageUrl?, productUrl? }  adds a reward-only item
 *   POST { action: 'campaign', state: 'launch'|'pause'|'resume'|'end' }
 *   POST { action: 'vinted_list' }                              prizes that are Vinted listings, with status
 *   POST { action: 'vinted', results: [{ listingId, status }] } available|reserved|sold; emails the team on a change
 */
import { verifyUser } from './_usageLimit.js';
import { isCampaignAdmin, rpc, setPrivateHeaders } from './_campaign.js';
import { sendCampaignEmail, sendTeamAlert, shippedEmail, teamVintedAlert } from './_campaignEmail.js';
import { CAMPAIGN_ID } from '../src/utils/freeProductCampaign.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUSES = new Set(['needs_shipping', 'preparing', 'shipped', 'delivered', 'canceled']);
const VINTED_STATUSES = new Set(['available', 'reserved', 'sold']);

function intIn(v, min, max) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
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
      return res.status(200).json(await rpc(admin, 'campaign_admin_overview', { p_campaign: CAMPAIGN_ID }));
    }
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    if (body.action === 'fulfillment') {
      if (!UUID_RE.test(String(body.claimId || '')) || !STATUSES.has(body.status)) return res.status(400).json({ error: 'bad_request' });
      const result = await rpc(admin, 'campaign_admin_set_fulfillment', { p_claim: body.claimId, p_status: body.status });
      if (!result?.ok) return res.status(404).json(result || { error: 'not_found' });
      let emailed = false;
      if (body.status === 'shipped') {
        const first = await rpc(admin, 'campaign_mark_notified', { p_campaign: result.campaignId, p_user: result.userId, p_kind: 'shipped' });
        if (first) {
          const { data: u } = await admin.auth.admin.getUserById(result.userId);
          const progress = await rpc(admin, 'campaign_progress', { p_campaign: result.campaignId, p_user: result.userId });
          const sent = await sendCampaignEmail(u?.user?.email, shippedEmail({ product: progress?.claim?.product }));
          emailed = sent.ok;
          if (!sent.ok) await rpc(admin, 'campaign_unmark_notified', { p_campaign: result.campaignId, p_user: result.userId, p_kind: 'shipped' });
        }
      }
      return res.status(200).json({ ok: true, emailed });
    }

    if (body.action === 'inventory') {
      if (!UUID_RE.test(String(body.rewardProductId || ''))) return res.status(400).json({ error: 'bad_request' });
      const patch = { updated_at: new Date().toISOString() };
      if (body.inventoryTotal !== undefined) {
        const total = intIn(body.inventoryTotal, 0, 100000);
        if (total === null) return res.status(400).json({ error: 'bad_inventory' });
        patch.inventory_total = total;
      }
      if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);
      const { error: upErr } = await admin.from('reward_products').update(patch).eq('id', body.rewardProductId).eq('campaign_id', CAMPAIGN_ID);
      // The database refuses a total below what has already been claimed.
      if (upErr) return res.status(409).json({ error: 'below_claimed', message: 'Total cannot be lower than the number already claimed.' });
      return res.status(200).json({ ok: true });
    }

    if (body.action === 'add_product') {
      const total = intIn(body.inventoryTotal, 1, 100000);
      if (total === null) return res.status(400).json({ error: 'bad_request' });
      const productId = String(body.productId || '').trim();
      if (productId) {
        // A catalog product (shows its catalog name, photo and research).
        if (!/^[a-z0-9-]{2,120}$/i.test(productId)) return res.status(400).json({ error: 'bad_request' });
        const { data: product } = await admin.from('product_catalog').select('id').eq('id', productId).maybeSingle();
        if (!product) return res.status(404).json({ error: 'unknown_product', message: 'That id is not in product_catalog.' });
        const { error: insErr } = await admin.from('reward_products').insert({ campaign_id: CAMPAIGN_ID, product_id: productId, inventory_total: total });
        if (insErr) return res.status(409).json({ error: 'already_in_pool' });
        return res.status(200).json({ ok: true });
      }
      // A reward-only item (e.g. PR haul): name and brand required, no health claims stored.
      const text = (v, max) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
      const httpsUrl = (v) => { const u = text(v, 2000); return /^https:\/\/[^\s]+$/.test(u) ? u : null; };
      const item = {
        campaign_id: CAMPAIGN_ID,
        name: text(body.name, 160),
        brand: text(body.brand, 80),
        size: text(body.size, 60) || null,
        category: text(body.category, 40) || null,
        image_url: httpsUrl(body.imageUrl),
        product_url: httpsUrl(body.productUrl),
        inventory_total: total,
      };
      if (!item.name || !item.brand) return res.status(400).json({ error: 'bad_request', message: 'Add a brand and a product name.' });
      const { error: insErr } = await admin.from('reward_products').insert(item);
      if (insErr) return res.status(409).json({ error: 'already_in_pool', message: 'That product is already in the pool.' });
      return res.status(200).json({ ok: true });
    }

    if (body.action === 'campaign') {
      const now = new Date().toISOString();
      const { data: c } = await admin.from('reward_campaigns').select('starts_at').eq('id', CAMPAIGN_ID).maybeSingle();
      let patch;
      if (body.state === 'launch') patch = { is_active: true, starts_at: c?.starts_at || now, ends_at: null };
      else if (body.state === 'pause') patch = { is_active: false };
      else if (body.state === 'resume') patch = { is_active: true };
      else if (body.state === 'end') patch = { ends_at: now };
      else return res.status(400).json({ error: 'bad_request' });
      if (body.state === 'resume' && !c?.starts_at) return res.status(409).json({ error: 'not_launched' });
      const { error: upErr } = await admin.from('reward_campaigns').update({ ...patch, updated_at: now }).eq('id', CAMPAIGN_ID);
      if (upErr) return res.status(409).json({ error: 'not_saved' });
      return res.status(200).json({ ok: true });
    }

    if (body.action === 'vinted_list') {
      return res.status(200).json({ listings: (await rpc(admin, 'campaign_vinted_listings', { p_campaign: CAMPAIGN_ID })) || [] });
    }

    if (body.action === 'vinted') {
      const raw = Array.isArray(body.results) ? body.results : null;
      if (!raw || !raw.length || raw.length > 500) return res.status(400).json({ error: 'bad_request' });
      const results = [];
      for (const r of raw) {
        const listingId = String(r?.listingId ?? '');
        if (!/^\d{1,15}$/.test(listingId) || !VINTED_STATUSES.has(r?.status)) return res.status(400).json({ error: 'bad_request' });
        results.push({ listingId: Number(listingId), status: r.status });
      }
      const summary = (await rpc(admin, 'campaign_vinted_apply', { p_campaign: CAMPAIGN_ID, p_results: results })) || {};
      const changes = summary.changes || [];
      if (changes.length) {
        await sendTeamAlert(teamVintedAlert({ changes, checked: summary.checked || 0, available: summary.available || 0 })).catch(() => {});
      }
      return res.status(200).json({ ok: true, checked: summary.checked || 0, changes, available: summary.available ?? null });
    }

    return res.status(400).json({ error: 'bad_request' });
  } catch (e) {
    console.error('[campaign-admin]', e?.message, e?.cause?.message || '');
    return res.status(500).json({ error: 'server_error' });
  }
}

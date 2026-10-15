/* global process */
/**
 * Team view of the free product campaign: people, feedback, referrals,
 * eligibility, spins, claims, addresses, inventory. Same gate as
 * /api/reviews-admin: the caller's email must be in ADMIN_EMAILS.
 *
 *   GET  /api/campaign-admin
 *   POST /api/campaign-admin { claimId, status, note? }   update fulfillment
 *
 * Inventory itself (which products, how many) is edited in the Supabase table
 * editor on public.campaign_rewards; see the PR description.
 */
import { verifyUser } from './_usageLimit.js';
import { CAMPAIGN_ID } from '../src/utils/campaignRules.js';

const STATUSES = new Set(['needs_address', 'ready_to_ship', 'shipped', 'delivered', 'canceled']);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isAdminEmail(email) {
  if (!email) return false;
  const allow = String(process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return allow.includes(String(email).trim().toLowerCase());
}

function headers(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

export default async function handler(req, res) {
  headers(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const { user, error, admin } = await verifyUser(req);
  if (!user || !admin) return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({ error: error || 'auth_required' });
  if (user.is_anonymous || !isAdminEmail(user.email)) return res.status(403).json({ error: 'forbidden' });

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'object' && req.body ? req.body : JSON.parse(req.body || '{}');
      if (!UUID_RE.test(String(body.claimId || '')) || !STATUSES.has(body.status)) return res.status(400).json({ error: 'bad_request' });
      const patch = { fulfillment_status: body.status, updated_at: new Date().toISOString() };
      if (typeof body.note === 'string') patch.fulfillment_note = body.note.slice(0, 500);
      if (body.status === 'shipped') patch.shipped_at = new Date().toISOString();
      const { error: upErr } = await admin.from('campaign_claims').update(patch).eq('id', body.claimId);
      if (upErr) throw upErr;
      return res.status(200).json({ ok: true });
    }

    const [overview, inventory, shipping, spins, campaign] = await Promise.all([
      admin.from('campaign_admin_overview').select('*').eq('campaign_id', CAMPAIGN_ID).order('referrals_verified', { ascending: false }),
      admin.from('campaign_rewards').select('id, product_id, inventory_total, inventory_claimed, inventory_remaining, is_active, product_catalog(name, brand, is_active)')
        .eq('campaign_id', CAMPAIGN_ID),
      admin.from('campaign_shipping').select('claim_id, full_name, address_line1, address_line2, city, state, postal_code, email'),
      admin.from('campaign_spins').select('product_id, outcome').eq('campaign_id', CAMPAIGN_ID).limit(50000),
      admin.from('campaigns').select('*').eq('id', CAMPAIGN_ID).maybeSingle(),
    ]);
    for (const r of [overview, inventory, shipping, spins, campaign]) if (r.error) throw r.error;

    const shipByClaim = new Map((shipping.data || []).map((s) => [s.claim_id, s]));
    const people = (overview.data || []).map((row) => ({ ...row, shipping: row.claim_id ? shipByClaim.get(row.claim_id) || null : null }));

    // Which products people pass on vs. keep.
    const byProduct = {};
    for (const s of spins.data || []) {
      const b = (byProduct[s.product_id] ||= { shown: 0, claimed: 0, sold_out: 0 });
      b.shown += 1;
      if (s.outcome === 'claimed') b.claimed += 1;
      if (s.outcome === 'sold_out') b.sold_out += 1;
    }

    const claims = people.filter((p) => p.claim_id);
    return res.status(200).json({
      campaign: campaign.data,
      totals: {
        people: people.length,
        verified: people.filter((p) => p.account_verified).length,
        feedbackComplete: people.filter((p) => p.feedback_like && p.feedback_friction && p.feedback_change).length,
        verifiedReferrals: people.reduce((n, p) => n + Number(p.referrals_verified || 0), 0),
        eligibleUnclaimed: people.filter((p) => p.eligible_now).length,
        claims: claims.length,
        avgSpinsBeforeClaim: claims.length ? Math.round((claims.reduce((n, p) => n + Number(p.spins || 0), 0) / claims.length) * 10) / 10 : null,
      },
      inventory: (inventory.data || []).map((r) => ({
        rewardId: r.id, productId: r.product_id, name: r.product_catalog?.name, brand: r.product_catalog?.brand,
        total: r.inventory_total, claimed: r.inventory_claimed, remaining: r.inventory_remaining,
        active: r.is_active && r.product_catalog?.is_active !== false,
        ...(byProduct[r.product_id] || { shown: 0, claimed: 0, sold_out: 0 }),
      })),
      people,
    });
  } catch (e) {
    console.error('[campaign-admin]', e?.message);
    return res.status(500).json({ error: 'server_error' });
  }
}

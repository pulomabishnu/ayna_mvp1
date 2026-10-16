/* global process */
/**
 * Admin-only Amazon review queue (/admin/amazon-review).
 *
 * GET  -> every Amazon offer a shopper can reach (product listing + each
 *         Ayna size), built from the live catalog, with the saved review.
 * POST -> save one review: exact product?, exact variant?, size/count seen,
 *         availability seen, image matches?, notes. Current state only, no
 *         history. No Amazon price is stored: Associates policy allows showing
 *         Amazon prices only from Creators API, so a person-read price could
 *         never be displayed.
 *
 * Gate: a valid Supabase session whose email is in ADMIN_EMAILS (fail closed).
 */
import { verifyUser } from './_usageLimit.js';
import { toClientProduct } from './products.js';
import { buildAmazonReviewRows } from '../src/commerce/amazonReview.js';

function isAdminEmail(email) {
  const allow = String(process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(email) && allow.includes(String(email).trim().toLowerCase());
}

function privateHeaders(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

const ASIN = /^[A-Z0-9]{10}$/;
const AVAIL = new Set(['AVAILABLE', 'OUT_OF_STOCK', 'UNAVAILABLE', 'UNKNOWN']);
const triBool = (v) => (v === true || v === false ? v : null);

/** Validates a POST body into a row for amazon_offer_reviews, or returns an error string. */
export function reviewRowFromBody(body, user) {
  const productId = String(body?.productId || '').trim();
  const variantId = String(body?.variantId || '').trim();
  const asin = String(body?.asin || '').trim().toUpperCase();
  if (!/^[a-z0-9][a-z0-9._-]{1,100}$/i.test(productId)) return { error: 'bad_product_id' };
  if (variantId.length > 100) return { error: 'bad_variant_id' };
  if (!ASIN.test(asin)) return { error: 'bad_asin' };
  const availability = body?.availabilitySeen ? String(body.availabilitySeen) : null;
  if (availability && !AVAIL.has(availability)) return { error: 'bad_availability' };
  if ('priceSeen' in (body || {}) || 'price' in (body || {})) return { error: 'amazon_price_not_stored' };
  return {
    row: {
      product_id: productId,
      ayna_variant_id: variantId,
      asin,
      exact_product: triBool(body?.exactProduct),
      exact_variant: triBool(body?.exactVariant),
      verified_size_count: body?.verifiedSizeCount ? String(body.verifiedSizeCount).slice(0, 200) : null,
      availability_seen: availability,
      image_matches: triBool(body?.imageMatches),
      notes: body?.notes ? String(body.notes).slice(0, 2000) : null,
      reviewed_by: user.id,
      reviewed_by_email: user.email || null,
      verification_method: 'human',
      reviewed_at: new Date().toISOString(),
    },
  };
}

export default async function handler(req, res) {
  privateHeaders(res);
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  const { user, error, admin } = await verifyUser(req);
  if (error || !user || !admin) return res.status(error === 'auth_required' || error === 'invalid_session' ? 401 : 503).json({ error: error || 'auth_required' });
  if (!isAdminEmail(user.email)) return res.status(403).json({ error: 'forbidden' });

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const parsed = reviewRowFromBody(body, user);
    if (parsed.error) return res.status(400).json({ error: parsed.error });
    const { error: upsertError } = await admin.from('amazon_offer_reviews').upsert(parsed.row, { onConflict: 'product_id,ayna_variant_id' });
    if (upsertError) return res.status(500).json({ error: 'save_failed' });
    return res.status(200).json({ ok: true, review: parsed.row });
  }

  const { data: catalog, error: catalogError } = await admin.from('product_catalog').select('*').eq('is_active', true);
  if (catalogError) return res.status(500).json({ error: 'catalog_unavailable' });
  const { rows, summary } = buildAmazonReviewRows((catalog || []).map(toClientProduct));
  const { data: reviews } = await admin.from('amazon_offer_reviews').select('*');
  const byKey = new Map((reviews || []).map((r) => [`${r.product_id}\u0000${r.ayna_variant_id}`, r]));
  const out = rows.map((r) => {
    const variantId = r.ayna_variant_id || '';
    return { ...r, ayna_variant_id: variantId, review: byKey.get(`${r.ayna_product_id}\u0000${variantId}`) || null };
  });
  return res.status(200).json({ rows: out, summary: { ...summary, groups: undefined, reviewed: out.filter((r) => r.review).length } });
}

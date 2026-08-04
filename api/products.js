/* global process */
/**
 * /api/products — serves the curated catalog from product_catalog.
 *
 * Replaces ~5,500 lines of product data that were bundled into the client, so
 * (a) the catalog is no longer downloaded by every visitor as part of the JS
 * bundle, and (b) a price or safety-note correction is a row update rather than
 * a code change and a redeploy.
 *
 * Read-only and public: this is product information, and Discovery is browsable
 * signed-out. Served with the anon key so RLS applies — the service-role key is
 * never needed for a public read.
 *
 * The rows are returned in the CLIENT's historical shape (camelCase, nested
 * safety object), so every existing consumer works unchanged.
 */
import { createClient } from '@supabase/supabase-js';

let _client = null;
function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  _client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return _client;
}

/** DB row -> the object shape the app has always consumed. */
function toClientProduct(row) {
  const p = {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.product_type,
    tags: row.tags || [],
    healthFunctions: row.health_functions || [],
    whereToBuy: row.where_to_buy || [],
    safety: row.safety || {},
    // Anything without a dedicated column was preserved here by the exporter
    // (ingredients, badges, verificationLinks, integrations, ...).
    ...(row.extra || {}),
  };
  if (row.brand) p.brand = row.brand;
  if (row.summary) p.summary = row.summary;
  if (row.price) p.price = row.price;
  if (row.image) p.image = row.image;
  if (row.url) p.url = row.url;
  if (row.where_to_buy_in_stock && Object.keys(row.where_to_buy_in_stock).length) {
    p.whereToBuyInStock = row.where_to_buy_in_stock;
  }
  if (row.doctor_opinion) p.doctorOpinion = row.doctor_opinion;
  if (row.community_review) p.communityReview = row.community_review;
  if (row.effectiveness) p.effectiveness = row.effectiveness;
  if (row.clinician_opinion_source) p.clinicianOpinionSource = row.clinician_opinion_source;
  if (row.clinician_attribution) p.clinicianAttribution = row.clinician_attribution;
  if (row.internal) p.internal = true;
  if (row.requires_prescription) p.requiresPrescription = true;
  if (row.user_rating !== null && row.user_rating !== undefined) p.userRating = Number(row.user_rating);
  // Provenance travels with the product so the UI can never present a
  // non-curated row with verified-clinician affordances.
  p.source = row.source || 'curated';
  return p;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const client = getClient();
  if (!client) {
    // The client falls back to its bundled copy on a non-200, so this degrades
    // to the pre-migration behaviour rather than an empty catalog.
    console.error('[products] Supabase env not configured');
    return res.status(503).json({ error: 'not_configured', products: [] });
  }

  try {
    const { data, error } = await client
      .from('product_catalog')
      .select('*')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error) throw new Error(error.message);

    const products = (data || []).map(toClientProduct);

    if (products.length === 0) {
      // An empty table almost certainly means "not seeded yet", which is very
      // different from "no products". Say so rather than serving an empty
      // catalog the client would render as a working, product-less app.
      console.error('[products] product_catalog is empty — run supabase/seed/product_catalog.sql');
      return res.status(503).json({ error: 'catalog_empty', products: [] });
    }

    // Catalog changes are rare and every visitor needs it; this is the single
    // highest-value cache in the app.
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ products, count: products.length, source: 'product_catalog' });
  } catch (e) {
    console.error('[products] query failed:', e?.message);
    return res.status(502).json({ error: 'query_failed', products: [] });
  }
}

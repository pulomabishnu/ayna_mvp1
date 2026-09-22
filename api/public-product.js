/* global process */

/**
 * Resolve a public /product/:slug page for products that are not available in
 * the recipient's local catalog.
 *
 * IMPORTANT PRIVACY RULE:
 * user_ecosystems contains user-specific recommendation metadata. This route
 * never returns that row or its private product id directly. It creates a
 * strict public product snapshot containing product facts only.
 */

import { createClient } from '@supabase/supabase-js';
import { rateLimit, getClientIp } from './_rateLimit.js';
import { isPublishable } from './products.js';

let _admin = null;

function getAdmin() {
  if (_admin) return _admin;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _admin;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 100);
}

function publicProductSlug(product) {
  const nameSlug = slugify(product?.name);
  const brandSlug = slugify(product?.brand);

  if (!nameSlug) return '';

  if (!brandSlug || nameSlug === brandSlug || nameSlug.startsWith(`${brandSlug}-`)) {
    return nameSlug;
  }

  return `${brandSlug}-${nameSlug}`.slice(0, 120);
}

function cleanSlug(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  const slug = String(raw || '').trim().toLowerCase();

  if (!slug || slug.length > 120) return '';
  if (!/^[a-z0-9-]+$/.test(slug)) return '';

  return slug;
}

function searchPattern(slug) {
  // The public slug may begin with a brand that is not part of product_name.
  // Use only the final slug token to gather candidates, then perform the
  // exact brand-aware slug comparison in JavaScript below.
  const tokens = slug.split('-').filter(Boolean);
  const lastToken = tokens[tokens.length - 1] || '';
  return lastToken ? `%${lastToken}%` : '';
}

function catalogRowToClient(row) {
  if (!row) return null;

  const product = {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.product_type,
    tags: row.tags || [],
    healthFunctions: row.health_functions || [],
    whereToBuy: row.where_to_buy || [],
    safety: row.safety || {},
    ...(row.extra || {}),
  };

  if (row.brand) product.brand = row.brand;
  if (row.summary) product.summary = row.summary;
  if (row.price) product.price = row.price;
  if (row.image) product.image = row.image;
  if (row.url) product.url = row.url;

  if (row.where_to_buy_in_stock && Object.keys(row.where_to_buy_in_stock).length) {
    product.whereToBuyInStock = row.where_to_buy_in_stock;
  }

  if (row.doctor_opinion) product.doctorOpinion = row.doctor_opinion;
  if (row.community_review) product.communityReview = row.community_review;
  if (row.effectiveness) product.effectiveness = row.effectiveness;
  if (row.clinician_opinion_source) product.clinicianOpinionSource = row.clinician_opinion_source;
  if (row.clinician_attribution) product.clinicianAttribution = row.clinician_attribution;
  if (row.internal) product.internal = true;
  if (row.requires_prescription) product.requiresPrescription = true;

  if (row.user_rating !== null && row.user_rating !== undefined) {
    product.userRating = Number(row.user_rating);
  }

  product.source = row.source || 'curated';

  return product;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const slug = cleanSlug(req.query.slug);
  if (!slug) return res.status(400).json({ error: 'invalid_slug' });

  const rl = await rateLimit(`public-product:${getClientIp(req)}`, {
    max: 120,
    windowSec: 60,
    failClosed: false,
  });

  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfterSec || 60));
    return res.status(429).json({ error: 'rate_limited' });
  }

  const admin = getAdmin();
  if (!admin) {
    console.error('[public-product] Supabase service role is not configured');
    return res.status(503).json({ error: 'not_configured' });
  }

  const pattern = searchPattern(slug);

  try {
    // First check the public catalog. This also covers approved DB products
    // that may not yet exist in the bundled fallback catalog.
    const { data: catalogRows, error: catalogError } = await admin
      .from('product_catalog')
      .select('*')
      .eq('is_active', true)
      .ilike('name', pattern)
      .limit(1000);

    if (catalogError) throw new Error(catalogError.message);

    const catalogRow = (catalogRows || []).filter(isPublishable).find(
      (row) => publicProductSlug(row) === slug || slugify(row.name) === slug
    );

    if (catalogRow) {
      res.setHeader(
        'Cache-Control',
        'public, s-maxage=3600, stale-while-revalidate=86400'
      );

      return res.status(200).json({
        product: catalogRowToClient(catalogRow),
        source: 'catalog',
      });
    }

    // PRODUCT INTEGRITY (2026-09-22 audit): public product pages resolve
    // ONLY against the reviewed catalog. The old fallback rebuilt a listing
    // from another user's user_ecosystems.product_data snapshot, which could
    // contain model-generated names/URLs/prices that were never in the
    // catalog (and leaked data derived from a private ecosystem).
    return res.status(404).json({ error: 'not_found' });
  } catch (error) {
    console.error('[public-product] lookup failed:', error?.message);
    return res.status(502).json({ error: 'query_failed' });
  }
}

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

function cleanSafety(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const out = {};
  const allowed = [
    'fdaStatus',
    'materials',
    'recalls',
    'allergens',
    'sideEffects',
    'opinionAlerts',
  ];

  for (const key of allowed) {
    if (value[key] !== undefined && value[key] !== null) out[key] = value[key];
  }

  return out;
}

function copyPublicFields(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const name = String(raw.name || '').trim();
  if (!name) return null;

  const slug = publicProductSlug(raw) || slugify(name);

  // Never expose the sender's generated/private product ID.
  const out = {
    id: `shared-${slug}`,
    name,
    source: 'shared',
  };

  const simpleFields = [
    'brand',
    'category',
    'type',
    'summary',
    'price',
    'image',
    'url',
    'website',
    'productUrl',
    'buyUrl',
    'purchaseUrl',
    'affiliateUrl',
    'faqUrl',
    'doctorOpinion',
    'communityReview',
    'effectiveness',
    'clinicianOpinionSource',
    'clinicianAttribution',
    'ingredients',
    'platform',
  ];

  for (const key of simpleFields) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') {
      out[key] = raw[key];
    }
  }

  const arrayFields = ['whereToBuy', 'badges', 'integrations'];
  for (const key of arrayFields) {
    if (Array.isArray(raw[key])) out[key] = raw[key];
  }

  const objectFields = [
    'whereToBuyLinks',
    'whereToBuyInStock',
    'verificationLinks',
  ];

  for (const key of objectFields) {
    if (raw[key] && typeof raw[key] === 'object' && !Array.isArray(raw[key])) {
      out[key] = raw[key];
    }
  }

  out.safety = cleanSafety(raw.safety);

  if (raw.requiresPrescription === true) out.requiresPrescription = true;
  if (raw.userRating !== undefined && raw.userRating !== null) {
    const rating = Number(raw.userRating);
    if (Number.isFinite(rating)) out.userRating = rating;
  }

  // These flags tell the UI not to present generated content as curated
  // clinician-verified catalog content. They contain no user information.
  if (raw.llmGenerated === true) out.llmGenerated = true;
  if (raw.intakeGenerated === true) out.intakeGenerated = true;

  return out;
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

    const catalogRow = (catalogRows || []).find(
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

    // Generated/custom ecosystem products live only in a user's ecosystem.
    //
    // Backward compatibility: first try the historical private product ID so
    // old shared/bookmarked /product/<id> links continue to resolve. We never
    // return product_id to the browser.
    let ecosystemRow = null;

    const { data: legacyRows, error: legacyError } = await admin
      .from('user_ecosystems')
      .select('product_name, product_data, updated_at')
      .eq('product_id', slug)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (legacyError) throw new Error(legacyError.message);

    ecosystemRow = legacyRows?.[0] || null;

    // New public links use a clean name slug instead of a private generated ID.
    if (!ecosystemRow) {
      const { data: ecosystemRows, error: ecosystemError } = await admin
        .from('user_ecosystems')
        .select('product_name, product_data, updated_at')
        .ilike('product_name', pattern)
        .order('updated_at', { ascending: false })
        .limit(1000);

      if (ecosystemError) throw new Error(ecosystemError.message);

      ecosystemRow = (ecosystemRows || []).find((row) => {
        const raw = {
          ...(row.product_data || {}),
          name: row.product_name || row.product_data?.name,
        };

        return publicProductSlug(raw) === slug || slugify(raw.name) === slug;
      });
    }

    if (!ecosystemRow) {
      return res.status(404).json({ error: 'not_found' });
    }

    const product = copyPublicFields(ecosystemRow.product_data || {
      name: ecosystemRow.product_name,
    });

    if (!product) return res.status(404).json({ error: 'not_found' });

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600'
    );

    return res.status(200).json({
      product,
      source: 'shared',
    });
  } catch (error) {
    console.error('[public-product] lookup failed:', error?.message);
    return res.status(502).json({ error: 'query_failed' });
  }
}

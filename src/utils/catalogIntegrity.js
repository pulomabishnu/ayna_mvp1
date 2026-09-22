/**
 * PRODUCT INTEGRITY — client-side last line of defense (2026-09-22 audit).
 *
 * The server (api/_catalogGrounding.js) already rebuilds every AI-returned
 * product from the reviewed catalog. This module applies the same rule to
 * everything the CLIENT can surface that did not just come from that
 * server path: session caches, saved user_ecosystems snapshots written by
 * older builds (which stored free-form model output), and shared/route
 * lookups. A product is shown only if it resolves to a catalog record;
 * catalog facts always win over whatever was cached/saved.
 */
import { ALL_PRODUCTS } from '../data/products.js';
import { getLoadedCatalog } from './productCatalog.js';

// Per-user / per-recommendation fields that are NOT product facts and may
// ride along on top of the catalog record.
const PERSONAL_FIELDS = [
  'whyItWorks', 'considerations', 'matchExplanation',
  '_llmConcern', '_userSwapped', 'intakeGenerated',
  'aynaMatch', 'aynaMatchPercent', 'matchPercent', 'matchPercentage',
  'addedAt', 'stage',
];

function indexOf(list, map) {
  for (const p of list || []) {
    if (p?.id) map.set(String(p.id).toLowerCase(), p);
  }
  return map;
}

function catalogMap() {
  const map = new Map();
  indexOf(ALL_PRODUCTS, map);
  indexOf(getLoadedCatalog(), map);
  return map;
}

/** The reviewed catalog record for a product-ish object, or null. */
export function findCatalogRecord(product, map = catalogMap()) {
  if (!product || typeof product !== 'object') return null;
  for (const raw of [product.catalogId, product.id]) {
    const id = String(raw || '').trim().toLowerCase();
    if (id && map.has(id)) return map.get(id);
  }
  return null;
}

/**
 * Catalog record + personal fields, or null when the product is not in the
 * catalog. Products stamped catalogVerified by the server are kept even if
 * the DB-backed part of the catalog hasn't loaded in this tab yet.
 */
export function toCatalogProduct(product, map = catalogMap()) {
  const record = findCatalogRecord(product, map);
  if (!record) {
    if (product?.catalogVerified === true && product?.catalogId && product?.name) {
      const { llmGenerated: _drop, ...rest } = product;
      return rest;
    }
    return null;
  }
  const out = { ...record, catalogId: record.id, catalogVerified: true };
  for (const key of PERSONAL_FIELDS) {
    if (product[key] !== undefined && product[key] !== null && product[key] !== '') out[key] = product[key];
  }
  return out;
}

/** Filter a { id: product } map down to catalog-backed products (ids re-keyed to catalog ids). */
export function filterProductMapToCatalog(productMap) {
  const map = catalogMap();
  const out = {};
  for (const product of Object.values(productMap || {})) {
    const safe = toCatalogProduct(product, map);
    if (safe) out[safe.id] = safe;
  }
  return out;
}

export function filterProductListToCatalog(list) {
  const map = catalogMap();
  const seen = new Set();
  const out = [];
  for (const product of Array.isArray(list) ? list : []) {
    const safe = toCatalogProduct(product, map);
    if (safe && !seen.has(safe.id)) {
      seen.add(safe.id);
      out.push(safe);
    }
  }
  return out;
}

/** Same shape as /api/llm-recommendations' `recommendations`, catalog-only. */
export function filterRecommendationsToCatalog(recommendations) {
  const map = catalogMap();
  return (Array.isArray(recommendations) ? recommendations : [])
    .map((entry) => {
      const tiers = (Array.isArray(entry?.tiers) ? entry.tiers : [])
        .map((tier) => {
          const product = toCatalogProduct(tier?.product, map);
          if (!product) return null;
          const alternatives = (Array.isArray(tier?.alternatives) ? tier.alternatives : [])
            .map((alt) => toCatalogProduct(alt, map))
            .filter((alt) => alt && alt.id !== product.id);
          return { ...tier, product, alternatives };
        })
        .filter(Boolean);
      if (!tiers.length) return null;
      return { ...entry, tiers, topProduct: tiers[0].product, alternatives: tiers[0].alternatives };
    })
    .filter(Boolean);
}

// Published product feed shared by Shop and ALL personalized matching surfaces.
// Pure registry: no React, network, storage or catalog module imports.
// The /api/products server filters unpublished discovery rows before delivery.
let published = null;
let revision = 0;
const subscribers = new Set();
export function publishProductCatalog(products) {
  if (!Array.isArray(products) || !products.length) return false;
  const unique = new Map();
  for (const product of products) {
    if (!product || typeof product.id !== 'string' || !product.id.trim() || !product.name) continue;
    // A cached or API row marked hidden/inactive should never enter matching.
    if (product.hidden || product.is_active === false || product.recommendable === false) continue;
    // Defense in depth: old cached unapproved discovery records do not qualify.
    if (product.source === 'discovered' && product.reviewStatus !== 'approved'
      && !product.discoveryMeta?.humanReviewedAt) continue;
    unique.set(product.id, product);
  }
  if (!unique.size) return false;
  published = [...unique.values()];
  revision += 1;
  for (const cb of subscribers) cb(published, revision);
  return true;
}
export function getPublishedProducts() { return published; }
export function publishedCatalogRevision() { return revision; }
export function subscribePublishedProducts(cb) {
  subscribers.add(cb);
  if (published) cb(published, revision);
  return () => subscribers.delete(cb);
}
/** Bundled records are kept as the safety-reviewed base for duplicate IDs.
 * Only genuinely new, approved server listings are appended. 
 * A DB-only listing must still pass the normal safety, relevance,
 * evidence and eligibility gates before becoming a personalized pick. */
export function mergePublishedWithBundled(bundled, incoming) {
  const ids = new Set(bundled.map(p=>p.id));
  const out = [...bundled];
  for (const p of incoming || []) if (p?.id && !ids.has(p.id)) {
    ids.add(p.id);
    out.push(p);
  }
  return out;
}

/**
 * Pure helpers for the Saved / Wishlist page (SavedForLater.jsx), ported from
 * the mobile app's SavedScreen. Every badge and filter is computed from real
 * state already in the app: ecosystem membership (myProducts) and the
 * product's own catalog safety.recalls text, run through the same
 * hasFlaggedRecall check the product page's Safety note uses.
 */
import { getProductById } from '../data/products';
import { hasFlaggedRecall } from './productSafetyAlert';

export const SAVED_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'eco', label: 'In ecosystem' },
  { key: 'new', label: 'Not tried' },
  { key: 'flag', label: 'Flagged' },
];

/**
 * Saved items are persisted in a compact shape (ecosystemStore.js
 * compactProduct) without `safety` / `tags`, which the match engine and the
 * recall check need. Re-attach the full catalog entry when one exists; the
 * saved copy's own fields still win (image, price the user saw, etc.).
 */
export function resolveSavedProduct(item, lookup = getProductById) {
  if (!item || typeof item !== 'object') return item;
  const catalog = lookup(item.catalogId || item.id) || (item.catalogId ? lookup(item.id) : null);
  if (!catalog) return item;
  return { ...catalog, ...item };
}

/** Ids in the user's ecosystem, whether passed as an id-keyed object or an array. */
export function ecosystemIdSet(myProducts) {
  if (!myProducts) return new Set();
  if (Array.isArray(myProducts)) return new Set(myProducts.map((p) => p?.id).filter(Boolean));
  return new Set(Object.keys(myProducts).filter((id) => myProducts[id]));
}

export function isFlaggedProduct(product) {
  return hasFlaggedRecall(product?.safety?.recalls);
}

/**
 * Status for one saved product. `inEcosystem` and `flagged` are independent:
 * a flagged product can also be in the ecosystem, and should show up under
 * both filters rather than disappearing from "In ecosystem".
 */
export function savedItemStatus(product, ecoIds) {
  const inEcosystem = !!product?.id && ecoIds.has(product.id);
  return {
    inEcosystem,
    flagged: isFlaggedProduct(product),
    status: inEcosystem ? 'eco' : 'new',
  };
}

export function matchesSavedFilter(entry, filter) {
  switch (filter) {
    case 'eco': return entry.inEcosystem;
    case 'new': return !entry.inEcosystem;
    case 'flag': return entry.flagged;
    default: return true;
  }
}

export function countSavedFilters(entries) {
  const counts = { all: 0, eco: 0, new: 0, flag: 0 };
  for (const entry of entries || []) {
    counts.all += 1;
    if (entry.inEcosystem) counts.eco += 1;
    else counts.new += 1;
    if (entry.flagged) counts.flag += 1;
  }
  return counts;
}

/**
 * Builds the decorated list once: [{ item, product, inEcosystem, flagged, status }].
 * `item` is the saved row as stored (what callbacks receive, to keep the
 * existing toggle contract); `product` is the catalog-resolved copy used for
 * display, matching, and the recall check.
 */
export function buildSavedEntries(savedProducts, myProducts, lookup = getProductById) {
  const ecoIds = ecosystemIdSet(myProducts);
  return Object.values(savedProducts || {})
    .filter((item) => item && item.id)
    .map((item) => {
      const product = resolveSavedProduct(item, lookup);
      return { item, product, ...savedItemStatus(product, ecoIds) };
    });
}

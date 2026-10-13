/**
 * Product passport: public API.
 *
 *   getPassport(product)         full passport (memoized per product object)
 *   getCompleteness(product)     { overall, sections, missing, missingCritical }
 *   getPassportFacts(product)    flat list of facts: { path, label, value, known, source, source_url, verified_at, status, reviewed }
 *   getCorrections(product)      reviewer corrections: { field, catalog, source_says, source_url }
 *   getPassportDates(product)    { first_verified, last_verified, next_review_due }
 *   getListingStatus(product)    { state, offShelf, label, notice } for shop listings
 *   matchCeiling(product)        the highest match percent the passport supports
 *
 * The matching engine (src/matching/productProfile.js) reads the passport for
 * status (recalled / discontinued / unavailable never recommended), safety
 * unknowns, canonical ingredient ids, claim-level evidence and freshness.
 * Completeness and freshness only lower the engine's confidence number; the
 * completeness cap (matchCeiling) stays off until passports are reviewed.
 */
import { buildPassport, passportFacts } from './build.js';
import { OFF_SHELF_STATUSES } from './schema.js';

export * from './schema.js';
export {
  buildPassport, collectSources, evidenceTypeFor, classifyRoute, clinicianReviewFlags, computeCompleteness, freshnessOf, passportFacts,
} from './build.js';
export {
  canonicalizeIngredient, parseIngredients, ingredientIds, listedIngredientIds, classesForIds, getIngredient, INGREDIENTS,
} from './ingredients.js';
export { lintText, lintProductCopy, WORDING_RULES } from './wording.js';
export { LINK_STATUS, linkRecord, linkStateFor } from './linkStatus.js';

const cache = new WeakMap();

export function getPassport(product) {
  if (!product || typeof product !== 'object') return null;
  if (cache.has(product)) return cache.get(product);
  const passport = buildPassport(product);
  cache.set(product, passport);
  return passport;
}

/**
 * Tests and previews only: use this passport (or null for "no passport") for
 * this exact product object instead of building one from the catalog.
 */
export function primePassport(product, passport) {
  if (product && typeof product === 'object') cache.set(product, passport);
  return passport;
}

export function getCompleteness(product) {
  return getPassport(product)?.completeness || null;
}

/** Every fact on the passport with its source and source_url (PDP "Sources", audit page). */
export function getPassportFacts(product) {
  return passportFacts(getPassport(product));
}

/** Corrections a reviewer found between the catalog and a real source. */
export function getCorrections(product) {
  return getPassport(product)?.corrections || [];
}

export function getPassportDates(product) {
  return getPassport(product)?.dates || { first_verified: null, last_verified: null, next_review_due: null };
}

const LISTING_NOTICE = {
  recalled: { label: 'Recalled', notice: 'This product has an active recall. We do not recommend it.' },
  discontinued: { label: 'Discontinued', notice: 'This product has been discontinued. We no longer recommend it.' },
  unavailable: { label: 'Unavailable', notice: 'We could not find this product for sale right now. We do not recommend it until it is back.' },
};

/**
 * How a shop listing should treat this product. offShelf products are never
 * recommended or put on shelves; Shop may still list them with `notice`.
 */
export function getListingStatus(product) {
  const p = getPassport(product);
  const state = p?.status || 'needs_review';
  const offShelf = OFF_SHELF_STATUSES.includes(state);
  return { state, offShelf, label: offShelf ? LISTING_NOTICE[state].label : null, notice: offShelf ? LISTING_NOTICE[state].notice : null };
}

/**
 * Off until the passports are reviewed: turning it on today would cap the
 * whole catalog, because no product has a verified passport yet. Recall,
 * discontinued and unavailable states apply regardless (through the engine's
 * eligibility, not this cap).
 */
export const PASSPORT_GATE_ENABLED = false;

/** Engine tiers: excellent 80+, strong 65+. */
export function matchCeiling(product) {
  const p = getPassport(product);
  if (!p) return 100;
  if (OFF_SHELF_STATUSES.includes(p.status)) return 0;
  if (p.completeness.missingCritical.length > 0) return 79; // no "excellent" with critical gaps
  if (p.completeness.overall < 60) return 64; // no "strong" when we barely know the product
  return 100;
}

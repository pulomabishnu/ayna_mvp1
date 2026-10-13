/**
 * Product passport: public API.
 *
 *   getPassport(product)     full passport (memoized per product object)
 *   getCompleteness(product) { overall, sections, missing, missingCritical }
 *   matchCeiling(product)    the highest match percent the passport supports
 *
 * The matching engine (src/matching) does not read this yet; see the report
 * for the proposed wiring. Nothing here changes a score on its own.
 */
import { buildPassport } from './build.js';

export * from './schema.js';
export { buildPassport, collectSources, evidenceTypeFor, classifyRoute, clinicianReviewFlags, computeCompleteness } from './build.js';
export { canonicalizeIngredient, parseIngredients, ingredientIds, INGREDIENTS } from './ingredients.js';
export { lintText, lintProductCopy, WORDING_RULES } from './wording.js';

const cache = new WeakMap();

export function getPassport(product) {
  if (!product || typeof product !== 'object') return null;
  if (cache.has(product)) return cache.get(product);
  const passport = buildPassport(product);
  cache.set(product, passport);
  return passport;
}

export function getCompleteness(product) {
  return getPassport(product)?.completeness || null;
}

/**
 * Off until the passports are reviewed: turning it on today would cap the
 * whole catalog, because no product has a verified passport yet.
 */
export const PASSPORT_GATE_ENABLED = false;

/** Engine tiers: excellent 80+, strong 65+. */
export function matchCeiling(product) {
  const p = getPassport(product);
  if (!p) return 100;
  if (p.status === 'recalled' || p.status === 'discontinued') return 0;
  if (p.completeness.missingCritical.length > 0) return 79; // no "excellent" with critical gaps
  if (p.completeness.overall < 60) return 64; // no "strong" when we barely know the product
  return 100;
}

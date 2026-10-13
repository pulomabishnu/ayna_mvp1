// ayna matching engine: public API.
//
// Pure functions shared by the app and the website. No UI, no network.
// The engine notes (ENGINE.md, shared with the team) document the rule
// tables, the scoring formula, catalog data gaps and integration steps.
//
// Core:
//   buildUserProfile(intake, { behavior, catalog })   layered user profile
//   buildProductProfile(product)                       structured product record (cached)
//   scoreProductForNeed(product, userProfile, needId)  one need
//   scoreProduct(product, userProfile)                 every selected need
//   buildEcosystem(userProfile, products, opts)        shelves per need
//   canonicalize(text), normalizeMedication(text), extractFreeText(text)
//
// Adapters for existing callers (step 2 integration):
//   getNeedMatches(product, intake, opts)    per-need results, best first
//   getBestNeedMatch(product, intake, opts)  top need result or null
//   explainProduct(product, intake, opts)    headline + explanations + cautions

import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { scoreProduct, scoreProductForNeed } from './score.js';

export { buildUserProfile, resolveCatalogProduct } from './userProfile.js';
export {
  buildProductProfile, clearProductProfileCache, parsePrice, productSimilarity, RELEVANCE_RULES, LEVEL, CONTEXT_BONUS, BROAD_MARKETING,
  ATTRIBUTE_INGREDIENTS, CLAIM_STRENGTH, INGREDIENT_LEVEL_WEIGHT,
} from './productProfile.js';
export {
  scoreProduct, scoreProductForNeed, evaluateSafety, computeAccess, budgetFit, tierFor, confidenceLevel, resolveRelevance, healthSentence, evidenceFor,
  requiredFieldsFor, REQUIRED_FIELD_TEXT, PRODUCT_INFO_TEXT, PASSPORT_COMPLETENESS_FLOOR, clinicalForNeed, DIMENSION_WEIGHTS, WEIGHTS, TIERS, PREFERENCE_SPAN,
} from './score.js';
export { buildEcosystem, sortResults, brandCategory, diversify, assignRoles, compareResults, qualityPrior } from './ecosystem.js';
export {
  canonicalize, canonicalNeedId, NEEDS, NEED_BY_ID, NEED_POLICY, NEED_KINDS, CONTEXTS, needIdForOption, needKind, CONDITIONS, LIFE_STAGES, FORMATS, VALUES, ALLERGENS, LEAVE_OUT,
} from './ontology.js';
export { normalizeMedication, checkMedicationInteractions, INTERACTION_TABLE } from './medications.js';
export { extractFreeText, summarizeFreeText } from './freeText.js';

// Cache user profiles per intake object (intake objects are replaced, not mutated, by the stores).
const PROFILE_CACHE = new WeakMap();
function profileFor(intake, opts = {}) {
  if (intake && intake.healthIntent && intake.safety) return intake; // already a profile
  if (intake && typeof intake === 'object' && !opts.behavior && !opts.noCache) {
    const hit = PROFILE_CACHE.get(intake);
    if (hit && hit.catalog === opts.catalog) return hit.profile;
    const profile = buildUserProfile(intake, opts);
    PROFILE_CACHE.set(intake, { profile, catalog: opts.catalog });
    return profile;
  }
  return buildUserProfile(intake || {}, opts);
}

/**
 * Per-need match results for one product, best first. Needs where the
 * product has no relevance are omitted.
 * @param {object} product catalog product
 * @param {object} intake intake state, snapshot, quizAnswers, or a userProfile
 * @param {{ behavior?: object, catalog?: object[] }} [opts]
 */
export function getNeedMatches(product, intake, opts = {}) {
  const up = profileFor(intake, opts);
  return scoreProduct(product, up).needs.filter((r) => r.relevance > 0);
}

/** The single best need match for a product, or null when it fits none of her needs. */
export function getBestNeedMatch(product, intake, opts = {}) {
  return getNeedMatches(product, intake, opts)[0] || null;
}

/**
 * User-facing explanation for a product card.
 * @returns {{ headline: string|null, needId: string|null, score: number, tier: string, explanations: string[],
 *   cautions: string[], eligible: boolean, excludedBecause: string[], confidence: number, access: object, careFirst: boolean, careProminent: boolean }}
 */
export function explainProduct(product, intake, opts = {}) {
  const up = profileFor(intake, opts);
  const all = scoreProduct(product, up);
  const best = all.best || (opts.needId ? scoreProductForNeed(product, up, opts.needId) : null);
  return {
    headline: best ? best.explanations[0] || null : null,
    needId: best ? best.needId : null,
    score: best ? best.score : 0,
    tier: best ? best.tier : 'browse',
    explanations: best ? best.explanations : [],
    cautions: all.safety.cautions.map((c) => c.text),
    eligible: all.safety.eligible,
    excludedBecause: all.safety.reasons.map((r) => r.text),
    confidence: best ? best.confidence : all.safety.confidence,
    confidenceLevel: best ? best.confidenceLevel : 'limited',
    eligibility: best ? best.eligibility : all.safety.eligible ? (all.safety.restricted ? 'restricted' : 'eligible') : 'excluded',
    access: all.access,
    careFirst: up.safety.careFirst,
    careProminent: best ? best.careProminent : up.safety.careProminent,
  };
}

// Convenience for callers that only need the profile for one product.
export function productProfileFor(product) { return buildProductProfile(product); }

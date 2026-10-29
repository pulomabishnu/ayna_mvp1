// Eligibility, the step between catalog ingestion and matching (team
// direction sections 14 and 60, Oct 24):
//
//   catalog ingestion -> validation -> eligibility -> matching
//
// Two separate gates, each with a reason a person can read:
//
// 1. recommendationEligibility(product): catalog side, the same for everyone.
//    A product can be in the catalog (Shop, search, its own page) and still
//    not be something ayna recommends on its own: accessories and refills for
//    another product, and listings that failed validation. These never enter
//    personalized recommendations (For you, My Ecosystem, the Rundown match
//    card, Ask's top match, alternatives). Their page still shows her match.
//
// 2. lifeStageBlock(pp, up) / lifeStageNeedBlock(rel, up, needId): her side,
//    run before any preference is looked at. Someone who has no menstrual
//    cycle now (menopause, post-menopause, pregnancy) never gets a product
//    that only works for someone who has one, as if she did (Oct 19 focus
//    group: a menopausal user was shown a period tracker).
//
// Nothing here reads partner, price or commission fields.
import { CYCLE_TRACKING_RULES, buildProductProfile } from './productProfile.js';
import { isCyclePremisedNeed, MENSTRUAL_PRODUCT_NEEDS, isAfterMenopauseStage } from './ontology.js';
import { stageScopeFor } from '../data/matching/stageScope.js';

// ─── 1. Catalog recommendation eligibility ──────────────────────────────────
// Accessories, refills and add-ons: useful next to the product they belong
// to, never a recommendation on their own.
const ACCESSORY_NAME = /\b(refills?|extenders?|shoe covers?|kneeling pad|replacement (?:heads?|parts?|pads?)|applicator refills?)\b/i;
const ACCESSORY_CATEGORIES = new Set(['cup-steamer']);
// Minimum facts a listing needs before ayna can recommend it.
const hasText = (v) => typeof v === 'string' ? v.trim().length > 0 : v != null;

/**
 * @param {object} product raw catalog product
 * @param {object} [pp] its buildProductProfile() result, when at hand (passport QA)
 * @returns {{ eligible: boolean, code: string|null, reason: string|null }}
 */
export function recommendationEligibility(product, pp = null) {
  if (!product || typeof product !== 'object') return { eligible: false, code: 'not_a_product', reason: 'Not a catalog product' };
  // Validation recorded at ingestion (scripts set validation.status or qaStatus).
  const v = product.validation?.status || product.qaStatus || null;
  if (v === 'failed' || v === 'rejected') return { eligible: false, code: 'failed_validation', reason: 'This listing did not pass our catalog checks yet' };
  // Passport review status (src/data/passport/schema.js QA_STATUS) is NOT a
  // gate: 'needs_correction' marks wording fixes in progress on 88 of 281
  // listings (Oct 24), not a failed listing. Only an explicit rejection is.
  if (pp?.passport?.qa === 'rejected') return { eligible: false, code: 'failed_validation', reason: 'This listing did not pass our catalog checks yet' };
  if (product.recommendable === false) return { eligible: false, code: 'not_recommended', reason: product.notRecommendedReason || 'Listed in the catalog, not recommended on its own' };
  const missing = [];
  if (!hasText(product.name)) missing.push('name');
  if (!hasText(product.category)) missing.push('category');
  if (!hasText(product.whereToBuy) && !hasText(product.url) && !hasText(product.productUrl) && !hasText(product.website) && !(Array.isArray(product.whereToBuyLinks) && product.whereToBuyLinks.length)) missing.push('where to get it');
  if (!(Array.isArray(product.healthFunctions) && product.healthFunctions.length) && !(Array.isArray(product.tags) && product.tags.length)) missing.push('what it is for');
  if (missing.length) return { eligible: false, code: 'failed_validation', reason: `Missing ${missing.join(', ')}`, missing };
  const tags = Array.isArray(product.tags) ? product.tags.map((t) => String(t).toLowerCase()) : [];
  if (ACCESSORY_CATEGORIES.has(String(product.category || '').toLowerCase()) || tags.includes('accessory') || ACCESSORY_NAME.test(String(product.name || ''))) {
    return { eligible: false, code: 'accessory', reason: 'An accessory or refill for another product, so not a recommendation on its own' };
  }
  return { eligible: true, code: null, reason: null };
}

const ELIGIBILITY_CACHE = new WeakMap();
/** Cached recommendationEligibility(product).eligible. */
export function isRecommendable(product, pp = null) {
  if (!product || typeof product !== 'object') return false;
  let hit = ELIGIBILITY_CACHE.get(product);
  if (!hit) { hit = recommendationEligibility(product, pp || buildProductProfile(product)); ELIGIBILITY_CACHE.set(product, hit); }
  return hit.eligible;
}

/** Every catalog product the gate keeps out of personalized recommendations, with why. */
export function recommendationGateReport(products = []) {
  return (products || []).map((p) => ({ id: p?.id, name: p?.name, ...recommendationEligibility(p, p ? buildProductProfile(p) : null) })).filter((r) => !r.eligible);
}

// ─── 2. Life-stage eligibility ──────────────────────────────────────────────
// Categories whose whole job is tracking or testing a menstrual cycle when
// their relevance comes from a cycle-tracking or ovulation-testing rule.
const CYCLE_TOOL_CATEGORIES = new Set(['tracker', 'app', 'diagnostics', 'contraception']);

/** True when the product is a cycle tracker or an ovulation / fertility test. */
export function isCycleTrackingProduct(pp) {
  if (!pp || !CYCLE_TOOL_CATEGORIES.has(String(pp.category || '').toLowerCase())) return false;
  return Object.values(pp.health_need_relevance || {}).some((e) => CYCLE_TRACKING_RULES.has(e?.rule) && (e.score > 0 || (e.contextual || []).length));
}

// 'paused' (no periods right now, cause not said) counts too: a cycle
// tracker or ovulation test has nothing to track (audit finding B).
const noCycle = (up) => ['none', 'paused'].includes(up?.physiology?.menstruation);

export const LIFE_STAGE_TEXT = {
  no_cycle_tracking: 'Built around tracking a menstrual cycle, and you told us you do not get periods now',
};

/**
 * Stage-scoped products (src/data/matching/stageScope.js). From her answers
 * only, never her age (audit finding A).
 * @returns {null | { block: {code,text} } | { hold: 'life_stage' | 'confirm_life_stage' }}
 */
export function stageScopeCheck(pp, up) {
  const scope = stageScopeFor(pp?.product_id);
  if (!scope) return null;
  const stages = up?.physiology?.lifeStages || [];
  const breastfeeding = up?.safety?.breastfeeding === 'yes';
  const mine = new Set([...stages, ...(breastfeeding ? ['breastfeeding'] : [])]);
  if (scope.stages.some((st) => mine.has(st))) return null;
  if (!mine.size) return { hold: 'life_stage' };
  if (scope.ask.some((st) => mine.has(st))) return { hold: 'confirm_life_stage' };
  return { block: { code: 'life_stage_out_of_scope', text: `Made for ${scope.phrase}, which is not the life stage you shared` } };
}

/**
 * Product-level life-stage gate, read by evaluateSafety (so it runs before
 * any scoring, on every surface). null when the product is fine for her.
 */
export function lifeStageBlock(pp, up) {
  if (noCycle(up) && isCycleTrackingProduct(pp)) return { code: 'life_stage_no_cycle', text: LIFE_STAGE_TEXT.no_cycle_tracking };
  return null;
}

// Relevance rules whose claim is about a current cycle (PMS, cyclical breast
// tenderness, period cramps from a supplement, conception). After menopause
// they do not apply, even when she picked the need.
export const CYCLE_CLAIM_RULES = new Set([
  'pms_named', 'pms_tagged', 'calcium_pms', 'breast_tenderness', 'cramp_supplement',
  'fertility_supplement', 'fertility_program', 'prenatal', 'pregnancy_test', 'perimenopause_hormone_test',
]);

/**
 * Per-need life-stage gate for menopause and post-menopause: relevance that
 * rests on a claim about a current cycle does not count. Bleeding products
 * for a bleeding need she picked stay (handled in notMenstruatingBlock, with
 * a "worth raising with a clinician" note), as do care services and heat.
 */
export function postmenopausalBleedingBlock(pp, up, needId) {
  // Founder, Oct 24: bleeding or spotting 12+ months after the last period
  // gets a prompt-evaluation message and NO products for that bleeding. Care
  // services stay (they are the evaluation path); other needs are untouched.
  // Same stage predicate as the profile warning (ontology.js bleedingAfterMenopause):
  // a flow answer like "Heavy" no longer hides it.
  return isAfterMenopauseStage(up?.physiology?.lifeStages) && MENSTRUAL_PRODUCT_NEEDS.has(needId) && !(pp?.is_digital || pp?.access?.is_care_service);
}

export function lifeStageNeedBlock(rel, up, needId) {
  if (!isAfterMenopauseStage(up?.physiology?.lifeStages) || !(rel?.base > 0)) return false;
  const rule = rel.contextUsed?.rule || rel.entry?.rule;
  return CYCLE_CLAIM_RULES.has(rule) && isCyclePremisedNeed(needId);
}

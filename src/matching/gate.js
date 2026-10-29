// The central personalized eligibility gate (P0, Oct 29).
//
//   recommendationEligibilityForUser(productProfile, userProfile, context)
//
// ONE answer to "may ayna put this product forward for her, with a match?",
// used by every surface: evaluateSafety runs it inside scoring (product
// page, For you, Discovery, Compare, Ask, Rundown, Why), and the ecosystem
// fallback calls it directly. Deterministic rules only: no model, no partner,
// price or commission field. Order: safety before score.
//
// decision:
//   'eligible'  a match may be shown
//   'hold'      no match shown; `state` says why and what resolves it
//   'excluded'  not for her (her stage, allergy, a contraindication, recall)
//
// state (product completeness for HER, field-based, audit K):
//   'verified'          every fact her answers depend on is known
//   'needs_answer'      we need one answer from her
//   'confirm'           two of her answers conflict, or a safety answer is old
//   'in_review'         a clinician review is open on this product
//   'researching'       a product fact her answers make matter is not known yet
//   'verified_unknown'  we looked; the brand does not publish it
import { buildProductProfile } from './productProfile.js';
import { evaluateSafety, CONFIRM_FIELDS } from './score.js';
import { recommendationEligibility } from './eligibility.js';

export const GATE_STATES = ['verified', 'needs_answer', 'confirm', 'in_review', 'researching', 'verified_unknown'];

/** The hold state for a safety result (the one she sees first). */
export function holdStateFor(safety) {
  if (!safety?.restricted) return 'verified';
  const fields = safety.missingFields || [];
  const info = safety.missingProductInfo || [];
  // What she can resolve comes first: asking her beats making her wait.
  if (fields.some((f) => !CONFIRM_FIELDS.has(f))) return 'needs_answer';
  if (fields.length) return 'confirm';
  if (info.includes('clinician_review')) return 'in_review';
  const open = info.filter((f) => !(safety.undisclosedInfo || []).includes(f));
  return open.length ? 'researching' : 'verified_unknown';
}

/**
 * @param {object} productOrProfile catalog product or buildProductProfile() result
 * @param {object} up buildUserProfile() result
 * @param {{ surface?: string, recommendation?: boolean, safety?: object }} [context]
 *   recommendation: true also applies the catalog gate (accessories, failed
 *   validation), for surfaces that put a product forward on their own.
 * @returns {{ decision: 'eligible'|'hold'|'excluded', state: string|null, reasons: object[], holds: string[], trace: object[] }}
 */
export function recommendationEligibilityForUser(productOrProfile, up, context = {}) {
  const pp = productOrProfile?.health_need_relevance ? productOrProfile : buildProductProfile(productOrProfile);
  const trace = [];
  if (context.recommendation && productOrProfile && !productOrProfile.health_need_relevance) {
    const cat = recommendationEligibility(productOrProfile, pp);
    trace.push({ step: 'catalog', ok: cat.eligible, code: cat.code });
    if (!cat.eligible) return { decision: 'excluded', state: null, reasons: [{ code: cat.code, text: cat.reason }], holds: [], trace };
  }
  const safety = context.safety || evaluateSafety(pp, up);
  trace.push({ step: 'safety', status: safety.status, reasons: safety.reasons.map((r) => r.code), holds: [...safety.missingFields, ...safety.missingProductInfo] });
  if (!safety.eligible) return { decision: 'excluded', state: null, reasons: safety.reasons, holds: [], trace, safety };
  const state = holdStateFor(safety);
  trace.push({ step: 'completeness', state });
  if (safety.restricted) return { decision: 'hold', state, reasons: [], holds: [...safety.missingFields, ...safety.missingProductInfo], trace, safety };
  return { decision: 'eligible', state: 'verified', reasons: [], holds: [], trace, safety };
}

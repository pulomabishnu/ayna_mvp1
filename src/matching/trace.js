// The decision trace (P1, Oct 29): a record of what the engine actually did
// for this product and this person, step by step, so every reason ayna shows
// comes from the real decision and nothing else (non-negotiable: "every
// displayed reason must come from the real decision trace").
//
//   gate      safety result: clear | caution | hold | excluded, with codes
//   checks    safety checks that PASSED for her, in plain words. Only things
//             the engine confirmed (a reviewed fact or her own answer), never
//             "probably fine". Unknowns are not checks; they are holds.
//   need      which of her needs it was scored for, and the relationship
//   evidence  the evidence grade the score used, in plain words
//   factors   what raised or lowered the number (v2 parts)
//
// Pure. No model, no partner or price field.
import { NO_EFFECT_CATEGORIES } from './v2.js';
import { stageScopeFor } from '../data/matching/stageScope.js';

export const EVIDENCE_WORDS = {
  A: { label: 'Studied for this', line: 'There is research on this product for this need.' },
  B: { label: 'Some research', line: 'Backed by research on its ingredients or by clinical guidelines, not studies of this exact product.' },
  C: { label: 'Limited evidence', line: 'Little research for this need, so the match is held lower.' },
};
export const FIT_ONLY = { label: 'Judged on fit', line: 'Products like this are matched on how well they fit you (size, flow, format), not on a health claim.' };

/**
 * @param {{ safety: object, pp: object, best: object|null, up: object }} x
 * @returns {{ steps: object[], checks: {code: string, text: string}[], evidence: object|null }}
 */
export function decisionTrace({ safety, pp, best, up }) {
  const steps = [];
  const checks = [];
  if (!safety || !pp) return { steps, checks, evidence: null };
  const result = !safety.eligible ? 'excluded' : safety.restricted ? 'hold' : safety.cautions?.length ? 'caution' : 'clear';
  steps.push({ step: 'gate', result, reasons: (safety.reasons || []).map((r) => r.code), holds: [...(safety.missingFields || []), ...(safety.missingProductInfo || [])], cautions: (safety.cautions || []).map((c) => c.code) });

  if (result === 'clear' || result === 'caution') {
    // Her sensitivities, checked against a known product fact.
    for (const c of safety.confirmed || []) checks.push({ code: `allergen_free:${c.attr}`, text: c.text });
    // A stage-only product, and her stated stage is in it.
    const scope = stageScopeFor(pp.product_id);
    if (scope) checks.push({ code: 'stage_scope', text: `Made for ${scope.phrase}, which matches the life stage you shared` });
    // Medicines: only a reviewed "compatible" counts as a check.
    if (safety.interaction?.verdict === 'compatible') checks.push({ code: 'medications_reviewed', text: 'Checked against the medicines you listed' });
    // Pregnancy / breastfeeding with a reviewed, non-caution status.
    const s = up?.safety || {};
    if ((s.pregnancyStatus === 'pregnant' || s.pregnant) && pp.pregnancy?.overall === 'verified') checks.push({ code: 'pregnancy_reviewed', text: 'Pregnancy safety checked from a reviewed source' });
    if (s.breastfeeding === 'yes' && pp.breastfeeding?.overall === 'verified') checks.push({ code: 'breastfeeding_reviewed', text: 'Breastfeeding safety checked from a reviewed source' });
    if (pp.passport?.qa === 'verified') checks.push({ code: 'passport_verified', text: 'Product facts checked by the ayna team' });
  }

  let evidence = null;
  if (best?.needId) {
    steps.push({ step: 'need', needId: best.needId, relationship: best.relationship || null, needTier: best.v2?.needTier || null, weak: Boolean(best.v2?.weakNeed) });
    const fitOnly = NO_EFFECT_CATEGORIES.has(String(pp.category || '').toLowerCase());
    const grade = best.v2?.grade || null;
    evidence = fitOnly ? { grade: null, ...FIT_ONLY } : grade && EVIDENCE_WORDS[grade] ? { grade, ...EVIDENCE_WORDS[grade], draft: true } : null;
    if (evidence) steps.push({ step: 'evidence', grade: evidence.grade, fitOnly });
    if (Array.isArray(best.v2?.parts)) steps.push({ step: 'factors', parts: best.v2.parts.map((p) => ({ factor: p.factor, kind: p.kind, delta: p.delta, text: p.text })) });
  }
  steps.push({ step: 'checks', codes: checks.map((c) => c.code) });
  return { steps, checks, evidence };
}

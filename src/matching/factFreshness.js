// Per-fact freshness (P0, audit finding G).
//
// Before: one timestamp for the whole quiz. Re-answering "Are you pregnant?"
// did not make that answer fresh unless she finished the whole quiz again,
// and changing her budget made a year-old medicine list look new.
//
// Now each safety-relevant group of answers carries its own time in
// `factUpdatedAt`. When she saves, a group's time moves only if its answers
// changed (or she confirmed it). Groups with no stamp fall back to the
// whole-intake time, so older profiles behave exactly as before.

/** Intake fields behind each freshness key (userProfile.js RECENCY_RULES). */
export const FACT_FIELDS = {
  pregnancy: ['lifeStage', 'lifeStageSelections', 'lifeStageOther', 'pregnancyTrimester'],
  postpartum: ['lifeStage', 'lifeStageSelections', 'postpartumTiming', 'breastfeedingStatus'],
  medications: ['takesCurrent', 'currentMedicationItems', 'currentMedications'],
  allergies: ['allergyStatus', 'allergyItems', 'allergySelections', 'allergyOtherText', 'sensitivities'],
  needs: ['supportSelections', 'supportOtherText', 'primaryConcerns', 'customConcerns'],
  budget: ['priceRange', 'budget'],
};

const inner = (x) => (x && typeof x === 'object' ? (x.fullHealthIntake && typeof x.fullHealthIntake === 'object' ? x.fullHealthIntake : x) : {});
const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Stamp the groups that changed between her previous answers and these.
 * @param {object} next quiz results (or intake) about to be saved
 * @param {object|null} prev what was saved before (null on a first quiz)
 * @param {string} [nowIso]
 * @param {{ confirmed?: string[] }} [opts] groups she re-confirmed without changing
 */
export function stampFactUpdates(next, prev, nowIso = new Date().toISOString(), opts = {}) {
  if (!next || typeof next !== 'object') return next;
  const a = inner(prev);
  const b = inner(next);
  const before = (prev && (inner(prev).factUpdatedAt || prev.factUpdatedAt)) || {};
  const fallback = prev ? (a.personalizationCompletedAt || prev.personalizationCompletedAt || null) : null;
  const stamps = {};
  for (const [key, fields] of Object.entries(FACT_FIELDS)) {
    const changed = !prev || fields.some((f) => !same(a[f], b[f]));
    const confirmed = (opts.confirmed || []).includes(key);
    stamps[key] = changed || confirmed ? nowIso : before[key] || fallback || nowIso;
  }
  const out = { ...next, factUpdatedAt: stamps };
  if (next.fullHealthIntake && typeof next.fullHealthIntake === 'object') out.fullHealthIntake = { ...next.fullHealthIntake, factUpdatedAt: stamps };
  return out;
}

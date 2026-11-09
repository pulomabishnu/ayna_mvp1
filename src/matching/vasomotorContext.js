// Observations about when someone notices a hot flash/night sweat. They are
// NOT causes or diagnoses, and never set menopause_transition.
export const VASOMOTOR_TIMING_OPTIONS = [
  'Before my period / PMS',
  'During my period',
  'When stressed or anxious',
  'At night',
  'No clear pattern',
  'Not sure',
];
const EXCLUSIVE = new Set(['No clear pattern', 'Not sure']);
export function toggleVasomotorTiming(values = [], value) {
  const existing = Array.isArray(values) ? values : [];
  if (!VASOMOTOR_TIMING_OPTIONS.includes(value)) return existing;
  if (existing.includes(value)) return existing.filter(x => x !== value);
  return EXCLUSIVE.has(value)
    ? [value]
    : [...existing.filter(x => !EXCLUSIVE.has(x)), value];
}
export function needsVasomotorTiming(intake) {
  return (intake?.supportSelections || []).some(s => s === 'Hot flashes' || s === 'Night sweats');
}
const LABEL_TO_ID = {
  'Before my period / PMS': 'before_period',
  'During my period': 'during_period',
  'When stressed or anxious': 'stress_anxiety',
  'At night': 'at_night',
  'No clear pattern': 'no_clear_pattern',
  'Not sure': 'not_sure',
};
const FLASH = /\bhot\s*(?:flash(?:es)?|flush(?:es)?)\b|\bnight\s*sweats?\b/i;
const PERIOD = /\b(?:before|during|on|around|near|with|when i(?:'m| am))\b.{0,45}\b(?:period|pms|premenstrual|menstruat)/i;
const PERIOD_FIRST = /\b(?:period|pms|premenstrual|menstruat)\b.{0,45}\b(?:hot\s*(?:flash(?:es)?|flush(?:es)?)|night\s*sweats?)\b/i;
const ANXIETY = /\b(?:when|during|with|from|because of|triggered by)\b.{0,35}\b(?:anxi(?:ety|ous)|stress(?:ed)?)\b/i;
const ANXIETY_FIRST = /\b(?:anxi(?:ety|ous)|stress(?:ed)?)\b.{0,35}\b(?:hot\s*(?:flash(?:es)?|flush(?:es)?)|night\s*sweats?)\b/i;
/** Explicit reported timing, not age-based assumptions or symptom co-occurrence. */
export function vasomotorTimingFromIntake(intake = {}) {
  if (!needsVasomotorTiming(intake)) return [];
  const structured = Array.isArray(intake.vasomotorTimingSelections) ? intake.vasomotorTimingSelections : [];
  const chosen = structured.filter(x => LABEL_TO_ID[x]).map(x => LABEL_TO_ID[x]);
  if (chosen.length) return [...new Set(chosen)];
  // Legacy written notes are weaker than a structured answer. Only attribute
  // timing when a flash/sweat and timing actually appear together in text.
  const text = String(intake.anythingElse || '');
  if (!FLASH.test(text)) return [];
  const labels = [];
  if (PERIOD.test(text) || PERIOD_FIRST.test(text)) labels.push('around_period_reported');
  if (ANXIETY.test(text) || ANXIETY_FIRST.test(text)) labels.push('with_stress_reported');
  return labels;
}

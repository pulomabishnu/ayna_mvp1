// Layered user profile for matching.
//
// buildUserProfile(intake, { behavior, catalog }) turns intake answers (the
// wizard's EMPTY-shaped state, the buildSnapshot() output, or a legacy
// quizAnswers object with fullHealthIntake) into separate layers:
//   healthIntent, safety, physiology, experience, shopping, trust, access, behavior
// One answer may write to several layers. Example, "I am pregnant":
//   safety.pregnant = true (pregnancy eligibility screening)
//   physiology.lifeStages includes 'pregnant' (boosts pregnancy-designed products)
//   healthIntent is NOT changed (no nausea/constipation assumed)
//   explanations may say "Fits the pregnancy stage you shared"
//   confidence drops for products with unknown pregnancy safety (score.js)

import {
  needIdForOption, NON_NEED_OPTIONS, NEED_BY_ID, canonicalize, CONDITION_ID_BY_OPTION, CONDITION_ID_BY_LEGACY, NON_CONDITION_OPTIONS,
  LIFE_STAGE_ID_BY_OPTION, LIFE_STAGE_COMPATIBILITY, ageBandFor, UNUSUAL_AGE_FOR_STAGE, FORMAT_ID_BY_OPTION, LEAVE_OUT_BY_OPTION,
  VALUE_ID_BY_OPTION, ALLERGEN_BY_OPTION, ALLERGEN_BY_ID, PCOS_REINFORCING_NEEDS, URINARY_UTI_NEEDS, MENSTRUAL_PRODUCT_NEEDS, POSTPARTUM_NEEDS,
  normalizeText, LEGACY_FRUSTRATION_NEEDS, LEGACY_CONCERN_NEEDS, LEGACY_SYMPTOM_NEEDS, LEGACY_PREFERENCE, LEGACY_SENSITIVITY_ALLERGEN,
} from './ontology.js';
import { normalizeMedication } from './medications.js';
import { extractFreeText, summarizeFreeText } from './freeText.js';
import { normalizeBrand } from './productProfile.js';

// ─── Answer maps (intake option -> internal id) ─────────────────────────────
export const FLOW_BY_OPTION = {
  'Very light': 'very_light', Light: 'light', Moderate: 'moderate', Heavy: 'heavy', 'Very heavy': 'very_heavy',
  'It varies': 'varies', 'I do not currently get periods': 'no_periods', 'Not sure': null,
};
const LEGACY_FLOW = { light: 'light', medium: 'moderate', heavy: 'heavy', 'very heavy': 'very_heavy' };

// Period pain intensity (spec): none 0, mild .25, moderate .5, severe .8,
// very severe 1, varies .5 with lower confidence, not sure = no modifier.
export const PAIN_INTENSITY = {
  None: { value: 0 }, Mild: { value: 0.25 }, Moderate: { value: 0.5 }, Severe: { value: 0.8 }, 'Very severe': { value: 1 },
  'It varies': { value: 0.5, lowConfidence: true }, 'Not sure': null,
};

export const UTI_FREQUENCY_BY_OPTION = {
  'This is the first time': 'first_time', Rarely: 'rarely', 'A few times a year': 'recurrent', 'About monthly': 'recurrent',
  'More than once a month': 'recurrent', 'I am experiencing them right now': 'right_now', 'Not sure': null,
};
export const POSTPARTUM_TIMING_BY_OPTION = {
  'Less than 6 weeks ago': 'lt_6w', '6 weeks–3 months ago': '6w_3m', '6 weeks-3 months ago': '6w_3m', '3–6 months ago': '3_6m', '3-6 months ago': '3_6m',
  '6–12 months ago': '6_12m', '6-12 months ago': '6_12m', 'More than 12 months ago': 'gt_12m',
};
export const TRIMESTER_BY_OPTION = { 'First trimester': 1, 'Second trimester': 2, 'Third trimester': 3, 'Not sure': null, 'Prefer not to say': null };

export const PRICE_RANGE_BOUNDS = {
  'Under $25': [0, 25], '$25–$75': [25, 75], '$25-$75': [25, 75], '$75–$150': [75, 150], '$75-$150': [75, 150], '$150+': [150, Infinity],
};
export const PRICE_NOT_IMPORTANT = 'Price is not a major factor for me';

// New brands? -> brand_exploration value (spec).
export const BRAND_EXPLORATION = {
  'I mostly stick with brands I already trust': 0.1,
  'I prefer trusted brands but am open to something new': 0.3,
  'I like a mix of familiar and new brands': 0.5,
  'I enjoy discovering new brands': 0.9,
  'No preference': 0.5,
};

export const TRUST_KEY_BY_ITEM = {
  'Clinical or scientific evidence': 'clinical',
  'Reviews and experiences from other women': 'community',
  'Brand reputation or expert recommendations': 'expert',
};
// Rank 1/2/3 weights (spec example A: clinical .6, community .25, expert .15).
export const TRUST_RANK_WEIGHTS = [0.6, 0.25, 0.15];

export const WORKED_BY_OPTION = {
  'Helped a lot': 'helped_a_lot', 'Helped somewhat': 'helped_somewhat', 'No difference': 'no_difference',
  'Made it worse': 'made_worse', 'Made things worse': 'made_worse', 'Not sure': 'not_sure',
};
export const REACTION_BY_OPTION = {
  No: 'none', Mild: 'mild', Serious: 'serious', 'Serious or concerning reaction': 'serious', 'Not sure': 'not_sure',
};
export const STOP_REASON_BY_OPTION = {
  'It did not help': 'did_not_help', 'It stopped working': 'stopped_working', 'I had side effects or a reaction': 'reaction',
  'It was too expensive': 'too_expensive', 'It was inconvenient': 'inconvenient', 'I did not like the format': 'format_dislike',
  'I found something better': 'found_better', 'A clinician recommended stopping it': 'clinician_stop', 'I simply did not repurchase it': 'did_not_repurchase',
};

// EXPERIENCE SEMANTICS (spec, clinician/PM review).
// same: change to the experience component (0..1, neutral 0.6) for the SAME product.
// similar: change for similar products (same category + same brand, or same
// category + shared format/ingredient). hardSuppress/exclude remove the same
// product entirely. No rule ever infers which ingredient caused a reaction.
export const EXPERIENCE_EFFECTS = {
  outcome: {
    helped_a_lot: { same: +0.4, similar: +0.12, note: 'reorder candidate' },
    helped_somewhat: { same: +0.25, similar: +0.06 },
    no_difference: { same: -0.45, similar: -0.15, note: 'near duplicates down' },
    made_worse: { same: 0, similar: -0.2, hardSuppress: true, note: 'shared formulations down' },
    not_sure: { same: 0, similar: 0 },
  },
  reaction: {
    none: { same: 0, similar: 0 },
    mild: { same: -0.55, similar: -0.08, similarCaution: true, note: 'same product strongly down; similar products get a caution' },
    serious: { same: 0, similar: 0, exclude: true, safetyFlag: true, note: 'exclude same product; no ingredient inference' },
    not_sure: { same: -0.1, similar: 0 },
  },
  stop: {
    did_not_help: { same: -0.35, similar: -0.1 },
    stopped_working: { same: -0.2, similar: -0.05 },
    reaction: { same: -0.5, similar: 0, safetyFlag: true },
    too_expensive: { same: -0.05, similar: 0, priceSensitivity: 1 },
    inconvenient: { same: -0.05, similar: 0, usageBurden: 1 },
    format_dislike: { same: -0.1, similar: 0, formatDislike: true },
    found_better: { same: -0.15, similar: 0 },
    clinician_stop: { same: 0, similar: 0, hardSuppress: true },
    did_not_repurchase: { same: -0.05, similar: 0 },
  },
};

// ─── helpers ────────────────────────────────────────────────────────────────
function arr(v) {
  if (Array.isArray(v)) return v.filter((x) => x != null && String(x).trim() !== '');
  if (v == null || v === '') return [];
  return [v];
}
function splitList(text) {
  return String(text || '').split(/;\s*/).map((s) => s.trim()).filter(Boolean);
}
export function normalizeName(value) {
  return String(value || '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

/** Resolve a typed product name to one catalog product (exact, then unique all-token containment). */
export function resolveCatalogProduct(name, catalog) {
  const target = normalizeName(name);
  if (!target || !Array.isArray(catalog) || !catalog.length) return null;
  const exact = catalog.find((p) => normalizeName(p.name) === target);
  if (exact) return exact;
  const tokens = target.split(' ').filter((t) => t.length > 1);
  if (tokens.length < 2) return null;
  const hits = catalog.filter((p) => {
    const n = normalizeName(p.name);
    return tokens.every((t) => n.split(' ').includes(t) || n.split(' ').some((w) => w.startsWith(t) && t.length > 3));
  });
  return hits.length === 1 ? hits[0] : null;
}

function unwrap(input) {
  if (!input || typeof input !== 'object') return {};
  if (input.fullHealthIntake && typeof input.fullHealthIntake === 'object') return { ...input, ...input.fullHealthIntake };
  return input;
}

function parseAge(raw) {
  if (raw == null || String(raw).trim() === '') return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 10 && n <= 120 ? n : null;
}

/**
 * Build the layered profile.
 * @param {object} intakeInput intake state, buildSnapshot() output, or quizAnswers with fullHealthIntake
 * @param {{ behavior?: object, catalog?: object[] }} [options]
 *   behavior: { viewed: {id: count}, saved: id[], hidden: id[], purchased: id[], reordered: id[], purchasedPrices: number[] }
 *   catalog: product list used to resolve names typed in history / avoid list
 */
export function buildUserProfile(intakeInput, options = {}) {
  const intake = unwrap(intakeInput);
  const catalog = options.catalog || [];
  const knownNames = catalog.flatMap((p) => [p.name, p.brand]).filter(Boolean);

  // Free text first: several layers read it.
  const freeTextSources = [intake.anythingElse].filter(Boolean);
  const freeText = summarizeFreeText(extractFreeText(freeTextSources.join('. '), { knownNames }));

  // ── Health intent ────────────────────────────────────────────────────
  const needs = [];
  const unresolvedNeeds = [];
  const addNeed = (id, source, raw, confidence = 1, extra = {}) => {
    if (!id || needs.some((n) => n.id === id)) return;
    needs.push({ id, source, raw, confidence, label: NEED_BY_ID[id]?.option || NEED_BY_ID[id]?.phrase || id, modifiers: {}, intensity: null, ...extra });
  };
  const support = arr(intake.supportSelections);
  const nothingRightNow = support.includes('Nothing right now');
  for (const option of support) {
    if (NON_NEED_OPTIONS.has(option)) continue;
    const id = needIdForOption(option);
    if (id) { addNeed(id, 'selected', option); continue; }
    const c = canonicalize(option, { kinds: ['need'] });
    if (c.canonical_id && c.confidence >= 0.7 && !c.contextual_only) addNeed(c.canonical_id, 'custom', option, c.confidence, { canonical: c });
    else unresolvedNeeds.push(c);
  }
  for (const text of splitList(intake.supportOtherText)) {
    if (support.includes(text)) continue;
    const c = canonicalize(text, { kinds: ['need'] });
    if (c.canonical_id && c.confidence >= 0.7 && !c.contextual_only) addNeed(c.canonical_id, 'custom', text, c.confidence, { canonical: c });
    else unresolvedNeeds.push(c);
  }
  // Older saved profiles: no current support answers, only the first quiz's
  // broad answers. Each maps to the specific needs it named (ontology tables).
  const hasCurrentSupport = support.length > 0 || splitList(intake.supportOtherText).length > 0;
  if (!hasCurrentSupport && !nothingRightNow) {
    const addLegacy = (option, table) => {
      const ids = table[option] || (needIdForOption(option) ? [needIdForOption(option)] : null);
      if (ids) { ids.forEach((id) => addNeed(id, 'legacy', option)); return; }
      const c = canonicalize(option, { kinds: ['need'] });
      if (c.canonical_id && c.confidence >= 0.7 && !c.contextual_only) addNeed(c.canonical_id, 'legacy', option, c.confidence, { canonical: c });
    };
    const concerns = arr(intake.primaryConcerns).length ? arr(intake.primaryConcerns) : arr(intake.primaryConcern);
    concerns.forEach((c) => addLegacy(c, LEGACY_CONCERN_NEEDS));
    if (!concerns.length) arr(intake.frustrations).forEach((f) => addLegacy(f, LEGACY_FRUSTRATION_NEEDS));
    arr(intake.symptoms).forEach((sym) => (LEGACY_SYMPTOM_NEEDS[String(sym).toLowerCase()] || []).forEach((id) => addNeed(id, 'legacy', sym)));
  }
  for (const m of freeText.mentioned_needs) {
    if (m.weight >= 1) addNeed(m.id, 'free_text', m.canonical?.raw_user_text, m.canonical?.confidence ?? 0.9, { canonical: m.canonical });
  }

  // ── Conditions ───────────────────────────────────────────────────────
  const conditions = [];
  const addCondition = (id, source, raw) => { if (id && !conditions.some((c) => c.id === id)) conditions.push({ id, source, raw }); };
  for (const option of arr(intake.diagnosisSelections)) {
    if (NON_CONDITION_OPTIONS.has(option)) continue;
    const id = CONDITION_ID_BY_OPTION[option];
    if (id) addCondition(id, 'selected', option);
    else {
      const c = canonicalize(option, { kinds: ['condition'] });
      if (c.canonical_id && c.confidence >= 0.9) addCondition(c.canonical_id, 'custom', option);
    }
  }
  if (!arr(intake.diagnosisSelections).length) {
    for (const legacy of arr(intake.conditions)) {
      const id = CONDITION_ID_BY_LEGACY[String(legacy).toLowerCase()];
      if (id) addCondition(id, 'legacy', legacy);
    }
  }
  for (const text of splitList(intake.conditionOtherText)) {
    const c = canonicalize(text, { kinds: ['condition'] });
    if (c.canonical_id && c.confidence >= 0.9) addCondition(c.canonical_id, 'custom', text);
  }
  const conditionIds = new Set(conditions.map((c) => c.id));

  // ── Physiology ───────────────────────────────────────────────────────
  const age = parseAge(intake.age);
  const lifeStageRaw = arr(intake.lifeStageSelections).length ? arr(intake.lifeStageSelections) : arr(intake.lifeStage);
  const lifeStages = [];
  const customLifeStages = [];
  for (const option of lifeStageRaw) {
    const id = LIFE_STAGE_ID_BY_OPTION[option];
    if (id) { if (!lifeStages.includes(id)) lifeStages.push(id); continue; }
    const c = canonicalize(option, { kinds: ['life_stage'] });
    if (c.canonical_id && c.confidence >= 0.9 && c.canonical_id !== 'breastfeeding') { if (!lifeStages.includes(c.canonical_id)) lifeStages.push(c.canonical_id); } else customLifeStages.push(c);
  }
  for (const text of splitList(intake.lifeStageOther)) {
    const c = canonicalize(text, { kinds: ['life_stage'] });
    if (c.canonical_id && c.confidence >= 0.9 && c.canonical_id !== 'breastfeeding') { if (!lifeStages.includes(c.canonical_id)) lifeStages.push(c.canonical_id); } else customLifeStages.push(c);
  }
  const breastfeeding = intake.breastfeedingStatus === 'Yes' ? 'yes' : intake.breastfeedingStatus === 'No' ? 'no' : 'unknown';
  const stageSet = new Set([...lifeStages, ...(breastfeeding === 'yes' ? ['breastfeeding'] : [])]);

  const confidenceFlags = [];
  const combos = [];
  for (const rule of LIFE_STAGE_COMPATIBILITY) {
    if (rule.stages.every((s) => stageSet.has(s))) combos.push({ stages: rule.stages, verdict: rule.verdict });
  }
  const conflictingStages = new Set(combos.filter((c) => c.verdict === 'needs_clarification').flatMap((c) => c.stages));
  if (conflictingStages.size) confidenceFlags.push('needs_clarification');
  const ageStageFlags = lifeStages.filter((s) => age != null && UNUSUAL_AGE_FOR_STAGE[s]?.(age));
  if (ageStageFlags.length) confidenceFlags.push('unusual_combination');

  let flow = Object.prototype.hasOwnProperty.call(FLOW_BY_OPTION, intake.periodFlow) ? FLOW_BY_OPTION[intake.periodFlow] : null;
  if (!flow && intake.flowLevel) flow = LEGACY_FLOW[String(intake.flowLevel).toLowerCase()] || null;
  const pain = PAIN_INTENSITY[intake.periodPain] ?? null;
  const utiFrequency = UTI_FREQUENCY_BY_OPTION[intake.utiFrequency] ?? null;
  const postpartumTiming = POSTPARTUM_TIMING_BY_OPTION[intake.postpartumTiming] ?? null;
  const trimester = TRIMESTER_BY_OPTION[intake.pregnancyTrimester] ?? null;
  const leakConcern = /\bleak/.test(normalizeText(intake.anythingElse)) || arr(intake.frustrations).includes('Leaks & staining');

  // Per-need intensity and modifiers. Modifiers only touch needs she selected.
  for (const need of needs) {
    if (need.id === 'pain.menstrual_cramp' && pain) {
      need.intensity = pain.value;
      need.modifiers.painIntensity = pain.value;
      if (pain.lowConfidence) need.modifiers.painVaries = true;
    }
    if (MENSTRUAL_PRODUCT_NEEDS.has(need.id) && flow) need.modifiers.flow = flow;
    if (MENSTRUAL_PRODUCT_NEEDS.has(need.id) && leakConcern) need.modifiers.leakConcern = true;
    if (URINARY_UTI_NEEDS.has(need.id) && utiFrequency) need.modifiers.utiFrequency = utiFrequency;
    if (need.id.startsWith('pregnancy.') && trimester) need.modifiers.trimester = trimester;
    if ((POSTPARTUM_NEEDS.has(need.id) || need.id === 'hair.loss') && postpartumTiming && lifeStages.includes('postpartum')) need.modifiers.postpartumTiming = postpartumTiming;
  }

  // Cross-answer reinforcement (never a diagnosis).
  const needIds = new Set(needs.map((n) => n.id));
  const pcosAnchor = needIds.has('condition_support.pcos') || conditionIds.has('pcos');
  const pcosSignals = PCOS_REINFORCING_NEEDS.filter((id) => needIds.has(id)).length;
  const reinforcement = pcosAnchor ? { pcos: pcosSignals >= 3 ? 'very_high' : pcosSignals >= 1 ? 'high' : 'baseline', pcosSignals } : {};

  // ── Safety ───────────────────────────────────────────────────────────
  const allergyStatus = intake.allergyStatus === 'Yes' ? 'yes' : intake.allergyStatus === 'No' ? 'no'
    : /not sure/i.test(String(intake.allergyStatus || '')) ? 'unsure' : 'unknown';
  const allergies = [];
  const unresolvedAllergies = [];
  const allergyItems = allergyStatus === 'yes' ? arr(intake.allergyItems).length ? arr(intake.allergyItems) : arr(intake.allergies) : [];
  for (const raw of allergyItems) {
    const def = ALLERGEN_BY_OPTION[raw];
    if (def) { allergies.push({ ...def, raw, source: 'selected' }); continue; }
    const c = canonicalize(raw, { kinds: ['allergen'] });
    if (c.canonical_id && c.confidence >= 0.9) allergies.push({ ...ALLERGEN_BY_ID[c.canonical_id], raw, source: 'custom', canonical: c });
    else unresolvedAllergies.push(c);
  }
  // First quiz: "sensitivities" (and sensitivity labels inside productsToAvoid) are allergy-equivalent.
  if (!allergyItems.length && allergyStatus !== 'no') {
    for (const raw of [...arr(intake.sensitivities), ...arr(intake.productsToAvoid)]) {
      const id = LEGACY_SENSITIVITY_ALLERGEN[raw];
      if (id && !allergies.some((x) => x.id === id)) allergies.push({ ...ALLERGEN_BY_ID[id], raw, source: 'legacy' });
    }
  }
  for (const a of freeText.explicit_allergies) {
    if (!allergies.some((x) => x.id === a.id)) allergies.push({ ...ALLERGEN_BY_ID[a.id], raw: a.id, source: 'free_text_explicit' });
  }

  const meds = [];
  if (intake.takesCurrent === 'Yes' || (!intake.takesCurrent && arr(intake.currentMedicationItems).length)) {
    for (const raw of arr(intake.currentMedicationItems)) meds.push({ ...normalizeMedication(raw), source: 'selected' });
  }
  if (lifeStages.includes('hormonal_birth_control') && !meds.some((m) => m.all_classes.includes('hormonal_contraceptive'))) {
    meds.push({ ...normalizeMedication('hormonal contraceptive (unspecified)'), raw: 'Hormonal birth control (life stage)', source: 'life_stage' });
  }

  const avoidNames = [...arr(intake.avoidRepeat), ...arr(intake.dislikedProducts), ...arr(intake.productsToAvoid)]
    .filter((raw) => !LEGACY_SENSITIVITY_ALLERGEN[raw] && !/^(other allergies|none)$/i.test(String(raw).trim()));
  const avoidEntries = [...new Set(avoidNames)].map((raw) => {
    const resolved = resolveCatalogProduct(raw, catalog);
    return { raw, normalized: normalizeName(raw), brandKey: normalizeBrand(raw), resolvedProductId: resolved?.id || null };
  });

  // ── Experience ───────────────────────────────────────────────────────
  const history = arr(intake.productHistory).filter((h) => h && h.name).map((h) => {
    const outcome = WORKED_BY_OPTION[h.worked] || null;
    const reaction = REACTION_BY_OPTION[h.reaction] || null;
    const stopReasons = arr(h.stopReasons).map((r) => STOP_REASON_BY_OPTION[r] || null).filter(Boolean);
    const customStop = [...arr(h.stopReasons).filter((r) => !STOP_REASON_BY_OPTION[r]), h.stopOther].filter(Boolean);
    const reactionText = h.reactionText ? summarizeFreeText(extractFreeText(h.reactionText)).reaction_history : [];
    const resolved = resolveCatalogProduct(h.name, catalog);
    const effects = [];
    if (outcome) effects.push({ from: `outcome:${outcome}`, ...EXPERIENCE_EFFECTS.outcome[outcome] });
    if (reaction) effects.push({ from: `reaction:${reaction}`, ...EXPERIENCE_EFFECTS.reaction[reaction] });
    stopReasons.forEach((r) => effects.push({ from: `stop:${r}`, ...EXPERIENCE_EFFECTS.stop[r] }));
    return {
      name: h.name,
      normalized: normalizeName(h.name),
      brandKey: normalizeBrand(h.name),
      resolvedProductId: resolved?.id || null,
      resolvedProduct: resolved || null,
      usingNow: h.current === 'Yes' ? true : h.current === 'No' ? false : null,
      outcome, reaction, stopReasons, customStopReasons: customStop,
      reactionDetails: reactionText, // reaction_type / body_area only; trigger stays unknown
      effects,
      hardSuppress: effects.some((e) => e.hardSuppress),
      exclude: effects.some((e) => e.exclude),
      safetyFlag: effects.some((e) => e.safetyFlag),
    };
  });
  const priceSensitivitySignals = history.reduce((n, h) => n + h.effects.reduce((m, e) => m + (e.priceSensitivity || 0), 0), 0)
    + (freeText.price_sensitivity ? freeText.price_sensitivity.weight : 0);
  const usageBurdenSignals = history.reduce((n, h) => n + h.effects.reduce((m, e) => m + (e.usageBurden || 0), 0), 0);

  // ── Shopping ─────────────────────────────────────────────────────────
  const preferredFormats = [];
  let formatNoPreference = false;
  const customFormats = [];
  for (const raw of arr(intake.preferredFormats)) {
    if (raw === 'No preference') { formatNoPreference = true; continue; }
    const id = FORMAT_ID_BY_OPTION[raw];
    if (id) { preferredFormats.push(id); continue; }
    const c = canonicalize(raw, { kinds: ['format'] });
    if (c.canonical_id && c.confidence >= 0.9) preferredFormats.push(c.canonical_id); else customFormats.push(c);
  }
  for (const text of splitList(intake.formatOtherText)) {
    const c = canonicalize(text, { kinds: ['format'] });
    if (c.canonical_id && c.confidence >= 0.9 && !preferredFormats.includes(c.canonical_id)) preferredFormats.push(c.canonical_id);
  }
  const dislikedFormats = freeText.format_dislikes.map((d) => ({ id: d.id, weight: d.weight, source: 'free_text' }));
  for (const h of history) {
    if (h.stopReasons.includes('format_dislike') && h.resolvedProduct) {
      // Format is read from the resolved product at scoring time; record the product id.
      dislikedFormats.push({ fromProductId: h.resolvedProductId, weight: 1, source: 'history' });
    }
  }
  const strictFormats = freeText.format_only.filter((f) => f.weight >= 1).map((f) => f.id);

  const ranges = arr(intake.priceRange);
  const notImportant = ranges.includes(PRICE_NOT_IMPORTANT);
  const bounds = ranges.map((r) => PRICE_RANGE_BOUNDS[r]).filter(Boolean);
  let budget = null;
  if (!notImportant && bounds.length) budget = { min: Math.min(...bounds.map((b) => b[0])), max: Math.max(...bounds.map((b) => b[1])), source: 'selected' };
  else if (!notImportant && freeText.max_price && freeText.max_price.weight >= 1) budget = { min: 0, max: freeText.max_price.value, source: 'free_text' };

  const leaveOut = [];
  const shouldBe = [];
  const allergyAttrs = new Set(allergies.map((a) => a.attr).filter(Boolean));
  for (const raw of [...arr(intake.avoidIngredients), ...splitList(intake.avoidIngredientsOtherText)]) {
    if (raw === 'No preference' || raw === 'Other') continue;
    const lo = LEAVE_OUT_BY_OPTION[raw];
    if (lo) {
      if (!leaveOut.some((x) => x.attr === lo.attr)) leaveOut.push({ attr: lo.attr, raw, strength: allergyAttrs.has(lo.attr) ? 'allergy_equivalent' : 'strong', source: 'selected' });
      continue;
    }
    const v = VALUE_ID_BY_OPTION[raw];
    if (v) { if (!shouldBe.some((x) => x.id === v)) shouldBe.push({ id: v, raw, weight: 1, source: 'selected' }); continue; }
    const c = canonicalize(raw, { kinds: ['value', 'allergen'] });
    if (c.kind === 'value' && c.confidence >= 0.85) shouldBe.push({ id: c.canonical_id, raw, weight: 1, source: 'custom' });
    else if (c.kind === 'allergen' && c.confidence >= 0.9 && ALLERGEN_BY_ID[c.canonical_id]?.attr) {
      const attr = ALLERGEN_BY_ID[c.canonical_id].attr;
      if (!leaveOut.some((x) => x.attr === attr)) leaveOut.push({ attr, raw, strength: 'strong', source: 'custom' });
    }
  }
  if (!arr(intake.avoidIngredients).length) {
    for (const raw of arr(intake.preference)) {
      const lp = LEGACY_PREFERENCE[raw];
      if (lp?.value && !shouldBe.some((x) => x.id === lp.value)) shouldBe.push({ id: lp.value, raw, weight: 1, source: 'legacy' });
      if (lp?.leaveOut && !leaveOut.some((x) => x.attr === lp.leaveOut)) leaveOut.push({ attr: lp.leaveOut, raw, strength: 'strong', source: 'legacy' });
    }
  }
  for (const raw of arr(intake.brandSupportPreferences)) {
    const c = canonicalize(raw, { kinds: ['value'] });
    if (c.canonical_id && c.confidence >= 0.85 && !shouldBe.some((x) => x.id === c.canonical_id)) shouldBe.push({ id: c.canonical_id, raw, weight: 1, source: 'brand_support' });
  }
  for (const s of freeText.should_be) if (!shouldBe.some((x) => x.id === s.id)) shouldBe.push({ id: s.id, raw: s.id, weight: s.weight, source: 'free_text' });
  for (const s of freeText.sensitivities) if (!shouldBe.some((x) => x.id === s.id)) shouldBe.push({ id: s.id, raw: s.id, weight: s.weight, source: 'free_text' });
  for (const l of freeText.leave_out) if (!leaveOut.some((x) => x.attr === l.attr)) leaveOut.push({ attr: l.attr, raw: l.attr, strength: 'cosmetic', weight: l.weight, source: 'free_text' });

  const brandOpenness = intake.brandOpenness || '';
  const trustedBrands = arr(intake.trustedBrands).map((raw) => ({ raw, key: normalizeBrand(raw) }));
  const positiveMentions = freeText.positive_product_history.map((p) => ({ raw: p.name, key: normalizeBrand(p.name), normalized: normalizeName(p.name), weight: p.weight }));

  const fsaRaw = intake.fsaHsaAnswer || '';
  const fsaHsa = { FSA: 'fsa', HSA: 'hsa', Both: 'both', No: 'none', 'Not sure': 'unsure' }[fsaRaw] || intake.fsaHsa || null;

  const picks = Number(intake.recommendedProductsPerArea);
  const picksPerNeed = Number.isFinite(picks) && picks > 0 ? Math.min(10, Math.max(1, Math.round(picks))) : 3;

  // ── Trust ────────────────────────────────────────────────────────────
  const touched = intake.trustRankingTouched === true || (intake.trustRankingTouched === undefined && arr(intake.trustRanking).length > 0);
  const ranking = touched ? arr(intake.trustRanking).map((t) => TRUST_KEY_BY_ITEM[t]).filter(Boolean) : [];
  const trustWeights = { clinical: 1 / 3, community: 1 / 3, expert: 1 / 3 };
  if (ranking.length) {
    const keys = ['clinical', 'community', 'expert'];
    const ordered = [...ranking, ...keys.filter((k) => !ranking.includes(k))];
    ordered.forEach((k, i) => { trustWeights[k] = TRUST_RANK_WEIGHTS[i] ?? 0; });
  }

  // ── Access ───────────────────────────────────────────────────────────
  const zipMatch = String(intake.zipcode || intake.zip || '').match(/\b(\d{5})\b/);

  // ── Behavior ─────────────────────────────────────────────────────────
  const b = options.behavior || {};
  const behavior = {
    viewed: { ...(b.viewed || {}) },
    saved: new Set(arr(b.saved)),
    hidden: new Set(arr(b.hidden)),
    purchased: new Set(arr(b.purchased)),
    reordered: new Set(arr(b.reordered)),
    // Prices of past purchases (numbers). Used only to soften the budget curve a little.
    purchasedPrices: arr(b.purchasedPrices).map(Number).filter(Number.isFinite),
  };

  const urgent = intake.safetyConcern === 'Yes' ? 'yes' : intake.safetyConcern === 'Not sure' ? 'not_sure' : intake.safetyConcern === 'No' ? 'no' : null;

  return {
    version: 1,
    healthIntent: { needs, unresolvedNeeds, nothingRightNow, reinforcement },
    safety: {
      pregnant: lifeStages.includes('pregnant'),
      trimester,
      breastfeeding,
      ttc: lifeStages.includes('ttc') || needIds.has('fertility.ttc'),
      allergyStatus,
      allergies,
      unresolvedAllergies,
      medications: meds,
      conditions,
      avoid: avoidEntries,
      leaveOut,
      reactionHistory: [...history.filter((h) => h.reaction && h.reaction !== 'none').map((h) => ({ product: h.name, reaction: h.reaction, details: h.reactionDetails })),
        ...freeText.reaction_history.map((r) => ({ product: null, reaction: 'reported', details: [r] }))],
      urgent,
      careFirst: urgent === 'yes',
      careProminent: urgent === 'yes' || urgent === 'not_sure',
      age,
    },
    physiology: {
      age,
      ageBand: ageBandFor(age),
      lifeStages,
      customLifeStages,
      breastfeeding,
      compatibility: { combos, conflictingStages: [...conflictingStages], ageStageFlags },
      confidenceFlags,
      flow,
      painIntensity: pain ? pain.value : null,
      painVaries: Boolean(pain?.lowConfidence),
      utiFrequency,
      utiFrequencyRaw: intake.utiFrequency || null,
      postpartumTiming,
      trimester,
      perimenopauseLastPeriod: intake.perimenopauseLastPeriod || null,
      ttcDuration: intake.ttcDuration || null,
      leakConcern,
      mentionedLifeStages: freeText.stored.filter((s) => s.field === 'mentioned_life_stage').map((s) => s.value),
    },
    experience: { history, priceSensitivitySignals, usageBurdenSignals },
    shopping: {
      formats: { preferred: preferredFormats, noPreference: formatNoPreference || (!preferredFormats.length), disliked: dislikedFormats, strict: strictFormats, unresolved: customFormats },
      budget,
      priceNotImportant: notImportant,
      largePurchaseFrequency: intake.largePurchaseFrequency || null,
      priceSensitivity: priceSensitivitySignals,
      brandOpenness,
      brandExploration: BRAND_EXPLORATION[brandOpenness] ?? 0.5,
      trustedBrands,
      positiveMentions,
      leaveOut,
      shouldBe,
      fsaHsa,
      picksPerNeed,
      // First quiz "comfortable with internal products?" = No: a stated hard preference.
      declinesInternal: intake.internalComfort === 'No',
    },
    trust: { ranking, weights: trustWeights, touched },
    access: { zip: zipMatch ? zipMatch[1] : null, fsaHsa },
    behavior,
    freeText,
  };
}

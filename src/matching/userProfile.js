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
//
// Every signal carries { source, explicit, confidence }. Explicit answers
// always beat inferred ones; behavior never writes health context.
// Unknown stays unknown: `answers` records, per question, whether it was
// answered, explicitly answered "no"/"none", "not sure", "prefer not to
// say", or skipped, and the scorer treats each state differently.

import {
  needIdForOption, NON_NEED_OPTIONS, NEED_BY_ID, canonicalize, CONDITION_ID_BY_OPTION, CONDITION_ID_BY_LEGACY, NON_CONDITION_OPTIONS,
  LIFE_STAGE_ID_BY_OPTION, LIFE_STAGE_COMPATIBILITY, ageBandFor, UNUSUAL_AGE_FOR_STAGE, FORMAT_ID_BY_OPTION, LEAVE_OUT_BY_OPTION,
  VALUE_ID_BY_OPTION, ALLERGEN_BY_OPTION, ALLERGEN_BY_ID, PCOS_REINFORCING_NEEDS, URINARY_UTI_NEEDS, MENSTRUAL_PRODUCT_NEEDS, POSTPARTUM_NEEDS,
  normalizeText, LEGACY_FRUSTRATION_NEEDS, LEGACY_CONCERN_NEEDS, LEGACY_SYMPTOM_NEEDS, LEGACY_PREFERENCE, LEGACY_SENSITIVITY_ALLERGEN,
  CONTEXTS, LIFE_STAGE_BY_ID, needKind,
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
// same: change for the SAME product. similar: change for similar products,
// where "similar" is judged on the facet the reason is about (productSimilarity
// in productProfile.js): health function / mechanism for "helped" or "did not
// help", ingredients / materials for reactions, format for "did not like the
// format", price for "too expensive". dimension: which part of the score the
// effect moves. A stop reason never moves health relevance unless it is about
// health ("did not help", "stopped working").
// hardSuppress/exclude remove the same product entirely. No rule ever infers
// which ingredient caused a reaction.
export const EXPERIENCE_EFFECTS = {
  outcome: {
    helped_a_lot: { same: +0.4, similar: +0.12, dimension: 'health', facet: 'mechanism', note: 'reorder candidate' },
    helped_somewhat: { same: +0.25, similar: +0.06, dimension: 'health', facet: 'mechanism' },
    no_difference: { same: -0.45, similar: -0.15, dimension: 'health', facet: 'mechanism', note: 'near duplicates down' },
    made_worse: { same: 0, similar: -0.2, dimension: 'safety', facet: 'ingredients', hardSuppress: true, note: 'shared formulations down' },
    not_sure: { same: 0, similar: 0, dimension: 'health', facet: 'mechanism' },
  },
  reaction: {
    none: { same: 0, similar: 0, dimension: 'safety', facet: 'ingredients' },
    mild: { same: -0.55, similar: -0.08, dimension: 'safety', facet: 'ingredients', similarCaution: true, note: 'same product strongly down; similar products get a caution' },
    serious: { same: 0, similar: 0, dimension: 'safety', facet: 'ingredients', exclude: true, safetyFlag: true, note: 'exclude same product; no ingredient inference' },
    not_sure: { same: -0.1, similar: 0, dimension: 'safety', facet: 'ingredients' },
  },
  stop: {
    did_not_help: { same: -0.35, similar: -0.1, dimension: 'health', facet: 'mechanism' },
    stopped_working: { same: -0.2, similar: -0.05, dimension: 'health', facet: 'mechanism' },
    reaction: { same: -0.5, similar: 0, dimension: 'safety', facet: 'ingredients', safetyFlag: true },
    too_expensive: { same: -0.05, similar: 0, dimension: 'price', facet: 'price', priceSensitivity: 1 },
    inconvenient: { same: -0.05, similar: 0, dimension: 'effort', facet: 'effort', usageBurden: 1 },
    format_dislike: { same: -0.1, similar: 0, dimension: 'format', facet: 'format', formatDislike: true },
    found_better: { same: -0.15, similar: 0, dimension: 'general', facet: null },
    clinician_stop: { same: 0, similar: 0, dimension: 'safety', facet: null, hardSuppress: true },
    did_not_repurchase: { same: -0.05, similar: 0, dimension: 'general', facet: null },
  },
};

// RECENCY (spec B). Answers age. Time-sensitive answers lose weight or
// confidence as they get older; nothing is silently rewritten.
//   days after which an answer is "stale" (confidence lower) and the
//   confidence factor applied to products that depend on it.
export const RECENCY_RULES = {
  pregnancy: { staleAfterDays: 280, factor: 0.8 },
  postpartum: { staleAfterDays: 365, factor: 0.9 },
  medications: { staleAfterDays: 180, factor: 0.9 },
  needs: { staleAfterDays: 180, factor: 0.92 },
  budget: { staleAfterDays: 365, factor: 0.95 },
};
const DAY_MS = 86400000;
function toTime(v) {
  if (v == null || v === '' || v === true) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? (v < 1e12 ? v * 1000 : v) : null;
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'object') return toTime(v.at ?? v.savedAt ?? v.updatedAt ?? v.createdAt ?? v.timestamp ?? v.date ?? null);
  const t = Date.parse(String(v));
  return Number.isFinite(t) ? t : null;
}

// BEHAVIOR (spec B). Shopping taste only; never health context.
// weight: effect on ranking (and at most a couple of displayed points);
// halfLifeDays: time decay. A random view barely matters; saves, purchases
// and reorders matter more; negative actions teach different things.
export const BEHAVIOR_WEIGHTS = {
  reordered: { weight: 1.0, halfLifeDays: 365 },
  purchased: { weight: 0.8, halfLifeDays: 180 },
  saved: { weight: 0.5, halfLifeDays: 120 },
  clicked: { weight: 0.08, halfLifeDays: 30 },
  viewed: { weight: 0.04, halfLifeDays: 30 },
  unsaved: { weight: -0.3, halfLifeDays: 90 },
  skipped: { weight: -0.1, halfLifeDays: 60 },
  quickExit: { weight: -0.15, halfLifeDays: 45 },
  returned: { weight: -0.6, halfLifeDays: 365 },
  // hidden / "Not for me" is a hard suppression, not a weight.
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

const NOT_SURE_RE = /not sure|unsure|don't know|do not know/i;
const PREFER_NOT_RE = /prefer not/i;

/** Answer state for a single-choice question. */
function singleState(value, { no = [], notSure = [], preferNot = [] } = {}) {
  const v = String(value ?? '').trim();
  if (!v) return 'skipped';
  if (no.includes(v)) return 'explicit_no';
  if (preferNot.includes(v) || PREFER_NOT_RE.test(v)) return 'prefer_not';
  if (notSure.includes(v) || NOT_SURE_RE.test(v)) return 'not_sure';
  return 'answered';
}

/**
 * Behavior events -> { id: { saved: weight, ... } } with time decay.
 * Each signal accepts an id array, a Set, a product array, or { id: truthy | timestamp | { at } } map.
 */
function behaviorEvents(b, now) {
  const out = new Map();
  const add = (kind, id, at) => {
    if (!id) return;
    const rule = BEHAVIOR_WEIGHTS[kind];
    const t = toTime(at);
    const ageDays = t != null && now != null ? Math.max(0, (now - t) / DAY_MS) : null;
    const decay = ageDays == null ? 1 : 0.5 ** (ageDays / rule.halfLifeDays);
    const row = out.get(String(id)) || {};
    row[kind] = (row[kind] || 0) + rule.weight * decay;
    out.set(String(id), row);
  };
  for (const kind of Object.keys(BEHAVIOR_WEIGHTS)) {
    const v = b[kind];
    if (!v) continue;
    if (v instanceof Set) v.forEach((id) => add(kind, id, null));
    else if (Array.isArray(v)) v.forEach((x) => (x && typeof x === 'object' ? add(kind, x.id ?? x.productId, x) : add(kind, x, null)));
    else if (typeof v === 'object') {
      for (const [id, val] of Object.entries(v)) {
        if (!val) continue;
        if (kind === 'viewed' || kind === 'clicked') {
          // { id: count } (legacy) or { id: timestamp | { at } }
          if (typeof val === 'number' && val < 1e6) { for (let k = 0; k < Math.min(val, 5); k += 1) add(kind, id, null); } else add(kind, id, val);
        } else add(kind, id, val);
      }
    }
  }
  return out;
}

/**
 * Build the layered profile.
 * @param {object} intakeInput intake state, buildSnapshot() output, or quizAnswers with fullHealthIntake
 * @param {{ behavior?: object, catalog?: object[], now?: number|Date }} [options]
 *   behavior: { viewed, clicked, saved, unsaved, hidden, purchased, reordered, skipped, quickExit, returned, purchasedPrices }
 *     each an id list or { id: true | timestamp | { at } } map (timestamps enable time decay)
 *   catalog: product list used to resolve names typed in history / avoid list
 *   now: clock for recency (defaults to Date.now())
 */
export function buildUserProfile(intakeInput, options = {}) {
  const intake = unwrap(intakeInput);
  const catalog = options.catalog || [];
  const now = toTime(options.now) ?? Date.now();
  const knownNames = catalog.flatMap((p) => [p.name, p.brand]).filter(Boolean);
  const signals = [];
  const signal = (layer, id, source, explicit, confidence, extra = {}) => signals.push({ layer, id, source, explicit, confidence, ...extra });

  // Recency: when the intake was answered (per-answer stamps when present).
  const answeredAt = toTime(intake.personalizationCompletedAt ?? intake.completedAt ?? intake.updatedAt ?? intakeInput?.personalizationCompletedAt ?? null);
  const answerAgeDays = answeredAt != null ? Math.max(0, Math.round((now - answeredAt) / DAY_MS)) : null;
  const stale = (key) => answerAgeDays != null && answerAgeDays > RECENCY_RULES[key].staleAfterDays;

  // Free text first: several layers read it.
  const freeTextSources = [intake.anythingElse].filter(Boolean);
  const freeText = summarizeFreeText(extractFreeText(freeTextSources.join('. '), { knownNames }));

  // ── Health intent ────────────────────────────────────────────────────
  // Needs are only what she selected or typed. Never inferred from the UI
  // section an option sits in, from age, from a diagnosis or from behavior.
  const needs = [];
  const unresolvedNeeds = [];
  const addNeed = (id, source, raw, confidence = 1, extra = {}) => {
    if (!id || needs.some((n) => n.id === id)) return;
    const explicit = source === 'selected' || source === 'legacy' || (source === 'custom' && confidence >= 0.9) || source === 'free_text';
    needs.push({ id, source, raw, confidence, explicit, kind: needKind(id), label: NEED_BY_ID[id]?.option || NEED_BY_ID[id]?.phrase || id, modifiers: {}, intensity: null, ...extra });
    signal('health', id, source, explicit, confidence);
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

  // ── Conditions (explicit only) ───────────────────────────────────────
  // Only what she selected under "Diagnosed with?" (or typed there with high
  // confidence, or imported). Never derived from symptom combinations.
  const conditions = [];
  const addCondition = (id, source, raw, confidence = 1) => {
    if (id && !conditions.some((c) => c.id === id)) { conditions.push({ id, source, raw, confidence, explicit: true }); signal('condition', id, source, true, confidence); }
  };
  const diagnosisSel = arr(intake.diagnosisSelections);
  for (const option of diagnosisSel) {
    if (NON_CONDITION_OPTIONS.has(option)) continue;
    const id = CONDITION_ID_BY_OPTION[option];
    if (id) addCondition(id, 'selected', option);
    else {
      const c = canonicalize(option, { kinds: ['condition'] });
      if (c.canonical_id && c.confidence >= 0.9) addCondition(c.canonical_id, 'custom', option, c.confidence);
    }
  }
  if (!diagnosisSel.length) {
    for (const legacy of arr(intake.conditions)) {
      const id = CONDITION_ID_BY_LEGACY[String(legacy).toLowerCase()];
      if (id) addCondition(id, 'legacy', legacy);
    }
  }
  for (const text of splitList(intake.conditionOtherText)) {
    const c = canonicalize(text, { kinds: ['condition'] });
    if (c.canonical_id && c.confidence >= 0.9) addCondition(c.canonical_id, 'custom', text, c.confidence);
  }
  const conditionIds = new Set(conditions.map((c) => c.id));
  const conditionsState = diagnosisSel.includes('Prefer not to say') && !conditions.length ? 'prefer_not'
    : diagnosisSel.includes('None that I know of') && !conditions.length ? 'explicit_no'
      : conditions.length ? 'answered' : diagnosisSel.length || arr(intake.conditions).length ? 'answered' : 'skipped';

  // ── Physiology (life stages explicit only) ───────────────────────────
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
  lifeStages.forEach((id) => signal('life_stage', id, 'selected', true, 1));
  const lifeStageState = lifeStages.length || customLifeStages.length ? 'answered' : 'skipped';
  const breastfeeding = intake.breastfeedingStatus === 'Yes' ? 'yes' : intake.breastfeedingStatus === 'No' ? 'no' : 'unknown';
  const stageSet = new Set([...lifeStages, ...(breastfeeding === 'yes' ? ['breastfeeding'] : [])]);

  const confidenceFlags = [];
  const combos = [];
  for (const rule of LIFE_STAGE_COMPATIBILITY) {
    if (rule.stages.every((st) => stageSet.has(st))) combos.push({ stages: rule.stages, verdict: rule.verdict });
  }
  const conflictingStages = new Set(combos.filter((c) => c.verdict === 'needs_clarification').flatMap((c) => c.stages));
  if (conflictingStages.size) confidenceFlags.push('needs_clarification');
  const ageStageFlags = lifeStages.filter((st) => age != null && UNUSUAL_AGE_FOR_STAGE[st]?.(age));
  if (ageStageFlags.length) confidenceFlags.push('unusual_combination');

  let flow = Object.prototype.hasOwnProperty.call(FLOW_BY_OPTION, intake.periodFlow) ? FLOW_BY_OPTION[intake.periodFlow] : null;
  if (!flow && intake.flowLevel) flow = LEGACY_FLOW[String(intake.flowLevel).toLowerCase()] || null;
  const pain = PAIN_INTENSITY[intake.periodPain] ?? null;
  const utiFrequency = UTI_FREQUENCY_BY_OPTION[intake.utiFrequency] ?? null;
  let postpartumTiming = POSTPARTUM_TIMING_BY_OPTION[intake.postpartumTiming] ?? null;
  // Postpartum timing is an explicit answer about elapsed time; it advances
  // with the calendar (arithmetic on her answer, not an inference).
  if (postpartumTiming && answerAgeDays) postpartumTiming = advancePostpartum(postpartumTiming, answerAgeDays);
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

  // ── Pregnancy status (safety-critical) ───────────────────────────────
  //   pregnant      she selected "I am pregnant" or answered a trimester
  //   reported      she typed it, or chose a pregnancy-related discomfort need
  //   not_indicated she answered the life-stage question without pregnancy
  //   unknown       she skipped it
  const reportedStages = freeText.reported_contexts.filter((r) => r.weight >= 1).map((r) => r.stage);
  const pregnancyStatus = lifeStages.includes('pregnant') || [1, 2, 3].includes(trimester) ? 'pregnant'
    : reportedStages.includes('pregnant') || needIds.has('pregnancy.discomfort') ? 'reported'
      : lifeStageState === 'answered' ? 'not_indicated' : 'unknown';
  const pregnant = pregnancyStatus === 'pregnant';

  // ── Contexts (explicit only; unlock CONTEXTUAL product relationships) ─
  const contexts = {};
  for (const [ctxId, def] of Object.entries(CONTEXTS)) {
    const sources = [];
    for (const st of def.stages || []) {
      if (stageSet.has(st) && !conflictingStages.has(st)) sources.push({ type: 'life_stage', id: st, strength: 1, phrase: st === 'breastfeeding' ? 'breastfeeding' : LIFE_STAGE_BY_ID[st]?.phrase || st });
    }
    for (const c of def.conditions || []) if (conditionIds.has(c)) sources.push({ type: 'condition', id: c, strength: 1, phrase: def.phrase });
    for (const [needId, strength] of Object.entries(def.needs || {})) if (needIds.has(needId)) sources.push({ type: 'need', id: needId, strength, phrase: NEED_BY_ID[needId]?.phrase || needId });
    for (const st of def.freeText || []) if (reportedStages.includes(st)) sources.push({ type: 'free_text', id: st, strength: 0.9, phrase: st === 'breastfeeding' ? 'breastfeeding' : LIFE_STAGE_BY_ID[st]?.phrase || st });
    if (ctxId === 'pregnancy' && [1, 2, 3].includes(trimester) && !lifeStages.includes('pregnant')) sources.push({ type: 'answer', id: 'trimester', strength: 1, phrase: 'pregnancy' });
    if (ctxId === 'postpartum' && postpartumTiming && postpartumTiming !== 'gt_12m' && !lifeStages.includes('postpartum')) sources.push({ type: 'answer', id: 'postpartumTiming', strength: 0.8, phrase: 'postpartum' });
    if (!sources.length) continue;
    sources.sort((a, b) => b.strength - a.strength);
    contexts[ctxId] = { id: ctxId, strength: sources[0].strength, sources, phrase: sources[0].phrase, explicit: true };
    signal('context', ctxId, sources[0].type, true, sources[0].strength);
  }

  // ── Safety ───────────────────────────────────────────────────────────
  const allergyStatus = intake.allergyStatus === 'Yes' ? 'yes' : intake.allergyStatus === 'No' ? 'no'
    : NOT_SURE_RE.test(String(intake.allergyStatus || '')) ? 'unsure' : 'unknown';
  const allergies = [];
  const unresolvedAllergies = [];
  const allergyItems = allergyStatus === 'yes' ? arr(intake.allergyItems).length ? arr(intake.allergyItems) : arr(intake.allergies) : [];
  for (const raw of allergyItems) {
    const def = ALLERGEN_BY_OPTION[raw];
    if (def) { allergies.push({ ...def, raw, source: 'selected', explicit: true, confidence: 1 }); continue; }
    const c = canonicalize(raw, { kinds: ['allergen'] });
    if (c.canonical_id && c.confidence >= 0.9) allergies.push({ ...ALLERGEN_BY_ID[c.canonical_id], raw, source: 'custom', canonical: c, explicit: true, confidence: c.confidence });
    else unresolvedAllergies.push(c);
  }
  // First quiz: "sensitivities" (and sensitivity labels inside productsToAvoid) are allergy-equivalent.
  if (!allergyItems.length && allergyStatus !== 'no') {
    for (const raw of [...arr(intake.sensitivities), ...arr(intake.productsToAvoid)]) {
      const id = LEGACY_SENSITIVITY_ALLERGEN[raw];
      if (id && !allergies.some((x) => x.id === id)) allergies.push({ ...ALLERGEN_BY_ID[id], raw, source: 'legacy', explicit: true, confidence: 1 });
    }
  }
  const contradictions = [];
  for (const a of freeText.explicit_allergies) {
    if (allergyStatus === 'no') contradictions.push({ code: 'allergy_no_vs_free_text', affects: ['safety'], text: `You answered no allergies but also wrote that you are allergic to ${a.id.replace(/_/g, ' ')}. We kept the allergy to be safe.` });
    if (!allergies.some((x) => x.id === a.id)) allergies.push({ ...ALLERGEN_BY_ID[a.id], raw: a.id, source: 'free_text_explicit', explicit: true, confidence: 0.95 });
  }
  allergies.forEach((a) => signal('safety', `allergy:${a.id}`, a.source, true, a.confidence ?? 1));

  const meds = [];
  const takesCurrent = String(intake.takesCurrent || '');
  if (takesCurrent === 'Yes' || (!takesCurrent && arr(intake.currentMedicationItems).length)) {
    for (const raw of arr(intake.currentMedicationItems)) meds.push({ ...normalizeMedication(raw), source: 'selected' });
  }
  if (lifeStages.includes('hormonal_birth_control') && !meds.some((m) => m.all_classes.includes('hormonal_contraceptive'))) {
    meds.push({ ...normalizeMedication('hormonal contraceptive (unspecified)'), raw: 'Hormonal birth control (life stage)', source: 'life_stage' });
  }
  const medicationsState = takesCurrent === 'Yes' || arr(intake.currentMedicationItems).length ? 'answered'
    : takesCurrent === 'No' ? 'explicit_no' : takesCurrent ? singleState(takesCurrent) : 'skipped';
  meds.forEach((m) => signal('safety', `medication:${m.generic || m.raw}`, m.source, true, m.recognized ? 1 : 0.5));

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
  const usageBurdenSignals = history.reduce((n, h) => n + h.effects.reduce((m, e) => m + (e.usageBurden || 0), 0), 0)
    + (freeText.effort_sensitivity ? freeText.effort_sensitivity.weight : 0);

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
  // Explicit selections beat free text: a typed dislike of a format she
  // selected as preferred is recorded as a contradiction and not applied.
  const dislikedFormats = [];
  for (const d of freeText.format_dislikes) {
    if (preferredFormats.includes(d.id)) {
      contradictions.push({ code: 'format_preferred_vs_free_text', affects: ['format'], text: 'You picked a format you also wrote that you dislike. We used your selection.' });
      continue;
    }
    dislikedFormats.push({ id: d.id, weight: d.weight, source: 'free_text' });
  }
  for (const h of history) {
    if (h.stopReasons.includes('format_dislike') && h.resolvedProduct) {
      // Format is read from the resolved product at scoring time; record the product id.
      dislikedFormats.push({ fromProductId: h.resolvedProductId, weight: 1, source: 'history' });
    }
  }
  const strictFormats = freeText.format_only.filter((f) => f.weight >= 1).map((f) => f.id);
  // Soft format preference learned from product history (only used when she
  // stated no format preference): formats of products that helped vs ones she
  // stopped for format, cost or burden reasons. Learned, so weight 0.5.
  const learnedFormats = { liked: [], disliked: [] };
  for (const h of history) {
    if (!h.resolvedProduct) continue;
    const kind = ['helped_a_lot', 'helped_somewhat'].includes(h.outcome) ? 'liked'
      : h.stopReasons.some((r) => ['format_dislike', 'inconvenient'].includes(r)) ? 'disliked' : null;
    if (kind) learnedFormats[kind].push(h.resolvedProductId);
  }

  const ranges = arr(intake.priceRange);
  const notImportant = ranges.includes(PRICE_NOT_IMPORTANT);
  const bounds = ranges.map((r) => PRICE_RANGE_BOUNDS[r]).filter(Boolean);
  let budget = null;
  if (bounds.length && !notImportant) budget = { min: Math.min(...bounds.map((b) => b[0])), max: Math.max(...bounds.map((b) => b[1])), source: 'selected' };
  else if (!notImportant && freeText.max_price && freeText.max_price.weight >= 1) budget = { min: 0, max: freeText.max_price.value, source: 'free_text' };
  if (notImportant && bounds.length) {
    // Both "not a major factor" and a range: "not a major factor" is the
    // broader statement, so price is not scored; the conflict is recorded.
    contradictions.push({ code: 'budget_range_vs_not_important', affects: ['price'], text: 'You chose a budget and also said price is not a major factor, so we did not rank by price.' });
  }
  if (budget?.source === 'selected' && freeText.max_price?.weight >= 1 && freeText.max_price.value < budget.max) {
    contradictions.push({ code: 'budget_range_vs_free_text', affects: ['price'], text: 'The price limit you typed is lower than the range you picked. We used the range you picked.' });
  }
  const budgetState = budget ? 'answered' : notImportant ? 'explicit_no' : 'skipped';

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
  for (const sb of freeText.should_be) if (!shouldBe.some((x) => x.id === sb.id)) shouldBe.push({ id: sb.id, raw: sb.id, weight: sb.weight, source: 'free_text' });
  for (const sb of freeText.sensitivities) if (!shouldBe.some((x) => x.id === sb.id)) shouldBe.push({ id: sb.id, raw: sb.id, weight: sb.weight, source: 'free_text' });
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

  // ── Behavior (shopping taste only; never health context) ─────────────
  const b = options.behavior || {};
  const events = behaviorEvents(b, now);
  const behavior = {
    events,
    viewed: { ...(b.viewed && typeof b.viewed === 'object' && !Array.isArray(b.viewed) ? b.viewed : {}) },
    saved: new Set(idList(b.saved)),
    hidden: new Set(idList(b.hidden)),
    purchased: new Set(idList(b.purchased)),
    reordered: new Set(idList(b.reordered)),
    // Prices of past purchases (numbers). Used only to soften the budget curve a little.
    purchasedPrices: arr(b.purchasedPrices).map(Number).filter(Number.isFinite),
  };

  const urgent = intake.safetyConcern === 'Yes' ? 'yes' : intake.safetyConcern === 'Not sure' ? 'not_sure' : intake.safetyConcern === 'No' ? 'no' : null;

  // ── Contradictions between explicit answers (spec B) ─────────────────
  const periodNeeds = needs.filter((n) => MENSTRUAL_PRODUCT_NEEDS.has(n.id) || n.id === 'pain.menstrual_cramp').map((n) => n.id);
  if (periodNeeds.length && ['menopause', 'postmenopause'].some((st) => lifeStages.includes(st))) {
    contradictions.push({ code: 'period_need_vs_stage', affects: periodNeeds, text: 'You asked for period support and also chose menopause or post-menopause. Bleeding after menopause is worth raising with a clinician.' });
  }
  if ((needIds.has('fertility.ttc') || lifeStages.includes('ttc')) && lifeStages.includes('postmenopause')) {
    contradictions.push({ code: 'ttc_vs_postmenopause', affects: ['fertility.ttc'], text: 'Trying to conceive and post-menopause do not usually go together.' });
  }
  if (trimester && !lifeStages.includes('pregnant') && ['menopause', 'postmenopause', 'no_periods'].some((st) => lifeStages.includes(st))) {
    contradictions.push({ code: 'trimester_vs_stage', affects: ['safety'], text: 'You shared a pregnancy trimester and a stage that does not usually go with pregnancy.' });
  }
  for (const combo of combos.filter((c) => c.verdict === 'needs_clarification')) {
    contradictions.push({ code: 'life_stage_pair', affects: ['context'], stages: combo.stages, text: 'Some life stages you chose do not usually go together.' });
  }

  // ── Answer states (spec C) ───────────────────────────────────────────
  const answers = {
    age: age != null ? 'answered' : 'skipped',
    lifeStage: lifeStageState,
    zip: zipMatch ? 'answered' : 'skipped',
    support: needs.length ? 'answered' : nothingRightNow ? 'explicit_no' : 'skipped',
    periodFlow: singleState(intake.periodFlow, { notSure: ['Not sure'] }),
    periodPain: singleState(intake.periodPain, { notSure: ['Not sure'], no: ['None'] }),
    utiFrequency: singleState(intake.utiFrequency, { notSure: ['Not sure'] }),
    pregnancyTrimester: singleState(intake.pregnancyTrimester, { notSure: ['Not sure'], preferNot: ['Prefer not to say'] }),
    breastfeeding: singleState(intake.breastfeedingStatus, { no: ['No'], preferNot: ['Prefer not to say'] }),
    conditions: conditionsState,
    allergies: allergyStatus === 'yes' ? 'answered' : allergyStatus === 'no' ? 'explicit_no' : allergyStatus === 'unsure' ? 'not_sure' : allergies.length ? 'answered' : 'skipped',
    medications: medicationsState,
    history: history.length ? 'answered' : 'skipped',
    urgent: urgent === 'yes' || urgent === 'no' ? 'answered' : urgent === 'not_sure' ? 'not_sure' : 'skipped',
    formats: preferredFormats.length ? 'answered' : formatNoPreference ? 'explicit_no' : 'skipped',
    budget: budgetState,
    brands: trustedBrands.length ? 'answered' : brandOpenness === 'No preference' ? 'explicit_no' : brandOpenness ? 'answered' : 'skipped',
    values: shouldBe.length || leaveOut.length ? 'answered' : arr(intake.avoidIngredients).includes('No preference') ? 'explicit_no' : 'skipped',
    fsaHsa: fsaHsa === 'unsure' ? 'not_sure' : fsaHsa === 'none' ? 'explicit_no' : fsaHsa ? 'answered' : 'skipped',
    trust: touched ? 'answered' : 'skipped',
  };
  // Profile completeness: share of the core questions answered (any
  // informative state). Used for confidence and personalization depth only,
  // NEVER multiplied into a match.
  const CORE = ['age', 'lifeStage', 'support', 'conditions', 'allergies', 'medications', 'history', 'urgent', 'formats', 'budget', 'brands', 'values', 'trust'];
  const completeness = Math.round((CORE.filter((k) => ['answered', 'explicit_no'].includes(answers[k])).length / CORE.length) * 100) / 100;

  const recency = {
    answeredAt, answerAgeDays,
    stale: Object.fromEntries(Object.keys(RECENCY_RULES).map((k) => [k, stale(k)])),
  };

  return {
    version: 2,
    answers,
    completeness,
    signals,
    contradictions,
    contexts,
    recency,
    healthIntent: { needs, unresolvedNeeds, nothingRightNow, reinforcement },
    safety: {
      pregnant,
      pregnancyStatus,
      trimester,
      breastfeeding,
      ttc: lifeStages.includes('ttc') || needIds.has('fertility.ttc'),
      allergyStatus,
      allergies,
      unresolvedAllergies,
      medications: meds,
      medicationsState,
      conditions,
      conditionsState,
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
      reportedStages,
      mentionedLifeStages: freeText.stored.filter((st) => st.field === 'mentioned_life_stage').map((st) => st.value),
    },
    experience: { history, priceSensitivitySignals, usageBurdenSignals, learnedFormats },
    shopping: {
      formats: { preferred: preferredFormats, noPreference: formatNoPreference || (!preferredFormats.length), explicitNoPreference: formatNoPreference, disliked: dislikedFormats, strict: strictFormats, unresolved: customFormats },
      budget,
      priceNotImportant: notImportant,
      largePurchaseFrequency: intake.largePurchaseFrequency || null,
      priceSensitivity: priceSensitivitySignals,
      usageBurden: usageBurdenSignals,
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

function idList(v) {
  if (!v) return [];
  if (v instanceof Set) return [...v].map(String);
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' ? x.id ?? x.productId : x)).filter(Boolean).map(String);
  if (typeof v === 'object') return Object.keys(v).filter((k) => v[k]);
  return [String(v)];
}

const PP_ORDER = ['lt_6w', '6w_3m', '3_6m', '6_12m', 'gt_12m'];
const PP_START_DAYS = { lt_6w: 0, '6w_3m': 42, '3_6m': 91, '6_12m': 182, gt_12m: 365 };
function advancePostpartum(bucket, elapsedDays) {
  const start = PP_START_DAYS[bucket];
  if (start == null) return bucket;
  const days = start + elapsedDays;
  return [...PP_ORDER].reverse().find((b) => days >= PP_START_DAYS[b]) || bucket;
}


// Per-need scoring.
//
// THE RULE (founder spec C): missing data must never equal a bad match.
// Score only on signals that are both KNOWN and APPLICABLE to the product.
// Missing information lowers confidence, not relevance, except when it is
// required to establish safety (then the product is "restricted", it does
// not get a low number).
//
// Separate outputs per product x need (spec C):
//   relevance      does it address what she asked for? (0..100)
//   preferenceFit  does it fit how she likes to shop/use products? (0..1, null when nothing known)
//   safety         eligible / restricted (insufficient information) / excluded, cautions, blocked claims
//   evidence       product-specific vs ingredient-only vs guideline, matched to THIS need (claim level)
//   confidence     how much useful information we had (0..1 + level). NEVER multiplied into the match.
//   access         separate (computeAccess), never in the match.
//
// DISPLAYED MATCH (0..100) =
//   R x (1 - PREFERENCE_SPAN x (1 - P))       relevance-anchored, preferences conditional
//   + experience points (her history with this or truly similar products, max +-20)
//   + behavior points (saves / purchases / reorders, time-decayed, max +-2)
//   then x eligibility (excluded = 0). Clamped 0..99.
// where
//   R = 95 x health x (0.9 + 0.1 x focus)     health 0..1.05 (relevance level + explicit-context
//                                             multipliers + flow / pain / UTI / postpartum modifiers)
//   P = weighted average over KNOWN preference dimensions only (dynamic denominator):
//       context fit, format, values, brand, trust-weighted evidence, price, effort.
//       A skipped question is not in the denominator. When none are known, P = 1
//       (no penalty), so skipping budget, brands or formats never lowers a match.
// Profile completeness is never part of the match.
//
// Tiers: excellent >= 80, strong >= 65, exploratory >= 50, browse < 50.
// ZIP never enters this score. FSA/HSA never enters this score (tie-break only).

import { conditionRulesFor } from './conditionRules.js';
import { NEED_BY_ID, needPhrase, canonicalNeedId, CONDITION_PATHWAYS, CONDITION_SUPPORT_NEED, URINARY_UTI_NEEDS, MENSTRUAL_PRODUCT_NEEDS, ATTRIBUTE_PHRASE, LIFE_STAGE_BY_ID, CONTEXTS, isCyclePremisedNeed } from './ontology.js';
import { buildProductProfile, normalizeBrand, CONTEXT_BONUS, productSimilarity, CYCLE_DEPENDENT_RULES, CYCLE_TRACKING_RULES } from './productProfile.js';
import { checkMedicationInteractions, INTERACTION_TABLE } from './medications.js';
import { normalizeName } from './userProfile.js';

// Preference dimension weights (only known + applicable ones count).
export const DIMENSION_WEIGHTS = { context: 3, format: 2, values: 2, price: 2, evidence: 2, brand: 1, effort: 1 };
/** @deprecated kept for older imports; the match is no longer a fixed-weight sum. */
export const WEIGHTS = DIMENSION_WEIGHTS;
export const PREFERENCE_SPAN = 0.35;
export const RELEVANCE_SCALE = 95;
export const MAX_SCORE = 99;
export const EXPERIENCE_POINTS = { scale: 20, cap: 20, similarCap: 6, minFacetSimilarity: 0.5 };
export const BEHAVIOR_POINTS = 2;
/** @deprecated no neutral values are used any more: unknown dimensions are left out. */
export const NEUTRAL = {};

export const TIERS = [
  { id: 'excellent', min: 80 },
  { id: 'strong', min: 65 },
  { id: 'exploratory', min: 50 },
  { id: 'browse', min: 0 },
];
export function tierFor(score) { return TIERS.find((t) => score >= t.min).id; }
export function confidenceLevel(c) { return c >= 0.75 ? 'high' : c >= 0.5 ? 'medium' : 'limited'; }

// Confidence factors (multiplied together, floor 0.2). They describe how
// sure we are; they never change the displayed match.
export const CONFIDENCE_PENALTIES = {
  allergen_unknown: 0.85,
  allergen_variant: 0.85,
  broad_allergy_class: 0.85,
  unresolved_allergy: 0.9,
  allergy_status_unsure: 0.95,
  allergy_status_unknown: 0.95,
  leave_out_unknown: 0.92,
  medication_caution: 0.85,
  condition_caution: 0.85,
  medication_unknown: 0.9,
  medications_not_shared: 0.85,
  pregnancy_unknown: 0.8,
  pregnancy_caution: 0.85,
  pregnancy_status_unknown: 0.85,
  pregnancy_reported: 0.85,
  ttc_pregnancy_contraindicated: 0.85,
  ttc_pregnancy_unknown: 0.92,
  breastfeeding_caution: 0.85,
  breastfeeding_unknown: 0.9,
  urgent_not_sure_high_risk: 0.9,
  low_metadata: 0.9,
  catalog_freshness_unknown: 0.97,
  catalog_stale: 0.9,
  unusual_combination: 0.97,
  stage_needs_clarification: 0.9,
  pain_varies: 0.95,
  similar_reaction_caution: 0.95,
  flow_contradiction: 0.85,
  answer_contradiction: 0.9,
  stale_answers: 0.92,
  stale_pregnancy: 0.8,
  stale_medications: 0.9,
  interpretation_uncertain: 0.9,
  age_unknown_age_limited: 0.95,
  restricted: 0.6,
  // Product passport (src/data/passport): data quality lowers confidence, never the match.
  passport_critical_gaps: 0.95,
  passport_incomplete: 0.92,
  passport_stale: 0.97, // stale is no better than never verified (catalog_freshness_unknown)
  medication_label_interaction: 0.85,
};

// Passport completeness below this lowers confidence (passport_incomplete).
export const PASSPORT_COMPLETENESS_FLOOR = 60;

// Specificity by relationship of the product to this exact need.
const SPECIFICITY_BASE = { direct: 1, strong: 0.75, secondary: 0.45, adjacent: 0.2, weak: 0.05, unrelated: 0 };

// FLOW x CAPACITY fit (spec: flow mainly affects menstrual product characteristics).
export const FLOW_CAPACITY_FIT = {
  very_light: { very_light: 1, light: 0.8, regular: 0.4, high: 0.2, highest: 0.1 },
  light: { very_light: 0.7, light: 1, regular: 0.8, high: 0.4, highest: 0.2 },
  moderate: { very_light: 0.3, light: 0.6, regular: 1, high: 0.7, highest: 0.5 },
  heavy: { very_light: 0.1, light: 0.2, regular: 0.5, high: 1, highest: 1 },
  very_heavy: { very_light: 0, light: 0.1, regular: 0.3, high: 0.85, highest: 1 },
  varies: { very_light: 0.4, light: 0.6, regular: 0.8, high: 0.8, highest: 0.7 },
};

// UTI "How often?" x product care role multipliers on health relevance.
// right_now: prevention-only products must not look like a substitute for evaluation.
export const UTI_ROLE_MULTIPLIER = {
  first_time: { care: 1.15, testing: 1.15, symptom_relief: 0.9, prevention: 0.5 },
  rarely: { care: 1, testing: 1, symptom_relief: 1, prevention: 0.85 },
  recurrent: { care: 1.1, testing: 1.05, symptom_relief: 1, prevention: 1.1 },
  right_now: { care: 1.2, testing: 1.2, symptom_relief: 0.8, prevention: 0.35 },
};

// CATEGORY-SPECIFIC TRUST (spec B): "clinical evidence first" matters more
// for things she ingests or that treat something than for period underwear,
// where fit, comfort and other women's reviews carry more information.
// Multipliers on her trust weights, renormalized.
export const CATEGORY_TRUST = {
  ingested: { clinical: 1.5, community: 0.8, expert: 1 },
  treatment: { clinical: 1.4, community: 0.8, expert: 1.1 },
  period_care: { clinical: 0.6, community: 1.4, expert: 0.9 },
  apparel: { clinical: 0.6, community: 1.4, expert: 0.9 },
  device: { clinical: 1.1, community: 1.1, expert: 1 },
  service: { clinical: 1, community: 1.1, expert: 1.1 },
  other: { clinical: 1, community: 1, expert: 1 },
};

// MINIMUM REQUIRED FIELDS (spec C): safety-critical answers a product class
// needs before we personalize it. Missing -> "restricted" (insufficient
// information), never a low match. Optional unknowns never restrict.
const INTERACTION_INGREDIENTS = new Set(INTERACTION_TABLE.map((r) => r.product_ingredient));
const INTERACTION_WORDS = /interact|absorption|less effective|potency|reduce[sd]? (the )?(effect|level)|avoid (taking|use)|do not take|bleeding risk|blood thinner|anticoagul/;
export function requiredFieldsFor(pp) {
  const req = [];
  // A reviewed label or NIH fact sheet naming interactions counts like the reviewed table.
  const passportInteractions = Boolean(pp.passport?.interaction_text && INTERACTION_WORDS.test(pp.passport.interaction_text));
  if (pp.ingested && (pp.ingredient_keys.some((k) => INTERACTION_INGREDIENTS.has(k)) || passportInteractions)) req.push('medications');
  const pregnancyConcern = ['contraindicated', 'caution'].includes(pp.pregnancy.overall) || pp.safety.hormones === 'yes';
  if (pregnancyConcern && (pp.ingested || pp.formats.includes('suppository') || (pp.safety.hormones === 'yes' && pp.formats.includes('topical')))) req.push('pregnancy_status');
  return req;
}
export const REQUIRED_FIELD_TEXT = {
  medications: 'what medicines or supplements you take',
  pregnancy_status: 'whether you are pregnant (your life stage)',
  breastfeeding_status: 'whether you are breastfeeding',
};

// Product-side safety facts the passport does not have yet. When one is
// safety-critical for THIS user, the product is restricted (held back, the
// percent unchanged): unknown is never treated as safe.
export const PRODUCT_INFO_TEXT = {
  pregnancy_info: 'pregnancy safety information for this product',
  breastfeeding_info: 'breastfeeding safety information for this product',
  ingredient_list: 'a full ingredient list for this product',
  interaction_info: 'medicine interaction information for this product',
};
const HORMONE_ACTIVE_CLASSES = new Set(['hormone', 'hormone-active', 'phytoestrogen']);

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const clean = (s) => String(s).replace(/\s*[\u2014–]\s*/g, ', ');
const round3 = (x) => (x == null ? null : Math.round(x * 1000) / 1000);

function asProfile(productOrProfile) {
  if (productOrProfile && productOrProfile.health_need_relevance) return productOrProfile;
  return buildProductProfile(productOrProfile);
}

function bodyContact(pp) { return !pp.is_digital; }

function productClass(pp) {
  if (pp.is_digital || pp.access?.is_care_service) return 'service';
  if (pp.ingested) return 'ingested';
  if (pp.formats.includes('suppository') || pp.care_roles.includes('symptom_relief')) return 'treatment';
  if (pp.formats.includes('period_care')) return 'period_care';
  if (pp.formats.includes('apparel_support')) return 'apparel';
  if (pp.formats.includes('device') || pp.formats.includes('patch')) return 'device';
  return 'other';
}

// Which profile answers apply to a product class (for confidence coverage).
const APPLICABLE_ANSWERS = {
  ingested: ['lifeStage', 'medications', 'conditions', 'allergies', 'formats', 'budget', 'trust'],
  treatment: ['lifeStage', 'medications', 'allergies', 'formats', 'budget', 'trust'],
  period_care: ['lifeStage', 'allergies', 'formats', 'budget', 'values'],
  apparel: ['formats', 'budget', 'values'],
  device: ['allergies', 'formats', 'budget', 'lifeStage'],
  service: ['budget', 'zip', 'trust'],
  other: ['formats', 'budget', 'allergies'],
};

// ─── Safety ─────────────────────────────────────────────────────────────────
function sameProduct(entry, pp) {
  return Boolean((entry.resolvedProductId && entry.resolvedProductId === pp.product_id) || (entry.normalized && entry.normalized === normalizeName(pp.name)));
}
function avoidMatches(entry, pp) {
  if (sameProduct(entry, pp)) return 'product';
  const key = entry.brandKey;
  if (!key) return null;
  if (pp.brand.key && pp.brand.key === key) return 'brand';
  if (pp.brand.id_slug && pp.brand.id_slug.length >= 3 && normalizeBrand(pp.brand.id_slug) === key) return 'brand';
  if (pp.brand.name) {
    const words = normalizeName(pp.brand.name);
    if (entry.normalized && entry.normalized.length >= 3 && ` ${words} `.includes(` ${entry.normalized} `)) return 'brand';
  }
  return null;
}

/**
 * Product-level safety for this user. Need-independent.
 * @returns {{ eligible: boolean, status: 'clear'|'caution'|'insufficient_information'|'excluded', restricted: boolean,
 *   missingFields: string[], reasons: object[], cautions: object[], penalties: object[], confirmed: object[],
 *   blockedClaims: string[], interaction: object, confidence: number }}
 */
export function evaluateSafety(productOrProfile, up) {
  const pp = asProfile(productOrProfile);
  const s = up.safety;
  const reasons = [];
  const cautions = [];
  const penalties = [];
  const confirmed = [];
  const blockedClaims = new Set();
  const missingFields = [];
  const penalize = (code, text) => penalties.push({ code, factor: CONFIDENCE_PENALTIES[code], text });

  // 0. Recalled / removed listings: suppressed regardless of personalization.
  // Passport states recalled / discontinued / unavailable count here too.
  const STATUS_TEXT = { recalled: 'This product has an active recall', discontinued: 'This product has been discontinued', unavailable: 'We could not find this product for sale right now' };
  if (pp.status && pp.status.state !== 'active') reasons.push({ code: `status_${pp.status.state}`, text: STATUS_TEXT[pp.status.state] || 'This listing is no longer available' });
  const missingProductInfo = [];
  const pk = pp.passport?.known || null; // null: no passport, nothing to add
  const bodyRoute = pp.ingested || pp.formats.includes('suppository') || pp.formats.includes('topical');
  const hormoneActive = pp.safety.hormones === 'yes' || (pp.ingredient_classes || []).some((c) => HORMONE_ACTIVE_CLASSES.has(c));

  // 1. Avoid list: absolute.
  for (const entry of s.avoid) {
    const hit = avoidMatches(entry, pp);
    if (hit === 'product') reasons.push({ code: 'avoid_list_product', text: `You asked us to avoid ${entry.raw}` });
    if (hit === 'brand') reasons.push({ code: 'avoid_list_brand', text: `You asked us to avoid ${entry.raw}` });
  }

  // 2. Same-product history: made it worse, serious reaction, clinician said stop.
  for (const h of up.experience.history) {
    if (!sameProduct(h, pp)) continue;
    if (h.effects.some((e) => e.from === 'outcome:made_worse')) reasons.push({ code: 'history_made_worse', text: 'You said this made things worse' });
    if (h.exclude) reasons.push({ code: 'history_serious_reaction', text: 'You had a serious reaction to this product' });
    if (h.effects.some((e) => e.from === 'stop:clinician_stop')) reasons.push({ code: 'history_clinician_stop', text: 'A clinician recommended you stop this product' });
  }

  // 3. Allergies and sensitivities (strongest layer).
  for (const a of s.allergies) {
    if (a.attr) {
      const d = pp.safety.details[a.attr] || { status: 'unknown' };
      const phrase = ATTRIBUTE_PHRASE[a.attr] || a.attr;
      if (d.status === 'yes') reasons.push({ code: 'allergen_conflict', attr: a.attr, text: `Contains ${phrase} (one of your sensitivities)` });
      else if (d.status === 'no') confirmed.push({ attr: a.attr, text: `${capitalize(phrase)}-free (matches your sensitivities)` });
      else if (d.status === 'unknown') {
        blockedClaims.add(`${a.attr}_free`);
        if (d.variant) {
          penalize('allergen_variant', `Some versions contain ${phrase}`);
          cautions.push({ code: 'allergen_variant', text: `Some versions contain ${phrase}. Choose the ${phrase}-free version.` });
        } else {
          penalize('allergen_unknown', `We could not confirm it is ${phrase}-free`);
          cautions.push({ code: 'allergen_unknown', text: `We could not confirm it is ${phrase}-free. Check the label.` });
        }
      }
    } else if (a.broad === 'topical' && (pp.formats.includes('topical') || pp.formats.includes('suppository'))) {
      penalize('broad_allergy_class', 'Topical sensitivity');
      cautions.push({ code: 'broad_allergy', text: 'You shared a sensitivity to topical ingredients. Check the full ingredient list.' });
    } else if (a.broad === 'ingested' && pp.ingested) {
      penalize('broad_allergy_class', 'Supplement sensitivity');
      cautions.push({ code: 'broad_allergy', text: 'You shared a sensitivity to supplements or herbal ingredients. Check the full ingredient list.' });
    } else if (a.broad === 'prescribed_care' && pp.care_roles.includes('care')) {
      cautions.push({ code: 'antibiotic_allergy', text: 'Tell the clinician about your antibiotic allergy.' });
    }
  }
  if (bodyContact(pp)) {
    for (const u of s.unresolvedAllergies) {
      penalize('unresolved_allergy', `Unrecognized allergy: ${u.raw_user_text}`);
      cautions.push({ code: 'unresolved_allergy', text: `Check the label for ${u.raw_user_text}.` });
    }
    if (s.allergyStatus === 'unsure') penalize('allergy_status_unsure', 'Allergy status not sure');
    else if (s.allergyStatus === 'unknown' && !s.allergies.length) penalize('allergy_status_unknown', 'Allergies not shared');
  }

  // 3b. A specific allergy and no ingredient list or allergen facts at all for
  //     something she swallows, inserts or puts on skin: we cannot check it.
  if (pk && bodyRoute && s.allergies.some((a) => a.attr) && !pk.ingredients && !pk.allergens) missingProductInfo.push('ingredient_list');

  // 4. Leave out (allergy-equivalent or strong = hard filter on a confirmed 'yes').
  for (const l of s.leaveOut) {
    if (l.strength === 'cosmetic') continue; // handled as a preference value
    const d = pp.safety.details[l.attr] || { status: 'unknown' };
    const phrase = ATTRIBUTE_PHRASE[l.attr] || l.attr;
    if (d.status === 'yes') reasons.push({ code: 'leave_out_conflict', attr: l.attr, text: `Contains ${phrase}, which you asked us to leave out` });
    else if (d.status === 'unknown' && bodyContact(pp)) {
      blockedClaims.add(`${l.attr}_free`);
      penalize('leave_out_unknown', `Not confirmed ${phrase}-free`);
    }
  }

  // 5. Age outside stated range. Unknown age on an age-limited product lowers confidence only.
  if (up.physiology.age != null) {
    const { minimum, maximum } = pp.age;
    if (minimum != null && up.physiology.age < minimum) reasons.push({ code: 'age_below_minimum', text: `Intended for ages ${minimum} and up` });
    if (maximum != null && up.physiology.age > maximum) reasons.push({ code: 'age_above_maximum', text: `Intended for ages up to ${maximum}` });
  } else if (pp.age.minimum != null || pp.age.maximum != null) {
    penalize('age_unknown_age_limited', 'Age not shared for an age-limited product');
  }

  // 5a. Diagnosed conditions that change what is safe (research rules).
  {
    const ids = new Set((s.conditions || []).map((c) => c.id));
    for (const r of conditionRulesFor(pp, ids)) {
      if (r.verdict === 'avoid') reasons.push({ code: 'condition_avoid', condition: r.condition, text: r.message, source: r.source_url });
      else if (r.verdict === 'caution') {
        penalize('condition_caution', r.message);
        cautions.push({ code: 'condition_caution', condition: r.condition, text: r.message, source: r.source_url });
      }
    }
  }

  // 5a-2. Vulvar symptoms + fragrance: fragrance is a common cause of vulvar
  //       irritation (ACOG; contact allergy in about a third of women with
  //       chronic vulvar complaints), so fragranced products that touch the
  //       vulva are held back for her even without a stated sensitivity.
  {
    const VULVAR = new Set(['vaginal.irritation', 'vaginal.odor', 'vaginal.discharge', 'vaginal.dryness', 'pain.sexual', 'vaginal.yeast', 'vaginal.bv']);
    const touchesVulva = ['intimate-care', 'lubricant', 'pad', 'liner', 'panty-liner', 'period-underwear', 'tampon', 'sex-tech', 'incontinence'].includes(String(pp.category || '').toLowerCase())
      || pp.formats.includes('period_care') || pp.formats.includes('suppository');
    if (touchesVulva && pp.safety.details?.fragrance?.status === 'yes' && up.healthIntent.needs.some((n) => VULVAR.has(n.id))) {
      reasons.push({ code: 'fragrance_vulvar_symptoms', text: 'Contains fragrance, a common cause of irritation for the symptoms you shared', source: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health' });
    }
  }

  // 5b. Confirmation-first products (e.g. high-dose iron) need the condition confirmed.
  //     Only applied once she has shared needs or conditions (browsing stays neutral).
  if (pp.requires_condition && (up.healthIntent.needs.length || s.conditions.length)
    && !s.conditions.some((c) => c.id === pp.requires_condition.condition)) {
    reasons.push({ code: 'requires_confirmed_condition', text: pp.requires_condition.text });
  }

  // 6. Medications: structured, reviewed table only. Unknown = penalty, never 'compatible'.
  const interaction = checkMedicationInteractions(s.medications, pp);
  if (interaction.verdict === 'avoid') {
    interaction.findings.filter((f) => f.verdict === 'avoid').forEach((f) => reasons.push({ code: 'medication_avoid', text: clean(f.message) }));
  } else if (interaction.verdict === 'caution') {
    penalize('medication_caution', 'Interaction caution');
    interaction.findings.filter((f) => f.verdict === 'caution').forEach((f) => cautions.push({ code: 'medication_caution', text: clean(f.message) }));
  }
  if (interaction.unknownPairs > 0 && interaction.verdict !== 'avoid') {
    penalize('medication_unknown', 'Interaction with your medicines not reviewed');
    blockedClaims.add('medication_compatible');
  }
  // 6b. Reviewed label / NIH interaction text that names one of her medicines.
  const labelText = pp.passport?.interaction_text || '';
  if (labelText && interaction.verdict !== 'avoid') {
    for (const m of s.medications) {
      if (m.source === 'life_stage') continue;
      const names = [m.generic, m.raw].filter((x) => x && String(x).length >= 4).map((x) => String(x).toLowerCase());
      const hit = names.find((n) => new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}s?\\b`).test(labelText));
      if (hit) {
        penalize('medication_label_interaction', `Label notes an interaction with ${m.generic || m.raw}`);
        cautions.push({ code: 'medication_label_interaction', text: `The label or NIH fact sheet notes an interaction with ${m.generic || m.raw}. Check with your clinician or pharmacist.` });
        blockedClaims.add('medication_compatible');
        break;
      }
    }
  }
  // 6c. Hormone-active product, she takes medicines, and nobody has reviewed its interactions.
  const takesMeds = s.medications.some((m) => m.source !== 'life_stage');
  if (pk && takesMeds && pp.ingested && hormoneActive && !pk.interactions && !['avoid', 'caution'].includes(interaction.verdict)) {
    missingProductInfo.push('interaction_info');
    blockedClaims.add('medication_compatible');
  }
  const required = requiredFieldsFor(pp);
  const medsUnknown = !['answered', 'explicit_no'].includes(s.medicationsState) && !s.medications.some((m) => m.source !== 'life_stage');
  if (pp.interaction_relevant && medsUnknown) {
    blockedClaims.add('medication_compatible');
    if (required.includes('medications')) missingFields.push('medications');
    else if (pp.ingested) penalize('medications_not_shared', 'Medicines not shared');
  }

  // 7. Pregnancy, TTC, breastfeeding. Status: pregnant | reported | not_indicated | unknown.
  const preg = pp.pregnancy;
  const pStatus = s.pregnancyStatus || (s.pregnant ? 'pregnant' : 'unknown');
  if (pStatus === 'pregnant' && preg.overall !== 'not_applicable') {
    const tKey = s.trimester ? `trimester_${s.trimester}` : null;
    const status = tKey && preg[tKey] ? preg[tKey] : preg.overall;
    if (status === 'contraindicated' || preg.overall === 'contraindicated') reasons.push({ code: 'pregnancy_contraindicated', text: 'Not for use during pregnancy' });
    else if (status === 'caution') {
      penalize('pregnancy_caution', 'Clinician check advised in pregnancy');
      cautions.push({ code: 'pregnancy_caution', text: 'Check with your clinician before using this in pregnancy.' });
      blockedClaims.add('pregnancy_safe');
    } else if (status === 'unknown') {
      penalize('pregnancy_unknown', 'Pregnancy safety not confirmed');
      cautions.push({ code: 'pregnancy_unknown', text: 'Pregnancy safety is not confirmed for this product. Check with your clinician.' });
      blockedClaims.add('pregnancy_safe');
    }
  } else if (pStatus === 'reported' && preg.overall !== 'not_applicable') {
    // Pregnancy came from free text or a pregnancy-related need, not the
    // life-stage answer: hold contraindicated products back as restricted
    // (not a low match) and ask her to confirm her stage.
    blockedClaims.add('pregnancy_safe');
    if (['contraindicated', 'caution'].includes(preg.overall)) {
      missingFields.push('pregnancy_status');
      cautions.push({ code: 'pregnancy_reported', text: preg.overall === 'contraindicated' ? 'Not for use during pregnancy. Confirm your life stage so we can check this for you.' : 'Check with your clinician before using this in pregnancy.' });
    } else penalize('pregnancy_reported', 'Pregnancy mentioned, not confirmed in your life stage');
  } else if (pStatus === 'unknown' && preg.overall !== 'not_applicable' && !preg.pregnantOnly) {
    blockedClaims.add('pregnancy_safe');
    if (required.includes('pregnancy_status')) missingFields.push('pregnancy_status');
    else if (preg.overall === 'contraindicated') {
      penalize('pregnancy_status_unknown', 'Not for pregnancy, and your life stage was not shared');
      cautions.push({ code: 'pregnancy_status_unknown', text: 'Not for use during pregnancy.' });
    } else if (pp.ingested) penalize('pregnancy_status_unknown', 'Life stage not shared');
  }
  if (s.ttc && pStatus !== 'pregnant' && preg.overall !== 'not_applicable' && !preg.pregnantOnly) {
    // Something swallowed that isn't safe in pregnancy is held back while she
    // is trying: she may be pregnant for weeks before she knows.
    if (preg.overall === 'contraindicated' && pp.ingested) reasons.push({ code: 'ttc_pregnancy_contraindicated', text: 'Not for use in pregnancy, and you may be pregnant before you know it' });
    else if (preg.overall === 'contraindicated') {
      penalize('ttc_pregnancy_contraindicated', 'Not for use in pregnancy');
      cautions.push({ code: 'ttc_pregnancy', text: 'Not for use during pregnancy. Stop if you become pregnant.' });
    } else if (preg.overall === 'unknown' && pp.ingested) penalize('ttc_pregnancy_unknown', 'Pregnancy safety not confirmed');
  }
  // Postpartum and breastfeeding not shared: something that is not for
  // breastfeeding waits until she tells us (asked, not guessed).
  if (s.breastfeeding !== 'yes' && s.breastfeeding !== 'no' && pp.breastfeeding.overall === 'contraindicated'
    && (up.physiology.lifeStages || []).some((st) => /postpartum/.test(String(st)))) {
    missingFields.push('breastfeeding_status');
    cautions.push({ code: 'breastfeeding_reported', text: 'Not for use while breastfeeding. Tell us if you are breastfeeding so we can check this for you.' });
  }
  if (s.breastfeeding === 'yes' && pp.breastfeeding.overall !== 'not_applicable') {
    if (pp.breastfeeding.overall === 'contraindicated') reasons.push({ code: 'breastfeeding_contraindicated', text: 'Not for use while breastfeeding' });
    else if (pp.breastfeeding.overall === 'caution') {
      penalize('breastfeeding_caution', 'Clinician check advised while breastfeeding');
      cautions.push({ code: 'breastfeeding_caution', text: 'Check with your clinician before using this while breastfeeding.' });
    } else if (pp.ingested || pp.formats.includes('topical')) penalize('breastfeeding_unknown', 'Breastfeeding safety not confirmed');
  }
  // 7b. Pregnant or breastfeeding + hormone-active product with no pregnancy /
  //     breastfeeding facts at all: restricted until the passport has them.
  if (pk && hormoneActive && bodyRoute) {
    if (pStatus === 'pregnant' && preg.overall === 'unknown' && !pk.pregnancy) missingProductInfo.push('pregnancy_info');
    if (s.breastfeeding === 'yes' && pp.breastfeeding.overall === 'unknown' && !pk.breastfeeding) missingProductInfo.push('breastfeeding_info');
  }
  // 7c. Anything swallowed (herbals first): when she is pregnant, trying to conceive or
  //     breastfeeding and the product's safety for that stage is unknown, it is
  //     held back (restricted), never shown with a caution and a percent.
  //     Unknown is never treated as safe (Pass 8, Flo gummies for pregnant users).
  if (pp.herbal || pp.ingested) {
    if ((pStatus === 'pregnant' || s.ttc) && preg.overall === 'unknown') missingProductInfo.push('pregnancy_info');
    if (s.breastfeeding === 'yes' && pp.breastfeeding.overall === 'unknown') missingProductInfo.push('breastfeeding_info');
  }
  for (const stage of up.physiology.lifeStages) {
    if (stage !== 'pregnant' && pp.life_stage[stage] === 'contraindicated') reasons.push({ code: 'life_stage_contraindicated', text: `Not for use in ${LIFE_STAGE_BY_ID[stage]?.phrase || stage}` });
  }

  // 8. Urgent "Not sure": more caution on higher-risk categories.
  if (s.urgent === 'not_sure' && (pp.ingested || pp.formats.includes('suppository') || pp.care_roles.includes('symptom_relief'))) {
    penalize('urgent_not_sure_high_risk', 'You were not sure if something is urgent');
  }

  // 9. Data quality, freshness, recency and profile flags.
  if (pp.metadata_confidence < 0.5) penalize('low_metadata', 'Limited product data');
  if (pp.freshness?.state === 'unknown') penalize('catalog_freshness_unknown', 'Catalog data has no verification date');
  else if (pp.freshness?.state === 'stale' && pp.freshness.source === 'product passport') penalize('passport_stale', 'Product facts are past their review date');
  else if (pp.freshness?.state === 'stale') penalize('catalog_stale', 'Catalog data not verified recently');
  // Passport completeness: how much we know about the product, never how good it is.
  if (pp.passport?.completeness != null) {
    if (pp.passport.missing_critical?.length) penalize('passport_critical_gaps', `Product facts missing: ${pp.passport.missing_critical.slice(0, 3).join(', ')}`);
    if (pp.passport.completeness < PASSPORT_COMPLETENESS_FLOOR) penalize('passport_incomplete', 'Limited verified product facts');
  }
  if (up.physiology.confidenceFlags.includes('unusual_combination')) penalize('unusual_combination', 'Unusual age and life stage combination');
  const conflicting = up.physiology.compatibility.conflictingStages;
  if (conflicting.some((st) => ['designed_for', 'not_relevant', 'relevant'].includes(pp.life_stage[st]))) {
    penalize('stage_needs_clarification', 'Life stages that need clarification');
  }
  const rec = up.recency?.stale || {};
  if (rec.pregnancy && pStatus === 'pregnant' && preg.overall !== 'not_applicable') penalize('stale_pregnancy', 'Your pregnancy answer is from a while ago');
  if (rec.medications && s.medications.length && pp.interaction_relevant) penalize('stale_medications', 'Your medicine list is from a while ago');
  if (up.contradictions?.some((c) => c.affects.includes('safety')) && bodyContact(pp)) penalize('answer_contradiction', 'Some safety answers conflict');

  const restricted = reasons.length === 0 && (missingFields.length > 0 || missingProductInfo.length > 0);
  if (restricted) penalize('restricted', 'Safety details missing');
  const confidence = Math.max(0.2, penalties.reduce((c, p) => c * p.factor, 1));
  const status = reasons.length ? 'excluded' : restricted ? 'insufficient_information' : cautions.length ? 'caution' : 'clear';
  return {
    eligible: reasons.length === 0,
    status,
    restricted,
    // Pregnant, trying, postpartum or breastfeeding: stricter evidence bars apply downstream.
    sensitiveStage: ['pregnant', 'reported'].includes(pStatus) || Boolean(s.ttc) || s.breastfeeding === 'yes'
      || (up.physiology.lifeStages || []).some((st) => /postpartum|pregnan|ttc|breastfeed/.test(String(st))),
    missingFields: [...new Set(missingFields)],
    missingProductInfo: [...new Set(missingProductInfo)],
    reasons,
    cautions,
    penalties,
    confirmed,
    blockedClaims: [...blockedClaims],
    interaction,
    confidence,
  };
}

function capitalize(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// ─── Relevance (with explicit contexts) ─────────────────────────────────────
/**
 * Effective relevance of a product for a need for THIS user: the
 * unconditional level, or a contextual level when she gave the context.
 * @returns {{ base: number, relationship: string, contextUsed: object|null, contextualOnly: boolean, entry: object|null }}
 */
export function resolveRelevance(pp, up, needId) {
  const entry = pp.health_need_relevance[needId] || null;
  if (!entry) return { base: 0, relationship: 'unrelated', contextUsed: null, contextualOnly: false, entry: null };
  let base = entry.score || 0;
  let level = base; // the reviewed relationship level (names the relationship)
  let contextUsed = null;
  for (const c of entry.contextual || []) {
    const active = c.requires.map((id) => up.contexts?.[id]).filter(Boolean).sort((a, b) => b.strength - a.strength)[0];
    if (!active) continue;
    // A weaker context source (typed in prose, or a need that names the
    // context) scales the score down a little; the relationship stays.
    const scaled = c.level * (0.85 + 0.15 * active.strength);
    if (scaled > base) {
      const src = active.sources[0];
      base = scaled;
      level = c.level;
      contextUsed = { context: active.id, type: src.type, id: src.id, phrase: src.phrase, strength: active.strength, rule: c.rule, via: 'contextual', ...(src.reconciled ? { reconciled: true } : {}) };
    }
  }
  const contextualOnly = Boolean(contextUsed) && !(entry.score > 0);
  const hasUnmetContextual = !base && (entry.contextual || []).length > 0;
  return { base, relationship: relationshipOf(level), contextUsed, contextualOnly, entry, needsContext: hasUnmetContextual ? entry.contextual.flatMap((c) => c.requires) : null };
}

/**
 * True when this product's relevance to the need rests on a menstrual cycle
 * she told us she does not have right now (physiology.menstruation).
 * - Any cycle-dependent relevance on a need that does not presume a cycle
 *   (an ovulation test for "hormone-related symptoms") is dropped.
 * - With no cycle at all (menopause, post-menopause, pregnancy), cycle
 *   trackers and ovulation tests are dropped for cycle needs too, unless she
 *   explicitly asked for fertility or ovulation support.
 * - Period products stay for period needs she explicitly selected (bleeding
 *   still needs products; the contradiction lowers confidence and care
 *   notes cover it).
 */
export function notMenstruatingBlock(rel, up, needId) {
  const m = up.physiology?.menstruation;
  if (!m || !(rel.base > 0)) return false;
  const rule = rel.contextUsed?.rule || rel.entry?.rule;
  if (!CYCLE_DEPENDENT_RULES.has(rule)) return false;
  if (!isCyclePremisedNeed(needId)) return true;
  return m === 'none' && CYCLE_TRACKING_RULES.has(rule) && !String(needId).startsWith('fertility.');
}

function relationshipOf(score) {
  if (score >= 1) return 'direct';
  if (score >= 0.8) return 'strong';
  if (score >= 0.55) return 'secondary';
  if (score >= 0.3) return 'adjacent';
  if (score > 0) return 'weak';
  return 'unrelated';
}

function healthComponent(pp, up, need, base, notes) {
  let rel = base;
  if (rel <= 0) return 0;
  const m = need.modifiers || {};

  // Diagnosed condition + explicit need: boost only products relevant to both.
  for (const c of up.safety.conditions) {
    const supportNeed = CONDITION_SUPPORT_NEED[c.id];
    if (!supportNeed || supportNeed === need.id || !(CONDITION_PATHWAYS[c.id] || []).includes(need.id)) continue;
    const condRel = pp.health_need_relevance[supportNeed]?.score || 0;
    if (condRel >= 0.3) {
      const veryHigh = c.id === 'pcos' && up.healthIntent.reinforcement.pcos === 'very_high';
      rel = Math.min(1.05, rel + (veryHigh ? 0.2 : condRel >= 0.55 ? 0.15 : 0.1));
      notes.health.push(`condition_pathway:${c.id}`);
      notes.contextBoost = notes.contextBoost || { type: 'condition', id: c.id, phrase: conditionPhrase(c.id) };
    }
  }
  // Selected support need for a condition (explicit interest, not a diagnosis) reinforces pathway needs a little.
  if (need.id !== 'condition_support.pcos' && up.healthIntent.reinforcement.pcos && !up.safety.conditions.some((c) => c.id === 'pcos')
    && (CONDITION_PATHWAYS.pcos || []).includes(need.id) && (pp.health_need_relevance['condition_support.pcos']?.score || 0) >= 0.3) {
    rel = Math.min(1.05, rel + 0.05);
    notes.health.push('pcos_support_pathway');
    notes.contextBoost = notes.contextBoost || { type: 'need', id: 'condition_support.pcos', phrase: 'PCOS support' };
  }

  // Context bonus (spec A.14): a product already relevant to this need AND
  // designed for a life stage she explicitly shared gets +0.10. Never from age.
  if (base >= 0.55) {
    const conflicting = new Set(up.physiology.compatibility.conflictingStages);
    const stage = up.physiology.lifeStages.find((st) => !conflicting.has(st) && pp.life_stage[st] === 'designed_for');
    if (stage) {
      rel = Math.min(1.05, rel + CONTEXT_BONUS);
      notes.health.push(`context_bonus:${stage}`);
      notes.stageBonus = stage;
    }
  }

  // Cramp severity (only for the explicitly selected cramp need).
  if (need.id === 'pain.menstrual_cramp' && m.painIntensity != null) {
    rel = Math.min(1.05, rel + (base >= 0.8 ? 0.05 : base >= 0.55 ? 0.02 : 0) * m.painIntensity);
  }

  // Flow -> menstrual product characteristics.
  if (MENSTRUAL_PRODUCT_NEEDS.has(need.id) && m.flow && pp.menstrual) {
    if (m.flow === 'no_periods') { rel *= 0.5; notes.flowContradiction = true; } else {
      const fit = flowFit(pp, m);
      notes.flowFit = fit;
      rel *= 0.7 + 0.3 * fit;
    }
  }

  // UTI frequency x care role.
  if (URINARY_UTI_NEEDS.has(need.id) && m.utiFrequency && UTI_ROLE_MULTIPLIER[m.utiFrequency]) {
    const roles = pp.care_roles.filter((r) => UTI_ROLE_MULTIPLIER[m.utiFrequency][r] != null);
    if (roles.length) {
      const mult = Math.max(...roles.map((r) => UTI_ROLE_MULTIPLIER[m.utiFrequency][r]));
      rel *= mult;
      notes.utiRoles = roles;
      if (m.utiFrequency === 'right_now' && roles.length === 1 && roles[0] === 'prevention') notes.preventionOnlyNow = true;
    }
  }

  // Postpartum timing modifies a selected need; it never invents one.
  if (m.postpartumTiming) {
    const early = pp.matched_rules.includes('postpartum_recovery_kit');
    if (early && m.postpartumTiming === 'lt_6w') rel *= 1.1;
    if (early && ['6_12m', 'gt_12m'].includes(m.postpartumTiming)) rel *= 0.6;
    if (need.id === 'hair.loss' && m.postpartumTiming === '3_6m') rel *= 1.15;
  }
  return Math.max(0, Math.min(1.05, rel));
}

function flowFit(pp, m) {
  const table = FLOW_CAPACITY_FIT[m.flow];
  if (!table || !pp.menstrual?.capacity) return 0.6;
  let fit = m.flow === 'varies' && pp.menstrual.versatile ? 1 : table[pp.menstrual.capacity] ?? 0.6;
  if (m.leakConcern && pp.menstrual.leak_protection && ['heavy', 'very_heavy'].includes(m.flow)) fit = Math.min(1, fit + 0.1);
  return fit;
}

function focusFactor(pp, needId) {
  const others = Object.entries(pp.health_need_relevance).filter(([id, e]) => id !== needId && e.score >= 0.8).length;
  return Math.max(0.6, 1 - 0.08 * others);
}
function specificityComponent(pp, needId, base) {
  return clamp01((SPECIFICITY_BASE[relationshipOf(base)] || 0) * focusFactor(pp, needId));
}

// ─── Preference dimensions (only known + applicable ones) ──────────────────
function contextDimension(pp, up) {
  const conflicting = new Set(up.physiology.compatibility.conflictingStages);
  const vals = [];
  for (const stage of up.physiology.lifeStages) {
    if (conflicting.has(stage)) continue; // neutralized until clarified
    const v = pp.life_stage[stage];
    if (v === 'designed_for') vals.push(1);
    else if (v === 'relevant') vals.push(0.9);
    else if (v === 'not_relevant') vals.push(0.25);
  }
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

// Format families for preference matching (formats people choose between).
// Formats with no family (apps, tests, garments) have no format alternative.
export const FORMAT_FAMILY = {
  pill_capsule: 'ingested', gummy: 'ingested', powder: 'ingested', drink_tea: 'ingested',
  topical: 'external', patch: 'external', suppository: 'external', device: 'external',
  period_care: 'period_care',
};

function formatDimension(pp, up, notes, explanations) {
  const sh = up.shopping;
  if (sh.formats.strict.length && !pp.formats.some((f) => sh.formats.strict.includes(f))) notes.filtered = 'format_strict';
  if (sh.declinesInternal && pp.internal) notes.filtered = 'internal_declined';
  if (!pp.formats.length) return null; // product format unknown: not scored
  const disliked = new Map();
  for (const d of sh.formats.disliked) {
    if (d.id) disliked.set(d.id, Math.max(disliked.get(d.id) || 0, d.weight));
    if (d.fromProductId) {
      const h = up.experience.history.find((x) => x.resolvedProductId === d.fromProductId);
      if (h?.resolvedProduct) buildProductProfile(h.resolvedProduct).formats.forEach((f) => disliked.set(f, Math.max(disliked.get(f) || 0, 1)));
    }
  }
  let value = null;
  if (sh.formats.preferred.length) {
    const hit = pp.formats.some((f) => sh.formats.preferred.includes(f));
    // A preferred format only competes with formats of the same kind: tea
    // over pills, a patch over a cream or a device. It does not apply to a
    // different kind of product (there is no tea version of a pad, an acne
    // cream or an app), so a tea preference never pushes her real best
    // matches for other needs off the Ecosystem.
    const preferredFamilies = new Set(sh.formats.preferred.map((f) => FORMAT_FAMILY[f]).filter(Boolean));
    if (hit) value = 1;
    else if (pp.formats.some((f) => preferredFamilies.has(FORMAT_FAMILY[f]))) value = 0.4;
    if (hit) explanations.push('In a format you prefer');
  } else if (!sh.formats.explicitNoPreference) {
    // Soft preference learned from what worked / what she stopped (weight 0.5 equivalent).
    const learned = up.experience.learnedFormats || { liked: [], disliked: [] };
    const fmts = (ids) => new Set(ids.flatMap((id) => { const h = up.experience.history.find((x) => x.resolvedProductId === id); return h?.resolvedProduct ? buildProductProfile(h.resolvedProduct).formats : []; }));
    const liked = fmts(learned.liked);
    const stopped = fmts(learned.disliked);
    if (pp.formats.some((f) => liked.has(f))) value = 0.9;
    else if (pp.formats.some((f) => stopped.has(f) && !liked.has(f))) value = 0.6;
  }
  const penalty = Math.max(0, ...pp.formats.map((f) => disliked.get(f) || 0));
  if (penalty > 0) value = Math.max(0, (value ?? 0.8) - 0.6 * penalty);
  return value;
}

function valuePhrase(id) {
  return { unscented: 'unscented', organic: 'organic', vegan: 'vegan', cruelty_free: 'cruelty-free', minimal_ingredients: 'made with minimal ingredients', sensitive_skin: 'made for sensitive skin', reusable: 'reusable', eco_friendly: 'eco-friendly', pregnancy_considerations: 'pregnancy-reviewed', black_owned: 'Black-owned', brown_owned: 'Brown-owned' }[id] || id;
}

function valuesDimension(pp, up, notes, explanations) {
  const sh = up.shopping;
  const parts = [];
  for (const v of sh.shouldBe) {
    const st = pp.values[v.id];
    if (st === 'yes') { parts.push({ val: 1, w: v.weight || 1 }); explanations.push(`${capitalize(valuePhrase(v.id))}, which you asked for`); }
    else if (st === 'partial') parts.push({ val: 0.6, w: v.weight || 1 });
    else if (st === 'no') parts.push({ val: 0, w: v.weight || 1 });
    else if (st === 'unknown') notes.unknownValues = (notes.unknownValues || 0) + 1;
  }
  for (const l of sh.leaveOut) {
    const st = pp.safety.details[l.attr]?.status;
    const phrase = ATTRIBUTE_PHRASE[l.attr] || l.attr;
    if (st === 'no') { parts.push({ val: 1, w: 1 }); explanations.push(`${capitalize(phrase)}-free, which you asked for`); }
    else if (st === 'yes' && l.strength === 'cosmetic') { parts.push({ val: 0, w: 1.5 * (l.weight ?? 1) }); notes.cosmeticConflict = true; }
  }
  if (!parts.length) return null;
  return parts.reduce((sum, p) => sum + p.val * p.w, 0) / parts.reduce((sum, p) => sum + p.w, 0);
}

function brandDimension(pp, up, explanations) {
  const sh = up.shopping;
  const trusted = pp.brand.key && sh.trustedBrands.some((t) => t.key === pp.brand.key || (pp.brand.id_slug && t.key === normalizeBrand(pp.brand.id_slug)));
  if (trusted) { explanations.push('From a brand you trust'); return 1; }
  if (sh.trustedBrands.length && sh.brandOpenness === 'I mostly stick with brands I already trust') return 0.6;
  return null;
}

/** Evidence channels 0..1 for a product. */
export function evidenceChannels(pp) {
  const e = pp.evidence;
  const clinical = clamp01((e.product_specific * 2 + e.ingredient_specific + e.clinical_guideline) / 4) * (e.strength === 'limited' ? 0.5 : 1);
  const community = clamp01(e.community / 3 + (e.user_rating != null && e.user_rating >= 4.5 ? 0.1 : 0));
  const expert = clamp01((e.expert_opinion ? 0.5 : 0) + (e.clinician_source === 'independent' ? 0.3 : e.clinician_source === 'mixed' ? 0.2 : e.clinician_source === 'brand' ? 0.1 : 0) + (e.clinical_guideline > 0 ? 0.2 : 0));
  return { clinical, community, expert };
}

/** Evidence summary for THIS need (claim level), product vs ingredient. */
export function evidenceFor(pp, needId) {
  const claim = pp.claim_evidence?.[needId] || null;
  const pc = pp.passport?.claim_evidence?.[needId] || null;
  const e = pp.evidence;
  const level = claim?.product_specific || pc?.product_specific ? 'product_specific' : claim?.clinical_guideline || pc?.guideline ? 'guideline'
    : claim?.ingredient_specific || pc?.ingredient_level ? 'ingredient_only' : e.product_specific + e.ingredient_specific + e.clinical_guideline > 0 ? 'not_for_this_claim'
      : e.community > 0 ? 'community_only' : 'none';
  return { level, forThisNeed: claim, passportClaims: pc ? pc.claims : [], passportScore: pc ? pc.score : null, catalogStrength: e.strength || null, channels: evidenceChannels(pp) };
}

/**
 * Clinical evidence for THIS need: the product-level channel, raised by a
 * reviewed passport claim that matches the need (strength x product-specific
 * 1 / guideline 0.8 / ingredient-level 0.6). Ingredient-only evidence weighs
 * less than product-specific evidence.
 */
export function clinicalForNeed(pp, needId) {
  const general = evidenceChannels(pp).clinical;
  const pc = pp.passport?.claim_evidence?.[needId];
  return pc ? Math.max(general, clamp01(pc.score)) : general;
}

function trustWeightsFor(pp, up) {
  const mult = CATEGORY_TRUST[productClass(pp)] || CATEGORY_TRUST.other;
  const w = up.trust.weights;
  const raw = { clinical: w.clinical * mult.clinical, community: w.community * mult.community, expert: w.expert * mult.expert };
  const total = raw.clinical + raw.community + raw.expert;
  return { clinical: raw.clinical / total, community: raw.community / total, expert: raw.expert / total };
}

function evidenceDimension(pp, up, needId, explanations) {
  const ch = { ...evidenceChannels(pp), clinical: clinicalForNeed(pp, needId) };
  const w = trustWeightsFor(pp, up);
  const value = clamp01(w.clinical * ch.clinical + w.community * ch.community + w.expert * ch.expert);
  if (!up.trust.touched) return { value, known: false };
  const hasData = ch.clinical + ch.community + ch.expert > 0;
  const top = up.trust.ranking[0];
  const claim = pp.claim_evidence?.[needId];
  const phrase = needPhrase(needId);
  const pclaim = pp.passport?.claim_evidence?.[needId];
  if (top === 'clinical' && ((claim && (claim.product_specific || claim.clinical_guideline)) || (pclaim && (pclaim.product_specific || pclaim.guideline) && pclaim.score >= 0.5))) explanations.push(`Has clinical sources about ${phrase}, which you ranked first`);
  if (top === 'community' && ch.community >= 0.66) explanations.push('Well reviewed by other women, which you ranked first');
  if (top === 'expert' && ch.expert >= 0.8 && pp.evidence.expert_direct) explanations.push('Reviewed by experts, which you ranked first');
  return { value, known: hasData };
}

/**
 * Budget fit (spec piecewise curve). Example for $25 to $75:
 * $20 slightly below = 0.95, $48 / $72 = 1, $82 = mild penalty (about 0.91),
 * $150 = strong penalty (0.4), $300 = major penalty (0.1).
 */
export function budgetFit(amount, budget) {
  if (amount == null) return null;
  if (!budget) return null;
  const { min, max } = budget;
  if (amount >= min && amount <= max) return 1;
  if (amount < min) return amount >= 0.75 * min ? 0.95 : 0.9;
  const over = (amount - max) / max;
  if (over <= 0.15) return 1 - over;                       // 0 to 15% over: 1.0 -> 0.85
  if (over <= 1) return 0.85 - ((over - 0.15) / 0.85) * 0.45; // up to 100% over: 0.85 -> 0.4
  if (over <= 3) return 0.4 - ((over - 1) / 2) * 0.3;       // up to 300% over: 0.4 -> 0.1
  return 0.1;
}

function priceDimension(pp, up, notes, explanations) {
  const sh = up.shopping;
  const price = pp.price;
  if (!sh.budget) return null;                  // skipped or "not a major factor": not scored
  if (price.is_free) { explanations.push('Within your budget'); return 1; }
  if (price.amount == null) { notes.priceUnknown = true; return null; } // product price unknown: not scored
  let fit = budgetFit(price.amount, sh.budget);
  if (fit >= 1) explanations.push('Within your budget');
  else if (price.amount > sh.budget.max) {
    // True cost over time: a reusable or long-supply product whose monthly
    // cost fits the budget is not treated like a one-off expensive item.
    const perMonth = pp.pricing?.per_month;
    if (perMonth != null && perMonth <= sh.budget.max && (pp.pricing.reusable || /supply|years?/.test(pp.pricing.per_month_source || ''))) {
      fit = Math.max(fit, 0.85);
      notes.costOverTime = true;
    }
    // History can gradually tighten the curve; it never rewrites the stated budget.
    fit -= Math.min(0.1, 0.05 * sh.priceSensitivity);
    // Purchases above the stated max soften the penalty by at most a quarter.
    const above = (up.behavior.purchasedPrices || []).filter((x) => x > sh.budget.max).length;
    if (above) fit += (1 - fit) * Math.min(0.25, 0.0625 * above);
    if (notes.costOverTime) explanations.push('Costs less over time than the upfront price');
    else if (fit < 0.85) explanations.push('Above your usual budget');
  }
  if (price.amount >= 75 && price.amount > sh.budget.max && !notes.costOverTime) {
    if (sh.largePurchaseFrequency === 'Never') fit *= 0.85;
    else if (sh.largePurchaseFrequency === 'Rarely') fit *= 0.93;
  }
  return clamp01(fit);
}

function effortDimension(pp, up) {
  if (!(up.shopping.usageBurden > 0) || pp.effort?.burden == null) return null;
  return clamp01(1 - pp.effort.burden);
}

// ─── Experience (her history) and behavior ─────────────────────────────────
const FACET_FOR_DIMENSION = { health: 'mechanism', safety: 'ingredients', format: 'format', price: 'price', effort: 'format' };
function historyRelation(h, pp) {
  if (sameProduct(h, pp)) return { kind: 'same' };
  if (h.resolvedProduct) {
    const hp = buildProductProfile(h.resolvedProduct);
    const sim = productSimilarity(hp, pp);
    return sim ? { kind: 'similar', sim, sameBrand: sim.brand === 1 } : null;
  }
  // A brand-only entry ("Always") relates to that brand's products.
  if (h.brandKey && pp.brand.key && h.brandKey === pp.brand.key) return { kind: 'brand' };
  return null;
}

function experiencePoints(pp, up, notes, explanations) {
  let points = 0;
  let index = 0.6; // reporting only: 0.6 = no history signal
  let similarPoints = 0;
  for (const h of up.experience.history) {
    const rel = historyRelation(h, pp);
    if (!rel) continue;
    for (const e of h.effects) {
      if (rel.kind === 'same') {
        points += (e.same || 0) * EXPERIENCE_POINTS.scale;
        index += e.same || 0;
        continue;
      }
      if (!e.similar) continue;
      // Similar only on the facet the effect is about, and only when truly similar.
      let sim = 0;
      if (rel.kind === 'brand') sim = 0.6;
      else {
        const facet = e.facet || FACET_FOR_DIMENSION[e.dimension];
        const fv = facet ? rel.sim[facet] : null;
        const sameUse = rel.sim.use_case === 1 || (rel.sim.health_function ?? 0) > 0;
        sim = sameUse && fv != null && fv >= EXPERIENCE_POINTS.minFacetSimilarity ? fv : 0;
        if (rel.sameBrand && sameUse) sim = Math.max(sim, 0.8);
      }
      if (!sim) continue;
      similarPoints += e.similar * EXPERIENCE_POINTS.scale * sim;
      index += e.similar * sim;
      if (e.similarCaution) notes.similarReaction = true;
    }
    if (rel.kind === 'same') {
      if (h.outcome === 'helped_a_lot') explanations.push('You said this helped a lot');
      else if (h.outcome === 'helped_somewhat') explanations.push('You said this helped somewhat');
    } else if (['helped_a_lot', 'helped_somewhat'].includes(h.outcome) && rel.kind !== 'brand' && (rel.sim?.mechanism ?? 0) >= 0.5) {
      explanations.push('Works like something that helped you');
    }
  }
  points += Math.max(-EXPERIENCE_POINTS.similarCap, Math.min(EXPERIENCE_POINTS.similarCap, similarPoints));
  for (const p of up.shopping.positiveMentions) {
    if ((p.key && p.key === pp.brand.key) || (p.normalized && normalizeName(pp.name).includes(p.normalized))) {
      points += 3 * p.weight;
      index += 0.15 * p.weight;
      explanations.push('From a brand you said you like');
      break;
    }
  }
  return { points: Math.max(-EXPERIENCE_POINTS.cap, Math.min(EXPERIENCE_POINTS.cap, points)), index: clamp01(index) };
}

function behaviorSignal(pp, up, notes) {
  const b = up.behavior;
  const id = pp.product_id;
  if (!id) return { net: 0, index: null };
  if (b.hidden.has(id)) { notes.filtered = notes.filtered || 'hidden_by_user'; return { net: -1, index: 0 }; }
  const ev = b.events?.get(String(id)) || {};
  let net = Object.values(ev).reduce((a, v) => a + v, 0);
  // Legacy shapes without events (saved / purchased / reordered sets).
  if (!b.events) {
    if (b.saved.has(id)) net += 0.5;
    if (b.purchased.has(id)) net += 0.8;
    if (b.reordered.has(id)) net += 1;
  }
  net = Math.max(-1, Math.min(1, net));
  return { net, index: Object.keys(ev).length || b.saved.has(id) || b.purchased.has(id) ? clamp01(0.6 + 0.4 * net) : null };
}

// ─── Access (separate from health) ──────────────────────────────────────────
/** AccessScore 0..100 with a label. Never folded into the need score. */
export function computeAccess(productOrProfile, up) {
  const pp = asProfile(productOrProfile);
  const a = pp.access;
  const zip = up?.access?.zip || null;
  if (a.is_care_service) {
    return a.service_area
      ? { score: 90, label: 'Serves your area', zipUsed: Boolean(zip), known: true }
      : { score: 60, label: 'Check that they serve your state', zipUsed: false, known: false };
  }
  if (a.is_digital) return { score: 100, label: 'Available online', zipUsed: false, known: true };
  if (a.ships_from_eu) return { score: 50, label: 'Ships from the EU', zipUsed: false, known: true };
  if (a.national_retailer) return { score: 95, label: 'At major US retailers', zipUsed: false, known: true };
  if (a.retailers.length) return { score: 85, label: 'Available online', zipUsed: false, known: true };
  return { score: null, label: 'Availability not confirmed', zipUsed: false, known: false };
}

// ─── Explanations ───────────────────────────────────────────────────────────
const VERB_BY_SOURCE = { selected: 'selected', legacy: 'shared', custom: 'added', free_text: 'mentioned', adhoc: 'selected' };
function contextPhrase(ctx) {
  if (!ctx) return null;
  if (ctx.reconciled) return `the ${ctx.phrase}, which fits the life stages you shared`;
  if (ctx.type === 'life_stage') return ctx.id === 'breastfeeding' ? 'the breastfeeding you shared' : `the ${LIFE_STAGE_BY_ID[ctx.id]?.phrase || ctx.phrase} stage you shared`;
  if (ctx.type === 'condition') return `the ${ctx.phrase} diagnosis you shared`;
  if (ctx.type === 'need') return `the ${ctx.phrase} you selected`;
  if (ctx.type === 'free_text') return `the ${ctx.phrase} you mentioned`;
  if (ctx.type === 'answer') return `the ${ctx.phrase} you shared`;
  return null;
}
/**
 * The health sentence: WHAT matched, never WHY she has a symptom.
 * "Matches the night sweats you selected."
 * "Matches your night sweats and the perimenopause stage you shared."
 */
export function healthSentence(relationship, needId, source, ctx) {
  const phrase = needPhrase(needId);
  const verb = VERB_BY_SOURCE[source] || 'selected';
  const withCtx = contextPhrase(ctx);
  if (relationship === 'direct' || relationship === 'strong') return withCtx ? `Matches your ${phrase} and ${withCtx}` : `Matches the ${phrase} you ${verb}`;
  if (relationship === 'secondary') return withCtx ? `A secondary option for your ${phrase} and ${withCtx}` : `A secondary option for the ${phrase} you ${verb}`;
  if (relationship === 'adjacent') return `Loosely related to the ${phrase} you ${verb}`;
  return null;
}

// ─── Main entry points ──────────────────────────────────────────────────────
/**
 * Score one product for one of the user's needs.
 * @param {object} productOrProfile raw catalog product or buildProductProfile() result
 * @param {object} up buildUserProfile() result
 * @param {string} needIdIn canonical need id
 * @param {{ safety?: object }} [opts] pass a precomputed evaluateSafety() result to skip recomputation
 */
export function scoreProductForNeed(productOrProfile, up, needIdIn, opts = {}) {
  const pp = asProfile(productOrProfile);
  const needId = canonicalNeedId(needIdIn);
  const need = up.healthIntent.needs.find((n) => n.id === needId) || { id: needId, modifiers: {}, source: 'adhoc', confidence: 1 };
  const safety = opts.safety || evaluateSafety(pp, up);
  const notes = { health: [] };
  const prefExpl = [];
  const otherExpl = [];

  // Relevance (with explicit contexts only).
  const rel = resolveRelevance(pp, up, needId);
  // She does not menstruate now: relevance that only holds for someone who
  // does (period products, cycle trackers, ovulation tests) does not count.
  const cycleBlocked = notMenstruatingBlock(rel, up, needId);
  if (cycleBlocked) notes.filtered = 'not_menstruating';
  const base = cycleBlocked ? 0 : rel.base;
  const health = healthComponent(pp, up, need, base, notes);
  const relationship = cycleBlocked ? 'unrelated' : rel.relationship;
  const focus = focusFactor(pp, needId);
  const R = base > 0 ? RELEVANCE_SCALE * health * (0.9 + 0.1 * focus) : 0;

  // Context used for the explanation: the contextual unlock, else a stage or condition boost.
  const ctxUsed = rel.contextUsed
    || (notes.stageBonus ? { type: 'life_stage', id: notes.stageBonus, phrase: LIFE_STAGE_BY_ID[notes.stageBonus]?.phrase || notes.stageBonus } : null)
    || (notes.contextBoost ? notes.contextBoost : null);

  // Preference dimensions: known + applicable only (dynamic denominator).
  const dims = {
    context: contextDimension(pp, up),
    format: formatDimension(pp, up, notes, prefExpl),
    values: valuesDimension(pp, up, notes, prefExpl),
    brand: brandDimension(pp, up, prefExpl),
    evidence: null,
    price: priceDimension(pp, up, notes, prefExpl),
    effort: effortDimension(pp, up),
  };
  const ev = evidenceDimension(pp, up, needId, prefExpl);
  if (ev.known) dims.evidence = ev.value;
  const weightFor = (k) => DIMENSION_WEIGHTS[k] * (k === 'price' && up.contradictions?.some((c) => c.affects.includes('price')) ? 0.5 : 1);
  const known = Object.entries(dims).filter(([, v]) => v != null);
  const preferenceFit = known.length ? known.reduce((sum, [k, v]) => sum + weightFor(k) * v, 0) / known.reduce((sum, [k]) => sum + weightFor(k), 0) : null;
  const P = preferenceFit ?? 1;

  // Her history and behavior.
  const exp = experiencePoints(pp, up, notes, otherExpl);
  const beh = behaviorSignal(pp, up, notes);
  const behaviorPoints = BEHAVIOR_POINTS * beh.net;

  // Confidence (separate; never in the match).
  const confidenceReasons = safety.penalties.map((p) => ({ code: p.code, factor: p.factor, text: p.text }));
  let confidence = safety.confidence;
  const addPenalty = (code, text) => { confidence *= CONFIDENCE_PENALTIES[code]; confidenceReasons.push({ code, factor: CONFIDENCE_PENALTIES[code], text }); };
  if (needId === 'pain.menstrual_cramp' && need.modifiers?.painVaries) addPenalty('pain_varies', 'Pain varies');
  if (notes.similarReaction) addPenalty('similar_reaction_caution', 'Similar to a product that caused a mild reaction');
  if (notes.flowContradiction) addPenalty('flow_contradiction', 'Period support selected with no current periods');
  if (up.contradictions?.some((c) => c.affects.includes(needId))) addPenalty('answer_contradiction', 'Some answers about this need conflict');
  if (need.confidence != null && need.confidence < 0.9) addPenalty('interpretation_uncertain', 'We are not fully sure how to read what you typed');
  if (up.recency?.stale?.needs) addPenalty('stale_answers', 'Your answers are from a while ago');
  const cls = productClass(pp);
  const applicable = APPLICABLE_ANSWERS[cls] || APPLICABLE_ANSWERS.other;
  const informative = (k) => ['answered', 'explicit_no'].includes(up.answers?.[k]);
  const coverage = applicable.length ? applicable.filter(informative).length / applicable.length : 1;
  confidence = Math.max(0.2, Math.min(1, confidence * (0.6 + 0.4 * coverage)));

  // The match.
  let raw = base > 0 ? R * (1 - PREFERENCE_SPAN * (1 - P)) + exp.points + behaviorPoints : 0;
  // Explainability check: without a truthful health sentence (at least a
  // secondary relationship to THIS need) a product cannot rank as a match.
  const explainable = ['direct', 'strong', 'secondary'].includes(relationship);
  if (!explainable) raw = Math.min(raw, 49);
  raw = Math.max(0, Math.min(MAX_SCORE, raw));
  const score = safety.eligible && base > 0 ? Math.round(raw) : 0;

  // Care flags.
  const m = need.modifiers || {};
  const careFirst = up.safety.careFirst;
  const careProminent = up.safety.careProminent
    || (needId === 'pain.menstrual_cramp' && (m.painIntensity ?? 0) >= 0.8)
    || (URINARY_UTI_NEEDS.has(needId) && ['right_now', 'first_time'].includes(m.utiFrequency))
    || (MENSTRUAL_PRODUCT_NEEDS.has(needId) && m.flow === 'very_heavy')
    || needId === 'urinary.burning' || needId === 'vaginal.discharge' || needId === 'sexual.sti';

  // Explanations: what matched (actual inputs), never why she has a symptom.
  const explanations = [];
  const hs = healthSentence(relationship, needId, need.source, ctxUsed);
  if (hs) explanations.push(hs);
  if (MENSTRUAL_PRODUCT_NEEDS.has(needId) && notes.flowFit >= 0.85 && ['heavy', 'very_heavy'].includes(m.flow)) explanations.push(`High capacity for ${m.flow === 'very_heavy' ? 'very heavy' : 'heavy'} flow`);
  if (MENSTRUAL_PRODUCT_NEEDS.has(needId) && notes.flowFit >= 0.85 && ['very_light', 'light'].includes(m.flow)) explanations.push('Sized for a lighter flow');
  safety.confirmed.forEach((c) => explanations.push(c.text));
  explanations.push(...otherExpl, ...prefExpl);
  if (notes.preventionOnlyNow) explanations.push('Not a substitute for getting checked');
  safety.cautions.forEach((c) => explanations.push(c.text.replace(/\.$/, '')));
  const finalExplanations = [...new Set(explanations.map(clean))];

  const eligibility = !safety.eligible ? 'excluded' : safety.restricted ? 'restricted' : 'eligible';
  const evidence = evidenceFor(pp, needId);
  const access = computeAccess(pp, up);

  return {
    productId: pp.product_id,
    productName: pp.name,
    needId,
    needLabel: NEED_BY_ID[needId]?.option || needPhrase(needId),
    relevance: base,
    relationship,
    contextual: rel.contextualOnly,
    contextUsed: ctxUsed ? { type: ctxUsed.type, id: ctxUsed.id, phrase: ctxUsed.phrase, context: ctxUsed.context || null } : null,
    needsContext: rel.needsContext || null,
    score,
    eligibility,
    restricted: eligibility === 'restricted',
    explainable,
    // Separate outputs (spec C).
    outputs: {
      relevance: Math.round(R),
      preferenceFit: round3(preferenceFit),
      safety: safety.status,
      evidence: evidence.level,
      confidence: round3(confidence),
      access: access.score,
    },
    dimensions: {
      known: known.map(([k]) => k),
      unknown: Object.keys(dims).filter((k) => dims[k] == null),
      values: Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, round3(v)])),
    },
    components: {
      health: round3(Math.min(1, health)),
      specificity: round3(specificityComponent(pp, needId, base)),
      context: round3(dims.context),
      experience: round3(exp.index),
      preference: round3(preferenceFit),
      evidence: round3(ev.value),
      price: round3(dims.price),
      behavior: round3(beh.index),
    },
    points: { relevance: Math.round(R * 10) / 10, preferenceMultiplier: round3(1 - PREFERENCE_SPAN * (1 - P)), experience: Math.round(exp.points * 10) / 10, behavior: Math.round(behaviorPoints * 10) / 10 },
    evidence,
    safety: { eligible: safety.eligible, status: safety.status, restricted: safety.restricted, missingFields: safety.missingFields, missingProductInfo: safety.missingProductInfo, reasons: safety.reasons, cautions: safety.cautions, blockedClaims: safety.blockedClaims },
    confidence: round3(confidence),
    confidenceLevel: eligibility === 'restricted' ? 'limited' : confidenceLevel(confidence),
    confidenceReasons,
    coverage: round3(coverage),
    tier: base > 0 && safety.eligible ? tierFor(score) : 'browse',
    explanations: finalExplanations,
    careFirst,
    careProminent: Boolean(careProminent),
    filtered: notes.filtered || null,
    fsaHsa: pp.fsa_hsa,
    flowFit: notes.flowFit ?? null,
    careRoles: pp.care_roles,
    access,
  };
}
function conditionPhrase(id) {
  return { pcos: 'PMOS', endometriosis: 'endometriosis', fibroids: 'fibroids', adenomyosis: 'adenomyosis', pmdd: 'PMDD', pms: 'PMS', anemia: 'iron deficiency', anxiety: 'anxiety', depression: 'depression', ibs_digestive: 'digestive condition', infertility: 'infertility' }[id] || CONTEXTS[id]?.phrase || id;
}

/**
 * Score a product for every need in the user's profile.
 * @returns {{ productId, needs: object[], best: object|null, safety: object, access: object }}
 */
export function scoreProduct(productOrProfile, up) {
  const pp = asProfile(productOrProfile);
  const safety = evaluateSafety(pp, up);
  const needs = up.healthIntent.needs
    .map((n) => scoreProductForNeed(pp, up, n.id, { safety }))
    .sort((a, b) => b.score - a.score || b.relevance - a.relevance);
  const best = needs.find((r) => r.relevance > 0) || null;
  return { productId: pp.product_id, needs, best, safety, access: computeAccess(pp, up) };
}

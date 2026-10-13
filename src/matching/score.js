// Per-need scoring.
//
// FINAL NEED MATCH (0..100) =
//   ( health 40 + specificity 15 + context 10 + experience 10
//     + preference 8 + evidence/trust 7 + price 5 + behavior 5 )   each part 0..1 x weight
//   x safety eligibility (0 or 1)
//   x confidence factor, where factor = 0.7 + 0.3 x confidence (confidence 0..1)
//   x cosmetic leave-out factor (0.85 when a product has something she prefers to avoid, else 1)
//
// Tiers: excellent >= 80, strong >= 65, exploratory >= 50, browse < 50.
// ZIP never enters this score. Access is computed separately (computeAccess).
// FSA/HSA never enters this score; it is a tie-break in ecosystem.js.

import { NEED_BY_ID, needPhrase, CONDITION_PATHWAYS, CONDITION_SUPPORT_NEED, URINARY_UTI_NEEDS, MENSTRUAL_PRODUCT_NEEDS, ATTRIBUTE_PHRASE, LIFE_STAGE_BY_ID } from './ontology.js';
import { buildProductProfile, normalizeBrand } from './productProfile.js';
import { checkMedicationInteractions } from './medications.js';
import { normalizeName } from './userProfile.js';

export const WEIGHTS = { health: 40, specificity: 15, context: 10, experience: 10, preference: 8, evidence: 7, price: 5, behavior: 5 };
// Value used when the user gave no signal for a component, so products are
// compared on what she did tell us. Documented in ENGINE.md.
export const NEUTRAL = { context: 0.6, experience: 0.6, preference: 0.6, price: 0.8, behavior: 0.6 };
export const TIERS = [
  { id: 'excellent', min: 80 },
  { id: 'strong', min: 65 },
  { id: 'exploratory', min: 50 },
  { id: 'browse', min: 0 },
];
export function tierFor(score) { return TIERS.find((t) => score >= t.min).id; }
export function confidenceFactor(confidence) { return 0.7 + 0.3 * Math.max(0, Math.min(1, confidence)); }
export const COSMETIC_LEAVE_OUT_FACTOR = 0.85;

// Confidence penalty factors (multiplied together, floor 0.2).
export const CONFIDENCE_PENALTIES = {
  allergen_unknown: 0.85,
  allergen_variant: 0.85,
  broad_allergy_class: 0.85,
  unresolved_allergy: 0.9,
  allergy_status_unsure: 0.95,
  leave_out_unknown: 0.92,
  medication_caution: 0.85,
  medication_unknown: 0.9,
  pregnancy_unknown: 0.8,
  pregnancy_caution: 0.85,
  ttc_pregnancy_contraindicated: 0.85,
  ttc_pregnancy_unknown: 0.92,
  breastfeeding_caution: 0.85,
  breastfeeding_unknown: 0.9,
  urgent_not_sure_high_risk: 0.9,
  low_metadata: 0.9,
  unusual_combination: 0.97,
  stage_needs_clarification: 0.9,
  pain_varies: 0.95,
  similar_reaction_caution: 0.95,
  flow_contradiction: 0.85,
};

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

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const clean = (s) => String(s).replace(/\s*[—–]\s*/g, ', ');

function asProfile(productOrProfile) {
  if (productOrProfile && productOrProfile.health_need_relevance) return productOrProfile;
  return buildProductProfile(productOrProfile);
}

function bodyContact(pp) { return !pp.is_digital; }

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
 * @returns {{ eligible: boolean, reasons: object[], cautions: object[], penalties: object[], confirmed: object[], blockedClaims: string[], interaction: object }}
 */
export function evaluateSafety(productOrProfile, up) {
  const pp = asProfile(productOrProfile);
  const s = up.safety;
  const reasons = [];
  const cautions = [];
  const penalties = [];
  const confirmed = [];
  const blockedClaims = new Set();
  const penalize = (code, text) => penalties.push({ code, factor: CONFIDENCE_PENALTIES[code], text });

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
      if (d.status === 'yes') reasons.push({ code: 'allergen_conflict', attr: a.attr, text: `Contains ${phrase}, which you react to` });
      else if (d.status === 'no') confirmed.push({ attr: a.attr, text: `${capitalize(phrase)}-free, which matters with your ${phrase} allergy` });
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
  }

  // 4. Leave out (allergy-equivalent or strong = hard filter on a confirmed 'yes').
  for (const l of s.leaveOut) {
    if (l.strength === 'cosmetic') continue; // handled as a preference penalty
    const d = pp.safety.details[l.attr] || { status: 'unknown' };
    const phrase = ATTRIBUTE_PHRASE[l.attr] || l.attr;
    if (d.status === 'yes') reasons.push({ code: 'leave_out_conflict', attr: l.attr, text: `Contains ${phrase}, which you asked us to leave out` });
    else if (d.status === 'unknown' && bodyContact(pp)) {
      blockedClaims.add(`${l.attr}_free`);
      penalize('leave_out_unknown', `Not confirmed ${phrase}-free`);
    }
  }

  // 5. Age outside stated range.
  if (up.physiology.age != null) {
    const { minimum, maximum } = pp.age;
    if (minimum != null && up.physiology.age < minimum) reasons.push({ code: 'age_below_minimum', text: `Intended for ages ${minimum} and up` });
    if (maximum != null && up.physiology.age > maximum) reasons.push({ code: 'age_above_maximum', text: `Intended for ages up to ${maximum}` });
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

  // 7. Pregnancy, TTC, breastfeeding.
  const preg = pp.pregnancy;
  if (s.pregnant && preg.overall !== 'not_applicable') {
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
  } else if (s.ttc && !s.pregnant && preg.overall !== 'not_applicable') {
    if (preg.overall === 'contraindicated') {
      penalize('ttc_pregnancy_contraindicated', 'Not for use in pregnancy');
      cautions.push({ code: 'ttc_pregnancy', text: 'Not for use during pregnancy. Stop if you become pregnant.' });
    } else if (preg.overall === 'unknown' && pp.ingested) penalize('ttc_pregnancy_unknown', 'Pregnancy safety not confirmed');
  }
  if (s.breastfeeding === 'yes' && pp.breastfeeding.overall !== 'not_applicable') {
    if (pp.breastfeeding.overall === 'contraindicated') reasons.push({ code: 'breastfeeding_contraindicated', text: 'Not for use while breastfeeding' });
    else if (pp.breastfeeding.overall === 'caution') {
      penalize('breastfeeding_caution', 'Clinician check advised while breastfeeding');
      cautions.push({ code: 'breastfeeding_caution', text: 'Check with your clinician before using this while breastfeeding.' });
    } else if (pp.ingested || pp.formats.includes('topical')) penalize('breastfeeding_unknown', 'Breastfeeding safety not confirmed');
  }
  for (const stage of up.physiology.lifeStages) {
    if (stage !== 'pregnant' && pp.life_stage[stage] === 'contraindicated') reasons.push({ code: 'life_stage_contraindicated', text: `Not for use in ${LIFE_STAGE_BY_ID[stage]?.phrase || stage}` });
  }

  // 8. Urgent "Not sure": more caution on higher-risk categories.
  if (s.urgent === 'not_sure' && (pp.ingested || pp.formats.includes('suppository') || pp.care_roles.includes('symptom_relief'))) {
    penalize('urgent_not_sure_high_risk', 'You were not sure if something is urgent');
  }

  // 9. Data quality and profile flags.
  if (pp.metadata_confidence < 0.5) penalize('low_metadata', 'Limited product data');
  if (up.physiology.confidenceFlags.includes('unusual_combination')) penalize('unusual_combination', 'Unusual age and life stage combination');
  const conflicting = up.physiology.compatibility.conflictingStages;
  if (conflicting.some((st) => ['designed_for', 'not_relevant', 'relevant'].includes(pp.life_stage[st]))) {
    penalize('stage_needs_clarification', 'Life stages that need clarification');
  }

  const confidence = Math.max(0.2, penalties.reduce((c, p) => c * p.factor, 1));
  return {
    eligible: reasons.length === 0,
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

// ─── Components ─────────────────────────────────────────────────────────────
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
      rel = Math.min(1, rel + (veryHigh ? 0.2 : condRel >= 0.55 ? 0.15 : 0.1));
      notes.health.push(`condition_pathway:${c.id}`);
    }
  }
  // Selected support need for a condition also reinforces pathway needs.
  if (need.id !== 'condition_support.pcos' && up.healthIntent.reinforcement.pcos && !up.safety.conditions.some((c) => c.id === 'pcos')
    && (CONDITION_PATHWAYS.pcos || []).includes(need.id) && (pp.health_need_relevance['condition_support.pcos']?.score || 0) >= 0.3) {
    rel = Math.min(1, rel + 0.1);
    notes.health.push('pcos_support_pathway');
  }

  // Cramp severity (only for the explicitly selected cramp need).
  if (need.id === 'pain.menstrual_cramp' && m.painIntensity != null) {
    rel = Math.min(1, rel + (base >= 0.8 ? 0.1 : base >= 0.55 ? 0.03 : 0) * m.painIntensity);
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
  return clamp01(rel);
}

function flowFit(pp, m) {
  const table = FLOW_CAPACITY_FIT[m.flow];
  if (!table || !pp.menstrual?.capacity) return 0.6;
  let fit = m.flow === 'varies' && pp.menstrual.versatile ? 1 : table[pp.menstrual.capacity] ?? 0.6;
  if (m.leakConcern && pp.menstrual.leak_protection && ['heavy', 'very_heavy'].includes(m.flow)) fit = Math.min(1, fit + 0.1);
  return fit;
}

function specificityComponent(pp, needId, base) {
  const rel = relationshipOf(base);
  const others = Object.entries(pp.health_need_relevance).filter(([id, e]) => id !== needId && e.score >= 0.8).length;
  const focus = Math.max(0.6, 1 - 0.08 * others);
  return clamp01((SPECIFICITY_BASE[rel] || 0) * focus);
}
function relationshipOf(score) {
  if (score >= 1) return 'direct';
  if (score >= 0.8) return 'strong';
  if (score >= 0.55) return 'secondary';
  if (score >= 0.3) return 'adjacent';
  if (score > 0) return 'weak';
  return 'unrelated';
}

const STAGE_EXPLANATION = {
  pregnant: 'Fits the pregnancy stage you shared',
  postpartum: 'Made for the postpartum stage you shared',
  perimenopause: 'Made with perimenopause in mind',
  menopause: 'Made with menopause in mind',
  postmenopause: 'Made with post-menopause in mind',
  ttc: 'Fits your plans to conceive',
};

function contextComponent(pp, up, need, notes, explanations) {
  let c = NEUTRAL.context;
  const conflicting = new Set(up.physiology.compatibility.conflictingStages);
  let stageExplained = false;
  for (const stage of up.physiology.lifeStages) {
    if (conflicting.has(stage)) continue; // neutralized until clarified
    const v = pp.life_stage[stage];
    if (v === 'designed_for') {
      c += 0.25;
      if (!stageExplained && STAGE_EXPLANATION[stage]) { explanations.push(STAGE_EXPLANATION[stage]); stageExplained = true; }
    } else if (v === 'relevant') c += 0.1;
    else if (v === 'not_relevant') c -= 0.25;
  }
  // Age is a small prior only, used when no stage was shared.
  if (!up.physiology.lifeStages.length && up.physiology.age != null && up.physiology.age >= 45 && pp.life_stage.perimenopause === 'designed_for') c += 0.05;
  // Diagnosed condition gives contextual relevance on pathway needs.
  for (const cond of up.safety.conditions) {
    if ((CONDITION_PATHWAYS[cond.id] || []).includes(need.id)) { c += 0.15; notes.conditionContext = cond.id; break; }
  }
  if (notes.flowFit != null) c = (c + notes.flowFit) / 2;
  if (need.modifiers?.postpartumTiming && pp.matched_rules.includes('postpartum_recovery_kit')) {
    if (need.modifiers.postpartumTiming === 'lt_6w') c += 0.2;
    if (['6_12m', 'gt_12m'].includes(need.modifiers.postpartumTiming)) c -= 0.3;
  }
  return clamp01(c);
}

function historyRelation(h, pp) {
  if (sameProduct(h, pp)) return 'same';
  if (h.resolvedProduct) {
    const hp = buildProductProfile(h.resolvedProduct);
    if (hp.category !== pp.category) return null;
    if (hp.brand.key && hp.brand.key === pp.brand.key) return 'very_similar';
    const sharedFormat = hp.formats.some((f) => pp.formats.includes(f));
    const sharedIngredient = hp.ingredient_keys.some((k) => pp.ingredient_keys.includes(k));
    return sharedFormat || sharedIngredient ? 'similar' : null;
  }
  // A brand-only entry ("Always") relates to that brand's products.
  if (h.brandKey && pp.brand.key && h.brandKey === pp.brand.key) return 'very_similar';
  return null;
}

function experienceComponent(pp, up, notes, explanations) {
  let x = NEUTRAL.experience;
  for (const h of up.experience.history) {
    const rel = historyRelation(h, pp);
    if (!rel) continue;
    for (const e of h.effects) {
      if (rel === 'same') x += e.same || 0;
      else x += (e.similar || 0) * (rel === 'very_similar' ? 1 : 0.6);
      if (rel !== 'same' && e.similarCaution) notes.similarReaction = true;
    }
    if (rel === 'same') {
      if (h.outcome === 'helped_a_lot') explanations.push('You said this helped a lot');
      else if (h.outcome === 'helped_somewhat') explanations.push('You said this helped somewhat');
    } else if (['helped_a_lot', 'helped_somewhat'].includes(h.outcome)) explanations.push('Similar to something that worked for you');
  }
  for (const p of up.shopping.positiveMentions) {
    if ((p.key && p.key === pp.brand.key) || (p.normalized && normalizeName(pp.name).includes(p.normalized))) {
      x += 0.15 * p.weight;
      explanations.push('From a brand you said you like');
      break;
    }
  }
  return clamp01(x);
}

function preferenceComponent(pp, up, notes, explanations) {
  const sh = up.shopping;
  // Formats
  let format = NEUTRAL.preference;
  if (sh.formats.preferred.length) {
    const hit = pp.formats.some((f) => sh.formats.preferred.includes(f));
    format = hit ? 1 : 0.35;
    if (hit) explanations.push('In a format you prefer');
  }
  const disliked = new Set();
  for (const d of sh.formats.disliked) {
    if (d.id) disliked.add(`${d.id}|${d.weight}`);
    if (d.fromProductId) {
      const h = up.experience.history.find((x) => x.resolvedProductId === d.fromProductId);
      if (h?.resolvedProduct) buildProductProfile(h.resolvedProduct).formats.forEach((f) => disliked.add(`${f}|1`));
    }
  }
  for (const key of disliked) {
    const [f, w] = key.split('|');
    if (pp.formats.includes(f)) format -= 0.4 * Number(w);
  }
  if (sh.formats.strict.length && !pp.formats.some((f) => sh.formats.strict.includes(f))) notes.filtered = 'format_strict';
  if (sh.declinesInternal && pp.internal) notes.filtered = 'internal_declined';

  // Values ("Should be") and leave-out matches
  const parts = [];
  for (const v of sh.shouldBe) {
    const st = pp.values[v.id];
    const val = st === 'yes' ? 1 : st === 'partial' ? 0.6 : st === 'no' ? 0 : st === 'not_applicable' ? 0.5 : 0.4;
    parts.push({ val, w: v.weight || 1 });
    if (st === 'yes') explanations.push(`${capitalize(valuePhrase(v.id))}, which you asked for`);
  }
  let cosmeticConflict = false;
  for (const l of sh.leaveOut) {
    const st = pp.safety.details[l.attr]?.status;
    const phrase = ATTRIBUTE_PHRASE[l.attr] || l.attr;
    if (st === 'no') { parts.push({ val: 1, w: 1 }); explanations.push(`${capitalize(phrase)}-free, which you asked for`); }
    else if (st === 'yes' && l.strength === 'cosmetic') { parts.push({ val: 0, w: 1 }); cosmeticConflict = true; }
    else if (st === 'unknown') parts.push({ val: 0.4, w: 1 });
  }
  const values = parts.length ? parts.reduce((s, p) => s + p.val * p.w, 0) / parts.reduce((s, p) => s + p.w, 0) : NEUTRAL.preference;

  // Brand
  let brand = NEUTRAL.preference;
  if (pp.brand.key && sh.trustedBrands.some((t) => t.key === pp.brand.key || (pp.brand.id_slug && t.key === normalizeBrand(pp.brand.id_slug)))) {
    brand = 1;
    explanations.push('From a brand you trust');
  }
  notes.cosmeticConflict = cosmeticConflict;
  return clamp01(0.35 * clamp01(format) + 0.4 * values + 0.25 * brand);
}
function valuePhrase(id) {
  return { unscented: 'unscented', organic: 'organic', vegan: 'vegan', cruelty_free: 'cruelty-free', minimal_ingredients: 'made with minimal ingredients', sensitive_skin: 'made for sensitive skin', reusable: 'reusable', eco_friendly: 'eco-friendly', pregnancy_considerations: 'pregnancy-reviewed', black_owned: 'Black-owned', brown_owned: 'Brown-owned' }[id] || id;
}

/** Evidence channels 0..1 for a product. */
export function evidenceChannels(pp) {
  const e = pp.evidence;
  const clinical = clamp01((e.product_specific * 2 + e.ingredient_specific + e.clinical_guideline) / 4) * (e.strength === 'limited' ? 0.5 : 1);
  const community = clamp01(e.community / 3 + (e.user_rating != null && e.user_rating >= 4.5 ? 0.1 : 0));
  const expert = clamp01((e.expert_opinion ? 0.5 : 0) + (e.clinician_source === 'independent' ? 0.3 : e.clinician_source === 'mixed' ? 0.2 : e.clinician_source === 'brand' ? 0.1 : 0) + (e.clinical_guideline > 0 ? 0.2 : 0));
  return { clinical, community, expert };
}

function evidenceComponent(pp, up, explanations) {
  const ch = evidenceChannels(pp);
  const w = up.trust.weights;
  const value = w.clinical * ch.clinical + w.community * ch.community + w.expert * ch.expert;
  const top = up.trust.ranking[0];
  if (top === 'clinical' && ch.clinical >= 0.75) explanations.push('Backed by clinical sources, which you ranked first');
  if (top === 'community' && ch.community >= 0.66) explanations.push('Well reviewed by other women, which you ranked first');
  if (top === 'expert' && ch.expert >= 0.8) explanations.push('Reviewed by experts, which you ranked first');
  return clamp01(value);
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

function priceComponent(pp, up, explanations) {
  const sh = up.shopping;
  const price = pp.price;
  if (price.is_free) return 1;
  if (sh.priceNotImportant || !sh.budget) return NEUTRAL.price;
  if (price.amount == null) return 0.7;
  let fit = budgetFit(price.amount, sh.budget);
  if (fit >= 1) explanations.push('Within your budget');
  else if (price.amount > sh.budget.max) {
    // History can gradually tighten the curve; it never rewrites the stated budget.
    fit -= Math.min(0.1, 0.05 * sh.priceSensitivity);
    // Purchases above the stated max soften the penalty by at most a quarter.
    const above = (up.behavior.purchasedPrices || []).filter((x) => x > sh.budget.max).length;
    if (above) fit += (1 - fit) * Math.min(0.25, 0.0625 * above);
    if (fit < 0.85) explanations.push('Above your usual budget');
  }
  if (price.amount >= 75 && price.amount > sh.budget.max) {
    if (sh.largePurchaseFrequency === 'Never') fit *= 0.85;
    else if (sh.largePurchaseFrequency === 'Rarely') fit *= 0.93;
  }
  return clamp01(fit);
}

function behaviorComponent(pp, up, notes) {
  const b = up.behavior;
  const id = pp.product_id;
  if (!id) return NEUTRAL.behavior;
  if (b.hidden.has(id)) { notes.filtered = notes.filtered || 'hidden_by_user'; return 0; }
  let v = NEUTRAL.behavior;
  if (b.saved.has(id)) v = Math.max(v, 0.85);
  if (b.purchased.has(id)) v = Math.max(v, 0.9);
  if (b.reordered.has(id)) v = 1;
  v += Math.min(0.1, 0.03 * (Number(b.viewed[id]) || 0));
  return clamp01(v);
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

// ─── Main entry points ──────────────────────────────────────────────────────
/**
 * Score one product for one of the user's needs.
 * @param {object} productOrProfile raw catalog product or buildProductProfile() result
 * @param {object} up buildUserProfile() result
 * @param {string} needId canonical need id
 * @param {{ safety?: object }} [opts] pass a precomputed evaluateSafety() result to skip recomputation
 */
export function scoreProductForNeed(productOrProfile, up, needId, opts = {}) {
  const pp = asProfile(productOrProfile);
  const need = up.healthIntent.needs.find((n) => n.id === needId) || { id: needId, modifiers: {}, source: 'adhoc' };
  const safety = opts.safety || evaluateSafety(pp, up);
  const notes = { health: [] };
  const healthExpl = [];
  const contextExpl = [];
  const otherExpl = [];

  const entry = pp.health_need_relevance[needId];
  const base = entry?.score || 0;
  const health = healthComponent(pp, up, need, base, notes);
  const relationship = relationshipOf(base);
  const phrase = needPhrase(needId);
  if (relationship === 'direct') healthExpl.push(`Made for ${phrase}`);
  else if (relationship === 'strong') healthExpl.push(`A strong match for ${phrase}`);
  else if (relationship === 'secondary') healthExpl.push(`Can help with ${phrase} alongside other options`);
  else if (relationship === 'adjacent') healthExpl.push(`Loosely related to ${phrase}`);

  const components = {
    health,
    specificity: specificityComponent(pp, needId, base),
    context: contextComponent(pp, up, need, notes, contextExpl),
    experience: experienceComponent(pp, up, notes, otherExpl),
    preference: preferenceComponent(pp, up, notes, otherExpl),
    evidence: evidenceComponent(pp, up, otherExpl),
    price: priceComponent(pp, up, otherExpl),
    behavior: behaviorComponent(pp, up, notes),
  };

  // Need-specific confidence adjustments on top of the product-level safety confidence.
  const confidenceReasons = safety.penalties.map((p) => ({ code: p.code, factor: p.factor, text: p.text }));
  let confidence = safety.confidence;
  const addPenalty = (code, text) => { confidence *= CONFIDENCE_PENALTIES[code]; confidenceReasons.push({ code, factor: CONFIDENCE_PENALTIES[code], text }); };
  if (needId === 'pain.menstrual_cramp' && need.modifiers?.painVaries) addPenalty('pain_varies', 'Pain varies');
  if (notes.similarReaction) addPenalty('similar_reaction_caution', 'Similar to a product that caused a mild reaction');
  if (notes.flowContradiction) addPenalty('flow_contradiction', 'Period support selected with no current periods');
  confidence = Math.max(0.2, Math.min(1, confidence));

  const weighted = Object.entries(WEIGHTS).reduce((sum, [k, w]) => sum + w * components[k], 0);
  const scores = base > 0;
  const cosmetic = notes.cosmeticConflict ? COSMETIC_LEAVE_OUT_FACTOR : 1;
  const raw = scores ? weighted * (safety.eligible ? 1 : 0) * confidenceFactor(confidence) * cosmetic : 0;
  const score = Math.round(raw);

  // Care flags.
  const m = need.modifiers || {};
  const careFirst = up.safety.careFirst;
  const careProminent = up.safety.careProminent
    || (needId === 'pain.menstrual_cramp' && (m.painIntensity ?? 0) >= 0.8)
    || (URINARY_UTI_NEEDS.has(needId) && ['right_now', 'first_time'].includes(m.utiFrequency))
    || (MENSTRUAL_PRODUCT_NEEDS.has(needId) && m.flow === 'very_heavy')
    || needId === 'urinary.burning' || needId === 'vaginal.discharge' || needId === 'sexual.sti';

  // Explanations: short, plain, user-facing, no em dashes. No "safe" claim when blocked.
  const explanations = [...healthExpl];
  if (MENSTRUAL_PRODUCT_NEEDS.has(needId) && notes.flowFit >= 0.85 && ['heavy', 'very_heavy'].includes(m.flow)) explanations.push(`High capacity for ${m.flow === 'very_heavy' ? 'very heavy' : 'heavy'} flow`);
  if (MENSTRUAL_PRODUCT_NEEDS.has(needId) && notes.flowFit >= 0.85 && ['very_light', 'light'].includes(m.flow)) explanations.push('Sized for a lighter flow');
  if (notes.conditionContext && notes.health.some((h) => h.startsWith('condition_pathway'))) explanations.push(`Fits the ${conditionPhrase(notes.conditionContext)} context you shared`);
  explanations.push(...contextExpl);
  safety.confirmed.forEach((c) => explanations.push(c.text));
  explanations.push(...otherExpl);
  if (notes.preventionOnlyNow) explanations.push('Not a substitute for getting checked');
  safety.cautions.forEach((c) => explanations.push(c.text.replace(/\.$/, '')));
  const finalExplanations = [...new Set(explanations.map(clean))];

  return {
    productId: pp.product_id,
    productName: pp.name,
    needId,
    needLabel: NEED_BY_ID[needId]?.option || phrase,
    relevance: base,
    relationship,
    score,
    components: Object.fromEntries(Object.entries(components).map(([k, v]) => [k, Math.round(v * 1000) / 1000])),
    weightedPoints: Object.fromEntries(Object.entries(components).map(([k, v]) => [k, Math.round(WEIGHTS[k] * v * 10) / 10])),
    safety: { eligible: safety.eligible, reasons: safety.reasons, cautions: safety.cautions, blockedClaims: safety.blockedClaims },
    confidence: Math.round(confidence * 1000) / 1000,
    confidenceFactor: Math.round(confidenceFactor(confidence) * 1000) / 1000,
    confidenceReasons,
    tier: scores && safety.eligible ? tierFor(score) : 'browse',
    explanations: finalExplanations,
    careFirst,
    careProminent: Boolean(careProminent),
    filtered: notes.filtered || null,
    fsaHsa: pp.fsa_hsa,
    flowFit: notes.flowFit ?? null,
    careRoles: pp.care_roles,
  };
}
function conditionPhrase(id) {
  return { pcos: 'PCOS', endometriosis: 'endometriosis', fibroids: 'fibroids', adenomyosis: 'adenomyosis', pmdd: 'PMDD', pms: 'PMS', anemia: 'anemia', anxiety: 'anxiety', depression: 'depression', ibs_digestive: 'digestive condition', infertility: 'fertility' }[id] || id;
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
    .sort((a, b) => b.score - a.score);
  const best = needs.find((r) => r.relevance > 0) || null;
  return { productId: pp.product_id, needs, best, safety, access: computeAccess(pp, up) };
}


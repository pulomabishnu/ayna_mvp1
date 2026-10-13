import { describe, expect, it } from 'vitest';
import {
  AVOID_GROUPS, AVOID_INGREDIENTS, AVOID_PAIRS, EMPTY, LEGACY_CONCERN_BY_ITEM, PREFERENCE_MAP, SUPPORT_GROUPS,
  asksBreastfeedingOnTiming, buildSnapshot, getIntakeSteps, reconstructIntakeFromSnapshot, ttcDurationOptions,
} from './intakeModel.js';
import { CONCERN_AREAS } from '../../utils/healthIntake.js';

const intake = (patch) => ({ ...EMPTY, ...patch });
const stepIds = (i) => getIntakeSteps(i).map((s) => s.id);

describe('conditional questions', () => {
  it('asks how long you have been trying only when trying to conceive, and saves it', () => {
    expect(stepIds(intake({}))).not.toContain('ttcDuration');
    const ttc = intake({ supportSelections: ['Trying to conceive'], ttcDuration: '6–12 months' });
    expect(stepIds(ttc)).toContain('ttcDuration');
    expect(buildSnapshot(ttc).ttcDuration).toBe('6–12 months');
    expect(buildSnapshot(intake({ ttcDuration: '6–12 months' })).ttcDuration).toBe('');
    expect(reconstructIntakeFromSnapshot(buildSnapshot(ttc)).ttcDuration).toBe('6–12 months');
  });

  it('drops "Not trying yet" when trying to conceive is a life stage', () => {
    expect(ttcDurationOptions(intake({ supportSelections: ['Fertility support'] }))).toContain('Not trying yet');
    expect(ttcDurationOptions(intake({ lifeStageSelections: ['I am trying to conceive'] }))).not.toContain('Not trying yet');
  });

  it('asks and saves breastfeeding for anyone postpartum, from the life stage or a need', () => {
    const byStage = intake({ lifeStageSelections: ['I am postpartum'], breastfeedingStatus: 'Yes' });
    const byNeed = intake({ supportSelections: ['Breastfeeding or lactation support'], breastfeedingStatus: 'No' });
    expect(asksBreastfeedingOnTiming(byStage)).toBe(false);
    expect(asksBreastfeedingOnTiming(byNeed)).toBe(true);
    expect(stepIds(byNeed)).toContain('postpartumTiming');
    expect(buildSnapshot(byStage).breastfeedingStatus).toBe('Yes');
    expect(buildSnapshot(byNeed).breastfeedingStatus).toBe('No');
  });

  it('saves the last period only for perimenopause, and $75+ frequency always', () => {
    const peri = intake({ lifeStageSelections: ['I am in perimenopause'], perimenopauseLastPeriod: '3–6 months ago', largePurchaseFrequency: 'Rarely' });
    const snap = buildSnapshot(peri);
    expect(snap.perimenopauseLastPeriod).toBe('3–6 months ago');
    expect(snap.largePurchaseFrequency).toBe('Rarely');
    expect(buildSnapshot(intake({ perimenopauseLastPeriod: '3–6 months ago' })).perimenopauseLastPeriod).toBe('');
    expect(reconstructIntakeFromSnapshot(snap).largePurchaseFrequency).toBe('Rarely');
  });
});

describe('option strings match their mappings', () => {
  it('maps every support option to a real legacy concern', () => {
    const items = SUPPORT_GROUPS.flatMap((g) => g.items).filter((i) => i !== 'Nothing right now');
    for (const item of items) {
      const mapped = [].concat(LEGACY_CONCERN_BY_ITEM[item] || []);
      expect(mapped.length, item).toBeGreaterThan(0);
      mapped.forEach((m) => expect(CONCERN_AREAS, item).toContain(m));
    }
  });

  it('only maps avoid/must-have options that exist', () => {
    const shown = [...AVOID_GROUPS.avoid, ...AVOID_GROUPS.want];
    shown.forEach((v) => expect(AVOID_INGREDIENTS).toContain(v));
    Object.entries(AVOID_PAIRS).forEach(([k, v]) => { expect(AVOID_INGREDIENTS).toContain(k); expect(AVOID_INGREDIENTS).toContain(v); });
    expect(PREFERENCE_MAP['Animal-derived']).toBe('vegan');
    expect(buildSnapshot(intake({ avoidIngredients: ['Animal-derived', 'Fragrance', 'Fragrance-free'] })).productPreferences).toEqual(expect.arrayContaining(['vegan', 'fragrance-free']));
  });

  it('auto-avoids products that made things worse, using the words the quiz saves', () => {
    const snap = buildSnapshot(intake({ productHistory: [
      { name: 'A', worked: 'Made it worse', reaction: '' },
      { name: 'B', worked: '', reaction: 'Serious' },
      { name: 'C', worked: 'Made things worse', reaction: '' },
      { name: 'D', worked: 'Helped a lot', reaction: 'Mild' },
    ] }));
    expect(snap.dislikedProducts).toEqual(['A', 'B', 'C']);
  });

  it('saves brand support from "Should be" and keeps it on resume', () => {
    const snap = buildSnapshot(intake({ avoidIngredients: ['Black-owned', 'Vegan'] }));
    expect(snap.brandSupportPreferences).toEqual(['Black-owned']);
    const back = reconstructIntakeFromSnapshot(snap);
    expect(back.brandSupportPreferences).toEqual(['Black-owned']);
    expect(buildSnapshot({ ...back, avoidIngredients: ['Vegan'] }).brandSupportPreferences).toEqual([]);
  });
});

// ─── Founder intake spec (2026-10): required / conditional / optional ─────
import {
  CHECKPOINT_STEP, FSA_HSA, LIFE_STAGE_EXCLUSIVE, MEDICATION_STATUS, ALLERGY_STATUS, URGENT_STATUS, PRODUCT_FORMATS, AVOID_LABELS,
  firstUnansweredStepId, getAnswerStates, isStepAnswered, markSkipped, minimumComplete, requiredReady, splitIntakeSteps,
  toggleLifeStageSelection,
} from './intakeModel.js';

const requiredIds = (i) => splitIntakeSteps(intake(i)).required.map((s) => s.id);
const optionalIds = (i) => splitIntakeSteps(intake(i)).optional.map((s) => s.id);
const MINIMUM = {
  age: '22', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], periodPain: 'Severe',
  diagnosisSelections: ['None that I know of'], allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No',
};

describe('required minimum (spec)', () => {
  it('requires exactly age, life stage, support, conditions, allergies, medications and urgent for everyone', () => {
    expect(requiredIds({})).toEqual(['age', 'lifeStage', 'support', 'conditions', 'allergies', 'medications', 'safety']);
  });

  it('puts every other question in the optional part, in order', () => {
    expect(optionalIds({})).toEqual(['zip', 'products', 'avoidRepeat', 'formats', 'recommendationCount', 'priceRange', 'brandOpenness', 'avoidIngredients', 'fsaHsa', 'trust', 'anythingElse']);
    expect(getIntakeSteps(intake({})).every((s, i, all) => !s.required || all.slice(0, i).every((p) => p.required))).toBe(true);
  });

  it('the spec example (22, regular periods, severe cramps, no/no/no/no) is a complete minimum', () => {
    expect(minimumComplete(intake(MINIMUM))).toBe(true);
    expect(firstUnansweredStepId(intake(MINIMUM))).toBe(CHECKPOINT_STEP);
    expect(minimumComplete(intake({ ...MINIMUM, periodPain: '' }))).toBe(false);
    expect(firstUnansweredStepId(intake({ ...MINIMUM, periodPain: '' }))).toBe('periodPain');
    expect(buildSnapshot(intake(MINIMUM)).minimumComplete).toBe(true);
  });

  it('age: needed, and under 18 never continues', () => {
    expect(requiredReady('age', intake({}))).toBe(false);
    expect(requiredReady('age', intake({ age: '17' }))).toBe(false);
    expect(requiredReady('age', intake({ age: '18' }))).toBe(true);
    expect(minimumComplete(intake({ ...MINIMUM, age: '16' }))).toBe(false);
  });

  it('life stage: "None of these / not sure" and "Prefer not to say" count and are exclusive', () => {
    expect(LIFE_STAGE_EXCLUSIVE).toEqual(['None of these / not sure', 'Prefer not to say']);
    expect(requiredReady('lifeStage', intake({ lifeStageSelections: ['Prefer not to say'] }))).toBe(true);
    expect(requiredReady('lifeStage', intake({ lifeStageSelections: ['None of these / not sure'] }))).toBe(true);
    expect(toggleLifeStageSelection(['I get periods regularly', 'I use hormonal birth control'], 'Prefer not to say')).toEqual(['Prefer not to say']);
    expect(toggleLifeStageSelection(['Prefer not to say'], 'I am pregnant')).toEqual(['I am pregnant']);
    expect(toggleLifeStageSelection(['Prefer not to say'], 'Prefer not to say')).toEqual([]);
    const snap = buildSnapshot(intake({ lifeStageSelections: ['Prefer not to say'] }));
    expect(snap.lifeStage).toBe('');
    expect(snap.lifeStageOther).toBe('');
    expect(snap.menstrualCycle).toBe('');
    expect(snap.answerStates.lifeStage).toBe('prefer_not');
  });

  it('support: at least one, "Nothing right now" counts', () => {
    expect(requiredReady('support', intake({}))).toBe(false);
    expect(requiredReady('support', intake({ supportSelections: ['Nothing right now'] }))).toBe(true);
    expect(getAnswerStates(intake({ supportSelections: ['Nothing right now'] })).support).toBe('explicit_no');
    expect(requiredReady('support', intake({ supportSelections: ['My own thing'] }))).toBe(true);
  });

  it('conditions: "None that I know of" and "Prefer not to say" both count', () => {
    expect(requiredReady('conditions', intake({}))).toBe(false);
    expect(requiredReady('conditions', intake({ diagnosisSelections: ['None that I know of'] }))).toBe(true);
    expect(requiredReady('conditions', intake({ diagnosisSelections: ['Prefer not to say'] }))).toBe(true);
    expect(getAnswerStates(intake({ diagnosisSelections: ['Prefer not to say'] })).conditions).toBe('prefer_not');
  });

  it('allergies and medications: Yes needs at least one item; not sure / prefer not count', () => {
    expect(ALLERGY_STATUS).toEqual(['Yes', 'No', "I'm not sure", 'Prefer not to say']);
    expect(MEDICATION_STATUS).toEqual(['Yes', 'No', "I'm not sure", 'Prefer not to say']);
    expect(requiredReady('allergies', intake({ allergyStatus: 'Yes' }))).toBe(false);
    expect(requiredReady('allergies', intake({ allergyStatus: 'Yes', allergyItems: ['Latex'] }))).toBe(true);
    expect(requiredReady('allergies', intake({ allergyStatus: "I'm not sure" }))).toBe(true);
    expect(requiredReady('medications', intake({ takesCurrent: 'Yes' }))).toBe(false);
    expect(requiredReady('medications', intake({ takesCurrent: 'Yes', currentMedicationItems: ['Zoloft'] }))).toBe(true);
    expect(requiredReady('medications', intake({ takesCurrent: "I'm not sure" }))).toBe(true);
    expect(getAnswerStates(intake({ takesCurrent: "I'm not sure" })).medications).toBe('not_sure');
  });

  it('urgent: Yes / No / Not sure, required', () => {
    expect(URGENT_STATUS).toEqual(['Yes', 'No', 'Not sure']);
    expect(requiredReady('safety', intake({}))).toBe(false);
    expect(requiredReady('safety', intake({ safetyConcern: 'Not sure' }))).toBe(true);
  });
});

describe('conditionally required follow-ups (spec)', () => {
  it('flow: required for period products, heavy or light periods; optional for other period needs; never from a stage alone', () => {
    ['Period product support', 'Heavy periods', 'Light periods'].forEach((need) => expect(requiredIds({ supportSelections: [need] })).toContain('periodFlow'));
    expect(requiredIds({ supportSelections: ['PMS symptoms'] })).not.toContain('periodFlow');
    expect(optionalIds({ supportSelections: ['PMS symptoms'] })).toContain('periodFlow');
    expect(stepIds(intake({ lifeStageSelections: ['I get periods regularly'], supportSelections: ['Acne'] }))).not.toContain('periodFlow');
  });

  it('pain: required only for cramps (pelvic pain is not period pain)', () => {
    expect(requiredIds({ supportSelections: ['Cramps or period pain'] })).toContain('periodPain');
    expect(stepIds(intake({ supportSelections: ['Pelvic pain'] }))).not.toContain('periodPain');
    expect(stepIds(intake({ supportSelections: ['Heavy periods'] }))).not.toContain('periodPain');
  });

  it('TTC duration: required when actively trying; optional with "Not trying yet" for fertility support or ovulation tracking', () => {
    expect(requiredIds({ lifeStageSelections: ['I am trying to conceive'] })).toContain('ttcDuration');
    expect(requiredIds({ supportSelections: ['Trying to conceive'] })).toContain('ttcDuration');
    expect(ttcDurationOptions(intake({ supportSelections: ['Trying to conceive'] }))).toEqual(['Less than 6 months', '6–12 months', 'More than 12 months', 'Prefer not to say']);
    expect(requiredIds({ supportSelections: ['Ovulation tracking or support'] })).not.toContain('ttcDuration');
    expect(optionalIds({ supportSelections: ['Ovulation tracking or support'] })).toContain('ttcDuration');
    expect(buildSnapshot(intake({ supportSelections: ['Fertility support'] })).tryingToConceive).toBe('');
    expect(buildSnapshot(intake({ supportSelections: ['Fertility support'], ttcDuration: 'Not trying yet' })).tryingToConceive).toBe('Not right now');
    expect(buildSnapshot(intake({ supportSelections: ['Trying to conceive'] })).tryingToConceive).toBe('Yes');
    expect(buildSnapshot(intake({ supportSelections: ['Acne'] })).tryingToConceive).toBe('');
  });

  it('UTI frequency: the four UTI-like symptoms, not incontinence', () => {
    ['Burning with urination', 'Frequent urination', 'Urinary urgency', 'Recurrent UTI-like symptoms'].forEach((need) => expect(requiredIds({ supportSelections: [need] })).toContain('utiFrequency'));
    expect(stepIds(intake({ supportSelections: ['Bladder leakage or incontinence'] }))).not.toContain('utiFrequency');
  });

  it('postpartum timing + breastfeeding: postpartum stage or need; breastfeeding asked once', () => {
    const stage = intake({ lifeStageSelections: ['I am postpartum'] });
    expect(requiredIds({ lifeStageSelections: ['I am postpartum'] })).toContain('postpartumTiming');
    expect(requiredReady('lifeStage', stage)).toBe(false);
    expect(requiredReady('lifeStage', { ...stage, breastfeedingStatus: 'Prefer not to say' })).toBe(true);
    expect(requiredReady('postpartumTiming', { ...stage, postpartumTiming: '3–6 months ago' })).toBe(true);
    const need = intake({ supportSelections: ['Postpartum recovery'], postpartumTiming: '3–6 months ago' });
    expect(requiredReady('postpartumTiming', need)).toBe(false);
    expect(requiredReady('postpartumTiming', { ...need, breastfeedingStatus: 'No' })).toBe(true);
    ['Postpartum body or skin changes', 'Breastfeeding or lactation support'].forEach((n) => expect(requiredIds({ supportSelections: [n] })).toContain('postpartumTiming'));
  });

  it('trimester: required only for "Pregnant"; optional for a pregnancy need alone', () => {
    expect(requiredIds({ lifeStageSelections: ['I am pregnant'] })).toContain('pregnancyTrimester');
    expect(requiredIds({ supportSelections: ['Pregnancy-safe product discovery'] })).not.toContain('pregnancyTrimester');
    expect(optionalIds({ supportSelections: ['Pregnancy-safe product discovery'] })).toContain('pregnancyTrimester');
  });

  it('last period: required with perimenopause, on the life-stage step', () => {
    const peri = intake({ lifeStageSelections: ['I am in perimenopause'] });
    expect(requiredReady('lifeStage', peri)).toBe(false);
    expect(requiredReady('lifeStage', { ...peri, perimenopauseLastPeriod: "I'm not sure" })).toBe(true);
  });
});

describe('optional answers (spec)', () => {
  it('optional steps never block and a Skip is stored as skipped', () => {
    optionalIds({}).forEach((id) => expect(requiredReady(id, intake({}))).toBe(true));
    const skipped = markSkipped(intake(MINIMUM), 'formats');
    const snap = buildSnapshot(skipped);
    expect(snap.skippedSteps).toEqual(['formats']);
    expect(snap.answerStates.formats).toBe('skipped');
    expect(snap.answerStates.zip).toBe('skipped');
    expect(snap.answerStates.trust).toBe('skipped');
    expect(snap.trustRanking).toEqual([]);
    expect(snap.recommendedProductsPerArea).toBe(3);
    expect(markSkipped(intake({ preferredFormats: ['Gummies'] }), 'formats').skippedSteps).toEqual([]);
  });

  it('options match the spec lists', () => {
    expect(FSA_HSA).toEqual(['FSA', 'HSA', 'Both', 'No', 'Not sure']);
    expect(PRODUCT_FORMATS).toContain('No preference');
    expect(AVOID_GROUPS.want.map((v) => AVOID_LABELS[v] || v)).toEqual(['Unscented', 'Organic', 'Vegan', 'Cruelty-free', 'Minimal ingredients', 'Sensitive-skin friendly', 'Reusable', 'Eco-friendly', 'Pregnancy considerations', 'Black-owned', 'Brown-owned']);
    expect(AVOID_GROUPS.avoid).toEqual(['Fragrance', 'Dyes', 'Parabens', 'Sulfates', 'Phthalates', 'Latex', 'Synthetic materials', 'Animal-derived', 'Added sugar', 'Artificial sweeteners']);
  });

  it('trusted brands only follow the two "trusted" answers', () => {
    expect(optionalIds({ brandOpenness: 'I enjoy discovering new brands' })).not.toContain('trustedBrands');
    expect(optionalIds({ brandOpenness: 'I prefer trusted brands but am open to something new' })).toContain('trustedBrands');
  });

  it('marks a question that does not apply as not_asked, not skipped', () => {
    const states = getAnswerStates(intake(MINIMUM));
    expect(states.periodPain).toBe('answered');
    expect(states.utiFrequency).toBe('not_asked');
    expect(states.pregnancyTrimester).toBe('not_asked');
    expect(isStepAnswered('recommendationCount', intake({}))).toBe(false);
    expect(isStepAnswered('recommendationCount', intake({ recommendationCountTouched: true }))).toBe(true);
  });
});

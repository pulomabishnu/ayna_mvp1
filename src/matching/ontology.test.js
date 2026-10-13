import { describe, it, expect } from 'vitest';
import {
  SUPPORT_GROUPS, LIFE_STAGES as INTAKE_LIFE_STAGES, CONDITIONS as INTAKE_CONDITIONS, ALLERGIES, PRODUCT_FORMATS, AVOID_GROUPS, AVOID_INGREDIENTS,
} from '../mobile/data/intakeModel.js';
import {
  NEEDS, needIdForOption, NON_NEED_OPTIONS, CONDITION_ID_BY_OPTION, LIFE_STAGE_ID_BY_OPTION, FORMAT_ID_BY_OPTION, LEAVE_OUT_BY_OPTION,
  VALUE_ID_BY_OPTION, ALLERGEN_BY_OPTION, canonicalize, confidenceBand, ageBandFor, normalizeText,
} from './ontology.js';

describe('ontology covers every intake option', () => {
  it('maps every "What needs support?" option to its own need id (no collapsing)', () => {
    const options = SUPPORT_GROUPS.flatMap((g) => g.items).filter((o) => !NON_NEED_OPTIONS.has(o));
    const ids = options.map((o) => needIdForOption(o));
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(options.length);
  });

  it('keeps sub-needs distinct (bloating, pain, mood families)', () => {
    expect(needIdForOption('Cycle-related bloating')).toBe('bloating.cycle_related');
    expect(needIdForOption('Digestive bloating')).toBe('bloating.digestive');
    expect(needIdForOption('Cramps or period pain')).toBe('pain.menstrual_cramp');
    expect(needIdForOption('Pain or discomfort during sex')).toBe('pain.sexual');
    expect(needIdForOption('Anxiety')).toBe('mood.general_anxiety');
    expect(needIdForOption('PMDD symptoms')).toBe('mood.pmdd');
    expect(needIdForOption('Vaginal dryness')).toBe('vaginal.dryness');
    expect(needIdForOption('BV concerns')).toBe('vaginal.bv');
    const ids = new Set(NEEDS.map((n) => n.id));
    ['bloating.pregnancy_related', 'bloating.unspecified', 'pain.abdominal', 'pain.joint', 'pain.postpartum', 'pain.pelvic', 'mood.low', 'mood.irritability', 'mood.cycle_related']
      .forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it('accepts the legacy label for hormone-related skin', () => {
    expect(needIdForOption('Other hormone-related skin concerns')).toBe('skin.hormonal');
  });

  it('maps every condition, life stage, format, allergy and avoid option', () => {
    INTAKE_CONDITIONS.filter((c) => !['None that I know of', 'Prefer not to say'].includes(c)).forEach((c) => expect(CONDITION_ID_BY_OPTION[c]).toBeTruthy());
    INTAKE_LIFE_STAGES.forEach((s) => expect(LIFE_STAGE_ID_BY_OPTION[s]).toBeTruthy());
    PRODUCT_FORMATS.filter((f) => f !== 'No preference').forEach((f) => expect(FORMAT_ID_BY_OPTION[f]).toBeTruthy());
    ALLERGIES.forEach((a) => expect(ALLERGEN_BY_OPTION[a]).toBeTruthy());
    AVOID_GROUPS.avoid.forEach((a) => expect(LEAVE_OUT_BY_OPTION[a]).toBeTruthy());
    AVOID_GROUPS.want.forEach((w) => expect(VALUE_ID_BY_OPTION[w]).toBeTruthy());
    AVOID_INGREDIENTS.filter((x) => x !== 'No preference').forEach((x) => expect(LEAVE_OUT_BY_OPTION[x] || VALUE_ID_BY_OPTION[x]).toBeTruthy());
  });

  it('maps both spellings of animal-derived (fixes the PREFERENCE_MAP mismatch)', () => {
    expect(LEAVE_OUT_BY_OPTION['Animal-derived'].attr).toBe('animal_derived');
    expect(LEAVE_OUT_BY_OPTION['Animal-derived ingredients'].attr).toBe('animal_derived');
  });
});

describe('canonicalize (spec examples)', () => {
  it('"hair falling out like crazy" -> hair loss 0.96', () => {
    const c = canonicalize('hair falling out like crazy');
    expect(c).toMatchObject({ raw_user_text: 'hair falling out like crazy', canonical_id: 'hair.loss', kind: 'need', confidence: 0.96 });
  });
  it('"endo" -> endometriosis 0.99', () => {
    expect(canonicalize('endo')).toMatchObject({ canonical_id: 'endometriosis', kind: 'condition', confidence: 0.99 });
    expect(canonicalize('Endo')).toMatchObject({ canonical_id: 'endometriosis' });
  });
  it('"can\'t keep anything down" -> nausea about 0.79, contextual only', () => {
    const c = canonicalize("can't keep anything down");
    expect(c.canonical_id).toBe('digestive.nausea');
    expect(c.confidence).toBeCloseTo(0.79, 2);
    expect(c.contextual_only).toBe(true);
  });
  it('"my hormones are insane" -> hormone complaint, low specificity, LOW band', () => {
    const c = canonicalize('my hormones are insane');
    expect(c.canonical_id).toBe('hormonal.general');
    expect(c.specificity).toBe('low');
    expect(c.contextual_only).toBe(true);
    expect(confidenceBand(c.confidence)).toBe('LOW');
  });
  it('exact intake options canonicalize with confidence 1', () => {
    expect(canonicalize('Vaginal dryness')).toMatchObject({ canonical_id: 'vaginal.dryness', confidence: 1, method: 'exact_option' });
  });
  it('restricts by kind and keeps raw text when nothing matches', () => {
    expect(canonicalize('endo', { kinds: ['format'] }).canonical_id).toBe(null);
    expect(canonicalize('pcos', { kinds: ['need'] }).canonical_id).toBe('condition_support.pcos');
    const none = canonicalize('purple elephants');
    expect(none.canonical_id).toBe(null);
    expect(none.raw_user_text).toBe('purple elephants');
  });
  it('splits bloating by context', () => {
    expect(canonicalize('bloated before my period').canonical_id).toBe('bloating.cycle_related');
    expect(canonicalize('bloating after eating').canonical_id).toBe('bloating.digestive');
    expect(canonicalize('so bloated').canonical_id).toBe('bloating.unspecified');
  });
  it('normalizes punctuation, case and contractions', () => {
    expect(normalizeText("  I CAN'T  sleep!! ")).toBe('i cannot sleep');
  });
});

describe('age bands', () => {
  it('uses the spec bands', () => {
    expect(ageBandFor(16)).toBe('adolescent');
    expect(ageBandFor(22)).toBe('emerging_adult');
    expect(ageBandFor(30)).toBe('reproductive_age');
    expect(ageBandFor(40)).toBe('later_reproductive_transition');
    expect(ageBandFor(50)).toBe('midlife_transition');
    expect(ageBandFor(60)).toBe('later_midlife');
    expect(ageBandFor(70)).toBe('older_adult');
    expect(ageBandFor(null)).toBe(null);
  });
});

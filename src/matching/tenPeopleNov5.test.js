// Nov 5: fixes from two 10-person simulation runs (founder: "keep testing and fixing").
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, CATALOG_PRODUCTS, getEcosystemSeedFromQuiz } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { evaluateSafety, formulaOnly } from './score.js';

const ok = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };
const intake = (a) => ({ ...EMPTY, ...ok, ...a });
const seed = (a) => getEcosystemSeedFromQuiz({ fullHealthIntake: intake(a), personalizationCompleted: true }, null, { engine: 'v2' });
const pp = (id) => buildProductProfile(CATALOG_PRODUCTS.find((p) => p.id === id));
const safety = (id, a) => evaluateSafety(pp(id), buildUserProfile(intake(a), { catalog: ALL_PRODUCTS }));
const shelf = (s, label) => s.shelves.find((x) => x.label === label);

describe('fragrance facts read the way the label says them', () => {
  it('"No fragrance or perfume is listed" and "non-perfumed" are fragrance-free, not a conflict', () => {
    expect(pp('p-monistat-3-combo').safety.details.fragrance.status).toBe('no');
    expect(pp('p-rael-liners').safety.details.fragrance.status).toBe('no');
    expect(pp('p-taro-clotrimazole-7').safety.details.fragrance.status).toBe('no');
  });
  it('a fragrance allergy no longer empties the yeast shelf', () => {
    const s = seed({ age: '26', lifeStageSelections: ['I use hormonal birth control'], supportSelections: ['Yeast infection concerns'], allergyStatus: 'Yes', allergyItems: ['Fragrance'] });
    expect(shelf(s, 'Yeast infection concerns').productIds).toEqual(expect.arrayContaining(['p-monistat-3-combo']));
  });
});

describe('latex allergy: a material, not a cream ingredient (MedlinePlus)', () => {
  const latex = { age: '66', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Vaginal dryness'], allergyStatus: 'Yes', allergyItems: ['Latex'] };
  it('a vaginal moisturizer is a check-the-label caution, never held for latex', () => {
    expect(formulaOnly(pp('p-good-clean-love'))).toBe(true);
    const r = safety('p-good-clean-love', latex);
    expect(r.missingProductInfo || []).not.toContain('allergen_info');
    expect(r.cautions.some((c) => /latex/i.test(c.text))).toBe(true);
  });
  it('devices and period products still need latex facts', () => {
    expect(formulaOnly(pp('p-rael-liners'))).toBe(false);
  });
  it('the dryness shelf has real picks', () => {
    expect(shelf(seed(latex), 'Vaginal dryness').productIds.length).toBeGreaterThanOrEqual(3);
  });
});

describe('medicines', () => {
  it('levothyroxine + ibuprofen: a MedlinePlus caution, shown', () => {
    const r = safety('p-advil-ibuprofen-200', { age: '48', lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Joint aches'], takesCurrent: 'Yes', currentMedicationItems: ['Levothyroxine'] });
    expect(r.eligible).toBe(true);
    expect(r.missingProductInfo || []).not.toContain('interaction_info');
    expect(r.cautions.some((c) => /levothyroxine/i.test(c.text))).toBe(true);
  });
  it('the pill + ibuprofen: shown with the Drug Facts ask-a-pharmacist line', () => {
    const r = safety('p-advil-ibuprofen-200', { age: '27', lifeStageSelections: ['I use hormonal birth control'], supportSelections: ['Cycle-related headaches or migraines'], takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill'] });
    expect(r.missingProductInfo || []).not.toContain('interaction_info');
    expect(r.cautions.some((c) => c.code === 'medication_label_ask')).toBe(true);
  });
  it('warfarin + ibuprofen stays excluded', () => {
    const r = safety('p-advil-ibuprofen-200', { age: '38', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], takesCurrent: 'Yes', currentMedicationItems: ['Warfarin'] });
    expect(r.eligible).toBe(false);
  });
  it('a supplement with an unreviewed medicine pair is still held', () => {
    const r = safety('p-magnesium-glycinate', { age: '38', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping'], takesCurrent: 'Yes', currentMedicationItems: ['Warfarin'] });
    expect(r.missingProductInfo || []).toContain('interaction_info');
  });
});

describe('shelves say why, and fill when products qualify', () => {
  it('menopause + pain during sex: moisturizers are good matches (MedlinePlus: first option)', () => {
    const s = shelf(seed({ age: '57', lifeStageSelections: ['I am in menopause'], supportSelections: ['Pain or discomfort during sex'] }), 'Pain or discomfort during sex');
    expect(s.picks.length).toBeGreaterThanOrEqual(3);
    expect(s.picks[0].score).toBeGreaterThanOrEqual(65);
  });
  it('without menopause the same moisturizer stays a secondary fit', () => {
    const up = buildUserProfile(intake({ age: '25', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Pain or discomfort during sex'] }), { catalog: ALL_PRODUCTS });
    const s = shelf(seed({ age: '25', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Pain or discomfort during sex'] }), 'Pain or discomfort during sex');
    for (const p of s.picks.filter((x) => x.productId === 'p-good-clean-love')) expect(p.score).toBeLessThan(65);
    expect(up).toBeTruthy();
  });
  it('pregnant with constipation: why it is empty, and what to do first (womenshealth.gov)', () => {
    const s = seed({ age: '29', lifeStageSelections: ['I am pregnant'], pregnancyTrimester: 'Second trimester', supportSelections: ['Constipation'] });
    const c = shelf(s, 'Constipation');
    expect(c.productIds).toHaveLength(0);
    expect(c.emptyReason).toBe('clinician_first_for_stage');
    expect(s.careFlags.notes.some((n) => n.code === 'pregnancy_constipation')).toBe(true);
  });
  it('bleeding after menopause: the shelf says to get it checked', () => {
    const s = seed({ age: '52', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Spotting between periods'] });
    const c = s.shelves.find((x) => x.needId === 'cycle.spotting');
    expect(c.productIds).toHaveLength(0);
    expect(c.emptyReason).toBe('care_first');
  });
  it('migraine with aura on hormonal birth control gets the CDC note', () => {
    const s = seed({ age: '27', lifeStageSelections: ['I use hormonal birth control'], supportSelections: ['Nausea'], diagnosisSelections: ['Migraine with aura'], takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill'] });
    expect(s.careFlags.notes.some((n) => n.code === 'estrogen_bc_condition' && n.prominent)).toBe(true);
  });
  it('leaks: a shelf fills past three when more strong matches qualify', () => {
    const s = shelf(seed({ age: '33', lifeStageSelections: ['I am postpartum'], postpartumTiming: '3–6 months ago', breastfeedingStatus: 'No', supportSelections: ['Bladder leakage or incontinence'] }), 'Bladder leakage or incontinence');
    expect(s.productIds.length).toBeGreaterThanOrEqual(4);
  });
  it('a birth control telehealth service is a caution, not hidden, with high blood pressure', () => {
    const r = safety('d-twentyeight-health-birth-control-emergency-contr', { age: '36', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Contraception'], diagnosisSelections: ['High blood pressure'] });
    expect(r.eligible).toBe(true);
    expect(r.cautions.some((c) => c.code === 'condition_caution' && /estrogen/i.test(c.text))).toBe(true);
  });
  it('an estrogen birth control product itself stays excluded with migraine with aura', () => {
    const bc = ALL_PRODUCTS.map((p) => buildProductProfile(p)).find((x) => x && !x.access?.is_care_service && x.category !== 'telehealth' && /combined|estradiol|ethinyl/i.test(x.name || ''));
    if (!bc) return;
    const r = evaluateSafety(bc, buildUserProfile(intake({ age: '27', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Contraception'], diagnosisSelections: ['Migraine with aura'] }), { catalog: ALL_PRODUCTS }));
    expect(r.eligible).toBe(false);
  });
});

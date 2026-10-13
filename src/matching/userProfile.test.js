import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY, buildSnapshot } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';

const intake = (over) => ({ ...EMPTY, ...over });

describe('buildUserProfile layers', () => {
  it('one answer writes to several layers: pregnant', () => {
    const up = buildUserProfile(intake({ lifeStageSelections: ['I am pregnant'], pregnancyTrimester: 'Second trimester' }));
    expect(up.safety.pregnant).toBe(true);
    expect(up.safety.trimester).toBe(2);
    expect(up.physiology.lifeStages).toContain('pregnant');
    expect(up.healthIntent.needs).toHaveLength(0); // no nausea or constipation assumed
  });

  it('age 22 + post-menopause keeps the stage and flags unusual_combination', () => {
    const up = buildUserProfile(intake({ age: '22', lifeStageSelections: ['I am post-menopause'] }));
    expect(up.physiology.lifeStages).toEqual(['postmenopause']);
    expect(up.physiology.ageBand).toBe('emerging_adult');
    expect(up.physiology.confidenceFlags).toContain('unusual_combination');
  });

  it('keeps the exact age, including minors the legacy snapshot drops', () => {
    expect(buildUserProfile(intake({ age: '16' })).physiology).toMatchObject({ age: 16, ageBand: 'adolescent' });
  });

  it('classifies life stage combinations', () => {
    const legit = buildUserProfile(intake({ lifeStageSelections: ['I am postpartum'], breastfeedingStatus: 'Yes' }));
    expect(legit.physiology.compatibility.combos).toEqual([{ stages: ['postpartum', 'breastfeeding'], verdict: 'legit' }]);
    expect(legit.physiology.confidenceFlags).toHaveLength(0);
    const unclear = buildUserProfile({ lifeStageSelections: ['I am pregnant', 'I get periods regularly'] });
    expect(unclear.physiology.compatibility.conflictingStages).toEqual(expect.arrayContaining(['pregnant', 'regular_periods']));
    expect(unclear.physiology.confidenceFlags).toContain('needs_clarification');
    expect(unclear.physiology.lifeStages).toEqual(expect.arrayContaining(['pregnant', 'regular_periods']));
  });

  it('one need per selected option, with modifiers only on selected needs', () => {
    const up = buildUserProfile(intake({
      supportSelections: ['Cramps or period pain', 'Acne', 'Heavy periods'], periodPain: 'Severe', periodFlow: 'Very heavy', utiFrequency: 'Rarely',
    }));
    const cramps = up.healthIntent.needs.find((n) => n.id === 'pain.menstrual_cramp');
    expect(cramps.intensity).toBe(0.8);
    expect(up.healthIntent.needs.find((n) => n.id === 'period.heavy').modifiers.flow).toBe('very_heavy');
    expect(up.healthIntent.needs.find((n) => n.id === 'skin.acne').modifiers).toEqual({});
    expect(up.healthIntent.needs.some((n) => n.id.startsWith('urinary'))).toBe(false);
  });

  it('pain intensity map: varies lowers confidence, not sure is no modifier', () => {
    const v = buildUserProfile(intake({ supportSelections: ['Cramps or period pain'], periodPain: 'It varies' }));
    expect(v.healthIntent.needs[0].modifiers).toMatchObject({ painIntensity: 0.5, painVaries: true });
    const n = buildUserProfile(intake({ supportSelections: ['Cramps or period pain'], periodPain: 'Not sure' }));
    expect(n.healthIntent.needs[0].intensity).toBe(null);
  });

  it('PCOS reinforcement never diagnoses and needs a PCOS anchor', () => {
    const anchored = buildUserProfile(intake({ supportSelections: ['PCOS support', 'Acne', 'Hair thinning or hair loss', 'Excess facial or body hair', 'Irregular periods'] }));
    expect(anchored.healthIntent.reinforcement.pcos).toBe('very_high');
    const noAnchor = buildUserProfile(intake({ supportSelections: ['Acne', 'Hair thinning or hair loss', 'Excess facial or body hair', 'Irregular periods'] }));
    expect(noAnchor.healthIntent.reinforcement).toEqual({});
    expect(noAnchor.safety.conditions).toHaveLength(0);
  });

  it('custom entries are canonicalized (raw text kept)', () => {
    const up = buildUserProfile(intake({ supportSelections: ['hair falling out like crazy'], diagnosisSelections: ['endo'] }));
    const need = up.healthIntent.needs[0];
    expect(need).toMatchObject({ id: 'hair.loss', source: 'custom', raw: 'hair falling out like crazy' });
    expect(up.safety.conditions[0]).toMatchObject({ id: 'endometriosis', raw: 'endo' });
  });

  it('experience semantics follow the spec, including legacy strings', () => {
    const up = buildUserProfile(intake({
      productHistory: [
        { name: 'ThermaCare Heat Wraps', current: 'No', worked: 'Made things worse', reaction: '', stopReasons: [] },
        { name: 'Thinx Period Underwear', current: 'No', worked: 'Helped somewhat', reaction: 'Serious or concerning reaction', stopReasons: [] },
        { name: 'Flo PMS Gummy Vitamins', current: 'No', worked: '', reaction: 'No', stopReasons: ['A clinician recommended stopping it', 'It was too expensive'] },
      ],
    }), { catalog: ALL_PRODUCTS });
    const [a, b, c] = up.experience.history;
    expect(a).toMatchObject({ outcome: 'made_worse', hardSuppress: true, resolvedProductId: 'p-thermacare' });
    expect(b).toMatchObject({ reaction: 'serious', exclude: true, safetyFlag: true });
    expect(c).toMatchObject({ hardSuppress: true, stopReasons: ['clinician_stop', 'too_expensive'] });
    expect(up.shopping.priceSensitivity).toBe(1);
  });

  it('shopping layer: budget, exploration, trusted brands, leave-out vs should-be, FSA', () => {
    const up = buildUserProfile(intake({
      priceRange: ['$25–$75'], brandOpenness: 'I enjoy discovering new brands', trustedBrands: ['Rael', 'Some Indie Brand'],
      avoidIngredients: ['Fragrance', 'Vegan', 'Animal-derived'], allergyStatus: 'Yes', allergyItems: ['Fragrance'], fsaHsaAnswer: 'HSA',
      preferredFormats: ['Gummies', 'No preference'], recommendedProductsPerArea: 5,
    }));
    expect(up.shopping.budget).toMatchObject({ min: 25, max: 75 });
    expect(up.shopping.brandExploration).toBe(0.9);
    expect(up.shopping.trustedBrands.map((t) => t.key)).toEqual(['rael', 'someindiebrand']);
    expect(up.shopping.leaveOut).toEqual(expect.arrayContaining([
      expect.objectContaining({ attr: 'fragrance', strength: 'allergy_equivalent' }),
      expect.objectContaining({ attr: 'animal_derived', strength: 'strong' }),
    ]));
    expect(up.shopping.shouldBe.map((v) => v.id)).toEqual(['vegan']);
    expect(up.shopping.fsaHsa).toBe('hsa');
    expect(up.shopping.picksPerNeed).toBe(5);
    expect(up.shopping.formats.preferred).toEqual(['gummy']);
  });

  it('price not important removes the budget curve', () => {
    expect(buildUserProfile(intake({ priceRange: ['Price is not a major factor for me', '$25–$75'] })).shopping.budget).toBe(null);
  });

  it('trust weights follow the ranking, equal when untouched', () => {
    const ranked = buildUserProfile(intake({ trustRanking: ['Reviews and experiences from other women', 'Clinical or scientific evidence', 'Brand reputation or expert recommendations'], trustRankingTouched: true }));
    expect(ranked.trust.weights).toEqual({ community: 0.6, clinical: 0.25, expert: 0.15 });
    const untouched = buildUserProfile(intake({}));
    expect(untouched.trust.weights.clinical).toBeCloseTo(1 / 3);
  });

  it('hormonal birth control life stage adds a class-level medication for interaction checks', () => {
    const up = buildUserProfile(intake({ lifeStageSelections: ['I use hormonal birth control'] }));
    expect(up.safety.medications[0].all_classes).toContain('hormonal_contraceptive');
  });

  it('urgent answers set care flags', () => {
    expect(buildUserProfile(intake({ safetyConcern: 'Yes' })).safety).toMatchObject({ careFirst: true, careProminent: true });
    expect(buildUserProfile(intake({ safetyConcern: 'Not sure' })).safety).toMatchObject({ careFirst: false, careProminent: true });
  });

  it('accepts the buildSnapshot() shape and quizAnswers.fullHealthIntake', () => {
    const raw = intake({ age: '30', supportSelections: ['Vaginal dryness'], zipcode: '10026', fsaHsaAnswer: 'FSA', anythingElse: 'no pills please' });
    const snap = buildSnapshot(raw);
    const fromSnap = buildUserProfile(snap);
    const fromQuiz = buildUserProfile({ fullHealthIntake: snap });
    expect(fromSnap.healthIntent.needs.map((n) => n.id)).toEqual(['vaginal.dryness']);
    expect(fromSnap.shopping.fsaHsa).toBe('fsa');
    expect(fromSnap.access.zip).toBe('10026');
    expect(fromQuiz.healthIntent.needs.map((n) => n.id)).toEqual(['vaginal.dryness']);
  });
});

describe('older saved profiles (step 2)', () => {
  it('maps first-quiz frustrations to the specific needs they named, only without current answers', () => {
    const legacy = buildUserProfile({ frustrations: ['Heavy flow', 'Painful cramps', 'General discomfort', 'Urinary incontinence'] });
    expect(legacy.healthIntent.needs.map((n) => n.id)).toEqual(['period.heavy', 'pain.menstrual_cramp', 'urinary.incontinence']);
    const current = buildUserProfile({ frustrations: ['Hormonal bloating'], fullHealthIntake: { supportSelections: ['Acne'] } });
    expect(current.healthIntent.needs.map((n) => n.id)).toEqual(['skin.acne']);
  });
  it('maps first web intake concerns and symptoms', () => {
    const up = buildUserProfile({ primaryConcerns: ['UTI support', 'Sleep and energy'], symptoms: ['cramps'] });
    expect(up.healthIntent.needs.map((n) => n.id)).toEqual(['urinary.recurrent_uti', 'sleep.trouble', 'energy.fatigue', 'pain.menstrual_cramp']);
  });
  it('reads first-quiz sensitivities as allergies, products to avoid as the avoid list, and preferences as values', () => {
    const up = buildUserProfile({ frustrations: ['Painful cramps'], sensitivities: ['Latex allergy'], productsToAvoid: ['Fragrance sensitivity', 'ThermaCare'], preference: ['Organic/Natural only', 'Non-hormonal / hormone-free'], internalComfort: 'No' }, { catalog: ALL_PRODUCTS });
    expect(up.safety.allergies.map((a) => a.id)).toEqual(['latex', 'fragrance']);
    expect(up.safety.avoid.map((a) => a.raw)).toEqual(['ThermaCare']);
    expect(up.shopping.shouldBe.map((v) => v.id)).toEqual(['organic']);
    expect(up.shopping.leaveOut.map((l) => l.attr)).toEqual(['hormones']);
    expect(up.shopping.declinesInternal).toBe(true);
  });
});

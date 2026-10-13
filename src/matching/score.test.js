import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { scoreProductForNeed, scoreProduct, evaluateSafety, budgetFit, tierFor, computeAccess, DIMENSION_WEIGHTS } from './score.js';

const byId = Object.fromEntries(ALL_PRODUCTS.map((p) => [p.id, p]));
const P = (id) => byId[id];
const user = (over, opts = {}) => buildUserProfile({ ...EMPTY, ...over }, { catalog: ALL_PRODUCTS, ...opts });
const score = (id, up, need) => scoreProductForNeed(P(id), up, need);

describe('formula and tiers', () => {
  // ASK2 (spec C): the match is relevance-anchored with a dynamic
  // denominator over known preference dimensions, so there is no fixed
  // 100-point weight table any more.
  it('preference dimensions are the ones the spec lists', () => {
    expect(Object.keys(DIMENSION_WEIGHTS).sort()).toEqual(['brand', 'context', 'effort', 'evidence', 'format', 'price', 'values']);
  });
  it('tiers: excellent >= 80, strong >= 65, exploratory >= 50, browse < 50', () => {
    expect(tierFor(80)).toBe('excellent');
    expect(tierFor(79)).toBe('strong');
    expect(tierFor(65)).toBe('strong');
    expect(tierFor(64)).toBe('exploratory');
    expect(tierFor(50)).toBe('exploratory');
    expect(tierFor(49)).toBe('browse');
  });
  // ASK2 (spec C): confidence is a separate output and no longer multiplies
  // the displayed match (was 0.7 + 0.3 x confidence).
  it('confidence is reported separately and never changes the match', () => {
    const base = user({ supportSelections: ['Cramps or period pain'], lifeStageSelections: ['I get periods regularly'], allergyStatus: 'No' });
    const allergic = user({ supportSelections: ['Cramps or period pain'], lifeStageSelections: ['I get periods regularly'], allergyStatus: 'Yes', allergyItems: ['Latex'] });
    const a = scoreProductForNeed(P('p-thermacare'), base, 'pain.menstrual_cramp');
    const b = scoreProductForNeed(P('p-thermacare'), allergic, 'pain.menstrual_cramp');
    expect(b.confidence).toBeLessThan(a.confidence);
    expect(b.score).toBe(a.score);
  });
});

describe('score per need (critical)', () => {
  const up = user({ supportSelections: ['Cramps or period pain', 'Acne', 'Anxiety', 'Vaginal dryness'] });

  it('one product gets different scores per need, not one generic score', () => {
    const r = scoreProduct(P('p-sootheher-elaris-pod'), up);
    const by = Object.fromEntries(r.needs.map((n) => [n.needId, n.score]));
    expect(by['pain.menstrual_cramp']).toBeGreaterThanOrEqual(80);
    expect(by['skin.acne']).toBe(0);
    expect(by['mood.general_anxiety']).toBe(0);
    expect(by['vaginal.dryness']).toBe(0);
    expect(r.best.needId).toBe('pain.menstrual_cramp');
  });

  it('lube is a partial dryness match, a vaginal moisturizer a direct one', () => {
    const lube = score('p-uberlube', up, 'vaginal.dryness');
    const moist = score('p-neycher-vaginal-moisturizer', up, 'vaginal.dryness');
    expect(moist.score).toBeGreaterThan(lube.score);
    expect(lube.score).toBeGreaterThan(0);
    expect(moist.explanations[0]).toBe('Matches the vaginal dryness you selected');
  });

  it('returns the components, separate outputs and short explanations without em dashes', () => {
    const r = score('p-thermacare', up, 'pain.menstrual_cramp');
    expect(Object.keys(r.components).sort()).toEqual(['behavior', 'context', 'evidence', 'experience', 'health', 'preference', 'price', 'specificity']);
    expect(Object.keys(r.outputs).sort()).toEqual(['access', 'confidence', 'evidence', 'preferenceFit', 'relevance', 'safety']);
    expect(r.explanations[0]).toBe('Matches the period cramps you selected');
    r.explanations.forEach((e) => expect(e).not.toMatch(/[—–]/));
  });
});

describe('pregnancy gate', () => {
  const pregnant = user({ lifeStageSelections: ['I am pregnant'], pregnancyTrimester: 'Second trimester', supportSelections: ['Cramps or period pain', 'Pregnancy-related discomfort'] });
  const notPregnant = user({ supportSelections: ['Cramps or period pain', 'Pregnancy-related discomfort'], lifeStageSelections: ['I get periods regularly'] });

  it('excludes products the catalog says are not for pregnancy', () => {
    const r = score('p-sootheher-elaris-pod', pregnant, 'pain.menstrual_cramp');
    expect(r.safety.eligible).toBe(false);
    expect(r.safety.reasons.map((x) => x.code)).toContain('pregnancy_contraindicated');
    expect(r.score).toBe(0);
  });

  it('unknown pregnancy safety lowers confidence and blocks any safe claim', () => {
    const p = score('p-thermacare', pregnant, 'pain.menstrual_cramp');
    const n = score('p-thermacare', notPregnant, 'pain.menstrual_cramp');
    expect(p.safety.eligible).toBe(true);
    expect(p.confidence).toBeLessThan(n.confidence);
    // ASK2: missing safety data limits confidence, it does not lower the match.
    expect(p.score).toBe(n.score);
    expect(p.safety.blockedClaims).toContain('pregnancy_safe');
    expect(p.explanations.join(' ')).toMatch(/Pregnancy safety is not confirmed/);
    p.explanations.forEach((e) => expect(e).not.toMatch(/\bsafe (for|in|during) pregnan|pregnancy[- ]safe\b/i));
  });

  it('pregnancy stage boosts pregnancy-designed products with a stage explanation', () => {
    const r = score('p-belly-bandit', pregnant, 'pregnancy.discomfort');
    expect(r.explanations).toContain('Matches your pregnancy discomfort and the pregnancy stage you shared');
    expect(r.components.health).toBeGreaterThanOrEqual(score('p-belly-bandit', notPregnant, 'pregnancy.discomfort').components.health);
    expect(r.score).toBeGreaterThan(score('p-belly-bandit', notPregnant, 'pregnancy.discomfort').score);
  });
});

describe('age and life stage', () => {
  it('age 22 + post-menopause keeps the stage, with a confidence flag', () => {
    const up = user({ age: '22', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Vaginal dryness'] });
    const r = score('p-kindra-lotion', up, 'vaginal.dryness');
    expect(r.explanations).toContain('Matches your vaginal dryness and the post-menopause stage you shared');
    expect(r.confidenceReasons.map((c) => c.code)).toContain('unusual_combination');
  });

  it('excludes products outside a stated age range', () => {
    const minor = user({ age: '16', supportSelections: ['Sexual wellness or comfort'] });
    expect(score('p-maude-vibe', minor, 'sexual.wellness').safety.reasons.map((r) => r.code)).toContain('age_below_minimum');
    const adult = user({ age: '30', supportSelections: ['Sexual wellness or comfort'] });
    expect(score('p-maude-vibe', adult, 'sexual.wellness').safety.eligible).toBe(true);
  });

  it('contradictory stages are neutralized, not used to boost or suppress', () => {
    const up = user({ lifeStageSelections: ['I am pregnant', 'I get periods regularly'], supportSelections: ['Period product support'] });
    const r = score('p-rael-organic-pad', up, 'period.product_support');
    // ASK2: neutralized = not used at all (unknown), instead of a neutral 0.6.
    expect(r.components.context).toBe(null);
    expect(r.confidenceReasons.map((c) => c.code)).toContain('stage_needs_clarification');
  });
});

describe('ZIP and access', () => {
  it('ZIP never changes the health score', () => {
    const base = { supportSelections: ['Cramps or period pain', 'Vaginal dryness', 'Finding a telehealth provider'], priceRange: ['$25–$75'] };
    const withZip = user({ ...base, zipcode: '10026' });
    const noZip = user(base);
    for (const p of ALL_PRODUCTS.slice(0, 120)) {
      const a = scoreProduct(p, withZip).needs.map((n) => n.score);
      const b = scoreProduct(p, noZip).needs.map((n) => n.score);
      expect(a).toEqual(b);
    }
  });
  it('access is reported separately', () => {
    const up = user({ zipcode: '10026' });
    expect(computeAccess(P('p-always-infinity'), up)).toMatchObject({ score: 95, label: 'At major US retailers' });
    expect(computeAccess(P('d-midi-health'), up)).toMatchObject({ label: 'Check that they serve your state' });
    expect(computeAccess(P('p-mypelvicbra-classic'), up).label).toBe('Ships from the EU');
  });
});

describe('flow and menstrual characteristics', () => {
  it('very heavy + leaks ranks high-capacity products above ordinary pads and liners', () => {
    const up = user({ supportSelections: ['Period product support', 'Heavy periods'], periodFlow: 'Very heavy', anythingElse: 'I leak through everything overnight' });
    for (const need of ['period.product_support', 'period.heavy']) {
      const overnight = score('p-rael-overnight', up, need).score;
      const disc = score('p-lumma-disc', up, need).score;
      const ordinary = score('p-stayfree-ultra', up, need).score;
      const liner = score('p-carefree-liners', up, need).score;
      expect(overnight).toBeGreaterThan(ordinary);
      expect(disc).toBeGreaterThan(ordinary);
      expect(ordinary).toBeGreaterThan(liner);
    }
    expect(score('p-rael-overnight', up, 'period.heavy').explanations).toContain('High capacity for very heavy flow');
    expect(score('p-rael-overnight', up, 'period.heavy').careProminent).toBe(true);
  });

  it('very light flow prefers liners', () => {
    const up = user({ supportSelections: ['Period product support'], periodFlow: 'Very light' });
    expect(score('p-carefree-liners', up, 'period.product_support').score).toBeGreaterThan(score('p-rael-overnight', up, 'period.product_support').score);
  });

  it('very heavy + fragrance allergy + sensitive skin: fragranced excluded, unknown penalized, confirmed fragrance-free wins', () => {
    const up = user({
      supportSelections: ['Heavy periods'], periodFlow: 'Very heavy', allergyStatus: 'Yes', allergyItems: ['Fragrance'], avoidIngredients: ['Sensitive skin'],
    });
    const honey = score('p-honeypot-pad', up, 'period.heavy');
    expect(honey.safety.eligible).toBe(false);
    expect(honey.safety.reasons[0].code).toBe('allergen_conflict');
    const always = score('p-always-infinity', up, 'period.heavy');
    expect(always.safety.eligible).toBe(true);
    expect(always.explanations.join(' ')).toMatch(/Choose the fragrance-free version/);
    const rael = score('p-rael-overnight', up, 'period.heavy');
    expect(rael.explanations).toContain('Fragrance-free, which matters with your fragrance allergy');
    expect(rael.score).toBeGreaterThan(always.score);
  });

  it('"no periods" flow with a period need is treated as a contradiction', () => {
    const up = user({ supportSelections: ['Period product support'], periodFlow: 'I do not currently get periods' });
    const r = score('p-rael-organic-pad', up, 'period.product_support');
    expect(r.confidenceReasons.map((c) => c.code)).toContain('flow_contradiction');
  });
});

describe('allergies and leave-out', () => {
  it('latex allergy + unknown latex status = confidence penalty, not latex-free points', () => {
    const up = user({ supportSelections: ['Cramps or period pain', 'Period product support'], allergyStatus: 'Yes', allergyItems: ['Latex'] });
    const unknown = score('p-thermacare', up, 'pain.menstrual_cramp');
    expect(unknown.safety.eligible).toBe(true);
    expect(unknown.confidence).toBeLessThan(1);
    expect(unknown.safety.blockedClaims).toContain('latex_free');
    expect(unknown.explanations.join(' ')).not.toMatch(/Latex-free/);
    const known = score('p-lunette-cup', up, 'period.product_support');
    expect(known.explanations).toContain('Latex-free, which matters with your latex allergy');
    expect(known.confidenceReasons.map((c) => c.code)).not.toContain('allergen_unknown');
  });

  it('leave-out (strong) hard-filters confirmed matches; prose leave-out only penalizes', () => {
    const strong = user({ supportSelections: ['Period product support'], avoidIngredients: ['Fragrance'] });
    expect(score('p-honeypot-pad', strong, 'period.product_support').safety.eligible).toBe(false);
    const cosmetic = user({ supportSelections: ['Period product support'], anythingElse: 'I prefer not fragrance if I can' });
    const r = score('p-honeypot-pad', cosmetic, 'period.product_support');
    expect(r.safety.eligible).toBe(true);
    expect(r.score).toBeLessThan(score('p-honeypot-pad', user({ supportSelections: ['Period product support'] }), 'period.product_support').score);
  });

  it('free-text guesses never exclude', () => {
    const up = user({ supportSelections: ['Vaginal dryness'], anythingElse: 'Some creams make me itch' });
    expect(score('p-kindra-lotion', up, 'vaginal.dryness').safety.eligible).toBe(true);
  });
});

describe('avoid list and history', () => {
  it('avoid list: exact product and brand are never recommended, even when they would score highest', () => {
    const up = user({ supportSelections: ['Cramps or period pain'], periodPain: 'Very severe', avoidRepeat: ["SootheHer's Elaris Pod", 'ThermaCare'], trustedBrands: ['SootheHer', 'ThermaCare'] },
      { behavior: { reordered: ['p-sootheher-elaris-pod', 'p-thermacare'] } });
    for (const id of ['p-sootheher-elaris-pod', 'p-thermacare']) {
      const r = score(id, up, 'pain.menstrual_cramp');
      expect(r.safety.eligible).toBe(false);
      expect(r.score).toBe(0);
    }
    expect(score('p-sootheher-elaris-pod', up, 'pain.menstrual_cramp').safety.reasons[0].code).toBe('avoid_list_product');
    expect(score('p-thermacare', up, 'pain.menstrual_cramp').safety.reasons[0].code).toBe('avoid_list_brand');
    expect(score('p-portable-heating', up, 'pain.menstrual_cramp').safety.eligible).toBe(true);
  });

  it('a brand on the avoid list removes every product of that brand', () => {
    const up = user({ supportSelections: ['Period product support'], avoidRepeat: ['Rael'] });
    ['p-rael-organic-pad', 'p-rael-overnight', 'p-rael-liners', 'p-rael-tampon'].forEach((id) => expect(score(id, up, 'period.product_support').safety.eligible).toBe(false));
    expect(score('p-cora-organic-pads', up, 'period.product_support').safety.eligible).toBe(true);
  });

  it('made it worse: same product hard suppressed, similar products down', () => {
    const base = user({ supportSelections: ['Period product support'] });
    const up = user({ supportSelections: ['Period product support'], productHistory: [{ name: 'Rael Organic Cotton Pads', current: 'No', worked: 'Made it worse', reaction: 'No', stopReasons: [] }] });
    expect(score('p-rael-organic-pad', up, 'period.product_support').safety.reasons[0].code).toBe('history_made_worse');
    const similar = score('p-rael-overnight', up, 'period.product_support');
    expect(similar.safety.eligible).toBe(true);
    expect(similar.components.experience).toBeLessThan(score('p-rael-overnight', base, 'period.product_support').components.experience);
  });

  it('serious reaction excludes the same product without blaming an ingredient', () => {
    const up = user({ supportSelections: ['Period product support'], productHistory: [{ name: 'Thinx Period Underwear', current: 'No', worked: '', reaction: 'Serious', reactionText: 'it burned my skin', stopReasons: [] }] });
    const r = score('p-thinx', up, 'period.product_support');
    expect(r.safety.reasons.map((x) => x.code)).toContain('history_serious_reaction');
    expect(up.experience.history[0].reactionDetails[0]).toMatchObject({ reaction_type: 'irritation_burning', ingredient_blamed: null });
    expect(up.safety.allergies).toHaveLength(0);
  });

  it('mild reaction: same product strongly down (not excluded), similar products get a caution', () => {
    const up = user({ supportSelections: ['Period product support'], productHistory: [{ name: 'Rael Organic Cotton Pads', current: 'No', worked: 'Helped somewhat', reaction: 'Mild', stopReasons: [] }] });
    const same = score('p-rael-organic-pad', up, 'period.product_support');
    expect(same.safety.eligible).toBe(true);
    expect(same.components.experience).toBeLessThan(0.4);
    expect(score('p-rael-overnight', up, 'period.product_support').confidenceReasons.map((c) => c.code)).toContain('similar_reaction_caution');
  });

  it('helped a lot: same product up, similar up a little', () => {
    const base = user({ supportSelections: ['Period product support'] });
    const up = user({ supportSelections: ['Period product support'], productHistory: [{ name: 'Rael Organic Cotton Pads', current: 'Yes', worked: 'Helped a lot', reaction: 'No', stopReasons: [] }] });
    const same = score('p-rael-organic-pad', up, 'period.product_support');
    expect(same.explanations).toContain('You said this helped a lot');
    expect(same.score).toBeGreaterThan(score('p-rael-organic-pad', base, 'period.product_support').score);
    const sim = score('p-rael-overnight', up, 'period.product_support');
    expect(sim.components.experience).toBeGreaterThan(score('p-rael-overnight', base, 'period.product_support').components.experience);
    expect(sim.components.experience).toBeLessThan(same.components.experience);
  });

  it('why stopped: each reason has its own effect', () => {
    const base = user({ supportSelections: ['Cramps or period pain'], priceRange: ['$25–$75'] });
    const stopped = (reason) => user({ supportSelections: ['Cramps or period pain'], priceRange: ['$25–$75'], productHistory: [{ name: 'ThermaCare Heat Wraps', current: 'No', worked: '', reaction: 'No', stopReasons: [reason] }] });
    const exp = (up) => score('p-thermacare', up, 'pain.menstrual_cramp').components.experience;
    const neutral = exp(base);
    expect(exp(stopped('It did not help'))).toBeLessThan(exp(stopped('It stopped working')));
    expect(exp(stopped('It stopped working'))).toBeLessThan(neutral);
    expect(exp(stopped('I found something better'))).toBeLessThan(neutral);
    expect(exp(stopped('I simply did not repurchase it'))).toBeLessThan(neutral);
    expect(exp(stopped('I simply did not repurchase it'))).toBeGreaterThan(exp(stopped('I found something better')));
    expect(score('p-thermacare', stopped('A clinician recommended stopping it'), 'pain.menstrual_cramp').safety.reasons[0].code).toBe('history_clinician_stop');
    // too expensive tightens the budget curve above the stated max
    const exp2 = stopped('It was too expensive');
    expect(exp2.shopping.priceSensitivity).toBe(1);
    expect(score('p-sootheher-elaris-pod', exp2, 'pain.menstrual_cramp').components.price).toBeLessThan(score('p-sootheher-elaris-pod', base, 'pain.menstrual_cramp').components.price);
    // didn't like the format: other products in that format lose preference
    const fmt = stopped('I did not like the format');
    expect(score('p-sootheher-elaris-pod', fmt, 'pain.menstrual_cramp').components.preference).toBe(score('p-sootheher-elaris-pod', base, 'pain.menstrual_cramp').components.preference);
    const patchUser = user({ supportSelections: ['Cramps or period pain'], productHistory: [{ name: 'Comfytemp Portable Heating Pad', current: 'No', worked: '', reaction: 'No', stopReasons: ['I did not like the format'] }] });
    expect(score('p-sootheher-elaris-pod', patchUser, 'pain.menstrual_cramp').components.preference).toBeLessThan(score('p-sootheher-elaris-pod', base, 'pain.menstrual_cramp').components.preference);
  });
});

describe('budget', () => {
  it('piecewise curve for $25 to $75', () => {
    const b = { min: 25, max: 75 };
    expect(budgetFit(20, b)).toBe(0.95);
    expect(budgetFit(48, b)).toBe(1);
    expect(budgetFit(72, b)).toBe(1);
    expect(budgetFit(82, b)).toBeGreaterThan(0.85);
    expect(budgetFit(82, b)).toBeLessThan(0.95);
    expect(budgetFit(150, b)).toBeCloseTo(0.4, 5);
    expect(budgetFit(300, b)).toBeCloseTo(0.1, 5);
    expect(budgetFit(1000, b)).toBe(0.1);
  });
  it('purchase history softens the curve a little but never rewrites the stated budget', () => {
    const stated = user({ supportSelections: ['Cramps or period pain'], priceRange: ['$25–$75'] });
    const softened = user({ supportSelections: ['Cramps or period pain'], priceRange: ['$25–$75'] }, { behavior: { purchasedPrices: [120, 140, 99, 110, 130, 150] } });
    const a = score('p-sootheher-elaris-pod', stated, 'pain.menstrual_cramp').components.price;
    const b = score('p-sootheher-elaris-pod', softened, 'pain.menstrual_cramp').components.price;
    expect(b).toBeGreaterThan(a);
    expect(b).toBeLessThan(1);
    expect(b - a).toBeLessThanOrEqual((1 - a) * 0.25 + 1e-9);
    expect(softened.shopping.budget).toMatchObject({ min: 25, max: 75 });
  });
  it('price not important = neutral price component for every product', () => {
    const up = user({ supportSelections: ['Cramps or period pain'], priceRange: ['Price is not a major factor for me'] });
    expect(score('p-sootheher-elaris-pod', up, 'pain.menstrual_cramp').components.price).toBe(score('p-thermacare', up, 'pain.menstrual_cramp').components.price);
  });
});

describe('medications', () => {
  it('unknown interaction lowers confidence, never reads as compatible', () => {
    const up = user({ supportSelections: ['Cramps or period pain'], takesCurrent: 'Yes', currentMedicationItems: ['Ozempic'] });
    const supp = score('p-magnesium-glycinate', up, 'pain.menstrual_cramp');
    expect(supp.confidenceReasons.map((c) => c.code)).toContain('medication_unknown');
    expect(supp.safety.blockedClaims).toContain('medication_compatible');
    const device = score('p-thermacare', up, 'pain.menstrual_cramp');
    expect(device.confidenceReasons.map((c) => c.code)).not.toContain('medication_unknown');
  });
  it('a reviewed caution shows the legacy message; avoid excludes', () => {
    const up = user({ supportSelections: ['Cramps or period pain'], takesCurrent: 'Yes', currentMedicationItems: ['Coumadin'] });
    const r = score('p-fish-oil', up, 'pain.menstrual_cramp');
    expect(r.safety.eligible).toBe(true);
    expect(r.explanations.join(' ')).toMatch(/Fish oil \/ omega-3 may slightly increase bleeding risk/);
    const ssri = user({ takesCurrent: 'Yes', currentMedicationItems: ['Zoloft'] });
    const sjw = { id: 'x-sjw', name: "St. John's Wort Capsules", category: 'supplement', type: 'physical', tags: [], healthFunctions: [], summary: "St. John's wort extract capsules.", ingredients: "St. John's wort" };
    expect(evaluateSafety(sjw, ssri).reasons.map((x) => x.code)).toContain('medication_avoid');
  });
});

describe('UTI frequency', () => {
  const up = (freq) => user({ supportSelections: ['Recurrent UTI-like symptoms'], utiFrequency: freq });

  it('"right now" demotes prevention supplements below testing and care, and says why', () => {
    const now = up('I am experiencing them right now');
    const dmannose = score('p-d-mannose-now', now, 'urinary.recurrent_uti');
    const test = score('p-winx-uti-test-treat', now, 'urinary.recurrent_uti');
    expect(test.score).toBeGreaterThan(dmannose.score);
    expect(dmannose.explanations).toContain('Not a substitute for getting checked');
    expect(dmannose.careProminent).toBe(true);
    expect(dmannose.score).toBeLessThan(score('p-d-mannose-now', up('A few times a year'), 'urinary.recurrent_uti').score);
  });
  it('recurrent raises prevention; first time favors care', () => {
    expect(score('p-d-mannose-now', up('About monthly'), 'urinary.recurrent_uti').score).toBeGreaterThan(score('p-d-mannose-now', up('Rarely'), 'urinary.recurrent_uti').score);
    const first = up('This is the first time');
    expect(score('p-winx-uti-test-treat', first, 'urinary.recurrent_uti').score).toBeGreaterThan(score('p-d-mannose-now', first, 'urinary.recurrent_uti').score);
  });
});

describe('conditions', () => {
  it('PCOS diagnosis + acne boosts products on both pathways; it never unlocks unrelated PCOS products', () => {
    const acneOnly = user({ supportSelections: ['Acne'] });
    const pcosAcne = user({ supportSelections: ['Acne'], diagnosisSelections: ['PCOS'] });
    // A product relevant to both PCOS and acne gets the pathway boost.
    const both = { id: 't-pcos-acne', name: 'Test PCOS acne support', category: 'supplement', tags: ['pcos', 'acne'] };
    const a = scoreProductForNeed(both, acneOnly, 'skin.acne');
    const b = scoreProductForNeed(both, pcosAcne, 'skin.acne');
    expect(b.score).toBeGreaterThan(a.score);
    expect(b.explanations.join(' ')).toMatch(/your acne and the PCOS diagnosis you shared/);
    // Step 2 change: p-zinc's catalog text says its PCOS benefit is NOT
    // established, so that sentence no longer counts as a PCOS mention and
    // zinc gets the diagnosis context only (no pathway claim).
    // ASK2: a diagnosis only boosts products relevant to BOTH the diagnosis
    // and the need (contextual multiplier, spec A.14). Zinc is not
    // PCOS-specific, so the PCOS diagnosis neither raises nor lowers it.
    const z = score('p-zinc', pcosAcne, 'skin.acne');
    expect(z.score).toBe(score('p-zinc', acneOnly, 'skin.acne').score);
    expect(z.explanations.join(' ')).not.toMatch(/PCOS/);
    expect(score('p-inositol-wholesome', pcosAcne, 'skin.acne').score).toBe(0);
  });
});

describe('cramp severity and care flags', () => {
  it('severity boosts direct relief and raises care prominence only for the cramp need', () => {
    const mild = user({ supportSelections: ['Cramps or period pain'], periodPain: 'Mild' });
    const severe = user({ supportSelections: ['Cramps or period pain'], periodPain: 'Very severe' });
    expect(score('p-thermacare', severe, 'pain.menstrual_cramp').components.health).toBeGreaterThanOrEqual(score('p-thermacare', mild, 'pain.menstrual_cramp').components.health);
    expect(score('p-thermacare', severe, 'pain.menstrual_cramp').careProminent).toBe(true);
    expect(score('p-thermacare', mild, 'pain.menstrual_cramp').careProminent).toBe(false);
  });
  it('urgent Yes -> careFirst; Not sure -> careProminent', () => {
    expect(score('p-thermacare', user({ supportSelections: ['Cramps or period pain'], safetyConcern: 'Yes' }), 'pain.menstrual_cramp')).toMatchObject({ careFirst: true, careProminent: true });
    expect(score('p-thermacare', user({ supportSelections: ['Cramps or period pain'], safetyConcern: 'Not sure' }), 'pain.menstrual_cramp')).toMatchObject({ careFirst: false, careProminent: true });
  });
});

describe('postpartum timing', () => {
  it('early recovery products rise early and stop being pushed later', () => {
    const early = user({ lifeStageSelections: ['I am postpartum'], supportSelections: ['Postpartum recovery'], postpartumTiming: 'Less than 6 weeks ago' });
    const late = user({ lifeStageSelections: ['I am postpartum'], supportSelections: ['Postpartum recovery'], postpartumTiming: 'More than 12 months ago' });
    expect(score('p-frida-mom-kit', early, 'postpartum.recovery').score).toBeGreaterThan(score('p-frida-mom-kit', late, 'postpartum.recovery').score);
  });
});

describe('explanation copy', () => {
  it('never contains an em dash, across the catalog', () => {
    const up = user({
      supportSelections: ['Cramps or period pain', 'Vaginal dryness', 'Recurrent UTI-like symptoms', 'Hot flashes', 'Anxiety', 'Period product support', 'Postpartum recovery'],
      lifeStageSelections: ['I am postpartum'], allergyStatus: 'Yes', allergyItems: ['Latex', 'Fragrance'], takesCurrent: 'Yes', currentMedicationItems: ['Coumadin', 'Zoloft'],
      priceRange: ['$25–$75'], utiFrequency: 'I am experiencing them right now',
    });
    for (const p of ALL_PRODUCTS) {
      for (const r of scoreProduct(p, up).needs) r.explanations.forEach((e) => expect(e, `${p.id}: ${e}`).not.toMatch(/[—–]/));
    }
  });
});

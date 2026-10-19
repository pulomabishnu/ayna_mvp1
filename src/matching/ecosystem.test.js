import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { getCareResourceBundle } from '../data/careResources.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildEcosystem, sortResults, brandCategory } from './ecosystem.js';
import { getNeedMatches, getBestNeedMatch, explainProduct } from './index.js';

const user = (over, opts = {}) => buildUserProfile({ ...EMPTY, ...over }, { catalog: ALL_PRODUCTS, ...opts });
const shelf = (eco, needId) => eco.shelves.find((s) => s.needId === needId);
const ids = (s) => s.picks.map((p) => p.productId);

describe('buildEcosystem', () => {
  const up = user({ supportSelections: ['Cramps or period pain', 'Acne', 'Anxiety', 'Vaginal dryness'], recommendedProductsPerArea: 3 });
  const eco = buildEcosystem(up, ALL_PRODUCTS);

  it('builds one shelf per selected need', () => {
    expect(eco.shelves.map((s) => s.needId)).toEqual(['pain.menstrual_cramp', 'skin.acne', 'mood.general_anxiety', 'vaginal.dryness']);
  });

  it('only places safe products that reach the exploratory tier, best first', () => {
    for (const s of eco.shelves) {
      for (const p of s.picks) {
        expect(p.safety.eligible).toBe(true);
        expect(p.score).toBeGreaterThanOrEqual(50);
      }
      const scores = s.picks.map((p) => p.score);
      scores.forEach((v, i) => { if (i) expect(v).toBeLessThanOrEqual(scores[i - 1] + 2.5); });
    }
  });

  it('a product appears only on shelves where it actually scores', () => {
    const elaris = eco.shelves.filter((s) => ids(s).includes('p-sootheher-elaris-pod')).map((s) => s.needId);
    expect(elaris).toEqual(['pain.menstrual_cramp']);
  });

  it('picks per need controls quantity, never quality: returns fewer rather than lower-scoring products', () => {
    // Asks for more than the catalog can fill at the quality bar (6 acne picks qualify since the Oct 19 Hero additions).
    const many = buildEcosystem(user({ supportSelections: ['Acne'], recommendedProductsPerArea: 10 }), ALL_PRODUCTS);
    const acne = shelf(many, 'skin.acne');
    expect(acne.picks.length).toBeLessThan(10);
    expect(acne.shortBy).toBe(10 - acne.picks.length);
    acne.picks.forEach((p) => expect(p.score).toBeGreaterThanOrEqual(50));
    const strict = buildEcosystem(user({ supportSelections: ['Acne'] }), ALL_PRODUCTS, { minTier: 'strong' });
    expect(shelf(strict, 'skin.acne').picks).toHaveLength(0);
    expect(shelf(strict, 'skin.acne').emptyReason).toBe('no_product_meets_quality_bar');
  });

  it('a diagnosis alone does not create shelves', () => {
    expect(buildEcosystem(user({ diagnosisSelections: ['PCOS'] }), ALL_PRODUCTS).shelves).toHaveLength(0);
    expect(buildEcosystem(user({ supportSelections: ['Nothing right now'] }), ALL_PRODUCTS).shelves).toHaveLength(0);
  });

  it('avoid list and hidden products never reach a shelf', () => {
    const avoid = buildEcosystem(user({ supportSelections: ['Cramps or period pain'], avoidRepeat: ['ThermaCare'] }, { behavior: { hidden: ['p-portable-heating'] } }), ALL_PRODUCTS, { picksPerNeed: 10 });
    expect(ids(shelf(avoid, 'pain.menstrual_cramp'))).not.toContain('p-thermacare');
    expect(ids(shelf(avoid, 'pain.menstrual_cramp'))).not.toContain('p-portable-heating');
  });

  it('a trusted brand never gets placed on a shelf it is unrelated to', () => {
    const eco2 = buildEcosystem(user({ supportSelections: ['Acne'], trustedBrands: ['Rael'] }), ALL_PRODUCTS, { picksPerNeed: 10 });
    expect(ids(shelf(eco2, 'skin.acne')).some((id) => id.includes('rael'))).toBe(false);
  });

  it('does not auto-seed FLO just because PMS is in the product name', () => {
    const pms = buildEcosystem(user({ supportSelections: ['PMS symptoms'] }), ALL_PRODUCTS, { picksPerNeed: 10 });
    const pmsShelf = shelf(pms, 'cycle.pms');
    expect(pmsShelf).toBeTruthy();
    expect(ids(pmsShelf)).not.toContain('p-flo-gummies');
  });

  it('does not let a bare secondary supplement claim scrape over the exploratory bar', () => {
    const generic = {
      id: 'test-generic-cramp-supplement',
      name: 'Generic Cramp Support Capsules',
      category: 'supplement',
      type: 'physical',
      healthFunctions: ['cramp-relief'],
      tags: ['cramps'],
      price: '$20',
      summary: 'Supplement marketed for menstrual cramps.',
      ingredients: 'ginger',
    };
    const crampUser = user({ supportSelections: ['Cramps or period pain'] });
    const crampEco = buildEcosystem(crampUser, [generic], { picksPerNeed: 10 });
    expect(ids(shelf(crampEco, 'pain.menstrual_cramp'))).not.toContain(generic.id);
  });

  it('does not auto-seed an ingestible for bloating when the claim has no claim-specific evidence', () => {
    const generic = {
      id: 'test-generic-bloat-supplement',
      name: 'Daily Bloat Support Capsules',
      category: 'supplement',
      type: 'physical',
      tags: ['bloating'],
      price: '$24',
      summary: 'Daily supplement made for bloating and digestive comfort.',
      ingredients: 'ginger, peppermint',
    };
    const bloatingUser = user({ supportSelections: ['Cycle-related bloating'] });
    const bloatingEco = buildEcosystem(bloatingUser, [generic], { picksPerNeed: 10 });
    expect(ids(shelf(bloatingEco, 'bloating.cycle_related'))).not.toContain(generic.id);
  });
});

describe('ordering and tie-breaks', () => {
  const fakeProfile = (id, fsa, emerging = false, brand = id) => ({ product_id: id, fsa_hsa: fsa, brand: { key: brand, emerging } });
  const result = (id, score) => ({ productId: id, score, components: { preference: 0.6, evidence: 0.5 } });

  it('FSA/HSA only breaks near-ties: 94 vs 93 eligible -> eligible wins; 94 vs 55 eligible -> 94 wins', () => {
    const up = user({ fsaHsaAnswer: 'HSA' });
    const profiles = new Map([['a', fakeProfile('a', 'unknown')], ['b', fakeProfile('b', 'yes')], ['c', fakeProfile('c', 'yes')]]);
    expect(sortResults([result('a', 94), result('b', 93)], up, profiles).map((r) => r.productId)).toEqual(['b', 'a']);
    expect(sortResults([result('a', 94), result('c', 55)], up, profiles).map((r) => r.productId)).toEqual(['a', 'c']);
    const noAccount = user({ fsaHsaAnswer: 'No' });
    expect(sortResults([result('a', 94), result('b', 93)], noAccount, profiles).map((r) => r.productId)).toEqual(['a', 'b']);
  });

  it('brand exploration breaks ties between familiar and emerging brands', () => {
    const profiles = new Map([['trusted', fakeProfile('trusted', 'unknown', false, 'rael')], ['newco', fakeProfile('newco', 'unknown', true, 'newco')]]);
    const loyal = user({ brandOpenness: 'I mostly stick with brands I already trust', trustedBrands: ['Rael'] });
    const explorer = user({ brandOpenness: 'I enjoy discovering new brands', trustedBrands: ['Rael'] });
    expect(brandCategory(profiles.get('trusted'), loyal)).toBe('user_trusted');
    expect(brandCategory(profiles.get('newco'), loyal)).toBe('emerging');
    const pair = [result('trusted', 80), result('newco', 80)];
    expect(sortResults(pair, loyal, profiles)[0].productId).toBe('trusted');
    expect(sortResults(pair, explorer, profiles)[0].productId).toBe('newco');
  });

  it('trust reweighting changes order among good products only', () => {
    const base = { supportSelections: ['Cramps or period pain'] };
    const clinicalFirst = user({ ...base, trustRanking: ['Clinical or scientific evidence', 'Reviews and experiences from other women', 'Brand reputation or expert recommendations'], trustRankingTouched: true });
    const communityFirst = user({ ...base, trustRanking: ['Reviews and experiences from other women', 'Brand reputation or expert recommendations', 'Clinical or scientific evidence'], trustRankingTouched: true });
    const a = shelf(buildEcosystem(clinicalFirst, ALL_PRODUCTS, { picksPerNeed: 10 }), 'pain.menstrual_cramp');
    const b = shelf(buildEcosystem(communityFirst, ALL_PRODUCTS, { picksPerNeed: 10 }), 'pain.menstrual_cramp');
    // p-viboos-heating-pad joined the catalog on main and is direct cramp relief too.
    const direct = ['p-sootheher-elaris-pod', 'p-thermacare', 'p-portable-heating', 'p-viboos-heating-pad'];
    expect(ids(a)[0]).toBe('p-sootheher-elaris-pod');
    expect(ids(b)[0]).not.toBe('p-sootheher-elaris-pod');
    // Direct cramp relief stays above secondary options under either ranking.
    for (const s of [a, b]) {
      expect(ids(s).slice(0, direct.length).sort()).toEqual([...direct].sort());
      s.picks.slice(direct.length).forEach((p) => expect(p.relevance).toBeLessThan(1));
    }
  });
});

describe('care resources', () => {
  it('UTI "right now" makes care prominent and attaches care links', () => {
    const up = user({ supportSelections: ['Recurrent UTI-like symptoms'], utiFrequency: 'I am experiencing them right now', zipcode: '10026' });
    const eco = buildEcosystem(up, ALL_PRODUCTS, { getCareResourceBundle });
    const s = shelf(eco, 'urinary.recurrent_uti');
    expect(s.careProminent).toBe(true);
    expect(s.care.telehealthLinks.map((l) => l.label)).toContain('MedlinePlus: Urinary tract infections');
    expect(s.care.zip).toBe('10026');
    expect(ids(s)[0]).not.toBe('p-d-mannose-now');
  });

  it('urgent Yes puts care first for the whole ecosystem', () => {
    const eco = buildEcosystem(user({ supportSelections: ['Pelvic pain'], safetyConcern: 'Yes' }), ALL_PRODUCTS, { getCareResourceBundle });
    expect(eco.careFirst).toBe(true);
    expect(eco.care).toBeTruthy();
    expect(eco.shelves[0].careFirst).toBe(true);
  });
});

describe('adapters', () => {
  const thermacare = ALL_PRODUCTS.find((p) => p.id === 'p-thermacare');
  const intake = { ...EMPTY, supportSelections: ['Cramps or period pain', 'Acne', 'Pelvic pain'] };

  it('getNeedMatches lists only needs the product is relevant to, best first', () => {
    const m = getNeedMatches(thermacare, intake);
    expect(m.map((r) => r.needId)).toEqual(['pain.menstrual_cramp', 'pain.pelvic']);
    expect(getBestNeedMatch(thermacare, intake).needId).toBe('pain.menstrual_cramp');
    expect(getBestNeedMatch(thermacare, { ...EMPTY, supportSelections: ['Acne'] })).toBe(null);
  });

  it('explainProduct returns a headline, explanations and exclusion reasons', () => {
    const e = explainProduct(thermacare, intake);
    expect(e).toMatchObject({ headline: 'Matches the period cramps you selected', eligible: true, needId: 'pain.menstrual_cramp' });
    const avoided = explainProduct(thermacare, { ...intake, avoidRepeat: ['ThermaCare'] });
    expect(avoided.eligible).toBe(false);
    expect(avoided.excludedBecause[0]).toMatch(/avoid ThermaCare/);
  });

  it('accepts legacy quizAnswers with fullHealthIntake', () => {
    expect(getBestNeedMatch(thermacare, { fullHealthIntake: intake }).needId).toBe('pain.menstrual_cramp');
  });
});
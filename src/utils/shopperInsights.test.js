import './test-setup-localstorage.js';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  toProductList,
  collectSensitivities,
  findIngredientMatches,
  getSafetyAlerts,
  getBrandAffinity,
  getValueAffinity,
  getBlindSpots,
  loadRoutine,
  saveRoutine,
  toggleRoutineBucket,
  groupByRoutine,
  sanitizeRoutine,
  loadDismissedAlerts,
  saveDismissedAlerts,
  ROUTINE_KEY,
} from './shopperInsights.js';

// Text copied from real catalog entries in src/data/products.js.
const ALWAYS = {
  id: 'p-always-infinity',
  name: 'Always Infinity',
  category: 'pad',
  ingredients: 'Polyethylene, polypropylene, wood pulp, adhesive. Fragrance-free version omits parfum.',
  safety: {
    allergens: 'Fragrance in scented versions; fragrance-free version available',
    materials: 'FlexFoam (polyethylene/polypropylene blend), fragrance-free options available',
    recalls: 'Independent testing in 2022 found PFAS in some pads.',
  },
};
const RAEL = {
  id: 'p-rael-organic-pad',
  name: 'Rael Organic Pad',
  category: 'pad',
  brand: 'Rael',
  ingredients: '100% certified organic cotton top sheet, wood pulp core, bio-PE back sheet, natural adhesive.',
  safety: { allergens: 'Hypoallergenic, fragrance-free, dye-free', recalls: 'No recalls.' },
};
const HONEYPOT = {
  id: 'p-honeypot-pad',
  name: 'Honey Pot Herbal Pad',
  category: 'pad',
  brand: 'The Honey Pot',
  ingredients: 'Plant-derived fiber, lavender oil, peppermint oil, aloe extract, wood pulp core.',
  safety: { allergens: 'Contains herbal extracts. Check if sensitive to lavender or mint', recalls: 'No known recalls' },
};
const SAALT = {
  id: 'p-saalt-cup',
  name: 'Saalt Cup',
  category: 'cup',
  brand: 'Saalt',
  ingredients: '100% medical-grade silicone (USP Class VI certified).',
  safety: { allergens: 'Latex-free, hypoallergenic', recalls: 'No recalls.' },
};

const intakeWith = (fields) => ({ fullHealthIntake: { ...fields } });

describe('toProductList', () => {
  it('accepts the id → product object MyEcosystem uses, and arrays', () => {
    expect(toProductList({ a: RAEL, b: null })).toEqual([RAEL]);
    expect(toProductList([RAEL, { name: 'no id' }])).toEqual([RAEL]);
    expect(toProductList(null)).toEqual([]);
  });
});

describe('collectSensitivities', () => {
  it('maps intake allergies, avoid answers and imported allergies; ignores vague ones', () => {
    const s = collectSensitivities(
      intakeWith({ allergyStatus: 'Yes', allergies: ['Latex', 'Antibiotics', 'Lavender'], avoidIngredients: ['Fragrance-free', 'Vegan', 'Organic'] }),
      { allergies: ['Nickel', 'none'] },
    );
    const keys = s.map((x) => x.key).sort();
    expect(keys).toEqual(['custom:lavender', 'fragrance', 'latex', 'nickel']);
    expect(s.find((x) => x.key === 'fragrance').source).toBe('avoid');
    expect(s.find((x) => x.key === 'latex').source).toBe('allergy');
  });

  it('an allergy outranks an avoid preference for the same term', () => {
    const s = collectSensitivities(intakeWith({ allergies: ['Fragrance'], avoidIngredients: ['Fragrance'] }));
    expect(s).toHaveLength(1);
    expect(s[0].source).toBe('allergy');
  });

  it('falls back to allergyItems and the legacy sensitivities array', () => {
    expect(collectSensitivities(intakeWith({ allergyStatus: 'Yes', allergyItems: ['Dyes'] })).map((x) => x.key)).toEqual(['dye']);
    expect(collectSensitivities({ sensitivities: ['Fragrance sensitivity'] }).map((x) => x.key)).toEqual(['fragrance']);
  });

  it('returns nothing without answers', () => {
    expect(collectSensitivities(null, null)).toEqual([]);
    expect(collectSensitivities(intakeWith({ allergyStatus: 'No', allergies: [] }))).toEqual([]);
  });
});

describe('findIngredientMatches', () => {
  const fragrance = collectSensitivities(intakeWith({ allergies: ['Fragrance'] }))[0];
  const dye = collectSensitivities(intakeWith({ allergies: ['Dyes'] }))[0];
  const latex = collectSensitivities(intakeWith({ allergies: ['Latex'] }))[0];

  it('never matches a "-free" or "free of" statement', () => {
    expect(findIngredientMatches(RAEL, fragrance)).toEqual([]);
    expect(findIngredientMatches(RAEL, dye)).toEqual([]);
    expect(findIngredientMatches(SAALT, latex)).toEqual([]);
    const freeOf = { id: 'x', safety: { allergens: 'Free of parabens, phthalates and dyes' } };
    expect(findIngredientMatches(freeOf, dye)).toEqual([]);
    expect(findIngredientMatches({ id: 'y', ingredients: 'Non-latex rubber alternative' }, latex)).toEqual([]);
    expect(findIngredientMatches({ id: 'z', ingredients: 'Unscented cotton' }, fragrance)).toEqual([]);
  });

  it('matches real mentions and quotes the catalog clause', () => {
    const m = findIngredientMatches(ALWAYS, fragrance);
    expect(m.map((x) => x.field)).toEqual(['allergens']);
    expect(m[0].snippet).toBe('Fragrance in scented versions');
  });

  it('a negation stops at "but"/"contains"', () => {
    const p = { id: 'q', ingredients: 'No fragrance, but contains natural rubber latex' };
    expect(findIngredientMatches(p, latex)).toHaveLength(1);
    expect(findIngredientMatches(p, fragrance)).toEqual([]);
  });

  it('matches whole words only', () => {
    const gluten = collectSensitivities(intakeWith({ allergies: ['Gluten'] }))[0];
    expect(findIngredientMatches({ id: 'b', ingredients: 'Buckwheat hull filling' }, gluten)).toEqual([]);
    expect(findIngredientMatches({ id: 'w', ingredients: 'Wheat starch' }, gluten)).toHaveLength(1);
  });

  it('free-typed allergies match their own word', () => {
    const lav = collectSensitivities(intakeWith({ allergies: ['Lavender'] }))[0];
    const fields = findIngredientMatches(HONEYPOT, lav).map((x) => x.field);
    expect(fields).toEqual(['ingredients', 'allergens']);
  });

  it('does not treat supplement mineral sulfates as surfactant sulfates', () => {
    const sulfate = collectSensitivities(intakeWith({ avoidIngredients: ['Sulfates'] }))[0];
    expect(findIngredientMatches({ id: 'iron', ingredients: 'Ferrous sulfate 65 mg' }, sulfate)).toEqual([]);
    expect(findIngredientMatches({ id: 'wash', ingredients: 'Water, sodium lauryl sulfate' }, sulfate)).toHaveLength(1);
  });
});

describe('getSafetyAlerts', () => {
  const eco = { [ALWAYS.id]: ALWAYS, [RAEL.id]: RAEL, [HONEYPOT.id]: HONEYPOT, [SAALT.id]: SAALT };

  it('only flags real matches and productSafetyAlert recall flags', () => {
    const alerts = getSafetyAlerts(eco, intakeWith({ allergies: ['Essential oils'], avoidIngredients: ['Fragrance'] }));
    const summary = alerts.map((a) => `${a.kind}:${a.product.id}:${a.sensitivity?.key || ''}`);
    expect(summary).toEqual([
      'ingredient:p-honeypot-pad:essential-oil',
      'ingredient:p-always-infinity:fragrance',
      'recall:p-always-infinity:',
    ]);
  });

  it('no answers and no flagged recalls → no alerts', () => {
    expect(getSafetyAlerts({ [RAEL.id]: RAEL, [SAALT.id]: SAALT }, null, null)).toEqual([]);
  });

  it('ids are stable for the same text and change when the text changes', () => {
    const a1 = getSafetyAlerts({ [ALWAYS.id]: ALWAYS })[0].id;
    const a2 = getSafetyAlerts({ [ALWAYS.id]: ALWAYS })[0].id;
    const changed = { ...ALWAYS, safety: { ...ALWAYS.safety, recalls: 'Class action lawsuit filed in 2024.' } };
    expect(a1).toBe(a2);
    expect(getSafetyAlerts({ [ALWAYS.id]: changed })[0].id).not.toBe(a1);
  });
});

describe('brands and values', () => {
  it('counts explicit brands only', () => {
    const eco = [RAEL, { ...RAEL, id: 'r2' }, SAALT, ALWAYS];
    expect(getBrandAffinity(eco)).toEqual([{ brand: 'Rael', count: 2 }, { brand: 'Saalt', count: 1 }]);
  });

  it('scores only values the person picked and the site can check', () => {
    const v = getValueAffinity([RAEL, SAALT], { preference: ['organic', 'fragrance-free', 'pregnancy-safe'] });
    expect(v.map((x) => x.value).sort()).toEqual(['fragrance-free', 'organic']);
    expect(v.find((x) => x.value === 'organic')).toMatchObject({ count: 1, total: 2 });
    expect(getValueAffinity([RAEL], null)).toEqual([]);
  });
});

describe('getBlindSpots', () => {
  it('ranks unowned categories by catalog size and skips one-offs', () => {
    const catalog = [
      ...Array(5).fill({ category: 'supplement' }),
      ...Array(3).fill({ category: 'tracker' }),
      ...Array(2).fill({ category: 'pad' }),
      { category: 'cup' },
      ...Array(4).fill({ category: 'custom-brand' }),
    ];
    const spots = getBlindSpots([RAEL], catalog, { labels: { supplement: 'Supplements' } });
    expect(spots.map((s) => s.category)).toEqual(['supplement', 'tracker']);
    expect(spots[0]).toMatchObject({ label: 'Supplements', catalogCount: 5 });
    expect(spots[1].label).toBe('Tracker');
  });

  it('dedupes categories that share a label', () => {
    const catalog = [...Array(3).fill({ category: 'supplement' }), ...Array(2).fill({ category: 'supplements' })];
    const spots = getBlindSpots([], catalog, { labels: { supplement: 'Supplements', supplements: 'Supplements' } });
    expect(spots).toHaveLength(1);
  });
});

describe('routine buckets', () => {
  beforeEach(() => localStorage.clear());

  it('tap assigns, tapping the same bucket clears, invalid buckets are ignored', () => {
    let m = toggleRoutineBucket({}, 'a', 'morning');
    expect(m).toEqual({ a: 'morning' });
    m = toggleRoutineBucket(m, 'a', 'night');
    expect(m).toEqual({ a: 'night' });
    m = toggleRoutineBucket(m, 'a', 'night');
    expect(m).toEqual({});
    expect(toggleRoutineBucket({}, 'a', 'brunch')).toEqual({});
  });

  it('persists under the same key as the mobile app and drops garbage', () => {
    saveRoutine({ a: 'morning', b: 'brunch' });
    expect(JSON.parse(localStorage.getItem(ROUTINE_KEY))).toEqual({ a: 'morning' });
    expect(loadRoutine()).toEqual({ a: 'morning' });
    localStorage.setItem(ROUTINE_KEY, '[1,2]');
    expect(loadRoutine()).toEqual({});
    localStorage.setItem(ROUTINE_KEY, '{not json');
    expect(loadRoutine()).toEqual({});
    expect(sanitizeRoutine(null)).toEqual({});
  });

  it('groups ecosystem products by bucket', () => {
    const { groups, unsorted } = groupByRoutine({ [RAEL.id]: RAEL, [SAALT.id]: SAALT }, { [RAEL.id]: 'monthly', gone: 'night' });
    expect(groups.monthly).toEqual([RAEL]);
    expect(groups.night).toEqual([]);
    expect(unsorted).toEqual([SAALT]);
  });
});

describe('dismissed alerts', () => {
  beforeEach(() => localStorage.clear());
  it('round-trips and dedupes', () => {
    saveDismissedAlerts(['a', 'b', 'a']);
    expect(loadDismissedAlerts()).toEqual(['a', 'b']);
    localStorage.setItem('ayna_dismissed_safety_alerts_v1', '{"x":1}');
    expect(loadDismissedAlerts()).toEqual([]);
  });
});

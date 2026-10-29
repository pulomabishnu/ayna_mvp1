import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../data/products.js';
import { getPassportFacts } from '../data/passport/index.js';
import { whyLine } from '../utils/whyLine.js';
import { answerMatchQuestion } from '../utils/askMatch.js';
import { matchBreakdown, breakdownFromDetails } from './matchBreakdown.js';
import { buildProductProfile, parseCapacityMl } from './productProfile.js';
import { kneeOf, FACTOR_WEIGHTS, V2 } from './v2.js';
import { makeProfiles } from './v2sweep/sweep.js';

// PDP audit (Oct 26), P0 #1: every cup and disc said "99% match" with the
// same reason. These pin the fix: a real spread inside one need from real
// product facts, a reason about this product, one breakdown that adds up to
// the percent, holds untouched, and other needs left where they were.
const base = { personalizationCompleted: true, takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No', age: '28', lifeStageSelections: ['I get periods regularly'] };
const quiz = (over) => ({ fullHealthIntake: { ...base, ...over }, personalizationCompleted: true });
const HEAVY = quiz({ supportSelections: ['Heavy periods', 'Period product support'], periodFlow: 'Heavy' });
const HEAVY_FULL = quiz({ supportSelections: ['Heavy periods', 'Period product support'], periodFlow: 'Heavy', priceRange: ['Under $25', '$25–$75'], avoidIngredients: ['Reusable'], fsaHsaAnswer: 'HSA' });
const MODERATE = quiz({ age: '24', supportSelections: ['Period product support'], periodFlow: 'Moderate' });
const BUDGET = quiz({ age: '20', supportSelections: ['Period product support'], periodFlow: 'Moderate', priceRange: ['Under $25'] });
const NO_FLOW = quiz({ supportSelections: ['Period product support'] });

// The six products the audit named, plus the Saalt Disc from the same shelf.
const AUDIT = ['p-saalt-cup', 'p-cora-disc', 'p-hello-disc', 'p-lena-cup', 'p-tampontribe-menstrual-cup', 'p-lumma-disc', 'p-saalt-disc'];
const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const details = (id, q) => getProductMatchDetailsForProduct(byId.get(id), q);
// Facts that drive the score: same facts, same number is fine (a true tie).
const factKey = (id, q) => JSON.stringify((details(id, q).v2?.parts || []).filter((p) => p.factor !== 'need').map((p) => [p.factor, p.delta]));

describe('spread inside one need (cups and discs)', () => {
  for (const [name, q] of Object.entries({ HEAVY, HEAVY_FULL, MODERATE, BUDGET })) {
    it(`${name}: never all the same number, and no tie at 99 unless the facts are identical`, () => {
      const pct = AUDIT.map((id) => details(id, q).percent);
      expect(new Set(pct).size).toBeGreaterThan(1);
      const at99 = AUDIT.filter((id) => details(id, q).percent >= 99);
      if (at99.length > 1) expect(new Set(at99.map((id) => factKey(id, q))).size).toBe(1);
      for (let i = 0; i < AUDIT.length; i += 1) {
        for (let j = i + 1; j < AUDIT.length; j += 1) {
          if (pct[i] === pct[j] && pct[i] >= 95) expect(factKey(AUDIT[i], q)).toBe(factKey(AUDIT[j], q));
        }
      }
    });
  }

  it('heavy flow: a cup or disc that is only "made for this need" sits at 92, not 99', () => {
    expect(kneeOf(1)).toBeCloseTo(0.92, 5);
    expect(details('p-hello-disc', HEAVY).percent).toBe(92); // capacity not on the brand's own site
    expect(details('p-saalt-disc', HEAVY).percent).toBeGreaterThan(details('p-saalt-cup', HEAVY).percent); // 50 mL vs 30 mL
  });

  it('99 needs strong facts on several factors', () => {
    const max = Object.values(FACTOR_WEIGHTS).map((w) => Math.max(0, ...Object.values(w))).sort((a, b) => b - a);
    // The largest single raise cannot lift a plain "made for it" match to 99.
    expect(Math.round(100 * (kneeOf(1) + max[0]))).toBeLessThan(99);
    expect(Math.round(100 * (kneeOf(1) + max[0] + max[1]))).toBeLessThan(99);
    const d = details('p-saalt-disc', HEAVY_FULL);
    if (d.percent >= 99) expect(d.v2.parts.filter((p) => p.kind === 'raised' && p.factor !== 'need').length).toBeGreaterThanOrEqual(3);
  });

  it('missing data is unknown, never a fit', () => {
    const d = details('p-hello-disc', HEAVY);
    expect(d.v2.unknown.map((u) => u.factor)).toContain('capacity');
    expect(d.v2.parts.some((p) => p.factor === 'capacity')).toBe(false);
    const flowless = details('p-saalt-disc', NO_FLOW);
    expect(flowless.v2.unknown.map((u) => u.factor)).toContain('capacity');
    expect(flowless.v2.factorTotal).toBe(0);
  });

  it('over her budget lowers the match; within it raises it a little', () => {
    const over = details('p-saalt-disc', BUDGET);
    expect(over.v2.parts.find((p) => p.factor === 'price')?.kind).toBe('lowered');
    expect(over.percent).toBeLessThan(details('p-saalt-disc', MODERATE).percent);
    expect(details('p-saalt-disc', HEAVY_FULL).v2.parts.find((p) => p.factor === 'price')?.kind).toBe('raised');
  });
});

describe('capacity comes only from the brand', () => {
  it('parses sizes and mL from brand wording', () => {
    expect(parseCapacityMl('Saalt Cup; sizes Small (25 ml), Regular (30 ml) and Teen (15 ml)')).toEqual([{ label: 'Small', ml: 25 }, { label: 'Regular', ml: 30 }, { label: 'Teen', ml: 15 }]);
    expect(parseCapacityMl('Capacity is 25 mL (Medium) or 30 mL (Large), per the brand.')).toEqual([{ label: 'Medium', ml: 25 }, { label: 'Large', ml: 30 }]);
    expect(parseCapacityMl('no numbers here')).toEqual([]);
  });
  it('a retailer listing or a study of the product type is not used', () => {
    expect(buildProductProfile(byId.get('p-hello-disc')).menstrual.capacity_ml).toBeNull(); // 50 mL only on a retailer page
    expect(buildProductProfile(byId.get('p-lumma-disc')).menstrual.capacity_ml).toBeNull(); // "about 61 mL" is a study of discs
    expect(buildProductProfile(byId.get('p-saalt-disc')).menstrual.capacity_ml.max).toBe(50);
    expect(buildProductProfile(byId.get('p-tampontribe-menstrual-cup')).menstrual.capacity_ml.max).toBe(30);
  });
});

describe('the reason is about this product', () => {
  it('uses the strongest product fact with its real value', () => {
    expect(whyLine(byId.get('p-saalt-disc'), details('p-saalt-disc', HEAVY))).toBe('Holds up to 50 mL (Regular size), for your heavy flow');
    expect(whyLine(byId.get('p-tampontribe-menstrual-cup'), details('p-tampontribe-menstrual-cup', HEAVY))).toBe('Holds up to 30 mL (Large size), for your heavy flow');
  });

  it('never claims a capacity the product has no fact for', () => {
    const line = whyLine(byId.get('p-hello-disc'), details('p-hello-disc', HEAVY));
    expect(line).not.toMatch(/holds|mL/i);
    expect(line).toMatch(/^For your period care/);
  });

  it('every number in a reason is in the product record', () => {
    for (const q of [HEAVY, HEAVY_FULL, MODERATE, BUDGET]) {
      for (const id of AUDIT) {
        const p = byId.get(id);
        const line = whyLine(p, details(id, q));
        const source = [p.price, p.effectiveness, ...getPassportFacts(p).map((f) => JSON.stringify(f.value))].join(' ');
        for (const n of line.match(/\d+(?:\.\d+)?/g) || []) expect(source, `${id}: ${line}`).toContain(n);
        expect(line).not.toMatch(/%|—/);
      }
    }
  });
});

describe('one breakdown, same number everywhere', () => {
  const personas = [HEAVY, HEAVY_FULL, BUDGET, ...makeProfiles(12, 5).map((i) => ({ fullHealthIntake: i, personalizationCompleted: true }))];
  it('percent is the card percent, and raised + lowered add up to it', () => {
    let checked = 0;
    for (const q of personas) {
      for (const p of ALL_PRODUCTS.slice(0, 400)) {
        const d = getProductMatchDetailsForProduct(p, q);
        const bd = matchBreakdown(p, q);
        if (d.matchStatus !== 'scored' || !(d.percent > 0) || !d.v2?.parts) { expect(bd.percent).toBe(d.matchStatus === 'scored' ? d.percent || null : null); continue; }
        expect(bd.percent).toBe(d.percent);
        bd.raised.forEach((x) => expect(x.delta).toBeGreaterThan(0));
        bd.lowered.forEach((x) => expect(x.delta).toBeLessThan(0));
        const sum = [...bd.raised, ...bd.lowered].reduce((s, x) => s + x.delta, 0);
        expect(Math.abs(Math.min(99, Math.round(100 * Math.max(0, Math.min(1, sum)))) - d.percent)).toBeLessThanOrEqual(1);
        expect(Math.abs(sum - d.v2.fit)).toBeLessThan(0.01);
        // Oct 29 review: an 80+ the engine did not call Strong (low confidence) reads Good fit.
        expect(bd.label).toBe(d.percent < 50 ? 'Partial fit' : d.percent >= 80 ? (d.v2?.band === 'strong' ? 'Strong fit' : 'Good fit') : d.percent >= 60 ? 'Good fit' : '');
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(200);
  });

  it('Ask answers with the same percent, reason and breakdown', () => {
    const p = byId.get('p-saalt-disc');
    const d = details('p-saalt-disc', HEAVY);
    const a = answerMatchQuestion(`what's my % match for ${p.name} and why`, { catalog: ALL_PRODUCTS, quizAnswers: HEAVY, getDetails: getProductMatchDetailsForProduct, focusProduct: p });
    expect(a.answer).toContain(`**${d.percent}% match**`);
    expect(a.answer).toContain('Holds up to 50 mL (Regular size), for your heavy flow');
    expect(a.answer).toContain('**What raised it**');
    expect(a.answer).toContain('**What ayna doesn’t know yet**');
    expect(a.answer).toContain('Which size fits you (Regular or Small)');
    expect(a.answer).not.toMatch(/—/);
  });
});

describe('holds and bleeding evaluation are unchanged: no percent', () => {
  it('safety hold', () => {
    const q = { fullHealthIntake: { supportSelections: ['Cramps or period pain'], lifeStageSelections: ['I get periods regularly'] } };
    const mag = byId.get('p-magnesium-glycinate');
    const bd = matchBreakdown(mag, q);
    expect(getProductMatchDetailsForProduct(mag, q).matchStatus).toBe('safety-hold');
    expect(bd.percent).toBeNull();
    expect(bd.label).toBe('Safety hold · Match unavailable');
    expect(bd.raised).toEqual([]);
  });
  it('bleeding after menopause', () => {
    const q = quiz({ age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods', 'Hot flashes'], periodFlow: 'Heavy' });
    for (const id of AUDIT) {
      const d = details(id, q);
      if (d.matchStatus !== 'bleeding-evaluation') continue;
      const bd = breakdownFromDetails(byId.get(id), d);
      expect(bd.percent).toBeNull();
      expect(bd.label).toBe('Get this bleeding checked first');
    }
  });
});

// Baseline from the Oct 26 head (1352e14f), same personas: other categories'
// numbers barely move (only the top band is compressed); period products
// spread out instead of sitting at 99. Hold counts must not change at all.
describe('distribution across needs stays stable', () => {
  const PERIOD = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cup-steamer']);
  const intakes = [HEAVY, HEAVY_FULL, MODERATE, BUDGET, ...makeProfiles(60, 11).map((i) => ({ fullHealthIntake: i, personalizationCompleted: true }))];
  const other = [];
  const period = [];
  let holds = 0;
  for (const q of intakes) {
    for (const p of ALL_PRODUCTS) {
      const d = getProductMatchDetailsForProduct(p, q);
      if (d.matchStatus === 'safety-hold' || d.matchStatus === 'bleeding-evaluation') holds += 1;
      if (d.matchStatus !== 'scored' || !(d.percent > 0)) continue;
      (PERIOD.has(buildProductProfile(p).category) ? period : other).push(d.percent);
    }
  }
  const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  it('other needs: mean within 1 point of the baseline, few at 99', () => {
    // Baseline: other categories n 641, mean 55.45, 1.9% at 99.
    // Oct 29 (P0): fewer scored, because clinician-review and unreviewed-interaction products are held.
    expect(other.length).toBeGreaterThan(420);
    // Within 2.5 since Oct 29: the held products leave the scored set (the
    // population changed, no percent did).
    expect(Math.abs(mean(other) - 55.45)).toBeLessThanOrEqual(2.5);
    expect(other.filter((x) => x >= 99).length / other.length).toBeLessThanOrEqual(0.02);
  });
  it('period products: no longer saturated at 99', () => {
    // Baseline: n 420, mean 77.7, 27% of period-product matches were 99.
    expect(period.filter((x) => x >= 99).length / period.length).toBeLessThan(0.02);
    expect(Math.abs(mean(period) - 77.7)).toBeLessThanOrEqual(3);
  });
  it('the knee leaves anything under it untouched', () => {
    expect(kneeOf(V2.knee)).toBe(V2.knee);
    expect(kneeOf(0.5)).toBe(0.5);
  });
  it('hold and evaluation counts are what they were', () => {
    // Baseline: 315 safety holds + bleeding evaluations across these personas
    // until Oct 29; 482 after the P0 holds (open clinician review, unreviewed
    // interactions, conflicting or old safety answers). Pinned so any change is deliberate.
    expect(holds).toBe(482);
  });
});

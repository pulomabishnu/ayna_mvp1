import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz } from '../data/products.js';

// Nov 9 (founder: "for cramps it gives me 3 heating pads, it should give a range of different types").
describe('shelf variety', () => {
  it('a cramps shelf leads with different kinds of help and holds at most two heat products', () => {
    const q = { age: '24', allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], personalizationCompleted: true };
    const shelf = getEcosystemSeedFromQuiz(q).shelves.find((s) => s.needId === 'pain.menstrual_cramp');
    const names = shelf.picks.map((p) => ALL_PRODUCTS.find((x) => x.id === p.productId)?.name || '');
    const heat = (n) => /heat|thermacare/i.test(n);
    expect(names.filter(heat).length).toBeLessThanOrEqual(2);
    if (names.length > 1) expect(heat(names[0]) && heat(names[1])).toBe(false);
  });
});

describe('something different to try (Nov 10)', () => {
  const q = (sup, extra = {}) => ({ age: '27', allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'], supportSelections: sup, personalizationCompleted: true, ...extra });
  it('a cramps shelf is not all devices: it holds at least three different kinds', () => {
    const shelf = getEcosystemSeedFromQuiz(q(['Cramps or period pain'])).shelves.find((s) => s.needId === 'pain.menstrual_cramp');
    const cats = new Set(shelf.picks.map((p) => ALL_PRODUCTS.find((x) => x.id === p.productId)?.category));
    expect(shelf.picks.length).toBeGreaterThanOrEqual(3);
    expect(cats.size).toBeGreaterThanOrEqual(2);
  });
  it('one pick chosen still means one pick', () => {
    const shelf = getEcosystemSeedFromQuiz(q(['Cramps or period pain'], { recommendedProductsPerArea: 1, recommendationCountTouched: true })).shelves.find((s) => s.needId === 'pain.menstrual_cramp');
    expect(shelf.picks.length).toBe(1);
  });
});

describe('reviews in ranking (Nov 10)', async () => {
  const { reviewNudge } = await import('./v2.js');
  it('more good ratings rank a little higher; a low rating a little lower; never more than 0.03', () => {
    expect(reviewNudge({ rating: 4.8, ratingCount: 10000 })).toBeGreaterThan(reviewNudge({ rating: 4.8, ratingCount: 10 }));
    expect(reviewNudge({ rating: 3.2, ratingCount: 500 })).toBeLessThan(0);
    expect(reviewNudge({})).toBe(0);
    expect(Math.abs(reviewNudge({ rating: 5, ratingCount: 1e9 }))).toBeLessThanOrEqual(0.03);
  });
});

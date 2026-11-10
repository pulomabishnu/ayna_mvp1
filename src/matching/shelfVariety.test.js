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

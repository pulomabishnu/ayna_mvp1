import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, getProductMatchDetailsForProduct } from '../data/products.js';

// Nov 9 algorithm audit (24 personas). Each fix below is sourced in the code it tests.
const base = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], personalizationCompleted: true };
const shelfNames = (q, needId) => {
  const sh = getEcosystemSeedFromQuiz({ ...base, ...q }).shelves.find((s) => s.needId === needId);
  return (sh?.picks || []).map((p) => ALL_PRODUCTS.find((x) => x.id === p.productId)?.name || '');
};

describe('Nov 9 algorithm audit', () => {
  it('pregnancy nausea: vitamin B6 (ACOG first-line) is a match, with a caution, not excluded', () => {
    const names = shelfNames({ age: '31', lifeStageSelections: ['I am pregnant'], supportSelections: ['Nausea'] }, 'digestive.nausea');
    expect(names.some((n) => /vitamin b6/i.test(n))).toBe(true);
  });
  it('nausea without pregnancy never pulls in B6', () => {
    const names = shelfNames({ age: '24', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Nausea'] }, 'digestive.nausea');
    expect(names.some((n) => /vitamin b6/i.test(n))).toBe(false);
  });
  it('pregnancy yeast: only 7-day azole creams (CDC); 3-day courses stay for non-pregnant users', () => {
    const preg = shelfNames({ age: '34', lifeStageSelections: ['I am pregnant'], supportSelections: ['Yeast infection concerns'] }, 'vaginal.yeast');
    expect(preg.some((n) => /3-dose|3-day|1-day/i.test(n))).toBe(false);
    expect(preg.some((n) => /7-day/i.test(n))).toBe(true);
    const not = shelfNames({ age: '34', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Yeast infection concerns'] }, 'vaginal.yeast');
    expect(not.some((n) => /3-dose/i.test(n))).toBe(true);
  });
  it('anxiety: a licensed-therapy service is not graded like a pill (BetterHelp vs Embr Wave)', () => {
    const q = { ...base, age: '38', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Anxiety'] };
    const bh = ALL_PRODUCTS.find((x) => x.name === 'BetterHelp');
    const embr = ALL_PRODUCTS.find((x) => /Embr Wave 2/.test(x.name));
    expect(getProductMatchDetailsForProduct(bh, q).percent).toBeGreaterThanOrEqual(getProductMatchDetailsForProduct(embr, q).percent - 2);
  });
  it('asking for reusable puts reusable period products ahead of disposables', () => {
    const names = shelfNames({ age: '23', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Period product support'], avoidIngredients: ['Reusable', 'Organic'] }, 'period.product_support');
    expect(names.length).toBeGreaterThan(1);
    const disposable = (n) => /disposable/i.test(n) || (!/reusable|cup|disc|underwear|kit/i.test(n));
    expect(disposable(names[0])).toBe(false);
    expect(disposable(names[1])).toBe(false);
  });
});

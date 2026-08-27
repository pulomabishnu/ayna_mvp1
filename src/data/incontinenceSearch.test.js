import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, CATEGORY_LABELS } from './products';
import { buildSearchTextForItem, scoreQueryAgainstProduct } from '../utils/naturalLanguageSearch';

/**
 * Regression coverage for a reported bug: searching "panty liners for
 * bladder leaks" returned only period underwear, because the catalog had
 * zero urinary-incontinence products — every "leak"-tagged item was
 * menstrual. Fixed by adding real incontinence products (Poise, Always
 * Discreet, Depend, TENA), not by tuning the scorer.
 */
function topMatchesFor(query) {
  return ALL_PRODUCTS
    .map((p) => ({ product: p, score: scoreQueryAgainstProduct(query, buildSearchTextForItem(p, CATEGORY_LABELS)) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

describe('incontinence catalog coverage', () => {
  it('catalog has at least one product in the incontinence category', () => {
    const incontinence = ALL_PRODUCTS.filter((p) => p.category === 'incontinence');
    expect(incontinence.length).toBeGreaterThanOrEqual(3);
  });

  it('"panty liners for bladder leaks" surfaces an incontinence product above period underwear', () => {
    const results = topMatchesFor('panty liners for bladder leaks');
    expect(results.length).toBeGreaterThan(0);
    const topCategory = results[0].product.category;
    expect(topCategory).toBe('incontinence');

    const bestPeriodUnderwearScore = Math.max(
      0,
      ...results.filter((r) => r.product.category === 'period-underwear').map((r) => r.score)
    );
    const bestIncontinenceScore = Math.max(
      ...results.filter((r) => r.product.category === 'incontinence').map((r) => r.score)
    );
    expect(bestIncontinenceScore).toBeGreaterThan(bestPeriodUnderwearScore);
  });

  it('"urinary incontinence products" surfaces incontinence products, not just a Kegel trainer', () => {
    const results = topMatchesFor('urinary incontinence products');
    const incontinenceResults = results.filter((r) => r.product.category === 'incontinence');
    expect(incontinenceResults.length).toBeGreaterThan(0);
    // At least one incontinence product should outscore anything outside the category.
    const bestOutside = Math.max(0, ...results.filter((r) => r.product.category !== 'incontinence').map((r) => r.score));
    const bestInside = Math.max(...incontinenceResults.map((r) => r.score));
    expect(bestInside).toBeGreaterThanOrEqual(bestOutside);
  });

  it('"incontinence pads for women" ranks an incontinence product first', () => {
    const results = topMatchesFor('incontinence pads for women');
    expect(results[0].product.category).toBe('incontinence');
  });
});

describe('menopause query coverage (bounded audit)', () => {
  it('a menopause + sleep query now surfaces a real product (was zero matches before the Womaness copy fix)', () => {
    const results = topMatchesFor('trouble sleeping menopause');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].product.category).toBe('menopause');
  });
});

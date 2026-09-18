import { describe, expect, it } from 'vitest';
import {
  getEcosystemCategoryKey,
  limitEcosystemProductsByCategory,
  MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY,
} from './ecosystemLimits.js';

function product(id, category, extra = {}) {
  return { id, name: id, category, llmGenerated: true, ...extra };
}

describe('ecosystem category limits', () => {
  it('treats the whole Period macro category as one capped bucket', () => {
    const periodProducts = [
      product('pad-1', 'pad'),
      product('tampon-1', 'tampon'),
      product('cup-1', 'cup'),
      product('disc-1', 'disc'),
      product('underwear-1', 'period-underwear'),
      product('cramps-1', 'cramp-relief'),
      product('steamer-1', 'cup-steamer'),
    ];

    expect(periodProducts.map(getEcosystemCategoryKey)).toEqual(
      periodProducts.map(() => 'period-care')
    );

    const limited = limitEcosystemProductsByCategory(periodProducts);
    expect(limited).toHaveLength(MAX_ECOSYSTEM_PRODUCTS_PER_CATEGORY);
  });

  it('never returns more than five products in one care category', () => {
    const products = Array.from({ length: 20 }, (_, index) =>
      product(`period-${index}`, index % 2 ? 'tampon' : 'pad', { matchPercent: 100 - index })
    );

    const limited = limitEcosystemProductsByCategory(products);
    expect(limited).toHaveLength(5);
    expect(limited.map((item) => item.id)).toEqual([
      'period-0', 'period-1', 'period-2', 'period-3', 'period-4',
    ]);
  });

  it('caps separate care categories independently', () => {
    const products = [
      ...Array.from({ length: 8 }, (_, index) => product(`period-${index}`, 'pad')),
      ...Array.from({ length: 8 }, (_, index) =>
        product(`sleep-${index}`, 'sleep', { healthFunctions: ['sleep-energy'] })
      ),
    ];

    const limited = limitEcosystemProductsByCategory(products);
    expect(limited.filter((item) => getEcosystemCategoryKey(item) === 'period-care')).toHaveLength(5);
    expect(limited.filter((item) => getEcosystemCategoryKey(item) === 'sleep-energy')).toHaveLength(5);
  });

  it('prefers prioritized user items without mutating or deleting source data', () => {
    const products = Array.from({ length: 7 }, (_, index) =>
      product(`period-${index}`, 'pad', { matchPercent: 100 - index })
    );
    const originalIds = products.map((item) => item.id);

    const limited = limitEcosystemProductsByCategory(products, 5, {
      priorityIds: new Set(['period-6']),
    });

    expect(limited.map((item) => item.id)).toContain('period-6');
    expect(products.map((item) => item.id)).toEqual(originalIds);
    expect(products).toHaveLength(7);
  });

  it('preserves manual and swapped items above the generated cap', () => {
    const generated = Array.from({ length: 7 }, (_, index) => product(`generated-${index}`, 'pad'));
    const manual = product('manual', 'tampon', { llmGenerated: false });
    const swapped = product('swapped', 'cup', { _userSwapped: true });

    const limited = limitEcosystemProductsByCategory([...generated, manual, swapped]);

    expect(limited.filter((item) => item.llmGenerated && !item._userSwapped)).toHaveLength(5);
    expect(limited.map((item) => item.id)).toEqual(expect.arrayContaining(['manual', 'swapped']));
  });

  it('preserves tracked or saved generated items without consuming the generated allowance', () => {
    const products = Array.from({ length: 7 }, (_, index) => product(`period-${index}`, 'pad'));
    const limited = limitEcosystemProductsByCategory(products, 5, {
      protectedIds: new Set(['period-6']),
    });

    expect(limited).toHaveLength(6);
    expect(limited.map((item) => item.id)).toContain('period-6');
  });
});

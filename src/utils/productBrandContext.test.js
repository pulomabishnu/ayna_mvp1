import { describe, it, expect } from 'vitest';
import { deriveBrandSearchContext } from './productBrandContext.js';

describe('deriveBrandSearchContext — never invents a brand', () => {
  it('does NOT guess a brand from the product name', () => {
    // Was "Organic Cotton", which reached users as "Reddit search: Organic Cotton tampons".
    const out = deriveBrandSearchContext({ name: 'Organic Cotton Tampons', category: 'tampon' });
    expect(out.brandName).toBeFalsy();
    expect(out.emphasizeBrandInSearches).toBe(false);
  });

  it('uses an explicit brand when one is set', () => {
    const out = deriveBrandSearchContext({ name: 'Hiphugger', brand: 'Thinx', category: 'period-underwear' });
    expect(out.brandName).toBe('Thinx');
    expect(out.emphasizeBrandInSearches).toBe(true);
  });

  it('ignores a whitespace-only brand', () => {
    expect(deriveBrandSearchContext({ name: 'Some Cup', brand: '   ', category: 'cup' }).brandName).toBeFalsy();
  });

  it('caps an absurdly long brand', () => {
    const out = deriveBrandSearchContext({ name: 'X', brand: 'B'.repeat(200), category: 'cup' });
    expect(out.brandName.length).toBeLessThanOrEqual(56);
  });

  it('handles a null product', () => {
    expect(deriveBrandSearchContext(null).emphasizeBrandInSearches).toBe(false);
  });
});

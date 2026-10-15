import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, isTeenProduct } from './products';

describe('teen products on an 18+ site', () => {
  it('are never matched', () => {
    const teen = ALL_PRODUCTS.find((p) => isTeenProduct(p));
    expect(teen).toBeTruthy();
    const d = getProductMatchDetailsForProduct(teen, { frustrations: ['Heavy flow'], preference: ['fragrance-free'] });
    expect(d.eligible).toBe(false);
    expect(d.matchStatus).toBe('excluded');
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../../data/products.js';
import { stableShopOrder, rankShopForProfile } from './shopOrder.js';
import { formatPrice } from '../../utils/formatPrice.js';

describe('shop default order', () => {
  it('is the same order for the same session seed', () => {
    expect(stableShopOrder(ALL_PRODUCTS, 42).map((p) => p.id)).toEqual(stableShopOrder(ALL_PRODUCTS, 42).map((p) => p.id));
  });
  it('drops midlife products to the end for a 24-year-old with regular periods', () => {
    const answers = { age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain'], priceRange: ['Under $25'] };
    const ranked = rankShopForProfile(stableShopOrder(ALL_PRODUCTS, 7), answers);
    const firstTwenty = ranked.slice(0, 20);
    expect(firstTwenty.some((p) => (p.healthFunctions || []).includes('perimenopause'))).toBe(false);
    expect(ranked).toHaveLength(ALL_PRODUCTS.length);
  });
});

describe('formatPrice with two sizes', () => {
  it('keeps each size whole', () => {
    expect(formatPrice({ price: '$24.99 (50 mL) · $12.99 (1.0 fl oz trial size)' })).toEqual({ main: '$24.99', sub: '50 mL · $12.99 (1.0 fl oz trial size)' });
  });
});

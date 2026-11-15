import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { buildProductProfile, NOT_AUTO_MATCHED } from './productProfile.js';

describe('high-dose vitamin D is never matched automatically (founder, Nov 15)', () => {
  it('has no need it can be matched to, but stays in the catalog', () => {
    const d3 = ALL_PRODUCTS.find((p) => p.id === 'p-natures-bounty-d3-125mcg');
    expect(d3).toBeTruthy();
    expect(NOT_AUTO_MATCHED.has(d3.id)).toBe(true);
    expect(Object.keys(buildProductProfile(d3).health_need_relevance)).toEqual([]);
  });
});

import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import {
  TRENDING_SIZE,
  getWeeklyTrendingLineup,
  orderByWeeklyTrending,
  takeDistinctCategories,
  trendingCategoryLabel,
  trendingWeekIndex,
} from './trendingLineup.js';

const day = (y, m, d) => new Date(y, m - 1, d, 12);
const ids = (lineup) => lineup.map(({ product }) => product.id);

describe('trendingWeekIndex', () => {
  it('starts at week 0 on 2026-10-01 and ticks over every 7 days', () => {
    expect(trendingWeekIndex(day(2026, 9, 20))).toBe(0);
    expect(trendingWeekIndex(day(2026, 10, 1))).toBe(0);
    expect(trendingWeekIndex(day(2026, 10, 7))).toBe(0);
    expect(trendingWeekIndex(day(2026, 10, 8))).toBe(1);
    expect(trendingWeekIndex(day(2026, 11, 5))).toBe(5);
  });
});

describe('getWeeklyTrendingLineup', () => {
  // A year of weeks, checked against the real catalog.
  const weeks = Array.from({ length: 52 }, (_, w) => getWeeklyTrendingLineup(ALL_PRODUCTS, day(2026, 10, 1 + w * 7)));

  it('fills every slot, with no repeated product or category within a week', () => {
    for (const lineup of weeks) {
      expect(lineup).toHaveLength(TRENDING_SIZE);
      expect(new Set(ids(lineup)).size).toBe(TRENDING_SIZE);
      expect(new Set(lineup.map(({ product }) => trendingCategoryLabel(product))).size).toBe(TRENDING_SIZE);
    }
  });

  it('shows a different set of products from one week to the next', () => {
    for (let w = 1; w < weeks.length; w += 1) {
      const previous = new Set(ids(weeks[w - 1]));
      expect(ids(weeks[w]).filter((id) => previous.has(id))).toEqual([]);
    }
  });

  it('is the same lineup all week long', () => {
    expect(ids(getWeeklyTrendingLineup(ALL_PRODUCTS, day(2026, 10, 1))))
      .toEqual(ids(getWeeklyTrendingLineup(ALL_PRODUCTS, day(2026, 10, 7))));
  });

  it('shows a category\'s next product when that category comes back around', () => {
    const seen = new Map();
    let rotated = false;
    for (const lineup of weeks) {
      for (const { product } of lineup) {
        const label = trendingCategoryLabel(product);
        if (seen.has(label) && seen.get(label) !== product.id) rotated = true;
        seen.set(label, product.id);
      }
    }
    expect(rotated).toBe(true);
  });

  it('only uses real, physical, non-recalled products with a photo', () => {
    for (const { product } of weeks.flat()) {
      expect(product.internal).toBeFalsy();
      expect(product.type || 'physical').toBe('physical');
      expect(product.image).toBeTruthy();
    }
  });
});

describe('returning-user grid helpers', () => {
  it('puts this week\'s lineup first, then de-duplicates categories', () => {
    const lineup = getWeeklyTrendingLineup(ALL_PRODUCTS, day(2026, 10, 1));
    const ordered = orderByWeeklyTrending(ALL_PRODUCTS, lineup, day(2026, 10, 1));
    expect(ordered.slice(0, TRENDING_SIZE).map((p) => p.id)).toEqual(ids(lineup));
    expect(ordered).toHaveLength(ALL_PRODUCTS.length);

    const shown = takeDistinctCategories(ordered);
    expect(new Set(shown.map(trendingCategoryLabel)).size).toBe(shown.length);
    expect(new Set(shown.map((p) => p.id)).size).toBe(shown.length);
  });

  it('skips a second product from a category already shown', () => {
    const list = [
      { id: 'a', category: 'pad' },
      { id: 'b', category: 'pad' },
      { id: 'c', category: 'skin' },
      { id: 'd', category: 'skincare' },
      { id: 'a', category: 'tampon' },
    ];
    expect(takeDistinctCategories(list).map((p) => p.id)).toEqual(['a', 'c']);
  });
});

import { describe, it, expect } from 'vitest';
import { compactScenarios, explore, OUTCOME } from './explore.js';

const universe = [
  { id: 'a1', name: 'A Gel', brand: 'A', partner: true },
  { id: 'b1', name: 'B Gel', brand: 'B' },
  { id: 'b2', name: 'B Balm', brand: 'B' },
  { id: 'c1', name: 'C Wash', brand: 'C' },
];
const res = (need, budget, format, skus) => ({ need, budget, format, placements: skus.map((s) => ({ sku: s })) });
const results = [
  res('Dryness', 'under-25', null, ['a1', 'b1', 'b2']),
  res('Dryness', 'any', 'Gels', ['b1', 'a1']),
  res('Itch', 'under-25', null, []),
];
const cat = { k: 3, ...compactScenarios(results, universe, (p) => p.brand, (p) => p.partner) };
// Brand A: placed, placed, not eligible
const outcomes = [OUTCOME.selected, OUTCOME.selected, OUTCOME.insufficient_info].join('');

describe('explore', () => {
  it('matches hand counts with no filter, including no-result scenarios', () => {
    const e = explore(cat, 'A', outcomes);
    expect(e.scenarios).toBe(3);
    expect(e.slots).toBe(5);
    expect(e.unfilled).toBe(4);
    expect(e.slotShare).toEqual({ num: 2, den: 5, pct: 40 });
    expect(e.inclusion).toEqual({ num: 2, den: 3, pct: 66.7 });
    expect(e.eligibleToPlaced).toEqual({ num: 2, den: 2, pct: 100 });
    expect(e.noResult).toEqual({ num: 1, den: 3, pct: 33.3 });
  });
  it('ranks every brand and product in the universe by name, zero-slot ones included', () => {
    const e = explore(cat, 'A', outcomes);
    expect(e.brands.map((b) => [b.brand, b.slots, b.rank])).toEqual([['B', 3, 1], ['A', 2, 2], ['C', 0, 3]]);
    expect(e.products).toHaveLength(4);
    expect(e.products.find((p) => p.id === 'c1')).toMatchObject({ slots: 0, share: 0 });
    expect(e.rank).toEqual({ rank: 2, of: 2 });
  });
  it('marks ayna partners for highlighting without changing ranks', () => {
    const e = explore(cat, 'B', '');
    expect(e.brands.find((b) => b.brand === 'A')).toMatchObject({ partner: true, rank: 2 });
    expect(e.brands.find((b) => b.brand === 'C').partner).toBe(false);
    expect(e.products.find((p) => p.id === 'a1').partner).toBe(true);
  });
  it('applies need, budget and format filters', () => {
    expect(explore(cat, 'A', outcomes, { need: 'Itch' })).toMatchObject({ scenarios: 1, slots: 0 });
    expect(explore(cat, 'A', outcomes, { need: 'Itch' }).slotShare.pct).toBeNull();
    expect(explore(cat, 'A', outcomes, { budget: 'any' }).scenarios).toBe(1);
    expect(explore(cat, 'A', outcomes, { format: 'pref' }).scenarios).toBe(1);
    expect(explore(cat, 'A', outcomes, { format: 'any' }).scenarios).toBe(2);
  });
  it('returns N/A, not zero, when no scenario was eligible', () => {
    expect(explore(cat, 'C', 'ooo').eligibleToPlaced.pct).toBeNull();
  });
});

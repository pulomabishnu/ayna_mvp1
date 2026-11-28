import { describe, it, expect } from 'vitest';
import { marketRollup } from './market.js';

describe('marketRollup', () => {
  const cat = [
    { id: 'a', brand: 'X', category: 'pad', eng: { opened: 10, buy: 2 } },
    { id: 'b', brand: 'Y', category: 'pad', partner: true, eng: { opened: 30, buy: 3 } },
    { id: 'c', brand: 'Y', category: 'cup', eng: { opened: 4, buy: 1 } },
    { id: 'd', brand: 'Z', category: 'cup' },
  ];
  it('adds up activity by category and computes the brand share', () => {
    const r = marketRollup(cat, 'X');
    expect(r[0].id).toBe('pad');
    expect(r[0].opened).toBe(40);
    expect(r[0].myShare).toBe(25);
    expect(r[0].ctr).toBe(12.5);
    expect(r[0].leaders[0].brand).toBe('Y');
    expect(r[1].mine).toBe(0);
    expect(r[1].brandCount).toBe(2);
  });
});

describe('brandSnapshot', () => {
  it('ranks a brand among every brand in the catalog', async () => {
    const { brandSnapshot } = await import('./market.js');
    const s = brandSnapshot([
      { id: 'a', brand: 'X', category: 'pad', eng: { opened: 10, buy: 2 } },
      { id: 'b', brand: 'Y', category: 'pad', eng: { opened: 30, buy: 3 } },
      { id: 'c', brand: 'X', category: 'cup', eng: { opened: 5, buy: 0 } },
    ], 'X');
    expect(s.tot.opened).toBe(15);
    expect(s.viewRank).toBe(2);
    expect(s.clickRank).toBe(2);
    expect(s.products[0].id).toBe('a');
    expect(s.categories.map((c) => c.id)).toEqual(['pad', 'cup']);
    expect(s.othersCtr).toBe(10);
  });
});

describe('recommendationsFor', () => {
  it('counts top-3 spots for any brand in the test', async () => {
    const { recommendationsFor } = await import('./market.js');
    const cats = [{ id: 'x', label: 'X', products: [{ brand: 'A' }, { brand: 'B' }, { brand: 'C' }], rows: [{ p: [0, 1] }, { p: [1] }] }];
    expect(recommendationsFor(cats, 'B')[0]).toMatchObject({ mine: 2, slots: 3, rank: 1, of: 2, listed: 1 });
    expect(recommendationsFor(cats, 'C')[0]).toMatchObject({ mine: 0, rank: null });
    expect(recommendationsFor(cats, 'Z')).toEqual([]);
  });
});

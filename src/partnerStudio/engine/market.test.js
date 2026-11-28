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

import { describe, expect, it, vi } from 'vitest';
vi.mock('./WhyTrace.jsx', () => ({ usePro: () => true, default: () => null }));
const products = await import('../../data/products.js');
const { priceSpot } = await import('./WhyFit.jsx');

// Notion (Nov 13): the price slider on Magic Hour Venus Tea ($11) ran to $6,936.75, the Sleep Number
// Climate360 smart bed (a real queen sale price in the live catalog), so "costs less than most" meant nothing.
describe('price slider compares the same kind of product', () => {
  const tea = (id, price) => ({ id, name: `${id} herbal tea`, category: 'sleep', type: 'physical', price: `$${price}`, tags: ['sleep', 'herbal tea', 'caffeine-free'], description: 'Loose-leaf herbal tea. Steep 1 tsp in hot water before bed.' });
  const bed = { id: 'p-bed', name: 'Sleep Number Climate360 smart bed', category: 'sleep', type: 'physical', price: '$6936.75', tags: ['sleep', 'smart bed', 'cooling'], description: 'A smart bed that cools or warms each side.' };

  it('a sleep tea is placed among teas, not beds', () => {
    const teas = [11, 14, 18, 22, 25, 30].map((p, i) => tea(`t${i}`, p));
    products.ALL_PRODUCTS.push(...teas, bed);
    try {
      const spot = priceSpot(teas[0]);
      expect(spot).not.toBeNull();
      expect(spot.hi).toBeLessThan(100);
      expect(spot.lo).toBe(11);
      expect(spot.word).toBe('Costs less than most like it on ayna');
    } finally {
      products.ALL_PRODUCTS.splice(products.ALL_PRODUCTS.length - 7, 7);
    }
  });

  it('with too few of the same kind, no slider at all (never an invented range)', () => {
    const lone = tea('lone', 11);
    products.ALL_PRODUCTS.push(lone, bed);
    try { expect(priceSpot(lone)).toBeNull(); } finally { products.ALL_PRODUCTS.splice(products.ALL_PRODUCTS.length - 2, 2); }
  });
});

import { describe, expect, it } from 'vitest';
import { analyzeSearch, searchProducts } from './index.js';

// Real-world phrasings (search research, Oct 17) find the right products.
const top = (q, n = 6) => searchProducts(q).slice(0, n);
describe('everyday search phrasing', () => {
  for (const [q, need] of [
    ['products for bad cramps', 'pain.menstrual_cramp'],
    ['leaking when i sneeze', 'urinary.incontinence'],
    ['itchy down there', null],
    ['hot flashes at night', null],
    ['cant sleep before period', null],
  ]) {
    it(`"${q}" finds products`, () => {
      const r = top(q);
      expect(r.length).toBeGreaterThan(0);
      if (need) expect(JSON.stringify(analyzeSearch(q))).toContain(need);
    });
  }
});

import '../../data/products.js';
import { describe, it, expect } from 'vitest';
import { matchBacking } from './matchBacking.js';
import { ALL_PRODUCTS } from '../../data/catalog.js';

describe('What backs this (Nov 16)', () => {
  const all = ALL_PRODUCTS.map((p) => ({ p, b: matchBacking(p) }));
  it('only sourced studies, at most 3, never the brand or a listing', () => {
    for (const { b } of all) {
      expect(b.studies.length).toBeLessThanOrEqual(3);
      for (const s of b.studies) {
        expect(s.url).toMatch(/^https?:\/\//);
        expect(['product', 'paper', 'gov', 'expert', 'ingredient']).toContain(s.kind);
        expect(s.via).toBeFalsy();
      }
    }
  });
  it('some products have backing to show', () => {
    expect(all.filter(({ b }) => b.studies.length).length).toBeGreaterThan(10);
  });
});

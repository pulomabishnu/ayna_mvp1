import { describe, it, expect } from 'vitest';
import { searchProducts, analyzeSearch } from './index.js';
import { buildProductProfile } from '../../matching/productProfile.js';
import { negatedFormats } from './engine.js';

const isPill = (p) => (buildProductProfile(p)?.formats || []).includes('pill_capsule');

describe('format exclusions in search (UX 26, TD 40)', () => {
  it('reads "not a pill" phrasings', () => {
    for (const q of ["something for cramps that isn't a pill", 'not a pill', 'no pills', 'non-pill cramp relief', 'pill-free cramps', 'cramps without pills', 'isn’t a pill']) {
      expect(negatedFormats(q).ids, q).toContain('pill_capsule');
    }
    expect(negatedFormats('pills for cramps').ids).toEqual([]);
  });
  it('leaves pills, tablets and capsules out of the results', () => {
    const q = "something for cramps under $25 that isn't a pill";
    const a = analyzeSearch(q);
    expect(a.filters.excludeFormats).toContain('pill_capsule');
    expect(a.searchText).not.toMatch(/\bpill/);
    const res = searchProducts(q);
    expect(res.length).toBeGreaterThan(0);
    expect(res.filter(isPill).map((p) => p.name)).toEqual([]);
    expect(res.some((p) => /advil|aleve/i.test(p.name))).toBe(false);
  });
  it('still finds pills when she asks for them', () => {
    expect(searchProducts('ibuprofen for cramps').some(isPill)).toBe(true);
  });
});

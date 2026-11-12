import { describe, expect, it } from 'vitest';
import { diversifyByBrand } from './diversify.js';

const P = (id, brand) => ({ id, brand, name: id });
describe('diversifyByBrand', () => {
  it('keeps #1 and the order, one per brand first', () => {
    const out = diversifyByBrand([P('a', 'X'), P('b', 'Y'), P('c', 'Y'), P('d', 'Z'), P('e', 'Y')], 5).map((p) => p.id);
    expect(out).toEqual(['a', 'b', 'd', 'c', 'e']);
  });
  it('never drops a product', () => { expect(diversifyByBrand([P('a', 'X'), P('b', 'X')]).length).toBe(2); });
  it('only reorders within the first n', () => {
    expect(diversifyByBrand([P('a', 'X'), P('b', 'X'), P('c', 'Y')], 1).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });
});

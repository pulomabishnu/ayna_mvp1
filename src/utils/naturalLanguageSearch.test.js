import { describe, it, expect } from 'vitest';
import { buildSearchTextForItem, scoreQueryAgainstProduct } from './naturalLanguageSearch';

describe('buildSearchTextForItem — brand searchability', () => {
  // A product whose brand name is NOT embedded in `name` used to be
  // invisible to a search for that brand, since brand was never added to
  // the matchable haystack — a real gap for smaller/partner brands where
  // name and brand can differ.
  it('includes item.brand in the searchable haystack', () => {
    const item = { name: 'Recovery Kit', brand: 'Frida', summary: 'A kit.' };
    const haystack = buildSearchTextForItem(item);
    expect(haystack).toContain('frida');
  });

  it('a query matching only the brand (not the name) still scores > 0', () => {
    const item = { name: 'Recovery Kit', brand: 'Frida', summary: 'A postpartum kit.' };
    const haystack = buildSearchTextForItem(item);
    expect(scoreQueryAgainstProduct('Frida', haystack)).toBeGreaterThan(0);
  });

  it('does not break when brand is absent', () => {
    const item = { name: 'Generic Product', summary: 'A product.' };
    expect(() => buildSearchTextForItem(item)).not.toThrow();
  });
});

describe('scoreQueryAgainstProduct — word-boundary matching', () => {
  // Live bug: searching "hair" surfaced "Emsella Chair Treatment" because
  // "chair" contains "hair" as a literal substring. Word matching must
  // require the term to appear as its own word, not just anywhere inside
  // a longer word.
  it('does not match "hair" inside "chair"', () => {
    const item = { name: 'Emsella Chair Treatment', summary: 'A pelvic floor device.' };
    const haystack = buildSearchTextForItem(item);
    expect(scoreQueryAgainstProduct('hair', haystack)).toBe(0);
  });

  it('still matches "hair" against a product that is actually about hair', () => {
    const item = { name: 'Hair Growth Serum', summary: 'Supports healthy hair.' };
    const haystack = buildSearchTextForItem(item);
    expect(scoreQueryAgainstProduct('hair', haystack)).toBeGreaterThan(0);
  });

  it('does not match "pad" inside "spade" or unrelated words', () => {
    const item = { name: 'Spade Necklace', summary: 'A piece of jewelry.' };
    const haystack = buildSearchTextForItem(item);
    expect(scoreQueryAgainstProduct('pad', haystack)).toBe(0);
  });

  it('still matches plural/singular stemming (pad <-> pads)', () => {
    const item = { name: 'Overnight Pads', summary: 'Menstrual pads for heavy flow.' };
    const haystack = buildSearchTextForItem(item);
    expect(scoreQueryAgainstProduct('pad', haystack)).toBeGreaterThan(0);
  });

  it('still matches a single-character term as its own token (vitamin C)', () => {
    const item = { name: 'Vitamin C Serum', summary: 'Brightening serum with vitamin c.' };
    const haystack = buildSearchTextForItem(item);
    expect(scoreQueryAgainstProduct('c', haystack)).toBeGreaterThan(0);
  });
});

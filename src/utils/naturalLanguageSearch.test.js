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

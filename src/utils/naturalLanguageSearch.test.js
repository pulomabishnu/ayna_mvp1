import { describe, it, expect } from 'vitest';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct, findConfidentProductMatch } from './naturalLanguageSearch';

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

describe('scoreQueryAgainstProduct — "sti" / "std" search (2026-08-25 live bug)', () => {
  // Live bug: searching "sti" returned nothing, even though Wisp and Planned
  // Parenthood Direct genuinely offer STI care — "STI" appeared only in their
  // prose summary, not in any identity field (name/tags/healthFunctions), so
  // the single-term identity-hit gate rejected it as a passing mention. The
  // real fix is tagging those products (see supabase/seed); this test locks
  // in that once a product is properly tagged, "sti" AND "std" both find it.
  it('does not match "sti" against a product that only mentions it in prose', () => {
    const item = {
      name: 'Wisp',
      summary: 'Asynchronous online sexual health care: birth control, emergency contraception, UTI and STI treatment.',
      tags: ['contraception', 'privacy', 'comfort'],
      healthFunctions: ['contraception', 'telehealth'],
    };
    const haystack = buildSearchTextForItem(item);
    const identity = buildIdentityTextForItem(item);
    expect(scoreQueryAgainstProduct('sti', haystack, identity)).toBe(0);
  });

  it('matches "sti" once the product is tagged for it (the real fix)', () => {
    const item = {
      name: 'Wisp',
      summary: 'Asynchronous online sexual health care: birth control, emergency contraception, UTI and STI treatment.',
      tags: ['contraception', 'privacy', 'comfort', 'sti'],
      healthFunctions: ['contraception', 'telehealth', 'sti-treatment'],
    };
    const haystack = buildSearchTextForItem(item);
    const identity = buildIdentityTextForItem(item);
    expect(scoreQueryAgainstProduct('sti', haystack, identity)).toBeGreaterThan(0);
  });

  it('"std" also finds a product tagged only "sti", via the alias', () => {
    const item = {
      name: 'Wisp',
      summary: 'Online sexual health care.',
      tags: ['contraception', 'sti'],
      healthFunctions: ['telehealth'],
    };
    const haystack = buildSearchTextForItem(item);
    const identity = buildIdentityTextForItem(item);
    expect(scoreQueryAgainstProduct('std', haystack, identity)).toBeGreaterThan(0);
  });
});

describe('findConfidentProductMatch', () => {
  const catalog = [
    {
      id: 'flex-cup-001',
      name: 'Flex Cup',
      brand: 'Flex',
      category: 'cup',
      tags: ['reusable', 'menstrual cup'],
      summary: 'A flexible, reusable menstrual cup.',
    },
    {
      id: 'generic-cup-001',
      name: 'Basic Menstrual Cup',
      brand: 'GenericBrand',
      category: 'cup',
      tags: ['reusable'],
      summary: 'An affordable menstrual cup option.',
    },
    {
      id: 'pain-relief-001',
      name: 'Cramp Relief Heating Pad',
      brand: 'ComfortCo',
      category: 'cramp-relief',
      tags: ['heat therapy'],
      summary: 'Portable heat therapy for period cramps, mentions vitamin E in the fabric lining.',
    },
  ];

  it('returns undefined for an empty or missing query', () => {
    expect(findConfidentProductMatch('', catalog, {})).toBeUndefined();
    expect(findConfidentProductMatch(null, catalog, {})).toBeUndefined();
    expect(findConfidentProductMatch(undefined, catalog, {})).toBeUndefined();
  });

  it('returns undefined for an empty or missing catalog', () => {
    expect(findConfidentProductMatch('flex cup', [], {})).toBeUndefined();
    expect(findConfidentProductMatch('flex cup', null, {})).toBeUndefined();
  });

  it('matches a clear brand + product name search to that exact product', () => {
    expect(findConfidentProductMatch('flex cup', catalog, {})).toBe('flex-cup-001');
  });

  it('does not report a match for a generic category search that fits many products', () => {
    // "cup" alone matches both cup products with no dominant winner —
    // exactly the ambiguous case this should stay silent on.
    expect(findConfidentProductMatch('cup', catalog, {})).toBeUndefined();
  });

  it('does not report a match for a one-word incidental prose mention', () => {
    // "vitamin" only appears once, in passing, in the heating pad's summary
    // — not what that product actually is. scoreQueryAgainstProduct itself
    // already rejects this (no identity-field hit), so this should too.
    expect(findConfidentProductMatch('vitamin', catalog, {})).toBeUndefined();
  });

  it('excludes an omitted product even if it would otherwise be the dominant match', () => {
    expect(findConfidentProductMatch('flex cup', catalog, { 'flex-cup-001': true })).toBeUndefined();
  });

  it('never returns a product with a non-positive score', () => {
    expect(findConfidentProductMatch('something completely unrelated to anything', catalog, {})).toBeUndefined();
  });

  it('resolves a category code to its human-readable label via the optional categoryLabels arg', () => {
    const labeledCatalog = [
      { id: 'menopause-relief-001', name: 'ReliefCo Cooling Wrap', brand: 'ReliefCo', category: 'menopause', tags: [] },
    ];
    // "hot flash relief" doesn't literally appear anywhere on the item, but
    // the category label does — without categoryLabels this should find
    // nothing; with it, the label text becomes part of the haystack.
    expect(findConfidentProductMatch('menopause relief', labeledCatalog, {})).toBeUndefined();
    expect(
      findConfidentProductMatch('menopause relief', labeledCatalog, {}, { menopause: 'Menopause Relief' })
    ).toBe('menopause-relief-001');
  });
});

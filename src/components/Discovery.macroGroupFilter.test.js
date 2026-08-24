import { describe, it, expect } from 'vitest';
import { MACRO_GROUPS, itemMatchesMacroGroup } from './Discovery';

// Regression coverage for the "Hormones" category-chip bug: clicking Hormones on Discovery
// surfaced Neycher intimate-care products (explicitly "hormone-free"/"non-hormonal") and a
// plain magnesium/cramp-relief supplement with nothing hormone-related about it, while missing
// genuinely hormone-relevant products. Root causes were (1) the Hormones group listing the
// broad product-TYPE category 'supplement' — which matches every supplement in the catalog
// regardless of what it treats — and (2) naive substring keyword matching on "hormone" that
// couldn't tell a positive claim ("supports hormonal balance") apart from a negated one
// ("hormone-free moisturizer").
describe('itemMatchesMacroGroup — hormones', () => {
  it('does NOT match a hormone-free intimate-care product just because its copy says "hormone-free"', () => {
    const neycherGel = {
      id: 'p-neycher-hydrobloom-gel',
      category: 'intimate-care',
      tags: ['discomfort', 'comfort', 'organic', 'non-hormonal'],
      summary: 'A hormone-free vaginal moisturizing gel with hyaluronic acid and botanical extracts.',
    };
    expect(itemMatchesMacroGroup(neycherGel, 'hormones')).toBe(false);
  });

  it('does NOT match a plain cramp-relief/sleep supplement with no hormone relevance, just because its category is "supplement"', () => {
    const magnesium = {
      id: 'p-magnesium',
      category: 'supplement',
      tags: ['cramps', 'endometriosis', 'discomfort', 'bloating', 'cost'],
      summary: 'Magnesium glycinate for cramp relief, better sleep, and mood support.',
    };
    expect(itemMatchesMacroGroup(magnesium, 'hormones')).toBe(false);
  });

  it('DOES match a supplement explicitly tagged with the hormone-balance healthFunction', () => {
    const vitaminD = {
      id: 'p-vitamin-d3',
      category: 'supplement',
      healthFunctions: ['hormone-balance'],
      tags: ['pcos', 'irregular'],
      summary: 'Supports bone health, immune function, and hormonal balance.',
    };
    expect(itemMatchesMacroGroup(vitaminD, 'hormones')).toBe(true);
  });

  it('DOES match a supplement tagged for PCOS even without the word "hormone" in its category', () => {
    const evenPrimrose = {
      id: 'p-evening-primrose',
      category: 'supplement',
      tags: ['cramps', 'pcos', 'discomfort', 'bloating'],
      summary: 'Rich in GLA which helps regulate inflammation and hormonal balance.',
    };
    expect(itemMatchesMacroGroup(evenPrimrose, 'hormones')).toBe(true);
  });

  it('DOES match a hormone-monitoring device by category', () => {
    const monitor = { id: 'd-monitor', category: 'hormone-monitoring', tags: [] };
    expect(itemMatchesMacroGroup(monitor, 'hormones')).toBe(true);
  });

  it('a broad, unrelated supplement (e.g. plain vitamin C for immunity) no longer blanket-matches Hormones', () => {
    const vitaminC = {
      id: 'p-vitamin-c',
      category: 'supplement',
      tags: ['immunity', 'cost'],
      summary: 'Vitamin C for immune support.',
    };
    expect(itemMatchesMacroGroup(vitaminC, 'hormones')).toBe(false);
  });
});

describe('MACRO_GROUPS — hormones config', () => {
  it('no longer lists the broad product-type "supplement" category as an auto-match', () => {
    const hormones = MACRO_GROUPS.find((g) => g.id === 'hormones');
    expect(hormones.categories).not.toContain('supplement');
  });
});

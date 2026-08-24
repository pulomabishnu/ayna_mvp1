import { describe, it, expect } from 'vitest';
import { MACRO_GROUPS, itemMatchesMacroGroup, resolveBrowseAiRoundQuery } from './Discovery';

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

// Regression coverage for the full 16-chip audit that followed the Hormones fix. Each case
// below is a real catalog product (or a faithful reproduction of its copy) that was a
// confirmed false positive before the fix — see the comments above MACRO_GROUPS,
// NEGATED_CONCERN_PHRASES, and itemMatchesMacroGroup's excludeCategories check in Discovery.jsx.
describe('itemMatchesMacroGroup — period', () => {
  it('does NOT match an intimate-care product that only mentions "period" as a usage-timing reference ("outside your period")', () => {
    const neycherGel = {
      id: 'p-neycher-hydrobloom-gel',
      category: 'intimate-care',
      tags: ['discomfort', 'comfort', 'organic', 'non-hormonal'],
      summary: 'A hormone-free vaginal moisturizing gel. Brand directs use for 7–10 consecutive days outside your period.',
    };
    expect(itemMatchesMacroGroup(neycherGel, 'period')).toBe(false);
  });

  it('does NOT match an incontinence pad whose copy explicitly denies being a menstrual product ("not menstrual flow", "rather than menstrual blood")', () => {
    const poise = {
      id: 'p-poise-ultra-thin-moderate',
      category: 'incontinence',
      tags: ['bladder-leaks', 'incontinence', 'urinary', 'menopause', 'leaks', 'cost'],
      summary: 'Ultra-thin pad for moderate urinary incontinence (stress or urge bladder leaks), not menstrual flow. Absorbs and locks away urine rather than menstrual blood.',
    };
    expect(itemMatchesMacroGroup(poise, 'period')).toBe(false);
  });

  it('does NOT match an incontinence liner whose copy contrasts itself with a menstrual product ("distinct from a menstrual panty liner")', () => {
    const alwaysDiscreet = {
      id: 'p-always-discreet-boutique-liners',
      category: 'incontinence',
      tags: ['bladder-leaks', 'incontinence', 'urinary', 'menopause', 'leaks', 'cost'],
      summary: 'A thin liner for very light urinary incontinence. Distinct from a menstrual panty liner in absorbent design.',
    };
    expect(itemMatchesMacroGroup(alwaysDiscreet, 'period')).toBe(false);
  });

  it('DOES still match a real period product by category', () => {
    const pad = { id: 'p-pad', category: 'pad', tags: [] };
    expect(itemMatchesMacroGroup(pad, 'period')).toBe(true);
  });
});

describe('itemMatchesMacroGroup — intimate care', () => {
  it('does NOT match a plain iron supplement just because its copy says "pharmacist"', () => {
    const iron = {
      id: 'p-nature-made-iron-65mg',
      category: 'supplement',
      tags: ['heavy-flow', 'fatigue', 'cramps', 'pcos'],
      summary: '#1 pharmacist recommended vitamin brand.',
    };
    expect(itemMatchesMacroGroup(iron, 'intimate')).toBe(false);
  });

  it('does NOT match Apple Health just because its platform is "iPhone"', () => {
    const appleHealth = { id: 'd-apple-health', category: 'tracker', tags: ['privacy', 'cost', 'comfort'], summary: 'Built-in period and fertility tracking on iPhone.' };
    expect(itemMatchesMacroGroup(appleHealth, 'intimate')).toBe(false);
  });

  it('DOES still match a real pH-balanced vaginal product', () => {
    const wash = { id: 'p-honeypot-wash', category: 'intimate-care', tags: ['organic', 'comfort'], summary: 'Clinically tested, pH-balanced, and gynecologist-approved intimate wash.' };
    expect(itemMatchesMacroGroup(wash, 'intimate')).toBe(true);
  });
});

describe('itemMatchesMacroGroup — skin (excludeCategories)', () => {
  it('does NOT match an intimate-care vulva balm just because its copy says "skin" (vulvar skin)', () => {
    const balm = { id: 'p-neycher-botanical-vulva-balm', category: 'intimate-care', tags: ['discomfort', 'comfort', 'organic', 'non-hormonal'], summary: 'A hormone-free balm for vulvar skin.' };
    expect(itemMatchesMacroGroup(balm, 'skin')).toBe(false);
  });

  it('does NOT match an incontinence liner just because its copy says "skin comfort formula"', () => {
    const tena = { id: 'p-tena-intimates-very-light-liner', category: 'incontinence', tags: ['bladder-leaks', 'incontinence', 'urinary', 'menopause', 'leaks', 'cost'], summary: 'Breathable materials with a skin-comfort formula.' };
    expect(itemMatchesMacroGroup(tena, 'skin')).toBe(false);
  });

  it('DOES still match a real skin-care product', () => {
    const oil = { id: 'p-hatch-oil', category: 'pregnancy', tags: ['comfort', 'pregnancy'], summary: 'Quick-drying botanical oil to soothe dry, itchy skin.' };
    expect(itemMatchesMacroGroup(oil, 'skin')).toBe(true);
  });
});

describe('itemMatchesMacroGroup — hair (excludeCategories)', () => {
  it('does NOT match a vaginal lotion just because its copy says "thinning" (vaginal tissue thinning, not hair)', () => {
    const lotion = { id: 'p-kindra-lotion', category: 'menopause', tags: ['discomfort', 'comfort', 'non-hormonal'], summary: 'Hormone-free daily lotion to address vaginal dryness and thinning associated with menopause.' };
    expect(itemMatchesMacroGroup(lotion, 'hair')).toBe(false);
  });

  it('does NOT match an intimate-care exfoliant just because its copy says "hairs" (ingrown hairs on the bikini line, not scalp hair)', () => {
    const exfoliant = { id: 'p-sweetspot-buff-brighten', category: 'intimate-care', tags: ['comfort'], summary: 'AHA/BHA exfoliating pads to treat ingrown hairs and razor burn on the bikini line and body.' };
    expect(itemMatchesMacroGroup(exfoliant, 'hair')).toBe(false);
  });
});

describe('itemMatchesMacroGroup — sleep-stress', () => {
  it('does NOT match an incontinence pad just because its copy says "stress" (stress incontinence, a bladder-control term)', () => {
    const poise = {
      id: 'p-poise-ultra-thin-moderate',
      category: 'incontinence',
      tags: ['bladder-leaks', 'incontinence', 'urinary', 'menopause', 'leaks', 'cost'],
      summary: 'Ultra-thin pad for moderate urinary incontinence (stress or urge bladder leaks).',
    };
    expect(itemMatchesMacroGroup(poise, 'sleep-stress')).toBe(false);
  });

  it('DOES still match a real mental-health/stress product', () => {
    const calm = { id: 'd-calm', category: 'mental-health', tags: [], summary: 'Meditation and relaxation app for stress and anxiety.' };
    expect(itemMatchesMacroGroup(calm, 'sleep-stress')).toBe(true);
  });
});

describe('itemMatchesMacroGroup — tests-devices', () => {
  it('does NOT match an intimate wash just because its copy says "tested" (clinically tested), not "test"', () => {
    const wash = { id: 'p-honeypot-wash', category: 'intimate-care', tags: ['organic', 'comfort'], summary: 'Clinically tested, pH-balanced, and gynecologist-approved.' };
    expect(itemMatchesMacroGroup(wash, 'tests-devices')).toBe(false);
  });

  it('does NOT match a PCOS supplement just because its copy says "testosterone"', () => {
    const spearmint = { id: 'p-spearmint-pcos', category: 'supplement', tags: ['pcos', 'organic'], summary: 'Spearmint may help lower free testosterone in PCOS.' };
    expect(itemMatchesMacroGroup(spearmint, 'tests-devices')).toBe(false);
  });

  it('DOES still match a real at-home test product', () => {
    const azo = { id: 'p-azo-test', category: 'supplement', tags: ['uti', 'cost'], summary: 'At-home UTI test strips. Results in 2 minutes.' };
    expect(itemMatchesMacroGroup(azo, 'tests-devices')).toBe(true);
  });
});

// Regression coverage for the typed-search "Load more" gap: typing a query into the search
// box (e.g. "postpartum") got exactly one AI round (runAiSearch, a one-shot fetch) and then no
// way to get more — the "Load more" button only ever triggered runBrowseAiRound, which bailed
// immediately whenever a text query was active (`if (qTrimForAi) return;`), even though
// clicking the equivalent category chip instead got the full 10-round treatment. Fixed by
// having runBrowseAiRound's query-resolution (resolveBrowseAiRoundQuery) also serve typed
// search, using the user's own text verbatim instead of a synthesized category-label phrase.
describe('resolveBrowseAiRoundQuery — typed-search continuation', () => {
  it('uses the typed query verbatim (not the category-derived label) when a search is active', () => {
    const resolved = resolveBrowseAiRoundQuery('postpartum', 'postpartum', 'all', 0);
    expect(resolved).not.toBeNull();
    expect(resolved.isTypedSearchContinuation).toBe(true);
    // First continuation round (roundIndexAtCallTime=0) is really the SECOND batch overall,
    // since runAiSearch's initial one-shot fetch already used the plain "postpartum" text —
    // so this round must NOT send the identical bare string (see the +1 offset rationale in
    // resolveBrowseAiRoundQuery's doc comment).
    expect(resolved.queryText).not.toBe('postpartum');
    expect(resolved.queryText).toContain('postpartum');
    expect(resolved.queryText).toContain('batch 2');
  });

  it('keeps using the typed text (not the chip label) even when a category chip is also selected', () => {
    // Mirrors the user report: typing "postpartum" auto-selects the Postpartum category via
    // runSearch's categoryNudges, so both a typed query AND a chip end up active together.
    const resolved = resolveBrowseAiRoundQuery('postpartum', 'postpartum', 'postpartum', 1);
    expect(resolved.isTypedSearchContinuation).toBe(true);
    expect(resolved.queryText).toContain('postpartum');
    expect(resolved.queryText).toContain('batch 3');
  });

  it('advances the batch number on later rounds so fetchSearchSuggestions cache is busted each time', () => {
    const round0 = resolveBrowseAiRoundQuery('magnesium', 'all', 'all', 0);
    const round1 = resolveBrowseAiRoundQuery('magnesium', 'all', 'all', 1);
    expect(round0.queryText).not.toBe(round1.queryText);
  });

  it('falls back to the synthesized category/macro-group label when no text query is active (browse mode, unchanged)', () => {
    const resolved = resolveBrowseAiRoundQuery('', 'all', 'hormones', 0);
    expect(resolved.isTypedSearchContinuation).toBe(false);
    expect(resolved.queryText).toBe('Hormones products');
  });

  it('returns null (nothing to send) for the fully-unscoped browse case: no query and "All"', () => {
    expect(resolveBrowseAiRoundQuery('', 'all', 'all', 0)).toBeNull();
  });
});

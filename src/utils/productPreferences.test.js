import { describe, it, expect } from 'vitest';
import { AVOID_INGREDIENTS, PREFERENCE_MAP } from './intakePreferenceMap.js';
import { PREFERENCE_OPTIONS, matchesProductPreference, availablePreferenceOptions } from './productPreferences.js';
import { ALL_PRODUCTS, productMatchesAvoidTrigger } from '../data/products.js';

describe('intake preferences reach the recommendation profile', () => {
  it('maps every selectable preference option (except Other/No preference)', () => {
    const unmapped = AVOID_INGREDIENTS.filter((o) => !['Other', 'No preference'].includes(o) && !PREFERENCE_MAP[o]);
    expect(unmapped).toEqual([]);
  });
});

describe('Browse preference filter', () => {
  it('every offered option matches at least one real catalog product', () => {
    for (const opt of availablePreferenceOptions(ALL_PRODUCTS)) {
      expect(ALL_PRODUCTS.some((p) => matchesProductPreference(p, opt.value))).toBe(true);
    }
  });

  it('never offers an option that would empty the grid', () => {
    const offered = availablePreferenceOptions([{ id: 'x', name: 'Organic Cotton Pad', tags: [] }]).map((o) => o.value);
    expect(offered).toEqual(['organic']);
  });

  it('unknown values never silently hide everything', () => {
    expect(matchesProductPreference({ name: 'x' }, 'not-a-pref')).toBe(true);
    expect(PREFERENCE_OPTIONS.length).toBeGreaterThan(0);
  });
});

describe('avoid triggers respect negation', () => {
  it('a fragrance-free product is NOT treated as containing fragrance', () => {
    expect(productMatchesAvoidTrigger({ summary: 'Fragrance-free, unscented pad.' }, 'fragrance')).toBe(false);
    expect(productMatchesAvoidTrigger({ summary: 'Made with no added fragrance.' }, 'fragrance')).toBe(false);
    expect(productMatchesAvoidTrigger({ summary: 'Lightly scented with parfum.' }, 'fragrance')).toBe(true);
    expect(productMatchesAvoidTrigger({ summary: 'Latex-free condom.' }, 'latex')).toBe(false);
  });
});

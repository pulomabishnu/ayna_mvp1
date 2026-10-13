import { describe, it, expect } from 'vitest';
import { customProductId, customProductName, isCustomProductId } from './customProductTag.js';
import { PARTNER_BRANDS, PARTNER_BRAND_PATTERNS } from './partnerBrands.js';

describe('customProductTag', () => {
  it('round-trips names exactly, using only id-safe characters', () => {
    for (const name of ['Zoloft', 'Diva Cup', "Mom's Pads (night) 2.0!", 'snake_case ~ thing', 'Crème née ✨']) {
      const id = customProductId(name);
      expect(id).toMatch(/^custom-[A-Za-z0-9_-]+$/);
      expect(isCustomProductId(id)).toBe(true);
      expect(customProductName(id)).toBe(name);
    }
  });
  it('ignores empty input and non-custom ids', () => {
    expect(customProductId('   ')).toBeNull();
    expect(isCustomProductId('p-winx-uti-test-treat')).toBe(false);
    expect(customProductName('p-winx-uti-test-treat')).toBe('');
    expect(customProductName('custom-_ZZ')).toBe('');
  });
});

describe('PARTNER_BRANDS display list', () => {
  it('has one display name per partner pattern, each matching its own pattern', () => {
    expect(PARTNER_BRANDS).toHaveLength(PARTNER_BRAND_PATTERNS.length);
    PARTNER_BRANDS.forEach(({ name, pattern }, i) => {
      expect(pattern).toBe(PARTNER_BRAND_PATTERNS[i]);
      expect(pattern.test(name.toLowerCase())).toBe(true);
    });
  });
});

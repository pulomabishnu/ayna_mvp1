import { describe, expect, it } from 'vitest';
import { isCbdProduct, isListedProduct } from './hiddenProducts.js';
import { ALL_PRODUCTS } from './products.js';
import { RELEASED_STARTUPS } from './startups.js';

// Notion AYNA-341 (Nov 13): no CBD products anywhere for now (Stripe's restricted list).
describe('CBD products are not listed', () => {
  it('the two live CBD products are hidden; hemp seed oil is not CBD', () => {
    expect(isListedProduct({ id: 'p-foria-awaken-arousal-oil-with-cbd-30-ml', name: 'Foria Awaken Arousal Oil with CBD (30 mL)' })).toBe(false);
    expect(isListedProduct({ id: 'p-vella-pleasurewave-arousal-lotion-with-lptv1', name: 'Vella Pleasurewave Arousal Lotion with LPTv1', tags: ['cbd', 'arousal'], ingredients: 'Aqua, Cannabidiol (Hemp-Derived CBD Isolate)' })).toBe(false);
    expect(isCbdProduct({ id: 'p-dame-aloe-lube', name: 'Dame Aloe Lube', ingredients: 'aloe, cannabis sativa seed extract' })).toBe(false);
    expect(isCbdProduct({ id: 'x', name: 'Hemp seed oil balm', ingredients: 'Cannabis Sativa Seed Oil' })).toBe(false);
  });
  it('nothing in the bundled catalog or services mentions CBD', () => {
    expect(ALL_PRODUCTS.filter(isCbdProduct).map((p) => p.id)).toEqual([]);
    expect(RELEASED_STARTUPS.filter((s) => /\bcbd\b|cannabidiol/i.test(`${s.tagline} ${s.description}`)).map((s) => s.id)).toEqual([]);
  });
});

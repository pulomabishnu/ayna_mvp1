import { describe, it, expect } from 'vitest';
import { adoptLiveCatalog, getProductById, ALL_PRODUCTS } from './products.js';
import { isListedProduct } from './hiddenProducts.js';

const HIDDEN = ['p-pink-stork-bloat', 'p-queen-v-pop', 'p-twentyeight-health-skin-care-prescription-skincare-via-complete-care', 'p-mypelvicbra-prolapse-chicken'];

describe('hidden products stay hidden in the live feed', () => {
  it('adoptLiveCatalog drops hidden, discontinued and Rx-only rows', async () => {
    const live = [
      ...HIDDEN.map((id) => ({ id, name: id, category: 'supplement' })),
      { id: 'p-rx-device', name: 'Rx device', category: 'wearable', whereToBuy: ['Pharmacy with prescription'] },
      { id: 'p-new-live', name: 'New live product', category: 'supplement' },
    ];
    adoptLiveCatalog(live);
    const mod = await import('./products.js');
    const ids = new Set(mod.ALL_PRODUCTS.map((p) => p.id));
    for (const id of HIDDEN) expect(ids.has(id)).toBe(false);
    expect(ids.has('p-rx-device')).toBe(false);
    expect(ids.has('p-new-live')).toBe(true);
    expect(getProductById('p-pink-stork-bloat')).toBeFalsy();
  });

  it('isListedProduct keeps telehealth and normal rows', () => {
    expect(isListedProduct({ id: 'x', category: 'telehealth', requiresPrescription: true })).toBe(true);
    expect(isListedProduct({ id: 'x', hidden: true })).toBe(false);
    expect(ALL_PRODUCTS.length).toBeGreaterThan(100);
  });
});

describe('duplicate listings (founder, Nov 10)', async () => {
  const { DUPLICATE_OF, isListedProduct: listed } = await import('./hiddenProducts.js');
  const { getProductById } = await import('./products.js');
  it('a duplicate never shows, and its id opens the product it duplicates', () => {
    for (const [dup, kept] of Object.entries(DUPLICATE_OF)) {
      expect(listed({ id: dup, name: 'x' }), dup).toBe(false);
      expect(listed({ id: kept, name: 'x' }), kept).toBe(true);
      expect(DUPLICATE_OF[kept], `${kept} must not itself be a duplicate`).toBeUndefined();
    }
    expect(getProductById('p-winx-health-vaginal-health-test-treat')?.id).toBe('p-winx-vaginal-health-test-treat');
  });
});

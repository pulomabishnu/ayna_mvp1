import { describe, it, expect, beforeAll } from 'vitest';
import { loadCatalog } from '../data/catalog.js';
import {
  toCatalogProduct,
  filterProductMapToCatalog,
  filterRecommendationsToCatalog,
  filterProductListToCatalog,
} from './catalogIntegrity.js';

describe('catalogIntegrity — nothing invented reaches the UI', () => {
  // The catalog loads after first paint (data/catalog.js); these checks need it.
  beforeAll(() => loadCatalog());

  it('drops a free-form model product saved by an older build', () => {
    expect(toCatalogProduct({ id: 'sleep-slug-tier0', name: 'Luna Sleep Gummies', brand: 'Nightfall', llmGenerated: true })).toBeNull();
  });

  it('replaces stale/saved facts with the current catalog record but keeps personal fields', () => {
    const p = toCatalogProduct({ id: 'p-rael-organic-pad', name: 'Rael Pads 900 pack', price: '$1', url: 'https://evil.example', whyItWorks: 'Soft.', llmGenerated: true });
    expect(p.name).toBe('Rael Large Organic Cotton Cover Pads With Wings');
    expect(p.price).toBe('Check retailer for current price (14 or 24 count)');
    expect(p.url).not.toBe('https://evil.example');
    expect(p.whyItWorks).toBe('Soft.');
    // "ayna picked this" is a personal flag, not a product fact. It must survive,
    // or AI picks turn into permanent shelf items after one reload (Oct 17).
    expect(p.llmGenerated).toBe(true);
    expect(p.catalogVerified).toBe(true);
  });

  it('filters product maps and lists', () => {
    const map = filterProductMapToCatalog({
      a: { id: 'p-rael-organic-pad' },
      b: { id: 'gen-xyz', name: 'Invented' },
    });
    expect(Object.keys(map)).toEqual(['p-rael-organic-pad']);
    expect(filterProductListToCatalog([{ id: 'p-rael-organic-pad' }, { id: 'p-rael-organic-pad' }, { id: 'nope' }])).toHaveLength(1);
  });

  it('filters cached recommendation tiers and drops empty concerns', () => {
    const recs = filterRecommendationsToCatalog([
      { concern: 'A', tiers: [{ product: { id: 'fake', name: 'Fake' }, alternatives: [] }] },
      { concern: 'B', tiers: [{ product: { id: 'p-rael-organic-pad' }, alternatives: [{ id: 'fake-alt' }, { id: 'p-lola-pad' }] }] },
    ]);
    expect(recs).toHaveLength(1);
    expect(recs[0].concern).toBe('B');
    expect(recs[0].topProduct.id).toBe('p-rael-organic-pad');
    expect(recs[0].tiers[0].alternatives.map((a) => a.id)).toEqual(['p-lola-pad']);
  });
  it('keeps a product the user added herself, with only what she typed', () => {
    const mine = { id: 'user-advil-liqui-gels-k3', name: 'Advil Liqui-Gels', category: 'cramp-relief', userAdded: true, price: '$1', url: 'https://x.test' };
    expect(toCatalogProduct(mine)).toEqual({ id: 'user-advil-liqui-gels-k3', name: 'Advil Liqui-Gels', category: 'cramp-relief', type: 'user', userAdded: true });
    expect(toCatalogProduct({ ...mine, userAdded: undefined })).toBeNull();
    expect(toCatalogProduct({ ...mine, id: 'advil' })).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { PRODUCT_VARIANTS } from '../data/productVariants.js';
import { getVariantSelection } from './productVariantSelection.js';
import { existsSync } from 'node:fs';
describe('exact variant purchase selection', () => {
  it('switches all four Cora pad boxes and destinations together', () => {
    const product = ALL_PRODUCTS.find(p => p.id === 'p-cora-organic-pads');
    expect(product.variants).toHaveLength(4);
    for (const v of product.variants) {
      const choice = getVariantSelection(product, v.id);
      expect(choice.buyUrl).toBe(v.url);
      expect(choice.image).toBe(v.image);
      expect(choice.displayName).toContain(v.label);
      expect(existsSync(`public${choice.image}`)).toBe(true);
    }
    expect(getVariantSelection(product, 'target-76155166')).toMatchObject({ buyUrl: 'https://www.target.com/p/-/A-76155166', image: '/products/packaging/cora-76155166.jpg' });
  });
  it('never enables an invented size or uses a generic link before choosing', () => {
    const product = ALL_PRODUCTS.find(p => p.id === 'p-saalt-cup');
    expect(getVariantSelection(product, '').buyUrl).toBe('');
    expect(getVariantSelection(product, 'made-up').buyUrl).toBe('');
  });
  it('does not substitute a different pack photo when a variant has no verified image', () => {
    expect(getVariantSelection({ name: 'Example', image: '/wrong-pack.jpg', variants: [{ id: 'small', label: 'Small', url: 'https://brand.test/small' }] }, 'small').image).toBe('');
  });
  it('requires a source, unique options, and exact variant or retailer product destinations', () => {
    for (const data of Object.values(PRODUCT_VARIANTS)) {
      expect(data.sourceUrl).toMatch(/^https:\/\//);
      expect(new Set(data.variants.map(v => v.id)).size).toBe(data.variants.length);
      for (const v of data.variants) {
        const url = new URL(v.url);
        expect(url.protocol).toBe('https:');
        expect(url.searchParams.get('variant') === v.id || url.pathname.endsWith(`/A-${v.id.replace('target-', '')}`)).toBe(true);
      }
    }
  });
});

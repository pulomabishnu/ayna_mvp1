import { describe, it, expect } from 'vitest';
import { toClientProduct } from '../../api/products.js';
import { toCatalogProduct } from '../utils/catalogIntegrity.js';
import { ALL_PRODUCTS } from './products.js';
import { CATALOG_CORRECTIONS } from './catalogCorrections.js';
import { existsSync } from 'node:fs';

describe('reviewed catalog corrections across data sources', () => {
  it('replaces stale database magnesium facts with the matching formulation and image', () => {
    const p = toClientProduct({ id: 'p-magnesium-glycinate', name: 'Magnesium', image: 'https://wrong.test/oxide.jpg', price: '$15 for 60 capsules', product_type: 'physical', category: 'supplement' });
    expect(p.name).toBe('Nature Made Magnesium Glycinate 200 mg, 60 Capsules');
    expect(p.image).toBe('/products/naturemade/magnesium-glycinate-200mg.png');
    expect(p.url).toContain('magnesium-glycinate');
    expect(p.price).toBe('$21.99 for 60 capsules');
  });
  it('does not restore an explicitly removed photo from a saved snapshot', () => {
    expect(toCatalogProduct({ id: 'd-menolabs', image: 'https://wrong.test/supplement.jpg' }).image).toBe('');
  });
  it('keeps corrected bundled images and API images identical, including empty images', () => {
    for (const p of ALL_PRODUCTS.filter(p => CATALOG_CORRECTIONS[p.id])) {
      const api = toClientProduct({ id: p.id, name: 'Old name', image: 'https://wrong.test/old.jpg', product_type: p.type, category: p.category });
      if ('image' in CATALOG_CORRECTIONS[p.id]) expect(api.image, p.id).toBe(p.image);
    }
  });
  it('ships each pinned image referenced by corrections', () => {
    for (const p of Object.values(CATALOG_CORRECTIONS)) if (p.image?.startsWith('/')) expect(existsSync(`public${p.image}`), p.image).toBe(true);
  });
});

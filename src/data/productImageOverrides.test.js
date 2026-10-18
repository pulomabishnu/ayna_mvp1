// Added on the live site after the packshot passes ran; photos pending.
const PACKSHOT_PENDING = new Set([
  'p-heraure-hermag-magnesium',
  'p-tampontribe-organic-tampons',
  'p-tampontribe-organic-pads',
  'p-tampontribe-pantyliners-bulk-buy',
  'p-tampontribe-teen-pads',
  'p-resa-rhythm-bracelet',
  // Momotaro Apotheca (Oct 17): brand photos until packshots are shot.
  // Oct 18 additions (Eliz's photos): Alubri kit, Momotaro Body Oil, Tampon Tribe bulk buys.
  ...['p-alubri-moisture-renewal-kit', 'p-momotaro-body-oil', 'p-tampontribe-tampons-bulk-buy', 'p-tampontribe-pads-bulk-buy', 'p-tampontribe-menstrual-cup'],
  ...['p-momotaro-salve', 'p-momotaro-daily-probiotic', 'p-momotaro-urinary-tract-supplement', 'p-momotaro-vaginal-suppository', 'p-momotaro-hydrosol-toner', 'p-momotaro-bath-body-tonic'],
  // Evidence-backed basics (Oct 17): retailer photos until packshots are shot.
  ...['p-advil-ibuprofen-200', 'p-aleve-naproxen-220', 'p-monistat-3-combo', 'p-taro-clotrimazole-7', 'p-womens-rogaine-foam', 'p-panoxyl-bpo-10-wash', 'p-differin-adapalene-gel', 'p-metamucil-psyllium-orange', 'p-miralax-peg-3350', 'p-nature-made-folic-acid-400', 'p-easyhome-lh-strips-50', 'p-visby-womens-sti-test', 'p-rugby-vitamin-b6-25'],
]);

import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_PRODUCTS, CATALOG_PRODUCTS } from './products.js';
import { PRODUCT_IMAGE_OVERRIDES, productImageOverride, productGallery, withImageOverride } from './productImageOverrides.js';
import { isPlaceholderProductImage } from '../utils/resolveProductImage.js';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));

describe('product image overrides', () => {
  const entries = Object.entries(PRODUCT_IMAGE_OVERRIDES);
  const allPaths = entries.flatMap(([, e]) => (typeof e === 'string' ? [e] : [e.cover, ...(e.gallery || [])]));

  it('covers every physical catalog product (digital products keep brand imagery)', () => {
    const missing = ALL_PRODUCTS.filter((p) => p.type !== 'digital' && !PACKSHOT_PENDING.has(p.id) && !PRODUCT_IMAGE_OVERRIDES[p.id]);
    expect(missing.map((p) => p.id)).toEqual([]);
  });

  it('only maps ids that exist in the catalog', () => {
    // CATALOG_PRODUCTS: hidden products keep their photos for when they return.
    const ids = new Set(CATALOG_PRODUCTS.map((p) => p.id));
    expect(entries.map(([id]) => id).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('uses either a cover string or { cover, gallery } with at most 4 extras', () => {
    const bad = entries.filter(([, e]) => {
      if (typeof e === 'string') return !e;
      return !e.cover || !Array.isArray(e.gallery) || e.gallery.length < 1 || e.gallery.length > 4;
    });
    expect(bad).toEqual([]);
  });

  it('points every cover and gallery image at a small local file that passes the photo gate', () => {
    const bad = allPaths.filter((src) => {
      const file = resolve(PUBLIC_DIR, src.replace(/^\//, ''));
      return !existsSync(file) || statSync(file).size > 150 * 1024 || isPlaceholderProductImage(src);
    });
    expect(bad).toEqual([]);
  });

  it('resolves the cover by id or product and leaves unknown products alone', () => {
    const [id, entry] = entries.find(([, e]) => typeof e === 'string');
    expect(productImageOverride(id)).toBe(entry);
    expect(productImageOverride({ id })).toBe(entry);
    expect(productImageOverride({ id: 'not-a-product' })).toBe('');
    expect(withImageOverride({ id, image: 'x' }).image).toBe(entry);
    const other = { id: 'not-a-product', image: 'x' };
    expect(withImageOverride(other)).toBe(other);
  });

  it('returns the cover for gallery entries and lists it first in the gallery', () => {
    const [id, entry] = entries.find(([, e]) => typeof e !== 'string');
    expect(productImageOverride(id)).toBe(entry.cover);
    expect(productImageOverride({ id })).toBe(entry.cover);
    expect(withImageOverride({ id, image: 'x' }).image).toBe(entry.cover);
    expect(productGallery({ id })).toEqual([entry.cover, ...entry.gallery]);
  });

  it('gallery falls back sensibly', () => {
    const [id, entry] = entries.find(([, e]) => typeof e === 'string');
    expect(productGallery(id)).toEqual([entry]);
    expect(productGallery({ id: 'not-a-product', image: 'https://x/y.jpg' })).toEqual(['https://x/y.jpg']);
    expect(productGallery({ id: 'not-a-product' })).toEqual([]);
    expect(productGallery(null)).toEqual([]);
  });

  it('catalog products carry the override cover as their image', () => {
    const byId = new Map(CATALOG_PRODUCTS.map((p) => [p.id, p]));
    const bad = entries.filter(([id]) => byId.get(id)?.image !== productImageOverride(id));
    expect(bad.map(([id]) => id)).toEqual([]);
  });
});

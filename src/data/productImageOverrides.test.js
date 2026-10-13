// Added on the live site after the packshot passes ran; photos pending.
const PACKSHOT_PENDING = new Set([
  'p-viboos-heating-pad',
  'p-love-wellness-intimate-skin-support',
  'p-kiero-refining-enzyme-cleanser',
  'p-kiero-airy-sun-stick-spf50',
  'p-kiero-comfort-cleansing-balm',
  'p-kiero-prime-sun-gel-spf40',
  'p-kiero-essential-boost-serum',
  'p-kiero-pure-radiant-eye-cream',
  'p-joylux-vfit',
  'p-joylux-vfit-plus',
  'p-joylux-juicy-like-a-peach',
  'p-joylux-lets-spin',
  'p-joylux-reliefher',
  'p-joylux-revitalizher',
  'p-joylux-shebar',
  'p-joylux-ilyeo-body',
  'p-joylux-coldher',
  'p-gina-starter-kit',
  'p-goodbug-gut-balance',
  'p-goodbug-good-to-glow',
  'p-happyhead-hair-growth-supplements',
  'p-magnumsolace-nighttime-magnesium-cream',
  'p-infiniwell-ptd-dbm',
  'p-lilyeve-growturn-ampoule',
  'p-heraure-hermag-magnesium',
  'p-alubri-vaginal-moisturizing-gel',
  'p-alubri-intimate-serum',
  'p-alubri-calming-cream',
  'p-alubri-vulva-balm',
  'p-alubri-vaginal-wellness-kit',
  'p-alubri-rejuvenate-restore-kit',
  'p-vpod-everyday-comfort-single',
  'p-vpod-everyday-comfort-3-pack',
  'p-vpod-elite-single',
  'p-vpod-elite-3-pack',
  'p-surearly-smart-ovulation-test',
  'p-tampontribe-organic-tampons',
  'p-tampontribe-organic-pads',
  'p-tampontribe-pantyliners-bulk-buy',
  'p-tampontribe-reusable-pads',
  'p-tampontribe-teen-pads',
  'p-resa-rhythm-bracelet',
]);

import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_PRODUCTS } from './products.js';
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
    const ids = new Set(ALL_PRODUCTS.map((p) => p.id));
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
    const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
    const bad = entries.filter(([id]) => byId.get(id)?.image !== productImageOverride(id));
    expect(bad.map(([id]) => id)).toEqual([]);
  });
});

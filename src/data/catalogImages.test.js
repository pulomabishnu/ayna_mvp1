import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from './products.js';
import { isPlaceholderProductImage } from '../utils/resolveProductImage.js';

/**
 * Permanent guard against the recurring "hardcoded logo/banner shown as a
 * product photo" bug. The catalog is assembled from 8+ separate files
 * (products.js, mvpProducts.js, productsExtended.js, productsExtended2.js,
 * categoryFillers.js, menstrualProducts.js, brands.js,
 * incontinenceProducts.js) — manually sweeping them one at a time (done
 * twice this session, twice more found afterward: Cora Organic
 * Pads/Tampons and Pink Stork Bloat Support in mvpProducts.js, neither
 * caught by the first sweep) doesn't scale and doesn't stay fixed, because
 * nothing stops the NEXT hardcoded bad image from being added in a future
 * PR to any of these files.
 *
 * This test is the actual fix: it fails the whole suite the moment any
 * product in ALL_PRODUCTS carries a non-empty `image` that
 * isPlaceholderProductImage flags as a logo/icon/banner/SVG rather than a
 * real photo — the exact same check that already gates every live-resolved
 * image, now also applied to 100% of the static catalog, automatically,
 * on every future edit. A genuinely empty image ('') is fine — that
 * product just hasn't had a real photo curated yet and falls back to
 * live resolution or a letter avatar, which is correct, not a bug.
 */
describe('catalog product images', () => {
  it('has no product with a hardcoded logo/icon/banner/SVG masquerading as its photo', () => {
    const offenders = ALL_PRODUCTS.filter((p) => {
      const image = String(p?.image || '').trim();
      if (!image) return false; // empty is fine — not what this test is for
      const allowBrandLogo = p?.type === 'digital';
      return isPlaceholderProductImage(image, allowBrandLogo);
    }).map((p) => ({ id: p.id, name: p.name, brand: p.brand, type: p.type, image: p.image }));

    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });

  it('has no product with an empty-string id or name that would break catalog lookups', () => {
    const broken = ALL_PRODUCTS.filter((p) => !p?.id || !p?.name).map((p) => p?.id || '(no id)');
    expect(broken).toEqual([]);
  });
});

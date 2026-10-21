import { describe, it, expect } from 'vitest';
import { CATALOG_PRODUCTS } from './products.js';
import { OFFICIAL_IMAGE_OVERRIDES, officialImageFor } from './imageOverrides.js';
import { PRODUCT_IMAGE_OVERRIDES, productImageOverride, productGallery, withImageOverride } from './productImageOverrides.js';
import { galleryImages } from '../components/pdp/commerce.js';
import { isPlaceholderProductImage } from '../utils/resolveProductImage.js';

const entries = Object.entries(OFFICIAL_IMAGE_OVERRIDES);
const byId = new Map(CATALOG_PRODUCTS.map((p) => [p.id, p]));

describe('official image overrides', () => {
  it('only maps catalog ids, and never ones that already have a local packshot', () => {
    expect(entries.map(([id]) => id).filter((id) => !byId.has(id))).toEqual([]);
    expect(entries.map(([id]) => id).filter((id) => PRODUCT_IMAGE_OVERRIDES[id])).toEqual([]);
  });

  it('records an https image, alt text, a source and the check date for each', () => {
    const bad = entries.filter(([, e]) => !/^https:\/\//.test(e.src) || !e.alt || !e.source || !/^\d{4}-\d{2}-\d{2}$/.test(e.checkedOn));
    expect(bad.map(([id]) => id)).toEqual([]);
  });

  it('never points at a logo, placeholder or third-party logo site', () => {
    const bad = entries.filter(([id, e]) => /seeklogo|clearbit|xdaimages/i.test(e.src)
      || isPlaceholderProductImage(e.src, byId.get(id)?.type === 'digital'));
    expect(bad.map(([id]) => id)).toEqual([]);
  });

  it('is what cards and the product page gallery show, through the image proxy', () => {
    for (const [id, e] of entries) {
      const shown = productImageOverride(id);
      expect(shown).toBe(`/api/image-proxy?url=${encodeURIComponent(e.src)}`);
      expect(productGallery({ id })).toEqual([shown]);
      expect(galleryImages(byId.get(id))[0]).toBe(shown);
      expect(officialImageFor({ id })).toBe(e);
    }
  });

  it('leaves the team-locked catalog image field alone', () => {
    for (const [id] of entries) expect(withImageOverride(byId.get(id))).toBe(byId.get(id));
  });
});

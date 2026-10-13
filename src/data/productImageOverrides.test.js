import { describe, it, expect } from 'vitest';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_PRODUCTS } from './products.js';
import { PRODUCT_IMAGE_OVERRIDES, productImageOverride, withImageOverride } from './productImageOverrides.js';
import { isPlaceholderProductImage } from '../utils/resolveProductImage.js';

const PUBLIC_DIR = fileURLToPath(new URL('../../public', import.meta.url));

describe('product image overrides', () => {
  const entries = Object.entries(PRODUCT_IMAGE_OVERRIDES);

  it('only maps ids that exist in the catalog', () => {
    const ids = new Set(ALL_PRODUCTS.map((p) => p.id));
    expect(entries.map(([id]) => id).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('points every override at a small local file that passes the photo gate', () => {
    const bad = entries.filter(([, src]) => {
      const file = resolve(PUBLIC_DIR, src.replace(/^\//, ''));
      return !existsSync(file) || statSync(file).size > 150 * 1024 || isPlaceholderProductImage(src);
    });
    expect(bad).toEqual([]);
  });

  it('resolves by id or product and leaves unknown products alone', () => {
    const [id, src] = entries[0];
    expect(productImageOverride(id)).toBe(src);
    expect(productImageOverride({ id })).toBe(src);
    expect(productImageOverride({ id: 'not-a-product' })).toBe('');
    expect(withImageOverride({ id, image: 'x' }).image).toBe(src);
    const other = { id: 'not-a-product', image: 'x' };
    expect(withImageOverride(other)).toBe(other);
  });
});

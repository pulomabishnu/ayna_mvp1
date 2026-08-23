import { describe, it, expect } from 'vitest';
import { isVectorAssetUrl, isRelatedImageHost, isLikelyNonProductImageUrl } from './_ogImageFetch.js';

describe('isVectorAssetUrl', () => {
  it('flags .svg regardless of query string or path segment naming', () => {
    // Real production case: Pure Encapsulations' Shopify catalog resolved
    // to this exact file — the theme's own logo, not a product photo.
    expect(isVectorAssetUrl('https://www.pureencapsulations.com/cdn/shop/files/pure-encapsulations.svg?v=1717404137')).toBe(true);
    expect(isVectorAssetUrl('https://x.com/logo.svg')).toBe(true);
  });

  it('does not flag real raster product photos', () => {
    expect(isVectorAssetUrl('https://x.com/products/cup-regular.jpg')).toBe(false);
    expect(isVectorAssetUrl('https://x.com/products/cup.webp?v=2')).toBe(false);
  });
});

describe('isRelatedImageHost', () => {
  it('accepts an image on the same base domain as the page', () => {
    expect(isRelatedImageHost('https://cdn.brand.com/photo.jpg', 'https://www.brand.com/product')).toBe(true);
  });

  it('accepts an image on a known e-commerce/asset CDN', () => {
    expect(isRelatedImageHost('https://cdn.shopify.com/s/files/1/photo.jpg', 'https://www.brand.com/product')).toBe(true);
  });

  it('rejects an image hosted on a totally unrelated third-party domain', () => {
    // Real production bug: helloclue.com's own og:image meta tag resolved
    // to an asset hosted on zurb.com, a design agency with no connection
    // to Clue at all — almost certainly a stale template default.
    expect(
      isRelatedImageHost(
        'https://zurb.com/packs/media/zurb/img/home/space-circle-office.png',
        'https://helloclue.com/'
      )
    ).toBe(false);
  });
});

describe('isLikelyNonProductImageUrl', () => {
  it('flags known bad-keyword filenames', () => {
    expect(isLikelyNonProductImageUrl('https://x.com/brand-logo.png')).toBe(true);
  });

  it('flags SVGs even with an innocuous filename', () => {
    expect(isLikelyNonProductImageUrl('https://x.com/cdn/shop/files/pure-encapsulations.svg')).toBe(true);
  });

  it('flags explicit tiny-dimension query params', () => {
    expect(isLikelyNonProductImageUrl('https://x.com/icon.png?width=32&height=32')).toBe(true);
  });

  it('accepts a normal product photo URL', () => {
    expect(isLikelyNonProductImageUrl('https://x.com/products/cup-regular.jpg')).toBe(false);
  });

  it('treats an empty/missing URL as not-flagged (handled separately by callers)', () => {
    expect(isLikelyNonProductImageUrl('')).toBe(false);
    expect(isLikelyNonProductImageUrl(undefined)).toBe(false);
  });
});

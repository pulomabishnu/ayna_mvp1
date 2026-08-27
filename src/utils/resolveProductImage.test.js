import { describe, it, expect } from 'vitest';
import { isPlaceholderProductImage, safeProductImageSrc } from './resolveProductImage';

describe('isPlaceholderProductImage', () => {
  it('flags empty/missing values', () => {
    expect(isPlaceholderProductImage('')).toBe(true);
    expect(isPlaceholderProductImage(undefined)).toBe(true);
    expect(isPlaceholderProductImage(null)).toBe(true);
  });

  it('flags the app placeholder sentinels', () => {
    expect(isPlaceholderProductImage('/ayna_placeholder.png')).toBe(true);
    expect(isPlaceholderProductImage('/startup_placeholder.png')).toBe(true);
  });

  it('flags a clearbit logo URL', () => {
    expect(isPlaceholderProductImage('https://logo.clearbit.com/cora.life')).toBe(true);
  });

  it('flags favicons/apple-touch-icons regardless of exact filename shape', () => {
    expect(isPlaceholderProductImage('https://intimina.com/favicon.ico')).toBe(true);
    expect(isPlaceholderProductImage('https://glow.com/favicon-300x300.png')).toBe(true);
    expect(isPlaceholderProductImage('https://nurx.com/favicon/nurx.png')).toBe(true);
    expect(isPlaceholderProductImage('https://libresse.com/apple-touch-icon.png')).toBe(true);
  });

  // Real production bugs, both found live in src/data/mvpProducts.js — a
  // hardcoded catalog `image` field, unlike a live-resolved URL, never goes
  // through the server's resolver at all, so this function is the ONLY
  // thing standing between bad catalog data and the screen.
  it('flags a hardcoded brand-logo image (Cora Organic Pads/Tampons)', () => {
    expect(
      isPlaceholderProductImage(
        'https://cdn.shopify.com/s/files/1/0940/5060/files/Logo_33a7614e-134f-4af3-9075-b4ac69ca81a0.png?height=628&pad_color=fefaf8&v=1646873247&width=1200'
      )
    ).toBe(true);
  });

  it('flags a hardcoded SVG brand logo (Pink Stork Bloat Support)', () => {
    expect(
      isPlaceholderProductImage(
        'https://pinkstork.com/cdn/shop/files/PINKSTORK_Logo_crop_90482267-d058-40f5-984c-73335bc42249.svg?v=1756906426'
      )
    ).toBe(true);
  });

  // "hero" is deliberately NOT a flagged keyword — "hero shot"/"hero image"
  // is standard product-photography terminology. Confirmed live: Elvie
  // Pelvic Floor Trainer's real studio photo is literally named
  // "..._Web_Hero_1200x1200...", and Stayfree's real package photo is
  // "1_Hero_...". Flagging "hero" would reject genuine product photos.
  it('does not flag a real product photo whose filename happens to contain "hero" or "silicone"', () => {
    expect(isPlaceholderProductImage('https://cdn.shopify.com/files/IMD_UK_Trainer_Web_Hero_1200x1200_V2.jpg')).toBe(false);
    expect(isPlaceholderProductImage('https://cdn.shopify.com/files/1_Hero_a48c1149.jpg')).toBe(false);
    expect(isPlaceholderProductImage('https://cdn.shopify.com/files/Hello_Caddy_silicone_storage_case.png')).toBe(false);
  });

  it('does not flag a real photo with a promotional callout baked into its own filename (not a standalone badge asset)', () => {
    expect(isPlaceholderProductImage('https://thehoneypot.co/cdn/shop/files/SensitiveWashMother-MOBadge-Nude.jpg')).toBe(false);
  });

  it('flags a social-share banner and an og:default asset', () => {
    expect(isPlaceholderProductImage('https://brand.com/social-share-banner.png')).toBe(true);
    expect(isPlaceholderProductImage('https://brand.com/og-default.jpg')).toBe(true);
  });

  it('does not flag a real product photo', () => {
    expect(isPlaceholderProductImage('https://cdn.shopify.com/s/files/1/0839/0671/files/3_month.jpg?v=1762457618')).toBe(false);
    expect(isPlaceholderProductImage('https://m.media-amazon.com/images/I/61-qjpBT8oL.jpg')).toBe(false);
  });

  describe('allowBrandLogo (digital products — apps/telehealth, no physical form)', () => {
    it('accepts a brand-logo/hero/icon image when allowed', () => {
      expect(isPlaceholderProductImage('https://brand.com/uploads/Meta_Hero_1500x1000.jpg', true)).toBe(false);
      expect(isPlaceholderProductImage('https://brand.com/icon-512.png', true)).toBe(false);
      expect(isPlaceholderProductImage('https://brand.com/logo.svg', true)).toBe(false);
    });

    it('still rejects a bare favicon — too small/generic even as a logo', () => {
      expect(isPlaceholderProductImage('https://brand.com/favicon.ico', true)).toBe(true);
    });

    it('still rejects empty/placeholder-sentinel values', () => {
      expect(isPlaceholderProductImage('', true)).toBe(true);
      expect(isPlaceholderProductImage('/ayna_placeholder.png', true)).toBe(true);
    });
  });
});

describe('safeProductImageSrc', () => {
  it('returns empty string for a placeholder-flagged value', () => {
    expect(safeProductImageSrc('https://brand.com/logo.png')).toBe('');
  });

  it('returns the URL as-is for a real photo', () => {
    expect(safeProductImageSrc('https://m.media-amazon.com/images/I/61-qjpBT8oL.jpg')).toBe(
      'https://m.media-amazon.com/images/I/61-qjpBT8oL.jpg'
    );
  });

  it('forwards allowBrandLogo through to isPlaceholderProductImage', () => {
    expect(safeProductImageSrc('https://brand.com/logo.png', true)).toBe('https://brand.com/logo.png');
  });
});

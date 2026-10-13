import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../../data/products.js';
import { buildGlance, NOT_ON_FILE, perUnitLabel, sizeCount } from './glance.js';
import { galleryImages, compareRows, offerPrice, productJsonLd, similarProducts, retailerLinks } from './commerce.js';

const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
const allText = (g) => JSON.stringify(g);

describe('buildGlance', () => {
  it('builds every catalog product without throwing, and never uses em dashes', () => {
    for (const p of ALL_PRODUCTS) {
      const g = buildGlance(p, {});
      expect(g).toBeTruthy();
      expect(allText(g)).not.toContain('—');
    }
  });

  it('numbers sources once, and every [n] it cites exists', () => {
    for (const p of ALL_PRODUCTS) {
      const g = buildGlance(p, {});
      const ns = g.sources.map((s) => s.n);
      expect(ns).toEqual(ns.map((_, i) => i + 1));
      g.sections.forEach((s) => s.blocks.forEach((b) => (b.refs || []).forEach((n) => expect(ns).toContain(n))));
    }
  });

  it('says "Not on file" instead of guessing', () => {
    const g = buildGlance(byId('p-cora-organic-pads'), {});
    expect(g.facts.find((f) => f.id === 'fsa').value).toBe(NOT_ON_FILE);
    expect(g.sections.find((s) => s.id === 'unknown')).toBeTruthy();
  });

  it('never shows a rating without real ayna member ratings', () => {
    // The live catalog now nulls unsourced userRating numbers itself, so the
    // unsourced case is pinned with a synthetic product.
    const p = { ...byId('p-vitex'), userRating: 4.4 };
    expect(allText(buildGlance(p, {}))).not.toContain('"type":"rating"');
    const g = buildGlance(p, { aynaData: { ratings: [4, 5], reviews: [] }, aynaRating: 4.5 });
    expect(allText(g)).toContain('"type":"rating"');
  });

  it('labels community copy and manufacturer claims', () => {
    const g = buildGlance(byId('p-cora-organic-pads'), {});
    expect(allText(g.sections.find((s) => s.id === 'people'))).toContain('Not verified');
    expect(g.sections.find((s) => s.id === 'brand').blocks[0].label).toMatch(/not independently checked/);
  });

  it('works out size and per-unit price from the listed price only', () => {
    expect(sizeCount(byId('p-vitex')).text).toMatch(/^60 capsules/);
    expect(perUnitLabel(byId('p-vitex'))).toBe('$0.30 per capsule');
    expect(perUnitLabel(byId('d-midi-health'))).toBe('');
  });
});

describe('commerce', () => {
  it('gallery puts the cover first and accepts { cover, gallery }', () => {
    const p = byId('p-cora-organic-pads');
    expect(galleryImages(p)[0]).toBe(p.image);
    expect(galleryImages({ id: 'x', image: '/a.webp', gallery: ['/b.webp', { src: '/a.webp' }, '/c.webp'] })).toEqual(['/a.webp', '/b.webp', '/c.webp']);
  });

  it('compare rows use real fields and drop all-unknown rows', () => {
    // Cora moved to retailer variant pricing, so pin the price row with a
    // product that still states a plain price.
    const p = { ...byId('p-cora-organic-pads'), price: '$10 for 32' };
    const rows = compareRows([p, ...similarProducts(p)]);
    expect(rows.find((r) => r.label === 'Price').values[0]).toBe('$10 for 32');
    rows.forEach((r) => expect(r.values.every((v) => v === NOT_ON_FILE)).toBe(false));
  });

  it('JSON-LD has no rating unless real ratings exist, and offers only for a plain price', () => {
    const p = { ...byId('p-cora-organic-pads'), price: '$10 for 32' };
    const ld = productJsonLd(p, { buyUrl: 'https://cora.life/products/pads' });
    expect(ld['@type']).toBe('Product');
    expect(ld.aggregateRating).toBeUndefined();
    expect(ld.offers.price).toBe('10.00');
    expect(offerPrice({ price: '$29-49/month' })).toBeNull();
    expect(offerPrice({ price: 'From $70' })).toBeNull();
  });

  it('retailer links skip search pages and the main buy host', () => {
    const p = { whereToBuyLinks: { Amazon: 'https://www.amazon.com/s?k=pads', Target: 'https://www.target.com/p/x', Brand: 'https://brand.com/p' } };
    expect(retailerLinks(p, 'https://brand.com/p').map((r) => r.name)).toEqual(['Target']);
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products';
import { applyCatalogCorrections } from '../data/catalogCorrections';
import { getAmazonAffiliateUrlForProduct } from '../data/productAffiliateUrls';
import { isPartnerBrandItem } from './partnerBrands';
import { isAmazonUrl, resolveBuyUrl } from './buyLink';

const catalog = ALL_PRODUCTS.map(applyCatalogCorrections);
const partners = catalog.filter(isPartnerBrandItem);
const onAmazon = catalog.filter((p) => !isPartnerBrandItem(p) && getAmazonAffiliateUrlForProduct(p));
const byId = Object.fromEntries(catalog.map((p) => [p.id, p]));

describe('Buy Now destinations', () => {
  it('sends every non-partner in the Amazon catalog to the tagged Amazon listing', () => {
    expect(onAmazon.length).toBeGreaterThan(100);
    for (const product of onAmazon) {
      const options = [null, ...(product.variants || [])];
      for (const variant of options) {
        const url = resolveBuyUrl(product, variant);
        expect(url, product.id).toMatch(/^https:\/\/www\.amazon\.com\/dp\/[A-Z0-9]{10}\?tag=aynahealth-20$/);
      }
    }
  });

  it('never sends a brand partner to Amazon', () => {
    expect(partners.length).toBeGreaterThan(20);
    for (const product of partners) {
      for (const variant of [null, ...(product.variants || [])]) {
        const url = resolveBuyUrl(product, variant);
        expect(url, product.id).toBeTruthy();
        expect(isAmazonUrl(url), `${product.id} -> ${url}`).toBe(false);
        expect(url).not.toContain('aynahealth-20');
      }
    }
  });

  it('uses the partner affiliate link instead of the plain brand page', () => {
    expect(resolveBuyUrl(byId['p-neycher-vaginal-moisturizer'])).toContain('sca_ref=');
    expect(resolveBuyUrl(byId['p-proov-complete'])).toBe('https://proov.pxf.io/9VjJQj');
    expect(resolveBuyUrl(byId['p-vio2-mouth-tape'])).toBe('https://go.shopmy.us/p-83948920');
    expect(resolveBuyUrl(byId['p-elitone'])).toContain('af=aynahealth');
    expect(resolveBuyUrl(byId['d-connect-pelvic-floor-fitness'])).toBe('https://goto.connectpelvicfloorfitness.com/YVk7WO');
  });

  it('keeps partner tracking on an exact size link when the program allows it', () => {
    const lim = byId['p-lim-method-bundle'];
    const url = resolveBuyUrl(lim, lim.variants[0]);
    expect(url).toContain('ref=Ayna_Health');
    expect(url).toContain(`variant=${lim.variants[0].id}`);
  });

  it('sends BUNI (a partner whose old link was an Amazon short link) to BUNI', () => {
    expect(resolveBuyUrl(byId['p-buni-bundle'])).toMatch(/^https:\/\/www\.bunibody\.com\//);
  });

  it('keeps the affiliate link for products renamed by catalog corrections', () => {
    expect(resolveBuyUrl(byId['p-magnesium-glycinate'])).toBe('https://www.amazon.com/dp/B086RQVNDV?tag=aynahealth-20');
    expect(resolveBuyUrl(byId['p-rael-organic-pad'])).toBe('https://www.amazon.com/dp/B071VBZLPX?tag=aynahealth-20');
  });

  it('uses an exact per-size ASIN when one is supplied', () => {
    const product = { id: 'x', name: 'Cora Organic Pads' };
    expect(resolveBuyUrl(product, { id: 'v', amazonAsin: 'B000000001' })).toBe('https://www.amazon.com/dp/B000000001?tag=aynahealth-20');
  });

  it('falls back to the brand page when Amazon does not carry the product for Ayna', () => {
    expect(resolveBuyUrl(byId['p-oboo-nook'])).toMatch(/^https:\/\/oboo\.love\//);
  });

  // Regression coverage for a real bug found 2026-09-27: products with
  // genuinely different models/sizes (not just cosmetic color options) were
  // all resolving to the SAME Amazon ASIN, so choosing a different size sent
  // the person to the wrong product. Each ASIN below was confirmed on the
  // live Amazon listing before being added.
  it('sends each DivaCup model to its own model-specific Amazon listing', () => {
    const diva = byId['p-diva-cup'];
    const byLabel = Object.fromEntries(diva.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(diva, byLabel['Model 0'])).toBe('https://www.amazon.com/dp/B08TLT6BF7?tag=aynahealth-20');
    expect(resolveBuyUrl(diva, byLabel['Model 1'])).toBe('https://www.amazon.com/dp/B08TLJPR71?tag=aynahealth-20');
    expect(resolveBuyUrl(diva, byLabel['Model 2'])).toBe('https://www.amazon.com/dp/B08TLMWZB4?tag=aynahealth-20');
  });

  it('sends each Lunette flow size to its own Amazon listing', () => {
    const lunette = byId['p-lunette-cup'];
    const [size1, size2] = lunette.variants;
    expect(resolveBuyUrl(lunette, size1)).toBe('https://www.amazon.com/dp/B002MA4SI6?tag=aynahealth-20');
    expect(resolveBuyUrl(lunette, size2)).toBe('https://www.amazon.com/dp/B0054SQ02K?tag=aynahealth-20');
    expect(resolveBuyUrl(lunette, size1)).not.toBe(resolveBuyUrl(lunette, size2));
  });

  it('sends each OrganiCup size to its own Amazon listing', () => {
    const cup = byId['p-organicup'];
    const byLabel = Object.fromEntries(cup.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(cup, byLabel['A'])).toBe('https://www.amazon.com/dp/B071NCXFMG?tag=aynahealth-20');
    expect(resolveBuyUrl(cup, byLabel['B'])).toBe('https://www.amazon.com/dp/B072KZM9P3?tag=aynahealth-20');
    expect(resolveBuyUrl(cup, byLabel['Mini'])).toBe('https://www.amazon.com/dp/B07SC244TV?tag=aynahealth-20');
  });

  it('sends each Flex Cup size to its own Amazon listing', () => {
    const cup = byId['p-flex-cup'];
    const [size01, size02] = cup.variants;
    expect(resolveBuyUrl(cup, size01)).toBe('https://www.amazon.com/dp/B07QD4W7RQ?tag=aynahealth-20');
    expect(resolveBuyUrl(cup, size02)).toBe('https://www.amazon.com/dp/B07QHG6ZY8?tag=aynahealth-20');
  });

  it('sends each Saalt Disc size to its own Amazon listing', () => {
    const disc = byId['p-saalt-disc'];
    const [regular, small] = disc.variants;
    expect(resolveBuyUrl(disc, regular)).toBe('https://www.amazon.com/dp/B0B13WT3KV?tag=aynahealth-20');
    expect(resolveBuyUrl(disc, small)).toBe('https://www.amazon.com/dp/B0B13XG62P?tag=aynahealth-20');
  });
});

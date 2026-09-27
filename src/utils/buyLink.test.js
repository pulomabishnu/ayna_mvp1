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
});

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
        if (variant && ['p-cora-organic-pads', 'p-cora-overnight'].includes(product.id)) continue;
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

  it('adds the BUNI ref code even when the live row still has the old Amazon link', () => {
    const liveRow = {
      id: 'p-buni-bundle',
      name: 'BUNI Bundle',
      brand: 'BUNI',
      url: 'https://www.bunibody.com/products/buni-bundle',
      affiliateUrl: 'https://amzn.to/4xSUqDt',
    };
    expect(resolveBuyUrl(liveRow)).toBe('https://www.bunibody.com/products/buni-bundle?ref=oxaevspm');
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

  it('uses exact retailer pages for Cora pad packs with unverified Amazon IDs', () => {
    const pads = byId['p-cora-organic-pads'];
    const byLabel = Object.fromEntries(pads.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(pads, byLabel['Regular — 32 count'])).toBe('https://www.target.com/p/-/A-76155164');
    expect(resolveBuyUrl(pads, byLabel['Super — 30 count'])).toBe('https://www.target.com/p/-/A-90569336');
    expect(resolveBuyUrl(pads, byLabel['Overnight — 28 count'])).toBe('https://www.target.com/p/-/A-76155166');
    expect(resolveBuyUrl(pads, byLabel['Extra Heavy Overnight — 20 count'])).toBe('https://www.target.com/p/-/A-93261793');
    const overnight = byId['p-cora-overnight'];
    expect(resolveBuyUrl(overnight, overnight.variants[2])).toBe('https://www.target.com/p/-/A-76155166');

    const tampons = byId['p-cora-organic-tampons'];
    const tByLabel = Object.fromEntries(tampons.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(tampons, tByLabel['Regular — 32 count'])).toBe('https://www.amazon.com/dp/B06XKF4RMW?tag=aynahealth-20');
    expect(resolveBuyUrl(tampons, tByLabel['Regular / Super — 32 count'])).toBe('https://www.amazon.com/dp/B06ZYRXLNV?tag=aynahealth-20');
    expect(resolveBuyUrl(tampons, tByLabel['Light / Regular — 32 count'])).toBe('https://www.amazon.com/dp/B0742LBKKS?tag=aynahealth-20');
  });

  it('never sends Good Kitty to Amazon (no real Amazon listing exists for it)', () => {
    // Regression: this used to be mapped to ASIN B0G6BS41SZ, which is
    // actually a different brand's product (Uqora Flush) — a wrong-brand
    // link, not just a wrong-size one. Confirmed 2026-09-27 that Good Kitty
    // has no Amazon listing at all, so it must fall back to its own site.
    const url = resolveBuyUrl(byId['p-good-kitty-uti-biome-shield']);
    expect(isAmazonUrl(url)).toBe(false);
    expect(url).toBe('https://goodkittyco.com/products/uti-biome-shield');
  });

  it('never sends Ruby Cup to Amazon (no real Amazon listing exists for it)', () => {
    // Regression: this used to be mapped to ASIN B07RHQ8W82, which is
    // actually a Saalt Soft Menstrual Cup — a wrong-brand link. Confirmed
    // 2026-09-27 that Ruby Cup has no real Amazon listing (search results
    // only surface "shop other stores directly" links to rubycup.com), so
    // it must fall back to the brand's own site.
    const url = resolveBuyUrl(byId['p-ruby-cup']);
    expect(isAmazonUrl(url)).toBe(false);
    expect(url).toBe('https://rubycup.com/products/menstrual-cup');
  });

  it('sends Rael liners to the correct absorbency line on Amazon, not Micro Thin', () => {
    // Regression: this used to be mapped to ASIN B08B7X49FP, which is
    // Rael's "Micro Thin" liners — a different, separate product line from
    // our "Regular Unscented" liners. Fixed to the closest correct-line ASIN.
    const url = resolveBuyUrl(byId['p-rael-liners']);
    expect(url).toBe('https://www.amazon.com/dp/B07258JQ9M?tag=aynahealth-20');
  });

  it('sends each Belly Bandit color/size combination to its own Amazon listing', () => {
    const bb = byId['p-belly-bandit'];
    const byLabel = Object.fromEntries(bb.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(bb, byLabel['Cream / S'])).toBe('https://www.amazon.com/dp/B005XNCE12?tag=aynahealth-20');
    expect(resolveBuyUrl(bb, byLabel['Cream / M'])).toBe('https://www.amazon.com/dp/B005XNCFKW?tag=aynahealth-20');
    expect(resolveBuyUrl(bb, byLabel['Cream / L'])).toBe('https://www.amazon.com/dp/B005XNCH3W?tag=aynahealth-20');
    expect(resolveBuyUrl(bb, byLabel['Cream / XL'])).toBe('https://www.amazon.com/dp/B00EO7LSS8?tag=aynahealth-20');
    expect(resolveBuyUrl(bb, byLabel['Black / S'])).toBe('https://www.amazon.com/dp/B009EEWGVO?tag=aynahealth-20');
    expect(resolveBuyUrl(bb, byLabel['Black / M'])).toBe('https://www.amazon.com/dp/B009EEWJSE?tag=aynahealth-20');
    expect(resolveBuyUrl(bb, byLabel['Black / L'])).toBe('https://www.amazon.com/dp/B009EEWI7Q?tag=aynahealth-20');
    expect(resolveBuyUrl(bb, byLabel['Black / XL'])).toBe('https://www.amazon.com/dp/B00LMIER30?tag=aynahealth-20');
  });

  it('sends each Silverette nursing cup size/O-Feel combination to its own Amazon listing', () => {
    const sv = byId['p-silverette-cups'];
    const byLabel = Object.fromEntries(sv.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(sv, byLabel['S / No O Feel'])).toBe('https://www.amazon.com/dp/B00D4MWKNQ?tag=aynahealth-20');
    expect(resolveBuyUrl(sv, byLabel['M / No O Feel'])).toBe('https://www.amazon.com/dp/B07XGC8RBB?tag=aynahealth-20');
    expect(resolveBuyUrl(sv, byLabel['L / No O Feel'])).toBe('https://www.amazon.com/dp/B0FTGGL64M?tag=aynahealth-20');
  });

  it('sends each Lena Cup color/size combination to its own Amazon listing', () => {
    const lena = byId['p-lena-cup'];
    const byLabel = Object.fromEntries(lena.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(lena, byLabel['Pink / Small'])).toBe('https://www.amazon.com/dp/B00YNYH8F4?tag=aynahealth-20');
    expect(resolveBuyUrl(lena, byLabel['Purple / Large'])).toBe('https://www.amazon.com/dp/B01JWMWSII?tag=aynahealth-20');
    expect(resolveBuyUrl(lena, byLabel['Turquoise / Small'])).toBe('https://www.amazon.com/dp/B01FV0N9BK?tag=aynahealth-20');
    expect(resolveBuyUrl(lena, byLabel['Gray / Large'])).toBe('https://www.amazon.com/dp/B08HW1VFFZ?tag=aynahealth-20');
  });

  it('sends each Hello Disc color to its own Amazon listing', () => {
    const disc = byId['p-hello-disc'];
    const byLabel = Object.fromEntries(disc.variants.map((v) => [v.label, v]));
    expect(resolveBuyUrl(disc, byLabel['Bubblegum'])).toBe('https://www.amazon.com/dp/B0GCBHWY24?tag=aynahealth-20');
    expect(resolveBuyUrl(disc, byLabel['Black'])).toBe('https://www.amazon.com/dp/B0GKBK3FS9?tag=aynahealth-20');
  });

  // Regression coverage for a real bug found 2026-09-27: standardBuyUrl's
  // fallback candidate list (product.url, product.buyUrl, whereToBuyLinks,
  // etc.) does not filter out Amazon URLs, so a product whose name/id isn't
  // in AMAZON_ROWS but happens to carry a raw Amazon link in one of those
  // fields (the 8 o.b. tampon SKUs used bare `amzn.to` short links) can send
  // a real customer to Amazon with NO affiliate tag at all — silent lost
  // revenue that the "sends every non-partner in the Amazon catalog..." test
  // above never catches, because it only iterates products that already
  // resolve through getAmazonAffiliateUrlForProduct. This test instead walks
  // every non-partner product/variant's resolved Buy Now URL and fails if
  // ANY of them is an Amazon URL missing the tag, regardless of which code
  // path produced it.
  it('never sends anyone to Amazon without the affiliate tag, for any product or variant', () => {
    for (const product of catalog) {
      if (isPartnerBrandItem(product)) continue;
      for (const variant of [null, ...(product.variants || [])]) {
        const url = resolveBuyUrl(product, variant);
        if (url && isAmazonUrl(url)) {
          expect(url, `${product.id}${variant ? ' / ' + variant.label : ''} -> ${url}`).toContain('tag=aynahealth-20');
        }
      }
    }
  });

  it('sends every o.b. tampon SKU to its own tagged Amazon listing (not a bare amzn.to short link)', () => {
    // Regression: these used to store `amzn.to/...` short links directly.
    // They happened to redirect to a tagged URL, but as bare short links
    // they were invisible to static/catalog-wide checks and one hop from
    // breaking silently if the short link ever expired or was recreated
    // without the tag. Replaced with the real expanded, verified, tagged URL.
    const cases = [
      ['p-ob-original-multipack-40', 'B00NJNJ6WI'],
      ['p-ob-original-ultra-40', 'B00NJNJGUA'],
      ['p-ob-original-regular-40', 'B00NJNJCI6'],
      ['p-ob-original-super-plus-40', 'B00NJNJCBI'],
      ['p-ob-original-super-40', 'B00NF8A8YM'],
      ['p-ob-original-multipack-80', 'B0D14X9YFR'],
      ['p-ob-procomfort-mini-32', 'B071VD5LF7'],
      ['p-ob-procomfort-mini-16', 'B07L7RL3X3'],
    ];
    for (const [id, asin] of cases) {
      const url = resolveBuyUrl(byId[id]);
      expect(url, id).toBe(`https://www.amazon.com/dp/${asin}?tag=aynahealth-20`);
    }
  });
});

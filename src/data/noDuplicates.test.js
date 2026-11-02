import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, CATALOG_PRODUCTS } from './products.js';

// Founder, Nov 2: a product already in the catalog is never added twice; the
// same product in another size or color is a variant (productVariants.js), not
// a new entry. Shown products must not repeat by id or by brand + name.
const norm = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();

describe('catalog has no duplicate products', () => {
  it('every id is unique', () => {
    const seen = new Map();
    const dups = [];
    for (const p of CATALOG_PRODUCTS) {
      if (seen.has(p.id)) dups.push(p.id);
      seen.set(p.id, true);
    }
    expect(dups).toEqual([]);
  });

  it('no two shown products share the same name', () => {
    const seen = new Map();
    const dups = [];
    for (const p of ALL_PRODUCTS) {
      const key = norm(p.name);
      if (!key) continue;
      if (seen.has(key)) dups.push(`${seen.get(key)} = ${p.id} (${p.name})`);
      else seen.set(key, p.id);
    }
    expect(dups).toEqual([]);
  });
});

import { getAmazonAffiliateUrlForProduct } from './productAffiliateUrls.js';
import { PRODUCT_VARIANTS } from './productVariants.js';

describe('one Amazon listing is one product', () => {
  it('no two shown products send Buy to the same Amazon listing', () => {
    const seen = new Map();
    const dups = [];
    for (const p of ALL_PRODUCTS) {
      const asin = (getAmazonAffiliateUrlForProduct(p) || '').match(/\/dp\/([A-Z0-9]{10})/)?.[1];
      if (!asin) continue;
      if (seen.has(asin)) dups.push(`${asin}: ${seen.get(asin)} = ${p.id}`);
      else seen.set(asin, p.id);
    }
    expect(dups).toEqual([]);
  });

  it('a variant ASIN belongs to one product only', () => {
    const seen = new Map();
    const dups = [];
    for (const [id, fam] of Object.entries(PRODUCT_VARIANTS)) {
      for (const v of fam.variants || []) {
        if (!v.amazonAsin) continue;
        const owner = seen.get(v.amazonAsin);
        if (owner && owner !== id) dups.push(`${v.amazonAsin}: ${owner} = ${id}`);
        else seen.set(v.amazonAsin, id);
      }
    }
    expect(dups).toEqual([]);
  });
});


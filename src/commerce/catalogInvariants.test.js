/**
 * Catalog-wide commerce checks, run against the live catalog snapshot taken
 * for the 2026-10-15 audit (docs/commerce/audit). If the catalog changes,
 * refresh the snapshot and rerun.
 */
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyCatalogCorrections } from '../data/catalogCorrections.js';
import { isPartnerBrandItem } from '../utils/partnerBrands.js';
import { resolveCommerce, SELECTION_REASONS } from './router.js';
import { isCleanAmazonSpecialLink } from './amazon.js';
import { capabilitiesFor } from './policy.js';
import { COMMERCE_VERIFIED_OFFERS } from '../data/commerceVerifiedOffers.js';

const snapshot = JSON.parse(fs.readFileSync(new URL('../../docs/commerce/audit/live_catalog_commerce_fields_2026-10-15.json', import.meta.url), 'utf8'));
const catalog = snapshot.products.map(applyCatalogCorrections);

describe('live catalog commerce invariants', () => {
  it('covers the whole live catalog', () => {
    expect(catalog.length).toBe(snapshot.count);
  });

  it('partners never route to Amazon; non-partners follow Amazon-exact > brand site', () => {
    for (const p of catalog) {
      for (const v of [null, ...(p.variants || [])]) {
        const r = resolveCommerce(p, v);
        if (isPartnerBrandItem(p)) {
          expect(r.amazon, p.id).toBeNull();
          if (r.destinationUrl) expect(r.selectionReason, p.id).toBe(SELECTION_REASONS.PARTNER_ROUTE_PRIORITY);
        } else if (r.amazon) {
          expect(r.selectionReason, p.id).toBe(SELECTION_REASONS.NONPARTNER_AMAZON_EXACT_MATCH);
          // A chosen size only goes to Amazon with its own child ASIN.
          if (v) expect(r.amazon.asin, `${p.id} ${v.label}`).toBe(String(v.amazonAsin || '').toUpperCase());
        }
      }
    }
  });

  it('every Amazon destination is a clean tagged link with no per-user data', () => {
    for (const p of catalog) {
      for (const v of [null, ...(p.variants || [])]) {
        const r = resolveCommerce(p, v);
        if (r.amazon) expect(isCleanAmazonSpecialLink(r.destinationUrl), `${p.id} ${r.destinationUrl}`).toBe(true);
      }
    }
  });

  it('no Amazon price is shown anywhere, and no Amazon offer can be checked out by ayna', () => {
    for (const p of catalog) {
      for (const v of [null, ...(p.variants || [])]) {
        const r = resolveCommerce(p, v);
        if (!r.amazon) continue;
        expect(r.priceDisplay.show, p.id).toBe(false);
        expect(capabilitiesFor({ provider: r.provider, destinationUrl: r.destinationUrl }).managedCheckout).toBe(false);
      }
    }
  });

  it('every shown price belongs to the merchant the button opens and was verified there', () => {
    for (const p of catalog) {
      for (const v of [null, ...(p.variants || [])]) {
        const r = resolveCommerce(p, v);
        if (!r.priceDisplay.show) continue;
        const host = new URL(r.destinationUrl).hostname.replace(/^www\./, '');
        const facts = COMMERCE_VERIFIED_OFFERS[p.id];
        expect(facts, p.id).toBeTruthy();
        expect(['merchant_feed', 'manual_verification']).toContain(r.price.source);
        if (!['shopmy', 'shopify_collabs', 'impact'].includes(r.provider)) expect(facts.hosts, `${p.id} ${host}`).toContain(host);
      }
    }
  });

  it('no verified offer data carries an Amazon host', () => {
    for (const [id, o] of Object.entries(COMMERCE_VERIFIED_OFFERS)) {
      for (const h of o.hosts) expect(/amazon\.|amzn\.|^a\.co$/.test(h), `${id} ${h}`).toBe(false);
    }
  });
});

describe('Amazon listings confirmed wrong or unavailable (Chrome check 2026-10-15)', () => {
  it('never route to a blocked ASIN, for the product or any option', async () => {
    const { isBlockedAmazon } = await import('../data/amazonAsinBlocks.js');
    for (const p of catalog) {
      for (const v of [null, ...(p.variants || [])]) {
        const r = resolveCommerce(p, v);
        if (r.amazon) expect(isBlockedAmazon(r.amazon.asin, { productLevel: !v }), `${p.id} ${v?.label || ''} ${r.amazon.asin}`).toBe(false);
      }
    }
  });

  it('Belly Bandit sizes keep their exact child ASINs after the wrong-brand listing is blocked', () => {
    const p = catalog.find((x) => x.id === 'p-belly-bandit');
    expect(resolveCommerce(p, null).amazon).toBeNull();
    expect(resolveCommerce(p, null).selectionReason).toBe(SELECTION_REASONS.AMAZON_NOT_AVAILABLE);
    const small = p.variants.find((v) => v.label === 'Cream / S');
    expect(resolveCommerce(p, small).amazon.asin).toBe('B005XNCE12');
  });
});

describe('exact means exact (Amazon follow-up 2026-10-15)', () => {
  it('never sends anyone to an Amazon search or store page', () => {
    for (const p of catalog) {
      for (const v of [null, ...(p.variants || [])]) {
        const r = resolveCommerce(p, v);
        if (r.destinationUrl && /amazon\./.test(r.destinationUrl)) expect(r.destinationUrl, `${p.id} ${v?.label || ''}`).toMatch(/\/dp\/[A-Z0-9]{10}\?tag=aynahealth-20$/);
      }
    }
  });

  it('a product with sizes never sends a no-size click to one pinned size on Amazon', async () => {
    const { AMAZON_ASIN_BLOCKS } = await import('../data/amazonAsinBlocks.js');
    for (const id of ['p-boppy-pillow', 'p-lumma-disc', 'p-estroven-mood', 'p-rael-liners', 'p-rael-organic-pad']) {
      const p = catalog.find((x) => x.id === id);
      const r = resolveCommerce(p, null);
      if (r.amazon) expect(AMAZON_ASIN_BLOCKS[r.amazon.asin], id).toBeUndefined();
    }
  });

  it('confirmed per-option listings route to their own ASIN', () => {
    const cases = [['p-lumma-disc', 'High / Clear', 'B07Y5K7ZVJ'], ['p-boppy-pillow', 'Soft Pink Daisies', 'B0GV16DDD9'], ['p-saalt-cup', 'Ocean Blue / Small', 'B079DX4242'], ['p-diva-cup', 'Model 0', 'B07KGZ9NMV'], ['p-rael-liners', '60 Count', 'B071YSFXMN']];
    for (const [id, label, asin] of cases) {
      const p = catalog.find((x) => x.id === id);
      const v = p.variants.find((x) => x.label === label);
      expect(resolveCommerce(p, v).amazon?.asin, `${id} ${label}`).toBe(asin);
    }
  });

  it('bundles, other flavours and Target-only counts go to the exact brand or retailer option', () => {
    const cases = [['p-diva-cup', 'Model 1'], ['p-flex-cup', 'Size 01'], ['p-rituals-prenatal', 'Mint'], ['p-cora-organic-tampons', 'Regular — 32 count'], ['p-saalt-cup', 'Seafoam Green / Small']];
    for (const [id, label] of cases) {
      const p = catalog.find((x) => x.id === id);
      const v = p.variants.find((x) => x.label === label);
      const r = resolveCommerce(p, v);
      expect(r.amazon, `${id} ${label}`).toBeNull();
      expect(r.destinationUrl, `${id} ${label}`).toBe(String(v.url).trim());
    }
  });

  it('product-level listings confirmed for the exact count are used', () => {
    for (const [id, asin] of [['p-cranberry-supplement', 'B0012JY42I'], ['p-magnesium-glycinate', 'B08XXHCGZT'], ['p-natures-bounty-d3-125mcg', 'B002Y27LLS'], ['p-d-mannose-now', 'B0C545MBRC'], ['p-l-pad', 'B0FQPVVD1S'], ['p-remifemin', 'B0CRKXS5LJ'], ['p-tena-intimates-very-light-liner', 'B08D74XH82']]) {
      expect(resolveCommerce(catalog.find((x) => x.id === id), null).amazon?.asin, id).toBe(asin);
    }
  });
});

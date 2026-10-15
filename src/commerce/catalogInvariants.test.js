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

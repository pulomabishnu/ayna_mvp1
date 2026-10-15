import { describe, expect, it } from 'vitest';
import { capabilitiesFor, assertManagedCheckoutAllowed, providerForUrl, PROVIDERS } from './policy.js';
import { resolveCommerce, commerceCardPrice, SELECTION_REASONS } from './router.js';
import { priceLabelFor, priceFreshness, PRICE_SOURCES } from './freshness.js';
import { amazonSpecialLink, isCleanAmazonSpecialLink, asinFromUrl, amazonVerification, AMAZON_STATUS } from './amazon.js';
import { bagLineFromRouted, groupBag, revalidateLine, CHECKOUT_GROUPS, remainingExternalItems } from './cart.js';
import { validateMarkPlaced, authorizationUrgency, sortFulfillmentQueue, canTransitionFulfillment, FULFILLMENT_STATUS, PLACEMENT_CHECKLIST } from './orders.js';
import { commerceEventProps } from './analytics.js';

const NOW = Date.parse('2026-10-15T12:00:00Z');
const fresh = new Date(NOW - 3600 * 1000).toISOString();

// A non-partner product sold on Amazon (via affiliateUrl) and on its brand site,
// with two sizes: 30-count has a child ASIN, 60-count exists only on the brand site.
const product = {
  id: 'p-test-magnesium',
  name: 'Testbrand Magnesium Gummies',
  brand: 'Testbrand',
  type: 'physical',
  category: 'supplement',
  price: '$19.99',
  affiliateUrl: 'https://www.amazon.com/dp/B0TEST0001?tag=aynahealth-20',
  url: 'https://testbrand.com/products/magnesium',
  variants: [
    { id: 'v30', label: '30 count', url: 'https://testbrand.com/products/magnesium?variant=v30', amazonAsin: 'B0TEST0030' },
    { id: 'v60', label: '60 count', url: 'https://testbrand.com/products/magnesium?variant=v60' },
  ],
};
const verifiedOffers = {
  'p-test-magnesium': {
    merchant: 'Testbrand', hosts: ['testbrand.com'], productMatch: 'exact', availability: 'AVAILABLE', verifiedAt: fresh,
    price: { amount: 32, regular: 32, currency: 'USD', source: PRICE_SOURCES.MERCHANT_FEED, verifiedAt: fresh },
    variants: {
      v30: { price: { amount: 18, currency: 'USD', source: PRICE_SOURCES.MERCHANT_FEED, verifiedAt: fresh }, available: true },
      v60: { price: { amount: 27.99, currency: 'USD', source: PRICE_SOURCES.MERCHANT_FEED, verifiedAt: fresh }, available: false },
    },
  },
};
const ctx = (extra = {}) => ({ now: NOW, verifiedOffers, ...extra });

describe('capability policy', () => {
  it('Amazon is redirect-only and cannot be overridden by an agreement or provider flag', () => {
    const caps = capabilitiesFor({ provider: PROVIDERS.AMAZON_ASSOCIATES, agreement: { type: 'wholesale', reference: 'x', approvedAt: '2026-01-01', allowsPurchasingProvider: true } });
    expect(caps).toMatchObject({ affiliateRedirect: true, managedCheckout: false, manualFulfillment: false, providerOrdering: false, paymentProvider: 'external_merchant' });
    // Even mislabelled, an Amazon URL is still Amazon.
    expect(capabilitiesFor({ provider: PROVIDERS.BRAND_DIRECT, destinationUrl: 'https://amzn.to/abc', agreement: { type: 'dropship', reference: 'x', approvedAt: '2026-01-01' } }).managedCheckout).toBe(false);
    expect(() => assertManagedCheckoutAllowed({ provider: PROVIDERS.AMAZON_ASSOCIATES })).toThrow(/Amazon/);
  });

  it('ShopMy, Collabs and unknown providers stay redirect-only by default', () => {
    for (const provider of [PROVIDERS.SHOPMY, PROVIDERS.SHOPIFY_COLLABS, PROVIDERS.BRAND_DIRECT, PROVIDERS.UNKNOWN]) {
      expect(capabilitiesFor({ provider }).managedCheckout, provider).toBe(false);
      expect(() => assertManagedCheckoutAllowed({ provider })).toThrow();
    }
  });

  it('only a documented agreement unlocks managed checkout, paid through Stripe', () => {
    expect(capabilitiesFor({ provider: PROVIDERS.BRAND_DIRECT, agreement: { type: 'wholesale' } }).managedCheckout).toBe(false); // no reference/date
    const caps = assertManagedCheckoutAllowed({ provider: PROVIDERS.BRAND_DIRECT, agreement: { type: 'wholesale', reference: 'contract-12', approvedAt: '2026-10-01' } });
    expect(caps).toMatchObject({ managedCheckout: true, manualFulfillment: true, paymentProvider: 'stripe', providerOrdering: false });
  });

  it('Shoppable is its own payment rail and stays off until access is confirmed', () => {
    expect(capabilitiesFor({ provider: PROVIDERS.SHOPPABLE }).reason).toBe('SHOPPABLE_CHECKOUT_ACCESS_REQUIRES_CONFIRMATION');
    const on = capabilitiesFor({ provider: PROVIDERS.SHOPPABLE }, { SHOPPABLE_CHECKOUT_ACCESS_CONFIRMED: 'true' });
    expect(on).toMatchObject({ providerCheckout: true, paymentProvider: 'shoppable' });
    expect(() => assertManagedCheckoutAllowed({ provider: PROVIDERS.SHOPPABLE }, { SHOPPABLE_CHECKOUT_ACCESS_CONFIRMED: 'true' })).toThrow(); // not Stripe
  });

  it('classifies affiliate networks by host', () => {
    expect(providerForUrl('https://go.shopmy.us/p-1')).toBe(PROVIDERS.SHOPMY);
    expect(providerForUrl('https://collabs.shop/abc')).toBe(PROVIDERS.SHOPIFY_COLLABS);
    expect(providerForUrl('https://proov.pxf.io/x')).toBe(PROVIDERS.IMPACT);
    expect(providerForUrl('https://a.co/d/xyz')).toBe(PROVIDERS.AMAZON_ASSOCIATES);
  });
});

describe('Commerce Router: source priority', () => {
  it('partner brand uses the partner route even when Amazon sells it', () => {
    const partner = { ...product, id: 'p-test-neycher', name: 'Neycher Test Gel', brand: 'Neycher', affiliateUrl: 'https://www.amazon.com/dp/B0TEST0009?tag=aynahealth-20', url: 'https://www.helloneycher.com/product/test-gel', variants: [] };
    const r = resolveCommerce(partner, null, ctx());
    expect(r.selectionReason).toBe(SELECTION_REASONS.PARTNER_ROUTE_PRIORITY);
    expect(r.destinationUrl).toBe('https://www.helloneycher.com/product/test-gel');
    expect(r.amazon).toBeNull();
  });

  it('non-partner: exact child ASIN for the chosen size goes to Amazon', () => {
    const r = resolveCommerce(product, product.variants[0], ctx());
    expect(r.selectionReason).toBe(SELECTION_REASONS.NONPARTNER_AMAZON_EXACT_MATCH);
    expect(r.destinationUrl).toBe('https://www.amazon.com/dp/B0TEST0030?tag=aynahealth-20');
    expect(r.amazon.asin).toBe('B0TEST0030');
  });

  it('non-partner: a size with no exact child ASIN goes to that exact size on the brand site', () => {
    const r = resolveCommerce(product, product.variants[1], ctx());
    expect(r.selectionReason).toBe(SELECTION_REASONS.AMAZON_VARIANT_NOT_EXACT);
    expect(r.destinationUrl).toBe('https://testbrand.com/products/magnesium?variant=v60');
    expect(r.amazon).toBeNull();
  });

  it('non-partner not on Amazon falls back to the brand site', () => {
    const p = { ...product, affiliateUrl: null, variants: [] };
    expect(resolveCommerce(p, null, ctx()).selectionReason).toBe(SELECTION_REASONS.NONPARTNER_BRAND_SITE_FALLBACK);
  });

  it('native app without Amazon approval never opens Amazon', () => {
    const r = resolveCommerce(product, product.variants[0], ctx({ platform: 'native' }));
    expect(r.destinationUrl).toBe('https://testbrand.com/products/magnesium?variant=v30');
    expect(r.selectionReason).toBe(SELECTION_REASONS.AMAZON_NOT_AVAILABLE);
    const approved = resolveCommerce(product, product.variants[0], ctx({ platform: 'native', env: { VITE_AMAZON_MOBILE_APP_APPROVED: 'true' } }));
    expect(approved.destinationUrl).toContain('amazon.com/dp/B0TEST0030');
  });

  it('apps and services use their service link', () => {
    const app = { id: 'd-test-app', name: 'Test App', type: 'digital', category: 'tracker', url: 'https://testapp.com/' };
    const r = resolveCommerce(app, null, ctx());
    expect(r.destinationUrl).toBe('https://testapp.com/');
    expect(r.method).toBe('external_service');
    expect(r.amazon).toBeNull();
  });
});

describe('price follows the active route', () => {
  it('Amazon route never shows a brand or legacy price', () => {
    const r = resolveCommerce(product, product.variants[0], ctx());
    expect(r.priceDisplay.show).toBe(false);
    expect(r.priceDisplay.main).toBe('See current price on Amazon');
    expect(r.price).toBeNull();
  });

  it('switching to a brand-only size switches price, link, merchant and stock together', () => {
    const r = resolveCommerce(product, product.variants[1], ctx());
    expect(r.priceDisplay).toMatchObject({ show: true, main: '$27.99' });
    expect(r.merchant).toBe('Testbrand');
    expect(r.availability).toBe('OUT_OF_STOCK');
    expect(r.variantId).toBe('v60');
  });

  it('when Amazon is unavailable the brand price replaces it (no stale Amazon price)', () => {
    const r = resolveCommerce(product, product.variants[0], ctx({ platform: 'native' }));
    expect(r.priceDisplay).toMatchObject({ show: true, main: '$18' });
    expect(r.price.source).toBe(PRICE_SOURCES.MERCHANT_FEED);
  });

  it('the image follows the chosen option and never borrows another pack\'s photo', () => {
    const withImages = {
      ...product,
      image: 'https://testbrand.com/img/30.jpg',
      variants: [
        { ...product.variants[0], image: 'https://testbrand.com/img/30.jpg' },
        { ...product.variants[1], image: 'https://testbrand.com/img/60.jpg' },
        { id: 'v90', label: '90 count', url: 'https://testbrand.com/products/magnesium?variant=v90' },
      ],
    };
    expect(resolveCommerce(withImages, withImages.variants[1], ctx()).image).toBe('https://testbrand.com/img/60.jpg');
    expect(resolveCommerce(withImages, withImages.variants[2], ctx()).image).toBe('');
    const amazonImg = { ...product, variants: [], image: 'https://m.media-amazon.com/images/I/abc.jpg' };
    expect(resolveCommerce(amazonImg, null, ctx()).imageAmazonHosted).toBe(true);
  });

  it('merchant change moves price, link and merchant together and keeps the chosen option', () => {
    const onAmazon = resolveCommerce(product, product.variants[0], ctx());
    const onBrand = resolveCommerce(product, product.variants[0], ctx({ platform: 'native' }));
    expect(onAmazon.merchant).toBe('Amazon');
    expect(onBrand.merchant).toBe('Testbrand');
    expect(new URL(onBrand.destinationUrl).hostname).toBe('testbrand.com');
    expect(onAmazon.variantId).toBe(onBrand.variantId);
    expect(onAmazon.priceDisplay.show).toBe(false);
    expect(onBrand.priceDisplay.main).toBe('$18');
  });

  it('a stale verified price is not shown', () => {
    const r = resolveCommerce(product, product.variants[1], ctx({ now: NOW + 40 * 24 * 3600 * 1000 }));
    expect(r.priceDisplay.show).toBe(false);
    expect(r.priceDisplay.main).toBe('See current price at Testbrand');
  });

  it('cards keep catalog text unless switched to verified-only', () => {
    const amazonOnly = { ...product, variants: [] };
    expect(commerceCardPrice(amazonOnly, ctx())).toBeNull();
    expect(commerceCardPrice(amazonOnly, ctx({ env: { VITE_COMMERCE_PRICE_MODE: 'verified_only' } }))).toEqual({ main: 'See current price on Amazon', sub: '' });
  });
});

describe('freshness and Amazon display rules', () => {
  it('only a Creators API price may be shown for Amazon', () => {
    const manual = { amount: 20, currency: 'USD', source: PRICE_SOURCES.MANUAL_VERIFICATION, verifiedAt: fresh };
    expect(priceLabelFor(manual, { isAmazon: true, now: NOW }).show).toBe(false);
    const api = { amount: 20, currency: 'USD', source: PRICE_SOURCES.AMAZON_CREATORS_API, verifiedAt: new Date(NOW - 30 * 60 * 1000).toISOString() };
    const shown = priceLabelFor(api, { isAmazon: true, now: NOW });
    expect(shown).toMatchObject({ show: true, main: '$20', asOf: null });
    expect(shown.disclaimer).toMatch(/accurate as of the date\/time indicated/);
  });

  it('an API price older than an hour needs a timestamp, older than a day is not shown', () => {
    const twoHours = { amount: 20, currency: 'USD', source: PRICE_SOURCES.AMAZON_CREATORS_API, verifiedAt: new Date(NOW - 2 * 3600 * 1000).toISOString() };
    expect(priceLabelFor(twoHours, { isAmazon: true, now: NOW }).asOf).not.toBeNull();
    const twoDays = { ...twoHours, verifiedAt: new Date(NOW - 48 * 3600 * 1000).toISOString() };
    expect(priceLabelFor(twoDays, { isAmazon: true, now: NOW }).show).toBe(false);
  });

  it('legacy prices are never fresh', () => {
    expect(priceFreshness({ source: PRICE_SOURCES.LEGACY_IMPORT, verifiedAt: fresh }, NOW).fresh).toBe(false);
  });

  it('keeps Amazon statuses separate', () => {
    const s = amazonVerification({ asin: 'B0TEST0001' }, { productHasVariants: false });
    expect(s).toEqual({ identity: AMAZON_STATUS.NEEDS_HUMAN_VERIFICATION, variant: AMAZON_STATUS.NEEDS_HUMAN_VERIFICATION, price: AMAZON_STATUS.NEEDS_CREATORS_API_ACCESS, availability: AMAZON_STATUS.NEEDS_CREATORS_API_ACCESS });
    expect(amazonVerification({ asin: 'B0TEST0001' }, { productHasVariants: true }).variant).toBe(AMAZON_STATUS.NEEDS_VARIANT_CHOICE);
  });

  it('Amazon links carry only ayna\'s store tag', () => {
    expect(amazonSpecialLink('b0test0001')).toBe('https://www.amazon.com/dp/B0TEST0001?tag=aynahealth-20');
    expect(isCleanAmazonSpecialLink('https://www.amazon.com/dp/B0TEST0001?tag=aynahealth-20')).toBe(true);
    expect(isCleanAmazonSpecialLink('https://www.amazon.com/dp/B0TEST0001?tag=aynahealth-20&ascsubtag=user123')).toBe(false);
    expect(asinFromUrl('https://www.amazon.com/Some-Name/dp/B0TEST0001/ref=x')).toBe('B0TEST0001');
  });
});

describe('bag', () => {
  it('groups by how each item is paid and never puts Amazon in an ayna payment', () => {
    const amazonLine = bagLineFromRouted(resolveCommerce(product, product.variants[0], ctx()));
    const brandLine = bagLineFromRouted(resolveCommerce(product, product.variants[1], ctx()));
    expect(amazonLine.group).toBe(CHECKOUT_GROUPS.EXTERNAL);
    expect(brandLine.group).toBe(CHECKOUT_GROUPS.EXTERNAL);
    const sections = groupBag([amazonLine, brandLine]);
    expect(sections.map((s) => s.title)).toEqual(['Purchased separately on Amazon', 'Purchased separately on Testbrand']);
    expect(sections.every((s) => !s.oneTransaction)).toBe(true);
    expect(remainingExternalItems([amazonLine, brandLine])).toHaveLength(2);
  });

  it('will not add a sized product without its size', () => {
    expect(bagLineFromRouted(resolveCommerce(product, null, ctx()))).toBeNull();
  });

  it('revalidation catches price up, price down and changed offers', () => {
    const line = bagLineFromRouted(resolveCommerce(product, product.variants[1], ctx()));
    const up = { ...verifiedOffers['p-test-magnesium'], variants: { ...verifiedOffers['p-test-magnesium'].variants, v60: { price: { amount: 31, currency: 'USD', source: 'merchant_feed', verifiedAt: fresh }, available: true } } };
    expect(revalidateLine(line, resolveCommerce(product, product.variants[1], ctx({ verifiedOffers: { 'p-test-magnesium': up } }))).status).toBe('price_up');
    const down = { ...up, variants: { ...up.variants, v60: { ...up.variants.v60, price: { ...up.variants.v60.price, amount: 20 } } } };
    expect(revalidateLine(line, resolveCommerce(product, product.variants[1], ctx({ verifiedOffers: { 'p-test-magnesium': down } }))).status).toBe('price_down');
    expect(revalidateLine(line, resolveCommerce(product, product.variants[0], ctx())).status).toBe('offer_changed');
  });
});

describe('managed orders', () => {
  const checklist = Object.fromEntries(PLACEMENT_CHECKLIST.map(([k]) => [k, true]));
  const good = { externalOrderId: 'R-123', productCostCents: 2400, shippingCents: 500, taxCents: 200, merchantTotalCents: 3100, placedAt: '2026-10-15T12:00:00Z', checklist };

  it('needs a retailer order number, real costs and the full checklist', () => {
    expect(validateMarkPlaced(good, { maxApprovedTotalCents: 3500 })).toMatchObject({ ok: true, nextStatus: FULFILLMENT_STATUS.MERCHANT_ORDER_PLACED });
    expect(validateMarkPlaced({ ...good, externalOrderId: '' }, { maxApprovedTotalCents: 3500 }).ok).toBe(false);
    expect(validateMarkPlaced({ ...good, checklist: { ...checklist, correctCount: false } }, { maxApprovedTotalCents: 3500 }).errors.join(' ')).toMatch(/count/);
  });

  it('a total above what the customer approved is never placed', () => {
    const r = validateMarkPlaced({ ...good, productCostCents: 3100, merchantTotalCents: 3800 }, { maxApprovedTotalCents: 3500 });
    expect(r).toMatchObject({ ok: false, nextStatus: FULFILLMENT_STATUS.PRICE_CHANGE_REQUIRES_ACTION });
  });

  it('urgency comes from Stripe capture_before, not a fixed 7 days', () => {
    const authorizedAt = new Date(NOW - 4 * 24 * 3600 * 1000).toISOString();
    expect(authorizationUrgency({ captureBefore: (NOW + 3 * 24 * 3600 * 1000) / 1000, authorizedAt }, NOW).level).toBe('urgent');
    expect(authorizationUrgency({ captureBefore: (NOW + 5 * 3600 * 1000) / 1000, authorizedAt }, NOW)).toMatchObject({ level: 'expiring', cancelRecommended: true });
    expect(authorizationUrgency({ captureBefore: null, authorizedAt }, NOW).level).toBe('unknown');
    const queue = sortFulfillmentQueue([
      { id: 'a', authorizedAt: new Date(NOW - 3600e3).toISOString(), captureBefore: (NOW + 6 * 86400e3) / 1000 },
      { id: 'b', authorizedAt, captureBefore: (NOW + 4 * 3600e3) / 1000 },
    ], NOW);
    expect(queue.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('payment and fulfilment transitions are explicit', () => {
    expect(canTransitionFulfillment(FULFILLMENT_STATUS.AWAITING_FULFILLMENT, FULFILLMENT_STATUS.SHIPPED)).toBe(false);
    expect(canTransitionFulfillment(FULFILLMENT_STATUS.MERCHANT_ORDER_PLACED, FULFILLMENT_STATUS.SHIPPED)).toBe(true);
  });
});

describe('analytics', () => {
  it('sends only allowlisted, non-health commerce properties', () => {
    const r = resolveCommerce({ ...product, healthProfile: { pcos: true }, symptoms: ['uti'] }, product.variants[0], ctx());
    const props = commerceEventProps(r);
    expect(Object.keys(props).sort()).toEqual(['destinationHost', 'isPartner', 'merchant', 'method', 'platform', 'priceShown', 'priceSource', 'productId', 'provider', 'selectionReason', 'variantId'].sort());
    expect(JSON.stringify(props)).not.toMatch(/pcos|uti|tag=/i);
  });
});

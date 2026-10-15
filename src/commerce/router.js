/**
 * Commerce Router: given a product the health engine already chose, pick
 * WHERE to buy it and what the shopper may be shown about that offer.
 * It never changes which products are recommended or their order.
 *
 * Source priority (set by ayna, 2026-10-14):
 *   1. ayna partner brand  -> the partner's own route (affiliate link, Collabs,
 *                             ShopMy, ref code, or brand page). Never Amazon.
 *   2. not a partner       -> Amazon, but only for the exact product AND the
 *                             exact option (child ASIN for a chosen size/count).
 *   3. otherwise           -> the brand's own site, exact option where known.
 *
 * The price, option, availability and CTA always describe the offer the button
 * actually opens. Amazon prices are shown only when Creators API supplied them.
 */
import { resolveBuyUrl, isAmazonUrl, isUsableBuyUrl } from '../utils/buyLink.js';
import { CATALOG_CORRECTIONS } from '../data/catalogCorrections.js';
import { PRODUCT_BUY_URLS } from '../data/productBuyUrls.js';
import { isPartnerBrandItem, isPrelaunchPartnerItem } from '../utils/partnerBrands.js';
import { getAmazonAffiliateUrlForProduct } from '../data/productAffiliateUrls.js';
import { COMMERCE_VERIFIED_OFFERS } from '../data/commerceVerifiedOffers.js';
import { PROVIDERS, providerForUrl, capabilitiesFor } from './policy.js';
import { asinFromUrl, amazonVerification, creatorsApiConfigured } from './amazon.js';
import { priceLabelFor, formatMoney } from './freshness.js';

/** Categories that are services (telehealth, apps) even if a row says "physical". */
export const SERVICE_CATEGORIES = new Set(['telehealth', 'app', 'tracker', 'therapy', 'service']);

export const SELECTION_REASONS = Object.freeze({
  PARTNER_ROUTE_PRIORITY: 'PARTNER_ROUTE_PRIORITY',
  NONPARTNER_AMAZON_EXACT_MATCH: 'NONPARTNER_AMAZON_EXACT_MATCH',
  NONPARTNER_BRAND_SITE_FALLBACK: 'NONPARTNER_BRAND_SITE_FALLBACK',
  AMAZON_VARIANT_NOT_EXACT: 'AMAZON_VARIANT_NOT_EXACT',
  AMAZON_NOT_AVAILABLE: 'AMAZON_NOT_AVAILABLE',
  NEEDS_MANUAL_REVIEW: 'NEEDS_MANUAL_REVIEW',
});

const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

const RETAILER_NAMES = { 'target.com': 'Target', 'walmart.com': 'Walmart', 'cvs.com': 'CVS', 'walgreens.com': 'Walgreens', 'iherb.com': 'iHerb' };

function merchantLabel(product, destinationUrl) {
  const host = hostOf(destinationUrl);
  if (host && RETAILER_NAMES[host]) return RETAILER_NAMES[host];
  if (product?.brand) return product.brand;
  return host || 'the retailer';
}

/** First dollar amount in a catalog price string ("$21 for 2 pads" -> 21). */
export function firstDollarAmount(text) {
  const m = String(text || '').match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

function defaultVariant(product) {
  const list = Array.isArray(product?.variants) ? product.variants : [];
  return product?.defaultVariantId ? list.find((v) => v.id === product.defaultVariantId) || null : null;
}

/** Is the verified merchant data about the same site the button opens? */
function verifiedForDestination(verified, destinationUrl, provider) {
  if (!verified || !destinationUrl) return null;
  const host = hostOf(destinationUrl);
  if (host && verified.hosts?.includes(host)) return verified;
  // An affiliate wrapper (ShopMy, Collabs, Impact) lands on the brand's site;
  // the verifier recorded the landing host in `hosts` when it could follow it.
  if ([PROVIDERS.SHOPMY, PROVIDERS.SHOPIFY_COLLABS, PROVIDERS.IMPACT].includes(provider) && verified.hosts?.length) return verified;
  return null;
}

/**
 * @param {object} product catalog product, corrections already applied
 * @param {object|null} [selectedVariant]
 * @param {{ platform?: 'web'|'native', env?: object, now?: number }} [ctx]
 */
export function resolveCommerce(product, selectedVariant = null, ctx = {}) {
  const { platform = 'web', env = {}, now = Date.now(), verifiedOffers = COMMERCE_VERIFIED_OFFERS } = ctx;
  if (!product) return null;

  const isPartner = isPartnerBrandItem(product);
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const variant = selectedVariant || defaultVariant(product);
  const amazonAllowed = platform !== 'native' || String(env.VITE_AMAZON_MOBILE_APP_APPROVED || env.AMAZON_MOBILE_APP_APPROVED || '') === 'true';
  const productAmazonUrl = getAmazonAffiliateUrlForProduct(product)
    || (isAmazonUrl(product.affiliateUrl) ? String(product.affiliateUrl).trim() : null);
  const hasAmazonListing = Boolean(productAmazonUrl || variants.some((v) => v.amazonAsin));

  let destinationUrl = resolveBuyUrl(product, variant, { amazonAllowed }) || null;
  // Apps, telehealth and other services: their official site or app page is
  // the destination even when it is a homepage (signup/booking lives there).
  const isService = product.type === 'digital' || SERVICE_CATEGORIES.has(product.category);
  if (!destinationUrl && isService) {
    destinationUrl = [CATALOG_CORRECTIONS[product.id]?.url, PRODUCT_BUY_URLS[product.id], product.url, product.website]
      .find((u) => isUsableBuyUrl(u) && !isAmazonUrl(u)) || null;
    if (destinationUrl) destinationUrl = String(destinationUrl).trim();
  }
  const isAmazon = isAmazonUrl(destinationUrl);
  let provider = destinationUrl ? providerForUrl(destinationUrl) : PROVIDERS.UNKNOWN;
  if (isService && !isAmazon && destinationUrl) provider = PROVIDERS.APP_OR_SERVICE;
  if (isPartner && provider === PROVIDERS.BRAND_DIRECT && /[?&](ref|af|sca_ref|bg_ref|dt_id)=/i.test(destinationUrl || '')) provider = PROVIDERS.BRAND_AFFILIATE;

  // Why this offer.
  let selectionReason;
  if (!destinationUrl) selectionReason = SELECTION_REASONS.NEEDS_MANUAL_REVIEW;
  else if (isPartner) selectionReason = SELECTION_REASONS.PARTNER_ROUTE_PRIORITY;
  else if (isAmazon) selectionReason = SELECTION_REASONS.NONPARTNER_AMAZON_EXACT_MATCH;
  else if (hasAmazonListing && !amazonAllowed) selectionReason = SELECTION_REASONS.AMAZON_NOT_AVAILABLE;
  else if (hasAmazonListing) selectionReason = SELECTION_REASONS.AMAZON_VARIANT_NOT_EXACT;
  else selectionReason = SELECTION_REASONS.NONPARTNER_BRAND_SITE_FALLBACK;

  // Amazon state: four separate facts.
  const asin = isAmazon ? asinFromUrl(destinationUrl) : null;
  // null = mapped but not yet confirmed against Amazon; false = known not exact.
  let variantExact = null;
  if (isAmazon && variant && !(variant.amazonAsin && asin === String(variant.amazonAsin).toUpperCase())) variantExact = false;
  const amazon = isAmazon
    ? {
      asin,
      ...amazonVerification(
        { asin, identityCheckedAt: null, variantExact, price: null, availability: null },
        { productHasVariants: variants.length > 0, variantChosen: Boolean(variant), apiConfigured: creatorsApiConfigured(env) },
      ),
      // A product with sizes whose button opens a generic listing is not exact.
      genericListingForSizedProduct: variants.length > 0 && !variant?.amazonAsin,
    }
    : null;

  // Merchant facts verified on the merchant's own site, if they describe this offer.
  const verified = isAmazon ? null : verifiedForDestination(verifiedOffers[product.id], destinationUrl, provider);
  const variantFacts = verified && variant ? verified.variants?.[variant.id] || null : null;
  const offerPrice = variant ? variantFacts?.price || null : verified?.price || null;
  const label = merchantLabel(product, destinationUrl);
  const priceDisplay = priceLabelFor(offerPrice, { merchantLabel: isAmazon ? 'Amazon' : label, isAmazon, now });

  let availability = 'UNKNOWN';
  if (variantFacts && typeof variantFacts.available === 'boolean') availability = variantFacts.available ? 'AVAILABLE' : 'OUT_OF_STOCK';
  else if (verified?.availability && !variant) availability = verified.availability;

  const capabilities = capabilitiesFor({ provider, destinationUrl }, env);
  const prelaunch = isPrelaunchPartnerItem(product);
  let ctaLabel = 'Buy now';
  if (prelaunch) ctaLabel = product.waitlistCtaLabel || 'Join the waitlist';
  else if (isService) ctaLabel = 'Get started';
  else if (isAmazon) ctaLabel = 'Buy on Amazon';
  else if (destinationUrl) ctaLabel = `Shop at ${label}`;

  return {
    productId: product.id,
    variantId: variant?.id || null,
    variantLabel: variant?.label || null,
    needsVariantChoice: variants.length > 0 && !variant,
    isPartner,
    selectionReason,
    provider,
    merchant: isAmazon ? 'Amazon' : label,
    method: provider === PROVIDERS.APP_OR_SERVICE ? 'external_service' : capabilities.affiliateRedirect ? 'affiliate_redirect' : destinationUrl ? 'external_redirect' : 'none',
    paymentProvider: capabilities.paymentProvider,
    capabilities,
    destinationUrl,
    ctaLabel,
    amazon,
    price: offerPrice
      ? { amount: offerPrice.amount, currency: offerPrice.currency, source: offerPrice.source, verifiedAt: offerPrice.verifiedAt }
      : null,
    priceDisplay,
    availability,
    sku: variantFacts?.sku || null,
    barcode: variantFacts?.barcode || null,
    verificationMethod: isAmazon ? 'asin_extracted_only' : verified?.verificationMethod || 'unable_to_verify',
  };
}

/**
 * Card/list price for a catalog product. Returns null when the commerce layer
 * has nothing to say (not a catalog product with a buy route), so callers can
 * fall back to their own formatting.
 * @returns {{ main: string, sub: string }|null}
 */
export function commerceCardPrice(product, ctx = {}) {
  if (!product?.id || product.type === 'digital' || SERVICE_CATEGORIES.has(product.category)) return null;
  const offers = ctx.verifiedOffers || COMMERCE_VERIFIED_OFFERS;
  const isCatalogRoute = isAmazonUrl(resolveBuyUrl(product, null)) || offers[product.id];
  if (!isCatalogRoute) return null;
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const r = resolveCommerce(product, null, ctx);
  if (!r?.destinationUrl) return null;
  if (r.priceDisplay.show) {
    // The catalog text already says this verified price (and usually the pack,
    // "$21 for 2 pads"): keep it as written so nothing changes visually.
    const legacy = firstDollarAmount(product.price);
    if (r.price?.currency === 'USD' && legacy !== null && Math.abs(legacy - Number(r.price.amount)) < 0.01 && !/\d\s*[-–]\s*\$?\d|\bfrom\b|~|\babout\b/i.test(String(product.price))) return null;
    return { main: r.priceDisplay.main, sub: r.priceDisplay.sub };
  }
  const verifiedOnly = String(ctx?.env?.VITE_COMMERCE_PRICE_MODE || '') === 'verified_only';

  // A sized product with no option chosen: the lowest verified option price at
  // the same merchant, labelled "From".
  if (variants.length && !r.amazon) {
    const prices = variants
      .map((v) => resolveCommerce(product, v, ctx))
      .filter((x) => x?.priceDisplay?.show && x.price?.currency === 'USD' && x.merchant === r.merchant)
      .map((x) => x.price.amount);
    if (prices.length === variants.length) {
      const low = Math.min(...prices);
      const high = Math.max(...prices);
      const legacy = firstDollarAmount(product.price);
      if (legacy !== null && Math.abs(legacy - low) < 0.01) return null; // catalog text already right
      return { main: low === high ? formatMoney(low) : `From ${formatMoney(low)}`, sub: '' };
    }
  }
  // No verified price for this offer. Until the founders switch to
  // verified-only, keep the existing catalog text (the caller formats it).
  return verifiedOnly ? { main: r.priceDisplay.main, sub: '' } : null;
}

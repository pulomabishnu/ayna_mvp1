/**
 * Single source of truth for where "Buy Now" sends someone.
 *
 * Rules (set by Ayna, 2026-09-27):
 *  - Brand partners always go to the partner's own link — their affiliate
 *    link when Ayna has one, otherwise their own product page. A partner
 *    product never goes to Amazon (and never carries Ayna's Amazon tag).
 *  - Every other product goes to Ayna's Amazon Associates link when the
 *    product is in Ayna's Amazon catalog. Manufacturer/retailer pages are
 *    only the fallback for products Amazon doesn't carry for us.
 */
import { CATALOG_CORRECTIONS } from '../data/catalogCorrections';
import { PRODUCT_BUY_URLS } from '../data/productBuyUrls';
import { amazonAffiliateUrlForAsin, getAmazonAffiliateUrlForProduct } from '../data/productAffiliateUrls';
import { isPartnerBrandItem } from './partnerBrands';

function hasRealPath(url) {
  try {
    const u = new URL(url);
    return Boolean(u.pathname && u.pathname !== '/') || Boolean(u.search);
  } catch {
    return false;
  }
}

function isSearchResultsUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const path = u.pathname.toLowerCase();
    if (/\/(s|search)(\/|$)/.test(path) && (u.searchParams.has('k') || u.searchParams.has('q') || u.searchParams.has('searchTerm'))) return true;
    if (host.includes('google.') && (path === '/search' || u.searchParams.get('tbm') === 'shop')) return true;
    return false;
  } catch {
    return true;
  }
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

/** A real product/landing destination: http(s), not a search page. */
export function isUsableBuyUrl(value) {
  const url = String(value || '').trim();
  return isHttpUrl(url) && !isSearchResultsUrl(url);
}

/** A specific page (not a bare homepage) — preferred over homepages. */
function isExactBuyUrl(value) {
  return isUsableBuyUrl(value) && hasRealPath(String(value).trim());
}

/** Amazon, including amzn.to / a.co short links. */
export function isAmazonUrl(value) {
  try {
    const host = new URL(String(value || '').trim()).hostname.toLowerCase();
    return /(^|\.)amazon\.[a-z.]+$/.test(host) || host === 'amzn.to' || host === 'a.co' || host === 'amzn.com' || host.endsWith('.amzn.com');
  } catch {
    return false;
  }
}

/**
 * Partner tracking parameters that can be added to any page on the
 * partner's own site, so an exact size/option link still earns credit.
 * Only brands whose affiliate program works by query parameter are listed.
 */
const PARTNER_REF_PARAMS = [
  { pattern: /\blim method\b/, hosts: ['limmethod.com'], param: 'ref', value: 'Ayna_Health' },
  { pattern: /\belitone\b/, hosts: ['elitone.com'], param: 'af', value: 'aynahealth' },
];

function withPartnerRef(product, url) {
  const text = `${product?.brand || ''} ${product?.name || ''}`.toLowerCase();
  const rule = PARTNER_REF_PARAMS.find((r) => r.pattern.test(text));
  if (!rule) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (!rule.hosts.includes(host)) return null;
    u.searchParams.set(rule.param, rule.value);
    return u.toString();
  } catch {
    return null;
  }
}

function firstOf(candidates, test) {
  for (const candidate of candidates) {
    if (test(candidate)) return String(candidate).trim();
  }
  return null;
}

function partnerBuyUrl(product, variant) {
  const notAmazon = (u) => !isAmazonUrl(u);
  const affiliate = isUsableBuyUrl(product?.affiliateUrl) && notAmazon(product.affiliateUrl)
    ? String(product.affiliateUrl).trim()
    : null;

  if (variant?.url && isExactBuyUrl(variant.url) && notAmazon(variant.url)) {
    // Exact option on the partner's site, keeping Ayna's tracking when the
    // partner's program supports a query parameter.
    const tracked = withPartnerRef(product, variant.url);
    if (tracked) return tracked;
    // Otherwise the partner's affiliate link earns the credit; without one,
    // the exact option page is the best destination.
    return affiliate || String(variant.url).trim();
  }
  if (affiliate) return affiliate;

  const pageCandidates = [
    CATALOG_CORRECTIONS[product?.id]?.url,
    PRODUCT_BUY_URLS[product?.id],
    product?.productUrl,
    product?.buyUrl,
    product?.url,
  ];
  const page = firstOf(pageCandidates, (u) => isExactBuyUrl(u) && notAmazon(u))
    || firstOf(pageCandidates, (u) => isUsableBuyUrl(u) && notAmazon(u));
  if (!page) return null;
  return withPartnerRef(product, page) || page;
}

function standardBuyUrl(product, variant) {
  // 1. Ayna's Amazon Associates link — an exact per-option ASIN when one is
  //    known, otherwise the product's listing (sizes are chosen on Amazon).
  const variantAmazon = amazonAffiliateUrlForAsin(variant?.amazonAsin);
  if (variantAmazon) return variantAmazon;
  const amazon = getAmazonAffiliateUrlForProduct(product);
  if (amazon) return amazon;
  if (isExactBuyUrl(product?.affiliateUrl) && isAmazonUrl(product.affiliateUrl)) {
    return String(product.affiliateUrl).trim();
  }

  // 2. Not on Amazon for us: the exact option, then reviewed destinations.
  if (isExactBuyUrl(variant?.url)) return String(variant.url).trim();
  const candidates = [
    product?.affiliateUrl,
    CATALOG_CORRECTIONS[product?.id]?.url,
    PRODUCT_BUY_URLS[product?.id],
    product?.productUrl,
    product?.buyUrl,
    product?.url,
    ...(product?.whereToBuyLinks && typeof product.whereToBuyLinks === 'object'
      ? Object.values(product.whereToBuyLinks)
      : []),
  ];
  return firstOf(candidates, isExactBuyUrl);
}

/**
 * @param {object} product catalog/live product (corrections already applied)
 * @param {object|null} variant selected size/option, if any
 * @returns {string|null}
 */
export function resolveBuyUrl(product, variant = null) {
  if (!product) return null;
  return isPartnerBrandItem(product) ? partnerBuyUrl(product, variant) : standardBuyUrl(product, variant);
}

/** True when Buy Now opens Amazon for this product (not for the selected size). */
export function buyGoesToAmazonListing(product, variant = null) {
  return isAmazonUrl(resolveBuyUrl(product, variant)) && !amazonAffiliateUrlForAsin(variant?.amazonAsin);
}

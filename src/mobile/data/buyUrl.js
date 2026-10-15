// Mirrors getBuyUrl/isExactBuyUrl/hasRealPath/isSearchResultsUrl from
// src/components/ProductModal.jsx verbatim (not exported there), this is
// the real site's actual "Buy Now" URL-resolution logic (affiliate link,
// then Ayna's centrally verified PRODUCT_BUY_URLS map, then product-level
// URL fields, rejecting bare homepages and search-result pages along the
// way). PRODUCT_BUY_URLS itself is imported directly from the real
// src/data/productBuyUrls.js, the actual hardcoded id -> URL map used on
// the website, not a mobile-only copy. Keep the helper functions in sync
// with ProductModal.jsx if that logic changes.
import { PRODUCT_BUY_URLS } from '../../data/productBuyUrls.js';
import { resolveCommerce } from '../../commerce/router.js';
import { commerceContext } from '../../commerce/platform.js';
import { isAmazonUrlOrId } from '../../commerce/policy.js';

function hasRealPath(url) {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/+$/, '').length > 0 || u.search.length > 0;
  } catch {
    return false;
  }
}

function isSearchResultsUrl(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase().replace(/\/+$/, '');

    if (/(^|\/)(s|search)(\/|$)/.test(path)) return true;

    if (
      u.searchParams.has('k') ||
      u.searchParams.has('searchTerm') ||
      u.searchParams.has('Ntt') ||
      u.searchParams.get('tbm') === 'shop'
    ) return true;

    return false;
  } catch {
    return true;
  }
}

function isExactBuyUrl(value) {
  const url = String(value || '').trim();
  return /^https?:\/\//i.test(url) && hasRealPath(url) && !isSearchResultsUrl(url);
}

/**
 * The app's Buy button. Same Commerce Router as the website, so partner /
 * Amazon / brand-site routing, the exact option and the displayed price all
 * agree. In the native app Amazon links stay off until Amazon approves the
 * app (VITE_AMAZON_MOBILE_APP_APPROVED); those products open the brand site.
 */
export function getBuyUrl(product, variant = null) {
  const ctx = commerceContext();
  const routed = resolveCommerce(product, variant, ctx)?.destinationUrl;
  if (routed) return routed;
  const legacy = legacyBuyUrl(product);
  if (legacy && ctx.platform === 'native' && isAmazonUrlOrId(legacy)
    && String(ctx.env.VITE_AMAZON_MOBILE_APP_APPROVED || '') !== 'true') return null;
  return legacy;
}

/**
 * The catalog's own exact purchase page (affiliate link, verified buy URL,
 * product URL), without commerce routing. Used by the product passport's
 * link checks, which must never crawl Amazon pages.
 */
export function getCatalogPurchaseUrl(product) {
  return legacyBuyUrl(product);
}

function legacyBuyUrl(product) {
  if (isExactBuyUrl(product?.affiliateUrl)) {
    return String(product.affiliateUrl).trim();
  }

  const verifiedCatalogUrl = PRODUCT_BUY_URLS[product?.id];
  if (isExactBuyUrl(verifiedCatalogUrl)) {
    return verifiedCatalogUrl;
  }

  for (const candidate of [product?.productUrl, product?.buyUrl]) {
    if (isExactBuyUrl(candidate)) return String(candidate).trim();
  }

  if (isExactBuyUrl(product?.url)) {
    return String(product.url).trim();
  }

  if (product?.whereToBuyLinks && typeof product.whereToBuyLinks === 'object') {
    for (const value of Object.values(product.whereToBuyLinks)) {
      if (isExactBuyUrl(value)) return String(value).trim();
    }
  }

  return null;
}

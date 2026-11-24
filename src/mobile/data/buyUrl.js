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
import { resolveBuyUrl } from '../../utils/buyLink.js';

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
 * Nov 23 (Ameera: every Buy goes to the partner's affiliate link, otherwise our Amazon
 * affiliate link): the app's cards, routines and home widgets use the website's resolver,
 * so they no longer send Amazon products to the brand's page. The page-only lookup below
 * is the fallback for anything it can't place.
 */
export function getBuyUrl(product) {
  return resolveBuyUrl(product) || legacyBuyUrl(product);
}

/** The product's own page link (no Amazon), used where the brand page itself matters (passport status). */
export function legacyBuyUrl(product) {
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

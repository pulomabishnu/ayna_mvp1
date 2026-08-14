import { isSafePublicUrl } from './_officialSiteFetch.js';

/**
 * Shopify storefronts publicly expose /products.json (no auth) listing every
 * product with its real photos. That's the actual per-SKU image — unlike a
 * homepage's og:image, which is usually a logo or generic social-share card
 * (the page-level image, not a specific product's). Only useful for brands
 * actually running Shopify; returns null otherwise so callers can fall back.
 */

const FETCH_TIMEOUT_MS = 5000;

const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'with', 'of', 'in']);

function normalizeTokens(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !STOPWORDS.has(w));
}

function tokenOverlapScore(a, b) {
  const setA = new Set(normalizeTokens(a));
  const setB = new Set(normalizeTokens(b));
  if (setA.size === 0 || setB.size === 0) return 0;
  let hits = 0;
  for (const t of setA) if (setB.has(t)) hits += 1;
  return hits / Math.min(setA.size, setB.size);
}

/** @returns {Promise<Array<{title: string, image: string}>|null>} */
export async function fetchShopifyProducts(domainUrl) {
  let base;
  try {
    base = new URL(domainUrl);
  } catch {
    return null;
  }
  const jsonUrl = `${base.protocol}//${base.host}/products.json?limit=250`;
  if (!(await isSafePublicUrl(jsonUrl))) return null;

  try {
    const res = await fetch(jsonUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'error',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json') && !contentType.includes('text/json')) return null;
    const data = await res.json();
    const products = Array.isArray(data?.products) ? data.products : null;
    if (!products) return null;
    return products
      .map((p) => ({ title: p.title || '', image: p.images?.[0]?.src || p.image?.src || '' }))
      .filter((p) => p.title && p.image);
  } catch {
    return null;
  }
}

/** Best-matching product's image, or null if nothing clears the confidence bar. */
export function matchProductImage(shopifyProducts, productName, brand) {
  if (!Array.isArray(shopifyProducts) || shopifyProducts.length === 0) return null;

  // Scoring on brand+name together let ANY of the brand's own products win on
  // brand-name overlap alone — "Pink Stork Bloat Support" matched a "Pink
  // Stork Sweater" listing at 67% overlap purely from sharing "pink"+"stork",
  // with zero relation to "bloat"/"support". Strip the brand's own tokens out
  // of the query first, so the score reflects only the words that actually
  // distinguish this product from the rest of the brand's catalog.
  const brandTokens = new Set(normalizeTokens(brand));
  const distinctiveTokens = normalizeTokens(productName).filter((t) => !brandTokens.has(t));
  // A product name that's nothing but the brand (e.g. name === brand) has no
  // distinctive words to match against — safer to report no match than to
  // fall back to brand-only scoring, which reintroduces the original bug.
  if (distinctiveTokens.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const p of shopifyProducts) {
    const score = tokenOverlapScore(distinctiveTokens.join(' '), p.title);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  // Require at least half of the distinctive words to appear in the title —
  // low enough to survive naming variance, high enough to reject unrelated SKUs.
  return bestScore >= 0.5 ? best.image : null;
}

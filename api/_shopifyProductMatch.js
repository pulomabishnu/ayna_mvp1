import { safeFetch } from './_ssrfSafeFetch.js';

/**
 * Many DTC/indie brand storefronts run Shopify, which publicly exposes the
 * full catalog at /products.json with no auth — no scraping, no paid API.
 * Given a page URL on the brand's site, this tries that origin's
 * /products.json, fuzzy-matches the product title, and returns the first
 * product image if a confident match is found. Returns null (never throws)
 * for non-Shopify stores, no match, or any fetch/parse failure.
 */

const MAX_PRODUCTS_TO_SCAN = 250;

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Token-overlap score: fraction of the query's significant tokens found in the candidate title. */
function scoreMatch(queryTokens, titleNorm) {
  if (queryTokens.length === 0) return 0;
  const titleTokens = new Set(titleNorm.split(' ').filter(Boolean));
  let hits = 0;
  for (const t of queryTokens) {
    if (titleTokens.has(t)) hits += 1;
  }
  return hits / queryTokens.length;
}

/**
 * @param {string} pageUrl - a URL on the brand's site (product page or any page)
 * @param {string} productName
 * @returns {Promise<string|null>} image URL, or null
 */
export async function matchShopifyProduct(pageUrl, productName) {
  let origin;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return null;
  }

  const res = await safeFetch(`${origin}/products.json?limit=${MAX_PRODUCTS_TO_SCAN}`, { timeoutMs: 4000 });
  if (!res || !res.ok) return null;
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('json')) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }
  const products = Array.isArray(data?.products) ? data.products : [];
  if (products.length === 0) return null;

  const queryNorm = normalize(productName);
  // Drop very short/common tokens (brand words like "the", sizes) that would
  // make an unrelated product look like a match by coincidence.
  const queryTokens = queryNorm.split(' ').filter((t) => t.length > 2);
  if (queryTokens.length === 0) return null;

  let best = null;
  let bestScore = 0;
  for (const p of products) {
    const titleNorm = normalize(p?.title);
    if (!titleNorm) continue;
    const score = scoreMatch(queryTokens, titleNorm);
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }

  // Require most of the product name's tokens to appear in the title —
  // this is a fuzzy match, not a search engine, so err toward "no image"
  // over attaching a wrong product's photo.
  if (!best || bestScore < 0.6) return null;

  const image =
    best.images?.[0]?.src ||
    best.image?.src ||
    best.variants?.[0]?.featured_image?.src ||
    null;

  return typeof image === 'string' && image.startsWith('http') ? image : null;
}

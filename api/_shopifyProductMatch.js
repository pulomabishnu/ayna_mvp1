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

/**
 * Containment score: overlap divided by the SMALLER of the two token sets.
 * A plain overlap/queryTokens.length ratio misses real matches where the
 * store's actual title is terser than the AI's more descriptive name (e.g.
 * query "Saalt Menstrual Cup Regular" vs. catalog title "Saalt Cup" — every
 * title token is in the query, but only 2 of the query's 4 tokens are in
 * the title, so a query-length-denominator score never reaches a sane
 * threshold). Scoring against the smaller set catches that case in either
 * direction while still requiring one side to be essentially a subset of
 * the other, not just some shared words.
 */
function scoreMatch(queryTokens, titleNorm) {
  const titleTokens = titleNorm.split(' ').filter(Boolean);
  if (queryTokens.length === 0 || titleTokens.length === 0) return { score: 0, overlap: 0 };
  const titleSet = new Set(titleTokens);
  const querySet = new Set(queryTokens);
  let overlap = 0;
  for (const t of querySet) {
    if (titleSet.has(t)) overlap += 1;
  }
  const smaller = Math.min(querySet.size, titleSet.size);
  return { score: overlap / smaller, overlap };
}

/**
 * @param {string} pageUrl - a URL on the brand's site (product page or any page)
 * @param {string} productName
 * @param {string} [brand] - stripped out of the query so a store where every
 *   listing shares the brand name (e.g. "Pink Stork Bloat Support" vs. "Pink
 *   Stork Sweater") doesn't match on brand overlap alone.
 * @returns {Promise<string|null>} image URL, or null
 */
export async function matchShopifyProduct(pageUrl, productName, brand) {
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

  // Strip the brand's own tokens out of the query first, so the score
  // reflects only the words that actually distinguish this product from the
  // rest of the brand's catalog — otherwise ANY product from the same store
  // can win purely on brand-name overlap.
  const brandTokens = new Set(normalize(brand).split(' ').filter(Boolean));
  const queryNorm = normalize(productName);
  // Drop very short/common tokens (sizes, stray words) that would make an
  // unrelated product look like a match by coincidence.
  const queryTokens = queryNorm.split(' ').filter((t) => t.length > 2 && !brandTokens.has(t));
  if (queryTokens.length === 0) return null;

  let best = null;
  let bestScore = 0;
  let bestOverlap = 0;
  for (const p of products) {
    const titleNorm = normalize(p?.title);
    if (!titleNorm) continue;
    const { score, overlap } = scoreMatch(queryTokens, titleNorm);
    if (score > bestScore) {
      bestScore = score;
      bestOverlap = overlap;
      best = p;
    }
  }

  // Require the smaller of {query, title} token set to be (almost) fully
  // contained in the other, AND at least 2 real tokens in common — a lone
  // brand-word match (e.g. just "saalt") scoring 1.0 by coincidence isn't
  // enough to trust. This is a fuzzy match, not a search engine, so err
  // toward "no image" over attaching a wrong product's photo.
  if (!best || bestScore < 0.75 || bestOverlap < 2) return null;

  const image =
    best.images?.[0]?.src ||
    best.image?.src ||
    best.variants?.[0]?.featured_image?.src ||
    null;

  return typeof image === 'string' && image.startsWith('http') ? image : null;
}

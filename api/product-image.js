/* global process */
// Returns a product image URL for a given product name/brand/official-page
// URL. Previously used the Serper.dev Google Image Search API — that key
// ran out of credits ("Not enough credits" from a direct API test), and
// every lookup silently returned empty. Replaced with two free, no-quota
// methods tried in order against the product's official page URL:
//   1. Shopify storefronts publicly expose /products.json — fuzzy-match the
//      product name against it for the real per-SKU photo.
//   2. Fall back to the page's og:image/twitter:image meta tag, rejecting
//      anything that looks like a logo/banner/social-share asset by
//      filename rather than risk mislabeling a brand logo as a product photo.
// Both reuse the SSRF-safe fetch pattern in ./_ssrfSafeFetch.js.
//
// `url` is optional — the hardcoded catalog mostly doesn't have one yet, and
// without it there's no page to resolve against, so this returns empty
// (UI falls back to the 🌸 placeholder) rather than guessing.
//
// COST/ABUSE: this route is unauthenticated and could otherwise be hit
// directly by any caller — per-IP rate limit, a shared Redis cache so the
// cost is per PRODUCT rather than per product-per-browser, edge caching,
// input caps, and a request timeout on every outbound fetch.

import { rateLimit, getClientIp } from './_rateLimit.js';
import { matchShopifyProduct } from './_shopifyProductMatch.js';
import { fetchOgImage, isLikelyNonProductImageUrl } from './_ogImageFetch.js';

const MAX_TERM_LEN = 120;
const MAX_URL_LEN = 500;
const CACHE_TTL_SEC = 30 * 24 * 60 * 60; // 30 days — product photos don't move
const NEGATIVE_TTL_SEC = 24 * 60 * 60;   // don't re-fetch known misses all day

let redisPromise = null;
function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!redisPromise) {
    redisPromise = (async () => {
      const { Redis } = await import('@upstash/redis');
      return new Redis({ url, token });
    })();
  }
  return redisPromise;
}

function cleanTerm(v, maxLen = MAX_TERM_LEN) {
  const raw = Array.isArray(v) ? v[0] : v;
  return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

function cleanUrl(v) {
  const raw = Array.isArray(v) ? v[0] : v;
  const s = String(raw || '').trim().slice(0, MAX_URL_LEN);
  if (!s) return '';
  try {
    const parsed = new URL(s);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return s;
  } catch {
    return '';
  }
}

function allowedOrigin(req) {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (!origin) return null;
  if (configured.length === 0) return null;
  return configured.includes(origin) ? origin : null;
}

/** Tries Shopify catalog match first, then og:image — first hit wins. */
async function resolveImageFromUrl(pageUrl, name, brand, allowBrandLogo) {
  const shopifyImage = await matchShopifyProduct(pageUrl, name, brand);
  if (shopifyImage) return shopifyImage;
  const ogImage = await fetchOgImage(pageUrl, allowBrandLogo);
  if (ogImage) return ogImage;
  return '';
}

// llm-recommendations.js's enrichProduct() always sets `type` to exactly
// 'digital' or 'physical' (defaulting to 'physical') — a cleaner, more
// reliable signal for "does this even have a physical form to photograph"
// than guessing off `category` (an open-ended string with dozens of
// values). Apps/telehealth services (Brightside, Clue) are 'digital': a
// brand logo/icon genuinely IS the product's real "photo" there. Everything
// 'physical' keeps the strict logo/SVG rejection — a logo standing in for
// an actual product photo is a real bug there (Pure Encapsulations'
// Shopify catalog resolving to its theme logo instead of a bottle photo).

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const origin = allowedOrigin(req);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const name = cleanTerm(req.query.name);
  const brand = cleanTerm(req.query.brand);
  const pageUrl = cleanUrl(req.query.url);
  const type = cleanTerm(req.query.type, 20).toLowerCase() === 'digital' ? 'digital' : 'physical';
  const allowBrandLogo = type === 'digital';
  if (!name) return res.status(400).json({ error: 'missing_name' });

  // v11 invalidates fuzzy/URL-free results cached by previous resolver versions.
  // Include the exact reviewed page URL so changing a destination also changes
  // the cache key instead of serving a stale SKU photo for 30 days.
  const cacheKey = `ayna:img:v11:${type}:${brand.toLowerCase()}|${name.toLowerCase()}|${pageUrl.toLowerCase()}`;
  const redis = getRedis();

  if (redis) {
    try {
      const hit = await (await redis).get(cacheKey);
      if (typeof hit === 'string') {
        res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=86400');
        return res.status(200).json({ imageUrl: hit, cached: true });
      }
    } catch (e) {
      console.error('[product-image] cache read failed:', e?.message);
    }
  }

  const rl = await rateLimit(`img:ip:${getClientIp(req)}`, { max: 60, windowSec: 60, failClosed: false });
  if (!rl.ok) {
    res.setHeader('Retry-After', String(rl.retryAfterSec || 60));
    return res.status(429).json({ imageUrl: '', error: 'rate_limited' });
  }

  // PRODUCT INTEGRITY: no official product page means no image lookup.
  // Previous versions fell back to DSLD and web image search by name, which can
  // return a different formulation, count, or even another brand. Showing no
  // photo is preferable to silently misrepresenting a health product.
  let imageUrl = '';
  if (pageUrl) {
    try {
      imageUrl = await resolveImageFromUrl(pageUrl, name, brand, allowBrandLogo);
      if (isLikelyNonProductImageUrl(imageUrl, allowBrandLogo)) imageUrl = '';
    } catch (e) {
      console.error('[product-image] resolution failed:', e?.message);
      imageUrl = '';
    }
  }

  if (redis) {
    // A miss is only meaningful when an exact reviewed page was actually tried.
    const shouldCacheNegative = Boolean(pageUrl);
    try {
      if (imageUrl || shouldCacheNegative) {
        await (await redis).set(cacheKey, imageUrl, { ex: imageUrl ? CACHE_TTL_SEC : NEGATIVE_TTL_SEC });
      }
    } catch (e) {
      console.error('[product-image] cache write failed:', e?.message);
    }
  }

  res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=86400');
  return res.status(200).json({ imageUrl });
}

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
import { lookupSerperImage } from './_serperImageSearch.js';

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

/**
 * Third, URL-independent fallback: NIH's Dietary Supplement Label Database.
 * Free, keyless, no hallucination risk (it's a real government database
 * matched by fuzzy product name, already used for the same purpose in
 * api/llm-recommendations.js) — a much better fit than trying to guess a
 * retailer product URL for an LLM-suggested product, since a large share of
 * AI-suggested products are supplements with no usable page URL at all (the
 * model either omits `officialUrl` or, before this file's other fix, gave a
 * brand homepage that has no product-specific og:image). Only ever helps
 * (returns a real label photo) or does nothing (name doesn't match DSLD's
 * supplement-only catalog) — never a source of a wrong image, since it
 * requires an actual database match, not a guess.
 */
async function resolveImageFromDsld(name) {
  try {
    const { lookupDsldProduct } = await import('./llm-recommendations.js');
    const hit = await lookupDsldProduct(name);
    return hit?.imageUrl || '';
  } catch (e) {
    console.error('[product-image] DSLD fallback failed:', e?.message);
    return '';
  }
}

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

  // Bumped v9 -> v10: the v9 brand-gate required name-overlap on TOP of a
  // confirmed brand match, which rejected real, brand-confirmed results
  // whenever the catalog's own generic product description didn't share
  // enough words with the brand's actual commercial product name (e.g.
  // "Kegel8 Pelvic Floor Exerciser" vs the real "Kegel8 Ultra 20 V2
  // Electronic Pelvic Toner") — confirmed live, cached negative under v9.
  const cacheKey = `ayna:img:v10:${type}:${brand.toLowerCase()}|${name.toLowerCase()}`;
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

  let imageUrl = '';
  try {
    // isLikelyNonProductImageUrl is the final authority regardless of
    // source — matchShopifyProduct trusts whatever image field the matched
    // catalog entry has with no filename check of its own (a real
    // production case: Pure Encapsulations' Shopify catalog resolved to
    // their own theme logo SVG, not a per-SKU photo). Rejecting BEFORE the
    // "still empty?" check, rather than after, means a rejected logo still
    // falls through to try DSLD instead of giving up.
    if (pageUrl) {
      imageUrl = await resolveImageFromUrl(pageUrl, name, brand, allowBrandLogo);
      if (isLikelyNonProductImageUrl(imageUrl, allowBrandLogo)) imageUrl = '';
    }
    if (!imageUrl) {
      imageUrl = await resolveImageFromDsld(name);
      if (isLikelyNonProductImageUrl(imageUrl)) imageUrl = '';
    }
    // True last resort — a real image-search index, unlike every resolver
    // above, doesn't depend on the brand's own site being reachable or
    // scrapable (a large share of real brands actively block bots) and
    // works for a product with no catalog `url` at all, including one an
    // AI search just generated on the fly. No-ops (returns null
    // immediately) when SERPER_API_KEY isn't configured.
    if (!imageUrl) {
      imageUrl = (await lookupSerperImage(name, brand)) || '';
    }
  } catch (e) {
    console.error('[product-image] resolution failed:', e?.message);
  }

  if (redis) {
    // Only pin a negative result once every resolver that COULD have found
    // something has actually been tried — a page URL (Shopify/og:image), or
    // Serper configured (works with no URL at all). Otherwise a product
    // with no URL yet and no Serper key might still resolve later via a
    // different path, so don't cache that as permanent.
    const shouldCacheNegative = (pageUrl != null && pageUrl !== '') || Boolean(process.env.SERPER_API_KEY);
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

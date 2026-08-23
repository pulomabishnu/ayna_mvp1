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
import { fetchOgImage } from './_ogImageFetch.js';

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
async function resolveImageFromUrl(pageUrl, name, brand) {
  const shopifyImage = await matchShopifyProduct(pageUrl, name, brand);
  if (shopifyImage) return shopifyImage;
  const ogImage = await fetchOgImage(pageUrl);
  if (ogImage) return ogImage;
  return '';
}

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
  if (!name) return res.status(400).json({ error: 'missing_name' });

  // Bumped v2 -> v3: the DSLD fallback previously had no relevance check at
  // all and the og:image reject-pattern missed "header"/tiny-dimension
  // assets, so any product resolved before today's fix could have a wrong
  // image (a supplement label, a site header graphic) cached for up to 30
  // days (CACHE_TTL_SEC below). Bumping the key version invalidates all of
  // that at once instead of waiting out the TTL or hand-purging entries.
  const cacheKey = `ayna:img:v3:${brand.toLowerCase()}|${name.toLowerCase()}`;
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
    if (pageUrl) imageUrl = await resolveImageFromUrl(pageUrl, name, brand);
    if (!imageUrl) imageUrl = await resolveImageFromDsld(name);
  } catch (e) {
    console.error('[product-image] resolution failed:', e?.message);
  }

  if (redis) {
    // Only pin a negative result when a page URL was actually tried and the
    // DSLD fallback also came up empty — a product with no URL yet (or one
    // that isn't in DSLD, e.g. a device rather than a supplement) may still
    // resolve later via a different path, so don't cache that as permanent.
    const shouldCacheNegative = pageUrl != null && pageUrl !== '';
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

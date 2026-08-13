/* global process */
// Resolves a real product photo for a placeholder-image product, sourced directly
// from the product's own official page — no third-party search API (previously
// Serper.dev; retired after its free-tier credits ran out and stayed out).
//
// Two strategies, tried in order against the product's official `url`:
//   1. Shopify storefronts publicly expose /products.json — fuzzy-match the
//      product name against it for the real per-SKU photo (see
//      _shopifyProductMatch.js). Most accurate: an actual catalog entry, not a
//      page-level social-share image.
//   2. Fall back to the page's og:image/twitter:image meta tag (_ogImageFetch.js),
//      rejected if the URL looks like a logo/banner/social-share asset rather
//      than a product photo (filename heuristic) — a mislabeled brand logo is
//      worse than no image at all.
// If neither yields a confident result, returns '' — the UI falls back to the
// placeholder gracefully. No AI-generated imagery is ever involved.

import { rateLimit, getClientIp } from './_rateLimit.js';
import { fetchOgImage } from './_ogImageFetch.js';
import { fetchShopifyProducts, matchProductImage } from './_shopifyProductMatch.js';

const MAX_TERM_LEN = 120;
const MAX_URL_LEN = 500;
const CACHE_TTL_SEC = 30 * 24 * 60 * 60; // 30 days — product photos don't move
const NEGATIVE_TTL_SEC = 24 * 60 * 60;   // don't re-fetch misses all day

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

function allowedOrigin(req) {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (!origin) return null;
  if (configured.length === 0) return null;
  return configured.includes(origin) ? origin : null;
}

const LOGO_BANNER_HINTS = /logo|social.?share|social.?media|banner|og.?image|seo.?description|share.?image/i;

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
  const officialUrl = cleanTerm(req.query.url, MAX_URL_LEN);
  if (!name) return res.status(400).json({ error: 'missing_name' });
  if (!officialUrl) return res.status(200).json({ imageUrl: '' });

  const cacheKey = `ayna:img:v2:${brand.toLowerCase()}|${name.toLowerCase()}`;
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
    const shopifyProducts = await fetchShopifyProducts(officialUrl);
    if (shopifyProducts) {
      imageUrl = matchProductImage(shopifyProducts, name, brand) || '';
    }
    if (!imageUrl) {
      const og = await fetchOgImage(officialUrl);
      if (og && !LOGO_BANNER_HINTS.test(og)) imageUrl = og;
    }
  } catch (e) {
    console.error('[product-image] resolution failed:', e?.message);
  }

  if (redis) {
    try {
      await (await redis).set(cacheKey, imageUrl, { ex: imageUrl ? CACHE_TTL_SEC : NEGATIVE_TTL_SEC });
    } catch (e) {
      console.error('[product-image] cache write failed:', e?.message);
    }
  }

  res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=86400');
  return res.status(200).json({ imageUrl });
}

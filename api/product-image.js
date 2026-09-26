/* global process */
// Returns a product image URL only from the exact official page URL already
// attached to the catalog item. We intentionally do NOT fuzzy-match a whole
// storefront, supplement database, or open-web image index: a missing photo
// is preferable to showing the wrong formulation, dosage, count, or category.
// The exact page's og:image/twitter:image is still rejected when it looks like
// a logo/banner/social-share asset.
//
// `url` is optional — the hardcoded catalog mostly doesn't have one yet, and
// without it there's no page to resolve against, so this returns empty
// (UI falls back to the 🌸 placeholder) rather than guessing.
//
// COST/ABUSE: this route is unauthenticated and could otherwise be hit
// directly by any caller — per-IP rate limit, a shared Redis cache so the
// cost is per PRODUCT rather than per product-per-browser, edge caching,
// input caps, and a request timeout on every outbound fetch.

import { createHash } from 'node:crypto';
import { rateLimit, getClientIp } from './_rateLimit.js';
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

async function resolveImageFromUrl(pageUrl, allowBrandLogo, name) {
  return (await fetchOgImage(pageUrl, allowBrandLogo, name)) || '';
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

  // v12 also includes the exact source page, so corrected variants do not
  // collide with prior photos under the same name and brand.
  const identity = createHash('sha256').update(JSON.stringify([type, brand.toLowerCase(), name.toLowerCase(), pageUrl])).digest('hex');
  const cacheKey = `ayna:img:v12:${identity}`;
  const redis = getRedis();

  if (redis) {
    try {
      const hit = await (await redis).get(cacheKey);
      if (typeof hit === 'string') {
        res.setHeader('Cache-Control', hit ? 'public, s-maxage=86400' : 'no-store');
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
    // Product integrity > image coverage. Only trust the exact catalog URL.
    // If it is absent, generic, blocked, or returns a non-product asset, the
    // UI deliberately shows its honest fallback instead of guessing.
    if (pageUrl) {
      imageUrl = await resolveImageFromUrl(pageUrl, allowBrandLogo, name);
      if (isLikelyNonProductImageUrl(imageUrl, allowBrandLogo)) imageUrl = '';
    }
  } catch (e) {
    console.error('[product-image] resolution failed:', e?.message);
  }

  if (redis) {
    // Only cache a negative when an exact page URL was actually checked.
    const shouldCacheNegative = Boolean(pageUrl);
    try {
      if (imageUrl || shouldCacheNegative) {
        await (await redis).set(cacheKey, imageUrl, { ex: imageUrl ? CACHE_TTL_SEC : NEGATIVE_TTL_SEC });
      }
    } catch (e) {
      console.error('[product-image] cache write failed:', e?.message);
    }
  }

  res.setHeader('Cache-Control', imageUrl ? 'public, s-maxage=86400' : 'no-store');
  return res.status(200).json({ imageUrl });
}

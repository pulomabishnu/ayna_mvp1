/* global process */
// Returns a product image URL using the Serper.dev Google Image Search API.
// Required Vercel env var: SERPER_API_KEY (free tier: 2,500 searches/month).
// If not configured, returns an empty string — the UI falls back to the 🌸
// placeholder gracefully.
//
// COST: every miss here is one billable Serper credit. This route was
// previously unauthenticated, wildcard-CORS, unthrottled, uncached and had no
// fetch timeout — `GET /api/product-image?name=x` billed Ayna's account for any
// anonymous caller from any origin, and the free tier could be drained in
// minutes by a trivial loop. Now: per-IP rate limit, a shared Redis cache so
// the cost is per PRODUCT rather than per product-per-browser, edge caching,
// input caps, and a request timeout.

import { rateLimit, getClientIp } from './_rateLimit.js';

const MAX_TERM_LEN = 120;
const CACHE_TTL_SEC = 30 * 24 * 60 * 60; // 30 days — product photos don't move
const NEGATIVE_TTL_SEC = 24 * 60 * 60;   // don't re-bill misses all month

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

function cleanTerm(v) {
  const raw = Array.isArray(v) ? v[0] : v;
  return String(raw || '').trim().replace(/\s+/g, ' ').slice(0, MAX_TERM_LEN);
}

function allowedOrigin(req) {
  const configured = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (!origin) return null;
  if (configured.length === 0) return null;
  return configured.includes(origin) ? origin : null;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  // Wildcard CORS let any third-party page drive this from its visitors'
  // browsers. Echo only a configured origin.
  const origin = allowedOrigin(req);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const name = cleanTerm(req.query.name);
  const brand = cleanTerm(req.query.brand);
  if (!name) return res.status(400).json({ error: 'missing_name' });

  const cacheKey = `ayna:img:${brand.toLowerCase()}|${name.toLowerCase()}`;
  const redis = getRedis();

  // Shared cache first — this is what turns the cost from
  // (users x products) into (products).
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

  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return res.status(200).json({ imageUrl: '' });

  const query = `${brand} ${name} product`.trim().replace(/\s+/g, ' ');

  try {
    const r = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, num: 3 }),
      // Was missing entirely: a stalled Serper call held the invocation open
      // to the function ceiling and was billed for the full wall clock.
      signal: AbortSignal.timeout(5000),
    });

    if (!r.ok) {
      // Quota exhaustion (402/429) is the failure most worth alerting on and
      // was previously the most silent.
      console.error('[product-image] serper error', r.status, (await r.text().catch(() => '')).slice(0, 200));
      return res.status(200).json({ imageUrl: '' });
    }

    const data = await r.json();
    const images = Array.isArray(data?.images) ? data.images : [];
    const imageUrl = images.map((i) => i.imageUrl || i.url || '').find((u) => u.startsWith('https://')) || '';

    if (redis) {
      try {
        await (await redis).set(cacheKey, imageUrl, { ex: imageUrl ? CACHE_TTL_SEC : NEGATIVE_TTL_SEC });
      } catch (e) {
        console.error('[product-image] cache write failed:', e?.message);
      }
    }

    res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=86400');
    return res.status(200).json({ imageUrl });
  } catch (e) {
    console.error('[product-image] request failed:', e?.message);
    return res.status(200).json({ imageUrl: '' });
  }
}

/* global process */
/**
 * Shared, durable rate limiting.
 *
 * The in-process `Map` limiters previously used for phone verification do not
 * work on Vercel: each concurrent request can land on a cold isolate with an
 * empty Map, so a "3 per hour" cap became "3 per hour PER ISOLATE" — which an
 * attacker controls by simply firing requests in parallel. For SMS that is
 * toll-fraud exposure (any E.164 number was accepted, including premium-rate
 * international ranges), so those call sites now FAIL CLOSED when no durable
 * store is configured.
 */

const memoryBuckets = new Map();
const MEMORY_MAP_MAX = 8000;

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

export function isDurableStoreConfigured() {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function memoryLimit(key, max, windowMs) {
  const now = Date.now();
  let b = memoryBuckets.get(key);
  if (!b || now - b.start >= windowMs) {
    if (memoryBuckets.size > MEMORY_MAP_MAX) {
      const first = memoryBuckets.keys().next().value;
      if (first !== undefined) memoryBuckets.delete(first);
    }
    memoryBuckets.set(key, { start: now, count: 1 });
    return { ok: true, remaining: max - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (b.count >= max) {
    return { ok: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil((b.start + windowMs - now) / 1000)) };
  }
  b.count += 1;
  return { ok: true, remaining: max - b.count, retryAfterSec: Math.ceil(windowMs / 1000) };
}

/**
 * Fixed-window counter backed by Redis INCR + EXPIRE (atomic, shared across
 * every serverless instance).
 *
 * @param {string} key      caller-scoped identity, e.g. `sms:user:<id>`
 * @param {object} opts
 * @param {number} opts.max            requests allowed per window
 * @param {number} opts.windowSec      window length in seconds
 * @param {boolean} [opts.failClosed]  when no durable store is configured:
 *   true  -> deny (use for anything that spends real money per request)
 *   false -> fall back to best-effort in-memory
 * @returns {Promise<{ok: boolean, retryAfterSec?: number, limiter: string}>}
 */
export async function rateLimit(key, { max, windowSec, failClosed = false } = {}) {
  const p = getRedis();
  if (p) {
    try {
      const redis = await p;
      const bucket = `ayna:rl:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`;
      const count = await redis.incr(bucket);
      if (count === 1) await redis.expire(bucket, windowSec);
      if (count > max) {
        return { ok: false, retryAfterSec: windowSec, limiter: 'upstash' };
      }
      return { ok: true, limiter: 'upstash' };
    } catch (e) {
      console.error('[rateLimit] upstash error:', e?.message);
      if (failClosed) {
        return { ok: false, retryAfterSec: 60, limiter: 'upstash-error-failclosed' };
      }
    }
  } else if (failClosed) {
    console.error(
      `[rateLimit] no durable store configured and "${key}" is fail-closed. ` +
      'Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN — an in-process ' +
      'counter cannot rate limit a serverless function.'
    );
    return { ok: false, retryAfterSec: 60, limiter: 'none-failclosed' };
  }

  const mem = memoryLimit(key, max, windowSec * 1000);
  return { ok: mem.ok, retryAfterSec: mem.retryAfterSec, limiter: 'memory' };
}

/** Trust only the platform-set header; the others are spoofable. */
export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd[0]) return String(fwd[0]).trim();
  return 'unknown';
}

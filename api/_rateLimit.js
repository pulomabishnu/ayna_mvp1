/* global process */

const memoryBuckets = new Map();
const MEMORY_MAP_MAX = 8000;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

let redisPromise = null;
function getRedis() {
  const config = redisConfig();
  if (!config) return null;
  if (!redisPromise) {
    redisPromise = (async () => {
      const { Redis } = await import('@upstash/redis');
      return new Redis(config);
    })();
  }
  return redisPromise;
}

export function isDurableStoreConfigured() {
  return Boolean(redisConfig());
}

function memoryLimit(key, max, windowMs) {
  const now = Date.now();
  let bucket = memoryBuckets.get(key);

  if (!bucket || now - bucket.start >= windowMs) {
    if (memoryBuckets.size > MEMORY_MAP_MAX) {
      const first = memoryBuckets.keys().next().value;
      if (first !== undefined) memoryBuckets.delete(first);
    }
    memoryBuckets.set(key, { start: now, count: 1 });
    return { ok: true, remaining: max - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }

  if (bucket.count >= max) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.start + windowMs - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true, remaining: max - bucket.count, retryAfterSec: Math.ceil(windowMs / 1000) };
}

export async function rateLimit(key, { max, windowSec, failClosed = false } = {}) {
  const redisClient = getRedis();

  if (redisClient) {
    try {
      const redis = await redisClient;
      const bucket = `ayna:rl:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`;
      const count = await redis.incr(bucket);
      if (count === 1) await redis.expire(bucket, windowSec);
      if (count > max) return { ok: false, retryAfterSec: windowSec, limiter: 'redis' };
      return { ok: true, limiter: 'redis' };
    } catch (e) {
      console.error('[rateLimit] durable store error:', e?.message);
      if (failClosed) return { ok: false, retryAfterSec: 60, limiter: 'redis-error-failclosed' };
    }
  } else if (failClosed) {
    console.error(`[rateLimit] no durable store configured for fail-closed key "${key}".`);
    return { ok: false, retryAfterSec: 60, limiter: 'none-failclosed' };
  }

  const mem = memoryLimit(key, max, windowSec * 1000);
  return { ok: mem.ok, retryAfterSec: mem.retryAfterSec, limiter: 'memory' };
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  if (Array.isArray(forwarded) && forwarded[0]) return String(forwarded[0]).trim();
  return 'unknown';
}

/**
 * Rate limiting for /api/product-insights (cost protection).
 * - Prefer Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set (accurate across serverless instances).
 * - Otherwise fixed-window in-memory per IP (best-effort on warm instances).
 *
 * Env:
 *   AI_INSIGHTS_RATE_LIMIT_MAX — max requests per window (default 15)
 *   AI_INSIGHTS_RATE_LIMIT_WINDOW — e.g. "1 h", "30 m" (Upstash + memory; default "1 h")
 *   DISABLE_AI_INSIGHTS_RATE_LIMIT — set to "1" or "true" to skip (local dev only)
 */

/* global process */

const DEFAULT_MAX = 15;
const DEFAULT_WINDOW_STR = '1 h';

/** @type {Map<string, { start: number, count: number }>} */
const memoryBuckets = new Map();
const MEMORY_MAP_MAX = 8000;

function parsePositiveInt(v, fallback) {
  const n = parseInt(String(v || '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Parse "1 h", "30m", "120s" into milliseconds for memory fallback. */
function parseWindowToMs(windowStr) {
  const t = String(windowStr || '').trim().toLowerCase();
  const m = t.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hour|hours|m|min|minute|minutes|s|sec|second|seconds)?$/);
  if (!m) return 60 * 60 * 1000;
  const n = parseFloat(m[1]);
  const unit = m[2] || 's';
  if (unit.startsWith('h')) return Math.round(n * 60 * 60 * 1000);
  if (unit.startsWith('m')) return Math.round(n * 60 * 1000);
  return Math.round(n * 1000);
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return String(forwarded[0]).trim();
  }
  const real = req.headers['x-real-ip'];
  if (typeof real === 'string' && real.trim()) return real.trim();
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.trim()) return cf.trim();
  try {
    const ra = req.socket?.remoteAddress;
    if (typeof ra === 'string' && ra.trim()) return ra.trim();
  } catch {
    /* remoteAddress may be unavailable */
  }
  return 'unknown';
}

function isRateLimitDisabled(ip) {
  if (process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT === '1' || /^true$/i.test(process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT || '')) {
    return true;
  }
  const local = new Set(['127.0.0.1', '::1', 'localhost']);
  return local.has(ip);
}

function memoryFixedWindowLimit(ip, max, windowMs) {
  const now = Date.now();
  let b = memoryBuckets.get(ip);
  if (!b || now - b.start >= windowMs) {
    b = { start: now, count: 1 };
    memoryBuckets.set(ip, b);
    if (memoryBuckets.size > MEMORY_MAP_MAX) {
      const first = memoryBuckets.keys().next().value;
      memoryBuckets.delete(first);
    }
    return { success: true, remaining: max - 1, retryAfterSec: Math.ceil(windowMs / 1000) };
  }
  if (b.count >= max) {
    const retryAfterMs = Math.max(0, b.start + windowMs - now);
    return { success: false, remaining: 0, retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }
  b.count += 1;
  memoryBuckets.set(ip, b);
  return { success: true, remaining: max - b.count, retryAfterSec: Math.ceil(windowMs / 1000) };
}

let upstashLimiterPromise = null;

function getUpstashLimiterPromise() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  if (!upstashLimiterPromise) {
    upstashLimiterPromise = (async () => {
      const { Ratelimit } = await import('@upstash/ratelimit');
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({ url, token });
      const max = parsePositiveInt(process.env.AI_INSIGHTS_RATE_LIMIT_MAX, DEFAULT_MAX);
      const windowStr = (process.env.AI_INSIGHTS_RATE_LIMIT_WINDOW || DEFAULT_WINDOW_STR).trim() || DEFAULT_WINDOW_STR;
      return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(max, windowStr),
        analytics: false,
        prefix: 'ayna:product-insights',
      });
    })();
  }
  return upstashLimiterPromise;
}

/**
 * @returns {Promise<{ ok: boolean, retryAfterSec?: number, limiter?: string }>}
 */
export async function checkProductInsightsRateLimit(req) {
  const ip = getClientIp(req);
  if (isRateLimitDisabled(ip)) {
    return { ok: true, limiter: 'skipped' };
  }

  const max = parsePositiveInt(process.env.AI_INSIGHTS_RATE_LIMIT_MAX, DEFAULT_MAX);
  const windowStr = (process.env.AI_INSIGHTS_RATE_LIMIT_WINDOW || DEFAULT_WINDOW_STR).trim() || DEFAULT_WINDOW_STR;
  const windowMs = parseWindowToMs(windowStr);

  const limiterPromise = getUpstashLimiterPromise();
  if (limiterPromise) {
    try {
      const limiter = await limiterPromise;
      const id = `ip:${ip}`;
      const result = await limiter.limit(id);
      if (!result.success) {
        const resetMs = result.reset - Date.now();
        return {
          ok: false,
          retryAfterSec: Math.max(1, Math.ceil(resetMs / 1000)),
          limiter: 'upstash',
        };
      }
      return { ok: true, limiter: 'upstash' };
    } catch (e) {
      console.error('product-insights rate limit (upstash):', e);
    }
  }

  const mem = memoryFixedWindowLimit(ip, max, windowMs);
  if (!mem.success) {
    return { ok: false, retryAfterSec: mem.retryAfterSec, limiter: 'memory' };
  }
  return { ok: true, limiter: 'memory' };
}

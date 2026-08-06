/* global process */
/**
 * Rate limiting for /api/product-insights and /api/search-suggestions (LLM cost protection).
 *
 * Thin wrapper over the shared durable limiter in _rateLimit.js. This used to carry its
 * own separate Upstash + in-memory implementation and, unlike every other rate-limited
 * route in this codebase, never failed closed when Upstash wasn't configured — it just
 * fell back to a per-isolate memory counter, so concurrent cold starts could bypass the
 * cap entirely. That's the same cost-abuse shape (unlimited billed calls) the SMS limiter
 * in _rateLimit.js was built to close; these two routes now get the same protection.
 *
 * Env:
 *   AI_INSIGHTS_RATE_LIMIT_MAX — max requests per window (default 15)
 *   AI_INSIGHTS_RATE_LIMIT_WINDOW — e.g. "1 h", "30 m" (default "1 h")
 *   DISABLE_AI_INSIGHTS_RATE_LIMIT — set to "1" or "true" to skip (local dev only)
 */

import { rateLimit, getClientIp } from './_rateLimit.js';

const DEFAULT_MAX = 15;
const DEFAULT_WINDOW_STR = '1 h';

function parsePositiveInt(v, fallback) {
  const n = parseInt(String(v || '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Parse "1 h", "30m", "120s" into seconds. */
function parseWindowToSec(windowStr) {
  const t = String(windowStr || '').trim().toLowerCase();
  const m = t.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hour|hours|m|min|minute|minutes|s|sec|second|seconds)?$/);
  if (!m) return 3600;
  const n = parseFloat(m[1]);
  const unit = m[2] || 's';
  if (unit.startsWith('h')) return Math.round(n * 3600);
  if (unit.startsWith('m')) return Math.round(n * 60);
  return Math.round(n);
}

function isRateLimitDisabled(ip) {
  if (process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT === '1' || /^true$/i.test(process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT || '')) {
    return true;
  }
  const local = new Set(['127.0.0.1', '::1', 'localhost']);
  return local.has(ip);
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
  const windowSec = parseWindowToSec(process.env.AI_INSIGHTS_RATE_LIMIT_WINDOW || DEFAULT_WINDOW_STR);

  // TEMPORARY: failClosed is false here, not true. UPSTASH_REDIS_REST_URL/
  // _TOKEN are not actually configured in this project's Vercel env (verified
  // via `vercel env ls` — no Upstash vars present in Production or Preview),
  // so failClosed: true took these two routes down in production entirely
  // (confirmed live: /api/search-suggestions returned 429 to a fresh,
  // unauthenticated request). Revert to failClosed: true once real Upstash
  // credentials are added — see the incident note in DEPLOY.md.
  const result = await rateLimit(`ai-insights:ip:${ip}`, { max, windowSec, failClosed: false });
  return { ok: result.ok, retryAfterSec: result.retryAfterSec, limiter: result.limiter };
}

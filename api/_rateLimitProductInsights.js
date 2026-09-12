/* global process */
import { rateLimit, getClientIp } from './_rateLimit.js';

const DEFAULT_MAX = 15;
const DEFAULT_WINDOW_STR = '1 h';

function parsePositiveInt(value, fallback) {
  const n = parseInt(String(value || '').trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseWindowToSec(windowStr) {
  const text = String(windowStr || '').trim().toLowerCase();
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(h|hr|hour|hours|m|min|minute|minutes|s|sec|second|seconds)?$/);
  if (!match) return 3600;
  const n = parseFloat(match[1]);
  const unit = match[2] || 's';
  if (unit.startsWith('h')) return Math.round(n * 3600);
  if (unit.startsWith('m')) return Math.round(n * 60);
  return Math.round(n);
}

function isRateLimitDisabled(ip) {
  if (process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT === '1' || /^true$/i.test(process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT || '')) {
    return true;
  }
  return new Set(['127.0.0.1', '::1', 'localhost']).has(ip);
}

export async function checkProductInsightsRateLimit(req) {
  const ip = getClientIp(req);
  if (isRateLimitDisabled(ip)) return { ok: true, limiter: 'skipped' };

  const max = parsePositiveInt(process.env.AI_INSIGHTS_RATE_LIMIT_MAX, DEFAULT_MAX);
  const windowSec = parseWindowToSec(process.env.AI_INSIGHTS_RATE_LIMIT_WINDOW || DEFAULT_WINDOW_STR);

  // Product insights and AI search create paid model requests. In serverless,
  // an in-memory fallback is not a real global rate limit, so fail closed when
  // the durable Redis/KV store is unavailable instead of allowing unbounded cost.
  const result = await rateLimit(`ai-insights:ip:${ip}`, { max, windowSec, failClosed: true });
  return { ok: result.ok, retryAfterSec: result.retryAfterSec, limiter: result.limiter };
}

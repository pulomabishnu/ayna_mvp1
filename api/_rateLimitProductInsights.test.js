/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const rateLimitMock = vi.fn();
vi.mock('./_rateLimit.js', () => ({
  rateLimit: (...args) => rateLimitMock(...args),
  getClientIp: () => '203.0.113.5',
}));

let checkProductInsightsRateLimit;

beforeEach(async () => {
  vi.resetModules();
  rateLimitMock.mockReset();
  delete process.env.AI_INSIGHTS_RATE_LIMIT_MAX;
  delete process.env.AI_INSIGHTS_RATE_LIMIT_WINDOW;
  delete process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT;
  ({ checkProductInsightsRateLimit } = await import('./_rateLimitProductInsights.js'));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('checkProductInsightsRateLimit', () => {
  it('delegates to the shared durable limiter', async () => {
    rateLimitMock.mockResolvedValue({ ok: true, limiter: 'upstash' });
    const result = await checkProductInsightsRateLimit({ headers: {} });
    expect(result).toEqual({ ok: true, retryAfterSec: undefined, limiter: 'upstash' });
    expect(rateLimitMock).toHaveBeenCalledWith(
      'ai-insights:ip:203.0.113.5',
      expect.objectContaining({ max: 15, windowSec: 3600 })
    );
  });

  // TEMPORARY: failClosed is false until real Upstash credentials are
  // configured in Vercel — see the note in _rateLimitProductInsights.js.
  // failClosed: true took these routes down in production with no durable
  // store configured; flip this back once UPSTASH_REDIS_REST_URL/_TOKEN
  // are actually set.
  it('does NOT fail closed yet — falls back to best-effort memory limiting when the shared limiter denies', async () => {
    rateLimitMock.mockResolvedValue({ ok: true, limiter: 'memory' });
    const result = await checkProductInsightsRateLimit({ headers: {} });
    expect(result.ok).toBe(true);
    expect(rateLimitMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ failClosed: false }));
  });

  it('parses AI_INSIGHTS_RATE_LIMIT_MAX and _WINDOW overrides into seconds', async () => {
    process.env.AI_INSIGHTS_RATE_LIMIT_MAX = '5';
    process.env.AI_INSIGHTS_RATE_LIMIT_WINDOW = '30 m';
    rateLimitMock.mockResolvedValue({ ok: true, limiter: 'upstash' });
    await checkProductInsightsRateLimit({ headers: {} });
    expect(rateLimitMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ max: 5, windowSec: 1800 })
    );
  });

  it('skips the limiter entirely for localhost, never reaching the shared limiter', async () => {
    vi.resetModules();
    vi.doMock('./_rateLimit.js', () => ({
      rateLimit: rateLimitMock,
      getClientIp: () => '127.0.0.1',
    }));
    const mod = await import('./_rateLimitProductInsights.js');
    const result = await mod.checkProductInsightsRateLimit({ headers: {} });
    expect(result).toEqual({ ok: true, limiter: 'skipped' });
    expect(rateLimitMock).not.toHaveBeenCalled();
  });

  it('skips the limiter when DISABLE_AI_INSIGHTS_RATE_LIMIT is set, for any IP', async () => {
    process.env.DISABLE_AI_INSIGHTS_RATE_LIMIT = '1';
    const result = await checkProductInsightsRateLimit({ headers: {} });
    expect(result).toEqual({ ok: true, limiter: 'skipped' });
    expect(rateLimitMock).not.toHaveBeenCalled();
  });
});

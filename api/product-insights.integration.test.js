/**
 * End-to-end tests for /api/product-insights.
 *
 * This is a money path (billed LLM calls) with the same reserve-before-spend
 * quota shape as product-chat.js, plus its own IP rate limiter and the
 * legacy client-writable is_premium flag it shares with every other paid
 * route. Supabase, the rate limiter, and fetch are mocked; everything
 * between the request and the response is the real handler.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, mockSupabase, withEnv, anthropicOk } from './_test-helpers.js';

const realFetch = globalThis.fetch;
let restoreEnv;
let supa;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockSupabase,
}));

const rateLimitResult = { ok: true };
vi.mock('./_rateLimitProductInsights.js', () => ({
  checkProductInsightsRateLimit: () => Promise.resolve(rateLimitResult),
}));

async function loadHandler() {
  vi.resetModules();
  return (await import('./product-insights.js')).default;
}

const validBody = {
  product: { id: 'p1', name: 'DivaCup', category: 'cup', summary: 'A menstrual cup.' },
};

function insightsJson(overrides = {}) {
  return JSON.stringify({
    clinicalNarrative: 'Generally considered safe for most users; confirm fit with a clinician.',
    scienceSummary: '',
    communitySummary: '',
    ...overrides,
  });
}

beforeEach(() => {
  rateLimitResult.ok = true;
  restoreEnv = withEnv({
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ANTHROPIC_API_KEY: 'test-key',
    OPENAI_API_KEY: undefined,
    AI_INSIGHTS_PROVIDER_ORDER: 'claude',
  });
  supa = mockSupabase({
    rpcResults: {
      consume_ai_usage: { data: [{ allowed: true, used: 1 }], error: null },
      refund_ai_usage: { data: 1, error: null },
    },
  });
  globalThis.__mockSupabase = supa;
});

afterEach(() => {
  restoreEnv();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('POST /api/product-insights — quota accounting', () => {
  it('reserves the quota BEFORE calling the provider', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(insightsJson()));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(200);
    expect(supa.rpcCalls.map((c) => c.name)).toContain('consume_ai_usage');
  });

  it('REFUNDS when every provider fails', async () => {
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 500, headers: new Headers(), text: async () => 'err' }));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(502);
    expect(supa.rpcCalls.map((c) => c.name)).toContain('refund_ai_usage');
  });

  it('does NOT refund on success', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(insightsJson()));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(200);
    expect(supa.rpcCalls.map((c) => c.name)).not.toContain('refund_ai_usage');
  });

  it('returns 429 without calling the provider when over the weekly quota', async () => {
    supa = mockSupabase({
      rpcResults: { consume_ai_usage: { data: [{ allowed: false, used: 5, limit: 5 }], error: null } },
    });
    globalThis.__mockSupabase = supa;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('weekly_limit_reached');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not consume quota at all for a premium user', async () => {
    globalThis.__mockSupabase = mockSupabase({
      user: { id: 'u', app_metadata: { is_premium: true }, user_metadata: {} },
    });
    globalThis.fetch = vi.fn(async () => anthropicOk(insightsJson()));

    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(200);
    expect(globalThis.__mockSupabase.rpcCalls).toHaveLength(0);
  });

  it('IGNORES client-writable user_metadata.is_premium and logs it for migration', async () => {
    globalThis.__mockSupabase = mockSupabase({
      user: { id: 'u', app_metadata: {}, user_metadata: { is_premium: true } },
      rpcResults: { consume_ai_usage: { data: [{ allowed: false, used: 5, limit: 5 }], error: null } },
    });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);

    expect(res.statusCode).toBe(429);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('legacy client-writable is_premium flag'));
    warnSpy.mockRestore();
  });
});

describe('POST /api/product-insights — rate limiting', () => {
  it('429s and never touches quota or the provider when IP rate limited', async () => {
    rateLimitResult.ok = false;
    rateLimitResult.retryAfterSec = 30;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('rate_limited');
    expect(res.headers['retry-after']).toBe('30');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(supa.rpcCalls).toHaveLength(0);
  });
});

describe('POST /api/product-insights — input handling', () => {
  it('rejects an unauthenticated request before touching rate limit or quota', async () => {
    globalThis.__mockSupabase = mockSupabase({ user: null, authError: { message: 'bad token' } });
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(401);
    expect(globalThis.__mockSupabase.rpcCalls).toHaveLength(0);
  });

  it('400s when the product is missing, without ever touching quota', async () => {
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Missing product');
    expect(supa.rpcCalls).toHaveLength(0);
  });

  it('400s when the product has no name, without ever touching quota', async () => {
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: { product: { id: 'p1' } } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Missing product name');
    expect(supa.rpcCalls).toHaveLength(0);
  });

  it('400s on invalid JSON body, without ever touching quota', async () => {
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: '{not json' }), res);
    expect(res.statusCode).toBe(400);
    expect(supa.rpcCalls).toHaveLength(0);
  });

  it('503s with a clear hint when no provider key is configured, without ever touching quota', async () => {
    restoreEnv();
    restoreEnv = withEnv({
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      ANTHROPIC_API_KEY: undefined,
      OPENAI_API_KEY: undefined,
    });
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('not_configured');
    // A misconfigured deployment must not burn a user's weekly quota for a
    // request that could never have succeeded.
    expect(supa.rpcCalls).toHaveLength(0);
  });
});

describe('POST /api/product-insights — success shape', () => {
  it('returns the normalized insight fields and marks the provider used', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(insightsJson({ quickOverviewPros: ['Reusable', 'Cost-effective'] })));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.clinicalNarrative).toMatch(/generally considered safe/i);
    expect(res.body.providerUsed).toBe('claude');
    expect(res.body.quickOverviewPros).toEqual(['Reusable', 'Cost-effective']);
  });
});

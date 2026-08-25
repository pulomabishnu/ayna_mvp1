/* global process */
/**
 * End-to-end tests for /api/ask-ayna — the global Ask Ayna widget's real
 * backend (see the file's own header for why it exists). Mirrors
 * product-chat.integration.test.js's approach: mock Supabase + fetch only,
 * exercise the real handler for auth, quota accounting, JSON parsing, and
 * error mapping.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, mockSupabase, withEnv, anthropicOk, httpError } from './_test-helpers.js';

const realFetch = globalThis.fetch;
let restoreEnv;
let supa;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockSupabase,
}));

async function loadHandler() {
  vi.resetModules();
  return (await import('./ask-ayna.js')).default;
}

const validBody = { message: 'How do I insert a menstrual cup?' };

function jsonReply(overrides = {}) {
  return JSON.stringify({
    answer: 'Fold it into a C or punch-down fold, then insert angled toward your lower back.',
    profileUpdate: { frustrations: [], sensitivities: [], productsToAvoid: [], preference: null },
    browseIntent: null,
    ...overrides,
  });
}

beforeEach(() => {
  restoreEnv = withEnv({
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ANTHROPIC_API_KEY: 'test-key',
    OPENAI_API_KEY: undefined,
    AI_INSIGHTS_PROVIDER_ORDER: 'anthropic',
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

describe('POST /api/ask-ayna', () => {
  it('answers a real question — not the old "no concerns found" keyword-parser non-answer', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(jsonReply()));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.answer).toMatch(/fold|insert/i);
    expect(res.body.profileUpdate).toEqual({ frustrations: [], sensitivities: [], productsToAvoid: [], preference: null });
  });

  it('parses a profileUpdate the model returned and reports it back', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(jsonReply({
      profileUpdate: { frustrations: ['Painful cramps'], sensitivities: [], productsToAvoid: [], preference: null },
    })));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: { message: 'I get really bad cramps every month' } }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.profileUpdate.frustrations).toEqual(['Painful cramps']);
  });

  it('rejects a request with no message', async () => {
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: {} }), res);
    expect(res.statusCode).toBe(400);
  });

  it('401s when not authenticated', async () => {
    supa = mockSupabase({ authError: { message: 'invalid token' } });
    globalThis.__mockSupabase = supa;
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);
    expect(res.statusCode).toBe(401);
  });

  it('429s at the weekly quota, before ever calling the provider', async () => {
    supa.rpc.mockImplementation(async (name) => {
      if (name === 'consume_ai_usage') return { data: [{ allowed: false, used: 5, limit: 5 }], error: null };
      return { data: null, error: null };
    });
    const providerCalled = vi.fn();
    globalThis.fetch = vi.fn(async () => { providerCalled(); return anthropicOk(jsonReply()); });

    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);

    expect(res.statusCode).toBe(429);
    expect(providerCalled).not.toHaveBeenCalled();
  });

  it('reserves the quota BEFORE calling the provider', async () => {
    const order = [];
    supa.rpc.mockImplementation(async (name) => {
      order.push(`rpc:${name}`);
      return { data: [{ allowed: true, used: 1 }], error: null };
    });
    globalThis.fetch = vi.fn(async () => { order.push('provider'); return anthropicOk(jsonReply()); });

    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);

    expect(res.statusCode).toBe(200);
    expect(order[0]).toBe('rpc:consume_ai_usage');
    expect(order.indexOf('rpc:consume_ai_usage')).toBeLessThan(order.indexOf('provider'));
  });

  it('refunds the quota when every provider fails', async () => {
    globalThis.fetch = vi.fn(async () => httpError(401)); // non-retryable
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);

    const refunded = supa.rpcCalls.filter((c) => c.name === 'refund_ai_usage');
    expect(refunded).toHaveLength(1);
    expect(res.statusCode).toBe(502);
  });

  it('refunds the quota when the model reply is not parseable JSON', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk('not json at all, just prose'));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);

    const refunded = supa.rpcCalls.filter((c) => c.name === 'refund_ai_usage');
    expect(refunded).toHaveLength(1);
    expect(res.statusCode).toBe(502);
  });

  it('caps profileUpdate arrays and drops non-string entries defensively', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(jsonReply({
      profileUpdate: {
        frustrations: Array.from({ length: 20 }, (_, i) => `Concern ${i}`),
        sensitivities: [123, null, 'Latex allergy'],
        productsToAvoid: [],
        preference: null,
      },
    })));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: validBody }), res);

    expect(res.body.profileUpdate.frustrations).toHaveLength(10);
    expect(res.body.profileUpdate.sensitivities).toEqual(['Latex allergy']);
  });

  it('passes through a real browseIntent so the app can navigate', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(jsonReply({ browseIntent: { category: 'pad' } })));
    const res = mockRes();
    await (await loadHandler())(mockReq({ body: { message: 'show me some pads' } }), res);

    expect(res.body.browseIntent).toEqual({ category: 'pad' });
  });
});

/* global process */
/**
 * End-to-end tests for /api/llm-recommendations.
 *
 * This is the core feature and the most complex handler, and it was the last one
 * with no coverage at the handler level. Four things here are load-bearing and
 * all four are client-influenced, which is what makes them worth pinning:
 *
 *  1. The build quota is claimed per BUILD, not per request. The old
 *     `batchIndex === 0` gate let any client skip the quota entirely by sending
 *     batchIndex >= 1.
 *  2. batchIndex/batchSize were unbounded, so `batchSize: 500` issued 500
 *     sequential LLM calls off a single request.
 *  3. A failed generation must RELEASE the claim — otherwise a timeout
 *     permanently burned the user's one lifetime build.
 *  4. Premium comes from app_metadata only. user_metadata is client-writable.
 *
 * Supabase and fetch are mocked; everything in between is the real handler.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, mockSupabase, withEnv, anthropicOk } from './_test-helpers.js';

const realFetch = globalThis.fetch;
let restoreEnv;
let supa;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockSupabase,
}));

async function loadHandler() {
  vi.resetModules();
  return (await import('./llm-recommendations.js')).default;
}

/** A representative intake. Expands to 9 concerns — under MAX_CONCERNS. */
const wideIntake = {
  age: 31,
  location: '94110',
  conditions: ['PCOS', 'Endometriosis'],
  symptoms: ['bloating', 'cramps', 'insomnia', 'mood', 'acne'],
  goals: ['fertility', 'gut health', 'menopause', 'UTI', 'hormone balance'],
};

/**
 * Expands to 20 concerns, i.e. genuinely past MAX_CONCERNS (18, raised from
 * 12 — the "What do you want help with?" quiz alone has 16 checkbox
 * options, so 12 was silently truncating real user selections; see
 * MAX_CONCERNS's own comment in llm-recommendations.js).
 * wideIntake is NOT sufficient to test the cap — at 9 concerns an uncapped
 * handler produces the same call count as a capped one, so the assertion
 * passes either way. This intake is what makes the cap observable.
 */
const hugeIntake = {
  age: 31,
  location: '94110',
  conditions: ['PCOS', 'Endometriosis', 'perimenopause'],
  symptoms: ['bloating', 'cramps', 'insomnia', 'mood', 'acne', 'fatigue', 'UTI', 'gut'],
  goals: ['fertility', 'gut health', 'menopause', 'UTI', 'hormone balance', 'sleep', 'skin', 'energy', 'mental health'],
  customConcerns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'],
};

/** One well-formed concern payload, shaped as the prompt schema requires. */
function recPayload(concern = 'Sleep and energy') {
  return JSON.stringify({
    recommendations: [{
      concern,
      tiers: [{ tier: 'best', product: { name: 'Magnesium Glycinate', brand: 'Acme', why: 'helps sleep' } }],
    }],
  });
}

function claimingSupabase(overrides = {}) {
  return mockSupabase({
    rpcResults: {
      claim_ecosystem_build: { data: [{ allowed: true, used: 1 }], error: null },
      release_ecosystem_build: { data: null, error: null },
      ...overrides,
    },
  });
}

beforeEach(() => {
  restoreEnv = withEnv({
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    ANTHROPIC_API_KEY: 'test-key',
    OPENAI_API_KEY: undefined,
    AI_RECOMMENDATIONS_PROVIDER_ORDER: 'anthropic',
    LLM_CONCERN_CONCURRENCY: '3',
  });
  supa = claimingSupabase();
  globalThis.__mockSupabase = supa;
});

afterEach(() => {
  restoreEnv();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('POST /api/llm-recommendations — build quota', () => {
  it('claims the build even when batchIndex > 0 (the old quota bypass)', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-1', batchIndex: 3, batchSize: 2 } }), res);

    const claims = supa.rpcCalls.filter((c) => c.name === 'claim_ecosystem_build');
    expect(claims).toHaveLength(1);
    expect(claims[0].args.p_build_id).toBe('b-1');
  });

  it('rejects a non-premium request with no buildId rather than generating for free', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake } }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('missing_build_id');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('short-circuits with 429 when the build limit is reached, without calling the provider', async () => {
    globalThis.__mockSupabase = supa = claimingSupabase({
      claim_ecosystem_build: { data: [{ allowed: false, used: 1 }], error: null },
    });
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-2' } }), res);

    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('ecosystem_limit_reached');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('releases the claim when nothing usable came back, so the build is retryable', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk('not json at all'));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-3' } }), res);

    expect(res.statusCode).toBe(502);
    expect(res.body.error).toBe('generation_failed');
    const released = supa.rpcCalls.filter((c) => c.name === 'release_ecosystem_build');
    expect(released).toHaveLength(1);
    expect(released[0].args.p_build_id).toBe('b-3');
  });

  it('does NOT release the claim on a successful build', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-4' } }), res);

    expect(res.statusCode).toBe(200);
    expect(supa.rpcCalls.some((c) => c.name === 'release_ecosystem_build')).toBe(false);
  });

  it('skips the quota entirely for a premium user', async () => {
    globalThis.__mockSupabase = supa = mockSupabase({
      user: { id: 'u-p', email: 'p@x.com', app_metadata: { is_premium: true }, user_metadata: {} },
      rpcResults: { claim_ecosystem_build: { data: [{ allowed: true, used: 1 }], error: null } },
    });
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake } }), res);

    expect(res.statusCode).toBe(200);
    expect(supa.rpcCalls.some((c) => c.name === 'claim_ecosystem_build')).toBe(false);
  });

  it('ignores client-writable user_metadata.is_premium (privilege escalation)', async () => {
    globalThis.__mockSupabase = supa = claimingSupabase();
    supa.auth.getUser = vi.fn(async () => ({
      data: { user: { id: 'u-x', email: 'x@x.com', app_metadata: {}, user_metadata: { is_premium: true } } },
      error: null,
    }));
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-5' } }), res);

    // Treated as free: the quota was claimed rather than skipped.
    expect(supa.rpcCalls.some((c) => c.name === 'claim_ecosystem_build')).toBe(true);
  });
});

describe('POST /api/llm-recommendations — client-controlled fan-out caps', () => {
  it('caps batchSize at MAX_BATCH_SIZE so batchSize:500 cannot issue 500 calls', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: hugeIntake, buildId: 'b-6', batchIndex: 0, batchSize: 500 } }), res);

    expect(res.statusCode).toBe(200);
    // Exactly MAX_BATCH_SIZE calls. Uncapped this would be one per concern.
    expect(globalThis.fetch.mock.calls.length).toBe(6);
  });

  it('caps total concerns at MAX_CONCERNS even with no batching', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    // hugeIntake expands to 20 concerns; exactly 18 may reach the provider.
    await handler(mockReq({ body: { intake: hugeIntake, buildId: 'b-7' } }), res);

    expect(res.statusCode).toBe(200);
    expect(globalThis.fetch.mock.calls.length).toBe(18);
  });

  it('clamps a negative batchIndex instead of slicing backwards', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-8', batchIndex: -5, batchSize: 2 } }), res);

    expect(res.statusCode).toBe(200);
    expect(globalThis.fetch.mock.calls.length).toBeGreaterThan(0);
  });
});

describe('POST /api/llm-recommendations — function budget / deadline guard', () => {
  it('stops starting new concerns once the budget is nearly spent, returning what finished instead of losing everything', async () => {
    // Concurrency pinned to 1 so concerns are processed in a deterministic
    // order and the clock jump lands between two calls, not mid-batch.
    restoreEnv();
    restoreEnv = withEnv({
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      ANTHROPIC_API_KEY: 'test-key',
      OPENAI_API_KEY: undefined,
      AI_RECOMMENDATIONS_PROVIDER_ORDER: 'anthropic',
      LLM_CONCERN_CONCURRENCY: '1',
    });

    // wideIntake expands to 9 concerns. budgetExhausted() is only ever read
    // from `Date.now() - startedAt`, both in this file — nothing else in the
    // handler reads the clock, so faking it here can't skew quota/auth logic.
    let now = 1_000_000;
    const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);

    globalThis.fetch = vi.fn(async () => {
      // After the 2nd provider call completes, jump the clock past
      // FUNCTION_BUDGET_MS (50s) - 6s guard band = 44s, so every concern
      // after this one is skipped instead of started.
      if (globalThis.fetch.mock.calls.length === 2) now += 45_000;
      return anthropicOk(recPayload());
    });

    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-deadline' } }), res);

    expect(res.statusCode).toBe(200);
    // Only the concerns started before the clock jump reached the provider —
    // the rest were skipped, not attempted and failed.
    expect(globalThis.fetch.mock.calls.length).toBe(2);
    expect(res.body.requested).toBe(9);
    expect(res.body.delivered).toBe(2);
    expect(res.body.partial).toBe(true);
    expect(res.body.failedConcerns.length).toBe(7);
    // Reason travels with each failed concern so a future incident is
    // diagnosable from the response alone (see api/llm-recommendations.js's
    // mapConcurrent comment — this was previously an undiagnosable-after-
    // the-fact live bug).
    expect(res.body.failedConcernReasons.length).toBe(7);
    expect(res.body.failedConcernReasons.every((f) => f.reason === 'function_budget_exhausted')).toBe(true);
    expect(res.body.failedConcernReasons.every((f) => typeof f.concern === 'string' && f.concern.length > 0)).toBe(true);

    dateSpy.mockRestore();
  });

  it('reports a real provider failure reason, not just the concern name, and does not misclassify it as a success', async () => {
    restoreEnv();
    restoreEnv = withEnv({
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      ANTHROPIC_API_KEY: 'test-key',
      OPENAI_API_KEY: undefined,
      AI_RECOMMENDATIONS_PROVIDER_ORDER: 'anthropic',
      LLM_CONCERN_CONCURRENCY: '2',
    });

    // First concern's every retry attempt gets a non-retryable 401 (fails
    // fast, no fallback provider configured); the rest succeed. This is the
    // shape a real "no OpenAI key configured, Anthropic single point of
    // failure" incident takes — a subset of concerns fail while the rest
    // deliver, which is exactly the case the misleading "We couldn't build
    // your ecosystem" banner (fixed in MyEcosystem.jsx) used to mishandle.
    let callCount = 0;
    globalThis.fetch = vi.fn(async () => {
      callCount += 1;
      if (callCount === 1) {
        return { ok: false, status: 401, headers: { get: () => null }, text: async () => 'invalid api key' };
      }
      return anthropicOk(recPayload());
    });

    const handler = await loadHandler();
    const res = mockRes();
    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-provider-fail' } }), res);

    expect(res.statusCode).toBe(200);
    expect(res.body.partial).toBe(true);
    expect(res.body.failedConcerns.length).toBe(1);
    expect(res.body.failedConcernReasons.length).toBe(1);
    expect(res.body.failedConcernReasons[0].reason).toBe('anthropic_401');
    // The other 8 concerns actually succeeded — must not appear as failed.
    expect(res.body.delivered).toBe(8);
  });
});

describe('POST /api/llm-recommendations — request validation', () => {
  it('returns 503 when no provider key is configured, before touching auth', async () => {
    restoreEnv();
    restoreEnv = withEnv({
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      ANTHROPIC_API_KEY: undefined,
      OPENAI_API_KEY: undefined,
    });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-9' } }), res);

    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('not_configured');
  });

  it('returns 400 on malformed JSON rather than a 500', async () => {
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: '{ not json' }), res);

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('invalid_json');
  });

  it('rejects a non-POST method', async () => {
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ method: 'GET' }), res);

    expect(res.statusCode).toBe(405);
  });

  it('returns 401 when the token does not resolve to a user', async () => {
    globalThis.__mockSupabase = supa = mockSupabase({ authError: { message: 'bad token' } });
    globalThis.fetch = vi.fn(async () => anthropicOk(recPayload()));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: wideIntake, buildId: 'b-10' } }), res);

    expect(res.statusCode).toBe(401);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/llm-recommendations — PII never reaches the provider', () => {
  it('strips email, name and exact age/location from the prompt', async () => {
    const sent = [];
    globalThis.fetch = vi.fn(async (url, opts) => {
      sent.push(String(opts?.body || ''));
      return anthropicOk(recPayload());
    });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({
      body: {
        intake: { ...wideIntake, email: 'real@person.com', name: 'Real Person', age: 31, location: '123 Main St, San Francisco, CA 94110' },
        buildId: 'b-11',
      },
    }), res);

    const allPrompts = sent.join('\n');
    expect(allPrompts).not.toContain('real@person.com');
    expect(allPrompts).not.toContain('Real Person');
    expect(allPrompts).not.toContain('123 Main St');
  });
});

describe('POST /api/llm-recommendations — FSA/HSA prioritization', () => {
  // Live gap (2026-08-24 meeting): FSA/HSA was passed to the prompt as inert
  // context with no instruction to act on it — Puloma explicitly asked for
  // eligible products to be prioritized. Pins that the rule text is actually
  // there now, not just the raw field.
  it('instructs the model to prioritize FSA/HSA-eligible products when the user has one', async () => {
    let sentBody = null;
    globalThis.fetch = vi.fn(async (_url, init) => {
      sentBody = JSON.parse(init.body);
      return anthropicOk(recPayload());
    });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ body: { intake: { ...wideIntake, fsaHsa: 'hsa' }, buildId: 'b-fsa' } }), res);

    const prompt = sentBody.messages[0].content;
    expect(prompt).toContain('FSA/HSA: hsa');
    expect(prompt).toMatch(/prioritize FSA\/HSA-eligible products/i);
  });
});

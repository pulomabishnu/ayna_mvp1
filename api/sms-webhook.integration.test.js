/* global process */
/**
 * End-to-end tests for /api/sms-webhook.
 *
 * This is the only handler in the codebase that authenticates with NO user
 * token at all — it trusts whoever can produce a valid Twilio signature, then
 * looks up a real person by phone number and hands back her health-derived
 * reply in the HTTP response body. That makes five things load-bearing:
 *
 *  1. The signature check must FAIL CLOSED. If TWILIO_AUTH_TOKEN is unset, or
 *     the signature is missing, invalid, or throws mid-validation (e.g. no
 *     Host header), the request must be rejected — never silently accepted.
 *  2. STOP/START must never silently "succeed" when the DB write fails, and
 *     must never spend an LLM call answering a bare compliance keyword.
 *  3. A replayed Twilio delivery (same MessageSid) must be a no-op, not a
 *     second reply and a second LLM spend.
 *  4. An opted-out user must get no reply at all, even outside STOP/START.
 *  5. Burst + weekly quota must stop unbounded LLM/SMS spend, but fail open
 *     to a static reply rather than leaving a text unanswered.
 *
 * Supabase, Twilio's signature check, and fetch are mocked; everything in
 * between is the real handler.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, mockSupabase, withEnv, anthropicOk, openaiOk } from './_test-helpers.js';

const realFetch = globalThis.fetch;
let restoreEnv;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockSupabase,
}));

// The signature check is Twilio's own crypto — not our code — so it's mocked
// directly rather than exercised with real HMACs. `validateRequestMock` is
// reconfigured per test.
const validateRequestMock = vi.fn(() => true);
vi.mock('twilio', () => ({
  default: { validateRequest: (...args) => validateRequestMock(...args) },
}));

// Durable rate limiting falls back to an in-process Map with no Upstash env
// vars, and that Map is a module-level singleton — it would accumulate state
// across tests in this file and make later tests flaky depending on run
// order. Mocked so each test controls it explicitly.
const rateLimitMock = vi.fn(async () => ({ ok: true, limiter: 'test' }));
vi.mock('./_rateLimit.js', () => ({
  rateLimit: (...args) => rateLimitMock(...args),
  getClientIp: () => '127.0.0.1',
  isDurableStoreConfigured: () => true,
}));

async function loadHandler() {
  vi.resetModules();
  return (await import('./sms-webhook.js')).default;
}

/**
 * The shared mockSupabase helper keys canned responses by `table.op`, which
 * can't distinguish this handler's TWO separate `sms_conversations` selects
 * in one request (the MessageSid duplicate-check, then the recent-history
 * fetch). This wraps it with a call-order-aware override for that one table.
 */
function webhookSupabase({
  phoneRow = null,
  profile = null,
  recentMessages = null,
  seenMessage = null,
  phoneUpdateError = null,
  consumeUsageResult = { data: [{ allowed: true, used: 1 }], error: null },
} = {}) {
  const base = mockSupabase({
    tableResults: {
      'phone_numbers.select': { data: phoneRow, error: null },
      'phone_numbers.update': { data: null, error: phoneUpdateError },
      'health_intakes.select': { data: profile !== null ? { profile } : null, error: null },
    },
    rpcResults: {
      consume_ai_usage: consumeUsageResult,
    },
  });

  let smsSelectCalls = 0;
  const origFrom = base.from;
  base.from = vi.fn((table) => {
    if (table !== 'sms_conversations') return origFrom(table);
    const rec = { table, op: null, filters: {}, payload: null };
    base.tableCalls.push(rec);
    const api = {
      select() { rec.op = 'select'; return api; },
      insert(p) { rec.op = 'insert'; rec.payload = p; return api; },
      eq(col, val) { rec.filters[col] = val; return api; },
      order() { return api; },
      limit() { return api; },
      maybeSingle() { return api; },
      then(resolve) {
        if (rec.op === 'insert') return Promise.resolve({ data: null, error: null }).then(resolve);
        smsSelectCalls += 1;
        // 1st select = the MessageSid duplicate check; 2nd = recent history.
        const data = smsSelectCalls === 1 ? seenMessage : recentMessages;
        return Promise.resolve({ data, error: null }).then(resolve);
      },
    };
    return api;
  });

  return base;
}

const verifiedPhoneRow = { user_id: 'u-1', is_verified: true, sms_opted_out: false };

/** A representative inbound Twilio payload. Always includes MessageSid — real
 * Twilio deliveries always do, and the duplicate-check call-counter above
 * depends on that branch always running so call order stays predictable. */
function inboundBody(overrides = {}) {
  return { From: '+15551234567', Body: 'what helps with cramps', MessageSid: 'SM-1', ...overrides };
}

function webhookReq(body, headers = {}) {
  return mockReq({ body, headers: { 'x-twilio-signature': 'sig', host: 'ayna.health', ...headers } });
}

beforeEach(() => {
  restoreEnv = withEnv({
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    TWILIO_AUTH_TOKEN: 'twilio-token',
    ANTHROPIC_API_KEY: 'test-key',
  });
  validateRequestMock.mockReset().mockReturnValue(true);
  rateLimitMock.mockReset().mockResolvedValue({ ok: true, limiter: 'test' });
  globalThis.__mockSupabase = webhookSupabase({ phoneRow: verifiedPhoneRow });
});

afterEach(() => {
  restoreEnv();
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('POST /api/sms-webhook — signature verification fails closed', () => {
  it('returns 500 and never touches Supabase when TWILIO_AUTH_TOKEN is unset', async () => {
    restoreEnv();
    restoreEnv = withEnv({
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
      TWILIO_AUTH_TOKEN: undefined,
      ANTHROPIC_API_KEY: 'test-key',
    });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(500);
    expect(validateRequestMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the X-Twilio-Signature header is missing', async () => {
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody(), { 'x-twilio-signature': undefined }), res);

    expect(res.statusCode).toBe(403);
    expect(validateRequestMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the signature is present but invalid', async () => {
    validateRequestMock.mockReturnValue(false);
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(403);
  });

  it('returns 403, not 500, when signature validation itself throws (e.g. missing Host)', async () => {
    validateRequestMock.mockImplementation(() => { throw new TypeError('Invalid URL'); });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(403);
  });

  it('rejects a non-POST method before any signature check', async () => {
    const handler = await loadHandler();
    const res = mockRes();

    await handler(mockReq({ method: 'GET' }), res);

    expect(res.statusCode).toBe(405);
    expect(validateRequestMock).not.toHaveBeenCalled();
  });
});

describe('POST /api/sms-webhook — unknown or unverified numbers', () => {
  it('replies with the generic signup prompt and never queries health data', async () => {
    globalThis.__mockSupabase = webhookSupabase({ phoneRow: null });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('complete your free health profile');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('treats an unverified number the same as no account', async () => {
    globalThis.__mockSupabase = webhookSupabase({
      phoneRow: { user_id: 'u-2', is_verified: false, sms_opted_out: false },
    });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.body).toContain('complete your free health profile');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/sms-webhook — STOP / START compliance keywords', () => {
  it('STOP opts the user out and confirms, without spending an LLM call', async () => {
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody({ Body: 'STOP' })), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('unsubscribed');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does NOT confirm an unsubscribe when the opt-out write fails', async () => {
    globalThis.__mockSupabase = webhookSupabase({
      phoneRow: verifiedPhoneRow,
      phoneUpdateError: { message: 'db down' },
    });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody({ Body: 'STOP' })), res);

    expect(res.body).not.toContain('unsubscribed');
    expect(res.body).toMatch(/couldn't process/i);
  });

  it('a subscribed user texting YES gets a static reply, no LLM call', async () => {
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody({ Body: 'YES' })), res);

    expect(res.body).toContain('already subscribed');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('START re-subscribes an opted-out user', async () => {
    globalThis.__mockSupabase = webhookSupabase({
      phoneRow: { user_id: 'u-1', is_verified: true, sms_opted_out: true },
    });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody({ Body: 'START' })), res);

    expect(res.body).toContain("You're back in");
    const updates = globalThis.__mockSupabase.tableCalls.filter(
      (c) => c.table === 'phone_numbers' && c.op === 'update'
    );
    expect(updates.some((u) => u.payload?.sms_opted_out === false)).toBe(true);
  });
});

describe('POST /api/sms-webhook — duplicate delivery is a no-op', () => {
  it('a replayed MessageSid does not re-log or call the provider', async () => {
    globalThis.__mockSupabase = webhookSupabase({
      phoneRow: verifiedPhoneRow,
      seenMessage: { id: 'existing-row' },
    });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(200);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    const inserts = globalThis.__mockSupabase.tableCalls.filter(
      (c) => c.table === 'sms_conversations' && c.op === 'insert'
    );
    expect(inserts).toHaveLength(0);
  });
});

describe('POST /api/sms-webhook — opted-out users get silence', () => {
  it('logs the inbound text but sends no reply for a non-STOP message', async () => {
    globalThis.__mockSupabase = webhookSupabase({
      phoneRow: { user_id: 'u-1', is_verified: true, sms_opted_out: true },
    });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody({ Body: 'is ibuprofen ok for cramps' })), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBeFalsy();
    expect(globalThis.fetch).not.toHaveBeenCalled();
    const inserts = globalThis.__mockSupabase.tableCalls.filter(
      (c) => c.table === 'sms_conversations' && c.op === 'insert' && c.payload?.direction === 'inbound'
    );
    expect(inserts).toHaveLength(1);
  });
});

describe('POST /api/sms-webhook — rate limiting and weekly quota', () => {
  it('a burst over the limit gets a static reply, not the LLM', async () => {
    rateLimitMock.mockResolvedValue({ ok: false, retryAfterSec: 30, limiter: 'test' });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.body).toMatch(/sending messages quickly/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('exhausting the weekly quota gets a static reply, not the LLM', async () => {
    globalThis.__mockSupabase = webhookSupabase({
      phoneRow: verifiedPhoneRow,
      consumeUsageResult: { data: [{ allowed: false, used: 30 }], error: null },
    });
    globalThis.fetch = vi.fn();
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.body).toMatch(/week's Ayna text limit/i);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});

describe('POST /api/sms-webhook — generating a reply', () => {
  it('calls Claude and returns its reply, sanitized of banned words', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk('This may help with cramps — ibuprofen can diagnose the issue.'));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(200);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(res.body).not.toMatch(/\bdiagnose\b/i);
    expect(res.body).toContain('may help with');
  });

  // The actual point of the 2026-08-25 migration off a hand-rolled,
  // Anthropic-only fetch: when the account is out of credits (or any other
  // non-retryable Anthropic failure), OpenAI — if configured — answers the
  // text instead of every inbound message going unanswered.
  it('falls back to OpenAI when Anthropic fails outright (e.g. no credits)', async () => {
    restoreEnv();
    restoreEnv = withEnv({
      ANTHROPIC_API_KEY: 'test-key',
      OPENAI_API_KEY: 'test-openai-key',
      TWILIO_AUTH_TOKEN: 'test-twilio-token',
      SUPABASE_URL: 'https://x.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    });
    globalThis.fetch = vi.fn(async (url) => {
      if (String(url).includes('anthropic.com')) {
        return { ok: false, status: 400, headers: new Headers(), text: async () => 'credit balance too low' };
      }
      return openaiOk('Try a heating pad for cramps.');
    });
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain('heating pad');
  });

  it('falls back to a static apology when Claude returns nothing usable', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: false,
      status: 500,
      headers: new Headers(),
      json: async () => ({}),
      text: async () => '',
    }));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatch(/having trouble/i);
  });

  it('logs both the inbound and outbound message', async () => {
    globalThis.fetch = vi.fn(async () => anthropicOk('Try warm compresses for cramps.'));
    const handler = await loadHandler();
    const res = mockRes();

    await handler(webhookReq(inboundBody()), res);

    const inserts = globalThis.__mockSupabase.tableCalls.filter(
      (c) => c.table === 'sms_conversations' && c.op === 'insert'
    );
    expect(inserts.map((i) => i.payload.direction)).toEqual(['inbound', 'outbound']);
  });
});

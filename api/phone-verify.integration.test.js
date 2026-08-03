/* global process */
/**
 * End-to-end tests for the phone-verification flow.
 *
 * This is the path that was an account takeover: an attacker starts
 * verification for the VICTIM's number, so the pending row is created under the
 * ATTACKER's user_id, RLS hands them their own row including code_hash, and an
 * unsalted sha256 over a 10^6 keyspace falls to an offline brute force in under
 * two seconds (measured). These tests pin the properties that close it.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes, mockReq, mockSupabase, withEnv } from './_test-helpers.js';

let restoreEnv;

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => globalThis.__mockSupabase,
}));

// Twilio is a real outbound cost — never let a test send one.
const twilioCreate = vi.fn(async () => ({ sid: 'SM123' }));
vi.mock('twilio', () => ({
  default: () => ({ messages: { create: twilioCreate } }),
}));

// Durable rate limiting fails CLOSED without Upstash, which would 429 every test.
vi.mock('./_rateLimit.js', () => ({
  rateLimit: vi.fn(async () => ({ ok: true, limiter: 'test' })),
  getClientIp: () => '127.0.0.1',
  isDurableStoreConfigured: () => true,
}));

async function loadSend() { vi.resetModules(); return (await import('./phone-verify-send.js')).default; }
async function loadConfirm() { vi.resetModules(); return (await import('./phone-verify-confirm.js')).default; }

beforeEach(() => {
  restoreEnv = withEnv({
    SUPABASE_URL: 'https://x.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'service-key',
    TWILIO_ACCOUNT_SID: 'AC1', TWILIO_AUTH_TOKEN: 'tok', TWILIO_PHONE_NUMBER: '+15550000000',
    OTP_PEPPER: 'test-pepper',
    SMS_ALLOWED_COUNTRY_CODES: '1',
  });
  twilioCreate.mockClear();
  globalThis.__mockSupabase = mockSupabase();
});

afterEach(() => { restoreEnv(); vi.restoreAllMocks(); });

describe('POST /api/phone-verify-send', () => {
  it('PERSISTS the code before sending the SMS', async () => {
    const order = [];
    const supa = mockSupabase({ tableResults: { 'pending_phone_verifications.upsert': { data: null, error: null } } });
    const origFrom = supa.from;
    supa.from = (t) => { order.push(`db:${t}`); return origFrom(t); };
    twilioCreate.mockImplementation(async () => { order.push('sms'); return { sid: 'SM1' }; });
    globalThis.__mockSupabase = supa;

    const res = mockRes();
    await (await loadSend())(mockReq({ body: { phoneNumber: '5551234567' } }), res);

    expect(res.statusCode).toBe(200);
    // Sending first meant a failed write left the user billed for a code that
    // could never validate — and every retry burned another message.
    expect(order.indexOf('db:pending_phone_verifications')).toBeLessThan(order.indexOf('sms'));
  });

  it('does NOT send an SMS if the code could not be stored', async () => {
    globalThis.__mockSupabase = mockSupabase({
      tableResults: { 'pending_phone_verifications.upsert': { data: null, error: { message: 'db down' } } },
    });
    const res = mockRes();
    await (await loadSend())(mockReq({ body: { phoneNumber: '5551234567' } }), res);

    expect(res.statusCode).toBe(500);
    expect(twilioCreate).not.toHaveBeenCalled();
  });

  it('rejects international numbers outside the allowlist (IRSF / toll fraud)', async () => {
    const res = mockRes();
    await (await loadSend())(mockReq({ body: { phoneNumber: '+8869123456789' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('invalid_phone_number');
    expect(twilioCreate).not.toHaveBeenCalled();
  });

  it('never stores the code in plaintext', async () => {
    const supa = mockSupabase({ tableResults: { 'pending_phone_verifications.upsert': { data: null, error: null } } });
    globalThis.__mockSupabase = supa;
    const res = mockRes();
    await (await loadSend())(mockReq({ body: { phoneNumber: '5551234567' } }), res);

    const write = supa.tableCalls.find((c) => c.table === 'pending_phone_verifications' && c.op === 'upsert');
    const sentCode = /code is (\d{6})/.exec(twilioCreate.mock.calls[0][0].body)[1];
    expect(write.payload.code_hash).not.toContain(sentCode);
    expect(write.payload.code_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(write.payload)).not.toContain(sentCode);
  });

  it('requires authentication', async () => {
    globalThis.__mockSupabase = mockSupabase({ user: null, authError: { message: 'no' } });
    const res = mockRes();
    await (await loadSend())(mockReq({ body: { phoneNumber: '5551234567' }, headers: { authorization: '' } }), res);
    expect(res.statusCode).toBe(401);
    expect(twilioCreate).not.toHaveBeenCalled();
  });
});

describe('POST /api/phone-verify-confirm', () => {
  const pendingFor = async (code) => {
    const { hashCode } = await import('./_otp.js');
    return { data: [{ found: true, locked_out: false, expired: false, phone_number: '+15551234567', code_hash: hashCode(code, 'user-1'), attempts: 1 }], error: null };
  };

  it('accepts the correct code and marks the number verified', async () => {
    globalThis.__mockSupabase = mockSupabase({
      rpcResults: { claim_otp_attempt: await pendingFor('123456') },
      tableResults: { 'phone_numbers.upsert': { data: null, error: null } },
    });
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5551234567', code: '123456' } }), res);
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects a wrong code', async () => {
    globalThis.__mockSupabase = mockSupabase({ rpcResults: { claim_otp_attempt: await pendingFor('123456') } });
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5551234567', code: '999999' } }), res);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('invalid_or_expired_code');
  });

  it('rejects a code issued for a DIFFERENT number', async () => {
    // Otherwise a code sent for number A could bind number B.
    globalThis.__mockSupabase = mockSupabase({ rpcResults: { claim_otp_attempt: await pendingFor('123456') } });
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5559999999', code: '123456' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('honours the lockout returned by the atomic claim', async () => {
    globalThis.__mockSupabase = mockSupabase({
      rpcResults: { claim_otp_attempt: { data: [{ found: true, locked_out: true, expired: false, phone_number: null, code_hash: null, attempts: 6 }], error: null } },
    });
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5551234567', code: '123456' } }), res);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toBe('too_many_attempts');
  });

  it('rejects an expired code', async () => {
    globalThis.__mockSupabase = mockSupabase({
      rpcResults: { claim_otp_attempt: { data: [{ found: true, locked_out: false, expired: true, phone_number: '+15551234567', code_hash: null, attempts: 1 }], error: null } },
    });
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5551234567', code: '123456' } }), res);
    expect(res.statusCode).toBe(400);
  });

  it('counts the attempt ATOMICALLY via the RPC, not a read-modify-write', async () => {
    // The old flow read `attempts` then wrote back attempts+1, so N parallel
    // guesses all wrote the same value and the cap was unenforceable.
    const supa = mockSupabase({ rpcResults: { claim_otp_attempt: await pendingFor('123456') } });
    globalThis.__mockSupabase = supa;
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5551234567', code: '999999' } }), res);

    expect(supa.rpcCalls.filter((c) => c.name === 'claim_otp_attempt')).toHaveLength(1);
    const attemptUpdates = supa.tableCalls.filter(
      (c) => c.table === 'pending_phone_verifications' && c.op === 'update'
    );
    expect(attemptUpdates).toHaveLength(0);
    expect(res.statusCode).toBe(400);
  });

  it('rejects a malformed code before spending an attempt', async () => {
    const supa = mockSupabase({ rpcResults: { claim_otp_attempt: await pendingFor('123456') } });
    globalThis.__mockSupabase = supa;
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5551234567', code: 'abc' } }), res);
    expect(res.statusCode).toBe(400);
    expect(supa.rpcCalls).toHaveLength(0);
  });

  it('requires authentication', async () => {
    globalThis.__mockSupabase = mockSupabase({ user: null, authError: { message: 'no' } });
    const res = mockRes();
    await (await loadConfirm())(mockReq({ body: { phoneNumber: '5551234567', code: '123456' }, headers: { authorization: '' } }), res);
    expect(res.statusCode).toBe(401);
  });
});

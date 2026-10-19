/**
 * Team texts on new suggestions and app/wearable requests: sent alongside the
 * existing founder email, never identify the person, never fail the request.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
import { mockRes, mockReq } from './_test-helpers.js';

const ctx = { db: null };
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ctx.db }));
vi.mock('./_usageLimit.js', () => ({ verifyUser: async () => ({ user: { id: 'u1', email: 'her@example.com' }, admin: ctx.db, error: null }) }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }), getClientIp: () => '127.0.0.1' }));

const realFetch = globalThis.fetch;
const twilioCalls = () => globalThis.fetch.mock.calls.filter(([u]) => String(u).includes('api.twilio.com'));
const resendCalls = () => globalThis.fetch.mock.calls.filter(([u]) => String(u).includes('api.resend.com'));

beforeEach(() => {
  ctx.db = createFakeDb({ suggestions: [], health_source_requests: [] });
  vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k');
  vi.stubEnv('RESEND_API_KEY', 're_test');
  vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test');
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'tok');
  vi.stubEnv('TWILIO_FROM_NUMBER', '+15550001111');
  vi.stubEnv('TEAM_SMS_NUMBERS', '+15550000001,+15550000002');
  globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => '' }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  globalThis.fetch = realFetch;
});

async function suggest(body) {
  const { default: handler } = await import('./suggestions.js');
  const res = mockRes();
  await handler(mockReq({ body, headers: {} }), res);
  return res;
}
async function requestSource(body) {
  const { default: handler } = await import('./health-data.js');
  const res = mockRes();
  await handler(mockReq({ body: { action: 'request_source', ...body } }), res);
  return res;
}

describe('team SMS alerts', () => {
  it('a suggestion emails AND texts each founder number, with no identity', async () => {
    const r = await suggest({ kind: 'product', productName: 'Some Cup', context: 'shop' });
    expect(r.statusCode).toBe(200);
    expect(resendCalls()).toHaveLength(1);
    const texts = twilioCalls().map(([, i]) => new URLSearchParams(i.body));
    expect(texts.map((f) => f.get('To'))).toEqual(['+15550000001', '+15550000002']);
    expect(texts[0].get('Body')).toBe('ayna team: new product suggestion: Some Cup');
  });

  it('an app/wearable request texts the team without her email or note', async () => {
    const r = await requestSource({ name: 'Natural Cycles', note: 'private note' });
    expect(r.statusCode).toBe(200);
    const body = new URLSearchParams(twilioCalls()[0][1].body).get('Body');
    expect(body).toBe('ayna team: new app or wearable request: Natural Cycles');
    expect(body).not.toContain('her@example.com');
    expect(body).not.toContain('private note');
  });

  it('a Twilio failure never breaks either request', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    globalThis.fetch = vi.fn(async (u) => {
      if (String(u).includes('twilio')) throw new Error('twilio down');
      return { ok: true, status: 200, json: async () => ({}), text: async () => '' };
    });
    expect((await suggest({ kind: 'read', topic: 'iron and periods' })).statusCode).toBe(200);
    expect((await requestSource({ name: 'Flo' })).statusCode).toBe(200);
    expect(ctx.db.tables.health_source_requests).toHaveLength(1);
  });

  it('no Twilio env: email only, no text attempted', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', '');
    await suggest({ kind: 'product', productName: 'Some Cup' });
    expect(twilioCalls()).toHaveLength(0);
    expect(resendCalls()).toHaveLength(1);
  });
});

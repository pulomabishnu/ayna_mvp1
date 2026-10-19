/* global Buffer */
/**
 * /api/sms-webhook with per-feature opt-ins (sms_preferences / sms_events).
 *
 * Unlike sms-webhook.integration.test.js, Twilio's signature check is NOT
 * mocked here: requests are signed for real per Twilio's spec (HMAC-SHA1,
 * base64, over the URL plus every POST param sorted by key, key then value),
 * so a valid signature passes and a tampered one is refused.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
import { mockRes, anthropicOk } from './_test-helpers.js';

const ctx = { db: null };
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ctx.db }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }), getClientIp: () => '127.0.0.1' }));

const TOKEN = 'test-auth-token';
const URL_PATH = '/api/sms-webhook';
const HOST = 'www.aynahealth.co';
const FROM = '+15551234567';

function sign(url, params, token = TOKEN) {
  const data = Object.keys(params).sort().reduce((acc, k) => acc + k + params[k], url);
  return crypto.createHmac('sha1', Buffer.from(token, 'utf-8')).update(Buffer.from(data, 'utf-8')).digest('base64');
}

function inbound(Body, { signature, extra = {} } = {}) {
  const body = { From: FROM, Body, MessageSid: `SM${crypto.randomUUID().replace(/-/g, '')}`, ...extra };
  return {
    method: 'POST',
    url: URL_PATH,
    body,
    headers: { host: HOST, 'x-forwarded-proto': 'https', 'x-twilio-signature': signature ?? sign(`https://${HOST}${URL_PATH}`, body) },
  };
}

async function send(Body, opts) {
  const { default: handler } = await import('./sms-webhook.js');
  const res = mockRes();
  await handler(inbound(Body, opts), res);
  return res;
}

function seed({ phone = { user_id: 'u1', phone_number: FROM, is_verified: true, sms_opted_out: false }, prefs = null, events = [] } = {}) {
  const db = createFakeDb({
    phone_numbers: phone ? [phone] : [],
    sms_preferences: prefs ? [{ user_id: 'u1', reminders: false, orders: false, chat: false, health_details: false, stopped_at: null, ...prefs }] : [],
    sms_events: events,
    sms_conversations: [],
    health_intakes: [{ user_id: 'u1', profile: { conditions: ['PCOS-test-marker'] } }],
  });
  db.rpc = vi.fn(async () => ({ data: [{ allowed: true, used: 1 }], error: null }));
  ctx.db = db;
  return db;
}

const realFetch = globalThis.fetch;
beforeEach(() => {
  vi.stubEnv('TWILIO_AUTH_TOKEN', TOKEN);
  vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
  vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');
  vi.stubEnv('AI_SMS_PROVIDER_ORDER', 'anthropic');
  globalThis.fetch = vi.fn(async () => anthropicOk('A heating pad may help with cramps.'));
  seed();
});
afterEach(() => {
  vi.unstubAllEnvs();
  globalThis.fetch = realFetch;
});

describe('signature validation (real HMAC)', () => {
  it('accepts a correctly signed request', async () => {
    const r = await send('HELP');
    expect(r.statusCode).toBe(200);
  });
  it('rejects a bad signature with 403', async () => {
    const r = await send('HELP', { signature: sign(`https://${HOST}${URL_PATH}`, { From: FROM, Body: 'HELP' }, 'wrong-token') });
    expect(r.statusCode).toBe(403);
  });
  it('rejects when Twilio is not configured (fails closed, never 200)', async () => {
    vi.stubEnv('TWILIO_AUTH_TOKEN', '');
    const r = await send('HELP');
    expect(r.statusCode).not.toBe(200);
  });
});

describe('keywords', () => {
  it('HELP answers any number, even unknown, with the support line', async () => {
    seed({ phone: null });
    const r = await send('help');
    expect(r.body).toContain('ayna: health product matches and reads. Reply STOP to opt out. Help: puloma@aynahealth.co');
  });

  it('STOP sets stopped_at, turns every feature off and logs a stop event', async () => {
    const db = seed({ prefs: { reminders: true, orders: true, chat: true, health_details: true } });
    await send('STOP');
    const p = db.tables.sms_preferences[0];
    expect(p).toMatchObject({ reminders: false, orders: false, chat: false, health_details: false });
    expect(p.stopped_at).toBeTruthy();
    expect(db.tables.phone_numbers[0].sms_opted_out).toBe(true);
    expect(db.tables.sms_events.map((e) => e.kind)).toContain('stop');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('STOP from an unknown number gets silence, not a sign-up pitch', async () => {
    seed({ phone: null });
    const r = await send('STOP');
    expect(r.body).toBe('');
  });

  it('START clears the stop but leaves features off', async () => {
    const db = seed({ phone: { user_id: 'u1', phone_number: FROM, is_verified: true, sms_opted_out: true }, prefs: { stopped_at: '2026-10-01T00:00:00Z' } });
    const r = await send('START');
    expect(db.tables.sms_preferences[0].stopped_at).toBeNull();
    expect(db.tables.sms_preferences[0].chat).toBe(false);
    expect(db.tables.phone_numbers[0].sms_opted_out).toBe(false);
    expect(r.body).toContain('Text messages');
  });
});

describe('chat opt-in', () => {
  it('chat off: replies once per day that chats are off, never calls the assistant', async () => {
    const db = seed({ prefs: { chat: false } });
    const first = await send('what helps cramps');
    expect(first.body).toContain('Text chats with ayna are off for this number. Turn them on in the ayna app: You, Settings, Text messages.');
    const second = await send('hello?');
    expect(second.body).toBe('');
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(db.tables.sms_events.filter((e) => e.kind === 'chat_off_notice')).toHaveLength(1);
  });

  it('chat on: the assistant answers, without her profile when health details are off', async () => {
    seed({ prefs: { chat: true, health_details: false } });
    const r = await send('what helps cramps');
    expect(r.body).toContain('heating pad');
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const sent = JSON.stringify(JSON.parse(globalThis.fetch.mock.calls[0][1].body));
    expect(sent).not.toContain('PCOS-test-marker');
  });

  it('chat on with health details: her profile shapes the answer', async () => {
    seed({ prefs: { chat: true, health_details: true } });
    await send('what helps cramps');
    expect(globalThis.fetch.mock.calls[0][1].body).toContain('PCOS-test-marker');
  });

  it('caps a long reply under 600 characters', async () => {
    seed({ prefs: { chat: true } });
    globalThis.fetch = vi.fn(async () => anthropicOk('Short sentence here. '.repeat(60)));
    const r = await send('tell me everything');
    const inner = r.body.replace(/^.*<Message>/s, '').replace(/<\/Message>.*$/s, '');
    expect(inner.length).toBeLessThanOrEqual(600);
  });
});

describe('SMS_DAILY_CHAT_LIMIT', () => {
  it('is 5', async () => {
    const { SMS_DAILY_CHAT_LIMIT } = await import('./_smsStore.js');
    expect(SMS_DAILY_CHAT_LIMIT).toBe(5);
  });

  it('answers 5 texts, then replies once with the limit notice, then stays silent', async () => {
    const db = seed({ prefs: { chat: true } });
    for (let i = 0; i < 5; i++) expect((await send(`question ${i}`)).body).toContain('heating pad');
    expect(globalThis.fetch).toHaveBeenCalledTimes(5);
    const sixth = await send('question 6');
    expect(sixth.body).toContain("You've used today's 5 texts with ayna. You can keep chatting in the app.");
    const seventh = await send('question 7');
    expect(seventh.body).toBe('');
    expect(globalThis.fetch).toHaveBeenCalledTimes(5);
    expect(db.tables.sms_events.filter((e) => e.kind === 'chat_limit_notice')).toHaveLength(1);
  });

  it('yesterday\'s texts do not count', async () => {
    const old = new Date(Date.now() - 2 * 86400000).toISOString();
    seed({ prefs: { chat: true }, events: Array.from({ length: 5 }, () => ({ user_id: 'u1', kind: 'chat_reply', created_at: old })) });
    expect((await send('hi')).body).toContain('heating pad');
  });
});

/* global Buffer */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
import { normalizeE164, sendSms, sendTeamAlert, isSmsConfigured, maskForDisplay } from './_twilio.js';
import { sendOrderText } from './_smsStore.js';

const ok = () => ({ ok: true, status: 201, json: async () => ({ sid: 'SM1' }) });

beforeEach(() => {
  for (const k of ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_MESSAGING_SERVICE_SID', 'TWILIO_PHONE_NUMBER', 'TWILIO_FROM_NUMBER', 'TEAM_SMS_NUMBERS']) vi.stubEnv(k, '');
});
afterEach(() => vi.unstubAllEnvs());
const configure = () => {
  vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test');
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'tok');
  vi.stubEnv('TWILIO_FROM_NUMBER', '+15550001111');
};

describe('E.164 normalization (US)', () => {
  it.each([
    ['+15551234567', '+15551234567'],
    ['5551234567', '+15551234567'],
    ['(555) 123-4567', '+15551234567'],
    ['1-555-123-4567', '+15551234567'],
    ['555.123.4567', '+15551234567'],
    ['12345', null],
    ['+445551234567', null], // outside the US/Canada allowlist
    ['', null],
  ])('%s -> %s', (raw, want) => expect(normalizeE164(raw)).toBe(want));
  it('masks for display', () => expect(maskForDisplay('+15551234567')).toBe('(***) ***-4567'));
});

describe('sendSms', () => {
  it('is off (never throws, no request) until configured', async () => {
    const fetchImpl = vi.fn();
    expect(isSmsConfigured()).toBe(false);
    expect(await sendSms('5551234567', 'hi', { fetchImpl })).toEqual({ ok: false, error: 'not_configured' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('posts form-encoded with Basic auth, preferring the Messaging Service', async () => {
    configure();
    vi.stubEnv('TWILIO_MESSAGING_SERVICE_SID', 'MG_test');
    const fetchImpl = vi.fn(async () => ok());
    expect(await sendSms('(555) 123-4567', 'hello', { fetchImpl })).toEqual({ ok: true, sid: 'SM1' });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC_test/Messages.json');
    expect(init.headers.Authorization).toBe(`Basic ${Buffer.from('AC_test:tok').toString('base64')}`);
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    const form = new URLSearchParams(init.body);
    expect(form.get('To')).toBe('+15551234567');
    expect(form.get('MessagingServiceSid')).toBe('MG_test');
    expect(form.get('From')).toBeNull();
  });

  it('a Twilio error or network failure resolves ok:false and never logs the number or body', async () => {
    configure();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await sendSms('5551234567', 'secret body', { fetchImpl: async () => ({ ok: false, status: 400, json: async () => ({ code: 21610 }) }) })).ok).toBe(false);
    expect((await sendSms('5551234567', 'secret body', { fetchImpl: async () => { throw new Error('boom'); } })).ok).toBe(false);
    const logged = spy.mock.calls.flat().join(' ');
    expect(logged).not.toContain('5551234567');
    expect(logged).not.toContain('secret body');
    expect(logged).toContain('***4567');
    spy.mockRestore();
  });
});

describe('sendTeamAlert', () => {
  it('texts every TEAM_SMS_NUMBERS entry and never throws on failure', async () => {
    configure();
    vi.stubEnv('TEAM_SMS_NUMBERS', '+15550000001, (555) 000-0002, junk');
    const fetchImpl = vi.fn(async () => ok());
    expect(await sendTeamAlert('new product suggestion: X', { fetchImpl })).toEqual({ sent: 2, configured: true });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(sendTeamAlert('x', { fetchImpl: async () => { throw new Error('down'); } })).resolves.toEqual({ sent: 0, configured: true });
  });
  it('does nothing when no team numbers are set', async () => {
    configure();
    expect(await sendTeamAlert('x', { fetchImpl: vi.fn() })).toEqual({ sent: 0, configured: false });
  });
});

describe('sendOrderText', () => {
  const db = (prefs) => createFakeDb({
    phone_numbers: [{ user_id: 'u1', phone_number: '+15551234567', is_verified: true, sms_opted_out: false }],
    sms_preferences: prefs ? [{ user_id: 'u1', reminders: false, orders: false, chat: false, health_details: false, stopped_at: null, ...prefs }] : [],
    sms_events: [],
  });

  it('sends nothing unless she opted in to order texts', async () => {
    configure();
    const fetchImpl = vi.fn(async () => ok());
    expect(await sendOrderText(db(null), 'u1', 'shipped', { productName: 'Cup' }, { fetchImpl })).toEqual({ sent: false, reason: 'not_opted_in' });
    expect(await sendOrderText(db({ orders: true, stopped_at: '2026-10-01' }), 'u1', 'shipped', {}, { fetchImpl })).toMatchObject({ sent: false });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('leaves the product name out unless health details are on', async () => {
    configure();
    const fetchImpl = vi.fn(async () => ok());
    await sendOrderText(db({ orders: true }), 'u1', 'shipped', { productName: 'Period Cup' }, { fetchImpl });
    await sendOrderText(db({ orders: true, health_details: true }), 'u1', 'shipped', { productName: 'Period Cup' }, { fetchImpl });
    const bodies = fetchImpl.mock.calls.map(([, i]) => new URLSearchParams(i.body).get('Body'));
    expect(bodies[0]).toBe('ayna: your order has shipped. Details: https://www.aynahealth.co/you');
    expect(bodies[1]).toBe('ayna: your order has shipped (Period Cup). Details: https://www.aynahealth.co/you');
  });
});

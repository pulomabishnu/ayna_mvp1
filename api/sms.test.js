import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
import { mockRes, mockReq } from './_test-helpers.js';

const ctx = { db: null, user: { id: 'u1' } };
vi.mock('./_usageLimit.js', () => ({
  verifyUser: async () => (ctx.user ? { user: ctx.user, admin: ctx.db, error: null } : { user: null, admin: ctx.db, error: 'auth_required' }),
  getServiceClient: () => ctx.db,
}));
vi.mock('./_rateLimit.js', () => ({ rateLimit: async () => ({ ok: true }), getClientIp: () => '127.0.0.1' }));

// The existing verification handlers have their own integration tests
// (phone-verify.integration.test.js); here they stand in for "code sent" and
// "code correct", writing the phone_numbers row the real one writes.
const sendCode = vi.fn(async (req, res) => res.status(200).json({ ok: true }));
const confirmCode = vi.fn(async (req, res) => {
  if (req.body.code !== '123456') return res.status(400).json({ error: 'invalid_or_expired_code' });
  ctx.db.tables.phone_numbers.push({ user_id: 'u1', phone_number: req.body.phoneNumber, is_verified: true, sms_opted_out: false });
  return res.status(200).json({ ok: true, phoneNumber: req.body.phoneNumber });
});
vi.mock('./phone-verify-send.js', () => ({ default: (...a) => sendCode(...a) }));
vi.mock('./phone-verify-confirm.js', () => ({ default: (...a) => confirmCode(...a) }));

const call = async (body, method = 'POST', query = {}) => {
  const { default: handler } = await import('./sms.js');
  const res = mockRes();
  await handler(mockReq({ method, body, query }), res);
  return res;
};

const configure = () => {
  vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test');
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'tok');
  vi.stubEnv('TWILIO_PHONE_NUMBER', '+15550001111');
  vi.stubEnv('AYNA_TEXT_NUMBER', '(555) 000-2222');
};

beforeEach(() => {
  ctx.db = createFakeDb({ phone_numbers: [], sms_preferences: [], sms_events: [], pending_phone_verifications: [] });
  ctx.user = { id: 'u1' };
  for (const k of ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'TWILIO_FROM_NUMBER', 'TWILIO_MESSAGING_SERVICE_SID', 'AYNA_TEXT_NUMBER']) vi.stubEnv(k, '');
  sendCode.mockClear();
  confirmCode.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe('/api/sms', () => {
  it('401 when signed out', async () => {
    ctx.user = null;
    expect((await call({ action: 'status' })).statusCode).toBe(401);
  });

  it('status when Twilio is not configured: configured:false, everything off, no throw', async () => {
    const r = await call(null, 'GET', { action: 'status' });
    expect(r.statusCode).toBe(200);
    expect(r.body).toMatchObject({ configured: false, phone: null, verified: false, textNumber: null,
      prefs: { reminders: false, orders: false, chat: false, healthDetails: false } });
  });

  it('start is refused with 503 sms_not_configured while unconfigured', async () => {
    const r = await call({ action: 'start', phone: '555-123-4567' });
    expect(r.statusCode).toBe(503);
    expect(r.body).toEqual({ error: 'sms_not_configured', configured: false });
    expect(sendCode).not.toHaveBeenCalled();
  });

  it('start -> verify: normalizes the number, records consent, every feature starts OFF', async () => {
    configure();
    expect((await call({ action: 'start', phone: 'abc' })).body.error).toBe('invalid_phone_number');
    const s = await call({ action: 'start', phone: '(555) 123-4567' });
    expect(s.body).toEqual({ ok: true, sent: true });
    expect(sendCode.mock.calls[0][0].body).toEqual({ phoneNumber: '+15551234567' });

    const bad = await call({ action: 'verify', phone: '5551234567', code: '000000' });
    expect(bad.statusCode).toBe(400);
    expect(bad.body.error).toBe('invalid_or_expired_code');

    const v = await call({ action: 'verify', phone: '5551234567', code: '123456' });
    expect(v.statusCode).toBe(200);
    expect(v.body).toMatchObject({ ok: true, configured: true, verified: true, phone: '(***) ***-4567', textNumber: '+15550002222', prefsSaved: true,
      prefs: { reminders: false, orders: false, chat: false, healthDetails: false } });
    expect(JSON.stringify(v.body)).not.toContain('5551234567');
    expect(ctx.db.tables.sms_preferences[0]).toMatchObject({ consent_text_version: 'sms-2026-10-19', chat: false });
    expect(ctx.db.tables.sms_events.map((e) => e.kind)).toEqual(['phone_verified']);
  });

  it('prefs require a verified number', async () => {
    const r = await call({ action: 'prefs', chat: true });
    expect(r.statusCode).toBe(400);
    expect(r.body.error).toBe('phone_not_verified');
    expect(ctx.db.tables.sms_preferences).toHaveLength(0);
  });

  it('prefs: explicit booleans only, partial updates keep the rest, consent logged', async () => {
    ctx.db.tables.phone_numbers.push({ user_id: 'u1', phone_number: '+15551234567', is_verified: true, sms_opted_out: false });
    expect((await call({ action: 'prefs', chat: 'yes' })).body.error).toBe('bad_prefs');
    const a = await call({ action: 'prefs', chat: true, reminders: true });
    expect(a.body.prefs).toEqual({ reminders: true, orders: false, chat: true, healthDetails: false });
    const b = await call({ action: 'prefs', reminders: false });
    expect(b.body.prefs).toEqual({ reminders: false, orders: false, chat: true, healthDetails: false });
    expect(ctx.db.tables.sms_events.filter((e) => e.kind === 'prefs_saved')).toHaveLength(2);
  });

  it('prefs: turning a feature on after STOP is refused until she texts START', async () => {
    ctx.db.tables.phone_numbers.push({ user_id: 'u1', phone_number: '+15551234567', is_verified: true, sms_opted_out: true });
    expect((await call({ action: 'prefs', chat: true })).statusCode).toBe(409);
    expect((await call({ action: 'prefs', chat: false })).statusCode).toBe(200);
  });

  it('remove deletes her number and settings, and logs it', async () => {
    ctx.db.tables.phone_numbers.push({ user_id: 'u1', phone_number: '+15551234567', is_verified: true, sms_opted_out: false });
    ctx.db.tables.sms_preferences.push({ user_id: 'u1', chat: true });
    const r = await call({ action: 'remove' });
    expect(r.body).toMatchObject({ ok: true, phone: null, verified: false });
    expect(ctx.db.tables.phone_numbers).toHaveLength(0);
    expect(ctx.db.tables.sms_preferences).toHaveLength(0);
    expect(ctx.db.tables.sms_events.map((e) => e.kind)).toEqual(['phone_removed']);
  });

  it('unknown action', async () => {
    expect((await call({ action: 'nope' })).body.error).toBe('unknown_action');
  });
});

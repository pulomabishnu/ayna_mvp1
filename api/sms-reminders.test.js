import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createFakeDb } from './_healthFakeDb.test-helper.js';
import { mockRes, mockReq } from './_test-helpers.js';

const ctx = { db: null };
vi.mock('./_usageLimit.js', () => ({ getServiceClient: () => ctx.db, verifyUser: async () => ({ user: null }) }));

// 2026-10-20, noon in New York.
const NOW = new Date('2026-10-20T16:00:00Z');
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);

/** Period logs every 28 days so the estimate lands on `nextStart`. */
function periodRows(userId, nextStart) {
  const rows = [];
  for (let k = 1; k <= 3; k++) {
    const start = Date.parse(`${nextStart}T00:00:00Z`) - k * 28 * DAY;
    for (let d = 0; d < 5; d++) rows.push({ user_id: userId, source: 'apple_health', origin: 'apple_health', metric: 'menstrual_flow', day: iso(start + d * DAY), value: 2, unit: 'flow_level', method: 'device' });
  }
  return rows;
}

const sub = (user_id, prefs) => ({ user_id, reminders: true, orders: false, chat: false, health_details: false, stopped_at: null, ...prefs });
const phone = (user_id, last4, extra = {}) => ({ user_id, phone_number: `+1555000${last4}`, is_verified: true, sms_opted_out: false, ...extra });

const run = async (headers = { authorization: 'Bearer cron-secret' }) => {
  const { default: handler } = await import('./sms-reminders.js');
  const res = mockRes();
  await handler({ ...mockReq({ method: 'GET' }), headers }, res);
  return res;
};
const textsTo = () => globalThis.fetch.mock.calls.map(([, init]) => Object.fromEntries(new URLSearchParams(init.body)));

const realFetch = globalThis.fetch;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.stubEnv('CRON_SECRET', 'cron-secret');
  vi.stubEnv('TWILIO_ACCOUNT_SID', 'AC_test');
  vi.stubEnv('TWILIO_AUTH_TOKEN', 'tok');
  vi.stubEnv('TWILIO_MESSAGING_SERVICE_SID', 'MG_test');
  globalThis.fetch = vi.fn(async () => ({ ok: true, status: 201, json: async () => ({ sid: 'SM1' }) }));
  ctx.db = createFakeDb({
    sms_preferences: [
      sub('due', { health_details: true }),           // estimate in exactly 3 days
      sub('private', {}),                             // same logs, health details OFF
      sub('later', { health_details: true }),         // estimate in 5 days
      sub('stopped', { health_details: true, stopped_at: '2026-10-01T00:00:00Z' }),
      sub('off', { reminders: false, health_details: true }),
    ],
    phone_numbers: [phone('due', '0001'), phone('private', '0002'), phone('later', '0003'), phone('stopped', '0004'), phone('off', '0005')],
    health_daily_metrics: [...periodRows('due', '2026-10-23'), ...periodRows('private', '2026-10-23'), ...periodRows('later', '2026-10-25'), ...periodRows('stopped', '2026-10-23'), ...periodRows('off', '2026-10-23')],
    sms_events: [],
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  globalThis.fetch = realFetch;
});

describe('/api/sms-reminders', () => {
  it('requires the cron secret', async () => {
    expect((await run({})).statusCode).toBe(401);
    expect((await run({ authorization: 'Bearer wrong' })).statusCode).toBe(401);
    vi.stubEnv('CRON_SECRET', '');
    expect((await run()).statusCode).toBe(401);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('does nothing (configured:false) while Twilio is not set up', async () => {
    vi.stubEnv('TWILIO_ACCOUNT_SID', '');
    const r = await run();
    expect(r.body).toMatchObject({ ok: true, configured: false, sent: 0 });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('texts the restock reminder only with health details on and only exactly 3 days before', async () => {
    const r = await run();
    expect(r.statusCode).toBe(200);
    const sent = textsTo();
    expect(sent).toHaveLength(1);
    expect(sent[0].To).toBe('+15550000001');
    expect(sent[0].MessagingServiceSid).toBe('MG_test');
    expect(sent[0].Body).toBe('ayna: your next period may start in about 3 days. Restock your period products? https://www.aynahealth.co/explore/products');
  });

  it('at most one reminder per person per day', async () => {
    await run();
    await run();
    expect(textsTo()).toHaveLength(1);
    expect(ctx.db.tables.sms_events.filter((e) => e.user_id === 'due' && e.kind === 'reminder')).toHaveLength(1);
  });

  it('on the 1st, people without health details get only the generic check-in', async () => {
    vi.setSystemTime(new Date('2026-11-01T16:00:00Z'));
    await run();
    const priv = textsTo().find((t) => t.To === '+15550000002');
    expect(priv.Body).toBe('ayna: your monthly check-in is ready. https://www.aynahealth.co/you');
    expect(textsTo().some((t) => /period/.test(t.Body))).toBe(false);
  });
});

describe('claimReminderDay (double-send guard)', () => {
  it('returns false when the unique index rejects a second claim for the same day', async () => {
    const { claimReminderDay } = await import('./_smsStore.js');
    const inserts = [];
    const admin = { from: () => ({ insert: async (row) => {
      const dup = inserts.some((r) => r.user_id === row.user_id && r.detail.day === row.detail.day);
      inserts.push(row);
      return { error: dup ? { code: '23505', message: 'duplicate key' } : null };
    } }) };
    expect(await claimReminderDay(admin, 'u1', '2026-10-20', 'period')).toBe(true);
    expect(await claimReminderDay(admin, 'u1', '2026-10-20', 'period')).toBe(false);
    expect(await claimReminderDay(admin, 'u1', '2026-10-21', 'period')).toBe(true);
    expect(inserts[0]).toMatchObject({ kind: 'reminder', detail: { type: 'period', day: '2026-10-20' } });
  });
});

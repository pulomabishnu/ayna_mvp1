import { describe, it, expect, vi } from 'vitest';

vi.mock('./_usageLimit.js', () => ({ verifyUser: async () => ({ user: null, error: 'auth_required' }) }));
vi.mock('./_apns.js', () => ({ apnsConfigured: () => true, pushToUser: async () => ({ sent: 1 }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));

const { planDelivery, inQuietHours, localParts, PUSH_MESSAGE, sweep } = await import('./today-reminders.js');

const NY = 'America/New_York';
// 2026-10-24 20:00 in New York (EDT, UTC-4).
const EVENING = Date.parse('2026-10-25T00:00:00Z');
const LATE = Date.parse('2026-10-25T03:30:00Z'); // 23:30 local

describe('today reminders', () => {
  it('the push never carries health words or product names', () => {
    expect(PUSH_MESSAGE).toEqual({ title: 'ayna', body: 'Your ayna check-in is ready', data: { route: 'today' } });
    expect(JSON.stringify(PUSH_MESSAGE)).not.toMatch(/pain|period|cramp|pms|sleep|heat|ibuprofen|product|pregnan/i);
  });
  it('local time and quiet hours (wrapping midnight)', () => {
    expect(localParts(EVENING, NY)).toEqual({ day: '2026-10-24', hhmm: '20:00' });
    expect(inQuietHours('23:30', '22:00', '07:00')).toBe(true);
    expect(inQuietHours('06:59', '22:00', '07:00')).toBe(true);
    expect(inQuietHours('20:00', '22:00', '07:00')).toBe(false);
    expect(inQuietHours('13:00', '12:00', '14:00')).toBe(true);
  });
  it('tonight: sends, or is dropped in quiet hours / after the daily cap / with notifications off', () => {
    const row = { kind: 'tonight', tz: NY };
    const quiet = { quietHoursEnabled: true, quietHoursStart: '22:00', quietHoursEnd: '07:00' };
    expect(planDelivery(row, {}, new Set(), EVENING)).toEqual({ action: 'send' });
    expect(planDelivery(row, quiet, new Set(), LATE)).toEqual({ action: 'skip', reason: 'quiet_hours' });
    expect(planDelivery(row, {}, new Set(['2026-10-24']), EVENING)).toEqual({ action: 'skip', reason: 'daily_cap' });
    expect(planDelivery(row, { notificationsEnabled: false }, new Set(), EVENING)).toEqual({ action: 'skip', reason: 'notifications_off' });
  });
  it('follow-up: waits out quiet hours and the cap instead of being dropped', () => {
    const row = { kind: 'follow_up', tz: NY };
    expect(planDelivery(row, { quietHoursEnabled: true, quietHoursStart: '22:00', quietHoursEnd: '07:00' }, new Set(), LATE).action).toBe('defer');
    expect(planDelivery(row, {}, new Set(['2026-10-24']), EVENING).action).toBe('defer');
  });
  it('sweep sends one per person per day and marks the rest', async () => {
    const updates = [];
    const rows = [
      { id: 'a', user_id: 'u1', kind: 'tonight', send_at: '2026-10-24T23:00:00Z', tz: NY },
      { id: 'b', user_id: 'u1', kind: 'tonight', send_at: '2026-10-24T23:30:00Z', tz: NY },
    ];
    const q = (result) => {
      const chain = { select: () => chain, eq: () => chain, lte: () => chain, gte: () => chain, in: () => chain, order: () => chain, limit: () => Promise.resolve(result), then: (r) => Promise.resolve(result).then(r) };
      return chain;
    };
    const admin = {
      from: (t) => ({
        ...(t === 'notification_preferences' ? q({ data: [] }) : q({ data: rows })),
        update: (patch) => ({ eq: (_k, id) => { updates.push({ id, ...patch }); return Promise.resolve({}); } }),
      }),
    };
    // The "recent sent" read reuses the same chain: give it nothing.
    rows.forEach((r) => { r.sent_at = undefined; });
    const pushes = [];
    const stats = await sweep(admin, { now: EVENING, push: async (_a, uid, msg) => { pushes.push({ uid, msg }); return { sent: 1 }; } });
    expect(pushes).toHaveLength(1);
    expect(pushes[0].msg).toBe(PUSH_MESSAGE);
    expect(stats.sent).toBe(1);
    expect(updates.find((u) => u.id === 'b')).toMatchObject({ status: 'skipped', skip_reason: 'daily_cap' });
  });
});

describe('rundown reminder', () => {
  it('private copy, and it waits rather than being dropped', async () => {
    const { RUNDOWN_PUSH_MESSAGE, messageFor, KINDS, planDelivery: plan } = await import('./today-reminders.js');
    expect(KINDS.has('rundown')).toBe(true);
    expect(RUNDOWN_PUSH_MESSAGE.body).toBe('Your daily rundown is ready.');
    expect(messageFor('rundown')).toBe(RUNDOWN_PUSH_MESSAGE);
    expect(messageFor('tonight').body).toBe('Your ayna check-in is ready');
    expect(plan({ kind: 'rundown', tz: 'America/New_York' }, {}, new Set(['2026-10-24']), Date.parse('2026-10-25T00:00:00Z')).action).toBe('defer');
  });
});

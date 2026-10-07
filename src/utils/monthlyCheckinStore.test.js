import './test-setup-localstorage.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({ getSupabaseClient: () => null }));

const {
  monthKey,
  previousMonthKey,
  monthLabel,
  resolveCheckinUserId,
  loadMonthlyCheckinStatus,
  saveMonthlyCheckin,
  guestCheckinDoneThisMonth,
  GUEST_COMPLETED_AT_KEY,
} = await import('./monthlyCheckinStore.js');

function makeSupabase({ user = { id: 'u1' }, rows = [], error = null, upsertError = null } = {}) {
  const calls = [];
  const builder = (table) => {
    const rec = { table, filters: [], order: null, limit: null, upsert: null };
    calls.push(rec);
    const b = {
      select: (cols) => { rec.select = cols; return b; },
      eq: (c, v) => { rec.filters.push(['eq', c, v]); return b; },
      lte: (c, v) => { rec.filters.push(['lte', c, v]); return b; },
      order: (c, o) => { rec.order = [c, o]; return b; },
      limit: (n) => { rec.limit = n; return Promise.resolve({ data: rows, error }); },
      upsert: (payload, opts) => { rec.upsert = { payload, opts }; return Promise.resolve({ error: upsertError }); },
    };
    return b;
  };
  return {
    calls,
    auth: {
      getSession: async () => ({ data: { session: user ? { user } : null } }),
      getUser: async () => ({ data: { user } }),
    },
    from: builder,
  };
}

const OCT_6 = new Date(2026, 9, 6, 12, 0, 0);

describe('month keys', () => {
  it('uses the local calendar month, always the 1st', () => {
    expect(monthKey(OCT_6)).toBe('2026-10-01');
    expect(monthKey(new Date(2026, 9, 1, 0, 5))).toBe('2026-10-01');
    expect(previousMonthKey(new Date(2026, 0, 15))).toBe('2025-12-01');
    expect(monthLabel('2026-10-01')).toMatch(/2026/);
    expect(monthLabel('nonsense')).toBe('');
  });
});

describe('resolveCheckinUserId', () => {
  it('returns the user id for an account and null for guests or no session', async () => {
    expect(await resolveCheckinUserId(makeSupabase())).toBe('u1');
    expect(await resolveCheckinUserId(makeSupabase({ user: { id: 'g1', is_anonymous: true } }))).toBeNull();
    expect(await resolveCheckinUserId(makeSupabase({ user: null }))).toBeNull();
    expect(await resolveCheckinUserId(null)).toBeNull();
  });
});

describe('loadMonthlyCheckinStatus', () => {
  it('splits this month from the latest earlier month', async () => {
    const sb = makeSupabase({
      rows: [
        { check_in_month: '2026-10-01', answers: { a: 1 } },
        { check_in_month: '2026-08-01', answers: { a: 0 } },
      ],
    });
    const s = await loadMonthlyCheckinStatus({ supabase: sb, now: OCT_6 });
    expect(s.signedIn).toBe(true);
    expect(s.thisMonthCheckin.answers).toEqual({ a: 1 });
    expect(s.lastCheckin.check_in_month).toBe('2026-08-01');
    expect(sb.calls[0].filters).toEqual([['eq', 'user_id', 'u1'], ['lte', 'check_in_month', '2026-10-01']]);
    expect(sb.calls[0].limit).toBe(2);
  });

  it('no row this month → only lastCheckin', async () => {
    const s = await loadMonthlyCheckinStatus({ supabase: makeSupabase({ rows: [{ check_in_month: '2026-09-01', answers: {} }] }), now: OCT_6 });
    expect(s.thisMonthCheckin).toBeNull();
    expect(s.lastCheckin.check_in_month).toBe('2026-09-01');
  });

  it('guests and signed-out users never query', async () => {
    const guest = makeSupabase({ user: { id: 'g', is_anonymous: true } });
    expect(await loadMonthlyCheckinStatus({ supabase: guest, now: OCT_6 })).toEqual({ signedIn: false, thisMonthCheckin: null, lastCheckin: null });
    expect(guest.calls).toHaveLength(0);
    expect((await loadMonthlyCheckinStatus({ supabase: null })).signedIn).toBe(false);
  });

  it('a query error still reports signedIn with no rows', async () => {
    const s = await loadMonthlyCheckinStatus({ supabase: makeSupabase({ error: { message: 'boom' } }), now: OCT_6 });
    expect(s).toEqual({ signedIn: true, thisMonthCheckin: null, lastCheckin: null });
  });
});

describe('saveMonthlyCheckin', () => {
  it('upserts on (user_id, check_in_month)', async () => {
    const sb = makeSupabase();
    const r = await saveMonthlyCheckin({ safetyConcern: 'No' }, { supabase: sb, now: OCT_6 });
    expect(r).toEqual({ saved: true, userId: 'u1' });
    expect(sb.calls[0].upsert.opts).toEqual({ onConflict: 'user_id,check_in_month' });
    expect(sb.calls[0].upsert.payload).toMatchObject({ user_id: 'u1', check_in_month: '2026-10-01', answers: { safetyConcern: 'No' } });
  });

  it('refuses guests, bad input and reports server errors without throwing', async () => {
    expect((await saveMonthlyCheckin({}, { supabase: makeSupabase({ user: { id: 'g', is_anonymous: true } }) })).reason).toBe('no_authenticated_user');
    expect((await saveMonthlyCheckin([], { supabase: makeSupabase() })).reason).toBe('invalid_answers');
    expect((await saveMonthlyCheckin({}, { supabase: null })).reason).toBe('supabase_not_configured');
    expect(await saveMonthlyCheckin({}, { supabase: makeSupabase({ upsertError: { message: 'rls' } }) })).toEqual({ saved: false, reason: 'rls' });
  });
});

describe('guestCheckinDoneThisMonth', () => {
  beforeEach(() => localStorage.clear());
  it('reads the timestamp App.jsx already stores', () => {
    expect(guestCheckinDoneThisMonth(OCT_6)).toBe(false);
    localStorage.setItem(GUEST_COMPLETED_AT_KEY, new Date(2026, 9, 2).toISOString());
    expect(guestCheckinDoneThisMonth(OCT_6)).toBe(true);
    localStorage.setItem(GUEST_COMPLETED_AT_KEY, new Date(2026, 8, 28).toISOString());
    expect(guestCheckinDoneThisMonth(OCT_6)).toBe(false);
    localStorage.setItem(GUEST_COMPLETED_AT_KEY, 'garbage');
    expect(guestCheckinDoneThisMonth(OCT_6)).toBe(false);
  });
});

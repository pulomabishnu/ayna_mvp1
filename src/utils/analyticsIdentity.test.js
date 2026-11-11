import { describe, it, expect, beforeEach, vi } from 'vitest';
import { identifyAccount, recordNewAccount, resolveAccountAnalyticsId, isoWeek, ageBucket, opaqueAccountKey } from './analyticsIdentity.js';

function memStorage() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() }; }
function fakeSupabase(rows = []) {
  const table = rows;
  return {
    rows: table,
    from() {
      let filt = null;
      const api = {
        select() { return api; },
        eq(_c, v) { filt = v; return api; },
        maybeSingle: async () => ({ data: table.find((r) => r.user_id === filt) || null, error: null }),
        upsert: async (row) => { if (!table.some((r) => r.user_id === row.user_id)) table.push(row); return { error: null }; },
      };
      return api;
    },
  };
}
function fakePosthog() {
  const calls = [];
  return { calls, identify: (id, p) => calls.push(['identify', id, p]), capture: (e, p) => calls.push(['capture', e, p]), setPersonProperties: (a, b) => calls.push(['set', a, b]), get_property: () => 'linkedin.com' };
}
const U = { id: '11111111-1111-1111-1111-111111111111', email: 'a@example.com', created_at: '2026-10-17T12:00:00Z', email_confirmed_at: '2026-10-17T12:01:00Z', app_metadata: { provider: 'google' } };

beforeEach(() => { globalThis.window = { localStorage: memStorage(), sessionStorage: memStorage() }; vi.stubGlobal('fetch', vi.fn(() => Promise.resolve())); vi.stubGlobal('localStorage', memStorage()); vi.stubGlobal('navigator', {}); });

describe('analytics identity', () => {
  it('reuses the id stored on the account, on any device', async () => {
    const sb = fakeSupabase([{ user_id: U.id, analytics_id: 'ayna_existing-account-id' }]);
    expect(await resolveAccountAnalyticsId(sb, U.id)).toBe('ayna_existing-account-id');
    expect(window.localStorage.getItem(`ayna_analytics_id_v1:${opaqueAccountKey(U.id)}`)).toBe('ayna_existing-account-id');
  });
  it("saves this browser's existing id to the account the first time (keeps history)", async () => {
    window.localStorage.setItem(`ayna_analytics_id_v1:${opaqueAccountKey(U.id)}`, 'ayna_browser-id-123');
    const sb = fakeSupabase();
    expect(await resolveAccountAnalyticsId(sb, U.id)).toBe('ayna_browser-id-123');
    expect(sb.rows[0]).toEqual({ user_id: U.id, analytics_id: 'ayna_browser-id-123' });
  });
  it('a new account: identify, then signed_up once, then one session event', async () => {
    const ph = fakePosthog();
    const sb = fakeSupabase();
    const now = Date.parse('2026-10-17T12:05:00Z');
    await identifyAccount(ph, sb, U, { now });
    const names = ph.calls.map((c) => c[0] === 'capture' ? c[1] : c[0]);
    expect(names).toEqual(['identify', 'set', 'signed_up', 'account_session_started']);
    expect(ph.calls.find((c) => c[1] === 'signed_up')[2]).toEqual({ method: 'google', referral_source: 'linkedin.com' });
    await new Promise((r) => setTimeout(r, 0));
    await identifyAccount(ph, sb, U, { now: now + 1000 });
    expect(ph.calls.filter((c) => c[1] === 'signed_up')).toHaveLength(1);
    expect(ph.calls.filter((c) => c[1] === 'account_session_started')).toHaveLength(1);
  });
  it('a returning account gets no signed_up and is_returning true', async () => {
    const ph = fakePosthog();
    await identifyAccount(ph, fakeSupabase(), U, { now: Date.parse('2026-10-25T12:00:00Z') });
    expect(ph.calls.some((c) => c[1] === 'signed_up')).toBe(false);
    expect(ph.calls.find((c) => c[1] === 'account_session_started')[2]).toEqual({ is_returning: true, account_age_days_bucket: '7-29d' });
  });
  it('records a selected signup source without sending free text', async () => {
    const ph = fakePosthog();
    const user = { ...U, user_metadata: { heard_about: 'other', heard_about_other: 'private detail' } };
    await identifyAccount(ph, fakeSupabase(), user, { now: Date.parse('2026-10-17T12:05:00Z') });
    expect(ph.calls.find((c) => c[1] === 'signed_up')[2]).toEqual({ method: 'google', referral_source: 'linkedin.com', heard_about_source: 'other' });
    expect(JSON.stringify(ph.calls)).not.toContain('private detail');
  });
  it('never sends the email or Supabase id as an event property', async () => {
    const ph = fakePosthog();
    await identifyAccount(ph, fakeSupabase(), U, { now: Date.parse('2026-10-17T12:05:00Z') });
    const props = JSON.stringify(ph.calls.filter((c) => c[0] !== 'identify'));
    expect(props).not.toContain('a@example.com');
    expect(props).not.toContain(U.id);
  });
  it('works without the table (falls back to a browser id)', async () => {
    const ph = fakePosthog();
    const id = await identifyAccount(ph, { from() { throw new Error('missing'); } }, U, { now: Date.parse('2026-10-20T00:00:00Z') });
    expect(id).toMatch(/^ayna_/);
  });
  it('helpers', () => {
    expect(isoWeek('2026-10-17T12:00:00Z')).toBe('2026-W42');
    expect(ageBucket(0.5)).toBe('<1d');
    expect(ageBucket(45)).toBe('30-89d');
    vi.restoreAllMocks();
  });
});

describe('recordNewAccount (signed_up undercount fix, 2026-11-11)', () => {
  const NEW = { id: '22222222-2222-2222-2222-222222222222', created_at: '2026-11-11T12:00:00Z', email_confirmed_at: null, identities: [{ id: 'x' }], app_metadata: { provider: 'email' }, user_metadata: {} };
  it('fires at email sign-up, before the code is verified, and counts account_created', () => {
    const ph = fakePosthog();
    expect(recordNewAccount(ph, NEW, { method: 'email' })).toBe(true);
    expect(ph.calls).toEqual([['capture', 'signed_up', { method: 'email', referral_source: 'linkedin.com' }]]);
    const [url, init] = globalThis.fetch.mock.calls[0];
    expect(url).toBe('/api/step');
    expect(init.body).toBe('{"s":"account_created","pl":"web"}');
  });
  it('once per account: verifying the code an hour later does not send it again', async () => {
    const ph = fakePosthog();
    recordNewAccount(ph, NEW, { method: 'email' });
    await identifyAccount(ph, fakeSupabase(), { ...NEW, email_confirmed_at: '2026-11-11T13:00:00Z' }, { now: Date.parse('2026-11-11T12:10:00Z') });
    expect(ph.calls.filter((c) => c[1] === 'signed_up')).toHaveLength(1);
    expect(globalThis.fetch.mock.calls.filter((c) => c[1].body.includes('account_created'))).toHaveLength(1);
  });
  it('an email that already has an account is not a new account', () => {
    const ph = fakePosthog();
    expect(recordNewAccount(ph, { ...NEW, identities: [] }, { method: 'email' })).toBe(false);
    expect(ph.calls).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
  it('Google/Apple/phone accounts still record at their first sign-in', async () => {
    const ph = fakePosthog();
    const phone = { ...NEW, id: '33333333-3333-3333-3333-333333333333', identities: undefined, app_metadata: { provider: 'phone' } };
    await identifyAccount(ph, fakeSupabase(), phone, { now: Date.parse('2026-11-11T12:05:00Z') });
    expect(ph.calls.find((c) => c[1] === 'signed_up')[2]).toMatchObject({ method: 'phone' });
  });
});

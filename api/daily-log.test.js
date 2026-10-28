/**
 * /api/daily-log: who may read and write, validation, per-field merging with
 * what's stored, fixed provenance, and the quiet "not ready" answer when the
 * tables don't exist yet. Only Supabase is mocked; auth, validation, merging
 * and the in-memory rate limiter are the real code. All data is made up.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const CONFIRMED = '2026-10-01T00:00:00Z';
const USERS = {
  'tok-a': { id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'a@example.com', email_confirmed_at: CONFIRMED },
  'tok-b': { id: 'aaaaaaaa-0000-0000-0000-000000000002', email: 'b@example.com', email_confirmed_at: CONFIRMED },
  'tok-guest': { id: 'aaaaaaaa-0000-0000-0000-00000000000f', is_anonymous: true },
};
const db = { user_daily_log: [], user_tries: [], missing: false, calls: [] };

function table(name) {
  const filters = [];
  const api = {
    select() { return api; },
    eq(col, v) { filters.push((r) => r[col] === v); return api; },
    in(col, vs) { filters.push((r) => vs.includes(r[col])); return api; },
    gte(col, v) { filters.push((r) => r[col] >= v); return api; },
    lte(col, v) { filters.push((r) => r[col] <= v); return api; },
    order() { return api; },
    upsert(rows, opts) {
      db.calls.push({ name, op: 'upsert', rows, opts });
      if (db.missing) return Promise.resolve({ data: null, error: { code: '42P01', message: `relation "public.${name}" does not exist` } });
      const key = name === 'user_daily_log' ? 'day' : 'id';
      for (const r of rows) {
        const i = db[name].findIndex((x) => x.user_id === r.user_id && x[key] === r[key]);
        if (i >= 0) db[name][i] = r; else db[name].push(r);
      }
      return Promise.resolve({ data: null, error: null });
    },
    then(resolve, reject) {
      const out = db.missing
        ? { data: null, error: { code: 'PGRST205', message: `Could not find the table 'public.${name}' in the schema cache` } }
        : { data: db[name].filter((r) => filters.every((f) => f(r))), error: null };
      return Promise.resolve(out).then(resolve, reject);
    },
  };
  return api;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: (_url, _key, opts) => {
    const token = String(opts?.global?.headers?.Authorization || '').replace('Bearer ', '');
    return {
      auth: { getUser: vi.fn(async () => (USERS[token] ? { data: { user: USERS[token] }, error: null } : { data: null, error: { message: 'bad jwt' } })) },
      from: (name) => table(name),
    };
  },
}));

const { default: handler, cleanEntries } = await import('./daily-log.js');

function req({ method = 'GET', body, query = {}, token = 'tok-a' } = {}) {
  return { method, body, query, headers: token ? { authorization: `Bearer ${token}` } : {}, socket: {} };
}
async function run(r) { const res = mockRes(); await handler(r, res); return res; }

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'public-anon-key');
  db.user_daily_log = []; db.user_tries = []; db.missing = false; db.calls = [];
});
afterEach(() => vi.unstubAllEnvs());

describe('access', () => {
  it('refuses signed-out callers, bad tokens and guests', async () => {
    for (const token of [null, 'tok-unknown', 'tok-guest']) expect((await run(req({ token }))).statusCode).toBe(401);
  });
  it('only GET and POST, never cached', async () => {
    const res = await run(req({ method: 'DELETE' }));
    expect(res.statusCode).toBe(405);
    const ok = await run(req());
    expect(ok.headers['cache-control']).toMatch(/no-store/);
  });
});

describe('POST', () => {
  it('saves entries as her own rows with fixed provenance', async () => {
    const res = await run(req({ method: 'POST', body: { entries: [{ day: '2026-10-24', pain: 2, flow: 'light', updatedAt: '2026-10-24T08:00:00Z', source: 'oura', user_id: 'someone-else' }] } }));
    expect(res.statusCode).toBe(200);
    expect(res.body.saved).toEqual({ entries: 1, tries: 0 });
    const row = db.user_daily_log[0];
    expect(row).toMatchObject({ user_id: USERS['tok-a'].id, day: '2026-10-24', pain: 2, flow: 'light', source: 'self_report', method: 'manual' });
  });
  it('merges per field with what is stored (newest wins)', async () => {
    db.user_daily_log.push({ user_id: USERS['tok-a'].id, day: '2026-10-24', pain: 1, flow: null, pms: null, sleep: 3, mood: null, skin: null, field_at: { pain: '2026-10-24T06:00:00Z', sleep: '2026-10-24T09:00:00Z' }, updated_at: '2026-10-24T09:00:00Z' });
    await run(req({ method: 'POST', body: { entries: [{ day: '2026-10-24', pain: 3, sleep: 1, updatedAt: '2026-10-24T08:00:00Z', fieldAt: { pain: '2026-10-24T08:00:00Z', sleep: '2026-10-24T07:00:00Z' } }] } }));
    expect(db.user_daily_log[0]).toMatchObject({ pain: 3, sleep: 3 });
  });
  it('rejects bad shapes and drops invalid entries', async () => {
    expect((await run(req({ method: 'POST', body: { entries: 'x' } }))).statusCode).toBe(400);
    expect((await run(req({ method: 'POST', body: { entries: Array.from({ length: 401 }, () => ({})) } }))).statusCode).toBe(413);
    const res = await run(req({ method: 'POST', body: { entries: [{ day: 'nope' }, { day: '2026-10-24', pain: 7 }] } }));
    expect(res.body.rejected.entries).toBe(1);
    expect(db.user_daily_log[0].pain).toBeNull();
  });
  it('a far-future device clock cannot win every merge', () => {
    const now = Date.parse('2026-10-24T12:00:00Z');
    const [e] = cleanEntries([{ day: '2026-10-24', pain: 1, updatedAt: '2030-01-01T00:00:00Z', fieldAt: { pain: '2030-01-01T00:00:00Z' } }], now);
    expect(e.updatedAt).toBe('2026-10-24T12:00:00.000Z');
    expect(e.fieldAt.pain).toBe('2026-10-24T12:00:00.000Z');
  });
  it('saves tries, newest per try wins, status never stored', async () => {
    const t = { id: 'trial:abc', kind: 'action', ref: 'Heat on day 1', need: 'cramps', startedDay: '2026-10-01', horizonDays: 28, outcome: 'helpful', recordedDay: '2026-10-20', status: 'recorded', updatedAt: '2026-10-20T00:00:00Z' };
    await run(req({ method: 'POST', body: { tries: [t] } }));
    await run(req({ method: 'POST', body: { tries: [{ ...t, outcome: null, updatedAt: '2026-10-02T00:00:00Z' }] } }));
    expect(db.user_tries).toHaveLength(1);
    expect(db.user_tries[0]).toMatchObject({ outcome: 'helpful', source: 'self_report', method: 'manual', user_id: USERS['tok-a'].id });
    expect(db.user_tries[0]).not.toHaveProperty('status');
  });
});

describe('GET', () => {
  it('returns only her rows in range, as entries and tries', async () => {
    db.user_daily_log.push(
      { user_id: USERS['tok-a'].id, day: '2026-10-20', pain: 2, field_at: {}, updated_at: '2026-10-20T08:00:00Z' },
      { user_id: USERS['tok-a'].id, day: '2025-01-01', pain: 1, field_at: {}, updated_at: '2025-01-01T08:00:00Z' },
      { user_id: USERS['tok-b'].id, day: '2026-10-20', pain: 3, field_at: {}, updated_at: '2026-10-20T08:00:00Z' },
    );
    const res = await run(req({ query: { from: '2026-10-01', to: '2026-10-24' } }));
    expect(res.statusCode).toBe(200);
    expect(res.body.entries).toEqual([expect.objectContaining({ day: '2026-10-20', pain: 2 })]);
    expect(res.body.tries).toEqual([]);
    expect((await run(req({ query: { from: '2026-10-24', to: '2026-10-01' } }))).statusCode).toBe(400);
  });
});

describe('before the SQL is run', () => {
  it('answers 503 not_ready so the client keeps her data and retries later', async () => {
    db.missing = true;
    expect((await run(req())).body).toEqual({ error: 'not_ready' });
    const res = await run(req({ method: 'POST', body: { entries: [{ day: '2026-10-24', pain: 1 }] } }));
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('not_ready');
  });
});

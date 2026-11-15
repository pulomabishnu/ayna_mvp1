/**
 * /api/day-plan: who may read and write, cleaning, merging with what's stored, and the quiet
 * "not ready" answer before the table exists. Only Supabase is mocked. All data is made up.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const CONFIRMED = '2026-10-01T00:00:00Z';
const USERS = {
  'tok-a': { id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'a@example.com', email_confirmed_at: CONFIRMED },
  'tok-guest': { id: 'aaaaaaaa-0000-0000-0000-00000000000f', is_anonymous: true },
};
const db = { rows: [], missing: false };
function table() {
  const filters = [];
  const api = {
    select() { return api; },
    eq(col, v) { filters.push((r) => r[col] === v); return api; },
    maybeSingle() {
      if (db.missing) return Promise.resolve({ data: null, error: { code: 'PGRST205', message: "Could not find the table 'public.user_day_plan' in the schema cache" } });
      return Promise.resolve({ data: db.rows.find((r) => filters.every((f) => f(r))) || null, error: null });
    },
    upsert(row) {
      if (db.missing) return Promise.resolve({ error: { code: '42P01', message: 'relation does not exist' } });
      const i = db.rows.findIndex((x) => x.user_id === row.user_id);
      if (i >= 0) db.rows[i] = row; else db.rows.push(row);
      return Promise.resolve({ error: null });
    },
  };
  return api;
}
vi.mock('@supabase/supabase-js', () => ({
  createClient: (_u, _k, opts) => {
    const token = String(opts?.global?.headers?.Authorization || '').replace('Bearer ', '');
    return { auth: { getUser: vi.fn(async () => (USERS[token] ? { data: { user: USERS[token] }, error: null } : { data: null, error: { message: 'bad' } })) }, from: () => table() };
  },
}));
const { default: handler } = await import('./day-plan.js');
const req = ({ method = 'GET', body, token = 'tok-a' } = {}) => ({ method, body, query: {}, headers: token ? { authorization: `Bearer ${token}` } : {}, socket: {} });
const run = async (r) => { const res = mockRes(); await handler(r, res); return res; };
const med = (id, name, updatedAt) => ({ id, name, dose: '50', unit: 'mcg', kind: 'scheduled', freq: 'daily', days: [], times: ['08:00'], remind: true, active: true, updatedAt });

beforeEach(() => { vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co'); vi.stubEnv('SUPABASE_ANON_KEY', 'k'); db.rows = []; db.missing = false; });
afterEach(() => vi.unstubAllEnvs());

describe('/api/day-plan', () => {
  it('refuses signed-out and guests; never cached', async () => {
    expect((await run(req({ token: null }))).statusCode).toBe(401);
    expect((await run(req({ token: 'tok-guest' }))).statusCode).toBe(401);
    expect((await run(req())).headers['cache-control']).toMatch(/no-store/);
  });
  it('merges two devices: newest medication edit wins, doses from both, undone doses stay gone', async () => {
    await run(req({ method: 'POST', body: { plan: { meds: [med('m_1', 'Old name', '2026-11-14T08:00:00Z')], doses: [{ id: 'd_1', medId: 'm_1', day: '2026-11-14', time: '08:00', status: 'taken', at: '2026-11-14T08:01:00Z' }] } } }));
    const res = await run(req({ method: 'POST', body: { plan: { meds: [med('m_1', 'New name', '2026-11-15T08:00:00Z')], doses: [{ id: 'd_2', medId: 'm_1', day: '2026-11-15', time: '08:00', status: 'taken', at: '2026-11-15T08:01:00Z' }], removed: ['d_1'] } } }));
    expect(res.statusCode).toBe(200);
    expect(res.body.plan.meds.map((m) => m.name)).toEqual(['New name']);
    expect(res.body.plan.doses.map((d) => d.id)).toEqual(['d_2']);
    const again = await run(req({ method: 'POST', body: { plan: { doses: [{ id: 'd_1', medId: 'm_1', day: '2026-11-14', time: '08:00', status: 'taken', at: '2026-11-14T08:01:00Z' }] } } }));
    expect(again.body.plan.doses.map((d) => d.id)).toEqual(['d_2']);
    expect(db.rows[0].user_id).toBe(USERS['tok-a'].id);
  });
  it('drops junk and unknown fields', async () => {
    const res = await run(req({ method: 'POST', body: { plan: { meds: [{ id: 'bad id!', name: 'x' }, { ...med('m_2', 'Ok', '2026-11-15T00:00:00Z'), secret: 'no' }], doses: [{ id: 'd', medId: 'm_2', day: 'nope', status: 'taken', at: 'x' }] } } }));
    expect(res.body.plan.meds).toHaveLength(1);
    expect(res.body.plan.meds[0].secret).toBeUndefined();
    expect(res.body.plan.doses).toHaveLength(0);
  });
  it('bad body is 400; table missing is a quiet 503 not_ready', async () => {
    expect((await run(req({ method: 'POST', body: { plan: 'x' } }))).statusCode).toBe(400);
    db.missing = true;
    const res = await run(req({ method: 'POST', body: { plan: {} } }));
    expect(res.statusCode).toBe(503);
    expect(res.body.error).toBe('not_ready');
  });
});

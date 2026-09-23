import { describe, it, expect, vi, beforeEach } from 'vitest';

const state = { user: { id: 'u1', email: 'a@b.co', email_confirmed_at: 'x', created_at: '2026-01-01', user_metadata: {}, identities: [{ provider: 'email' }] } };
const tables = {
  health_intakes: { user_id: 'u1', profile: { age: '30' } },
  notification_preferences: { user_id: 'u1', notifications_enabled: true },
  user_ecosystems: [{ product_id: 'p1', product_name: 'P1', in_ecosystem: true }],
};
function builder(table) {
  const b = { select: () => b, eq: () => b, maybeSingle: async () => ({ data: Array.isArray(tables[table]) ? null : tables[table] || null, error: null }), then: (res, rej) => Promise.resolve({ data: Array.isArray(tables[table]) ? tables[table] : [], error: null }).then(res, rej) };
  return b;
}
vi.mock('./_usageLimit.js', () => ({ verifyUser: async () => (state.user ? { user: state.user } : { user: null, error: 'unauthorized' }) }));
vi.mock('./_userScopedSupabase.js', () => ({ verifyUserWithRls: async () => ({ user: null, error: 'unauthorized' }) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: (t) => builder(t) }) }));

function mockRes() { const r = { statusCode: 0, body: null, headers: {} }; r.setHeader = (k, v) => { r.headers[k] = v; }; r.status = (c) => { r.statusCode = c; return r; }; r.json = (b) => { r.body = b; return r; }; r.end = () => r; return r; }

describe('/api/export-data', () => {
  beforeEach(() => { vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co'); vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'k'); });
  const call = async (method = 'GET') => { const { default: h } = await import('./export-data.js'); const res = mockRes(); await h({ method, headers: {} }, res); return res; };

  it('returns the signed-in user\'s account data', async () => {
    const r = await call();
    expect(r.statusCode).toBe(200);
    expect(r.body.account.email).toBe('a@b.co');
    expect(r.body.healthIntake.profile.age).toBe('30');
    expect(r.body.savedAndEcosystemProducts).toHaveLength(1);
  });
  it('401 when signed out', async () => { const u = state.user; state.user = null; expect((await call()).statusCode).toBe(401); state.user = u; });
  it('405 for POST', async () => { expect((await call('POST')).statusCode).toBe(405); });
});

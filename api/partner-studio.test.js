/**
 * /api/partner-studio: feature flag, admin gate, tenant validation and the
 * "no consumer data" contract (Phase 1 plan, pp.13 and 17). Fictional seed data.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';
import { fixtureSnapshot } from '../src/partnerStudio/engine/fixture.js';

const CONFIRMED = '2026-10-01T00:00:00Z';
const USERS = {
  'tok-admin': { id: 'a1', email: 'admin@aynahealth.co', email_confirmed_at: CONFIRMED },
  'tok-unconfirmed': { id: 'a2', email: 'admin@aynahealth.co', email_confirmed_at: null, confirmed_at: CONFIRMED },
  'tok-member': { id: 'm1', email: 'member@example.com', email_confirmed_at: CONFIRMED },
  'tok-guest': { id: 'g1', email: 'admin@aynahealth.co', email_confirmed_at: CONFIRMED, is_anonymous: true },
};
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser: vi.fn(async (t) => (USERS[t] ? { data: { user: USERS[t] }, error: null } : { data: null, error: { message: 'bad' } })) } }),
}));
const holder = vi.hoisted(() => ({ snap: null }));
vi.mock('./_partnerStudio/snapshot.js', () => ({ get default() { return holder.snap; } }));

const call = async (query = {}, token = 'tok-admin') => {
  const { default: handler } = await import('./partner-studio.js');
  const res = mockRes();
  await handler({ method: 'GET', query, headers: token ? { authorization: `Bearer ${token}` } : {} }, res);
  return res;
};

beforeEach(() => {
  holder.snap = fixtureSnapshot();
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-not-a-key');
  vi.stubEnv('ADMIN_EMAILS', 'admin@aynahealth.co');
  vi.stubEnv('PARTNER_STUDIO_ENABLED', '1');
  vi.stubEnv('PARTNER_STUDIO_LOCAL_DEMO', '');
});
afterEach(() => vi.unstubAllEnvs());

describe('partner-studio route', () => {
  it('is a 404 when the feature flag is off, even for an admin', async () => {
    vi.stubEnv('PARTNER_STUDIO_ENABLED', '');
    expect((await call()).statusCode).toBe(404);
  });

  it('rejects logged-out, forged and guest sessions with 401', async () => {
    expect((await call({}, null)).statusCode).toBe(401);
    expect((await call({}, 'tok-forged')).statusCode).toBe(401);
    expect((await call({}, 'tok-guest')).statusCode).toBe(401);
  });

  it('rejects a normal user and an unconfirmed admin address with 403', async () => {
    expect((await call({}, 'tok-member')).statusCode).toBe(403);
    expect((await call({}, 'tok-unconfirmed')).statusCode).toBe(403);
  });

  it('fails closed when ADMIN_EMAILS is empty', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    expect((await call()).statusCode).toBe(403);
  });

  it('returns a brand rollup with run metadata to an admin', async () => {
    const res = await call({ brand: 'Demo Brand' });
    expect(res.statusCode).toBe(200);
    expect(res.body.brand.name).toBe('Demo Brand');
    expect(res.body.run.runId).toBe('run-fixture');
    expect(res.body.brand.categories[0].slotShare).not.toBeUndefined();
    expect(res.headers['cache-control']).toMatch(/no-store/);
  });

  it('rejects a brand that is not a tenant, including prototype keys', async () => {
    expect((await call({ brand: 'constructor' })).statusCode).toBe(404);
    expect((await call({ brand: 'Not A Brand' })).statusCode).toBe(404);
  });

  it('answers 503 when no benchmark was built', async () => {
    holder.snap = { run: null, categories: [], brands: {}, outOfScope: '' };
    expect((await call()).statusCode).toBe(503);
  });

  it('the local demo bypass never works on Vercel', async () => {
    vi.stubEnv('PARTNER_STUDIO_LOCAL_DEMO', '1');
    vi.stubEnv('VERCEL_ENV', 'preview');
    expect((await call({}, null)).statusCode).toBe(401);
  });

  it('carries no consumer, user or event fields', async () => {
    const text = JSON.stringify((await call({ brand: 'Demo Brand' })).body);
    expect(text).not.toMatch(/"(user_?id|email|distinct_id|session_?id|analytics_id)"\s*:/i);
  });

  it('only allows GET', async () => {
    const { default: handler } = await import('./partner-studio.js');
    const res = mockRes();
    await handler({ method: 'POST', query: {}, headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });
});

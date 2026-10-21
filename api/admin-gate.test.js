/**
 * Every admin API route rejects logged-out callers, normal users, guests and
 * an unconfirmed account that merely uses an admin's address. The check runs
 * on the server, so hiding the /admin pages is never the only gate.
 *
 * Only Supabase is mocked: the real verifyUser in _usageLimit.js runs, so a
 * missing token, an anonymous session and an unknown token all take the same
 * path they take in production.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const CONFIRMED = '2026-10-01T00:00:00Z';
const USERS = {
  'tok-admin': { id: 'a1', email: 'Admin@AynaHealth.co', email_confirmed_at: CONFIRMED },
  'tok-unconfirmed-admin': { id: 'a2', email: 'admin@aynahealth.co', email_confirmed_at: null, phone_confirmed_at: CONFIRMED, confirmed_at: CONFIRMED },
  'tok-member': { id: 'm1', email: 'member@example.com', email_confirmed_at: CONFIRMED },
  'tok-guest': { id: 'g1', email: 'admin@aynahealth.co', email_confirmed_at: CONFIRMED, is_anonymous: true },
};

function fakeClient() {
  const empty = { data: [], error: null };
  const chain = new Proxy(function chain() {}, {
    get(_t, prop) {
      if (prop === 'then') return (resolve) => resolve(empty);
      if (prop === 'maybeSingle' || prop === 'single') return async () => ({ data: null, error: null });
      return () => chain;
    },
  });
  return {
    auth: {
      getUser: vi.fn(async (token) => (USERS[token] ? { data: { user: USERS[token] }, error: null } : { data: null, error: { message: 'bad jwt' } })),
      admin: { listUsers: vi.fn(async () => ({ data: { users: [] }, error: null })), getUserById: vi.fn(async () => ({ data: null })) },
    },
    from: () => chain,
    rpc: vi.fn(async () => ({ data: { campaign: { id: 'x' }, people: [], inventory: [] }, error: null })),
  };
}

vi.mock('@supabase/supabase-js', () => ({ createClient: () => fakeClient() }));
vi.mock('./_feedbackStore.js', () => ({ listFeedback: vi.fn(async () => ({ results: [], nextCursor: null })) }));

const routes = {
  'reviews-admin': { load: () => import('./reviews-admin.js'), method: 'GET', query: {} },
  'campaign-admin': { load: () => import('./campaign-admin.js'), method: 'GET', query: {} },
  'research-product (draft list)': { load: () => import('./research-product.js'), method: 'GET', query: { list: '1' } },
};

function req(method, query, token) {
  return { method, query, body: {}, headers: token ? { authorization: `Bearer ${token}` } : {} };
}

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-not-a-key');
  vi.stubEnv('ADMIN_EMAILS', 'admin@aynahealth.co');
  vi.stubEnv('CAMPAIGN_TEAM_EMAIL', '');
});
afterEach(() => vi.unstubAllEnvs());

describe.each(Object.entries(routes))('admin route %s', (_name, route) => {
  const call = async (token) => {
    const { default: handler } = await route.load();
    const res = mockRes();
    await handler(req(route.method, route.query, token), res);
    return res;
  };

  it('rejects a logged-out request with 401 and no data', async () => {
    const res = await call(null);
    expect(res.statusCode).toBe(401);
    expect(JSON.stringify(res.body)).not.toMatch(/results|drafts|people|inventory/);
  });

  it('rejects an invalid token with 401', async () => {
    expect((await call('tok-forged')).statusCode).toBe(401);
  });

  it('rejects a guest (anonymous) session even with an admin address', async () => {
    expect((await call('tok-guest')).statusCode).toBe(401);
  });

  it('rejects a normal signed-in user with 403', async () => {
    const res = await call('tok-member');
    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'forbidden' });
  });

  it('rejects an account whose admin email is not confirmed (phone-confirmed only)', async () => {
    expect((await call('tok-unconfirmed-admin')).statusCode).toBe(403);
  });

  it('rejects everyone when ADMIN_EMAILS is empty (fail closed)', async () => {
    vi.stubEnv('ADMIN_EMAILS', '');
    expect((await call('tok-admin')).statusCode).toBe(403);
  });

  it('lets a confirmed admin in', async () => {
    expect((await call('tok-admin')).statusCode).toBe(200);
  });
});

describe('isAdminUser', () => {
  it('needs email_confirmed_at, not confirmed_at', async () => {
    const { isAdminUser } = await import('./_admin.js');
    expect(isAdminUser(USERS['tok-admin'])).toBe(true);
    expect(isAdminUser(USERS['tok-unconfirmed-admin'])).toBe(false);
    expect(isAdminUser(USERS['tok-guest'])).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });
});

describe('push-broadcast (password admin page)', () => {
  it('refuses to send without the admin password', async () => {
    vi.stubEnv('ADMIN_PUSH_SECRET', 'a-long-test-secret-value-123456');
    const { default: handler } = await import('./push-broadcast.js');
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { title: 't', body: 'b', password: 'wrong', action: 'send' } }, res);
    expect(res.statusCode).toBe(401);
  });
  it('is closed when ADMIN_PUSH_SECRET is not set', async () => {
    vi.stubEnv('ADMIN_PUSH_SECRET', '');
    const { default: handler } = await import('./push-broadcast.js');
    const res = mockRes();
    await handler({ method: 'POST', headers: {}, body: { title: 't', body: 'b', password: '', action: 'send' } }, res);
    expect(res.statusCode).toBe(503);
  });
});

describe('send-test-email (team only)', () => {
  it('403 for a normal user, 401 logged out', async () => {
    const { default: handler } = await import('./send-test-email.js');
    let res = mockRes();
    await handler(req('POST', {}, null), res);
    expect(res.statusCode).toBe(401);
    res = mockRes();
    await handler(req('POST', {}, 'tok-member'), res);
    expect(res.statusCode).toBe(403);
  });
});

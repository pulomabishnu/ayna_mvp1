/**
 * /api/community-topics-admin: nothing loads or changes for anyone but a
 * confirmed ADMIN_EMAILS account, and anonymous creators stay anonymous
 * even on the admin screen. Only Supabase is mocked.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const CONFIRMED = '2026-10-01T00:00:00Z';
const USERS = {
  'tok-admin': { id: 'ad', email: 'Admin@AynaHealth.co', email_confirmed_at: CONFIRMED },
  'tok-unconfirmed-admin': { id: 'a2', email: 'admin@aynahealth.co', email_confirmed_at: null, phone_confirmed_at: CONFIRMED },
  'tok-member': { id: 'm1', email: 'member@example.com', email_confirmed_at: CONFIRMED },
  'tok-guest': { id: 'g1', email: 'admin@aynahealth.co', email_confirmed_at: CONFIRMED, is_anonymous: true },
};
const TOPICS = [
  { id: 't-anon', name: 'Quiet room', status: 'pending', visibility: 'public', creator_anonymous: true, created_by: 'secret-user' },
  { id: 't-named', name: 'Adeno', status: 'pending', visibility: 'public', creator_anonymous: false, created_by: 'named-user' },
];
const writes = [];

function chain(table, filters = []) {
  const result = () => {
    if (table === 'community_topics') {
      const status = filters.find(([k]) => k === 'status')?.[1];
      return { data: status ? TOPICS.filter((t) => t.status === status) : TOPICS, error: null };
    }
    if (table === 'community_profiles') return { data: [{ user_id: 'named-user', username: 'maya' }, { user_id: 'secret-user', username: 'should-not-show' }], error: null };
    if (table === 'suggestions') return { data: [{ id: 's1', topic: 'Adenomyosis', reason: null, created_at: CONFIRMED, reviewed_at: null }], error: null };
    return { data: [], error: null };
  };
  const api = {
    select: () => api,
    eq: (k, v) => chain(table, [...filters, [k, v]]),
    in: () => api, neq: () => api, order: () => api, limit: () => api,
    update: (patch) => { writes.push({ table, patch }); return api; },
    maybeSingle: async () => ({ data: { id: 'x', status: 'visible' }, error: null }),
    then: (resolve) => resolve(result()),
  };
  return api;
}

vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  auth: { getUser: vi.fn(async (token) => (USERS[token] ? { data: { user: USERS[token] }, error: null } : { data: null, error: { message: 'bad jwt' } })) },
  from: (table) => chain(table),
}) }));

const { default: handler } = await import('./community-topics-admin.js');
const req = (method, token, body = {}) => ({ method, query: {}, body, headers: token ? { authorization: `Bearer ${token}` } : {} });

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-only-not-a-key');
  vi.stubEnv('ADMIN_EMAILS', 'admin@aynahealth.co');
  writes.length = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe('server-side admin gate', () => {
  it.each([
    ['logged out', null, 401],
    ['an unknown token', 'tok-x', 401],
    ['a normal member', 'tok-member', 403],
    ['a guest using an admin address', 'tok-guest', 401],
    ['an unconfirmed admin address', 'tok-unconfirmed-admin', 403],
  ])('refuses %s, for reads and writes', async (_label, token, code) => {
    for (const [method, body] of [['GET'], ['POST', { action: 'approve', topicId: '123e4567-e89b-12d3-a456-426614174000' }]]) {
      const res = mockRes();
      await handler(req(method, token, body), res);
      expect(res.statusCode).toBe(code);
      expect(res.body).not.toHaveProperty('topics');
    }
    expect(writes).toHaveLength(0);
  });
});

describe('for an admin', () => {
  it('lists pending topics and suggestions without creator ids, and keeps anonymous creators anonymous', async () => {
    const res = mockRes();
    await handler(req('GET', 'tok-admin'), res);
    expect(res.statusCode).toBe(200);
    const pending = res.body.topics.pending;
    expect(pending.map((t) => t.creator_label)).toEqual(['Anonymous member', '@maya']);
    expect(JSON.stringify(res.body)).not.toMatch(/secret-user|named-user|should-not-show/);
    expect(res.body.suggestions.rows[0].topic).toBe('Adenomyosis');
    expect(res.headers['cache-control']).toMatch(/no-store/);
  });
  it('approves and hides through status only, closing reports on hide', async () => {
    const res = mockRes();
    await handler(req('POST', 'tok-admin', { action: 'approve', topicId: '123e4567-e89b-12d3-a456-426614174000' }), res);
    expect(res.statusCode).toBe(200);
    expect(writes).toEqual([{ table: 'community_topics', patch: { status: 'visible' } }]);
    writes.length = 0;
    await handler(req('POST', 'tok-admin', { action: 'hide', topicId: '123e4567-e89b-12d3-a456-426614174000' }), mockRes());
    expect(writes.map((w) => w.table)).toEqual(['community_topics', 'community_reports']);
    expect(writes[1].patch.status).toBe('actioned');
  });
  it('rejects unknown actions and bad ids', async () => {
    for (const body of [{ action: 'delete', topicId: '123e4567-e89b-12d3-a456-426614174000' }, { action: 'approve', topicId: 'x' }, { action: 'suggestion-done', suggestionId: '1;drop' }]) {
      const res = mockRes();
      await handler(req('POST', 'tok-admin', body), res);
      expect(res.statusCode).toBe(400);
    }
    expect(writes).toHaveLength(0);
  });
  it('marks a suggestion done', async () => {
    const res = mockRes();
    await handler(req('POST', 'tok-admin', { action: 'suggestion-done', suggestionId: '123e4567-e89b-12d3-a456-426614174000' }), res);
    expect(res.statusCode).toBe(200);
    expect(writes[0].table).toBe('suggestions');
    expect(writes[0].patch.reviewed_at).toBeTruthy();
  });
});

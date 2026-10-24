/**
 * /api/community-topics: who may create or edit, the server-side rate
 * limit, input validation, and that the creator is never echoed back.
 * Only Supabase and the team text are mocked; auth, validation and the
 * in-memory rate limiter are the real code.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const CONFIRMED = '2026-10-01T00:00:00Z';
const USERS = {
  'tok-a': { id: 'aaaaaaaa-0000-0000-0000-000000000001', email: 'a@example.com', email_confirmed_at: CONFIRMED },
  'tok-b': { id: 'aaaaaaaa-0000-0000-0000-000000000002', email: 'b@example.com', email_confirmed_at: CONFIRMED },
  'tok-c': { id: 'aaaaaaaa-0000-0000-0000-000000000003', email: 'c@example.com', email_confirmed_at: CONFIRMED },
  'tok-guest': { id: 'aaaaaaaa-0000-0000-0000-00000000000f', is_anonymous: true },
};
const state = { inserts: [], rpcs: [], dbError: null };

function fakeClient(token) {
  return {
    auth: { getUser: vi.fn(async () => (USERS[token] ? { data: { user: USERS[token] }, error: null } : { data: null, error: { message: 'bad jwt' } })) },
    from: (table) => ({
      insert: (row) => {
        state.inserts.push({ table, row });
        return { select: () => ({ single: async () => (state.dbError ? { data: null, error: state.dbError } : { data: { id: 'topic-1', ...row, status: row.visibility === 'public' ? 'pending' : 'visible' }, error: null }) }) };
      },
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: 'topic-1', name: 'Edited', status: 'visible', created_by: 'leak' }, error: null }) }) }),
    }),
    rpc: vi.fn(async (name, args) => { state.rpcs.push({ name, args }); return state.dbError ? { data: null, error: state.dbError } : { data: args.tid, error: null }; }),
  };
}

vi.mock('@supabase/supabase-js', () => ({ createClient: (_url, _key, opts) => fakeClient(String(opts?.global?.headers?.Authorization || '').replace('Bearer ', '')) }));
const alerts = [];
vi.mock('./_twilio.js', () => ({ sendTeamAlert: vi.fn(async (line) => { alerts.push(line); return true; }) }));

const { default: handler, describeDbError, publicTopic } = await import('./community-topics.js');

let ip = 0;
function req(body, token, method = 'POST') {
  ip += 1;
  return { method, body, query: {}, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'x-forwarded-for': `10.0.0.${ip}` }, socket: {} };
}
const good = { action: 'create', name: 'Living with adeno', description: 'For anyone newly told.', coverColor: '#f7badd', textColor: '#3e2723', titleFont: 'serif', visibility: 'public' };

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('SUPABASE_ANON_KEY', 'public-anon-key');
  state.inserts.length = 0; state.rpcs.length = 0; state.dbError = null; alerts.length = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe('who can create', () => {
  it('rejects signed-out callers, bad tokens and guests', async () => {
    for (const token of [null, 'tok-unknown', 'tok-guest']) {
      const res = mockRes();
      await handler(req(good, token), res);
      expect(res.statusCode).toBe(401);
    }
    expect(state.inserts).toHaveLength(0);
  });
  it('only accepts POST with a known action', async () => {
    const res = mockRes();
    await handler(req(good, 'tok-a', 'GET'), res);
    expect(res.statusCode).toBe(405);
    const res2 = mockRes();
    await handler(req({ ...good, action: 'drop' }, 'tok-a'), res2);
    expect(res2.statusCode).toBe(400);
  });
});

describe('create', () => {
  it('inserts with the caller as creator, never a client-chosen status, and alerts the team by name only', async () => {
    const res = mockRes();
    await handler(req({ ...good, status: 'visible', created_by: 'someone-else', anonymous: true }, 'tok-a'), res);
    expect(res.statusCode).toBe(200);
    const { row } = state.inserts[0];
    expect(row.created_by).toBe(USERS['tok-a'].id);
    expect(row).not.toHaveProperty('status');
    expect(row.slug).toMatch(/^living-with-adeno-[a-z0-9]+$/);
    expect(row.creator_anonymous).toBe(true);
    expect(res.body.topic).not.toHaveProperty('created_by');
    expect(alerts).toEqual(['new community topic to review: Living with adeno']);
    expect(alerts[0]).not.toMatch(/a@example\.com|aaaaaaaa/);
  });
  it('validates before writing: links, impersonation, contrast, length', async () => {
    for (const bad of [{ name: 'shop glow.com' }, { name: 'ayna official' }, { name: 'Ask a doctor' }, { textColor: '#ffedac' }, { name: 'ab' }, { description: 'x'.repeat(201) }]) {
      const res = mockRes();
      await handler(req({ ...good, ...bad }, 'tok-b'), res);
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeTruthy();
    }
    expect(state.inserts).toHaveLength(0);
  });
  it('rate limits creation to 3 a day per account on the server', async () => {
    const codes = [];
    for (let i = 0; i < 4; i += 1) {
      const res = mockRes();
      await handler(req({ ...good, name: `Topic number ${i + 1}x` }, 'tok-c'), res);
      codes.push(res.statusCode);
    }
    expect(codes).toEqual([200, 200, 200, 429]);
    expect(state.inserts).toHaveLength(3);
  });
  it('maps database rule errors to plain words', async () => {
    state.dbError = { code: 'P0001', message: 'community_rate_limited' };
    const res = mockRes();
    await handler(req({ ...good, visibility: 'friends' }, 'tok-a'), res);
    expect(res.statusCode).toBe(429);
    expect(res.body.error).toMatch(/3 topics a day/);
    expect(describeDbError({ code: 'PGRST205', message: 'schema cache' }).status).toBe(503);
    expect(describeDbError({ message: 'community_not_topic_owner' }).status).toBe(403);
  });
});

describe('update', () => {
  it('goes through community_update_topic with validated fields only', async () => {
    const res = mockRes();
    await handler(req({ ...good, action: 'update', topicId: '123e4567-e89b-12d3-a456-426614174000', status: 'visible' }, 'tok-b'), res);
    expect(res.statusCode).toBe(200);
    expect(state.rpcs[0].name).toBe('community_update_topic');
    expect(Object.keys(state.rpcs[0].args).sort()).toEqual(['p_cover_color', 'p_cover_image_url', 'p_description', 'p_name', 'p_text_color', 'p_title_font', 'p_visibility', 'tid']);
    expect(res.body.topic).not.toHaveProperty('created_by');
  });
  it('rejects a malformed id and non-owners', async () => {
    const res = mockRes();
    await handler(req({ ...good, action: 'update', topicId: "1' or 1=1" }, 'tok-b'), res);
    expect(res.statusCode).toBe(400);
    state.dbError = { code: 'P0001', message: 'community_not_topic_owner' };
    const res2 = mockRes();
    await handler(req({ ...good, action: 'update', topicId: '123e4567-e89b-12d3-a456-426614174000' }, 'tok-b'), res2);
    expect(res2.statusCode).toBe(403);
  });
  it('publicTopic strips the creator', () => {
    expect(publicTopic({ id: 'x', created_by: 'u' })).toEqual({ id: 'x' });
  });
});

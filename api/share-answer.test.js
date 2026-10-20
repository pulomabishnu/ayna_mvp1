import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = { inserts: [], updates: [], row: null, profile: null, insertErrors: [] };
function table(name) {
  const q = {
    _filters: {},
    select() { return q; },
    eq(k, v) { q._filters[k] = v; return q; },
    is() { return q; },
    maybeSingle: async () => {
      if (name === 'shared_answers') return { data: db.row && db.row.id === q._filters.id ? db.row : null, error: null };
      if (name === 'community_profiles') return { data: db.profile, error: null };
      return { data: null, error: null };
    },
    insert: async (row) => { db.inserts.push({ table: name, row }); return { error: db.insertErrors.shift() || null }; },
    update(patch) { db.updates.push({ table: name, patch, filters: q._filters }); return q; },
    then(resolve) { resolve({ error: null }); },
  };
  return q;
}
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: table, auth: { admin: { getUserById: async () => ({ data: { user: { user_metadata: { first_name: 'Ameera' } } } }) } } }),
}));
vi.mock('./_usageLimit.js', () => ({ verifyUser: vi.fn() }));
vi.mock('./_rateLimit.js', () => ({ rateLimit: vi.fn(async () => ({ ok: true })), getClientIp: () => '203.0.113.9' }));
const { verifyUser } = await import('./_usageLimit.js');
const { rateLimit } = await import('./_rateLimit.js');
const { default: handler, injectMeta, visitorKey } = await import('./share-answer.js');
const { mockRes } = await import('./_test-helpers.js');

const call = async ({ method = 'POST', body, query = {}, headers = {} } = {}) => {
  const res = mockRes();
  await handler({ method, body, query, headers: { 'user-agent': 'Mozilla/5.0', ...headers } }, res);
  return res;
};
const OWNER = '1a2b3c4d-5e6f-7a8b-9c0d-ef1234567890';

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'secret');
  Object.assign(db, { inserts: [], updates: [], row: null, profile: null, insertErrors: [] });
  verifyUser.mockReset();
  rateLimit.mockReset(); rateLimit.mockResolvedValue({ ok: true });
});

describe('POST /api/share-answer', () => {
  it('needs a real account (guests and signed out get 401)', async () => {
    verifyUser.mockResolvedValue({ user: null, error: 'auth_required' });
    expect((await call({ body: { question: 'q', answer: 'a' } })).statusCode).toBe(401);
    expect(db.inserts).toHaveLength(0);
  });
  it('validates input before writing anything', async () => {
    verifyUser.mockResolvedValue({ user: { id: OWNER } });
    expect((await call({ body: { question: '', answer: 'a' } })).body).toEqual({ error: 'question_required' });
    expect((await call({ body: { question: 'q', answer: 'a'.repeat(8001) } })).body).toEqual({ error: 'answer_too_long' });
    expect((await call({ body: '{nope' })).body).toEqual({ error: 'invalid_json' });
    expect(db.inserts).toHaveLength(0);
  });
  it('stores only the question, answer and sources, owned by the caller', async () => {
    verifyUser.mockResolvedValue({ user: { id: OWNER } });
    const res = await call({ body: { question: 'What helps cramps?', answer: 'Heat.', owner_id: 'someone-else', profileSummary: 'Concerns: x' } });
    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBe(`https://www.aynahealth.co/a/${res.body.slug}`);
    expect(db.inserts[0].row).toEqual({ id: res.body.slug, owner_id: OWNER, question: 'What helps cramps?', answer: 'Heat.', sources: [] });
  });
  it('draws a new slug on a collision', async () => {
    verifyUser.mockResolvedValue({ user: { id: OWNER } });
    db.insertErrors = [{ code: '23505', message: 'duplicate key' }];
    const res = await call({ body: { question: 'q', answer: 'a' } });
    expect(res.statusCode).toBe(200);
    expect(db.inserts).toHaveLength(2);
    expect(db.inserts[0].row.id).not.toBe(db.inserts[1].row.id);
  });
  it('is rate limited per account', async () => {
    verifyUser.mockResolvedValue({ user: { id: OWNER } });
    rateLimit.mockResolvedValue({ ok: false, retryAfterSec: 3600 });
    const res = await call({ body: { question: 'q', answer: 'a' } });
    expect(res.statusCode).toBe(429);
    expect(rateLimit.mock.calls[0][0]).toContain(OWNER);
    expect(db.inserts).toHaveLength(0);
  });
});

describe('GET /api/share-answer', () => {
  it('rejects bad slugs', async () => {
    expect((await call({ method: 'GET', query: { slug: '../etc' } })).statusCode).toBe(400);
  });
  it('404s a missing or revoked link', async () => {
    db.row = { id: 'Ab3dEf9hIj', owner_id: OWNER, question: 'q', answer: 'a', sources: [], revoked_at: '2026-10-20T00:00:00Z' };
    expect((await call({ method: 'GET', query: { slug: 'Ab3dEf9hIj' } })).statusCode).toBe(404);
    expect((await call({ method: 'GET', query: { slug: 'Zz3dEf9hIj' } })).statusCode).toBe(404);
  });
  it('returns the public answer and owner, and counts the open without the IP', async () => {
    db.row = { id: 'Ab3dEf9hIj', owner_id: OWNER, question: 'q', answer: 'a', sources: [], created_at: 'now', revoked_at: null };
    db.profile = { display_name: 'Ameera O', username: 'ameera', avatar_url: 'a/b.jpg' };
    const res = await call({ method: 'GET', query: { slug: 'Ab3dEf9hIj' } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ question: 'q', answer: 'a', owner: { user_id: OWNER, display_name: 'Ameera O', username: 'ameera', avatar_url: 'a/b.jpg' } });
    expect(res.body).not.toHaveProperty('revoked_at');
    const open = db.inserts.find((i) => i.table === 'shared_answer_opens');
    expect(open.row.visitor_key).toMatch(/^[a-f0-9]{32}$/);
    expect(JSON.stringify(open.row)).not.toContain('203.0.113.9');
  });
  it('does not count link-preview bots or the owner', async () => {
    db.row = { id: 'Ab3dEf9hIj', owner_id: OWNER, question: 'q', answer: 'a', sources: [], revoked_at: null };
    await call({ method: 'GET', query: { slug: 'Ab3dEf9hIj' }, headers: { 'user-agent': 'facebookexternalhit/1.1' } });
    verifyUser.mockResolvedValue({ user: { id: OWNER } });
    const own = await call({ method: 'GET', query: { slug: 'Ab3dEf9hIj' }, headers: { authorization: 'Bearer t' } });
    expect(own.body.is_owner).toBe(true);
    expect(db.inserts.filter((i) => i.table === 'shared_answer_opens')).toHaveLength(0);
  });
  it('day-scoped visitor keys change daily', () => {
    const a = visitorKey({ ip: '1.2.3.4', ua: 'x', slug: 's', day: '2026-10-20', salt: 'k' });
    const b = visitorKey({ ip: '1.2.3.4', ua: 'x', slug: 's', day: '2026-10-21', salt: 'k' });
    expect(a).not.toBe(b);
  });
});

describe('DELETE /api/share-answer', () => {
  it('lets only the owner stop sharing', async () => {
    verifyUser.mockResolvedValue({ user: null, error: 'auth_required' });
    expect((await call({ method: 'DELETE', query: { slug: 'Ab3dEf9hIj' } })).statusCode).toBe(401);
    verifyUser.mockResolvedValue({ user: { id: OWNER } });
    const res = await call({ method: 'DELETE', query: { slug: 'Ab3dEf9hIj' } });
    expect(res.statusCode).toBe(200);
    expect(db.updates[0].filters).toMatchObject({ id: 'Ab3dEf9hIj', owner_id: OWNER });
    expect(Object.keys(db.updates[0].patch)).toEqual(['revoked_at']);
  });
});

describe('link preview html', () => {
  it('sets noindex, the title and preview tags, escaping names', () => {
    const html = injectMeta('<html><head><title>x</title><meta name="description" content="old" /><meta property="og:title" content="old" /></head></html>', { title: 'Ana<b>’s answer from ayna', description: 'd', url: 'https://www.aynahealth.co/a/Ab3dEf9hIj' });
    expect(html).toContain('<meta name="robots" content="noindex, nofollow" />');
    expect(html).toContain('<title>Ana&lt;b&gt;’s answer from ayna</title>');
    expect(html.match(/og:title/g)).toHaveLength(1);
    expect(html).not.toContain('content="old"');
  });
});

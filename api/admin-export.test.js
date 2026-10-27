/* global process */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockRes } from './_test-helpers.js';

const fake = { admin: null };
vi.mock('./_usageLimit.js', () => ({ getServiceClient: () => fake.admin }));
vi.mock('./_rateLimit.js', () => ({
  rateLimit: vi.fn(async () => ({ ok: true })),
  getClientIp: () => '1.2.3.4',
}));
vi.mock('./_feedbackStore.js', () => ({
  listFeedback: vi.fn(async (offset) => (offset === 0 ? {
    results: [
      { id: 'n2', kind: 'survey', submittedAt: '2026-10-20', rating: 5, feedback: 'love it', heardAboutUs: 'tiktok' },
      { id: 'n1', kind: 'purchase', submittedAt: '2026-10-01', productId: 'p1', productName: 'Pads', answer: 'yes' },
    ],
    nextCursor: null,
  } : { results: [], nextCursor: null })),
}));

const { default: handler, buildExport, tokenMatches, parseSince, SOURCE_NAMES, READ_TABLES } = await import('./admin-export.js');
const { storeContactMessage } = await import('./contact.js');

const TOKEN = 'x'.repeat(48);

/** Chainable fake Supabase client: records every table + filter. */
function fakeAdmin(tables = {}, users = []) {
  const calls = [];
  const from = (table) => {
    const call = { table, filters: [] };
    calls.push(call);
    const q = {
      select(cols) { call.select = cols; return q; },
      eq(c, v) { call.filters.push(['eq', c, v]); return q; },
      gte(c, v) { call.filters.push(['gte', c, v]); return q; },
      in(c, v) { call.filters.push(['in', c, v]); return q; },
      order() { return q; },
      limit() { return q; },
      insert(row) { call.insert = row; return Promise.resolve({ data: null, error: null }); },
      then(resolve, reject) {
        let rows = tables[table] || [];
        for (const [op, c, v] of call.filters) {
          if (op === 'eq') rows = rows.filter((r) => r[c] === v);
          if (op === 'gte') rows = rows.filter((r) => String(r[c]) >= v);
          if (op === 'in') rows = rows.filter((r) => v.includes(r[c]));
        }
        return Promise.resolve({ data: rows, error: null }).then(resolve, reject);
      },
    };
    return q;
  };
  return {
    calls,
    from,
    auth: { admin: { listUsers: vi.fn(async ({ page }) => ({ data: { users: page === 1 ? users : [] }, error: null })) } },
  };
}

const DATA = {
  contact_messages: [
    { id: 'c1', created_at: '2026-10-01T10:00:00Z', name: 'A', email: 'a@x.co', reason: 'Other', subject: 'Hi', message: 'old message' },
    { id: 'c2', created_at: '2026-10-21T10:00:00Z', name: 'B', email: 'b@x.co', reason: 'Other', subject: 'Yo', message: 'new message' },
  ],
  community_posts: [
    { id: 'p1', kind: 'review', author_id: 'u1', product_id: 'prod1', rating: 4, body: 'good', is_anonymous: false, status: 'visible', created_at: '2026-10-20T00:00:00Z' },
    { id: 'p2', kind: 'review', author_id: 'u2', product_id: 'prod1', rating: 2, body: 'meh', is_anonymous: true, status: 'visible', created_at: '2026-10-20T01:00:00Z' },
  ],
  community_profiles: [{ user_id: 'u1', username: 'maya' }, { user_id: 'u2', username: 'secret' }],
  product_catalog: [{ id: 'prod1', name: 'Cramp Patch', brand: 'Acme' }],
  user_reviews: [{ user_id: 'u3', product_id: 'prod1', ratings: [5], reviews: [{ text: 'great', date: '2026-10-19T00:00:00Z' }], updated_at: '2026-10-19T00:00:00Z' }],
  invite_stats: [{ user_id: 'u1', email: 'u1@private.co', links_shared: 2, opens: 9, signups: 3, verified_email: 2, verified_phone: 1, all_referral_signups: 4 }],
  reward_claims: [{ id: 'cl1', campaign_id: 'c', user_id: 'u1', reward_product_id: 'rp1', product_id: 'prod1', fulfillment_status: 'shipped', claimed_at: '2026-10-18T00:00:00Z', shipped_at: '2026-10-19T00:00:00Z', updated_at: '2026-10-19T00:00:00Z' }],
  reward_products: [{ id: 'rp1', product_id: 'prod1', name: null, brand: null }],
  reward_shipping: [{ claim_id: 'cl1', full_name: 'Maya L', address_line1: '1 Main St', address_line2: null, city: 'NYC', state: 'NY', postal_code: '10001', email: 'ship@x.co', updated_at: '2026-10-18T00:00:00Z' }],
  campaign_feedback: [{ id: 'f1', campaign_id: 'c', user_id: 'u1', question_key: 'like', question: 'What do you like?', response: 'the matches', char_count: 11, is_complete: true, created_at: '2026-10-17T00:00:00Z', updated_at: '2026-10-17T00:00:00Z' }],
  sms_preferences: [{ user_id: 'u1', reminders: true, orders: false, chat: false, stopped_at: null, consent_at: '2026-10-20T05:00:00Z' }],
  email_preferences: [{ user_id: 'u2', unsubscribed_all: true }],
};
const USERS = [
  { id: 'u1', email: 'u1@private.co', phone: '+15550001', created_at: '2026-10-20T03:00:00Z', email_confirmed_at: '2026-10-20T04:00:00Z' },
  { id: 'u2', email: 'u2@private.co', created_at: '2026-10-20T09:00:00Z', email_confirmed_at: null },
  { id: 'g1', is_anonymous: true, created_at: '2026-10-20T09:00:00Z' },
];

function req({ token = TOKEN, query = { source: 'contact' }, method = 'GET' } = {}) {
  return { method, query, headers: token === null ? {} : { authorization: `Bearer ${token}` } };
}

let prevToken;
beforeEach(() => { prevToken = process.env.ADMIN_EXPORT_TOKEN; process.env.ADMIN_EXPORT_TOKEN = TOKEN; fake.admin = fakeAdmin(DATA, USERS); });
afterEach(() => { if (prevToken === undefined) delete process.env.ADMIN_EXPORT_TOKEN; else process.env.ADMIN_EXPORT_TOKEN = prevToken; });

describe('auth', () => {
  it('rejects a missing or wrong token with 401 and no data', async () => {
    for (const token of [null, '', 'wrong', TOKEN.slice(1), `${TOKEN}x`]) {
      const res = mockRes();
      await handler(req({ token }), res);
      expect(res.statusCode).toBe(401);
      expect(res.body.rows).toBeUndefined();
    }
    expect(fake.admin.calls).toHaveLength(0);
  });
  it('fails closed (503) when ADMIN_EXPORT_TOKEN is unset or short', async () => {
    process.env.ADMIN_EXPORT_TOKEN = 'short';
    const res = mockRes();
    await handler(req({ token: 'short' }), res);
    expect(res.statusCode).toBe(503);
    delete process.env.ADMIN_EXPORT_TOKEN;
    expect(tokenMatches('Bearer ', undefined)).toBe(false);
  });
  it('accepts the right token, sends no-store, and only allows GET', async () => {
    const res = mockRes();
    await handler(req(), res);
    expect(res.statusCode).toBe(200);
    expect(res.headers['cache-control']).toMatch(/no-store/);
    const post = mockRes();
    await handler(req({ method: 'POST' }), post);
    expect(post.statusCode).toBe(405);
  });
  it('rate limits before checking the token', async () => {
    const { rateLimit } = await import('./_rateLimit.js');
    rateLimit.mockResolvedValueOnce({ ok: false, retryAfterSec: 60 });
    const res = mockRes();
    await handler(req({ token: 'wrong' }), res);
    expect(res.statusCode).toBe(429);
  });
  it('rejects unknown sources and bad since values', async () => {
    const a = mockRes(); await handler(req({ query: { source: 'user_health_profiles' } }), a);
    expect(a.statusCode).toBe(400);
    const b = mockRes(); await handler(req({ query: { source: 'contact', since: 'yesterday' } }), b);
    expect(b.statusCode).toBe(400);
    expect(parseSince('2026-10-21T00:00:00Z').since).toBe('2026-10-21T00:00:00.000Z');
  });
});

describe('since filter', () => {
  it('returns only rows on or after since', async () => {
    const res = mockRes();
    await handler(req({ query: { source: 'contact', since: '2026-10-10T00:00:00Z' } }), res);
    expect(res.body.rows.map((r) => r.id)).toEqual(['c2']);
    expect(res.body.mode).toBe('append');
  });
  it('filters the anonymous survey by day', async () => {
    const out = await buildExport('survey', { admin: fake.admin, since: '2026-10-10T00:00:00.000Z' });
    expect(out.rows.map((r) => r.id)).toEqual(['n2']);
    const all = await buildExport('survey', { admin: fake.admin });
    expect(all.rows).toHaveLength(2);
  });
});

describe('privacy', () => {
  it('never reads health or quiz tables, for any source', async () => {
    for (const source of SOURCE_NAMES) await buildExport(source, { admin: fake.admin });
    const tables = fake.admin.calls.map((c) => c.table);
    for (const t of tables) {
      expect(t).not.toMatch(/health|intake|quiz|ecosystem|learning|sms_conversations|phone/);
      expect(READ_TABLES).toContain(t);
    }
  });
  it('exports no account emails or phones outside contact, claims, box waitlist (opt-in, given to be contacted) and partners', async () => {
    for (const source of SOURCE_NAMES.filter((s) => !['contact', 'claims', 'box_waitlist'].includes(s))) {
      const out = await buildExport(source, { admin: fake.admin });
      const text = JSON.stringify(out);
      expect(text).not.toMatch(/private\.co|\+1555|ship@x\.co/);
      for (const c of out.columns) expect(c).not.toMatch(/^(email|phone|shipping_email|user_id)$/);
    }
    const invites = fake.admin.calls.find((c) => c.table === 'invite_stats');
    expect(invites.select.split(',')).not.toContain('email');
  });
  it('shows a handle only for non-anonymous community reviews', async () => {
    const out = await buildExport('reviews', { admin: fake.admin });
    const byId = Object.fromEntries(out.rows.map((r) => [r.id, r]));
    expect(byId['post:p1'].handle).toBe('@maya');
    expect(byId['post:p2'].handle).toBe('');
    const pdp = out.rows.find((r) => r.where === 'product page');
    expect(pdp).toMatchObject({ product: 'Acme Cramp Patch', stars: 5, text: 'great', handle: '' });
    expect(pdp.id).not.toContain('u3');
  });
  it('signups are counts only', async () => {
    const out = await buildExport('signups', { admin: fake.admin });
    expect(out.rows).toEqual([{ id: '2026-10-20', date: '2026-10-20', new_accounts: 2, verified_accounts: 1, sms_opt_ins: 1, email_opt_ins: 1 }]);
  });
});

describe('claims and campaign feedback', () => {
  it('include the shipping address and a Shipped? flag', async () => {
    const out = await buildExport('claims', { admin: fake.admin });
    expect(out.mode).toBe('upsert');
    expect(out.rows[0]).toMatchObject({ id: 'cl1', product: 'Acme Cramp Patch', shipped: 'Yes', ship_to_name: 'Maya L', city: 'NYC', shipping_email: 'ship@x.co' });
    expect(JSON.stringify(out)).not.toMatch(/private\.co/);
  });
  it('link feedback answers to the claim', async () => {
    const out = await buildExport('campaign_feedback', { admin: fake.admin });
    expect(out.rows[0]).toMatchObject({ id: 'f1', claim_id: 'cl1', claimed_product: 'Acme Cramp Patch', answer: 'the matches', complete: 'Yes' });
  });
});

describe('contact form storage', () => {
  it('inserts the message', async () => {
    const admin = fakeAdmin();
    expect(await storeContactMessage({ name: 'A', email: 'a@x.co' }, admin)).toBe(true);
    expect(admin.calls[0]).toMatchObject({ table: 'contact_messages', insert: { name: 'A', email: 'a@x.co' } });
  });
  it('returns false without throwing when the insert fails, and still emails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const failing = { from: () => ({ insert: async () => ({ error: { message: 'relation "contact_messages" does not exist' } }) }) };
    expect(await storeContactMessage({ name: 'A' }, failing)).toBe(false);
    expect(await storeContactMessage({ name: 'A' }, { from: () => { throw new Error('down'); } })).toBe(false);
    expect(await storeContactMessage({ name: 'A' }, null)).toBe(false);
    expect(spy.mock.calls.flat().join(' ')).not.toContain('a@x.co');

    // End to end: Supabase down, Resend up -> 200 and one email.
    fake.admin = failing;
    const prevKey = process.env.RESEND_API_KEY; process.env.RESEND_API_KEY = 'test-key';
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ id: 'e1' }) });
    const { default: contact } = await import('./contact.js');
    const res = mockRes();
    await contact({ method: 'POST', headers: {}, body: { name: 'Ana', email: 'ana@x.co', reason: 'Other', subject: 'Hello', message: 'a long enough message' } }, res);
    expect(res.statusCode).toBe(200);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    fetchSpy.mockRestore(); spy.mockRestore();
    if (prevKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = prevKey;
  });
});

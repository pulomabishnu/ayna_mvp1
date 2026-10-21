/**
 * Data export / delete match some old rows by email (feedback, approved_users).
 * Only a CONFIRMED email may do that: an unconfirmed sign-up using someone
 * else's address must not download or delete that person's rows.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockRes } from './_test-helpers.js';

const calls = [];
function admin() {
  const chain = (table, op) => {
    const q = {
      select: () => q, delete: () => { op = 'delete'; return q; }, order: () => q, limit: () => q, in: () => q,
      eq: (col, val) => { calls.push({ table, op, col, val }); return q; },
      then: (r) => r({ data: [], error: null }),
    };
    return q;
  };
  return {
    from: (t) => chain(t, 'select'),
    auth: { admin: { deleteUser: vi.fn(async () => ({ error: null })) } },
    storage: { from: () => ({ list: async () => ({ data: [] }), remove: async () => ({}) }) },
  };
}
const state = { user: null };
vi.mock('./_usageLimit.js', () => ({ verifyUser: async () => ({ user: state.user, error: null, admin: admin() }) }));
vi.mock('./_appleSignIn.js', () => ({ revokeStoredAppleAuthorization: async () => ({}) }));
vi.mock('./_healthProviders.js', () => ({ revokeProvider: async () => ({}), PROVIDERS: {} }));

beforeEach(() => { calls.length = 0; });

const emailLookups = () => calls.filter((c) => c.col === 'email');

describe.each([
  ['account-data', () => import('./account-data.js'), 'GET'],
  ['account-delete', () => import('./account-delete.js'), 'DELETE'],
])('%s', (_n, load, method) => {
  it('does not match rows by an UNCONFIRMED email', async () => {
    state.user = { id: 'u1', email: 'victim@example.com', email_confirmed_at: null };
    const { default: handler } = await load();
    await handler({ method, headers: { authorization: 'Bearer t' }, query: {}, body: { confirm: 'DELETE' } }, mockRes());
    expect(emailLookups()).toEqual([]);
    expect(calls.some((c) => c.col === 'user_id' && c.val === 'u1')).toBe(true);
  });

  it('matches rows by a confirmed email', async () => {
    state.user = { id: 'u1', email: 'me@example.com', email_confirmed_at: '2026-10-01T00:00:00Z' };
    const { default: handler } = await load();
    await handler({ method, headers: { authorization: 'Bearer t' }, query: {}, body: { confirm: 'DELETE' } }, mockRes());
    expect(emailLookups().length).toBeGreaterThan(0);
    expect(emailLookups().every((c) => c.val === 'me@example.com')).toBe(true);
  });
});

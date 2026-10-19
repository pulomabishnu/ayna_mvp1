import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }));
const { attachPendingReferral } = await import('./badges.js');
const { pendingReferralMeta } = await import('./freeProductCampaign.js');

const KEY = 'ayna_pending_ref_v1';
let store;
beforeEach(() => {
  store = {};
  globalThis.window = { localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } }, location: { search: '' } };
});

const NEW_USER = { id: '9a8b7c6d-1111-4222-8333-444455556666', created_at: new Date().toISOString(), user_metadata: {} };
function client({ user = NEW_USER, insertError = null } = {}) {
  const inserts = [];
  return {
    inserts,
    auth: { getUser: async () => ({ data: { user } }), updateUser: vi.fn(async () => ({})) },
    from: () => ({ insert: async (row) => { inserts.push(row); return { error: insertError }; } }),
  };
}
const save = (code = 'abcdef1234', at = Date.now() - 60_000) => { store[KEY] = JSON.stringify({ code, at }); };

describe('share link referral', () => {
  it('sign-up metadata carries the saved code', () => {
    save();
    expect(pendingReferralMeta()).toMatchObject({ referred_by: 'abcdef1234' });
    store = {};
    expect(pendingReferralMeta()).toEqual({});
  });

  it('expired codes are not sent', () => {
    save('abcdef1234', Date.now() - 31 * 864e5);
    expect(pendingReferralMeta()).toEqual({});
  });

  it('writes the row and forgets the code once saved', async () => {
    save();
    const sb = client();
    expect(await attachPendingReferral(sb)).toBe(true);
    expect(sb.inserts).toEqual([{ referred_user_id: NEW_USER.id, referrer_code: 'abcdef1234' }]);
    expect(store[KEY]).toBeUndefined();
  });

  it('keeps the code to retry when the insert fails', async () => {
    save();
    expect(await attachPendingReferral(client({ insertError: { code: '08006', message: 'network' } }))).toBe(false);
    expect(store[KEY]).toBeDefined();
  });

  it('a row the server already wrote counts as done', async () => {
    save();
    expect(await attachPendingReferral(client({ insertError: { code: '23505', message: 'duplicate key' } }))).toBe(true);
    expect(store[KEY]).toBeUndefined();
  });

  it('retries even when metadata was already set at sign-up, using that first code', async () => {
    save('zzzzzz9999');
    const sb = client({ user: { ...NEW_USER, user_metadata: { referred_by: 'abcdef1234' } } });
    expect(await attachPendingReferral(sb)).toBe(true);
    expect(sb.inserts[0].referrer_code).toBe('abcdef1234');
    expect(sb.auth.updateUser).not.toHaveBeenCalled();
  });

  it('never refers yourself, and stops when the policy says no', async () => {
    save(NEW_USER.id.replace(/-/g, '').slice(0, 10));
    expect(await attachPendingReferral(client())).toBe(false);
    expect(store[KEY]).toBeUndefined();
    save();
    expect(await attachPendingReferral(client({ insertError: { code: '42501', message: 'row-level security' } }))).toBe(false);
    expect(store[KEY]).toBeUndefined();
  });
});

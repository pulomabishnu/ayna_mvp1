import { describe, it, expect, vi, beforeEach } from 'vitest';

const auth = { getSession: vi.fn(), refreshSession: vi.fn() };
vi.mock('./supabaseClient', () => ({ getSupabaseClient: () => ({ auth }) }));
const { getAccessToken, withAuthRetry } = await import('./authToken.js');

describe('signed-in requests survive a session that is still settling', () => {
  beforeEach(() => { auth.getSession.mockReset(); auth.refreshSession.mockReset(); });
  it('refreshes when the session is not there yet', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.refreshSession.mockResolvedValue({ data: { session: { access_token: 'fresh' } } });
    expect(await getAccessToken()).toBe('fresh');
  });
  it('retries once with a new token on 401', async () => {
    auth.getSession.mockResolvedValue({ data: { session: { access_token: 'old' } } });
    auth.refreshSession.mockResolvedValue({ data: { session: { access_token: 'new' } } });
    const send = vi.fn().mockResolvedValueOnce({ status: 401 }).mockResolvedValueOnce({ status: 200, ok: true });
    const res = await withAuthRetry(send);
    expect(res.status).toBe(200);
    expect(send.mock.calls.map((c) => c[0])).toEqual(['old', 'new']);
  });
  it('returns null with no session at all', async () => {
    auth.getSession.mockResolvedValue({ data: { session: null } });
    auth.refreshSession.mockResolvedValue({ data: { session: null } });
    expect(await withAuthRetry(vi.fn())).toBeNull();
  });
});

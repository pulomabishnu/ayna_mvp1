// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabaseClient.js', () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: { access_token: 't', user: { id: 'u1' } } } }) } }),
}));
vi.mock('./apiUrl.js', () => ({ apiUrl: (p) => p }));

const { requestPro } = await import('./proApi.js');
const ok = (body) => new Response(JSON.stringify(body), { status: 200 });
const down = () => new Response('{"error":"pro_temporarily_unavailable"}', { status: 503 });

// Nov 9: a Pro member saw "We couldn't confirm your Pro access" in the app.
describe('Pro status check', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

  it('retries when the first request fails (the app just woke up)', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('The network connection was lost.')).mockResolvedValueOnce(ok({ active: true }));
    vi.stubGlobal('fetch', fetch);
    const p = requestPro();
    await vi.runAllTimersAsync();
    await expect(p).resolves.toMatchObject({ active: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('keeps a recently confirmed member unlocked when the server is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok({ active: true })).mockResolvedValue(down()));
    await requestPro();
    const p = requestPro();
    await vi.runAllTimersAsync();
    await expect(p).resolves.toMatchObject({ active: true, fromCache: true });
  });

  it('never unlocks someone the server has not confirmed as Pro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(ok({ active: false })).mockResolvedValue(down()));
    await requestPro();
    const p = requestPro();
    const settled = p.catch((e) => e);
    await vi.runAllTimersAsync();
    expect(await settled).toBeInstanceOf(Error);
  });
});

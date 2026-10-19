import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

let session = { access_token: 'jwt-a' };
vi.mock('../../utils/supabaseClient.js', () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session } }) } }),
}));
vi.mock('../../utils/apiUrl.js', () => ({ apiUrl: (p) => p }));

const { registerDeviceToken, unregisterDeviceToken } = await import('./deviceTokenApi.js');

let fetchMock;
beforeEach(() => {
  session = { access_token: 'jwt-a' };
  fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ id: 'row' }) }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('device token unlink on sign-out', () => {
  it('does nothing when this install never registered a token', async () => {
    expect(await unregisterDeviceToken()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('DELETEs the registered token with the still-valid JWT, then forgets it', async () => {
    await registerDeviceToken('apns-token', 'ios');
    fetchMock.mockClear();
    expect(await unregisterDeviceToken()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/device-tokens');
    expect(init.method).toBe('DELETE');
    expect(init.headers.Authorization).toBe('Bearer jwt-a');
    expect(JSON.parse(init.body)).toEqual({ deviceToken: 'apns-token', platform: 'ios' });
    expect(await unregisterDeviceToken()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('never throws or blocks sign-out when the network is down', async () => {
    await registerDeviceToken('apns-token', 'ios');
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    expect(await unregisterDeviceToken()).toBe(false);
  });

  it('gives up after the timeout instead of hanging sign-out', async () => {
    await registerDeviceToken('apns-token', 'ios');
    fetchMock.mockImplementationOnce((_url, init) => new Promise((_, reject) => {
      init.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }));
    expect(await unregisterDeviceToken({ timeoutMs: 10 })).toBe(false);
  });

  it('also gives up when the native fetch ignores the abort signal', async () => {
    await registerDeviceToken('apns-token', 'ios');
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    expect(await unregisterDeviceToken({ timeoutMs: 10 })).toBe(false);
  });
});

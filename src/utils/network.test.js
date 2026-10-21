import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithTimeout, friendlyErrorMessage, isNetworkError, NetworkError, OFFLINE_MESSAGE, TIMEOUT_MESSAGE, UNREACHABLE_MESSAGE, timeoutFor, AI_TIMEOUT_MS, DEFAULT_TIMEOUT_MS } from './network.js';
import { friendlyError } from './community/communityStore.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('fetchWithTimeout', () => {
  it('passes a normal response through', async () => {
    const res = await fetchWithTimeout('/api/x', {}, 1000, async () => ({ ok: true, status: 200 }));
    expect(res.status).toBe(200);
  });

  it('settles with a timeout error instead of hanging forever', async () => {
    vi.useFakeTimers();
    const never = (_u, init) => new Promise((_r, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
    const p = fetchWithTimeout('/api/x', {}, 5000, never);
    const assertion = expect(p).rejects.toMatchObject({ name: 'NetworkError', kind: 'timeout', message: TIMEOUT_MESSAGE });
    await vi.advanceTimersByTimeAsync(5001);
    await assertion;
  });

  it('turns "Failed to fetch" / Safari "Load failed" into a readable sentence', async () => {
    for (const m of ['Failed to fetch', 'Load failed']) {
      await expect(fetchWithTimeout('/api/x', {}, 1000, async () => { throw new TypeError(m); }))
        .rejects.toMatchObject({ kind: 'unreachable', message: UNREACHABLE_MESSAGE });
    }
  });

  it('says offline (and never sends) when the device is offline', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const impl = vi.fn();
    await expect(fetchWithTimeout('/api/x', {}, 1000, impl)).rejects.toMatchObject({ kind: 'offline', message: OFFLINE_MESSAGE });
    expect(impl).not.toHaveBeenCalled();
  });

  it("keeps a caller's own cancel as a cancel, not a network error", async () => {
    const ctl = new AbortController();
    const impl = (_u, init) => new Promise((_r, reject) => init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))));
    const p = fetchWithTimeout('/api/x', { signal: ctl.signal }, 5000, impl);
    ctl.abort();
    await expect(p).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('gives model routes the longer ceiling', () => {
    expect(timeoutFor('https://www.aynahealth.co/api/ask-ayna')).toBe(AI_TIMEOUT_MS);
    expect(timeoutFor('/api/contact')).toBe(DEFAULT_TIMEOUT_MS);
  });
});

describe('friendly messages', () => {
  it('maps raw errors', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('weekly_limit_reached'))).toBe(false);
    expect(friendlyErrorMessage(new TypeError('Load failed'))).toBe(UNREACHABLE_MESSAGE);
    expect(friendlyErrorMessage(new Error('Pick a reason'))).toBe('Pick a reason');
  });
  it('community errors from supabase-js keep the network sentence', () => {
    expect(friendlyError({ message: `NetworkError: ${OFFLINE_MESSAGE}` })).toBe(OFFLINE_MESSAGE);
    expect(friendlyError(new NetworkError('timeout', TIMEOUT_MESSAGE))).toBe(TIMEOUT_MESSAGE);
  });
});

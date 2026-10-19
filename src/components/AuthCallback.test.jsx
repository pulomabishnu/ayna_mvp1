// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

let listener = null;
const unsubscribe = vi.fn();
const auth = {
  getSession: vi.fn(async () => ({ data: { session: null } })),
  onAuthStateChange: vi.fn((cb) => { listener = cb; return { data: { subscription: { unsubscribe } } }; }),
};
vi.mock('../utils/supabaseClient', () => ({ getSupabaseClient: () => ({ auth }), getWebGoogleOAuthClient: () => null }));
vi.mock('../utils/pendingConsent.js', () => ({ flushPendingConsent: vi.fn(async () => {}) }));
import AuthCallback from './AuthCallback';

let root, host;
const onAuthenticated = vi.fn();
async function mount() { await act(async () => root.render(<AuthCallback onAuthenticated={onAuthenticated} />)); }

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  listener = null;
  unsubscribe.mockClear(); onAuthenticated.mockClear(); auth.onAuthStateChange.mockClear();
  window.history.replaceState(null, '', '/auth/callback');
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.useRealTimers(); });

describe('AuthCallback fallback wait (no tokens in the URL)', () => {
  it('stops the 10s timeout once the session arrives, so a good sign-in never turns into "timed out"', async () => {
    await mount();
    expect(listener).toBeTypeOf('function');
    await act(async () => { listener('SIGNED_IN', { user: { id: 'u1' } }); });
    expect(onAuthenticated).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(11000); });
    expect(host.textContent).not.toMatch(/timed out/i);
  });

  it('unsubscribes and cancels the timer when the page unmounts mid-wait', async () => {
    await mount();
    expect(auth.onAuthStateChange).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
    expect(unsubscribe).toHaveBeenCalled();
    root = createRoot(host);
    await act(async () => { await vi.advanceTimersByTimeAsync(11000); });
    expect(onAuthenticated).not.toHaveBeenCalled();
  });

  it('still times out when no session ever arrives', async () => {
    await mount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10001); });
    expect(host.textContent).toMatch(/timed out/i);
    expect(unsubscribe).toHaveBeenCalled();
  });
});

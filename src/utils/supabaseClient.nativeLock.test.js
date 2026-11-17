// Native app: auth calls wait for a slow token refresh on resume instead of
// failing after Supabase's default 5 s lock wait (see supabaseClient.js).
import { afterAll, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn(() => ({ auth: {} }));
vi.mock('@supabase/supabase-js', () => ({ createClient }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));

vi.stubEnv('VITE_SUPABASE_URL', 'https://abcdefgh.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
afterAll(() => vi.unstubAllEnvs());

const { processLock } = await import('@supabase/auth-js');
const { DEFAULT_TIMEOUT_MS } = await import('./network.js');
const { getSupabaseClient, NATIVE_AUTH_LOCK_TIMEOUT_MS } = await import('./supabaseClient.js');

describe('native auth lock', () => {
  it('uses processLock and waits longer than one Supabase request', () => {
    getSupabaseClient();
    const { auth } = createClient.mock.calls[0][2];
    expect(auth.lock).toBe(processLock);
    expect(auth.lockAcquireTimeout).toBe(NATIVE_AUTH_LOCK_TIMEOUT_MS);
    expect(NATIVE_AUTH_LOCK_TIMEOUT_MS).toBeGreaterThan(DEFAULT_TIMEOUT_MS);
  });
});

import { describe, it, expect } from 'vitest';
import { computeBadges, referralCodeFor, inviteLinkFor, recordAppSignIn, hasAppSignIn } from './badges.js';

describe('badges', () => {
  it('has exactly the four badges, locked by default', () => {
    const b = computeBadges();
    expect(b.map((x) => x.label)).toEqual(['Got the app', 'Full ecosystem', 'First post', 'Brought 3 friends']);
    expect(b.every((x) => !x.earned)).toBe(true);
    expect(b.find((x) => x.key === 'friends').progress).toEqual({ value: 0, goal: 3 });
  });
  it('earns from real signals', () => {
    const b = computeBadges({ usedApp: true, eco: { filled: 3, total: 3 }, hasPosted: true, referrals: { joined: 5, qualified: 4 } });
    expect(b.every((x) => x.earned)).toBe(true);
    expect(computeBadges({ eco: { filled: 2, total: 3 } }).find((x) => x.key === 'ecosystem').earned).toBe(false);
    expect(computeBadges({ eco: { filled: 0, total: 0 } }).find((x) => x.key === 'ecosystem').earned).toBe(false);
  });
  it('locked app badge tells her how to earn it, no purchase badge', () => {
    const app = computeBadges().find((x) => x.key === 'app');
    expect(app.hint).toBe('Download the ayna app and sign in');
    expect(computeBadges().some((x) => /purchase/i.test(x.label))).toBe(false);
  });
  it('records an app sign-in once in metadata and on the device', async () => {
    const store = {};
    globalThis.window = globalThis.window || globalThis;
    window.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
    const calls = [];
    const supabase = { auth: { updateUser: (arg) => { calls.push(arg); return Promise.resolve({ error: null }); } } };
    const user = { id: 'u1', user_metadata: {} };
    expect(hasAppSignIn(user)).toBe(false);
    recordAppSignIn(supabase, user);
    expect(calls).toHaveLength(1);
    expect(calls[0].data.ayna_app_signed_in_at).toBeTruthy();
    expect(hasAppSignIn(user)).toBe(true);
    expect(hasAppSignIn({ id: 'u2', user_metadata: {} })).toBe(false);
    recordAppSignIn(supabase, { id: 'u1', user_metadata: { ayna_app_signed_in_at: '2026-10-13T00:00:00Z' } });
    expect(calls).toHaveLength(1);
    expect(hasAppSignIn({ id: 'u3', user_metadata: { ayna_app_signed_in_at: 'x' } })).toBe(true);
  });
  it('derives a stable invite code from the user id', () => {
    expect(referralCodeFor('3F2A9C1E-1234-5678-9abc-def012345678')).toBe('3f2a9c1e12');
    expect(referralCodeFor('')).toBeNull();
    expect(inviteLinkFor('3f2a9c1e-1234-5678-9abc-def012345678', 'https://x.test')).toBe('https://x.test/?ref=3f2a9c1e12');
  });
});

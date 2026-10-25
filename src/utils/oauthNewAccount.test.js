import { describe, it, expect, beforeEach } from 'vitest';
import { markOAuthSource, takeOAuthSource, isBrandNewAccount, shouldOfferEcosystemStart } from './oauthNewAccount.js';

const NOW = Date.parse('2026-10-13T16:00:00Z');
const fresh = { id: 'u1', created_at: '2026-10-13T15:58:00Z' };
const old = { id: 'u2', created_at: '2026-01-01T00:00:00Z' };

describe('oauth new-account guard', () => {
  beforeEach(() => {
    const store = {};
    globalThis.window = globalThis.window || globalThis;
    window.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  });
  it('stashes the source once', () => {
    markOAuthSource('signin');
    expect(takeOAuthSource()).toBe('signin');
    expect(takeOAuthSource()).toBeNull();
    markOAuthSource('save');
    expect(takeOAuthSource()).toBe('save');
  });
  it('a new account made from the free product page goes back to the campaign, not the quiz', () => {
    markOAuthSource('free-product');
    const source = takeOAuthSource();
    expect(source).toBe('free-product');
    expect(shouldOfferEcosystemStart({ user: fresh, source, now: NOW })).toBe(false);
  });
  it('ignores a stale stash', () => {
    markOAuthSource('signin');
    expect(takeOAuthSource(Date.now() + 31 * 60 * 1000)).toBeNull();
  });
  it('knows a brand-new account', () => {
    expect(isBrandNewAccount(fresh, NOW)).toBe(true);
    expect(isBrandNewAccount(old, NOW)).toBe(false);
    expect(isBrandNewAccount({ id: 'x' }, NOW)).toBe(false);
  });
  it('offers the ecosystem step only for a new, empty account from the sign-in form', () => {
    expect(shouldOfferEcosystemStart({ user: fresh, source: 'signin', now: NOW })).toBe(true);
    expect(shouldOfferEcosystemStart({ user: fresh, source: 'save', now: NOW })).toBe(false);
    expect(shouldOfferEcosystemStart({ user: fresh, source: null, now: NOW })).toBe(false);
    expect(shouldOfferEcosystemStart({ user: old, source: 'signin', now: NOW })).toBe(false);
    expect(shouldOfferEcosystemStart({ user: fresh, source: 'signin', hasIntake: true, now: NOW })).toBe(false);
    expect(shouldOfferEcosystemStart({ user: fresh, source: 'signin', productCount: 2, now: NOW })).toBe(false);
  });
});

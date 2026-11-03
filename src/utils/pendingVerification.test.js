// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { savePendingVerification, readPendingVerification, clearPendingVerification, isUnverifiedEmailUser } from './pendingVerification.js';

// Founder, Nov 2: no one gets past sign-up until they confirm their email, and
// going to Gmail and back never resets the code step.
describe('pending email verification', () => {
  beforeEach(() => localStorage.clear());

  it('remembers her email for the code step, then forgets it once verified', () => {
    savePendingVerification('  Her@Example.com ');
    expect(readPendingVerification()?.email).toBe('her@example.com');
    clearPendingVerification();
    expect(readPendingVerification()).toBe(null);
  });

  it('expires after two days', () => {
    savePendingVerification('her@example.com');
    expect(readPendingVerification(Date.now() + 49 * 3600 * 1000)).toBe(null);
  });

  it('an email account without a confirmed email is not signed in; Google/Apple and confirmed accounts are', () => {
    expect(isUnverifiedEmailUser({ email: 'a@b.co', app_metadata: { provider: 'email' } })).toBe(true);
    expect(isUnverifiedEmailUser({ email: 'a@b.co', app_metadata: { provider: 'email' }, email_confirmed_at: '2026-11-02T00:00:00Z' })).toBe(false);
    expect(isUnverifiedEmailUser({ email: 'a@b.co', app_metadata: { provider: 'google' } })).toBe(false);
    expect(isUnverifiedEmailUser({ email: 'a@b.co', app_metadata: { provider: 'apple' } })).toBe(false);
    expect(isUnverifiedEmailUser(null)).toBe(false);
  });
});

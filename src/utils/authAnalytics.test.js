import { describe, it, expect, afterEach } from 'vitest';
import { AUTH_EVENTS, authErrorCode, authEventProps, trackAuth, trackAuthFailure, setAuthAnalyticsClient } from './authAnalytics.js';

describe('auth analytics (Nov 19)', () => {
  afterEach(() => setAuthAnalyticsClient(null));

  it('buckets errors without ever keeping the raw message', () => {
    expect(authErrorCode({ message: 'Invalid login credentials' })).toBe('invalid_credentials');
    expect(authErrorCode({ code: 'email_already_exists' })).toBe('already_exists');
    expect(authErrorCode({ message: 'Email not confirmed' })).toBe('email_not_confirmed');
    expect(authErrorCode({ status: 429, message: 'x' })).toBe('rate_limited');
    expect(authErrorCode({ message: 'Token has expired or is invalid' })).toBe('code_expired');
    expect(authErrorCode({ message: 'Failed to fetch' })).toBe('network');
    expect(authErrorCode({ message: 'jane@x.com is weird' })).toBe('unknown');
    expect(authErrorCode(null)).toBe('unknown');
  });

  it('drops anything that is not an allowed property', () => {
    expect(authEventProps({ method: 'email', surface: 'web', reason: 'invalid_credentials', email: 'a@b.c', mode: 'signup' }))
      .toEqual({ method: 'email', surface: 'web', reason: 'invalid_credentials', mode: 'signup' });
    expect(authEventProps({ method: 'carrier pigeon', reason: 'Has Spaces' })).toEqual({});
  });

  it('sends only known events, with safe props', () => {
    const sent = [];
    setAuthAnalyticsClient({ capture: (e, p) => sent.push([e, p]) });
    trackAuth(AUTH_EVENTS.LOGIN_STARTED, { method: 'google', surface: 'app' });
    trackAuth('made_up_event', { method: 'email' });
    trackAuthFailure(AUTH_EVENTS.LOGIN_FAILED, { message: 'Invalid login credentials' }, { method: 'email', surface: 'web' });
    expect(sent).toEqual([
      ['login_started', { method: 'google', surface: 'app' }],
      ['login_failed', { method: 'email', surface: 'web', reason: 'invalid_credentials' }],
    ]);
  });

  it('never throws when analytics is broken', () => {
    setAuthAnalyticsClient({ capture: () => { throw new Error('down'); } });
    expect(() => trackAuth(AUTH_EVENTS.LOGOUT_COMPLETED, {})).not.toThrow();
  });
});

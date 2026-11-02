// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanProps,
  setAnalyticsClient,
  trackEvent,
  trackAppOpened,
  trackCheckin,
  trackPdpViewed,
  trackFirstMatchShown,
  trackQuizStarted,
  hasPendingSignupFlow,
  trackSignupStarted,
  trackSignupVerificationRequired,
  trackSignupVerified,
  trackSignupFailed,
  trackProfileSetupStarted,
  trackProfileSetupFinished,
  EVENTS,
} from './analyticsEvents.js';

let sent;
beforeEach(() => { sent = []; setAnalyticsClient({ capture: (n, p) => sent.push([n, p]) }); window.localStorage.clear(); });

describe('analyticsEvents: ids, surface and counts only', () => {
  it('drops anything that is not an allowed key or a safe value', () => {
    expect(cleanProps({ surface: 'app', product_id: 'diva-cup', symptoms: 'cramps', query: 'heavy bleeding', email: 'person@example.com', message: 'raw provider error', method: 'email', position: 2.4, where: 'has spaces no' })).toEqual({ surface: 'app', product_id: 'diva-cup', method: 'email', position: 2 });
  });
  it('unknown events are not sent', () => {
    trackEvent('cycle_day_logged', { surface: 'app' });
    expect(sent).toEqual([]);
  });
  it('app_opened once per local day with days since first open', () => {
    trackAppOpened({ surface: 'app' }, new Date(2026, 9, 1, 9));
    trackAppOpened({ surface: 'app' }, new Date(2026, 9, 1, 23));
    trackAppOpened({ surface: 'app' }, new Date(2026, 9, 8, 7));
    expect(sent.map(([n, p]) => [n, p.days_since_first_open])).toEqual([[EVENTS.APP_OPENED, 0], [EVENTS.APP_OPENED, 7]]);
  });
  it('check-ins per week counts local days in the last 7', () => {
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 1, 8));
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 1, 22));
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 3, 8));
    trackCheckin({ surface: 'web' }, new Date(2026, 9, 9, 8));
    expect(sent.map(([, p]) => p.checkins_this_week)).toEqual([1, 1, 2, 2]);
  });
  it('pdp_viewed flags products with 5+ reviews; first match only once', () => {
    trackPdpViewed({ surface: 'web', product_id: 'p1', review_count: 6 });
    expect(sent[0][1]).toEqual({ surface: 'web', product_id: 'p1', review_count: 6, has_5_reviews: true });
    trackQuizStarted({ surface: 'web' });
    trackFirstMatchShown({ surface: 'web', matches_count: 12 });
    trackFirstMatchShown({ surface: 'web', matches_count: 12 });
    expect(sent.filter(([n]) => n === EVENTS.FIRST_MATCH_SHOWN)).toHaveLength(1);
  });

  it('tracks the complete signup -> verification -> profile funnel once', () => {
    const created = new Date().toISOString();
    trackSignupStarted({ surface: 'web', method: 'email', verification: 'email_code' });
    trackSignupVerificationRequired({ surface: 'web', method: 'email', verification: 'email_code' });
    trackSignupVerificationRequired({ surface: 'web', method: 'email', verification: 'email_code' });
    trackSignupVerified({ surface: 'web', method: 'email', user_created_at: created });
    trackSignupVerified({ surface: 'web', method: 'email', user_created_at: created });
    trackProfileSetupStarted({ surface: 'web' });
    trackProfileSetupStarted({ surface: 'web' });
    trackProfileSetupFinished({ surface: 'web', outcome: 'completed' });

    expect(sent.map(([name]) => name)).toEqual([
      EVENTS.SIGNUP_STARTED,
      EVENTS.SIGNUP_VERIFICATION_REQUIRED,
      EVENTS.SIGNUP_VERIFIED,
      EVENTS.PROFILE_SETUP_STARTED,
      EVENTS.PROFILE_SETUP_FINISHED,
      EVENTS.SIGNUP_COMPLETED,
    ]);
    expect(hasPendingSignupFlow()).toBe(false);
  });

  it('keeps a failed verification in the funnel so a retry can still convert', () => {
    trackSignupStarted({ surface: 'app', method: 'phone', verification: 'sms' });
    trackSignupVerificationRequired({ surface: 'app', method: 'phone', verification: 'sms' });
    trackSignupFailed({ surface: 'app', method: 'phone', stage: 'verification', reason: 'otp_expired' });
    expect(hasPendingSignupFlow()).toBe(true);

    trackSignupVerified({ surface: 'app', method: 'phone', user_created_at: new Date().toISOString() });
    expect(sent.some(([name]) => name === EVENTS.SIGNUP_VERIFIED)).toBe(true);
  });

  it('does not count an older existing OAuth account as a new signup', () => {
    trackSignupStarted({ surface: 'app', method: 'google', verification: 'oauth' });
    trackSignupVerificationRequired({ surface: 'app', method: 'google', verification: 'oauth' });
    const verified = trackSignupVerified({ surface: 'app', method: 'google', user_created_at: '2020-01-01T00:00:00.000Z' });

    expect(verified).toBe(false);
    expect(sent.some(([name]) => name === EVENTS.SIGNUP_VERIFIED)).toBe(false);
    expect(hasPendingSignupFlow()).toBe(false);
  });
});

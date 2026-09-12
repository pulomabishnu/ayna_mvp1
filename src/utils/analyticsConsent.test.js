/**
 * Tests for analyticsConsent.js
 *
 * Same shape as posthogInternal.test.js — the PostHog instance is a plain
 * mock object, the module under test is never mocked.
 *
 * Run: npx vitest run src/utils/analyticsConsent.test.js
 */

import './test-setup-localstorage.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getStoredConsent, hasRecordedChoice, applyStoredConsent, acknowledgeAnalytics,
  grantConsent, denyConsent, CONSENT_STORAGE_KEY, CONSENT_TTL_MS,
} from './analyticsConsent';

// Mirrors the real posthog-js API surface this module actually reads.
// get_explicit_consent_status() returns 'pending' until opt_in/opt_out has
// been called at least once — has_opted_in/out_capturing() is deliberately
// NOT used here (or in the module under test) because, with
// opt_out_capturing_by_default: true, has_opted_out_capturing() returns true
// even for a visitor who was never asked. See the comment on
// explicitSdkDecision() in analyticsConsent.js.
function mockPh() {
  let consent = 'pending';
  return {
    opt_in_capturing: vi.fn(() => { consent = 'granted'; }),
    opt_out_capturing: vi.fn(() => { consent = 'denied'; }),
    capture: vi.fn(),
    get_explicit_consent_status: vi.fn(() => consent),
  };
}

describe('analyticsConsent', () => {
  let ph;

  beforeEach(() => {
    localStorage.clear();
    ph = mockPh();
  });

  afterEach(() => vi.restoreAllMocks());

  it('has no recorded choice before any decision', () => {
    expect(hasRecordedChoice()).toBe(false);
    expect(getStoredConsent()).toBeUndefined();
  });

  it('has no recorded choice for a fresh PostHog instance that was never asked (the opt_out_capturing_by_default=true case)', () => {
    // This is the regression this suite guards against: with the SDK
    // defaulting to opted-out, has_opted_out_capturing() alone would say
    // "true" here and wrongly hide the banner forever.
    expect(hasRecordedChoice(ph)).toBe(false);
  });

  it('applyStoredConsent opts in when nothing is stored anywhere', () => {
    applyStoredConsent(ph);
    expect(ph.opt_in_capturing).toHaveBeenCalled();
    expect(ph.opt_out_capturing).not.toHaveBeenCalled();
  });

  it('applyStoredConsent opts in for a stored grant', () => {
    grantConsent(ph);
    const fresh = mockPh();
    applyStoredConsent(fresh);
    expect(fresh.opt_in_capturing).toHaveBeenCalled();
    expect(fresh.opt_out_capturing).not.toHaveBeenCalled();
  });

  it('applyStoredConsent opts out for a stored denial', () => {
    denyConsent(ph);
    const fresh = mockPh();
    applyStoredConsent(fresh);
    expect(fresh.opt_out_capturing).toHaveBeenCalled();
    expect(fresh.opt_in_capturing).not.toHaveBeenCalled();
  });

  it('applyStoredConsent leaves an existing explicit SDK-level grant alone (e.g. from account settings)', () => {
    ph.get_explicit_consent_status = vi.fn(() => 'granted');
    applyStoredConsent(ph);
    expect(ph.opt_in_capturing).not.toHaveBeenCalled();
    expect(ph.opt_out_capturing).not.toHaveBeenCalled();
  });

  it('applyStoredConsent leaves an existing explicit SDK-level denial alone (e.g. from GPC)', () => {
    ph.get_explicit_consent_status = vi.fn(() => 'denied');
    applyStoredConsent(ph);
    expect(ph.opt_in_capturing).not.toHaveBeenCalled();
    expect(ph.opt_out_capturing).not.toHaveBeenCalled();
  });

  it('acknowledgeAnalytics persists the default-on choice without duplicating a pageview', () => {
    acknowledgeAnalytics(ph);
    expect(ph.opt_in_capturing).toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)).decision).toBe('granted');
  });

  it('grantConsent opts in, fires a pageview, and persists with a timestamp', () => {
    grantConsent(ph);
    expect(ph.opt_in_capturing).toHaveBeenCalled();
    expect(ph.capture).toHaveBeenCalledWith('$pageview');
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    expect(stored.decision).toBe('granted');
    expect(Date.parse(stored.timestamp)).not.toBeNaN();
  });

  it('denyConsent opts out, persists, and never fires a pageview', () => {
    denyConsent(ph);
    expect(ph.opt_out_capturing).toHaveBeenCalled();
    expect(ph.capture).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY)).decision).toBe('denied');
  });

  it('hasRecordedChoice is true when the SDK already has an explicit opt state, even with no local banner decision', () => {
    expect(hasRecordedChoice(ph)).toBe(false);
    ph.get_explicit_consent_status = vi.fn(() => 'denied');
    expect(hasRecordedChoice(ph)).toBe(true);
  });

  it('an old grant expires to the default-on state, but an opt-out never silently expires', () => {
    const stale = new Date(Date.now() - CONSENT_TTL_MS - 1000).toISOString();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'granted', timestamp: stale }));
    expect(getStoredConsent()).toBeUndefined();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'denied', timestamp: stale }));
    expect(getStoredConsent()).toBe('denied');
    expect(hasRecordedChoice()).toBe(true);
  });

  it('migrates the legacy plain-string format without losing the decision', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    expect(getStoredConsent()).toBe('granted');
    const stored = JSON.parse(localStorage.getItem(CONSENT_STORAGE_KEY));
    expect(stored.decision).toBe('granted');
  });

  it('treats a corrupt or unrecognised stored value as no decision', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, '{not json');
    expect(getStoredConsent()).toBeUndefined();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'maybe', timestamp: new Date().toISOString() }));
    expect(getStoredConsent()).toBeUndefined();
  });
});

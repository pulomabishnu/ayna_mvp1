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
  grantConsent, denyConsent, isGpcActive, isMandatoryGpcVisitor,
  _resetMandatoryGpcCacheForTests, CONSENT_STORAGE_KEY, CONSENT_TTL_MS,
} from './analyticsConsent';

// Mirrors the real posthog-js API surface this module actually reads.
// get_explicit_consent_status() remains 'pending' until opt_in/opt_out is
// explicitly called. That is important for default-on analytics: a fresh
// visitor is already being captured by posthog.init, but still has no explicit
// decision, so the visible opt-out notice should appear.
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
    delete navigator.globalPrivacyControl;
    vi.unstubAllGlobals();
    _resetMandatoryGpcCacheForTests();
    ph = mockPh();
  });

  afterEach(() => {
    delete navigator.globalPrivacyControl;
    vi.restoreAllMocks();
  });

  it('has no recorded choice before any decision', () => {
    expect(hasRecordedChoice()).toBe(false);
    expect(getStoredConsent()).toBeUndefined();
  });

  it('has no recorded choice for a fresh PostHog instance in the implicit default-on state', () => {
    expect(hasRecordedChoice(ph)).toBe(false);
  });

  it('applyStoredConsent leaves an undecided visitor implicit so the opt-out notice stays visible', () => {
    applyStoredConsent(ph);
    expect(ph.opt_in_capturing).not.toHaveBeenCalled();
    expect(ph.opt_out_capturing).not.toHaveBeenCalled();
    expect(hasRecordedChoice(ph)).toBe(false);
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

  it('hasRecordedChoice is true when the SDK already has an explicit opt state, even with no local notice decision', () => {
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

  describe('isGpcActive', () => {
    it('is false when the browser sends no GPC signal', () => {
      expect(isGpcActive()).toBe(false);
    });

    it('is true when navigator.globalPrivacyControl is exactly true', () => {
      navigator.globalPrivacyControl = true;
      expect(isGpcActive()).toBe(true);
    });

    it('is false for any truthy-but-not-true value (spec says only literal true counts)', () => {
      navigator.globalPrivacyControl = 1;
      expect(isGpcActive()).toBe(false);
    });
  });

  describe('isMandatoryGpcVisitor', () => {
    it('resolves false without any network call when GPC is not active', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      await expect(isMandatoryGpcVisitor()).resolves.toBe(false);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('resolves true when GPC is active and the region check says mandatory', async () => {
      navigator.globalPrivacyControl = true;
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mandatory: true }) }));
      await expect(isMandatoryGpcVisitor()).resolves.toBe(true);
    });

    it('resolves false when GPC is active but the region check says not mandatory', () => {
      navigator.globalPrivacyControl = true;
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ mandatory: false }) }));
      return expect(isMandatoryGpcVisitor()).resolves.toBe(false);
    });

    it('fails closed (mandatory) on a network error', () => {
      navigator.globalPrivacyControl = true;
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
      return expect(isMandatoryGpcVisitor()).resolves.toBe(true);
    });

    it('fails closed (mandatory) on a non-OK response', () => {
      navigator.globalPrivacyControl = true;
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      return expect(isMandatoryGpcVisitor()).resolves.toBe(true);
    });
  });
});

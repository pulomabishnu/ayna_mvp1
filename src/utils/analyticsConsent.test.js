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
  getStoredConsent, hasRecordedChoice, applyStoredConsent,
  grantConsent, denyConsent, CONSENT_STORAGE_KEY, CONSENT_TTL_MS,
} from './analyticsConsent';

function mockPh() {
  return {
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    capture: vi.fn(),
    // Simulates a browser sending Global Privacy Control: main.jsx would
    // have already called opt_out_capturing() on this instance before our
    // module ever sees it, so the SDK's own state already reads "denied".
    get_explicit_consent_status: vi.fn(() => 'denied'),
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

  it('has no recorded choice even when the SDK already reads "denied" (e.g. GPC) — the banner must still be asked', () => {
    // This is the regression this suite guards against: a prior explicit
    // SDK-level decision (GPC, or anything else that ran before the banner
    // existed) must never be treated as "the banner already answered".
    expect(hasRecordedChoice()).toBe(false);
  });

  it('applyStoredConsent opts out when nothing is stored', () => {
    applyStoredConsent(ph);
    expect(ph.opt_out_capturing).toHaveBeenCalled();
    expect(ph.opt_in_capturing).not.toHaveBeenCalled();
  });

  it('applyStoredConsent opts in for a stored grant, even over a GPC-set SDK state', () => {
    grantConsent(ph);
    const fresh = mockPh(); // fresh instance still reporting GPC's "denied"
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

  it('a decision older than the TTL is treated as unset', () => {
    const stale = new Date(Date.now() - CONSENT_TTL_MS - 1000).toISOString();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'granted', timestamp: stale }));
    expect(getStoredConsent()).toBeUndefined();
    expect(hasRecordedChoice()).toBe(false);
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

/**
 * Session replay privacy rules (src/utils/replayPrivacy.js) and the consent
 * flag that gates them (analyticsConsent.js).
 *
 * Run: npx vitest run src/utils/replayPrivacy.test.js
 */
import './test-setup-localstorage.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isReplaySafeLocation, replayAllowed, maskReplayAttribute, createReplayGuard,
  SESSION_RECORDING_OPTIONS, UNSAFE_LEAD_MS, REPLAY_SAFE_WEB_VIEWS, REPLAY_SAFE_APP_VIEWS,
} from './replayPrivacy.js';
import {
  acknowledgeAnalytics, grantConsent, denyConsent, hasReplayConsent, CONSENT_STORAGE_KEY,
} from './analyticsConsent.js';

function mockPh() {
  return {
    opt_in_capturing: vi.fn(), opt_out_capturing: vi.fn(), capture: vi.fn(),
    stopSessionRecording: vi.fn(), get_explicit_consent_status: vi.fn(() => 'pending'),
  };
}

describe('which screens may be recorded', () => {
  it('records browse and information pages on the website', () => {
    for (const [view, pathname] of [
      ['welcome', '/'], ['explore', '/explore'], ['discovery', '/explore/products'],
      ['product', '/product/monistat-7'], ['comparison', '/compare'], ['community', '/community'],
      ['explore-topics', '/explore/topics'], ['privacy-policy', '/privacy-policy'],
    ]) expect(isReplaySafeLocation({ view, pathname }), `${view} ${pathname}`).toBe(true);
  });

  it('never records health screens on the website', () => {
    for (const [view, pathname] of [
      ['quiz', '/quiz'], ['home', '/home'], ['today', '/home'], ['ask', '/ask'], ['you', '/you'],
      ['ecosystem', '/you/ecosystem'], ['recommendations', '/recommendations'],
      ['profile-edit', '/profile'], ['health-data', '/health-data'], ['doctor-prep', '/appointment-prep'],
      ['campus-resources', '/campus-resources'], ['shared-answer', '/a/abc123'],
      ['articles', '/explore/resources'], ['screenings', '/screenings'], ['delete-account', '/delete-account'],
    ]) expect(isReplaySafeLocation({ view, pathname }), `${view} ${pathname}`).toBe(false);
  });

  it('never records a page whose address names a health topic, even in an allowed view', () => {
    expect(isReplaySafeLocation({ view: 'community', pathname: '/community/p/123' })).toBe(false);
    expect(isReplaySafeLocation({ view: 'community', pathname: '/community/u/someone' })).toBe(false);
    expect(isReplaySafeLocation({ view: 'explore-topics', pathname: '/explore/topics/pcos' })).toBe(false);
    expect(isReplaySafeLocation({ view: 'welcome', pathname: '/campus-resources' })).toBe(false);
    expect(isReplaySafeLocation({ view: 'welcome', pathname: '/read/yeast-infections' })).toBe(false);
  });

  it('uses the app screen names inside the app and the app preview', () => {
    expect(isReplaySafeLocation({ view: 'browse', native: true })).toBe(true);
    expect(isReplaySafeLocation({ view: 'product', native: true })).toBe(true);
    for (const view of ['quiz', 'today', 'ask', 'checkin', 'connect', 'profile', 'reveal', 'why-match', 'plan', 'eco', 'saved', 'article']) {
      expect(isReplaySafeLocation({ view, native: true }), view).toBe(false);
    }
    expect(isReplaySafeLocation({ view: 'browse', pathname: '/mobile-preview' })).toBe(true);
    expect(isReplaySafeLocation({ view: 'today', pathname: '/mobile-preview' })).toBe(false);
  });

  it('does not record before the screen is known, or on a screen nobody added', () => {
    expect(isReplaySafeLocation({ view: undefined, pathname: '/' })).toBe(false);
    expect(isReplaySafeLocation({ view: 'some-new-screen', pathname: '/new' })).toBe(false);
  });

  it('keeps health screens off both allowlists', () => {
    for (const v of ['quiz', 'today', 'ask', 'you', 'health-data', 'profile', 'intake']) {
      expect(REPLAY_SAFE_WEB_VIEWS.has(v)).toBe(false);
      expect(REPLAY_SAFE_APP_VIEWS.has(v)).toBe(false);
    }
  });
});

describe('replayAllowed', () => {
  const ok = { optedIn: true, replayConsent: true, gpc: false, internal: false, safeLocation: true };
  it('needs every condition', () => {
    expect(replayAllowed(ok)).toBe(true);
    for (const k of ['optedIn', 'replayConsent', 'safeLocation']) expect(replayAllowed({ ...ok, [k]: false }), k).toBe(false);
    expect(replayAllowed({ ...ok, gpc: true })).toBe(false);
    expect(replayAllowed({ ...ok, internal: true })).toBe(false);
  });
});

describe('masking', () => {
  it('masks all text and inputs, uploads, canvas and network', () => {
    expect(SESSION_RECORDING_OPTIONS.maskAllInputs).toBe(true);
    expect(SESSION_RECORDING_OPTIONS.maskTextSelector).toBe('*');
    expect(SESSION_RECORDING_OPTIONS.captureCanvas.recordCanvas).toBe(false);
    expect(SESSION_RECORDING_OPTIONS.blockSelector).toContain('img[src^="blob:"]');
    expect(SESSION_RECORDING_OPTIONS.blockSelector).toContain('[data-replay-block]');
    expect(SESSION_RECORDING_OPTIONS.recordBody).toBe(false);
    expect(SESSION_RECORDING_OPTIONS.recordHeaders).toBe(false);
    expect(SESSION_RECORDING_OPTIONS.maskCapturedNetworkRequestFn({ name: 'x' })).toBeNull();
  });

  it('masks attributes that carry words and scrubs links', () => {
    expect(maskReplayAttribute('aria-label', 'Yeast infection')).not.toMatch(/yeast/i);
    expect(maskReplayAttribute('alt', 'Monistat box')).not.toMatch(/monistat/i);
    expect(maskReplayAttribute('placeholder', 'Search symptoms')).not.toMatch(/symptom/i);
    expect(maskReplayAttribute('data-concern', 'pcos')).not.toMatch(/pcos/i);
    expect(maskReplayAttribute('href', '/explore/products?q=yeast')).toBe('/explore/products');
    expect(maskReplayAttribute('href', 'https://www.aynahealth.co/read/pcos-basics')).toBe('https://www.aynahealth.co/read');
    expect(maskReplayAttribute('class', 'ay-card')).toBe('ay-card');
  });
});

describe('createReplayGuard', () => {
  it('drops frames recorded on (or just before) a screen that may not be recorded', () => {
    let t = 100_000;
    const guard = createReplayGuard(() => t);
    guard.update(true);
    t = 110_000; guard.update(false); // entered the quiz
    t = 120_000; guard.update(true); // back to shop
    const ev = { event: '$snapshot', properties: { $snapshot_data: [
      { timestamp: 105_000 }, // shop: kept
      { timestamp: 110_000 - UNSAFE_LEAD_MS + 10 }, // quiz drawing in: dropped
      { timestamp: 115_000 }, // quiz: dropped
      { timestamp: 121_000 }, // shop again: kept
    ] } };
    expect(guard.filterSnapshot(ev).properties.$snapshot_data.map((f) => f.timestamp)).toEqual([105_000, 121_000]);
  });

  it('drops everything while she is still on such a screen', () => {
    let t = 1_000_000;
    const guard = createReplayGuard(() => t);
    guard.update(false);
    t += 5000;
    expect(guard.filterSnapshot({ event: '$snapshot', properties: { $snapshot_data: [{ timestamp: t }] } })).toBeNull();
  });
});

describe('replay consent', () => {
  let ph;
  beforeEach(() => { localStorage.clear(); ph = mockPh(); });

  it('only the consent banner (which describes replay) grants it', () => {
    acknowledgeAnalytics(ph);
    expect(hasReplayConsent()).toBe(true);
  });

  it('footer/account "Turn on" grants analytics without replay', () => {
    grantConsent(ph);
    expect(hasReplayConsent()).toBe(false);
  });

  it('an opt-in from before replay existed does not include it', () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ decision: 'granted', timestamp: new Date().toISOString() }));
    expect(hasReplayConsent()).toBe(false);
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    expect(hasReplayConsent()).toBe(false);
  });

  it('Keep off ends replay and stops the recorder', () => {
    acknowledgeAnalytics(ph);
    denyConsent(ph);
    expect(hasReplayConsent()).toBe(false);
    expect(ph.stopSessionRecording).toHaveBeenCalled();
  });
});

describe('installReplayViewWatch', () => {
  it('fires a view-changed event when App/MobileApp set window.__aynaView', async () => {
    const { installReplayViewWatch, VIEW_CHANGED_EVENT } = await import('./replayPrivacy.js');
    const listeners = {};
    globalThis.window = {
      addEventListener: (t, f) => { (listeners[t] ||= []).push(f); },
      dispatchEvent: (e) => { (listeners[e.type] || []).forEach((f) => f(e)); return true; },
    };
    const seen = [];
    window.addEventListener(VIEW_CHANGED_EVENT, () => seen.push(window.__aynaView));
    installReplayViewWatch();
    window.__aynaView = 'explore';
    window.__aynaView = 'explore';
    window.__aynaView = 'quiz';
    expect(seen).toEqual(['explore', 'quiz']);
    delete globalThis.window;
  });
});

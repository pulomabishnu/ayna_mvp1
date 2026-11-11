import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { countJourneyStep, isFirstLoadOfVisit, countLanded, resetLandedForTests } from './journeyStep.js';

const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const store = (decision, extra = {}) => {
  const ls = {
    getItem: (k) => (k in extra ? extra[k] : decision ? JSON.stringify({ decision, timestamp: new Date().toISOString() }) : null),
    setItem: () => {},
  };
  vi.stubGlobal('localStorage', ls);
  vi.stubGlobal('window', { localStorage: ls });
};
function sent(fn) {
  const fetchMock = vi.fn(() => Promise.resolve());
  vi.stubGlobal('fetch', fetchMock);
  fn();
  return fetchMock.mock.calls;
}
afterEach(() => { vi.unstubAllGlobals(); resetLandedForTests(); });

describe('countJourneyStep', () => {
  it('sends only the step and platform to /api/step, with no cookies or referrer', () => {
    vi.stubGlobal('navigator', {});
    store(null);
    const calls = sent(() => countJourneyStep('quiz_started'));
    expect(calls).toHaveLength(1);
    const [url, init] = calls[0];
    expect(url).toBe('/api/step');
    expect(init).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, body: '{"s":"quiz_started","pl":"web"}' });
  });
  it('ignores unknown steps', () => {
    vi.stubGlobal('navigator', {});
    store(null);
    expect(sent(() => countJourneyStep('quiz_answer_pcos'))).toHaveLength(0);
  });
  it('counts before a choice and after Turn on; nothing after Keep off or with GPC', () => {
    vi.stubGlobal('navigator', {});
    store(null);
    expect(sent(() => countJourneyStep('landed'))).toHaveLength(1);
    store('granted');
    expect(sent(() => countJourneyStep('landed'))).toHaveLength(1);
    store('denied');
    expect(sent(() => countJourneyStep('landed'))).toHaveLength(0);
    vi.stubGlobal('navigator', { globalPrivacyControl: true });
    store('granted');
    expect(sent(() => countJourneyStep('landed'))).toHaveLength(0);
  });
  it('never counts founder browsers or test phones', () => {
    vi.stubGlobal('navigator', {});
    store(null, { ayna_internal_analytics_v1: 'founder' });
    expect(sent(() => countJourneyStep('landed'))).toHaveLength(0);
  });
  it('never throws', () => {
    vi.stubGlobal('navigator', {});
    store(null);
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('x'); }));
    expect(() => countJourneyStep('landed')).not.toThrow();
  });
});

describe('landed', () => {
  const doc = (referrer) => ({ referrer, location: { hostname: 'www.aynahealth.co' } });
  const perf = (type) => ({ getEntriesByType: () => [{ type }] });
  it('is the first page load of a visit only', () => {
    expect(isFirstLoadOfVisit({ doc: doc(''), perf: perf('navigate') })).toBe(true);
    expect(isFirstLoadOfVisit({ doc: doc('https://www.google.com/'), perf: perf('navigate') })).toBe(true);
    expect(isFirstLoadOfVisit({ doc: doc('https://aynahealth.co/shop'), perf: perf('navigate') })).toBe(false);
    expect(isFirstLoadOfVisit({ doc: doc(''), perf: perf('reload') })).toBe(false);
    expect(isFirstLoadOfVisit({ doc: doc(''), perf: perf('back_forward') })).toBe(false);
    expect(isFirstLoadOfVisit({ isNative: true })).toBe(true);
  });
  it('sends at most once per page load', () => {
    vi.stubGlobal('navigator', {});
    store(null);
    const calls = sent(() => { countLanded({ doc: doc(''), perf: perf('navigate') }); countLanded({ doc: doc(''), perf: perf('navigate') }); });
    expect(calls).toHaveLength(1);
    expect(calls[0][1].body).toBe('{"s":"landed","pl":"web"}');
  });
});

describe('every step is wired on the website and in the app', () => {
  it('each step has its call sites', () => {
    expect(src('../main.jsx')).toMatch(/countLanded\(\)/);
    expect(src('./funnelEvents.js')).toMatch(/cta === 'sign_up_free'\) countJourneyStep\('sign_up_free_clicked'\)/);
    expect(src('../components/landing/AppLanding.jsx')).toMatch(/trackLandingCta\('sign_up_free', 'app'\)/);
    expect(src('./analyticsEvents.js')).toMatch(/countJourneyStep\('quiz_started'\)/);
    expect(src('../App.jsx')).toMatch(/if \(!quizResults\) countJourneyStep\('quiz_completed'\)/);
    expect(src('../mobile/MobileApp.jsx')).toMatch(/if \(intakeMode === 'new'\) countJourneyStep\('quiz_completed'\)/);
    expect(src('../mobile/hooks/useHealthData.js')).toMatch(/countJourneyStep\('health_connected'\)/);
    expect(src('../mobile/screens/profile/HealthConnectionsScreenCore.jsx')).toMatch(/countJourneyStep\('health_connected'\)/);
    expect(src('./analyticsIdentity.js')).toMatch(/countJourneyStep\('account_created'\)/);
    expect(src('../components/AuthGate.jsx')).toMatch(/recordNewAccount\(posthog, data\.user/);
    expect(src('../mobile/hooks/useSupabaseAuth.js')).toMatch(/recordNewAccount\(posthog, data\.user/);
  });
});

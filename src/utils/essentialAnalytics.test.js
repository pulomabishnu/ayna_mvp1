// Regression test for the 2026-11-06 outage: analytics became opt-in only and
// a normal anonymous web visitor's $pageview was never sent, so PostHog showed
// 1-10 visitors a day instead of 45-105.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { sanitizeEventPayload } from './analyticsSanitize';
import { applyConsentTier, ESSENTIAL_EVENTS, KNOWN_SECTIONS } from './essentialAnalytics';

const main = readFileSync(new URL('../main.jsx', import.meta.url), 'utf8');

// Same pipeline as before_send in main.jsx: sanitize, then the consent tier.
const beforeSend = (event, state) =>
  applyConsentTier(sanitizeEventPayload(event, { platform: 'web' }), state);

const anonymousPageview = () => ({
  event: '$pageview',
  properties: {
    $host: 'www.aynahealth.co',
    $current_url: 'https://www.aynahealth.co/how-it-works',
    $pathname: '/how-it-works',
    $referrer: 'https://www.google.com/',
  },
  $set_once: { $initial_referrer: 'https://www.google.com/' },
});

const UNDECIDED = { optedIn: false, gpc: false, stored: undefined };

describe('essential analytics tier', () => {
  it('sends a normal anonymous web visitor\'s $pageview (never dropped)', () => {
    const out = beforeSend(anonymousPageview(), UNDECIDED);
    expect(out).not.toBeNull();
    expect(out.event).toBe('$pageview');
    expect(out.properties.$host).toBe('www.aynahealth.co');
    expect(out.properties.platform).toBe('web');
    expect(out.properties.$referrer).toBe('https://www.google.com');
    expect(out.properties.$current_url).toBe('https://www.aynahealth.co/how-it-works');
  });

  it('sends no person properties before opt-in', () => {
    const out = beforeSend(anonymousPageview(), UNDECIDED);
    expect(out.$set_once).toBeUndefined();
    expect(out.$set).toBeUndefined();
  });

  it('sends only pageviews, pageleaves, errors and new-account counts before opt-in', () => {
    expect([...ESSENTIAL_EVENTS].sort()).toEqual(['$pageleave', '$pageview', 'app_error', 'signed_up']);
    for (const name of ['pdp_viewed', 'recommendation_viewed', 'app_opened', '$identify', 'perf_timing']) {
      expect(beforeSend({ event: name, properties: {} }, UNDECIDED)).toBeNull();
    }
    expect(beforeSend({ event: 'app_error', properties: {} }, UNDECIDED)).not.toBeNull();
  });

  it('sends nothing after "Keep analytics off" or with GPC', () => {
    expect(beforeSend(anonymousPageview(), { ...UNDECIDED, stored: 'denied' })).toBeNull();
    expect(beforeSend(anonymousPageview(), { ...UNDECIDED, gpc: true })).toBeNull();
  });

  it('sends full optional analytics after opt-in', () => {
    const state = { optedIn: true, gpc: false, stored: 'granted' };
    expect(beforeSend({ event: 'pdp_viewed', properties: {} }, state)).not.toBeNull();
    expect(beforeSend(anonymousPageview(), state).$set_once).toBeDefined();
  });

  // Real cookieless $pageview captured from the built site (2026-11-10), opened at
  // /product/monistat-7?q=yeast+infection&utm_source=instagram&fbclid=abc123#symptoms
  const healthPageview = () => ({
    event: '$pageview',
    properties: {
      $current_url: 'https://www.aynahealth.co/product/monistat-7?q=yeast+infection&utm_source=instagram&utm_campaign=pcos-awareness&fbclid=abc123#symptoms',
      $pathname: '/product/monistat-7',
      $prev_pageview_pathname: '/community/topic/pcos',
      $host: 'www.aynahealth.co',
      $referrer: 'https://www.google.com/search?q=yeast+infection+treatment',
      $referring_domain: 'www.google.com',
      title: 'Monistat 7 | ayna',
      utm_source: 'instagram',
      utm_campaign: 'pcos-awareness',
      utm_term: 'yeast infection',
      fbclid: 'abc123',
      gclid: 'xyz',
      $active_feature_flags: [],
      $prev_pageview_max_scroll: 0,
      distinct_id: '$posthog_cookieless',
      $cookieless_mode: true,
      token: 'phc_test',
      $browser: 'Chrome',
    },
  });

  it('sends no health information in anonymous page addresses, titles, referrers or campaign tags', () => {
    const out = beforeSend(healthPageview(), UNDECIDED);
    const p = out.properties;
    expect(p.$current_url).toBe('https://www.aynahealth.co/product');
    expect(p.$pathname).toBe('/product');
    expect(p.$prev_pageview_pathname).toBe('/community');
    expect(p.$referrer).toBe('https://www.google.com');
    expect(p.title).toBeUndefined();
    expect(p.utm_campaign).toBeUndefined();
    expect(p.utm_term).toBeUndefined();
    expect(p.fbclid).toBeUndefined();
    expect(p.gclid).toBeUndefined();
    expect(p.utm_source).toBe('instagram');
    // What PostHog needs to accept and count the event is kept.
    expect(p).toMatchObject({ token: 'phc_test', distinct_id: '$posthog_cookieless', $cookieless_mode: true, $host: 'www.aynahealth.co', platform: 'web', $browser: 'Chrome' });
    // Nothing anywhere in the payload mentions the condition, product or search.
    expect(JSON.stringify(out)).not.toMatch(/monistat|yeast|pcos|symptom|infection/i);
  });

  it('reduces every kind of address to its section', () => {
    const cases = {
      '/': '/',
      '/community/post/123-my-period-is-late': '/community',
      '/explore/resources/endometriosis-guide': '/explore',
      '/you/health': '/you',
      '/a/Ab12Cd34Ef': '/a',
      '/gift/abcdefghijklmnopqrstuvwx': '/gift',
      '/pcos-symptoms': '/other',
      '/screenings?condition=hpv': '/screenings',
    };
    for (const [path, want] of Object.entries(cases)) {
      const out = beforeSend({ event: '$pageview', properties: { $current_url: `https://www.aynahealth.co${path}`, $pathname: path } }, UNDECIDED);
      expect(out.properties.$pathname, path).toBe(want);
      expect(out.properties.$current_url, path).toBe(`https://www.aynahealth.co${want}`);
    }
  });

  it('keeps app_error\'s coarse fields but nothing else', () => {
    const out = beforeSend({ event: 'app_error', properties: { errorName: 'TypeError', errorMessage: '[redacted]', component: 'ProductModal', view: 'product', isChunkLoadError: false, title: 'Monistat 7 | ayna' } }, UNDECIDED);
    expect(out.properties).toMatchObject({ errorName: 'TypeError', component: 'ProductModal', view: 'product', isChunkLoadError: false });
    expect(out.properties.title).toBeUndefined();
  });

  it('signed_up before a choice keeps only the sign-up method', () => {
    const out = beforeSend({ event: 'signed_up', properties: { method: 'google', referral_source: 'linkedin.com', heard_about_source: 'tiktok' } }, UNDECIDED);
    expect(out.properties.method).toBe('google');
    expect(out.properties.referral_source).toBeUndefined();
    expect(out.properties.heard_about_source).toBeUndefined();
    expect(beforeSend({ event: 'signed_up', properties: { method: 'email' } }, { ...UNDECIDED, stored: 'denied' })).toBeNull();
    expect(beforeSend({ event: 'signed_up', properties: { method: 'email' } }, { ...UNDECIDED, gpc: true })).toBeNull();
  });

  it('an anonymous event never carries an account id, even after sign-in', () => {
    const out = beforeSend({ event: 'signed_up', distinct_id: 'ayna_abc12345', properties: { distinct_id: 'ayna_abc12345', $user_id: 'ayna_abc12345', $device_id: 'dev123', method: 'email' } }, UNDECIDED);
    expect(out.properties.distinct_id).toBe('$posthog_cookieless');
    expect(out.distinct_id).toBe('$posthog_cookieless');
    expect(out.properties.$cookieless_mode).toBe(true);
    expect(JSON.stringify(out)).not.toMatch(/ayna_abc|dev123/);
    const opted = beforeSend({ event: 'signed_up', properties: { distinct_id: 'ayna_abc12345' } }, { optedIn: true, gpc: false, stored: 'granted' });
    expect(opted.properties.distinct_id).toBe('ayna_abc12345');
  });

  it('every section the site serves is on the known-sections list', () => {
    const vercel = readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8');
    const app = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
    const served = new Set();
    for (const m of vercel.matchAll(/"source":\s*"\/:page\(([^)]+)\)/g)) m[1].split('|').forEach((s) => served.add(s));
    for (const m of vercel.matchAll(/"source":\s*"\/([a-z][a-z0-9-]*)/g)) served.add(m[1]);
    const block = app.slice(app.indexOf('const VIEW_TO_PATH = {'), app.indexOf('};', app.indexOf('const VIEW_TO_PATH = {')));
    for (const m of block.matchAll(/'\/([a-z][a-z0-9-]*)/g)) served.add(m[1]);
    served.delete('api');
    served.delete('ingest');
    const missing = [...served].filter((s) => !KNOWN_SECTIONS.has(s));
    expect(missing).toEqual([]);
  });

  it('main.jsx keeps cookieless capture on and routes before_send through the tier', () => {
    expect(main).toContain("cookieless_mode: 'on_reject'");
    expect(main).toContain('before_send: sanitizePosthogEvent');
    expect(main).toContain('return applyConsentTier(clean,');
    // An opt-out from account/privacy controls (SDK-level) also stops the essential tier.
    expect(main).toContain("sdkDenied = posthog.get_explicit_consent_status?.() === 'denied'");
    // The 11-06 opt-in default and GPC rule stay as they were.
    expect(main).toContain("opt_out_capturing_by_default: GPC_ENABLED || STORED_ANALYTICS_PREF !== 'granted'");
  });
});

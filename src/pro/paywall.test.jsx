import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FREE_FEATURES, PRO_FEATURES } from './features.js';
import { RESUME_KEY, RESUME_MAX_AGE_MS, marqueeLength, peekProResume, roundedPerimeter, proFeatureName, proLimitFeature, registerProPaywallHost, resumeStep, saveProResume } from './paywall.js';
import ProLock from '../components/ProLock.jsx';
import { PLANS, PRO_GROUPS, proGroups } from './plans.js';

const proPage = readFileSync(new URL('../../public/pro.html', import.meta.url), 'utf8');
const proApi = readFileSync(new URL('../../api/pro.js', import.meta.url), 'utf8');
const testflightQr = readFileSync(new URL('../../public/images/testflight-qr.svg', import.meta.url), 'utf8');

describe('the one locked state', () => {
  it('frames the lock in the checker, names the feature and has one Get ayna Pro button and a quiet Not now', () => {
    const html = renderToStaticMarkup(<ProLock feature="reads" />);
    expect(html).toContain('class="pro-frame"');
    expect(html).toContain('Get ayna Pro to unlock');
    expect(html).toContain('More ayna Reads');
    expect(html.match(/class="pro-lock__cta"/g)).toHaveLength(1);
    expect(html).toContain('Not now');
  });
  it('sends the native app Pro CTA straight to the website and never shows TestFlight install copy', () => {
    const html = renderToStaticMarkup(<ProLock feature="wearables" native />);
    expect(html).toContain('pro-lock__cta');
    expect(html).toContain('href="https://www.aynahealth.co/pro?feature=wearables"');
    expect(html).toContain('>Get ayna Pro</a>');
    expect(html).toContain('Already a Pro member?');
    expect(html).not.toContain('TestFlight');
    expect(html).not.toContain('Download ayna on your iPhone');
  });
  it('puts Pro first and TestFlight second on the website, with the exact install link and QR code', () => {
    const html = renderToStaticMarkup(<ProLock feature="dashboard" />);
    const proStep = html.indexOf('<b>Get ayna Pro</b>');
    const installStep = html.indexOf('<b>Get ayna on TestFlight</b>');
    expect(proStep).toBeGreaterThan(-1);
    expect(installStep).toBeGreaterThan(proStep);
    expect(html).toContain('https://testflight.apple.com/join/f3C9PypD');
    expect(html).toContain('/images/testflight-qr.svg');
    expect(html).toContain('Scan with your iPhone camera.');
    expect(html).toContain('Sign in with the same account');
    expect(html).toContain('until your paid period ends');
    expect(testflightQr).toContain('ayna TestFlight QR code');
    expect(renderToStaticMarkup(<ProLock feature="dashboard" native />)).not.toContain('Download on TestFlight');
  });
  it('names gates from the Pro features list', () => {
    expect(proFeatureName('trial')).toBe('Advanced tracking');
    expect(proFeatureName('recap')).toBe('Deeper personalized insights');
    expect(proFeatureName('appointment')).toBe('Appointment prep');
  });
});

describe('limits reach the paywall instead of a dead end', () => {
  it('recognizes the database playlist limit and the server quota codes', () => {
    expect(proLimitFeature(new Error('Free ayna includes one playlist. ayna Pro Early Access includes unlimited playlists.'))).toBe('playlists');
    expect(proLimitFeature({ code: 'ecosystem_limit_reached' })).toBe('quiz');
    expect(proLimitFeature(new Error('Network down'))).toBe('');
  });
  it('lets only one host answer, the app over the website', () => {
    const web = registerProPaywallHost(1);
    const app = registerProPaywallHost(2);
    expect(app.isActive()).toBe(true);
    expect(web.isActive()).toBe(false);
    app.unregister();
    expect(web.isActive()).toBe(true);
    web.unregister();
  });
});

describe('the sheet and /pro only promise what is real', () => {
  it('keeps Early Access prices and picks Yearly first', () => {
    expect(PLANS[0]).toMatchObject({ id: 'year', price: '$45', regular: '$90' });
    expect(PLANS[1]).toMatchObject({ id: 'month', price: '$4.99', regular: '$8.99' });
  });
  it('groups every Pro feature once, marks the tapped one, and tags evolving ones as growing', () => {
    const ids = PRO_GROUPS.flatMap((g) => g.items).sort();
    expect(ids).toEqual(PRO_FEATURES.map((f) => f.id).sort());
    const groups = proGroups('trial');
    expect(groups.flatMap((g) => g.features).find((f) => f.on).id).toBe('tracking');
    for (const f of groups.flatMap((g) => g.features)) expect(f.growing).toBe(f.stage !== 'available');
  });
  it('uses the founder\'s Free vs Pro breakdown on /pro', () => {
    for (const row of ['Personalization quiz', '1 retake per month', 'Unlimited retakes', '5 chats a month', 'Up to 50 chats a month', '1 Read per week',
      'Unlimited playlists', 'Wearable + health app connections', 'Basic insights',
      'Deeper, more detailed personalized insights', 'Advanced tracking + trend insights', 'No connected health data', 'Recommendation explanations']) expect(proPage).toContain(row);
    for (const free of FREE_FEATURES) expect(proPage).toContain(free);
    expect(proPage).toContain('Free helps you find what fits. Pro learns with you.');
    expect(proPage).toContain('December 31, 2026');
    expect(proPage).toContain('$45');
    expect(proPage).toContain('$4.99');
    expect(proPage).not.toMatch(/\u2014/);
  });
  it('returns checkout to /pro, which confirms and takes her back', () => {
    expect(proApi).toContain('/pro?checkout=success');
    expect(proApi).toContain('/pro?checkout=canceled');
  });
});

describe('the checker ring runs round the whole shape', () => {
  it('tiles the loop with whole square pairs so there is no seam', () => {
    const p = roundedPerimeter(500, 300, 16);
    expect(p).toBeCloseTo(1600 - (8 - 2 * Math.PI) * 16, 5);
    const len = marqueeLength(p, 12);
    expect(len % 24).toBe(0);
    expect(Math.abs(len - p)).toBeLessThanOrEqual(12);
  });
  it('no longer animates each edge on its own', () => {
    const css = readFileSync(new URL('../styles/pro-v4.css', import.meta.url), 'utf8');
    expect(css).not.toContain('pro-frame__edge');
    expect(css).toContain('@keyframes pro-lap');
    expect(css).toMatch(/prefers-reduced-motion: no-preference\) \{\s*[^}]*\.pro-frame__dash \{ animation: pro-lap/);
  });
});

describe('sign in, then back to ayna Pro', () => {
  const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  it('saves where she was, the feature and the plan, and forgets it after 30 minutes', () => {
    const s = store();
    saveProResume({ path: '/library/endometriosis-basics', proFeature: 'reads', plan: 'month' }, s, 1000);
    expect(peekProResume(s, 2000)).toMatchObject({ path: '/library/endometriosis-basics', proFeature: 'reads', plan: 'month' });
    expect(peekProResume(s, 1000 + RESUME_MAX_AGE_MS + 1)).toBe(null);
    expect(s.getItem(RESUME_KEY)).toBe(null);
  });
  it('never saves an off-site path', () => {
    const s = store();
    saveProResume({ path: '//evil.example/x' }, s);
    expect(s.getItem(RESUME_KEY)).toBe(null);
  });
  it('re-opens the sheet where she was, or goes back there first, once', () => {
    expect(resumeStep({ path: '/library/a', tries: 0 }, '/library/a')).toBe('open');
    expect(resumeStep({ path: '/library/a', tries: 0 }, '/welcome')).toBe('navigate');
    expect(resumeStep({ path: '/library/a', tries: 1 }, '/welcome')).toBe('open');
    expect(resumeStep({ path: '/pro', tries: 0 }, '/you')).toBe('navigate');
    expect(resumeStep({ path: '/pro', tries: 1 }, '/you')).toBe('drop');
    expect(resumeStep(null, '/you')).toBe(null);
  });
  it('/pro sends signed-out buyers to sign in with a saved return to /pro', () => {
    const js = readFileSync(new URL('../../public/pro-pay.js', import.meta.url), 'utf8');
    expect(js).toContain("const RESUME = 'ayna.returnTo'");
    expect(js).toContain("path: '/pro'");
    expect(js).toContain('selectPlan(resumed.plan)');
  });
});

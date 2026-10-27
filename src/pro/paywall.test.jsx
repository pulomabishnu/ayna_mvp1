import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FREE_FEATURES, PRO_FEATURES } from './features.js';
import { proFeatureName, proLimitFeature, registerProPaywallHost } from './paywall.js';
import ProLock from '../components/ProLock.jsx';
import { PLANS, PRO_GROUPS, proGroups } from './plans.js';

const proPage = readFileSync(new URL('../../public/pro.html', import.meta.url), 'utf8');
const proApi = readFileSync(new URL('../../api/pro.js', import.meta.url), 'utf8');

describe('the one locked state', () => {
  it('frames the lock in the checker, names the feature and has one Get ayna Pro button and a quiet Not now', () => {
    const html = renderToStaticMarkup(<ProLock feature="reads" />);
    expect(html).toContain('pro-frame__edge is-top');
    expect(html).toContain('Get ayna Pro to unlock');
    expect(html).toContain('More ayna Reads');
    expect(html.match(/class="pro-lock__cta"/g)).toHaveLength(1);
    expect(html).toContain('Not now');
  });
  it('in the native app still shows the lock and opens the sheet, whose button goes to the website', () => {
    const html = renderToStaticMarkup(<ProLock feature="wearables" native />);
    expect(html).toContain('pro-lock__cta');
    expect(html).toContain('Already a Pro member?');
    const sheet = readFileSync(new URL('../components/SubscriptionPaywallModal.jsx', import.meta.url), 'utf8');
    expect(sheet).toContain('Capacitor.isNativePlatform()');
    expect(sheet).toContain('ayna Pro is available on the web for now.');
    expect(sheet).toContain('https://www.aynahealth.co/pro');
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

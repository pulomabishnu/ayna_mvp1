import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { FREE_FEATURES, PRO_FEATURES } from './features.js';
import { proFeatureName, proLimitFeature, registerProPaywallHost } from './paywall.js';
import ProLock from '../components/ProLock.jsx';
import { PLANS, benefitRows } from './plans.js';

const proPage = readFileSync(new URL('../../public/pro.html', import.meta.url), 'utf8');
const proApi = readFileSync(new URL('../../api/pro.js', import.meta.url), 'utf8');

describe('the one locked state', () => {
  it('frames the lock in the checker, names the feature and has one Get ayna Pro button and a quiet Not now', () => {
    const html = renderToStaticMarkup(<ProLock feature="reads" />);
    expect(html).toContain('pro-frame__edge is-top');
    expect(html).toContain('Get ayna Pro to unlock');
    expect(html).toContain('Unlimited Reads');
    expect(html.match(/class="pro-lock__cta"/g)).toHaveLength(1);
    expect(html).toContain('Not now');
  });
  it('never offers a purchase inside the native app', () => {
    const html = renderToStaticMarkup(<ProLock feature="wearables" native />);
    expect(html).not.toContain('pro-lock__cta');
    expect(html).toContain('Already a Pro member?');
  });
  it('names gates from the Pro features list', () => {
    expect(proFeatureName('trial')).toBe('More advanced tracking');
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
  it('lists only available features as included, the tapped one first', () => {
    const rows = benefitRows('appointment');
    expect(rows[0].id).toBe('appointment');
    expect(rows.every((f) => f.stage === 'available')).toBe(true);
    expect(benefitRows('insights').some((f) => f.id === 'insights')).toBe(false);
  });
  it('shows /pro included rows from available features and coming ones from evolving features', () => {
    for (const f of PRO_FEATURES.filter((x) => x.stage === 'evolving')) expect(proPage).toContain(f.label);
    const included = proPage.slice(proPage.indexOf('class="pro-rows"'), proPage.indexOf('</ul>', proPage.indexOf('class="pro-rows"')));
    const labels = [...included.matchAll(/<b>([^<]+)<\/b>/g)].map((m) => m[1]);
    const available = PRO_FEATURES.filter((x) => x.stage === 'available').map((x) => x.label);
    expect(labels.length).toBeGreaterThan(3);
    for (const label of labels) expect(available).toContain(label);
    expect(proPage).toContain('$45');
    expect(proPage).toContain('$4.99');
    expect(FREE_FEATURES).toContain('1 ecosystem update per month');
    expect(proPage).not.toMatch(/—/);
  });
  it('returns checkout to /pro, which confirms and takes her back', () => {
    expect(proApi).toContain('/pro?checkout=success');
    expect(proApi).toContain('/pro?checkout=canceled');
  });
});

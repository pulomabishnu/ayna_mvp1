// The consent banner's buttons stay equal, the footer's "Privacy choices"
// reopens the banner, and opted-in analytics include products but never
// search text, health details or page titles (2026-11-10).
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { openPrivacyChoices, PRIVACY_CHOICES_EVENT } from './analyticsConsent';
import { sanitizeEventPayload, scrubUrl } from './analyticsSanitize';

const source = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const banner = source('../components/ConsentBanner.jsx');
const footer = source('../components/SiteFooter.jsx');
const css = source('../index.css');

afterEach(() => vi.unstubAllGlobals());

describe('consent banner buttons', () => {
  it('"Keep off" and "Turn on" are the same element type, class and style', () => {
    const actions = banner.slice(banner.indexOf('className="consent-banner__actions"'));
    const buttons = [...actions.matchAll(/<button([\s\S]*?)>\s*(Keep off|Turn on)\s*<\/button>/g)];
    expect(buttons.map((b) => b[2])).toEqual(['Keep off', 'Turn on']);
    for (const [, attrs] of buttons) {
      // No per-button class or inline style that could make one stand out.
      expect(attrs).not.toMatch(/className=|style=/);
    }
    // Equal columns in both the desktop and phone layouts.
    const rules = [...css.matchAll(/\.consent-banner__actions\s*\{[^}]*\}/g)].map((m) => m[0]);
    expect(rules.length).toBeGreaterThanOrEqual(2);
    for (const rule of rules) expect(rule).toContain('grid-template-columns: 1fr 1fr');
    // No rule styles one button differently from the other.
    expect(css).not.toMatch(/consent-(accept|decline)|consent-banner__actions button:(first|last|nth)-/);
  });

  it('closing the banner keeps analytics off', () => {
    expect(banner).toMatch(/className="consent-banner__close"[\s\S]{0,200}onClick=\{keepAnalyticsOff\}/);
  });
});

describe('Privacy choices link', () => {
  it('the website footer has "Privacy choices" and it reopens the banner', () => {
    expect(footer).toContain('onClick={openPrivacyChoices}>Privacy choices</button>');
    expect(banner).toContain('window.addEventListener(PRIVACY_CHOICES_EVENT, reopen)');
  });

  it('openPrivacyChoices sends the event the banner listens for', () => {
    const target = new EventTarget();
    const heard = vi.fn();
    target.addEventListener(PRIVACY_CHOICES_EVENT, heard);
    vi.stubGlobal('window', target);
    openPrivacyChoices();
    expect(heard).toHaveBeenCalledTimes(1);
  });

  it('a visitor with Global Privacy Control sees "Opt-out request honored", not a Turn on button', () => {
    const gpcBranch = banner.slice(banner.indexOf('if (isGpcActive() || !ph)'), banner.indexOf('aria-label="Analytics choice"'));
    expect(gpcBranch).toContain('Opt-out request honored.');
    expect(gpcBranch).not.toContain('Turn on');
  });
});

describe('what opted-in analytics include', () => {
  const event = () => ({
    event: 'product_retailer_clicked',
    properties: {
      productId: 'p-monistat-7', product_name: 'Monistat 7', brand: 'Monistat',
      category: 'yeast infection', condition: 'Endometriosis', lifeStage: 'pregnant',
      query: 'yeast infection itching', title: 'Monistat 7 by Monistat: yeast infection treatment | ayna',
      $current_url: 'https://www.aynahealth.co/product/p-monistat-7?q=yeast+infection&category=vaginal-health',
    },
  });

  it('opted-in visitors send which product, nothing else health-related', () => {
    const out = sanitizeEventPayload(event(), {}, { allowProducts: true });
    expect(out.properties).toMatchObject({ productId: 'p-monistat-7', product_name: 'Monistat 7', brand: 'Monistat' });
    expect(out.properties.$current_url).toBe('https://www.aynahealth.co/product/p-monistat-7');
    for (const key of ['category', 'condition', 'lifeStage', 'query', 'title']) expect(out.properties[key]).toBeUndefined();
    expect(JSON.stringify(out)).not.toMatch(/itching|Endometriosis|pregnant|vaginal-health|treatment/i);
  });

  it('everyone else sends no product at all', () => {
    const out = sanitizeEventPayload(event());
    expect(JSON.stringify(out)).not.toMatch(/monistat|yeast|Endometriosis|pregnant/i);
    expect(out.properties.$current_url).toBe('https://www.aynahealth.co/product');
  });

  it('page titles and shared-answer codes are never sent, opted in or not', () => {
    for (const allowProducts of [false, true]) {
      const out = sanitizeEventPayload({ event: '$pageview', properties: { title: 'Is spotting after sex normal? | ayna', $current_url: 'https://www.aynahealth.co/a/Ab12Cd34Ef' } }, {}, { allowProducts });
      expect(out.properties.title).toBeUndefined();
      expect(out.properties.$current_url).toBe('https://www.aynahealth.co/a');
    }
    expect(scrubUrl('/community/topic/pcos', { allowProducts: true })).toBe('/community/topic');
  });
});

// Product id, name and brand on the three product events go to PostHog only
// for visitors who turned analytics on; the Buy Now counter sends only an id.
import { readFileSync } from 'node:fs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { productIdentity, countBuyClick } from './productEventProps.js';
import { cleanProps, trackCardViewed, setAnalyticsClient } from './analyticsEvents.js';
import { sanitizeEventPayload } from './analyticsSanitize.js';
import { applyConsentTier } from './essentialAnalytics.js';

const monistat = { id: 'p-monistat-7', name: 'Monistat 7', brand: 'Monistat', category: 'vaginal-health' };
const src = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

/** What main.jsx before_send does, for a given consent state. */
function send(event, { optedIn, stored }) {
  const clean = sanitizeEventPayload(event, { platform: 'web' }, { allowProducts: optedIn });
  return applyConsentTier(clean, { optedIn, gpc: false, stored });
}

afterEach(() => { vi.unstubAllGlobals(); setAnalyticsClient(null); });

describe('productIdentity', () => {
  it('gives id, name and brand', () => {
    expect(productIdentity(monistat)).toEqual({ productId: 'p-monistat-7', productName: 'Monistat 7', brand: 'Monistat' });
  });
  it('leaves out what is missing and trims long or odd text', () => {
    expect(productIdentity({ id: 'x1' })).toEqual({ productId: 'x1' });
    expect(productIdentity({ id: 'x1', name: `a\n\tb ${'n'.repeat(300)}` }).productName).toMatch(/^a b n+$/);
    expect(productIdentity({ id: 'x1', name: 'n'.repeat(300) }).productName).toHaveLength(120);
    expect(productIdentity(null)).toEqual({});
  });
});

describe('the three product events', () => {
  const events = () => [
    { event: 'product_card_viewed', properties: cleanProps({ surface: 'web', where: 'shop', product_id: monistat.id, product_name: monistat.name, brand: monistat.brand, position: 0 }) },
    { event: 'product_card_opened', properties: { ...productIdentity(monistat), category: monistat.category, source: 'browse' } },
    { event: 'product_buy_now_clicked', properties: { ...productIdentity(monistat), category: monistat.category } },
  ];

  it('opted-in visitors send product id, name and brand on all three', () => {
    for (const ev of events()) {
      const out = send(ev, { optedIn: true, stored: 'granted' });
      const p = out.properties;
      expect(p.product_id || p.productId, ev.event).toBe('p-monistat-7');
      expect(p.product_name || p.productName, ev.event).toBe('Monistat 7');
      expect(p.brand, ev.event).toBe('Monistat');
      expect(p.category, ev.event).toBeUndefined();
    }
  });

  it('undecided and declined visitors send none of them', () => {
    for (const stored of [undefined, 'denied']) {
      for (const ev of events()) expect(send(ev, { optedIn: false, stored }), `${ev.event} ${stored}`).toBeNull();
    }
  });

  it('even if an event slipped through without consent, product fields are stripped', () => {
    for (const ev of events()) {
      const out = sanitizeEventPayload(ev, {}, { allowProducts: false });
      expect(JSON.stringify(out)).not.toMatch(/monistat/i);
    }
  });

  it('card views read name and brand from the card', () => {
    const capture = vi.fn();
    setAnalyticsClient({ capture });
    trackCardViewed({ surface: 'web', where: 'test_where', product_id: 'p-monistat-7', product_name: 'Monistat 7', brand: 'Monistat', position: 2 });
    expect(capture).toHaveBeenCalledWith('product_card_viewed', { surface: 'web', where: 'test_where', product_id: 'p-monistat-7', product_name: 'Monistat 7', brand: 'Monistat', position: 2 });
    expect(src('../components/explore/useCardViews.js')).toMatch(/data-pname[\s\S]*data-pbrand/);
    for (const card of ['../components/ProductCard.jsx', '../mobile/components/ProductCard.jsx', '../components/cards/ServiceCard.jsx']) {
      expect(src(card), card).toMatch(/data-pid=\{\w+\.id\} data-pname=\{\w+\.name \|\| undefined\} data-pbrand=\{\w+\.brand \|\| undefined\}/);
    }
  });

  it('every Buy button sends identity and counts the click', () => {
    const files = ['../components/ProductModal.jsx', '../mobile/components/ProductCard.jsx', '../mobile/components/ProductQuick.jsx',
      '../mobile/components/ProductSheet.jsx', '../mobile/components/RoutinePlan.jsx', '../mobile/screens/ProductDetailScreen.jsx'];
    for (const f of files) {
      const s = src(f);
      const n = (s.match(/'product_buy_now_clicked'/g) || []).length;
      expect(n, f).toBeGreaterThan(0);
      expect((s.match(/countBuyClick\(/g) || []).length, f).toBe(n);
      expect(s, f).toMatch(/'product_buy_now_clicked', \{\s*(\/\/.*\s*)?\.\.\.productIdentity\(product\)/);
    }
  });
});

describe('countBuyClick (anonymous counter)', () => {
  it('sends only the product id to /api/go, with no cookies or referrer', () => {
    const fetchMock = vi.fn(() => Promise.resolve());
    vi.stubGlobal('fetch', fetchMock);
    countBuyClick('p-monistat-7');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/go');
    expect(init).toMatchObject({ method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true, body: '{"p":"p-monistat-7"}' });
    expect(src('./productEventProps.js')).not.toMatch(/sendBeacon\(/);
  });
  it('never throws, even if the request fails', () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    expect(() => countBuyClick('p-monistat-7')).not.toThrow();
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('x'); }));
    expect(() => countBuyClick('p-monistat-7')).not.toThrow();
  });
  it('ignores missing or malformed ids', () => {
    const fetchMock = vi.fn(() => Promise.resolve());
    vi.stubGlobal('fetch', fetchMock);
    countBuyClick(undefined); countBuyClick(''); countBuyClick('../etc'); countBuyClick('a b');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

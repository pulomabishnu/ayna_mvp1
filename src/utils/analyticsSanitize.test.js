import { describe, it, expect } from 'vitest';
import { scrubUrl, sanitizeAnalyticsObject, sanitizeEventPayload } from './analyticsSanitize.js';

describe('scrubUrl', () => {
  it('drops search text from Shop and Community URLs', () => {
    expect(scrubUrl('https://www.aynahealth.co/shop?q=yeast%20infection')).toBe('https://www.aynahealth.co/shop');
    expect(scrubUrl('https://www.aynahealth.co/community?tab=topics&q=endo')).toBe('https://www.aynahealth.co/community?tab=topics');
  });

  it('drops every free-text param name, case-insensitive', () => {
    const out = scrubUrl('https://x.co/a?search=a&s=b&Query=c&term=d&keep=1');
    expect(out).toBe('https://x.co/a?keep=1');
  });

  it('drops key=value hashes (auth tokens) but keeps plain anchors', () => {
    expect(scrubUrl('https://x.co/cb#access_token=abc&type=signup')).toBe('https://x.co/cb');
    expect(scrubUrl('https://x.co/read#section-2')).toBe('https://x.co/read#section-2');
  });

  it('handles relative paths and leaves other strings alone', () => {
    expect(scrubUrl('/shop?q=pcos&category=gut')).toBe('/shop?category=gut');
    expect(scrubUrl('not a url ?q=x')).toBe('not a url ?q=x');
    expect(scrubUrl('https://x.co/shop')).toBe('https://x.co/shop');
  });
});

describe('sanitizeEventPayload', () => {
  it('scrubs URL properties, person properties and sensitive keys', () => {
    const event = {
      event: '$pageview',
      properties: {
        $current_url: 'https://www.aynahealth.co/shop?q=heavy%20period',
        $referrer: 'https://www.aynahealth.co/community?q=vaginismus',
        $pathname: '/shop',
        query: 'heavy period',
        queryLength: 12,
      },
      $set_once: {
        $initial_current_url: 'https://www.aynahealth.co/shop?q=hpv',
        $initial_referrer: '$direct',
      },
      $set: { $current_url: 'https://www.aynahealth.co/community?q=ibs' },
    };
    const out = sanitizeEventPayload(event, { platform: 'web' });
    const sent = JSON.stringify(out);
    for (const word of ['heavy', 'vaginismus', 'hpv', 'ibs']) expect(sent).not.toContain(word);
    expect(out.properties.platform).toBe('web');
    expect(out.properties.$current_url).toBe('https://www.aynahealth.co/shop');
    expect(out.properties.queryLength).toBe(12);
    expect(out.$set_once.$initial_referrer).toBe('$direct');
  });

  it('cleans nested URL keys too', () => {
    expect(sanitizeAnalyticsObject({ a: { share_url: '/c?q=x' } })).toEqual({ a: { share_url: '/c' } });
  });
});

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
    expect(scrubUrl('/shop?q=pcos&category=gut')).toBe('/shop');
    expect(scrubUrl('not a url ?q=x')).toBe('not a url ?q=x');
    expect(scrubUrl('https://x.co/shop')).toBe('https://x.co/shop');
    expect(scrubUrl('https://www.aynahealth.co/product/p-ovulation-test?tag=ttc')).toBe('https://www.aynahealth.co/product');
    expect(scrubUrl('/library/pregnancy-basics')).toBe('/library');
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

  it('strips health-derived product, stage and category identifiers before sending', () => {
    const input = {
      event: 'product_retailer_clicked',
      properties: { productId:'p-pregnancy-test',product_id:'p-pregnancy-test',
        category:'fertility', brand:'PrivateBrand', condition:'Endometriosis',
        lifeStage:'pregnant', source:'shop', platform:'ios_app', item_count:2,
        $current_url:'https://www.aynahealth.co/product/p-pregnancy-test?category=fertility',
        nested:{ needId:'fertility.ttc', productName:'Pregnancy Test' } },
      $set: { product_id:'p-ovulation-test' },
    };
    const after = sanitizeEventPayload(input);
    const text=JSON.stringify(after);
    for(const word of ['p-pregnancy-test','p-ovulation-test','fertility','PrivateBrand','Endometriosis','pregnant','Pregnancy Test'])
      expect(text).not.toContain(word);
    expect(after.properties.platform).toBe('ios_app');
    expect(after.properties.item_count).toBe(2);
    expect(after.properties.$current_url).toBe('https://www.aynahealth.co/product');
  });

  it('drops event names that directly identify a sensitive health interest', () => {
    expect(sanitizeEventPayload({event:'pregnancy_test_opened',properties:{platform:'web'}})).toBeNull();
    expect(sanitizeEventPayload({event:'question_submitted',properties:{platform:'web'}})?.event).toBe('question_submitted');
  });

  it('cleans nested URL keys too', () => {
    expect(sanitizeAnalyticsObject({ a: { share_url: '/c?q=x' } })).toEqual({ a: { share_url: '/c' } });
  });
});

describe('gift box links', () => {
  it('never sends a winner link token', async () => {
    const { scrubUrl } = await import('./analyticsSanitize.js');
    expect(scrubUrl('https://www.aynahealth.co/gift/AbCdEfGhIjKlMnOpQrStUvWx')).toBe('https://www.aynahealth.co/gift/link');
    expect(scrubUrl('/gift/AbCdEfGhIjKlMnOpQrStUvWx')).toBe('/gift/link');
    expect(scrubUrl('/gift')).toBe('/gift');
  });
});

/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const rateLimitMock = vi.fn(async () => ({ ok: true }));
const redisGet = vi.fn(async () => null);
const redisSet = vi.fn(async () => 'OK');
const matchShopifyProductMock = vi.fn(async () => null);
const fetchOgImageMock = vi.fn(async () => null);
const lookupDsldProductMock = vi.fn(async () => null);
const lookupSerperImageMock = vi.fn(async () => null);

vi.mock('./_rateLimit.js', () => ({
  rateLimit: (...args) => rateLimitMock(...args),
  getClientIp: () => '203.0.113.9',
}));
vi.mock('@upstash/redis', () => ({
  Redis: class {
    get(...args) { return redisGet(...args); }
    set(...args) { return redisSet(...args); }
  },
}));
vi.mock('./_shopifyProductMatch.js', () => ({
  matchShopifyProduct: (...args) => matchShopifyProductMock(...args),
}));
vi.mock('./_ogImageFetch.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchOgImage: (...args) => fetchOgImageMock(...args),
  };
});
// product-image.js dynamically imports this (not a static top-level import,
// so the whole heavy llm-recommendations.js module stays out of this
// lightweight, high-traffic endpoint's cold start) — vi.mock still
// intercepts a dynamic import() of the same path.
vi.mock('./llm-recommendations.js', () => ({
  lookupDsldProduct: (...args) => lookupDsldProductMock(...args),
}));
vi.mock('./_serperImageSearch.js', () => ({
  lookupSerperImage: (...args) => lookupSerperImageMock(...args),
}));

async function loadHandler() {
  vi.resetModules();
  const mod = await import('./product-image.js');
  return mod.default;
}

beforeEach(() => {
  rateLimitMock.mockReset().mockResolvedValue({ ok: true });
  redisGet.mockReset().mockResolvedValue(null);
  redisSet.mockReset().mockResolvedValue('OK');
  matchShopifyProductMock.mockReset().mockResolvedValue(null);
  fetchOgImageMock.mockReset().mockResolvedValue(null);
  lookupDsldProductMock.mockReset().mockResolvedValue(null);
  lookupSerperImageMock.mockReset().mockResolvedValue(null);
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.SERPER_API_KEY;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('product-image', () => {
  it('rejects non-GET methods', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'POST', query: {}, headers: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('400s on a missing name', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: {}, headers: {} }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'missing_name' });
  });

  it('does not echo CORS headers when the origin is not in ALLOWED_ORIGINS', async () => {
    process.env.ALLOWED_ORIGINS = 'https://ayna.health';
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'x' }, headers: { origin: 'https://evil.example.com' } }, res);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('echoes the origin only when it is explicitly allowed', async () => {
    process.env.ALLOWED_ORIGINS = 'https://ayna.health';
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'cup' }, headers: { origin: 'https://ayna.health' } }, res);
    expect(res.headers['access-control-allow-origin']).toBe('https://ayna.health');
  });

  it('skips the URL-based resolvers but still tries DSLD when no official url is given', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: '' });
    expect(matchShopifyProductMock).not.toHaveBeenCalled();
    expect(fetchOgImageMock).not.toHaveBeenCalled();
    expect(lookupDsldProductMock).toHaveBeenCalledWith('DivaCup');
  });

  it('resolves via the DSLD fallback when the URL-based methods find nothing (or there is no url) — the "vitamin c" case', async () => {
    // This is the actual reported bug: most AI-suggested supplements either
    // have no officialUrl at all, or one that doesn't resolve (a brand
    // homepage, not a product page) — DSLD is a URL-independent, name-based
    // fallback that catches exactly this case for supplements.
    lookupDsldProductMock.mockResolvedValue({ imageUrl: 'https://dsld.od.nih.gov/label-images/12345.jpg' });
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'Thorne Vitamin C-1000', brand: 'Thorne' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.imageUrl).toBe('https://dsld.od.nih.gov/label-images/12345.jpg');
  });

  it('tries DSLD only after the URL-based methods fail, and does not call it when Shopify already found something', async () => {
    matchShopifyProductMock.mockResolvedValue('https://cdn.shopify.com/found.jpg');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.body.imageUrl).toBe('https://cdn.shopify.com/found.jpg');
    expect(lookupDsldProductMock).not.toHaveBeenCalled();
  });

  it('does not cache a negative result when no url was given, even if DSLD also found nothing', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.body).toEqual({ imageUrl: '' });
    expect(redisSet).not.toHaveBeenCalled();
  });

  it('caches a negative result when a url WAS given but nothing (including DSLD) resolved', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.body).toEqual({ imageUrl: '' });
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringContaining('ayna:img:'),
      '',
      expect.objectContaining({ ex: expect.any(Number) })
    );
  });

  it('rate limits before ever resolving an image', async () => {
    rateLimitMock.mockResolvedValue({ ok: false, retryAfterSec: 42 });
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.statusCode).toBe(429);
    expect(res.headers['retry-after']).toBe('42');
    expect(matchShopifyProductMock).not.toHaveBeenCalled();
  });

  it('returns a cached image without touching the rate limiter or resolvers', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    redisGet.mockResolvedValue('https://cached.example.com/cup.jpg');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: 'https://cached.example.com/cup.jpg', cached: true });
    expect(rateLimitMock).not.toHaveBeenCalled();
    expect(matchShopifyProductMock).not.toHaveBeenCalled();
  });

  it('prefers a Shopify catalog match over og:image, and caches it', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    matchShopifyProductMock.mockResolvedValue('https://cdn.shopify.com/divacup.jpg');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', brand: 'Diva', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.imageUrl).toBe('https://cdn.shopify.com/divacup.jpg');
    expect(fetchOgImageMock).not.toHaveBeenCalled();
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringContaining('ayna:img:'),
      'https://cdn.shopify.com/divacup.jpg',
      expect.objectContaining({ ex: expect.any(Number) })
    );
  });

  it('falls back to og:image when there is no Shopify match', async () => {
    matchShopifyProductMock.mockResolvedValue(null);
    fetchOgImageMock.mockResolvedValue('https://diva.example.com/product-photo.jpg');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.body.imageUrl).toBe('https://diva.example.com/product-photo.jpg');
  });

  it('rejects a logo/banner-looking og:image instead of accepting it as a last resort', async () => {
    matchShopifyProductMock.mockResolvedValue(null);
    fetchOgImageMock.mockResolvedValue('https://diva.example.com/brand-logo.png');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.body.imageUrl).toBe('');
  });

  // Real production bug: Pure Encapsulations' own Shopify catalog resolved
  // every product's image to /cdn/shop/files/pure-encapsulations.svg (the
  // store theme's logo file, not a per-SKU photo) — matchShopifyProduct has
  // no filename check of its own, so a rejected match must still fall
  // through to DSLD rather than giving up on the product entirely.
  it('falls through to DSLD when the Shopify-matched image is the brand logo, not a product photo', async () => {
    matchShopifyProductMock.mockResolvedValue('https://www.pureencapsulations.com/cdn/shop/files/pure-encapsulations.svg');
    lookupDsldProductMock.mockResolvedValue({ imageUrl: 'https://api.ods.od.nih.gov/dsld/s3/pdf/thumbnails/12345.jpg' });
    const handler = await loadHandler();
    const res = mockRes();
    await handler({
      method: 'GET',
      query: { name: 'Pure Encapsulations Calcium Citrate', brand: 'Pure Encapsulations', url: 'https://www.pureencapsulations.com/' },
      headers: {},
    }, res);
    expect(res.body.imageUrl).toBe('https://api.ods.od.nih.gov/dsld/s3/pdf/thumbnails/12345.jpg');
  });

  it('rejects an SVG image from any resolver, even with no bad keyword in the filename', async () => {
    matchShopifyProductMock.mockResolvedValue('https://cdn.shopify.com/s/files/brand.svg');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.body.imageUrl).toBe('');
  });

  // Real production bug: Brightside (a telehealth mental-health service)
  // and Clue (a tracking app) have no physical form to photograph at all —
  // rejecting their brand logo the same way as a supplement/device left
  // them with no image whatsoever. type=digital (set by
  // llm-recommendations.js's enrichProduct for exactly these products) is
  // the signal that a logo IS the correct "photo" here.
  it('accepts a brand-logo og:image for a digital (app/telehealth) product', async () => {
    matchShopifyProductMock.mockResolvedValue(null);
    fetchOgImageMock.mockResolvedValue('https://helloclue.com/brand-logo.png');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({
      method: 'GET',
      query: { name: 'Clue Cycle Tracking App', brand: 'Clue', url: 'https://helloclue.com/', type: 'digital' },
      headers: {},
    }, res);
    expect(res.body.imageUrl).toBe('https://helloclue.com/brand-logo.png');
    expect(fetchOgImageMock).toHaveBeenCalledWith('https://helloclue.com/', true);
  });

  it('still rejects a bare favicon for a digital product — too small/generic even as a logo', async () => {
    matchShopifyProductMock.mockResolvedValue(null);
    fetchOgImageMock.mockResolvedValue('https://helloclue.com/favicon.ico');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({
      method: 'GET',
      query: { name: 'Clue Cycle Tracking App', brand: 'Clue', url: 'https://helloclue.com/', type: 'digital' },
      headers: {},
    }, res);
    expect(res.body.imageUrl).toBe('');
  });

  it('still rejects an SVG brand logo for a physical product (type absent/physical)', async () => {
    matchShopifyProductMock.mockResolvedValue('https://www.pureencapsulations.com/cdn/shop/files/pure-encapsulations.svg');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({
      method: 'GET',
      query: { name: 'Pure Encapsulations Calcium Citrate', brand: 'Pure Encapsulations', url: 'https://www.pureencapsulations.com/' },
      headers: {},
    }, res);
    expect(res.body.imageUrl).toBe('');
  });

  it('returns empty imageUrl (200), not a crash, when resolution throws', async () => {
    matchShopifyProductMock.mockRejectedValue(new Error('ECONNRESET'));
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: '' });
  });

  describe('Serper image search (last resort)', () => {
    it('is tried only after Shopify, og:image, and DSLD all fail', async () => {
      lookupSerperImageMock.mockResolvedValue('https://retailer.example.com/real-product-photo.jpg');
      const handler = await loadHandler();
      const res = mockRes();
      await handler({ method: 'GET', query: { name: 'Tampax Radiant Tampons', brand: 'Tampax', url: 'https://tampax.com/' }, headers: {} }, res);
      expect(res.body.imageUrl).toBe('https://retailer.example.com/real-product-photo.jpg');
      expect(matchShopifyProductMock).toHaveBeenCalled();
      expect(fetchOgImageMock).toHaveBeenCalled();
      expect(lookupDsldProductMock).toHaveBeenCalled();
      expect(lookupSerperImageMock).toHaveBeenCalledWith('Tampax Radiant Tampons', 'Tampax');
    });

    it('resolves a product with NO catalog url at all — the actual AI-search-result case', async () => {
      // No url in the query at all: Shopify/og:image are never attempted
      // (nothing to fetch), DSLD finds nothing (not a supplement), Serper
      // is the only resolver that can work here since it needs just a name.
      lookupSerperImageMock.mockResolvedValue('https://retailer.example.com/we-vibe-chorus.jpg');
      const handler = await loadHandler();
      const res = mockRes();
      await handler({ method: 'GET', query: { name: 'We-Vibe Chorus', brand: 'We-Vibe' }, headers: {} }, res);
      expect(res.body.imageUrl).toBe('https://retailer.example.com/we-vibe-chorus.jpg');
      expect(matchShopifyProductMock).not.toHaveBeenCalled();
      expect(fetchOgImageMock).not.toHaveBeenCalled();
    });

    it('is not called when an earlier resolver already found a real image', async () => {
      matchShopifyProductMock.mockResolvedValue('https://cdn.shopify.com/divacup.jpg');
      const handler = await loadHandler();
      const res = mockRes();
      await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
      expect(res.body.imageUrl).toBe('https://cdn.shopify.com/divacup.jpg');
      expect(lookupSerperImageMock).not.toHaveBeenCalled();
    });

    it('caches a negative result once Serper (with no url needed) has also been tried', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
      process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
      process.env.SERPER_API_KEY = 'test-key'; // negative caching requires Serper to actually be configured
      const handler = await loadHandler();
      const res = mockRes();
      await handler({ method: 'GET', query: { name: 'Nonexistent Product Xyz' }, headers: {} }, res);
      expect(res.body).toEqual({ imageUrl: '' });
      expect(redisSet).toHaveBeenCalledWith(
        expect.stringContaining('ayna:img:'),
        '',
        expect.objectContaining({ ex: expect.any(Number) })
      );
    });
  });
});

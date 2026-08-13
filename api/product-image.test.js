/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const rateLimitMock = vi.fn(async () => ({ ok: true }));
const redisGet = vi.fn(async () => null);
const redisSet = vi.fn(async () => 'OK');
const fetchShopifyProductsMock = vi.fn(async () => null);
const matchProductImageMock = vi.fn(() => null);
const fetchOgImageMock = vi.fn(async () => null);

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
  fetchShopifyProducts: (...args) => fetchShopifyProductsMock(...args),
  matchProductImage: (...args) => matchProductImageMock(...args),
}));
vi.mock('./_ogImageFetch.js', () => ({
  fetchOgImage: (...args) => fetchOgImageMock(...args),
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
  fetchShopifyProductsMock.mockReset().mockResolvedValue(null);
  matchProductImageMock.mockReset().mockReturnValue(null);
  fetchOgImageMock.mockReset().mockResolvedValue(null);
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.ALLOWED_ORIGINS;
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

  it('returns empty imageUrl without resolving anything when no official url is given', async () => {
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: '' });
    expect(fetchShopifyProductsMock).not.toHaveBeenCalled();
    expect(fetchOgImageMock).not.toHaveBeenCalled();
  });

  it('rate limits before ever resolving an image', async () => {
    rateLimitMock.mockResolvedValue({ ok: false, retryAfterSec: 42 });
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.statusCode).toBe(429);
    expect(res.headers['retry-after']).toBe('42');
    expect(fetchShopifyProductsMock).not.toHaveBeenCalled();
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
    expect(fetchShopifyProductsMock).not.toHaveBeenCalled();
  });

  it('prefers a Shopify catalog match over og:image, and caches it', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    fetchShopifyProductsMock.mockResolvedValue([{ title: 'DivaCup Model 1', image: 'https://cdn.shopify.com/divacup.jpg' }]);
    matchProductImageMock.mockReturnValue('https://cdn.shopify.com/divacup.jpg');
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
    fetchShopifyProductsMock.mockResolvedValue(null);
    fetchOgImageMock.mockResolvedValue('https://diva.example.com/product-photo.jpg');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.body.imageUrl).toBe('https://diva.example.com/product-photo.jpg');
  });

  it('rejects an og:image that looks like a logo or social-share asset', async () => {
    fetchShopifyProductsMock.mockResolvedValue(null);
    fetchOgImageMock.mockResolvedValue('https://diva.example.com/brand-logo.png');
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.body).toEqual({ imageUrl: '' });
  });

  it('returns empty imageUrl (200), not a crash, when resolution throws', async () => {
    fetchShopifyProductsMock.mockRejectedValue(new Error('ECONNRESET'));
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', url: 'https://diva.example.com' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: '' });
  });
});

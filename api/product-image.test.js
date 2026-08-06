/* global process */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockRes } from './_test-helpers.js';

const realFetch = globalThis.fetch;
const rateLimitMock = vi.fn(async () => ({ ok: true }));
const redisGet = vi.fn(async () => null);
const redisSet = vi.fn(async () => 'OK');

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

async function loadHandler() {
  vi.resetModules();
  const mod = await import('./product-image.js');
  return mod.default;
}

beforeEach(() => {
  rateLimitMock.mockReset().mockResolvedValue({ ok: true });
  redisGet.mockReset().mockResolvedValue(null);
  redisSet.mockReset().mockResolvedValue('OK');
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.SERPER_API_KEY;
  delete process.env.ALLOWED_ORIGINS;
});

afterEach(() => {
  globalThis.fetch = realFetch;
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
    process.env.SERPER_API_KEY = '';
    const handler = await loadHandler();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'cup' }, headers: { origin: 'https://ayna.health' } }, res);
    expect(res.headers['access-control-allow-origin']).toBe('https://ayna.health');
  });

  it('returns empty imageUrl without calling Serper when no API key is configured', async () => {
    const handler = await loadHandler();
    globalThis.fetch = vi.fn();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: '' });
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('rate limits before ever calling Serper', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    rateLimitMock.mockResolvedValue({ ok: false, retryAfterSec: 42 });
    const handler = await loadHandler();
    globalThis.fetch = vi.fn();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.statusCode).toBe(429);
    expect(res.headers['retry-after']).toBe('42');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('returns a cached image without touching the rate limiter or Serper', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    process.env.SERPER_API_KEY = 'test-key';
    redisGet.mockResolvedValue('https://cached.example.com/cup.jpg');
    const handler = await loadHandler();
    globalThis.fetch = vi.fn();
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: 'https://cached.example.com/cup.jpg', cached: true });
    expect(rateLimitMock).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fetches from Serper on a cache miss and writes the result back to cache', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    process.env.SERPER_API_KEY = 'test-key';
    const handler = await loadHandler();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ images: [{ imageUrl: 'https://serper.example.com/img.jpg' }] }),
      text: async () => '',
    });
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup', brand: 'Diva' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.imageUrl).toBe('https://serper.example.com/img.jpg');
    expect(redisSet).toHaveBeenCalledWith(
      expect.stringContaining('ayna:img:'),
      'https://serper.example.com/img.jpg',
      expect.objectContaining({ ex: expect.any(Number) })
    );
  });

  it('rejects a non-https image URL from Serper', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    const handler = await loadHandler();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ images: [{ imageUrl: 'http://insecure.example.com/img.jpg' }] }),
      text: async () => '',
    });
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.body.imageUrl).toBe('');
  });

  it('returns empty imageUrl (200), not an error, when Serper responds non-2xx', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    const handler = await loadHandler();
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 402, text: async () => 'quota exceeded' });
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: '' });
  });

  it('returns empty imageUrl (200), not a crash, on a network failure', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    const handler = await loadHandler();
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    const res = mockRes();
    await handler({ method: 'GET', query: { name: 'DivaCup' }, headers: {} }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ imageUrl: '' });
  });
});

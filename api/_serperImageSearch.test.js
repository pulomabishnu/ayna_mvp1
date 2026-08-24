/* global process, global */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const rateLimitMock = vi.fn(async () => ({ ok: true }));
vi.mock('./_rateLimit.js', () => ({
  rateLimit: (...args) => rateLimitMock(...args),
}));

async function loadModule() {
  vi.resetModules();
  return import('./_serperImageSearch.js');
}

beforeEach(() => {
  rateLimitMock.mockReset().mockResolvedValue({ ok: true });
  vi.stubGlobal('fetch', vi.fn());
  delete process.env.SERPER_API_KEY;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('lookupSerperImage', () => {
  it('returns null immediately when no API key is configured, without ever fetching', async () => {
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('DivaCup', 'Diva');
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns null for an empty name+brand', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('', '');
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('picks the first real-sized, non-logo result', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          { imageUrl: 'https://brand.com/logo.png', imageWidth: 400, imageHeight: 400 },
          { imageUrl: 'https://retailer.com/icon.png', imageWidth: 32, imageHeight: 32 },
          { imageUrl: 'https://retailer.com/product-photo.jpg', imageWidth: 800, imageHeight: 800 },
        ],
      }),
    });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('Tampax Radiant Tampons', 'Tampax');
    expect(result).toBe('https://retailer.com/product-photo.jpg');
    const [url, opts] = fetch.mock.calls[0];
    expect(url).toBe('https://google.serper.dev/images');
    expect(opts.headers['X-API-KEY']).toBe('test-key');
    expect(JSON.parse(opts.body).q).toBe('Tampax Tampax Radiant Tampons');
  });

  it('rejects a small (icon-sized) image even with no bad keyword in the filename', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ images: [{ imageUrl: 'https://brand.com/thumb.jpg', imageWidth: 64, imageHeight: 64 }] }),
    });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('Some Product', 'Some Brand');
    expect(result).toBeNull();
  });

  it('returns null when the daily budget is exhausted, without ever fetching', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    rateLimitMock.mockResolvedValue({ ok: false, retryAfterSec: 3600 });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('DivaCup', 'Diva');
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns null (not a throw) when Serper is out of credits (400)', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({ ok: false, status: 400 });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('DivaCup', 'Diva');
    expect(result).toBeNull();
  });

  it('returns null (not a throw) on a network error', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockRejectedValue(new Error('ECONNRESET'));
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('DivaCup', 'Diva');
    expect(result).toBeNull();
  });

  it('returns null when there are no image results', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({ ok: true, json: async () => ({ images: [] }) });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('Nonexistent Product Xyz', '');
    expect(result).toBeNull();
  });
});

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

  it('picks the best-scoring real-sized, non-logo, title-relevant result', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          { imageUrl: 'https://brand.com/logo.png', imageWidth: 400, imageHeight: 400, title: 'Tampax Radiant Tampons logo' },
          { imageUrl: 'https://retailer.com/icon.png', imageWidth: 32, imageHeight: 32, title: 'Tampax Radiant Tampons icon' },
          { imageUrl: 'https://retailer.com/unrelated.jpg', imageWidth: 800, imageHeight: 800, title: 'Completely Different Product' },
          { imageUrl: 'https://retailer.com/product-photo.jpg', imageWidth: 800, imageHeight: 800, title: 'Tampax Radiant Tampons Regular Absorbency, 28 ct' },
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
      json: async () => ({ images: [{ imageUrl: 'https://brand.com/thumb.jpg', imageWidth: 64, imageHeight: 64, title: 'Some Brand Some Product' }] }),
    });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('Some Product', 'Some Brand');
    expect(result).toBeNull();
  });

  // Real production bug: Google Image Search always returns its best-effort
  // top hits even when nothing in the index is a real match for the exact
  // named product. Querying "Happi Pelvic Floor App" returned "Happy Pelvis
  // Pelvic Floor Therapy" (an unrelated clinic) as its top image result —
  // confirmed live before fixing. The old code trusted the first
  // size/keyword-passing hit unconditionally.
  it("rejects a weak title match instead of trusting Google's top hit blindly", async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          // Filenames deliberately clean (no logo/icon/etc keyword) so this
          // test isolates the title-relevance threshold, not the keyword filter.
          { imageUrl: 'https://happypelvistherapy.com/clinic-photo.jpg', imageWidth: 500, imageHeight: 500, title: 'Happy Pelvis Pelvic Floor Therapy' },
          { imageUrl: 'https://appbrain.com/screenshot.jpg', imageWidth: 764, imageHeight: 400, title: 'Happy Floor: Pelvic Exercises for iPhone - Free App Download' },
        ],
      }),
    });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('Happi Pelvic Floor App', 'Happi');
    expect(result).toBeNull();
  });

  it('still accepts a genuine match among multiple candidates, picking the best-scoring one', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [
          { imageUrl: 'https://a.com/weak.jpg', imageWidth: 500, imageHeight: 500, title: 'Pelvic Floor Therapy Clinic' },
          { imageUrl: 'https://b.com/strong.jpg', imageWidth: 500, imageHeight: 500, title: 'We-Vibe Chorus Purple Couples Vibrator' },
        ],
      }),
    });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('We-Vibe Chorus', 'We-Vibe');
    expect(result).toBe('https://b.com/strong.jpg');
  });

  // Real production case: chakrubs.com's own genuine listing for exactly
  // this product scored below threshold (2/3, not 3/3) purely because the
  // query says "Wand" (singular) and the real title says "Wands" (plural)
  // — a false negative on top of the false-positive risk the brand gate
  // guards against. Confirmed live before fixing.
  it('matches "wand" against "wands" (plural) instead of rejecting a genuine match', async () => {
    process.env.SERPER_API_KEY = 'test-key';
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        images: [{ imageUrl: 'https://chakrubs.com/cdn/shop/files/P4A8441.jpg', imageWidth: 1280, imageHeight: 1280, title: 'Crystal Pleasure Wands – Chakrubs' }],
      }),
    });
    const { lookupSerperImage } = await loadModule();
    const result = await lookupSerperImage('Chakrubs Crystal Wand', 'Chakrubs');
    expect(result).toBe('https://chakrubs.com/cdn/shop/files/P4A8441.jpg');
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

import { describe, it, expect, afterEach, vi } from 'vitest';
import handler from './dsld-search.js';
import { mockRes } from './_test-helpers.js';

const realFetch = globalThis.fetch;

function dsldOk(hits, total) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ hits: { hits, total: { value: total ?? hits.length } } }),
  };
}

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe('dsld-search', () => {
  it('rejects non-GET methods', async () => {
    const res = mockRes();
    await handler({ method: 'POST', query: {} }, res);
    expect(res.statusCode).toBe(405);
  });

  it('400s on a missing or too-short query', async () => {
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'a' } }, res);
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: 'missing_query' });
  });

  it('maps a DSLD hit into the client product shape, with empty (not fabricated) safety fields', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(dsldOk([
      {
        _id: 'abc123',
        _source: {
          brandName: 'Nature Made',
          productName: 'Magnesium Glycinate',
          dietaryIngredients: [{ ingredientName: 'Magnesium' }, { name: 'Glycine' }],
          imageUrl: 'https://example.com/img.jpg',
        },
      },
    ]));
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'magnesium' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(1);
    const p = res.body.products[0];
    expect(p.name).toBe('Magnesium Glycinate');
    expect(p.brand).toBe('Nature Made');
    expect(p.dsldId).toBe('abc123');
    expect(p.dsldVerified).toBe(true);
    expect(p.image).toBe('https://example.com/img.jpg');
    // Never assert a recall check that never happened.
    expect(p.safety.recalls).toBe('');
  });

  it('drops a non-https imageUrl rather than passing it through', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(dsldOk([
      { _id: '1', _source: { productName: 'Vitamin D', imageUrl: 'http://insecure.example.com/x.jpg' } },
    ]));
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'vitamin d' } }, res);
    expect(res.body.products[0].image).toBe('');
  });

  it('filters out hits with no usable name', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(dsldOk([
      { _id: '1', _source: {} },
      { _id: '2', _source: { productName: 'Real Supplement' } },
    ]));
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'supplement' } }, res);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toBe('Real Supplement');
  });

  it('clamps a negative limit instead of forwarding it to NIH as a raw negative size', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(dsldOk([]));
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'biotin', limit: '-500' } }, res);
    const calledUrl = globalThis.fetch.mock.calls[0][0];
    expect(calledUrl).toContain('size=1');
    expect(calledUrl).not.toContain('size=-500');
  });

  it('handles an HTML response from NIH without throwing JSON parse errors', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
      text: async () => '<!doctype html><html>temporary upstream page</html>',
    });

    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'magnesium' } }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.error).toBe('DSLD non_json_response');
  });

  it('returns an empty (200) result, not an error, when NIH responds non-2xx', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'zinc' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toEqual([]);
    expect(res.body.error).toMatch(/503/);
  });

  it('returns an empty (200) result, not a crash, on a network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    const res = mockRes();
    await handler({ method: 'GET', query: { query: 'iron' } }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toEqual([]);
  });
});

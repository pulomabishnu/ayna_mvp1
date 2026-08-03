import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const realFetch = globalThis.fetch;

// jsdom isn't configured for this project (environment: 'node'), so provide the
// minimal localStorage the loader touches.
beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

async function freshModule() {
  vi.resetModules();
  return import('./productCatalog.js');
}

describe('loadProductCatalog', () => {
  it('serves the API catalog when available', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ products: [{ id: 'a', name: 'A' }], count: 1 }),
    });
    const { loadProductCatalog } = await freshModule();
    const out = await loadProductCatalog();
    expect(out.source).toBe('api');
    expect(out.products).toHaveLength(1);
  });

  it('falls back to the bundled catalog when the API fails — never an empty catalog', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const { loadProductCatalog } = await freshModule();
    const out = await loadProductCatalog();
    expect(out.source).toBe('bundled');
    // The real bundled catalog, so a health app never renders product-less.
    expect(out.products.length).toBeGreaterThan(100);
  });

  it('treats an empty API response as a failure rather than a valid catalog', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ products: [] }) });
    const { loadProductCatalog } = await freshModule();
    const out = await loadProductCatalog();
    expect(out.source).toBe('bundled');
  });

  it('does not cache a fallback, so a transient outage is recoverable', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    const { loadProductCatalog } = await freshModule();
    await loadProductCatalog();
    expect(localStorage.getItem('ayna_product_catalog_v1')).toBeNull();
  });

  it('single-flights concurrent callers instead of fetching the catalog N times', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () => new Promise((r) => setTimeout(() => r({ ok: true, json: async () => ({ products: [{ id: 'a' }] }) }), 10))
    );
    globalThis.fetch = fetchMock;
    const { loadProductCatalog } = await freshModule();
    await Promise.all([loadProductCatalog(), loadProductCatalog(), loadProductCatalog()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('serves a warm cache without hitting the network', async () => {
    localStorage.setItem(
      'ayna_product_catalog_v1',
      JSON.stringify({ ts: Date.now(), products: [{ id: 'cached' }] })
    );
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const { loadProductCatalog } = await freshModule();
    const out = await loadProductCatalog();
    expect(out.source).toBe('cache');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ignores an expired cache', async () => {
    localStorage.setItem(
      'ayna_product_catalog_v1',
      JSON.stringify({ ts: Date.now() - 7 * 60 * 60 * 1000, products: [{ id: 'old' }] })
    );
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ products: [{ id: 'fresh' }] }) });
    const { loadProductCatalog } = await freshModule();
    const out = await loadProductCatalog();
    expect(out.products[0].id).toBe('fresh');
  });
});

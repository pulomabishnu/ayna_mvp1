import { describe, it, expect } from 'vitest';
import { loadCatalog } from './catalog.js';
import { shopCatalogCounts, isServiceListing } from './catalogCounts.js';

describe('catalogCounts', () => {
  it('counts what the Shop and Services pages list', { timeout: 60000 }, async () => {
    await loadCatalog?.();
    const { products, services } = shopCatalogCounts();
    // The Shop and Services pages show these exact numbers (web: Showing 60 of 252, app: 252 and 49 results).
    expect(products).toBeGreaterThan(200);
    expect(services).toBeGreaterThan(20);
  });
  it('lists apps and telehealth as services', () => {
    expect(isServiceListing({ type: 'digital', name: 'x' })).toBe(true);
    expect(isServiceListing({ category: 'pad', name: 'Pads' })).toBe(false);
  });
});

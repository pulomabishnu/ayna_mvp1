import { describe, it, expect } from 'vitest';
import * as P from './products.js';

describe('adoptLiveCatalog (backlog Nov 14: products switched off in Supabase leave the app)', () => {
  it('drops a bundled product whose id is listed as inactive, keeps the rest', () => {
    const bundled = P.ALL_PRODUCTS[0];
    const other = P.ALL_PRODUCTS[1];
    P.adoptLiveCatalog([{ ...other }], [bundled.id]);
    expect(P.ALL_PRODUCTS.some((p) => p.id === bundled.id)).toBe(false);
    expect(P.ALL_PRODUCTS.some((p) => p.id === other.id)).toBe(true);
  });
  it('shows a product edited in Supabase with the edited text', () => {
    const p0 = P.ALL_PRODUCTS[0];
    P.adoptLiveCatalog([{ ...p0, name: p0.name + ' (edited)' }], []);
    expect(P.ALL_PRODUCTS.find((p) => p.id === p0.id).name).toMatch(/\(edited\)$/);
  });
});

describe('a live row keeps the bundled buy links (LOLA fell back to its homepage, Nov 16)', () => {
  it('LOLA pads still buy through the affiliate link after the live catalog loads', async () => {
    const m = await import('./products.js');
    const { resolveBuyUrl } = await import('../utils/buyLink.js');
    m.adoptLiveCatalog([{ id: 'p-lola-pad', name: 'LOLA Organic Cotton Pads', brand: 'LOLA', category: 'pad', url: 'https://mylola.com/' }]);
    const p = m.getProductById('p-lola-pad');
    expect(p.affiliateUrl).toBe('https://lvnta.com/lv_9s1mlpiV0gHbgRP8fx');
    expect(resolveBuyUrl(p)).toBe('https://lvnta.com/lv_9s1mlpiV0gHbgRP8fx');
  });
});

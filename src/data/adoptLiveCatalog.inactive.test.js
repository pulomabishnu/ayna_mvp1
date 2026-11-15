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

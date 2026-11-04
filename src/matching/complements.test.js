import { describe, it, expect } from 'vitest';
import { complementsFor, ownsProduct } from './complements.js';
import { COMPLEMENTS } from '../data/complements.js';
import { ALL_PRODUCTS } from '../data/products.js';

const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
const cup = { ...byId('p-saalt-cup'), userAdded: true };

describe('goes with what you own (founder, Nov 3)', () => {
  it('a Saalt Cup she added brings the Saalt Steamer, with the brand line and the honest note', () => {
    const [c] = complementsFor({ owned: [cup], byId });
    expect(c.product.id).toBe('p-saalt-cup-steamer');
    expect(c.parent.id).toBe('p-saalt-cup');
    expect(c.note).toMatch(/Optional/);
    expect(c.sources.map((s) => s.url).join(' ')).toMatch(/saalt\.com.*fda\.gov/);
  });
  it('never from a pick ayna generated, never twice, never after "not for me"', () => {
    expect(complementsFor({ owned: [{ ...byId('p-saalt-cup'), intakeGenerated: true }], byId })).toEqual([]);
    expect(complementsFor({ owned: [cup, { ...byId('p-saalt-cup-steamer'), userAdded: true }], byId })).toEqual([]);
    expect(complementsFor({ owned: [cup], byId, exclude: new Set(['p-saalt-cup-steamer']) })).toEqual([]);
    expect(ownsProduct({ id: 'x' })).toBe(false);
  });
  it('a safety hold wins', () => {
    expect(complementsFor({ owned: [cup], byId, details: () => ({ matchStatus: 'safety-hold' }) })).toEqual([]);
    expect(complementsFor({ owned: [cup], byId, details: () => ({ matchStatus: 'bleeding-evaluation' }) })).toEqual([]);
  });
  it('every pair points at real products and has sources', () => {
    for (const c of COMPLEMENTS) {
      expect(byId(c.product), c.product).toBeTruthy();
      c.for.forEach((id) => expect(byId(id), id).toBeTruthy());
      expect(c.sources.length).toBeGreaterThan(0);
    }
  });
});

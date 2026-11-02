import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { readinessFor, summarizeReadiness, READINESS_LEVELS } from './readiness.js';

describe('recommendation readiness', () => {
  it('an accessory or refill is browse only', () => {
    const refill = ALL_PRODUCTS.find((p) => /refill/i.test(p.name || ''));
    expect(refill).toBeTruthy();
    expect(readinessFor(refill).level).toBe('browse_only');
  });
  it('a product with a missing safety fact is never "ready"', () => {
    const syn = { id: 'syn-r', name: 'Synthetic Herbal Tea', brand: 'Test', category: 'supplement', type: 'supplement', tags: ['sleep'], healthFunctions: ['sleep'], url: 'https://example.com' };
    const r = readinessFor(syn);
    expect(r.level).not.toBe('ready');
  });
  it('every product gets exactly one known level and the counts add up', () => {
    const s = summarizeReadiness(ALL_PRODUCTS.slice(0, 60));
    expect(Object.values(s.byLevel).reduce((a, b) => a + b, 0)).toBe(s.total);
    for (const r of s.rows) expect(READINESS_LEVELS).toContain(r.level);
  }, 60000);
});

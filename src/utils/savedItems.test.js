import { describe, it, expect } from 'vitest';
import {
  resolveSavedProduct,
  ecosystemIdSet,
  savedItemStatus,
  matchesSavedFilter,
  countSavedFilters,
  buildSavedEntries,
} from './savedItems';

const FLAGGED = { safety: { recalls: 'Independent testing found PFAS in 2023.' } };
const CLEAN = { safety: { recalls: 'No recalls. Zero PFAS detected in independent testing.' } };

const CATALOG = {
  a: { id: 'a', name: 'Catalog A', tags: ['cramps'], ...FLAGGED },
  b: { id: 'b', name: 'Catalog B', ...CLEAN },
};
const lookup = (id) => CATALOG[id] || null;

describe('resolveSavedProduct', () => {
  it('re-attaches catalog fields the compact saved copy dropped, saved fields win', () => {
    const out = resolveSavedProduct({ id: 'a', name: 'Saved name', price: '$9' }, lookup);
    expect(out.safety).toEqual(FLAGGED.safety);
    expect(out.tags).toEqual(['cramps']);
    expect(out.name).toBe('Saved name');
  });

  it('uses catalogId when present and leaves non-catalog items alone', () => {
    expect(resolveSavedProduct({ id: 'llm-1', catalogId: 'b' }, lookup).name).toBe('Catalog B');
    const custom = { id: 'custom-1', name: 'Custom' };
    expect(resolveSavedProduct(custom, lookup)).toBe(custom);
  });
});

describe('ecosystemIdSet', () => {
  it('accepts an id-keyed object or an array', () => {
    expect([...ecosystemIdSet({ a: { id: 'a' }, b: null })]).toEqual(['a']);
    expect([...ecosystemIdSet([{ id: 'x' }, {}])]).toEqual(['x']);
    expect(ecosystemIdSet(null).size).toBe(0);
  });
});

describe('savedItemStatus + filters', () => {
  const eco = new Set(['a']);

  it('treats ecosystem membership and flags independently', () => {
    expect(savedItemStatus({ id: 'a', ...FLAGGED }, eco)).toEqual({ inEcosystem: true, flagged: true, status: 'eco' });
    expect(savedItemStatus({ id: 'b', ...CLEAN }, eco)).toEqual({ inEcosystem: false, flagged: false, status: 'new' });
    expect(savedItemStatus({ id: 'c' }, eco).flagged).toBe(false);
  });

  it('filters and counts, with flagged overlapping eco/new', () => {
    const entries = [
      { inEcosystem: true, flagged: true },
      { inEcosystem: false, flagged: false },
      { inEcosystem: false, flagged: true },
    ];
    expect(countSavedFilters(entries)).toEqual({ all: 3, eco: 1, new: 2, flag: 2 });
    expect(entries.filter((e) => matchesSavedFilter(e, 'eco'))).toHaveLength(1);
    expect(entries.filter((e) => matchesSavedFilter(e, 'new'))).toHaveLength(2);
    expect(entries.filter((e) => matchesSavedFilter(e, 'flag'))).toHaveLength(2);
    expect(entries.filter((e) => matchesSavedFilter(e, 'all'))).toHaveLength(3);
    expect(countSavedFilters([])).toEqual({ all: 0, eco: 0, new: 0, flag: 0 });
  });
});

describe('buildSavedEntries', () => {
  it('decorates saved rows, keeping the stored item for callbacks', () => {
    const saved = { a: { id: 'a', name: 'A' }, b: { id: 'b', name: 'B' }, bad: null };
    const entries = buildSavedEntries(saved, { b: { id: 'b' } }, lookup);
    expect(entries).toHaveLength(2);
    const [a, b] = entries;
    expect(a.item).toBe(saved.a);
    expect(a.product.safety).toEqual(FLAGGED.safety);
    expect(a).toMatchObject({ inEcosystem: false, flagged: true });
    expect(b).toMatchObject({ inEcosystem: true, flagged: false });
  });
});

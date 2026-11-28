import { describe, it, expect } from 'vitest';
import { discoveryFor } from './discovery.js';
import { readinessFor } from './readiness.js';
import { brandSnapshot, marketRollup } from './market.js';
import { buildBrief, briefCsv, briefText } from './brief.js';
import { scopeCatalog, scopeCategories } from '../../../api/_partnerStudio/access.js';

const catalog = [
  { id: 'a1', name: 'Acme Pad', brand: 'Acme', category: 'pad', eng: { seen: 2, opened: 12, detail: 3, buy: 4 }, src: { search: 2, browse: 8, other: 1 } },
  { id: 'a2', name: 'Acme Cup', brand: 'Acme', category: 'cup', eng: { seen: 0, opened: 3, detail: 0, buy: 0 } },
  { id: 'b1', name: 'Beta Pad', brand: 'Beta', category: 'pad', eng: { seen: 1, opened: 20, detail: 5, buy: 2 }, src: { search: 10, browse: 5, other: 0 } },
  { id: 'c1', name: 'Cee Lube', brand: 'Cee', category: 'lube', eng: { seen: 0, opened: 7, detail: 1, buy: 1 }, src: { search: 0, browse: 3, other: 0 } },
];

describe('discoveryFor', () => {
  it('splits search, browse and other for the brand, its category peers and everyone', () => {
    const d = discoveryFor(catalog, 'Acme');
    expect(d.me).toMatchObject({ search: 2, browse: 8, other: 1, total: 11 });
    expect(d.peers).toMatchObject({ search: 10, browse: 5, total: 15 });
    expect(d.everyone.total).toBe(18);
    expect(d.products[0].id).toBe('a1');
  });
});

describe('readinessFor', () => {
  const b = {
    skus: [{ id: 's1', name: 'One', price: 10, inScope: true }, { id: 's2', name: 'Two', inScope: false }],
    competitors: [{ sku: 's1', materials: 'complete', instructions: 'missing', freshness: 'current', completeness: 80 }],
    categories: [{ skus: [{ sku: 's1', selected: 2, insufficient_info: 1 }] }],
  };
  it('marks facts on file, missing or not checked and lists the gaps', () => {
    const r = readinessFor(b);
    const one = r.products[0];
    expect(one.checks).toEqual({ price: true, materials: true, instructions: false, fresh: true, engine: false, need: true });
    expect(one.score).toBe(67);
    expect(r.products[1].checks.materials).toBeNull();
    expect(r.products[1].score).toBeNull();
    expect(r.products[1].partial).toBe(true);
    expect(r.score).toBe(67);
    expect(r.gaps.map((g) => g.key)).toEqual(['price', 'instructions', 'engine']);
  });
  it('handles a brand with nothing on file', () => {
    expect(readinessFor({})).toEqual({ products: [], score: null, gaps: [] });
  });
});

describe('scopeCatalog (brand accounts)', () => {
  const scoped = scopeCatalog(catalog, ['Acme']);
  it('keeps own activity and removes every other brand’s per-product numbers', () => {
    expect(scoped.find((p) => p.id === 'a1').eng.opened).toBe(12);
    for (const p of scoped.filter((x) => x.brand !== 'Acme' && !x.aggregate)) {
      expect(p.eng).toBeUndefined();
      expect(p.src).toBeUndefined();
    }
  });
  it('folds other brands into one combined row per category so totals still add up', () => {
    const full = marketRollup(catalog, 'Acme');
    const part = marketRollup(scoped, 'Acme');
    const pad = (rows) => rows.find((r) => r.id === 'pad');
    expect(pad(part).opened).toBe(pad(full).opened);
    expect(pad(part).myShare).toBe(pad(full).myShare);
    expect(pad(part).products).toBe(2);
    expect(pad(part).brandCount).toBe(2);
    expect(discoveryFor(scoped, 'Acme').peers.total).toBe(15);
  });
  it('hides ranks once competitors are combined', () => {
    const s = brandSnapshot(scoped, 'Acme');
    expect(s.viewRank).toBeNull();
    expect(s.activeBrands).toBeNull();
    expect(s.brandCount).toBe(3);
  });
  it('strips other brands’ activity from benchmark categories', () => {
    const cats = scopeCategories([{ id: 'pad', products: [catalog[0], catalog[2]] }], ['Acme']);
    expect(cats[0].products[0].eng).toBeDefined();
    expect(cats[0].products[1].eng).toBeUndefined();
  });
});

describe('monthly brief', () => {
  const data = { catalog, categories: [] };
  const b = { brand: 'Acme', name: 'Acme', skus: [], actions: [{ id: 'x', title: 'Send ingredients', action: 'Send the list.' }] };
  it('uses the same numbers in the page model, the text and the CSV', () => {
    const x = buildBrief(data, b);
    expect(x.s.tot).toMatchObject({ opened: 15, buy: 4, detail: 3, seen: 2 });
    expect(x.top.id).toBe('a1');
    const text = briefText(x);
    expect(text).toContain('Product card opens: 15');
    expect(text).toContain('Clicks to retailer: 4 (clicks, not purchases)');
    expect(text).toContain('Product match simulation (synthetic shopping scenarios, not actual activity)');
    expect(text).toContain('1. Send ingredients');
    const csv = briefCsv(x).split('\n');
    expect(csv[0]).toBe('"section","metric","value"');
    expect(csv).toContain('"activity","product_card_opens","15"');
    expect(csv).toContain('"discovery","from_search","2"');
  });
  it('drops actions marked done', () => {
    expect(buildBrief(data, b, { x: 'done' }).actions).toEqual([]);
  });
});

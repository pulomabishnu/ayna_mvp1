import { describe, it, expect } from 'vitest';
import { summarizeRun, comparable, shareSeries, changeSinceLast } from './history.js';

const snap = {
  categories: [{
    id: 'cat',
    products: [{ brand: 'A' }, { brand: 'B' }, { brand: 'C' }],
    rows: [{ p: [0, 1, 2] }, { p: [0, 1] }, { p: [] }],
  }],
};
const V = { scenarioSetVersion: 's1', categorySetVersion: 'c1', adapterVersion: 'a1' };

describe('summarizeRun', () => {
  it('counts slots per brand and per category from the compact rows', () => {
    expect(summarizeRun(snap)).toEqual({ categories: { cat: { slots: 5, scenarios: 3, brands: { A: 2, B: 2, C: 1 } } } });
  });
  it('handles an empty snapshot', () => {
    expect(summarizeRun({})).toEqual({ categories: {} });
  });
});

describe('comparable', () => {
  it('needs the same scenario set, category set and adapter', () => {
    expect(comparable(V, { ...V })).toBe(true);
    expect(comparable(V, { ...V, adapterVersion: 'a2' })).toBe(false);
    expect(comparable(V, { ...V, scenarioSetVersion: 's2' })).toBe(false);
    expect(comparable({}, {})).toBe(false);
  });
});

describe('shareSeries and changeSinceLast', () => {
  const run = (id, at, a, total, v = V) => ({ runId: id, createdAt: at, ...v, summary: { categories: { cat: { slots: total, brands: { A: a } } } } });
  it('returns comparable runs oldest first with the share in percent', () => {
    const s = shareSeries([run('r2', '2026-11-20', 10, 100), run('r1', '2026-11-13', 5, 100), run('r3', '2026-11-27', 12, 100)], 'cat', 'A');
    expect(s.points.map((p) => p.value)).toEqual([5, 10, 12]);
    expect(s.skipped).toBe(0);
    expect(changeSinceLast(s)).toEqual({ pp: 2, since: '2026-11-20' });
  });
  it('drops runs that are not comparable with the latest and counts them', () => {
    const s = shareSeries([run('old', '2026-11-01', 50, 100, { ...V, adapterVersion: 'old' }), run('r1', '2026-11-13', 5, 100), run('r2', '2026-11-20', 10, 100)], 'cat', 'A');
    expect(s.points.map((p) => p.runId)).toEqual(['r1', 'r2']);
    expect(s.skipped).toBe(1);
  });
  it('gives no change with fewer than two runs', () => {
    expect(changeSinceLast(shareSeries([run('r1', '2026-11-13', 5, 100)], 'cat', 'A'))).toBeNull();
    expect(changeSinceLast(shareSeries([], 'cat', 'A'))).toBeNull();
  });
  it('treats a brand with no slots as 0%', () => {
    expect(shareSeries([run('r1', '2026-11-13', 5, 100)], 'cat', 'Z').points[0].value).toBe(0);
  });
});

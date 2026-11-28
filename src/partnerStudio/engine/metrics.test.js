/**
 * Denominator fixtures (Phase 1 plan, p.17): hand-calculated examples match
 * the rollups, and an empty set returns N/A. The fixture rebuilds the plan's
 * own illustration on p.8: 100 fictional scenarios, top 3.
 */
import { describe, expect, it } from 'vitest';
import { recommendationShare, lossFunnel, brandOutcome, brandRank, sensitivityRange, rate } from './metrics.js';

function planFixture() {
  const results = [];
  for (let i = 0; i < 100; i += 1) {
    const n = i >= 80 ? 2 : 3; // 20 unfilled slots
    const a = i < 12 ? 2 : i < 48 ? 1 : 0;
    const b = i >= 30 && i <= 54 ? 2 : i >= 55 && i <= 94 ? 1 : 0;
    const placements = [];
    for (let k = 0; k < a; k += 1) placements.push({ sku: `a${k}`, brand: 'A' });
    for (let k = 0; k < b; k += 1) placements.push({ sku: `b${k}`, brand: 'B' });
    while (placements.length < n) placements.push({ sku: `c${placements.length}`, brand: 'C' });
    const candidates = [];
    if (a) candidates.push({ sku: 'a0', brand: 'A', stage: 'selected' });
    else if (i >= 48 && i < 80) candidates.push({ sku: 'a0', brand: 'A', stage: 'eligible_lost', reason: i < 60 ? 'budget' : i < 68 ? 'format' : i < 74 ? 'evidence' : i < 78 ? 'diversity_tie' : 'unclassified', pct: 60 });
    if (b) candidates.push({ sku: 'b0', brand: 'B', stage: 'selected' });
    else if (i < 20) candidates.push({ sku: 'b0', brand: 'B', stage: 'eligible_lost', reason: 'budget', pct: 60 });
    results.push({ scenarioId: `s${i}`, label: `Scenario ${i}`, weight: 1, k: 3, budget: i % 2 ? 'low' : 'any', placements, candidates });
  }
  return results;
}

describe('recommendation share (plan p.8 example)', () => {
  const rs = planFixture();
  it('slot share uses actual filled slots as the denominator', () => {
    const a = recommendationShare(rs, 'A');
    const b = recommendationShare(rs, 'B');
    expect(a.slots).toBe(280);
    expect(a.unfilled).toBe(20);
    expect(a.brandSlots).toBe(60);
    expect(b.brandSlots).toBe(90);
    expect(Math.round(a.slotShare.value * 1000) / 10).toBe(21.4);
    expect(Math.round(b.slotShare.value * 1000) / 10).toBe(32.1);
  });
  it('scenario inclusion and eligible-to-placed match the hand calculation', () => {
    const a = recommendationShare(rs, 'A');
    const b = recommendationShare(rs, 'B');
    expect([a.inclusion.num, a.inclusion.den]).toEqual([48, 100]);
    expect([b.inclusion.num, b.inclusion.den]).toEqual([65, 100]);
    expect([a.eligible.num, b.eligible.num]).toEqual([80, 85]);
    expect(a.eligibleToPlaced.value).toBeCloseTo(0.6, 10);
    expect([b.eligibleToPlaced.num, b.eligibleToPlaced.den]).toEqual([65, 85]);
    expect(Math.round(b.eligibleToPlaced.value * 1000) / 10).toBe(76.5);
  });
  it('equal weights give the same weighted and unweighted share', () => {
    const a = recommendationShare(rs, 'A');
    expect(a.weightedSlotShare).toBeCloseTo(a.slotShare.value, 12);
  });
  it('ranks brands by slots', () => {
    // The rest of the universe (C) holds 130 slots, B 90, A 60.
    expect(brandRank(rs, 'C').rank).toBe(1);
    expect(brandRank(rs, 'B').rank).toBe(2);
    expect(brandRank(rs, 'A').rank).toBe(3);
    expect(brandRank(rs, 'Nobody')).toEqual({ rank: null, of: 3 });
  });
});

describe('lost recommendation funnel (plan p.11 example)', () => {
  it('primary reasons sum exactly to eligible losses', () => {
    const f = lossFunnel(planFixture(), 'A');
    expect(f.counts.eligible).toBe(80);
    expect(f.counts.placed).toBe(48);
    expect(f.counts.eligible_lost).toBe(32);
    expect(f.reasons).toEqual({ budget: 12, format: 8, evidence: 6, diversity_tie: 4, unclassified: 2 });
    expect(f.check).toBe(true);
  });
  it('never counts an out-of-scope product as a missed opportunity', () => {
    const f = lossFunnel(planFixture(), 'A');
    expect(f.counts.out_of_scope).toBe(20);
    expect(f.counts.in_scope).toBe(80);
  });
  it('brand precedence: selected > eligible loss > insufficient info > excluded', () => {
    const r = { placements: [], candidates: [{ brand: 'X', stage: 'excluded' }, { brand: 'X', stage: 'insufficient_info' }] };
    expect(brandOutcome(r, 'X')).toBe('insufficient_info');
    r.candidates.push({ brand: 'X', stage: 'eligible_lost' });
    expect(brandOutcome(r, 'X')).toBe('eligible_lost');
  });
});

describe('empty and undefined denominators', () => {
  it('returns null (N/A), never 0, for a zero denominator', () => {
    expect(rate(0, 0).value).toBeNull();
    const m = recommendationShare([], 'A');
    expect(m.slotShare.value).toBeNull();
    expect(m.inclusion.value).toBeNull();
    expect(m.eligibleToPlaced.value).toBeNull();
    expect(m.weightedSlotShare).toBeNull();
  });
  it('eligible-to-placed is N/A when the brand was never eligible', () => {
    const rs = [{ weight: 1, k: 3, placements: [{ brand: 'B' }], candidates: [] }];
    expect(recommendationShare(rs, 'A').eligibleToPlaced.value).toBeNull();
  });
  it('sensitivity range spans the subsets', () => {
    const s = sensitivityRange(planFixture(), 'A', (r) => r.budget);
    expect(s.rows).toHaveLength(2);
    expect(s.min).toBeLessThanOrEqual(s.max);
  });
});

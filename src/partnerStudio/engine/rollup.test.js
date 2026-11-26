import { describe, it, expect } from 'vitest';
import { shelfField, needBudgetGrid } from './rollup.js';

const r = (need, budget, placedBrands, candidateBrands) => ({
  need,
  budget,
  placements: placedBrands.map((b, i) => ({ sku: `${b}-${i}`, brand: b })),
  candidates: candidateBrands.map((b, i) => ({ sku: `${b}-c${i}`, brand: b })),
});

const results = [
  r('Dryness', 'under-25', ['A', 'B', 'B'], ['A', 'B', 'C', 'Me']),
  r('Dryness', 'any', ['Me', 'B', 'A'], ['A', 'B', 'C', 'Me']),
  r('Itch', 'under-25', ['A', 'B'], ['A', 'B', 'C', 'Me']),
];

describe('shelfField', () => {
  const f = shelfField(results, 'Me');
  it('includes every brand in the universe, zero-slot brands too', () => {
    expect(f.rows).toHaveLength(4);
    expect(f.totalSlots).toBe(8);
    expect(f.zeroSlotPeers).toBe(1);
  });
  it('anonymizes peers and marks the viewer', () => {
    expect(f.rows.filter((x) => x.you)).toHaveLength(1);
    expect(f.rows.map((x) => x.label)).not.toContain('A');
    expect(f.rows.every((x) => x.you || /^Peer \d+$/.test(x.label))).toBe(true);
  });
  it('uses exact shares, tie-aware ranks and the peer median', () => {
    const me = f.rows.find((x) => x.you);
    expect(me).toMatchObject({ slots: 1, share: 12.5, rank: 3 });
    // Placed peers: B 4 (50%), A 3 (37.5%) → median 43.8; with C (0%) → 37.5
    expect(f.peerMedian).toBe(43.8);
    expect(f.peerMedianAll).toBe(37.5);
    expect(f.placedPeers).toBe(2);
    expect(f.rows[0]).toMatchObject({ rank: 1, share: 50 });
  });
  it('gives N/A shares when nothing was placed', () => {
    const empty = shelfField([r('Dryness', 'any', [], ['Me', 'X'])], 'Me');
    expect(empty.rows.every((x) => x.share === null)).toBe(true);
    expect(empty.peerMedian).toBeNull();
  });
});

describe('needBudgetGrid', () => {
  const g = needBudgetGrid(results, 'Me', ['Dryness', 'Itch']);
  it('keeps each cell’s own denominator', () => {
    const dry = g.rows[0].cells;
    expect(dry.find((c) => c.key === 'any')).toMatchObject({ scenarios: 1, brandSlots: 1, slots: 3, slotShare: 33.3 });
    expect(dry.find((c) => c.key === 'under-25')).toMatchObject({ brandSlots: 0, slots: 3, slotShare: 0 });
  });
  it('returns N/A for an empty cell, not zero', () => {
    expect(g.rows[1].cells.find((c) => c.key === '25-75')).toMatchObject({ scenarios: 0, slotShare: null });
  });
});

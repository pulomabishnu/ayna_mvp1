import { describe, it, expect } from 'vitest';
import { pickOnePerPartnerBrand } from './Discovery';

// Requested 2026-09-16: show only one product per partner brand in general
// Browse (their full catalogs aren't incorporated yet), rotating which one
// on every fresh page load via the same seed mechanism as shuffleJitter.
describe('pickOnePerPartnerBrand', () => {
  const elitoneA = { id: 'p-elitone', brand: 'Elitone', name: 'Elitone (Stress + Mixed Incontinence)' };
  const elitoneB = { id: 'p-elitone-urge', brand: 'Elitone', name: 'Elitone URGE (Overactive Bladder)' };
  const lola = { id: 'p-lola-pad', brand: 'LOLA', name: 'LOLA Organic Cotton Pads' };
  const tampax = { id: 'disc-tampax', brand: 'Tampax', name: 'Tampax Pearl' };

  it('keeps exactly one item per partner brand', () => {
    const result = pickOnePerPartnerBrand([elitoneA, elitoneB, lola, tampax], 'seed-1');
    const elitoneCount = result.filter((p) => p.brand === 'Elitone').length;
    expect(elitoneCount).toBe(1);
    expect(result.some((p) => p.id === 'p-lola-pad')).toBe(true);
  });

  it('never drops a non-partner item', () => {
    const result = pickOnePerPartnerBrand([elitoneA, elitoneB, lola, tampax], 'seed-1');
    expect(result.some((p) => p.id === 'disc-tampax')).toBe(true);
  });

  it('is stable for a given seed (same page view never flickers)', () => {
    const first = pickOnePerPartnerBrand([elitoneA, elitoneB, lola, tampax], 'seed-1');
    const second = pickOnePerPartnerBrand([elitoneA, elitoneB, lola, tampax], 'seed-1');
    expect(first.map((p) => p.id)).toEqual(second.map((p) => p.id));
  });

  it('can pick a different item across many different seeds (real rotation, not always the first)', () => {
    const picks = new Set();
    for (let i = 0; i < 50; i++) {
      const result = pickOnePerPartnerBrand([elitoneA, elitoneB, lola, tampax], `seed-${i}`);
      const picked = result.find((p) => p.brand === 'Elitone');
      picks.add(picked.id);
    }
    expect(picks.size).toBe(2);
  });

  it('leaves a solo partner product untouched', () => {
    const result = pickOnePerPartnerBrand([lola, tampax], 'seed-1');
    expect(result).toHaveLength(2);
  });
});

import { describe, it, expect } from 'vitest';
import { evidenceLevel } from './evidenceLevel.js';
import { ALL_PRODUCTS } from '../../data/products.js';

describe('evidence words match the level on file (TD 12)', () => {
  it('a single .gov page about heat is type-level, never "Strong evidence"', () => {
    const pad = ALL_PRODUCTS.find((p) => p.id === 'p-viboos-heating-pad');
    const ev = evidenceLevel(pad);
    expect(ev.scope).toBe('type');
    expect(ev.word).not.toMatch(/strong/i);
    expect(ev.level).toBeLessThanOrEqual(2);
    expect(ev.line).toMatch(/MedlinePlus/);
    expect(ev.line).toMatch(/No study of this exact product/);
  });
});

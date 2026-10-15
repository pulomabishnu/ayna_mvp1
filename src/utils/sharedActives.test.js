import { describe, it, expect } from 'vitest';
import { findSharedActives } from './sharedActives.js';

describe('findSharedActives', () => {
  it('flags an active two products share and ignores fillers and services', () => {
    const out = findSharedActives([
      { name: 'Vitex', ingredients: 'Chasteberry (Vitex agnus-castus) 400 mg, rice flour', type: 'physical', category: 'supplement' },
      { name: 'PMS Gummies', ingredients: 'Chasteberry 200mg, Dong Quai, pectin', type: 'physical', category: 'supplement' },
      { name: 'Pad', ingredients: 'Organic cotton', type: 'physical', category: 'pad' },
      { name: 'Clinic', ingredients: 'Chasteberry', type: 'digital', category: 'telehealth' },
    ]);
    expect(out).toEqual([['chasteberry', ['Vitex', 'PMS Gummies']]]);
  });
});

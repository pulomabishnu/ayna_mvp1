import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildEcosystem, mechKey } from './ecosystem.js';
import { buildProductProfile } from './productProfile.js';

const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
describe('cramps shelf mixes heat and TENS (backlog Nov 14, Liliane)', () => {
  it('tells heat and TENS apart', () => {
    const ova = ALL_PRODUCTS.find((p) => /Ova\+/.test(p.name));
    const viboos = ALL_PRODUCTS.find((p) => /VIBOOS/.test(p.name));
    expect(mechKey(buildProductProfile(ova))).toBe('cramp_device:tens');
    expect(mechKey(buildProductProfile(viboos))).toBe('cramp_device:heat');
  });
  it('with budget open, TENS options are on the shelf, not only heat', () => {
    const up = buildUserProfile({ ...EMPTY, age: '29', takesCurrent: 'No', allergyStatus: 'No', supportSelections: ['Cramps or period pain'], priceRange: ['Price is not a major factor for me'] }, { catalog: ALL_PRODUCTS });
    const picks = buildEcosystem(up, ALL_PRODUCTS, { picksPerNeed: 5 }).shelves[0].picks;
    const kinds = picks.map((p) => mechKey(buildProductProfile(byId.get(p.productId))));
    expect(kinds.filter((k) => k === 'cramp_device:tens').length).toBeGreaterThanOrEqual(2);
    expect(picks.length).toBe(5);
  });
});

import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildEcosystem } from './ecosystem.js';

const shelf = (over) => buildEcosystem(buildUserProfile({ ...EMPTY, age: '34', takesCurrent: 'No', allergyStatus: 'No', priceRange: ['Price is not a major factor for me'], ...over }, { catalog: ALL_PRODUCTS }), ALL_PRODUCTS, { picksPerNeed: 5 }).shelves[0];

describe('care guidance instead of products (founder decision, Nov 15)', () => {
  it('fatigue: no supplements, iron or mattresses; says what to check', () => {
    const s = shelf({ supportSelections: ['Fatigue or low energy'] });
    expect(s.picks).toEqual([]);
    expect(s.emptyReason).toBe('care_first');
    expect(s.qualityNote).toMatch(/low iron, thyroid/);
  });
  it('unexplained belly pain: guidance first', () => {
    const s = shelf({ supportSelections: ['Abdominal discomfort'] });
    expect(s.picks).toEqual([]);
    expect(s.qualityNote).toMatch(/24 to 48 hours/);
  });
});

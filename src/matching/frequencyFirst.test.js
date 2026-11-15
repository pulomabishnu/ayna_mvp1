import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildEcosystem } from './ecosystem.js';
import { buildProductProfile } from './productProfile.js';

const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const shelf = (over, needId) => {
  const up = buildUserProfile({ ...EMPTY, takesCurrent: 'No', allergyStatus: 'No', ...over }, { catalog: ALL_PRODUCTS });
  return buildEcosystem(up, ALL_PRODUCTS, { picksPerNeed: 5 }).shelves.find((s) => s.needId === needId).picks.map((p) => p.productId);
};
const isTest = (id) => buildProductProfile(byId.get(id)).care_roles.includes('testing');

describe('frequent urination (Ivy Bell 10/26)', () => {
  it('frequency alone leads with non-test options; tests stay, after them', () => {
    const ids = shelf({ age: '68', lifeStageSelections: ['Post-menopause'], supportSelections: ['Frequent urination'], utiFrequency: 'Rarely' }, 'urinary.frequency');
    expect(isTest(ids[0])).toBe(false);
    expect(ids.some(isTest)).toBe(true);
  });
  it('a UTI right now keeps tests first', () => {
    const ids = shelf({ age: '25', supportSelections: ['Frequent urination'], utiFrequency: 'I am experiencing them right now' }, 'urinary.frequency');
    expect(isTest(ids[0])).toBe(true);
  });
});

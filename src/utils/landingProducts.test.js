import { describe, it, expect } from 'vitest';
import { productMatchesCareArea, selectCabinetProducts, careAreasForProfile } from './landingProducts.js';

describe('landing product context', () => {
  it('never places nursing pads in period care', () => {
    expect(productMatchesCareArea({ name: 'Lansinoh Nursing Pads', category: 'postpartum' }, { label: 'Period care' })).toBe(false);
  });
  it('does not conflate incontinence with UTI support', () => {
    expect(productMatchesCareArea({ tags: ['bladder-leaks'] }, { label: 'UTI support' })).toBe(false);
    expect(productMatchesCareArea({ tags: ['uti'] }, { label: 'UTI support' })).toBe(true);
  });
  it('requires PCOS relevance instead of a generic hormone tag', () => {
    expect(productMatchesCareArea({ tags: ['hormone', 'vaginal-dryness'] }, { label: 'PCOS' })).toBe(false);
    expect(productMatchesCareArea({ tags: ['pcos'] }, { label: 'PCOS' })).toBe(true);
  });
  it('shows exactly the owned product when the ecosystem contains one item', () => {
    const owned = [{ id: 'thinx' }];
    expect(selectCabinetProducts(owned, [{ id: 'cup' }], [{ id: 'gummies' }], true)).toEqual(owned);
  });
  it('does not present examples as an empty signed-in user’s cabinet', () => {
    expect(selectCabinetProducts([], [], [{ id: 'cup' }], true)).toEqual([]);
  });
});

it('prioritizes strength and bone health rather than periods after menopause', () => {
  const areas = ['Period care', 'Fertility', 'Bone health', 'Menopause', 'Strength + muscle'].map(label => ({ label }));
  expect(careAreasForProfile(areas, { lifeStageSelections: ['I am post-menopause'] }).map(area => area.label)).toEqual(['Menopause', 'Bone health', 'Strength + muscle']);
});

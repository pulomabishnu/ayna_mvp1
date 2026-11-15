import { describe, expect, it } from 'vitest';
import { familyOnlyOffStage } from './ecosystem.js';

const fertilityClass = { life_stage: { ttc: 'designed_for', menopause: 'unknown' } };
describe('family-only products stay on family shelves (backlog Nov 14, Subhra)', () => {
  it('a TTC-only product is held off a PCOS shelf for someone not trying to conceive', () => {
    expect(familyOnlyOffStage(fertilityClass, { physiology: { lifeStages: ['hormonal_birth_control'] } }, 'condition_support.pcos')).toBe(true);
  });
  it('it still shows when she is trying to conceive, or on a fertility shelf', () => {
    expect(familyOnlyOffStage(fertilityClass, { physiology: { lifeStages: ['ttc'] } }, 'condition_support.pcos')).toBe(false);
    expect(familyOnlyOffStage(fertilityClass, { physiology: { lifeStages: [] } }, 'fertility.support')).toBe(false);
    expect(familyOnlyOffStage(fertilityClass, { physiology: { lifeStages: [] } }, 'bloating.pregnancy_related')).toBe(false);
  });
  it('products that also serve other stages are untouched', () => {
    expect(familyOnlyOffStage({ life_stage: { ttc: 'designed_for', menopause: 'designed_for' } }, { physiology: { lifeStages: [] } }, 'condition_support.pcos')).toBe(false);
  });
});

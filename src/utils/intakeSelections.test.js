import { describe, expect, it } from 'vitest';
import { normalizeAge, normalizeLifeStages, selectLifeStage } from './intakeSelections.js';
import { mapIntakeToLegacyQuizProfile } from './healthIntake.js';
import { getProductMatchDetailsForProduct } from '../data/products.js';
describe('intake consistency', () => {
  it.each(['', null, undefined, ' ', 0])('keeps a skipped age absent: %s', (age) => {
    expect(normalizeAge(age)).toBe(null);
    expect(mapIntakeToLegacyQuizProfile({ age }).age).toBe(null);
  });
  it('switches mutually exclusive period answers without removing compatible choices', () => {
    expect(selectLifeStage(['I get periods regularly', 'I use hormonal birth control'], 'I do not currently get periods')).toEqual(['I use hormonal birth control', 'I do not currently get periods']);
  });
  it('repairs conflicting older selections when editing', () => {
    expect(normalizeLifeStages(['I get periods regularly', 'My periods are irregular'])).toEqual(['My periods are irregular']);
  });
  it('does not infer menopause from age 45', () => {
    const product = { id: 'menopause', name: 'Menopause support', category: 'supplement', tags: ['menopause'], healthFunctions: ['menopause-support'] };
    const match = getProductMatchDetailsForProduct(product, { fullHealthIntake: { age: 45, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Acne'] } });
    // Matching engine (step 2): a life-stage mismatch is no longer a safety
    // exclusion. The product is simply not relevant to any need she selected,
    // so it scores 0 and is never recommended; age never adds a menopause need.
    expect(match.percent).toBe(0);
    expect(match.matchStatus).toBe('no-relevance');
    expect(match.needMatches.some((m) => m.relevant)).toBe(false);
  });
});

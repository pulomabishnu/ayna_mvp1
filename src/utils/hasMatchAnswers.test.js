import { describe, it, expect } from 'vitest';
import '../data/products.js';
import { hasMatchAnswers } from './hasMatchAnswers.js';
import { getProductRelevanceScore, getProductMatchDetailsForProduct, ALL_PRODUCTS } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';

const PERSONA = { fullHealthIntake: { ...EMPTY, personalizationCompleted: true, age: '54', lifeStageSelections: ['I am post-menopause'], supportSelections: ['Heavy periods', 'Hot flashes', 'Trouble sleeping'], periodFlow: 'Heavy' }, personalizationCompleted: true };

describe('web Best match uses her quiz answers (QA round 2)', () => {
  it('signed-out quiz answers count, with no frustrations field', () => {
    expect(hasMatchAnswers({ quizResults: PERSONA })).toBe(true);
    expect(hasMatchAnswers({ quizResults: null })).toBe(false);
  });
  it('the sort key is the engine percent; a period product has none for her', () => {
    const tampon = ALL_PRODUCTS.find((p) => p.id === 'p-tampontribe-organic-tampons');
    expect(getProductRelevanceScore(tampon, PERSONA)).toBe(0);
    expect(getProductMatchDetailsForProduct(tampon, PERSONA).percent).toBeNull();
  });
});

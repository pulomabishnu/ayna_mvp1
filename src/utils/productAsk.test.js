import { describe, it, expect } from 'vitest';
import { productAskStarters, productMatchContext, PRODUCT_ASK_TITLE, PRODUCT_ASK_PLACEHOLDER } from './productAsk.js';
import { answerMatchQuestion, isMatchQuestion } from './askMatch.js';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../data/products.js';

const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain'], lifeStageSelections: ['I get periods regularly'], takesCurrent: 'No' } };
const heat = ALL_PRODUCTS.find((p) => p.id === 'p-thermacare');

describe('Ask about this product', () => {
  it('title, three starters that fit her, one box', () => {
    expect(PRODUCT_ASK_TITLE).toBe('Ask about this product');
    expect(PRODUCT_ASK_PLACEHOLDER).toBe('Ask about this product…');
    expect(productAskStarters({ hasProfile: true })).toEqual(['Why is this my match?', 'Anything I should know before using it?', 'How does this compare with another option?']);
    expect(productAskStarters({ hasProfile: false })[0]).toBe('Who is this good for?');
  });
  it('"Why is this my match?" is answered on the device by the engine, about this product', () => {
    expect(isMatchQuestion('Why is this my match?')).toBe(true);
    const a = answerMatchQuestion('Why is this my match?', { catalog: ALL_PRODUCTS, quizAnswers: quiz, getDetails: getProductMatchDetailsForProduct, focusProduct: heat });
    const d = getProductMatchDetailsForProduct(heat, quiz);
    expect(a.productId).toBe('p-thermacare');
    expect(a.answer).toContain(`${d.percent}% match`);
    expect(productMatchContext(heat, d)).toContain(`${d.percent}% match`);
  });
});

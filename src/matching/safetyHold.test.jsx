import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../data/products.js';
import { answerMatchQuestion } from '../utils/askMatch.js';
import { compareSetRows } from '../components/compare/compareSet.js';
import ProductCard from '../mobile/components/ProductCard.jsx';
import WhyMatchScreen from '../mobile/screens/WhyMatchScreen.jsx';

// Founder, Oct 24: a product held back for safety shows NO percent anywhere
// (cards, product page, Compare, Rundown, Ask, Why), never 0%, and says the
// exact reason and what resolves it.
const quiz = { fullHealthIntake: { supportSelections: ['Cramps or period pain'], lifeStageSelections: ['I get periods regularly'] } };
const mag = ALL_PRODUCTS.find((p) => p.id === 'p-magnesium-glycinate');
const noPct = (s) => expect(String(s)).not.toMatch(/\d+\s*%/);

describe('safety hold', () => {
  const d = getProductMatchDetailsForProduct(mag, quiz);
  it('details: no percent, no per-need numbers, a reason and a fix', () => {
    expect(d.matchStatus).toBe('safety-hold');
    expect(d.percent).toBeNull();
    expect(d.needMatches.every((m) => m.score == null)).toBe(true);
    expect(d.safetyHold.fix.step).toBe('medications');
  });
  it('card shows "Safety hold", never a number', () => {
    const html = renderToStaticMarkup(<ProductCard product={mag} quizAnswers={quiz} />);
    expect(html).toContain('Safety hold');
    noPct(html.replace(/<[^>]+>/g, ' '));
  });
  it('Why shows the hold, the reason and the fix', () => {
    const html = renderToStaticMarkup(<WhyMatchScreen product={mag} quizAnswers={quiz} onFixSafety={() => {}} />);
    expect(html).toContain('Match unavailable');
    expect(html).toContain('We need one more safety detail before we can determine your match.');
    expect(html).toContain('Taking any medicines or supplements?');
    noPct(html.replace(/<[^>]+>/g, ' '));
  });
  it('Ask and Compare say the same, without a percent', () => {
    const a = answerMatchQuestion('what is my match for this', { catalog: ALL_PRODUCTS, quizAnswers: quiz, getDetails: getProductMatchDetailsForProduct, focusProduct: mag });
    expect(a.answer).toContain('Safety hold');
    noPct(a.answer);
    const row = compareSetRows([mag], { detailsFor: (p) => getProductMatchDetailsForProduct(p, quiz) }).find((r) => r.id === 'match');
    expect(row.values[0]).toBe('Safety hold · Match unavailable');
    expect(row.notes[0]).toMatch(/medicines/);
  });
});

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

describe('safety hold rate with the real setup shape', async () => {
  const { EMPTY, buildSnapshot } = await import('../mobile/data/intakeModel.js');
  const { mapIntakeToLegacyQuizProfile } = await import('../utils/healthIntake.js');
  const base = { ...EMPTY, age: '29', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Trouble sleeping', 'PMS symptoms'], safetyConcern: 'No', diagnosisSelections: ['None that I know of'], allergyStatus: 'No', takesCurrent: 'No' };
  const held = (intake) => {
    const q = mapIntakeToLegacyQuizProfile(buildSnapshot(intake));
    return ALL_PRODUCTS.map((p) => getProductMatchDetailsForProduct(p, q)).filter((d) => d.matchStatus === 'safety-hold');
  };
  it('answering None holds back only products with an open clinician review', () => {
    // Oct 29 (P0): a product under clinician review shows "Match being reviewed" for everyone.
    const h = held(base);
    expect(h.length).toBeLessThanOrEqual(5);
    for (const d of h) expect(d.safetyHold.state).toBe('in_review');
  });
  it('a listed medicine holds swallowed products nobody reviewed against it, never devices', () => {
    // Oct 29 (P0, unknown is not safe): unknown interaction = "Checking this product".
    const h = held({ ...base, takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'] });
    expect(h.length).toBeLessThan(15);
    for (const d of h) expect(['researching', 'in_review']).toContain(d.safetyHold.state);
    for (const d of h.filter((x) => x.safetyHold.state === 'researching')) expect(d.missingProductInfo).toContain('interaction_info');
  });
  it('Not sure / Prefer not to answer hold only relevant products that depend on that answer', () => {
    for (const takesCurrent of ["I'm not sure", 'Prefer not to say']) {
      const h = held({ ...base, takesCurrent });
      expect(h.length).toBeGreaterThan(0);
      expect(h.length).toBeLessThan(20);
      for (const d of h.filter((x) => x.safetyHold.state !== 'in_review')) expect(d.missingSafetyFields).toContain('medications');
    }
  });
});

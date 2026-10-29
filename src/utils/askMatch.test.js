import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS, CATEGORY_LABELS, getProductMatchDetailsForProduct, getEcosystemSeedFromQuiz, getProductById } from '../data/products.js';
import { answerMatchQuestion, isMatchQuestion, productQueryFrom } from './askMatch.js';

const q = { supportSelections: ['Cramps or period pain'] };
const ctx = (extra = {}) => ({ catalog: ALL_PRODUCTS, quizAnswers: q, categoryLabels: CATEGORY_LABELS, getDetails: getProductMatchDetailsForProduct, ...extra });
const firstPick = () => getProductById(getEcosystemSeedFromQuiz(q).shelves[0].picks[0].productId);

describe('isMatchQuestion', () => {
  it.each([
    'whats my % match for the heating pad',
    'What is my match for Thinx?',
    'why is this matched to me',
    'how well does Looncup fit me',
    'is the Ooler a good match for me',
  ])('yes: %s', (t) => expect(isMatchQuestion(t)).toBe(true));
  it.each(['what helps cramps on day 2', 'show me pads', 'does this match my skin tone'])('no: %s', (t) => expect(isMatchQuestion(t)).toBe(false));
});

describe('answerMatchQuestion', () => {
  it('not a match question: null, so Ask answers it', () => {
    expect(answerMatchQuestion('what helps cramps', ctx())).toBeNull();
  });

  it('gives the same percent the product page shows, with the reasons', () => {
    const p = firstPick();
    const d = getProductMatchDetailsForProduct(p, q, null, undefined);
    const out = answerMatchQuestion(`what's my % match for ${p.name}`, ctx());
    expect(out.productId).toBe(String(p.id));
    expect(out.answer).toContain(`${d.percent}% match`);
    expect(out.answer).toContain('**What raised it**');
    expect(out.answer).not.toMatch(/—/);
    expect(out.followUps).toEqual([{ type: 'open_product', productId: String(p.id), label: 'See full match details' }]);
  });

  it('no profile: asks for the profile, never invents a number', () => {
    const p = firstPick();
    const out = answerMatchQuestion(`my match for ${p.name}`, ctx({ quizAnswers: null }));
    expect(out.answer).not.toMatch(/\d+% match/);
    expect(out.answer).toMatch(/profile/);
  });

  it('unknown product: asks which one', () => {
    const out = answerMatchQuestion('my match for zzqx flarbo', ctx());
    expect(out.productId).toBeNull();
    expect(out.answer).toMatch(/couldn’t tell which product/);
  });

  it('no product named: uses the one she is looking at', () => {
    const p = firstPick();
    const out = answerMatchQuestion('why is this matched to me?', ctx({ focusProduct: p }));
    expect(out.productId).toBe(String(p.id));
  });

  it('strips question words', () => {
    expect(productQueryFrom("What's my % match for the Thinx Super?")).toBe('Thinx Super');
  });
});

describe('top match', () => {
  it('explains her highest match from the engine', () => {
    const out = answerMatchQuestion('Explain my top match', ctx());
    const best = Math.max(...ALL_PRODUCTS.map((p) => getProductMatchDetailsForProduct(p, q)).filter((d) => d.matchStatus === 'scored' && d.eligible !== false).map((d) => d.percent));
    expect(out.answer).toContain(`${best}% match`);
    expect(out.followUps[0].label).toBe('See full match details');
  });
});

describe('Ask review (Oct 29): safety questions come from the engine', async () => {
  const { localAnswer } = await import('./askAnswer.js');
  const profile = { fullHealthIntake: { allergyStatus: 'No', takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'], safetyConcern: 'No', diagnosisSelections: ['None that I know of'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain'], age: '29' }, personalizationCompleted: true };
  it('a brand name alone finds the product', async () => {
    const r = await localAnswer('what is my match for ThermaCare', { profile, signedIn: true });
    expect(r.answer).toMatch(/ThermaCare Menstrual Pain Therapy/);
  });
  it('"why is X on hold" gives the hold state and reason, never a percent', async () => {
    const r = await localAnswer('why is magnesium glycinate on hold', { profile, signedIn: true });
    expect(r.answer).toMatch(/Checking this product/);
    expect(r.answer).not.toMatch(/\d+% match/);
  });
  it('a pregnancy question about a product states the product’s own fact', async () => {
    const r = await localAnswer('is Flo gummies safe in pregnancy', { profile, signedIn: true });
    expect(r.answer).toMatch(/In pregnancy:/);
  });
  it('red flags are answered on the device first, signed in or not', async () => {
    const r = await localAnswer('I have severe pain and fever', { signedIn: false });
    expect(r.urgent).toBe(true);
    expect(r.answer).toMatch(/medical care now/);
  });
  it('a general question with no product named still goes to ayna’s AI', async () => {
    expect(await localAnswer('what helps cramps', { profile, signedIn: true })).toBeNull();
  });
});

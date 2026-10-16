import { describe, expect, it } from 'vitest';
import { feedbackProblem, remainingLabel, shippingProblems, tooSimilar, FEEDBACK_MIN_CHARS } from './campaignRules.js';

const GOOD = 'The match scores helped me pick a pad for sensitive skin, and seeing why each one fit made me trust the recommendation more than reviews.';

describe('feedbackProblem', () => {
  it('needs the minimum after trimming', () => {
    expect(FEEDBACK_MIN_CHARS).toBe(120);
    expect(feedbackProblem('good')).toBe('too_short');
    expect(feedbackProblem('love it')).toBe('too_short');
    expect(feedbackProblem('idk')).toBe('too_short');
    expect(feedbackProblem(`   ${'x'.repeat(10)}   `.padEnd(200, ' '))).toBe('too_short');
    expect(feedbackProblem(GOOD)).toBeNull();
  });
  it('catches junk that is long enough', () => {
    expect(feedbackProblem('a'.repeat(150))).toBe('low_effort');
    expect(feedbackProblem('good '.repeat(30))).toBe('low_effort');
    expect(feedbackProblem('love it love it love it '.repeat(6))).toBe('low_effort');
    expect(feedbackProblem('asdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdfasdf')).toBe('low_effort');
  });
  it('caps length', () => { expect(feedbackProblem(`${GOOD} `.repeat(20))).toBe('too_long'); });
});

describe('tooSimilar', () => {
  it('same text with different punctuation or a word added', () => {
    expect(tooSimilar(GOOD, GOOD.toUpperCase().replace(/,/g, ''))).toBe(true);
    expect(tooSimilar(GOOD, `${GOOD} Thanks`)).toBe(true);
  });
  it('different answers are fine', () => {
    expect(tooSimilar(GOOD, 'Finding saved products took a while because Ecosystem and Saved look alike and I kept opening the wrong page.')).toBe(false);
  });
});

describe('remainingLabel', () => {
  it('says exactly what is left', () => {
    expect(remainingLabel({ verified: false })).toBe('verify your account to start');
    expect(remainingLabel({ verified: true, feedbackDone: ['like'], friendsVerified: 1, friendsRequired: 3 })).toBe('2 more answers and 2 more verified friends to go');
    expect(remainingLabel({ verified: true, feedbackDone: ['like', 'friction', 'change'], friendsVerified: 1, friendsRequired: 3 })).toBe('2 more verified friends to go');
    expect(remainingLabel({ verified: true, feedbackDone: ['like', 'friction'], friendsVerified: 3, friendsRequired: 3 })).toBe('1 more answer to go');
    expect(remainingLabel({ eligible: true })).toBe('unlock my free product');
    expect(remainingLabel({ claim: {} })).toBe('see your free product');
  });
});

describe('shippingProblems', () => {
  it('validates US addresses', () => {
    expect(shippingProblems({ fullName: 'Ana B', line1: '1 Main St', city: 'Ithaca', state: 'ny', postal: '14850', email: 'a@b.co' })).toEqual({});
    expect(Object.keys(shippingProblems({ fullName: 'Ana B', line1: '1 Main St', city: 'Ithaca', state: 'ZZ', postal: '1485', email: 'nope' }))).toEqual(['state', 'postal', 'email']);
  });
});

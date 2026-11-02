import { describe, expect, it } from 'vitest';
import { clearedForRecommendation } from './cleared.js';

const ok = { matchStatus: 'scored', eligibility: 'eligible', eligible: true, recommendable: true, percent: 82, missingProductInfo: [] };

describe('clearedForRecommendation: only a fully cleared, scored product passes', () => {
  it('passes a scored, eligible, recommendable product with a real fit', () => {
    expect(clearedForRecommendation(ok)).toBe(true);
  });
  it.each([
    ['safety hold (she owes an answer)', { ...ok, matchStatus: 'safety-hold', eligibility: 'restricted', percent: null }],
    ['restricted but still marked scored', { ...ok, eligibility: 'restricted' }],
    ['excluded', { ...ok, matchStatus: 'excluded', eligibility: 'excluded', eligible: false, percent: 0 }],
    ['bleeding evaluation', { ...ok, matchStatus: 'bleeding-evaluation', percent: null }],
    ['no relevance', { ...ok, matchStatus: 'no-relevance' }],
    ['no profile', { ...ok, matchStatus: 'no-profile', percent: null }],
    ['listing not recommendable', { ...ok, recommendable: false }],
    ['recommendable unknown', { ...ok, recommendable: undefined }],
    ['a product fact is missing', { ...ok, missingProductInfo: ['pregnancy safety'] }],
    ['no percent', { ...ok, percent: null }],
    ['zero fit', { ...ok, percent: 0 }],
    ['NaN fit', { ...ok, percent: Number.NaN }],
    ['nothing', null],
  ])('holds back: %s', (_label, details) => {
    expect(clearedForRecommendation(details)).toBe(false);
  });
});

import { decideProduct } from './cleared.js';
describe('decideProduct: one result, three shapes', () => {
  it('cleared carries the percent', () => {
    expect(decideProduct(ok)).toMatchObject({ status: 'cleared', percent: 82 });
  });
  it('a hold carries no number at all and says what would clear it', () => {
    const d = decideProduct({ ...ok, matchStatus: 'safety-hold', eligibility: 'restricted', percent: null, safetyHold: { reason: 'We don’t know your life stage', state: 'needs_answer', fix: { label: 'Answer: life stage', step: 'lifeStage' } } });
    expect(d.status).toBe('hold');
    expect(d).not.toHaveProperty('percent');
    expect(d).not.toHaveProperty('score');
    expect(d.next).toEqual({ label: 'Answer: life stage', step: 'lifeStage' });
  });
  it('excluded wins over everything', () => {
    expect(decideProduct({ ...ok, eligible: false }).status).toBe('excluded');
  });
  it('a missing product fact is a hold even if marked scored', () => {
    expect(decideProduct({ ...ok, missingProductInfo: ['pregnancy safety'] }).status).toBe('hold');
  });
});

describe('decideProduct: no fit is its own result', () => {
  it('scored at 0 or no relevance is no_fit, not a hold', () => {
    expect(decideProduct({ ...ok, percent: 0 }).status).toBe('no_fit');
    expect(decideProduct({ ...ok, matchStatus: 'no-relevance' }).status).toBe('no_fit');
  });
});

import { breakdownFromDetails } from './breakdown.js';
describe('fit, evidence and confidence are shown apart', () => {
  it('the breakdown carries a confidence line separate from evidence', () => {
    const b = breakdownFromDetails({ id: 'x', name: 'X' }, { ...ok, confidence: 'medium', v2: { band: 'good', parts: [], unknown: [] } });
    expect(b.confidence).toMatchObject({ level: 'medium', label: 'Medium' });
  });
});

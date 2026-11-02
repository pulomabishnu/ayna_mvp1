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

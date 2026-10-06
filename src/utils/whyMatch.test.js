import { describe, it, expect } from 'vitest';
import { TIERS, tierForPercent, kindForComponent, buildMatchBreakdown, hasProfileSignal, shouldClampSummary } from './whyMatch';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, getProfileMatchPercentForProduct } from '../data/products';

describe('tierForPercent', () => {
  it('maps the score bands', () => {
    expect(tierForPercent(100).key).toBe('strong');
    expect(tierForPercent(75).key).toBe('strong');
    expect(tierForPercent(74).key).toBe('good');
    expect(tierForPercent(50).key).toBe('good');
    expect(tierForPercent(49).key).toBe('look');
    expect(tierForPercent(0).key).toBe('look');
  });

  it('falls back to the lowest tier for non-numbers', () => {
    expect(tierForPercent(null)).toBe(TIERS[TIERS.length - 1]);
    expect(tierForPercent('x')).toBe(TIERS[TIERS.length - 1]);
  });
});

describe('kindForComponent', () => {
  it('groups engine components into goal / profile / preference', () => {
    expect(kindForComponent('primaryGoal').key).toBe('goal');
    expect(kindForComponent('diagnoses').key).toBe('goal');
    expect(kindForComponent('lifeStage').key).toBe('profile');
    expect(kindForComponent('perimenopauseLastPeriod').key).toBe('profile');
    expect(kindForComponent('triedBefore').key).toBe('profile');
    expect(kindForComponent('format').key).toBe('preference');
    expect(kindForComponent(undefined).key).toBe('preference');
  });
});

describe('buildMatchBreakdown', () => {
  it('returns unscored when there is no percent', () => {
    expect(buildMatchBreakdown({ percent: null, eligible: true }).state).toBe('unscored');
    expect(buildMatchBreakdown(null).state).toBe('unscored');
  });

  it('keeps an engine exclusion distinct from a low score', () => {
    const b = buildMatchBreakdown({ percent: 0, eligible: false, considerations: ['Matches your allergy list'] });
    expect(b.state).toBe('excluded');
    expect(b.reason).toBe('Matches your allergy list');
    expect(b.tier).toBeNull();
  });

  it('uses the engine reason text verbatim and accepts string or object considerations', () => {
    const b = buildMatchBreakdown({
      percent: 82,
      eligible: true,
      reasonDetails: [
        { component: 'primaryGoal', score: 1, text: 'Goal: cramp relief' },
        { component: 'format', score: 0.5, text: 'Format: heat patch' },
        { component: 'age', score: 1, text: '' },
      ],
      considerations: ['Known interaction note', { text: 'Object note' }, ''],
    });
    expect(b.state).toBe('scored');
    expect(b.tier.key).toBe('strong');
    expect(b.matches).toHaveLength(2);
    expect(b.matches[0]).toMatchObject({ key: 'goal', label: 'Goal: cramp relief', weight: 'Strong' });
    expect(b.matches[1]).toMatchObject({ key: 'preference', weight: 'Partial' });
    expect(b.considerations).toEqual(['Known interaction note', 'Object note']);
  });

  it('agrees with the percent the product page shows for real catalog data', () => {
    const quiz = { fullHealthIntake: { primaryConcerns: ['Cramp and pain relief (devices, supplements, heat)'] } };
    const scored = ALL_PRODUCTS.find((p) => getProfileMatchPercentForProduct(p, quiz, null) > 0);
    expect(scored).toBeTruthy();
    const b = buildMatchBreakdown(getProductMatchDetailsForProduct(scored, quiz, null));
    expect(b.state).toBe('scored');
    expect(b.percent).toBe(getProfileMatchPercentForProduct(scored, quiz, null));
    expect(b.matches.length).toBeGreaterThan(0);
  });
});

describe('hasProfileSignal', () => {
  it('is false for empty inputs and true when either has data', () => {
    expect(hasProfileSignal(null, null)).toBe(false);
    expect(hasProfileSignal({}, {})).toBe(false);
    expect(hasProfileSignal({ frustrations: [] }, null)).toBe(true);
    expect(hasProfileSignal(null, { conditions: ['PCOS'] })).toBe(true);
  });
});

describe('shouldClampSummary', () => {
  it('only clamps long text', () => {
    expect(shouldClampSummary('short')).toBe(false);
    expect(shouldClampSummary('x'.repeat(321))).toBe(true);
    expect(shouldClampSummary(null)).toBe(false);
  });
});

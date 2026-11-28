import { describe, expect, it } from 'vitest';
import { statusFor, isHumanReviewed, reviewFlags, themesOf, evidenceMetrics, claimLandscape } from './evidence.js';

describe('evidence statuses describe documentation, not efficacy', () => {
  it('maps passport evidence types to plan statuses', () => {
    expect(statusFor({ evidence_type: 'product_study' })).toBe('direct');
    expect(statusFor({ evidence_type: 'ingredient_research' })).toBe('indirect');
    expect(statusFor({ evidence_type: 'regulatory' })).toBe('regulatory_only');
    expect(statusFor({ evidence_type: 'manufacturer' })).toBe('brand_reported');
    expect(statusFor({})).toBe('not_located');
  });
  it('an AI-assisted pass is never human review', () => {
    expect(isHumanReviewed({ status: 'verified', reviewed_by: 'ayna research pass (AI-assisted), needs human sign-off' })).toBe(false);
    expect(isHumanReviewed({ status: 'needs_correction', reviewed_by: 'Eliz' })).toBe(false);
    expect(isHumanReviewed({ status: 'verified', reviewed_by: 'Eliz' })).toBe(true);
  });
});

describe('review flags are prompts, not findings', () => {
  it('flags numbers backed only by the brand', () => {
    expect(reviewFlags({ claim: '95% of women reported fewer leaks', evidence_type: 'manufacturer' }).map((f) => f.id)).toContain('numeric_brand_only');
  });
  it('flags a clearance cited for a benefit', () => {
    expect(reviewFlags({ claim: 'Reduces urinary urgency', evidence_type: 'regulatory' }).map((f) => f.id)).toContain('regulatory_for_benefit');
  });
  it('does not flag a plain product-study claim', () => {
    expect(reviewFlags({ claim: 'Reduces dryness', evidence_type: 'product_study' })).toEqual([]);
  });
});

describe('metrics keep pending claims in the denominator', () => {
  const rec = (brand, statuses, reviewed = false) => ({ brand, reviewed, completeness: 80, claims: statuses.map((s) => ({ status: s, themes: themesOf(s === 'direct' ? 'relieves dryness' : 'pH balance'), flags: [] })) });
  it('review coverage is 0 of N when nothing is signed off, and support coverage is N/A', () => {
    const m = evidenceMetrics([rec('A', ['direct', 'brand_reported'])], [rec('B', ['direct'])]);
    expect([m.reviewCoverage.num, m.reviewCoverage.den]).toEqual([0, 2]);
    expect(m.directCoverage.value).toBeNull();
    expect(m.supportCoverage.value).toBeNull();
    expect(m.draft.direct.value).toBe(0.5);
  });
  it('claim differentiation counts themes absent from every peer', () => {
    const l = claimLandscape([rec('A', ['direct'])], [rec('B', ['brand_reported'])]);
    expect(l.rows.find((r) => r.theme === 'moisture').unique).toBe(true);
    expect(l.differentiation.value).toBe(1);
  });
});

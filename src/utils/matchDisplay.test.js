import { describe, it, expect } from 'vitest';
import { tierOf, tierWord, shortNeedLabel, needHeadline, matchBadge, needBreakdown, confidenceNotes, exclusionLines, claimForBadge, isClaimBlocked, whyMatch, PROFILE_HINT, BASED_ON_LINE } from './matchDisplay';

const details = (over = {}) => ({
  matchStatus: 'scored', eligible: true, percent: 82, needId: 'pain.menstrual_cramp', tier: 'excellent',
  needMatches: [
    { needId: 'pain.menstrual_cramp', label: 'Cramps or period pain', phrase: 'period cramps', score: 82, tier: 'excellent', relevant: true, confidenceReasons: [{ code: 'pregnancy_unknown' }] },
    { needId: 'vaginal.dryness', label: 'Vaginal dryness', phrase: 'vaginal dryness', score: 41, tier: 'browse', relevant: true, confidenceReasons: [] },
    { needId: 'skin.acne', label: 'Acne', phrase: 'acne', score: 0, tier: 'browse', relevant: false, confidenceReasons: [] },
  ],
  ...over,
});

describe('matchDisplay', () => {
  it('uses the engine tiers and words', () => {
    expect([80, 65, 50, 49].map(tierOf)).toEqual(['excellent', 'strong', 'exploratory', 'browse']);
    expect(tierWord('exploratory')).toBe('Worth a look');
    expect(tierWord(undefined, 66)).toBe('Strong');
  });

  it('leads with the need and lists every selected need', () => {
    expect(shortNeedLabel('Cramps or period pain')).toBe('Cramps');
    expect(needHeadline(82, 'period cramps')).toBe('82% for period cramps');
    expect(needBreakdown(details()).map((r) => `${r.short} ${r.score}`)).toEqual(['Cramps 82', 'Vaginal dryness 41', 'Acne 0']);
  });

  it('card badge only at 50+ with a profile', () => {
    expect(matchBadge(details())).toMatchObject({ percent: 82, phrase: 'period cramps', label: '82% for period cramps', basedOn: 'Based on what you\u2019ve shared', restricted: false });
    expect(matchBadge(details({ percent: 49 }))).toBe(null);
    expect(matchBadge(details({ matchStatus: 'no-profile', percent: null }))).toBe(null);
    expect(matchBadge(details({ matchStatus: 'excluded', eligible: false, percent: 0 }))).toBe(null);
  });

  it('confidence notes and exclusion reasons in plain words', () => {
    expect(confidenceNotes(details())).toEqual(['Pregnancy safety not on file']);
    expect(exclusionLines({ excludedBecause: ['You said this made things worse'] })).toEqual(['Not shown because you said this made things worse']);
  });

  it('never shows a claim badge the engine blocked', () => {
    expect(claimForBadge('Good if you avoid fragrance')).toBe('fragrance_free');
    expect(claimForBadge('Hormone-free')).toBe('hormones_free');
    expect(claimForBadge('Pregnancy-safe')).toBe('pregnancy_safe');
    expect(isClaimBlocked('Good if you avoid fragrance', ['fragrance_free'])).toBe(true);
    expect(isClaimBlocked('Latex-free', ['latex_free'])).toBe(true);
    expect(isClaimBlocked('Organic', ['fragrance_free'])).toBe(false);
    expect(isClaimBlocked('Good if you avoid fragrance', [])).toBe(false);
  });
});

describe('matchDisplay ASK2', () => {
  it('a shelf badge names the shelf need and its score', () => {
    const d = details();
    expect(matchBadge(d, { needId: 'vaginal.dryness' })).toBe(null); // 41 is below the badge bar
    const d2 = details({ needMatches: [...d.needMatches.slice(0, 1), { ...d.needMatches[1], score: 64, tier: 'exploratory' }] });
    expect(matchBadge(d2, { needId: 'vaginal.dryness' })).toMatchObject({ percent: 64, needId: 'vaginal.dryness', label: '64% for vaginal dryness' });
  });

  it('why view lists actual inputs and a soft profile hint only when confidence is limited', () => {
    const w = whyMatch(details({ confidence: 'medium', basedOn: [{ kind: 'need', text: 'Night sweats (you selected)' }], reasonDetails: [{ component: 'primaryGoal', text: 'Matches the night sweats you selected' }] }));
    expect(w.basedOn).toEqual(['Night sweats (you selected)']);
    expect(w.reasons).toEqual(['Matches the night sweats you selected']);
    expect(w.hint).toBe(PROFILE_HINT);
    expect(whyMatch(details({ confidence: 'high' })).hint).toBe(null);
    expect(BASED_ON_LINE).toBe('Based on what you’ve shared');
  });

  it('restricted matches say a safety detail is needed', () => {
    const w = whyMatch(details({ eligibility: 'restricted', missingSafetyText: ['what medicines or supplements you take'] }));
    expect(w.restricted).toBe(true);
    expect(w.missing).toEqual(['what medicines or supplements you take']);
    expect(matchBadge(details({ eligibility: 'restricted' })).restricted).toBe(true);
  });
});

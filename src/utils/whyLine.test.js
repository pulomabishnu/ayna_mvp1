import { describe, it, expect } from 'vitest';
import { whyLine, whyFirstLine, whyClauses } from './whyLine.js';
import { getRecommendationMatchesAndRest, getProductMatchDetailsForProduct, getProductById, ALL_PRODUCTS } from '../data/products.js';

const d = (over = {}) => ({
  matchStatus: 'scored', eligible: true, eligibility: 'eligible', percent: 82, needId: 'menstrual.heavy',
  needMatches: [{ needId: 'menstrual.heavy', phrase: 'heavy periods', score: 82, relevant: true }],
  reasonDetails: [{ text: 'Matches the heavy periods you selected' }, { text: 'High capacity for heavy flow' }, { text: 'Within your budget' }],
  outputs: { evidence: 'product_specific' },
  ...over,
});

describe('whyLine', () => {
  it('leads with her need and adds one real reason', () => {
    expect(whyLine({}, d())).toBe('For your heavy periods, holds a heavy flow');
    expect(whyLine({}, d(), { max: 3 })).toBe('For your heavy periods, holds a heavy flow, within your budget');
    // Never claims studies from the engine's loose evidence level.
    expect(whyLine({}, d(), { max: 5 })).not.toMatch(/stud/);
  });

  it('says "another option" for secondary matches', () => {
    expect(whyLine({}, d({ reasonDetails: [{ text: 'A secondary option for the heavy periods you selected' }], outputs: {} }))).toBe('Another option for your heavy periods');
  });

  it('never shows a percent, a negative reason, or an unscored match', () => {
    const line = whyLine({}, d({ reasonDetails: [{ text: 'Matches the heavy periods you selected' }, { text: 'Above your usual budget' }], outputs: {} }));
    expect(line).toBe('For your heavy periods');
    expect(line).not.toMatch(/%/);
    // Under 50 still gets a line (it sits beside "Partial fit", never a number).
    expect(whyLine({}, d({ percent: 40 }))).toBe('For your heavy periods, holds a heavy flow');
    expect(whyLine({}, d({ percent: 0 }))).toBe('');
    expect(whyLine({}, d({ matchStatus: 'no-profile' }))).toBe('');
    // Restricted (a safety detail missing) still says why it fits; only excluded gets nothing.
    expect(whyLine({}, d({ eligibility: 'restricted' }))).toBe('For your heavy periods, holds a heavy flow');
    expect(whyLine({}, d({ eligibility: 'excluded' }))).toBe('');
    expect(whyLine({ userAdded: true }, d())).toBe('');
  });

  it('skips reasons it has no plain words for instead of guessing', () => {
    expect(whyClauses(d({ reasonDetails: [{ text: 'Something new from the engine' }], outputs: {} }))).toEqual([]);
  });

  it('works on real engine output, with no percent in any line', () => {
    const q = { age: 24, lifeStageSelections: ['I have regular periods'], supportSelections: ['Cramps or period pain'], priceRange: ['Under $25'] };
    const { matches } = getRecommendationMatchesAndRest(q);
    expect(matches.length).toBeGreaterThan(0);
    for (const p of matches.slice(0, 5)) {
      const line = whyLine(p, getProductMatchDetailsForProduct(p, q));
      expect(line).toMatch(/^(For|Another option for) your period cramps/);
      expect(line).not.toMatch(/\d|%|—/);
    }
  });
});

describe('whyLine is never empty for a scored match', () => {
  it('falls back to the need label, and to "another option" for a secondary relationship', () => {
    expect(whyLine({}, d({ needMatches: [{ needId: 'cycle.pms', label: 'PMS symptoms', relationship: 'secondary' }], needId: 'cycle.pms', reasonDetails: [], outputs: {} }))).toBe('Another option for your PMS symptoms');
    expect(whyLine({}, d({ needMatches: [{ needId: 'cycle.pms', label: 'PMS symptoms' }], needId: 'cycle.pms', reasonDetails: [{ text: 'Something new from the engine' }], outputs: {} }))).toBe('For your PMS symptoms');
  });
  it('real engine: vitex for PMS (a Partial fit with a missing safety detail) gets a plain line', () => {
    const q = { age: 24, lifeStageSelections: ['I get periods regularly'], supportSelections: ['PMS symptoms'] };
    const p = getProductById('p-vitex');
    expect(whyLine(p, getProductMatchDetailsForProduct(p, q))).toBe('Another option for your PMS symptoms');
  });
  it('real engine: every scored, non-excluded match across several profiles has a line', () => {
    const qs = [
      { age: 24, lifeStageSelections: ['I get periods regularly'], supportSelections: ['PMS symptoms'] },
      { age: 30, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping', 'Acne'] },
      { age: 40, lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Hot flashes', 'Vaginal dryness'] },
      { age: 24, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Burning with urination', 'Heavy periods'] },
    ];
    let n = 0;
    for (const q of qs) for (const p of ALL_PRODUCTS) {
      const det = getProductMatchDetailsForProduct(p, q);
      if (!det || det.matchStatus !== 'scored' || !(det.percent >= 1) || det.eligible === false || det.eligibility === 'excluded' || p.userAdded) continue;
      n += 1;
      const line = whyLine(p, det);
      expect(line, p.id).toMatch(/^(For|Another option for|Loosely related to) your \S/);
      expect(line).not.toMatch(/Why ayna picked/);
    }
    expect(n).toBeGreaterThan(20);
  });
});

describe('whyFirstLine', () => {
  const a = { product: { name: 'Cup A' }, details: d({ percent: 90 }) };
  const b = { product: { name: 'Pad B' }, details: d({ percent: 70, reasonDetails: [{ text: 'Matches the heavy periods you selected' }, { text: 'Within your budget' }], outputs: {} }) };
  it('names the top-ranked product and the reason the others lack', () => {
    expect(whyFirstLine([b, a])).toBe('Cup A ranks first for you: holds a heavy flow.');
  });
  it('handles ties, a single scored product, and nothing scored', () => {
    expect(whyFirstLine([a, { ...b, details: d({ percent: 90 }) }])).toBe('These fit what you told us about the same.');
    expect(whyFirstLine([a, { product: { name: 'X' }, details: d({ percent: 0 }) }])).toBe('Cup A is the only one here that matches what you told us.');
    expect(whyFirstLine([{ product: { name: 'X' }, details: null }])).toBe('');
  });
});

describe('whyLineForPick', () => {
  it('names the shelf need and uses the pick reasons', async () => {
    const { whyLineForPick } = await import('./whyLine.js');
    expect(whyLineForPick({ needId: 'x', score: 70, explanations: ['Matches the cramps you selected', 'Within your budget'] }, 'period cramps')).toBe('For your period cramps, within your budget');
    expect(whyLineForPick({ needId: 'x', score: 0, explanations: [] }, 'cramps')).toBe('');
  });
});

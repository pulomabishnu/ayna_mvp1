import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getProfileMatchPercentForProduct, getProductMatchDetailsForProduct } from '../data/products.js';
import { matchPercentFor } from '../mobile/utils/matchScore.js';
import { matchPercent, matchBreakdown } from './matchBreakdown.js';
import { shownMatchPercent, matchText, MAX_SHOWN_PERCENT, behaviorFrom } from '../utils/matchDisplay.js';
import { matchBreakdownFor } from '../components/pdp/decision.js';

// PDP build brief, "Ongoing: match scores": the website (getProfileMatchPercentForProduct)
// and the app (matchPercentFor) must print the same number for the same product and
// profile. Both now read matchPercent / matchPercentFromDetails (one engine call).
const base = { personalizationCompleted: true, takesCurrent: 'No', allergyStatus: 'No', safetyConcern: 'No' };
const quiz = (over) => ({ fullHealthIntake: { ...base, ...over }, personalizationCompleted: true });
const PERSONAS = {
  heavyPeriods: quiz({ age: '24', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Heavy periods', 'Period product support', 'Cramps or period pain'], periodFlow: 'Heavy' }),
  perimenopause: quiz({ age: '47', lifeStageSelections: ['Perimenopause'], supportSelections: ['Hot flashes or night sweats', 'Sleep'] }),
  budgetStudent: quiz({ age: '19', lifeStageSelections: ['I get periods regularly'], supportSelections: ['Period product support', 'Acne or skin changes'], periodFlow: 'Moderate', priceRange: ['Under $25'] }),
};

describe('website and app print the same match', () => {
  for (const [name, q] of Object.entries(PERSONAS)) {
    it(`${name}: same number for every product in the catalog`, () => {
      let scored = 0;
      for (const p of ALL_PRODUCTS) {
        const web = getProfileMatchPercentForProduct(p, q);
        const app = matchPercentFor(p, q);
        expect(app, p.id).toBe(web);
        expect(matchPercent(p, q), p.id).toBe(web);
        // With the app's matchOpts (saved / Not for me) both still agree.
        const opts = behaviorFrom({ saved: { [p.id]: true }, omitted: {}, inEcosystem: [] });
        expect(matchPercentFor(p, q, opts), p.id).toBe(getProfileMatchPercentForProduct(p, q, null, opts));
        if (web != null) scored += 1;
      }
      expect(scored).toBeGreaterThan(5);
    }, 240000);
  }
});

describe('display cap at 97%', () => {
  it('prints at most 97 and leaves the engine value alone', () => {
    expect(MAX_SHOWN_PERCENT).toBe(97);
    expect(shownMatchPercent(99)).toBe(97);
    expect(shownMatchPercent(97.4)).toBe(97);
    expect(shownMatchPercent(96)).toBe(96);
    expect(shownMatchPercent(49)).toBeNull();
    expect(matchText(99)).toBe('97% match');
  });

  it('the Why explainer points add up to the number shown (capped at 97 when needed)', () => {
    let capped = 0;
    let checked = 0;
    for (const q of Object.values(PERSONAS)) {
      for (const p of ALL_PRODUCTS) {
        const d = getProductMatchDetailsForProduct(p, q);
        if (d.matchStatus !== 'scored' || !(d.percent >= 50) || !d.v2?.parts) continue;
        const bd = matchBreakdownFor(p, d);
        const shown = shownMatchPercent(d.percent);
        expect(bd.shown).toBe(shown);
        expect(bd.percent).toBe(d.percent);
        const sum = [...bd.raised, ...bd.lowered].reduce((s, x) => s + (x.points || 0), 0);
        expect(sum, p.id).toBe(shown);
        const capRow = bd.lowered.find((x) => x.cap);
        if (d.percent > 97) { expect(capRow, p.id).toBeTruthy(); capped += 1; } else expect(capRow).toBeUndefined();
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(20);
    // The breakdown object itself keeps the engine percent for ranking.
    const any = ALL_PRODUCTS.find((p) => (getProductMatchDetailsForProduct(p, PERSONAS.heavyPeriods).percent || 0) > 97);
    if (any) expect(matchBreakdown(any, PERSONAS.heavyPeriods).percent).toBeGreaterThan(97);
    expect(capped).toBeGreaterThanOrEqual(0);
  }, 240000);
});

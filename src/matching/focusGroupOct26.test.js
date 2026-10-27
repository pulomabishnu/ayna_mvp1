// Oct 26 focus group: recommendations too concentrated.
// - "When I say I have cramps, everything I get is a heating pad" and "I put
//   the highest number of picks and still got one result".
// Cause: v2 allowed ONE product per type (category) per need, and every cramp
// product that clears the bar is category "cramp-relief" (heat pads, heat
// wraps and the SootheHer pod alike), so a 5-picks shelf showed one heating
// pad. 12 total slots also cut a 5-per-need choice short at three needs.
// Fix (list level only, no percent changes): a need may take a SECOND product
// of a type when no other type is left (strong fits only, never a third), and
// For you lets a strong match of another category ahead of a need's third
// same-category product.
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { buildEcosystemV2, scoreProductV2, V2 } from './v2.js';
import { varyCategories, FOR_YOU } from './forYou.js';
import { isRecommendable } from './eligibility.js';

const intake = (over) => ({ ...EMPTY, age: '24', lifeStageSelections: ['I get periods regularly'], ...over });
const CATALOG = ALL_PRODUCTS.filter((p) => isRecommendable(p));
const eco = (over, opts = {}) => {
  const up = buildUserProfile(intake(over), { catalog: ALL_PRODUCTS });
  return { up, eco: buildEcosystemV2(up, CATALOG, opts) };
};
const cat = (id) => buildProductProfile(ALL_PRODUCTS.find((p) => p.id === id))?.category;
const shelfOf = (e, needId) => e.shelves.find((s) => s.needId === needId);

describe('cramps with the most picks: more than one product, at most two of a kind', () => {
  const { up, eco: e } = eco({ supportSelections: ['Cramps or period pain'], recommendedProductsPerArea: 5 });
  const shelf = shelfOf(e, 'pain.menstrual_cramp');

  it('shows more than one strong pick when more qualify, never three of one category', () => {
    expect(shelf.picks.length).toBeGreaterThanOrEqual(2);
    const counts = {};
    for (const p of shelf.picks) counts[cat(p.productId)] = (counts[cat(p.productId)] || 0) + 1;
    for (const n of Object.values(counts)) expect(n).toBeLessThanOrEqual(V2.maxPerTypePerNeed);
  });

  it('a repeated category is a strong fit and from another format or brand', () => {
    const [first, ...rest] = shelf.picks;
    for (const p of rest.filter((x) => cat(x.productId) === cat(first.productId))) {
      expect(p.v2.fit).toBeGreaterThanOrEqual(V2.strongFloor);
      const a = buildProductProfile(ALL_PRODUCTS.find((x) => x.id === first.productId));
      const b = buildProductProfile(ALL_PRODUCTS.find((x) => x.id === p.productId));
      expect(a.formats.join() !== b.formats.join() || a.brand.key !== b.brand.key).toBe(true);
    }
  });

  it('every pick keeps the exact percent the product page shows for that need', () => {
    for (const p of shelf.picks) {
      const pp = buildProductProfile(ALL_PRODUCTS.find((x) => x.id === p.productId));
      expect(p.score, p.productId).toBe(scoreProductV2(pp, up).needs.find((n) => n.needId === shelf.needId).score);
    }
  });

  it('one pick chosen means one pick shown', () => {
    const one = shelfOf(eco({ supportSelections: ['Cramps or period pain'], recommendedProductsPerArea: 1 }).eco, 'pain.menstrual_cramp');
    expect(one.picks).toHaveLength(1);
  });

  it('the quiz reveal seed (getEcosystemSeedFromQuiz) carries the same picks', () => {
    const seed = getEcosystemSeedFromQuiz({ fullHealthIntake: intake({ supportSelections: ['Cramps or period pain'], recommendedProductsPerArea: 5 }), personalizationCompleted: true }, null, { engine: 'v2' });
    expect(seed.shelves.find((s) => s.needId === 'pain.menstrual_cramp').productIds.length).toBeGreaterThanOrEqual(2);
  });
});

describe('repeat fill never displaces variety and never lowers the bar', () => {
  it('period support with 5 picks: five different kinds of product, no repeats', () => {
    const shelf = shelfOf(eco({ supportSelections: ['Period product support'], recommendedProductsPerArea: 5 }).eco, 'period.product_support');
    expect(shelf.picks).toHaveLength(5);
    expect(new Set(shelf.picks.map((p) => cat(p.productId))).size).toBe(5);
  });

  it('a need with no strong fit stays short (hormone symptoms): nothing under the bar is added', () => {
    const shelf = shelfOf(eco({ supportSelections: ['Hormone-related symptoms'], recommendedProductsPerArea: 5 }).eco, 'hormonal.general');
    for (const p of shelf.picks.filter((x) => !x.v2?.fallback)) expect(p.v2.fit).toBeGreaterThanOrEqual(V2.ecosystemFloor);
    expect(shelf.picks.length).toBeLessThanOrEqual(5);
  });

  it('many needs with 5 picks each: no shelf goes over her number, and the 12-slot total no longer cuts it short', () => {
    const needs = ['Period product support', 'Cramps or period pain', 'Acne', 'Constipation', 'Trouble sleeping'];
    const big = eco({ supportSelections: needs, recommendedProductsPerArea: 5 }).eco;
    const capped = eco({ supportSelections: needs, recommendedProductsPerArea: 5 }, { slots: 12 }).eco;
    const total = (x) => x.shelves.reduce((n, s) => n + (s.fallback ? 0 : s.picks.length), 0);
    expect(total(big)).toBeGreaterThanOrEqual(total(capped));
    for (const s of big.shelves) expect(s.picks.length).toBeLessThanOrEqual(5);
  });
});

describe('For you category variety (varyCategories)', () => {
  const profiles = { pad1: 'pad', pad2: 'pad', pad3: 'pad', pad4: 'pad', tampon1: 'tampon', cup1: 'cup', supp1: 'supplement' };
  const profileOf = (id) => ({ category: profiles[id] });
  const row = (productId, score, needId = 'period.product_support') => ({ r: { productId, score, needId }, score });
  const ids = (rows) => rows.map((x) => x.r.productId);

  it('a strong match of another category goes ahead of the third pad', () => {
    const out = varyCategories([row('pad1', 92), row('pad2', 92), row('pad3', 92), row('pad4', 90), row('tampon1', 88), row('cup1', 80)], profileOf);
    expect(ids(out)).toEqual(['pad1', 'pad2', 'tampon1', 'cup1', 'pad3', 'pad4']);
  });

  it('never pulls a weaker-than-strong match ahead, and keeps every row', () => {
    const rows = [row('pad1', 92), row('pad2', 92), row('pad3', 92), row('supp1', FOR_YOU.strongScore - 1)];
    expect(ids(varyCategories(rows, profileOf))).toEqual(['pad1', 'pad2', 'pad3', 'supp1']);
  });

  it('only varies within one need, and the scores travel with their rows', () => {
    const rows = [row('pad1', 92), row('pad2', 92), row('pad3', 92), row('cup1', 90, 'other.need')];
    const out = varyCategories(rows, profileOf);
    expect(ids(out)).toEqual(['pad1', 'pad2', 'pad3', 'cup1']);
    expect(out.map((x) => x.r.score)).toEqual([92, 92, 92, 90]);
  });
});

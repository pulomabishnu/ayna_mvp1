import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, getProfileMatchPercentForProduct, getEcosystemSeedFromQuiz, getRecommendationMatchesAndRest } from '../data/products.js';
import { matchBadge, needBreakdown } from '../utils/matchDisplay.js';
import { shownMatchPercent, sortByBestMatch } from '../utils/bestMatchSort.js';
import { compareRows } from '../components/pdp/commerce.js';
import { matchPercentFor } from '../mobile/utils/matchScore.js';
import ProductCard from '../mobile/components/ProductCard.jsx';
import WhyMatchScreen from '../mobile/screens/WhyMatchScreen.jsx';
import { buildProductProfile } from './productProfile.js';
import { buildUserProfile } from './userProfile.js';
import { scoreProductV2, scoreV2, evidenceGrade, v2Percent, BAND_TIER, bandFor, V2 } from './v2.js';
import { MAX_SCORE } from './score.js';

// Founder decision, Oct 24: one "NN% match" per product, from the v2 engine,
// on every surface (card, shelf, product page, Why this matches, Compare,
// Swipe, Browse, Ecosystem, community).
const quiz = (intake) => ({ fullHealthIntake: { personalizationCompleted: true, ...intake }, personalizationCompleted: true });
const PERSONAS = {
  pms: quiz({ lifeStageSelections: ['I get periods regularly'], supportSelections: ['PMS symptoms'], age: 28, takesCurrent: 'No' }),
  heavyLatex: quiz({ lifeStageSelections: ['I get periods regularly'], supportSelections: ['Heavy periods'], allergyStatus: 'Yes', allergyItems: ['Latex'], age: 25 }),
  drynessFragrance: quiz({ lifeStageSelections: ['I am in menopause'], supportSelections: ['Vaginal dryness'], avoidIngredients: ['Fragrance'], age: 52 }),
  crampsHeavy: quiz({ lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Heavy periods'], age: 27, budget: ['Under $15'] }),
  peri: quiz({ lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Hot flashes', 'Trouble sleeping', 'Anxiety'], age: 46 }),
};
const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const pctIn = (html) => { const m = /(\d+)(?:<small>)?%(?:<\/small>)? ?(match|for)?/.exec(html); return m ? Number(m[1]) : null; };
const ringPct = (html) => { const m = /ayna-match-ring[^>]*><span>(\d+)<small>%/.exec(html); return m ? Number(m[1]) : null; };

describe('one match percent per product (v2) on every surface', () => {
  for (const [name, q] of Object.entries(PERSONAS)) {
    it(`${name}: badge, product page, Why, Compare, Best match and Ecosystem agree`, () => {
      const seed = getEcosystemSeedFromQuiz(q);
      const picks = seed.shelves.flatMap((s) => s.picks.map((p) => ({ ...p, shelfNeed: s.needId })));
      // Plus a few catalog matches that are not on a shelf.
      const extra = getRecommendationMatchesAndRest(q).matches.slice(0, 6).map((p) => ({ productId: p.id }));
      const ids = [...new Set([...picks, ...extra].map((p) => p.productId))];
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) {
        const product = byId.get(id);
        const d = getProductMatchDetailsForProduct(product, q);
        expect(d.engine).toBe('v2');
        // The percent is v2's fit for her best need, 0..99.
        expect(d.percent).toBe(v2Percent(d.v2));
        expect(d.percent).toBeLessThanOrEqual(MAX_SCORE);
        expect(d.percent).toBe(Math.max(...d.needMatches.map((m) => m.score)));
        const shown = matchBadge(d)?.percent ?? null;
        if (shown != null) expect(shown).toBe(d.percent);
        // Product page (app reads matchPercentFor; web reads the same details).
        expect(matchPercentFor(product, q)).toBe(d.percent > 0 ? d.percent : null);
        expect(getProfileMatchPercentForProduct(product, q)).toBe(d.percent);
        // App card and shelf card.
        const card = renderToStaticMarkup(<ProductCard product={product} quizAnswers={q} onClick={() => {}} />);
        const shelfCard = renderToStaticMarkup(<ProductCard product={product} quizAnswers={q} needId={picks.find((p) => p.productId === id)?.shelfNeed || null} onClick={() => {}} />);
        if (shown != null) { expect(pctIn(card)).toBe(shown); expect(pctIn(shelfCard)).toBe(shown); }
        // Why this matches.
        if (d.percent > 0) expect(ringPct(renderToStaticMarkup(<WhyMatchScreen product={product} quizAnswers={q} onBack={() => {}} />))).toBe(d.percent);
        // Compare.
        const row = compareRows([product], { matchFor: (p) => getProfileMatchPercentForProduct(p, q) }).find((r) => r.label === 'Your match');
        expect(row.values[0]).toBe(d.percent > 0 ? `${d.percent}%` : 'No clear match');
        // Best match sorts by the card's number.
        expect(shownMatchPercent(d)).toBe(shown ?? 0);
        // Per-need rows (Why screen breakdown) carry v2 per-need scores.
        for (const m of d.needMatches) if (m.v2) expect(m.score).toBe(v2Percent(m.v2));
        expect(needBreakdown(d).find((r) => r.needId === d.needId)?.score ?? 0).toBe(d.percent);
      }
      // Ecosystem shelves: each pick's number is the v2 number for that need,
      // the same one the product page lists for that need.
      for (const p of picks) {
        const d = getProductMatchDetailsForProduct(byId.get(p.productId), q);
        const forNeed = d.needMatches.find((m) => m.needId === p.shelfNeed);
        expect(p.score, `${p.productId} on ${p.shelfNeed}`).toBe(forNeed.score);
        expect(p.score).toBeLessThanOrEqual(d.percent);
      }
    });
  }

  it('Best match order is the order of the shown percents', () => {
    const q = PERSONAS.crampsHeavy;
    const list = ALL_PRODUCTS.slice(0, 120);
    const sorted = sortByBestMatch(list, (p) => shownMatchPercent(getProductMatchDetailsForProduct(p, q)));
    const shown = sorted.map((p) => shownMatchPercent(getProductMatchDetailsForProduct(p, q)));
    expect([...shown].sort((a, b) => b - a)).toEqual(shown);
  });

  it('preferences never lower the shown percent (telling ayna more never makes matches look worse)', () => {
    const base = { lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Heavy periods'], age: 27 };
    const more = { ...base, budget: ['Under $15'], preferredFormats: ['Capsules'], trustedBrands: ['Thinx'] };
    for (const p of ALL_PRODUCTS) {
      const a = getProductMatchDetailsForProduct(p, quiz(base));
      const b = getProductMatchDetailsForProduct(p, quiz(more));
      if (a.matchStatus === 'scored' && b.matchStatus === 'scored') expect(b.percent, p.id).toBeGreaterThanOrEqual(a.percent);
    }
  });

  it('bands map to the existing tier words', () => {
    expect(BAND_TIER).toEqual({ strong: 'excellent', good: 'strong', partial: 'exploratory', none: 'browse' });
    const d = getProductMatchDetailsForProduct(byId.get('p-thermacare'), quiz({ supportSelections: ['Cramps or period pain'] }));
    expect(d.tier).toBe(BAND_TIER[bandFor(d.percent / 100, d.confidenceScore)]);
  });

  it('the details say it is an ayna match, not a probability it works', () => {
    const d = getProductMatchDetailsForProduct(byId.get('p-thermacare'), quiz({ supportSelections: ['Cramps or period pain'] }));
    expect(d.matchKind).toBe('ayna_match');
    expect(d.matchMeaning).toMatch(/not_a_probability/);
  });

  it('an unreviewed research row never lifts a match (vitex: secondary relevance stays secondary)', () => {
    const d = getProductMatchDetailsForProduct(byId.get('p-vitex'), PERSONAS.pms);
    expect(d.v2.needFit).toBeLessThanOrEqual(V2.S.secondary);
  });

  it('?match=v1 still gives the old numbers for comparison', () => {
    const q = PERSONAS.pms;
    const p = byId.get('p-vitex');
    const v1 = getProductMatchDetailsForProduct(p, q, null, { engine: 'v1' });
    const v2 = getProductMatchDetailsForProduct(p, q);
    expect(v1.engine).toBe('v1');
    expect(v2.v1Percent).toBe(v1.percent);
  });
});

describe('every catalog product is scorable by v2', () => {
  it('each product x need it serves gets a grade and a finite fit (drafts where no reviewed grade exists)', () => {
    const up = buildUserProfile({ supportSelections: ['Cramps or period pain'] }, { catalog: ALL_PRODUCTS });
    let pairs = 0;
    for (const product of ALL_PRODUCTS) {
      const pp = buildProductProfile(product);
      const needIds = Object.keys(pp.health_need_relevance || {});
      for (const needId of needIds) {
        const grade = evidenceGrade(pp, needId);
        expect(['A', 'B', 'C'], `${product.id} ${needId}`).toContain(grade);
        const rel = pp.health_need_relevance[needId];
        const v2 = scoreV2(pp, { needId, relationship: rel.relationship || 'secondary', components: {}, points: {}, outputs: {}, confidence: 1 }, new Set(needIds));
        expect(Number.isFinite(v2.fit), `${product.id} ${needId}`).toBe(true);
        // Unreviewed grades and research rows only hold a match down (NEED_MAP_REVIEWED is empty).
        expect(v2.needFit, `${product.id} ${needId}`).toBeLessThanOrEqual(V2.S[rel.relationship || 'secondary'] || 0);
        expect(v2Percent(v2)).toBeGreaterThanOrEqual(0);
        expect(v2Percent(v2)).toBeLessThanOrEqual(MAX_SCORE);
        pairs += 1;
      }
      const res = scoreProductV2(pp, up);
      for (const r of res.needs) expect(Number.isFinite(r.score), product.id).toBe(true);
    }
    expect(pairs).toBeGreaterThan(100);
  });
});

describe('v2 respects her product history (intake.productHistory) like v1', () => {
  const thermacare = byId.get('p-thermacare');
  const base = { supportSelections: ['Cramps or period pain'], lifeStageSelections: ['I get periods regularly'], age: 30 };
  const withHistory = (h) => quiz({ ...base, productHistory: [{ name: thermacare.name, ...h }] });
  const pct = (q) => getProductMatchDetailsForProduct(thermacare, q).percent;
  const none = pct(quiz(base));

  it('made it worse, a serious reaction or a clinician stop excludes it', () => {
    for (const h of [{ worked: 'Made it worse' }, { reaction: 'Serious' }, { stopReasons: ['A clinician recommended stopping it'] }]) {
      const d = getProductMatchDetailsForProduct(thermacare, withHistory(h));
      expect(d.matchStatus).toBe('excluded');
      expect(d.percent).toBe(0);
      expect(getEcosystemSeedFromQuiz(withHistory(h)).shelves.flatMap((s) => s.productIds)).not.toContain(thermacare.id);
    }
  });

  it('side effects and "did not help" push it down', () => {
    expect(none).toBeGreaterThan(0);
    for (const h of [{ reaction: 'Mild' }, { stopReasons: ['I had side effects or a reaction'] }, { worked: 'No difference' }, { stopReasons: ['It did not help'] }]) {
      const d = getProductMatchDetailsForProduct(thermacare, withHistory(h));
      expect(d.matchStatus).toBe('scored');
      expect(d.percent, JSON.stringify(h)).toBeLessThan(none);
      expect(d.v2.experience).toBeLessThan(0);
      expect(d.v2.experience).toBeGreaterThanOrEqual(-V2.experienceDownCap);
    }
  });

  it('helped counts as experience, within experienceCap', () => {
    for (const h of [{ worked: 'Helped a lot' }, { worked: 'Helped somewhat' }]) {
      const d = getProductMatchDetailsForProduct(thermacare, withHistory(h));
      expect(d.v2.experience).toBeGreaterThan(0);
      expect(d.v2.experience).toBeLessThanOrEqual(V2.experienceCap);
      expect(d.percent).toBeGreaterThanOrEqual(none);
      expect(d.percent - none).toBeLessThanOrEqual(Math.round(V2.experienceCap * 100));
      expect(d.v2.health).toBe(getProductMatchDetailsForProduct(thermacare, quiz(base)).v2.health);
    }
  });

  it('no history means no experience change (no hidden baseline)', () => {
    expect(getProductMatchDetailsForProduct(thermacare, quiz(base)).v2.experience).toBe(0);
  });

  it('the ecosystem uses the same history-adjusted number', () => {
    const q = withHistory({ reaction: 'Mild' });
    const pick = getEcosystemSeedFromQuiz(q).shelves.flatMap((s) => s.picks).find((p) => p.productId === thermacare.id);
    if (pick) expect(pick.score).toBe(pct(q));
  });
});

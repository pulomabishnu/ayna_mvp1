import { getProductMatchDetailsForProduct, getSelectedNeeds } from '../data/products.js';
import { MIN_BADGE_SCORE } from './matchDisplay.js';

/*
 * How big is her ecosystem? One answer for every surface (walkthrough P0-5:
 * the app's Ecosystem hero said 4 products, Wrapped said 22 picks, the website
 * said 22 products, and they used "needs have picks" vs "needs covered").
 * Used by the app's Ecosystem hero, Wrapped, and the website's Ecosystem.
 *
 * Definitions (keep these words everywhere):
 *   products       every product in her ecosystem, including "Earlier picks".
 *   needs          the needs she selected in the quiz (one shelf each).
 *   needsCovered   of those, how many have at least one of her products that
 *                  matches that need at 50% or more (the same bar as a match
 *                  badge and a shelf), for a product she can use (not
 *                  excluded, not waiting on a safety answer).
 * Phrase: "3 of 4 needs covered" (needsCoveredLine).
 */
export function ecosystemCounts(products, quizAnswers, { healthProfile = null, matchOpts } = {}) {
  const list = (Array.isArray(products) ? products : Object.values(products || {})).filter((p) => p && p.id);
  const seen = new Set();
  const unique = list.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
  let needs = [];
  try { needs = quizAnswers ? getSelectedNeeds(quizAnswers, healthProfile, matchOpts) : []; } catch { needs = []; }
  const needIds = needs.map((n) => n.id);
  const covered = new Set();
  if (needIds.length) {
    unique.forEach((p) => {
      const d = getProductMatchDetailsForProduct(p, quizAnswers, healthProfile, matchOpts);
      if (!d || d.matchStatus !== 'scored' || d.eligible === false || d.eligibility === 'restricted') return;
      (d.needMatches || []).forEach((m) => { if (m.relevant && m.score >= MIN_BADGE_SCORE) covered.add(m.needId); });
    });
  }
  const coveredNeedIds = needIds.filter((id) => covered.has(id));
  return { products: unique.length, needs: needIds.length, needsCovered: coveredNeedIds.length, coveredNeedIds };
}

export function productsLine(n) {
  return `${n} ${n === 1 ? 'product' : 'products'}`;
}

/** "3 of 4 needs covered" ("1 of 1 need covered"). */
export function needsCoveredLine({ needs, needsCovered }) {
  return `${needsCovered} of ${needs} ${needs === 1 ? 'need' : 'needs'} covered`;
}

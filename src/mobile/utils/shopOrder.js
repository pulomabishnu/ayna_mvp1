import { ALL_PRODUCTS, getRecommendationMatchesAndRest } from '../../data/products.js';
import { buildUserProfile, buildProductProfile, budgetFit } from '../../matching/index.js';

// Shop's default "All" order.
// - Guests (no quiz answers): one shuffle per app session, so the grid does
//   not reshuffle every time she comes back to Shop.
// - With quiz answers: the matching engine's own ranking first
//   (getRecommendationMatchesAndRest, the same engine Ecosystem uses), then
//   the rest of the catalog: within her budget, then over it, then products
//   built for a different life stage (e.g. a "Women 40+" perimenopause test
//   for a 24-year-old who picked regular periods), then products the engine
//   leaves out for her. Ties keep the session order.

const SEED_KEY = 'ayna_shop_order_seed_v1';
let memorySeed = null;

function sessionSeed() {
  try {
    const stored = Number(sessionStorage.getItem(SEED_KEY));
    if (Number.isInteger(stored) && stored > 0) return stored;
    const next = 1 + Math.floor(Math.random() * 2147483646);
    sessionStorage.setItem(SEED_KEY, String(next));
    return next;
  } catch {
    if (memorySeed == null) memorySeed = 1 + Math.floor(Math.random() * 2147483646);
    return memorySeed;
  }
}

// mulberry32: small seeded PRNG, so the same seed gives the same order.
function prng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates with a seeded generator: uniform, and repeatable for a seed. */
export function seededShuffle(list, seed) {
  const rand = prng(seed);
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** The catalog in this session's order (same order on every visit this session). */
export function stableShopOrder(products, seed = sessionSeed()) {
  return seededShuffle(Array.isArray(products) ? products : [], seed);
}

const MIDLIFE = ['perimenopause', 'menopause', 'postmenopause'];

/** True when a product is built for a life stage her answers clearly rule out. */
export function isForOtherLifeStage(product, userProfile) {
  const pp = buildProductProfile(product);
  const designedFor = Object.entries(pp?.life_stage || {}).filter(([, v]) => v === 'designed_for').map(([stage]) => stage);
  if (!designedFor.length) return false;
  const stages = userProfile?.physiology?.lifeStages || [];
  if (stages.some((stage) => designedFor.includes(stage))) return false;
  const age = userProfile?.physiology?.age;
  if (designedFor.every((stage) => MIDLIFE.includes(stage)) && age != null && age < 40) return true;
  return stages.length > 0;
}

/**
 * `products` in Shop's default order for her answers. `products` should
 * already be in the session order (stableShopOrder), which breaks ties.
 */
export function rankShopForProfile(products, quizAnswers, matchOpts) {
  if (!quizAnswers || !Array.isArray(products) || !products.length) return products;
  const { matches, others } = getRecommendationMatchesAndRest(quizAnswers, null, matchOpts);
  const matchIndex = new Map(matches.map((p, i) => [p.id, i]));
  const eligible = new Set(others.map((p) => p.id));
  const up = buildUserProfile(quizAnswers, { catalog: ALL_PRODUCTS });
  const budget = up?.shopping?.budget || null;
  const keyed = products.map((product, index) => {
    if (matchIndex.has(product.id)) return { product, tier: 0, order: matchIndex.get(product.id) };
    let tier;
    if (isForOtherLifeStage(product, up)) tier = 3;
    else if (!eligible.has(product.id)) tier = 4;
    else {
      const amount = buildProductProfile(product)?.price?.amount ?? null;
      const fit = budget ? budgetFit(amount, budget) : null;
      tier = fit == null || fit >= 0.85 ? 1 : 2;
    }
    return { product, tier, order: index };
  });
  keyed.sort((a, b) => (a.tier - b.tier) || (a.order - b.order));
  return keyed.map((k) => k.product);
}

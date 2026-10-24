/**
 * "What might help this week": up to four products for what her week
 * implies, each with one reason tied to her own data.
 *
 * What counts as a need this week (never a new diagnosis):
 * - her cycle: period on now, or due within 7 days -> cramps and period
 *   products (cramps can start a day or two before; MedlinePlus);
 *   luteal phase -> PMS-type needs, only if she chose them in the quiz;
 *   ovulation window coming -> ovulation tests, only if she chose fertility.
 * - her metrics: short nights (weekInsights sleep) -> sleep products;
 *   lower steps or heart changes -> energy products, only if she chose energy.
 * Needs she chose in the quiz rank first.
 *
 * Products: only ones already in her Ecosystem, then her matches. A product
 * fits a need when ayna's research grade (needMap.research, the same grade
 * the product page shows) lists it as primary or secondary for that need,
 * or, for products without a graded row, when its catalog category or tags
 * name the need. The evidence meter shows that grade and nothing else.
 */
import NEED_MAP_RESEARCH from '../data/matching/needMap.research.js';
import { withoutMedicines } from './medicineProduct.js';

const GRADED = NEED_MAP_RESEARCH.reduce((m, r) => m.set(`${r.product}|${r.need}`, r), new Map());

export const NEED_WORDS = {
  'pain.menstrual_cramp': 'cramps',
  'period.product_support': 'periods',
  'period.heavy': 'heavy periods',
  'sleep.trouble': 'sleep',
  'cycle.pms': 'PMS',
  'cycle.breast_tenderness': 'breast tenderness',
  'bloating.cycle_related': 'bloating',
  'mood.cycle_related': 'mood changes',
  'energy.fatigue': 'energy',
  'fertility.ovulation_tracking': 'tracking ovulation',
};

const PERIOD_CATEGORIES = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear']);
const tagged = (p, t) => (p?.tags || []).includes(t);
/** Fallback when a product has no graded row for the need. */
const FALLBACK = {
  'pain.menstrual_cramp': (p) => tagged(p, 'cramps') || ['cramp-relief', 'pain-relief'].includes(p?.category),
  'period.product_support': (p) => PERIOD_CATEGORIES.has(p?.category),
  'period.heavy': (p) => PERIOD_CATEGORIES.has(p?.category) && tagged(p, 'heavy-flow'),
  'sleep.trouble': (p) => tagged(p, 'sleep') || p?.category === 'sleep',
  'cycle.pms': (p) => tagged(p, 'pms'),
  'energy.fatigue': (p) => tagged(p, 'energy') || tagged(p, 'fatigue'),
  'fertility.ovulation_tracking': (p) => p?.category === 'diagnostics' && (tagged(p, 'fertility') || (p.healthFunctions || []).includes('fertility')),
};

const GRADE_LEVEL = { A: 3, B: 2, C: 1 };
export const LEVEL_WORD = ['', 'Limited evidence', 'Some evidence', 'Strong evidence'];

/** Does this product fit this need, and with what evidence level (0 = no grade on file)? */
export function fitFor(product, needId) {
  const row = GRADED.get(`${product?.id}|${needId}`);
  if (row && !row.grade) {
    // draft_unverified (no .gov source): it fits, but is not graded.
    return row.strength === 'primary' || row.strength === 'secondary' ? { level: 0, graded: false } : null;
  }
  if (row) return row.strength === 'primary' || row.strength === 'secondary' ? { level: GRADE_LEVEL[row.grade] || 0, graded: true } : null;
  if (FALLBACK[needId]?.(product)) {
    const s = String(product.evidenceStrength || '').toLowerCase();
    return { level: s === 'strong' ? 3 : s === 'moderate' || s === 'some' ? 2 : s === 'limited' ? 1 : 0, graded: false };
  }
  return null;
}

const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const inDays = (n) => (n <= 0 ? 'today' : n === 1 ? 'tomorrow' : `in about ${n} days`);

/** The needs this week implies, most relevant first, each with the "why now" half of the reason. */
export function weekNeeds({ ctx = {}, insights = [], needIds = [] } = {}) {
  const chosen = new Set(needIds);
  const out = [];
  const add = (needId, why, { onlyIfChosen = false } = {}) => {
    if (onlyIfChosen && !chosen.has(needId)) return;
    if (!out.some((n) => n.needId === needId)) out.push({ needId, why, chosen: chosen.has(needId) });
  };
  const phase = ctx.phase?.id;
  if (phase === 'period') {
    add('pain.menstrual_cramp', 'Your period is on now');
    if (chosen.has('period.heavy')) add('period.heavy', 'Your period is on now');
    add('period.product_support', 'Your period is on now');
  } else if (ctx.daysToPeriod != null && ctx.daysToPeriod <= 7) {
    const why = `Your period is due ${inDays(ctx.daysToPeriod)}`;
    add('pain.menstrual_cramp', why);
    if (chosen.has('period.heavy')) add('period.heavy', why);
    add('period.product_support', why);
  }
  const sleep = insights.find((i) => i.id === 'sleep' && i.signal === 'sleep-short');
  if (sleep) add('sleep.trouble', `You've slept less than usual ${sleep.shortNights} of the last 7 nights`);
  if (insights.some((i) => i.signal === 'steps-lower')) add('energy.fatigue', 'Your steps are below your usual, and you chose low energy as a goal', { onlyIfChosen: true });
  if (phase === 'luteal') {
    for (const n of ['cycle.pms', 'cycle.breast_tenderness', 'bloating.cycle_related', 'mood.cycle_related']) add(n, 'Ovulation has probably happened this cycle', { onlyIfChosen: true });
  }
  if (insights.some((i) => i.signal === 'heart-up')) add('energy.fatigue', 'Your heart numbers are off your usual this week', { onlyIfChosen: true });
  if ((phase === 'follicular' || phase === 'ovulation') && ctx.ovulationStart) {
    add('fertility.ovulation_tracking', `Your possible ovulation days start around ${fmtDay(ctx.ovulationStart)}`, { onlyIfChosen: true });
  }
  // Stable: needs she chose first, otherwise in the order above.
  return out.map((n, i) => ({ n, i })).sort((a, b) => (b.n.chosen - a.n.chosen) || (a.i - b.i)).map((x) => x.n);
}

/**
 * @returns Array<{ product, needId, reason, owned, level }>  [] when nothing fits.
 */
export function weekPicks({ ctx = {}, insights = [], needIds = [], products: allProducts = [], matches: allMatches = [], limit = 4, perNeed = 2 } = {}) {
  // Today shows no medicine as a pick (src/health/medicineProduct.js).
  const products = withoutMedicines(allProducts);
  const matches = withoutMedicines(allMatches);
  const needs = weekNeeds({ ctx, insights, needIds });
  const owned = new Set(products.map((p) => p?.id));
  const pool = [...products, ...matches].filter((p, i, a) => p?.id && a.findIndex((x) => x?.id === p.id) === i);
  const picks = [];
  const used = new Set();
  // Round-robin over needs so one need can't fill the row: each round takes the
  // best unused product per need (hers before matches, graded before not, then
  // stronger evidence), up to perNeed rounds.
  for (let round = 0; round < perNeed && picks.length < limit; round += 1) {
    for (const need of needs) {
      if (picks.length >= limit) break;
      const best = pool
        .filter((p) => !used.has(p.id))
        .map((p) => ({ p, fit: fitFor(p, need.needId), own: owned.has(p.id) }))
        .filter((c) => c.fit)
        .sort((a, b) => (b.own - a.own) || (b.fit.graded - a.fit.graded) || (b.fit.level - a.fit.level))[0];
      if (!best) continue;
      used.add(best.p.id);
      const word = NEED_WORDS[need.needId] || 'this';
      picks.push({ product: best.p, needId: need.needId, owned: best.own, level: best.fit.level, reason: `${need.why}. ${best.own ? 'In your ecosystem' : 'Matched to you'} for ${word}.` });
    }
  }
  // Show in need order, owned first within a need.
  const order = needs.map((n) => n.needId);
  return picks.sort((a, b) => order.indexOf(a.needId) - order.indexOf(b.needId) || (b.owned - a.owned)).slice(0, limit);
}

/** A direct next step for a measured change, only when a pick fits that change. */
export function pickForInsight(insight, picks = []) {
  const needIds = insight?.signal === 'sleep-short' ? ['sleep.trouble']
    : insight?.signal === 'period-soon' ? ['period.product_support', 'pain.menstrual_cramp']
      : insight?.signal === 'steps-lower' ? ['energy.fatigue']
      : [];
  return picks.find((pick) => needIds.includes(pick.needId)) || null;
}

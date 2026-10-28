// How her needs and her history shape ORDER (never the safety rules, and
// never the shown percent except where noted): team direction sections 15,
// 18, 59 and 65 (Oct 24).
//
// - needSignals(up): how strongly she told ayna about each need.
//     primary  her first pick, or a need her connected health data supports
//     picked   any other need she picked herself
//     weak     a need ayna only read from her words or older answers while
//              she also picked needs herself, or a pick her own life stage
//              contradicts (period support after menopause)
//   A weak need never floods her lists: its matches count for less (v2.js
//   weakFitFactor) and take at most WEAK_SHARE of the top of For you.
// - discoveryValue(pp): curated discovery tie-break. Women's-health-specific
//   products, services and resources ahead of generic drugstore items when
//   the match is otherwise tied. Common products stay; they just do not take
//   every top spot.
// - historyState(up, productId): what she already did with a product
//   (bought, in her routine, saved, said not relevant, tried without help).
//   The engine reads it from opts.behavior and opts.outcomeHistory every
//   time, so removing the entry (undo) brings the product straight back.
// - orderForYou(rows, up, ctx): the For you order (engine order: Ask's top
//   match, the Rundown, the "Personalized" rank used to break ties). Screens
//   that sort by the shown % ("Best match") keep doing so; there this order
//   only decides between products with the same percent.

export const FOR_YOU = {
  tierWeight: { primary: 1, picked: 0.7, weak: 0.25 },
  // Share of the first `window` For you spots a weak need may take.
  weakShare: 0.25,
  window: 12,
  // Generic drugstore items in the first `commodityWindow` spots.
  maxCommodityTop: 2,
  commodityWindow: 8,
  // Category variety (Oct 26 focus group: "everything for cramps was a
  // heating pad", "pads, pads, pads"). In the first `window` spots, at most
  // this many products of one category for one need before a strong match
  // (>= strongScore, v2's Strong band) of another category for that need gets
  // the next spot. Order only; no percent changes, nothing below the bar added.
  maxSameCategoryTop: 2,
  strongScore: 75,
};

const EXPLICIT_SOURCES = new Set(['selected', 'legacy']);
const CONTRADICTION_CODES = new Set(['period_need_vs_stage', 'ttc_vs_postmenopause']);

/** Map(needId -> { tier, weak, weight, reason }) for her needs, in her order. */
export function needSignals(up) {
  const cached = SIGNAL_CACHE.get(up);
  if (cached) return cached;
  const needs = up?.healthIntent?.needs || [];
  const contradicted = new Set((up?.contradictions || []).filter((c) => CONTRADICTION_CODES.has(c.code)).flatMap((c) => c.affects || []));
  const picked = (n) => EXPLICIT_SOURCES.has(n.source) || (n.source === 'custom' && (n.confidence ?? 0) >= 0.9);
  const anyPicked = needs.some((n) => picked(n) && !contradicted.has(n.id));
  const firstPicked = needs.find((n) => picked(n) && !contradicted.has(n.id))?.id || null;
  const out = new Map();
  for (const n of needs) {
    let tier;
    let reason = null;
    if (contradicted.has(n.id) && !n.corroborated) { tier = 'weak'; reason = 'contradicts_life_stage'; }
    else if (n.corroborated || n.id === firstPicked) tier = 'primary';
    else if (picked(n)) tier = 'picked';
    else if (anyPicked) { tier = 'weak'; reason = 'not_picked'; }
    else tier = 'picked';
    out.set(n.id, { tier, weak: tier === 'weak', weight: FOR_YOU.tierWeight[tier], reason });
  }
  // The profile these signals came from, so a v2 re-score that only has the
  // signals (products.js getEcosystemAlternatives) still scores product facts.
  if (up && typeof up === 'object') Object.defineProperty(out, 'profile', { value: up, enumerable: false });
  SIGNAL_CACHE.set(up, out);
  return out;
}
const SIGNAL_CACHE = new WeakMap();

// ─── Curated discovery ─────────────────────────────────────────────────────
const SERVICE_CATEGORIES = new Set(['telehealth', 'therapy', 'mental-health', 'tracker', 'app', 'diagnostics', 'wearable']);
const WOMENS_HEALTH_CATEGORIES = new Set([
  'pad', 'tampon', 'cup', 'disc', 'period-underwear', 'intimate-care', 'menopause', 'pelvic-floor', 'pelvic-floor-trainer',
  'pelvic-floor-exerciser', 'postpartum', 'pregnancy', 'incontinence', 'cramp-relief', 'sex-tech', 'lubricant', 'contraception',
]);
const COMMODITY_CATEGORIES = new Set(['medication']);

/** True for generic drugstore items (the same active ingredient sold everywhere). */
export function isCommodity(pp, commodityIds = null) {
  if (!pp) return false;
  if (commodityIds && pp.product_id && commodityIds.has(pp.product_id)) return true;
  return COMMODITY_CATEGORIES.has(String(pp.category || '').toLowerCase());
}

/**
 * 0..1. Higher = more worth surfacing when the match is tied: services and
 * resources, then women's-health-specific products, then everything else,
 * generic drugstore items last. Never part of the percent.
 */
export function discoveryValue(pp, commodityIds = null) {
  if (!pp) return 0;
  if (isCommodity(pp, commodityIds)) return 0;
  const cat = String(pp.category || '').toLowerCase();
  const designedForStage = Object.values(pp.life_stage || {}).includes('designed_for');
  return SERVICE_CATEGORIES.has(cat) ? 0.9 : WOMENS_HEALTH_CATEGORIES.has(cat) || designedForStage ? 0.7 : 0.4;
}

// ─── Remembered history ────────────────────────────────────────────────────
/**
 * What she already did with this product, strongest first:
 *   'not_for_me'  she hid it (excluded everywhere, score.js)
 *   'dismissed'   "Not relevant" (for one need, or every need)
 *   'tried'       she tried it and it did not help (no change, stopped)
 *   'owned'       bought it, it is in her ecosystem or routine
 *   'saved'       saved for later
 *   null          nothing on file
 * @param {string} [needId] for a per-need dismissal
 */
export function historyState(up, productId, needId = null) {
  const b = up?.behavior;
  const id = productId != null ? String(productId) : null;
  if (!b || !id) return null;
  if (b.hidden?.has(id)) return 'not_for_me';
  const d = b.dismissed?.get(id);
  if (d && (d.has('*') || (needId ? d.has(needId) : d.size > 0))) return 'dismissed';
  if (b.triedWithoutHelp?.has(id)) return 'tried';
  if (b.purchased?.has(id) || b.routine?.has(id)) return 'owned';
  if (b.saved?.has(id)) return 'saved';
  return null;
}
/** History states that keep a product out of new recommendations. */
export const NOT_RECOMMENDED_AGAIN = new Set(['not_for_me', 'dismissed', 'tried']);
/** History states that move a product after fresh picks (she already has it). */
export const ALREADY_HAS = new Set(['owned', 'saved']);

// ─── For you order ─────────────────────────────────────────────────────────
/**
 * Step 1b of the For you order: inside the top window, once a need already
 * shows FOR_YOU.maxSameCategoryTop products of one category, the next spot
 * goes to the best strong match (score >= FOR_YOU.strongScore) of a
 * different category for the same need, if there is one. When there is none
 * the list keeps its order: variety never pulls in a weaker match ahead of a
 * strong one, and never adds or drops a row.
 */
export function varyCategories(rows, profileOf = () => null) {
  const keyOf = (x) => `${x.r.needId || ''}|${String(profileOf(x.r.productId)?.category || 'other').toLowerCase()}`;
  const rest = [...rows];
  const out = [];
  const counts = new Map();
  const add = (x) => { out.push(x); const k = keyOf(x); counts.set(k, (counts.get(k) || 0) + 1); };
  while (rest.length) {
    const head = rest[0];
    if (out.length < FOR_YOU.window && (counts.get(keyOf(head)) || 0) >= FOR_YOU.maxSameCategoryTop) {
      const j = rest.findIndex((y) => y.r.needId === head.r.needId && keyOf(y) !== keyOf(head)
        && y.score >= FOR_YOU.strongScore && (counts.get(keyOf(y)) || 0) < FOR_YOU.maxSameCategoryTop);
      if (j > 0) { add(rest.splice(j, 1)[0]); continue; }
    }
    add(rest.shift());
  }
  return out;
}

/**
 * Re-orders engine results for For you. `rows` are already sorted by the
 * engine (shown percent first). Step 1 only reorders rows with the same
 * shown percent; step 1b (varyCategories) lets a strong match of another
 * category ahead of a need's third same-category product in the top window;
 * step 2 demotes a row past the top window (a weak need over its share, a
 * third generic drugstore item), never promotes one.
 * @param {object[]} rows [{ productId, score, needId }]
 * @param {object} up buildUserProfile() result
 * @param {{ profileOf?: (id) => object, commodityIds?: Set }} ctx
 */
export function orderForYou(rows, up, ctx = {}) {
  if (!Array.isArray(rows) || rows.length < 2) return rows || [];
  const signals = needSignals(up);
  const profileOf = ctx.profileOf || (() => null);
  const commodityIds = ctx.commodityIds || null;
  const info = rows.map((r, i) => {
    const pp = profileOf(r.productId);
    return { r, i, score: Number(r.score) || 0, tier: signals.get(r.needId)?.tier || 'picked', disc: discoveryValue(pp, commodityIds), commodity: isCommodity(pp, commodityIds), has: ALREADY_HAS.has(historyState(up, r.productId, r.needId)) };
  });
  const tierRank = { primary: 0, picked: 1, weak: 2 };
  // 1. Within one shown percent: fresh before what she already has, strongest
  //    need first, then curated discovery, then the engine's own order.
  const groups = new Map();
  for (const x of info) { const g = groups.get(x.score) || []; g.push(x); groups.set(x.score, g); }
  const byPercent = [...groups.keys()].sort((a, b) => b - a).flatMap((s) => groups.get(s).sort((a, b) => (a.has - b.has) || (tierRank[a.tier] - tierRank[b.tier]) || (b.disc - a.disc) || (a.i - b.i)));
  const ordered = varyCategories(byPercent, profileOf);
  // 2. Caps on the top window: a weak need takes at most weakShare of it and
  //    generic drugstore items at most maxCommodityTop of the first spots.
  //    Over the cap, the row waits until the window is filled.
  const out = [];
  const waiting = [];
  const weakCap = Math.max(1, Math.floor(FOR_YOU.window * FOR_YOU.weakShare));
  let weak = 0;
  let commodity = 0;
  for (const x of ordered) {
    const inWindow = out.length < FOR_YOU.window;
    if (inWindow && x.tier === 'weak' && weak >= weakCap) { waiting.push(x); continue; }
    if (out.length < FOR_YOU.commodityWindow && x.commodity && commodity >= FOR_YOU.maxCommodityTop) { waiting.push(x); continue; }
    if (x.tier === 'weak' && inWindow) weak += 1;
    if (x.commodity && out.length < FOR_YOU.commodityWindow) commodity += 1;
    out.push(x);
  }
  // Waiting rows go back in order once the window is full.
  return [...out, ...waiting].map((x) => x.r);
}

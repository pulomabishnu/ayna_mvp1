// ayna matching engine v2 (Pass 8 audit, deep dives 3 and 4). Behind a flag:
// the live site keeps v1 until v2 passes the release gates in
// src/matching/v2.gates.test.js and a clinical reviewer signs off on the grades.
//
// What changes from v1:
//   1. Fit is relevance x evidence x focus. A product built for 7 needs, when
//      she has 1 of them, loses up to a quarter of its fit (v1: at most 4%).
//   2. Preferences re-order products but never lower the shown fit, so telling
//      ayna more never makes matches look worse.
//   3. The ecosystem is chosen as a set: each pick is the one that adds the most
//      new coverage of her needs, one product per type per need, at most two
//      per brand, one "universal" care service, and it stops when the next pick
//      adds little (short shelves beat padded ones).
//   4. Bands (Strong / Good / Partial) instead of a bare percent.
//
// Safety is unchanged and runs first (evaluateSafety inside scoreProductForNeed):
// excluded and held-back products never reach v2's scoring.
// Evidence grades below are DRAFTS derived from the evidence on file
// (reviewed: false). Reviewed rows in NEED_MAP_REVIEWED override them.
import { buildProductProfile } from './productProfile.js';
import { scoreProductForNeed, evaluateSafety, evidenceFor } from './score.js';
import { qualificationForEcosystem, buildEcosystem } from './ecosystem.js';

export const V2 = {
  S: { direct: 1.0, strong: 1.0, secondary: 0.6 },
  E: { A: 1.0, B: 0.85, C: 0.65 },
  focusWeight: 0.25,
  // Preferences count for a quarter of the ranking (research, Oct 17: no study
  // gives an optimum; 0.20 to 0.30 recommended). Health fit is never changed by it.
  prefWeight: 0.25,
  experienceCap: 0.05,
  ecosystemFloor: 0.5,
  partialFloor: 0.35,
  strongFloor: 0.75,
  strongConfidence: 0.6,
  stopGain: 0.02,
  slots: 12,
  perNeed: 3,
  maxPerBrand: 2,
  maxUniversal: 1,
  universalNeedCount: 10,
  needWeight: { first: 1.0, picked: 0.7, inferred: 0.4 },
  // Added to a chosen need's weight when her connected health data shows a trend supporting it.
  corroborationBoost: 0.15,
  fallbackPerNeed: 2,
};

// Reviewed product x need rows (clinical sign-off). Empty until the review
// starts; each row: { product, need, strength: 'primary'|'secondary', grade: 'A'|'B'|'C', reviewer, reviewed }.
export const NEED_MAP_REVIEWED = [];
// Research-graded rows (credible sources only, each with a URL; see
// scripts/merge-research.mjs). Not a clinical sign-off: clinician rows above win.
import NEED_MAP_RESEARCH from '../data/matching/needMap.research.js';
const REVIEWED = new Map([...NEED_MAP_RESEARCH, ...NEED_MAP_REVIEWED].map((r) => [`${r.product}|${r.need}`, r]));

// Products judged on fit, not on an effect claim (deep dive 3): pads, cups,
// underwear, apps, tests. Their evidence factor is 1.0.
const NO_EFFECT_CATEGORIES = new Set(['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cup-steamer', 'tracker', 'app', 'diagnostics', 'test', 'telehealth', 'therapy', 'condom', 'lubricant', 'wearable']);
const UNIVERSAL_CATEGORIES = new Set(['telehealth', 'therapy']);

/** Draft GRADE-style evidence grade for this product and need. */
export function evidenceGrade(pp, needId) {
  const reviewed = REVIEWED.get(`${pp.product_id}|${needId}`);
  if (reviewed) return reviewed.grade;
  const level = evidenceFor(pp, needId).level;
  if (level === 'product_specific') return 'A';
  if (level === 'guideline' || level === 'ingredient_only') return 'B';
  return 'C';
}

function strengthOf(pp, needId, relationship) {
  const reviewed = REVIEWED.get(`${pp.product_id}|${needId}`);
  if (reviewed) return reviewed.strength === 'primary' ? V2.S.direct : reviewed.strength === 'secondary' ? V2.S.secondary : 0;
  return V2.S[relationship] || 0;
}

/** Share of what the product is for that she actually picked (1 = all of it). */
export function focusOf(pp, needIds) {
  let mine = 0;
  let all = 0;
  for (const [needId, rel] of Object.entries(pp.health_need_relevance || {})) {
    const level = typeof rel === 'number' ? rel : rel?.level ?? rel?.score ?? 0;
    const s = level >= 0.8 ? 1 : level >= 0.55 ? 0.6 : 0;
    if (!s) continue;
    all += s;
    if (needIds.has(needId)) mine += s;
  }
  return all ? mine / all : 1;
}

export function bandFor(health, confidence = 1) {
  if (health >= V2.strongFloor && confidence >= V2.strongConfidence) return 'strong';
  if (health >= V2.ecosystemFloor) return 'good';
  if (health >= V2.partialFloor) return 'partial';
  return 'none';
}
export const BAND_LABEL = { strong: 'Strong match', good: 'Good match', partial: 'Partial match' };

// Stable per-user tie-break (deep dive 3): spreads exposure among equals, same order for her every time.
function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

/** v2 numbers for one v1 result (r = scoreProductForNeed output). */
export function scoreV2(pp, r, needIds, userKey = '') {
  const isEffect = !NO_EFFECT_CATEGORIES.has(String(pp.category || '').toLowerCase());
  const grade = evidenceGrade(pp, r.needId);
  const needFit = strengthOf(pp, r.needId, r.relationship) * (isEffect ? V2.E[grade] : 1);
  const focus = focusOf(pp, needIds);
  // Existing product-fit modifiers (flow capacity, UTI timing, life-stage design) carry over
  // as the ratio of v1 health to the plain relationship level.
  const base = { direct: 1, strong: 0.8, secondary: 0.55, adjacent: 0.3, weak: 0.1 }[r.relationship] || 1;
  const modifiers = Math.max(0.5, Math.min(1.1, (r.components?.health ?? base) / base));
  const health = Math.min(1, needFit * (1 - V2.focusWeight + V2.focusWeight * focus) * modifiers);
  const pref = Number.isFinite(r.outputs?.preferenceFit) ? r.outputs.preferenceFit : 1;
  const experience = Math.max(-V2.experienceCap, Math.min(V2.experienceCap, (r.components?.experience ?? 0) * V2.experienceCap));
  const rankKey = health * (1 - V2.prefWeight + V2.prefWeight * pref) + experience + hash01(`${userKey}|${pp.product_id}`) * 0.001;
  const band = bandFor(health, r.confidence ?? 1);
  return { health: round3(health), needFit: round3(needFit), focus: round3(focus), grade, pref: round3(pref), rankKey: round3(rankKey), band, bandLabel: BAND_LABEL[band] || null };
}

function typeKey(pp, needId) {
  const cat = String(pp.category || '').toLowerCase();
  return cat === 'supplement' || cat === 'menopause' ? `supplement:${needId}` : cat || 'other';
}
const round3 = (x) => Math.round(x * 1000) / 1000;

/**
 * v2 ecosystem: the same output shape as buildEcosystem (so every screen
 * works unchanged), with picks chosen by marginal coverage.
 */
export function buildEcosystemV2(up, products, options = {}) {
  // v1 still provides the per-need scaffolding (care bundles, held-back counts, empty reasons).
  const scaffold = buildEcosystem(up, products, { ...options, picksPerNeed: options.picksPerNeed ?? V2.perNeed });
  const needs = up.healthIntent.needs;
  const needIds = new Set(needs.map((n) => n.id));
  // Health-data trends can strengthen a need she chose (never create one): see src/health/matchContext.js.
  const baseWeight = (n, i) => (['legacy', 'inferred', 'life_stage'].includes(n.source) ? V2.needWeight.inferred : i === 0 ? V2.needWeight.first : V2.needWeight.picked);
  const weight = new Map(needs.map((n, i) => [n.id, Math.min(1, baseWeight(n, i) + (n.corroborated ? V2.corroborationBoost : 0))]));
  const userKey = String(up.userKey || up.id || needs.map((n) => n.id).join(','));

  const candidates = []; // { pp, results: Map(needId -> { r, v2 }) }
  const seen = new Set();
  for (const p of products || []) {
    const pp = buildProductProfile(p);
    if (!pp?.product_id || seen.has(pp.product_id)) continue;
    seen.add(pp.product_id);
    const relevant = needs.filter((n) => pp.health_need_relevance?.[n.id]);
    if (!relevant.length) continue;
    const safety = evaluateSafety(pp, up);
    if (!safety.eligible) continue;
    const results = new Map();
    for (const n of relevant) {
      const r = scoreProductForNeed(pp, up, n.id, { safety });
      if (!r.safety.eligible || r.filtered || r.restricted || !r.explainable) continue;
      // v1's ingested-product floors stay as a safety net (e.g. "PMS" in a name alone never qualifies).
      const q = qualificationForEcosystem(r, pp, 50);
      if (q.effectiveScore < q.floor) continue;
      const v2 = scoreV2(pp, r, needIds, userKey);
      if (v2.health < V2.partialFloor) continue;
      results.set(n.id, { r, v2, partial: v2.health < V2.ecosystemFloor });
    }
    if (results.size) candidates.push({ pp, results });
  }
  // A partial fit (e.g. a secondary option with B-grade evidence) only counts
  // for a need where nothing clears the full bar, so she still sees the best
  // evidence-backed option instead of an empty shelf.
  const fullNeeds = new Set();
  for (const c of candidates) for (const [needId, x] of c.results) if (!x.partial) fullNeeds.add(needId);
  for (const c of candidates) for (const [needId, x] of [...c.results]) if (x.partial && fullNeeds.has(needId)) c.results.delete(needId);
  for (let i = candidates.length - 1; i >= 0; i -= 1) if (!candidates[i].results.size) candidates.splice(i, 1);

  const cover = new Map(needs.map((n) => [n.id, 0]));
  const chosen = [];
  const typesByNeed = new Map();
  const brandCount = new Map();
  let universal = 0;
  const slots = options.slots ?? Math.min(V2.slots, Math.max(3, needs.length * V2.perNeed));
  while (chosen.length < slots) {
    let best = null;
    for (const c of candidates) {
      if (chosen.some((x) => x.pp.product_id === c.pp.product_id)) continue;
      const brand = c.pp.brand?.key;
      const trusted = brand && up.shopping?.trustedBrands?.some((t) => t.key === brand);
      if (brand && !trusted && (brandCount.get(brand) || 0) >= V2.maxPerBrand) continue;
      const isUniversal = UNIVERSAL_CATEGORIES.has(String(c.pp.category || '').toLowerCase())
        && Object.keys(c.pp.health_need_relevance || {}).length >= V2.universalNeedCount;
      if (isUniversal && universal >= V2.maxUniversal) continue;
      // Home need: where it fits best.
      let home = null;
      for (const [needId, x] of c.results) if (!home || x.v2.health > home.v2.health) home = { needId, ...x };
      if ((typesByNeed.get(home.needId) || new Set()).has(typeKey(c.pp, home.needId))) continue;
      if (chosen.filter((x) => x.home.needId === home.needId).length >= V2.perNeed) continue;
      let gain = 0;
      for (const [needId, x] of c.results) {
        const before = cover.get(needId) || 0;
        gain += (weight.get(needId) || 0) * ((1 - (1 - before) * (1 - x.v2.health)) - before);
      }
      const value = gain * (1 - V2.prefWeight + V2.prefWeight * home.v2.pref);
      if (!best || value > best.value + 1e-9 || (Math.abs(value - best.value) <= 1e-9 && home.v2.rankKey > best.home.v2.rankKey)) best = { c, home, value, isUniversal };
    }
    if (!best || best.value < V2.stopGain) break;
    chosen.push({ pp: best.c.pp, home: best.home, results: best.c.results });
    for (const [needId, x] of best.c.results) cover.set(needId, 1 - (1 - (cover.get(needId) || 0)) * (1 - x.v2.health));
    const set = typesByNeed.get(best.home.needId) || new Set();
    set.add(typeKey(best.c.pp, best.home.needId));
    typesByNeed.set(best.home.needId, set);
    if (best.c.pp.brand?.key) brandCount.set(best.c.pp.brand.key, (brandCount.get(best.c.pp.brand.key) || 0) + 1);
    if (best.isUniversal) universal += 1;
  }

  const shelves = scaffold.shelves.map((shelf) => {
    let homed = chosen.filter((x) => x.home.needId === shelf.needId);
    // A need already covered by a pick that lives on another shelf shows that
    // pick here too ("Also covers"), instead of looking empty.
    if (!homed.length) {
      homed = chosen.filter((x) => x.results.has(shelf.needId))
        .map((x) => ({ ...x, home: { needId: shelf.needId, ...x.results.get(shelf.needId) } }));
    }
    // Nothing evidence-graded fits this need: keep v1's safe picks (already
    // through every safety rule) rather than an empty shelf, minus anything
    // the research says does not fit this need. Labelled as partial fits.
    if (!homed.length && Array.isArray(shelf.picks) && shelf.picks.length) {
      const fallback = shelf.picks
        .filter((r) => { const row = REVIEWED.get(`${r.productId}|${shelf.needId}`); return !row || row.strength !== 'none'; })
        .slice(0, V2.fallbackPerNeed)
        .map((r) => ({ ...r, v2: { band: 'partial', bandLabel: BAND_LABEL.partial || null, fallback: true }, alsoCovers: [] }));
      if (fallback.length) {
        return { ...shelf, picks: fallback, shortBy: Math.max(0, (options.picksPerNeed ?? V2.perNeed) - fallback.length), coverage: round3(cover.get(shelf.needId) || 0), emptyReason: null, fallback: true };
      }
    }
    const picks = homed
      .sort((a, b) => b.home.v2.rankKey - a.home.v2.rankKey)
      .map((x) => ({
        ...x.home.r,
        v2: x.home.v2,
        alsoCovers: [...x.results.entries()].filter(([n, y]) => n !== shelf.needId && !y.partial).map(([n]) => n),
      }));
    return {
      ...shelf,
      picks,
      shortBy: Math.max(0, (options.picksPerNeed ?? V2.perNeed) - picks.length),
      coverage: round3(cover.get(shelf.needId) || 0),
      emptyReason: picks.length ? null : shelf.emptyReason || 'no_product_meets_quality_bar',
    };
  });
  return { ...scaffold, shelves, engine: 'v2', coverage: Object.fromEntries(cover) };
}

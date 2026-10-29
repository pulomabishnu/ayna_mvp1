// ayna matching engine v2 (Pass 8 audit, deep dives 3 and 4). The default
// engine on the website and in the app since Oct 24 (founder decision): every
// "NN% match" comes from v2Percent() below, via scoreProductV2 (product page,
// cards, Why this matches, Compare, Swipe, Browse, community) and
// buildEcosystemV2 (shelves). ?match=v1 switches one browser back to v1 for
// comparison (src/data/profileSignals.js matchEngine). The release gates live
// in src/matching/v2.gates.test.js; the evidence grades are still drafts
// pending clinical review (see below).
//
// What changes from v1:
//   1. Fit is relevance x evidence x focus. A product built for 7 needs, when
//      she has 1 of them, loses up to a quarter of its fit (v1: at most 4%).
//   2. Preferences re-order products but never lower the shown fit, so telling
//      ayna more never makes matches look worse.
//   3. The ecosystem is chosen as a set: each pick is the one that adds the most
//      new coverage of her needs, one product per type per need (a second of
//      a type only when no other type is left, strong fits only), at most two
//      per brand, one "universal" care service, and it stops when the next pick
//      adds little (short shelves beat padded ones).
//   4. Bands (Strong / Good / Partial) instead of a bare percent.
//
// Safety is unchanged and runs first (evaluateSafety inside scoreProductForNeed):
// excluded and held-back products never reach v2's scoring.
// Evidence grades below are DRAFTS derived from the evidence on file
// (reviewed: false). Reviewed rows in NEED_MAP_REVIEWED override them.
import { buildProductProfile } from './productProfile.js';
import { scoreProduct, scoreProductForNeed, evaluateSafety, evidenceFor, budgetFit, MAX_SCORE, EXPERIENCE_POINTS } from './score.js';
import { qualificationForEcosystem, buildEcosystem } from './ecosystem.js';
import { needSignals, discoveryValue, historyState, NOT_RECOMMENDED_AGAIN } from './forYou.js';
import { isRecommendable } from './eligibility.js';
import { recommendationEligibilityForUser } from './gate.js';
import { MENSTRUAL_PRODUCT_NEEDS, VALUE_BY_ID, needPhrase } from './ontology.js';

export const V2 = {
  S: { direct: 1.0, strong: 1.0, secondary: 0.6 },
  E: { A: 1.0, B: 0.85, C: 0.65 },
  focusWeight: 0.25,
  // Preferences count for a quarter of the ranking (research, Oct 17: no study
  // gives an optimum; 0.20 to 0.30 recommended). Health fit is never changed by it.
  prefWeight: 0.25,
  experienceCap: 0.05,
  // Bad history (did not help, side effects) pushes down at v1's full rate
  // (1 point = 1%, up to 20), not the small cap: it is about her body, not a preference.
  experienceDownCap: 0.2,
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
  // Repeat fill (Oct 26 focus group: "only one heating pad although I chose
  // the most picks"). Once no new TYPE of product qualifies for a need, the
  // need may take a second product of a type it already has, never a third,
  // and only a strong fit. List composition only: no percent changes.
  maxPerTypePerNeed: 2,
  // A need she did not pick herself (or one her life stage contradicts) while
  // she picked others: its fit counts for this much (team direction 15). It
  // can never read as a Strong match, and it gets one ecosystem pick.
  weakFitFactor: 0.8,
  weakPerNeed: 1,
  // Breadth (team direction 59): after the coverage gain falls under stopGain,
  // keep adding a different type of product for a need while it is itself a
  // good fit (fit >= breadthFloor), up to her picks per need. Never a partial
  // fit, never a weak need: no padding when nothing else fits.
  breadthFloor: 0.6,
  // Ecosystem choices within this much value count as tied; curated discovery
  // (forYou.js discoveryValue) decides between them.
  nearTie: 0.005,
  // Match honesty (Oct 26, PDP audit P0 #1: every cup and disc said 99%).
  // Health fit above the knee is compressed (0.84 -> 0.84, 1.0 -> 0.92), so a
  // product that is simply "made for this need" lands around 92%. Anything
  // higher has to come from product-level facts below. Under the knee nothing
  // changes, so other needs keep their numbers.
  knee: 0.84,
  kneeSlope: 0.5,
};

/**
 * Product-level fit inside one need (Oct 26). Each factor is a small, bounded
 * change to the shown fit, read from a real product fact and something she
 * told ayna. Missing data on either side is "unknown": listed in the
 * breakdown, never counted as a fit. Weights are fractions of 100% (0.03 = 3
 * points). Ranking heuristics, not clinical thresholds.
 *   capacity  cups, discs, period underwear: brand-stated mL vs her flow
 *   material  free of something she is allergic to or wants left out
 *   price     upfront price vs the budget she chose
 *   reusable  she asked for reusable
 *   values    other things she asked for (organic, unscented...)
 *   fsaHsa    she uses an FSA or HSA
 *   evidence  a clinician-reviewed A grade (draft grades can only lower, above)
 * Max total raise is 0.14, so 99% needs strong facts on several factors.
 */
export const FACTOR_WEIGHTS = {
  capacity: { roomy: 0.03, enough: 0.01, small: -0.04, midForVeryHeavy: -0.01 },
  material: { free: 0.02, contains: -0.03 },
  price: { within: 0.02, slightlyOver: -0.02, over: -0.05 },
  reusable: { yes: 0.02, no: -0.04 },
  values: { each: 0.01, max: 0.02, miss: -0.02 },
  fsaHsa: { yes: 0.01, no: -0.01 },
  evidence: { reviewedA: 0.02 },
};
// mL a cup, disc or period underwear holds (largest size the brand lists).
// For scale, FDA's tampon absorbency ranges run 6 to 18 g (21 CFR 801.430).
export const CAPACITY_ML = { roomy: 40, enough: 25, moderate: 20 };

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
  // A research row without a grade (draft_unverified: its source was not a
  // .gov page, Oct 24) falls through to the draft grade from the evidence on file.
  if (reviewed?.grade) return reviewed.grade;
  const level = evidenceFor(pp, needId).level;
  if (level === 'product_specific') return 'A';
  if (level === 'guideline' || level === 'ingredient_only') return 'B';
  return 'C';
}

// CLINICAL REVIEW RULE (founder, Oct 24). The evidence grades and research
// rows are unreviewed drafts, so they may only HOLD A MATCH DOWN, never raise
// it above what relevance + fit alone give:
//   - the evidence factor V2.E is <= 1 (A = 1.0 = no change; B, C lower it);
//   - a research row (NEED_MAP_RESEARCH, not a clinical sign-off) can lower
//     the product's strength for a need (secondary, or none) but never lift it
//     above the strength its relevance gives (e.g. secondary -> primary);
//   - only clinician rows in NEED_MAP_REVIEWED count fully, up or down.
const CLINICIAN_REVIEWED = new Map(NEED_MAP_REVIEWED.map((r) => [`${r.product}|${r.need}`, r]));
const rowStrength = (row) => (row.strength === 'primary' ? V2.S.direct : row.strength === 'secondary' ? V2.S.secondary : 0);
function strengthOf(pp, needId, relationship) {
  const key = `${pp.product_id}|${needId}`;
  const clinician = CLINICIAN_REVIEWED.get(key);
  if (clinician) return rowStrength(clinician);
  const fromRelevance = V2.S[relationship] || 0;
  const research = REVIEWED.get(key);
  return research ? Math.min(fromRelevance, rowStrength(research)) : fromRelevance;
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

// "Strong" means the same number everywhere: the shown percent reaches 80,
// where the label says "Strong fit" (matchDisplay.js fitLabel). Before Oct 29
// the band started at 0.75, so a 76% card read Strong here and Good there
// (audit J). A weak need (one she did not pick, or one her stage
// contradicts) is never Strong (audit I).
export const STRONG_BAND_PERCENT = 80;
export function bandFor(health, confidence = 1, { weak = false } = {}) {
  if (!weak && Math.round(100 * health) >= STRONG_BAND_PERCENT && confidence >= V2.strongConfidence) return 'strong';
  if (health >= V2.ecosystemFloor) return 'good';
  if (health >= V2.partialFloor) return 'partial';
  return 'none';
}
export const BAND_LABEL = { strong: 'Strong match', good: 'Good match', partial: 'Partial match' };
// v2 bands in the tier words the screens already use (src/utils/matchDisplay.js).
export const BAND_TIER = { strong: 'excellent', good: 'strong', partial: 'exploratory', none: 'browse' };

/**
 * Her history with this product (or truly similar ones) as a fit change.
 * Same signal v1 uses (score.js experiencePoints, +-20 points). Helped: up,
 * within +experienceCap. Did not help / side effects: down at v1's rate,
 * within -experienceDownCap. Made it worse, serious reactions and clinician
 * stops are excluded by evaluateSafety before scoring. 0 with no history.
 */
export function experienceOf(r) {
  const pts = Number(r?.points?.experience) || 0;
  if (pts >= 0) return Math.min(1, pts / EXPERIENCE_POINTS.cap) * V2.experienceCap;
  return Math.max(-V2.experienceDownCap, pts / 100);
}

/**
 * THE match percent shown for a product on every surface: v2 health fit
 * (compressed above the knee) plus product-level facts (productFactors) plus
 * her history, 0..99. Her format and brand preferences still only order
 * products; budget, reusable, sensitivities and FSA/HSA move the percent by a
 * few points each when the product's own facts show it (Oct 26, PDP audit).
 */
export function v2Percent(v2) {
  if (!v2 || !(v2.fit > 0)) return 0;
  return Math.max(0, Math.min(MAX_SCORE, Math.round(100 * v2.fit)));
}

// Stable per-user tie-break (deep dive 3): spreads exposure among equals, same order for her every time.
function hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 100000) / 100000;
}

/** v2 numbers for one v1 result (r = scoreProductForNeed output). */
export function scoreV2(pp, r, needIds, userKey = '', signals = null, up = signals?.profile || null) {
  const isEffect = !NO_EFFECT_CATEGORIES.has(String(pp.category || '').toLowerCase());
  const grade = evidenceGrade(pp, r.needId);
  const needFit = strengthOf(pp, r.needId, r.relationship) * (isEffect ? V2.E[grade] : 1);
  const focus = focusOf(pp, needIds);
  // Existing product-fit modifiers (flow capacity, UTI timing, life-stage design) carry over
  // as the ratio of v1 health to the plain relationship level.
  const base = { direct: 1, strong: 0.8, secondary: 0.55, adjacent: 0.3, weak: 0.1 }[r.relationship] || 1;
  const modifiers = Math.max(0.5, Math.min(1.1, (r.components?.health ?? base) / base));
  const signal = signals?.get(r.needId) || null;
  const weak = Boolean(signal?.weak);
  const focusTerm = 1 - V2.focusWeight + V2.focusWeight * focus;
  const weakTerm = weak ? V2.weakFitFactor : 1;
  const health = Math.min(1, needFit * focusTerm * modifiers * weakTerm);
  const pref = Number.isFinite(r.outputs?.preferenceFit) ? r.outputs.preferenceFit : 1;
  // Her product history (v1 experience points, scaled to the cap). Before Oct 24
  // this read components.experience, a 0..1 index with a 0.6 "no history"
  // baseline, so every product got +0.03 and bad history could never push down.
  const experience = health > 0 ? experienceOf(r) : 0;
  // Product-level facts inside this need (capacity, material, price...).
  const pf = health > 0 && up ? productFactors(pp, r, up, { isEffect, grade }) : { parts: [], unknown: [], total: 0 };
  // Shown fit: compressed health + product facts + her history. Floors, bands
  // and the percent use it.
  const shownHealth = kneeOf(health);
  const fit = Math.max(0, Math.min(1, shownHealth + pf.total + experience));
  const rankKey = (shownHealth + pf.total) * (1 - V2.prefWeight + V2.prefWeight * pref) + experience + hash01(`${userKey}|${pp.product_id}`) * 0.001;
  const band = bandFor(fit, r.confidence ?? 1, { weak });
  // The breakdown (raised / lowered / unknown), from the same numbers: the
  // base parts telescope from "made for this need" to shownHealth, so
  // sum(parts) + experience is exactly the fit before clamping.
  const strength = strengthOf(pp, r.needId, r.relationship);
  const baseParts = health > 0 ? healthParts(pp, r, needIds, { strength, E: isEffect ? V2.E[grade] : 1, grade, isEffect, focusTerm, focus, modifiers, weakTerm, weakReason: signal?.reason || null }) : [];
  const expPart = experience ? [{ factor: 'history', kind: experience > 0 ? 'raised' : 'lowered', delta: round3(experience), text: experience > 0 ? 'You said this or something like it helped' : 'You said this or something like it did not help' }] : [];
  const parts = [...baseParts, ...pf.parts, ...expPart];
  const top = pf.parts.filter((x) => x.kind === 'raised' && x.reason).sort((a, b) => REASON_ORDER.indexOf(a.factor) - REASON_ORDER.indexOf(b.factor) || b.delta - a.delta)[0] || null;
  const reason = top?.reason || null;
  return { health: round3(health), fit: round3(fit), experience: round3(experience), needFit: round3(needFit), focus: round3(focus), grade, pref: round3(pref), rankKey: round3(rankKey), band, bandLabel: BAND_LABEL[band] || null, needTier: signal?.tier || null, ...(weak ? { weakNeed: signal.reason } : {}), factorTotal: round3(pf.total), parts, unknown: pf.unknown, reason, reasonFactor: top?.factor || null };
}

/** Health fit as shown: unchanged under the knee, half as steep above it. */
export function kneeOf(health) {
  const h = Math.max(0, Math.min(1, Number(health) || 0));
  return h <= V2.knee ? h : V2.knee + (h - V2.knee) * V2.kneeSlope;
}

const FREE_WORDS = {
  latex: 'Latex-free', fragrance: 'Fragrance-free', dyes: 'Dye-free', parabens: 'Paraben-free', sulfates: 'Sulfate-free',
  phthalates: 'Phthalate-free', synthetic_materials: 'No synthetic materials', animal_derived: 'No animal-derived ingredients',
  added_sugar: 'No added sugar', artificial_sweeteners: 'No artificial sweeteners', adhesives: 'No adhesives', nickel: 'Nickel-free',
  essential_oils: 'No essential oils',
};
const ATTR_WORDS = {
  latex: 'latex', fragrance: 'fragrance', dyes: 'dyes', parabens: 'parabens', sulfates: 'sulfates', phthalates: 'phthalates',
  synthetic_materials: 'synthetic materials', animal_derived: 'animal-derived ingredients', added_sugar: 'added sugar',
  artificial_sweeteners: 'artificial sweeteners', adhesives: 'adhesives', nickel: 'nickel', essential_oils: 'essential oils',
};
// The reason line names the most specific product fact that raised the
// match (a measured capacity before a material, before price), not the
// biggest number: "reusable" is true of every cup, its mL is not.
const REASON_ORDER = ['capacity', 'material', 'reusable', 'evidence', 'values', 'price', 'fsaHsa'];
const FLOW_WORDS = { very_light: 'very light', light: 'light', moderate: 'moderate', heavy: 'heavy', very_heavy: 'very heavy' };
const ml = (n) => `${Math.round(n * 10) / 10} mL`;
const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
const orList = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} or ${xs[xs.length - 1]}` : xs[0] || '');
const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** The base of the match, split into parts that add up to kneeOf(health). */
function healthParts(pp, r, needIds, x) {
  const phrase = needPhrase(r.needId) || 'this need';
  const steps = [
    { factor: 'need', value: 1 },
    { factor: 'strength', value: Math.min(1, x.strength) },
    { factor: 'evidence', value: Math.min(1, x.strength * x.E) },
    { factor: 'focus', value: Math.min(1, x.strength * x.E * x.focusTerm) },
    { factor: 'details', value: Math.min(1, x.strength * x.E * x.focusTerm * x.modifiers) },
    { factor: 'need_signal', value: Math.min(1, x.strength * x.E * x.focusTerm * x.modifiers * x.weakTerm) },
  ];
  const out = [{ factor: 'need', kind: 'raised', delta: round3(kneeOf(1)), text: x.strength >= 1 ? `Made for the ${phrase} you told ayna about` : `Matches the ${phrase} you told ayna about` }];
  for (let i = 1; i < steps.length; i += 1) {
    const delta = round3(kneeOf(steps[i].value) - kneeOf(steps[i - 1].value));
    if (!delta) continue;
    const kind = delta > 0 ? 'raised' : 'lowered';
    let text = '';
    if (steps[i].factor === 'strength') text = `A secondary option for your ${phrase}, not made mainly for it`;
    else if (steps[i].factor === 'evidence') text = `Evidence for your ${phrase} is graded ${x.grade} in ayna's draft review (not yet clinically reviewed)`;
    else if (steps[i].factor === 'focus') {
      const others = Object.entries(pp.health_need_relevance || {}).filter(([id, e]) => !needIds.has(id) && ((typeof e === 'number' ? e : e?.score) || 0) >= 0.55).length;
      text = others ? `Also made for ${others} other ${others === 1 ? 'need' : 'needs'} you did not pick` : 'Also made for needs you did not pick';
    } else if (steps[i].factor === 'details') {
      if (delta > 0) text = r.contextUsed?.phrase ? `Designed for ${r.contextUsed.phrase}` : `Suits the details you gave about your ${phrase}`;
      else text = MENSTRUAL_PRODUCT_NEEDS.has(r.needId) && r.flowFit != null && r.flowFit < 1 ? 'Its absorbency is not the best fit for the flow you described' : `Less suited to the details you gave about your ${phrase}`;
    } else if (steps[i].factor === 'need_signal') text = x.weakReason === 'contradicts_life_stage' ? 'This need does not fit the life stage you shared' : 'A need you did not pick yourself';
    out.push({ factor: steps[i].factor, kind, delta, text });
  }
  return out;
}

/**
 * Product-level factors for one product and need. Returns the parts that
 * moved the fit (each { factor, kind, delta, text, reason? }), what ayna does
 * not know yet ({ factor, text }), and the total change.
 */
export function productFactors(pp, r, up, { isEffect = false, grade = null } = {}) {
  const W = FACTOR_WEIGHTS;
  const parts = [];
  const unknown = [];
  const add = (factor, delta, text, reason = null) => parts.push({ factor, kind: delta > 0 ? 'raised' : 'lowered', delta, text, ...(reason ? { reason } : {}) });
  const cat = String(pp.category || '').toLowerCase();
  const shopping = up.shopping || {};

  // Capacity vs her flow (cups, discs, period underwear).
  if (MENSTRUAL_PRODUCT_NEEDS.has(r.needId) && pp.menstrual && ['cup', 'disc', 'period-underwear'].includes(cat)) {
    const flow = up.physiology?.flow || null;
    const cap = pp.menstrual.capacity_ml;
    const sized = cap?.sizes?.filter((s) => s.label) || [];
    if (sized.length > 1 && cat !== 'period-underwear') unknown.push({ factor: 'size', text: `Which size fits you (${orList(sized.map((s) => s.label))})` });
    if (!flow || flow === 'varies') {
      unknown.push({ factor: 'capacity', text: 'Your usual flow, which decides how much it needs to hold' });
    } else if (['moderate', 'heavy', 'very_heavy'].includes(flow)) {
      if (!cap) unknown.push({ factor: 'capacity', text: 'How much it holds (not confirmed on the brand\u2019s own site yet)' });
      else {
        const top = cap.sizes.find((s) => s.ml === cap.max);
        const size = top?.label && cap.sizes.length > 1 ? ` (${top.label} size)` : '';
        const holds = `Holds up to ${ml(cap.max)}${size}`;
        const flowWord = FLOW_WORDS[flow];
        if (flow === 'moderate') {
          if (cap.max >= CAPACITY_ML.moderate) add('capacity', W.capacity.enough, `${holds}, for your moderate flow`, `${holds}, for your moderate flow`);
        } else if (cap.max >= CAPACITY_ML.roomy) add('capacity', W.capacity.roomy, `${holds}, for your ${flowWord} flow`, `${holds}, for your ${flowWord} flow`);
        else if (cap.max >= CAPACITY_ML.enough) {
          if (flow === 'heavy') add('capacity', W.capacity.enough, `${holds}, for your heavy flow`, `${holds}, for your heavy flow`);
          else add('capacity', W.capacity.midForVeryHeavy, `${holds}, a mid-size capacity for a very heavy flow`);
        } else add('capacity', W.capacity.small, `${holds}; you said your flow is ${flowWord}`);
      }
    }
  }

  // Material: free of what she is allergic to or wants left out.
  const attrs = new Set([...(up.safety?.allergies || []).map((a) => a.attr), ...(shopping.leaveOut || []).map((l) => l.attr)].filter((a) => a && FREE_WORDS[a]));
  if (attrs.size) {
    const free = [];
    const contains = [];
    for (const a of attrs) {
      const st = pp.safety?.[a];
      if (st === 'not_applicable') continue;
      if (st === 'no') free.push(a);
      else if (st === 'yes') contains.push(a);
      else unknown.push({ factor: 'material', text: `Whether it contains ${ATTR_WORDS[a]}` });
    }
    if (contains.length) add('material', W.material.contains, `Contains ${contains.map((a) => ATTR_WORDS[a]).join(' and ')}, which you want to avoid`);
    else if (free.length) {
      const words = free.slice(0, 2).map((a, i) => (i ? lowerFirst(FREE_WORDS[a]) : FREE_WORDS[a])).join(' and ');
      add('material', W.material.free, `${words}, which you asked for`, `${words}, which you asked for`);
    }
  }

  // Price vs her budget (upfront price, US dollars).
  const priceScored = shopping.budget && !shopping.priceNotImportant && !(up.contradictions || []).some((c) => (c.affects || []).includes('price'));
  if (priceScored) {
    const price = pp.price || {};
    if (price.is_free) add('price', W.price.within, 'Free, fits your budget', 'Free, fits your budget');
    else if (price.amount == null || (price.currency && price.currency !== 'USD')) unknown.push({ factor: 'price', text: 'Its current price in US dollars' });
    else {
      const fit = budgetFit(price.amount, shopping.budget);
      if (price.amount <= shopping.budget.max) add('price', W.price.within, `${money(price.amount)} fits your budget`, `${money(price.amount)} fits your budget`);
      else if (fit >= 0.85) add('price', W.price.slightlyOver, `${money(price.amount)}, a little over your budget`);
      else add('price', W.price.over, `${money(price.amount)}, over your budget`);
    }
  }

  // Reusable, and the other things she asked for.
  const asked = new Set((shopping.shouldBe || []).map((v) => v.id));
  if (asked.has('reusable')) {
    const v = pp.values?.reusable;
    if (v === 'yes' || pp.pricing?.reusable || pp.reusable_by_brand) add('reusable', W.reusable.yes, 'Reusable, like you asked', 'Reusable, like you asked');
    else if (v === 'no') add('reusable', W.reusable.no, 'Single use; you asked for reusable');
    else unknown.push({ factor: 'reusable', text: 'Whether it is reusable' });
  }
  let valueRaise = 0;
  const met = [];
  for (const id of asked) {
    if (id === 'reusable' || !VALUE_BY_ID[id]) continue;
    const v = pp.values?.[id];
    if (v === 'not_applicable') continue;
    const phrase = VALUE_BY_ID[id].phrase;
    if (v === 'yes') { if (valueRaise < W.values.max) { valueRaise = round3(valueRaise + W.values.each); met.push(phrase); } }
    else if (v === 'no') add('values', W.values.miss, `Not ${phrase}, which you asked for`);
    else unknown.push({ factor: 'values', text: `Whether it is ${phrase}` });
  }
  if (valueRaise) {
    const words = met.join(' and ');
    add('values', valueRaise, `${words.charAt(0).toUpperCase()}${words.slice(1)}, like you asked`, `${words.charAt(0).toUpperCase()}${words.slice(1)}, like you asked`);
  }

  // FSA / HSA, when she uses one.
  if (['fsa', 'hsa', 'both'].includes(shopping.fsaHsa)) {
    const acct = shopping.fsaHsa === 'both' ? 'FSA or HSA' : shopping.fsaHsa.toUpperCase();
    if (pp.fsa_hsa === 'yes') add('fsaHsa', W.fsaHsa.yes, `Eligible for your ${acct}`, `Eligible for your ${acct}`);
    else if (pp.fsa_hsa === 'no') add('fsaHsa', W.fsaHsa.no, `Not eligible for your ${acct}`);
    else unknown.push({ factor: 'fsaHsa', text: `Whether it is eligible for your ${acct}` });
  }

  // Evidence: only a clinician-reviewed A grade raises (draft grades only lower, in health).
  if (isEffect && grade === 'A' && CLINICIAN_REVIEWED.get(`${pp.product_id}|${r.needId}`)?.grade === 'A') {
    add('evidence', W.evidence.reviewedA, 'Clinician-reviewed evidence for this need', 'Clinician-reviewed evidence for this need');
  }

  const total = round3(parts.reduce((s, p) => s + p.delta, 0));
  return { parts, unknown, total };
}

/** The key that ties her v2 ecosystem order to one user (stable tie-break). */
export function userKeyOf(up) {
  return String(up.userKey || up.id || up.healthIntent.needs.map((n) => n.id).join(','));
}

/**
 * One v1 per-need result re-scored by v2: score (the shown percent) and tier
 * come from v2; v1Score keeps the old number for comparison. Safety, relevance,
 * explanations and every other field stay v1's (safety runs first).
 */
export function withV2Score(pp, r, needIds, userKey = '', signals = null, up = signals?.profile || null) {
  if (!r || !r.safety?.eligible || !(r.relevance > 0)) return { ...r, v1Score: r?.score ?? 0, score: 0, tier: 'browse', v2: null };
  const v2 = scoreV2(pp, r, needIds, userKey, signals, up);
  const score = v2Percent(v2);
  return { ...r, v1Score: r.score, score, tier: score > 0 ? BAND_TIER[v2.band] : 'browse', v2 };
}

/**
 * scoreProduct (score.js) with every need scored by v2. Same output shape,
 * so getProductMatchDetailsForProduct and every screen work unchanged.
 * @param {object} pp buildProductProfile() result
 */
export function scoreProductV2(pp, up) {
  const v1 = scoreProduct(pp, up);
  const needIds = new Set(up.healthIntent.needs.map((n) => n.id));
  const key = userKeyOf(up);
  const signals = needSignals(up);
  const needs = v1.needs
    .map((r) => withV2Score(pp, r, needIds, key, signals, up))
    .sort((a, b) => b.score - a.score || (b.v2?.rankKey ?? 0) - (a.v2?.rankKey ?? 0) || b.relevance - a.relevance);
  const best = needs.find((r) => r.relevance > 0) || null;
  return { ...v1, needs, best, engine: 'v2' };
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
  // Picks per need: what she chose ("How many picks per area"), else 3.
  const perNeed = options.picksPerNeed ?? up.shopping?.picksPerNeed ?? V2.perNeed;
  const scaffold = buildEcosystem(up, products, { ...options, picksPerNeed: perNeed });
  const needs = up.healthIntent.needs;
  const needIds = new Set(needs.map((n) => n.id));
  // Health-data trends can strengthen a need she chose (never create one): see src/health/matchContext.js.
  const signals = needSignals(up);
  const baseWeight = (n, i) => (['legacy', 'inferred', 'life_stage'].includes(n.source) || signals.get(n.id)?.weak ? V2.needWeight.inferred : i === 0 ? V2.needWeight.first : V2.needWeight.picked);
  const weight = new Map(needs.map((n, i) => [n.id, Math.min(1, baseWeight(n, i) + (n.corroborated ? V2.corroborationBoost : 0))]));
  const userKey = userKeyOf(up);
  const isWeak = (needId) => Boolean(signals.get(needId)?.weak);
  const hasStrongNeed = needs.some((n) => !isWeak(n.id));
  const needCap = (needId) => (hasStrongNeed && isWeak(needId) ? Math.min(perNeed, V2.weakPerNeed) : perNeed);
  // History she can undo (forYou.js historyState): "Not relevant" for this
  // need, or tried without help, keeps a product off that shelf.
  const skipForHistory = (pp, needId) => NOT_RECOMMENDED_AGAIN.has(historyState(up, pp.product_id, needId));

  const candidates = []; // { pp, results: Map(needId -> { r, v2 }) }
  const seen = new Set();
  const profileById = new Map();
  for (const p of products || []) {
    const pp = buildProductProfile(p);
    if (!pp?.product_id || seen.has(pp.product_id)) continue;
    seen.add(pp.product_id);
    profileById.set(pp.product_id, pp);
    // Catalog eligibility (eligibility.js): accessories and listings that
    // failed validation are not recommendations.
    if (!isRecommendable(p, pp)) continue;
    const relevant = needs.filter((n) => pp.health_need_relevance?.[n.id]);
    if (!relevant.length) continue;
    const safety = evaluateSafety(pp, up);
    if (!safety.eligible) continue;
    const results = new Map();
    for (const n of relevant) {
      if (skipForHistory(pp, n.id)) continue;
      const r = scoreProductForNeed(pp, up, n.id, { safety });
      if (!r.safety.eligible || r.filtered || r.restricted || !r.explainable) continue;
      // v1's ingested-product floors stay as a safety net (e.g. "PMS" in a name alone never qualifies).
      const q = qualificationForEcosystem(r, pp, 50);
      if (q.effectiveScore < q.floor) continue;
      const scored = withV2Score(pp, r, needIds, userKey, signals, up);
      const { v2 } = scored;
      if (v2.fit < V2.partialFloor) continue;
      results.set(n.id, { r: scored, v2, partial: v2.fit < V2.ecosystemFloor });
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
  // She chose more picks per need than the default: honour it for every need
  // (12 slots cut a 5-per-need choice short at three needs). The stop rules
  // below still keep shelves short when nothing else fits.
  const slots = options.slots ?? (perNeed > V2.perNeed
    ? Math.max(3, needs.length * perNeed)
    : Math.min(V2.slots, Math.max(3, needs.length * perNeed)));
  // One option beats another: more value, and within V2.nearTie the curated
  // discovery value (forYou.js) and then the stable per-user rankKey.
  const beats = (a, b) => {
    if (!b) return true;
    if (Math.abs(a.value - b.value) > V2.nearTie) return a.value > b.value;
    if (Math.abs(a.disc - b.disc) > 1e-9) return a.disc > b.disc;
    if (Math.abs(a.value - b.value) > 1e-9) return a.value > b.value;
    return a.home.v2.rankKey > b.home.v2.rankKey;
  };
  while (chosen.length < slots) {
    let best = null; // best pick on coverage gain
    let wide = null; // best breadth pick, used once the gain is too small
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
      for (const [needId, x] of c.results) if (!home || x.v2.fit > home.v2.fit) home = { needId, ...x };
      if ((typesByNeed.get(home.needId) || new Set()).has(typeKey(c.pp, home.needId))) continue;
      const homeCount = chosen.filter((x) => x.home.needId === home.needId).length;
      if (homeCount >= needCap(home.needId)) continue;
      let gain = 0;
      for (const [needId, x] of c.results) {
        const before = cover.get(needId) || 0;
        gain += (weight.get(needId) || 0) * ((1 - (1 - before) * (1 - x.v2.fit)) - before);
      }
      const option = { c, home, value: gain * (1 - V2.prefWeight + V2.prefWeight * home.v2.pref), isUniversal, disc: discoveryValue(c.pp, options.commodityIds || null) };
      if (beats(option, best)) best = option;
      // Breadth (team direction 59): another type of good fit for a need with
      // fewer picks than she asked for. Never partial, never a weak need.
      if (!home.partial && home.v2.fit >= V2.breadthFloor && !isWeak(home.needId) && homeCount < perNeed && beats(option, wide)) wide = option;
    }
    if (best && best.value < V2.stopGain) best = wide;
    if (!best) break;
    take(best);
  }
  // Repeat fill: a need still under her picks, with no new type left, may
  // take a second product of a type it has (V2.maxPerTypePerNeed), strong
  // fits only (fit >= strongFloor, never partial, never a weak need). A
  // different format, then a different brand, from what the shelf already
  // holds goes first, then the higher fit. Never lowers a bar and never
  // changes a percent.
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
      let home = null;
      for (const [needId, x] of c.results) if (!home || x.v2.fit > home.v2.fit) home = { needId, ...x };
      if (home.partial || home.v2.fit < V2.strongFloor || isWeak(home.needId)) continue;
      if (chosen.filter((x) => x.home.needId === home.needId).length >= needCap(home.needId)) continue;
      const tk = typeKey(c.pp, home.needId);
      const same = chosen.filter((x) => x.home.needId === home.needId && typeKey(x.pp, home.needId) === tk);
      if (same.length >= V2.maxPerTypePerNeed) continue;
      const fmt = (c.pp.formats || []).join();
      const varied = (same.every((x) => (x.pp.formats || []).join() !== fmt) ? 2 : 0) + (same.every((x) => x.pp.brand?.key !== brand) ? 1 : 0);
      const option = { c, home, isUniversal, varied };
      const better = !best || varied > best.varied || (varied === best.varied
        && (home.v2.fit > best.home.v2.fit + 1e-9 || (Math.abs(home.v2.fit - best.home.v2.fit) <= 1e-9 && home.v2.rankKey > best.home.v2.rankKey)));
      if (better) best = option;
    }
    if (!best) break;
    take(best);
  }
  function take(pick) {
    chosen.push({ pp: pick.c.pp, home: pick.home, results: pick.c.results });
    for (const [needId, x] of pick.c.results) cover.set(needId, 1 - (1 - (cover.get(needId) || 0)) * (1 - x.v2.fit));
    const set = typesByNeed.get(pick.home.needId) || new Set();
    set.add(typeKey(pick.c.pp, pick.home.needId));
    typesByNeed.set(pick.home.needId, set);
    if (pick.c.pp.brand?.key) brandCount.set(pick.c.pp.brand.key, (brandCount.get(pick.c.pp.brand.key) || 0) + 1);
    if (pick.isUniversal) universal += 1;
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
      // Fallbacks are candidates like any other (audit H): the central gate,
      // catalog eligibility and the partial floor all apply again here.
      const fallback = shelf.picks
        .filter((r) => { const row = REVIEWED.get(`${r.productId}|${shelf.needId}`); return !row || row.strength !== 'none'; })
        .filter((r) => { const pp = profileById.get(r.productId); return pp && !skipForHistory(pp, shelf.needId); })
        .filter((r) => {
          const pp = profileById.get(r.productId);
          const raw = (products || []).find((p) => p?.id === r.productId);
          if (!raw || !isRecommendable(raw, pp)) return false;
          const gate = recommendationEligibilityForUser(pp, up, { surface: 'ecosystem_fallback' });
          if (gate.decision !== 'eligible') return false;
          const scored = withV2Score(pp, r, needIds, userKey, signals, up);
          return (scored.v2?.fit ?? 0) >= V2.partialFloor;
        })
        .slice(0, V2.fallbackPerNeed)
        .map((r) => {
          // The shown percent is still v2's for this need (same number as the product page).
          const pp = profileById.get(r.productId);
          const scored = pp ? withV2Score(pp, r, needIds, userKey, signals, up) : { ...r, v1Score: r.score, score: 0, tier: 'browse', v2: null };
          return { ...scored, v2: { ...(scored.v2 || {}), band: 'partial', bandLabel: BAND_LABEL.partial || null, fallback: true }, alsoCovers: [] };
        });
      if (fallback.length) {
        return { ...shelf, picks: fallback, shortBy: Math.max(0, perNeed - fallback.length), coverage: round3(cover.get(shelf.needId) || 0), emptyReason: null, fallback: true };
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
      shortBy: Math.max(0, perNeed - picks.length),
      coverage: round3(cover.get(shelf.needId) || 0),
      emptyReason: picks.length ? null : shelf.emptyReason || 'no_product_meets_quality_bar',
    };
  });
  return { ...scaffold, shelves, engine: 'v2', coverage: Object.fromEntries(cover) };
}

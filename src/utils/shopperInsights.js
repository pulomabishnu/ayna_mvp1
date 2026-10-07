/**
 * Shopper insights for My Ecosystem: safety alerts, routine buckets, brands
 * and values, and catalog blind spots. Ported from the mobile app's
 * src/mobile/utils/shopperProfileData.js and src/mobile/hooks/useRoutine.js,
 * reworked for the website's data shapes (myProducts is an id → product
 * object; intake answers live on quizResults.fullHealthIntake).
 *
 * Rules (CLAUDE.md, catalog content accuracy):
 * - A safety alert fires only when something the person told us (an intake
 *   allergy, an intake "avoid" answer, or an allergy on their imported or
 *   manual health profile) literally appears in a product's own ingredient,
 *   allergen or material text, or when productSafetyAlert.js already flags
 *   the product's catalog recall text. Nothing here infers a reaction,
 *   rates a risk, or adds a claim; the alert quotes the catalog text.
 * - Phrases that say the term is ABSENT ("fragrance-free", "free of dyes",
 *   "no latex", "omits parfum") never count as a match.
 * - Routine buckets are whatever the person assigns. Nothing is computed.
 */
import { getSafetyAlertText } from './productSafetyAlert.js';
import { PREFERENCE_OPTIONS, matchesProductPreference } from './productPreferences.js';

// ── Products ────────────────────────────────────────────────────────────────

/** myProducts arrives as an id → product object; tolerate an array too. */
export function toProductList(myProducts) {
  if (!myProducts) return [];
  const list = Array.isArray(myProducts) ? myProducts : Object.values(myProducts);
  return list.filter((p) => p && typeof p === 'object' && p.id);
}

// ── Sensitivities ───────────────────────────────────────────────────────────

/**
 * Each known term maps to the words that mean it in ingredient text. Terms
 * that are too broad to match honestly against an ingredient list
 * ("Antibiotics", "Hormonal medications", "Topical ingredients",
 * "Supplements or herbal ingredients") are deliberately absent: they are
 * skipped rather than guessed at.
 *
 * "Sulfates" means the surfactants people avoid (SLS/SLES), not mineral
 * salts such as ferrous or magnesium sulfate in supplements.
 */
const TERM_KEYWORDS = {
  fragrance: { label: 'Fragrance', words: ['fragrance', 'fragrances', 'parfum', 'perfume', 'scented'] },
  latex: { label: 'Latex', words: ['latex', 'natural rubber'] },
  dye: { label: 'Dyes', words: ['dye', 'dyes', 'dyed', 'colorant', 'colorants'] },
  paraben: { label: 'Parabens', words: ['paraben', 'parabens', 'methylparaben', 'propylparaben', 'butylparaben', 'ethylparaben'] },
  sulfate: { label: 'Sulfates', words: ['sodium lauryl sulfate', 'sodium laureth sulfate', 'ammonium lauryl sulfate', 'sls', 'sles'] },
  phthalate: { label: 'Phthalates', words: ['phthalate', 'phthalates'] },
  adhesive: { label: 'Adhesives', words: ['adhesive', 'adhesives'] },
  nickel: { label: 'Nickel', words: ['nickel'] },
  'essential-oil': {
    label: 'Essential oils',
    words: ['essential oil', 'essential oils', 'lavender oil', 'peppermint oil', 'tea tree oil', 'eucalyptus oil', 'rosemary oil', 'clary sage oil'],
  },
  preservative: { label: 'Preservatives', words: ['preservative', 'preservatives', 'phenoxyethanol', 'sodium benzoate', 'potassium sorbate', 'paraben', 'parabens'] },
  gluten: { label: 'Gluten', words: ['gluten', 'wheat', 'barley', 'rye'] },
  soy: { label: 'Soy', words: ['soy', 'soya', 'soybean', 'soybeans'] },
  dairy: { label: 'Dairy', words: ['dairy', 'lactose', 'whey', 'casein', "cow's milk", 'milk protein'] },
  nsaid: { label: 'NSAIDs', words: ['nsaid', 'nsaids', 'ibuprofen', 'naproxen', 'aspirin'] },
  acetaminophen: { label: 'Acetaminophen', words: ['acetaminophen', 'paracetamol'] },
  aspirin: { label: 'Aspirin', words: ['aspirin', 'acetylsalicylic acid'] },
};

// Intake "Allergies" options (HealthIntakeForm.jsx ALLERGIES) → term.
const ALLERGY_TO_TERM = {
  latex: 'latex',
  fragrance: 'fragrance',
  adhesives: 'adhesive',
  'nsaids such as ibuprofen': 'nsaid',
  acetaminophen: 'acetaminophen',
  aspirin: 'aspirin',
  nickel: 'nickel',
  'essential oils': 'essential-oil',
  dyes: 'dye',
  preservatives: 'preservative',
  gluten: 'gluten',
  soy: 'soy',
  dairy: 'dairy',
};

// Intake "What should your products avoid" options
// (intakePreferenceMap.js AVOID_INGREDIENTS) → term. Lifestyle answers such
// as Vegan or Organic are values, not ingredients to flag, so they're absent.
const AVOID_TO_TERM = {
  fragrance: 'fragrance',
  'fragrance-free': 'fragrance',
  unscented: 'fragrance',
  dyes: 'dye',
  'dye-free': 'dye',
  parabens: 'paraben',
  'paraben-free': 'paraben',
  sulfates: 'sulfate',
  'sulfate-free': 'sulfate',
  phthalates: 'phthalate',
  latex: 'latex',
  'latex-free': 'latex',
};

// Answers that mean "nothing to flag", or are too broad to match.
const IGNORED_FREE_TEXT = new Set([
  'none', 'none known', 'no', 'n/a', 'na', 'not sure', "i'm not sure", 'other', 'no preference', 'prefer not to say',
  'antibiotics', 'hormonal medications', 'topical ingredients', 'supplements or herbal ingredients',
]);

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Everything the person told us to watch for, as
 * [{ key, label, words, source: 'allergy' | 'avoid' }].
 * Known options map to keyword lists; a free-typed allergy ("lavender") is
 * matched as its own whole word when it is at least 4 letters long.
 */
export function collectSensitivities(quizResults = null, healthProfile = null) {
  const intake = quizResults?.fullHealthIntake || {};
  const out = new Map();

  const add = (raw, source) => {
    const value = norm(raw);
    if (!value || IGNORED_FREE_TEXT.has(value)) return;
    const termKey = source === 'avoid' ? AVOID_TO_TERM[value] : (ALLERGY_TO_TERM[value] || AVOID_TO_TERM[value]);
    if (termKey) {
      const existing = out.get(termKey);
      // An allergy outranks a preference for the same term.
      if (!existing || (existing.source === 'avoid' && source === 'allergy')) {
        out.set(termKey, { key: termKey, label: TERM_KEYWORDS[termKey].label, words: TERM_KEYWORDS[termKey].words, source });
      }
      return;
    }
    if (source !== 'allergy') return; // unknown avoid answers are not ingredients
    if (value.length < 4 || !/^[a-z][a-z\s'-]*$/.test(value)) return;
    const key = `custom:${value}`;
    if (!out.has(key)) out.set(key, { key, label: String(raw).trim(), words: [value], source });
  };

  const allergyList = Array.isArray(intake.allergies) && intake.allergies.length
    ? intake.allergies
    : (intake.allergyStatus === 'Yes' && Array.isArray(intake.allergyItems) ? intake.allergyItems : []);
  allergyList.forEach((a) => add(a, 'allergy'));
  (Array.isArray(healthProfile?.allergies) ? healthProfile.allergies : []).forEach((a) => add(a, 'allergy'));
  (Array.isArray(intake.avoidIngredients) ? intake.avoidIngredients : []).forEach((a) => add(a, 'avoid'));
  // Legacy profile shape: mapIntakeToLegacyQuizProfile only ever produces
  // 'Fragrance sensitivity' here.
  (Array.isArray(quizResults?.sensitivities) ? quizResults.sensitivities : []).forEach((s) => {
    if (/fragrance/i.test(s)) add('fragrance', 'avoid');
    else if (/latex/i.test(s)) add('latex', 'allergy');
  });

  return [...out.values()];
}

// ── Ingredient matching ─────────────────────────────────────────────────────

const PRODUCT_TEXT_FIELDS = [
  ['ingredients', (p) => (Array.isArray(p?.ingredients) ? p.ingredients.join(', ') : p?.ingredients)],
  ['allergens', (p) => p?.safety?.allergens],
  ['materials', (p) => p?.safety?.materials],
];

export const FIELD_LABELS = { ingredients: 'Ingredients', allergens: 'Allergens', materials: 'Materials' };

const NEGATION_RE = /\b(no|not|non|without|free of|free from|omits?|omitting|excludes?|zero)\b/gi;
const NEGATION_BREAK_RE = /\b(but|contains?|containing|except|includes?|including|with|plus)\b/i;

/**
 * True when a match at [start, end) inside `clause` is stated as absent:
 * "fragrance-free", "fragrance free", "non-latex", "no fragrance",
 * "free of parabens, phthalates and dyes", "omits parfum". A negation stops
 * applying once the clause turns ("no fragrance, but contains latex").
 */
function isNegated(clause, start, end) {
  const after = clause.slice(end);
  if (/^[\s-]?free\b/i.test(after)) return true;
  const before = clause.slice(0, start);
  let last = null;
  for (const m of before.matchAll(NEGATION_RE)) last = m;
  if (!last) return false;
  const between = before.slice(last.index + last[0].length);
  return !NEGATION_BREAK_RE.test(between);
}

/**
 * Where a sensitivity's words appear in a product's own text, ignoring
 * mentions that say it is absent. Returns [{ field, snippet, word }] with the
 * catalog clause quoted verbatim (trimmed to 160 chars).
 */
export function findIngredientMatches(product, sensitivity) {
  if (!product || !sensitivity?.words?.length) return [];
  const matches = [];
  for (const [field, read] of PRODUCT_TEXT_FIELDS) {
    const text = String(read(product) || '').trim();
    if (!text) continue;
    const clauses = text.split(/[.;()\n]+/).map((c) => c.trim()).filter(Boolean);
    let found = null;
    for (const clause of clauses) {
      for (const word of sensitivity.words) {
        const re = new RegExp(`(?<![a-z])${escapeRe(word)}(?![a-z])`, 'gi');
        for (const m of clause.matchAll(re)) {
          if (!isNegated(clause, m.index, m.index + m[0].length)) {
            found = { field, word, snippet: clause.length > 160 ? `${clause.slice(0, 157)}…` : clause };
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (found) matches.push(found);
  }
  return matches;
}

// ── Safety alerts ───────────────────────────────────────────────────────────

function hashText(s) {
  let h = 5381;
  const str = String(s || '');
  for (let i = 0; i < str.length; i += 1) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Real alerts only:
 *  - kind 'ingredient': one per (product, sensitivity) whose words appear in
 *    that product's ingredient/allergen/material text.
 *  - kind 'recall': products whose catalog recall text productSafetyAlert.js
 *    already flags (PFAS, lawsuits, dated recalls, legacy ⚠️ marker).
 * Ids include a hash of the quoted text, so a dismissed alert comes back if
 * the catalog text behind it changes.
 */
export function getSafetyAlerts(myProducts, quizResults = null, healthProfile = null) {
  const products = toProductList(myProducts);
  const sensitivities = collectSensitivities(quizResults, healthProfile);
  const alerts = [];

  products.forEach((product) => {
    sensitivities.forEach((s) => {
      const matches = findIngredientMatches(product, s);
      if (!matches.length) return;
      alerts.push({
        id: `ingredient:${product.id}:${s.key}:${hashText(matches.map((m) => m.snippet).join('|'))}`,
        kind: 'ingredient',
        product,
        sensitivity: { key: s.key, label: s.label, source: s.source },
        matches,
      });
    });
  });

  products.forEach((product) => {
    const text = getSafetyAlertText(product);
    if (!text) return;
    alerts.push({
      id: `recall:${product.id}:${hashText(text)}`,
      kind: 'recall',
      product,
      text: String(text).trim(),
    });
  });

  // Allergies first, then avoid-preferences, then catalog safety notes.
  const rank = (a) => (a.kind === 'ingredient' ? (a.sensitivity.source === 'allergy' ? 0 : 1) : 2);
  return alerts.sort((a, b) => rank(a) - rank(b));
}

// ── Brands and values ───────────────────────────────────────────────────────

/**
 * Brands you keep coming back to: explicit `brand` fields only (never a
 * guess from the product name — see productBrandContext.js for why), most
 * products first.
 */
export function getBrandAffinity(myProducts, { limit = 8 } = {}) {
  const counts = new Map();
  toProductList(myProducts).forEach((p) => {
    const brand = typeof p.brand === 'string' ? p.brand.trim() : '';
    if (!brand) return;
    const key = brand.toLowerCase();
    const prev = counts.get(key);
    counts.set(key, { brand: prev?.brand || brand, count: (prev?.count || 0) + 1 });
  });
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand))
    .slice(0, limit);
}

/**
 * For each product value the person picked in intake that the site can
 * actually check (productPreferences.js patterns), how many ecosystem
 * products match it in their own catalog text.
 */
export function getValueAffinity(myProducts, quizResults = null) {
  const products = toProductList(myProducts);
  const picked = new Set((Array.isArray(quizResults?.preference) ? quizResults.preference : []).map(norm));
  return PREFERENCE_OPTIONS
    .filter((opt) => picked.has(opt.value))
    .map((opt) => {
      const count = products.filter((p) => matchesProductPreference(p, opt.value)).length;
      return { value: opt.value, label: opt.label, count, total: products.length };
    })
    .sort((a, b) => b.count - a.count);
}

// ── Blind spots ─────────────────────────────────────────────────────────────

const BLIND_SPOT_EXCLUDED = new Set(['custom-brand', 'medication']);

function labelForCategory(cat, labels = {}) {
  return labels[cat] || String(cat).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Catalog categories with nothing in the ecosystem yet, ranked by how many
 * catalog products they hold (the most to explore first). Categories with
 * fewer than `minCatalog` products are skipped so a one-off doesn't fill the
 * list. Purely a count; says nothing about whether the person needs it.
 */
export function getBlindSpots(myProducts, allProducts = [], { labels = {}, limit = 3, minCatalog = 2 } = {}) {
  const owned = new Set(toProductList(myProducts).map((p) => p.category).filter(Boolean));
  const catalogCounts = new Map();
  (Array.isArray(allProducts) ? allProducts : []).forEach((p) => {
    const cat = p?.category;
    if (!cat || BLIND_SPOT_EXCLUDED.has(cat)) return;
    catalogCounts.set(cat, (catalogCounts.get(cat) || 0) + 1);
  });
  const seenLabels = new Set();
  return [...catalogCounts.entries()]
    .filter(([cat, n]) => !owned.has(cat) && n >= minCatalog)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([category, catalogCount]) => ({ category, label: labelForCategory(category, labels), catalogCount }))
    // 'supplement' and 'supplements' share a label; show it once.
    .filter((c) => {
      const k = c.label.toLowerCase();
      if (seenLabels.has(k)) return false;
      seenLabels.add(k);
      return true;
    })
    .slice(0, limit);
}

// ── Routine buckets (localStorage ayna_routine_v1, same key as mobile) ──────

export const ROUTINE_KEY = 'ayna_routine_v1';
export const ROUTINE_BUCKETS = ['morning', 'afternoon', 'evening', 'night', 'monthly', 'yearly'];
export const ROUTINE_BUCKET_LABELS = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  night: 'Night',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

function storage() {
  try {
    return typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
  } catch {
    return null;
  }
}

function readJson(key, fallback) {
  try {
    const raw = storage()?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    // Best effort: a full or blocked localStorage must not break the page.
  }
}

export function sanitizeRoutine(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  const out = {};
  Object.entries(map).forEach(([id, bucket]) => {
    if (id && ROUTINE_BUCKETS.includes(bucket)) out[id] = bucket;
  });
  return out;
}

export function loadRoutine() {
  return sanitizeRoutine(readJson(ROUTINE_KEY, {}));
}

export function saveRoutine(map) {
  writeJson(ROUTINE_KEY, sanitizeRoutine(map));
}

/**
 * Tap-to-assign: tapping a product's current bucket again clears it; any
 * other valid bucket replaces it. One bucket per product. Returns a new map.
 */
export function toggleRoutineBucket(map, productId, bucket) {
  const next = { ...sanitizeRoutine(map) };
  if (!productId || !ROUTINE_BUCKETS.includes(bucket)) return next;
  if (next[productId] === bucket) delete next[productId];
  else next[productId] = bucket;
  return next;
}

/** Products grouped by bucket, plus those not yet sorted. */
export function groupByRoutine(myProducts, map) {
  const routine = sanitizeRoutine(map);
  const groups = Object.fromEntries(ROUTINE_BUCKETS.map((b) => [b, []]));
  const unsorted = [];
  toProductList(myProducts).forEach((p) => {
    const b = routine[p.id];
    if (b) groups[b].push(p);
    else unsorted.push(p);
  });
  return { groups, unsorted };
}

// ── Dismissed alerts ────────────────────────────────────────────────────────

export const DISMISSED_ALERTS_KEY = 'ayna_dismissed_safety_alerts_v1';

export function loadDismissedAlerts() {
  const v = readJson(DISMISSED_ALERTS_KEY, []);
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(-500) : [];
}

export function saveDismissedAlerts(ids) {
  writeJson(DISMISSED_ALERTS_KEY, [...new Set(ids)].slice(-500));
}

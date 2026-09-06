import { CATEGORY_LABELS } from '../../data/products.js';

/**
 * Derives the Shopper Profile screen's sections from real app state
 * (ecosystem products, saved products, quiz answers) instead of the
 * static mock data it originally shipped with. No new tracking exists
 * for things like page views or medication schedules, so this only
 * surfaces what's honestly derivable from data the app already has.
 */

// Matches the tag vocabulary documented at the top of src/data/products.js
// ("preferences: organic, cost, comfort, privacy, sustainability").
// 'Non-hormonal / hormone-free' has no corresponding product tag, so it's
// intentionally left unmapped.
const PREFERENCE_TO_TAG = {
  'Organic/Natural only': 'organic',
  'Lower cost': 'cost',
  'Comfort/Convenience': 'comfort',
  'Privacy & data security': 'privacy',
  'Sustainability/Zero-waste': 'sustainability',
};

const PREFERENCE_LABEL = {
  organic: 'Organic-leaning',
  cost: 'Value-conscious',
  comfort: 'Comfort-first',
  privacy: 'Privacy-focused',
  sustainability: 'Sustainable',
};

// Keyword match against a product's safety.allergens text / tags. Only
// 'Fragrance sensitivity' can actually be produced today —
// mapIntakeToLegacyQuizProfile() (src/utils/healthIntake.js) derives it from
// the intake form's 'fragrance-free' product preference; there's no current
// question that produces 'Latex allergy' or 'Synthetic materials', but they're
// harmless to keep mapped here in case that changes.
const SENSITIVITY_KEYWORDS = {
  'Fragrance sensitivity': ['fragrance'],
  'Latex allergy': ['latex'],
  'Synthetic materials': ['synthetic'],
};

// The catalog's `safety.recalls` field is free text, mostly boilerplate
// ("No recalls.", "N/A", "No known recalls"). The data authors already mark
// the handful of entries actually worth surfacing with a ⚠️ prefix, or with
// a "No formal recalls. Note: ..." aside — that's a far more reliable signal
// than trying to pattern-match every "no recall" phrasing there could ever
// be. Some of those ⚠️ entries explicitly deny an FDA recall (e.g. "has not
// been subject to FDA recall but...") — those are safety concerns, not
// recalls, so a second check looks for a real, non-negated "recall" event
// to decide which badge to show.
function classifySafetyNote(text) {
  const t = (text || '').trim();
  if (!t) return null;
  const flagworthy = t.includes('⚠') || /no formal recalls?\.?\s*note:/i.test(t);
  if (!flagworthy) return null;
  const deniesRecall = /\b(not been subject to|no)\b[^.]*\brecalls?\b/i.test(t);
  const mentionsRecall = /\brecalls?\b/i.test(t);
  return { text: t, isRecall: mentionsRecall && !deniesRecall };
}

function labelForCategory(cat) {
  if (!cat) return 'Uncategorized';
  return CATEGORY_LABELS[cat] || cat.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Safety alerts: real FDA-recall text on ecosystem products, plus a flag
// whenever a quiz-reported sensitivity actually shows up in an owned
// product's allergen info or tags. `myProducts` is expected to carry full
// catalog product objects (as seeded from the quiz / added from a product
// detail page), which is where `safety` and `tags` live.
export function getSafetyAlerts(myProducts = [], quizAnswers = null) {
  const recallAlerts = myProducts
    .map((p) => {
      const note = classifySafetyNote(p?.safety?.recalls);
      if (!note) return null;
      return {
        id: `safety-${p.id}`,
        kind: note.isRecall ? 'recall' : 'note',
        title: p.name,
        body: note.text,
        product: p,
      };
    })
    .filter(Boolean);

  const sensitivities = Array.isArray(quizAnswers?.sensitivities) ? quizAnswers.sensitivities : [];
  const sensitivityAlerts = [];
  sensitivities.forEach((s) => {
    const keywords = SENSITIVITY_KEYWORDS[s];
    if (!keywords) return;
    const matches = myProducts.filter((p) => {
      const haystack = `${p?.safety?.allergens || ''} ${(p?.tags || []).join(' ')}`.toLowerCase();
      return keywords.some((k) => haystack.includes(k));
    });
    if (matches.length) {
      const label = s.replace(/ sensitivity| allergy/i, '');
      sensitivityAlerts.push({
        id: `sensitivity-${s}`,
        kind: 'sensitivity',
        title: `${label} flagged in ${matches.length} item${matches.length === 1 ? '' : 's'}`,
        body: `You told us about a ${s.toLowerCase()} during intake — ${matches.map((m) => m.name).join(', ')}.`,
        product: matches[0],
      });
    }
  });

  return [...recallAlerts, ...sensitivityAlerts];
}

// Brand affinity chips: only rendered for preferences the user actually
// selected during intake, scored by how much of their real ecosystem
// carries the matching product tag.
export function getBrandAffinity(quizAnswers, myProducts = []) {
  const prefs = Array.isArray(quizAnswers?.preference) ? quizAnswers.preference : [];
  const tags = [...new Set(prefs.map((p) => PREFERENCE_TO_TAG[p]).filter(Boolean))];
  const total = myProducts.length;

  return tags
    .map((tag) => {
      const count = myProducts.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag)).length;
      const score = total ? Math.round((count / total) * 100) : 0;
      return { tag, label: PREFERENCE_LABEL[tag] || tag, score, count };
    })
    .sort((a, b) => b.score - a.score);
}

// Most/least represented categories across everything the user owns
// (ecosystem) or has saved — a real proxy for "what they care about",
// since there's no page-view tracking to draw on.
export function getCategoryInsights(myProducts = [], savedMap = {}, allProducts = []) {
  const counts = new Map();
  const add = (cat) => {
    if (!cat) return;
    counts.set(cat, (counts.get(cat) || 0) + 1);
  };
  myProducts.forEach((p) => add(p?.category));
  Object.values(savedMap || {}).forEach((p) => add(p?.category));

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = sorted.length ? sorted[0][1] : 0;
  const top = sorted.slice(0, 4).map(([cat, count], i) => ({
    rank: String(i + 1).padStart(2, '0'),
    name: labelForCategory(cat),
    count: `${count} item${count === 1 ? '' : 's'}`,
    pct: maxCount ? Math.round((count / maxCount) * 100) : 0,
  }));

  const explored = new Set(counts.keys());
  const allCats = new Set(allProducts.map((p) => p?.category).filter(Boolean));
  const low = [...allCats]
    .filter((cat) => !explored.has(cat))
    .slice(0, 3)
    .map((cat) => ({ name: labelForCategory(cat), note: "Not something you've explored yet" }));

  return { top, low };
}

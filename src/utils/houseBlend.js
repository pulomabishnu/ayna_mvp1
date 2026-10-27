// "Your house blend": this-or-that sliders on You (web and app), read from
// and written to her real quiz answers (fullHealthIntake), the same fields
// the matching engine reads (src/matching/userProfile.js). Nothing here is
// invented: a slider only exists for a preference the quiz actually asks.
//
// The board asked for Fragrance-free / Any scent, Budget / Splurge, Pads /
// Cups and Research-first / Reviews-first. The quiz has no pads-vs-cups
// question (formats are pills, gummies, devices, "period-care products"...),
// so that one is left out; "Brands I know / New brands" (brandOpenness) is a
// real spectrum the quiz asks, so it takes the fourth place.
import { PRICE_RANGES, BRAND_OPENNESS, TRUST_ITEMS } from '../mobile/data/intakeModel.js';

const SCENT_FREE = ['Fragrance', 'Fragrance-free', 'Unscented'];
const PRICE_NOT_IMPORTANT = PRICE_RANGES[4];
const EVIDENCE = TRUST_ITEMS[0];
const REVIEWS = TRUST_ITEMS[1];
const arr = (v) => (Array.isArray(v) ? v : []);

export const BLEND = [
  {
    id: 'scent', left: 'Fragrance-free', right: 'Any scent', steps: ['Fragrance-free', 'Any scent'],
    note: 'Leaves fragranced products out of your matches, or lets them in.',
    read: (i) => {
      const avoid = arr(i.avoidIngredients);
      if (avoid.some((x) => SCENT_FREE.includes(x))) return 0;
      // Only "Any scent" when she answered the question at all.
      return avoid.length ? 1 : null;
    },
    write: (i, v) => {
      const avoid = arr(i.avoidIngredients).filter((x) => !SCENT_FREE.includes(x) && x !== 'No preference');
      const prefs = arr(i.productPreferences).filter((x) => x !== 'fragrance-free');
      return v === 0
        ? { ...i, avoidIngredients: [...avoid, 'Fragrance', 'Fragrance-free'], productPreferences: [...prefs, 'fragrance-free'] }
        : { ...i, avoidIngredients: avoid.length ? avoid : ['No preference'], productPreferences: prefs };
    },
  },
  {
    id: 'budget', left: 'Budget', right: 'Splurge', steps: PRICE_RANGES.slice(0, 4),
    note: 'What you usually spend on one item. Picks in your range rank first.',
    read: (i) => {
      const r = arr(i.priceRange);
      if (r.includes(PRICE_NOT_IMPORTANT)) return 3;
      const idx = r.map((x) => PRICE_RANGES.indexOf(x)).filter((n) => n >= 0 && n < 4);
      return idx.length ? Math.max(...idx) : null;
    },
    write: (i, v) => ({ ...i, priceRange: [PRICE_RANGES[v]] }),
  },
  {
    id: 'brands', left: 'Brands I know', right: 'New brands', steps: BRAND_OPENNESS.slice(0, 4),
    note: 'Shifts your picks between familiar names and newer brands.',
    read: (i) => { const n = BRAND_OPENNESS.indexOf(i.brandOpenness); return n >= 0 && n < 4 ? n : null; },
    write: (i, v) => ({ ...i, brandOpenness: BRAND_OPENNESS[v] }),
  },
  {
    id: 'trust', left: 'Research first', right: 'Reviews first', steps: ['Research first', 'Reviews first'],
    note: 'Which counts more when two products fit you equally.',
    read: (i) => {
      const r = arr(i.trustRanking);
      const touched = i.trustRankingTouched === true || (i.trustRankingTouched === undefined && r.length > 0);
      if (!touched) return null;
      const e = r.indexOf(EVIDENCE);
      const v = r.indexOf(REVIEWS);
      if (e < 0 || v < 0) return null;
      return v < e ? 1 : 0;
    },
    write: (i, v) => {
      const rest = TRUST_ITEMS.filter((x) => x !== EVIDENCE && x !== REVIEWS);
      return { ...i, trustRanking: v === 1 ? [REVIEWS, EVIDENCE, ...rest] : [EVIDENCE, REVIEWS, ...rest], trustRankingTouched: true };
    },
  },
];

/** The four sliders with her current values (null = not answered yet). */
export function readBlend(intake) {
  const i = intake && typeof intake === 'object' ? intake : {};
  return BLEND.map((b) => ({ ...b, value: b.read(i) }));
}

/** A new intake with one slider changed. Pure: the caller saves it. */
export function applyBlend(intake, id, value) {
  const b = BLEND.find((x) => x.id === id);
  if (!b) return intake;
  const v = Math.max(0, Math.min(b.steps.length - 1, Math.round(Number(value))));
  return b.write({ ...(intake || {}) }, v);
}

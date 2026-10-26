// "Things to avoid" filter (Explore audit v3, #17 food-scan app "Want to
// avoid"): leave out products that are not confirmed free of something.
// Uses the match engine's own product attributes (matching/productProfile
// ATTRIBUTE_RULES on the record): a product passes only when its status for
// that attribute is 'no' (free of it, as labeled) or 'not_applicable'.
// Silence is never "free of" (the engine's rule). Her own avoid list and
// allergies (from her answers) are offered first; nothing is pre-selected.
import { buildUserProfile } from '../../matching/index.js';
import { buildProductProfile } from '../../matching/productProfile.js';
import { ATTRIBUTE_PHRASE } from '../../matching/ontology.js';

/** The chips, in order: the attributes the engine reads from labels. */
export const AVOID_OPTIONS = [
  { attr: 'fragrance', label: 'Fragrance' },
  { attr: 'dyes', label: 'Dyes' },
  { attr: 'parabens', label: 'Parabens' },
  { attr: 'latex', label: 'Latex' },
  { attr: 'sulfates', label: 'Sulfates' },
  { attr: 'phthalates', label: 'Phthalates' },
];

const cache = new WeakMap();
function statusOf(product, attr) {
  if (!product || typeof product !== 'object') return 'unknown';
  let pp = cache.get(product);
  if (!pp) { try { pp = buildProductProfile(product); } catch { pp = null; } cache.set(product, pp || {}); }
  return pp?.safety?.details?.[attr]?.status || 'unknown';
}

/** True when the product is confirmed free of every attribute in `attrs` (as labeled). */
export function passesAvoid(product, attrs = []) {
  if (!attrs.length) return true;
  return attrs.every((a) => ['no', 'not_applicable'].includes(statusOf(product, a)));
}

/** The attributes she asked to leave out, or is allergic to, that the chips cover. */
export function herAvoidAttrs(quizAnswers) {
  if (!quizAnswers) return [];
  try {
    const intake = quizAnswers.fullHealthIntake || quizAnswers;
    const s = buildUserProfile(intake)?.safety || {};
    const attrs = [...(s.leaveOut || []).map((l) => l.attr), ...(s.allergies || []).map((a) => a.attr)].filter(Boolean);
    return AVOID_OPTIONS.map((o) => o.attr).filter((a) => attrs.includes(a));
  } catch { return []; }
}

export const avoidPhrase = (attr) => ATTRIBUTE_PHRASE[attr] || attr;

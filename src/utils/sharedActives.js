// Two or more of her products sharing an active ingredient (e.g. two with
// chasteberry). Used by Appointment prep and the Routine on You, so both
// flag the same overlaps.

// Filler words that appear in many labels and say nothing about overlap.
const NOT_ACTIVE = /^(water|aqua|glycerin|cellulose|gelatin|silica|rice flour|magnesium stearate|cotton|organic cotton|sugar|natural flavors?|citric acid|pectin|cane sugar|tapioca|vegetable cellulose|microcrystalline cellulose|stearic acid|not listed.*)$/i;

export function activesOf(p) {
  return String(p?.ingredients || '').split(/[,;]|\band\b/i)
    .map((t) => t.replace(/\([^)]*\)/g, '').replace(/\d+(\.\d+)?\s*(mg|mcg|g|iu|%)/gi, '').trim().toLowerCase())
    .filter((t) => t.length > 2 && t.length < 40 && !NOT_ACTIVE.test(t));
}

export const isService = (p) => p?.type === 'digital' || /telehealth|tracker|mental-health/.test(String(p?.category || ''));

/** [[active, [product names]]] for actives found in 2+ products, at most `limit`. */
export function findSharedActives(products, limit = 4) {
  const seen = new Map();
  (products || []).filter((p) => p && !isService(p)).forEach((p) => new Set(activesOf(p)).forEach((a) => seen.set(a, [...(seen.get(a) || []), p.name])));
  return [...seen.entries()].filter(([, names]) => names.length > 1).slice(0, limit);
}

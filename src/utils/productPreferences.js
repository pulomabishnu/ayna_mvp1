/**
 * One shared definition of the Browse "Preferences" filter, used by
 * Discovery and the live landing Browse. The two used to disagree ('reusable'
 * existed in one list only, so it matched nothing in Discovery), and several
 * options (Vegan, Cruelty Free, Clean Ingredients) matched zero catalog
 * products, so choosing them silently emptied the grid (2026-09-22 audit).
 *
 * Matching uses only real catalog text/tags/ingredients — never inferred.
 */
const PREFERENCE_PATTERNS = {
  organic: /\borganic\b/,
  'fragrance-free': /fragrance[\s-]free|\bunscented\b|no (added )?fragrance|free (of|from) fragrance/,
  'sensitive-skin': /sensitive skin|hypoallergenic|dermatologist[\s-]tested|\bgentle\b/,
  vegan: /\bvegan\b|plant[\s-]based/,
  'cruelty-free': /cruelty[\s-]free|leaping bunny|not tested on animals/,
  reusable: /\breusable\b/,
  'clean-ingredients': /clean ingredients|non[\s-]toxic|chlorine[\s-]free|no chlorine|toxin[\s-]free|paraben[\s-]free|dioxin[\s-]free/,
};

export const PREFERENCE_OPTIONS = [
  { value: 'organic', label: 'Organic' },
  { value: 'fragrance-free', label: 'Fragrance Free' },
  { value: 'sensitive-skin', label: 'Sensitive Skin' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'cruelty-free', label: 'Cruelty Free' },
  { value: 'reusable', label: 'Reusable' },
  { value: 'clean-ingredients', label: 'Clean Ingredients' },
];

function preferenceText(product) {
  const ingredients = Array.isArray(product?.ingredients) ? product.ingredients.join(' ') : product?.ingredients;
  return [
    product?.name, product?.brand, product?.category, product?.summary, product?.description, product?.tagline,
    ingredients, product?.safety?.materials,
    ...(Array.isArray(product?.tags) ? product.tags : []),
    ...(Array.isArray(product?.badges) ? product.badges : []),
  ].filter(Boolean).join(' ').toLowerCase();
}

export function matchesProductPreference(product, preference) {
  if (!preference || preference === 'all') return true;
  const re = PREFERENCE_PATTERNS[preference];
  if (!re) return true; // unknown value: never silently empty the grid
  return re.test(preferenceText(product));
}

/** Only offer options that at least one product in `products` actually matches. */
export function availablePreferenceOptions(products) {
  const list = Array.isArray(products) ? products : [];
  return PREFERENCE_OPTIONS.filter((opt) => list.some((p) => matchesProductPreference(p, opt.value)));
}

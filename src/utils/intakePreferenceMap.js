/** Intake "Preferences" step options and their recommendation-profile values. */
export const AVOID_INGREDIENTS = [
  'Fragrance',
  'Dyes',
  'Parabens',
  'Sulfates',
  'Phthalates',
  'Latex',
  'Synthetic materials',
  'Animal-derived',
  'Added sugar',
  'Artificial sweeteners',
  'Pregnancy considerations',
  'Fragrance-free',
  'Dye-free',
  'Paraben-free',
  'Sulfate-free',
  'Latex-free',
  'Vegan',
  'Cruelty-free',
  'Black-owned',
  'Brown-owned',
  'Eco-friendly',
  'Reusable',
  'Organic',
  'Minimal ingredients',
  'Sensitive skin',
  'Unscented',
  'Other',
  'No preference',
];

// Every AVOID_INGREDIENTS option must map here (see HealthIntakeForm
// preference tests) — options missing from this map were silently dropped
// from the recommendation profile (2026-09-22 audit: Vegan, Organic,
// Fragrance-free, Unscented, and the whole "-free" group did nothing, and
// 'Animal-derived' never matched its 'Animal-derived ingredients' key).
export const PREFERENCE_MAP = {
  Fragrance: 'fragrance-free', Dyes: 'dye-free', Parabens: 'paraben-free', Sulfates: 'sulfate-free',
  Phthalates: 'phthalate-free', Latex: 'latex-free', 'Synthetic materials': 'natural-materials',
  'Animal-derived': 'vegan', 'Animal-derived ingredients': 'vegan',
  'Added sugar': 'sugar-free', 'Artificial sweeteners': 'no-artificial-sweeteners',
  'Pregnancy considerations': 'pregnancy-safe',
  'Fragrance-free': 'fragrance-free', Unscented: 'fragrance-free', 'Dye-free': 'dye-free',
  'Paraben-free': 'paraben-free', 'Sulfate-free': 'sulfate-free', 'Latex-free': 'latex-free',
  Vegan: 'vegan', 'Cruelty-free': 'cruelty-free', 'Black-owned': 'black-owned', 'Brown-owned': 'brown-owned',
  'Eco-friendly': 'eco-friendly', Reusable: 'reusable', Organic: 'organic',
  'Minimal ingredients': 'minimal-ingredients', 'Sensitive skin': 'sensitive-skin',
};

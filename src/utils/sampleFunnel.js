import { ALL_PRODUCTS, getProfileMatchPercentForProduct } from '../data/products';

// How It Works funnel, computed live from the real catalog and the real
// matching code for one sample profile, instead of made-up example numbers.
export const SAMPLE_PROFILE_CHIPS = ['Postpartum', 'Sensitive skin'];
const SAMPLE_PROFILE = {
  frustrations: ['Postpartum recovery'],
  sensitivities: ['Sensitive skin'],
  lifeStage: 'I am postpartum',
  preference: [],
};

let cached = null;
export function getSampleFunnel() {
  if (cached) return cached;
  const scores = ALL_PRODUCTS.map((p) => getProfileMatchPercentForProduct(p, SAMPLE_PROFILE, null) || 0);
  cached = {
    catalog: ALL_PRODUCTS.length,
    matched: scores.filter((s) => s > 0).length,
    strong: scores.filter((s) => s >= 90).length,
  };
  return cached;
}

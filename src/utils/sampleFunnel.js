import { ALL_PRODUCTS, getProfileMatchPercentForProduct, filterPrescriptionCareGate, isTeenProduct } from '../data/products.js';
import { RELEASED_STARTUPS } from '../data/startups';
import { fitLabel } from './matchDisplay.js';

// How It Works funnel, computed live from the real catalog and the real
// matching code for one sample profile, instead of made-up example numbers.
// The example is chosen, not invented (founder, Oct 26): someone with heavy
// periods and cramps, 28, regular periods, no safety flags. Every number is
// still run live through the real matcher on today's catalog.
export const SAMPLE_LABEL = 'Sample: someone with heavy periods and cramps';
export const SAMPLE_PROFILE_CHIPS = ['Heavy periods', 'Cramps', 'Age 28'];
const SAMPLE_PROFILE = {
  frustrations: ['Heavy periods', 'Cramps or period pain'],
  sensitivities: [],
  lifeStage: 'I have regular periods',
  preference: [],
  age: 28,
};

let cached = null;
export function getSampleFunnel() {
  if (cached) return cached;
  const scores = ALL_PRODUCTS.map((p) => getProfileMatchPercentForProduct(p, SAMPLE_PROFILE, null) || 0);
  cached = {
    // Same catalog the Shop counts: shoppable products plus released services.
    catalog: filterPrescriptionCareGate(ALL_PRODUCTS).filter((p) => !isTeenProduct(p)).length + RELEASED_STARTUPS.length,
    matched: scores.filter((s) => s > 0).length,
    // Same line the product draws everywhere: 80+ is a "Strong fit" (matchDisplay.fitLabel).
    strong: scores.filter((s) => fitLabel(s) === 'Strong fit').length,
  };
  return cached;
}

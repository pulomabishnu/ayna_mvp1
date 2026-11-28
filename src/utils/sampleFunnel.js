import { ALL_PRODUCTS, getProfileMatchPercentForProduct } from '../data/products.js';
import { RELEASED_STARTUPS } from '../data/startups';
import { fitLabel } from './matchDisplay.js';
import { shopCatalogCounts } from '../data/catalogCounts.js';

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
let cachedFor = null;
export function getSampleFunnel() {
  // Keyed on the catalog list: the live catalog (every product) replaces the bundled one after load.
  if (cached && cachedFor === ALL_PRODUCTS) return cached;
  cachedFor = ALL_PRODUCTS;
  const scores = ALL_PRODUCTS.map((p) => getProfileMatchPercentForProduct(p, SAMPLE_PROFILE, null) || 0);
  cached = {
    // Same catalog the Shop counts: shoppable products plus released services.
    // Nov 27 audit: Home said 841 and How it works said 856 for the same catalog. Both now use the Shop's own count.
    catalog: (({ products, services }) => products + services)(shopCatalogCounts(ALL_PRODUCTS, RELEASED_STARTUPS)),
    matched: scores.filter((s) => s > 0).length,
    // Same line the product draws everywhere: 80+ is a "Strong fit" (matchDisplay.fitLabel).
    strong: scores.filter((s) => fitLabel(s) === 'Strong fit').length,
  };
  return cached;
}

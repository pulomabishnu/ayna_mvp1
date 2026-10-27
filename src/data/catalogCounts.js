// One source of truth for "how many products / services ayna lists": the same
// filtered catalog the Shop and Services pages show (prescription gate, 18+ only,
// one split into products and services, the app's and the website's). The home page
// stats use this, so their numbers always match the Shop and Services counts.
// The catalog data itself is untouched.
import { ALL_PRODUCTS, filterPrescriptionCareGate, isTeenProduct } from './catalog.js';
import { RELEASED_STARTUPS } from './startups.js';
import { isService } from '../utils/search/exploreSearch.js';

/** Services are the women's health companies (startups) and digital entries; everything else is a product. */
export const isServiceListing = isService;

/** { products, services }: what the Shop and Services pages list when browsing with no filters. */
export function shopCatalogCounts(products = ALL_PRODUCTS, startups = RELEASED_STARTUPS) {
  const gated = filterPrescriptionCareGate(products).filter((p) => !isTeenProduct(p));
  const all = [...gated, ...startups.map((s) => ({ ...s, type: 'digital' }))];
  return { products: gated.filter((p) => !isService(p)).length, services: all.filter(isService).length };
}

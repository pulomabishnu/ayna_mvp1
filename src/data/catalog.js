// The catalog, loaded after first paint.
//
// products.js and everything it pulls in (every product file, the research
// core, the passport reviews, the matching engine) is about 3MB of
// JavaScript. It used to sit in the entry chunk, so every page waited for it
// to download and run before showing anything. The site shell imports the
// catalog from here instead: the taxonomy and the pure profile helpers are
// small and ready at once, and the catalog itself arrives as its own chunk.
//
// Before it arrives ALL_PRODUCTS is an empty list and the lookups return
// "nothing yet" (null / [] / {}). Components that read the catalog while
// rendering call useCatalogReady() so they render again when it lands;
// effects and callbacks that need it await loadCatalog() or list catalogReady
// in their dependencies. products.js registers itself when it runs
// (catalogRegistry.js), so pages whose chunk imports it directly (the product
// page, Ecosystem, the app) see it at once. The product page's prerendered
// HTML preloads it with the entry (scripts/prerender.mjs); Shop paints its
// head first and shows placeholder cards until it lands.
import { useSyncExternalStore } from 'react';
import { catalogNow, subscribeCatalog } from './catalogRegistry.js';

export { HEALTH_FUNCTIONS, CATEGORY_LABELS, MACRO_GROUPS, BROWSE_GROUPS, browseGroupIdFor, productSearchText, itemMatchesMacroGroup } from './catalogTaxonomy.js';
export { hasStatedLifeStage, matchEngine } from './profileSignals.js';

let pending = null;

/** Every product the site shows: [] until the catalog loads, then products.js's ALL_PRODUCTS (a live binding). */
export let ALL_PRODUCTS = [];
let catalog = null;
/** Supplement ids per symptom (products.js): {} until the catalog loads (a live binding). */
export let SYMPTOM_TO_SUPPLEMENTS = {};
const adopt = () => {
  catalog = catalogNow();
  if (catalog) { ALL_PRODUCTS = catalog.ALL_PRODUCTS; SYMPTOM_TO_SUPPLEMENTS = catalog.SYMPTOM_TO_SUPPLEMENTS; }
};
// products.js registers itself when it runs, whichever chunk imported it
// (the product page, Ecosystem and the app import it directly).
subscribeCatalog(adopt);
adopt();

/** Starts loading the catalog (once) and resolves with its API. */
export function loadCatalog() {
  if (catalog) return Promise.resolve(catalog);
  if (!pending) {
    pending = import('./products.js').then(() => { adopt(); return catalog; }).catch((err) => {
      // A failed chunk (offline mid-deploy) can be retried by the next caller.
      pending = null;
      throw err;
    });
  }
  return pending;
}

export function isCatalogReady() { return catalog !== null; }

/** True once the catalog has loaded; re-renders the caller when it does (and starts the load). */
export function useCatalogReady() {
  if (!catalog && !pending) loadCatalog().catch(() => {});
  return useSyncExternalStore(subscribeCatalog, isCatalogReady, isCatalogReady);
}

const call = (name, empty) => (...args) => (catalog ? catalog[name](...args) : empty());

export const getProductById = call('getProductById', () => null);
export const getRecommendations = call('getRecommendations', () => []);
export const getPersonalizedProductIds = call('getPersonalizedProductIds', () => []);
export const getTopMatch = call('getTopMatch', () => null);
export const getSelectedNeeds = call('getSelectedNeeds', () => []);
export const getProductMatchDetailsForProduct = call('getProductMatchDetailsForProduct', () => null);
export const getProfileMatchLabelsForProduct = call('getProfileMatchLabelsForProduct', () => []);
export const getEcosystemSeedFromQuiz = call('getEcosystemSeedFromQuiz', () => ({ seedMeta: null, mergedProducts: {}, shelves: [] }));
export const getProfileMatchPercentForProduct = call('getProfileMatchPercentForProduct', () => null);
export const getProductRelevanceScore = call('getProductRelevanceScore', () => null);
export const isTeenProduct = call('isTeenProduct', () => false);
// Rx-only care gate: nothing passes before the catalog loads (it can't be checked yet).
export const filterPrescriptionCareGate = call('filterPrescriptionCareGate', () => []);

const NO_IDS = new Set();
/** Ids of the drugstore basics (empty until the catalog loads). */
export const basicsProductIds = () => (catalog ? catalog.BASICS_PRODUCT_IDS : NO_IDS);

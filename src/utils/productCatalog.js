/**
 * Catalog loader.
 *
 * MIGRATION STATE — read this before deleting anything in src/data/.
 *
 * The catalog is moving out of the JS bundle and into product_catalog, served
 * by /api/products. Until the table is seeded and verified in every
 * environment, the bundled copy stays as a fallback, so:
 *
 *   - a failed/unseeded API is indistinguishable from today's behaviour;
 *   - nobody sees an empty product catalog on a health app;
 *   - the bundle does NOT shrink yet.
 *
 * TO COMPLETE THE MIGRATION (after `supabase/seed/product_catalog.sql` is
 * applied and /api/products returns 200 with the expected count):
 *   1. delete the `import { ALL_PRODUCTS }` line below and the BUNDLED_FALLBACK
 *      reference;
 *   2. delete src/data/{products,mvpProducts,productsExtended,productsExtended2,
 *      categoryFillers,menstrualProducts}.js — keeping the pure functions
 *      (getRecommendations, CATEGORY_LABELS, HEALTH_FUNCTIONS, ...) which are
 *      logic, not data;
 *   3. rerun `npm run build` — the bundle should drop by roughly 40%.
 *
 * Keep `scripts/export-catalog.mjs` either way: it is how the seed file is
 * regenerated, and `--check` proves the export is lossless.
 */
import { ALL_PRODUCTS as BUNDLED_FALLBACK } from '../data/products.js';

const API_PATH = '/api/products';
const CACHE_KEY = 'ayna_product_catalog_v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const REQUEST_TIMEOUT_MS = 10_000;

let inFlight = null;
let memo = null;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, products } = JSON.parse(raw);
    if (!Array.isArray(products) || !products.length) return null;
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return products;
  } catch {
    return null;
  }
}

function writeCache(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), products }));
  } catch {
    // Quota or private mode — the in-memory memo still serves this session.
  }
}

/**
 * @returns {Promise<{ products: object[], source: 'api'|'cache'|'bundled' }>}
 *   `source` is exposed so callers can tell a live catalog from the fallback;
 *   surfacing "showing a cached catalog" beats silently serving stale data.
 */
export async function loadProductCatalog() {
  if (memo) return memo;

  const cached = readCache();
  if (cached) {
    memo = { products: cached, source: 'cache' };
    return memo;
  }

  // Single-flight: several components mount at once and would otherwise each
  // fetch the whole catalog.
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const res = await fetch(API_PATH, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const products = Array.isArray(data?.products) ? data.products : [];
      if (!products.length) throw new Error('empty catalog');
      writeCache(products);
      memo = { products, source: 'api' };
      return memo;
    } catch (e) {
      // Deliberately NOT cached: a transient failure must not pin the fallback.
      console.warn('[Ayna] product catalog API unavailable, using bundled copy:', e?.message);
      return { products: BUNDLED_FALLBACK, source: 'bundled' };
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Synchronous accessor for code paths that cannot await (render-time filters). */
export function getLoadedCatalog() {
  return memo?.products || BUNDLED_FALLBACK;
}

/** Force a refetch — used after an admin edit, or to recover from the fallback. */
export function invalidateProductCatalog() {
  memo = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // no-op
  }
}

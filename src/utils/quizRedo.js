/**
 * Redo-quiz choices, shared by the website and the app.
 *
 *  - Keep my products and add new ones: nothing she has is removed. Matches
 *    from the new answers that are not already in her Ecosystem are added.
 *  - Start fresh: the existing full reset (clears her Ecosystem, its product
 *    tracking and her quiz answers), behind a second, explicit warning.
 *
 * And after she connects health data (Apple Health, Google Fit, records, a
 * wearable summary), new matches are offered, never added on their own.
 */

export const REDO_KEEP = 'keep';
export const REDO_FRESH = 'fresh';

const idOf = (p) => (p && typeof p === 'object' ? p.id : null);
const has = (collection, id) => {
  if (!collection || !id) return false;
  if (Array.isArray(collection)) return collection.some((p) => idOf(p) === id || p === id);
  return Boolean(collection[id]);
};

/**
 * Products from `candidates` she does not already have and has not hidden.
 * Keeps the candidates' order, drops duplicates and hidden catalog entries.
 * `ecosystem` and `omitted` may be an id-keyed object or an array of products.
 */
export function productsNotInEcosystem(candidates, ecosystem = {}, omitted = {}) {
  const seen = new Set();
  const out = [];
  for (const p of Array.isArray(candidates) ? candidates : Object.values(candidates || {})) {
    const id = idOf(p);
    if (!id || seen.has(id) || p.hidden === true) continue;
    seen.add(id);
    if (has(ecosystem, id) || has(omitted, id)) continue;
    out.push(p);
  }
  return out;
}

/** Id-keyed Ecosystem plus `additions`. Never removes or replaces anything already there. */
export function addWithoutRemoving(prev = {}, additions = []) {
  const next = { ...prev };
  for (const p of additions) {
    const id = idOf(p);
    if (id && !next[id]) next[id] = p;
  }
  return next;
}

/** Array version (the app keeps her Ecosystem as a list). */
export function appendWithoutRemoving(prev = [], additions = []) {
  const ids = new Set(prev.map(idOf));
  return [...prev, ...additions.filter((p) => idOf(p) && !ids.has(idOf(p)) && ids.add(idOf(p)))];
}

/**
 * What "Start fresh" deletes, in plain words, for the second warning. Matches
 * exactly what the reset does (clearEcosystemForUser with includeTracking, and
 * clearing the saved quiz answers). Saved products, check-ins and the account
 * are not touched.
 */
export function freshStartWarning({ productCount = 0, trackedCount = 0 } = {}) {
  const n = Math.max(0, Number(productCount) || 0);
  const products = `${n} product${n === 1 ? '' : 's'}`;
  const clears = [
    n ? `All ${products} in your Ecosystem` : 'Your Ecosystem',
    trackedCount ? `Recall tracking and routine spots for ${trackedCount} product${trackedCount === 1 ? '' : 's'}` : 'Recall tracking and routine spots',
    'Products you hid from your picks',
    'Your quiz answers',
  ];
  return {
    title: 'Delete your Ecosystem and start over?',
    clears,
    keeps: ['Saved products', 'Monthly check-ins', 'Reviews and community posts', 'Your account'],
    permanence: "This can't be undone.",
    confirmLabel: n ? `Delete ${products} and start over` : 'Clear and start over',
  };
}

const sourceKeys = (profile) => {
  const s = profile?.sources || {};
  const keys = new Set();
  if (s.appleHealth) keys.add('Apple Health');
  if (s.googleFit) keys.add('Google Fit');
  if (s.fhir) keys.add('health records');
  if (String(profile?.wearableSummary?.text || '').trim()) keys.add('wearable data');
  return keys;
};

/** Health data sources present in `next` that were not in `prev` (names for the message). */
export function addedHealthSources(prev, next) {
  const before = sourceKeys(prev);
  return [...sourceKeys(next)].filter((k) => !before.has(k));
}

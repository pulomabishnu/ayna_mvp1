// Checks OpenFDA for real recall data for a product.
//
// SAFETY: `status` must be propagated to the UI. A failed lookup is NOT the
// same as "no recalls found", and the previous version collapsed the two —
// every network error, timeout, and non-200 became `{hasRecalls: false}`,
// which the product modal rendered as a green "No FDA Recalls Found".
//
// Failures are also no longer cached: a single transient blip used to pin a
// false all-clear for the rest of the page session.

const cache = new Map();
const MAX_CACHE_ENTRIES = 200;
const REQUEST_TIMEOUT_MS = 12000;

/** @typedef {'ok'|'partial'|'failed'|'skipped'} RecallStatus */

function failure(reason) {
  // hasRecalls is null, not false — "unknown", so a truthiness check in the UI
  // cannot accidentally render this as an all-clear.
  return { status: 'failed', hasRecalls: null, recalls: [], reason };
}

function remember(key, value) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

/**
 * @param {string} name
 * @param {string} [brand]
 * @param {string} [category]
 * @returns {Promise<{status: RecallStatus, hasRecalls: boolean|null, recalls: object[], reason?: string}>}
 */
export async function fetchFdaRecall(name, brand = '', category = '') {
  if (!name) return failure('missing_name');
  const key = `${brand}|${name}|${category}`;
  if (cache.has(key)) return cache.get(key);

  try {
    const params = new URLSearchParams({ name, brand: brand || '', category: category || '' });
    const res = await fetch(`/api/fda-recall?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      // Deliberately NOT cached — a transient failure must not stick.
      return failure(data?.message || `http_${res.status}`);
    }

    const status = data.status || 'ok';
    const result = {
      status,
      hasRecalls: status === 'failed' ? null : !!data.hasRecalls,
      recalls: Array.isArray(data.recalls) ? data.recalls : [],
      // Terminated + >2yr old. Kept separate so they read as context rather
      // than as a live alert.
      historicalRecalls: Array.isArray(data.historicalRecalls) ? data.historicalRecalls : [],
      hasHistoricalRecalls: !!data.hasHistoricalRecalls,
      skipped: !!data.skipped,
      checkedAt: data.checkedAt || '',
      failedDatasets: Array.isArray(data.failedDatasets) ? data.failedDatasets : [],
    };

    // Only a complete, trustworthy answer is worth caching.
    if (status === 'ok' || status === 'skipped') remember(key, result);
    return result;
  } catch (e) {
    return failure(e?.name === 'TimeoutError' ? 'timeout' : 'network');
  }
}

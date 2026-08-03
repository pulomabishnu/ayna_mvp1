const API_PATH = '/api/llm-recommendations';
/** Prevents the ecosystem page from showing “Loading…” forever if the server never responds. */
// Must sit ABOVE the server's function ceiling (vercel.json maxDuration = 60s)
// plus network overhead. The old 150s value was paired with a client that
// batched work assuming a 252s server budget, so the client aborted ~100s
// before the server could possibly finish and threw the work away.
const DEFAULT_FETCH_TIMEOUT_MS = 75_000;
const MEMORY_KEY = 'ayna_llm_learning_memory_v1';
/** Persistent cache so re-login does not re-call the LLM for the same intake. */
const RECS_CACHE_KEY = 'ayna_llm_recommendations_by_intake_v2';
const FETCHED_FINGERPRINT_KEY = 'ayna_llm_recommendations_fetched_fingerprint_v2';

function stableStringify(val) {
  if (val === null || typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) return '[' + val.map(stableStringify).join(',') + ']';
  const keys = Object.keys(val).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(val[k])).join(',') + '}';
}

/**
  * Stable id for one ecosystem build, derived from the intake fingerprint.
  * The server claims quota against this rather than per request, so every batch
  * of a build shares one claim and a retry after failure costs nothing.
  */
export function buildIdFromFingerprint(fingerprint) {
  const s = String(fingerprint || '');
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 + s.charCodeAt(i), 2246822519);
  }
  return `build_${(h1 >>> 0).toString(36)}${(h2 >>> 0).toString(36)}`;
}

export function fingerprintIntake(intake) {
  if (!intake || typeof intake !== 'object' || Object.keys(intake).length === 0) return '';
  try {
    return stableStringify(intake);
  } catch {
    return '';
  }
}

export function loadCachedLlmRecommendations(fingerprint) {
  if (!fingerprint || typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(RECS_CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || o.fingerprint !== fingerprint) return null;
    const recs = o.recommendations;
    return Array.isArray(recs) && recs.length > 0 ? recs : null;
  } catch {
    return null;
  }
}

/**
  * @returns {boolean} whether the payload was actually persisted. The caller MUST
  * check this before recording the fingerprint as fetched: a swallowed
  * QuotaExceededError plus a recorded fingerprint is the exact combination that
  * leaves the ecosystem permanently empty with no error.
  */
export function saveCachedLlmRecommendations(fingerprint, recommendations) {
  if (!fingerprint || typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(
      RECS_CACHE_KEY,
      JSON.stringify({ fingerprint, recommendations })
    );
    return true;
  } catch (e) {
    console.warn('[Ayna] could not cache recommendations (quota or private mode):', e?.name);
    return false;
  }
}

export function clearCachedLlmRecommendations() {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(RECS_CACHE_KEY);
    window.localStorage.removeItem(FETCHED_FINGERPRINT_KEY);
  } catch {
    // no-op
  }
}

export function loadFetchedLlmFingerprint() {
  if (typeof window === 'undefined') return '';
  try {
    return String(window.localStorage.getItem(FETCHED_FINGERPRINT_KEY) || '');
  } catch {
    return '';
  }
}

export function saveFetchedLlmFingerprint(fingerprint) {
  if (!fingerprint || typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FETCHED_FINGERPRINT_KEY, String(fingerprint));
  } catch {
    // no-op
  }
}

function asIdList(mapLike) {
  if (!mapLike || typeof mapLike !== 'object') return [];
  return Object.keys(mapLike);
}

export function buildLlmRecommendationsRequestBody({
  intake,
  trackedProducts = {},
  myProducts = {},
  omittedProducts = {},
  learningMemory = null,
  batchIndex = 0,
  batchSize = null,
  buildId = '',
} = {}) {
  if (!intake || typeof intake !== 'object') return null;
  const body = {
    intake,
    buildId,
    feedback: {
      trackedProductIds: asIdList(trackedProducts),
      ecosystemProductIds: asIdList(myProducts),
      omittedProductIds: asIdList(omittedProducts),
      learningMemory: learningMemory || {},
    },
  };
  if (batchSize !== null) {
    body.batchIndex = batchIndex;
    body.batchSize = batchSize;
  }
  return body;
}

export function loadLearningMemory() {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(MEMORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveLearningMemory(memory) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(memory || {}));
  } catch {
    // no-op
  }
}

/**
 * @param {object} options — passed to build body (intake, feedback maps, etc.)
 * @param {{ timeoutMs?: number, signal?: AbortSignal }} [fetchOpts] — `signal` lets a caller
 *   cancel the request directly (e.g. a user-clicked Cancel button), distinct from the
 *   internal timeout-based abort.
 */
export async function fetchLlmRecommendations(options = {}, fetchOpts = {}) {
  const body = buildLlmRecommendationsRequestBody(options);
  if (!body) throw new Error('Missing intake profile');

  const timeoutMs = typeof fetchOpts.timeoutMs === 'number' ? fetchOpts.timeoutMs : DEFAULT_FETCH_TIMEOUT_MS;
  const { authToken, signal: externalSignal } = fetchOpts;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener('abort', onExternalAbort);
  }

  let res;
  try {
    res = await fetch(API_PATH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      if (externalSignal?.aborted) {
        const err = new Error('Cancelled');
        err.code = 'cancelled';
        throw err;
      }
      const err = new Error('Recommendations request timed out. Check your connection and try “Refresh recommendations”.');
      err.code = 'timeout';
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(tid);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid recommendation response');
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = data?.error;
    throw err;
  }

  return data;
}

import posthog from 'posthog-js';
import { getSupabaseClient } from './supabaseClient';
import {
  loadLearningMemorySession,
  saveLearningMemorySession,
  saveLearningMemoryForUser,
} from './learningMemoryStore';

const API_PATH = '/api/llm-recommendations';
const DEFAULT_FETCH_TIMEOUT_MS = 75_000;
const RECS_CACHE_KEY = 'ayna_llm_recommendations_by_intake_v2';
const FETCHED_FINGERPRINT_KEY = 'ayna_llm_recommendations_fetched_fingerprint_v2';

function captureRecommendationAnalytics(event, properties) {
  try { posthog.capture(event, properties); } catch { /* analytics must never break recommendations */ }
}

function stableStringify(val) {
  if (val === null || typeof val !== 'object') return JSON.stringify(val);
  if (Array.isArray(val)) return '[' + val.map(stableStringify).join(',') + ']';
  const keys = Object.keys(val).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(val[k])).join(',') + '}';
}

function migrateLegacyCacheKey(key) {
  if (typeof window === 'undefined') return null;
  try {
    const current = window.sessionStorage.getItem(key);
    if (current != null) return current;
    const legacy = window.localStorage.getItem(key);
    if (legacy == null) return null;
    try { window.sessionStorage.setItem(key, legacy); } catch (_) {}
    try { window.localStorage.removeItem(key); } catch (_) {}
    return legacy;
  } catch {
    return null;
  }
}

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
    const raw = migrateLegacyCacheKey(RECS_CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || o.fingerprint !== fingerprint) return null;
    const recs = o.recommendations;
    return Array.isArray(recs) && recs.length > 0 ? recs : null;
  } catch {
    return null;
  }
}

export function saveCachedLlmRecommendations(fingerprint, recommendations) {
  if (!fingerprint || typeof window === 'undefined') return false;
  try {
    window.sessionStorage.setItem(
      RECS_CACHE_KEY,
      JSON.stringify({ fingerprint, recommendations })
    );
    try { window.localStorage.removeItem(RECS_CACHE_KEY); } catch (_) {}
    return true;
  } catch (e) {
    console.warn('[Ayna] could not cache recommendations for this session:', e?.name);
    return false;
  }
}

export function clearCachedLlmRecommendations() {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(RECS_CACHE_KEY);
    window.sessionStorage.removeItem(FETCHED_FINGERPRINT_KEY);
    window.localStorage.removeItem(RECS_CACHE_KEY);
    window.localStorage.removeItem(FETCHED_FINGERPRINT_KEY);
  } catch {
    // no-op
  }
}

export function loadFetchedLlmFingerprint() {
  if (typeof window === 'undefined') return '';
  try {
    return String(migrateLegacyCacheKey(FETCHED_FINGERPRINT_KEY) || '');
  } catch {
    return '';
  }
}

export function saveFetchedLlmFingerprint(fingerprint) {
  if (!fingerprint || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(FETCHED_FINGERPRINT_KEY, String(fingerprint));
    try { window.localStorage.removeItem(FETCHED_FINGERPRINT_KEY); } catch (_) {}
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
  return loadLearningMemorySession();
}

export function saveLearningMemory(memory) {
  saveLearningMemorySession(memory);

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession()
      .then(({ data }) => {
        const userId = data?.session?.user?.id;
        if (!userId) return;
        return saveLearningMemoryForUser(supabase, userId, memory || {});
      })
      .catch((error) => {
        console.warn('[Ayna] could not sync learning memory:', error?.message || 'save_failed');
      });
  } catch {
    // Session cache still works; server sync will retry on the next build.
  }
}

export async function fetchLlmRecommendations(options = {}, fetchOpts = {}) {
  const body = buildLlmRecommendationsRequestBody(options);
  if (!body) throw new Error('Missing intake profile');

  const timeoutMs = typeof fetchOpts.timeoutMs === 'number' ? fetchOpts.timeoutMs : DEFAULT_FETCH_TIMEOUT_MS;
  const { authToken, signal: externalSignal } = fetchOpts;
  const analyticsBase = {
    batchIndex: typeof body.batchIndex === 'number' ? body.batchIndex : 0,
    hasBatching: typeof body.batchSize === 'number',
    trackedCount: body.feedback?.trackedProductIds?.length || 0,
    ecosystemCount: body.feedback?.ecosystemProductIds?.length || 0,
    omittedCount: body.feedback?.omittedProductIds?.length || 0,
  };

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
      const code = externalSignal?.aborted ? 'cancelled' : 'timeout';
      captureRecommendationAnalytics('ai_recommendations_failed', { ...analyticsBase, code });
      if (externalSignal?.aborted) {
        const err = new Error('Cancelled');
        err.code = 'cancelled';
        throw err;
      }
      const err = new Error('Recommendations request timed out. Check your connection and try “Refresh recommendations”.');
      err.code = 'timeout';
      throw err;
    }
    captureRecommendationAnalytics('ai_recommendations_failed', { ...analyticsBase, code: 'network_error' });
    throw e;
  } finally {
    clearTimeout(tid);
    if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    captureRecommendationAnalytics('ai_recommendations_failed', { ...analyticsBase, code: 'invalid_response', status: res.status });
    throw new Error('Invalid recommendation response');
  }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    captureRecommendationAnalytics('ai_recommendations_failed', {
      ...analyticsBase,
      code: data?.error || 'request_failed',
      status: res.status,
    });
    const err = new Error(msg);
    err.status = res.status;
    err.code = data?.error;
    throw err;
  }

  captureRecommendationAnalytics('ai_recommendations_completed', {
    ...analyticsBase,
    providerUsed: typeof data?.providerUsed === 'string' && data.providerUsed ? data.providerUsed : 'unknown',
    recommendationCount: Array.isArray(data?.recommendations) ? data.recommendations.length : 0,
    concernsTotal: Number.isFinite(Number(data?.concernsTotal)) ? Number(data.concernsTotal) : undefined,
  });
  return data;
}

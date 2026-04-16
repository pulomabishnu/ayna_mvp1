const API_PATH = '/api/llm-recommendations';
const MEMORY_KEY = 'ayna_llm_learning_memory_v1';
/** Session-scoped cache so revisiting Ecosystem does not re-call the LLM for the same intake. */
const RECS_CACHE_KEY = 'ayna_llm_recommendations_by_intake_v1';

export function fingerprintIntake(intake) {
  if (!intake || typeof intake !== 'object' || Object.keys(intake).length === 0) return '';
  try {
    return JSON.stringify(intake);
  } catch {
    return '';
  }
}

export function loadCachedLlmRecommendations(fingerprint) {
  if (!fingerprint || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(RECS_CACHE_KEY);
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
  if (!fingerprint || typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      RECS_CACHE_KEY,
      JSON.stringify({ fingerprint, recommendations })
    );
  } catch {
    // quota or private mode
  }
}

export function clearCachedLlmRecommendations() {
  try {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(RECS_CACHE_KEY);
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
} = {}) {
  if (!intake || typeof intake !== 'object') return null;
  return {
    intake,
    feedback: {
      trackedProductIds: asIdList(trackedProducts),
      ecosystemProductIds: asIdList(myProducts),
      omittedProductIds: asIdList(omittedProducts),
      learningMemory: learningMemory || {},
    },
  };
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

export async function fetchLlmRecommendations(options = {}) {
  const body = buildLlmRecommendationsRequestBody(options);
  if (!body) throw new Error('Missing intake profile');

  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

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

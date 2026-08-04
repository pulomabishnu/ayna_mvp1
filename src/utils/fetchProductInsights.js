import { buildUserHealthContextString } from './userHealthContextForInsights';
import { deriveBrandSearchContext } from './productBrandContext.js';

const API_PATH = '/api/product-insights';
const CACHE_PREFIX = 'ayna_insights_v2_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function simpleHash(str) {
  // Hashes the WHOLE string. It previously truncated to 300 chars, but the
  // health-context string emits the quiz block (frustrations, preferences,
  // sensitivities) BEFORE conditions, medications and allergies. Any user with
  // a filled-in quiz therefore produced an identical cache key no matter how
  // her conditions or medications changed — so she kept seeing insights
  // personalized to a profile missing, say, a newly added allergy, for the full
  // 30-day TTL, on a health product.
  const s = String(str || '');
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 + c, 2246822519);
  }
  return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36));
}

function cacheKey(productId, contextHash) {
  return `${CACHE_PREFIX}${productId}_${contextHash}`;
}

export function loadCachedInsights(productId, healthContextKey) {
  try {
    const key = cacheKey(productId, simpleHash(healthContextKey));
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(key); return null; }
    return data || null;
  } catch { return null; }
}

export function saveCachedInsights(productId, healthContextKey, data) {
  try {
    const key = cacheKey(productId, simpleHash(healthContextKey));
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
    // Prune expired entries so localStorage doesn't grow unbounded
    for (const k of Object.keys(localStorage)) {
      if (!k.startsWith(CACHE_PREFIX)) continue;
      try {
        const { ts } = JSON.parse(localStorage.getItem(k) || '{}');
        if (!ts || Date.now() - ts > CACHE_TTL_MS) localStorage.removeItem(k);
      } catch { localStorage.removeItem(k); }
    }
  } catch {}
}

export function clearInsightsCacheForProduct(productId) {
  try {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith(`${CACHE_PREFIX}${productId}_`)) localStorage.removeItem(k);
    }
  } catch {}
}

export function buildProductInsightPayload(product) {
  if (!product) return null;
  const brandCtx = deriveBrandSearchContext(product);
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    summary: product.summary,
    type: product.type,
    tags: product.tags,
    healthFunctions: product.healthFunctions,
    brand: product.brand,
    brandName: brandCtx.brandName,
    deviceKindLabel: brandCtx.deviceKindLabel,
    brandComparisonRelevant: brandCtx.emphasizeBrandInSearches,
  };
}

/**
 * POST body for /api/product-insights: product fields + optional userContext from quiz + health profile.
 */
export function buildProductInsightsRequestBody(product, quizResults, healthProfile) {
  const payload = buildProductInsightPayload(product);
  if (!payload?.name) return null;
  const userContext = buildUserHealthContextString(quizResults, healthProfile);
  return userContext ? { product: payload, userContext } : { product: payload };
}

/**
 * Calls the Vercel serverless route (same origin in production).
 * Locally, run `vercel dev` or expect 404 until deployed.
 * @param {object} product
 * @param {{ quizResults?: object|null, healthProfile?: object|null }} [options]
 */
export async function fetchProductInsights(product, options = {}) {
  const { quizResults, healthProfile, authToken, signal, timeoutMs = 45_000 } = options;
  const body = buildProductInsightsRequestBody(product, quizResults, healthProfile);
  if (!body) {
    throw new Error('Invalid product');
  }

  // Had neither a timeout nor an AbortSignal, unlike its sibling
  // fetchLlmRecommendations. A hung provider left the modal's insight panel
  // spinning until the browser's own ~5-minute network timeout, and closing and
  // reopening fired a second request against the same 5/week quota.
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onExternalAbort);
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
      const err = new Error(
        signal?.aborted ? 'Cancelled' : 'That took too long — please try again.'
      );
      err.code = signal?.aborted ? 'cancelled' : 'timeout';
      throw err;
    }
    throw e;
  } finally {
    clearTimeout(tid);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error('Invalid response');
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.code = data?.error;
    err.hint = data?.hint;
    err.envPresent = data?.envPresent;
    err.status = res.status;
    if (res.status === 429) {
      const ra = res.headers.get('Retry-After');
      err.retryAfterSeconds =
        typeof data?.retryAfterSeconds === 'number'
          ? data.retryAfterSeconds
          : ra
            ? parseInt(ra, 10)
            : undefined;
    }
    throw err;
  }
  return data;
}

import { buildUserHealthContextString } from './userHealthContextForInsights';
import { deriveBrandSearchContext } from './productBrandContext.js';

const API_PATH = '/api/product-insights';
const CACHE_PREFIX = 'ayna_insights_v1_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function simpleHash(str) {
  let h = 0;
  const s = String(str || '').slice(0, 300);
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
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
  const { quizResults, healthProfile } = options;
  const body = buildProductInsightsRequestBody(product, quizResults, healthProfile);
  if (!body) {
    throw new Error('Invalid product');
  }
  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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

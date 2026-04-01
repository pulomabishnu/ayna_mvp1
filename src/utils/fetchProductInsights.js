import { buildUserHealthContextString } from './userHealthContextForInsights';
import { deriveBrandSearchContext } from './productBrandContext.js';

const API_PATH = '/api/product-insights';

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
    throw err;
  }
  return data;
}

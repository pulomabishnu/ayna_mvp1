const API_PATH = '/api/product-insights';

export function buildProductInsightPayload(product) {
  if (!product) return null;
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    summary: product.summary,
    type: product.type,
    tags: product.tags,
    healthFunctions: product.healthFunctions,
  };
}

/**
 * Calls the Vercel serverless route (same origin in production).
 * Locally, run `vercel dev` or expect 404 until deployed.
 */
export async function fetchProductInsights(product) {
  const payload = buildProductInsightPayload(product);
  if (!payload?.name) {
    throw new Error('Invalid product');
  }
  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: payload }),
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

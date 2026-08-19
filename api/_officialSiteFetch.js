import { safeFetch } from './_ssrfSafeFetch.js';

/**
 * Fetch and extract readable text from a product's official site, so chat
 * answers about a specific branded product can be grounded ONLY in verified
 * content instead of the model's general/training knowledge — general
 * knowledge about a specific product can be wrong or outdated, and that's a
 * real liability risk for a health app. No paid API involved: this is a
 * plain HTTP fetch, not a search API call.
 *
 * Also used for a product's brand FAQ page (product.faqUrl) — same function,
 * same trust model, just a different field/section in the prompt.
 *
 * SECURITY: `url` here is CLIENT-SUPPLIED — product-chat.js takes the whole
 * product object from the request body, not a server-side catalog lookup —
 * so this is a genuine SSRF surface, guarded by the shared safeFetch() check
 * (resolved-IP validation + no redirects) in ./_ssrfSafeFetch.js.
 */

const MAX_TEXT_LEN = 3000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour, in-memory only — best-effort, resets on cold start.
const CACHE_MAX_ENTRIES = 500;

const cache = new Map();

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function cacheSet(url, text) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(url, { text, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** @returns {Promise<string|null>} extracted page text, or null if unfetchable/unsafe/empty. */
export async function fetchOfficialSiteText(url) {
  if (typeof url !== 'string' || !url.trim()) return null;

  const cached = cache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached.text;

  const res = await safeFetch(url);
  if (!res || !res.ok) return null;
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return null;
  const html = await res.text();
  const text = stripHtml(html).slice(0, MAX_TEXT_LEN);
  if (!text) return null;
  cacheSet(url, text);
  return text;
}

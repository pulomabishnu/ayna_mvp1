import { lookup } from 'node:dns/promises';

/**
 * Fetch and extract readable text from a product's official site, so chat
 * answers about a specific branded product can be grounded ONLY in verified
 * content instead of the model's general/training knowledge — general
 * knowledge about a specific product can be wrong or outdated, and that's a
 * real liability risk for a health app. No paid API involved: this is a
 * plain HTTP fetch, not a search API call.
 *
 * SECURITY: `url` here is CLIENT-SUPPLIED — product-chat.js takes the whole
 * product object from the request body, not a server-side catalog lookup —
 * so this is a genuine SSRF surface. Before ever fetching, the resolved IP
 * is checked against private/loopback/link-local ranges (a hostname-string
 * check alone is bypassable via DNS rebinding), and redirects are refused
 * outright (a redirect to an internal address would otherwise bypass the
 * same check on the second hop).
 */

const FETCH_TIMEOUT_MS = 4000;
const MAX_TEXT_LEN = 3000;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour, in-memory only — best-effort, resets on cold start.
const CACHE_MAX_ENTRIES = 500;

const cache = new Map();

function isPrivateIPv4(ip) {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return true; // fail closed
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true; // loopback
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true; // link-local, and cloud metadata endpoints
  if (a === 0) return true;
  if (a >= 224) return true; // multicast/reserved
  return false;
}

function isPrivateIPv6(ip) {
  const lower = ip.toLowerCase();
  if (lower === '::1' || lower === '::') return true;
  if (lower.startsWith('fe80:')) return true; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
  if (lower.startsWith('::ffff:')) {
    const v4 = lower.split(':').pop();
    return isPrivateIPv4(v4);
  }
  return false;
}

async function isSafePublicUrl(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  const hostname = parsed.hostname;
  if (!hostname || hostname.toLowerCase() === 'localhost') return false;
  try {
    const { address, family } = await lookup(hostname);
    if (family === 4 && isPrivateIPv4(address)) return false;
    if (family === 6 && isPrivateIPv6(address)) return false;
    return true;
  } catch {
    return false; // DNS failure — fail closed, don't fetch
  }
}

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

  const safe = await isSafePublicUrl(url);
  if (!safe) return null;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'error',
      headers: { 'User-Agent': 'Ayna-Health-App/1.0 (+https://ayna.health)' },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    const html = await res.text();
    const text = stripHtml(html).slice(0, MAX_TEXT_LEN);
    if (!text) return null;
    cacheSet(url, text);
    return text;
  } catch {
    return null;
  }
}

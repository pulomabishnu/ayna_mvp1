import { lookup } from 'node:dns/promises';

/**
 * Shared SSRF guard for any server-side fetch of a client- or LLM-supplied
 * URL (product official sites, Shopify storefronts, og:image pages). A
 * hostname-string check alone is bypassable via DNS rebinding, so this
 * resolves the hostname and checks the actual IP before ever fetching, and
 * refuses redirects outright (a redirect to an internal address would
 * otherwise bypass the same check on the second hop).
 */

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

export async function isSafePublicUrl(urlString) {
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

/**
 * Safety-checked fetch: resolves and validates the host before fetching,
 * and refuses to follow redirects. Returns null (never throws) if the URL
 * is unsafe, malformed, or the fetch itself fails/times out.
 * @param {string} urlString
 * @param {{ timeoutMs?: number, headers?: Record<string,string> }} [opts]
 * @returns {Promise<Response|null>}
 */
export async function safeFetch(urlString, opts = {}) {
  if (typeof urlString !== 'string' || !urlString.trim()) return null;
  const safe = await isSafePublicUrl(urlString);
  if (!safe) return null;
  try {
    return await fetch(urlString, {
      signal: AbortSignal.timeout(opts.timeoutMs || 4000),
      redirect: 'error',
      headers: { 'User-Agent': 'Ayna-Health-App/1.0 (+https://ayna.health)', ...opts.headers },
    });
  } catch {
    return null;
  }
}

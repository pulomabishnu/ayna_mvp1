import { isSafePublicUrl } from './_ssrfSafeFetch.js';

/**
 * Pulls a real image straight off a brand's own official page, instead of a
 * third-party image-search API. No paid API, no quota to run out of — reuses
 * the shared SSRF-safe fetch pattern from _ssrfSafeFetch.js (private-IP/DNS-
 * rebinding checks). Tries, in order: og:image, twitter:image, then the
 * page's own favicon/apple-touch-icon as a final fallback for sites whose
 * meta tags are only injected client-side (not present in the HTML this
 * fetcher reads) — a real site icon is still better than the generic
 * placeholder when nothing else can be found.
 */

const FETCH_TIMEOUT_MS = 4000;

// Read only up to MAX_HTML_BYTES — og:image/favicon links are always in
// <head>, no need to buffer an entire large page into memory.
const MAX_HTML_BYTES = 500_000;

// Filenames that indicate a logo/icon/banner rather than an actual product
// photo — brand pages frequently set these as og:image on non-product pages,
// and mislabeling a logo as "the product" is worse than showing no photo.
// Only applied to the og:image/twitter:image extraction — not to the
// favicon fallback below, which is knowingly using a site icon as a
// last resort.
const NON_PRODUCT_IMAGE_PATTERN = /logo|icon|favicon|banner|sprite|placeholder|social[-_]?share|og[-_]?default/i;

function decodeHtmlEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractMetaContent(html, property) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const m = html.match(re) || html.match(
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i')
  );
  return m ? decodeHtmlEntities(m[1]) : null;
}

// Matches any <link rel="..."> whose rel value contains "icon" (covers
// "icon", "shortcut icon", "apple-touch-icon", "icon preload", etc., in
// either attribute order) — the final fallback when a page has no
// og:image/twitter:image at all (common on JS-hydrated SPAs whose meta tags
// aren't present in the server-rendered HTML this fetcher reads).
const LINK_TAG_RE = /<link\b[^>]*>/gi;

/** Prefers apple-touch-icon (typically larger/higher-res) over a plain favicon. */
function extractIcon(html) {
  const tags = html.match(LINK_TAG_RE) || [];
  let plainIcon = null;
  for (const tag of tags) {
    const relMatch = tag.match(/rel=["']([^"']*)["']/i);
    if (!relMatch || !/icon/i.test(relMatch[1])) continue;
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) continue;
    if (/apple-touch-icon/i.test(relMatch[1])) return hrefMatch[1];
    if (!plainIcon) plainIcon = hrefMatch[1];
  }
  return plainIcon;
}

const MAX_REDIRECT_HOPS = 5;

// A generic bot-labeled UA gets flagged by some WAFs even for a plain page
// fetch — a realistic browser UA/Accept set gets through more often without
// materially changing what's being verified (the response is still only ever
// read for its og:image meta tag, never executed).
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** Reads a Response body as text, capped at MAX_HTML_BYTES so a huge page can't be buffered whole. */
async function readCappedText(res) {
  const reader = res.body?.getReader?.();
  if (!reader) return (await res.text()).slice(0, MAX_HTML_BYTES);
  let received = 0;
  let html = '';
  const decoder = new TextDecoder();
  while (received < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.length;
    html += decoder.decode(value, { stream: true });
  }
  reader.cancel?.().catch(() => {});
  return html;
}

/** Multiple safe, re-validated redirect hops — enterprise brand sites commonly
 * chain 2-3 redirects (apex -> www -> locale path, sometimes via a different
 * intermediate domain entirely), so following only one hop failed on exactly
 * the sites most worth reaching. Each hop's target is re-checked against the
 * same private-IP rules before being fetched, so a redirect can't be used to
 * reach an internal host, and a capped hop count prevents infinite loops. */
async function fetchWithSafeRedirects(url) {
  let currentUrl = url;
  for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop += 1) {
    const res = await fetch(currentUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'manual',
      headers: BROWSER_HEADERS,
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) return null;
      const target = new URL(location, currentUrl).toString();
      if (!(await isSafePublicUrl(target))) return null;
      currentUrl = target;
      continue;
    }
    return { res, finalUrl: currentUrl };
  }
  return null; // too many hops
}

/** @returns {Promise<string|null>} absolute image URL, or null if unfetchable/unsafe/none found. */
export async function fetchOgImage(pageUrl) {
  if (typeof pageUrl !== 'string' || !pageUrl.trim()) return null;
  if (!(await isSafePublicUrl(pageUrl))) return null;

  try {
    const result = await fetchWithSafeRedirects(pageUrl);
    // A blocked/non-HTML main page still leaves /favicon.ico worth trying —
    // it's a different path and sometimes isn't behind the same bot-challenge
    // rule that blocked the page itself.
    if (!result || !result.res.ok) return await tryDefaultFavicon(pageUrl);
    const contentType = result.res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return await tryDefaultFavicon(pageUrl);
    const html = await readCappedText(result.res);
    const raw = extractMetaContent(html, 'og:image') || extractMetaContent(html, 'twitter:image');
    if (raw && raw.startsWith('http') && !NON_PRODUCT_IMAGE_PATTERN.test(raw)) {
      const absolute = new URL(raw, result.finalUrl).toString();
      if (absolute.startsWith('https://') || absolute.startsWith('http://')) return absolute;
    }
    const icon = extractIcon(html);
    if (icon) {
      const decoded = decodeHtmlEntities(icon.trim());
      if (decoded) {
        const absolute = new URL(decoded, result.finalUrl).toString();
        if (absolute.startsWith('https://') || absolute.startsWith('http://')) return absolute;
      }
    }
    // Last resort: the browser-default /favicon.ico convention — some sites
    // rely on it working without ever declaring a <link rel="icon"> tag at all.
    return await tryDefaultFavicon(result.finalUrl);
  } catch {
    return await tryDefaultFavicon(pageUrl);
  }
}

async function tryDefaultFavicon(pageUrl) {
  try {
    const origin = new URL(pageUrl).origin;
    const faviconUrl = `${origin}/favicon.ico`;
    const res = await fetch(faviconUrl, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'error',
      headers: BROWSER_HEADERS,
    });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;
    return faviconUrl;
  } catch {
    return null;
  }
}

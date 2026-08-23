import { isSafePublicUrl } from './_ssrfSafeFetch.js';

/**
 * Pulls a real image straight off a brand's own official page, instead of a
 * third-party image-search API. No paid API, no quota to run out of — reuses
 * the shared SSRF-safe fetch pattern from _ssrfSafeFetch.js (private-IP/DNS-
 * rebinding checks). Tries, in order: og:image, then twitter:image. Does NOT
 * fall back to the page's favicon/apple-touch-icon — a live QA pass this
 * session found a site's favicon.ico being rendered full-size on a product
 * card as if it were the product photo (intimina.com). A tiny site icon
 * blown up to card size reads as a broken/wrong image, not "better than
 * nothing" — the initial-letter avatar fallback the UI already has for a
 * missing image is more honest than a mislabeled icon.
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
    if (!result || !result.res.ok) return null;
    const contentType = result.res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    const html = await readCappedText(result.res);
    const raw = extractMetaContent(html, 'og:image') || extractMetaContent(html, 'twitter:image');
    if (raw && raw.startsWith('http') && !NON_PRODUCT_IMAGE_PATTERN.test(raw)) {
      const absolute = new URL(raw, result.finalUrl).toString();
      if (absolute.startsWith('https://') || absolute.startsWith('http://')) return absolute;
    }
    return null;
  } catch {
    return null;
  }
}

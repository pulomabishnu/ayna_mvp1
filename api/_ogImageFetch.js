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
// "header" added after a live production case: Saalt's og:image resolved to
// a small decorative "Fancy-Monogram-header_03.png" asset.
//
// Uses letter-adjacency lookaround, NOT \b — see the matching comment on
// src/utils/resolveProductImage.js's copy of this pattern (that file is the
// one that actually gates hardcoded catalog data, which is where this was
// audited against real cases). Shopify's filename convention is
// underscore-separated ("Logo_33a7614e...") and \b treats `_` as a word
// character, so \blogo\b would silently miss the exact real case this
// exists for; digits/underscores/punctuation still count as a boundary,
// only an adjacent letter blocks the match.
//
// Deliberately does NOT include "hero" — tried and reverted after it
// flagged two genuine studio product photos in the catalog sweep (Elvie
// Pelvic Floor Trainer, Stayfree) that just happen to use "hero
// shot"/"hero image," standard product-photography terminology, in their
// own filenames.
const NON_PRODUCT_IMAGE_PATTERN = /(?<![a-z])(?:logo|icon|badge|favicon|banner|header|sprite|placeholder|social[-_]?share|og[-_]?default)(?![a-z])/i;

// Some CDNs bake an explicit tiny size into the URL's own query string (e.g.
// Shopify's `?width=32&height=32` image-resizing params) — a strong signal
// the asset is an icon/thumbnail regardless of filename. Same production
// case as above: the Saalt monogram header carried `height=32&width=32`.
const TINY_DIMENSION_PATTERN = /[?&](?:width|height|w|h)=(\d{1,2})\b/i;
function looksLikeTinyAsset(url) {
  const matches = [...String(url || '').matchAll(new RegExp(TINY_DIMENSION_PATTERN, 'gi'))];
  return matches.some((m) => Number(m[1]) <= 64);
}

// Product photography is essentially never vector art — SVGs found on a
// brand's page are wordmarks/icons/illustrations. Caught in production:
// Pure Encapsulations' Shopify catalog resolved every product's image to
// /cdn/shop/files/pure-encapsulations.svg (the store theme's own logo file,
// not a per-SKU photo), which the filename-keyword check alone missed
// because "pure-encapsulations" doesn't contain any of the flagged words.
export function isVectorAssetUrl(url) {
  try {
    return /\.svg(\?|$)/i.test(new URL(url).pathname);
  } catch {
    return /\.svg(\?|$)/i.test(String(url || ''));
  }
}

/**
 * A real product photo is always served from the brand's own domain or a
 * CDN actually fronting it — never a totally unrelated third party. Caught
 * in production: helloclue.com's own og:image meta tag resolved to an image
 * hosted entirely on zurb.com (a design agency with no connection to Clue —
 * almost certainly a stale template default nobody updated on their site).
 */
const KNOWN_IMAGE_CDN_SUFFIXES = [
  'shopify.com', 'shopifycdn.com', 'myshopify.com',
  'cloudfront.net', 'akamaized.net', 'fastly.net', 'imgix.net',
  'cloudinary.com', 'wp.com', 'squarespace.com', 'squarespace-cdn.com',
  'amazonaws.com', 'googleusercontent.com', 'bigcommerce.com',
  // 'contentful.com' is Contentful's own marketing domain — the CDN that
  // actually serves a Contentful-hosted site's images is 'ctfassets.net'.
  // Caught live: helloclue.com's real og:image is served from
  // images.ctfassets.net, which the wrong domain name rejected as
  // "unrelated third party" even though it's Clue's own legitimate asset.
  'contentful.com', 'ctfassets.net', 'sanity.io', 'prismic.io',
];

function baseDomain(hostname) {
  const parts = String(hostname || '').toLowerCase().split('.').filter(Boolean);
  if (parts.length <= 2) return parts.join('.');
  const secondLast = parts[parts.length - 2];
  const shortSecondLevelLabels = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu']);
  if (parts[parts.length - 1].length === 2 && shortSecondLevelLabels.has(secondLast)) {
    return parts.slice(-3).join('.'); // e.g. "brand.co.uk"
  }
  return parts.slice(-2).join('.');
}

export function isRelatedImageHost(imageUrl, pageUrl) {
  try {
    const imageHost = new URL(imageUrl).hostname.toLowerCase();
    const pageHost = new URL(pageUrl).hostname.toLowerCase();
    if (baseDomain(imageHost) === baseDomain(pageHost)) return true;
    return KNOWN_IMAGE_CDN_SUFFIXES.some((suffix) => imageHost === suffix || imageHost.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

// Even for a logo-allowed product (an app, a telehealth service — see
// allowBrandLogo below), a bare site favicon/apple-touch-icon is still
// wrong: it's a 16-32px browser-tab icon, not a real app icon/wordmark, and
// looks broken blown up to card size regardless of category.
const ALWAYS_REJECT_PATTERN = /favicon|apple-touch-icon/i;

/**
 * Central "does this look like an actual product photo" gate, applied
 * regardless of which resolver produced the URL. matchShopifyProduct trusts
 * whatever image field the matched catalog entry has with no filename check
 * of its own, so this is the only thing standing between a Shopify store's
 * own logo/banner asset and a product card.
 *
 * @param {boolean} [allowBrandLogo] - true for products with no physical
 *   form (apps, telehealth/virtual-care services) — a brand logo/icon IS
 *   the real "photo" there, unlike a supplement or device where a logo
 *   standing in for the product is a real bug (Pure Encapsulations'
 *   Shopify catalog resolving to its theme logo instead of a bottle photo).
 */
export function isLikelyNonProductImageUrl(url, allowBrandLogo = false) {
  const s = String(url || '').trim();
  if (!s) return false;
  if (looksLikeTinyAsset(s)) return true;
  if (ALWAYS_REJECT_PATTERN.test(s)) return true;
  if (allowBrandLogo) return false;
  if (NON_PRODUCT_IMAGE_PATTERN.test(s)) return true;
  if (isVectorAssetUrl(s)) return true;
  return false;
}

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

/**
 * @param {string} pageUrl
 * @param {boolean} [allowBrandLogo] - see isLikelyNonProductImageUrl
 * @returns {Promise<string|null>} absolute image URL, or null if unfetchable/unsafe/none found.
 */
export async function fetchOgImage(pageUrl, allowBrandLogo = false) {
  if (typeof pageUrl !== 'string' || !pageUrl.trim()) return null;
  if (!(await isSafePublicUrl(pageUrl))) return null;

  try {
    const result = await fetchWithSafeRedirects(pageUrl);
    if (!result || !result.res.ok) return null;
    const contentType = result.res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    const html = await readCappedText(result.res);
    const raw = extractMetaContent(html, 'og:image') || extractMetaContent(html, 'twitter:image');
    if (raw && raw.startsWith('http') && !isLikelyNonProductImageUrl(raw, allowBrandLogo)) {
      const absolute = new URL(raw, result.finalUrl).toString();
      if (
        (absolute.startsWith('https://') || absolute.startsWith('http://')) &&
        isRelatedImageHost(absolute, result.finalUrl)
      ) {
        return absolute;
      }
    }
    return null;
  } catch {
    return null;
  }
}

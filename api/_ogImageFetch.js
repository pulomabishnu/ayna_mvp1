import { isSafePublicUrl } from './_officialSiteFetch.js';

/**
 * Pulls a real product photo straight off a brand's own official page (the
 * og:image / twitter:image meta tag), instead of a third-party image-search
 * API. No paid API, no quota to run out of — reuses the SSRF-safe fetch
 * pattern from _officialSiteFetch.js (private-IP/DNS-rebinding checks).
 */

const FETCH_TIMEOUT_MS = 4000;

const OG_IMAGE_RE = /<meta[^>]+(?:property|name)=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const OG_IMAGE_RE_REV = /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image(?::secure_url)?["'][^>]*>/i;
const TWITTER_IMAGE_RE = /<meta[^>]+(?:property|name)=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["'][^>]*>/i;
const TWITTER_IMAGE_RE_REV = /<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']twitter:image(?::src)?["'][^>]*>/i;

function extractMetaImage(html) {
  const m = html.match(OG_IMAGE_RE) || html.match(OG_IMAGE_RE_REV)
    || html.match(TWITTER_IMAGE_RE) || html.match(TWITTER_IMAGE_RE_REV);
  return m ? m[1] : null;
}

function decodeHtmlEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** One safe, re-validated redirect hop — brand root domains almost always
 * redirect www<->apex or http->https, so refusing all redirects (like the
 * text-fetch sibling does) would fail on the common case. Only one hop is
 * followed, and the target is re-checked against the same private-IP rules
 * before being fetched, so a redirect can't be used to reach an internal host. */
async function fetchWithOneSafeRedirect(url) {
  let res = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: 'manual',
    headers: { 'User-Agent': 'Ayna-Health-App/1.0 (+https://ayna.health)' },
  });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (!location) return null;
    const target = new URL(location, url).toString();
    if (!(await isSafePublicUrl(target))) return null;
    res = await fetch(target, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'error',
      headers: { 'User-Agent': 'Ayna-Health-App/1.0 (+https://ayna.health)' },
    });
    return { res, finalUrl: target };
  }
  return { res, finalUrl: url };
}

/** @returns {Promise<string|null>} absolute image URL, or null if unfetchable/unsafe/none found. */
export async function fetchOgImage(pageUrl) {
  if (typeof pageUrl !== 'string' || !pageUrl.trim()) return null;
  if (!(await isSafePublicUrl(pageUrl))) return null;

  try {
    const result = await fetchWithOneSafeRedirect(pageUrl);
    if (!result || !result.res.ok) return null;
    const contentType = result.res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;
    const html = await result.res.text();
    const raw = extractMetaImage(html);
    if (!raw) return null;
    const decoded = decodeHtmlEntities(raw.trim());
    if (!decoded) return null;
    const absolute = new URL(decoded, result.finalUrl).toString();
    if (!absolute.startsWith('https://') && !absolute.startsWith('http://')) return null;
    return absolute;
  } catch {
    return null;
  }
}

import { safeFetch } from './_ssrfSafeFetch.js';

/**
 * Fallback product-photo source for stores that aren't Shopify: fetch the
 * page and read its og:image/twitter:image meta tag — the same photo the
 * page would show as a link preview on social media, so it's already
 * intended to represent that specific page. No scraping of protected
 * content, no paid API.
 */

const MAX_HTML_BYTES = 500_000;

// Filenames that indicate a logo/icon/banner rather than an actual product
// photo — brand pages frequently set these as og:image on non-product pages,
// and mislabeling a logo as "the product" is worse than showing no photo.
const NON_PRODUCT_IMAGE_PATTERN = /logo|icon|favicon|banner|sprite|placeholder|social[-_]?share|og[-_]?default/i;

// Attribute values in HTML source are HTML-entity-encoded (e.g. a query
// string's `&` becomes `&amp;`). Decoding is required, not cosmetic — an
// undecoded `&amp;` in a URL is a literal 4-character string that breaks
// query-parameter parsing on the destination server.
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

/**
 * @param {string} pageUrl
 * @returns {Promise<string|null>}
 */
export async function fetchOgImage(pageUrl) {
  const res = await safeFetch(pageUrl, { timeoutMs: 4000 });
  if (!res || !res.ok) return null;
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return null;

  // Read only up to MAX_HTML_BYTES — og:image is always in <head>, no need
  // to buffer an entire large page.
  const reader = res.body?.getReader?.();
  let html = '';
  if (reader) {
    let received = 0;
    const decoder = new TextDecoder();
    while (received < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel?.().catch(() => {});
  } else {
    html = (await res.text()).slice(0, MAX_HTML_BYTES);
  }

  const image = extractMetaContent(html, 'og:image') || extractMetaContent(html, 'twitter:image');
  if (!image || !image.startsWith('http')) return null;
  if (NON_PRODUCT_IMAGE_PATTERN.test(image)) return null;

  return image;
}

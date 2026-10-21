/* global Buffer */
import { isSafePublicUrl, safeFetch } from './_ssrfSafeFetch.js';
import { getClientIp, rateLimit } from './_rateLimit.js';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_TARGET_LENGTH = 4096;
const CACHE_HEADER = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000';

// Bytes from another site are served from OUR origin, so they must never be
// able to run as a page here: an SVG opened directly at
// /api/image-proxy?url=https://evil/x.svg would otherwise be an ayna-origin
// document. `sandbox` turns any script in it off even if a browser renders it.
export const PROXIED_IMAGE_CSP = "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox";

/**
 * True when the browser is navigating to this URL (typed, clicked, phished)
 * rather than loading it as an <img>. Browsers send Sec-Fetch-Dest: image for
 * images; a navigation sends document + navigate.
 */
export function isNavigation(req) {
  const dest = String(req.headers?.['sec-fetch-dest'] || '').toLowerCase();
  const mode = String(req.headers?.['sec-fetch-mode'] || '').toLowerCase();
  return dest === 'document' || dest === 'iframe' || mode === 'navigate';
}

function redirectToOriginal(res, target, req) {
  // Never 302 a navigation: that made /api/image-proxy?url=<any site> an open
  // redirect on aynahealth.co, usable in phishing links.
  if (req && isNavigation(req)) return res.status(400).json({ error: 'image_only' });
  // Privacy-first when the proxy works, availability-first when a brand/CDN
  // blocks server-side fetching. A direct fallback keeps the product photo
  // visible instead of replacing it with a broken-image placeholder.
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Location', target);
  return res.status(302).end();
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).end();
  }

  const target = typeof req.query?.url === 'string' ? req.query.url.trim() : '';
  if (!target || target.length > MAX_TARGET_LENGTH || !(await isSafePublicUrl(target))) {
    return res.status(400).json({ error: 'invalid_image_url' });
  }

  // Generous (a Shop page loads many images), but stops one client from using
  // the proxy as free bandwidth.
  const rl = await rateLimit(`image-proxy:${getClientIp(req)}`, { max: 600, windowSec: 300, failClosed: false });
  if (!rl.ok) return redirectToOriginal(res, target, req);

  const upstream = await safeFetch(target, {
    timeoutMs: 7000,
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });

  // Some Shopify/Amazon/CDN URLs redirect or reject server-side agents. In
  // those cases, preserve the image by sending the browser to the original.
  if (!upstream || !upstream.ok) return redirectToOriginal(res, target, req);

  const contentType = upstream.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) return redirectToOriginal(res, target, req);

  const declaredLength = Number(upstream.headers.get('content-length') || 0);
  if (declaredLength > MAX_IMAGE_BYTES) return redirectToOriginal(res, target, req);

  try {
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return redirectToOriginal(res, target, req);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', CACHE_HEADER);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', PROXIED_IMAGE_CSP);
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Vary', 'Accept');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(bytes);
  } catch (e) {
    console.warn('[image-proxy] upstream image read failed:', e?.message);
    return redirectToOriginal(res, target, req);
  }
}

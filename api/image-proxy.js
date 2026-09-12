import { isSafePublicUrl, safeFetch } from './_ssrfSafeFetch.js';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const CACHE_HEADER = 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000';

function redirectToOriginal(res, target) {
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
  if (!target || !(await isSafePublicUrl(target))) {
    return res.status(400).json({ error: 'invalid_image_url' });
  }

  const upstream = await safeFetch(target, {
    timeoutMs: 7000,
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
  });

  // Some Shopify/Amazon/CDN URLs redirect or reject server-side agents. In
  // those cases, preserve the image by sending the browser to the original.
  if (!upstream || !upstream.ok) return redirectToOriginal(res, target);

  const contentType = upstream.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) return redirectToOriginal(res, target);

  const declaredLength = Number(upstream.headers.get('content-length') || 0);
  if (declaredLength > MAX_IMAGE_BYTES) return redirectToOriginal(res, target);

  try {
    const bytes = Buffer.from(await upstream.arrayBuffer());
    if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) return redirectToOriginal(res, target);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', CACHE_HEADER);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(bytes);
  } catch (e) {
    console.warn('[image-proxy] upstream image read failed:', e?.message);
    return redirectToOriginal(res, target);
  }
}

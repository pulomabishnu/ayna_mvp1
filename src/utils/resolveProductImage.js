// Resolves a real product image for products with placeholder images via /api/product-image
// Results are cached in localStorage so the lookup only ever runs once per product.

// Bumped v1 -> v2 alongside the server-side cache key: a browser that
// already resolved a wrong image (DSLD mismatch, header/favicon leak, both
// fixed the same day) would otherwise keep serving it from localStorage
// indefinitely, independent of the server-side fix.
const LS_KEY = 'ayna_product_images_v2';
const memCache = new Map();

function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function lsWrite(key, url) {
  try {
    const obj = lsRead();
    obj[key] = url;
    localStorage.setItem(LS_KEY, JSON.stringify(obj));
  } catch {}
}

export function isPlaceholderProductImage(imageUrl) {
  const src = String(imageUrl || '').trim();
  if (!src) return true; // empty string — LLM products always start with ""
  if (src === '/ayna_placeholder.png' || src === '/startup_placeholder.png') return true;
  // logo.clearbit.com is an unreliable free logo API used by some catalog entries
  // (Pomelo Care, Nurx, Happi, Hers, Midi, etc.) — treat it as a placeholder too so
  // those products get queued for a real photo via /api/product-image instead of
  // being left on a logo that may 404 and fall back to a generic brand block.
  if (/^https?:\/\/logo\.clearbit\.com\//i.test(src)) return true;
  // A handful of catalog entries had a site favicon hardcoded as `image`
  // directly (e.g. intimina.com/.../favicon.ico on the Intimina Kegel
  // Exerciser) — the exact "tiny icon rendered as product photo" bug found
  // in QA, just baked into the data instead of coming from the dynamic
  // resolver's now-removed favicon fallback (see api/_ogImageFetch.js).
  if (/favicon\.ico(\?|$)/i.test(src)) return true;
  return false;
}

/**
 * A raw `product.image` field is only ever safe to render directly if it
 * ISN'T a placeholder — a bare `product.image ? <img src={product.image}> :
 * fallback` truthiness check (found repeated across ~10 components) treats
 * `/ayna_placeholder.png` (a real, non-empty file path) as "has a real
 * photo," rendering that literal branded marketing image — visible "AYNA —
 * Truth in Women's Health" text — on a product card as if it were the
 * actual product. Use this everywhere a component decides whether to render
 * `product.image` vs. an initial-letter/blank fallback, instead of a bare
 * truthiness check on the raw field.
 */
export function safeProductImageSrc(imageUrl) {
  return isPlaceholderProductImage(imageUrl) ? '' : String(imageUrl || '');
}

export async function resolveProductImage(name, brand, url) {
  if (!name) return '';
  const key = `${brand || ''}|${name}`;

  // memCache holds either a resolved string or an in-flight Promise. Storing
  // the promise BEFORE awaiting is what dedupes concurrent callers: two effects
  // resolving the same product in the same tick (MyEcosystem walks the tiers in
  // two separate effects) both missed the cache and both spent a paid credit.
  if (memCache.has(key)) return memCache.get(key);

  const stored = lsRead();
  if (key in stored) {
    memCache.set(key, stored[key]);
    return stored[key];
  }

  const inFlight = (async () => {
    try {
      const params = new URLSearchParams({ name, brand: brand || '' });
      if (url) params.set('url', url);
      const res = await fetch(`/api/product-image?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        // Do NOT persist a transient failure. A 429/5xx was previously written
        // to localStorage as '' and pinned for good, so a product that briefly
        // failed never got an image again on that browser.
        memCache.delete(key);
        return '';
      }
      const data = await res.json();
      const resolvedUrl = data?.imageUrl || '';
      memCache.set(key, resolvedUrl);
      // The server only attempts resolution (and only caches a negative
      // result itself) when a page `url` was supplied — mirror that here.
      // Pinning '' from a call that had no url would permanently block a
      // later call for the same product that does have one.
      if (resolvedUrl || url) lsWrite(key, resolvedUrl);
      return resolvedUrl;
    } catch {
      memCache.delete(key);
      return '';
    }
  })();

  memCache.set(key, inFlight);
  return inFlight;
}

// Resolves a real product image for products with placeholder images via /api/product-image
// Results are cached in localStorage so the lookup only ever runs once per product.

const LS_KEY = 'ayna_product_images_v1';
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
  return src === '/ayna_placeholder.png' || src === '/startup_placeholder.png';
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

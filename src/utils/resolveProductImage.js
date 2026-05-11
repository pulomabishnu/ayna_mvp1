// Resolves a real product image for products with placeholder images via /api/product-image
// Results are cached in localStorage so Serper is only called once per product, ever.

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
  if (!src) return true;
  return src === '/ayna_placeholder.png' || src === '/startup_placeholder.png';
}

export async function resolveProductImage(name, brand) {
  if (!name) return '';
  const key = `${brand || ''}|${name}`;

  if (memCache.has(key)) return memCache.get(key);

  const stored = lsRead();
  if (key in stored) {
    memCache.set(key, stored[key]);
    return stored[key];
  }

  try {
    const params = new URLSearchParams({ name, brand: brand || '' });
    const res = await fetch(`/api/product-image?${params}`);
    if (!res.ok) { memCache.set(key, ''); lsWrite(key, ''); return ''; }
    const data = await res.json();
    const url = data?.imageUrl || '';
    memCache.set(key, url);
    lsWrite(key, url);
    return url;
  } catch {
    memCache.set(key, '');
    return '';
  }
}

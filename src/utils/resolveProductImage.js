// Resolves a real product image for AI-generated products via /api/product-image
// Results are cached in memory for the session — never breaks the UI

const cache = new Map();

export async function resolveProductImage(name, brand) {
  if (!name) return '';
  const key = `${brand || ''}|${name}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const params = new URLSearchParams({ name, brand: brand || '' });
    const res = await fetch(`/api/product-image?${params}`);
    if (!res.ok) { cache.set(key, ''); return ''; }
    const data = await res.json();
    const url = data?.imageUrl || '';
    cache.set(key, url);
    return url;
  } catch {
    cache.set(key, '');
    return '';
  }
}

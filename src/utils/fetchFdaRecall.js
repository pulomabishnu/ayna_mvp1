// Checks OpenFDA for real recall data for a product
const cache = new Map();

export async function fetchFdaRecall(name, brand = '') {
  if (!name) return { hasRecalls: false, recalls: [] };
  const key = `${brand}|${name}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const params = new URLSearchParams({ name, brand });
    const res = await fetch(`/api/fda-recall?${params}`);
    if (!res.ok) { cache.set(key, { hasRecalls: false, recalls: [] }); return { hasRecalls: false, recalls: [] }; }
    const data = await res.json();
    const result = { hasRecalls: data?.hasRecalls || false, recalls: data?.recalls || [] };
    cache.set(key, result);
    return result;
  } catch {
    cache.set(key, { hasRecalls: false, recalls: [] });
    return { hasRecalls: false, recalls: [] };
  }
}

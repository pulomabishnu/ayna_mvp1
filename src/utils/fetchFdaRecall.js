// Checks OpenFDA for real recall data for a product
const cache = new Map();

/**
 * @param {string} name
 * @param {string} [brand]
 * @param {string} [category] product category (e.g. telehealth — server skips device/drug recall search)
 */
export async function fetchFdaRecall(name, brand = '', category = '') {
  if (!name) return { hasRecalls: false, recalls: [] };
  const key = `${brand}|${name}|${category}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const params = new URLSearchParams({ name, brand: brand || '', category: category || '' });
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

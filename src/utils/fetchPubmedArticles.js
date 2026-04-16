// Fetches real PubMed articles for a product or ingredient
const cache = new Map();

export async function fetchPubmedArticles(query, limit = 5) {
  if (!query || query.trim().length < 3) return [];
  const key = `${query}|${limit}`;
  if (cache.has(key)) return cache.get(key);
  try {
    const params = new URLSearchParams({ query: query.trim(), limit: String(limit) });
    const res = await fetch(`/api/pubmed-search?${params}`);
    if (!res.ok) { cache.set(key, []); return []; }
    const data = await res.json();
    const articles = Array.isArray(data?.articles) ? data.articles : [];
    cache.set(key, articles);
    return articles;
  } catch {
    cache.set(key, []);
    return [];
  }
}

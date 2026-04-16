// Fetches verified supplement products from NIH DSLD via /api/dsld-search

export async function fetchDsldProducts(query, limit = 10) {
  if (!query || query.trim().length < 2) return [];
  try {
    const params = new URLSearchParams({ query: query.trim(), limit: String(limit) });
    const res = await fetch(`/api/dsld-search?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.products) ? data.products : [];
  } catch {
    return [];
  }
}

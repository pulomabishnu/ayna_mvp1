/**
 * Brand-diverse top lists (matching research pass, Nov 11).
 *
 * Research: Ziegler et al., "Improving Recommendation Lists Through Topic Diversification"
 * (WWW 2005, online study with 2,125 participants): re-ranking a top-N list toward variety
 * lowered precision and recall but raised how satisfied people said they were with the list,
 * up to a moderate amount of diversification (satisfaction peaked around a 0.4 diversification
 * factor for item-based filtering and fell at 0.9). https://archives.iw3c2.org/www2005/proceedings/docs/p22.pdf
 *
 * So a moderate rule: keep the order the matcher gave, but within the first `n` show one
 * product per brand before a brand's second product. Nothing is removed and #1 never moves.
 */
export function diversifyByBrand(products = [], n = 5) {
  const list = (products || []).filter(Boolean);
  if (list.length <= 1) return list;
  const key = (p) => String(p.brand || p.name || p.id || '').trim().toLowerCase();
  const seen = new Set();
  const first = [];
  const later = [];
  for (const p of list) {
    if (first.length < n && !seen.has(key(p))) { seen.add(key(p)); first.push(p); } else later.push(p);
  }
  return [...first, ...later];
}

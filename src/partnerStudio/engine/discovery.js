/* How shoppers found products on the ayna website: search, browsing or elsewhere.
   Pure. Inputs are catalog rows with an optional `src` ({ search, browse, other }). */

const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
const sum = (rows, k) => rows.reduce((a, p) => a + (p.src?.[k] || 0), 0);

/** One brand's discovery mix next to everyone else on ayna and in its own categories. */
export function discoveryFor(catalog, brand) {
  const all = catalog || [];
  const mine = all.filter((p) => p.brand === brand);
  const myCats = new Set(mine.map((p) => p.category));
  const peers = all.filter((p) => p.brand !== brand && myCats.has(p.category));
  const others = all.filter((p) => p.brand !== brand);
  const totals = (rows) => {
    const t = { search: sum(rows, 'search'), browse: sum(rows, 'browse'), other: sum(rows, 'other') };
    t.total = t.search + t.browse + t.other;
    t.searchShare = pct(t.search, t.total);
    return t;
  };
  const products = mine
    .map((p) => ({ id: p.id, name: p.name, category: p.category, search: p.src?.search || 0, browse: p.src?.browse || 0, other: p.src?.other || 0 }))
    .map((p) => ({ ...p, total: p.search + p.browse + p.other }))
    .map((p) => ({ ...p, searchShare: pct(p.search, p.total) }))
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
  return { me: totals(mine), peers: totals(peers), everyone: totals(others), products };
}

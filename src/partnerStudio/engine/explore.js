/**
 * Filterable recommendation share (Phase 1 plan, p.8: "Filters: category,
 * synthetic need family, product format and fixed budget bands. Provide
 * product-level drill-down").
 *
 * The snapshot stores, per category, every catalog product in the benchmark
 * universe (public facts only: id, name, brand, price) and a compact row per
 * baseline scenario (need, budget, format, placed product indexes). Each brand
 * rollup adds its own outcome per scenario. This module turns those into the
 * same metrics the server computes, for any filter, so the screen and the
 * server agree by construction. Pure, no I/O.
 */

/** Outcome codes stored per scenario in a brand rollup (precedence per p.10). */
export const OUTCOME = { selected: 's', eligible_lost: 'e', insufficient_info: 'i', excluded: 'x', out_of_scope: 'o' };

const rate = (num, den) => ({ num, den, pct: den > 0 ? Math.round((num / den) * 1000) / 10 : null });

/** Compact scenario table for the snapshot. `results` are baseline runScenario results. */
export function compactScenarios(results, universe, brandOf, isPartner = () => false) {
  const index = new Map(universe.map((p, i) => [p.id, i]));
  // partner: an ayna brand partner, for highlighting only. Never a ranking input.
  const products = universe.map((p) => ({ id: p.id, name: p.name, brand: brandOf(p), partner: Boolean(isPartner(p)) }));
  const rows = results.map((r) => ({
    need: r.need,
    budget: r.budget,
    format: r.format ? 1 : 0,
    p: r.placements.map((x) => index.get(x.sku)).filter((i) => i != null),
  }));
  return { products, rows };
}

/**
 * @param {object} cat snapshot category with .products and .rows
 * @param {string} brand brand name as it appears on products
 * @param {string} outcomes one OUTCOME code per row, same order (brand rollup)
 * @param {{ need?: string, budget?: string, format?: '' | 'any' | 'pref' }} filter
 */
export function explore(cat, brand, outcomes = '', filter = {}) {
  const idx = [];
  cat.rows.forEach((r, i) => {
    if (filter.need && r.need !== filter.need) return;
    if (filter.budget && r.budget !== filter.budget) return;
    if (filter.format === 'any' && r.format) return;
    if (filter.format === 'pref' && !r.format) return;
    idx.push(i);
  });
  const brandSlots = new Map();
  const productSlots = new Map();
  let slots = 0;
  let included = 0;
  let noResult = 0;
  for (const i of idx) {
    const r = cat.rows[i];
    if (!r.p.length) noResult += 1;
    let mine = false;
    for (const pi of r.p) {
      const p = cat.products[pi];
      slots += 1;
      brandSlots.set(p.brand, (brandSlots.get(p.brand) || 0) + 1);
      productSlots.set(pi, (productSlots.get(pi) || 0) + 1);
      if (p.brand === brand) mine = true;
    }
    if (mine) included += 1;
  }
  const eligible = idx.filter((i) => outcomes[i] === OUTCOME.selected || outcomes[i] === OUTCOME.eligible_lost).length;
  const placed = idx.filter((i) => outcomes[i] === OUTCOME.selected).length;

  // Every brand and product in the universe, placed or not (p.8: the
  // denominator includes all brands in the fixed benchmark universe).
  const allBrands = [...new Set(cat.products.map((p) => p.brand))];
  const brands = allBrands
    .map((b) => ({ brand: b, you: b === brand, partner: cat.products.some((p) => p.brand === b && p.partner), slots: brandSlots.get(b) || 0, products: cat.products.filter((p) => p.brand === b).length }))
    .sort((a, b) => b.slots - a.slots || a.brand.localeCompare(b.brand));
  brands.forEach((b) => { b.rank = brands.filter((x) => x.slots > b.slots).length + 1; b.share = slots ? Math.round((b.slots / slots) * 1000) / 10 : null; });
  const products = cat.products
    .map((p, i) => ({ ...p, you: p.brand === brand, slots: productSlots.get(i) || 0 }))
    .sort((a, b) => b.slots - a.slots || a.name.localeCompare(b.name));
  products.forEach((p) => { p.rank = products.filter((x) => x.slots > p.slots).length + 1; p.share = slots ? Math.round((p.slots / slots) * 1000) / 10 : null; });
  const me = brands.find((b) => b.you);

  // Head-to-head on the same shoppers: for every shopper your product fit but
  // missed the top 3, which brands (and which of their products) got the picks.
  const lostIdx = idx.filter((i) => outcomes[i] === OUTCOME.eligible_lost);
  const taken = new Map();
  for (const i of lostIdx) {
    const seen = new Set();
    for (const pi of cat.rows[i].p) {
      const p = cat.products[pi];
      if (p.brand === brand) continue;
      const t = taken.get(p.brand) || { brand: p.brand, partner: false, shoppers: 0, items: new Map() };
      t.partner = t.partner || p.partner;
      t.items.set(p.name, (t.items.get(p.name) || 0) + 1);
      if (!seen.has(p.brand)) { t.shoppers += 1; seen.add(p.brand); }
      taken.set(p.brand, t);
    }
  }
  const takenBy = [...taken.values()]
    .map((t) => ({ brand: t.brand, partner: t.partner, shoppers: t.shoppers, top: [...t.items.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, n]) => ({ name, n })) }))
    .sort((a, b) => b.shoppers - a.shoppers || a.brand.localeCompare(b.brand));

  return {
    scenarios: idx.length,
    slots,
    unfilled: idx.length * (cat.k || 3) - slots,
    brandSlots: me?.slots || 0,
    slotShare: rate(me?.slots || 0, slots),
    inclusion: rate(included, idx.length),
    eligibleToPlaced: rate(placed, eligible),
    noResult: rate(noResult, idx.length),
    rank: me && me.slots ? { rank: me.rank, of: brands.filter((b) => b.slots > 0).length } : { rank: null, of: brands.filter((b) => b.slots > 0).length },
    brands,
    products,
    lost: lostIdx.length,
    takenBy,
  };
}

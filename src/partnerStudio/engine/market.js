/* Category roll-up for Market opportunities. Aggregated activity only. */
import { engagementOf } from './engagement.js';

export const rate = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
export const pct = (v) => (v == null ? 'N/A' : `${v}%`);
const nice = (slug) => {
  const s = String(slug || 'other').replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Roll the catalog up by category. Exported for tests. */
export function marketRollup(catalog, brand) {
  const cats = new Map();
  for (const p of catalog || []) {
    const e = engagementOf(p);
    const k = p.category || 'other';
    const r = cats.get(k) || { id: k, label: nice(k), products: 0, brands: new Set(), opened: 0, buy: 0, mine: 0, myOpened: 0, myBuy: 0, partners: 0, byBrand: new Map() };
    r.products += 1;
    r.brands.add(p.brand);
    r.opened += e.opened;
    r.buy += e.buy;
    if (p.partner) r.partners += 1;
    if (p.brand === brand) { r.mine += 1; r.myOpened += e.opened; r.myBuy += e.buy; }
    const bb = r.byBrand.get(p.brand) || { brand: p.brand, opened: 0, buy: 0, products: 0, partner: false };
    bb.opened += e.opened; bb.buy += e.buy; bb.products += 1; bb.partner = bb.partner || !!p.partner;
    r.byBrand.set(p.brand, bb);
    cats.set(k, r);
  }
  return [...cats.values()].map((r) => ({
    ...r,
    brandCount: r.brands.size,
    ctr: rate(r.buy, r.opened),
    perProduct: r.products ? Math.round((r.opened / r.products) * 10) / 10 : 0,
    myShare: rate(r.myOpened, r.opened),
    leaders: [...r.byBrand.values()].sort((x, y) => y.opened - x.opened || y.buy - x.buy).slice(0, 5),
  })).sort((x, y) => y.opened - x.opened);
}

/** One brand's whole-catalog picture: totals, ranks among all brands, products and categories. */
export function brandSnapshot(catalog, brand) {
  const byBrand = new Map();
  const mine = [];
  for (const p of catalog || []) {
    const e = engagementOf(p);
    const r = byBrand.get(p.brand) || { brand: p.brand, opened: 0, buy: 0, products: 0, partner: false };
    r.opened += e.opened; r.buy += e.buy; r.products += 1; r.partner = r.partner || !!p.partner;
    byBrand.set(p.brand, r);
    if (p.brand === brand) mine.push({ ...p, ...e, ctr: rate(e.buy, e.opened) });
  }
  const brands = [...byBrand.values()];
  const rankBy = (key) => {
    const sorted = [...brands].sort((x, y) => y[key] - x[key]);
    const me = byBrand.get(brand);
    if (!me || !me[key]) return null;
    return sorted.filter((r) => r[key] > me[key]).length + 1;
  };
  const tot = mine.reduce((a, p) => ({ opened: a.opened + p.opened, detail: a.detail + p.detail, buy: a.buy + p.buy }), { opened: 0, detail: 0, buy: 0 });
  const others = brands.filter((r) => r.brand !== brand);
  const otherOpened = others.reduce((a, r) => a + r.opened, 0);
  const otherBuy = others.reduce((a, r) => a + r.buy, 0);
  return {
    products: mine.sort((x, y) => y.opened - x.opened || y.buy - x.buy),
    tot,
    ctr: rate(tot.buy, tot.opened),
    othersCtr: rate(otherBuy, otherOpened),
    viewRank: rankBy('opened'),
    clickRank: rankBy('buy'),
    brandCount: brands.length,
    activeBrands: brands.filter((r) => r.opened > 0).length,
    categories: marketRollup(catalog, brand).filter((c) => c.mine > 0),
  };
}

/** Recommendation test results for any brand, read straight from the run's top-3 lists. */
export function recommendationsFor(categories, brand) {
  const out = [];
  for (const c of categories || []) {
    if (!c.rows || !c.products) continue;
    const listed = c.products.filter((p) => p.brand === brand).length;
    if (!listed) continue;
    const cnt = new Map();
    let slots = 0;
    for (const r of c.rows) for (const pi of r.p || []) { slots += 1; const b = c.products[pi]?.brand; cnt.set(b, (cnt.get(b) || 0) + 1); }
    const mine = cnt.get(brand) || 0;
    const counts = [...cnt.values()];
    out.push({ id: c.id, label: c.label, listed, slots, mine, share: rate(mine, slots), rank: mine ? counts.filter((n) => n > mine).length + 1 : null, of: counts.length, shoppers: c.rows.length });
  }
  return out;
}

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


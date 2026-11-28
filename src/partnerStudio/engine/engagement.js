/**
 * Helpers for real shopper activity from the ayna app (PostHog). The counts
 * themselves live server-side (api/_partnerStudio/engagement.js) and reach the
 * page inside the admin-only snapshot as product.eng. This file holds no data.
 *
 * Each count is how many different people saw, opened, viewed the page of, or
 * clicked to buy a product, once per product. ayna team accounts and bots are
 * excluded. Card views were tracked from Oct 28 and product pages from Oct 26.
 */
export const ENG_FROM = '2026-08-29';
export const ENG_TO = '2026-11-27';
const fmtDay = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const ENG_RANGE = `${fmtDay(ENG_FROM)} to ${fmtDay(ENG_TO)}`;

export const ENG_STAGES = [
  { key: 'seen', label: 'Saw the card', short: 'Saw' },
  { key: 'opened', label: 'Opened the card', short: 'Opened' },
  { key: 'detail', label: 'Viewed the product page', short: 'Product page' },
  { key: 'buy', label: 'Clicked to buy', short: 'Buy click' },
];

const ZERO = { seen: 0, opened: 0, detail: 0, buy: 0 };
/** Activity for one snapshot product ({ eng }). Missing means none recorded. */
export const engagementOf = (p) => ({ ...ZERO, ...(p?.eng || {}) });

/** Per-brand totals for a set of products [{ id, brand, you, partner }], ranked by opens. */
export function brandEngagement(products) {
  const map = new Map();
  for (const p of products) {
    const e = engagementOf(p);
    const r = map.get(p.brand) || { brand: p.brand, you: !!p.you, partner: !!p.partner, products: 0, seen: 0, opened: 0, detail: 0, buy: 0 };
    r.products += 1;
    r.you = r.you || !!p.you;
    for (const s of ENG_STAGES) r[s.key] += e[s.key];
    map.set(p.brand, r);
  }
  const rows = [...map.values()].sort((a, b) => b.opened - a.opened || b.buy - a.buy || a.brand.localeCompare(b.brand));
  let rank = 0;
  let prev = null;
  rows.forEach((r, i) => {
    if (prev === null || r.opened !== prev) { rank = i + 1; prev = r.opened; }
    r.rank = rank;
  });
  return rows;
}

/** Product rows with activity, for a set of products. */
export const productEngagement = (products) => products.map((p) => ({ ...p, ...engagementOf(p) }));

/** Brand-level summary for a KPI: your opens, your rank by opens, and how many brands had any. */
export function realSummary(products) {
  const brands = brandEngagement(products);
  const me = brands.find((r) => r.you) || { opened: 0, buy: 0, rank: null };
  return { me, brands: brands.length, withAny: brands.filter((r) => r.opened > 0).length };
}

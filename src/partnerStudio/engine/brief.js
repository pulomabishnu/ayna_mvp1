/* Monthly brief numbers. Pure, so the page, the text copy and the CSV agree. */
import { brandSnapshot, recommendationsFor } from './market.js';
import { discoveryFor } from './discovery.js';
import { readinessFor } from './readiness.js';
import { groupActions } from './actionGroups.js';
import { ENG_RANGE } from './engagement.js';

export const short = (name, brand) => (name.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? name.slice(String(brand).length + 1) : name);
const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** Pure: every number in the brief, so the page, the text copy and the CSV agree. */
export function buildBrief(data, b, actionState = {}) {
  const brand = b.brand || b.name;
  const name = b.displayName || brand;
  const s = brandSnapshot(data.catalog, brand);
  const d = discoveryFor(data.catalog, brand);
  const r = readinessFor(b);
  const recs = recommendationsFor(data.categories, brand);
  const actions = groupActions(b.actions || []).filter((a) => (actionState[a.id] || 'open') !== 'done').slice(0, 3);
  const top = s.products.find((p) => p.opened) || null;
  const bestCat = [...s.categories].sort((x, y) => (y.myShare || 0) - (x.myShare || 0))[0] || null;
  return { name, brand, s, d, r, recs, actions, top, bestCat };
}

export function briefText(x) {
  const lines = [
    `${x.name}: ayna Partner Studio brief (${ENG_RANGE})`,
    '',
    'Real activity in the ayna app',
    `- Product card opens: ${x.s.tot.opened}`,
    `- Clicks to retailer: ${x.s.tot.buy} (clicks, not purchases)`,
    `- Full product page views (website): ${x.s.tot.detail}`,
    x.top ? `- Most opened product: ${short(x.top.name, x.name)} (${x.top.opened})` : '- No product opens yet',
    '',
    'How shoppers found you (website)',
    `- Search: ${x.d.me.search}, browsing: ${x.d.me.browse}, elsewhere: ${x.d.me.other}`,
    '',
    'Product readiness',
    x.r.score != null ? `- Average readiness: ${x.r.score}%` : '- Not checked yet',
    ...x.r.gaps.slice(0, 3).map((g) => `- ${g.label}: ${g.products.map((n) => short(n, x.name)).join(', ')}`),
    '',
    'Product match simulation (synthetic shopping scenarios, not actual activity)',
    ...(x.recs.length ? x.recs.map((rc) => `- ${rc.label}: ${rc.mine} selections, ${rc.share ?? 0}% of filled spots`) : ['- Not in the simulation yet']),
    '',
    'Recommended actions',
    ...(x.actions.length ? x.actions.map((a, k) => `${k + 1}. ${a.title}`) : ['- Nothing open']),
  ];
  return lines.join('\n');
}

export function briefCsv(x) {
  const rows = [
    ['section', 'metric', 'value'],
    ['activity', 'product_card_opens', x.s.tot.opened],
    ['activity', 'clicks_to_retailer', x.s.tot.buy],
    ['activity', 'full_product_page_views', x.s.tot.detail],
    ['activity', 'card_appearances', x.s.tot.seen],
    ['discovery', 'from_search', x.d.me.search],
    ['discovery', 'from_browsing', x.d.me.browse],
    ['discovery', 'from_elsewhere', x.d.me.other],
    ['readiness', 'average_percent', x.r.score ?? ''],
    ...x.recs.map((rc) => ['simulation', `${rc.id}_selections`, rc.mine]),
    ...x.s.products.map((p) => ['product', p.name, `opens=${p.opened}; clicks=${p.buy}`]),
  ];
  return rows.map((r) => r.map(csvCell).join(',')).join('\n');
}

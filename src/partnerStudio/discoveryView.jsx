/* How shoppers find your products on ayna: search, browsing or elsewhere.
   Website card opens only (the app doesn't record a source yet). */
import React, { useState } from 'react';
import { Kpi, Empty } from './ui.jsx';
import { Insights, NextSteps } from './tiles.jsx';
import { Panel, SortTable, Method, Stacked100, ViewSwitch } from './charts.jsx';
import { C } from './chartColors.js';
import { discoveryFor } from './engine/discovery.js';

const MIN = 10;
const pct = (v) => (v == null ? 'N/A' : `${v}%`);
const short = (name, brand) => (name.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? name.slice(String(brand).length + 1) : name);
const KEYS = [
  { key: 'search', label: 'Search', color: C.you, dark: true },
  { key: 'browse', label: 'Browsing', color: C.rival },
  { key: 'other', label: 'Elsewhere', color: C.pink },
];
const fmtDay = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function Discovery({ data, b, go }) {
  const [mode, setMode] = useState('chart');
  const brand = b.brand || b.name;
  const name = b.displayName || brand;
  const d = discoveryFor(data.catalog, brand);
  const range = data.discoveryRange ? `${fmtDay(data.discoveryRange.from)} to ${fmtDay(data.discoveryRange.to)}` : 'the last 90 days';
  if (!d.products.length) return <Empty title={`${name} has no products listed on ayna yet`}>Once products are listed, this page shows how shoppers find them.</Empty>;
  const early = d.me.total < MIN;
  const searchGap = !early && d.peers.searchShare != null && d.me.searchShare != null ? Math.round((d.me.searchShare - d.peers.searchShare) * 10) / 10 : null;
  const topSearch = [...d.products].filter((p) => p.search).sort((x, y) => y.search - x.search)[0];
  const browseOnly = d.products.filter((p) => p.browse && !p.search);
  const unseen = d.products.filter((p) => !p.total);
  const findings = [
    d.me.total ? `${d.me.total} website card opens with a known source: ${d.me.search} from search, ${d.me.browse} from browsing, ${d.me.other} from elsewhere.` : 'No website card opens with a source yet.',
    early ? `Early activity: fewer than ${MIN} opens, so comparisons aren’t shown yet.` : searchGap != null ? `${pct(d.me.searchShare)} of your opens come from search vs ${pct(d.peers.searchShare)} for other brands in your categories.` : null,
    topSearch ? `${short(topSearch.name, name)} is found through search most often (${topSearch.search} ${topSearch.search === 1 ? 'person' : 'people'}).` : browseOnly.length ? 'None of your products has been found through search yet; every open came from browsing.' : null,
  ];
  const actions = [
    ...(browseOnly.length ? [{ text: `Help search find ${browseOnly.length === 1 ? short(browseOnly[0].name, name) : `${browseOnly.length} products`}`, note: 'Shoppers found these only by browsing. Make sure each listing names the need, format and key ingredient in plain words shoppers search for.' }] : []),
    ...(searchGap != null && searchGap < -10 ? [{ text: 'Close the search gap with your category', note: `Other brands in your categories get ${pct(d.peers.searchShare)} of opens from search. Plain-language names and descriptions are the usual difference.` }] : []),
    ...(unseen.length ? [{ text: `Get ${unseen.length === 1 ? short(unseen[0].name, name) : `${unseen.length} products`} discovered`, note: 'No website opens yet. Complete the listing so it appears in more categories and searches.' }] : []),
    { text: 'See which products convert once found', note: 'Product performance shows clicks to retailer per product.' },
  ];
  return (
    <>
      <div className="ps-filters">
        <span className="ps-small ps-muted">Where people were on the ayna website when they opened your product card, {range}. Different people per product. ayna team and bots excluded. App opens don’t record a source yet, so they aren’t included here.</span>
      </div>
      <div className="ps-bento">
        <div className="b-3"><Kpi tone="ink" icon="target" label="Found through search" value={String(d.me.search)} den={early ? 'early activity' : `${pct(d.me.searchShare)} of your opens`} info="Different people who opened your product card from search results on the ayna website." /></div>
        <div className="b-3"><Kpi tone="pink" icon="grid" label="Found by browsing" value={String(d.me.browse)} den="Explore and category pages" info="Different people who opened your product card while browsing Explore or a category page." /></div>
        <div className="b-3"><Kpi tone="butter" icon="layers" label="Found elsewhere" value={String(d.me.other)} den="for example a recommendation list" /></div>
        <div className="b-3"><Kpi tone="plain" icon="swap" label="Search share in your categories" value={pct(d.peers.searchShare)} den={`other brands, ${d.peers.total} opens`} info="Share of website card opens that came from search, for every other brand selling in your categories." /></div>
        <Panel className="b-8" id="ds-mix" title="Discovery mix" info="Share of website card opens by where the shopper was. Your brand next to other brands in your categories and everyone on ayna." right={<ViewSwitch label="Show as" views={[['chart', 'Chart'], ['table', 'Table']]} value={mode} onChange={setMode} />}>
          {mode === 'chart' ? (
            <Stacked100 rows={[
              { label: `${name} (you)`, you: true, counts: d.me },
              { label: 'Other brands in your categories', counts: d.peers },
              { label: 'Everyone on ayna', counts: d.everyone },
            ]} keys={KEYS} />
          ) : (
            <SortTable rows={d.products.map((p) => ({ ...p, label: short(p.name, name) }))} initial={{ key: 'total', dir: 'desc' }} columns={[
              { key: 'label', label: 'Product' },
              { key: 'search', label: 'Search', num: true },
              { key: 'browse', label: 'Browsing', num: true },
              { key: 'other', label: 'Elsewhere', num: true },
              { key: 'searchShare', label: 'From search', num: true, render: (p) => pct(p.searchShare) },
            ]} />
          )}
        </Panel>
        <div className="b-4 ps-stack-col ps-col12">
          <Insights items={findings} />
          <NextSteps actions={actions} />
        </div>
        <Panel className="b-12" id="ds-products" title="By product" info="Website card opens per product, split by where the shopper was." right={<button type="button" className="ps-link" onClick={() => go('products')}>View product performance ›</button>}>
          <Stacked100 rows={d.products.filter((p) => p.total).slice(0, 10).map((p) => ({ label: short(p.name, name), counts: p }))} keys={KEYS} />
          {unseen.length ? <p className="ps-small ps-muted">No website opens yet: {unseen.map((p) => short(p.name, name)).join(', ')}.</p> : null}
        </Panel>
      </div>
      <Method updated={range} scope={`${d.products.length} products`} items={[
        `Source: product_card_opened events on the ayna website, ${range}, grouped by the page the shopper was on. Different people per product. ayna team accounts and bots excluded.`,
        'Search = opened from search results. Browsing = Explore and category pages. Elsewhere = any other list, such as recommendations.',
        'The search text is never stored or shown, only that the open came from search.',
        'App opens don’t record a source yet, so this covers the website only. Numbers are small; read them as direction.',
      ]} />
    </>
  );
}

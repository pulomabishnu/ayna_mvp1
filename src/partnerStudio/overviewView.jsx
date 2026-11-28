/* Overview for any brand on ayna: built from the whole catalog and aggregate app
   activity, so it works whether or not the brand is in the recommendation benchmark. */
import React, { useState } from 'react';
import { Empty } from './ui.jsx';
import { KpiCard as Kpi } from './kpiCard.jsx';
import { Insights, NextSteps } from './tiles.jsx';
import { Panel, RankedBars, Method, ViewSwitch, SortTable } from './charts.jsx';
import { ActionPreview } from './actionsBoard.jsx';
import { money } from './format.js';
import { ENG_RANGE } from './engine/engagement.js';
import { brandSnapshot, recommendationsFor, pct } from './engine/market.js';
import { groupActions } from './engine/actionGroups.js';

const median = (xs) => { const v = xs.filter((x) => x != null).sort((a, b) => a - b); if (!v.length) return null; const m = Math.floor(v.length / 2); return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2; };
const MIN_OPENS = 30;
const METRIC = { opened: ['Product card opens', ''], buy: ['Clicks to retailer', ''], ctr: ['Click-through rate', '%'] };
const short = (name, brand) => (name.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? name.slice(String(brand).length + 1) : name);

export function Overview({ data, b, go, actionState = {} }) {
  const [metric, setMetric] = useState('opened');
  const [mode, setMode] = useState('chart');
  const name = b.displayName || b.brand || b.name;
  const s = brandSnapshot(data.catalog, b.brand || b.name);
  if (!s.products.length) return <Empty title={`${name} has no products listed on ayna yet`}>Once products are in the catalog, this page shows how shoppers find and click through to them.</Empty>;
  const recs = recommendationsFor(data.categories, b.brand || b.name);
  const funnelOf = (id) => (b.categories || []).find((c) => c.id === id)?.funnel;
  const open = groupActions(b.actions || []).filter((a) => (actionState[a.id] || 'open') !== 'done');
  const topProduct = s.products[0];
  // Comparisons need enough activity to mean anything (CDC guidance on small counts).
  const early = s.tot.opened < MIN_OPENS;
  const comp = (b.competitors || [])[0];
  const compMed = comp ? { price: median(comp.peers.map((p) => p.price)), facts: median(comp.peers.map((p) => p.completeness)) } : {};
  const lowCtr = s.products.filter((p) => p.opened >= MIN_OPENS && s.othersCtr != null && (p.ctr || 0) < s.othersCtr).sort((x, y) => y.opened - x.opened)[0];
  const unseen = s.products.filter((p) => !p.opened);
  const bestCat = [...s.categories].sort((x, y) => (y.myShare || 0) - (x.myShare || 0))[0];
  const findings = [
    s.tot.opened ? `${s.tot.opened} product card opens and ${s.tot.buy} clicks to a retailer across your ${s.products.length} ${s.products.length === 1 ? 'product' : 'products'}.` : 'None of your products has been opened yet.',
    !early && s.ctr != null && s.othersCtr != null ? `Your click-through rate is ${s.ctr}% vs ${s.othersCtr}% for every other brand on ayna.` : `Early activity: fewer than ${MIN_OPENS} card opens, so comparisons with other brands aren’t shown yet.`,
    s.tot.opened && !s.tot.detail ? 'No full product page views yet. That page is website-only; card opens show details in a panel, so this is expected and not a tracking gap.' : null,
    bestCat && bestCat.myOpened ? `You have ${pct(bestCat.myShare)} of card opens in ${bestCat.label.toLowerCase()}${bestCat.leaders[0]?.brand === (b.brand || b.name) ? ', the most of any brand.' : `; ${bestCat.leaders[0]?.brand} leads.`}` : null,
  ];
  const actions = [
    ...open.slice(0, 1).map((a) => ({ text: a.title, note: a.action })),
    ...(lowCtr ? [{ text: `Review ${short(lowCtr.name, name)}’s listing`, note: `Many views, but a click-through rate of ${pct(lowCtr.ctr)} vs ${s.othersCtr}% on ayna. Check price, photos and the opening lines.` }] : []),
    ...(unseen.length ? [{ text: `Get ${unseen.length === 1 ? short(unseen[0].name, name) : `${unseen.length} products`} seen`, note: 'No views yet. Complete the product facts and name the need each one is for.' }] : []),
    { text: 'Compare your listings with similar products', note: 'Product comparison shows price, format and product facts side by side.' },
  ];
  return (
    <>
      <div className="ps-filters">
        <span className="ps-small ps-muted">Every brand on ayna, compared on the same numbers: real people in the ayna app, {ENG_RANGE}. ayna team and bots excluded. Clicks to retailer are not purchases.</span>
      </div>
      <div className="ps-bento">
        <div className="b-3"><Kpi tone="plain" icon="target" label="Card appearances" value={String(s.tot.seen)} den="people saw a card, Explore page only" info="Different people who saw one of your product cards on the Explore page, counted once per product. Recorded only since Oct 28 and only on Explore, so it undercounts." onOpen={() => go('products')} /></div>
        <div className="b-3"><Kpi tone="pink" icon="box" label="Product card opens" value={String(s.tot.opened)} den="people opened a product card" info="Different people who opened one of your product cards in the app or on the website, counted once per product." onOpen={() => go('products')} /></div>
        <div className="b-3"><Kpi tone="butter" icon="doc" label="Full product page views" value={String(s.tot.detail)} den="website product page only" info="Different people who opened the full product page on the website. Card opens show product details in a panel, so most people never need the full page." onOpen={() => go('products')} /></div>
        <div className="b-3"><Kpi tone="ink" icon="share" label="Clicks to retailer" value={String(s.tot.buy)} den={early ? 'early activity, too few opens to compare' : `${pct(s.ctr)} of opens vs ${s.othersCtr}% for other brands`} info="Different people who pressed a buy or retailer button on one of your products, counted once per product. A click is not a purchase." onOpen={() => go('products')} /></div>
        <Panel className="b-8" id="ov-products" title="Your products" info="Real ayna app activity per product. Switch the measure or show the exact numbers as a table." right={<><ViewSwitch label="Measure" views={Object.entries(METRIC).map(([k, [l]]) => [k, l.replace('Clicks to retailer', 'Clicks').replace('Click-through rate', 'Click-through').replace('Product card opens', 'Card opens')])} value={metric} onChange={setMetric} /><ViewSwitch label="Show as" views={[['chart', 'Chart'], ['table', 'Table']]} value={mode} onChange={setMode} /></>}>
          {mode === 'chart' ? (
            <RankedBars unit={METRIC[metric][1]} max={metric === 'ctr' ? 100 : undefined} rows={[...s.products].sort((x, y) => (y[metric] || 0) - (x[metric] || 0)).slice(0, 8).map((p) => ({ label: short(p.name, name), value: p[metric] || 0, you: p === topProduct, sub: metric === 'opened' ? `${p.buy} ${p.buy === 1 ? 'click' : 'clicks'} to retailer` : `${p.opened} product card opens` }))} />
          ) : (
            <SortTable rows={s.products.map((p) => ({ ...p, label: short(p.name, name) }))} initial={{ key: metric, dir: 'desc' }} limit={8} columns={[
              { key: 'label', label: 'Product' },
              { key: 'opened', label: 'Product card opens', num: true },
              { key: 'buy', label: 'Clicks to retailer', num: true },
              { key: 'ctr', label: 'Click-through rate', num: true, render: (p) => pct(p.ctr) },
            ]} />
          )}
          <button type="button" className="ps-link" onClick={() => go('products')}>View report ›</button>
        </Panel>
        <Insights className="b-4" items={findings} />
        <Panel className="b-12" id="ov-actions" title="Recommended actions" info="The finding and what it is worth are shown here. Open one to see why, or go to the Action plan to reply with notes, links or documents." right={open.length ? <button type="button" className="ps-btn ps-btn--sm" onClick={() => go('actions')}>View all actions ({open.length})</button> : null}>
          {open.length ? <ActionPreview b={b} actionState={actionState} go={go} /> : <NextSteps title="Where to start" actions={actions} />}
        </Panel>
        <Panel className="b-4" id="ov-cats" title="Your share of each category" info="Your product card opens as a share of all product card opens in each category you sell in." right={<button type="button" className="ps-link" onClick={() => go('market')}>View report ›</button>}>
          <RankedBars unit="%" max={100} rows={s.categories.slice(0, 5).map((c) => ({ label: c.label, value: c.myShare || 0, you: true, sub: c.leaders[0] && c.leaders[0].brand !== (b.brand || b.name) ? `Leader: ${c.leaders[0].brand}` : 'You lead' }))} />
        </Panel>
        <Panel className="b-4" id="ov-comp" title="Competitive comparison" info="How your listing compares with the most similar products on ayna. Public information only." right={comp ? <button type="button" className="ps-link" onClick={() => go('competitors')}>Compare products ›</button> : null}>
          {comp ? (
            <ul className="ps-why-list">
              <li><span>{short(comp.name, name)}<small>vs {comp.peers.length} similar products</small></span><b>Your listing</b></li>
              <li><span>Price<small>{compMed.price != null ? `Similar products: ${money(compMed.price)} median` : 'No peer prices on file'}</small></span><b>{comp.price != null ? money(comp.price) : 'Not on file'}</b></li>
              <li><span>Product facts complete<small>{compMed.facts != null ? `Similar products: ${compMed.facts}% median` : ''}</small></span><b>{comp.completeness != null ? `${comp.completeness}%` : 'N/A'}</b></li>
            </ul>
          ) : (
            <ul className="ps-why-list">
              {s.categories.slice(0, 3).map((c) => <li key={c.id}><span>{c.label}<small>{c.brandCount} brands, {c.products} products</small></span><b>{c.leaders[0]?.brand === (b.brand || b.name) ? 'You lead' : `${c.leaders[0]?.brand} leads`}</b></li>)}
            </ul>
          )}
        </Panel>
        <Panel className="b-4" id="ov-recs" title="Product match simulation" info="How often ayna’s matching engine puts your products in a shopper’s top 3, from a simulation with synthetic shopping scenarios. Not sales or real demand." right={(b.categories || []).length ? <button type="button" className="ps-link" onClick={() => go('share')}>View report ›</button> : null}>
          <span className="ps-sim-label">Simulation only</span>
          <p className="ps-small ps-muted">Simulated shopping scenarios using ayna’s matching rules. Not actual customer activity, sales or clinical suitability.</p>
          {recs.length ? (
            <ul className="ps-why-list">
              {recs.map((r) => {
                const f = funnelOf(r.id);
                return (
                  <li key={r.id}>
                    <span>{r.label}<small>{f ? `Selected in ${f.placed} of ${f.eligible} eligible scenarios` : `${r.listed} ${r.listed === 1 ? 'product' : 'products'} in the simulation, ${r.shoppers} scenarios`}</small></span>
                    <b>{r.rank ? `${r.mine} selections, ${r.share}% share` : '0 selections'}</b>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ps-small">The simulation covers period care, intimate care, and bladder and pelvic floor so far. {name}’s products aren’t in it yet.</p>
          )}
        </Panel>
      </div>
      <Method updated={ENG_RANGE} scope={`${s.brandCount} brands, ${(data.catalog || []).length} products`} items={[
        `Source: ayna app activity in PostHog, ${ENG_RANGE}. Each number counts different people, once per product. ayna team accounts and bots are excluded. No individual shopper data.`,
        'Comparisons with other brands appear once you have at least 30 card opens. The comparison group is every other brand with a product in the catalog, partner or not.',
        'Card appearances are recorded only on the Explore page since Oct 28. Full product page views are website-only. Saves and sales are not tracked yet.',
        'Products listed: catalog products with a price, any activity, or a brand partner flag.',
        'The product match simulation uses synthetic shopping scenarios and is never mixed into the activity numbers.',
      ]} />
    </>
  );
}

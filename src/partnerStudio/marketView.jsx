/* Market opportunities: where shopper activity on ayna is, by category, and how
   much of it your brand has. Aggregated app activity only, no individual data. */
import React, { useState } from 'react';
import { Kpi, Drawer } from './ui.jsx';
import { Insights, NextSteps } from './tiles.jsx';
import { Panel, SortTable, Method, RankedBars } from './charts.jsx';
import { C } from './chartColors.js';
import { ENG_RANGE } from './engine/engagement.js';
import { marketRollup, rate, pct } from './engine/market.js';

export function Market({ data, b, go }) {
  const [pick, setPick] = useState(null);
  const [partnersOnly, setPartnersOnly] = useState(false);
  const catalog = (data.catalog || []).filter((p) => !partnersOnly || p.partner || p.brand === b.brand);
  const rows = marketRollup(catalog, b.brand);
  const active = rows.filter((r) => r.opened > 0);
  const totalViews = rows.reduce((a, r) => a + r.opened, 0);
  const mineCats = rows.filter((r) => r.mine > 0);
  const myViews = mineCats.reduce((a, r) => a + r.myOpened, 0);
  const top = active[0];
  // A gap is an active category (above the median activity per product) where the brand has no product.
  const perProd = active.map((r) => r.perProduct).sort((x, y) => x - y);
  const medPer = perProd.length ? perProd[Math.floor(perProd.length / 2)] : 0;
  const gaps = active.filter((r) => !r.mine && r.perProduct >= medPer && r.products >= 2);
  const myBest = [...mineCats].sort((x, y) => (y.myShare || 0) - (x.myShare || 0))[0];
  const myWeak = mineCats.filter((r) => r.opened >= 10).sort((x, y) => (x.myShare || 0) - (y.myShare || 0))[0];
  const findings = [
    top ? `${top.label} gets the most product views on ayna: ${top.opened} across ${top.products} products.` : 'No product activity recorded yet.',
    myBest && myBest.myOpened ? `You have ${pct(myBest.myShare)} of product views in ${myBest.label.toLowerCase()}${myBest.leaders[0]?.brand === b.brand ? ', the most of any brand.' : '.'}` : mineCats.length ? 'Your products have no recorded views yet.' : null,
    gaps.length ? `${gaps[0].label} gets ${gaps[0].perProduct} views per product and you have nothing listed there. Worth knowing if it fits your line.` : null,
  ];
  const actions = [
    ...(mineCats.length && !myViews ? [{ text: 'Get your first product views', note: 'None of your products has been opened yet. Complete the product facts and name the need each product is for, so it qualifies for more matches.' }] : []),
    ...(myWeak && myWeak !== myBest ? [{ text: `Grow your share in ${myWeak.label.toLowerCase()}`, note: `You have ${pct(myWeak.myShare)} of its product views. Compare your listings with ${myWeak.leaders[0]?.brand || 'the leader'}, which has the most.` }] : []),
    { text: 'Check how your listings compare', note: 'Product comparison shows price, format and product facts next to similar products.' },
    { text: 'See where your products miss recommendations', note: 'Why products miss lists the reasons, product by product.' },
  ];
  const sel = pick ? rows.find((r) => r.id === pick) : null;
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        <label className="ps-check"><input type="checkbox" checked={partnersOnly} onChange={(e) => setPartnersOnly(e.target.checked)} /> Brand partners only</label>
        <span className="ps-small ps-muted">Real people in the ayna app, {ENG_RANGE}, added up by category. ayna team and bots excluded. No individual shopper data.</span>
      </div>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="layers" label="Your share of views" value={pct(rate(myViews, mineCats.reduce((a, r) => a + r.opened, 0)))} den={`in the ${mineCats.length} ${mineCats.length === 1 ? 'category' : 'categories'} you sell in`} info="Product views of your products divided by all product views in the categories where you have at least one product." meter={rate(myViews, mineCats.reduce((a, r) => a + r.opened, 0)) || 0} /></div>
        <div className="b-2"><Kpi tone="pink" icon="grid" label="Categories" value={String(rows.length)} den={`${active.length} with activity`} /></div>
        <div className="b-2"><Kpi tone="deep" icon="trophy" label="Most viewed" value={top ? top.label : 'N/A'} den={top ? `${rate(top.opened, totalViews)}% of all views` : ''} /></div>
        <div className="b-2"><Kpi tone="butter" icon="target" label="Open categories" value={String(gaps.length)} den="busy, and you have no product" info="Categories with above-median product views per product where you have nothing listed." /></div>
        <div className="b-2"><Kpi tone="plain" icon="hash" label="Products listed" value={String(rows.reduce((a, r) => a + r.products, 0))} den={partnersOnly ? 'from brand partners and you' : 'across all brands'} /></div>
        <Panel className="b-8" id="mk-bars" title="Where shoppers look on ayna" info="Product views by category, added up across products. One person who opens two products in a category counts twice. Tap a category for details.">
          <RankedBars unit="" rows={active.slice(0, 12).map((r) => ({ label: <button type="button" className="ps-link" onClick={() => setPick(r.id)}>{r.label}</button>, value: r.opened, you: r.mine > 0, sub: `${r.products} ${r.products === 1 ? 'product' : 'products'}, ${r.brandCount} ${r.brandCount === 1 ? 'brand' : 'brands'}` }))} />
          <p className="ps-small ps-muted"><span className="ps-key-dot is-you" /> You sell in this category <span className="ps-key-dot" style={{ background: C.rival }} /> You don’t</p>
        </Panel>
        <div className="b-4 ps-stack-col ps-col12">
          <Insights items={findings} />
          <NextSteps actions={actions} />
        </div>
        <Panel className="b-12" id="mk-tbl" title="Every category" info="Tap a category to see which brands lead it.">
          <SortTable limit={12} rows={rows} rowClass={(r) => (r.mine ? 'is-you' : '')} initial={{ key: 'opened', dir: 'desc' }} columns={[
            { key: 'label', label: 'Category', render: (r) => <button type="button" className="ps-link" onClick={() => setPick(r.id)}>{r.label}</button> },
            { key: 'products', label: 'Products', num: true },
            { key: 'brandCount', label: 'Brands', num: true },
            { key: 'opened', label: 'Product views', num: true },
            { key: 'perProduct', label: 'Views per product', num: true },
            { key: 'ctr', label: 'Click-through rate', num: true, render: (r) => pct(r.ctr) },
            { key: 'mine', label: 'Your products', num: true },
            { key: 'myShare', label: 'Your share of views', num: true, render: (r) => (r.mine ? pct(r.myShare) : '') },
          ]} />
        </Panel>
      </div>
      {sel ? (
        <Drawer title={sel.label} onClose={() => setPick(null)}>
          <p className="ps-why-verdict">{sel.mine ? `You have ${sel.mine} ${sel.mine === 1 ? 'product' : 'products'} here and ${pct(sel.myShare)} of its product views.` : 'You have no products in this category.'}</p>
          <div className="ps-why-kpis">
            <div><span className="ps-num">{sel.opened}</span><small>product views</small></div>
            <div><span className="ps-num">{sel.perProduct}</span><small>views per product</small></div>
            <div><span className="ps-num">{pct(sel.ctr)}</span><small>click-through rate</small></div>
          </div>
          <section>
            <h3 className="ps-why-h">Brands with the most product views</h3>
            <ul className="ps-why-list">
              {sel.leaders.map((l) => <li key={l.brand}><span>{l.brand}{l.brand === b.brand ? ' (you)' : ''}{l.partner && l.brand !== b.brand ? ' · Brand partner' : ''}</span><b>{l.opened} views, {l.buy} clicks</b></li>)}
            </ul>
          </section>
          <section>
            <h3 className="ps-why-h">What to do</h3>
            <p className="ps-small">{sel.mine
              ? (sel.leaders[0]?.brand === b.brand ? 'You lead this category. Keep listings current and watch for new products from the brands below you.' : `Compare your listings with ${sel.leaders[0]?.brand}: price, format, photos and product facts.`)
              : 'Shopper activity here is real, but entering a category is a bigger decision than this data can make. Use it as one input.'}</p>
          </section>
          {sel.mine ? <div className="ps-ab-row"><button type="button" className="ps-btn ps-btn--sm ps-btn--ink" onClick={() => { setPick(null); go?.('competitors'); }}>Open product comparison</button></div> : null}
          <p className="ps-small ps-muted">Real people in the ayna app, {ENG_RANGE}. Small numbers: read them as direction, not proof.</p>
        </Drawer>
      ) : null}
      <Method updated={ENG_RANGE} scope={`${rows.length} categories, ${catalog.length} products`} items={[
        `Source: ayna app activity in PostHog, ${ENG_RANGE}, added up by product category. ayna team accounts and bots are excluded. No individual shopper data is shown.`,
        'Product views count different people per product. Category totals add products together, so one person who opens two products in a category counts twice.',
        'Open categories: above-median product views per product, at least two products listed, and none from your brand.',
        'This shows where shoppers look on ayna today. It is not a forecast and does not cover activity outside ayna. Trends over time will appear once we keep monthly history.',
        'Product launch tracking is not live yet.',
      ]} />
    </>
  );
}

/* Product performance: real ayna app activity per product, from discovery to the
   click out to the brand or retailer. Real people, small numbers, no purchases. */
import React, { useState } from 'react';
import { Kpi, Drawer, Empty } from './ui.jsx';
import { Insights, NextSteps } from './tiles.jsx';
import { Panel, SortTable, Method, FunnelBars } from './charts.jsx';
import { C } from './chartColors.js';
import { money } from './format.js';
import { engagementOf, ENG_RANGE } from './engine/engagement.js';
import { productsOf as crProductsOf } from './engine/claimsResearch.js';

const rate = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : null);
const pct = (v) => (v == null ? 'N/A' : `${v}%`);
const short = (name, brand) => (name.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? name.slice(String(brand).length + 1) : name);

const QUAD = {
  win: { label: 'High-intent winners', tip: 'Many product views and a strong click-through rate.', move: 'Keep this listing as your template, and point new shoppers to it.' },
  look: { label: 'Needs a look', tip: 'Many product views but few clicks to retailer.', move: 'Check price, photos and the first lines of the description against the products that win.' },
  hidden: { label: 'Hidden performers', tip: 'Few product views, but people who view it click through.', move: 'Make sure its listing names the need it serves so more shoppers find it.' },
  low: { label: 'Low visibility', tip: 'Few product views and few clicks.', move: 'Fill in missing product facts and the need it is for, so it qualifies for more matches.' },
};

function Quadrant({ points, xMid, yMid, onPick }) {
  const W = 640; const H = 360; const pad = { l: 48, r: 16, t: 16, b: 40 };
  const xMax = Math.max(4, ...points.map((p) => p.opened)) * 1.1;
  const yMax = 100;
  const X = (v) => pad.l + (v / xMax) * (W - pad.l - pad.r);
  const Y = (v) => H - pad.b - (v / yMax) * (H - pad.t - pad.b);
  const others = points.filter((p) => !p.you);
  const mine = points.filter((p) => p.you);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ps-quad" role="img" aria-label="Products by product views and click-through rate">
      <rect x={X(xMid)} y={pad.t} width={W - pad.r - X(xMid)} height={Y(yMid) - pad.t} fill="rgba(247,186,221,.18)" />
      <line x1={X(xMid)} x2={X(xMid)} y1={pad.t} y2={H - pad.b} stroke="rgba(62,39,35,.25)" strokeDasharray="4 4" />
      <line x1={pad.l} x2={W - pad.r} y1={Y(yMid)} y2={Y(yMid)} stroke="rgba(62,39,35,.25)" strokeDasharray="4 4" />
      <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="rgba(62,39,35,.35)" />
      <line x1={pad.l} x2={pad.l} y1={pad.t} y2={H - pad.b} stroke="rgba(62,39,35,.35)" />
      {[0, 50, 100].map((t) => <text key={t} x={pad.l - 8} y={Y(t) + 4} textAnchor="end" fontSize="11" fill="rgba(62,39,35,.75)">{t}%</text>)}
      <text x={(W + pad.l) / 2} y={H - 8} textAnchor="middle" fontSize="12" fill="rgba(62,39,35,.85)">Product views (people)</text>
      <text x={14} y={(H - pad.b) / 2} textAnchor="middle" fontSize="12" fill="rgba(62,39,35,.85)" transform={`rotate(-90 14 ${(H - pad.b) / 2})`}>Click-through rate</text>
      <text x={W - pad.r - 6} y={pad.t + 14} textAnchor="end" fontSize="11" fontWeight="600" fill="rgba(62,39,35,.8)">High-intent winners</text>
      <text x={W - pad.r - 6} y={H - pad.b - 8} textAnchor="end" fontSize="11" fontWeight="600" fill="rgba(62,39,35,.8)">Needs a look</text>
      <text x={pad.l + 6} y={pad.t + 14} fontSize="11" fontWeight="600" fill="rgba(62,39,35,.8)">Hidden performers</text>
      <text x={pad.l + 6} y={H - pad.b - 8} fontSize="11" fontWeight="600" fill="rgba(62,39,35,.8)">Low visibility</text>
      {others.map((p) => <circle key={p.id} cx={X(p.opened)} cy={Y(p.ctr || 0)} r={p.partner ? 6 : 5} fill={p.partner ? C.pink : C.rival} stroke={p.partner ? C.you : 'none'} strokeWidth="1.5" opacity={p.partner ? 0.95 : 0.55}><title>{`${p.name} (${p.brand}${p.partner ? ', brand partner' : ''}): ${p.opened} product views, ${pct(p.ctr)} click-through rate`}</title></circle>)}
      {mine.map((p, k) => (
        <g key={p.id} className="ps-quad-me" onClick={() => onPick(p)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onPick(p); }}>
          <circle cx={X(p.opened)} cy={Y(p.ctr || 0)} r="9" fill={C.you} stroke="#f7badd" strokeWidth="3"><title>{`${p.name}: ${p.opened} product views, ${pct(p.ctr)} click-through rate. Tap for details.`}</title></circle>
          <text x={X(p.opened) > W * 0.62 ? X(p.opened) - 13 : X(p.opened) + 13} y={Y(p.ctr || 0) + (k % 2 ? 22 : -12)} textAnchor={X(p.opened) > W * 0.62 ? 'end' : 'start'} fontSize="12" fontWeight="700" fill="#3e2723">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function Products({ data, b, go }) {
  const [pick, setPick] = useState(null);
  const [scope, setScope] = useState('all');
  const [partnersOnly, setPartnersOnly] = useState(false);
  const seenIds = new Set();
  const all = [];
  for (const c of data.categories) for (const p of c.products || []) {
    if (!b.categories.some((x) => x.id === c.id) || seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    const e = engagementOf(p);
    all.push({ ...p, ...e, you: p.brand === b.brand, category: c.label, ctr: rate(e.buy, e.opened) });
  }
  for (const p of data.catalog || []) {
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    const e = engagementOf(p);
    all.push({ ...p, ...e, you: p.brand === b.brand, outside: true, ctr: rate(e.buy, e.opened) });
  }
  const mine = all.filter((p) => p.you);
  if (!mine.length) return <Empty title="No products in a Phase 1 category yet">Product performance covers products in period care, intimate care, and bladder and pelvic floor.</Empty>;
  const pool = all.filter((p) => (scope === 'all' || !p.outside) && (!partnersOnly || p.partner || p.you));
  const active = pool.filter((p) => p.opened > 0);
  const otherActive = active.filter((p) => !p.you);
  // Benchmarks: average views per product with any views, and the pool's overall click-through rate.
  const xMid = active.length ? Math.round((active.reduce((a, p) => a + p.opened, 0) / active.length) * 10) / 10 : 1;
  const yMid = rate(active.reduce((a, p) => a + p.buy, 0), active.reduce((a, p) => a + p.opened, 0)) || 0;
  const quadOf = (p) => (p.opened > xMid ? ((p.ctr || 0) >= yMid ? 'win' : 'look') : ((p.ctr || 0) >= yMid && p.buy ? 'hidden' : 'low'));
  const tot = mine.reduce((a, p) => ({ seen: a.seen + p.seen, opened: a.opened + p.opened, detail: a.detail + p.detail, buy: a.buy + p.buy }), { seen: 0, opened: 0, detail: 0, buy: 0 });
  const myCtr = rate(tot.buy, tot.opened);
  const catCtr = rate(otherActive.reduce((a, p) => a + p.buy, 0), otherActive.reduce((a, p) => a + p.opened, 0));
  const byBrand = new Map();
  for (const p of pool) { const r = byBrand.get(p.brand) || { brand: p.brand, partner: false, you: p.brand === b.brand, buy: 0, opened: 0, detail: 0, products: 0 }; r.partner = r.partner || p.partner; r.buy += p.buy; r.opened += p.opened; r.detail += p.detail; r.products += 1; byBrand.set(p.brand, r); }
  const brandRows = [...byBrand.values()].sort((x, y) => y.buy - x.buy || y.opened - x.opened);
  const clickRank = brandRows.findIndex((r) => r.brand === b.brand) + 1;
  const clickShare = rate(tot.buy, brandRows.reduce((a, r) => a + r.buy, 0));
  const price = {};
  const facts = {};
  for (const s of b.competitors || []) { price[s.sku] = s.price; facts[s.sku] = s; }
  const page = Object.fromEntries(crProductsOf(b.brand).map((p) => [p.sku, p]));
  const points = pool.map((p) => ({ ...p, label: short(p.name, b.brand) }));
  const rows = mine.map((p) => ({ ...p, label: short(p.name, b.brand), quad: quadOf(p) })).sort((x, y) => y.opened - x.opened);
  const look = rows.filter((p) => p.quad === 'look');
  const best = rows.filter((p) => p.opened).sort((x, y) => (y.ctr || 0) - (x.ctr || 0))[0];
  const findings = [
    tot.opened ? `${tot.opened} people viewed your products and ${tot.buy} clicked to a retailer.` : 'No product views yet. Numbers appear here once shoppers open your listings.',
    myCtr != null && catCtr != null ? `Your click-through rate is ${myCtr}% vs ${catCtr}% for other products${scope === 'all' ? ' on ayna' : ' in your categories'}${partnersOnly ? ' from brand partners' : ''}.` : null,
    look.length ? `${look[0].label} gets many views but few clicks to retailer.` : best ? `${best.label} has your best click-through rate (${pct(best.ctr)}).` : null,
  ];
  const actions = [
    ...(look.length ? [{ text: `Review ${look[0].label}’s price, photos and opening lines`, note: QUAD.look.move }] : []),
    ...rows.filter((p) => p.quad === 'low').slice(0, 1).map((p) => ({ text: `Help shoppers find ${p.label}`, note: QUAD.low.move })),
    ...rows.filter((p) => p.quad === 'hidden').slice(0, 1).map((p) => ({ text: `Get ${p.label} in front of more shoppers`, note: QUAD.hidden.move })),
    { text: 'See which shoppers your products miss', note: 'Why products aren’t recommended explains every miss.' },
  ];
  const sel = pick ? rows.find((r) => r.id === pick.id) || pick : null;
  return (
    <>
      <div className="ps-filters" role="group" aria-label="Filters">
        <div className="ps-toggle" role="group" aria-label="Compare with">
          <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All products on ayna</button>
          <button type="button" aria-pressed={scope === 'cat'} onClick={() => setScope('cat')}>Your categories</button>
        </div>
        <label className="ps-check"><input type="checkbox" checked={partnersOnly} onChange={(e) => setPartnersOnly(e.target.checked)} /> Brand partners only</label>
        <span className="ps-small ps-muted">Real people in the ayna app, {ENG_RANGE}. ayna team and bots excluded. Purchases happen on the brand or retailer site, so this counts clicks out, not sales.</span>
      </div>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="share" label="Clicks to retailer" value={String(tot.buy)} den={tot.buy ? `#${clickRank} of ${brandRows.length} brands, ${pct(clickShare)} of all clicks` : 'none yet'} info="Different people who pressed a buy or retailer button on one of your products, counted once per product. A click is not a purchase." meter={clickShare || 0} /></div>
        <div className="b-2"><Kpi tone="pink" icon="target" label="Product views" value={String(tot.opened)} den="people opened a product" info="Different people who opened the details of one of your products, counted once per product." /></div>
        <div className="b-2"><Kpi tone="deep" icon="doc" label="Full page views" value={String(tot.detail)} den="people read the full page" info="Different people who opened the full product page on the website, counted once per product." /></div>
        <div className="b-2"><Kpi tone="butter" icon="swap" label="Click-through rate" value={pct(myCtr)} den={catCtr != null ? `vs ${catCtr}% for others` : 'of product views'} info="Clicks to retailer divided by product views." /></div>
        <div className="b-2"><Kpi tone="plain" icon="hash" label="Products live" value={String(mine.length)} den={`${mine.filter((p) => p.opened).length} opened at least once`} /></div>
        <Panel className="b-8" id="pp-quad" title="Which products turn views into clicks" info="Each dot is a product with app activity. Right = more product views. Up = higher click-through rate. Dashed lines are the averages: views per product, and the overall click-through rate. Tap one of your dots for its report.">
          <Quadrant points={points.filter((p) => p.opened || p.you)} xMid={xMid} yMid={yMid} onPick={setPick} />
          <p className="ps-small ps-muted"><span className="ps-key-dot is-you" /> Your products <span className="ps-key-dot is-partner" /> Brand partners <span className="ps-key-dot" /> Other brands</p>
        </Panel>
        <div className="b-4 ps-stack-col ps-col12">
          <Insights items={findings} />
          <NextSteps actions={actions} />
        </div>
        <Panel className="b-4" id="pp-fun" title="From product view to retailer click" info="How many different people reached each step for your products.">
          <FunnelBars steps={[
            { label: 'Product views', n: tot.opened },
            { label: 'Full page views', n: tot.detail },
            { label: 'Clicks to retailer', n: tot.buy },
          ]} />
        </Panel>
        <Panel className="b-8" id="pp-tbl" title="Your products" info="Tap a row for the product's full report.">
          <SortTable rows={rows} initial={{ key: 'opened', dir: 'desc' }} columns={[
            { key: 'label', label: 'Product', render: (p) => <button type="button" className="ps-link" onClick={() => setPick(p)}>{p.label}</button> },
            { key: 'opened', label: 'Product views', num: true },
            { key: 'buy', label: 'Clicks to retailer', num: true },
            { key: 'ctr', label: 'Click-through rate', num: true, render: (p) => pct(p.ctr) },
            { key: 'quad', label: 'Where it stands', sortValue: (p) => p.quad, render: (p) => <span className={`ps-qpill is-${p.quad}`}>{QUAD[p.quad].label}</span> },
          ]} />
        </Panel>
        <Panel className="b-12" id="pp-brands" title="Which brands get the most clicks to retailer" info="Every brand in the comparison, ranked by people who clicked to a retailer. Brand partners are tagged. Partnering never changes rankings or recommendations.">
          <SortTable rows={brandRows.map((r, k) => ({ ...r, id: r.brand, rank: k + 1, ctr: rate(r.buy, r.opened) }))} rowClass={(r) => (r.you ? 'is-you' : '')} initial={{ key: 'buy', dir: 'desc' }} limit={10} columns={[
            { key: 'rank', label: '#', num: true },
            { key: 'brand', label: 'Brand', render: (r) => <>{r.brand}{r.you ? ' (you)' : ''}{r.partner && !r.you ? <span className="ps-tag">Brand partner</span> : null}</> },
            { key: 'products', label: 'Products', num: true },
            { key: 'opened', label: 'Product views', num: true },
            { key: 'buy', label: 'Clicks to retailer', num: true },
            { key: 'ctr', label: 'Click-through rate', num: true, render: (r) => pct(r.ctr) },
          ]} />
        </Panel>
      </div>
      {sel ? (
        <Drawer title={sel.label} onClose={() => setPick(null)}>
          <p className="ps-why-verdict">{QUAD[sel.quad].label}: {QUAD[sel.quad].tip}</p>
          <div className="ps-why-kpis">
            <div><span className="ps-num">{sel.opened}</span><small>product views</small></div>
            <div><span className="ps-num">{sel.buy}</span><small>clicks to retailer</small></div>
            <div><span className="ps-num">{pct(sel.ctr)}</span><small>click-through rate{catCtr != null ? `, others ${catCtr}%` : ''}</small></div>
          </div>
          <section>
            <h3 className="ps-why-h">What to do</h3>
            <p className="ps-small">{QUAD[sel.quad].move}</p>
          </section>
          <section>
            <h3 className="ps-why-h">Listing facts</h3>
            <ul className="ps-why-list">
              <li><span>Price on ayna</span><b>{price[sel.id] != null ? money(price[sel.id]) : 'Not on file'}</b></li>
              <li><span>Product facts complete</span><b>{facts[sel.id]?.completeness != null ? `${facts[sel.id].completeness}%` : 'N/A'}</b></li>
              <li><span>Claims on the product page</span><b>{page[sel.id] ? page[sel.id].claims.length : 'Not researched yet'}</b></li>
              <li><span>Facts last verified</span><b>{facts[sel.id]?.lastVerified || 'Never'}</b></li>
            </ul>
          </section>
          <div className="ps-ab-row">
            <button type="button" className="ps-btn ps-btn--sm ps-btn--ink" onClick={() => { setPick(null); go?.('losses'); }}>Why it isn’t recommended</button>
            <button type="button" className="ps-btn ps-btn--sm" onClick={() => { setPick(null); go?.('competitors'); }}>Compare with similar products</button>
          </div>
          <p className="ps-small ps-muted">Real people in the ayna app, {ENG_RANGE}. Small numbers: read them as direction, not proof.</p>
        </Drawer>
      ) : null}
      <Method updated={ENG_RANGE} scope={`${pool.length} products compared`} items={[
        `Source: ayna app activity in PostHog, ${ENG_RANGE}. Each number counts different people, once per product. ayna team accounts and bots are excluded.`,
        'Product views = opened a product’s details. Full page views = opened the full product page on the website. Clicks to retailer = pressed a buy or retailer button. Click-through rate = clicks to retailer / product views.',
        'Product appearances are recorded only on the Explore page and only since Oct 28, so they are not used as a denominator yet.',
        'Clicks to retailer are not purchases. ayna does not yet receive confirmed sales from retailers or affiliate networks.',
        'Chart lines: average product views per product with any views, and the overall click-through rate of the products compared. Numbers are small, so one person can move a rate a lot.',
      ]} />
    </>
  );
}

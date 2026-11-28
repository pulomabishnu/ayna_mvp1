/* Monthly brand brief: one printable page that pulls the headline numbers from
   every section. Real activity and the simulation stay in separate blocks. */
import React, { useState } from 'react';
import { Empty } from './ui.jsx';
import { ENG_RANGE } from './engine/engagement.js';
import { pct } from './engine/market.js';
import { buildBrief, briefText, briefCsv, short } from './engine/brief.js';

export function Brief({ data, b, actionState }) {
  const [copied, setCopied] = useState(false);
  const x = buildBrief(data, b, actionState);
  if (!x.s.products.length) return <Empty title={`${x.name} has no products listed on ayna yet`}>The brief fills in once products are listed.</Empty>;
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const download = () => {
    const blob = new Blob([briefCsv(x)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ayna-brief-${String(x.brand).toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(briefText(x)); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); }
  };
  return (
    <>
      <div className="ps-brief-bar">
        <button type="button" className="ps-btn ps-btn--ink" onClick={() => window.print()}>Print or save as PDF</button>
        <button type="button" className="ps-btn" onClick={download}>Download CSV</button>
        <button type="button" className="ps-btn" onClick={copy}>{copied ? 'Copied' : 'Copy as text'}</button>
      </div>
      <article className="ps-brief" aria-label={`${x.name} brief`}>
        <header className="ps-brief-head">
          <div><span className="ps-small">ayna Partner Studio</span><h2>{x.name} brief</h2><span className="ps-small ps-muted">Activity {ENG_RANGE} · prepared {today}</span></div>
        </header>
        <section className="ps-brief-sec">
          <h3>Real activity in the ayna app</h3>
          <div className="ps-brief-nums">
            <div><b>{x.s.tot.opened}</b><span>product card opens</span></div>
            <div><b>{x.s.tot.buy}</b><span>clicks to retailer</span></div>
            <div><b>{x.s.tot.detail}</b><span>full product page views (website)</span></div>
            <div><b>{x.s.tot.seen}</b><span>card appearances (Explore only)</span></div>
          </div>
          <p>{x.top ? `${short(x.top.name, x.name)} was opened most (${x.top.opened}).` : 'No product opens yet.'} {x.bestCat && x.bestCat.myOpened ? `You have ${pct(x.bestCat.myShare)} of card opens in ${x.bestCat.label.toLowerCase()}.` : ''} Clicks to retailer are not purchases.</p>
        </section>
        <section className="ps-brief-sec">
          <h3>How shoppers found you</h3>
          <p>On the website, {x.d.me.search} {x.d.me.search === 1 ? 'person' : 'people'} found your products through search, {x.d.me.browse} by browsing and {x.d.me.other} elsewhere. {x.d.peers.searchShare != null && x.d.me.total >= 10 ? `Other brands in your categories get ${pct(x.d.peers.searchShare)} of opens from search.` : ''}</p>
        </section>
        <section className="ps-brief-sec">
          <h3>Product readiness</h3>
          <p>{x.r.score != null ? `Average readiness ${x.r.score}%.` : 'Not checked yet.'} {x.r.gaps.length ? `To fix: ${x.r.gaps.slice(0, 3).map((g) => `${g.label.toLowerCase()} (${g.products.length})`).join(', ')}.` : 'No open gaps.'}</p>
        </section>
        <section className="ps-brief-sec ps-brief-sim">
          <h3>Product match simulation <span className="ps-sim-label">Simulation only</span></h3>
          {x.recs.length ? <ul>{x.recs.map((rc) => <li key={rc.id}>{rc.label}: {rc.mine} selections, {rc.share ?? 0}% of filled spots across {rc.shoppers} simulated scenarios.</li>)}</ul> : <p>Your products aren’t in the simulation yet.</p>}
          <p className="ps-small ps-muted">Synthetic shopping scenarios run through ayna’s matching engine. Not actual customer activity, sales or clinical suitability.</p>
        </section>
        <section className="ps-brief-sec">
          <h3>Recommended actions</h3>
          {x.actions.length ? <ol>{x.actions.map((a) => <li key={a.id}><b>{a.title}</b><span className="ps-small"> {a.action}</span></li>)}</ol> : <p>Nothing open.</p>}
        </section>
        <footer className="ps-small ps-muted">Counts are different people per product, ayna team accounts and bots excluded. Small numbers: read them as direction, not proof. Partner status never changes rankings or recommendations.</footer>
      </article>
    </>
  );
}

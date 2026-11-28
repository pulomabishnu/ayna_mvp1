/* Bento tiles shared by the module pages: one job per tile. */
import React, { useState } from 'react';
import { InfoTip } from './ui.jsx';
import { C } from './chartColors.js';
import { ENG_STAGES, ENG_RANGE, brandEngagement, productEngagement } from './engine/engagement.js';

/** Plain-language read of the page. */
export function Insights({ items, title = 'What this means', className = '' }) {
  return (
    <section className={`ps-card ps-tile ps-tile--pink ${className}`} aria-label={title}>
      <h2 className="ps-tile-title">{title}</h2>
      <ul className="ps-insights">
        {items.filter(Boolean).slice(0, 3).map((t) => <li key={t}>{t}</li>)}
      </ul>
    </section>
  );
}

/** Numbered next steps, most useful first. */
export function NextSteps({ actions, title = 'Do this next', className = '' }) {
  return (
    <section className={`ps-card ps-tile ${className}`} aria-label={title}>
      <h2 className="ps-tile-title">{title}</h2>
      <ol className="ps-steps">
        {actions.slice(0, 3).map((a, k) => (
          <li key={a.text}>
            <span className="ps-steps-n">{k + 1}</span>
            <span className="ps-steps-t"><b>{a.text}</b>{a.note ? <InfoTip text={a.note} label={a.text} /> : null}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * Real ayna app activity for this brand's products vs the rest of the category.
 * products: the category's product list [{ id, name, brand, you, partner }].
 */
export function RealInterest({ products, name, className = '' }) {
  const [mode, setMode] = useState('products');
  const brands = brandEngagement(products);
  const me = brands.find((r) => r.you);
  const rows = productEngagement(products);
  const mine = rows.filter((r) => r.you);
  const active = rows.filter((r) => !r.you && r.opened + r.seen + r.detail + r.buy > 0);
  const avg = Object.fromEntries(ENG_STAGES.map((s) => [s.key, active.length ? Math.round((active.reduce((a, r) => a + r[s.key], 0) / active.length) * 10) / 10 : 0]));
  const hi = Math.max(1, ...mine.flatMap((r) => ENG_STAGES.map((s) => r[s.key])), ...ENG_STAGES.map((s) => avg[s.key]));
  const top = brands.filter((r) => r.opened > 0).slice(0, 6);
  const list = me && !top.includes(me) ? [...top.slice(0, 5), me] : top;
  const topHi = Math.max(1, ...list.map((r) => r.opened));
  const info = `Real people using the ayna app, ${ENG_RANGE}. Each number counts different people, once per product. ayna team accounts and bots are excluded. Numbers are small, so read them as direction, not a trend.`;
  return (
    <section className={`ps-card ps-tile ${className}`} aria-label="Real shopper activity">
      <div className="ps-tile-head">
        <h2 className="ps-tile-title">Real shopper activity <span className="ps-live">ayna app</span><InfoTip text={info} label="Real shopper activity" /></h2>
        <div className="ps-seg ps-seg--sm" role="tablist" aria-label="Real activity view">
          <button type="button" role="tab" aria-selected={mode === 'products'} className="ps-seg-btn" onClick={() => setMode('products')}>Your products</button>
          <button type="button" role="tab" aria-selected={mode === 'brands'} className="ps-seg-btn" onClick={() => setMode('brands')}>Brands</button>
        </div>
      </div>
      {mode === 'products' ? (
        mine.length ? (
          <div className="ps-ri">
            <div className="ps-ri-legend">{ENG_STAGES.map((s, k) => <span key={s.key}><i style={{ background: STAGE_COLORS[k] }} />{s.short}</span>)}</div>
            {[...mine, { id: '__avg', name: `Average ${products.length > 1 ? 'other product' : 'product'} with activity`, avg: true, ...avg }].map((r) => (
              <div key={r.id} className={`ps-ri-row${r.avg ? ' is-avg' : ''}`}>
                <span className="ps-ri-name">{r.avg ? r.name : shortName(r.name, name)}</span>
                <span className="ps-ri-bars">
                  {ENG_STAGES.map((s, k) => (
                    <span key={s.key} className="ps-ri-bar" title={`${s.label}: ${r[s.key]}`}>
                      <span style={{ width: `${(r[s.key] / hi) * 100}%`, background: r.avg ? 'transparent' : STAGE_COLORS[k], borderColor: STAGE_COLORS[k] }} />
                      <b>{r[s.key]}</b>
                    </span>
                  ))}
                </span>
              </div>
            ))}
            <p className="ps-ri-take">Your {mine.length} product{mine.length === 1 ? '' : 's'} drew <b>{mine.reduce((x, r) => x + r.opened, 0)}</b> card opens and <b>{mine.reduce((x, r) => x + r.buy, 0)}</b> buy clicks. The average other product with any activity drew {avg.opened} opens and {avg.buy} buy clicks.</p>
          </div>
        ) : <p className="ps-small">None of your products are in this category.</p>
      ) : (
        <div className="ps-bars ps-bars--compact">
          {list.map((r) => (
            <div key={r.brand} className={`ps-bars-row${r.you ? ' is-you' : ''}`}>
              <span className="ps-bars-label"><b>{r.rank}. {r.brand}{r.you ? ' (you)' : ''}</b><small>{r.buy} buy click{r.buy === 1 ? '' : 's'}</small></span>
              <span className="ps-bars-track"><span className="ps-bars-fill" style={{ width: `${(r.opened / topHi) * 100}%`, background: r.you ? C.you : C.rival }} /></span>
              <span className="ps-bars-val">{r.opened}</span>
            </div>
          ))}
          <p className="ps-small ps-muted">People who opened a product card, by brand. {brands.filter((r) => r.opened > 0).length} of {brands.length} brands had any opens.</p>
        </div>
      )}
    </section>
  );
}

const STAGE_COLORS = ['#c9dcea', '#769ebe', '#4d7699', '#3e2723'];
const shortName = (n, brand) => (n.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? n.slice(String(brand).length + 1) : n);

import React from 'react';
import RoutineTimeline from '../routine/RoutineTimeline.jsx';
import { shownMatchPercent } from '../../utils/matchDisplay.js';
import { productHref, isPlainLeftClick } from '../../utils/productRoute';
import './web-eco-views.css';

/* The website's ecosystem, one list at a time (founder, Oct 28: "separate my products,
 * ayna's recommendations and the ones I saved ... easy to navigate ... it shouldn't be
 * you scroll down so much to find stuff"). The same four views as the app:
 *   Mine        her products, one compact card per area of care (names, not photos)
 *   ayna picks  matches she doesn't have yet, by need, with Add
 *   Saved       hearted products, with Add
 *   Routine     the day timeline; full routines fold away below it
 */

export const WEB_ECO_VIEWS = [
  ['mine', 'Mine'],
  ['picks', 'ayna picks'],
  ['saved', 'Saved'],
  ['routine', 'Routine'],
];

export function WebEcoTabs({ view, onView, counts = {} }) {
  return (
    <div className="weco-tabs" role="tablist" aria-label="Ecosystem lists">
      {WEB_ECO_VIEWS.map(([id, label]) => (
        <button key={id} type="button" role="tab" id={`weco-tab-${id}`} aria-selected={view === id} aria-controls="weco-panel" className={view === id ? 'is-on' : ''} onClick={() => onView(id)}>
          {label}{counts[id] > 0 && <small>{counts[id]}</small>}
        </button>
      ))}
    </div>
  );
}

const priceOf = (p) => { const m = String(p?.price || '').match(/^\$\s?\d[\d.,]*(?:\s?[–-]\s?\$?\d[\d.,]*)?/); return m ? m[0].replace(/\s/g, '') : null; };

function Row({ product, pct, onOpen, actionLabel, onAction, done = false }) {
  return (
    <li className="weco-row">
      <a className="weco-row__main" href={productHref(product)} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onOpen?.(product); }}>
        <span className="weco-row__name">{product.name}</span>
        <small className="weco-row__meta">{[product.brand, priceOf(product)].filter(Boolean).join(' · ')}</small>
      </a>
      {pct != null && <span className="weco-row__pct" aria-label={`${pct}% match`}>{pct}%</span>}
      {onAction && <button type="button" className={`weco-row__act${done ? ' is-done' : ''}`} onClick={() => onAction(product)} disabled={done}>{done ? 'Added' : actionLabel}</button>}
    </li>
  );
}

/** Mine: one card per area, product names as rows, so 50 products fit on about one screen. */
export function WebEcoMine({ groups = [], onOpenProduct, onAddMore, onAddSomething }) {
  if (!groups.length) return null;
  return (
    <div className="weco-grid">
      {groups.map((g) => (
        <section key={g.key} className="weco-card" aria-labelledby={`weco-area-${g.key}`}>
          <header className="weco-card__head">
            <h3 id={`weco-area-${g.key}`}>{g.label}</h3>
            <span className="weco-card__n" aria-label={`${g.products.length} products`}>{g.products.length}</span>
          </header>
          <ul className="weco-rows">
            {g.products.slice(0, 5).map((p) => <Row key={p.id} product={p} onOpen={onOpenProduct} />)}
          </ul>
          {g.products.length > 5 && (
            <details className="weco-card__more">
              <summary>{g.products.length - 5} more</summary>
              <ul className="weco-rows">{g.products.slice(5).map((p) => <Row key={p.id} product={p} onOpen={onOpenProduct} />)}</ul>
            </details>
          )}
          {onAddMore && <button type="button" className="weco-card__add" onClick={() => onAddMore(g)}>+ Find more for {g.label.toLowerCase()}</button>}
        </section>
      ))}
      {onAddSomething && <button type="button" className="weco-card weco-card--add" onClick={onAddSomething}><span aria-hidden="true">+</span>Add something you already use</button>}
    </div>
  );
}

/** ayna picks: grouped by need, best match first, only what she doesn't have. */
export function WebEcoPicks({ needs = [], pctFor, onOpenProduct, onAdd, isOwned, onExplore }) {
  const shown = needs.map((n) => ({ ...n, picks: n.picks.filter((p) => !isOwned(p.id)) })).filter((n) => n.picks.length);
  if (!shown.length) return <p className="weco-empty">No new picks right now. {onExplore && <button type="button" onClick={onExplore}>Explore products</button>}</p>;
  return (
    <div className="weco-grid">
      {shown.map((n) => (
        <section key={n.id} className="weco-card" aria-labelledby={`weco-need-${n.id}`}>
          <header className="weco-card__head"><h3 id={`weco-need-${n.id}`}>For {n.short.toLowerCase()}</h3><span className="weco-card__n">{n.picks.length}</span></header>
          <ul className="weco-rows">{n.picks.slice(0, 5).map((p) => <Row key={p.id} product={p} pct={pctFor(p)} onOpen={onOpenProduct} actionLabel="Add" onAction={onAdd} />)}</ul>
        </section>
      ))}
    </div>
  );
}

export function WebEcoSaved({ saved = [], pctFor, onOpenProduct, onAdd, isOwned }) {
  if (!saved.length) return <p className="weco-empty">Tap the heart on any product to save it here.</p>;
  return (
    <section className="weco-card weco-card--wide" aria-label="Saved products">
      <ul className="weco-rows weco-rows--cols">{saved.map((p) => <Row key={p.id} product={p} pct={pctFor(p)} onOpen={onOpenProduct} actionLabel="Add" onAction={onAdd} done={isOwned(p.id)} />)}</ul>
    </section>
  );
}

export function WebEcoRoutine({ source, onOpenProduct, onCheckIn, children }) {
  return (
    <div className="weco-routine">
      <div className="weco-routine__day"><RoutineTimeline compact {...source} max={3} ecoMax={6} onOpenProduct={onOpenProduct} onCheckIn={onCheckIn} /></div>
      {children && <details className="weco-fold"><summary>Full routines and other options</summary>{children}</details>}
    </div>
  );
}

export function makePctFor(quizResults, scoreFor) {
  return (p) => {
    if (!quizResults) return null;
    const d = scoreFor(p);
    return d?.percent > 0 && (d.matchStatus || 'scored') === 'scored' ? shownMatchPercent(d.percent) : null;
  };
}

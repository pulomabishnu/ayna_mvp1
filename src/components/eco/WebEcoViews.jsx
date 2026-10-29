import React, { useState } from 'react';
import RoutineTimeline from '../routine/RoutineTimeline.jsx';
import { shownMatchPercent } from '../../utils/matchDisplay.js';
import { productHref, isPlainLeftClick } from '../../utils/productRoute';
import './web-eco-views.css';

/* The website's ecosystem, one list at a time, in the app's own language
 * (founder, Oct 28: "we had the app designed so nice"). Same four views as the
 * app: Mine, ayna picks, Saved, Routine.
 *
 * Borrowed from the app's Ecosystem screen, on purpose:
 *   - the shelf head: a pink folder tab sitting on a 1.5px espresso rule, a
 *     count, and "Add" as a text link on the right;
 *   - products as plain rows under the rule (name, then brand and price), with
 *     the dark match pill. No box around each shelf: the rule and the spacing
 *     do the grouping (master prompt 8 and 22: proximity before containers,
 *     no cards around everything).
 * The website only changes the layout: shelves sit in two columns so 50
 * products read in about one screen. */

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
const Chev = () => <svg className="weco-row__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;

function Row({ product, pct, onOpen, actionLabel, onAction, done = false }) {
  const meta = [product.brand, priceOf(product)].filter(Boolean).join(' · ');
  return (
    <li className="weco-row">
      <a className="weco-row__main" href={productHref(product)} onClick={(e) => { if (!isPlainLeftClick(e)) return; e.preventDefault(); onOpen?.(product); }}>
        <span className="weco-row__name">{product.name}</span>
        {meta && <small className="weco-row__meta">{meta}</small>}
      </a>
      {pct != null && <span className="weco-row__pct">{pct}% match</span>}
      {onAction
        ? <button type="button" className={`weco-row__act${done ? ' is-done' : ''}`} onClick={() => onAction(product)} disabled={done}>{done ? 'Added' : actionLabel}</button>
        : <Chev />}
    </li>
  );
}

/** One shelf: folder tab on the rule, then rows. Five show; the rest open in place. */
function Shelf({ id, label, count, onAdd, addLabel = 'Add', children, extra = null }) {
  return (
    <section className="weco-shelf" aria-labelledby={id}>
      <header className="weco-shelf__head">
        <h3 id={id}>{label}</h3>
        {count != null && <span className="weco-shelf__n" aria-label={`${count} products`}>{count}</span>}
        {onAdd && <button type="button" className="weco-shelf__add" onClick={onAdd}>{addLabel}<span className="weco-sr"> to {label}</span></button>}
      </header>
      {children}
      {extra}
    </section>
  );
}

function Rows({ items, render, first = 5, label }) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, first);
  return (
    <>
      <ul className="weco-rows">{shown.map(render)}</ul>
      {items.length > first && (
        <button type="button" className="weco-more" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Show less' : `Show all ${items.length}`}<span className="weco-sr"> in {label}</span>
        </button>
      )}
    </>
  );
}

/** Mine: one shelf per area of care, product names as rows. */
export function WebEcoMine({ groups = [], onOpenProduct, onAddMore }) {
  if (!groups.length) return null;
  return (
    <div className="weco-shelves">
      {groups.map((g) => (
        <Shelf key={g.key} id={`weco-area-${g.key}`} label={g.label} count={g.products.length} onAdd={onAddMore ? () => onAddMore(g) : null}>
          <Rows items={g.products} label={g.label} render={(p) => <Row key={p.id} product={p} onOpen={onOpenProduct} />} />
        </Shelf>
      ))}
    </div>
  );
}

/** ayna picks: by need, best match first, only what she doesn't have. */
export function WebEcoPicks({ needs = [], pctFor, onOpenProduct, onAdd, isOwned, onExplore }) {
  const shown = needs.map((n) => ({ ...n, picks: n.picks.filter((p) => !isOwned(p.id)) })).filter((n) => n.picks.length);
  if (!shown.length) return <p className="weco-empty">No new picks right now. {onExplore && <button type="button" onClick={onExplore}>Explore products</button>}</p>;
  return (
    <div className="weco-shelves">
      {shown.map((n) => (
        <Shelf key={n.id} id={`weco-need-${n.id}`} label={n.short} count={n.picks.length}>
          <Rows items={n.picks} label={n.short} render={(p) => <Row key={p.id} product={p} pct={pctFor(p)} onOpen={onOpenProduct} actionLabel="Add" onAction={onAdd} />} />
        </Shelf>
      ))}
    </div>
  );
}

export function WebEcoSaved({ saved = [], pctFor, onOpenProduct, onAdd, isOwned }) {
  if (!saved.length) return <p className="weco-empty">Tap the heart on any product to save it here.</p>;
  return (
    <div className="weco-shelves is-one">
      <Shelf id="weco-saved" label="Saved" count={saved.length}>
        <ul className="weco-rows weco-rows--cols">{saved.map((p) => <Row key={p.id} product={p} pct={pctFor(p)} onOpen={onOpenProduct} actionLabel="Add" onAction={onAdd} done={isOwned(p.id)} />)}</ul>
      </Shelf>
    </div>
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

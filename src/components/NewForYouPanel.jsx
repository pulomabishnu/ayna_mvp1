import React from 'react';
import '../styles/redo-quiz.css';

/**
 * "New for you" on the Ecosystem page.
 *  kind="added":     after "Keep my products and add new ones". These were
 *                    added; nothing else changed.
 *  kind="suggested": after she connects health data. Offered only; she adds
 *                    each one (or all) herself.
 */
export default function NewForYouPanel({ kind, products = [], sources = [], myProducts = {}, onAdd, onAddAll, onOpenProduct, onDismiss }) {
  if (!products.length) return null;
  const suggested = kind === 'suggested';
  const left = suggested ? products.filter((p) => !myProducts[p.id]) : products;
  const n = products.length;
  const title = suggested ? 'New products recommended for you' : `${n} new product${n === 1 ? '' : 's'} added`;
  const from = sources.length ? sources.join(' and ') : 'your health data';
  const intro = suggested
    ? `Based on ${from} you just connected. Nothing was added yet; pick what you want.`
    : 'From your new answers. Everything you already had stayed.';

  return (
    <section className="nfy" aria-labelledby="nfy-title">
      <div className="nfy-head">
        <div>
          <span className="nfy-tag">New for you</span>
          <h2 id="nfy-title">{title}</h2>
          <p>{intro}</p>
        </div>
        <div className="nfy-headactions">
          {suggested && left.length > 1 && <button type="button" className="nfy-btn is-ink" onClick={() => onAddAll?.(left)}>Add all {left.length}</button>}
          <button type="button" className="nfy-btn" onClick={onDismiss}>{suggested && left.length ? 'Not now' : 'Got it'}</button>
        </div>
      </div>
      <ul className="nfy-list">
        {products.map((p) => {
          const added = Boolean(myProducts[p.id]);
          return (
            <li key={p.id}>
              <button type="button" className="nfy-name" onClick={() => onOpenProduct?.(p)}>
                {p.brand && <small>{p.brand}</small>}
                <span>{p.name}</span>
              </button>
              {suggested && (added
                ? <span className="nfy-done" aria-live="polite">Added</span>
                : <button type="button" className="nfy-btn is-ink" onClick={() => onAdd?.(p)} aria-label={`Add ${p.name} to your Ecosystem`}>Add to Ecosystem</button>)}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

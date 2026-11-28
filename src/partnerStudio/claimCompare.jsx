/* You vs one competitor, topic by topic: one dot per claim, colored by what the page cites.
   Tap a topic to read the exact wording. */
import React, { useState } from 'react';
import { inkOn } from './chartColors.js';

const RANK = ['product_study', 'ingredient_study', 'unnamed_study', 'none'];
const byStrength = (a, b) => RANK.indexOf(a.backing) - RANK.indexOf(b.backing);

function Dots({ claims, backing, colors }) {
  if (!claims.length) return <span className="ps-cc-none">None</span>;
  return (
    <span className="ps-cc-dots">
      {[...claims].sort(byStrength).map((c) => <i key={c.text} style={{ background: colors[c.backing] }} title={`${backing[c.backing].short}: “${c.text}”`} />)}
    </span>
  );
}

function Quotes({ claims, backing, colors, who }) {
  if (!claims.length) return <p className="ps-cc-empty">{who} make no claim on this.</p>;
  return (
    <ul className="ps-cc-list">
      {[...claims].sort(byStrength).map((c) => (
        <li key={c.text}>
          <span className="ps-cc-chip" style={{ background: colors[c.backing], color: inkOn(colors[c.backing]) }}>{backing[c.backing].short}</span>
          <q>{c.text}</q>
          {c.source ? <a className="ps-cc-src" href={c.source.url} target="_blank" rel="noreferrer">{c.source.label}</a> : null}
        </li>
      ))}
    </ul>
  );
}

/**
 * you: the brand's product; rivals: researched products in the same category.
 * topics: { key: label }; backing: { key: { label, short } }; colors: { key: color }.
 */
export function ClaimCompare({ you, rivals, topics, backing, colors }) {
  const strongest = [...rivals].sort((a, b) => b.claims.filter((c) => c.backing === 'product_study').length - a.claims.filter((c) => c.backing === 'product_study').length || b.claims.length - a.claims.length)[0];
  const [pick, setPick] = useState(strongest?.sku || '');
  const [open, setOpen] = useState('');
  const rival = rivals.find((r) => r.sku === pick) || strongest;
  if (!rival) return <p className="ps-small">No competitor in this category has been researched yet.</p>;
  const of = (p, t) => p.claims.filter((c) => c.topic === t);
  const total = (t) => of(you, t).length + of(rival, t).length;
  const shown = Object.keys(topics).filter((t) => total(t)).sort((a, b) => total(b) - total(a));
  return (
    <div className="ps-cc">
      {rivals.length > 1 ? (
        <div className="ps-chips" role="group" aria-label="Pick a competitor">
          {rivals.map((r) => <button key={r.sku} type="button" className="ps-chip-btn" aria-pressed={r.sku === rival.sku} onClick={() => setPick(r.sku)}>{r.name}</button>)}
        </div>
      ) : null}
      <div className="ps-cc-row ps-cc-head" aria-hidden="true">
        <span />
        <span>You</span>
        <span>{rival.brand}</span>
        <span />
      </div>
      {shown.map((t) => {
        const isOpen = open === t;
        return (
          <div key={t} className={`ps-cc-item${of(you, t).length ? '' : ' is-gap'}`}>
            <button type="button" className="ps-cc-row" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? '' : t)}>
              <span className="ps-cc-topic">{topics[t]}</span>
              <Dots claims={of(you, t)} backing={backing} colors={colors} />
              <Dots claims={of(rival, t)} backing={backing} colors={colors} />
              <span className="ps-cc-chev" aria-hidden="true">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen ? (
              <div className="ps-cc-detail">
                <Quotes claims={of(you, t)} backing={backing} colors={colors} who="You" />
                <Quotes claims={of(rival, t)} backing={backing} colors={colors} who="They" />
              </div>
            ) : null}
          </div>
        );
      })}
      <ul className="ps-legend2">
        {RANK.map((k) => <li key={k}><i style={{ background: colors[k] }} />{backing[k].short}</li>)}
      </ul>
    </div>
  );
}

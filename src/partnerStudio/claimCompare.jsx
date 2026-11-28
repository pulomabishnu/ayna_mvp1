/* Your exact claims next to one competitor's, topic by topic, with what each page cites. */
import React, { useState } from 'react';

const RANK = ['product_study', 'ingredient_study', 'unnamed_study', 'none'];
const byStrength = (a, b) => RANK.indexOf(a.backing) - RANK.indexOf(b.backing);

function ClaimList({ claims, backing, colors, empty }) {
  if (!claims.length) return <p className="ps-cc-empty">{empty}</p>;
  return (
    <ul className="ps-cc-list">
      {[...claims].sort(byStrength).map((c) => (
        <li key={c.text}>
          <span className="ps-cc-chip" style={{ background: colors[c.backing] }}>{backing[c.backing].short}</span>
          <q>{c.text}</q>
          {c.source ? <a className="ps-cc-src" href={c.source.url} target="_blank" rel="noreferrer">{c.source.label}</a> : null}
          {c.where || c.note ? <small>{[c.where, c.note].filter(Boolean).join('. ')}</small> : null}
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
  const rival = rivals.find((r) => r.sku === pick) || strongest;
  if (!rival) return <p className="ps-small">No competitor in this category has been researched yet.</p>;
  const count = (p, t) => p.claims.filter((c) => c.topic === t).length;
  const mine = Object.keys(topics).filter((t) => count(you, t)).sort((a, b) => count(you, b) - count(you, a));
  const theirsOnly = Object.keys(topics).filter((t) => !count(you, t) && count(rival, t));
  return (
    <div className="ps-cc">
      <div className="ps-cc-row ps-cc-head">
        <span />
        <span><b>{you.name}</b> <em>(you)</em></span>
        <span>
          {rivals.length > 1 ? (
            <select className="ps-select ps-select--sm" aria-label="Competitor" value={rival.sku} onChange={(e) => setPick(e.target.value)}>
              {rivals.map((r) => <option key={r.sku} value={r.sku}>{r.name}</option>)}
            </select>
          ) : <b>{rival.name}</b>}
        </span>
      </div>
      {[...mine, ...theirsOnly].map((t) => (
        <div key={t} className={`ps-cc-row${theirsOnly.includes(t) ? ' is-gap' : ''}`}>
          <span className="ps-cc-topic">{topics[t]}{theirsOnly.includes(t) ? <small>Only they claim this</small> : null}</span>
          <ClaimList claims={you.claims.filter((c) => c.topic === t)} backing={backing} colors={colors} empty="You make no claim on this." />
          <ClaimList claims={rival.claims.filter((c) => c.topic === t)} backing={backing} colors={colors} empty="They make no claim on this." />
        </div>
      ))}
      <ul className="ps-legend2">
        {RANK.map((k) => <li key={k}><i style={{ background: colors[k] }} />{backing[k].label}</li>)}
      </ul>
    </div>
  );
}

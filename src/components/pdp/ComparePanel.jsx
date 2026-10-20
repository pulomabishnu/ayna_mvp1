import React, { useMemo, useRef, useState } from 'react';
import { useEdgeFade } from './useEdgeFade';
import { ALL_PRODUCTS } from '../../data/products';
import { compareRows } from './commerce';
import { NOT_ON_FILE } from './glance';
import './pdp.css';

/**
 * "Compare with similar": this product beside 2-3 close alternatives from the
 * catalog, real fields only. Scrolls sideways on phones.
 */
export default function ComparePanel({ product, others = [], onOpen, matchFor = null, renderThumb = null }) {
  // Starts with the closest alternatives; she can swap in anything from the catalog.
  const [picked, setPicked] = useState(() => others.slice(0, 2).map((p) => p.id));
  const [q, setQ] = useState('');
  const byId = useMemo(() => new Map(ALL_PRODUCTS.map((p) => [p.id, p])), []);
  const chosen = picked.map((id) => byId.get(id) || others.find((o) => o.id === id)).filter(Boolean);
  const cols = [product, ...chosen].filter(Boolean);
  const rows = compareRows(cols, { matchFor });
  const term = q.trim().toLowerCase();
  const results = term.length < 2 ? [] : ALL_PRODUCTS.filter((p) => p.id !== product.id && !picked.includes(p.id) && `${p.brand || ''} ${p.name}`.toLowerCase().includes(term)).slice(0, 6);
  const suggestions = others.filter((o) => !picked.includes(o.id)).slice(0, 5);
  const add = (p) => { setPicked((cur) => [...cur.filter((id) => id !== p.id), p.id].slice(-3)); setQ(''); };
  const remove = (id) => setPicked((cur) => cur.filter((x) => x !== id));
  const scrollRef = useRef(null);
  useEdgeFade(scrollRef, [picked.join(','), product?.id]);
  if (!product) return null;
  return (
    <section className="ay-compare" id="ay-sec-compare" tabIndex={-1} aria-labelledby="ay-compare-h">
      <div className="ay-pdp-sechead">
        <h2 id="ay-compare-h">Compare with similar</h2>
      </div>
      <div className="ay-compare__pick">
        <label className="ay-compare__search">
          <span className="sr-only">Search a product to compare</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a product to compare" />
        </label>
        {results.length > 0 && (
          <ul className="ay-compare__results">{results.map((p) => <li key={p.id}><button type="button" onClick={() => add(p)}>{p.brand ? `${p.brand} · ` : ''}{p.name}</button></li>)}</ul>
        )}
        {suggestions.length > 0 && (
          <div className="ay-compare__sugg"><span>Related:</span>{suggestions.map((p) => <button key={p.id} type="button" onClick={() => add(p)}>+ {p.name}</button>)}</div>
        )}
      </div>
      {cols.length < 2 || !rows.length ? <p className="ay-compare__empty">Pick a product above to compare.</p> : <div className="ay-compare__frame"><div className="ay-compare__scroll" ref={scrollRef} role="region" aria-labelledby="ay-compare-h" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <td />
              {cols.map((p, i) => (
                <th key={p.id} scope="col" className={i === 0 ? 'is-this' : undefined}>
                  {renderThumb && <span className="ay-compare__thumb">{renderThumb(p)}</span>}
                  {i === 0
                    ? <span className="ay-compare__name">{p.name}<small>This product</small></span>
                    : <span className="ay-compare__name"><button type="button" onClick={() => onOpen && onOpen(p)}>{p.name}</button><button type="button" className="ay-compare__x" onClick={() => remove(p.id)} aria-label={`Remove ${p.name} from comparison`}>Remove</button></span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.values.map((v, i) => {
                  // Evidence on file: one dot per source counted (the number is in the text too).
                  const n = /^evidence/i.test(r.label) ? Number((String(v).match(/^(\d+)\s/) || [])[1]) : 0;
                  return <td key={cols[i].id} className={`${i === 0 ? 'is-this' : ''}${v === NOT_ON_FILE ? ' is-unknown' : ''}`.trim() || undefined}>
                    {n > 0 && <span className="ay-compare__dots" aria-hidden="true">{Array.from({ length: Math.min(n, 10) }, (_, k) => <i key={k} />)}{n > 10 ? <small>+</small> : null}</span>}
                    {v}
                  </td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>}
    </section>
  );
}

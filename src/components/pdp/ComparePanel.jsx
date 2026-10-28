import React, { useMemo, useState } from 'react';
import { ALL_PRODUCTS } from '../../data/products';
import CompareTable from '../compare/CompareTable.jsx';
import './pdp.css';

/**
 * "Compare with similar": this product beside 2-3 close alternatives from the
 * catalog, real fields only. Scrolls sideways on phones.
 */
export default function ComparePanel({ product, others = [], onOpen, matchFor = null, detailsFor = null }) {
  // Starts with the closest alternatives; she can swap in anything from the catalog.
  const [picked, setPicked] = useState(() => others.slice(0, 2).map((p) => p.id));
  const [q, setQ] = useState('');
  const byId = useMemo(() => new Map(ALL_PRODUCTS.map((p) => [p.id, p])), []);
  const chosen = picked.map((id) => byId.get(id) || others.find((o) => o.id === id)).filter(Boolean);
  const cols = [product, ...chosen].filter(Boolean);
  const term = q.trim().toLowerCase();
  const results = term.length < 2 ? [] : ALL_PRODUCTS.filter((p) => p.id !== product.id && !picked.includes(p.id) && `${p.brand || ''} ${p.name}`.toLowerCase().includes(term)).slice(0, 6);
  const suggestions = others.filter((o) => !picked.includes(o.id)).slice(0, 5);
  const add = (p) => { setPicked((cur) => [...cur.filter((id) => id !== p.id), p.id].slice(-3)); setQ(''); };
  const remove = (id) => setPicked((cur) => cur.filter((x) => x !== id));
  if (!product) return null;
  return (
    <section className="ay-compare" id="ay-sec-compare" tabIndex={-1} aria-labelledby="ay-compare-h">
      <div className="ay-pdp-sechead">
        <h2 id="ay-compare-h">Similar fit for you</h2>
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
      {cols.length < 2 ? <p className="ay-compare__empty">Pick a product above to compare.</p> : (
        // The same compare layout as the Compare page (critique Oct 27): photo and name on top, short rows,
        // objective rows marked, prose behind a tap. Shown in a sheet, never squeezed into the tabs.
        <CompareTable products={cols} matchFor={matchFor} detailsFor={detailsFor} onOpen={onOpen} onRemove={(p) => remove(p.id)} canRemove={(p) => p.id !== product.id} thisId={product.id} headingId="ay-compare-h" />
      )}
    </section>
  );
}

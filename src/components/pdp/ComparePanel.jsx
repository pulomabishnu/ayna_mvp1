import React, { useMemo } from 'react';
import { compareRows } from './commerce';
import { NOT_ON_FILE } from './glance';
import './pdp.css';

/**
 * "Compare with similar": this product beside 2-3 close alternatives from the
 * catalog, real fields only. Scrolls sideways on phones.
 */
export default function ComparePanel({ product, others = [], onOpen, matchFor = null, renderThumb = null }) {
  const cols = useMemo(() => [product, ...others].filter(Boolean), [product, others]);
  const rows = useMemo(() => compareRows(cols, { matchFor }), [cols, matchFor]);
  if (cols.length < 2 || !rows.length) return null;
  return (
    <section className="ay-compare" id="ay-sec-compare" tabIndex={-1} aria-labelledby="ay-compare-h">
      <div className="ay-pdp-sechead">
        <h2 id="ay-compare-h">Compare with similar</h2>
        <p>Same type of product, side by side. From ayna’s catalog.</p>
      </div>
      <div className="ay-compare__scroll" role="region" aria-labelledby="ay-compare-h" tabIndex={0}>
        <table>
          <thead>
            <tr>
              <td />
              {cols.map((p, i) => (
                <th key={p.id} scope="col" className={i === 0 ? 'is-this' : undefined}>
                  {renderThumb && <span className="ay-compare__thumb">{renderThumb(p)}</span>}
                  {i === 0
                    ? <span className="ay-compare__name">{p.name}<small>This product</small></span>
                    : <button type="button" className="ay-compare__name" onClick={() => onOpen && onOpen(p)}>{p.name}</button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.values.map((v, i) => <td key={cols[i].id} className={`${i === 0 ? 'is-this' : ''}${v === NOT_ON_FILE ? ' is-unknown' : ''}`.trim() || undefined}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

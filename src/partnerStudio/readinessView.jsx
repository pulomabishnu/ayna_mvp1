/* Product readiness: which listing facts ayna has on file for each product and
   what the matching engine was missing. Every check says how to fix it. */
import React, { useState } from 'react';
import { Kpi, Empty, Drawer } from './ui.jsx';
import { Insights, NextSteps } from './tiles.jsx';
import { Panel, Method } from './charts.jsx';
import { money } from './format.js';
import { CHECKS, readinessFor } from './engine/readiness.js';

const short = (name, brand) => (name.toLowerCase().startsWith(`${String(brand).toLowerCase()} `) ? name.slice(String(brand).length + 1) : name);
const Mark = ({ v, compact }) => (v == null ? <span className="ps-rd is-na">{compact ? 'N/A' : 'Not checked'}</span> : v ? <span className="ps-rd is-ok">{compact ? 'Yes' : 'On file'}</span> : <span className="ps-rd is-miss">Missing</span>);

export function Readiness({ b, go }) {
  const [pick, setPick] = useState(null);
  const name = b.displayName || b.brand || b.name;
  const r = readinessFor(b);
  if (!r.products.length) {
    return <Empty title="Readiness checks run for brand partners">ayna checks listing facts for products from brand partners. Ask the ayna team to add {name}.</Empty>;
  }
  const checked = r.products.filter((p) => p.score != null);
  const partial = r.products.filter((p) => p.partial);
  const full = checked.filter((p) => p.score === 100).length;
  const missing = r.gaps.reduce((n, g) => n + g.products.length, 0);
  const top = r.gaps[0];
  const sel = pick ? r.products.find((p) => p.id === pick) : null;
  const findings = [
    r.score != null ? `${full} of ${checked.length} checked ${checked.length === 1 ? 'product is' : 'products are'} fully ready; average readiness ${r.score}%.` : 'None of your products is in a checked category yet.',
    top ? `Most common gap: ${top.label.toLowerCase()} (${top.products.length} ${top.products.length === 1 ? 'product' : 'products'}).` : 'No gaps found in the checks ayna runs today.',
    partial.length ? `${partial.length} of your products ${partial.length === 1 ? 'is' : 'are'} outside the categories ayna checks today, so only the price is checked and ${partial.length === 1 ? 'it isn’t' : 'they aren’t'} scored.` : null,
  ];
  const actions = r.gaps.slice(0, 3).map((g) => ({ text: g.fix.replace(/\.$/, ''), note: `${g.label}: ${g.products.map((n) => short(n, name)).join(', ')}.` }));
  return (
    <>
      <div className="ps-filters">
        <span className="ps-small ps-muted">What ayna has on file for each product, and whether the matching engine had every fact it needed in the simulation. Fixing a gap is usually one document.</span>
      </div>
      <div className="ps-bento">
        <div className="b-4 b-hero"><Kpi tone="ink" icon="doc" label="Average readiness" value={r.score == null ? 'N/A' : `${r.score}%`} den={`checks passed across ${checked.length} fully checked ${checked.length === 1 ? 'product' : 'products'}`} meter={r.score || 0} info="Share of the readiness checks each product passes, averaged across products ayna could run at least three checks on. Checks that don't apply aren't counted." /></div>
        <div className="b-3"><Kpi tone="pink" icon="box" label="Fully ready" value={String(full)} den={`of ${checked.length} checked`} /></div>
        <div className="b-2"><Kpi tone="butter" icon="alert" label="Open gaps" value={String(missing)} den="facts to send" /></div>
        <div className="b-3"><Kpi tone="plain" icon="target" label="Most common gap" value={top ? top.short : 'None'} den={top ? `${top.products.length} ${top.products.length === 1 ? 'product' : 'products'}` : 'all checks pass'} /></div>
        <Panel className="b-8" id="rd-matrix" title="Readiness by product" info="Each row is a product, each column a check. Tap a product to see how to fix its gaps.">
          <div className="ps-table-wrap">
            <table className="ps-table ps-rd-table">
              <thead><tr><th>Product</th>{CHECKS.map((c) => <th key={c.key} title={c.label}>{c.short}</th>)}<th className="ps-r">Ready</th></tr></thead>
              <tbody>
                {r.products.map((p) => (
                  <tr key={p.id}>
                    <td><button type="button" className="ps-link" onClick={() => setPick(p.id)}>{short(p.name, name)}</button></td>
                    {CHECKS.map((c) => <td key={c.key}><Mark v={p.checks[c.key]} compact /></td>)}
                    <td className="ps-r"><b>{p.score == null ? (p.partial ? 'Price only' : 'N/A') : `${p.score}%`}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <div className="b-4 ps-stack-col ps-col12">
          <Insights items={findings} />
          <NextSteps actions={actions.length ? actions : [{ text: 'Keep facts current', note: 'ayna re-checks product facts on a schedule; confirm changes when you update a label.' }]} />
        </div>
      </div>
      {sel ? (
        <Drawer title={short(sel.name, name)} onClose={() => setPick(null)}>
          <p className="ps-why-verdict">{sel.score == null ? (sel.partial ? 'Only the price can be checked for this product today.' : 'Not checked yet.') : sel.score === 100 ? 'Ready: every check passes.' : `${sel.passed} of ${sel.checked} checks pass.`}</p>
          <ul className="ps-why-list">
            {CHECKS.map((c) => <li key={c.key}><span>{c.label}{sel.checks[c.key] === false ? <small>{c.fix}</small> : null}</span><b><Mark v={sel.checks[c.key]} /></b></li>)}
            <li><span>Price on ayna</span><b>{sel.price != null ? money(sel.price) : 'Not on file'}</b></li>
            <li><span>Product facts complete</span><b>{sel.completeness != null ? `${sel.completeness}%` : 'N/A'}</b></li>
            <li><span>Regulatory record<small>Not every product needs one.</small></span><b>{sel.regulatory || 'Not checked'}</b></li>
            <li><span>Facts last verified</span><b>{sel.lastVerified || 'Never'}</b></li>
          </ul>
          {!sel.inScope && sel.scopeNote ? <p className="ps-small ps-muted">{sel.scopeNote}</p> : null}
          <div className="ps-ab-row">
            <button type="button" className="ps-btn ps-btn--sm ps-btn--ink" onClick={() => { setPick(null); go?.('actions'); }}>Send a fact to ayna</button>
          </div>
        </Drawer>
      ) : null}
      <Method updated="this benchmark run" scope={`${r.products.length} products`} items={[
        'Checks come from the ayna product passport (facts on file and when they were verified) and the matching engine simulation (attributes it needed but couldn’t find).',
        'N/A (not checked) = the check doesn’t apply, usually because the product is outside the categories ayna simulates today.',
        'A regulatory record is shown for information only and isn’t scored: many products don’t need one.',
        'Readiness describes listing completeness for matching, not product quality or clinical suitability.',
      ]} />
    </>
  );
}

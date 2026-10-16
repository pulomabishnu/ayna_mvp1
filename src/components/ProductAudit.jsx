import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products.js';
import { getPassport, passportFacts, QA_STATUS, LINK_STATUS, OFF_SHELF_STATUSES } from '../data/passport/index.js';
import './ProductAudit.css';

/**
 * Internal, read-only "Product audit" (founder spec 35) at
 * /internal/product-audit. Lists every catalog product by passport
 * completeness, worst first, with missing fields, risky wording and
 * clinician-review flags. It changes nothing: QA decisions are recorded in
 * src/data/passport/reviews.js.
 *
 * The app has no admin role yet, so the page only renders in dev or when
 * this browser opted in (?internal=1 once, stored locally). Everything it
 * shows is the public catalog, nothing about users.
 */
const FLAG_KEY = 'ayna_internal_audit';

function allowed() {
  try {
    if (import.meta.env?.DEV) return true;
    const q = new URLSearchParams(window.location.search).get('internal');
    if (q === '1') window.localStorage.setItem(FLAG_KEY, '1');
    if (q === '0') window.localStorage.removeItem(FLAG_KEY);
    return window.localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function pctTone(p) {
  return p >= 80 ? 'is-good' : p >= 60 ? 'is-mid' : 'is-low';
}

const STATUS_LABEL = { current: 'Current', needs_review: 'Needs review', stale: 'Stale', unavailable: 'Unavailable', discontinued: 'Discontinued', recalled: 'Recalled' };
const RECALL_LABEL = { none_found: 'No recall found', recalled: 'Recalled', unknown: 'Not checked' };
const LINK_LABEL = { live: 'Live', unavailable: 'Not found (404/410)', unverified: 'Could not verify', not_checked: 'Not checked' };

function needsAction(pp) {
  return pp.wording.length > 0 || pp.flags.clinician_review.length > 0 || pp.corrections.length > 0
    || OFF_SHELF_STATUSES.includes(pp.status) || pp.status === 'stale' || pp.links.changed.length > 0 || pp.links.broken.length > 0;
}

function showValue(v) {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map((x) => (x && typeof x === 'object' ? x.claim || x.title || x.text || JSON.stringify(x) : String(x))).join('; ');
  if (typeof v === 'object') return v.text || v.state || JSON.stringify(v);
  return String(v);
}

function SourceLine({ f }) {
  return (
    <small>
      {f.source_url ? <a href={f.source_url} target="_blank" rel="noopener noreferrer">{f.source}</a> : f.source}
      {' · '}{f.verified_at || 'not verified'}{f.status === 'stale' ? ' · stale' : ''}
    </small>
  );
}

export default function ProductAudit() {
  const [ok] = useState(allowed);
  const [query, setQuery] = useState('');
  const [onlyFlags, setOnlyFlags] = useState(false);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const rows = useMemo(() => {
    if (!ok) return [];
    return ALL_PRODUCTS.map((p) => ({ p, pp: getPassport(p) }))
      .sort((a, b) => a.pp.completeness.overall - b.pp.completeness.overall
        || b.pp.completeness.missingCritical.length - a.pp.completeness.missingCritical.length);
  }, [ok]);

  if (!ok) {
    return (
      <div className="mockup-page ay-audit">
        <h1>Product audit</h1>
        <p>This page is for the ayna team.</p>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const shown = rows.filter(({ p, pp }) => (!q || `${p.name} ${p.id} ${p.brand || ''} ${p.category}`.toLowerCase().includes(q))
    && (!onlyFlags || needsAction(pp)));
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.pp.completeness.overall, 0) / rows.length) : 0;
  const counts = rows.reduce((acc, r) => { acc[r.pp.qa.label] = (acc[r.pp.qa.label] || 0) + 1; return acc; }, {});
  const statusCounts = rows.reduce((acc, r) => { acc[STATUS_LABEL[r.pp.status] || r.pp.status] = (acc[STATUS_LABEL[r.pp.status] || r.pp.status] || 0) + 1; return acc; }, {});
  const corrections = rows.reduce((n, r) => n + r.pp.corrections.length, 0);

  return (
    <div className="mockup-page ay-audit">
      <header className="ay-audit__head">
        <p className="ay-audit__eyebrow">Internal · read-only</p>
        <h1>Product audit</h1>
        <p>{rows.length} products · average completeness {avg}% · {Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
        <p>Data status: {Object.entries(statusCounts).map(([k, v]) => `${k} ${v}`).join(' · ')} · {corrections} catalog corrections</p>
        <p className="ay-audit__muted">Completeness says how much we have on file, not whether a product is good. Facts are from the ayna catalog (unverified) unless a reviewer recorded them, with a source link, in src/data/passport/reviews. QA states: {Object.values(QA_STATUS).join(', ')}. {LINK_STATUS?.generated_at ? `Links last checked ${String(LINK_STATUS.generated_at).slice(0, 10)}.` : 'Links not checked yet (scripts/passport/check-links.mjs, weekly workflow).'}</p>
      </header>

      <div className="ay-audit__tools">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, id, brand, category" aria-label="Search products" />
        <label><input type="checkbox" checked={onlyFlags} onChange={(e) => setOnlyFlags(e.target.checked)} /> Only needs action</label>
      </div>

      <ol className="ay-audit__list">
        {shown.map(({ p, pp }) => {
          const c = pp.completeness;
          const open = openId === p.id;
          return (
            <li key={p.id} className="ay-audit__row">
              <button type="button" className="ay-audit__summary" aria-expanded={open} onClick={() => setOpenId(open ? null : p.id)}>
                <span className={`ay-audit__pct ${pctTone(c.overall)}`}>{c.overall}%</span>
                <span className="ay-audit__name"><strong>{p.name}</strong><small>{p.id} · {String(CATEGORY_LABELS[p.category] || p.category).replace(/^[^\w]+\s*/, '')} · {pp.qa.label}</small></span>
                <span className="ay-audit__badges">
                  {(OFF_SHELF_STATUSES.includes(pp.status) || pp.status === 'stale') && <span className="is-status">{STATUS_LABEL[pp.status]}</span>}
                  {pp.corrections.length > 0 && <span className="is-word">{pp.corrections.length} correction{pp.corrections.length > 1 ? 's' : ''}</span>}
                  {pp.links.changed.length > 0 && <span className="is-word">Page changed</span>}
                  {c.missingCritical.length > 0 && <span className="is-crit">{c.missingCritical.length} critical missing</span>}
                  {pp.wording.length > 0 && <span className="is-word">{pp.wording.length} wording</span>}
                  {pp.flags.clinician_review.length > 0 && <span className="is-clin">Clinician review</span>}
                </span>
              </button>
              {open && (
                <div className="ay-audit__detail">
                  <div className="ay-audit__sections">
                    {c.sections.map((s) => <span key={s.id} className={pctTone(s.percent)}>{s.label} {s.percent}%</span>)}
                  </div>
                  <section>
                    <h3>Review</h3>
                    <dl className="ay-audit__facts">
                      {[
                        ['Data status', STATUS_LABEL[pp.status] || pp.status],
                        ['QA', `${pp.qa.label}${pp.qa.reviewed_by ? ` · ${pp.qa.reviewed_by}` : ''}`],
                        ['First verified', pp.dates.first_verified || 'never'],
                        ['Last verified', pp.dates.last_verified ? `${pp.dates.last_verified}${pp.freshness.age_days != null ? ` (${pp.freshness.age_days} days ago)` : ''}` : 'never'],
                        ['Next review due', pp.dates.next_review_due ? `${pp.dates.next_review_due}${pp.freshness.state === 'stale' ? ` · overdue ${pp.freshness.days_overdue} days` : ''}` : 'not scheduled'],
                        ['Recall check', `${RECALL_LABEL[pp.recall.status] || pp.recall.status}${pp.recall.checked_at ? ` · ${pp.recall.checked_at}` : ''}`],
                      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
                    </dl>
                    {pp.qa.notes && <p className="ay-audit__muted">{pp.qa.notes}</p>}
                  </section>
                  {pp.corrections.length > 0 && (
                    <section>
                      <h3>Corrections (catalog vs source)</h3>
                      <ul>{pp.corrections.map((x, i) => (
                        <li key={`${x.field}-${i}`}><b>{x.field}</b>: catalog “{showValue(x.catalog)}”, source says “{showValue(x.source_says)}”{x.source_url && <> <a href={x.source_url} target="_blank" rel="noopener noreferrer">source</a></>}</li>
                      ))}</ul>
                    </section>
                  )}
                  {c.missing.length > 0 && (
                    <section><h3>Missing fields</h3><ul>{c.missing.map((m) => <li key={m.path}>{m.critical ? <b>{m.field}</b> : m.field} <small>({m.section})</small></li>)}</ul></section>
                  )}
                  {pp.wording.length > 0 && (
                    <section><h3>Risky wording</h3><ul>{pp.wording.map((w, i) => <li key={`${w.field}-${i}`}><b>{w.label}</b> ({w.severity}) in {w.fieldLabel}: “{w.excerpt}”</li>)}</ul></section>
                  )}
                  {pp.flags.clinician_review.length > 0 && (
                    <section><h3>Clinician review flags</h3><ul>{pp.flags.clinician_review.map((f) => <li key={f.id}>{f.reason}</li>)}</ul></section>
                  )}
                  <section>
                    <h3>Saved values (source · verified)</h3>
                    <dl className="ay-audit__facts">
                      {passportFacts(pp)
                        .filter((f) => f.reviewed || ['identity.name', 'identity.brand', 'pricing.price', 'identity.purchase_url', 'composition.ingredients', 'composition.allergens', 'composition.fragrance', 'safety.pregnancy', 'safety.regulatory_status'].includes(f.path))
                        .map((f) => (
                          <div key={f.path}>
                            <dt>{f.label}</dt>
                            <dd>{f.known ? showValue(f.value).slice(0, 220) : <em>unknown</em>}<SourceLine f={f} /></dd>
                          </div>
                        ))}
                    </dl>
                  </section>
                  <section>
                    <h3>Health mappings</h3>
                    <p>{(p.healthFunctions || []).join(', ') || 'none'} <small>(catalog tags, not yet ranked with reasons)</small></p>
                  </section>
                  <section>
                    <h3>Sources ({pp.sources.all.known ? pp.sources.all.value.length : 0})</h3>
                    {pp.sources.all.known ? (
                      <ul>{pp.sources.all.value.slice(0, 8).map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a> <small>{s.evidence_label}</small></li>)}</ul>
                    ) : <p>None on file.</p>}
                    {pp.links.purchase || pp.links.sources.length ? (
                      <ul>
                        {pp.links.purchase && <li>Purchase link: {LINK_LABEL[pp.links.purchase.state]}{pp.links.purchase.status ? ` (${pp.links.purchase.status})` : ''}{pp.links.purchase.final_url ? ` → ${pp.links.purchase.final_url}` : ''}{pp.links.purchase.changed ? ' · page changed since last check' : ''}</li>}
                        {pp.links.broken.filter((l) => l !== pp.links.purchase).map((l) => <li key={l.url}>Broken source ({l.status}): <a href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a></li>)}
                        {pp.links.changed.filter((l) => l !== pp.links.purchase).map((l) => <li key={l.url}>Page changed: <a href={l.url} target="_blank" rel="noopener noreferrer">{l.url}</a></li>)}
                      </ul>
                    ) : <p className="ay-audit__muted">Links not checked yet.</p>}
                  </section>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

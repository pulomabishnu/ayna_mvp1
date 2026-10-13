import React, { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import { getPassport, QA_STATUS } from '../data/passport/index.js';
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
    && (!onlyFlags || pp.wording.length > 0 || pp.flags.clinician_review.length > 0));
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.pp.completeness.overall, 0) / rows.length) : 0;
  const counts = rows.reduce((acc, r) => { acc[r.pp.qa.label] = (acc[r.pp.qa.label] || 0) + 1; return acc; }, {});

  return (
    <div className="mockup-page ay-audit">
      <header className="ay-audit__head">
        <p className="ay-audit__eyebrow">Internal · read-only</p>
        <h1>Product audit</h1>
        <p>{rows.length} products · average completeness {avg}% · {Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
        <p className="ay-audit__muted">Completeness says how much we have on file, not whether a product is good. Every fact here comes from the ayna catalog and is unverified until a reviewer records it in src/data/passport/reviews.js. QA states: {Object.values(QA_STATUS).join(', ')}.</p>
      </header>

      <div className="ay-audit__tools">
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, id, brand, category" aria-label="Search products" />
        <label><input type="checkbox" checked={onlyFlags} onChange={(e) => setOnlyFlags(e.target.checked)} /> Only flagged</label>
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
                      {[
                        ['Name', pp.identity.name], ['Brand', pp.identity.brand], ['Price', pp.pricing.price], ['Purchase URL', pp.identity.purchase_url],
                        ['Ingredients', pp.composition.ingredients], ['Allergens', pp.composition.allergens], ['Fragrance', pp.composition.fragrance],
                        ['Pregnancy', pp.safety.pregnancy], ['Regulatory', pp.safety.regulatory_status],
                      ].filter(([, f]) => f && !f.notApplicable).map(([label, f]) => (
                        <div key={label}>
                          <dt>{label}</dt>
                          <dd>{f.known ? String(typeof f.value === 'object' ? (f.value.text || JSON.stringify(f.value)) : f.value).slice(0, 220) : <em>unknown</em>}<small>{f.source} · {f.verified_at || 'not verified'}</small></dd>
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
                    <p className="ay-audit__muted">Links have not been checked live; broken-link and changed-page checks need a server job.</p>
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

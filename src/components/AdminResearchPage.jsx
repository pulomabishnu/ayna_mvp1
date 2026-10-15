import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getSupabaseClient } from '../utils/supabaseClient';
import { ALL_PRODUCTS } from '../data/products';
import { getVerificationLinks } from '../utils/verificationLinks';
import { isCredible } from './pdp/credible';

/**
 * /admin/research: "Research this product" for the ayna team.
 *
 * Pick a product with empty sections (or add a new one), press Research,
 * then approve, edit or reject what comes back. Nothing shows on the site
 * until it's approved, and approved research only fills an EMPTY section:
 * it never replaces what the team wrote. Not linked from any nav; the real
 * gate is server-side (api/research-product checks ADMIN_EMAILS).
 */

const SECTIONS = [
  ['who', 'Who it’s for'],
  ['how', 'How to use'],
  ['clinical', 'Clinical sources'],
  ['science', 'Science sources'],
  ['reviews', 'Review summary'],
];
const LABEL = Object.fromEntries(SECTIONS);

function gapsFor(p) {
  const clin = [...(p.doctorOpinionCitations || []), ...getVerificationLinks(p, 'doctor'), ...(p.researchClinicalSources || [])].some((l) => isCredible(l.url || l.href));
  const sci = [...getVerificationLinks(p, 'scientific'), ...(p.scientificCitations || []), ...(p.researchScienceSources || []), ...(p.ingredientScience || []).flatMap((i) => i.citations || [])].some((l) => isCredible(l.url || l.href));
  return [
    !(p.whoItsFor || []).length && 'who',
    !(p.howToUse?.steps || []).length && !String(p.howToUse?.intro || '').trim() && 'how',
    !clin && 'clinical',
    !sci && 'science',
    !p.communityReview && 'reviews',
  ].filter(Boolean);
}

async function token() {
  const sb = getSupabaseClient();
  if (!sb) return '';
  const { data } = await sb.auth.getSession();
  return data?.session?.access_token || '';
}

async function call(method, body) {
  const t = await token();
  if (!t) return { status: 401, json: {} };
  const res = await fetch('/api/research-product' + (method === 'GET' ? '?list=1' : ''), {
    method,
    headers: { Authorization: `Bearer ${t}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let json = {};
  try { json = await res.json(); } catch { /* empty */ }
  return { status: res.status, json };
}

function Sources({ list, onRemove }) {
  if (!(list || []).length) return null;
  return (
    <ul className="arp-src">
      {list.map((s) => (
        <li key={s.url}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">{s.label || s.url}<span aria-hidden="true"> ↗</span></a>
          {s.summary && <p>{s.summary}</p>}
          {onRemove && <button type="button" className="arp-x" onClick={() => onRemove(s.url)} aria-label={`Remove ${s.label || s.url}`}>Remove</button>}
        </li>
      ))}
    </ul>
  );
}

/** One section of one product: what research found, and the team's decision. */
function DraftCard({ row, onDecide }) {
  const [edit, setEdit] = useState(row.draft || {});
  const [busy, setBusy] = useState(false);
  const d = edit;
  const lines = (arr) => (arr || []).join('\n');
  const toLines = (t) => String(t).split('\n').map((x) => x.trim()).filter(Boolean);
  const removeSource = (key) => (url) => setEdit((e) => ({ ...e, [key]: (e[key] || []).filter((s) => s.url !== url) }));
  const decide = async (decision) => { setBusy(true); await onDecide(row, decision, edit); setBusy(false); };
  const empty = !((d.whoItsFor || []).length || d.howToUse || (d.clinicalSources || []).length || (d.scienceSources || []).length || d.communityReview);
  return (
    <article className={`arp-card is-${row.status}`}>
      <header>
        <h3>{LABEL[row.section]}</h3>
        <span className="arp-status">{row.status === 'draft' ? 'Needs review' : row.status === 'approved' ? 'Approved, on the site' : 'Rejected'}</span>
      </header>
      {row.section === 'who' && <label className="arp-field"><span>One line each</span><textarea id={`arp-who-${row.id}`} rows={4} value={lines(d.whoItsFor)} onChange={(e) => setEdit({ ...d, whoItsFor: toLines(e.target.value) })} /></label>}
      {row.section === 'how' && (d.howToUse ? <>
        <label className="arp-field"><span>Intro</span><input id={`arp-intro-${row.id}`} value={d.howToUse.intro || ''} onChange={(e) => setEdit({ ...d, howToUse: { ...d.howToUse, intro: e.target.value } })} /></label>
        <label className="arp-field"><span>Steps, one per line</span><textarea id={`arp-steps-${row.id}`} rows={5} value={lines(d.howToUse.steps)} onChange={(e) => setEdit({ ...d, howToUse: { ...d.howToUse, steps: toLines(e.target.value) } })} /></label>
        <Sources list={[{ url: d.howToUse.sourceUrl, label: d.howToUse.sourceLabel }]} />
      </> : null)}
      {row.section === 'clinical' && <Sources list={d.clinicalSources} onRemove={removeSource('clinicalSources')} />}
      {row.section === 'science' && <Sources list={d.scienceSources} onRemove={removeSource('scienceSources')} />}
      {row.section === 'reviews' && <>
        <label className="arp-field"><span>Review summary</span><textarea id={`arp-rev-${row.id}`} rows={4} value={d.communityReview || ''} onChange={(e) => setEdit({ ...d, communityReview: e.target.value })} /></label>
        <Sources list={d.sources} onRemove={removeSource('sources')} />
      </>}
      {row.section === 'who' && <Sources list={d.sources} onRemove={removeSource('sources')} />}
      {empty && <p className="arp-muted">Nothing usable came back for this section. It stays empty on the site.</p>}
      {(row.issues || []).length > 0 && <details className="arp-issues"><summary>What the checks removed or couldn’t confirm ({row.issues.length})</summary><ul>{row.issues.map((t) => <li key={t}>{t}</li>)}</ul></details>}
      <div className="arp-actions">
        <button type="button" className="arp-btn is-primary" disabled={busy || empty} onClick={() => decide('approve')}>{row.status === 'approved' ? 'Save changes' : 'Approve'}</button>
        <button type="button" className="arp-btn" disabled={busy} onClick={() => decide('reject')}>Reject</button>
        {row.reviewed_by && <span className="arp-muted">{row.status === 'approved' ? 'Approved' : 'Rejected'} by {row.reviewed_by}</span>}
      </div>
    </article>
  );
}

export default function AdminResearchPage({ onBack }) {
  const [state, setState] = useState('loading'); // loading | ok | unauthenticated | forbidden | setup | error
  const [drafts, setDrafts] = useState([]);
  const [query, setQuery] = useState('');
  const [running, setRunning] = useState({}); // `${id}:${section}` -> true
  const [form, setForm] = useState({ name: '', brand: '', url: '', category: '' });
  const [note, setNote] = useState('');

  const [tick, setTick] = useState(0);
  const load = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    let live = true;
    call('GET').then(({ status, json }) => {
      if (!live) return;
      if (status === 401) setState('unauthenticated');
      else if (status === 403) setState('forbidden');
      else if (json?.error === 'table_missing') setState('setup');
      else if (status !== 200) setState('error');
      else { setDrafts(json.drafts || []); setState('ok'); }
    }).catch(() => { if (live) setState('error'); });
    return () => { live = false; };
  }, [tick]);

  const products = useMemo(() => {
    const seen = new Set();
    return ALL_PRODUCTS.filter((p) => p?.id && !seen.has(p.id) && seen.add(p.id))
      .map((p) => ({ p, gaps: gapsFor(p) }))
      .filter((x) => x.gaps.length)
      .sort((a, b) => b.gaps.length - a.gaps.length || a.p.name.localeCompare(b.p.name));
  }, []);
  const shown = products.filter(({ p }) => !query || `${p.name} ${p.brand || ''}`.toLowerCase().includes(query.toLowerCase()));
  const byProduct = useMemo(() => {
    const m = new Map();
    for (const r of drafts) { if (!m.has(r.product_id)) m.set(r.product_id, []); m.get(r.product_id).push(r); }
    return m;
  }, [drafts]);

  const runSections = async (product, sections) => {
    setNote('');
    const keyOf = (s) => `${product.id || product.name}:${s}`;
    setRunning((r) => ({ ...r, ...Object.fromEntries(sections.map((s) => [keyOf(s), true])) }));
    const results = await Promise.all(sections.map((section) => call('POST', { product, section })));
    setRunning((r) => { const n = { ...r }; sections.forEach((s) => delete n[keyOf(s)]); return n; });
    const failed = results.filter((x) => x.status !== 200);
    if (failed.some((x) => x.json?.error === 'table_missing')) setState('setup');
    else if (failed.length) setNote(`${failed.length} of ${sections.length} sections didn’t finish (${failed[0].json?.error || failed[0].status}). Try again.`);
    load();
  };

  const decide = async (row, decision, edited) => {
    const { status } = await call('PATCH', { id: row.id, decision, edited });
    if (status !== 200) setNote('Couldn’t save that decision. Try again.');
    load();
  };

  const addNew = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setNote('Add the product name first.'); return; }
    runSections({ ...form }, SECTIONS.map(([s]) => s));
  };

  if (state !== 'ok') {
    const msg = {
      loading: 'Loading…',
      unauthenticated: 'Log in with your ayna team account to use this page.',
      forbidden: 'This page is for the ayna team. Your account isn’t on the admin list (ADMIN_EMAILS in Vercel).',
      setup: 'One-time setup: run supabase/migrations/20261015120000_product_research.sql in the Supabase SQL editor, then reload.',
      error: 'Couldn’t load research right now. Try again in a minute.',
    }[state];
    return <section className="arp"><button type="button" className="arp-btn" onClick={onBack}>Back</button><h1>Product research</h1><p className="arp-muted">{msg}</p></section>;
  }

  const pending = drafts.filter((r) => r.status === 'draft');
  return (
    <section className="arp">
      <button type="button" className="arp-btn" onClick={onBack}>Back</button>
      <h1>Product research</h1>
      <p className="arp-lede">Research fills empty sections with the brand’s own instructions, credible sources and real reviews. Nothing shows on the site until you approve it, and it never replaces anything the team wrote.</p>
      {note && <p className="arp-note" role="status">{note}</p>}

      {pending.length > 0 && <>
        <h2>Waiting for review ({pending.length})</h2>
        {[...new Set(pending.map((r) => r.product_id))].map((pid) => {
          const rows = byProduct.get(pid) || [];
          return (
            <div key={pid} className="arp-group">
              <h3 className="arp-pname">{rows[0]?.product_name}{rows[0]?.brand ? <small> {rows[0].brand}</small> : null}</h3>
              <div className="arp-cards">{rows.filter((r) => r.status === 'draft').map((r) => <DraftCard key={`${r.id}-${r.updated_at}`} row={r} onDecide={decide} />)}</div>
            </div>
          );
        })}
      </>}

      <h2>Add a new product</h2>
      <form className="arp-form" onSubmit={addNew}>
        <label><span>Product name</span><input id="arp-new-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vaginal Moisturizer" /></label>
        <label><span>Brand</span><input id="arp-new-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Neycher" /></label>
        <label><span>Brand page (https)</span><input id="arp-new-url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://www.helloneycher.com/product/vaginal-moisturizer" /></label>
        <label><span>Category</span><input id="arp-new-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="intimate-care" /></label>
        <button type="submit" className="arp-btn is-primary" disabled={Object.keys(running).length > 0}>Research this product</button>
      </form>

      <h2>Products with empty sections ({products.length})</h2>
      <input id="arp-search" className="arp-search" type="search" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search products" />
      <ul className="arp-list">
        {shown.slice(0, 80).map(({ p, gaps }) => {
          const done = new Set((byProduct.get(p.id) || []).map((r) => r.section));
          const todo = gaps.filter((g) => !done.has(g));
          const busy = gaps.some((g) => running[`${p.id}:${g}`]);
          return (
            <li key={p.id}>
              <div><b>{p.name}</b>{p.brand ? <span className="arp-muted"> {p.brand}</span> : null}</div>
              <div className="arp-chips">{gaps.map((g) => <span key={g} className={done.has(g) ? 'is-done' : ''}>{LABEL[g]}</span>)}</div>
              <button type="button" className="arp-btn is-primary" disabled={busy || !todo.length} onClick={() => runSections({ id: p.id, name: p.name, brand: p.brand || '', url: p.url || p.productUrl || '', category: p.category, summary: p.summary || '', ingredients: p.ingredients || '' }, todo)}>
                {busy ? 'Researching…' : todo.length ? 'Research this product' : 'Researched'}
              </button>
            </li>
          );
        })}
      </ul>

      {drafts.some((r) => r.status !== 'draft') && <>
        <h2>Already reviewed</h2>
        <ul className="arp-done">{drafts.filter((r) => r.status !== 'draft').map((r) => <li key={r.id}>{r.product_name}: {LABEL[r.section]} <span className="arp-muted">{r.status} by {r.reviewed_by}</span></li>)}</ul>
      </>}
    </section>
  );
}

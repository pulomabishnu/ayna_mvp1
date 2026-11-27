/**
 * ayna Partner Studio (Phase 1, private preview).
 * Four paid modules as primary navigation, plus overview, actions, competitors,
 * feed and reports. All data comes from GET /api/partner-studio, which is
 * admin-only and feature-flagged on the server.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon, Drawer, SyntheticBadge } from './ui.jsx';
import { Overview, Actions, Evidence, Claims, Share, Losses, Competitors, Feed, Reports, OutOfScope } from './views.jsx';
import { inScope } from './format.js';
import { accessTokenFromBrowser, readLocal, writeLocal } from './auth.js';
import { initPartnerAnalytics, track } from './analytics.js';
import { rollupCsv } from './csv.js';
import { QUESTIONS, answer, matchQuestion, search } from './assistant.js';

const NAV = [
  { group: 'Workspace', items: [['overview', 'Overview'], ['actions', 'Action queue']] },
  { group: 'Modules', items: [['evidence', 'Evidence gaps'], ['claims', 'Health claims'], ['share', 'Recommendation share'], ['losses', 'Lost recommendations']] },
  { group: 'Monitor', items: [['competitors', 'Competitors'], ['feed', 'Intelligence feed']] },
  { group: 'Account', items: [['reports', 'Reports and methodology']] },
];
const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items));
const ICON = { overview: 'overview', actions: 'actions', evidence: 'evidence', claims: 'claims', share: 'share', losses: 'losses', competitors: 'competitors', feed: 'feed', reports: 'reports' };
const SUBTITLE = {
  overview: 'How often ayna recommends your products, how you compare, and what to do next.',
  actions: 'Everything you can act on, most important first.',
  evidence: 'Which research and documentation gaps to close first, compared with similar products.',
  claims: 'How your product promises compare with competitors, and which ones need a closer look.',
  share: 'Who ayna recommends most in your category, and where you rank. Filter by need, format and budget.',
  losses: 'When your product was a fit but didn’t make the top 3, and why.',
  competitors: 'Your products next to the most similar products in ayna’s catalog.',
  feed: 'What changed on your products and in your category.',
  reports: 'How the numbers are made, run details and downloads.',
};

const DENIED = {
  not_team_domain: 'Partner Studio is for @aynahealth.co accounts. Sign out, then sign in with your ayna work email.',
  unconfirmed: 'This email isn’t confirmed yet. Open the confirmation link ayna sent you, then reload.',
  not_listed: 'This account isn’t on the Partner Studio admin list for this deploy. Ask whoever manages Vercel to add it to ADMIN_EMAILS.',
};

function Gate({ status, denied }) {
  const copy = {
    401: ['Sign in first', 'Partner Studio uses your ayna account. Sign in on this site with your @aynahealth.co email, then come back to this page.'],
    403: ['Private preview', 'Partner Studio is open to the ayna team while Phase 1 is reviewed. Brand access comes next.'],
    404: ['Not available yet', 'Partner Studio is switched off here.'],
    503: ['No benchmark yet', 'The first benchmark run hasn’t been built for this deploy. It runs during the build when Partner Studio is switched on.'],
    error: ['Couldn’t load', 'Something went wrong loading the benchmark. Try again in a minute.'],
  }[status] || ['Loading', 'Loading the latest benchmark…'];
  return (
    <main className="ps-gate">
      <div className="ps-card ps-card--plain" role={status ? 'alert' : 'status'}>
        <span className="ps-num" style={{ fontSize: 30 }}>ayna</span>
        <h1 style={{ fontFamily: "'ayna Display','Bricolage Grotesque',sans-serif" }}>{copy[0]}</h1>
        <p>{copy[1]}</p>
        {status === 403 && denied?.reason ? (
          <p className="ps-callout">
            {denied.email ? <span>Signed in as <b>{denied.email}</b>.</span> : null}
            <span>{DENIED[denied.reason] || DENIED.not_listed}</span>
          </p>
        ) : null}
        {status === 401 || denied?.reason === 'not_team_domain' ? <a className="ps-btn ps-btn--ink" href="/">Sign in on this site</a> : null}
      </div>
    </main>
  );
}

function SearchBox({ data, b, go, setCat }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const screens = useMemo(() => NAV.flatMap((g) => g.items), []);
  const results = useMemo(() => search(q, data, b, screens), [q, data, b, screens]);
  const pick = (r) => {
    if (r.kind === 'screen') go(r.id);
    else { setCat(r.cat); go('share'); }
    setQ(''); setOpen(false);
    track('partner_studio_search_used', { kind: r.kind });
  };
  return (
    <div className="ps-search" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input type="search" placeholder="Search any product, brand or page" value={q} aria-label="Search products, brands and pages" onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) pick(results[0]); if (e.key === 'Escape') setOpen(false); }} />
      {open && q.trim().length >= 2 ? (
        <ul className="ps-search-results" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.kind}-${r.label}-${i}`}><button type="button" onClick={() => pick(r)}>
              <span className="ps-search-kind">{r.kind === 'screen' ? 'Page' : r.kind === 'brand' ? 'Brand' : 'Product'}</span>
              <span><strong>{r.label}</strong>{r.you ? <em> (you)</em> : null}{r.partner && !r.you ? <span className="ps-tag">ayna partner</span> : null}{r.sub ? <small>{r.sub}</small> : null}</span>
            </button></li>
          ))}
          {!results.length ? <li className="ps-search-empty">No product, brand or page matches “{q}”.</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

function AskPanel({ data, b, go, onClose }) {
  const [current, setCurrent] = useState(null);
  const [text, setText] = useState('');
  const ask = (id) => { setCurrent(id); track('partner_studio_question_asked', { question: id }); };
  const res = current ? answer(current, data, b) : null;
  return (
    <Drawer title="Ask about your results" onClose={onClose}>
      <p className="ps-small ps-muted">Pick a question or type your own. Answers use only the numbers on this dashboard.</p>
      <div className="ps-prompts">
        {QUESTIONS.map((q) => <button key={q.id} type="button" className="ps-prompt" aria-pressed={current === q.id} onClick={() => ask(q.id)}>{q.q}</button>)}
      </div>
      <form className="ps-ask-form" onSubmit={(e) => { e.preventDefault(); const m = matchQuestion(text); ask(m ? m.id : 'none'); }}>
        <input type="text" value={text} placeholder="e.g. why am I not recommended?" aria-label="Your question" onChange={(e) => setText(e.target.value)} />
        <button type="submit" className="ps-btn ps-btn--ink ps-btn--sm">Ask</button>
      </form>
      {res ? (
        <div className="ps-answer" role="status">
          <h3>{res.title}</h3>
          <ul>{res.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
          {res.go ? <button type="button" className="ps-btn ps-btn--sm" onClick={() => { go(res.go); onClose(); }}>Show me the details</button> : null}
        </div>
      ) : null}
    </Drawer>
  );
}

export default function PartnerStudio({ fetcher = fetch }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [denied, setDenied] = useState(null);
  const [brand, setBrand] = useState(() => new URLSearchParams(window.location.search).get('brand') || '');
  const [view, setView] = useState(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return v && TITLES[v] ? v : 'overview';
  });
  const [cat, setCat] = useState('');
  const [source, setSource] = useState(null);
  const [actionMap, setActionMap] = useState({});
  const [ackMap, setAckMap] = useState({});
  const [asking, setAsking] = useState(false);

  useEffect(() => { initPartnerAnalytics(); track('partner_studio_opened'); }, []);

  useEffect(() => {
    let cancelled = false;
    const token = accessTokenFromBrowser();
    const q = brand ? `?brand=${encodeURIComponent(brand)}` : '';
    fetcher(`/api/partner-studio${q}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 403) { const j = await res.json().catch(() => ({})); if (!cancelled) setDenied({ reason: j.reason, email: j.email }); }
          if (!cancelled) setStatus([401, 403, 404, 503].includes(res.status) ? res.status : 'error');
          return;
        }
        const json = await res.json();
        if (cancelled) return;
        setData(json);
        setStatus('ok');
        if (!brand) setBrand(json.brand.name);
      })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [brand, fetcher]);

  const b = data?.brand;
  const bname = b?.name || '';
  const actionState = useMemo(() => actionMap[bname] ?? (bname ? readLocal(`ps-actions:${bname}`) : {}), [actionMap, bname]);
  const ack = useMemo(() => ackMap[bname] ?? (bname ? readLocal(`ps-ack:${bname}`) : {}), [ackMap, bname]);
  const catEff = b?.categories?.some((x) => x.id === cat) ? cat : b?.categories?.[0]?.id || '';

  useEffect(() => {
    const url = new URL(window.location.href);
    if (brand) url.searchParams.set('brand', brand);
    url.searchParams.set('view', view);
    window.history.replaceState(null, '', url);
  }, [brand, view]);

  const go = useCallback((v) => { setView(v); track('partner_studio_module_viewed', { module: v }); window.scrollTo?.(0, 0); }, []);
  const setAction = useCallback((id, s) => {
    const next = { ...actionState, [id]: s };
    writeLocal(`ps-actions:${bname}`, next);
    setActionMap((m) => ({ ...m, [bname]: next }));
    track('partner_studio_action_updated', { status: s });
  }, [actionState, bname]);
  const setAck = useCallback((id) => {
    const next = { ...ack, [id]: true };
    writeLocal(`ps-ack:${bname}`, next);
    setAckMap((m) => ({ ...m, [bname]: next }));
  }, [ack, bname]);
  const openSource = useCallback((r) => { setSource(r); track('partner_studio_source_opened', { module: view }); }, [view]);
  const closeSource = useCallback(() => setSource(null), []);
  const onExport = useCallback(() => {
    const blob = new Blob([rollupCsv(data)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ayna-partner-studio-${String(b?.name || 'brand').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${data.run.runId}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    track('partner_studio_export_downloaded', { kind: 'csv' });
  }, [data, b]);

  const openCount = useMemo(() => (b?.actions || []).filter((a) => (actionState[a.id] || 'open') !== 'done').length, [b, actionState]);

  if (status !== 'ok' || !data) return <Gate status={status} denied={denied} />;
  const scoped = inScope(b);
  const name = b.displayName || b.name;

  let body;
  if (!scoped && !['reports'].includes(view)) body = <OutOfScope b={b} outOfScope={data.outOfScope} />;
  else if (view === 'overview') body = <Overview data={data} b={b} go={go} actionState={actionState} />;
  else if (view === 'actions') body = <Actions b={b} actionState={actionState} setAction={setAction} />;
  else if (view === 'evidence') body = <Evidence b={b} openSource={openSource} />;
  else if (view === 'claims') body = <Claims b={b} />;
  else if (view === 'share') body = <Share data={data} b={b} cat={catEff} setCat={setCat} />;
  else if (view === 'losses') body = <Losses b={b} cat={catEff} setCat={setCat} />;
  else if (view === 'competitors') body = <Competitors b={b} />;
  else if (view === 'feed') body = <Feed b={b} ack={ack} setAck={setAck} />;
  else body = <Reports data={data} b={b} onExport={onExport} />;

  return (
    <div className="ps">
      <aside className="ps-side" aria-label="Partner Studio">
        <div className="ps-logo"><b>ayna</b><span>Partner Studio</span></div>
        <div className="ps-brandpick">
          <label htmlFor="ps-brand">Brand</label>
          <select id="ps-brand" value={b.name} onChange={(e) => { setBrand(e.target.value); track('partner_studio_brand_switched', { brand: e.target.value }); }}>
            {data.brands.map((x) => <option key={x.name} value={x.name}>{x.name}{x.inScope ? '' : ' (not in Phase 1)'}</option>)}
          </select>
        </div>
        <nav aria-label="Sections" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {NAV.map((g) => (
            <div key={g.group} className="ps-navgroup">
              <span>{g.group}</span>
              {g.items.map(([id, label]) => (
                <button key={id} type="button" className="ps-nav" aria-current={view === id ? 'page' : undefined} onClick={() => go(id)}>
                  <Icon name={ICON[id]} />{label}{id === 'actions' && openCount ? <span className="ps-dot">{openCount}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <p className="ps-side-foot">Private preview for the ayna team. Synthetic scenarios and public product facts only.</p>
      </aside>
      <main className="ps-main" id="main">
        <header className="ps-top">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="ps-small" style={{ fontWeight: 700 }}>{name}</span>
            <h1>{view === 'overview' ? `Stay up to date, ${name}` : TITLES[view]}</h1>
            <p className="ps-muted">{SUBTITLE[view]}</p>
          </div>
          <div className="ps-top-actions">
            <SearchBox data={data} b={b} go={go} setCat={setCat} />
            <button type="button" className="ps-btn ps-btn--ink ps-btn--sm" onClick={() => { setAsking(true); track('partner_studio_ask_opened'); }}>Ask a question</button>
            <SyntheticBadge text={`Updated ${new Date(data.run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} />
          </div>
        </header>
        {body}
      </main>
      {asking ? <AskPanel data={data} b={b} go={go} onClose={() => setAsking(false)} /> : null}
      {source ? (
        <Drawer title={source.name} onClose={closeSource}>
          <div className="ps-item"><strong>ayna review record</strong><span className="ps-small">{source.qa.label}{source.qa.at ? ` · ${source.qa.at}` : ''}</span><span className="ps-small">{source.qa.by || 'Not reviewed yet'}</span></div>
          <h3>Sources on file</h3>
          <ul className="ps-list">
            {source.sources.map((s, i) => <li key={i} className="ps-item"><a href={s.url} target="_blank" rel="noreferrer"><strong>{s.title}</strong></a><span className="ps-small">{s.type ? s.type.replace(/_/g, ' ') : 'source'}{s.supports ? ` · supports: ${s.supports}` : ''}</span></li>)}
            {!source.sources.length ? <li className="ps-item">No sources logged.</li> : null}
          </ul>
          <p className="ps-small ps-muted">Trial registrations are registration records, not proof of results. A clearance is not evidence for every marketing claim.</p>
          <a className="ps-btn ps-btn--ink" href={`mailto:team@aynahealth.co?subject=${encodeURIComponent(`Partner Studio correction: ${source.name}`)}`}>Request a correction</a>
        </Drawer>
      ) : null}
    </div>
  );
}

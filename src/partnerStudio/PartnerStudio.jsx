/**
 * ayna Partner Studio (Phase 1, private preview).
 * Four paid modules as primary navigation, plus overview, actions, competitors,
 * feed and reports. All data comes from GET /api/partner-studio, which is
 * admin-only and feature-flagged on the server.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon, Drawer, SyntheticBadge } from './ui.jsx';
import { Actions } from './actionsBoard.jsx';
import { Products } from './productsView.jsx';
import { Market } from './marketView.jsx';
import { Overview } from './overviewView.jsx';
import { Evidence, Claims, Share, Losses, Competitors, Feed, Reports, OutOfScope } from './views.jsx';
import { inScope } from './format.js';
import { accessTokenFromBrowser, readLocal, writeLocal } from './auth.js';
import { initPartnerAnalytics, track } from './analytics.js';
import { rollupCsv } from './csv.js';
import { QUESTIONS, answer, matchQuestion } from './assistant.js';
import { getSupabaseClient } from '../utils/supabaseClient.js';

// Basic plan ($39/mo): five sections. Pages that belong together sit under one
// menu item with tabs; the action plan and updates open from the Overview.
const NAV = [
  { id: 'overview', label: 'Overview', icon: 'overview', views: ['overview'] },
  { id: 'products', label: 'Products', icon: 'box', views: ['products'] },
  { id: 'market', label: 'Competitive insights', icon: 'competitors', views: ['market', 'competitors'], tabs: [['market', 'Market opportunities'], ['competitors', 'Product comparison']] },
  { id: 'share', label: 'Recommendations', icon: 'share', views: ['share', 'losses'], tabs: [['share', 'Simulated selection share'], ['losses', 'Why products aren’t selected']] },
  { id: 'reports', label: 'Reports', icon: 'reports', views: ['reports'] },
];
// Pages built from the whole catalog work for every brand; the rest need the recommendation benchmark.
const OPEN_TO_ALL = ['overview', 'products', 'market', 'actions', 'feed', 'reports'];
const TITLE_OF = { overview: 'Overview', products: 'Products', market: 'Competitive insights', competitors: 'Competitive insights', share: 'Recommendations', losses: 'Recommendations', reports: 'Reports', actions: 'Action plan', feed: 'Updates on your products', claims: 'Competitor content & positioning', evidence: 'Product information' };
const SUBTITLE = {
  overview: 'See how shoppers discover and engage with your products on ayna.',
  products: 'See which products shoppers view and click through to a retailer.',
  market: 'Where shoppers look on ayna, by category, and how much of that activity your brand gets.',
  actions: 'Specific things to fix or try, with what each one is worth. Track them as you go.',
  evidence: 'What your listings include next to similar products, and what to add first.',
  claims: 'What your product pages say next to competitors’ pages, and what each statement cites. Quoted as written; ayna doesn’t judge whether claims are true.',
  share: 'How your products do in ayna’s matching engine across simulated shopping scenarios. Not actual customer activity.',
  losses: 'Why your products weren’t selected in simulated shopping scenarios, and what you can change.',
  competitors: 'Your products next to the most similar products on ayna. Public information only.',
  feed: 'Reviews, fact checks and changes on your products.',
  reports: 'Review and export your brand’s performance, and see how every number is made.',
};

const DENIED = {
  not_team_domain: 'Partner Studio is for @aynahealth.co accounts. Sign in below with your ayna work email.',
  unconfirmed: 'This email isn’t confirmed yet. Open the confirmation link ayna sent you, then reload.',
  not_listed: 'This account isn’t on the Partner Studio admin list for this deploy. Ask whoever manages Vercel to add it to ADMIN_EMAILS.',
};

/** Sign in right here, so she never leaves this page. Google comes back here too (src/utils/authReturn.js). */
function SignIn({ onDone, switching }) {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  if (!supabase) return <a className="ps-btn ps-btn--ink" href="/">Sign in on the main site</a>;
  const field = { border: '1px solid rgba(62,39,35,.25)', borderRadius: 12, padding: '10px 12px', background: '#fff8dc', minHeight: 44, width: '100%', boxSizing: 'border-box', font: 'inherit' };
  const google = async () => {
    setError(''); setBusy('google');
    try {
      if (switching) await supabase.auth.signOut();
      const { error: e } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback`, queryParams: { prompt: 'select_account' } } });
      if (e) throw e;
    } catch (e) { setError(e?.message || 'Couldn’t start Google sign-in.'); setBusy(''); }
  };
  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy('email');
    try {
      if (switching) await supabase.auth.signOut();
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (err) throw err;
      onDone();
    } catch (err) { setError(err?.message || 'Couldn’t sign in. Check your email and password.'); }
    setBusy('');
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button type="button" className="ps-btn ps-btn--ink" onClick={google} disabled={Boolean(busy)} style={{ justifyContent: 'center', width: '100%' }}>{busy === 'google' ? 'Opening Google…' : 'Continue with Google'}</button>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <input type="email" autoComplete="email" required placeholder="you@aynahealth.co" aria-label="Work email" value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
        <input type="password" autoComplete="current-password" required placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={field} />
        <button type="submit" className="ps-btn" disabled={Boolean(busy)} style={{ justifyContent: 'center', width: '100%' }}>{busy === 'email' ? 'Signing in…' : 'Sign in with email'}</button>
      </form>
      {error ? <p className="ps-small" role="alert" style={{ color: '#3e2723', fontWeight: 700 }}>{error}</p> : null}
      <p className="ps-small ps-muted">You’ll stay on this page.</p>
    </div>
  );
}

function Gate({ status, denied, onSignedIn }) {
  const copy = {
    401: ['Sign in to Partner Studio', 'Use your @aynahealth.co account.'],
    403: ['Private preview', 'Partner Studio is open to the ayna team while Phase 1 is reviewed. Brand access comes next.'],
    404: ['Not available yet', 'Partner Studio is switched off here.'],
    503: ['No benchmark yet', 'The first benchmark run hasn’t been built for this deploy. It runs during the build when Partner Studio is switched on.'],
    error: ['Couldn’t load', 'Something went wrong loading the benchmark. Try again in a minute.'],
  }[status] || ['Loading', 'Loading the latest benchmark…'];
  const switching = status === 403 && denied?.reason === 'not_team_domain';
  return (
    <main className="ps-gate">
      <div className="ps-card ps-card--plain" role={status ? 'alert' : 'status'} style={{ width: 'min(440px, 100%)' }}>
        <span className="ps-num" style={{ fontSize: 30 }}>ayna</span>
        <h1 style={{ fontFamily: "'ayna Display','Bricolage Grotesque',sans-serif" }}>{copy[0]}</h1>
        <p>{copy[1]}</p>
        {status === 403 && denied?.reason ? (
          <p className="ps-callout">
            {denied.email ? <span>Signed in as <b>{denied.email}</b>.</span> : null}
            <span>{DENIED[denied.reason] || DENIED.not_listed}</span>
          </p>
        ) : null}
        {status === 401 || switching ? <SignIn onDone={onSignedIn} switching={switching} /> : null}
      </div>
    </main>
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
    return v && TITLE_OF[v] ? v : 'overview';
  });
  const [cat, setCat] = useState('');
  const [source, setSource] = useState(null);
  const [actionMap, setActionMap] = useState({});
  const [ackMap, setAckMap] = useState({});
  const [asking, setAsking] = useState(false);
  const [reload, setReload] = useState(0);

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
  }, [brand, fetcher, reload]);

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

  if (status !== 'ok' || !data) return <Gate status={status} denied={denied} onSignedIn={() => { setStatus(null); setDenied(null); setReload((n) => n + 1); }} />;
  const scoped = inScope(b);
  const name = b.displayName || b.name;
  const section = NAV.find((n) => n.views.includes(view));

  let body;
  if (!scoped && !OPEN_TO_ALL.includes(view)) body = <OutOfScope b={b} outOfScope={data.outOfScope} />;
  else if (view === 'overview') body = <Overview data={data} b={b} go={go} actionState={actionState} />;
  else if (view === 'products') body = <Products data={data} b={b} go={go} />;
  else if (view === 'market') body = <Market data={data} b={b} go={go} />;
  else if (view === 'actions') body = <Actions b={b} actionState={actionState} setAction={setAction} go={go} />;
  else if (view === 'evidence') body = <Evidence data={data} b={b} openSource={openSource} />;
  else if (view === 'claims') body = <Claims data={data} b={b} />;
  else if (view === 'share') body = <Share data={data} b={b} cat={catEff} setCat={setCat} />;
  else if (view === 'losses') body = <Losses data={data} b={b} cat={catEff} setCat={setCat} />;
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
            <optgroup label="Brand partners">{data.brands.filter((x) => x.partner !== false).map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}</optgroup>
            <optgroup label="All brands on ayna">{data.brands.filter((x) => x.partner === false).map((x) => <option key={x.name} value={x.name}>{x.name}</option>)}</optgroup>
          </select>
        </div>
        <nav aria-label="Sections" className="ps-navgroup">
          {NAV.map((n) => (
            <button key={n.id} type="button" className="ps-nav" aria-current={n.views.includes(view) ? 'page' : undefined} onClick={() => go(n.id)}>
              <Icon name={n.icon} />{n.label}
            </button>
          ))}
        </nav>
        <p className="ps-side-foot">Private preview for the ayna team. Real app activity counts, public product facts, and a separate simulation with synthetic shopping scenarios.</p>
      </aside>
      <main className="ps-main" id="main">
        <div className="ps-toolbar">
          <div className="ps-top-actions">
            <SyntheticBadge text={`Updated ${new Date(data.run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} />
            <button type="button" className="ps-btn ps-btn--ink" onClick={() => { setAsking(true); track('partner_studio_ask_opened'); }}>Ask a question</button>
          </div>
        </div>
        <header className="ps-top">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span className="ps-small" style={{ fontWeight: 700 }}>{name}</span>
            <h1>{view === 'overview' ? `${name} overview` : TITLE_OF[view]}</h1>
            <p className="ps-muted">{SUBTITLE[view]}</p>
          </div>
        </header>
        {section?.tabs ? (
          <div className="ps-subtabs" role="tablist" aria-label={section.label}>
            {section.tabs.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={view === id} className="ps-subtab" onClick={() => go(id)}>{label}</button>)}
          </div>
        ) : null}
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

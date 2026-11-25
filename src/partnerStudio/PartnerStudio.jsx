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

const NAV = [
  { group: 'Workspace', items: [['overview', 'Overview'], ['actions', 'Action queue']] },
  { group: 'Modules', items: [['evidence', 'Evidence gaps'], ['claims', 'Health claims'], ['share', 'Recommendation share'], ['losses', 'Lost recommendations']] },
  { group: 'Monitor', items: [['competitors', 'Competitors'], ['feed', 'Intelligence feed']] },
  { group: 'Account', items: [['reports', 'Reports and methodology']] },
];
const TITLES = Object.fromEntries(NAV.flatMap((g) => g.items));
const ICON = { overview: 'overview', actions: 'actions', evidence: 'evidence', claims: 'claims', share: 'share', losses: 'losses', competitors: 'competitors', feed: 'feed', reports: 'reports' };
const SUBTITLE = {
  overview: 'Where you stand this month, and what to do next.',
  actions: 'Every finding that has something you can do about it.',
  evidence: 'Which evidence and documentation gaps to close first, against comparable products.',
  claims: 'How your public claims compare with peers, and which ones a reviewer should look at.',
  share: 'How often your products are recommended across fixed, fictional shopper scenarios.',
  losses: 'When you were eligible but not placed, and what explains it.',
  competitors: 'Your products next to the closest comparable products.',
  feed: 'What changed on your products and in your category.',
  reports: 'Run details, definitions and exports.',
};

function Gate({ status }) {
  const copy = {
    401: ['Sign in first', 'Partner Studio uses your ayna account. Sign in on aynahealth.co, then come back to this page.'],
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
        {status === 401 ? <a className="ps-btn ps-btn--ink" href="/">Go to aynahealth.co</a> : null}
      </div>
    </main>
  );
}

export default function PartnerStudio({ fetcher = fetch }) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [brand, setBrand] = useState(() => new URLSearchParams(window.location.search).get('brand') || '');
  const [view, setView] = useState(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return v && TITLES[v] ? v : 'overview';
  });
  const [cat, setCat] = useState('');
  const [source, setSource] = useState(null);
  const [actionMap, setActionMap] = useState({});
  const [ackMap, setAckMap] = useState({});

  useEffect(() => { initPartnerAnalytics(); track('partner_studio_opened'); }, []);

  useEffect(() => {
    let cancelled = false;
    const token = accessTokenFromBrowser();
    const q = brand ? `?brand=${encodeURIComponent(brand)}` : '';
    fetcher(`/api/partner-studio${q}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async (res) => {
        if (!res.ok) { if (!cancelled) setStatus([401, 403, 404, 503].includes(res.status) ? res.status : 'error'); return; }
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

  if (status !== 'ok' || !data) return <Gate status={status} />;
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
            <SyntheticBadge text={`Run ${new Date(data.run.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} />
            <button type="button" className="ps-btn ps-btn--sm" onClick={() => { go('reports'); track('partner_studio_methodology_opened'); }}>Methodology</button>
          </div>
        </header>
        {body}
      </main>
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

import { useMemo, useState } from 'react';
import ProFeatureGate from './ProFeatureGate.jsx';
import { SOURCE_NAMES } from '../mobile/data/healthConnections.js';
import { buildDashboard, formatMetric, isFlat, RANGES } from '../health/dashboard.js';
import { buildInsights } from '../health/insights.js';
import { estimatePhase, PHASE_SOURCES } from '../health/phase.js';
import { DEV_DEMO_CONNECTIONS, devDemoRows } from '../health/devDemo.js';
import { DEV_HEALTH_DEMO, localToday } from '../mobile/hooks/useHealthData.js';
import HealthBento from '../mobile/components/HealthBento.jsx';
import HealthChart, { CycleRing } from '../mobile/components/HealthChart.jsx';
import '../styles/web-health.css';

/**
 * Website "Your health" (/health): the app's health dashboard laid out for
 * desktop. Same rows, same rules (src/health/dashboard.js, insights.js,
 * phase.js): compared only with her own usual, never a diagnosis, a card
 * only when its data exists.
 *
 * Phone data (Apple Health / Health Connect) is synced by the app to
 * /api/health-data, so a signed-in account's rows are readable here too.
 * Manual uploads and Oura from /health-data count as data as well.
 * Signed out, or signed in with nothing yet: a locked preview pointing to the app.
 */

// The ayna iPhone beta (TestFlight public link). public/ayna-beta-qr.svg is
// a QR code of this same address: regenerate it if the link changes.
const BETA_URL = 'https://testflight.apple.com/join/f3C9PypD';

const DEFAULT_PINS = ['sleep_minutes', 'resting_hr_bpm', 'steps', 'readiness_score'];
const sourceNames = (sources) => sources.map((s) => SOURCE_NAMES[s] || s).join(' and ');
const fmtLongDay = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

function Delta({ metric, delta, week }) {
  const wk = week != null ? `This week ${formatMetric(metric, week)}` : null;
  if (delta == null) return <p className="ay-wh-delta is-none">{wk ? `${wk}. ` : ''}Building your usual</p>;
  if (isFlat(metric, delta)) return <p className="ay-wh-delta">{wk ? `${wk}, about` : 'About'} your usual</p>;
  return <p className="ay-wh-delta">{wk ? `${wk}, ` : ''}{formatMetric(metric, delta, { signed: true }).replace(/^[+-]/, '')} {delta > 0 ? 'above' : 'below'} your usual</p>;
}

function LockIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="3" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></svg>;
}

/** A drawing of the dashboard's layout. No numbers: nothing here is anyone's data. */
function LockedIllustration() {
  const bars = [0.55, 0.7, 0.45, 0.8, 0.6, 0.75, 0.5, 0.65, 0.85, 0.6, 0.7, 0.9];
  return (
    <div className="ay-wh-ghost" aria-hidden="true">
      <div className="ay-wh-ghost-hello"><i /><i /></div>
      <div className="ay-wh-ghost-row">
        <div className="ay-wh-ghost-cycle">
          <span><i /><i /><i /></span>
          <CycleRing cycleDay={null} avgLength={28} periodLength={5} />
        </div>
        <div className="ay-wh-ghost-coming"><i /><b /><b /><b /></div>
      </div>
      <div className="ay-wh-ghost-phase"><span className="is-period" /><span className="is-follicular" /><span className="is-ovulation" /><span className="is-luteal" /></div>
      <div className="ay-wh-ghost-grid">
        {['sky', 'ink', 'butter', 'pink'].map((tone, t) => (
          <div key={tone} className={`is-${tone}`}>
            <i /><i />
            <svg viewBox="0 0 100 40" preserveAspectRatio="none">
              {bars.map((h, i) => <rect key={i} x={i * 8.3 + 1.5} y={40 - ((h + t * 0.03) % 1) * 36} width="5" height={((h + t * 0.03) % 1) * 36} rx="2.5" />)}
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
}

function Locked({ signedIn, connected, onSignIn, onOpenConnections }) {
  const waiting = signedIn && connected;
  return (
    <div className="ay-wh-locked">
      <LockedIllustration />
      <div className="ay-wh-lockpanel" role="region" aria-labelledby="ay-wh-lock-title">
        <span className="ay-wh-lockicon"><LockIcon /></span>
        {waiting ? (
          <>
            <h2 id="ay-wh-lock-title">Your dashboard fills in after the first sync</h2>
            <p>You're connected. Open the ayna app so it can send your latest days, then come back here.</p>
            <div className="ay-wh-lockactions">
              <button type="button" className="ay-wh-btn" onClick={onOpenConnections}>Manage connected apps</button>
            </div>
          </>
        ) : (
          <>
            <span className="ay-wh-pro">ayna Pro</span>
            <h2 id="ay-wh-lock-title">Bring your health data together</h2>
            <p>Your cycle day and phase, sleep, resting heart rate and steps, each next to your own usual.</p>
            <p>Connect your supported apps and wearables to bring your data together here.</p>
            <div className="ay-wh-lockjoin">
              <figure className="ay-wh-qr">
                <img src="/ayna-beta-qr.svg" width="132" height="132" alt={`QR code for the ayna beta on TestFlight: ${BETA_URL}`} />
                <figcaption>Scan with your iPhone camera</figcaption>
              </figure>
              <div className="ay-wh-lockactions">
                <a className="ay-wh-btn" href={BETA_URL} target="_blank" rel="noopener noreferrer">Join the beta</a>
                {signedIn
                  ? <button type="button" className="ay-wh-btn is-quiet" onClick={onOpenConnections}>Upload a file or connect Oura</button>
                  : <button type="button" className="ay-wh-btn is-quiet" onClick={onSignIn}>Sign in</button>}
              </div>
            </div>
            <p className="ay-wh-locknote">
              {signedIn
                ? 'Already testing? Connect Apple Health in the app with this same account, and your dashboard shows up here.'
                : 'Already testing? Connect Apple Health in the app, then sign in here with the same account.'}
            </p>
            {/* TODO: link "On Android?" to an Android waitlist page once one exists (none in the site yet). */}
            <p className="ay-wh-locknote is-small">On Android? The beta is iPhone only for now.</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function WebHealth(props) {
  return <ProFeatureGate feature="dashboard" onEcosystem={props.onEcosystem}><WebHealthContent {...props} /></ProFeatureGate>;
}

function WebHealthContent({ user, health, onSignIn, onOpenConnections }) {
  // DEVELOPMENT ONLY (?healthdemo=1 on the local dev server, signed out):
  // the made-up demo rows from devDemo.js, so the unlocked layout can be
  // checked without an account. import.meta.env.DEV is false in production builds.
  const demo = DEV_HEALTH_DEMO && !user;
  const today = localToday();
  const demoData = useMemo(() => {
    if (!demo) return null;
    const rows = devDemoRows(today);
    return { status: 'ready', insightRows: rows, connected: DEV_DEMO_CONNECTIONS, insights: buildInsights(rows, { today }) };
  }, [demo, today]);
  const h = demoData || health || { status: 'idle', insightRows: [], connected: [], insights: { sections: [] } };

  const [range, setRange] = useState('month');
  const [area, setArea] = useState(null);
  const days = RANGES.find((r) => r.id === range).days;
  const rows = h.insightRows || [];
  // Plain calls: the React Compiler memoizes these (manual useMemo here trips it).
  const dash = buildDashboard(rows, { days, today });
  const week = buildDashboard(rows, { days: 30, today });
  const sections = h.insights?.sections || [];
  const ready = sections.filter((s) => s.status === 'ready');
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;
  const sources = [...new Set(sections.flatMap((s) => s.sources))];
  const signedIn = Boolean(user?.id) || demo;
  const hasData = rows.length > 0 && !(dash.empty && week.empty && !sections.length);
  const name = demo ? '' : (user?.user_metadata?.first_name || user?.user_metadata?.name || '').split(' ')[0];

  const header = (
    <header className="ay-wh-top">
      <h1 id="ay-wh-title" className="sr-only">Your health</h1>
      <p className="ay-wh-kicker" aria-hidden="true"><b>Your health</b><span>{fmtLongDay(today)}</span></p>
      {signedIn && hasData && onOpenConnections && <button type="button" className="ay-wh-btn is-quiet is-small" onClick={onOpenConnections}>Connected apps</button>}
    </header>
  );

  if (signedIn && (h.status === 'loading' || h.status === 'idle') && !rows.length) {
    return (
      <section className="ay-wh" aria-labelledby="ay-wh-title" aria-busy="true">
        {header}
        <div className="ay-wh-loading" role="status"><i /><i /><i /><span>Loading your health data</span></div>
      </section>
    );
  }
  if (signedIn && h.status === 'error' && !rows.length) {
    return (
      <section className="ay-wh" aria-labelledby="ay-wh-title">
        {header}
        <div className="ay-wh-error">
          <h2>We couldn't load your health data</h2>
          <p>Nothing was changed. Check your connection and try again.</p>
          <button type="button" className="ay-wh-btn" onClick={() => h.refresh?.()}>Try again</button>
        </div>
      </section>
    );
  }
  if (!signedIn || !hasData) {
    return (
      <section className="ay-wh is-locked" aria-labelledby="ay-wh-title">
        {header}
        <Locked signedIn={signedIn} connected={(h.connected || []).length > 0} onSignIn={onSignIn} onOpenConnections={onOpenConnections} />
      </section>
    );
  }

  const allCharts = week.groups.flatMap((g) => g.charts.map((c) => ({ ...c, group: g.id })));
  const pinned = DEFAULT_PINS.map((m) => allCharts.find((c) => c.metric === m)).filter(Boolean);
  const cycle = week.cycle?.cycleDay ? week.cycle : null;
  const phase = cycle ? estimatePhase(cycle) : null;
  const areas = [
    ...(week.cycle ? [{ id: 'cycle', label: 'Cycle' }] : []),
    ...dash.groups.map((g) => ({ id: g.id, label: g.label })),
  ];
  const current = areas.some((a) => a.id === area) ? area : areas[0]?.id;
  const openArea = (id) => {
    setArea(id);
    window.setTimeout(() => document.getElementById('ay-wh-areas')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  return (
    <section className="ay-wh" aria-labelledby="ay-wh-title">
      {header}
      <div className="ay-wh-bento" data-count={pinned.length} data-cycle={cycle ? 'yes' : 'no'}>
        <HealthBento name={name} week={week} cycle={cycle} estimate={estimate} pinnedCharts={pinned} ready={ready} today={today} onOpenArea={openArea} />
      </div>

      {ready.length > 0 && (
        <section className="ay-wh-week" aria-labelledby="ay-wh-week-title">
          <div className="ay-wh-week-head">
            <h2 id="ay-wh-week-title">Your week, in short</h2>
            {sources.length > 0 && <p>From {sourceNames(sources)}. Trends, not diagnoses.</p>}
          </div>
          <ul className="ay-wh-lines">
            {ready.map((s) => (
              <li key={s.id}>
                <b>{s.title}</b>
                <span>{s.plain || s.explanation || s.headline}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {areas.length > 0 && (
        <section className="ay-wh-areas" id="ay-wh-areas" aria-labelledby="ay-wh-areas-title">
          <div className="ay-wh-areas-head">
            <h2 id="ay-wh-areas-title">Charts</h2>
            <div className="ay-wh-tabs" role="tablist" aria-label="Health areas">
              {areas.map((a) => <button key={a.id} type="button" role="tab" aria-selected={current === a.id} className={current === a.id ? 'is-on' : ''} onClick={() => setArea(a.id)}>{a.label}</button>)}
            </div>
            <div className="ay-wh-range" role="tablist" aria-label="Time range">
              {RANGES.map((r) => <button key={r.id} type="button" role="tab" aria-selected={range === r.id} className={range === r.id ? 'is-on' : ''} onClick={() => setRange(r.id)}>{r.label}</button>)}
            </div>
          </div>

          <div className="ay-wh-charts">
            {current === 'cycle' && dash.cycle && dash.cycle.lengths.length >= 2 && (
              <article className="ay-wh-chart">
                <h3>Cycle length</h3>
                <p className="ay-wh-avg">{dash.cycle.avgLength} days <span>average of your last {dash.cycle.lengths.length}</span></p>
                <HealthChart chart={{ metric: 'cycle_length', label: 'Cycle length', type: 'bar', usual: null, points: dash.cycle.lengths.map((c) => ({ day: c.start, value: c.days })) }} />
                {dash.cycle.sources.length > 0 && <p className="ay-wh-from">From {sourceNames(dash.cycle.sources)}</p>}
              </article>
            )}
            {current === 'cycle' && phase && (
              <article className="ay-wh-chart is-about">
                <h3>How we estimate your phase</h3>
                <p>{phase.basis}</p>
                {estimate && <p>{estimate.basis}</p>}
                <p className="ay-wh-from">Sources: {PHASE_SOURCES.map((src, i) => <span key={src.url}>{i ? ', ' : ''}<a href={src.url} target="_blank" rel="noopener noreferrer">{src.label}</a></span>)}</p>
              </article>
            )}
            {current === 'cycle' && !(dash.cycle && dash.cycle.lengths.length >= 2) && !phase && (
              <p className="ay-wh-note">Log a few more periods and ayna can chart your cycle length.</p>
            )}
            {dash.groups.filter((g) => g.id === current).map((g) => g.charts.map((c) => (
              <article key={c.metric} className="ay-wh-chart">
                <h3>{c.label}</h3>
                <p className="ay-wh-avg">{formatMetric(c.metric, c.avg)} <span>average, last {days} days</span></p>
                <Delta metric={c.metric} delta={c.delta} week={c.week} />
                <HealthChart chart={c} />
                {c.sources.length > 0 && <p className="ay-wh-from">From {sourceNames(c.sources)}</p>}
              </article>
            )))}
            {current !== 'cycle' && !dash.groups.some((g) => g.id === current) && <p className="ay-wh-note">No readings in the last {days} days. Try a longer range.</p>}
          </div>
        </section>
      )}

      <p className="ay-wh-foot">These describe your data. They aren't medical advice. If something worries you, talk to a clinician.</p>
    </section>
  );
}

import { useMemo, useState } from 'react';
import { SOURCE_NAMES } from '../data/healthConnections.js';
import { buildDashboard, formatMetric, isFlat, RANGES } from '../../health/dashboard.js';
import { localToday, useHealthData } from '../hooks/useHealthData.js';
import HealthChart, { CycleRing, Spark } from './HealthChart.jsx';
import HealthBento from './HealthBento.jsx';
import { estimatePhase, PHASE_SOURCES } from '../../health/phase.js';
import '../screens/profile/health-connections.css';

/**
 * Your health (You -> Health). Read top to bottom in this order:
 * 1. Where she is in her cycle (a ring, like Clue's overview).
 * 2. This week in four tiles, each with one plain word against her usual.
 * 3. What changed, in one line each.
 * 4. Goals her data suggests (added only when she taps).
 * 5. Charts, one per area, with the rest one tap away.
 * Compared only with her own usual. Never a diagnosis.
 */

const sourceNames = (sources) => sources.map((s) => SOURCE_NAMES[s] || s).join(' and ');
const fmtDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
// Her dashboard layout (what's pinned, what's main): a display preference kept
// on this device, never health data.
const LAYOUT_KEY = 'ayna_health_layout_v1';
const DEFAULT_PINS = ['cycle', 'sleep_minutes', 'resting_hr_bpm', 'steps', 'readiness_score'];
function loadLayout() {
  try { const v = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null'); return v && Array.isArray(v.pins) ? v : { pins: null, main: null }; } catch { return { pins: null, main: null }; }
}
function saveLayout(v) { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(v)); } catch { /* storage blocked: layout lasts this visit */ } }

const SUGGEST_LABEL = { 'sleep.trouble': 'sleep', 'cycle.irregular': 'irregular cycles', 'energy.fatigue': 'low energy' };

/** This week against her usual, with both numbers, so the change matches what it compares. */
function Delta({ metric, delta, week = null }) {
  const wk = week != null ? `This week ${formatMetric(metric, week)}` : null;
  if (delta == null) return <span className="ay-hd-delta is-none">{wk ? `${wk}. ` : ''}Building your usual</span>;
  if (isFlat(metric, delta)) return <span className="ay-hd-delta is-flat">{wk ? `${wk}, about` : 'About'} your usual</span>;
  return <span className="ay-hd-delta">{wk ? `${wk}, ` : ''}<span aria-hidden="true">{delta > 0 ? '↑' : '↓'} </span>{formatMetric(metric, delta, { signed: true }).replace(/^[+-]/, '')} {delta > 0 ? 'above' : 'below'} your usual</span>;
}

function CycleHero({ cycle, estimate }) {
  const phase = estimatePhase(cycle);
  return (
    <section className="ay-hd-hero" aria-labelledby="ay-hd-hero-title">
      <div className="ay-hd-ring-wrap">
        <CycleRing cycleDay={cycle.cycleDay} avgLength={cycle.avgLength} periodLength={cycle.periodLength} windowStart={phase?.windowStart} windowEnd={phase?.windowEnd} />
        <div className="ay-hd-ring-center">
          <span>Cycle day</span>
          <b id="ay-hd-hero-title">{cycle.cycleDay}</b>
          {cycle.avgLength && <span>of about {cycle.avgLength}</span>}
        </div>
      </div>
      {phase && (
        <div className="ay-hd-phase">
          <p className="ay-hd-phase-name"><span>{phase.id === 'period' ? 'You are on your' : 'You are probably in your'}</span><b>{phase.name === 'Around ovulation' ? 'ovulation window' : phase.name.toLowerCase()}</b></p>
          <p className="ay-hd-phase-what">{phase.what}</p>
        </div>
      )}
      <ul className="ay-hd-legend" aria-hidden="true"><li><i className="is-period" />Period</li>{phase?.windowStart && <li><i className="is-window" />Likely ovulation</li>}<li><i className="is-today" />Today</li></ul>
      {estimate
        ? <p className="ay-hd-hero-next"><b>Next period around {fmtDay(estimate.day)}</b></p>
        : <p className="ay-hd-hero-next"><span>Log a few more periods and ayna can estimate your next one.</span></p>}
      {phase && (
        <details className="ay-hd-about">
          <summary>How we estimate this</summary>
          <p>{phase.basis}</p>
          {estimate && <p>{estimate.basis}</p>}
          <p>Sources: {PHASE_SOURCES.map((src, i) => <span key={src.url}>{i ? ', ' : ''}<a href={src.url} target="_blank" rel="noopener noreferrer">{src.label}</a></span>)}</p>
        </details>
      )}
    </section>
  );
}


export default function HealthDashboard({ authUser, userName = '', selectedNeedIds = [], onConnect, onAddGoal, onOpenRoutine, onSignIn }) {
  const health = useHealthData(authUser?.id || null, selectedNeedIds);
  const [range, setRange] = useState('month');
  const [added, setAdded] = useState({});
  const [view, setView] = useState('summary');
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState(loadLayout);
  const days = RANGES.find((r) => r.id === range).days;
  const today = localToday();
  const dash = useMemo(() => buildDashboard(health.insightRows || [], { days, today }), [health.insightRows, days, today]);
  const week = useMemo(() => buildDashboard(health.insightRows || [], { days: 30, today }), [health.insightRows, today]);
  const { sections } = health.insights;
  const ready = sections.filter((s) => s.status === 'ready');
  const suggestions = health.matchContext?.suggestions || [];
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;
  const sources = [...new Set(sections.flatMap((s) => s.sources))];

  if (!authUser?.id) {
    return (
      <div className="ay-hd-empty">
        <CycleRing cycleDay={null} avgLength={28} periodLength={0} />
        <h2>Your health, in one place</h2>
        <p>Sign in to connect your apps and wearables. Your cycle, sleep, heart and activity show up here, compared with your own usual.</p>
        {onSignIn && <button type="button" className="ay-qc-primary" onClick={onSignIn}>Sign in</button>}
      </div>
    );
  }
  if (health.status === 'loading') return <p className="ay-hc-intro" role="status">Loading your health data…</p>;
  if (dash.empty && !sections.length && week.empty) {
    return (
      <div className="ay-hd-empty">
        <CycleRing cycleDay={null} avgLength={28} periodLength={0} />
        <h2>Your health, in one place</h2>
        <p>Connect an app or wearable, or upload a file. Your cycle, sleep, heart and activity show up here, compared with your own usual.</p>
        <button type="button" className="ay-qc-primary" onClick={onConnect}>Connect health data</button>
      </div>
    );
  }
  const add = (needId) => { if (onAddGoal?.(needId)) setAdded((a) => ({ ...a, [needId]: true })); };

  // Everything she can pin: the cycle ring plus every metric with data.
  const allCharts = week.groups.flatMap((g) => g.charts.map((c) => ({ ...c, group: g.id })));
  const items = [
    ...(week.cycle?.cycleDay ? [{ id: 'cycle', label: 'Cycle', group: 'cycle' }] : []),
    ...allCharts.map((c) => ({ id: c.metric, label: c.label, group: c.group, chart: c })),
  ];
  const itemIds = items.map((i) => i.id);
  const pinned = (layout.pins || DEFAULT_PINS).filter((id) => itemIds.includes(id));
  const mainId = itemIds.includes(layout.main) ? layout.main : (pinned[0] || itemIds[0]);
  const areas = [
    { id: 'summary', label: 'Summary' },
    ...(week.cycle ? [{ id: 'cycle', label: 'Cycle' }] : []),
    ...dash.groups.map((g) => ({ id: g.id, label: g.label })),
  ];
  const area = areas.some((a) => a.id === view) ? view : 'summary';
  const save = (next) => { setLayout(next); saveLayout(next); };
  const togglePin = (id) => save({ ...layout, pins: pinned.includes(id) ? pinned.filter((x) => x !== id) : [...pinned, id], main: mainId });
  const itemById = Object.fromEntries(items.map((i) => [i.id, i]));

  return (
    <div className="ay-hd">
      <div className="ay-hd-areas" role="tablist" aria-label="Health areas">
        {areas.map((a) => <button key={a.id} type="button" role="tab" aria-selected={area === a.id} className={area === a.id ? 'is-on' : ''} onClick={() => setView(a.id)}>{a.label}</button>)}
      </div>

      {area === 'summary' && (
        <>
          {!editing && (
            <HealthBento
              name={(userName || authUser?.user_metadata?.first_name || authUser?.user_metadata?.name || '').split(' ')[0]}
              week={week}
              cycle={week.cycle?.cycleDay ? week.cycle : null}
              estimate={estimate}
              pinnedCharts={pinned.filter((id) => id !== 'cycle').map((id) => itemById[id]?.chart && { ...itemById[id].chart, group: itemById[id].group }).filter(Boolean)}
              ready={ready}
              today={today}
              onOpenArea={setView}
            />
          )}
          <section aria-labelledby="ay-hd-pinned" className="ay-hd-pinsec">
            <div className="ay-hd-pinhead">
              <h2 id="ay-hd-pinned" className="ay-hd-h2">{editing ? 'Choose what shows first' : 'Customize'}</h2>
              <button type="button" className="ay-hd-edit" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>{editing ? 'Done' : 'Edit'}</button>
            </div>
            {editing && (
              <ul className="ay-hd-editlist" aria-label="Choose what shows here">
                {items.map((it) => (
                  <li key={it.id}>
                    <span>{it.label}</span>
                    <button type="button" role="switch" aria-checked={pinned.includes(it.id)} aria-label={`Show ${it.label}`} className="ay-hc-switch" onClick={() => togglePin(it.id)}><span /></button>
                  </li>
                ))}
              </ul>
            )}
            {!editing && <p className="ay-hd-small">Last 7 days next to your usual. Tap a card for its charts.</p>}
          </section>

          {ready.length > 0 && (
            <section aria-labelledby="ay-hd-changed">
              <h2 id="ay-hd-changed" className="ay-hd-h2">Your week, in short</h2>
              <ul className="ay-hd-lines">
                {ready.map((s) => {
                  const boosted = s.signal && health.matchContext?.byNeed?.[s.signal.needId];
                  return (
                    <li key={s.id} className={`is-${s.id}`}>
                      <b>{s.title}</b>
                      <span>{s.plain || s.explanation || s.headline}</span>
                      {boosted && <small>Because {SUGGEST_LABEL[s.signal.needId] || 'this'} is one of your goals, those picks rank a little higher for you right now.</small>}
                    </li>
                  );
                })}
              </ul>
              {sources.length > 0 && <p className="ay-hd-small">From {sourceNames(sources)}. Trends, not diagnoses.</p>}
            </section>
          )}

          {suggestions.length > 0 && onAddGoal && (
            <section className="ay-hd-suggest" aria-labelledby="ay-hd-suggest-title">
              <h2 id="ay-hd-suggest-title" className="ay-hd-h2">Something to add?</h2>
              {suggestions.map((s) => (
                <div key={s.needId} className="ay-hd-suggest-item">
                  <p>{s.summary}. Want ayna to match you for {SUGGEST_LABEL[s.needId] || 'it'} too?</p>
                  {added[s.needId]
                    ? <p className="ay-hd-added" role="status">Added. Your matches now include {SUGGEST_LABEL[s.needId] || 'it'}.</p>
                    : <button type="button" className="ay-hc-primary" onClick={() => add(s.needId)}>Add {SUGGEST_LABEL[s.needId] || 'it'} to my goals</button>}
                </div>
              ))}
            </section>
          )}

          {onOpenRoutine && <button type="button" className="ay-hd-routine-link" onClick={onOpenRoutine}><span><b>Your routine and shopping list</b><small>Built from your matches and your data</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>}
        </>
      )}

      {area !== 'summary' && (
        <section aria-label={areas.find((a) => a.id === area)?.label} className="ay-hd-charts">
          <div className="ay-hd-range" role="tablist" aria-label="Time range">
            {RANGES.map((r) => <button key={r.id} type="button" role="tab" aria-selected={range === r.id} className={range === r.id ? 'is-on' : ''} onClick={() => setRange(r.id)}>{r.label}</button>)}
          </div>
          {area === 'cycle' && week.cycle?.cycleDay && <CycleHero cycle={week.cycle} estimate={estimate} />}
          {area === 'cycle' && dash.cycle && dash.cycle.lengths.length >= 2 && (
            <article className="ay-hd-card">
              <header>
                <h3>Cycle length</h3>
                <p className="ay-hd-avg">{dash.cycle.avgLength} days <span>average of your last {dash.cycle.lengths.length}</span></p>
              </header>
              <HealthChart chart={{ metric: 'cycle_length', label: 'Cycle length', type: 'bar', usual: null, points: dash.cycle.lengths.map((c) => ({ day: c.start, value: c.days })) }} />
              {dash.cycle.sources.length > 0 && <p className="ay-hd-from">From {sourceNames(dash.cycle.sources)}</p>}
            </article>
          )}
          {dash.groups.filter((g) => g.id === area).map((g) => g.charts.map((c) => (
            <article key={c.metric} className="ay-hd-card">
              <header>
                <h3>{c.label}</h3>
                <p className="ay-hd-avg">{formatMetric(c.metric, c.avg)} <span>average, last {days} days</span></p>
                <Delta metric={c.metric} delta={c.delta} week={c.week} />
              </header>
              <HealthChart chart={c} />
              {c.sources.length > 0 && <p className="ay-hd-from">From {sourceNames(c.sources)}</p>}
            </article>
          )))}
          {area !== 'cycle' && !dash.groups.some((g) => g.id === area) && <p className="ay-hc-intro">No readings in the last {days} days. Try a longer range.</p>}
        </section>
      )}

      <p className="ay-hd-small">These describe your data. They aren't medical advice. If something worries you, talk to a clinician.</p>
      <button type="button" className="ay-hc-ghost" onClick={onConnect}>Manage connected apps</button>
    </div>
  );
}

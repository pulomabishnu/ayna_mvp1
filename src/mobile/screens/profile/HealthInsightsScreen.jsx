import { useMemo, useState } from 'react';
import { SOURCE_NAMES } from '../../data/healthConnections.js';
import { buildDashboard, formatMetric, isFlat, RANGES } from '../../../health/dashboard.js';
import { localToday, useHealthData } from '../../hooks/useHealthData.js';
import HealthChart, { CycleRing, Spark } from '../../components/HealthChart.jsx';
import { estimatePhase, PHASE_SOURCES } from '../../../health/phase.js';
import './health-connections.css';

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
const SUGGEST_LABEL = { 'sleep.trouble': 'sleep', 'cycle.irregular': 'irregular cycles', 'energy.fatigue': 'energy' };

function Delta({ metric, delta }) {
  if (delta == null) return <span className="ay-hd-delta is-none">Building your usual</span>;
  if (isFlat(metric, delta)) return <span className="ay-hd-delta is-flat">About your usual</span>;
  return <span className="ay-hd-delta"><span aria-hidden="true">{delta > 0 ? '↑' : '↓'} </span>{formatMetric(metric, delta, { signed: true }).replace(/^[+-]/, '')} {delta > 0 ? 'above' : 'below'} your usual</span>;
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

function ChartGroup({ group, days }) {
  const [first, ...rest] = group.charts;
  const card = (c) => (
    <article key={c.metric} className="ay-hd-card">
      <header>
        <h3>{c.label}</h3>
        <p className="ay-hd-avg">{formatMetric(c.metric, c.avg)} <span>average, last {days} days</span></p>
        <Delta metric={c.metric} delta={c.delta} />
      </header>
      <HealthChart chart={c} />
      {c.sources.length > 0 && <p className="ay-hd-from">From {sourceNames(c.sources)}</p>}
    </article>
  );
  return (
    <section className="ay-hd-group" aria-labelledby={`ay-hd-${group.id}`}>
      <h2 id={`ay-hd-${group.id}`}>{group.label}</h2>
      {card(first)}
      {rest.length > 0 && (
        <details className="ay-hd-more">
          <summary>{rest.length === 1 ? `Show ${rest[0].label.charAt(0).toLowerCase()}${rest[0].label.slice(1)}` : `Show ${rest.length} more ${group.label.toLowerCase()} charts`}</summary>
          <div className="ay-hd-more-body">{rest.map(card)}</div>
        </details>
      )}
    </section>
  );
}

export default function HealthInsightsScreen({ authUser, selectedNeedIds = [], onConnect, onAddGoal, onOpenRoutine }) {
  const health = useHealthData(authUser?.id || null, selectedNeedIds);
  const [range, setRange] = useState('month');
  const [added, setAdded] = useState({});
  const days = RANGES.find((r) => r.id === range).days;
  const today = localToday();
  const dash = useMemo(() => buildDashboard(health.insightRows || [], { days, today }), [health.insightRows, days, today]);
  const week = useMemo(() => buildDashboard(health.insightRows || [], { days: 30, today }), [health.insightRows, today]);
  const { sections } = health.insights;
  const ready = sections.filter((s) => s.status === 'ready');
  const suggestions = health.matchContext?.suggestions || [];
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;
  const sources = [...new Set(sections.flatMap((s) => s.sources))];

  if (!authUser?.id) return <p className="ay-hc-intro">Sign in to see charts from your connected health data.</p>;
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
  return (
    <div className="ay-hd">
      {week.cycle?.cycleDay && <CycleHero cycle={week.cycle} estimate={estimate} />}

      {week.tiles.filter((t) => t.metric).length > 0 && (
        <section aria-labelledby="ay-hd-week">
          <h2 id="ay-hd-week" className="ay-hd-h2">This week</h2>
          <ul className="ay-hd-tiles">
            {week.tiles.filter((t) => t.metric).map((t) => (
              <li key={t.id} className={`is-${t.word.toLowerCase()}`}>
                <span className="ay-hd-tile-label">{t.label}</span>
                <b>{t.value}</b>
                <Spark points={t.points} />
                <span className="ay-hd-word">{t.word}</span>
              </li>
            ))}
          </ul>
          <p className="ay-hd-small">Last 7 days compared with the 4 weeks before.</p>
        </section>
      )}

      {ready.length > 0 && (
        <section aria-labelledby="ay-hd-changed">
          <h2 id="ay-hd-changed" className="ay-hd-h2">In plain words</h2>
          <ul className="ay-hd-lines">
            {ready.map((s) => (
              <li key={s.id} className={`is-${s.id}`}>
                <b>{s.title}</b>
                <span>{s.explanation || s.headline}</span>
                {s.change && s.change.direction !== 'flat' && <small>{s.change.text}</small>}
              </li>
            ))}
          </ul>
          {sources.length > 0 && <p className="ay-hd-small">From {sourceNames(sources)}. Trends, not diagnoses.</p>}
        </section>
      )}

      {suggestions.length > 0 && onAddGoal && (
        <section className="ay-hd-suggest" aria-labelledby="ay-hd-suggest-title">
          <h2 id="ay-hd-suggest-title" className="ay-hd-h2">Worth adding to your goals?</h2>
          {suggestions.map((s) => (
            <div key={s.needId} className="ay-hd-suggest-item">
              <p>{s.summary}. Add {SUGGEST_LABEL[s.needId] || 'it'} and ayna will match you for it too.</p>
              {added[s.needId]
                ? <p className="ay-hd-added" role="status">Added. Your matches now include {SUGGEST_LABEL[s.needId] || 'it'}.</p>
                : <button type="button" className="ay-hc-primary" onClick={() => add(s.needId)}>Add {SUGGEST_LABEL[s.needId] || 'it'}</button>}
            </div>
          ))}
        </section>
      )}

      {onOpenRoutine && <button type="button" className="ay-hd-routine-link" onClick={onOpenRoutine}><span><b>Your routine and shopping list</b><small>Built from your matches and your data</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>}

      <section aria-labelledby="ay-hd-charts" className="ay-hd-charts">
        <div className="ay-hd-charts-head">
          <h2 id="ay-hd-charts" className="ay-hd-h2">Charts</h2>
          <div className="ay-hd-range" role="tablist" aria-label="Time range">
            {RANGES.map((r) => <button key={r.id} type="button" role="tab" aria-selected={range === r.id} className={range === r.id ? 'is-on' : ''} onClick={() => setRange(r.id)}>{r.label}</button>)}
          </div>
        </div>
        {dash.cycle && dash.cycle.lengths.length >= 2 && (
          <section className="ay-hd-group" aria-labelledby="ay-hd-cycle">
            <h2 id="ay-hd-cycle">Cycle</h2>
            <article className="ay-hd-card">
              <header>
                <h3>Cycle length</h3>
                <p className="ay-hd-avg">{dash.cycle.avgLength} days <span>average of your last {dash.cycle.lengths.length}</span></p>
              </header>
              <HealthChart chart={{ metric: 'cycle_length', label: 'Cycle length', type: 'bar', usual: null, points: dash.cycle.lengths.map((c) => ({ day: c.start, value: c.days })) }} />
              {dash.cycle.sources.length > 0 && <p className="ay-hd-from">From {sourceNames(dash.cycle.sources)}</p>}
            </article>
          </section>
        )}
        {dash.groups.map((g) => <ChartGroup key={g.id} group={g} days={days} />)}
        {dash.empty && <p className="ay-hc-intro">No readings in the last {days} days. Try a longer range.</p>}
      </section>

      <p className="ay-hd-small">These describe your data. They aren't medical advice. If something worries you, talk to a clinician.</p>
      <button type="button" className="ay-hc-ghost" onClick={onConnect}>Manage connected apps</button>
    </div>
  );
}

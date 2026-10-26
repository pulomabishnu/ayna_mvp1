import { useId, useRef, useState } from 'react';
import { estimatePhase } from '../../health/phase.js';
import { chartSummary, lastDays, short } from '../../health/dashView.js';
import { Meter, SourceLink } from './HealthBento.jsx';
import { displayName } from '../utils/displayName.js';

/**
 * The dashboard's parts (dashboard audit Oct 25, section 14), app and website.
 * Calm register for health content: white surface, ink rule, Figtree, no pink.
 * Blue (data-blue) is for chart lines only. Every chart has a text summary
 * and a table. Nothing here invents a number: each part renders nothing
 * when its data is missing.
 */

const DAY = 86400000;
const toTime = (day) => Date.parse(`${day}T00:00:00Z`);
const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const uniq = (list) => (list || []).filter((s, i, all) => s?.url && all.findIndex((x) => x.url === s.url) === i);

/** Pill tabs (PDP style): roles, arrow keys, Home and End. Full-width segmented on phones (CSS). */
export function PillTabs({ tabs, value, onChange, label, idBase, className = '' }) {
  const refs = useRef({});
  const key = (e, i) => {
    const n = tabs.length;
    const to = e.key === 'ArrowRight' ? (i + 1) % n : e.key === 'ArrowLeft' ? (i - 1 + n) % n : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : null;
    if (to == null) return;
    e.preventDefault();
    onChange(tabs[to].id);
    refs.current[tabs[to].id]?.focus();
  };
  return (
    <div className={`ay-db-tabs ${className}`.trim()} role="tablist" aria-label={label} style={{ '--n': tabs.length }}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => { refs.current[t.id] = el; }}
          type="button"
          role="tab"
          id={`${idBase}-tab-${t.id}`}
          aria-controls={`${idBase}-panel`}
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => key(e, i)}
        >{t.label}</button>
      ))}
    </div>
  );
}

/** A range switch (7 / 30 / 90 days) in the same pill style, as toggle buttons. */
export function RangePills({ ranges, value, onChange }) {
  return (
    <div className="ay-db-range" role="group" aria-label="Time range">
      {ranges.map((r) => <button key={r.id} type="button" aria-pressed={value === r.id} onClick={() => onChange(r.id)}>{r.label}</button>)}
    </div>
  );
}

/**
 * 7-point sparkline: data-blue line, her usual band (25th to 75th percentile)
 * in butter-deep, today's dot in espresso. role="img" with a summary.
 */
export function Sparkline({ points, band = null, label = '', metric, w = 140, h = 22 }) {
  const pts = (points || []).filter((p) => p.value != null);
  if (pts.length < 2) return null;
  const vals = pts.map((p) => p.value).concat(band ? [band.lo, band.hi] : []);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const pad = 3;
  const x = (i) => pad + (i / (pts.length - 1)) * (w - pad * 2);
  const y = (v) => pad + (1 - (v - lo) / span) * (h - pad * 2);
  const last = pts[pts.length - 1];
  const aria = `${label}: last ${pts.length} days from ${short(metric, Math.min(...pts.map((p) => p.value)))} to ${short(metric, Math.max(...pts.map((p) => p.value)))}${band ? `; your usual range ${short(metric, band.lo)} to ${short(metric, band.hi)}` : ''}.`;
  return (
    <svg className="ay-db-spark" viewBox={`0 0 ${w} ${h}`} width={w} height={h} preserveAspectRatio="none" role="img" aria-label={aria}>
      {band && <rect className="ay-db-band" x="0" width={w} y={y(band.hi)} height={Math.max(1, y(band.lo) - y(band.hi))} rx="2" />}
      <polyline className="ay-db-line" points={pts.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} pathLength="1" />
      <circle className="ay-db-today" cx={x(pts.length - 1)} cy={y(last.value)} r="2.5" />
    </svg>
  );
}

/**
 * An area's chart: bars (nightly amounts) or a line (levels), her usual band
 * shaded, the last 7 days in espresso and earlier days in data-blue. A
 * one-sentence summary under it and a "Show as table" toggle.
 */
export function AreaChart({ chart, band = null, today, title = null, small = false, summary = null }) {
  const [table, setTable] = useState(false);
  const [active, setActive] = useState(null);
  const id = useId();
  const points = chart?.points || [];
  if (!points.length) return null;
  const W = small ? 280 : 640;
  const H = small ? 72 : 140;
  const P = { l: 2, r: 2, t: 8, b: 4 };
  const vals = points.map((p) => p.value).concat(band ? [band.lo, band.hi] : []).concat(chart.usual != null ? [chart.usual] : []);
  const bar = chart.type === 'bar';
  const lo0 = bar ? 0 : Math.min(...vals);
  const hi0 = Math.max(...vals);
  const pad = bar ? 0 : (hi0 - lo0) * 0.15 || Math.abs(hi0) * 0.05 || 1;
  const min = lo0 - pad;
  const max = hi0 + pad || 1;
  const iw = W - P.l - P.r;
  const ih = H - P.t - P.b;
  const step = iw / points.length;
  const x = (i) => P.l + step * i + step / 2;
  const y = (v) => P.t + ih - ((v - min) / (max - min || 1)) * ih;
  const recentFrom = today ? toTime(today) - 6 * DAY : Infinity;
  const isRecent = (p) => toTime(p.day) >= recentFrom;
  const text = summary || chartSummary(chart, band);
  const shown = active != null ? points[active] : null;
  const key = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setActive((a) => { const cur = a ?? points.length - 1; return e.key === 'ArrowLeft' ? Math.max(0, cur - 1) : Math.min(points.length - 1, cur + 1); });
  };
  const unitWord = chart.metric?.startsWith('sleep') ? 'Night' : 'Day';
  return (
    <figure className={`ay-db-chart${small ? ' is-small' : ''}`} aria-labelledby={title ? `${id}-t` : undefined}>
      {title && <figcaption id={`${id}-t`} className="ay-db-chart-title">{title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={text} tabIndex={0} onKeyDown={key} onBlur={() => setActive(null)}>
        {band && <rect className="ay-db-band" x={P.l} width={iw} y={y(band.hi)} height={Math.max(1, y(band.lo) - y(band.hi))} />}
        {bar
          ? points.map((p, i) => {
            const top = y(p.value);
            const bw = Math.max(1.5, step * 0.62);
            return <rect key={p.day} className={`ay-db-bar${isRecent(p) ? ' is-recent' : ''}${i === active ? ' is-on' : ''}`} x={x(i) - bw / 2} y={top} width={bw} height={Math.max(1.5, P.t + ih - top)} rx={Math.min(2, bw / 2)} onClick={() => setActive(i)} />;
          })
          : <>
            <polyline className="ay-db-line" points={points.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')} vectorEffect="non-scaling-stroke" />
            {points.length > 1 && <polyline className="ay-db-line is-recent" points={points.map((p, i) => (isRecent(p) || (points[i + 1] && isRecent(points[i + 1])) ? `${x(i)},${y(p.value)}` : null)).filter(Boolean).join(' ')} vectorEffect="non-scaling-stroke" />}
          </>}
      </svg>
      <p className="ay-db-readout" aria-live="polite">{shown ? <>{fmtDay(shown.day)}: <b>{short(chart.metric, shown.value)}</b></> : null}</p>
      <p className="ay-db-summary">{text}</p>
      <button type="button" className="ay-db-textbtn" aria-expanded={table} aria-controls={`${id}-table`} onClick={() => setTable((v) => !v)}>{table ? 'Hide table' : 'Show as table'}</button>
      {table && (
        <div className="ay-db-tablewrap" id={`${id}-table`}>
          <table className="ay-db-table">
            <caption className="sr-only">{chart.label}, by {unitWord.toLowerCase()}</caption>
            <thead><tr><th scope="col">{unitWord}</th><th scope="col">{chart.label}</th></tr></thead>
            <tbody>{points.slice().reverse().map((p) => <tr key={p.day}><th scope="row">{fmtDay(p.day)}</th><td>{chart.metric === 'cycle_length' ? `${p.value} days` : short(chart.metric, p.value)}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

/** A number line: her usual band, this week's marker, min and max labels. */
export function RangeBar({ value, band, min, max, metric, label }) {
  if (value == null || !band || min == null || max == null || max <= min) return null;
  const at = (v) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`;
  return (
    <div className="ay-db-rangebar" role="img" aria-label={`${label}: this week ${short(metric, value)}, your usual range ${short(metric, band.lo)} to ${short(metric, band.hi)}.`}>
      <span className="ay-db-rangebar-track"><i className="ay-db-band" style={{ left: at(band.lo), width: `calc(${at(band.hi)} - ${at(band.lo)})` }} /><b style={{ left: at(value) }} /></span>
      <span className="ay-db-rangebar-ends" aria-hidden="true"><small>{short(metric, min)}</small><small>{short(metric, max)}</small></span>
    </div>
  );
}

/**
 * The cycle as a labelled line: Period, Follicular, Ovulation, Luteal, with
 * today marked and "estimated". On hormonal birth control the phases don't
 * apply: it shows her bleeding pattern instead.
 */
export function PhaseLine({ cycle, hormonalBC = false, compact = false }) {
  if (!cycle?.cycleDay) return null;
  const L = Math.max(cycle.avgLength || 28, cycle.cycleDay);
  const p = Math.max(1, cycle.periodLength || 5);
  const phase = hormonalBC ? null : estimatePhase(cycle);
  let seg;
  if (phase?.windowStart && cycle.avgLength) {
    seg = [
      { id: 'period', label: 'Period', n: p },
      { id: 'follicular', label: 'Follicular', n: phase.windowStart - 1 - p },
      { id: 'ovulation', label: 'Ovulation', n: phase.windowEnd - phase.windowStart + 1 },
      { id: 'luteal', label: 'Luteal', n: L - phase.windowEnd },
    ].filter((s) => s.n > 0);
  } else {
    seg = [{ id: 'period', label: hormonalBC ? 'Bleeding' : 'Period', n: Math.min(p, L) }, { id: 'rest', label: hormonalBC ? 'No bleeding' : '', n: L - Math.min(p, L) }].filter((s) => s.n > 0);
  }
  const now = phase?.id;
  const caption = hormonalBC
    ? `Bleeding pattern · day ${cycle.cycleDay} since your last bleed`
    : `Day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}${phase ? ' · estimated' : ''}`;
  return (
    <div className={`ay-db-phaseline${compact ? ' is-compact' : ''}`} role="img" aria-label={`${hormonalBC ? 'Bleeding pattern' : 'Cycle phases'}. ${caption}${now ? `, ${seg.find((s) => s.id === now)?.label.toLowerCase()} now` : ''}.`}>
      {hormonalBC && !compact && <p className="ay-db-phaseline-k">Bleeding pattern</p>}
      <span className="ay-db-phaseline-track">
        {seg.map((s) => <i key={s.id} className={`is-${s.id}${s.id === now ? ' is-now' : ''}`} style={{ flex: s.n }} />)}
        <b style={{ left: `${((cycle.cycleDay - 0.5) / L) * 100}%` }} />
      </span>
      {!compact && seg.some((s) => s.label) && (
        <span className="ay-db-phaseline-labels" aria-hidden="true">
          {seg.map((s) => <small key={s.id} className={s.id === now ? 'is-now' : ''} style={{ flex: s.n }}>{s.label}</small>)}
        </span>
      )}
      {!compact && <small className="ay-db-phaseline-cap" aria-hidden="true">{caption}</small>}
    </div>
  );
}

function Links({ list }) {
  const shown = uniq(list);
  if (!shown.length) return null;
  return <span className="ay-db-links">{shown.map((s, i) => <span key={s.url}>{i ? ' · ' : ''}<SourceLink source={s} /></span>)}</span>;
}

/**
 * One finding, calm register: white, 3px ink rule, the number in the title.
 * Expands to: What changed (with a small chart) · What it can mean · What you
 * can do (.gov links) · When to talk to a clinician (only when relevant).
 */
export function FindingItem({ title, status = null, story, insight, chart = null, band = null, today, reading = [], from = '', onSeeChart, open: openInit = false, idBase }) {
  const [open, setOpen] = useState(openInit);
  if (!story) return null;
  const body = `${idBase}-body`;
  return (
    <li className={`ay-db-finding${open ? ' is-open' : ''}`}>
      <h3 className="ay-db-h3">
        <button type="button" aria-expanded={open} aria-controls={body} onClick={() => setOpen((v) => !v)}>
          <span>{title}</span>
          {status && <span className="ay-db-pill">{status}</span>}
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </h3>
      {open && (
        <div className="ay-db-finding-body" id={body}>
          <section>
            <h4>What changed</h4>
            <p>{insight.text}</p>
            {chart && <p className="ay-db-compare">This week: <b>{short(chart.metric, chart.week ?? chart.avg)}</b> · Your usual: <b>{chart.usual == null ? 'still learning' : short(chart.metric, chart.usual)}</b></p>}
            {chart && <Sparkline points={lastDays(chart.points, today)} band={band} metric={chart.metric} label={chart.label} w={220} h={36} />}
            {insight.basis && <p className="ay-db-muted">{insight.basis}</p>}
            {from && <p className="ay-db-muted">Your data came from {from}.</p>}
          </section>
          <section>
            <h4>What it can mean</h4>
            <p>{story.affects} <Links list={story.affectsSources} /></p>
          </section>
          {story.actions.length > 0 && (
            <section>
              <h4>What you can do</h4>
              <ul className="ay-db-do">
                {story.actions.map((a) => <li key={a.id}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg><span><b>{a.label}.</b> {a.text} <Links list={a.sources} /></span></li>)}
              </ul>
              {reading.length > 0 && <p className="ay-db-muted">Read more: <Links list={reading} /></p>}
            </section>
          )}
          {story.flag && (
            <section>
              <h4>When to talk to a clinician</h4>
              <p>{story.flag.text} <Links list={story.flag.sources} /></p>
            </section>
          )}
          {onSeeChart && <button type="button" className="ay-db-textbtn" onClick={onSeeChart}>See the chart</button>}
        </div>
      )}
    </li>
  );
}

/** Before (butter-deep) and since (data-blue) on one scale, values at the base, the caveat kept. */
export function RoutineEffect({ effect, today }) {
  if (!effect || effect.before == null || effect.after == null) return null;
  const top = Math.max(effect.before, effect.after) || 1;
  const days = today && effect.added ? Math.round((toTime(today) - toTime(effect.added)) / DAY) : null;
  const fmt = (v) => short(effect.metric, v);
  return (
    <article className="ay-db-effect">
      <div className="ay-db-effect-head">
        <b>{displayName(effect.product)}</b>
        {days != null && days >= 0 && <span className="ay-db-pill">Day {days + 1}</span>}
      </div>
      <p className="ay-db-muted">Added {fmtDay(effect.added)} · sleep a night</p>
      <div className="ay-db-bars" role="img" aria-label={`Sleep a night: ${fmt(effect.before)} in the 2 weeks before, ${fmt(effect.after)} since.`}>
        <span className="is-before"><i style={{ height: `${(effect.before / top) * 100}%` }} /><small>Before<b>{fmt(effect.before)}</b></small></span>
        <span className="is-since"><i style={{ height: `${(effect.after / top) * 100}%` }} /><small>Since<b>{fmt(effect.after)}</b></small></span>
      </div>
      <p className="ay-db-caveat">{effect.caveat} {effect.sources?.[0] && <SourceLink source={effect.sources[0]} />}</p>
    </article>
  );
}

/** Each goal, the products covering it, and their evidence marks (replaces the goal rings). */
export function GoalList({ goals, onOpenProduct }) {
  if (!goals?.length) return null;
  return (
    <ul className="ay-db-goals">
      {goals.map((g) => {
        const list = g.owned.length ? g.owned : g.match ? [g.match] : [];
        return (
          <li key={g.needId}>
            <span className="ay-db-goal-k">{g.label}</span>
            <span className="ay-db-goal-v">
              {list.map((o) => (
                <button type="button" key={o.product.id} onClick={() => onOpenProduct?.(o.product)} disabled={!onOpenProduct}>
                  <span>{g.owned.length ? '' : 'Matched, not in your routine: '}{displayName(o.product)}</span>
                  <Meter level={o.level} short />
                </button>
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

import { formatMetric, isFlat, trendWord } from '../../health/dashboard.js';
import { CycleRing } from './HealthChart.jsx';
import { estimatePhase, PHASES } from '../../health/phase.js';

/**
 * The Summary view of Your health as a bento grid (inspired by clinical
 * dashboards like Intelly: colour-blocked cards, one big number each, small
 * stats underneath, a glanceable chart, and a timeline of what's coming).
 * Every number comes from her own rows (src/health/dashboard.js). Nothing is
 * invented: a card only shows when there is data for it.
 */

const DAY = 86400000;
const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtWeekday = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const addDays = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);

const TONES = ['sky', 'ink', 'butter', 'pink'];

function Shape({ kind }) {
  // Soft decorative shapes, one per tone, like the reference. Purely visual.
  if (kind === 'heart') return <svg className="ay-bn-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C39 8 46 13 50 20 C54 13 61 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z" /></svg>;
  if (kind === 'moon') return <svg className="ay-bn-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M64 6 A46 46 0 1 0 94 70 A38 38 0 1 1 64 6Z" /></svg>;
  if (kind === 'star') return <svg className="ay-bn-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 2 L60 30 L90 18 L74 46 L98 64 L66 68 L70 98 L50 76 L30 98 L34 68 L2 64 L26 46 L10 18 L40 30Z" /></svg>;
  return <svg className="ay-bn-shape" viewBox="0 0 100 100" aria-hidden="true"><path d="M8 8 H92 L50 92Z" /></svg>;
}
const SHAPE = { sky: 'moon', ink: 'star', pink: 'heart', butter: 'tri' };

/** Last 14 days as bars; today's bar solid, the rest soft. */
function Bars({ points }) {
  const pts = points.slice(-14);
  const vals = pts.map((p) => p.value).filter((v) => v != null);
  if (vals.length < 2) return null;
  const hi = Math.max(...vals) || 1;
  const w = 100 / pts.length;
  return (
    <svg className="ay-bn-bars" viewBox="0 0 100 44" preserveAspectRatio="none" aria-hidden="true">
      {pts.map((p, i) => {
        if (p.value == null) return <rect key={p.day} x={i * w + w * 0.3} y={40} width={w * 0.4} height={2} rx={1} className="is-gap" />;
        const h = Math.max(3, (p.value / hi) * 40);
        return <rect key={p.day} x={i * w + w * 0.22} y={42 - h} width={w * 0.56} height={h} rx={w * 0.28} className={i === pts.length - 1 ? 'is-now' : ''} />;
      })}
    </svg>
  );
}

/** Smooth line over the last 14 days with a dashed marker on the latest day. */
function Line({ points, usual }) {
  const pts = points.slice(-14).filter((p) => p.value != null);
  if (pts.length < 2) return null;
  const vals = pts.map((p) => p.value).concat(usual != null ? [usual] : []);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i) => 4 + (i / (pts.length - 1)) * 92;
  const y = (v) => 40 - ((v - lo) / span) * 32;
  const d = pts.map((p, i) => {
    if (!i) return `M${x(i)},${y(p.value)}`;
    const px = x(i - 1); const py = y(pts[i - 1].value);
    const cx = (px + x(i)) / 2;
    return `C${cx},${py} ${cx},${y(p.value)} ${x(i)},${y(p.value)}`;
  }).join(' ');
  const last = pts[pts.length - 1];
  return (
    <svg className="ay-bn-line" viewBox="0 0 100 46" preserveAspectRatio="none" aria-hidden="true">
      {usual != null && <line className="ay-bn-usual" x1="2" x2="98" y1={y(usual)} y2={y(usual)} />}
      <path d={d} />
      <line className="ay-bn-now" x1={x(pts.length - 1)} x2={x(pts.length - 1)} y1={y(last.value)} y2="46" />
      <circle cx={x(pts.length - 1)} cy={y(last.value)} r="2.4" />
    </svg>
  );
}

function stats(c) {
  const vals = c.points.slice(-7).map((p) => p.value).filter((v) => v != null);
  if (!vals.length) return [];
  const show = (v) => (c.metric === 'steps' ? Math.round(v).toLocaleString('en-US') : formatMetric(c.metric, v));
  return [
    { k: 'Usual', v: c.usual != null ? show(c.usual) : 'Building' },
    { k: 'Low', v: show(Math.min(...vals)) },
    { k: 'High', v: show(Math.max(...vals)) },
  ];
}

function vsUsual(c) {
  if (c.delta == null || c.usual == null) return 'Building your usual, about two weeks of data';
  if (isFlat(c.metric, c.delta)) return 'Right around your usual';
  const amt = c.metric === 'steps' ? Math.abs(Math.round(c.delta)).toLocaleString('en-US') : formatMetric(c.metric, Math.abs(c.delta));
  const more = c.metric === 'sleep_minutes' ? (c.delta > 0 ? 'more' : 'less') : c.metric === 'steps' ? (c.delta > 0 ? 'more' : 'fewer') : (c.delta > 0 ? 'higher' : 'lower');
  return `${amt} ${more} than your usual`;
}

function MetricCard({ chart, tone, wide, onOpen }) {
  const big = chart.metric === 'steps' ? Math.round(chart.week ?? chart.avg).toLocaleString('en-US') : formatMetric(chart.metric, chart.week ?? chart.avg);
  const word = trendWord(chart.metric, chart.delta);
  const per = chart.metric === 'sleep_minutes' ? 'a night, last 7 days' : 'a day, last 7 days';
  return (
    <li className={`ay-bn-card is-${tone}${wide ? ' is-wide' : ''}`}>
      <button type="button" onClick={onOpen} aria-label={`${chart.label}: ${big} ${per}, ${word.toLowerCase()} than usual. Open charts.`}>
        <Shape kind={SHAPE[tone]} />
        <span className="ay-bn-label">{chart.label}</span>
        <span className="ay-bn-big">{big}</span>
        <span className="ay-bn-per">{per}</span>
        <span className="ay-bn-vs">{vsUsual(chart)}</span>
        <span className="ay-bn-stats">
          {stats(chart).map((s) => <span key={s.k}><b>{s.v}</b><small>{s.k}</small></span>)}
        </span>
        {wide ? <Line points={chart.points} usual={chart.usual} /> : <Bars points={chart.points} />}
        <span className={`ay-bn-word${chart.delta == null || isFlat(chart.metric, chart.delta) ? ' is-flat' : ''}`}>{word}</span>
      </button>
    </li>
  );
}

function CycleCard({ cycle, estimate, onOpen }) {
  const phase = estimatePhase(cycle);
  const phaseName = phase ? (phase.id === 'ovulation' ? 'Ovulation window' : phase.name) : 'Your cycle';
  return (
    <button type="button" className="ay-bn-cycle" onClick={onOpen} aria-label={`Cycle day ${cycle.cycleDay}. ${phaseName}. Open cycle charts.`}>
      <Shape kind="heart" />
      <span className="ay-bn-cycle-text">
        <span className="ay-bn-label">Your cycle</span>
        <span className="ay-bn-big">Day {cycle.cycleDay}</span>
        <span className="ay-bn-phase">{phaseName}</span>
        <span className="ay-bn-stats">
          {cycle.avgLength && <span><b>{cycle.avgLength} days</b><small>Usual length</small></span>}
          {estimate && <span><b>{fmtDay(estimate.day)}</b><small>Next period</small></span>}
        </span>
      </span>
      <span className="ay-bn-ring">
        <CycleRing cycleDay={cycle.cycleDay} avgLength={cycle.avgLength} periodLength={cycle.periodLength} windowStart={phase?.windowStart} windowEnd={phase?.windowEnd} />
      </span>
    </button>
  );
}

/** The four phases across her cycle, with today marked and what this phase can mean. */
function PhaseStrip({ cycle }) {
  const phase = estimatePhase(cycle);
  if (!phase?.windowStart || !cycle.avgLength) return null;
  const L = Math.max(cycle.avgLength, cycle.cycleDay);
  const seg = [
    { id: 'period', from: 1, to: Math.max(1, cycle.periodLength || 5) },
    { id: 'follicular', from: Math.max(1, cycle.periodLength || 5) + 1, to: phase.windowStart - 1 },
    { id: 'ovulation', from: phase.windowStart, to: phase.windowEnd },
    { id: 'luteal', from: phase.windowEnd + 1, to: L },
  ].filter((x) => x.to >= x.from);
  const short = { period: 'Period', follicular: 'Follicular', ovulation: 'Ovulation', luteal: 'Luteal' };
  return (
    <section className="ay-bn-phases" aria-label="Your cycle phases">
      <div className="ay-bn-phasebar">
        {seg.map((x) => (
          <span key={x.id} className={`is-${x.id}${x.id === phase.id ? ' is-now' : ''}`} style={{ flex: x.to - x.from + 1 }} title={short[x.id]} />
        ))}
        <i className="ay-bn-today" style={{ left: `${((cycle.cycleDay - 0.5) / L) * 100}%` }} aria-hidden="true"><b>Today, day {cycle.cycleDay}</b></i>
      </div>
      <ul className="ay-bn-legend">
        {seg.map((x) => <li key={x.id} className={`is-${x.id}${x.id === phase.id ? ' is-now' : ''}`}><i aria-hidden="true" />{short[x.id]}<small>days {x.from}{x.to > x.from ? `-${x.to}` : ''}</small></li>)}
      </ul>
      <p><b>{PHASES[phase.id]?.name}.</b> {PHASES[phase.id]?.what}</p>
    </section>
  );
}

/** What's coming, from her own cycle estimate. Only real dates, only when we have them. */
function upcoming(cycle, estimate, today) {
  const out = [];
  if (!cycle?.lastStart) return out;
  const phase = estimatePhase(cycle);
  if (phase?.windowStart && phase?.windowEnd) {
    const ws = addDays(cycle.lastStart, phase.windowStart - 1);
    const we = addDays(cycle.lastStart, phase.windowEnd - 1);
    if (daysBetween(today, we) >= 0) out.push({ day: ws < today ? today : ws, title: 'Likely ovulation window', sub: `${fmtDay(ws)} to ${fmtDay(we)}. An estimate, not birth control.`, tone: 'sky' });
  }
  if (estimate?.day && daysBetween(today, estimate.day) >= 0) {
    const pms = addDays(estimate.day, -5);
    if (daysBetween(today, pms) >= 0) out.push({ day: pms, title: 'Restock before your period', sub: 'Your shopping list is in Products.', tone: 'butter' });
    out.push({ day: estimate.day, title: 'Next period, estimated', sub: estimate.basis ? 'From your last cycles. Can be off by a few days.' : '', tone: 'pink' });
  }
  return out.sort((a, b) => a.day.localeCompare(b.day)).slice(0, 4);
}

export default function HealthBento({ name, week, cycle, estimate, pinnedCharts, ready, today, onOpenArea }) {
  const phase = cycle?.cycleDay ? estimatePhase(cycle) : null;
  const firstChange = ready.find((s) => s.id !== 'cycle' && s.change && s.change.direction !== 'flat');
  const lead = [
    cycle?.cycleDay ? `Day ${cycle.cycleDay} of your cycle${phase ? `, ${phase.id === 'ovulation' ? 'around ovulation' : phase.name.toLowerCase()}` : ''}.` : null,
    firstChange ? `${firstChange.title} ${firstChange.change.text.replace(/than your usual$/, 'than usual')}.` : null,
  ].filter(Boolean).join(' ');
  const coming = upcoming(cycle, estimate, today);
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="ay-bn">
      <header className="ay-bn-hello">
        <h2>{hello}{name ? `, ${name}` : ''}</h2>
        {lead && <p>{lead}</p>}
      </header>

      {cycle?.cycleDay && <CycleCard cycle={cycle} estimate={estimate} onOpen={() => onOpenArea('cycle')} />}
      {cycle?.cycleDay && <PhaseStrip cycle={cycle} />}

      {pinnedCharts.length > 0 && (
        <ul className="ay-bn-grid" aria-label="Your pinned numbers">
          {pinnedCharts.map((c, i) => (
            <MetricCard key={c.metric} chart={c} tone={TONES[i % TONES.length]} wide={i === 2 || (i === pinnedCharts.length - 1 && i % 2 === 0)} onOpen={() => onOpenArea(c.group)} />
          ))}
        </ul>
      )}

      {coming.length > 0 && (
        <section className="ay-bn-timeline" aria-labelledby="ay-bn-tl">
          <h3 id="ay-bn-tl">Coming up</h3>
          <ol>
            {coming.map((e) => (
              <li key={e.title + e.day} className={`is-${e.tone}`}>
                <span className="ay-bn-tl-date"><b>{fmtDay(e.day).split(' ')[1]}</b><small>{fmtWeekday(e.day)}</small></span>
                <span className="ay-bn-tl-card"><b>{e.title}</b>{e.sub && <small>{e.sub}</small>}</span>
              </li>
            ))}
          </ol>
        </section>
      )}
      {week?.empty === false && null}
    </div>
  );
}

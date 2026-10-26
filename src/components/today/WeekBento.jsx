import { Bento, Tile, Plate } from '../ui/ay';
import { Sparkline } from '../../mobile/components/DashParts.jsx';
import { estimatePhase } from '../../health/phase.js';
import { glanceWords, lastDays, short } from '../../health/dashView.js';
import { resolveCatalogProductImage } from '../ProductTileImage.jsx';
import './week-bento.css';

/**
 * Your week at a glance, picture first (founder Oct 26 16:43: "more picture
 * and graph heavy"; intelly dashboard bento). Every tile is one real chart
 * with one big number and a one-line takeaway; nothing is drawn without her
 * own data. Same tiles on web Today, the dashboard Summary (web + app) and
 * app Today.
 *
 *   cycle     her cycle estimate → a cycle wheel, today marked
 *   charts    dashboard charts (sleep, heart, steps, temperature) with points
 *   bandOf    metric → her usual band (sparkline shading)
 *   products  her routine / ecosystem products → photos on scallop plates
 *   logged    { n, of } days she logged this week → week dots
 * Blue (#769EBE) only for chart lines; bars and fills espresso / pink / butter.
 */

const DAY_MS = 864e5;
const dayInitial = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', { weekday: 'narrow' });

/** "62 bpm" → ["62", "bpm"]; "6h 40m" stays whole. */
function splitUnit(s) {
  const m = String(s || '').match(/^([+-]?[\d.,]+)\s*([a-z°%][a-z°C%]*)$/i);
  return m ? [m[1], m[2]] : [String(s || ''), ''];
}

/** Seven days ending today, with her value or null. */
function weekSeries(points, today) {
  const by = new Map((points || []).map((p) => [p.day, p.value]));
  const end = new Date(`${today}T12:00:00`).getTime();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(end - (6 - i) * DAY_MS);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const v = by.get(key);
    return { day: key, value: v == null ? null : v };
  });
}

/** The cycle as a wheel: period, possible ovulation and today on one ring. */
export function CycleWheel({ cycle, hormonalBC = false, size = 168 }) {
  if (!cycle?.cycleDay) return null;
  const L = Math.max(cycle.avgLength || 28, cycle.cycleDay);
  const p = Math.min(L, Math.max(1, cycle.periodLength || 5));
  const phase = hormonalBC ? null : estimatePhase(cycle);
  const R = 62; const C = 2 * Math.PI * R; const per = C / L;
  const arc = (from, n) => ({ strokeDasharray: `${Math.max(0, n * per - 3)} ${C}`, strokeDashoffset: -(from * per + 1.5) });
  const ang = ((cycle.cycleDay - 0.5) / L) * 2 * Math.PI;
  const dot = { cx: 80 + R * Math.sin(ang), cy: 80 - R * Math.cos(ang) };
  const aria = hormonalBC
    ? `Day ${cycle.cycleDay} since your last bleed.`
    : `Cycle wheel: day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}. Period days 1 to ${p}${phase?.windowStart ? `, possible ovulation days ${phase.windowStart} to ${phase.windowEnd}` : ''}. Estimated.`;
  return (
    <svg className="wb-wheel" viewBox="0 0 160 160" width={size} height={size} role="img" aria-label={aria}>
      <g transform="rotate(-90 80 80)">
        <circle className="wb-wheel__track" cx="80" cy="80" r={R} />
        <circle className="wb-wheel__period" cx="80" cy="80" r={R} style={arc(0, p)} />
        {phase?.windowStart && <circle className="wb-wheel__ovu" cx="80" cy="80" r={R} style={arc(phase.windowStart - 1, phase.windowEnd - phase.windowStart + 1)} />}
      </g>
      <circle className="wb-wheel__today" cx={dot.cx} cy={dot.cy} r="9" />
      <text className="wb-wheel__k" x="80" y="66" textAnchor="middle">{hormonalBC ? 'Since bleed' : 'Cycle day'}</text>
      <text className="wb-wheel__n" x="80" y="104" textAnchor="middle">{cycle.cycleDay}</text>
    </svg>
  );
}

/** Seven nights as bars against her usual (dashed line). Last night is pink. */
export function WeekBars({ points, usual = null, today, metric, label }) {
  const days = weekSeries(points, today);
  const vals = days.map((d) => d.value).filter((v) => v != null);
  if (vals.length < 2) return null;
  const hi = Math.max(...vals, usual || 0) * 1.08 || 1;
  const W = 196; const H = 72; const bw = 18; const gap = (W - bw * 7) / 6;
  const y = (v) => H - (v / hi) * H;
  const lastIdx = days.map((d) => d.value != null).lastIndexOf(true);
  const aria = `${label}, last 7 days: ${days.filter((d) => d.value != null).map((d) => `${dayInitial(d.day)} ${short(metric, d.value)}`).join(', ')}${usual != null ? `. Your usual ${short(metric, usual)}` : ''}.`;
  return (
    <figure className="wb-bars">
      <svg viewBox={`0 0 ${W} ${H + 18}`} preserveAspectRatio="none" role="img" aria-label={aria}>
        {days.map((d, i) => d.value != null && (
          <rect key={d.day} className={i === lastIdx ? 'is-last' : ''} x={i * (bw + gap)} y={y(d.value)} width={bw} height={Math.max(2, H - y(d.value))} rx="4" />
        ))}
        {usual != null && <line className="wb-bars__usual" x1="0" x2={W} y1={y(usual)} y2={y(usual)} />}
        {days.map((d, i) => <text key={`t-${d.day}`} className="wb-bars__d" x={i * (bw + gap) + bw / 2} y={H + 15} textAnchor="middle">{dayInitial(d.day)}</text>)}
      </svg>
    </figure>
  );
}

/** The week as seven dots, the days she logged filled (real days when given, else a count). */
function WeekDots({ n, of = 7, days = null }) {
  const list = days?.length ? days : Array.from({ length: of }, (_, i) => ({ day: null, on: i < n }));
  const said = days?.length ? days.filter((d) => d.on).map((d) => new Date(`${d.day}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })).join(', ') : '';
  return (
    <span className="wb-dots" role="img" aria-label={`${n} of ${of} days logged${said ? `: ${said}` : ''}`}>
      {list.map((d, i) => <span key={d.day || i} className={d.on ? 'is-on' : ''}><i />{d.day && <small aria-hidden="true">{dayInitial(d.day)}</small>}</span>)}
    </span>
  );
}

const PHASE_WORDS = { period: 'On your period', ovulation: 'Ovulation possible', luteal: 'Probably after ovulation', follicular: 'Probably before ovulation' };
/** The dashboard's words for where she is (same as HealthHome's glance). */
export function cycleWordsFor(cycle, hormonalBC = false) {
  if (!cycle?.cycleDay) return '';
  if (hormonalBC) return 'Bleeding pattern';
  const ph = estimatePhase(cycle);
  return (ph && PHASE_WORDS[ph.id]) || 'Where you are';
}

/** The glance's charts, picked the dashboard's way: sleep, heart (resting HR or HRV), steps; temperature when short. */
export function glanceCharts(dash) {
  const all = (dash?.groups || []).flatMap((g) => g.charts.map((c) => ({ ...c, group: g.id })));
  const of = (m) => all.find((c) => c.metric === m) || null;
  const list = [of('sleep_minutes'), of('resting_hr_bpm') || of('hrv_rmssd_ms') || of('hrv_sdnn_ms'), of('steps')].filter(Boolean);
  if (list.length < 3) { const t = of('temp_deviation_c') || of('basal_temp_c') || of('skin_temp_night_c'); if (t) list.push(t); }
  return list.map((c) => ({ ...c, area: c.group === 'sleep' ? 'sleep' : 'body' }));
}

const TONE = { sleep_minutes: 'deep', resting_hr_bpm: 'pink', hrv_rmssd_ms: 'pink', hrv_sdnn_ms: 'pink', steps: 'butter' };
const LABEL = (c) => (c.metric === 'sleep_minutes' ? 'Sleep' : c.metric === 'steps' ? 'Steps' : c.label);

export default function WeekBento({ coming = [], cycle = null, cycleWords = '', hormonalBC = false, charts = [], bandOf = () => null, today, products = [], productsLabel = 'Your routine', onOpenProducts = null, logged = null, onOpen = null, className = '' }) {
  const tiles = [];
  const btn = (area, aria) => (onOpen ? { as: 'button', type: 'button', onClick: () => onOpen(area), 'aria-label': aria } : { role: 'group', 'aria-label': aria });

  if (cycle?.cycleDay) {
    const value = hormonalBC ? `Day ${cycle.cycleDay} since your last bleed` : `Day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}`;
    tiles.push(
      <Tile key="cycle" tone="ink" span="big" className="wb-tile is-cycle" {...btn('cycle', `Cycle: ${cycleWords || 'where you are'}. ${value}.${onOpen ? ' Open cycle.' : ''}`)}>
        <span className="ayb-tile__label">Cycle</span>
        <CycleWheel cycle={cycle} hormonalBC={hormonalBC} />
        <span className="wb-take"><b>{cycleWords || 'Where you are'}</b><span>{value}{hormonalBC ? '' : ' · estimated'}</span></span>
        {!hormonalBC && <span className="wb-key" aria-hidden="true"><i className="is-period" />Period<i className="is-ovu" />Possible ovulation<i className="is-today" />Today</span>}
      </Tile>,
    );
  }

  charts.forEach((c, i) => {
    const now = short(c.metric, c.week ?? c.avg);
    if (!now) return;
    const [num, unit] = splitUnit(now);
    const words = glanceWords(c);
    const usual = c.usual != null ? `usual ${short(c.metric, c.usual)}` : 'still learning your usual';
    const bars = c.metric === 'sleep_minutes' || c.metric === 'steps';
    const wide = c.metric === 'sleep_minutes' || (!cycle?.cycleDay && i === 0);
    const tone = TONE[c.metric] || (i % 2 ? 'butter' : 'deep');
    const area = c.area || c.metric;
    tiles.push(
      <Tile key={c.metric} tone={tone} span={wide ? 'wide' : ''} className={`wb-tile is-${c.metric}`} {...btn(area, `${LABEL(c)}: ${words}. ${now}, ${usual}.${onOpen ? ` Open ${LABEL(c).toLowerCase()}.` : ''}`)}>
        <span className="ayb-tile__label">{LABEL(c)}</span>
        {bars
          ? <WeekBars points={c.points} usual={c.usual} today={today} metric={c.metric} label={LABEL(c)} />
          : <span className="wb-spark"><Sparkline points={lastDays(c.points, today)} band={bandOf(c.metric)} metric={c.metric} w={160} h={44} label={`${LABEL(c)}, last 7 days`} /></span>}
        <span className="wb-num"><span className="ayb-tile__big">{num}</span>{unit && <span className="ayb-tile__unit">{unit}</span>}</span>
        <span className="wb-take"><b>{words}</b><span>{usual}</span></span>
      </Tile>,
    );
  });

  if (logged?.n > 0) {
    tiles.push(
      <Tile key="logged" tone="pink" className="wb-tile is-logged" role="group" aria-label={`You logged ${logged.n} of ${logged.of || 7} days this week.`}>
        <span className="ayb-tile__label">Check-ins</span>
        <WeekDots n={logged.n} of={logged.of || 7} days={logged.days} />
        <span className="wb-num"><span className="ayb-tile__big">{logged.n}</span><span className="ayb-tile__unit">of {logged.of || 7}</span></span>
        <span className="wb-take"><span>days logged this week</span></span>
      </Tile>,
    );
  }

  const shown = products.filter((p) => p?.id).slice(0, 3);
  if (shown.length) {
    const aria = `${productsLabel}: ${products.length} ${products.length === 1 ? 'product' : 'products'}, ${shown.map((p) => p.name).join(', ')}.${onOpenProducts ? ' Open.' : ''}`;
    // A lone wide tile on the last row spans the whole width (no empty half row).
    const before = tiles.reduce((n, t) => n + ({ big: 4, wide: 2 }[t.props.span] || 1), 0);
    const full = !coming.length && (before + 2) % 4 === 2;
    const props = onOpenProducts ? { as: 'button', type: 'button', onClick: onOpenProducts, 'aria-label': aria } : { role: 'group', 'aria-label': aria };
    tiles.push(
      <Tile key="products" tone="ink" span="wide" className={`wb-tile is-products${full ? ' is-full' : ''}`} {...props}>
        <span className="ayb-tile__label">{productsLabel}</span>
        <span className="wb-plates" aria-hidden="true">
          {shown.map((p) => <Plate key={p.id} src={resolveCatalogProductImage(p) || ''} alt="" fallback={p.brand || p.name} className="wb-plate" />)}
        </span>
        <span className="wb-num"><span className="ayb-tile__big">{products.length}</span><span className="ayb-tile__unit">{products.length === 1 ? 'product' : 'products'}</span></span>
      </Tile>,
    );
  }

  // Coming up (her cycle estimate + routine), as a tile: date blocks, one line each.
  if (coming.length) {
    const fmt = (iso) => new Date(`${iso}T12:00:00`);
    tiles.push(
      <Tile key="coming" tone="butter" span="wide" className="wb-tile is-coming" role="group" aria-label={`Coming up: ${coming.map((c) => `${c.day === today ? 'today' : fmt(c.day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}, ${c.title}`).join('; ')}.`}>
        <span className="ayb-tile__label">Coming up</span>
        <ul className="wb-coming" aria-hidden="true">
          {coming.slice(0, 3).map((c) => (
            <li key={`${c.day}-${c.title}`}>
              <span className="wb-date"><b>{fmt(c.day).getDate()}</b><small>{c.day === today ? 'Today' : fmt(c.day).toLocaleDateString('en-US', { weekday: 'short' })}</small></span>
              <span>{c.title}</span>
            </li>
          ))}
        </ul>
      </Tile>,
    );
  }

  if (!tiles.length) return null;
  return <Bento className={`wb ${className}`.trim()}>{tiles}</Bento>;
}

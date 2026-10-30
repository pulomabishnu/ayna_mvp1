import { Bento, Tile, Plate } from '../ui/ay';
import { Sparkline } from '../../mobile/components/DashParts.jsx';
import { estimatePhase } from '../../health/phase.js';
import { glanceWords, lastDays, short } from '../../health/dashView.js';
import { takeaway } from '../../health/takeaway.js';
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
      {/* The bars stretch to the card's width; the day letters are real text
          below them (inside the stretched SVG they came out squashed on iPhone). */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={aria}>
        {days.map((d, i) => d.value != null && (
          <rect key={d.day} className={i === lastIdx ? 'is-last' : ''} x={i * (bw + gap)} y={y(d.value)} width={bw} height={Math.max(2, H - y(d.value))} rx="3" />
        ))}
        {usual != null && <line className="wb-bars__usual" x1="0" x2={W} y1={y(usual)} y2={y(usual)} vectorEffect="non-scaling-stroke" />}
      </svg>
      <span className="wb-bars__days" aria-hidden="true">{days.map((d) => <span key={`t-${d.day}`}>{dayInitial(d.day)}</span>)}</span>
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

// Founder Oct 27: no pink tiles, no alternating colours, keep it sparse. Every tile is the one calm surface
// (butter in light, espresso in dark, outlined); espresso is kept for each page's one summary box (on Home,
// the hero and the Your data shortcut). Pink stays for the accents inside (today's bar, the period arc).
const TONE = 'calm';
const LABEL = (c) => (c.metric === 'sleep_minutes' ? 'Sleep' : c.metric === 'steps' ? 'Steps' : c.label);

export default function WeekBento({ coming = [], cycle = null, cycleWords = '', hormonalBC = false, charts = [], bandOf = () => null, today, products = [], productsLabel = 'Your routine', onOpenProducts = null, logged = null, onOpen = null, className = '', variant = 'default' }) {
  const home = variant === 'home';
  const tiles = [];
  const btn = (area, aria, metric = null) => (onOpen ? { as: 'button', type: 'button', onClick: () => onOpen(area, metric), 'aria-label': aria, 'aria-haspopup': metric ? 'dialog' : undefined } : { role: 'group', 'aria-label': aria });

  if (cycle?.cycleDay) {
    const value = hormonalBC ? `Day ${cycle.cycleDay} since your last bleed` : `Day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}`;
    tiles.push(
      <Tile key="cycle" tone={TONE} className="wb-tile is-cycle" {...btn('cycle', `Cycle: ${cycleWords || 'where you are'}. ${value}.${onOpen ? ' Open cycle.' : ''}`)}>
        <span className="ayb-tile__label">Cycle</span>
        <CycleWheel cycle={cycle} hormonalBC={hormonalBC} />
        <span className="wb-take"><b>{cycleWords || 'Where you are'}</b><span>{value}{hormonalBC ? '' : ' · estimated'}</span></span>
      </Tile>,
    );
  }

  charts.forEach((c, i) => {
    const now = short(c.metric, c.week ?? c.avg);
    if (!now) return;
    const [num, unit] = splitUnit(now);
    const tk = home ? takeaway(c) : null;
    const words = tk?.text || glanceWords(c);
    const usual = c.usual != null ? `usual ${short(c.metric, c.usual)}` : 'still learning your usual';
    // Up or down against her usual (same 3% band as the dials, ScoreRings).
    const nowVal = c.week ?? c.avg;
    const dir = c.usual && nowVal != null ? (nowVal / c.usual > 1.03 ? 1 : nowVal / c.usual < 0.97 ? -1 : 0) : 0;
    // Fewer than 3 days of data: the number and "vs usual" only, no near-empty chart (founder Oct 26 19:46).
    const enough = lastDays(c.points, today).filter((p) => p?.value != null).length >= 3;
    const bars = c.metric === 'sleep_minutes' || c.metric === 'steps';
    const tone = TONE;
    // Home: the first metric leads, full width; the rest pair up.
    const span = home && i === 0 ? 'wide' : '';
    const area = c.area || c.metric;
    tiles.push(
      <Tile key={c.metric} tone={tone} span={span} className={`wb-tile is-${c.metric}`} {...btn(area, `${LABEL(c)}: ${words}. ${now}, ${usual}.${onOpen ? ` Open ${LABEL(c).toLowerCase()}.` : ''}`, c.metric)}>
        <span className="ayb-tile__label">{LABEL(c)}</span>
        {!enough ? null : bars
          ? <WeekBars points={c.points} usual={c.usual} today={today} metric={c.metric} label={LABEL(c)} />
          : <span className="wb-spark"><Sparkline points={lastDays(c.points, today)} band={bandOf(c.metric)} metric={c.metric} w={160} h={44} label={`${LABEL(c)}, last 7 days`} /></span>}
        <span className="wb-num"><span className="ayb-tile__big">{num}</span>{unit && <span className="ayb-tile__unit">{unit}</span>}</span>
        <span className="wb-take"><b>{dir !== 0 && <svg className="wb-dir" viewBox="0 0 24 24" aria-hidden="true"><path d={dir > 0 ? 'M12 19V5M6 11l6-6 6 6' : 'M12 5v14M6 13l6 6 6-6'} /></svg>}{words}</b><span>{usual}</span></span>
      </Tile>,
    );
  });

  if (logged?.n > 0) {
    tiles.push(
      <Tile key="logged" tone={TONE} className="wb-tile is-logged" role="group" aria-label={`You logged ${logged.n} of ${logged.of || 7} days this week.`}>
        <span className="ayb-tile__label">Check-ins</span>
        <WeekDots n={logged.n} of={logged.of || 7} days={logged.days} />
        <span className="wb-num"><span className="ayb-tile__big">{logged.n}</span><span className="ayb-tile__unit">of {logged.of || 7}</span></span>
        <span className="wb-take"><span>days logged this week</span></span>
      </Tile>,
    );
  }

  const oddHalves = tiles.filter((t) => !t.props.span).length % 2 === 1;
  const shown = products.filter((p) => p?.id).slice(0, oddHalves ? 2 : 3);
  if (shown.length) {
    const aria = `${productsLabel}: ${products.length} ${products.length === 1 ? 'product' : 'products'}, ${shown.map((p) => p.name).join(', ')}.${onOpenProducts ? ' Open.' : ''}`;
    // A lone wide tile on the last row spans the whole width (no empty half row).
    // With an odd number of halves, the products tile fills the empty half; otherwise it is the one wide row.
    const halves = tiles.filter((t) => !t.props.span).length;
    const half = halves % 2 === 1;
    const full = !half;
    const props = onOpenProducts ? { as: 'button', type: 'button', onClick: onOpenProducts, 'aria-label': aria } : { role: 'group', 'aria-label': aria };
    tiles.push(
      <Tile key="products" tone={TONE} span={half ? '' : 'wide'} className={`wb-tile is-products${full ? ' is-full' : ' is-half'}`} {...props}>
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
      <Tile key="coming" tone={TONE} span="wide" className="wb-tile is-coming" role="group" aria-label={`Coming up: ${coming.map((c) => `${c.day === today ? 'today' : fmt(c.day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}, ${c.title}`).join('; ')}.`}>
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
  // Two columns of half tiles side by side (founder Oct 26 19:46: "everything is still just stacked").
  // Only the products row and Coming up run the full width; a lone half stays a half.
  const laid = tiles;
  return <Bento className={`wb${home ? ' is-home' : ''} ${className}`.trim()}>{laid}</Bento>;
}

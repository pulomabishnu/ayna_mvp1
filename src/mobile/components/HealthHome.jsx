import { useEffect, useRef, useState } from 'react';
import { buildDashboard, formatMetric, isFlat, RANGES } from '../../health/dashboard.js';
import { estimatePhase, PHASE_SOURCES } from '../../health/phase.js';
import { explainWeek, cycleLine } from '../../health/weekInsights.js';
import { pickForInsight, weekPicks } from '../../health/weekPicks.js';
import { comingUp } from '../../health/comingUp.js';
import { phaseCompare, normalRanges, goalsCovered, effectChecks, aynaAdds } from '../../health/beyondNumbers.js';
import { SOURCE_NAMES } from '../data/healthConnections.js';
import { askStats, weekQuestions, weekSummary } from '../utils/dashboardAsk.js';
import ProductImage from './ProductImage.jsx';
import { haptic } from '../../utils/haptics.js';
import { reasonForProduct } from '../../health/plan.js';
import { OUTCOME_LABELS } from '../../health/routineOutcome.js';
import HealthChart, { CycleRing } from './HealthChart.jsx';
import { PhaseStrip, SourceLink, PhaseCompare, NormalRanges, GoalsCovered, WeekPicks, Meter } from './HealthBento.jsx';
import InsightStory, { StoryFlag } from './InsightStory.jsx';
import { insightStories, metricHeadline } from '../../health/insightStory.js';
import '../../styles/week-explained.css';
import '../../styles/health-home.css';

/**
 * Your health, app and website (one component, two surfaces).
 *
 * Home order from the founder's dashboard references (6 of 8 agree):
 * greeting -> one hero -> coloured tiles -> a ring -> a list with status
 * pills. In ayna's terms:
 *   Hello line with today's date
 *   Area tabs (Summary, Cycle, Sleep, Heart, ..., Products) so detail sits
 *     one tap away instead of one long scroll (Oura's Today/Vitals split,
 *     Apple Health's Summary vs category pages)
 *   Summary:
 *     Hero (the one Feature): "This week, explained", the cycle day as the
 *       one big number, each insight one tap apart (Heart / Sleep / ...)
 *     What ayna adds to Apple Health, as one compact strip
 *     Tiles: Cycle, her pinned metrics (Sleep, Heart by default), Picks;
 *       each opens its tab. Edit chooses which metrics show.
 *     Goals covered as concentric rings
 *     Coming up as a list with status pills
 *     Something to add, Ask ayna about your week, Your week in short
 * Each number shows once per view. Every number comes from her own rows;
 * a block only shows when its data exists. Never a diagnosis.
 */

const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtWeekday = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const fmtLongDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const sourceNames = (sources) => sources.map((s) => SOURCE_NAMES[s] || s).join(' and ');
const DAY = 86400000;
const daysFrom = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);

// Her layout (which tiles show): a display preference on this device, never health data.
const LAYOUT_KEY = 'ayna_health_layout_v1';
const DEFAULT_PINS = ['cycle', 'sleep_minutes', 'resting_hr_bpm'];
function loadLayout() {
  try { const v = JSON.parse(localStorage.getItem(LAYOUT_KEY) || 'null'); return v && Array.isArray(v.pins) ? v : { pins: null }; } catch { return { pins: null }; }
}
function saveLayout(v) { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(v)); } catch { /* storage blocked: lasts this visit */ } }

const SUGGEST_LABEL = { 'sleep.trouble': 'sleep', 'cycle.irregular': 'irregular cycles', 'energy.fatigue': 'low energy' };
const INSIGHT_KEY = { heart: 'Heart', sleep: 'Sleep', activity: 'Activity', temperature: 'Temperature', period: 'Cycle', cycle_length: 'Cycle' };
const INSIGHT_TAB_LABEL = { cycle_length: 'Cycle length', period: 'Period' };
const TILE_TONES = ['sky', 'butter', 'group', 'group', 'group'];
const RING_TONES = ['pink', 'sky', 'ink', 'butter'];

const shortMetric = (c, v) => (c.metric === 'steps' ? Math.round(v).toLocaleString('en-US') : formatMetric(c.metric, v));

function vsUsual(c) {
  if (c.delta == null || c.usual == null) return 'Building your usual, about two weeks of data';
  if (isFlat(c.metric, c.delta)) return 'Right around your usual';
  const amt = c.metric === 'steps' ? Math.abs(Math.round(c.delta)).toLocaleString('en-US') : formatMetric(c.metric, Math.abs(c.delta));
  const more = c.metric === 'sleep_minutes' ? (c.delta > 0 ? 'more' : 'less') : c.metric === 'steps' ? (c.delta > 0 ? 'more' : 'fewer') : (c.delta > 0 ? 'higher' : 'lower');
  return `${amt} ${more} than your usual`;
}

function weekStats(c) {
  const vals = c.points.slice(-7).map((p) => p.value).filter((v) => v != null);
  if (!vals.length) return [];
  return [
    { k: 'Usual', v: c.usual != null ? shortMetric(c, c.usual) : 'Building' },
    { k: 'Low', v: shortMetric(c, Math.min(...vals)) },
    { k: 'High', v: shortMetric(c, Math.max(...vals)) },
  ];
}

/** Underline tabs with arrow keys, Home and End (WAI-ARIA APG, automatic activation). */
function Tabs({ tabs, value, onChange, label, idBase, className = '' }) {
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
    <div className={`ay-hh-tabs ${className}`} role="tablist" aria-label={label}>
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
          className={value === t.id ? 'is-on' : ''}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => key(e, i)}
        >{t.label}</button>
      ))}
    </div>
  );
}

// Further reading under See data. .gov pages only (founder rule, Oct 24 2026);
// the American Heart Association links were removed (not .gov).
const INSIGHT_READING = {
  'sleep-short': { label: 'CDC: Sleep and heart health', url: 'https://www.cdc.gov/heart-disease/about/sleep-and-heart-health.html' },
  'sleep-long': { label: 'CDC: Sleep and heart health', url: 'https://www.cdc.gov/heart-disease/about/sleep-and-heart-health.html' },
  'heart-up': { label: 'MedlinePlus: Pulse', url: 'https://medlineplus.gov/ency/article/003399.htm' },
  'heart-down': { label: 'MedlinePlus: Pulse', url: 'https://medlineplus.gov/ency/article/003399.htm' },
  'steps-lower': { label: 'CDC: Benefits of physical activity', url: 'https://www.cdc.gov/physical-activity-basics/health-benefits/adults.html' },
};

/**
 * This week in her connected data. Not the top of Today any more: what leads
 * is decide()'s output (TodayFeed). Insights keep explainWeek's own order.
 */
function Hero({ cycle, ctx, stories, fallback, onOpenInsight }) {
  const [at, setAt] = useState(0);
  const phase = cycle ? estimatePhase(cycle) : null;
  const line = cycleLine(cycle, ctx);
  const rest = line ? line.replace(/^Cycle day \d+,?\s*/, '') : '';
  const sub = rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '';
  const cur = stories[Math.min(at, stories.length - 1)];
  const it = cur?.insight;
  const story = cur?.story;
  return (
    <section className={`ay-hh-hero${story?.flag ? ' is-flagged' : ''}`} aria-labelledby="ay-hh-hero-title">
      <div className="ay-hh-hero-top">
        <div className="ay-hh-hero-head">
          <p className="ay-hh-hero-eyebrow">This week, explained</p>
          {story?.flag && <StoryFlag flag={story.flag} />}
          <h3 id="ay-hh-hero-title">{story ? story.changed : 'Your week at a glance'}</h3>
          {!it && sub && <p className="ay-hh-hero-sub">{sub}</p>}
          {!cycle && !stories.length && fallback && <p className="ay-hh-hero-sub">{fallback}</p>}
        </div>
        {!it && cycle?.cycleDay && (
          <div className="ay-hh-hero-ring" role="img" aria-label={`Cycle day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}`}>
            <CycleRing cycleDay={cycle.cycleDay} avgLength={cycle.avgLength} periodLength={cycle.periodLength} windowStart={phase?.windowStart} windowEnd={phase?.windowEnd} />
            <span aria-hidden="true"><small>Day</small><b>{cycle.cycleDay}</b></span>
          </div>
        )}
      </div>
      {stories.length > 0 && (
        <>
          {stories.length > 1 && (
            <Tabs tabs={stories.map(({ insight: x }, i) => ({ id: String(i), label: INSIGHT_TAB_LABEL[x.id] || INSIGHT_KEY[x.id] || x.id }))} value={String(Math.min(at, stories.length - 1))} onChange={(v) => setAt(Number(v))} label="This week's changes" idBase="ay-hh-ins" className="is-chips" />
          )}
          <div className="ay-hh-insight" role={stories.length > 1 ? 'tabpanel' : undefined} id="ay-hh-ins-panel" aria-labelledby={stories.length > 1 ? `ay-hh-ins-tab-${Math.min(at, stories.length - 1)}` : undefined} key={it.id}>
            {stories.length === 1 && <b className="ay-hh-k">{INSIGHT_KEY[it.id] || it.id}</b>}
            <InsightStory story={story} mode="hero" hideChanged hideFlag onMore={() => onOpenInsight(it)} idBase="ay-hh-hero-story" />
          </div>
        </>
      )}
      <p className="ay-hh-hero-foot">Compared only with your own last 4 weeks. Patterns, not a diagnosis.</p>
    </section>
  );
}

function InsightDetail({ insight, story, chart, pick, onBack, onOpenMetric, onOpenProduct, onOpenRoutine, onAsk }) {
  const reading = [...(INSIGHT_READING[insight.signal] ? [INSIGHT_READING[insight.signal]] : [])].filter((source) => !(insight.sources || []).some((s) => s.url === source.url));
  const data = (
    <>
      {chart && <p className="ay-hh-action-comparison">This week: <b>{shortMetric(chart, chart.week ?? chart.avg)}</b> <span>·</span> Your usual: <b>{chart.usual == null ? 'Still building' : shortMetric(chart, chart.usual)}</b></p>}
      {insight.from?.length > 0 && <p className="ay-hh-action-source">Your data came from {sourceNames(insight.from)}.</p>}
      {chart && <button type="button" className="ay-hh-action-link" onClick={onOpenMetric}>See the full {INSIGHT_KEY[insight.id]?.toLowerCase() || 'health'} trend →</button>}
      {reading.length > 0 && <p className="ay-is-basis">Read more: {reading.map((src) => <SourceLink key={src.url} source={src} />)}</p>}
    </>
  );
  return (
    <article className="ay-hh-action" aria-labelledby="ay-hh-action-changed">
      <button type="button" className="ay-hh-action-back" onClick={onBack}>← Back to your dashboard</button>
      <p className="ay-hh-action-kicker">Your data · {INSIGHT_KEY[insight.id] || insight.id}</p>
      <InsightStory story={story} mode="full" data={data} idBase="ay-hh-action" />
      {((pick && onOpenProduct) || onOpenRoutine || (onAsk && insight.question)) && (
        <div className="ay-hh-action-more">
          {pick && onOpenProduct && <div className="ay-hh-action-product"><small>{pick.owned ? 'Already in your routine' : 'Matched to your goal'}</small><button type="button" onClick={() => onOpenProduct(pick.product)}>{pick.product.name} →</button><p>{pick.reason}</p></div>}
          {onOpenRoutine && <button type="button" className="ay-hh-action-link" onClick={onOpenRoutine}>See your routine and shopping list →</button>}
          {onAsk && insight.question && <button type="button" className="ay-hh-action-ask" onClick={() => onAsk(insight.question)}>Ask ayna about this</button>}
        </div>
      )}
      <p className="ay-hh-note">This is a pattern in your data, not a diagnosis. If a change concerns you, talk to a clinician.</p>
    </article>
  );
}

/**
 * No health data yet (app): the same greeting and the same Feature as the
 * full screen, so connecting data fills this page in rather than swapping it
 * for another design. The ring is a blank cycle (no day), never fake data.
 */
export function HealthEmpty({ name = '', today, onConnect, onOpenCheckin, goalCount = 0, signedOut = false, todayFeed = null, children }) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="ay-hh is-app is-empty">
      <header className="ay-hh-hello">
        <p>{fmtLongDay(today)}</p>
        <h2>{hello}{name ? `, ${name}` : ''}</h2>
      </header>
      {todayFeed}
      <section className="ay-hh-hero" aria-labelledby="ay-hh-empty-title">
        <div className="ay-hh-hero-top">
          <div className="ay-hh-hero-head">
            <h3 id="ay-hh-empty-title">{goalCount ? "We're starting with your goals" : 'Want a more personalized rundown?'}</h3>
            <p className="ay-hh-hero-sub">{goalCount ? `You chose ${goalCount} ${goalCount === 1 ? 'goal' : 'goals'}. Your matches are below. ${signedOut ? 'Sign in to connect health data' : 'Connect health data'} or keep using quick check-ins. Either works.` : `${signedOut ? 'Sign in to connect health data' : 'Connect health data'} or keep using quick check-ins. Either works. Your cycle, sleep, heart and activity can appear here once there is enough data.`}</p>
          </div>
        </div>
        {onConnect && <button type="button" className="ay-hh-empty-cta" onClick={onConnect}>{signedOut ? 'Sign in to connect health data' : 'Connect health data'}</button>}
        <p className="ay-hh-hero-foot">Compared only with your own usual. Patterns, not a diagnosis.</p>
      </section>
      {children}
      {onOpenCheckin && <button type="button" className="ay-hh-checkin-link" onClick={onOpenCheckin}>Log how you felt this month →</button>}
    </div>
  );
}

/** What ayna adds to Apple Health: one line, then four short facts with her own counts. */
function Adds({ items }) {
  return (
    <section className="ay-hh-adds" aria-labelledby="ay-hh-adds-title">
      <div className="ay-hh-adds-head">
        <h3 id="ay-hh-adds-title">What ayna adds to your data</h3>
        <p>Your connected apps provide the numbers. ayna reads them against your cycle and shows which products fit this week.</p>
      </div>
      <ul>
        {items.map((x) => <li key={x.id}><b>{x.label}</b><span>{x.text}</span></li>)}
      </ul>
    </section>
  );
}

function TodayPlan({ products, needIds, onOpenRoutine }) {
  if (!onOpenRoutine || !products.length) return null;
  const shown = products.slice(0, 2);
  return <section className="ay-hh-today-plan" aria-labelledby="ay-hh-today-plan-title">
    <div><p className="ay-hh-today-kicker">Your plan</p><h3 id="ay-hh-today-plan-title">What fits in your routine</h3></div>
    <ul>{shown.map((product) => <li key={product.id}><b>{product.name}</b><span>{reasonForProduct(product, needIds) || 'In your selected routine'}</span></li>)}</ul>
    <button type="button" onClick={onOpenRoutine}>View and edit your routine →</button>
  </section>;
}

function RecentCheckin({ products, outcomes, onOpenRoutine }) {
  if (!onOpenRoutine) return null;
  const latest = products.flatMap((product) => {
    const history = Array.isArray(outcomes[product.id]) ? outcomes[product.id] : [];
    const entry = history.at(-1);
    return entry && OUTCOME_LABELS[entry.rating] ? [{ product, ...entry }] : [];
  }).sort((a, b) => b.day.localeCompare(a.day))[0];
  if (!latest) return null;
  return <section className="ay-hh-recent-checkin" aria-labelledby="ay-hh-recent-checkin-title">
    <div><p className="ay-hh-today-kicker">What you reported</p><h3 id="ay-hh-recent-checkin-title">{latest.product.name}</h3></div>
    <p>You marked this product “{OUTCOME_LABELS[latest.rating].toLowerCase()}” on {fmtDay(latest.day)}. This is your report, not a measure of medical effectiveness.</p>
    <button type="button" onClick={onOpenRoutine}>See your product check-ins →</button>
  </section>;
}

function TriedSoFar({ products, outcomes, onOpenRoutine }) {
  const tried = products.map((product) => {
    const history = Array.isArray(outcomes[product.id]) ? outcomes[product.id].filter((entry) => OUTCOME_LABELS[entry?.rating]) : [];
    return { product, history, helping: history.filter((entry) => entry.rating === 'helping').length };
  }).filter((item) => item.history.length);
  if (!tried.length) return null;
  return <details className="ay-hh-tried">
    <summary>What you’ve tried <span>{tried.length} {tried.length === 1 ? 'product' : 'products'}</span></summary>
    <ul>{tried.map(({ product, history, helping }) => <li key={product.id}>
      <b>{product.name}</b>
      <span>{history.length >= 3 ? `Marked helping on ${helping} of ${history.length} check-ins` : `${history.length} dated ${history.length === 1 ? 'check-in' : 'check-ins'} so far`}</span>
    </li>)}</ul>
    <p>These are your impressions. They do not show that a product caused a health change.</p>
    {onOpenRoutine && <button type="button" onClick={onOpenRoutine}>Review product check-ins →</button>}
  </details>;
}

/** Mini phase bar for the Cycle tile: the four phases, today marked. */
function MiniPhases({ cycle }) {
  const phase = estimatePhase(cycle);
  if (!phase?.windowStart || !cycle.avgLength) return null;
  const L = Math.max(cycle.avgLength, cycle.cycleDay);
  const p = Math.max(1, cycle.periodLength || 5);
  const seg = [['period', p], ['follicular', phase.windowStart - 1 - p], ['ovulation', phase.windowEnd - phase.windowStart + 1], ['luteal', L - phase.windowEnd]].filter((s) => s[1] > 0);
  return (
    <span className="ay-hh-mini" aria-hidden="true">
      {seg.map(([id, n]) => <i key={id} className={`is-${id}`} style={{ flex: n }} />)}
      <em style={{ left: `${((cycle.cycleDay - 0.5) / L) * 100}%` }} />
    </span>
  );
}

/** Concentric rings: one per goal, filled to the strongest evidence among her products for it. */
function GoalRings({ goals, onOpen }) {
  if (!goals.length) return null;
  const covered = goals.filter((g) => g.owned.length).length;
  const rings = goals.slice(0, 4).map((g, i) => {
    const level = g.owned.length ? Math.max(...g.owned.map((o) => o.level)) : 0;
    return { ...g, level, r: 47 - i * 9, tone: RING_TONES[i] };
  });
  return (
    <section className="ay-hh-goals" aria-labelledby="ay-hh-goals-title">
      <div className="ay-hh-sechead">
        <h3 id="ay-hh-goals-title">Your goals, covered</h3>
        {onOpen && <button type="button" className="ay-hh-link" onClick={onOpen}>See products</button>}
      </div>
      <div className="ay-hh-goals-body">
        <div className="ay-hh-rings" role="img" aria-label={`${covered} of ${goals.length} goals covered by products in your ecosystem`}>
          <svg viewBox="0 0 104 104" aria-hidden="true">
            {rings.map((g) => {
              const C = 2 * Math.PI * g.r;
              return (
                <g key={g.needId} className={`is-${g.tone}`}>
                  <circle className="ay-hh-ring-track" cx="52" cy="52" r={g.r} />
                  {g.level > 0 && <circle className="ay-hh-ring-arc" cx="52" cy="52" r={g.r} strokeDasharray={`${(g.level / 3) * C} ${C}`} style={{ '--c': C }} transform="rotate(-90 52 52)" />}
                </g>
              );
            })}
          </svg>
          <span aria-hidden="true"><b>{covered}/{goals.length}</b></span>
        </div>
        <ul className="ay-hh-goal-legend">
          {rings.map((g) => (
            <li key={g.needId} className={`is-${g.tone}`}>
              <i aria-hidden="true" />
              <span className="ay-hh-goal-name">{g.label}</span>
              {g.level > 0
                ? <Meter level={g.level} short />
                : <small>{g.match ? 'Matched, not added yet' : 'Not covered yet'}</small>}
            </li>
          ))}
        </ul>
      </div>
      <p className="ay-hh-note">Each ring fills with the strongest evidence among your products for that goal.</p>
    </section>
  );
}

const STATUS = { sky: 'Estimate', ink: 'Estimate', butter: 'Reminder', pink: 'Estimate' };

function ComingUp({ items, today }) {
  if (!items.length) return null;
  return (
    <section className="ay-hh-coming" aria-labelledby="ay-hh-coming-title">
      <h3 id="ay-hh-coming-title" className="ay-hh-h3">Coming up</h3>
      <ol>
        {items.map((e) => {
          const n = daysFrom(today, e.day);
          return (
            <li key={e.title + e.day} className={`is-${e.tone}`}>
              <span className="ay-hh-date" aria-hidden="true"><b>{fmtDay(e.day).split(' ')[1]}</b><small>{fmtWeekday(e.day)}</small></span>
              <span className="ay-hh-coming-text">
                <span className="ay-hh-coming-title"><b>{e.title}</b><span className="ay-hh-pill">{n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`}</span></span>
                <span className="sr-only">{fmtDay(e.day)}. {STATUS[e.tone] || ''}.</span>
                {e.sub && <small>{e.sub}</small>}
                {e.expect && <small className="is-expect">{e.expect}{e.source && <> <SourceLink source={{ ...e.source, label: 'Source' }} /></>}</small>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Tile({ tone, label, big, sub, onOpen, aria, children, i }) {
  return (
    <li className={`ay-hh-tile is-${tone}`} style={{ '--i': i }}>
      <button type="button" onClick={onOpen} aria-label={aria}>
        <span className="ay-hh-tile-label">{label}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg></span>
        <span className="ay-hh-tile-big">{big}</span>
        {sub && <span className="ay-hh-tile-sub">{sub}</span>}
        {children}
      </button>
    </li>
  );
}

export default function HealthHome({
  name = '', rows = [], sections = [], matchContext = null, today, needIds = [], hormonalBC = false,
  products = [], routineProducts = [], routineOutcomes = {}, matches = [], onOpenProduct, onAsk, onAddGoal, onOpenRoutine, onOpenCheckin, footer = null, surface = 'app',
  todayFeed = null,
}) {
  const [tab, setTab] = useState('summary');
  const [range, setRange] = useState('month');
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState(loadLayout);
  const [added, setAdded] = useState({});
  const [activeInsight, setActiveInsight] = useState(null);
  const topRef = useRef(null);

  const days = RANGES.find((r) => r.id === range).days;
  const dash = buildDashboard(rows, { days, today });
  const week = buildDashboard(rows, { days: 30, today });
  const cycle = week.cycle?.cycleDay ? week.cycle : null;
  const ready = sections.filter((s) => s.status === 'ready');
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;
  const sources = [...new Set(sections.flatMap((s) => s.sources || []))];
  const phase = cycle ? estimatePhase(cycle) : null;

  const explained = explainWeek(rows, { today, cycle, estimate, hormonalBC, max: 7 });
  const insights = explained.insights;
  // Anything worth checking first, then explainWeek's own order (team direction 46).
  const stories = insightStories(insights, { hormonalBC });
  const storyFor = (id) => stories.find((x) => x.insight.id === id)?.story || null;
  const ctx = explained.ctx;
  const picks = weekPicks({ ctx, insights, needIds, products, matches });
  const coming = comingUp(cycle, estimate, today, { hormonalBC, hasProducts: products.length > 0 && Boolean(onOpenRoutine) });
  const compare = phaseCompare(rows, { today, cycle, hormonalBC });
  const ranges = normalRanges(rows, { today, hormonalBC });
  const goals = goalsCovered({ needIds, products, matches });
  const effects = effectChecks(rows, { today, products });
  const adds = aynaAdds({ insights, picks, products, needIds, phaseName: ctx.phase ? ctx.phase.name.toLowerCase() : null });
  const suggestions = (onAddGoal && matchContext?.suggestions) || [];
  const asked = new Set(insights.map((i) => i.question));
  const questions = weekQuestions({ insights: [], ctx, picks }).filter((q) => !asked.has(q));
  if (ranges && !ranges.allOk) questions.push('Is my cycle length something to ask a clinician about?');
  const ask = onAsk ? (q) => onAsk(q, { insights, stats: askStats(week, estimate) }) : undefined;

  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Tiles: what she pinned (cycle + metrics with data).
  const allCharts = week.groups.flatMap((g) => g.charts.map((c) => ({ ...c, group: g.id })));
  const items = [
    ...(cycle ? [{ id: 'cycle', label: 'Cycle' }] : []),
    ...allCharts.map((c) => ({ id: c.metric, label: c.label, chart: c })),
  ];
  const itemIds = items.map((i) => i.id);
  const pinned = (layout.pins || DEFAULT_PINS).filter((id) => itemIds.includes(id));
  const togglePin = (id) => { const next = { ...layout, pins: pinned.includes(id) ? pinned.filter((x) => x !== id) : [...pinned, id] }; setLayout(next); saveLayout(next); };
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  const groupTabs = week.groups.map((g) => ({ id: g.id, label: g.label }));
  const hasProductsTab = picks.length > 0 || goals.length > 0 || effects.length > 0;
  const tabs = [
    { id: 'summary', label: 'Summary' },
    ...(week.cycle ? [{ id: 'cycle', label: 'Cycle' }] : []),
    ...groupTabs,
    ...(hasProductsTab ? [{ id: 'products', label: 'Products' }] : []),
  ];
  const current = tabs.some((t) => t.id === tab) ? tab : 'summary';
  const pickTab = (id) => { if (id !== current) haptic('selection'); setTab(id); };
  const open = (id) => {
    haptic('selection');
    setActiveInsight(null);
    setTab(id);
    window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  const showInsight = (insight) => {
    haptic('selection');
    setActiveInsight(insight.id);
    window.requestAnimationFrame(() => topRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  // "See data" from the Daily Rundown (src/components/rundown): open that area's tab.
  useEffect(() => {
    const onTab = (e) => { const id = e?.detail?.tab; if (id && tabs.some((x) => x.id === id)) open(id); };
    window.addEventListener('ayna:health-tab', onTab);
    return () => window.removeEventListener('ayna:health-tab', onTab);
  });
  const add = (needId) => { if (onAddGoal?.(needId)) { haptic('success'); setAdded((a) => ({ ...a, [needId]: true })); } };

  let ti = 0;
  const tiles = [];
  if (pinned.includes('cycle') && cycle) {
    tiles.push(
      <Tile key="cycle" i={ti} tone="pink" label="Cycle" big={phase ? (phase.id === 'period' ? 'On your period' : phase.id === 'ovulation' ? 'Ovulation possible' : phase.id === 'luteal' ? 'Probably after ovulation' : 'Probably before ovulation') : 'Where you are'} sub={`Day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}`} onOpen={() => open('cycle')} aria={`Cycle: usual length ${cycle.avgLength || 'not known yet'} days${phase ? `, now ${phase.name.toLowerCase()}` : ''}. Open cycle details.`}>
        <MiniPhases cycle={cycle} />
      </Tile>,
    );
    ti += 1;
  }
  pinned.filter((id) => id !== 'cycle').forEach((id, k) => {
    const c = byId[id]?.chart;
    if (!c) return;
    // Words first (how it compares with her usual); the number sits underneath (team direction 45).
    const num = shortMetric(c, c.week ?? c.avg);
    const per = c.metric === 'sleep_minutes' ? 'a night' : 'a day';
    const head = metricHeadline(c, isFlat);
    tiles.push(
      <Tile key={id} i={ti} tone={TILE_TONES[k] || 'group'} label={c.label} big={head} sub={`${num} ${per}, last 7 days`} onOpen={() => open(c.group)} aria={`${c.label}: ${head}. ${num} ${per}, last 7 days. ${vsUsual(c)}. See the data.`} />,
    );
    ti += 1;
  });
  if (hasProductsTab) {
    const shown = (picks.length ? picks.map((p) => p.product) : products).slice(0, 3);
    tiles.push(
      <Tile key="picks" i={ti} tone="paper" label="Picks" big={picks.length ? `${picks.length} ${picks.length === 1 ? 'pick' : 'picks'}` : `${products.length} products`} sub={picks.length ? 'For this week, each with a reason' : 'Graded for your goals'} onOpen={() => open('products')} aria={`Picks: ${picks.length ? `${picks.length} for this week` : `${products.length} products`}. Open products.`}>
        {shown.length > 0 && (
          <span className="ay-hh-stack" aria-hidden="true">
            {shown.map((p) => <span key={p.id}><ProductImage product={p} src={p.image || p.imageUrl} alt="" style={{ objectFit: 'contain' }} /></span>)}
          </span>
        )}
      </Tile>,
    );
  }

  const summary = (
    <div className="ay-hh-summary">
      <div className="ay-hh-main">
        <Hero cycle={cycle} ctx={ctx} stories={stories.slice(0, 3)} fallback={weekSummary(ready)} onOpenInsight={showInsight} />
        <RecentCheckin products={routineProducts} outcomes={routineOutcomes} onOpenRoutine={onOpenRoutine} />
        <TriedSoFar products={routineProducts} outcomes={routineOutcomes} onOpenRoutine={onOpenRoutine} />
        {onOpenCheckin && <button type="button" className="ay-hh-checkin-link" onClick={onOpenCheckin}>Log how you felt this month →</button>}
        {surface === 'app' && tabs.length > 1 && <button type="button" className="ay-hh-health-link" onClick={() => open(tabs[1].id)}>Explore all health data →</button>}
        <section className="ay-hh-tiles-sec" aria-labelledby="ay-hh-tiles-title">
          <div className="ay-hh-sechead">
            <h3 id="ay-hh-tiles-title" className="ay-hh-h3">{editing ? 'Choose your tiles' : 'Your areas, last 7 days'}</h3>
            {items.length > 0 && <button type="button" className="ay-hh-link" aria-expanded={editing} onClick={() => setEditing((v) => !v)}>{editing ? 'Done' : 'Edit'}</button>}
          </div>
          {editing ? (
            <ul className="ay-hh-editlist" aria-label="Choose which tiles show">
              {items.map((it) => (
                <li key={it.id}>
                  <span>{it.label}</span>
                  <button type="button" role="switch" aria-checked={pinned.includes(it.id)} aria-label={`Show ${it.label}`} className="ay-hc-switch" onClick={() => togglePin(it.id)}><span /></button>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="ay-hh-tiles" data-count={tiles.length}>{tiles}</ul>
          )}
        </section>
        <details className="ay-hh-personalized"><summary>How ayna puts this together</summary><Adds items={adds} /></details>
      </div>
      <div className="ay-hh-rail">
        <GoalRings goals={goals} onOpen={hasProductsTab ? () => open('products') : null} />
        <ComingUp items={coming} today={today} />
        {suggestions.length > 0 && (
          <section className="ay-hh-suggest" aria-labelledby="ay-hh-suggest-title">
            <h3 id="ay-hh-suggest-title" className="ay-hh-h3">Something to add?</h3>
            {suggestions.map((s) => (
              <div key={s.needId} className="ay-hh-suggest-item">
                <p>{s.summary}. Want ayna to match you for {SUGGEST_LABEL[s.needId] || 'it'} too?</p>
                {added[s.needId]
                  ? <p className="ay-hh-added" role="status">Added. Your matches now include {SUGGEST_LABEL[s.needId] || 'it'}.</p>
                  : <button type="button" className="ay-hh-btn" onClick={() => add(s.needId)}>Add {SUGGEST_LABEL[s.needId] || 'it'} to my goals</button>}
              </div>
            ))}
          </section>
        )}
        {ask && questions.length > 0 && (
          <section className="ay-hh-askweek" aria-labelledby="ay-hh-askweek-title">
            <h3 id="ay-hh-askweek-title" className="ay-hh-h3">Ask ayna about your week</h3>
            <ul>
              {questions.slice(0, 3).map((q) => (
                <li key={q}><button type="button" onClick={() => ask(q)}><span>{q}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg></button></li>
              ))}
            </ul>
          </section>
        )}
        {ready.length > 0 && (
          <details className="ay-hh-fold">
            {/* Folded: the hero carries the changes that matter; this is every area, one line each. */}
            <summary><span className="ay-hh-h3">Your week, in short</span><small>Every area, one line each</small></summary>
            <ul>
              {ready.map((s) => {
                const boosted = s.signal && matchContext?.byNeed?.[s.signal.needId];
                return (
                  <li key={s.id}>
                    <b>{s.title}</b>
                    <span>{s.plain || s.explanation || s.headline}</span>
                    {boosted && <small>Because {SUGGEST_LABEL[s.signal.needId] || 'this'} is one of your goals, those picks rank a little higher for you right now.</small>}
                  </li>
                );
              })}
            </ul>
            {sources.length > 0 && <p className="ay-hh-note">From {sourceNames(sources)}. Trends, not diagnoses.</p>}
          </details>
        )}
        <TodayPlan products={routineProducts} needIds={needIds} onOpenRoutine={onOpenRoutine} />
        {onOpenRoutine && <button type="button" className="ay-hh-routine" onClick={onOpenRoutine}><span><b>Your routine and shopping list</b><small>Choose products, track what you have, shop your routine</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>}
        {effects.length > 0 && <section className="ay-hh-effects" aria-labelledby="ay-hh-effects-title"><h3 id="ay-hh-effects-title" className="ay-hh-h3">Is your routine working?</h3><p>Changes since you added a product, using the data you connected.</p>{effects.slice(0, 2).map((effect) => <div key={effect.product.id}><b>{effect.product.name}</b><p>{effect.text}</p><small>{effect.caveat}</small></div>)}</section>}
      </div>
    </div>
  );

  const rangeTabs = (
    <div className="ay-hh-range" role="group" aria-label="Time range">
      {RANGES.map((r) => <button key={r.id} type="button" aria-pressed={range === r.id} className={range === r.id ? 'is-on' : ''} onClick={() => setRange(r.id)}>{r.label}</button>)}
    </div>
  );

  const cycleTab = (
    <div className="ay-hh-detail">
      {cycle && (
        <section className="ay-hh-cyclehero" aria-labelledby="ay-hh-cycle-title">
          <div className="ay-hh-cyclehero-ring">
            <CycleRing cycleDay={cycle.cycleDay} avgLength={cycle.avgLength} periodLength={cycle.periodLength} windowStart={phase?.windowStart} windowEnd={phase?.windowEnd} />
            <span><small>Cycle day</small><b id="ay-hh-cycle-title">{cycle.cycleDay}</b>{cycle.avgLength && <small>of about {cycle.avgLength}</small>}</span>
          </div>
          <div className="ay-hh-cyclehero-text">
            {phase && <p className="ay-hh-phase-name">{phase.id === 'period' ? 'You are on your period' : phase.id === 'ovulation' ? 'Ovulation could happen in these days' : phase.id === 'luteal' ? 'Ovulation has probably happened' : 'Ovulation probably has not happened yet'}</p>}
            <p className="ay-hh-next">{estimate ? <b>Next period around {fmtDay(estimate.day)}</b> : 'Log a few more periods and ayna can estimate your next one.'}</p>
            <ul className="ay-hh-ringkey" aria-hidden="true"><li><i className="is-period" />Period</li>{phase?.windowStart && <li><i className="is-window" />Possible ovulation days</li>}<li><i className="is-today" />Today</li></ul>
          </div>
        </section>
      )}
      {cycle && <div className="ay-hh-group"><PhaseStrip cycle={cycle} /></div>}
      <PhaseCompare data={compare} />
      <NormalRanges data={ranges} />
      {dash.cycle && dash.cycle.lengths.length >= 2 && (
        <article className="ay-hh-chart">
          <header>
            <h3>Cycle length</h3>
            <p className="ay-hh-avg"><b>{dash.cycle.avgLength} days</b> average of your last {dash.cycle.lengths.length}</p>
          </header>
          <HealthChart chart={{ metric: 'cycle_length', label: 'Cycle length', type: 'bar', usual: null, points: dash.cycle.lengths.map((c) => ({ day: c.start, value: c.days })) }} />
          {dash.cycle.sources.length > 0 && <p className="ay-hh-from">From {sourceNames(dash.cycle.sources)}</p>}
        </article>
      )}
      {phase && (
        <details className="ay-hh-fold is-quiet">
          <summary><span className="ay-hh-h3">How we estimate this</span></summary>
          <p>{phase.basis}</p>
          {estimate && <p>{estimate.basis}</p>}
          <p className="ay-hh-note">Sources: {PHASE_SOURCES.map((src, i) => <span key={src.url}>{i ? ', ' : ''}<a href={src.url} target="_blank" rel="noopener noreferrer">{src.label}</a></span>)}</p>
        </details>
      )}
      {!cycle && !(dash.cycle && dash.cycle.lengths.length >= 2) && <p className="ay-hh-note">Log a few more periods and ayna can chart your cycle length.</p>}
    </div>
  );

  const group = groupTabs.find((g) => g.id === current);
  const groupTab = group && (
    <div className="ay-hh-detail">
      <div className="ay-hh-detailhead">
        <p className="ay-hh-note">This week next to your usual, then the last {days} days.</p>
        {rangeTabs}
      </div>
      {(week.groups.find((g) => g.id === current)?.charts || []).map((wc) => {
        const c = dash.groups.find((g) => g.id === current)?.charts.find((x) => x.metric === wc.metric);
        const story = stories.find((x) => x.insight.metric === wc.metric)?.story || null;
        return (
          <article key={wc.metric} className="ay-hh-chart">
            <header className="ay-hh-chart-head">
              <h3>{wc.label}</h3>
              {!story && <p className="ay-hh-chart-status">{metricHeadline(wc, isFlat)}</p>}
              {!story && <p className="ay-hh-vs">{vsUsual(wc)}</p>}
            </header>
            {story && <InsightStory story={story} mode="full" idBase={`ay-hh-story-${wc.metric}`} headingLevel={4} />}
            {/* The numbers and the chart sit behind See data (team direction 45). */}
            <details className="ay-hh-seedata">
              <summary>{story ? 'See the chart' : 'See data'}</summary>
              <p className="ay-hh-big">{shortMetric(wc, wc.week ?? wc.avg)}<small>{wc.metric === 'sleep_minutes' ? ' a night' : ''}, last 7 days</small></p>
              <span className="ay-hh-stats">{weekStats(wc).map((s) => <span key={s.k}><b>{s.v}</b><small>{s.k}</small></span>)}</span>
              {c ? (
                <>
                  <p className="ay-hh-avg"><b>{formatMetric(c.metric, c.avg)}</b> average, last {days} days</p>
                  <HealthChart chart={c} />
                </>
              ) : <p className="ay-hh-note">No readings in the last {days} days. Try a longer range.</p>}
              {wc.sources.length > 0 && <p className="ay-hh-from">From {sourceNames(wc.sources)}</p>}
            </details>
          </article>
        );
      })}
    </div>
  );

  const productsTab = (
    <div className="ay-hh-detail">
      <WeekPicks picks={picks} onOpenProduct={onOpenProduct} />
      <GoalsCovered goals={goals} effects={effects} onOpenProduct={onOpenProduct} title="Each goal, with your products" />
    </div>
  );

  const selectedInsight = insights.find((insight) => insight.id === activeInsight);
  const selectedChart = selectedInsight && (allCharts.find((chart) => chart.metric === selectedInsight.metric)
    || (selectedInsight.metric === 'cycle_length' && cycle?.lengths?.length >= 4 ? {
      metric: 'cycle_length', week: cycle.lengths.at(-1).days,
      usual: cycle.lengths.slice(-4, -1).reduce((total, item) => total + item.days, 0) / 3,
      group: 'cycle',
    } : null));
  const selectedPick = selectedInsight && pickForInsight(selectedInsight, picks);

  return (
    <div className={`ay-hh is-${surface}`}>
      <header className="ay-hh-hello" ref={topRef}>
        <p>{fmtLongDay(today)}</p>
        <h2>{hello}{name ? `, ${name}` : ''}</h2>
        {sources.length > 0 && <p>Health data from {sourceNames(sources)} · compared with your own history</p>}
      </header>
      {(surface !== 'app' || current !== 'summary') && <div className="ay-hh-areas"><Tabs tabs={tabs} value={current} onChange={pickTab} label="Health areas" idBase="ay-hh-area" className="is-areas" /></div>}
      <div className="ay-hh-panel" role={surface === 'app' && current === 'summary' ? 'region' : 'tabpanel'} id="ay-hh-area-panel" aria-label={surface === 'app' && current === 'summary' ? 'Today' : undefined} aria-labelledby={surface === 'app' && current === 'summary' ? undefined : `ay-hh-area-tab-${current}`} key={current}>
        {current === 'summary' && !selectedInsight && todayFeed}
        {current === 'summary' && (selectedInsight
          ? <InsightDetail insight={selectedInsight} story={storyFor(selectedInsight.id)} chart={selectedChart} pick={selectedPick} onBack={() => setActiveInsight(null)} onOpenMetric={() => open(selectedChart?.group || 'cycle')} onOpenProduct={onOpenProduct} onOpenRoutine={onOpenRoutine} onAsk={ask} />
          : summary)}
        {current === 'cycle' && cycleTab}
        {group && groupTab}
        {current === 'products' && productsTab}
      </div>
      <footer className="ay-hh-foot">
        <p>These describe your data. They aren&rsquo;t medical advice. If something worries you, talk to a clinician.</p>
        {footer}
      </footer>
    </div>
  );
}


import { useEffect, useRef, useState } from 'react';
import { buildDashboard, RANGES } from '../../health/dashboard.js';
import { estimatePhase, PHASE_SOURCES } from '../../health/phase.js';
import { explainWeek } from '../../health/weekInsights.js';
import { weekPicks } from '../../health/weekPicks.js';
import { fitFor } from '../../health/weekPicks.js';
import { comingUp } from '../../health/comingUp.js';
import { phaseCompare, normalRanges, goalsCovered, effectChecks, aynaAdds } from '../../health/beyondNumbers.js';
import { chartFacts, findingStatus, findingTitle, glanceWords, lastDays, short, syncState, usualBand, valueWithUsual } from '../../health/dashView.js';
import { SOURCE_NAMES } from '../data/healthConnections.js';
import { askStats, weekQuestions } from '../utils/dashboardAsk.js';
import { haptic } from '../../utils/haptics.js';
import { reasonForProduct } from '../../health/plan.js';
import { OUTCOME_LABELS } from '../../health/routineOutcome.js';
import { CycleRing as DsRing } from '../../components/personality/DS.jsx';
import { SourceLink, PhaseCompare, NormalRanges, WeekPicks, Meter } from './HealthBento.jsx';
import { AreaChart, FindingItem, GoalList, PhaseLine, RangeBar, RangePills, RoutineEffect, Sparkline } from './DashParts.jsx';
import { OutlineButton, PillTabs, StatusPill, StickerButton, TextButton } from '../../components/ui/ay/index.js';
import { insightStories } from '../../health/insightStory.js';
import { displayName } from '../utils/displayName.js';
import '../../styles/week-explained.css';
import '../../styles/health-home.css';

/**
 * Your data: the health dashboard, app and website (one component).
 * Dashboard audit + build brief (Oct 25): read in five seconds.
 *
 *   Title (app: "Your data" with the cycle ring; website: the slim band in WebHealth)
 *   Area tabs: Summary · Cycle · Sleep · Body · Routine (pill tabs; only areas with data)
 *     + source line with the sync time (stale after 2 days: "Last synced Thu" + Refresh)
 *   Summary:
 *     Today's Rundown, one line (website only; the app's Home has it)
 *     Your week at a glance: one row per area, words, number + usual, 7-day sparkline
 *     N changes this week (calm findings list)  |  Is your routine working? · Coming up
 *                                               |  Something to add? · Ask ayna about your week
 *     Today's things and the log (website only), then Your week in short,
 *     How ayna puts this together and the disclaimer, once.
 *   Each area tab leads with its chart (7/30/90 days, her usual band, last 7 days in espresso).
 *
 * Do not change: words first, number underneath; compared only with her own
 * usual; a block only when its data exists; .gov-only sources; "Is your
 * routine working?" and its caveat; the cycle ring; Ask uses health data
 * only with her opt-in (HealthDashboard builds the context).
 */

const fmtDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fmtWeekday = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
const fmtLongDay = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const sourceNames = (sources) => sources.map((s) => SOURCE_NAMES[s] || s).join(' and ');
const DAY = 86400000;
const daysFrom = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / DAY);

const SUGGEST_LABEL = { 'sleep.trouble': 'sleep', 'cycle.irregular': 'irregular cycles', 'energy.fatigue': 'low energy' };
const BODY_GROUPS = ['heart', 'temperature', 'activity', 'recovery'];
const AREA_OF_METRIC = (metric, groupOf) => (metric === 'cycle_length' || metric === 'menstrual_flow' ? 'cycle' : groupOf[metric] === 'sleep' ? 'sleep' : 'body');
// Old area ids (the Rundown's "See data", older links) to the five areas.
const LEGACY_TAB = { heart: 'body', temperature: 'body', activity: 'body', recovery: 'body', products: 'routine' };

// Further reading under a finding. .gov pages only (founder rule, Oct 24 2026).
const INSIGHT_READING = {
  'sleep-short': { label: 'CDC: Sleep and heart health', url: 'https://www.cdc.gov/heart-disease/about/sleep-and-heart-health.html' },
  'sleep-long': { label: 'CDC: Sleep and heart health', url: 'https://www.cdc.gov/heart-disease/about/sleep-and-heart-health.html' },
  'heart-up': { label: 'MedlinePlus: Pulse', url: 'https://medlineplus.gov/ency/article/003399.htm' },
  'heart-down': { label: 'MedlinePlus: Pulse', url: 'https://medlineplus.gov/ency/article/003399.htm' },
  'steps-lower': { label: 'CDC: Benefits of physical activity', url: 'https://www.cdc.gov/physical-activity-basics/health-benefits/adults.html' },
};

const PHASE_WORDS = { period: 'On your period', ovulation: 'Ovulation possible', luteal: 'Probably after ovulation', follicular: 'Probably before ovulation' };

/**
 * No health data yet (app): the same title and a words-only preview of what
 * the dashboard will hold (dashboard audit 9.3). Never a number, never fake data.
 */
const PREVIEW = [
  ['Cycle', 'Where you are, and what usually comes next'],
  ['Sleep', 'Your nights next to your own usual'],
  ['Body', 'Resting heart rate, heart rate variability, temperature and steps'],
  ['Routine', 'Whether the products you added line up with a change'],
];
export function HealthEmpty({ today, onConnect, onOpenCheckin, goalCount = 0, signedOut = false, todayFeed = null, children, title = 'Your data' }) {
  return (
    <div className="ay-db is-app is-empty">
      <header className="ay-db-title">
        <div>
          <h2 className="ay-db-h1">{title}</h2>
          <p className="ay-db-source">{fmtLongDay(today)}</p>
        </div>
      </header>
      {todayFeed}
      <section className="ay-db-card ay-db-empty" aria-labelledby="ay-db-empty-title">
        <h3 id="ay-db-empty-title" className="ay-db-h3">{goalCount ? "We're starting with your goals" : 'Your dashboard fills in once data is connected'}</h3>
        <p>{goalCount ? `You chose ${goalCount} ${goalCount === 1 ? 'goal' : 'goals'}. Your matches are below. ` : ''}Connect Apple Health or Oura, upload a file, or keep using quick check-ins. Either works.</p>
        <dl className="ay-db-facts is-preview">
          {PREVIEW.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
        </dl>
        {onConnect && <StickerButton onClick={onConnect}>{signedOut ? 'Sign in to connect health data' : 'Connect Apple Health, Oura or a file'}</StickerButton>}
        {signedOut && !onConnect && <p className="ay-db-source">Sign in to see your health data here.</p>}
      </section>
      {children}
      {onOpenCheckin && <TextButton onClick={onOpenCheckin}>Log how you felt this month</TextButton>}
      <p className="ay-db-disclaimer">Compared only with your own usual. Patterns, not a diagnosis.</p>
    </div>
  );
}

function TodayPlan({ products, needIds, onOpenRoutine }) {
  if (!onOpenRoutine || !products.length) return null;
  return <section className="ay-db-card" aria-labelledby="ay-db-plan-title">
    <h3 id="ay-db-plan-title" className="ay-db-h3">What fits in your routine</h3>
    <dl className="ay-db-facts">{products.slice(0, 2).map((product) => <div key={product.id}><dt>{product.name}</dt><dd>{reasonForProduct(product, needIds) || 'In your selected routine'}</dd></div>)}</dl>
    <TextButton onClick={onOpenRoutine}>View and edit your routine</TextButton>
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
  return <section className="ay-db-card" aria-labelledby="ay-db-recent-title">
    <h3 id="ay-db-recent-title" className="ay-db-h3">{latest.product.name}</h3>
    <p>You marked this product “{OUTCOME_LABELS[latest.rating].toLowerCase()}” on {fmtDay(latest.day)}. This is your report, not a measure of medical effectiveness.</p>
    <TextButton onClick={onOpenRoutine}>See your product check-ins</TextButton>
  </section>;
}

function TriedSoFar({ products, outcomes, onOpenRoutine }) {
  const tried = products.map((product) => {
    const history = Array.isArray(outcomes[product.id]) ? outcomes[product.id].filter((entry) => OUTCOME_LABELS[entry?.rating]) : [];
    return { product, history, helping: history.filter((entry) => entry.rating === 'helping').length };
  }).filter((item) => item.history.length);
  if (!tried.length) return null;
  return <details className="ay-db-fold">
    <summary>What you’ve tried <StatusPill>{tried.length} {tried.length === 1 ? 'product' : 'products'}</StatusPill></summary>
    <dl className="ay-db-facts">{tried.map(({ product, history, helping }) => <div key={product.id}>
      <dt>{product.name}</dt>
      <dd>{history.length >= 3 ? `Marked helping on ${helping} of ${history.length} check-ins` : `${history.length} dated ${history.length === 1 ? 'check-in' : 'check-ins'} so far`}</dd>
    </div>)}</dl>
    <p className="ay-db-muted">These are your impressions. They do not show that a product caused a health change.</p>
    {onOpenRoutine && <TextButton onClick={onOpenRoutine}>Review product check-ins</TextButton>}
  </details>;
}

function ComingUp({ items, today }) {
  if (!items.length) return null;
  return (
    <section className="ay-db-card" aria-labelledby="ay-db-coming-title">
      <h3 id="ay-db-coming-title" className="ay-db-h3">Coming up</h3>
      <ol className="ay-db-coming">
        {items.map((e) => {
          const n = daysFrom(today, e.day);
          return (
            <li key={e.title + e.day}>
              <span className="ay-db-date" aria-hidden="true"><b>{fmtDay(e.day).split(' ')[1]}</b><small>{fmtWeekday(e.day)}</small></span>
              <span>
                <span className="ay-db-coming-t"><b>{e.title}</b><StatusPill>{n <= 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`}</StatusPill></span>
                <span className="sr-only">{fmtDay(e.day)}.</span>
                {e.sub && <small>{e.sub}</small>}
                {e.expect && <small>{e.expect}{e.source && <> <SourceLink source={{ ...e.source, label: 'Source' }} /></>}</small>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * Today's Rundown as one line (website dashboard): the Rundown itself still
 * lives in Today's feed; this line starts it (src/components/rundown/Rundown.jsx
 * listens for ayna:rundown-start and says how many cards it has).
 */
function RundownEntry({ onShown }) {
  const [count, setCount] = useState(null);
  useEffect(() => {
    const on = (e) => { const n = e?.detail?.count; setCount(Number.isFinite(n) ? n : null); };
    window.addEventListener('ayna:rundown-state', on);
    try { window.dispatchEvent(new CustomEvent('ayna:rundown-ask')); } catch { /* old browser */ }
    return () => window.removeEventListener('ayna:rundown-state', on);
  }, []);
  useEffect(() => { onShown?.(Boolean(count)); }, [count, onShown]);
  if (!count) return null;
  return (
    <div className="ay-db-rundown">
      <p><b>Today&rsquo;s Rundown</b> <span>{count} {count === 1 ? 'thing' : 'things'}</span></p>
      <StickerButton onClick={() => { try { window.dispatchEvent(new CustomEvent('ayna:rundown-start')); } catch { /* old browser */ } }}>Start</StickerButton>
    </div>
  );
}

export default function HealthHome({
  rows = [], sections = [], matchContext = null, today, needIds = [], hormonalBC = false,
  products = [], routineProducts = [], routineOutcomes = {}, matches = [], onOpenProduct, onAsk, onAddGoal, onOpenRoutine, onExplore = null, onOpenCheckin, footer = null, surface = 'app',
  todayFeed = null,
  // The app shows its title row ("Your data" + ring); the website's band carries it (hello=false).
  hello: showTitle = true,
  helloAside = null,
  title = 'Your data',
  titleLevel = 2,
  connections = [],
  onRefresh = null,
  // 'error' with rows still here: say so and keep the last-known values (dashboard audit 9.3).
  status = 'ready',
}) {
  const [tab, setTab] = useState('summary');
  const [range, setRange] = useState('month');
  const [added, setAdded] = useState({});
  const [rundownShown, setRundownShown] = useState(false);
  const [copied, setCopied] = useState(false);
  const topRef = useRef(null);

  const days = RANGES.find((r) => r.id === range).days;
  const dash = buildDashboard(rows, { days, today });
  const week = buildDashboard(rows, { days: 30, today });
  const long = buildDashboard(rows, { days: 90, today });
  const cycle = week.cycle?.cycleDay ? week.cycle : null;
  const ready = sections.filter((s) => s.status === 'ready');
  const estimate = sections.find((s) => s.id === 'cycle')?.estimate || null;
  const sources = [...new Set(sections.flatMap((s) => s.sources || []))];
  const phase = cycle && !hormonalBC ? estimatePhase(cycle) : null;
  const hasData = rows.length > 0 && !week.empty;

  const explained = explainWeek(rows, { today, cycle, estimate, hormonalBC, max: 7 });
  const insights = explained.insights;
  const stories = insightStories(insights, { hormonalBC });
  const ctx = explained.ctx;
  const { status: findingStatusBy, backToUsual } = findingStatus(rows, insights, { today, hormonalBC });
  const picks = weekPicks({ ctx, insights, needIds, products, matches });
  const coming = comingUp(cycle, estimate, today, { hormonalBC, hasProducts: products.length > 0 && Boolean(onOpenRoutine) });
  const compare = phaseCompare(rows, { today, cycle, hormonalBC });
  const ranges = normalRanges(rows, { today, hormonalBC });
  const goals = goalsCovered({ needIds, products, matches });
  const effects = effectChecks(rows, { today, products: [...products, ...routineProducts.filter((p) => !products.some((x) => x.id === p.id))] });
  const adds = aynaAdds({ insights, picks, products, needIds, phaseName: ctx.phase ? ctx.phase.name.toLowerCase() : null });
  const suggestions = (onAddGoal && matchContext?.suggestions) || [];
  // Three starters built from her findings (dashboard audit 7.13); the same on both platforms.
  // Each from a finding shows that finding as its reason (same shape as p9/ask's startersFromFindings).
  const starters = [];
  for (const i of insights) if (i.question && !starters.some((x) => x.question === i.question) && starters.length < 3) starters.push({ question: i.question, reason: findingTitle(i) });
  for (const q of weekQuestions({ insights: [], ctx, picks })) if (starters.length < 3 && !starters.some((x) => x.question === q)) starters.push({ question: q, reason: '' });
  if (ranges && !ranges.allOk && starters.length < 3) starters.push({ question: 'Is my cycle length something to ask a clinician about?', reason: '' });
  const ask = onAsk ? (q) => onAsk(q, { insights, stats: askStats(week, estimate) }) : undefined;
  const sync = syncState(connections);

  const allCharts = week.groups.flatMap((g) => g.charts.map((c) => ({ ...c, group: g.id })));
  const groupOf = Object.fromEntries(allCharts.map((c) => [c.metric, c.group]));
  const chartOf = (m) => allCharts.find((c) => c.metric === m) || null;
  const rangeChartOf = (m) => dash.groups.flatMap((g) => g.charts).find((c) => c.metric === m) || null;
  const bandOf = (m) => usualBand(long.groups.flatMap((g) => g.charts).find((c) => c.metric === m)?.points, today);

  const sleepCharts = week.groups.find((g) => g.id === 'sleep')?.charts || [];
  const bodyCharts = week.groups.filter((g) => BODY_GROUPS.includes(g.id)).flatMap((g) => g.charts);
  const hasRoutine = picks.length > 0 || goals.length > 0 || effects.length > 0 || routineProducts.length > 0 || Boolean(onOpenRoutine);
  const tabs = hasData ? [
    { id: 'summary', label: 'Summary' },
    ...(week.cycle ? [{ id: 'cycle', label: 'Cycle' }] : []),
    ...(sleepCharts.length ? [{ id: 'sleep', label: 'Sleep' }] : []),
    ...(bodyCharts.length ? [{ id: 'body', label: 'Body' }] : []),
    // Always offered (same tab set everywhere); without a routine it shows a calm empty state, never sample data.
    { id: 'routine', label: 'Routine' },
  ] : [];
  const current = tabs.some((t) => t.id === tab) ? tab : 'summary';
  const open = (id) => {
    const to = LEGACY_TAB[id] || id;
    if (!tabs.some((t) => t.id === to)) return;
    haptic('selection');
    setTab(to);
    window.requestAnimationFrame(() => topRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' }));
  };
  const pickTab = (id) => { if (id !== current) haptic('selection'); setTab(id); };
  // "See data" from the Daily Rundown (src/components/rundown): open that area's tab.
  useEffect(() => {
    const onTab = (e) => { const id = e?.detail?.tab; if (id) open(id); };
    window.addEventListener('ayna:health-tab', onTab);
    return () => window.removeEventListener('ayna:health-tab', onTab);
  });
  const add = (needId) => { if (onAddGoal?.(needId)) { haptic('success'); setAdded((a) => ({ ...a, [needId]: true })); } };

  /* ------------------------------ Week at a glance ------------------------------ */
  const heart = chartOf('resting_hr_bpm') || chartOf('hrv_rmssd_ms') || chartOf('hrv_sdnn_ms');
  const steps = chartOf('steps');
  const glanceMetrics = [chartOf('sleep_minutes'), heart, steps].filter(Boolean);
  if (glanceMetrics.length + (cycle ? 1 : 0) < 4) {
    const temp = chartOf('temp_deviation_c') || chartOf('basal_temp_c') || chartOf('skin_temp_night_c');
    if (temp) glanceMetrics.push(temp);
  }
  const glance = [
    ...(cycle ? [{
      id: 'cycle', area: 'cycle', label: 'Cycle',
      words: hormonalBC ? 'Bleeding pattern' : phase ? PHASE_WORDS[phase.id] || 'Where you are' : 'Where you are',
      value: hormonalBC ? `Day ${cycle.cycleDay} since your last bleed` : `Day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}`,
      visual: <PhaseLine cycle={cycle} hormonalBC={hormonalBC} compact />,
    }] : []),
    ...glanceMetrics.map((c) => ({
      id: c.metric, area: AREA_OF_METRIC(c.metric, groupOf),
      label: c.metric === 'sleep_minutes' ? 'Sleep' : c.metric === 'steps' ? 'Steps' : c.label,
      words: glanceWords(c),
      value: valueWithUsual(c),
      visual: <Sparkline points={lastDays(c.points, today)} band={bandOf(c.metric)} metric={c.metric} label={`${c.label}, last 7 days`} />,
    })),
  ];
  const missing = [
    ...(!chartOf('sleep_minutes') ? ['Sleep'] : []),
    ...(!heart ? ['Heart'] : []),
    ...(!steps ? ['Activity'] : []),
  ];
  const glanceBlock = glance.length > 0 && (
    <section className="ay-db-card ay-db-glance" aria-labelledby="ay-db-glance-title">
      <h2 id="ay-db-glance-title" className="ay-db-h2">Your week at a glance</h2>
      <ul>
        {glance.map((g) => (
          <li key={g.id}>
            <button type="button" onClick={() => open(g.area)} aria-label={`${g.label}: ${g.words}. ${g.value}. Open ${g.area}.`}>
              <span className="ay-db-glance-k">{g.label}</span>
              <span className="ay-db-glance-w">{g.words}</span>
              <span className="ay-db-glance-v">{g.value}</span>
              <span className="ay-db-glance-viz" aria-hidden="true">{g.visual}</span>
            </button>
          </li>
        ))}
      </ul>
      {missing.length > 0 && missing.length < 3 && <p className="ay-db-muted">{missing.join(' and ')}: connect a watch or ring to see {missing.length > 1 ? 'these' : 'this'}.</p>}
    </section>
  );

  /* ---------------------------------- Findings --------------------------------- */
  const findingFor = ({ insight, story }, { openFirst = false } = {}) => {
    const chart = chartOf(insight.metric);
    const reading = INSIGHT_READING[insight.signal] ? [INSIGHT_READING[insight.signal]] : [];
    return (
      <FindingItem
        key={insight.id}
        idBase={`ay-db-f-${current}-${insight.id}`}
        title={findingTitle(insight)}
        status={findingStatusBy[insight.signal] || null}
        insight={insight}
        story={story}
        chart={chart}
        band={chart ? bandOf(chart.metric) : null}
        today={today}
        reading={reading.filter((r) => !(insight.sources || []).some((s) => s.url === r.url))}
        from={insight.from?.length ? sourceNames(insight.from) : ''}
        onSeeChart={current === 'summary' ? () => open(AREA_OF_METRIC(insight.metric, groupOf)) : null}
        open={openFirst}
      />
    );
  };
  const findings = stories.length > 0 && (
    <section className="ay-db-card ay-db-findings" aria-labelledby="ay-db-findings-title">
      <h2 id="ay-db-findings-title" className="ay-db-h2">{stories.length === 1 ? '1 change this week' : `${stories.length} changes this week`}</h2>
      <ul>
        {stories.map((x) => findingFor(x))}
        {backToUsual.map((area) => <li key={area} className="ay-db-finding is-back"><p className="ay-db-h3"><span>{area}: back to your usual</span><StatusPill>Back to usual</StatusPill></p></li>)}
      </ul>
    </section>
  );
  const areaFindings = (area) => stories.filter(({ insight }) => AREA_OF_METRIC(insight.metric, groupOf) === area);

  /* --------------------------------- Right column -------------------------------- */
  const routineWorking = effects.length > 0 && (
    <section className="ay-db-card" aria-labelledby={`ay-db-effect-title-${current}`}>
      <h2 id={`ay-db-effect-title-${current}`} className="ay-db-h2">Is your routine working?</h2>
      {(current === 'summary' ? effects.slice(0, 1) : effects).map((e) => <RoutineEffect key={e.product.id} effect={e} today={today} />)}
      {current === 'summary' && tabs.some((t) => t.id === 'routine')
        ? <TextButton onClick={() => open('routine')}>Keep or swap: see your routine</TextButton>
        : onOpenRoutine && <TextButton onClick={onOpenRoutine}>Keep or swap in your routine</TextButton>}
    </section>
  );
  const suggestBlock = suggestions.length > 0 && (
    <section className="ay-db-card" aria-labelledby="ay-db-suggest-title">
      <h2 id="ay-db-suggest-title" className="ay-db-h2">Something to add?</h2>
      {suggestions.map((s) => {
        const m = [...matches].map((p) => ({ p, fit: fitFor(p, s.needId) })).filter((x) => x.fit?.graded).sort((a, b) => b.fit.level - a.fit.level)[0];
        return (
          <div key={s.needId} className="ay-db-suggest">
            <p>{s.summary}. Want ayna to match you for {SUGGEST_LABEL[s.needId] || 'it'} too?</p>
            {m && onOpenProduct && <button type="button" className="ay-db-match" onClick={() => onOpenProduct(m.p)}><span>{displayName(m.p)}</span><Meter level={m.fit.level} short /></button>}
            {added[s.needId]
              ? <p className="ay-db-muted" role="status">Added. Your matches now include {SUGGEST_LABEL[s.needId] || 'it'}.</p>
              : <OutlineButton onClick={() => add(s.needId)}>Add {SUGGEST_LABEL[s.needId] || 'it'} to my goals</OutlineButton>}
          </div>
        );
      })}
    </section>
  );
  const askBlock = ask && starters.length > 0 && (
    <section className="ay-db-card" aria-labelledby="ay-db-ask-title">
      <h2 id="ay-db-ask-title" className="ay-db-h2">Ask ayna about your week</h2>
      <ul className="ay-db-ask">
        {starters.map((st) => <li key={st.question}><button type="button" onClick={() => ask(st.question)}><span>{st.question}{st.reason && <small>{st.reason}</small>}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M9 7h8v8" /></svg></button></li>)}
      </ul>
    </section>
  );

  const weekShortText = ready.map((s) => `${s.title}: ${s.plain || s.explanation || s.headline}`).join('\n');
  const copyWeek = async () => { try { await navigator.clipboard.writeText(weekShortText); setCopied(true); } catch { setCopied(false); } };
  const bottom = (
    <div className="ay-db-bottom">
      {ready.length > 0 && (
        <details className="ay-db-fold">
          <summary>Your week, in short</summary>
          <dl className="ay-db-facts">
            {ready.map((s) => {
              const boosted = s.signal && matchContext?.byNeed?.[s.signal.needId];
              return <div key={s.id}><dt>{s.title}</dt><dd>{s.plain || s.explanation || s.headline}{boosted && <small> Because {SUGGEST_LABEL[s.signal.needId] || 'this'} is one of your goals, those picks rank a little higher for you right now.</small>}</dd></div>;
            })}
          </dl>
          {typeof navigator !== 'undefined' && navigator.clipboard && <TextButton onClick={copyWeek}>{copied ? 'Copied' : 'Copy my week'}</TextButton>}
        </details>
      )}
      {hasData && (
        <details className="ay-db-fold">
          <summary>How ayna puts this together</summary>
          <dl className="ay-db-facts">{adds.map((x) => <div key={x.id}><dt>{x.label}</dt><dd>{x.text}</dd></div>)}</dl>
        </details>
      )}
    </div>
  );

  /* ---------------------------------- Routine ---------------------------------- */
  const routineBits = (
    <>
      <RecentCheckin products={routineProducts} outcomes={routineOutcomes} onOpenRoutine={onOpenRoutine} />
      <TriedSoFar products={routineProducts} outcomes={routineOutcomes} onOpenRoutine={onOpenRoutine} />
      <TodayPlan products={routineProducts} needIds={needIds} onOpenRoutine={onOpenRoutine} />
      {onOpenRoutine && <button type="button" className="ay-db-row" onClick={onOpenRoutine}><span><b>Your routine and shopping list</b><small>Choose products, track what you have, shop your routine</small></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>}
    </>
  );

  const summary = (
    <div className="ay-db-summary">
      {surface === 'web' && todayFeed && <RundownEntry onShown={setRundownShown} />}
      {glanceBlock}
      <div className="ay-db-cols">
        <div className="ay-db-main">
          {findings}
          {/* Right after the findings they come from (dashboard audit 7.12, 7.13). */}
          {suggestBlock}
          {askBlock}
          {!hasData && routineBits}
          {onOpenCheckin && <TextButton onClick={onOpenCheckin}>Log how you felt this month</TextButton>}
        </div>
        <div className="ay-db-rail">
          {routineWorking}
          <ComingUp items={coming} today={today} />
        </div>
      </div>
      {todayFeed && <div className="ay-db-today">{todayFeed}</div>}
      {bottom}
    </div>
  );

  const rangeRow = <RangePills ranges={RANGES} value={range} onChange={setRange} />;

  const cycleLen = dash.cycle && dash.cycle.lengths.length >= 2 ? { metric: 'cycle_length', label: 'Cycle length', type: 'bar', usual: null, points: dash.cycle.lengths.map((c) => ({ day: c.start, value: c.days })) } : null;
  const cycleTab = (
    <div className="ay-db-detail">
      {cycle && (
        <section className="ay-db-card" aria-labelledby="ay-db-cycle-title">
          <h2 id="ay-db-cycle-title" className="ay-db-h2">{hormonalBC ? 'Bleeding pattern' : phase ? PHASE_WORDS[phase.id] : `Cycle day ${cycle.cycleDay}`}</h2>
          <PhaseLine cycle={cycle} hormonalBC={hormonalBC} />
          <p>{estimate ? <b>Next {hormonalBC ? 'bleed' : 'period'} around {fmtDay(estimate.day)}, estimated</b> : 'Log a few more periods and ayna can estimate your next one.'}</p>
        </section>
      )}
      {areaFindings('cycle').length > 0 && <section className="ay-db-card ay-db-findings" aria-label="Changes in your cycle"><ul>{areaFindings('cycle').map((x, i) => findingFor(x, { openFirst: i === 0 }))}</ul></section>}
      <PhaseCompare data={compare} />
      <NormalRanges data={ranges} />
      {cycleLen && <section className="ay-db-card"><h2 className="ay-db-h2">Cycle length</h2><AreaChart chart={cycleLen} today={today} />{dash.cycle.sources.length > 0 && <p className="ay-db-muted">From {sourceNames(dash.cycle.sources)}</p>}</section>}
      {phase && (
        <details className="ay-db-fold">
          <summary>How we estimate this</summary>
          <p>{phase.basis}</p>
          {estimate && <p>{estimate.basis}</p>}
          <p className="ay-db-muted">Sources: {PHASE_SOURCES.map((src, i) => <span key={src.url}>{i ? ', ' : ''}<SourceLink source={src} /></span>)}</p>
        </details>
      )}
      {!cycle && !cycleLen && <p className="ay-db-muted">Log a few more periods and ayna can chart your cycle length.</p>}
    </div>
  );

  const sleepMain = sleepCharts[0];
  const sleepRange = sleepMain && rangeChartOf(sleepMain.metric);
  const sleepTab = sleepMain && (
    <div className="ay-db-detail">
      <section className="ay-db-card" aria-labelledby="ay-db-sleep-title">
        <div className="ay-db-cardhead">
          <h2 id="ay-db-sleep-title" className="ay-db-h2">{glanceWords(sleepMain)}</h2>
          {rangeRow}
        </div>
        <p className="ay-db-value">{valueWithUsual(sleepMain)}</p>
        {sleepRange ? <AreaChart chart={sleepRange} band={bandOf(sleepMain.metric)} today={today} /> : <p className="ay-db-muted">No readings in the last {days} days. Try a longer range.</p>}
        <dl className="ay-db-facts is-row">{chartFacts(sleepRange).map((f) => <div key={f.k}><dt>{f.k}</dt><dd>{f.v}</dd></div>)}</dl>
        {sleepMain.sources.length > 0 && <p className="ay-db-muted">From {sourceNames(sleepMain.sources)}</p>}
      </section>
      {areaFindings('sleep').length > 0 && <section className="ay-db-card ay-db-findings" aria-label="Changes in your sleep"><ul>{areaFindings('sleep').map((x, i) => findingFor(x, { openFirst: i === 0 }))}</ul></section>}
      {sleepCharts.length > 1 && (
        <div className="ay-db-multiples">
          {sleepCharts.slice(1).map((c) => {
            const rc = rangeChartOf(c.metric);
            return (
              <section key={c.metric} className="ay-db-card ay-db-tile">
                <h3 className="ay-db-k">{c.label}</h3>
                <p className="ay-db-h3">{glanceWords(c)}</p>
                <p className="ay-db-value">{valueWithUsual(c)}</p>
                {rc && <AreaChart chart={rc} band={bandOf(c.metric)} today={today} small />}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );

  const bodyTab = bodyCharts.length > 0 && (
    <div className="ay-db-detail">
      <div className="ay-db-cardhead is-bare"><h2 className="ay-db-h2">Your body, last {days} days</h2>{rangeRow}</div>
      {areaFindings('body').length > 0 && <section className="ay-db-card ay-db-findings" aria-label="Changes in your body data"><ul>{areaFindings('body').map((x) => findingFor(x))}</ul></section>}
      <div className="ay-db-multiples">
        {bodyCharts.map((c) => {
          const rc = rangeChartOf(c.metric);
          const band = bandOf(c.metric);
          const vals = rc?.points.map((p) => p.value) || [];
          return (
            <section key={c.metric} className="ay-db-card ay-db-tile" aria-labelledby={`ay-db-b-${c.metric}`}>
              <h3 id={`ay-db-b-${c.metric}`} className="ay-db-k">{c.label}</h3>
              <p className="ay-db-h3">{glanceWords(c)}</p>
              <p className="ay-db-big">{short(c.metric, c.week ?? c.avg)}<small>{c.usual != null ? `last 7 days · usual ${short(c.metric, c.usual)}` : 'last 7 days'}</small></p>
              {vals.length > 1 && <RangeBar value={c.week} band={band} min={Math.min(...vals, band?.lo ?? Infinity)} max={Math.max(...vals, band?.hi ?? -Infinity)} metric={c.metric} label={c.label} />}
              {rc ? <AreaChart chart={rc} band={band} today={today} small /> : <p className="ay-db-muted">No readings in the last {days} days.</p>}
            </section>
          );
        })}
      </div>
    </div>
  );

  const routineTab = (
    <div className="ay-db-detail">
      {!hasRoutine && (
        <section className="ay-db-card ay-db-empty" aria-labelledby="ay-db-routine-empty">
          <h2 id="ay-db-routine-empty" className="ay-db-h2">Is your routine working?</h2>
          <p>Add a product to your routine to see if it&rsquo;s working.</p>
          {onExplore && <OutlineButton onClick={onExplore}>Find a product</OutlineButton>}
        </section>
      )}
      {routineWorking}
      {goals.length > 0 && (
        <section className="ay-db-card" aria-labelledby="ay-db-goals-title">
          <h2 id="ay-db-goals-title" className="ay-db-h2">Your goals</h2>
          <GoalList goals={goals} onOpenProduct={onOpenProduct} />
          <p className="ay-db-muted">Marks show ayna&rsquo;s reading of the research for that goal. Open a product for the studies.</p>
        </section>
      )}
      <WeekPicks picks={picks} onOpenProduct={onOpenProduct} />
      {routineBits}
    </div>
  );

  const H = `h${titleLevel}`;
  const sourceLine = (sources.length > 0 || sync) && (
    <p className={`ay-db-source${sync?.stale ? ' is-stale' : ''}`}>
      {sources.length > 0 ? `From ${sourceNames(sources)}` : 'Your data'}
      {/* The website's band already says when it synced; the stale state shows here on both. */}
      {sync && (showTitle || sync.stale) && <> · {sync.label}</>}
      {' · compared with your usual'}
      {sync?.stale && onRefresh && <OutlineButton className="is-small" onClick={onRefresh}>Refresh</OutlineButton>}
    </p>
  );

  return (
    <div className={`ay-db is-${surface}${rundownShown ? ' has-rundown-entry' : ''}`} ref={topRef}>
      {showTitle && (
        <header className="ay-db-title">
          <div>
            <H className="ay-db-h1">{title}</H>
            {sourceLine}
          </div>
          {cycle && !hormonalBC && <span className="ay-db-ringwrap"><span className="ay-db-ringcap" aria-hidden="true">Cycle day</span><span className="ay-db-ring" role="img" aria-label={`Cycle day ${cycle.cycleDay}${cycle.avgLength ? ` of about ${cycle.avgLength}` : ''}`}><DsRing day={cycle.cycleDay} length={cycle.avgLength} /></span></span>}
        </header>
      )}
      {(tabs.length > 1 || (!showTitle && sourceLine)) && (
        <div className="ay-db-nav">
          {tabs.length > 1 && <div className="ay-db-tabwrap"><PillTabs tabs={tabs} active={current} onChange={pickTab} label="Health areas" idBase="ay-db-area" /></div>}
          {!showTitle && sourceLine}
          {helloAside}
        </div>
      )}
      {status === 'error' && hasData && (
        <p className="ay-db-source is-stale" role="status">Couldn&rsquo;t load your latest data. These are the last values we have.{onRefresh && <OutlineButton className="is-small" onClick={onRefresh}>Try again</OutlineButton>}</p>
      )}
      <div className="ay-db-panel" role={tabs.length > 1 ? 'tabpanel' : undefined} id={`ay-db-area-panel-${current}`} aria-labelledby={tabs.length > 1 ? `ay-db-area-tab-${current}` : undefined} key={current}>
        {current === 'summary' && summary}
        {current === 'cycle' && cycleTab}
        {current === 'sleep' && sleepTab}
        {current === 'body' && bodyTab}
        {current === 'routine' && routineTab}
      </div>
      <footer className="ay-db-foot">
        <p className="ay-db-disclaimer">These describe your data, compared only with your own usual. Patterns, not a diagnosis. If something worries you, talk to a clinician.</p>
        {footer}
      </footer>
    </div>
  );
}

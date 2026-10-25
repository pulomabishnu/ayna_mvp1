/**
 * One component per Home widget (registry.js lists them). Each gets
 * { size: 'small'|'large', ctx, config } and draws only from ctx: data
 * ayna already has on this device or reads today. Every widget has an
 * honest empty state. Buttons appear only when the surface passes the
 * action (ctx.on.*). Copy is plain, sentence case, no em dashes.
 */
import { useId } from 'react';
import MiniChart from './MiniChart.jsx';
import { REGISTRY, SUMMARY_TOPICS } from './registry.js';

// Colour-block tiles, one fill per category (inspo 455687ac, Intelly stat tiles).
const TONE = { charts: 'sky', summaries: 'butter', health: 'pink', routine: 'butter', shopping: 'sky', community: 'pink', ayna: 'espresso' };
import {
  customSummary, cycleSection, cycleTimeline, daysUntil, fmtDay, healthChart, heartChart, logSeries, logStreak, loggedToday,
  metricText, sinceYesterday, snippet, weekVsWeek,
} from './widgetData.js';
import { findCyclePatterns } from '../../health/cyclePatterns.js';
import { fmtMinutes } from '../../health/insights.js';
import { getBuyUrl } from '../../mobile/data/buyUrl.js';
import { getProductById } from '../../data/catalog.js';
import { labelForKey } from '../../health/routines.js';
import { useRoutines } from '../../components/routine/useRoutines.js';
import { readSavedReminders, fmtRemindDay } from '../../utils/savedReminders.js';
import { topicLabel } from '../../utils/community/topics.js';
import { recentQuestions } from '../../utils/askRecent.js';

/** The shell every widget shares: a titled article, its body, one optional action. */
function Card({ id, size, title, children, action = null, empty = null, className = '' }) {
  const hid = useId();
  return (
    <article className={`ay-w ay-w--${size} ay-w--${id}${empty ? ' is-empty' : ''}${className ? ` ${className}` : ''}`} data-tone={TONE[REGISTRY[id]?.category] || 'butter'} aria-labelledby={hid}>
      <h3 id={hid} className="ay-w__title">{title}</h3>
      {empty ? <p className="ay-w__empty">{empty}</p> : children}
      {action}
    </article>
  );
}

const Act = ({ onClick, children }) => (onClick ? <button type="button" className="ay-w__act" onClick={onClick}>{children}</button> : null);

/* --------------------------------- charts --------------------------------- */

function SleepChart({ size, ctx }) {
  const days = size === 'large' ? 30 : 7;
  const c = healthChart(ctx.healthRows, 'sleep_minutes', ctx.today, days);
  if (c) {
    return (
      <Card id="sleep_chart" size={size} title="Sleep" action={<Act onClick={ctx.on.openHealth}>See more</Act>}>
        <p className="ay-w__big">{fmtMinutes(c.latest.value)} <small>last logged night</small></p>
        <MiniChart points={c.points} kind="bar" min={0} label={`Sleep, ${c.points.length} nights. Average ${fmtMinutes(c.avg)}.`} />
      </Card>
    );
  }
  const pts = logSeries(ctx.log, 'sleep', ctx.today, days);
  const n = pts.filter((p) => p.value != null).length;
  return (
    <Card id="sleep_chart" size={size} title="Sleep" empty={n ? null : 'No sleep data yet. Log your sleep or connect a sleep app.'} action={<Act onClick={n ? ctx.on.openHealth : ctx.on.openLog}>{n ? 'See more' : 'Log today'}</Act>}>
      <p className="ay-w__sub">From your log: rough, okay or good</p>
      <MiniChart points={pts} kind="bar" min={0} max={3} label={`Sleep from your log, ${n} of ${days} days logged.`} />
    </Card>
  );
}

function CycleChart({ size, ctx }) {
  const t = cycleTimeline(ctx.healthRows, ctx.log, ctx.today, size === 'large' ? 30 : 14);
  const est = t.estimate;
  return (
    <Card id="cycle_chart" size={size} title="Cycle timeline" empty={t.any ? null : 'No period days logged in this time.'} action={<Act onClick={t.any ? ctx.on.openHealth : ctx.on.openLog}>{t.any ? 'See more' : 'Log today'}</Act>}>
      <ol className="ay-w-cycle" aria-label={`Period days in the last ${t.days.length} days: ${t.days.filter((d) => d.period).length}`}>
        {t.days.map((d) => <li key={d.day} className={d.period ? 'is-period' : ''} title={fmtDay(d.day)} />)}
      </ol>
      <p className="ay-w__sub">{est ? `Next period, estimated: ${fmtDay(est.day)}` : `${fmtDay(t.days[0].day)} to today`}</p>
    </Card>
  );
}

function LogChart({ id, field, title, max, size, ctx }) {
  const days = size === 'large' ? 14 : 7;
  const pts = logSeries(ctx.log, field, ctx.today, days);
  const n = pts.filter((p) => p.value != null).length;
  return (
    <Card id={id} size={size} title={title} empty={n ? null : `No ${title.toLowerCase()} logged in the last ${days} days.`} action={<Act onClick={ctx.on.openLog}>Log today</Act>}>
      <MiniChart points={pts} kind="curve" min={field === 'pain' ? -0.3 : 0.7} max={max + 0.3} label={`${title} from your log, ${n} of ${days} days logged.`} />
    </Card>
  );
}
const PainChart = (p) => <LogChart id="pain_chart" field="pain" title="Pain" max={3} {...p} />;
const MoodChart = (p) => <LogChart id="mood_chart" field="mood" title="Mood" max={3} {...p} />;

function HeartChart({ size, ctx }) {
  const c = heartChart(ctx.healthRows, ctx.today, size === 'large' ? 30 : 14);
  return (
    <Card id="heart_chart" size={size} title={c?.label || 'Heart'} empty={c ? null : 'No heart data from your connected apps yet.'} action={<Act onClick={ctx.on.openHealth}>See more</Act>}>
      {c && <>
        <p className="ay-w__big">{metricText(c.metric, c.latest.value)} <small>latest</small></p>
        <MiniChart points={c.points} kind="line" label={`${c.label}, ${c.points.length} days. Latest ${metricText(c.metric, c.latest.value)}.`} />
      </>}
    </Card>
  );
}

/* ------------------------------- summaries ------------------------------- */

function Lines({ lines, max }) {
  return <ul className="ay-w__lines">{lines.slice(0, max).map((l) => <li key={l}>{l}</li>)}</ul>;
}

function CustomSummary({ size, ctx, config }) {
  const topic = SUMMARY_TOPICS.find((t) => t.id === config?.topic) || SUMMARY_TOPICS[0];
  const { range, lines } = customSummary(config, ctx);
  return (
    <Card id="custom_summary" size={size} title={`${topic.label}, ${range.label.toLowerCase()}`} action={<Act onClick={ctx.on.ask ? () => ctx.on.ask(`Explain ${topic.label.toLowerCase()} ${range.label.toLowerCase()}`) : null}>Ask why</Act>}>
      <Lines lines={lines} max={size === 'large' ? 4 : 1} />
    </Card>
  );
}

function WeekVsWeek({ size, ctx }) {
  const lines = weekVsWeek(ctx).map((l) => l.text);
  return (
    <Card id="week_vs_week" size={size} title="This week vs last week" empty={lines.length ? null : 'Log at least 3 days in each week to compare.'}>
      <Lines lines={lines} max={size === 'large' ? 4 : 1} />
    </Card>
  );
}

function SinceYesterday({ size, ctx }) {
  const { lines, empty } = sinceYesterday(ctx);
  return (
    <Card id="since_yesterday" size={size} title="Since yesterday" empty={lines.length ? null : empty} action={lines.length ? null : <Act onClick={ctx.on.openLog}>Log today</Act>}>
      <Lines lines={lines} max={size === 'large' ? 4 : 1} />
    </Card>
  );
}

/* -------------------------------- my health ------------------------------- */

/** Home's health data / log row (p4/app-home-2), unchanged as the large size. */
function Health({ size, ctx }) {
  const summary = ctx.healthSummary;
  const connected = ctx.healthConnectedCount || 0;
  return (
    <section className={`ay-homehealth ay-w ay-w--${size} ay-w--health`} aria-labelledby={`ay-homehealth-h-${ctx.surface}`}>
      <div className="ay-homehealth__text">
        <h2 id={`ay-homehealth-h-${ctx.surface}`}>{summary ? summary.title : 'Your log'}</h2>
        <p>{summary?.headline || (connected ? 'Your health data is still coming in.' : 'Log how you feel today; it shapes tomorrow.')}</p>
      </div>
      <div className="ay-homehealth__actions">
        {summary?.headline && ctx.on.ask && <button type="button" className="ay-today__text" onClick={() => ctx.on.ask({ question: 'What stands out in my health data this week?' })}>Ask why</button>}
        {ctx.on.openLog && <button type="button" className="ay-today__text" onClick={ctx.on.openLog}>Log today</button>}
        {!connected && ctx.on.connect && size === 'large' && <button type="button" className="ay-today__text" onClick={ctx.on.connect}>Connect</button>}
      </div>
    </section>
  );
}

function NextPeriod({ size, ctx }) {
  const s = cycleSection(ctx.healthRows, ctx.today);
  const est = s?.estimate?.day && s.estimate.day >= ctx.today ? s.estimate : null;
  const n = est ? daysUntil(ctx.today, est.day) : null;
  return (
    <Card id="next_period" size={size} title="Next period" empty={est ? null : 'ayna needs a few logged periods before it can estimate the next one.'}>
      {est && <>
        <p className="ay-w__big">{n === 0 ? 'About now' : `In about ${n} day${n === 1 ? '' : 's'}`}</p>
        <p className="ay-w__sub">Estimate: {fmtDay(est.day)}{size === 'large' ? `. ${est.basis}` : ''}</p>
      </>}
    </Card>
  );
}

function QuickLog({ size, ctx }) {
  const done = loggedToday(ctx.log, ctx.today);
  return (
    <Card id="quick_log" size={size} title="Today's log" action={<Act onClick={ctx.on.openLog}>{done.length ? 'Log more' : 'Log today'}</Act>}>
      <p className="ay-w__sub">{done.length ? (size === 'large' ? done.map((d) => `${d.label}: ${d.word.toLowerCase()}`).join(' · ') : `${done.length} logged today`) : 'Nothing logged yet today.'}</p>
    </Card>
  );
}

const LOGGED = (log, day) => Boolean(log?.[day] && ['pain', 'flow', 'pms', 'sleep', 'mood', 'skin'].some((f) => log[day][f] != null));

/** A ring: how many of the last 7 days she logged (rings and bars, founder 23:49). */
function WeekRing({ n }) {
  const r = 15; const c = 2 * Math.PI * r;
  return (
    <svg className="ay-w-ring" viewBox="0 0 40 40" aria-hidden="true">
      <circle className="ay-w-ring__track" cx="20" cy="20" r={r} />
      <circle className="ay-w-ring__fill" cx="20" cy="20" r={r} strokeDasharray={`${(c * n) / 7} ${c}`} transform="rotate(-90 20 20)" />
    </svg>
  );
}

function LogStreak({ size, ctx }) {
  const s = logStreak(ctx.log, ctx.today);
  const week = logSeries(ctx.log, 'pain', ctx.today, 7).filter((p) => LOGGED(ctx.log, p.day)).length;
  return (
    <Card id="log_streak" size={size} title="Log streak" empty={s.days ? null : 'Log today to start a streak.'} action={s.today ? null : <Act onClick={ctx.on.openLog}>Log today</Act>}>
      <div className="ay-w__numring">
        <p className="ay-w__big">{s.days} day{s.days === 1 ? '' : 's'} <small>in a row</small></p>
        {size === 'large' && <WeekRing n={week} />}
      </div>
      {size === 'large' && <p className="ay-w__sub">{week} of the last 7 days logged{s.today ? '' : '. Log today to keep it going'}.</p>}
    </Card>
  );
}

function Patterns({ size, ctx }) {
  const found = findCyclePatterns({ log: ctx.log, healthRows: ctx.healthRows, today: ctx.today, hormonalBC: ctx.hormonalBC });
  return (
    <Card id="patterns" size={size} title="Patterns ayna found" empty={found.length ? null : 'No patterns yet. ayna looks across at least 3 cycles of your logs.'}>
      <Lines lines={found.map((p) => p.text)} max={size === 'large' ? 3 : 1} />
    </Card>
  );
}

function DoctorPrep({ size, ctx }) {
  return (
    <Card id="doctor_prep" size={size} title="Doctor prep" action={<Act onClick={ctx.on.openDoctorPrep}>Get ready</Act>}>
      <p className="ay-w__sub">Questions to ask and a summary of your logs to bring to your visit.</p>
    </Card>
  );
}

/* -------------------------------- my routine ------------------------------ */

function RoutineToday({ size, ctx }) {
  const { routines } = useRoutines(ctx.routineSource || {});
  const items = routines.flatMap((r) => r.start.map((it) => ({ ...it, need: r.title }))).slice(0, size === 'large' ? 3 : 1);
  return (
    <Card id="routine_today" size={size} title="Today's routine" empty={items.length ? null : 'No routine yet. Your matches build one.'} action={<Act onClick={ctx.on.openRoutine}>See your routine</Act>}>
      <ul className="ay-w__lines">{items.map((it) => <li key={`${it.need}:${it.key}`}><b>{it.title}</b>{it.when ? ` · ${it.when}` : ''}</li>)}</ul>
    </Card>
  );
}

function WhatsWorking({ size, ctx }) {
  const helpful = (ctx.tries || []).filter((t) => !t.removed && t.outcome === 'helpful')
    .sort((a, b) => String(b.recordedDay).localeCompare(String(a.recordedDay)));
  const name = (t) => (t.kind === 'product' ? getProductById(t.ref)?.name || 'A product' : labelForKey(`class:${t.ref}`));
  return (
    <Card id="whats_working" size={size} title="What's working" empty={helpful.length ? null : 'Nothing marked helpful yet. When you check in on something you tried, it shows here.'}>
      <Lines lines={helpful.map(name)} max={size === 'large' ? 3 : 1} />
    </Card>
  );
}

function Reminders({ size, ctx }) {
  const list = readSavedReminders();
  return (
    <Card id="reminders" size={size} title="Reminders" empty={list.length ? null : 'No reminders. Use "Remind me later" on something you saved.'} action={<Act onClick={ctx.on.openSaved}>Saved</Act>}>
      <ul className="ay-w__lines">{list.slice(0, size === 'large' ? 3 : 1).map((r) => <li key={r.id}><b>{r.name}</b> · {fmtRemindDay(r.at)}</li>)}</ul>
    </Card>
  );
}

/* --------------------------------- shopping -------------------------------- */

function ProductLines({ products, max, ctx, buy = false }) {
  return (
    <ul className="ay-w__products">
      {products.slice(0, max).map((p) => {
        const url = buy ? getBuyUrl(p) : null;
        return (
          <li key={p.id}>
            {ctx.on.openProduct ? <button type="button" className="ay-w__name" onClick={() => ctx.on.openProduct(p)}>{p.name}</button> : <span className="ay-w__name">{p.name}</span>}
            {url && <a className="ay-w__buy" href={url} target="_blank" rel="noopener noreferrer">Buy<span className="sr-only"> {p.name} (opens the seller's site)</span></a>}
          </li>
        );
      })}
    </ul>
  );
}

function ShoppingList({ size, ctx }) {
  const saved = ctx.saved || [];
  return (
    <Card id="shopping_list" size={size} title="Shopping list" empty={saved.length ? null : 'Nothing saved yet. Tap Save on a product to add it here.'} action={<Act onClick={ctx.on.openSaved}>{saved.length > (size === 'large' ? 3 : 1) ? `All ${saved.length}` : 'Saved'}</Act>}>
      <ProductLines products={saved} max={size === 'large' ? 3 : 1} ctx={ctx} buy />
    </Card>
  );
}

function MyEcosystem({ size, ctx }) {
  const list = ctx.myProducts || [];
  return (
    <Card id="my_ecosystem" size={size} title="My ecosystem" empty={list.length ? null : 'No products in your routine yet.'} action={<Act onClick={ctx.on.openEcosystem}>{list.length ? `${list.length} products` : 'Your matches'}</Act>}>
      <ProductLines products={list} max={size === 'large' ? 3 : 1} ctx={ctx} />
    </Card>
  );
}

function TrendingProducts({ size, ctx }) {
  const rows = (ctx.remote?.trendingProducts || []).map((r) => ({ p: getProductById(r.product_id), n: r.saves })).filter((r) => r.p);
  if (!rows.length) return null;
  return (
    <Card id="trending_products" size={size} title="Trending products">
      <ProductLines products={rows.map((r) => r.p)} max={size === 'large' ? 3 : 1} ctx={ctx} />
    </Card>
  );
}

/* --------------------------------- community ------------------------------ */

function PostLines({ posts, max, ctx }) {
  return (
    <ul className="ay-w__lines">
      {posts.slice(0, max).map((p) => (
        <li key={p.id}>{ctx.on.openPost ? <button type="button" className="ay-w__name" onClick={() => ctx.on.openPost(p.id)}>{snippet(p.body || p.title)}</button> : snippet(p.body || p.title)}</li>
      ))}
    </ul>
  );
}

function CommunityPosts({ size, ctx }) {
  const r = ctx.remote?.posts;
  return (
    <Card id="community_posts" size={size} title={r?.label || 'Trending posts'} empty={r?.posts?.length ? null : (ctx.remote?.loading ? 'Loading Community…' : 'Community posts show here when you are online.')} action={<Act onClick={ctx.on.openCommunity ? () => ctx.on.openCommunity() : null}>Community</Act>}>
      <PostLines posts={r?.posts || []} max={size === 'large' ? 2 : 1} ctx={ctx} />
    </Card>
  );
}

function MyPlaylists({ size, ctx }) {
  const list = ctx.remote?.playlists || [];
  const signedOut = !ctx.userId;
  return (
    <Card id="my_playlists" size={size} title="My playlists" empty={list.length ? null : signedOut ? 'Sign in to see your Community playlists.' : 'No playlists yet. Make one in Community.'} action={<Act onClick={ctx.on.openCommunity ? () => ctx.on.openCommunity() : null}>Community</Act>}>
      <ul className="ay-w__lines">
        {list.slice(0, size === 'large' ? 3 : 1).map((pl) => (
          <li key={pl.id}>{ctx.on.openPlaylist ? <button type="button" className="ay-w__name" onClick={() => ctx.on.openPlaylist(pl.id)}>{pl.title}</button> : pl.title}{pl.item_count != null ? ` · ${pl.item_count} product${pl.item_count === 1 ? '' : 's'}` : ''}</li>
        ))}
      </ul>
    </Card>
  );
}

function MyTopics({ size, ctx }) {
  const topics = (ctx.topics || []).map((t) => ({ id: t, label: topicLabel(t) })).filter((t) => t.label);
  return (
    <Card id="my_topics" size={size} title="Topics I follow" empty={topics.length ? null : 'Follow topics in Community to see them here.'}>
      <ul className="ay-w__chips">
        {topics.slice(0, size === 'large' ? 6 : 2).map((t) => <li key={t.id}>{ctx.on.openCommunity ? <button type="button" onClick={() => ctx.on.openCommunity({ topic: t.id })}>{t.label}</button> : <span>{t.label}</span>}</li>)}
      </ul>
    </Card>
  );
}

function NewInCommunity({ size, ctx }) {
  const posts = ctx.newPosts || [];
  return (
    <Card id="new_in_community" size={size} title="New in Community" empty={posts.length ? null : 'Nothing new in your topics this week.'}>
      <PostLines posts={posts} max={size === 'large' ? 2 : 1} ctx={ctx} />
    </Card>
  );
}

/* ----------------------------------- ayna --------------------------------- */

function News({ size, ctx }) {
  const list = ctx.news || [];
  if (!list.length) return null;
  const a = list[0];
  return (
    <Card id="news" size={size} title="ayna news" action={a.link ? <a className="ay-w__act" href={a.link}>{a.linkLabel || 'Read more'}</a> : null}>
      <p className="ay-w__lead">{a.title}</p>
      {size === 'large' && a.body && <p className="ay-w__sub">{a.body}</p>}
    </Card>
  );
}

function RecentAsks({ size, ctx }) {
  const qs = recentQuestions(ctx.askHistory || [], size === 'large' ? 3 : 1);
  return (
    <Card id="recent_asks" size={size} title="Recent questions" empty={qs.length ? null : 'Questions you ask ayna show here.'}>
      <ul className="ay-w__lines">{qs.map((q) => <li key={q}>{ctx.on.ask ? <button type="button" className="ay-w__name" onClick={() => ctx.on.ask(q)}>{q}</button> : q}</li>)}</ul>
    </Card>
  );
}

function ContinueReading({ size, ctx }) {
  const prog = ctx.readProgress || {};
  const reads = (ctx.articles || []).filter((a) => prog[a.id] > 0 && prog[a.id] < 1).slice(0, size === 'large' ? 2 : 1);
  return (
    <Card id="continue_reading" size={size} title="Continue reading" empty={reads.length ? null : 'Reads you start show here.'}>
      <ul className="ay-w__lines">{reads.map((a) => <li key={a.id}>{ctx.on.openArticle ? <button type="button" className="ay-w__name" onClick={() => ctx.on.openArticle(a)}>{a.title}</button> : a.title} · {Math.round(prog[a.id] * 100)}% read</li>)}</ul>
    </Card>
  );
}

const WIDGET_COMPONENTS = {
  sleep_chart: SleepChart, cycle_chart: CycleChart, pain_chart: PainChart, mood_chart: MoodChart, heart_chart: HeartChart,
  custom_summary: CustomSummary, week_vs_week: WeekVsWeek, since_yesterday: SinceYesterday,
  health: Health, next_period: NextPeriod, quick_log: QuickLog, log_streak: LogStreak, patterns: Patterns, doctor_prep: DoctorPrep,
  routine_today: RoutineToday, whats_working: WhatsWorking, reminders: Reminders,
  shopping_list: ShoppingList, my_ecosystem: MyEcosystem, trending_products: TrendingProducts,
  community_posts: CommunityPosts, my_playlists: MyPlaylists, my_topics: MyTopics, new_in_community: NewInCommunity,
  news: News, recent_asks: RecentAsks, continue_reading: ContinueReading,
};

/** One widget by id, or nothing for an unknown id. */
export function Widget({ widget, ctx }) {
  const C = WIDGET_COMPONENTS[widget.id];
  if (!C || !REGISTRY[widget.id]) return null;
  return <C size={widget.size} ctx={{ ...ctx, on: ctx?.on || {} }} config={widget.config} />;
}


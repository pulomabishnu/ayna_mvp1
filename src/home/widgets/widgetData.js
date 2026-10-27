/**
 * What each Home widget shows, computed on this device from data ayna
 * already keeps: her daily log (dailyLog.js), connected health rows
 * (dashboard.js / insights.js), tries (outcomes.js), cycle patterns
 * (cyclePatterns.js). Plain words, real numbers only, no medical claims:
 * a widget with too little data says so instead of guessing.
 */
import { LOG_FIELDS, addDays, todayKey } from '../../health/dailyLog.js';
import { buildDashboard, formatMetric } from '../../health/dashboard.js';
import { buildInsights, fmtMinutes } from '../../health/insights.js';
import { answerTodayQuestion } from '../../utils/askToday.js';
import { SUMMARY_RANGES } from './registry.js';

const FIELD = Object.fromEntries(LOG_FIELDS.map((f) => [f.id, f]));
const wordFor = (field, v) => {
  const f = FIELD[field];
  const i = f ? f.values.indexOf(v) : -1;
  return i >= 0 ? f.options[i] : null;
};
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const lower = (s) => String(s || '').toLowerCase();

/** One field of her log, oldest first, one point per day (null = not logged). */
export function logSeries(log, field, today = todayKey(), days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - (days - 1));
    const v = log?.[day]?.[field];
    return { day, value: v == null ? null : v };
  });
}

const loggedSomething = (e) => e && LOG_FIELDS.some((f) => e[f.id] != null);

/** Days in a row she logged, ending today (or yesterday if today is not logged yet). */
export function logStreak(log, today = todayKey()) {
  let day = loggedSomething(log?.[today]) ? today : addDays(today, -1);
  let n = 0;
  while (loggedSomething(log?.[day]) && n < 400) { n += 1; day = addDays(day, -1); }
  return { days: n, today: loggedSomething(log?.[today]) };
}

/** What she logged today: [{ id, label, word }]. */
export function loggedToday(log, today = todayKey()) {
  const e = log?.[today];
  if (!e) return [];
  return LOG_FIELDS.filter((f) => e[f.id] != null).map((f) => ({ id: f.id, label: f.label, word: wordFor(f.id, e[f.id]) }));
}

/** A chart from her connected data (dashboard.js), or null. */
export function healthChart(rows, metric, today, days) {
  if (!rows?.length) return null;
  const d = buildDashboard(rows, { days, today });
  return d.groups.flatMap((g) => g.charts).find((c) => c.metric === metric) || null;
}

/** Heart: HRV (whichever method has more data) or else resting heart rate. */
export function heartChart(rows, today, days = 14) {
  if (!rows?.length) return null;
  const d = buildDashboard(rows, { days, today });
  const charts = d.groups.find((g) => g.id === 'heart')?.charts || [];
  return charts.find((c) => /^hrv_/.test(c.metric)) || charts.find((c) => c.metric === 'resting_hr_bpm') || null;
}

/** The cycle section from insights.js (with its estimate) when it is ready. */
export function cycleSection(rows, today) {
  if (!rows?.length) return null;
  const s = buildInsights(rows, { today }).sections.find((x) => x.id === 'cycle');
  return s?.status === 'ready' ? s : null;
}

/** 30 days: which had period flow (connected data or her log), and the estimated next start. */
export function cycleTimeline(rows, log, today = todayKey(), days = 30) {
  const flowDays = new Set();
  if (rows?.length) {
    const d = buildDashboard(rows, { days, today });
    (d.cycle?.periodDays || []).forEach((p) => flowDays.add(p.day));
  }
  Object.values(log || {}).forEach((e) => { if (e?.flow && e.flow !== 'none') flowDays.add(e.day); });
  const list = Array.from({ length: days }, (_, i) => { const day = addDays(today, i - (days - 1)); return { day, period: flowDays.has(day) }; });
  const est = cycleSection(rows, today)?.estimate || null;
  return { days: list, any: list.some((d) => d.period), estimate: est?.day && est.day >= today ? est : null };
}

export const fmtDay = (day) => new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
export const daysUntil = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);

/* ------------------------------- summaries ------------------------------- */

function logFieldSummary(log, field, today, days, rangeWord) {
  const f = FIELD[field];
  const pts = logSeries(log, field, today, days).filter((p) => p.value != null);
  if (!pts.length) return [`You haven't logged ${lower(f.label)} ${rangeWord}.`];
  const counts = {};
  pts.forEach((p) => { counts[p.value] = (counts[p.value] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const topWord = wordFor(field, f.values.find((v) => String(v) === top[0]));
  const lines = [`You logged ${lower(f.label)} on ${pts.length} of the last ${days} days.`, `Most often: ${lower(topWord)} (${top[1]} day${top[1] === 1 ? '' : 's'}).`];
  if (f.better === 'lower') {
    const worst = Math.max(...pts.map((p) => p.value));
    if (worst > 0) lines.push(`Highest: ${lower(wordFor(field, worst))}.`);
  }
  return lines;
}

function sleepSummary(ctx, days, rangeWord) {
  const c = healthChart(ctx.healthRows, 'sleep_minutes', ctx.today, days);
  if (c?.points?.length) {
    const lines = [`You slept ${fmtMinutes(c.avg)} a night on average over ${c.points.length} night${c.points.length === 1 ? '' : 's'} of connected data.`];
    if (c.usual != null) lines.push(`Your usual is ${fmtMinutes(c.usual)}.`);
    return lines;
  }
  return logFieldSummary(ctx.log, 'sleep', ctx.today, days, rangeWord);
}

function cycleSummary(ctx, days, rangeWord) {
  const s = cycleSection(ctx.healthRows, ctx.today);
  const flow = logSeries(ctx.log, 'flow', ctx.today, days).filter((p) => p.value && p.value !== 'none');
  const lines = [];
  if (s) { lines.push(`${s.headline}.`); if (s.plain) lines.push(s.plain); }
  if (flow.length) lines.push(`You logged flow on ${flow.length} day${flow.length === 1 ? '' : 's'} ${rangeWord}.`);
  return lines.length ? lines : [`Nothing about your cycle is logged ${rangeWord}.`];
}

function routineSummary(ctx, days) {
  const since = addDays(ctx.today, -(days - 1));
  const tries = (ctx.tries || []).filter((t) => !t.removed);
  if (!tries.length) return ['Nothing in your routine is being tracked yet.'];
  const active = tries.filter((t) => !t.outcome);
  const helpful = tries.filter((t) => t.outcome === 'helpful' && (t.recordedDay || '') >= since);
  const due = active.filter((t) => t.status === 'due');
  const lines = [`${active.length} thing${active.length === 1 ? '' : 's'} in your routine ${active.length === 1 ? 'is' : 'are'} being tracked.`];
  if (helpful.length) lines.push(`You marked ${helpful.length} helpful in this time.`);
  if (due.length) lines.push(`${due.length} ${due.length === 1 ? 'is' : 'are'} ready for a check-in.`);
  return lines;
}

/** "Your own summary": a topic and a range, summed up from her data. */
export function customSummary(config = {}, ctx = {}) {
  const range = SUMMARY_RANGES.find((r) => r.id === config.range) || SUMMARY_RANGES[0];
  const word = range.id === 'week' ? 'in the last 7 days' : 'in the last 30 days';
  const c = { ...ctx, today: ctx.today || todayKey() };
  const topic = config.topic || 'sleep';
  const lines = topic === 'sleep' ? sleepSummary(c, range.days, word)
    : topic === 'cycle' ? cycleSummary(c, range.days, word)
      : topic === 'routine' ? routineSummary(c, range.days)
        : logFieldSummary(c.log, topic === 'mood' ? 'mood' : 'pain', c.today, range.days, word);
  return { range, lines };
}

/** This week against last week: one line per thing that moved (3+ logs each week). */
export function weekVsWeek(ctx = {}) {
  const today = ctx.today || todayKey();
  const lines = [];
  const prevEnd = addDays(today, -7);
  for (const f of LOG_FIELDS) {
    if (!f.better) continue;
    const a = logSeries(ctx.log, f.id, today, 7).map((p) => p.value).filter((v) => v != null);
    const b = logSeries(ctx.log, f.id, prevEnd, 7).map((p) => p.value).filter((v) => v != null);
    if (a.length < 3 || b.length < 3) continue;
    const diff = avg(a) - avg(b);
    if (Math.abs(diff) < 0.5) { lines.push({ id: f.id, text: `${f.label}: about the same as last week.` }); continue; }
    const up = diff > 0;
    const easier = f.better === 'higher' ? up : !up;
    lines.push({ id: f.id, text: `${f.label}: ${f.better === 'lower' ? (up ? 'higher' : 'lower') : (easier ? 'better' : 'rougher')} than last week.` });
  }
  const now = healthChart(ctx.healthRows, 'sleep_minutes', today, 7);
  const before = healthChart(ctx.healthRows, 'sleep_minutes', prevEnd, 7);
  if (now?.points?.length >= 3 && before?.points?.length >= 3) {
    const d = now.avg - before.avg;
    lines.unshift({ id: 'sleep_minutes', text: Math.abs(d) < 10 ? `Sleep: about the same as last week (${fmtMinutes(now.avg)} a night).` : `Sleep: ${fmtMinutes(Math.abs(d))} ${d > 0 ? 'more' : 'less'} a night than last week.` });
  }
  return lines;
}

/** Today's log next to yesterday's, in askToday.js's words. */
export function sinceYesterday(ctx = {}) {
  const today = ctx.today || todayKey();
  const r = answerTodayQuestion('What changed from yesterday?', { log: { today: ctx.log?.[today] || {}, yesterday: ctx.log?.[addDays(today, -1)] || {} } });
  const text = r?.answer || '';
  const lines = text.split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2));
  return lines.length ? { lines, empty: null } : { lines: [], empty: text.split('Check in')[0].trim() };
}

/** A chart's value in her units ("7h 02m", "41 ms"). */
export const metricText = (metric, v) => formatMetric(metric, v);

/* ------------------------------- community ------------------------------- */

const engagement = (p) => (Number(p.helpful_count) || 0) * 2 + (Number(p.comment_count) || 0) + (Number(p.view_count) || 0) * 0.1;

/**
 * Trending: public posts from the last 7 days ranked by real engagement
 * (helpful votes, comments, views when the view counts exist). With none,
 * the curated posts the landing page uses (most helpful), labelled
 * "Popular in Community", never "Trending".
 */
export function rankCommunityPosts(recent = [], popular = [], now = Date.now()) {
  const since = now - 7 * 86400000;
  const ok = (p) => p?.id && !p.topic_id && String(p.body || '').trim().length >= 20;
  const hot = recent
    .filter((p) => ok(p) && Date.parse(p.created_at) >= since && engagement(p) > 0)
    .sort((a, b) => engagement(b) - engagement(a))
    .slice(0, 3);
  if (hot.length) return { label: 'Trending in Community', posts: hot, trending: true };
  return { label: 'Popular in Community', posts: popular.filter(ok).slice(0, 3), trending: false };
}

export const snippet = (text, n = 110) => {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 3).replace(/\s+\S*$/, '')}…` : t;
};

/**
 * The health dashboard's view model (dashboard audit Oct 25, sections 12-14):
 * pure functions, no storage, no network. Every number comes from her own
 * rows; nothing is invented, and a piece is null when its data is missing.
 *
 * - usualBand: her usual range, the 25th to 75th percentile of the same
 *   window her usual comes from (the 28 days before the last 7; at least 10 days).
 * - findingTitle: the number in the finding's title ("Resting heart rate: 4 bpm
 *   above your usual, all 7 days").
 * - findingStatus: New / Still going, from the same rule run 7 days earlier.
 * - syncState: "synced 8:12 pm", or stale after 2 days ("Last synced Thu").
 * - chartSummary: one sentence under every chart.
 */
import { buildDashboard, formatMetric, isFlat } from './dashboard.js';
import { fmtMinutes, RECENT_DAYS, BASELINE_DAYS } from './insights.js';
import { explainWeek } from './weekInsights.js';

const DAY = 86400000;
const MIN_BASELINE = 10;
const toTime = (day) => Date.parse(`${day}T00:00:00Z`);
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
export const addDays = (iso, n) => isoDay(toTime(iso) + n * DAY);

/** Linear-interpolated percentile of a list of numbers (p in 0..1). */
export function percentile(values, p) {
  const xs = values.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
  if (!xs.length) return null;
  const at = (xs.length - 1) * p;
  const lo = Math.floor(at);
  const hi = Math.ceil(at);
  return xs[lo] + (xs[hi] - xs[lo]) * (at - lo);
}

/**
 * Her usual range for one metric: 25th to 75th percentile of the 28 days
 * before the last 7 (the window her usual is the mean of).
 * @param {Array<{day, value}>} points  at least 35 days of the series (a 90-day chart)
 * @returns {{ lo, hi, n } | null}
 */
export function usualBand(points, today) {
  if (!points?.length || !today) return null;
  const end = toTime(today);
  const recentStart = end - (RECENT_DAYS - 1) * DAY;
  const baseStart = recentStart - BASELINE_DAYS * DAY;
  const base = points.filter((p) => p.value != null && toTime(p.day) >= baseStart && toTime(p.day) < recentStart).map((p) => p.value);
  if (base.length < MIN_BASELINE) return null;
  return { lo: percentile(base, 0.25), hi: percentile(base, 0.75), n: base.length };
}

/** The last 7 days of a series (by date, not by count), for a sparkline. */
export function lastDays(points, today, n = 7) {
  if (!points?.length || !today) return [];
  const start = toTime(today) - (n - 1) * DAY;
  return points.filter((p) => p.value != null && toTime(p.day) >= start && toTime(p.day) <= toTime(today));
}

/** A value the way the dashboard writes it (steps without the word). */
export function short(metric, v) {
  if (v == null || !Number.isFinite(v)) return '';
  return metric === 'steps' ? Math.round(v).toLocaleString('en-US') : formatMetric(metric, v);
}

/** "6h 40m · usual 7h 32m"; the usual part only when she has one. */
export function valueWithUsual(chart) {
  if (!chart) return '';
  const now = short(chart.metric, chart.week ?? chart.avg);
  return chart.usual != null ? `${now} · usual ${short(chart.metric, chart.usual)}` : `${now} · still learning your usual`;
}

const ofDays = (k, n, unit = 'days') => (k === n ? `all ${n} ${unit}` : `${k} of ${n} ${unit}`);

/** The finding's title, with its number in it. Falls back to the plain sentence. */
export function findingTitle(insight) {
  if (!insight) return '';
  switch (insight.signal) {
    case 'heart-up':
      if (insight.rhrDelta != null) return `Resting heart rate: ${insight.rhrDelta} bpm above your usual${insight.rhrDaysOff != null && insight.rhrDays ? `, ${ofDays(insight.rhrDaysOff, insight.rhrDays)}` : ''}`;
      if (insight.hrvPct != null) return `Heart rate variability: ${insight.hrvPct}% below your usual this week`;
      break;
    case 'heart-down':
      if (insight.rhrDelta != null) return `Resting heart rate: ${-insight.rhrDelta} bpm below your usual${insight.rhrDaysOff != null && insight.rhrDays ? `, ${ofDays(insight.rhrDaysOff, insight.rhrDays)}` : ''}`;
      break;
    case 'sleep-short':
    case 'sleep-long':
      if (insight.deltaMin != null) return `Sleep: ${fmtMinutes(insight.deltaMin)} ${insight.deltaMin < 0 ? 'under' : 'over'} your usual, ${ofDays(insight.nightsOff, insight.nights, 'nights')}`;
      break;
    case 'steps-lower':
      if (insight.lowerDays != null) return `Steps: below your usual on ${ofDays(insight.lowerDays, insight.days)}`;
      break;
    case 'cycle-shorter':
      if (insight.latestDays != null) return `Cycle: your last one was ${insight.latestDays} days, about ${insight.shorterBy} shorter than your usual`;
      break;
    case 'temp-rise':
      if (insight.deg != null) return `Temperature: about ${insight.deg}\u00a0°C higher for ${insight.days} days`;
      break;
    case 'period-soon':
      if (insight.daysToPeriod != null) return `Period: due ${insight.daysToPeriod <= 0 ? 'today' : insight.daysToPeriod === 1 ? 'tomorrow' : `in about ${insight.daysToPeriod} days`}, estimated`;
      break;
    default:
  }
  return String(insight.text || '').replace(/\.$/, '');
}

// Signals that come straight from her rows (the same rule can run a week earlier).
const ROW_SIGNALS = new Set(['heart-up', 'heart-down', 'sleep-short', 'sleep-long', 'steps-lower', 'temp-rise']);
const AREA_OF = { 'heart-up': 'Resting heart rate', 'heart-down': 'Resting heart rate', 'sleep-short': 'Sleep', 'sleep-long': 'Sleep', 'steps-lower': 'Steps', 'temp-rise': 'Temperature' };

/**
 * New or still going, from the same rule run on the week before; plus what
 * was off last week and is back to her usual now. Only row-based signals.
 * @returns {{ status: Record<signal, 'New'|'Still going'>, backToUsual: string[] }}
 */
export function findingStatus(rows, insights, { today, hormonalBC = false } = {}) {
  const status = {};
  const backToUsual = [];
  if (!today || !rows?.length) return { status, backToUsual };
  const before = explainWeek(rows, { today: addDays(today, -7), hormonalBC, max: 7 }).insights.map((i) => i.signal).filter((s) => ROW_SIGNALS.has(s));
  const now = new Set((insights || []).map((i) => i.signal));
  for (const i of insights || []) if (ROW_SIGNALS.has(i.signal)) status[i.signal] = before.includes(i.signal) ? 'Still going' : 'New';
  for (const s of before) {
    const area = AREA_OF[s];
    if (!now.has(s) && ![...now].some((x) => AREA_OF[x] === area) && !backToUsual.includes(area)) backToUsual.push(area);
  }
  return { status, backToUsual };
}

const fmtTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' AM', ' am').replace(' PM', ' pm');
const fmtWeekday = (d) => d.toLocaleDateString('en-US', { weekday: 'short' });

/**
 * Sync status for the source line.
 * @param {Array<{ last_synced_at }>} connections
 * @returns {null | { stale: boolean, label: string, at: string }}
 */
export function syncState(connections, now = Date.now()) {
  const times = (connections || []).map((c) => Date.parse(c?.last_synced_at || '')).filter(Number.isFinite);
  if (!times.length) return null;
  const last = new Date(Math.max(...times));
  const stale = now - last.getTime() > 2 * DAY;
  const sameDay = new Date(now).toDateString() === last.toDateString();
  if (stale) return { stale: true, label: `Last synced ${fmtWeekday(last)}`, at: last.toISOString() };
  return { stale: false, label: `synced ${sameDay ? '' : `${fmtWeekday(last)} `}${fmtTime(last)}`, at: last.toISOString() };
}

const UNIT_DAY = { sleep_minutes: 'nights', sleep_deep_minutes: 'nights', sleep_rem_minutes: 'nights' };

/** One sentence under a chart: what it shows, her last 7 days and her usual. */
export function chartSummary(chart, band = null) {
  if (!chart?.points?.length) return '';
  if (chart.metric === 'cycle_length') {
    const vals = chart.points.map((p) => p.value);
    return `Your last ${vals.length} cycles: ${vals.join(', ')} days, ${Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)} on average.`;
  }
  const unit = UNIT_DAY[chart.metric] || 'days';
  const avg = short(chart.metric, chart.avg);
  const week = chart.week != null ? short(chart.metric, chart.week) : null;
  const usual = chart.usual != null ? short(chart.metric, chart.usual) : null;
  const range = band ? `, usually between ${short(chart.metric, band.lo)} and ${short(chart.metric, band.hi)}` : '';
  return `${chart.label}, last ${chart.points.length} ${unit} logged: average ${avg}.${week ? ` Last 7 ${unit}: ${week}` : ''}${usual ? `, your usual ${usual}${range}` : ''}.`;
}

/** Plain facts for an area's detail: average, range, days logged. */
export function chartFacts(chart) {
  if (!chart?.points?.length) return [];
  const vals = chart.points.map((p) => p.value);
  const unit = UNIT_DAY[chart.metric] || 'days';
  return [
    { k: 'Average', v: short(chart.metric, chart.avg) },
    { k: 'Range', v: `${short(chart.metric, Math.min(...vals))} to ${short(chart.metric, Math.max(...vals))}` },
    { k: `${unit[0].toUpperCase()}${unit.slice(1)} logged`, v: String(vals.length) },
  ];
}

/** Words for a glance row: the existing headline rule, never a diagnosis. */
export function glanceWords(chart) {
  if (!chart || chart.delta == null || chart.usual == null) return 'Still learning your usual';
  if (isFlat(chart.metric, chart.delta)) return 'About your usual';
  const up = chart.delta > 0;
  if (chart.metric === 'sleep_minutes') return up ? 'More sleep than usual' : 'Less sleep than usual';
  if (chart.metric === 'steps') return up ? 'More active than usual' : 'Less active than usual';
  return up ? 'Higher than usual' : 'Lower than usual';
}

/**
 * "Your week at a glance" rows outside the dashboard (website Today's right
 * column, the app's health row): the same words, number + usual and 7-day
 * points the dashboard's glance shows, so the same fact reads the same
 * everywhere (Loop B). Sleep, then resting heart rate (or HRV), then steps.
 */
export function glanceRows(rows, today) {
  if (!rows?.length || !today) return [];
  const week = buildDashboard(rows, { days: 30, today });
  const long = buildDashboard(rows, { days: 90, today });
  const all = week.groups.flatMap((g) => g.charts);
  const of = (m) => all.find((c) => c.metric === m) || null;
  const picks = [of('sleep_minutes'), of('resting_hr_bpm') || of('hrv_rmssd_ms') || of('hrv_sdnn_ms'), of('steps')].filter(Boolean);
  return picks.map((c) => ({
    metric: c.metric,
    label: c.metric === 'sleep_minutes' ? 'Sleep' : c.metric === 'steps' ? 'Steps' : c.label,
    words: glanceWords(c),
    value: valueWithUsual(c),
    points: lastDays(c.points, today),
    band: usualBand(long.groups.flatMap((g) => g.charts).find((x) => x.metric === c.metric)?.points, today),
  }));
}

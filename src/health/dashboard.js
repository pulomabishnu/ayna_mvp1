/**
 * Health dashboard: every metric her connected apps and wearables send,
 * shaped for charts (You -> Health).
 *
 * Same rules as insights.js:
 * - Compared with HER usual only. "Usual" is the 28 days before the last 7,
 *   and only shown when there are at least 10 days of it.
 * - Describes numbers, never what they mean medically.
 * - Each chart says which sources it came from.
 * Nothing here is stored or sent anywhere; it is computed in memory from the
 * rows useHealthData already holds.
 */
import { resolveDaily, series } from './dedupe.js';
import { METRICS } from './metrics.js';
import { periodStarts, fmtMinutes, RECENT_DAYS, BASELINE_DAYS } from './insights.js';
import { localToday } from '../utils/localDate.js';

const DAY = 86400000;
const MIN_BASELINE = 10;
const toTime = (day) => Date.parse(`${day}T00:00:00Z`);
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export const RANGES = [
  { id: 'week', label: '7 days', days: 7 },
  { id: 'month', label: '30 days', days: 30 },
  { id: 'quarter', label: '90 days', days: 90 },
];

/** Groups in the order the dashboard shows them. `bar` = daily amounts, otherwise a line. */
export const GROUPS = [
  { id: 'sleep', label: 'Sleep', metrics: ['sleep_minutes', 'sleep_deep_minutes', 'sleep_rem_minutes'], bar: ['sleep_minutes'] },
  { id: 'recovery', label: 'Readiness', metrics: ['readiness_score'], bar: [] },
  { id: 'heart', label: 'Heart', metrics: ['resting_hr_bpm', 'hrv_rmssd_ms', 'hrv_sdnn_ms', 'hr_avg_bpm'], bar: [] },
  { id: 'temperature', label: 'Temperature', metrics: ['temp_deviation_c', 'basal_temp_c', 'skin_temp_night_c'], bar: [] },
  { id: 'activity', label: 'Activity', metrics: ['steps', 'active_energy_kcal', 'workout_minutes'], bar: ['steps', 'active_energy_kcal', 'workout_minutes'] },
];

const TILE_LABEL = { sleep_minutes: 'Sleep a night', readiness_score: 'Readiness', resting_hr_bpm: 'Resting heart rate', steps: 'Steps a day' };
const FLAT = { steps: 300, sleep_minutes: 10, sleep_deep_minutes: 5, sleep_rem_minutes: 5, workout_minutes: 5, active_energy_kcal: 25, temp_deviation_c: 0.1, basal_temp_c: 0.1, skin_temp_night_c: 0.1 };

/** Is a 7-day change against her usual big enough to call a change? */
export const isFlat = (metric, delta) => delta == null || Math.abs(delta) < (FLAT[metric] ?? 1);

/** One plain word for a tile: how this week compares with her usual. */
export function trendWord(metric, delta) {
  if (delta == null) return 'New';
  if (isFlat(metric, delta)) return 'Steady';
  const up = delta > 0;
  if (metric.endsWith('_minutes')) return up ? 'Longer' : 'Shorter';
  if (metric === 'steps' || metric === 'active_energy_kcal') return up ? 'More' : 'Less';
  return up ? 'Higher' : 'Lower';
}

/** One value, written the way the dashboard shows it. */
export function formatMetric(metric, value, { signed = false } = {}) {
  if (value == null || !Number.isFinite(value)) return '';
  if (metric === 'cycle_length') return `${Math.round(value)} days`;
  const def = METRICS[metric];
  const unit = def?.unit;
  const sign = signed && value > 0 ? '+' : signed && value < 0 ? '-' : '';
  const v = signed ? Math.abs(value) : value;
  if (unit === 'min') return `${sign}${fmtMinutes(v)}`;
  if (unit === 'degC') {
    const places = metric === 'temp_deviation_c' ? 2 : 1;
    const shown = Number(v.toFixed(places));
    if (shown === 0) return `${(0).toFixed(places)} °C`;
    return `${metric === 'temp_deviation_c' && !signed && value > 0 ? '+' : sign}${metric === 'temp_deviation_c' && !signed && value < 0 ? '-' : ''}${Math.abs(shown).toFixed(places)} °C`;
  }
  if (unit === 'bpm') return `${sign}${Math.round(v)} bpm`;
  if (unit === 'ms') return `${sign}${Math.round(v)} ms`;
  if (unit === 'kcal') return `${sign}${Math.round(v).toLocaleString('en-US')} kcal`;
  if (unit === 'count') return `${sign}${Math.round(v).toLocaleString('en-US')}${metric === 'workout_count' ? '' : ' steps'}`;
  if (unit === 'score') return `${sign}${Math.round(v)}`;
  return `${sign}${v}`;
}

const sourcesOf = (points) => [...new Set(points.map((p) => p.source).filter(Boolean))];

function chartFor(resolved, metric, today, days, bar) {
  const all = series(resolved, metric);
  if (!all.length) return null;
  const end = toTime(today);
  const start = end - (days - 1) * DAY;
  const points = all.filter((p) => toTime(p.day) >= start && toTime(p.day) <= end);
  if (!points.length) return null;
  const recentStart = end - (RECENT_DAYS - 1) * DAY;
  const baseStart = recentStart - BASELINE_DAYS * DAY;
  const recent = all.filter((p) => toTime(p.day) >= recentStart && toTime(p.day) <= end);
  const baseline = all.filter((p) => toTime(p.day) >= baseStart && toTime(p.day) < recentStart);
  const usual = baseline.length >= MIN_BASELINE ? mean(baseline.map((p) => p.value)) : null;
  const week = recent.length ? mean(recent.map((p) => p.value)) : null;
  const latest = points[points.length - 1];
  return {
    metric,
    label: METRICS[metric].label,
    unit: METRICS[metric].unit,
    type: bar ? 'bar' : 'line',
    points: points.map((p) => ({ day: p.day, value: p.value })),
    latest: { day: latest.day, value: latest.value },
    avg: mean(points.map((p) => p.value)),
    week,
    usual,
    delta: usual != null && week != null ? week - usual : null,
    sources: sourcesOf(points),
  };
}

/** Period days in the range, recent cycle lengths, today's cycle day. */
function cycleFor(resolved, today, days) {
  const flow = series(resolved, 'menstrual_flow');
  if (!flow.length) return null;
  const end = toTime(today);
  const start = end - (days - 1) * DAY;
  const periodDays = flow.filter((p) => p.value >= 1 && toTime(p.day) >= start && toTime(p.day) <= end).map((p) => ({ day: p.day, value: p.value }));
  const starts = periodStarts(flow).filter((d) => toTime(d) <= end);
  const lengths = starts.slice(1)
    .map((d, i) => ({ start: starts[i], days: Math.round((toTime(d) - toTime(starts[i])) / DAY) }))
    .filter((c) => c.days >= 15 && c.days <= 60)
    .slice(-6);
  const lastStart = starts[starts.length - 1] || null;
  const cycleDay = lastStart ? Math.round((end - toTime(lastStart)) / DAY) + 1 : null;
  // Days of flow in a row from the last start (her own logs), for the ring.
  let periodLength = 0;
  if (lastStart) {
    const flowSet = new Set(flow.filter((p) => p.value >= 1).map((p) => p.day));
    while (periodLength < 15 && flowSet.has(isoDay(toTime(lastStart) + periodLength * DAY))) periodLength += 1;
  }
  const avgLength = lengths.length ? Math.round(lengths.reduce((a, c) => a + c.days, 0) / lengths.length) : null;
  const flowToday = flow.some((p) => p.day === today && p.value >= 1);
  return {
    periodDays,
    flowToday,
    periodLength,
    avgLength,
    lengths,
    lastStart,
    cycleDay: cycleDay && cycleDay <= 60 ? cycleDay : null,
    sources: sourcesOf(flow),
  };
}

/**
 * @param {Array} rows   raw daily rows (any sources; deduped here)
 * @param {object} [opts] { today: 'YYYY-MM-DD', days: 7|30|90, preferred }
 */
function missingToday(name) {
  if (import.meta.env?.DEV) console.warn(`${name}: pass { today: localToday() }`);
  return localToday();
}

export function buildDashboard(rows, opts = {}) {
  // `today` is her local day (P0 date bug): callers pass localToday(). Never the UTC date.
  const today = opts.today || missingToday('buildDashboard');
  const days = opts.days || 30;
  const resolved = resolveDaily(rows, opts.preferred);
  const groups = GROUPS.map((g) => {
    // HRV: show one method only (SDNN and RMSSD are different numbers), the one with more data.
    let metrics = g.metrics;
    if (g.id === 'heart') {
      const rm = series(resolved, 'hrv_rmssd_ms').length;
      const sd = series(resolved, 'hrv_sdnn_ms').length;
      metrics = metrics.filter((m) => (m === 'hrv_sdnn_ms' ? sd > rm : m === 'hrv_rmssd_ms' ? rm >= sd : true));
    }
    const charts = metrics.map((m) => chartFor(resolved, m, today, days, g.bar.includes(m))).filter(Boolean);
    return charts.length ? { id: g.id, label: g.label, charts } : null;
  }).filter(Boolean);
  const cycle = cycleFor(resolved, today, days);
  const pick = (metric) => groups.flatMap((g) => g.charts).find((c) => c.metric === metric && c.week != null) || null;
  const tiles = [
    cycle?.cycleDay ? { id: 'cycle', label: 'Cycle day', value: String(cycle.cycleDay) } : null,
    ...['sleep_minutes', 'readiness_score', 'resting_hr_bpm', 'steps'].map((m) => {
      const c = pick(m);
      if (!c) return null;
      return { id: m, label: TILE_LABEL[m], value: m === 'steps' ? Math.round(c.week).toLocaleString('en-US') : formatMetric(m, c.week), delta: c.delta, metric: m, word: trendWord(m, c.delta), points: c.points.slice(-14) };
    }),
  ].filter(Boolean);
  return { today, days, groups, cycle: cycle && (cycle.periodDays.length || cycle.lengths.length || cycle.cycleDay) ? cycle : null, tiles, empty: !groups.length && !cycle };
}

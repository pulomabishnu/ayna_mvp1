/**
 * Health Insights: turn resolved daily rows into a few plain sections.
 *
 * Rules this file keeps:
 * - Trends against HER OWN baseline, never one night. "Recent" is the last
 *   7 days; "usual" is the 28 days before that. Too little data = we say so.
 * - Never a diagnosis. Copy describes what changed ("shorter than your recent
 *   average"), never what it means medically.
 * - Every section says which sources it came from.
 * - `signal` is the only thing matching reads: a need the trend SUPPORTS.
 *   Matching uses it only for needs she already chose (see matchContext.js).
 */
import { resolveDaily, series } from './dedupe.js';

const DAY = 86400000;
export const RECENT_DAYS = 7;
export const BASELINE_DAYS = 28;
const MIN_RECENT = 4;
const MIN_BASELINE = 10;

const toTime = (day) => Date.parse(`${day}T00:00:00Z`);
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function fmtMinutes(min) {
  const m = Math.round(Math.abs(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (!h) return `${r} min`;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function windows(points, today) {
  const end = toTime(today);
  const recentStart = end - (RECENT_DAYS - 1) * DAY;
  const baseStart = recentStart - BASELINE_DAYS * DAY;
  const recent = points.filter((p) => toTime(p.day) >= recentStart && toTime(p.day) <= end);
  const baseline = points.filter((p) => toTime(p.day) >= baseStart && toTime(p.day) < recentStart);
  return { recent, baseline };
}

function compare(points, today) {
  const { recent, baseline } = windows(points, today);
  if (recent.length < MIN_RECENT || baseline.length < MIN_BASELINE) {
    return { enough: false, recentAvg: mean(recent.map((p) => p.value)), recentDays: recent.length, baselineDays: baseline.length };
  }
  const recentAvg = mean(recent.map((p) => p.value));
  const baselineAvg = mean(baseline.map((p) => p.value));
  return { enough: true, recentAvg, baselineAvg, delta: recentAvg - baselineAvg, recentDays: recent.length, baselineDays: baseline.length };
}

function sourcesOf(points) {
  return [...new Set(points.map((p) => p.source))];
}

function lastDays(points, today, n = 14) {
  const start = toTime(today) - (n - 1) * DAY;
  return points.filter((p) => toTime(p.day) >= start && toTime(p.day) <= toTime(today));
}

const notEnough = (id, title, points, what) => ({
  id, title, status: points.length ? 'building' : 'empty',
  headline: points.length ? 'Building your baseline' : null,
  explanation: points.length ? `ayna needs about two weeks of ${what} before it can show you a trend.` : null,
  sources: sourcesOf(points), trend: [], signal: null,
});

/* ---------------------------------- Sleep ---------------------------------- */
function sleepSection(resolved, today) {
  const pts = series(resolved, 'sleep_minutes');
  const c = compare(pts, today);
  if (!c.enough) return notEnough('sleep', 'Sleep', pts, 'sleep data');
  const less = c.delta <= -30;
  const more = c.delta >= 30;
  const shortNow = c.recentAvg < 7 * 60;
  return {
    id: 'sleep', title: 'Sleep', status: 'ready',
    headline: `Average ${fmtMinutes(c.recentAvg)} this week`,
    plain: Math.abs(c.delta) < 10
      ? `You've slept about ${fmtMinutes(c.recentAvg)} a night, right around your usual.`
      : `You've slept about ${fmtMinutes(c.delta)} ${c.delta < 0 ? 'less' : 'more'} a night than usual this week (${fmtMinutes(c.recentAvg)} on average).`,
    change: Math.abs(c.delta) >= 10 ? { direction: c.delta < 0 ? 'down' : 'up', text: `${fmtMinutes(c.delta)} ${c.delta < 0 ? 'less' : 'more'} than your usual` } : { direction: 'flat', text: 'About the same as your usual' },
    explanation: less ? 'Your sleep has been shorter than your recent average.' : more ? 'Your sleep has been longer than your recent average.' : 'Your sleep has been steady.',
    affects: less && shortNow ? 'If sleep is one of your goals, sleep picks are a stronger fit for you right now.' : null,
    sources: sourcesOf(pts), trend: lastDays(pts, today), unit: 'min',
    signal: less && shortNow ? { needId: 'sleep.trouble', summary: "You've been sleeping less than usual", metric: 'sleep_minutes' } : null,
  };
}

/* ---------------------------------- Cycle ---------------------------------- */
/** Period start days: a flow day after at least 5 days with no recorded flow. */
export function periodStarts(flowPoints) {
  const flowDays = flowPoints.filter((p) => p.value >= 1).map((p) => p.day).sort();
  const starts = [];
  let prev = null;
  for (const day of flowDays) {
    if (!prev || (toTime(day) - toTime(prev)) / DAY > 5) starts.push(day);
    prev = day;
  }
  return starts;
}

function cycleSection(resolved, today) {
  const pts = series(resolved, 'menstrual_flow');
  const starts = periodStarts(pts).filter((d) => toTime(d) <= toTime(today));
  // Plausible cycle lengths only; a missed log shouldn't read as a 60-day cycle.
  const lengths = starts.slice(1).map((d, i) => Math.round((toTime(d) - toTime(starts[i])) / DAY)).filter((n) => n >= 15 && n <= 60);
  if (lengths.length < 2) return notEnough('cycle', 'Cycle', pts, 'period logs');
  const recentLengths = lengths.slice(-4);
  const avg = Math.round(mean(recentLengths));
  const range = Math.max(...recentLengths) - Math.min(...recentLengths);
  const lastStart = starts[starts.length - 1];
  const cycleDay = Math.round((toTime(today) - toTime(lastStart)) / DAY) + 1;
  const varied = recentLengths.length >= 3 && range > 7;
  const expected = isoDay(toTime(lastStart) + avg * DAY);
  return {
    id: 'cycle', title: 'Cycle', status: 'ready',
    headline: cycleDay <= 60 ? `Day ${cycleDay} of your cycle` : 'No recent period logged',
    plain: varied
      ? `Your last ${recentLengths.length} cycles ranged from ${Math.min(...recentLengths)} to ${Math.max(...recentLengths)} days.`
      : `Your last ${recentLengths.length} cycles were all about ${avg} days long.`,
    change: { direction: 'flat', text: `Your recent cycles averaged ${avg} days` },
    explanation: varied ? 'Your cycle length has varied more over your last few cycles.' : 'Your cycle length has been fairly regular.',
    estimate: cycleDay <= 60 ? { label: 'Next period, estimated', day: expected, basis: `Based on your last ${recentLengths.length} cycles. Estimates can be off by several days.` } : null,
    affects: varied ? 'If irregular cycles are one of your goals, cycle picks are a stronger fit for you right now.' : null,
    sources: sourcesOf(pts), trend: recentLengths.map((n, i) => ({ day: starts[starts.length - recentLengths.length + i], value: n })), unit: 'days',
    signal: varied ? { needId: 'cycle.irregular', summary: 'Your cycle length has been changing more than before', metric: 'menstrual_flow' } : null,
  };
}

/* ------------------------------ Heart & stress ----------------------------- */
function heartSection(resolved, today) {
  const rhr = series(resolved, 'resting_hr_bpm');
  // Compare within one HRV method only; SDNN and RMSSD are different numbers.
  const hrvMetric = series(resolved, 'hrv_rmssd_ms').length >= series(resolved, 'hrv_sdnn_ms').length ? 'hrv_rmssd_ms' : 'hrv_sdnn_ms';
  const hrv = series(resolved, hrvMetric);
  const r = compare(rhr, today);
  const h = compare(hrv, today);
  if (!r.enough && !h.enough) return notEnough('heart', 'Heart', [...rhr, ...hrv], 'heart data');
  const rhrUp = r.enough && r.delta >= 3;
  const hrvDown = h.enough && h.baselineAvg > 0 && (h.delta / h.baselineAvg) <= -0.1;
  const lower = rhrUp || hrvDown;
  const lead = r.enough
    ? { headline: `Resting heart rate ${Math.round(r.recentAvg)} bpm this week`, change: Math.abs(r.delta) >= 1 ? { direction: r.delta > 0 ? 'up' : 'down', text: `${Math.abs(Math.round(r.delta))} bpm ${r.delta > 0 ? 'higher' : 'lower'} than your usual` } : { direction: 'flat', text: 'About the same as your usual' } }
    : { headline: `Heart rate variability ${Math.round(h.recentAvg)} ms this week`, change: { direction: h.delta < 0 ? 'down' : 'up', text: `${Math.abs(Math.round(h.delta))} ms ${h.delta < 0 ? 'lower' : 'higher'} than your usual` } };
  const plain = r.enough
    ? (Math.abs(r.delta) < 1 ? `Your resting heart rate is right around your usual, about ${Math.round(r.recentAvg)} bpm.` : `Your resting heart rate is about ${Math.abs(Math.round(r.delta))} bpm ${r.delta > 0 ? 'higher' : 'lower'} than usual this week.`)
    : `Your heart rate variability is about ${Math.abs(Math.round(h.delta))} ms ${h.delta < 0 ? 'lower' : 'higher'} than usual this week.`;
  return {
    id: 'heart', title: 'Heart', status: 'ready', ...lead, plain,
    explanation: lower ? 'Your recovery metrics have been lower than your recent baseline.' : 'Your heart metrics have been close to your usual.',
    affects: lower ? 'If energy is one of your goals, energy picks are a stronger fit for you right now.' : null,
    sources: sourcesOf([...rhr, ...hrv]), trend: lastDays(r.enough ? rhr : hrv, today), unit: r.enough ? 'bpm' : 'ms',
    signal: lower ? { needId: 'energy.fatigue', summary: rhrUp ? 'Your resting heart rate has been higher than usual' : 'Your heart rate variability has been lower than usual', metric: r.enough ? 'resting_hr_bpm' : hrvMetric } : null,
  };
}

/* --------------------------------- Recovery -------------------------------- */
function recoverySection(resolved, today) {
  const pts = series(resolved, 'readiness_score');
  const c = compare(pts, today);
  if (!c.enough) return notEnough('recovery', 'Recovery', pts, 'readiness scores');
  const lower = c.delta <= -8;
  return {
    id: 'recovery', title: 'Recovery', status: 'ready',
    headline: `Readiness ${Math.round(c.recentAvg)} on average this week`,
    plain: Math.abs(c.delta) < 2 ? `Your readiness score is right around your usual, about ${Math.round(c.recentAvg)}.` : `Your readiness score is about ${Math.abs(Math.round(c.delta))} points ${c.delta < 0 ? 'lower' : 'higher'} than usual this week.`,
    change: Math.abs(c.delta) >= 2 ? { direction: c.delta < 0 ? 'down' : 'up', text: `${Math.abs(Math.round(c.delta))} points ${c.delta < 0 ? 'lower' : 'higher'} than your usual` } : { direction: 'flat', text: 'About the same as your usual' },
    explanation: lower ? 'Your readiness has been lower than your recent baseline.' : 'Your readiness has been steady.',
    affects: lower ? 'If energy is one of your goals, energy picks are a stronger fit for you right now.' : null,
    sources: sourcesOf(pts), trend: lastDays(pts, today), unit: 'score',
    signal: lower ? { needId: 'energy.fatigue', summary: 'Your readiness score has been lower than usual', metric: 'readiness_score' } : null,
  };
}

/* --------------------------------- Activity -------------------------------- */
function activitySection(resolved, today) {
  const steps = series(resolved, 'steps');
  const workouts = series(resolved, 'workout_minutes');
  const s = compare(steps, today);
  // Workouts: days without a workout have no row, so compare weekly totals, not daily averages.
  const { recent: wr, baseline: wb } = windows(workouts, today);
  const wEnough = wb.length >= 3;
  const wRecent = wr.reduce((a, p) => a + p.value, 0);
  const wUsual = wb.reduce((a, p) => a + p.value, 0) / (BASELINE_DAYS / RECENT_DAYS);
  if (!s.enough && !wEnough) return notEnough('activity', 'Activity', [...steps, ...workouts], 'activity data');
  const pct = s.enough
    ? (s.baselineAvg > 0 ? Math.round((s.delta / s.baselineAvg) * 100) : 0)
    : (wUsual > 0 ? Math.round(((wRecent - wUsual) / wUsual) * 100) : 0);
  const headline = s.enough ? `About ${Math.round(s.recentAvg).toLocaleString('en-US')} steps a day this week` : `${fmtMinutes(wRecent)} of workouts this week`;
  return {
    id: 'activity', title: 'Activity', status: 'ready', headline,
    plain: Math.abs(pct) < 10
      ? (s.enough ? `You're moving about as much as usual, around ${Math.round(s.recentAvg).toLocaleString('en-US')} steps a day.` : 'Your workouts are about the same as usual.')
      : (s.enough ? `You've walked about ${Math.abs(pct)}% ${pct < 0 ? 'less' : 'more'} than usual this week.` : `Your workout time is about ${Math.abs(pct)}% ${pct < 0 ? 'lower' : 'higher'} than usual this week.`),
    change: Math.abs(pct) >= 10 ? { direction: pct < 0 ? 'down' : 'up', text: `${Math.abs(pct)}% ${pct < 0 ? 'less' : 'more'} than your usual` } : { direction: 'flat', text: 'About the same as your usual' },
    explanation: pct >= 25 ? 'You have been moving more than usual.' : pct <= -25 ? 'You have been moving less than usual.' : 'Your activity has been steady.',
    affects: null,
    sources: sourcesOf([...steps, ...workouts]), trend: lastDays(s.enough ? steps : workouts, today), unit: s.enough ? 'steps' : 'min',
    signal: null,
  };
}

export const SECTION_ORDER = ['sleep', 'cycle', 'recovery', 'activity', 'heart'];

/* ------------------------------- Period timing ------------------------------ */
// Needs whose products she uses in the days before or during a period. Timing
// only ever re-orders picks inside one of these when she CHOSE it
// (src/health/matchContext.js, src/matching/healthShaping.js).
export const PERIOD_SOON_NEEDS = ['period.heavy', 'period.light', 'period.product_support', 'pain.menstrual_cramp', 'cycle.pms', 'mood.pmdd', 'bloating.cycle_related', 'mood.cycle_related', 'pain.cycle_headache', 'cycle.breast_tenderness'];
export const PERIOD_NOW_NEEDS = ['period.heavy', 'period.light', 'period.product_support', 'pain.menstrual_cramp'];
export const PERIOD_SOON_DAYS = 5;
// Pain relievers for period pain work best started 1 to 2 days before bleeding
// and kept up for the first 2 to 3 days (Royal Children's Hospital Melbourne
// clinical guideline, Dysmenorrhoea). That is why a period due within a few
// days moves things used around the period ahead of things that take weeks.
// MedlinePlus 003150 (checked Oct 24 2026, GOV_SOURCES.md): start an NSAID the day before your
// period is expected. Replaces the Royal Children's Hospital guideline (not .gov).
export const PERIOD_TIMING_SOURCE = 'https://medlineplus.gov/ency/article/003150.htm';

/**
 * "Your period is due in about 3 days" / "You're on your period": a timing
 * fact from her own logs, used to order picks within needs she chose.
 * Never a new need, never a suggestion.
 */
export function periodTiming(resolved, cycle, today) {
  if (!cycle || cycle.status !== 'ready') return [];
  const flow = series(resolved, 'menstrual_flow');
  const end = toTime(today);
  const onNow = flow.some((p) => p.value >= 1 && end - toTime(p.day) <= DAY && toTime(p.day) <= end);
  let timing = null;
  if (onNow) {
    timing = { timing: 'period_now', daysUntil: 0, summary: "You're on your period", needIds: PERIOD_NOW_NEEDS };
  } else if (cycle.estimate?.day) {
    const days = Math.round((toTime(cycle.estimate.day) - end) / DAY);
    if (days >= 0 && days <= PERIOD_SOON_DAYS) {
      timing = { timing: 'period_soon', daysUntil: days, summary: days === 0 ? 'Your period is due about now' : `Your period is due in about ${days} day${days === 1 ? '' : 's'}`, needIds: PERIOD_SOON_NEEDS };
    }
  }
  if (!timing) return [];
  const { needIds, ...rest } = timing;
  return needIds.map((needId) => ({ needId, kind: 'timing', ...rest, metric: 'menstrual_flow', sources: cycle.sources, section: 'cycle', cite: PERIOD_TIMING_SOURCE }));
}

/**
 * @param {Array} rows   raw daily rows from any sources (deduped here)
 * @param {object} [opts] { today: 'YYYY-MM-DD', preferred: { category: source } }
 */
export function buildInsights(rows, opts = {}) {
  const today = opts.today || isoDay(Date.now());
  const resolved = resolveDaily(rows, opts.preferred);
  const sections = {
    sleep: sleepSection(resolved, today),
    cycle: cycleSection(resolved, today),
    recovery: recoverySection(resolved, today),
    activity: activitySection(resolved, today),
    heart: heartSection(resolved, today),
  };
  return {
    today,
    sections: SECTION_ORDER.map((id) => sections[id]).filter((s) => s.status !== 'empty'),
    signals: SECTION_ORDER.map((id) => sections[id].signal && { ...sections[id].signal, sources: sections[id].sources, section: id }).filter(Boolean),
    // Timing facts (period due soon / on now). Matching reads these next to
    // `signals`; they never become a suggested goal.
    timing: periodTiming(resolved, sections.cycle, today),
  };
}

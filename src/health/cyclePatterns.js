/**
 * Cross-cycle patterns: what keeps happening at the same point of her cycle,
 * compared with her own baseline in that same cycle.
 *
 *   "Sleep was rougher in the 3 days before your period than the rest of the
 *    cycle, in 3 of the 4 cycles you logged."
 *
 * Inputs: the daily log (dailyLog.js), period data from connected health
 * rows (metric 'menstrual_flow', as in insights.js periodStarts) and any
 * known cycle start days. Optional wearable sleep (metric 'sleep_minutes').
 *
 * Rules (master prompt sections 56, 57, 148):
 *  - At least MIN_CYCLES cycles with data for that metric and window, and the
 *    pattern must show in at least MIN_CYCLES of them and in most of them.
 *  - Every pattern says how many cycles it is based on.
 *  - Observations only: never a cause, never a diagnosis.
 *  - Missing days are missing, not "fine". A cycle only counts when both the
 *    window and the baseline have enough logged days.
 *
 * Output: [{ id, metric, window, text, basis: { cycles: n, of: m }, direction,
 *            windowDays, observed: { from, to }, dataSources, confidence,
 *            validation: 'not_clinically_confirmed', source: 'ayna_pattern', method: 'derived' }]
 *   direction: 'harder' | 'easier' (compared with the rest of her cycle).
 *   Section 148 asks for source data, observation window, uncertainty and
 *   validation status: dataSources ('daily_log' | 'connected_data'),
 *   observed (first and last cycle start counted), confidence ('low' when
 *   based on fewer than 5 cycles, else 'moderate'; never 'high' from self
 *   reports alone).
 * Derived at read time, never stored.
 */
import { addDays, daysBetweenDays, FLOW_RANK, isDay, normalizeEntry, todayKey } from './dailyLog.js';

export const MIN_CYCLES = 3;
/** Share of counted cycles that must show it ("3 of 4" yes, "3 of 6" no). */
export const MIN_SHARE = 0.6;
const MAX_CYCLES = 6;
const MIN_LEN = 15;
const MAX_LEN = 60;
// A new period starts on a flow day after more than this many days without flow.
const GAP_DAYS = 5;

/**
 * Windows, as cycle-day offsets from a period start (day 1 = offset 0).
 * premenstrual: the 3 days before a period. menstrual: days 1 and 2.
 * Baseline: the rest of the same cycle, leaving out days 1 to 3 and the 3
 * days before the next period.
 */
export const CYCLE_WINDOWS = {
  premenstrual: { from: -3, to: -1, minDays: 2 },
  menstrual: { from: 0, to: 1, minDays: 1 },
};
const BASELINE_MIN_DAYS = 3;

/**
 * Metrics. `better`: which way is easier for her. `threshold`: how far the
 * window must sit from her baseline (scale points, or minutes) to count.
 */
export const PATTERN_METRICS = {
  pain: { label: 'Pain', better: 'lower', threshold: 0.5, words: { harder: 'higher', easier: 'lower' } },
  pms: { label: 'PMS', better: 'lower', threshold: 0.5, words: { harder: 'higher', easier: 'lower' } },
  sleep: { label: 'Sleep', better: 'higher', threshold: 0.5, words: { harder: 'rougher', easier: 'better' } },
  mood: { label: 'Mood', better: 'higher', threshold: 0.5, words: { harder: 'lower', easier: 'better' } },
  skin: { label: 'Skin', better: 'higher', threshold: 0.5, words: { harder: 'more flared', easier: 'clearer' } },
  sleep_minutes: { label: 'Sleep from your connected data', better: 'higher', threshold: 30, words: { harder: 'shorter', easier: 'longer' } },
};

const LOG_METRICS = ['pain', 'pms', 'sleep', 'mood', 'skin'];

/* -------------------------------- cycles -------------------------------- */

/**
 * Period start days from every source she has: logged flow (light or more;
 * spotting alone never starts a period), connected 'menstrual_flow' rows and
 * known start days. Oldest first.
 */
export function cycleStartsFrom({ log = {}, healthRows = [], cycleStarts = [], today = todayKey() } = {}) {
  const flowDays = new Set();
  for (const raw of Array.isArray(log) ? log : Object.values(log || {})) {
    const e = normalizeEntry(raw);
    if (e && e.flow && FLOW_RANK[e.flow] >= FLOW_RANK.light) flowDays.add(e.day);
  }
  for (const r of Array.isArray(healthRows) ? healthRows : []) {
    if (r?.metric === 'menstrual_flow' && isDay(r.day) && Number(r.value) >= 1) flowDays.add(r.day);
  }
  const known = (Array.isArray(cycleStarts) ? cycleStarts : []).filter(isDay);
  const days = [...flowDays].filter((d) => d <= today).sort();
  const starts = [];
  let prev = null;
  for (const d of days) {
    if (!prev || daysBetweenDays(prev, d) > GAP_DAYS) starts.push(d);
    prev = d;
  }
  for (const k of known) {
    if (k > today) continue;
    if (!starts.some((s) => Math.abs(daysBetweenDays(s, k)) <= GAP_DAYS)) starts.push(k);
  }
  return starts.sort();
}

/**
 * Cycles as { start, end (inclusive), complete }. A gap that is too short or
 * too long to be one cycle (a missed log) is not a cycle. The cycle running
 * now is included with complete: false and end = today.
 */
export function cyclesFrom(starts, today = todayKey()) {
  const out = [];
  for (let i = 0; i < starts.length; i += 1) {
    const start = starts[i];
    const next = starts[i + 1];
    if (next) {
      const len = daysBetweenDays(start, next);
      if (len >= MIN_LEN && len <= MAX_LEN) out.push({ start, end: addDays(next, -1), next, complete: true });
    } else if (daysBetweenDays(start, today) <= MAX_LEN) {
      out.push({ start, end: today, next: null, complete: false });
    }
  }
  return out;
}

/* -------------------------------- values -------------------------------- */

function dailyValues({ log, healthRows }) {
  const byMetric = Object.fromEntries(Object.keys(PATTERN_METRICS).map((m) => [m, new Map()]));
  for (const raw of Array.isArray(log) ? log : Object.values(log || {})) {
    const e = normalizeEntry(raw);
    if (!e) continue;
    for (const m of LOG_METRICS) if (e[m] != null) byMetric[m].set(e.day, e[m]);
  }
  // Wearable sleep: one source only (the one with the most nights), never an average across devices.
  const sleepRows = (Array.isArray(healthRows) ? healthRows : []).filter((r) => r?.metric === 'sleep_minutes' && isDay(r.day) && Number.isFinite(Number(r.value)) && Number(r.value) > 0);
  if (sleepRows.length) {
    const count = new Map();
    for (const r of sleepRows) count.set(r.origin || r.source || 'unknown', (count.get(r.origin || r.source || 'unknown') || 0) + 1);
    const best = [...count.entries()].sort((a, b) => b[1] - a[1])[0][0];
    for (const r of sleepRows) if ((r.origin || r.source || 'unknown') === best) byMetric.sleep_minutes.set(r.day, Number(r.value));
  }
  return byMetric;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function valuesIn(map, from, to) {
  const out = [];
  if (from > to) return out;
  for (let d = from; d <= to; d = addDays(d, 1)) if (map.has(d)) out.push(map.get(d));
  return out;
}

/** The window's days for a cycle, or null when the cycle can't have this window. */
function windowRange(cycle, windowId) {
  if (windowId === 'premenstrual') {
    if (!cycle.complete) return null;
    return { from: addDays(cycle.next, CYCLE_WINDOWS.premenstrual.from), to: addDays(cycle.next, CYCLE_WINDOWS.premenstrual.to) };
  }
  return { from: addDays(cycle.start, CYCLE_WINDOWS.menstrual.from), to: addDays(cycle.start, CYCLE_WINDOWS.menstrual.to) };
}

function baselineRange(cycle) {
  const from = addDays(cycle.start, 3); // after days 1 to 3
  const to = cycle.complete ? addDays(cycle.next, -4) : cycle.end; // before the 3 days ahead of the next period
  return { from, to };
}

/* ------------------------------- patterns ------------------------------- */

function phrase(metricId, windowId, direction, n, m, bleed) {
  const metric = PATTERN_METRICS[metricId];
  const word = metric.words[direction];
  const when = windowId === 'premenstrual' ? `in the 3 days before your ${bleed}` : `on days 1 and 2 of your ${bleed}`;
  const basis = n === m ? `in all ${m} cycles you logged` : `in ${n} of the ${m} cycles you logged`;
  return `${metric.label} was ${word} ${when} than the rest of the cycle, ${basis}.`;
}

/**
 * @param {{ log?: object|object[], healthRows?: object[], cycleStarts?: string[], today?: string, hormonalBC?: boolean }} input
 *   hormonalBC: bleeds on hormonal birth control aren't periods, so the text says "bleed".
 * @returns {Array<{ id, metric, window, text, basis: { cycles, of }, direction, windowDays, source, method }>}
 */
export function findCyclePatterns({ log = {}, healthRows = [], cycleStarts = [], today = todayKey(), hormonalBC = false } = {}) {
  const starts = cycleStartsFrom({ log, healthRows, cycleStarts, today });
  const cycles = cyclesFrom(starts, today).slice(-MAX_CYCLES - 1);
  if (cycles.length < MIN_CYCLES) return [];
  const values = dailyValues({ log, healthRows });
  const bleed = hormonalBC ? 'bleed' : 'period';
  const found = [];

  for (const metricId of Object.keys(PATTERN_METRICS)) {
    const metric = PATTERN_METRICS[metricId];
    const map = values[metricId];
    if (!map || map.size === 0) continue;
    for (const windowId of Object.keys(CYCLE_WINDOWS)) {
      const spec = CYCLE_WINDOWS[windowId];
      const diffs = [];
      const usedStarts = [];
      for (const cycle of cycles) {
        const w = windowRange(cycle, windowId);
        if (!w || w.to > today) continue;
        const inWindow = valuesIn(map, w.from, w.to);
        const base = baselineRange(cycle);
        const inBase = valuesIn(map, base.from, base.to);
        if (inWindow.length < spec.minDays || inBase.length < BASELINE_MIN_DAYS) continue;
        diffs.push(mean(inWindow) - mean(inBase));
        usedStarts.push(cycle.start);
      }
      const counted = diffs.slice(-MAX_CYCLES);
      const countedStarts = usedStarts.slice(-MAX_CYCLES);
      const m = counted.length;
      if (m < MIN_CYCLES) continue;
      // Positive raw difference is "harder" when lower is better (pain), "easier" when higher is better (sleep).
      const harderSign = metric.better === 'lower' ? 1 : -1;
      for (const direction of ['harder', 'easier']) {
        const sign = direction === 'harder' ? harderSign : -harderSign;
        const n = counted.filter((d) => d * sign >= metric.threshold).length;
        if (n < MIN_CYCLES || n / m < MIN_SHARE) continue;
        found.push({
          id: `${metricId}.${windowId}.${direction}`,
          metric: metricId,
          window: windowId,
          text: phrase(metricId, windowId, direction, n, m, bleed),
          basis: { cycles: n, of: m },
          direction,
          windowDays: [spec.from, spec.to],
          observed: { from: countedStarts[0], to: countedStarts[countedStarts.length - 1] },
          dataSources: [metricId === 'sleep_minutes' ? 'connected_data' : 'daily_log'],
          confidence: m >= 5 ? 'moderate' : 'low',
          validation: 'not_clinically_confirmed',
          source: 'ayna_pattern',
          method: 'derived',
          strength: n / m,
        });
      }
    }
  }
  return found
    .sort((a, b) => b.strength - a.strength || b.basis.cycles - a.basis.cycles || a.id.localeCompare(b.id))
    .map((p) => { const out = { ...p }; delete out.strength; return out; });
}

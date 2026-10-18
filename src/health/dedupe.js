/**
 * One value per metric per day, no matter how many sources sent it.
 *
 * The same night of sleep can arrive three ways: from Oura directly, from
 * Apple Health (because Oura writes into it), and from a manual upload. If we
 * kept all three, every average and every match signal would count it three
 * times. Rules, applied per (metric, day):
 *
 * 1. Same origin = same measurement. Rows whose `origin` matches collapse to
 *    one, preferring the row that came straight from the origin
 *    (Oura's own API beats Oura-via-Apple-Health).
 * 2. Different origins, 'level' metrics (sleep, heart rate, temperature...):
 *    two devices measured the same thing. Keep ONE, by the person's preferred
 *    source for that category if she set one, otherwise by PRECEDENCE below.
 *    Never averaged, never added.
 * 3. Different origins, 'total' metrics (steps, workouts...): could be the
 *    same walk counted twice, or two different workouts. At daily resolution
 *    we cannot tell, so take the LARGEST single source. This can undercount;
 *    it never double counts.
 *
 * Every resolved row keeps `alsoFrom` so the UI can say where else it came from.
 */
import { METRICS } from './metrics.js';

const DEVICE_FIRST = ['oura', 'garmin', 'apple_health', 'health_connect', 'strava', 'manual_import'];
const PHONE_FIRST = ['apple_health', 'health_connect', 'garmin', 'oura', 'strava', 'manual_import'];
const WORKOUTS_FIRST = ['strava', 'garmin', 'apple_health', 'health_connect', 'oura', 'manual_import'];

export const PRECEDENCE = {
  sleep: DEVICE_FIRST,
  temperature: DEVICE_FIRST,
  heart: DEVICE_FIRST,
  recovery: DEVICE_FIRST,
  cycle: PHONE_FIRST,
  activity: PHONE_FIRST,
};
const METRIC_PRECEDENCE = { workout_minutes: WORKOUTS_FIRST, workout_count: WORKOUTS_FIRST };

function rank(order, source) {
  const i = order.indexOf(source);
  return i === -1 ? order.length : i;
}

function pickByPrecedence(rows, order) {
  return [...rows].sort((a, b) => rank(order, a.source) - rank(order, b.source))[0];
}

/**
 * @param {Array} rows   daily rows from any number of sources
 * @param {object} [preferred] { [category]: sourceId } the person's own choice
 * @returns {Array} one row per (metric, day), each with `alsoFrom: string[]`
 */
export function resolveDaily(rows, preferred = {}) {
  const groups = new Map();
  for (const row of rows || []) {
    if (!row || !METRICS[row.metric]) continue;
    const key = `${row.metric}|${row.day}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  const out = [];
  for (const group of groups.values()) {
    const def = METRICS[group[0].metric];
    const baseOrder = METRIC_PRECEDENCE[group[0].metric] || PRECEDENCE[def.category] || DEVICE_FIRST;
    const pref = preferred?.[def.category];
    const order = pref ? [pref, ...baseOrder.filter((s) => s !== pref)] : baseOrder;

    // 1. Collapse same-origin copies.
    const byOrigin = new Map();
    for (const row of group) {
      const origin = row.origin || row.source;
      const current = byOrigin.get(origin);
      if (!current) { byOrigin.set(origin, row); continue; }
      const rowIsDirect = row.source === origin;
      const currentIsDirect = current.source === origin;
      if (rowIsDirect && !currentIsDirect) byOrigin.set(origin, row);
      else if (rowIsDirect === currentIsDirect && rank(order, row.source) < rank(order, current.source)) byOrigin.set(origin, row);
    }
    const distinct = [...byOrigin.values()];

    // 2/3. Different origins.
    let chosen;
    if (distinct.length === 1) chosen = distinct[0];
    else if (def.kind === 'total') chosen = [...distinct].sort((a, b) => b.value - a.value || rank(order, a.source) - rank(order, b.source))[0];
    else chosen = pickByPrecedence(distinct, order);

    const alsoFrom = [...new Set(group.map((r) => r.source).filter((s) => s !== chosen.source))];
    out.push({ ...chosen, alsoFrom });
  }
  return out.sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : a.metric.localeCompare(b.metric)));
}

/** Resolved rows for one metric, oldest first, as { day, value, source }. */
export function series(resolved, metric) {
  return resolved.filter((r) => r.metric === metric).map((r) => ({ day: r.day, value: r.value, source: r.source, origin: r.origin }));
}

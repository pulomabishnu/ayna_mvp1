/**
 * Oura API v2 -> ayna daily rows. Pure functions, no network (the server
 * route does the fetching). Only daily summaries are used; ayna never asks
 * for minute-by-minute heart rate, SpO2, tags or personal info.
 *
 * Endpoints read (all under https://api.ouraring.com/v2/usercollection/):
 *   daily_readiness  score, temperature_deviation      -> readiness_score, temp_deviation_c
 *   sleep            sleep periods (seconds, bpm, ms)  -> sleep_minutes, deep, REM, resting HR, HRV (RMSSD)
 *   daily_activity   steps, active_calories            -> steps, active_energy_kcal
 *   workout          start/end per workout             -> workout_minutes, workout_count
 */

export const OURA_SCOPES = ['daily', 'workout'];
export const OURA_ENDPOINTS = ['daily_readiness', 'sleep', 'daily_activity', 'workout'];

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const row = (metric, day, value) => ({ metric, day, value, origin: 'oura', method: 'observed' });

export function ouraReadinessRows(data = []) {
  const out = [];
  for (const d of data) {
    if (!d?.day) continue;
    if (num(d.score) != null) out.push(row('readiness_score', d.day, d.score));
    if (num(d.temperature_deviation) != null) out.push(row('temp_deviation_c', d.day, d.temperature_deviation));
  }
  return out;
}

/** Main sleep per day = longest 'long_sleep' (or 'sleep') period. Naps don't set resting HR or HRV. */
export function ouraSleepRows(data = []) {
  const byDay = new Map();
  for (const p of data) {
    if (!p?.day || !['long_sleep', 'sleep'].includes(p.type || 'long_sleep')) continue;
    const list = byDay.get(p.day) || [];
    list.push(p);
    byDay.set(p.day, list);
  }
  const out = [];
  for (const [day, periods] of byDay) {
    const total = periods.reduce((a, p) => a + (num(p.total_sleep_duration) || 0), 0);
    const deep = periods.reduce((a, p) => a + (num(p.deep_sleep_duration) || 0), 0);
    const rem = periods.reduce((a, p) => a + (num(p.rem_sleep_duration) || 0), 0);
    const main = [...periods].sort((a, b) => (num(b.total_sleep_duration) || 0) - (num(a.total_sleep_duration) || 0))[0];
    if (total > 0) out.push(row('sleep_minutes', day, Math.round(total / 60)));
    if (deep > 0) out.push(row('sleep_deep_minutes', day, Math.round(deep / 60)));
    if (rem > 0) out.push(row('sleep_rem_minutes', day, Math.round(rem / 60)));
    if (num(main?.lowest_heart_rate) != null) out.push(row('resting_hr_bpm', day, main.lowest_heart_rate));
    if (num(main?.average_hrv) != null) out.push(row('hrv_rmssd_ms', day, main.average_hrv));
  }
  return out;
}

export function ouraActivityRows(data = []) {
  const out = [];
  for (const d of data) {
    if (!d?.day) continue;
    if (num(d.steps) != null) out.push(row('steps', d.day, d.steps));
    if (num(d.active_calories) != null) out.push(row('active_energy_kcal', d.day, d.active_calories));
  }
  return out;
}

export function ouraWorkoutRows(data = []) {
  const acc = new Map();
  for (const w of data) {
    if (!w?.day) continue;
    const start = Date.parse(w.start_datetime);
    const end = Date.parse(w.end_datetime);
    const minutes = Number.isFinite(start) && Number.isFinite(end) && end > start ? (end - start) / 60000 : 0;
    const cur = acc.get(w.day) || { minutes: 0, count: 0 };
    cur.minutes += minutes;
    cur.count += 1;
    acc.set(w.day, cur);
  }
  const out = [];
  for (const [day, v] of acc) {
    out.push(row('workout_minutes', day, Math.round(Math.min(v.minutes, 1440))));
    out.push(row('workout_count', day, v.count));
  }
  return out;
}

/** @param {Record<string, Array>} payloads keyed by endpoint name */
export function ouraRows(payloads = {}) {
  return [
    ...ouraReadinessRows(payloads.daily_readiness),
    ...ouraSleepRows(payloads.sleep),
    ...ouraActivityRows(payloads.daily_activity),
    ...ouraWorkoutRows(payloads.workout),
  ];
}

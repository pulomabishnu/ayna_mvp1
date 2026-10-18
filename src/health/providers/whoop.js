/**
 * WHOOP API v2 -> ayna daily rows. Pure functions, no network.
 *
 * WHOOP's API Terms (§4.2(2)) forbid building databases or permanent copies of
 * WHOOP data. So WHOOP rows are NEVER saved: the server fetches them live when
 * she opens ayna, the app computes her trends in memory, and nothing is kept.
 *
 *   /v2/activity/sleep   main sleep (nap = false), stage totals in ms
 *   /v2/recovery         recovery score, resting HR, HRV (RMSSD, ms), skin temp
 *   /v2/activity/workout start/end per workout
 */

export const WHOOP_SCOPES = ['read:sleep', 'read:recovery', 'read:workout', 'offline'];
export const WHOOP_ENDPOINTS = { sleep: '/v2/activity/sleep', recovery: '/v2/recovery', workout: '/v2/activity/workout' };

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const row = (metric, day, value) => ({ metric, day, value, origin: 'whoop', method: 'observed', source: 'whoop' });

/** Local calendar day of a WHOOP timestamp using its timezone_offset ("-05:00"). */
export function whoopLocalDay(iso, offset) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(String(offset || ''));
  const shift = m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60000 : 0;
  return new Date(t + shift).toISOString().slice(0, 10);
}

const scored = (r) => r && r.score_state === 'SCORED' && r.score;

/** Main sleep per wake-up day. Returns { rows, dayBySleepId } so recovery can use the same day. */
export function whoopSleepRows(records = []) {
  const byDay = new Map();
  const dayBySleepId = new Map();
  for (const s of records) {
    if (!scored(s) || s.nap) continue;
    const day = whoopLocalDay(s.end, s.timezone_offset);
    if (!day) continue;
    dayBySleepId.set(String(s.id), day);
    const st = s.score.stage_summary || {};
    const light = num(st.total_light_sleep_time_milli) || 0;
    const deep = num(st.total_slow_wave_sleep_time_milli) || 0;
    const rem = num(st.total_rem_sleep_time_milli) || 0;
    const cur = byDay.get(day) || { total: 0, deep: 0, rem: 0 };
    cur.total += light + deep + rem;
    cur.deep += deep;
    cur.rem += rem;
    byDay.set(day, cur);
  }
  const rows = [];
  for (const [day, v] of byDay) {
    if (v.total > 0) rows.push(row('sleep_minutes', day, Math.round(v.total / 60000)));
    if (v.deep > 0) rows.push(row('sleep_deep_minutes', day, Math.round(v.deep / 60000)));
    if (v.rem > 0) rows.push(row('sleep_rem_minutes', day, Math.round(v.rem / 60000)));
  }
  return { rows, dayBySleepId };
}

export function whoopRecoveryRows(records = [], dayBySleepId = new Map()) {
  const out = [];
  const seen = new Set();
  for (const r of records) {
    if (!scored(r) || r.score.user_calibrating) continue;
    const day = dayBySleepId.get(String(r.sleep_id)) || (r.created_at ? String(r.created_at).slice(0, 10) : null);
    if (!day || seen.has(day)) continue;
    seen.add(day);
    if (num(r.score.recovery_score) != null) out.push(row('readiness_score', day, r.score.recovery_score));
    if (num(r.score.resting_heart_rate) != null) out.push(row('resting_hr_bpm', day, r.score.resting_heart_rate));
    if (num(r.score.hrv_rmssd_milli) != null) out.push(row('hrv_rmssd_ms', day, Math.round(r.score.hrv_rmssd_milli)));
    if (num(r.score.skin_temp_celsius) != null) out.push(row('skin_temp_night_c', day, r.score.skin_temp_celsius));
  }
  return out;
}

export function whoopWorkoutRows(records = []) {
  const acc = new Map();
  for (const w of records) {
    const day = whoopLocalDay(w?.start, w?.timezone_offset);
    const s = Date.parse(w?.start);
    const e = Date.parse(w?.end);
    if (!day || !Number.isFinite(s) || !Number.isFinite(e) || e <= s) continue;
    const cur = acc.get(day) || { minutes: 0, count: 0 };
    cur.minutes += (e - s) / 60000;
    cur.count += 1;
    acc.set(day, cur);
  }
  const out = [];
  for (const [day, v] of acc) {
    out.push(row('workout_minutes', day, Math.round(Math.min(v.minutes, 1440))));
    out.push(row('workout_count', day, v.count));
  }
  return out;
}

/** @param {{ sleep?: Array, recovery?: Array, workout?: Array }} payloads */
export function whoopRows(payloads = {}) {
  const { rows: sleep, dayBySleepId } = whoopSleepRows(payloads.sleep);
  return [...sleep, ...whoopRecoveryRows(payloads.recovery, dayBySleepId), ...whoopWorkoutRows(payloads.workout)];
}

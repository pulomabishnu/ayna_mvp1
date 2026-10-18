/**
 * Bridge to the phone's health store: Apple Health (HealthKit) on iPhone,
 * Health Connect on Android. Only the native app has it; in a browser every
 * call reports "unavailable" and nothing is faked.
 *
 * Plugins:
 *   @capgo/capacitor-health     sleep, temperature, heart, steps, energy, workouts
 *   capacitor-ayna-cycle        period days (native/capacitor-ayna-cycle; the
 *                               maintained plugin has no menstrual-flow type)
 *
 * Read-only: nothing is ever written to Apple Health or Health Connect.
 * Samples are turned into DAILY rows here, on the phone; only those daily
 * rows are sent to ayna's server.
 *
 * Apple does not tell apps whether a READ permission was granted (doing so
 * would reveal that data exists). After asking, an empty result can mean
 * "denied" or "no data"; the UI says exactly that and never claims to know.
 */
import { Capacitor } from '@capacitor/core';
import { Health } from '@capgo/capacitor-health';
import { AynaCycle } from 'capacitor-ayna-cycle';
import { metricsForCategories } from './metrics.js';

export const nativePlatform = () => Capacitor.getPlatform();
export const nativeSourceForPlatform = () => (Capacitor.getPlatform() === 'ios' ? 'apple_health' : Capacitor.getPlatform() === 'android' ? 'health_connect' : null);

/** ayna metric -> plugin data types to ask for. Only what each metric needs. */
function pluginTypesFor(metrics, platform) {
  const t = new Set();
  const has = (m) => metrics.includes(m);
  if (has('sleep_minutes') || has('sleep_deep_minutes') || has('sleep_rem_minutes')) t.add('sleep');
  if (has('basal_temp_c')) t.add('basalBodyTemperature');
  if (has('skin_temp_night_c') && platform === 'ios') t.add('appleSleepingWristTemperature');
  if (has('resting_hr_bpm')) t.add('restingHeartRate');
  if (has('hr_avg_bpm')) t.add('heartRate');
  if (has('hrv_sdnn_ms') || has('hrv_rmssd_ms')) t.add('heartRateVariability');
  if (has('steps')) t.add('steps');
  if (has('active_energy_kcal')) t.add('calories');
  if (has('workout_minutes') || has('workout_count')) t.add('workouts');
  return [...t];
}

/** { available: boolean, reason?: 'web'|'not_supported'|'not_installed'|'update_required'|'plugin_missing' } */
export async function healthStoreAvailability() {
  if (!Capacitor.isNativePlatform()) return { available: false, reason: 'web' };
  if (!Capacitor.isPluginAvailable('Health')) return { available: false, reason: 'plugin_missing' };
  try {
    const out = await Health.isAvailable();
    if (out?.available) return { available: true };
    const r = String(out?.reason || '').toLowerCase();
    return { available: false, reason: /update/.test(r) ? 'update_required' : /install|unavailable/.test(r) && Capacitor.getPlatform() === 'android' ? 'not_installed' : 'not_supported' };
  } catch {
    return { available: false, reason: 'plugin_missing' };
  }
}

/** Shows the system permission sheet(s) for these categories' read types only. Never asks for write access. */
export async function requestHealthAccess(categories) {
  const platform = Capacitor.getPlatform();
  const metrics = metricsForCategories(categories);
  if (!metrics.length) throw new Error('no_categories');
  const read = pluginTypesFor(metrics, platform);
  let granted = null;
  if (read.length) {
    const status = await Health.requestAuthorization({ read, write: [], requestHistoryAccess: platform === 'android' });
    // Android reports real grants; iOS reports nothing useful for reads.
    if (platform === 'android') granted = status?.readAuthorized || [];
  }
  if (metrics.includes('menstrual_flow') && Capacitor.isPluginAvailable('AynaCycle')) {
    await AynaCycle.requestAuthorization();
  }
  return { asked: true, granted };
}

/* ------------------------------ aggregation ------------------------------ */
const pad = (n) => String(n).padStart(2, '0');
/** Local calendar day of an ISO timestamp, on the phone's own clock. */
export function localDay(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** App/bundle id -> who measured it. Lets dedupe recognize Oura-written-to-Apple-Health. */
export function originFromSourceId(sourceId, fallback) {
  const s = String(sourceId || '').toLowerCase();
  if (!s) return fallback;
  if (s.includes('oura')) return 'oura';
  if (s.includes('garmin')) return 'garmin';
  if (s.includes('strava')) return 'strava';
  if (s.includes('whoop')) return 'whoop';
  if (s.includes('fitbit')) return 'fitbit';
  if (s.includes('samsung') || s.includes('shealth')) return 'samsung_health';
  if (s.includes('flo')) return 'flo';
  if (s.includes('com.apple')) return 'apple_watch';
  return s.replace(/[^a-z0-9_.-]/g, '').slice(0, 60) || fallback;
}

const ASLEEP = new Set(['asleep', 'rem', 'deep', 'light']);

/** Sleep samples -> per-origin nightly minutes (assigned to the day she woke up). */
export function sleepRows(samples, fallbackOrigin) {
  const acc = new Map(); // `${origin}|${day}` -> { total, deep, rem }
  for (const s of samples || []) {
    const origin = originFromSourceId(s.sourceId, fallbackOrigin);
    const segments = s.hasStageData && Array.isArray(s.stages) && s.stages.length
      ? s.stages.map((g) => ({ state: g.stage, minutes: g.durationMinutes, end: g.endDate }))
      : [{ state: s.sleepState || 'asleep', minutes: (Date.parse(s.endDate) - Date.parse(s.startDate)) / 60000, end: s.endDate }];
    for (const seg of segments) {
      if (!ASLEEP.has(seg.state) || !(seg.minutes > 0)) continue;
      const key = `${origin}|${localDay(seg.end)}`;
      const cur = acc.get(key) || { total: 0, deep: 0, rem: 0 };
      cur.total += seg.minutes;
      if (seg.state === 'deep') cur.deep += seg.minutes;
      if (seg.state === 'rem') cur.rem += seg.minutes;
      acc.set(key, cur);
    }
  }
  const rows = [];
  for (const [key, v] of acc) {
    const [origin, day] = key.split('|');
    if (v.total > 0) rows.push({ metric: 'sleep_minutes', day, value: Math.round(Math.min(v.total, 1440)), origin, method: 'derived' });
    if (v.deep > 0) rows.push({ metric: 'sleep_deep_minutes', day, value: Math.round(v.deep), origin, method: 'derived' });
    if (v.rem > 0) rows.push({ metric: 'sleep_rem_minutes', day, value: Math.round(v.rem), origin, method: 'derived' });
  }
  return rows;
}

/** Workouts -> per-origin daily minutes and count. */
export function workoutRows(workouts, fallbackOrigin) {
  const acc = new Map();
  for (const w of workouts || []) {
    const key = `${originFromSourceId(w.sourceId, fallbackOrigin)}|${localDay(w.startDate)}`;
    const cur = acc.get(key) || { minutes: 0, count: 0 };
    cur.minutes += (Number(w.duration) || 0) / 60;
    cur.count += 1;
    acc.set(key, cur);
  }
  const rows = [];
  for (const [key, v] of acc) {
    const [origin, day] = key.split('|');
    rows.push({ metric: 'workout_minutes', day, value: Math.round(Math.min(v.minutes, 1440)), origin, method: 'derived' });
    rows.push({ metric: 'workout_count', day, value: v.count, origin, method: 'derived' });
  }
  return rows;
}

const toCelsius = (v, unit) => (unit === 'fahrenheit' ? Math.round(((v - 32) * 5 / 9) * 100) / 100 : v);

async function aggregated(dataType, metric, start, end, aggregation, origin, convert = (v) => v) {
  const out = await Health.queryAggregated({ dataType, startDate: start, endDate: end, bucket: 'day', aggregation });
  return (out?.samples || [])
    .filter((s) => Number.isFinite(s.value) && s.value > 0)
    .map((s) => ({ metric, day: localDay(s.startDate), value: convert(s.value, s.unit), origin, method: 'derived' }));
}

/**
 * Daily rows for the last `days` days, for the metrics in `categories` only.
 * A type she denied (or that has no data) just yields no rows.
 */
export async function readDailyHealth(categories, { days = 90 } = {}) {
  const platform = Capacitor.getPlatform();
  const fallback = platform === 'ios' ? 'apple_health' : 'health_connect';
  const metrics = metricsForCategories(categories);
  if (!metrics.length) return [];
  const has = (m) => metrics.includes(m);
  const end = new Date();
  const start = new Date(end.getTime() - Math.min(Math.max(1, days), 180) * 86400000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();
  const jobs = [];
  const quiet = (p) => p.catch(() => []); // one missing permission never sinks the whole sync

  if (has('sleep_minutes')) jobs.push(quiet(Health.readSamples({ dataType: 'sleep', startDate: startIso, endDate: endIso, limit: 10000, ascending: true }).then((r) => sleepRows(r?.samples, fallback))));
  if (has('steps')) jobs.push(quiet(aggregated('steps', 'steps', startIso, endIso, 'sum', fallback, Math.round)));
  if (has('active_energy_kcal')) jobs.push(quiet(aggregated('calories', 'active_energy_kcal', startIso, endIso, 'sum', fallback, Math.round)));
  if (has('resting_hr_bpm')) jobs.push(quiet(aggregated('restingHeartRate', 'resting_hr_bpm', startIso, endIso, 'average', fallback, Math.round)));
  if (has('hr_avg_bpm')) jobs.push(quiet(aggregated('heartRate', 'hr_avg_bpm', startIso, endIso, 'average', fallback, Math.round)));
  if (has('hrv_sdnn_ms') || has('hrv_rmssd_ms')) {
    // HealthKit reports SDNN, Health Connect reports RMSSD; never mixed.
    jobs.push(quiet(aggregated('heartRateVariability', platform === 'ios' ? 'hrv_sdnn_ms' : 'hrv_rmssd_ms', startIso, endIso, 'average', fallback, Math.round)));
  }
  if (has('basal_temp_c')) jobs.push(quiet(aggregated('basalBodyTemperature', 'basal_temp_c', startIso, endIso, 'average', fallback, toCelsius)));
  if (has('skin_temp_night_c') && platform === 'ios') jobs.push(quiet(aggregated('appleSleepingWristTemperature', 'skin_temp_night_c', startIso, endIso, 'average', fallback, toCelsius)));
  if (has('workout_minutes')) {
    jobs.push(quiet((async () => {
      const all = [];
      let anchor;
      for (let page = 0; page < 20; page += 1) {
        const r = await Health.queryWorkouts({ startDate: startIso, endDate: endIso, limit: 200, ascending: true, ...(anchor ? { anchor } : {}) });
        all.push(...(r?.workouts || []));
        anchor = r?.anchor;
        if (!anchor) break;
      }
      return workoutRows(all, fallback);
    })()));
  }
  if (has('menstrual_flow') && Capacitor.isPluginAvailable('AynaCycle')) {
    jobs.push(quiet(AynaCycle.readFlowDays({ days }).then((r) => (r?.days || []).map((d) => ({
      metric: 'menstrual_flow', day: d.day, value: d.value, origin: originFromSourceId(d.sourceId, fallback), method: 'observed',
    })))));
  }

  const allowed = new Set(metrics);
  return (await Promise.all(jobs)).flat().filter((r) => allowed.has(r.metric));
}

/** Health Connect: open its own settings/permission screen. iOS has no deep link; the UI explains the path instead. */
export async function openHealthPermissions() {
  if (Capacitor.getPlatform() !== 'android') return { opened: false };
  try { await Health.openHealthConnectSettings(); return { opened: true }; } catch { return { opened: false }; }
}

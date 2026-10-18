/**
 * ayna's normalized health-data model.
 *
 * Every source (Apple Health, Health Connect, Oura, Strava, a manual upload)
 * is turned into the same DAILY rows before anything else reads it:
 *
 *   { metric, day: 'YYYY-MM-DD', value, unit, source, origin, method }
 *
 *   source - the connection we got it through: 'apple_health', 'oura', ...
 *   origin - who actually measured it, when we can tell. A night Oura wrote
 *            into Apple Health arrives with source 'apple_health' and origin
 *            'oura'. Used to avoid counting the same night twice.
 *   method - 'observed' (a device measured it), 'derived' (computed from
 *            observed samples, e.g. a daily average), 'user_entered' (typed or
 *            confirmed from an upload).
 *
 * Daily summaries only. No second-by-second samples are stored anywhere.
 *
 * Consent is per CATEGORY. A metric is only accepted when its category is in
 * the categories the person turned on for that source.
 */

export const CATEGORIES = {
  sleep: {
    label: 'Sleep',
    why: 'To see whether your sleep is shorter or more broken than usual, and to tell you when that makes sleep products more relevant.',
  },
  cycle: {
    label: 'Cycle',
    why: 'To know where you are in your cycle and how much your cycle length varies, for period and cycle matches.',
  },
  temperature: {
    label: 'Temperature',
    why: 'To follow overnight temperature changes across your cycle.',
  },
  heart: {
    label: 'Heart',
    why: 'Resting heart rate and heart rate variability, to see how recovered or stretched you have been compared with your own normal.',
  },
  activity: {
    label: 'Activity',
    why: 'Steps, active energy and workouts, to connect how much you move with how you feel.',
  },
  recovery: {
    label: 'Readiness',
    why: "Your device's own daily readiness score, as another view of recovery.",
  },
};

/**
 * kind: 'level' = one reading per day (keep one source's value, never add),
 *       'total' = a daily amount (still never added ACROSS sources: two devices
 *                 counting the same steps would double them).
 * HRV is split by method: Apple Health reports SDNN, Oura and Health Connect
 * report RMSSD. They are different numbers and are never compared.
 */
export const METRICS = {
  sleep_minutes: { category: 'sleep', label: 'Sleep', unit: 'min', min: 0, max: 1440, kind: 'level', decimals: 0 },
  sleep_deep_minutes: { category: 'sleep', label: 'Deep sleep', unit: 'min', min: 0, max: 1440, kind: 'level', decimals: 0 },
  sleep_rem_minutes: { category: 'sleep', label: 'REM sleep', unit: 'min', min: 0, max: 1440, kind: 'level', decimals: 0 },
  menstrual_flow: { category: 'cycle', label: 'Period flow', unit: 'flow_level', min: 0, max: 4, kind: 'level', decimals: 0 },
  basal_temp_c: { category: 'temperature', label: 'Basal body temperature', unit: 'degC', min: 34, max: 39, kind: 'level', decimals: 2 },
  skin_temp_night_c: { category: 'temperature', label: 'Overnight skin temperature', unit: 'degC', min: 25, max: 40, kind: 'level', decimals: 2 },
  temp_deviation_c: { category: 'temperature', label: 'Temperature change from your normal', unit: 'degC', min: -5, max: 5, kind: 'level', decimals: 2 },
  resting_hr_bpm: { category: 'heart', label: 'Resting heart rate', unit: 'bpm', min: 25, max: 150, kind: 'level', decimals: 0 },
  hr_avg_bpm: { category: 'heart', label: 'Average heart rate', unit: 'bpm', min: 25, max: 220, kind: 'level', decimals: 0 },
  hrv_sdnn_ms: { category: 'heart', label: 'Heart rate variability (SDNN)', unit: 'ms', min: 1, max: 400, kind: 'level', decimals: 0 },
  hrv_rmssd_ms: { category: 'heart', label: 'Heart rate variability (RMSSD)', unit: 'ms', min: 1, max: 400, kind: 'level', decimals: 0 },
  steps: { category: 'activity', label: 'Steps', unit: 'count', min: 0, max: 150000, kind: 'total', decimals: 0 },
  active_energy_kcal: { category: 'activity', label: 'Active energy', unit: 'kcal', min: 0, max: 15000, kind: 'total', decimals: 0 },
  workout_minutes: { category: 'activity', label: 'Workout time', unit: 'min', min: 0, max: 1440, kind: 'total', decimals: 0 },
  workout_count: { category: 'activity', label: 'Workouts', unit: 'count', min: 0, max: 50, kind: 'total', decimals: 0 },
  readiness_score: { category: 'recovery', label: 'Readiness score', unit: 'score', min: 0, max: 100, kind: 'level', decimals: 0 },
};

export const FLOW_LEVELS = { none: 0, unspecified: 1, light: 2, medium: 3, heavy: 4 };

export const SOURCE_IDS = ['apple_health', 'health_connect', 'oura', 'whoop', 'strava', 'garmin', 'manual_import'];

/** Sources whose provider terms forbid keeping copies: read live, never saved (WHOOP API Terms §4.2(2)). */
export const LIVE_ONLY_SOURCES = ['whoop'];

/** The version of the health-data notice a consent was given against. Bump when the wording or purposes change. */
export const NOTICE_VERSION = 'health-data-2026-10-18';

export function metricsForCategories(categories = []) {
  const set = new Set(categories);
  return Object.entries(METRICS).filter(([, m]) => set.has(m.category)).map(([id]) => id);
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate and clean one daily row. Returns { row } or { error } with a short
 * code (never the value itself, so it is safe to log the code).
 */
export function cleanRow(input, { allowedCategories, source } = {}) {
  if (!input || typeof input !== 'object') return { error: 'not_an_object' };
  const def = METRICS[input.metric];
  if (!def) return { error: 'unknown_metric' };
  if (allowedCategories && !allowedCategories.includes(def.category)) return { error: 'category_not_consented' };
  if (typeof input.day !== 'string' || !DAY_RE.test(input.day) || Number.isNaN(Date.parse(`${input.day}T00:00:00Z`))) return { error: 'bad_day' };
  const value = typeof input.value === 'string' ? Number(input.value) : input.value;
  if (typeof value !== 'number' || !Number.isFinite(value)) return { error: 'bad_value' };
  if (value < def.min || value > def.max) return { error: 'out_of_range' };
  const src = source || input.source;
  if (!SOURCE_IDS.includes(src)) return { error: 'unknown_source' };
  const origin = typeof input.origin === 'string' && /^[a-z0-9_.-]{1,60}$/i.test(input.origin) ? input.origin.toLowerCase() : src;
  const method = ['observed', 'derived', 'user_entered'].includes(input.method) ? input.method : 'observed';
  const factor = 10 ** def.decimals;
  return {
    row: {
      metric: input.metric,
      day: input.day,
      value: Math.round(value * factor) / factor,
      unit: def.unit,
      source: src,
      origin,
      method,
    },
  };
}

export function cleanRows(inputs, opts) {
  const rows = [];
  const errors = {};
  for (const input of Array.isArray(inputs) ? inputs : []) {
    const { row, error } = cleanRow(input, opts);
    if (row) rows.push(row);
    else errors[error] = (errors[error] || 0) + 1;
  }
  return { rows, errors };
}

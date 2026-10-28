/**
 * FILM-ONLY FIXTURE. FICTIONAL DATA. NOT ANYONE'S REAL HEALTH DATA.
 *
 * Swapped in for src/health/devDemo.js by video/oura-demo/vite.config.mjs only.
 * Never imported by the production app or its build. devDemo.js itself is only
 * read behind import.meta.env.DEV + ?healthdemo=1.
 *
 * Oura data is shaped like Oura API v2 responses (daily_readiness, sleep,
 * daily_activity, workout) and goes through the SAME code the server runs
 * after a real Oura sync:
 *   ouraRows(payloads)                                     src/health/providers/oura.js
 *   cleanRows(rows, { source: 'oura', allowedCategories }) src/health/metrics.js
 * so every Oura row is honestly tagged source 'oura', and only metrics ayna's
 * Oura integration actually reads can appear.
 *
 * Period days are her own fictional uploads (source 'manual_import',
 * user_entered). Oura does not supply them.
 *
 * ?ourafilm=pre  -> Oura not connected yet (consent shot)
 */
import { ouraRows } from '../../../src/health/providers/oura.js';
import { cleanRows } from '../../../src/health/metrics.js';
import { localToday } from '../../../src/utils/localDate.js';
// Website-preview-only names, passed through unchanged from the real module so imports resolve.
export { DEV_DEMO_PRODUCT_IDS, DEV_DEMO_MATCH_IDS, DEV_DEMO_NEEDS, devDemoAddedAt } from '../../../src/health/devDemo.js';

const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const wob = (i, amp) => Math.sin(i * 1.7) * amp + Math.cos(i * 0.6) * amp * 0.6;
const OURA_CATEGORIES = ['sleep', 'temperature', 'heart', 'activity', 'recovery'];
const todayIso = () => localToday();
const stage = () => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ourafilm') : null);

export function fictionalOuraPayloads(today = todayIso()) {
  const end = Date.parse(`${today}T00:00:00Z`);
  const daily_readiness = []; const sleep = []; const daily_activity = []; const workout = [];
  const lastNights = [381, 396, 452, 384, 366, 447, 392];
  for (let i = 0; i < 90; i += 1) {
    const day = iso(end - i * DAY);
    const recent = i < 7;
    const mins = recent ? lastNights[i] : Math.round(458 + wob(i, 20));
    sleep.push({ day, type: 'long_sleep', total_sleep_duration: mins * 60,
      deep_sleep_duration: Math.round((recent ? 58 : 71) + wob(i + 3, 6)) * 60,
      rem_sleep_duration: Math.round((recent ? 79 : 94) + wob(i + 5, 8)) * 60,
      lowest_heart_rate: Math.round((recent ? 57 : 54) + wob(i + 1, 1)),
      average_hrv: Math.round((recent ? 41 : 48) + wob(i + 2, 3)) });
    daily_readiness.push({ day, score: Math.round((recent ? 74 : 81) + wob(i + 4, 3)), temperature_deviation: Math.round(wob(i + 6, 0.2) * 100) / 100 });
    daily_activity.push({ day, steps: Math.round(8400 + wob(i, 1500)), active_calories: Math.round(390 + wob(i + 2, 60)) });
    if (i % 3 === 0) workout.push({ day, start_datetime: `${day}T07:00:00Z`, end_datetime: `${day}T07:42:00Z` });
  }
  return { daily_readiness, sleep, daily_activity, workout };
}

function cycleUploads(today = todayIso()) {
  const end = Date.parse(`${today}T00:00:00Z`);
  const rows = [];
  for (const start of [23, 51, 79]) for (let d = 0; d < 5; d += 1) {
    rows.push({ metric: 'menstrual_flow', day: iso(end - (start - d) * DAY), value: d < 2 ? 3 : 2, origin: 'manual_import', method: 'user_entered' });
  }
  return cleanRows(rows, { allowedCategories: ['cycle'], source: 'manual_import' }).rows;
}

export function devDemoRows(today = todayIso()) {
  const cycle = cycleUploads(today);
  if (stage() === 'pre') return cycle;
  const oura = cleanRows(ouraRows(fictionalOuraPayloads(today)), { allowedCategories: OURA_CATEGORIES, source: 'oura' }).rows;
  return [...oura, ...cycle];
}

const synced = () => new Date(Date.now() - 4 * 60000).toISOString();
const uploads = { source: 'manual_import', status: 'connected', sync_enabled: true, categories: ['cycle'], last_synced_at: synced() };
const oura = { source: 'oura', status: 'connected', sync_enabled: true, categories: OURA_CATEGORIES, last_synced_at: synced() };
export const DEV_DEMO_CONNECTIONS = stage() === 'pre' ? [uploads] : [oura, uploads];

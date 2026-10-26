import { localToday } from '../utils/localDate.js';
/**
 * DEVELOPMENT ONLY: made-up daily rows so the health screens can be seen and
 * tested in the local preview (?healthdemo=1). Only read behind
 * import.meta.env.DEV; never shown in a production build, never saved, never
 * sent anywhere. Not anyone's real data.
 */
const DAY = 86400000;
const iso = (t) => new Date(t).toISOString().slice(0, 10);

// Small deterministic wobble so the charts look like real days.
const wobble = (i, amp) => Math.round(Math.sin(i * 1.7) * amp + Math.cos(i * 0.6) * amp * 0.6);

export function devDemoRows(today = localToday()) {
  const end = Date.parse(`${today}T00:00:00Z`);
  const rows = [];
  const add = (metric, i, value) => rows.push({ metric, day: iso(end - i * DAY), value, source: 'apple_health', origin: 'apple_health', method: 'observed' });
  // Cycle day for each day back: today is day 24 of a 28-day cycle (luteal,
  // period due in about 5 days), so every dashboard insight has something to say.
  const cycleDay = (i) => ((((23 - i) % 28) + 28) % 28) + 1;
  // Last 7 nights: 5 of them 30+ minutes under the usual.
  const lastNights = [370, 395, 455, 380, 362, 448, 390];
  for (let i = 0; i < 90; i += 1) {
    const recent = i < 7;
    add('sleep_minutes', i, recent ? lastNights[i] : 452 + wobble(i, 22));
    add('sleep_deep_minutes', i, (recent ? 52 : 68) + wobble(i + 3, 8));
    add('sleep_rem_minutes', i, (recent ? 74 : 92) + wobble(i + 5, 10));
    add('resting_hr_bpm', i, (recent ? 62 : 58) + Math.round(wobble(i + 1, 2) / 2));
    add('hrv_sdnn_ms', i, (recent ? 38 : 46) + wobble(i + 2, 4));
    add('steps', i, 8200 + wobble(i, 1800));
    add('active_energy_kcal', i, 420 + wobble(i + 4, 90));
    if (i % 3 === 0) add('workout_minutes', i, 35 + wobble(i, 10));
    // Overnight temperature: about 0.3 °C higher from the day after ovulation (cycle day 15) to the period.
    add('temp_deviation_c', i, Math.round(((cycleDay(i) >= 15 ? 0.22 : -0.1) + wobble(i + 6, 2) / 100) * 100) / 100);
  }
  // Period starts 23, 51, 79 and 107 days ago, five days each (four cycles of 28 days).
  for (const start of [23, 51, 79, 107]) for (let d = 0; d < 5; d += 1) if (start - d >= 0) add('menstrual_flow', start - d, d < 2 ? 3 : 2);
  return rows;
}

export const DEV_DEMO_CONNECTIONS = [
  { source: 'apple_health', status: 'connected', sync_enabled: true, categories: ['sleep', 'cycle', 'temperature', 'heart', 'activity'], last_synced_at: new Date().toISOString() },
];

/** Catalog ids for the demo Ecosystem on the website preview (signed out, ?healthdemo=1). */
export const DEV_DEMO_PRODUCT_IDS = ['p-thermacare', 'p-lola-tampon', 'p-saalt-cup', 'p-good-clean-love', 'p-proov-complete', 'p-magnumsolace-nighttime-magnesium-cream'];
export const DEV_DEMO_MATCH_IDS = ['p-advil-ibuprofen-200', 'p-neycher-vaginal-moisturizer'];
/** Demo: she added the magnesium cream herself 6 days ago (so the before-and-since check has something to show).
 * The cream's sleep grade cites ODS; magnesium glycinate's cited a PubMed paper, so it is draft and ungraded (Oct 24). */
export const devDemoAddedAt = (today = iso(Date.now())) => ({ 'p-magnumsolace-nighttime-magnesium-cream': iso(Date.parse(`${today}T00:00:00Z`) - 6 * DAY) });
export const DEV_DEMO_NEEDS = ['pain.menstrual_cramp', 'period.heavy', 'vaginal.dryness'];

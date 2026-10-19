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

export function devDemoRows(today = iso(Date.now())) {
  const end = Date.parse(`${today}T00:00:00Z`);
  const rows = [];
  const add = (metric, i, value) => rows.push({ metric, day: iso(end - i * DAY), value, source: 'apple_health', origin: 'apple_health', method: 'observed' });
  for (let i = 0; i < 90; i += 1) {
    const recent = i < 7;
    add('sleep_minutes', i, (recent ? 382 : 452) + wobble(i, 22));
    add('sleep_deep_minutes', i, (recent ? 52 : 68) + wobble(i + 3, 8));
    add('sleep_rem_minutes', i, (recent ? 74 : 92) + wobble(i + 5, 10));
    add('resting_hr_bpm', i, (recent ? 62 : 58) + Math.round(wobble(i + 1, 2) / 2));
    add('hrv_sdnn_ms', i, (recent ? 38 : 46) + wobble(i + 2, 4));
    add('steps', i, 8200 + wobble(i, 1800));
    add('active_energy_kcal', i, 420 + wobble(i + 4, 90));
    if (i % 3 === 0) add('workout_minutes', i, 35 + wobble(i, 10));
    add('temp_deviation_c', i, Math.round((Math.sin(((i % 29) / 29) * Math.PI * 2) * 0.25) * 100) / 100);
  }
  // Period starts 6, 34, 61 and 88 days ago, five days each.
  for (const start of [6, 34, 61, 88]) for (let d = 0; d < 5; d += 1) if (start - d >= 0) add('menstrual_flow', start - d, d < 2 ? 3 : 2);
  return rows;
}

export const DEV_DEMO_CONNECTIONS = [
  { source: 'apple_health', status: 'connected', sync_enabled: true, categories: ['sleep', 'cycle', 'temperature', 'heart', 'activity'], last_synced_at: new Date().toISOString() },
];

import { describe, it, expect } from 'vitest';
import { whoopLocalDay, whoopRows, whoopSleepRows, whoopRecoveryRows, whoopWorkoutRows } from './whoop.js';
import { saveMetrics } from '../../../api/_healthStore.js';

const sleep = (over = {}) => ({ id: 's1', nap: false, score_state: 'SCORED', end: '2026-10-11T03:30:00.000Z', timezone_offset: '-05:00', score: { stage_summary: { total_light_sleep_time_milli: 3600000, total_slow_wave_sleep_time_milli: 1800000, total_rem_sleep_time_milli: 1800000, total_awake_time_milli: 3600000 } }, ...over });

describe('WHOOP normalization', () => {
  it('uses the local day from timezone_offset', () => {
    expect(whoopLocalDay('2026-10-11T03:30:00.000Z', '-05:00')).toBe('2026-10-10');
    expect(whoopLocalDay('2026-10-11T03:30:00.000Z', '+00:00')).toBe('2026-10-11');
    expect(whoopLocalDay('nope', '-05:00')).toBeNull();
  });

  it('sleep total excludes awake time; naps and unscored sleeps are skipped', () => {
    const { rows } = whoopSleepRows([sleep(), sleep({ id: 'n', nap: true }), sleep({ id: 'p', score_state: 'PENDING_SCORE' })]);
    expect(rows.find((r) => r.metric === 'sleep_minutes').value).toBe(120);
    expect(rows.find((r) => r.metric === 'sleep_deep_minutes').value).toBe(30);
    expect(rows.every((r) => r.day === '2026-10-10' && r.source === 'whoop')).toBe(true);
  });

  it('recovery lands on the sleep day and skips calibrating scores', () => {
    const { dayBySleepId } = whoopSleepRows([sleep()]);
    const rows = whoopRecoveryRows([
      { sleep_id: 's1', score_state: 'SCORED', score: { recovery_score: 70, resting_heart_rate: 55, hrv_rmssd_milli: 40.4, skin_temp_celsius: 33.1 } },
      { sleep_id: 's2', score_state: 'SCORED', created_at: '2026-10-12T10:00:00Z', score: { user_calibrating: true, recovery_score: 99 } },
    ], dayBySleepId);
    expect(rows.map((r) => [r.metric, r.day, r.value])).toEqual([
      ['readiness_score', '2026-10-10', 70], ['resting_hr_bpm', '2026-10-10', 55], ['hrv_rmssd_ms', '2026-10-10', 40], ['skin_temp_night_c', '2026-10-10', 33.1],
    ]);
  });

  it('workouts sum per day', () => {
    const rows = whoopWorkoutRows([
      { start: '2026-10-10T14:00:00Z', end: '2026-10-10T14:45:00Z', timezone_offset: '+00:00' },
      { start: '2026-10-10T18:00:00Z', end: '2026-10-10T18:15:00Z', timezone_offset: '+00:00' },
      { start: '2026-10-10T18:00:00Z', end: '2026-10-10T17:00:00Z', timezone_offset: '+00:00' },
    ]);
    expect(rows).toEqual(expect.arrayContaining([expect.objectContaining({ metric: 'workout_minutes', value: 60 }), expect.objectContaining({ metric: 'workout_count', value: 2 })]));
  });

  it('whoopRows tolerates empty payloads', () => {
    expect(whoopRows({})).toEqual([]);
  });

  it('the store refuses to save WHOOP rows', async () => {
    const out = await saveMetrics(null, 'u1', 'whoop', [{ metric: 'steps', day: '2026-10-10', value: 1 }], { categories: ['activity'] });
    expect(out.saved).toBe(0);
    expect(out.errors).toEqual({ live_only_source: 1 });
  });
});

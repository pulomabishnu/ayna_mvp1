import { describe, expect, it } from 'vitest';
import { cleanRow, cleanRows, metricsForCategories } from './metrics.js';
import { resolveDaily } from './dedupe.js';
import { buildInsights, periodStarts } from './insights.js';
import { healthMatchContext } from './matchContext.js';

const DAY = 86400000;
const day = (base, offset) => new Date(Date.parse(`${base}T00:00:00Z`) + offset * DAY).toISOString().slice(0, 10);
const TODAY = '2026-10-17';
const nights = (n, minutes, source = 'apple_health', origin = source, startOffset = 0) =>
  Array.from({ length: n }, (_, i) => ({ metric: 'sleep_minutes', day: day(TODAY, -(startOffset + i)), value: minutes, unit: 'min', source, origin, method: 'observed' }));

describe('cleanRow', () => {
  it('accepts a valid row and rounds to the metric precision', () => {
    const { row } = cleanRow({ metric: 'basal_temp_c', day: '2026-10-01', value: 36.4567, source: 'apple_health' });
    expect(row).toMatchObject({ metric: 'basal_temp_c', value: 36.46, unit: 'degC', origin: 'apple_health', method: 'observed' });
  });
  it('rejects categories she did not consent to', () => {
    expect(cleanRow({ metric: 'menstrual_flow', day: '2026-10-01', value: 3, source: 'apple_health' }, { allowedCategories: ['sleep'] }).error).toBe('category_not_consented');
  });
  it('rejects unknown metrics, bad days, impossible values and unknown sources', () => {
    expect(cleanRow({ metric: 'blood_glucose', day: '2026-10-01', value: 5, source: 'oura' }).error).toBe('unknown_metric');
    expect(cleanRow({ metric: 'steps', day: '10/01/2026', value: 5, source: 'oura' }).error).toBe('bad_day');
    expect(cleanRow({ metric: 'resting_hr_bpm', day: '2026-10-01', value: 900, source: 'oura' }).error).toBe('out_of_range');
    expect(cleanRow({ metric: 'steps', day: '2026-10-01', value: 'lots', source: 'oura' }).error).toBe('bad_value');
    expect(cleanRow({ metric: 'steps', day: '2026-10-01', value: 5, source: 'fitbit' }).error).toBe('unknown_source');
  });
  it('counts errors by code without echoing values', () => {
    const { rows, errors } = cleanRows([{ metric: 'steps', day: '2026-10-01', value: 100, source: 'oura' }, { metric: 'nope' }, null]);
    expect(rows).toHaveLength(1);
    expect(errors).toEqual({ unknown_metric: 1, not_an_object: 1 });
  });
  it('maps categories to metrics', () => {
    expect(metricsForCategories(['sleep'])).toEqual(['sleep_minutes', 'sleep_deep_minutes', 'sleep_rem_minutes']);
  });
});

describe('resolveDaily (duplicates across sources)', () => {
  it('counts an Oura night once when it arrives from Oura and from Apple Health', () => {
    const rows = [
      { metric: 'sleep_minutes', day: '2026-10-10', value: 410, source: 'apple_health', origin: 'oura' },
      { metric: 'sleep_minutes', day: '2026-10-10', value: 412, source: 'oura', origin: 'oura' },
    ];
    const out = resolveDaily(rows);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ source: 'oura', value: 412, alsoFrom: ['apple_health'] });
  });
  it('keeps one device for a level metric measured by two devices, honoring her preference', () => {
    const rows = [
      { metric: 'resting_hr_bpm', day: '2026-10-10', value: 60, source: 'apple_health', origin: 'apple_watch' },
      { metric: 'resting_hr_bpm', day: '2026-10-10', value: 56, source: 'oura', origin: 'oura' },
    ];
    expect(resolveDaily(rows)[0].source).toBe('oura');
    expect(resolveDaily(rows, { heart: 'apple_health' })[0].source).toBe('apple_health');
  });
  it('never adds workouts from two sources; takes the larger', () => {
    const rows = [
      { metric: 'workout_minutes', day: '2026-10-10', value: 45, source: 'strava', origin: 'strava' },
      { metric: 'workout_minutes', day: '2026-10-10', value: 45, source: 'apple_health', origin: 'strava' },
      { metric: 'workout_minutes', day: '2026-10-10', value: 30, source: 'apple_health', origin: 'apple_watch' },
    ];
    const out = resolveDaily(rows);
    expect(out).toHaveLength(1);
    expect(out[0].value).toBe(45);
    expect(out[0].source).toBe('strava');
  });
  it('a manual upload of the same night does not double it', () => {
    const rows = [...nights(1, 400, 'apple_health'), ...nights(1, 400, 'manual_import', 'flo')];
    expect(resolveDaily(rows)).toHaveLength(1);
  });
});

describe('buildInsights', () => {
  it('says it is still building a baseline instead of reacting to one night', () => {
    const out = buildInsights(nights(1, 200), { today: TODAY });
    const sleep = out.sections.find((s) => s.id === 'sleep');
    expect(sleep.status).toBe('building');
    expect(out.signals).toEqual([]);
  });
  it('reports shorter sleep against her own baseline, without diagnosing', () => {
    const rows = [...nights(7, 6 * 60), ...nights(28, 7 * 60 + 15, 'apple_health', 'apple_health', 7)];
    const out = buildInsights(rows, { today: TODAY });
    const sleep = out.sections.find((s) => s.id === 'sleep');
    expect(sleep.headline).toBe('Average 6h this week');
    expect(sleep.change.text).toBe('1h 15m less than your usual');
    expect(sleep.explanation).toBe('Your sleep has been shorter than your recent average.');
    expect(JSON.stringify(sleep)).not.toMatch(/insomnia|disorder|diagnos/i);
    expect(sleep.sources).toEqual(['apple_health']);
    expect(out.signals[0]).toMatchObject({ needId: 'sleep.trouble', section: 'sleep' });
  });
  it('a steady week produces no match signal', () => {
    const rows = [...nights(7, 7 * 60 + 10), ...nights(28, 7 * 60 + 15, 'apple_health', 'apple_health', 7)];
    expect(buildInsights(rows, { today: TODAY }).signals).toEqual([]);
  });
  it('finds period starts and flags varied cycle length without naming a condition', () => {
    const starts = ['2026-06-01', '2026-06-25', '2026-08-02', '2026-08-28', '2026-10-05'];
    const rows = starts.flatMap((s) => [0, 1, 2, 3].map((i) => ({ metric: 'menstrual_flow', day: day(s, i), value: 3, source: 'apple_health', origin: 'apple_health' })));
    expect(periodStarts(rows)).toEqual(starts);
    const out = buildInsights(rows, { today: TODAY });
    const cycle = out.sections.find((s) => s.id === 'cycle');
    expect(cycle.headline).toBe('Day 13 of your cycle');
    expect(cycle.explanation).toBe('Your cycle length has varied more over your last few cycles.');
    expect(JSON.stringify(cycle)).not.toMatch(/PCOS|syndrome|disorder/i);
    expect(out.signals.some((s) => s.needId === 'cycle.irregular')).toBe(true);
  });
});

describe('healthMatchContext', () => {
  const signals = [{ needId: 'sleep.trouble', summary: 'Your recent sleep has been shorter than your usual', sources: ['oura'], metric: 'sleep_minutes', section: 'sleep' }];
  it('strengthens only needs she chose', () => {
    expect(healthMatchContext(signals, ['sleep.trouble']).byNeed['sleep.trouble'].sources).toEqual(['oura']);
  });
  it('only suggests needs she did not choose, never adds them', () => {
    const ctx = healthMatchContext(signals, ['period.heavy']);
    expect(ctx.byNeed).toEqual({});
    expect(ctx.suggestions.map((s) => s.needId)).toEqual(['sleep.trouble']);
  });
});

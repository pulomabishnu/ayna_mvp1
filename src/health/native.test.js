import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ native: false, platform: 'web', pluginAvailable: true, available: { available: true } }));
vi.mock('@capacitor/core', async (orig) => {
  const real = await orig();
  return { ...real, Capacitor: { ...real.Capacitor, isNativePlatform: () => mocks.native, getPlatform: () => mocks.platform, isPluginAvailable: () => mocks.pluginAvailable } };
});
vi.mock('@capgo/capacitor-health', () => ({ Health: { isAvailable: async () => mocks.available, requestAuthorization: vi.fn(async () => ({ readAuthorized: ['sleep'] })) } }));
vi.mock('capacitor-ayna-cycle', () => ({ AynaCycle: { requestAuthorization: vi.fn(async () => ({})) } }));

const { healthStoreAvailability, sleepRows, workoutRows, originFromSourceId, requestHealthAccess } = await import('./native.js');

describe('phone health store bridge', () => {
  it('reports unavailable in a browser instead of faking HealthKit', async () => {
    mocks.native = false;
    expect(await healthStoreAvailability()).toEqual({ available: false, reason: 'web' });
  });
  it('HealthKit unavailable (e.g. iPad without Health)', async () => {
    Object.assign(mocks, { native: true, platform: 'ios', available: { available: false, reason: 'HealthKit not available' } });
    expect(await healthStoreAvailability()).toEqual({ available: false, reason: 'not_supported' });
  });
  it('Health Connect not installed / needs update', async () => {
    Object.assign(mocks, { native: true, platform: 'android', available: { available: false, reason: 'Health Connect is not installed (unavailable)' } });
    expect((await healthStoreAvailability()).reason).toBe('not_installed');
    mocks.available = { available: false, reason: 'provider update required' };
    expect((await healthStoreAvailability()).reason).toBe('update_required');
  });
  it('app build without the plugin', async () => {
    Object.assign(mocks, { native: true, pluginAvailable: false });
    expect((await healthStoreAvailability()).reason).toBe('plugin_missing');
    mocks.pluginAvailable = true;
  });
  it('asks only for read access to the chosen categories, never write', async () => {
    Object.assign(mocks, { native: true, platform: 'ios' });
    const { Health } = await import('@capgo/capacitor-health');
    await requestHealthAccess(['sleep']);
    expect(Health.requestAuthorization).toHaveBeenLastCalledWith({ read: ['sleep'], write: [], requestHistoryAccess: false });
    await expect(requestHealthAccess([])).rejects.toThrow('no_categories');
  });
  it('turns sleep stages into nightly minutes per source, by wake-up day', () => {
    const rows = sleepRows([
      { sourceId: 'com.ouraring.oura', startDate: '2026-10-09T23:00:00', endDate: '2026-10-10T07:00:00', hasStageData: true, stages: [
        { stage: 'deep', durationMinutes: 60, endDate: '2026-10-10T01:00:00' },
        { stage: 'rem', durationMinutes: 90, endDate: '2026-10-10T05:00:00' },
        { stage: 'light', durationMinutes: 240, endDate: '2026-10-10T06:30:00' },
        { stage: 'awake', durationMinutes: 30, endDate: '2026-10-10T07:00:00' },
      ] },
    ], 'apple_health');
    expect(rows).toEqual(expect.arrayContaining([
      expect.objectContaining({ metric: 'sleep_minutes', value: 390, origin: 'oura', day: '2026-10-10' }),
      expect.objectContaining({ metric: 'sleep_deep_minutes', value: 60 }),
      expect.objectContaining({ metric: 'sleep_rem_minutes', value: 90 }),
    ]));
  });
  it('keeps workouts from different apps apart so dedupe can compare them', () => {
    const rows = workoutRows([
      { sourceId: 'com.strava.stravaride', startDate: '2026-10-10T07:00:00', duration: 2700 },
      { sourceId: 'com.apple.health.123', startDate: '2026-10-10T18:00:00', duration: 1800 },
    ], 'apple_health');
    expect(rows.filter((r) => r.metric === 'workout_minutes').map((r) => [r.origin, r.value])).toEqual([['strava', 45], ['apple_watch', 30]]);
  });
  it('maps known apps to origins', () => {
    expect(originFromSourceId('com.ouraring.oura', 'x')).toBe('oura');
    expect(originFromSourceId('', 'apple_health')).toBe('apple_health');
  });
});

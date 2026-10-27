import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ native: false, platform: 'web', pluginAvailable: true, available: { available: true }, requestStatus: null }));
vi.mock('@capacitor/core', async (orig) => {
  const real = await orig();
  return { ...real, Capacitor: { ...real.Capacitor, isNativePlatform: () => mocks.native, getPlatform: () => mocks.platform, isPluginAvailable: () => mocks.pluginAvailable } };
});
vi.mock('@capgo/capacitor-health', () => ({ Health: { isAvailable: async () => mocks.available, requestAuthorization: vi.fn(async () => ({ readAuthorized: ['sleep'] })) } }));
// requestStatus null = an older native build without getRequestStatus (it rejects).
vi.mock('capacitor-ayna-cycle', () => ({ AynaCycle: {
  requestAuthorization: vi.fn(async () => ({})),
  getRequestStatus: vi.fn(async () => { if (!mocks.requestStatus) throw new Error('not implemented'); return { status: mocks.requestStatus }; }),
} }));

const { healthStoreAvailability, sleepRows, workoutRows, originFromSourceId, requestHealthAccess, IOS_ASKED_KEY } = await import('./native.js');

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

// Oct 26 focus group: Apple Health "kept asking" and never listed period data.
describe('Apple Health: one permission sheet, asked once', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const setup = async (status) => {
    Object.assign(mocks, { native: true, platform: 'ios', pluginAvailable: true, requestStatus: status });
    store.clear();
    const { Health } = await import('@capgo/capacitor-health');
    const { AynaCycle } = await import('capacitor-ayna-cycle');
    Health.requestAuthorization.mockClear();
    AynaCycle.requestAuthorization.mockClear();
    return { Health, AynaCycle };
  };

  it('asks for period days in the SAME sheet as sleep and temperature, read-only, and not through a second sheet', async () => {
    const { Health, AynaCycle } = await setup('shouldRequest');
    const out = await requestHealthAccess(['sleep', 'cycle', 'temperature']);
    expect(out.asked).toBe(true);
    expect(AynaCycle.requestAuthorization).toHaveBeenCalledTimes(1);
    const arg = AynaCycle.requestAuthorization.mock.calls[0][0];
    expect(arg.includeFlow).toBe(true);
    expect(arg.readTypes).toEqual(expect.arrayContaining(['sleep', 'basalBodyTemperature']));
    expect(Health.requestAuthorization).not.toHaveBeenCalled();
    expect(JSON.parse(store.get(IOS_ASKED_KEY)).types).toEqual(expect.arrayContaining(['menstrualFlow', 'sleep', 'basalBodyTemperature']));
  });

  it('does not ask for period data when Cycle is off', async () => {
    const { AynaCycle } = await setup('shouldRequest');
    await requestHealthAccess(['sleep']);
    expect(AynaCycle.requestAuthorization.mock.calls[0][0]).toEqual({ readTypes: ['sleep'], includeFlow: false });
  });

  it('never re-prompts once HealthKit says every type was answered', async () => {
    const { Health, AynaCycle } = await setup('unnecessary');
    const out = await requestHealthAccess(['sleep', 'cycle']);
    expect(out).toMatchObject({ asked: false, alreadyAnswered: true });
    expect(AynaCycle.requestAuthorization).not.toHaveBeenCalled();
    expect(Health.requestAuthorization).not.toHaveBeenCalled();
  });

  it('when HealthKit cannot tell, the stored request stops a repeat; a newly turned-on category is still asked', async () => {
    const { AynaCycle } = await setup('unknown');
    await requestHealthAccess(['sleep', 'cycle']);
    expect(AynaCycle.requestAuthorization).toHaveBeenCalledTimes(1);
    await requestHealthAccess(['sleep', 'cycle']);
    expect(AynaCycle.requestAuthorization).toHaveBeenCalledTimes(1);
    await requestHealthAccess(['sleep', 'cycle', 'heart']);
    expect(AynaCycle.requestAuthorization).toHaveBeenCalledTimes(2);
  });

  it('an older native build (no getRequestStatus) keeps the old path: @capgo sheet, then the period sheet', async () => {
    const { Health, AynaCycle } = await setup(null);
    await requestHealthAccess(['sleep', 'cycle']);
    expect(Health.requestAuthorization).toHaveBeenCalledWith({ read: ['sleep'], write: [], requestHistoryAccess: false });
    expect(AynaCycle.requestAuthorization).toHaveBeenCalledWith();
  });
});

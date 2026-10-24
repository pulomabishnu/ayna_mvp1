import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../mobile/utils/notificationPreferencesApi.js', () => ({
  fetchNotificationPreferences: vi.fn(async () => ({})),
  patchNotificationPreferences: vi.fn(async () => ({})),
}));

const store = {};
beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
});

describe('askHealthPref', () => {
  it('is off by default and remembers her choice on this device', async () => {
    const m = await import('./askHealthPref.js');
    m.resetAskHealthPref();
    expect(m.getAskHealthPref().on).toBe(false);
    await m.setAskHealth(true);
    expect(m.getAskHealthPref().on).toBe(true);
    expect(store.ayna_ask_health_data_v1).toBe('on');
    await m.setAskHealth(false);
    expect(store.ayna_ask_health_data_v1).toBe('off');
  });

  it('labels the switch in her words', async () => {
    const m = await import('./askHealthPref.js');
    expect(m.ASK_HEALTH_LABEL).toBe('Let Ask ayna use my cycle and sleep data');
  });
});

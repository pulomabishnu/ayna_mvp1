import { describe, it, expect } from 'vitest';
import { trialNotifications } from './trialNotices.js';

describe('trial ending notices (Nov 16)', () => {
  const now = Date.parse('2026-11-16T12:00:00Z');
  it('the day before and when it ends, never naming anything about her health', () => {
    const list = trialNotifications('2026-11-30T12:00:00Z', now);
    expect(list.map((n) => n.title)).toEqual(['Your ayna Pro trial ends tomorrow', 'Your ayna Pro trial ended']);
    expect(list[1].schedule.at.toISOString()).toBe('2026-11-30T12:00:00.000Z');
    for (const n of list) expect(n.body).toMatch(/saved/);
  });
  it('nothing once it has ended', () => { expect(trialNotifications('2026-11-01T00:00:00Z', now)).toEqual([]); });
});

describe('trial analytics (Nov 19)', () => {
  const store = new Map();
  const ls = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const now = Date.parse('2026-11-20T12:00:00Z');
  const until = '2026-12-04T12:00:00Z';
  const run = async (status, at, events) => {
    const { handleTrialStatus } = await import('./trialNotices.js');
    handleTrialStatus(status, at, (e, p) => events.push([e, p]));
  };
  it('captures pro_trial_ended once, then pro_trial_converted once after a later purchase', async () => {
    const prev = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
    try {
      store.clear();
      const events = [];
      await run({ active: true, temporaryUntil: until }, now, events);
      expect(events).toEqual([]);
      const after = Date.parse('2026-12-05T12:00:00Z');
      await run({ active: false }, after, events);
      await run({ active: false }, after, events);
      expect(events).toEqual([['pro_trial_ended', {}]]);
      await run({ active: true, hasPurchase: true }, after, events);
      await run({ active: true, hasPurchase: true }, after, events);
      expect(events[1]).toEqual(['pro_trial_converted', { converted_when: 'after_trial' }]);
      expect(events).toHaveLength(2);
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: prev, configurable: true });
    }
  });
  it('a purchase during the trial counts as during_trial', async () => {
    const prev = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
    try {
      store.clear();
      const events = [];
      await run({ active: true, temporaryUntil: until }, now, events);
      await run({ active: true, hasPurchase: true, temporaryUntil: until }, now, events);
      expect(events).toEqual([['pro_trial_converted', { converted_when: 'during_trial' }]]);
    } finally {
      Object.defineProperty(globalThis, 'localStorage', { value: prev, configurable: true });
    }
  });
});

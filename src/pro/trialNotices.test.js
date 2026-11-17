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

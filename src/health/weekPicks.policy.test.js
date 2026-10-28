import { describe, expect, it } from 'vitest';
import { weekPicksFromRows } from './weekPicks.js';

// "What might help this week" is a product surface: Oura data must not add a
// need or a reason there (SOURCE_POLICY: oura.matching = false).
const TODAY = '2026-10-21';
const DAY = 86400000;
const day = (off) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - off * DAY).toISOString().slice(0, 10);
const sleepRows = (source) => Array.from({ length: 35 }, (_, i) => ({
  metric: 'sleep_minutes', day: day(i), value: i < 7 ? 360 : 460, source, origin: source, method: 'observed',
}));
const sleepProduct = { id: 'sleep-1', name: 'Sleep product', category: 'sleep', type: 'physical', tags: ['sleep'] };
const opts = { today: TODAY, needIds: [], products: [sleepProduct], matches: [] };

describe('weekPicksFromRows (matching policy)', () => {
  it('does not turn Oura-measured short nights into a sleep pick', () => {
    const picks = weekPicksFromRows(sleepRows('oura'), opts);
    expect(picks.some((p) => p.needId === 'sleep.trouble')).toBe(false);
  });
  it('still does for a matching-eligible source (Apple Health)', () => {
    const picks = weekPicksFromRows(sleepRows('apple_health'), opts);
    expect(picks.map((p) => p.needId)).toContain('sleep.trouble');
    expect(picks[0].reason).toMatch(/slept less than usual/);
  });
  it('drops only the ineligible rows when sources are mixed', () => {
    const picks = weekPicksFromRows([...sleepRows('oura'), ...sleepRows('health_connect')], opts);
    expect(picks.map((p) => p.needId)).toContain('sleep.trouble');
  });
});

import { describe, it, expect } from 'vitest';
import { planNudges, NUDGE_IDS } from './engagementNudges.js';

const days = (n, v, end = '2026-11-16') => Array.from({ length: n }, (_, i) => { const d = new Date(`${end}T12:00:00`); d.setDate(d.getDate() - (n - 1 - i)); return { day: d.toISOString().slice(0, 10), value: v(i) }; });

describe('phone nudges (Nov 16)', () => {
  const now = new Date('2026-11-16T10:00:00');
  it('an evening log reminder only when she has not logged today', () => {
    expect(planNudges({ now }).some((n) => n.id === NUDGE_IDS.log)).toBe(true);
    expect(planNudges({ now, loggedToday: true }).some((n) => n.id === NUDGE_IDS.log)).toBe(false);
  });
  it('come-back notes in 3 and 7 days', () => {
    const ids = planNudges({ now }).map((n) => n.id);
    expect(ids).toEqual(expect.arrayContaining([NUDGE_IDS.away3, NUDGE_IDS.away7]));
  });
  it('"you\'re doing great" only when the last days beat her usual by 20%', () => {
    const up = days(24, (i) => (i >= 21 ? 9000 : 5000));
    const flat = days(24, () => 5000);
    expect(planNudges({ now, steps: up }).some((n) => n.id === NUDGE_IDS.moving)).toBe(true);
    expect(planNudges({ now, steps: flat }).some((n) => n.id === NUDGE_IDS.moving)).toBe(false);
  });
});

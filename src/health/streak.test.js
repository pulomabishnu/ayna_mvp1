import { describe, expect, it } from 'vitest';
import { logStreak } from './streak.js';

describe('logStreak', () => {
  it('counts back from today when today is logged', () => {
    expect(logStreak(['2026-10-25', '2026-10-26', '2026-10-27'], '2026-10-27')).toMatchObject({ count: 3, loggedToday: true });
  });
  it('is still alive from yesterday before she logs today', () => {
    expect(logStreak(['2026-10-24', '2026-10-25', '2026-10-26'], '2026-10-27')).toMatchObject({ count: 3, loggedToday: false });
  });
  it('a gap ends it; nothing logged is zero', () => {
    expect(logStreak(['2026-10-20', '2026-10-26'], '2026-10-27').count).toBe(1);
    expect(logStreak([], '2026-10-27').count).toBe(0);
  });
  it('gives the last 7 days, oldest first, today marked', () => {
    const w = logStreak(['2026-10-27'], '2026-10-27').week;
    expect(w).toHaveLength(7);
    expect(w[0].day).toBe('2026-10-21');
    expect(w[6]).toEqual({ day: '2026-10-27', on: true, today: true });
  });
});

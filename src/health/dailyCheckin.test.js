import { describe, expect, it } from 'vitest';
import { dayKey, lastWeek, readCheckins, saveCheckin, weekTakeaway } from './dailyCheckin.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

describe('daily check-in', () => {
  it('saves one answer per item per day and reads it back', () => {
    const storage = mem();
    const date = new Date('2026-10-21T12:00:00');
    saveCheckin('sleep', 3, { date, storage });
    saveCheckin('mood', 1, { date, storage });
    expect(readCheckins(storage)[dayKey(date)]).toEqual({ sleep: 3, mood: 1 });
  });
  it('builds a 7-day row with gaps as null', () => {
    const today = new Date('2026-10-21T12:00:00');
    const week = lastWeek({ [dayKey(today)]: { skin: 2 } }, 'skin', today);
    expect(week).toHaveLength(7);
    expect(week[6].score).toBe(2);
    expect(week[0].score).toBeNull();
  });
  it('says a calm takeaway only with at least 3 days', () => {
    const today = new Date('2026-10-21T12:00:00');
    const d = (n) => { const x = new Date(today); x.setDate(x.getDate() - n); return dayKey(x); };
    expect(weekTakeaway({}, today)).toMatch(/Three taps/);
    expect(weekTakeaway({ [d(0)]: { sleep: 3 } }, today)).toMatch(/few more days/);
    expect(weekTakeaway({ [d(3)]: { sleep: 1 }, [d(2)]: { sleep: 1 }, [d(1)]: { sleep: 3 }, [d(0)]: { sleep: 3 } }, today)).toBe('Sleep has been better lately.');
    expect(weekTakeaway({ [d(2)]: { mood: 2 }, [d(1)]: { mood: 2 }, [d(0)]: { mood: 2 } }, today)).toBe('Mood has been steady this week.');
  });
  it('survives blocked storage', () => {
    const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(readCheckins(storage)).toEqual({});
    expect(() => saveCheckin('sleep', 2, { storage })).not.toThrow();
  });
});

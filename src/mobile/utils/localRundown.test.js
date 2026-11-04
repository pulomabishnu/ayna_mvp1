import { describe, it, expect } from 'vitest';
import { rundownSchedule, RUNDOWN_NOTIFICATION_BODY } from './localRundown.js';
import { readRundownPush, RUNDOWN_TIMES } from '../../components/today/rundownPush.js';

describe('daily Rundown reminder (founder, Nov 3)', () => {
  it('repeats every day at her time, default 8:00, with no health words', () => {
    const n = rundownSchedule().notifications[0];
    expect(n.schedule.on).toEqual({ hour: 8, minute: 0 });
    expect(n.body).toBe('Your ayna daily rundown is ready.');
    expect(RUNDOWN_NOTIFICATION_BODY).not.toMatch(/period|cramp|sleep|cycle/i);
    expect(rundownSchedule('21:30').notifications[0].schedule.on).toEqual({ hour: 21, minute: 30 });
    expect(rundownSchedule('bad').notifications[0].schedule.on).toEqual({ hour: 8, minute: 0 });
  });
  it('is on by default at 8:00 until she turns it off; any half hour 5:00 to 23:30', () => {
    const empty = { getItem: () => null };
    expect(readRundownPush(empty)).toEqual({ answered: false, on: true, time: '08:00' });
    expect(RUNDOWN_TIMES[0]).toBe('05:00');
    expect(RUNDOWN_TIMES.at(-1)).toBe('23:30');
    expect(RUNDOWN_TIMES).toContain('08:00');
  });
});

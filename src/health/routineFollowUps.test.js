// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { followUpDays, markReviewAsk, noteRoutineAdd, noteRoutineRemove, reviewsDue } from './routineFollowUps.js';
import { readRundownPush, timeLabel, writeRundownPush } from '../components/today/rundownPush.js';
import { todayProgress } from '../components/today/todayProgress.js';

beforeEach(() => localStorage.clear());

describe('Add to routine follow-ups (checklist d, e)', () => {
  it('books day 7 and cycle 3 (her cycle length, else 28 days) as follow_up nudges', () => {
    const schedule = vi.fn(() => Promise.resolve('scheduled'));
    const rec = noteRoutineAdd({ id: 'p1' }, { today: '2026-10-26', cycleLength: 30, schedule });
    expect(rec).toMatchObject({ addedDay: '2026-10-26', day7: '2026-11-02', cycle3: '2027-01-24' });
    expect(schedule).toHaveBeenCalledTimes(2);
    expect(schedule.mock.calls.every(([r]) => r.kind === 'follow_up')).toBe(true);
    expect(followUpDays('2026-10-26').cycle3).toBe('2027-01-18');
    // Adding again keeps the first dates and books nothing new.
    noteRoutineAdd({ id: 'p1' }, { today: '2026-11-01', schedule });
    expect(schedule).toHaveBeenCalledTimes(2);
  });
  it('asks for a review only after 3 cycles, while it is still in her routine', () => {
    noteRoutineAdd({ id: 'p1' }, { today: '2026-07-01', schedule: () => 'scheduled' });
    expect(reviewsDue({ today: '2026-09-01' })).toHaveLength(0);
    expect(reviewsDue({ today: '2026-10-26' }).map((r) => r.productId)).toEqual(['p1']);
    expect(reviewsDue({ today: '2026-10-26', inRoutine: [{ id: 'p2' }] })).toHaveLength(0);
    markReviewAsk('p1', 'later', { today: '2026-10-26' });
    expect(reviewsDue({ today: '2026-10-30' })).toHaveLength(0);
    expect(reviewsDue({ today: '2026-11-09' })).toHaveLength(1);
    markReviewAsk('p1', 'no', { today: '2026-11-09' });
    expect(reviewsDue({ today: '2026-12-01' })).toHaveLength(0);
    noteRoutineRemove('p1');
    expect(reviewsDue({ today: '2026-12-01' })).toHaveLength(0);
  });
});

describe('Rundown notification preference', () => {
  it('defaults to unanswered at 8:00 am and keeps her time', () => {
    expect(readRundownPush()).toEqual({ answered: false, on: false, time: '08:00' });
    writeRundownPush({ answered: true, on: true, time: '07:30' });
    expect(readRundownPush()).toEqual({ answered: true, on: true, time: '07:30' });
    expect(timeLabel('07:30')).toBe('7:30 am');
  });
});

describe('N of M done today', () => {
  it('counts what she acted on today, including items that left the list', () => {
    const t = { today: '2026-10-26', store: { seen: { a: { shownDays: ['2026-10-26'], lastInteracted: '2026-10-26' }, b: { shownDays: ['2026-10-26'], lastInteracted: null }, c: { shownDays: ['2026-10-25'], lastInteracted: '2026-10-25' } } } };
    expect(todayProgress([{ id: 'b' }, { id: 'd' }], t)).toEqual({ done: 1, total: 3 });
  });
});

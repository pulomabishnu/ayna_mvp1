// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { reminderId, reminderSchedule, setHabit, habitFor, REMINDER_BODY } from './productHabits.js';

describe('product habits (focus group: start dates, supplement reminders)', () => {
  beforeEach(() => { try { localStorage.clear(); } catch { /* none */ } });
  it('a stable id per product, and the lock screen never names the product', () => {
    expect(reminderId('p-magnesium')).toBe(reminderId('p-magnesium'));
    const s = reminderSchedule('p-magnesium', '21:30').notifications[0];
    expect(s.schedule.on).toEqual({ hour: 21, minute: 30 });
    expect(s.body).toBe(REMINDER_BODY);
    expect(s.body).not.toMatch(/magnesium/i);
  });
  it('saves and clears the start date', () => {
    setHabit('p-x', { started: '2026-11-01' });
    expect(habitFor('p-x').started).toBe('2026-11-01');
    setHabit('p-x', { started: undefined });
    expect(habitFor('p-x')).toEqual({});
  });
});

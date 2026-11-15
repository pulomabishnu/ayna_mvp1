import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false, isPluginAvailable: () => false } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: {} }));

import { saveMed, readMeds, recordDose, setMedActive } from './medications.js';
import { saveActivity, readActivities, recordActivity, setFeel, stopActivity, planFor, planSummary, validateActivity } from './dayPlan.js';
import { planNotifications, PLAN_REMINDER_BODY } from './planReminders.js';
import { buildRundown } from '../components/rundown/buildRundown.js';

function mem() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
let s;
beforeEach(() => { s = mem(); });
const DAY = '2026-11-15'; // a Sunday
const at = (h, m = 0, d = 15) => new Date(2026, 10, d, h, m);
const load = () => ({ meds: readMeds(s), acts: readActivities(s) });

describe('activities', () => {
  it('validates and dedupes', () => {
    expect(validateActivity({ title: 'x' }).errors.title).toBeTruthy();
    expect(validateActivity({ title: 'Walk', days: [0, 1, 2, 3, 4, 5, 6] }).activity.days).toEqual([]);
    expect(validateActivity({ title: 'Walk', remind: true }).activity.remind).toBe(false); // no time, no reminder
    saveActivity({ title: 'Walk', time: '07:00' }, { storage: s });
    expect(saveActivity({ title: 'walk', time: '07:00' }, { storage: s }).duplicate).toBe(true);
  });
  it('done with a feeling, undo-able; stop keeps records', () => {
    const { activity } = saveActivity({ title: 'Walk', time: '07:00', checkIn: true }, { storage: s });
    const r = recordActivity({ activityId: activity.id, day: DAY, status: 'done' }, s);
    setFeel(r.record.id, 'better', s);
    const item = planFor(DAY, { now: at(9), ...load() })[0];
    expect(item.state).toBe('done');
    expect(item.record.feel).toBe('better');
    stopActivity(activity.id, s);
    expect(planFor(DAY, { now: at(9), ...load() })).toHaveLength(0);
    expect(readActivities(s).records).toHaveLength(1);
  });
});

describe('planFor', () => {
  it('merges meds and activities by time with honest states', () => {
    saveMed({ name: 'Med A', times: ['08:00', '20:00'] }, { storage: s });
    saveActivity({ title: 'Walk', time: '12:00' }, { storage: s });
    saveActivity({ title: 'Journal' }, { storage: s });
    const items = planFor(DAY, { now: at(9, 30), ...load() });
    expect(items.map((i) => [i.title, i.time, i.state])).toEqual([
      ['Med A', '08:00', 'missed'], ['Walk', '12:00', 'upcoming'], ['Med A', '20:00', 'upcoming'], ['Journal', null, 'any'],
    ]);
  });
  it('taken shows done; a past day unlogged is missed; a future day upcoming', () => {
    const { med } = saveMed({ name: 'Med A', times: ['08:00'] }, { storage: s });
    recordDose({ medId: med.id, day: DAY, time: '08:00', status: 'taken' }, s);
    expect(planFor(DAY, { now: at(9), ...load() })[0].state).toBe('done');
    expect(planFor('2026-11-14', { now: at(9), ...load() })[0].state).toBe('missed');
    expect(planFor('2026-11-16', { now: at(9), ...load() })[0].state).toBe('upcoming');
  });
  it('as-needed meds appear only when she logs them', () => {
    const { med } = saveMed({ name: 'Inhaler', kind: 'as_needed' }, { storage: s });
    expect(planFor(DAY, { now: at(9), ...load() })).toHaveLength(0);
    recordDose({ medId: med.id, day: DAY, time: '09:10', status: 'taken' }, s);
    const it = planFor(DAY, { now: at(9, 20), ...load() });
    expect(it).toHaveLength(1);
    expect(it[0].sub).toContain('As needed');
  });
  it('summary counts and next step', () => {
    const { med } = saveMed({ name: 'Med A', times: ['08:00', '20:00'] }, { storage: s });
    recordDose({ medId: med.id, day: DAY, time: '08:00', status: 'taken' }, s);
    const sm = planSummary(DAY, { now: at(9), ...load() });
    expect(sm).toMatchObject({ total: 2, done: 1, missed: 0, next: { title: 'Med A', time: '8:00 PM' } });
  });
});

describe('reminders', () => {
  it('generic lock-screen text, weekday schedules, stopped meds excluded, unique ids', () => {
    const a = saveMed({ name: 'Secret med', times: ['08:00', '20:00'] }, { storage: s }).med;
    const b = saveMed({ name: 'Weekly', freq: 'days', days: [1, 4], times: ['09:00'] }, { storage: s }).med;
    saveMed({ name: 'Quiet', times: ['07:00'], remind: false }, { storage: s });
    saveActivity({ title: 'Walk', time: '18:00', remind: true }, { storage: s });
    let list = planNotifications({ meds: readMeds(s).meds, activities: readActivities(s).items });
    expect(list).toHaveLength(5);
    expect(list.every((n) => n.body === PLAN_REMINDER_BODY && n.title === '')).toBe(true);
    expect(JSON.stringify(list)).not.toMatch(/Secret|Weekly|Walk/);
    expect(list.filter((n) => n.schedule.on.weekday).map((n) => n.schedule.on.weekday).sort()).toEqual([2, 5]);
    expect(new Set(list.map((n) => n.id)).size).toBe(list.length);
    setMedActive(a.id, false, s);
    list = planNotifications({ meds: readMeds(s).meds, activities: [] });
    expect(list).toHaveLength(2);
    expect(b.id).toBeTruthy();
  });
  it('skips meds whose end date passed', () => {
    saveMed({ name: 'Course', times: ['08:00'], start: '2026-11-01', end: '2026-11-10' }, { storage: s });
    expect(planNotifications({ meds: readMeds(s).meds, activities: [], today: DAY })).toHaveLength(0);
  });
});

describe('rundown sync', () => {
  it('adds a plan card from her plan only', () => {
    const plan = { total: 3, done: 1, skipped: 0, missed: 0, next: { title: 'Walk', time: '6:00 PM' }, feels: [] };
    const planYesterday = { total: 2, done: 1, skipped: 0, missed: 1, feels: [{ title: 'Walk', feel: 'better' }] };
    const { cards } = buildRundown({ today: DAY, plan, planYesterday });
    const c = cards.find((x) => x.key === `plan:today:${DAY}`);
    expect(c.title).toBe('3 things on your plan. 1 done.');
    expect(c.changed).toBe('Next: Walk at 6:00 PM. Yesterday: 1 of 2 done, 1 not logged.');
    expect(c.canDo).toBe('You said you felt better after walk yesterday.');
    expect(buildRundown({ today: DAY }).cards.some((x) => x.key.startsWith('plan:'))).toBe(false);
  });
});

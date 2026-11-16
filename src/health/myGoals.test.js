import { describe, expect, it } from 'vitest';
import { addGoal, readGoals, removeGoal, toggleDone, weekFor, topicFor, setGoalsOwner } from './myGoals.js';

const store = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
describe('myGoals (her own goals)', () => {
  it('adds her own words, finds a topic, skips blanks and duplicates', () => {
    const s = store();
    addGoal({ text: 'Sleep 7 hours most nights' }, { storage: s });
    addGoal({ text: '  ' }, { storage: s });
    addGoal({ text: 'sleep 7 hours most nights' }, { storage: s });
    const g = readGoals(s);
    expect(g).toHaveLength(1);
    expect(g[0]).toMatchObject({ topic: 'sleep', perWeek: 7 }); // Nov 12: goals are daily tasks
  });
  it('a goal with no clear topic keeps none', () => { expect(topicFor('Drink more water')).toBe(null); });
  it('stops at five goals', () => {
    const s = store();
    ['a', 'b', 'c', 'd', 'e', 'f'].forEach((t) => addGoal({ text: t }, { storage: s }));
    expect(readGoals(s)).toHaveLength(5);
  });
  it('counts ticked days and good logged days once each', () => {
    const s = store();
    const [g] = addGoal({ text: 'Sleep better', topic: 'sleep', perWeek: 3 }, { storage: s });
    toggleDone(g.id, '2026-11-11', s);
    const goal = readGoals(s)[0];
    const log = { '2026-11-11': { sleep: 3 }, '2026-11-10': { sleep: 2 }, '2026-11-09': { sleep: 0 }, '2026-10-01': { sleep: 3 } };
    expect(weekFor(goal, log, '2026-11-11')).toEqual({ count: 2, of: 3, doneToday: true, met: false });
  });
  it('untick and remove', () => {
    const s = store();
    const [g] = addGoal({ text: 'Walk' }, { storage: s });
    toggleDone(g.id, '2026-11-11', s); toggleDone(g.id, '2026-11-11', s);
    expect(readGoals(s)[0].done).toEqual([]);
    expect(removeGoal(g.id, s)).toEqual([]);
  });
  it('another account on the same phone never sees her goals', () => {
    const s = store();
    setGoalsOwner('u1', s); addGoal({ text: 'Mine' }, { storage: s });
    setGoalsOwner('u2', s);
    expect(readGoals(s)).toEqual([]);
    setGoalsOwner('u1', s);
    expect(readGoals(s).map((g) => g.text)).toEqual(['Mine']);
  });
});

describe('goalTip (Nov 14 sweep)', () => {
  it('each preset shows the line about that goal, never another one', async () => {
    const { goalTip, GOAL_PRESETS } = await import('./myGoals.js');
    const { TODAY_HELP } = await import('./todayHelp.js');
    const tip = (text) => { const p = GOAL_PRESETS.find((x) => x.text === text); return goalTip({ text, topic: p.topic }, TODAY_HELP[p.topic]); };
    expect(tip('Walk 30 minutes')).toMatch(/walk/i);
    expect(tip('Screens off 30 minutes before bed')).toMatch(/phone/i);
    expect(tip('Call or text a friend')).toMatch(/friend/i);
    expect(tip('Stretch for 10 minutes')).toMatch(/movement/i);
    expect(tip('Log how I feel today')).toBeNull();
  });
});

describe('moveGoal (Zoleka 11/11)', () => {
  it('moves a goal up and down and keeps the order', async () => {
    const { addGoal, moveGoal, readGoals } = await import('./myGoals.js');
    const mem = new Map(); const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
    addGoal({ text: 'A' }, { storage, now: new Date('2026-11-01T00:00:00Z') });
    addGoal({ text: 'B' }, { storage, now: new Date('2026-11-02T00:00:00Z') });
    addGoal({ text: 'C' }, { storage, now: new Date('2026-11-03T00:00:00Z') });
    const c = readGoals(storage).find((g) => g.text === 'C');
    moveGoal(c.id, -1, storage);
    expect(readGoals(storage).map((g) => g.text)).toEqual(['A', 'C', 'B']);
    moveGoal(c.id, -1, storage);
    expect(readGoals(storage).map((g) => g.text)).toEqual(['C', 'A', 'B']);
    moveGoal(c.id, -1, storage);
    expect(readGoals(storage).map((g) => g.text)).toEqual(['C', 'A', 'B']);
  });
});

import { goalNeedFor } from './myGoals.js';
describe('a goal only brings products when it is about a need (Nov 16)', () => {
  it('stretching brings no cramp relief; her words naming cramps do', () => {
    expect(goalNeedFor({ text: 'Stretch for 10 minutes', topic: 'pain' })).toBeNull();
    expect(goalNeedFor({ text: 'stretch more' })).toBeNull();
    expect(goalNeedFor({ text: 'Ease my cramps' })).toBe('pain.menstrual_cramp');
    expect(goalNeedFor({ text: 'Screens off 30 minutes before bed', topic: 'sleep' })).toBe('sleep.trouble');
  });
});

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
    expect(g[0]).toMatchObject({ topic: 'sleep', perWeek: 5 });
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

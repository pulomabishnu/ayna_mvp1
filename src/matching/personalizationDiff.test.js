import { describe, it, expect } from 'vitest';
import { diffPersonalization, diffLines, toastFor, recapSlides } from './personalizationDiff.js';
import { addChange, readChanges } from '../utils/changeHistory.js';

const P = (id, percent = null, extra = {}) => ({ id, name: `Product ${id}`, brand: 'B', percent, ...extra });
const sleep = { id: 'sleep.trouble', label: 'Trouble sleeping' };
const cramps = { id: 'pain.menstrual_cramp', label: 'Cramps' };
const base = { needs: [sleep], matches: [P('a', 90), P('b', 85), P('c', 80), P('d', 75), P('e', 70), P('f', 65)] };

describe('diffPersonalization levels', () => {
  it('0: nothing changed', () => {
    const d = diffPersonalization(base, base);
    expect(d.level).toBe(0);
    expect(toastFor(d)).toBe('Saved. Your matches stay the same.');
    expect(diffLines(d)).toEqual([]);
  });
  it('1: a swap lower down / a % change', () => {
    const after = { ...base, matches: [P('a', 90), P('b', 85), P('d', 75), P('c', 80), P('e', 70), P('f', 60)] };
    const d = diffPersonalization(base, after);
    expect(d.level).toBe(1);
    expect(d.moved.map((m) => [m.id, m.from, m.to])).toEqual([['d', 4, 3], ['c', 3, 4]]);
    expect(d.percentChanges.map((p) => [p.id, p.from, p.to])).toEqual([['f', 65, 60]]);
    expect(toastFor(d)).toMatch(/^Updated\./);
  });
  it('2: a new #1', () => {
    const after = { ...base, matches: [P('b', 88), P('a', 86), P('c', 80), P('d', 75), P('e', 70), P('f', 65)] };
    const d = diffPersonalization(base, after);
    expect(d.level).toBe(2);
    expect(d.newTop).toMatchObject({ id: 'b', was: { id: 'a' } });
    expect(diffLines(d)[0]).toBe('New #1 match: Product b');
  });
  it('3: a need added, with the new matches and what fell out', () => {
    const after = { needs: [sleep, cramps], matches: [P('a', 90), P('x', 88), P('y', 84), P('b', 83), P('c', 80), P('z', 79)] };
    const d = diffPersonalization(base, after);
    expect(d.level).toBe(3);
    expect(d.needsAdded).toEqual([cramps]);
    expect(d.matchesAdded.map((p) => p.id)).toEqual(['x', 'y', 'z']);
    expect(d.matchesRemoved.map((p) => p.id)).toEqual(['d', 'e', 'f']);
    expect(diffLines(d)).toEqual(['Now covering: Cramps', '3 new matches', '3 matches no longer in your top 6', '2 matches moved']);
  });
  it('a quiz retake with a new #1 gets the full recap', () => {
    const after = { ...base, matches: [P('b'), P('a'), P('c'), P('d'), P('e'), P('f')] };
    expect(diffPersonalization(base, after, { source: 'quiz' }).level).toBe(3);
    expect(diffPersonalization(base, base, { source: 'quiz' }).level).toBe(0);
  });
});

describe('recapSlides: only what changed', () => {
  it('no needs slide when needs did not change; no removed slide when nothing left', () => {
    const after = { ...base, matches: [P('b', 88), P('a', 86), P('c', 80), P('d', 75), P('e', 70), P('f', 65)] };
    const kinds = recapSlides(diffPersonalization(base, after, { source: 'quiz' })).map((s) => s.kind);
    expect(kinds).toEqual(['intro', 'top', 'moved', 'done']);
  });
  it('every kind when everything changed; the new #1 is not repeated in added', () => {
    const after = { needs: [cramps], matches: [P('x', 95), P('a', 90), P('y', 84), P('b', 83), P('z', 80), P('c', 79)] };
    const slides = recapSlides(diffPersonalization(base, after));
    expect(slides.map((s) => s.kind)).toEqual(['intro', 'needs', 'top', 'added', 'moved', 'removed', 'done']);
    expect(slides.find((s) => s.kind === 'added').products.map((p) => p.id)).toEqual(['y', 'z']);
  });
});

describe('change history', () => {
  function mem() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
  it('keeps real changes only, newest first, no full snapshot, capped at 30', () => {
    const s = mem();
    expect(addChange(diffPersonalization(base, base), { storage: s })).toBeNull();
    const after = { needs: [sleep, cramps], matches: base.matches };
    for (let i = 0; i < 32; i += 1) addChange(diffPersonalization(base, after, { source: 'answer' }), { storage: s, now: new Date(2026, 10, 15, 10, i) });
    const list = readChanges(s);
    expect(list).toHaveLength(30);
    expect(list[0].lines).toEqual(['Now covering: Cramps']);
    expect(list[0].diff.after).toBeUndefined();
    expect(list[0].at > list[1].at).toBe(true);
  });
});

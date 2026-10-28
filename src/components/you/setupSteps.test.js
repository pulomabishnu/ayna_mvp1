import { describe, it, expect } from 'vitest';
import { setupSteps, knowsLine, connectedNames, countAnswers } from './setupSteps.js';

describe('You set-up steps (endowed progress from real data)', () => {
  it('counts only what she has done and names the next step', () => {
    const s = setupSteps({ hasAnswers: true, productCount: 0, connectedCount: 0, checkinCount: null });
    expect(s.done).toBe(1);
    expect(s.total).toBe(4);
    expect(s.next.key).toBe('ecosystem');
  });
  it('nothing is pre-ticked for a new account', () => {
    expect(setupSteps({}).done).toBe(0);
  });
  it('all done has no next step', () => {
    const s = setupSteps({ hasAnswers: true, productCount: 3, connectedCount: 1, checkinCount: 2 });
    expect(s.done).toBe(4);
    expect(s.next).toBeNull();
  });
  it('what ayna knows line leaves out empty parts', () => {
    expect(knowsLine({ answerCount: 6, connectedNames: ['Apple Health'], savedCount: 2 })).toBe('6 answers · Apple Health · 2 saved');
    expect(knowsLine({ answerCount: 1 })).toBe('1 answer');
    expect(knowsLine({})).toBe('');
  });
  it('names connected sources once', () => {
    expect(connectedNames([{ source: 'apple_health', status: 'connected' }, { source: 'apple_health' }, { source: 'oura', status: 'disconnected' }])).toEqual(['Apple Health']);
  });
  it('no answers counts zero', () => {
    expect(countAnswers(null)).toBe(0);
    expect(countAnswers({ age: 24 })).toBeGreaterThanOrEqual(1);
  });
});

describe('routineDay', () => {
  it('day 1 is the day she added it, from her own date only', async () => {
    const { routineDay } = await import('./setupSteps.js');
    const now = new Date(2026, 9, 26, 9);
    expect(routineDay(new Date(2026, 9, 26, 8).toISOString(), now)).toBe(1);
    expect(routineDay(new Date(2026, 9, 15, 20).toISOString(), now)).toBe(12);
    expect(routineDay(null, now)).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { monthTopSymptom, takeawayLine } from './monthTakeaway.js';
describe('top symptom this month (her own log)', () => {
  it('counts only this month and picks the most frequent', () => {
    const log = { '2026-11-02': { pain: 2, sleep: 3 }, '2026-11-03': { pain: 1, sleep: 1 }, '2026-11-05': { pain: 0, sleep: 1 }, '2026-11-06': { sleep: 1 }, '2026-10-30': { pain: 3 } };
    const t = monthTopSymptom(log, '2026-11-13');
    expect(t).toMatchObject({ field: 'sleep', days: 3, logged: 4 });
    expect(takeawayLine(t)).toBe('Rough sleep on 3 of the 4 days you logged this month.');
  });
  it('nothing logged or nothing worse: no takeaway', () => {
    expect(monthTopSymptom({}, '2026-11-13')).toBeNull();
    expect(monthTopSymptom({ '2026-11-02': { pain: 0, sleep: 3 } }, '2026-11-13')).toBeNull();
  });
});

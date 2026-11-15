import { describe, expect, it } from 'vitest';
import { topSymptom, topSymptomLine } from './topSymptom.js';

describe('topSymptom', () => {
  it('counts days this month only, by kind of pain, with last month beside it', () => {
    const log = {
      '2026-11-02': { pain: 2, pain_where: 'cramps' },
      '2026-11-03': { pain: 1, pain_where: 'cramps', mood: 1 },
      '2026-11-05': { mood: 1 },
      '2026-11-06': { pain: 1, pain_where: 'cramps' },
      '2026-10-20': { pain: 3, pain_where: 'cramps' },
      '2026-11-20': { pain: 3, pain_where: 'cramps' }, // after today: not counted
    };
    const t = topSymptom(log, '2026-11-14');
    expect(t).toEqual({ label: 'Cramps', days: 3, lastMonth: 1 });
    expect(topSymptomLine(t)).toBe('Cramps, 3 days so far (1 day last month)');
  });
  it('is null with nothing logged this month, and ignores good days', () => {
    expect(topSymptom({ '2026-11-01': { pain: 0, mood: 3 } }, '2026-11-14')).toBeNull();
    expect(topSymptom({}, '2026-11-14')).toBeNull();
  });
});

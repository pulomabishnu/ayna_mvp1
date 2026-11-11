import { describe, expect, it } from 'vitest';
import { todayHelp, TODAY_HELP } from './todayHelp.js';

describe('what may help today (founder, Nov 11)', () => {
  it('suggests sourced help for what she logged today, at most two', () => {
    expect(todayHelp({ mood: 1 }).map((h) => h.id)).toEqual(['mood']);
    expect(todayHelp({ pain: 2, mood: 1, sleep: 1 }).map((h) => h.id)).toEqual(['pain', 'mood']);
    expect(todayHelp({ energy: 1 }).map((h) => h.id)).toEqual(['energy']);
    expect(todayHelp({ pain: 1, mood: 2, sleep: 3 })).toEqual([]);
    expect(todayHelp(null)).toEqual([]);
  });
  it('gives period-pain tips for cramps, not for a headache', () => {
    expect(todayHelp({ pain: 2, pain_where: 'cramps' }).map((h) => h.id)).toEqual(['pain']);
    expect(todayHelp({ pain: 2, pain_where: 'head' })).toEqual([]);
  });
  it('never gives period pain tips in pregnancy or after menopause', () => {
    expect(todayHelp({ pain: 3 }, { pregnant: true })).toEqual([]);
    expect(todayHelp({ pain: 3, pms: 2 }, { postCycle: true })).toEqual([]);
  });
  it('every topic has a source link and says when to see a clinician', () => {
    for (const h of Object.values(TODAY_HELP)) {
      expect(h.sources.length).toBeGreaterThan(0);
      for (const s of h.sources) expect(s.url).toMatch(/^https:\/\/(www\.)?[a-z.]*(nih|medlineplus|womenshealth|cdc)\.gov\//);
      expect(h.care).toMatch(/clinician/);
    }
  });
});

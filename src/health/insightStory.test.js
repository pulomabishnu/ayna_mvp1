import { describe, it, expect } from 'vitest';
import { insightStory, insightStories, metricHeadline } from './insightStory.js';
import { isGovHealthSource, isPaperLink } from '../utils/govSources.js';

const base = (over) => ({ id: 'x', text: 'Numbers sentence 5 bpm.', basis: 'Basis.', sources: [], from: ['apple_health'], ...over });
const SIGNALS = [
  { id: 'sleep', signal: 'sleep-short', metric: 'sleep_minutes' },
  { id: 'sleep', signal: 'sleep-long', metric: 'sleep_minutes' },
  { id: 'heart', signal: 'heart-up', metric: 'resting_hr_bpm', rhrRecent: 70 },
  { id: 'heart', signal: 'heart-up', metric: 'hrv_rmssd_ms' },
  { id: 'heart', signal: 'heart-down', metric: 'resting_hr_bpm' },
  { id: 'activity', signal: 'steps-lower', metric: 'steps' },
  { id: 'cycle_length', signal: 'cycle-shorter', metric: 'cycle_length', latestDays: 25 },
  { id: 'temperature', signal: 'temp-rise', metric: 'basal_temp_c' },
  { id: 'period', signal: 'period-soon', metric: 'menstrual_flow' },
];

describe('insightStory: data becomes action', () => {
  it('every signal has a headline without numbers, what it may affect, and 1 or 2 actions', () => {
    for (const s of SIGNALS) {
      const st = insightStory(base(s));
      expect(st.changed).not.toMatch(/\d/);
      expect(st.changed).not.toMatch(/—/);
      expect(st.affects.length).toBeGreaterThan(10);
      expect(st.actions.length).toBeGreaterThanOrEqual(1);
      expect(st.actions.length).toBeLessThanOrEqual(2);
      expect(st.data.text).toContain('5 bpm');
    }
  });
  it('cites only .gov pages for what it may affect and the actions', () => {
    for (const s of SIGNALS) {
      const st = insightStory(base(s));
      for (const src of [...st.affectsSources, ...st.actions.flatMap((a) => a.sources)]) {
        expect(isGovHealthSource(src.url) || isPaperLink(src.url)).toBe(true);
      }
    }
  });
  it('flags a cycle shorter than 24 days as worth checking, without alarm', () => {
    const st = insightStory(base({ id: 'cycle_length', signal: 'cycle-shorter', latestDays: 20 }));
    expect(st.flag.text).toMatch(/^Worth checking/);
    expect(st.flag.text).toMatch(/discuss this with a clinician/);
    expect(st.actions[0].id).toBe('care');
    expect(insightStory(base({ id: 'cycle_length', signal: 'cycle-shorter', latestDays: 25 })).flag).toBeNull();
  });
  it('flags a resting heart rate that stays above 100', () => {
    expect(insightStory(base({ id: 'heart', signal: 'heart-up', metric: 'resting_hr_bpm', rhrRecent: 104 })).flag).toBeTruthy();
    expect(insightStory(base({ id: 'heart', signal: 'heart-up', metric: 'resting_hr_bpm', rhrRecent: 80 })).flag).toBeNull();
  });
  it('puts anything worth checking first and keeps the rest in order', () => {
    const list = insightStories([base(SIGNALS[0]), base({ id: 'cycle_length', signal: 'cycle-shorter', latestDays: 19 }), base(SIGNALS[5])]);
    expect(list.map((x) => x.insight.signal)).toEqual(['cycle-shorter', 'sleep-short', 'steps-lower']);
  });
  it('drops the cycle reading from temperature with hormonal birth control', () => {
    expect(insightStory(base({ signal: 'temp-rise' }), { hormonalBC: true }).affects).not.toMatch(/ovulation/);
  });
  it('tile headlines are words, not numbers', () => {
    const flat = (m, d) => Math.abs(d) < 5;
    expect(metricHeadline({ metric: 'sleep_minutes', delta: -40, usual: 420 }, flat)).toBe('Less sleep than usual');
    expect(metricHeadline({ metric: 'resting_hr_bpm', delta: 1, usual: 60 }, flat)).toBe('In your usual range');
    expect(metricHeadline({ metric: 'steps', delta: null, usual: null }, flat)).toBe('Still learning your usual');
  });
});

import { describe, expect, it } from 'vitest';
import { phasePicks, suggestedQuestions, weekSummary, dashboardContext } from './dashboardAsk.js';

const sleepDown = { id: 'sleep', title: 'Sleep', headline: 'Sleep 6h 22m a night', change: { direction: 'down', text: '1h 12m less than your usual' } };
const cycle = { cycleDay: 7, avgLength: 27, periodLength: 5, lastStart: '2026-10-14' };
const fertility = { id: 'f', category: 'diagnostics', tags: ['fertility'] };
const cramps = { id: 'c', category: 'cramp-relief', tags: ['cramps'] };
const pad = { id: 'p', category: 'pad', tags: [] };

describe('dashboard Ask card', () => {
  it('only asks about metrics she has', () => {
    expect(suggestedQuestions({ cycle, ready: [sleepDown], products: [pad], today: '2026-10-20' })).toEqual([
      'Why is my sleep lower this week?', 'What helps in the follicular phase?', 'Which of my products fit this phase?',
    ]);
    const noData = suggestedQuestions({ cycle: null, ready: [], products: [] });
    expect(noData).toEqual([]);
    expect(weekSummary([])).toBeNull();
    expect(weekSummary([sleepDown])).toBe('Sleep is 1h 12m less than usual.');
  });

  it('sends no health line unless she opted in (off by default)', () => {
    const off = dashboardContext({ cycle, estimate: { day: '2026-11-10' }, ready: [sleepDown], products: [pad], insights: [{ text: 'Sleep dipped.', from: ['apple_health'] }] });
    expect(off).not.toMatch(/Cycle|Sleep|period|explained/i);
    expect(off).toContain('Products in her ecosystem');
  });

  it('passes her numbers as context once she opts in', () => {
    const ctx = dashboardContext({ cycle, ready: [sleepDown], products: [pad], allowHealth: true });
    expect(ctx).toContain('Cycle: day 7 of about 27 days');
    expect(ctx).toContain('1h 12m less than your usual');
  });

  it('never sends Oura or WHOOP data, even opted in', () => {
    const ctx = dashboardContext({
      cycle: { ...cycle, sources: ['oura'] },
      estimate: { day: '2026-11-10' },
      ready: [{ ...sleepDown, sources: ['apple_health', 'whoop'] }, { id: 'activity', title: 'Activity', headline: 'Steps', sources: ['apple_health'] }],
      insights: [{ text: 'HRV fell.', from: ['oura'] }, { text: 'You walked less.', from: ['apple_health'] }],
      allowHealth: true,
    });
    expect(ctx).not.toMatch(/Cycle|Next period|Sleep|HRV/);
    expect(ctx).toContain('You walked less.');
    expect(ctx).toContain('Activity: Steps');
  });
});

describe('For this phase', () => {
  it('picks ovulation tests in the follicular phase and nothing unrelated', () => {
    const groups = phasePicks({ cycle, products: [pad, cramps, fertility], today: '2026-10-20' });
    expect(groups).toHaveLength(1);
    expect(groups[0].products.map((p) => p.id)).toEqual(['f']);
  });

  it('picks period and cramp products when her period is near, hers before matches', () => {
    const groups = phasePicks({ cycle: { ...cycle, cycleDay: 24 }, estimate: { day: '2026-10-24' }, products: [cramps], matches: [pad], today: '2026-10-20' });
    expect(groups.map((g) => g.products[0].id)).toEqual(['p', 'c']);
  });

  it('hides the row when nothing fits', () => {
    expect(phasePicks({ cycle, products: [pad], today: '2026-10-20' })).toEqual([]);
  });
});

describe('Ask questions from "This week, explained"', () => {
  it('asks about the insights first, then her products, then her phase', async () => {
    const { weekQuestions } = await import('./dashboardAsk.js');
    const insights = [{ question: 'Why is my resting heart rate higher this week?' }, { question: 'Why have I been sleeping less this week?' }, { question: 'What does a temperature rise after ovulation mean?' }];
    expect(weekQuestions({ insights, ctx: { phase: { id: 'luteal' } }, picks: [{}] })).toEqual([
      'Why is my resting heart rate higher this week?', 'Why have I been sleeping less this week?', 'Which of my products fit this week?',
    ]);
    expect(weekQuestions({ insights: [], ctx: { phase: { id: 'luteal' } }, picks: [] })).toEqual(['What helps in the luteal phase?']);
    expect(weekQuestions({})).toEqual([]);
  });
});

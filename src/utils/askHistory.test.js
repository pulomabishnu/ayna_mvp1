import { describe, expect, it } from 'vitest';
import { answerHistoryQuestion, isHistoryQuestion } from './askHistory.js';

const T = '2026-10-24';
const tries = [
  { id: 'a', kind: 'product', ref: 'p-heat', need: 'pain.menstrual_cramp', startedDay: '2026-08-01', horizonDays: 28, outcome: 'helpful', recordedDay: '2026-09-01' },
  { id: 'b', kind: 'action', ref: 'Yoga before bed', need: 'sleep', startedDay: '2026-09-01', horizonDays: 56, outcome: 'no_change', recordedDay: '2026-10-20' },
  { id: 'c', kind: 'product', ref: 'p-mag', need: 'pain.menstrual_cramp', startedDay: '2026-10-10', horizonDays: 60, outcome: null },
];
const name = (id) => ({ 'p-heat': 'Heat wrap', 'p-mag': 'Magnesium' }[id] || null);

describe('askHistory', () => {
  it.each(['what helped last time?', 'What has worked for my cramps', "what have i tried for sleep", 'show my history'])('history question: %s', (q) => expect(isHistoryQuestion(q)).toBe(true));
  it.each(['what helps cramps', 'show me pads'])('not history: %s', (q) => expect(isHistoryQuestion(q)).toBe(false));

  it('nothing recorded: abstains, no guessing', () => {
    const out = answerHistoryQuestion('what helped last time', { tries: [], today: T });
    expect(out.answer).toMatch(/haven’t recorded anything/);
  });

  it('lists what she marked helpful, pending ones as too early, never a cause', () => {
    const out = answerHistoryQuestion('what helped my cramps last time', { tries, productName: name, today: T });
    expect(out.answer).toMatch(/Heat wrap, helpful on Sep 1/);
    expect(out.answer).toMatch(/Still too early to tell/);
    expect(out.answer).toMatch(/Magnesium: check back around Dec 9/);
    expect(out.answer).not.toMatch(/Yoga/);
    expect(out.answer).toMatch(/not proof/);
    expect(out.answer).not.toMatch(/—/);
  });

  it('topic with no match widens to everything and says so', () => {
    const out = answerHistoryQuestion('what worked for my skin', { tries, productName: name, today: T });
    expect(out.answer).toMatch(/Nothing you recorded matches that/);
    expect(out.answer).toMatch(/Yoga before bed for sleep, no change on Oct 20/);
  });
});

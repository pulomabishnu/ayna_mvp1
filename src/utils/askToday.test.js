import { afterEach, describe, expect, it } from 'vitest';
import { answerTodayQuestion, localTodayAnswer, setTodayAskContext, todayQuestionKind } from './askToday.js';

afterEach(() => setTodayAskContext(null));
const ctx = {
  today: '2026-10-24',
  signals: {},
  focus: [{ title: 'Did heat help?', reason: 'It is time to check how it went.' }],
  rundown: [{ category: 'change', title: 'Sleep may matter a little more today.', changed: 'Last night: 5h 40m, about 1h 20m less than your recent average of 7h 00m.', canDo: 'Go to bed and wake up at the same time.', explain: { kind: 'sleep', lastNight: 340, avg: 420, nights: 10 } }],
  log: { today: { pain: 2, sleep: 1 }, yesterday: { pain: 1, sleep: 1 } },
  recent: ['Pain was mostly mild this week, and moderate the week before.'],
};

describe('Ask about today, answered on this device', () => {
  it('recognises the Today questions only', () => {
    expect(todayQuestionKind('What should I focus on today?')).toBe('focus');
    expect(todayQuestionKind('Explain my Daily Rundown')).toBe('explain_rundown');
    expect(todayQuestionKind('What changed from yesterday?')).toBe('yesterday');
    expect(todayQuestionKind('What changed recently?')).toBe('recent');
    expect(todayQuestionKind('Why was my sleep flagged?')).toBe('flagged');
    expect(todayQuestionKind('What helps with cramps?')).toBeNull();
  });
  it('answers from her own data', async () => {
    setTodayAskContext(ctx);
    expect((await localTodayAnswer('What changed from yesterday?')).answer).toContain('- Pain: mild yesterday, moderate today.');
    expect(answerTodayQuestion('What should I focus on today?').answer).toContain('**Did heat help?**');
    expect(answerTodayQuestion('Explain my Daily Rundown').answer).toContain('Sleep may matter a little more today.');
    expect(answerTodayQuestion('Why was my sleep flagged?').answer).toMatch(/5h 40m.*7h 00m.*10 nights/);
    expect(answerTodayQuestion('What changed recently?').answer).toContain('Pain was mostly mild this week');
    expect(await localTodayAnswer('What helps with cramps?')).toBeNull();
  });
  it('abstains instead of guessing', () => {
    setTodayAskContext({ ...ctx, focus: [], rundown: [], log: { today: null, yesterday: null }, recent: [] });
    expect(answerTodayQuestion('What should I focus on today?').answer).toMatch(/^Nothing unusual stands out today/);
    expect(answerTodayQuestion('Explain my Daily Rundown').answer).toMatch(/empty today/);
    expect(answerTodayQuestion('What changed from yesterday?').answer).toMatch(/nothing to compare yet/);
    expect(answerTodayQuestion('Why was my sleep flagged?').answer).toMatch(/didn't flag sleep/);
    setTodayAskContext(null);
    expect(answerTodayQuestion('Explain my Daily Rundown').answer).toMatch(/doesn't have today's picture/);
  });
});

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

describe('QA M1: Ask why and Rundown questions answered on this device when signed out', async () => {
  const { localItemAnswer, answerItemQuestion } = await import('./askToday.js');
  const { askWhyFor } = await import('./askPrompts.js');
  const rich = {
    ...ctx,
    focus: [{ title: 'Your pain has been higher before your period', reason: 'In 3 of your last 4 cycles.', body: 'Heat and gentle movement can help.', sources: [{ label: 'MedlinePlus: Period pain', url: 'https://medlineplus.gov/periodpain.html' }] }],
    rundown: [
      { category: 'data', title: 'You slept less than usual.', explain: { kind: 'sleep', lastNight: 340, avg: 420, nights: 10 }, ask: 'Why might my sleep be shorter than usual?', followUps: ['Why was my sleep shorter last night?', 'What can I do about my energy today?'], canDo: 'Keep a steady bedtime tonight.' },
      { category: 'data', title: 'Last night: 7h 10m.', followUps: ['How much sleep do adults need?'] },
    ],
  };
  it('"Ask why" under a Today item answers from the item, with its reason and sources', async () => {
    setTodayAskContext(rich);
    const a = await localItemAnswer(askWhyFor('Your pain has been higher before your period'));
    expect(a.answer).toContain('In 3 of your last 4 cycles.');
    expect(a.answer).toContain('medlineplus.gov');
    expect(a.answer).toMatch(/not why/);
  });
  it('a Rundown card question answers from the card', async () => {
    setTodayAskContext(rich);
    expect((await localItemAnswer('Why was my sleep shorter last night?')).answer).toMatch(/5h 40m.*7h 00m/);
    expect((await localItemAnswer('What can I do about my energy today?')).answer).toContain('Keep a steady bedtime tonight.');
    expect((await localItemAnswer('Why might my sleep be shorter than usual?')).answer).toMatch(/5h 40m/);
  });
  it('general questions still need ayna AI; unknown facts are not invented', () => {
    setTodayAskContext(rich);
    expect(answerItemQuestion('How much sleep do adults need?')).toBeNull();
    expect(answerItemQuestion(askWhyFor('Something ayna never showed'))).toBeNull();
    expect(answerItemQuestion('What helps with cramps?')).toBeNull();
  });
});

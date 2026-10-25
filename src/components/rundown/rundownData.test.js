import { describe, expect, it } from 'vitest';
import { addDays } from '../../health/dailyLog.js';
import { buildRundown, RUNDOWN_RULES } from './buildRundown.js';
import { DATA_RULES, deltaCard, periodCard, periodStatus, sleepCard, stepsCard, stepsData, stepsMessage } from './rundownData.js';

const TODAY = '2026-10-24';
const d = (n) => addDays(TODAY, n);
/** A log with periods of `len` days starting `n` days ago (flow medium). */
function periods(starts, extra = {}) {
  const log = {};
  for (const [ago, len] of starts) for (let i = 0; i < len; i += 1) { const day = d(-ago + i); if (day <= TODAY) log[day] = { day, flow: 'medium' }; }
  for (const [day, e] of Object.entries(extra)) log[day] = { day, ...(log[day] || {}), ...e };
  return log;
}
const rows = (metric, values) => values.map((v, i) => (v == null ? null : { metric, day: d(-(values.length - 1 - i)), value: v, source: 'apple_health' })).filter(Boolean);
const noDash = (c) => expect(JSON.stringify(c)).not.toMatch(/—/);

describe('period card: enough data vs not', () => {
  it('no period logged: nothing, or "log your period" when she has a cycle goal', () => {
    expect(periodCard({ log: {}, today: TODAY })).toBeNull();
    expect(periodCard({ log: {}, today: TODAY, cycleNeed: true })).toMatchObject({ title: 'Log your period to get predictions.', empty: true });
  });
  it('day 3 with 3 earlier periods of 5 days: about 2 days left, based on her last 3', () => {
    const log = periods([[86, 5], [58, 5], [30, 5], [2, 3]]);
    const c = periodCard({ log, today: TODAY });
    expect(c).toMatchObject({ kind: 'period', title: 'Day 3 of your period.', body: 'About 2 days left, based on your last 3 periods.', left: 2, usual: 5 });
    expect(c.strip.map((t) => t.kind)).toEqual(['done', 'done', 'today', 'ahead', 'ahead']);
    expect(c.check).toBeUndefined();
    noDash(c);
  });
  it('fewer than 2 earlier periods: no "days left", asks her to log more', () => {
    const c = periodCard({ log: periods([[30, 5], [2, 3]]), today: TODAY });
    expect(c.title).toBe('Day 3 of your period.');
    expect(c.body).toBe('Log one more period and ayna can tell you about how many days are left.');
    expect(c.left).toBeNull();
  });
  it('longer than her usual, logged today: no question, and a follow-up about it', () => {
    const c = periodCard({ log: periods([[86, 5], [58, 5], [30, 5], [6, 7]]), today: TODAY });
    expect(c.title).toBe('Day 7 of your period.');
    expect(c.body).toBe('That is longer than your usual 5 days, based on your last 3 periods.');
    expect(c.followUps).toEqual(['Is a 7-day period normal for me?']);
  });
});

describe('"Are you still on your period?" check-in', () => {
  const base = [[86, 5], [58, 5], [30, 5]];
  it('only one day logged (yesterday): asks, with the three one-tap answers', () => {
    const c = periodCard({ log: periods([...base, [1, 1]]), today: TODAY });
    expect(c.title).toBe('Are you still on your period?');
    expect(c.check.options.map((o) => o.label)).toEqual(['Yes', 'No, ended yesterday', 'Not sure']);
    expect(c.body).toMatch(/^You have logged one day so far\./);
  });
  it('past the predicted end with today not logged: asks', () => {
    const c = periodCard({ log: periods([...base, [6, 6]]), today: TODAY });
    expect(c.check).toBeTruthy();
    expect(c.body).toMatch(/past your usual 5 days/);
  });
  it('a gap (last flow 2 days ago): asks; 4+ days ago: off her period', () => {
    expect(periodCard({ log: periods([...base, [4, 3]]), today: TODAY }).check).toBeTruthy();
    expect(periodStatus({ log: periods([...base, [7, 3]]), today: TODAY }).state).toBe('off');
  });
  it('yesterday logged on day 2 within her usual: no question', () => {
    const c = periodCard({ log: periods([...base, [2, 2]]), today: TODAY });
    expect(c.check).toBeUndefined();
    expect(c.title).toBe('Day 3 of your period.');
  });
  it('answers adjust the card: Yes asks how heavy, No shows the cycle, Not sure says maybe', () => {
    const log = periods([...base, [1, 1]]);
    const yes = periodCard({ log, today: TODAY, answer: 'yes' });
    expect(yes).toMatchObject({ title: 'Day 2 of your period.', key: `data:period:${TODAY}` });
    expect(yes.flowAsk.options.map((o) => o.value)).toEqual(['light', 'medium', 'heavy']);
    const unsure = periodCard({ log, today: TODAY, answer: 'unsure' });
    expect(unsure.title).toBe('Maybe day 2 of your period.');
    expect(unsure.check).toBeUndefined();
    // "No, ended yesterday" is saved to the log as flow "none" today.
    const ended = periodCard({ log: { ...log, [TODAY]: { day: TODAY, flow: 'none' } }, today: TODAY, answer: 'ended' });
    expect(ended.kind).toBe('cycle');
    expect(ended.key).toBe(yes.key); // same card, so the story stays on it
    expect(ended.body).toMatch(/^Your period lasted 1 day\./);
  });
  it('a flow logged today ends the question for good', () => {
    const c = periodCard({ log: periods([...base, [1, 1]], { [TODAY]: { flow: 'light' } }), today: TODAY });
    expect(c.check).toBeUndefined();
    expect(c.title).toBe('Day 2 of your period.');
  });
});

describe('cycle phase when off her period (an estimate)', () => {
  it('with 2+ cycles: cycle day, phase name, .gov sources, days to next', () => {
    const c = periodCard({ log: periods([[84, 5], [56, 5], [28, 5]]), today: TODAY });
    expect(c.kind).toBe('cycle');
    expect(c.title).toMatch(/^Cycle day 29\./);
    expect(c.kicker).toBe('Your cycle, an estimate');
    expect(c.sources.every((s) => /\.gov\//.test(s.url))).toBe(true);
    expect(c.basisLine).toMatch(/estimate/);
  });
  it('mid-cycle: "Probably before ovulation" / possible ovulation days, never one day', () => {
    const c = periodCard({ log: periods([[89, 5], [61, 5], [33, 5], [10, 5]]), today: TODAY });
    expect(c.title).toBe('Cycle day 11. In your possible ovulation days.');
    expect(c.phase.windowStart).toBeLessThan(c.phase.windowEnd);
  });
  it('one period only, or hormonal birth control: cycle day without a phase', () => {
    const one = periodCard({ log: periods([[14, 5]]), today: TODAY });
    expect(one.title).toBe('Cycle day 15.');
    expect(one.phase).toBeUndefined();
    expect(periodCard({ log: periods([[84, 5], [56, 5], [28, 5]]), today: TODAY, hormonalBC: true }).phase).toBeUndefined();
  });
  it('after menopause or in pregnancy: no period or cycle card', () => {
    expect(periodCard({ log: periods([[2, 3]]), today: TODAY, quiet: true })).toBeNull();
  });
});

describe('sleep card', () => {
  it('fewer than 7 nights: the hours and how many nights so far, no comparison', () => {
    const c = sleepCard(rows('sleep_minutes', [420, 400, 430, 380]), TODAY);
    expect(c).toMatchObject({ learning: true, title: 'You slept 6h 20m.' });
    expect(c.body).toMatch(/after 7 nights \(3 so far\)/);
  });
  it('short, close and long against her own usual', () => {
    const usual = Array(10).fill(420);
    expect(sleepCard(rows('sleep_minutes', [...usual, 330]), TODAY).title).toBe('You slept 5h 30m, about 1h 30m less than usual.');
    expect(sleepCard(rows('sleep_minutes', [...usual, 400]), TODAY).title).toBe('You slept 6h 40m, close to your usual.');
    expect(sleepCard(rows('sleep_minutes', [...usual, 500]), TODAY).followUps).toEqual(['Why did I sleep longer last night?']);
    expect(sleepCard(rows('sleep_minutes', [...usual, 330]), TODAY).followUps[0]).toBe('Why was my sleep shorter last night?');
  });
  it('no sleep data: no card', () => { expect(sleepCard([], TODAY)).toBeNull(); });
});

describe('steps card: message from her own baseline', () => {
  // 20 days of history, then yesterday, then today so far.
  const withYesterday = (usual, y) => rows('steps', [...Array(20).fill(usual), y, 900]);
  it('the same 5,000 steps is "great" for one person and "move a little more" for another', () => {
    expect(stepsCard(withYesterday(4000, 5000), TODAY).title).toBe('You did great, keep it up.');
    expect(stepsCard(withYesterday(9000, 5000), TODAY).title).toBe('Move a little more today.');
  });
  it('thresholds: at or above usual, 80 to 100%, under 80%', () => {
    expect(stepsMessage(stepsData(withYesterday(5000, 5000), TODAY)).level).toBe('good');
    expect(stepsMessage(stepsData(withYesterday(5000, 4000), TODAY)).level).toBe('steady');
    expect(stepsMessage(stepsData(withYesterday(5000, 3990), TODAY)).level).toBe('low');
    expect(DATA_RULES.stepsLow).toBe(0.8);
  });
  it('gentle on a period day or with pain', () => {
    expect(stepsCard(withYesterday(9000, 3000), TODAY, { gentle: true }).title).toBe('Take it at your own pace today.');
  });
  it('the chart: 7 days, today marked so far, her usual; under 10 days of history: learning, no judgement', () => {
    const c = stepsCard(withYesterday(5000, 6000), TODAY);
    expect(c.week).toHaveLength(7);
    expect(c.week.at(-1)).toMatchObject({ day: TODAY, today: true, value: 900 });
    expect(Math.round(c.usual)).toBe(5000);
    const early = stepsCard(rows('steps', [5000, 5000, 5000, 6000, 900]), TODAY);
    expect(early).toMatchObject({ learning: true, title: 'Your steps this week.' });
    expect(early.body).toMatch(/after 10 days of steps \(3 so far\)/);
  });
  it('no steps at all: no card', () => { expect(stepsCard(rows('sleep_minutes', [400]), TODAY)).toBeNull(); });
});

describe('since yesterday', () => {
  it('needs two comparisons; shows the change with a direction', () => {
    expect(deltaCard(rows('sleep_minutes', [400, 430]), TODAY)).toBeNull();
    const c = deltaCard([...rows('sleep_minutes', [400, 430]), ...rows('steps', [3000, 6000, 100])], TODAY);
    expect(c.deltas).toEqual([
      expect.objectContaining({ id: 'sleep', change: '+0h 30m', dir: 'up' }),
      expect.objectContaining({ id: 'steps', change: '+3,000', dir: 'up' }),
    ]);
  });
});

describe('in the rundown', () => {
  const healthRows = [...rows('sleep_minutes', [...Array(10).fill(420), 330]), ...rows('steps', [...Array(20).fill(6000), 3000, 500])];
  const log = periods([[86, 5], [58, 5], [30, 5], [2, 3]]);
  it('safety first, then her data, then the rest; follow-ups reference what she saw', () => {
    const decision = { items: [{ id: 'care:x', tier: 'care', level: 'prompt', title: 'Get this checked', body: 'b' }, { id: 'fu:1', type: 'follow_up', title: 'How did heat go?' }] };
    const r = buildRundown({ today: TODAY, decision, log, healthRows });
    const content = r.cards.slice(1, -1);
    expect(content.map((c) => c.category).slice(0, 6)).toEqual(['safety', 'data', 'data', 'data', 'data', 'goal']);
    expect(content.slice(1, 5).map((c) => c.kind)).toEqual(['period', 'sleep', 'steps', 'delta']);
    expect(r.cards.at(-1).followUps.map((f) => f.question)).toEqual(['What should I tell my clinician?', 'What can help on day 3 of my period?', 'Why was my sleep shorter last night?']);
    noDash(r.cards);
  });
  it('the period answer in memory rebuilds the rundown', () => {
    const asking = periods([[86, 5], [58, 5], [30, 5], [1, 1]]);
    const a = buildRundown({ today: TODAY, log: asking, healthRows });
    expect(a.cards.find((c) => c.kind === 'period').check).toBeTruthy();
    const b = buildRundown({ today: TODAY, log: asking, healthRows, memory: { periodAnswers: { [TODAY]: 'yes' } } });
    expect(b.cards.find((c) => c.kind === 'period').title).toBe('Day 2 of your period.');
    // On her period now, so a low steps day reads gently.
    expect(b.cards.find((c) => c.kind === 'steps').title).toBe('Take it at your own pace today.');
  });
  it('at most 4 data cards', () => {
    const many = [...healthRows, ...rows('resting_hr_bpm', [...Array(14).fill(0).map((_, i) => 58 + (i % 2)), 59]), ...rows('steps', [])];
    const r = buildRundown({ today: TODAY, log, healthRows: many });
    expect(r.cards.filter((c) => c.category === 'data').length).toBeLessThanOrEqual(RUNDOWN_RULES.maxDataCards);
  });
});

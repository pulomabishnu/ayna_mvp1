import { describe, expect, it } from 'vitest';
import { buildRundown, sleepChange, cyclePosition, RUNDOWN_RULES } from './buildRundown.js';
import { buildWeeklyRecap } from './weeklyRecap.js';
import { buildTodayState } from '../../health/todayState.js';
import { decide } from '../../health/decisionEngine.js';
import { makeTodayFixture } from '../../health/todayDevFixture.js';
import { addDays } from '../../health/dailyLog.js';

const TODAY = '2026-10-24';
const fromFixture = (scenario = 'today', extra = {}) => {
  const fx = makeTodayFixture(scenario, TODAY);
  const state = buildTodayState({ today: TODAY, log: fx.log, tries: fx.tries, intake: fx.intake });
  const decision = decide(state);
  return { today: TODAY, decision, patterns: state.patterns, log: fx.log, tries: fx.tries, ...extra };
};
const cats = (r) => r.cards.map((c) => c.category);

describe('Daily Rundown', () => {
  it('no data: no rundown at all (no card just because the feature exists)', () => {
    const log = { [TODAY]: { day: TODAY, pain: 0, flow: 'none', pms: 0, sleep: 2, mood: 2, skin: 2 } };
    expect(buildRundown({ today: TODAY, log, decision: decide(buildTodayState({ today: TODAY, log })) }).cards).toEqual([]);
    const r = buildRundown({ today: TODAY, decision: decide(buildTodayState({ today: TODAY })) });
    expect(r.cards).toEqual([]);
  });

  it('real data: opening, cards in priority order, closing', () => {
    const r = buildRundown(fromFixture());
    expect(r.cards[0].kind).toBe('opening');
    expect(r.cards.at(-1).kind).toBe('closing');
    const content = cats(r).slice(1, -1);
    expect(content[0]).toBe('goal'); // the due follow-up
    expect(content).toContain('pattern');
    const ranks = { goal: 2, change: 3, symptom: 4, pattern: 5, win: 10 };
    expect(content.map((c) => ranks[c])).toEqual([...content.map((c) => ranks[c])].sort((a, b) => a - b));
    expect(r.cards.find((c) => c.category === 'pattern').title).toMatch(/may be coming up to the days before your period/);
  });

  it('safety and care always come first and are never hidden by Not useful or rotation', () => {
    const input = fromFixture('today-care');
    const memory = { notUseful: { 'category:safety': { until: '2027-01-01' }, 'key:care:pain_today': { until: '2027-01-01' } }, shownCategories: { [addDays(TODAY, -1)]: ['safety'] } };
    const r = buildRundown({ ...input, memory });
    expect(r.cards[1]).toMatchObject({ category: 'safety', key: 'care:pain_today', protected: true });
  });

  it('no product next to care', () => {
    const product = { id: 'p-thermacare', name: 'ThermaCare' };
    const r = buildRundown({ ...fromFixture('today-care'), matches: [{ product, percent: 90, needId: 'pain.menstrual_cramp', why: 'For your period cramps' }] });
    expect(cats(r)).not.toContain('match');
  });

  it('match card only for a need she has now and 50 or more', () => {
    const product = { id: 'p-thermacare', name: 'ThermaCare' };
    const base = fromFixture();
    expect(cats(buildRundown({ ...base, matches: [{ product, percent: 90, needId: 'pain.menstrual_cramp' }] }))).toContain('match');
    expect(cats(buildRundown({ ...base, matches: [{ product, percent: 45, needId: 'pain.menstrual_cramp' }] }))).not.toContain('match');
    expect(cats(buildRundown({ ...base, matches: [{ product, percent: 90, needId: 'uti.recurrent' }] }))).not.toContain('match');
  });

  it('Not useful hides the card or the whole type; rotation skips yesterday\'s extras', () => {
    const base = fromFixture();
    const pattern = buildRundown(base).cards.find((c) => c.category === 'pattern');
    expect(buildRundown({ ...base, memory: { notUseful: { [`key:${pattern.key}`]: { until: '2026-11-01' } } } }).cards.some((c) => c.key === pattern.key)).toBe(false);
    expect(cats(buildRundown({ ...base, memory: { notUseful: { 'category:pattern': { until: '2027-01-01' } } } }))).not.toContain('pattern');
    const product = { id: 'p1', name: 'P' };
    const withMatch = { ...base, matches: [{ product, percent: 90, needId: 'pain.menstrual_cramp' }] };
    expect(cats(buildRundown({ ...withMatch, memory: { shownCategories: { [addDays(TODAY, -1)]: ['match'] } } }))).not.toContain('match');
  });

  it('never more than the content cap (safety excepted)', () => {
    const r = buildRundown({ ...fromFixture(), matches: [{ product: { id: 'p1', name: 'P' }, percent: 90, needId: 'pain.menstrual_cramp' }], saved: [{ id: 's1', name: 'S' }], reads: true, community: [{ id: 'c1', title: 'Heat or ibuprofen first?', count: 12 }] });
    expect(r.cards.length - 2).toBeLessThanOrEqual(RUNDOWN_RULES.maxContentCards);
  });

  it('sleep change uses only connected rows and needs a real drop', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ metric: 'sleep_minutes', day: addDays(TODAY, -(i + 1)), value: 420 }));
    expect(sleepChange([...rows, { metric: 'sleep_minutes', day: TODAY, value: 340 }], TODAY).diff).toBe(-80);
    const r = buildRundown({ ...fromFixture(), healthRows: [...rows, { metric: 'sleep_minutes', day: TODAY, value: 340 }] });
    expect(r.cards.find((c) => c.category === 'change')).toMatchObject({ title: 'Sleep may matter a little more today.', facts: [{ k: 'Recent average', v: '7h 00m' }, { k: 'Last night', v: '5h 40m' }] });
    expect(buildRundown({ ...fromFixture(), healthRows: [...rows, { metric: 'sleep_minutes', day: TODAY, value: 400 }] }).cards.some((c) => c.key.startsWith('change:sleep'))).toBe(false);
  });

  it('cycle position from her own period logs', () => {
    expect(cyclePosition(makeTodayFixture('today', TODAY).log, TODAY)).toMatchObject({ cycleDay: 27, avgLength: 28, daysToNext: 2 });
  });

  it('no em dashes and no invented percent in any card', () => {
    const text = JSON.stringify(buildRundown({ ...fromFixture(), reads: true }).cards.map(({ title, body, basisLine, kicker }) => ({ title, body, basisLine, kicker })));
    expect(text).not.toMatch(/—/);
    expect(text).not.toMatch(/\d+%/);
  });
});

describe('Your week on ayna', () => {
  it('only with enough logged days; counts and plain changes, no scoring', () => {
    expect(buildWeeklyRecap({ today: TODAY, log: {} }).cards).toEqual([]);
    const log = {};
    for (let i = 0; i < 14; i += 1) { const d = addDays(TODAY, -i); log[d] = { day: d, pain: i < 7 ? 1 : 2, sleep: 2 }; }
    const r = buildWeeklyRecap({ today: TODAY, log, tries: [{ id: 't', startedDay: addDays(TODAY, -2), recordedDay: TODAY, outcome: 'worse' }], patterns: [{ id: 'p' }] });
    const text = JSON.stringify(r.cards);
    expect(r.cards[0].title).toBe('Your week on ayna');
    expect(text).toContain('Pain was mostly mild this week, and moderate the week before.');
    expect(text).toContain('told ayna how 1 thing went');
    expect(text).not.toMatch(/worse|fail|goal|streak|—/i);
  });
});

describe('Rundown weighted to last night and recent context (data -> action)', () => {
  const rowsFor = (metric, base, last, days = 14) => [
    ...Array.from({ length: days }, (_, i) => ({ metric, day: addDays(TODAY, -(i + 1)), value: base + (i % 2 ? 1 : -1) })),
    { metric, day: TODAY, value: last },
  ];
  it('sleep card says what changed, what it may affect, what you can do, with .gov sources and See data', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ metric: 'sleep_minutes', day: addDays(TODAY, -(i + 1)), value: 420 }));
    const c = buildRundown({ ...fromFixture(), healthRows: [...rows, { metric: 'sleep_minutes', day: TODAY, value: 340 }] }).cards.find((x) => x.category === 'change');
    expect(c.changed).toBe('Last night: 5h 40m, about 1h 20m less than your recent average of 7h 00m.');
    expect(c.mayAffect).toMatch(/focus/);
    expect(c.canDo).toMatch(/same time/);
    expect(c.sources.every((s) => /\.gov\//.test(s.url))).toBe(true);
    expect(c.seeData).toEqual({ tab: 'sleep' });
  });
  it('recovery signal below her own range: a card, no claimed meaning', () => {
    const r = buildRundown({ ...fromFixture(), healthRows: rowsFor('hrv_rmssd_ms', 50, 30) });
    const c = r.cards.find((x) => x.key.startsWith('change:hrv_rmssd_ms'));
    expect(c.title).toBe('Your recovery signal is lower than your recent range.');
    expect(c.mayAffect).toBeUndefined();
    expect(c.seeData).toEqual({ tab: 'heart' });
    expect(buildRundown({ ...fromFixture(), healthRows: rowsFor('hrv_rmssd_ms', 50, 50) }).cards.some((x) => x.key.startsWith('change:hrv'))).toBe(false);
  });
  it('yesterday clearly off her usual check-in', () => {
    const log = {};
    for (let i = 2; i < 20; i += 1) { const d = addDays(TODAY, -i); log[d] = { day: d, pain: 0 }; }
    log[addDays(TODAY, -1)] = { day: addDays(TODAY, -1), pain: 2 };
    const r = buildRundown({ ...fromFixture(), log: { ...fromFixture().log, ...log } });
    expect(r.cards.find((x) => x.key.startsWith('change:log:pain'))?.title).toBe('Yesterday your pain was moderate.');
  });
  it('routine progress for something she is trying, and the closing card offers Ask follow-ups about what she saw', () => {
    const tries = [{ id: 'r1', kind: 'action', ref: 'movement', startedDay: addDays(TODAY, -11), horizonDays: 56, status: 'pending', outcome: null }];
    const r = buildRundown({ ...fromFixture(), tries });
    expect(r.cards.find((x) => x.key === 'goal:progress:r1').title).toBe('Day 12 of trying gentle movement.');
    const closing = r.cards.at(-1);
    expect(closing.followUps.length).toBeGreaterThan(0);
    expect(closing.followUps.length).toBeLessThanOrEqual(3);
    expect(closing.followUps.map((f) => f.question)).toContain('Does this change my routine?');
  });
});

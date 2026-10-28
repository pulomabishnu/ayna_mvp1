// End to end: connected health rows -> insights -> match context -> Health Match.
// Verifies the backend processing of the data connection (team sync, Oct 18).
import { describe, it, expect } from 'vitest';
import { buildInsights } from './insights.js';
import { healthMatchContext } from './matchContext.js';
import { getSelectedNeeds, getEcosystemSeedFromQuiz } from '../data/products.js';
import { buildUserProfile } from '../matching/userProfile.js';

const TODAY = '2026-10-18';
const dayBack = (n) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - n * 86400000).toISOString().slice(0, 10);
// 28 usual nights of 8h, then 7 recent nights of 6h (a real shorter-sleep trend).
const sleepRows = (recentMin = 360) => Array.from({ length: 35 }, (_, i) => ({
  metric: 'sleep_minutes', day: dayBack(i), value: i < 7 ? recentMin : 480, unit: 'min', source: 'oura', origin: 'oura', method: 'observed',
}));

const quiz = (support) => ({ personalizationCompleted: true, age: 28, lifeStageSelections: ['I have regular periods'], supportSelections: support });

describe('health data reaches Health Match', () => {
  it('a shorter-sleep trend produces a sleep signal', () => {
    const { signals } = buildInsights(sleepRows(), { today: TODAY });
    expect(signals.map((s) => s.needId)).toContain('sleep.trouble');
  });

  it('no signal when sleep is steady', () => {
    const { signals } = buildInsights(sleepRows(480), { today: TODAY });
    expect(signals).toEqual([]);
  });

  it('strengthens a need she chose, and only suggests one she did not', () => {
    const { signals } = buildInsights(sleepRows(), { today: TODAY });
    const chose = healthMatchContext(signals, ['sleep.trouble', 'cycle.cramps']);
    expect(Object.keys(chose.byNeed)).toEqual(['sleep.trouble']);
    expect(chose.suggestions).toEqual([]);
    const didNot = healthMatchContext(signals, ['cycle.cramps']);
    expect(didNot.byNeed).toEqual({});
    expect(didNot.suggestions.map((s) => s.needId)).toEqual(['sleep.trouble']);
  });

  it('the need ids line up with the needs the quiz produces', () => {
    const needs = getSelectedNeeds(quiz(['Trouble sleeping', 'Cramps or period pain'])).map((n) => n.id);
    expect(needs).toContain('sleep.trouble');
  });

  it('buildUserProfile marks the chosen need corroborated and never adds a need', () => {
    const { signals } = buildInsights(sleepRows(), { today: TODAY });
    const q = quiz(['Trouble sleeping', 'Cramps or period pain']);
    const ids = getSelectedNeeds(q).map((n) => n.id);
    const ctx = healthMatchContext(signals, ids);
    const without = getSelectedNeeds(q).map((n) => n.id);
    const withCtx = getSelectedNeeds(q, null, { healthContext: ctx }).map((n) => n.id);
    expect(withCtx).toEqual(without);
    const up = buildUserProfile({ supportSelections: q.supportSelections, lifeStageSelections: q.lifeStageSelections, age: q.age }, { healthContext: ctx });
    const sleep = up.healthIntent.needs.find((n) => n.id === 'sleep.trouble');
    expect(sleep).toBeTruthy();
    expect(sleep.corroborated).toBe(true);
    expect(up.healthIntent.needs.filter((n) => n.corroborated).map((n) => n.id)).toEqual(['sleep.trouble']);
  });

  it('an unrelated trend leaves the ecosystem unchanged', () => {
    const q = quiz(['Cramps or period pain', 'Heavy periods']);
    const { signals } = buildInsights(sleepRows(), { today: TODAY });
    const ctx = healthMatchContext(signals, getSelectedNeeds(q).map((n) => n.id));
    const a = getEcosystemSeedFromQuiz(q).shelves.map((s) => s.productIds);
    const b = getEcosystemSeedFromQuiz(q, null, { healthContext: ctx }).shelves.map((s) => s.productIds);
    expect(b).toEqual(a);
  });

  it('a supporting trend still returns a full, valid ecosystem', () => {
    const q = quiz(['Trouble sleeping', 'Cramps or period pain']);
    const { signals } = buildInsights(sleepRows(), { today: TODAY });
    const ctx = healthMatchContext(signals, getSelectedNeeds(q).map((n) => n.id));
    const seed = getEcosystemSeedFromQuiz(q, null, { healthContext: ctx });
    expect(seed.shelves.length).toBeGreaterThan(0);
    expect(seed.shelves.map((s) => s.needId)).toContain('sleep.trouble');
  });
});

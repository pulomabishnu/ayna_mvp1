import { describe, expect, it } from 'vitest';
import { applyTodayAnswers, buildTodayState, daysLogged, profileFromIntake } from './todayState.js';
import { decide } from './decisionEngine.js';
import { makeTodayFixture } from './todayDevFixture.js';
import { safetyContextFrom } from './interventions.js';
import { readToday, setTodayOwner, writeToday } from './todayStore.js';

const TODAY = '2026-10-24';

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

describe('buildTodayState', () => {
  it('real-shaped data gives a cross-cycle insight and a due follow-up first', () => {
    const fx = makeTodayFixture('today', TODAY);
    const d = decide(buildTodayState({ today: TODAY, log: fx.log, tries: fx.tries, intake: fx.intake }));
    expect(d.items[0]).toMatchObject({ type: 'follow_up', title: 'Did heat help?' });
    expect(d.items.some((i) => i.type === 'insight' && /Sleep/.test(i.title))).toBe(true);
    expect(d.items.length).toBeLessThanOrEqual(3);
  });
  it('a severe pain day leads with care', () => {
    const fx = makeTodayFixture('today-care', TODAY);
    expect(decide(buildTodayState({ today: TODAY, log: fx.log, tries: fx.tries, intake: fx.intake })).items[0].id).toBe('care:pain_today');
  });
  it('pain in pregnancy asks the triage questions first', () => {
    const fx = makeTodayFixture('today-pregnant', TODAY);
    expect(decide(buildTodayState({ today: TODAY, log: fx.log, intake: fx.intake })).items[0].id).toBe('ask:pregnancy_triage');
  });
  it('triage only counts for today', () => {
    const s = buildTodayState({ today: TODAY, store: { triage: { day: '2026-10-23', severity: 'mild' } } });
    expect(s.triage).toBeNull();
  });
  it('no data: a check-in', () => {
    expect(decide(buildTodayState({ today: TODAY })).items.map((i) => i.type)).toEqual(['check_in']);
  });
  it('counts logged days', () => {
    expect(daysLogged({ a: { pain: null }, b: { pain: 0 } })).toBe(1);
  });
});

describe('Today answers fill only unknowns, never as safe', () => {
  it('pregnancy no / not sure / yes', () => {
    expect(safetyContextFrom(applyTodayAnswers(null, { pregnancy: 'no' })).pregnancy).toBe('not_indicated');
    expect(safetyContextFrom(applyTodayAnswers(null, { pregnancy: 'not_sure' })).pregnancy).toBe('reported');
    expect(safetyContextFrom(applyTodayAnswers(null, { pregnancy: 'yes' })).pregnancy).toBe('pregnant');
  });
  it('never overwrites an intake answer', () => {
    const p = profileFromIntake({ lifeStageSelections: ['I am pregnant'], lifeStage: 'I am pregnant' });
    expect(safetyContextFrom(applyTodayAnswers(p, { pregnancy: 'no' })).pregnancy).toBe('pregnant');
  });
  it('medicines none, allergies no', () => {
    const ctx = safetyContextFrom(applyTodayAnswers(null, { medications: 'none', allergies: 'no', conditions: 'none' }));
    expect([ctx.medicationsState, ctx.allergyStatus, ctx.conditionsState]).toEqual(['explicit_no', 'no', 'explicit_no']);
  });
});

describe('todayStore', () => {
  it('per owner: signed-out memory folds into her account and is not seen by another', () => {
    const st = memStorage();
    setTodayOwner(null, st);
    writeToday('dismissed', { 'insight:x': { day: TODAY, until: '2026-11-23' } }, st);
    setTodayOwner('u1', st);
    expect(readToday(st).dismissed).toHaveProperty('insight:x');
    setTodayOwner('u2', st);
    expect(readToday(st).dismissed).toEqual({});
    setTodayOwner('u1', st);
    expect(readToday(st).dismissed).toHaveProperty('insight:x');
  });
});

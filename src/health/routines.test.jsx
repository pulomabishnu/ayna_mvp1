import { describe, expect, it, beforeEach } from 'vitest';
import { buildRoutines, changeRoutine, readRoutinePrefs, routineProducts, START_MAX, keyFor } from './routines.js';
import { rememberedProducts, withoutRemembered, rememberedOnDevice } from './remembered.js';
import { HORIZONS } from './outcomes.js';

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

const heatPad = { id: 'p-heat-a', name: 'Heat pad A', category: 'cramp-relief', tags: ['cramps'], howToUse: { steps: ['Wash your hands.', 'Place it on your lower belly.'], sourceLabel: 'Brand site' } };
const heatPad2 = { id: 'p-heat-b', name: 'Heat pad B', category: 'cramp-relief', tags: ['cramps'] };
const advil = { id: 'p-advil', name: 'Advil', category: 'medication', type: 'physical', tags: ['cramps'] };
const sleepThing = { id: 'p-sleep', name: 'Sleep mask', category: 'sleep', tags: ['sleep'] };
const catalog = [heatPad, heatPad2, advil, sleepThing];
const notPregnant = { safety: { pregnancyStatus: 'not_indicated', medicationsState: 'explicit_no', conditionsState: 'explicit_no', allergyStatus: 'no', breastfeeding: 'no', medications: [], conditions: [], allergies: [] }, physiology: { lifeStages: [] } };

describe('buildRoutines', () => {
  it('a period-pain routine: Start here is an option and a product, each with why, when, how long, how you will know', () => {
    const [r] = buildRoutines({ needs: ['period_pain'], profile: notPregnant, catalog });
    expect(r.title).toBe('Your period-pain routine');
    expect(r.start.length).toBeGreaterThan(0);
    expect(r.start.length).toBeLessThanOrEqual(START_MAX);
    const heat = r.start.find((x) => x.key === 'class:heat');
    expect(heat.when).toBe('When cramps start');
    expect(heat.horizon.label).toBe(HORIZONS.pain_relief.label);
    expect(heat.know).toMatch(/daily check-in/);
    const product = r.start.find((x) => x.kind === 'product');
    expect(product.ref).toBe('p-heat-a');
    expect(product.how).toBe('Place it on your lower belly.');
    expect(r.track.field).toBe('pain');
    expect(r.other.some((x) => x.ref === 'p-heat-b')).toBe(true);
  });

  it('never offers a medicine as a product, and medicines never lead', () => {
    const [r] = buildRoutines({ needs: ['period_pain'], profile: notPregnant, catalog });
    expect([...r.start, ...r.other].some((x) => x.ref === 'p-advil')).toBe(false);
    expect(r.start.some((x) => x.informationOnly)).toBe(false);
  });

  it('with an unknown profile, NSAIDs are held back (ask first)', () => {
    const [r] = buildRoutines({ needs: ['period_pain'], profile: null, catalog });
    expect([...r.start, ...r.other].some((x) => x.ref === 'nsaid_pain_relief')).toBe(false);
  });

  it('no routine for pain in pregnancy', () => {
    expect(buildRoutines({ needs: ['pregnancy_pain'], profile: notPregnant, catalog })).toEqual([]);
  });

  it('a product she said did not help leaves Start here and is listed as tried', () => {
    const tries = [{ id: 'x', kind: 'product', ref: 'p-heat-a', need: 'period_pain', startedDay: '2026-09-01', horizonDays: 28, outcome: 'no_change', updatedAt: '2026-10-01T00:00:00Z' }];
    const [r] = buildRoutines({ needs: ['period_pain'], profile: notPregnant, catalog, tries });
    expect(r.start.some((x) => x.ref === 'p-heat-a')).toBe(false);
    expect(r.tried.some((x) => x.ref === 'p-heat-a')).toBe(true);
  });

  it('the engine ranks products; one already in her routine leads', () => {
    const detailsFor = (p) => ({ matchStatus: 'scored', percent: p.id === 'p-heat-b' ? 90 : 60, reasonDetails: [] });
    const ranked = routineProducts('period_pain', { catalog, detailsFor });
    expect(ranked[0].product.id).toBe('p-heat-b');
    const owned = routineProducts('period_pain', { catalog, detailsFor, inRoutine: { 'p-heat-a': true } });
    expect(owned[0].product.id).toBe('p-heat-a');
  });
});

describe('changeRoutine', () => {
  let storage;
  beforeEach(() => { storage = memStorage(); });
  const build = () => buildRoutines({ needs: ['period_pain'], profile: notPregnant, catalog, prefs: readRoutinePrefs(storage) })[0];

  it('add, remove, replace, postpone, save for later, not for me, restore', () => {
    let p = readRoutinePrefs(storage);
    p = changeRoutine(p, { op: 'add', need: 'period_pain', key: keyFor('product', 'p-heat-b') }, storage);
    expect(build().start.some((x) => x.ref === 'p-heat-b')).toBe(true);
    p = changeRoutine(p, { op: 'remove', need: 'period_pain', key: 'class:heat' }, storage);
    expect(build().start.some((x) => x.key === 'class:heat')).toBe(false);
    expect(build().other.some((x) => x.key === 'class:heat')).toBe(true);
    p = changeRoutine(p, { op: 'replace', need: 'period_pain', key: 'product:p-heat-b', with: 'class:movement' }, storage);
    expect(build().start.some((x) => x.key === 'class:movement')).toBe(true);
    p = changeRoutine(p, { op: 'postpone', need: 'period_pain', key: 'class:movement', days: 7, today: '2026-10-24' }, storage);
    expect(build().postponed.some((x) => x.key === 'class:movement')).toBe(true);
    p = changeRoutine(p, { op: 'notForMe', need: 'period_pain', key: 'product:p-heat-a', today: '2026-10-24' }, storage);
    expect([...build().start, ...build().other].some((x) => x.ref === 'p-heat-a')).toBe(false);
    p = changeRoutine(p, { op: 'restore', need: 'period_pain', key: 'product:p-heat-a' }, storage);
    expect(build().notForMe.length).toBe(0);
    changeRoutine(p, { op: 'later', need: 'period_pain', key: 'product:p-heat-b' }, storage);
    expect(build().later.some((x) => x.ref === 'p-heat-b')).toBe(true);
  });

  it('Start here holds three', () => {
    let p = readRoutinePrefs(storage);
    for (const k of ['class:movement', 'product:p-heat-b', 'product:p-heat-a']) p = changeRoutine(p, { op: 'add', need: 'period_pain', key: k }, storage);
    expect(p.needs.period_pain.added.length).toBe(3);
    const r = build();
    expect(r.start.length).toBe(START_MAX);
    expect(r.full).toBe(true);
    const again = changeRoutine({ ...p, needs: { period_pain: { added: ['a', 'b', 'c'], removed: [], postponed: {}, later: {} } } }, { op: 'add', need: 'period_pain', key: 'd' }, storage);
    expect(again.error).toBe('full');
  });
});

describe('remembered', () => {
  it('have, not for me, did not help, saved and in routine are each remembered once', () => {
    const tries = [{ kind: 'product', ref: 'b', outcome: 'worse', updatedAt: '2026-10-01' }, { kind: 'product', ref: 'h', outcome: 'helpful', updatedAt: '2026-10-01' }];
    const m = rememberedProducts({ have: { a: true }, notForMe: { n: '2026-10-01' }, tries, saved: { s: {} }, inRoutine: { r: {} } });
    expect(m.get('a')).toBe('have');
    expect(m.get('n')).toBe('not_for_me');
    expect(m.get('b')).toBe('didnt_help');
    expect(m.get('h')).toBeUndefined();
    expect(m.get('s')).toBe('saved');
    expect(m.get('r')).toBe('in_routine');
    expect(withoutRemembered([{ id: 'a' }, { id: 'z' }, { id: 'r' }], m, { keep: ['in_routine'] }).map((x) => x.id)).toEqual(['z', 'r']);
  });
  it('reads routine changes from the device prefs', () => {
    const m = rememberedOnDevice({ prefs: { owned: { a: true }, notForMe: { 'product:n': '2026-10-01', 'class:heat': '2026-10-01' } } });
    expect(m.get('a')).toBe('have');
    expect(m.get('n')).toBe('not_for_me');
    expect(m.has('heat')).toBe(false);
  });
});

describe('QA M3: auto-built picks are suggestions, not hers', async () => {
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: NeedRoutines } = await import('../components/routine/NeedRoutines.jsx');
  const items = (inRoutine, prefs = {}) => { const [r] = buildRoutines({ needs: ['period_pain'], profile: notPregnant, catalog, inRoutine, prefs }); return [...r.start, ...r.other].filter((x) => x.kind === 'product'); };
  it('a quiz-seeded pick is "suggested", not owned', () => {
    const a = items({ 'p-heat-a': { ...heatPad, intakeGenerated: true } }).find((x) => x.ref === 'p-heat-a');
    expect(a.owned).toBe(false);
    expect(a.suggested).toBe(true);
    expect(a.inRoutine).toBe(true);
  });
  it('one she added, or marked as hers, is owned', () => {
    expect(items({ 'p-heat-a': heatPad }).find((x) => x.ref === 'p-heat-a').owned).toBe(true);
    expect(items({ 'p-heat-a': { ...heatPad, intakeGenerated: true, userAdded: true } }).find((x) => x.ref === 'p-heat-a').owned).toBe(true);
    const marked = items({ 'p-heat-a': { ...heatPad, intakeGenerated: true } }, { owned: { 'p-heat-a': true } }).find((x) => x.ref === 'p-heat-a');
    expect(marked.owned).toBe(true);
    expect(marked.suggested).toBe(false);
  });
  it('the card says "Suggested for you", never "You have this", for an auto pick', () => {
    const [r] = buildRoutines({ needs: ['period_pain'], profile: notPregnant, catalog, inRoutine: { 'p-heat-a': { ...heatPad, intakeGenerated: true } } });
    const state = { routines: [r], act: new Proxy({}, { get: () => () => {} }), note: null, alternativesFor: () => [] };
    const html = renderToStaticMarkup(<NeedRoutines state={state} variant="app" />);
    expect(html).toContain('Suggested for you');
    expect(html).not.toContain('You have this');
  });
});

it('gives a sleep habit practical steps without prescribing a supplement', () => {
  const [routine] = buildRoutines({ needs: ['cycle_sleep'], profile: notPregnant, catalog });
  const habit = [...routine.start, ...routine.other].find((item) => item.ref === 'sleep_routine');
  expect(habit.how).toMatch(/wind-down/);
  expect(habit.how).toMatch(/eye mask/);
  expect(habit.how).not.toMatch(/magnesium|mg|dose/i);
  expect(habit.sources.some((source) => source.url.startsWith('https://www.cdc.gov/'))).toBe(true);
});

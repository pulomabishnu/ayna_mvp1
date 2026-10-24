import { describe, expect, it } from 'vitest';
import {
  createTry, dirtyTries, fromGuideTrials, fromRoutineOutcomes, HORIZONS, horizonFor, interventionKindFor, mergeTries, normalizeTry,
  OUTCOME_LABELS, OUTCOMES, outcomesToProductHistory, readTries, recordOutcome, removeTry, saveTry, setTriesOwner, tryStatus, withOutcomeHistory,
} from './outcomes.js';
import { buildUserProfile } from '../matching/userProfile.js';
import { scoreProduct } from '../matching/score.js';
import { buildProductProfile } from '../matching/productProfile.js';

const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) }; };

// Test-only products (not catalog entries).
const HEAT = { id: 'test-heat-pad', name: 'Test Heat Pad', category: 'cramp-relief' };
const MAG = { id: 'test-magnesium', name: 'Test Magnesium Glycinate', category: 'supplement' };
const SERUM = { id: 'test-serum', name: 'Test Clear Serum', category: 'skincare' };
const PRODUCTS = [HEAT, MAG, SERUM];

describe('horizons', () => {
  it('are data, one row per kind', () => {
    expect(HORIZONS.pain_relief.days).toBe(28);
    expect(HORIZONS.supplement.windowDays).toEqual([60, 90]);
    expect(HORIZONS.skincare.windowDays).toEqual([42, 56]);
    expect(HORIZONS.behavioural.days).toBe(56);
    expect(horizonFor('nope')).toBe(HORIZONS.default.days);
  });
  it('pick a kind from the product category or the action text', () => {
    expect(interventionKindFor({ kind: 'product', product: HEAT })).toBe('pain_relief');
    expect(interventionKindFor({ kind: 'product', product: MAG })).toBe('supplement');
    expect(interventionKindFor({ kind: 'product', product: { category: 'hair' } })).toBe('default');
    expect(interventionKindFor({ kind: 'action', ref: 'Heating pad on day 1' })).toBe('pain_relief');
    expect(interventionKindFor({ kind: 'action', ref: 'Magnesium at night' })).toBe('supplement');
    expect(interventionKindFor({ kind: 'action', ref: 'Walk 20 minutes' })).toBe('behavioural');
  });
});

describe('status is derived', () => {
  const t = createTry({ kind: 'product', product: MAG, need: 'cycle.pms', startedDay: '2026-08-01' }, new Date('2026-08-01T12:00:00'));
  it('pending before the horizon, due after, recorded once she answers', () => {
    expect(t.horizonDays).toBe(60);
    expect(t.status).toBe('pending');
    expect(tryStatus(t, '2026-09-29')).toBe('pending');
    expect(tryStatus(t, '2026-09-30')).toBe('due');
    const done = recordOutcome(t, 'helpful', { day: '2026-10-01' });
    expect(tryStatus(done, '2026-10-01')).toBe('recorded');
    expect(done.recordedDay).toBe('2026-10-01');
  });
  it('rejects unknown outcomes and labels every outcome in plain words', () => {
    expect(recordOutcome(t, 'great')).toBe(t);
    expect(OUTCOMES.every((o) => OUTCOME_LABELS[o])).toBe(true);
    expect(OUTCOME_LABELS.helpful).toBe('Helpful');
  });
  it('normalizeTry refuses junk', () => {
    expect(normalizeTry({ id: 'x', kind: 'product', ref: '', startedDay: '2026-01-01' })).toBeNull();
    expect(normalizeTry({ id: 'bad id!', kind: 'product', ref: 'a', startedDay: '2026-01-01' })).toBeNull();
    expect(normalizeTry({ id: 'a', kind: 'thing', ref: 'a', startedDay: '2026-01-01' })).toBeNull();
  });
});

describe('old routine check-ins', () => {
  it('maps helping/same/worse without touching the stored map; "No change yet" before the horizon stays pending', () => {
    const stored = {
      [MAG.id]: [{ day: '2026-10-01', rating: 'helping' }, { day: '2026-10-10', rating: 'same' }],
      [HEAT.id]: [{ day: '2026-09-01', rating: 'same' }, { day: '2026-10-05', rating: 'same' }],
      [SERUM.id]: [{ day: '2026-10-20', rating: 'worse' }],
      ghost: [{ day: '2026-10-20', rating: 'meh' }],
    };
    const copy = JSON.stringify(stored);
    const tries = Object.fromEntries(fromRoutineOutcomes(stored, PRODUCTS).map((t) => [t.ref, t]));
    expect(JSON.stringify(stored)).toBe(copy);
    expect(tries[MAG.id]).toMatchObject({ outcome: null, interim: 'no_change_yet', horizonDays: 60, startedDay: '2026-10-01' });
    expect(tryStatus(tries[MAG.id], '2026-10-24')).toBe('pending');
    expect(tries[HEAT.id]).toMatchObject({ outcome: 'no_change', recordedDay: '2026-10-05' }); // 34 days > one cycle
    expect(tries[SERUM.id]).toMatchObject({ outcome: 'worse' }); // worse counts at once
    expect(tries.ghost).toBeUndefined();
  });
});

describe('old try-and-check-back trials', () => {
  it('maps 1-5 scores to outcomes and keeps her own follow-up date', () => {
    const trials = [
      { id: 'a1', action: 'Heating pad', goal: 'cramps', baseline: 2, started: '2026-10-01', due: '2026-10-08', followUp: { score: 4, note: 'calmer', day: '2026-10-09' } },
      { id: 'a2', action: 'Walk daily', goal: 'mood', baseline: 3, started: '2026-10-01', due: '2026-10-15', followUp: { score: 3, note: '', day: '2026-10-05' } },
      { id: 'a3', action: 'Less caffeine', goal: 'sleep', baseline: 4, started: '2026-09-01', due: '2026-09-08', followUp: { score: 2, day: '2026-09-09' } },
      { id: 'a4', action: 'Stretching', goal: 'pain', baseline: 3, started: '2026-10-20', due: '2026-10-27', followUp: null },
    ];
    const out = Object.fromEntries(fromGuideTrials(trials).map((t) => [t.ref, t]));
    expect(out['Heating pad']).toMatchObject({ kind: 'action', outcome: 'helpful', horizonDays: 7, note: 'calmer', need: 'cramps' });
    expect(out['Walk daily']).toMatchObject({ outcome: null, interim: 'no_change_yet' });
    expect(out['Less caffeine'].outcome).toBe('worse');
    expect(tryStatus(out.Stretching, '2026-10-24')).toBe('pending');
    expect(tryStatus(out.Stretching, '2026-10-27')).toBe('due');
  });
});

describe('to the matcher', () => {
  const tries = [
    recordOutcome(createTry({ kind: 'product', product: HEAT, startedDay: '2026-08-01' }), 'helpful', { day: '2026-09-01' }),
    recordOutcome(createTry({ kind: 'product', product: SERUM, startedDay: '2026-08-01' }), 'side_effect', { day: '2026-09-10' }),
    recordOutcome(createTry({ kind: 'product', product: MAG, startedDay: '2026-08-01' }), 'worse', { day: '2026-10-01' }),
    createTry({ kind: 'product', product: { id: 'test-pending', name: 'Test Pending' }, startedDay: '2026-10-20' }),
    recordOutcome(createTry({ kind: 'action', ref: 'Walk', startedDay: '2026-08-01' }), 'helpful'),
  ];
  it('only recorded product outcomes count, in labels the matcher understands', () => {
    const h = outcomesToProductHistory(tries, PRODUCTS);
    expect(h.map((x) => x.name).sort()).toEqual(['Test Clear Serum', 'Test Heat Pad', 'Test Magnesium Glycinate']);
    expect(h.find((x) => x.name === HEAT.name).worked).toBe('Helped somewhat');
    expect(h.find((x) => x.name === MAG.name)).toMatchObject({ worked: 'Made things worse', current: 'No' });
    expect(h.find((x) => x.name === SERUM.name)).toMatchObject({ reaction: 'Mild', stopReasons: ['I had side effects or a reaction'] });
  });
  it('latest recorded outcome wins per product', () => {
    const later = recordOutcome(tries[0], 'no_change', { day: '2026-10-10' });
    expect(outcomesToProductHistory([tries[0], { ...later, id: 'try:later' }], PRODUCTS)[0].worked).toBe('No difference');
  });
  it('"Worse" removes the same product from her matches; "Side effect" moves it strongly down', () => {
    const intake = withOutcomeHistory({ productHistory: [{ name: 'Something else', worked: 'Not sure' }] }, outcomesToProductHistory(tries, PRODUCTS));
    expect(intake.productHistory).toHaveLength(4);
    const up = buildUserProfile(intake, { catalog: PRODUCTS });
    const mag = up.experience.history.find((x) => x.resolvedProductId === MAG.id);
    expect(mag.hardSuppress).toBe(true);
    const serum = up.experience.history.find((x) => x.resolvedProductId === SERUM.id);
    expect(serum.effects.map((e) => e.from)).toEqual(expect.arrayContaining(['reaction:mild', 'stop:reaction']));
    const result = scoreProduct(buildProductProfile({ ...MAG, healthFunctions: [], tags: [] }), up);
    expect(JSON.stringify(result)).toMatch(/history_made_worse/);
  });
  it('withOutcomeHistory keeps her own answers and skips exact repeats', () => {
    const base = { productHistory: [{ name: 'test heat pad', worked: 'Helped somewhat' }] };
    const out = withOutcomeHistory(base, outcomesToProductHistory([tries[0]], PRODUCTS));
    expect(out).toBe(base);
    expect(withOutcomeHistory(base, [])).toBe(base);
  });
});

describe('storage and merge', () => {
  it('saves, reads with status, removes as a tombstone, uploads only when signed in', () => {
    const storage = mem();
    const t = saveTry(createTry({ kind: 'action', ref: 'Heat on day 1', startedDay: '2026-10-01' }), { storage, today: '2026-10-24' });
    expect(readTries({ storage, today: '2026-10-24' })[0]).toMatchObject({ ref: 'Heat on day 1', status: 'pending' });
    expect(dirtyTries(storage)).toEqual([]);
    setTriesOwner('u', storage);
    expect(dirtyTries(storage).map((x) => x.id)).toEqual([t.id]);
    removeTry(t.id, { storage });
    expect(readTries({ storage })).toEqual([]);
    expect(readTries({ storage, includeRemoved: true })[0].removed).toBe(true);
  });
  it('newest updatedAt wins per try', () => {
    const a = { id: 'x', kind: 'action', ref: 'Walk', startedDay: '2026-10-01', updatedAt: '2026-10-02T00:00:00Z' };
    const b = { ...a, outcome: 'helpful', recordedDay: '2026-10-20', updatedAt: '2026-10-20T00:00:00Z' };
    expect(mergeTries([b], [a]).x.outcome).toBe('helpful');
    expect(mergeTries([a], [b]).x.outcome).toBe('helpful');
  });
});

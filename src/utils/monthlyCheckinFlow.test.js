import { describe, it, expect, vi } from 'vitest';

vi.mock('./supabaseClient', () => ({ getSupabaseClient: () => null }));

const {
  computeCheckinSteps,
  buildInitialCheckinState,
  buildCheckinAnswers,
  hasPrefill,
  summarizeVerdicts,
  ROUTINE_GREAT,
  SCREENING_FOCUS,
} = await import('./monthlyCheckinFlow.js');

const products = [{ id: 'a', name: 'Cup A' }, { id: 'b', name: 'Pad B' }];

describe('computeCheckinSteps', () => {
  it('always starts with routine and ends with safety', () => {
    expect(computeCheckinSteps({ howIsRoutine: '' })).toEqual(['routine', 'safety']);
    expect(computeCheckinSteps({ howIsRoutine: ROUTINE_GREAT, hasProducts: true })).toEqual(['routine', 'products', 'safety']);
  });
  it('adds focus and screening only when relevant', () => {
    expect(computeCheckinSteps({ howIsRoutine: 'Okay, could be better', focusAreas: ['More cramps'], hasProducts: true }))
      .toEqual(['routine', 'products', 'focus', 'safety']);
    expect(computeCheckinSteps({ howIsRoutine: 'Okay, could be better', focusAreas: [SCREENING_FOCUS] }))
      .toEqual(['routine', 'focus', 'screening', 'safety']);
  });
});

describe('buildInitialCheckinState', () => {
  it('prefills from last month, dropping products no longer owned and never the safety answer', () => {
    const s = buildInitialCheckinState({
      howIsRoutine: 'Okay, could be better',
      focusAreas: ['More cramps', 3],
      productVerdicts: { a: 'helped', gone: 'worse', b: 'bogus' },
      lastPap: 'Within 1 year',
      safetyConcern: 'Yes',
    }, ['a', 'b']);
    expect(s).toEqual({
      howIsRoutine: 'Okay, could be better',
      focusAreas: ['More cramps'],
      productVerdicts: { a: 'helped' },
      screening: { sexuallyActive: '', lastSTI: '', lastPap: 'Within 1 year' },
      safetyConcern: '',
    });
    expect(hasPrefill(s)).toBe(true);
  });
  it('starts blank without history', () => {
    const s = buildInitialCheckinState(null, ['a']);
    expect(s.howIsRoutine).toBe('');
    expect(hasPrefill(s)).toBe(false);
  });
});

describe('buildCheckinAnswers', () => {
  const now = new Date(2026, 9, 6);
  it('keeps the legacy fields and adds verdicts, safety and month', () => {
    const a = buildCheckinAnswers({
      howIsRoutine: 'New symptoms or frustrations',
      focusAreas: ['More cramps', SCREENING_FOCUS],
      productVerdicts: { a: 'worse', gone: 'helped' },
      screening: { sexuallyActive: 'Yes', lastSTI: 'Never', lastPap: '' },
      safetyConcern: 'No',
    }, { products, focusToSymptom: { 'More cramps': 'Increased cramps' }, now });
    expect(a).toEqual({
      version: 1,
      month: '2026-10-01',
      howIsRoutine: 'New symptoms or frustrations',
      focusAreas: ['More cramps', SCREENING_FOCUS],
      newSymptoms: ['Increased cramps'],
      sexuallyActive: 'Yes',
      lastSTI: 'Never',
      lastPap: '',
      productVerdicts: { a: 'worse' },
      productNames: { a: 'Cup A' },
      safetyConcern: 'No',
    });
  });
  it('a great routine clears focus areas and screening answers', () => {
    const a = buildCheckinAnswers({
      howIsRoutine: ROUTINE_GREAT,
      focusAreas: [SCREENING_FOCUS],
      productVerdicts: {},
      screening: { sexuallyActive: 'Yes', lastSTI: 'Never', lastPap: '' },
      safetyConcern: 'Not sure',
    }, { products, now });
    expect(a.focusAreas).toEqual([]);
    expect(a.sexuallyActive).toBe('');
    expect(a.lastSTI).toBe('');
  });
});

describe('summarizeVerdicts', () => {
  it('counts each verdict', () => {
    expect(summarizeVerdicts({ a: 'helped', b: 'worse', c: 'helped', d: 'x' })).toEqual({ helped: 2, no_change: 0, worse: 1 });
  });
});

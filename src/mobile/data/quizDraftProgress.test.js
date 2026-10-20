// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { CHECKPOINT_STEP, EMPTY, INTAKE_DRAFT_KEY, splitIntakeSteps } from './intakeModel.js';
import { clearIntakeDraft, draftProgress, draftProgressLine, readDraftProgress } from './quizDraftProgress.js';

const draft = (stepId, patch = {}) => ({ version: 1, stepId, intake: { ...EMPTY, ...patch } });
const requiredIds = (patch = {}) => splitIntakeSteps({ ...EMPTY, ...patch }).required.map((s) => s.id);

describe('draftProgress', () => {
  it('returns null without a usable draft', () => {
    expect(draftProgress(null)).toBeNull();
    expect(draftProgress({ version: 1, stepId: 'age' })).toBeNull();
    expect(draftProgress({ version: 1, intake: {}, stepId: 3 })).toBeNull();
  });

  it('counts the app quiz step by step, every required question numbered', () => {
    const total = requiredIds().length;
    expect(draftProgress(draft('age', { age: '29' }))).toMatchObject({ stepId: 'age', index: 1, total, requiredDone: false, fraction: 0 });
    const p = draftProgress(draft('support', { age: '29' }));
    expect(p.index).toBe(requiredIds().indexOf('support') + 1);
    expect(p.fraction).toBeCloseTo((p.index - 1) / total);
  });

  it('includes follow-ups that apply in the app total', () => {
    const patch = { supportSelections: ['Trying to conceive'] };
    expect(requiredIds(patch)).toContain('ttcDuration');
    const p = draftProgress(draft('ttcDuration', patch));
    expect(p.total).toBe(requiredIds(patch).length);
    expect(p.index).toBe(requiredIds(patch).indexOf('ttcDuration') + 1);
  });

  it('counts the website way: age and life stage share a screen, follow-ups keep their parent number', () => {
    const patch = { supportSelections: ['Trying to conceive'] };
    const web = draftProgress(draft('lifeStage', patch), { surface: 'web' });
    expect(web).toMatchObject({ stepId: 'age', index: 1 });
    const support = draftProgress(draft('support', patch), { surface: 'web' });
    const follow = draftProgress(draft('ttcDuration', patch), { surface: 'web' });
    expect(follow.index).toBe(support.index);
    expect(follow.total).toBe(requiredIds(patch).length - 2);
  });

  it('marks the required part done at the checkpoint or in the optional part', () => {
    expect(draftProgress(draft(CHECKPOINT_STEP))).toMatchObject({ requiredDone: true, fraction: 1 });
    expect(draftProgress(draft('zip'))).toMatchObject({ requiredDone: true, stepId: 'zip' });
  });

  it('falls back to question 1 for a step it does not know', () => {
    expect(draftProgress(draft('gone'))).toMatchObject({ index: 1, requiredDone: false });
  });
});

describe('draftProgressLine', () => {
  it('says where she is in plain words', () => {
    expect(draftProgressLine({ requiredDone: false, index: 3, total: 9 })).toBe("You're on question 3 of 9. It picks up where you left off.");
    expect(draftProgressLine({ requiredDone: true, index: 9, total: 9 })).toMatch(/^All 9 required questions are done\./);
    expect(draftProgressLine(null)).toBe('');
  });
});

describe('reading the saved draft', () => {
  afterEach(() => localStorage.clear());
  it('reads and clears the same draft both quizzes save', () => {
    localStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify(draft('support', { age: '31' })));
    expect(readDraftProgress()?.stepId).toBe('support');
    clearIntakeDraft();
    expect(readDraftProgress()).toBeNull();
  });
});

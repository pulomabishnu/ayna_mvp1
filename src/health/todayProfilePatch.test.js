import { describe, expect, it } from 'vitest';
import { patchIntakeWithTodayAnswer, saveOptionFor } from './todayProfilePatch.js';
import { buildUserProfile } from '../matching/userProfile.js';

const snap = { age: '27', lifeStageSelections: ['I get periods regularly'], lifeStage: 'I get periods regularly', takesCurrent: '', currentMedicationItems: [], skippedSteps: ['medications'] };

describe('saving a Today answer to her profile', () => {
  it('only exact equivalents are written directly; the rest open the quiz question', () => {
    expect(saveOptionFor('medications', 'none').kind).toBe('direct');
    expect(saveOptionFor('pregnancy', 'yes').kind).toBe('direct');
    expect(saveOptionFor('breastfeeding', 'no').kind).toBe('direct');
    expect(saveOptionFor('pregnancy', 'no')).toMatchObject({ kind: 'open_step', step: 'lifeStage' });
    expect(saveOptionFor('conditions', 'none')).toMatchObject({ kind: 'open_step', step: 'conditions' });
    expect(saveOptionFor('allergies', 'no')).toMatchObject({ kind: 'open_step', step: 'allergies' });
    expect(saveOptionFor('pregnancy', 'not_sure')).toBeNull();
  });
  it('medicines none -> "Taking anything?" No, and the step is no longer skipped', () => {
    const next = patchIntakeWithTodayAnswer(snap, 'medications', 'none');
    expect(next).toMatchObject({ takesCurrent: 'No', currentMedicationItems: [], skippedSteps: [] });
    expect(buildUserProfile(next).safety.medicationsState).toBe('explicit_no');
    expect(snap.takesCurrent).toBe(''); // never mutates
  });
  it('pregnant -> life stage', () => {
    const next = patchIntakeWithTodayAnswer(snap, 'pregnancy', 'yes');
    expect(next.lifeStageSelections).toContain('I am pregnant');
    expect(buildUserProfile(next).safety.pregnancyStatus).toBe('pregnant');
  });
  it('nothing written for open-step answers', () => {
    expect(patchIntakeWithTodayAnswer(snap, 'conditions', 'none')).toBeNull();
    expect(patchIntakeWithTodayAnswer(null, 'medications', 'none')).toBeNull();
  });
});

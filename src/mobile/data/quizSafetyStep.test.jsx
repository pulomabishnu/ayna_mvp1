// QA (Oct 25): quiz safety step and age range.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { EMPTY, missingAnswerHint, SAFETY_ANSWER_LABELS, AGE_MAX, AGE_MIN } from './intakeModel.js';
import { ONBOARDING_WHY } from './onboardingFlow.js';
import { AgeDial } from '../components/intake/IntakeControls.jsx';

describe('safety step', () => {
  it('a disabled Next names what is missing, in the buttons’ words', () => {
    const none = missingAnswerHint('medications', { ...EMPTY });
    expect(none).toMatch(/Pick an answer/);
    expect(none).toContain(SAFETY_ANSWER_LABELS['Prefer not to say']);
    expect(missingAnswerHint('medications', { ...EMPTY, takesCurrent: 'Yes' })).toMatch(/Add at least one medicine/);
    expect(missingAnswerHint('medications', { ...EMPTY, takesCurrent: 'No' })).toBe('');
    expect(missingAnswerHint('age', { ...EMPTY })).toBe('');
    // "Anything urgent?" is Yes / No / Not sure only (QA round 2).
    expect(missingAnswerHint('safety', { ...EMPTY })).toBe('Pick Yes, No or Not sure to go on.');
  });
  it('the "why we ask" line says Prefer not to answer, like the button', () => {
    expect(ONBOARDING_WHY.conditions).toContain('Prefer not to answer');
    expect(Object.values(ONBOARDING_WHY).join(' ')).not.toContain('Prefer not to say');
  });
});

describe('age range', () => {
  it('one value for the app and the website', () => {
    expect([AGE_MIN, AGE_MAX]).toEqual([18, 90]);
    expect(renderToStaticMarkup(<AgeDial value="" onChange={() => {}} />)).toContain(`${AGE_MAX}+`);
  });
});

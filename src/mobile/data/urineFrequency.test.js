import { describe, it, expect } from 'vitest';
import { utiOptions, URINE_FREQUENCY, UTI_FREQUENCY } from './intakeModel.js';
import { UTI_FREQUENCY_BY_OPTION } from '../../matching/userProfile.js';

describe('urinary follow-up answers (backlog Nov 14, Ivy)', () => {
  it('frequent urination alone asks how often, with no UTI answers', () => {
    expect(utiOptions({ supportSelections: ['Frequent urination'] })).toBe(URINE_FREQUENCY);
    expect(URINE_FREQUENCY.some((o) => /UTI|first time|right now/i.test(o))).toBe(false);
  });
  it('burning or repeat UTIs still get the UTI answers', () => {
    expect(utiOptions({ supportSelections: ['Frequent urination', 'Burning with urination'] })).toBe(UTI_FREQUENCY);
  });
  it('frequency answers never become a UTI modifier', () => {
    URINE_FREQUENCY.forEach((o) => expect(UTI_FREQUENCY_BY_OPTION[o] ?? null).toBe(null));
  });
});

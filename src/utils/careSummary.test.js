import { describe, it, expect } from 'vitest';
import { summarizeCareNotes, firstCareLink } from './careSummary.js';

describe('summarizeCareNotes', () => {
  it('merges "worth raising" notes into one sentence', () => {
    const lines = summarizeCareNotes({ notes: [
      { code: 'severe_pain', text: 'Severe period pain is worth raising with a clinician.' },
      { code: 'very_heavy_flow', text: 'Very heavy periods are worth raising with a clinician.' },
    ] });
    expect(lines).toEqual(['Severe period pain and very heavy periods are worth raising with a clinician.']);
  });
  it('keeps a single note as written and other notes separate', () => {
    const lines = summarizeCareNotes({ notes: [
      { code: 'severe_pain', text: 'Severe period pain is worth raising with a clinician.' },
      { code: 'pregnancy_unknown', text: 'Pregnancy safety is not confirmed for most products. Check new products with your clinician.' },
    ] });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('Severe period pain is worth raising with a clinician.');
  });
  it('says which answers a note comes from on the website', () => {
    const notes = [{ code: 'severe_pain', text: 'x' }, { code: 'very_heavy_flow', text: 'y' }];
    expect(summarizeCareNotes({ notes: [notes[0]] }, { sayWhy: true })).toEqual(['You mentioned severe period pain. That is worth raising with a clinician.']);
    expect(summarizeCareNotes({ notes }, { sayWhy: true })).toEqual(['You mentioned severe period pain and very heavy periods. Both are worth raising with a clinician.']);
  });
  it('handles empty input', () => {
    expect(summarizeCareNotes(null)).toEqual([]);
    expect(firstCareLink(null)).toBeNull();
  });
});

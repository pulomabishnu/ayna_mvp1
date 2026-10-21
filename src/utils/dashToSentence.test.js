import { describe, expect, it } from 'vitest';
import { dashToSentence } from './dashToSentence.js';

describe('dashToSentence', () => {
  it('ends the sentence instead of making a comma splice', () => {
    expect(dashToSentence('Soft cotton — no dyes or perfume.')).toBe('Soft cotton. No dyes or perfume.');
  });
  it('leaves text without dashes alone', () => {
    expect(dashToSentence('Plain text.')).toBe('Plain text.');
  });
  it('keeps labels as a list', () => {
    expect(dashToSentence('Regular — 18 count', { label: true })).toBe('Regular, 18 count');
  });
});

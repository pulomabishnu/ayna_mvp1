import { describe, expect, it } from 'vitest';
import { sentenceCase } from './sentenceCase.js';

describe('sentenceCase', () => {
  it('lowercases every word after the first', () => {
    expect(sentenceCase('Intimate Care')).toBe('Intimate care');
    expect(sentenceCase('Sexual Wellness')).toBe('Sexual wellness');
    expect(sentenceCase('Menstrual Health')).toBe('Menstrual health');
  });
  it('keeps acronyms', () => {
    expect(sentenceCase('PCOS Support')).toBe('PCOS support');
    expect(sentenceCase('FSA/HSA Eligible')).toBe('FSA/HSA eligible');
  });
});
describe('sentenceCase names', () => {
  it('keeps product names', () => { expect(sentenceCase('Connect Apple Health Data')).toBe('Connect Apple Health data'); });
});

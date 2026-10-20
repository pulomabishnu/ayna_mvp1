import { describe, expect, it } from 'vitest';
import {
  generateSlug, isValidSlug, slugFromPath, validateShareInput, sharedAnswerTitle, sharedAnswerUrl,
  questionForAnswer, referralCodeFor, SLUG_ALPHABET, MAX_ANSWER, MAX_QUESTION,
} from './sharedAnswer.js';

describe('share slugs', () => {
  it('are 10 url-safe characters and unique across many draws', () => {
    const seen = new Set();
    for (let i = 0; i < 2000; i += 1) {
      const s = generateSlug();
      expect(s).toMatch(/^[A-Za-z0-9]{10}$/);
      expect(isValidSlug(s)).toBe(true);
      seen.add(s);
    }
    expect(seen.size).toBe(2000);
  });
  it('reject biased bytes instead of wrapping them (no modulo bias)', () => {
    // 248..255 must be skipped; 0 maps to the first letter.
    let calls = 0;
    const rand = (n) => { calls += 1; return Uint8Array.from({ length: n }, (_, i) => (calls === 1 && i < 15 ? 250 : 0)); };
    const s = generateSlug(rand);
    expect(s).toBe(SLUG_ALPHABET[0].repeat(10));
  });
  it('validate strictly', () => {
    for (const bad of ['', 'short', 'abcdefghijk', 'abc-efghij', 'abc/efghij', '../../etc1', 'abcdefghi ', null, 12345678901, undefined]) {
      expect(isValidSlug(bad)).toBe(false);
    }
    expect(isValidSlug('Ab3dEf9hIj')).toBe(true);
  });
  it('are read from /a/<slug> paths only', () => {
    expect(slugFromPath('/a/Ab3dEf9hIj')).toBe('Ab3dEf9hIj');
    expect(slugFromPath('/a/Ab3dEf9hIj/')).toBe('Ab3dEf9hIj');
    expect(slugFromPath('/a/Ab3dEf9hI')).toBeNull();
    expect(slugFromPath('/b/Ab3dEf9hIj')).toBeNull();
    expect(slugFromPath('/a/Ab3dEf9hIj/x')).toBeNull();
  });
  it('build links on the given origin', () => {
    expect(sharedAnswerUrl('Ab3dEf9hIj', 'https://www.aynahealth.co/')).toBe('https://www.aynahealth.co/a/Ab3dEf9hIj');
  });
});

describe('share input validation', () => {
  it('accepts a question and answer and trims them', () => {
    const r = validateShareInput({ question: '  What helps with cramps? ', answer: ' Heat. ' });
    expect(r).toEqual({ ok: true, value: { question: 'What helps with cramps?', answer: 'Heat.', sources: [] } });
  });
  it('requires both and enforces the length limits', () => {
    expect(validateShareInput(null).error).toBe('invalid_body');
    expect(validateShareInput([]).error).toBe('invalid_body');
    expect(validateShareInput({ answer: 'a' }).error).toBe('question_required');
    expect(validateShareInput({ question: 'q', answer: '   ' }).error).toBe('answer_required');
    expect(validateShareInput({ question: 'q'.repeat(MAX_QUESTION + 1), answer: 'a' }).error).toBe('question_too_long');
    expect(validateShareInput({ question: 'q', answer: 'a'.repeat(MAX_ANSWER + 1) }).error).toBe('answer_too_long');
    expect(validateShareInput({ question: 'q'.repeat(MAX_QUESTION), answer: 'a'.repeat(MAX_ANSWER) }).ok).toBe(true);
  });
  it('keeps only https sources and drops anything else she did not see', () => {
    const r = validateShareInput({ question: 'q', answer: 'a', profile: { conditions: ['x'] }, sources: [
      { title: 'NIH', url: 'https://nih.gov/x' }, { title: 'bad', url: 'javascript:alert(1)' }, { url: 'http://insecure.example' }, 'junk', { title: 'Book' },
    ] });
    expect(r.value).toEqual({ question: 'q', answer: 'a', sources: [{ title: 'NIH', url: 'https://nih.gov/x' }, { title: 'Book' }] });
    expect(validateShareInput({ question: 'q', answer: 'a', sources: 'x' }).error).toBe('invalid_sources');
  });
});

describe('titles and helpers', () => {
  it('uses the first name in sentence case', () => {
    expect(sharedAnswerTitle('Ameera Osman')).toBe('Ameera’s answer from ayna');
    expect(sharedAnswerTitle('Jess')).toBe('Jess’ answer from ayna');
    expect(sharedAnswerTitle('')).toBe('An answer from ayna');
  });
  it('finds the question before an answer', () => {
    const msgs = [{ role: 'assistant', text: 'hi' }, { role: 'user', text: 'Q1' }, { role: 'assistant', text: 'A1' }];
    expect(questionForAnswer(msgs, 2)).toBe('Q1');
    expect(questionForAnswer(msgs, 0)).toBe('');
  });
  it('matches the referral code used by badges.js', () => {
    expect(referralCodeFor('1a2b3c4d-5e6f-7a8b-9c0d-ef1234567890')).toBe('1a2b3c4d5e');
  });
});

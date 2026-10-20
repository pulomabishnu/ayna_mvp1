import { describe, expect, it } from 'vitest';
import { clearError, countErrors, errorSummary, firstErrorKey } from './formErrors.js';

describe('formErrors', () => {
  it('finds the first error in screen order', () => {
    expect(firstErrorKey({ consent2: 'x', email: 'y' }, ['email', 'consent0', 'consent2'])).toBe('email');
    expect(firstErrorKey({}, ['email'])).toBe(null);
  });

  it('only summarises when more than one thing is missing', () => {
    const boxes = ['consent0', 'consent1', 'consent2'];
    expect(errorSummary({ consent0: 'x' }, boxes)).toBe('');
    expect(errorSummary({ consent0: 'x', consent2: 'y', email: '' }, boxes)).toBe('Tick the 2 boxes above to create your account.');
    expect(errorSummary({ consent0: 'x', email: 'y' }, boxes)).toBe('Fix the 2 things marked above to create your account.');
    expect(errorSummary({ a: 'x', b: 'y' }, ['a', 'b'], 'continue')).toBe('Tick the 2 boxes above to continue.');
  });

  it('clears one error and counts the rest', () => {
    const errs = { a: 'x', b: 'y' };
    const next = clearError(errs, 'a');
    expect(countErrors(next)).toBe(1);
    expect(clearError(next, 'a')).toBe(next);
  });

  it('never uses banned error copy', () => {
    const s = errorSummary({ a: 'x', b: 'y', c: 'z' }, []);
    expect(s).not.toMatch(/oops|error:|!|—/i);
  });
});

import { describe, expect, it } from 'vitest';
import { authErrorText } from './authErrorText.js';

describe('authErrorText', () => {
  it('keeps a real message and replaces junk', () => {
    expect(authErrorText({ message: 'Invalid login credentials' }, 'F')).toMatch(/don’t match/);
    expect(authErrorText({ message: 'Email rate limit exceeded' }, 'F')).toBe('Email rate limit exceeded');
    for (const e of [{ message: '{}' }, { message: '' }, {}, { message: 'Failed to fetch' }, { message: 'x', status: 504 }, null]) expect(authErrorText(e, 'F')).toBe('F');
  });
});

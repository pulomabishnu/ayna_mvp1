import { describe, expect, it } from 'vitest';
import { mergeLines } from './mergeLines.js';

describe('mergeLines', () => {
  it('one line when two goals share the same finding', () => {
    const lines = mergeLines([
      { needId: 'a', label: 'Cramps or period pain', summary: 'Your period is due in about 5 days', kind: 'timing' },
      { needId: 'b', label: 'Heavy periods', summary: 'Your period is due in about 5 days', kind: 'timing' },
    ]);
    expect(lines).toHaveLength(1);
    expect(lines[0].effect).toBe('It backs up your cramps or period pain and heavy periods picks.');
  });
});

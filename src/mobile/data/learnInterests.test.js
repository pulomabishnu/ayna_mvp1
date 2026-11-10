import { describe, it, expect } from 'vitest';
import { EMPTY, buildSnapshot, reconstructIntakeFromSnapshot, LEARN_INTERESTS } from './intakeModel.js';

describe('learn about (focus group, Nov 9)', () => {
  it('saves what she wants to learn about and reads it back; nothing saved when empty', () => {
    const snap = buildSnapshot({ ...EMPTY, age: '29', supportSelections: ['Nothing right now'], learnInterests: ['Birth control'] });
    expect(snap.learnInterests).toEqual(['Birth control']);
    expect(reconstructIntakeFromSnapshot(snap).learnInterests).toEqual(['Birth control']);
    expect('learnInterests' in buildSnapshot({ ...EMPTY, age: '29' })).toBe(false);
    expect(LEARN_INTERESTS).toContain('Birth control');
  });
});

import { describe, expect, it } from 'vitest';
import { chipsFor } from './askFollowUps.js';

describe('Ask ayna personal guide chip', () => {
  it('appears only on a screen that can open the guide', () => {
    const suggestion = [{ type: 'open_guide', page: 'trial', label: 'Try & check back' }];
    expect(chipsFor(suggestion).map((chip) => chip.type)).toEqual(['ask_else']);
    expect(chipsFor(suggestion, { hasGuide: true }).map((chip) => chip.type)).toEqual(['open_guide', 'ask_else']);
  });
});

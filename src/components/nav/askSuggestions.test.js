import { describe, it, expect } from 'vitest';
import { navAskSuggestions, readSuggestHidden, writeSuggestHidden, ASK_SUGGEST_HIDDEN_KEY } from './askSuggestions.js';
import { askPromptGroups } from '../../utils/askGroups.js';

describe('Ask ayna suggestion row (founder, Oct 26)', () => {
  it('offers 3 or 4 of Ask\'s own starter questions, nothing new', () => {
    for (const o of [{}, { hasProfile: true }, { signedIn: true, hasProfile: true }]) {
      const q = navAskSuggestions(o);
      expect(q.length).toBeGreaterThanOrEqual(3);
      expect(q.length).toBeLessThanOrEqual(4);
      const known = askPromptGroups({ ...o, max: 5 }).flatMap((g) => g.prompts.map((p) => p.question));
      for (const x of q) expect(known).toContain(x);
    }
  });
  it('Hide is remembered for the session, and storage errors never throw', () => {
    const had = globalThis.window;
    // No storage at all (private mode, node): shown, and Hide does not throw.
    globalThis.window = { get sessionStorage() { throw new Error('blocked'); } };
    expect(readSuggestHidden()).toBe(false);
    expect(() => writeSuggestHidden()).not.toThrow();
    const store = {};
    globalThis.window = { sessionStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } } };
    expect(readSuggestHidden()).toBe(false);
    writeSuggestHidden();
    expect(store[ASK_SUGGEST_HIDDEN_KEY]).toBe('1');
    expect(readSuggestHidden()).toBe(true);
    globalThis.window = had;
  });
});

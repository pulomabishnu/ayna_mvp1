import { describe, it, expect } from 'vitest';
import { buildSuggestionRow, cleanLink } from './suggestions.js';

describe('buildSuggestionRow', () => {
  it('keeps only suggestion text, never identity fields', () => {
    const { row } = buildSuggestionRow({ kind: 'product', productName: ' Thinx ', link: 'thinx.com', reason: 'comfy', context: 'shop', userId: 'abc', email: 'a@b.co', name: 'Maya' });
    expect(row).toEqual({ kind: 'product', product_name: 'Thinx', link: 'https://thinx.com/', reason: 'comfy', topic: null, context: 'shop', platform: 'web' });
  });
  it('validates reads and unknown contexts', () => {
    expect(buildSuggestionRow({ kind: 'read', topic: 'Cycle changes after 35', context: 'evil', platform: 'app' }).row).toMatchObject({ kind: 'read', topic: 'Cycle changes after 35', context: null, platform: 'app' });
    expect(buildSuggestionRow({ kind: 'read', topic: 'x' }).error).toBeTruthy();
    expect(buildSuggestionRow({ kind: 'nope' }).error).toBeTruthy();
    expect(buildSuggestionRow({ kind: 'product', productName: '' }).error).toBeTruthy();
  });
  it('rejects non-http links', () => {
    expect(cleanLink('javascript:alert(1)')).toBe(null);
    expect(cleanLink('')).toBe('');
  });
});

import { suggestionEmail, TEAM_EMAILS } from './suggestions.js';
describe('suggestion email to the founders', () => {
  it('goes to Ameera, Eliz and Puloma with only what was typed', () => {
    const e = suggestionEmail({ kind: 'product', product_name: 'Bad <b>cramp</b> patch', link: null, reason: 'helps', topic: null, context: 'shop', platform: 'web' });
    expect(TEAM_EMAILS()).toEqual(['ameera@aynahealth.co', 'eliz@aynahealth.co', 'puloma@aynahealth.co']);
    expect(e.to).toEqual(TEAM_EMAILS());
    expect(e.subject).toMatch(/Bad <b>cramp<\/b> patch/);
    expect(e.html).not.toMatch(/<b>cramp/);
    expect(e.text).toMatch(/Why: helps/);
  });
});

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

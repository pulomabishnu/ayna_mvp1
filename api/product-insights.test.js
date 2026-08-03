import { describe, it, expect } from 'vitest';
import { sanitizePhrase, uniquePhrases } from './product-insights.js';

describe('sanitizePhrase — strips URLs instead of discarding the field', () => {
  it('keeps the prose when a URL appears mid-sentence', () => {
    const narrative = 'ACOG notes magnesium may help with cramps, see https://acog.org/guide for detail.';
    const out = sanitizePhrase(narrative, 2200);
    // Previously returned '' — the whole clinical narrative was thrown away.
    expect(out).toContain('ACOG notes magnesium may help with cramps');
    expect(out).not.toContain('http');
  });

  it('strips bare www links too', () => {
    expect(sanitizePhrase('Evidence summarized at www.nih.gov here', 500)).not.toContain('www.');
  });

  it('tidies the space left behind before punctuation', () => {
    expect(sanitizePhrase('See https://x.com , then continue', 500)).not.toMatch(/\s,/);
  });

  it('returns empty only when the whole value was a URL', () => {
    expect(sanitizePhrase('https://example.com', 500)).toBe('');
  });

  it('passes clean text through untouched and respects maxLen', () => {
    expect(sanitizePhrase('  magnesium   glycinate  ', 500)).toBe('magnesium glycinate');
    expect(sanitizePhrase('abcdefghij', 4)).toBe('abcd');
  });

  it('handles non-strings', () => {
    expect(sanitizePhrase(null, 10)).toBe('');
    expect(sanitizePhrase(42, 10)).toBe('');
  });
});

describe('uniquePhrases — no "[object Object]" reaching the UI', () => {
  it('drops non-string entries rather than stringifying them', () => {
    // String({q:'x'}) is "[object Object]" — 15 chars, so it passed the >=3
    // guard and rendered as "PubMed search: [object Object]".
    const out = uniquePhrases([{ q: 'cramps' }, 'magnesium cramps', ['a', 'b']], 5, 100);
    expect(out).toEqual(['magnesium cramps']);
    expect(out.join(' ')).not.toContain('object Object');
  });

  it('dedupes case-insensitively and honours the count cap', () => {
    expect(uniquePhrases(['Magnesium', 'magnesium', 'inositol'], 5, 100)).toEqual(['Magnesium', 'inositol']);
    expect(uniquePhrases(['aaa', 'bbb', 'ccc'], 2, 100)).toHaveLength(2);
  });

  it('drops phrases shorter than 3 characters', () => {
    expect(uniquePhrases(['ab', 'abc'], 5, 100)).toEqual(['abc']);
  });
});

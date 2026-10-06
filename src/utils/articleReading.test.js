import { describe, it, expect } from 'vitest';
import { createElement as h, Fragment } from 'react';
import { extractText, estimateReadMinutes, splitBodyAndSources, getNextArticle } from './articleReading';

const body = h(
  Fragment,
  null,
  h('p', null, 'First paragraph with ', h('em', null, 'emphasis'), '.'),
  h('p', null, h('strong', null, 'When to seek care:'), ' if things change.'),
  h('p', null, h('strong', null, 'Sources:')),
  h(
    'ul',
    null,
    h('li', null, h('a', { href: 'https://a.example' }, 'Source A')),
    h('li', null, h('a', { href: 'https://b.example' }, 'Source B')),
  ),
);

describe('extractText / estimateReadMinutes', () => {
  it('flattens nested elements to text', () => {
    expect(extractText(h('p', null, 'a ', h('b', null, 'b')))).toContain('b');
  });
  it('returns at least 1 minute', () => {
    expect(estimateReadMinutes(body)).toBe(1);
  });
  it('scales at ~200 words per minute', () => {
    const long = h('p', null, Array.from({ length: 1000 }, () => 'word').join(' '));
    expect(estimateReadMinutes(long)).toBe(5);
  });
});

describe('splitBodyAndSources', () => {
  it('separates the trailing Sources list into links', () => {
    const { mainBody, sourceLinks } = splitBodyAndSources(body);
    expect(sourceLinks).toEqual([
      { href: 'https://a.example', text: 'Source A' },
      { href: 'https://b.example', text: 'Source B' },
    ]);
    expect(mainBody).toHaveLength(2);
    expect(extractText(mainBody)).not.toMatch(/Sources:/);
  });
  it('leaves a body without a Sources paragraph intact', () => {
    const plain = h(Fragment, null, h('p', null, 'Only text.'));
    const { mainBody, sourceLinks } = splitBodyAndSources(plain);
    expect(sourceLinks).toEqual([]);
    expect(extractText(mainBody)).toBe('Only text.');
  });
  it('does not split on a paragraph that merely mentions sources mid-sentence', () => {
    const b = h(Fragment, null, h('p', null, 'Other sources: many.'), h('ul', null, h('li', null, h('a', { href: 'x' }, 'x'))));
    expect(splitBodyAndSources(b).sourceLinks).toEqual([]);
  });
});

describe('getNextArticle', () => {
  const articles = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const categories = [{ id: 't', label: 'Topic', articleIds: ['a', 'b', 'c'] }];

  it('picks the next article in the same topic', () => {
    expect(getNextArticle({ id: 'a' }, articles, categories)).toEqual({ article: { id: 'b' }, label: 'Next in Topic' });
  });
  it('wraps around and skips seen articles', () => {
    expect(getNextArticle({ id: 'c' }, articles, categories, ['a']).article.id).toBe('b');
  });
  it('falls back to suggested, then any unseen article', () => {
    expect(getNextArticle({ id: 'a' }, articles, categories, ['b', 'c'], [{ id: 'd' }]).label).toBe('Suggested for you');
    expect(getNextArticle({ id: 'a' }, articles, categories, ['b', 'c']).article.id).toBe('d');
  });
  it('returns null when everything has been read', () => {
    expect(getNextArticle({ id: 'a' }, articles, categories, ['b', 'c', 'd'])).toBeNull();
  });
});

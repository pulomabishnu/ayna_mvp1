import { describe, it, expect } from 'vitest';
import { sortByBestMatch, bestMatchNeedsQuiz } from './bestMatchSort.js';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

describe('sortByBestMatch', () => {
  it('puts the highest match first', () => {
    const pct = { a: 40, b: 92, c: 71, d: 55 };
    expect(sortByBestMatch(items, (it) => pct[it.id]).map((it) => it.id)).toEqual(['b', 'c', 'd', 'a']);
  });

  it('treats a missing score as 0 and keeps ties in their incoming order', () => {
    const pct = { a: 60, c: 60 };
    expect(sortByBestMatch(items, (it) => pct[it.id]).map((it) => it.id)).toEqual(['a', 'c', 'b', 'd']);
  });

  it('uses the tie break before the incoming order', () => {
    const tie = (x, y) => (x.id < y.id ? 1 : -1);
    expect(sortByBestMatch(items, () => 50, tie).map((it) => it.id)).toEqual(['d', 'c', 'b', 'a']);
  });

  it('does not change the list it was given', () => {
    const copy = [...items];
    sortByBestMatch(items, (it) => (it.id === 'd' ? 99 : 1));
    expect(items).toEqual(copy);
  });
});

describe('bestMatchNeedsQuiz', () => {
  it('asks for the quiz only when Best match is picked without a profile', () => {
    expect(bestMatchNeedsQuiz('best', false)).toBe(true);
    expect(bestMatchNeedsQuiz('best', true)).toBe(false);
    expect(bestMatchNeedsQuiz('default', false)).toBe(false);
    expect(bestMatchNeedsQuiz('price-asc', false)).toBe(false);
  });
});

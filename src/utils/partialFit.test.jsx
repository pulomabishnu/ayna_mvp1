// Nov 5 (founder): every scored product shows its real percent, under 50 too. No "Partial fit" words.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { matchText, needHeadline, shownMatchPercent } from './matchDisplay.js';
import MatchPill from '../components/MatchPill.jsx';
import { compareRows } from '../components/pdp/commerce.js';
import { ALL_PRODUCTS } from '../data/products.js';

describe('every match shows its number', () => {
  it('prints the number at any score above 0', () => {
    expect(shownMatchPercent(49.4)).toBe(49);
    expect(shownMatchPercent(50)).toBe(50);
    expect(matchText(31)).toBe('31% match');
    expect(matchText(82)).toBe('82% match');
    expect(matchText(0)).toBe('');
    expect(needHeadline(31, 'period cramps')).toBe('31% for period cramps');
  });
  it('the pill shows 31%, never "Partial fit"', () => {
    const low = renderToStaticMarkup(<MatchPill percent={31} label="31% match for cramps" />);
    expect(low).toContain('31%');
    expect(low).not.toContain('Partial fit');
  });
  it('Compare "Your match" follows the same rule', () => {
    const [a, b] = ALL_PRODUCTS.slice(0, 2);
    const scores = new Map([[a.id, 31], [b.id, 77]]);
    const row = compareRows([a, b], { matchFor: (p) => scores.get(p.id) }).find((r) => r.label === 'Your match');
    expect(row.values).toEqual(['31% match', '77% match']);
  });
});

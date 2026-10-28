// One rule everywhere a % shows: under 50, no number, just "Partial fit".
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { matchText, needHeadline, shownMatchPercent, PARTIAL_FIT } from './matchDisplay.js';
import MatchPill from '../components/MatchPill.jsx';
import { compareRows } from '../components/pdp/commerce.js';
import { ALL_PRODUCTS } from '../data/products.js';

describe('partial fit rule', () => {
  it('prints a number only at 50 and up', () => {
    expect(shownMatchPercent(49.4)).toBe(null);
    expect(shownMatchPercent(50)).toBe(50);
    expect(matchText(31)).toBe(PARTIAL_FIT);
    expect(matchText(82)).toBe('82% match');
    expect(matchText(0)).toBe('');
    expect(needHeadline(31, 'period cramps')).toBe('Partial fit for period cramps');
    expect(needHeadline(82, 'period cramps')).toBe('82% for period cramps');
  });

  it('the pill says Partial fit, never 31%', () => {
    const low = renderToStaticMarkup(<MatchPill percent={31} label="31% match for cramps" />);
    expect(low).toContain('Partial fit');
    expect(low).not.toMatch(/31/);
    expect(renderToStaticMarkup(<MatchPill percent={88} />)).toContain('88%');
  });

  it('Compare "Your match" follows the same rule', () => {
    const [a, b] = ALL_PRODUCTS.slice(0, 2);
    const scores = new Map([[a.id, 31], [b.id, 77]]);
    const row = compareRows([a, b], { matchFor: (p) => scores.get(p.id) }).find((r) => r.label === 'Your match');
    expect(row.values).toEqual(['Partial fit', '77% match']);
  });
});

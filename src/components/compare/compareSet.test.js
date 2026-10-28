import { describe, expect, it } from 'vitest';
import { bestForProfile, compareSetRows, govEvidence, intendedUse } from './compareSet.js';
import { gradedResearch } from '../pdp/evidenceLevel.js';
import { ALL_PRODUCTS } from '../../data/products.js';

const a = ALL_PRODUCTS.find((p) => p.id === 'p-thermacare');
const b = ALL_PRODUCTS.find((p) => p.id === 'p-portable-heating');

describe('compareSetRows', () => {
  it('rows in the agreed order, with the one match rule', () => {
    const matchFor = (p) => (p.id === a.id ? 82 : 40);
    const detailsFor = (p) => ({ matchStatus: 'scored', percent: matchFor(p), reasonDetails: [{ text: 'Within your budget' }] });
    const rows = compareSetRows([a, b], { matchFor, detailsFor });
    const ids = rows.map((r) => r.id);
    expect(ids[0]).toBe('match');
    expect(ids.indexOf('price')).toBeLessThan(ids.indexOf('use'));
    expect(ids.indexOf('use')).toBeLessThan(ids.indexOf('format'));
    expect(ids.indexOf('format')).toBeLessThan(ids.indexOf('evidence'));
    const match = rows.find((r) => r.id === 'match');
    expect(match.values).toEqual(['82% match', 'Partial fit']);
    expect(rows.find((r) => r.id === 'prefs').values[0]).toBe('Within your budget');
  });

  it('evidence only from .gov-graded rows', () => {
    for (const p of [a, b]) {
      const graded = gradedResearch(p.id).find((g) => g.strength !== 'none');
      expect(govEvidence(p) === 'Not graded yet').toBe(!graded);
    }
    expect(govEvidence({ id: 'nope', evidenceStrength: 'strong' })).toBe('Not graded yet');
  });

  it('intended use is the team line or the summary, no em dashes', () => {
    expect(intendedUse({ summary: 'A pad for heavy days — with wings. More.' })).not.toMatch(/—/);
  });
});

describe('bestForProfile', () => {
  const d = (pct, confidence = 'high') => ({ matchStatus: 'scored', percent: pct, confidence, reasonDetails: [{ component: 'primaryGoal', text: 'For your period cramps' }], needMatches: [], reasons: [] });
  it('needs a profile', () => {
    expect(bestForProfile([a, b], null)).toBeNull();
    expect(bestForProfile([a, b], () => ({ matchStatus: 'no-profile' }))).toBeNull();
  });
  it('not with limited confidence or a near tie', () => {
    expect(bestForProfile([a, b], (p) => d(p === a ? 80 : 50, 'limited'))).toBeNull();
    expect(bestForProfile([a, b], (p) => d(p === a ? 80 : 79))).toBeNull();
  });
});

describe('compare rows a shopper needs (TD 21)', () => {
  const pad = ALL_PRODUCTS.find((p) => p.id === 'p-viboos-heating-pad');
  it('always has Match, Preferences and Reviews rows', () => {
    const ids = compareSetRows([a, b]).map((r) => r.id);
    for (const id of ['match', 'prefs', 'reviews', 'safety']) expect(ids).toContain(id);
  });
  it('format is the real format, not the category', () => {
    const fmt = compareSetRows([a, pad]).find((r) => r.id === 'format').values;
    expect(fmt.some((v) => /cramp relief/i.test(v))).toBe(false);
    expect(fmt[1]).toMatch(/Device/);
  });
  it('safety shows label warnings when they exist', () => {
    const safety = compareSetRows([a, { ...pad, warnings: ['Never use a heating pad while you are asleep.'] }]).find((r) => r.id === 'safety').values;
    expect(safety[1]).toMatch(/asleep/);
    expect(compareSetRows([a, pad]).find((r) => r.id === 'safety').values[1]).toMatch(/burn/i);
    expect(safety[1]).not.toBe('None flagged');
  });
});

describe('sample comparison, signed out (info-pages audit issue 3)', () => {
  it('the three sample cups are real catalog products', () => {
    for (const id of ['p-saalt-cup', 'p-diva-cup', 'p-lunette-cup']) expect(ALL_PRODUCTS.find((p) => p.id === id)).toBeTruthy();
  });
  it('without her answers the match row says "See your match", never a number', () => {
    const cups = ['p-saalt-cup', 'p-diva-cup', 'p-lunette-cup'].map((id) => ALL_PRODUCTS.find((p) => p.id === id));
    const match = compareSetRows(cups, { noProfileText: 'See your match' }).find((r) => r.id === 'match');
    expect(match.values).toEqual(['See your match', 'See your match', 'See your match']);
    expect(match.noProfile).toBe(true);
    expect(match.values.join(' ')).not.toMatch(/%/);
  });
});

describe('objective rows (critique Oct 27: only objective marks, only with data)', () => {
  const cup = (id, price, years) => ({ id, name: id, category: 'cup', price: `$${price} (reusable up to ${years} years)` });
  it('marks the lower cost per use and the longer life, never a tie or a lone value', () => {
    const rows = compareSetRows([cup('a', 29, 10), cup('b', 30, 5)]);
    const per = rows.find((r) => r.id === 'perUse');
    const life = rows.find((r) => r.id === 'life');
    expect(per.better).toEqual([true, false]);
    expect(life.better).toEqual([true, false]);
    const tie = compareSetRows([cup('a', 24, 10), cup('b', 24, 10)]);
    expect(tie.find((r) => r.id === 'life').better).toEqual([false, false]);
    const lone = compareSetRows([cup('a', 29, 10), { id: 'c', name: 'c', category: 'pad', price: '$8' }]);
    expect(lone.find((r) => r.id === 'life').better).toEqual([false, false]);
  });
  it('FSA/HSA is marked only when the products differ', () => {
    const fsa = compareSetRows([cup('a', 29, 10), cup('b', 30, 5)]).find((r) => r.id === 'fsa');
    expect(fsa.better).toEqual([false, false]);
  });
});

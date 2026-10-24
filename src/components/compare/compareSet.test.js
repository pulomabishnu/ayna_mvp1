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

import { describe, it, expect } from 'vitest';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct, findConfidentProductMatch } from './naturalLanguageSearch';

// Test fixtures only — synthetic items shaped like catalog entries.
const inositol = {
  id: 'inositol-test',
  name: 'Myo Inositol Powder',
  brand: 'TestBrand',
  category: 'supplement',
  tags: ['inositol', 'pcos'],
  summary: 'A myo-inositol supplement.',
};
const cup = {
  id: 'cup-test',
  name: 'Reusable Menstrual Cup',
  brand: 'CupCo',
  category: 'cup',
  tags: ['reusable', 'menstrual cup'],
  summary: 'A soft silicone menstrual cup.',
};
const chair = {
  id: 'chair-test',
  name: 'Pelvic Floor Chair Treatment',
  brand: 'ChairCo',
  category: 'pelvic-floor',
  tags: ['pelvic floor'],
  summary: 'An in-clinic chair.',
};
const fertility = {
  id: 'fert-test',
  name: 'Fertility Support Blend',
  brand: 'FertCo',
  category: 'supplement',
  tags: ['fertility', 'ovulation'],
  summary: 'Supplement for people tracking ovulation.',
};
const winning = {
  id: 'win-test',
  name: 'Award Cup',
  brand: 'WinCo',
  category: 'cup',
  tags: ['award winning'],
  summary: 'A cup.',
};

const score = (q, item) => scoreQueryAgainstProduct(q, buildSearchTextForItem(item), buildIdentityTextForItem(item));

describe('scoreQueryAgainstProduct — typo tolerance', () => {
  it('"inosital" finds inositol', () => {
    expect(score('inosital', inositol)).toBeGreaterThan(0);
  });

  it('"menstural cup" finds menstrual cups and not unrelated products', () => {
    expect(score('menstural cup', cup)).toBeGreaterThan(0);
    expect(score('menstural cup', inositol)).toBe(0);
  });

  it('"concieve" (typo) resolves to conceive aliases and finds fertility products', () => {
    expect(score('concieve', fertility)).toBeGreaterThan(0);
  });

  it('"trying to conceive" and "ttc" find fertility products via aliases', () => {
    expect(score('trying to conceive', fertility)).toBeGreaterThan(0);
    expect(score('ttc', fertility)).toBeGreaterThan(0);
  });

  it('short words do not fuzz across a length change ("hair" does not match "chair")', () => {
    expect(score('hair', chair)).toBe(0);
  });

  it('words under 4 letters never fuzz ("cap" does not match "cup")', () => {
    expect(score('cap', cup)).toBe(0);
  });

  it('distinct longer words of different length do not match ("thinning" vs "winning")', () => {
    expect(score('thinning', winning)).toBe(0);
  });

  it('exact matches score at least as high as typo matches', () => {
    expect(score('inositol', inositol)).toBeGreaterThanOrEqual(score('inosital', inositol));
  });

  it('findConfidentProductMatch still resolves a product-name search with a typo', () => {
    expect(findConfidentProductMatch('myo inosital powder', [inositol, cup, chair])).toBe('inositol-test');
  });
});

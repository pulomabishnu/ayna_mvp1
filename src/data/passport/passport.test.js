import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../products.js';
import { getPassport, canonicalizeIngredient, lintText, matchCeiling } from './index.js';
import { PASSPORT_REVIEWS } from './reviews.js';
import { buildProductSections } from './content.js';
import { findHardTerms, planGlossaryTerms, getGlossaryEntry } from '../glossary.js';

describe('product passport', () => {
  it('builds a passport for every catalog product; unreviewed ones are Not reviewed and unverified', () => {
    for (const p of ALL_PRODUCTS) {
      const pp = getPassport(p);
      if (!PASSPORT_REVIEWS[p.id]) {
        expect(pp.qa.label).toBe('Not reviewed');
        expect(pp.identity.name.verified_at).toBeNull();
        expect(pp.dates.last_verified).toBeNull();
      }
      expect(pp.completeness.overall).toBeGreaterThanOrEqual(0);
      expect(pp.completeness.overall).toBeLessThanOrEqual(100);
    }
  });

  it('never turns not-found into false', () => {
    const pp = getPassport({ id: 't', name: 'Test wash', category: 'intimate-care', type: 'physical', safety: {} });
    expect(pp.composition.fragrance.known).toBe(false);
    expect(pp.composition.fragrance.value).toBeNull();
    expect(pp.safety.pregnancy.known).toBe(false);
    expect(pp.composition.latex.value).not.toBe(false);
  });

  it('reads fragrance-free only when the catalog says so', () => {
    const pp = getPassport({ id: 't2', name: 'Pad', category: 'pad', type: 'physical', safety: { allergens: 'Fragrance-free, dye-free' } });
    expect(pp.composition.fragrance).toMatchObject({ known: true, value: 'fragrance-free', source: 'ayna catalog (unverified)' });
  });

  it('canonicalizes ingredient aliases', () => {
    expect(canonicalizeIngredient('Magnesium bisglycinate 200mg')).toBe('magnesium');
    expect(canonicalizeIngredient('magnesium glycinate')).toBe('magnesium');
    expect(canonicalizeIngredient('Vitamin D3 (cholecalciferol)')).toBe('vitamin-d');
    expect(canonicalizeIngredient('L. rhamnosus GR-1')).toBe('probiotic');
    expect(canonicalizeIngredient('unobtainium')).toBeNull();
  });

  it('flags dangerous wording but not negated or product-function uses', () => {
    expect(lintText('Clinically proven to cure cramps.').map((h) => h.rule)).toEqual(expect.arrayContaining(['clinically-proven', 'cure']));
    expect(lintText('This is not a cure.')).toHaveLength(0);
    expect(lintText('Wings help prevent leaks.')).toHaveLength(0);
    expect(lintText('May help prevent UTIs.')[0].severity).toBe('low');
  });

  it('caps the match for a passport with critical gaps', () => {
    expect(matchCeiling({ id: 'x', name: 'X', category: 'pad', type: 'physical', safety: {} })).toBeLessThan(80);
  });

  it('builds page sections without inventing text, and lists what we do not know', () => {
    const product = ALL_PRODUCTS.find((p) => p.id === 'p-vitex');
    const sections = buildProductSections(product);
    const ids = sections.map((s) => s.id);
    expect(ids[0]).toBe('what');
    expect(ids).toContain('unknown');
    for (const s of sections) expect(s.blocks.length).toBeGreaterThan(0);
  });
});

describe('central glossary', () => {
  it('finds hard terms once and respects case-sensitive entries', () => {
    expect(findHardTerms('Take an NSAID. The phone is fine. pH matters.').map((h) => h.entry.term)).toEqual(['NSAID', 'pH']);
    expect(planGlossaryTerms([{ key: 'a', text: 'inositol, inositol' }, { key: 'b', text: 'inositol' }])).toEqual({ a: ['Inositol'] });
  });

  it('has structured entries with review fields', () => {
    const e = getGlossaryEntry('contraindication');
    expect(e).toMatchObject({ term: 'Contraindication', reviewed_by: null, last_reviewed: null });
    expect(getGlossaryEntry('Perimenopause')).toBeTruthy(); // migrated from the app glossary
  });
});

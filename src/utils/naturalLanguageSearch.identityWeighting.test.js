import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../data/products';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from './naturalLanguageSearch';

/**
 * Regression coverage for a reported bug: an MVP user (Sriya Vedartham)
 * searched "vitamins" and kept getting irrelevant results like body oil.
 * Root cause: "Hatch Belly Oil" (a pregnancy skin-care oil, category
 * 'pregnancy') mentions "Vitamin E" once in its doctorOpinion prose, which
 * scored identically to products whose actual name/category IS a vitamin
 * (e.g. "Ritual Prenatal Vitamin"), because scoreQueryAgainstProduct only
 * counted hit/no-hit against one flattened haystack with no notion of WHERE
 * the match occurred. Fixed by scoring identity-field matches (name, brand,
 * category, tags, healthFunctions) above prose-only matches — real scorer,
 * real catalog data, matching how Discovery.jsx actually calls it.
 */
function topMatchesFor(query) {
  return ALL_PRODUCTS
    .map((p) => ({
      product: p,
      score: scoreQueryAgainstProduct(
        query,
        buildSearchTextForItem(p, CATEGORY_LABELS),
        buildIdentityTextForItem(p, CATEGORY_LABELS)
      ),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

describe('search identity-field weighting', () => {
  it('"vitamins" ranks a real vitamin product above Hatch Belly Oil (a skin oil that only mentions "Vitamin E" in prose)', () => {
    const results = topMatchesFor('vitamins');
    const hatchOil = results.find((r) => r.product.id === 'p-hatch-oil');
    const realVitamin = results.find((r) => /vitamin/i.test(r.product.name));
    expect(realVitamin).toBeTruthy();
    expect(results[0].product.id).toBe(realVitamin.product.id);
    if (hatchOil) {
      expect(realVitamin.score).toBeGreaterThan(hatchOil.score);
    }
  });

  it('"prenatal vitamin" ranks Ritual Prenatal Vitamin first, well above any prose-only mention', () => {
    const results = topMatchesFor('prenatal vitamin');
    expect(results[0].product.id).toBe('p-rituals-prenatal');
    const hatchOil = results.find((r) => r.product.id === 'p-hatch-oil');
    if (hatchOil) {
      expect(results[0].score).toBeGreaterThan(hatchOil.score * 2);
    }
  });

  it('legitimate oil queries still correctly surface Hatch Belly Oil first (identity weighting is not one-directional)', () => {
    const results = topMatchesFor('pregnancy skin oil');
    expect(results[0].product.id).toBe('p-hatch-oil');
  });

  it('a query with no identity haystack argument (old call signature) still works unchanged', () => {
    const item = { name: 'Ritual Prenatal Vitamin', category: 'supplement' };
    const haystack = buildSearchTextForItem(item, CATEGORY_LABELS);
    expect(scoreQueryAgainstProduct('vitamin', haystack)).toBeGreaterThan(0);
  });
});

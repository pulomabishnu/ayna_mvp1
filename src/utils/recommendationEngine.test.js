import { describe, it, expect } from 'vitest';
import { generateTieredRecommendations, scoreProduct } from './recommendationEngine';

// Live bug (2026-08-25): selecting certain "What do you want help with?"
// checkboxes produced no shelf at all in the ecosystem. Two separate causes
// found — this file locks in the fix for the one in this module (the local,
// instant-preview engine); the other (a too-low MAX_CONCERNS ceiling in
// api/llm-recommendations.js) is server-side and covered by that route's
// own test suite.

describe('generateTieredRecommendations — every CONCERN_AREAS checkbox produces a concern entry', () => {
  it('"Hormonal bloating" is no longer silently dropped (was missing from CONCERN_CONFIG entirely)', () => {
    const result = generateTieredRecommendations({ primaryConcerns: ['Hormonal bloating'] });
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].concern).toBe('Hormonal bloating');
  });

  it('"STI support" matches a real product via category, not just a coincidental tag', () => {
    const result = generateTieredRecommendations({ primaryConcerns: ['STI support'] });
    expect(result.length).toBeGreaterThan(0);
    const hasAnyTier = result[0].tiers.some((t) => t.product);
    expect(hasAnyTier).toBe(true);
  });

  it('"Mental health and cycle mood support" matches via the mental-health category', () => {
    const result = generateTieredRecommendations({ primaryConcerns: ['Mental health and cycle mood support'] });
    expect(result.length).toBeGreaterThan(0);
    const hasAnyTier = result[0].tiers.some((t) => t.product);
    expect(hasAnyTier).toBe(true);
  });

  it('"Sleep and energy" matches via the sleep category', () => {
    const result = generateTieredRecommendations({ primaryConcerns: ['Sleep and energy'] });
    expect(result.length).toBeGreaterThan(0);
    const hasAnyTier = result[0].tiers.some((t) => t.product);
    expect(hasAnyTier).toBe(true);
  });

  it('"Telehealth and provider matching" matches via the telehealth category alone (no tags configured)', () => {
    const result = generateTieredRecommendations({ primaryConcerns: ['Telehealth and provider matching'] });
    expect(result.length).toBeGreaterThan(0);
    const hasAnyTier = result[0].tiers.some((t) => t.product);
    expect(hasAnyTier).toBe(true);
  });

  // Real beta feedback (Theresa Mahon, 2026-08-25): "Fertility and
  // conception isn't comprehensive enough" — added as their own checkboxes.
  // Unlike the others above, this only asserts the concern entry itself
  // isn't silently dropped, not that it matches a product: the live
  // Supabase catalog already carries 13 'pregnancy' + 5 'postpartum'
  // products, but this module's local static preview catalog
  // (src/data/products.js) doesn't mirror them — same known gap already
  // documented for 'Skin and hair' above. The LLM-backed final generation
  // (api/llm-recommendations.js) isn't limited to this static catalog.
  it('"Pregnancy support" and "Postpartum recovery" are real concern entries, not silently dropped', () => {
    for (const concern of [
      'Pregnancy support (prenatal vitamins, trackers, comfort)',
      'Postpartum recovery (nursing, healing, comfort)',
    ]) {
      const result = generateTieredRecommendations({ primaryConcerns: [concern] });
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].concern).toBe(concern);
    }
  });

  it('does not silently truncate when more than 5 concerns are selected', () => {
    const manyConcerns = [
      'Period care (pads, tampons, cups, discs, underwear)',
      'Cramp and pain relief (devices, supplements, heat)',
      'Hormone balance (supplements, lifestyle)',
      'Hormonal bloating',
      'PCOS management (supplements, telehealth, apps)',
      'UTI support',
      'Perimenopause and menopause support',
    ];
    const result = generateTieredRecommendations({ primaryConcerns: manyConcerns });
    const returnedConcerns = new Set(result.map((r) => r.concern));
    // Every selected concern that has a CONCERN_CONFIG entry should show up —
    // not just the first 5 (the old cap).
    for (const c of manyConcerns) {
      expect(returnedConcerns.has(c)).toBe(true);
    }
  });
});

// Live gap (2026-08-24 meeting): Puloma asked that FSA/HSA-eligible products
// be prioritized when a user has one. Aditi said it should already be
// integrated — it wasn't. scoreProduct had zero FSA/HSA logic at all.
describe('scoreProduct — FSA/HSA prioritization', () => {
  const concern = { key: 'test', tags: [] };

  it('scores an FSA-eligible product higher when the user has an FSA', () => {
    const eligible = { tags: [], fsaEligible: true };
    const notEligible = { tags: [] };
    const intake = { fsaHsa: 'fsa' };
    expect(scoreProduct(eligible, intake, concern)).toBeGreaterThan(scoreProduct(notEligible, intake, concern));
  });

  it('does not boost an FSA-only-eligible product for a user who only has an HSA', () => {
    const fsaOnly = { tags: [], fsaEligible: true };
    const intake = { fsaHsa: 'hsa' };
    expect(scoreProduct(fsaOnly, intake, concern)).toBe(scoreProduct({ tags: [] }, intake, concern));
  });

  it('"both" matches a product eligible for either', () => {
    const hsaOnly = { tags: [], hsaEligible: true };
    const intake = { fsaHsa: 'both' };
    expect(scoreProduct(hsaOnly, intake, concern)).toBeGreaterThan(scoreProduct({ tags: [] }, intake, concern));
  });

  it('does not boost anything when the user never answered the FSA/HSA question', () => {
    const eligible = { tags: [], fsaHsaEligible: true };
    const intake = { fsaHsa: '' };
    expect(scoreProduct(eligible, intake, concern)).toBe(scoreProduct({ tags: [] }, intake, concern));
  });

  it('respects the snake_case field variant the catalog also uses', () => {
    const eligible = { tags: [], fsa_eligible: true };
    const intake = { fsaHsa: 'fsa' };
    expect(scoreProduct(eligible, intake, concern)).toBeGreaterThan(scoreProduct({ tags: [] }, intake, concern));
  });
});

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

  it('does not fill STI support with unrelated generic diagnostic products', () => {
    const result = generateTieredRecommendations({ primaryConcerns: ['STI support'] });
    expect(result.length).toBeGreaterThan(0);
    // The needs engine only fills a tier with a product matched to the STI
    // need itself (e.g. an STI telehealth service), never a generic test kit.
    result[0].tiers.forEach((tier) => {
      expect(tier.needId).toBe('sexual.sti');
      // A diagnostic only belongs here if it is an actual STI test.
      if (tier.product.category === 'diagnostics') expect(tier.product.name).toMatch(/STI|chlamydia|gonorrh/i);
    });
  });

  it('keeps UTI pain relief out of cramp and hormone sections', () => {
    const result = generateTieredRecommendations({ primaryConcerns: [
      'Cramp and pain relief (devices, supplements, heat)',
      'Hormone balance (supplements, lifestyle)',
    ] });
    expect(result.flatMap((section) => section.tiers.map((tier) => tier.product.name)))
      .not.toContain('Winx Health UTI Fast-Acting Pain Relief');
  });

  it('"Mental health and cycle mood support" still produces its concern entry', () => {
    const result = generateTieredRecommendations({ primaryConcerns: ['Mental health and cycle mood support'] });
    expect(result.length).toBeGreaterThan(0);
    // Tiers only hold products the ecosystem engine would also qualify (Pass 8):
    // a supplement whose evidence isn't for this claim is never a pick.
    result[0].tiers.forEach((t) => expect(t.product?.id).not.toBe('p-flo-gummies'));
  });

  it('never offers an herbal with unknown pregnancy safety to someone pregnant or TTC (Pass 8)', () => {
    for (const life of ['I am pregnant', 'I am trying to conceive']) {
      const result = generateTieredRecommendations({ personalizationCompleted: true, lifeStageSelections: [life], supportSelections: ['PMS symptoms', 'Mood swings', 'Cycle-related bloating'], age: 28 });
      const ids = result.flatMap((section) => section.tiers.map((tier) => tier.product?.id));
      expect(ids).not.toContain('p-flo-gummies');
    }
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
  const concern = { key: 'Period care', tags: ['heavy-flow'] };
  const relevant = { id: 'pad', name: 'Flow pad', category: 'pad', tags: ['heavy-flow'], healthFunctions: ['menstrual-collection'] };
  const profile = { supportSelections: ['Heavy periods'] };

  it('scores an FSA-eligible product higher when the user has an FSA', () => {
    const eligible = { ...relevant, fsaEligible: true };
    const notEligible = { ...relevant };
    const intake = { ...profile, fsaHsa: 'fsa' };
    expect(scoreProduct(eligible, intake, concern)).toBeGreaterThan(scoreProduct(notEligible, intake, concern));
  });

  it('does not boost an FSA-only-eligible product for a user who only has an HSA', () => {
    const fsaOnly = { ...relevant, fsaEligible: true };
    const intake = { ...profile, fsaHsa: 'hsa' };
    expect(scoreProduct(fsaOnly, intake, concern)).toBe(scoreProduct({ ...relevant }, intake, concern));
  });

  it('"both" matches a product eligible for either', () => {
    const hsaOnly = { ...relevant, hsaEligible: true };
    const intake = { ...profile, fsaHsa: 'both' };
    expect(scoreProduct(hsaOnly, intake, concern)).toBeGreaterThan(scoreProduct({ ...relevant }, intake, concern));
  });

  it('does not boost anything when the user never answered the FSA/HSA question', () => {
    const eligible = { ...relevant, fsaHsaEligible: true };
    const intake = { ...profile, fsaHsa: '' };
    expect(scoreProduct(eligible, intake, concern)).toBe(scoreProduct({ ...relevant }, intake, concern));
  });

  it('respects the snake_case field variant the catalog also uses', () => {
    const eligible = { ...relevant, fsa_eligible: true };
    const intake = { ...profile, fsaHsa: 'fsa' };
    expect(scoreProduct(eligible, intake, concern)).toBeGreaterThan(scoreProduct({ ...relevant }, intake, concern));
  });
});

// Step 2: tiers are built on the matching engine (src/matching).
describe('generateTieredRecommendations — matching engine', () => {
  it('scores a concern only on the needs she selected inside it, and every tier clears the 50 bar', () => {
    const intake = {
      supportSelections: ['Heavy periods', 'Cramps or period pain'],
      primaryConcerns: ['Period care (pads, tampons, cups, discs, underwear)', 'Cramp and pain relief (devices, supplements, heat)'],
      periodFlow: 'Very heavy',
    };
    const result = generateTieredRecommendations(intake);
    const period = result.find((r) => r.concern.startsWith('Period care'));
    expect(period.needIds).toEqual(['period.heavy']);
    expect(period.tiers.length).toBeGreaterThan(0);
    period.tiers.forEach((t) => {
      expect(t.needId).toBe('period.heavy');
      expect(t.score).toBeGreaterThanOrEqual(50);
      expect(t.product.category).not.toBe('cramp-relief');
    });
    expect(period.notes.some((n) => /Very heavy periods/.test(n))).toBe(true);
    const cramps = result.find((r) => r.concern.startsWith('Cramp'));
    expect(cramps.needIds).toEqual(['pain.menstrual_cramp']);
  });

  it('returns fewer tiers instead of weak ones', () => {
    const result = generateTieredRecommendations({ supportSelections: ['Joint aches'], primaryConcerns: ['Perimenopause and menopause support'] });
    expect(result[0].tiers.every((t) => t.score >= 50)).toBe(true);
    expect(result[0].tiers.length).toBeLessThan(5);
  });

  it('never tiers an excluded product', () => {
    const result = generateTieredRecommendations({ supportSelections: ['Cramps or period pain'], primaryConcerns: ['Cramp and pain relief (devices, supplements, heat)'], avoidRepeat: ['ThermaCare'] });
    const ids = result[0].tiers.flatMap((t) => [t.product.id, ...t.alternatives.map((a) => a.id)]);
    expect(ids.some((id) => /thermacare/.test(id))).toBe(false);
  });
});

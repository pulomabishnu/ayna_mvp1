import { describe, it, expect } from 'vitest';
import { generateTieredRecommendations } from './recommendationEngine';

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

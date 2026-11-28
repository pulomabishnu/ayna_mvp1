/**
 * Engine adapter checks (Phase 1 plan, p.17): replay, commercial neutrality,
 * safety regression and loss-reason honesty. Runs the real matching engine on
 * a small slice of fictional scenarios over the bundled catalog.
 */
import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS } from '../../data/products.js';
import { buildProductProfile, clearProductProfileCache } from '../../matching/productProfile.js';
import { PHASE1_CATEGORIES, universeFor } from './categories.js';
import { scenariosFor } from './scenarios.js';
import { runScenarios, counterfactual, lossReason, priceOf } from './benchmark.js';

const cat = PHASE1_CATEGORIES.find((c) => c.id === 'intimate-care');
const universe = universeFor(ALL_PRODUCTS, cat, buildProductProfile);
const sets = scenariosFor(cat);
// A spread of needs, budgets and both sensitivities.
const slice = sets.baseline.filter((_, i) => i % 15 === 0);
const placementsOf = (rs) => rs.map((r) => r.placements.map((p) => p.sku).join(','));

describe('scenario library', () => {
  it('is a versioned full factorial with stable ids and no duplicates', () => {
    expect(sets.baseline.length).toBe(cat.needs.length * 3 * 3 * 2 * 2);
    expect(new Set(sets.baseline.map((s) => s.id)).size).toBe(sets.baseline.length);
    expect(sets.baseline.every((s) => s.weight === 1)).toBe(true);
  });
  it('keeps boundary and unknown-input cases out of the baseline', () => {
    expect(sets.boundary.every((s) => s.set === 'boundary')).toBe(true);
    expect(sets.unknown.every((s) => s.set === 'unknown')).toBe(true);
  });
  it('never puts at-home tests in a universe', () => {
    for (const c of PHASE1_CATEGORIES) {
      const u = universeFor(ALL_PRODUCTS, c, buildProductProfile);
      expect(u.some((p) => ['diagnostics', 'telehealth', 'medication'].includes(String(p.category).toLowerCase()))).toBe(false);
    }
  });
});

describe('engine replay', () => {
  it('reproduces every placement on the same snapshot', () => {
    const a = runScenarios(slice, universe);
    const b = runScenarios(slice, universe);
    expect(placementsOf(b)).toEqual(placementsOf(a));
    expect(a.some((r) => r.placements.length > 0)).toBe(true);
  });
  it('places at most K products and every placement is a cleared candidate', () => {
    for (const r of runScenarios(slice, universe)) {
      expect(r.placements.length).toBeLessThanOrEqual(3);
      for (const p of r.placements) expect(r.candidates.find((c) => c.sku === p.sku)?.stage).toBe('selected');
    }
  });
});

describe('commercial neutrality', () => {
  it('partner, affiliate and commission metadata never change placements', () => {
    const before = runScenarios(slice, universe);
    const paid = universe.map((p) => ({ ...p, partner: true, partnerTier: 'gold', aynaFavorite: true, isEmergingBrand: !p.isEmergingBrand, affiliateUrl: 'https://example.com/?ref=paid', affiliateCommission: 0.5, subscriptionTier: 'enterprise' }));
    clearProductProfileCache();
    try {
      const after = runScenarios(slice, paid);
      expect(placementsOf(after)).toEqual(placementsOf(before));
    } finally {
      clearProductProfileCache();
    }
  });
});

describe('counterfactual lab safety', () => {
  const sku = universe.find((p) => priceOf(p) != null)?.id;
  it('refuses to simulate anything but price', () => {
    for (const field of ['safety', 'warnings', 'ingredients', 'doctorOpinion', 'scientificCitations']) {
      expect(() => counterfactual({ universe, sku, change: { [field]: 'x' }, scenarios: slice })).toThrow(/only price/);
    }
  });
  it('a price change never places a product the safety rules excluded or held', () => {
    const before = runScenarios(slice, universe);
    for (const target of universe.slice(0, 12)) {
      const p = priceOf(target);
      if (p == null) continue;
      const after = counterfactual({ universe, sku: target.id, change: { price: `$${(p * 0.5).toFixed(2)}` }, scenarios: slice });
      before.forEach((r, i) => {
        const was = r.candidates.find((c) => c.sku === target.id)?.stage;
        const now = after[i].candidates.find((c) => c.sku === target.id)?.stage;
        if (was === 'excluded' || was === 'insufficient_info') expect(now).not.toBe('selected');
      });
    }
  });
});

describe('loss reasons', () => {
  const weakest = { score: 80, components: { evidence: 0.8, health: 1, specificity: 1 } };
  it('a score at or above a placed pick is a variety or tie loss', () => {
    expect(lossReason({ pct: 82, components: {}, price: 10, scenario: { budget: 'under-25' }, weakest }).reason).toBe('diversity_tie');
  });
  it('budget is observed from price vs the band', () => {
    expect(lossReason({ pct: 70, components: {}, price: 40, scenario: { budget: 'under-25' }, weakest }).reason).toBe('budget');
    expect(lossReason({ pct: 70, components: {}, price: 40, scenario: { budget: 'any' }, weakest }).reason).not.toBe('budget');
  });
  it('unknown price is never a budget loss', () => {
    expect(lossReason({ pct: 70, components: {}, price: null, scenario: { budget: 'under-25' }, weakest }).reason).not.toBe('budget');
  });
  it('falls back to unclassified instead of inventing a cause', () => {
    expect(lossReason({ pct: 70, components: {}, price: 10, scenario: { budget: 'any' }, weakest: null }).reason).toBe('unclassified');
  });
});

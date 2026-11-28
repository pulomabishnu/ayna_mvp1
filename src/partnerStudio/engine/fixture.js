/**
 * Fictional seed data for tests (Phase 1 plan, p.17: "a working mock with
 * fictional seed data"). Brands, products and claims here are made up.
 * Built through the real rollup code so the shape always matches the API.
 */
import { brandRollup } from './rollup.js';
import { compactScenarios } from './explore.js';

const CATEGORY = { id: 'demo-care', label: 'Demo care', needs: ['Need one', 'Need two'], format: 'Gels' };
const UNIVERSE = [
  { id: 'demo-1', name: 'Demo Gel', brand: 'Demo Brand' },
  { id: 'peer-1', name: 'Peer Gel', brand: 'Peer Co', partner: true },
  { id: 'peer-2', name: 'Peer Balm', brand: 'Peer Co' },
  { id: 'other-1', name: 'Other Wash', brand: 'Other Labs' },
];

function results(set) {
  const out = [];
  for (let i = 0; i < 24; i += 1) {
    const need = CATEGORY.needs[i % 2];
    const budget = ['under-25', '25-75', 'any'][i % 3];
    const placements = [];
    if (i % 3 === 0) placements.push({ sku: 'demo-1', name: 'Demo Gel', brand: 'Demo Brand' });
    placements.push({ sku: 'peer-1', name: 'Peer Gel', brand: 'Peer Co' });
    if (i % 4 !== 0) placements.push({ sku: 'peer-2', name: 'Peer Balm', brand: 'Peer Co' });
    const candidates = placements.map((p) => ({ ...p, stage: 'selected', pct: 80 }));
    if (i % 3 === 1) candidates.push({ sku: 'demo-1', name: 'Demo Gel', brand: 'Demo Brand', stage: 'eligible_lost', pct: 60, reason: i % 2 ? 'budget' : 'evidence', detail: 'Fictional trace' });
    if (i % 3 === 2) candidates.push({ sku: 'demo-1', name: 'Demo Gel', brand: 'Demo Brand', stage: set === 'boundary' ? 'excluded' : 'insufficient_info', pct: null, detail: 'allergen_info' });
    candidates.push({ sku: 'other-1', name: 'Other Wash', brand: 'Other Labs', stage: 'eligible_lost', pct: 40, reason: 'below_cutoff', detail: 'Fictional trace' });
    out.push({ scenarioId: `${set}-${i}`, set, label: `${need} · fictional ${i}`, need, budget, format: i % 2 ? 'Gels' : null, weight: 1, k: 3, placements, candidates });
  }
  return out;
}

const claim = (text, status, themes, flags = []) => ({ text, status, evidenceType: null, strength: 'limited', productSpecific: true, sourceUrl: 'https://example.com/claim', themes, flags });
const record = (sku, name, brand, claims, completeness) => ({
  sku, name, brand, categories: ['demo-care'], productCategory: 'gel', price: 20, reviewed: false,
  qa: { status: 'in_review', label: 'In review', by: 'fixture', at: '2026-11-01' },
  claims, sources: [{ title: 'Fictional study', url: 'https://example.com/study', type: 'ingredient_research' }],
  verifiedAt: '2026-11-01', reviewDue: '2027-11-01', freshness: { state: 'current', lastVerified: '2026-11-01', daysOverdue: 0 },
  completeness, sections: [], dimensions: { materials: 'complete', instructions: 'present', regulatory: 'Unknown' },
});

export function fixtureSnapshot() {
  const evidence = [
    record('demo-1', 'Demo Gel', 'Demo Brand', [claim('Comfort for up to eight hours', 'brand_reported', ['relief', 'quantified'], [{ id: 'numeric_brand_only', label: 'Number backed only by brand-reported data' }])], 80),
    record('peer-1', 'Peer Gel', 'Peer Co', [claim('Relieves dryness', 'direct', ['relief', 'moisture'])], 70),
    record('peer-2', 'Peer Balm', 'Peer Co', [], 60),
  ];
  const sims = [{ sku: 'demo-1', name: 'Demo Gel', category: 'demo-care', scenarios: 24, change: { field: 'price', from: 20, to: 16 }, changeLabel: '$16 (was $20)', before: { inclusion: { num: 8, den: 24, value: 8 / 24 }, skuSlots: 8 }, after: { inclusion: { num: 10, den: 24, value: 10 / 24 }, skuSlots: 10 }, displacedOtherSlots: 2, safetyOk: true }];
  const skus = [{ id: 'demo-1', name: 'Demo Gel', category: 'gel', price: 20, inScope: true, categories: ['demo-care'], scopeNote: null }];
  const feed = [{ type: 'stale', sku: 'demo-1', name: 'Demo Gel', date: '2026-10-01', days: 12, title: 'Facts 12 days past review', detail: 'Last verified 2026-10-01.' }];
  const baseline = results('baseline');
  const demo = brandRollup({ brand: 'Demo Brand', categories: [{ category: CATEGORY, baseline, boundary: results('boundary'), unknown: results('unknown') }], evidence, simulations: sims, skus, feed });
  return {
    run: { runId: 'run-fixture', createdAt: '2026-11-25T00:00:00.000Z', scenarioSetVersion: 'scn-fixture', categorySetVersion: 'cat-fixture', adapterVersion: 'adapter-fixture', engine: 'fixture', gitSha: 'fixture', k: 3, weights: 'equal', deterministic: true, seconds: 0 },
    categories: [{ id: 'demo-care', label: 'Demo care', needs: CATEGORY.needs, catalogVersion: 'fixture', universe: 4, brands: 3, baseline: 24, boundary: 24, unknown: 24, noResult: 0, unfilled: 6, k: 3, format: CATEGORY.format, ...compactScenarios(baseline, UNIVERSE, (p) => p.brand, (p) => p.partner) }],
    outOfScope: 'Fixture: out of scope.',
    brands: {
      'Demo Brand': { ...demo, displayName: 'Demo Brand' },
      'Out Of Scope Co': { brand: 'Out Of Scope Co', displayName: 'Out Of Scope Co', skus: [{ id: 'x', name: 'Test Kit', category: 'diagnostics', inScope: false, categories: [], scopeNote: 'At-home testing needs its own rubric.' }], categories: [], actions: [], feed: [] },
    },
  };
}

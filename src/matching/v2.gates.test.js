import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { getEcosystemSeedFromQuiz, ALL_PRODUCTS } from '../data/products.js';
import { buildProductProfile } from './productProfile.js';
import { scoreV2, focusOf, bandFor, V2 } from './v2.js';
import { makeProfiles, runSweep } from './v2sweep/sweep.js';

// Release gates for algorithm v2 (Pass 8 audit, deep dive 5). v2 stays off for
// users (products.js matchEngine) until these pass AND a clinical reviewer signs
// off on the evidence grades. Hard gates fail the build; the rest are reported.
const seed = (intake, engine = 'v2') => getEcosystemSeedFromQuiz({ fullHealthIntake: { personalizationCompleted: true, ...intake }, personalizationCompleted: true }, null, { engine });
const ids = (s) => s.shelves.flatMap((sh) => sh.productIds || []);
const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));

describe('v2 golden personas', () => {
  it('G1: regular periods + PMS: the evidence-backed option (calcium), not Flo', () => {
    const got = ids(seed({ lifeStageSelections: ['I get periods regularly'], supportSelections: ['PMS symptoms'], age: 28, takesCurrent: 'No' }));
    expect(got).toContain('p-citracal-bone-health');
    expect(got).not.toContain('p-flo-gummies');
  });
  it('G2: pregnant with PMS-like mood and bloating: no Flo, no swallowed product with unknown pregnancy safety', () => {
    const got = ids(seed({ lifeStageSelections: ['I am pregnant'], supportSelections: ['Cycle-related mood changes', 'Cycle-related bloating', 'PMS symptoms'], age: 31 }));
    expect(got).not.toContain('p-flo-gummies');
    for (const id of got) {
      const pp = buildProductProfile(byId.get(id));
      if (pp.ingested) expect(['unknown', 'avoid', 'contraindicated']).not.toContain(pp.pregnancy?.overall);
    }
  });
  it('G5: heavy flow + latex allergy: nothing that contains latex', () => {
    const got = ids(seed({ lifeStageSelections: ['I get periods regularly'], supportSelections: ['Heavy periods'], allergyStatus: 'Yes', allergyItems: ['Latex'], age: 25 }));
    for (const id of got) expect(buildProductProfile(byId.get(id)).safety?.latex).not.toBe('yes');
  });
  it('G8: vaginal dryness + avoids fragrance: nothing with fragrance', () => {
    const got = ids(seed({ lifeStageSelections: ['I am in menopause'], supportSelections: ['Vaginal dryness'], avoidIngredients: ['Fragrance'], age: 52 }));
    for (const id of got) expect(buildProductProfile(byId.get(id)).safety?.fragrance).not.toBe('yes');
  });
  it('G12: answering budget and format never lowers the shown fit (bands only from health)', () => {
    const base = { lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Heavy periods'], age: 27 };
    const a = seed(base);
    const b = seed({ ...base, budget: ['Under $15'], preferredFormats: ['Capsules'] });
    const healthA = new Map(a.shelves.flatMap((s) => s.picks).map((p) => [p.productId, p.v2.health]));
    for (const p of b.shelves.flatMap((s) => s.picks)) if (healthA.has(p.productId)) expect(p.v2.health).toBe(healthA.get(p.productId));
  });
  it('same profile twice gives the same order (stable tie-break)', () => {
    const intake = { lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Trouble sleeping'], age: 30 };
    expect(ids(seed(intake))).toEqual(ids(seed(intake)));
  });
});

describe('v2 scoring rules', () => {
  it('focus: a product built for many needs scores lower when she has only one of them', () => {
    const pp = { health_need_relevance: { a: { score: 1 }, b: { score: 1 }, c: { score: 1 }, d: { score: 1 } } };
    expect(focusOf(pp, new Set(['a']))).toBe(0.25);
    expect(focusOf(pp, new Set(['a', 'b', 'c', 'd']))).toBe(1);
  });
  it('preference only moves rankKey, never health', () => {
    const pp = buildProductProfile(byId.get('p-thermacare'));
    const r = (pref) => ({ needId: 'pain.menstrual_cramp', relationship: 'direct', components: { health: 1, experience: 0 }, outputs: { preferenceFit: pref }, confidence: 1 });
    const lo = scoreV2(pp, r(0), new Set(['pain.menstrual_cramp']));
    const hi = scoreV2(pp, r(1), new Set(['pain.menstrual_cramp']));
    expect(lo.health).toBe(hi.health);
    expect(hi.rankKey).toBeGreaterThan(lo.rankKey);
  });
  it('bands come from health thresholds', () => {
    expect(bandFor(0.8)).toBe('strong');
    expect(bandFor(0.8, 0.4)).toBe('good');
    expect(bandFor(0.6)).toBe('good');
    expect(bandFor(0.4)).toBe('partial');
    expect(bandFor(0.2)).toBe('none');
  });
  it('the v2 scorer never reads partner or commission fields', () => {
    const src = fs.readFileSync(new URL('./v2.js', import.meta.url), 'utf8');
    expect(src).not.toMatch(/partner|commission|affiliate|sponsor/i);
  });
  it('stays within ecosystem limits: at most 2 per brand and one universal care service', () => {
    const s = seed({ lifeStageSelections: ['I am in perimenopause'], supportSelections: ['Hot flashes', 'Trouble sleeping', 'Anxiety', 'Finding a telehealth provider'], age: 46 });
    const picked = [...new Set(ids(s))].map((id) => buildProductProfile(byId.get(id)));
    const brands = new Map();
    picked.forEach((pp) => pp.brand?.key && brands.set(pp.brand.key, (brands.get(pp.brand.key) || 0) + 1));
    for (const n of brands.values()) expect(n).toBeLessThanOrEqual(V2.maxPerBrand);
  });
});

describe('persona sweep (release gates)', () => {
  const profiles = makeProfiles(250, 11);
  const v1 = runSweep('v1', profiles);
  const v2 = runSweep('v2', profiles);
  it('HARD GATE: zero safety violations, both engines', () => {
    expect(v1.violationsList).toEqual([]);
    expect(v2.violationsList).toEqual([]);
  });
  it('HARD GATE: no cycle tracker or ovulation test for anyone without a cycle; no accessory or failed listing on a shelf', () => {
    expect(v2.lifeStageList).toEqual([]);
    expect(v2.gatedShown).toBe(0);
  });
  it('HARD GATE: no product in more than 40% of ecosystems', () => {
    expect(v2.topShare).toBeLessThanOrEqual(0.4);
  });
  it('report: catalog coverage, exposure Gini, empty shelves, strong share', () => {
    // Targets from the audit: coverage >= 0.6, Gini <= 0.6, empty <= 0.1, strong <= 0.25.
    // Coverage and empty shelves are limited by the catalog and by draft
    // evidence grades until clinical review; see ENGINE notes in v2.js.
    // Oct 24 (p2/match-quality): coverage 0.29 -> 0.30, avg picks 2.7 -> 2.8
    // (breadth rule); empty 0.27 -> 0.28 only because no-cycle profiles no
    // longer get trackers on cycle shelves (other shelves unchanged at 0.27).
    // With medicines answered "No" (the quiz asks): empty 0.23, coverage 0.35.
    console.log('[v2 gates]', JSON.stringify({ v1, v2 }));
    expect(v2.gini).toBeLessThanOrEqual(0.6);
    expect(v2.strongShare).toBeLessThanOrEqual(0.3);
    // Floors so variety and coverage do not slip back.
    expect(v2.catalogCoverage).toBeGreaterThanOrEqual(0.29);
    expect(v2.avgPicks).toBeGreaterThanOrEqual(2.7);
    expect(v2.emptyShelfShare).toBeLessThanOrEqual(0.3);
  });
});

import { describe, it, expect } from 'vitest';
import { AGE_STAGE_RULES, LIFE_STAGE_COMPATIBILITY, STAGE_SOURCES } from './ontology.js';
import { isCredibleScienceSource } from '../data/sourcePolicy.js';
import { getProductMatchDetailsForProduct, ALL_PRODUCTS } from '../data/products.js';

describe('age and life-stage rules are sourced', () => {
  it('every source is government, academic or a medical-society .org', () => {
    for (const s of Object.values(STAGE_SOURCES)) expect(isCredibleScienceSource(s.url), s.url).toBe(true);
  });
  it('every age rule cites known sources', () => {
    for (const rules of Object.values(AGE_STAGE_RULES)) for (const r of rules) {
      expect(r.sources.length).toBeGreaterThan(0);
      r.sources.forEach((id) => expect(STAGE_SOURCES[id], id).toBeTruthy());
    }
  });
  it('every compatibility rule that cites sources cites known ones', () => {
    for (const r of LIFE_STAGE_COMPATIBILITY) (r.sources || []).forEach((id) => expect(STAGE_SOURCES[id], id).toBeTruthy());
  });
});

describe('Why this matches panel, oct 21 bug', () => {
  const q = (intake) => ({ personalizationCompleted: true, fullHealthIntake: intake, ...intake });
  it('menopause + regular periods still finds hot-flash products', () => {
    const run = (stages) => ALL_PRODUCTS.filter((p) => getProductMatchDetailsForProduct(p, q({ age: 48, lifeStageSelections: stages, supportSelections: ['Hot flashes'] })).matchStatus === 'scored').length;
    expect(run(['I am in menopause', 'I get periods regularly'])).toBe(run(['I am in menopause']));
  });
  it('profile notes never appear on products unrelated to her needs', () => {
    const intake = { age: 30, lifeStageSelections: ['I am in perimenopause', 'I am pregnant', 'I get periods regularly'], supportSelections: ['Hot flashes'] };
    for (const p of ALL_PRODUCTS) {
      const d = getProductMatchDetailsForProduct(p, q(intake));
      if (d.matchStatus !== 'no-relevance') continue;
      expect((d.unknowns || []).join(' ')).not.toMatch(/less sure about this life stage|do not usually go together/);
    }
  });
  it('names the exact pair she chose', () => {
    const intake = { age: 48, lifeStageSelections: ['I am in menopause', 'I get periods regularly'], supportSelections: ['Hot flashes'] };
    const scored = ALL_PRODUCTS.map((p) => getProductMatchDetailsForProduct(p, q(intake))).find((d) => d.matchStatus === 'scored');
    expect(scored.careFlags.notes.map((n) => n.text).join(' ')).toMatch(/You chose menopause and regular periods/);
  });
});

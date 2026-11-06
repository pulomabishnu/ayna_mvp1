// Nov 6 (founder: "just because it's not in the name doesn't mean it's not used for that").
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, getMatchCareFlags } from '../data/products.js';
import { buildProductProfile } from './productProfile.js';
import { EMPTY } from '../mobile/data/intakeModel.js';

const byId = new Map(ALL_PRODUCTS.map((p) => [p.id, p]));
const rel = (id, need) => buildProductProfile(byId.get(id)).health_need_relevance?.[need] || null;
const ok = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };
const shelf = (opt, a = { age: '24', lifeStageSelections: ['I get periods regularly'] }) => getEcosystemSeedFromQuiz({ fullHealthIntake: { ...EMPTY, ...ok, ...a, supportSelections: [opt] }, personalizationCompleted: true }, null, { engine: 'v2' }).shelves[0];

describe('a product counts for what the brand markets it for', () => {
  it('a spray marketed for odor counts for vaginal odor; washes keep their deliberate lower level', () => {
    expect(rel('p-love-wellness-intimate-skin-support', 'vaginal.odor')?.relationship).toMatch(/strong|direct/);
    expect(rel('p-phd-wash', 'vaginal.odor')?.rule).toBe('intimate_wash');
  });
  it('a founder story or a balm that eases BV irritation is not a BV product', () => {
    expect(rel('p-momotaro-salve', 'vaginal.bv')?.rule).not.toBe('marketed_for');
  });
  it('homeopathic products never get a match from marketing alone', () => {
    expect(rel('p-momotaro-vaginal-suppository', 'vaginal.bv')?.rule).not.toBe('marketed_for');
  });
  it('a claim never overrides a stricter rule (PMS named in a supplement stays below the bar)', () => {
    expect(rel('p-flo-gummies', 'cycle.pms')?.rule).not.toBe('marketed_for');
  });
});

describe('symptoms are for everyone', () => {
  it('pain during sex at 24: water-based lubricants (MedlinePlus, any age)', () => {
    expect(shelf('Pain or discomfort during sex').productIds.length).toBeGreaterThan(0);
  });
  it('odor, discharge and BV at 24 have clinician guidance even if no eligible products', () => {
    for (const o of ['Vaginal odor', 'Unusual vaginal discharge', 'BV concerns']) {
      const matched = shelf(o);
      const note = getMatchCareFlags({ fullHealthIntake: { ...EMPTY, ...ok, age: '24', lifeStageSelections: ['I get periods regularly'], supportSelections: [o] } }).notes.find(n => n.code === 'vaginitis_testing');
      expect(note?.source, o).toContain('cdc.gov');
      expect(Array.isArray(matched.productIds)).toBe(true);
      if (!matched.productIds.length) expect(matched.emptyReason, o).toBeTruthy();
    }
  });
});

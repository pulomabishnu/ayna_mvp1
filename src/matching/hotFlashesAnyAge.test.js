// Nov 6 (founder): "they can get products for hot flashes … it doesn't have to be menopause-related".
// Hot flashes get cooling products at any age; context only adds menopause options and a care note.
import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getEcosystemSeedFromQuiz, getMatchCareFlags } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';

const ok = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], supportSelections: ['Hot flashes'] };
const q = (a) => ({ fullHealthIntake: { ...EMPTY, ...ok, ...a }, personalizationCompleted: true });
const shelf = (a) => getEcosystemSeedFromQuiz(q(a), null, { engine: 'v2' }).shelves.find((s) => s.label === 'Hot flashes');
const MENO = new Set(ALL_PRODUCTS.filter((p) => /menopause/i.test(`${p.name} ${p.summary}`) && !/cool/i.test(p.name)).map((p) => p.id));

describe('hot flashes at any age', () => {
  for (const a of [{ age: '24', lifeStageSelections: ['I get periods regularly'] }, { age: '24', lifeStageSelections: ['I am postpartum'] }]) {
    it(`${a.lifeStageSelections[0]}: cooling picks, nothing positioned for menopause, and a care note`, () => {
      const s = shelf(a);
      expect(s.productIds).toEqual(expect.arrayContaining(['p-oboo-cool-spray', 'p-joylux-coldher']));
      s.productIds.forEach((id) => expect(MENO.has(id), id).toBe(false));
      expect(getMatchCareFlags(q(a)).notes.map((n) => n.code)).toContain('vasomotor_other_causes');
    });
  }
  it('in menopause: menopause options too, no extra note', () => {
    const a = { age: '52', lifeStageSelections: ['I am in menopause'] };
    expect(shelf(a).productIds.length).toBeGreaterThanOrEqual(3);
    expect(getMatchCareFlags(q(a)).notes.map((n) => n.code)).not.toContain('vasomotor_other_causes');
  });
});

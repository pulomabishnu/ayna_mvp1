import { describe, it, expect } from 'vitest';
import { claimRows, evidenceLayers, buildEvidence } from './evidenceModel.js';
import { primePassport } from '../../data/passport/index.js';

describe('claims, one by one', () => {
  it('labels each claim by the evidence behind it, never as more than it is', () => {
    const product = { id: 't1', brand: 'Womaness', name: 'Me No Pause' };
    primePassport(product, { evidence: { claims: { known: true, value: [
      { claim: 'Pycnogenol reduced symptoms', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://womaness.com/x', product_specific: false },
      { claim: 'Hydrates for 72 hours', evidence_type: 'manufacturer', source_url: 'https://womaness.com/y' },
      { claim: 'Ashwagandha cautions', evidence_type: 'regulatory', source_url: 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/' },
    ] } } });
    const rows = claimRows(product);
    expect(rows.map((r) => r.kind)).toEqual(['ingredient', 'brand', 'gov']);
    expect(rows[0].via).toMatch(/Cited by the brand/);
    expect(rows[1].label).toBe('The brand’s claim');
  });
  it('lists the kinds of evidence on file', () => {
    const product = { id: 't2', brand: 'B', name: 'Gel', clinicianOpinionSource: 'brand', doctorOpinion: 'The brand says it works.', ingredientScience: [{ name: 'Hyaluronic acid', text: 'Holds water.' }] };
    primePassport(product, null);
    const m = buildEvidence(product);
    const ids = evidenceLayers(product, m, { communityCount: 2 }).map((l) => l.id);
    expect(ids).toEqual(['brand', 'ingredient', 'community']);
  });
});

import { describe, it, expect } from 'vitest';
import { getSafetyAlertText, buildSummarySentences } from './ProductModal';

// Regression coverage for a real MVP report: the "Ayna summary" tab (the
// default view of a product) is built only from product.summary + effectiveness
// — both purely positive/performance fields — so a product could read as
// unqualified positive even when the SAME catalog entry already had a
// well-documented safety concern on file (e.g. Always Infinity FlexFoam's PFAS
// controversy, written into safety.opinionAlerts and safety.recalls but never
// rendered anywhere in the app before this fix). getSafetyAlertText surfaces
// that already-on-file content; it never invents a concern that isn't flagged.
describe('getSafetyAlertText', () => {
  it('returns opinionAlerts (the fuller writeup) when a flagged recall exists and opinionAlerts is present', () => {
    const product = {
      safety: {
        recalls: '⚠️ 2024 social media concerns about chemical residues.',
        opinionAlerts: 'A 2024 independent lab test found PFAS indicators in some Always pad lines...',
      },
    };
    expect(getSafetyAlertText(product)).toBe('A 2024 independent lab test found PFAS indicators in some Always pad lines...');
  });

  it('falls back to the shorter recalls text when opinionAlerts is missing', () => {
    const product = { safety: { recalls: '⚠️ Active FDA recall record(s) found.' } };
    expect(getSafetyAlertText(product)).toBe('⚠️ Active FDA recall record(s) found.');
  });

  it('returns null when safety.recalls has no ⚠️ flag, even if opinionAlerts has text', () => {
    const product = {
      safety: {
        recalls: 'No recalls found.',
        opinionAlerts: 'Some users find the plastic-like texture uncomfortable.',
      },
    };
    expect(getSafetyAlertText(product)).toBeNull();
  });

  it('returns null when there is no safety data at all', () => {
    expect(getSafetyAlertText({})).toBeNull();
    expect(getSafetyAlertText(null)).toBeNull();
    expect(getSafetyAlertText(undefined)).toBeNull();
  });

  it('returns null when recalls is an empty string', () => {
    expect(getSafetyAlertText({ safety: { recalls: '' } })).toBeNull();
  });
});

// Regression coverage for the general form of the same bug: summary +
// effectiveness are marketing/performance copy for every product in the
// catalog, not just Honey Pot Herbal Pads, so the "ayna Summary" card read as
// unqualified positive for any product with a real caveat on file in
// safety.opinionAlerts. buildSummarySentences folds that caveat in
// automatically, without a per-product prose rewrite, unless a flagged
// recall is already surfacing it via the SafetyAlert banner (in which case
// showing it a second time in the card would just be the same text twice).
describe('buildSummarySentences', () => {
  it('includes opinionAlerts as a third block when there is no flagged recall', () => {
    const product = {
      summary: 'Plant-derived pads infused with lavender and mint herbs for cooling comfort during cramps.',
      effectiveness: 'Good absorption with added herbal comfort. Many users report cramp relief from cooling herbs.',
      safety: {
        recalls: 'No recalls.',
        opinionAlerts: 'High rate of split opinions: half the users love the cooling effect for cramps, the other half find it too intense or irritating.',
      },
    };
    const sentences = buildSummarySentences(product);
    expect(sentences).toHaveLength(3);
    expect(sentences[2]).toBe(product.safety.opinionAlerts);
  });

  it('omits opinionAlerts when a flagged recall already surfaces it via the safety banner', () => {
    const product = {
      summary: 'Ultra-thin FlexFoam pad that absorbs 10x its weight. Widely available and affordable.',
      effectiveness: 'Highly effective for heavy flow.',
      safety: {
        recalls: ' 2024 social media concerns about chemical residues. Independent testing found trace PFAS in some pad brands.',
        opinionAlerts: 'A 2024 independent lab test found PFAS indicators in some Always pad lines.',
      },
    };
    const sentences = buildSummarySentences(product);
    expect(sentences).toHaveLength(2);
    expect(sentences).not.toContain(product.safety.opinionAlerts);
  });

  it('skips a duplicate opinionAlerts that is already substantially covered by summary/effectiveness', () => {
    const product = {
      summary: 'Reusable menstrual disc.',
      effectiveness: 'Some users report leaks during heavy flow.',
      safety: {
        recalls: 'No recalls.',
        // Shares its first 30 characters with effectiveness above.
        opinionAlerts: 'Some users report leaks during heavy flow, especially overnight.',
      },
    };
    expect(buildSummarySentences(product)).toHaveLength(2);
  });

  it('returns an empty array for a null product', () => {
    expect(buildSummarySentences(null)).toEqual([]);
  });

  it('caps at three sentences even if all three fields are distinct', () => {
    const product = {
      summary: 'Summary text here.',
      effectiveness: 'Effectiveness text here.',
      safety: { recalls: 'No recalls.', opinionAlerts: 'Opinion alert text here.' },
    };
    expect(buildSummarySentences(product)).toHaveLength(3);
  });
});

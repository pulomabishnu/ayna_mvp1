import { describe, it, expect } from 'vitest';
import { getSafetyAlertText } from './ProductModal';

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

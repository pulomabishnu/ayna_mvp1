import { describe, it, expect } from 'vitest';
import { hasFlaggedRecall, getSafetyAlertText } from './productSafetyAlert';

// Regression coverage for a real data regression: safety.recalls used to carry
// a manually-added ⚠️ marker as the sole signal for "this is a real
// flagged concern" (checked independently by ProductModal, Discovery's safety
// scoring, and Recommendations' "Safety note" badge). As of 2026-09-22, zero
// products in the catalog carry that marker, so all three silently stopped
// firing for real, already-documented concerns (Always Infinity's PFAS
// coverage, Thinx's PFAS lawsuit, Cora's PFAS finding, a nursing-pillow
// recall). hasFlaggedRecall detects the concern from the text's own content
// instead, while still honoring the legacy marker if it's ever added back.
describe('hasFlaggedRecall', () => {
  it('flags text mentioning PFAS even with no marker', () => {
    expect(hasFlaggedRecall(' 2024 social media concerns about chemical residues. Always has not been subject to FDA recall but independent testing found trace PFAS in some pad brands.')).toBe(true);
  });

  it('flags a settled PFAS lawsuit', () => {
    expect(hasFlaggedRecall(' 2022: Thinx settled a $5M class-action lawsuit over PFAS in older products. Current line is PFAS-free.')).toBe(true);
  });

  it('flags a PFAS finding even when the sentence opens with a "no recalls" disclaimer', () => {
    expect(hasFlaggedRecall('No formal recalls. Note: a 2024 independent lab investigation found organic fluorine, an indicator of PFAS "forever chemicals", in a product line.')).toBe(true);
  });

  it('flags a recall mentioned near a year, with no PFAS keyword', () => {
    expect(hasFlaggedRecall('2021 Lounger recall. Current nursing pillows are safe for supervised feeding only.')).toBe(true);
  });

  it('still honors the legacy ⚠️ marker', () => {
    expect(hasFlaggedRecall('⚠️ Active FDA recall record(s) found.')).toBe(true);
  });

  it('does not flag a bare "no recalls" statement', () => {
    expect(hasFlaggedRecall('No recalls.')).toBe(false);
    expect(hasFlaggedRecall('No recalls found.')).toBe(false);
    expect(hasFlaggedRecall('No known recalls')).toBe(false);
    expect(hasFlaggedRecall('No recalls. Zero PFAS detected in independent testing.')).toBe(false);
  });

  it('does not flag a generic "check the regulator yourself" disclaimer, even though it contains the word "recall"', () => {
    expect(hasFlaggedRecall('Check current regulator and manufacturer recall notices.')).toBe(false);
    expect(hasFlaggedRecall('No product-specific recall is listed here; check current FDA/brand recall information before relying on this field.')).toBe(false);
  });

  it('does not flag empty/missing text', () => {
    expect(hasFlaggedRecall(null)).toBe(false);
    expect(hasFlaggedRecall(undefined)).toBe(false);
    expect(hasFlaggedRecall('')).toBe(false);
    expect(hasFlaggedRecall('N/A')).toBe(false);
  });
});

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

  it('detects a real concern from content alone, with no marker', () => {
    const product = {
      safety: {
        recalls: ' 2022: Thinx settled a $5M class-action lawsuit over PFAS in older products. Current line is PFAS-free.',
        opinionAlerts: 'Legacy "PFAS scare" still drives some user hesitation.',
      },
    };
    expect(getSafetyAlertText(product)).toBe('Legacy "PFAS scare" still drives some user hesitation.');
  });

  it('returns null when safety.recalls has no real concern, even if opinionAlerts has text', () => {
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

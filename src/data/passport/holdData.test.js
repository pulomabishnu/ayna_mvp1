import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../products.js';
import { buildProductProfile } from '../../matching/productProfile.js';
import { EMPTY, buildSnapshot } from '../../mobile/data/intakeModel.js';
import { mapIntakeToLegacyQuizProfile } from '../../utils/healthIntake.js';

// Oct 25: the pregnancy / breastfeeding facts filled from brand pages and .gov
// (reviews/batch-6.js). Silent sources stay unknown, never "safe".
const byId = (id) => ALL_PRODUCTS.find((p) => p.id === id);
const pp = (id) => buildProductProfile(byId(id));
const base = { ...EMPTY, age: '31', safetyConcern: 'No', diagnosisSelections: ['None that I know of'], allergyStatus: 'No', takesCurrent: 'No', supportSelections: ['Trouble sleeping'] };
const q = (intake) => mapIntakeToLegacyQuizProfile(buildSnapshot({ ...base, ...intake }));
const PREGNANT = q({ lifeStageSelections: ['I am pregnant'], pregnancyTrimester: 'Second trimester' });
const NURSING = q({ lifeStageSelections: ['I am postpartum'], postpartumTiming: '0–3 months', breastfeedingStatus: 'Yes' });
const missing = (id, quiz) => getProductMatchDetailsForProduct(byId(id), quiz).missingProductInfo || [];

describe('filled pregnancy and breastfeeding facts', () => {
  it('statuses read from the sources', () => {
    expect(pp('p-miralax-peg-3350').pregnancy.overall).toBe('caution');
    expect(pp('p-metamucil-psyllium-orange').pregnancy.overall).toBe('caution');
    expect(pp('p-goodbug-good-down-there').pregnancy.overall).toBe('caution');
    expect(pp('p-goodbug-good-down-there').breastfeeding.overall).toBe('caution');
    expect(pp('p-arrae-mb-1').breastfeeding.overall).toBe('caution');
    expect(pp('p-momotaro-urinary-tract-supplement').breastfeeding.overall).toBe('caution');
    expect(pp('p-rugby-vitamin-b6-25').breastfeeding.overall).toBe('verified');
    expect(pp('p-rugby-vitamin-b6-25').breastfeeding.evidence_source).toMatch(/ncbi\.nlm\.nih\.gov/);
  });
  it('no longer held for missing product data', () => {
    for (const id of ['p-miralax-peg-3350', 'p-metamucil-psyllium-orange', 'p-goodbug-good-down-there']) expect(missing(id, PREGNANT), id).not.toContain('pregnancy_info');
    for (const id of ['p-arrae-mb-1', 'p-goodbug-good-down-there', 'p-momotaro-urinary-tract-supplement', 'p-rugby-vitamin-b6-25']) expect(missing(id, NURSING), id).not.toContain('breastfeeding_info');
  });
  it('silent sources stay unknown (still held for that stage)', () => {
    for (const id of ['p-oboo-loob-daily', 'p-oboo-loob-arousal', 'p-oboo-cool-spray']) expect(pp(id).pregnancy.overall, id).toBe('unknown');
    expect(missing('p-cbb-13-in-1-womens-gummies', NURSING)).toContain('breastfeeding_info');
  });
  it('a .gov "ok" never loosens a caution', () => {
    // MiraLAX: LactMed was ok for breastfeeding, the brand label says ask a health professional.
    expect(pp('p-miralax-peg-3350').breastfeeding.overall).toBe('caution');
  });
});

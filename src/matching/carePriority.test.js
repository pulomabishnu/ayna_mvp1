import { describe, it, expect } from 'vitest';
import { careFirstForNeed, pregnancyBleedingCare } from './carePriority.js';
import { getEcosystemSeedFromQuiz, getMatchCareFlags, getProductMatchDetailsForProduct, ALL_PRODUCTS } from '../data/products.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { evaluateSafety } from './score.js';
import { holdStateFor } from './gate.js';

const intake = (lifeStageSelections, supportSelections, other = {}) => ({
  personalizationCompleted: true, age: 30, lifeStageSelections,
  supportSelections, takesCurrent: 'No', allergyStatus: 'No', ...other,
});
const profile = i => buildUserProfile(i, {catalog: ALL_PRODUCTS});
const ecosystem = i => getEcosystemSeedFromQuiz({ personalizationCompleted:true, fullHealthIntake:i }, null, {engine:'v2'});
const product = id => ALL_PRODUCTS.find(p => p.id === id);

describe('ACOG care-first / FDA passport review / CDC diagnostic caution', () => {
  const pg = intake(['I am pregnant'], ['Spotting between periods', 'Pelvic pain'], {pregnancyTrimester:'First trimester'});
  it('pregnancy bleeding and pelvic pain block commerce for those needs', () => {
    const up = profile(pg);
    expect(pregnancyBleedingCare(up)?.source).toContain('acog.org');
    expect(careFirstForNeed(up, 'cycle.spotting')).toBeTruthy();
    expect(careFirstForNeed(up, 'pain.pelvic')).toBeTruthy();
    const e = ecosystem(pg);
    for (const needId of ['cycle.spotting','pain.pelvic']) {
      const shelf = e.shelves.find(s => s.needId === needId);
      expect(shelf, needId).toBeTruthy();
      expect(shelf.productIds).toEqual([]);
      expect(shelf.emptyReason).toBe('care_first');
      expect(shelf.qualityNote).toMatch(/pregnancy|bleeding|pain/i);
    }
    expect(e.careFlags.notes.some(n=>n.code==='pregnancy_bleeding')).toBe(true);
    // A product page must show the same care-first result as the shelf.
    const liner = product('p-carefree-liners');
    expect(liner).toBeTruthy();
    const details = getProductMatchDetailsForProduct(liner, {fullHealthIntake:pg});
    expect(details.matchStatus).toBe('bleeding-evaluation');
    expect(details.percent).toBeNull();
    expect(details.bleedingEvaluation?.source?.url).toContain('acog.org');
  });
  it('pregnancy pain without bleeding is not automatically called pregnancy bleeding', () => {
    const up = profile(intake(['I am pregnant'], ['Pelvic pain']));
    expect(pregnancyBleedingCare(up)).toBe(null);
    expect(careFirstForNeed(up, 'pain.pelvic')).toBe(null);
  });
  it('spotting in a nonpregnant profile is not suppressed by pregnancy rule', () => {
    const e = ecosystem(intake(['I get periods regularly'], ['Spotting between periods']));
    expect(e.shelves.find(s=>s.needId==='cycle.spotting').productIds.length).toBeGreaterThan(0);
  });
  it('period product interest alone does not imply a pregnant user is bleeding', () => {
    const up = profile(intake(['I am pregnant'], ['Period product support']));
    expect(pregnancyBleedingCare(up)).toBeNull();
    expect(careFirstForNeed(up, 'period.product_support')).toBeNull();
  });
  it('sourced care guidance remains available for PMS, PMDD, PCOS, nausea and adenomyosis', () => {
    const cases = [
      [['I get periods regularly'], ['PMS symptoms'], 'pms_care', 'acog.org'],
      [['I get periods regularly'], ['PMDD symptoms'], 'pmdd_care', 'acog.org'],
      [['My periods are irregular'], ['PCOS support'], 'pcos_care', 'nichd.nih.gov'],
      [['I am pregnant'], ['Nausea'], 'pregnancy_nausea', 'acog.org'],
      [['I get periods regularly'], ['Adenomyosis-related concerns'], 'adenomyosis_care', 'mayoclinic.org'],
    ];
    for (const [stages, needs, code, domain] of cases) {
      const flags = getMatchCareFlags({fullHealthIntake:intake(stages,needs)});
      expect(flags.notes.some(n => n.code === code && n.source.includes(domain)), code).toBe(true);
    }
  });
  it('postmenopausal bleeding remains an empty care-first shelf', () => {
    const e = ecosystem(intake(['I am post-menopause'], ['Spotting between periods']));
    expect(e.shelves.find(s=>s.needId==='cycle.spotting').productIds).toEqual([]);
    expect(e.careFlags.notes.some(n=>n.code==='period_need_vs_stage')).toBe(true);
  });
  it('a clinician-review flag is an internal note, never a hold (Nov 9, founder)', () => {
    const p = product('p-winx-uti-test-treat');
    expect(p).toBeTruthy();
    const pp=buildProductProfile(p);
    const safety=evaluateSafety(pp,profile(intake(['I get periods regularly'], ['Burning with urination'])));
    expect(safety.missingProductInfo || []).not.toContain('clinician_review');
  });
  it('vaginal symptoms have source-backed diagnostic uncertainty note', () => {
    const notes = getMatchCareFlags({fullHealthIntake:intake(['I get periods regularly'], ['Yeast infection concerns'])}).notes;
    expect(notes.some(n => n.code==='vaginitis_testing' && n.source.includes('cdc.gov'))).toBe(true);
  });
  it('trying to conceive + spironolactone gets a source-backed medication reconciliation note', () => {
    const notes=getMatchCareFlags({fullHealthIntake:intake(['I am trying to conceive'], ['Fertility support'], {takesCurrent:'Yes',currentMedicationItems:['Spironolactone']})}).notes;
    expect(notes.some(n=>n.code==='ttc_spironolactone' && n.source.includes('dailymed.nlm.nih.gov'))).toBe(true);
  });
});
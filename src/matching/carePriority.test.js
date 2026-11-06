import { describe, it, expect } from 'vitest';
import { careFirstForNeed, pregnancyBleedingCare } from './carePriority.js';
import { getEcosystemSeedFromQuiz, getMatchCareFlags, ALL_PRODUCTS } from '../data/products.js';
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
  it('postmenopausal bleeding remains an empty care-first shelf', () => {
    const e = ecosystem(intake(['I am post-menopause'], ['Spotting between periods']));
    expect(e.shelves.find(s=>s.needId==='cycle.spotting').productIds).toEqual([]);
    expect(e.careFlags.notes.some(n=>n.code==='period_need_vs_stage')).toBe(true);
  });
  it('open clinician review is a hold with no match recommendation', () => {
    const p = product('p-winx-uti-test-treat');
    expect(p).toBeTruthy();
    const pp=buildProductProfile(p);
    expect(pp.passport?.qa).toBe('needs_clinician_review');
    const safety=evaluateSafety(pp,profile(intake(['I get periods regularly'], ['Burning with urination'])));
    expect(safety.restricted).toBe(true);
    expect(safety.missingProductInfo).toContain('clinician_review');
    expect(holdStateFor(safety)).toBe('in_review');
    const e=ecosystem(intake(['I get periods regularly'], ['Burning with urination']));
    expect(e.shelves.flatMap(s=>s.productIds)).not.toContain('p-winx-uti-test-treat');
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
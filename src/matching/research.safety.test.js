import { describe, it, expect } from 'vitest';
import { ALL_PRODUCTS } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildUserProfile } from './userProfile.js';
import { buildProductProfile } from './productProfile.js';
import { scoreProductForNeed } from './score.js';
import { canonicalize } from './ontology.js';
import SAFETY_RESEARCH from '../data/matching/safety.research.js';
import NEED_MAP_RESEARCH from '../data/matching/needMap.research.js';

// Guards for the evidence research merged in by scripts/merge-research.mjs.
const P = (id) => ALL_PRODUCTS.find((p) => p.id === id);
const user = (over) => buildUserProfile({ ...EMPTY, ...over }, { catalog: ALL_PRODUCTS });
const codes = (r) => [...(r.safety?.reasons || []), ...(r.reasons || [])].map((x) => x.code);

describe('research data', () => {
  it('every row cites a credible source', () => {
    for (const r of [...NEED_MAP_RESEARCH, ...SAFETY_RESEARCH]) expect(r.source_url).toMatch(/^https:\/\//);
  });
  it('a sourced "ok" only fills an unknown; it never overrides a caution from the label', () => {
    // Differin's label says ask a doctor if pregnant: research cannot clear that.
    expect(buildProductProfile(P('p-differin-adapalene-gel')).pregnancy.overall).toBe('caution');
    // Folic acid: CDC recommends it before and during pregnancy.
    expect(buildProductProfile(P('p-nature-made-folic-acid-400')).pregnancy.overall).toBe('verified');
  });
});

describe('pregnancy and breastfeeding from research', () => {
  it('Flo gummies (chasteberry) are not for pregnancy, per NCCIH', () => {
    expect(buildProductProfile(P('p-flo-gummies')).pregnancy.overall).toBe('contraindicated');
  });
  it('an herbal that is not safe in pregnancy is held back while trying to conceive', () => {
    const up = user({ personalizationCompleted: true, lifeStageSelections: ['I am trying to conceive'], supportSelections: ['PMS symptoms'], age: 28 });
    const r = scoreProductForNeed(P('p-flo-gummies'), up, 'cycle.pms');
    expect(r.safety.eligible).toBe(false);
  });
  it('tampons: "not in pregnancy" applies only when pregnant, never to TTC or an unknown stage', () => {
    const pp = buildProductProfile(P('p-tampax-pure'));
    expect(pp.pregnancy.pregnantOnly).toBe(true);
    const ttc = user({ personalizationCompleted: true, lifeStageSelections: ['I am trying to conceive'], supportSelections: ['Heavy periods'], age: 30 });
    const r = scoreProductForNeed(P('p-tampax-pure'), ttc, 'period.heavy');
    expect(codes(r)).not.toContain('ttc_pregnancy_contraindicated');
    expect(Object.keys(r.penalties || {})).not.toContain('ttc_pregnancy_contraindicated');
  });
  it('OTC urinary pain tablets count as swallowed, and are not for breastfeeding (LactMed)', () => {
    const pp = buildProductProfile(P('p-cystex'));
    expect(pp.ingested).toBe(true);
    expect(pp.breastfeeding.overall).toBe('contraindicated');
  });
});

describe('naming', () => {
  it('PMOS is read as PCOS', () => {
    expect(JSON.stringify(canonicalize('PMOS'))).toMatch(/pcos/);
  });
});

describe('condition rules (research, Oct 17)', () => {
  const up = (diag) => buildUserProfile({ ...EMPTY, personalizationCompleted: true, supportSelections: ['Cramps or period pain'], diagnosisSelections: [diag], takesCurrent: 'No', age: 30 }, { catalog: ALL_PRODUCTS });
  it('kidney disease holds back NSAIDs', () => {
    const r = scoreProductForNeed(P('p-advil-ibuprofen-200'), up('Kidney disease'), 'pain.menstrual_cramp');
    expect(r.safety.eligible).toBe(false);
  });
  it('high blood pressure keeps NSAIDs with a caution and its source', () => {
    const r = scoreProductForNeed(P('p-advil-ibuprofen-200'), up('High blood pressure'), 'pain.menstrual_cramp');
    expect(r.safety.eligible).toBe(true);
    expect(r.safety.cautions.some((c) => c.code === 'condition_caution' && /^https/.test(c.source))).toBe(true);
  });
  it('a heat wrap with iron powder is not a dose of iron', () => {
    const r = scoreProductForNeed(P('p-thermacare'), up('Thyroid condition'), 'pain.menstrual_cramp');
    expect(r.safety.cautions.some((c) => c.code === 'condition_caution')).toBe(false);
  });
});

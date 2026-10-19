// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { parseClinicalRecords, saveRecords, loadSavedRecords, deleteSavedRecords, deleteAllSavedRecordsOnDevice, hasRecords } from './records.js';

const rec = (type, json, sourceName = 'Mercy Hospital') => ({ type, json: JSON.stringify(json), sourceName });
const NOW = Date.parse('2026-10-18T12:00:00Z');

describe('parseClinicalRecords (FHIR DSTU2 and R4)', () => {
  it('reads R4 and DSTU2 allergies, drops resolved and refuted', () => {
    const out = parseClinicalRecords([
      rec('allergy', { resourceType: 'AllergyIntolerance', code: { text: 'Latex' }, clinicalStatus: { coding: [{ code: 'active' }] } }),
      rec('allergy', { resourceType: 'AllergyIntolerance', substance: { coding: [{ display: 'Penicillin', code: '7980', system: 'rxnorm' }] }, status: 'confirmed' }),
      rec('allergy', { resourceType: 'AllergyIntolerance', code: { text: 'Peanut' }, clinicalStatus: { coding: [{ code: 'resolved' }] } }),
      rec('allergy', { resourceType: 'AllergyIntolerance', code: { text: 'Shellfish' }, verificationStatus: { coding: [{ code: 'refuted' }] } }),
    ], { now: NOW });
    expect(out.allergy.map((a) => a.name)).toEqual(['Latex', 'Penicillin']);
    expect(out.allergy[1].coding).toEqual({ system: 'rxnorm', code: '7980' });
    expect(out.skipped).toBe(2);
  });

  it('keeps active conditions only', () => {
    const out = parseClinicalRecords([
      rec('condition', { resourceType: 'Condition', code: { text: 'Endometriosis' }, clinicalStatus: 'active' }),
      rec('condition', { resourceType: 'Condition', code: { text: 'Strep throat' }, clinicalStatus: { coding: [{ code: 'resolved' }] } }),
      rec('condition', { resourceType: 'Condition', code: { text: 'Typo' }, verificationStatus: 'entered-in-error' }),
    ], { now: NOW });
    expect(out.condition.map((c) => c.name)).toEqual(['Endometriosis']);
  });

  it('medications: active requests and statements, recent dispenses; dedupes across sources', () => {
    const out = parseClinicalRecords([
      rec('medication', { resourceType: 'MedicationRequest', status: 'active', medicationCodeableConcept: { text: 'Levothyroxine 50 mcg' } }),
      rec('medication', { resourceType: 'MedicationStatement', status: 'active', medicationCodeableConcept: { text: 'levothyroxine 50 mcg' } }, 'City Clinic'),
      rec('medication', { resourceType: 'MedicationOrder', status: 'stopped', medicationCodeableConcept: { text: 'Old drug' } }),
      rec('medication', { resourceType: 'MedicationDispense', status: 'completed', whenHandedOver: '2026-08-01', medicationReference: { display: 'Ibuprofen' } }),
      rec('medication', { resourceType: 'MedicationDispense', status: 'completed', whenHandedOver: '2023-01-01', medicationReference: { display: 'Ancient' } }),
    ], { now: NOW });
    expect(out.medication.map((m) => m.name)).toEqual(['Ibuprofen', 'Levothyroxine 50 mcg']);
    expect(out.medication[1].sources).toEqual(['Mercy Hospital', 'City Clinic']);
  });

  it('ignores bad JSON, wrong resource types and unknown record types', () => {
    const out = parseClinicalRecords([
      { type: 'allergy', json: '{nope' },
      rec('allergy', { resourceType: 'Condition', code: { text: 'x' } }),
      rec('lab', { resourceType: 'Observation' }),
    ]);
    expect(out).toMatchObject({ allergy: [], condition: [], medication: [], skipped: 3 });
  });
});

describe('records stay on the device, per user', () => {
  beforeEach(() => { window.localStorage.clear(); });
  it('save, load, delete', () => {
    saveRecords('u1', { allergies: ['Latex', 'Latex', ' '], conditions: [], medications: ['Ibuprofen'], types: ['allergy', 'medication'] });
    expect(loadSavedRecords('u1')).toMatchObject({ allergies: ['Latex'], medications: ['Ibuprofen'] });
    expect(loadSavedRecords('u2')).toBeNull();
    expect(hasRecords(loadSavedRecords('u1'))).toBe(true);
    deleteSavedRecords('u1');
    expect(loadSavedRecords('u1')).toBeNull();
  });
  it('device wipe removes every user', () => {
    saveRecords('u1', { allergies: ['A'] });
    saveRecords('u2', { allergies: ['B'] });
    window.localStorage.setItem('other', 'keep');
    deleteAllSavedRecordsOnDevice();
    expect(loadSavedRecords('u1')).toBeNull();
    expect(loadSavedRecords('u2')).toBeNull();
    expect(window.localStorage.getItem('other')).toBe('keep');
  });
});

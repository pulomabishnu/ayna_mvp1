import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normalizeMedication, INTERACTION_TABLE, lookupInteraction, checkMedicationInteractions, detectIngredientKeys } from './medications.js';

describe('normalizeMedication: brand -> generic -> class', () => {
  it('Zoloft -> sertraline -> SSRI', () => {
    const m = normalizeMedication('Zoloft');
    expect(m).toMatchObject({ recognized: true, matched_as: 'brand', generic: 'sertraline', classes: ['ssri'] });
    expect(m.all_classes).toContain('antidepressant');
  });
  it('Ozempic -> semaglutide -> GLP-1 RA', () => {
    expect(normalizeMedication('Ozempic')).toMatchObject({ generic: 'semaglutide', classes: ['glp1_ra'] });
    expect(normalizeMedication('wegovy').generic).toBe('semaglutide');
  });
  it('Yaz -> drospirenone/ethinyl estradiol -> combined hormonal contraceptive', () => {
    const m = normalizeMedication('Yaz');
    expect(m.generic).toBe('drospirenone/ethinyl estradiol');
    expect(m.classes).toEqual(['combined_hormonal_contraceptive']);
    expect(m.all_classes).toContain('hormonal_contraceptive');
  });
  it('covers other common women\'s-health medicines', () => {
    expect(normalizeMedication('Synthroid')).toMatchObject({ generic: 'levothyroxine', classes: ['thyroid_hormone'] });
    expect(normalizeMedication('metformin')).toMatchObject({ matched_as: 'generic', classes: ['biguanide'] });
    expect(normalizeMedication('Aldactone').generic).toBe('spironolactone');
    expect(normalizeMedication('Coumadin').generic).toBe('warfarin');
    expect(normalizeMedication('Cymbalta').classes).toEqual(['snri']);
    expect(normalizeMedication('Mounjaro').all_classes).toContain('glp1_ra');
    expect(normalizeMedication('Slynd').classes).toEqual(['progestin_only_contraceptive']);
    expect(normalizeMedication('Mirena').classes).toEqual(['progestin_only_contraceptive']);
    expect(normalizeMedication('Paragard').classes).toEqual(['nonhormonal_contraceptive']);
    expect(normalizeMedication('Sertraline 50 mg').generic).toBe('sertraline');
  });
  it('treats supplements as supplements with an ingredient key', () => {
    expect(normalizeMedication('Iron')).toMatchObject({ kind: 'supplement', ingredient: 'iron' });
  });
  it('leaves unknown entries unrecognized', () => {
    expect(normalizeMedication('Mystery pill 9000')).toMatchObject({ recognized: false, generic: null });
  });
});

describe('interaction table', () => {
  const legacy = readFileSync(fileURLToPath(new URL('../data/interactions.js', import.meta.url)), 'utf8');

  it('is seeded only from legacy interactions.js, wording kept, marked for review', () => {
    expect(INTERACTION_TABLE.length).toBeGreaterThan(0);
    for (const row of INTERACTION_TABLE) {
      expect(row.source).toBe('legacy ayna interactions.js');
      expect(row.reviewed_on).toBe(null);
      expect(row.needs_clinical_review).toBe(true);
      expect(['compatible', 'caution', 'avoid', 'unknown']).toContain(row.verdict);
      expect(legacy.includes(row.message.replace(/'/g, "'"))).toBe(true);
    }
  });

  it('only uses "avoid" where legacy wording says do not combine', () => {
    INTERACTION_TABLE.filter((r) => r.verdict === 'avoid').forEach((r) => expect(r.message).toMatch(/Do not combine/));
  });

  it('St. John\'s wort with an SSRI is avoid; with the pill is caution', () => {
    expect(lookupInteraction(normalizeMedication('Zoloft'), 'stJohnsWort').verdict).toBe('avoid');
    expect(lookupInteraction(normalizeMedication('Yaz'), 'stJohnsWort').verdict).toBe('caution');
  });

  it('defaults any pair not in the table to unknown, never compatible', () => {
    const r = lookupInteraction(normalizeMedication('Ozempic'), 'magnesium');
    expect(r.verdict).toBe('unknown');
    const check = checkMedicationInteractions([normalizeMedication('Ozempic')], { interaction_relevant: true, ingredient_keys: ['magnesium'] });
    expect(check.verdict).toBe('unknown');
    expect(check.unknownPairs).toBe(1);
  });

  it('reports unknown when product ingredients are unknown, and not_applicable for non-ingested products', () => {
    expect(checkMedicationInteractions([normalizeMedication('Zoloft')], { interaction_relevant: true, ingredient_keys: [] }).verdict).toBe('unknown');
    expect(checkMedicationInteractions([normalizeMedication('Zoloft')], { interaction_relevant: false, ingredient_keys: [] }).verdict).toBe('not_applicable');
  });

  it('detects ingredient keys on whole words only', () => {
    expect(detectIngredientKeys('Iron 65 mg ferrous sulfate')).toContain('iron');
    expect(detectIngredientKeys('good for the environment')).not.toContain('iron');
  });
});

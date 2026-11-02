// P0 safety invariants (Nov 2). Two layers, so a catalog change can never make
// a safety test go quiet:
//   1. Synthetic, immutable test products, one per rule, with hard expectations.
//   2. A sweep over the WHOLE catalog x personas that checks properties that
//      must hold for every product, whatever the catalog contains.
import { describe, expect, it } from 'vitest';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, fitsHerProfile } from '../data/products.js';
import { EMPTY } from '../mobile/data/intakeModel.js';
import { buildProductProfile } from './productProfile.js';
import { decideProduct, clearedForRecommendation } from './cleared.js';
import { catalogCandidatesForConcern } from '../../api/llm-recommendations.js';

const base = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };
const quiz = (over) => ({ fullHealthIntake: { ...EMPTY, ...over }, personalizationCompleted: true });
const decide = (p, intake) => decideProduct(getProductMatchDetailsForProduct(p, quiz(intake)));
const RANK = { excluded: 0, hold: 1, no_fit: 1, cleared: 2 };

// ---------- 1. synthetic products (never edited to make a test pass) ----------
const SYN = {
  herbalNoPregnancyData: { id: 'syn-herbal', name: 'Synthetic Herbal Sleep Blend', brand: 'Test Co', category: 'supplement', type: 'supplement', price: 20, tags: ['sleep'], healthFunctions: ['sleep'], ingredients: ['valerian root', 'passionflower'], summary: 'Herbal blend for sleep.' },
  stJohnsWort: { id: 'syn-sjw', name: "Synthetic St. John's Wort Mood Capsules", brand: 'Test Co', category: 'supplement', type: 'supplement', price: 15, tags: ['mood'], healthFunctions: ['mood'], ingredients: ["st. john's wort"], summary: 'Herbal mood support.' },
  latexCondom: { id: 'syn-condom', name: 'Synthetic Latex Condoms', brand: 'Test Co', category: 'condom', type: 'product', price: 10, tags: ['sexual-health'], materials: ['latex'], ingredients: ['natural rubber latex'], summary: 'Latex condoms.' },
};

describe('P0 synthetic: hard rules on fixed test products', () => {
  it('a herbal supplement is never cleared for a pregnant person', () => {
    const d = decide(SYN.herbalNoPregnancyData, { ...base, lifeStageSelections: ['I am pregnant'], supportSelections: ['Trouble sleeping'] });
    expect(d.status).not.toBe('cleared');
  });
  it("St. John's wort is never cleared for someone on the pill", () => {
    const d = decide(SYN.stJohnsWort, { ...base, takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Low mood or anxiety'] });
    expect(d.status).not.toBe('cleared');
  });
  it('a latex product is never cleared for someone allergic to latex', () => {
    const d = decide(SYN.latexCondom, { ...base, allergyStatus: 'Yes', allergyItems: ['Latex'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Sexual health'] });
    expect(d.status).not.toBe('cleared');
  });
  it('an ingested product is never cleared while allergies and medicines are unanswered', () => {
    const d = decide(SYN.herbalNoPregnancyData, { lifeStageSelections: ['I get periods regularly'], supportSelections: ['Trouble sleeping'] });
    expect(d.status).not.toBe('cleared');
  });
  it('a hold never carries a number', () => {
    const d = decide(SYN.herbalNoPregnancyData, { lifeStageSelections: ['I am pregnant'], supportSelections: ['Trouble sleeping'] });
    expect(d).not.toHaveProperty('percent');
  });
});

// ---------- 2. whole-catalog properties ----------
const PERSONAS = {
  regular: { ...base, lifeStageSelections: ['I get periods regularly'], supportSelections: ['Cramps or period pain', 'Trouble sleeping'] },
  pregnant: { ...base, lifeStageSelections: ['I am pregnant'], supportSelections: ['Trouble sleeping', 'Nausea'] },
  breastfeeding: { ...base, lifeStageSelections: ['I am breastfeeding'], supportSelections: ['Trouble sleeping'] },
  postmenopause: { ...base, lifeStageSelections: ['I am post-menopause'], supportSelections: ['Hot flashes', 'Vaginal dryness'] },
  onMedicines: { ...base, takesCurrent: 'Yes', currentMedicationItems: ['Birth control pill', 'Sertraline'], lifeStageSelections: ['I get periods regularly'], supportSelections: ['Low mood or anxiety', 'Trouble sleeping'] },
  unanswered: { supportSelections: ['Trouble sleeping', 'Cramps or period pain'] },
};
const products = ALL_PRODUCTS.filter((p) => p && p.id);

describe('P0 catalog sweep: properties every product must keep', () => {
  it('anything not cleared is never offered to the AI or shown as a fit', () => {
    const problems = [];
    for (const [name, intake] of Object.entries(PERSONAS)) {
      const offered = new Set();
      for (const concern of intake.supportSelections) {
        for (const p of catalogCandidatesForConcern(ALL_PRODUCTS, concern, 500, { ...intake })) offered.add(p.id);
      }
      for (const p of products) {
        const d = getProductMatchDetailsForProduct(p, quiz(intake));
        const dec = decideProduct(d);
        if (dec.status === 'cleared') continue;
        if (dec.status !== 'no_fit' && fitsHerProfile(p, quiz(intake))) problems.push(`${name}: ${p.id} is ${dec.status} but listed as a fit`);
        if (offered.has(p.id)) problems.push(`${name}: ${p.id} is ${dec.status} but offered to the AI`);
        if (dec.status === 'hold' && Number(d.percent) > 0) problems.push(`${name}: ${p.id} is held but has a percent`);
      }
    }
    expect(problems).toEqual([]);
  }, 120000);

  it('ingested products are never cleared while safety answers are missing', () => {
    const cleared = products.filter((p) => {
      let pp; try { pp = buildProductProfile(p); } catch { return false; }
      return pp.ingested && clearedForRecommendation(getProductMatchDetailsForProduct(p, quiz(PERSONAS.unanswered)));
    }).map((p) => p.id);
    expect(cleared).toEqual([]);
  }, 120000);

  it('adding an allergy to one of its ingredients never makes a product more recommendable', () => {
    const worse = [];
    for (const p of products) {
      const ing = (Array.isArray(p.ingredients) ? p.ingredients : []).find((x) => typeof x === 'string' && x.length > 2);
      if (!ing) continue;
      const before = decide(p, PERSONAS.regular).status;
      const after = decide(p, { ...PERSONAS.regular, allergyStatus: 'Yes', allergyItems: [ing] }).status;
      if (RANK[after] > RANK[before]) worse.push(`${p.id}: ${before} -> ${after}`);
    }
    expect(worse).toEqual([]);
  }, 120000);

  it('commercial fields never change a match (no partner, commission or margin signal)', () => {
    const changed = [];
    for (const p of products.slice(0, 120)) {
      const a = getProductMatchDetailsForProduct(p, quiz(PERSONAS.regular));
      const b = getProductMatchDetailsForProduct({ ...p, partner: true, isPartner: true, commission: 0.4, commissionRate: 0.4, margin: 0.6, sponsored: true, featured: true, affiliateUrl: 'https://partner.example' }, quiz(PERSONAS.regular));
      if (a.percent !== b.percent || a.matchStatus !== b.matchStatus) changed.push(p.id);
    }
    expect(changed).toEqual([]);
  }, 120000);
});

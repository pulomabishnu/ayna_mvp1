#!/usr/bin/env node
// Research plan (P2 research pipeline, Oct 29).
//
// Which product facts would lift the most "Checking this product" holds?
// Runs every catalog product past a fixed panel of sensitive personas
// (allergies, listed medicines, pregnancy, breastfeeding, trying to conceive),
// each asking for every need the product is relevant to, through the same
// gate the site uses (evaluateSafety). Prints one row per product with the
// facts that are missing and how many personas they hold back, highest first.
//
// It plans research; it never writes product facts. Facts go into the product
// passport by hand, from a source someone has read (CLAUDE.md "Catalog content
// accuracy"). Regulatory status comes from openFDA, never from a model.
//
//   npm run research:plan                 # table
//   npm run research:plan -- --json out.json
import { writeFileSync } from 'node:fs';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { buildProductProfile } from '../src/matching/productProfile.js';
import { buildUserProfile } from '../src/matching/userProfile.js';
import { evaluateSafety, PRODUCT_INFO_TEXT } from '../src/matching/score.js';
import { NEED_BY_ID } from '../src/matching/ontology.js';

const PANEL = [
  { name: 'fragrance allergy', intake: { allergyStatus: 'Yes', allergyItems: ['Fragrance'] } },
  { name: 'latex allergy', intake: { allergyStatus: 'Yes', allergyItems: ['Latex'] } },
  { name: 'on sertraline', intake: { takesCurrent: 'Yes', currentMedicationItems: ['Sertraline'] } },
  { name: 'on levothyroxine', intake: { takesCurrent: 'Yes', currentMedicationItems: ['Levothyroxine'] } },
  { name: 'pregnant', intake: { lifeStageSelections: ['I am pregnant'] } },
  { name: 'breastfeeding', intake: { lifeStageSelections: ['I am postpartum'], breastfeedingStatus: 'Yes' } },
  { name: 'trying to conceive', intake: { lifeStageSelections: ['I am trying to conceive'] } },
];
const BASE = { allergyStatus: 'No', takesCurrent: 'No', safetyConcern: 'No', diagnosisSelections: ['None that I know of'] };

const rows = [];
for (const p of ALL_PRODUCTS) {
  const pp = buildProductProfile(p);
  const needs = Object.keys(pp.health_need_relevance || {}).map((id) => NEED_BY_ID[id]?.option).filter(Boolean);
  if (!needs.length) continue;
  const facts = new Map();
  let held = 0;
  for (const persona of PANEL) {
    const up = buildUserProfile({ ...BASE, lifeStageSelections: ['I get periods regularly'], ...persona.intake, supportSelections: needs.slice(0, 6) }, { catalog: ALL_PRODUCTS });
    const s = evaluateSafety(pp, up);
    if (!s.eligible || !s.restricted) continue;
    const info = s.missingProductInfo.filter((f) => f !== 'clinician_review');
    if (!info.length) continue;
    held += 1;
    for (const f of info) facts.set(f, [...(facts.get(f) || []), persona.name]);
  }
  if (!facts.size) continue;
  rows.push({
    id: p.id, name: p.name, category: p.category, held,
    clinicianReview: pp.passport?.qa === 'needs_clinician_review',
    facts: [...facts.entries()].map(([fact, who]) => ({ fact, need: PRODUCT_INFO_TEXT[fact] || fact, holdsFor: who })),
  });
}
rows.sort((a, b) => b.held - a.held || b.facts.length - a.facts.length || a.name.localeCompare(b.name));

const out = process.argv.indexOf('--json');
if (out > 0 && process.argv[out + 1]) {
  writeFileSync(process.argv[out + 1], JSON.stringify(rows, null, 2));
  console.log(`Wrote ${rows.length} products to ${process.argv[out + 1]}`);
} else {
  console.log(`${rows.length} products have safety facts missing that hold matches back (panel of ${PANEL.length} personas).\n`);
  for (const r of rows.slice(0, 40)) {
    console.log(`${String(r.held).padStart(2)}/${PANEL.length}  ${r.name} (${r.id})${r.clinicianReview ? '  [clinician review open]' : ''}`);
    for (const f of r.facts) console.log(`        needs ${f.need}  ← ${f.holdsFor.join(', ')}`);
  }
}

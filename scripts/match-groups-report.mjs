#!/usr/bin/env node
// Per-group match report (Nov 2). Aggregate quality can hide a group that is
// served badly: pregnant, trying, breastfeeding, post-menopause, on medicines,
// with allergies, or with missing answers. For each, through the live engine:
// how many products are cleared, held or excluded, the band mix of what is
// cleared (Strong / Good / Partial), and how many of her needs get at least
// one cleared product (coverage). Run it before and after any matching change.
//
//   npm run match:groups            npm run match:groups -- --json out.json
import { writeFileSync } from 'node:fs';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct } from '../src/data/products.js';
import { EMPTY } from '../src/mobile/data/intakeModel.js';
import { decideProduct } from '../src/matching/cleared.js';
import { catalogCandidatesForConcern } from '../api/llm-recommendations.js';
import { PERSONAS } from './lib/personas.mjs';

const quiz = (i) => ({ fullHealthIntake: { ...EMPTY, ...i }, personalizationCompleted: true });
const rows = [];
for (const [group, intake] of Object.entries(PERSONAS)) {
  const t = { cleared: 0, hold: 0, excluded: 0, no_fit: 0 };
  const bands = { strong: 0, good: 0, partial: 0, other: 0 };
  for (const p of ALL_PRODUCTS) {
    const d = getProductMatchDetailsForProduct(p, quiz(intake));
    const dec = decideProduct(d);
    t[dec.status] += 1;
    if (dec.status === 'cleared') bands[d.v2?.band in bands ? d.v2.band : 'other'] += 1;
  }
  const needs = intake.supportSelections;
  const covered = needs.filter((n) => catalogCandidatesForConcern(ALL_PRODUCTS, n, 60, intake).length > 0).length;
  const relevant = t.cleared + t.hold;
  rows.push({ group, ...t, holdRate: relevant ? +(t.hold / relevant).toFixed(2) : 0, strongShare: t.cleared ? +(bands.strong / t.cleared).toFixed(2) : 0, bands, coverage: `${covered}/${needs.length}` });
}
const out = process.argv.indexOf('--json');
if (out > 0) writeFileSync(process.argv[out + 1], JSON.stringify(rows, null, 2));
console.log('group           cleared  hold  hold-rate  strong  good  partial  needs-covered');
for (const r of rows) console.log(`${r.group.padEnd(15)} ${String(r.cleared).padStart(7)} ${String(r.hold).padStart(5)} ${String(r.holdRate).padStart(10)} ${String(r.bands.strong).padStart(7)} ${String(r.bands.good).padStart(5)} ${String(r.bands.partial).padStart(8)}  ${r.coverage}`);
console.log('\nA high hold rate means missing product facts or answers, not unsafe products: fix the data (npm run catalog:readiness), not the gate.');

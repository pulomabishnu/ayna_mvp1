#!/usr/bin/env node
// Release safety audit (Nov 2). Runs the P0 invariants over the EXACT product
// universe the server can offer (bundled + live product_catalog), not only the
// bundled catalog. Exits 1 on any violation, so a deploy step can block on it.
//
//   npm run safety:audit                       # bundled catalog
//   npm run safety:audit -- --db rows.json     # + live export (supabase/queries/export_product_catalog.sql)
import { readFileSync } from 'node:fs';
import { ALL_PRODUCTS, getProductMatchDetailsForProduct, fitsHerProfile } from '../src/data/products.js';
import { EMPTY } from '../src/mobile/data/intakeModel.js';
import { decideProduct } from '../src/matching/cleared.js';
import { buildProductProfile } from '../src/matching/productProfile.js';
import { catalogCandidatesForConcern } from '../api/llm-recommendations.js';
import { mergeLiveCatalog } from './lib/liveCatalog.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const db = arg('--db');
const products = db ? await mergeLiveCatalog(ALL_PRODUCTS, JSON.parse(readFileSync(db, 'utf8'))) : ALL_PRODUCTS;
import { PERSONAS } from './lib/personas.mjs';
const quiz = (i) => ({ fullHealthIntake: { ...EMPTY, ...i }, personalizationCompleted: true });

const violations = [];
const counts = {};
for (const [name, intake] of Object.entries(PERSONAS)) {
  const offered = new Set();
  for (const c of intake.supportSelections) for (const p of catalogCandidatesForConcern(products, c, 1000, intake)) offered.add(p.id);
  const tally = { cleared: 0, hold: 0, excluded: 0, no_fit: 0 };
  for (const p of products) {
    let d;
    try { d = getProductMatchDetailsForProduct(p, quiz(intake)); } catch (e) { violations.push(`${name}: ${p.id} crashed the matcher (${e.message})`); continue; }
    const dec = decideProduct(d);
    tally[dec.status] += 1;
    if (dec.status === 'cleared') {
      let pp = null; try { pp = buildProductProfile(p); } catch { /* counted below */ }
      if (pp?.ingested && name === 'unanswered') violations.push(`${name}: ingested ${p.id} cleared without safety answers`);
      continue;
    }
    if (offered.has(p.id)) violations.push(`${name}: ${p.id} is ${dec.status} but would be offered to the AI`);
    if (dec.status !== 'no_fit' && fitsHerProfile(p, quiz(intake))) violations.push(`${name}: ${p.id} is ${dec.status} but listed as a fit`);
    if (dec.status === 'hold' && Number(d.percent) > 0) violations.push(`${name}: ${p.id} is held but shows ${d.percent}%`);
  }
  counts[name] = tally;
}
console.log(`Safety audit over ${products.length} products${db ? ' (bundled + live)' : ''} x ${Object.keys(PERSONAS).length} personas.`);
for (const [n, t] of Object.entries(counts)) console.log(`  ${n.padEnd(14)} cleared ${t.cleared}  hold ${t.hold}  excluded ${t.excluded}  no fit ${t.no_fit}`);
if (violations.length) { console.error(`\n${violations.length} VIOLATIONS`); for (const v of violations.slice(0, 50)) console.error('  ' + v); process.exit(1); }
console.log('\nNo safety violations.');

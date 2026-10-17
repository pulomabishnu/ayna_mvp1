// Drafts the product x need table for clinical review (audit deep dive 2, step 2).
// Every row is reviewed: false until a reviewer confirms strength and grade;
// confirmed rows go into NEED_MAP_REVIEWED in src/matching/v2.js.
// Ordered by how often v2 shows the product in the persona sweep, so the
// review starts with what users actually see.
// Run: npx vite-node scripts/needmap-draft.mjs
import fs from 'node:fs';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { buildProductProfile } from '../src/matching/productProfile.js';
import { evidenceGrade } from '../src/matching/v2.js';
import { makeProfiles } from '../src/matching/v2sweep/sweep.js';
import { getEcosystemSeedFromQuiz } from '../src/data/products.js';

const shown = new Map();
for (const intake of makeProfiles(400, 3)) {
  const s = getEcosystemSeedFromQuiz({ fullHealthIntake: intake, personalizationCompleted: true }, null, { engine: 'v2' });
  new Set(s.shelves.flatMap((sh) => sh.productIds || [])).forEach((id) => shown.set(id, (shown.get(id) || 0) + 1));
}
const rows = [];
for (const p of ALL_PRODUCTS) {
  const pp = buildProductProfile(p);
  for (const [need, rel] of Object.entries(pp.health_need_relevance || {})) {
    if ((rel?.score ?? 0) < 0.55) continue;
    rows.push({
      product: pp.product_id, name: p.name, need,
      strength: rel.score >= 0.8 ? 'primary' : 'secondary',
      grade: evidenceGrade(pp, need),
      basis_rule: rel.rule || null,
      shown_in_sweep: shown.get(pp.product_id) || 0,
      reviewed: false, reviewer: null, reviewed_on: null,
    });
  }
}
rows.sort((a, b) => b.shown_in_sweep - a.shown_in_sweep || a.product.localeCompare(b.product));
fs.writeFileSync(new URL('../src/data/matching/needMap.draft.json', import.meta.url), `${JSON.stringify(rows, null, 1)}\n`);
const csv = ['product,name,need,strength,grade,basis_rule,shown_in_sweep,reviewed,reviewer,reviewed_on',
  ...rows.map((r) => [r.product, `"${String(r.name).replace(/"/g, '""')}"`, r.need, r.strength, r.grade, r.basis_rule || '', r.shown_in_sweep, 'no', '', ''].join(','))].join('\n');
fs.writeFileSync(new URL('../src/data/matching/needMap.draft.csv', import.meta.url), `${csv}\n`);
console.log(`needMap draft: ${rows.length} rows, ${new Set(rows.map((r) => r.product)).size} products`);

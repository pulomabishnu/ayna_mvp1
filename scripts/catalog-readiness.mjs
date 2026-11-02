#!/usr/bin/env node
// Recommendation readiness report (Nov 2). How much of the catalog is ready to
// be personalized to someone's health, and which missing facts block the most.
//
//   npm run catalog:readiness                         # bundled catalog
//   npm run catalog:readiness -- --db rows.json       # + live product_catalog export
//   npm run catalog:readiness -- --json out.json      # full rows
// Export rows with supabase/queries/export_product_catalog.sql (SQL Editor -> Download JSON).
import { readFileSync, writeFileSync } from 'node:fs';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { summarizeReadiness } from '../src/matching/readiness.js';
import { mergeLiveCatalog } from './lib/liveCatalog.mjs';

const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const db = arg('--db');
const products = db ? await mergeLiveCatalog(ALL_PRODUCTS, JSON.parse(readFileSync(db, 'utf8'))) : ALL_PRODUCTS;
const s = summarizeReadiness(products);
const out = arg('--json');
if (out) { writeFileSync(out, JSON.stringify(s, null, 2)); console.log(`Wrote ${s.total} products to ${out}`); }
console.log(`Catalog: ${s.total} products${db ? ' (bundled + live)' : ''}. Ready to recommend: ${s.byLevel.ready} (${s.readyShare}%).`);
for (const [level, n] of Object.entries(s.byLevel)) console.log(`  ${level.padEnd(22)} ${n}`);
console.log('\nFacts that would unlock the most products:');
for (const b of s.topBlockers.slice(0, 12)) console.log(`  ${String(b.products).padStart(4)}  ${b.fact}`);

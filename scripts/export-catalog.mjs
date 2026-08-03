#!/usr/bin/env node
/**
 * Export the hardcoded catalog in src/data/ to seed files for product_catalog.
 *
 *   node scripts/export-catalog.mjs            # writes both outputs
 *   node scripts/export-catalog.mjs --check    # verifies losslessness, writes nothing
 *
 * Outputs:
 *   supabase/seed/product_catalog.json  — machine-readable, for programmatic seeding
 *   supabase/seed/product_catalog.sql   — idempotent INSERT ... ON CONFLICT DO UPDATE
 *
 * LOSSLESS BY CONSTRUCTION: every key that has no dedicated column is preserved
 * under `extra`, and --check asserts that round-tripping a row reproduces the
 * original object exactly. Migrating a health catalog is not a place to silently
 * drop fields.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { ALL_PRODUCTS } = await import(resolve(root, 'src/data/products.js'));

/** Columns with a home of their own; everything else lands in `extra`. */
const MAPPED = new Map([
  ['id', 'id'],
  ['name', 'name'],
  ['brand', 'brand'],
  ['category', 'category'],
  ['type', 'product_type'],
  ['summary', 'summary'],
  ['price', 'price'],
  ['image', 'image'],
  ['url', 'url'],
  ['tags', 'tags'],
  ['healthFunctions', 'health_functions'],
  ['whereToBuy', 'where_to_buy'],
  ['whereToBuyInStock', 'where_to_buy_in_stock'],
  ['safety', 'safety'],
  ['doctorOpinion', 'doctor_opinion'],
  ['communityReview', 'community_review'],
  ['effectiveness', 'effectiveness'],
  ['clinicianOpinionSource', 'clinician_opinion_source'],
  ['clinicianAttribution', 'clinician_attribution'],
  ['internal', 'internal'],
  ['requiresPrescription', 'requires_prescription'],
  ['userRating', 'user_rating'],
]);

const JSON_COLUMNS = new Set([
  'tags', 'health_functions', 'where_to_buy', 'where_to_buy_in_stock', 'safety', 'extra',
]);

function toRow(p) {
  const row = {
    id: String(p.id),
    name: String(p.name ?? ''),
    brand: p.brand ?? null,
    category: String(p.category ?? 'other'),
    product_type: p.type === 'digital' ? 'digital' : 'physical',
    summary: p.summary ?? null,
    price: p.price ?? null,
    image: p.image ?? null,
    url: p.url ?? null,
    tags: Array.isArray(p.tags) ? p.tags : [],
    health_functions: Array.isArray(p.healthFunctions) ? p.healthFunctions : [],
    where_to_buy: Array.isArray(p.whereToBuy) ? p.whereToBuy : [],
    where_to_buy_in_stock: p.whereToBuyInStock && typeof p.whereToBuyInStock === 'object' ? p.whereToBuyInStock : {},
    safety: p.safety && typeof p.safety === 'object' ? p.safety : {},
    doctor_opinion: p.doctorOpinion ?? null,
    community_review: p.communityReview ?? null,
    effectiveness: p.effectiveness ?? null,
    clinician_opinion_source: p.clinicianOpinionSource ?? null,
    clinician_attribution: p.clinicianAttribution ?? null,
    source: 'curated',
    internal: p.internal === true,
    requires_prescription: p.requiresPrescription === true,
    user_rating: typeof p.userRating === 'number' ? p.userRating : null,
    is_active: true,
    extra: {},
  };
  for (const [key, value] of Object.entries(p)) {
    if (!MAPPED.has(key)) row.extra[key] = value;
  }
  return row;
}

/** Rebuild the original object from a row — used by --check. */
function fromRow(row) {
  const p = {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.product_type,
    tags: row.tags,
    healthFunctions: row.health_functions,
    whereToBuy: row.where_to_buy,
    safety: row.safety,
    ...row.extra,
  };
  if (row.brand !== null) p.brand = row.brand;
  if (row.summary !== null) p.summary = row.summary;
  if (row.price !== null) p.price = row.price;
  if (row.image !== null) p.image = row.image;
  if (row.url !== null) p.url = row.url;
  if (Object.keys(row.where_to_buy_in_stock).length) p.whereToBuyInStock = row.where_to_buy_in_stock;
  if (row.doctor_opinion !== null) p.doctorOpinion = row.doctor_opinion;
  if (row.community_review !== null) p.communityReview = row.community_review;
  if (row.effectiveness !== null) p.effectiveness = row.effectiveness;
  if (row.clinician_opinion_source !== null) p.clinicianOpinionSource = row.clinician_opinion_source;
  if (row.clinician_attribution !== null) p.clinicianAttribution = row.clinician_attribution;
  if (row.internal) p.internal = true;
  if (row.requires_prescription) p.requiresPrescription = true;
  if (row.user_rating !== null) p.userRating = row.user_rating;
  return p;
}

function stable(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
}

/**
 * Normalize before comparing, for fields where "absent" and "falsy" are the
 * SAME thing to every consumer — `p.internal` reads as undefined or false
 * identically, and an empty whereToBuyInStock is equivalent to none at all.
 *
 * Deliberately narrow: it only collapses these specific optional flags. Any
 * genuinely dropped content — a missing safety note, a lost tag, a truncated
 * clinician attribution — still fails the check, which is the point.
 */
const FALSY_EQUIVALENT_KEYS = ['internal', 'requiresPrescription'];
/** Fields that must survive verbatim — a null here is a genuine loss. */
const REQUIRED_KEYS = new Set(['id', 'name', 'category', 'type']);

function normalizeForCompare(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    // For OPTIONAL fields an explicit null and an absent key are
    // indistinguishable to every consumer (`p.userRating` reads falsy either
    // way), so collapsing them is an equivalence, not a blind spot. Required
    // fields are never collapsed.
    if (v === null && !REQUIRED_KEYS.has(k)) continue;
    if (FALSY_EQUIVALENT_KEYS.includes(k) && v === false) continue;
    if (k === 'whereToBuyInStock' && v && typeof v === 'object' && Object.keys(v).length === 0) continue;
    out[k] = v;
  }
  return stable(out);
}

function sqlLiteral(value, column) {
  if (value === null || value === undefined) return 'null';
  if (JSON_COLUMNS.has(column)) return `${quote(JSON.stringify(value))}::jsonb`;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return quote(String(value));
}

function quote(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

// ── Run ──────────────────────────────────────────────────────────────────────
const products = Array.isArray(ALL_PRODUCTS) ? ALL_PRODUCTS : [];
const rows = products.map(toRow);

const seenIds = new Set();
const duplicates = [];
for (const r of rows) {
  if (seenIds.has(r.id)) duplicates.push(r.id);
  seenIds.add(r.id);
}

// Losslessness check — a health catalog must not lose fields in transit.
const lossy = [];
for (let i = 0; i < products.length; i += 1) {
  if (stable(fromRow(rows[i])) !== stable(products[i])) lossy.push(products[i].id);
}

console.log(`products: ${products.length}`);
console.log(`duplicate ids: ${duplicates.length}${duplicates.length ? ` -> ${duplicates.slice(0, 10).join(', ')}` : ''}`);
console.log(`lossy round-trips: ${lossy.length}${lossy.length ? ` -> ${lossy.slice(0, 10).join(', ')}` : ''}`);

if (duplicates.length) {
  console.error('\nRefusing to emit: duplicate ids would collide on the primary key.');
  process.exit(1);
}
if (lossy.length) {
  console.error('\nRefusing to emit: round-trip is not lossless. Add the missing keys to MAPPED or widen `extra`.');
  process.exit(1);
}

if (process.argv.includes('--check')) {
  console.log('\n--check passed: export is lossless and ids are unique.');
  process.exit(0);
}

const outDir = resolve(root, 'supabase/seed');
mkdirSync(outDir, { recursive: true });

writeFileSync(resolve(outDir, 'product_catalog.json'), `${JSON.stringify(rows, null, 2)}\n`);

const columns = Object.keys(rows[0]);
const values = rows
  .map((r) => `  (${columns.map((c) => sqlLiteral(r[c], c)).join(', ')})`)
  .join(',\n');
const updates = columns.filter((c) => c !== 'id').map((c) => `    ${c} = excluded.${c}`).join(',\n');

writeFileSync(
  resolve(outDir, 'product_catalog.sql'),
  `-- GENERATED by scripts/export-catalog.mjs — do not edit by hand.
-- Re-run the script after changing src/data/, or edit the rows in the database
-- directly once the catalog is the source of truth.
-- Idempotent: safe to re-run.

insert into public.product_catalog (${columns.join(', ')})
values
${values}
on conflict (id) do update set
${updates};
`
);

console.log(`\nwrote supabase/seed/product_catalog.json`);
console.log(`wrote supabase/seed/product_catalog.sql (${rows.length} rows)`);

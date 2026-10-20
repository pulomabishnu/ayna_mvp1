#!/usr/bin/env node
/**
 * Export the hardcoded catalog in src/data/ to seed files for product_catalog.
 *
 *   node scripts/export-catalog.mjs            # writes both outputs
 *   node scripts/export-catalog.mjs --check    # verifies losslessness, writes nothing
 *   node scripts/export-catalog.mjs --brand VPod   # only that brand's rows (npm run catalog:sql -- VPod)
 *   node scripts/export-catalog.mjs --sync    # npm run catalog:sync, see below
 *
 * --sync writes supabase/seed/<date>_catalog_sync.sql (PostHog audit, Oct 20):
 * adds products that exist in src/data/ but not in product_catalog (never
 * overwriting a row that is already there), fills brand where it is empty
 * (team brand, else src/data/catalogBrands.js), and sets the new concerns /
 * primary_concern columns from the research need map
 * (src/data/catalogConcerns.js). Paste it into the Supabase SQL Editor.
 *
 * HIDDEN PRODUCTS: an entry with `hidden: true` is still exported, as
 * is_active=false, so hiding a product never drops its row. --brand writes
 * supabase/seed/<date>_<brand>_<hidden|live|mixed>.sql from the current
 * src/data/ text, to paste into the Supabase SQL Editor.
 *
 * Outputs:
 *   supabase/seed/product_catalog.json, machine-readable, for programmatic seeding
 *   supabase/seed/product_catalog.sql, idempotent INSERT ... ON CONFLICT DO UPDATE
 *
 * LOSSLESS BY CONSTRUCTION: every key that has no dedicated column is preserved
 * under `extra`, and --check asserts that round-tripping a row reproduces the
 * original object exactly. Migrating a health catalog is not a place to silently
 * drop fields.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// pathToFileURL is required on Windows — a raw absolute path like
// "C:\...\products.js" passed straight to a dynamic import() throws
// ERR_UNSUPPORTED_ESM_URL_SCHEME (node treats "C:" as an unsupported URL
// scheme); Windows Node's loader only accepts file:// URLs for import().
const { CATALOG_PRODUCTS } = await import(pathToFileURL(resolve(root, 'src/data/products.js')));

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
  // Inverted: hidden: true <-> is_active = false.
  ['hidden', 'is_active'],
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
    is_active: p.hidden !== true,
    extra: {},
  };
  for (const [key, value] of Object.entries(p)) {
    if (!MAPPED.has(key)) row.extra[key] = value;
  }
  return row;
}

/** Rebuild the original object from a row, used by --check. */
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
  if (row.is_active === false) p.hidden = true;
  return p;
}

function stable(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stable).join(',')}]`;
  return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${stable(v[k])}`).join(',')}}`;
}

/**
 * Normalize before comparing, for fields where "absent" and "falsy" are the
 * SAME thing to every consumer`p.internal` reads as undefined or false
 * identically, and an empty whereToBuyInStock is equivalent to none at all.
 *
 * Deliberately narrow: it only collapses these specific optional flags. Any
 * genuinely dropped content, a missing safety note, a lost tag, a truncated
 * clinician attribution, still fails the check, which is the point.
 */
const FALSY_EQUIVALENT_KEYS = ['internal', 'requiresPrescription', 'hidden'];
/** Fields that must survive verbatim, a null here is a genuine loss. */
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
const products = Array.isArray(CATALOG_PRODUCTS) ? CATALOG_PRODUCTS : [];
const rows = products.map(toRow);

const seenIds = new Set();
const duplicates = [];
for (const r of rows) {
  if (seenIds.has(r.id)) duplicates.push(r.id);
  seenIds.add(r.id);
}

// Losslessness check, a health catalog must not lose fields in transit.
const lossy = [];
for (let i = 0; i < products.length; i += 1) {
  if (normalizeForCompare(fromRow(rows[i])) !== normalizeForCompare(products[i])) lossy.push(products[i].id);
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

const columns = Object.keys(rows[0]);
const valuesFor = (list) => list
  .map((r) => `  (${columns.map((c) => sqlLiteral(r[c], c)).join(', ')})`)
  .join(',\n');
const updates = columns.filter((c) => c !== 'id').map((c) => `    ${c} = excluded.${c}`).join(',\n');

if (process.argv.includes('--sync')) {
  const { CATALOG_BRANDS } = await import(pathToFileURL(resolve(root, 'src/data/catalogBrands.js')));
  const { CATALOG_CONCERNS } = await import(pathToFileURL(resolve(root, 'src/data/catalogConcerns.js')));
  const teamBrand = new Map(rows.map((r) => [r.id, r.brand]));
  const brandFill = new Map();
  for (const r of rows) {
    const b = (r.brand && String(r.brand).trim()) || CATALOG_BRANDS[r.id];
    if (b) brandFill.set(r.id, b);
  }
  for (const [id, b] of Object.entries(CATALOG_BRANDS)) if (!teamBrand.has(id)) brandFill.set(id, b);
  const concernIds = Object.keys(CATALOG_CONCERNS).filter((id) => CATALOG_CONCERNS[id].concerns.length).sort();
  const noConcern = rows.filter((r) => r.is_active && !CATALOG_CONCERNS[r.id]?.concerns?.length).map((r) => r.id);
  const file = `${new Date().toISOString().slice(0, 10)}_catalog_sync.sql`;
  const brandValues = [...brandFill].sort(([a], [b]) => a.localeCompare(b)).map(([id, b]) => `  (${quote(id)}, ${quote(b)})`).join(',\n');
  const concernValues = concernIds.map((id) => `  (${quote(id)}, ${quote(JSON.stringify(CATALOG_CONCERNS[id].concerns))}::jsonb, ${quote(CATALOG_CONCERNS[id].primaryConcern)})`).join(',\n');
  writeFileSync(
    resolve(outDir, file),
    `-- GENERATED by scripts/export-catalog.mjs --sync, do not edit by hand.
-- Paste into the Supabase SQL Editor and run once. Idempotent: safe to re-run.
-- 1. Adds concerns / primary_concern columns (specific needs, e.g. vaginal.dryness, urinary.recurrent_uti).
-- 2. Inserts the ${rows.length} src/data/ products; rows already in product_catalog are left exactly as they are.
-- 3. Fills brand only where it is NULL or blank (${brandFill.size} known brands).
-- 4. Sets concerns for ${concernIds.length} products from the research need map.
-- Active products with no researched need yet (concerns stay empty, ${noConcern.length}):
--   ${noConcern.join(', ')}

begin;

alter table public.product_catalog add column if not exists concerns jsonb not null default '[]'::jsonb;
alter table public.product_catalog add column if not exists primary_concern text;

insert into public.product_catalog (${columns.join(', ')})
values
${valuesFor(rows)}
on conflict (id) do nothing;

update public.product_catalog as pc
set brand = v.brand
from (values
${brandValues}
) as v(id, brand)
where pc.id = v.id and (pc.brand is null or btrim(pc.brand) = '');

update public.product_catalog as pc
set concerns = v.concerns, primary_concern = v.primary_concern
from (values
${concernValues}
) as v(id, concerns, primary_concern)
where pc.id = v.id;

commit;
`
  );
  console.log(`\nwrote supabase/seed/${file}: ${rows.length} products (insert-if-missing), ${brandFill.size} brands, ${concernIds.length} with concerns, ${noConcern.length} active without`);
  process.exit(0);
}

const brandArg = process.argv.indexOf('--brand');
if (brandArg !== -1) {
  const brand = String(process.argv[brandArg + 1] || '').trim();
  if (!brand) {
    console.error('\nUsage: npm run catalog:sql -- <brand name>');
    process.exit(1);
  }
  const brandRows = rows.filter((r) => String(r.brand || '').toLowerCase() === brand.toLowerCase());
  if (!brandRows.length) {
    console.error(`\nNo products with brand "${brand}" in src/data/.`);
    process.exit(1);
  }
  const live = brandRows.filter((r) => r.is_active);
  const hidden = brandRows.filter((r) => !r.is_active);
  const state = !hidden.length ? 'live' : !live.length ? 'hidden' : 'mixed';
  const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const file = `${new Date().toISOString().slice(0, 10)}_${slug}_${state}.sql`;
  writeFileSync(
    resolve(outDir, file),
    `-- GENERATED by scripts/export-catalog.mjs --brand ${JSON.stringify(brand)}, do not edit by hand.
-- Paste into the Supabase SQL Editor. Idempotent: safe to re-run.
-- Live (is_active = true): ${live.map((r) => r.id).join(', ') || 'none'}
-- Hidden (is_active = false): ${hidden.map((r) => r.id).join(', ') || 'none'}

insert into public.product_catalog (${columns.join(', ')})
values
${valuesFor(brandRows)}
on conflict (id) do update set
${updates}
where public.product_catalog.id = excluded.id;
`
  );
  console.log(`\nwrote supabase/seed/${file} (${live.length} live, ${hidden.length} hidden)`);
  process.exit(0);
}

writeFileSync(resolve(outDir, 'product_catalog.json'), `${JSON.stringify(rows, null, 2)}\n`);
const values = valuesFor(rows);

writeFileSync(
  resolve(outDir, 'product_catalog.sql'),
  `-- GENERATED by scripts/export-catalog.mjs, do not edit by hand.
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

#!/usr/bin/env node
/**
 * LEGACY OVERSIZED AUTH METADATA cleanup (founder spec, 2026-10).
 *
 * Older builds copied whole ecosystem / saved-products blobs into Supabase
 * Auth user_metadata:
 *
 *   ayna_ecosystem_shadow_v2   { version, resetAt, rows: { productId: { product,
 *                                inEcosystem, isTracked, isOmitted, updatedAt } } }
 *   ayna_saved_products_v1     { productId: product }
 *
 * user_metadata is embedded in every access JWT, so those blobs inflate the
 * Authorization header until authenticated requests start failing (HTTP 431 on
 * Vercel). The durable source of truth is public.user_ecosystems. This script,
 * for EVERY user (or one, with --email):
 *
 *   1. reads the legacy blob keys
 *   2. compares them with the user's user_ecosystems rows
 *   3. migrates anything missing into the table, never clearing a flag the
 *      table already has and never overwriting a newer table row (the table
 *      wins on equal-or-newer updated_at)
 *   4. verifies by re-reading the table: every expected product_id must exist
 *      with the expected flags, and the row count must have grown by exactly
 *      the number of inserted rows
 *   5. ONLY after that verification passes, strips the blob keys from
 *      user_metadata (every other key - first_name, consent, heard_about,
 *      ayna_app_signed_in_at... - is left untouched)
 *
 * It NEVER deletes the blob first. Any failure for a user leaves that user's
 * metadata exactly as it was and is reported at the end.
 *
 * Usage (DRY RUN is the default; nothing is written without --apply):
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/auth/metadata-cleanup.mjs                 # dry run, all users
 *     node scripts/auth/metadata-cleanup.mjs --email a@b.co  # dry run, one user
 *     node scripts/auth/metadata-cleanup.mjs --apply         # actually migrate + strip
 *
 * Requires the SERVICE ROLE key (Dashboard -> Project Settings -> API).
 * Never expose that key to a browser; run this from a trusted machine only.
 * After applying, each affected user's next token refresh (or next sign-in)
 * carries a compact JWT; the per-user "after" size printed below is computed
 * from the cleaned metadata.
 */
import { createClient } from '@supabase/supabase-js';

const BLOAT_KEYS = ['ayna_ecosystem_shadow_v2', 'ayna_saved_products_v1'];
const APPLY = process.argv.includes('--apply');
const emailFlagIdx = process.argv.indexOf('--email');
const ONLY_EMAIL = emailFlagIdx !== -1 ? String(process.argv[emailFlagIdx + 1] || '').toLowerCase() : null;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role, never the anon key).');
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const bytes = (v) => JSON.stringify(v ?? null).length;

function legacyEcosystemRows(blob) {
  const rows = blob && typeof blob === 'object' && blob.rows && typeof blob.rows === 'object' ? blob.rows : {};
  const out = [];
  for (const [productId, row] of Object.entries(rows)) {
    const product = row?.product;
    if (!productId || !product || typeof product !== 'object') continue;
    out.push({
      product_id: productId,
      product,
      in_ecosystem: !!row.inEcosystem,
      is_tracked: !!row.isTracked,
      is_omitted: !!row.isOmitted,
      updatedAt: Number(row.updatedAt || 0) || 0,
    });
  }
  return out;
}

function legacySavedRows(blob) {
  if (!blob || typeof blob !== 'object') return [];
  return Object.entries(blob)
    .filter(([id, product]) => id && product && typeof product === 'object')
    .map(([product_id, product]) => ({ product_id, product }));
}

async function tableRowsFor(userId) {
  const { data, error } = await admin.from('user_ecosystems').select('*').eq('user_id', userId);
  if (error) throw new Error(`user_ecosystems read failed: ${error.message}`);
  return new Map((data || []).map((r) => [r.product_id, r]));
}

/** Plan the table writes for one user. Table rows always win on ties/newer. */
function planWrites(userId, ecoRows, savedRows, existing) {
  const upserts = new Map(); // product_id -> row to upsert
  const expectations = []; // [{product_id, flags: {col: true}}] verified after writing

  for (const row of ecoRows) {
    const current = existing.get(row.product_id);
    const wantedFlags = ['in_ecosystem', 'is_tracked', 'is_omitted'].filter((f) => row[f]);
    if (!current) {
      if (!wantedFlags.length) continue; // fully inactive legacy row: nothing durable to add
      upserts.set(row.product_id, {
        user_id: userId,
        product_id: row.product_id,
        product_name: row.product.name ?? null,
        brand: row.product.brand ?? null,
        category: row.product.category ?? null,
        product_type: row.product.type ?? null,
        product_data: row.product,
        in_ecosystem: row.in_ecosystem,
        is_tracked: row.is_tracked,
        is_omitted: row.is_omitted,
        updated_at: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
      });
      expectations.push({ product_id: row.product_id, flags: wantedFlags });
      continue;
    }
    const tableNewer = (Date.parse(current.updated_at || '') || 0) >= row.updatedAt;
    if (tableNewer) continue; // preserve the newer table row untouched
    // Blob is newer: OR missing flags on, never clear one the table has,
    // and keep the table's product_data when it already has one.
    const missing = wantedFlags.filter((f) => !current[f]);
    if (!missing.length) continue;
    upserts.set(row.product_id, {
      ...current,
      product_data: current.product_data || row.product,
      ...Object.fromEntries(missing.map((f) => [f, true])),
      updated_at: new Date(row.updatedAt).toISOString(),
    });
    expectations.push({ product_id: row.product_id, flags: wantedFlags });
  }

  for (const row of savedRows) {
    const pending = upserts.get(row.product_id);
    const current = pending || existing.get(row.product_id);
    if (current?.is_saved) {
      if (pending) expectationsPush(expectations, row.product_id, 'is_saved');
      continue;
    }
    upserts.set(row.product_id, current ? { ...current, is_saved: true, updated_at: current.updated_at || new Date().toISOString() } : {
      user_id: userId,
      product_id: row.product_id,
      product_name: row.product.name ?? null,
      brand: row.product.brand ?? null,
      category: row.product.category ?? null,
      product_type: row.product.type ?? null,
      product_data: row.product,
      in_ecosystem: false,
      is_tracked: false,
      is_omitted: false,
      is_saved: true,
      updated_at: new Date().toISOString(),
    });
    expectationsPush(expectations, row.product_id, 'is_saved');
  }

  return { upserts: [...upserts.values()], expectations };
}

function expectationsPush(expectations, productId, flag) {
  const found = expectations.find((e) => e.product_id === productId);
  if (found) { if (!found.flags.includes(flag)) found.flags.push(flag); }
  else expectations.push({ product_id: productId, flags: [flag] });
}

async function processUser(user) {
  const meta = user.user_metadata || {};
  const present = BLOAT_KEYS.filter((k) => meta[k] !== undefined);
  if (!present.length) return null;

  const before = { metaBytes: bytes(meta), keys: present };
  const ecoRows = legacyEcosystemRows(meta.ayna_ecosystem_shadow_v2);
  const savedRows = legacySavedRows(meta.ayna_saved_products_v1);

  const existing = await tableRowsFor(user.id);
  const beforeCount = existing.size;
  const { upserts, expectations } = planWrites(user.id, ecoRows, savedRows, existing);
  const newRowIds = upserts.filter((r) => !existing.has(r.product_id)).map((r) => r.product_id);

  console.log(`\n${user.email || user.id}  (${user.id})`);
  console.log(`  before: metadata ${before.metaBytes} chars, legacy keys: ${present.join(', ')}`);
  console.log(`  legacy blob: ${ecoRows.length} ecosystem rows, ${savedRows.length} saved products`);
  console.log(`  table: ${beforeCount} rows; to migrate: ${upserts.length} upserts (${newRowIds.length} new rows)`);

  if (!APPLY) {
    console.log('  dry run: nothing written, metadata untouched.');
    return { userId: user.id, applied: false };
  }

  // 1) migrate (chunked)
  for (let i = 0; i < upserts.length; i += 100) {
    const chunk = upserts.slice(i, i + 100);
    const { error } = await admin.from('user_ecosystems').upsert(chunk, { onConflict: 'user_id,product_id' });
    if (error) throw new Error(`migration upsert failed (metadata NOT touched): ${error.message}`);
  }

  // 2) verify every expectation against a fresh read
  const after = await tableRowsFor(user.id);
  if (after.size < beforeCount + newRowIds.length) {
    throw new Error(`row count ${after.size} < expected ${beforeCount + newRowIds.length} (metadata NOT touched)`);
  }
  for (const exp of expectations) {
    const row = after.get(exp.product_id);
    if (!row) throw new Error(`verify failed: ${exp.product_id} missing from table (metadata NOT touched)`);
    for (const flag of exp.flags) {
      if (!row[flag]) throw new Error(`verify failed: ${exp.product_id}.${flag} not set (metadata NOT touched)`);
    }
  }

  // 3) only now strip the blob keys, leaving every other metadata key as-is
  const cleaned = { ...meta };
  for (const k of present) delete cleaned[k];
  const { error: stripError } = await admin.auth.admin.updateUserById(user.id, { user_metadata: cleaned });
  if (stripError) throw new Error(`metadata strip failed after successful migration: ${stripError.message}`);

  console.log(`  after: table ${after.size} rows (verified), metadata ${bytes(cleaned)} chars (was ${before.metaBytes})`);
  console.log('  next token refresh / sign-in gets a compact JWT.');
  return { userId: user.id, applied: true };
}

console.log(`\n${APPLY ? 'APPLY' : 'DRY RUN (use --apply to write)'} - scanning auth users for legacy metadata blobs...`);

let page = 1;
let scanned = 0;
let affected = 0;
let appliedCount = 0;
const failures = [];

for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error('listUsers failed:', error.message); process.exit(1); }
  const users = data?.users || [];
  for (const user of users) {
    if (ONLY_EMAIL && (user.email || '').toLowerCase() !== ONLY_EMAIL) continue;
    scanned += 1;
    try {
      const result = await processUser(user);
      if (result) { affected += 1; if (result.applied) appliedCount += 1; }
    } catch (e) {
      failures.push({ user: user.email || user.id, reason: e.message });
      console.error(`  FAILED (left untouched): ${e.message}`);
    }
  }
  if (users.length < 200) break;
  page += 1;
}

console.log(`\nDone. Scanned ${scanned} user(s); ${affected} had legacy blobs; ${appliedCount} cleaned${APPLY ? '' : ' (0 expected, dry run)'}.`);
if (failures.length) {
  console.log(`${failures.length} user(s) failed and were left untouched:`);
  for (const f of failures) console.log(`  - ${f.user}: ${f.reason}`);
  process.exit(1);
}

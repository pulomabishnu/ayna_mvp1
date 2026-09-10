#!/usr/bin/env node
/**
 * Read-only check: does the live user_ecosystems table actually have the
 * is_saved column that supabase/user_ecosystems.sql adds via
 * `alter table ... add column if not exists is_saved`?
 *
 * If that migration was never run against this Supabase project, every
 * save/swap/track write hits Postgres error 42703 (undefined column),
 * which is exactly what triggers savedProductsStore.js's/ecosystemStore.js's
 * auth-metadata fallback — the thing that keeps bloating the login token
 * past HTTP 431's header size limit.
 *
 *   node scripts/diagnose-user-ecosystems-schema.mjs
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n');
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

console.log('\nChecking public.user_ecosystems columns...\n');

const expectedColumns = [
  'user_id', 'product_id', 'product_name', 'brand', 'category', 'product_type',
  'product_data', 'in_ecosystem', 'is_tracked', 'is_omitted', 'is_saved',
  'created_at', 'updated_at',
];

const missing = [];
for (const col of expectedColumns) {
  const { error } = await admin.from('user_ecosystems').select(col).limit(1);
  if (error && (error.code === '42703' || /does not exist/i.test(error.message || ''))) {
    missing.push({ col, message: error.message });
  } else if (error) {
    console.log(`  ${col}: unexpected error — ${error.message}`);
  }
}

if (!missing.length) {
  console.log('✅ all expected columns exist. The schema is not the problem — look elsewhere (RLS, primary key constraint).\n');
  process.exit(0);
}

console.log('❌ MISSING COLUMNS:\n');
for (const m of missing) console.log(`  ${m.col} — ${m.message}`);

console.log(`
This is why table writes fail and the app falls back to writing (large)
product data into your Supabase auth profile instead, which is what's been
causing the 431 errors.

FIX: open your Supabase project dashboard -> SQL Editor -> paste the
contents of supabase/user_ecosystems.sql -> Run. It's idempotent (safe to
run even though the table already partly exists) and just adds the missing
column(s) and matching policies.
`);
process.exit(1);

#!/usr/bin/env node
/**
 * Reproduces the exact upsert ecosystemStore.js/savedProductsStore.js
 * perform against user_ecosystems (same onConflict target), using the
 * service role so RLS can't hide the real error. If this fails, the error
 * code tells us exactly what's broken (missing unique constraint for
 * ON CONFLICT, RLS-adjacent issue, etc). Inserts one throwaway test row for
 * the given user and deletes it again immediately after — never leaves
 * anything behind.
 *
 *   node scripts/diagnose-user-ecosystems-write.mjs <email>
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.argv[2];

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n');
  process.exit(2);
}
if (!email) {
  console.error('Usage: node scripts/diagnose-user-ecosystems-write.mjs <email>');
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let target = null;
let page = 1;
for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error('listUsers failed:', error.message); process.exit(1); }
  const users = data?.users || [];
  target = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (target || users.length < 200) break;
  page += 1;
}
if (!target) { console.error(`No user found with email ${email}.`); process.exit(1); }

const testProductId = `__diagnostic_test_${Date.now()}`;
console.log(`\nTesting upsert against user_ecosystems for ${target.email} (${target.id})...\n`);

const { error: upsertError } = await admin
  .from('user_ecosystems')
  .upsert(
    {
      user_id: target.id,
      product_id: testProductId,
      product_name: 'diagnostic test row',
      is_saved: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,product_id' },
  );

if (upsertError) {
  console.log('❌ UPSERT FAILED — this is the same failure the app hits on every save:\n');
  console.log(`  code:    ${upsertError.code}`);
  console.log(`  message: ${upsertError.message}`);
  console.log(`  details: ${upsertError.details || '(none)'}`);
  console.log(`  hint:    ${upsertError.hint || '(none)'}\n`);
  if (upsertError.code === '42P10') {
    console.log('This means there is no unique/primary-key constraint on (user_id, product_id) —');
    console.log('the exact thing supabase/user_ecosystems.sql\'s `primary key (user_id, product_id)`');
    console.log('is supposed to set up. Open Supabase dashboard -> SQL Editor and run:\n');
    console.log('  alter table public.user_ecosystems add primary key (user_id, product_id);\n');
    console.log('(If that errors saying a PK already exists under a different name/columns, tell me');
    console.log('the exact error and we\'ll adjust it rather than guessing.)\n');
  }
  process.exit(1);
}

console.log('✅ upsert succeeded — the table write itself works fine as service role.\n');

const { error: deleteError } = await admin
  .from('user_ecosystems')
  .delete()
  .eq('user_id', target.id)
  .eq('product_id', testProductId);
if (deleteError) console.warn('(cleanup delete failed, harmless test row left behind):', deleteError.message);
else console.log('Test row cleaned up.\n');

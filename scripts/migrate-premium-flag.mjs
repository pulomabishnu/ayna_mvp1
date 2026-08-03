#!/usr/bin/env node
/**
 * Move `is_premium` from user_metadata to app_metadata.
 *
 *   node scripts/migrate-premium-flag.mjs          # dry run — lists, changes nothing
 *   node scripts/migrate-premium-flag.mjs --apply  # performs the migration
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 *
 * WHY: the entitlement check used to read `user_metadata.is_premium`, which the
 * end user can write themselves —
 *   await supabase.auth.updateUser({ data: { is_premium: true } })
 * — so anyone could grant themselves unlimited AI spend from the browser
 * console, invisibly, because the usage counter was never touched either.
 *
 * The check now reads `app_metadata`, which only the service-role key can write.
 * That is the correct fix, but it means EVERY currently-paying user is treated
 * as free the moment the new code deploys, until this runs.
 *
 * RUN THIS BEFORE DEPLOYING, not after.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n');
  console.error('  Dashboard -> Project Settings -> API');
  console.error('  The SERVICE ROLE key, not the anon key. Never expose it to a browser.');
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const premium = [];
let page = 1;
const PER_PAGE = 200;

console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — scanning users...\n`);

for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
  if (error) {
    console.error('listUsers failed:', error.message);
    process.exit(1);
  }
  const users = data?.users || [];
  if (!users.length) break;

  for (const u of users) {
    const legacy = u.user_metadata?.is_premium === true;
    const current = u.app_metadata?.is_premium === true;
    if (legacy || current) {
      premium.push({ id: u.id, email: u.email, legacy, current });
    }
  }
  if (users.length < PER_PAGE) break;
  page += 1;
}

const needsMigration = premium.filter((u) => u.legacy && !u.current);
const alreadyDone = premium.filter((u) => u.current);

console.log(`premium users found: ${premium.length}`);
console.log(`  already on app_metadata: ${alreadyDone.length}`);
console.log(`  NEED MIGRATION:          ${needsMigration.length}\n`);

if (!needsMigration.length) {
  console.log('✅ nothing to migrate — no paying user will be downgraded by the deploy.\n');
  process.exit(0);
}

for (const u of needsMigration) console.log(`  ${u.email || '(no email)'}  ${u.id}`);

if (!APPLY) {
  console.log('\nDry run — nothing changed. Re-run with --apply to migrate these users.\n');
  process.exit(0);
}

console.log('\nmigrating...\n');
let ok = 0;
let failed = 0;
for (const u of needsMigration) {
  const { error } = await admin.auth.admin.updateUserById(u.id, {
    app_metadata: { is_premium: true },
  });
  if (error) {
    console.error(`  FAILED ${u.email || u.id}: ${error.message}`);
    failed += 1;
  } else {
    console.log(`  ok ${u.email || u.id}`);
    ok += 1;
  }
}

console.log(`\n${ok} migrated, ${failed} failed.`);
if (failed) {
  console.error('Re-run to retry the failures — the script is idempotent.\n');
  process.exit(1);
}
// user_metadata is deliberately left as-is: harmless once the code ignores it,
// and it keeps a record of who was granted premium the old way.
console.log('✅ done. Safe to deploy.\n');

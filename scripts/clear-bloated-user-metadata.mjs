#!/usr/bin/env node
/**
 * Clear the two legacy "shadow" keys that a savedProductsStore.js /
 * ecosystemStore.js fallback path writes directly into user_metadata when it
 * thinks a `user_ecosystems` table column is missing:
 *
 *   ayna_saved_products_v1    (src/utils/savedProductsStore.js META_KEY)
 *   ayna_ecosystem_shadow_v2  (src/utils/ecosystemStore.js SHADOW_META_KEY)
 *
 * Those keys ride along inside the Supabase auth JWT (it's built from
 * user_metadata), so once a user's saved-products list grows large enough the
 * token itself grows past ~40KB and every authenticated request — including
 * api/export-data.js ("Manage my data") — gets rejected before it even
 * reaches application code with HTTP 431 Request Header Fields Too Large.
 *
 *   node scripts/clear-bloated-user-metadata.mjs <email>            # dry run
 *   node scripts/clear-bloated-user-metadata.mjs <email> --apply    # applies it
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.
 *
 * Only these two keys are touched — every other user_metadata field
 * (first_name, avatar_url, consent_given_at, etc.) is left exactly as-is.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes('--apply');
const email = process.argv.slice(2).find((arg) => !arg.startsWith('--'));

const BLOAT_KEYS = ['ayna_saved_products_v1', 'ayna_ecosystem_shadow_v2'];

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n');
  console.error('  Dashboard -> Project Settings -> API');
  console.error('  The SERVICE ROLE key, not the anon key. Never expose it to a browser.');
  process.exit(2);
}

if (!email) {
  console.error('Usage: node scripts/clear-bloated-user-metadata.mjs <email> [--apply]');
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — looking up ${email}...\n`);

let target = null;
let page = 1;
const PER_PAGE = 200;

for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PER_PAGE });
  if (error) {
    console.error('listUsers failed:', error.message);
    process.exit(1);
  }
  const users = data?.users || [];
  target = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (target || users.length < PER_PAGE) break;
  page += 1;
}

if (!target) {
  console.error(`No user found with email ${email}.`);
  process.exit(1);
}

const metadata = target.user_metadata || {};
const present = BLOAT_KEYS.filter((k) => metadata[k] !== undefined);

console.log(`user: ${target.email}  ${target.id}`);
if (!present.length) {
  console.log('\n✅ neither bloat key is present — nothing to clear.\n');
  process.exit(0);
}

for (const k of present) {
  const size = JSON.stringify(metadata[k]).length;
  console.log(`  found ${k}  (${size} characters)`);
}

if (!APPLY) {
  console.log('\nDry run — nothing changed. Re-run with --apply to clear these keys.\n');
  process.exit(0);
}

const cleaned = { ...metadata };
for (const k of present) delete cleaned[k];

const { error } = await admin.auth.admin.updateUserById(target.id, {
  user_metadata: cleaned,
});

if (error) {
  console.error(`\nFAILED: ${error.message}\n`);
  process.exit(1);
}

console.log(`\n✅ cleared ${present.join(', ')} from ${target.email}'s profile.`);
console.log('Sign out and back in on the device so it picks up a fresh, smaller token.\n');

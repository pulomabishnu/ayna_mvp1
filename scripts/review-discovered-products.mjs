#!/usr/bin/env node
/**
 * Review products api/discover-products.js has found before they go live.
 *
 *   node scripts/review-discovered-products.mjs list [category]
 *   node scripts/review-discovered-products.mjs approve <id> [id2 id3 ...]
 *   node scripts/review-discovered-products.mjs reject <id> [id2 id3 ...]
 *   node scripts/review-discovered-products.mjs auto-approved [category]
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
 * (same as scripts/migrate-premium-flag.mjs — Dashboard -> Project Settings
 * -> API -> the SERVICE ROLE key, never the anon key).
 *
 * WHY THIS IS A SCRIPT AND NOT ALWAYS AUTO-APPROVAL: every product on this
 * site carries a real safety/clinical review, and the site's own How We Make
 * Money page promises that bar applies to everything, no exceptions. `approve`
 * is normally the ONLY thing that flips a discovered row's is_active to true.
 *
 * The one narrow exception (policy decision, Aditi, 2026-08-23):
 * api/discover-products.js's isAutoApprovable() lets a candidate skip
 * straight to is_active=true WITHOUT this script, but only when it cleared
 * both a fully-answered clean FDA recall check and had a real https source
 * URL — see that function's comment for the exact bar. Those rows are
 * tagged `discovery_meta.autoApproved: true` so they stay auditable here via
 * `auto-approved` even though they never showed up in `list`. `reject` still
 * works on them exactly like any other discovered row, immediately pulling
 * one back offline if a spot-check finds a problem.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n');
  console.error('  Dashboard -> Project Settings -> API');
  console.error('  The SERVICE ROLE key, not the anon key. Never expose it to a browser.');
  process.exit(2);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const [, , cmd, ...args] = process.argv;

function printProduct(row) {
  const recall = row.discovery_meta?.recallCheck;
  const recallLine = recall?.hasRecalls
    ? '⚠️  ACTIVE RECALL FOUND — do not approve without reading api/fda-recall.js output for this product'
    : (recall ? '✓ no recalls found' : '? recall status unknown');
  const hits = row.discovery_meta?.searchHits || [];

  console.log(`\n── ${row.id} ${'─'.repeat(Math.max(0, 60 - row.id.length))}`);
  console.log(`   ${row.name}${row.brand ? ` — ${row.brand}` : ''}`);
  console.log(`   category: ${row.category} | type: ${row.product_type} | price: ${row.price || 'unknown'}`);
  console.log(`   url: ${row.url || '(none — model gave no source URL, verify manually before approving)'}`);
  console.log(`   summary: ${row.summary || '(none)'}`);
  console.log(`   safety.recalls: ${row.safety?.recalls || '(unset)'}`);
  console.log(`   recall check: ${recallLine}`);
  if (row.safety?.materials) console.log(`   ingredients (DSLD): ${row.safety.materials}`);
  if (hits.length) {
    console.log('   search grounding:');
    hits.forEach((h) => console.log(`     - ${h.title}\n       ${h.url}`));
  }
  console.log(`   discovered: ${row.discovery_meta?.discoveredAt || row.created_at} via ${row.discovery_meta?.provider || 'unknown'}`);
}

async function list(category) {
  let query = admin
    .from('product_catalog')
    .select('*')
    .eq('source', 'discovered')
    .eq('review_status', 'pending')
    .order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
  if (!data?.length) {
    console.log(category
      ? `No pending discovered products in category "${category}".`
      : 'No pending discovered products.');
    return;
  }
  console.log(`${data.length} pending discovered product(s)${category ? ` in "${category}"` : ''}:`);
  data.forEach(printProduct);
  console.log(`\nApprove with:  node scripts/review-discovered-products.mjs approve ${data[0].id} [...]`);
  console.log(`Reject with:   node scripts/review-discovered-products.mjs reject ${data[0].id} [...]`);
}

async function listAutoApproved(category) {
  let query = admin
    .from('product_catalog')
    .select('*')
    .eq('source', 'discovered')
    .eq('review_status', 'approved')
    .eq('discovery_meta->>autoApproved', 'true')
    .order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    console.error('Query failed:', error.message);
    process.exit(1);
  }
  if (!data?.length) {
    console.log(category
      ? `No auto-approved discovered products in category "${category}".`
      : 'No auto-approved discovered products yet.');
    return;
  }
  console.log(`${data.length} auto-approved discovered product(s)${category ? ` in "${category}"` : ''} — already live, spot-check and reject if anything looks wrong:`);
  data.forEach(printProduct);
  console.log(`\nPull one offline with:  node scripts/review-discovered-products.mjs reject ${data[0].id}`);
}

async function setStatus(ids, status) {
  if (!ids.length) {
    console.error(`Usage: node scripts/review-discovered-products.mjs ${status === 'approved' ? 'approve' : 'reject'} <id> [id2 ...]`);
    process.exit(2);
  }
  const isActive = status === 'approved';
  const { data, error } = await admin
    .from('product_catalog')
    .update({ review_status: status, is_active: isActive })
    .eq('source', 'discovered')
    .in('id', ids)
    .select('id, name, review_status, is_active');

  if (error) {
    console.error('Update failed:', error.message);
    process.exit(1);
  }
  if (!data?.length) {
    console.log('No matching discovered products found for the given id(s). (Only source=discovered rows can be reviewed here.)');
    return;
  }
  data.forEach((r) => console.log(`${status === 'approved' ? '✓ approved' : '✗ rejected'} — ${r.id} (${r.name})`));
  const missing = ids.filter((id) => !data.some((r) => r.id === id));
  if (missing.length) console.log(`Not found (or not a discovered row): ${missing.join(', ')}`);
}

if (cmd === 'list') {
  await list(args[0]);
} else if (cmd === 'auto-approved') {
  await listAutoApproved(args[0]);
} else if (cmd === 'approve') {
  await setStatus(args, 'approved');
} else if (cmd === 'reject') {
  await setStatus(args, 'rejected');
} else {
  console.log('Usage:');
  console.log('  node scripts/review-discovered-products.mjs list [category]');
  console.log('  node scripts/review-discovered-products.mjs auto-approved [category]');
  console.log('  node scripts/review-discovered-products.mjs approve <id> [id2 ...]');
  console.log('  node scripts/review-discovered-products.mjs reject <id> [id2 ...]');
  process.exit(cmd ? 2 : 0);
}

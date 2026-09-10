#!/usr/bin/env node
/**
 * Diagnostic (read-only): checks the LIVE product_catalog table for specific
 * products that showed up on the desktop site's "ayna Favorites" but were
 * reported missing from the mobile app. Nothing bundled in src/data/ can
 * answer this — these are Supabase-only rows (AI-discovered or added
 * directly to the table), invisible to a git checkout.
 *
 * For each product, reports whether it exists, and if so: source,
 * review_status, is_active, and whether image is populated. /api/products
 * only returns rows with is_active=true (and, per
 * supabase/product_catalog_discovery.sql, a 'discovered' row additionally
 * needs review_status='approved') — so this is how to tell a real
 * visibility gap (not yet approved / inactive) apart from mere caching
 * staleness (1hr CDN + 1hr client cache, same code path on both platforms).
 *
 *   node scripts/check-live-catalog-products.mjs
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment
 * (service role, not anon — this needs to see inactive/pending rows too).
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

// Names from the user's "ayna Favorites" screenshots that don't exist in any
// bundled src/data/ file, so must be live-catalog-only rows.
const QUERIES = [
  'Proov Empower Hormone Tracker',
  'Proov His & Hers Fertility Kit',
  'Proov Complete Fertility Testing System',
  'Elitone URGE',
  'Elitone Stress',
  'Luteal Love',
];

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

console.log('\nChecking live product_catalog for products reported missing on mobile...\n');

for (const q of QUERIES) {
  const { data, error } = await admin
    .from('product_catalog')
    .select('id, name, brand, source, review_status, is_active, image')
    .ilike('name', `%${q}%`);

  if (error) {
    console.log(`❌ "${q}" — query failed: ${error.message}`);
    continue;
  }

  if (!data || data.length === 0) {
    console.log(`❓ "${q}" — no matching row in product_catalog at all (not just inactive — genuinely absent)`);
    continue;
  }

  for (const row of data) {
    const visible = row.is_active && (row.source !== 'discovered' || row.review_status === 'approved');
    const flags = [
      `source=${row.source}`,
      `review_status=${row.review_status}`,
      `is_active=${row.is_active}`,
      row.image ? 'has image' : 'NO IMAGE',
    ].join(', ');
    console.log(`${visible ? '✅' : '⚠️ '} "${row.name}" (${row.brand || 'no brand'}) [id=${row.id}] — ${flags}`);
    if (!visible) {
      console.log(`   -> not visible via /api/products right now — this is why it's missing, not caching.`);
    }
  }
}

console.log('\nIf a row above shows ✅ and it still isn\'t showing on mobile, that\'s the 1hr CDN +');
console.log('1hr client cache (src/utils/productCatalog.js) — it will appear within an hour, or');
console.log('clear localStorage key "ayna_product_catalog_v1" to force a refresh sooner.\n');

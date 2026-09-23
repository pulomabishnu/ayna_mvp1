#!/usr/bin/env node
/**
 * Sync the "Early Stage Startups" Airtable base into early_stage_startups.
 *
 *   node scripts/sync-startups-from-airtable.mjs
 *
 * Requires AIRTABLE_API_KEY, AIRTABLE_BASE_ID, SUPABASE_URL (or
 * VITE_SUPABASE_URL), and SUPABASE_SERVICE_ROLE_KEY in the environment.
 *
 * WHAT THIS DOES:
 *  1. Fetches every Airtable record with Status = "Active" (paginated).
 *  2. Maps each one to an early_stage_startups row and upserts it on
 *     airtable_record_id, so re-running is always safe.
 *  3. Soft-deletes (is_active = false) any row whose airtable_record_id was
 *     NOT seen in this run — that's how archiving a startup in Airtable
 *     (Status -> Archived, or deleting the record) propagates here.
 *
 * CATEGORY MAPPING: confirmed against a live fetch of the base (2026-09-05).
 * Airtable's Category values that already had a genuine fit in the app's
 * existing category slugs (src/components/WaitlistHub.jsx) are mapped onto
 * those; only "Maternal Health" and "General Wellness" had no existing
 * equivalent and get new slugs. If Airtable ever adds a Category this map
 * doesn't know about, UNKNOWN_CATEGORY below logs it loudly rather than
 * silently miscategorizing or dropping the row.
 */
import { createClient } from '@supabase/supabase-js';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = 'tbl8E6VojepaM6eN3'; // "Startups" table — specific to this one integration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Set AIRTABLE_API_KEY and AIRTABLE_BASE_ID.\n');
  process.exit(2);
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.\n');
  console.error('  Dashboard -> Project Settings -> API');
  console.error('  The SERVICE ROLE key, not the anon key. Never expose it to a browser.');
  process.exit(2);
}

const CATEGORY_MAP = {
  'Diagnostics': 'diagnostics',
  'Fertility': 'fertility',
  'Menopause': 'menopause',
  'Mental Health': 'mental-health',
  // Both Level Zero Health and Clair Health (Airtable's only two
  // "Hormonal Health" entries so far) are hormone-monitoring wearables —
  // the same real category the hardcoded inne entry already uses.
  'Hormonal Health': 'hormone-monitoring',
  // "Nutrition" == supplement companies (DITTO Daily, Earthful.me) — same
  // bucket as the hardcoded De Lune/Wile/Fullwell/Perelel/Needed entries.
  // Note: WaitlistHub.jsx's categoryLabels object has a pre-existing typo
  // ('supplements' plural) that doesn't match this slug (singular, what the
  // data actually uses) — not introduced here, not fixed here either.
  'Nutrition': 'supplement',
  // Coologics/UVISA/Metri.Bio are vaginal/reproductive health products —
  // the same real category the hardcoded Honey Pot/Love Wellness entries use.
  'Sexual Health': 'intimate-care',
  // No existing slug fit either of these — confirmed against a live fetch,
  // not guessed.
  'Maternal Health': 'maternal-health',
  'General Wellness': 'general-wellness',
};

function slugify(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchActiveRecords() {
  const records = [];
  let offset;
  do {
    const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set('filterByFormula', "{Status}='Active'");
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url, { headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` } });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Airtable fetch failed (${res.status}): ${body}`);
    }
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);
  return records;
}

const unknownCategories = new Set();

function toRow(record) {
  const f = record.fields || {};
  const category = CATEGORY_MAP[f.Category];
  if (!category) unknownCategories.add(f.Category || '(missing)');

  return {
    id: slugify(f['Startup Name']),
    airtable_record_id: record.id,
    name: f['Startup Name'] || '',
    tagline: f['One-Liner'] || null,
    description: f['Why We Picked Them'] || null,
    category: category || 'general-wellness',
    stage: f.Stage || null,
    product_released: false, // Airtable's Stage vocabulary (Waitlist/Pre-Seed/Seed) is pre-release by definition
    url: f['Website URL'] || null,
    waitlist_url: f['Waitlist URL'] || null,
    image: f.Logo?.[0]?.url || null,
    tags: Array.isArray(f['Symptom Tags']) ? f['Symptom Tags'] : [],
    health_functions: [],
    badges: Array.isArray(f.Tags) ? f.Tags : [],
    featured: f.Featured === true,
    extra: {
      founderNames: f['Founder Names'] || null,
      foundedYear: f['Founded Year'] || null,
      womenFounded: f['Women-Founded'] === true,
    },
    is_active: true,
  };
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log('Fetching active records from Airtable...');
const records = await fetchActiveRecords();
console.log(`  fetched ${records.length} active record(s)`);

const rows = records.map(toRow);

if (unknownCategories.size) {
  console.error(`\n⚠️  Unknown Airtable Category value(s) not in CATEGORY_MAP: ${[...unknownCategories].join(', ')}`);
  console.error('   These rows were written under "general-wellness" as a fallback.');
  console.error('   Add a mapping in CATEGORY_MAP and re-run to fix.\n');
}

console.log(`Upserting ${rows.length} row(s) into early_stage_startups...`);
const { error: upsertError } = await supabase
  .from('early_stage_startups')
  .upsert(rows, { onConflict: 'airtable_record_id' });

if (upsertError) {
  console.error('Upsert failed:', upsertError.message);
  process.exit(1);
}
console.log('  upsert ok');

// Soft-delete anything no longer in this run's active set — that's how an
// Airtable-side archive (Status -> Archived, or deleting the record)
// propagates, without ever hard-deleting a row something else might reference.
const seenIds = new Set(records.map((r) => r.id));
const { data: existing, error: existingError } = await supabase
  .from('early_stage_startups')
  .select('airtable_record_id')
  .eq('is_active', true);

if (existingError) {
  console.error('Could not check for rows to archive:', existingError.message);
  process.exit(1);
}

const toArchive = (existing || [])
  .map((r) => r.airtable_record_id)
  .filter((id) => !seenIds.has(id));

if (toArchive.length) {
  console.log(`Archiving ${toArchive.length} row(s) no longer Active in Airtable...`);
  const { error: archiveError } = await supabase
    .from('early_stage_startups')
    .update({ is_active: false })
    .in('airtable_record_id', toArchive);
  if (archiveError) {
    console.error('Archive failed:', archiveError.message);
    process.exit(1);
  }
  console.log('  archive ok');
} else {
  console.log('Nothing to archive.');
}

console.log(`\n✅ done. ${rows.length} active, ${toArchive.length} archived.`);

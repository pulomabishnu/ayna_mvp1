/**
 * Read-only preview by default. Opt-in, deduplicated backfill of ayna's
 * VERIFIED non-health records. This cannot recreate unrecorded navigation,
 * screenviews, time-on-screen or TestFlight sessions.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/recover-posthog-history.mjs
 *
 * To import ONLY accounts with verified analytics consent, create a local
 * file containing one allowed ayna_... analytics ID per line (never commit
 * that file), then run:
 *   RECOVERY_ALLOWED_IDS_FILE=/secure/allowed-ids.txt \\
 *   POSTHOG_PROJECT_TOKEN=phc_... SUPABASE_URL=... \\
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/recover-posthog-history.mjs --execute
 *
 * Importing requires an explicit allowlist because old browser opt-outs
 * live only on devices. It is never safe to infer consent from a database
 * account or an analytics ID alone. IDs, raw user profiles, product IDs,
 * symptom data and private health content must NEVER be printed or sent.
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const START = Date.parse('2026-08-25T00:00:00.000Z');
const MIN_AGE_MS = 48 * 60 * 60 * 1000;
const TYPE = Object.freeze({
  accounts: 'recovered_account_created',
  builds: 'recovered_ecosystem_built',
  savedState: 'recovered_product_saved_state',
});

function uniqueEventUuid(kind, recordId) {
  const hex = createHash('sha256').update(`ayna-posthog-v1:${kind}:${recordId}`).digest('hex').slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = ((parseInt(hex[16], 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex.slice(12, 16).join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`;
}

function recordToEvent(type, recordId, analyticsId, when, timestampKind) {
  const ms = Date.parse(when || '');
  if (!Number.isFinite(ms) || ms < START || ms > Date.now() - MIN_AGE_MS) return null;
  if (!/^ayna_[A-Za-z0-9_-]{8,80}$/.test(analyticsId || '')) return null;
  return {
    event: type,
    distinct_id: analyticsId,
    uuid: uniqueEventUuid(type, recordId),
    timestamp: new Date(ms).toISOString(),
    properties: {
      reconstruction: true,
      reconstruction_source: 'supabase',
      timestamp_quality: timestampKind,
      platform: 'unknown', // Do not fabricate TestFlight provenance
      $host: 'historical-recovery.aynahealth.co',
    },
  };
}

async function listPages(query, pageSize = 900) {
  const out = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await query(offset, offset + pageSize - 1);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return out;
}

async function main() {
  const execute = process.argv.includes('--execute');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const posthogToken = process.env.POSTHOG_PROJECT_TOKEN;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Run with server-only credentials, never a browser key.');
  }
  let allowed = null;
  if (execute) {
    if (!posthogToken || !posthogToken.startsWith('phc_')) throw new Error('Missing PostHog PROJECT token (phc_ prefix).');
    if (!process.env.RECOVERY_ALLOWED_IDS_FILE) {
      throw new Error('Import stopped: RECOVERY_ALLOWED_IDS_FILE is required to prove account-level analytics opt-in.');
    }
    allowed = new Set(readFileSync(process.env.RECOVERY_ALLOWED_IDS_FILE, 'utf8')
      .split(/\\r?\\n/).map((line) => line.trim()).filter((line) => /^ayna_[A-Za-z0-9_-]{8,80}$/.test(line)));
    if (!allowed.size) throw new Error('Import stopped: verified consent allowlist is empty.');
  }
  const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const mappings = await listPages((from, to) => db.from('account_analytics')
    .select('user_id,analytics_id').range(from, to));
  const mapped = new Map(mappings.map((r) => [r.user_id, r.analytics_id]));
  const accounts = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    accounts.push(...(data?.users || []));
    if ((data?.users || []).length < 1000) break;
  }
  const builds = await listPages((from, to) => db.from('user_ecosystem_builds')
    .select('user_id,build_id,created_at').range(from, to));
  const saves = await listPages((from, to) => db.from('user_ecosystems')
    .select('id,user_id,is_saved,created_at,updated_at').eq('is_saved', true).range(from, to));
  const events = [];
  for (const item of accounts) {
    if (item.deleted_at) continue;
    const e = recordToEvent(TYPE.accounts, item.id, mapped.get(item.id), item.created_at, 'account_creation');
    if (e) events.push(e);
  }
  for (const item of builds) {
    const e = recordToEvent(TYPE.builds, item.build_id, mapped.get(item.user_id), item.created_at, 'event_record_created_at');
    if (e) events.push(e);
  }
  for (const item of saves) {
    // This is a currently saved *state*, NOT a verified save-button click.
    // updated_at is when the database row was last updated, which may differ
    // from the original time a user saved the product. No product ID sent.
    const e = recordToEvent(TYPE.savedState, item.id, mapped.get(item.user_id),
      item.updated_at || item.created_at, 'last_saved_state_update_not_click');
    if (e) events.push(e);
  }
  const filtered = allowed ? events.filter((event) => allowed.has(event.distinct_id)) : events;
  const counts = Object.fromEntries(Object.values(TYPE).map((type) => [
    type, filtered.filter((e) => e.event === type).length,
  ]));
  console.log(JSON.stringify({
    mode: execute ? 'import-consented-accounts' : 'dry-run',
    candidate_events: events.length,
    eligible_events: filtered.length,
    unique_mapped_accounts: new Set(filtered.map((e) => e.distinct_id)).size,
    categories: counts,
    caution: 'Cross-platform historical records; none is assumed to be a TestFlight session or screen view.',
  }, null, 2));
  if (!execute) return;
  const host = process.env.POSTHOG_INGEST_HOST || 'https://us.i.posthog.com';
  if (!/^https:\/\//.test(host)) throw new Error('Ingest host must be HTTPS.');
  for (let offset = 0; offset < filtered.length; offset += 100) {
    const batch = filtered.slice(offset, offset + 100);
    const result = await fetch(`${host.replace(/\/$/, '')}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: posthogToken, historical_migration: true, batch }),
    });
    if (!result.ok) throw new Error(`Import stopped at batch ${Math.floor(offset / 100) + 1}: HTTP ${result.status}`);
    console.log(`Submitted batch ${Math.floor(offset / 100) + 1} of ${Math.ceil(filtered.length / 100)}. Check PostHog ingestion before claiming success.`);
  }
  console.log('All batches submitted; verify ingestion, identities, reconstruction flags, and duplication before using recovered metrics.');
}

main().catch((err) => {
  console.error(`[ayna recovery] ${err.message}`);
  process.exitCode = 1;
});

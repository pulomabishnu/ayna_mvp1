#!/usr/bin/env node
/**
 * Diff a live database's schema against the reference this repo produces.
 *
 *   node scripts/diff-schema.mjs live-schema.json
 *
 * `live-schema.json` is the output of supabase/_introspect.sql run against the
 * live database (read-only). The reference, supabase/expected-schema.json, is
 * the same query run against a clean local apply of every migration.
 *
 * WHY THIS MATTERS: `create table if not exists` SKIPS an existing table. Four
 * of these tables were created by hand and hold real user data, so a migration
 * run can report complete success while a live table still lacks a column, a
 * composite key, or an RLS policy the application depends on. This is the check
 * that catches that.
 *
 * Findings are ranked by what actually breaks:
 *   BLOCKING  the app is broken until it is fixed
 *   WARNING   a real difference worth understanding
 *   INFO      present live but not in the repo (usually fine)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const livePath = process.argv[2];
if (!livePath) {
  console.error('usage: node scripts/diff-schema.mjs <live-schema.json>');
  process.exit(2);
}

const load = (p) => {
  const raw = readFileSync(p, 'utf8').trim();
  // Tolerate a copy-paste from the SQL editor that includes surrounding quotes.
  const start = raw.indexOf('{');
  return JSON.parse(raw.slice(start, raw.lastIndexOf('}') + 1));
};

const expected = load(resolve(root, 'supabase/expected-schema.json'));
const live = load(resolve(process.cwd(), livePath));

const findings = [];
const add = (level, where, msg, why) => findings.push({ level, where, msg, why });

/** Tables whose absence or drift breaks something specific and nameable. */
const CONSEQUENCE = {
  user_ecosystems: 'ecosystem products cannot be saved or loaded',
  user_reviews: 'ratings and reviews cannot be saved',
  user_learning_memory: 'learning signals cannot be saved',
  user_ai_usage: 'AI quotas fail OPEN — unmetered spend',
  user_ecosystem_builds: 'the ecosystem build quota fails OPEN',
  user_health_profiles: 'imported conditions/medications are not persisted',
  health_intakes: 'the health intake cannot be saved',
  phone_numbers: 'phone verification cannot complete',
  pending_phone_verifications: 'phone verification returns 500 on every attempt',
  sms_conversations: 'the SMS transcript cannot be written',
  product_catalog: 'the product catalog falls back to the bundled copy',
};

// ── Tables ───────────────────────────────────────────────────────────────────
for (const [name, exp] of Object.entries(expected.tables)) {
  const got = live.tables[name];
  if (!got) {
    add('BLOCKING', name, 'table MISSING from the live database',
        CONSEQUENCE[name] || 'the application expects this table');
    continue;
  }

  // Columns the code reads/writes.
  const expCols = new Map(exp.columns.map((c) => [c.column, c]));
  const gotCols = new Map(got.columns.map((c) => [c.column, c]));
  for (const [col, e] of expCols) {
    const g = gotCols.get(col);
    if (!g) {
      add('BLOCKING', `${name}.${col}`, 'column MISSING live',
          'every write touching this column errors; `create table if not exists` will NOT add it');
      continue;
    }
    if (g.type !== e.type) {
      // jsonb vs json, text vs varchar etc. are real and worth surfacing.
      add('WARNING', `${name}.${col}`, `type differs — live "${g.type}", expected "${e.type}"`,
          'may silently coerce or reject values');
    }
    if (g.notnull && !e.notnull) {
      add('WARNING', `${name}.${col}`, 'live column is NOT NULL but the repo allows null',
          'inserts omitting it will fail');
    }
  }
  for (const col of gotCols.keys()) {
    if (!expCols.has(col)) {
      add('INFO', `${name}.${col}`, 'column exists live but not in the repo',
          'harmless unless it is NOT NULL without a default');
      const g = gotCols.get(col);
      if (g.notnull && !g.default) {
        add('BLOCKING', `${name}.${col}`, 'extra live column is NOT NULL with no default',
            'every INSERT from the app will fail — it does not know to supply this');
      }
    }
  }

  // Composite keys the upserts target.
  const keyDef = (c) => (c.definition || '').replace(/\s+/g, ' ');
  const expKeys = exp.constraints.filter((c) => c.type === 'primary key' || c.type === 'unique').map(keyDef);
  const gotKeys = got.constraints.filter((c) => c.type === 'primary key' || c.type === 'unique').map(keyDef);
  for (const k of expKeys) {
    if (!gotKeys.includes(k)) {
      add('BLOCKING', name, `missing key/unique constraint: ${k}`,
          'upserts using onConflict raise 42P10 — the UI shows success and the data is lost');
    }
  }

  // RLS.
  if (exp.rls_enabled && !got.rls_enabled) {
    add('BLOCKING', name, 'RLS is DISABLED live but enabled in the repo',
        'every user can read every other user\'s rows');
  }

  const expCmds = new Set(exp.policies.map((p) => p.command));
  const gotCmds = new Set(got.policies.map((p) => p.command));
  for (const cmd of expCmds) {
    if (!gotCmds.has(cmd) && !gotCmds.has('ALL')) {
      add('BLOCKING', name, `no ${cmd} policy live`,
          `under RLS a missing policy is a SILENT no-op, not an error — ${cmd} requests affect 0 rows`);
    }
  }
  // The one table that must NOT be client-readable.
  if (name === 'pending_phone_verifications') {
    const readable = got.policies.some(
      (p) => (p.command === 'SELECT' || p.command === 'ALL') && (p.roles || []).includes('authenticated')
    );
    if (readable) {
      add('BLOCKING', name, 'SECURITY: readable by authenticated users',
          'account-takeover path — the attacker owns the row created for the victim\'s number and can read code_hash');
    }
  }
}

for (const name of Object.keys(live.tables)) {
  if (!expected.tables[name]) {
    add('INFO', name, 'table exists live but not in the repo',
        'not managed by these migrations; a `supabase db reset` would drop it');
  }
}

// ── Functions ────────────────────────────────────────────────────────────────
const sig = (f) => `${f.name}(${f.args})`;
const liveFns = new Map((live.functions || []).map((f) => [sig(f), f]));
for (const f of expected.functions || []) {
  const g = liveFns.get(sig(f));
  if (!g) {
    add('BLOCKING', sig(f), 'function MISSING live',
        f.name === 'claim_otp_attempt' ? '/api/phone-verify-confirm returns 500 on EVERY attempt'
        : f.name.includes('usage') ? 'quotas fail OPEN — unmetered LLM spend'
        : f.name.includes('build') ? 'the ecosystem build quota fails OPEN'
        : 'the API calls this by name');
    continue;
  }
  if (g.returns !== f.returns) {
    add('BLOCKING', sig(f), `returns "${g.returns}" live, expected "${f.returns}"`,
        'the JavaScript destructures specific fields; a shape mismatch degrades the quota to fail-open');
  }
  if (f.security_definer && !g.security_definer) {
    add('WARNING', sig(f), 'not SECURITY DEFINER live', 'may lack the privileges to do its work');
  }
}

// ── Report ───────────────────────────────────────────────────────────────────
const order = { BLOCKING: 0, WARNING: 1, INFO: 2 };
findings.sort((a, b) => order[a.level] - order[b.level] || a.where.localeCompare(b.where));

const counts = findings.reduce((m, f) => ({ ...m, [f.level]: (m[f.level] || 0) + 1 }), {});
console.log(`\nlive tables: ${Object.keys(live.tables).length}  |  reference tables: ${Object.keys(expected.tables).length}`);
console.log(`live functions: ${(live.functions || []).length}  |  reference functions: ${(expected.functions || []).length}\n`);

if (!findings.length) {
  console.log('✅ live schema matches the repo — the migrations are safe to apply as-is.\n');
  process.exit(0);
}

let last = null;
for (const f of findings) {
  if (f.level !== last) { console.log(`\n─── ${f.level} ───`); last = f.level; }
  console.log(`  ${f.where}\n    ${f.msg}\n    → ${f.why}`);
}

console.log(`\n${counts.BLOCKING || 0} blocking, ${counts.WARNING || 0} warnings, ${counts.INFO || 0} info\n`);
process.exit(counts.BLOCKING ? 1 : 0);

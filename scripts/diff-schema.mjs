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
import { readFileSync, writeFileSync } from 'node:fs';
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
// `fix` is the SQL that resolves the finding. Emitted as a reviewable script
// rather than applied — these are writes against a database holding real user
// data, so a human reads them first.
const add = (level, where, msg, why, fix = null) => findings.push({ level, where, msg, why, fix });

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
        CONSEQUENCE[name] || 'the application expects this table',
        `-- run supabase/${name}.sql (it will create the table)`);
    continue;
  }

  // Columns the code reads/writes.
  const expCols = new Map(exp.columns.map((c) => [c.column, c]));
  const gotCols = new Map(got.columns.map((c) => [c.column, c]));
  for (const [col, e] of expCols) {
    const g = gotCols.get(col);
    if (!g) {
      add('BLOCKING', `${name}.${col}`, 'column MISSING live',
          'every write touching this column errors; `create table if not exists` will NOT add it',
          `alter table public.${name} add column if not exists ${col} ${e.type}` +
          `${e.default ? ` default ${e.default}` : ''}` +
          // Never add a NOT NULL column to a populated table without a default —
          // it fails outright. Add it nullable and tighten separately.
          `${e.notnull && e.default ? ' not null' : ''};` +
          `${e.notnull && !e.default ? `\n-- then, once backfilled: alter table public.${name} alter column ${col} set not null;` : ''}`);
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
  //
  // Compare by COLUMN SET, not by definition string. ON CONFLICT needs a unique
  // index over those columns — a PRIMARY KEY and a UNIQUE constraint both
  // provide one, so a live UNIQUE(user_id, product_id) satisfies an expected
  // PRIMARY KEY(user_id, product_id). Matching on the string reported a
  // still-broken schema after the fix had already worked.
  const keyCols = (c) => {
    const m = /\(([^)]+)\)/.exec(c.definition || '');
    return m ? m[1].split(',').map((x) => x.trim().replace(/"/g, '')).sort().join(',') : null;
  };
  const isKey = (c) => c.type === 'primary key' || c.type === 'unique';
  const expKeys = exp.constraints.filter(isKey).map(keyCols).filter(Boolean);
  const gotKeys = new Set(got.constraints.filter(isKey).map(keyCols).filter(Boolean));
  for (const k of expKeys) {
    if (!gotKeys.has(k)) {
      add('BLOCKING', name, `no unique index over (${k}) — required by ON CONFLICT`,
          'upserts using onConflict raise 42P10 — the UI shows success and the data is lost',
          // A surrogate `id` PK is the usual cause (the dashboard table editor
          // adds one by default). Adding a UNIQUE alongside it is enough for
          // ON CONFLICT and is far less invasive than replacing the PK.
          `-- De-duplicate first or the constraint cannot be created:\n` +
          `--   select ${k}, count(*) from public.${name}\n` +
          `--    group by ${k.split(',').map((_, i) => i + 1).join(',')} having count(*) > 1;\n` +
          `alter table public.${name}\n  add constraint ${name}_conflict_key unique (${k});`);
    }
  }

  // RLS.
  if (exp.rls_enabled && !got.rls_enabled) {
    add('BLOCKING', name, 'RLS is DISABLED live but enabled in the repo',
        'every user can read every other user\'s rows',
        `alter table public.${name} enable row level security;`);
  }

  const expCmds = new Set(exp.policies.map((p) => p.command));
  const gotCmds = new Set(got.policies.map((p) => p.command));
  for (const cmd of expCmds) {
    if (!gotCmds.has(cmd) && !gotCmds.has('ALL')) {
      const clause = cmd === 'INSERT'
        ? 'with check (auth.uid() = user_id)'
        : cmd === 'UPDATE'
          ? 'using (auth.uid() = user_id) with check (auth.uid() = user_id)'
          : 'using (auth.uid() = user_id)';
      add('BLOCKING', name, `no ${cmd} policy live`,
          `under RLS a missing policy is a SILENT no-op, not an error — ${cmd} requests affect 0 rows`,
          `create policy "${name}_${cmd.toLowerCase()}_own" on public.${name}\n  for ${cmd.toLowerCase()} to authenticated ${clause};`);
    }
  }
  // The one table that must NOT be client-readable.
  if (name === 'pending_phone_verifications') {
    const readable = got.policies.some(
      (p) => (p.command === 'SELECT' || p.command === 'ALL') && (p.roles || []).includes('authenticated')
    );
    if (readable) {
      const bad = got.policies.filter((p) => (p.command === 'SELECT' || p.command === 'ALL') && (p.roles || []).includes('authenticated'));
      add('BLOCKING', name, 'SECURITY: readable by authenticated users',
          'account-takeover path — the attacker owns the row created for the victim\'s number and can read code_hash',
          bad.map((p) => `drop policy "${p.name}" on public.${name};`).join('\n') +
          `\nrevoke select on public.${name} from authenticated, anon;`);
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
        'the JavaScript destructures specific fields; a shape mismatch degrades the quota to fail-open',
        // Postgres refuses to change a return type in place.
        `drop function if exists public.${f.name}(${f.args.replace(/\w+ (?=\w)/g, '')});\n` +
        `-- then re-run the migration that defines it`);
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

console.log(`\n${counts.BLOCKING || 0} blocking, ${counts.WARNING || 0} warnings, ${counts.INFO || 0} info`);

const fixes = findings.filter((f) => f.fix && f.level === 'BLOCKING');
if (fixes.length) {
  const script = [
    '-- GENERATED remediation for live-schema drift.',
    '-- REVIEW BEFORE RUNNING. These are WRITES against a database holding real',
    '-- user data. Run inside a transaction and check the row counts.',
    '--',
    '-- Take a backup first (Supabase: Database -> Backups), then:',
    '--   psql "$DB_URL" -1 -v ON_ERROR_STOP=1 -f schema-remediation.sql',
    '',
    'begin;',
    '',
    ...fixes.flatMap((f) => ['-- ' + f.where + ': ' + f.msg, '-- -> ' + f.why, f.fix, '']),
    '-- Verify before committing:',
    "--   \\i supabase/_verify.sql",
    'commit;',
  ].join('\n');
  writeFileSync(resolve(process.cwd(), 'schema-remediation.sql'), script + '\n');
  console.log(`\n📝 wrote schema-remediation.sql (${fixes.length} statements) — REVIEW before running\n`);
} else {
  console.log('');
}
process.exit(counts.BLOCKING ? 1 : 0);

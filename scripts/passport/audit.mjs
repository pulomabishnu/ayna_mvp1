#!/usr/bin/env node
/**
 * Product passport audit (spec 15, 16, 30, 33).
 *
 *   node scripts/passport/audit.mjs                 # print summary, write the report
 *   node scripts/passport/audit.mjs --out report.md # choose the report path
 *   node scripts/passport/audit.mjs --json out.json # also dump every passport
 *
 * Reads the catalog straight from src/data (bundled with esbuild, because the
 * app source uses extensionless imports that plain Node cannot resolve) and
 * builds each product's passport from data already in the repo. Prints
 * completeness, missing critical fields, risky wording and clinician-review
 * flags, worst products first. Changes nothing.
 */
import { build } from 'esbuild';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const argOf = (flag, fallback) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : fallback; };
const outPath = argOf('--out', '/tmp/claude-0/r5/passport-report.md');
const jsonPath = argOf('--json', null);

const dir = mkdtempSync(join(tmpdir(), 'ayna-passport-'));
const entry = join(dir, 'entry.js');
writeFileSync(entry, `
export { ALL_PRODUCTS, CATEGORY_LABELS } from ${JSON.stringify(join(root, 'src/data/products.js'))};
export * from ${JSON.stringify(join(root, 'src/data/passport/index.js'))};
`);
const bundle = join(dir, 'bundle.mjs');
await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile: bundle, logLevel: 'error', loader: { '.jsx': 'jsx' } });
const lib = await import(pathToFileURL(bundle).href);
rmSync(dir, { recursive: true, force: true });

const { ALL_PRODUCTS, getPassport, QA_STATUS } = lib;
const rows = ALL_PRODUCTS.map((p) => ({ product: p, passport: getPassport(p) }));
rows.sort((a, b) => a.passport.completeness.overall - b.passport.completeness.overall
  || b.passport.completeness.missingCritical.length - a.passport.completeness.missingCritical.length);

const n = rows.length;
const avg = Math.round(rows.reduce((s, r) => s + r.passport.completeness.overall, 0) / n);
const sectionIds = rows[0]?.passport.completeness.sections.map((s) => s.id) || [];
const sectionAvg = {};
const sectionLabels = {};
for (const r of rows) for (const s of r.passport.completeness.sections) {
  (sectionAvg[s.id] ||= []).push(s.percent);
  sectionLabels[s.id] = s.label;
}
const qaCounts = {};
for (const r of rows) qaCounts[r.passport.qa.label] = (qaCounts[r.passport.qa.label] || 0) + 1;
const missingCounts = {};
for (const r of rows) for (const m of r.passport.completeness.missingCritical) missingCounts[m] = (missingCounts[m] || 0) + 1;
const wordingRows = rows.filter((r) => r.passport.wording.length > 0);
const wordingByRule = {};
for (const r of wordingRows) for (const w of r.passport.wording) wordingByRule[w.label] = (wordingByRule[w.label] || 0) + 1;
const flagCounts = {};
for (const r of rows) for (const f of r.passport.flags.clinician_review) flagCounts[f.id] = (flagCounts[f.id] || 0) + 1;
const needClinician = rows.filter((r) => r.passport.flags.clinician_review.length > 0).length;

const pct = (x) => `${x}%`;
const esc = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const lines = [];
lines.push('# ayna product passport audit');
lines.push('');
lines.push(`Generated ${new Date().toISOString().slice(0, 10)} by scripts/passport/audit.mjs from the in-repo catalog (${n} products in ALL_PRODUCTS).`);
lines.push('Every fact is sourced "ayna catalog (unverified)" with verified_at null. Completeness says how much we have on file, not whether a product is good (spec 34).');
lines.push('');
lines.push('## Summary');
lines.push('');
lines.push(`- Average completeness: **${pct(avg)}**`);
lines.push(`- QA status: ${Object.entries(qaCounts).map(([k, v]) => `${k} ${v}`).join(', ')} (of ${Object.keys(QA_STATUS).length} states, nothing is reviewed yet)`);
lines.push(`- Products with at least one missing critical field: **${rows.filter((r) => r.passport.completeness.missingCritical.length).length}/${n}**`);
lines.push(`- Products flagged for clinician review: **${needClinician}/${n}**`);
lines.push(`- Products with risky wording: **${wordingRows.length}/${n}** (${Object.values(wordingByRule).reduce((a, b) => a + b, 0)} hits)`);
lines.push('');
lines.push('### Completeness by section (average)');
lines.push('');
lines.push('| Section | Average |');
lines.push('|---|---|');
for (const id of sectionIds) lines.push(`| ${sectionLabels[id]} | ${pct(Math.round(sectionAvg[id].reduce((a, b) => a + b, 0) / sectionAvg[id].length))} |`);
lines.push('');
lines.push('### Most common missing critical fields');
lines.push('');
lines.push('| Field | Products missing it |');
lines.push('|---|---|');
for (const [k, v] of Object.entries(missingCounts).sort((a, b) => b[1] - a[1])) lines.push(`| ${k} | ${v} |`);
lines.push('');
lines.push('### Risky wording by rule');
lines.push('');
lines.push('| Wording | Hits |');
lines.push('|---|---|');
for (const [k, v] of Object.entries(wordingByRule).sort((a, b) => b[1] - a[1])) lines.push(`| ${k} | ${v} |`);
lines.push('');
lines.push('### Clinician-review flags');
lines.push('');
lines.push('| Flag | Products |');
lines.push('|---|---|');
for (const [k, v] of Object.entries(flagCounts).sort((a, b) => b[1] - a[1])) lines.push(`| ${k} | ${v} |`);
lines.push('');
lines.push('## Worst products first');
lines.push('');
lines.push(`| # | Product | Category | Overall | ${sectionIds.map((id) => sectionLabels[id]).join(' | ')} | Missing critical | Wording | Clinician flags |`);
lines.push(`|---|---|---|---|${sectionIds.map(() => '---').join('|')}|---|---|---|`);
rows.forEach((r, i) => {
  const c = r.passport.completeness;
  const bySec = Object.fromEntries(c.sections.map((s) => [s.id, s.percent]));
  lines.push(`| ${i + 1} | ${esc(r.product.name)} \`${r.product.id}\` | ${r.product.category} | ${pct(c.overall)} | ${sectionIds.map((id) => (bySec[id] == null ? 'n/a' : pct(bySec[id]))).join(' | ')} | ${esc(c.missingCritical.join(', ') || 'none')} | ${r.passport.wording.map((w) => w.label).join(', ') || ''} | ${r.passport.flags.clinician_review.map((f) => f.id).join(', ')} |`);
});
lines.push('');
lines.push('## Risky wording detail');
lines.push('');
for (const r of wordingRows) {
  lines.push(`### ${esc(r.product.name)} (\`${r.product.id}\`)`);
  for (const w of r.passport.wording) lines.push(`- **${w.label}** (${w.severity}) in ${w.fieldLabel}: "${esc(w.excerpt)}"`);
  lines.push('');
}

writeFileSync(outPath, `${lines.join('\n')}\n`);
if (jsonPath) writeFileSync(jsonPath, JSON.stringify(rows.map((r) => r.passport), null, 2));

// Console summary
console.log(`ayna passport audit: ${n} products, average completeness ${avg}%`);
console.log(`QA: ${Object.entries(qaCounts).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log('Sections:', sectionIds.map((id) => `${sectionLabels[id]} ${Math.round(sectionAvg[id].reduce((a, b) => a + b, 0) / sectionAvg[id].length)}%`).join(' · '));
console.log('Most missing critical:', Object.entries(missingCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => `${k} (${v})`).join(', '));
console.log(`Risky wording: ${wordingRows.length} products; ${Object.entries(wordingByRule).map(([k, v]) => `${k} ${v}`).join(', ')}`);
console.log(`Clinician review flags: ${needClinician} products`);
console.log('\nWorst 15:');
for (const r of rows.slice(0, 15)) console.log(`  ${String(r.passport.completeness.overall).padStart(3)}%  ${r.product.id.padEnd(40)} missing: ${r.passport.completeness.missingCritical.join(', ')}`);
console.log(`\nReport written to ${outPath}`);

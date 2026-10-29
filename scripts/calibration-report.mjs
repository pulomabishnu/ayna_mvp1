#!/usr/bin/env node
// Calibration report from a CSV export of public.match_outcome_samples
// (Supabase table editor > Export > CSV). Usage:
//   node scripts/calibration-report.mjs path/to/match_outcome_samples.csv
// Prints helped rate per band with a 95% interval and the verdict
// (src/matching/calibration.js). Anonymous data only.
import { readFileSync } from 'node:fs';
import { reliabilityTable, calibrationVerdict } from '../src/matching/calibration.js';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/calibration-report.mjs <csv>'); process.exit(1); }
const [head, ...rows] = readFileSync(file, 'utf8').trim().split(/\r?\n/);
const cols = head.split(',').map((c) => c.replace(/"/g, '').trim());
const samples = rows.map((r) => { const v = r.split(',').map((x) => x.replace(/"/g, '').trim()); return Object.fromEntries(cols.map((c, i) => [c, v[i]])); });
const table = reliabilityTable(samples);
const pct = (x) => (x == null ? '  -  ' : `${Math.round(x * 100)}%`.padStart(5));
console.log('band     n    helped  95% interval   worse/side effect');
for (const r of table) console.log(`${r.band.padEnd(8)} ${String(r.n).padStart(4)}  ${pct(r.rate)}   ${pct(r.low)} to ${pct(r.high)}   ${pct(r.harmRate)}`);
const v = calibrationVerdict(table);
console.log(`\nverdict: ${v.verdict}${v.detail.length ? ` (${v.detail.join('; ')})` : ''}`);

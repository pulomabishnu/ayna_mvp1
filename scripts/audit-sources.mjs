// Lists every science/clinical source that breaks src/data/sourcePolicy.js.
// Usage: node scripts/audit-sources.mjs [--json out.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isCredibleScienceSource, hostOf, SCIENCE_KEYS } from '../src/data/sourcePolicy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = async (rel) => import(pathToFileURL(path.join(root, rel)).href);
const json = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const URL_RE = /^https?:\/\//;

/** Walk an object; report URLs that sit under a science key. */
function walk(node, trail, inScience, out) {
  if (typeof node === 'string') {
    if (inScience && URL_RE.test(node) && !isCredibleScienceSource(node)) out.push({ path: trail.join('.'), url: node, host: hostOf(node) });
    return;
  }
  if (Array.isArray(node)) { node.forEach((v, i) => walk(v, [...trail, i], inScience, out)); return; }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, [...trail, k], inScience || SCIENCE_KEYS.has(k), out);
  }
}

export async function audit() {
  const out = [];
  const { PRODUCT_RESEARCH } = await load('src/data/productResearch.js');
  const { PRODUCT_RESEARCH_CORE } = await load('src/data/productResearchCore.js');
  walk(PRODUCT_RESEARCH, ['productResearch'], false, out);
  walk(PRODUCT_RESEARCH_CORE, ['productResearchCore'], false, out);
  // Need evidence: every source is science.
  walk(json('src/data/matching/needs.research.json'), ['needs.research'], true, out);
  const needMap = json('src/data/matching/needMap.research.json');
  needMap.forEach((row, i) => { const u = row.source_url || row.url; if (u && !isCredibleScienceSource(u)) out.push({ path: `needMap.research.${i}.source_url`, url: u, host: hostOf(u), product: row.product, need: row.need, rationale: row.rationale }); });
  return out;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = await audit();
  const byHost = {};
  rows.forEach((r) => { byHost[r.host] = (byHost[r.host] || 0) + 1; });
  console.log(`${rows.length} non-credible science/clinical sources`);
  Object.entries(byHost).sort((a, b) => b[1] - a[1]).forEach(([h, n]) => console.log(String(n).padStart(4), h));
  const i = process.argv.indexOf('--json');
  if (i > 0) fs.writeFileSync(process.argv[i + 1], JSON.stringify(rows, null, 1));
}

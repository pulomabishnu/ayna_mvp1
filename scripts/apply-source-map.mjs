// Applies a verified source map to the research layers (never team copy).
// Usage: node scripts/apply-source-map.mjs map.json [more.json ...]
// Map entry: { old_url, action: relink_same_paper|replace_source|remove_claim, new_url, new_label, new_summary }
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isCredibleScienceSource } from '../src/data/sourcePolicy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const map = new Map();
for (const f of process.argv.slice(2)) for (const e of JSON.parse(fs.readFileSync(f, 'utf8'))) map.set(e.old_url, e);
for (const e of map.values()) {
  if (e.action !== 'remove_claim' && !isCredibleScienceSource(e.new_url)) throw new Error(`Replacement fails the source policy: ${e.new_url}`);
}

const JS_FILES = ['src/data/productResearch.js', 'src/data/productResearchCore.js'];
const JSON_FILES = ['src/data/matching/needs.research.json', 'src/data/matching/needMap.research.json'];
const report = { relinked: 0, replaced: 0, removed: 0, claimsCut: [], needsHuman: [] };

function fix(node, trail) {
  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      const v = node[i];
      const url = typeof v === 'string' ? v : v && typeof v === 'object' ? v.url : null;
      const e = url && map.get(url);
      if (e?.action === 'remove_claim') { node.splice(i, 1); report.removed++; continue; }
      if (typeof v === 'string' && e) { node[i] = e.new_url; e.action === 'relink_same_paper' ? report.relinked++ : report.replaced++; continue; }
      fix(v, [...trail, i]);
    }
    return;
  }
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'string' && map.has(v)) {
      const e = map.get(v);
      if (e.action === 'remove_claim') { report.needsHuman.push({ where: [...trail, k].join('.'), url: v, note: e.note }); continue; }
      node[k] = e.new_url;
      if (e.action === 'replace_source') {
        if (k === 'url' && 'label' in node && e.new_label) node.label = e.new_label;
        if (k === 'url' && 'summary' in node && e.new_summary) node.summary = e.new_summary;
        if (k === 'sourceUrl' && 'sourceLabel' in node && e.new_label) node.sourceLabel = e.new_label;
        report.replaced++;
      } else report.relinked++;
    } else fix(v, [...trail, k]);
  }
  // A science claim whose last source was removed is cut (CLAUDE.md: no unsourced claims).
  if (Array.isArray(node.ingredientScience)) {
    node.ingredientScience = node.ingredientScience.filter((item, i) => {
      if (!Array.isArray(item.citations) || item.citations.length) return true;
      report.claimsCut.push({ where: [...trail, 'ingredientScience', i].join('.'), text: item.text });
      return false;
    });
  }
  for (const [listKey, textKey] of [['clinicalNoteSources', 'clinicalNote'], ['scienceSources', null], ['clinicalSources', null], ['effectivenessSources', 'effectiveness']]) {
    if (Array.isArray(node[listKey]) && node[listKey].length === 0) report.needsHuman.push({ where: [...trail, listKey].join('.'), note: `every source was removed${textKey ? `; ${textKey} is now unsourced` : ''}` });
  }
}

for (const rel of JS_FILES) {
  const file = path.join(root, rel);
  const t = fs.readFileSync(file, 'utf8');
  const i = t.indexOf('= {') + 2;
  const j = t.lastIndexOf('};') + 1;
  const data = JSON.parse(t.slice(i, j));
  fix(data, [path.basename(rel, '.js')]);
  fs.writeFileSync(file, t.slice(0, i) + JSON.stringify(data, null, 2) + t.slice(j));
}
for (const rel of JSON_FILES) {
  const file = path.join(root, rel);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  fix(data, [path.basename(rel, '.json')]);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 1)}\n`);
}
console.log(JSON.stringify(report, null, 1));

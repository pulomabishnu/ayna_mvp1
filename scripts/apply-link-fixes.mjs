// Applies verified broken-link fixes across the site and app.
//   node scripts/apply-link-fixes.mjs fix0.json fix1.json ...
// Entry: { old_url, action: 'replace'|'keep'|'remove', new_url }
//   replace: every exact occurrence of old_url becomes new_url (a URL that was
//            cut off at a space in the code is replaced up to its quote).
//   remove:  the link is taken out with the thing it belongs to: a list entry
//            ({ url: ... } object, <li>, buy-link line, JSON array item), or the
//            field is emptied (image, sourceUrl, app url override).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const entries = process.argv.slice(2).flatMap((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!['node_modules', 'dist'].includes(e.name)) walk(p, out); }
    else if (/\.(js|jsx|json|mjs)$/.test(e.name) && !/\.test\./.test(e.name)) out.push(p);
  }
  return out;
}
const files = ['src', 'api', 'public'].flatMap((d) => (fs.existsSync(path.join(root, d)) ? walk(path.join(root, d)) : []));
const report = { replaced: 0, removed: 0, notFound: [], files: new Set() };

// JSON-bodied modules (export const X = {...}; or JSON files) are edited as data.
function editJsonBody(text, fn) {
  const i = text.search(/=\s*[[{]/);
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) { const d = JSON.parse(text); const changed = fn(d); return changed ? `${JSON.stringify(d, null, text.includes('\n  "') ? 2 : 1)}\n` : null; }
  if (i < 0) return null;
  const start = text.indexOf(text[i + text.slice(i).search(/[[{]/)], i);
  const end = Math.max(text.lastIndexOf('};'), text.lastIndexOf('];')) + 1;
  let data;
  try { data = JSON.parse(text.slice(start, end)); } catch { return null; }
  const changed = fn(data);
  if (!changed) return null;
  const indent = /\n {2}"/.test(text.slice(start, start + 200)) ? 2 : 1;
  return text.slice(0, start) + JSON.stringify(data, null, indent) + text.slice(end);
}
function removeFromData(node, url) {
  let changed = false;
  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      const v = node[i];
      if (v === url || (v && typeof v === 'object' && (v.url === url || v.source_url === url))) { node.splice(i, 1); changed = true; } else if (removeFromData(v, url)) changed = true;
    }
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (v === url) {
        node[k] = k === 'image' ? '' : null;
        if (k === 'sourceUrl' && 'sourceLabel' in node) node.sourceLabel = null;
        changed = true;
      } else if (removeFromData(v, url)) changed = true;
    }
  }
  return changed;
}

for (const e of entries) {
  if (e.action === 'keep') continue;
  let hit = false;
  for (const file of files) {
    let text = fs.readFileSync(file, 'utf8');
    if (!text.includes(e.old_url)) continue;
    hit = true;
    const before = text;
    if (e.action === 'replace') {
      // Cut-off URL: the code has "old_url<space>more" before the quote.
      // Only inside a quoted string on one line, and only when the URL really
      // continues past the space (a file name like "Sheet (2).pdf").
      text = text.replace(new RegExp(`(['"\`])${esc(e.old_url)}( [^'"\`<>\\n]*\\.(pdf|png|jpe?g|html?))(?=\\1)`, 'g'), (m, q) => `${q}${e.new_url}`);
      text = text.split(e.old_url).join(e.new_url);
      report.replaced++;
    } else if (e.action === 'remove') {
      const asData = editJsonBody(text, (d) => removeFromData(d, e.old_url));
      if (asData) text = asData;
      else {
        const u = esc(e.old_url);
        text = text
          // { ..., url: 'X', ... } list entry (one line), with its comma
          // A { ..., url: 'X', ... } list entry that fills its own line: drop the line.
          .replace(new RegExp(`^[ \\t]*\\{[^{}\\n]*['"]${u}['"][^{}\\n]*\\},?[ \\t]*\\n`, 'gm'), '')
          // One inside a longer line: drop the entry and its comma only.
          .replace(new RegExp(`\\{[^{}\\n]*['"]${u}['"][^{}\\n]*\\}\\s*,\\s*`, 'g'), '')
          .replace(new RegExp(`,?\\s*\\{[^{}\\n]*['"]${u}['"][^{}\\n]*\\}`, 'g'), '')
          // <li>...href="X"...</li>
          .replace(new RegExp(`[ \\t]*<li>[^\\n]*href=["']${u}["'][^\\n]*</li>\\n?`, 'g'), '')
          // "p-id": "X", buy-link map line
          .replace(new RegExp(`[ \\t]*["'][\\w-]+["']:\\s*["']${u}["'],?[ \\t]*\\n`, 'g'), '')
          // image: 'X' -> image: ''
          .replace(new RegExp(`(image|imageUrl|logo):\\s*(['"])${u}\\2`, 'g'), "$1: ''");
        // Dangling comma before a closing bracket left by a removed last entry.
        text = text.replace(/,(\s*[\]}])/g, (m, close) => (/^\s*\]/.test(close) || /^\s*\}/.test(close) ? m : m));
      }
      if (text !== before) report.removed++;
    }
    if (text !== before) { fs.writeFileSync(file, text); report.files.add(path.relative(root, file)); }
    else if (e.action === 'remove') report.notFound.push(`${e.old_url} (pattern not matched in ${path.relative(root, file)})`);
  }
  if (!hit) report.notFound.push(`${e.old_url} (not in code)`);
}
console.log(JSON.stringify({ ...report, files: [...report.files] }, null, 1));

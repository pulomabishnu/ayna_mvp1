// Team copy lock. The founders and team write product information (names,
// prices, descriptions, clinical and community notes, safety notes). Nothing
// automated (AI sessions, research merges, scripts) may change it silently.
//
// src/data/teamCopy.lock.json holds a fingerprint of every team-written field
// as shown on the site. src/data/teamCopy.lock.test.js fails the build when any
// of them changes. To accept a change a founder asked for:
//   node scripts/team-copy-lock.mjs --approve p-some-id.price --by "Eliz" --note "new pack size"
// New products are added to the lock with:
//   node scripts/team-copy-lock.mjs --add-new --by "Ameera"
// Every approval is logged in src/data/teamCopy.approvals.json.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { applyCatalogCorrections } from '../src/data/catalogCorrections.js';

export const LOCKED_FIELDS = ['name', 'brand', 'price', 'summary', 'description', 'doctorOpinion', 'communityReview', 'effectiveness',
  'ingredients', 'category', 'url', 'image', 'whoItsFor', 'howToUse', 'warnings', 'badges',
  'safety.fdaStatus', 'safety.materials', 'safety.recalls', 'safety.allergens', 'safety.sideEffects', 'safety.opinionAlerts'];

const get = (p, f) => f.split('.').reduce((o, k) => (o == null ? o : o[k]), p);
export const fingerprint = (v) => createHash('sha1').update(JSON.stringify(v ?? null)).digest('hex').slice(0, 12);
export function currentPrints(products = ALL_PRODUCTS) {
  const out = {};
  for (const p of products) {
    if (!p?.id) continue;
    // Fingerprint what the site shows: the product after the catalog
    // corrections overlay, so an edit there is caught too.
    const shown = applyCatalogCorrections(p);
    out[p.id] = Object.fromEntries(LOCKED_FIELDS.map((f) => [f, fingerprint(get(shown, f))]));
  }
  return out;
}

const LOCK = new URL('../src/data/teamCopy.lock.json', import.meta.url);
const LOG = new URL('../src/data/teamCopy.approvals.json', import.meta.url);

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const by = args[args.indexOf('--by') + 1];
  const note = args.includes('--note') ? args[args.indexOf('--note') + 1] : '';
  const now = currentPrints();
  const lock = fs.existsSync(LOCK) ? JSON.parse(fs.readFileSync(LOCK, 'utf8')) : null;
  const log = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : [];
  if (args.includes('--init')) {
    fs.writeFileSync(LOCK, `${JSON.stringify(now, null, 1)}\n`);
    fs.writeFileSync(LOG, `${JSON.stringify([{ at: new Date().toISOString(), by: by || 'team', what: 'initial lock', note }], null, 1)}\n`);
    console.log(`locked ${Object.keys(now).length} products`);
  } else if (args.includes('--approve')) {
    if (!by || by.startsWith('--')) throw new Error('--by "Name" is required: who asked for this change');
    const [id, ...rest] = args[args.indexOf('--approve') + 1].split('.');
    const field = rest.join('.');
    if (!lock[id] || !(field in now[id])) throw new Error(`unknown ${id}.${field}`);
    lock[id][field] = now[id][field];
    log.push({ at: new Date().toISOString(), by, what: `${id}.${field}`, note });
    fs.writeFileSync(LOCK, `${JSON.stringify(lock, null, 1)}\n`);
    fs.writeFileSync(LOG, `${JSON.stringify(log, null, 1)}\n`);
    console.log(`approved ${id}.${field} (by ${by})`);
  } else if (args.includes('--add-new')) {
    if (!by || by.startsWith('--')) throw new Error('--by "Name" is required');
    const added = Object.keys(now).filter((id) => !lock[id]);
    for (const id of added) lock[id] = now[id];
    log.push({ at: new Date().toISOString(), by, what: `added ${added.length} new products`, note: added.join(', ') });
    fs.writeFileSync(LOCK, `${JSON.stringify(lock, null, 1)}\n`);
    fs.writeFileSync(LOG, `${JSON.stringify(log, null, 1)}\n`);
    console.log(`added ${added.length}`);
  } else {
    console.log('usage: --init | --approve id.field --by Name [--note text] | --add-new --by Name');
  }
}

#!/usr/bin/env node
/**
 * Fills in `image: ''` entries in the bundled catalog files using the app's
 * own real image-resolution endpoint (/api/product-image — Shopify catalog
 * match, then og:image with logo/banner rejection, then NIH DSLD, then
 * Serper image search). Never guesses or scrapes anything itself — every
 * result comes from that same vetted resolver the live discovered-products
 * pipeline already uses, so a bundled product gets the same quality bar as
 * an AI-discovered one.
 *
 *   node scripts/fill-missing-product-images.mjs            # dry run
 *   node scripts/fill-missing-product-images.mjs --apply    # writes results
 *
 * Targets a deployed environment (local `vite dev` has no /api/product-image
 * route running, and this endpoint needs Redis/Serper env vars configured on
 * Vercel anyway). Defaults to the same protected preview URL the app's own
 * capacitor.config.json already points at; override with API_BASE_URL if you
 * want to run this against a different deployment.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const APPLY = process.argv.includes('--apply');

// Every entry here has a confirmed `image: ''` in its source file (see the
// audit that produced this list) — id/file/exact-current-snippet let this
// script do a precise, unambiguous string replace rather than a regex that
// could touch the wrong occurrence in a file this dense.
const TARGETS = [
  { file: 'src/data/productsExtended.js', name: 'June Cup', brand: 'June', type: 'physical' },
  { file: 'src/data/productsExtended2.js', name: 'Citracal Bone Health+ (Calcium Citrate + D3)', brand: 'Citracal', type: 'physical' },
  { file: 'src/data/mvpProducts.js', name: 'Pink Stork Bloat Support', brand: 'Pink Stork', type: 'physical' },
  { file: 'src/data/mvpProducts.js', name: 'Remifemin (Black Cohosh)', brand: 'Remifemin', type: 'physical' },
  { file: 'src/data/mvpProducts.js', name: 'Happi Pelvic Floor App', brand: 'Happi', type: 'digital' },
  { file: 'src/data/menstrualProducts.js', name: 'Kotex Security Ultra Thin', brand: 'Kotex', type: 'physical' },
  { file: 'src/data/menstrualProducts.js', name: 'Seventh Generation Ultra Thin Pads', brand: 'Seventh Generation', type: 'physical' },
  { file: 'src/data/menstrualProducts.js', name: 'U by Kotex Clean Wear', brand: 'U by Kotex', type: 'physical' },
  { file: 'src/data/menstrualProducts.js', name: 'Always Liners', brand: 'Always', type: 'physical' },
  { file: 'src/data/menstrualProducts.js', name: 'Tampax Radiant Tampons', brand: 'Tampax', type: 'physical' },
  { file: 'src/data/menstrualProducts.js', name: 'Seventh Generation Organic Tampons', brand: 'Seventh Generation', type: 'physical' },
  { file: 'src/data/categoryFillers.js', name: 'Queen V The Pop It Suppositories', brand: 'Queen V', type: 'physical' },
  // Has a real official url — the resolver can try Shopify/og:image against
  // it directly instead of relying purely on name/brand search.
  { file: 'src/data/brands.js', name: 'Connect Pelvic Floor Fitness', brand: 'Connect Pelvic Floor Fitness', type: 'digital', url: 'https://www.connectpelvicfloorfitness.com/' },
];

const DEFAULT_BASE = 'https://aynamvp1-git-mobile-app-pulomabishnu-4744s-projects.vercel.app';
const DEFAULT_BYPASS = '?x-vercel-protection-bypass=dgHDMGLONOjSAFQP2tXuDxBo3v0FgTyi&x-vercel-set-bypass-cookie=true';
const base = process.env.API_BASE_URL || DEFAULT_BASE;
const bypassSuffix = process.env.API_BASE_URL ? '' : DEFAULT_BYPASS;

console.log(`\n${APPLY ? 'APPLYING' : 'DRY RUN'} — resolving images via ${base}/api/product-image\n`);

let filled = 0;
let skipped = 0;

for (const t of TARGETS) {
  const params = new URLSearchParams({ name: t.name, brand: t.brand, type: t.type });
  if (t.url) params.set('url', t.url);
  const sep = bypassSuffix ? '&' : '?';
  const requestUrl = `${base}/api/product-image?${params.toString()}${bypassSuffix ? sep + bypassSuffix.slice(1) : ''}`;

  let imageUrl = '';
  try {
    const res = await fetch(requestUrl);
    if (res.ok) {
      const data = await res.json();
      imageUrl = data?.imageUrl || '';
    } else {
      console.log(`  HTTP ${res.status} for "${t.name}"`);
    }
  } catch (e) {
    console.log(`  fetch failed for "${t.name}": ${e.message}`);
  }

  if (!imageUrl) {
    console.log(`❌ ${t.name} — no image found (needs a manual URL)`);
    skipped += 1;
    continue;
  }

  console.log(`✅ ${t.name} — ${imageUrl}`);
  filled += 1;

  if (APPLY) {
    const path = t.file;
    const content = readFileSync(path, 'utf8');
    // Replace only the FIRST remaining `image: ''` after this product's own
    // `name: '<name>'` — every target file has at most one occurrence per
    // product, and matching on the adjacent name keeps this from ever
    // touching a different product's empty image by coincidence.
    const nameIdx = content.indexOf(`name: '${t.name}'`);
    if (nameIdx === -1) {
      console.log(`   (could not re-locate "${t.name}" in ${path} — skipped write, check manually)`);
      continue;
    }
    const emptyIdx = content.indexOf("image: ''", nameIdx);
    if (emptyIdx === -1) {
      console.log(`   (no image: '' found near "${t.name}" in ${path} — already set? skipped write)`);
      continue;
    }
    const updated = content.slice(0, emptyIdx) + `image: '${imageUrl}'` + content.slice(emptyIdx + "image: ''".length);
    writeFileSync(path, updated);
    console.log(`   written to ${path}`);
  }
}

console.log(`\n${filled} resolved, ${skipped} need a manual image URL.`);
if (!APPLY && filled > 0) {
  console.log('Dry run — re-run with --apply to write these into the source files.\n');
}

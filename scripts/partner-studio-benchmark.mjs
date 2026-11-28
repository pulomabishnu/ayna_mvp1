#!/usr/bin/env node
/**
 * Partner Studio benchmark run (ayna Intelligence Phase 1).
 *
 *   npm run partner:benchmark            # writes api/_partnerStudio/snapshot.js
 *   npm run partner:benchmark -- --check # runs, replays, prints, writes nothing
 *   (build) --if-enabled                  # runs only when PARTNER_STUDIO_ENABLED=1
 *
 * The repo keeps a placeholder snapshot; the build writes the real one so a
 * deploy with the flag on always serves a fresh run. Don't commit the output.
 *
 * Reads the bundled catalog and product passports, runs fictional scenarios
 * through the production matching engine, and writes precomputed brand
 * rollups for the server-only /api/partner-studio route. Read-only: no
 * database, no network, no user-level data. The one real-world input is
 * aggregate per-product ayna app activity counts (api/_partnerStudio/engagement.js),
 * shown beside the benchmark and never used to rank. The snapshot is served
 * only to signed-in admins and is never bundled into the website.
 */
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { ALL_PRODUCTS } from '../src/data/products.js';
import { buildProductProfile } from '../src/matching/productProfile.js';
import { getPassport, getCompleteness } from '../src/data/passport/index.js';
import { isPartnerBrandItem, PARTNER_BRANDS } from '../src/utils/partnerBrands.js';
import { PHASE1_CATEGORIES, CATEGORY_SET_VERSION, OUT_OF_SCOPE_CATEGORIES, OUT_OF_SCOPE_REASON, universeFor } from '../src/partnerStudio/engine/categories.js';
import { scenariosFor, SCENARIO_SET_VERSION } from '../src/partnerStudio/engine/scenarios.js';
import { compactScenarios } from '../src/partnerStudio/engine/explore.js';
import { brandOf as appBrandOf } from '../src/mobile/data/brandFallback.js';
import { runScenarios, counterfactual, priceOf, K, ENGINE_ADAPTER_VERSION } from '../src/partnerStudio/engine/benchmark.js';
import { recommendationShare } from '../src/partnerStudio/engine/metrics.js';
import { evidenceRecord } from '../src/partnerStudio/engine/evidence.js';
import { brandRollup } from '../src/partnerStudio/engine/rollup.js';
import { ENGAGEMENT, ENG_FROM, ENG_TO } from '../api/_partnerStudio/engagement.js';

const CHECK = process.argv.includes('--check');
// Real ayna app activity (aggregate counts per product), shown beside the benchmark, never used to rank.
const withEngagement = (c) => ({ ...c, products: c.products.map((p) => (ENGAGEMENT.has(p.id) ? { ...p, eng: ENGAGEMENT.get(p.id) } : p)) });
if (process.argv.includes('--if-enabled') && process.env.PARTNER_STUDIO_ENABLED !== '1') {
  console.log('partner-studio: PARTNER_STUDIO_ENABLED is not 1, keeping the placeholder snapshot.');
  process.exit(0);
}
const OUT = 'api/_partnerStudio/snapshot.js';
const sha = (x) => createHash('sha256').update(typeof x === 'string' ? x : JSON.stringify(x)).digest('hex').slice(0, 16);
// Same brand lookup the app uses (explicit field, else the brand at the start of the product's name).
const brandOf = (p) => appBrandOf(p) || 'Unbranded';
let gitSha = 'unknown';
try { gitSha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { /* not a checkout */ }

const t0 = Date.now();
const products = ALL_PRODUCTS.filter((p) => p?.id);
const runs = [];
const universeIds = new Map(); // sku -> [category ids]
for (const category of PHASE1_CATEGORIES) {
  const universe = universeFor(products, category, buildProductProfile);
  for (const p of universe) universeIds.set(p.id, [...(universeIds.get(p.id) || []), category.id]);
  const sets = scenariosFor(category);
  const opts = { brandOf };
  const baseline = runScenarios(sets.baseline, universe, opts);
  const replay = runScenarios(sets.baseline, universe, opts);
  const deterministic = sha(baseline) === sha(replay);
  const boundary = runScenarios(sets.boundary, universe, opts);
  const unknown = runScenarios(sets.unknown, universe, opts);
  runs.push({ category, universe, sets, baseline, boundary, unknown, deterministic, catalogVersion: sha(universe) });
  console.log(`${category.id}: ${universe.length} SKUs, ${baseline.length} baseline + ${boundary.length} boundary + ${unknown.length} unknown scenarios, deterministic=${deterministic}`);
}

// Evidence records for every SKU in any universe (peers included).
const evidence = [];
for (const p of products) {
  const cats = universeIds.get(p.id);
  if (!cats) continue;
  let passport = null;
  let completeness = null;
  try { passport = getPassport(p); completeness = getCompleteness(p); } catch { /* product without a passport */ }
  const rec = evidenceRecord(p, passport || {}, completeness || {});
  evidence.push({ ...rec, brand: brandOf(p), categories: cats, productCategory: p.category || 'other', price: priceOf(p) });
}

// Partner brands: the tenants Phase 1 can show. Everyone else is only a peer.
const partnerNames = PARTNER_BRANDS.map((b) => b.name);
const brands = {};
for (const name of partnerNames) {
  const own = products.filter((p) => isPartnerBrandItem(p) && brandOf(p).toLowerCase() === name.toLowerCase());
  if (!own.length) { brands[name] = { brand: name, empty: 'No live products in the catalog.' }; continue; }
  const brandKey = brandOf(own[0]);
  const skus = own.map((p) => {
    const inCats = universeIds.get(p.id) || [];
    const oos = OUT_OF_SCOPE_CATEGORIES.has(String(p.category || '').toLowerCase());
    return { id: p.id, name: p.name, category: p.category || 'other', price: priceOf(p), inScope: inCats.length > 0, categories: inCats, scopeNote: inCats.length ? null : oos ? OUT_OF_SCOPE_REASON : 'Not relevant to a Phase 1 category’s needs.' };
  });

  // Feed: observed passport events for this brand's SKUs.
  const feed = [];
  for (const r of evidence.filter((e) => e.brand === brandKey)) {
    if (r.qa.status === 'needs_correction') feed.push({ type: 'qa_correction', sku: r.sku, name: r.name, date: r.qa.at, title: 'Facts flagged for correction', detail: String(r.qa.by ? `${r.qa.by}: ` : '') + 'a research check found catalog facts that differ from the brand’s current page.' });
    if (r.qa.status === 'needs_clinician_review') feed.push({ type: 'clinician_review', sku: r.sku, name: r.name, date: r.qa.at, title: 'Clinical review open', detail: 'A safety-relevant fact needs a clinician to confirm before it is final.' });
    if (r.freshness?.state === 'stale') feed.push({ type: 'stale', sku: r.sku, name: r.name, date: r.freshness.lastVerified, days: r.freshness.daysOverdue, title: `Facts ${r.freshness.daysOverdue} days past review`, detail: `Last verified ${r.freshness.lastVerified || 'never'}.` });
    for (const c of r.claims) for (const f of c.flags) feed.push({ type: 'claim_flag', sku: r.sku, name: r.name, date: r.verifiedAt, title: f.label, detail: `“${c.text}”` });
  }

  // Simulations: each in-scope SKU with a price, 20% lower, same scenarios and universe.
  const simulations = [];
  for (const s of skus.filter((x) => x.inScope && x.price != null)) {
    const catId = s.categories[0];
    const run = runs.find((r) => r.category.id === catId);
    const prof = buildProductProfile(products.find((p) => p.id === s.id));
    const relevantNeeds = new Set(run.category.needs.filter((n) => run.baseline.some((r) => r.need === n && r.candidates.some((c) => c.sku === s.id))));
    const scen = run.sets.baseline.filter((x) => relevantNeeds.has(x.need));
    if (!scen.length || !prof) continue;
    const before = run.baseline.filter((r) => relevantNeeds.has(r.need));
    const newPrice = Math.round(s.price * 0.8 * 100) / 100;
    const after = counterfactual({ universe: run.universe, sku: s.id, change: { price: `$${newPrice}` }, scenarios: scen, opts: { brandOf } });
    const b = recommendationShare(before, brandKey);
    const a = recommendationShare(after, brandKey);
    const skuSlots = (rs) => rs.reduce((n, r) => n + r.placements.filter((p) => p.sku === s.id).length, 0);
    // Safety regression: a SKU held or excluded before must never be placed after a price change.
    const safetyOk = before.every((r, i) => {
      const was = r.candidates.find((c) => c.sku === s.id)?.stage;
      const now = after[i].candidates.find((c) => c.sku === s.id)?.stage;
      return !(['excluded', 'insufficient_info'].includes(was) && now === 'selected');
    });
    const delta = new Map();
    for (const rs of [[before, -1], [after, 1]]) for (const r of rs[0]) for (const p of r.placements) if (p.brand !== brandKey) delta.set(p.brand, (delta.get(p.brand) || 0) + rs[1]);
    const displaced = [...delta.values()].filter((v) => v < 0).reduce((x, y) => x + y, 0);
    simulations.push({
      sku: s.id, name: s.name, category: catId, scenarios: scen.length,
      change: { field: 'price', from: s.price, to: newPrice }, changeLabel: `$${newPrice} (was $${s.price})`,
      before: { inclusion: b.inclusion, skuSlots: skuSlots(before) },
      after: { inclusion: a.inclusion, skuSlots: skuSlots(after) },
      displacedOtherSlots: -displaced,
      safetyOk,
    });
  }

  brands[name] = brandRollup({ brand: brandKey, categories: runs.map(({ category, baseline, boundary, unknown }) => ({ category, baseline, boundary, unknown })), evidence, simulations, skus, feed });
  brands[name].displayName = name;
  const t = brands[name].totals;
  console.log(`  ${name}: ${skus.filter((x) => x.inScope).length}/${skus.length} SKUs in scope, slot share ${t.slotShare.pct ?? 'N/A'}%, inclusion ${t.inclusion.pct ?? 'N/A'}%, ${brands[name].actions.length} actions`);
}

const snapshot = {
  run: {
    runId: `run-${new Date().toISOString().slice(0, 10)}-${sha(runs.map((r) => r.catalogVersion).join(':') + SCENARIO_SET_VERSION).slice(0, 8)}`,
    createdAt: new Date().toISOString(),
    engagement: { from: ENG_FROM, to: ENG_TO, source: 'ayna app (PostHog), aggregate counts per product' },
    scenarioSetVersion: SCENARIO_SET_VERSION,
    categorySetVersion: CATEGORY_SET_VERSION,
    adapterVersion: ENGINE_ADAPTER_VERSION,
    engine: 'matching v2 (buildEcosystemV2)',
    gitSha,
    k: K,
    weights: 'equal (1 per scenario)',
    deterministic: runs.every((r) => r.deterministic),
    seconds: Math.round((Date.now() - t0) / 1000),
  },
  categories: runs.map((r) => ({
    id: r.category.id, label: r.category.label, needs: r.category.needs, catalogVersion: r.catalogVersion,
    universe: r.universe.length, brands: new Set(r.universe.map(brandOf)).size,
    baseline: r.baseline.length, boundary: r.boundary.length, unknown: r.unknown.length,
    noResult: r.baseline.filter((x) => x.placements.length === 0).length,
    unfilled: r.baseline.reduce((n, x) => n + Math.max(0, K - x.placements.length), 0),
    k: K,
    format: r.category.format,
    // Every catalog product in the universe (public facts) and one compact row per baseline scenario.
    ...withEngagement(compactScenarios(r.baseline, r.universe, brandOf, isPartnerBrandItem)),
  })),
  outOfScope: OUT_OF_SCOPE_REASON,
  brands,
};

// Privacy guard: the snapshot must never carry user or event identifiers.
const serialized = JSON.stringify(snapshot);
if (/"(user_?id|email|distinct_id|session_?id|analytics_id)"\s*:/i.test(serialized) || /@(gmail|aynahealth|icloud|yahoo)\./i.test(serialized)) {
  console.error('partner-studio: snapshot contains a user or event identifier. Not written.');
  process.exit(1);
}

if (CHECK) {
  console.log(`\nChecked ${Object.keys(brands).length} brands in ${snapshot.run.seconds}s. deterministic=${snapshot.run.deterministic}. Nothing written.`);
} else {
  mkdirSync('api/_partnerStudio', { recursive: true });
  writeFileSync(OUT, `// Generated by scripts/partner-studio-benchmark.mjs. Do not edit by hand.\n// Synthetic benchmark over public catalog facts plus aggregate per-product app activity counts; no user-level data. Served only by api/partner-studio.js.\nexport default ${JSON.stringify(snapshot)};\n`);
  console.log(`\nWrote ${OUT} (${Math.round(JSON.stringify(snapshot).length / 1024)} KB) in ${snapshot.run.seconds}s.`);
}

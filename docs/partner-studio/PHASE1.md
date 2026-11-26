# ayna Partner Studio, Phase 1

Source plan: *ayna Intelligence Phase 1 product strategy* (25 Nov 2026). Product name: **ayna Partner Studio**.

This PR is the plan's first step (p.17): inspect the matching code, Supabase schemas, catalog source quality and event instrumentation; map real functions and fields to the proposed contracts; build a working dashboard behind a feature flag with tests. **No production data is mutated. No migration is applied.**

## What ships

| Piece | Where | Notes |
|---|---|---|
| Benchmark universes (3 categories) | `src/partnerStudio/engine/categories.js` | Period care, intimate care, bladder and pelvic floor. At-home testing, telehealth and medicines are out of scope until a clinical rubric exists (p.3). |
| Scenario library | `src/partnerStudio/engine/scenarios.js` | Versioned full factorial: need × life stage × budget band × format × allergy, equal weights. 144 to 180 per category. Boundary (pregnant, breastfeeding, latex, sertraline, warfarin) and skipped-answer sets kept separate. |
| Engine adapter | `src/partnerStudio/engine/benchmark.js` | Calls the production code read-only: `buildUserProfile` → `buildEcosystemV2` (the real shelf builder, top 3), plus `getProductMatchDetailsForProduct` + `decideProduct` for every relevant SKU's trace. |
| Metrics | `src/partnerStudio/engine/metrics.js`, `rollup.js` | Slot share, scenario inclusion, eligible-to-placed (null when undefined), no-result rate, weighted share, rank, sensitivity by budget band, need × budget grid, loss funnel with one primary reason per lost scenario. "You vs the shelf" ranks every brand in the universe with peers anonymized ("Peer 1…"); the comparison line uses the median of peers with at least one placement. |
| Evidence and claims | `src/partnerStudio/engine/evidence.js` | Built from the product passport claim ledger (`src/data/passport`). Plan statuses, not a grade. Review coverage counts only human sign-off. |
| Rollups and action queue | `src/partnerStudio/engine/rollup.js` | Per brand; prioritized safety → evidence → documentation → differentiation (p.5). |
| Run | `npm run partner:benchmark` → `api/_partnerStudio/snapshot.js` | ~75 s. Runs inside `npm run build` only when `PARTNER_STUDIO_ENABLED=1` (the repo keeps a placeholder; don't commit a generated one). Replays the baseline and records whether every placement reproduced. Stores run id, scenario/category/adapter versions, catalog hash per category, git sha, K and weights. Refuses to write if any user or event identifier appears. |
| API | `api/partner-studio.js` | `GET ?brand=`. 404 unless `PARTNER_STUDIO_ENABLED=1`; confirmed `@aynahealth.co` admin only; brand must be a partner tenant; `no-store`. No consumer-data endpoint. |
| Dashboard | `/partner-studio.html` (`src/partnerStudio/`, a second Vite page) | Four modules as primary navigation plus overview, action queue, competitors, feed, reports. `noindex`. |
| Analytics | `src/partnerStudio/analytics.js` | B2B usage only (`partner_studio_*` events, screen and brand name properties), same consent and host rules as the site, no session recording. |

### Tests

`npm test` covers (with fictional seed data in `engine/fixture.js`; `PARTNER_STUDIO_REAL=1` renders every partner from a locally generated run): the plan's own p.8 and p.11 worked examples (21.4% / 32.1% slot share, 60% / 76.5% eligible-to-placed, loss reasons summing to 32), N/A for empty denominators, replay determinism, **commercial neutrality** (partner, affiliate and commission fields changed on every SKU → identical placements), **safety regression** (a price change never places a product the rules excluded or held), counterfactuals refusing every field but price, the admin gate (logged out, guest, normal user, unconfirmed admin, empty allowlist), the feature flag, tenant validation, the local-demo bypass being impossible on Vercel, and every screen rendering for every partner.

## Contract mapping (plan p.13)

| Proposed table | What exists today | Gap / migration need |
|---|---|---|
| `product_versions` | `product_catalog` (Supabase) + bundled `src/data/*.js`; passport `identity`, `pricing`, `composition` facts with `source`, `verified_at`, `status` | No version table. Today a run hashes the universe (`catalogVersion`). Needs append-only versions with `effective_at`. |
| `source_snapshots` | Passport `sources` (title, url, evidence_type), `verified_at`, `review_due`; `scripts/passport/check-links.mjs` (output file not committed) | No stored fetch, hash or permitted excerpt. Needs a fetch job and storage. |
| `claims / claim_versions` | Passport `evidence.claims` (wording, evidence_type, strength, product_specific, source_url) for 114 products | Claims are summaries, not exact excerpts with page location; no versions; themes are draft regex groupings. |
| `studies / evidence_links` | Passport sources and catalog `scientificCitations` / `doctorOpinionCitations` (DOI, PubMed, NCT links) | No outcome, design, directness or limitation fields per study. Reviewer UI needed. |
| `peer_sets` | Computed: same `category` within the benchmark universe, closest price | Needs stored, versioned peer sets and brand nominations. |
| `scenario_sets / scenarios` | `scenarios.js` (versioned in code) | No clinical review record yet (plan requires it). |
| `benchmark_runs` | `snapshot.run` | Needs a table and a scheduled job; snapshot is a build artifact today. |
| `scenario_results / traces` | Computed in memory; examples kept in the rollup | Full traces are not persisted. |
| `brand_rollups / actions` | `snapshot.brands[*]`; action status saved in the viewer's browser | Needs tenant-scoped storage, owners and history. |
| `watch_events / audit_log` | Passport `freshness`, `qa`, `recall` | No diffing between runs yet; the feed is a baseline. |

Proposed DDL with tenant RLS: [`phase1-schema.proposed.sql`](./phase1-schema.proposed.sql). It is not in `supabase/migrations` and must not be run without review.

## Engine facts confirmed in code

- Shelves come from `buildEcosystemV2`: 3 picks per need by default, a brand cap per shelf (`V2.maxPerBrand`), type variety, and a budget rule that drops products over 2× a chosen budget.
- Safety runs first (`evaluateSafety`); held products (`missingProductInfo`) and exclusions (`excludedBecause`) are recorded with the engine's own reason text.
- Partner status is never a personalized-matching input (`src/utils/partnerBrands.js`); the neutrality test now enforces it for Partner Studio.
- Results depend on today's date through fact freshness, so replays are compared within a run.

## Catalog source quality found while building

- Passport QA (Nov 2026): 86 products "needs correction", 34 "needs clinician review", 84 "in review", 137 "not reviewed". Every review so far is the AI-assisted research pass, so **human review coverage is 0%** and documented-support coverage is N/A by design.
- 114 of 341 bundled products have logged claims (138 claims); only 4 are product-specific studies.
- Many passports are past their review date (`freshness.state = stale`).
- The bundled catalog has 341 products; the plan's context cites 1,068 live products. Phase 1 uses the bundled catalog until a frozen live export exists.

## Not done here (by design)

No tenant accounts or brand logins, no stored corrections or confidential uploads, no scheduled refresh, no PDF report (print view only), no consumer data of any kind, no Supabase migration applied, no merge to `main`.

## Enabling the preview

Set `PARTNER_STUDIO_ENABLED=1` in Vercel (Preview environment first) and redeploy; the build then runs the benchmark (adds about 75 s). Admins sign in on the site, then open `/partner-studio.html`. Until the flag is on, the API answers 404 and the page says it isn't available. Locally: `PARTNER_STUDIO_ENABLED=1 PARTNER_STUDIO_LOCAL_DEMO=1 npm run dev`, then open `/partner-studio.html`.

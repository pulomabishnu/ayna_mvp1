# CLAUDE.md

## PRISM tracing (do not remove)

This project sends traces to PRISM. Env vars: `PRISMTRACE_API_KEY`,
`PRISMTRACE_PROJECT_ID`, `PRISMTRACE_HOST`.

Tracing is currently wired at: `api/_prismTrace.js`, `api/_llm.js` (wraps `callAnthropic` / `callOpenAI` / `callGemini`, so `callWithFallback` is covered too), `api/ask-ayna.js`, `api/product-chat.js`, `api/search-suggestions.js`, `api/discover-products.js`, `api/llm-recommendations.js`, `api/product-insights.js`, `api/sms-webhook.js`, `src/utils/conversationId.js` (`getAppSessionId`: one id per browser tab, sent as `conversationId` in the body by `ProfileChatbot.jsx`, `ProductModal.jsx`, `fetchSearchSuggestions.js`, `fetchLlmRecommendations.js`, `fetchProductInsights.js` so one visit is one PRISM session). Each route passes `trace.messages` (what the user said/did) and `trace.formatOutput` (what the user sees) so PRISM shows the conversation, not the raw prompt and JSON — do the same for any new model call, `.env.example`, `api/_prismTrace.test.js`

**Standing rule.** Whenever you add or change an agent, chain, graph, tool,
retriever, or any entry point that calls a model, wire it to PRISM before you
finish. Unwired code is invisible in the dashboard. If you are unsure whether
something is covered, assume it is not and wire it.

## Catalog content accuracy (health claims)

Product and startup entries (`src/data/*.js`, `supabase/seed/*.sql`) are
health information people act on. An outside reviewer found false FDA claims
in the catalog (2026-10-02: Joylux, Embr, ThermaCare, and Inito were all
labeled "FDA-cleared" when they are not). Rules for adding or editing any entry:

- **Read the source itself, not a search snippet.** For PubMed papers, fetch
  the abstract through NCBI E-utilities (`efetch.fcgi?db=pubmed&id=…&rettype=abstract`);
  PubMed pages block automated fetches. If you can't read a source, don't cite it.
- **Regulatory status comes from the FDA, never from the brand or from memory.**
  Check openFDA (`api.fda.gov/device/510k.json`, `registrationlisting.json`).
  "FDA-registered" or "FDA-listed", "Class I exempt", "general wellness",
  "510(k)-cleared" (give the K-number), and "approved" are different things;
  never round one up to another. If the brand claims a clearance you can't
  find, say "per the brand" and say it wasn't found.
- **State the study's size and design when they limit the finding**: animal
  or cell study, open-label, no control group, n=10, a combination product, a
  leave-on product used to support a rinse-off one. Don't call a result
  significant if the paper doesn't, and don't call an open-label study "controlled".
- **Every link must load.** Don't construct URLs; check each with a request.
- **No unsourced claims.** If a sentence has no source you have read, cut it.

## Hidden products (unpublished, not deleted)

A catalog entry with `hidden: true` stays in `src/data/*.js` and in
`product_catalog` (as `is_active = false`), but no page, search, Trending list,
sitemap, or chatbot shows it. `ALL_PRODUCTS` excludes hidden entries;
`CATALOG_PRODUCTS` keeps them so the export never drops their rows. Never
delete a hidden entry, its images, or its seed files. (`TEMPORARILY_HIDDEN_IDS`
in `src/data/products.js` is a separate list for discontinued products.)

**Currently hidden:** Liv Labs, both Pippa entries in `src/data/brands.js`
(`p-livlabs-pippa-*`), hidden 2026-10-17 at Eliz's request. (VPod was hidden
2026-10-17 to fix its descriptions and made live again 2026-10-29.)

**"Make it live"** (for VPod, or any hidden brand):
1. Make the requested text edits, following the health-claims rules above.
2. Delete the `hidden: true,` line from each of the brand's entries (VPod has four).
3. `npm run catalog:check`, then `npm run catalog:sql -- VPod`. This writes
   `supabase/seed/<date>_vpod_live.sql` with the current text and
   `is_active = true`. Confirm its header lists all four ids as Live.
4. Run the tests and `npm run build`. The build regenerates `public/sitemap.xml`
   with the brand's pages; commit that too.
5. Commit and push to `main`. Vercel deploys `main` to production automatically.
6. A person pastes the generated `_live.sql` file into the Supabase SQL Editor and
   runs it. The repo has no database credentials, so Claude can't do this step.
   Changes show up within about an hour (5-minute server cache, 1-hour browser cache).

To hide a brand: add `hidden: true,` after each entry's `id`, then do steps 3–6 (the file ends in `_hidden.sql`).

## Team-written product copy is locked (2026-10-17)

The founders and team (Eliz, Puloma, Ameera) write the product information:
names, prices, descriptions, clinical and community notes, safety notes,
images. AI sessions, research merges and scripts changed some of it without
asking, and Eliz had to redo work. Rules:

- **Never edit a team-written field** in `src/data/*.js` (or anything that
  overrides it at runtime, e.g. `catalogCorrections.js`, research layers)
  unless a founder asked for that exact change in this session.
- New research, evidence grades, safety findings and summaries go in their
  own files (`src/data/matching/*`, passport files) and are shown **next to**
  the team's copy, labelled as ayna's check. They never replace it.
- If you find something in team copy that looks wrong (an unverified FDA
  claim, a stale price), **report it to the founders** with the source.
  Do not fix it yourself.
- `src/data/teamCopy.lock.test.js` fails when any locked field changes. Only
  after a named founder approves: `node scripts/team-copy-lock.mjs --approve
  <id>.<field> --by "<who>" --note "<why>"`. New products:
  `node scripts/team-copy-lock.mjs --add-new --by "<who>"`. Never run these
  to make a failing test pass on your own.

## Analytics (PostHog) conventions (2026-10-20)

- Every event carries `platform` (`web` / `ios_app` / `android_app`), set in `src/main.jsx`.
  App events also carry `source: 'app'` (`src/mobile/utils/appAnalytics.js`).
- Native builds fall back to the public `phc_` key (`src/utils/analyticsPlatform.js`), so a
  TestFlight build can't ship with analytics off. Build with `npm run build:ios`.
- Never send a property named `message` (before_send strips it): use `errorMessage`,
  passed through `redactErrorMessage` (`src/utils/errorAnalytics.js`).
- `recommendation_viewed` = one event per recommended product shown
  (`productId`, `category`, `position`, `surface`) via `src/utils/recommendationAnalytics.js`.
- Catalog brand / concerns for analytics: `npm run catalog:sync` writes
  `supabase/seed/<date>_catalog_sync.sql` (insert-missing only, brand fills blanks only,
  concerns from the research need map). A person runs it in the Supabase SQL Editor.

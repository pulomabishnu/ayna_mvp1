# Ayna

Ayna is a women's health / menstrual & reproductive health product-discovery app. Users take a health intake quiz, get a personalized "ecosystem" of recommended products (pads, tampons, cups, supplements, telehealth, trackers, etc.), browse a curated + AI-generated catalog, read AI-generated clinical/scientific/community insights per product, chat with an AI about a specific product, prep for doctor visits, and track FDA recalls. There's also an SMS interface — users can text a phone number to get AI-backed health Q&A. Production: `ayna.health`.

## Tech stack

- **Frontend**: React 19 + Vite 7, plain JS/JSX (no TypeScript, no Next.js). Routing is hand-rolled via `window.history.pushState`/`popstate` (see `src/App.jsx`), not react-router.
- **Backend**: Vercel serverless functions under `/api`, plain Node handlers (`export default async function handler(req, res)`).
- **Database/Auth**: Supabase (Postgres + RLS + Auth).
- **SMS**: Twilio (send + inbound webhook).
- **LLMs**: Anthropic / OpenAI / Gemini, called via raw HTTP fetch in `api/_llm.js` (no SDK dependency), with configurable provider fallback order.
- **Rate limiting**: Upstash Redis (durable, serverless-safe — see gotchas below).
- **Analytics**: PostHog.
- **Styling**: plain CSS, no framework.
- **Tests**: Vitest.

## Project structure

```
api/            Vercel serverless functions (see "Deployment" — capped at 12 files)
  _*.js         Shared/internal helpers — NOT deployed as functions (underscore prefix)
  *.test.js     Unit tests, co-located with the route they test
  *.integration.test.js   Full-handler tests (mocked Supabase + fetch, everything else real)
src/
  App.jsx       Root component + client-side router
  components/   ~35 React components (Quiz, Discovery, MyEcosystem, ProductModal, etc.)
  data/         Curated/static content, incl. a large bundled product catalog fallback
  hooks/        useScrollPosition, useSpeechToText
  utils/        Supabase client, per-entity stores, fetch wrappers, recommendation engine, RAG retrieval
supabase/       Hand-rolled SQL schema (idempotent, re-runnable) + drift-detection tooling
scripts/        diff-schema.mjs, export-catalog.mjs, migrate-premium-flag.mjs, test-migrations.sh
public/         Static assets
```

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values you need — see below
npm run dev
```

You don't need every env var to run locally — features degrade gracefully (e.g. no `TWILIO_*` just means the SMS feature won't work), but the app **requires at least one LLM provider key** for AI insights/recommendations, and Supabase vars for auth/data persistence.

### Environment variables

See `.env.example` for the full annotated list. Summary by area:

| Area | Vars |
|---|---|
| Supabase (client) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Supabase (server) | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| LLM (need at least one) | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` (+ `*_MODEL` overrides, `AI_INSIGHTS_PROVIDER_ORDER`, `AI_RECOMMENDATIONS_PROVIDER_ORDER`) |
| Twilio (SMS) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `VITE_AYNA_SMS_NUMBER`, `SMS_ALLOWED_COUNTRY_CODES` |
| PostHog | `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST`, `VITE_POSTHOG_INTERNAL_IDS` |
| Rate limiting / security | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `OTP_PEPPER`, `ALLOWED_ORIGINS` |
| Health data APIs (optional, keyless by default) | `NCBI_API_KEY`, `OPENFDA_API_KEY` |
| Airtable (startup sync script only, not needed to run the app) | `AIRTABLE_API_KEY`, `AIRTABLE_BASE_ID` |

### Scripts

```bash
npm run dev              # start Vite dev server
npm run build             # production build
npm run preview           # preview a production build locally
npm run lint              # ESLint
npm run catalog:export    # regenerate the product catalog seed/export
npm run catalog:check     # verify catalog export is up to date (CI-friendly)
npx vitest                # run tests (no "test" script defined yet — run vitest directly)
```

### Database

Schema lives as flat, idempotent SQL files in `/supabase/` — see `supabase/README.md` for the authoritative apply order and setup instructions. `scripts/test-migrations.sh` spins up a throwaway local Postgres cluster and runs the full migration + verification + behavior-test suite in ~10s, no live Supabase project needed. Run it before touching any schema file.

## Deployment (Vercel)

The project is on Vercel's **Hobby plan, capped at 12 serverless functions**, and `/api` currently has exactly 12 deployable routes. Vercel treats every non-underscore-prefixed `.js` file directly under `/api` as its own function — this is why shared helpers are named `_helper.js` (not deployed) and why `.vercelignore` excludes `api/*.test.js`.

**If you add a new file to `/api`, the deploy will break the function cap.** Prefer adding logic to an existing route or a `_`-prefixed shared module instead of creating a new top-level `api/*.js` file, unless you're intentionally upgrading the Vercel plan.

Pushing to a branch auto-deploys a Vercel preview; see `.cursor/rules/deploy-after-changes.mdc`.

## Gotchas for new developers

- **Premium entitlement is read from `app_metadata`, never `user_metadata`** — the latter is client-writable via `supabase.auth.updateUser()`, which the app already calls elsewhere. See the comment header in `api/_entitlement.js`.
- **`pending_phone_verifications` has RLS enabled with zero client policies** — it's accessed only via the service-role key, on purpose (past account-takeover fix). Don't add a client `select` policy back.
- **`user_ecosystems` needs its composite `(user_id, product_id)` primary key.** If it's ever recreated by hand (e.g. via the Supabase dashboard), missing this PK makes every ecosystem upsert fail silently while the UI reports success. Run `scripts/diff-schema.mjs` to check for drift before trusting a live schema.
- **Rate limiting fails closed, not open.** If `UPSTASH_REDIS_REST_URL`/`_TOKEN` are unset, SMS-sending endpoints return 429 on every request rather than allowing unlimited sends (toll-fraud risk otherwise).
- **`api/fda-recall.js` returns three states**: `ok`, `partial`, `failed` — never collapse this into a binary "has recalls / no recalls" in the UI; "we don't know" must stay distinguishable from "no recall" on a health-safety feature.
- **No payment processor is integrated.** Premium status is currently set manually via `app_metadata.is_premium`; "Stripe" in the codebase is only boilerplate legal text.
- Root-level `check_page.cjs`, `update_colors.cjs`, `update_images.cjs` are one-off Puppeteer automation scripts, not part of the app or build pipeline.
- There's no `test` npm script yet — run `npx vitest` directly.

## Further reading

- `supabase/README.md` — schema apply order, RPC contracts, pg_cron jobs
- `DEPLOY.md` — deploy runbook with known operational hazards

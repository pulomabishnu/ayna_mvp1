# Database schema

Every file here is idempotent (`create table if not exists`, `drop policy if exists`,
`create or replace function`), so the whole set is safe to re-run against the live
database.

> **Validated against a real Postgres 17.** `./scripts/test-migrations.sh` starts a
> throwaway local cluster, applies all 12 files plus the seed, and runs both
> `_verify.sql` (structure) and `_behaviour_test.sql` (RLS isolation, the OTP
> takeover fix, quota atomicity, build idempotence, and the ecosystem-clear
> data-loss fix). Free, self-contained, no Supabase project required.
>
> Run it before applying anywhere, and after any schema change.

## Before applying to a live database: diff it

`create table if not exists` **skips** a table that already exists. Four of these
tables were created by hand in the dashboard and hold real user data, so a
migration run can report complete success while a live table still lacks a
column, a composite key, or an RLS policy the app depends on.

```sh
# 1. On the live database (READ-ONLY — no writes, no DDL, no row data returned)
psql "$DB_URL" -At -f supabase/_introspect.sql > live-schema.json
#    ...or paste supabase/_introspect.sql into the Supabase SQL Editor and copy
#    the single result cell into live-schema.json

# 2. Locally
node scripts/diff-schema.mjs live-schema.json
```

It compares against `supabase/expected-schema.json` — the same introspection
query run against a clean local apply of every migration — and ranks findings by
what actually breaks. Exits non-zero on anything BLOCKING.

Regenerate the reference after any schema change:
`./scripts/test-migrations.sh` then re-run the introspection locally.

## Validate locally first

```sh
brew install postgresql@17      # once
./scripts/test-migrations.sh    # ~10s, tears itself down
```

This caught a real defect: the migrations originally had **no explicit `GRANT`s**
and silently relied on Supabase's default-privilege configuration. On a project
where those defaults have been altered, every table would have been
permission-denied despite correct RLS. Grants are now explicit per table.

## Product catalog

`product_catalog.sql` + `seed/product_catalog.sql` move the ~5,500-line hardcoded
catalog out of the JS bundle and into the database. Regenerate the seed from
`src/data/` with:

```sh
npm run catalog:check    # asserts the export is lossless and ids are unique
npm run catalog:export   # writes supabase/seed/product_catalog.{json,sql}
```

`--check` refuses to emit if any product fails to round-trip or two products
share an id. It currently reports **155 products, 0 duplicates, 0 lossy**.

The client keeps the bundled catalog as a fallback until the table is seeded and
verified — see the header of `src/utils/productCatalog.js` for the steps that
actually shrink the bundle. **The bundle does not shrink until you do that.**

> Curated safety content (`safety`, `doctor_opinion`, `clinician_attribution`)
> is human-verified and must never be overwritten with generated text. Ayna
> already generates products for everything *outside* this catalog
> (`api/llm-recommendations`, `api/search-suggestions`); `source` keeps the two
> provenances distinguishable so the UI can never show a generated row with
> verified-clinician affordances.

## Apply order

Order matters only where a table must exist before its policies/functions.

```sh
for f in \
  health_intakes.sql \
  phone_numbers.sql \
  pending_phone_verifications.sql \
  sms_conversations.sql \
  user_ecosystems.sql \
  user_reviews.sql \
  user_learning_memory.sql \
  user_ai_usage.sql \
  user_ecosystem_builds.sql \
  user_health_profiles.sql \
  product_catalog.sql
do
  echo "── $f"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "supabase/$f"
done

# Seed the catalog (generated — regenerate with `npm run catalog:export`)
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/product_catalog.sql

psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/_verify.sql
```

`_verify.sql` checks that every table, function, composite key and RLS policy the
code depends on exists, **and** that the quota functions return the row shape the
JavaScript destructures. It names the user-visible consequence of each failure.

## What was missing from version control

`user_ecosystems`, `user_reviews`, `user_learning_memory`, `user_ai_usage` and the
`increment_ai_usage` RPC existed only in the hosted project — the database could
not be rebuilt from this repo, and a `supabase db reset` would have permanently
destroyed the ecosystem, reviews and learning memory of every user.

## Failure modes this schema prevents

| Missing piece | Symptom |
|---|---|
| `claim_otp_attempt()` | `/api/phone-verify-confirm` returns 500 on **every** attempt |
| `consume_ai_usage()` | Chat/insights quotas fail **open** — unmetered LLM spend, logged but not blocked |
| `claim_ecosystem_build()` | Ecosystem build quota fails open |
| `release_ecosystem_build()` | A failed build permanently burns the user's one lifetime build |
| Composite key on `user_ecosystems` | Every product write raises `42P10`; the UI shows success and the data is lost |
| `user_ecosystems` UPDATE/DELETE policy | Clearing the ecosystem is a silent 0-row no-op — stale products reappear |
| A SELECT policy on `pending_phone_verifications` | **Account takeover.** See below. |

## Two deliberate security decisions

**`pending_phone_verifications` has RLS enabled and no policies.** That denies all
client access; the service-role key bypasses RLS so the API still works. It
previously had a `select own` policy, which was an account-takeover path: an
attacker starts verification for the *victim's* number, so the row is created
under the *attacker's* `user_id` and RLS hands them their own row — including
`code_hash`. That hash was an unsalted `sha256(user_id:code)` over a 10⁶ keyspace
with a `user_id` they already know; recovery was measured at **1.85 seconds**.
It is now an HMAC with a server-side pepper (`OTP_PEPPER`), so a leaked row is not
enough.

**Quota functions are `security definer` and granted only to `service_role`.**
If `authenticated` could execute `refund_ai_usage()` or
`release_ecosystem_build()`, a user could mint themselves unlimited quota.

## Required environment variables

| Variable | Consequence if unset |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | All authenticated API routes return `server_misconfigured` |
| `OTP_PEPPER` | Falls back to the service-role key with a warning. Set a dedicated random value so it can be rotated independently. |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | **SMS sending fails closed.** Deliberate: an in-process counter cannot rate-limit a serverless function, and the exposure is toll fraud. |
| `ALLOWED_ORIGINS` | Cross-origin calls to `/api/product-image` and `/api/search-suggestions` are refused (same-origin is unaffected). |

## Scheduled jobs

Neither is required for correctness, but both bound data that otherwise grows
without limit:

```sql
select cron.schedule('purge-otp', '*/15 * * * *',
  $$select public.purge_expired_phone_verifications()$$);

select cron.schedule('purge-sms', '0 3 * * *',
  $$select public.purge_old_sms_conversations(180)$$);
```

Abandoned verifications leave a phone number plus a code hash behind
indefinitely, and `sms_conversations` stores the full plaintext of every health
question and answer while only the last 10 are ever read back.

# Deploy runbook — backend hardening branch

Order matters here. Two changes break things if they land out of sequence, and
both failures look like unrelated outages.

---

## Known issue (as of 2026-08-05): AI-insights rate limiter is running fail-open

`api/_rateLimitProductInsights.js` (used by `/api/product-insights` and
`/api/search-suggestions`) is currently `failClosed: false` — best-effort
per-isolate memory limiting, not the durable Upstash-backed cap.

This is temporary. A real Upstash Redis database was provisioned via Vercel's
marketplace, but `UPSTASH_REDIS_REST_URL`/`_TOKEN` ended up unreliable in
Production and Preview specifically (Development is fine) after being copied
from the integration's native `KV_REST_API_URL`/`_TOKEN` vars via the Vercel
CLI — `vercel env add --force` reported success but the values still read back
empty on a fresh pull, an inconsistency that wasn't resolved via CLI.

**To fix**: in the Vercel dashboard, delete the `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN` rows for Production and Preview under Project
Settings → Environment Variables, then re-add them by pasting directly from
the Upstash integration's own dashboard page (Storage → the connected Upstash
resource). Once confirmed working in both environments, flip `failClosed` back
to `true` in `api/_rateLimitProductInsights.js` and redeploy.

---

## The two ordering hazards

**1. The OTP policy drop must land WITH the new code, never before it.**

`pending_phone_verifications.sql` drops the `select own` RLS policy (that policy
is the account-takeover path). The **currently deployed** code reads that table
with the user's JWT and depends on it. Apply the migration while the old code is
live and phone verification breaks immediately.

The new code reads the table with the service-role key, so it does not care.
Therefore: **apply the schema and deploy the code in the same window**, schema
first, code within a few minutes.

**2. `is_premium` must be backfilled BEFORE the deploy.**

The entitlement check moved from `user_metadata` (client-writable — any user
could grant themselves unlimited AI spend from the browser console) to
`app_metadata`. Every currently-paying user reads as free until backfilled.

---

## Pre-flight (do these first, any time)

```sh
# 1. Prove the schema applies and behaves. ~10s, fully local, changes nothing.
./scripts/test-migrations.sh

# 2. Diff the live database (READ-ONLY, safe on production)
psql "$DB_URL" -At -f supabase/_introspect.sql > live-schema.json
node scripts/diff-schema.mjs live-schema.json
```

If the diff reports BLOCKING findings it writes `schema-remediation.sql`.
**Read it.** Those are writes against real user data. It is generated from the
diff, and the generator has been round-trip tested (drifted schema → remediation
→ clean diff, with rows preserved), but review it anyway.

The single most likely finding: `user_ecosystems` missing a unique index over
`(user_id, product_id)`. The dashboard's table editor adds a surrogate `id` PK
by default, and without that unique index **every product write is already
failing with 42P10 today** while the UI reports success. If you see it, that is
not a new problem — it explains existing reports of lost ecosystems.

---

## Deploy

**Step 1 — back up.** Supabase Dashboard → Database → Backups. Non-negotiable:
the next step writes to tables holding real health data.

**Step 2 — backfill premium** (before anything else, so nobody is downgraded):
```sh
export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
node scripts/migrate-premium-flag.mjs           # dry run first
node scripts/migrate-premium-flag.mjs --apply
```

**Step 3 — set the environment variables** in Vercel *before* the deploy, so the
new code finds them on first boot:

| Variable | If missing |
|---|---|
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | **Phone verification returns 429 on every send.** SMS rate limiting fails closed by design — an in-process counter cannot limit a serverless function, and the exposure is toll fraud. |
| `OTP_PEPPER` | Falls back to the service-role key with a warning. Set a dedicated random value: `openssl rand -hex 32` |
| `ALLOWED_ORIGINS` | Cross-origin calls to `/api/product-chat`, `/api/product-image`, `/api/product-insights`, and `/api/search-suggestions` are refused. Same-origin is unaffected, so this is only needed if something calls the API from another domain. |
| `REQUIRE_AUTH_FOR_SEARCH_SUGGESTIONS` | Optional. Set to `1` to require sign-in for AI search. Leave unset to keep anonymous Discovery search — the tradeoff is that an IP-rotating script can spend Anthropic tokens. |
| `CRON_SECRET` | The recall-monitoring sweep (`/api/fda-recall?sweep=1`, scheduled daily via `vercel.json`) 401s on every invocation — Vercel Cron's own request is rejected along with everyone else's, so the sweep silently never runs. |
| `RECALL_SWEEP_ENABLED` | Defaults to unset, which is **dry-run mode**: the sweep still checks every tracked product's recall status and logs what it would do, but sends no SMS and writes no state. Set to `1` only once you've confirmed the dry-run logs look right — flipping it on is what makes this send real text messages to real users. |

**Step 4 — apply the schema** (remediation first if the diff produced one):
```sh
psql "$DB_URL" -1 -v ON_ERROR_STOP=1 -f schema-remediation.sql   # only if generated
for f in health_intakes phone_numbers pending_phone_verifications sms_conversations \
         user_ecosystems user_reviews user_learning_memory user_ai_usage \
         user_ecosystem_builds user_health_profiles product_catalog \
         product_recall_state recall_notifications; do
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "supabase/$f.sql"
done
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/seed/product_catalog.sql
psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/_verify.sql
```

`_verify.sql` must print `Schema objects: OK` and `Function contracts: OK`.
If it raises, **stop and fix before deploying** — it names the consequence.

**Step 5 — deploy the code.** Push the branch; Vercel builds. Do this promptly
after step 4 (see hazard 1).

---

## Smoke test, in this order

1. **Phone verification** — request a code. A 429 means Upstash is not
   configured; a 500 means `claim_otp_attempt` did not apply.
2. **Ecosystem build** — complete an intake. Should finish in well under a
   minute now, not time out.
3. **Add a product, reload.** It must still be there — that is the 42P10 path.
4. **Open a product** → the FDA panel shows green, amber ("couldn't check"), or
   red. Amber is correct behaviour when OpenFDA is unreachable, not a bug.
5. **A premium user** still has unlimited access.

---

## Rollback

Reverting the code is safe on its own **except** for phone verification: the new
schema has no client-readable policy on `pending_phone_verifications`, which the
old code needs. If you must roll the code back, either re-add that policy
temporarily (accepting the takeover risk until you roll forward) or accept that
phone verification is down while reverted.

Everything else is backward compatible — the new tables and columns are additive
and the old code simply ignores them.

---

## After the deploy

Optional, both bound data that otherwise grows without limit:

```sql
select cron.schedule('purge-otp', '*/15 * * * *',
  $$select public.purge_expired_phone_verifications()$$);
select cron.schedule('purge-sms', '0 3 * * *',
  $$select public.purge_old_sms_conversations(180)$$);
```

And once the catalog is confirmed serving from `/api/products`, follow the steps
in the header of `src/utils/productCatalog.js` to drop the bundled fallback —
roughly a 40% reduction in the JS bundle.

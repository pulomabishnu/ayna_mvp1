-- FIX_security_reliability_2026-10-21.sql
--
-- NOT auto-run. A founder pastes this into the Supabase SQL Editor (project
-- mvvwgyspcohqxxcqkfrv) AFTER reading it. Idempotent: running it twice is
-- safe. Run supabase/AUDIT_rls_check_READ_ONLY.sql first and keep its output.
--
-- Only problems that are provable from the repo are fixed here. Each block
-- says what it changes and why. Nothing here deletes user data.

begin;

-- ── 1. One SMS reminder per person per day, enforced by the database ─────────
-- api/sms-reminders.js checked "already texted today?" and then inserted, two
-- round trips. Vercel can deliver a cron twice; two overlapping runs could
-- both pass the check and text her twice. The code now inserts a claim row
-- with detail.day first (api/_smsStore.js claimReminderDay) and this index
-- makes the second claim fail with 23505, which the code treats as "skip".
--
-- If an older double-send already left two reminder rows with the same day,
-- the index would fail to build; this keeps the newest and only touches
-- reminder rows that carry a day (older rows have no day and are ignored).
delete from public.sms_events e
using public.sms_events newer
where e.kind = 'reminder' and newer.kind = 'reminder'
  and e.user_id = newer.user_id
  and e.detail ? 'day' and newer.detail ? 'day'
  and e.detail->>'day' = newer.detail->>'day'
  and (e.created_at, e.id) < (newer.created_at, newer.id);

create unique index if not exists sms_events_one_reminder_per_day
  on public.sms_events (user_id, (detail->>'day'))
  where kind = 'reminder' and detail ? 'day';

-- ── 2. Suggestions only through /api/suggestions ─────────────────────────────
-- The table allowed INSERT from anon with `with check (true)`, so anyone with
-- the public key could write unlimited rows straight to the REST API,
-- skipping the API's rate limit, text checks and length rules. No client code
-- writes to this table (api/suggestions.js uses the service role), so the
-- direct grant is removed. The API keeps working unchanged.
revoke insert on public.suggestions from anon, authenticated;
drop policy if exists "suggestions_insert_anyone" on public.suggestions;

-- ── 3. invite_stats stays server-only ────────────────────────────────────────
-- The view joins auth.users (emails). shared_answers_2026-10-20.sql already
-- revokes it; re-asserted here because re-running that file's
-- `create or replace view` can re-apply Supabase's default grants before the
-- revoke line runs if the file is run partially.
revoke all on public.invite_stats from public, anon, authenticated;
grant select on public.invite_stats to service_role;

commit;

-- After running: re-run query 3 of AUDIT_rls_check_READ_ONLY.sql;
-- suggestions_insert_anyone should be gone.

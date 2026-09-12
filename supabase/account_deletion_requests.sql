-- Real in-app "Delete my account" action (Settings > Privacy & data / Account
-- info), replacing the previous email-only flow (a mailto: link with no
-- record on our side unless the email was actually sent and read, and no
-- confirmation for the person beyond "trust that this worked").
--
-- This table only records that a deletion was REQUESTED, when, by whom, and
-- its processing status — api/request-account-deletion.js does not itself
-- delete anything else. The actual cross-table purge stays a deliberate,
-- reviewed operation (same "we process within a week" cadence already
-- promised in the UI), because doing it correctly means touching every real
-- per-user table in this schema:
--   health_intakes, notification_preferences, pending_phone_verifications,
--   phone_numbers, recall_notifications, sms_conversations, user_ai_usage,
--   user_ecosystem_builds, user_ecosystems, user_health_profiles,
--   user_learning_memory, user_reviews, account_deletion_requests itself,
--   and finally the auth.users row (via the admin API, which cascades
--   anything with `on delete cascade` back to auth.users — verify each
--   table above actually has that before assuming this list is complete).
-- An automated cascade across all of that is real, separate work — this
-- table exists so "request received" no longer depends on an email
-- surviving mail delivery, not to silently promise more than exists yet.

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Snapshotted at request time — the row must still make sense to whoever
  -- processes it even after the account itself is gone.
  email text not null,
  requested_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  processed_at timestamptz,
  notes text
);

alter table public.account_deletion_requests enable row level security;

grant select, insert on public.account_deletion_requests to authenticated;
grant all on public.account_deletion_requests to service_role;

-- A user can see and file their own request, but never edit or delete it —
-- withdrawing a deletion request (if ever supported) is a deliberate,
-- reviewed action from the same real backend that processes it, not a
-- self-serve UPDATE.
drop policy if exists "account_deletion_requests_select_own" on public.account_deletion_requests;
create policy "account_deletion_requests_select_own"
on public.account_deletion_requests
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "account_deletion_requests_insert_own" on public.account_deletion_requests;
create policy "account_deletion_requests_insert_own"
on public.account_deletion_requests
for insert
to authenticated
with check (auth.uid() = user_id);

create index if not exists account_deletion_requests_status_idx
on public.account_deletion_requests (status)
where status = 'pending';

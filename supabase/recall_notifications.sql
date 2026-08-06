-- Audit log + idempotency guard for recall-alert SMS sends (api/fda-recall.js
-- sweep mode). Health-safety messaging warrants a record of what was sent to
-- whom and when, and the unique index below guarantees a user is never texted
-- twice for the SAME recall on the SAME product, even if the sweep runs
-- concurrently or is retried.
--
-- Service-role only: RLS enabled with NO client policies — same reasoning as
-- product_recall_state.sql. There is no user-facing "notification history" UI
-- today; this exists purely as the sweep's own bookkeeping.
create table if not exists public.recall_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  product_name text,
  recall_signature text not null,
  channel text not null default 'sms',
  status text not null default 'sent', -- 'sent' | 'failed' | 'skipped_no_phone' | 'skipped_opted_out'
  sent_at timestamptz not null default now()
);

create index if not exists recall_notifications_user_id_idx
on public.recall_notifications (user_id);

-- Idempotency: at most one successful send per (user, product, recall set).
create unique index if not exists recall_notifications_dedupe_idx
on public.recall_notifications (user_id, product_id, recall_signature)
where status = 'sent';

alter table public.recall_notifications enable row level security;

grant all on public.recall_notifications to service_role;
-- No grant to `authenticated` — this table has no legitimate client use.

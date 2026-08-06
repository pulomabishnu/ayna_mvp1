-- Last-known FDA recall state per product, so the recall-monitoring sweep
-- (api/fda-recall.js, cron-triggered) can detect a NEWLY active recall instead
-- of re-notifying every user on every run for a recall that hasn't changed.
--
-- Service-role only: RLS enabled with NO client policies, since this is
-- exclusively read/written by the cron sweep using the service-role key —
-- there is no legitimate reason any user's session should see or modify it.
create table if not exists public.product_recall_state (
  product_id text primary key,
  product_name text,
  -- Sorted, comma-joined recall numbers for the CURRENTLY active recall set.
  -- Empty string means "checked, no active recalls" — distinct from NULL,
  -- which means "never checked yet".
  recall_signature text,
  last_checked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_recall_state enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant all on public.product_recall_state to service_role;
-- No grant to `authenticated` — this table has no legitimate client use.

-- Partner Studio benchmark run history (build plan stage 1).
--
-- One row per benchmark run: the versions that decide comparability and a small
-- summary of slot counts per brand per category. Synthetic results over public
-- catalog facts only; no user data. Written by scripts/partner-studio-benchmark.mjs
-- at build time with the service role, read back by the same script so the next
-- snapshot carries the history. No client ever reads this table directly.
--
-- Safe to re-run: create if not exists, RLS on, no policies (service role only).

create table if not exists public.partner_studio_runs (
  run_id text primary key,
  created_at timestamptz not null default now(),
  scenario_set_version text not null,
  category_set_version text not null,
  adapter_version text not null,
  engine text,
  git_sha text,
  catalog_versions jsonb not null default '{}'::jsonb,
  summary jsonb not null
);

create index if not exists partner_studio_runs_created_at_idx on public.partner_studio_runs (created_at desc);

alter table public.partner_studio_runs enable row level security;

revoke all on public.partner_studio_runs from anon, authenticated;
grant all on public.partner_studio_runs to service_role;

-- Early-stage startups sourced from the "Early Stage Startups" Airtable base
-- (appBcnc688sKktGYO / table "Startups"), synced by
-- scripts/sync-startups-from-airtable.mjs.
--
-- Mirrors the product_catalog.sql conventions: RLS-gated public read, writes
-- are service-role only (the sync script, never a browser), soft-delete via
-- is_active so an Airtable-side archive doesn't orphan anything referencing
-- a row, and an `extra` catch-all for anything without a dedicated column.
create table if not exists public.early_stage_startups (
  id text primary key,
  -- Airtable's own record id, so the sync script can upsert idempotently
  -- without re-deriving (and possibly colliding on) a slug every run.
  airtable_record_id text unique not null,

  name text not null,
  tagline text,
  description text,
  category text not null,
  -- Airtable's Stage single-select: Waitlist | Pre-Seed | Seed.
  stage text,
  product_released boolean not null default false,
  url text,
  waitlist_url text,
  image text,

  -- Matching metadata — same shape as product_catalog so
  -- getPersonalizedStartups() scores these identically to the hardcoded
  -- STARTUPS array. `tags` comes from Airtable's Symptom Tags (matching
  -- vocabulary); `badges` comes from Airtable's own Tags field (display
  -- only — Women-Owned, Third-Party Tested, etc. — never used for scoring).
  tags jsonb not null default '[]'::jsonb,
  health_functions jsonb not null default '[]'::jsonb,
  badges jsonb not null default '[]'::jsonb,
  featured boolean not null default false,

  -- Founder names, founded year, women-founded flag — real Airtable fields
  -- with no dedicated column of their own.
  extra jsonb not null default '{}'::jsonb,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists early_stage_startups_category_idx on public.early_stage_startups (category) where is_active;
create index if not exists early_stage_startups_tags_idx on public.early_stage_startups using gin (tags);

alter table public.early_stage_startups enable row level security;

-- Public startup info, same access shape as product_catalog: readable
-- signed-out, writes are service-role (the sync script) only.
grant select on public.early_stage_startups to anon, authenticated;
grant all on public.early_stage_startups to service_role;

drop policy if exists "early_stage_startups_read_all" on public.early_stage_startups;
create policy "early_stage_startups_read_all"
on public.early_stage_startups for select
to anon, authenticated
using (is_active);

create or replace function public.touch_early_stage_startups_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists early_stage_startups_touch on public.early_stage_startups;
create trigger early_stage_startups_touch
before update on public.early_stage_startups
for each row execute function public.touch_early_stage_startups_updated_at();

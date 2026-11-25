-- ayna Partner Studio, Phase 1: PROPOSED schema (plan p.13). NOT APPLIED.
-- Review with privacy and engineering before moving anything into supabase/migrations.
-- A dedicated schema keeps B2B analytics apart from consumer health data. Nothing here
-- references auth.users health tables, intake answers, events or wearables.

create schema if not exists partner_studio;

create table partner_studio.tenants (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null unique,
  created_at timestamptz not null default now()
);

create table partner_studio.tenant_members (
  tenant_id uuid not null references partner_studio.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member', 'viewer')),
  primary key (tenant_id, user_id)
);

create table partner_studio.product_versions (
  sku_id text not null,
  version text not null,
  brand_name text not null,
  category_id text not null,
  market text not null default 'US',
  attributes jsonb not null default '{}'::jsonb, -- unknown is a first-class value, never false
  reviewer_status text not null default 'not_reviewed',
  effective_at timestamptz not null default now(),
  primary key (sku_id, version)
);

create table partner_studio.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  fetched_at timestamptz not null,
  content_hash text not null,
  permitted_excerpt text,
  source_type text not null,
  access_rights text not null default 'public'
);

create table partner_studio.claims (
  id uuid primary key default gen_random_uuid(),
  sku_id text not null,
  sku_version text not null,
  wording text not null,
  theme text,
  classification text,
  review_status text not null default 'pending',
  source_id uuid references partner_studio.source_snapshots(id)
);

create table partner_studio.evidence_links (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references partner_studio.claims(id) on delete cascade,
  study_ref text, -- DOI, PMID or NCT
  outcome text,
  design text,
  directness text check (directness in ('exact_product', 'bridged_formulation', 'ingredient_only', 'indirect', 'unknown')),
  limitations text,
  reviewer text,
  reviewed_at timestamptz
);

create table partner_studio.benchmark_runs (
  run_id text primary key,
  engine_version text not null,
  adapter_version text not null,
  catalog_version text not null,
  scenario_set_version text not null,
  category_set_version text not null,
  k int not null,
  deterministic boolean not null,
  status text not null default 'complete' check (status in ('running', 'complete', 'failed', 'stale')),
  created_at timestamptz not null default now()
);

create table partner_studio.brand_rollups (
  tenant_id uuid not null references partner_studio.tenants(id) on delete cascade,
  run_id text not null references partner_studio.benchmark_runs(run_id),
  payload jsonb not null, -- counts, denominators, versions and source references only
  primary key (tenant_id, run_id)
);

create table partner_studio.actions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references partner_studio.tenants(id) on delete cascade,
  run_id text not null,
  action_key text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'done')),
  owner uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  unique (tenant_id, run_id, action_key)
);

create table partner_studio.audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid,
  actor uuid,
  action text not null,
  detail jsonb,
  at timestamptz not null default now()
);

-- Tenant isolation: a member reads only their own tenant's rollups and actions.
alter table partner_studio.brand_rollups enable row level security;
alter table partner_studio.actions enable row level security;
alter table partner_studio.tenant_members enable row level security;

create policy rollups_member_read on partner_studio.brand_rollups for select to authenticated
  using (exists (select 1 from partner_studio.tenant_members m where m.tenant_id = brand_rollups.tenant_id and m.user_id = auth.uid()));
create policy actions_member_rw on partner_studio.actions for all to authenticated
  using (exists (select 1 from partner_studio.tenant_members m where m.tenant_id = actions.tenant_id and m.user_id = auth.uid()))
  with check (exists (select 1 from partner_studio.tenant_members m where m.tenant_id = actions.tenant_id and m.user_id = auth.uid() and m.role in ('owner', 'member')));
create policy members_self_read on partner_studio.tenant_members for select to authenticated using (user_id = auth.uid());
-- Catalog, source, claim and run tables are written only by the service role from the benchmark job.

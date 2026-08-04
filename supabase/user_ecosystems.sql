-- Per-user product state: which products are in her ecosystem, tracked, or hidden.
-- One row per (user_id, product_id). Read/written by src/utils/ecosystemStore.js
-- using the user's own session, so RLS scopes every row to its owner.
--
-- NOTE: this table existed in the hosted project before it was in version
-- control. `create table if not exists` + `drop policy if exists` make this
-- file safe to re-run against the live database.
create table if not exists public.user_ecosystems (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  product_name text,
  brand text,
  category text,
  product_type text,
  -- Full product object. LLM-generated products exist only here — there is no
  -- catalog row to join against, so the whole payload is denormalized.
  product_data jsonb,
  in_ecosystem boolean not null default false,
  is_tracked boolean not null default false,
  is_omitted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Composite PK is what `upsert(..., { onConflict: 'user_id,product_id' })`
  -- in ecosystemStore.upsertProductState resolves against. Without it every
  -- upsert would insert a duplicate row instead of updating.
  primary key (user_id, product_id)
);

create index if not exists user_ecosystems_user_id_idx
on public.user_ecosystems (user_id);

alter table public.user_ecosystems enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select, insert, update, delete on public.user_ecosystems to authenticated;
grant all on public.user_ecosystems to service_role;

drop policy if exists "user_ecosystems_select_own" on public.user_ecosystems;
create policy "user_ecosystems_select_own"
on public.user_ecosystems for select
to authenticated using (auth.uid() = user_id);

drop policy if exists "user_ecosystems_insert_own" on public.user_ecosystems;
create policy "user_ecosystems_insert_own"
on public.user_ecosystems for insert
to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_ecosystems_update_own" on public.user_ecosystems;
create policy "user_ecosystems_update_own"
on public.user_ecosystems for update
to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Required by clearEcosystemForUser() and by upsertProductState()'s
-- "no flags set -> delete the row" path. Without this policy both fail
-- silently under RLS and stale products reappear on the next load.
drop policy if exists "user_ecosystems_delete_own" on public.user_ecosystems;
create policy "user_ecosystems_delete_own"
on public.user_ecosystems for delete
to authenticated using (auth.uid() = user_id);

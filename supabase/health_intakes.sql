create table if not exists public.health_intakes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.health_intakes enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select, insert, update, delete on public.health_intakes to authenticated;
grant all on public.health_intakes to service_role;

create policy "health_intakes_select_own"
on public.health_intakes
for select
to authenticated
using (auth.uid() = user_id);

create policy "health_intakes_upsert_own"
on public.health_intakes
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "health_intakes_update_own"
on public.health_intakes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Erasure path for the most sensitive table in the schema. Account deletion is
-- currently a manual "email us" flow; without this policy whoever implements it
-- would hit a silent no-op rather than an error.
drop policy if exists "health_intakes_delete_own" on public.health_intakes;
create policy "health_intakes_delete_own"
on public.health_intakes
for delete
to authenticated
using (auth.uid() = user_id);

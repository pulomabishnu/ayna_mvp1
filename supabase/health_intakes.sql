create table if not exists public.health_intakes (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.health_intakes enable row level security;

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

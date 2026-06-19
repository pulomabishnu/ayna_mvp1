create table if not exists public.phone_numbers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_number text not null unique, -- E.164, e.g. +15551234567
  is_verified boolean not null default false,
  sms_opted_out boolean not null default false,
  last_sms_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.phone_numbers enable row level security;

create policy "phone_numbers_select_own"
on public.phone_numbers
for select
to authenticated
using (auth.uid() = user_id);

create policy "phone_numbers_upsert_own"
on public.phone_numbers
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "phone_numbers_update_own"
on public.phone_numbers
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

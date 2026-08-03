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

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select, insert, update, delete on public.phone_numbers to authenticated;
grant all on public.phone_numbers to service_role;

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

-- Without a DELETE policy every delete is silently blocked (RLS returns 0 rows
-- affected, not an error). Combined with the UNIQUE constraint on phone_number
-- that means a number bound to the wrong account is stuck forever — the
-- rightful owner gets 23505 -> 409 with no unbind path — and a GDPR/CCPA
-- erasure request cannot be honoured short of deleting the auth.users row.
drop policy if exists "phone_numbers_delete_own" on public.phone_numbers;
create policy "phone_numbers_delete_own"
on public.phone_numbers
for delete
to authenticated
using (auth.uid() = user_id);

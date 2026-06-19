-- Ephemeral OTP state for phone verification, used while Twilio Verify is
-- unavailable (e.g. trial accounts that can't provision a Verify Service).
-- Written/read by api/phone-verify-send.js and api/phone-verify-confirm.js
-- using the *user's own* JWT (not the service-role key) — RLS below scopes
-- every row to its owner, so the service-role key never needs to touch this
-- table.
create table if not exists public.pending_phone_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_number text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.pending_phone_verifications enable row level security;

create policy "pending_phone_verifications_select_own"
on public.pending_phone_verifications for select
to authenticated using (auth.uid() = user_id);

create policy "pending_phone_verifications_upsert_own"
on public.pending_phone_verifications for insert
to authenticated with check (auth.uid() = user_id);

create policy "pending_phone_verifications_update_own"
on public.pending_phone_verifications for update
to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pending_phone_verifications_delete_own"
on public.pending_phone_verifications for delete
to authenticated using (auth.uid() = user_id);

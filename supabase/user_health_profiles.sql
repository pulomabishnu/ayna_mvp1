-- Imported health profile: conditions, medications, allergies and any wearable
-- or FHIR summary the user brings in via HealthDataImport.
--
-- This was localStorage-only. Two consequences, both bad:
--   * The user opens Ayna on another device and her imported medications and
--     conditions are silently gone. Clearing browser data destroys them
--     irrecoverably, and nothing tells her.
--   * The profile IS fed to the LLM as health context, so recommendations
--     quietly degrade to a less-informed baseline with no signal.
--
-- Separate from health_intakes: that holds the intake questionnaire, this holds
-- data imported from an external system. They have different provenance and
-- different lifecycles.
create table if not exists public.user_health_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_health_profiles enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select, insert, update, delete on public.user_health_profiles to authenticated;
grant all on public.user_health_profiles to service_role;

drop policy if exists "user_health_profiles_select_own" on public.user_health_profiles;
create policy "user_health_profiles_select_own"
on public.user_health_profiles for select
to authenticated using (auth.uid() = user_id);

drop policy if exists "user_health_profiles_insert_own" on public.user_health_profiles;
create policy "user_health_profiles_insert_own"
on public.user_health_profiles for insert
to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_health_profiles_update_own" on public.user_health_profiles;
create policy "user_health_profiles_update_own"
on public.user_health_profiles for update
to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Erasure path, as for every other table holding health data.
drop policy if exists "user_health_profiles_delete_own" on public.user_health_profiles;
create policy "user_health_profiles_delete_own"
on public.user_health_profiles for delete
to authenticated using (auth.uid() = user_id);

-- Generic, so this file has no apply-order dependency on any other.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_health_profiles_touch on public.user_health_profiles;
create trigger user_health_profiles_touch
before update on public.user_health_profiles
for each row execute function public.touch_updated_at();

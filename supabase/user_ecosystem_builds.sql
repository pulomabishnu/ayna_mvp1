-- Ecosystem-build quota ledger.
--
-- The first personalization build is free. After that, a Free account may
-- create one new build per UTC Monday-Sunday week by default (the API passes
-- ECOSYSTEM_BUILD_LIMIT, default 1). Pro bypasses this quota entirely.
--
-- A single build is generated across several HTTP requests, so the unit of
-- account remains the BUILD, identified by a client-supplied build_id derived
-- from the intake fingerprint. Re-presenting the same build_id is always free.
create table if not exists public.user_ecosystem_builds (
  user_id uuid not null references auth.users(id) on delete cascade,
  build_id text not null,
  created_at timestamptz not null default now(),
  is_initial boolean not null default false,
  primary key (user_id, build_id)
);

alter table public.user_ecosystem_builds enable row level security;

grant select on public.user_ecosystem_builds to authenticated;
grant all on public.user_ecosystem_builds to service_role;

drop policy if exists "user_ecosystem_builds_select_own" on public.user_ecosystem_builds;
create policy "user_ecosystem_builds_select_own"
on public.user_ecosystem_builds for select
to authenticated using (auth.uid() = user_id);

create index if not exists user_ecosystem_builds_weekly_retakes_idx
  on public.user_ecosystem_builds(user_id, created_at)
  where is_initial = false;

drop function if exists public.claim_ecosystem_build(uuid, text, integer);
drop function if exists public.release_ecosystem_build(uuid, text);

-- Atomically claim one personalization build.
--   * The first unique build for an account is the initial build and does not
--     consume the weekly retake allowance.
--   * Later unique build IDs are retakes and are capped per UTC week.
--   * The same build ID always succeeds, preserving multi-batch generation and
--     retry-after-failure behavior.
create or replace function public.claim_ecosystem_build(
  p_user_id uuid,
  p_build_id text,
  p_limit integer
)
returns table (allowed boolean, used integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_used integer;
  v_has_build boolean;
  v_week_start timestamptz := date_trunc('week', now() at time zone 'UTC') at time zone 'UTC';
begin
  if p_build_id is null or length(trim(p_build_id)) = 0 then
    raise exception 'build_id is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if exists (
    select 1 from public.user_ecosystem_builds b
    where b.user_id = p_user_id and b.build_id = p_build_id
  ) then
    select count(*)::integer into v_used
    from public.user_ecosystem_builds b
    where b.user_id = p_user_id
      and b.is_initial = false
      and b.created_at >= v_week_start;
    return query select true, coalesce(v_used, 0);
    return;
  end if;

  select exists(
    select 1 from public.user_ecosystem_builds b where b.user_id = p_user_id
  ) into v_has_build;

  if not v_has_build then
    insert into public.user_ecosystem_builds (user_id, build_id, is_initial)
    values (p_user_id, p_build_id, true);
    return query select true, 0;
    return;
  end if;

  select count(*)::integer into v_used
  from public.user_ecosystem_builds b
  where b.user_id = p_user_id
    and b.is_initial = false
    and b.created_at >= v_week_start;

  if p_limit is null or coalesce(v_used, 0) >= p_limit then
    return query select false, coalesce(v_used, 0);
    return;
  end if;

  insert into public.user_ecosystem_builds (user_id, build_id, is_initial)
  values (p_user_id, p_build_id, false);

  return query select true, (coalesce(v_used, 0) + 1)::integer;
end;
$$;

-- Give back a build when generation produced nothing usable. If the initial
-- build is released, the next successful build becomes the initial build.
create or replace function public.release_ecosystem_build(
  p_user_id uuid,
  p_build_id text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  delete from public.user_ecosystem_builds
  where user_id = p_user_id and build_id = p_build_id;
  get diagnostics v_deleted = row_count;
  return v_deleted > 0;
end;
$$;

revoke all on function public.claim_ecosystem_build(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.release_ecosystem_build(uuid, text) from public, anon, authenticated;

grant execute on function public.claim_ecosystem_build(uuid, text, integer) to service_role;
grant execute on function public.release_ecosystem_build(uuid, text) to service_role;

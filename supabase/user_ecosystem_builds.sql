-- Ecosystem-build quota ledger.
--
-- The free tier allows one ecosystem build per lifetime, but a single build is
-- generated across SEVERAL HTTP requests (the client splits concerns into
-- batches). Counting requests is therefore wrong in both directions:
--   * gating only the first batch lets a client skip the quota by sending
--     batchIndex >= 1;
--   * charging every batch bills one build several times.
--
-- So the unit of account is the BUILD, identified by a client-supplied
-- build_id derived from the intake fingerprint. Every batch of the same build
-- presents the same id: the first claims the quota, the rest are idempotent
-- no-ops. Retrying a failed build reuses the id and is therefore free.
create table if not exists public.user_ecosystem_builds (
  user_id uuid not null references auth.users(id) on delete cascade,
  build_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, build_id)
);

alter table public.user_ecosystem_builds enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select on public.user_ecosystem_builds to authenticated;
grant all on public.user_ecosystem_builds to service_role;

-- Written server-side with the service-role key only. A read-own policy lets a
-- user see her own history; nothing is writable from the browser.
drop policy if exists "user_ecosystem_builds_select_own" on public.user_ecosystem_builds;
create policy "user_ecosystem_builds_select_own"
on public.user_ecosystem_builds for select
to authenticated using (auth.uid() = user_id);

drop function if exists public.claim_ecosystem_build(uuid, text, integer);
drop function if exists public.release_ecosystem_build(uuid, text);

-- Atomically claim one build against the limit.
--   * Re-presenting an already-claimed build_id always succeeds and costs
--     nothing, which is what makes multi-batch generation and retries safe.
--   * A transaction-scoped advisory lock on the user serializes concurrent
--     claims, so two different build_ids racing cannot both pass the check.
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
begin
  if p_build_id is null or length(trim(p_build_id)) = 0 then
    raise exception 'build_id is required';
  end if;

  -- Released at transaction end; serializes claims for this user only.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  if exists (
    select 1 from public.user_ecosystem_builds b
    where b.user_id = p_user_id and b.build_id = p_build_id
  ) then
    select count(*) into v_used
    from public.user_ecosystem_builds b where b.user_id = p_user_id;
    return query select true, v_used::integer;
    return;
  end if;

  select count(*) into v_used
  from public.user_ecosystem_builds b where b.user_id = p_user_id;

  if p_limit is null or v_used >= p_limit then
    return query select false, v_used::integer;
    return;
  end if;

  insert into public.user_ecosystem_builds (user_id, build_id)
  values (p_user_id, p_build_id);

  return query select true, (v_used + 1)::integer;
end;
$$;

-- Hand a build back when it produced nothing usable, so a failed generation
-- does not permanently consume the user's only build.
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

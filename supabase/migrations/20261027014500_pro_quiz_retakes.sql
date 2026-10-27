begin;

-- The first completed personalization build is free. After that, Free accounts
-- may create one new personalization build per UTC Monday-Sunday week. Pro
-- bypasses this RPC in the API, so Pro retakes remain unlimited. Keeping this
-- rule on the ecosystem-build ledger makes multi-batch generation and retries
-- idempotent: the same build_id never consumes another retake.
alter table public.user_ecosystem_builds
  add column if not exists is_initial boolean not null default false;

-- Existing accounts were previously limited to one lifetime build by default.
-- Mark the oldest row as the initial build; any additional historical rows are
-- treated as retakes so migration never grants them extra history.
with ranked as (
  select user_id, build_id,
         row_number() over (partition by user_id order by created_at, build_id) as rn
  from public.user_ecosystem_builds
)
update public.user_ecosystem_builds b
set is_initial = (r.rn = 1)
from ranked r
where b.user_id = r.user_id and b.build_id = r.build_id;

create index if not exists user_ecosystem_builds_weekly_retakes_idx
  on public.user_ecosystem_builds(user_id, created_at)
  where is_initial = false;

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

  -- Serialize claims per account so two different fingerprints cannot both
  -- consume the same weekly allowance under concurrency.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  -- Reopening/retrying the same completed quiz is free and keeps all batch
  -- requests for one generation idempotent.
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

  -- Initial personalization is never counted as a retake.
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

revoke all on function public.claim_ecosystem_build(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.claim_ecosystem_build(uuid, text, integer) to service_role;

commit;

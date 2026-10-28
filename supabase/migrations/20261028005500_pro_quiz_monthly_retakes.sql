begin;

-- Product rule: the initial personalization build is free. After that, Free
-- accounts may create one new build per UTC calendar month; Pro and temporary
-- Pro grants are unlimited. Reusing the same build_id remains free so retries
-- and multi-batch generation never consume another retake.

drop index if exists public.user_ecosystem_builds_weekly_retakes_idx;
create index if not exists user_ecosystem_builds_monthly_retakes_idx
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
  v_month_start timestamptz := date_trunc('month', now() at time zone 'UTC') at time zone 'UTC';
  v_pro boolean := false;
  v_rules_enabled boolean := false;
begin
  if p_build_id is null or length(trim(p_build_id)) = 0 then
    raise exception 'build_id is required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select coalesce(enabled, false) into v_rules_enabled
  from public.pro_feature_rules
  where id;

  -- Before the Pro rollout switch is enabled, preserve the legacy build quota.
  if not coalesce(v_rules_enabled, false) then
    if exists (
      select 1 from public.user_ecosystem_builds b
      where b.user_id = p_user_id and b.build_id = p_build_id
    ) then
      select count(*)::integer into v_used
      from public.user_ecosystem_builds b
      where b.user_id = p_user_id;
      return query select true, coalesce(v_used, 0);
      return;
    end if;

    select count(*)::integer into v_used
    from public.user_ecosystem_builds b
    where b.user_id = p_user_id;

    if p_limit is null or coalesce(v_used, 0) >= p_limit then
      return query select false, coalesce(v_used, 0);
      return;
    end if;

    insert into public.user_ecosystem_builds(user_id, build_id, is_initial)
    values(p_user_id, p_build_id, coalesce(v_used, 0) = 0);
    return query select true, (coalesce(v_used, 0) + 1)::integer;
    return;
  end if;

  select coalesce((public.pro_access_status(p_user_id)->>'active')::boolean, false) into v_pro;
  if v_pro then
    if not exists (
      select 1 from public.user_ecosystem_builds b
      where b.user_id = p_user_id and b.build_id = p_build_id
    ) then
      select exists(select 1 from public.user_ecosystem_builds b where b.user_id = p_user_id) into v_has_build;
      insert into public.user_ecosystem_builds(user_id, build_id, is_initial)
      values(p_user_id, p_build_id, not v_has_build);
    end if;
    return query select true, 0;
    return;
  end if;

  if exists (
    select 1 from public.user_ecosystem_builds b
    where b.user_id = p_user_id and b.build_id = p_build_id
  ) then
    select count(*)::integer into v_used
    from public.user_ecosystem_builds b
    where b.user_id = p_user_id
      and b.is_initial = false
      and b.created_at >= v_month_start;
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
    and b.created_at >= v_month_start;

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

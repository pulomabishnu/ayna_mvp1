begin;

alter table public.pro_feature_rules
  add column if not exists free_quiz_retakes_per_week integer not null default 1
  check (free_quiz_retakes_per_week >= 0);

create table if not exists public.pro_quiz_retakes (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  used integer not null default 0 check (used >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start)
);

alter table public.pro_quiz_retakes enable row level security;
revoke all on public.pro_quiz_retakes from public, anon, authenticated;
grant select, insert, update, delete on public.pro_quiz_retakes to service_role;

create or replace function public.pro_feature_config() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'enabled', enabled,
    'freeAskPerDay', free_ask_per_day,
    'proAskPerDay', pro_ask_per_day,
    'freePlaylists', free_playlists,
    'freeQuizRetakesPerWeek', free_quiz_retakes_per_week
  )
  from public.pro_feature_rules where id;
$$;
revoke all on function public.pro_feature_config() from public, anon, authenticated;
grant execute on function public.pro_feature_config() to service_role;

create or replace function public.pro_quiz_retake_allowance(
  p_user_id uuid,
  p_unlimited boolean,
  p_consume boolean default false
) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  v_enabled boolean;
  v_limit integer;
  v_week date := date_trunc('week', now() at time zone 'UTC')::date;
  v_used integer := 0;
begin
  select enabled, free_quiz_retakes_per_week
    into v_enabled, v_limit
  from public.pro_feature_rules
  where id;

  if coalesce(v_enabled, false) = false or coalesce(p_unlimited, false) then
    return jsonb_build_object('allowed', true, 'used', 0, 'limit', v_limit, 'weekStart', v_week, 'unlimited', coalesce(p_unlimited, false));
  end if;

  if not p_consume then
    select coalesce(used, 0) into v_used
    from public.pro_quiz_retakes
    where user_id = p_user_id and week_start = v_week;
    v_used := coalesce(v_used, 0);
    return jsonb_build_object('allowed', v_used < v_limit, 'used', v_used, 'limit', v_limit, 'weekStart', v_week, 'unlimited', false);
  end if;

  insert into public.pro_quiz_retakes(user_id, week_start, used, updated_at)
  values (p_user_id, v_week, 1, now())
  on conflict (user_id, week_start) do update
    set used = public.pro_quiz_retakes.used + 1,
        updated_at = now()
    where public.pro_quiz_retakes.used < v_limit
  returning used into v_used;

  if v_used is null then
    select coalesce(used, 0) into v_used
    from public.pro_quiz_retakes
    where user_id = p_user_id and week_start = v_week;
    return jsonb_build_object('allowed', false, 'used', coalesce(v_used, 0), 'limit', v_limit, 'weekStart', v_week, 'unlimited', false);
  end if;

  return jsonb_build_object('allowed', true, 'used', v_used, 'limit', v_limit, 'weekStart', v_week, 'unlimited', false);
end;
$$;
revoke all on function public.pro_quiz_retake_allowance(uuid, boolean, boolean) from public, anon, authenticated;
grant execute on function public.pro_quiz_retake_allowance(uuid, boolean, boolean) to service_role;

commit;

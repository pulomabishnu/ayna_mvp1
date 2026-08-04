-- AI usage quotas backing the free-tier limits in api/_usageLimit.js
-- (LIMITS = { chat: 5/week, insights: 5/week, ecosystem: 1/lifetime }).
--
-- Written server-side with the service-role key, which bypasses RLS. RLS is
-- still enabled with a read-own policy so a user can see her own usage and
-- nobody can see anyone else's, and so the table is not writable from the
-- browser under any circumstance.
create table if not exists public.user_ai_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'lifetime' for the ecosystem quota, 'week:YYYY-MM-DD' (Monday) otherwise.
  period text not null,
  -- 'chat' | 'insights' | 'ecosystem'
  action text not null,
  count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, period, action)
);

alter table public.user_ai_usage enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
-- Read-only for the client (the counter); all writes go through the RPCs.
grant select on public.user_ai_usage to authenticated;
grant all on public.user_ai_usage to service_role;

drop policy if exists "user_ai_usage_select_own" on public.user_ai_usage;
create policy "user_ai_usage_select_own"
on public.user_ai_usage for select
to authenticated using (auth.uid() = user_id);

-- ── Atomic quota functions ───────────────────────────────────────────────────
-- The application must never do "SELECT count, then INSERT count+1" — two
-- concurrent requests both read the pre-increment value and both proceed, so a
-- 1-per-lifetime quota grants 2. Every mutation below is a single statement.

-- Dropped first, not CREATE OR REPLACEd: the hosted project may already have
-- an increment_ai_usage that returns void, and Postgres refuses to change an
-- existing function's return type in place.
drop function if exists public.increment_ai_usage(uuid, text, text);
drop function if exists public.consume_ai_usage(uuid, text, text, integer);
drop function if exists public.refund_ai_usage(uuid, text, text);

-- Bare increment. Kept because api/_usageLimit.js's incrementUsage() calls it;
-- prefer consume_ai_usage() for anything that also needs to enforce a limit.
create or replace function public.increment_ai_usage(
  p_user_id uuid,
  p_period text,
  p_action text
)
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.user_ai_usage as u (user_id, period, action, count)
  values (p_user_id, p_period, p_action, 1)
  on conflict (user_id, period, action) do update
    set count = u.count + 1,
        updated_at = now()
  returning u.count;
$$;

-- Atomic check-and-increment: consumes one unit only if the caller is still
-- under p_limit. Returns whether it was allowed and the resulting count.
-- Callers should consume BEFORE doing the expensive work and refund on
-- failure, so a crashed generation does not permanently burn a quota.
create or replace function public.consume_ai_usage(
  p_user_id uuid,
  p_period text,
  p_action text,
  p_limit integer
)
returns table (allowed boolean, used integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  -- A non-positive limit means "no allowance". Without this guard the INSERT
  -- branch below would still create the first row and grant one use, because
  -- the limit is only consulted on the ON CONFLICT path.
  if p_limit is null or p_limit < 1 then
    select u.count into v_count
    from public.user_ai_usage u
    where u.user_id = p_user_id and u.period = p_period and u.action = p_action;
    return query select false, coalesce(v_count, 0);
    return;
  end if;

  insert into public.user_ai_usage as u (user_id, period, action, count)
  values (p_user_id, p_period, p_action, 1)
  on conflict (user_id, period, action) do update
    set count = u.count + 1,
        updated_at = now()
    -- Increment happens only while under the limit. At the limit the UPDATE
    -- is skipped and RETURNING yields no row, so v_count stays NULL.
    where u.count < p_limit
  returning u.count into v_count;

  if v_count is null then
    select u.count into v_count
    from public.user_ai_usage u
    where u.user_id = p_user_id and u.period = p_period and u.action = p_action;
    return query select false, coalesce(v_count, 0);
  else
    return query select true, v_count;
  end if;
end;
$$;

-- Give a unit back when the work the caller consumed it for failed.
-- Floors at zero so a double refund cannot mint quota.
create or replace function public.refund_ai_usage(
  p_user_id uuid,
  p_period text,
  p_action text
)
returns integer
language sql
security definer
set search_path = public, pg_temp
as $$
  -- Aliased so `count` unambiguously resolves to the column and not the
  -- aggregate function of the same name.
  update public.user_ai_usage as u
  set count = greatest(u.count - 1, 0),
      updated_at = now()
  where u.user_id = p_user_id and u.period = p_period and u.action = p_action
  returning u.count;
$$;

-- These run with the definer's rights, so they must not be callable by a
-- browser session — otherwise a user could refund herself unlimited quota.
revoke all on function public.increment_ai_usage(uuid, text, text) from public, anon, authenticated;
revoke all on function public.consume_ai_usage(uuid, text, text, integer) from public, anon, authenticated;
revoke all on function public.refund_ai_usage(uuid, text, text) from public, anon, authenticated;

grant execute on function public.increment_ai_usage(uuid, text, text) to service_role;
grant execute on function public.consume_ai_usage(uuid, text, text, integer) to service_role;
grant execute on function public.refund_ai_usage(uuid, text, text) to service_role;

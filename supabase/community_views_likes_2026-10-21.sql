-- Community: post views and the "who found this helpful" list (2026-10-21).
--
-- What this adds
--   * community_post_views: one row per viewer per post per UTC day. The
--     viewer is stored only as a sha256 hash of "u:<user id>" (signed in) or
--     "d:<device id>" (signed out, a random id kept in the browser). Nobody
--     can select from this table: no grants, RLS on, no policies. Counts come
--     out through the functions below, never the rows. There is no "who
--     viewed" list anywhere (privacy decision for a health community).
--   * community_record_post_view(p_post_id, p_device_key): counts a view once
--     per viewer per post per day and returns the new total. Authors viewing
--     their own post are not counted.
--   * community_post_view_counts(p_post_ids[]): total views per post, plus
--     today's views for posts the caller wrote (null for everyone else).
--   * community_helpful_votes.is_anonymous (default false): lets a helpful
--     vote be anonymous. Existing votes stay public as before.
--   * community_post_likers(p_post_id, p_limit, p_offset): everyone who found
--     a post helpful, newest first, with the total. Masked server-side: an
--     anonymous vote, a guest account, someone with no Community profile, or
--     someone the caller has blocked (or who blocked the caller) comes back
--     with no id, name, handle, avatar or time, and is_anonymous = true. The
--     caller's own vote comes back with is_me = true.
--   * community_post_likers_preview(p_post_ids[], p_per_post): the latest few
--     likers for many posts at once (feed cards), same masking.
--
-- The community_feed_posts view is NOT changed: counts are read through the
-- functions so this file can't drift from the live view definition.
--
-- Safe to run more than once: create if not exists, add column if not exists,
-- create or replace, drop policy if exists. It never deletes or rewrites rows.
-- NOT applied automatically. Run it in the Supabase SQL editor after
-- community.sql. Until it runs the app hides view counts and liker avatars,
-- and Helpful works exactly as before.

begin;

-- ── Views ──────────────────────────────────────────────────────────────────
create table if not exists public.community_post_views (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  viewer_key text not null check (viewer_key ~ '^[0-9a-f]{64}$'),
  day date not null default ((now() at time zone 'utc')::date),
  created_at timestamptz not null default now(),
  constraint community_post_views_once_a_day unique (post_id, viewer_key, day)
);
create index if not exists community_post_views_post_day_idx on public.community_post_views (post_id, day);
create index if not exists community_post_views_viewer_day_idx on public.community_post_views (viewer_key, day);

alter table public.community_post_views enable row level security;
revoke all on public.community_post_views from public, anon, authenticated;
-- Deliberately no policies: only the security definer functions below (and
-- the service role) touch these rows.

create or replace function public.community_record_post_view(p_post_id uuid, p_device_key text default null)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  post_author uuid;
  post_anon boolean;
  raw_key text;
  hashed text;
begin
  select p.author_id, p.is_anonymous into post_author, post_anon
    from public.community_posts p
   where p.id = p_post_id and p.status = 'visible';
  if not found then return null; end if;
  if not post_anon and public.community_viewer_blocked(post_author) then return null; end if;

  if uid is not null then
    if uid is distinct from post_author then raw_key := 'u:' || uid::text; end if;
  elsif p_device_key is not null and p_device_key ~ '^[A-Za-z0-9-]{16,64}$' then
    raw_key := 'd:' || lower(p_device_key);
  end if;

  if raw_key is not null then
    hashed := encode(sha256(convert_to(raw_key, 'UTF8')), 'hex');
    -- A runaway client can't inflate counts without limit.
    if (select count(*) from public.community_post_views v where v.viewer_key = hashed and v.day = today) < 1000 then
      insert into public.community_post_views (post_id, viewer_key, day)
      values (p_post_id, hashed, today)
      on conflict (post_id, viewer_key, day) do nothing;
    end if;
  end if;

  return (select count(*)::int from public.community_post_views v where v.post_id = p_post_id);
end;
$$;

create or replace function public.community_post_view_counts(p_post_ids uuid[])
returns table (post_id uuid, view_count integer, views_today integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    (select count(*)::int from public.community_post_views v where v.post_id = p.id),
    case when auth.uid() is not null and p.author_id = auth.uid() then
      (select count(*)::int from public.community_post_views v
        where v.post_id = p.id and v.day = (now() at time zone 'utc')::date)
    end
  from public.community_posts p
  where p.id = any ((coalesce(p_post_ids, '{}'::uuid[]))[1:100])
    and p.status = 'visible'
    and (p.is_anonymous or not public.community_viewer_blocked(p.author_id));
$$;

-- ── Helpful likers ─────────────────────────────────────────────────────────
alter table public.community_helpful_votes
  add column if not exists is_anonymous boolean not null default false;

create or replace function public.community_post_likers(p_post_id uuid, p_limit integer default 50, p_offset integer default 0)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_anonymous boolean,
  is_me boolean,
  liked_at timestamptz,
  total_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  with target as (
    select p.id
      from public.community_posts p
     where p.id = p_post_id
       and p.status = 'visible'
       and (p.is_anonymous or not public.community_viewer_blocked(p.author_id))
  ),
  shaped as (
    select
      v.user_id,
      v.created_at,
      pr.username,
      pr.display_name,
      pr.avatar_url,
      coalesce(v.user_id = auth.uid(), false) as me,
      (v.user_id is distinct from auth.uid()) and (
        coalesce(v.is_anonymous, false)
        or pr.user_id is null
        or public.community_user_is_guest(v.user_id)
        or public.community_viewer_blocked(v.user_id)
      ) as masked
    from public.community_helpful_votes v
    join target t on t.id = v.post_id
    left join public.community_profiles pr on pr.user_id = v.user_id
  )
  select
    case when s.masked then null else s.user_id end,
    case when s.masked then null else s.username end,
    case when s.masked then null else s.display_name end,
    case when s.masked then null else s.avatar_url end,
    s.masked,
    s.me,
    case when s.masked then null else s.created_at end,
    (count(*) over ())::int
  from shaped s
  order by s.created_at desc, s.user_id
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

create or replace function public.community_post_likers_preview(p_post_ids uuid[], p_per_post integer default 5)
returns table (
  post_id uuid,
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_anonymous boolean,
  is_me boolean,
  total_count integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select ids.id, l.user_id, l.username, l.display_name, l.avatar_url, l.is_anonymous, l.is_me, l.total_count
    from unnest((coalesce(p_post_ids, '{}'::uuid[]))[1:60]) as ids(id)
    cross join lateral public.community_post_likers(ids.id, least(greatest(coalesce(p_per_post, 5), 1), 10), 0) l;
$$;

-- ── Grants ─────────────────────────────────────────────────────────────────
revoke all on function public.community_record_post_view(uuid, text) from public;
revoke all on function public.community_post_view_counts(uuid[]) from public;
revoke all on function public.community_post_likers(uuid, integer, integer) from public;
revoke all on function public.community_post_likers_preview(uuid[], integer) from public;
grant execute on function public.community_record_post_view(uuid, text) to anon, authenticated;
grant execute on function public.community_post_view_counts(uuid[]) to anon, authenticated;
grant execute on function public.community_post_likers(uuid, integer, integer) to anon, authenticated;
grant execute on function public.community_post_likers_preview(uuid[], integer) to anon, authenticated;

commit;

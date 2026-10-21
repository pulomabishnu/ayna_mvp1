-- Community: user-created topics (2026-10-21).
-- Design: docs/community-user-topics.md (decisions made while building are
-- listed in that file under "Build decisions").
--
-- What this adds
--   * community_topics: a topic anyone with an account can start (not guests).
--     Name 3 to 40 characters, description up to 200, a cover (brand colour or
--     an uploaded photo under covers/), a title font and a text colour that
--     must reach 4.5:1 contrast, and an audience: public | friends | private.
--   * Review before public: a new PUBLIC topic starts as 'pending' and only its
--     creator (and members she adds) can see it until an admin approves it
--     (status 'visible'). Friends-only and private topics go live straight
--     away for their own audience. Admins can hide any topic ('hidden').
--     Only an admin or the service role can change status.
--   * community_topic_members: owner | coowner | member. The creator is the
--     owner. Members join public and friends topics themselves; private topics
--     only through join_topic_by_code(code).
--   * community_topic_invites: one invite code per topic, minted by
--     community_topic_invite_code(tid). Never readable directly.
--   * community_posts.topic_id (nullable, on delete set null) + index, and the
--     feed and comment views hide posts of topics the viewer can't see.
--   * community_feed_topics: the only way clients read topics. A creator who
--     chose "post anonymously" is never exposed (created_by, handle and name
--     are null for everyone but herself).
--   * community_reports can target a topic (target_type 'topic', topic_id).
--   * suggestions.reviewed_at, for the admin review screen.
--
-- Rules enforced here (the server, not just the screen):
--   * 3 new topics per account per 24 hours, 20 per account in total.
--   * Name and description: no links, the community rules backstop
--     (community_text_breaks_rules) and no ayna / clinician impersonation.
--   * Text and background contrast >= 4.5 (WCAG relative luminance).
--   * Cover photos must be the creator's own upload in covers/.
--
-- Safe to run more than once: create if not exists, add column if not
-- exists, create or replace, drop policy/trigger if exists. It never deletes
-- or rewrites existing rows. The two feed views are rebuilt from their LIVE
-- definitions (pg_get_viewdef) with one column and one filter appended, so
-- nothing else in them changes; if that can't be done safely the whole file
-- rolls back.
-- NOT applied automatically. Run it in the Supabase SQL editor after
-- community.sql, the announcements migration and
-- community_friends_playlists_2026-10-20.sql. Until it runs the app hides
-- create, join and topic pages, and "Suggest a topic" works as before.

begin;

do $$
begin
  if to_regclass('public.community_posts') is null or to_regclass('public.community_feed_posts') is null then
    raise exception 'Run community.sql first';
  end if;
  if to_regprocedure('public.community_text_breaks_rules(text)') is null then
    raise exception 'Run migrations/20261013120000_community_announcements.sql first';
  end if;
end $$;

-- ── Tables ─────────────────────────────────────────────────────────────────
create table if not exists public.community_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name text not null check (char_length(btrim(name)) between 3 and 40),
  description text check (description is null or char_length(description) <= 200),
  cover_image_url text check (cover_image_url is null or cover_image_url ~ '^covers/[0-9a-f-]{36}\.(jpg|jpeg|webp|png)$'),
  cover_color text not null default '#ffedac' check (cover_color in ('#ffedac', '#3e2723', '#769ebe', '#f7badd')),
  title_font text not null default 'serif' check (title_font in ('serif', 'sans')),
  text_color text not null default '#3e2723' check (text_color in ('#ffedac', '#3e2723', '#769ebe', '#f7badd')),
  visibility text not null default 'public' check (visibility in ('public', 'friends', 'private')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  creator_anonymous boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'visible', 'hidden')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_topics_anonymous_public check (not creator_anonymous or visibility = 'public')
);
create index if not exists community_topics_browse_idx on public.community_topics (status, visibility, created_at desc);
create index if not exists community_topics_creator_idx on public.community_topics (created_by, created_at desc);

create table if not exists public.community_topic_members (
  topic_id uuid not null references public.community_topics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'coowner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (topic_id, user_id)
);
create index if not exists community_topic_members_user_idx on public.community_topic_members (user_id, joined_at desc);

create table if not exists public.community_topic_invites (
  topic_id uuid primary key references public.community_topics(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{16,40}$'),
  created_at timestamptz not null default now()
);

alter table public.community_posts
  add column if not exists topic_id uuid references public.community_topics(id) on delete set null;
create index if not exists community_posts_topic_idx on public.community_posts (topic_id, created_at desc) where topic_id is not null;

-- ── Helpers ────────────────────────────────────────────────────────────────
-- WCAG 2.x relative luminance of a #rrggbb colour. Same formula as
-- src/utils/community/topicContrast.js.
create or replace function public.community_hex_luminance(hex text)
returns numeric
language plpgsql
immutable
set search_path = ''
as $$
declare
  ch numeric[] := array[]::numeric[];
  v numeric;
  i int;
begin
  if hex !~* '^#[0-9a-f]{6}$' then return null; end if;
  for i in 0..2 loop
    v := ('x' || substr(hex, 2 + i * 2, 2))::bit(8)::int / 255.0;
    ch := ch || (case when v <= 0.03928 then v / 12.92 else power((v + 0.055) / 1.055, 2.4) end);
  end loop;
  return 0.2126 * ch[1] + 0.7152 * ch[2] + 0.0722 * ch[3];
end;
$$;

create or replace function public.community_contrast_ratio(a text, b text)
returns numeric
language sql
immutable
set search_path = ''
as $$
  select (greatest(public.community_hex_luminance(a), public.community_hex_luminance(b)) + 0.05)
       / (least(public.community_hex_luminance(a), public.community_hex_luminance(b)) + 0.05);
$$;

-- The caller's role in a topic ('owner' | 'coowner' | 'member'), or null.
create or replace function public.community_topic_role(tid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role from public.community_topic_members m
   where m.topic_id = tid and m.user_id = auth.uid();
$$;

create or replace function public.community_is_topic_manager(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and (
    exists (select 1 from public.community_topics t where t.id = tid and t.created_by = auth.uid())
    or coalesce(public.community_topic_role(tid) in ('owner', 'coowner'), false)
  );
$$;

-- Can the caller see this topic (and the posts in it)? Null topic = yes.
create or replace function public.community_can_view_topic(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select tid is null or exists (
    select 1 from public.community_topics t
     where t.id = tid
       and (
         t.created_by = auth.uid()
         or (t.status <> 'hidden' and public.community_topic_role(t.id) is not null)
         or (t.status = 'visible'
             and (t.creator_anonymous or not public.community_viewer_blocked(t.created_by))
             and (t.visibility = 'public'
                  or (t.visibility = 'friends' and public.community_viewer_is_friend(t.created_by))))
       )
  );
$$;

-- Can the caller post in this topic? Members always (unless hidden); anyone
-- with an account in a visible public topic.
create or replace function public.community_can_post_in_topic(tid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select tid is null or (auth.uid() is not null and exists (
    select 1 from public.community_topics t
     where t.id = tid
       and t.status <> 'hidden'
       and (
         t.created_by = auth.uid()
         or public.community_topic_role(t.id) is not null
         or (t.status = 'visible' and t.visibility = 'public' and not public.community_viewer_blocked(t.created_by))
       )
  ));
$$;

-- Name / description problems, the server copy of src/utils/community/topicRules.js
-- (the client runs the full community rules; this is the backstop).
create or replace function public.community_topic_text_problem(t text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  s text := lower(coalesce(t, ''));
begin
  if s ~ '(https?://|www\.|[a-z0-9-]+\.(com|co|net|org|io|app|me|ly|shop|store|link|xyz|info|us|uk|ca|au)(\M|/))' then return 'link'; end if;
  if public.community_text_breaks_rules(t) then return 'rules'; end if;
  if s ~ '\m(ayna|aynahealth)\M' or s ~ '\m(official|verified|admins?|moderators?|mods)\M' then return 'impersonation'; end if;
  -- A topic may be ABOUT doctors ("Doctor visits"); it may not claim to be
  -- run by one ("Ask a doctor", "Dr Maya's group", "Nurse-approved").
  if s ~ '\m(dr|md|rn|np|obgyn)\M'
     or s ~ '\m(ask|by|from|with|led by|run by|hosted by)\s+(an?\s+|the\s+|your\s+|my\s+)?(doctors?|physicians?|clinicians?|gynecologists?|obgyns?|midwife|midwives|nurses?|pharmacists?|dietitians?)\M'
     or s ~ '\m(doctors?|physicians?|clinicians?|gynecologists?|nurses?|midwife|midwives)[[:space:]-]+(approved|answers?|advice|led|run|official)\M' then
    return 'clinician';
  end if;
  return null;
end;
$$;

-- ── Guards ─────────────────────────────────────────────────────────────────
create or replace function public.community_topics_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  problem text;
begin
  if uid is null then
    -- Service role / SQL editor: trusted, but the row still needs a creator.
    if new.created_by is null then raise exception 'community_topic_creator_required' using errcode = 'P0001'; end if;
  else
    if public.community_user_is_guest(uid) or public.community_is_guest() then
      raise exception 'community_guest_unavailable' using errcode = 'P0001';
    end if;
    new.created_by := uid;
    if (select count(*) from public.community_topics t
         where t.created_by = uid and t.created_at > now() - interval '24 hours') >= 3 then
      raise exception 'community_rate_limited' using errcode = 'P0001';
    end if;
    if (select count(*) from public.community_topics t where t.created_by = uid) >= 20 then
      raise exception 'community_topics_full' using errcode = 'P0001';
    end if;
  end if;
  new.name := regexp_replace(btrim(new.name), '\s+', ' ', 'g');
  new.description := nullif(regexp_replace(btrim(coalesce(new.description, '')), '\s+', ' ', 'g'), '');
  problem := coalesce(public.community_topic_text_problem(new.name), public.community_topic_text_problem(new.description));
  if problem is not null then raise exception 'community_topic_%', problem using errcode = 'P0001'; end if;
  if new.visibility <> 'public' then new.creator_anonymous := false; end if;
  -- Review before public. Admins (and the service role) publish directly.
  if uid is null then
    new.status := coalesce(new.status, 'visible');
  elsif public.community_is_admin(uid) then
    new.status := 'visible';
  else
    new.status := case when new.visibility = 'public' then 'pending' else 'visible' end;
  end if;
  new.reviewed_at := null;
  new.created_at := now();
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.community_topics_before_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  trusted boolean := uid is null or public.community_is_admin(uid);
  problem text;
begin
  new.id := old.id;
  new.slug := old.slug;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  new.name := regexp_replace(btrim(new.name), '\s+', ' ', 'g');
  new.description := nullif(regexp_replace(btrim(coalesce(new.description, '')), '\s+', ' ', 'g'), '');
  if new.name is distinct from old.name or new.description is distinct from old.description then
    problem := coalesce(public.community_topic_text_problem(new.name), public.community_topic_text_problem(new.description));
    if problem is not null then raise exception 'community_topic_%', problem using errcode = 'P0001'; end if;
  end if;
  if new.visibility <> 'public' then new.creator_anonymous := false; end if;
  if not trusted then
    -- Only admins approve or hide. A topic made public again goes back to review.
    new.status := old.status;
    new.reviewed_at := old.reviewed_at;
    if new.visibility = 'public' and old.visibility <> 'public' and old.status <> 'hidden' then
      new.status := 'pending';
    end if;
    -- Friends-only and private topics don't wait for review.
    if new.visibility <> 'public' and old.status = 'pending' then
      new.status := 'visible';
    end if;
    -- An approved public topic renamed by its owner is checked again.
    if old.visibility = 'public' and old.status = 'visible'
       and (new.name is distinct from old.name or new.description is distinct from old.description) then
      new.status := 'pending';
    end if;
  elsif new.status is distinct from old.status then
    new.reviewed_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Contrast and cover checks (insert and update).
create or replace function public.community_topics_check_style()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owns boolean := true;
begin
  if new.cover_image_url is not null then
    -- On a photo the title sits on an espresso or butter scrim.
    if new.text_color not in ('#ffedac', '#3e2723') then
      raise exception 'community_topic_contrast' using errcode = 'P0001';
    end if;
    if auth.uid() is not null and (tg_op = 'INSERT' or new.cover_image_url is distinct from old.cover_image_url)
       and to_regclass('storage.objects') is not null then
      execute 'select exists (select 1 from storage.objects o where o.bucket_id = $1 and o.name = $2 and o.owner = $3)'
        into owns using 'community-media', new.cover_image_url, auth.uid();
      if not owns then raise exception 'community_media_not_found' using errcode = 'P0001'; end if;
    end if;
  elsif public.community_contrast_ratio(new.text_color, new.cover_color) < 4.5 then
    raise exception 'community_topic_contrast' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- The creator becomes the owner member.
create or replace function public.community_topics_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('ayna.topic_member_write', 'on', true);
  insert into public.community_topic_members (topic_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict (topic_id, user_id) do update set role = 'owner';
  perform set_config('ayna.topic_member_write', '', true);
  return null;
end;
$$;

drop trigger if exists community_topics_bi on public.community_topics;
create trigger community_topics_bi before insert on public.community_topics
  for each row execute function public.community_topics_before_insert();
drop trigger if exists community_topics_bu on public.community_topics;
create trigger community_topics_bu before update on public.community_topics
  for each row execute function public.community_topics_before_update();
drop trigger if exists community_topics_style on public.community_topics;
create trigger community_topics_style before insert or update on public.community_topics
  for each row execute function public.community_topics_check_style();
drop trigger if exists community_topics_ai on public.community_topics;
create trigger community_topics_ai after insert on public.community_topics
  for each row execute function public.community_topics_after_insert();

-- Members: self-joins are plain members of topics she can see (not private,
-- not blocked). Roles change only through the owner; the owner row is fixed.
create or replace function public.community_topic_members_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  t record;
  internal boolean := coalesce(current_setting('ayna.topic_member_write', true), '') = 'on';
begin
  if tg_op = 'INSERT' then
    if internal or auth.uid() is null then return new; end if;
    select * into t from public.community_topics where id = new.topic_id;
    if t.id is null or t.status = 'hidden' then raise exception 'community_topic_unavailable' using errcode = 'P0001'; end if;
    if new.user_id <> auth.uid() then raise exception 'community_topic_unavailable' using errcode = 'P0001'; end if;
    if public.community_user_is_guest(new.user_id) then raise exception 'community_guest_unavailable' using errcode = 'P0001'; end if;
    if t.visibility = 'private' then raise exception 'community_invite_invalid' using errcode = 'P0001'; end if;
    if not public.community_can_view_topic(t.id) then raise exception 'community_topic_unavailable' using errcode = 'P0001'; end if;
    new.role := 'member';
    new.joined_at := now();
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.topic_id := old.topic_id;
    new.user_id := old.user_id;
    new.joined_at := old.joined_at;
    if internal or auth.uid() is null then return new; end if;
    if old.role = 'owner' or new.role = 'owner' then raise exception 'community_not_topic_owner' using errcode = 'P0001'; end if;
    if public.community_is_blocked(auth.uid(), new.user_id) then raise exception 'community_blocked' using errcode = 'P0001'; end if;
    return new;
  end if;
  -- DELETE: the owner can't leave her own topic (she deletes it instead).
  if old.role = 'owner' and not internal and auth.uid() is not null
     and exists (select 1 from public.community_topics x where x.id = old.topic_id) then
    raise exception 'community_owner_cannot_leave' using errcode = 'P0001';
  end if;
  return old;
end;
$$;
drop trigger if exists community_topic_members_bi on public.community_topic_members;
create trigger community_topic_members_bi before insert on public.community_topic_members
  for each row execute function public.community_topic_members_guard();
drop trigger if exists community_topic_members_bu on public.community_topic_members;
create trigger community_topic_members_bu before update on public.community_topic_members
  for each row execute function public.community_topic_members_guard();
drop trigger if exists community_topic_members_bd on public.community_topic_members;
create trigger community_topic_members_bd before delete on public.community_topic_members
  for each row execute function public.community_topic_members_guard();

-- Posting into a topic needs the right to post there. Authors can always
-- take their own post out of a topic (topic_id back to null).
create or replace function public.community_posts_topic_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.topic_id is null then return new; end if;
  if tg_op = 'UPDATE' and new.topic_id is not distinct from old.topic_id then return new; end if;
  if auth.uid() is not null and not public.community_can_post_in_topic(new.topic_id) then
    raise exception 'community_topic_unavailable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
drop trigger if exists community_posts_topic_guard on public.community_posts;
create trigger community_posts_topic_guard before insert or update of topic_id on public.community_posts
  for each row execute function public.community_posts_topic_guard();

-- ── Functions clients call ─────────────────────────────────────────────────
-- Owner or co-owner edits. Validated again by the update triggers above.
create or replace function public.community_update_topic(
  tid uuid,
  p_name text,
  p_description text,
  p_cover_image_url text,
  p_cover_color text,
  p_title_font text,
  p_text_color text,
  p_visibility text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or public.community_is_guest() then
    raise exception 'community_guest_unavailable' using errcode = 'P0001';
  end if;
  if not public.community_is_topic_manager(tid) then
    raise exception 'community_not_topic_owner' using errcode = 'P0001';
  end if;
  -- Only the owner changes who can see it.
  if p_visibility is distinct from (select t.visibility from public.community_topics t where t.id = tid)
     and not exists (select 1 from public.community_topics t where t.id = tid and t.created_by = auth.uid()) then
    raise exception 'community_not_topic_owner' using errcode = 'P0001';
  end if;
  update public.community_topics t set
    name = p_name,
    description = p_description,
    cover_image_url = p_cover_image_url,
    cover_color = coalesce(p_cover_color, t.cover_color),
    title_font = coalesce(p_title_font, t.title_font),
    text_color = coalesce(p_text_color, t.text_color),
    visibility = coalesce(p_visibility, t.visibility)
  where t.id = tid;
  return tid;
end;
$$;

-- Owner or co-owner takes a post out of their topic. The post stays the
-- author's post everywhere else.
create or replace function public.community_remove_post_from_topic(pid uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  tid uuid;
begin
  select p.topic_id into tid from public.community_posts p where p.id = pid;
  if tid is null then return false; end if;
  if not public.community_is_topic_manager(tid) then
    raise exception 'community_not_topic_owner' using errcode = 'P0001';
  end if;
  update public.community_posts set topic_id = null where id = pid;
  return true;
end;
$$;

-- Owner or co-owner: the topic's invite code (made on first use). Only the
-- owner can rotate it (old links stop working).
create or replace function public.community_topic_invite_code(tid uuid, rotate boolean default false)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  result text;
begin
  if auth.uid() is null or public.community_is_guest() then
    raise exception 'community_guest_unavailable' using errcode = 'P0001';
  end if;
  if not public.community_is_topic_manager(tid) then
    raise exception 'community_not_topic_owner' using errcode = 'P0001';
  end if;
  if rotate then
    if not exists (select 1 from public.community_topics t where t.id = tid and t.created_by = auth.uid()) then
      raise exception 'community_not_topic_owner' using errcode = 'P0001';
    end if;
    -- New code in place, no row deletes: old links stop working.
    update public.community_topic_invites
      set code = lower(replace(gen_random_uuid()::text, '-', '')), created_at = now()
      where topic_id = tid;
  end if;
  select i.code into result from public.community_topic_invites i where i.topic_id = tid;
  if result is null then
    result := lower(replace(gen_random_uuid()::text, '-', ''));
    insert into public.community_topic_invites (topic_id, code) values (tid, result);
  end if;
  return result;
end;
$$;

-- Anyone signed in (not a guest) holding the code joins as a member.
create or replace function public.join_topic_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  tid uuid;
  creator uuid;
  st text;
begin
  if auth.uid() is null or public.community_is_guest() then
    raise exception 'community_guest_unavailable' using errcode = 'P0001';
  end if;
  select i.topic_id, t.created_by, t.status into tid, creator, st
    from public.community_topic_invites i
    join public.community_topics t on t.id = i.topic_id
   where i.code = lower(btrim(coalesce(join_topic_by_code.code, '')));
  if tid is null or st = 'hidden' then raise exception 'community_invite_invalid' using errcode = 'P0001'; end if;
  if public.community_is_blocked(creator, auth.uid()) then raise exception 'community_invite_invalid' using errcode = 'P0001'; end if;
  perform set_config('ayna.topic_member_write', 'on', true);
  insert into public.community_topic_members (topic_id, user_id, role) values (tid, auth.uid(), 'member')
    on conflict (topic_id, user_id) do nothing;
  perform set_config('ayna.topic_member_write', '', true);
  return tid;
end;
$$;

revoke execute on function public.community_update_topic(uuid, text, text, text, text, text, text, text) from public, anon;
revoke execute on function public.community_remove_post_from_topic(uuid) from public, anon;
revoke execute on function public.community_topic_invite_code(uuid, boolean) from public, anon;
revoke execute on function public.join_topic_by_code(text) from public, anon;
grant execute on function public.community_update_topic(uuid, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.community_remove_post_from_topic(uuid) to authenticated;
grant execute on function public.community_topic_invite_code(uuid, boolean) to authenticated;
grant execute on function public.join_topic_by_code(text) to authenticated;
grant execute on function public.community_topic_role(uuid) to anon, authenticated;
grant execute on function public.community_is_topic_manager(uuid) to anon, authenticated;
grant execute on function public.community_can_view_topic(uuid) to anon, authenticated;
grant execute on function public.community_can_post_in_topic(uuid) to anon, authenticated;
grant execute on function public.community_hex_luminance(text) to anon, authenticated;
grant execute on function public.community_contrast_ratio(text, text) to anon, authenticated;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.community_topics enable row level security;
alter table public.community_topic_members enable row level security;
alter table public.community_topic_invites enable row level security;

-- Topics: clients read through community_feed_topics. On the base table she
-- sees only the topics she created (so the creator stays hidden from
-- everyone else). Edits go through community_update_topic; status is
-- admin / service role only.
revoke all on public.community_topics from anon, authenticated;
grant select, insert, delete on public.community_topics to authenticated;
grant all on public.community_topics to service_role;
drop policy if exists community_topics_select_own on public.community_topics;
create policy community_topics_select_own on public.community_topics
  for select to authenticated using (created_by = auth.uid());
drop policy if exists community_topics_insert_own on public.community_topics;
create policy community_topics_insert_own on public.community_topics
  for insert to authenticated with check (created_by = auth.uid());
drop policy if exists community_topics_delete_owner on public.community_topics;
create policy community_topics_delete_owner on public.community_topics
  for delete to authenticated using (created_by = auth.uid());

-- Members: she sees her own rows; the owner sees everyone in her topic.
revoke all on public.community_topic_members from anon, authenticated;
grant select, insert, delete on public.community_topic_members to authenticated;
grant update (role) on public.community_topic_members to authenticated;
grant all on public.community_topic_members to service_role;
drop policy if exists community_topic_members_select on public.community_topic_members;
create policy community_topic_members_select on public.community_topic_members
  for select to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.community_topics t where t.id = topic_id and t.created_by = auth.uid()));
drop policy if exists community_topic_members_insert on public.community_topic_members;
create policy community_topic_members_insert on public.community_topic_members
  for insert to authenticated with check (user_id = auth.uid() and role = 'member');
-- Only the owner promotes a member to co-owner or back.
drop policy if exists community_topic_members_update on public.community_topic_members;
create policy community_topic_members_update on public.community_topic_members
  for update to authenticated
  using (exists (select 1 from public.community_topics t where t.id = topic_id and t.created_by = auth.uid()))
  with check (role in ('coowner', 'member'));
-- She leaves; the owner removes anyone else.
drop policy if exists community_topic_members_delete on public.community_topic_members;
create policy community_topic_members_delete on public.community_topic_members
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.community_topics t where t.id = topic_id and t.created_by = auth.uid()));

-- Invite codes: no direct access; minted and read by the functions above.
revoke all on public.community_topic_invites from anon, authenticated;
grant all on public.community_topic_invites to service_role;

-- Accounts only (same pattern as community.sql): guests never write here.
do $$
declare
  t text;
  cmd text;
begin
  foreach t in array array['community_topics', 'community_topic_members'] loop
    foreach cmd in array array['insert', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', t || '_no_guests_' || cmd, t);
      if cmd = 'insert' then
        execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (not public.community_is_guest())', t || '_no_guests_' || cmd, t);
      else
        execute format('create policy %I on public.%I as restrictive for delete to authenticated using (not public.community_is_guest())', t || '_no_guests_' || cmd, t);
      end if;
    end loop;
  end loop;
end $$;

-- Posts can be moved into or out of a topic by their author.
grant update (topic_id) on public.community_posts to authenticated;

-- ── Topic view ─────────────────────────────────────────────────────────────
-- Owner-rights view (like community_feed_posts): the only read path for
-- other people's topics. An anonymous creator is masked for everyone but
-- herself; blocks don't filter anonymous topics (that would unmask them).
create or replace view public.community_feed_topics
with (security_barrier = true) as
select t.id,
  t.slug,
  t.name,
  t.description,
  t.cover_image_url,
  t.cover_color,
  t.title_font,
  t.text_color,
  t.visibility,
  t.status,
  t.creator_anonymous,
  case when t.creator_anonymous and t.created_by is distinct from auth.uid() then null::uuid else t.created_by end as created_by,
  case when t.creator_anonymous and t.created_by is distinct from auth.uid() then null::text else pr.username end as creator_username,
  case when t.creator_anonymous and t.created_by is distinct from auth.uid() then null::text else pr.display_name end as creator_display_name,
  coalesce(t.created_by = auth.uid(), false) as is_mine,
  case when t.created_by = auth.uid() then 'owner' else public.community_topic_role(t.id) end as my_role,
  (select count(*)::int from public.community_topic_members m where m.topic_id = t.id) as member_count,
  (select count(*)::int from public.community_posts p where p.topic_id = t.id and p.status = 'visible') as post_count,
  t.created_at,
  t.updated_at
from public.community_topics t
left join public.community_profiles pr on pr.user_id = t.created_by
where public.community_can_view_topic(t.id);

grant select on public.community_feed_topics to anon, authenticated;

-- ── Feed views: hide posts of topics the viewer can't see ──────────────────
-- Rebuilt from the live definitions so nothing else in them changes: adds
-- topic_id as the last column and one AND filter. Skipped when already done.
do $$
declare
  def text;
  next_def text;
  orig_path text := current_setting('search_path');
begin
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'community_feed_posts' and column_name = 'topic_id') then
    perform set_config('search_path', '', true);
    def := pg_get_viewdef('public.community_feed_posts'::regclass, true);
    def := regexp_replace(def, ';\s*$', '');
    next_def := regexp_replace(def, '\s+FROM\s+(public\.)?community_posts\s+p\s+LEFT\s+JOIN', E',\n    p.topic_id\n   FROM public.community_posts p\n     LEFT JOIN', 'i');
    if next_def = def or def !~* '\sWHERE\s' then
      raise exception 'community_feed_posts has an unexpected shape; not changing it';
    end if;
    next_def := next_def || E'\n  AND (p.topic_id IS NULL OR public.community_can_view_topic(p.topic_id) OR p.author_id = auth.uid())';
    execute 'create or replace view public.community_feed_posts with (security_barrier = true) as ' || next_def;
    perform set_config('search_path', orig_path, true);
  end if;

  if to_regclass('public.community_feed_comments') is not null
     and not exists (select 1 from information_schema.columns
                      where table_schema = 'public' and table_name = 'community_feed_comments' and column_name = 'topic_id') then
    perform set_config('search_path', '', true);
    def := pg_get_viewdef('public.community_feed_comments'::regclass, true);
    def := regexp_replace(def, ';\s*$', '');
    next_def := regexp_replace(def, '\s+FROM\s+(public\.)?community_comments\s+c\s+JOIN', E',\n    p.topic_id\n   FROM public.community_comments c\n     JOIN', 'i');
    if next_def = def or def !~* '\sWHERE\s' then
      raise exception 'community_feed_comments has an unexpected shape; not changing it';
    end if;
    next_def := next_def || E'\n  AND (p.topic_id IS NULL OR public.community_can_view_topic(p.topic_id) OR c.author_id = auth.uid())';
    execute 'create or replace view public.community_feed_comments with (security_barrier = true) as ' || next_def;
    perform set_config('search_path', orig_path, true);
  end if;
end $$;

grant select on public.community_feed_posts to anon, authenticated;
grant select on public.community_feed_comments to anon, authenticated;

-- ── Reports: topics ────────────────────────────────────────────────────────
alter table public.community_reports
  add column if not exists topic_id uuid references public.community_topics(id) on delete cascade;
alter table public.community_reports drop constraint if exists community_reports_target_type_check;
alter table public.community_reports add constraint community_reports_target_type_check
  check (target_type in ('post', 'comment', 'user', 'playlist', 'topic'));
alter table public.community_reports drop constraint if exists community_reports_target;
alter table public.community_reports add constraint community_reports_target check (
  (target_type = 'post' and post_id is not null)
  or (target_type = 'comment' and comment_id is not null)
  or (target_type = 'playlist' and playlist_id is not null)
  or (target_type = 'user' and reported_user_id is not null)
  or (target_type = 'topic' and topic_id is not null)
);
create index if not exists community_reports_topic_idx on public.community_reports (topic_id) where topic_id is not null;

-- ── Suggestions: reviewed in the admin screen ─────────────────────────────
do $$
begin
  if to_regclass('public.suggestions') is null then
    raise notice 'suggestions does not exist yet, run migrations/20261013130000_suggestions.sql first';
    return;
  end if;
  alter table public.suggestions add column if not exists reviewed_at timestamptz;
end $$;

commit;

-- Check after running:
--   select id, name, visibility, status from public.community_topics order by created_at desc limit 5;
--   select column_name from information_schema.columns where table_name = 'community_feed_posts' and column_name = 'topic_id';
--   select public.community_contrast_ratio('#ffedac', '#f7badd');  -- about 1.4, fails 4.5

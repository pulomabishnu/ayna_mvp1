-- Community layer: questions, reviews, posts, comments, product tags, follows,
-- friends, helpful votes, saves, playlists, friend recommendations,
-- notifications, reports and blocks.
--
-- Idempotent like every other file here. Apply AFTER product_catalog.sql
-- (posts, comments, playlist items and recommendations reference real
-- product_catalog rows — there is no way to tag or review a product that is
-- not in the catalog) and BEFORE community_storage.sql.
--
-- ── Privacy model ────────────────────────────────────────────────────────────
-- 1. Nothing here stores health-profile data. Intake answers, conditions,
--    symptoms and ecosystem rows stay in their own owner-only tables. The
--    viewer's "% match" is computed in the viewer's own browser from their own
--    profile; no match inputs or scores are ever written to these tables.
--
-- 2. Anonymous posts and comments. The base tables keep author_id (needed for
--    moderation, rate limits, and so the author can edit/delete), but their
--    SELECT policy only returns a user's OWN rows. Everyone else reads through
--    community_feed_posts / community_feed_comments, which null out author_id
--    and every author profile field when is_anonymous is true. Those views run
--    with their owner's rights (deliberately NOT security_invoker) — that is
--    what lets them show other people's posts at all while the base tables
--    stay locked. Notifications triggered by an anonymous comment are written
--    with actor_id = null for the same reason.
--
-- 3. Counters (helpful_count, comment_count, save_count, item_count) are
--    maintained by triggers and are not in any column-level UPDATE grant, so
--    a client cannot inflate them. Moderation status is service-role only.
--
-- 4. Writes that create rows for OTHER people (notifications) happen only in
--    security-definer triggers; authenticated has no INSERT on that table.

-- ── Profiles ─────────────────────────────────────────────────────────────────
create table if not exists public.community_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  display_name text not null,
  bio text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_profiles_username_format check (username ~ '^[a-z0-9_.]{3,24}$'),
  constraint community_profiles_display_name_len check (char_length(btrim(display_name)) between 1 and 50),
  constraint community_profiles_bio_len check (bio is null or char_length(bio) <= 160)
);
create unique index if not exists community_profiles_username_key on public.community_profiles (username);
-- Public interests are chosen by the user on their profile. They are NEVER
-- filled from the private health intake.
alter table public.community_profiles add column if not exists public_interests text[] not null default '{}';
alter table public.community_profiles add column if not exists username_changed_at timestamptz;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'community_profiles_interests_max') then
    alter table public.community_profiles add constraint community_profiles_interests_max
      check (coalesce(array_length(public_interests, 1), 0) <= 8);
  end if;
  -- avatar_url holds a storage PATH in this project's community-media bucket,
  -- inside the owner's own folder; the client turns it into a URL. A full URL
  -- is rejected, so nobody can point their avatar at a third-party tracking
  -- pixel or at someone else's photo.
  if not exists (select 1 from pg_constraint where conname = 'community_profiles_avatar_path') then
    alter table public.community_profiles add constraint community_profiles_avatar_path
      check (avatar_url is null or avatar_url ~ ('^avatars/' || user_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|webp|png)$'));
  end if;
end $$;
create extension if not exists pg_trgm;
create index if not exists community_profiles_search_idx
  on public.community_profiles using gin ((username || ' ' || display_name) gin_trgm_ops);

-- ── Posts (question | review | post) ─────────────────────────────────────────
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('question', 'review', 'post')),
  body text not null,
  topics text[] not null default '{}',
  is_anonymous boolean not null default false,
  -- Reviews: the reviewed product, a 1–5 rating and an optional "would recommend".
  product_id text references public.product_catalog(id) on delete restrict,
  rating smallint,
  would_recommend boolean,
  photo_url text,
  helpful_count integer not null default 0,
  comment_count integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint community_posts_body_len check (char_length(btrim(body)) between 1 and 5000),
  constraint community_posts_topics_max check (coalesce(array_length(topics, 1), 0) <= 5),
  constraint community_posts_review_shape check (
    (kind = 'review' and product_id is not null and rating between 1 and 5)
    or (kind <> 'review' and rating is null and would_recommend is null)
  ),
  constraint community_posts_photo_url check (photo_url is null or photo_url ~ '^https://')
);
create index if not exists community_posts_feed_idx on public.community_posts (created_at desc, id desc) where status = 'visible';
create index if not exists community_posts_kind_idx on public.community_posts (kind, created_at desc) where status = 'visible';
create index if not exists community_posts_author_idx on public.community_posts (author_id, created_at desc);
create index if not exists community_posts_product_idx on public.community_posts (product_id) where product_id is not null;
create index if not exists community_posts_topics_idx on public.community_posts using gin (topics);
create index if not exists community_posts_helpful_idx on public.community_posts (helpful_count desc, created_at desc) where status = 'visible';
create index if not exists community_posts_search_idx on public.community_posts using gin (body gin_trgm_ops);

-- Products tagged in a post (beyond a review's own product). Max 3 per post.
create table if not exists public.community_post_products (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  product_id text not null references public.product_catalog(id) on delete restrict,
  position smallint not null default 0,
  primary key (post_id, product_id)
);
create index if not exists community_post_products_product_idx on public.community_post_products (product_id);

-- Photos attached to a post (max 4). Video lands here later with kind='video'.
-- storage_path is posts/<random uuid>.<ext> — deliberately no user id in it,
-- because an anonymous post's image URL must not name its author. Ownership of
-- the upload is checked against storage.objects.owner in the insert trigger.
create table if not exists public.community_post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null default 'image' check (kind in ('image')),
  storage_path text not null,
  width integer check (width is null or width between 1 and 10000),
  height integer check (height is null or height between 1 and 10000),
  position smallint not null default 0 check (position between 0 and 9),
  status text not null default 'published' check (status in ('published', 'pending', 'removed')),
  created_at timestamptz not null default now(),
  constraint community_post_media_path check (storage_path ~ '^posts/[0-9a-f-]{36}\.(jpg|jpeg|webp|png)$')
);
create unique index if not exists community_post_media_path_key on public.community_post_media (storage_path);
create index if not exists community_post_media_post_idx on public.community_post_media (post_id, position);
create index if not exists community_post_media_owner_idx on public.community_post_media (owner_id);

-- ── Comments (one level of nesting) ──────────────────────────────────────────
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  parent_id uuid references public.community_comments(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  product_id text references public.product_catalog(id) on delete restrict,
  is_anonymous boolean not null default false,
  helpful_count integer not null default 0,
  status text not null default 'visible' check (status in ('visible', 'hidden', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  edited_at timestamptz,
  constraint community_comments_body_len check (char_length(btrim(body)) between 1 and 2000)
);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);
create index if not exists community_comments_author_idx on public.community_comments (author_id, created_at desc);

-- ── Helpful votes, saves, hides ──────────────────────────────────────────────
create table if not exists public.community_helpful_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_helpful_votes_one_target check ((post_id is null) <> (comment_id is null))
);
create unique index if not exists community_helpful_votes_post_key on public.community_helpful_votes (user_id, post_id) where post_id is not null;
create unique index if not exists community_helpful_votes_comment_key on public.community_helpful_votes (user_id, comment_id) where comment_id is not null;

create table if not exists public.community_saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- "Hide this post" — the way to get rid of an anonymous author's post without
-- a block (a block row would name the anonymous author to the blocker).
create table if not exists public.community_hidden_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ── Social graph ─────────────────────────────────────────────────────────────
create table if not exists public.community_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followee_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint community_follows_not_self check (follower_id <> followee_id)
);
create index if not exists community_follows_followee_idx on public.community_follows (followee_id);

create table if not exists public.community_friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  constraint community_friend_requests_not_self check (requester_id <> addressee_id)
);
-- One relationship per pair, whichever direction it was requested in.
create unique index if not exists community_friend_requests_pair_key
  on public.community_friend_requests (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists community_friend_requests_addressee_idx on public.community_friend_requests (addressee_id, status);
create index if not exists community_friend_requests_requester_idx on public.community_friend_requests (requester_id, status);

create table if not exists public.community_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint community_blocks_not_self check (blocker_id <> blocked_id)
);
create index if not exists community_blocks_blocked_idx on public.community_blocks (blocked_id);

-- ── Playlists ────────────────────────────────────────────────────────────────
create table if not exists public.community_playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  cover_url text,
  visibility text not null default 'public' check (visibility in ('public', 'private')),
  item_count integer not null default 0,
  save_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_playlists_title_len check (char_length(btrim(title)) between 1 and 80),
  constraint community_playlists_description_len check (description is null or char_length(description) <= 300),
  constraint community_playlists_cover_url check (cover_url is null or cover_url ~ '^https://')
);
create index if not exists community_playlists_owner_idx on public.community_playlists (owner_id, updated_at desc);
create index if not exists community_playlists_public_idx on public.community_playlists (updated_at desc) where visibility = 'public';
create index if not exists community_playlists_popular_idx on public.community_playlists (save_count desc, updated_at desc) where visibility = 'public';
create index if not exists community_playlists_search_idx on public.community_playlists using gin (title gin_trgm_ops);

create table if not exists public.community_playlist_items (
  playlist_id uuid not null references public.community_playlists(id) on delete cascade,
  product_id text not null references public.product_catalog(id) on delete restrict,
  note text,
  position integer not null default 0,
  added_at timestamptz not null default now(),
  primary key (playlist_id, product_id),
  constraint community_playlist_items_note_len check (note is null or char_length(note) <= 200)
);
create index if not exists community_playlist_items_product_idx on public.community_playlist_items (product_id);

create table if not exists public.community_playlist_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  playlist_id uuid not null references public.community_playlists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, playlist_id)
);
create index if not exists community_playlist_saves_playlist_idx on public.community_playlist_saves (playlist_id);

-- ── Friend → friend product recommendations ─────────────────────────────────
create table if not exists public.community_product_recommendations (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.product_catalog(id) on delete restrict,
  note text,
  created_at timestamptz not null default now(),
  seen_at timestamptz,
  constraint community_product_recommendations_not_self check (sender_id <> recipient_id),
  constraint community_product_recommendations_note_len check (note is null or char_length(note) <= 280)
);
create index if not exists community_product_recommendations_recipient_idx on public.community_product_recommendations (recipient_id, created_at desc);
create index if not exists community_product_recommendations_sender_idx on public.community_product_recommendations (sender_id, created_at desc);

-- ── Notifications (in-app only) ──────────────────────────────────────────────
create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  -- null when the action came from an anonymous post/comment.
  actor_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in (
    'follow', 'friend_request', 'friend_accepted', 'comment', 'reply',
    'helpful', 'recommendation', 'playlist_saved'
  )),
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  playlist_id uuid references public.community_playlists(id) on delete cascade,
  recommendation_id uuid references public.community_product_recommendations(id) on delete cascade,
  product_id text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists community_notifications_recipient_idx on public.community_notifications (recipient_id, created_at desc);
create index if not exists community_notifications_unread_idx on public.community_notifications (recipient_id) where read_at is null;

-- ── Reports (reviewed later in an admin dashboard via the service role) ─────
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user', 'playlist')),
  post_id uuid references public.community_posts(id) on delete cascade,
  comment_id uuid references public.community_comments(id) on delete cascade,
  playlist_id uuid references public.community_playlists(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'harassment', 'misinformation', 'unsafe_advice', 'self_harm', 'privacy', 'other')),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewing', 'actioned', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  constraint community_reports_details_len check (details is null or char_length(details) <= 1000),
  constraint community_reports_target check (
    (target_type = 'post' and post_id is not null)
    or (target_type = 'comment' and comment_id is not null)
    or (target_type = 'playlist' and playlist_id is not null)
    or (target_type = 'user' and reported_user_id is not null)
  )
);
create index if not exists community_reports_open_idx on public.community_reports (status, created_at) where status in ('open', 'reviewing');

-- ═════════════════════════════════════════════════════════════════════════════
-- Helper functions
-- ═════════════════════════════════════════════════════════════════════════════

-- Security definer so policies can ask "are these two friends?" without the
-- caller being able to read other people's friend rows.
create or replace function public.community_are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_friend_requests f
     where f.status = 'accepted'
       and least(f.requester_id, f.addressee_id) = least(a, b)
       and greatest(f.requester_id, f.addressee_id) = greatest(a, b)
  );
$$;

-- Either direction of a block hides content both ways.
create or replace function public.community_is_blocked(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_blocks bl
     where (bl.blocker_id = a and bl.blocked_id = b)
        or (bl.blocker_id = b and bl.blocked_id = a)
  );
$$;

-- Public counts for a profile header. Friend rows themselves stay private to
-- the two people involved; only the count is exposed.
create or replace function public.community_profile_stats(target uuid)
returns table (followers integer, following integer, friends integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::int from public.community_follows f where f.followee_id = target),
    (select count(*)::int from public.community_follows f where f.follower_id = target),
    (select count(*)::int from public.community_friend_requests r
       where r.status = 'accepted' and (r.requester_id = target or r.addressee_id = target));
$$;

-- ── Viewer-scoped helpers (the only helpers clients may call) ───────────────
-- A guest is a Supabase anonymous sign-in: a real auth.uid() (so ownership,
-- RLS and rate limits work) whose JWT carries is_anonymous = true. Guests may
-- post and comment anonymously and report; everything social needs an account.
create or replace function public.community_is_guest()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;

-- "Is there a block between me and this person?" False when signed out.
create or replace function public.community_viewer_blocked(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and other is not null and exists (
    select 1 from public.community_blocks bl
     where (bl.blocker_id = auth.uid() and bl.blocked_id = other)
        or (bl.blocker_id = other and bl.blocked_id = auth.uid())
  );
$$;

create or replace function public.community_viewer_is_friend(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and other is not null and exists (
    select 1 from public.community_friend_requests f
     where f.status = 'accepted'
       and least(f.requester_id, f.addressee_id) = least(auth.uid(), other)
       and greatest(f.requester_id, f.addressee_id) = greatest(auth.uid(), other)
  );
$$;

-- Server-side truth for "is this user a guest", for definer triggers (reads
-- auth.users rather than trusting the token).
create or replace function public.community_user_is_guest(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select u.is_anonymous from auth.users u where u.id = uid), false);
$$;
revoke execute on function public.community_user_is_guest(uuid) from public, anon, authenticated;

-- ── Usernames ───────────────────────────────────────────────────────────────
-- Format is enforced by the table constraint (lowercase a-z 0-9 _ . so
-- uniqueness is case-insensitive by construction). This adds reserved names,
-- impersonation of ayna/staff/clinicians, a short abuse list, and a 30-day
-- cooldown between changes. Mirrored client-side in
-- src/utils/community/username.js for instant feedback; this is the authority.
create or replace function public.community_username_problem(u text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  bare text := regexp_replace(lower(coalesce(u, '')), '[._0-9]', '', 'g');
begin
  if u is null or u !~ '^[a-z0-9_.]{3,24}$' then return 'format'; end if;
  if u ~ '^[._]|[._]$' or u ~ '[._]{2}' then return 'format'; end if;
  if u = any (array[
    'ayna','aynahealth','admin','administrator','root','system','support','help','helpdesk','mod','moderator',
    'moderators','staff','team','official','security','privacy','legal','abuse','report','reports','anonymous',
    'anon','guest','null','undefined','me','you','settings','community','search','notifications','post','posts',
    'u','playlist','playlists','rec','api','www','mail','billing','account','login','signup','verified',
    'doctor','doctors','dr','md','do','rn','np','pa','nurse','obgyn','ob_gyn','gyn','gynecologist','physician',
    'clinician','midwife','therapist','pharmacist','dietitian','nutritionist','medic','fda','cdc','who','nih'
  ]) then return 'reserved'; end if;
  if bare ~ '^ayna' or bare ~ '(admin|moderator|support|official|verified)' then return 'reserved'; end if;
  if u ~ '^(dr|doc|doctor)[._]' or u ~ '[._](md|do|rn|np|dnp|phd|obgyn)$'
     or bare ~ '(doctor|physician|clinician|obgyn|gynecolog|midwife|pharmacist|dietitian|nurse)' then
    return 'clinician';
  end if;
  if bare ~ '(fuck|shit|cunt|bitch|whore|slut|nigg|faggot|retard|rapist|nazi|porn)' then return 'abuse'; end if;
  return null;
end;
$$;

create or replace function public.community_profiles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  problem text;
begin
  new.username := lower(btrim(new.username));
  new.display_name := btrim(new.display_name);
  if tg_op = 'INSERT' or new.username is distinct from old.username then
    problem := public.community_username_problem(new.username);
    if problem is not null then
      raise exception 'community_username_%', problem using errcode = 'P0001';
    end if;
  end if;
  if new.display_name ~* '(^|\W)(admin|administrator|moderator)(\W|$)'
     or new.display_name ~* 'ayna\s*(team|official|support|staff|admin|health)' then
    raise exception 'community_display_name_reserved' using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and new.username is distinct from old.username then
    if old.username_changed_at is not null and old.username_changed_at > now() - interval '30 days' then
      raise exception 'community_username_cooldown' using errcode = 'P0001';
    end if;
    new.username_changed_at := now();
  end if;
  if tg_op = 'INSERT' then new.username_changed_at := null; end if;
  new.public_interests := coalesce(
    (select array_agg(distinct lower(btrim(t))) from unnest(new.public_interests) t where lower(btrim(t)) ~ '^[a-z0-9-]{2,30}$'),
    '{}'
  );
  return new;
end;
$$;

create or replace function public.community_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Single place notifications are created. Never notifies yourself, and never
-- notifies across a block.
create or replace function public.community_notify(
  p_recipient uuid, p_actor uuid, p_type text,
  p_post uuid default null, p_comment uuid default null, p_playlist uuid default null,
  p_recommendation uuid default null, p_product text default null,
  p_actor_hidden boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient is null or p_recipient = p_actor then return; end if;
  if p_actor is not null and public.community_is_blocked(p_recipient, p_actor) then return; end if;
  -- Guests have no inbox (and nothing should accumulate against a guest id).
  if public.community_user_is_guest(p_recipient) then return; end if;
  insert into public.community_notifications
    (recipient_id, actor_id, type, post_id, comment_id, playlist_id, recommendation_id, product_id)
  values
    (p_recipient, case when p_actor_hidden then null else p_actor end, p_type,
     p_post, p_comment, p_playlist, p_recommendation, p_product);
end;
$$;

-- ── Post/comment guards ─────────────────────────────────────────────────────
-- Flood control: a burst limit that no real person hits, so a compromised or
-- scripted account cannot spam the feed.
create or replace function public.community_posts_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
begin
  select count(*) into recent from public.community_posts
   where author_id = new.author_id and created_at > now() - interval '1 hour';
  if recent >= (case when public.community_user_is_guest(new.author_id) then 5 else 20 end) then
    raise exception 'community_rate_limited' using errcode = 'P0001';
  end if;
  new.status := 'visible';
  new.helpful_count := 0;
  new.comment_count := 0;
  new.topics := coalesce((select array_agg(distinct lower(btrim(t))) from unnest(new.topics) t where btrim(t) <> ''), '{}');
  return new;
end;
$$;

create or replace function public.community_posts_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body or new.rating is distinct from old.rating then
    new.edited_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.community_comments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent integer;
  parent_post uuid;
  parent_parent uuid;
  post_author uuid;
  post_status text;
  post_anonymous boolean;
begin
  select count(*) into recent from public.community_comments
   where author_id = new.author_id and created_at > now() - interval '1 hour';
  if recent >= (case when public.community_user_is_guest(new.author_id) then 20 else 60 end) then
    raise exception 'community_rate_limited' using errcode = 'P0001';
  end if;

  select p.author_id, p.status, p.is_anonymous into post_author, post_status, post_anonymous from public.community_posts p where p.id = new.post_id;
  if post_status is distinct from 'visible' then
    raise exception 'community_post_unavailable' using errcode = 'P0001';
  end if;
  -- Blocks never apply to anonymous posts (see the views below for why).
  if not post_anonymous and public.community_is_blocked(post_author, new.author_id) then
    raise exception 'community_post_unavailable' using errcode = 'P0001';
  end if;

  if new.parent_id is not null then
    select c.post_id, c.parent_id into parent_post, parent_parent from public.community_comments c where c.id = new.parent_id;
    if parent_post is distinct from new.post_id then
      raise exception 'community_reply_parent_mismatch' using errcode = 'P0001';
    end if;
    -- Two levels total: a reply to a reply attaches to the top-level comment.
    if parent_parent is not null then
      new.parent_id := parent_parent;
    end if;
  end if;

  new.status := 'visible';
  new.helpful_count := 0;
  return new;
end;
$$;

create or replace function public.community_comments_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.body is distinct from old.body then new.edited_at := now(); end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Comment count + notifications.
create or replace function public.community_comments_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  post_author uuid;
  parent_author uuid;
begin
  if tg_op = 'INSERT' then
    update public.community_posts set comment_count = comment_count + 1 where id = new.post_id
      returning author_id into post_author;
    if new.parent_id is not null then
      select author_id into parent_author from public.community_comments where id = new.parent_id;
      perform public.community_notify(parent_author, new.author_id, 'reply', new.post_id, new.id,
        p_actor_hidden => new.is_anonymous);
    end if;
    if parent_author is distinct from post_author then
      perform public.community_notify(post_author, new.author_id, 'comment', new.post_id, new.id,
        p_actor_hidden => new.is_anonymous);
    end if;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

-- Helpful count + notification.
create or replace function public.community_votes_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_author uuid;
  target_post uuid;
begin
  if tg_op = 'INSERT' then
    if new.post_id is not null then
      update public.community_posts set helpful_count = helpful_count + 1 where id = new.post_id
        returning author_id into target_author;
      perform public.community_notify(target_author, new.user_id, 'helpful', new.post_id);
    else
      update public.community_comments set helpful_count = helpful_count + 1 where id = new.comment_id
        returning author_id, post_id into target_author, target_post;
      perform public.community_notify(target_author, new.user_id, 'helpful', target_post, new.comment_id);
    end if;
    return new;
  else
    if old.post_id is not null then
      update public.community_posts set helpful_count = greatest(helpful_count - 1, 0) where id = old.post_id;
    else
      update public.community_comments set helpful_count = greatest(helpful_count - 1, 0) where id = old.comment_id;
    end if;
    return old;
  end if;
end;
$$;

create or replace function public.community_follows_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.community_is_blocked(new.follower_id, new.followee_id) then
    raise exception 'community_blocked' using errcode = 'P0001';
  end if;
  perform public.community_notify(new.followee_id, new.follower_id, 'follow');
  return new;
end;
$$;

-- Friend requests: only the addressee may accept, and only pending → accepted.
create or replace function public.community_friend_requests_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if public.community_is_blocked(new.requester_id, new.addressee_id) then
      raise exception 'community_blocked' using errcode = 'P0001';
    end if;
    new.status := 'pending';
    new.responded_at := null;
    return new;
  end if;
  -- UPDATE
  if new.requester_id <> old.requester_id or new.addressee_id <> old.addressee_id then
    raise exception 'community_friend_request_immutable' using errcode = 'P0001';
  end if;
  if old.status = 'pending' and new.status = 'accepted' then
    if auth.uid() is not null and auth.uid() <> old.addressee_id then
      raise exception 'community_friend_request_not_addressee' using errcode = 'P0001';
    end if;
    new.responded_at := now();
    return new;
  end if;
  if new.status = old.status then return new; end if;
  raise exception 'community_friend_request_bad_transition' using errcode = 'P0001';
end;
$$;

create or replace function public.community_friend_requests_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.community_notify(new.addressee_id, new.requester_id, 'friend_request');
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    perform public.community_notify(new.requester_id, new.addressee_id, 'friend_accepted');
  end if;
  return null;
end;
$$;

-- Blocking removes follows and friendships in both directions.
create or replace function public.community_blocks_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.community_follows
   where (follower_id = new.blocker_id and followee_id = new.blocked_id)
      or (follower_id = new.blocked_id and followee_id = new.blocker_id);
  delete from public.community_friend_requests
   where least(requester_id, addressee_id) = least(new.blocker_id, new.blocked_id)
     and greatest(requester_id, addressee_id) = greatest(new.blocker_id, new.blocked_id);
  return null;
end;
$$;

create or replace function public.community_playlist_items_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.community_playlists set item_count = item_count + 1, updated_at = now() where id = new.playlist_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.community_playlists set item_count = greatest(item_count - 1, 0), updated_at = now() where id = old.playlist_id;
    return old;
  end if;
  return null;
end;
$$;

create or replace function public.community_playlist_saves_after_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  if tg_op = 'INSERT' then
    update public.community_playlists set save_count = save_count + 1 where id = new.playlist_id
      returning owner_id into owner;
    perform public.community_notify(owner, new.user_id, 'playlist_saved', p_playlist => new.playlist_id);
    return new;
  else
    update public.community_playlists set save_count = greatest(save_count - 1, 0) where id = old.playlist_id;
    return old;
  end if;
end;
$$;

create or replace function public.community_playlists_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.item_count := 0;
    new.save_count := 0;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.community_recommendations_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.community_notify(new.recipient_id, new.sender_id, 'recommendation',
    p_recommendation => new.id, p_product => new.product_id);
  return new;
end;
$$;

-- Size caps. Triggers rather than policy subqueries: a policy on a table that
-- counts rows of the same table recurses.
create or replace function public.community_post_products_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.community_post_products where post_id = new.post_id) >= 3 then
    raise exception 'community_too_many_products' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create or replace function public.community_playlist_items_cap()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.community_playlist_items where playlist_id = new.playlist_id) >= 50 then
    raise exception 'community_playlist_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- Media: max 4 per post, status forced to published (moderation flips it),
-- and the uploader must own the storage object (Supabase only — a bare test
-- Postgres has no storage schema, so the check is skipped there).
create or replace function public.community_post_media_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owns boolean;
begin
  if (select count(*) from public.community_post_media where post_id = new.post_id) >= 4 then
    raise exception 'community_media_full' using errcode = 'P0001';
  end if;
  new.status := 'published';
  if to_regclass('storage.objects') is not null then
    execute 'select exists (select 1 from storage.objects o where o.bucket_id = $1 and o.name = $2 and o.owner = $3)'
      into owns using 'community-media', new.storage_path, new.owner_id;
    if not owns then
      raise exception 'community_media_not_found' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

-- Report flooding (guests can report too).
create or replace function public.community_reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.community_reports
       where reporter_id = new.reporter_id and created_at > now() - interval '1 hour') >= 30 then
    raise exception 'community_rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

-- ── Triggers ─────────────────────────────────────────────────────────────────
drop trigger if exists community_post_products_cap on public.community_post_products;
create trigger community_post_products_cap before insert on public.community_post_products
  for each row execute function public.community_post_products_cap();
drop trigger if exists community_playlist_items_cap on public.community_playlist_items;
create trigger community_playlist_items_cap before insert on public.community_playlist_items
  for each row execute function public.community_playlist_items_cap();

drop trigger if exists community_profiles_bw on public.community_profiles;
create trigger community_profiles_bw before insert or update on public.community_profiles
  for each row execute function public.community_profiles_before_write();
drop trigger if exists community_post_media_bi on public.community_post_media;
create trigger community_post_media_bi before insert on public.community_post_media
  for each row execute function public.community_post_media_before_insert();
drop trigger if exists community_reports_bi on public.community_reports;
create trigger community_reports_bi before insert on public.community_reports
  for each row execute function public.community_reports_before_insert();

drop trigger if exists community_profiles_touch on public.community_profiles;
create trigger community_profiles_touch before update on public.community_profiles
  for each row execute function public.community_touch_updated_at();

drop trigger if exists community_posts_bi on public.community_posts;
create trigger community_posts_bi before insert on public.community_posts
  for each row execute function public.community_posts_before_insert();
drop trigger if exists community_posts_bu on public.community_posts;
create trigger community_posts_bu before update on public.community_posts
  for each row execute function public.community_posts_before_update();

drop trigger if exists community_comments_bi on public.community_comments;
create trigger community_comments_bi before insert on public.community_comments
  for each row execute function public.community_comments_before_insert();
drop trigger if exists community_comments_bu on public.community_comments;
create trigger community_comments_bu before update on public.community_comments
  for each row execute function public.community_comments_before_update();
drop trigger if exists community_comments_ai on public.community_comments;
create trigger community_comments_ai after insert or delete on public.community_comments
  for each row execute function public.community_comments_after_change();

drop trigger if exists community_votes_ai on public.community_helpful_votes;
create trigger community_votes_ai after insert or delete on public.community_helpful_votes
  for each row execute function public.community_votes_after_change();

drop trigger if exists community_follows_ai on public.community_follows;
create trigger community_follows_ai after insert on public.community_follows
  for each row execute function public.community_follows_after_insert();

drop trigger if exists community_friend_requests_guard on public.community_friend_requests;
create trigger community_friend_requests_guard before insert or update on public.community_friend_requests
  for each row execute function public.community_friend_requests_guard();
drop trigger if exists community_friend_requests_ai on public.community_friend_requests;
create trigger community_friend_requests_ai after insert or update on public.community_friend_requests
  for each row execute function public.community_friend_requests_after_change();

drop trigger if exists community_blocks_ai on public.community_blocks;
create trigger community_blocks_ai after insert on public.community_blocks
  for each row execute function public.community_blocks_after_insert();

drop trigger if exists community_playlists_bw on public.community_playlists;
create trigger community_playlists_bw before insert or update on public.community_playlists
  for each row execute function public.community_playlists_before_write();
drop trigger if exists community_playlist_items_ai on public.community_playlist_items;
create trigger community_playlist_items_ai after insert or delete on public.community_playlist_items
  for each row execute function public.community_playlist_items_after_change();
drop trigger if exists community_playlist_saves_ai on public.community_playlist_saves;
create trigger community_playlist_saves_ai after insert or delete on public.community_playlist_saves
  for each row execute function public.community_playlist_saves_after_change();

drop trigger if exists community_recommendations_ai on public.community_product_recommendations;
create trigger community_recommendations_ai after insert on public.community_product_recommendations
  for each row execute function public.community_recommendations_after_insert();

-- ═════════════════════════════════════════════════════════════════════════════
-- Read views (the only way to see other people's posts and comments)
-- ═════════════════════════════════════════════════════════════════════════════

-- Blocks deliberately do NOT filter anonymous content, in either direction. If
-- they did, blocking someone (or being blocked) would make exactly their
-- anonymous posts vanish — compare the feed before and after a block and you
-- have unmasked the author. Anonymous content is handled with "Hide" instead.
--
-- security_barrier: stops a caller's WHERE clause (e.g. a leaky function)
-- from being evaluated before the masking and visibility filters below.
create or replace view public.community_feed_posts
with (security_barrier = true)
as
select
  p.id,
  p.kind,
  p.body,
  p.topics,
  p.is_anonymous,
  case when p.is_anonymous then null else p.author_id end as author_id,
  case when p.is_anonymous then null else pr.username end as author_username,
  case when p.is_anonymous then null else pr.display_name end as author_display_name,
  case when p.is_anonymous then null else pr.avatar_url end as author_avatar_url,
  coalesce(p.author_id = auth.uid(), false) as is_mine,
  p.product_id,
  coalesce(
    (select array_agg(pp.product_id order by pp.position, pp.product_id)
       from public.community_post_products pp where pp.post_id = p.id),
    '{}'::text[]
  ) as tagged_product_ids,
  p.rating,
  p.would_recommend,
  p.photo_url,
  p.helpful_count,
  p.comment_count,
  exists (select 1 from public.community_helpful_votes v where v.post_id = p.id and v.user_id = auth.uid()) as viewer_found_helpful,
  exists (select 1 from public.community_saved_posts s where s.post_id = p.id and s.user_id = auth.uid()) as viewer_saved,
  p.created_at,
  p.edited_at,
  -- Storage paths only (posts/<random uuid>.jpg — never the author's id).
  coalesce(
    (select jsonb_agg(jsonb_build_object('path', m.storage_path, 'width', m.width, 'height', m.height) order by m.position, m.created_at)
       from public.community_post_media m where m.post_id = p.id and m.status = 'published'),
    '[]'::jsonb
  ) as media
from public.community_posts p
left join public.community_profiles pr on pr.user_id = p.author_id
where p.status = 'visible'
  and (p.is_anonymous or not public.community_viewer_blocked(p.author_id))
  and not exists (select 1 from public.community_hidden_posts h where h.post_id = p.id and h.user_id = auth.uid());

create or replace view public.community_feed_comments
with (security_barrier = true)
as
select
  c.id,
  c.post_id,
  c.parent_id,
  c.body,
  c.product_id,
  c.is_anonymous,
  case when c.is_anonymous then null else c.author_id end as author_id,
  case when c.is_anonymous then null else pr.username end as author_username,
  case when c.is_anonymous then null else pr.display_name end as author_display_name,
  case when c.is_anonymous then null else pr.avatar_url end as author_avatar_url,
  coalesce(c.author_id = auth.uid(), false) as is_mine,
  -- The original poster replying in their own anonymous thread is labelled
  -- "OP" without revealing who that is.
  -- Never true for a named comment on an anonymous post: that would name the
  -- anonymous poster.
  (c.author_id = p.author_id and (not p.is_anonymous or c.is_anonymous)) as is_post_author,
  c.helpful_count,
  exists (select 1 from public.community_helpful_votes v where v.comment_id = c.id and v.user_id = auth.uid()) as viewer_found_helpful,
  c.created_at,
  c.edited_at
from public.community_comments c
join public.community_posts p on p.id = c.post_id
left join public.community_profiles pr on pr.user_id = c.author_id
where c.status = 'visible'
  and p.status = 'visible'
  and (c.is_anonymous or not public.community_viewer_blocked(c.author_id))
  and (p.is_anonymous or not public.community_viewer_blocked(p.author_id))
  and not exists (select 1 from public.community_hidden_posts h where h.post_id = p.id and h.user_id = auth.uid());

-- Playlists with the owner's public profile, filtered by RLS-equivalent rules.
create or replace view public.community_feed_playlists
with (security_barrier = true)
as
select
  pl.id,
  pl.owner_id,
  pr.username as owner_username,
  pr.display_name as owner_display_name,
  pr.avatar_url as owner_avatar_url,
  coalesce(pl.owner_id = auth.uid(), false) as is_mine,
  pl.title,
  pl.description,
  pl.cover_url,
  pl.visibility,
  pl.item_count,
  pl.save_count,
  coalesce(
    (select array_agg(i.product_id order by i.position, i.added_at)
       from (select product_id, position, added_at from public.community_playlist_items
              where playlist_id = pl.id order by position, added_at limit 4) i),
    '{}'::text[]
  ) as preview_product_ids,
  exists (select 1 from public.community_playlist_saves s where s.playlist_id = pl.id and s.user_id = auth.uid()) as viewer_saved,
  pl.created_at,
  pl.updated_at
from public.community_playlists pl
left join public.community_profiles pr on pr.user_id = pl.owner_id
where (pl.visibility = 'public' or pl.owner_id = auth.uid())
  and not public.community_viewer_blocked(pl.owner_id);

-- ═════════════════════════════════════════════════════════════════════════════
-- Grants + RLS
-- ═════════════════════════════════════════════════════════════════════════════

-- Public content is readable signed-out (guests browse without an account).
-- The views are the masking layer, so granting them to anon exposes nothing
-- the signed-in feed doesn't; viewer-only columns are simply false.
revoke all on public.community_feed_posts, public.community_feed_comments, public.community_feed_playlists from public;
grant select on public.community_feed_posts, public.community_feed_comments, public.community_feed_playlists to anon, authenticated, service_role;

revoke execute on function public.community_notify(uuid, uuid, text, uuid, uuid, uuid, uuid, text, boolean) from public, anon, authenticated;
-- Two-argument helpers answer questions about ANY pair of users (who blocked
-- whom, who is friends with whom). Only definer triggers may call them;
-- clients get the viewer-scoped versions below.
revoke execute on function public.community_are_friends(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.community_is_blocked(uuid, uuid) from public, anon, authenticated;
grant execute on function public.community_are_friends(uuid, uuid) to service_role;
grant execute on function public.community_is_blocked(uuid, uuid) to service_role;
revoke execute on function public.community_profile_stats(uuid) from public;
grant execute on function public.community_profile_stats(uuid) to anon, authenticated, service_role;
revoke execute on function public.community_viewer_blocked(uuid) from public;
revoke execute on function public.community_viewer_is_friend(uuid) from public;
revoke execute on function public.community_is_guest() from public;
grant execute on function public.community_viewer_blocked(uuid) to anon, authenticated, service_role;
grant execute on function public.community_viewer_is_friend(uuid) to anon, authenticated, service_role;
grant execute on function public.community_is_guest() to anon, authenticated, service_role;

do $$
declare
  t text;
begin
  foreach t in array array[
    'community_profiles', 'community_posts', 'community_post_products', 'community_post_media', 'community_comments',
    'community_helpful_votes', 'community_saved_posts', 'community_hidden_posts',
    'community_follows', 'community_friend_requests', 'community_blocks',
    'community_playlists', 'community_playlist_items', 'community_playlist_saves',
    'community_product_recommendations', 'community_notifications', 'community_reports'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated, public', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- Profiles: public to signed-in users (they hold nothing but username, name,
-- bio, avatar). Owner writes.
grant select, insert, delete on public.community_profiles to authenticated;
grant select on public.community_profiles to anon;
grant update (username, display_name, bio, avatar_url, public_interests) on public.community_profiles to authenticated;
drop policy if exists community_profiles_select on public.community_profiles;
create policy community_profiles_select on public.community_profiles for select to anon, authenticated
  using (not public.community_viewer_blocked(user_id));
drop policy if exists community_profiles_insert on public.community_profiles;
create policy community_profiles_insert on public.community_profiles for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists community_profiles_update on public.community_profiles;
create policy community_profiles_update on public.community_profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists community_profiles_delete on public.community_profiles;
create policy community_profiles_delete on public.community_profiles for delete to authenticated
  using (user_id = auth.uid());

-- Posts: own rows only on the base table (see the privacy model at the top).
grant select, insert, delete on public.community_posts to authenticated;
grant update (body, topics, rating, would_recommend, photo_url) on public.community_posts to authenticated;
drop policy if exists community_posts_select_own on public.community_posts;
create policy community_posts_select_own on public.community_posts for select to authenticated
  using (author_id = auth.uid());
drop policy if exists community_posts_insert_own on public.community_posts;
create policy community_posts_insert_own on public.community_posts for insert to authenticated
  with check (author_id = auth.uid());
drop policy if exists community_posts_update_own on public.community_posts;
create policy community_posts_update_own on public.community_posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists community_posts_delete_own on public.community_posts;
create policy community_posts_delete_own on public.community_posts for delete to authenticated
  using (author_id = auth.uid());

grant select, insert, delete on public.community_post_products to authenticated;
drop policy if exists community_post_products_own on public.community_post_products;
create policy community_post_products_own on public.community_post_products for all to authenticated
  using (exists (select 1 from public.community_posts p where p.id = post_id and p.author_id = auth.uid()))
  with check (exists (select 1 from public.community_posts p where p.id = post_id and p.author_id = auth.uid()));

-- Comments: same split as posts.
grant select, insert, delete on public.community_comments to authenticated;
grant update (body, product_id) on public.community_comments to authenticated;
drop policy if exists community_comments_select_own on public.community_comments;
create policy community_comments_select_own on public.community_comments for select to authenticated
  using (author_id = auth.uid());
drop policy if exists community_comments_insert_own on public.community_comments;
create policy community_comments_insert_own on public.community_comments for insert to authenticated
  with check (author_id = auth.uid());
drop policy if exists community_comments_update_own on public.community_comments;
create policy community_comments_update_own on public.community_comments for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists community_comments_delete_own on public.community_comments;
create policy community_comments_delete_own on public.community_comments for delete to authenticated
  using (author_id = auth.uid());

-- Votes / saves / hides: strictly own rows. Votes can only target visible
-- content, and never your own.
grant select, insert, delete on public.community_helpful_votes, public.community_saved_posts, public.community_hidden_posts to authenticated;
drop policy if exists community_votes_own on public.community_helpful_votes;
create policy community_votes_own on public.community_helpful_votes for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      (post_id is not null and exists (select 1 from public.community_feed_posts fp where fp.id = post_id and not fp.is_mine))
      or (comment_id is not null and exists (select 1 from public.community_feed_comments fc where fc.id = comment_id and not fc.is_mine))
    )
  );
drop policy if exists community_saved_posts_own on public.community_saved_posts;
create policy community_saved_posts_own on public.community_saved_posts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists community_hidden_posts_own on public.community_hidden_posts;
create policy community_hidden_posts_own on public.community_hidden_posts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Follows: the graph is visible to signed-in users (for counts and the
-- Following feed); only the follower creates or removes their own follow.
grant select, insert, delete on public.community_follows to authenticated;
drop policy if exists community_follows_select on public.community_follows;
create policy community_follows_select on public.community_follows for select to authenticated
  using (true);
drop policy if exists community_follows_insert on public.community_follows;
create policy community_follows_insert on public.community_follows for insert to authenticated
  with check (follower_id = auth.uid());
drop policy if exists community_follows_delete on public.community_follows;
create policy community_follows_delete on public.community_follows for delete to authenticated
  using (follower_id = auth.uid());

-- Friend requests: visible to the two people involved only.
grant select, insert, delete on public.community_friend_requests to authenticated;
grant update (status) on public.community_friend_requests to authenticated;
drop policy if exists community_friend_requests_select on public.community_friend_requests;
create policy community_friend_requests_select on public.community_friend_requests for select to authenticated
  using (auth.uid() in (requester_id, addressee_id));
drop policy if exists community_friend_requests_insert on public.community_friend_requests;
create policy community_friend_requests_insert on public.community_friend_requests for insert to authenticated
  with check (requester_id = auth.uid());
drop policy if exists community_friend_requests_update on public.community_friend_requests;
create policy community_friend_requests_update on public.community_friend_requests for update to authenticated
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
drop policy if exists community_friend_requests_delete on public.community_friend_requests;
create policy community_friend_requests_delete on public.community_friend_requests for delete to authenticated
  using (auth.uid() in (requester_id, addressee_id));

-- Blocks: private to the blocker.
grant select, insert, delete on public.community_blocks to authenticated;
drop policy if exists community_blocks_own on public.community_blocks;
create policy community_blocks_own on public.community_blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Playlists.
grant select, insert, delete on public.community_playlists to authenticated;
grant update (title, description, cover_url, visibility) on public.community_playlists to authenticated;
drop policy if exists community_playlists_select on public.community_playlists;
grant select on public.community_playlists, public.community_playlist_items to anon;
create policy community_playlists_select on public.community_playlists for select to anon, authenticated
  using (owner_id = auth.uid() or (visibility = 'public' and not public.community_viewer_blocked(owner_id)));
drop policy if exists community_playlists_insert on public.community_playlists;
create policy community_playlists_insert on public.community_playlists for insert to authenticated
  with check (owner_id = auth.uid());
drop policy if exists community_playlists_update on public.community_playlists;
create policy community_playlists_update on public.community_playlists for update to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists community_playlists_delete on public.community_playlists;
create policy community_playlists_delete on public.community_playlists for delete to authenticated
  using (owner_id = auth.uid());

grant select, insert, delete on public.community_playlist_items to authenticated;
grant update (note, position) on public.community_playlist_items to authenticated;
drop policy if exists community_playlist_items_select on public.community_playlist_items;
create policy community_playlist_items_select on public.community_playlist_items for select to anon, authenticated
  using (exists (
    select 1 from public.community_playlists pl
     where pl.id = playlist_id
       and (pl.owner_id = auth.uid() or (pl.visibility = 'public' and not public.community_viewer_blocked(pl.owner_id)))
  ));
drop policy if exists community_playlist_items_write on public.community_playlist_items;
create policy community_playlist_items_write on public.community_playlist_items for insert to authenticated
  with check (exists (select 1 from public.community_playlists pl where pl.id = playlist_id and pl.owner_id = auth.uid()));
drop policy if exists community_playlist_items_update on public.community_playlist_items;
create policy community_playlist_items_update on public.community_playlist_items for update to authenticated
  using (exists (select 1 from public.community_playlists pl where pl.id = playlist_id and pl.owner_id = auth.uid()))
  with check (exists (select 1 from public.community_playlists pl where pl.id = playlist_id and pl.owner_id = auth.uid()));
drop policy if exists community_playlist_items_delete on public.community_playlist_items;
create policy community_playlist_items_delete on public.community_playlist_items for delete to authenticated
  using (exists (select 1 from public.community_playlists pl where pl.id = playlist_id and pl.owner_id = auth.uid()));

grant select, insert, delete on public.community_playlist_saves to authenticated;
drop policy if exists community_playlist_saves_own on public.community_playlist_saves;
create policy community_playlist_saves_own on public.community_playlist_saves for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.community_playlists pl
                 where pl.id = playlist_id and pl.visibility = 'public' and pl.owner_id <> auth.uid()
                   and not public.community_viewer_blocked(pl.owner_id))
  );

-- Recommendations: only to an accepted friend; visible to sender + recipient.
grant select, insert, delete on public.community_product_recommendations to authenticated;
grant update (seen_at) on public.community_product_recommendations to authenticated;
drop policy if exists community_recommendations_select on public.community_product_recommendations;
create policy community_recommendations_select on public.community_product_recommendations for select to authenticated
  using (auth.uid() in (sender_id, recipient_id));
drop policy if exists community_recommendations_insert on public.community_product_recommendations;
create policy community_recommendations_insert on public.community_product_recommendations for insert to authenticated
  with check (sender_id = auth.uid() and public.community_viewer_is_friend(recipient_id));
drop policy if exists community_recommendations_update on public.community_product_recommendations;
create policy community_recommendations_update on public.community_product_recommendations for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
drop policy if exists community_recommendations_delete on public.community_product_recommendations;
create policy community_recommendations_delete on public.community_product_recommendations for delete to authenticated
  using (auth.uid() in (sender_id, recipient_id));

-- Notifications: recipient reads, marks read, deletes. No client INSERT.
grant select, delete on public.community_notifications to authenticated;
grant update (read_at) on public.community_notifications to authenticated;
drop policy if exists community_notifications_select on public.community_notifications;
create policy community_notifications_select on public.community_notifications for select to authenticated
  using (recipient_id = auth.uid());
drop policy if exists community_notifications_update on public.community_notifications;
create policy community_notifications_update on public.community_notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
drop policy if exists community_notifications_delete on public.community_notifications;
create policy community_notifications_delete on public.community_notifications for delete to authenticated
  using (recipient_id = auth.uid());

-- Reports: reporter can file and see their own; review is service-role only.
grant select, insert on public.community_reports to authenticated;
drop policy if exists community_reports_insert on public.community_reports;
create policy community_reports_insert on public.community_reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
drop policy if exists community_reports_select on public.community_reports;
create policy community_reports_select on public.community_reports for select to authenticated
  using (reporter_id = auth.uid());

-- ── Reporting a post or comment without learning who wrote it ───────────────
-- A report on content needs no reported_user_id from the client; the reporter
-- may not know (anonymous) and must not be able to probe it. Moderators join
-- through post_id/comment_id with the service role.

-- Media: the author attaches photos to their own post; everyone else sees them
-- through community_feed_posts.media (paths only, status = published).
grant select, insert, delete on public.community_post_media to authenticated;
drop policy if exists community_post_media_select_own on public.community_post_media;
create policy community_post_media_select_own on public.community_post_media for select to authenticated
  using (owner_id = auth.uid());
drop policy if exists community_post_media_insert_own on public.community_post_media;
create policy community_post_media_insert_own on public.community_post_media for insert to authenticated
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.community_posts p where p.id = post_id and p.author_id = auth.uid())
  );
drop policy if exists community_post_media_delete_own on public.community_post_media;
create policy community_post_media_delete_own on public.community_post_media for delete to authenticated
  using (owner_id = auth.uid());

-- ═════════════════════════════════════════════════════════════════════════════
-- Guests (Supabase anonymous sign-ins)
-- ═════════════════════════════════════════════════════════════════════════════
-- RESTRICTIVE policies are AND-ed with the permissive ones above, so they can
-- only take access away. A guest keeps: reading, own anonymous posts
-- (discussion/question) and comments, attaching products/photos to them,
-- editing/deleting them, and reporting. Everything that builds a social
-- identity (profile, votes, saves, follows, friends, blocks, playlists,
-- recommendations, notifications, hides) needs an account.

-- Posts: guests post anonymously, and only discussions/questions (reviews are
-- tied to a profile so product feedback stays accountable).
drop policy if exists community_posts_guest_insert on public.community_posts;
create policy community_posts_guest_insert on public.community_posts as restrictive for insert to authenticated
  with check (not public.community_is_guest() or (is_anonymous and kind in ('post', 'question') and product_id is null));

drop policy if exists community_comments_guest_insert on public.community_comments;
create policy community_comments_guest_insert on public.community_comments as restrictive for insert to authenticated
  with check (not public.community_is_guest() or is_anonymous);

do $$
declare
  t text;
  cmd text;
begin
  -- Account-only for every command.
  foreach t in array array[
    'community_helpful_votes', 'community_saved_posts', 'community_hidden_posts',
    'community_follows', 'community_friend_requests', 'community_blocks',
    'community_playlist_saves', 'community_product_recommendations', 'community_notifications'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_no_guests', t);
    execute format(
      'create policy %I on public.%I as restrictive for all to authenticated using (not public.community_is_guest()) with check (not public.community_is_guest())',
      t || '_no_guests', t);
  end loop;
  -- Readable by guests, writable by accounts only.
  foreach t in array array['community_profiles', 'community_playlists', 'community_playlist_items'] loop
    foreach cmd in array array['insert', 'update', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', t || '_no_guests_' || cmd, t);
      if cmd = 'insert' then
        execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (not public.community_is_guest())', t || '_no_guests_' || cmd, t);
      elsif cmd = 'update' then
        execute format('create policy %I on public.%I as restrictive for update to authenticated using (not public.community_is_guest()) with check (not public.community_is_guest())', t || '_no_guests_' || cmd, t);
      else
        execute format('create policy %I on public.%I as restrictive for delete to authenticated using (not public.community_is_guest())', t || '_no_guests_' || cmd, t);
      end if;
    end loop;
  end loop;
end $$;

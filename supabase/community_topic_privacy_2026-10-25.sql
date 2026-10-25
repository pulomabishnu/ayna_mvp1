-- Community: keep private and friends-only topic posts private (2026-10-25).
--
-- The problem (community_user_topics_2026-10-21.sql, already in production,
-- not edited here): a post with no topic is public. So a post written in a
-- private or friends-only topic became public when
--   * the topic was deleted (community_posts.topic_id is "on delete set null",
--     and deleting an account deletes her topics the same way), or
--   * an owner or co-owner took the post out of the topic
--     (community_remove_post_from_topic set topic_id to null).
--
-- What this adds (nothing is deleted, no row is removed):
--   * community_posts.hidden_at (nullable). A hidden post stays in the table
--     and stays visible to its author; nobody else sees it in the feed or its
--     comments.
--   * A BEFORE DELETE trigger on community_topics: posts of a topic that is
--     not public (friends, private, or a public topic not yet approved or
--     hidden by the team) are hidden before the topic goes.
--   * community_remove_post_from_topic: for such a topic the post is hidden
--     (it keeps its topic) instead of being made public. Public topics work
--     as before.
--   * community_feed_posts / community_feed_comments: one more AND filter
--     (hidden_at is null, or it's the viewer's own post / comment), rebuilt
--     from the live definitions the same way the 2026-10-21 file did.
--   * A restrictive select policy on community_posts with the same rule, for
--     anything reading the table directly.
--
-- Safe to run more than once. NOT applied automatically: run it in the
-- Supabase SQL editor after community_user_topics_2026-10-21.sql. Then run
-- community_topic_privacy_2026-10-25_CHECK_READ_ONLY.sql to confirm.

begin;

do $$
begin
  if to_regclass('public.community_posts') is null
     or to_regclass('public.community_topics') is null
     or to_regclass('public.community_feed_posts') is null then
    raise exception 'Run community.sql and community_user_topics_2026-10-21.sql first';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'community_feed_posts' and column_name = 'topic_id') then
    raise exception 'Run community_user_topics_2026-10-21.sql first';
  end if;
end $$;

-- ── Column ─────────────────────────────────────────────────────────────────
alter table public.community_posts
  add column if not exists hidden_at timestamptz;
create index if not exists community_posts_hidden_idx on public.community_posts (hidden_at) where hidden_at is not null;

-- ── Topic deleted: hide the posts of a topic that wasn't public ────────────
create or replace function public.community_topics_hide_private_posts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.visibility <> 'public' or old.status <> 'visible' then
    update public.community_posts p
       set hidden_at = coalesce(p.hidden_at, now())
     where p.topic_id = old.id;
  end if;
  return old;
end;
$$;

create or replace trigger community_topics_hide_private_posts
  before delete on public.community_topics
  for each row execute function public.community_topics_hide_private_posts();

-- ── Post taken out of a topic ──────────────────────────────────────────────
-- Owner or co-owner takes a post out of their topic. In a public topic the
-- post goes back to the public feed (as before). In any other topic it is
-- hidden instead, so it never becomes public; its author still sees it.
create or replace function public.community_remove_post_from_topic(pid uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  tid uuid;
  vis text;
  st text;
begin
  select p.topic_id into tid from public.community_posts p where p.id = pid;
  if tid is null then return false; end if;
  if not public.community_is_topic_manager(tid) then
    raise exception 'community_not_topic_owner' using errcode = 'P0001';
  end if;
  select t.visibility, t.status into vis, st from public.community_topics t where t.id = tid;
  if vis = 'public' and st = 'visible' then
    update public.community_posts set topic_id = null where id = pid;
  else
    update public.community_posts set hidden_at = coalesce(hidden_at, now()) where id = pid;
  end if;
  return true;
end;
$$;

-- ── Feed views: leave hidden posts out (except for their author) ───────────
do $$
declare
  def text;
  orig_path text := current_setting('search_path');
begin
  perform set_config('search_path', '', true);
  def := pg_get_viewdef('public.community_feed_posts'::regclass, true);
  if def !~* 'hidden_at' then
    def := regexp_replace(def, ';\s*$', '');
    if def !~* '\sWHERE\s' or def !~* 'community_can_view_topic' then
      raise exception 'community_feed_posts has an unexpected shape; not changing it';
    end if;
    def := def || E'\n  AND (p.hidden_at IS NULL OR p.author_id = auth.uid())';
    execute 'create or replace view public.community_feed_posts with (security_barrier = true) as ' || def;
  end if;

  if to_regclass('public.community_feed_comments') is not null then
    def := pg_get_viewdef('public.community_feed_comments'::regclass, true);
    if def !~* 'hidden_at' then
      def := regexp_replace(def, ';\s*$', '');
      if def !~* '\sWHERE\s' or def !~* 'community_can_view_topic' then
        raise exception 'community_feed_comments has an unexpected shape; not changing it';
      end if;
      def := def || E'\n  AND (p.hidden_at IS NULL OR c.author_id = auth.uid())';
      execute 'create or replace view public.community_feed_comments with (security_barrier = true) as ' || def;
    end if;
  end if;
  perform set_config('search_path', orig_path, true);
end $$;

grant select on public.community_feed_posts to anon, authenticated;
do $$
begin
  if to_regclass('public.community_feed_comments') is not null then
    grant select on public.community_feed_comments to anon, authenticated;
  end if;
end $$;

-- ── Direct reads of the table follow the same rule ─────────────────────────
-- Restrictive: it only narrows whatever the existing select policies allow.
do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname = 'public' and tablename = 'community_posts'
                    and policyname = 'community_posts_hidden_only_author') then
    create policy community_posts_hidden_only_author on public.community_posts
      as restrictive for select
      using (hidden_at is null or author_id = auth.uid());
  end if;
end $$;

commit;

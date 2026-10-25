-- READ ONLY. Checks community_topic_privacy_2026-10-25.sql was applied.
-- Only selects; changes nothing. Every row should say ok = true.

select 'hidden_at column' as item,
       exists (select 1 from information_schema.columns
                where table_schema = 'public' and table_name = 'community_posts' and column_name = 'hidden_at') as ok
union all
select 'topic delete trigger',
       exists (select 1 from pg_trigger
                where tgrelid = 'public.community_topics'::regclass
                  and tgname = 'community_topics_hide_private_posts' and not tgisinternal)
union all
select 'remove-from-topic hides in non-public topics',
       coalesce(pg_get_functiondef('public.community_remove_post_from_topic(uuid)'::regprocedure) ~ 'hidden_at', false)
union all
select 'feed posts view filters hidden posts',
       pg_get_viewdef('public.community_feed_posts'::regclass, true) ~ 'hidden_at'
union all
select 'feed comments view filters hidden posts',
       to_regclass('public.community_feed_comments') is null
       or pg_get_viewdef('public.community_feed_comments'::regclass, true) ~ 'hidden_at'
union all
select 'restrictive policy on community_posts',
       exists (select 1 from pg_policies
                where schemaname = 'public' and tablename = 'community_posts'
                  and policyname = 'community_posts_hidden_only_author' and permissive = 'RESTRICTIVE');

-- How many posts are hidden (counts only, no content):
select count(*) filter (where hidden_at is not null) as hidden_posts,
       count(*) as all_posts
  from public.community_posts;

-- Other triggers on community_posts (an update guard here could block the
-- topic delete trigger; this list should show nothing that rejects updates
-- to hidden_at):
select tgname, pg_get_triggerdef(oid) as definition
  from pg_trigger
 where tgrelid = 'public.community_posts'::regclass and not tgisinternal
 order by tgname;

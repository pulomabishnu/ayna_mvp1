-- AUDIT_rls_check_READ_ONLY.sql  (2026-10-21, security audit)
--
-- READ ONLY. Every statement is a SELECT on catalog views. Nothing is created,
-- changed or deleted. Paste the whole file into the Supabase SQL Editor
-- (project mvvwgyspcohqxxcqkfrv) and run it; each query returns its own result
-- grid. An EMPTY grid is the good answer for queries 1-7 and 9-10.
--
-- What each one finds (Supabase security advisor lint numbers in brackets):
--   1  public tables with RLS OFF                               [0013 rls_disabled_in_public]
--   2  tables with RLS ON but no policy (server-only, check intended)  [0008]
--   3  policies that allow everything (USING true / WITH CHECK true)   [0024 permissive]
--   4  SECURITY DEFINER functions without a fixed search_path   [0011 function_search_path_mutable]
--   5  any function without a fixed search_path                [0011]
--   6  views that run as their owner (not security_invoker)     [0010 security_definer_view]
--   7  views/matviews that read auth.users and are visible to anon/authenticated [0002 auth_users_exposed]
--   8  everything granted to anon (review each row)
--   9  SECURITY DEFINER functions anon can execute
--  10  tables in the repo audit list that do not exist in this database, and vice versa
--  11  storage buckets: public flag, size and type limits
--  12  RLS policies per table (full list, for the record)

-- 1. Public tables without RLS. Anyone with the anon key can read/write these
--    through the REST API if a grant exists.
select n.nspname as schema, c.relname as table_name
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p') and n.nspname = 'public' and not c.relrowsecurity
order by 2;

-- 2. RLS on, zero policies: only service_role can touch it. Fine for
--    server-only tables (email_sends, health_oauth_tokens, ...); a problem if
--    the app expects to read it with the user's session.
select c.relname as table_name
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.relkind in ('r', 'p') and n.nspname = 'public' and c.relrowsecurity
  and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname)
order by 1;

-- 3. Policies with a constant-true condition. Intended today only for:
--    community_announcements*_read (public news), community_follows_select,
--    suggestions_insert_anyone (see FIX file). Anything else: investigate.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and (coalesce(btrim(qual), '') in ('true', '(true)') or coalesce(btrim(with_check), '') in ('true', '(true)'))
order by 1, 2;

-- 4. SECURITY DEFINER functions without SET search_path (hijackable by a
--    same-named object earlier on the caller's path).
select n.nspname as schema, p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where p.prosecdef and n.nspname in ('public')
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')
order by 2;

-- 5. Any public function without a fixed search_path (advisor warns on all).
select p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args, p.prosecdef as security_definer
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
where n.nspname = 'public' and d.objid is null
  and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%')
order by 1;

-- 6. Views that run with their owner's rights. EXPECTED (by design, they hide
--    anonymous authors): community_feed_posts, community_feed_comments,
--    community_feed_playlists, community_product_review_stats, invite_stats
--    (service_role only). Anything else should be security_invoker = true.
select c.relname as view_name,
       coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name = 'security_invoker'), 'false') as security_invoker
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where c.relkind = 'v' and n.nspname = 'public'
  and coalesce((select option_value from pg_options_to_table(c.reloptions) where option_name = 'security_invoker'), 'false') <> 'true'
order by 1;

-- 7. Views that read auth.users (emails!) and that anon or authenticated can
--    select. Must be empty. invite_stats reads auth.users but is service_role only.
select distinct v.relname as view_name, g.grantee, g.privilege_type
from pg_class v
join pg_namespace vn on vn.oid = v.relnamespace
join pg_depend d on d.objid in (select oid from pg_rewrite where ev_class = v.oid)
join pg_class t on t.oid = d.refobjid
join pg_namespace tn on tn.oid = t.relnamespace
join information_schema.role_table_grants g on g.table_schema = vn.nspname and g.table_name = v.relname
where v.relkind in ('v', 'm') and vn.nspname = 'public'
  and tn.nspname = 'auth' and t.relname = 'users'
  and g.grantee in ('anon', 'authenticated', 'PUBLIC')
order by 1, 2;

-- 8. Everything anon (logged-out visitors, anyone holding the public key) can
--    do, table by table. Review each row; expected: product_catalog,
--    early_stage_startups, community read views/profiles/playlists,
--    announcements, shared_answers (granted columns only).
select table_name, string_agg(privilege_type, ', ' order by privilege_type) as privileges
from information_schema.role_table_grants
where grantee = 'anon' and table_schema = 'public'
group by table_name
order by 1;

-- 8b. Column-level grants to anon (e.g. shared_answers).
select table_name, column_name, privilege_type
from information_schema.column_privileges
where grantee = 'anon' and table_schema = 'public'
  and (table_name, privilege_type) not in (
    select table_name, privilege_type from information_schema.role_table_grants
    where grantee = 'anon' and table_schema = 'public')
order by 1, 2;

-- 9. SECURITY DEFINER functions that anon can execute. Each should only
--    return public data (e.g. community_post_view_counts) or check auth.uid().
select p.proname as function_name, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
  and has_function_privilege('anon', p.oid, 'execute')
order by 1;

-- 10. Repo vs database. Left column: tables the repo's SQL files create.
--     'missing_in_db' = the file was never run; 'not_in_repo' = exists in prod
--     but no definition is committed (community.sql is one: commit it).
with repo(t) as (values
  ('account_analytics'),('account_deletion_requests'),('apple_oauth_tokens'),('campaign_feedback'),
  ('community_announcement_reactions'),('community_announcement_replies'),('community_announcements'),
  ('community_blocks'),('community_comments'),('community_follows'),('community_friend_requests'),
  ('community_helpful_votes'),('community_hidden_posts'),('community_notifications'),
  ('community_playlist_collaborators'),('community_playlist_invites'),('community_playlist_items'),
  ('community_playlist_saves'),('community_playlists'),('community_post_media'),('community_post_products'),
  ('community_post_views'),('community_posts'),('community_product_recommendations'),('community_profiles'),
  ('community_reports'),('community_saved_posts'),('community_team_members'),('device_tokens'),
  ('early_stage_startups'),('email_preferences'),('email_sends'),('health_connections'),
  ('health_daily_metrics'),('health_data_events'),('health_imports'),('health_intakes'),('health_knowledge'),
  ('health_oauth_states'),('health_oauth_tokens'),('health_source_requests'),('monthly_checkins'),
  ('notification_preferences'),('pending_phone_verifications'),('phone_numbers'),('product_catalog'),
  ('product_recall_state'),('product_research'),('recall_notifications'),('referrals'),('reward_campaigns'),
  ('reward_claims'),('reward_notifications'),('reward_products'),('reward_shipping'),('reward_spins'),
  ('shared_answer_opens'),('shared_answers'),('sms_conversations'),('sms_events'),('sms_preferences'),
  ('suggestions'),('user_ai_usage'),('user_ecosystem_builds'),('user_ecosystems'),('user_health_profiles'),
  ('user_learning_memory'),('user_reviews'),('product_submissions'),('feedback_responses')
), db as (
  select c.relname as t from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
)
select coalesce(repo.t, db.t) as table_name,
       case when db.t is null then 'missing_in_db' else 'not_in_repo' end as status
from repo full join db on db.t = repo.t
where repo.t is null or db.t is null
order by 2, 1;

-- 11. Storage buckets (community-media should be public, 3 MB, images only).
select id, public, file_size_limit, allowed_mime_types from storage.buckets order by id;

-- 12. Every policy, for the record.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

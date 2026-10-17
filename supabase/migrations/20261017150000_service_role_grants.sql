-- Server routes (Vercel functions) use the service_role key. In this project new
-- tables stopped getting the usual Supabase default grants for service_role, so
-- the notification-email job failed with "permission denied for table
-- community_announcements" (Oct 17), and the other tables below were unreadable
-- from the server too. service_role is server-only and bypasses RLS by design;
-- anon/authenticated access is unchanged. Idempotent.
grant select, insert, update, delete on table
  public.account_analytics,
  public.apple_oauth_tokens,
  public.brand_partnerships,
  public.community_announcement_reactions,
  public.community_announcement_replies,
  public.community_announcements,
  public.community_team_members,
  public.discovery_search_cache,
  public.email_preferences,
  public.email_sends,
  public.product_research
to service_role;

-- Future tables created by postgres in public get the same server access.
alter default privileges in schema public grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;

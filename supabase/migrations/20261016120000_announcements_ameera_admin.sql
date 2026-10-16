-- Announcements can be posted by all three founders (Ameera, 2026-10-16).
-- Idempotent: safe to run more than once, and before or after
-- 20261013120000_community_announcements.sql has created the table.
do $$
begin
  if to_regclass('public.community_team_members') is not null then
    update public.community_team_members set is_admin = true
    where email = 'ameera@aynahealth.co' and is_admin is distinct from true;
  end if;
end $$;

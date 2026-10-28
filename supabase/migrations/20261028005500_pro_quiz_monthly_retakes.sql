begin;

-- 20261027160000_ecosystem_update_monthly.sql already changes
-- claim_ecosystem_build from weekly to monthly retakes. This follow-up only
-- cleans up the index name created by 20261027014500_pro_quiz_retakes.sql.
-- The indexed columns remain the same and support the monthly range query.

drop index if exists public.user_ecosystem_builds_weekly_retakes_idx;
create index if not exists user_ecosystem_builds_monthly_retakes_idx
  on public.user_ecosystem_builds(user_id, created_at)
  where is_initial = false;

commit;

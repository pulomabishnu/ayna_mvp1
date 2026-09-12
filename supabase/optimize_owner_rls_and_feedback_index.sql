-- Applied to production on 2026-09-12 as migrations:
--   optimize_owner_rls_auth_uid
--   index_feedback_user_id
--
-- Cache auth.uid() once per statement instead of re-evaluating it per row.
-- These expressions preserve the existing owner-only access semantics.
alter policy phone_numbers_select_own on public.phone_numbers using ((select auth.uid()) = user_id);
alter policy phone_numbers_upsert_own on public.phone_numbers with check ((select auth.uid()) = user_id);
alter policy phone_numbers_update_own on public.phone_numbers using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

alter policy user_ecosystems_select_own on public.user_ecosystems using ((select auth.uid()) = user_id);
alter policy user_ecosystems_insert_own on public.user_ecosystems with check ((select auth.uid()) = user_id);
alter policy user_ecosystems_update_own on public.user_ecosystems using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy user_ecosystems_delete_own on public.user_ecosystems using ((select auth.uid()) = user_id);

alter policy user_ecosystem_builds_select_own on public.user_ecosystem_builds using ((select auth.uid()) = user_id);
alter policy user_ai_usage_select_own on public.user_ai_usage using ((select auth.uid()) = user_id);

alter policy notification_preferences_select_own on public.notification_preferences using ((select auth.uid()) = user_id);
alter policy notification_preferences_upsert_own on public.notification_preferences with check ((select auth.uid()) = user_id);
alter policy notification_preferences_update_own on public.notification_preferences using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy notification_preferences_delete_own on public.notification_preferences using ((select auth.uid()) = user_id);

alter policy health_intakes_select_own on public.health_intakes using ((select auth.uid()) = user_id);
alter policy health_intakes_upsert_own on public.health_intakes with check ((select auth.uid()) = user_id);
alter policy health_intakes_update_own on public.health_intakes using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy health_intakes_delete_own on public.health_intakes using ((select auth.uid()) = user_id);

alter policy user_learning_memory_select_own on public.user_learning_memory using ((select auth.uid()) = user_id);
alter policy user_learning_memory_insert_own on public.user_learning_memory with check ((select auth.uid()) = user_id);
alter policy user_learning_memory_update_own on public.user_learning_memory using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy user_learning_memory_delete_own on public.user_learning_memory using ((select auth.uid()) = user_id);

alter policy user_reviews_select_own on public.user_reviews using ((select auth.uid()) = user_id);
alter policy user_reviews_insert_own on public.user_reviews with check ((select auth.uid()) = user_id);
alter policy user_reviews_update_own on public.user_reviews using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy user_reviews_delete_own on public.user_reviews using ((select auth.uid()) = user_id);

alter policy user_health_profiles_select_own on public.user_health_profiles using ((select auth.uid()) = user_id);
alter policy user_health_profiles_insert_own on public.user_health_profiles with check ((select auth.uid()) = user_id);
alter policy user_health_profiles_update_own on public.user_health_profiles using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
alter policy user_health_profiles_delete_own on public.user_health_profiles using ((select auth.uid()) = user_id);

-- Supports account export/deletion lookups and covers the feedback FK.
create index if not exists feedback_user_id_idx on public.feedback (user_id) where user_id is not null;

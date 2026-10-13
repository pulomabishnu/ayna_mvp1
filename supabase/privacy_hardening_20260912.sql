-- Privacy/security hardening applied to production on 2026-09-12.
-- Idempotent reference SQL so checked-in intent and live Supabase privileges
-- do not drift apart again.

-- Core health/profile tables: browser access is authenticated + owner-only.
revoke all on table public.health_intakes from anon;
grant select, insert, update, delete on table public.health_intakes to authenticated;
grant all on table public.health_intakes to service_role;

drop policy if exists "health_intakes_select_own" on public.health_intakes;
drop policy if exists "health_intakes_upsert_own" on public.health_intakes;
drop policy if exists "health_intakes_update_own" on public.health_intakes;
drop policy if exists "health_intakes_delete_own" on public.health_intakes;
create policy "health_intakes_select_own" on public.health_intakes for select to authenticated using ((select auth.uid()) = user_id);
create policy "health_intakes_upsert_own" on public.health_intakes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "health_intakes_update_own" on public.health_intakes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "health_intakes_delete_own" on public.health_intakes for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.user_learning_memory from anon;
grant select, insert, update, delete on table public.user_learning_memory to authenticated;
grant all on table public.user_learning_memory to service_role;
drop policy if exists "user_learning_memory_select_own" on public.user_learning_memory;
drop policy if exists "user_learning_memory_insert_own" on public.user_learning_memory;
drop policy if exists "user_learning_memory_update_own" on public.user_learning_memory;
drop policy if exists "user_learning_memory_delete_own" on public.user_learning_memory;
create policy "user_learning_memory_select_own" on public.user_learning_memory for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_learning_memory_insert_own" on public.user_learning_memory for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_learning_memory_update_own" on public.user_learning_memory for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_learning_memory_delete_own" on public.user_learning_memory for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.user_reviews from anon;
grant select, insert, update, delete on table public.user_reviews to authenticated;
grant all on table public.user_reviews to service_role;
drop policy if exists "user_reviews_select_own" on public.user_reviews;
drop policy if exists "user_reviews_insert_own" on public.user_reviews;
drop policy if exists "user_reviews_update_own" on public.user_reviews;
drop policy if exists "user_reviews_delete_own" on public.user_reviews;
create policy "user_reviews_select_own" on public.user_reviews for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_reviews_insert_own" on public.user_reviews for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_reviews_update_own" on public.user_reviews for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_reviews_delete_own" on public.user_reviews for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on table public.user_ecosystems from anon;
grant select, insert, update, delete on table public.user_ecosystems to authenticated;
grant all on table public.user_ecosystems to service_role;
drop policy if exists "user_ecosystems_select_own" on public.user_ecosystems;
drop policy if exists "user_ecosystems_insert_own" on public.user_ecosystems;
drop policy if exists "user_ecosystems_update_own" on public.user_ecosystems;
drop policy if exists "user_ecosystems_delete_own" on public.user_ecosystems;
create policy "user_ecosystems_select_own" on public.user_ecosystems for select to authenticated using ((select auth.uid()) = user_id);
create policy "user_ecosystems_insert_own" on public.user_ecosystems for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "user_ecosystems_update_own" on public.user_ecosystems for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "user_ecosystems_delete_own" on public.user_ecosystems for delete to authenticated using ((select auth.uid()) = user_id);

-- OTP rows are server-only. No anon/authenticated table privileges or RLS
-- policies are intentionally granted.
revoke all on table public.pending_phone_verifications from anon, authenticated;
grant all on table public.pending_phone_verifications to service_role;

-- Phone data remains owner-only through RLS; the service role needs full
-- access for verification/export/deletion APIs.
revoke all on table public.phone_numbers from anon;
grant select, insert, update, delete on table public.phone_numbers to authenticated;
grant all on table public.phone_numbers to service_role;
drop policy if exists "phone_numbers_delete_own" on public.phone_numbers;
create policy "phone_numbers_delete_own" on public.phone_numbers for delete to authenticated using ((select auth.uid()) = user_id);

-- SMS transcript writes stay server-only. Signed-in users may read/delete only
-- their own transcript rows.
revoke all on table public.sms_conversations from anon;
grant select, delete on table public.sms_conversations to authenticated;
grant all on table public.sms_conversations to service_role;
drop policy if exists "sms_conversations_select_own" on public.sms_conversations;
create policy "sms_conversations_select_own" on public.sms_conversations for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "sms_conversations_delete_own" on public.sms_conversations;
create policy "sms_conversations_delete_own" on public.sms_conversations for delete to authenticated using ((select auth.uid()) = user_id);

-- These records are server-only but must be readable/deletable by the
-- self-service export and erasure endpoints.
grant all on table public.feedback to service_role;
grant all on table public.approved_users to service_role;

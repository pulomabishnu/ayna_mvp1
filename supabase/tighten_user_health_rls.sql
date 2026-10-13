-- Production hardening applied 2026-09-11.
-- Restrict sensitive per-user tables to authenticated users and enforce
-- owner checks on SELECT/INSERT/UPDATE/DELETE.

revoke all on table public.health_intakes from anon;
revoke all on table public.user_learning_memory from anon;
revoke all on table public.user_reviews from anon;
revoke all on table public.user_ecosystems from anon;

grant select, insert, update, delete on table public.health_intakes to authenticated;
grant select, insert, update, delete on table public.user_learning_memory to authenticated;
grant select, insert, update, delete on table public.user_reviews to authenticated;
grant select, insert, update, delete on table public.user_ecosystems to authenticated;

grant all on table public.health_intakes to service_role;
grant all on table public.user_learning_memory to service_role;
grant all on table public.user_reviews to service_role;
grant all on table public.user_ecosystems to service_role;

drop policy if exists "users insert own intake" on public.health_intakes;
drop policy if exists "users read own intake" on public.health_intakes;
drop policy if exists "users update own intake" on public.health_intakes;
drop policy if exists "health_intakes_select_own" on public.health_intakes;
drop policy if exists "health_intakes_upsert_own" on public.health_intakes;
drop policy if exists "health_intakes_update_own" on public.health_intakes;
drop policy if exists "health_intakes_delete_own" on public.health_intakes;
create policy "health_intakes_select_own" on public.health_intakes for select to authenticated using (auth.uid() = user_id);
create policy "health_intakes_upsert_own" on public.health_intakes for insert to authenticated with check (auth.uid() = user_id);
create policy "health_intakes_update_own" on public.health_intakes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "health_intakes_delete_own" on public.health_intakes for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "users insert own memory" on public.user_learning_memory;
drop policy if exists "users read own memory" on public.user_learning_memory;
drop policy if exists "users update own memory" on public.user_learning_memory;
drop policy if exists "user_learning_memory_select_own" on public.user_learning_memory;
drop policy if exists "user_learning_memory_insert_own" on public.user_learning_memory;
drop policy if exists "user_learning_memory_update_own" on public.user_learning_memory;
drop policy if exists "user_learning_memory_delete_own" on public.user_learning_memory;
create policy "user_learning_memory_select_own" on public.user_learning_memory for select to authenticated using (auth.uid() = user_id);
create policy "user_learning_memory_insert_own" on public.user_learning_memory for insert to authenticated with check (auth.uid() = user_id);
create policy "user_learning_memory_update_own" on public.user_learning_memory for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_learning_memory_delete_own" on public.user_learning_memory for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "users insert own reviews" on public.user_reviews;
drop policy if exists "users read own reviews" on public.user_reviews;
drop policy if exists "users update own reviews" on public.user_reviews;
drop policy if exists "user_reviews_select_own" on public.user_reviews;
drop policy if exists "user_reviews_insert_own" on public.user_reviews;
drop policy if exists "user_reviews_update_own" on public.user_reviews;
drop policy if exists "user_reviews_delete_own" on public.user_reviews;
create policy "user_reviews_select_own" on public.user_reviews for select to authenticated using (auth.uid() = user_id);
create policy "user_reviews_insert_own" on public.user_reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "user_reviews_update_own" on public.user_reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_reviews_delete_own" on public.user_reviews for delete to authenticated using (auth.uid() = user_id);

-- Her own Home layout (2026-10-25): which widgets she put on Home (app) and
-- Today (website), in what order and size. Written by src/home/homeLayout.js.
--
-- NOT run. Until it runs, the layout stays on her device only (localStorage,
-- key ayna_home_layout_v1, per signed-in owner) and the app works the same.
-- No sync code is wired yet: once this table exists, a small upsert of
-- { surface, widgets } from homeLayout.js can be added.
--
-- Contents are widget ids, sizes and a summary topic/range only, never what a
-- widget shows. Owner-only RLS. Deleting the account cascades.
-- Idempotent: create if not exists, drop policy if exists. No data dropped.

create table if not exists public.user_home_layout (
  user_id uuid not null references auth.users(id) on delete cascade,
  surface text not null check (surface in ('app', 'web')),
  widgets jsonb not null default '[]'::jsonb check (jsonb_typeof(widgets) = 'array'),
  updated_at timestamptz not null default now(),
  primary key (user_id, surface)
);

alter table public.user_home_layout enable row level security;
revoke all on public.user_home_layout from anon;
grant select, insert, update, delete on public.user_home_layout to authenticated;
grant all on public.user_home_layout to service_role;

drop policy if exists "user_home_layout_select_own" on public.user_home_layout;
create policy "user_home_layout_select_own" on public.user_home_layout
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "user_home_layout_insert_own" on public.user_home_layout;
create policy "user_home_layout_insert_own" on public.user_home_layout
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_home_layout_update_own" on public.user_home_layout;
create policy "user_home_layout_update_own" on public.user_home_layout
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_home_layout_delete_own" on public.user_home_layout;
create policy "user_home_layout_delete_own" on public.user_home_layout
  for delete to authenticated using (auth.uid() = user_id);

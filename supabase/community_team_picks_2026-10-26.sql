-- Community: team picks for the "Picked by the ayna team" pull quote.
--
-- NOT RUN AUTOMATICALLY. Review, then run once in the Supabase SQL editor.
-- Idempotent: safe to run again. Drops no data.
--
-- Why (Community audit, Oct 25, issue 5): the big pull quote used to pick a
-- member's post by itself (most "helpful"). A highlighted quote reads as ayna
-- endorsing it, so it now shows ONLY a post the ayna team picked by hand.
-- Nothing is ever picked automatically. Until this runs, no quote shows.
--
-- Who can pick: the ayna team (community_is_team_member, from
-- migrations/20261013120000_community_announcements.sql: matched on the
-- confirmed auth.users email, never on user_metadata). Everyone can read
-- which posts are picked; a hidden post's pick is not readable (the
-- community_posts policies apply inside the check below).
--
-- Tests (impersonation pattern from the announcements migration):
--   1. As a normal user:
--        insert into public.community_team_picks (post_id) values ('<post id>');
--          -> ERROR: new row violates row-level security policy  (DENIED)
--        delete from public.community_team_picks;                -- 0 rows
--   2. As a team member: the insert above is ALLOWED, and the delete removes it.
--   3. As anon: select post_id from public.community_team_picks; -- readable

begin;

create table if not exists public.community_team_picks (
  post_id uuid primary key references public.community_posts(id) on delete cascade,
  picked_by uuid default auth.uid() references auth.users(id) on delete set null,
  picked_at timestamptz not null default now()
);
create index if not exists community_team_picks_picked_at_idx on public.community_team_picks (picked_at desc);

alter table public.community_team_picks enable row level security;
revoke all on public.community_team_picks from anon, authenticated;
grant select on public.community_team_picks to anon, authenticated;
grant insert, delete on public.community_team_picks to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'community_team_picks' and policyname = 'community_team_picks_read') then
    create policy community_team_picks_read on public.community_team_picks
      for select to anon, authenticated
      using (exists (select 1 from public.community_posts p where p.id = post_id));
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'community_team_picks' and policyname = 'community_team_picks_team_insert') then
    create policy community_team_picks_team_insert on public.community_team_picks
      for insert to authenticated
      with check (public.community_is_team_member(auth.uid()) and picked_by = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'community_team_picks' and policyname = 'community_team_picks_team_delete') then
    create policy community_team_picks_team_delete on public.community_team_picks
      for delete to authenticated
      using (public.community_is_team_member(auth.uid()));
  end if;
end $$;

commit;

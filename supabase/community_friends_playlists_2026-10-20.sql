-- Community: collaborative playlists and topic suggestions (2026-10-20).
--
-- What this adds
--   * community_playlist_collaborators: a playlist owner can add friends (or
--     anyone holding the playlist's invite link) as editors. Editors can add
--     and remove products; only the owner edits the title, cover, audience
--     and the collaborator list.
--   * community_playlist_invites: one private invite code per playlist, only
--     readable by its owner. join_playlist_by_code(code) adds the caller.
--   * community_playlist_items.added_by: who added each product.
--   * community_feed_playlists gains is_collaborator and collaborator_count,
--     and collaborators can open the playlist whatever its audience.
--   * suggestions.kind accepts 'topic' (Community "Suggest a topic").
--
-- Friends already exist (community_friend_requests, request then accept, so
-- a friendship is always mutual). Nothing new is needed for them.
-- Playlist audience stays 'private' (Only me) | 'friends' | 'public'.
--
-- Safe to run more than once: create if not exists, drop policy if exists,
-- create or replace. It never deletes or rewrites existing rows.
-- NOT applied automatically. Run it in the Supabase SQL editor, after
-- community.sql and community_playlist_friends_visibility.sql.
-- Until it runs the app hides the Collaborators row and invite links, and
-- playlists work exactly as before.

begin;

-- ── Tables ─────────────────────────────────────────────────────────────────
create table if not exists public.community_playlist_collaborators (
  playlist_id uuid not null references public.community_playlists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor')),
  added_by uuid references auth.users(id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (playlist_id, user_id)
);
create index if not exists community_playlist_collaborators_user_idx
  on public.community_playlist_collaborators (user_id, added_at desc);

create table if not exists public.community_playlist_invites (
  playlist_id uuid primary key references public.community_playlists(id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{16,40}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.community_playlist_items
  add column if not exists added_by uuid references auth.users(id) on delete set null;

-- ── Helpers (security definer so policies can ask without reading rows) ────
create or replace function public.community_is_playlist_editor(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.community_playlist_collaborators c
     where c.playlist_id = pid and c.user_id = auth.uid()
  );
$$;

create or replace function public.community_can_edit_playlist(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.community_playlists pl
     where pl.id = pid
       and (pl.owner_id = auth.uid() or public.community_is_playlist_editor(pid))
  );
$$;

create or replace function public.community_can_view_playlist(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.community_playlists pl
     where pl.id = pid
       and (
         pl.owner_id = auth.uid()
         or public.community_is_playlist_editor(pid)
         or (not public.community_viewer_blocked(pl.owner_id)
             and (pl.visibility = 'public'
                  or (pl.visibility = 'friends' and public.community_viewer_is_friend(pl.owner_id))))
       )
  );
$$;

-- ── Guards ─────────────────────────────────────────────────────────────────
-- Added by is always the person adding, never a value the client picks.
create or replace function public.community_playlist_items_set_added_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null then new.added_by := auth.uid(); end if;
  return new;
end;
$$;
drop trigger if exists community_playlist_items_added_by on public.community_playlist_items;
create trigger community_playlist_items_added_by before insert on public.community_playlist_items
  for each row execute function public.community_playlist_items_set_added_by();

-- Collaborators: at most 20 per playlist, never the owner, never a guest,
-- never across a block, and an owner adding someone directly must be friends
-- with them (strangers join only through the invite link the owner shares).
create or replace function public.community_playlist_collaborators_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner uuid;
begin
  select pl.owner_id into owner from public.community_playlists pl where pl.id = new.playlist_id;
  if owner is null then raise exception 'community_playlist_unavailable' using errcode = 'P0001'; end if;
  if new.user_id = owner then raise exception 'community_collaborator_is_owner' using errcode = 'P0001'; end if;
  if public.community_user_is_guest(new.user_id) then raise exception 'community_guest_unavailable' using errcode = 'P0001'; end if;
  if public.community_is_blocked(owner, new.user_id) then raise exception 'community_blocked' using errcode = 'P0001'; end if;
  if (select count(*) from public.community_playlist_collaborators c where c.playlist_id = new.playlist_id) >= 20 then
    raise exception 'community_collaborators_full' using errcode = 'P0001';
  end if;
  -- The invite function sets this flag for its own insert; direct inserts
  -- (owner adding from the friends list) need an accepted friendship.
  if coalesce(current_setting('ayna.playlist_invite_join', true), '') <> 'on'
     and not public.community_are_friends(owner, new.user_id) then
    raise exception 'community_collaborator_not_friend' using errcode = 'P0001';
  end if;
  new.role := 'editor';
  new.added_by := coalesce(auth.uid(), new.added_by);
  new.added_at := now();
  return new;
end;
$$;
drop trigger if exists community_playlist_collaborators_bi on public.community_playlist_collaborators;
create trigger community_playlist_collaborators_bi before insert on public.community_playlist_collaborators
  for each row execute function public.community_playlist_collaborators_guard();

-- ── Invite link ────────────────────────────────────────────────────────────
-- Owner only: returns the playlist's invite code, creating it on first use.
-- rotate => true replaces it (old links stop working).
create or replace function public.community_playlist_invite_code(pid uuid, rotate boolean default false)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  result text;
begin
  if auth.uid() is null or public.community_is_guest() then
    raise exception 'community_guest_unavailable' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.community_playlists pl where pl.id = pid and pl.owner_id = auth.uid()) then
    raise exception 'community_not_playlist_owner' using errcode = 'P0001';
  end if;
  if rotate then delete from public.community_playlist_invites where playlist_id = pid; end if;
  select i.code into result from public.community_playlist_invites i where i.playlist_id = pid;
  if result is null then
    result := lower(replace(gen_random_uuid()::text, '-', ''));
    insert into public.community_playlist_invites (playlist_id, code, created_by) values (pid, result, auth.uid());
  end if;
  return result;
end;
$$;

-- Anyone signed in (not a guest) holding the code joins as an editor.
-- Returns the playlist id. Already a collaborator or the owner: still returns it.
create or replace function public.join_playlist_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid;
  owner uuid;
begin
  if auth.uid() is null or public.community_is_guest() then
    raise exception 'community_guest_unavailable' using errcode = 'P0001';
  end if;
  select i.playlist_id, pl.owner_id into pid, owner
    from public.community_playlist_invites i
    join public.community_playlists pl on pl.id = i.playlist_id
   where i.code = lower(btrim(coalesce(join_playlist_by_code.code, '')));
  if pid is null then raise exception 'community_invite_invalid' using errcode = 'P0001'; end if;
  if owner = auth.uid() or public.community_is_playlist_editor(pid) then return pid; end if;
  perform set_config('ayna.playlist_invite_join', 'on', true);
  insert into public.community_playlist_collaborators (playlist_id, user_id) values (pid, auth.uid())
    on conflict do nothing;
  perform set_config('ayna.playlist_invite_join', '', true);
  return pid;
end;
$$;

revoke execute on function public.community_playlist_invite_code(uuid, boolean) from public, anon;
revoke execute on function public.join_playlist_by_code(text) from public, anon;
grant execute on function public.community_playlist_invite_code(uuid, boolean) to authenticated;
grant execute on function public.join_playlist_by_code(text) to authenticated;
grant execute on function public.community_is_playlist_editor(uuid) to anon, authenticated;
grant execute on function public.community_can_edit_playlist(uuid) to anon, authenticated;
grant execute on function public.community_can_view_playlist(uuid) to anon, authenticated;

-- ── RLS ────────────────────────────────────────────────────────────────────
alter table public.community_playlist_collaborators enable row level security;
alter table public.community_playlist_invites enable row level security;

revoke all on public.community_playlist_collaborators from anon, authenticated;
grant select on public.community_playlist_collaborators to anon, authenticated;
grant insert, delete on public.community_playlist_collaborators to authenticated;
grant all on public.community_playlist_collaborators to service_role;

-- Whoever can open the playlist sees who collaborates on it.
drop policy if exists community_playlist_collaborators_select on public.community_playlist_collaborators;
create policy community_playlist_collaborators_select on public.community_playlist_collaborators
  for select to anon, authenticated using (public.community_can_view_playlist(playlist_id));
-- The owner adds collaborators (the guard trigger requires a friendship).
drop policy if exists community_playlist_collaborators_insert on public.community_playlist_collaborators;
create policy community_playlist_collaborators_insert on public.community_playlist_collaborators
  for insert to authenticated with check (exists (
    select 1 from public.community_playlists pl where pl.id = playlist_id and pl.owner_id = auth.uid()));
-- The owner removes anyone; a collaborator can leave.
drop policy if exists community_playlist_collaborators_delete on public.community_playlist_collaborators;
create policy community_playlist_collaborators_delete on public.community_playlist_collaborators
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.community_playlists pl where pl.id = playlist_id and pl.owner_id = auth.uid()));

-- Invite codes: owner only. Codes are minted by community_playlist_invite_code.
revoke all on public.community_playlist_invites from anon, authenticated;
grant select, delete on public.community_playlist_invites to authenticated;
grant all on public.community_playlist_invites to service_role;
drop policy if exists community_playlist_invites_owner on public.community_playlist_invites;
create policy community_playlist_invites_owner on public.community_playlist_invites
  for all to authenticated
  using (exists (select 1 from public.community_playlists pl where pl.id = playlist_id and pl.owner_id = auth.uid()))
  with check (false);

-- Playlists: collaborators can open them whatever the audience.
drop policy if exists community_playlists_select on public.community_playlists;
create policy community_playlists_select on public.community_playlists
for select using (
  owner_id = auth.uid()
  or public.community_is_playlist_editor(id)
  or (
    not public.community_viewer_blocked(owner_id)
    and (
      visibility = 'public'
      or (visibility = 'friends' and public.community_viewer_is_friend(owner_id))
    )
  )
);

-- Items: anyone who can open the playlist reads them; owner and editors write.
drop policy if exists community_playlist_items_select on public.community_playlist_items;
create policy community_playlist_items_select on public.community_playlist_items
  for select using (public.community_can_view_playlist(playlist_id));
drop policy if exists community_playlist_items_write on public.community_playlist_items;
create policy community_playlist_items_write on public.community_playlist_items
  for insert to authenticated with check (public.community_can_edit_playlist(playlist_id));
drop policy if exists community_playlist_items_update on public.community_playlist_items;
create policy community_playlist_items_update on public.community_playlist_items
  for update to authenticated
  using (public.community_can_edit_playlist(playlist_id))
  with check (public.community_can_edit_playlist(playlist_id));
drop policy if exists community_playlist_items_delete on public.community_playlist_items;
create policy community_playlist_items_delete on public.community_playlist_items
  for delete to authenticated using (public.community_can_edit_playlist(playlist_id));

-- Accounts only (same pattern as community.sql): guests can read, never write.
do $$
declare
  t text;
  cmd text;
begin
  foreach t in array array['community_playlist_collaborators', 'community_playlist_invites'] loop
    foreach cmd in array array['insert', 'delete'] loop
      execute format('drop policy if exists %I on public.%I', t || '_no_guests_' || cmd, t);
      if cmd = 'insert' then
        execute format('create policy %I on public.%I as restrictive for insert to authenticated with check (not public.community_is_guest())', t || '_no_guests_' || cmd, t);
      else
        execute format('create policy %I on public.%I as restrictive for delete to authenticated using (not public.community_is_guest())', t || '_no_guests_' || cmd, t);
      end if;
    end loop;
  end loop;
end $$;

-- ── Feed view ──────────────────────────────────────────────────────────────
-- Same columns, in the same order, as community_playlist_friends_visibility.sql,
-- with is_collaborator and collaborator_count added at the end.
create or replace view public.community_feed_playlists
with (security_barrier = true) as
select pl.id,
  pl.owner_id,
  pr.username as owner_username,
  pr.display_name as owner_display_name,
  pr.avatar_url as owner_avatar_url,
  coalesce(pl.owner_id = auth.uid(), false) as is_mine,
  pl.title,
  pl.description,
  pl.cover_url,
  pl.visibility,
  pl.item_count,
  pl.save_count,
  coalesce((
    select array_agg(i.product_id order by i."position", i.added_at)
    from (
      select product_id, "position", added_at
      from public.community_playlist_items
      where playlist_id = pl.id
      order by "position", added_at limit 4
    ) i
  ), '{}'::text[]) as preview_product_ids,
  exists (
    select 1 from public.community_playlist_saves s
    where s.playlist_id = pl.id and s.user_id = auth.uid()
  ) as viewer_saved,
  pl.created_at,
  pl.updated_at,
  exists (
    select 1 from public.community_playlist_collaborators c
    where c.playlist_id = pl.id and c.user_id = auth.uid()
  ) as is_collaborator,
  (select count(*)::int from public.community_playlist_collaborators c where c.playlist_id = pl.id) as collaborator_count
from public.community_playlists pl
left join public.community_profiles pr on pr.user_id = pl.owner_id
where (
  pl.owner_id = auth.uid()
  or pl.visibility = 'public'
  or (pl.visibility = 'friends' and exists (
    select 1 from public.community_friend_requests f
    where f.status = 'accepted'
      and ((f.requester_id = auth.uid() and f.addressee_id = pl.owner_id)
        or (f.addressee_id = auth.uid() and f.requester_id = pl.owner_id))
  ))
  or exists (
    select 1 from public.community_playlist_collaborators c
    where c.playlist_id = pl.id and c.user_id = auth.uid()
  )
)
and not public.community_viewer_blocked(pl.owner_id);

grant select on public.community_feed_playlists to anon, authenticated;

-- ── Suggestions: Community "Suggest a topic" ──────────────────────────────
do $$
begin
  if to_regclass('public.suggestions') is null then
    raise notice 'suggestions does not exist yet, run migrations/20261013130000_suggestions.sql first';
    return;
  end if;
  alter table public.suggestions drop constraint if exists suggestions_kind_check;
  alter table public.suggestions add constraint suggestions_kind_check
    check (kind in ('product', 'read', 'topic'));
  alter table public.suggestions drop constraint if exists suggestions_has_text;
  alter table public.suggestions add constraint suggestions_has_text check (
    (kind = 'product' and product_name is not null and char_length(btrim(product_name)) > 0)
    or (kind in ('read', 'topic') and topic is not null and char_length(btrim(topic)) > 0)
  );
end $$;

commit;

-- Check after running:
--   select count(*) from public.community_playlist_collaborators;
--   select id, is_collaborator, collaborator_count from public.community_feed_playlists limit 5;

-- Accepted friends may view playlists marked friends. Owners retain access.
-- Keep this predicate in sync across table policies and the feed view.
alter table public.community_playlists
  drop constraint community_playlists_visibility_check;
alter table public.community_playlists
  add constraint community_playlists_visibility_check
  check (visibility in ('public', 'friends', 'private'));

drop policy if exists community_playlists_select on public.community_playlists;
create policy community_playlists_select on public.community_playlists
for select using (
  owner_id = auth.uid()
  or (
    not public.community_viewer_blocked(owner_id)
    and (
      visibility = 'public'
      or (visibility = 'friends' and exists (
        select 1 from public.community_friend_requests f
        where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = owner_id)
            or (f.addressee_id = auth.uid() and f.requester_id = owner_id))
      ))
    )
  )
);

drop policy if exists community_playlist_items_select on public.community_playlist_items;
create policy community_playlist_items_select on public.community_playlist_items
for select using (exists (
  select 1 from public.community_playlists pl
  where pl.id = playlist_id
    and (pl.owner_id = auth.uid() or (
      not public.community_viewer_blocked(pl.owner_id)
      and (pl.visibility = 'public' or (pl.visibility = 'friends' and exists (
        select 1 from public.community_friend_requests f
        where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = pl.owner_id)
            or (f.addressee_id = auth.uid() and f.requester_id = pl.owner_id))
      )))
    ))
));

drop policy if exists community_playlist_saves_own on public.community_playlist_saves;
create policy community_playlist_saves_own on public.community_playlist_saves
for all using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.community_playlists pl
    where pl.id = playlist_id and pl.owner_id <> auth.uid()
      and not public.community_viewer_blocked(pl.owner_id)
      and (pl.visibility = 'public' or (pl.visibility = 'friends' and exists (
        select 1 from public.community_friend_requests f
        where f.status = 'accepted'
          and ((f.requester_id = auth.uid() and f.addressee_id = pl.owner_id)
            or (f.addressee_id = auth.uid() and f.requester_id = pl.owner_id))
      )))
  )
);

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
  pl.updated_at
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
)
and not public.community_viewer_blocked(pl.owner_id);

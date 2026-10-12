-- Purge test content from the public Community feed (launch audit C01).
-- Run by hand in the Supabase SQL editor. Nothing here runs automatically.
--
-- STEP 1: preview. Run only this block first and read the rows it returns.
-- Edit the patterns or add ids until the list is exactly the test content.

select 'post' as kind, p.id, p.created_at, p.author_id, left(p.body, 80) as text
from community_posts p
where p.body ilike any (array['%aatestign%', 'testing', 'test', 'test %', '%asdf%', 'This was good'])
union all
select 'playlist', pl.id, pl.created_at, pl.user_id, pl.title
from community_playlists pl
where pl.title ilike any (array['brand partnerships', 'test%', '%asdf%'])
order by created_at;

-- STEP 2: delete. When the preview is right, paste the ids from step 1 into
-- the two arrays below and run this block. It is one transaction: if any
-- statement fails, nothing is deleted. Child rows (media, tagged products,
-- comments, votes, saves, playlist items) are removed first so no foreign
-- key blocks the delete, even where the schema has no ON DELETE CASCADE.
--
-- begin;
--
-- create temp table purge_posts(id uuid) on commit drop;
-- insert into purge_posts values
--   ('00000000-0000-0000-0000-000000000000'); -- replace with post ids
--
-- create temp table purge_playlists(id uuid) on commit drop;
-- insert into purge_playlists values
--   ('00000000-0000-0000-0000-000000000000'); -- replace with playlist ids
--
-- delete from community_post_media      where post_id in (select id from purge_posts);
-- delete from community_post_products   where post_id in (select id from purge_posts);
-- delete from community_helpful_votes   where post_id in (select id from purge_posts);
-- delete from community_saved_posts     where post_id in (select id from purge_posts);
-- delete from community_hidden_posts    where post_id in (select id from purge_posts);
-- delete from community_reports         where post_id in (select id from purge_posts);
-- delete from community_comments        where post_id in (select id from purge_posts);
-- delete from community_posts           where id      in (select id from purge_posts);
--
-- delete from community_playlist_items  where playlist_id in (select id from purge_playlists);
-- delete from community_playlist_saves  where playlist_id in (select id from purge_playlists);
-- delete from community_playlists       where id          in (select id from purge_playlists);
--
-- commit;
--
-- If a "column does not exist" error appears on one of the child tables
-- (for example community_reports may key on a different column), delete
-- that one line and run the block again.

-- Behavioural tests for community.sql: RLS isolation, anonymous-author
-- protection, counters, notifications, friends-only recommendations,
-- playlist visibility, reports and blocks.
--
-- Raises on the first failure:
--   psql "$DB" -v ON_ERROR_STOP=1 -f supabase/_community_behaviour_test.sql
--
-- Runs as the real `authenticated` / `anon` roles with auth.uid() switched via
-- the request.jwt.claim.sub GUC (see _local_bootstrap.sql). Cleans up after
-- itself.

\set A '00000000-0000-4000-8000-0000000000ca'
\set B '00000000-0000-4000-8000-0000000000cb'
\set C '00000000-0000-4000-8000-0000000000cc'

insert into auth.users (id, email) values
  (:'A', 'comm-a@test.local'), (:'B', 'comm-b@test.local'), (:'C', 'comm-c@test.local')
on conflict (id) do nothing;

-- Clean slate.
delete from public.community_profiles where user_id in (:'A', :'B', :'C');
delete from public.community_posts where author_id in (:'A', :'B', :'C');
delete from public.community_playlists where owner_id in (:'A', :'B', :'C');
delete from public.community_follows where follower_id in (:'A', :'B', :'C');
delete from public.community_friend_requests where requester_id in (:'A', :'B', :'C');
delete from public.community_blocks where blocker_id in (:'A', :'B', :'C');
delete from public.community_notifications where recipient_id in (:'A', :'B', :'C');
delete from public.community_reports where reporter_id in (:'A', :'B', :'C');
delete from public.user_health_profiles where user_id in (:'A', :'B', :'C');

-- A's private health profile, which nothing in the community may expose.
insert into public.user_health_profiles (user_id, profile)
values (:'A', '{"conditions": ["PCOS"]}');

create temporary table if not exists _ct (k text primary key, v text);
grant all on _ct to authenticated, anon;
truncate _ct;
insert into _ct
select 'p1', id from public.product_catalog where is_active order by id limit 1;
insert into _ct
select 'p2', id from public.product_catalog where is_active order by id offset 1 limit 1;

begin;
set local role authenticated;

do $$
declare
  a uuid := '00000000-0000-4000-8000-0000000000ca';
  b uuid := '00000000-0000-4000-8000-0000000000cb';
  c uuid := '00000000-0000-4000-8000-0000000000cc';
  p1 text := (select v from _ct where k = 'p1');
  p2 text := (select v from _ct where k = 'p2');
  anon_post uuid;
  named_post uuid;
  b_comment uuid;
  playlist uuid;
  req uuid;
  n integer;
  r record;
  failed boolean;
begin
  if p1 is null or p2 is null then raise exception 'catalog not seeded — community tests need two products'; end if;

  -- ── profiles ─────────────────────────────────────────────────────────────
  perform set_config('request.jwt.claim.sub', a::text, true);
  insert into public.community_profiles (user_id, username, display_name) values (a, 'ameera_t', 'Ameera');
  perform set_config('request.jwt.claim.sub', b::text, true);
  insert into public.community_profiles (user_id, username, display_name) values (b, 'bea_t', 'Bea');
  perform set_config('request.jwt.claim.sub', c::text, true);
  insert into public.community_profiles (user_id, username, display_name) values (c, 'cleo_t', 'Cleo');

  failed := false;
  begin
    insert into public.community_profiles (user_id, username, display_name) values (a, 'imposter', 'Not A');
  exception when others then failed := true; end;
  if not failed then raise exception 'SECURITY: C created a profile for A'; end if;

  -- ── posts ────────────────────────────────────────────────────────────────
  perform set_config('request.jwt.claim.sub', a::text, true);
  insert into public.community_posts (author_id, kind, body, topics, is_anonymous)
  values (a, 'question', 'Anything that helps hormonal acne?', array['Acne', 'pcos'], true)
  returning id into anon_post;
  insert into public.community_post_products (post_id, product_id) values (anon_post, p1);
  insert into public.community_posts (author_id, kind, body, product_id, rating, would_recommend)
  values (a, 'review', 'Worked for me.', p2, 5, true)
  returning id into named_post;

  select topics into r from public.community_posts where id = anon_post;
  if not (r.topics @> array['acne'] and r.topics @> array['pcos']) then
    raise exception 'topics not normalised to lowercase: %', r.topics;
  end if;

  failed := false;
  begin
    insert into public.community_posts (author_id, kind, body, product_id, rating)
    values (a, 'review', 'fake product', 'definitely-not-a-real-product-id', 4);
  exception when foreign_key_violation then failed := true; end;
  if not failed then raise exception 'a review was accepted for a product that is not in the catalog'; end if;

  -- B's view of A's posts.
  perform set_config('request.jwt.claim.sub', b::text, true);
  select count(*) into n from public.community_posts where author_id = a;
  if n <> 0 then raise exception 'SECURITY: B can read A''s rows in the base posts table (anonymous author exposed)'; end if;
  select count(*) into n from public.community_posts;
  if n <> 0 then raise exception 'SECURITY: base posts table leaks other authors'; end if;

  select * into r from public.community_feed_posts where id = anon_post;
  if r.id is null then raise exception 'anonymous post missing from feed'; end if;
  if r.author_id is not null or r.author_username is not null or r.author_display_name is not null or r.author_avatar_url is not null then
    raise exception 'SECURITY: anonymous post exposes its author in the feed view';
  end if;
  if r.is_mine then raise exception 'is_mine true for another user''s post'; end if;
  if not (r.tagged_product_ids @> array[p1]) then raise exception 'tagged product missing from feed row'; end if;

  select * into r from public.community_feed_posts where id = named_post;
  if r.author_id <> a or r.author_username <> 'ameera_t' then raise exception 'named post lost its author'; end if;

  select count(*) into n from public.community_feed_posts where author_id = a;
  if n <> 1 then raise exception 'SECURITY: filtering the feed by author_id finds A''s anonymous post (got %)', n; end if;

  -- B cannot write as A or touch A's posts.
  failed := false;
  begin
    insert into public.community_posts (author_id, kind, body) values (a, 'post', 'impersonation');
  exception when others then failed := true; end;
  if not failed then raise exception 'SECURITY: B posted as A'; end if;
  update public.community_posts set body = 'defaced' where id = named_post;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'SECURITY: B edited A''s post'; end if;
  delete from public.community_posts where id = named_post;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'SECURITY: B deleted A''s post'; end if;
  failed := false;
  begin
    insert into public.community_post_products (post_id, product_id) values (named_post, p1);
  exception when others then failed := true; end;
  if not failed then raise exception 'SECURITY: B tagged a product onto A''s post'; end if;

  -- Private health data is not reachable.
  select count(*) into n from public.user_health_profiles where user_id = a;
  if n <> 0 then raise exception 'SECURITY: B can read A''s health profile'; end if;

  -- ── comments + notifications ─────────────────────────────────────────────
  insert into public.community_comments (post_id, author_id, body, product_id)
  values (anon_post, b, 'Try this one', p2) returning id into b_comment;
  insert into public.community_comments (post_id, author_id, body, is_anonymous)
  values (anon_post, b, 'Also, me too', true);

  perform set_config('request.jwt.claim.sub', a::text, true);
  select count(*) into n from public.community_notifications where type = 'comment' and post_id = anon_post;
  if n <> 2 then raise exception 'expected 2 comment notifications for A, got %', n; end if;
  select count(*) into n from public.community_notifications where type = 'comment' and post_id = anon_post and actor_id is null;
  if n <> 1 then raise exception 'SECURITY: anonymous comment notification names its author'; end if;
  select comment_count into n from public.community_feed_posts where id = anon_post;
  if n <> 2 then raise exception 'comment_count not maintained (%).', n; end if;

  -- OP replies anonymously in their own anonymous thread → B notified, OP flagged without identity.
  insert into public.community_comments (post_id, parent_id, author_id, body, is_anonymous)
  values (anon_post, b_comment, a, 'thank you!', true);
  -- …and a named comment on their own anonymous post must not be flagged as OP.
  insert into public.community_comments (post_id, author_id, body)
  values (anon_post, a, 'named follow-up');

  perform set_config('request.jwt.claim.sub', b::text, true);
  select count(*) into n from public.community_notifications where type = 'reply' and actor_id is null;
  if n <> 1 then raise exception 'reply notification missing or names the anonymous OP (%).', n; end if;
  select count(*) into n from public.community_feed_comments where post_id = anon_post and is_post_author and author_id is not null;
  if n <> 0 then raise exception 'SECURITY: a named comment is labelled as the anonymous OP'; end if;
  select count(*) into n from public.community_feed_comments where post_id = anon_post and is_post_author;
  if n <> 1 then raise exception 'anonymous OP reply not labelled OP'; end if;

  select count(*) into n from public.community_notifications where recipient_id = a;
  if n <> 0 then raise exception 'SECURITY: B can read A''s notifications'; end if;
  failed := false;
  begin
    insert into public.community_notifications (recipient_id, actor_id, type) values (a, b, 'follow');
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: a client can forge notifications'; end if;

  -- ── helpful votes ───────────────────────────────────────────────────────
  insert into public.community_helpful_votes (user_id, post_id) values (b, anon_post);
  select helpful_count into n from public.community_feed_posts where id = anon_post;
  if n <> 1 then raise exception 'helpful_count not incremented'; end if;
  failed := false;
  begin
    update public.community_posts set helpful_count = 999 where id = anon_post;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: helpful_count is client-writable'; end if;
  failed := false;
  begin
    insert into public.community_helpful_votes (user_id, post_id) values (b, anon_post);
  exception when unique_violation then failed := true; end;
  if not failed then raise exception 'double helpful vote accepted'; end if;

  perform set_config('request.jwt.claim.sub', a::text, true);
  failed := false;
  begin
    insert into public.community_helpful_votes (user_id, post_id) values (a, named_post);
  exception when others then failed := true; end;
  if not failed then raise exception 'author voted on their own post'; end if;
  failed := false;
  begin
    update public.community_posts set status = 'visible' where id = named_post;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: an author can change moderation status'; end if;

  -- ── blocks never become an anonymity oracle ─────────────────────────────
  perform set_config('request.jwt.claim.sub', b::text, true);
  insert into public.community_blocks (blocker_id, blocked_id) values (b, a);
  select count(*) into n from public.community_feed_posts where id = anon_post;
  if n <> 1 then raise exception 'SECURITY: blocking A hid A''s anonymous post — that unmasks the author'; end if;
  select count(*) into n from public.community_feed_posts where id = named_post;
  if n <> 0 then raise exception 'block did not hide the blocked user''s named post'; end if;
  perform set_config('request.jwt.claim.sub', a::text, true);
  select count(*) into n from public.community_feed_comments where post_id = anon_post and is_anonymous;
  if n < 1 then raise exception 'SECURITY: being blocked hid the blocker''s anonymous comment'; end if;
  perform set_config('request.jwt.claim.sub', b::text, true);
  delete from public.community_blocks where blocker_id = b and blocked_id = a;

  -- ── hide ────────────────────────────────────────────────────────────────
  insert into public.community_hidden_posts (user_id, post_id) values (b, anon_post);
  select count(*) into n from public.community_feed_posts where id = anon_post;
  if n <> 0 then raise exception 'hidden post still in feed'; end if;
  delete from public.community_hidden_posts where user_id = b;

  -- ── follows ─────────────────────────────────────────────────────────────
  insert into public.community_follows (follower_id, followee_id) values (b, a);
  failed := false;
  begin
    insert into public.community_follows (follower_id, followee_id) values (a, c);
  exception when others then failed := true; end;
  if not failed then raise exception 'SECURITY: B created a follow on A''s behalf'; end if;
  select followers into n from public.community_profile_stats(a);
  if n <> 1 then raise exception 'follower count wrong (%).', n; end if;

  -- ── friends + recommendations ───────────────────────────────────────────
  insert into public.community_friend_requests (requester_id, addressee_id) values (b, a) returning id into req;
  update public.community_friend_requests set status = 'accepted' where id = req;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'SECURITY: requester accepted their own friend request'; end if;

  failed := false;
  begin
    insert into public.community_product_recommendations (sender_id, recipient_id, product_id) values (b, a, p1);
  exception when others then failed := true; end;
  if not failed then raise exception 'recommendation sent before the friend request was accepted'; end if;

  perform set_config('request.jwt.claim.sub', a::text, true);
  update public.community_friend_requests set status = 'accepted' where id = req;
  perform set_config('request.jwt.claim.sub', b::text, true);
  select count(*) into n from public.community_notifications where type = 'friend_accepted';
  if n <> 1 then raise exception 'friend_accepted notification missing'; end if;
  insert into public.community_product_recommendations (sender_id, recipient_id, product_id, note) values (b, a, p1, 'you''ll like this');
  select friends into n from public.community_profile_stats(a);
  if n <> 1 then raise exception 'friend count wrong'; end if;

  perform set_config('request.jwt.claim.sub', c::text, true);
  failed := false;
  begin
    insert into public.community_product_recommendations (sender_id, recipient_id, product_id) values (c, a, p1);
  exception when others then failed := true; end;
  if not failed then raise exception 'a non-friend sent a recommendation'; end if;
  select count(*) into n from public.community_product_recommendations;
  if n <> 0 then raise exception 'SECURITY: C can read other people''s recommendations'; end if;
  select count(*) into n from public.community_friend_requests;
  if n <> 0 then raise exception 'SECURITY: C can read other people''s friendships'; end if;

  perform set_config('request.jwt.claim.sub', a::text, true);
  select count(*) into n from public.community_notifications where type = 'recommendation' and product_id = p1 and actor_id = b;
  if n <> 1 then raise exception 'recommendation notification missing'; end if;

  -- ── playlists ───────────────────────────────────────────────────────────
  insert into public.community_playlists (owner_id, title, visibility) values (a, 'my pcos essentials', 'private')
  returning id into playlist;
  insert into public.community_playlist_items (playlist_id, product_id) values (playlist, p1), (playlist, p2);
  select item_count into n from public.community_playlists where id = playlist;
  if n <> 2 then raise exception 'item_count not maintained'; end if;

  perform set_config('request.jwt.claim.sub', b::text, true);
  select count(*) into n from public.community_playlist_items where playlist_id = playlist;
  if n <> 0 then raise exception 'SECURITY: private playlist items readable by others'; end if;
  select count(*) into n from public.community_feed_playlists where id = playlist;
  if n <> 0 then raise exception 'SECURITY: private playlist listed for others'; end if;
  failed := false;
  begin
    insert into public.community_playlist_items (playlist_id, product_id) values (playlist, (select id from public.product_catalog where is_active order by id offset 2 limit 1));
  exception when others then failed := true; end;
  if not failed then raise exception 'SECURITY: B added to A''s playlist'; end if;

  perform set_config('request.jwt.claim.sub', a::text, true);
  update public.community_playlists set visibility = 'public' where id = playlist;
  perform set_config('request.jwt.claim.sub', b::text, true);
  select count(*) into n from public.community_playlist_items where playlist_id = playlist;
  if n <> 2 then raise exception 'public playlist items not readable'; end if;
  update public.community_playlists set title = 'hijacked' where id = playlist;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'SECURITY: B renamed A''s playlist'; end if;
  insert into public.community_playlist_saves (user_id, playlist_id) values (b, playlist);
  select save_count into n from public.community_feed_playlists where id = playlist;
  if n <> 1 then raise exception 'save_count not maintained'; end if;

  -- ── reports ─────────────────────────────────────────────────────────────
  insert into public.community_reports (reporter_id, target_type, post_id, reason)
  values (b, 'post', anon_post, 'unsafe_advice');
  failed := false;
  begin
    insert into public.community_reports (reporter_id, target_type, post_id, reason, status)
    values (b, 'post', anon_post, 'spam', 'actioned');
  exception when others then failed := true; end;
  if not failed then raise exception 'SECURITY: a reporter set their own report status'; end if;
  perform set_config('request.jwt.claim.sub', a::text, true);
  select count(*) into n from public.community_reports;
  if n <> 0 then raise exception 'SECURITY: reported author can read the report'; end if;

  raise notice 'Community RLS (authenticated): OK';
end $$;
commit;

begin;
set local role anon;
do $$
declare failed boolean := false;
begin
  begin
    perform 1 from public.community_feed_posts limit 1;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: signed-out visitors can read the community feed'; end if;
  failed := false;
  begin
    perform 1 from public.community_profiles limit 1;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: signed-out visitors can read community profiles'; end if;
  raise notice 'Community RLS (anon): OK';
end $$;
commit;

-- Cleanup.
delete from public.community_posts where author_id in (:'A', :'B', :'C');
delete from public.community_playlists where owner_id in (:'A', :'B', :'C');
delete from public.community_profiles where user_id in (:'A', :'B', :'C');
delete from public.community_follows where follower_id in (:'A', :'B', :'C');
delete from public.community_friend_requests where requester_id in (:'A', :'B', :'C');
delete from public.community_notifications where recipient_id in (:'A', :'B', :'C');
delete from public.community_reports where reporter_id in (:'A', :'B', :'C');
delete from public.user_health_profiles where user_id in (:'A', :'B', :'C');
delete from auth.users where id in (:'A', :'B', :'C');

select 'community behaviour tests passed' as status;

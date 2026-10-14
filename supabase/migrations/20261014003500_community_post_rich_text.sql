-- Structured, sanitized rich text for Community post bodies.
-- `body` remains the canonical plain-text representation for moderation,
-- search, notifications, older clients, and backwards compatibility.

alter table public.community_posts
  add column if not exists rich_body jsonb;

alter table public.community_posts
  drop constraint if exists community_posts_rich_body_shape;

alter table public.community_posts
  add constraint community_posts_rich_body_shape check (
    rich_body is null
    or (
      jsonb_typeof(rich_body) = 'object'
      and rich_body ->> 'version' = '1'
      and jsonb_typeof(rich_body -> 'blocks') = 'array'
      and length(rich_body::text) <= 50000
    )
  );

-- Keep the existing privacy/masking logic exactly the same and expose the new
-- field at the end so existing clients that only read the old columns continue
-- to work unchanged.
create or replace view public.community_feed_posts
with (security_barrier = true)
as
select
  p.id,
  p.kind,
  p.body,
  p.topics,
  p.is_anonymous,
  case when p.is_anonymous then null::uuid else p.author_id end as author_id,
  case when p.is_anonymous then null::text else pr.username end as author_username,
  case when p.is_anonymous then null::text else pr.display_name end as author_display_name,
  case when p.is_anonymous then null::text else pr.avatar_url end as author_avatar_url,
  coalesce((p.author_id = auth.uid()), false) as is_mine,
  p.product_id,
  coalesce((
    select array_agg(pp.product_id order by pp."position", pp.product_id)
    from public.community_post_products pp
    where pp.post_id = p.id
  ), '{}'::text[]) as tagged_product_ids,
  p.rating,
  p.would_recommend,
  p.photo_url,
  p.helpful_count,
  p.comment_count,
  exists (
    select 1
    from public.community_helpful_votes v
    where v.post_id = p.id and v.user_id = auth.uid()
  ) as viewer_found_helpful,
  exists (
    select 1
    from public.community_saved_posts s
    where s.post_id = p.id and s.user_id = auth.uid()
  ) as viewer_saved,
  p.created_at,
  p.edited_at,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'path', m.storage_path,
        'width', m.width,
        'height', m.height
      ) order by m."position", m.created_at
    )
    from public.community_post_media m
    where m.post_id = p.id and m.status = 'published'
  ), '[]'::jsonb) as media,
  p.rich_body
from public.community_posts p
left join public.community_profiles pr on pr.user_id = p.author_id
where p.status = 'visible'
  and (p.is_anonymous or not public.community_viewer_blocked(p.author_id))
  and not exists (
    select 1
    from public.community_hidden_posts h
    where h.post_id = p.id and h.user_id = auth.uid()
  );

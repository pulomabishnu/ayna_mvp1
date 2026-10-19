-- Community review ratings, live per-product averages (2026-10-19).
--
-- Product cards and product pages show "★ 4.5 · 2 reviews" from community
-- reviews. This view computes that at read time from the reviews that are
-- live right now, so:
--   * editing a review's stars changes the average on the next read,
--   * deleting a review (row gone) drops it from the average,
--   * a review moderation hides or removes (status <> 'visible') drops out too.
-- Nothing is copied into a per-product column, so there is nothing to go stale.
--
-- Safe to run more than once. Creates or replaces a view and an index only;
-- it never deletes or rewrites user data. Run it in the Supabase SQL editor.
-- Until it runs, the app adds up community_feed_posts itself (same result).

do $$
begin
  if to_regclass('public.community_posts') is null then
    raise notice 'community_posts does not exist yet, run community.sql first';
    return;
  end if;

  -- Speeds up the per-product roll-up and the product page's review list.
  execute $sql$
    create index if not exists community_posts_review_product_idx
      on public.community_posts (product_id, created_at desc)
      where kind = 'review' and status = 'visible'
  $sql$;

  -- Owner-rights view (like community_feed_posts) so signed-out shoppers can
  -- read the averages. It exposes only per-product counts and averages, never
  -- who wrote what, and includes anonymous reviews in the numbers only.
  execute $sql$
    create or replace view public.community_product_review_stats
    with (security_barrier = true)
    as
    select
      p.product_id,
      count(*)::int as review_count,
      round(avg(p.rating)::numeric, 2) as average_rating,
      count(*) filter (where p.rating = 1)::int as rating_1,
      count(*) filter (where p.rating = 2)::int as rating_2,
      count(*) filter (where p.rating = 3)::int as rating_3,
      count(*) filter (where p.rating = 4)::int as rating_4,
      count(*) filter (where p.rating = 5)::int as rating_5,
      max(coalesce(p.edited_at, p.created_at)) as last_changed_at
    from public.community_posts p
    where p.kind = 'review'
      and p.status = 'visible'
      and p.product_id is not null
      and p.rating between 1 and 5
    group by p.product_id
  $sql$;

  execute 'revoke all on public.community_product_review_stats from public';
  execute 'grant select on public.community_product_review_stats to anon, authenticated, service_role';

  -- Authors can already change body and rating on their own review
  -- (community.sql grants update (body, topics, rating, would_recommend,
  -- photo_url)). Re-granting is a no-op when it is already there.
  execute 'grant update (body, rating) on public.community_posts to authenticated';
end
$$;

-- Check after running:
--   select * from public.community_product_review_stats order by review_count desc limit 20;

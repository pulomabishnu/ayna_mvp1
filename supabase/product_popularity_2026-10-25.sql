-- Trending products, privacy safe (2026-10-25), for the "Trending products"
-- Home widget (src/home/useHomeRemote.js).
--
-- public.product_popularity_30d(p_limit): products saved or added to a routine
-- by at least 5 different people in the last 30 days, with the count of
-- people. Counts only: no user ids, no timestamps, no rows. A product below
-- the minimum never appears, so no single person can be inferred.
-- Reads user_ecosystems (owner-only RLS) through a security definer function;
-- the table itself stays private.
--
-- NOT run. Until it runs the widget is not offered anywhere (the call fails
-- and the app hides it). Nothing is ranked by made-up popularity.
-- Idempotent: create or replace. No data changed.

create or replace function public.product_popularity_30d(p_limit integer default 6)
returns table (product_id text, saves integer)
language sql
stable
security definer
set search_path = ''
as $$
  select e.product_id, count(distinct e.user_id)::int as saves
    from public.user_ecosystems e
   where (e.is_saved or e.in_ecosystem)
     and not e.is_omitted
     and e.updated_at >= now() - interval '30 days'
   group by e.product_id
  having count(distinct e.user_id) >= 5
   order by saves desc, e.product_id
   limit least(greatest(coalesce(p_limit, 6), 1), 20);
$$;

revoke all on function public.product_popularity_30d(integer) from public;
grant execute on function public.product_popularity_30d(integer) to anon, authenticated, service_role;

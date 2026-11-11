-- Anonymous Buy Now counter: how many times each product Buy button was
-- clicked per day. Written for api/go.js. Idempotent: safe to re-run.
-- NOT applied automatically; a founder runs it once in the Supabase SQL editor.
-- Needs public.product_catalog (supabase/product_catalog.sql, already applied).
--
-- What is stored: product id, day (UTC), count. Nothing about the person:
-- no IP address, user agent, cookie, account or analytics id.
--
-- Reading the numbers (SQL editor / service role only):
--   select c.day, c.product_id, p.name, p.brand, c.clicks
--   from public.buy_click_daily c left join public.product_catalog p on p.id = c.product_id
--   order by c.day desc, c.clicks desc;

create table if not exists public.buy_click_daily (
  product_id text not null,
  day date not null default ((now() at time zone 'utc')::date),
  clicks integer not null default 0 check (clicks >= 0),
  primary key (product_id, day)
);

alter table public.buy_click_daily enable row level security;
-- No policies: only the service role (api/go.js) reads or writes.
revoke all on public.buy_click_daily from anon, authenticated;
grant all on public.buy_click_daily to service_role;

-- +1 for today. Unknown product ids are ignored, so made-up ids add no rows.
create or replace function public.record_buy_click(p_product_id text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.buy_click_daily (product_id, day, clicks)
  select p_product_id, (now() at time zone 'utc')::date, 1
  where exists (select 1 from public.product_catalog where id = p_product_id)
  on conflict (product_id, day) do update set clicks = public.buy_click_daily.clicks + 1
$$;

revoke all on function public.record_buy_click(text) from public, anon, authenticated;
grant execute on function public.record_buy_click(text) to service_role;

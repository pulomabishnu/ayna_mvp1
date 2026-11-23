-- Gift box orders: tracking number + carrier, and when the customer was last
-- emailed about their order.
--
-- Run AFTER 20261030120000_gift_box.sql. Idempotent: safe to re-run. NOT
-- applied automatically; run it once in the Supabase SQL editor.
--
-- The admin page (/admin/gift) saves these through api/giftbox-admin.js, and
-- the status emails to the customer include the tracking link.

alter table public.giftbox_orders add column if not exists tracking_number text;
alter table public.giftbox_orders add column if not exists carrier text;
alter table public.giftbox_orders add column if not exists last_emailed_status text;
alter table public.giftbox_orders add column if not exists last_emailed_at timestamptz;

alter table public.giftbox_orders drop constraint if exists giftbox_orders_tracking_len;
alter table public.giftbox_orders add constraint giftbox_orders_tracking_len
  check ((tracking_number is null or char_length(tracking_number) <= 80)
     and (carrier is null or carrier in ('usps', 'ups', 'fedex', 'dhl', 'other')));

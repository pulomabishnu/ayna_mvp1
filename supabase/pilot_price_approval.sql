-- Spreadsheet prices can be tried in test mode. Live payment requires an admin
-- to verify the exact package, retailer link and current amount first.
alter table public.pilot_product_prices add column if not exists live_approved boolean not null default false;

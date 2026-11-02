-- Export the live catalog for `npm run safety:audit -- --db rows.json` and
-- `npm run catalog:readiness -- --db rows.json`. Read-only.
-- Run in the Supabase SQL Editor, then Export -> JSON and save as rows.json.
select * from public.product_catalog where is_active = true order by id;

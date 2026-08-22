-- AI-discovered products: source + human-review gate.
--
-- WHY THIS EXISTS: product_catalog.sql's `source` check only allows
-- 'curated' | 'imported' | 'partner' — all human-entered. api/discover-products.js
-- adds a fourth provenance, 'discovered': products an AI + live web search
-- found, NOT a human. The site's own How We Make Money page promises "we only
-- partner with brands whose products pass our clinical and safety review, the
-- same bar we hold every product to" — so a discovered row must never become
-- visible to a real user until a human has actually looked at it. That is
-- enforced twice here, once in application code (api/discover-products.js
-- always inserts is_active=false) and once in the RLS policy itself, so a bug
-- in the insert path can't accidentally publish an unreviewed product.
--
-- Safe to re-run: every statement below is idempotent against a live database
-- that already has product_catalog.sql applied (see that file's own note on
-- why `create table if not exists` alone isn't enough once a table already
-- exists in production).

-- Widen the source check constraint to include 'discovered'. Postgres names an
-- inline CHECK on a `create table` as `<table>_<column>_check` unless given an
-- explicit name, which is what product_catalog.sql's `source` column got — so
-- that is the name being dropped here. If a prior manual edit already renamed
-- or removed it, this is still safe: DROP ... IF EXISTS no-ops, and the ADD
-- below is asserted fresh either way.
alter table public.product_catalog
  drop constraint if exists product_catalog_source_check;

alter table public.product_catalog
  add constraint product_catalog_source_check
  check (source in ('curated', 'imported', 'partner', 'discovered'));

-- Review state. Every discovered row starts 'pending' and is never inserted
-- as anything else (api/discover-products.js hard-codes this) — 'approved' /
-- 'rejected' only ever come from a human via scripts/review-discovered-products.mjs.
-- Curated/imported/partner rows default to 'approved' so this column has no
-- effect on any product that predates this migration.
alter table public.product_catalog
  add column if not exists review_status text not null default 'approved'
  check (review_status in ('pending', 'approved', 'rejected'));

-- Freeform provenance for the review script to show a human: which search
-- query surfaced this, what the model's own confidence/reasoning said, when
-- the recall/DSLD checks ran and what they returned. Not used for access
-- control — is_active/review_status alone gate visibility.
alter table public.product_catalog
  add column if not exists discovery_meta jsonb not null default '{}'::jsonb;

-- Backfill: any row that predates this migration is definitionally
-- human-entered (the 'discovered' source did not exist yet), so it is already
-- reviewed. Without this, the column default above only affects NEW rows —
-- existing curated rows would default to 'approved' anyway since the default
-- is 'approved', but this UPDATE makes that explicit and self-documenting
-- rather than relying on the reader to infer it from the DEFAULT clause.
update public.product_catalog
set review_status = 'approved'
where review_status is distinct from 'approved' and source <> 'discovered';

-- Belt-and-suspenders enforcement: a discovered row is readable via the public
-- SELECT policy ONLY once approved, even if a future code change ever
-- inserted one with is_active=true by mistake. Non-discovered rows are
-- unaffected (their access is governed by is_active alone, same as before).
drop policy if exists "product_catalog_read_all" on public.product_catalog;
create policy "product_catalog_read_all"
on public.product_catalog for select
to anon, authenticated
using (is_active and (source <> 'discovered' or review_status = 'approved'));

create index if not exists product_catalog_review_status_idx
on public.product_catalog (review_status)
where source = 'discovered';

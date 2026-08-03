-- Curated product catalog.
--
-- WHY THIS EXISTS: the catalog lived in ~5,500 lines of JavaScript across six
-- files in src/data/, which meant (a) every visitor downloaded the entire
-- catalog as part of a 1.37 MB bundle, (b) correcting a price or a safety note
-- required a code change and a redeploy, and (c) there was no single source of
-- truth — the same product shape was duplicated across six modules.
--
-- WHAT THIS IS NOT: a replacement for the curated content with generated
-- content. `safety`, `doctor_opinion` and `clinician_attribution` are
-- human-verified claims on a health product. Ayna already generates products
-- for everything OUTSIDE this catalog (api/llm-recommendations,
-- api/search-suggestions) — this table is the verified core those paths fall
-- back from, and `source` below keeps the two provenances distinguishable
-- forever.
create table if not exists public.product_catalog (
  id text primary key,
  name text not null,
  brand text,
  category text not null,
  -- 'physical' | 'digital'
  product_type text not null default 'physical',

  summary text,
  price text,
  image text,
  url text,

  -- Matching/browse metadata (arrays kept as jsonb so the existing shapes port
  -- across unchanged).
  tags jsonb not null default '[]'::jsonb,
  health_functions jsonb not null default '[]'::jsonb,
  where_to_buy jsonb not null default '[]'::jsonb,
  where_to_buy_in_stock jsonb not null default '{}'::jsonb,

  -- Human-verified content. Never write generated text into these columns.
  safety jsonb not null default '{}'::jsonb,
  doctor_opinion text,
  community_review text,
  effectiveness text,
  clinician_opinion_source text,
  clinician_attribution text,

  -- Provenance. 'curated' rows are human-verified; anything else must never be
  -- presented with the verified-clinician affordances.
  source text not null default 'curated'
    check (source in ('curated', 'imported', 'partner')),
  internal boolean not null default false,
  requires_prescription boolean not null default false,
  user_rating numeric(2,1),

  -- Soft delete so removing a product does not orphan user_ecosystems rows.
  is_active boolean not null default true,

  -- Anything in the source objects without a column of its own, so the export
  -- is lossless and nothing has to be dropped to migrate.
  extra jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_catalog_category_idx on public.product_catalog (category) where is_active;
create index if not exists product_catalog_type_idx on public.product_catalog (product_type) where is_active;
create index if not exists product_catalog_tags_idx on public.product_catalog using gin (tags);
create index if not exists product_catalog_health_functions_idx on public.product_catalog using gin (health_functions);

-- Trigram search over name/brand/summary for Discovery.
create extension if not exists pg_trgm;
create index if not exists product_catalog_search_idx
on public.product_catalog
using gin ((coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(summary, '')) gin_trgm_ops);

alter table public.product_catalog enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
-- Public product information: readable signed-out. Writes are service-role only.
grant select on public.product_catalog to anon, authenticated;
grant all on public.product_catalog to service_role;

-- The catalog is public product information — readable by anyone, including
-- signed-out visitors browsing Discovery. Writes are service-role only, so the
-- curated content cannot be edited from a browser.
drop policy if exists "product_catalog_read_all" on public.product_catalog;
create policy "product_catalog_read_all"
on public.product_catalog for select
to anon, authenticated
using (is_active);

create or replace function public.touch_product_catalog_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists product_catalog_touch on public.product_catalog;
create trigger product_catalog_touch
before update on public.product_catalog
for each row execute function public.touch_product_catalog_updated_at();

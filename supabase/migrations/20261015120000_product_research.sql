-- Product research drafts ("Research this product" in /admin/research).
-- Written only by api/research-product.js with the service role.
--
-- A draft holds what the research found for ONE section of ONE product
-- (who it's for, how to use it, clinical sources, science sources, reviews).
-- Nothing in a draft reaches the website until a team admin approves it.
-- Approved research only ever FILLS an empty section on the product page;
-- it never replaces anything the team wrote (see src/utils/approvedResearch.js).
--
-- Idempotent: safe to re-run. NOT applied automatically; run it once in the
-- Supabase SQL editor before the admin page can save drafts.
create table if not exists public.product_research (
  id uuid primary key default gen_random_uuid(),
  product_id text not null check (char_length(product_id) between 1 and 120),
  product_name text not null check (char_length(product_name) between 1 and 200),
  brand text check (brand is null or char_length(brand) <= 120),
  product_url text check (product_url is null or char_length(product_url) <= 500),
  section text not null check (section in ('who', 'how', 'clinical', 'science', 'reviews')),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  -- What the research returned, after server-side checks (credible hosts,
  -- links that load, no dashes). `issues` lists anything the checks removed.
  draft jsonb not null default '{}'::jsonb,
  issues jsonb not null default '[]'::jsonb,
  -- What the reviewer approved (may be an edited copy of `draft`).
  approved jsonb,
  created_by text,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists product_research_one_per_section
  on public.product_research (product_id, section);
create index if not exists product_research_status_idx
  on public.product_research (status, updated_at desc);

alter table public.product_research enable row level security;

-- No direct access for site visitors or signed-in users: the server reads
-- and writes with the service role, and only serves approved sections.
revoke all on public.product_research from anon, authenticated;

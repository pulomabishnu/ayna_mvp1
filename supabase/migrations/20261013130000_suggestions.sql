-- Anonymous product and read suggestions (Shop + Library, website and app).
-- Written by src/components/SuggestBox.jsx through api/suggestions.js.
--
-- Anonymous by design: no user id, no name, no email, no IP is stored.
-- Idempotent: safe to re-run. NOT applied automatically; run it once in the
-- Supabase SQL editor (or with psql) before the endpoint can store rows.
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('product', 'read')),
  product_name text check (product_name is null or char_length(product_name) <= 120),
  link text check (link is null or char_length(link) <= 300),
  reason text check (reason is null or char_length(reason) <= 500),
  topic text check (topic is null or char_length(topic) <= 300),
  context text check (context is null or char_length(context) <= 40),
  platform text check (platform is null or platform in ('web', 'app')),
  created_at timestamptz not null default now(),
  constraint suggestions_has_text check (
    (kind = 'product' and product_name is not null and char_length(btrim(product_name)) > 0)
    or (kind = 'read' and topic is not null and char_length(btrim(topic)) > 0)
  )
);

create index if not exists suggestions_created_at_idx on public.suggestions (created_at desc);

alter table public.suggestions enable row level security;

-- Insert-only for the public roles: anyone may add a suggestion, nobody but
-- the service role (team dashboard / server) can read, edit or delete them.
revoke all on public.suggestions from anon, authenticated;
grant insert on public.suggestions to anon, authenticated;
grant all on public.suggestions to service_role;

drop policy if exists "suggestions_insert_anyone" on public.suggestions;
create policy "suggestions_insert_anyone"
on public.suggestions for insert
to anon, authenticated
with check (true);

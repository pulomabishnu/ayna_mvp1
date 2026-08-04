-- LOCAL TESTING ONLY — never run this against a Supabase project.
--
-- Supabase provides an `auth` schema, the anon/authenticated/service_role roles,
-- and auth.uid(). A bare Postgres has none of them, so the migrations cannot be
-- exercised locally without stubbing them first.
--
-- The point of this file is to let the real migrations run UNMODIFIED against a
-- free local Postgres, so their syntax, RLS policies, functions and the seed can
-- all be validated before anything touches a live database.
--
--   createdb ayna_test
--   psql ayna_test -f supabase/_local_bootstrap.sql
--   # ...then the real migrations, in the order in supabase/README.md

-- ── Roles Supabase defines for us ────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    -- BYPASSRLS mirrors Supabase: the service role is why the server can read
    -- pending_phone_verifications after its client policies were dropped.
    create role service_role nologin bypassrls;
  end if;
end $$;

-- ── auth schema ──────────────────────────────────────────────────────────────
create schema if not exists auth;

-- Every table in this schema has `references auth.users(id) on delete cascade`.
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb,
  raw_app_meta_data jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Referenced by every RLS policy. Locally it reads a session GUC so a test can
-- impersonate a user:  set local request.jwt.claim.sub = '<uuid>';
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

-- ── Extensions the migrations use ────────────────────────────────────────────
-- pg_trgm backs the product_catalog search index.
create extension if not exists pg_trgm;

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema auth to anon, authenticated, service_role;

-- Supabase ships default privileges that grant new public tables to these roles
-- automatically. A bare Postgres does not, so mirror it — otherwise every RLS
-- test fails with "permission denied" for the wrong reason.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

select 'bootstrap complete' as status;

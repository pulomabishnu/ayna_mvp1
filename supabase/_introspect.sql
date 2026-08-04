-- READ-ONLY schema introspection. Safe to run against production.
--
-- Performs no writes, no DDL, no locks beyond ordinary catalog reads. It only
-- reads pg_catalog / information_schema and prints one JSON document.
--
-- WHY: `create table if not exists` SKIPS a table that already exists. Four of
-- these tables were created by hand in the dashboard and hold real user data, so
-- the migrations will not touch them — and if their live columns differ from
-- what the application expects, the app still breaks after a "successful"
-- migration. This dumps what is actually there so it can be diffed against the
-- committed definitions.
--
-- HOW TO RUN
--   Supabase SQL Editor: paste this whole file, run, copy the single result cell.
--   psql:  psql "$DB_URL" -At -f supabase/_introspect.sql > live-schema.json
--
-- The output contains column names, types, constraints, policies and function
-- signatures. It contains NO row data — no health information, no phone
-- numbers, no tokens.

with tables as (
  select
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    (
      select jsonb_agg(jsonb_build_object(
        'column', a.attname,
        'type', format_type(a.atttypid, a.atttypmod),
        'notnull', a.attnotnull,
        'default', pg_get_expr(d.adbin, d.adrelid)
      ) order by a.attnum)
      from pg_attribute a
      left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    ) as columns,
    (
      select jsonb_agg(jsonb_build_object(
        'name', con.conname,
        'type', case con.contype
                  when 'p' then 'primary key'
                  when 'u' then 'unique'
                  when 'f' then 'foreign key'
                  when 'c' then 'check'
                  else con.contype::text end,
        'definition', pg_get_constraintdef(con.oid)
      ) order by con.conname)
      from pg_constraint con where con.conrelid = c.oid
    ) as constraints,
    (
      select jsonb_agg(jsonb_build_object(
        'name', pol.polname,
        'command', case pol.polcmd
                     when 'r' then 'SELECT' when 'a' then 'INSERT'
                     when 'w' then 'UPDATE' when 'd' then 'DELETE'
                     else 'ALL' end,
        'roles', (select coalesce(array_agg(pg_get_userbyid(r) order by r), '{}')
                  from unnest(pol.polroles) r)
      ) order by pol.polname)
      from pg_policy pol where pol.polrelid = c.oid
    ) as policies,
    (
      select jsonb_agg(distinct grantee || ':' || privilege_type)
      from information_schema.role_table_grants g
      where g.table_schema = 'public' and g.table_name = c.relname
        and grantee in ('anon','authenticated','service_role')
    ) as grants,
    (select count(*) from pg_index i where i.indrelid = c.oid) as index_count
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
routines as (
  select jsonb_agg(jsonb_build_object(
    'name', p.proname,
    'args', pg_get_function_identity_arguments(p.oid),
    'returns', pg_get_function_result(p.oid),
    'security_definer', p.prosecdef
  ) order by p.proname, pg_get_function_identity_arguments(p.oid)) as fns
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    -- Exclude functions owned by an extension (pg_trgm installs ~30 into
    -- public); they are not part of this schema and only add noise to a diff.
    and not exists (
      select 1 from pg_depend dep
      where dep.objid = p.oid and dep.deptype = 'e'
    )
)
select jsonb_pretty(jsonb_build_object(
  'generated_at', now(),
  'tables', (
    select jsonb_object_agg(table_name, jsonb_build_object(
      'rls_enabled', rls_enabled,
      'columns', coalesce(columns, '[]'::jsonb),
      'constraints', coalesce(constraints, '[]'::jsonb),
      'policies', coalesce(policies, '[]'::jsonb),
      'grants', coalesce(grants, '[]'::jsonb),
      'index_count', index_count
    )) from tables
  ),
  'functions', coalesce((select fns from routines), '[]'::jsonb)
)) as live_schema;

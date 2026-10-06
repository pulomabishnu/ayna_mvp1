-- Behavioural tests for monthly_checkins.sql: owner-only RLS, guests
-- (Supabase anonymous sessions) excluded, anon role has no access, one row
-- per user per month, and the month/answers constraints.
--
-- LOCAL ONLY (run by scripts/test-migrations.sh). Raises on the first failure.
-- Writes only its own test users' rows and removes them at the end.

\set A '00000000-0000-4000-8000-0000000000e1'
\set B '00000000-0000-4000-8000-0000000000e2'
\set G '00000000-0000-4000-8000-0000000000e3'

insert into auth.users (id, email) values (:'A', 'mc-a@test.local'), (:'B', 'mc-b@test.local') on conflict (id) do nothing;
insert into auth.users (id, is_anonymous) values (:'G', true) on conflict (id) do nothing;
delete from public.monthly_checkins where user_id in (:'A', :'B', :'G');

-- B already has a row (written as service role, which bypasses RLS).
insert into public.monthly_checkins (user_id, check_in_month, answers)
values (:'B', '2026-09-01', '{"safetyConcern":"No"}');

begin;
set local role authenticated;
do $$
declare
  a uuid := '00000000-0000-4000-8000-0000000000e1';
  b uuid := '00000000-0000-4000-8000-0000000000e2';
  g uuid := '00000000-0000-4000-8000-0000000000e3';
  n integer;
  failed boolean;
begin
  -- ── Signed-in user A ─────────────────────────────────────────────────────
  perform set_config('request.jwt.claim.sub', a::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'is_anonymous', false)::text, true);

  insert into public.monthly_checkins (user_id, check_in_month, answers)
  values (a, '2026-10-01', '{"howIsRoutine":"Great. No changes"}');

  -- Redoing the month upserts in place (the client's onConflict target).
  insert into public.monthly_checkins (user_id, check_in_month, answers)
  values (a, '2026-10-01', '{"howIsRoutine":"Okay, could be better"}')
  on conflict (user_id, check_in_month) do update set answers = excluded.answers, updated_at = now();

  select count(*) into n from public.monthly_checkins where user_id = a;
  if n <> 1 then raise exception 'monthly_checkins: upsert created % rows for one month (expected 1)', n; end if;
  select count(*) into n from public.monthly_checkins where answers->>'howIsRoutine' = 'Okay, could be better';
  if n <> 1 then raise exception 'monthly_checkins: upsert did not update this month''s answers'; end if;

  -- Cannot see, write or delete B's rows.
  select count(*) into n from public.monthly_checkins where user_id = b;
  if n <> 0 then raise exception 'SECURITY: monthly_checkins leaked another user''s check-in'; end if;
  failed := false;
  begin
    insert into public.monthly_checkins (user_id, check_in_month, answers) values (b, '2026-10-01', '{}');
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: a user wrote a check-in as someone else'; end if;
  update public.monthly_checkins set answers = '{"x":1}' where user_id = b;
  delete from public.monthly_checkins where user_id = b;

  -- Constraints.
  failed := false;
  begin
    insert into public.monthly_checkins (user_id, check_in_month, answers) values (a, '2026-10-15', '{}');
  exception when check_violation then failed := true; end;
  if not failed then raise exception 'monthly_checkins accepted a month that is not the 1st'; end if;
  failed := false;
  begin
    insert into public.monthly_checkins (user_id, check_in_month, answers) values (a, '2026-08-01', '[1,2]');
  exception when check_violation then failed := true; end;
  if not failed then raise exception 'monthly_checkins accepted non-object answers'; end if;

  -- Own delete works (account erasure path).
  delete from public.monthly_checkins where user_id = a;
  select count(*) into n from public.monthly_checkins where user_id = a;
  if n <> 0 then raise exception 'monthly_checkins: owner delete was a silent no-op'; end if;

  -- ── Guest (anonymous sign-in) ────────────────────────────────────────────
  perform set_config('request.jwt.claim.sub', g::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', g, 'is_anonymous', true)::text, true);
  failed := false;
  begin
    insert into public.monthly_checkins (user_id, check_in_month, answers) values (g, '2026-10-01', '{}');
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: a guest (anonymous session) saved a monthly check-in'; end if;

  raise notice 'monthly_checkins: owner-only, guests excluded, one row per month, constraints hold';
end $$;
-- Back to the table owner: B's row must be untouched by A's update/delete.
reset role;
do $$
declare
  n integer;
begin
  select count(*) into n from public.monthly_checkins
   where user_id = '00000000-0000-4000-8000-0000000000e2' and answers = '{"safetyConcern":"No"}'::jsonb;
  if n <> 1 then raise exception 'SECURITY: another user modified or deleted B''s check-in'; end if;
end $$;
rollback;

-- Guests cannot read even a row that exists for them (e.g. written before a
-- policy change); anon has no table access at all.
insert into public.monthly_checkins (user_id, check_in_month, answers) values (:'G', '2026-10-01', '{}');

begin;
set local role authenticated;
do $$
declare
  n integer;
  g uuid := '00000000-0000-4000-8000-0000000000e3';
begin
  perform set_config('request.jwt.claim.sub', g::text, true);
  perform set_config('request.jwt.claims', json_build_object('sub', g, 'is_anonymous', true)::text, true);
  select count(*) into n from public.monthly_checkins;
  if n <> 0 then raise exception 'SECURITY: a guest session can read monthly_checkins rows'; end if;
end $$;
rollback;

begin;
set local role anon;
do $$
declare
  failed boolean := false;
begin
  begin
    perform 1 from public.monthly_checkins limit 1;
  exception when insufficient_privilege then failed := true; end;
  if not failed then raise exception 'SECURITY: anon can query monthly_checkins'; end if;
  raise notice 'monthly_checkins: guests cannot read, anon has no access';
end $$;
rollback;

delete from public.monthly_checkins where user_id in (:'A', :'B', :'G');

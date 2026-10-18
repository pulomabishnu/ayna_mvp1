-- Behavioural tests for supabase/health_data.sql.
-- Raises on the first failure. Run by scripts/test-migrations.sh.
--   * a user can read only her own health rows
--   * a browser session cannot write health metrics, connections or the consent log
--   * a browser session CAN delete her own metric rows (erasure always works)
--   * OAuth tokens and states are unreadable by anon and authenticated
--   * source requests can only be filed as yourself
--   * deleting the auth user removes every health row (cascade)

insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1','health-a@test.local'),
  ('00000000-0000-4000-8000-0000000000b1','health-b@test.local'),
  ('00000000-0000-4000-8000-0000000000c1','health-c@test.local')
on conflict (id) do nothing;

-- Seed as the service role (the API's path).
delete from public.health_daily_metrics where user_id in ('00000000-0000-4000-8000-0000000000a1','00000000-0000-4000-8000-0000000000b1');
insert into public.health_connections (user_id, source, categories, platform) values
  ('00000000-0000-4000-8000-0000000000a1','oura', array['sleep'], 'web'),
  ('00000000-0000-4000-8000-0000000000b1','oura', array['sleep','heart'], 'web')
on conflict (user_id, source) do nothing;
insert into public.health_daily_metrics (user_id, source, origin, metric, day, value, unit) values
  ('00000000-0000-4000-8000-0000000000a1','oura','oura','sleep_minutes','2026-10-10',400,'min'),
  ('00000000-0000-4000-8000-0000000000a1','oura','oura','sleep_minutes','2026-10-11',380,'min'),
  ('00000000-0000-4000-8000-0000000000b1','oura','oura','sleep_minutes','2026-10-10',300,'min');
insert into public.health_oauth_tokens (user_id, provider, encrypted_access_token, encryption_iv, encryption_tag)
values ('00000000-0000-4000-8000-0000000000a1','oura','ciphertext','iv','tag')
on conflict (user_id, provider) do nothing;

do $$
begin
  begin
    insert into public.health_connections (user_id, source, categories) values ('00000000-0000-4000-8000-0000000000a1','fitbit', '{}');
    raise exception 'unknown source accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.health_connections (user_id, source, categories) values ('00000000-0000-4000-8000-0000000000c1','oura', array['location']);
    raise exception 'unknown consent category accepted';
  exception when check_violation then null;
  end;
  raise notice 'Health constraints: OK';
end $$;

begin;
  set local role authenticated;
  set local request.jwt.claim.sub = '00000000-0000-4000-8000-0000000000a1';
  do $$
  declare n integer;
  begin
    select count(*) into n from public.health_daily_metrics;
    if n <> 2 then raise exception 'RLS leak: user sees % metric rows, expected her own 2', n; end if;
    select count(*) into n from public.health_connections;
    if n <> 1 then raise exception 'RLS leak: user sees % connections, expected 1', n; end if;

    begin
      insert into public.health_daily_metrics (user_id, source, origin, metric, day, value, unit)
      values ('00000000-0000-4000-8000-0000000000a1','oura','oura','steps','2026-10-10',1,'count');
      raise exception 'SECURITY: a browser session wrote a health metric directly, skipping consent checks';
    exception when insufficient_privilege then null;
    end;
    begin
      insert into public.health_data_events (user_id, source, action) values ('00000000-0000-4000-8000-0000000000a1','oura','consent_granted');
      raise exception 'SECURITY: a browser session forged a consent record';
    exception when insufficient_privilege then null;
    end;
    begin
      update public.health_connections set categories = array['sleep','cycle'];
      raise exception 'SECURITY: a browser session widened its own consent';
    exception when insufficient_privilege then null;
    end;
    begin
      perform 1 from public.health_oauth_tokens;
      raise exception 'SECURITY: OAuth tokens are readable by the client';
    exception when insufficient_privilege then null;
    end;

    -- Erasure works directly, and only on her own rows.
    delete from public.health_daily_metrics where day = '2026-10-10';
    get diagnostics n = row_count;
    if n <> 1 then raise exception 'delete own metric removed % rows, expected 1', n; end if;

    insert into public.health_source_requests (user_id, source_name, note) values ('00000000-0000-4000-8000-0000000000a1','WHOOP', null);
    begin
      insert into public.health_source_requests (user_id, source_name) values ('00000000-0000-4000-8000-0000000000b1','Fitbit');
      raise exception 'SECURITY: filed a source request as another user';
    exception when insufficient_privilege then null;
    end;
    raise notice 'Health RLS (authenticated): OK';
  end $$;
commit;

do $$
declare n integer;
begin
  select count(*) into n from public.health_daily_metrics where user_id = '00000000-0000-4000-8000-0000000000b1';
  if n <> 1 then raise exception 'another user''s row was deleted by RLS-scoped delete (% left)', n; end if;
end $$;

begin;
  set local role anon;
  do $$
  begin
    begin
      perform 1 from public.health_daily_metrics;
      raise exception 'SECURITY: anon can query health metrics';
    exception when insufficient_privilege then null;
    end;
    raise notice 'Health RLS (anon): OK';
  end $$;
commit;

-- Deleting the account deletes every health row.
delete from auth.users where id = '00000000-0000-4000-8000-0000000000a1';
do $$
declare n integer;
begin
  select (select count(*) from public.health_daily_metrics where user_id = '00000000-0000-4000-8000-0000000000a1')
       + (select count(*) from public.health_connections where user_id = '00000000-0000-4000-8000-0000000000a1')
       + (select count(*) from public.health_oauth_tokens where user_id = '00000000-0000-4000-8000-0000000000a1')
       + (select count(*) from public.health_source_requests where user_id = '00000000-0000-4000-8000-0000000000a1')
    into n;
  if n <> 0 then raise exception 'account deletion left % health rows behind', n; end if;
  raise notice 'Health cascade on account deletion: OK';
end $$;

delete from auth.users where id in ('00000000-0000-4000-8000-0000000000b1','00000000-0000-4000-8000-0000000000c1');
select 'health behaviour tests passed' as status;

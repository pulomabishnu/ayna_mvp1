-- Apply after ayna_pro_early_access. Feature gates are explicitly enabled at rollout.
begin;
create table if not exists public.pro_feature_rules (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  free_ask_per_day integer not null default 5 check (free_ask_per_day > 0),
  pro_ask_per_day integer not null default 50 check (pro_ask_per_day > free_ask_per_day),
  free_playlists integer not null default 1 check (free_playlists >= 1)
);
insert into public.pro_feature_rules(id) values(true) on conflict do nothing;
create table if not exists public.pro_weekly_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  read_id text not null,
  primary key(user_id,week_start)
);
alter table public.pro_feature_rules enable row level security;
alter table public.pro_weekly_reads enable row level security;
revoke all on public.pro_feature_rules, public.pro_weekly_reads from public, anon, authenticated;
grant all on public.pro_feature_rules, public.pro_weekly_reads to service_role;
grant select on public.pro_weekly_reads to authenticated;
drop policy if exists pro_weekly_reads_own on public.pro_weekly_reads;
create policy pro_weekly_reads_own on public.pro_weekly_reads for select to authenticated using ((select auth.uid()) = user_id);
create or replace function public.pro_feature_config() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object('enabled',enabled,'freeAskPerDay',free_ask_per_day,'proAskPerDay',pro_ask_per_day,'freePlaylists',free_playlists)
  from public.pro_feature_rules where id;
$$;
create or replace function public.pro_claim_read(p_user_id uuid,p_read_id text,p_unlimited boolean) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare v_week date := date_trunc('week',now() at time zone 'UTC')::date;
begin
  if p_unlimited then return true; end if;
  insert into public.pro_weekly_reads(user_id,week_start,read_id) values(p_user_id,v_week,p_read_id) on conflict do nothing;
  return exists(select 1 from public.pro_weekly_reads where user_id=p_user_id and week_start=v_week and read_id=p_read_id);
end;
$$;
revoke all on function public.pro_feature_config(), public.pro_claim_read(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.pro_feature_config(), public.pro_claim_read(uuid,text,boolean) to service_role;

-- A BEFORE trigger serializes playlist creation per owner, including direct Data
-- API calls. Never trust a client count or a user-editable premium flag.
create schema if not exists pro_private;
revoke all on schema pro_private from public, anon, authenticated;
create or replace function pro_private.check_playlist_allowance() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_rules public.pro_feature_rules; v_premium boolean;
begin
  select * into v_rules from public.pro_feature_rules where id;
  if not v_rules.enabled then return new; end if;
  if auth.uid() is null or new.owner_id <> auth.uid() then raise exception 'pro_playlist_owner_required'; end if;
  perform pg_advisory_xact_lock(hashtextextended('pro-playlist:' || new.owner_id::text,0));
  select coalesce((raw_app_meta_data->>'is_premium')::boolean,false) into v_premium from auth.users where id=new.owner_id;
  if coalesce(v_premium,false) or (public.pro_access_status(new.owner_id)->>'active')::boolean then return new; end if;
  if (select count(*) from public.community_playlists where owner_id=new.owner_id) >= v_rules.free_playlists then
    raise exception 'Free ayna includes one playlist. ayna Pro Early Access includes unlimited playlists.';
  end if;
  return new;
end;
$$;
revoke all on function pro_private.check_playlist_allowance() from public, anon, authenticated;
do $$ begin
  if to_regclass('public.community_playlists') is not null then
    drop trigger if exists pro_playlist_allowance on public.community_playlists;
    create trigger pro_playlist_allowance before insert on public.community_playlists for each row execute function pro_private.check_playlist_allowance();
  end if;
end $$;
commit;

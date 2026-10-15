-- Free product campaign: 3 pieces of feedback + 3 verified friends = one free
-- product from an explicitly managed reward pool.
--
-- NOT applied automatically. Run once in the Supabase SQL editor (or
-- `psql "$SUPABASE_DB_URL" -f <this file>`). Idempotent: safe to re-run.
-- It also (re)creates everything in 20261013150000_referrals.sql, so it works
-- whether or not that earlier migration was applied.
--
-- Design rules
--   * The browser never decides anything. Every table here has RLS on and no
--     client policies (except the pre-existing referrals insert/select). The
--     server (/api/campaign, service role) calls the functions below.
--   * Eligibility is computed from stored rows every time (campaign_progress),
--     never from a stored or client-sent flag.
--   * A claim is one transaction (campaign_claim): a per-user advisory lock,
--     a conditional inventory UPDATE that can never go below zero, a unique
--     claim per user per campaign, and an idempotency key.
--   * "Verified" = the same definition the site already uses
--     (src/v6FinalFlow.js isVerifiedUser): a confirmed email or a confirmed
--     phone on the Supabase auth account. Anonymous (Community guest)
--     sessions never count.

-- ───────────────────────────── helpers ──────────────────────────────────────

create or replace function public.ayna_user_is_verified(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = p_user
      and coalesce(u.is_anonymous, false) = false
      and u.deleted_at is null
      and (u.banned_until is null or u.banned_until < now())
      and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)
  )
$$;
revoke all on function public.ayna_user_is_verified(uuid) from public, anon, authenticated;
grant execute on function public.ayna_user_is_verified(uuid) to service_role;

-- ───────────────────────────── campaigns ────────────────────────────────────

create table if not exists public.campaigns (
  id text primary key check (id ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  is_active boolean not null default false,
  -- Referred friends must create their account at or after this moment.
  starts_at timestamptz not null,
  ends_at timestamptz,
  feedback_min_chars integer not null default 120 check (feedback_min_chars between 40 and 1000),
  referrals_required integer not null default 3 check (referrals_required between 1 and 20),
  -- A referral counts only if it was recorded within this long of the friend's
  -- account being created (no retroactive credit for existing accounts).
  attribution_window interval not null default interval '24 hours',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at)
);
alter table public.campaigns enable row level security;
revoke all on public.campaigns from anon, authenticated;

-- Off until you turn it on (see the PR description for the launch SQL).
insert into public.campaigns (id, name, is_active, starts_at)
values ('free-product-2026', 'Free product: feedback + 3 friends', false, now())
on conflict (id) do nothing;

-- ───────────────────────────── feedback ─────────────────────────────────────

create table if not exists public.campaign_feedback (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_key text not null check (question_key in ('like', 'friction', 'change')),
  question text not null check (char_length(question) between 5 and 300),
  response text not null check (char_length(response) <= 2000),
  char_count integer generated always as (char_length(btrim(response))) stored,
  -- letters+digits only, lowercased: catches the same answer pasted twice
  -- with different spacing or punctuation.
  response_fingerprint text not null,
  is_complete boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id, question_key),
  unique (campaign_id, user_id, response_fingerprint)
);
create index if not exists campaign_feedback_user_idx on public.campaign_feedback (user_id, campaign_id);
alter table public.campaign_feedback enable row level security;
revoke all on public.campaign_feedback from anon, authenticated;

-- The database refuses short or junk answers even if someone bypasses the API.
create or replace function public.campaign_feedback_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_min integer;
  v_clean text := lower(regexp_replace(new.response, '[^a-zA-Z0-9]+', '', 'g'));
  v_distinct integer;
begin
  select feedback_min_chars into v_min from public.campaigns where id = new.campaign_id;
  if v_min is null then raise exception 'unknown_campaign' using errcode = 'P0001'; end if;
  if char_length(btrim(new.response)) < v_min then
    raise exception 'feedback_too_short' using errcode = 'P0001';
  end if;
  select count(distinct ch) into v_distinct
  from regexp_split_to_table(v_clean, '') as ch;
  if v_distinct < 8 then
    raise exception 'feedback_low_effort' using errcode = 'P0001';
  end if;
  new.response_fingerprint := md5(v_clean);
  new.is_complete := true;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists campaign_feedback_guard on public.campaign_feedback;
create trigger campaign_feedback_guard
  before insert or update on public.campaign_feedback
  for each row execute function public.campaign_feedback_guard();

-- ───────────────────────────── referral codes ───────────────────────────────
-- Random, opaque, per-account codes so links don't carry a piece of the user
-- id. Old links (?ref=<first 10 hex of the uuid>) keep working.

create table if not exists public.referral_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null unique check (code ~ '^[a-z0-9]{6,20}$'),
  created_at timestamptz not null default now()
);
alter table public.referral_codes enable row level security;
revoke all on public.referral_codes from anon, authenticated;

create or replace function public.ayna_get_referral_code(p_user uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  i integer;
begin
  select code into v_code from public.referral_codes where user_id = p_user;
  if v_code is not null then return v_code; end if;
  for attempt in 1..20 loop
    v_code := '';
    for i in 1..8 loop
      v_code := v_code || substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1);
    end loop;
    begin
      insert into public.referral_codes (user_id, code) values (p_user, v_code);
      return v_code;
    exception when unique_violation then
      select code into v_code from public.referral_codes where user_id = p_user;
      if v_code is not null then return v_code; end if; -- a concurrent call won
    end;
  end loop;
  raise exception 'could_not_allocate_code';
end;
$$;
revoke all on function public.ayna_get_referral_code(uuid) from public, anon, authenticated;
grant execute on function public.ayna_get_referral_code(uuid) to service_role;

-- Legacy code helper (from the referrals migration).
create or replace function public.ayna_referral_code(uid uuid)
returns text
language sql
immutable
as $$
  select substr(replace(uid::text, '-', ''), 1, 10)
$$;

-- code -> account, or null. New codes first, then the legacy uuid prefix.
create or replace function public.ayna_resolve_referral_code(p_code text)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select rc.user_id from public.referral_codes rc where rc.code = lower(p_code)),
    (select u.id from auth.users u
       where lower(p_code) ~ '^[0-9a-f]{10}$'
         and replace(u.id::text, '-', '') like lower(p_code) || '%'
       order by u.created_at limit 1)
  )
$$;
revoke all on function public.ayna_resolve_referral_code(text) from public, anon, authenticated;
grant execute on function public.ayna_resolve_referral_code(text) to service_role;

-- ───────────────────────────── referrals ────────────────────────────────────
-- Base table from 20261013150000_referrals.sql (re-created if missing).

create or replace function public.ayna_account_is_new()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users u where u.id = auth.uid() and u.created_at > now() - interval '7 days'
  )
$$;
revoke all on function public.ayna_account_is_new() from public, anon;
grant execute on function public.ayna_account_is_new() to authenticated;

create table if not exists public.referrals (
  referred_user_id uuid primary key references auth.users (id) on delete cascade,
  referrer_code text not null check (referrer_code ~ '^[a-z0-9]{6,20}$'),
  created_at timestamptz not null default now()
);
create index if not exists referrals_referrer_code_idx on public.referrals (referrer_code);

-- Who the code belongs to, resolved by the database (never sent by a client),
-- and how the row was recorded.
alter table public.referrals add column if not exists referrer_user_id uuid references auth.users (id) on delete set null;
alter table public.referrals add column if not exists source text not null default 'client';
do $$ begin
  alter table public.referrals add constraint referrals_source_check check (source in ('signup', 'client'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.referrals add constraint referrals_not_self check (referrer_user_id is null or referrer_user_id <> referred_user_id);
exception when duplicate_object then null; end $$;
create index if not exists referrals_referrer_user_idx on public.referrals (referrer_user_id);

alter table public.referrals enable row level security;
revoke all on public.referrals from anon, authenticated;
grant select, insert on public.referrals to authenticated;

drop policy if exists referrals_insert_self on public.referrals;
create policy referrals_insert_self on public.referrals
  for insert to authenticated
  with check (
    referred_user_id = auth.uid()
    and referrer_code <> public.ayna_referral_code(auth.uid())
    and public.ayna_account_is_new()
    and source = 'client'
  );

drop policy if exists referrals_select_self on public.referrals;
create policy referrals_select_self on public.referrals
  for select to authenticated
  using (referred_user_id = auth.uid());

-- Resolve the code on every insert; unknown codes and self-referrals are rejected.
create or replace function public.referrals_resolve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.referrer_code := lower(new.referrer_code);
  new.referrer_user_id := public.ayna_resolve_referral_code(new.referrer_code);
  if new.referrer_user_id is null then
    raise exception 'unknown_referral_code' using errcode = 'P0001';
  end if;
  if new.referrer_user_id = new.referred_user_id then
    raise exception 'self_referral' using errcode = 'P0001';
  end if;
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists referrals_resolve on public.referrals;
create trigger referrals_resolve
  before insert on public.referrals
  for each row execute function public.referrals_resolve();

-- Attribution is permanent: no one (not even a buggy server path) edits it.
create or replace function public.referrals_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'referrals_are_immutable' using errcode = 'P0001';
end;
$$;
drop trigger if exists referrals_immutable on public.referrals;
create trigger referrals_immutable
  before update on public.referrals
  for each row execute function public.referrals_immutable();

-- Record the referral at the moment the account is created, from the code the
-- sign-up form passed in user metadata (email + phone sign-up). Google/Apple
-- sign-ups can't carry metadata, so they keep the existing client insert.
-- Never blocks a sign-up: any problem is swallowed.
create or replace function public.referrals_from_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := lower(coalesce(new.raw_user_meta_data ->> 'referred_by', ''));
begin
  if v_code ~ '^[a-z0-9]{6,20}$' then
    begin
      insert into public.referrals (referred_user_id, referrer_code, source)
      values (new.id, v_code, 'signup')
      on conflict (referred_user_id) do nothing;
    exception when others then
      null;
    end;
  end if;
  return new;
end;
$$;
drop trigger if exists referrals_from_signup on auth.users;
create trigger referrals_from_signup
  after insert on auth.users
  for each row execute function public.referrals_from_signup();

-- Badge stats (BadgesPanel). Same output as before; now also counts friends
-- who used the new opaque code.
create or replace function public.my_referral_stats()
returns table (joined integer, qualified integer)
language sql
stable
security definer
set search_path = public
as $$
  select
    count(*)::integer as joined,
    count(*) filter (
      where exists (select 1 from public.community_posts p where p.author_id = r.referred_user_id)
    )::integer as qualified
  from public.referrals r
  where auth.uid() is not null
    and (r.referrer_user_id = auth.uid() or r.referrer_code = public.ayna_referral_code(auth.uid()))
$$;
revoke all on function public.my_referral_stats() from public, anon;
grant execute on function public.my_referral_stats() to authenticated;

-- ───────────────────────────── reward pool ──────────────────────────────────
-- Only products listed here are ever given away. Add a row per product with
-- how many units you actually have.

create table if not exists public.campaign_rewards (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.campaigns (id) on delete cascade,
  product_id text not null references public.product_catalog (id) on delete restrict,
  inventory_total integer not null check (inventory_total >= 0),
  inventory_claimed integer not null default 0 check (inventory_claimed >= 0),
  inventory_remaining integer generated always as (inventory_total - inventory_claimed) stored,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, product_id),
  -- inventory can never go below zero, and total can't be cut below what's claimed
  check (inventory_claimed <= inventory_total)
);
alter table public.campaign_rewards enable row level security;
revoke all on public.campaign_rewards from anon, authenticated;

-- ───────────────────────────── spins ────────────────────────────────────────

create table if not exists public.campaign_spins (
  id bigint generated always as identity primary key,
  campaign_id text not null references public.campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_id uuid not null references public.campaign_rewards (id) on delete cascade,
  product_id text not null,
  outcome text not null default 'shown' check (outcome in ('shown', 'claimed', 'sold_out')),
  created_at timestamptz not null default now()
);
create index if not exists campaign_spins_user_idx on public.campaign_spins (campaign_id, user_id, id desc);
alter table public.campaign_spins enable row level security;
revoke all on public.campaign_spins from anon, authenticated;

-- ───────────────────────────── claims ───────────────────────────────────────

create table if not exists public.campaign_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.campaigns (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_id uuid not null references public.campaign_rewards (id) on delete restrict,
  product_id text not null,
  product_name text not null,
  product_brand text,
  spin_id bigint,
  spins_before_claim integer not null default 0,
  idempotency_key text not null unique check (char_length(idempotency_key) between 16 and 80),
  fulfillment_status text not null default 'needs_address'
    check (fulfillment_status in ('needs_address', 'ready_to_ship', 'shipped', 'delivered', 'canceled')),
  fulfillment_note text,
  shipped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id)
);
alter table public.campaign_claims enable row level security;
revoke all on public.campaign_claims from anon, authenticated;

create table if not exists public.campaign_shipping (
  claim_id uuid primary key references public.campaign_claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  address_line1 text not null check (char_length(btrim(address_line1)) between 3 and 200),
  address_line2 text check (address_line2 is null or char_length(address_line2) <= 200),
  city text not null check (char_length(btrim(city)) between 2 and 100),
  state text not null check (state ~ '^[A-Z]{2}$'),
  postal_code text not null check (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.campaign_shipping enable row level security;
revoke all on public.campaign_shipping from anon, authenticated;

-- One row per (user, campaign, kind) so a transactional email is sent once.
create table if not exists public.campaign_email_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  campaign_id text not null references public.campaigns (id) on delete cascade,
  kind text not null check (kind in ('unlocked', 'claimed')),
  sent_at timestamptz not null default now(),
  primary key (user_id, campaign_id, kind)
);
alter table public.campaign_email_log enable row level security;
revoke all on public.campaign_email_log from anon, authenticated;

-- Unsubscribes for campaign/marketing email. Lowercased email.
create table if not exists public.email_suppressions (
  email text primary key check (email = lower(email)),
  reason text not null default 'unsubscribe',
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
revoke all on public.email_suppressions from anon, authenticated;

-- ───────────────────────────── referrals for a campaign ─────────────────────
-- A friend counts for the campaign only when ALL of these hold:
--   * her referral row resolves to this referrer (and isn't the referrer)
--   * her account was created inside the campaign window (new users only)
--   * the referral was recorded within attribution_window of her account
--     being created (no retroactive credit for existing accounts)
--   * she is not an anonymous guest
-- She is "verified" once ayna_user_is_verified() is true.

create or replace function public.campaign_referral_rows(p_user uuid, p_campaign text)
returns table (referred_user_id uuid, joined_at timestamptz, verified boolean)
language sql
stable
security definer
set search_path = public
as $$
  select r.referred_user_id, u.created_at, public.ayna_user_is_verified(r.referred_user_id)
  from public.referrals r
  join auth.users u on u.id = r.referred_user_id
  join public.campaigns c on c.id = p_campaign
  where r.referrer_user_id = p_user
    and r.referred_user_id <> p_user
    and coalesce(u.is_anonymous, false) = false
    and u.created_at >= c.starts_at
    and (c.ends_at is null or u.created_at < c.ends_at)
    and r.created_at <= u.created_at + c.attribution_window
  order by u.created_at
$$;
revoke all on function public.campaign_referral_rows(uuid, text) from public, anon, authenticated;
grant execute on function public.campaign_referral_rows(uuid, text) to service_role;

-- ───────────────────────────── progress / eligibility ───────────────────────

create or replace function public.campaign_progress(p_user uuid, p_campaign text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.campaigns;
  v_verified boolean;
  v_feedback text[];
  v_ref_joined integer;
  v_ref_verified integer;
  v_claim public.campaign_claims;
  v_open boolean;
  v_stock integer;
  v_eligible boolean;
begin
  select * into c from public.campaigns where id = p_campaign;
  if not found then return jsonb_build_object('campaign', null); end if;

  v_open := c.is_active and now() >= c.starts_at and (c.ends_at is null or now() < c.ends_at);
  v_verified := public.ayna_user_is_verified(p_user);
  select coalesce(array_agg(question_key order by question_key), '{}') into v_feedback
    from public.campaign_feedback
    where user_id = p_user and campaign_id = p_campaign and is_complete;
  select count(*), count(*) filter (where verified) into v_ref_joined, v_ref_verified
    from public.campaign_referral_rows(p_user, p_campaign);
  select * into v_claim from public.campaign_claims where user_id = p_user and campaign_id = p_campaign;
  select count(*) into v_stock
    from public.campaign_rewards r join public.product_catalog p on p.id = r.product_id
    where r.campaign_id = p_campaign and r.is_active and r.inventory_remaining > 0 and p.is_active;

  v_eligible := v_open and v_verified
    and cardinality(v_feedback) >= 3
    and v_ref_verified >= c.referrals_required
    and v_claim.id is null;

  return jsonb_build_object(
    'campaign', jsonb_build_object(
      'id', c.id, 'open', v_open, 'is_active', c.is_active,
      'starts_at', c.starts_at, 'ends_at', c.ends_at,
      'feedback_min_chars', c.feedback_min_chars, 'referrals_required', c.referrals_required),
    'verified', v_verified,
    'feedback_done', to_jsonb(v_feedback),
    'referrals_joined', v_ref_joined,
    'referrals_verified', v_ref_verified,
    'eligible', v_eligible,
    'inventory_available', v_stock > 0,
    'claim', case when v_claim.id is null then null else jsonb_build_object(
      'id', v_claim.id, 'product_id', v_claim.product_id, 'product_name', v_claim.product_name,
      'product_brand', v_claim.product_brand, 'claimed_at', v_claim.created_at,
      'fulfillment_status', v_claim.fulfillment_status,
      'has_shipping', exists (select 1 from public.campaign_shipping s where s.claim_id = v_claim.id)) end
  );
end;
$$;
revoke all on function public.campaign_progress(uuid, text) from public, anon, authenticated;
grant execute on function public.campaign_progress(uuid, text) to service_role;

create or replace function public.campaign_is_eligible(p_user uuid, p_campaign text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((public.campaign_progress(p_user, p_campaign) ->> 'eligible')::boolean, false)
$$;
revoke all on function public.campaign_is_eligible(uuid, text) from public, anon, authenticated;
grant execute on function public.campaign_is_eligible(uuid, text) to service_role;

-- ───────────────────────────── spin ─────────────────────────────────────────
-- Picks one in-stock reward at random on the server. Avoids repeating the last
-- one when there's another choice. A spin is NOT a reservation.

create or replace function public.campaign_spin(p_user uuid, p_campaign text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_last uuid;
  v_pick record;
  v_spin_id bigint;
  v_count integer;
begin
  if not public.campaign_is_eligible(p_user, p_campaign) then
    if exists (select 1 from public.campaign_claims where user_id = p_user and campaign_id = p_campaign) then
      return jsonb_build_object('status', 'already_claimed');
    end if;
    return jsonb_build_object('status', 'not_eligible');
  end if;

  select reward_id into v_last from public.campaign_spins
    where user_id = p_user and campaign_id = p_campaign order by id desc limit 1;

  select r.id, r.product_id, p.name, p.brand, p.category, p.image, p.summary
    into v_pick
    from public.campaign_rewards r
    join public.product_catalog p on p.id = r.product_id
    where r.campaign_id = p_campaign and r.is_active and r.inventory_remaining > 0 and p.is_active
    order by (r.id = v_last), random()
    limit 1;

  if v_pick.id is null then
    return jsonb_build_object('status', 'empty');
  end if;

  insert into public.campaign_spins (campaign_id, user_id, reward_id, product_id)
  values (p_campaign, p_user, v_pick.id, v_pick.product_id)
  returning id into v_spin_id;
  select count(*) into v_count from public.campaign_spins where user_id = p_user and campaign_id = p_campaign;

  return jsonb_build_object(
    'status', 'ok', 'spin_id', v_spin_id, 'spin_count', v_count,
    'reward_id', v_pick.id,
    'product', jsonb_build_object('id', v_pick.product_id, 'name', v_pick.name, 'brand', v_pick.brand,
      'category', v_pick.category, 'image', v_pick.image, 'summary', v_pick.summary));
end;
$$;
revoke all on function public.campaign_spin(uuid, text) from public, anon, authenticated;
grant execute on function public.campaign_spin(uuid, text) to service_role;

-- ───────────────────────────── claim (atomic) ───────────────────────────────
-- Statuses: claimed | already_claimed | not_eligible | stale_spin | out_of_stock
--
-- Race safety, in order:
--   1. pg_advisory_xact_lock per (campaign, user): one claim at a time per user
--      (double clicks, retries, two tabs).
--   2. Existing claim -> returned as-is (idempotent; same key = same result).
--   3. Eligibility re-checked inside the transaction.
--   4. The reward must be the user's latest spin (no picking arbitrary products
--      by calling the API directly).
--   5. UPDATE ... WHERE inventory_claimed < inventory_total: Postgres row-locks
--      the reward, so two people claiming the last unit serialize; the second
--      re-checks the condition after the first commits, matches 0 rows, and
--      gets out_of_stock. Inventory can't go below zero (CHECK constraint too).
--   6. unique (campaign_id, user_id) and unique idempotency_key back it all up.

create or replace function public.campaign_claim(
  p_user uuid, p_campaign text, p_reward uuid, p_spin_id bigint, p_idempotency_key text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_existing public.campaign_claims;
  v_spin public.campaign_spins;
  v_reward public.campaign_rewards;
  v_product public.product_catalog;
  v_claim public.campaign_claims;
  v_spins integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('campaign_claim:' || p_campaign || ':' || p_user::text, 0));

  select * into v_existing from public.campaign_claims where user_id = p_user and campaign_id = p_campaign;
  if found then
    return jsonb_build_object('status', 'already_claimed',
      'same_request', v_existing.idempotency_key = p_idempotency_key,
      'claim_id', v_existing.id, 'product_id', v_existing.product_id, 'product_name', v_existing.product_name);
  end if;

  if not public.campaign_is_eligible(p_user, p_campaign) then
    return jsonb_build_object('status', 'not_eligible');
  end if;

  select * into v_spin from public.campaign_spins
    where user_id = p_user and campaign_id = p_campaign order by id desc limit 1;
  if v_spin.id is null or v_spin.id <> p_spin_id or v_spin.reward_id <> p_reward
     or v_spin.created_at < now() - interval '30 minutes' then
    return jsonb_build_object('status', 'stale_spin');
  end if;

  update public.campaign_rewards r
     set inventory_claimed = r.inventory_claimed + 1, updated_at = now()
   where r.id = p_reward
     and r.campaign_id = p_campaign
     and r.is_active
     and r.inventory_claimed < r.inventory_total
     and exists (select 1 from public.product_catalog p where p.id = r.product_id and p.is_active)
  returning r.* into v_reward;

  if v_reward.id is null then
    update public.campaign_spins set outcome = 'sold_out' where id = v_spin.id;
    return jsonb_build_object('status', 'out_of_stock');
  end if;

  select * into v_product from public.product_catalog where id = v_reward.product_id;
  select count(*) into v_spins from public.campaign_spins where user_id = p_user and campaign_id = p_campaign;

  insert into public.campaign_claims
    (campaign_id, user_id, reward_id, product_id, product_name, product_brand, spin_id, spins_before_claim, idempotency_key)
  values
    (p_campaign, p_user, v_reward.id, v_reward.product_id, v_product.name, v_product.brand, v_spin.id, v_spins, p_idempotency_key)
  returning * into v_claim;

  update public.campaign_spins set outcome = 'claimed' where id = v_spin.id;

  return jsonb_build_object('status', 'claimed', 'claim_id', v_claim.id,
    'product_id', v_claim.product_id, 'product_name', v_claim.product_name,
    'product_brand', v_claim.product_brand, 'spins_before_claim', v_spins,
    'claimed_at', v_claim.created_at);
end;
$$;
revoke all on function public.campaign_claim(uuid, text, uuid, bigint, text) from public, anon, authenticated;
grant execute on function public.campaign_claim(uuid, text, uuid, bigint, text) to service_role;

-- ───────────────────────────── shipping ─────────────────────────────────────

create or replace function public.campaign_save_shipping(
  p_user uuid, p_campaign text, p_full_name text, p_line1 text, p_line2 text,
  p_city text, p_state text, p_postal text, p_email text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_claim public.campaign_claims;
begin
  select * into v_claim from public.campaign_claims
    where user_id = p_user and campaign_id = p_campaign for update;
  if not found then return jsonb_build_object('status', 'no_claim'); end if;
  if v_claim.fulfillment_status in ('shipped', 'delivered', 'canceled') then
    return jsonb_build_object('status', 'locked');
  end if;

  insert into public.campaign_shipping
    (claim_id, user_id, full_name, address_line1, address_line2, city, state, postal_code, email)
  values
    (v_claim.id, p_user, btrim(p_full_name), btrim(p_line1), nullif(btrim(coalesce(p_line2, '')), ''),
     btrim(p_city), upper(btrim(p_state)), btrim(p_postal), lower(btrim(p_email)))
  on conflict (claim_id) do update set
    full_name = excluded.full_name, address_line1 = excluded.address_line1,
    address_line2 = excluded.address_line2, city = excluded.city, state = excluded.state,
    postal_code = excluded.postal_code, email = excluded.email, updated_at = now();

  update public.campaign_claims
     set fulfillment_status = 'ready_to_ship', updated_at = now()
   where id = v_claim.id and fulfillment_status = 'needs_address';

  return jsonb_build_object('status', 'saved');
end;
$$;
revoke all on function public.campaign_save_shipping(uuid, text, text, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.campaign_save_shipping(uuid, text, text, text, text, text, text, text, text) to service_role;

-- ───────────────────────────── unlocked-email sweep ─────────────────────────
-- People who became eligible while away (usually: their third friend just
-- verified). The daily cron emails them once. Anyone who saw the unlock on the
-- page already has a log row and is skipped.

create or replace function public.campaign_unlock_candidates(p_campaign text, p_limit integer default 200)
returns table (user_id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email
  from (select distinct referrer_user_id as uid from public.referrals where referrer_user_id is not null) r
  join auth.users u on u.id = r.uid
  where u.email is not null
    and not exists (select 1 from public.campaign_email_log l where l.user_id = u.id and l.campaign_id = p_campaign and l.kind = 'unlocked')
    and not exists (select 1 from public.email_suppressions s where s.email = lower(u.email))
    and public.campaign_is_eligible(u.id, p_campaign)
  limit greatest(1, least(p_limit, 500))
$$;
revoke all on function public.campaign_unlock_candidates(text, integer) from public, anon, authenticated;
grant execute on function public.campaign_unlock_candidates(text, integer) to service_role;

-- ───────────────────────────── admin view ───────────────────────────────────
-- One row per person who has started (feedback, a referral, or a claim).
-- Readable by the service role only (Supabase table editor / /api/campaign-admin).

create or replace view public.campaign_admin_overview
with (security_invoker = true) as
with people as (
  select campaign_id, user_id from public.campaign_feedback
  union select campaign_id, user_id from public.campaign_claims
  union select c.id, r.referrer_user_id from public.referrals r cross join public.campaigns c
    where r.referrer_user_id is not null
)
select
  p.campaign_id,
  p.user_id,
  u.email,
  u.created_at as account_created_at,
  public.ayna_user_is_verified(p.user_id) as account_verified,
  (select f.response from public.campaign_feedback f where f.user_id = p.user_id and f.campaign_id = p.campaign_id and f.question_key = 'like') as feedback_like,
  (select f.response from public.campaign_feedback f where f.user_id = p.user_id and f.campaign_id = p.campaign_id and f.question_key = 'friction') as feedback_friction,
  (select f.response from public.campaign_feedback f where f.user_id = p.user_id and f.campaign_id = p.campaign_id and f.question_key = 'change') as feedback_change,
  (select count(*) from public.campaign_referral_rows(p.user_id, p.campaign_id)) as referrals_joined,
  (select count(*) from public.campaign_referral_rows(p.user_id, p.campaign_id) x where x.verified) as referrals_verified,
  public.campaign_is_eligible(p.user_id, p.campaign_id) as eligible_now,
  (select count(*) from public.campaign_spins s where s.user_id = p.user_id and s.campaign_id = p.campaign_id) as spins,
  cl.product_id as claimed_product_id,
  cl.product_name as claimed_product_name,
  cl.created_at as claimed_at,
  cl.fulfillment_status,
  cl.id as claim_id
from people p
join auth.users u on u.id = p.user_id
left join public.campaign_claims cl on cl.user_id = p.user_id and cl.campaign_id = p.campaign_id;

revoke all on public.campaign_admin_overview from public, anon, authenticated;
grant select on public.campaign_admin_overview to service_role;

grant select, insert, update, delete on
  public.campaigns, public.campaign_feedback, public.referral_codes, public.campaign_rewards,
  public.campaign_spins, public.campaign_claims, public.campaign_shipping,
  public.campaign_email_log, public.email_suppressions
  to service_role;
grant select on public.referrals to service_role;

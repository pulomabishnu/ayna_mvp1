-- Free product campaign: 3 thoughtful feedback answers + 3 verified friends
-- unlock one free product from an explicitly managed reward pool.
--
-- Idempotent: safe to re-run. NOT applied automatically; run it once in the
-- Supabase SQL editor AFTER 20261013150000_referrals.sql (it credits friends
-- from public.referrals) and after product_catalog.sql.
--
-- Design
--   * The backend is the only writer. Every table here has RLS on with no
--     client policies, and every function is security definer and executable
--     by service_role only. The browser talks to api/campaign.js, which checks
--     the caller's session and calls these functions with the caller's id.
--   * Eligibility is always recomputed from stored rows (campaign_progress).
--     There is no stored "eligible" flag anywhere.
--   * A spin is not a reservation. Inventory moves only inside
--     campaign_claim, in one transaction, with a conditional UPDATE
--     (inventory_claimed < inventory_total) so two people can never take the
--     same last unit, plus unique constraints for one claim per person per
--     campaign and one claim per idempotency key.
--   * "Verified account" means what it already means in ayna: Supabase has
--     confirmed the account (auth.users.email_confirmed_at, or
--     phone_confirmed_at for phone sign-in). Change it in one place:
--     public.campaign_user_is_verified.

do $$
begin
  if to_regclass('public.referrals') is null then
    raise exception 'Apply supabase/migrations/20261013150000_referrals.sql first: the free product campaign credits friends from public.referrals.';
  end if;
  if to_regclass('public.product_catalog') is null then
    raise exception 'Apply supabase/product_catalog.sql first: reward products must be real catalog products.';
  end if;
end $$;

-- ── Tables ───────────────────────────────────────────────────────────────────

create table if not exists public.reward_campaigns (
  id text primary key check (id ~ '^[a-z0-9-]{3,60}$'),
  name text not null check (char_length(name) between 1 and 120),
  -- null until the team launches it from /admin/campaign. Friends only count
  -- if their account was created at or after this moment.
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default false,
  feedback_required integer not null default 3 check (feedback_required between 1 and 10),
  feedback_min_chars integer not null default 120 check (feedback_min_chars between 20 and 2000),
  referrals_required integer not null default 3 check (referrals_required between 0 and 20),
  -- Spins per person. Claim any product you landed on; no spins after the last one
  -- (unless everything you landed on has since been claimed, then one more).
  max_spins integer not null default 3 check (max_spins between 1 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table if not exists public.campaign_feedback (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.reward_campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  question_key text not null check (question_key in ('like', 'friction', 'change')),
  question text not null check (char_length(question) between 1 and 300),
  response text not null check (char_length(response) between 1 and 2000),
  char_count integer not null check (char_count >= 0),
  -- Set by api/campaign.js after server-side validation (length, not
  -- whitespace or repeated characters, not a copy of another answer).
  -- campaign_progress re-checks the length and distinctness on its own.
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, user_id, question_key)
);
create index if not exists campaign_feedback_user_idx on public.campaign_feedback (user_id, campaign_id);

-- The reward pool. Only products listed here can ever be won; the rest of the
-- catalog is never free inventory. A reward is either a catalog product
-- (product_id) or a reward-only item described here (name, brand, size,
-- image_url, product_url), e.g. PR-haul products that are not sold on ayna.
-- Reward-only items never appear in Shop and carry no health claims.
create table if not exists public.reward_products (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.reward_campaigns (id) on delete cascade,
  product_id text references public.product_catalog (id),
  name text check (name is null or char_length(name) between 1 and 160),
  brand text check (brand is null or char_length(brand) between 1 and 80),
  size text check (size is null or char_length(size) <= 60),
  category text check (category is null or char_length(category) <= 40),
  image_url text check (image_url is null or image_url ~ '^https://'),
  product_url text check (product_url is null or product_url ~ '^https://'),
  inventory_total integer not null check (inventory_total >= 0),
  inventory_claimed integer not null default 0 check (inventory_claimed >= 0),
  inventory_remaining integer generated always as (inventory_total - inventory_claimed) stored,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reward_products_never_oversold check (inventory_claimed <= inventory_total),
  constraint reward_products_described check (product_id is not null or (name is not null and brand is not null)),
  unique (campaign_id, product_id)
);
create unique index if not exists reward_products_item_uniq
  on public.reward_products (campaign_id, lower(brand), lower(name)) where product_id is null;

create table if not exists public.reward_spins (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.reward_campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_product_id uuid not null references public.reward_products (id) on delete cascade,
  -- Strict order of spins, even several inside one transaction.
  seq bigint generated always as identity,
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists reward_spins_user_idx on public.reward_spins (campaign_id, user_id, seq desc);

create table if not exists public.reward_claims (
  id uuid primary key default gen_random_uuid(),
  campaign_id text not null references public.reward_campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_product_id uuid not null references public.reward_products (id),
  product_id text,
  spin_id uuid references public.reward_spins (id) on delete set null,
  idempotency_key text not null check (char_length(idempotency_key) between 16 and 80),
  spins_before_claim integer not null default 1,
  fulfillment_status text not null default 'needs_shipping'
    check (fulfillment_status in ('needs_shipping', 'preparing', 'shipped', 'delivered', 'canceled')),
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  shipped_at timestamptz,
  -- One reward per person per campaign, whatever the application does.
  constraint reward_claims_one_per_user unique (campaign_id, user_id),
  -- A retried request with the same key can never create a second claim.
  constraint reward_claims_idempotency unique (idempotency_key)
);

-- Shipping details: server-only, never returned to analytics or other users.
create table if not exists public.reward_shipping (
  claim_id uuid primary key references public.reward_claims (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  address_line1 text not null check (char_length(address_line1) between 3 and 200),
  address_line2 text check (address_line2 is null or char_length(address_line2) <= 120),
  city text not null check (char_length(city) between 2 and 100),
  state text not null check (state ~ '^[A-Z]{2}$'),
  postal_code text not null check (postal_code ~ '^[0-9]{5}(-[0-9]{4})?$'),
  email text not null check (char_length(email) between 3 and 254 and email like '%_@_%'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per email actually sent, so the cron and retries never double send.
create table if not exists public.reward_notifications (
  campaign_id text not null references public.reward_campaigns (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('unlocked', 'claimed', 'shipped')),
  sent_at timestamptz not null default now(),
  primary key (campaign_id, user_id, kind)
);

-- ── Access: server only ──────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array['reward_campaigns', 'campaign_feedback', 'reward_products',
    'reward_spins', 'reward_claims', 'reward_shipping', 'reward_notifications']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;

-- ── Helpers ──────────────────────────────────────────────────────────────────

create or replace function public.campaign_user_is_verified(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users u
    where u.id = p_user
      and (u.email_confirmed_at is not null or u.phone_confirmed_at is not null)
  )
$$;

-- Same inbox, different spelling: lowercased, "+tag" dropped, and Gmail's
-- dots ignored. Used so one person with name+1@ / name+2@ cannot fill all
-- three friend slots, or count as their own friend.
create or replace function public.campaign_normalize_email(p_email text)
returns text
language plpgsql
immutable
as $$
declare
  e text := lower(btrim(coalesce(p_email, '')));
  local_part text;
  domain text;
begin
  if position('@' in e) = 0 then return nullif(e, ''); end if;
  local_part := split_part(e, '@', 1);
  domain := split_part(e, '@', 2);
  local_part := split_part(local_part, '+', 1);
  if domain in ('gmail.com', 'googlemail.com') then
    local_part := replace(local_part, '.', '');
    domain := 'gmail.com';
  end if;
  return local_part || '@' || domain;
end
$$;

-- Masked label for a friend: first letter of their email, nothing else.
create or replace function public.campaign_mask_contact(p_email text)
returns text
language sql
immutable
as $$
  select case
    when coalesce(btrim(p_email), '') = '' then null
    else upper(left(btrim(p_email), 1)) || '•••'
  end
$$;

-- Every friend attributed to p_user, and whether each one counts.
--   verified      friend's account is verified (counts)
--   unverified    joined, verification not finished yet
--   existing      account existed before the campaign started (never counts)
--   same_person   same inbox as the referrer (never counts)
--   duplicate     same inbox as a friend already listed (never counts)
create or replace function public.campaign_referral_rows(p_campaign text, p_user uuid)
returns table (
  referred_user_id uuid,
  label text,
  joined_at timestamptz,
  status text,
  counts boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with c as (
    select starts_at from public.reward_campaigns where id = p_campaign
  ),
  me as (
    select public.campaign_normalize_email(u.email) as ne
    from auth.users u where u.id = p_user
  ),
  r as (
    select
      r.referred_user_id,
      u.email,
      u.created_at as account_created_at,
      r.created_at as referred_at,
      public.campaign_normalize_email(u.email) as ne,
      (u.email_confirmed_at is not null or u.phone_confirmed_at is not null) as verified
    from public.referrals r
    join auth.users u on u.id = r.referred_user_id
    where p_user is not null
      and r.referrer_code = public.ayna_referral_code(p_user)
      and r.referred_user_id <> p_user
  ),
  ranked as (
    select r.*,
      row_number() over (
        partition by coalesce(r.ne, r.referred_user_id::text)
        order by r.account_created_at, r.referred_user_id
      ) as dup_rank
    from r
  ),
  classified as (
    select
      k.referred_user_id,
      k.email,
      k.account_created_at,
      case
        when (select starts_at from c) is null or k.account_created_at < (select starts_at from c) then 'existing'
        -- The referrals insert policy only allows attribution in the account's
        -- first 7 days; re-check it here so a later manual insert never counts.
        when k.referred_at > k.account_created_at + interval '7 days' then 'existing'
        when k.ne is not null and k.ne = (select ne from me) then 'same_person'
        when k.dup_rank > 1 then 'duplicate'
        when k.verified then 'verified'
        else 'unverified'
      end as status
    from ranked k
  )
  select
    referred_user_id,
    public.campaign_mask_contact(email) as label,
    account_created_at as joined_at,
    status,
    status = 'verified' as counts
  from classified
  order by (status = 'verified') desc, (status = 'unverified') desc, account_created_at
$$;

create or replace function public.campaign_product_json(p_reward_product uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'rewardProductId', rp.id,
    'productId', coalesce(pc.id, 'reward-' || rp.id::text),
    'name', coalesce(rp.name, pc.name),
    'brand', coalesce(rp.brand, pc.brand),
    'size', rp.size,
    'category', coalesce(rp.category, pc.category),
    'summary', case when rp.product_id is null then null else pc.summary end,
    'image', coalesce(rp.image_url, pc.image),
    'url', coalesce(rp.product_url, pc.url)
  )
  from public.reward_products rp
  left join public.product_catalog pc on pc.id = rp.product_id
  where rp.id = p_reward_product
$$;

create or replace function public.campaign_claim_json(p_claim uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', c.id,
    'claimedAt', c.claimed_at,
    'fulfillmentStatus', c.fulfillment_status,
    'shippedAt', c.shipped_at,
    'hasShipping', exists (select 1 from public.reward_shipping s where s.claim_id = c.id),
    'product', public.campaign_product_json(c.reward_product_id)
  )
  from public.reward_claims c
  where c.id = p_claim
$$;

-- Products that can be won right now: active, units left, and (for catalog
-- products) still active in the catalog.
create or replace function public.campaign_available_products(p_campaign text)
returns setof public.reward_products
language sql
stable
security definer
set search_path = public
as $$
  select rp.*
  from public.reward_products rp
  left join public.product_catalog pc on pc.id = rp.product_id
  where rp.campaign_id = p_campaign
    and rp.is_active
    and (rp.product_id is null or pc.is_active)
    and rp.inventory_claimed < rp.inventory_total
$$;

-- ── Progress / eligibility (the single source of truth) ──────────────────────

create or replace function public.campaign_progress(p_campaign text, p_user uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.reward_campaigns;
  v_verified boolean;
  v_feedback jsonb;
  v_feedback_ok integer;
  v_referrals jsonb;
  v_referrals_ok integer;
  v_claim uuid;
  v_requirements_met boolean;
  v_live boolean;
  v_inventory boolean;
  v_spins integer;
  v_last_spin uuid;
  v_landed jsonb;
  v_landed_available boolean;
  v_can_spin boolean;
begin
  select * into c from public.reward_campaigns where id = p_campaign;
  if not found then
    return jsonb_build_object('campaign', null);
  end if;

  v_live := c.is_active
    and c.starts_at is not null and c.starts_at <= now()
    and (c.ends_at is null or c.ends_at > now());

  v_verified := public.campaign_user_is_verified(p_user);

  select coalesce(jsonb_agg(jsonb_build_object(
      'key', f.question_key,
      'response', f.response,
      'charCount', f.char_count,
      'complete', f.is_complete and char_length(btrim(f.response)) >= c.feedback_min_chars,
      'updatedAt', f.updated_at
    ) order by f.question_key), '[]'::jsonb)
  into v_feedback
  from public.campaign_feedback f
  where f.campaign_id = p_campaign and f.user_id = p_user;

  -- Distinct answers only: the same text pasted twice counts once.
  select count(distinct lower(regexp_replace(btrim(f.response), '\s+', ' ', 'g')))
  into v_feedback_ok
  from public.campaign_feedback f
  where f.campaign_id = p_campaign and f.user_id = p_user
    and f.is_complete
    and char_length(btrim(f.response)) >= c.feedback_min_chars;

  select
    coalesce(jsonb_agg(jsonb_build_object(
      'label', r.label, 'joinedAt', r.joined_at, 'status', r.status, 'counts', r.counts
    )), '[]'::jsonb),
    count(*) filter (where r.counts)
  into v_referrals, v_referrals_ok
  from public.campaign_referral_rows(p_campaign, p_user) r;

  select id into v_claim from public.reward_claims where campaign_id = p_campaign and user_id = p_user;

  v_requirements_met := v_verified
    and v_feedback_ok >= c.feedback_required
    and v_referrals_ok >= c.referrals_required;

  v_inventory := exists (select 1 from public.campaign_available_products(p_campaign));

  select count(*), (array_agg(s.id order by s.seq desc))[1]
  into v_spins, v_last_spin
  from public.reward_spins s
  where s.campaign_id = p_campaign and s.user_id = p_user;

  -- Every product she has landed on (newest first), and whether it can still be claimed.
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'spinId', l.spin_id,
      'product', public.campaign_product_json(l.reward_product_id),
      'available', l.available
    ) order by l.seq desc), '[]'::jsonb),
    coalesce(bool_or(l.available), false)
  into v_landed, v_landed_available
  from (
    select distinct on (s.reward_product_id) s.reward_product_id, s.id as spin_id, s.seq,
      exists (select 1 from public.campaign_available_products(p_campaign) a where a.id = s.reward_product_id) as available
    from public.reward_spins s
    where s.campaign_id = p_campaign and s.user_id = p_user
    order by s.reward_product_id, s.seq desc
  ) l;

  -- Spins run out at max_spins, unless everything she landed on is gone.
  v_can_spin := v_inventory and (v_spins < c.max_spins or not v_landed_available);

  return jsonb_build_object(
    'campaign', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'live', v_live,
      'launched', c.starts_at is not null,
      'ended', c.ends_at is not null and c.ends_at <= now(),
      'startsAt', c.starts_at,
      'endsAt', c.ends_at,
      'feedbackRequired', c.feedback_required,
      'feedbackMinChars', c.feedback_min_chars,
      'referralsRequired', c.referrals_required,
      'maxSpins', c.max_spins
    ),
    'verified', v_verified,
    'feedback', v_feedback,
    'feedbackComplete', least(v_feedback_ok, c.feedback_required),
    'referrals', v_referrals,
    'referralsVerified', v_referrals_ok,
    'requirementsMet', v_requirements_met,
    'eligible', v_requirements_met and v_live and v_claim is null,
    'inventoryAvailable', v_inventory,
    'spins', v_spins,
    'spinsLeft', greatest(c.max_spins - v_spins, 0),
    'canSpin', v_requirements_met and v_live and v_claim is null and v_can_spin,
    'landed', case when v_claim is null then v_landed else '[]'::jsonb end,
    'lastSpin', case when v_last_spin is null or v_claim is not null then null else jsonb_build_object(
      'spinId', v_last_spin,
      'product', (select public.campaign_product_json(s.reward_product_id) from public.reward_spins s where s.id = v_last_spin)
    ) end,
    'claim', case when v_claim is null then null else public.campaign_claim_json(v_claim) end
  );
end
$$;

-- Names and photos of what can still be won, for the reel. No counts.
create or replace function public.campaign_pool(p_campaign text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(public.campaign_product_json(a.id) order by a.created_at), '[]'::jsonb)
  from public.campaign_available_products(p_campaign) a
$$;

-- ── Feedback ─────────────────────────────────────────────────────────────────

create or replace function public.campaign_save_feedback(
  p_campaign text, p_user uuid, p_key text, p_question text, p_response text, p_complete boolean
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  c public.reward_campaigns;
begin
  select * into c from public.reward_campaigns where id = p_campaign;
  if not found or not c.is_active or c.starts_at is null or c.starts_at > now() or (c.ends_at is not null and c.ends_at <= now()) then
    return jsonb_build_object('ok', false, 'error', 'campaign_inactive');
  end if;
  if exists (select 1 from public.reward_claims where campaign_id = p_campaign and user_id = p_user) then
    return jsonb_build_object('ok', false, 'error', 'already_claimed');
  end if;
  insert into public.campaign_feedback as f (campaign_id, user_id, question_key, question, response, char_count, is_complete)
  values (p_campaign, p_user, p_key, p_question, btrim(p_response), char_length(btrim(p_response)), p_complete)
  on conflict (campaign_id, user_id, question_key) do update
    set question = excluded.question,
        response = excluded.response,
        char_count = excluded.char_count,
        is_complete = excluded.is_complete,
        updated_at = now();
  return jsonb_build_object('ok', true);
end
$$;

-- ── Spin ─────────────────────────────────────────────────────────────────────
-- Picks one product at random, on the server, from what has units left, and
-- avoids anything she has already landed on when something else is available.
-- Allows max_spins per person (one more if everything she landed on is gone).
-- Records the spin; never touches inventory.

create or replace function public.campaign_spin(p_campaign text, p_user uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  progress jsonb;
  v_last uuid;
  v_pick uuid;
  v_spin uuid;
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended('campaign_user:' || p_campaign || ':' || p_user::text, 0));

  progress := public.campaign_progress(p_campaign, p_user);
  if progress -> 'campaign' = 'null'::jsonb then
    return jsonb_build_object('ok', false, 'error', 'campaign_inactive');
  end if;
  if progress -> 'claim' <> 'null'::jsonb then
    return jsonb_build_object('ok', false, 'error', 'already_claimed', 'claim', progress -> 'claim');
  end if;
  if not (progress -> 'campaign' ->> 'live')::boolean then
    return jsonb_build_object('ok', false, 'error', 'campaign_inactive');
  end if;
  if not (progress ->> 'eligible')::boolean then
    return jsonb_build_object('ok', false, 'error', 'not_eligible');
  end if;
  if (progress ->> 'inventoryAvailable')::boolean and not (progress ->> 'canSpin')::boolean then
    return jsonb_build_object('ok', false, 'error', 'no_spins_left');
  end if;

  select s.reward_product_id into v_last
  from public.reward_spins s
  where s.campaign_id = p_campaign and s.user_id = p_user
  order by s.seq desc
  limit 1;

  select count(*) into v_count from public.campaign_available_products(p_campaign);
  if v_count = 0 then
    return jsonb_build_object('ok', false, 'error', 'no_inventory');
  end if;

  -- Prefer something new; then anything but the last one; then anything.
  select a.id into v_pick
  from public.campaign_available_products(p_campaign) a
  order by
    exists (select 1 from public.reward_spins s where s.campaign_id = p_campaign and s.user_id = p_user and s.reward_product_id = a.id),
    (v_count > 1 and a.id = v_last),
    random()
  limit 1;

  insert into public.reward_spins (campaign_id, user_id, reward_product_id)
  values (p_campaign, p_user, v_pick)
  returning id into v_spin;

  return jsonb_build_object(
    'ok', true,
    'spinId', v_spin,
    'spinNumber', (select count(*) from public.reward_spins where campaign_id = p_campaign and user_id = p_user),
    'spinsLeft', greatest((progress -> 'campaign' ->> 'maxSpins')::int - (select count(*)::int from public.reward_spins where campaign_id = p_campaign and user_id = p_user), 0),
    'product', public.campaign_product_json(v_pick)
  );
end
$$;

-- ── Claim (atomic) ───────────────────────────────────────────────────────────
-- Everything below runs in ONE transaction:
--   1. per-person advisory lock, so a double click is processed one at a time
--   2. replay of the same idempotency key returns the existing claim
--   3. eligibility recomputed from stored rows
--   4. the spin must be one of this person's own spins in this campaign
--      (she can claim anything she landed on, not only the latest)
--   5. conditional UPDATE takes one unit only if one is left (row lock; a
--      concurrent claimer waits, then re-checks the condition and gets 0 rows)
--   6. claim inserted; unique constraints are the last line of defence, and
--      any error rolls back step 5 with it.

create or replace function public.campaign_claim(p_campaign text, p_user uuid, p_spin uuid, p_idempotency_key text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  existing public.reward_claims;
  progress jsonb;
  v_spin public.reward_spins;
  v_rp public.reward_products;
  v_claim uuid;
  v_spins integer;
begin
  if p_idempotency_key is null or char_length(p_idempotency_key) not between 16 and 80 then
    return jsonb_build_object('ok', false, 'error', 'bad_request');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('campaign_user:' || p_campaign || ':' || p_user::text, 0));

  select * into existing from public.reward_claims where campaign_id = p_campaign and user_id = p_user;
  if found then
    if existing.idempotency_key = p_idempotency_key then
      return jsonb_build_object('ok', true, 'replayed', true, 'claim', public.campaign_claim_json(existing.id));
    end if;
    return jsonb_build_object('ok', false, 'error', 'already_claimed', 'claim', public.campaign_claim_json(existing.id));
  end if;

  -- Same key used by someone else: refuse rather than leak their claim.
  if exists (select 1 from public.reward_claims where idempotency_key = p_idempotency_key) then
    return jsonb_build_object('ok', false, 'error', 'bad_request');
  end if;

  progress := public.campaign_progress(p_campaign, p_user);
  if progress -> 'campaign' = 'null'::jsonb or not (progress -> 'campaign' ->> 'live')::boolean then
    return jsonb_build_object('ok', false, 'error', 'campaign_inactive');
  end if;
  if not (progress ->> 'eligible')::boolean then
    return jsonb_build_object('ok', false, 'error', 'not_eligible');
  end if;

  select * into v_spin from public.reward_spins
  where id = p_spin and campaign_id = p_campaign and user_id = p_user;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_spin');
  end if;

  update public.reward_products rp
     set inventory_claimed = rp.inventory_claimed + 1,
         updated_at = now()
   where rp.id = v_spin.reward_product_id
     and rp.campaign_id = p_campaign
     and rp.is_active
     and rp.inventory_claimed < rp.inventory_total
     and (rp.product_id is null or exists (select 1 from public.product_catalog pc where pc.id = rp.product_id and pc.is_active))
  returning rp.* into v_rp;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'out_of_stock',
      'product', public.campaign_product_json(v_spin.reward_product_id));
  end if;

  select count(*) into v_spins from public.reward_spins where campaign_id = p_campaign and user_id = p_user;

  insert into public.reward_claims (campaign_id, user_id, reward_product_id, product_id, spin_id, idempotency_key, spins_before_claim)
  values (p_campaign, p_user, v_rp.id, v_rp.product_id, v_spin.id, p_idempotency_key, v_spins)
  returning id into v_claim;

  return jsonb_build_object('ok', true, 'replayed', false, 'claim', public.campaign_claim_json(v_claim));
end
$$;

-- ── Shipping ─────────────────────────────────────────────────────────────────

create or replace function public.campaign_save_shipping(p_campaign text, p_user uuid, p_address jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_claim public.reward_claims;
begin
  select * into v_claim from public.reward_claims where campaign_id = p_campaign and user_id = p_user;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'no_claim');
  end if;
  if v_claim.fulfillment_status not in ('needs_shipping', 'preparing') then
    return jsonb_build_object('ok', false, 'error', 'already_shipped');
  end if;
  insert into public.reward_shipping as s (claim_id, user_id, full_name, address_line1, address_line2, city, state, postal_code, email)
  values (
    v_claim.id, p_user,
    p_address ->> 'fullName', p_address ->> 'addressLine1', nullif(p_address ->> 'addressLine2', ''),
    p_address ->> 'city', p_address ->> 'state', p_address ->> 'postalCode', p_address ->> 'email'
  )
  on conflict (claim_id) do update set
    full_name = excluded.full_name,
    address_line1 = excluded.address_line1,
    address_line2 = excluded.address_line2,
    city = excluded.city,
    state = excluded.state,
    postal_code = excluded.postal_code,
    email = excluded.email,
    updated_at = now();
  update public.reward_claims set fulfillment_status = 'preparing', updated_at = now()
  where id = v_claim.id and fulfillment_status = 'needs_shipping';
  return jsonb_build_object('ok', true, 'claim', public.campaign_claim_json(v_claim.id));
end
$$;

-- ── Notifications (used by api/campaign-notify.js) ───────────────────────────

-- People who just became able to spin and have not had the "unlocked" email.
-- Waiting for stock counts as not yet able: they get it once units exist.
create or replace function public.campaign_unlocked_to_notify(p_campaign text, p_limit integer default 200)
returns table (user_id uuid, email text)
language sql
stable
security definer
set search_path = public
as $$
  select u.id, u.email
  from auth.users u
  where u.email is not null
    and exists (select 1 from public.campaign_available_products(p_campaign))
    and u.id in (
      select f.user_id from public.campaign_feedback f
      where f.campaign_id = p_campaign and f.is_complete
      group by f.user_id
      having count(*) >= (select feedback_required from public.reward_campaigns where id = p_campaign)
    )
    and not exists (select 1 from public.reward_notifications n where n.campaign_id = p_campaign and n.user_id = u.id and n.kind = 'unlocked')
    and (public.campaign_progress(p_campaign, u.id) ->> 'eligible')::boolean
  limit greatest(1, least(coalesce(p_limit, 200), 1000))
$$;

-- Returns true only for the first caller, so an email goes out at most once.
create or replace function public.campaign_mark_notified(p_campaign text, p_user uuid, p_kind text)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  insert into public.reward_notifications (campaign_id, user_id, kind) values (p_campaign, p_user, p_kind);
  return true;
exception when unique_violation then
  return false;
end
$$;

create or replace function public.campaign_unmark_notified(p_campaign text, p_user uuid, p_kind text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  delete from public.reward_notifications where campaign_id = p_campaign and user_id = p_user and kind = p_kind
$$;

-- ── Admin (api/campaign-admin.js, ADMIN_EMAILS only) ─────────────────────────

create or replace function public.campaign_admin_overview(p_campaign text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  c public.reward_campaigns;
  v_inventory jsonb;
  v_people jsonb;
begin
  select * into c from public.reward_campaigns where id = p_campaign;
  if not found then return jsonb_build_object('campaign', null); end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'rewardProductId', rp.id,
      'productId', rp.product_id,
      'name', coalesce(rp.name, pc.name),
      'brand', coalesce(rp.brand, pc.brand),
      'size', rp.size,
      'image', coalesce(rp.image_url, pc.image),
      'url', coalesce(rp.product_url, pc.url),
      'inventoryTotal', rp.inventory_total,
      'inventoryClaimed', rp.inventory_claimed,
      'inventoryRemaining', rp.inventory_remaining,
      'isActive', rp.is_active,
      'timesShown', (select count(*) from public.reward_spins s where s.reward_product_id = rp.id),
      'timesClaimed', (select count(*) from public.reward_claims k where k.reward_product_id = rp.id)
    ) order by coalesce(rp.brand, pc.brand), coalesce(rp.name, pc.name)), '[]'::jsonb)
  into v_inventory
  from public.reward_products rp
  left join public.product_catalog pc on pc.id = rp.product_id
  where rp.campaign_id = p_campaign;

  with participants as (
    select user_id from public.campaign_feedback where campaign_id = p_campaign
    union select user_id from public.reward_spins where campaign_id = p_campaign
    union select user_id from public.reward_claims where campaign_id = p_campaign
  )
  select coalesce(jsonb_agg(person order by (person ->> 'referralsVerified')::int desc, person ->> 'email'), '[]'::jsonb)
  into v_people
  from (
    select jsonb_build_object(
      'userId', u.id,
      'email', u.email,
      'verified', public.campaign_user_is_verified(u.id),
      'feedback', (select coalesce(jsonb_object_agg(f.question_key, jsonb_build_object(
          'question', f.question, 'response', f.response, 'charCount', f.char_count,
          'complete', f.is_complete, 'updatedAt', f.updated_at)), '{}'::jsonb)
        from public.campaign_feedback f where f.campaign_id = p_campaign and f.user_id = u.id),
      'referralsVerified', p.progress ->> 'referralsVerified',
      'referrals', p.progress -> 'referrals',
      'requirementsMet', (p.progress ->> 'requirementsMet')::boolean,
      'eligible', (p.progress ->> 'eligible')::boolean,
      'spins', (p.progress ->> 'spins')::int,
      'claim', (select jsonb_build_object(
          'id', k.id, 'claimedAt', k.claimed_at, 'fulfillmentStatus', k.fulfillment_status,
          'spinsBeforeClaim', k.spins_before_claim, 'shippedAt', k.shipped_at,
          'productId', k.product_id, 'productName', public.campaign_product_json(k.reward_product_id) ->> 'name',
          'brand', public.campaign_product_json(k.reward_product_id) ->> 'brand',
          'shipping', (select to_jsonb(s) - 'claim_id' - 'user_id' from public.reward_shipping s where s.claim_id = k.id))
        from public.reward_claims k
        where k.campaign_id = p_campaign and k.user_id = u.id)
    ) as person
    from participants pt
    join auth.users u on u.id = pt.user_id
    cross join lateral (select public.campaign_progress(p_campaign, u.id) as progress) p
  ) people;

  return jsonb_build_object(
    'campaign', to_jsonb(c),
    'inventory', v_inventory,
    'people', v_people,
    'totals', jsonb_build_object(
      'participants', jsonb_array_length(v_people),
      'feedbackDone', (select count(*) from jsonb_array_elements(v_people) x
        where (select count(*) from jsonb_each(x -> 'feedback') e where (e.value ->> 'complete')::boolean) >= c.feedback_required),
      'requirementsMet', (select count(*) from jsonb_array_elements(v_people) x where (x ->> 'requirementsMet')::boolean),
      'spins', (select count(*) from public.reward_spins where campaign_id = p_campaign),
      'claims', (select count(*) from public.reward_claims where campaign_id = p_campaign),
      'waitingForStock', (select count(*) from jsonb_array_elements(v_people) x
        where (x ->> 'eligible')::boolean and not exists (select 1 from public.campaign_available_products(p_campaign)))
    )
  );
end
$$;

create or replace function public.campaign_admin_set_fulfillment(p_claim uuid, p_status text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v public.reward_claims;
begin
  if p_status not in ('needs_shipping', 'preparing', 'shipped', 'delivered', 'canceled') then
    return jsonb_build_object('ok', false, 'error', 'bad_status');
  end if;
  update public.reward_claims
     set fulfillment_status = p_status,
         shipped_at = case when p_status = 'shipped' then coalesce(shipped_at, now()) else shipped_at end,
         updated_at = now()
   where id = p_claim
  returning * into v;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'claimId', v.id, 'userId', v.user_id, 'campaignId', v.campaign_id, 'status', v.fulfillment_status);
end
$$;

-- ── Grants ───────────────────────────────────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'campaign_user_is_verified(uuid)',
    'campaign_referral_rows(text, uuid)',
    'campaign_product_json(uuid)',
    'campaign_claim_json(uuid)',
    'campaign_available_products(text)',
    'campaign_progress(text, uuid)',
    'campaign_pool(text)',
    'campaign_save_feedback(text, uuid, text, text, text, boolean)',
    'campaign_spin(text, uuid)',
    'campaign_claim(text, uuid, uuid, text)',
    'campaign_save_shipping(text, uuid, jsonb)',
    'campaign_unlocked_to_notify(text, integer)',
    'campaign_mark_notified(text, uuid, text)',
    'campaign_unmark_notified(text, uuid, text)',
    'campaign_admin_overview(text)',
    'campaign_admin_set_fulfillment(uuid, text)'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
    execute format('grant execute on function public.%s to service_role', f);
  end loop;
end $$;

-- ── The campaign itself ──────────────────────────────────────────────────────
-- Created paused and with an empty reward pool. Nothing is live until the team
-- adds products and presses "Launch" on /admin/campaign (that sets starts_at
-- to the launch moment, so only friends who join from then on count).
insert into public.reward_campaigns (id, name)
values ('free-product-2026', 'Feedback + friends free product')
on conflict (id) do nothing;

-- Adding products to the pool (or use /admin/campaign):
--   insert into public.reward_products (campaign_id, product_id, inventory_total)
--   values ('free-product-2026', '<product_catalog.id>', 5)
--   on conflict (campaign_id, product_id) do update set inventory_total = excluded.inventory_total;

-- Upgrades for a database that already ran an earlier draft of this file.
alter table public.reward_campaigns add column if not exists max_spins integer not null default 3;
alter table public.reward_products alter column product_id drop not null;
alter table public.reward_products add column if not exists name text;
alter table public.reward_products add column if not exists brand text;
alter table public.reward_products add column if not exists size text;
alter table public.reward_products add column if not exists category text;
alter table public.reward_products add column if not exists image_url text;
alter table public.reward_products add column if not exists product_url text;
alter table public.reward_claims alter column product_id drop not null;

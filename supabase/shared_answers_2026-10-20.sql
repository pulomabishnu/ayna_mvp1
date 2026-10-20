-- Shared Ask ayna answers (/a/<slug>) and invite tracking for those links.
-- Written for api/share-answer.js, src/utils/sharedAnswer.js and
-- src/components/SharedAnswerPage.jsx. Idempotent: safe to re-run.
-- NOT applied automatically; run it once in the Supabase SQL editor.
-- Needs supabase/migrations/20261013150000_referrals.sql and
-- 20261019120000_referral_from_signup.sql (both already applied).
--
-- What is stored
--   * shared_answers: only the question and answer she chose to share, plus
--     any sources shown with it. No health profile, no chat history.
--   * shared_answer_opens: one row per visitor per link per day. visitor_key
--     is a salted, day-scoped hash made on the server; no IP address, user
--     agent or account id is stored, and the key changes every day.
--   * referrals.via_share_slug: which shared link a sign-up came through
--     (the referrer is still referrals.referrer_code, the sharer's code).
--
-- Reading the numbers (service role / SQL editor only):
--   select * from public.invite_stats order by opens desc;

-- 1. Shared answers ----------------------------------------------------------

create table if not exists public.shared_answers (
  id text primary key check (id ~ '^[A-Za-z0-9]{10}$'),
  owner_id uuid not null references auth.users (id) on delete cascade,
  question text not null check (char_length(question) between 1 and 500),
  answer text not null check (char_length(answer) between 1 and 8000),
  sources jsonb not null default '[]'::jsonb check (jsonb_typeof(sources) = 'array' and jsonb_array_length(sources) <= 12),
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists shared_answers_owner_idx on public.shared_answers (owner_id, created_at desc);

alter table public.shared_answers enable row level security;

revoke all on public.shared_answers from anon, authenticated;
-- Column-level: the public can read the shared content of live links, never owner_id.
grant select (id, question, answer, sources, created_at) on public.shared_answers to anon, authenticated;
grant select (owner_id, revoked_at) on public.shared_answers to authenticated;
grant insert (id, owner_id, question, answer, sources) on public.shared_answers to authenticated;
grant update (revoked_at) on public.shared_answers to authenticated;
grant all on public.shared_answers to service_role;

-- Anyone may read a link that is still shared (the slug is the secret).
drop policy if exists shared_answers_public_read on public.shared_answers;
create policy shared_answers_public_read on public.shared_answers
  for select to anon, authenticated
  using (revoked_at is null);

-- The owner can also see her own revoked links.
drop policy if exists shared_answers_owner_read on public.shared_answers;
create policy shared_answers_owner_read on public.shared_answers
  for select to authenticated
  using (owner_id = auth.uid());

-- Server-side rate limit for direct inserts (the API also limits per user):
-- at most 30 links an hour and 200 a day per account.
create or replace function public.ayna_shared_answer_quota_ok(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.shared_answers s where s.owner_id = uid and s.created_at > now() - interval '1 hour') < 30
     and (select count(*) from public.shared_answers s where s.owner_id = uid and s.created_at > now() - interval '1 day') < 200
$$;
revoke all on function public.ayna_shared_answer_quota_ok(uuid) from public, anon;
grant execute on function public.ayna_shared_answer_quota_ok(uuid) to authenticated;

-- Insert: the owner only, a real account (not a Community guest), within quota.
drop policy if exists shared_answers_owner_insert on public.shared_answers;
create policy shared_answers_owner_insert on public.shared_answers
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and public.ayna_shared_answer_quota_ok(auth.uid())
  );

-- Update: the owner can stop sharing (only revoked_at is granted above).
drop policy if exists shared_answers_owner_update on public.shared_answers;
create policy shared_answers_owner_update on public.shared_answers
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- 2. Opens (deduped per visitor per link per day, no personal data) ---------

create table if not exists public.shared_answer_opens (
  slug text not null references public.shared_answers (id) on delete cascade,
  day date not null default current_date,
  visitor_key text not null check (visitor_key ~ '^[a-f0-9]{16,64}$'),
  primary key (slug, day, visitor_key)
);

alter table public.shared_answer_opens enable row level security;
revoke all on public.shared_answer_opens from anon, authenticated;
grant all on public.shared_answer_opens to service_role;
-- No policies: only the API (service role) writes or reads these rows.

-- 3. Sign-ups through a shared link (reuses the referrals table) -----------

alter table public.referrals add column if not exists via_share_slug text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'referrals_via_share_slug_format') then
    alter table public.referrals
      add constraint referrals_via_share_slug_format check (via_share_slug is null or via_share_slug ~ '^[A-Za-z0-9]{10}$');
  end if;
end $$;
create index if not exists referrals_via_share_slug_idx on public.referrals (via_share_slug) where via_share_slug is not null;

-- Same trigger as 20261019120000_referral_from_signup.sql, now also storing
-- user_metadata.referred_via_share (the /a/<slug> she signed up from).
create or replace function public.ayna_referral_from_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := lower(coalesce(new.raw_user_meta_data ->> 'referred_by', ''));
  v_slug text := coalesce(new.raw_user_meta_data ->> 'referred_via_share', '');
begin
  if v_code !~ '^[a-z0-9]{6,20}$'
     or v_code = public.ayna_referral_code(new.id)
     or new.created_at < now() - interval '7 days' then
    return new;
  end if;
  if v_slug !~ '^[A-Za-z0-9]{10}$' then v_slug := null; end if;
  insert into public.referrals (referred_user_id, referrer_code, via_share_slug)
  values (new.id, v_code, v_slug)
  on conflict (referred_user_id) do update
    set via_share_slug = coalesce(public.referrals.via_share_slug, excluded.via_share_slug)
    where public.referrals.referrer_code = excluded.referrer_code;
  return new;
exception when others then
  -- Never block a sign-up over a referral.
  raise warning 'ayna_referral_from_metadata: %', sqlerrm;
  return new;
end
$$;

revoke all on function public.ayna_referral_from_metadata() from public, anon, authenticated;

drop trigger if exists ayna_referral_from_metadata on auth.users;
create trigger ayna_referral_from_metadata
  after insert or update of raw_user_meta_data on auth.users
  for each row execute function public.ayna_referral_from_metadata();

-- 4. Team numbers: invite_stats (service role only) ------------------------
-- One row per person who has shared at least one answer link.
--   links_shared   links she created (including ones she later turned off)
--   opens          distinct visitors per link per day, across her links
--   signups        accounts created through one of her shared links
--   verified_email those accounts with a confirmed email
--   verified_phone those accounts with a verified phone number
--   all_referral_signups  every account attributed to her code (/join links too)

create or replace view public.invite_stats as
with links as (
  select owner_id, count(*)::integer as links_shared
  from public.shared_answers group by owner_id
), opens as (
  select s.owner_id, count(*)::integer as opens
  from public.shared_answer_opens o join public.shared_answers s on s.id = o.slug
  group by s.owner_id
), share_signups as (
  select s.owner_id, r.referred_user_id
  from public.referrals r
  join public.shared_answers s on s.id = r.via_share_slug
  where r.referrer_code = public.ayna_referral_code(s.owner_id)
)
select
  l.owner_id as user_id,
  u.email,
  l.links_shared,
  coalesce(o.opens, 0) as opens,
  (select count(distinct ss.referred_user_id)::integer from share_signups ss where ss.owner_id = l.owner_id) as signups,
  (select count(distinct ss.referred_user_id)::integer from share_signups ss
     join auth.users ru on ru.id = ss.referred_user_id
    where ss.owner_id = l.owner_id and ru.email_confirmed_at is not null) as verified_email,
  (select count(distinct ss.referred_user_id)::integer from share_signups ss
     left join auth.users ru on ru.id = ss.referred_user_id
     left join public.phone_numbers pn on pn.user_id = ss.referred_user_id
    where ss.owner_id = l.owner_id and (pn.is_verified is true or ru.phone_confirmed_at is not null)) as verified_phone,
  (select count(*)::integer from public.referrals r where r.referrer_code = public.ayna_referral_code(l.owner_id)) as all_referral_signups
from links l
join auth.users u on u.id = l.owner_id
left join opens o on o.owner_id = l.owner_id;

revoke all on public.invite_stats from public, anon, authenticated;
grant select on public.invite_stats to service_role;

-- Record a referral on the server, from sign-up metadata.
-- Needs 20261013150000_referrals.sql. Idempotent: safe to re-run.
-- NOT applied automatically; run it once in the Supabase SQL editor.
--
-- Before this, only the browser wrote the referrals row, after sign-in, from
-- the ?ref code saved in that browser. A friend who opened the invite link on
-- her laptop but tapped the confirmation email on her phone (or in Gmail's
-- in-app browser) was never counted.
--
-- Now the sign-up form sends the saved code as user_metadata.referred_by, and
-- this trigger writes the referrals row as soon as the account exists. It
-- also fires when the metadata is set later (the browser path still sets it).
-- Same rules as the insert policy: not your own code, and only in the
-- account's first 7 days. The first code wins; nothing is overwritten.

create or replace function public.ayna_referral_from_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := lower(coalesce(new.raw_user_meta_data ->> 'referred_by', ''));
begin
  if v_code !~ '^[a-z0-9]{6,20}$'
     or v_code = public.ayna_referral_code(new.id)
     or new.created_at < now() - interval '7 days' then
    return new;
  end if;
  insert into public.referrals (referred_user_id, referrer_code)
  values (new.id, v_code)
  on conflict (referred_user_id) do nothing;
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

-- Backfill: accounts that have referred_by in their metadata but no row
-- (a browser insert that failed, or sign-ups before the referrals table).
insert into public.referrals (referred_user_id, referrer_code, created_at)
select u.id, lower(u.raw_user_meta_data ->> 'referred_by'), u.created_at
from auth.users u
where lower(coalesce(u.raw_user_meta_data ->> 'referred_by', '')) ~ '^[a-z0-9]{6,20}$'
  and lower(u.raw_user_meta_data ->> 'referred_by') <> public.ayna_referral_code(u.id)
on conflict (referred_user_id) do nothing;

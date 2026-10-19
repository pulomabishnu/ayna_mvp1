-- LOCAL TESTING ONLY. Helpers for _campaign_test.sql and the concurrency test
-- in scripts/test-campaign-sql.sh. Never run against Supabase.

create or replace function public.test_user(p_email text, p_created timestamptz default now() - interval '30 days', p_verified boolean default true)
returns uuid
language sql
as $$
  insert into auth.users (id, email, created_at, email_confirmed_at)
  values (gen_random_uuid(), p_email, p_created, case when p_verified then p_created else null end)
  returning id
$$;

create or replace function public.test_refer(p_referrer uuid, p_friend uuid)
returns void
language sql
as $$
  insert into public.referrals (referred_user_id, referrer_code) values (p_friend, public.ayna_referral_code(p_referrer))
$$;

create or replace function public.test_answer(p_n integer)
returns text
language sql
immutable
as $$
  select case p_n
    when 1 then 'I like that every product shows why it matched me and what the evidence actually says, which makes it way easier to trust the picks.'
    when 2 then 'The quiz felt long on my phone and I was not sure which questions were optional, so I almost stopped halfway through the health part.'
    else 'I would add a way to compare two products side by side with price per month, because I keep opening tabs to figure out which is cheaper.'
  end
$$;

create or replace function public.test_feedback(p_campaign text, p_user uuid)
returns void
language plpgsql
as $$
begin
  perform public.campaign_save_feedback(p_campaign, p_user, 'like', 'q1', public.test_answer(1), true);
  perform public.campaign_save_feedback(p_campaign, p_user, 'friction', 'q2', public.test_answer(2), true);
  perform public.campaign_save_feedback(p_campaign, p_user, 'change', 'q3', public.test_answer(3), true);
end
$$;

-- Verified referrer with 3 feedback answers and 3 verified new friends.
create or replace function public.test_make_eligible(p_campaign text, p_email text)
returns uuid
language plpgsql
as $$
declare
  u uuid := public.test_user(p_email);
  i integer;
  f uuid;
begin
  perform public.test_feedback(p_campaign, u);
  for i in 1..3 loop
    f := public.test_user('friend' || i || '.' || p_email, now() - interval '1 hour');
    perform public.test_refer(u, f);
  end loop;
  return u;
end
$$;

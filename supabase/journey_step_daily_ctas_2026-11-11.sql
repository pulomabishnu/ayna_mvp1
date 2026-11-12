-- Journey step counter, version 2: adds the landing page buttons (cta_*).
-- Replaces supabase/journey_step_daily_2026-11-11.sql: run THIS file only.
-- It works whether or not the first file was already run, and it is safe to
-- re-run. Do not run the first file after this one (it would put back the
-- shorter list and the button counts would be ignored).
-- NOT applied automatically; a founder runs it once in the Supabase SQL editor.
--
-- What is stored: day (UTC), step, platform, count. Nothing about the person:
-- no IP address, user agent, cookie, account or analytics id. Visitors who
-- chose Keep off, opted out in their account or app, or send Global Privacy
-- Control are never counted, and neither are founder browsers or test phones.
-- Existing rows are kept.
--
-- Steps:
--   landed                   first page load of a visit (website) / app opened from closed (app)
--   sign_up_free_clicked     "Sign up free" in the landing page body (all five places together) or in the app
--   quiz_started             first quiz question on screen
--   quiz_completed           quiz finished
--   health_connected         a health app or wearable connected
--   account_created          a new ayna account
-- Landing page buttons (website, counted only while the landing page is open):
--   Top bar
--   cta_signup_topbar        "Sign up free" in the top bar
--   cta_login_topbar         "Log in"
--   cta_pricing_topbar       "Pricing" (menu link on computers, header link on phones)
--   cta_shop_topbar          "Shop"
--   cta_library_topbar       "Library"
--   cta_community_topbar     "Community"
--   cta_ask_topbar           "Ask ayna"
--   cta_cart_topbar          the cart (saved products)
--   The main "Sign up free" button, by place on the page
--   cta_signup_hero          the slider at the top
--   cta_signup_problem       under "the problem" section
--   cta_signup_demo          beside the iPhone walkthrough
--   cta_signup_testimonials  under the tester quotes
--   cta_signup_end           the slider at the bottom of the page
--   The main button when it says something else
--   cta_finish_quiz          "Finish your free quiz" (a quiz already started), any place
--   cta_start_over           "Start over" under it
--   cta_go_home              "Go to your Home" (signed in with a profile), any place
--   Everything else
--   cta_search               the search box at the top
--   cta_brands               "Brands we work with"
--   cta_how_we_match         "How we match" by the walkthrough
--   cta_see_all_products     "See all products" by the picks
--   cta_product_card         a product card in the picks
--   cta_sources              "Read our sources"
--   cta_library              "Open the Library"
--   cta_read_article         one of the quick reads
--   cta_community            "Read reviews and questions"
--   cta_meet_us              "Meet us" (founders)
--   cta_get_pro              "Get ayna Pro"
--   cta_pro_yearly           the Yearly price box
--   cta_pro_monthly          the Monthly price box
--   cta_see_pro              "See what Pro includes"
--   cta_faq_ask_us           "Ask us" under the FAQ
-- Platforms: web, ios_app, android_app.
--
-- Reading the numbers (SQL editor / service role only):
--   select day, step, platform, count from public.journey_step_daily
--   where step like 'cta_%' order by day desc, count desc;

create table if not exists public.journey_step_daily (
  day date not null default ((now() at time zone 'utc')::date),
  step text not null,
  platform text not null check (platform in ('web', 'ios_app', 'android_app')),
  count integer not null default 0 check (count >= 0),
  primary key (day, step, platform)
);

-- The allowed steps (replaces the first file's shorter list).
alter table public.journey_step_daily drop constraint if exists journey_step_daily_step_check;
alter table public.journey_step_daily add constraint journey_step_daily_step_check
  check (step in ('landed', 'sign_up_free_clicked', 'quiz_started', 'quiz_completed', 'health_connected', 'account_created', 'cta_signup_topbar', 'cta_login_topbar', 'cta_pricing_topbar', 'cta_shop_topbar', 'cta_library_topbar', 'cta_community_topbar', 'cta_ask_topbar', 'cta_cart_topbar', 'cta_signup_hero', 'cta_signup_problem', 'cta_signup_demo', 'cta_signup_testimonials', 'cta_signup_end', 'cta_finish_quiz', 'cta_start_over', 'cta_go_home', 'cta_search', 'cta_brands', 'cta_how_we_match', 'cta_see_all_products', 'cta_product_card', 'cta_sources', 'cta_library', 'cta_read_article', 'cta_community', 'cta_meet_us', 'cta_get_pro', 'cta_pro_yearly', 'cta_pro_monthly', 'cta_see_pro', 'cta_faq_ask_us'));

alter table public.journey_step_daily enable row level security;
-- No policies: only the service role (api/step.js) reads or writes.
revoke all on public.journey_step_daily from anon, authenticated;
grant all on public.journey_step_daily to service_role;

-- +1 for today. Unknown steps or platforms are ignored, so made-up values add no rows.
create or replace function public.record_journey_step(p_step text, p_platform text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.journey_step_daily (day, step, platform, count)
  select (now() at time zone 'utc')::date, p_step, p_platform, 1
  where p_step in ('landed', 'sign_up_free_clicked', 'quiz_started', 'quiz_completed', 'health_connected', 'account_created', 'cta_signup_topbar', 'cta_login_topbar', 'cta_pricing_topbar', 'cta_shop_topbar', 'cta_library_topbar', 'cta_community_topbar', 'cta_ask_topbar', 'cta_cart_topbar', 'cta_signup_hero', 'cta_signup_problem', 'cta_signup_demo', 'cta_signup_testimonials', 'cta_signup_end', 'cta_finish_quiz', 'cta_start_over', 'cta_go_home', 'cta_search', 'cta_brands', 'cta_how_we_match', 'cta_see_all_products', 'cta_product_card', 'cta_sources', 'cta_library', 'cta_read_article', 'cta_community', 'cta_meet_us', 'cta_get_pro', 'cta_pro_yearly', 'cta_pro_monthly', 'cta_see_pro', 'cta_faq_ask_us')
    and p_platform in ('web', 'ios_app', 'android_app')
  on conflict (day, step, platform) do update set count = public.journey_step_daily.count + 1
$$;

revoke all on function public.record_journey_step(text, text) from public, anon, authenticated;
grant execute on function public.record_journey_step(text, text) to service_role;

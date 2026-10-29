-- Clinician review queue for products (matching P0, Oct 29 2026).
--
-- A product with an open review shows "Match being reviewed" (no percent) on
-- every surface until a reviewer closes it (src/matching/gate.js, state
-- 'in_review'). The engine reads review status from the product passport
-- today; this table is where the team works the queue and where the passport
-- status will be synced from.
--
-- No user data and no health data: one row per product (and reason). Who
-- triggered a hold is never stored here; demand is counted in PostHog by
-- product id only (product_review_required).
--
-- Idempotent. Not applied automatically: run once in the Supabase SQL editor.

create table if not exists public.product_review_queue (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  status text not null default 'needs_clinician_review'
    check (status in ('needs_research', 'researching', 'needs_clinician_review', 'assigned', 'in_review', 'approved', 'rejected', 'needs_correction', 'expired')),
  reason text not null default 'passport_qa'
    check (reason in ('passport_qa', 'missing_safety_fact', 'interaction_unreviewed', 'allergen_unknown', 'stage_scope', 'user_added_product', 'recheck_due', 'other')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  -- How many times a hold on this product was shown since it opened (no user ids).
  holds_shown integer not null default 0 check (holds_shown >= 0),
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  outcome text check (outcome in ('verified', 'verified_unknown', 'caution_added', 'stage_scoped', 'excluded', 'corrected')),
  reviewer_note text,
  source_urls text[] not null default '{}',
  -- Facts go stale: an approved review is re-opened after this date.
  recheck_after date,
  reopened_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- At most one open row per product and reason.
create unique index if not exists product_review_queue_open_uniq
  on public.product_review_queue (product_id, reason)
  where status not in ('approved', 'rejected', 'expired');
create index if not exists product_review_queue_status_idx on public.product_review_queue (status, priority, created_at);

create or replace function public.product_review_queue_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  if new.status = 'assigned' and old.status is distinct from 'assigned' and new.assigned_at is null then new.assigned_at := now(); end if;
  if new.status = 'in_review' and new.started_at is null then new.started_at := now(); end if;
  if new.status in ('approved', 'rejected') and new.completed_at is null then new.completed_at := now(); end if;
  return new;
end $$;
drop trigger if exists product_review_queue_touch on public.product_review_queue;
create trigger product_review_queue_touch before update on public.product_review_queue
  for each row execute function public.product_review_queue_touch();

-- Staff only. The app never reads or writes this table with a user's key.
alter table public.product_review_queue enable row level security;
drop policy if exists product_review_queue_no_public on public.product_review_queue;
create policy product_review_queue_no_public on public.product_review_queue for all to anon, authenticated using (false) with check (false);

-- Seed: the 38 products whose passport review says needs_clinician_review (Oct 29).
insert into public.product_review_queue (product_id, status, reason, priority) values
  ('p-nature-made-iron-65mg', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-natures-bounty-d3-125mcg', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-d-mannose-now', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-cystex', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-inositol-wholesome', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-remifemin', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('d-nurx-bc', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('d-wisp-bc', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('d-midi-health', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-vitex', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-b-complex', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-cranberry-supplement', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-flo-gummies', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-intimate-rose', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('d-natural-cycles', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('d-initio', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-rituals-prenatal', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-mystery-vibe', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-gennev-care', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-womaness-me', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-winx-uti-test-treat', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-winx-vaginal-health-test-treat', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-winx-uti-pain-relief', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-winx-vaginal-probiotic', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-winx-uti-daily-defense', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-neycher-vaginal-moisturizer', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-neycher-odor-be-gone', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-neycher-hydrobloom-gel', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-good-kitty-uti-biome-shield', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-oboo-mood-drops', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-proov-empower', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-proov-balance-bundle', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-proov-path-to-pregnancy', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-buni-rejuvenate-vulva-balm', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-buni-transform-scar-body-oil', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-buni-bundle', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-livlabs-pippa-starter-kit', 'needs_clinician_review', 'passport_qa', 'normal'),
  ('p-livlabs-pippa-fit-kit', 'needs_clinician_review', 'passport_qa', 'normal')
on conflict do nothing;

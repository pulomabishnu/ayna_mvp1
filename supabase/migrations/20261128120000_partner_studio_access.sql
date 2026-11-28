-- Partner Studio: brand logins and brand responses.
--
-- NOT applied automatically and NOT run yet: needs founder approval, then run
-- once in the Supabase SQL editor. Idempotent: safe to re-run.
--
-- Nothing here is readable from the browser. Row level security is on with no
-- policies, so only the server (service role) can read or write, and the API
-- routes decide who may see what:
--   api/partner-studio.js      brand members see only their own brand
--   api/partner-submissions.js brand members send responses for their brand;
--                              the ayna team reads them
-- Both routes stay admin-only until PARTNER_STUDIO_BRAND_ACCESS=1 and
-- PARTNER_STUDIO_SUBMISSIONS=1 are set on the deploy.

-- Who may open which brand. One row per person per brand. Email is matched
-- against a CONFIRMED Supabase account email, lowercased.
create table if not exists public.partner_brand_members (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  brand text not null,
  role text not null default 'member',
  invited_by text,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);
alter table public.partner_brand_members drop constraint if exists partner_brand_members_role;
alter table public.partner_brand_members add constraint partner_brand_members_role check (role in ('owner', 'member'));
alter table public.partner_brand_members drop constraint if exists partner_brand_members_email_lower;
alter table public.partner_brand_members add constraint partner_brand_members_email_lower check (email = lower(email) and char_length(email) <= 254);
create unique index if not exists partner_brand_members_email_brand on public.partner_brand_members (email, brand) where revoked_at is null;
alter table public.partner_brand_members enable row level security;

-- Responses a brand sends on an action: a note, links and files.
create table if not exists public.partner_submissions (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  action_id text not null,
  action_title text,
  author_user_id uuid not null,
  author_email text not null,
  body text,
  links text[] not null default '{}',
  files jsonb not null default '[]'::jsonb,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);
alter table public.partner_submissions drop constraint if exists partner_submissions_status;
alter table public.partner_submissions add constraint partner_submissions_status check (status in ('new', 'in_review', 'done'));
alter table public.partner_submissions drop constraint if exists partner_submissions_sizes;
alter table public.partner_submissions add constraint partner_submissions_sizes
  check ((body is null or char_length(body) <= 5000) and cardinality(links) <= 20 and jsonb_array_length(files) <= 8);
create index if not exists partner_submissions_brand_created on public.partner_submissions (brand, created_at desc);
alter table public.partner_submissions enable row level security;

-- Private file storage for attachments. The server uploads with the service
-- role and hands out short-lived signed links; no public URLs.
insert into storage.buckets (id, name, public, file_size_limit)
values ('partner-submissions', 'partner-submissions', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

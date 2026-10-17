-- Log of notification emails sent, so the same update is never emailed twice.
-- Written only by the server (service role); clients can't read or write it.
-- Idempotent and additive.
create table if not exists public.email_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,          -- 'community' | 'announcement'
  ref text not null,           -- notification id, announcement id, or week key
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, ref)
);
create index if not exists email_sends_sent_idx on public.email_sends (sent_at desc);
alter table public.email_sends enable row level security;
revoke all on public.email_sends from anon, authenticated;

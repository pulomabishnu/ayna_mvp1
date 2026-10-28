-- Today reminders (Phase 1, step 7): "Remind me tonight" and the follow-up
-- push on the day a try is due. Written by api/today-reminders.js after the
-- caller's Supabase JWT is verified; sent by the same endpoint's cron sweep
-- through api/_apns.js.
--
-- Privacy: a row holds only WHEN to nudge and which kind of nudge. No
-- symptom, product, try or need is stored here, and the push itself always
-- reads "Your ayna check-in is ready" (no health words on the lock screen).
--
-- Idempotent: safe to run more than once. Nothing is dropped.

create table if not exists public.today_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('tonight', 'follow_up')),
  send_at timestamptz not null,
  -- Her IANA time zone, for quiet hours and the one-per-day cap.
  tz text not null default 'America/New_York',
  status text not null default 'scheduled' check (status in ('scheduled', 'sent', 'skipped', 'cancelled')),
  sent_at timestamptz,
  skip_reason text,
  created_at timestamptz not null default now()
);

create index if not exists today_reminders_due_idx
on public.today_reminders (status, send_at);

create index if not exists today_reminders_user_idx
on public.today_reminders (user_id, created_at desc);

alter table public.today_reminders enable row level security;

grant select, insert, update, delete on public.today_reminders to authenticated;
grant all on public.today_reminders to service_role;

-- Owner-only. The cron sweep uses the service role.
drop policy if exists "today_reminders_select_own" on public.today_reminders;
create policy "today_reminders_select_own"
on public.today_reminders for select to authenticated
using (auth.uid() = user_id);

drop policy if exists "today_reminders_insert_own" on public.today_reminders;
create policy "today_reminders_insert_own"
on public.today_reminders for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "today_reminders_update_own" on public.today_reminders;
create policy "today_reminders_update_own"
on public.today_reminders for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "today_reminders_delete_own" on public.today_reminders;
create policy "today_reminders_delete_own"
on public.today_reminders for delete to authenticated
using (auth.uid() = user_id);

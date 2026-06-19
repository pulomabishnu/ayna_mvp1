create table if not exists public.sms_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  message_body text not null,
  created_at timestamptz not null default now()
);

create index if not exists sms_conversations_user_id_created_at_idx
on public.sms_conversations (user_id, created_at desc);

alter table public.sms_conversations enable row level security;

create policy "sms_conversations_select_own"
on public.sms_conversations for select
to authenticated using (auth.uid() = user_id);

-- Note: the webhook writes to this table using the Supabase service role key
-- server-side, since Twilio's request has no Supabase session.

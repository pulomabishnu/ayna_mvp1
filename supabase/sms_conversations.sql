-- Inbound/outbound SMS transcript.
--
-- NOTE ON SENSITIVITY: message_body holds the full plaintext of every health
-- question a user texts and every answer Ayna sends. The file header in
-- api/sms-webhook.js says "never the phone number itself", which is true of the
-- columns — but the message bodies are the more sensitive data, and SMS is
-- unencrypted in transit by design. Retention is bounded below.
create table if not exists public.sms_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  message_body text not null,
  -- Twilio's message SID, when available. UNIQUE so a replayed webhook is a
  -- no-op insert rather than a duplicate row: Twilio signatures carry no nonce
  -- and no timestamp, so one captured (url, params, signature) triple stays
  -- valid forever and can be resent.
  message_sid text,
  created_at timestamptz not null default now()
);

alter table public.sms_conversations
  add column if not exists message_sid text;

create index if not exists sms_conversations_user_id_created_at_idx
on public.sms_conversations (user_id, created_at desc);

create index if not exists sms_conversations_created_at_idx
on public.sms_conversations (created_at);

create unique index if not exists sms_conversations_message_sid_key
on public.sms_conversations (message_sid)
where message_sid is not null;

alter table public.sms_conversations enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select, delete on public.sms_conversations to authenticated;
grant all on public.sms_conversations to service_role;

drop policy if exists "sms_conversations_select_own" on public.sms_conversations;
create policy "sms_conversations_select_own"
on public.sms_conversations for select
to authenticated using (auth.uid() = user_id);

-- The webhook writes with the service-role key (Twilio's request carries no
-- Supabase session), and the service role bypasses RLS — so no INSERT policy is
-- needed for it. Relying on the implicit bypass is fragile though: swapping in a
-- user-scoped client would make every write fail SILENTLY and the whole
-- conversation log would go dark with no error.
drop policy if exists "sms_conversations_delete_own" on public.sms_conversations;
create policy "sms_conversations_delete_own"
on public.sms_conversations for delete
to authenticated using (auth.uid() = user_id);

-- ── Retention ────────────────────────────────────────────────────────────────
-- There was no retention policy at all: plaintext health Q&A accumulated
-- indefinitely. Only the last 10 messages are ever read back (see
-- api/sms-webhook.js), so a long tail has no product value and is pure risk.
-- Schedule via pg_cron:
--   select cron.schedule('purge-sms', '0 3 * * *',
--     $$select public.purge_old_sms_conversations(180)$$);
create or replace function public.purge_old_sms_conversations(p_retain_days integer default 180)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  n integer;
begin
  delete from public.sms_conversations
  where created_at < now() - make_interval(days => greatest(p_retain_days, 1));
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.purge_old_sms_conversations(integer) from public, anon, authenticated;
grant execute on function public.purge_old_sms_conversations(integer) to service_role;

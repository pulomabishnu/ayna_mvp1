-- Contact form messages (2026-10-21).
--
-- api/contact.js used to only email each message to the founders. It now also
-- stores a copy here so the "ayna submissions tracker" Google Sheet can list
-- them (through api/admin-export.js, service role only).
--
-- Server only: RLS is on and there are NO policies for anon/authenticated, and
-- those roles have no grants, so no browser or app session can read, write,
-- update or delete a row. Only the service role (the server) touches it.
--
-- Holds what the sender typed (name, email, reason, subject, message). No IP,
-- no account id, no user agent.
--
-- Idempotent and additive: safe to run more than once. Never deletes data.
-- Run it in the Supabase SQL editor. Until it runs, the contact form still
-- emails every message; only the stored copy (and the sheet's Contact tab) is
-- missing.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 200),
  reason text not null check (char_length(reason) between 1 and 80),
  subject text not null check (char_length(subject) between 1 and 160),
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at);

alter table public.contact_messages enable row level security;

revoke all on public.contact_messages from public, anon, authenticated;
grant all on public.contact_messages to service_role;

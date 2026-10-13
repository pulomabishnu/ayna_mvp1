-- Community: ayna team, verified badges, Announcements, and a server-side
-- backstop for the community rules.
--
-- NOT RUN AUTOMATICALLY. Review, then run once in the
-- Supabase SQL editor. Idempotent: safe to run again.
--
-- What it adds
--   1. community_team_members: the ayna team by sign-in email + public title.
--      Emails are never readable by clients; community_team_badges() exposes
--      only (user_id, title) so the app can show "CEO, ayna" next to names.
--   2. community_announcements (+ reactions, replies). Everyone can read.
--      Only team members (matched by their confirmed auth email) can post.
--   3. community_text_breaks_rules(): a small backstop for the client filter
--      (src/utils/communityRules.js). Posts are inserted straight through
--      PostgREST, so this trigger is the only server-side check. It covers the
--      unambiguous cases only (emails, phone numbers, "DM me", "link in bio",
--      "kill yourself"); the client filter stays the main line.

-- ── 1. Team ────────────────────────────────────────────────────────────────

create table if not exists public.community_team_members (
  email text primary key check (email = lower(email)),
  first_name text not null,
  title text not null check (char_length(title) between 1 and 40)
);

alter table public.community_team_members enable row level security;
-- No policies: clients can't read or write this table directly.
revoke all on public.community_team_members from anon, authenticated;

insert into public.community_team_members (email, first_name, title) values
  ('puloma@aynahealth.co', 'Puloma', 'CEO, ayna'),
  ('ameera@aynahealth.co', 'Ameera', 'CMO, ayna'),
  ('eliz@aynahealth.co', 'Eliz', 'COO, ayna')
on conflict (email) do update set first_name = excluded.first_name, title = excluded.title;

create or replace function public.community_is_team_member(uid uuid)
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from auth.users u
    join public.community_team_members t on t.email = lower(u.email)
    where u.id = uid and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.community_is_team_member(uuid) from public;
grant execute on function public.community_is_team_member(uuid) to anon, authenticated;

-- Verified badges: team user ids and titles only (no emails).
create or replace function public.community_team_badges()
returns table (user_id uuid, title text)
language sql stable security definer
set search_path = public, auth
as $$
  select u.id, t.title
  from auth.users u
  join public.community_team_members t on t.email = lower(u.email)
  where u.email_confirmed_at is not null;
$$;
revoke all on function public.community_team_badges() from public;
grant execute on function public.community_team_badges() to anon, authenticated;

-- ── 2. Rules backstop ──────────────────────────────────────────────────────

create or replace function public.community_text_breaks_rules(t text)
returns boolean
language sql immutable
as $$
  select coalesce(t, '') ~* '[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)+'
      or coalesce(t, '') ~ '(^|[^0-9+])\(?[0-9]{3}\)?[ .-]?[0-9]{3}[ .-]?[0-9]{4}([^0-9]|$)'
      or coalesce(t, '') ~* '\m(dm me|link in bio|kill yourself|kys)\M';
$$;

create or replace function public.community_enforce_rules()
returns trigger
language plpgsql
as $$
declare
  col text;
  val text;
begin
  foreach col in array tg_argv loop
    val := to_jsonb(new) ->> col;
    if public.community_text_breaks_rules(val) then
      raise exception 'community_rules_violation' using errcode = 'check_violation';
    end if;
  end loop;
  return new;
end;
$$;

-- Attach to the existing community tables when they exist.
do $$
declare
  spec record;
begin
  for spec in
    select * from (values
      ('community_posts', 'body', 'body'),
      ('community_comments', 'body', 'body'),
      ('community_playlists', 'title, description', 'title,description'),
      ('community_profiles', 'bio', 'bio')
    ) as s(tbl, cols, args)
  loop
    if to_regclass('public.' || spec.tbl) is not null then
      execute format('drop trigger if exists %I on public.%I', spec.tbl || '_rules', spec.tbl);
      execute format(
        'create trigger %I before insert or update of %s on public.%I for each row execute function public.community_enforce_rules(%s)',
        spec.tbl || '_rules', spec.cols, spec.tbl,
        (select string_agg(quote_literal(a), ', ') from unnest(string_to_array(spec.args, ',')) a)
      );
    end if;
  end loop;
end $$;

-- ── 3. Announcements ───────────────────────────────────────────────────────

create table if not exists public.community_announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text check (body is null or char_length(body) <= 4000),
  -- [{ "path": "posts/<uuid>.jpg", "width": 1200, "height": 900 }], max 4
  media jsonb not null default '[]'::jsonb check (jsonb_typeof(media) = 'array' and jsonb_array_length(media) <= 4),
  -- [{ "type": "playlist" | "product" | "read" | "link", "id"?, "title", "url"?, "date"? }], max 8
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array' and jsonb_array_length(attachments) <= 8),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_announcements_created_idx on public.community_announcements (created_at desc);

alter table public.community_announcements enable row level security;

drop policy if exists community_announcements_read on public.community_announcements;
create policy community_announcements_read on public.community_announcements
  for select using (true);

drop policy if exists community_announcements_team_insert on public.community_announcements;
create policy community_announcements_team_insert on public.community_announcements
  for insert to authenticated
  with check (author_id = auth.uid() and public.community_is_team_member(auth.uid()));

drop policy if exists community_announcements_team_update on public.community_announcements;
create policy community_announcements_team_update on public.community_announcements
  for update to authenticated
  using (public.community_is_team_member(auth.uid()))
  with check (public.community_is_team_member(auth.uid()));

drop policy if exists community_announcements_team_delete on public.community_announcements;
create policy community_announcements_team_delete on public.community_announcements
  for delete to authenticated
  using (public.community_is_team_member(auth.uid()));

grant select on public.community_announcements to anon, authenticated;
grant insert, update, delete on public.community_announcements to authenticated;

drop trigger if exists community_announcements_rules on public.community_announcements;
create trigger community_announcements_rules
  before insert or update of title, body on public.community_announcements
  for each row execute function public.community_enforce_rules('title', 'body');

-- Reactions (one heart per person per announcement)
create table if not exists public.community_announcement_reactions (
  announcement_id uuid not null references public.community_announcements (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (announcement_id, user_id)
);
alter table public.community_announcement_reactions enable row level security;

drop policy if exists community_announcement_reactions_read on public.community_announcement_reactions;
create policy community_announcement_reactions_read on public.community_announcement_reactions
  for select using (true);
drop policy if exists community_announcement_reactions_own on public.community_announcement_reactions;
create policy community_announcement_reactions_own on public.community_announcement_reactions
  for insert to authenticated with check (user_id = auth.uid());
drop policy if exists community_announcement_reactions_delete_own on public.community_announcement_reactions;
create policy community_announcement_reactions_delete_own on public.community_announcement_reactions
  for delete to authenticated using (user_id = auth.uid());

grant select on public.community_announcement_reactions to anon, authenticated;
grant insert, delete on public.community_announcement_reactions to authenticated;

-- Replies (signed-in members; anyone can read)
create table if not exists public.community_announcement_replies (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references public.community_announcements (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists community_announcement_replies_idx on public.community_announcement_replies (announcement_id, created_at);
alter table public.community_announcement_replies enable row level security;

drop policy if exists community_announcement_replies_read on public.community_announcement_replies;
create policy community_announcement_replies_read on public.community_announcement_replies
  for select using (true);
drop policy if exists community_announcement_replies_insert on public.community_announcement_replies;
create policy community_announcement_replies_insert on public.community_announcement_replies
  for insert to authenticated with check (author_id = auth.uid());
drop policy if exists community_announcement_replies_delete on public.community_announcement_replies;
create policy community_announcement_replies_delete on public.community_announcement_replies
  for delete to authenticated
  using (author_id = auth.uid() or public.community_is_team_member(auth.uid()));

grant select on public.community_announcement_replies to anon, authenticated;
grant insert, delete on public.community_announcement_replies to authenticated;

drop trigger if exists community_announcement_replies_rules on public.community_announcement_replies;
create trigger community_announcement_replies_rules
  before insert or update of body on public.community_announcement_replies
  for each row execute function public.community_enforce_rules('body');

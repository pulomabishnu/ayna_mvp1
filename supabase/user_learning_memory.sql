-- Cross-session learning signals fed back into the recommendation prompt
-- (interactionCount, lastConcerns, shownProductIds, ...). One row per user.
-- Read/written by src/utils/learningMemoryStore.js under the user's own session.
create table if not exists public.user_learning_memory (
  user_id uuid primary key references auth.users(id) on delete cascade,
  memory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_learning_memory enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select, insert, update, delete on public.user_learning_memory to authenticated;
grant all on public.user_learning_memory to service_role;

drop policy if exists "user_learning_memory_select_own" on public.user_learning_memory;
create policy "user_learning_memory_select_own"
on public.user_learning_memory for select
to authenticated using (auth.uid() = user_id);

drop policy if exists "user_learning_memory_insert_own" on public.user_learning_memory;
create policy "user_learning_memory_insert_own"
on public.user_learning_memory for insert
to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_learning_memory_update_own" on public.user_learning_memory;
create policy "user_learning_memory_update_own"
on public.user_learning_memory for update
to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_learning_memory_delete_own" on public.user_learning_memory;
create policy "user_learning_memory_delete_own"
on public.user_learning_memory for delete
to authenticated using (auth.uid() = user_id);

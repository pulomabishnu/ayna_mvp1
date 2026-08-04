-- Per-user product ratings and written reviews.
-- Mirrors the localStorage shape: { [productId]: { ratings: number[], reviews: [] } }
-- Read/written by src/utils/reviewsStore.js under the user's own session.
create table if not exists public.user_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  ratings jsonb not null default '[]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Matches upsert(..., { onConflict: 'user_id,product_id' }) in
  -- reviewsStore.upsertProductReviews.
  primary key (user_id, product_id)
);

alter table public.user_reviews enable row level security;

-- GRANTs are separate from RLS: RLS decides WHICH rows a role may see, GRANT
-- decides whether it may touch the table at all. Explicit here so the schema
-- does not depend on a project's default-privilege configuration.
grant select, insert, update, delete on public.user_reviews to authenticated;
grant all on public.user_reviews to service_role;

drop policy if exists "user_reviews_select_own" on public.user_reviews;
create policy "user_reviews_select_own"
on public.user_reviews for select
to authenticated using (auth.uid() = user_id);

drop policy if exists "user_reviews_insert_own" on public.user_reviews;
create policy "user_reviews_insert_own"
on public.user_reviews for insert
to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_reviews_update_own" on public.user_reviews;
create policy "user_reviews_update_own"
on public.user_reviews for update
to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_reviews_delete_own" on public.user_reviews;
create policy "user_reviews_delete_own"
on public.user_reviews for delete
to authenticated using (auth.uid() = user_id);

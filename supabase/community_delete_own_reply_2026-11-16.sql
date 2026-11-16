-- Let a member delete her own Community reply (Puloma, Nov 16). Safe to run more than once; drops no data.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'community_comments' and policyname = 'community_comments_delete_own') then
    create policy community_comments_delete_own on public.community_comments
      for delete to authenticated using (author_id = auth.uid());
  end if;
end $$;

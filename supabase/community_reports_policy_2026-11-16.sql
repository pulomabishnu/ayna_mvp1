-- Reports could not be saved: community_reports has row-level security on and no policy (found Nov 16).
-- Apple 1.2 requires that members can report content. Safe to run more than once; drops nothing.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'community_reports' and policyname = 'community_reports_insert_own') then
    create policy community_reports_insert_own on public.community_reports
      for insert to authenticated with check (reporter_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'community_reports' and policyname = 'community_reports_select_own') then
    create policy community_reports_select_own on public.community_reports
      for select to authenticated using (reporter_id = auth.uid());
  end if;
end $$;
select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'community_reports';

-- Applied to production on 2026-09-12 as migration:
-- restrict_rls_auto_enable_execution
--
-- rls_auto_enable() is an internal SECURITY DEFINER event-trigger helper.
-- Browser-facing database roles do not need permission to invoke it directly.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

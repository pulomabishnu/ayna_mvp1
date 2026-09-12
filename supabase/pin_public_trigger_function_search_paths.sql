-- Applied to production on 2026-09-12 as migration:
-- pin_public_trigger_function_search_paths
--
-- Pin trigger-function name resolution so caller-controlled search paths
-- cannot affect these helpers. public remains available for the one helper
-- that updates public.notification_preferences.
alter function public.set_updated_at() set search_path = pg_catalog, public;
alter function public.touch_early_stage_startups_updated_at() set search_path = pg_catalog, public;
alter function public.touch_updated_at() set search_path = pg_catalog, public;
alter function public.fallback_delivery_channel_on_unverify() set search_path = pg_catalog, public;
alter function public.touch_product_catalog_updated_at() set search_path = pg_catalog, public;

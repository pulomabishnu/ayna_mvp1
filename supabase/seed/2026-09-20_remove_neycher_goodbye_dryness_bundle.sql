-- Removes the Neycher "Goodbye, Dryness" Bundle from the live catalog: Neycher no longer sells it.
-- Deactivates rather than deletes, so it can be brought back with is_active = true if ever needed.
-- Idempotent: safe to re-run. Run once in the Supabase SQL editor.

update public.product_catalog
set is_active = false
where id = 'p-neycher-goodbye-dryness-bundle';

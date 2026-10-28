-- Anonymous "Suggest an app or wearable" requests (founder Oct 27), stored in
-- public.suggestions with kind = 'integration' and the app name in product_name,
-- so demand can be counted later:
--   select product_name, count(*) from public.suggestions
--   where kind = 'integration' group by 1 order by 2 desc;
-- Idempotent. Not applied automatically: run once in the Supabase SQL editor.
-- Until it runs, requests are still emailed to the founders (the insert fails softly).
do $$
begin
  if to_regclass('public.suggestions') is null then
    raise notice 'suggestions does not exist yet, run migrations/20261013130000_suggestions.sql first';
    return;
  end if;
  alter table public.suggestions drop constraint if exists suggestions_kind_check;
  alter table public.suggestions add constraint suggestions_kind_check
    check (kind in ('product', 'read', 'topic', 'integration'));
  alter table public.suggestions drop constraint if exists suggestions_has_text;
  alter table public.suggestions add constraint suggestions_has_text check (
    (kind in ('product', 'integration') and product_name is not null and char_length(btrim(product_name)) > 0)
    or (kind in ('read', 'topic') and topic is not null and char_length(btrim(topic)) > 0)
  );
end $$;

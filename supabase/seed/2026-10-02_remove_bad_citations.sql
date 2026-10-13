-- Removes citations that point to the wrong paper or to IDs that don't exist
-- (2026-10-02 audit: every PubMed/PMC/DOI link checked against the real title
-- via NCBI E-utilities and Crossref). Idempotent: safe to re-run.

update public.product_catalog
set extra = jsonb_set(extra, '{verificationLinks,scientific,links}', coalesce((
  select jsonb_agg(l) from jsonb_array_elements(extra->'verificationLinks'->'scientific'->'links') l
  where not exists (select 1 from unnest(array['30283038', '22453472', '27000438', '29587888', 's41746-019-0118-z', '23974689', '12605637', '26983764', '25051278', '23612738', '16897664', '32324464', '21803522', '24433504', '16441648', '30283731', '29292764', '19364826', 'PMC4334080', 's41746-021-00398-x', '33911077', 'PMC6682703', '29244728', '26348455', 'PMC5573562', '16517946', '22430687', '28375735', '18498532', '22081622', '31336040', 'PIIS2468-2667(19)30110-3']) b where l->>'url' like '%' || b || '%')
), '[]'::jsonb))
where jsonb_typeof(extra->'verificationLinks'->'scientific'->'links') = 'array'
  and exists (
    select 1 from jsonb_array_elements(extra->'verificationLinks'->'scientific'->'links') l, unnest(array['30283038', '22453472', '27000438', '29587888', 's41746-019-0118-z', '23974689', '12605637', '26983764', '25051278', '23612738', '16897664', '32324464', '21803522', '24433504', '16441648', '30283731', '29292764', '19364826', 'PMC4334080', 's41746-021-00398-x', '33911077', 'PMC6682703', '29244728', '26348455', 'PMC5573562', '16517946', '22430687', '28375735', '18498532', '22081622', '31336040', 'PIIS2468-2667(19)30110-3']) b
    where l->>'url' like '%' || b || '%'
  );

update public.product_catalog
set extra = jsonb_set(extra, '{verificationLinks,doctor,links}', coalesce((
  select jsonb_agg(l) from jsonb_array_elements(extra->'verificationLinks'->'doctor'->'links') l
  where not exists (select 1 from unnest(array['30283038', '22453472', '27000438', '29587888', 's41746-019-0118-z', '23974689', '12605637', '26983764', '25051278', '23612738', '16897664', '32324464', '21803522', '24433504', '16441648', '30283731', '29292764', '19364826', 'PMC4334080', 's41746-021-00398-x', '33911077', 'PMC6682703', '29244728', '26348455', 'PMC5573562', '16517946', '22430687', '28375735', '18498532', '22081622', '31336040', 'PIIS2468-2667(19)30110-3']) b where l->>'url' like '%' || b || '%')
), '[]'::jsonb))
where jsonb_typeof(extra->'verificationLinks'->'doctor'->'links') = 'array'
  and exists (
    select 1 from jsonb_array_elements(extra->'verificationLinks'->'doctor'->'links') l, unnest(array['30283038', '22453472', '27000438', '29587888', 's41746-019-0118-z', '23974689', '12605637', '26983764', '25051278', '23612738', '16897664', '32324464', '21803522', '24433504', '16441648', '30283731', '29292764', '19364826', 'PMC4334080', 's41746-021-00398-x', '33911077', 'PMC6682703', '29244728', '26348455', 'PMC5573562', '16517946', '22430687', '28375735', '18498532', '22081622', '31336040', 'PIIS2468-2667(19)30110-3']) b
    where l->>'url' like '%' || b || '%'
  );

update public.product_catalog
set extra = jsonb_set(extra, '{verificationLinks,community,links}', coalesce((
  select jsonb_agg(l) from jsonb_array_elements(extra->'verificationLinks'->'community'->'links') l
  where not exists (select 1 from unnest(array['30283038', '22453472', '27000438', '29587888', 's41746-019-0118-z', '23974689', '12605637', '26983764', '25051278', '23612738', '16897664', '32324464', '21803522', '24433504', '16441648', '30283731', '29292764', '19364826', 'PMC4334080', 's41746-021-00398-x', '33911077', 'PMC6682703', '29244728', '26348455', 'PMC5573562', '16517946', '22430687', '28375735', '18498532', '22081622', '31336040', 'PIIS2468-2667(19)30110-3']) b where l->>'url' like '%' || b || '%')
), '[]'::jsonb))
where jsonb_typeof(extra->'verificationLinks'->'community'->'links') = 'array'
  and exists (
    select 1 from jsonb_array_elements(extra->'verificationLinks'->'community'->'links') l, unnest(array['30283038', '22453472', '27000438', '29587888', 's41746-019-0118-z', '23974689', '12605637', '26983764', '25051278', '23612738', '16897664', '32324464', '21803522', '24433504', '16441648', '30283731', '29292764', '19364826', 'PMC4334080', 's41746-021-00398-x', '33911077', 'PMC6682703', '29244728', '26348455', 'PMC5573562', '16517946', '22430687', '28375735', '18498532', '22081622', '31336040', 'PIIS2468-2667(19)30110-3']) b
    where l->>'url' like '%' || b || '%'
  );

-- Ovia stored a single (wrong) citation object instead of a list.
update public.product_catalog
set extra = jsonb_set(extra, '{verificationLinks,scientific}', '{"links": []}'::jsonb)
where id = 'd-ovia'
  and extra->'verificationLinks'->'scientific'->>'url' like '%s41746-019-0118-z%';

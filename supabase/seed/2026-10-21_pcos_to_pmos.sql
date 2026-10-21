-- PCOS is now PMOS (Ameera, Oct 20 2026; The Lancet, May 2026).
-- Paste into the Supabase SQL Editor and run once. Safe to re-run.
--
-- Renames the condition in the text people read:
--   product_catalog: name, summary, doctor_opinion, community_review, effectiveness
--   health_knowledge (Ask ayna): topic, summary, content, plus "pmos" search aliases
-- Never touched: ids, slugs, tags, URLs (…/pcos/…, reddit.com/r/PCOS), source
-- titles, and anything people wrote themselves (posts, reviews, saved answers).
-- The website and app also rename PCOS on screen, so this only brings the
-- stored text in line with what people already see.

begin;

create or replace function pg_temp.pmos(t text) returns text language sql immutable as $$
  select case when t is null then null else
    regexp_replace(
      regexp_replace(
        regexp_replace(t, 'Polycystic [Oo]var(y|ian) [Ss]yndrome', 'Polyendocrine metabolic ovarian syndrome', 'g'),
        'polycystic ovar(y|ian) syndrome', 'polyendocrine metabolic ovarian syndrome', 'g'),
      '(^|[^A-Za-z0-9_./#@-])PCOS(?![A-Za-z0-9_$/])', '\1PMOS', 'g')
  end
$$;

update public.product_catalog
set name = pg_temp.pmos(name),
    summary = pg_temp.pmos(summary),
    doctor_opinion = pg_temp.pmos(doctor_opinion),
    community_review = pg_temp.pmos(community_review),
    effectiveness = pg_temp.pmos(effectiveness)
where concat_ws(' ', name, summary, doctor_opinion, community_review, effectiveness) ~* '(PCOS|polycystic ovar(y|ian) syndrome)';

update public.health_knowledge
set topic = pg_temp.pmos(topic),
    summary = pg_temp.pmos(summary),
    content = pg_temp.pmos(content),
    aliases = case when 'pcos' = any(aliases)
      then (select array_agg(distinct a) from unnest(aliases || array['pmos', 'polyendocrine metabolic ovarian syndrome']) as a)
      else aliases end,
    updated_at = now()
where 'pcos' = any(aliases) or concat_ws(' ', topic, summary, content) ~* '(PCOS|polycystic ovar(y|ian) syndrome)';

commit;

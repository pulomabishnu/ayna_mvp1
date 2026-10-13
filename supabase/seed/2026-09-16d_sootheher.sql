-- Adds SootheHer's Elaris Pod and Gel Pad Refills to the live catalog.
-- Extracted from the regenerated supabase/seed/product_catalog.sql (run
-- `npm run catalog:export` after any future src/data/ change to get the
-- full, current file — this is just the 2 new rows from that run, safe to
-- run standalone). Idempotent: safe to re-run.

insert into public.product_catalog (id, name, brand, category, product_type, summary, price, image, url, tags, health_functions, where_to_buy, where_to_buy_in_stock, safety, doctor_opinion, community_review, effectiveness, clinician_opinion_source, clinician_attribution, source, internal, requires_prescription, user_rating, is_active, extra)
values
  ('p-sootheher-elaris-pod', 'SootheHer''s Elaris Pod', 'SootheHer', 'cramp-relief', 'physical', 'A discreet, wearable TENS (transcutaneous electrical nerve stimulation) device for menstrual cramps. A butterfly-shaped gel pad worn on the lower abdomen sends adjustable electrical pulses meant to block pain signals, prompt endorphin release, and relax uterine muscles — worn under clothing, drug-free.', '$89.99 (list $120)', 'https://sootheher.com/assets/elaris-butterfly-hero-DnUO3OIN.webp', 'https://sootheher.com/', '["cramps","discomfort","wearable","drug-free"]'::jsonb, '["cramp-relief"]'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"fdaStatus":"FDA-cleared, per the brand.","materials":"Device, reusable butterfly and circular gel pads, connecting wire, USB-C charging cable, user manual, per the brand.","recalls":"No recalls found.","sideEffects":"Brand states not for use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition — consult a clinician first if any of these apply.","opinionAlerts":"Brand cites a 4.8-star rating across 718 reviews and offers a 30-day money-back guarantee — brand-hosted figures, not independently verified here."}'::jsonb, 'TENS (transcutaneous electrical nerve stimulation) has real supportive evidence for reducing primary dysmenorrhea pain via the gate-control mechanism the brand describes; this does not independently establish that the Elaris Pod specifically matches published TENS study outcomes.', null, 'Positioned by the brand as fast-acting, drug-free cramp relief; no independently conducted clinical study of this specific device was found here. TENS as a pain-relief category has supportive evidence for dysmenorrhea.', 'brand', 'Sourced from SootheHer''s own site marketing claims, not independent clinical literature.', 'curated', false, false, null, true, '{"affiliateUrl":"https://collabs.shop/jfue1u","integrations":[],"badges":[],"isEmergingBrand":true}'::jsonb),
  ('p-sootheher-gel-pad-refills', 'SootheHer Gel Pad Refills', 'SootheHer', 'cramp-relief', 'physical', 'A 4-pack of replacement butterfly gel pads for the Elaris Pod. Each gel pad is rated for roughly 30-40 uses; store on the plastic backing between uses to extend pad life, per the brand.', '$11.99 (list $16, pack of 4)', '', 'https://sootheher.com/', '["cramps","accessory","reusable"]'::jsonb, '["cramp-relief"]'::jsonb, '[]'::jsonb, '{}'::jsonb, '{"fdaStatus":"Accessory to the FDA-cleared Elaris Pod device, per the brand; not separately FDA-cleared.","materials":"Reusable gel pad material, per the brand.","recalls":"No recalls found.","sideEffects":"Same use precautions as the Elaris Pod — brand states not for use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition.","opinionAlerts":"Brand-hosted rating shown at time of listing was based on very few reviews — check current review volume before treating it as representative."}'::jsonb, 'A consumable accessory for the Elaris Pod rather than a standalone treatment; replacing worn gel pads maintains the skin contact needed for the device to deliver its stimulation effectively.', null, 'Maintenance accessory, not a standalone treatment — effectiveness depends on the Elaris Pod device itself.', 'brand', 'Sourced from SootheHer''s own site marketing claims, not independent clinical literature.', 'curated', false, false, null, true, '{"affiliateUrl":"https://collabs.shop/uj8q5x","integrations":[],"badges":[],"isEmergingBrand":true}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  brand = excluded.brand,
  category = excluded.category,
  product_type = excluded.product_type,
  summary = excluded.summary,
  price = excluded.price,
  image = excluded.image,
  url = excluded.url,
  tags = excluded.tags,
  health_functions = excluded.health_functions,
  where_to_buy = excluded.where_to_buy,
  where_to_buy_in_stock = excluded.where_to_buy_in_stock,
  safety = excluded.safety,
  doctor_opinion = excluded.doctor_opinion,
  community_review = excluded.community_review,
  effectiveness = excluded.effectiveness,
  clinician_opinion_source = excluded.clinician_opinion_source,
  clinician_attribution = excluded.clinician_attribution,
  source = excluded.source,
  internal = excluded.internal,
  requires_prescription = excluded.requires_prescription,
  user_rating = excluded.user_rating,
  is_active = excluded.is_active,
  extra = excluded.extra;

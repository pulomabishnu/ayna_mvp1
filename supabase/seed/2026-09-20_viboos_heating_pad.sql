-- Adds the VIBOOS Electric Heating Pad to the live catalog.
-- Extracted from the regenerated supabase/seed/product_catalog.sql (npm run catalog:export).
-- Idempotent: safe to re-run. Run it once in the Supabase SQL editor for the product to appear on the site.

insert into public.product_catalog (id, name, brand, category, product_type, summary, price, image, url, tags, health_functions, where_to_buy, where_to_buy_in_stock, safety, doctor_opinion, community_review, effectiveness, clinician_opinion_source, clinician_attribution, source, internal, requires_prescription, user_rating, is_active, extra)
values
  ('p-viboos-heating-pad', 'VIBOOS Electric Heating Pad', 'VIBOOS', 'cramp-relief', 'physical', 'Plug-in electric heating pad (24" x 12") with 6 heat levels from 104 to 140°F, a 30/60/90/120-minute auto shut-off timer, and a soft flannel cover. Use on the lower abdomen, back, neck, shoulders, knees, or legs.', '$12.99', 'https://m.media-amazon.com/images/I/71c2ID2AkdL._AC_SL1500_.jpg', 'https://www.amazon.com/dp/B0GG6HHCYM', '["cramps","comfort"]'::jsonb, '["cramp-relief"]'::jsonb, '["Amazon"]'::jsonb, '{}'::jsonb, '{"fdaStatus":"FDA clearance is not stated on the Amazon listing.","materials":"Flannel cover; electric heating element. Listing says it is machine washable below 86°F once the cord is disconnected.","recalls":"No recalls found.","allergens":"N/A","sideEffects":"Heat can burn skin, especially with prolonged use. The listing says not to fold it, lie on it, cover it with blankets, use it while sleeping, or use it on children. Ask a clinician first if you are pregnant or have reduced skin sensation or a circulation condition.","opinionAlerts":"Amazon reviewers are mostly positive (4.4 out of 5), but a share report the pad stopping or shutting off early after a few months, and some feel it does not get as hot as advertised."}'::jsonb, 'Heat therapy has evidence for reducing primary dysmenorrhea pain. An electric heating pad is a simple way to apply heat, but this specific pad has not been clinically validated here, and a plug-in pad should not be left on while sleeping.', 'Amazon rates this heating pad 4.4 out of 5 from about 21,900 ratings (74% 5-star, 5% 1-star). Customers say it is soft, heats up fast, and the heat levels and timer are easy to use, and many use it for back pain and cramps. Reviews are mixed on reliability and heat: some say it stopped working or kept shutting off after a few months, and some say the highest settings did not feel much hotter than the lower ones.', 'Delivers heat at six levels between 104 and 140°F with an auto shut-off timer. Not clinically tested as a product; heat therapy in general has supportive evidence for menstrual cramp pain.', 'independent', 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', 'curated', false, false, null, true, '{"ingredients":"Flannel cover, electric heating element, detachable controller.","verificationLinks":{"scientific":{"links":[{"url":"https://pubmed.ncbi.nlm.nih.gov/41657584/","text":"Heat Therapy for Primary Dysmenorrhea: Systematic Review and Meta-Analysis","summary":"A 2026 systematic review supports heat therapy for primary dysmenorrhea. This evidence applies to heat therapy generally and does not validate this heating pad specifically.","justification":"Recent peer-reviewed systematic review and meta-analysis."}]},"community":{"links":[{"url":"https://www.amazon.com/dp/B0GG6HHCYM","text":"Amazon: VIBOOS Electric Heating Pad (4.4/5, about 21,900 ratings)","summary":"Amazon rating 4.4 out of 5 from about 21,900 ratings: 74% 5-star, 12% 4-star, 6% 3-star, 3% 2-star, 5% 1-star. Amazon’s review summary says customers find it effective for pain relief (back pain, cramps) and like the heat settings, timer and soft cover, with mixed reviews on how hot it gets and on reliability. Reviewers say: “Great heating pad, heats fast and is very soft.”, “This was a great product until it wasn’t... After 4 months it just stopped working.”, and “Love it. It definitely does what is described on the page. It gets hot. I like the timer.”"}]}}}'::jsonb)
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

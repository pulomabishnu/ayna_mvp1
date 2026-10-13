-- Adds Love Wellness Intimate Skin Support to the live catalog.
-- Extracted from the regenerated supabase/seed/product_catalog.sql (npm run catalog:export).
-- Idempotent: safe to re-run. Run it once in the Supabase SQL editor for the product to appear on the site.

insert into public.product_catalog (id, name, brand, category, product_type, summary, price, image, url, tags, health_functions, where_to_buy, where_to_buy_in_stock, safety, doctor_opinion, community_review, effectiveness, clinician_opinion_source, clinician_attribution, source, internal, requires_prescription, user_rating, is_active, extra)
values
  ('p-love-wellness-intimate-skin-support', 'Love Wellness Intimate Skin Support', 'Love Wellness', 'intimate-care', 'physical', 'Rinse-free hypochlorous acid spray for the external vulva and perineum. Spray on and let air dry to help remove odor-causing buildup and soothe minor irritation like razor burn. External use only.', '$19.99 for 4 fl oz', 'https://lovewellness.com/cdn/shop/files/01_LW_PDP_ISS_Silo_png2.png?v=1790626501', 'https://lovewellness.com/products/intimate-skin-support', '["comfort","discomfort","vaginal-health","external-only"]'::jsonb, '["vaginal-health"]'::jsonb, '["LoveWellness.com","Ulta"]'::jsonb, '{}'::jsonb, '{"fdaStatus":"FDA-cleared antimicrobial skin cleanser (medical device), per the brand.","materials":"Hypochlorous acid solution in a 4 fl oz pump spray bottle.","recalls":"No recalls found.","allergens":"Fragrance-free, alcohol-free, dye-free, paraben- and phthalate-free, vegan.","sideEffects":"Mild, brief stinging is possible, especially on broken or freshly shaved skin. External use only; never spray inside the vagina.","opinionAlerts":"The brand states it is not a treatment for UTIs, even though the label notes bacteria are the leading cause of UTIs. Some Ulta reviewers find the pump spray awkward to aim."}'::jsonb, 'Hypochlorous acid is a gentle, well-tolerated antimicrobial used in wound and skin care. For routine vulvar hygiene, water alone is usually enough, but a fragrance-free, rinse-free spray can be an option between showers or after shaving. It should stay external and is not a substitute for care if you have UTI symptoms, unusual discharge, or ongoing itching.', 'Ulta rates it 4.3 out of 5 from about 183 reviews. Reviewers like the clean, fresh feeling between showers and relief from itching and razor irritation. Some say they use it hoping to reduce UTIs, which the brand does not claim. The most common complaint is that the spray bottle is hard to aim.', 'Hypochlorous acid has broad antimicrobial and anti-inflammatory activity in dermatology studies. This specific product has not been clinically tested for odor, irritation, or UTI outcomes here.', 'independent', 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', 'curated', false, false, null, true, '{"communityReviewSourceUrl":"https://www.ulta.com/p/p-pimprod2050204","communityReviewSourceLabel":"Ulta reviews","ingredients":"Ionized water (99.918%), sodium chloride, hypochlorous acid, hypochlorite ion.","badges":["FDA-Cleared","Fragrance-Free","Female-Founded"],"verificationLinks":{"doctor":{"links":[{"url":"https://www.acog.org/womens-health/faqs/vulvovaginal-health","text":"ACOG: Vulvovaginal Health","summary":"ACOG recommends gentle vulvar hygiene and avoiding irritating or fragranced products and anything used inside the vagina."}]},"scientific":{"links":[{"url":"https://pmc.ncbi.nlm.nih.gov/articles/PMC6303114/","text":"Status Report on Topical Hypochlorous Acid (J Clin Aesthet Dermatol, 2018)","summary":"Review finding stabilized, pH-neutral hypochlorous acid has broad antimicrobial and anti-inflammatory effects with a strong safety profile across several skin conditions. It does not validate this product specifically.","justification":"Peer-reviewed dermatology review."}]},"community":{"links":[{"url":"https://www.ulta.com/p/p-pimprod2050204","text":"Ulta: Love Wellness Intimate Skin Support (4.3/5, about 183 reviews)","summary":"Reviewers praise the fresh feeling between showers and relief from itching and razor irritation; the main complaint is an awkward spray bottle."}]}}}'::jsonb)
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

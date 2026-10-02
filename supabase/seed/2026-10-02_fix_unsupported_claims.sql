-- Brand claims stated as fact, invented statistics, and invented endorsements,
-- found by the 2026-10-02 audit. Exact-phrase replacements: a phrase that is
-- not present is left alone, and re-running changes nothing further.

-- d-natural-cycles
update public.product_catalog set
  summary = replace(summary, 'The only FDA-cleared birth control app.', 'The first app FDA-cleared as contraception (De Novo, 2018); Clue Birth Control was also cleared in 2021.'),
  doctor_opinion = replace(doctor_opinion, 'The only FDA-cleared birth control app.', 'The first app FDA-cleared as contraception (De Novo, 2018); Clue Birth Control was also cleared in 2021.'),
  effectiveness = replace(effectiveness, 'The only FDA-cleared birth control app.', 'The first app FDA-cleared as contraception (De Novo, 2018); Clue Birth Control was also cleared in 2021.'),
  community_review = replace(community_review, 'The only FDA-cleared birth control app.', 'The first app FDA-cleared as contraception (De Novo, 2018); Clue Birth Control was also cleared in 2021.'),
  extra = replace(extra::text, 'The only FDA-cleared birth control app.', 'The first app FDA-cleared as contraception (De Novo, 2018); Clue Birth Control was also cleared in 2021.')::jsonb
where id in ('d-natural-cycles');

-- d-ppd
update public.product_catalog set
  summary = replace(summary, ' Most trusted name in reproductive health.', ''),
  doctor_opinion = replace(doctor_opinion, ' Most trusted name in reproductive health.', ''),
  effectiveness = replace(effectiveness, ' Most trusted name in reproductive health.', ''),
  community_review = replace(community_review, ' Most trusted name in reproductive health.', ''),
  extra = replace(extra::text, ' Most trusted name in reproductive health.', '')::jsonb
where id in ('d-ppd');

-- p-good-clean-love
update public.product_catalog set
  summary = replace(summary, ' OB-GYN recommended.', ''),
  doctor_opinion = replace(doctor_opinion, ' OB-GYN recommended.', ''),
  effectiveness = replace(effectiveness, ' OB-GYN recommended.', ''),
  community_review = replace(community_review, ' OB-GYN recommended.', ''),
  extra = replace(extra::text, ' OB-GYN recommended.', '')::jsonb
where id in ('p-good-clean-love');

-- p-cranberry-supplement
update public.product_catalog set
  summary = replace(summary, 'is the #1 most-trusted urinary health brand in the US', 'is, in AZO''s own marketing, the "#1 most-trusted urinary health brand" in the US'),
  doctor_opinion = replace(doctor_opinion, 'is the #1 most-trusted urinary health brand in the US', 'is, in AZO''s own marketing, the "#1 most-trusted urinary health brand" in the US'),
  effectiveness = replace(effectiveness, 'is the #1 most-trusted urinary health brand in the US', 'is, in AZO''s own marketing, the "#1 most-trusted urinary health brand" in the US'),
  community_review = replace(community_review, 'is the #1 most-trusted urinary health brand in the US', 'is, in AZO''s own marketing, the "#1 most-trusted urinary health brand" in the US'),
  extra = replace(extra::text, 'is the #1 most-trusted urinary health brand in the US', 'is, in AZO''s own marketing, the \"#1 most-trusted urinary health brand\" in the US')::jsonb
where id in ('p-cranberry-supplement');

-- p-organyc-pad
update public.product_catalog set
  summary = replace(summary, 'is MADE SAFE certified and clinically proven to reduce irritation caused by chemicals and dyes in conventional pads.', 'is MADE SAFE certified; Organyc says it is clinically proven to reduce irritation from chemicals and dyes in conventional pads.'),
  doctor_opinion = replace(doctor_opinion, 'is MADE SAFE certified and clinically proven to reduce irritation caused by chemicals and dyes in conventional pads.', 'is MADE SAFE certified; Organyc says it is clinically proven to reduce irritation from chemicals and dyes in conventional pads.'),
  effectiveness = replace(effectiveness, 'is MADE SAFE certified and clinically proven to reduce irritation caused by chemicals and dyes in conventional pads.', 'is MADE SAFE certified; Organyc says it is clinically proven to reduce irritation from chemicals and dyes in conventional pads.'),
  community_review = replace(community_review, 'is MADE SAFE certified and clinically proven to reduce irritation caused by chemicals and dyes in conventional pads.', 'is MADE SAFE certified; Organyc says it is clinically proven to reduce irritation from chemicals and dyes in conventional pads.'),
  extra = replace(extra::text, 'is MADE SAFE certified and clinically proven to reduce irritation caused by chemicals and dyes in conventional pads.', 'is MADE SAFE certified; Organyc says it is clinically proven to reduce irritation from chemicals and dyes in conventional pads.')::jsonb
where id in ('p-organyc-pad');

-- d-oura
update public.product_catalog set
  summary = replace(summary, 'clinical research shows the Gen 3 achieves 96.4% accuracy in ovulation detection across large datasets', 'Oura''s own validation study (1,155 cycles from Oura members who also used LH tests) reported that the ring detected 96.4% of ovulations'),
  doctor_opinion = replace(doctor_opinion, 'clinical research shows the Gen 3 achieves 96.4% accuracy in ovulation detection across large datasets', 'Oura''s own validation study (1,155 cycles from Oura members who also used LH tests) reported that the ring detected 96.4% of ovulations'),
  effectiveness = replace(effectiveness, 'clinical research shows the Gen 3 achieves 96.4% accuracy in ovulation detection across large datasets', 'Oura''s own validation study (1,155 cycles from Oura members who also used LH tests) reported that the ring detected 96.4% of ovulations'),
  community_review = replace(community_review, 'clinical research shows the Gen 3 achieves 96.4% accuracy in ovulation detection across large datasets', 'Oura''s own validation study (1,155 cycles from Oura members who also used LH tests) reported that the ring detected 96.4% of ovulations'),
  extra = replace(extra::text, 'clinical research shows the Gen 3 achieves 96.4% accuracy in ovulation detection across large datasets', 'Oura''s own validation study (1,155 cycles from Oura members who also used LH tests) reported that the ring detected 96.4% of ovulations')::jsonb
where id in ('d-oura');

-- d-oura
update public.product_catalog set
  summary = replace(summary, 'Clinical research on the Oura Ring Gen 3 specifically shows strong performance for ovulation detection (96.4% accuracy)', 'Oura''s own validation study reported that the ring detected 96.4% of ovulations'),
  doctor_opinion = replace(doctor_opinion, 'Clinical research on the Oura Ring Gen 3 specifically shows strong performance for ovulation detection (96.4% accuracy)', 'Oura''s own validation study reported that the ring detected 96.4% of ovulations'),
  effectiveness = replace(effectiveness, 'Clinical research on the Oura Ring Gen 3 specifically shows strong performance for ovulation detection (96.4% accuracy)', 'Oura''s own validation study reported that the ring detected 96.4% of ovulations'),
  community_review = replace(community_review, 'Clinical research on the Oura Ring Gen 3 specifically shows strong performance for ovulation detection (96.4% accuracy)', 'Oura''s own validation study reported that the ring detected 96.4% of ovulations'),
  extra = replace(extra::text, 'Clinical research on the Oura Ring Gen 3 specifically shows strong performance for ovulation detection (96.4% accuracy)', 'Oura''s own validation study reported that the ring detected 96.4% of ovulations')::jsonb
where id in ('d-oura');

-- d-initio
update public.product_catalog set
  summary = replace(summary, 'A peer-reviewed validation study (published in a PMC-indexed journal) found that Inito''s hormone readings showed approximately 95% accuracy compared to blood hormone trends and confirmed ovulation with over 99% accuracy.', 'A validation study by Inito''s own researchers (Scientific Reports, 2023; 100 women) found its urine hormone readings closely matched laboratory (ELISA) tests run on the same urine samples.'),
  doctor_opinion = replace(doctor_opinion, 'A peer-reviewed validation study (published in a PMC-indexed journal) found that Inito''s hormone readings showed approximately 95% accuracy compared to blood hormone trends and confirmed ovulation with over 99% accuracy.', 'A validation study by Inito''s own researchers (Scientific Reports, 2023; 100 women) found its urine hormone readings closely matched laboratory (ELISA) tests run on the same urine samples.'),
  effectiveness = replace(effectiveness, 'A peer-reviewed validation study (published in a PMC-indexed journal) found that Inito''s hormone readings showed approximately 95% accuracy compared to blood hormone trends and confirmed ovulation with over 99% accuracy.', 'A validation study by Inito''s own researchers (Scientific Reports, 2023; 100 women) found its urine hormone readings closely matched laboratory (ELISA) tests run on the same urine samples.'),
  community_review = replace(community_review, 'A peer-reviewed validation study (published in a PMC-indexed journal) found that Inito''s hormone readings showed approximately 95% accuracy compared to blood hormone trends and confirmed ovulation with over 99% accuracy.', 'A validation study by Inito''s own researchers (Scientific Reports, 2023; 100 women) found its urine hormone readings closely matched laboratory (ELISA) tests run on the same urine samples.'),
  extra = replace(extra::text, 'A peer-reviewed validation study (published in a PMC-indexed journal) found that Inito''s hormone readings showed approximately 95% accuracy compared to blood hormone trends and confirmed ovulation with over 99% accuracy.', 'A validation study by Inito''s own researchers (Scientific Reports, 2023; 100 women) found its urine hormone readings closely matched laboratory (ELISA) tests run on the same urine samples.')::jsonb
where id in ('d-initio');

-- d-initio
update public.product_catalog set
  summary = replace(summary, 'Peer-reviewed study confirming 95% accuracy of Inito''s hormone readings versus blood testing and 99%+ accuracy for ovulation confirmation.', 'Study by Inito''s own researchers (Scientific Reports, 2023; 100 women) comparing the monitor''s urine hormone readings with laboratory ELISA tests on the same samples.'),
  doctor_opinion = replace(doctor_opinion, 'Peer-reviewed study confirming 95% accuracy of Inito''s hormone readings versus blood testing and 99%+ accuracy for ovulation confirmation.', 'Study by Inito''s own researchers (Scientific Reports, 2023; 100 women) comparing the monitor''s urine hormone readings with laboratory ELISA tests on the same samples.'),
  effectiveness = replace(effectiveness, 'Peer-reviewed study confirming 95% accuracy of Inito''s hormone readings versus blood testing and 99%+ accuracy for ovulation confirmation.', 'Study by Inito''s own researchers (Scientific Reports, 2023; 100 women) comparing the monitor''s urine hormone readings with laboratory ELISA tests on the same samples.'),
  community_review = replace(community_review, 'Peer-reviewed study confirming 95% accuracy of Inito''s hormone readings versus blood testing and 99%+ accuracy for ovulation confirmation.', 'Study by Inito''s own researchers (Scientific Reports, 2023; 100 women) comparing the monitor''s urine hormone readings with laboratory ELISA tests on the same samples.'),
  extra = replace(extra::text, 'Peer-reviewed study confirming 95% accuracy of Inito''s hormone readings versus blood testing and 99%+ accuracy for ovulation confirmation.', 'Study by Inito''s own researchers (Scientific Reports, 2023; 100 women) comparing the monitor''s urine hormone readings with laboratory ELISA tests on the same samples.')::jsonb
where id in ('d-initio');

-- p-honeypot-pad
update public.product_catalog set
  summary = replace(summary, 'Approximately 60% of users report significant relief from localized cramping, while 15% report intense burning sensations from the cooling effect.', 'Some users report relief from cramping, while others report a burning sensation from the cooling herbs.'),
  doctor_opinion = replace(doctor_opinion, 'Approximately 60% of users report significant relief from localized cramping, while 15% report intense burning sensations from the cooling effect.', 'Some users report relief from cramping, while others report a burning sensation from the cooling herbs.'),
  effectiveness = replace(effectiveness, 'Approximately 60% of users report significant relief from localized cramping, while 15% report intense burning sensations from the cooling effect.', 'Some users report relief from cramping, while others report a burning sensation from the cooling herbs.'),
  community_review = replace(community_review, 'Approximately 60% of users report significant relief from localized cramping, while 15% report intense burning sensations from the cooling effect.', 'Some users report relief from cramping, while others report a burning sensation from the cooling herbs.'),
  extra = replace(extra::text, 'Approximately 60% of users report significant relief from localized cramping, while 15% report intense burning sensations from the cooling effect.', 'Some users report relief from cramping, while others report a burning sensation from the cooling herbs.')::jsonb
where id in ('p-honeypot-pad');

-- p-knix-underwear
update public.product_catalog set
  summary = replace(summary, 'Knix has successfully passed multiple independent tests for PFAS, making it a doctor-recommended choice for patients who are concerned about chemical exposure in textiles. The seamless technology also reduces the risk of skin abrasion.', 'Knix says its products are tested for PFAS by independent labs.'),
  doctor_opinion = replace(doctor_opinion, 'Knix has successfully passed multiple independent tests for PFAS, making it a doctor-recommended choice for patients who are concerned about chemical exposure in textiles. The seamless technology also reduces the risk of skin abrasion.', 'Knix says its products are tested for PFAS by independent labs.'),
  effectiveness = replace(effectiveness, 'Knix has successfully passed multiple independent tests for PFAS, making it a doctor-recommended choice for patients who are concerned about chemical exposure in textiles. The seamless technology also reduces the risk of skin abrasion.', 'Knix says its products are tested for PFAS by independent labs.'),
  community_review = replace(community_review, 'Knix has successfully passed multiple independent tests for PFAS, making it a doctor-recommended choice for patients who are concerned about chemical exposure in textiles. The seamless technology also reduces the risk of skin abrasion.', 'Knix says its products are tested for PFAS by independent labs.'),
  extra = replace(extra::text, 'Knix has successfully passed multiple independent tests for PFAS, making it a doctor-recommended choice for patients who are concerned about chemical exposure in textiles. The seamless technology also reduces the risk of skin abrasion.', 'Knix says its products are tested for PFAS by independent labs.')::jsonb
where id in ('p-knix-underwear');

-- p-always-infinity
update public.product_catalog set
  summary = replace(summary, 'absorbs 10x its weight.', 'absorbs 10x its weight, per Always.'),
  doctor_opinion = replace(doctor_opinion, 'absorbs 10x its weight.', 'absorbs 10x its weight, per Always.'),
  effectiveness = replace(effectiveness, 'absorbs 10x its weight.', 'absorbs 10x its weight, per Always.'),
  community_review = replace(community_review, 'absorbs 10x its weight.', 'absorbs 10x its weight, per Always.'),
  extra = replace(extra::text, 'absorbs 10x its weight.', 'absorbs 10x its weight, per Always.')::jsonb
where id in ('p-always-infinity');

-- p-saalt-cup
update public.product_catalog set
  summary = replace(summary, 'Holds 4x more than a tampon.', 'Saalt says it holds 4x more than a tampon.'),
  doctor_opinion = replace(doctor_opinion, 'Holds 4x more than a tampon.', 'Saalt says it holds 4x more than a tampon.'),
  effectiveness = replace(effectiveness, 'Holds 4x more than a tampon.', 'Saalt says it holds 4x more than a tampon.'),
  community_review = replace(community_review, 'Holds 4x more than a tampon.', 'Saalt says it holds 4x more than a tampon.'),
  extra = replace(extra::text, 'Holds 4x more than a tampon.', 'Saalt says it holds 4x more than a tampon.')::jsonb
where id in ('p-saalt-cup');

-- p-willow-pump
update public.product_catalog set
  summary = replace(summary, 'The world''s first all-in-one wearable breast pump.', 'Willow calls it the world''s first all-in-one wearable breast pump.'),
  doctor_opinion = replace(doctor_opinion, 'The world''s first all-in-one wearable breast pump.', 'Willow calls it the world''s first all-in-one wearable breast pump.'),
  effectiveness = replace(effectiveness, 'The world''s first all-in-one wearable breast pump.', 'Willow calls it the world''s first all-in-one wearable breast pump.'),
  community_review = replace(community_review, 'The world''s first all-in-one wearable breast pump.', 'Willow calls it the world''s first all-in-one wearable breast pump.'),
  extra = replace(extra::text, 'The world''s first all-in-one wearable breast pump.', 'Willow calls it the world''s first all-in-one wearable breast pump.')::jsonb
where id in ('p-willow-pump');

-- p-intimina-lily
update public.product_catalog set
  summary = replace(summary, 'The only cup that can be folded as thin as a tampon.', 'Intimina says it is the only cup that folds as thin as a tampon.'),
  doctor_opinion = replace(doctor_opinion, 'The only cup that can be folded as thin as a tampon.', 'Intimina says it is the only cup that folds as thin as a tampon.'),
  effectiveness = replace(effectiveness, 'The only cup that can be folded as thin as a tampon.', 'Intimina says it is the only cup that folds as thin as a tampon.'),
  community_review = replace(community_review, 'The only cup that can be folded as thin as a tampon.', 'Intimina says it is the only cup that folds as thin as a tampon.'),
  extra = replace(extra::text, 'The only cup that can be folded as thin as a tampon.', 'Intimina says it is the only cup that folds as thin as a tampon.')::jsonb
where id in ('p-intimina-lily');

-- p-nature-made-iron-65mg
update public.product_catalog set
  summary = replace(summary, 'USP verified, #1 pharmacist recommended vitamin brand.', 'USP verified. Nature Made says it is the #1 pharmacist-recommended vitamin brand.'),
  doctor_opinion = replace(doctor_opinion, 'USP verified, #1 pharmacist recommended vitamin brand.', 'USP verified. Nature Made says it is the #1 pharmacist-recommended vitamin brand.'),
  effectiveness = replace(effectiveness, 'USP verified, #1 pharmacist recommended vitamin brand.', 'USP verified. Nature Made says it is the #1 pharmacist-recommended vitamin brand.'),
  community_review = replace(community_review, 'USP verified, #1 pharmacist recommended vitamin brand.', 'USP verified. Nature Made says it is the #1 pharmacist-recommended vitamin brand.'),
  extra = replace(extra::text, 'USP verified, #1 pharmacist recommended vitamin brand.', 'USP verified. Nature Made says it is the #1 pharmacist-recommended vitamin brand.')::jsonb
where id in ('p-nature-made-iron-65mg');

-- d-clue
update public.product_catalog set
  summary = replace(summary, 'industry-leading privacy', 'a focus on privacy'),
  doctor_opinion = replace(doctor_opinion, 'industry-leading privacy', 'a focus on privacy'),
  effectiveness = replace(effectiveness, 'industry-leading privacy', 'a focus on privacy'),
  community_review = replace(community_review, 'industry-leading privacy', 'a focus on privacy'),
  extra = replace(extra::text, 'industry-leading privacy', 'a focus on privacy')::jsonb
where id in ('d-clue');

-- Unsourced "Doctor Recommended" badge: p-phd-wash
update public.product_catalog
set extra = jsonb_set(extra, '{badges}', (select coalesce(jsonb_agg(b), '[]'::jsonb) from jsonb_array_elements(extra->'badges') b where b <> '"Doctor Recommended"'::jsonb))
where id in ('p-phd-wash') and extra->'badges' ? 'Doctor Recommended';

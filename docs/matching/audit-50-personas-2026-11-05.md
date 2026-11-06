# 50-profile ayna v2 matching audit — 2026-11-05

## Scope and methodology

50 distinct **synthetic** quiz profiles passed to the production v2 seed builder `getEcosystemSeedFromQuiz(..., {engine:'v2'})` using **bundled** `ALL_PRODUCTS`. Tested: recommendability, no cycle-only trackers for absent-cycle states, ingested pregnancy/lactation safety holds, explicit latex/fragrance exclusions, brand-cap and displayed score >=50. Every profile is also printed in the GitHub Actions log as `AYNA_PROFILE_AUDIT`. A green run certifies only these mechanical invariants, **not** clinical appropriateness, symptom triage, drug-interaction completeness, performance for the live Supabase catalog, nor calibrated outcome likelihood.

CI run: https://github.com/pulomabishnu/ayna_mvp1/actions/runs/42157312399

## Results

- **50/50** profile tests passed; entire CI suite **3,625 passed, 4 skipped**, build and catalog check green.
- **93** need shelves, **23** empty (24.7%); **20/50** profiles have at least one empty shelf; **3/50** had no recommendations at all.
- **186** displayed recommendations across shelves; **96** distinct product ids.
- Shown score range: 50–97%; median 79%.
- This was a targeted stress sample; the older general 250-person sweep has different empty-shelf rates. Do not generalize this sample rate to the population.

## High-priority manual-review findings

1. **Pregnant + spotting/pelvic pain** (23) received pads/liners and a pelvic wand; regardless of product eligibility, care triage needs to be visually prior to shopping. ACOG asks pregnant people with bleeding to contact an ob-gyn, and bleeding plus pelvic pain merits urgent assessment. Existing Ask red-flag text and ReadyReveal `spotting_check` are positive but cross-surface ordering/coverage must be verified.
2. **Postmenopausal spotting** (35) appropriately received zero menstrual products; existing `bleedingCareNote` code provides care advice, and UI must actually show it. ACOG 2026 emphasizes prompt clinical evaluation for postmenopausal bleeding.
3. **Migraine with aura + Yaz** (10) recommended contraception services (not a specific pill) but must visibly flag the serious combined-hormonal contraception issue. CDC US MEC ranks combined hormonal contraception as category 4 with migraine with aura.
4. **TTC while using spironolactone** (17) returned minoxidil foam as hair-loss support; medication reconciliation and pregnancy-planning safety context should be explicitly checked with a clinician before product recommendations.
5. **Possible active vaginitis** (37–39) got at-home testing and in case 38 OTC antifungal therapy (92%); symptoms alone should not be treated as a confirmed specific diagnosis.
6. **Clinical review queue mismatch**: the live Supabase `product_review_queue` includes Winx UTI/Vaginal test-and-treat, BUNI Bundle, and Neycher Vaginal Moisturizer (all `needs_clinician_review`), yet these products appear in the **bundled catalog run**. This is not proof they appear live; verify review holds are enforced for every dynamic/catalog path. `NEED_MAP_REVIEWED` is empty and the passport completeness cap is currently disabled.
7. **Displayed match vs preferences**: `v2.gates.test.js` asserts preferences never lower health; however, `productFactors` applies negative budget/reusable/other preference modifiers to shown `v2.fit`/`score`. Existing test checks `v2.health`, not shown match. Decide which spec is intended and add displayed-score regression coverage.
8. **Sparse catalog**: live database contains 989 active of 2,057 product records. 152 active lack tags and health functions, 154 have no primary URL, and 38 are awaiting clinician review. Diagnose missing health-function rows; keep non-recommendable accessories out.
9. **Outcome calibration**: live `match_outcome_samples` contains zero rows. Scores are heuristic fit numbers, not validated probabilities.
10. **Relevance/coverage**: PMS + cycle mood (08) has 0; PMDD (09), PCOS (11), adenomyosis (14), pregnancy nausea (19,22), brain fog (29), bowel symptoms (48), libido (50) have gaps. An empty shelf can be safer than padded recommendations, but should lead to appropriate care navigation and next steps.

## All 50 synthetic profiles and returned product recommendations

| # | Profile and needs | Recommendations per need (name, displayed fit) | Empty needs |
|---|---|---|---|
| 01-period-cramps | Cramps or period pain | pain.menstrual_cramp: VIBOOS Electric Heating Pad (87%); Comfytemp Portable Heating Pad (87%); ThermaCare Menstrual Pain | none |
| 02-heavy-flow | Heavy periods, Period product support | period.heavy: Organic Cotton and Hemp Fiber Menstrual Pads with Wings (90%); Organic Cotton Non-Applicator Tampons (90%) | none |
| 03-light-flow | Light periods, Period product support | period.light: o.b. ProComfort Mini Tampons, 32ct (88%); Hanes Period Underwear (88%); Carefree Acti-Fresh Liners (83%) ( | none |
| 04-period-leaks-latex | Heavy periods, Period product support | period.heavy: Tampon Tribe Menstrual Cup (95%); Nixit Menstrual Disc (82%); Visana Health (73%) / period.product_support | none |
| 05-irregular-cycle | Irregular periods, Ovulation tracking or support | cycle.irregular: Lively - Period Tracker, Cycle (79%); Ovia Health (65%); Rèsa Rhythm Bracelet (63%) (+1 more) / fertili | none |
| 06-missed-period | Missed periods | cycle.missed: Winx Health Early Pregnancy Tests (53%) | none |
| 07-spotting | Spotting between periods | cycle.spotting: Carefree Acti-Fresh Liners (83%); Always Liners (83%); Rael Regular Organic Cotton Cover Panty Liners, 6 | none |
| 08-pms-mood | PMS symptoms, Cycle-related mood changes | cycle.pms: none / mood.cycle_related: none | cycle.pms, mood.cycle_related |
| 09-pmdd | PMDD symptoms, Low mood | mood.pmdd: none / mood.low: BetterHelp (82%); Hers (76%); Pomelo Care (75%) | mood.pmdd |
| 10-migraine-aura | Cycle-related headaches or migraines, Contraception | pain.cycle_headache: none / sexual.contraception: Nurx (84%); Wisp (82%); Planned Parenthood Direct (82%) (+1 more) | pain.cycle_headache |
| 11-pcos-acne | PCOS support, Hair thinning or hair loss | condition_support.pcos: none / hair.loss: Women's Rogaine 5% Minoxidil Foam (65%) | condition_support.pcos |
| 12-endometriosis | Endometriosis support, Pelvic pain | condition_support.endometriosis: Visana Health (75%) / pain.pelvic: Intimate Rose Pelvic Wand (77%) | none |
| 13-fibroids-anemia | Fibroid-related concerns, Heavy periods | condition_support.fibroids: Visana Health (77%) / period.heavy: Visana Health (84%); Tampon Tribe Organic Tampons Bulk B | none |
| 14-adenomyosis | Adenomyosis-related concerns, Pelvic pain | condition_support.adenomyosis: none / pain.pelvic: Intimate Rose Pelvic Wand (77%) | condition_support.adenomyosis |
| 15-ttc-cycle | Trying to conceive, Ovulation tracking or support | fertility.ttc: Proov Complete Fertility Testing System (89%); Function Health Membership (87%); Proov Clinical: F.A.S.T. | none |
| 16-ttc-infertility | Fertility support, Trying to conceive | fertility.support: Easy@Home Ovulation Test Strips (50 LH Tests) (91%); Function Health Membership (87%); Inito Fertilit | none |
| 17-ttc-medications | Fertility support, Hair thinning or hair loss | fertility.support: Easy@Home Ovulation Test Strips (50 LH Tests) (87%); Function Health Membership (83%); Proov Clinical | none |
| 18-ttc-supplement-allergy | Prenatal or pregnancy support | pregnancy.prenatal: Pomelo Care (65%); Prenatal Pack (1st / 2nd / 3rd Trimester) (55%) | none |
| 19-pregnant-first | Prenatal or pregnancy support, Nausea | pregnancy.prenatal: Pomelo Care (65%); Prenatal Pack (1st / 2nd / 3rd Trimester) (55%) / digestive.nausea: none | digestive.nausea |
| 20-pregnant-second | Pregnancy-related discomfort, Constipation | pregnancy.discomfort: Leachco Snoogle Maternity Pillow (63%); Belly Bandit Upsie Belly (57%) / digestive.constipation: n | digestive.constipation |
| 21-pregnant-third | Pregnancy-safe product discovery, Trouble sleeping | pregnancy.safe_discovery: Pomelo Care (62%); Prenatal Pack (1st / 2nd / 3rd Trimester) (61%); Leachco Snoogle Maternity  | sleep.trouble |
| 22-pregnant-med-unknown | Pregnancy-related discomfort, Nausea | pregnancy.discomfort: Leachco Snoogle Maternity Pillow (63%); Belly Bandit Upsie Belly (57%) / digestive.nausea: none | digestive.nausea |
| 23-pregnant-bleeding | Spotting between periods, Pelvic pain | cycle.spotting: Tampon Tribe Organic Pantyliners Bulk Buy (48) (83%); Carefree Acti-Fresh Liners (83%); Always Liners (8 | none |
| 24-postpartum-new | Postpartum recovery, Pelvic pain | postpartum.recovery: Pomelo Care (78%); Bodily Postpartum Recovery Kit (57%); Frida Mom Postpartum Kit (57%) / pain.pelv | none |
| 25-postpartum-breastfeeding | Breastfeeding or lactation support, Postpartum body or skin changes | postpartum.lactation: Haakaa Silicone Breast Pump (85%); Lansinoh Stay Dry Nursing Pads (65%); BUNI Bundle (51%) / postp | none |
| 26-postpartum-not-feeding | Postpartum recovery, Trouble sleeping | postpartum.recovery: Pomelo Care (78%) / sleep.trouble: none | sleep.trouble |
| 27-postpartum-medication | Low mood, Breastfeeding or lactation support | mood.low: Pomelo Care (82%); BetterHelp (82%); Hers (73%) / postpartum.lactation: Haakaa Silicone Breast Pump (85%); Lan | none |
| 28-peri-regular | Hot flashes, Trouble sleeping | vasomotor.hot_flashes: Gennev Menopause Care (76%); coldHER™ Cooling Bra Inserts (65%); Health & Her App (53%) / sleep.t | none |
| 29-peri-irregular | Night sweats, Brain fog | vasomotor.night_sweats: Pomelo Care (76%); Womaness Me.No.Pause. Supplement (54%); Thermella (54%) / cognition.brain_fog | cognition.brain_fog |
| 30-peri-heavy | Heavy periods, Hot flashes | period.heavy: Organic Cotton and Hemp Fiber Menstrual Pads with Wings (84%); Tampon Tribe Organic Tampons Bulk Buy (84%) | none |
| 31-peri-no-cycle | Hot flashes, Cycle-related bloating | vasomotor.hot_flashes: Midi Health (76%); coldHER™ Cooling Bra Inserts (65%); Cool Spray for Hot Flashes (59%) / bloatin | bloating.cycle_related |
| 32-menopause-dryness | Vaginal dryness, Pain or discomfort during sex | vaginal.dryness: Good Clean Love Bio-Match Moisturizer (91%); Neycher Vaginal Moisturizer (79%); Melt For You Vaginal In | none |
| 33-menopause-sleep | Night sweats, Trouble sleeping | vasomotor.night_sweats: Pomelo Care (76%) / sleep.trouble: Health & Her App (55%); Eight Sleep Pod 4 (54%) | none |
| 34-postmenopause-bone | Bone health, Joint aches | bone.health: Citracal Maximum Plus Calcium Citrate + D3, 120 Caplets (73%); Perimenopause Support Pack (59%) / pain.join | pain.joint |
| 35-postmenopause-bleeding | Spotting between periods | cycle.spotting: none | cycle.spotting |
| 36-postmenopause-no-cycle | Ovulation tracking or support, Irregular periods | fertility.ovulation_tracking: none / cycle.irregular: none | fertility.ovulation_tracking, cycle.irregular |
| 37-vaginal-bv | BV concerns, Vaginal odor | vaginal.bv: Winx Health Vaginal Health Test + Treat (67%) / vaginal.odor: Love Wellness Intimate Skin Support (59%) | none |
| 38-vaginal-yeast | Yeast infection concerns, Vaginal itching or irritation | vaginal.yeast: Monistat 3-Dose Yeast Infection Treatment (Prefilled Applicators + External Itch Cream) (92%); Taro Clotr | none |
| 39-vaginal-discharge | Unusual vaginal discharge | vaginal.discharge: Winx Health Vaginal Health Test + Treat (62%) | none |
| 40-vaginal-fragrance | Vaginal itching or irritation, Vaginal dryness | vaginal.irritation: Alubri Calming Cream (67%) / vaginal.dryness: Alubri Moisture Renewal Kit (87%); Good Clean Love Bio | none |
| 41-uti-now | Burning with urination, Frequent urination | urinary.burning: Winx Health UTI Test + Treat (84%) / urinary.frequency: AZO UTI Test Strips (53%) | none |
| 42-uti-recurrent | Recurrent UTI-like symptoms, Urinary urgency | urinary.recurrent_uti: Winx Health UTI Test + Treat (77%) / urinary.urgency: AZO UTI Test Strips (51%) | none |
| 43-incontinence-postpartum | Bladder leakage or incontinence | urinary.incontinence: TENA Intimates Very Light Liner for Women (92%); Depend Silhouette Incontinence Underwear for Wome | none |
| 44-urinary-menopause | Frequent urination, Vaginal dryness | urinary.frequency: none / vaginal.dryness: Good Clean Love Bio-Match Moisturizer (85%); Alubri Moisture Renewal Kit (85% | urinary.frequency |
| 45-sti-concern | STI-related concerns, Sexual wellness or comfort | sexual.sti: Visby Women's At-Home STI Test (87%); Wisp (79%); Planned Parenthood Direct (79%) / sexual.wellness: Dame Ar | none |
| 46-contraception | Contraception | sexual.contraception: Nurx (84%); Wisp (82%); Planned Parenthood Direct (82%) (+1 more) | none |
| 47-anxiety-ssri | Anxiety, Trouble sleeping | mood.general_anxiety: Hers (73%); Pomelo Care (74%); BetterHelp (69%) / sleep.trouble: none | sleep.trouble |
| 48-digestive-ibs | Digestive bloating, Diarrhea, Constipation | bloating.digestive: none / digestive.diarrhea: none / digestive.constipation: MiraLAX Osmotic Laxative Powder, Unflavore | bloating.digestive, digestive.diarrhea |
| 49-unknown-stage | Fatigue or low energy, Hair thinning or hair loss | energy.fatigue: none / hair.loss: Women's Rogaine 5% Minoxidil Foam (65%) | energy.fatigue |
| 50-privacy-limited | Finding a telehealth provider, Low libido or libido changes | care.telehealth: Tia (80%); Nurx (78%); Wisp (75%) (+1 more) / sexual.libido: none | sexual.libido |

## Recommended next steps

**P0 — Care before commerce:** deterministic triage based on pregnancy bleeding with pain, postmenopausal bleeding, abnormal/heavy bleeding, severe pelvic pain, symptomatic infection, migraine aura with combined hormonal contraception. Verify warning first on every recommendation surface, including web/app/Ask/search and shares.

**P0 — Review queue reconciliation:** for each queued product, assert that the same review state is obeyed in static and live catalogs (and that a `hold` hides percentages where required). Prioritize ingestion products, medications, pregnancy, contraception and diagnostics for clinician review; clinical signoff on product-by-need evidence should be documented.

**P1 — Structured coverage:** review 152 active rows with no health functions; reconcile 154 URL gaps and duplicate brand-product names (Vella Pleasurewave Arousal Lotion, Winx Health Vaginal Health Test + Treat).

**P1 — Consistent display:** separate health-relevance `fit` from shopping constraints and evidence confidence, and ensure 80%+ only appears as `Strong` when confidence supports it. Add explicit test that adding an unrelated preference cannot change the clinical relevance component, and test the chosen display behavior.

**P1 — Care navigation on empty shelves:** for PMS, PMDD, PCOS, adenomyosis, GI and pregnancy symptoms, show safe, condition-specific clinician-reviewed guidance and actionable next steps, rather than inventing product matches.

**P2 — Validation:** opt-in feedback/outcomes and clinician-rated top-k relevance for all 50 profiles; assess safety miss rate, NDCG@3, precision@3, recommendation diversity, empty shelves, review hold accuracy, and calibration by user group and need, alongside longitudinal user outcomes.

## Research and standards

- ACOG bleeding in pregnancy: https://www.acog.org/womens-health/faqs/bleeding-during-pregnancy
- ACOG April 2026 postmenopausal bleeding update: https://www.acog.org/news/news-releases/2026/04/acog-publishes-updated-guidance-evaluation-postmenopausal-bleeding
- CDC vaginitis guidance: https://www.cdc.gov/std/treatment-guidelines/vaginal-discharge.htm
- CDC contraception/migraine with aura: https://www.cdc.gov/contraception/hcp/usmec/combined-hormonal-contraceptives.html
- NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework/ai-risk-management-framework-faqs
- FDA January 2026 CDS guidance: https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software

**No production code or user data was modified** in this audit.

// Generated from the condition research (Oct 17). Do not edit by hand.
// Conditions members can choose; avoid and caution rules only.
export default [
 {
  "condition": "hypertension",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "caution",
  "message": "Some over-the-counter pain relievers like ibuprofen and naproxen can raise blood pressure, so check with your doctor or pharmacist first.",
  "source_url": "https://newsroom.heart.org/news/most-u-s-adults-unaware-that-over-the-counter-pain-relievers-may-increase-blood-pressure"
 },
 {
  "condition": "hypertension",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "caution",
  "message": "NSAIDs can make the body hold on to fluid, which can raise blood pressure.",
  "source_url": "https://www.mayoclinic.org/diseases-conditions/high-blood-pressure/in-depth/blood-pressure/art-20045245"
 },
 {
  "condition": "kidney_disease",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "avoid",
  "message": "NSAIDs such as ibuprofen and naproxen can damage the kidneys, so ask your care team about other pain options.",
  "source_url": "https://www.niddk.nih.gov/health-information/kidney-disease/chronic-kidney-disease-ckd/managing"
 },
 {
  "condition": "stomach_ulcer",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "avoid",
  "message": "NSAIDs like aspirin, ibuprofen and naproxen are a common cause of stomach ulcers, so talk to your doctor before using them.",
  "source_url": "https://www.niddk.nih.gov/health-information/digestive-diseases/peptic-ulcers-stomach-ulcers/symptoms-causes"
 },
 {
  "condition": "asthma",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "caution",
  "message": "If you have asthma, tell your doctor before using ibuprofen or similar pain relievers.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a682159.html"
 },
 {
  "condition": "bleeding_disorder",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "caution",
  "message": "Ibuprofen can cause bleeding, so check with your doctor first if you have a bleeding condition or take a blood thinner.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a682159.html"
 },
 {
  "condition": "heart_disease",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "caution",
  "message": "Ibuprofen carries heart risks, so tell your doctor before using it if you have heart disease.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a682159.html"
 },
 {
  "condition": "liver_disease",
  "product_class": "nsaid",
  "match": {
   "name_regex": "\\b(ibuprofen|naproxen|nsaids?|aspirin|advil|motrin|aleve|midol)\\b",
   "categories": [
    "pain_relief"
   ]
  },
  "verdict": "caution",
  "message": "Tell your doctor before using ibuprofen if you have liver disease.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a682159.html"
 },
 {
  "condition": "diabetes",
  "product_class": "heat_pad",
  "match": {
   "name_regex": "\\b(heat(ing)? (pad|patch|wrap)|heat therapy|hot water bottle|warming (pad|patch)|heated)\\b",
   "categories": [
    "pain_relief",
    "heat"
   ]
  },
  "verdict": "caution",
  "message": "Never use a heating pad or hot water bottle on your feet, since nerve changes can make burns easy to miss.",
  "source_url": "https://www.niddk.nih.gov/health-information/diabetes/overview/preventing-problems/foot-problems"
 },
 {
  "condition": "migraine_with_aura",
  "product_class": "combined_hormonal",
  "match": {
   "name_regex": "\\b(combined (hormonal|oral)|estrogen|ethinyl ?estradiol|birth control (pill|patch|ring)|the pill|contracepti(ve|on))\\b",
   "categories": [
    "contraception",
    "hormonal",
    "telehealth"
   ]
  },
  "verdict": "avoid",
  "message": "Estrogen-containing birth control is not recommended for people who have migraine with aura, so ask about non-estrogen options.",
  "source_url": "https://www.cdc.gov/contraception/hcp/usspr/classifications-mec-contraception.html"
 },
 {
  "condition": "hypertension",
  "product_class": "combined_hormonal",
  "match": {
   "name_regex": "\\b(combined (hormonal|oral)|estrogen|ethinyl ?estradiol|birth control (pill|patch|ring)|the pill|contracepti(ve|on))\\b",
   "categories": [
    "contraception",
    "hormonal",
    "telehealth"
   ]
  },
  "verdict": "avoid",
  "message": "Estrogen-containing birth control is usually not recommended with high blood pressure, even when it is controlled, so ask your clinician about other options.",
  "source_url": "https://www.cdc.gov/contraception/hcp/usspr/classifications-mec-contraception.html"
 },
 {
  "condition": "diabetes",
  "product_class": "combined_hormonal",
  "match": {
   "name_regex": "\\b(combined (hormonal|oral)|estrogen|ethinyl ?estradiol|birth control (pill|patch|ring)|the pill|contracepti(ve|on))\\b",
   "categories": [
    "contraception",
    "hormonal",
    "telehealth"
   ]
  },
  "verdict": "caution",
  "message": "Estrogen-containing birth control may not be recommended if diabetes has affected your blood vessels or you have had it over 20 years, so check with your clinician.",
  "source_url": "https://www.cdc.gov/contraception/hcp/usspr/classifications-mec-contraception.html"
 },
 {
  "condition": "autoimmune",
  "product_class": "combined_hormonal",
  "match": {
   "name_regex": "\\b(combined (hormonal|oral)|estrogen|ethinyl ?estradiol|birth control (pill|patch|ring)|the pill|contracepti(ve|on))\\b",
   "categories": [
    "contraception",
    "hormonal",
    "telehealth"
   ]
  },
  "verdict": "caution",
  "message": "If you have lupus with antiphospholipid antibodies, estrogen-containing birth control is not recommended, so review this with your clinician.",
  "source_url": "https://www.cdc.gov/contraception/hcp/usspr/classifications-mec-contraception.html"
 },
 {
  "condition": "blood_clot_history",
  "product_class": "combined_hormonal",
  "match": {
   "name_regex": "\\b(combined (hormonal|oral)|estrogen|ethinyl ?estradiol|birth control (pill|patch|ring)|the pill|contracepti(ve|on))\\b",
   "categories": [
    "contraception",
    "hormonal",
    "telehealth"
   ]
  },
  "verdict": "avoid",
  "message": "Estrogen-containing birth control is generally not recommended if you have had a blood clot in a vein or lung.",
  "source_url": "https://www.cdc.gov/contraception/hcp/usspr/classifications-mec-contraception.html"
 },
 {
  "condition": "thyroid",
  "product_class": "iron",
  "match": {
   "name_regex": "\\b(iron|ferrous|ferric|heme iron|bisglycinate iron)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "caution",
  "message": "If you take levothyroxine, take iron at least 4 hours before or after it.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a682461.html"
 },
 {
  "condition": "ibs_digestive",
  "product_class": "iron",
  "match": {
   "name_regex": "\\b(iron|ferrous|ferric|heme iron|bisglycinate iron)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "caution",
  "message": "Higher-dose iron can cause constipation and nausea, and taking it with food may help.",
  "source_url": "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/"
 },
 {
  "condition": "thyroid",
  "product_class": "calcium",
  "match": {
   "name_regex": "\\b(calcium|calcium carbonate|calcium citrate)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "caution",
  "message": "If you take levothyroxine, take calcium at least 4 hours before or after it.",
  "source_url": "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/"
 },
 {
  "condition": "anemia",
  "product_class": "calcium",
  "match": {
   "name_regex": "\\b(calcium|calcium carbonate|calcium citrate)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "caution",
  "message": "Calcium can reduce iron absorption, so take calcium and iron supplements at different times of day.",
  "source_url": "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/"
 },
 {
  "condition": "ibs_digestive",
  "product_class": "calcium",
  "match": {
   "name_regex": "\\b(calcium|calcium carbonate|calcium citrate)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "caution",
  "message": "Calcium supplements can cause gas, bloating or constipation, and calcium citrate tends to cause less of this than carbonate.",
  "source_url": "https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/"
 },
 {
  "condition": "kidney_disease",
  "product_class": "magnesium",
  "match": {
   "name_regex": "\\b(magnesium)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "avoid",
  "message": "With reduced kidney function, magnesium supplements can build up to unsafe levels, so ask your care team first.",
  "source_url": "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/"
 },
 {
  "condition": "ibs_digestive",
  "product_class": "magnesium",
  "match": {
   "name_regex": "\\b(magnesium)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "caution",
  "message": "Higher doses of magnesium often cause diarrhea and cramping.",
  "source_url": "https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/"
 },
 {
  "condition": "bleeding_disorder",
  "product_class": "omega_3",
  "match": {
   "name_regex": "\\b(omega-?3|fish oil|epa|dha|krill oil|algal oil)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "caution",
  "message": "High-dose fish oil can affect platelets, so check with your doctor if you have a bleeding condition or take a blood thinner.",
  "source_url": "https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/"
 },
 {
  "condition": "bleeding_disorder",
  "product_class": "ginkgo",
  "match": {
   "name_regex": "\\b(ginkgo)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "avoid",
  "message": "Ginkgo may raise bleeding risk, especially with blood thinners.",
  "source_url": "https://www.nccih.nih.gov/health/ginkgo"
 },
 {
  "condition": "thyroid",
  "product_class": "ashwagandha",
  "match": {
   "name_regex": "\\b(ashwagandha|withania)\\b",
   "categories": [
    "supplement",
    "adaptogen"
   ]
  },
  "verdict": "caution",
  "message": "Ashwagandha might affect thyroid function and thyroid medicine, so check with your doctor first.",
  "source_url": "https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/"
 },
 {
  "condition": "autoimmune",
  "product_class": "ashwagandha",
  "match": {
   "name_regex": "\\b(ashwagandha|withania)\\b",
   "categories": [
    "supplement",
    "adaptogen"
   ]
  },
  "verdict": "caution",
  "message": "Ashwagandha may interact with immunosuppressant medicines, so check with your doctor first.",
  "source_url": "https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/"
 },
 {
  "condition": "diabetes",
  "product_class": "ashwagandha",
  "match": {
   "name_regex": "\\b(ashwagandha|withania)\\b",
   "categories": [
    "supplement",
    "adaptogen"
   ]
  },
  "verdict": "caution",
  "message": "Ashwagandha may interact with diabetes medicines, so check with your doctor first.",
  "source_url": "https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/"
 },
 {
  "condition": "hypertension",
  "product_class": "ashwagandha",
  "match": {
   "name_regex": "\\b(ashwagandha|withania)\\b",
   "categories": [
    "supplement",
    "adaptogen"
   ]
  },
  "verdict": "caution",
  "message": "Ashwagandha may interact with blood pressure medicines, so check with your doctor first.",
  "source_url": "https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/"
 },
 {
  "condition": "liver_disease",
  "product_class": "ashwagandha",
  "match": {
   "name_regex": "\\b(ashwagandha|withania)\\b",
   "categories": [
    "supplement",
    "adaptogen"
   ]
  },
  "verdict": "avoid",
  "message": "Ashwagandha has been linked to cases of liver injury.",
  "source_url": "https://ods.od.nih.gov/factsheets/Ashwagandha-HealthProfessional/"
 },
 {
  "condition": "thyroid",
  "product_class": "biotin",
  "match": {
   "name_regex": "\\b(biotin|vitamin b7|hair,? skin,? (and|&) nails?)\\b",
   "categories": [
    "supplement",
    "hair"
   ]
  },
  "verdict": "caution",
  "message": "Biotin can make thyroid blood tests look wrong, so pause it for 3 to 5 days before testing and tell your doctor you take it.",
  "source_url": "https://www.thyroid.org/patient-thyroid-information/ct-for-patients/january-2022/vol-15-issue-1-p-7-8/"
 },
 {
  "condition": "depression",
  "product_class": "st_johns_wort",
  "match": {
   "name_regex": "\\b(st\\.? john'?s wort|hypericum)\\b",
   "categories": [
    "supplement",
    "mood"
   ]
  },
  "verdict": "avoid",
  "message": "St. John's wort combined with some antidepressants can cause a dangerous rise in serotonin, and it should not replace care from your provider.",
  "source_url": "https://www.nccih.nih.gov/health/tips/things-to-know-about-st-johns-wort-and-depression"
 },
 {
  "condition": "anxiety",
  "product_class": "st_johns_wort",
  "match": {
   "name_regex": "\\b(st\\.? john'?s wort|hypericum)\\b",
   "categories": [
    "supplement",
    "mood"
   ]
  },
  "verdict": "caution",
  "message": "St. John's wort interacts with many medicines, including some antidepressants, so check with your provider first.",
  "source_url": "https://www.nccih.nih.gov/health/st-johns-wort"
 },
 {
  "condition": "hypertension",
  "product_class": "st_johns_wort",
  "match": {
   "name_regex": "\\b(st\\.? john'?s wort|hypericum)\\b",
   "categories": [
    "supplement",
    "mood"
   ]
  },
  "verdict": "avoid",
  "message": "The American Heart Association lists St. John's wort among supplements to avoid if you have high blood pressure.",
  "source_url": "https://www.heart.org/-/media/Files/Health-Topics/High-Blood-Pressure/BP-Raisers.pdf?sc_lang=en"
 },
 {
  "condition": "hypertension",
  "product_class": "licorice",
  "match": {
   "name_regex": "\\b(licorice|liquorice|glycyrrhiz\\w*)\\b",
   "categories": [
    "supplement",
    "tea",
    "food"
   ]
  },
  "verdict": "avoid",
  "message": "Even small amounts of licorice root have been linked to serious effects in people with high blood pressure.",
  "source_url": "https://www.nccih.nih.gov/health/licorice-root"
 },
 {
  "condition": "kidney_disease",
  "product_class": "licorice",
  "match": {
   "name_regex": "\\b(licorice|liquorice|glycyrrhiz\\w*)\\b",
   "categories": [
    "supplement",
    "tea",
    "food"
   ]
  },
  "verdict": "avoid",
  "message": "Licorice root has been linked to serious effects in people with kidney conditions.",
  "source_url": "https://www.nccih.nih.gov/health/licorice-root"
 },
 {
  "condition": "heart_disease",
  "product_class": "licorice",
  "match": {
   "name_regex": "\\b(licorice|liquorice|glycyrrhiz\\w*)\\b",
   "categories": [
    "supplement",
    "tea",
    "food"
   ]
  },
  "verdict": "avoid",
  "message": "Licorice root can cause irregular heartbeat, especially in people with heart conditions.",
  "source_url": "https://www.nccih.nih.gov/health/licorice-root"
 },
 {
  "condition": "liver_disease",
  "product_class": "black_cohosh",
  "match": {
   "name_regex": "\\b(black cohosh|cimicifuga|actaea racemosa)\\b",
   "categories": [
    "supplement"
   ]
  },
  "verdict": "avoid",
  "message": "Rare but serious liver problems have been reported with black cohosh products.",
  "source_url": "https://www.nccih.nih.gov/health/black-cohosh"
 },
 {
  "condition": "bleeding_disorder",
  "product_class": "melatonin",
  "match": {
   "name_regex": "\\b(melatonin)\\b",
   "categories": [
    "supplement",
    "sleep"
   ]
  },
  "verdict": "caution",
  "message": "If you take a blood thinner, use melatonin only with medical supervision.",
  "source_url": "https://www.nccih.nih.gov/health/melatonin-what-you-need-to-know"
 },
 {
  "condition": "autoimmune",
  "product_class": "echinacea",
  "match": {
   "name_regex": "\\b(echinacea)\\b",
   "categories": [
    "supplement",
    "immune"
   ]
  },
  "verdict": "caution",
  "message": "Echinacea is used to stimulate the immune system and might interact with immunosuppressants, so check with your doctor.",
  "source_url": "https://www.nccih.nih.gov/health/echinacea"
 },
 {
  "condition": "autoimmune",
  "product_class": "probiotic",
  "match": {
   "name_regex": "\\b(probiotics?|lactobacillus|bifidobacter\\w*|saccharomyces)\\b",
   "categories": [
    "supplement",
    "gut"
   ]
  },
  "verdict": "caution",
  "message": "If you take medicine that lowers your immune response, ask your doctor before starting a probiotic.",
  "source_url": "https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety"
 },
 {
  "condition": "ibs_digestive",
  "product_class": "insoluble_fiber",
  "match": {
   "name_regex": "\\b(wheat bran|bran)\\b",
   "categories": [
    "supplement",
    "fiber",
    "food"
   ]
  },
  "verdict": "caution",
  "message": "Insoluble fiber like bran often worsens IBS symptoms.",
  "source_url": "https://www.nice.org.uk/guidance/cg61/chapter/Key-priorities-for-implementation"
 },
 {
  "condition": "ibs_digestive",
  "product_class": "inulin_fiber",
  "match": {
   "name_regex": "\\b(inulin|chicory root|fructo-?oligosaccharides?|fos|prebiotic fiber)\\b",
   "categories": [
    "supplement",
    "fiber",
    "gut"
   ]
  },
  "verdict": "caution",
  "message": "Inulin-type prebiotic fibers increased gas in some IBS studies.",
  "source_url": "https://www.nccih.nih.gov/health/providers/digest/irritable-bowel-syndrome-and-complementary-health-approaches-science"
 },
 {
  "condition": "ibs_digestive",
  "product_class": "sugar_alcohol",
  "match": {
   "name_regex": "\\b(sorbitol|mannitol|xylitol|maltitol|sugar.free)\\b",
   "categories": [
    "supplement",
    "snack",
    "gummy"
   ]
  },
  "verdict": "caution",
  "message": "Sweeteners ending in -ol, like sorbitol and xylitol, are FODMAPs that can trigger IBS symptoms.",
  "source_url": "https://www.niddk.nih.gov/health-information/digestive-diseases/irritable-bowel-syndrome/eating-diet-nutrition"
 },
 {
  "condition": "thyroid",
  "product_class": "psyllium",
  "match": {
   "name_regex": "\\b(psyllium|ispaghula|fiber supplement|metamucil)\\b",
   "categories": [
    "supplement",
    "fiber"
   ]
  },
  "verdict": "caution",
  "message": "Dietary fiber may affect how levothyroxine works, so ask your doctor about timing.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a682461.html"
 },
 {
  "condition": "diabetes",
  "product_class": "sugar_gummy_drink_mix",
  "match": {
   "name_regex": "\\b(gummy|gummies|gummie|drink mix|electrolyte mix|powdered drink|chewable)\\b",
   "categories": [
    "supplement",
    "drink",
    "snack"
   ]
  },
  "verdict": "caution",
  "message": "Gummies and drink mixes can contain added sugar that raises blood sugar, so check the label and count those carbs.",
  "source_url": "https://www.cdc.gov/diabetes/healthy-eating/people-with-diabetes-dessert.html"
 },
 {
  "condition": "insulin_resistance",
  "product_class": "sugar_gummy_drink_mix",
  "match": {
   "name_regex": "\\b(gummy|gummies|gummie|drink mix|electrolyte mix|powdered drink|chewable)\\b",
   "categories": [
    "supplement",
    "drink",
    "snack"
   ]
  },
  "verdict": "caution",
  "message": "Too much added sugar can contribute to type 2 diabetes, so check gummies and drink mixes for added sugar.",
  "source_url": "https://www.cdc.gov/nutrition/php/data-research/added-sugars.html"
 },
 {
  "condition": "diabetes",
  "product_class": "berberine",
  "match": {
   "name_regex": "\\b(berberine)\\b",
   "categories": [
    "supplement",
    "metabolic"
   ]
  },
  "verdict": "caution",
  "message": "Berberine may lower blood sugar and can interact with medicines, so talk to your provider before adding it.",
  "source_url": "https://www.nccih.nih.gov/health/diabetes-and-dietary-supplements-what-you-need-to-know"
 },
 {
  "condition": "insulin_resistance",
  "product_class": "berberine",
  "match": {
   "name_regex": "\\b(berberine)\\b",
   "categories": [
    "supplement",
    "metabolic"
   ]
  },
  "verdict": "caution",
  "message": "Berberine may modestly lower blood sugar and can interact with medicines, so check with your provider first.",
  "source_url": "https://www.nccih.nih.gov/health/in-the-news-berberine"
 },
 {
  "condition": "ibs_digestive",
  "product_class": "berberine",
  "match": {
   "name_regex": "\\b(berberine)\\b",
   "categories": [
    "supplement",
    "metabolic"
   ]
  },
  "verdict": "caution",
  "message": "Berberine commonly causes stomach pain, constipation, diarrhea or nausea.",
  "source_url": "https://www.nccih.nih.gov/health/in-the-news-berberine"
 },
 {
  "condition": "pcos",
  "product_class": "inositol",
  "match": {
   "name_regex": "\\b(inositol|myo-?inositol|d-?chiro)\\b",
   "categories": [
    "supplement",
    "fertility"
   ]
  },
  "verdict": "caution",
  "message": "Evidence on inositol for fertility with PMOS is low quality and uncertain, so treat it as an add-on to care, not a replacement.",
  "source_url": "https://www.cochrane.org/evidence/CD012378_inositol-women-diagnosis-polycystic-ovary-syndrome-and-subfertility"
 },
 {
  "condition": "infertility",
  "product_class": "inositol",
  "match": {
   "name_regex": "\\b(inositol|myo-?inositol|d-?chiro)\\b",
   "categories": [
    "supplement",
    "fertility"
   ]
  },
  "verdict": "caution",
  "message": "Evidence on inositol for fertility is low quality and uncertain, so discuss it with your fertility team.",
  "source_url": "https://www.cochrane.org/evidence/CD012378_inositol-women-diagnosis-polycystic-ovary-syndrome-and-subfertility"
 },
 {
  "condition": "anxiety",
  "product_class": "caffeine",
  "match": {
   "name_regex": "\\b(caffeine|guarana|green coffee|yerba mate|matcha|energy (drink|shot|supplement)|pre-?workout)\\b",
   "categories": [
    "supplement",
    "drink",
    "energy"
   ]
  },
  "verdict": "caution",
  "message": "Too much caffeine can cause anxiety, jitters and a racing heart.",
  "source_url": "https://www.fda.gov/consumers/consumer-updates/spilling-beans-how-much-caffeine-too-much"
 },
 {
  "condition": "hypertension",
  "product_class": "caffeine",
  "match": {
   "name_regex": "\\b(caffeine|guarana|green coffee|yerba mate|matcha|energy (drink|shot|supplement)|pre-?workout)\\b",
   "categories": [
    "supplement",
    "drink",
    "energy"
   ]
  },
  "verdict": "caution",
  "message": "Keep caffeine under 300 mg a day with high blood pressure, and avoid it if your blood pressure is not controlled.",
  "source_url": "https://www.heart.org/-/media/Files/Health-Topics/High-Blood-Pressure/BP-Raisers.pdf?sc_lang=en"
 },
 {
  "condition": "pms",
  "product_class": "caffeine",
  "match": {
   "name_regex": "\\b(caffeine|guarana|green coffee|yerba mate|matcha|energy (drink|shot|supplement)|pre-?workout)\\b",
   "categories": [
    "supplement",
    "drink",
    "energy"
   ]
  },
  "verdict": "caution",
  "message": "Cutting back on caffeine is one of the lifestyle steps suggested for PMS.",
  "source_url": "https://www.mayoclinic.org/diseases-conditions/premenstrual-syndrome/diagnosis-treatment/drc-20376787"
 },
 {
  "condition": "diabetes",
  "product_class": "boric_acid_yeast_otc",
  "match": {
   "name_regex": "\\b(boric acid|yeast infection|miconazole|clotrimazole|tioconazole)\\b",
   "categories": [
    "intimate",
    "vaginal_health"
   ]
  },
  "verdict": "caution",
  "message": "With diabetes, yeast infections can need longer treatment, so see a clinician if symptoms persist or come back.",
  "source_url": "https://www.cdc.gov/std/treatment-guidelines/candidiasis.htm"
 },
 {
  "condition": "heart_disease",
  "product_class": "minoxidil",
  "match": {
   "name_regex": "\\b(minoxidil|rogaine)\\b",
   "categories": [
    "hair"
   ]
  },
  "verdict": "caution",
  "message": "Tell your doctor before using minoxidil if you have heart disease, and get help right away for a racing heart or swelling.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a689003.html"
 },
 {
  "condition": "kidney_disease",
  "product_class": "minoxidil",
  "match": {
   "name_regex": "\\b(minoxidil|rogaine)\\b",
   "categories": [
    "hair"
   ]
  },
  "verdict": "caution",
  "message": "Tell your doctor before using minoxidil if you have kidney or liver disease.",
  "source_url": "https://medlineplus.gov/druginfo/meds/a689003.html"
 }
];

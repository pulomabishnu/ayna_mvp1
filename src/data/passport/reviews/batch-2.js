// Research pass 2 (AI-assisted, sourced). See ../reviews.js for the format.
// Batch 2: safety-priority products (supplements, topicals, vaginal inserts,
// devices, a few digital services). Every fact below names the page it came
// from. Facts we could not find are left out on purpose (unknown, not "no").

const D = '2026-10-13';
const BY = 'ayna research pass (AI-assisted), needs human sign-off';
const PRICE_DUE = '2026-10-27'; // pricing refresh: 14 days
const SAFETY_DUE = '2027-01-11'; // safety refresh: 90 days (used for services without pricing facts)

/** One sourced fact. */
const f = (value, source, source_url, source_type = 'brand') => ({ value, source, source_url, source_type, verified_at: D });

const base = (qa_status, extra) => ({
  qa_status,
  reviewed_by: BY,
  reviewed_at: D,
  last_checked: D,
  next_review_due: PRICE_DUE,
  ...extra,
});

const REVIEWS = {
  'p-queen-v-pop': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Could not find any Queen V product called "The Pop It" on retailer listings, the 2018 Queen V launch release, or search. The only Queen V vaginal suppository found is The Eraser, a homeopathic OTC drug (DailyMed) whose actives are Borax 3X HPUS, stone root, barberry and witch hazel in a PEG base, not boric acid in gelatin. Catalog name, ingredients ("boric acid, gelatin") and status ("Supplement") are unverified and likely wrong. Needs a human to confirm which product is meant, or remove it. Clinician review: vaginal suppository.',
    corrections: [
      {
        field: 'identity.name',
        catalog: 'Queen V The Pop It Suppositories',
        source_says: 'No "Pop It" product found; Queen V\'s vaginal suppository is "The Eraser" (14 suppositories, reusable applicator)',
        source_url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=ef41d72c-2c0e-4382-b617-b15ddf4f30b7',
      },
      {
        field: 'composition.ingredients',
        catalog: 'Boric acid, gelatin.',
        source_says: 'The Eraser actives: Borax 3X HPUS, Collinsonia canadensis 3X, Berberis vulgaris 6X, Hamamelis virginiana 6X; inactives: Bacillus coagulans, PEG 400, PEG 1450',
        source_url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=ef41d72c-2c0e-4382-b617-b15ddf4f30b7',
      },
      {
        field: 'safety.regulatory_status',
        catalog: 'Supplement',
        source_says: 'The Eraser is listed as a human OTC drug, unapproved homeopathic',
        source_url: 'https://dailymed.nlm.nih.gov/dailymed/fda/fdaDrugXsl.cfm?setid=ef41d72c-2c0e-4382-b617-b15ddf4f30b7',
      },
    ],
    facts: {},
  }),

  'p-phd-wash': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Checked the iHerb listing for pH-D Boric Acid Foam Wash, Sensitive (6 fl oz), the variant that matches the catalog\'s "boric acid + lavender". Label lists lavender oil and boric acid; no aloe, so the catalog ingredient list is incomplete/wrong. This is an external wash, not a vaginal insert (catalog route). pH-D also sells scented variants (e.g. Honey Lavender) with different formulas; confirm which one the link means.',
    corrections: [
      {
        field: 'composition.ingredients',
        catalog: 'Water, Boric Acid, Aloe, Lavender.',
        source_says: 'Water, decyl glucoside, propanediol, lactobacillus ferment, coco glucoside, glyceryl oleate, tetrasodium glutamate diacetate, citric acid, saccharide isomerate, sodium benzoate, potassium sorbate, lavender oil, boric acid (no aloe listed)',
        source_url: 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146',
      },
      { field: 'risk.route', catalog: 'vaginal_insert', source_says: 'For external use only (foam wash)', source_url: 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146' },
    ],
    facts: {
      'identity.variant': f('Boric Acid Foam Wash, Sensitive, 6 fl oz', 'iHerb listing', 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146', 'retailer'),
      'pricing.size_count': f('6 fl oz (177 ml)', 'iHerb listing', 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146', 'retailer'),
      'pricing.availability': f(['pH-D website', 'Walmart', 'iHerb', 'Vitacost', 'H-E-B', 'Stop & Shop', 'Hannaford'], 'retailer listings found in search', 'https://www.walmart.com/ip/pH-D-Feminine-Health-Boric-Acid-Sensitive-Foam-Wash-6-oz-1-Count/832169147', 'retailer'),
      'composition.ingredients': f(
        'Water, decyl glucoside, propanediol, lactobacillus ferment, coco glucoside, glyceryl oleate, tetrasodium glutamate diacetate, citric acid, saccharide isomerate, sodium benzoate, potassium sorbate, lavandula angustifolia (lavender) oil, boric acid',
        'iHerb listing (label panel)', 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146', 'retailer'),
      'composition.active_ingredients': f(['boric acid', 'lavender oil'], 'iHerb listing (manufacturer description pairs boric acid and lavender)', 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146', 'retailer'),
      'composition.fragrance': f('Marketed as unscented, but contains lavender oil (an essential oil)', 'iHerb listing', 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146', 'retailer'),
      'safety.warnings': f(['For external use only.', 'Avoid contact with eyes and mouth.'], 'iHerb listing (label warnings)', 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146', 'retailer'),
      'health.intended_use': f('External cleansing while bathing or showering; lather a small amount and rinse', 'iHerb listing (suggested use)', 'https://kh.iherb.com/pr/ph-d-feminine-health-boric-acid-foam-wash-sensitive-6-fl-oz-177-ml/152146', 'retailer'),
    },
  }),

  'p-womaness-me': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Womaness product page and Ulta listing. Price is $46.99 for 30 capsules (catalog says $40). Neither page shows mg per ingredient, so dosage is left unknown. Label carries a Prop 65 lead warning. Ashwagandha safety/interactions from NIH ODS. The "56% fewer symptoms" figure traces to one Pycnogenol study (Kohama & Negami 2013), not a study of this product. Clinician review: supplement with ashwagandha (pregnancy, thyroid, liver, sedative interactions).',
    corrections: [
      { field: 'pricing.price', catalog: '$40', source_says: '$46.99 for 30 capsules ($129 for 90-day supply)', source_url: 'https://womaness.com/products/me-no-pause' },
      { field: 'safety.regulatory_status', catalog: 'Clinically tested', source_says: 'Dietary supplement; statements not evaluated by the FDA. Cited studies are on individual ingredients, not this product.', source_url: 'https://womaness.com/products/me-no-pause' },
    ],
    facts: {
      'identity.variant': f('Me.No.Pause., 30 vegetable capsules (30-day supply)', 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'pricing.price': f('$46.99 (30 capsules); $129 for 90-day supply', 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'pricing.size_count': f('30 capsules, 1 per day', 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'pricing.availability': f(['Womaness website', 'Ulta'], 'Womaness product page; Ulta listing', 'https://www.ulta.com/p/menopause-dietary-supplements-pimprod2032482', 'retailer'),
      'composition.ingredients': f('Pycnogenol (French maritime pine bark extract), Bacognize (Bacopa monnieri extract), ashwagandha. Other ingredients: hydroxypropyl methylcellulose (vegetable capsule), rice flour', 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'composition.active_ingredients': f(['Pycnogenol (pine bark extract)', 'Bacopa monnieri extract (Bacognize)', 'ashwagandha'], 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'composition.allergens': f('Brand states vegan, gluten-free and soy-free; no estrogen, phytoestrogen or added hormones', 'Womaness product page (manufacturer information)', 'https://womaness.com/products/me-no-pause'),
      'safety.warnings': f([
        'Consult a doctor before use if pregnant, nursing, taking medications, have a medical condition, or have difficulty swallowing.',
        'Do not use if neck seal is broken or missing.',
        'California Prop 65 warning: can expose you to lead.',
        'Not evaluated by the FDA; not intended to diagnose, treat, cure, or prevent disease.',
      ], 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'safety.side_effects': f('Ashwagandha (an ingredient): usually mild upset stomach, loose stools, nausea, drowsiness; rare reports of liver injury', 'NIH Office of Dietary Supplements, Ashwagandha fact sheet', 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/?print=1', 'regulatory'),
      'safety.regulatory_status': f('Dietary supplement; claims not evaluated by the FDA', 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'safety.pregnancy': f('Label: consult a doctor before use if pregnant. NIH ODS: ashwagandha is possibly unsafe in pregnancy.', 'Womaness product page; NIH ODS ashwagandha fact sheet', 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/?print=1', 'regulatory'),
      'safety.breastfeeding': f('Label: consult a doctor before use if nursing. NIH ODS: ashwagandha is possibly unsafe while breastfeeding.', 'Womaness product page; NIH ODS ashwagandha fact sheet', 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/?print=1', 'regulatory'),
      'safety.medication_interactions': f('Ashwagandha may interact with thyroid, diabetes and blood pressure medicines, sedatives, and immunosuppressants (NIH ODS). Label: consult a doctor if taking medications.', 'NIH ODS ashwagandha fact sheet', 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/?print=1', 'regulatory'),
      'safety.age_restriction': f('Directions are for adults', 'Womaness product page', 'https://womaness.com/products/me-no-pause'),
      'health.intended_use': f('Daily supplement marketed for menopause symptoms (hot flashes, night sweats, sleep, focus); 1 capsule daily with water, ideally with a meal', 'Womaness product page (manufacturer information)', 'https://womaness.com/products/me-no-pause'),
      'evidence.sources': f([
        { title: 'Kohama & Negami 2013, Pycnogenol in perimenopausal women (J Reprod Med 58:39-46), cited by brand', url: 'https://womaness.com/products/me-no-pause', evidence_type: 'ingredient_research', supports: 'Pycnogenol and menopause symptom scores; one study, ingredient not product' },
        { title: 'NIH ODS: Ashwagandha fact sheet', url: 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/?print=1', evidence_type: 'regulatory', supports: 'ashwagandha safety, pregnancy and interaction cautions' },
      ], 'Womaness product page; NIH ODS', 'https://womaness.com/products/me-no-pause'),
      'evidence.claims': f([
        { claim: 'Pycnogenol reduced menopause symptoms (brand cites 56%)', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://womaness.com/products/me-no-pause', product_specific: false },
        { claim: 'Bacopa improves memory/attention', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://womaness.com/products/me-no-pause', product_specific: false },
      ], 'Womaness product page citations', 'https://womaness.com/products/me-no-pause'),
    },
  }),

  'p-winx-uti-pain-relief': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Winx product page (price, FSA/HSA), the retail label panel (Giant Food listing, 24 tablets) and the Stix/Get Stix OTC label (Winx was formerly Stix), plus MedlinePlus for phenazopyridine. Label: unapproved OTC drug ("not found by FDA to be safe and effective"), 2-day limit, G6PD and kidney cautions, Prop 65 listing. Product page text mixes in copy from the daily supplement (mentions 60 capsules); the label shows a 24-tablet box. Clinician review: OTC drug, pregnancy/breastfeeding ask a professional.',
    facts: {
      'identity.variant': f('Fast-Acting Maximum Strength UTI Pain Relief, phenazopyridine HCl 99.5 mg, 24 tablets', 'Giant Food retail listing (label panel)', 'https://giantfoodstores.com/groceries/health-beauty/pain-fever/urinary-pain-relief/winx-health-fast-acting-maximum-strength-uti-pain-relief-tablets-24-ct-box.html', 'retailer'),
      'pricing.price': f('$10.50 (on sale at time of check)', 'Winx product page', 'https://hellowinx.com/products/uti-fast-acting-pain-relief'),
      'pricing.size_count': f('24 tablets', 'Giant Food retail listing', 'https://giantfoodstores.com/groceries/health-beauty/pain-fever/urinary-pain-relief/winx-health-fast-acting-maximum-strength-uti-pain-relief-tablets-24-ct-box.html', 'retailer'),
      'pricing.fsa_hsa': f('eligible (per brand)', 'Winx product page', 'https://hellowinx.com/products/uti-fast-acting-pain-relief'),
      'pricing.availability': f(['Winx website', 'Giant Food', 'Hannaford', 'Martin\'s'], 'Winx product page; grocery retailer listings', 'https://giantfoodstores.com/groceries/health-beauty/pain-fever/urinary-pain-relief/winx-health-fast-acting-maximum-strength-uti-pain-relief-tablets-24-ct-box.html', 'retailer'),
      'composition.ingredients': f('Active: phenazopyridine hydrochloride 99.5 mg. Inactive: corn starch, croscarmellose sodium, hypromellose, lactose, magnesium stearate, microcrystalline cellulose, polyethylene glycol, polyvinylpyrrolidone, pregelatinized starch, silicon dioxide, sodium starch glycolate, talc, triacetin', 'Giant Food retail listing (label panel)', 'https://giantfoodstores.com/groceries/health-beauty/pain-fever/urinary-pain-relief/winx-health-fast-acting-maximum-strength-uti-pain-relief-tablets-24-ct-box.html', 'retailer'),
      'composition.active_ingredients': f(['phenazopyridine hydrochloride 99.5 mg (urinary analgesic)'], 'OTC label (Stix Maximum Strength Urinary Pain Relief)', 'https://otclabels.com/lib/otc/otc-meds/stix-maximum-strength-urinary-pain-relief/', 'official_label'),
      'composition.dosage': f(['phenazopyridine HCl 99.5 mg per tablet; adults and 12+: 2 tablets 3 times daily with water, with or after meals; max 2 days (12 tablets) without a doctor'], 'OTC label', 'https://otclabels.com/lib/otc/otc-meds/stix-maximum-strength-urinary-pain-relief/', 'official_label'),
      'composition.allergens': f('Contains lactose. Label: ask a doctor first if allergic to foods, preservatives or dyes', 'Giant Food retail listing (label panel)', 'https://giantfoodstores.com/groceries/health-beauty/pain-fever/urinary-pain-relief/winx-health-fast-acting-maximum-strength-uti-pain-relief-tablets-24-ct-box.html', 'retailer'),
      'safety.warnings': f([
        'Do not exceed recommended dosage; do not use more than 2 days without a doctor.',
        'Do not use with G6PD deficiency unless a physician approves.',
        'Ask a doctor first with kidney disease, allergies to foods/preservatives/dyes, or a past reaction to phenazopyridine.',
        'Urine turns reddish-orange and can stain clothing (and contact lenses, per MedlinePlus).',
        'Stop and ask a doctor if symptoms last more than 2 days or an adverse reaction is suspected.',
        'Long-term use caused tumors in rats and mice; listed under California Prop 65.',
        'Not an antibiotic; does not cure a UTI.',
      ], 'retail label panel; MedlinePlus', 'https://medlineplus.gov/druginfo/meds/a682231.html', 'official_label'),
      'safety.side_effects': f('Stomach upset; reddish-orange urine. MedlinePlus also lists headache and dizziness, and says to call a doctor for yellow skin/eyes, fever, confusion, bluish skin, shortness of breath, rash or reduced urine', 'OTC label; MedlinePlus', 'https://medlineplus.gov/druginfo/meds/a682231.html', 'regulatory'),
      'safety.regulatory_status': f('OTC drug, marketing category "unapproved drug other"; label states it has not been found by FDA to be safe and effective', 'OTC label (Stix Maximum Strength Urinary Pain Relief)', 'https://otclabels.com/lib/otc/otc-meds/stix-maximum-strength-urinary-pain-relief/', 'official_label'),
      'safety.pregnancy': f('Label: if pregnant, ask a health professional before use', 'OTC label', 'https://otclabels.com/lib/otc/otc-meds/stix-maximum-strength-urinary-pain-relief/', 'official_label'),
      'safety.breastfeeding': f('Label: if breastfeeding, ask a health professional before use', 'OTC label', 'https://otclabels.com/lib/otc/otc-meds/stix-maximum-strength-urinary-pain-relief/', 'official_label'),
      'safety.medication_interactions': f('No specific interactions listed. MedlinePlus: tell your doctor about all medicines and supplements; can interfere with urine glucose and ketone tests', 'MedlinePlus phenazopyridine', 'https://medlineplus.gov/druginfo/meds/a682231.html', 'regulatory'),
      'safety.age_restriction': f('Adults and children 12 and over; under 12 ask a doctor', 'OTC label', 'https://otclabels.com/lib/otc/otc-meds/stix-maximum-strength-urinary-pain-relief/', 'official_label'),
      'health.intended_use': f('Short-term relief of urinary pain, burning, urgency and frequency from a UTI while getting care; not a treatment for the infection', 'OTC label; MedlinePlus', 'https://medlineplus.gov/druginfo/meds/a682231.html', 'official_label'),
      'evidence.claims': f([
        { claim: 'Relieves urinary pain and burning short-term', strength: 'moderate', evidence_type: 'regulatory', source_url: 'https://medlineplus.gov/druginfo/meds/a682231.html', product_specific: false },
        { claim: 'Brand: "clinically proven", "urologist approved"', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://hellowinx.com/products/uti-fast-acting-pain-relief', product_specific: true },
      ], 'MedlinePlus; Winx product page', 'https://medlineplus.gov/druginfo/meds/a682231.html', 'regulatory'),
    },
  }),

  'p-winx-uti-daily-defense': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Winx product page and vitamins collection. $28, 60 capsules (monthly supply), FSA/HSA eligible per brand. Supplement facts exist only as an image; amounts not readable, so dosage left unknown. Page names d-mannose, cranberry and vitamin C; turmeric (catalog) not confirmed in page text. No citations on the page. Cranberry safety/interaction from NCCIH. Clinician review: supplement for UTI prevention.',
    facts: {
      'identity.variant': f('Urinary Daily Defense (UTI Daily Protection Supplement), 60 capsules', 'Winx product page', 'https://hellowinx.com/products/uti-daily-protection-supplement'),
      'pricing.price': f('$28 (60 capsules; 15% off with subscription)', 'Winx product page', 'https://hellowinx.com/products/uti-daily-protection-supplement'),
      'pricing.size_count': f('60 capsules (monthly supply)', 'Winx product page', 'https://hellowinx.com/products/uti-daily-protection-supplement'),
      'pricing.fsa_hsa': f('eligible (per brand)', 'Winx product page', 'https://hellowinx.com/products/uti-daily-protection-supplement'),
      'pricing.availability': f(['Winx website'], 'Winx vitamins collection', 'https://hellowinx.com/collections/vitamins'),
      'composition.active_ingredients': f(['d-mannose', 'cranberry', 'vitamin C'], 'Winx product page (named ingredients, amounts not in text)', 'https://hellowinx.com/products/uti-daily-protection-supplement'),
      'safety.side_effects': f('Cranberry (ingredient): generally safe; very large amounts can cause stomach upset and diarrhea', 'NCCIH Cranberry', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'safety.medication_interactions': f('Cranberry: evidence on a warfarin interaction is conflicting; talk with a provider if taking warfarin or other medicines', 'NCCIH Cranberry', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'safety.pregnancy': f('Cranberry: evidence not conclusive above food amounts; consult a provider if pregnant (no label statement found)', 'NCCIH Cranberry', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'safety.breastfeeding': f('Cranberry: consult a provider if breastfeeding (no label statement found)', 'NCCIH Cranberry', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'health.intended_use': f('Daily supplement marketed to help protect urinary tract health; not a UTI treatment', 'Winx product page (manufacturer information)', 'https://hellowinx.com/products/uti-daily-protection-supplement'),
      'evidence.sources': f([
        { title: 'NCCIH: Cranberry, usefulness and safety', url: 'https://www.nccih.nih.gov/health/cranberry', evidence_type: 'regulatory', supports: 'cranberry may modestly reduce recurrent UTIs in some women; not a treatment' },
      ], 'NCCIH', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Cranberry may lower risk of recurrent symptomatic UTIs in women (about 25%, inconsistent findings)', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/cranberry', product_specific: false },
        { claim: 'Brand: "science-backed" protection', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://hellowinx.com/products/uti-daily-protection-supplement', product_specific: true },
      ], 'NCCIH; Winx product page', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
    },
  }),

  'p-winx-vaginal-probiotic': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Winx product page and Winx probiotic guide. $28, 60-day supply, 15 billion CFU, FSA/HSA eligible per brand. Guide names Lactobacillus (species not given), B. lactis Bi-07 and inulin; catalog strain list (acidophilus, rhamnosus, reuteri) could not be confirmed from page text (label is an image). Brand says it is not a treatment for yeast infection or BV and to check with a doctor if pregnant or nursing.',
    facts: {
      'identity.variant': f('Vaginal Health Probiotic, 60-day supply, 15 billion CFU', 'Winx product page', 'https://hellowinx.com/products/vaginal-health-probiotic'),
      'pricing.price': f('$28', 'Winx product page', 'https://hellowinx.com/products/vaginal-health-probiotic'),
      'pricing.size_count': f('60-day supply, 1 capsule daily', 'Winx product page; Winx probiotic guide', 'https://hellowinx.com/blogs/real-talk/guide-to-vaginal-health-probiotic'),
      'pricing.fsa_hsa': f('eligible (per brand)', 'Winx product page', 'https://hellowinx.com/products/vaginal-health-probiotic'),
      'composition.dosage': f(['15 billion CFU per serving; 1 capsule daily with water'], 'Winx product page; Winx probiotic guide', 'https://hellowinx.com/blogs/real-talk/guide-to-vaginal-health-probiotic'),
      'composition.allergens': f('Brand states vegan, non-GMO, free of gluten, soy and dairy', 'Winx probiotic guide (manufacturer information)', 'https://hellowinx.com/blogs/real-talk/guide-to-vaginal-health-probiotic'),
      'safety.warnings': f(['Not a treatment for infections; brand points people with a current yeast infection or BV to other products.', 'Check with a doctor before starting if pregnant or nursing.'], 'Winx probiotic guide', 'https://hellowinx.com/blogs/real-talk/guide-to-vaginal-health-probiotic'),
      'safety.pregnancy': f('Brand: check with your doctor before starting while pregnant', 'Winx probiotic guide', 'https://hellowinx.com/blogs/real-talk/guide-to-vaginal-health-probiotic'),
      'safety.breastfeeding': f('Brand: check with your doctor before starting while nursing', 'Winx probiotic guide', 'https://hellowinx.com/blogs/real-talk/guide-to-vaginal-health-probiotic'),
      'health.intended_use': f('Daily oral probiotic marketed to support vaginal microbiome balance; not an infection treatment', 'Winx probiotic guide (manufacturer information)', 'https://hellowinx.com/blogs/real-talk/guide-to-vaginal-health-probiotic'),
      'evidence.claims': f([
        { claim: 'Brand: 15 billion CFU to balance the vaginal microbiome', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://hellowinx.com/products/vaginal-health-probiotic', product_specific: true },
      ], 'Winx product page (no citations given)', 'https://hellowinx.com/products/vaginal-health-probiotic'),
    },
  }),

  'p-winx-pregnancy-tests': base('in_review', {
    recall_status: 'unknown',
    notes:
      'Checked Winx product page: $13 for 2 tests ($11.05 subscribe), 10-test option, FSA/HSA eligible, claims over 99% accurate up to 6 days before a missed period. Page does not state sensitivity (mIU/mL) or FDA clearance number; not verified here.',
    facts: {
      'identity.variant': f('Early Detection Pregnancy Test, 2-pack', 'Winx product page', 'https://hellowinx.com/products/pregnancy-tests'),
      'pricing.price': f('$13 for 2 tests ($11.05 with subscription)', 'Winx product page', 'https://hellowinx.com/products/pregnancy-tests'),
      'pricing.size_count': f('2 tests (10-test option also listed)', 'Winx product page', 'https://hellowinx.com/products/pregnancy-tests'),
      'pricing.fsa_hsa': f('eligible (per brand)', 'Winx product page', 'https://hellowinx.com/products/pregnancy-tests'),
      'pricing.availability': f(['Winx website'], 'Winx product page', 'https://hellowinx.com/products/pregnancy-tests'),
      'health.intended_use': f('At-home urine hCG pregnancy test; one line not pregnant, two lines pregnant', 'Winx product page', 'https://hellowinx.com/products/pregnancy-tests'),
      'evidence.claims': f([
        { claim: 'Over 99% accurate up to six days before a missed period', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://hellowinx.com/products/pregnancy-tests', product_specific: true },
      ], 'Winx product page (no data shown)', 'https://hellowinx.com/products/pregnancy-tests'),
    },
  }),

  'p-winx-vaginal-health-test-treat': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Winx product page: $15 for 2 vaginal pH tests read by app scan, with optional same-day telehealth Rx by text. Rx treatments (yeast, BV) sold separately at $54.99 each; prescribing provider and states served not stated. FDA status not stated on page. Clinician review: test-to-prescription flow.',
    facts: {
      'identity.variant': f('Vaginal Health Test + Treat: 2 vaginal pH tests, app-read, with optional telehealth', 'Winx product page', 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections'),
      'pricing.price': f('$15 for 2 tests ($12.75 with subscription); Rx treatments $54.99 each, separate', 'Winx product page', 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections'),
      'pricing.size_count': f('2 vaginal pH tests', 'Winx product page', 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections'),
      'pricing.fsa_hsa': f('eligible (per brand)', 'Winx product page', 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections'),
      'pricing.availability': f(['Winx website'], 'Winx product page', 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections'),
      'health.intended_use': f('Check vaginal pH at home, read results in the Winx app, then optionally connect with a clinician online for treatment', 'Winx product page', 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections'),
    },
  }),

  'p-neycher-vaginal-moisturizer': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Neycher product page. Price now $33.30 per box of 10 (catalog $32.91); subscriptions $29.97/mo or $26.64/box quarterly. Ingredient list matches the catalog and adds sodium salt, phosphatidylcholine and semi-synthetic triglycerides (base). Made in Italy by Gruppo FarmaImpresa in an FDA-registered facility per brand; device/drug status not stated. Page does not address pregnancy, breastfeeding or condoms. Clinician review: vaginal suppository.',
    corrections: [{ field: 'pricing.price', catalog: '$32.91', source_says: '$33.30 per box of 10 (subscription from $26.64)', source_url: 'https://www.helloneycher.com/product/vaginal-moisturizer' }],
    facts: {
      'identity.variant': f('Vaginal Moisturizer, hyaluronic acid 10 mg, box of 10 vaginal suppositories', 'Neycher product page', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
      'pricing.price': f('$33.30 per box (subscription $29.97/month or $26.64/box on 3-month plan)', 'Neycher product page', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
      'pricing.size_count': f('10 vaginal suppositories', 'Neycher product page', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
      'pricing.availability': f(['Neycher website', 'Amazon'], 'Neycher product page; Amazon listing found in search', 'https://www.amazon.com/Neycher-Hyaluronic-Vaginal-Suppositories-Vitamin/dp/B0DN4JZ9VV', 'retailer'),
      'composition.ingredients': f('Hyaluronic acid sodium salt (10 mg), vitamin E, vitamin A, lactic acid, polycarbophil, tea tree oil, 18-beta-glycyrrhetinic acid, phosphatidylcholine, semi-synthetic triglycerides', 'Neycher product page', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
      'composition.active_ingredients': f(['hyaluronic acid 10 mg', 'polycarbophil', '18-beta-glycyrrhetinic acid', 'lactic acid', 'vitamins E and A'], 'Neycher product page', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
      'safety.warnings': f(['Stop and check with a doctor if irritation is strong or lasts.', 'Check with a doctor if on any treatment.', 'Mild tingling and light white residue can occur.'], 'Neycher product page and FAQ', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
      'safety.regulatory_status': f('Made in Italy (Gruppo FarmaImpresa) in an FDA-registered facility under GMP/ISO, per brand; hormone-free. No FDA clearance or approval stated.', 'Neycher product page (manufacturer information)', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
      'health.intended_use': f('Hormone-free vaginal suppository for dryness: one nightly for 10 nights, then every 3 to 5 nights', 'Neycher product page', 'https://www.helloneycher.com/product/vaginal-moisturizer'),
    },
  }),

  'p-neycher-odor-be-gone': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Neycher shop page lists Odor Be Gone at $33.30 (catalog $29.97). Product page could not be fetched (link blocked by tool), so the box ingredients in the catalog (boric acid 300 mg, chlorhexidine, etc.) were NOT re-verified. Amazon listings show related Neycher BV suppositories; not confirmed as the same SKU. Clinician review: boric acid + chlorhexidine vaginal suppository.',
    corrections: [{ field: 'pricing.price', catalog: '$29.97 (10 suppositories)', source_says: '$33.30 starting price', source_url: 'https://www.helloneycher.com/shop?productfilter=Menopause' }],
    facts: {
      'pricing.price': f('From $33.30', 'Neycher shop page', 'https://www.helloneycher.com/shop?productfilter=Menopause'),
      'health.intended_use': f('Brand describes it as fast freshness for odor, pH and yeast balance (manufacturer information)', 'Neycher shop page', 'https://www.helloneycher.com/shop?productfilter=Menopause'),
    },
  }),

  'p-neycher-hydrobloom-gel': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Neycher product page: $22.19 (catalog $25.97), full INCI list. Formula contains imidazolidinyl urea (a formaldehyde-releasing preservative) and lavender flower water, which the catalog list omits. HA amount not on page (Amazon title says 20 mg). Amazon lists 1 fl oz; catalog says 30 ml. Pregnancy/breastfeeding/condoms not addressed. Used internally with an applicator, so clinician review.',
    corrections: [
      { field: 'pricing.price', catalog: '$25.97', source_says: '$22.19 (subscription from $17.75)', source_url: 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel' },
      { field: 'composition.ingredients', catalog: 'list without preservatives', source_says: 'Full INCI includes imidazolidinyl urea, disodium EDTA, potassium sorbate, PEG-40 hydrogenated castor oil, polysorbate 20', source_url: 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel' },
    ],
    facts: {
      'identity.variant': f('HydroBloom Moisturizing Gel, tube with applicator, 1 fl oz', 'Neycher product page; Amazon listing title', 'https://www.amazon.com/Neycher-Hydrobloom-Moisturizing-pH-Balanced-Moisturizer/dp/B0G822S3QN'),
      'pricing.price': f('$22.19 (subscription $19.97/month or $17.75/box quarterly)', 'Neycher product page', 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel'),
      'pricing.size_count': f('1 fl oz', 'Amazon listing title', 'https://www.amazon.com/Neycher-Hydrobloom-Moisturizing-pH-Balanced-Moisturizer/dp/B0G822S3QN', 'retailer'),
      'pricing.availability': f(['Neycher website', 'Amazon'], 'Neycher product page; Amazon', 'https://www.amazon.com/Neycher-Hydrobloom-Moisturizing-pH-Balanced-Moisturizer/dp/B0G822S3QN', 'retailer'),
      'composition.ingredients': f('Aqua, imidazolidinyl urea, disodium EDTA, glycerin, aloe barbadensis leaf juice, potassium sorbate, ribes nigrum fruit extract, lavandula angustifolia flower water, sodium hyaluronate, chamomilla recutita flower extract, calendula officinalis flower extract, lactic acid, PEG-40 hydrogenated castor oil, tocopheryl acetate, polysorbate 20, linum usitatissimum seed oil, retinyl palmitate, hydroxyethylcellulose', 'Neycher product page', 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel'),
      'composition.active_ingredients': f(['sodium hyaluronate (hyaluronic acid)', 'aloe', 'lactic acid', 'vitamin E', 'vitamin A (retinyl palmitate)'], 'Neycher product page', 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel'),
      'composition.fragrance': f('No added fragrance listed; contains lavender flower water and botanical extracts', 'Neycher product page', 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel'),
      'composition.allergens': f('No allergen statement. Botanicals: lavender, chamomile, calendula, aloe, linseed. Contains imidazolidinyl urea (preservative)', 'Neycher product page', 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel'),
      'safety.warnings': f(['Stop and check with a doctor if irritation occurs or does not settle.', 'Check with a doctor if using any prescription treatment.'], 'Neycher product page', 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel'),
      'health.intended_use': f('Vulvar and internal vaginal moisturizer for dryness: daily for 6 days, then every few days as needed', 'Neycher product page', 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel'),
    },
  }),

  'p-neycher-botanical-vulva-balm': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Botanical Vulva Balm does not appear on the current Neycher shop listing (HydroBloom Gel, Vaginal Moisturizer, Odor Be Gone, bundles only) and search found no live page. May be discontinued; confirm before showing. Catalog facts left as is, unverified.',
    corrections: [{ field: 'pricing.availability', catalog: 'live at neycher.com/products/botanical-vulva-balm', source_says: 'Not listed in the current Neycher shop', source_url: 'https://www.helloneycher.com/shop?productfilter=Menopause' }],
    facts: {},
  }),

  'p-neycher-goodbye-dryness-bundle': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Neycher shop now lists the "goodbye-dryness-bundle" URL as "Dry No More" from $55.49 (catalog $49.97). Bundle contents not shown on the shop page. Includes an internal product per catalog, so needs clinician review once contents are confirmed.',
    corrections: [
      { field: 'identity.name', catalog: 'Goodbye, Dryness Bundle', source_says: 'Dry No More (same URL slug)', source_url: 'https://www.helloneycher.com/shop?productfilter=Menopause' },
      { field: 'pricing.price', catalog: '$49.97', source_says: 'From $55.49', source_url: 'https://www.helloneycher.com/shop?productfilter=Menopause' },
    ],
    facts: {
      'pricing.price': f('From $55.49', 'Neycher shop page', 'https://www.helloneycher.com/shop?productfilter=Menopause'),
      'pricing.availability': f(['Neycher website'], 'Neycher shop page', 'https://www.helloneycher.com/shop?productfilter=Menopause'),
    },
  }),

  'p-gina-vaginal-moisturizing-glides': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Checked gina product page and shop. $101 is the 3-month subscription (36 glides, regular $126); one-time options start at $42. Catalog pairs $101 with "box of 12", which mixes two variants. Single ingredient: coconut oil. Filled in an FDA-registered GMP facility; no FDA clearance stated. Page does not address pregnancy, breastfeeding or latex-condom compatibility (oils can matter for latex; not stated by brand, so left unknown). Brand cites a self-reported survey (PMC10350307). Clinician review also advised: vaginal insert.',
    corrections: [{ field: 'pricing.price', catalog: '$101.00 (box of 12)', source_says: '$101 = 3-month subscription, 36 glides (regular $126); from $42 otherwise', source_url: 'https://getgina.com/products/vaginal-moisturizing-glides' }],
    facts: {
      'identity.variant': f('Vaginal Moisturizing Glides, 3-month subscription (36 glides)', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'pricing.price': f('$101 for 36 glides (3-month subscription, regular $126); from $42 for smaller options', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'pricing.size_count': f('36 glides per 3-month subscription; up to 3 uses per week', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'pricing.availability': f(['gina website'], 'gina shop page', 'https://getgina.com/collections/all'),
      'composition.ingredients': f('100% pure, extra virgin, unrefined, cold-pressed coconut oil', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'composition.active_ingredients': f(['coconut oil'], 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'composition.fragrance': f('No artificial fragrance or dyes, per brand', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'composition.allergens': f('Single ingredient: coconut oil (no allergen statement on page)', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'safety.regulatory_status': f('Filled at an FDA-registered facility under GMP, per brand; no FDA clearance or approval stated', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'safety.warnings': f(['Not a substitute for advice from a licensed medical professional; not intended to diagnose, prevent, cure or treat any condition.', 'Store chilled; re-solidify in the fridge if melted.'], 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'health.intended_use': f('Solid coconut oil glide inserted vaginally for dryness, up to 3 times a week before bed or sex', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
      'evidence.sources': f([
        { title: 'Coconut oil protocol consumer survey (PMC10350307), cited by brand', url: 'https://getgina.com/pages/nih-pmc-study-insights', evidence_type: 'ingredient_research', supports: 'self-reported improvement in dryness with a coconut oil protocol; not a controlled trial' },
      ], 'gina study page', 'https://getgina.com/pages/nih-pmc-study-insights'),
      'evidence.claims': f([
        { claim: '83% reported improved dryness during intercourse (self-reported survey)', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://getgina.com/products/vaginal-moisturizing-glides', product_specific: false },
      ], 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
    },
  }),

  'p-gina-insertion-applicator-refills': base('in_review', {
    recall_status: 'unknown',
    notes: 'gina shop lists Insertion Applicator Refills at $10.00 (matches catalog). Count and material not shown on the shop page; product page not reachable with our tools. Accessory, no actives (catalog route "topical" is a misfit).',
    facts: {
      'pricing.price': f('$10.00', 'gina shop page', 'https://getgina.com/collections/all'),
      'pricing.availability': f(['gina website'], 'gina shop page', 'https://getgina.com/collections/all'),
      'health.intended_use': f('Applicator for inserting gina Vaginal Moisturizing Glides (the Starter Kit includes one)', 'gina product page', 'https://getgina.com/products/vaginal-moisturizing-glides'),
    },
  }),

  'p-good-kitty-uti-biome-shield': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Good Kitty product page. $99 starter kit (60 capsules, canister, pill pendant); refill subscription $66.30 (catalog says $84.15/mo, not seen). Per capsule: 38 mg soluble PACs (PACphenol); D-mannose, vitamin D3 and zinc picolinate (BioBlocD3) with individual amounts not shown, 500 mg D-mannose only in a comparison table. Page claims "no anti-caking agents" yet lists silicon dioxide and magnesium stearate. No pregnancy/breastfeeding/medication warnings on page beyond spacing from antibiotics. Cranberry interaction info from NCCIH. Clinician review: UTI prevention supplement.',
    corrections: [{ field: 'pricing.price', catalog: '$99 starter kit (or $84.15/mo subscription)', source_says: '$99 starter kit; refill subscription orders $66.30', source_url: 'https://goodkittyco.com/products/uti-biome-shield' }],
    facts: {
      'identity.variant': f('UTI Biome Shield Starter Kit: 60 capsules + stainless canister + pill pendant', 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'pricing.price': f('$99 starter kit; refill subscription $66.30', 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'pricing.size_count': f('60 capsules (1 daily, or 2 before sex)', 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'pricing.fsa_hsa': f('HSA/FSA funds accepted (per brand)', 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'pricing.availability': f(['Good Kitty website'], 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'composition.ingredients': f('PACphenol (cranberry soluble PACs and polyphenols, 38 mg PACs); BioBlocD3 (D-mannose, vitamin D3, zinc picolinate). Other: purple carrot capsule, microcrystalline cellulose, magnesium stearate, silicon dioxide', 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'composition.active_ingredients': f(['cranberry PACs 38 mg', 'D-mannose (500 mg per brand comparison table)', 'vitamin D3', 'zinc picolinate'], 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'composition.dosage': f(['38 mg soluble PACs per capsule', 'D-mannose 500 mg (comparison table, not supplement facts)', 'vitamin D3 and zinc amounts not shown'], 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'composition.allergens': f('Brand states no gluten, GMOs, dairy, eggs, soy or casein; certified non-GMO and gluten-free', 'Good Kitty product page (manufacturer information)', 'https://goodkittyco.com/products/uti-biome-shield'),
      'safety.warnings': f(['Take 2 hours before or after antibiotics.', 'Take with food if you have a sensitive stomach.', 'Not a treatment: a current UTI needs antibiotics.'], 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'safety.regulatory_status': f('Dietary supplement made in FDA-registered, GMP-certified facilities (per brand)', 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'safety.medication_interactions': f('Brand: separate from antibiotics by 2 hours. Cranberry: conflicting evidence on warfarin; talk to a provider (NCCIH)', 'Good Kitty product page; NCCIH Cranberry', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'safety.pregnancy': f('No label statement found. NCCIH: cranberry above food amounts not proven safe in pregnancy; consult a provider', 'NCCIH Cranberry', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'safety.breastfeeding': f('No label statement found. NCCIH: consult a provider before cranberry supplements while breastfeeding', 'NCCIH Cranberry', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'health.intended_use': f('Daily supplement marketed to prevent recurrent UTIs; not a treatment', 'Good Kitty product page', 'https://goodkittyco.com/products/uti-biome-shield'),
      'evidence.sources': f([
        { title: 'NCCIH: Cranberry, usefulness and safety', url: 'https://www.nccih.nih.gov/health/cranberry', evidence_type: 'regulatory', supports: 'cranberry may modestly reduce recurrent UTIs in some women; inconsistent findings' },
        { title: 'Good Kitty: How UTI Biome Shield works', url: 'https://goodkittyco.com/pages/how-it-works', evidence_type: 'manufacturer', supports: 'brand mechanism claims' },
      ], 'NCCIH; Good Kitty', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Cranberry PACs may reduce recurrent UTIs', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/cranberry', product_specific: false },
        { claim: 'Brand: "clinically proven"', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://goodkittyco.com/products/uti-biome-shield', product_specific: true },
      ], 'NCCIH; Good Kitty product page', 'https://www.nccih.nih.gov/health/cranberry', 'regulatory'),
    },
  }),

  'p-oboo-smooth-daily': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Oboo shop no longer lists Smooth Daily Vulva Balm on its own; it appears only inside the Daily Comfort Duo ($56, sold out at check). Catalog price $36 and standalone link could not be confirmed. Ingredients not found.',
    corrections: [{ field: 'pricing.availability', catalog: '$36 standalone at oboo.love/products/smooth-daily-vulva-balm', source_says: 'Only in Daily Comfort Duo bundle ($56, sold out)', source_url: 'https://oboo.love/collections/all' }],
    facts: {},
  }),

  'p-oboo-smooth-arousal': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Oboo shop no longer lists Smooth Arousal Vulva Balm on its own; it appears only inside the Goodnight Gorgeous kit ($159, sold out at check). Catalog price $36 and standalone link could not be confirmed. Ingredients not found.',
    corrections: [{ field: 'pricing.availability', catalog: '$36 standalone at oboo.love/products/smooth-arousal-vulva-balm', source_says: 'Only in Goodnight Gorgeous kit ($159, sold out)', source_url: 'https://oboo.love/collections/all' }],
    facts: {},
  }),

  'p-oboo-loob-daily': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Checked Oboo product page. $20 (catalog $28); 4 oz shown unavailable, 2 oz travel size listed. Full INCI found: contains black cohosh, chaste tree and muira puama extracts plus sweet orange oil, which matters for people avoiding herbal hormone-active botanicals or citrus oils. Condom-friendly per brand. No pregnancy statement.',
    corrections: [{ field: 'pricing.price', catalog: '$28', source_says: '$20', source_url: 'https://oboo.love/products/loob-daily' }],
    facts: {
      'identity.variant': f('Loob Daily Moisturizer, 2 oz travel size (4 oz listed unavailable)', 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'pricing.price': f('$20', 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'pricing.size_count': f('2 oz / 60 ml (4 oz / 120 ml unavailable at check)', 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'pricing.availability': f(['Oboo website'], 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'composition.ingredients': f('Aqua, aloe vera extract*, vegetable glycerin, black cohosh root extract*, muira puama bark extract*, chaste tree fruit extract*, squalane (olive), sweet orange oil*, sodium hyaluronate, leuconostoc/radish root ferment filtrate, passion flower leaf extract*, plantain leaf extract*, oatstraw extract*, slippery elm bark extract*, chia seed extract*, pro-vitamin B5, xanthan gum, citric acid (*organic)', 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'composition.active_ingredients': f(['aloe vera', 'sodium hyaluronate', 'glycerin', 'botanical extracts (black cohosh, chaste tree, muira puama)'], 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'composition.fragrance': f('No synthetic fragrance; mild scent from sweet orange oil', 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'composition.allergens': f('No allergen statement; contains citrus oil and multiple botanical extracts', 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'safety.warnings': f(['Patch test before use.', 'Discontinue if irritation occurs.', 'Keep out of reach of children.'], 'Oboo product page', 'https://oboo.love/products/loob-daily'),
      'health.intended_use': f('Water-based vulvar moisturizer and lubricant; brand says condom-friendly and safe with body-safe toys', 'Oboo product page', 'https://oboo.love/products/loob-daily'),
    },
  }),

  'p-oboo-loob-arousal': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Checked Oboo product page. Displayed $30 for 4 oz (page metadata and shop grid show $20/$28, inconsistent; catalog $28). Contains peppermint oil (cooling tingle) plus black cohosh, chaste tree and muira puama extracts. Condom-friendly per brand. No pregnancy statement.',
    corrections: [{ field: 'pricing.price', catalog: '$28', source_says: '$30 displayed for 4 oz (shop grid shows $20 and $28)', source_url: 'https://oboo.love/products/loob-arousal' }],
    facts: {
      'identity.variant': f('Loob Arousal Moisturizer, 4 oz / 120 ml (2 oz option)', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'pricing.price': f('$30 (4 oz) as displayed; shop grid inconsistent', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'pricing.size_count': f('4 oz / 120 ml or 2 oz / 60 ml', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'pricing.availability': f(['Oboo website'], 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'composition.ingredients': f('Water, vegetable glycerin, sodium hyaluronate, squalane (olive), pro-vitamin B5, organic aloe vera, black cohosh root, muira puama bark, chaste tree fruit, passion flower leaf, plantain leaf, oatstraw, slippery elm bark, chia seed extracts, peppermint oil, leuconostoc/radish root ferment filtrate, xanthan gum, citric acid', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'composition.active_ingredients': f(['peppermint oil (cooling sensation)', 'sodium hyaluronate', 'aloe vera', 'botanical extracts'], 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'composition.fragrance': f('No synthetic fragrance; scent and tingle from peppermint oil', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'composition.allergens': f('No allergen statement; contains peppermint oil and several botanical extracts', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'safety.warnings': f(['Patch test before use.', 'Stop if irritation occurs.', 'Start with a small amount on extra-sensitive skin.', 'Keep out of reach of children.'], 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'safety.side_effects': f('Cooling, tingling sensation by design (peppermint)', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
      'health.intended_use': f('Water-based arousal moisturizer applied to the vulva; condom-friendly per brand', 'Oboo product page', 'https://oboo.love/products/loob-arousal'),
    },
  }),

  'p-oboo-mood-drops': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes: 'Checked Oboo product page: $28, 1 oz dropper, herbal tincture in water and ethanol (alcohol % not stated), no per-serving amounts. Label says check with a doctor if pregnant, nursing or on medication. No ODS/MedlinePlus interaction data found for muira puama; left as label text. Clinician review: libido herbal supplement containing alcohol.',
    facts: {
      'identity.variant': f('In the Mood Drops, 1 oz dropper bottle', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'pricing.price': f('$28', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'pricing.size_count': f('1 oz', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'pricing.availability': f(['Oboo website'], 'Oboo shop page', 'https://oboo.love/collections/all'),
      'composition.ingredients': f('Muira puama bark extract, schisandra berry extract, skullcap leaf extract, lavender flower extract, white sage leaf extract, water, ethanol', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'composition.active_ingredients': f(['muira puama', 'schisandra', 'skullcap', 'lavender', 'white sage'], 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'composition.dosage': f(['Half a dropper in a drink 2 to 3 times daily (amounts per herb not stated)'], 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'composition.allergens': f('Contains ethanol (alcohol); no allergen statement', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'safety.warnings': f(['Consult a healthcare provider before starting any new supplement.', 'Check with a doctor if pregnant, nursing or taking medication.', 'Not evaluated by the FDA.'], 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'safety.regulatory_status': f('Herbal supplement, not evaluated by the FDA', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'safety.pregnancy': f('Brand: check with a doctor if pregnant', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'safety.breastfeeding': f('Brand: check with a doctor if nursing', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'safety.medication_interactions': f('Brand: check with a doctor if taking medication (no specific interactions listed)', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
      'health.intended_use': f('Herbal drops added to a drink, marketed for libido and mood (manufacturer information)', 'Oboo product page', 'https://oboo.love/products/in-the-mood-libido-drops'),
    },
  }),

  'p-oboo-cool-spray': base('in_review', {
    recall_status: 'unknown',
    notes: 'Checked Oboo product page: $20, 1 oz, ingredients water, black cohosh, chaste tree, witch hazel, lavender oil, sandalwood oil. Sprayed on skin and inhaled. Brand says fragrance-free but contains essential oils. No pregnancy or eye warnings on page.',
    facts: {
      'identity.variant': f('Cool Spray for Hot Flashes, 1 oz amber bottle', 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'pricing.price': f('$20', 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'pricing.size_count': f('1 oz', 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'pricing.availability': f(['Oboo website'], 'Oboo shop page', 'https://oboo.love/collections/all'),
      'composition.ingredients': f('Aqua, black cohosh root extract, chaste tree berry extract, witch hazel extract, lavender oil, sandalwood oil', 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'composition.active_ingredients': f(['witch hazel', 'lavender oil', 'sandalwood oil', 'black cohosh extract', 'chaste tree extract'], 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'composition.fragrance': f('No added synthetic fragrance per brand; scented by lavender and sandalwood essential oils', 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'composition.allergens': f('No allergen statement; contains essential oils', 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'safety.warnings': f(['Start with a small amount if skin is very reactive.'], 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
      'health.intended_use': f('Cooling mist sprayed on neck, chest, wrists or face during hot flashes (manufacturer information)', 'Oboo product page', 'https://oboo.love/products/cool-spray-for-hot-flashes'),
    },
  }),

  'p-proov-balance-bundle': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked Proov bundle page and "what\'s included" page. $49.99 (compare $59.99). Contains a topical OTC progesterone oil (3,000 mg per 30 ml bottle) plus Luteal Love/Pro capsules (vitex, ashwagandha, maca; amounts not listed). Supply is inconsistent: product page says two months, included page says 30 capsules = 1 cycle. No warnings, FDA disclaimer or pregnancy guidance on the pages, although it is marketed to people trying to conceive. NIH sources say vitex and ashwagandha may be unsafe in pregnancy. Clinician review: hormone product marketed for fertility.',
    facts: {
      'identity.variant': f('Balance Bundle: Luteal Love (Pro) capsules, 30 count + Balancing Oil 30 ml', 'Proov "Balance Bundle: what\'s included" page', 'https://proovtest.com/pages/balance-bundle-whats-included'),
      'pricing.price': f('$49.99 (compare-at $59.99)', 'Proov product page', 'https://proovtest.com/products/balance-bundle'),
      'pricing.size_count': f('30 capsules + 30 ml oil (brand describes both a 1-cycle and a two-month supply)', 'Proov product and included pages', 'https://proovtest.com/pages/balance-bundle-whats-included'),
      'pricing.availability': f(['Proov website'], 'Proov product page', 'https://proovtest.com/products/balance-bundle'),
      'composition.ingredients': f('Balancing Oil: USP progesterone 3,000 mg (per bottle), MCT oil, vitamin E. Capsules: vitex (chasteberry), ashwagandha root, maca root (amounts not listed)', 'Proov included page', 'https://proovtest.com/pages/balance-bundle-whats-included'),
      'composition.active_ingredients': f(['progesterone (topical, 3,000 mg per 30 ml bottle)', 'vitex (chasteberry)', 'ashwagandha', 'maca'], 'Proov product page', 'https://proovtest.com/products/balance-bundle'),
      'composition.dosage': f(['Capsules: 1 daily during the last 15 days of the cycle; herb amounts not listed', 'Oil: 3,000 mg progesterone per bottle; per-dose amount not stated'], 'Proov product page', 'https://proovtest.com/products/balance-bundle'),
      'safety.pregnancy': f('No brand statement found. NIH: vitex may be unsafe in pregnancy (NCCIH); ashwagandha possibly unsafe in pregnancy (ODS)', 'NCCIH Chasteberry; NIH ODS Ashwagandha', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'safety.breastfeeding': f('No brand statement found. NIH: vitex may be unsafe while breastfeeding; ashwagandha possibly unsafe', 'NCCIH Chasteberry; NIH ODS Ashwagandha', 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/?print=1', 'regulatory'),
      'safety.medication_interactions': f('Ashwagandha may interact with thyroid, diabetes, blood pressure, sedative and immunosuppressant medicines (ODS). NCCIH advises talking to a provider before herbal products', 'NIH ODS Ashwagandha; NCCIH Chasteberry', 'https://ods.od.nih.gov/factsheets/Ashwagandha-Consumer/?print=1', 'regulatory'),
      'safety.side_effects': f('Vitex: nausea, stomach pain, diarrhea, headache, itching (NCCIH). Ashwagandha: stomach upset, drowsiness, rare liver injury (ODS)', 'NCCIH; NIH ODS', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'safety.warnings': f(['Vitex may not be safe with breast, uterine or ovarian cancer (NCCIH).', 'No warnings printed on the Proov bundle pages.'], 'NCCIH Chasteberry; Proov product page', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'health.intended_use': f('Luteal-phase support bundle marketed to people trying to conceive, in perimenopause, with PMOS or postpartum (manufacturer information)', 'Proov product page', 'https://proovtest.com/products/balance-bundle'),
      'evidence.claims': f([
        { claim: 'Vitex may ease PMS breast tenderness', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/chasteberry', product_specific: false },
        { claim: 'Vitex helps fertility', strength: 'none', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/chasteberry', product_specific: false },
        { claim: 'Brand: "clinically studied" (no citations given)', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://proovtest.com/products/balance-bundle', product_specific: true },
      ], 'NCCIH; Proov product page', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
    },
  }),

  'p-proov-complete': base('in_review', {
    recall_status: 'unknown',
    notes:
      'Checked Proov product page and FDA 510(k) database. $99.99 first cycle; 20 strips (3 FSH + 17 multi-hormone E1G/LH/PdG) read by the free Proov Insight app; refills $39.99. FDA 510(k) K191462 ("Proov Test", MFB Fertility) cleared Feb 2020 as an OTC pregnanediol glucuronide (PdG) immunoassay; this covers the PdG test, not the whole multi-hormone kit. Product page itself makes no FDA claim. HSA/FSA via Flex at checkout. "3x faster" pregnancy claim has no footnote.',
    facts: {
      'identity.variant': f('Complete Fertility Testing System, 1 cycle: 20 strips (3 FSH + 17 multi-hormone)', 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
      'pricing.price': f('$99.99 first cycle; $39.99 10-strip refill', 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
      'pricing.size_count': f('20 test strips (3 FSH, 17 E1G/LH/PdG)', 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
      'pricing.fsa_hsa': f('HSA/FSA payment via Flex at checkout (eligibility varies)', 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
      'pricing.availability': f(['Proov website'], 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
      'safety.warnings': f(['Does not diagnose a condition; take results to a doctor.', 'Not for perimenopause.', 'Hormonal birth control changes the pattern; wait a cycle or two after stopping.'], 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
      'safety.regulatory_status': f('PdG test cleared by FDA 510(k) K191462 (Proov Test, MFB Fertility, OTC, product code QKE, 2020-02-27)', 'FDA 510(k) database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462', 'regulatory'),
      'health.intended_use': f('At-home urine hormone tracking across a full cycle (FSH, estrogen, LH, progesterone metabolite) to see ovulation and luteal progesterone', 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
      'evidence.sources': f([
        { title: 'FDA 510(k) K191462: Proov Test (PdG)', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462', evidence_type: 'regulatory', supports: 'OTC PdG urine test is FDA-cleared' },
        { title: 'FDA decision summary K191462', url: 'https://www.accessdata.fda.gov/cdrh_docs/reviews/K191462.pdf', evidence_type: 'regulatory', supports: 'performance data reviewed for clearance' },
      ], 'FDA', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462', 'regulatory'),
      'evidence.claims': f([
        { claim: '99% accurate at detecting FSH, E1G, LH and PdG', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://proovtest.com/products/complete-testing-system', product_specific: true },
        { claim: 'Whole-cycle trackers get pregnant 3x faster', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://proovtest.com/products/complete-testing-system', product_specific: true },
      ], 'Proov product page', 'https://proovtest.com/products/complete-testing-system'),
    },
  }),

  'p-proov-his-hers': base('in_review', {
    recall_status: 'unknown',
    notes:
      'Checked Proov product page: now "Hers and His Advanced Fertility Test for Couples", $179.99 for ONE cycle for her (catalog says 2 cycles; second cycle is a +$39.99 refill). Includes Proov Complete (20 tests), Proov Check (10 pregnancy tests) and Proov + YO sperm test (2 tests). Brand says the YO test is FDA-cleared; PdG test cleared under K191462.',
    corrections: [{ field: 'pricing.size_count', catalog: '$179.99 (2 cycles)', source_says: '$179.99 covers one cycle for her; second cycle is a +$39.99 refill', source_url: 'https://proovtest.com/products/his-and-hers-fertility-starter-kit' }],
    facts: {
      'identity.variant': f('Hers and His Advanced Fertility Test for Couples (1 cycle)', 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
      'pricing.price': f('$179.99 ($203.99 if bought separately)', 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
      'pricing.size_count': f('Her: 20 hormone strips + 10 early pregnancy tests; Him: 2 YO sperm tests', 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
      'pricing.fsa_hsa': f('HSA/FSA payment via Flex at checkout (eligibility varies)', 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
      'pricing.availability': f(['Proov website'], 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
      'safety.warnings': f(['Tests do not diagnose a condition; take results to a doctor.', 'For the sperm test, wait 2 to 5 days after last ejaculation; repeat a low result and discuss with a doctor.'], 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
      'safety.regulatory_status': f('Proov PdG test FDA-cleared (510(k) K191462); brand states the YO sperm test is FDA-cleared for home use', 'FDA 510(k) database; Proov product page', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462', 'regulatory'),
      'health.intended_use': f('Couples fertility check: her cycle hormones and pregnancy tests, his motile sperm concentration', 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
      'evidence.claims': f([
        { claim: 'Everything is 99% accurate at detecting what it measures', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://proovtest.com/products/his-and-hers-fertility-starter-kit', product_specific: true },
      ], 'Proov product page', 'https://proovtest.com/products/his-and-hers-fertility-starter-kit'),
    },
  }),

  'p-proov-path-to-pregnancy': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Found only Proov\'s "Path to Pregnancy" blog page: Silver $399 (3 Proov Complete kits, 3 boxes Proov Check, progesterone prescription after medical review, timing protocol); Gold $499 adds coaching. Progesterone medication cost not included. The blog mentions progesterone only; the catalog\'s letrozole mention and "F.A.S.T." naming were not confirmed. States served, telehealth model and privacy terms not stated. Clinician review: prescription hormone program.',
    facts: {
      'pricing.price': f('Silver $399; Gold $499 (progesterone medication not included)', 'Proov Path to Pregnancy page', 'https://proovtest.com/blogs/blog/path-to-pregnancy'),
      'pricing.size_count': f('3 Proov Complete kits + 3 boxes Proov Check pregnancy tests (Silver)', 'Proov Path to Pregnancy page', 'https://proovtest.com/blogs/blog/path-to-pregnancy'),
      'safety.warnings': f(['Cannot fix all fertility issues: not for absent sperm, blocked tubes, not ovulating on your own, uterine anatomy issues, thyroid or other conditions.', 'Progesterone prescription requires medical review.'], 'Proov Path to Pregnancy page', 'https://proovtest.com/blogs/blog/path-to-pregnancy'),
      'safety.regulatory_status': f('Includes the FDA-cleared Proov PdG test (510(k) K191462); progesterone is prescribed after physician review', 'FDA 510(k) database; Proov page', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462', 'regulatory'),
      'health.intended_use': f('Doctor-designed home testing and timing protocol with a progesterone prescription for people trying to conceive', 'Proov Path to Pregnancy page', 'https://proovtest.com/blogs/blog/path-to-pregnancy'),
    },
  }),

  'p-elitone-urge': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Checked Elitone product page and the FDA 510(k) record (K223884, Elidah Inc., cleared 2023-02-24, product code QAJ). Price now starts at $399 for the Original v1 kit (limited time); Essential Kit $429 (10 GelPads), Bundle $539 (30 GelPads). Catalog "From $359" is out of date. Contraindications: pregnancy or trying, electronic implants/heart problems, cancer, epilepsy, recent pelvic surgery, urinary retention. HSA/FSA accepted. Efficacy numbers are brand-reported, studies not named on page.',
    corrections: [{ field: 'pricing.price', catalog: 'From $359', source_says: 'From $399 (v1, limited time); Essential Kit $429; Bundle $539', source_url: 'https://elitone.com/product/elitone-urge/' }],
    facts: {
      'identity.variant': f('Elitone URGE Essential Kit: controller + 10 GelPads', 'Elitone product page', 'https://elitone.com/product/elitone-urge/'),
      'pricing.price': f('From $399 (Original v1); Essential Kit $429; Bundle with 30 GelPads $539; GelPad refills $33 for 5', 'Elitone product page', 'https://elitone.com/product/elitone-urge/'),
      'pricing.size_count': f('1 device + 10 GelPads (each reusable 3+ times)', 'Elitone product page', 'https://elitone.com/product/elitone-urge/'),
      'pricing.fsa_hsa': f('HSA/FSA funds accepted; Medicare Part B may cover with a prescription (per brand)', 'Elitone product page', 'https://elitone.com/product/elitone-urge/'),
      'pricing.availability': f(['Elitone website'], 'Elitone product page', 'https://elitone.com/product/elitone-urge/'),
      'safety.warnings': f([
        'Do not use if pregnant or trying to become pregnant.',
        'Do not use with electronic implants (pacemaker, defibrillator) or heart problems.',
        'Do not use with cancer, epilepsy or cognitive dysfunction.',
        'Not within 6 weeks of pelvic floor surgery, or with complete pelvic floor denervation.',
        'Not for urinary retention, extra-urethral or overflow incontinence.',
      ], 'Elitone product page', 'https://elitone.com/product/elitone-urge/'),
      'safety.regulatory_status': f('FDA 510(k) K223884, ELITONE Urge Urinary Incontinence Device (Elidah, Inc.), cleared 2023-02-24, product code QAJ; brand states OTC', 'FDA 510(k) record via deviceclearance.com; Elitone page', 'https://deviceclearance.com/510k/K223884/', 'regulatory'),
      'health.intended_use': f('External pelvic floor stimulation worn about 20 minutes a day, 5 days a week, for urge incontinence / overactive bladder in women', 'Elitone product page', 'https://elitone.com/product/elitone-urge/'),
      'evidence.sources': f([
        { title: 'FDA 510(k) K223884', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K223884', evidence_type: 'regulatory', supports: 'device cleared for urge incontinence' },
        { title: 'Elitone: Just the Facts', url: 'https://elitone.com/just-the-facts', evidence_type: 'manufacturer', supports: 'brand-reported outcome claims' },
      ], 'FDA; Elitone', 'https://deviceclearance.com/510k/K223884/', 'regulatory'),
      'evidence.claims': f([
        { claim: '95% of women reported fewer leaks; 70% average leak reduction in 6 weeks', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://elitone.com/product/elitone-urge/', product_specific: true },
      ], 'Elitone product page (studies not named)', 'https://elitone.com/product/elitone-urge/'),
    },
  }),

  'p-vio2-mouth-tape': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Checked Niche Beauty retailer listing (48 strips, cotton/spandex, hypoallergenic medical-grade adhesive, latex-free, unscented) and saw Free People / Anthropologie carry it. Catalog route is "ingestible", which is wrong: it is an external skin-contact tape (this also wrongly pulls in dosage/interaction fields). Niche lists $37 (international retailer) vs catalog $29.95 from the brand; brand page not checked, so price left as catalog. Partial-coverage design not confirmed by this listing.',
    corrections: [{ field: 'risk.route', catalog: 'ingestible', source_says: 'External mouth tape (fabric + adhesive on skin)', source_url: 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001' }],
    facts: {
      'identity.variant': f('VIO2 Mouth Tape, unscented, 48 strips', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'pricing.size_count': f('48 strips', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'pricing.availability': f(['VIO2 website', 'Free People', 'Anthropologie', 'Niche Beauty'], 'retailer listings found in search', 'https://www.freepeople.com/shop/vio2-mouth-tape/', 'retailer'),
      'composition.ingredients': f('Cotton/spandex blend fabric with hypoallergenic medical-grade adhesive', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'composition.allergens': f('Latex-free, hypoallergenic adhesive, PFAS-free (per listing)', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'composition.fragrance': f('Unscented, fragrance-free', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'safety.warnings': f(['Not for children under 6.', 'Not for people with breathing disorders, heart conditions or nasal congestion.', 'Not for anyone at risk of vomiting, using alcohol or sedatives, or unable to remove the tape themselves.'], 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'safety.age_restriction': f('Not intended for children under 6', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'safety.regulatory_status': f('Wellness claims not evaluated by the FDA', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
      'health.intended_use': f('Tape placed over closed lips during sleep to encourage nasal breathing; single use', 'Niche Beauty listing', 'https://www.niche-beauty.com/en-us/products/vio2-mouth-tape/819-001', 'retailer'),
    },
  }),

  'p-buni-rejuvenate-vulva-balm': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked BUNI product page and bundle page. $42; size listed as 1.7 oz in header but 2 oz in bundle FAQ. No full INCI on page. The vulva balm page\'s ingredient block also lists retinyl palmitate and snail secretion filtrate (which belong to the scar oil); unclear if copy error. Contains bee products (honey, propolis) and shea/cacao/avocado. External use only. Brand: consult a provider before use in pregnancy or breastfeeding. Catalog links to Amazon; brand site also sells it. Clinician review: possible retinoid in a product marketed for pregnancy/postpartum.',
    facts: {
      'identity.variant': f('REJUVENATE Vulva Balm, airless pump, 1.7 oz (bundle FAQ says 2 oz)', 'BUNI product page; BUNI bundle page', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'pricing.price': f('$42', 'BUNI product page', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'pricing.size_count': f('1.7 oz (page also says 2 oz)', 'BUNI product page', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'pricing.availability': f(['BUNI website', 'Amazon'], 'BUNI shop page; Amazon listing', 'https://www.bunibody.com/collections/all'),
      'composition.allergens': f('No allergen statement. Contains honey and propolis (bee-derived), shea, cacao, avocado oil', 'BUNI product page', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'composition.fragrance': f('No synthetic fragrance; light scent from chamomile and lavender oils', 'BUNI product page FAQ', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'safety.warnings': f(['External vulvar use only; not for internal vaginal use.', 'Consult a healthcare provider before use in pregnancy or while breastfeeding.'], 'BUNI product page FAQ', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'safety.pregnancy': f('Brand: consult your healthcare provider before starting during pregnancy', 'BUNI product page FAQ', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'safety.breastfeeding': f('Brand: consult your healthcare provider before starting while breastfeeding', 'BUNI product page FAQ', 'https://www.bunibody.com/products/buni-vulva-balm'),
      'health.intended_use': f('External vulvar moisturizer, marketed for pregnancy, postpartum and menopause dryness', 'BUNI product page', 'https://www.bunibody.com/products/buni-vulva-balm'),
    },
  }),

  'p-buni-soothe-nipple-lip-balm': base('in_review', {
    recall_status: 'unknown',
    notes:
      'Checked BUNI product page: $25, glass jar (size not stated), lanolin-free, no wipe-off before nursing per brand. Page calls it "no animal-derived ingredients" yet lists beeswax, a contradiction the catalog repeats. Full INCI not on page.',
    corrections: [{ field: 'composition.allergens', catalog: 'no animal-derived ingredients', source_says: 'Page lists beeswax (animal-derived) despite claiming plant-based', source_url: 'https://www.bunibody.com/products/buni-nipple-balm' }],
    facts: {
      'identity.variant': f('SOOTHE Nipple and Lip Balm, glass jar', 'BUNI product page; bundle page', 'https://www.bunibody.com/products/buni-nipple-balm'),
      'pricing.price': f('$25', 'BUNI product page', 'https://www.bunibody.com/products/buni-nipple-balm'),
      'pricing.availability': f(['BUNI website', 'Amazon'], 'BUNI shop page', 'https://www.bunibody.com/collections/all'),
      'composition.allergens': f('Contains beeswax; shea, kokum and cacao butters, avocado and olive oils; lanolin-free. No allergen statement', 'BUNI product page', 'https://www.bunibody.com/products/buni-nipple-balm'),
      'composition.fragrance': f('No synthetic fragrance; subtle scent from butters and oils', 'BUNI product page', 'https://www.bunibody.com/products/buni-nipple-balm'),
      'safety.pregnancy': f('Brand says suitable in pregnancy; consult a provider with concerns', 'BUNI product page FAQ', 'https://www.bunibody.com/products/buni-nipple-balm'),
      'safety.breastfeeding': f('Brand: no need to wipe off before nursing', 'BUNI product page', 'https://www.bunibody.com/products/buni-nipple-balm'),
      'health.intended_use': f('Nipple balm after feeds or before pumping, and lip balm', 'BUNI product page', 'https://www.bunibody.com/products/buni-nipple-balm'),
    },
  }),

  'p-buni-transform-scar-body-oil': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked BUNI product page: $35 (bundle page shows $45 compare-at), 1.7 oz / 50 ml rollerball, free onyx gua sha. Contains retinyl palmitate (a vitamin A ester) and snail secretion filtrate; page gives no pregnancy or breastfeeding guidance although it is marketed to new and nursing mothers. Brand: get medical approval before use on a new scar or C-section scar. No full INCI. Clinician review: retinoid in a postpartum product.',
    facts: {
      'identity.variant': f('TRANSFORM Scar+Body Treatment Oil, 1.7 oz / 50 ml rollerball, with onyx gua sha', 'BUNI product page', 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil'),
      'pricing.price': f('$35', 'BUNI product page', 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil'),
      'pricing.size_count': f('1.7 oz / 50 ml', 'BUNI product page', 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil'),
      'pricing.availability': f(['BUNI website', 'Amazon'], 'BUNI shop page', 'https://www.bunibody.com/collections/all'),
      'composition.active_ingredients': f(['retinyl palmitate', 'snail secretion filtrate'], 'BUNI product page', 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil'),
      'composition.allergens': f('No allergen statement. Contains snail secretion filtrate, avocado and apricot oils, chamomile, lavender', 'BUNI product page', 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil'),
      'safety.warnings': f(['Get approval from your doctor before using on a new scar.', 'For C-section scars, consult your medical professional first.'], 'BUNI product page', 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil'),
      'health.intended_use': f('Daily oil and gua sha massage for scars and stretch marks; brand suggests 8 to 12 weeks for older scars', 'BUNI product page', 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil'),
    },
  }),

  'p-buni-bundle': base('needs_clinician_review', {
    recall_status: 'unknown',
    notes:
      'Checked BUNI bundle page: $98 for TRANSFORM oil (1.7 oz), REJUVENATE balm (2 oz), SOOTHE balm and a free onyx gua sha. Page pricing text is internally inconsistent ($98 vs "$99", compare-at $112). No returns. Includes a retinyl palmitate product marketed to new and nursing mothers with no pregnancy guidance. Catalog route "external_device" is a misfit (topicals).',
    facts: {
      'identity.variant': f('BUNI Bundle: TRANSFORM oil + REJUVENATE balm + SOOTHE balm + onyx gua sha', 'BUNI bundle page', 'https://www.bunibody.com/products/buni-bundle'),
      'pricing.price': f('$98 (items $112 at compare-at prices)', 'BUNI bundle page', 'https://www.bunibody.com/products/buni-bundle'),
      'pricing.size_count': f('3 products + 1 gua sha tool', 'BUNI bundle page', 'https://www.bunibody.com/products/buni-bundle'),
      'pricing.availability': f(['BUNI website', 'Amazon'], 'BUNI shop page; Amazon listing', 'https://us.amazon.com/BUNI-Premium-Womens-Care-Bundle/dp/B0G53D19CK'),
      'safety.warnings': f(['No returns on these products.', 'Follow each product\'s directions; get medical approval before using the scar oil on a new or C-section scar.'], 'BUNI bundle and product pages', 'https://www.bunibody.com/products/buni-bundle'),
      'health.intended_use': f('Postpartum body-care set: scar oil, vulva balm, nipple and lip balm', 'BUNI bundle page', 'https://www.bunibody.com/products/buni-bundle'),
    },
  }),

  'p-hatch-oil': base('needs_correction', {
    recall_status: 'unknown',
    notes:
      'Checked HATCH product page: $68 for 6.6 oz / 195 ml. Full INCI differs from catalog: main oils are jojoba, argan, olive, sweet almond and rosehip; calendula present; marshmallow root and prickly pear (catalog) not listed. Contains sweet almond oil (tree nut source) and grapefruit oil, so the catalog "fragrance-free" is wrong: brand says lightly scented with grapefruit oil while also claiming "fragrance-free". No pregnancy safety statement or warnings, though marketed for pregnancy.',
    corrections: [
      { field: 'composition.ingredients', catalog: 'Calendula, Marshmallow root, Prickly Pear.', source_says: 'Isopropyl myristate, jojoba, hydrogenated polyisobutene, argan, olive, radish seed extract, grapefruit oil, tocopherol, calendula, sweet almond, rosehip, diethylhexyl syringylidenemalonate, rosemary leaf extract, sunflower, caprylic/capric triglyceride', source_url: 'https://www.hatchcollection.com/products/belly-oil-1' },
      { field: 'composition.allergens', catalog: 'Fragrance-free', source_says: 'Lightly scented with grapefruit oil; contains sweet almond oil', source_url: 'https://www.hatchcollection.com/products/belly-oil-1' },
    ],
    facts: {
      'identity.variant': f('Belly Oil, 6.6 oz / 195 ml', 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'pricing.price': f('$68', 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'pricing.size_count': f('6.6 oz / 195 ml (0.85 oz mini also sold)', 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'pricing.availability': f(['HATCH website'], 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'composition.ingredients': f('Isopropyl myristate, simmondsia chinensis (jojoba) seed oil, hydrogenated polyisobutene, argania spinosa (argan) kernel oil, olea europaea (olive) fruit oil, raphanus sativus (radish) seed extract, citrus paradisi (grapefruit) oil, tocopherol, calendula officinalis flower extract, prunus amygdalus dulcis (sweet almond) oil, rosa canina (rosehip) fruit oil, diethylhexyl syringylidenemalonate, rosmarinus officinalis (rosemary) leaf extract, helianthus annuus (sunflower) seed oil, caprylic/capric triglyceride', 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'composition.active_ingredients': f(['jojoba oil', 'argan oil', 'rosehip oil', 'calendula extract', 'tocopherol (vitamin E)'], 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'composition.allergens': f('Contains sweet almond oil (tree nut source) and grapefruit oil; no allergen warning on page', 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'composition.fragrance': f('Lightly scented with grapefruit oil (brand also says free of added fragrance)', 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
      'health.intended_use': f('Body oil massaged into belly, breasts and hips during pregnancy; brand says it helps the look of stretch marks (manufacturer information)', 'HATCH product page', 'https://www.hatchcollection.com/products/belly-oil-1'),
    },
  }),

  'p-sweetspot-buff-brighten': base('in_review', {
    recall_status: 'unknown',
    notes:
      'Checked full ingredient list via Skinsort (16 ingredients: lactic, glycolic and salicylic acids, niacinamide, witch hazel, aloe; fragrance-free, alcohol-free). Price and count not re-checked on the brand page. No pregnancy statement found; salicylic acid present.',
    facts: {
      'composition.ingredients': f('Water, lactic acid, sodium hydroxide, glycolic acid, salicylic acid, niacinamide, hamamelis virginiana leaf water, aloe barbadensis leaf juice, polydextrose, dextrin, amylopectin, citric acid, potassium sorbate, ethylhexylglycerin, benzoic acid, phenoxyethanol', 'Skinsort ingredient listing', 'https://skinsort.com/products/sweetspot-labs/buff-brighten-aha-bha-body-exfoliating-pads', 'retailer'),
      'composition.active_ingredients': f(['lactic acid (AHA)', 'glycolic acid (AHA)', 'salicylic acid (BHA)', 'niacinamide'], 'Skinsort ingredient listing', 'https://skinsort.com/products/sweetspot-labs/buff-brighten-aha-bha-body-exfoliating-pads', 'retailer'),
      'composition.fragrance': f('Fragrance-free; contains witch hazel', 'Skinsort ingredient listing', 'https://skinsort.com/products/sweetspot-labs/buff-brighten-aha-bha-body-exfoliating-pads', 'retailer'),
      'composition.allergens': f('No allergen statement; alcohol-free', 'Skinsort ingredient listing', 'https://skinsort.com/products/sweetspot-labs/buff-brighten-aha-bha-body-exfoliating-pads', 'retailer'),
    },
  }),

  'p-boppy-pillow': base('needs_correction', {
    recall_status: 'none_found',
    notes:
      'Checked Boppy product page: New Boppy Nursing Pillow $50 (catalog $45), 22 cover prints. Fill 100% polyester recycled fiber; inner skin 80/20 poly/cotton; cover 100% polyester (catalog says cotton cover). Brand: adult-supervised awake time only, never for infant sleep; states CPSC compliant. Recall search: the 2021 recall was the Boppy Newborn Lounger (not this pillow); CPSC warned in 2020 never to let infants sleep on nursing pillows (Consumer Reports statement). No recall of the nursing pillow found in search. Not checked directly on cpsc.gov.',
    corrections: [
      { field: 'pricing.price', catalog: '$45', source_says: '$50', source_url: 'https://www.boppy.com/products/nursing-pillow' },
      { field: 'composition.ingredients', catalog: 'Polyester fiberfill, cotton cover.', source_says: 'Fill 100% polyester; inner skin 80% polyester/20% cotton; cover 100% polyester', source_url: 'https://www.boppy.com/products/nursing-pillow' },
    ],
    facts: {
      'identity.variant': f('New Boppy Nursing Pillow with standard polyester cover (22 prints)', 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'pricing.price': f('$50', 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'pricing.size_count': f('1 pillow with removable cover', 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'pricing.availability': f(['Boppy website'], 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'composition.ingredients': f('Fill: 100% polyester recycled fiber. Inner skin: 80% polyester, 20% cotton. Cover: 100% polyester', 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'composition.allergens': f('Brand calls the fill hypoallergenic; no latex statement', 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'safety.warnings': f(['For adult-supervised awake time only; never for infant sleep.', 'Pillow spot clean only; cover machine wash cool, gentle.'], 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'safety.regulatory_status': f('Brand states CPSC compliant and Baby Safety Alliance verified', 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
      'safety.recalls': f({ text: 'No recall of the Boppy Nursing Pillow found. The separate Boppy Newborn Lounger was recalled in 2021 after infant deaths. CPSC (2020) warns never to let infants sleep on nursing pillows.', flagged: false }, 'news coverage of 2021 lounger recall; Consumer Reports on CPSC warning', 'https://advocacy.consumerreports.org/press_release/consumer-reports-statement-on-cpsc-warning-about-nursing-pillows', 'regulatory'),
      'health.intended_use': f('Supports baby at breast or bottle during awake, supervised feeding', 'Boppy product page', 'https://www.boppy.com/products/nursing-pillow'),
    },
  }),

  'p-snoogle-pillow': base('in_review', {
    recall_status: 'unknown',
    notes: 'Snoogle variants found (Original, Chic Jersey) at Walmart ($49.49 to $64.95, out of stock at check) and resellers; no listing gave fill, cover material or warnings. Catalog has no buy link. Exact variant unknown. Recall: not checked on cpsc.gov (Leachco had a CPSC action over its Podster infant lounger, a different product; not verified here).',
    facts: {
      'pricing.availability': f(['Walmart (out of stock at check)', 'resellers'], 'Walmart listing', 'https://www.walmart.com/ip/37199687', 'retailer'),
    },
  }),

  'p-haakaa-pump': base('in_review', {
    recall_status: 'unknown',
    notes: 'Checked Haakaa NZ product page: Generation 1, 100 ml, one-piece 100% food-grade silicone, BPA/PVC/phthalate-free, tested to FDA/EU/LFGB standards (not an FDA clearance). Price shown is NZD $24.90 (sold out on NZ site); US price of $13 not re-checked. Latex not mentioned.',
    facts: {
      'identity.variant': f('Generation 1 Silicone Breast Pump, 100 ml (4 oz), non-suction base', 'Haakaa product page', 'https://www.haakaa.co.nz/products/silicone-breast-pump'),
      'pricing.size_count': f('1 pump, 100 ml', 'Haakaa product page', 'https://www.haakaa.co.nz/products/silicone-breast-pump'),
      'pricing.availability': f(['Haakaa website', 'Walmart'], 'Haakaa product page; Walmart listing', 'https://www.walmart.com/ip/Haakaa-Generation-1-Silicone-Breast-Pump-4-oz/749342637', 'retailer'),
      'composition.ingredients': f('100% food-grade silicone, one piece; BPA-, PVC- and phthalate-free', 'Haakaa product page', 'https://www.haakaa.co.nz/products/silicone-breast-pump'),
      'composition.allergens': f('BPA-, PVC- and phthalate-free; latex not mentioned', 'Haakaa product page', 'https://www.haakaa.co.nz/products/silicone-breast-pump'),
      'safety.warnings': f(['Sterilize before use (boil 2 to 3 minutes).', 'Inspect regularly and replace if damaged.', 'Do not use bleach, sterilizing tablets or UV sterilizers.', 'Not a toy; adult supervision required.'], 'Haakaa product page', 'https://www.haakaa.co.nz/products/silicone-breast-pump'),
      'safety.regulatory_status': f('Brand says tested and certified to US FDA, EU and LFGB food-contact standards (not an FDA clearance)', 'Haakaa product page', 'https://www.haakaa.co.nz/products/silicone-breast-pump'),
      'health.intended_use': f('Manual silicone pump that collects let-down milk by suction', 'Haakaa product page', 'https://www.haakaa.co.nz/products/silicone-breast-pump'),
    },
  }),

  'p-silverette-cups': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Checked Silverette USA product page: $69.99 (catalog $60). Sizes now S/M/L (old Regular = S, old XL = M). Material stated as both "100% sterling silver" and 925 sterling (92.5% silver, copper alloy), nickel-free. FDA status not stated (catalog says Class I device, unverified). Brand: not for certain metal sensitivities; remove before nursing.',
    corrections: [
      { field: 'pricing.price', catalog: '$60', source_says: '$69.99', source_url: 'https://silveretteusa.com/products/silverette-nursing-cups' },
      { field: 'safety.regulatory_status', catalog: 'Class I Medical Device', source_says: 'No FDA status stated on brand page', source_url: 'https://silveretteusa.com/products/silverette-nursing-cups' },
    ],
    facts: {
      'identity.variant': f('Silverette Nursing Cups, size S (formerly Regular); also M (formerly XL) and L', 'Silverette product page', 'https://silveretteusa.com/products/silverette-nursing-cups'),
      'pricing.price': f('$69.99', 'Silverette product page', 'https://silveretteusa.com/products/silverette-nursing-cups'),
      'pricing.size_count': f('1 pair', 'Silverette product page', 'https://silveretteusa.com/products/silverette-nursing-cups'),
      'pricing.availability': f(['Silverette USA website'], 'Silverette product page', 'https://silveretteusa.com/products/silverette-nursing-cups'),
      'composition.ingredients': f('925 sterling silver (92.5% silver, copper alloy), per brand FAQ', 'Silverette product page FAQ', 'https://silveretteusa.com/products/silverette-nursing-cups'),
      'composition.allergens': f('Nickel-free per brand; contains copper alloy; not for people with certain metal sensitivities', 'Silverette product page FAQ', 'https://silveretteusa.com/products/silverette-nursing-cups'),
      'safety.warnings': f(['Not for people with certain metal sensitivities.', 'Remove before nursing.', 'Wash daily and dry fully.'], 'Silverette product page', 'https://silveretteusa.com/products/silverette-nursing-cups'),
      'health.intended_use': f('Silver cups worn over nipples between feeds for sore or cracked nipples (manufacturer information)', 'Silverette product page', 'https://silveretteusa.com/products/silverette-nursing-cups'),
    },
  }),

  'p-willow-pump': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Checked Willow product page (onewillow.com): Willow 360 is $349.99 on sale (regular $499.99); catalog $499. Includes 2 pumps, 24 mm flanges + 21 mm inserts, 24 bags, charger. BPA-free; brand says FDA cleared (no 510(k) number given; not verified in FDA database here). HSA/FSA eligible per brand. Catalog link uses old domain willowpump.com.',
    corrections: [{ field: 'identity.purchase_url', catalog: 'https://onewillow.com/products/willow-360', source_says: 'Current page is onewillow.com/products/willow-360', source_url: 'https://onewillow.com/products/willow-360' }],
    facts: {
      'identity.variant': f('Willow 360 Wearable Breast Pump (double: 2 pumps)', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'identity.purchase_url': f('https://onewillow.com/products/willow-360', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'pricing.price': f('$349.99 sale (regular $499.99)', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'pricing.size_count': f('2 pumps, 2 x 24 mm flanges, 2 x 21 mm inserts, 2 FlexTubes, 24 4-oz milk bags, 2 brushes, charger', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'pricing.fsa_hsa': f('eligible (per brand); insurance may cover part', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'pricing.availability': f(['Willow website', 'Carewell', 'MacroBaby'], 'Willow page; retailer listings', 'https://carewell.com/product/willow-360-leak-proof-wearable-double-electric-breast-pump', 'retailer'),
      'composition.ingredients': f('BPA-free pump and milk bags (full materials not listed)', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'composition.allergens': f('BPA-free; latex not mentioned', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'safety.warnings': f(['Single-user device.', 'Use only the Willow charger.', 'Replace pump parts every 90 days.'], 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'safety.regulatory_status': f('Brand states FDA cleared (clearance number not given on page)', 'Willow product page', 'https://onewillow.com/products/willow-360'),
      'health.intended_use': f('In-bra wearable double electric breast pump, 7 suction levels up to -245 mmHg, app-tracked volume', 'Willow product page', 'https://onewillow.com/products/willow-360'),
    },
  }),

  'p-bodily-kit': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Checked Bodily product page: Postpartum Recovery Kit $70.20 (compare $78), preorder, variants shown sold out. Contents: inflatable vinyl cushion, mesh undies 3-pack (90% nylon/10% spandex), 14 oz BPA-free peri bottle, cozy socks. No topicals. Final sale. FSA/HSA not confirmed for this kit. Catalog "Class I medical device" and "toxic-free" claims not supported by the page.',
    corrections: [{ field: 'safety.regulatory_status', catalog: 'Class I Medical Device where applicable', source_says: 'No regulatory status on page; kit is a cushion, mesh underwear, peri bottle and socks', source_url: 'https://itsbodily.com/products/postpartum-recovery-kit-save-11' }],
    facts: {
      'identity.variant': f('Postpartum Recovery Kit (cushion, mesh undies 3-pack, peri bottle, socks)', 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
      'pricing.price': f('$70.20 (compare-at $78), preorder', 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
      'pricing.size_count': f('4 items: inflatable cushion, 3 mesh undies, 14 oz peri bottle, 1 pair socks', 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
      'pricing.availability': f(['Bodily website (preorder)'], 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
      'composition.ingredients': f('Cushion: wipeable vinyl. Mesh undies: 90% nylon, 10% spandex. Peri bottle: BPA-free plastic. Socks: not stated', 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
      'composition.allergens': f('Contains vinyl, nylon/spandex; no allergen statement', 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
      'safety.warnings': f(['Final sale; underwear not returnable.'], 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
      'health.intended_use': f('Comfort and hygiene supplies for vaginal-birth recovery', 'Bodily product page', 'https://itsbodily.com/products/postpartum-recovery-kit-save-11'),
    },
  }),

  'd-visana': base('in_review', {
    recall_status: 'unknown',
    next_review_due: SAFETY_DUE,
    notes: 'Checked Visana HIPAA notice (dated 2025-12-08) and MobiHealthNews (Series A article). Virtual women\'s health clinic in all 50 states, offered through health plans (e.g. BCBS Massachusetts) and employers; patient cost not published, so "free through insurance" is not verified. HIPAA notice: will not sell PHI without permission or use it for marketing; participates in health information exchanges (opt-out available).',
    facts: {
      'safety.privacy': f('HIPAA notice: operates in compliance with HIPAA as a health services provider; no PHI used for marketing; no sale of PHI without your agreement; shares via health information exchanges (opt out by email) but never HIV, abortion or gender-affirming care data', 'Visana HIPAA notice', 'https://www.visanahealth.com/legal-pages/hipaa-notice'),
      'health.intended_use': f('Virtual clinic for menopause and perimenopause, gynecological, sexual, reproductive and hormone health; available in all 50 states via health plans and employers', 'MobiHealthNews', 'https://www.mobihealthnews.com/news/visana-health-secures-24m-expansion-new-areas', 'research'),
      'pricing.availability': f(['Through participating health plans (e.g. BCBS Massachusetts) and employers (Aligned Marketplace)'], 'MobiHealthNews', 'https://www.mobihealthnews.com/news/visana-health-secures-24m-expansion-new-areas', 'research'),
    },
  }),

  'd-evernow': base('needs_correction', {
    recall_status: 'unknown',
    notes: 'Checked Evernow FAQ and privacy policy. Membership is $49/month, $129 per 3 months ($43/mo) or $420/year ($35/mo); catalog says $29-49/month. Membership HSA/FSA eligible, not insurance-covered; video visits billable to major commercial plans ($150 self-pay); no Medicare/Medicaid; all 50 states + DC. Medication costs separate. Website privacy policy does not mention HIPAA; health records are the responsibility of the affiliated Evernow Medical Group (separate HIPAA notice exists, not read).',
    corrections: [{ field: 'pricing.price', catalog: '$29-49/month', source_says: '$49/month, $129/3 months, $420/year ($35/mo)', source_url: 'https://www.evernow.com/faq' }],
    facts: {
      'identity.purchase_url': f('https://www.evernow.com/membership', 'Evernow site', 'https://www.evernow.com/membership'),
      'pricing.price': f('$49/month; $129 per 3 months; $420 per year (medications extra)', 'Evernow FAQ', 'https://www.evernow.com/faq'),
      'pricing.fsa_hsa': f('Membership fee HSA/FSA eligible (not covered by insurance)', 'Evernow FAQ', 'https://www.evernow.com/faq'),
      'pricing.availability': f(['All 50 states and DC; no Medicare or Medicaid'], 'Evernow FAQ', 'https://www.evernow.com/faq'),
      'safety.privacy': f('Website policy: does not sell personal data beyond listed purposes but may share aggregated data; uses cookies and Google Analytics; ignores Do Not Track. Care is delivered by Evernow Medical Group, which holds the health-information privacy notice', 'Evernow privacy policy', 'https://www.evernow.com/legal/privacy'),
      'health.intended_use': f('Online menopause care membership with clinicians who can prescribe hormone therapy, non-hormonal options and other treatments', 'Evernow FAQ', 'https://www.evernow.com/faq'),
    },
  }),

  'd-flutter': base('in_review', {
    recall_status: 'unknown',
    next_review_due: SAFETY_DUE,
    notes: 'Only source found is a 2016 Curve article: free iOS app for endometriosis symptom tracking and screening, made by Kristy Curry. Could not confirm the app is still live or its privacy policy; catalog name "Chronic Pain Management" not confirmed. Needs a human to check the App Store listing.',
    facts: {
      'pricing.price': f('Free (as of 2016 launch)', 'Curve magazine launch article', 'https://www.curvemag.com/blog/womens-healthcare-app-flutter-launches/', 'research'),
      'health.intended_use': f('iOS app to log symptoms and cycles, take an endometriosis screening quiz, export a PDF for doctors and find specialists', 'Curve magazine launch article', 'https://www.curvemag.com/blog/womens-healthcare-app-flutter-launches/', 'research'),
    },
  }),

  'd-menolabs': base('in_review', {
    recall_status: 'unknown',
    next_review_due: SAFETY_DUE,
    notes: 'Searched for MenoLife by MenoLabs (App Store, privacy policy); found only third-party analytics references, no live listing or policy. Nothing verified. Needs a human check that the app still exists.',
    facts: {},
  }),

  'd-connect-pelvic-floor-fitness': base('in_review', {
    recall_status: 'unknown',
    notes: 'Checked App Store listing: Connect Pelvic Floor Fitness by Find Your Fitness LLC, free download, subscriptions $30/month or $179.99/year (matches catalog), 14-day free trial on website. App Privacy (self-reported): identifiers used to track you; email linked to you. Privacy policy URL listed but not read.',
    facts: {
      'pricing.price': f('$30/month or $179.99/year (App Store in-app purchase)', 'Apple App Store listing', 'https://apps.apple.com/app/id6475697994', 'retailer'),
      'pricing.availability': f(['iOS App Store', 'Connect website'], 'Apple App Store listing', 'https://apps.apple.com/app/id6475697994', 'retailer'),
      'safety.privacy': f('App Store privacy label (developer self-reported): identifiers used to track you across apps; email linked to you; device ID, usage and diagnostics collected but not linked. Policy: connectpelvicfloorfitness.com/privacy-policy', 'Apple App Store listing', 'https://apps.apple.com/app/id6475697994', 'retailer'),
      'health.intended_use': f('Pelvic floor fitness training app by a pelvic floor physical therapist: 19-week foundations program, advanced programs, live Q&A, community', 'Apple App Store listing', 'https://apps.apple.com/app/id6475697994', 'retailer'),
    },
  }),

  'p-sootheher-gel-pad-refills': base('in_review', {
    recall_status: 'unknown',
    notes: 'Searched for SootheHer gel pad refills and the Elaris Pod; no brand page, retailer listing or FDA record surfaced (catalog link is an affiliate short link). Nothing verified. Needs a human to open the brand page.',
    facts: {},
  }),
};

// Recall check (2026-10-13): site search of fda.gov and cpsc.gov for these
// brand names returned no recall notices. Search-based, not a database query,
// so it is recorded as "none found", never as "no recalls".
const RECALL_SEARCHED = [
  'p-womaness-me', 'p-winx-uti-pain-relief', 'p-winx-uti-daily-defense', 'p-winx-vaginal-probiotic', 'p-winx-pregnancy-tests',
  'p-winx-vaginal-health-test-treat', 'p-good-kitty-uti-biome-shield', 'p-neycher-vaginal-moisturizer', 'p-neycher-odor-be-gone',
  'p-neycher-hydrobloom-gel', 'p-phd-wash', 'p-queen-v-pop',
];
for (const id of RECALL_SEARCHED) {
  const r = REVIEWS[id];
  if (!r) continue;
  r.recall_status = 'none_found';
  r.facts['safety.recalls'] = f(
    { text: 'No recall notices found in a site search of fda.gov and cpsc.gov for this brand (2026-10-13).', flagged: false },
    'FDA and CPSC site search', 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts', 'regulatory');
}

export default REVIEWS;

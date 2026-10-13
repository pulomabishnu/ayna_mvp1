// Research pass 1 (AI-assisted, sourced). See ../reviews.js for the format.
// Batch 1: safety-priority products (supplements, topicals, vaginal inserts,
// devices, digital care). Every fact below cites the page it came from.
// Facts not found are left out on purpose (unknown, never "no").

const D = '2026-10-13';
const NEXT = '2026-10-27'; // pricing refresh, REVIEW_INTERVAL_DAYS.pricing = 14
const BY = 'ayna research pass (AI-assisted), needs human sign-off';

/** One sourced fact. */
const f = (value, source, source_url, source_type = 'brand') => ({ value, source, source_url, source_type, verified_at: D });

/** A field that does not apply to this product (e.g. dosage for a device the catalog mis-routes as ingestible). */
const na = (reason, source_url) => ({ value: null, notApplicable: true, source: reason, source_url, source_type: 'none', verified_at: D });

/** Shared header for every entry. */
const head = (qa_status, recall_status, notes) => ({
  qa_status,
  reviewed_by: BY,
  reviewed_at: D,
  last_checked: D,
  next_review_due: NEXT,
  recall_status,
  notes,
});

// Reused regulator / reference sources
const ODS = {
  iron: 'https://ods.od.nih.gov/pdf/factsheets/iron-consumer.pdf',
  vitd: 'https://ods.od.nih.gov/factsheets/vitamind-healthprofessional/',
  mg: 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/',
};

const R = {
  'p-nature-made-iron-65mg': {
    ...head('needs_clinician_review', 'none_found', 'Checked CVS and H-E-B listings (label text) and NIH ODS iron fact sheet. Recall search found only the 2016 Nature Made recall of certain gummy/other lots for possible Salmonella/S. aureus, not shown to include this tablet; no current recall found. Catalog price $10.59 not confirmed: H-E-B lists $7.06 for 180 (retailer prices vary). 65 mg elemental iron is above the NIH adult upper limit of 45 mg/day, so it is a treatment-dose product: clinician review.'),
    corrections: [
      { field: 'pricing.price', catalog: '$10.59 (180 tablets)', source_says: '$7.06 for 180 tablets at H-E-B (retailer; prices vary by store)', source_url: 'https://www.heb.com/product-detail/nature-made-iron-65-mg-tablets-180-ct/1393960' },
    ],
    facts: {
      'identity.variant': f('Iron 65 mg (from ferrous sulfate), 180 tablets', 'CVS listing (label text)', 'https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656', 'retailer'),
      'pricing.price': f('$7.06 for 180 tablets at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/nature-made-iron-65-mg-tablets-180-ct/1393960', 'retailer'),
      'pricing.size_count': f('180 tablets', 'H-E-B listing', 'https://www.heb.com/product-detail/nature-made-iron-65-mg-tablets-180-ct/1393960', 'retailer'),
      'pricing.availability': f('Sold at major US pharmacies and grocers (CVS, H-E-B, ShopRite, Kroger banners)', 'Retailer listings', 'https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656', 'retailer'),
      'composition.ingredients': f('Ferrous sulfate (65 mg elemental iron per tablet, from 325 mg ferrous sulfate heptahydrate). Other ingredients: cellulose gel, dibasic calcium phosphate, croscarmellose sodium, hypromellose, color added, magnesium stearate, polyethylene glycol, triethyl citrate, polysorbate 80', 'CVS listing (label text)', 'https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656', 'retailer'),
      'composition.active_ingredients': f(['Iron (as ferrous sulfate) 65 mg'], 'CVS listing (label text)', 'https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656', 'retailer'),
      'composition.dosage': f('Adults with iron deficiency: 1 tablet daily with water and a meal (65 mg elemental iron)', 'CVS listing (label directions)', 'https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656', 'retailer'),
      'composition.allergens': f('Labeled gluten free; no yeast or starch; no synthetic dyes or artificial flavors listed. No other allergen statement found.', 'H-E-B and CVS listings', 'https://www.heb.com/product-detail/nature-made-iron-65-mg-tablets-180-ct/1393960', 'retailer'),
      'safety.warnings': f('Accidental iron overdose is a leading cause of fatal poisoning in children under 6; keep out of reach of children; call a doctor or poison control (1-800-222-1222) on overdose. Consult a physician before use if pregnant, nursing, or taking medications.', 'H-E-B listing (label warnings)', 'https://www.heb.com/product-detail/nature-made-iron-65-mg-tablets-180-ct/1393960', 'retailer'),
      'safety.side_effects': f('High iron doses, especially on an empty stomach, can cause stomach upset, constipation, nausea, abdominal pain, vomiting and diarrhea; high doses can reduce zinc absorption.', 'NIH ODS Iron fact sheet', ODS.iron, 'regulatory'),
      'safety.medication_interactions': f('Iron can reduce absorption of levodopa and can make levothyroxine less effective; proton pump inhibitors may reduce iron absorption; calcium interferes with iron absorption (separate doses). People with hemochromatosis should avoid iron supplements.', 'NIH ODS Iron fact sheet', ODS.iron, 'regulatory'),
      'safety.pregnancy': f('Label: consult a physician before use if pregnant. NIH ODS: pregnant people should take iron as recommended by their provider.', 'H-E-B listing + NIH ODS', 'https://www.heb.com/product-detail/nature-made-iron-65-mg-tablets-180-ct/1393960', 'retailer'),
      'safety.breastfeeding': f('Label: consult a physician before use if nursing.', 'H-E-B listing (label)', 'https://www.heb.com/product-detail/nature-made-iron-65-mg-tablets-180-ct/1393960', 'retailer'),
      'safety.age_restriction': f('Directions are for adults; NIH adult upper limit is 45 mg/day (this tablet is 65 mg, a deficiency-treatment dose).', 'CVS listing + NIH ODS', ODS.iron, 'regulatory'),
      'safety.regulatory_status': f('Dietary supplement (not FDA-approved for treatment)', 'Product labeling as a dietary supplement', 'https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656', 'retailer'),
      'safety.recalls': f('No current recall found for this product. A 2016 Nature Made recall covered certain other products (possible Salmonella/S. aureus).', 'Recall news search', 'https://www.healio.com/news/infectious-disease/20160609/several-nature-made-products-recalled-due-to-possible-salmonella-s-aureus-contamination', 'regulatory'),
      'health.intended_use': f('Iron supplement for adults with iron deficiency', 'Label directions', 'https://static-assets-reg.cvshealth.com/shop/nature-made-iron-from-ferrous-sulfate-tablets-65-mg-180ct-prodid-1020656', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Iron fact sheet for consumers', url: ODS.iron, evidence_type: 'regulatory', supports: 'Iron needs, upper limit, side effects, drug interactions, pregnancy needs' },
      ], 'NIH ODS', ODS.iron, 'regulatory'),
      'evidence.claims': f([
        { claim: 'Oral iron treats or prevents iron deficiency', strength: 'strong', evidence_type: 'ingredient_research', source_url: ODS.iron, product_specific: false },
      ], 'NIH ODS', ODS.iron, 'regulatory'),
    },
  },
  'p-natures-bounty-d3-125mcg': {
    ...head('needs_clinician_review', 'none_found', 'Checked Walmart, ShopRite and Giant Food listings (label text) and NIH ODS vitamin D fact sheet. No recall found in a recall search. 5000 IU (125 mcg) per softgel is above the NIH adult upper limit of 4000 IU/day: clinician review. Retailer pages say "no soy" while listing soybean oil as an ingredient; the label should be checked for soy. Catalog price range $10-15 is consistent with Walmart $10.46 for 150.'),
    facts: {
      'identity.variant': f('Vitamin D3 125 mcg (5000 IU) rapid release softgels, 150 count', 'Walmart listing', 'https://www.walmart.com/ip/Nature-s-Bounty-D3-5000-IU-Vitamin-D-Softgels-100-count/24547758', 'retailer'),
      'pricing.price': f('$10.46 for 150 softgels at Walmart (retailer; varies)', 'Walmart listing', 'https://www.walmart.com/ip/Nature-s-Bounty-D3-5000-IU-Vitamin-D-Softgels-100-count/24547758', 'retailer'),
      'pricing.size_count': f('150 softgels (also sold in 100 count)', 'Walmart + ShopRite listings', 'https://www.shoprite.com/product/natures-bounty-d3-rapid-release-softgels-125-mcg-5000-iu-150-count-id-00074312193774', 'retailer'),
      'pricing.availability': f('Walmart, ShopRite, Giant, Rite Aid and other US retailers', 'Retailer listings', 'https://giantfoodstores.com/groceries/product/natures-bounty-5000iu-vitamin-d3-softgels-150-ct-btl/176986', 'retailer'),
      'composition.ingredients': f('Vitamin D3 (cholecalciferol) 125 mcg. Other ingredients: soybean oil, gelatin, vegetable glycerin, corn oil', 'Giant Food listing (label text)', 'https://giantfoodstores.com/groceries/product/natures-bounty-5000iu-vitamin-d3-softgels-150-ct-btl/176986', 'retailer'),
      'composition.active_ingredients': f(['Vitamin D3 (cholecalciferol) 125 mcg (5000 IU)'], 'Walmart listing', 'https://www.walmart.com/ip/Nature-s-Bounty-D3-5000-IU-Vitamin-D-Softgels-100-count/24547758', 'retailer'),
      'composition.dosage': f('Adults: 1 softgel daily, preferably with a meal (125 mcg / 5000 IU)', 'Giant Food listing (label directions)', 'https://giantfoodstores.com/groceries/product/natures-bounty-5000iu-vitamin-d3-softgels-150-ct-btl/176986', 'retailer'),
      'composition.allergens': f('Contains soybean oil and gelatin (animal-derived). Listing claims no milk, lactose, gluten, wheat, yeast or fish; it also claims "no soy", which conflicts with soybean oil in the ingredients. Check the physical label.', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/natures-bounty-5000iu-vitamin-d3-softgels-150-ct-btl/176986', 'retailer'),
      'safety.warnings': f('If pregnant, nursing, taking any medications or with any medical condition, consult your doctor before use. Discontinue and consult a doctor if adverse reactions occur. Keep out of reach of children.', 'Giant Food listing (label warnings)', 'https://giantfoodstores.com/groceries/product/natures-bounty-5000iu-vitamin-d3-softgels-150-ct-btl/176986', 'retailer'),
      'safety.side_effects': f('Excess vitamin D can raise blood calcium, causing nausea, vomiting, muscle weakness, loss of appetite, excessive thirst and urination, and kidney stones; severe toxicity can damage kidneys and heart.', 'NIH ODS Vitamin D fact sheet', ODS.vitd, 'regulatory'),
      'safety.medication_interactions': f('Orlistat reduces vitamin D absorption; statins may interact (high vitamin D may reduce atorvastatin, lovastatin, simvastatin potency); corticosteroids such as prednisone and thiazide diuretics affect vitamin D or calcium levels.', 'NIH ODS Vitamin D fact sheet', ODS.vitd, 'regulatory'),
      'safety.pregnancy': f('Label: consult your doctor before use if pregnant. NIH upper limit (4000 IU/day) also applies in pregnancy; this softgel is 5000 IU.', 'Giant Food listing + NIH ODS', 'https://giantfoodstores.com/groceries/product/natures-bounty-5000iu-vitamin-d3-softgels-150-ct-btl/176986', 'retailer'),
      'safety.breastfeeding': f('Label: consult your doctor before use if nursing.', 'Giant Food listing (label)', 'https://giantfoodstores.com/groceries/product/natures-bounty-5000iu-vitamin-d3-softgels-150-ct-btl/176986', 'retailer'),
      'safety.age_restriction': f('Directions are for adults. NIH adult upper limit is 4000 IU (100 mcg)/day.', 'Label directions + NIH ODS', ODS.vitd, 'regulatory'),
      'safety.regulatory_status': f('Dietary supplement; label carries the FDA "not evaluated" disclaimer', 'ShopRite listing', 'https://www.shoprite.com/product/natures-bounty-d3-rapid-release-softgels-125-mcg-5000-iu-150-count-id-00074312193774', 'retailer'),
      'safety.recalls': f('No recall found for this product (recall search, Oct 2026).', 'Web recall search', 'https://www.riteaid.com/shop/natures-bounty-vitamin-d-maximum-strength-5000-iu-softgels-150-softgels-0349525', 'retailer'),
      'health.intended_use': f('Vitamin D3 supplement (manufacturer: immune and bone health support)', 'Walmart listing (manufacturer claims)', 'https://www.walmart.com/ip/Nature-s-Bounty-D3-5000-IU-Vitamin-D-Softgels-100-count/24547758', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Vitamin D fact sheet for health professionals', url: ODS.vitd, evidence_type: 'regulatory', supports: 'Upper limit, toxicity, drug interactions, role in bone health' },
      ], 'NIH ODS', ODS.vitd, 'regulatory'),
      'evidence.claims': f([
        { claim: 'Vitamin D corrects deficiency and supports bone health', strength: 'strong', evidence_type: 'ingredient_research', source_url: ODS.vitd, product_specific: false },
      ], 'NIH ODS', ODS.vitd, 'regulatory'),
    },
  },

  'p-magnesium-glycinate': {
    ...head('needs_correction', 'none_found', 'Catalog has no brand or URL. Checked ShopRite, Wegmans and Hannaford listings (label text) and NIH ODS magnesium fact sheet. Variant is Nature Made High Absorption Magnesium Glycinate 200 mg, 60 capsules (2 capsules daily). Catalog other ingredients are wrong (no "cellulose capsule"; label lists hypromellose, magnesium stearate, cellulose gel, silicon dioxide). Catalog $15 vs ShopRite regular $21.99 (on sale $10.99 this week). No recall found beyond the 2016 Nature Made recall of other products.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Magnesium glycinate 200mg, cellulose capsule, magnesium stearate.', source_says: 'Magnesium (as glycinate, chelated) 200 mg per 2 capsules; other ingredients hypromellose, magnesium stearate, cellulose gel, silicon dioxide', source_url: 'https://www.wegmans.com/shop/product/927697' },
      { field: 'pricing.price', catalog: '$15 for 60 capsules', source_says: '$21.99 regular ($10.99 sale) for 60 capsules at ShopRite', source_url: 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131' },
      { field: 'identity.brand', catalog: '(missing)', source_says: 'Nature Made', source_url: 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131' },
    ],
    facts: {
      'identity.brand': f('Nature Made', 'ShopRite listing', 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131', 'retailer'),
      'identity.variant': f('High Absorption Magnesium Glycinate 200 mg, 60 capsules', 'ShopRite listing', 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131', 'retailer'),
      'pricing.price': f('$21.99 regular for 60 capsules at ShopRite (sale $10.99, Oct 11-17 2026)', 'ShopRite listing', 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131', 'retailer'),
      'pricing.size_count': f('60 capsules (30 servings of 2)', 'ShopRite + Hannaford listings', 'https://hannaford.com/groceries/health-beauty/vitamins-supplements/minerals/nature-made-high-absorption-200mg-magnesium-glycinate-capsules-60-ct-btl.html', 'retailer'),
      'pricing.availability': f('ShopRite, Wegmans, Hannaford, Food Lion, Giant and other US grocers', 'Retailer listings', 'https://www.wegmans.com/shop/product/927697', 'retailer'),
      'composition.ingredients': f('Magnesium (as magnesium glycinate, chelated) 200 mg. Other ingredients: hypromellose, magnesium stearate, cellulose gel, silicon dioxide', 'Wegmans + ShopRite listings (label text)', 'https://www.wegmans.com/shop/product/927697', 'retailer'),
      'composition.active_ingredients': f(['Magnesium (as magnesium glycinate) 200 mg'], 'ShopRite listing', 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131', 'retailer'),
      'composition.dosage': f('Adults: 2 capsules daily with water and a meal (200 mg magnesium)', 'Hannaford listing (label directions)', 'https://hannaford.com/groceries/health-beauty/vitamins-supplements/minerals/nature-made-high-absorption-200mg-magnesium-glycinate-capsules-60-ct-btl.html', 'retailer'),
      'composition.allergens': f('Labeled gluten free; no color added; no artificial flavors. No other allergen statement found.', 'ShopRite listing', 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131', 'retailer'),
      'safety.warnings': f('People with kidney disease or taking any medication should consult a physician before use. Do not use if seal under cap is broken or missing. Keep out of reach of children.', 'Hannaford listing (label warnings)', 'https://hannaford.com/groceries/health-beauty/vitamins-supplements/minerals/nature-made-high-absorption-200mg-magnesium-glycinate-capsules-60-ct-btl.html', 'retailer'),
      'safety.side_effects': f('High supplemental magnesium can cause diarrhea, nausea and abdominal cramping; very high doses can cause toxicity, especially with impaired kidney function.', 'NIH ODS Magnesium fact sheet', ODS.mg, 'regulatory'),
      'safety.medication_interactions': f('Reduces absorption of oral bisphosphonates (separate by 2 hours) and tetracycline/quinolone antibiotics (take antibiotic 2 hours before or 4-6 hours after); loop/thiazide diuretics and long-term PPIs can lower magnesium; potassium-sparing diuretics reduce magnesium excretion.', 'NIH ODS Magnesium fact sheet', ODS.mg, 'regulatory'),
      'safety.pregnancy': f('No product-specific pregnancy statement found on retailer pages. NIH: supplemental magnesium upper limit of 350 mg/day applies in pregnancy and lactation.', 'NIH ODS Magnesium fact sheet', ODS.mg, 'regulatory'),
      'safety.age_restriction': f('Directions are for adults. NIH upper limit for supplemental magnesium: 350 mg/day for adults.', 'Label directions + NIH ODS', ODS.mg, 'regulatory'),
      'safety.regulatory_status': f('Dietary supplement; carries the FDA "not evaluated" disclaimer', 'ShopRite listing', 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131', 'retailer'),
      'safety.recalls': f('No recall found for this product. A 2016 Nature Made recall covered certain other products.', 'Recall news search', 'https://www.healio.com/news/infectious-disease/20160609/several-nature-made-products-recalled-due-to-possible-salmonella-s-aureus-contamination', 'regulatory'),
      'health.intended_use': f('Magnesium supplement (manufacturer markets it as high absorption and gentle on the stomach)', 'ShopRite listing (manufacturer claims)', 'https://www.shoprite.com/product/nature-made-high-absorption-magnesium-glycinate-200-mg-capsules-60-count-id-00031604043131', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Magnesium fact sheet for health professionals', url: ODS.mg, evidence_type: 'regulatory', supports: 'Upper limit, adverse effects, medication interactions, research on magnesium and health conditions' },
      ], 'NIH ODS', ODS.mg, 'regulatory'),
      'evidence.claims': f([
        { claim: 'Magnesium supplementation corrects low magnesium intake', strength: 'strong', evidence_type: 'ingredient_research', source_url: ODS.mg, product_specific: false },
      ], 'NIH ODS', ODS.mg, 'regulatory'),
    },
  },
  'p-ubiquinol-thorne': {
    ...head('needs_correction', 'none_found', 'Checked Vitacost listing (label text) and NIH NCCIH CoQ10 page. Catalog ingredients (olive oil, lycopene) do not match the current Thorne label (MCT, bovine gelatin softgel, beeswax, sunflower lecithin, annatto). Catalog price $52 vs Vitacost $78 for 60. Recall search found only a 2014 FDA warning on Thorne Captomer products (unrelated); none for Ubiquinol.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Ubiquinol 100mg, Olive Oil, Gelatin, Glycerin, Water, Lycopene.', source_says: 'Kaneka Ubiquinol 100 mg; other: medium chain triglycerides, softgel (bovine gelatin, vegetable glycerin, purified water, annatto color), beeswax, sunflower lecithin', source_url: 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877' },
      { field: 'pricing.price', catalog: '$52 for 60 softgels', source_says: '$78.00 for 60 softgels (Vitacost)', source_url: 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877' },
    ],
    facts: {
      'identity.brand': f('Thorne', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'identity.variant': f('Ubiquinol 100 mg, 60 softgels', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'pricing.price': f('$78.00 for 60 softgels (Vitacost)', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'pricing.size_count': f('60 softgels (60 servings)', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'pricing.availability': f('Thorne, Vitacost and other online supplement retailers', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'composition.ingredients': f('Ubiquinol (Kaneka) 100 mg. Other ingredients: medium chain triglycerides, softgel (bovine gelatin, vegetable glycerin, purified water, annatto color), beeswax, sunflower lecithin', 'Vitacost listing (label text)', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'composition.active_ingredients': f(['Ubiquinol (reduced CoQ10) 100 mg'], 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'composition.dosage': f('1 softgel one to two times daily, or as recommended by a practitioner (100-200 mg ubiquinol)', 'Vitacost listing (label directions)', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'composition.allergens': f('Listed as gluten free. Contains bovine gelatin and sunflower lecithin. No other allergen statement found. NSF Contents Certified.', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'safety.warnings': f('If pregnant, consult your health-care practitioner before use. Use only if bottle is sealed.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'safety.side_effects': f('No serious side effects reported; mild insomnia or digestive upset may occur.', 'NIH NCCIH Coenzyme Q10', 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd', 'regulatory'),
      'safety.medication_interactions': f('CoQ10 may interact with warfarin and insulin, and may not be compatible with some cancer treatments.', 'NIH NCCIH Coenzyme Q10', 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd', 'regulatory'),
      'safety.pregnancy': f('Label: if pregnant, consult your health-care practitioner before use.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement; NSF Contents Certified', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'safety.recalls': f('No recall found for Thorne Ubiquinol. FDA issued a 2014 warning on Thorne Captomer chelation products (different products).', 'FDA', 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-warns-consumers-about-potential-health-risks-using-thorne-researchs-captomer-products', 'regulatory'),
      'health.intended_use': f('CoQ10 (ubiquinol form) supplement', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-ubiquinol-100-mg-60-softgels-161877', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH NCCIH: Coenzyme Q10', url: 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd', evidence_type: 'regulatory', supports: 'Safety, interactions, and that evidence is inconclusive or negative for most conditions studied (heart failure, statin muscle pain, Parkinson\'s); too limited for infertility' },
      ], 'NIH NCCIH', 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd', 'regulatory'),
      'evidence.claims': f([
        { claim: 'CoQ10 improves fertility', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd', product_specific: false },
        { claim: 'CoQ10 relieves statin-related muscle pain', strength: 'none', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd', product_specific: false },
      ], 'NIH NCCIH', 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd', 'regulatory'),
    },
  },

  'p-uqora-control': {
    ...head('needs_correction', 'none_found', 'MAJOR: the catalog describes Uqora Control as D-mannose + hibiscus, but the current Uqora product is "In Control Bladder Support", a Urox botanical blend (horsetail, lindera, crateva) for urinary urgency, frequency and leaks, not a UTI/D-mannose product. Health mapping should move from UTI to bladder urgency/leaks. Checked Uqora product page (Canada store), SuppCo label data, ClinicalTrials.gov. No recall found. Label says not for use if pregnant or nursing: clinician review.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'D-mannose, hibiscus extract.', source_says: 'Urox proprietary blend 840 mg per 2 capsules: horsetail (Equisetum arvense), lindera (Lindera aggregata), three-leaf caper (Crateva nurvala) extracts', source_url: 'https://supp.co/products/uqora-in-control-bladder-support' },
      { field: 'identity.name', catalog: 'Uqora Control', source_says: 'In Control Bladder Support', source_url: 'https://uqora.com/en-ca/products/in-control-bladder-support' },
      { field: 'health.uses', catalog: 'UTI prevention (D-mannose)', source_says: 'Urinary urgency, frequency and occasional leaks associated with aging', source_url: 'https://uqora.com/en-ca/products/in-control-bladder-support' },
      { field: 'pricing.price', catalog: '$25/month', source_says: 'From $34.99 for 30 servings (US, SuppCo); CA$51 one-time / CA$43.72 subscription on Uqora Canada', source_url: 'https://supp.co/products/uqora-in-control-bladder-support' },
    ],
    facts: {
      'identity.name': f('Uqora In Control Bladder Support', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'identity.variant': f('60 capsules (1-month supply)', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'pricing.price': f('From $34.99 for 30 servings (US); subscription available', 'SuppCo listing', 'https://supp.co/products/uqora-in-control-bladder-support', 'retailer'),
      'pricing.size_count': f('60 capsules, 30 servings', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'pricing.availability': f('Uqora website (one-time or subscription) and Walmart', 'Uqora page + Walmart listing', 'https://www.walmart.com/ip/Uqora-In-Control-Bladder-Support/5993977787', 'retailer'),
      'composition.ingredients': f('Urox proprietary blend 840 mg per 2 capsules: horsetail stem extract (Equisetum arvense), lindera root extract (Lindera aggregata), three-leaf caper stem bark extract (Crateva nurvala, standardized to 3 mg lupeol). Individual amounts not disclosed.', 'SuppCo label data + Uqora page', 'https://supp.co/products/uqora-in-control-bladder-support', 'retailer'),
      'composition.active_ingredients': f(['Urox blend (horsetail, lindera, crateva) 840 mg'], 'SuppCo label data', 'https://supp.co/products/uqora-in-control-bladder-support', 'retailer'),
      'composition.dosage': f('2 capsules once daily with food', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'composition.allergens': f('Do not use if allergic to any ingredient; brand says Urox rarely causes a rash, possibly in people sensitive to grasses such as horsetail.', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'safety.warnings': f('Not for use with urinary retention. Not for use if pregnant or nursing. Consult a physician if taking medication or with a medical condition.', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'safety.side_effects': f('Rare rash reported by the brand (Urox).', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'safety.medication_interactions': f('Brand says no known drug interactions but advises checking with a provider; label says consult a physician if taking medication. No NIH interaction data found.', 'Uqora product page (manufacturer)', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'safety.pregnancy': f('Label: not for use if pregnant.', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'safety.breastfeeding': f('Label: not for use if nursing.', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'safety.regulatory_status': f('Dietary supplement; brand states it is not intended to diagnose, treat, cure or prevent disease', 'Uqora product page', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.walmart.com/brand/uqora/10055859', 'retailer'),
      'health.intended_use': f('Bladder support for urinary urgency, frequency and occasional leaks associated with normal aging', 'Uqora product page (manufacturer)', 'https://uqora.com/en-ca/products/in-control-bladder-support'),
      'evidence.sources': f([
        { title: 'ClinicalTrials.gov NCT02396160: Urox for overactive bladder and urinary incontinence', url: 'https://clinicaltrials.gov/study/NCT02396160', evidence_type: 'ingredient_research', supports: 'Phase 2 randomized placebo-controlled trial of the Urox blend (the ingredient), not the Uqora product itself' },
        { title: 'Uqora In Control product page', url: 'https://uqora.com/en-ca/products/in-control-bladder-support', evidence_type: 'manufacturer', supports: 'Manufacturer-reported trial results (urgency, frequency, nighttime trips)' },
      ], 'ClinicalTrials.gov + brand', 'https://clinicaltrials.gov/study/NCT02396160', 'research'),
      'evidence.claims': f([
        { claim: 'Reduces urinary urgency and daytime frequency', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://clinicaltrials.gov/study/NCT02396160', product_specific: false },
        { claim: 'Prevents UTIs', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://uqora.com/en-ca/products/in-control-bladder-support', product_specific: true },
      ], 'ClinicalTrials.gov + brand', 'https://clinicaltrials.gov/study/NCT02396160', 'research'),
    },
  },
  'p-d-mannose-now': {
    ...head('needs_clinician_review', 'none_found', 'Checked NOW Foods product page (label, prices) and recallcheck.net FDA enforcement list for NOW (no D-mannose recall). Catalog price $12 for 60 vs brand list price $16.99 for 60 (20 servings of 3 capsules). A 2024 randomized trial (MERIT, n=598, JAMA Intern Med) found D-mannose did not reduce recurrent UTIs in women; evidence claims should not be strong. Supplement used for UTI prevention: clinician review.'),
    corrections: [
      { field: 'pricing.price', catalog: '$12 for 60 caps', source_says: '$16.99 for 60 veg capsules (brand list price)', source_url: 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules' },
    ],
    facts: {
      'identity.variant': f('D-Mannose 500 mg, 60 veg capsules (also 100, 120, 240)', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'pricing.price': f('$16.99 for 60 veg capsules (brand list price; retailers often lower)', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'pricing.size_count': f('60 veg capsules = 20 servings of 3 capsules', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'pricing.availability': f('NOW Foods website, Vitacost, Walmart and other retailers', 'Retailer listings', 'https://www.vitacost.com/products/now-foods-d-mannose-500-mg-60-veg-capsules-123462', 'retailer'),
      'composition.ingredients': f('D-mannose 1.5 g per 3 capsules (2 g carbohydrate, 2 g sugars, 10 calories). Other ingredients: hypromellose (cellulose capsule), rice flour, stearic acid, magnesium stearate, silicon dioxide', 'NOW Foods product page (Supplement Facts)', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'composition.active_ingredients': f(['D-mannose 1,500 mg per 3 capsules'], 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'composition.dosage': f('3 capsules 1 to 3 times daily with water or unsweetened juice (1.5-4.5 g D-mannose/day)', 'NOW Foods product page (suggested use)', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'composition.allergens': f('Not manufactured with yeast, wheat, gluten, soy, milk, egg, fish, shellfish, tree nut or sesame ingredients; made in a GMP facility that processes these allergens.', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'safety.warnings': f('For adults only. Consult a physician if pregnant or nursing, taking medication, or with a medical condition. Keep out of reach of children.', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'safety.pregnancy': f('Label: consult a physician if pregnant.', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'safety.breastfeeding': f('Label: consult a physician if nursing.', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'safety.medication_interactions': f('Label: consult a physician if taking medication. No specific interactions named by the brand; no NIH ODS fact sheet for D-mannose found.', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'safety.age_restriction': f('For adults only', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'safety.regulatory_status': f('Dietary supplement', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'safety.recalls': f('No D-mannose recall in the FDA enforcement records listed for NOW Foods (other NOW products recalled 2013-2025).', 'recallcheck.net (FDA enforcement data)', 'https://recallcheck.net/brand/now-foods', 'regulatory'),
      'health.intended_use': f('Urinary tract support (manufacturer claim)', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/d-mannose-urinary-support-500-mg-veg-capsules'),
      'evidence.sources': f([
        { title: 'd-Mannose for Prevention of Recurrent UTI Among Women: A Randomized Clinical Trial (JAMA Intern Med 2024)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11334993', evidence_type: 'ingredient_research', supports: 'Large placebo-controlled trial: daily D-mannose did not reduce the proportion of women with a medically attended UTI' },
        { title: 'NIHR Evidence alert: D-mannose does not prevent UTIs', url: 'https://evidence.nihr.ac.uk/alert/d-mannose-does-not-prevent-urinary-tract-infections-utis/', evidence_type: 'expert_guidance', supports: 'Plain-language summary of the MERIT trial' },
      ], 'PubMed Central + NIHR', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11334993', 'research'),
      'evidence.claims': f([
        { claim: 'D-mannose prevents recurrent UTIs', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11334993', product_specific: false },
      ], 'PubMed Central', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11334993', 'research'),
    },
  },

  'p-cystex': {
    ...head('needs_clinician_review', 'none_found', 'This is an OTC drug (methenamine 162 mg + sodium salicylate 162.5 mg, an NSAID/salicylate), not a supplement. Checked Giant Food listing (Drug Facts text) and Drugs.com consumer monograph. Has Reye\'s syndrome, stomach-bleeding and third-trimester NSAID warnings, salicylate/aspirin allergy contraindication, and blood thinner/diabetes/gout interactions: clinician review. Catalog price $10 not re-verified (retailer page showed no price). No recall found.'),
    facts: {
      'identity.name': f('Cystex Urinary Health Dual Action Pain Relief Tablets', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'identity.variant': f('24 tablets (also sold as Maximum Strength 48 count)', 'Giant Food + Hannaford listings', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'pricing.size_count': f('24 tablets', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'pricing.availability': f('US drugstores and grocers (Giant, Hannaford, Instacart retailers)', 'Retailer listings', 'https://hannaford.com/groceries/product/cystex-uti-pain-relief-bacterial-control-max-strength-tablets-48-ct-btl/335032', 'retailer'),
      'composition.ingredients': f('Active: methenamine 162 mg (antibacterial), sodium salicylate 162.5 mg (NSAID pain reliever). Inactive: benzoic acid, cellulose, croscarmellose sodium, edible black ink, FD&C Red #40 lake, FD&C Yellow #6 lake, hydroxypropyl cellulose, hypromellose, magnesium stearate, methacrylic acid-ethyl acrylate copolymer, silica, stearic acid, titanium dioxide, triethyl citrate', 'Giant Food listing (Drug Facts)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'composition.active_ingredients': f(['Methenamine 162 mg', 'Sodium salicylate 162.5 mg'], 'Giant Food listing (Drug Facts)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'composition.dosage': f('Adults and children 12+: 2 tablets with a full glass of water 3 times a day; do not use more than 3 days unless directed by a doctor', 'Giant Food listing (Drug Facts directions)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'composition.allergens': f('Do not use if allergic to salicylates (including aspirin) or methenamine. Contains FD&C Red #40 and Yellow #6 dyes.', 'Giant Food listing + Drugs.com', 'https://drugs.com/otc/433290/cystex-plus.html', 'retailer'),
      'safety.warnings': f('Reye\'s syndrome warning (children/teens with flu or chickenpox); stomach bleeding warning (higher risk 60+, ulcers, blood thinners, steroids, other NSAIDs, 3+ drinks/day); do not use if allergic to salicylates/aspirin; ask a doctor first if first-time urinary symptoms, heart/liver/kidney disease, high blood pressure, or sodium-restricted diet; stop if ringing in ears or bleeding signs.', 'Giant Food listing (Drug Facts)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'safety.side_effects': f('Possible stomach or intestinal bleeding, allergic reactions, ringing in the ears, light-headedness; NSAIDs can raise heart attack and stroke risk.', 'Drugs.com consumer information', 'https://drugs.com/otc/433290/cystex-plus.html', 'retailer'),
      'safety.medication_interactions': f('Ask a doctor or pharmacist if taking a diuretic, anticoagulant (e.g. warfarin), steroid, insulin or oral diabetes drugs, gout or arthritis medicine, or other aspirin/NSAID products.', 'Giant Food listing (Drug Facts) + Drugs.com', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'safety.pregnancy': f('Ask a health professional before use if pregnant. Do not use in the last 3 months of pregnancy unless directed by a doctor (NSAID risk to the baby).', 'Giant Food listing (Drug Facts)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'safety.breastfeeding': f('Ask a health professional before use if breastfeeding.', 'Giant Food listing (Drug Facts)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'safety.age_restriction': f('Adults and children 12 and over; under 12 ask a doctor. Reye\'s syndrome warning for children and teens.', 'Giant Food listing (Drug Facts)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'safety.regulatory_status': f('OTC drug with a Drug Facts label (urinary analgesic/antibacterial)', 'Giant Food listing (Drug Facts)', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://drugs.com/otc/433290/cystex-plus.html', 'retailer'),
      'health.intended_use': f('Temporary relief of painful or burning urination and urgency/frequency from bladder infection or irritation; may slow bacterial growth. Not a substitute for antibiotics; see a doctor if symptoms last past 3 days.', 'Drugs.com consumer information + Drug Facts', 'https://drugs.com/otc/433290/cystex-plus.html', 'retailer'),
      'evidence.sources': f([
        { title: 'Cystex Drug Facts (Giant Food listing)', url: 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', evidence_type: 'regulatory', supports: 'Labeled OTC uses, dose, warnings' },
        { title: 'Cleveland Clinic: methenamine/sodium salicylate tablets', url: 'https://my.clevelandclinic.org/health/drugs/methenamine-sodium-salicylate-tablets', evidence_type: 'expert_guidance', supports: 'Consumer drug information for this combination' },
      ], 'Drug Facts + Cleveland Clinic', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Relieves urinary pain and burning (salicylate analgesic)', strength: 'moderate', evidence_type: 'regulatory', source_url: 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', product_specific: true },
        { claim: 'Treats or cures a UTI', strength: 'none', evidence_type: 'regulatory', source_url: 'https://drugs.com/otc/433290/cystex-plus.html', product_specific: true },
      ], 'Drug Facts', 'https://giantfoodstores.com/groceries/product/cystex-urinary-health-dual-action-pain-relief-tablets-24-ct-box/361712', 'regulatory'),
    },
  },
  'p-inositol-wholesome': {
    ...head('needs_clinician_review', 'none_found', 'Checked Vitacost listing (label text) and the 2023 PCOS guideline meta-analysis on inositol. Variant: Myo & D-Chiro Inositol 120 vegetarian capsules (30 servings of 4). Not the "with MTHF folate + D3" version. Catalog $25 vs Vitacost $27.95. No recall found. PCOS/fertility use and pregnancy-planning population: clinician review.'),
    corrections: [
      { field: 'pricing.price', catalog: '$25 for 30 servings', source_says: '$27.95 for 120 capsules (30 servings) at Vitacost', source_url: 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887' },
    ],
    facts: {
      'identity.variant': f('Myo & D-Chiro Inositol (40:1), 120 vegetarian capsules; not the MTHF folate + D3 version', 'Vitacost listing', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'pricing.price': f('$27.95 for 120 capsules (360 count $69.95)', 'Vitacost listing', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'pricing.size_count': f('120 capsules = 30 servings of 4', 'Vitacost listing', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'pricing.availability': f('Vitacost, Thrive Market, Walmart, brand website', 'Retailer listings', 'https://thrivemarket.com/p/wholesome-story-myo-inositol-d-chiro-inositol', 'retailer'),
      'composition.ingredients': f('Per 4 capsules: myo-inositol 2,000 mg, D-chiro inositol 50 mg. Other ingredients: methylcellulose (capsule), rice flour', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'composition.active_ingredients': f(['Myo-inositol 2,000 mg', 'D-chiro inositol 50 mg'], 'Vitacost listing', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'composition.dosage': f('4 capsules daily with a meal (or 2 capsules twice daily)', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'composition.allergens': f('Brand claims vegan friendly; no formal allergen statement found.', 'Vitacost listing', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'safety.warnings': f('Consult a healthcare provider before use if pregnant, contemplating pregnancy, nursing, have a medical condition, or take medications. For adult use only. Keep out of reach of children.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'safety.pregnancy': f('Label: consult a healthcare provider before use if pregnant or contemplating pregnancy.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'safety.breastfeeding': f('Label: consult a healthcare provider before use if nursing.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'safety.medication_interactions': f('Label: consult a healthcare provider if taking medications. No specific interactions named.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'safety.side_effects': f('The PCOS guideline review found gastrointestinal side effects were more common with metformin than with inositol; no product-specific side-effect data.', 'PCOS guideline meta-analysis (JCEM 2024)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11099481', 'research'),
      'safety.age_restriction': f('For adult use only', 'Vitacost listing (label)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement; brand says third-party tested (Clean Label Project Purity Award), lab and results not published', 'Vitacost listing', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.walmart.com/ip/253300772', 'retailer'),
      'health.intended_use': f('Manufacturer: supports healthy hormone levels, menstrual cycles and ovarian health (PCOS-oriented)', 'Vitacost listing (manufacturer claims)', 'https://www.vitacost.com/products/wholesome-story-myo-d-chiro-inositol-120-vegetarian-capsules-114887', 'retailer'),
      'evidence.sources': f([
        { title: 'Inositol for PCOS: systematic review and meta-analysis informing the 2023 international PCOS guideline (JCEM 2024)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11099481', evidence_type: 'clinical_guideline', supports: 'Inositol may help some metabolic measures but evidence for PCOS outcomes is limited and inconclusive; not this specific product' },
      ], 'PubMed Central', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11099481', 'research'),
      'evidence.claims': f([
        { claim: 'Inositol improves PCOS symptoms (cycles, ovulation, metabolic markers)', strength: 'limited', evidence_type: 'clinical_guideline', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11099481', product_specific: false },
      ], 'PubMed Central', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11099481', 'research'),
    },
  },

  'p-spearmint-pcos': {
    ...head('in_review', 'none_found', 'Checked Whole Foods and Fullscript listings: single ingredient organic spearmint leaf, 16 tea bags, no label warnings. No pregnancy or interaction statement found on the label (left unknown). Evidence for PCOS is one small 30-day RCT (Grant 2010). Recall search found only a 2018 Canadian recall of a different Traditional Medicinals tea (Throat Coat). Price not re-verified.'),
    facts: {
      'identity.variant': f('Organic Spearmint, caffeine free, 16 tea bags', 'Whole Foods listing', 'https://www.wholefoodsmarket.com/product/traditional-medicinals-organic-spearmint-tea-16-tea-bag-b014uhixam', 'retailer'),
      'pricing.size_count': f('16 tea bags', 'Whole Foods listing', 'https://www.wholefoodsmarket.com/product/traditional-medicinals-organic-spearmint-tea-16-tea-bag-b014uhixam', 'retailer'),
      'pricing.availability': f('Whole Foods, Food Lion and other grocers', 'Retailer listings', 'https://foodlion.com/groceries/beverages/tea/packaged-hot-tea-bags/packaged-herbal-wellness-tea-bags/traditional-medicinals-organic-caffeine-free-spearmint-herbal-tea-bags-16-ct-box.html', 'retailer'),
      'composition.ingredients': f('Organic spearmint leaf (Mentha spicata); no other ingredients', 'Fullscript listing (label)', 'https://fullscript.com/en-CA/catalog/products/organic-spearmint-tea', 'retailer'),
      'composition.active_ingredients': f(['Spearmint leaf (Mentha spicata)'], 'Fullscript listing', 'https://fullscript.com/en-CA/catalog/products/organic-spearmint-tea', 'retailer'),
      'composition.dosage': f('1 tea bag in 240 ml freshly boiled water, covered, steeped 5-10 minutes (amount of leaf per bag not stated)', 'Fullscript listing (directions)', 'https://fullscript.com/en-CA/catalog/products/organic-spearmint-tea', 'retailer'),
      'composition.allergens': f('Single ingredient (spearmint leaf); certified organic, Non-GMO verified, kosher, caffeine free. No allergen statement found.', 'Whole Foods + Fullscript listings', 'https://www.wholefoodsmarket.com/product/traditional-medicinals-organic-spearmint-tea-16-tea-bag-b014uhixam', 'retailer'),
      'safety.warnings': f('Label carries no specific warnings (per Fullscript label data).', 'Fullscript listing', 'https://fullscript.com/en-CA/catalog/products/organic-spearmint-tea', 'retailer'),
      'safety.regulatory_status': f('Herbal tea sold as food/dietary supplement; certified organic', 'Whole Foods listing', 'https://www.wholefoodsmarket.com/product/traditional-medicinals-organic-spearmint-tea-16-tea-bag-b014uhixam', 'retailer'),
      'safety.recalls': f('No recall found for Spearmint tea; a 2018 Canadian recall covered one lot of Traditional Medicinals Throat Coat Lemon Echinacea (different product).', 'Health Canada recall', 'https://recalls-rappels.canada.ca/en/alert-recall/one-lot-traditional-medicinals-throat-coat-lemon-echinacea-herbal-tea-recalled-because', 'regulatory'),
      'health.intended_use': f('Caffeine-free herbal tea (brand positions it for digestion/enjoyment); used in PCOS research as a possible anti-androgen', 'Fullscript listing + PubMed', 'https://pubmed.ncbi.nlm.nih.gov/19585478', 'research'),
      'evidence.sources': f([
        { title: 'Grant 2010, Spearmint herbal tea has significant anti-androgen effects in PCOS: a randomized controlled trial (Phytother Res)', url: 'https://pubmed.ncbi.nlm.nih.gov/19585478', evidence_type: 'ingredient_research', supports: 'Small 30-day RCT (42 women): spearmint tea twice daily lowered free testosterone; self-reported hirsutism improved, objective hirsutism scores did not change in that time' },
      ], 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/19585478', 'research'),
      'evidence.claims': f([
        { claim: 'Spearmint tea lowers androgens / helps hirsutism in PCOS', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://pubmed.ncbi.nlm.nih.gov/19585478', product_specific: false },
      ], 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/19585478', 'research'),
    },
  },
  'p-pink-stork-bloat': {
    ...head('needs_correction', 'unknown', 'Could not find a Pink Stork "Bloat Support" capsule with fennel, dandelion, ginger and lemon balm (catalog). The only Pink Stork bloat product found is "Bloat Gummies" (turmeric + ginger, 60 gummies, 2 daily) on a reseller page with no Supplement Facts, warnings or price in USD. Catalog ingredients, format and price are unverified and probably wrong; catalog has no image. Recommend pulling the product or replacing it with a verifiable listing. Recall status unknown (product identity unclear).'),
    corrections: [
      { field: 'identity.name', catalog: 'Pink Stork Bloat Support (30 capsules)', source_says: 'Pink Stork Bloat Gummies, turmeric and ginger, 60 spiced apricot gummies', source_url: 'https://kiwla.com/pink-stork-bloat-gummies-turmeric-and-ginger-for-digestion-detox-gas-energy-support-and-immune-health-60-spiced-apricot-bloating-supplements' },
      { field: 'composition.ingredients', catalog: 'Fennel seed, dandelion root, ginger root, lemon balm.', source_says: 'Key ingredients turmeric and ginger (amounts not published on the page found)', source_url: 'https://kiwla.com/pink-stork-bloat-gummies-turmeric-and-ginger-for-digestion-detox-gas-energy-support-and-immune-health-60-spiced-apricot-bloating-supplements' },
    ],
    facts: {
      'identity.variant': f('Bloat Gummies, spiced apricot, 60 count (only Pink Stork bloat product found)', 'Reseller listing (Kiwla)', 'https://kiwla.com/pink-stork-bloat-gummies-turmeric-and-ginger-for-digestion-detox-gas-energy-support-and-immune-health-60-spiced-apricot-bloating-supplements', 'retailer'),
      'composition.dosage': f('2 gummies daily (amount per serving not published on the page found)', 'Reseller listing (Kiwla)', 'https://kiwla.com/pink-stork-bloat-gummies-turmeric-and-ginger-for-digestion-detox-gas-energy-support-and-immune-health-60-spiced-apricot-bloating-supplements', 'retailer'),
      'health.intended_use': f('Manufacturer: digestion and bloating support', 'Reseller listing (manufacturer claims)', 'https://kiwla.com/pink-stork-bloat-gummies-turmeric-and-ginger-for-digestion-detox-gas-energy-support-and-immune-health-60-spiced-apricot-bloating-supplements', 'retailer'),
    },
  },

  'p-love-wellness-bloat': {
    ...head('needs_correction', 'none_found', 'Checked Target listing (label + brand Q&A) and Citruslabs study page. Catalog ingredients are wrong: there is no probiotic blend; the label blend is fenugreek, dandelion, fennel, ginger, parsley plus amylase, protease, pepsin, lipase, bromelain, papain (700 mg blend). Pepsin is animal-derived (not vegan). Price $24.49 at Target matches catalog. The only product study is a single-arm, self-reported Citruslabs study with no control. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Digestive enzymes (amylase, protease, lipase), ginger root, dandelion root, probiotic blend.', source_says: '700 mg blend: organic fenugreek seed, dandelion root, fennel seed, ginger root, parsley leaf; amylase, protease, pepsin, lipase, bromelain, papain. No probiotics.', source_url: 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808' },
    ],
    facts: {
      'identity.variant': f('Bye Bye Bloat, 60 capsules', 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'pricing.price': f('$24.49 for 60 capsules', 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'pricing.size_count': f('60 capsules = 30 servings of 2', 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'pricing.availability': f('Target, Love Wellness website and other retailers', 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'composition.ingredients': f('Bye Bye Bloat blend 700 mg per 2 capsules: organic fenugreek seed, organic dandelion root, organic fennel seed, organic ginger root, organic parsley leaf powders; amylase, protease, pepsin, lipase, bromelain and papain. Other: microcrystalline cellulose, hypromellose (capsule), magnesium stearate. Individual amounts not disclosed.', 'Target listing (Supplement Facts)', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'composition.active_ingredients': f(['Herbal + digestive enzyme blend 700 mg (fenugreek, dandelion, fennel, ginger, parsley, amylase, protease, pepsin, lipase, bromelain, papain)'], 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'composition.dosage': f('2 capsules (700 mg blend); brand Q&A suggests 2 at bedtime or as needed after a large meal', 'Target listing + brand Q&A', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'composition.allergens': f('Labeled dairy free, gluten free, non-GMO. Contains animal-derived pepsin (not vegan, per brand Q&A). Fenugreek is a legume.', 'Target listing + brand Q&A', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'safety.warnings': f('Consult a healthcare provider before use, especially if pregnant, nursing or taking medication. Adults 18+. Keep out of reach of children. California Prop 65 warning.', 'Target listing (label warnings)', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'safety.pregnancy': f('Label: consult a healthcare provider before use if pregnant.', 'Target listing (label)', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'safety.breastfeeding': f('Label: consult a healthcare provider if nursing; brand Q&A says check with a doctor or OB-GYN while breastfeeding.', 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'safety.medication_interactions': f('Label: consult a healthcare provider if taking medication. No specific interactions named.', 'Target listing (label)', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'safety.age_restriction': f('Adults 18 and over', 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Target listing', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'health.intended_use': f('Manufacturer: bloating relief and digestive support', 'Target listing (manufacturer claims)', 'https://target.com/p/love-wellness-bye-bye-bloat-for-fast-bloating-relief-60ct/-/A-80209808', 'retailer'),
      'evidence.sources': f([
        { title: 'Citruslabs single-arm study of Bye Bye Bloat', url: 'https://citruslabs.com/testedproducts/love-wellness-bye-bye-bloat', evidence_type: 'product_study', supports: 'Self-reported comfort and bloating perceptions; no control group, sample size not stated' },
      ], 'Citruslabs', 'https://citruslabs.com/testedproducts/love-wellness-bye-bye-bloat', 'research'),
      'evidence.claims': f([
        { claim: 'Relieves bloating after meals', strength: 'limited', evidence_type: 'product_study', source_url: 'https://citruslabs.com/testedproducts/love-wellness-bye-bye-bloat', product_specific: true },
      ], 'Citruslabs', 'https://citruslabs.com/testedproducts/love-wellness-bye-bye-bloat', 'research'),
    },
  },
  'p-pelvic-wand': {
    ...head('in_review', 'none_found', 'Checked Intimate Rose product page and FDA 510(k) database: K250419 (Intimate Rose Pelvic Wand, product code OSD, internal pelvic floor trigger-point massager) cleared as substantially equivalent, decision 07/27/2026. Catalog price $30-50 consistent with $34.99 (original wand). Brand page does not state latex/phthalate status (left unknown) and lists no pregnancy/infection contraindications for the wand. No recall found.'),
    facts: {
      'identity.purchase_url': f('https://www.intimaterose.com/products/pelvic-wand', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'identity.variant': f('Original Pelvic Wand (purple, dual-ended); vibrating, bendable and temperature versions are separate products', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'pricing.price': f('$34.99', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'pricing.size_count': f('1 wand', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'pricing.fsa_hsa': f('Listed by the brand as HSA/FSA eligible', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'pricing.availability': f('Intimate Rose website, Walmart, Amazon', 'Brand page + Walmart brand listing', 'https://www.walmart.com/brand/intimaterose/10009892', 'retailer'),
      'composition.ingredients': f('Medical-grade silicone, BPA-free (brand); latex and phthalate status not stated', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'composition.allergens': f('Silicone; brand does not state latex status (unknown)', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'composition.fragrance': f('Not applicable (unscented silicone device)', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'safety.warnings': f('If symptoms do not lessen within four weeks or get worse, stop and consult a physician or pelvic floor specialist. Clean with soap and water; use water-based lubricant.', 'Intimate Rose product page', 'https://www.intimaterose.com/products/pelvic-wand'),
      'safety.regulatory_status': f('FDA 510(k) K250419: substantially equivalent, product code OSD (therapeutic massager for internal pelvic floor trigger points), decision 07/27/2026', 'FDA 510(k) database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K250419', 'regulatory'),
      'safety.recalls': f('No recall found (FDA 510(k) record and recall search, Oct 2026).', 'FDA 510(k) database + web search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K250419', 'regulatory'),
      'health.intended_use': f('Internal massage of pelvic floor trigger points to ease tension and minor aches (designed by a physical therapist)', 'Intimate Rose product page + FDA classification', 'https://www.intimaterose.com/products/pelvic-wand'),
      'evidence.sources': f([
        { title: 'FDA 510(k) K250419: Intimate Rose Pelvic Wand', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K250419', evidence_type: 'regulatory', supports: 'Cleared device type for internal pelvic floor trigger-point massage' },
      ], 'FDA', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K250419', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Internal trigger-point massage can ease pelvic floor muscle tension (as part of pelvic floor therapy)', strength: 'limited', evidence_type: 'regulatory', source_url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K250419', product_specific: true },
      ], 'FDA', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K250419', 'regulatory'),
    },
  },

  'p-intimate-rose': {
    ...head('needs_clinician_review', 'none_found', 'Checked Intimate Rose product page and FDA 510(k) K241748 (Intimate Rose Vaginal Dilators, Class II, product code HDX, cleared 08/14/2024). Catalog classifies this as "ingestible"; it is an internal vaginal device, so ingestible-only fields do not apply and the route should be corrected. Price $159.99 sale / $179.99 regular matches catalog $160. Contraindications include pregnancy and active pelvic infection: clinician review. No recall found.'),
    corrections: [
      { field: 'risk.route', catalog: 'ingestible', source_says: 'Internal vaginal device (FDA Class II vaginal dilator)', source_url: 'https://fda.innolitics.com/device/K241748' },
    ],
    facts: {
      'identity.purchase_url': f('https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'identity.variant': f('Full Vaginal Dilator Set, 8 sizes', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'pricing.price': f('$159.99 sale (regular $179.99)', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'pricing.size_count': f('8 dilators, 2.8-6.5 in long, 0.45-1.5 in wide', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'pricing.fsa_hsa': f('Listed by the brand as FSA/HSA eligible', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'pricing.availability': f('Intimate Rose website; sizes also sold individually', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'composition.ingredients': f('BPA-free, medical-grade silicone with non-stick finish; latex and phthalate status not stated', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'composition.active_ingredients': na('Not applicable: silicone device with no active ingredient', 'https://fda.innolitics.com/device/K241748'),
      'composition.dosage': na('Not applicable: device, not ingested', 'https://fda.innolitics.com/device/K241748'),
      'safety.medication_interactions': na('Not applicable: device, not ingested', 'https://fda.innolitics.com/device/K241748'),
      'composition.allergens': f('Silicone; latex status not stated by brand (unknown)', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'composition.fragrance': f('Not applicable (unscented silicone device)', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'safety.warnings': f('Do not use if pregnant; with active pelvic infection, undiagnosed bleeding, or open wounds in or around the vagina; or while on pelvic rest (after vaginal surgery, LEEP, cone procedure, or childbirth).', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'safety.regulatory_status': f('FDA 510(k) K241748, Class II vaginal dilator (product code HDX), substantially equivalent 08/14/2024', 'FDA 510(k) summary', 'https://www.accessdata.fda.gov/cdrh_docs/pdf24/K241748.pdf', 'regulatory'),
      'safety.recalls': f('No recall found (FDA 510(k) record and recall search, Oct 2026).', 'FDA 510(k) + web search', 'https://fda.innolitics.com/device/K241748', 'regulatory'),
      'safety.pregnancy': f('Brand: do not use if pregnant; not while on pelvic rest after childbirth.', 'Intimate Rose product page', 'https://intimaterose.com/products/silicone-vaginal-dilator-set-8-pack'),
      'health.intended_use': f('Controlled vaginal dilation: vaginismus and painful intercourse, exams, and preparation for surgery (FDA indications)', 'FDA 510(k) K241748', 'https://fda.innolitics.com/device/K241748', 'regulatory'),
      'evidence.sources': f([
        { title: 'FDA 510(k) K241748: Intimate Rose Vaginal Dilators', url: 'https://www.accessdata.fda.gov/cdrh_docs/pdf24/K241748.pdf', evidence_type: 'regulatory', supports: 'Cleared indications: controlled vaginal dilation for vaginismus/dyspareunia, exams, surgical preparation' },
      ], 'FDA', 'https://www.accessdata.fda.gov/cdrh_docs/pdf24/K241748.pdf', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Graduated dilators help with vaginismus and painful penetration', strength: 'moderate', evidence_type: 'regulatory', source_url: 'https://fda.innolitics.com/device/K241748', product_specific: true },
      ], 'FDA', 'https://fda.innolitics.com/device/K241748', 'regulatory'),
    },
  },
  'p-estroven-mood': {
    ...head('needs_correction', 'none_found', 'Catalog ingredients (soy isoflavones, rhodiola, folate) are wrong. Current Estroven mood formula (Swanson label data, sold as "Mood Boost" / "Menopause Relief + Mood"; the "Stress Plus Mood & Memory" listing points to the same 30-caplet product) contains black cohosh 40 mg, soy isoflavones 56 mg, ginkgo 120 mg, magnolia bark 15 mg and calcium 95 mg. Label: do not take if pregnant, breastfeeding or intending to become pregnant. Ginkgo carries bleeding/anticoagulant interactions (Mayo Clinic) and black cohosh has liver-injury case reports (NIH ODS): clinician review needed too. Price ~$16.49-19.99 vs catalog $18. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Soy isoflavones, rhodiola rosea, folate.', source_says: 'Per caplet: calcium 95 mg, black cohosh root extract 40 mg, soy isoflavones 56 mg, ginkgo biloba leaf extract 120 mg, magnolia bark extract 15 mg', source_url: 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts' },
      { field: 'identity.name', catalog: 'Estroven Mood & Memory', source_says: 'Sold as Estroven Mood Boost / Menopause Relief + Mood (30 caplets)', source_url: 'https://lborderacme.rmrdevelopment.com/product/00092961013335/estroven-menopause-relief-stress-plus-mood-me' },
    ],
    facts: {
      'identity.variant': f('Menopause Relief + Mood (Mood Boost), 30 caplets', 'Swanson listing', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'pricing.price': f('$19.99 for 30 caplets (Swanson); $16.49 on sale at Acme', 'Swanson + Acme listings', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'pricing.size_count': f('30 caplets (30 servings)', 'Swanson listing', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'pricing.availability': f('Swanson, Vitacost, grocery and drug stores', 'Retailer listings', 'https://www.vitacost.com/products/estroven-menopause-relief-mood-boost-30-caplets-63596', 'retailer'),
      'composition.ingredients': f('Per caplet: calcium (dicalcium phosphate) 95 mg, black cohosh root extract 40 mg, soy isoflavones 56 mg, ginkgo biloba leaf extract 120 mg, magnolia bark extract 15 mg. Other: microcrystalline cellulose, stearic acid, coating (HPMC, MCT from safflower oil, inulin, vegetable juice color, titanium dioxide), croscarmellose sodium, magnesium stearate', 'Swanson listing (Supplement Facts)', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'composition.active_ingredients': f(['Black cohosh root extract 40 mg', 'Soy isoflavones 56 mg', 'Ginkgo biloba leaf extract 120 mg', 'Magnolia bark extract 15 mg'], 'Swanson listing', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'composition.dosage': f('1 caplet daily; brand says use at least 60 days', 'Swanson listing (directions)', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'composition.allergens': f('Contains soy. Retailer page says free of yeast, wheat, gluten, lactose and preservatives.', 'Swanson + Acme listings', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'safety.warnings': f('Do not take if pregnant, breastfeeding, or intending to become pregnant. Tell your healthcare professional before taking.', 'Swanson listing (label warnings)', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'safety.side_effects': f('Black cohosh: mild GI upset and rash in trials; rare liver injury reports (USP advises stopping if abdominal pain, dark urine or jaundice). Ginkgo: headache, dizziness, upset stomach, bleeding risk.', 'NIH ODS Black Cohosh + Mayo Clinic Ginkgo', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
      'safety.medication_interactions': f('Ginkgo: higher bleeding risk with anticoagulants, antiplatelets and ibuprofen; may affect anticonvulsants, alprazolam, some antidepressants, statins and diabetes medicines. Black cohosh: no clinically relevant interactions known (not systematically studied).', 'Mayo Clinic Ginkgo + NIH ODS Black Cohosh', 'https://www.mayoclinic.org/drugs-supplements/ginkgo/art-20362032', 'clinical_guidance'),
      'safety.pregnancy': f('Label: do not take if pregnant or intending to become pregnant.', 'Swanson listing (label)', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'safety.breastfeeding': f('Label: do not take if breastfeeding.', 'Swanson listing (label)', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement; brand says drug- and estrogen-free (contains plant isoflavones)', 'Swanson listing', 'https://www.swansonvitamins.com/p/i-health-inc-estroven-plus-mood-memory-30-cplts', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.vitacost.com/products/estroven-menopause-relief-mood-boost-30-caplets-63596', 'retailer'),
      'health.intended_use': f('Manufacturer: menopause hot flashes/night sweats (black cohosh), irritability and mood (magnolia), mental sharpness and memory (ginkgo)', 'Acme listing (manufacturer claims)', 'https://lborderacme.rmrdevelopment.com/product/00092961013335/estroven-menopause-relief-stress-plus-mood-me', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Black Cohosh fact sheet', url: 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', evidence_type: 'regulatory', supports: 'Trials and reviews find insufficient or no benefit for hot flashes; ACOG and NAMS advise against relying on it; liver injury reports' },
        { title: 'Mayo Clinic: Ginkgo', url: 'https://www.mayoclinic.org/drugs-supplements/ginkgo/art-20362032', evidence_type: 'expert_guidance', supports: 'Ginkgo safety, pregnancy caution and drug interactions' },
      ], 'NIH ODS + Mayo Clinic', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Black cohosh reduces menopausal hot flashes', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', product_specific: false },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
    },
  },

  'p-remifemin': {
    ...head('needs_clinician_review', 'none_found', 'Checked Smallflower listing (US Remifemin Menopause Relief 60 count, Medice/Schaper & Brümmer RemiSure extract) and NIH ODS black cohosh. Catalog "$17 for 60" matches regular price. Contains lactose (milk). NIH ODS: well-designed trials and Cochrane find insufficient evidence for hot flashes; ACOG/NAMS advise against relying on it; liver injury case reports (USP caution). Menopausal/hormonal-symptom botanical: clinician review. No recall found.'),
    facts: {
      'identity.variant': f('Remifemin Menopause Relief, 60 tablets (RemiSure black cohosh extract)', 'Smallflower listing', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'pricing.price': f('$17 regular for 60 tablets (seen on sale $14.45, sold out at this retailer)', 'Smallflower listing', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'pricing.size_count': f('60 tablets (30 days at 2 daily)', 'Smallflower listing', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'composition.ingredients': f('Per tablet: RemiSure black cohosh dry extract 2.5 mg (equivalent to 21 mg black cohosh root/rhizome). Other: lactose monohydrate, cellulose, potato starch, magnesium stearate', 'Smallflower listing (label)', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'composition.active_ingredients': f(['Black cohosh extract (RemiSure) 2.5 mg, equivalent to 21 mg root'], 'Smallflower listing', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'composition.dosage': f('1 tablet twice daily', 'Smallflower listing (directions)', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'composition.allergens': f('Contains milk (lactose). Listed free of gluten, soy, GMOs, hormones, preservatives, artificial colors/flavors.', 'Smallflower listing', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'safety.warnings': f('USP-recommended caution for black cohosh: people with liver disorders should avoid it; stop and see a doctor if abdominal pain, dark urine or jaundice develop. (Retailer page did not reproduce the package warnings.)', 'NIH ODS Black Cohosh fact sheet', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
      'safety.side_effects': f('Mild, transient GI upset and rash reported in trials; rare liver injury reports with no proven causal link.', 'NIH ODS Black Cohosh fact sheet', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
      'safety.medication_interactions': f('No clinically relevant interactions known for black cohosh, though not systematically studied.', 'NIH ODS Black Cohosh fact sheet', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
      'safety.pregnancy': f('American Herbal Products Association (cited by NIH ODS): do not take black cohosh in pregnancy unless supervised by a provider. No product label statement found.', 'NIH ODS Black Cohosh fact sheet', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
      'safety.regulatory_status': f('Dietary supplement in the US (FDA disclaimer on listing)', 'Smallflower listing', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'health.intended_use': f('Menopause symptom relief (hot flashes, night sweats), manufacturer claim', 'Smallflower listing', 'https://www.smallflower.com/products/remifemin-menopause-relief-60-count', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Black Cohosh fact sheet', url: 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', evidence_type: 'regulatory', supports: 'Remifemin extract used in several Cochrane-reviewed trials; overall insufficient evidence for vasomotor symptoms; liver safety caution' },
        { title: 'Western Sydney University NICM: do meds like Remifemin ease hot flushes?', url: 'https://www.westernsydney.edu.au/nicmhri/news/science-or-snake-oil-do-meds-like-remifemin-ease-hot-flushes-and-night-sweats-in-menopausal-women', evidence_type: 'expert_guidance', supports: 'Expert commentary on the evidence for Remifemin' },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Reduces menopausal hot flashes and night sweats', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', product_specific: false },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional', 'regulatory'),
    },
  },
  'p-creatine-womens': {
    ...head('needs_correction', 'none_found', 'Checked Vitacost listing (label text) and ISSN 2017 position stand. Variant: Thorne Creatine unflavored 450 g (90 x 5 g servings), NSF Certified for Sport, single ingredient creatine monohydrate. Catalog "$25-40 for 300-500g" is below current price ($44 for 450 g at Vitacost). Product is not women-specific despite the id. No kidney warning on the label page; interactions not found in an authoritative source (left unknown). Recall search found only a 2014 FDA warning on unrelated Thorne Captomer products.'),
    corrections: [
      { field: 'pricing.price', catalog: '$25-40 for 300-500g', source_says: '$44.00 for 450 g unflavored (Vitacost); flavored 372-384 g $49.44', source_url: 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006' },
    ],
    facts: {
      'identity.variant': f('Creatine, unflavored powder, 16 oz (450 g); also 900 g, 30-count and flavored versions', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'pricing.price': f('$44.00 for 450 g (90 servings)', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'pricing.size_count': f('450 g, 90 servings of 5 g', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'pricing.availability': f('Thorne, Vitacost, Fullscript, iHerb', 'Retailer listings', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'composition.ingredients': f('Creatine monohydrate 5 g per scoop (only ingredient listed)', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'composition.active_ingredients': f(['Creatine monohydrate 5 g'], 'Vitacost listing', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'composition.dosage': f('1 scoop (5 g) daily in at least 8 oz of liquid', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'composition.allergens': f('Single ingredient (creatine monohydrate); NSF Certified for Sport. No allergen statement found.', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'safety.warnings': f('If pregnant, consult your health-care practitioner before using this product.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'safety.side_effects': f('ISSN position stand: creatine monohydrate is well tolerated in healthy people in short- and long-term studies; the most consistent effect is weight gain from water and lean mass.', 'ISSN position stand 2017 (PMC)', 'https://pmc.ncbi.nlm.nih.gov/articles/5469049/', 'research'),
      'safety.pregnancy': f('Label: if pregnant, consult your health-care practitioner before use.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement; NSF Certified for Sport', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'safety.recalls': f('No recall found for Thorne Creatine. FDA issued a 2014 warning on Thorne Captomer products (different products).', 'FDA', 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-warns-consumers-about-potential-health-risks-using-thorne-researchs-captomer-products', 'regulatory'),
      'health.intended_use': f('Creatine supplement for exercise performance and muscle', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-creatine-16-oz-450-g-70006', 'retailer'),
      'evidence.sources': f([
        { title: 'ISSN position stand: safety and efficacy of creatine supplementation (2017)', url: 'https://pmc.ncbi.nlm.nih.gov/articles/5469049/', evidence_type: 'expert_guidance', supports: 'Creatine monohydrate improves high-intensity exercise capacity and lean mass with training; safe in healthy people at recommended doses' },
      ], 'PubMed Central', 'https://pmc.ncbi.nlm.nih.gov/articles/5469049/', 'research'),
      'evidence.claims': f([
        { claim: 'Improves high-intensity exercise performance and lean mass when combined with training', strength: 'strong', evidence_type: 'ingredient_research', source_url: 'https://pmc.ncbi.nlm.nih.gov/articles/5469049/', product_specific: false },
      ], 'PubMed Central', 'https://pmc.ncbi.nlm.nih.gov/articles/5469049/', 'research'),
    },
  },
  'd-happi-pelvic': {
    ...head('needs_correction', 'unknown', 'Could not find an app called "Happi" for pelvic floor in App Store searches. The closest match is "Happy Floor: Pelvic Exercises" (developer Daniel Morgan / Func Main Ltd; free with subscription, in-app purchases $3.99-$56.99; privacy policy happyfloorapp.com/privacy; Apple privacy label says purchases and identifiers are used to track users across other companies\' apps, and health data is linked to identity). Not confirmed to be the same product, so no facts recorded. Founder should confirm the intended app or remove it; catalog image is empty.'),
    corrections: [
      { field: 'identity.name', catalog: 'Happi Pelvic Floor App', source_says: 'No app by this name found; closest match is "Happy Floor: Pelvic Exercises" (unconfirmed)', source_url: 'https://apps.apple.com/us/app/id1552262109' },
    ],
    facts: {},
  },

  'd-hers': {
    ...head('needs_correction', 'none_found', 'Checked Hims & Hers privacy policy (updated Sept 17, 2026) and FDA warning letters. Catalog privacy says "HIPAA-compliant for Rx" and "Check policy" for data sale: the policy says Hims & Hers is NOT a HIPAA covered entity (medical groups have their own notice; HIPAA may not apply to dealings with Hims & Hers) and that it "may sell your sensitive personal data" and shares data with ad partners (Google, Facebook, X). FDA warning letter (Sept 9, 2025) to Hims & Hers dba Hers for misleading compounded semaglutide claims on forhers.com. Price not re-verified (varies by treatment). Prescription telehealth: clinician review of offerings advised.'),
    corrections: [
      { field: 'safety.privacy', catalog: 'hipaa: HIPAA-compliant for Rx; sellsData: Check policy', source_says: 'Hims & Hers is not a HIPAA covered entity; policy says it may sell sensitive personal data and shares data with advertising partners (opt-out available)', source_url: 'https://www.hims.com/privacy-policy' },
    ],
    facts: {
      'identity.purchase_url': f('https://www.forhers.com', 'Hims & Hers privacy policy (covers forhers.com)', 'https://www.hims.com/privacy-policy'),
      'safety.privacy': f('Privacy policy (updated Sept 17, 2026) covers forhers.com and apps. Hims & Hers says it is not a HIPAA covered entity; affiliated medical groups/pharmacies have their own HIPAA notices, and HIPAA may not apply to communications with Hims & Hers itself. States it may sell sensitive personal data and share data with advertising/analytics partners (Google, Facebook, X); uses cookies, pixels and ad IDs; opt-out via Privacy Center, "Your Privacy Choices" or Global Privacy Control; does not honor Do Not Track.', 'Hims & Hers privacy policy', 'https://www.hims.com/privacy-policy'),
      'safety.warnings': f('FDA warning letter (Sept 9, 2025) to Hims & Hers dba Hers: claims for compounded semaglutide (e.g. "same active ingredient as Ozempic and Wegovy", "clinically proven ingredients") were false or misleading; compounded drugs are not FDA-approved.', 'FDA warning letter', 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/hims-hers-health-inc-dba-hers-716825-09092025', 'regulatory'),
      'safety.recalls': f('No product recall found; FDA warning letter on advertising claims (Sept 2025) recorded under warnings.', 'FDA warning letters', 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/hims-hers-health-inc-dba-hers-716825-09092025', 'regulatory'),
      'evidence.sources': f([
        { title: 'FDA warning letter to Hims & Hers Health dba Hers (Sept 9, 2025)', url: 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/hims-hers-health-inc-dba-hers-716825-09092025', evidence_type: 'regulatory', supports: 'Compounded semaglutide marketed by Hers is not FDA-approved; marketing claims misleading' },
        { title: 'Hims & Hers privacy policy', url: 'https://www.hims.com/privacy-policy', evidence_type: 'manufacturer', supports: 'HIPAA status and data sharing/sale practices' },
      ], 'FDA + company policy', 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/hims-hers-health-inc-dba-hers-716825-09092025', 'regulatory'),
    },
  },

  'd-pomelo-care': {
    ...head('in_review', 'none_found', 'Checked Pomelo Care privacy policy (updated July 20, 2026) and Notice of Privacy Practices link. Pomelo says the website privacy policy does not cover HIPAA PHI; it acts as a business associate and affiliated practices\' HIPAA Notice of Privacy Practices applies. Website data is shared with ad partners (cookies, pixels, session replay). Catalog "HIPAA-aligned" is roughly right but should say PHI is covered under the practices\' HIPAA notice while website/marketing data is not. Not a physical product; no recall applicable.'),
    facts: {
      'safety.privacy': f('Clinical PHI is handled under HIPAA: Pomelo acts as a business associate and the affiliated medical practices\' Notice of Privacy Practices applies. The website privacy policy (updated July 20, 2026) covers non-PHI data: cookies, pixels, session replay, sharing with advertising partners for targeted ads; California residents can opt out; Do Not Track not honored; text-message data not shared for third-party marketing.', 'Pomelo Care privacy policy + NPP', 'https://www.pomelocare.com/privacy-policy'),
      'safety.recalls': f('Not applicable to a care service; no FDA action found.', 'Pomelo Care privacy policy', 'https://www.pomelocare.com/privacy-policy'),
      'health.intended_use': f('Virtual care for fertility, maternity, pediatric and midlife health from licensed clinicians in Pomelo, P.C. or affiliated practices; partners with health plans and employers', 'Pomelo Care privacy policy', 'https://www.pomelocare.com/privacy-policy'),
    },
  },
  'p-probiotics-women': {
    ...head('needs_correction', 'none_found', 'Catalog has no brand field. Checked Vitacost listing (label) and NIH ODS probiotics fact sheet. Variant: Garden of Life Dr. Formulated Probiotics Once Daily Women\'s, 50 billion CFU, 30 vegetarian capsules, shelf stable. Catalog claims L. rhamnosus GR-1 and L. reuteri RC-14: the label lists L. rhamnosus and L. reuteri with no strain designations, so GR-1/RC-14 are not confirmed and should be removed. Catalog $25 vs Vitacost $31.40. Only Garden of Life recall found was a 2017 infant liquid (different product).'),
    corrections: [
      { field: 'composition.ingredients', catalog: '50B CFU, 16 probiotic strains including L. rhamnosus GR-1 and L. reuteri RC-14.', source_says: '50 billion CFU, 16 species; L. rhamnosus and L. reuteri listed without GR-1/RC-14 strain IDs; plus 317 mg prebiotic fiber (potato resistant starch, gum acacia)', source_url: 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442' },
      { field: 'pricing.price', catalog: '$25 for 30 capsules', source_says: '$31.40 for 30 capsules (Vitacost)', source_url: 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442' },
    ],
    facts: {
      'identity.brand': f('Garden of Life', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'identity.variant': f('Dr. Formulated Probiotics Once Daily Women\'s, 50 billion CFU, 30 vegetarian capsules (shelf stable)', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'pricing.price': f('$31.40 for 30 capsules', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'pricing.size_count': f('30 capsules (30 servings)', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'pricing.availability': f('Vitacost, Swanson, H-E-B and other retailers', 'Retailer listings', 'https://www.heb.com/product-detail/garden-of-life-dr-formulated-probiotics-once-daily-women-s-capsules/1902607', 'retailer'),
      'composition.ingredients': f('Women\'s Daily Probiotic Blend 248 mg (50 billion CFU at expiration: 40B Lactobacillus-group, 10B Bifidobacterium; 16 species incl. L. acidophilus, L. plantarum, L. casei, L. paracasei, L. bulgaricus, L. brevis, L. reuteri, L. salivarius, L. fermentum, L. gasseri, L. rhamnosus, B. lactis, B. bifidum, B. breve, B. infantis, B. longum); organic prebiotic fiber blend 317 mg (potato resistant starch, gum acacia). Capsule: vegetable cellulose', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'composition.active_ingredients': f(['Probiotic blend, 50 billion CFU, 16 species', 'Prebiotic fiber 317 mg'], 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'composition.dosage': f('Adults: 1 capsule daily with or without food', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'composition.allergens': f('Labeled gluten free, vegetarian, Non-GMO Project Verified. No dairy/soy statement found.', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'safety.warnings': f('Consult a healthcare practitioner before use if pregnant, lactating, taking medication or with any health condition. Stop and seek advice if adverse reactions occur. Not intended for children.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'safety.side_effects': f('Usually minor, self-limited GI symptoms such as gas; rare serious infections reported mainly in severely ill or immunocompromised people.', 'NIH ODS Probiotics fact sheet', 'https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional', 'regulatory'),
      'safety.medication_interactions': f('Label: consult a practitioner if taking medication. NIH ODS does not list specific drug interactions; immunocompromised people are a higher-risk group.', 'NIH ODS Probiotics fact sheet + label', 'https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional', 'regulatory'),
      'safety.pregnancy': f('Label: consult a healthcare practitioner before use if pregnant.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'safety.breastfeeding': f('Label: consult a healthcare practitioner before use if lactating.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'safety.age_restriction': f('Adults; not intended for children', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-dr-formulated-probiotics-once-daily-women-s-50-billion-30-vegetarian-capsules-64442', 'retailer'),
      'safety.recalls': f('No recall found for this product. A 2017 Garden of Life recall covered Baby Organic Liquid (different product, choking risk from directions).', 'FDA recall notice', 'https://www.fda.gov/Safety/Recalls/ucm575135.htm', 'regulatory'),
      'health.intended_use': f('Manufacturer: digestive, immune and vaginal/urinary support for women', 'Swanson listing (manufacturer claims)', 'https://www.swansonvitamins.com/products/garden-of-life-dr-formulated-probiotics-once-daily-womens-30-veg-caps', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Probiotics fact sheet for health professionals', url: 'https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional', evidence_type: 'regulatory', supports: 'Safety profile; evidence is strain- and condition-specific; fact sheet does not cover vaginal or urinary uses' },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Supports vaginal and urinary health', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://www.swansonvitamins.com/products/garden-of-life-dr-formulated-probiotics-once-daily-womens-30-veg-caps', product_specific: true },
      ], 'Swanson listing', 'https://www.swansonvitamins.com/products/garden-of-life-dr-formulated-probiotics-once-daily-womens-30-veg-caps', 'retailer'),
    },
  },

  'p-evening-primrose': {
    ...head('needs_correction', 'none_found', 'Catalog variant (1000 mg, GLA 100 mg, gelatin softgel, 100 count, $12) does not match any current NOW listing. NOW currently sells Evening Primrose Oil 1000 mg as a vegan veggie softgel, 90 count, $29.99, GLA 90 mg; the 500 mg version comes in 100 count ($13.99). Facts below are for the 1000 mg vegan product; founder should pick the intended variant. NCCIH: insufficient evidence for PMS/menopause; probably no better than placebo for breast pain. No EPO recall in NOW FDA enforcement records.'),
    corrections: [
      { field: 'identity.variant', catalog: '1000 mg, 100 gelatin softgels, GLA 100 mg, $12', source_says: '1000 mg vegan veggie softgels, 90 count, GLA 90 mg, $29.99 (500 mg version: 100 softgels $13.99)', source_url: 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542' },
    ],
    facts: {
      'identity.brand': f('NOW Foods', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'identity.variant': f('Evening Primrose Oil 1000 mg, vegan formula, 90 veggie softgels (SKU 1758)', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'pricing.price': f('$29.99 for 90 veggie softgels (brand list price)', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'pricing.size_count': f('90 softgels (90 servings)', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'pricing.availability': f('NOW Foods website, Vitacost and other retailers', 'Vitacost listing', 'https://www.vitacost.com/products/now-foods-evening-primrose-oil-1-000-mg-90-veggie-softgels-79940', 'retailer'),
      'composition.ingredients': f('Organic evening primrose oil (seed, cold pressed, hexane free) 1,000 mg providing GLA 90 mg. Softgel: glycerin, modified starch, carrageenan, water', 'NOW Foods product page (Supplement Facts)', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'composition.active_ingredients': f(['Evening primrose oil 1,000 mg', 'Gamma-linolenic acid (GLA) 90 mg'], 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'composition.dosage': f('1 softgel daily with a meal', 'NOW Foods product page (suggested use)', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'composition.allergens': f('Not manufactured with yeast, wheat, gluten, soy, milk, egg, fish or shellfish ingredients; made in a facility that processes these. Vegan softgel contains carrageenan.', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'safety.warnings': f('For adults only. Consult a physician if pregnant/nursing, taking medication, or with a medical condition. Keep out of reach of children.', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'safety.side_effects': f('Generally well tolerated; most common are stomach-related (abdominal pain, nausea, diarrhea).', 'NIH NCCIH Evening Primrose Oil', 'https://nccih.nih.gov/health/eveningprimrose', 'regulatory'),
      'safety.medication_interactions': f('NCCIH names no specific drugs but advises talking to a provider before use if taking any medicine; label: consult a physician if taking medication.', 'NIH NCCIH + label', 'https://nccih.nih.gov/health/eveningprimrose', 'regulatory'),
      'safety.pregnancy': f('Label: consult a physician if pregnant. NCCIH: may be safe in pregnancy but evidence is not conclusive.', 'NOW label + NIH NCCIH', 'https://nccih.nih.gov/health/eveningprimrose', 'regulatory'),
      'safety.breastfeeding': f('Label: consult a physician if nursing. NCCIH: raises GLA in breast milk, not linked to infant harm.', 'NOW label + NIH NCCIH', 'https://nccih.nih.gov/health/eveningprimrose', 'regulatory'),
      'safety.age_restriction': f('For adults only', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'safety.regulatory_status': f('Dietary supplement', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'safety.recalls': f('No evening primrose oil recall in the FDA enforcement records listed for NOW Foods.', 'recallcheck.net (FDA enforcement data)', 'https://recallcheck.net/brand/now-foods', 'regulatory'),
      'health.intended_use': f('GLA source; manufacturer markets for skin and women\'s health', 'NOW Foods product page', 'https://www.nowfoods.com/products/supplements/evening-primrose-oil-1000-mg-vegan-formula-veggie-softgels?SKU=1542'),
      'evidence.sources': f([
        { title: 'NIH NCCIH: Evening Primrose Oil', url: 'https://nccih.nih.gov/health/eveningprimrose', evidence_type: 'regulatory', supports: 'Insufficient evidence for PMS and menopause; probably no better than placebo for breast pain; not shown to help eczema' },
      ], 'NIH NCCIH', 'https://nccih.nih.gov/health/eveningprimrose', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Relieves PMS symptoms', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://nccih.nih.gov/health/eveningprimrose', product_specific: false },
        { claim: 'Relieves cyclical breast pain', strength: 'none', evidence_type: 'ingredient_research', source_url: 'https://nccih.nih.gov/health/eveningprimrose', product_specific: false },
      ], 'NIH NCCIH', 'https://nccih.nih.gov/health/eveningprimrose', 'regulatory'),
    },
  },
  'p-vitex': {
    ...head('needs_clinician_review', 'none_found', 'Checked Vitacost listing (label) and NIH NCCIH chasteberry page. Variant: Gaia Herbs Vitex Berry 60 liquid phyto-caps (30 servings of 2; 1,000 mg extract per serving). Catalog $18 vs $19.79. Label: not for use in pregnancy or lactation; NCCIH: avoid with hormone-sensitive cancers. Hormone-acting botanical: clinician review. Recall search found only a kratom recall by an unrelated company (Gaia Ethnobotanical).'),
    facts: {
      'identity.brand': f('Gaia Herbs', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'identity.variant': f('Vitex Berry, 60 vegan liquid phyto-caps (also 120 and 180)', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'pricing.price': f('$19.79 for 60 capsules', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'pricing.size_count': f('60 capsules = 30 servings of 2', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'pricing.availability': f('Vitacost, Instacart retailers, Grove', 'Retailer listings', 'https://www.instacart.com/products/141469-gaia-herbs-vitex-berry-vegetarian-liquid-phyto-caps-60-ea', 'retailer'),
      'composition.ingredients': f('Per 2 capsules: organic chaste tree (Vitex agnus-castus) berry extract 1,000 mg (agnuside 3 mg). Other: vegetable glycerin, water, vegan capsule (hypromellose)', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'composition.active_ingredients': f(['Vitex agnus-castus berry extract 1,000 mg (3 mg agnuside)'], 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'composition.dosage': f('Adults: 2 capsules daily in the morning; brand says best results after 2 months', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'composition.allergens': f('Vegan capsule; no allergen statement found.', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'safety.warnings': f('Not for use during pregnancy or lactation. Consult a healthcare practitioner if you have a medical condition or take medications.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'safety.side_effects': f('Usually mild: nausea, stomach pain, diarrhea, headache, itching. Avoid with hormone-sensitive conditions (breast, uterine, ovarian cancer).', 'NIH NCCIH Chasteberry', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'safety.medication_interactions': f('NCCIH names no specific interactions but advises checking with a provider; label: consult a practitioner if taking medications.', 'NIH NCCIH + label', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'safety.pregnancy': f('Label: not for use during pregnancy. NCCIH: may be unsafe in pregnancy.', 'Vitacost listing + NIH NCCIH', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'safety.breastfeeding': f('Label: not for use during lactation. NCCIH: may be unsafe while breastfeeding.', 'Vitacost listing + NIH NCCIH', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'safety.age_restriction': f('Directions are for adults', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'safety.recalls': f('No recall found for Gaia Herbs Vitex (recall search, Oct 2026).', 'Web recall search', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'health.intended_use': f('Manufacturer: menstrual cycle and hormonal balance support', 'Vitacost listing', 'https://www.vitacost.com/products/gaia-herbs-women-vitex-berry-60-liquid-phyto-caps-500-mg-per-capsules-23833', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH NCCIH: Chasteberry', url: 'https://www.nccih.nih.gov/health/chasteberry', evidence_type: 'regulatory', supports: 'Low-to-moderate quality studies suggest it may ease PMS symptoms such as breast tenderness; evidence for infertility not reliable' },
      ], 'NIH NCCIH', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Eases PMS symptoms including breast tenderness', strength: 'moderate', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/chasteberry', product_specific: false },
        { claim: 'Improves fertility', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/chasteberry', product_specific: false },
      ], 'NIH NCCIH', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
    },
  },

  'p-fish-oil': {
    ...head('needs_correction', 'none_found', 'Checked Vitacost listing (label) and NIH ODS omega-3 fact sheet. Catalog says "Fish oil 830mg EPA/DHA, EPO 500mg" and "$23 for 60": the label gives 500 mg total omega-3 (EPA 240 mg, DHA 160 mg) and 800 mg evening primrose oil (GLA 76 mg) per 2 softgels, and the product is 120 softgels for $31.41. Recall search found only a 2025 recall of Nordic Naturals kids multivitamin gummies (different product).'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Fish oil 830mg EPA/DHA, Evening Primrose Oil 500mg.', source_says: 'Per 2 softgels: total omega-3 500 mg (EPA 240 mg, DHA 160 mg), evening primrose oil 800 mg (GLA 76 mg)', source_url: 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298' },
      { field: 'pricing.price', catalog: '$23 for 60 softgels', source_says: '$31.41 for 120 softgels (Vitacost)', source_url: 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298' },
    ],
    facts: {
      'identity.brand': f('Nordic Naturals', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'identity.variant': f('Omega Woman with Evening Primrose Oil, 120 soft gels', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'pricing.price': f('$31.41 for 120 softgels', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'pricing.size_count': f('120 softgels = 60 servings of 2', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'pricing.availability': f('Vitacost and other supplement retailers', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'composition.ingredients': f('Per 2 softgels: total omega-3 500 mg (EPA 240 mg, DHA 160 mg), evening primrose oil 800 mg (GLA 76 mg). Ingredients: purified deep sea fish oil (anchovies, sardines, mackerel, herring), evening primrose oil, softgel (gelatin, glycerin, water, natural flavor), natural flavor, RRR-alpha tocopherol, rosemary extract', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'composition.active_ingredients': f(['EPA 240 mg', 'DHA 160 mg', 'Evening primrose oil 800 mg (GLA 76 mg)'], 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'composition.dosage': f('Adults: 2 softgels daily with food', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'composition.allergens': f('Contains fish (anchovy, sardine, mackerel, herring) and gelatin (source not stated). Labeled free of gluten, milk derivatives and synthetic dyes.', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'safety.warnings': f('Consult a physician before use if pregnant or lactating, with a known medical condition, or taking medications including blood thinners. Keep out of reach of children.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'safety.side_effects': f('Mild: bad taste, fishy breath, heartburn, nausea, stomach upset, diarrhea, headache. High doses can raise bleeding risk.', 'NIH ODS Omega-3 fact sheet', 'https://ods.od.nih.gov/pdf/factsheets/omega3fattyacids-consumer.pdf', 'regulatory'),
      'safety.medication_interactions': f('High-dose omega-3s may increase bleeding risk with warfarin or other anticoagulants; label also names blood thinners.', 'NIH ODS Omega-3 fact sheet + label', 'https://ods.od.nih.gov/pdf/factsheets/omega3fattyacids-consumer.pdf', 'regulatory'),
      'safety.pregnancy': f('Label: consult a physician before use if pregnant. NIH ODS: unclear whether EPA/DHA supplements affect the baby.', 'Label + NIH ODS', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'safety.breastfeeding': f('Label: consult a physician before use if lactating.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'safety.age_restriction': f('Directions are for adults', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'safety.recalls': f('No recall found for Omega Woman. A 2025 recall covered Nordic Naturals Zero Sugar Multivitamin Gummies for kids (different product).', 'ConsumerLab recall notice', 'https://www.consumerlab.com/recalls/14908/nordic-naturals-zero-sugar-multivitamin-gummies-for-kids-recalled/', 'regulatory'),
      'health.intended_use': f('Omega-3 + GLA supplement marketed for women (skin, hormonal and heart health per manufacturer)', 'Vitacost listing', 'https://www.vitacost.com/products/nordic-naturals-omega-woman-with-evening-primrose-oil-120-soft-gels-4298', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Omega-3 fatty acids fact sheet', url: 'https://ods.od.nih.gov/pdf/factsheets/omega3fattyacids-consumer.pdf', evidence_type: 'regulatory', supports: 'Side effects, anticoagulant interaction, pregnancy notes' },
        { title: 'NIH NCCIH: Evening Primrose Oil', url: 'https://nccih.nih.gov/health/eveningprimrose', evidence_type: 'regulatory', supports: 'Insufficient evidence for PMS/menopause; breast pain probably no better than placebo' },
      ], 'NIH ODS + NCCIH', 'https://ods.od.nih.gov/pdf/factsheets/omega3fattyacids-consumer.pdf', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Evening primrose oil eases PMS or breast pain', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://nccih.nih.gov/health/eveningprimrose', product_specific: false },
      ], 'NIH NCCIH', 'https://nccih.nih.gov/health/eveningprimrose', 'regulatory'),
    },
  },
  'p-b-complex': {
    ...head('needs_clinician_review', 'none_found', 'Checked Vitacost listing (label) and NIH ODS vitamin B6. Variant: Thorne B-Complex #12, 60 capsules, $26 (matches catalog). Catalog ingredient list omits niacinamide 80 mg, pantothenic acid 45 mg and choline; B6 is 23.4 mg per capsule, up to 70 mg/day at the max label dose of 3 capsules (NIH UL 100 mg; EFSA 12 mg). High-dose B vitamins with anticonvulsant interactions (B6): clinician review. No Thorne B-complex recall found (only 2014 Captomer warning).'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Thiamine, Riboflavin, B6, Methylfolate, Methylcobalamin B12, Biotin.', source_says: 'Also contains niacinamide 80 mg, pantothenic acid 45 mg and choline 14 mg per capsule (full panel below)', source_url: 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126' },
    ],
    facts: {
      'identity.brand': f('Thorne', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'identity.variant': f('B-Complex #12, 60 capsules', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'pricing.price': f('$26.00 for 60 capsules', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'pricing.size_count': f('60 capsules (60 servings of 1)', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'pricing.availability': f('Thorne, Vitacost and other supplement retailers', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'composition.ingredients': f('Per capsule: thiamin HCl 40 mg; riboflavin 28.6 mg (incl. riboflavin 5\'-phosphate); niacinamide 80 mg; vitamin B6 23.4 mg (pyridoxine HCl + P5P); folate 667 mcg DFE (400 mcg L-5-MTHF glucosamine salt); methylcobalamin 600 mcg; biotin 80 mcg; calcium pantothenate 45 mg; choline citrate 14 mg. Other: hypromellose capsule, microcrystalline cellulose, calcium laurate, silicon dioxide', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'composition.active_ingredients': f(['Thiamin 40 mg', 'Riboflavin 28.6 mg', 'Niacinamide 80 mg', 'Vitamin B6 23.4 mg', 'Folate (L-5-MTHF) 667 mcg DFE', 'Vitamin B12 (methylcobalamin) 600 mcg', 'Biotin 80 mcg', 'Pantothenic acid 45 mg', 'Choline 14 mg'], 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'composition.dosage': f('1 capsule one to three times daily, or as recommended by a practitioner', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'composition.allergens': f('Labeled gluten free; no other allergen statement found.', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'safety.warnings': f('If pregnant, consult your health-care practitioner before use. Use only if bottle is sealed.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'safety.side_effects': f('Long-term high-dose B6 can cause sensory neuropathy (mainly at 1-6 g/day; NIH adult UL 100 mg/day, EFSA 12 mg/day). Riboflavin commonly turns urine bright yellow (not stated on label).', 'NIH ODS Vitamin B6 fact sheet', 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional', 'regulatory'),
      'safety.medication_interactions': f('Vitamin B6 interacts with cycloserine, valproic acid, carbamazepine, phenytoin, phenobarbital, levetiracetam and theophylline.', 'NIH ODS Vitamin B6 fact sheet', 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional', 'regulatory'),
      'safety.pregnancy': f('Label: if pregnant, consult your health-care practitioner before use.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'safety.recalls': f('No recall found for Thorne B-Complex #12. FDA issued a 2014 warning on Thorne Captomer products (different products).', 'FDA', 'https://www.fda.gov/drugs/drug-safety-and-availability/fda-warns-consumers-about-potential-health-risks-using-thorne-researchs-captomer-products', 'regulatory'),
      'health.intended_use': f('B-vitamin complex with active (methylated) folate and B12', 'Vitacost listing', 'https://www.vitacost.com/products/thorne-b-complex-12-60-capsules-18126', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Vitamin B6 fact sheet', url: 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional', evidence_type: 'regulatory', supports: 'Upper limit, neuropathy risk, drug interactions; small weak trials suggest B6 may help PMS' },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Vitamin B6 eases PMS symptoms', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional', product_specific: false },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional', 'regulatory'),
    },
  },
  'p-cranberry-supplement': {
    ...head('needs_clinician_review', 'none_found', 'Checked Vitacost listing (label) and Merck Manual cranberry monograph (cites 2023 Cochrane review). Variant: AZO Cranberry Urinary Health, 50 caplets = 25 servings of 2. Catalog "Pacran 500mg" is per 2-caplet serving; label also has vitamin C 60 mg, calcium 110 mg and Bacillus coagulans 30 mg (probiotic) not in catalog. Price $7.79 vs catalog $8. Cranberry may increase warfarin effect: clinician review. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Pacran cranberry whole fruit powder 500mg.', source_says: 'Per 2 caplets: Pacran whole fruit cranberry 500 mg, vitamin C 60 mg, calcium 110 mg, Bacillus coagulans 30 mg', source_url: 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612' },
    ],
    facts: {
      'identity.brand': f('AZO (i-Health)', 'Vitacost listing', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'identity.variant': f('Cranberry Urinary Health, 50 caplets (softgel version is a separate product)', 'Vitacost listing', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'pricing.price': f('$7.79 for 50 caplets', 'Vitacost listing', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'pricing.size_count': f('50 caplets = 25 servings of 2', 'Vitacost listing', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'pricing.availability': f('Vitacost, Food Lion, Giant, Hannaford and drugstores', 'Retailer listings', 'https://www.foodlion.com/groceries/product/azo-cranberry-urinary-tract-health-caplets-50-ct-pkg/177733', 'retailer'),
      'composition.ingredients': f('Per 2 caplets: vitamin C 60 mg, Pacran whole fruit cranberry 500 mg, calcium (dicalcium phosphate) 110 mg, Bacillus coagulans 30 mg. Other: microcrystalline cellulose, stearic acid, povidone, HPMC, magnesium stearate; coating with glycerin, vegetable juice color, citric acid, sodium ascorbate, sodium carbonate, annatto, beta carotene, ascorbic acid', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'composition.active_ingredients': f(['Pacran cranberry 500 mg', 'Vitamin C 60 mg', 'Bacillus coagulans 30 mg'], 'Vitacost listing', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'composition.dosage': f('2 caplets daily with water, with or without food', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'composition.allergens': f('Labeled dairy free, gluten free, non-GMO. No allergen statement found.', 'Vitacost listing', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'safety.warnings': f('Inform your healthcare professional before taking. Keep out of reach of children. Do not use if blister foil is damaged.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'safety.side_effects': f('No adverse effects known for cranberry supplements; urine acidification may promote uric acid kidney stones in susceptible people.', 'Merck Manual: Cranberry', 'https://www.merckmanuals.com/en-ca/professional/special-subjects/dietary-supplements/cranberry', 'clinical_guidance'),
      'safety.medication_interactions': f('Cranberry products may increase the effects of warfarin, atorvastatin and nifedipine.', 'Merck Manual: Cranberry', 'https://www.merckmanuals.com/en-ca/professional/special-subjects/dietary-supplements/cranberry', 'clinical_guidance'),
      'safety.pregnancy': f('No product label statement found. Cochrane 2023 (via Merck Manual): benefit of cranberry for UTI prevention not supported in pregnant women.', 'Merck Manual: Cranberry', 'https://www.merckmanuals.com/en-ca/professional/special-subjects/dietary-supplements/cranberry', 'clinical_guidance'),
      'safety.regulatory_status': f('Dietary supplement; FDA allows a qualified health claim for cranberry and recurrent UTI in healthy women, noting limited and inconsistent evidence', 'Merck Manual: Cranberry', 'https://www.merckmanuals.com/en-ca/professional/special-subjects/dietary-supplements/cranberry', 'clinical_guidance'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.vitacost.com/products/azo-cranberry-urinary-health-50-caplets-9612', 'retailer'),
      'health.intended_use': f('Urinary tract health support; helps prevent recurrence, does not treat an existing UTI', 'Vitacost listing + Merck Manual', 'https://www.merckmanuals.com/en-ca/professional/special-subjects/dietary-supplements/cranberry', 'clinical_guidance'),
      'evidence.sources': f([
        { title: 'Cochrane: Cranberries for preventing urinary tract infections (2023)', url: 'https://www.cochrane.org/CD001321/UTI_cranberry-for-preventing-urinary-tract-infections', evidence_type: 'ingredient_research', supports: 'Cranberry products reduce symptomatic, culture-verified UTIs (about 30%) in women with recurrent UTIs; not shown in pregnancy or older adults' },
        { title: 'Merck Manual Professional: Cranberry', url: 'https://www.merckmanuals.com/en-ca/professional/special-subjects/dietary-supplements/cranberry', evidence_type: 'expert_guidance', supports: 'Evidence summary, AUA Grade C recommendation, warfarin interaction' },
      ], 'Cochrane + Merck Manual', 'https://www.cochrane.org/CD001321/UTI_cranberry-for-preventing-urinary-tract-infections', 'research'),
      'evidence.claims': f([
        { claim: 'Reduces recurrent UTIs in women with a history of UTIs', strength: 'moderate', evidence_type: 'ingredient_research', source_url: 'https://www.cochrane.org/CD001321/UTI_cranberry-for-preventing-urinary-tract-infections', product_specific: false },
        { claim: 'Treats an active UTI', strength: 'none', evidence_type: 'expert_guidance', source_url: 'https://www.merckmanuals.com/en-ca/professional/special-subjects/dietary-supplements/cranberry', product_specific: false },
      ], 'Cochrane + Merck Manual', 'https://www.cochrane.org/CD001321/UTI_cranberry-for-preventing-urinary-tract-infections', 'research'),
    },
  },

  'p-azo-test': {
    ...head('needs_correction', 'none_found', 'Catalog route is "ingestible"; this is an at-home in vitro urine test strip (nitrite + leukocyte esterase), so ingestible fields do not apply. Checked iHerb listing ($12.27 for 3 strips, matches catalog $12). FDA clearance number not found on retailer pages (left unknown). Strips screen for UTI signs; a negative does not rule out infection (not stated on the retailer page, so not recorded as fact). No recall found.'),
    corrections: [
      { field: 'risk.route', catalog: 'ingestible', source_says: 'In vitro diagnostic urine test strip (external use only)', source_url: 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562' },
    ],
    facts: {
      'identity.variant': f('AZO Test Strips UTI test, 3 individually wrapped strips', 'iHerb listing', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'pricing.price': f('$12.27 for 3 strips', 'iHerb listing', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'pricing.size_count': f('3 test strips', 'iHerb listing', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'pricing.availability': f('iHerb, CVS, drugstores', 'Retailer listings', 'https://products.withsilver.app/cvs/758375-azo-urinary-tract-infection-uti-test-strips-clinically-tested-3ct', 'retailer'),
      'composition.ingredients': f('Reagent test pads for nitrite and leukocytes (white blood cells)', 'iHerb listing', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'composition.active_ingredients': na('Not applicable: diagnostic test, not ingested or applied', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'),
      'composition.dosage': na('Not applicable: diagnostic test', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'),
      'composition.allergens': na('Not applicable: external in vitro test, no body contact beyond urine stream', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'),
      'safety.medication_interactions': na('Not applicable: diagnostic test', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'),
      'safety.age_restriction': na('Not applicable: diagnostic test', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'),
      'safety.pregnancy': na('Not applicable: diagnostic test, not ingested', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'),
      'safety.breastfeeding': na('Not applicable: diagnostic test, not ingested', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'),
      'safety.warnings': f('For in vitro (external) diagnostic use. Store at 59-86°F, out of direct sunlight; do not refrigerate. Hold in urine stream 1-2 seconds; read nitrite at 1 minute and leukocytes at 2 minutes against the pouch color chart.', 'iHerb listing (package text)', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'health.intended_use': f('At-home screening for two signs of UTI (leukocytes and nitrite) in about 2 minutes', 'iHerb listing', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'evidence.sources': f([
        { title: 'AZO Test Strips listing (manufacturer claims)', url: 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', evidence_type: 'manufacturer', supports: 'Manufacturer says clinically tested and uses the same test type most doctors use (dipstick nitrite/leukocyte)' },
      ], 'iHerb listing', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
      'evidence.claims': f([
        { claim: 'Detects signs of UTI (nitrite, leukocytes) at home', strength: 'moderate', evidence_type: 'manufacturer', source_url: 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', product_specific: true },
      ], 'iHerb listing', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562', 'retailer'),
    },
  },
  'p-zinc': {
    ...head('needs_correction', 'none_found', 'Catalog "Garden of Life Zinc 30mg, $14 for 30 tablets" with an Amazon image could not be matched to a current Garden of Life tablet. The current Garden of Life 30 mg zinc is Vitamin Code RAW Zinc with Vitamin C, 60 vegan capsules (30 servings of 2), $11.53 at Vitacost; facts below are for it. It also contains vitamin C, a raw fruit/vegetable blend, spirulina/chlorella and a probiotic/enzyme blend. Founder should confirm the intended variant. Only Garden of Life recall found was a 2017 infant liquid.'),
    corrections: [
      { field: 'identity.variant', catalog: '30 tablets, $14', source_says: 'Vitamin Code RAW Zinc: 60 vegan capsules (2 per serving, 30 mg zinc), $11.53', source_url: 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033' },
    ],
    facts: {
      'identity.brand': f('Garden of Life', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'identity.variant': f('Vitamin Code RAW Zinc with Vitamin C, 60 vegan capsules', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'pricing.price': f('$11.53 for 60 capsules', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'pricing.size_count': f('60 capsules = 30 servings of 2', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'pricing.availability': f('Vitacost, Thrive Market, Instacart retailers', 'Retailer listings', 'https://thrivemarket.com/p/garden-of-life-vitamin-code-raw-zinc', 'retailer'),
      'composition.ingredients': f('Per 2 capsules: vitamin C 60 mg (S. cerevisiae culture), zinc 30 mg (brown rice chelate), raw organic fruit & vegetable blend 166 mg, trace mineral blend 150 mg (spirulina, chlorella, peat), raw probiotic & enzyme blend 60 mg (L. bulgaricus, L. plantarum 500M CFU). Other: vegetable cellulose capsule, organic rice hull', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'composition.active_ingredients': f(['Zinc 30 mg', 'Vitamin C 60 mg'], 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'composition.dosage': f('Adults: 2 capsules daily (30 mg zinc)', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'composition.allergens': f('Made without dairy, soy, peanut, tree nuts or shellfish, in a facility that processes them. Contains yeast-cultured vitamin C, spirulina and chlorella.', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'safety.warnings': f('Consult a healthcare practitioner before use if pregnant or nursing, giving to children, with upcoming surgery, taking medication, or under medical supervision. Not intended for children.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'safety.side_effects': f('High zinc intake can cause nausea, vomiting, stomach upset and headache; 50 mg+/day for weeks can cause copper deficiency. NIH adult UL is 40 mg/day from all sources.', 'NIH ODS Zinc fact sheet', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional', 'regulatory'),
      'safety.medication_interactions': f('Zinc reduces absorption of quinolone and tetracycline antibiotics (take antibiotic 2 hours before or 4-6 hours after) and penicillamine; thiazide diuretics increase zinc loss.', 'NIH ODS Zinc fact sheet', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional', 'regulatory'),
      'safety.pregnancy': f('Label: consult a healthcare practitioner before use if pregnant.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'safety.breastfeeding': f('Label: consult a healthcare practitioner before use if nursing.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'safety.age_restriction': f('Adults; not intended for children', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'safety.recalls': f('No recall found for this product. A 2017 Garden of Life recall covered Baby Organic Liquid (different product).', 'FDA recall notice', 'https://www.fda.gov/Safety/Recalls/ucm575135.htm', 'regulatory'),
      'health.intended_use': f('Zinc supplement (manufacturer: immune and skin support)', 'Vitacost listing', 'https://www.vitacost.com/products/garden-of-life-vitamin-code-raw-zinc-with-vitamin-c-60-vegan-capsules-46033', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Zinc fact sheet for health professionals', url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional', evidence_type: 'regulatory', supports: 'Upper limit, adverse effects, drug interactions; does not address acne or PCOS' },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Zinc corrects low zinc intake', strength: 'strong', evidence_type: 'ingredient_research', source_url: 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional', product_specific: false },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional', 'regulatory'),
    },
  },
  'p-boric-acid': {
    ...head('needs_correction', 'none_found', 'Catalog says "Boric acid 600mg, gelatin capsule"; the Honey Pot product is a solid "Boric Acid & Herbs" ovule suppository with applicator: cocoa butter / triglyceride base plus neem, tea tree oil, mallow, fenugreek, tabebuia and garlic extracts; boric acid amount per suppository is not stated on the retailer listing. Contains essential oil (tea tree) and garlic, relevant for sensitivity. Label: do not use if pregnant or nursing; avoid intercourse during use. Price $18.88 for 14 matches catalog $19. CDC guidance supports 600 mg boric acid in gelatin capsules for recurrent non-albicans yeast; this herbal product is not that regimen. Vaginal suppository: clinician review also needed. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Boric acid 600mg, gelatin capsule.', source_says: 'C10-18 triglycerides, boric acid (amount not stated), cocoa seed butter, neem seed oil, tea tree leaf oil, tocopheryl acetate, denatured alcohol, mallow extract, water, glyceryl behenate, fenugreek seed extract, tabebuia bark extract, garlic bulb extract; ovule with applicator, not a gelatin capsule', source_url: 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050' },
    ],
    facts: {
      'identity.brand': f('The Honey Pot Company', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'identity.name': f('The Honey Pot 7 Day Boric Acid & Herbs Suppositories + Applicator', 'Fred Meyer listing', 'https://www.fredmeyer.com/p/the-honey-pot-7-day-boric-acid-herbs-suppositories-applicator/0085166900858', 'retailer'),
      'identity.variant': f('14 suppositories (ovules) with 1 applicator', 'Walmart + H-E-B listings', 'https://www.walmart.com/ip/The-Honey-Pot-Company-Boric-Acid-and-Herbal-Suppositories-Applicator-14-ovules-1-applicator/481280554', 'retailer'),
      'pricing.price': f('$18.88 for 14 suppositories (H-E-B)', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'pricing.size_count': f('14 suppositories', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'pricing.availability': f('H-E-B, Walmart, Fred Meyer/Kroger, co-ops', 'Retailer listings', 'https://www.walmart.com/ip/The-Honey-Pot-Company-Boric-Acid-and-Herbal-Suppositories-Applicator-14-ovules-1-applicator/481280554', 'retailer'),
      'composition.ingredients': f('C10-18 triglycerides, boric acid, cocoa seed butter, neem seed oil, tea tree leaf oil, vitamin E (tocopheryl acetate), denatured alcohol, mallow extract, water, glyceryl behenate, fenugreek seed extract, tabebuia bark extract, garlic bulb extract. Made in Italy.', 'H-E-B listing (label ingredients)', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'composition.active_ingredients': f(['Boric acid (amount per suppository not stated on listing)', 'Botanical extracts: neem, tea tree, mallow, fenugreek, tabebuia, garlic'], 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'composition.allergens': f('Contains tea tree essential oil, neem, garlic and fenugreek extracts, cocoa butter. No formal allergen statement found.', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'composition.fragrance': f('No added fragrance listed; contains tea tree essential oil', 'H-E-B listing (ingredients)', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'safety.warnings': f('For vaginal use only; not for oral consumption (if swallowed, get medical help or contact poison control). Do not use on broken or irritated skin. Do not use if pregnant or nursing. Keep out of reach of children. Avoid intercourse while using. Stop and contact a doctor if symptoms persist or worsen, or with irritation or burning.', 'H-E-B listing (label warnings)', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'safety.side_effects': f('Label: irritation or burning possible (stop use); some nighttime discharge is normal.', 'H-E-B listing (label)', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'safety.pregnancy': f('Label: do not use if pregnant.', 'H-E-B listing (label)', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'safety.breastfeeding': f('Label: do not use if nursing.', 'H-E-B listing (label)', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'safety.regulatory_status': f('Not FDA-evaluated; label says not intended to diagnose, treat, cure or prevent disease (not an FDA-approved drug)', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'health.intended_use': f('Vaginal suppository marketed for vaginal odor/pH balance support (brand claims)', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', 'retailer'),
      'evidence.sources': f([
        { title: 'CDC STI Treatment Guidelines: Vulvovaginal candidiasis', url: 'https://www.cdc.gov/stiapp/candidiasis.html', evidence_type: 'clinical_guideline', supports: '600 mg boric acid in a gelatin capsule vaginally once daily for 3 weeks for recurrent non-albicans yeast (about 70% eradication); not this herbal formulation' },
      ], 'CDC', 'https://www.cdc.gov/stiapp/candidiasis.html', 'clinical_guidance'),
      'evidence.claims': f([
        { claim: 'Boric acid (600 mg capsule) treats recurrent non-albicans yeast infection', strength: 'moderate', evidence_type: 'clinical_guideline', source_url: 'https://www.cdc.gov/stiapp/candidiasis.html', product_specific: false },
        { claim: 'This herbal boric acid suppository balances vaginal pH or odor', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://www.heb.com/product-detail/the-honey-pot-boric-acid-and-herbs-suppositories/5689050', product_specific: true },
      ], 'CDC + label', 'https://www.cdc.gov/stiapp/candidiasis.html', 'clinical_guidance'),
    },
  },
  'p-rituals-prenatal': {
    ...head('needs_clinician_review', 'none_found', 'Checked Ritual ingredients page and Vitacost listing (warnings). Variant: Essential for Women Prenatal Multivitamin, 60 vegan capsules (30 servings of 2), citrus. Catalog image shows a "Essential + Gut Duo" bundle, not the single product. Catalog ingredients "etc." should be replaced by the full panel; product contains no calcium. Vitacost listing has typos (iodine "150 mg", D "200 IU"); brand page gives iodine 150 mcg and vitamin D 2000 IU. Price $39 regular (subscription; $44.32 one-time). Prenatal with iron: clinician review. No recall found (a 2024 Health Canada prenatal recall was JAMP brand).'),
    corrections: [
      { field: 'identity.image', catalog: 'Essential-_-Gut-Duo-for-Prenatal.png (bundle image)', source_says: 'Single product is Essential Prenatal Multivitamin, 60 capsules', source_url: 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients' },
    ],
    facts: {
      'identity.purchase_url': f('https://www.ritual.com/products/essential-prenatal-multivitamin', 'Ritual product page', 'https://www.ritual.com/products/essential-prenatal-multivitamin'),
      'identity.variant': f('Essential for Women Prenatal Multivitamin, citrus, 60 vegan capsules', 'Ritual ingredients page', 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients'),
      'pricing.price': f('$39.00 regular subscription per bottle (new-subscriber sale $31.20; one-time $44.32 + shipping)', 'Ritual ingredients page', 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients'),
      'pricing.size_count': f('60 capsules = 30 servings of 2', 'Ritual ingredients page', 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients'),
      'pricing.availability': f('Ritual website (subscription), Vitacost, Amazon, Whole Foods, Walmart', 'Retailer listings', 'https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103', 'retailer'),
      'composition.ingredients': f('Per 2 capsules: vitamin D3 50 mcg (2000 IU, lichen), vitamin E 7 mg, folate 1000 mcg DFE (6S-5-MTHF glucosamine salt), B12 8 mcg (methylcobalamin), biotin 150 mcg, choline 55 mg, iron 18 mg (ferrous bisglycinate), iodine 150 mcg, magnesium 32 mg, DHA 350 mg (microalgae), boron 0.7 mg, vitamin K2 90 mcg (MK-7). Other: hypromellose, gellan gum, silica, cellulose, L-leucine, pectin, organic orange oil. No calcium.', 'Ritual ingredients page + Vitacost', 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients'),
      'composition.active_ingredients': f(['Folate (methylfolate) 1000 mcg DFE', 'Iron 18 mg', 'DHA 350 mg', 'Vitamin D3 2000 IU', 'Choline 55 mg', 'Iodine 150 mcg', 'Vitamin B12 8 mcg', 'Vitamin K2 90 mcg'], 'Ritual ingredients page', 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients'),
      'composition.dosage': f('2 capsules together daily, with or without food', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103', 'retailer'),
      'composition.allergens': f('Brand: gluten and major allergen free; third-party tested for gluten, egg, wheat, soy, tree nuts, peanuts, fish, shellfish, milk and sesame. Vegan (DHA from algae).', 'Ritual ingredients page', 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients'),
      'safety.warnings': f('Iron overdose is a leading cause of fatal poisoning in children under 6; keep out of reach of children and call a doctor or poison control on accidental overdose. Consult a practitioner if pregnant or nursing, taking medications, or with a medical condition.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103', 'retailer'),
      'safety.side_effects': f('Iron can cause stomach upset and constipation, especially at higher doses or on an empty stomach.', 'NIH ODS Iron fact sheet', ODS.iron, 'regulatory'),
      'safety.medication_interactions': f('Iron can reduce absorption of levodopa and levothyroxine; PPIs and calcium reduce iron absorption. Vitamin D: orlistat, statins, steroids, thiazides.', 'NIH ODS Iron + Vitamin D fact sheets', ODS.iron, 'regulatory'),
      'safety.pregnancy': f('Designed for before, during and after pregnancy (manufacturer). Label: consult a health care practitioner before use if pregnant.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103', 'retailer'),
      'safety.breastfeeding': f('Label: consult a health care practitioner before use if nursing.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103', 'retailer'),
      'safety.age_restriction': f('Adult women; keep out of reach of children (iron)', 'Vitacost listing', 'https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Ritual ingredients page', 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients'),
      'safety.recalls': f('No recall found for Ritual prenatal (recall search, Oct 2026).', 'Web recall search', 'https://www.vitacost.com/products/ritual-essential-for-women-prenatal-multivitamin-citrus-60-vegan-capsules-153103', 'retailer'),
      'health.intended_use': f('Prenatal multivitamin for preconception, pregnancy and postpartum (manufacturer)', 'Ritual product page', 'https://www.ritual.com/products/essential-prenatal-multivitamin'),
      'evidence.sources': f([
        { title: 'NIH ODS: Iron fact sheet', url: ODS.iron, evidence_type: 'regulatory', supports: 'Pregnancy iron needs (27 mg/day RDA) and interactions' },
        { title: 'Ritual ingredients page', url: 'https://ritual.com/products/essential-prenatal-multivitamin/ingredients', evidence_type: 'manufacturer', supports: 'Formula and amounts' },
        { title: 'USPSTF: Folic acid for the prevention of neural tube defects (2023)', url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/folic-acid-for-the-prevention-of-neural-tube-defects-preventive-medication?ds=1', evidence_type: 'clinical_guideline', supports: 'Grade A: 0.4-0.8 mg folic acid daily for people who could become pregnant' },
      ], 'NIH ODS + brand', ODS.iron, 'regulatory'),
      'evidence.claims': f([
        { claim: 'Daily folic acid (0.4-0.8 mg) before and in early pregnancy prevents neural tube defects (USPSTF Grade A; evidence is for folic acid, this product uses methylfolate)', strength: 'strong', evidence_type: 'clinical_guideline', source_url: 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/folic-acid-for-the-prevention-of-neural-tube-defects-preventive-medication?ds=1', product_specific: false },
      ], 'USPSTF', 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/folic-acid-for-the-prevention-of-neural-tube-defects-preventive-medication?ds=1', 'clinical_guidance'),
    },
  },
  'p-flo-gummies': {
    ...head('needs_clinician_review', 'unknown', 'Brand is now O Positiv (FLO PMS gummies, 60 count, 2 per day). No official Supplement Facts panel found in reachable sources; a third-party review (Illuminate Labs) reports ~20 mg vitamin B6 and a 111 mg proprietary blend of chasteberry, lemon balm and dong quai with 3 g added sugar. Reseller page: vegan, gluten free; consult a physician before use if using hormonal birth control. Catalog price $30 not re-verified. Hormone-acting botanicals (chasteberry, dong quai) with birth-control caution: clinician review. Recall status not checked to a primary source.'),
    facts: {
      'identity.brand': f('O Positiv (FLO)', 'Nutrition Insight (brand launch)', 'https://www.nutritioninsight.com/news/flo-vitamins-unveils-o-positiv-brand-for-pms-symptoms-digestion-and-immunity.html', 'research'),
      'identity.variant': f('FLO PMS Gummy Vitamins, 60 gummies (30 servings)', 'Reseller listing', 'https://glamglobal.co.uk/fr/products/o-positiv-flo-pms-gummie-vitamins-proactive-pms-relief-60-count', 'retailer'),
      'pricing.size_count': f('60 gummies = 30 servings of 2', 'Reseller listing', 'https://glamglobal.co.uk/fr/products/o-positiv-flo-pms-gummie-vitamins-proactive-pms-relief-60-count', 'retailer'),
      'composition.ingredients': f('Reported per 2 gummies: vitamin B6 ~20 mg; proprietary blend 111 mg (chasteberry extract, lemon balm, dong quai; individual amounts not disclosed); 3 g added sugar (organic tapioca syrup, cane sugar); titanium dioxide, natural flavors, citric acid. From a third-party review, not the label.', 'Illuminate Labs review (third party)', 'https://illuminatelabs.org/blogs/health/flo-gummies-review', 'research'),
      'composition.active_ingredients': f(['Vitamin B6 (~20 mg reported)', 'Chasteberry, lemon balm, dong quai blend 111 mg'], 'Illuminate Labs review (third party)', 'https://illuminatelabs.org/blogs/health/flo-gummies-review', 'research'),
      'composition.dosage': f('2 gummies daily; brand says results over 2-3 cycles', 'Reseller listing', 'https://glamglobal.co.uk/fr/products/o-positiv-flo-pms-gummie-vitamins-proactive-pms-relief-60-count', 'retailer'),
      'composition.allergens': f('Brand: vegan, gluten free, non-GMO. No formal allergen statement found.', 'Reseller listing', 'https://glamglobal.co.uk/fr/products/o-positiv-flo-pms-gummie-vitamins-proactive-pms-relief-60-count', 'retailer'),
      'safety.warnings': f('Talk to a physician if taking medication or with a medical condition; consult a physician before use if using hormonal birth control (pill, patch, implant, hormonal IUD).', 'Reseller listing (brand text)', 'https://glamglobal.co.uk/fr/products/o-positiv-flo-pms-gummie-vitamins-proactive-pms-relief-60-count', 'retailer'),
      'safety.medication_interactions': f('Brand: consult a physician if using hormonal birth control or any medication. Chasteberry: NCCIH advises checking with a provider; avoid with hormone-sensitive cancers.', 'Reseller listing + NIH NCCIH', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'safety.pregnancy': f('No product statement found. NCCIH: chasteberry may be unsafe in pregnancy.', 'NIH NCCIH Chasteberry', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'safety.breastfeeding': f('No product statement found. NCCIH: chasteberry may be unsafe while breastfeeding.', 'NIH NCCIH Chasteberry', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'health.intended_use': f('PMS symptom support (cramps, bloating, mood, breakouts per brand)', 'Reseller listing (manufacturer claims)', 'https://glamglobal.co.uk/fr/products/o-positiv-flo-pms-gummie-vitamins-proactive-pms-relief-60-count', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH NCCIH: Chasteberry', url: 'https://www.nccih.nih.gov/health/chasteberry', evidence_type: 'regulatory', supports: 'Chasteberry may ease PMS breast symptoms (low-moderate quality); safety cautions' },
        { title: 'NIH ODS: Vitamin B6', url: 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional', evidence_type: 'regulatory', supports: 'B6 for PMS: small weak trials, often at 50-100 mg (higher than this product)' },
      ], 'NIH NCCIH + ODS', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Reduces PMS symptoms', strength: 'limited', evidence_type: 'ingredient_research', source_url: 'https://www.nccih.nih.gov/health/chasteberry', product_specific: false },
      ], 'NIH NCCIH', 'https://www.nccih.nih.gov/health/chasteberry', 'regulatory'),
    },
  },
  'p-hum-flatter-me': {
    ...head('needs_correction', 'unknown', 'Checked Vitacost listing (label). Catalog lists "Protease, Papain, Lipase, Ginger, Peppermint leaf": the label is an 18-enzyme blend 249 mg (incl. bromelain, papain, proteases, lipase, amylase, lactase, alpha-galactosidase, cellulase) plus 45 mg ginger, fennel and peppermint; serving is 1 capsule with a meal (60 servings). Price $27 vs catalog $26. No product-specific study found. Recall search not run for HUM (unknown).'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Protease, Papain, Lipase, Ginger, Peppermint leaf.', source_says: 'Enzyme blend 249 mg (bromelain, papain, proteases, peptidase, lipase, amylase, glucoamylase, alpha-galactosidase, invertase, diastase, hemicellulase, cellulase, beta-glucanase, phytase, lactase) + herbal blend 45 mg (ginger, fennel, peppermint)', source_url: 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402' },
    ],
    facts: {
      'identity.brand': f('HUM Nutrition', 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'identity.variant': f('Flatter Me, 60 vegan capsules (not the "+ Pre & Probiotics" version)', 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'pricing.price': f('$27.00 for 60 capsules', 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'pricing.size_count': f('60 capsules (60 servings)', 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'pricing.availability': f('Vitacost, Target, HUM website, Beauty Bay', 'Retailer listings', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'composition.ingredients': f('Proprietary enzyme blend 249 mg: bromelain, papain, proteases, peptidase, neutral bacterial protease, lipase, amylase, glucoamylase, alpha-galactosidase, invertase, diastase, hemicellulase, cellulase, beta-glucanase, phytase, lactase. Herbal blend 45 mg: ginger root, fennel seed, peppermint leaf. Other: vegetable capsule (cellulose, water), rice hulls', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'composition.active_ingredients': f(['Digestive enzyme blend 249 mg', 'Ginger, fennel, peppermint blend 45 mg'], 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'composition.dosage': f('1 capsule with a meal', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'composition.allergens': f('Contains no milk, eggs, fish, shellfish, tree nuts, peanuts, wheat, soy or sesame (brand). Vegan, gluten free. Contains papain and bromelain (papaya/pineapple enzymes).', 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'safety.warnings': f('Consult a healthcare professional before use if you have or suspect a medical condition, take prescription drugs, or are pregnant or lactating. Keep out of reach of children.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'safety.pregnancy': f('Label: consult a healthcare professional before use if pregnant.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'safety.breastfeeding': f('Label: consult a healthcare professional before use if lactating.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'safety.medication_interactions': f('Label: consult a healthcare professional if taking prescription drugs. No specific interactions named.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'health.intended_use': f('Digestive enzyme supplement for bloating and digestion (manufacturer)', 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'evidence.sources': f([
        { title: 'HUM Flatter Me label (Vitacost)', url: 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', evidence_type: 'manufacturer', supports: 'Formula; no product-specific clinical study found' },
      ], 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
      'evidence.claims': f([
        { claim: 'Reduces bloating', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', product_specific: true },
      ], 'Vitacost listing', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402', 'retailer'),
    },
  },
  'p-citracal-bone-health': {
    ...head('needs_correction', 'none_found', 'No Citracal product named "Bone Health+" found; current calcium citrate + D3 lines are Maximum Plus (650 mg Ca + 1000 IU D3 per 2 caplets, plus zinc, copper, manganese), Petites and Calcium + D. Facts below are for Maximum Plus 120 caplets ($13.01); founder should confirm the variant (catalog has no image or URL). No recall found in a recall search.'),
    corrections: [
      { field: 'identity.name', catalog: 'Citracal Bone Health+ (Calcium Citrate + D3)', source_says: 'Closest current product: Citracal Maximum Plus Calcium Citrate + D3, 120 caplets', source_url: 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822' },
    ],
    facts: {
      'identity.brand': f('Citracal', 'Vitacost listing', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'identity.variant': f('Maximum Plus, 120 coated caplets (assumed closest match)', 'Vitacost listing', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'pricing.price': f('$13.01 for 120 caplets', 'Vitacost listing', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'pricing.size_count': f('120 caplets = 60 servings of 2', 'Vitacost listing', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'pricing.availability': f('Vitacost, Walmart, Costco, Kroger', 'Retailer listings', 'https://www.walmart.com/ip/13448582', 'retailer'),
      'composition.ingredients': f('Per 2 caplets: calcium (citrate) 650 mg, vitamin D3 25 mcg (1000 IU), zinc 5.5 mg, copper 0.45 mg, manganese 1.15 mg. Other: polyethylene glycol, croscarmellose sodium, copper gluconate, HPMC, magnesium stearate, manganese gluconate, inulin, propylene glycol dicaprylate/dicaprate, talc, titanium dioxide, zinc oxide', 'Vitacost listing (Supplement Facts)', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'composition.active_ingredients': f(['Calcium (as calcium citrate) 650 mg', 'Vitamin D3 1000 IU'], 'Vitacost listing', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'composition.dosage': f('Adults and children 12+: 2 caplets twice daily (up to 1,300 mg calcium, 2000 IU D3/day) with a full glass of water', 'Vitacost listing (directions)', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'safety.warnings': f('Elderly, adolescents and people with swallowing difficulty should consult a professional first; ask a health professional if pregnant, breastfeeding, taking medication or with a medical condition. Not for children under 12. Do not exceed recommended intake.', 'Vitacost listing (label warnings)', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'safety.side_effects': f('Calcium can cause gas, bloating and constipation (less often with citrate than carbonate); high supplemental intake may raise kidney stone risk.', 'NIH ODS Calcium fact sheet', 'https://ods.od.nih.gov/factsheets/Calcium/', 'regulatory'),
      'safety.medication_interactions': f('Calcium lowers dolutegravir and quinolone antibiotic absorption and can impair levothyroxine absorption (separate doses); lithium plus calcium may raise hypercalcemia risk. Calcium also reduces iron absorption.', 'NIH ODS Calcium + Iron fact sheets', 'https://ods.od.nih.gov/factsheets/Calcium/', 'regulatory'),
      'safety.pregnancy': f('Label: ask a health professional before use if pregnant.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'safety.breastfeeding': f('Label: ask a health professional before use if breastfeeding.', 'Vitacost listing (label)', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'safety.age_restriction': f('Not for children under 12', 'Vitacost listing (label)', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'safety.regulatory_status': f('Dietary supplement', 'Vitacost listing', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web recall search', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'health.intended_use': f('Calcium + vitamin D supplement for bone health', 'Vitacost listing', 'https://www.vitacost.com/products/citracal-calcium-supplement-d3-maximum-plus-120-coated-caplets-108822', 'retailer'),
      'evidence.sources': f([
        { title: 'NIH ODS: Calcium fact sheet', url: 'https://ods.od.nih.gov/factsheets/Calcium/', evidence_type: 'regulatory', supports: 'Calcium needs, upper limits, side effects, drug interactions, bone health' },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/Calcium/', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Calcium + vitamin D help meet needs for bone health when diet is low', strength: 'moderate', evidence_type: 'ingredient_research', source_url: 'https://ods.od.nih.gov/factsheets/Calcium/', product_specific: false },
      ], 'NIH ODS', 'https://ods.od.nih.gov/factsheets/Calcium/', 'regulatory'),
    },
  },
  'p-good-clean-love': {
    ...head('needs_correction', 'unknown', 'Catalog "Bio-Match Moisturizer" maps to Good Clean Love Restore Moisturizing Vaginal Gel (Bio-Match line). Catalog ingredients list sodium chloride and omit lactic acid, natural flavor and sodium benzoate; brand page lists aloe leaf juice, xanthan gum, lactic acid, natural flavor, potassium sorbate, sodium benzoate; pH 3.7-4.1 (catalog says 3.5-4.5). Brand says "fragrance free" but it contains natural flavor. Catalog route "ingestible" is wrong: this is a vaginal gel. Price $16.99 on brand page vs catalog $13 (sizes shown sold out). FDA clearance not stated on page (unknown). Recall not checked to a primary source.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Aloe vera, xanthan gum, sodium chloride, potassium sorbate. pH 3.5-4.5.', source_says: 'Organic aloe leaf juice, xanthan gum, lactic acid, natural flavor, potassium sorbate, sodium benzoate; pH 3.7-4.1; osmolality 250-400 mOsm/kg', source_url: 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products' },
      { field: 'risk.route', catalog: 'ingestible', source_says: 'Vaginal moisturizing gel (topical/internal vaginal use)', source_url: 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products' },
      { field: 'identity.name', catalog: 'Good Clean Love Bio-Match Moisturizer', source_says: 'Restore Moisturizing Vaginal Gel', source_url: 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products' },
    ],
    facts: {
      'identity.name': f('Good Clean Love Restore Moisturizing Vaginal Gel', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'identity.purchase_url': f('https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'pricing.price': f('$16.99 (brand page; pack sizes shown sold out)', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'composition.ingredients': f('Organic aloe barbadensis leaf juice, xanthan gum, lactic acid, natural flavor, potassium sorbate, sodium benzoate. pH 3.7-4.1; osmolality 250-400 mOsm/kg', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'composition.active_ingredients': f(['Aloe leaf juice', 'Lactic acid'], 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'composition.dosage': na('Not applicable: vaginal gel used as needed, not ingested', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'safety.medication_interactions': na('Not applicable: vaginal gel, not ingested', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'safety.age_restriction': na('Not applicable: vaginal gel, not ingested', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'composition.allergens': f('Contains aloe, natural flavor, potassium sorbate and sodium benzoate preservatives. No formal allergen statement.', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'composition.fragrance': f('Brand says fragrance free, but contains natural flavor ("lightly flavored")', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'safety.warnings': f('Compatible with latex and polyisoprene condoms. Applicator inserted about as far as a tampon. Brand Q&A: ask your OB-GYN before use in pregnancy.', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'safety.pregnancy': f('Brand Q&A: no ingredients shown to cause pregnancy issues, but ask an OB-GYN first.', 'Good Clean Love product page (Q&A)', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'health.intended_use': f('Vaginal moisturizer for day-to-day dryness; can also be used as a lubricant', 'Good Clean Love product page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'evidence.sources': f([
        { title: 'Good Clean Love Restore product page', url: 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products', evidence_type: 'manufacturer', supports: 'Formula, pH and osmolality (iso-osmotic, vaginal-range pH)' },
      ], 'Brand page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
      'evidence.claims': f([
        { claim: 'Relieves vaginal dryness', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products', product_specific: true },
      ], 'Brand page', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'),
    },
  },
  'p-kindra-lotion': {
    ...head('needs_correction', 'unknown', 'Kindra is now sold via MysteryVibe. Catalog ingredients "Niacinamide, coconut oil, sunflower seed oil": label has no niacinamide; it is a 25-ingredient lotion (glycerin, dimethicone, sunflower oil, shea, sodium hyaluronate, coconut oil, lactic acid, bisabolol, pentapeptide-59, preservatives). Catalog $29 matches the 1 oz size ($49 for 2.5 oz). Brand says FSA/HSA eligible and free of estrogen/phytoestrogens/progesterone. "Clinically proven" rests on a 4-week consumer perception study (n=70, no control). Recall status not checked to a primary source.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Niacinamide, coconut oil, sunflower seed oil.', source_says: 'Water, glycerin, cetearyl alcohol, dimethicone, sunflower seed oil, cetyl alcohol, coco-glucoside, shea butter, acrylate copolymer, sodium hyaluronate, C15-19 alkane, glyceryl stearate citrate, coconut oil, lactic acid, bisabolol, tocopherol, sodium benzoate, potassium sorbate, hydrogenated lecithin, polyglyceryl-6 laurate, phenethyl alcohol, ethylhexylglycerin, polyglycerin-6, maltodextrin, pentapeptide-59 (no niacinamide)', source_url: 'https://mysteryvibe.com/products/daily-v-lotion' },
    ],
    facts: {
      'identity.purchase_url': f('https://mysteryvibe.com/products/daily-v-lotion', 'Kindra Daily V Lotion page (MysteryVibe)', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'identity.variant': f('Daily V Lotion, 1 oz (also 2.5 oz and 2-packs)', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'pricing.price': f('$29 for 1 oz; $49 for 2.5 oz', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'pricing.size_count': f('1 oz or 2.5 oz pump', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'pricing.fsa_hsa': f('Brand says FSA/HSA eligible', 'Kindra product page (FAQ)', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'pricing.availability': f('MysteryVibe (Kindra), Walmart for other Kindra items', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'composition.ingredients': f('Water, glycerin, cetearyl alcohol, dimethicone, sunflower seed oil, cetyl alcohol, coco-glucoside, shea butter, sodium acrylate/sodium acryloyldimethyl taurate copolymer, sodium hyaluronate, C15-19 alkane, glyceryl stearate citrate, coconut oil, lactic acid, bisabolol, tocopherol, sodium benzoate, potassium sorbate, hydrogenated lecithin, polyglyceryl-6 laurate, phenethyl alcohol, ethylhexylglycerin, polyglycerin-6, maltodextrin, pentapeptide-59', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'composition.active_ingredients': f(['Sodium hyaluronate (hyaluronic acid)', 'Pentapeptide-59', 'Plant oils and shea butter (emollients)'], 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'composition.allergens': f('Contains coconut oil, shea butter, sunflower oil. Brand: formulated without estrogen, phytoestrogens or progesterone. No formal allergen statement.', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'safety.warnings': f('Slight stinging or burning may occur; use less product, and stop and consult a healthcare provider if irritation continues. Wash hands before and after use.', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'safety.side_effects': f('Possible slight stinging or burning (brand attributes to dryness).', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'health.intended_use': f('Hormone-free vulvovaginal moisturizer for dryness (marketed for menopause), applied twice daily', 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'evidence.sources': f([
        { title: 'Kindra Daily V Lotion page (consumer study)', url: 'https://mysteryvibe.com/products/daily-v-lotion', evidence_type: 'product_study', supports: 'Consumer perception study, 70 women, 4 weeks, no control: self-reported relief and hydration' },
      ], 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
      'evidence.claims': f([
        { claim: 'Relieves vaginal/vulvar dryness', strength: 'limited', evidence_type: 'product_study', source_url: 'https://mysteryvibe.com/products/daily-v-lotion', product_specific: true },
      ], 'Kindra product page', 'https://mysteryvibe.com/products/daily-v-lotion'),
    },
  },
  'p-uberlube': {
    ...head('in_review', 'none_found', 'Checked Walmart listing and FDA 510(k) database: K151647 Uberlube (product code NUC, personal lubricant), substantially equivalent 09/23/2015. Ingredients match catalog. Catalog price $18 is between sizes: 55 ml $21.99 and 112 ml $33.99 at Walmart; variant unclear (catalog image is 55 ml). Latex safe; brand says use with non-silicone toys. No pregnancy/TTC statement found. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$18', source_says: '$21.99 for 55 ml; $33.99 for 112 ml (Walmart)', source_url: 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029' },
    ],
    facts: {
      'identity.variant': f('Uberlube Luxury silicone lubricant, 55 ml bottle (also 112 ml and 15 ml refills)', 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'pricing.price': f('$21.99 for 55 ml; $33.99 for 112 ml', 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'pricing.size_count': f('55 ml (1.9 fl oz) or 112 ml (3.79 fl oz)', 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'pricing.availability': f('Walmart, pelvic health shops, brand website', 'Retailer listings', 'https://thepelvicpeople.com/products/uberlube-luxury-lubricant-100ml', 'retailer'),
      'composition.ingredients': f('Dimethicone, dimethiconol, cyclomethicone, tocopheryl acetate (vitamin E)', 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'composition.active_ingredients': f(['Silicones (dimethicone, dimethiconol, cyclomethicone)', 'Vitamin E (tocopheryl acetate)'], 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'composition.allergens': f('Brand: free of animal products, parabens, alcohol, gluten, glycerin, scents and flavors.', 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'composition.fragrance': f('Unscented and flavorless', 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'safety.warnings': f('Latex safe. Brand directs use with non-silicone toys (silicone lubricant can damage silicone toys).', 'Walmart listing', 'https://www.walmart.com/ip/Uberlube-Luxury-Lubricant-Latex-Safe-Natural-Silicone-Lube-with-Vitamin-E-Unscented-Flavorless-Zero-Residue-Works-Underwater-112ml/472894029', 'retailer'),
      'safety.regulatory_status': f('FDA 510(k) K151647, personal lubricant (product code NUC), substantially equivalent 09/23/2015', 'FDA 510(k) database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647', 'regulatory'),
      'safety.recalls': f('No recall found (FDA 510(k) record and recall search, Oct 2026).', 'FDA 510(k) database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647', 'regulatory'),
      'health.intended_use': f('Personal lubricant to reduce friction and discomfort during intercourse (FDA device class: personal lubricant)', 'FDA 510(k) + Walmart listing', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647', 'regulatory'),
      'evidence.sources': f([
        { title: 'FDA 510(k) K151647: Uberlube', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647', evidence_type: 'regulatory', supports: 'Cleared as a personal lubricant' },
        { title: 'Uberlube clinical reference (Mayo Clinic CE exhibitor material)', url: 'https://ce.mayo.edu/sites/default/files/media/2022-05/Uberlube%20Clinical%20Reference%20Feb%202018.pdf', evidence_type: 'manufacturer', supports: 'Manufacturer clinical reference sheet' },
      ], 'FDA', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Reduces friction and discomfort during sex', strength: 'moderate', evidence_type: 'regulatory', source_url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647', product_specific: true },
      ], 'FDA', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647', 'regulatory'),
    },
  },
  'p-honeypot-wash': {
    ...head('in_review', 'unknown', 'Walmart lists The Honey Pot Intimate Wash Sensitive (cucumber aloe), 5.51 fl oz, $9.88, pH 3.5-4.5, gynecologist tested; this matches the catalog size and price. Full ingredient list was not available on reachable pages, so the catalog list (water, coco-glucoside, aloe, apple cider vinegar) remains unverified; Skinsort indicates 29 ingredients including AHA and vitamin E, so the catalog list is incomplete. Fragrance status unconfirmed. Normal (herbal/essential-oil) and Sensitive versions differ. Recall not checked to a primary source.'),
    facts: {
      'identity.variant': f('Intimate Wash, Sensitive (cucumber aloe), 5.51 fl oz (assumed; Normal version also exists)', 'Walmart listing', 'https://www.walmart.com/ip/294198656', 'retailer'),
      'pricing.price': f('$9.88 for 5.51 fl oz', 'Walmart listing', 'https://www.walmart.com/ip/294198656', 'retailer'),
      'pricing.size_count': f('5.51 fl oz (10.5 fl oz refill also sold)', 'Walmart listings', 'https://www.walmart.com/ip/The-Honey-Pot-Company-Sensitive-Intimate-Wash-Refill-10-5-fl-oz/5206922886', 'retailer'),
      'pricing.availability': f('Walmart, Target and other US retailers', 'Retailer listings', 'https://www.walmart.com/ip/294198656', 'retailer'),
      'safety.warnings': f('External wash; brand states pH balanced (3.5-4.5) and gynecologist tested. Full label warnings not available on the listing.', 'Walmart listing', 'https://www.walmart.com/ip/294198656', 'retailer'),
      'health.intended_use': f('External vulvar cleansing; brand claims it minimizes odor', 'Walmart listing (manufacturer claims)', 'https://www.walmart.com/ip/294198656', 'retailer'),
    },
  },

  'p-luna-wash': {
    ...head('needs_correction', 'unknown', 'Luna Daily\'s wash is "The Everywhere Wash" (Original scented, Hydrating, Fragrance Free). Checked Boots UK listing for Original: contains parfum (jasmine/amber) plus coconut-derived surfactants, glycerin, coconut oil, aloe, lactic acid, inulin, chamomile, preservatives. Catalog lists only water, glycerin, lactic acid, chamomile and omits the fragrance; catalog name "Intimate Feminine Wash" and "$12 for 6oz" not verified for the US. External use only; brand advises a 24-hour patch test. Recall not checked to a primary source.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Purified water, glycerin, lactic acid, chamomile extract.', source_says: 'Original: aqua, cocamidopropyl betaine, decyl glucoside, glycerin, cetearyl alcohol, coconut oil, aloe juice, glyceryl stearate, xanthan gum, sodium chloride, lactic acid, inulin, linoleic acid, chamomile extract, linolenic acid, sodium benzoate, potassium sorbate, citric acid, tocopherol, panthenol, sodium ascorbyl phosphate, disodium EDTA, tocopheryl acetate, parfum', source_url: 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536' },
      { field: 'identity.name', catalog: 'Luna Daily Intimate Feminine Wash', source_says: 'Luna Daily The Everywhere Wash (Original / Hydrating / Fragrance Free)', source_url: 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536' },
    ],
    facts: {
      'identity.name': f('Luna Daily The Everywhere Wash', 'Boots listing', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'identity.variant': f('Original (scented); Hydrating and Fragrance Free versions also sold', 'Boots listing', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'pricing.size_count': f('250 ml (UK); also 100 ml and 400 ml', 'Boots + Cult Beauty listings', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'pricing.availability': f('Boots, Holland & Barrett, Cult Beauty (UK); US availability not confirmed', 'Retailer listings', 'https://www.cultbeauty.com/p/luna-daily-the-everywhere-wash-fragrance-free-400ml/17538824/', 'retailer'),
      'composition.ingredients': f('Aqua, cocamidopropyl betaine, decyl glucoside, glycerin, cetearyl alcohol, coconut oil, aloe leaf juice, glyceryl stearate, xanthan gum, sodium chloride, lactic acid, inulin, linoleic acid, chamomile flower extract, linolenic acid, sodium benzoate, potassium sorbate, citric acid, tocopherol, panthenol, sodium ascorbyl phosphate, disodium EDTA, tocopheryl acetate, parfum', 'Boots listing (Original)', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'composition.active_ingredients': f(['Lactic acid', 'Inulin (prebiotic)', 'Mild coconut-derived surfactants'], 'Boots listing', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'composition.allergens': f('Contains fragrance (parfum) and coconut-derived ingredients; brand advises a 24-hour patch test.', 'Boots listing', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'composition.fragrance': f('Original contains parfum (jasmine and amber notes); a Fragrance Free version exists', 'Boots listing', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'safety.warnings': f('For external use only. Patch test on inner arm 24 hours before first use.', 'Boots listing', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
      'health.intended_use': f('pH-balanced external wash for intimate areas and body', 'Boots listing', 'https://boots.com/lunadaily-the-everywhere-wash-250ml-10336536', 'retailer'),
    },
  },
  'p-v-wash': {
    ...head('needs_correction', 'unknown', 'VWash Plus is an Indian product (1mg listing, MRP Rs 300, pH 3.5); US price $8 and US availability not verified. Catalog lists only lactic acid, tea tree oil, sea buckthorn oil; full label adds triethanolamine lauryl sulphate and ammonium lauryl sulphate (sulfate surfactants), cocamidopropyl betaine, phenoxyethanol, benzoic acid and others. The listing calls it SLS/SLES-free while listing lauryl sulphate salts. Contains tea tree essential oil. Recall not checked to a primary source.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Lactic acid, tea tree oil, sea buckthorn oil.', source_says: 'Purified water, triethanolamine lauryl sulphate, ammonium lauryl sulphate, cocamidopropyl betaine, PEG-7 glyceryl cocoate, lactic acid, phenoxyethanol, benzoic acid, dehydroacetic acid, sorbitol, hydroxypropyl cellulose, polyquaternium-7, sea buckthorn fruit oil, sodium hydroxide, tea tree oil', source_url: 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806' },
    ],
    facts: {
      'identity.variant': f('VWash Plus Expert Intimate Hygiene, pH 3.5 (100 ml / 200 ml)', '1mg listing', 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806', 'retailer'),
      'pricing.availability': f('Indian pharmacies (1mg, Apollo); also sold in Kenya and Sri Lanka. US availability not confirmed.', 'Retailer listings', 'https://www.apollopharmacy.in/ta/otc/v-wash-plus-lotion-100ml', 'retailer'),
      'composition.ingredients': f('Purified water, triethanolamine lauryl sulphate, ammonium lauryl sulphate, cocamidopropyl betaine, PEG-7 glyceryl cocoate, lactic acid, phenoxyethanol, benzoic acid, dehydroacetic acid, sorbitol, hydroxypropyl cellulose, polyquaternium-7, sea buckthorn fruit oil, sodium hydroxide, tea tree oil', '1mg listing', 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806', 'retailer'),
      'composition.active_ingredients': f(['Lactic acid', 'Tea tree oil', 'Sea buckthorn fruit oil'], '1mg listing', 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806', 'retailer'),
      'composition.allergens': f('Contains sulfate surfactants (TEA and ammonium lauryl sulphate) and tea tree essential oil.', '1mg listing', 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806', 'retailer'),
      'safety.warnings': f('Apply externally to the intimate area and rinse. Keep out of reach of children.', '1mg listing', 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806', 'retailer'),
      'safety.pregnancy': f('Seller tips say it can be used during pregnancy (seller information, not a clinical source).', '1mg listing', 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806', 'retailer'),
      'health.intended_use': f('External intimate wash, pH 3.5', '1mg listing', 'https://mars.1mg.com/otc/vwash-plus-expert-intimate-hygiene-otc126806', 'retailer'),
    },
  },

  'p-sweet-spot-wipes': {
    ...head('needs_correction', 'unknown', 'Catalog image is Vanilla Blossom (scented) Wipettes while catalog name is generic; variants differ. Checked Ulta listing for SweetSpot Labs Unscented Gentle Soothing Wipes: marketed "fragrance free" and without essential oils, yet the ingredient list includes fragrance allergens (benzyl salicylate, butylphenyl methylpropional, limonene, coumarin, citral). Catalog ingredients "aloe, cucumber, lactic acid" are incomplete (no lactic acid listed on this variant). Price and count not shown on listing. Recall not checked to a primary source.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Aloe, cucumber, lactic acid.', source_says: 'Unscented: water, PEG-40 hydrogenated castor oil, propanediol, sodium hyaluronate, aloe, chamomile, pineapple, cranberry, cucumber extracts, panthenol, allantoin, sodium PCA, dipotassium glycyrrhizate, witch hazel water, poloxamer 407, benzyl salicylate, butylphenyl methylpropional, limonene, coumarin, citral', source_url: 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177' },
      { field: 'identity.image', catalog: 'Vanilla Blossom Wipettes image', source_says: 'Unscented and scented variants have different ingredients; pick one', source_url: 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177' },
    ],
    facts: {
      'identity.variant': f('Unscented Gentle Soothing Wipes (scented Vanilla Blossom also sold)', 'Ulta listing', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
      'pricing.availability': f('Ulta, SweetSpot Labs website', 'Ulta listing', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
      'composition.ingredients': f('Water, PEG-40 hydrogenated castor oil, propanediol, sodium hyaluronate, aloe leaf juice, chamomile flower extract, pineapple fruit extract, cranberry fruit extract, cucumber fruit extract, panthenol, allantoin, sodium PCA, dipotassium glycyrrhizate, witch hazel water, poloxamer 407, benzyl salicylate, butylphenyl methylpropional, limonene, coumarin, citral', 'Ulta listing', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
      'composition.active_ingredients': f(['Aloe, chamomile, witch hazel, sodium hyaluronate (soothing/humectant)'], 'Ulta listing', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
      'composition.allergens': f('Contains fragrance allergens benzyl salicylate, butylphenyl methylpropional, limonene, coumarin and citral despite "fragrance free" marketing.', 'Ulta listing (ingredients)', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
      'composition.fragrance': f('Marketed fragrance free and essential-oil free, but ingredient list contains fragrance-associated compounds', 'Ulta listing', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
      'safety.warnings': f('For external use only. Keep out of reach of children. Discontinue if rash or discomfort develops. Wipe front to back on the vulva.', 'Ulta listing', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
      'health.intended_use': f('External cleansing and soothing wipe for vulva and body; brand says pH-balanced to vulvar skin, compostable', 'Ulta listing', 'https://www.ulta.com/p/unscented-gentle-soothing-wipes-pimprod2007177', 'retailer'),
    },
  },
  'p-thermacare': {
    ...head('needs_correction', 'none_found', 'Catalog route is "ingestible"; this is an external air-activated heat wrap (iron heat cells), so ingestible fields do not apply. Catalog name is generic: the menstrual variant is ThermaCare Menstrual Pain Therapy HeatWraps (4 count at Giant). Past recalls: Nov 2018 Pfizer recall of specific lots including two Menstrual lots (8HRT26691, 8HRT26693; expired 2020) for leaks causing burns, and a 2018 recall of one Back Pain lot for overheating cells. No current recall found. Burn warnings are significant (not for sleep, ask a doctor if pregnant or diabetic).'),
    corrections: [
      { field: 'risk.route', catalog: 'ingestible', source_says: 'External heat wrap worn on underwear over the abdomen', source_url: 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810' },
    ],
    facts: {
      'identity.name': f('ThermaCare Menstrual Pain Therapy HeatWraps', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'identity.variant': f('Menstrual wraps, 4 count (3-count packs also sold)', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'pricing.size_count': f('4 single-use wraps', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'pricing.availability': f('Giant, Hannaford, Lowes Foods, Instacart retailers', 'Retailer listings', 'https://hannaford.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'composition.ingredients': f('Air-activated heat cells containing about 2 g iron each (full material list not on listing); adhesive backing', 'Giant Food listing (warnings)', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'composition.active_ingredients': na('Not applicable: heat device, no drug ingredient', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810'),
      'composition.dosage': na('Not applicable: external heat wrap (wear up to 8 hours per 24 hours)', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810'),
      'composition.allergens': f('Adhesive goes on underwear, not skin. Iron contents harmful if swallowed. No allergen statement found.', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'safety.medication_interactions': na('Not applicable: not ingested (do not combine with pain rubs, medicated lotions or other heat sources)', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810'),
      'safety.age_restriction': f('Do not use on people unable to remove the wrap themselves, including children, infants and some elderly people; burn risk rises at 55+', 'Giant Food listing (warnings)', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'safety.warnings': f('Can cause burns. Do not wear while sleeping or with other heat sources or medicated creams; not on damaged skin, areas that cannot feel heat, or recent bruising/swelling; max 8 hours in 24 hours; do not fold. Ask a doctor first if diabetic, poor circulation, heart disease, rheumatoid arthritis, or pregnant. Stop and see a doctor if pain worsens or lasts over 4 days. Remove before MRI. Iron contents harmful if swallowed.', 'Giant Food listing (label warnings)', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'safety.side_effects': f('Burns, blisters, skin irritation, rash', 'Giant Food listing (label warnings)', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'safety.pregnancy': f('Label: ask a doctor before use if pregnant.', 'Giant Food listing (label)', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'safety.recalls': f('Past recall: Nov 2018 Pfizer recall of six lots incl. Menstrual Pain Therapy lots 8HRT26691 and 8HRT26693 (exp. 2020) for leaks causing burns; separate 2018 recall of one Back Pain lot for overheating. No current recall found.', 'News report of FDA recall', 'https://www.abc3340.com/news/nation-world/recall-potential-leak-of-some-heat-wraps-can-cause-skin-burns-blisters-irritation', 'regulatory'),
      'health.intended_use': f('Heat therapy for menstrual cramp pain: up to 8 hours worn plus up to 8 hours after removal (manufacturer)', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
      'evidence.sources': f([
        { title: 'ThermaCare Menstrual label (Giant Food listing)', url: 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', evidence_type: 'manufacturer', supports: 'Labeled use, duration and burn warnings' },
      ], 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/thermacare-heat-therapy-menstrual-pain-heat-wraps-4-ct-pkg/352810', 'retailer'),
    },
  },
  'd-ppd': {
    ...head('in_review', 'none_found', 'Checked Planned Parenthood Direct page and App Store listing. Catalog "$0-15/visit, sliding scale" is not what the page says: birth-control-by-mail visit from $0 with pills $20-30/pack (min 3 packs), pharmacy pickup visit $25-40, ella from $80, abortion pill $200-600 by state; no sliding scale mentioned. Mail services in 49 states + DC (app listing says not available in MA). STI testing temporarily paused. App privacy label: health, contact, payment, location and identifiers linked to the user; "other data" used for tracking. Prescription and abortion care: clinician review of how ayna presents it.'),
    corrections: [
      { field: 'pricing.price', catalog: '$0-15/visit, sliding scale', source_says: 'Birth control by mail: visit from $0 + $20-30/pack; pharmacy pickup visit $25-40; ella from $80; abortion pill $200-600 by state; UTI cost depends on insurance', source_url: 'https://plannedparenthood.org/planned-parenthood-direct' },
    ],
    facts: {
      'identity.purchase_url': f('https://plannedparenthood.org/planned-parenthood-direct', 'Planned Parenthood Direct page', 'https://plannedparenthood.org/planned-parenthood-direct'),
      'pricing.price': f('App free. Birth control by mail: visit from $0, pills $20-30/pack (3-pack minimum). Pharmacy pickup: $25-40 visit + prescription. ella from $80. Abortion pill $200-600 by state. UTI: varies with insurance.', 'Planned Parenthood Direct page', 'https://plannedparenthood.org/planned-parenthood-direct'),
      'pricing.availability': f('Mail services in 49 states and DC (varies by service); App Store listing says not available in MA. iOS and Android.', 'Planned Parenthood Direct page + App Store', 'https://apps.apple.com/US/app/id1214393415'),
      'safety.privacy': f('Privacy notice: plannedparenthooddirect.org/privacy-notice. Apple privacy label (developer-reported): health & fitness, purchases, payment info, coarse location, contact info, user content, user ID and sensitive info are linked to you; "other data" used to track; email used for marketing. Website uses marketing cookies (adjustable). Orders ship in unbranded envelopes.', 'App Store listing + PP Direct page', 'https://apps.apple.com/US/app/id1214393415'),
      'safety.warnings': f('Services vary by state; patients may be referred to in-person care. At-home STI testing and STI telehealth are temporarily paused.', 'Planned Parenthood Direct page', 'https://plannedparenthood.org/planned-parenthood-direct'),
      'safety.recalls': f('Not applicable to a care service; no FDA action found.', 'Planned Parenthood Direct page', 'https://plannedparenthood.org/planned-parenthood-direct'),
      'health.intended_use': f('Telehealth for birth control (pill, patch, ring), emergency contraception (ella), UTI treatment, herpes treatment and the abortion pill up to 10 weeks', 'Planned Parenthood Direct page', 'https://plannedparenthood.org/planned-parenthood-direct'),
    },
  },
  'd-initio': {
    ...head('needs_clinician_review', 'none_found', 'Note: catalog id "d-initio" is spelled differently from the brand (Inito). Checked App Store listing (developer Samplytics Technologies) and a 2020 trade report that Inito "cleared the US FDA regulatory pathway" for its estrogen + LH monitor (no 510(k) number given; not independently confirmed in FDA database). App now measures E3G, LH, PdG and FSH; iPhone only (iOS 16+) with a separate wireless reader. Apple privacy label: contact info linked to identity; health data collected but marked not linked; no tracking listed. Catalog price "$149 monitor + $50/15 strips" not re-verified. Fertility/TTC product: clinician review.'),
    facts: {
      'pricing.availability': f('Inito website and Amazon (strips); app on iPhone (iOS 16+), requires the Inito reader', 'App Store listing', 'https://apps.apple.com/app/id1183799668'),
      'safety.privacy': f('Privacy policy: inito.com/privacy-policy. Apple privacy label (developer-reported): email, name and phone linked to you; health & fitness and sensitive info collected but marked not linked to you; usage data for analytics; no tracking declared.', 'App Store listing', 'https://apps.apple.com/app/id1183799668'),
      'safety.warnings': f('App states it is not intended to diagnose, treat or cure any medical condition; consult a healthcare professional.', 'App Store listing', 'https://apps.apple.com/app/id1183799668'),
      'safety.regulatory_status': f('Company announced in Nov 2020 that its estrogen + LH urine monitor cleared the US FDA regulatory pathway (510(k) number not stated; not verified in FDA database)', 'BioSpectrum India (trade report)', 'https://www.biospectrumindia.com/news/20/17511/inito-clears-usfda-regulatory-pathway-for-fertility-monitor.html', 'research'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web search', 'https://apps.apple.com/app/id1183799668'),
      'health.intended_use': f('At-home urine hormone monitor (E3G, LH, PdG, FSH) to identify fertile days and confirm ovulation', 'App Store listing', 'https://apps.apple.com/app/id1183799668'),
      'evidence.sources': f([
        { title: 'Inito clears US FDA regulatory pathway (BioSpectrum, 2020)', url: 'https://www.biospectrumindia.com/news/20/17511/inito-clears-usfda-regulatory-pathway-for-fertility-monitor.html', evidence_type: 'regulatory', supports: 'Company-announced FDA pathway for estrogen + LH measurement' },
      ], 'BioSpectrum', 'https://www.biospectrumindia.com/news/20/17511/inito-clears-usfda-regulatory-pathway-for-fertility-monitor.html', 'research'),
    },
  },
  'd-eight-sleep': {
    ...head('needs_correction', 'none_found', 'Pod 4 has been superseded: Pod 5 followed, and Eight Sleep launched Pod 6 (reported Sept 23, 2026) with a required Autopilot membership. Catalog "Pod 4, $2,245+" is likely outdated (Pod 4 availability not confirmed). US Pod 6 prices and Eight Sleep privacy policy were not reached in this pass. Not a medical device for a women\'s health condition; check why it is included.'),
    corrections: [
      { field: 'identity.name', catalog: 'Eight Sleep Pod 4', source_says: 'Current generation is Pod 6 (Pod 5 before it); every Pod 6 requires an Autopilot membership', source_url: 'https://tbreak.com/eight-sleep-pod-6-18-sensors-subscription/' },
    ],
    facts: {
      'safety.warnings': f('Pod 6 requires an ongoing Autopilot membership (annual tiers) in addition to the hardware price.', 'tbreak (Pod 6 launch report)', 'https://tbreak.com/eight-sleep-pod-6-18-sensors-subscription/', 'research'),
      'safety.recalls': f('No recall found (recall search, Oct 2026).', 'Web search', 'https://wetried.it/eight-sleep-pod-4-vs-pod-5-whats-the-difference/', 'research'),
    },
  },
  'd-bloom': {
    ...head('in_review', 'none_found', 'Checked ChoosingTherapy review (updated July 29, 2026). Catalog "$60/year" matches $59.99/year; also $14.49/month or $399.99 lifetime; no insurance. Self-guided CBT lessons written by a licensed psychologist; no live therapy. Apple-only. Bloom\'s own privacy policy and App Store privacy label not checked in this pass (privacy left as reported by the review only).'),
    facts: {
      'pricing.price': f('$59.99/year, $14.49/month or $399.99 lifetime; free tier with limited content; 7-day trial on yearly plan; no insurance', 'ChoosingTherapy review', 'https://www.choosingtherapy.com/bloom-app-review/', 'research'),
      'pricing.availability': f('Apple App Store only (iPhone, iPad)', 'ChoosingTherapy review', 'https://www.choosingtherapy.com/bloom-app-review/', 'research'),
      'safety.warnings': f('Self-help app, not live therapy: no contact with a licensed therapist. Users must be 13+ (18+ to subscribe). Some users report auto-renewal charges and journals deleted after months.', 'ChoosingTherapy review', 'https://www.choosingtherapy.com/bloom-app-review/', 'research'),
      'safety.privacy': f('Third-party review rates Bloom highly on privacy and security and links its privacy policy; Bloom\'s own policy not reviewed in this pass.', 'ChoosingTherapy review', 'https://www.choosingtherapy.com/bloom-app-review/', 'research'),
      'safety.recalls': f('Not applicable to an app; no FDA action found.', 'ChoosingTherapy review', 'https://www.choosingtherapy.com/bloom-app-review/', 'research'),
      'health.intended_use': f('Self-guided CBT video lessons, journaling, mindfulness and breathwork for stress, anxiety, low mood and sleep', 'ChoosingTherapy review', 'https://www.choosingtherapy.com/bloom-app-review/', 'research'),
    },
  },
  'p-frida-mom-kit': {
    ...head('needs_correction', 'unknown', 'Catalog image is the Frida Mom Postpartum Recovery Essentials Kit; Walmart lists it at $49.98 (out of stock online) vs catalog $100. Kit: 4 disposable underwear, 4 Instant Ice maxi pads, 24 witch hazel pad liners, perineal healing foam, storage caddy. Ingredients of the foam and liners and label warnings were not on the listing (left unknown; check whether the foam contains any active drug). Recall not checked to a primary source.'),
    corrections: [
      { field: 'pricing.price', catalog: '$100', source_says: '$49.98 (Walmart, Recovery Essentials Kit)', source_url: 'https://www.walmart.com/ip/Frida-Mom-Postpartum-Recovery-Essentials-Kit/763934282' },
      { field: 'composition.ingredients', catalog: 'Various recovery components.', source_says: '4 disposable postpartum underwear, 4 Instant Ice maxi pads, witch hazel pad liners (24), perineal healing foam, storage caddy', source_url: 'https://www.walmart.com/ip/Frida-Mom-Postpartum-Recovery-Essentials-Kit/763934282' },
    ],
    facts: {
      'identity.variant': f('Postpartum Recovery Essentials Kit', 'Walmart listing', 'https://www.walmart.com/ip/Frida-Mom-Postpartum-Recovery-Essentials-Kit/763934282', 'retailer'),
      'pricing.price': f('$49.98 (Walmart; out of stock online when checked)', 'Walmart listing', 'https://www.walmart.com/ip/Frida-Mom-Postpartum-Recovery-Essentials-Kit/763934282', 'retailer'),
      'pricing.size_count': f('4 underwear, 4 ice maxi pads, 24 witch hazel liners, 1 perineal foam, 1 caddy', 'Walmart listing', 'https://www.walmart.com/ip/Frida-Mom-Postpartum-Recovery-Essentials-Kit/763934282', 'retailer'),
      'pricing.availability': f('Walmart, Babylist, baby retailers', 'Retailer listings', 'https://www.babylist.com/gp/frida-mom-postpartum-recovery-essentials-kit-1741277147/52153/1963474', 'retailer'),
      'composition.ingredients': f('Kit components: disposable postpartum underwear, Instant Ice maxi pads, witch hazel pad liners, perineal healing foam, storage caddy (component ingredient lists not on listing)', 'Walmart listing', 'https://www.walmart.com/ip/Frida-Mom-Postpartum-Recovery-Essentials-Kit/763934282', 'retailer'),
      'health.intended_use': f('Recovery after vaginal delivery: perineal tears, swelling, stitches, hemorrhoids', 'Walmart listing', 'https://www.walmart.com/ip/Frida-Mom-Postpartum-Recovery-Essentials-Kit/763934282', 'retailer'),
    },
  },
  'p-lansinoh-pads': {
    ...head('in_review', 'unknown', 'Checked H-E-B listing: Stay Dry Disposable Nursing Pads, 60 count, $9.37 (catalog $12). Brand claims latex free, fragrance free, BPA/BPS free, two adhesive strips, InvisiLock core, FSC-certified materials. Catalog "absorbent polymer, non-woven fabric" not confirmed on this page (materials not itemized). Recall not checked to a primary source.'),
    corrections: [
      { field: 'pricing.price', catalog: '$12 for 60', source_says: '$9.37 for 60 (H-E-B; prices vary)', source_url: 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591' },
    ],
    facts: {
      'identity.variant': f('Stay Dry Disposable Nursing Pads, 60 count (also 36, 100, 240)', 'H-E-B listing', 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591', 'retailer'),
      'pricing.price': f('$9.37 for 60 pads (H-E-B; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591', 'retailer'),
      'pricing.size_count': f('60 disposable pads', 'H-E-B listing', 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591', 'retailer'),
      'pricing.availability': f('H-E-B, Walmart, Amazon, baby retailers', 'Retailer listings', 'https://www.walmart.com/ip/208752098', 'retailer'),
      'composition.ingredients': f('Absorbent InvisiLock core, two adhesive strips; FSC-certified forest and recycled materials (full material list not given)', 'H-E-B listing', 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591', 'retailer'),
      'composition.allergens': f('Brand: latex free, BPA and BPS free', 'H-E-B listing', 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591', 'retailer'),
      'composition.fragrance': f('Brand: free of fragrances', 'H-E-B listing', 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591', 'retailer'),
      'health.intended_use': f('Absorb breast milk leaks while breastfeeding', 'H-E-B listing', 'https://www.heb.com/product-detail/lansinoh-stay-dry-disposable-nursing-pads-for-breastfeeding/958591', 'retailer'),
    },
  },
  'p-belly-bandit': {
    ...head('in_review', 'unknown', 'Checked Walmart listing: Belly Bandit Upsie Belly Band $69.95 (catalog $60), sizes S-XL, out of stock; Walmart marks it FSA/HSA eligible. Fabric content not on the listing, so catalog "bamboo viscose, spandex" remains unverified. A "with gel pack" variant exists. Recall not checked to a primary source.'),
    corrections: [
      { field: 'pricing.price', catalog: '$60', source_says: '$69.95 (Walmart; out of stock)', source_url: 'https://www.walmart.com/ip/Maternity-Belly-Bandit-Upsie-Belly-Band/173422546' },
    ],
    facts: {
      'identity.variant': f('Upsie Belly pregnancy support band (sizes S-XL; gel-pack version also sold)', 'Walmart listing', 'https://www.walmart.com/ip/Maternity-Belly-Bandit-Upsie-Belly-Band/173422546', 'retailer'),
      'pricing.price': f('$69.95 (Walmart; out of stock when checked)', 'Walmart listing', 'https://www.walmart.com/ip/Maternity-Belly-Bandit-Upsie-Belly-Band/173422546', 'retailer'),
      'pricing.fsa_hsa': f('Walmart marks it "Benefits eligible (FSA/HSA)"', 'Walmart listing', 'https://www.walmart.com/ip/Maternity-Belly-Bandit-Upsie-Belly-Band/173422546', 'retailer'),
      'pricing.availability': f('Walmart (out of stock), Well.ca, baby retailers', 'Retailer listings', 'https://well.ca/products/belly-bandit-upsie-belly-wrap_148275.html', 'retailer'),
      'health.intended_use': f('Maternity belly and back support band worn during pregnancy', 'Walmart listing', 'https://www.walmart.com/ip/Maternity-Belly-Bandit-Upsie-Belly-Band/173422546', 'retailer'),
    },
  },
};

// Overall evidence strength for the product's main intended use, judged from
// the sources cited in that entry's evidence.sources (ingredient-level unless
// the claim says product_specific).
const STRENGTH = {
  'p-nature-made-iron-65mg': ['strong for treating iron deficiency (ingredient-level)', ODS.iron],
  'p-natures-bounty-d3-125mcg': ['strong for correcting vitamin D deficiency (ingredient-level)', ODS.vitd],
  'p-magnesium-glycinate': ['strong for correcting low magnesium intake; product not studied (ingredient-level)', ODS.mg],
  'p-ubiquinol-thorne': ['limited or inconclusive for most uses (NCCIH)', 'https://www.nccih.nih.gov/health/coenzyme-q10?nav=govd'],
  'p-uqora-control': ['limited: one phase 2 trial of the Urox ingredient blend', 'https://clinicaltrials.gov/study/NCT02396160'],
  'p-d-mannose-now': ['limited: 2024 RCT found no benefit for recurrent UTI prevention', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11334993'],
  'p-cystex': ['moderate for short-term symptom relief (OTC monograph-style label); none for curing UTI', 'https://drugs.com/otc/433290/cystex-plus.html'],
  'p-inositol-wholesome': ['limited: guideline meta-analysis finds inconclusive benefit for PCOS outcomes (ingredient-level)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11099481'],
  'p-spearmint-pcos': ['limited: one small 30-day RCT (ingredient-level)', 'https://pubmed.ncbi.nlm.nih.gov/19585478'],
  'p-love-wellness-bloat': ['limited: single-arm, self-reported product study without control', 'https://citruslabs.com/testedproducts/love-wellness-bye-bye-bloat'],
  'p-pelvic-wand': ['limited: FDA-cleared device type; no product outcome trials found', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K250419'],
  'p-intimate-rose': ['moderate: FDA-cleared indications for vaginal dilation (device)', 'https://fda.innolitics.com/device/K241748'],
  'p-estroven-mood': ['limited: black cohosh trials and reviews show insufficient benefit for hot flashes', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional'],
  'p-remifemin': ['limited: insufficient evidence for hot flashes (NIH ODS, Cochrane)', 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional'],
  'p-creatine-womens': ['strong for exercise performance and lean mass with training (ingredient-level)', 'https://pmc.ncbi.nlm.nih.gov/articles/5469049/'],
  'p-probiotics-women': ['limited for vaginal/urinary claims; evidence is strain-specific and these strains are not identified', 'https://ods.od.nih.gov/factsheets/Probiotics-HealthProfessional'],
  'p-evening-primrose': ['limited: insufficient evidence for PMS/menopause; none for breast pain', 'https://nccih.nih.gov/health/eveningprimrose'],
  'p-vitex': ['moderate for PMS symptoms (low-moderate quality studies); limited for fertility', 'https://www.nccih.nih.gov/health/chasteberry'],
  'p-fish-oil': ['limited for PMS/hormonal claims (evening primrose); omega-3 benefits are general', 'https://nccih.nih.gov/health/eveningprimrose'],
  'p-b-complex': ['limited for PMS (B6); strong only for correcting deficiency', 'https://ods.od.nih.gov/factsheets/Vitaminb6-HealthProfessional'],
  'p-cranberry-supplement': ['moderate for preventing recurrent UTI in women (Cochrane 2023, ingredient-level)', 'https://www.cochrane.org/CD001321/UTI_cranberry-for-preventing-urinary-tract-infections'],
  'p-azo-test': ['moderate: standard nitrite/leukocyte dipstick method; product accuracy data not seen', 'https://www.iherb.com/pr/azo-test-strips-urinary-tract-infection-test-3-self-testing-strips/14562'],
  'p-zinc': ['strong only for correcting low zinc intake (ingredient-level)', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional'],
  'p-boric-acid': ['moderate for 600 mg boric acid capsules in recurrent non-albicans yeast (CDC); none for this herbal formulation', 'https://www.cdc.gov/stiapp/candidiasis.html'],
  'p-rituals-prenatal': ['strong for prenatal folate (USPSTF, folic acid form); product not studied', 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/folic-acid-for-the-prevention-of-neural-tube-defects-preventive-medication?ds=1'],
  'p-flo-gummies': ['limited (ingredient-level, low doses)', 'https://www.nccih.nih.gov/health/chasteberry'],
  'p-hum-flatter-me': ['limited: no product-specific study found', 'https://www.vitacost.com/products/hum-nutrition-flatter-me-60-vegan-capsules-136402'],
  'p-citracal-bone-health': ['moderate for meeting calcium/vitamin D needs (ingredient-level)', 'https://ods.od.nih.gov/factsheets/Calcium/'],
  'p-good-clean-love': ['limited: manufacturer information only', 'https://goodcleanlove.com/collections/all/products/restore%C2%AE-moisturizing-vaginal-gel-products'],
  'p-kindra-lotion': ['limited: uncontrolled consumer perception study', 'https://mysteryvibe.com/products/daily-v-lotion'],
  'p-uberlube': ['moderate: FDA-cleared personal lubricant', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPMN/pmn.cfm?ID=K151647'],
};
for (const [id, [value, url]] of Object.entries(STRENGTH)) {
  if (R[id] && !R[id].facts['evidence.strength']) R[id].facts['evidence.strength'] = f(value, 'ayna evidence review of cited sources', url, 'research');
}

// Products whose catalog entry carries no source links at all: their source
// list is the distinct pages cited below (others keep the catalog list).
const EV = { regulatory: 'regulatory', research: 'ingredient_research', clinical_guidance: 'clinical_guideline' };
const EV_LABEL = { regulatory: 'Regulatory information', ingredient_research: 'Ingredient research', clinical_guideline: 'Clinical guideline', manufacturer: 'Manufacturer information' };
const NO_CATALOG_SOURCES = new Set(['p-nature-made-iron-65mg', 'p-pelvic-wand', 'p-luna-wash', 'p-sweet-spot-wipes']);
for (const [id, entry] of Object.entries(R)) {
  if (!NO_CATALOG_SOURCES.has(id) || entry.facts['sources.all']) continue;
  const seen = new Map();
  for (const x of Object.values(entry.facts)) {
    if (!x.source_url || seen.has(x.source_url)) continue;
    const evidence_type = EV[x.source_type] || 'manufacturer';
    seen.set(x.source_url, { url: x.source_url, title: x.source, publisher: new URL(x.source_url).hostname.replace(/^www\./, ''), evidence_type, evidence_label: EV_LABEL[evidence_type] });
  }
  entry.facts['sources.all'] = { value: [...seen.values()], source: 'Pages cited by this review', source_type: 'ayna_catalog', verified_at: D };
}

export default R;

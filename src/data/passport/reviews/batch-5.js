// Research pass 5 (AI-assisted, sourced). See ../reviews.js for the format.
// Batch 5: tampons (o.b.), diagnostics (Winx, Proov), devices (SootheHer,
// Elitone, Pippa, Oboo), pelvic support garments, incontinence products and
// period underwear. Every fact below cites the page it came from.
// Facts not found are left out on purpose (unknown, never "no").

const D = '2026-10-13';
const NEXT = '2026-10-27'; // pricing refresh, REVIEW_INTERVAL_DAYS.pricing = 14
const BY = 'ayna research pass (AI-assisted), needs human sign-off';

/** One sourced fact. */
const f = (value, source, source_url, source_type = 'brand') => ({ value, source, source_url, source_type, verified_at: D });

/** A field that does not apply to this product (e.g. fragrance on an electronic device). */
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

// ---------------------------------------------------------------------------
// o.b. tampons (Kenvue). Shared regulator + brand sources.
// ---------------------------------------------------------------------------
const OB = {
  ingredients: 'https://www.ob-tampons.com/faq/product-ingredients',
  tss: 'https://www.ob-tampons.com/pages/tss',
  multipack: 'https://www.ob-tampons.com/products/ob-tampons-multipack-r-s-s-plus',
  fda: 'https://www.fda.gov/forconsumers/consumerupdates/ucm612029.htm',
  cfr: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-801/subpart-H/section-801.430',
  hebRegular: 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008',
  hebSuperPlus: 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-super-plus-absorbency-unscented/1542744',
  ultra: 'https://stopandshop.com/groceries/product/ob-ultra-tampons-40-ct-box/396993',
  targetMulti: 'https://products.withsilver.app/dpci/14013693-ob-original-applicator-free-tampons-multi-pack-regular-super-super-plus-absorbency-40-ct',
  fsa: 'https://blog.healthequity.com/cares-act-womens-health-and-menstrual-care',
  deMini16: 'https://www.aponeo.de/00723767-o-b-tampons-procomfort-mini.html',
  ukMini32: 'https://www.notino.co.uk/o-b/pro-comfort-mini-tampons-7151798/',
};

const OB_RS_SP_INGREDIENTS = 'Rayon and/or cotton fiber, polyester, polyethylene, titanium dioxide, PEG-100 stearate, fatty acid polyglycol ester; string: C.I. Vat Red 10, C.I. Vat Orange 15, C.I. Vat Green 1, paraffin wax';
const OB_ULTRA_INGREDIENTS = 'Rayon and/or cotton fiber, polyester, polyethylene, titanium dioxide, fatty acid polyglycol ester, plant-derived oil; string: C.I. Disperse Blue 60, C.I. Disperse Yellow 235, paraffin wax';

/** Facts shared by every US o.b. Original tampon (FDA-regulated menstrual tampon). */
const obCommon = () => ({
  'composition.fragrance': f('Unscented: retailer label text says free from fragrance and elemental chlorine', 'H-E-B listing (label text)', OB.hebRegular, 'retailer'),
  'safety.warnings': f('Tampons are associated with Toxic Shock Syndrome (TSS), a rare but serious disease that may cause death; read and save the insert. Use the lowest absorbency that controls your flow; change every 4 to 8 hours and never wear one longer than 8 hours; stop use if sensitivity or irritation occurs. If you have had TSS warning signs before, ask a doctor before using tampons again.', 'Label text (H-E-B) + o.b. TSS page + FDA', OB.tss),
  'safety.side_effects': f('TSS warning signs: sudden fever (usually 102F or higher), vomiting, diarrhea, fainting or near fainting when standing, dizziness, sunburn-like rash. Remove the tampon and get medical care right away. Stop use and see a provider for pain, unusual discharge or allergic reaction.', 'FDA consumer update on tampons', OB.fda, 'regulatory'),
  'safety.regulatory_status': f('Menstrual tampon regulated by FDA as a medical device; labeling must follow 21 CFR 801.430 (TSS alert, standardized absorbency terms)', 'FDA + eCFR 21 CFR 801.430', OB.cfr, 'regulatory'),
  'safety.age_restriction': f('No minimum age stated. Required TSS labeling notes reported risk is higher for women under 30 and teenage girls.', 'o.b. TSS page + 21 CFR 801.430', OB.tss),
  'safety.recalls': f('No o.b. tampon recall found. FDA recall database search for tampons returned a 2011-2012 Kotex (Kimberly-Clark) recall, not o.b.', 'FDA recall database search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRes/res.cfm?id=105225', 'regulatory'),
  'pricing.fsa_hsa': f('Menstrual care products such as tampons became HSA/FSA-eligible under the 2020 CARES Act; H-E-B tags o.b. 40ct as FSA/HSA eligible', 'H-E-B listing + HealthEquity CARES Act explainer', OB.hebRegular, 'retailer'),
  'health.intended_use': f('Applicator-free menstrual tampon for absorbing menstrual flow, used only during the period', 'o.b. product page + FDA', OB.multipack),
  'evidence.sources': f([
    { title: 'FDA: The Facts on Tampons and How to Use Them Safely', url: OB.fda, evidence_type: 'regulatory', supports: 'Tampons are FDA-regulated devices; safe-use guidance; TSS warning signs; elemental-chlorine-free bleaching' },
    { title: '21 CFR 801.430: user labeling for menstrual tampons', url: OB.cfr, evidence_type: 'regulatory', supports: 'Standard absorbency ranges in grams and mandatory TSS labeling' },
    { title: 'o.b. product ingredients FAQ', url: OB.ingredients, evidence_type: 'manufacturer', supports: 'Materials and string dyes by product line' },
  ], 'FDA + eCFR + o.b.', OB.fda, 'regulatory'),
  'evidence.claims': f([
    { claim: 'Absorbs menstrual flow within the labeled FDA absorbency range', strength: 'strong', evidence_type: 'regulatory', source_url: OB.cfr, product_specific: false },
    { claim: 'Using the lowest absorbency needed lowers TSS risk', strength: 'strong', evidence_type: 'regulatory', source_url: OB.fda, product_specific: false },
  ], 'FDA + eCFR', OB.fda, 'regulatory'),
});

const obIngredients = (value, src, url, type = 'brand') => ({
  'composition.ingredients': f(value, src, url, type),
  'composition.allergens': f('No allergen or latex statement found on the brand ingredient page; contains polyester, polyethylene and dyed string. Check the box insert if sensitive.', 'o.b. ingredients FAQ', OB.ingredients),
});

const R = {
  'p-ob-original-regular-40': {
    ...head('in_review', 'none_found', 'Checked o.b. ingredients FAQ and TSS page, H-E-B listing (label text), FDA tampon page, 21 CFR 801.430, FDA recall database. Catalog price "See Amazon": H-E-B lists $7.96 for 40. No recall found.'),
    corrections: [{ field: 'pricing.price', catalog: 'See Amazon', source_says: '$7.96 for 40 at H-E-B (retailer; varies)', source_url: OB.hebRegular }],
    facts: {
      ...obCommon(),
      ...obIngredients(OB_RS_SP_INGREDIENTS, 'o.b. ingredients FAQ (Regular/Super/Super Plus line), matches H-E-B label text', OB.ingredients),
      'identity.variant': f('o.b. Original applicator-free tampons, Regular absorbency (6-9 g), unscented, 40 count', 'H-E-B listing + 21 CFR 801.430', OB.hebRegular, 'retailer'),
      'pricing.price': f('$7.96 for 40 at H-E-B (retailer; varies)', 'H-E-B listing', OB.hebRegular, 'retailer'),
      'pricing.size_count': f('40 tampons', 'H-E-B listing', OB.hebRegular, 'retailer'),
      'pricing.availability': f('Sold at US grocers and pharmacies (H-E-B, Walmart, Target) and on ob-tampons.com', 'H-E-B listing + o.b. site', OB.hebRegular, 'retailer'),
    },
  },
  'p-ob-original-super-40': {
    ...head('in_review', 'none_found', 'Checked o.b. ingredients FAQ and TSS page, FDA tampon page, 21 CFR 801.430, FDA recall database. No US retailer price for the Super 40ct was retrievable (Walmart/Amazon blocked). No recall found.'),
    facts: {
      ...obCommon(),
      ...obIngredients(OB_RS_SP_INGREDIENTS, 'o.b. ingredients FAQ (Regular/Super/Super Plus line)', OB.ingredients),
      'identity.variant': f('o.b. Original applicator-free tampons, Super absorbency (9-12 g by FDA definition), unscented, 40 count', 'o.b. ingredients FAQ + 21 CFR 801.430', OB.cfr, 'regulatory'),
      'pricing.size_count': f('40 tampons', 'Catalog name; o.b. sells Original in 40ct boxes', OB.multipack),
      'pricing.availability': f('Sold at US grocers and pharmacies and on ob-tampons.com', 'o.b. site', OB.multipack),
    },
  },
  'p-ob-original-super-plus-40': {
    ...head('in_review', 'none_found', 'Checked o.b. ingredients FAQ and TSS page, H-E-B listing (label text), FDA tampon page, 21 CFR 801.430, FDA recall database. H-E-B label text lists a longer ingredient list (cellulose, PET, dipotassium phosphate, ethoxylated fatty acid esters) than the brand FAQ; check the box. Catalog price "See Amazon": H-E-B $7.67 for 40.'),
    corrections: [
      { field: 'pricing.price', catalog: 'See Amazon', source_says: '$7.67 for 40 at H-E-B (retailer; varies)', source_url: OB.hebSuperPlus },
      { field: 'composition.ingredients', catalog: '(brand FAQ list)', source_says: 'H-E-B label text adds cellulose, polyethylene terephthalate, dipotassium phosphate, ethoxylated fatty acid esters; conflicts with brand FAQ', source_url: OB.hebSuperPlus },
    ],
    facts: {
      ...obCommon(),
      ...obIngredients(`Brand FAQ: ${OB_RS_SP_INGREDIENTS}. H-E-B label text instead lists rayon, cellulose, polyester, polyethylene terephthalate, cotton, polyethylene, titanium dioxide, PEG-100 stearate, paraffin wax, dipotassium phosphate, ethoxylated fatty acid esters, C.I. Vat Red 10, C.I. Vat Orange 15, C.I. Vat Green 1`, 'o.b. ingredients FAQ + H-E-B listing', OB.ingredients),
      'identity.variant': f('o.b. Original applicator-free tampons, Super Plus absorbency (12-15 g), unscented, 40 count', 'H-E-B listing + 21 CFR 801.430', OB.hebSuperPlus, 'retailer'),
      'pricing.price': f('$7.67 for 40 at H-E-B (retailer; varies)', 'H-E-B listing', OB.hebSuperPlus, 'retailer'),
      'pricing.size_count': f('40 tampons', 'H-E-B listing', OB.hebSuperPlus, 'retailer'),
      'pricing.availability': f('Sold at US grocers and pharmacies (H-E-B, Walmart) and on ob-tampons.com', 'H-E-B listing', OB.hebSuperPlus, 'retailer'),
    },
  },
  'p-ob-original-ultra-40': {
    ...head('in_review', 'none_found', 'Checked o.b. ingredients FAQ (Ultra line has a different formula: plant-derived oil, no PEG-100 stearate, blue/yellow string dyes), Stop & Shop listing (absorbency chart, label text), FDA, 21 CFR 801.430, FDA recall database. Stop & Shop label text differs from brand FAQ; check the box. No price retrievable. Ultra (15-18 g) is the highest absorbency, so highest TSS caution.'),
    facts: {
      ...obCommon(),
      ...obIngredients(OB_ULTRA_INGREDIENTS, 'o.b. ingredients FAQ (Ultra/Multipack line)', OB.ingredients),
      'identity.variant': f('o.b. Original applicator-free tampons, Ultra absorbency (15-18 g), 40 count', 'Stop & Shop listing (absorbency chart)', OB.ultra, 'retailer'),
      'pricing.size_count': f('40 tampons', 'Stop & Shop listing', OB.ultra, 'retailer'),
      'pricing.availability': f('Sold at US grocers (Stop & Shop) and on ob-tampons.com', 'Stop & Shop listing', OB.ultra, 'retailer'),
    },
  },
  'p-ob-original-multipack-40': {
    ...head('in_review', 'none_found', 'Checked o.b. multipack page, ingredients FAQ, TSS page, Target listing (via price aggregator), FDA, 21 CFR 801.430, FDA recall database. Conflict: brand page text mentions four absorbencies including Ultra and the ingredients FAQ groups Multipack with the Ultra formula, but the product page lists the Regular/Super/Super Plus formula and Target lists 18 Regular, 12 Super, 10 Super Plus. Brand page price shows $0.00 (placeholder).'),
    corrections: [
      { field: 'pricing.price', catalog: 'See Amazon', source_says: '$7.69 at Target, $8.12 at Walmart for 40 (retailer; varies)', source_url: OB.targetMulti },
    ],
    facts: {
      ...obCommon(),
      ...obIngredients(`Product page: ${OB_RS_SP_INGREDIENTS}. (Brand FAQ instead lists Multipack with the Ultra formula; conflict.)`, 'o.b. multipack page + ingredients FAQ', OB.multipack),
      'identity.variant': f('o.b. Original applicator-free tampons multi-pack: 18 Regular, 12 Super, 10 Super Plus (40 total), unscented', 'Target listing via price aggregator', OB.targetMulti, 'retailer'),
      'pricing.price': f('$7.69 at Target, $8.12 at Walmart for 40 (retailer; varies)', 'Price aggregator (Target/Walmart)', OB.targetMulti, 'retailer'),
      'pricing.size_count': f('40 tampons (18 Regular, 12 Super, 10 Super Plus)', 'Target listing via aggregator', OB.targetMulti, 'retailer'),
      'pricing.availability': f('In stock on ob-tampons.com; also Target and Walmart', 'o.b. product page', OB.multipack),
    },
  },
  'p-ob-original-multipack-80': {
    ...head('in_review', 'none_found', 'Same product as p-ob-original-multipack-40 sold as a pack of 2 (80 tampons). See that entry for the absorbency-mix conflict. Only per-box prices found ($7.69 Target); no verified 2-pack price.'),
    facts: {
      ...obCommon(),
      ...obIngredients(OB_RS_SP_INGREDIENTS, 'o.b. multipack page', OB.multipack),
      'identity.variant': f('Two boxes of the o.b. Original multi-pack (each 18 Regular, 12 Super, 10 Super Plus), 80 tampons total', 'Target listing via aggregator (per box)', OB.targetMulti, 'retailer'),
      'pricing.size_count': f('80 tampons (2 x 40)', 'Per-box count from Target listing', OB.targetMulti, 'retailer'),
      'pricing.availability': f('Single boxes in stock on ob-tampons.com, Target and Walmart', 'o.b. product page', OB.multipack),
    },
  },
};

/** o.b. ProComfort Mini is a European product (Kenvue Germany); different materials from US Original. */
const obMini = (count, priceFact, url, src) => ({
  ...head('needs_correction', 'none_found', `ProComfort Mini is sold in Europe (manufacturer Kenvue Germany GmbH), not on the US o.b. site; US FDA absorbency terms do not apply and no gram rating was found. Materials per Notino UK: viscose core, polyethylene/polypropylene cover, polyester cord, not chlorine-bleached, fragrance and colourant free. Catalog price "See Amazon"; ${src}. No recall found in FDA database.`),
  corrections: [{ field: 'pricing.price', catalog: 'See Amazon', source_says: priceFact, source_url: url }],
  facts: {
    'identity.variant': f(`o.b. ProComfort Mini applicator-free tampons, ${count} count (EU product, for light flow days)`, 'EU retailer listing', url, 'retailer'),
    'pricing.price': f(priceFact, 'EU retailer listing', url, 'retailer'),
    'pricing.size_count': f(`${count} tampons`, 'EU retailer listing', url, 'retailer'),
    'pricing.availability': f('Sold by European pharmacies and retailers (aponeo.de, Notino); not listed on the US o.b. site', 'EU retailer listings', OB.deMini16, 'retailer'),
    'composition.ingredients': f('Absorbent core of viscose; cover of polyethylene and polypropylene; polyester cord. Retailer says check the package as composition may change.', 'Notino UK listing', OB.ukMini32, 'retailer'),
    'composition.fragrance': f('Fragrance free and colourant free; not chlorine bleached (retailer description)', 'Notino UK listing', OB.ukMini32, 'retailer'),
    'composition.allergens': f('No latex or allergen statement found; materials are viscose, polyethylene, polypropylene and polyester. Check the leaflet if sensitive.', 'Notino UK listing', OB.ukMini32, 'retailer'),
    'safety.warnings': f('Retailer says follow the enclosed leaflet. General tampon guidance: TSS is rare but serious; use the lowest absorbency needed and change every 4 to 8 hours.', 'Notino UK + FDA', OB.fda, 'regulatory'),
    'safety.side_effects': f('TSS warning signs: sudden fever, vomiting, diarrhea, fainting or dizziness, sunburn-like rash; remove the tampon and get care right away.', 'FDA consumer update on tampons', OB.fda, 'regulatory'),
    'safety.regulatory_status': f('Tampons are FDA-regulated medical devices in the US; this EU-market variant was not found on the US o.b. site', 'FDA + o.b. US site', OB.fda, 'regulatory'),
    'safety.recalls': f('No o.b. tampon recall found in the FDA recall database search.', 'FDA recall database search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRes/res.cfm?id=105225', 'regulatory'),
    'health.intended_use': f('Smallest-size applicator-free menstrual tampon, described for light flow days', 'Notino UK listing', OB.ukMini32, 'retailer'),
    'evidence.sources': f([
      { title: 'FDA: The Facts on Tampons and How to Use Them Safely', url: OB.fda, evidence_type: 'regulatory', supports: 'Safe-use guidance and TSS warning signs' },
    ], 'FDA', OB.fda, 'regulatory'),
    'evidence.claims': f([
      { claim: 'Using the lowest absorbency needed lowers TSS risk', strength: 'strong', evidence_type: 'regulatory', source_url: OB.fda, product_specific: false },
    ], 'FDA', OB.fda, 'regulatory'),
  },
});
R['p-ob-procomfort-mini-16'] = obMini(16, 'EUR 2.99 for 16 at aponeo.de (list EUR 3.95; retailer, Germany)', OB.deMini16, 'aponeo.de lists EUR 2.99 for 16');
R['p-ob-procomfort-mini-32'] = obMini(32, 'GBP 5.80 for 32 at Notino UK (retailer)', OB.ukMini32, 'Notino UK lists GBP 5.80 for 32');

// ---------------------------------------------------------------------------
// Diagnostics + cramp device
// ---------------------------------------------------------------------------
const WINX = {
  brand: 'https://hellowinx.com/products/uti-tests',
  retail: 'https://hannaford.com/groceries/product/winx-health-uti-test-treat-3-ct-box/370420',
  accel: 'https://buynow.accelpay.io/products/winx-health-uti-test-treat-instant-results-rx-access',
  aafp: 'https://aafp.org/afp/2006/0101/p129.html',
};
R['p-winx-uti-test-treat'] = {
  ...head('needs_clinician_review', 'none_found', 'Checked hellowinx.com product page, Hannaford listing (box text), brand checkout page, TIME Best Inventions write-up, AAFP review on urine dipsticks. Catalog $15 matches brand price for 3 tests. Prescription treatment is not in the box: a positive result can lead to an optional paid online doctor visit (TIME: about $15). Brand pages do not state which analytes the strip reads, FDA status, states served or a privacy policy; the catalog says nitrite/leukocyte-esterase-style, unconfirmed. Clinician review: antibiotic access via telehealth. No recall found (FDA recall search on tampons/UTI tests did not list Winx).'),
  facts: {
    'identity.variant': f('UTI Test + Treat, 3 at-home urine tests with optional app-based doctor visit (brand formerly Stix)', 'Winx product page', WINX.brand),
    'pricing.price': f('$15.00 one-time for 3 tests, or $12.75 with subscribe and save', 'Winx product page', WINX.brand),
    'pricing.size_count': f('3 tests', 'Winx product page', WINX.brand),
    'pricing.fsa_hsa': f('FSA/HSA eligible (brand badge)', 'Winx product page', WINX.brand),
    'pricing.availability': f('hellowinx.com and US grocers (Hannaford, Giant, Martin\'s); catalog also lists Walgreens', 'Hannaford listing', WINX.retail, 'retailer'),
    'composition.ingredients': f('Plastic test strips, wipes, wrappers and desiccants in foil pouches; no ingredient list published', 'Hannaford listing (box text)', WINX.retail, 'retailer'),
    'composition.fragrance': na('Not applicable: urine test strip kit', WINX.retail),
    'safety.warnings': f('For in vitro diagnostic use only; do not put the test inside your body. Single use. Do not use if the foil pouch is expired, opened or damaged. Keep out of reach of children. Store dry, 39-86F, do not freeze.', 'Hannaford listing (box text)', WINX.retail, 'retailer'),
    'safety.regulatory_status': f('At-home in vitro diagnostic urine test; brand pages do not state an FDA clearance. Treatment is prescribed separately by an online physician.', 'Winx product page + box text', WINX.retail, 'retailer'),
    'safety.recalls': f('No recall found for Winx/Stix UTI tests in a web and FDA recall search.', 'Web recall search', WINX.brand),
    'health.intended_use': f('At-home screening for a urinary tract infection with results in about 2 minutes; if positive, optional online doctor visit that may lead to a same-day prescription chosen by the physician', 'Winx product page + Hannaford box text', WINX.brand),
    'evidence.sources': f([
      { title: 'AAFP: Urine Dipstick for Diagnosing Urinary Tract Infection (2006)', url: WINX.aafp, evidence_type: 'clinical_guideline', supports: 'Dipstick accuracy in women (about 75% sensitive, 82% specific in symptomatic women); a negative result does not reliably rule out UTI' },
    ], 'AAFP + TIME', WINX.aafp, 'clinical_guidance'),
    'evidence.claims': f([
      { claim: 'Urine dipstick tests can screen for UTI in women', strength: 'moderate', evidence_type: 'clinical_guideline', source_url: WINX.aafp, product_specific: false },
      { claim: 'Winx test is clinically tested (manufacturer claim, no study linked)', strength: 'none', evidence_type: 'manufacturer', source_url: WINX.retail, product_specific: true },
    ], 'AAFP + Winx', WINX.aafp, 'clinical_guidance'),
  },
};

const SH = {
  home: 'https://sootheher.com/',
  pdp: 'https://sootheher.com/shop/soothehers-elaris-pod',
  ma: 'https://pubmed.ncbi.nlm.nih.gov/32917532/',
  cochrane: 'https://www.cochrane.org/CD002123/MENSTR_transcutaneous-electrical-nerve-stimulation-for-primary-dysmenorrhoea',
};
R['p-sootheher-elaris-pod'] = {
  ...head('needs_correction', 'unknown', 'Checked sootheher.com home and product page, PubMed meta-analysis and Cochrane review on TENS for primary dysmenorrhea. Brand lists $89.99 with no sale; catalog says "$89.99 (list $120)". Brand says "FDA cleared" but gives no 510(k) number and none was found: unverified manufacturer claim. Recall status unknown because no FDA listing could be matched to this brand.'),
  corrections: [{ field: 'pricing.price', catalog: '$89.99 (list $120)', source_says: '$89.99 list price, no sale price shown', source_url: SH.pdp }],
  facts: {
    'identity.variant': f('Elaris Pod wearable TENS unit for menstrual cramps (single device kit; a Complete Bundle is sold separately)', 'SootheHer product page', SH.pdp),
    'pricing.price': f('$89.99', 'SootheHer product page', SH.pdp),
    'pricing.size_count': f('1 Elaris Pod, 2 butterfly gel pads, 2 small circle gel pads, 1 connecting wire, 1 USB-C cable, user manual', 'SootheHer home page (in the box)', SH.home),
    'pricing.availability': f('Sold on sootheher.com with free US shipping and a 30-day money-back guarantee', 'SootheHer home page', SH.home),
    'composition.ingredients': f('Rechargeable TENS pod with medical-grade gel pads (pads last about 30-40 uses; refills sold separately). No other materials published.', 'SootheHer home page', SH.home),
    'composition.fragrance': na('Not applicable: electronic TENS device (gel pads unscented status not stated)', SH.pdp),
    'safety.warnings': f('Brand: not suitable if pregnant, with a pacemaker, epilepsy or heart rhythm conditions.', 'SootheHer product page', SH.pdp),
    'safety.pregnancy': f('Brand: not suitable for people who are pregnant.', 'SootheHer product page', SH.pdp),
    'safety.regulatory_status': f('Brand states FDA cleared; no 510(k) number given or found (unverified manufacturer claim)', 'SootheHer product page', SH.pdp),
    'health.intended_use': f('Drug-free menstrual cramp relief: TENS pad worn on the lower abdomen with multiple intensity levels and modes', 'SootheHer home page', SH.home),
    'evidence.sources': f([
      { title: 'Arik et al. 2020 (Explore): TENS for pain relief in primary dysmenorrhea, systematic review and meta-analysis', url: SH.ma, evidence_type: 'ingredient_research', supports: 'Pooled trials of TENS (the technology, not this device) for period pain' },
      { title: 'Cochrane review: TENS for primary dysmenorrhoea', url: SH.cochrane, evidence_type: 'ingredient_research', supports: 'Small trials suggest high-frequency TENS eases period pain better than placebo; low-frequency TENS no better than placebo (2002)' },
    ], 'Cochrane + PubMed', SH.cochrane, 'research'),
    'evidence.claims': f([
      { claim: 'High-frequency TENS reduces primary dysmenorrhea pain', strength: 'limited', evidence_type: 'ingredient_research', source_url: SH.cochrane, product_specific: false },
      { claim: 'Elaris Pod is FDA cleared (manufacturer claim, no clearance number)', strength: 'none', evidence_type: 'manufacturer', source_url: SH.pdp, product_specific: true },
    ], 'Cochrane + SootheHer', SH.cochrane, 'research'),
  },
};

const PROOV = {
  pdp: 'https://proovtest.com/products/empower-perimenopause-test-kit',
  page: 'https://proovtest.com/pages/empower',
  nice: 'https://www.nice.org.uk/guidance/ng23/chapter/recommendations',
};
R['p-proov-empower'] = {
  ...head('needs_clinician_review', 'none_found', 'Checked Proov Empower product page and landing page, NICE NG23 menopause guideline. Catalog $59.99 matches the current sale price (regular $69.99). Brand: not a diagnostic; hormonal birth control and HRT lower results. FDA status and privacy practices not described on the product pages (only a footer privacy link). Marketing stats (85% of women 35+ have imbalances, 3M datapoints) are unsourced. NICE advises against FSH testing to diagnose menopause in symptomatic women over 45 or on combined hormonal contraception: clinician review for how ayna frames it. No recall found in a web search.'),
  facts: {
    'identity.variant': f('Empower perimenopause/menopause urine hormone test kit: FSH, LH, E1G (estrogen marker) and PdG (progesterone marker) at 4 timepoints in a cycle, read in the Proov Insights app', 'Proov product page', PROOV.pdp),
    'pricing.price': f('$59.99 sale (regular $69.99)', 'Proov product page', PROOV.pdp),
    'pricing.size_count': f('1 kit covering 4 test timepoints (exact strip count not stated)', 'Proov product page', PROOV.pdp),
    'pricing.fsa_hsa': f('FSA/HSA accepted through Flex for eligible customers', 'Proov product page', PROOV.pdp),
    'pricing.availability': f('Sold on proovtest.com with a money-back guarantee', 'Proov product page', PROOV.pdp),
    'composition.ingredients': f('Urine test strips (no needles or lab visit); app interprets results', 'Proov product page', PROOV.pdp),
    'composition.fragrance': na('Not applicable: urine test strip kit', PROOV.pdp),
    'safety.warnings': f('Not a diagnostic test; only a doctor can diagnose menopause. Hormonal birth control, HRT and bioidentical hormones can lower FSH, E1G and PdG results; app ranges are based on natural pre-menopause levels. Consult your doctor with questions.', 'Proov product + landing pages', PROOV.page),
    'safety.medication_interactions': f('Brand: hormonal birth control, HRT and bioidentical hormones can affect (often lower) results.', 'Proov landing page', PROOV.page),
    'safety.age_restriction': f('Marketed to women 35+ (FAQ also says 30+) with ovaries; periods not required', 'Proov product page', PROOV.pdp),
    'safety.regulatory_status': f('At-home urine hormone test; product pages do not state FDA status', 'Proov product page', PROOV.pdp),
    'safety.privacy': f('Product pages only link a privacy policy in the footer; data practices for the Proov Insights app were not described there', 'Proov product page', PROOV.pdp),
    'health.intended_use': f('Track urinary FSH, LH, estrogen and progesterone metabolites across a cycle to understand perimenopause or menopause hormone patterns (not diagnostic)', 'Proov landing page', PROOV.page),
    'evidence.sources': f([
      { title: 'NICE NG23: Menopause diagnosis and management, recommendations', url: PROOV.nice, evidence_type: 'clinical_guideline', supports: 'Diagnose peri/menopause by symptoms without lab tests in healthy women over 45; FSH only considered at 40-45; do not use FSH on combined hormonal contraception' },
    ], 'NICE', PROOV.nice, 'clinical_guidance'),
    'evidence.claims': f([
      { claim: 'Hormone testing diagnoses perimenopause', strength: 'limited', evidence_type: 'clinical_guideline', source_url: PROOV.nice, product_specific: false },
      { claim: 'Science-backed, AI-analysed hormone insights (manufacturer claim, no studies cited)', strength: 'none', evidence_type: 'manufacturer', source_url: PROOV.page, product_specific: true },
    ], 'NICE + Proov', PROOV.nice, 'clinical_guidance'),
  },
};

const ELI = {
  pdp: 'https://ELITONE.com/product/elitone',
  facts: 'https://elitone.com/just-the-facts',
  k: 'https://fda.innolitics.com/device/K183585',
};
R['p-elitone'] = {
  ...head('needs_correction', 'none_found', 'Checked Elitone product page and "Just the facts" page (lists 510(k) K183585 cleared Feb 11 2019), 510(k) database listing, FDA recall search (no Elitone recall found). Catalog "From $359" is not current: Original v1 $399, Essential Kit $429, Bundle $539. Clinical figures are manufacturer-reported without linked studies. Pregnancy and implant contraindications recorded.'),
  corrections: [{ field: 'pricing.price', catalog: 'From $359', source_says: '$399 (Original v1, limited time), $429 Essential Kit, $539 Bundle', source_url: ELI.pdp }],
  facts: {
    'identity.variant': f('Elitone (women, stress and mixed incontinence): Essential Kit = 1 device + 10 GelPads', 'Elitone product page', ELI.pdp),
    'pricing.price': f('$429 Essential Kit (1 device, 10 GelPads); $539 Bundle (30 GelPads); $399 Original v1 (limited time); GelPads $33 per 5', 'Elitone product page', ELI.pdp),
    'pricing.size_count': f('1 device + 10 GelPads (Essential Kit); each GelPad reusable at least 3 times', 'Elitone product page', ELI.pdp),
    'pricing.fsa_hsa': f('HSA/FSA funds accepted; Original Medicare Part B may cover with a prescription', 'Elitone product page', ELI.pdp),
    'pricing.availability': f('Sold on elitone.com (US; separate EU/UK pages); free shipping, 60-day money-back guarantee, no prescription needed', 'Elitone product page', ELI.pdp),
    'composition.ingredients': f('External wearable electrical muscle stimulator with adhesive GelPad electrodes worn around the pubic bone under clothing. Materials and latex status not published.', 'Elitone product + facts pages', ELI.facts),
    'composition.fragrance': na('Not applicable: electronic stimulator with adhesive electrodes', ELI.pdp),
    'composition.dosage': f('About 20 minutes a day at home; most users need about 6 weeks, then reduce to maintenance', 'Elitone product page', ELI.pdp),
    'safety.warnings': f('Do not use if pregnant or trying to become pregnant; with an electronic implant (pacemaker, defibrillator) or heart problems; with cancer, epilepsy or cognitive dysfunction; within 6 weeks of pelvic floor surgery; with complete pelvic floor denervation; or with urinary retention, extra-urethral or overflow incontinence. Read the full instructions for use.', 'Elitone product page', ELI.pdp),
    'safety.pregnancy': f('Brand: do not use if pregnant or trying to become pregnant.', 'Elitone product page', ELI.pdp),
    'safety.regulatory_status': f('FDA 510(k) cleared, K183585 (Feb 11, 2019); Elitone Urge cleared separately (K223884)', 'Elitone facts page + 510(k) listing', ELI.facts),
    'safety.recalls': f('No Elitone recall found in an FDA recall search.', 'FDA recalls search', 'https://www.fda.gov/safety/recalls/default.htm', 'regulatory'),
    'health.intended_use': f('At-home external pelvic floor muscle stimulation to treat stress and mixed urinary incontinence in women', 'Elitone product page', ELI.pdp),
    'evidence.sources': f([
      { title: 'Elitone 510(k) K183585', url: ELI.k, evidence_type: 'regulatory', supports: 'FDA clearance of the device' },
      { title: 'Elitone: Just the facts (manufacturer study summary)', url: ELI.facts, evidence_type: 'manufacturer', supports: 'Manufacturer-reported 6-week results: about 95% fewer leaks, 71% fewer daily leaks on average; no sample size or study link' },
    ], 'FDA 510(k) + Elitone', ELI.facts),
    'evidence.claims': f([
      { claim: 'Reduces stress urinary incontinence leaks within 6 weeks', strength: 'limited', evidence_type: 'manufacturer', source_url: ELI.facts, product_specific: true },
    ], 'Elitone', ELI.facts),
  },
};

const PIPPA = {
  starter: 'https://livlabsfitness.com/products/pippa-resistance-spring-starter-kit',
  fit: 'https://livlabsfitness.com/products/pippa-fit-kit',
  home: 'https://livlabsfitness.com/',
};
const pippa = (variant, priceFact, catalogPrice, url, extraNote, audience) => ({
  ...head('needs_clinician_review', 'unknown', `Checked livlabsfitness.com product page and home page. ${extraNote} Brand states it is safe for daily use "even during pregnancy" and during menstruation (manufacturer claim): clinician review for an internal device used in pregnancy. No FDA status, contraindications, cleaning or wear-time guidance on the pages; a clinical abstract (ICS 2026) and NIH SBIR grant are cited but the abstract could not be opened. Recall status unknown (no FDA listing found to check against).`),
  corrections: [{ field: 'pricing.price', catalog: catalogPrice, source_says: priceFact, source_url: url }],
  facts: {
    'identity.variant': f(variant, 'Liv Labs product page', url),
    'pricing.price': f(priceFact, 'Liv Labs product page', url),
    'pricing.availability': f('Sold on livlabsfitness.com', 'Liv Labs product page', url),
    'composition.ingredients': f('Platinum-catalyzed, high-purity biomedical silicone spring (made in USA), described as BPA- and microplastic-free; reusable applicator and pouch shown', 'Liv Labs product page', url),
    'safety.pregnancy': f('Manufacturer claim: safe for daily use even during pregnancy and tested for use during pregnancy and menstruation (no independent source).', 'Liv Labs product page', url),
    'safety.regulatory_status': f('Product pages do not state FDA status; silicone described as tested to medical device standards', 'Liv Labs home page', PIPPA.home),
    'health.intended_use': f(`Soft silicone spring worn internally like a tampon during exercise for passive pelvic floor engagement and as resistance for pelvic floor training. ${audience}`, 'Liv Labs home + product page', PIPPA.home),
    'evidence.sources': f([
      { title: 'Liv Labs home page (cites ICS 2026 abstract, NIH SBIR grant R44HD105574)', url: PIPPA.home, evidence_type: 'manufacturer', supports: 'Manufacturer claim of increased neuromuscular activation during exercise; study details not given' },
    ], 'Liv Labs', PIPPA.home),
    'evidence.claims': f([
      { claim: 'Boosts pelvic floor neuromuscular activation during exercise', strength: 'limited', evidence_type: 'manufacturer', source_url: PIPPA.home, product_specific: true },
    ], 'Liv Labs', PIPPA.home),
  },
});
R['p-livlabs-pippa-starter-kit'] = pippa('Pippa Resistance Spring Starter Kit (light resistance per catalog; spring count not stated on page)', '$119.00', '$99.00', PIPPA.starter, 'Catalog $99 is out of date: brand lists $119.', 'Brand says the Starter Kit suits women who have not had children and were advised to do kegels.');
R['p-livlabs-pippa-fit-kit'] = pippa('Pippa Resistance Spring Fit Kit (two spring sizes shown in images; contents not stated in text)', '$134.10 sale (regular $149.00)', '$149.00', PIPPA.fit, 'Catalog $149 is the regular price; currently on sale $134.10.', 'Brand recommends the Fit Kit for women who have had children.');

// ---------------------------------------------------------------------------
// Oboo pleasure devices (oboo.love, midlife / menopause brand)
// ---------------------------------------------------------------------------
const OBOO = {
  home: 'https://oboo.love/',
  collection: 'https://oboo.love/collections/pleasure',
  herbenick: 'https://www.sciencedaily.com/releases/2009/06/090629100643.htm',
};
const obooEntry = ({ handle, variant, price, materials, use, warnings, extraNote = '', corrections }) => {
  const url = `https://oboo.love/products/${handle}`;
  return {
    ...head(corrections ? 'needs_correction' : 'in_review', 'unknown', `Checked oboo.love product page, pleasure collection and home page. ${extraNote}Oboo publishes no FDA, FSA/HSA, latex, dimension or battery-safety details; no contraindications listed. Recall status unknown (no regulator listing found to check against).`),
    ...(corrections ? { corrections } : {}),
    facts: {
      'identity.variant': f(variant, 'Oboo product page', url),
      'identity.purchase_url': f(url, 'Oboo product page', url),
      'pricing.price': f(price, 'Oboo product page + pleasure collection', url),
      'pricing.size_count': f('1 device', 'Oboo product page', url),
      'pricing.availability': f('In stock (add to cart active) on oboo.love; ships within 1 business day in discreet packaging; 30-day Love It Guarantee (swap; see refund policy)', 'Oboo product + home page', url),
      'composition.ingredients': f(materials, 'Oboo product page', url),
      'composition.allergens': f('Brand says its toys use phthalate-free, body-safe silicone; no latex or other allergen statement found.', 'Oboo home page', OBOO.home),
      'composition.fragrance': na('Not applicable: rechargeable silicone device with no scented component', url),
      'safety.warnings': f(warnings, 'Oboo product page', url),
      'safety.regulatory_status': f('Consumer sexual wellness device; no FDA or other regulatory status stated by the brand', 'Oboo home page', OBOO.home),
      'health.intended_use': f(use, 'Oboo product page', url),
      'evidence.sources': f([
        { title: 'Herbenick et al. 2009 (J Sex Med) vibrator use among US women, news summary', url: OBOO.herbenick, evidence_type: 'ingredient_research', supports: 'About half of women surveyed had used a vibrator; users reported higher sexual function scores; 71.5% reported no side effects (cross-sectional, not this product)' },
      ], 'ScienceDaily summary of J Sex Med study', OBOO.herbenick, 'research'),
      'evidence.claims': f([
        { claim: 'Vibrator use is associated with better self-reported sexual function', strength: 'limited', evidence_type: 'ingredient_research', source_url: OBOO.herbenick, product_specific: false },
      ], 'ScienceDaily summary of J Sex Med study', OBOO.herbenick, 'research'),
    },
  };
};
const LUBE = 'Use water-based lubricant (brand recommendation). Wash with warm water and mild soap before and after use.';
R['p-oboo-woosh-warming-wand'] = obooEntry({
  handle: 'woosh',
  variant: 'Woosh Warming Wand: curved wand vibrator, 5 speeds plus self-warming setting, waterproof',
  price: '$119.00',
  materials: 'Wand vibrator with heat setting; materials not listed on the product page (brand-wide: phthalate-free body-safe silicone). Waterproof per FAQ; no IP rating.',
  use: 'Internal (G-spot) or external (clitoris and vulva) stimulation with optional warmth',
  warnings: `${LUBE} No temperature or other safety warnings published.`,
  extraNote: 'Catalog purchase link points to oboomagic.com; the live brand page is oboo.love/products/woosh. ',
  corrections: [{ field: 'identity.purchase_url', catalog: 'https://oboomagic.com/products/woosh-warming-wand', source_says: 'https://oboo.love/products/woosh', source_url: 'https://oboo.love/products/woosh' }],
});
R['p-oboo-nook'] = obooEntry({
  handle: 'nook',
  variant: 'Nook Massager: curved clitoral vibrator with pinpoint tip and broader curve, 10 modes, fully waterproof; box includes unit, USB cable, pouch',
  price: '$99.00',
  materials: 'Silicone tip and long handle; USB rechargeable (about 2 hours charge for up to 2 hours use)',
  use: 'External clitoral stimulation, including during partnered sex; not for deep internal use',
  warnings: `${LUBE} No contraindications listed.`,
});
R['p-oboo-smooch'] = obooEntry({
  handle: 'smooch',
  variant: 'Smooch Sonic Stimulator: clitoral air-pulse ("sonic") stimulator, multiple intensities, waterproof',
  price: '$79.00',
  materials: 'Curved silicone head; rechargeable (battery runtime not listed)',
  use: 'External clitoral stimulation; not for internal use',
  warnings: `${LUBE} Brand notes it is strong and focused. No contraindications listed.`,
  extraNote: 'One Oboo page showed a "Sold Out" label for Smooch while its own page and the collection show it in stock; recheck availability. ',
});
R['p-oboo-woo'] = obooEntry({
  handle: 'woo',
  variant: 'Woo Bullet: compact bullet vibrator, 7 modes, fully waterproof',
  price: '$39.00',
  materials: 'Body-safe silicone; USB rechargeable',
  use: 'External clitoral, vulva or nipple stimulation; external use only',
  warnings: `${LUBE} Designed for external use only.`,
});
R['p-oboo-shoop'] = obooEntry({
  handle: 'shoop',
  variant: 'Shoop Gentle Dual Massager: slim clitoral and G-spot vibrator with two ends, 10 modes',
  price: '$59.00 (one price block on the page showed a $47.20 sale; recheck at checkout)',
  materials: 'Soft body-safe silicone; USB charging; waterproof design per image caption (no rating)',
  use: 'Gentle, shallow internal (G-spot) or external clitoral stimulation; positioned for beginners',
  warnings: `${LUBE} Brand recommends gentle, shallow internal use.`,
});
R['p-oboo-moon'] = obooEntry({
  handle: 'moon',
  variant: 'Moon Anal Training Kit: 3 graduated silicone plugs with flared bases (largest vibrates, 7 modes, button or remote), storage pouch',
  price: '$119.00',
  materials: 'Silicone plugs with flared bases; largest plug USB rechargeable and waterproof per image caption. One caption mentions four plugs, page text says three.',
  use: 'Gradual anal training with graduated plug sizes',
  warnings: 'Water-based lubricant required. Start with the smallest plug for 10-15 minute sessions, size up gradually, and remove if you feel discomfort. Flared base for safe wear. Wash all plugs before and after use.',
});
R['p-oboo-oooh'] = obooEntry({
  handle: 'oooh',
  variant: 'Oooh Palm Massager: palm-sized clitoral vibrator, 10 patterns, flexible tip, waterproof',
  price: '$79.00',
  materials: 'Body-safe silicone; USB rechargeable',
  use: 'External clitoral stimulation; not ideal for internal use',
  warnings: `${LUBE} No contraindications listed.`,
});
R['p-oboo-groove'] = obooEntry({
  handle: 'groove',
  variant: 'Groove Dual-Action Massager: rabbit vibrator with two independent motors, flexible neck, waterproof',
  price: '$119.00',
  materials: 'Body-safe silicone; USB charging',
  use: 'Combined internal (G-spot) and external clitoral stimulation',
  warnings: `${LUBE} No contraindications listed.`,
});
R['p-oboo-boom'] = obooEntry({
  handle: 'boom',
  variant: 'Boom Dual-End Wand: double-ended wand, rounded head (external) and curved tail (internal), 5 levels per end, optional tail warmth',
  price: '$119.00 (a $95.20 sale banner also appeared; recheck at checkout)',
  materials: 'Materials and battery not listed on the product page (brand-wide: phthalate-free body-safe silicone). FAQ says waterproof, usage text says splash-safe.',
  use: 'External stimulation with the head and internal (G-spot) stimulation with the warming tail',
  warnings: `${LUBE} Waterproof vs splash-safe is inconsistent on the page; avoid submerging until confirmed.`,
});

// ---------------------------------------------------------------------------
// My Pelvic Bra (mypelvicbra.shop). Store geolocated to EUR during research;
// USD figure from the myPFM nonprofit shop page that links to the brand.
// ---------------------------------------------------------------------------
const MPB = {
  home: 'https://www.mypelvicbra.shop/',
  collection: 'https://www.mypelvicbra.shop/collections/pelvic-bra',
  classic: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE',
  sports: 'https://www.mypelvicbra.shop/products/sports-pelvic-bra%C2%AE',
  plus: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE-classic-plus',
  ext: 'https://www.mypelvicbra.shop/products/waistband-extenders',
  pfm: 'https://www.mypfm.com/shop-new/classic-pelvic-bra',
};
const mpbGarment = (url, variant, priceFact, extra = {}) => ({
  'identity.variant': f(variant, 'Pelvic Bra product page', url),
  'pricing.price': f(priceFact, 'Pelvic Bra store (shown in EUR, Spain storefront)', url),
  'pricing.size_count': f('1 garment', 'Pelvic Bra product page', url),
  'pricing.availability': f('Sold on mypelvicbra.shop (ships internationally; free shipping over $100); 30-day refund if unworn and unwashed, 10% restocking fee on refunds from Sept 15 2026', 'Pelvic Bra product page', url),
  'composition.ingredients': f('Fabric composition not published; described as breathable, high-stretch fabric with a sweat-wicking liner. No latex statement.', 'Pelvic Bra product page', url),
  'safety.warnings': f('Brand guidance: remove when sleeping, use the least compression needed for the activity, and work with a pelvic floor PT or OT. No formal contraindications listed.', 'Pelvic Bra product page', url),
  'safety.pregnancy': f('Brand: can be worn through all trimesters with the Maternity bundle (adjustable inserts); postpartum use after a self-check.', 'Pelvic Bra Classic page', MPB.classic),
  'safety.regulatory_status': f('Compression support garment; no FDA status stated by the brand', 'Pelvic Bra home page', MPB.home),
  'health.intended_use': f('Gentle compressive lift for the pelvic floor and perineum to ease heaviness, pressure, bulging, leaking or urgency during activity, pregnancy, postpartum and menopause (manufacturer description)', 'Pelvic Bra product page', url),
  'evidence.sources': f([
    { title: 'Pelvic Bra home page (manufacturer claims)', url: MPB.home, evidence_type: 'manufacturer', supports: 'Claim that 87.5% of people with heaviness/bulging had reduced heaviness while wearing it; no study or source given' },
  ], 'Pelvic Bra', MPB.home),
  'evidence.claims': f([
    { claim: 'Reduces vaginal heaviness or bulging while worn (manufacturer figure, no study cited)', strength: 'none', evidence_type: 'manufacturer', source_url: MPB.home, product_specific: true },
  ], 'Pelvic Bra', MPB.home),
  ...extra,
});
const MPB_NOTE = 'Checked mypelvicbra.shop product page, collection and home page, and the myPFM nonprofit shop page. The store showed EUR prices (Spain storefront) during research, so USD needs a recheck from a US session. No fabric composition, FDA status, FSA/HSA or care instructions published. Efficacy figure (87.5%) is unsourced. Recall status unknown (garment; no regulator listing).';
R['p-mypelvicbra-classic'] = {
  ...head('in_review', 'unknown', `${MPB_NOTE} Catalog "About $78" is close to the $79 USD shown on myPFM.`),
  facts: mpbGarment(MPB.classic, 'Classic Pelvic Bra: adjustable hook-and-eye 2-inch waistband, sizes XS-L, white or black (sizing runs large)', 'EUR 81.95 on the brand store (Spain storefront); $79 USD on the myPFM shop page', {
    'pricing.price': f('EUR 81.95 on the brand store (Spain storefront); $79 USD on the myPFM nonprofit shop page', 'Pelvic Bra store + myPFM', MPB.pfm, 'retailer'),
  }),
};
R['p-mypelvicbra-classic-plus'] = {
  ...head('in_review', 'unknown', `${MPB_NOTE} Catalog "About $87"; brand store showed EUR 91.95.`),
  facts: mpbGarment(MPB.plus, 'Classic Plus Pelvic Bra: wider front and back coverage and wider adjustable 3-inch waistband than Classic', 'EUR 91.95 on the brand store (Spain storefront); USD not shown'),
};
R['p-mypelvicbra-sports'] = {
  ...head('in_review', 'unknown', `${MPB_NOTE} Catalog $49.00; brand store showed EUR 50.95. Sport has a pull-on elastic waistband (no extenders), so it is less suited to pregnancy than Classic.`),
  facts: mpbGarment(MPB.sports, 'Sports Pelvic Bra: pull-on elastic waistband with no adjustability, sizes XS-XXL, white or black', 'EUR 50.95 on the brand store (Spain storefront); USD not shown'),
};
R['p-mypelvicbra-waistband-extenders'] = {
  ...head('in_review', 'unknown', 'Checked mypelvicbra.shop product page (EUR storefront). Sold as a set of 2 hook-on extenders in four sizes; S-series fit Classic, L-series fit Classic Plus, not interchangeable. Catalog "About $8.88"; store showed EUR 9.95. Materials not published.'),
  facts: {
    'identity.variant': f('Pelvic Bra Waistband Extenders, set of 2: S1/S2 (Classic, adds up to 4 or 8 inches) or L1/L2 (Classic Plus, adds up to 4 or 8 inches), black or white', 'Pelvic Bra product page', MPB.ext),
    'pricing.price': f('EUR 9.95 per set of 2 (Spain storefront); USD not shown', 'Pelvic Bra product page', MPB.ext),
    'pricing.size_count': f('2 extenders per set', 'Pelvic Bra product page', MPB.ext),
    'pricing.availability': f('Sold on mypelvicbra.shop; sizes marked new', 'Pelvic Bra product page', MPB.ext),
    'composition.ingredients': f('Hook-on waistband extenders; materials not published', 'Pelvic Bra product page', MPB.ext),
    'safety.warnings': f('S-series and L-series are not interchangeable; match the extender to your Pelvic Bra model. No other warnings published.', 'Pelvic Bra product page', MPB.ext),
    'safety.regulatory_status': f('Garment accessory; no regulatory status stated', 'Pelvic Bra product page', MPB.ext),
    'health.intended_use': f('Adds waistband length to a Classic or Classic Plus Pelvic Bra (for example during pregnancy or between sizes) while keeping its compression', 'Pelvic Bra product page', MPB.ext),
    'evidence.sources': f([{ title: 'Pelvic Bra Waistband Extenders product page', url: MPB.ext, evidence_type: 'manufacturer', supports: 'Fit and compatibility only; accessory with no health claim' }], 'Pelvic Bra', MPB.ext),
  },
};

// ---------------------------------------------------------------------------
// LiM Method (limmethod.com). All three were "Sold Out - Notify Me" on
// 2026-10-13, so status is unavailable until they are back in stock.
// ---------------------------------------------------------------------------
const LIM = {
  bundle: 'https://www.limmethod.com/products/the-lim-bundle-2',
  how: 'https://www.limmethod.com/pages/how-it-works',
  acc: 'https://www.limmethod.com/collections/accessories',
  shoe: 'https://www.limmethod.com/collections/accessories/products/shoe-covers',
  pad: 'https://www.limmethod.com/collections/accessories/products/kneeling-pad',
};
const LIM_FSA = (url) => f('Site banner says HSA/FSA accepted (not confirmed per item)', 'LiM Method site banner', url);
R['p-lim-method-bundle'] = {
  ...head('in_review', 'unknown', 'Checked LiM Bundle product page and How it works page. Price $199.95 matches catalog. Bundle shown Sold Out (notify me) on 2026-10-13, so marked unavailable. Page says "Final sale" but also offers 30-day returns (conflict). Pregnancy/labor and healing claims are unsourced marketing; no contraindications or FDA status published; a liability waiver is linked. Recall status unknown (fitness equipment; no regulator listing found).'),
  status: 'unavailable',
  facts: {
    'identity.variant': f('The LiM Bundle: LiM Slide sliding board (fully assembled), suede number mat, wooden stability blocks, one-size shoe covers, kneeling pad, and seven 10-minute Movement Sessions (no subscription); Shadow Gray or Cobalt Blue', 'LiM Method product page', LIM.bundle),
    'pricing.price': f('$199.95', 'LiM Method product page', LIM.bundle),
    'pricing.size_count': f('1 bundle (board 48 x 16 x 2.5 in, 9 lb, plus accessories)', 'LiM Method product page', LIM.bundle),
    'pricing.fsa_hsa': LIM_FSA(LIM.bundle),
    'pricing.availability': f('Sold out on limmethod.com (notify me) as of 2026-10-13; normally ships in 2-3 business days', 'LiM Method product page', LIM.bundle),
    'composition.ingredients': f('Sliding board of 100% recycled plastic, suede number mat, wooden blocks; made in USA. Shoe cover and kneeling pad materials not published.', 'LiM Method product page', LIM.bundle),
    'composition.fragrance': na('Not applicable: exercise equipment with no scented component', LIM.bundle),
    'composition.dosage': f('About 10 minutes of guided movement a day, 7 sessions across the week', 'LiM Method How it works page', LIM.how),
    'safety.warnings': f('No contraindications published; a Waiver of Liability is linked. Brand says it is for all life stages including pregnancy and postpartum without specific safety guidance, so check with a provider first if pregnant, postpartum or managing a pelvic floor condition.', 'LiM Method product + How it works pages', LIM.how),
    'safety.regulatory_status': f('Exercise equipment and video program; no FDA status stated', 'LiM Method product page', LIM.bundle),
    'health.intended_use': f('Low-impact sliding-board movement program to train the pelvic floor (manufacturer description)', 'LiM Method How it works page', LIM.how),
    'evidence.sources': f([
      { title: 'LiM Method: How it works (manufacturer)', url: LIM.how, evidence_type: 'manufacturer', supports: 'Program structure; "research shows" claims without named studies' },
    ], 'LiM Method', LIM.how),
    'evidence.claims': f([
      { claim: 'Consistent practice can heal incontinence and painful sex; exercise in pregnancy can mean smoother labor (manufacturer claims, no studies named)', strength: 'none', evidence_type: 'manufacturer', source_url: LIM.bundle, product_specific: true },
    ], 'LiM Method', LIM.bundle),
  },
};
const limAcc = (url, variant, use, ingredients) => ({
  ...head('in_review', 'unknown', 'Checked LiM accessories collection and product page. Price $24.99 matches catalog. Shown Sold Out (notify me) on 2026-10-13, so marked unavailable. Labeled Final sale while the site also offers 30-day returns (conflict). Accessory for the LiM board; no health claims of its own.'),
  status: 'unavailable',
  facts: {
    'identity.variant': f(variant, 'LiM Method product page', url),
    'pricing.price': f('$24.99', 'LiM Method product page', url),
    'pricing.fsa_hsa': LIM_FSA(url),
    'pricing.availability': f('Sold out on limmethod.com (notify me) as of 2026-10-13', 'LiM Method product page', url),
    'composition.ingredients': f(ingredients, 'LiM Method product page', url),
    'composition.fragrance': na('Not applicable: exercise accessory with no scented component', url),
    'safety.warnings': f('No warnings published; used with the LiM sliding board program (see the bundle waiver).', 'LiM Method product page', url),
    'safety.regulatory_status': f('Exercise accessory; no regulatory status stated', 'LiM Method product page', url),
    'health.intended_use': f(use, 'LiM Method product page', url),
    'evidence.sources': f([{ title: 'LiM Method accessory page', url, evidence_type: 'manufacturer', supports: 'Accessory purpose only; no health claim' }], 'LiM Method', url),
  },
});
R['p-lim-method-shoe-covers'] = limAcc(LIM.shoe, 'LiM Shoe Covers, one size fits all (elastic band); count per order not stated', 'Slip over shoes to glide on the LiM sliding board during pelvic floor movement sessions', 'Elastic-band shoe covers; material not published');
R['p-lim-method-kneeling-pad'] = limAcc(LIM.pad, 'LiM Kneeling Pad, one inch thick, compact', 'Extra cushioning in kneeling and low-to-the-ground positions during LiM sessions', 'Cushioned pad, one inch thick; material and dimensions not published');

// ---------------------------------------------------------------------------
// Disposable incontinence products
// ---------------------------------------------------------------------------
const INC = {
  poiseHeb: 'https://www.heb.com/product-detail/poise-ultra-thin-incontinence-pads-moderate-long-48-ct/5334502',
  dependSs: 'https://stopandshop.com/groceries/product/depend-womens-silhouette-incontinence-underwear-maximum-l-20-ct-pkg/329225',
  tenaBrand: 'https://www.tena.us/women/products/incontinence-liners-for-women/tena-sensitive-care-extra-coverage-very-light-liner',
  tenaWm: 'https://www.walmart.com/ip/796765417',
  adTarget: 'https://target.com/p/product/-/A-49109112',
  adKroger: 'https://www.kroger.com/p/p/0003700088634',
  adWm: 'https://www.walmart.com/ip/seort/44269240',
};
R['p-poise-ultra-thin-moderate'] = {
  ...head('in_review', 'unknown', 'Checked H-E-B listing (label text) for Poise Ultra Thin 4 Drop Moderate Long. Poise brand page could not be opened. Catalog $45.87 for 144 not confirmed (no 144-count listing found); H-E-B sells 48 for $14.94, about the same per pad. Recall status unknown (not searched in a regulator database).'),
  facts: {
    'identity.variant': f('Poise Ultra Thin incontinence pads, 4 Drop Moderate absorbency, Long length', 'H-E-B listing', INC.poiseHeb, 'retailer'),
    'pricing.price': f('$14.94 for 48 at H-E-B ($0.31 per pad; retailer, varies)', 'H-E-B listing', INC.poiseHeb, 'retailer'),
    'pricing.fsa_hsa': f('FSA/HSA eligible (retailer tag)', 'H-E-B listing', INC.poiseHeb, 'retailer'),
    'pricing.availability': f('Widely sold at US grocers and pharmacies (H-E-B, Stop & Shop, Giant, Walmart)', 'H-E-B listing', INC.poiseHeb, 'retailer'),
    'composition.ingredients': f('Sodium polyacrylate, polyethylene, wood pulp, polypropylene, polyester, silicone-coated paper, adhesives, colorants, printing inks, polyurethane elastics', 'H-E-B listing (label text)', INC.poiseHeb, 'retailer'),
    'safety.warnings': f('Caution: bladder control conditions may be medically treated; consult your physician.', 'H-E-B listing (label text)', INC.poiseHeb, 'retailer'),
    'health.intended_use': f('Disposable pad for women with light-to-moderate bladder leaks; odor control up to 12 hours (manufacturer)', 'H-E-B listing', INC.poiseHeb, 'retailer'),
    'evidence.claims': f([
      { claim: 'Absorbs moderate bladder leaks (4 Drop rating)', strength: 'limited', evidence_type: 'manufacturer', source_url: INC.poiseHeb, product_specific: true },
    ], 'Poise label via H-E-B', INC.poiseHeb, 'retailer'),
  },
};
R['p-depend-silhouette-underwear'] = {
  ...head('in_review', 'unknown', 'Checked Stop & Shop listing (label text) for Depend Silhouette Maximum, Large. Catalog $49.97 for 52 (2 x 26) not confirmed; Stop & Shop lists the 20 ct Large without a price. Recall status unknown.'),
  facts: {
    'identity.variant': f('Depend Silhouette women\'s incontinence underwear, Maximum absorbency, Large (40-52 in waist), pink or black', 'Stop & Shop listing', INC.dependSs, 'retailer'),
    'pricing.availability': f('Widely sold at US grocers (Stop & Shop, Giant, Martin\'s) and Walmart', 'Stop & Shop listing', INC.dependSs, 'retailer'),
    'composition.ingredients': f('Polypropylene, sodium polyacrylate, cellulose, polyethylene, polyester, spandex, calcium carbonate, plus pigments, PEG compounds and other additives', 'Stop & Shop listing (label text)', INC.dependSs, 'retailer'),
    'composition.allergens': f('No latex or allergen statement found; latex not in the listed ingredients (not a latex-free claim).', 'Stop & Shop listing', INC.dependSs, 'retailer'),
    'safety.warnings': f('Bladder incontinence may have a medically treatable cause; consult a doctor. Keep plastic bag away from babies and children (suffocation). Like most underwear it can burn if exposed to flame. Do not flush.', 'Stop & Shop listing (label text)', INC.dependSs, 'retailer'),
    'health.intended_use': f('Disposable underwear for bladder leaks, including postpartum bladder leaks', 'Stop & Shop listing', INC.dependSs, 'retailer'),
    'evidence.sources': f([{ title: 'Depend Silhouette label text (Stop & Shop)', url: INC.dependSs, evidence_type: 'manufacturer', supports: 'Materials, sizing, warnings, intended use' }], 'Stop & Shop', INC.dependSs, 'retailer'),
    'evidence.claims': f([
      { claim: 'Instantly absorbs bladder leaks (maximum absorbency)', strength: 'limited', evidence_type: 'manufacturer', source_url: INC.dependSs, product_specific: true },
    ], 'Depend label via Stop & Shop', INC.dependSs, 'retailer'),
  },
};
R['p-tena-intimates-very-light-liner'] = {
  ...head('needs_correction', 'unknown', 'Catalog name "TENA Intimates Very Light Liner" but the linked brand page is TENA Sensitive Care Extra Coverage Very Light liner (Long); the brand page does not mention "Intimates". Checked brand page and Walmart listing. Catalog $20.64 for 50 vs Walmart $9.99 (third-party seller, list $12.62). Ingredients, fragrance and warnings not published on either page. Recall status unknown.'),
  corrections: [
    { field: 'identity.name', catalog: 'TENA Intimates Very Light Liner for Women', source_says: 'TENA Sensitive Care Extra Coverage Very Light (Long) liner', source_url: INC.tenaBrand },
    { field: 'pricing.price', catalog: '$20.64 for 50', source_says: '$9.99 for 50 at Walmart (third-party seller; list $12.62)', source_url: INC.tenaWm },
  ],
  facts: {
    'identity.variant': f('TENA Sensitive Care Extra Coverage Very Light liner, Long, 50 count (also 300)', 'TENA US product page', INC.tenaBrand),
    'pricing.price': f('$9.99 for 50 at Walmart (third-party seller; list $12.62)', 'Walmart listing', INC.tenaWm, 'retailer'),
    'pricing.availability': f('Walmart (ship only, third-party seller); TENA US lists 50 and 300 packs', 'Walmart listing + TENA', INC.tenaWm, 'retailer'),
    'composition.ingredients': f('Super absorbent core with odor control; materials not published', 'TENA US product page', INC.tenaBrand),
    'health.intended_use': f('Thin liner for light bladder leaks, drips and dribbles from stress and urge incontinence; dermatologically approved by the Skin Health Alliance (brand)', 'TENA US product page', INC.tenaBrand),
    'evidence.sources': f([{ title: 'TENA Sensitive Care Extra Coverage Very Light liner page', url: INC.tenaBrand, evidence_type: 'manufacturer', supports: 'Intended use, Skin Health Alliance approval claim, pack sizes' }], 'TENA', INC.tenaBrand),
    'evidence.claims': f([
      { claim: 'Dermatologically approved by the Skin Health Alliance (manufacturer statement)', strength: 'limited', evidence_type: 'manufacturer', source_url: INC.tenaBrand, product_specific: true },
    ], 'TENA', INC.tenaBrand),
  },
};
R['p-always-discreet-boutique-liners'] = {
  ...head('in_review', 'unknown', 'Could not open the Always Discreet Boutique liner page or a Boutique-specific retail listing. Checked standard Always Discreet Very Light Long liner listings (Target, Kroger, Walmart): those are lightly scented (OdorLock), HSA/FSA eligible, about 8.5 in long, materials not published. Boutique scent, price ($12.33 for 96) and materials remain unverified. Recall status unknown.'),
  facts: {
    'pricing.fsa_hsa': f('Always Discreet incontinence liners are tagged HSA/FSA eligible at Walmart and Target (standard line; Boutique not separately confirmed)', 'Walmart listing', INC.adWm, 'retailer'),
    'pricing.availability': f('Always Discreet liners sold at Walmart, Target and Kroger', 'Retailer listings', INC.adKroger, 'retailer'),
    'safety.warnings': f('Standard Always Discreet liner pack: keep plastic bag away from babies and children (suffocation); do not flush.', 'Target listing (standard line)', INC.adTarget, 'retailer'),
    'health.intended_use': f('Thin liner for very light bladder leaks (Always Discreet line)', 'Kroger listing', INC.adKroger, 'retailer'),
  },
};

// ---------------------------------------------------------------------------
// Period underwear (catalog entries are brand-level, no single variant)
// ---------------------------------------------------------------------------
const PU = {
  wuka: 'https://web.archive.org/web/20250908030556/https://wuka.co.uk/products/stretch-cotton-midi-brief-heavy',
  tbxBlog: 'https://tomboyx.com/blogs/news/pfas-menstrual-underwear-and-the-measures-we-take',
  tbx: 'https://tomboyx.com/products/first-line-period-4-5-trunks-x-black',
  dk: 'https://www.dearkate.com/pages/faqs',
  proof: 'https://www.walmart.com/ip/Proof-Women-s-Super-Heavy-Absorbency-Brief-Period-Underwear-Black-Choose-Your-Size/5332703984',
  hanes: 'https://www.walmart.com/ip/Hanes-Women-s-Boyshort-3-Pack-Fresh-Dry-Light-Period-Underwear-Soft-Washable/781830210',
};
const PU_FRAG = (url) => na('Not applicable: reusable fabric underwear with no scented component listed', url);
R['p-wuka-underwear'] = {
  ...head('needs_correction', 'unknown', 'Catalog is brand-level. Checked WUKA UK product page for the Stretch Cotton Midi Brief Heavy as a representative style. WUKA sells in GBP from wuka.co.uk (UK; international shipping not detailed); catalog "$24-$32 per pair" not confirmed, the sampled style was GBP 19.99 on sale. Catalog "organic cotton" applies to some styles only; this style lists cotton/elastane with a polyester/polyamide/TPU middle layer. Brand says no added PFAS, independently tested. Recall status unknown.'),
  corrections: [
    { field: 'pricing.price', catalog: '$24-$32 per pair', source_says: 'GBP 19.99 (sale) for the Stretch Cotton Midi Brief Heavy on wuka.co.uk', source_url: PU.wuka },
    { field: 'composition.ingredients', catalog: 'Organic cotton, PFAS-free technology.', source_says: 'Outer 82.8% cotton/17.2% elastane; middle 80% polyester/20% polyamide + TPU; inner 95% cotton/5% elastane', source_url: PU.wuka },
  ],
  facts: {
    'identity.variant': f('Representative style: WUKA Stretch Cotton Midi Brief, Heavy flow (styles hold 5-60 ml depending on absorbency)', 'WUKA product page', PU.wuka),
    'pricing.price': f('GBP 19.99 sale for the Stretch Cotton Midi Brief Heavy (prices vary by style)', 'WUKA product page', PU.wuka),
    'pricing.size_count': f('1 pair', 'WUKA product page', PU.wuka),
    'pricing.availability': f('Sold on wuka.co.uk (UK); free international shipping over GBP 75, destinations not listed', 'WUKA product page', PU.wuka),
    'composition.ingredients': f('Outer 82.8% cotton, 17.2% elastane; middle layer 80% polyester, 20% polyamide plus TPU; inner 95% cotton, 5% elastane', 'WUKA product page', PU.wuka),
    'composition.allergens': f('No latex or allergen statement found; contains elastane, polyester, polyamide and TPU. Brand: no added PFAS, none detected by Highstreet Textile Testing Services.', 'WUKA product page', PU.wuka),
    'composition.fragrance': PU_FRAG(PU.wuka),
    'safety.warnings': f('Rinse cold after use, wash at 30C inside out, no fabric conditioner, air dry only (no tumble dryer).', 'WUKA product page (care)', PU.wuka),
    'health.intended_use': f('Reusable absorbent underwear for periods (heavy and super heavy styles also suggested for incontinence)', 'WUKA product page', PU.wuka),
  },
};
R['p-tomboyx-period'] = {
  ...head('in_review', 'unknown', 'Catalog is brand-level. Checked TomboyX First Line Period 4.5" Trunks page and TomboyX PFAS article. Trunks $34 matches the top of catalog range ($28-$34). Brand says an unnamed independent lab found no PFAS in First Line materials and almost all products are OEKO-TEX Standard 100 certified. Recall status unknown.'),
  facts: {
    'identity.variant': f('Representative style: First Line Period 4.5" Trunks (holds up to 4-5 regular tampons), sizes 3XS-6X', 'TomboyX product page', PU.tbx),
    'pricing.price': f('$34.00 for First Line Period 4.5" Trunks', 'TomboyX product page', PU.tbx),
    'pricing.size_count': f('1 pair', 'TomboyX product page', PU.tbx),
    'pricing.availability': f('Sold on tomboyx.com; some sizes sold out (notify me)', 'TomboyX product page', PU.tbx),
    'composition.ingredients': f('Main 95% cotton, 5% spandex; gusset 89% polyester, 11% spandex; inner floating gusset 91% polyester, 9% spandex (twill top, terry absorbent middle, water-resistant cotton shell)', 'TomboyX product page + PFAS article', PU.tbx),
    'composition.allergens': f('No latex statement found. Brand: PFAS-free (independent lab, unnamed) and OEKO-TEX Standard 100 certified.', 'TomboyX PFAS article', PU.tbxBlog),
    'composition.fragrance': PU_FRAG(PU.tbx),
    'safety.warnings': f('Brand suggests a backup liner or pad on heaviest days. Wash cold, tumble dry low; avoid high heat and fabric softener.', 'TomboyX product page', PU.tbx),
    'health.intended_use': f('Reusable absorbent period underwear', 'TomboyX product page', PU.tbx),
    'evidence.claims': f([
      { claim: 'Absorbs up to 4-5 regular tampons of flow (manufacturer)', strength: 'limited', evidence_type: 'manufacturer', source_url: PU.tbx, product_specific: true },
      { claim: 'Tested PFAS-free by an independent lab (manufacturer, lab not named)', strength: 'limited', evidence_type: 'manufacturer', source_url: PU.tbxBlog, product_specific: true },
    ], 'TomboyX', PU.tbx),
  },
};
R['p-dear-kate-underwear'] = {
  ...head('in_review', 'unknown', 'Catalog is brand-level. Checked Dear Kate FAQ. Brand: 100% fabric, no plastic film or latex; not leak proof and designed as backup to a tampon, cup or pad; fully lined pairs hold up to 3 tsp. PFAS-free per supplier certifications (no independent lab results cited). Prices not on the FAQ, so catalog $32-$38 unverified. Recall status unknown.'),
  facts: {
    'identity.variant': f('Brand-level: Dear Kate Underlux-lined underwear (mini-lined up to 1 tsp, fully lined up to 3 tsp)', 'Dear Kate FAQ', PU.dk),
    'pricing.availability': f('Sold on dearkate.com; free US shipping over $50, multi-pack discounts', 'Dear Kate FAQ', PU.dk),
    'composition.ingredients': f('Outer body 74% nylon, 26% lycra; inner gusset 90% micro-polyester, 10% spandex; three-layer Underlux lining, no plastic film', 'Dear Kate FAQ', PU.dk),
    'composition.allergens': f('Brand: contains no plastic, film or latex; lining free of PFAS, PFOA, PFOS, phthalates, DMF, BPA and APEO per supplier certifications.', 'Dear Kate FAQ', PU.dk),
    'composition.fragrance': PU_FRAG(PU.dk),
    'safety.warnings': f('Not leak proof and not designed for heavy flow; use as backup to a tampon, cup or pad. Avoid fabric softener and dryer sheets.', 'Dear Kate FAQ', PU.dk),
    'health.intended_use': f('Backup protection for periods, daily discharge and light bladder leaks', 'Dear Kate FAQ', PU.dk),
    'evidence.claims': f([
      { claim: 'PFAS-free lining (supplier certifications, no independent lab cited)', strength: 'limited', evidence_type: 'manufacturer', source_url: PU.dk, product_specific: true },
    ], 'Dear Kate', PU.dk),
  },
};
R['p-proof-period'] = {
  ...head('needs_correction', 'unknown', 'Catalog is brand-level with no purchase link. Walmart lists the brand as "Proof. by Always" (Super Heavy brief holds up to 7 regular tampons). No fabric breakdown, PFAS statement or price on the listing; catalog "$20-$40" and "PFAS-free absorbent" unverified. Recall status unknown.'),
  corrections: [
    { field: 'identity.brand', catalog: 'Proof (proof.co)', source_says: 'Listed as "Proof. by Always" at Walmart', source_url: PU.proof },
    { field: 'composition.ingredients', catalog: 'Cotton, PFAS-free absorbent.', source_says: 'No PFAS statement or fabric breakdown on the retailer listing', source_url: PU.proof },
  ],
  facts: {
    'identity.variant': f('Representative style: Proof. by Always brief, Super Heavy absorbency (holds up to 7 regular tampons)', 'Walmart listing', PU.proof, 'retailer'),
    'pricing.availability': f('Sold at Walmart', 'Walmart listing', PU.proof, 'retailer'),
    'composition.fragrance': PU_FRAG(PU.proof),
    'safety.warnings': f('Machine wash cold, delicate; tumble dry low or hang dry. No other warnings listed.', 'Walmart listing (care)', PU.proof, 'retailer'),
    'health.intended_use': f('Reusable absorbent period underwear', 'Walmart listing', PU.proof, 'retailer'),
  },
};
R['p-hanes-period'] = {
  ...head('in_review', 'unknown', 'Catalog is brand-level. Checked Walmart listing for Hanes Fresh & Dry Light boyshort 3-pack (light = about two regular tampons). Price not shown (unavailable online at check), fabric composition and PFAS statement not listed. Catalog "$12-$16 per pair" unverified. Recall status unknown.'),
  facts: {
    'identity.variant': f('Representative style: Hanes Fresh & Dry Light period boyshort, 3-pack (absorbs about two regular tampons)', 'Walmart listing', PU.hanes, 'retailer'),
    'pricing.size_count': f('3 pairs per pack', 'Walmart listing', PU.hanes, 'retailer'),
    'pricing.availability': f('Listed at Walmart but online price showed Not Available on 2026-10-13', 'Walmart listing', PU.hanes, 'retailer'),
    'composition.fragrance': PU_FRAG(PU.hanes),
    'safety.warnings': f('Rinse in cold water until clear; machine wash cold; do not soak, bleach or use fabric softener; tumble dry low inside out; do not iron.', 'Walmart listing (care)', PU.hanes, 'retailer'),
    'health.intended_use': f('Reusable period underwear for light flow', 'Walmart listing', PU.hanes, 'retailer'),
  },
};

export default R;

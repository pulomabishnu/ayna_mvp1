// Research pass 3 (AI-assisted, sourced). See ../reviews.js for the format.
// Batch 3: period products (pads, tampons, cups, discs, underwear), pelvic
// floor devices and digital services (trackers, telehealth, mental health).
// Every fact names the page it came from. Facts we could not find are left
// out on purpose (unknown, never "no").

const D = '2026-10-13';
const BY = 'ayna research pass (AI-assisted), needs human sign-off';
const PRICE_DUE = '2026-10-27'; // pricing refresh: 14 days
const SAFETY_DUE = '2027-01-11'; // safety refresh: 90 days (services without a sourced price)

/** One sourced fact. */
const f = (value, source, source_url, source_type = 'brand') => ({ value, source, source_url, source_type, verified_at: D });

/** Shared header for every entry. */
const head = (qa_status, recall_status, notes, due = PRICE_DUE) => ({
  qa_status,
  reviewed_by: BY,
  reviewed_at: D,
  last_checked: D,
  next_review_due: due,
  recall_status,
  notes,
});

// Shared regulator sources
const FDA = {
  tampons: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons',
  pads: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners',
  cups: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups',
  padReg: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-884/subpart-F/section-884.5435',
  cupReg: 'https://www.law.cornell.edu/cfr/text/21/884.5400',
};

// Reusable regulator facts per product type
const padFacts = {
  'safety.warnings': f('FDA: change pads every few hours, even on light days, and more often with heavy flow; wearing a pad too long may irritate skin; stop using and contact a provider if itching, rash, pain, swelling or discomfort occurs.', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
  'safety.side_effects': f('FDA: possible skin irritation; some people react to scents, deodorants or other added materials.', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
};
const unscentedPadReg = f('FDA medical device. Unscented menstrual pads are Class I (general controls), exempt from premarket notification when made of common cellulosic and synthetic materials (21 CFR 884.5435).', 'eCFR 21 CFR 884.5435', FDA.padReg, 'regulatory');
const padIntendedUse = f('Disposable external pad to absorb menstrual flow', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory');
const padEvidence = {
  'evidence.sources': f([
    { title: 'FDA: Menstrual Pads and Liners', url: FDA.pads, evidence_type: 'regulatory', supports: 'How pads are regulated and safe-use advice' },
    { title: 'eCFR 21 CFR 884.5435 (unscented menstrual pad)', url: FDA.padReg, evidence_type: 'regulatory', supports: 'Device classification' },
  ], 'FDA', FDA.pads, 'regulatory'),
};

const tamponFacts = {
  'safety.warnings': f('FDA: change tampons every 4 to 8 hours and never wear one longer than 8 hours; use the lowest absorbency needed; use only during a period; stop if signs of allergic reaction. TSS signs (sudden high fever, chills, vomiting, diarrhea, rash, dizziness or fainting): remove the tampon and get care right away.', 'FDA: Tampons', FDA.tampons, 'regulatory'),
  'safety.side_effects': f('Rare but serious toxic shock syndrome (TSS); allergic reaction possible.', 'FDA: Tampons', FDA.tampons, 'regulatory'),
  'safety.regulatory_status': f('FDA medical device; tampons need FDA authorization (510(k)) before sale (21 CFR 884.5470 unscented).', 'FDA: Tampons', FDA.tampons, 'regulatory'),
  'health.intended_use': f('Single-use internal tampon to absorb menstrual flow, for use only during a period', 'FDA: Tampons', FDA.tampons, 'regulatory'),
  'evidence.sources': f([
    { title: 'FDA: Tampons (Menstrual Product Options, Facts, and Safe Use)', url: FDA.tampons, evidence_type: 'regulatory', supports: 'Regulation, TSS warning signs, safe-use advice, FDA metals study (trace metals released too small to cause harm)' },
  ], 'FDA', FDA.tampons, 'regulatory'),
  'evidence.claims': f([
    { claim: 'Using the lowest absorbency and changing every 4 to 8 hours lowers TSS risk', strength: 'strong', evidence_type: 'regulatory', source_url: FDA.tampons, product_specific: false },
  ], 'FDA', FDA.tampons, 'regulatory'),
};

const cupFacts = {
  'safety.warnings': f('FDA: wash hands and the cup before use, clean reusable cups after each use and boil 1 to 2 minutes at the end of the cycle; empty every 8 to 12 hours per instructions; talk to a gynecologist first if you have an IUD; not for non-period bleeding (infection, after pregnancy or childbirth). Stop and contact a provider if itching, rash, pain, swelling or discomfort.', 'FDA: Menstrual Cups', FDA.cups, 'regulatory'),
  'safety.side_effects': f('FDA: itching, rash, pain, swelling or discomfort are possible.', 'FDA: Menstrual Cups', FDA.cups, 'regulatory'),
  'safety.regulatory_status': f('FDA medical device. Menstrual cups are Class II (special controls), exempt from 510(k) premarket notification (21 CFR 884.5400); FDA treats discs under the same menstrual cup guidance.', 'Cornell LII 21 CFR 884.5400 + FDA', FDA.cupReg, 'regulatory'),
  'evidence.sources': f([
    { title: 'FDA: Menstrual Cups', url: FDA.cups, evidence_type: 'regulatory', supports: 'Regulation, cleaning, wear time, IUD caution, side effects' },
    { title: '21 CFR 884.5400 (menstrual cup)', url: FDA.cupReg, evidence_type: 'regulatory', supports: 'Class II, 510(k) exempt' },
  ], 'FDA', FDA.cups, 'regulatory'),
};

const R = {
  'p-always-infinity': {
    ...head('needs_correction', 'none_found', 'Catalog does not say which Infinity size; "$8 for 18" matches the Size 1 Regular 18 ct, but the catalog tags heavy flow. Label ingredients (Giant listing) are a polyacrylate foam core plus synthetics; no wood pulp is listed, so the catalog material list is wrong. Retailer price seen: Walmart $9.24 for Size 2, 16 ct. Web search found no FDA recall for Always Infinity (only advocacy campaigns about chemical testing).'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Polyethylene, polypropylene, wood pulp, adhesive', source_says: 'Polyacrylate foam, polyethylene, polypropylene, polyester and other synthetic copolymers, titanium dioxide, petrolatum, mineral oil, zinc oxide, glycerin (no wood pulp listed)', source_url: 'https://giantfoodstores.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989' },
      { field: 'identity.variant', catalog: 'unspecified size, tagged heavy flow, $8 for 18', source_says: '18 ct is the Size 1 Regular Flow with wings; heavier sizes come in other counts (e.g. Size 3 Extra Heavy 14 ct)', source_url: 'https://giantfoodstores.com/groceries/product/always-infinity-flex-foam-size-3-unscented-extra-heavy-flow-pads-w-wings-14-ct-box/239948' },
    ],
    facts: {
      'identity.brand': f('Always (Procter & Gamble)', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989', 'retailer'),
      'identity.variant': f('Always Infinity FlexFoam Size 1, Regular Flow, unscented, with wings, 18 count (assumed from catalog count)', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989', 'retailer'),
      'pricing.price': f('Walmart $9.24 for Size 2, 16 ct (out of stock when checked); 18 ct price not shown on Giant listing', 'Walmart listing', 'https://www.walmart.com/ip/19725583', 'retailer'),
      'pricing.size_count': f('18 pads (Size 1 Regular); other sizes 14 to 28 ct', 'Giant / Food Lion listings', 'https://giantfoodstores.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989', 'retailer'),
      'pricing.availability': f('Grocers and mass retailers (Giant, Stop & Shop, Food Lion, Hannaford, Walmart)', 'Retailer listings', 'https://stopandshop.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989', 'retailer'),
      'composition.ingredients': f('Polyacrylate foam, polyethylene, butene/propylene copolymer, polypropylene, polyester, methylbutene/methylstyrene/piperylene copolymer, polybutene, calcium chloride, ethylene/VA copolymer, styrene/isoprene copolymer, hydrocarbon resin, titanium dioxide, petrolatum, mineral oil, behenyl alcohol, zinc oxide, phosphoric acid alkyl esters potassium salts, glycerin', 'Giant Food listing (label text)', 'https://giantfoodstores.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989', 'retailer'),
      'composition.fragrance': f('Unscented / fragrance free (this variant)', 'Giant Food listing', 'https://giantfoodstores.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989', 'retailer'),
      'composition.allergens': f('Manufacturer says hypoallergenic and dermatologist approved; elemental chlorine free. No allergen list on label.', 'Giant Food listing (manufacturer claims)', 'https://giantfoodstores.com/groceries/product/always-infinity-size-1-unscented-regular-flow-pads-with-wings-18-ct-pkg/156989', 'retailer'),
      ...padFacts,
      'safety.regulatory_status': unscentedPadReg,
      'safety.recalls': f('No FDA recall found for Always Infinity in a web search (Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
    },
  },

  'p-rael-organic-pad': {
    ...head('needs_correction', 'none_found', 'Checked Target listing (via withsilver mirror) and well.ca. Only the cotton cover is stated as organic (OCS certified); the core and back sheet materials are not named on the page found, so catalog materials are unverified. Rael settled a 2021 class action (C.D. Cal. 8:21-cv-01386, $1.5M, final approval Dec 2022) alleging "organic cotton" labeling while products contained synthetics; not a recall. No FDA recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: '100% certified organic cotton top sheet, wood pulp core, bio-PE back sheet, natural adhesive', source_says: 'Listing names only an OCS-certified organic cotton cover; core and back sheet materials not stated', source_url: 'https://products.withsilver.app/tcin/75664184-Rael-Organic-Cotton-Cover-Pads-Regular-14-Count' },
    ],
    facts: {
      'identity.brand': f('Rael', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/75664184-Rael-Organic-Cotton-Cover-Pads-Regular-14-Count', 'retailer'),
      'identity.variant': f('Rael Organic Cotton Cover Pads, Regular, unscented, 14 count', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/75664184-Rael-Organic-Cotton-Cover-Pads-Regular-14-Count', 'retailer'),
      'pricing.price': f('About $6.99 to $11.88 for 14 at Target (listings vary)', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/75664184-Rael-Organic-Cotton-Cover-Pads-Regular-14-Count', 'retailer'),
      'pricing.size_count': f('14 pads', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/75664184-Rael-Organic-Cotton-Cover-Pads-Regular-14-Count', 'retailer'),
      'pricing.availability': f('Target, Publix, Vitacost, iHerb and other retailers', 'Retailer listings', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leaklocker-large-14-count-89892', 'retailer'),
      'composition.ingredients': f('OCS-certified organic cotton cover, chlorine free; absorbent core and back sheet materials not stated on the listing', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/75664184-Rael-Organic-Cotton-Cover-Pads-Regular-14-Count', 'retailer'),
      'composition.allergens': f('Manufacturer says hypoallergenic. No allergen list found.', 'Target listing (manufacturer claim)', 'https://products.withsilver.app/tcin/75664184-Rael-Organic-Cotton-Cover-Pads-Regular-14-Count', 'retailer'),
      ...padFacts,
      'safety.regulatory_status': unscentedPadReg,
      'safety.recalls': f('No recall found. A 2021 false-advertising class action over "organic cotton" labeling settled for $1.5M (final approval Dec 2022); not a safety recall.', 'Lawfold summary of Gregory v. Rael', 'https://lawfold.com/rael-lawsuit-2026/', 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
    },
  },

  'p-honeypot-pad': {
    ...head('needs_correction', 'none_found', 'Checked H-E-B listing (label text). Herbal pads contain a cooling infusion with menthol, menthyl lactate, borneol, camphor, corn mint oil, lavender oil and fragrance-type terpenes (linalool, limonene); the catalog lists only lavender, peppermint and aloe, and "plant-derived fiber" (label: organic cotton top sheet, wood pulp, polyethylene, polypropylene, sodium polyacrylate). Pads with added botanicals may not fit the Class I unscented pad category; regulatory class not confirmed. A 2024 class action (Tucker v. Honey Pot, N.D. Cal. 24-cv-7911) over "plant-derived" claims was voluntarily dismissed. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Plant-derived fiber, lavender oil, peppermint oil, aloe extract, wood pulp core', source_says: 'Organic cotton top sheet, chlorine-free wood pulp, polyethylene, hot melt adhesive, calcium carbonate, polypropylene, sodium polyacrylate, PE/PET leak guard; infusion of rose water, menthyl lactate, menthol, borneol, corn mint oil, aloe juice, lavender oil, houttuynia extract, camphor, linalool, limonene and other terpenes', source_url: 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047' },
    ],
    facts: {
      'identity.brand': f('The Honey Pot Company', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'identity.variant': f('Cooling Herbal Infusion pads with wings (regular/overnight duo), 16 count', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'pricing.price': f('$8.99 for 16 at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'pricing.size_count': f('16 pads', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'pricing.fsa_hsa': f('Listed as FSA/HSA eligible at H-E-B', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'pricing.availability': f('H-E-B, Walmart, Mariano\'s, Vitacost and other retailers', 'Retailer listings', 'https://www.marianos.com/p/honey-pot-100-organic-cotton-cover-cooling-herbal-infusion-heavy-flow-overnight-pads-16-count/0085166900860', 'retailer'),
      'composition.ingredients': f('Pad: chlorine-free wood pulp, certified organic cotton top sheet, polyethylene, hot melt adhesive, calcium carbonate, polypropylene, sodium polyacrylate, PE/PET nonwoven leak guard. Infusion: rose flower water, menthyl lactate, menthol, borneol, corn mint leaf oil, aloe leaf juice, lavender oil, houttuynia cordata extract, menthone, menthyl acetate, linalyl acetate, linalool, beta-caryophyllene, camphor, limonene, pinene, terpineol', 'H-E-B listing (label text)', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'composition.active_ingredients': f(['Menthol and menthyl lactate (cooling)', 'Corn mint leaf oil', 'Lavender oil', 'Aloe leaf juice'], 'H-E-B listing (label text)', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'composition.fragrance': f('No "fragrance" ingredient listed, but contains aromatic essential oils and scent compounds (lavender oil, linalool, limonene, camphor)', 'H-E-B listing (label text)', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      ...padFacts,
      'safety.recalls': f('No recall found. A 2024 class action over "plant-derived" marketing (Tucker v. The Honey Pot Co., N.D. Cal.) was voluntarily dismissed.', 'Truth in Advertising class action tracker', 'https://truthinadvertising.org/class-action/the-honey-pot-company-feminine-care-products/?pg=17', 'regulatory'),
      'health.intended_use': f('Disposable pad for menstrual flow with a cooling herbal layer (manufacturer information)', 'H-E-B listing', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
      'evidence.sources': f([
        { title: 'FDA: Menstrual Pads and Liners', url: FDA.pads, evidence_type: 'regulatory', supports: 'Safe-use advice; some people react to scents or added materials' },
      ], 'FDA', FDA.pads, 'regulatory'),
      'evidence.claims': f([
        { claim: 'Herbal cooling infusion soothes period discomfort', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', product_specific: true },
      ], 'H-E-B listing (manufacturer claim)', 'https://www.heb.com/product-detail/the-honey-pot-herbal-duo-pack-regular-overnight-pads-with-wings/16106047', 'retailer'),
    },
  },

  'p-lola-tampon': {
    ...head('needs_correction', 'none_found', 'Checked LOLA product page (Compact Plastic Applicator Tampons; the "regular-18-count" URL now lands there). LOLA sells 16 per purchase option ($11 one-time, $10 subscription), not 18; string has refined paraffin wax. LOLA says FDA 510(k) cleared. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$10 for 18', source_says: '$11 one-time or $10 subscription for 16 tampons', source_url: 'https://mylola.com/collections/best-sellers/products/applicator-tampons' },
      { field: 'composition.ingredients', catalog: '100% organic cotton (tampon and string), BPA-free plastic applicator', source_says: '100% organic cotton tampon and string, string has refined paraffin wax, BPA-free plastic applicator', source_url: 'https://mylola.com/collections/best-sellers/products/applicator-tampons' },
    ],
    facts: {
      'identity.variant': f('LOLA Compact Plastic Applicator Tampons (Light, Regular, Super, Super+ available)', 'LOLA product page', 'https://mylola.com/collections/best-sellers/products/applicator-tampons'),
      'identity.purchase_url': f('https://mylola.com/collections/best-sellers/products/applicator-tampons', 'LOLA product page', 'https://mylola.com/collections/best-sellers/products/applicator-tampons'),
      'pricing.price': f('$11 one-time or $10/month subscription for 16 tampons ($19.50 for 32, $28.50 for 48 on subscription)', 'LOLA product page', 'https://mylola.com/collections/best-sellers/products/applicator-tampons'),
      'pricing.size_count': f('16 tampons per purchase option', 'LOLA product page', 'https://mylola.com/collections/best-sellers/products/applicator-tampons'),
      'pricing.availability': f('LOLA website, ships to the 48 contiguous US states; also sold at Walmart', 'LOLA product page', 'https://mylola.com/products/regular-18-count'),
      'composition.ingredients': f('100% organic cotton tampon and string; string uses refined paraffin wax; BPA-free plastic applicator', 'LOLA product page', 'https://mylola.com/collections/best-sellers/products/applicator-tampons'),
      'composition.fragrance': f('Made without fragrance (brand statement)', 'LOLA product page', 'https://mylola.com/collections/best-sellers/products/applicator-tampons'),
      'composition.allergens': f('Brand says hypoallergenic and made without latex, dyes and chemical additives', 'LOLA product page', 'https://mylola.com/collections/best-sellers/products/applicator-tampons'),
      ...tamponFacts,
      'safety.regulatory_status': f('FDA medical device; LOLA states the tampons are FDA 510(k) cleared.', 'LOLA product page + FDA', FDA.tampons, 'regulatory'),
      'safety.recalls': f('No recall found for LOLA tampons (web search, Oct 2026).', 'Web recall search', FDA.tampons, 'regulatory'),
    },
  },
  'p-saalt-cup': {
    ...head('needs_correction', 'none_found', 'Checked Saalt product page. Price is now $32 (catalog $29). Sizes: Small (25 ml), Regular (30 ml), Teen (15 ml); catalog does not say which size. Brand says 100% medical-grade silicone, FDA registered, made in the USA, up to 10 years and up to 12 hours wear. Brand page has no TSS or IUD warning; FDA advice used for warnings. "USP Class VI" in the catalog was not stated on the page. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$29', source_says: '$32', source_url: 'https://saalt.com/products/saalt-cup' },
    ],
    facts: {
      'identity.brand': f('Saalt', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'identity.variant': f('Saalt Cup; sizes Small (25 ml), Regular (30 ml) and Teen (15 ml); catalog size unspecified', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'identity.purchase_url': f('https://saalt.com/products/saalt-cup', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'pricing.price': f('$32', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'pricing.size_count': f('1 reusable cup, up to 10 years with proper care (brand)', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'pricing.availability': f('Saalt website (free US shipping over $79); also sold by other retailers', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'composition.ingredients': f('100% medical-grade silicone (brand)', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'composition.allergens': f('Brand says BPA-free and latex-free', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'composition.dosage': f('Wear up to 12 hours; empty and clean at least every 12 hours (brand)', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      ...cupFacts,
      'safety.recalls': f('No recall found for Saalt cups (web search, Oct 2026).', 'Web recall search', FDA.cups, 'regulatory'),
      'safety.age_restriction': f('Brand suggests the Small size for first-time users 18 and older and sells a separate Teen size', 'Saalt product page', 'https://saalt.com/products/saalt-cup'),
      'health.intended_use': f('Reusable internal cup to collect menstrual flow', 'Cornell LII 21 CFR 884.5400', FDA.cupReg, 'regulatory'),
    },
  },

  'p-saalt-cup-steamer': {
    ...head('in_review', 'none_found', 'Checked Saalt launch post and Period Nirvana listing. $39 matches. Steam cycle about 1 to 4 minutes plus cooling (sources give 3-4 and 6-7 minutes total); brand says testing found it as clean as boiling (no data shown). Materials not listed beyond BPA-free packaging; electrical specs page exists on saalt.com but was not read. Some retailer reviewers report units failing after months. No recall found.'),
    facts: {
      'identity.variant': f('Saalt Steamer for menstrual cups and discs (colors: Arctic Mist/White, Rose Quartz, Blue Dusk)', 'Saalt blog launch post', 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer'),
      'pricing.price': f('$39', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/all/products/saalt-steamer', 'retailer'),
      'pricing.size_count': f('1 steamer with 3 ft power cord (cup not included)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/all/products/saalt-steamer', 'retailer'),
      'pricing.availability': f('Saalt website and cup retailers; sold out at Period Nirvana when checked', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/all/products/saalt-steamer', 'retailer'),
      'composition.dosage': f('Fill basin with water, add one cup or disc, flip the switch; steaming about 1 to 3 minutes, 6 to 8 minutes including cool-down; cool the steamer one hour between uses', 'Saalt blog launch post', 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer'),
      'safety.warnings': f('Steam one product at a time; let the steamer cool one hour between uses; cup and steamer may be hot after the cycle, wait before handling', 'Saalt blog launch post', 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer'),
      'safety.recalls': f('No recall found for the Saalt Steamer (web search, Oct 2026).', 'Web recall search', 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer'),
      'health.intended_use': f('Steam sanitizer for reusable menstrual cups and discs, between periods', 'Saalt blog launch post', 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer'),
      'evidence.sources': f([
        { title: 'FDA: Menstrual Cups (cleaning advice: boil 1 to 2 minutes at end of cycle)', url: FDA.cups, evidence_type: 'regulatory', supports: 'Reusable cups need cleaning; FDA names boiling, not steaming' },
        { title: 'Saalt Steamer launch post', url: 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer', evidence_type: 'manufacturer', supports: 'Brand says its testing found steaming as clean as boiling' },
      ], 'FDA + Saalt', FDA.cups, 'regulatory'),
      'evidence.claims': f([
        { claim: 'Steaming sanitizes a cup as well as boiling', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer', product_specific: true },
      ], 'Saalt blog', 'https://saalt.com/blogs/news/available-for-pre-order-now-the-saalt-steamer'),
    },
  },

  'p-flex-disc': {
    ...head('needs_correction', 'none_found', 'Checked Flex product page and Giant listing (label text). Catalog says "hypoallergenic adhesive rim"; the disc has no adhesive (polymer blend, mineral oil, carbon black rim color, stabilizer). Disposable 12 ct is $16.49 on flexfits.com. Label: single use, do not use if you have ever had TSS, not birth control, no STI protection. Reusable $35 price not checked. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Medical-grade polymer body, hypoallergenic adhesive rim', source_says: 'Medical-grade polymer blend, mineral oil, <2% carbon black (rim color), <1% antioxidant polymer stabilizer; no adhesive', source_url: 'https://flexfits.com/collections/period-care/products/flex-disc' },
    ],
    facts: {
      'identity.brand': f('Flex (The Flex Company)', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'identity.variant': f('Flex Disc, disposable, 12 count', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'identity.purchase_url': f('https://flexfits.com/collections/period-care/products/flex-disc', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'pricing.price': f('$16.49 for 12 disposable discs', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'pricing.size_count': f('12 discs (also 6 ct boxes at retail, 24 ct option)', 'Flex product page + Giant listing', 'https://giantfoodstores.com/groceries/product/flex-period-discs-6-ct-box/399309'),
      'pricing.fsa_hsa': f('FSA/HSA eligible (brand)', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'pricing.availability': f('flexfits.com, Giant, Hannaford, H-E-B, CVS and other retailers', 'Retailer listings', 'https://www.heb.com/product-detail/flex-period-discs/2816511', 'retailer'),
      'composition.ingredients': f('Medical-grade polymer blend, mineral oil, under 2% carbon black (rim color), under 1% antioxidant polymer stabilizer; brand says ISO 10993 tested', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'composition.allergens': f('Brand says not made with BPA, phthalates or natural rubber latex', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'composition.dosage': f('Single use; wear up to 12 hours; pinch, insert and tuck behind the pubic bone', 'Giant listing (label directions)', 'https://giantfoodstores.com/groceries/product/flex-period-discs-6-ct-box/399309', 'retailer'),
      'safety.warnings': f('Label: single use only; do not use if you have ever had TSS; not birth control; does not protect against STIs; read instructions before use. FDA: talk to a gynecologist first if you have an IUD.', 'Giant listing (label) + FDA', 'https://giantfoodstores.com/groceries/product/flex-period-discs-6-ct-box/399309', 'retailer'),
      'safety.side_effects': cupFacts['safety.side_effects'],
      'safety.regulatory_status': cupFacts['safety.regulatory_status'],
      'safety.recalls': f('No recall found for Flex discs (web search, Oct 2026).', 'Web recall search', FDA.cups, 'regulatory'),
      'health.intended_use': f('Disposable internal disc that collects menstrual flow', 'Flex product page', 'https://flexfits.com/collections/period-care/products/flex-disc'),
      'evidence.sources': cupFacts['evidence.sources'],
    },
  },

  'p-thinx': {
    ...head('needs_correction', 'none_found', 'Catalog does not name a style; checked the Hiphugger (Moderate) on Carewell. Hiphugger body is 84% polyamide / 16% elastane with a polyester gusset, not an organic cotton gusset (Thinx also sells cotton styles). Catalog "PFAS-free" overstates: in the 2023 class action settlement (S.D.N.Y., up to $5M, no admission of wrongdoing) Thinx committed to no intentionally added PFAS. Period underwear is not covered by a specific FDA classification on FDA pages found. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Organic cotton gusset, ... PFAS-free', source_says: 'Hiphugger: 84% polyamide, 16% elastane body, 100% polyester gusset; Thinx committed to no intentionally added PFAS (settlement), not PFAS-free testing', source_url: 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency' },
    ],
    facts: {
      'identity.brand': f('Thinx', 'Carewell listing', 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency', 'retailer'),
      'identity.variant': f('Thinx Hiphugger, Moderate absorbency (up to 3 regular tampons) as reference style; catalog style unspecified', 'Carewell listing', 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency', 'retailer'),
      'pricing.price': f('$29.68 per pair (Hiphugger, Carewell)', 'Carewell listing', 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency', 'retailer'),
      'pricing.size_count': f('1 pair', 'Carewell listing', 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency', 'retailer'),
      'pricing.fsa_hsa': f('Listed as FSA & HSA eligible', 'Carewell listing', 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency', 'retailer'),
      'pricing.availability': f('Thinx website, Carewell, Walmart (Thinx for All line) and others', 'Retailer listings', 'https://www.walmart.com/ip/483440105', 'retailer'),
      'composition.ingredients': f('Hiphugger: body 84% polyamide, 16% elastane; gusset 100% polyester', 'Carewell listing', 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency', 'retailer'),
      'composition.dosage': f('Moderate holds up to 3 regular tampons worth per wear; machine wash cold, hang dry', 'Carewell listing', 'https://carewell.com/product/thinx-hiphugger-period-protective-underwear-dusk-moderate-absorbency', 'retailer'),
      'safety.warnings': f('FDA: do not reuse period underwear longer than the manufacturer recommends; stop and contact a provider if itching, rash, pain, swelling or discomfort.', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      'safety.recalls': f('No recall found. 2023 class action over PFAS marketing settled (up to $5M, no admission of wrongdoing); Thinx agreed PFAS will not be intentionally added and to disclose antimicrobial treatments.', 'WHYY/NPR report on the settlement', 'https://whyy.org/npr-story/thinx-lawsuit-pfas-chemicals-period-underwear/', 'regulatory'),
      'health.intended_use': f('Reusable absorbent underwear for menstrual flow', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      'evidence.sources': f([
        { title: 'NPR/WHYY: Thinx PFAS settlement', url: 'https://whyy.org/npr-story/thinx-lawsuit-pfas-chemicals-period-underwear/', evidence_type: 'regulatory', supports: 'Settlement terms; no intentionally added PFAS commitment' },
        { title: 'FDA: Menstrual Pads and Liners', url: FDA.pads, evidence_type: 'regulatory', supports: 'Reuse and irritation advice for period underwear' },
      ], 'NPR + FDA', FDA.pads, 'regulatory'),
    },
  },
  'd-clue': {
    ...head('needs_correction', 'none_found', 'Checked Clue privacy policy, Clue support page on Clue Plus pricing, App Store listing and MobiHealthNews on FDA clearance. Clue is free; Clue Plus price varies by region and app store (catalog "$10/month" not confirmed for the US). App Store lists it as a regulated medical device under EU law; FDA cleared the separate Clue Birth Control feature in 2021 (no current US availability confirmed). App Store privacy label: identifiers used to track; health, location and sensitive info linked to you. No recall or FDA safety action found.', SAFETY_DUE),
    corrections: [
      { field: 'pricing.price', catalog: 'Free (Clue Plus $10/month)', source_says: 'Free; Clue Plus price varies by region and is shown in the app store', source_url: 'https://support.helloclue.com/hc/en-us/articles/115005215266-How-much-does-Clue-Plus-cost' },
    ],
    facts: {
      'identity.brand': f('Clue (BioWink GmbH, Berlin)', 'Clue privacy policy', 'https://helloclue.com/privacy.html'),
      'identity.purchase_url': f('https://helloclue.com/', 'Clue website', 'https://helloclue.com/privacy.html'),
      'pricing.price': f('Free app; Clue Plus subscription price varies by region (set in the app store)', 'Clue support', 'https://support.helloclue.com/hc/en-us/articles/115005215266-How-much-does-Clue-Plus-cost'),
      'pricing.availability': f('iOS App Store and Google Play', 'App Store listing', 'https://apps.apple.com/dk/app/id657189652'),
      'safety.privacy': f('Clue says tracked health data is never shared with or sold to advertisers; ads use device IDs and app events (shared with ad networks such as Meta and TikTok via Adjust, on iOS only with permission); de-identified research sharing is opt-in; data stored in the EU under GDPR; deletion on request within 1 month. Policy does not mention HIPAA or law enforcement requests. App Store label: identifiers used for tracking; health, location and sensitive info linked to you.', 'Clue privacy policy + App Store', 'https://helloclue.com/privacy.html'),
      'safety.regulatory_status': f('App Store: developer says the app is a regulated medical device complying with EU law. FDA cleared Clue Birth Control (a digital contraception feature) in March 2021.', 'App Store listing + MobiHealthNews', 'https://mobihealthnews.com/news/clue-expands-digital-contraception-fda-clearance', 'regulatory'),
      'safety.warnings': f('App Store medical device info: developer states there are no warnings or precautions for use. Period predictions are not contraception unless using the cleared Clue Birth Control mode.', 'App Store listing', 'https://apps.apple.com/dk/app/id657189652'),
      'safety.age_restriction': f('Rated 13+ on the App Store', 'App Store listing', 'https://apps.apple.com/dk/app/id657189652'),
      'safety.recalls': f('No FDA recall or safety communication found for Clue (web search, Oct 2026).', 'Web search', 'https://mobihealthnews.com/news/clue-expands-digital-contraception-fda-clearance', 'regulatory'),
      'health.intended_use': f('Period and cycle tracking app; optional FDA-cleared digital contraception mode (Clue Birth Control)', 'MobiHealthNews', 'https://mobihealthnews.com/news/clue-expands-digital-contraception-fda-clearance', 'regulatory'),
      'evidence.sources': f([
        { title: 'MobiHealthNews: Clue gets FDA clearance for digital contraception (2021)', url: 'https://mobihealthnews.com/news/clue-expands-digital-contraception-fda-clearance', evidence_type: 'regulatory', supports: 'FDA clearance; trial of 700+ women: 92% typical use, 97% perfect use effectiveness' },
      ], 'MobiHealthNews', 'https://mobihealthnews.com/news/clue-expands-digital-contraception-fda-clearance', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Clue Birth Control mode prevents pregnancy (92% typical use, 97% perfect use)', strength: 'moderate', evidence_type: 'product_study', source_url: 'https://mobihealthnews.com/news/clue-expands-digital-contraception-fda-clearance', product_specific: true },
      ], 'MobiHealthNews', 'https://mobihealthnews.com/news/clue-expands-digital-contraception-fda-clearance', 'regulatory'),
    },
  },

  'd-stardust': {
    ...head('in_review', 'none_found', 'Checked App Store listing (Egypt storefront; US page did not load) and Mozilla Privacy Not Included review (July 2026, rated 2/10). Free with paid plans (monthly, annual). Mozilla: no end-to-end encryption despite earlier claims; health entries sent to RudderStack with a user ID; ad-measurement sharing with Meta and Google named in the May 2026 policy. App Store label says health data not linked to you but identifiers and usage data used for tracking. Not a medical device. No recall found.', SAFETY_DUE),
    facts: {
      'identity.brand': f('Stardust App LLC (New York)', 'App Store listing', 'https://apps.apple.com/eg/app/id1495829322'),
      'identity.purchase_url': f('https://apps.apple.com/us/app/-/id1495829322', 'App Store listing', 'https://apps.apple.com/us/app/-/id1495829322'),
      'pricing.price': f('Free with in-app purchases (monthly and annual Stardust plans; US prices not captured)', 'App Store listing', 'https://apps.apple.com/eg/app/id1495829322'),
      'pricing.availability': f('iOS App Store (also on Android)', 'App Store listing', 'https://apps.apple.com/eg/app/id1495829322'),
      'safety.privacy': f('Mozilla (Jul 2026, 2/10): standard server-side encryption, not end-to-end as once claimed; no evidence of data sales, but symptom entries go to RudderStack with a persistent user ID, device/ad data to AppsFlyer and Facebook, and the May 2026 policy names Meta and Google ad-measurement partners; no clear in-app opt-out. App Store label: identifiers, purchases and usage data used to track you. Policy: https://stardust.app/privacy-policy.html', 'Mozilla Privacy Not Included + App Store', 'https://www.mozillafoundation.org/en/nothing-personal/stardust-privacy-review/', 'research'),
      'safety.regulatory_status': f('Wellness app; no FDA clearance or medical device status found', 'App Store listing', 'https://apps.apple.com/eg/app/id1495829322'),
      'safety.warnings': f('Independent review flags third-party data sharing of health entries; consider what you log.', 'Mozilla Privacy Not Included', 'https://www.mozillafoundation.org/en/nothing-personal/stardust-privacy-review/', 'research'),
      'safety.age_restriction': f('Rated 13+ on the App Store (crude humour, health topics)', 'App Store listing', 'https://apps.apple.com/eg/app/id1495829322'),
      'safety.recalls': f('No regulator action found (not a regulated device).', 'Web search', 'https://www.mozillafoundation.org/en/nothing-personal/stardust-privacy-review/', 'research'),
      'health.intended_use': f('Period and cycle tracking app (wellness)', 'App Store listing', 'https://apps.apple.com/eg/app/id1495829322'),
      'evidence.sources': f([
        { title: 'Mozilla Foundation privacy review: Stardust', url: 'https://www.mozillafoundation.org/en/nothing-personal/stardust-privacy-review/', evidence_type: 'expert_guidance', supports: 'Privacy practices and data sharing' },
      ], 'Mozilla Foundation', 'https://www.mozillafoundation.org/en/nothing-personal/stardust-privacy-review/', 'research'),
    },
  },

  'd-balance-menopause': {
    ...head('in_review', 'none_found', 'Checked App Store listing and Dr Louise Newson data page. Free app; balance+ in-app purchases listed at $4.99 or $10.99 monthly and $49.99 or $98.99 yearly (two price points shown). Developer Balance App Limited (UK). Company says personal data is never sold and no targeted ads; App Store label: health, contact and sensitive info linked to you. Not a medical device. No recall found.', SAFETY_DUE),
    facts: {
      'identity.brand': f('Balance App Limited (founded by Dr Louise Newson)', 'App Store listing', 'https://apps.apple.com/app/id1503345959'),
      'identity.purchase_url': f('https://apps.apple.com/app/id1503345959', 'App Store listing', 'https://apps.apple.com/app/id1503345959'),
      'pricing.price': f('Free; balance+ premium $4.99 to $10.99/month or $49.99 to $98.99/year (App Store lists two tiers)', 'App Store listing', 'https://apps.apple.com/app/id1503345959'),
      'pricing.availability': f('iOS App Store (also Google Play)', 'App Store listing', 'https://apps.apple.com/app/id1503345959'),
      'safety.privacy': f('Company says personal data is never sold; health data not shared with Google, Facebook or pharma for marketing; research use only with explicit consent, anonymised and aggregated; no targeted ads; deletion on request. App Store label: health, contact, identifiers and sensitive info linked to you. Policy: https://www.balance-menopause.com/balance-app-privacy-policy/', 'Dr Louise Newson site + App Store', 'https://www.drlouisenewson.co.uk/knowledge/health-trackers-how-to-keep-your-data-safe'),
      'safety.regulatory_status': f('Wellness information and tracking app; no medical device status found', 'App Store listing', 'https://apps.apple.com/app/id1503345959'),
      'safety.age_restriction': f('Rated 17+ (frequent medical/treatment information)', 'App Store listing', 'https://apps.apple.com/app/id1503345959'),
      'safety.recalls': f('No regulator action found.', 'Web search', 'https://apps.apple.com/app/id1503345959'),
      'health.intended_use': f('Menopause and perimenopause information, symptom and period tracking, health report for appointments, community', 'App Store listing', 'https://apps.apple.com/app/id1503345959'),
    },
  },
  'd-nurx-bc': {
    ...head('needs_clinician_review', 'none_found', 'Checked Nurx cost FAQ and Nurx privacy policy. $28 consultation fee per request (covers a year of messaging, not billed to insurance); birth control $0 with most insurance or from $15/month without. Catalog "$15-20/month" omits the $28 fee. Operator: Propel Network LLC and affiliated medical entities. Privacy policy says it may have sold/shared personal info under the CCPA definition via ad platforms (Meta, Google, TikTok, Snapchat); PHI is covered by a separate HIPAA notice. States served not stated on pages read. Clinician review: prescribes hormonal contraception.'),
    corrections: [
      { field: 'pricing.price', catalog: '$15-20/month', source_says: '$28 consultation fee per year-long request, plus birth control from $15/month without insurance or as little as $0 with insurance', source_url: 'https://www.nurx.com/faq/how-much-does-birth-control-cost/' },
    ],
    facts: {
      'identity.brand': f('Nurx (Propel Network LLC and affiliated medical groups)', 'Nurx privacy policy', 'https://www-test.nurx.com/privacy-policy/'),
      'pricing.price': f('$28 consultation fee (a year of unlimited messaging with the care team); birth control from $15/month without insurance, often $0 with insurance', 'Nurx cost FAQ', 'https://www.nurx.com/faq/how-much-does-birth-control-cost/'),
      'pricing.availability': f('Online telehealth with home delivery; states served not listed on the pages checked', 'Nurx cost FAQ', 'https://www.nurx.com/faq/how-much-does-birth-control-cost/'),
      'safety.privacy': f('PHI is handled under a separate HIPAA Notice of Privacy Practices. For other personal data, Nurx says it may have sold or shared information (CCPA definition) through ad and analytics platforms such as Meta, Google, TikTok and Snapchat; uses cookies and pixels; does not honor Do Not Track; deletion requests via web form.', 'Nurx privacy policy', 'https://www-test.nurx.com/privacy-policy/'),
      'safety.regulatory_status': f('Telehealth service; prescriptions written by licensed clinicians and filled by Propel Pharmacy, LLC', 'Nurx privacy policy', 'https://www-test.nurx.com/privacy-policy/'),
      'safety.warnings': f('Combined hormonal contraceptives carry a smoking warning: cigarette smoking raises the risk of serious cardiovascular side effects, more so over age 35 and with 15+ cigarettes a day. Get care for signs of blood clots or stroke.', 'MedlinePlus (combined hormonal contraceptive, vaginal ring)', 'https://medlineplus.gov/druginfo/meds/a604032.html', 'clinical_guidance'),
      'safety.recalls': f('No FDA or FTC action found for Nurx in a web search (Oct 2026).', 'Web search', 'https://www.nurx.com/faq/how-much-does-birth-control-cost/'),
      'health.intended_use': f('Online prescriptions for birth control and other sexual health care, delivered by mail', 'Nurx cost FAQ', 'https://www.nurx.com/faq/how-much-does-birth-control-cost/'),
      'evidence.sources': f([
        { title: 'MedlinePlus: estrogen and progestin vaginal ring contraceptives', url: 'https://medlineplus.gov/druginfo/meds/a604032.html', evidence_type: 'clinical_guideline', supports: 'Smoking warning and serious side effects of combined hormonal contraception' },
      ], 'MedlinePlus', 'https://medlineplus.gov/druginfo/meds/a604032.html', 'clinical_guidance'),
    },
  },

  'd-wisp-bc': {
    ...head('needs_clinician_review', 'none_found', 'Checked Wisp about page and Medical News Today review (updated Sept 24, 2026; affiliate links). Birth control pills from $5/month with a subscription "from $15/month"; no consultation fee for birth control; no insurance accepted (FSA/HSA ok). Async care by independent physicians, all 50 states. Wisp says it follows HIPAA best practices; privacy policy at hellowisp.com/privacy (not read). Clinician review: prescribes hormonal contraception.'),
    facts: {
      'identity.brand': f('Wisp (wisp, Inc.)', 'Wisp about page', 'https://hellowisp.com/about'),
      'identity.purchase_url': f('https://hellowisp.com/', 'Wisp about page', 'https://hellowisp.com/about'),
      'pricing.price': f('Birth control pills from $5/month, subscription from $15/month; no consultation fee for birth control (other consults $39 to $99)', 'Medical News Today review (Sept 2026)', 'https://www.medicalnewstoday.com/articles/wisp-review', 'research'),
      'pricing.fsa_hsa': f('Accepts FSA and HSA payments; does not accept insurance', 'Medical News Today review', 'https://www.medicalnewstoday.com/articles/wisp-review', 'research'),
      'pricing.availability': f('All 50 states (brand); async online visits, prescriptions sent to your pharmacy, often within 3 hours', 'Wisp about page', 'https://hellowisp.com/about'),
      'safety.privacy': f('Wisp says it follows HIPAA best practices and stores data in a HIPAA-compliant manner; discreet packaging; site has a "Do Not Sell/Share My Personal Info" link. Full policy: https://hellowisp.com/privacy (not reviewed).', 'Wisp about page', 'https://hellowisp.com/about'),
      'safety.regulatory_status': f('Telehealth service; independent licensed physicians decide whether to prescribe', 'Wisp about page', 'https://hellowisp.com/about'),
      'safety.warnings': f('Not for emergencies (call 911). Combined hormonal contraceptives carry a smoking warning, higher risk over 35.', 'Wisp about page + MedlinePlus', 'https://medlineplus.gov/druginfo/meds/a604032.html', 'clinical_guidance'),
      'safety.recalls': f('No FTC or FDA action found; MNT notes user complaints about delays and unexpected fees.', 'Medical News Today review', 'https://www.medicalnewstoday.com/articles/wisp-review', 'research'),
      'health.intended_use': f('Online prescriptions for birth control, emergency contraception and sexual health care', 'Wisp about page', 'https://hellowisp.com/about'),
      'evidence.sources': f([
        { title: 'MedlinePlus: combined hormonal contraceptive (vaginal ring) drug information', url: 'https://medlineplus.gov/druginfo/meds/a604032.html', evidence_type: 'clinical_guideline', supports: 'Smoking warning and serious side effects of combined hormonal contraception' },
      ], 'MedlinePlus', 'https://medlineplus.gov/druginfo/meds/a604032.html', 'clinical_guidance'),
    },
  },

  'd-midi-health': {
    ...head('needs_clinician_review', 'none_found', 'Checked Midi pricing page, privacy policy and MobiHealthNews (Oct 2023, 50-state expansion). Self-pay $250 first visit (30 min), $150 returning (15 min), no membership fee; in-network with most major PPO plans; Medicare out-of-network, Medicaid not accepted; HSA/FSA ok. Care by nurse practitioners overseen by physicians. Privacy policy: PHI under HIPAA notice; uses Meta/Google pixels and says some sharing could be a "sale" under CCPA. Clinician review: prescribes menopause hormone therapy.'),
    corrections: [
      { field: 'pricing.price', catalog: 'Membership / per visit; varies by plan and state', source_says: 'No membership fee; insurance in-network for most major plans, or self-pay $250 first visit / $150 returning', source_url: 'https://joinmidi.com/pricing-insurance' },
    ],
    facts: {
      'identity.brand': f('Midi Health, Inc.', 'Midi privacy policy', 'https://joinmidi.com/legals/privacy-policy'),
      'identity.purchase_url': f('https://joinmidi.com/pricing-insurance', 'Midi pricing page', 'https://joinmidi.com/pricing-insurance'),
      'pricing.price': f('Insurance: in-network with most major plans (copay/deductible vary). Self-pay: $250 first visit (30 min), $150 returning visit (15 min); no membership fee; additional costs may apply', 'Midi pricing page', 'https://joinmidi.com/pricing-insurance'),
      'pricing.fsa_hsa': f('HSA and FSA funds accepted', 'Midi pricing page', 'https://joinmidi.com/pricing-insurance'),
      'pricing.availability': f('Virtual care in all 50 states (since Jan 2024); Medicare out-of-network, Medicaid/Medi-Cal not accepted', 'MobiHealthNews + Midi pricing page', 'https://www.mobihealthnews.com/news/midi-health-expands-womens-care-access-all-50-states', 'research'),
      'safety.privacy': f('PHI is governed by HIPAA and the medical groups\' Notice of Privacy Practices. For other data, the site uses Meta, Google and other ad pixels and Mixpanel; policy says some sharing could be a "sale" under CCPA (opt out via operations@joinmidi.com); deletion rights for CA, WA, NV and several other states.', 'Midi privacy policy', 'https://joinmidi.com/legals/privacy-policy'),
      'safety.regulatory_status': f('Telehealth clinic; care by nurse practitioners overseen by physicians, billing insurers directly', 'MobiHealthNews', 'https://www.mobihealthnews.com/news/midi-health-expands-womens-care-access-all-50-states', 'research'),
      'safety.warnings': f('Menopause hormone therapy: smoking raises the risk of blood clots and stroke; may not be recommended at 65+; report unusual vaginal bleeding, breast lumps, chest pain, leg pain or stroke signs right away.', 'MedlinePlus: estrogen and progestin (HRT)', 'https://medlineplus.gov/druginfo/./meds/a601041.html', 'clinical_guidance'),
      'safety.recalls': f('No regulator action found for Midi Health (web search, Oct 2026).', 'Web search', 'https://www.mobihealthnews.com/news/midi-health-expands-womens-care-access-all-50-states', 'research'),
      'safety.age_restriction': f('Focused on women 40 and older (perimenopause and menopause)', 'MobiHealthNews', 'https://www.mobihealthnews.com/news/midi-health-expands-womens-care-access-all-50-states', 'research'),
      'health.intended_use': f('Virtual perimenopause and menopause care, lifestyle coaching and prescriptions', 'MobiHealthNews', 'https://www.mobihealthnews.com/news/midi-health-expands-womens-care-access-all-50-states', 'research'),
      'evidence.sources': f([
        { title: 'MedlinePlus: estrogen and progestin (hormone replacement therapy)', url: 'https://medlineplus.gov/druginfo/./meds/a601041.html', evidence_type: 'clinical_guideline', supports: 'Uses and serious side effects of menopause hormone therapy' },
      ], 'MedlinePlus', 'https://medlineplus.gov/druginfo/./meds/a601041.html', 'clinical_guidance'),
    },
  },
  'p-cora-organic-pads': {
    ...head('needs_correction', 'none_found', 'Catalog "$10 for 32" names no size; checked ShopRite listing for Cora Peace-of-Mind Overnight pads (28 ct, $11.99). Only the topsheet is organic cotton; core is wood pulp and sodium polyacrylate; backsheet polyethylene; adhesive from petroleum resin, rubber and mineral oil. Catalog "Organic cotton." is incomplete. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Organic cotton.', source_says: 'Organic cotton topsheet; core of chlorine-free wood pulp and sodium polyacrylate; PE/PET acquisition layer; polyethylene and calcium carbonate backsheet; cotton wings; hot melt adhesive (petroleum resin, rubber, mineral oil)', source_url: 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643' },
      { field: 'pricing.price', catalog: '$10 for 32', source_says: '$11.99 for 28 overnight pads at ShopRite (size counts differ)', source_url: 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643' },
    ],
    facts: {
      'identity.variant': f('Cora 100% Organic Cotton Topsheet Peace-of-Mind Overnight Pad, 28 count (reference; catalog size unspecified)', 'ShopRite listing', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'pricing.price': f('$11.99 for 28 overnight pads at ShopRite (retailer; varies)', 'ShopRite listing', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'pricing.size_count': f('28 pads (overnight); other sizes sold in other counts (e.g. 14 ct overnight at Walmart)', 'ShopRite + Walmart listings', 'https://www.walmart.com/ip/Cora-Organic-Cotton-Topsheet-Pads-Unscented-Overnight-14-Count/398231938', 'retailer'),
      'pricing.availability': f('ShopRite, Walmart, Target and cora.life', 'Retailer listings', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'composition.ingredients': f('Topsheet: 100% organic cotton. Core: elemental chlorine-free wood pulp, sodium polyacrylate. Acquisition layer: polyethylene, polyester. Backsheet: polyethylene, calcium carbonate. Side barriers/wings: cotton. Adhesive: hot melt (petroleum resin, rubber, mineral oil)', 'ShopRite listing (label text)', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'composition.fragrance': f('Made without fragrance or dyes (brand)', 'ShopRite listing', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'composition.allergens': f('Manufacturer says dermatologically tested and hypoallergenic. Adhesive contains rubber (latex status not stated).', 'ShopRite listing', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      ...padFacts,
      'safety.regulatory_status': unscentedPadReg,
      'safety.recalls': f('No recall found for Cora pads (web search, Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
    },
  },

  'p-cora-organic-tampons': {
    ...head('in_review', 'none_found', 'Checked Giant listing (label text) and Grove. 32 ct Regular/Super multipack: 16 Regular (6-9 g), 16 Super (9-12 g); organic cotton tampon and string with paraffin wax; BPA-free plastic applicator. Grove lists $12.49 but marks this pack discontinued there and points to Cora "Comfort Fit"; catalog $11 not confirmed. Label TSS warning present. No recall found.'),
    facts: {
      'identity.variant': f('Cora Organic Cotton Multipack Regular & Super Compact applicator tampons, 32 count (16 + 16)', 'Giant listing', 'https://giantfoodstores.com/groceries/product/cora-organic-cotton-multipack-regular-super-compact-tampons-32-ct-box/313111', 'retailer'),
      'pricing.price': f('$12.49 for 32 at Grove (listed as no longer available there)', 'Grove listing', 'https://www.grove.co/catalog/product/organic-cotton-tampons-applicator-32ct', 'retailer'),
      'pricing.size_count': f('32 tampons (16 Regular 6-9 g, 16 Super 9-12 g)', 'Giant listing', 'https://giantfoodstores.com/groceries/product/cora-organic-cotton-multipack-regular-super-compact-tampons-32-ct-box/313111', 'retailer'),
      'pricing.availability': f('Giant, Stop & Shop, Hannaford, Walmart, Target; discontinued at Grove', 'Retailer listings', 'https://stopandshop.com/groceries/product/cora-organic-cotton-multipack-regular-super-compact-tampons-32-ct-box/313111', 'retailer'),
      'composition.ingredients': f('100% organic cotton tampon, organic cotton string with paraffin water-repellent wax, BPA-free plastic applicator', 'Grove + Giant listings', 'https://www.grove.co/catalog/product/organic-cotton-tampons-applicator-32ct', 'retailer'),
      'composition.fragrance': f('Fragrance-free and dye-free', 'Giant listing', 'https://giantfoodstores.com/groceries/product/cora-organic-cotton-multipack-regular-super-compact-tampons-32-ct-box/313111', 'retailer'),
      ...tamponFacts,
      'safety.recalls': f('No recall found for Cora tampons (web search, Oct 2026).', 'Web recall search', FDA.tampons, 'regulatory'),
    },
  },

  'p-intimina-kegel': {
    ...head('needs_correction', 'unknown', 'Catalog name mixes brands: "Luna Beads" is a LELO product; Intimina\'s weighted exerciser is Laselle (28 g, 38 g, 48 g, silicone coated; Intimina product sheet lists it as by Intimina/LELO). Laselle Kegel Routine 3-pack is £33.90 in the UK; single US price not confirmed (catalog $25). No warnings or regulatory class found on pages read; packaging should be checked. Recall status not checked against FDA databases.'),
    corrections: [
      { field: 'identity.name', catalog: 'Intimina Kegel Exerciser (Luna Beads)', source_says: 'Intimina Laselle weighted exerciser (28/38/48 g) or Laselle Kegel Routine 3-pack; Luna Beads is a LELO product', source_url: 'https://www.lookfantastic.com/p/intimina-laselle-kegel-routine/13034095/' },
    ],
    facts: {
      'identity.brand': f('Intimina (LELO group)', 'Intimina product sheet', 'https://tienda.fisaude.com/files/Product_Sheet_LWE_ES_EU_20170425%20(2).pdf%20(2).pdf'),
      'identity.variant': f('Laselle weighted exerciser: 28 g (light), 38 g (moderate) or 48 g (high); also sold as a 3-piece Kegel Routine set', 'Intimina product sheet', 'https://tienda.fisaude.com/files/Product_Sheet_LWE_ES_EU_20170425%20(2).pdf%20(2).pdf'),
      'pricing.price': f('£33.90 for the 3-piece Laselle Kegel Routine (UK retailer); US single-weight price not confirmed', 'Lookfantastic listing', 'https://www.lookfantastic.com/p/intimina-laselle-kegel-routine/13034095/', 'retailer'),
      'pricing.size_count': f('1 exerciser with pouch and manual (single), or set of 3', 'Intimina product sheet', 'https://tienda.fisaude.com/files/Product_Sheet_LWE_ES_EU_20170425%20(2).pdf%20(2).pdf'),
      'composition.ingredients': f('Weighted ball coated in medical-grade silicone; 36 mm diameter; retraction cord', 'Intimina product sheet', 'https://tienda.fisaude.com/files/Product_Sheet_LWE_ES_EU_20170425%20(2).pdf%20(2).pdf'),
      'composition.dosage': f('Start with the lightest comfortable weight; insert about 2 cm with water-based lubricant, cord outside, and squeeze; should not hurt. Session length not stated.', 'Lookfantastic listing (brand directions)', 'https://www.lookfantastic.com/p/intimina-laselle-kegel-routine/13034095/', 'retailer'),
      'health.intended_use': f('Pelvic floor (Kegel) resistance training with a weighted vaginal exerciser', 'Lookfantastic listing (brand description)', 'https://www.lookfantastic.com/p/intimina-laselle-kegel-routine/13034095/', 'retailer'),
    },
  },

  'p-lola-pad': {
    ...head('needs_correction', 'none_found', 'Checked LOLA pads page. $11 one-time for 12 pads (matches catalog), $9.50 on subscription. Topsheet GOTS organic cotton; core cellulose plus superabsorbent polymer (acrylic acid), polyethylene backsheet, hot melt adhesive, polypropylene; catalog says "organic cotton core" and "plant-based bioplastic back sheet", which the page does not support. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: '100% organic cotton (top sheet and core), plant-based bioplastic back sheet, non-toxic adhesive', source_says: 'Organic cotton topsheet; core of cellulose and superabsorbent polymer (acrylic acid); polyethylene backsheet and wrapper; hot melt adhesives; polypropylene', source_url: 'https://mylola.com/collections/periods/products/pads' },
    ],
    facts: {
      'identity.variant': f('LOLA Organic Period Pads with Wings, Regular (240 mm) or Heavy (290 mm), 12 count', 'LOLA product page', 'https://mylola.com/collections/periods/products/pads'),
      'identity.purchase_url': f('https://mylola.com/collections/periods/products/pads', 'LOLA product page', 'https://mylola.com/collections/periods/products/pads'),
      'pricing.price': f('$11 one-time for 12; subscription $9.50 for 12, $18 for 24, $25.50 for 36', 'LOLA product page', 'https://mylola.com/collections/periods/products/pads'),
      'pricing.size_count': f('12 pads', 'LOLA product page', 'https://mylola.com/collections/periods/products/pads'),
      'pricing.fsa_hsa': f('Walmart listing for LOLA pads says HSA/FSA approved', 'Walmart listing', 'https://www.walmart.com/ip/LOLA-Heavy-Organic-Cotton-Pads-36-Count-Ultra-Thin-Pad-with-Wings-HSA-FSA-Approved/16001906674', 'retailer'),
      'pricing.availability': f('LOLA website and Walmart', 'LOLA product page + Walmart', 'https://www.walmart.com/ip/Lola-Regular-Ultra-Thin-Organic-Cotton-Pads-with-Wings-20-Pads/5122418301', 'retailer'),
      'composition.ingredients': f('Topsheet: GOTS-certified organic cotton. Core: cellulose and superabsorbent polymer (acrylic acid). Backsheet and wrapper: polyethylene. Hot melt adhesives. Polypropylene (layer not stated).', 'LOLA product page', 'https://mylola.com/collections/periods/products/pads'),
      'composition.fragrance': f('Fragrance-free; made without dyes and elemental chlorine (brand)', 'LOLA product page', 'https://mylola.com/collections/periods/products/pads'),
      ...padFacts,
      'safety.regulatory_status': unscentedPadReg,
      'safety.recalls': f('No recall found for LOLA pads (web search, Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
    },
  },
  'p-natracare-pad': {
    ...head('in_review', 'none_found', 'Checked Walmart (marketplace sellers) and a UK retailer listing. Natracare Ultra Pads with Wings, Regular, 14 ct: certified organic cotton topsheet, cellulose pulp core, plant starch based backing, non-toxic glue; brand says plastic free and compostable. US price on Walmart marketplace $6.64 to $8.49 (catalog $8 consistent). No recall found.'),
    facts: {
      'identity.brand': f('Natracare', 'Walmart listing', 'https://www.walmart.com/ip/seort/26968642', 'retailer'),
      'identity.variant': f('Natracare Natural Ultra Pads with Wings, Regular, 14 count', 'Walmart listing', 'https://www.walmart.com/ip/seort/26968642', 'retailer'),
      'pricing.price': f('$6.64 to $8.49 for 14 (Walmart marketplace sellers)', 'Walmart listing', 'https://www.walmart.com/ip/seort/26968642', 'retailer'),
      'pricing.size_count': f('14 pads', 'Walmart listing', 'https://www.walmart.com/ip/seort/26968642', 'retailer'),
      'pricing.availability': f('Walmart marketplace, natural grocers, UK retailers', 'Retailer listings', 'https://www.amnestyshop.org.uk/products/natracare/natracare-organic-cotton-ultra-pads---regular-with-wings---pack-of-14/', 'retailer'),
      'composition.ingredients': f('Certified organic cotton topsheet, ecologically certified cellulose pulp core, plant starch (plant-based waterproof backing), non-toxic glue; brand says free from plastics and petroleum derivatives', 'Walmart + UK retailer listings', 'https://www.amnestyshop.org.uk/products/natracare/natracare-organic-cotton-ultra-pads---regular-with-wings---pack-of-14/', 'retailer'),
      'composition.fragrance': f('Free from perfumes and dyes', 'UK retailer listing', 'https://www.amnestyshop.org.uk/products/natracare/natracare-organic-cotton-ultra-pads---regular-with-wings---pack-of-14/', 'retailer'),
      ...padFacts,
      'safety.regulatory_status': unscentedPadReg,
      'safety.recalls': f('No recall found for Natracare pads (web search, Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
    },
  },

  'p-organyc-pad': {
    ...head('needs_correction', 'none_found', 'Checked Vitacost listing (label text). Heavy Flow 10 ct is $9.16 (catalog $8 for 10). Composition: organic cotton 83% (top and core), corn starch biodegradable polymer backsheet 14%, adhesive 3%; catalog "100% certified organic cotton" leaves out the backsheet and adhesive. Brand cites a clinical study on reduced irritation (not reviewed). No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: '100% certified organic cotton', source_says: 'Organic cotton 83% (topsheet and core), corn starch biodegradable polymer backsheet 14%, hygiene adhesive 3%', source_url: 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731' },
      { field: 'pricing.price', catalog: '$8 for 10', source_says: '$9.16 for 10 (Vitacost)', source_url: 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731' },
    ],
    facts: {
      'identity.brand': f('Organyc (Corman)', 'Walmart listing', 'https://www.walmart.com/ip/seort/34812895', 'retailer'),
      'identity.variant': f('Organyc Organic Cotton Pads, Heavy Flow, 10 count (Moderate also sold)', 'Vitacost listing', 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', 'retailer'),
      'pricing.price': f('$9.16 for 10 at Vitacost', 'Vitacost listing', 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', 'retailer'),
      'pricing.size_count': f('10 pads', 'Vitacost listing', 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', 'retailer'),
      'pricing.availability': f('Vitacost, Walmart, natural retailers', 'Retailer listings', 'https://www.walmart.com/ip/seort/34812895', 'retailer'),
      'composition.ingredients': f('Certified organic cotton 83% (top cover and absorbent core), corn starch biodegradable polymer backsheet 14%, hygiene-specific adhesive 3%; no chlorine, wood pulp, perfumes or dyes', 'Vitacost listing (label text)', 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', 'retailer'),
      'composition.fragrance': f('No perfumes', 'Vitacost listing', 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', 'retailer'),
      'composition.allergens': f('Manufacturer says hypoallergenic and dermatologically tested', 'Vitacost listing', 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', 'retailer'),
      ...padFacts,
      'safety.regulatory_status': unscentedPadReg,
      'safety.recalls': f('No recall found for Organyc pads (web search, Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
      'evidence.claims': f([
        { claim: 'Reduces redness, swelling, irritation and itching after one cycle', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', product_specific: true },
      ], 'Vitacost listing (manufacturer claim)', 'https://www.vitacost.com/products/organyc-organic-cotton-pads-heavy-flow-10-pads-68731', 'retailer'),
    },
  },

  'p-veeda-pad': {
    ...head('in_review', 'none_found', 'Checked FDA GUDID record (Veeda Natural Cotton Ultra-Thin Day Pads with Wings, 14 ct, Naturalena Brands; product code HHD unscented menstrual pad, exempt from premarket submission) and a retailer listing. Topsheet is natural (not organic) cotton; core and backsheet materials not found, so catalog "wood pulp, PE back sheet" is unverified. Price not found. No recall found.'),
    facts: {
      'identity.brand': f('Veeda (Naturalena Brands Inc.)', 'FDA GUDID', 'https://accessgudid.nlm.nih.gov/devices/00810462020412', 'regulatory'),
      'identity.variant': f('Veeda Natural Cotton Ultra-Thin Day Pads with Wings, 14 count (model VPRW14US)', 'FDA GUDID', 'https://accessgudid.nlm.nih.gov/devices/00810462020412', 'regulatory'),
      'pricing.size_count': f('14 pads', 'FDA GUDID', 'https://accessgudid.nlm.nih.gov/devices/00810462020412', 'regulatory'),
      'pricing.availability': f('Walmart and online retailers', 'Walmart listing', 'https://www.walmart.com/ip/Veeda-Night-Pads-for-Women-Overnight-Heavy-Flow-Absorbent-Feminine-Pads-with-Wings-Hypoallergenic-24-Count/15820464474', 'retailer'),
      'composition.ingredients': f('Natural cotton topsheet; core and backsheet materials not stated on pages found', 'Retailer listing (mirror)', 'https://products.withsilver.app/asin/B06XKB611F-Veeda-UltraThin-Absorbent-Day-Pads-with-100-Natural-Cotton-Top-S', 'retailer'),
      'composition.fragrance': f('Fragrance free; chlorine free (brand)', 'Retailer listing (mirror)', 'https://products.withsilver.app/asin/B06XKB611F-Veeda-UltraThin-Absorbent-Day-Pads-with-100-Natural-Cotton-Top-S', 'retailer'),
      'composition.allergens': f('Manufacturer says hypoallergenic. GUDID record does not carry a latex labeling statement.', 'FDA GUDID + retailer', 'https://accessgudid.nlm.nih.gov/devices/00810462020412', 'regulatory'),
      ...padFacts,
      'safety.regulatory_status': f('FDA device listing: product code HHD (unscented menstrual pad), exempt from premarket submission', 'FDA GUDID', 'https://accessgudid.nlm.nih.gov/devices/00810462020412', 'regulatory'),
      'safety.recalls': f('No recall found for Veeda pads (web search, Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
    },
  },

  'p-l-pad': {
    ...head('in_review', 'none_found', 'Checked Walmart listing for L. Ultra Thin Pads, Organic Cotton Top Layer, Regular, 42 ct: $11.18 (matches catalog $11 for 42). Only the top layer is stated as organic cotton; core described as absorbent pulp with a waterproof backsheet; full ingredients section empty, so "PE back sheet" unverified. FSA/HSA eligible per listing. No recall found.'),
    facts: {
      'identity.brand': f('L.', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'identity.variant': f('L. Ultra Thin Pads, Organic Cotton Top Layer, Regular, unscented, 42 count', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'identity.purchase_url': f('https://www.walmart.com/ip/14592909841', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'pricing.price': f('$11.18 for 42 at Walmart', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'pricing.size_count': f('42 pads (also 24, 56, 112, 168)', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'pricing.fsa_hsa': f('Listed as FSA/HSA eligible', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'pricing.availability': f('Walmart, Target and other retailers', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'composition.ingredients': f('US-grown organic cotton top layer; absorbent pulp core; waterproof backsheet (backsheet material not stated)', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'composition.fragrance': f('Unscented; made without fragrances', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      'composition.allergens': f('Manufacturer says hypoallergenic and dermatologist tested', 'Walmart listing', 'https://www.walmart.com/ip/14592909841', 'retailer'),
      ...padFacts,
      'safety.regulatory_status': unscentedPadReg,
      'safety.recalls': f('No recall found for L. pads (web search, Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': padIntendedUse,
      ...padEvidence,
    },
  },
  'p-tampax-pure': {
    ...head('needs_correction', 'none_found', 'Checked Target listing (via withsilver mirror). Tampax Pure Cotton Regular, unscented, 24 ct: 100% organic cotton core, applicator 60% plant-based plastic; Walmart $13.18 (catalog $8 for 24 looks low). Only the core is stated as organic cotton; cover and string materials not stated on the page found. FSA/HSA eligible. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$8 for 24', source_says: '$13.18 for 24 at Walmart (about $11.41 elsewhere)', source_url: 'https://products.withsilver.app/tcin/84743596-Tampax-Pure-Cotton-Tampons-Unscented-24-Count' },
    ],
    facts: {
      'identity.brand': f('Tampax (Procter & Gamble)', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/84743596-Tampax-Pure-Cotton-Tampons-Unscented-24-Count', 'retailer'),
      'identity.variant': f('Tampax Pure Cotton, Regular absorbency, unscented, 24 count', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/84743596-Tampax-Pure-Cotton-Tampons-Unscented-24-Count', 'retailer'),
      'pricing.price': f('$13.18 for 24 at Walmart (other sellers about $11.41)', 'Target listing (mirror, price comparison)', 'https://products.withsilver.app/tcin/84743596-Tampax-Pure-Cotton-Tampons-Unscented-24-Count', 'retailer'),
      'pricing.size_count': f('24 tampons (also 22 ct Regular/Super duo)', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/84743593-Tampax-PURE-COTTON-22pack-11-Regular11-Super', 'retailer'),
      'pricing.fsa_hsa': f('FSA and HSA eligible', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/84743596-Tampax-Pure-Cotton-Tampons-Unscented-24-Count', 'retailer'),
      'pricing.availability': f('Target, Walmart, Publix, Kroger and most US retailers', 'Retailer listings', 'https://delivery.publix.com/store/publix/products/26003206-tampax-pc-2x-duo-pack-tampons-22-ct', 'retailer'),
      'composition.ingredients': f('100% organic cotton core; applicator 60% plant-based plastic; cover and string materials not stated on the listing', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/84743596-Tampax-Pure-Cotton-Tampons-Unscented-24-Count', 'retailer'),
      'composition.fragrance': f('Unscented', 'Target listing (mirror)', 'https://products.withsilver.app/tcin/84743596-Tampax-Pure-Cotton-Tampons-Unscented-24-Count', 'retailer'),
      ...tamponFacts,
      'safety.recalls': f('No recall found for Tampax Pure Cotton (web search, Oct 2026).', 'Web recall search', FDA.tampons, 'regulatory'),
    },
  },

  'p-natracare-tampon': {
    ...head('in_review', 'none_found', 'Checked Walmart listing for Natracare Organic Cotton Tampons with Applicator, Regular, 16 ct: $13.60 (catalog $12). 100% organic cotton in a cardboard applicator; totally chlorine free; no rayon, plastics or dyes. String material not listed. No recall found.'),
    facts: {
      'identity.brand': f('Natracare', 'Walmart listing', 'https://walmart.com/ip/seort/26968681', 'retailer'),
      'identity.variant': f('Natracare 100% Organic Cotton Tampons, Regular, with cardboard applicator, 16 count', 'Walmart listing', 'https://walmart.com/ip/seort/26968681', 'retailer'),
      'pricing.price': f('$13.60 for 16 at Walmart', 'Walmart listing', 'https://walmart.com/ip/seort/26968681', 'retailer'),
      'pricing.size_count': f('16 tampons', 'Walmart listing', 'https://walmart.com/ip/seort/26968681', 'retailer'),
      'pricing.availability': f('Walmart, Whole Foods and natural retailers', 'Retailer listings', 'https://www.wholefoodsmarket.com/grocery/product/B00005368P?store=RAL', 'retailer'),
      'composition.ingredients': f('100% organic cotton tampon; cardboard applicator; brand says free from rayon, plastics and dyes, totally chlorine free. String material not stated.', 'Walmart listing', 'https://walmart.com/ip/seort/26968681', 'retailer'),
      'composition.fragrance': f('Unscented', 'Walmart listing', 'https://walmart.com/ip/seort/26968681', 'retailer'),
      ...tamponFacts,
      'safety.recalls': f('No recall found for Natracare tampons (web search, Oct 2026).', 'Web recall search', FDA.tampons, 'regulatory'),
    },
  },

  'p-organyc-tampon': {
    ...head('in_review', 'none_found', 'Checked Ethical Superstore (UK) and Wegmans. Organyc Regular applicator tampons, 16 ct; brand says cotton is the only material in its menstrual products and bleaching uses hydrogen peroxide, not chlorine. Applicator material not described on pages read (catalog says cardboard; other listings say plant-based eco-applicator). US price not found (catalog $9). No recall found.'),
    facts: {
      'identity.brand': f('Organyc (Corman)', 'Ethical Superstore listing', 'https://www.ethicalsuperstore.com/products/organyc/organyc-regular-tampons---pack-of-16/', 'retailer'),
      'identity.variant': f('Organyc applicator tampons, Regular, 16 count', 'Ethical Superstore + Wegmans', 'https://www.wegmans.com/shop/product/780533-Tampons-Feminine-Care-Regular-Complete-Protection', 'retailer'),
      'identity.purchase_url': f('https://www.wegmans.com/shop/product/780533-Tampons-Feminine-Care-Regular-Complete-Protection', 'Wegmans listing', 'https://www.wegmans.com/shop/product/780533-Tampons-Feminine-Care-Regular-Complete-Protection', 'retailer'),
      'pricing.size_count': f('16 tampons', 'Wegmans listing', 'https://www.wegmans.com/shop/product/780533-Tampons-Feminine-Care-Regular-Complete-Protection', 'retailer'),
      'pricing.availability': f('Wegmans, Whole Foods and natural retailers', 'Retailer listings', 'https://www.wegmans.com/shop/product/780533-Tampons-Feminine-Care-Regular-Complete-Protection', 'retailer'),
      'composition.ingredients': f('Certified organic cotton (brand: cotton is the only material in its menstrual products); hydrogen peroxide whitening instead of chlorine. Applicator material not described.', 'Ethical Superstore listing', 'https://www.ethicalsuperstore.com/products/organyc/organyc-regular-tampons---pack-of-16/', 'retailer'),
      ...tamponFacts,
      'safety.recalls': f('No recall found for Organyc tampons (web search, Oct 2026).', 'Web recall search', FDA.tampons, 'regulatory'),
    },
  },

  'p-diva-cup': {
    ...head('needs_correction', 'none_found', 'Checked shopdiva.com (brand now styled DIVA Cup). Model 1 is $35 (catalog $30), 26 ml, holds about 5 regular tampons of flow, up to 12 hours; brand guideline is replacement within about 5 years if it deteriorates (catalog says 10 years). Brand page has no FDA or TSS statement; FDA advice used. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$30 (reusable 10 years)', source_says: '$35; brand says it can last up to 5 years, inspect and replace if it deteriorates', source_url: 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1' },
    ],
    facts: {
      'identity.brand': f('DIVA (Diva International)', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      'identity.variant': f('DIVA Cup Model 1 (26 ml); Models 0 and 2 also sold', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      'identity.purchase_url': f('https://shopdiva.com/products/diva-cup-model-1', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      'pricing.price': f('$35', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      'pricing.size_count': f('1 reusable cup; brand guideline up to 5 years', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      'pricing.availability': f('shopdiva.com, Walmart, well.ca and pharmacies', 'Retailer listings', 'https://www.walmart.com/ip/seort/26789677', 'retailer'),
      'composition.ingredients': f('100% medical-grade silicone; brand says no BPA, latex, dyes or plastics', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      'composition.allergens': f('Latex free (brand)', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      'composition.dosage': f('Up to 12 hours of continuous wear; seek medical help if it cannot be removed after 12 hours', 'DIVA product page', 'https://shopdiva.com/products/diva-cup-model-1?irgwc=1'),
      ...cupFacts,
      'safety.recalls': f('No recall found for the DIVA Cup (web search, Oct 2026).', 'Web recall search', FDA.cups, 'regulatory'),
      'health.intended_use': f('Reusable internal cup to collect menstrual flow', 'Cornell LII 21 CFR 884.5400', FDA.cupReg, 'regulatory'),
    },
  },
  'p-lunette-cup': {
    ...head('needs_correction', 'none_found', 'Lunette US store redirects from lunette.com to lunette.us (not readable here). Checked Package Free listing: Size 1 (25 ml, softer, light to normal flow) and Size 2 (30 ml, firmer, normal to heavy), medical-grade BPA-free silicone, up to 12 hours; $28 sale vs $40 regular. Listing cites replacing roughly every 2 to 3 years. Listing also says TSS is not a concern with cups; that is a retailer claim, not an FDA statement, and should not be shown as fact. Catalog "FDA-approved colorants" not confirmed. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$28 (reusable)', source_says: '$40 regular ($28 on sale) at Package Free', source_url: 'https://packagefreeshop.com/products/menstrual-cup-purple' },
    ],
    facts: {
      'identity.brand': f('Lunette', 'Package Free listing', 'https://packagefreeshop.com/products/menstrual-cup-purple', 'retailer'),
      'identity.variant': f('Lunette Menstrual Cup, Size 1 (25 ml) or Size 2 (30 ml); catalog size unspecified', 'Package Free listing', 'https://packagefreeshop.com/products/menstrual-cup-purple', 'retailer'),
      'pricing.price': f('$40 regular, $28 on sale (Package Free)', 'Package Free listing', 'https://packagefreeshop.com/products/menstrual-cup-purple', 'retailer'),
      'pricing.size_count': f('1 reusable cup; listing suggests replacing about every 2 to 3 years', 'Package Free listing', 'https://packagefreeshop.com/products/menstrual-cup-purple', 'retailer'),
      'pricing.availability': f('Lunette US store (lunette.us), Package Free, Walmart marketplace', 'Retailer listings', 'https://www.walmart.com/ip/seort/585160183', 'retailer'),
      'composition.ingredients': f('Medical-grade, BPA-free silicone (Size 1 softer, Size 2 firmer)', 'Package Free listing', 'https://packagefreeshop.com/products/menstrual-cup-purple', 'retailer'),
      'composition.dosage': f('Change about every 12 hours, sooner with heavy flow; boil before and after each cycle', 'Package Free listing', 'https://packagefreeshop.com/products/menstrual-cup-purple', 'retailer'),
      ...cupFacts,
      'safety.recalls': f('No recall found for Lunette cups (web search, Oct 2026).', 'Web recall search', FDA.cups, 'regulatory'),
      'health.intended_use': f('Reusable internal cup to collect menstrual flow', 'Cornell LII 21 CFR 884.5400', FDA.cupReg, 'regulatory'),
    },
  },

  'p-june-cup': {
    ...head('needs_correction', 'unknown', 'No official or retailer page for the June Cup could be found or opened; thejunecup.com did not surface in search. Only source is a 2020 Reddit thread (community, not usable for safety): $6 promo "at cost" vs $29 regular, silicone, made in China. Catalog "$6 pay-what-you-can" is unverified and the product may no longer be sold. Recommend hiding until a human confirms it is still available.'),
    corrections: [
      { field: 'pricing.price', catalog: '$6 (pay-what-you-can)', source_says: 'Only a 2020 community thread: $6 promotional price, $29 regular; no current official price found', source_url: 'https://reddit.fabiomanganiello.com/r/menstrualcups/comments/fuilez/anyone_heard_of_the_june_cup' },
      { field: 'pricing.availability', catalog: 'listed as available', source_says: 'No current official store or retailer listing found', source_url: 'https://reddit.fabiomanganiello.com/r/menstrualcups/comments/fuilez/anyone_heard_of_the_june_cup' },
    ],
    facts: {
      ...cupFacts,
      'health.intended_use': f('Reusable internal cup to collect menstrual flow', 'Cornell LII 21 CFR 884.5400', FDA.cupReg, 'regulatory'),
    },
  },

  'p-nixit': {
    ...head('in_review', 'none_found', 'Checked Period Nirvana listing. $42 (matches catalog), one size, 70 ml, medical-grade silicone, up to 12 hours, 5+ years with care. Listing says discs are a good alternative to cups with an IUD; FDA advises asking a gynecologist first, so that claim should not be shown as fact. No recall or FDA warning found.'),
    facts: {
      'identity.brand': f('Nixit', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
      'identity.variant': f('Nixit reusable menstrual disc, one size, 70 ml', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
      'identity.purchase_url': f('https://shop.periodnirvana.com/products/nixit', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
      'pricing.price': f('$42', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
      'pricing.size_count': f('1 reusable disc; 5+ years with proper care', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
      'pricing.availability': f('Nixit websites (US and Canada) and cup retailers', 'Nixit Canada site', 'https://nixit.ca/products/nixit-menstrual-disc'),
      'composition.ingredients': f('Medical-grade silicone (listing says FDA-registered silicone)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
      'composition.dosage': f('Up to 12 hours; empty more often with heavy flow; wash every 12 hours, boil or steam monthly', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
      ...cupFacts,
      'safety.recalls': f('No recall or FDA warning found for Nixit (web search, Oct 2026).', 'Web recall search', FDA.cups, 'regulatory'),
      'health.intended_use': f('Reusable internal disc that collects menstrual flow (can be worn during penetrative sex per brand)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/nixit', 'retailer'),
    },
  },

  'p-cora-disc': {
    ...head('needs_correction', 'none_found', 'Checked Period Nirvana listing (Cora Perfect Fit Disc) and Target listing exists. $33 (catalog $30), 65 mm, 47.5 ml, medical-grade silicone, empty every 12 hours, 5+ years with care. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$30 (reusable)', source_says: '$33 at Period Nirvana', source_url: 'https://shop.periodnirvana.com/products/the-cora-disc' },
    ],
    facts: {
      'identity.variant': f('Cora Perfect Fit reusable disc, one size, 65 mm, 47.5 ml', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/the-cora-disc', 'retailer'),
      'identity.purchase_url': f('https://www.target.com/p/cora-reusable-menstrual-disc-1ct/-/A-82433921', 'Target listing', 'https://www.target.com/p/cora-reusable-menstrual-disc-1ct/-/A-82433921', 'retailer'),
      'pricing.price': f('$33 at Period Nirvana', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/the-cora-disc', 'retailer'),
      'pricing.size_count': f('1 reusable disc; 5+ years with proper care', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/the-cora-disc', 'retailer'),
      'pricing.availability': f('Target, Period Nirvana (low inventory when checked)', 'Retailer listings', 'https://shop.periodnirvana.com/products/the-cora-disc', 'retailer'),
      'composition.ingredients': f('Medical-grade silicone (listing says FDA-registered silicone)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/the-cora-disc', 'retailer'),
      'composition.dosage': f('Remove and wash every 12 hours or sooner; boil or steam monthly', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/the-cora-disc', 'retailer'),
      ...cupFacts,
      'safety.recalls': f('No recall found for the Cora disc (web search, Oct 2026).', 'Web recall search', FDA.cups, 'regulatory'),
      'health.intended_use': f('Reusable internal disc that collects menstrual flow', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/the-cora-disc', 'retailer'),
    },
  },
  'p-modibodi': {
    ...head('needs_correction', 'none_found', 'Catalog names no style. Checked John Lewis (UK) listing for Modibodi Classic Bikini, Moderate (30 ml, about 6 tampons): outer 95% bamboo viscose / 5% elastane; gusset merino wool top layer, polyester/polyamide middle, polyester bottom; Oeko-Tex Standard 100. No PFAS statement on that page, so catalog "PFAS-free" is unverified. US price not captured (UK £18.99). No recall found; Poison Control notes no published studies on PFAS risk from period underwear.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Bamboo viscose, patented Modifier Tech absorbent layer, PFAS-free', source_says: 'Classic Bikini: 95% bamboo viscose/5% elastane outer; gusset merino wool, polyester/polyamide and polyester layers; Oeko-Tex 100; no PFAS statement found', source_url: 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066' },
    ],
    facts: {
      'identity.brand': f('Modibodi', 'John Lewis listing', 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066', 'retailer'),
      'identity.variant': f('Modibodi Classic Bikini, Moderate absorbency (reference style; catalog style unspecified)', 'John Lewis listing', 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066', 'retailer'),
      'pricing.price': f('£18.99 per pair (UK, John Lewis); US price not captured', 'John Lewis listing', 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066', 'retailer'),
      'pricing.size_count': f('1 pair', 'John Lewis listing', 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066', 'retailer'),
      'composition.ingredients': f('Outer: 95% viscose (bamboo cellulose), 5% elastane. Gusset: merino wool top layer, 80% polyester/20% polyamide middle, polyester bottom. Oeko-Tex Standard 100 certified.', 'John Lewis listing', 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066', 'retailer'),
      'composition.allergens': f('Contains merino wool (gusset top layer)', 'John Lewis listing', 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066', 'retailer'),
      'composition.dosage': f('Moderate holds 30 ml (about 6 tampons); rinse cold after wear, cold machine wash, hang dry, no fabric softener', 'John Lewis listing', 'https://www.johnlewis.com/modibodi-classic-bikini-period-knickers-moderate-absorbency/black/p5828066', 'retailer'),
      'safety.warnings': f('Use as the manufacturer directs; do not reuse longer than recommended; stop and contact a provider if itching, rash, pain or swelling. Poison Control: no published studies on PFAS risk from period underwear; "green" labels do not prove PFAS absence.', 'FDA + Poison Control', 'https://www.poison.org/articles/is-period-underwear-safe-to-use', 'regulatory'),
      'safety.recalls': f('No recall found for Modibodi (web search, Oct 2026).', 'Web recall search', 'https://www.poison.org/articles/is-period-underwear-safe-to-use', 'regulatory'),
      'health.intended_use': f('Reusable absorbent underwear for menstrual flow', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      'evidence.sources': f([
        { title: 'Poison Control: Is period underwear safe to use?', url: 'https://www.poison.org/articles/is-period-underwear-safe-to-use', evidence_type: 'expert_guidance', supports: 'PFAS concerns, lack of studies, use as directed' },
      ], 'Poison Control', 'https://www.poison.org/articles/is-period-underwear-safe-to-use', 'clinical_guidance'),
    },
  },

  'p-rubylove': {
    ...head('in_review', 'none_found', 'Catalog names no style; checked Walmart listing for Ruby Love High-Waist Period Underwear (Bliss): holds up to 3 tampons, 77% nylon / 23% spandex with organic cotton liner and Dri-tech mesh/cotton gusset (consistent with catalog). Price not shown (out of stock). No PFAS statement found. No recall found.'),
    facts: {
      'identity.brand': f('Ruby Love', 'Walmart listing', 'https://www.walmart.com/ip/High-Waist-Period-Underwear-Bliss-Nude/252478867', 'retailer'),
      'identity.variant': f('Ruby Love High-Waist Period Underwear, Bliss (reference style; catalog style unspecified)', 'Walmart listing', 'https://www.walmart.com/ip/High-Waist-Period-Underwear-Bliss-Nude/252478867', 'retailer'),
      'pricing.size_count': f('1 pair', 'Walmart listing', 'https://www.walmart.com/ip/High-Waist-Period-Underwear-Bliss-Nude/252478867', 'retailer'),
      'pricing.availability': f('Walmart (some sizes out of stock) and brand site; teen and swim lines also sold', 'Walmart listings', 'https://www.walmart.com/ip/Teen-Period-Underwear-Hipster-Seamless-Classic-Ruby/218033900', 'retailer'),
      'composition.ingredients': f('77% nylon, 23% spandex; organic cotton liner; Dri-tech mesh/cotton gusset', 'Walmart listing', 'https://www.walmart.com/ip/High-Waist-Period-Underwear-Bliss-Nude/252478867', 'retailer'),
      'composition.dosage': f('Holds up to 3 tampons worth; machine wash cold, no softener or bleach, tumble dry low or hang dry', 'Walmart listing', 'https://www.walmart.com/ip/High-Waist-Period-Underwear-Bliss-Nude/252478867', 'retailer'),
      'safety.warnings': f('Use as the manufacturer directs; do not reuse longer than recommended; stop and contact a provider if itching, rash, pain or swelling.', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      'safety.recalls': f('No recall found for Ruby Love (web search, Oct 2026).', 'Web recall search', FDA.pads, 'regulatory'),
      'health.intended_use': f('Reusable absorbent underwear for menstrual flow', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
    },
  },

  'p-portable-heating': {
    ...head('needs_correction', 'none_found', 'Checked Walmart listing for Comfytemp Cordless Heating Pad for Period Cramps: $35.99 (was $49.99; catalog $30); 3 heat levels 104 to 149 F; auto-off 15/30/45 min; 5000 mAh battery (about 2 h on high, up to 6 h low). Catalog says "Not FDA-regulated (general wellness)", but powered heating pads are a Class II FDA device type (21 CFR 890.5740, 510(k) exempt); whether this model is listed was not checked. Listing has no warnings text. No recall found for Comfytemp (separate FDA recall of Might Bliss heating pads seen in search).'),
    corrections: [
      { field: 'safety.regulatory_status', catalog: 'Not FDA-regulated (general wellness)', source_says: 'Powered heating pads are Class II medical devices (special controls), exempt from 510(k) (21 CFR 890.5740)', source_url: 'https://www.law.cornell.edu/cfr/text/21/890.5740' },
      { field: 'pricing.price', catalog: '$30 (rechargeable)', source_says: '$35.99 at Walmart (list $49.99)', source_url: 'https://www.walmart.com/ip/17564207615' },
    ],
    facts: {
      'identity.brand': f('Comfytemp', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'identity.variant': f('Comfytemp Cordless Heating Pad for Period Cramps, 3 heat and timer settings, waist strap', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'identity.purchase_url': f('https://www.walmart.com/ip/17564207615', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'pricing.price': f('$35.99 at Walmart (list $49.99)', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'pricing.size_count': f('1 cordless pad with 5000 mAh rechargeable battery; strap fits waists up to 53 in', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'pricing.availability': f('Walmart, Newegg and online marketplaces', 'Retailer listings', 'https://www.newegg.com/p/0JH-01C1-003P5', 'retailer'),
      'composition.ingredients': f('Stretch fabric cover with electric heating element and rechargeable battery (specific materials not listed)', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'composition.dosage': f('Low/Medium/High, 104 to 149 F; auto shut-off after 15, 30 or 45 minutes; about 2 h battery on High, up to 6 h on lower settings', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'safety.regulatory_status': f('Powered heating pads are FDA Class II devices (special controls), exempt from 510(k) when meeting 890.9 limits', 'Cornell LII 21 CFR 890.5740', 'https://www.law.cornell.edu/cfr/text/21/890.5740', 'regulatory'),
      'safety.recalls': f('No recall found for Comfytemp (web search, Oct 2026).', 'Web recall search', 'https://www.law.cornell.edu/cfr/text/21/890.5740', 'regulatory'),
      'health.intended_use': f('Wearable dry heat for period cramps and back discomfort (manufacturer)', 'Walmart listing', 'https://www.walmart.com/ip/17564207615', 'retailer'),
      'evidence.sources': f([
        { title: '21 CFR 890.5740 Powered heating pad', url: 'https://www.law.cornell.edu/cfr/text/21/890.5740', evidence_type: 'regulatory', supports: 'Device classification for electric heating pads' },
      ], 'Cornell LII', 'https://www.law.cornell.edu/cfr/text/21/890.5740', 'regulatory'),
    },
  },

  'p-elvie-trainer': {
    ...head('in_review', 'none_found', 'Checked Aeroflow listing: $199, medical-grade silicone, app-connected via Bluetooth, listed as FDA-registered and available through insurance (partial coverage). No FDA 510(k) for Elvie found in a search (a 2015 article said Elvie had not secured clearance; competitors like PeriCoach are cleared as perineometers, product code HIR). Listing says safe with an IUD (manufacturer claim). No warnings on pregnancy/postpartum timing found. App privacy not reviewed. No recall found.'),
    facts: {
      'identity.brand': f('Elvie (Chiaro Technology)', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'identity.variant': f('Elvie Pelvic Floor Trainer (app-connected)', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'identity.purchase_url': f('https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'pricing.price': f('$199; also available through insurance via Aeroflow (partial coverage, copay or deductible)', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'pricing.size_count': f('1 trainer; free app', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'pricing.availability': f('Aeroflow (insurance), Elvie and other retailers; needs iOS 10+/Android 6+ with Bluetooth LE (not Huawei)', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'composition.ingredients': f('Medical-grade silicone with Bluetooth sensor', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'safety.regulatory_status': f('Listed as FDA-registered by the retailer; no 510(k) clearance found. Similar cleared devices are perineometers (product code HIR, 21 CFR 884.1425).', 'Aeroflow + FDA 510(k) database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K160758', 'regulatory'),
      'safety.recalls': f('No recall found for Elvie Trainer (web search, Oct 2026).', 'Web recall search', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'health.intended_use': f('Biofeedback pelvic floor (Kegel) training with an app (manufacturer: bladder control, core support, postnatal recovery)', 'Aeroflow listing', 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', 'retailer'),
      'evidence.sources': f([
        { title: 'FDA 510(k) K160758 PeriCoach (comparable perineometer)', url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K160758', evidence_type: 'regulatory', supports: 'How app-connected pelvic floor trainers are classified' },
        { title: 'Aeroflow product page', url: 'https://aeroflowbreastpumps.com/elvie-pelvic-floor-trainer', evidence_type: 'manufacturer', supports: 'Kegel exercises shown to improve incontinence (manufacturer statement)' },
      ], 'FDA + Aeroflow', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K160758', 'regulatory'),
    },
  },
  'd-natural-cycles': {
    ...head('needs_clinician_review', 'none_found', 'Checked Natural Cycles birth control page, US App Store listing and MobiHealthNews on the 2018 FDA De Novo. US App Store: $21.99/month or $149.99/year (catalog "$100/year or $13/month" is out of date). FDA De Novo Aug 10, 2018 for women 18+; brand cites 93% typical / 98% perfect use; FDA summary cited 6.5% typical and 1.8% perfect-use failure rates. No STI protection. App Store label: health and sensitive info linked to you; contact info used to track. Catalog price is also wrong (see corrections). Clinician review: contraception.'),
    corrections: [
      { field: 'pricing.price', catalog: '$100/year or $13/month', source_says: '$149.99/year or $21.99/month (US App Store)', source_url: 'https://apps.apple.com/us/app/natural-cycles/id765535549' },
    ],
    facts: {
      'identity.brand': f('Natural Cycles (NaturalCycles Nordic AB)', 'App Store listing', 'https://apps.apple.com/us/app/natural-cycles/id765535549'),
      'identity.purchase_url': f('https://www.naturalcycles.com/nc-birth-control', 'Natural Cycles website', 'https://www.naturalcycles.com/nc-birth-control'),
      'pricing.price': f('$21.99/month or $149.99/year (US App Store in-app purchases); plans include a temperature measuring device', 'App Store listing', 'https://apps.apple.com/us/app/natural-cycles/id765535549'),
      'pricing.availability': f('iOS and Android; birth control mode authorized only in certain regions (incl. US)', 'App Store listing', 'https://apps.apple.com/us/app/natural-cycles/id765535549'),
      'safety.privacy': f('App Store label: health, sensitive info, contact info, identifiers and usage data linked to you; contact info used to track you. Full privacy policy not reviewed.', 'App Store listing', 'https://apps.apple.com/us/app/natural-cycles/id765535549'),
      'safety.regulatory_status': f('FDA De Novo authorization (Aug 10, 2018) as a contraceptive app for premenopausal women 18+; also CE marked', 'MobiHealthNews + Natural Cycles', 'https://www.mobihealthnews.com/news/fda-grants-natural-cycles-contraception-app-de-novo-marketing-approval', 'regulatory'),
      'safety.warnings': f('Does not protect against STIs; no contraceptive is 100% effective; on Red Days abstain or use protection; poor sleep or missed measurements lead to more Red Days.', 'Natural Cycles birth control page', 'https://www.naturalcycles.com/nc-birth-control'),
      'safety.age_restriction': f('18 and older (brand); App Store rating 16+', 'Natural Cycles birth control page', 'https://www.naturalcycles.com/nc-birth-control'),
      'safety.recalls': f('No FDA recall found for Natural Cycles (web search, Oct 2026).', 'Web search', 'https://www.mobihealthnews.com/news/fda-grants-natural-cycles-contraception-app-de-novo-marketing-approval', 'regulatory'),
      'health.intended_use': f('Hormone-free contraception and fertility awareness app using body temperature', 'Natural Cycles birth control page', 'https://www.naturalcycles.com/nc-birth-control'),
      'evidence.sources': f([
        { title: 'MobiHealthNews: FDA grants Natural Cycles De Novo (2018)', url: 'https://www.mobihealthnews.com/news/fda-grants-natural-cycles-contraception-app-de-novo-marketing-approval', evidence_type: 'regulatory', supports: 'FDA authorization; 15,570 users: 1.8% perfect-use and 6.5% typical-use failure rate' },
        { title: 'Natural Cycles: NC Birth Control', url: 'https://www.naturalcycles.com/nc-birth-control', evidence_type: 'manufacturer', supports: '93% typical, 98% perfect use effectiveness; 18+; no STI protection' },
      ], 'MobiHealthNews + Natural Cycles', 'https://www.mobihealthnews.com/news/fda-grants-natural-cycles-contraception-app-de-novo-marketing-approval', 'regulatory'),
      'evidence.claims': f([
        { claim: 'Prevents pregnancy about 93% with typical use, 98% with perfect use', strength: 'moderate', evidence_type: 'product_study', source_url: 'https://www.mobihealthnews.com/news/fda-grants-natural-cycles-contraception-app-de-novo-marketing-approval', product_specific: true },
      ], 'MobiHealthNews', 'https://www.mobihealthnews.com/news/fda-grants-natural-cycles-contraception-app-de-novo-marketing-approval', 'regulatory'),
    },
  },

  'd-ovia': {
    ...head('in_review', 'none_found', 'Checked App Store listing (Ovia Health by Labcorp; seller Ovuline, Inc.). Free; premium tools (coaching, birth control tracking, endometriosis, PMOS programs) through an employer or health plan. App Store label: location, identifiers, usage data and diagnostics used to track you; health, financial and sensitive info linked to you. Ovia privacy policy not reviewed. Not a medical device. No regulator action found.', SAFETY_DUE),
    facts: {
      'identity.brand': f('Ovia Health by Labcorp (Ovuline, Inc.)', 'App Store listing', 'https://apps.apple.com/app/570244389'),
      'identity.purchase_url': f('https://apps.apple.com/app/570244389', 'App Store listing', 'https://apps.apple.com/app/570244389'),
      'pricing.price': f('Free; extra programs and coaching through an employer or health plan', 'App Store listing', 'https://apps.apple.com/app/570244389'),
      'pricing.availability': f('iOS App Store (also Android)', 'App Store listing', 'https://apps.apple.com/app/570244389'),
      'safety.privacy': f('App Store label: location, identifiers, usage data and diagnostics used to track you; health, financial info, location, contact info, search history and sensitive info linked to you. Full privacy policy not reviewed.', 'App Store listing', 'https://apps.apple.com/app/570244389'),
      'safety.regulatory_status': f('Wellness app; no FDA clearance found', 'App Store listing', 'https://apps.apple.com/app/570244389'),
      'safety.age_restriction': f('Rated 13+', 'App Store listing', 'https://apps.apple.com/app/570244389'),
      'safety.recalls': f('No regulator action found (web search, Oct 2026).', 'Web search', 'https://apps.apple.com/app/570244389'),
      'health.intended_use': f('Cycle, fertility and pregnancy tracking with employer/health plan programs', 'App Store listing', 'https://apps.apple.com/app/570244389'),
    },
  },

  'd-glow': {
    ...head('in_review', 'none_found', 'Checked App Store listing and Mondaq summary of the 2020 California AG settlement. Free with Glow Premium in-app purchases ($15.99 to $69.99; yearly $59.99 to $69.99). App says it is not for contraception. Sept 2020: Glow paid a $250,000 penalty to the California AG over alleged privacy and security flaws (2013-2016, Partner Connect auto-linking, weak password reset), no admission of liability, with required consent and security programs. App Store label: location, contact info, identifiers and usage used to track you.', SAFETY_DUE),
    facts: {
      'identity.brand': f('Glow, Inc.', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'identity.purchase_url': f('https://apps.apple.com/app/id638021335', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'pricing.price': f('Free; Glow Premium in-app purchases listed from $15.99 to $69.99 (yearly about $59.99 to $69.99)', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'pricing.availability': f('iOS App Store (also Android)', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'safety.privacy': f('2020 California AG settlement ($250,000) over alleged privacy/security flaws, requiring affirmative consent before sharing data and a security program. App Store label: purchases, location, contact info, identifiers and usage data used to track you; health and sensitive info linked to you.', 'Mondaq + App Store', 'https://mondaq.com/unitedstates/privacy-protection/989716/california-settles-with-glow-app-over-alleged-privacy-and-security-violations', 'regulatory'),
      'safety.warnings': f('Not to be used for contraception (app is a conception aid).', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'safety.regulatory_status': f('Wellness app; no FDA clearance found', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'safety.age_restriction': f('Rated 13+', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'safety.recalls': f('No recall; 2020 California AG privacy settlement (see privacy).', 'Mondaq', 'https://mondaq.com/unitedstates/privacy-protection/989716/california-settles-with-glow-app-over-alleged-privacy-and-security-violations', 'regulatory'),
      'health.intended_use': f('Period, ovulation and fertility tracking to help conceive', 'App Store listing', 'https://apps.apple.com/app/id638021335'),
      'evidence.sources': f([
        { title: 'Mondaq: California settles with Glow app over privacy and security (2020)', url: 'https://mondaq.com/unitedstates/privacy-protection/989716/california-settles-with-glow-app-over-alleged-privacy-and-security-violations', evidence_type: 'regulatory', supports: 'Settlement terms and alleged privacy flaws' },
      ], 'Mondaq', 'https://mondaq.com/unitedstates/privacy-protection/989716/california-settles-with-glow-app-over-alleged-privacy-and-security-violations', 'regulatory'),
    },
  },

  'd-maven': {
    ...head('needs_correction', 'none_found', 'Checked Maven support page on appointment costs and a terms.law policy review (Oct 2024 policy). Free and unlimited through a sponsoring employer or health plan; individuals pay per appointment with no subscription: NPs/midwives from $20 (10 min), physicians from $40, specialists from $50, mental health from $70 (40 min), coaches from $25 to $50. Catalog "$15-35 per session" understates. Maven gives employers aggregate utilization/outcome reports. HIPAA and data-sale terms not confirmed from Maven\'s own policy.', SAFETY_DUE),
    corrections: [
    ],
    facts: {
      'identity.brand': f('Maven Clinic', 'Maven support', 'https://web.archive.org/web/20260217050525/https://support.mavenclinic.com/hc/en-us/articles/34227140983955-How-much-does-an-appointment-cost'),
      'identity.purchase_url': f('https://www.mavenclinic.com/', 'Maven support', 'https://web.archive.org/web/20260217050525/https://support.mavenclinic.com/hc/en-us/articles/34227140983955-How-much-does-an-appointment-cost'),
      'pricing.price': f('Free and unlimited through a sponsoring employer or health plan. Individuals pay per visit, no subscription: NP/midwife $20+ (10 min), physician $40+ (10 min), specialist physician $50+, mental health $70+ (40 min), wellness $25+, coaches $30 to $50+', 'Maven support', 'https://web.archive.org/web/20260217050525/https://support.mavenclinic.com/hc/en-us/articles/34227140983955-How-much-does-an-appointment-cost'),
      'pricing.availability': f('Virtual care via app; mainly offered as an employer or health plan benefit', 'Maven support', 'https://web.archive.org/web/20260217050525/https://support.mavenclinic.com/hc/en-us/articles/34227140983955-How-much-does-an-appointment-cost'),
      'safety.privacy': f('Maven gives employers aggregate reports on program use, engagement and outcomes; information may be shared with in-network providers to coordinate care; chat logs kept as part of the medical record. (Third-party review of the Oct 2024 policy; HIPAA and data-sale terms not confirmed.)', 'terms.law privacy review', 'https://terms.law/Privacy-Watchdog/fertility-tech/maven/', 'research'),
      'safety.regulatory_status': f('Virtual clinic with licensed providers (physicians, NPs, midwives, mental health providers)', 'Maven support', 'https://web.archive.org/web/20260217050525/https://support.mavenclinic.com/hc/en-us/articles/34227140983955-How-much-does-an-appointment-cost'),
      'safety.recalls': f('No regulator action found for Maven (web search, Oct 2026).', 'Web search', 'https://web.archive.org/web/20260217050525/https://support.mavenclinic.com/hc/en-us/articles/34227140983955-How-much-does-an-appointment-cost'),
      'health.intended_use': f('Virtual women\'s and family health care (fertility, pregnancy, postpartum, menopause, mental health, coaching)', 'Maven support', 'https://web.archive.org/web/20260217050525/https://support.mavenclinic.com/hc/en-us/articles/34227140983955-How-much-does-an-appointment-cost'),
    },
  },

  'd-tia': {
    ...head('needs_correction', 'none_found', 'Checked Tia "care at Tia" page. Clinics in New York, California and Arizona plus virtual visits; accepts most major PPO plans (copays/deductibles apply); "Tia Essential" has no membership fee, paid membership price not listed. Catalog "Free-$25/month + insurance" not confirmed. Privacy policy not reviewed.', SAFETY_DUE),
    corrections: [
      { field: 'pricing.price', catalog: 'Free–$25/month + insurance', source_says: 'Tia Essential has no membership fee; paid membership price not listed; most major PPO plans accepted', source_url: 'https://asktia.com/care-at-tia/' },
    ],
    facts: {
      'identity.brand': f('Tia', 'Tia website', 'https://asktia.com/care-at-tia/'),
      'identity.purchase_url': f('https://asktia.com/care-at-tia/', 'Tia website', 'https://asktia.com/care-at-tia/'),
      'pricing.price': f('Tia Essential: no membership fee; paid membership available (price not listed); insurance copays and deductibles apply', 'Tia website', 'https://asktia.com/care-at-tia/'),
      'pricing.availability': f('In-person clinics in New York, California and Arizona; virtual visits', 'Tia website', 'https://asktia.com/care-at-tia/'),
      'safety.regulatory_status': f('Women\'s primary care and gynecology clinic accepting most major PPO plans', 'Tia website', 'https://asktia.com/care-at-tia/'),
      'safety.recalls': f('No regulator action found for Tia (web search, Oct 2026).', 'Web search', 'https://asktia.com/care-at-tia/'),
      'health.intended_use': f('Primary care, gynecology, mental health support, acupuncture, nutrition, labs and more', 'Tia website', 'https://asktia.com/care-at-tia/'),
    },
  },

  'd-betterhelp': {
    ...head('needs_correction', 'none_found', 'Checked BetterHelp pricing page and the FTC final order (July 14, 2023). Price about $70 to $100/week (catalog $65-90), billed weekly or monthly; accepts 125+ insurance plans (avg copay $23); financial aid for some. FTC: $7.8M; alleged sharing of emails, IPs and health questionnaire data with Facebook, Snapchat, Criteo and Pinterest for ads; order bans sharing health data for advertising and requires consent and a privacy program.', SAFETY_DUE),
    corrections: [
      { field: 'pricing.price', catalog: '$65-90/week', source_says: 'About $70 to $100 per week; 125+ insurance plans accepted', source_url: 'https://www.betterhelp.com/advice/psychology/betterhelp-pricing-what-you-can-expect-to-pay-for-therapy/' },
    ],
    facts: {
      'identity.brand': f('BetterHelp (Teladoc Health)', 'Fierce Healthcare', 'https://www.fiercehealthcare.com/health-tech/teladoc-owned-betterhelp-pay-78m-users-alleged-data-misuse-ftc-order', 'research'),
      'identity.purchase_url': f('https://www.betterhelp.com/', 'BetterHelp pricing page', 'https://www.betterhelp.com/advice/psychology/betterhelp-pricing-what-you-can-expect-to-pay-for-therapy/'),
      'pricing.price': f('About $70 to $100 per week, paid weekly or monthly; with insurance (125+ plans) average copay $23 per session; financial aid by application', 'BetterHelp pricing page', 'https://www.betterhelp.com/advice/psychology/betterhelp-pricing-what-you-can-expect-to-pay-for-therapy/'),
      'pricing.availability': f('Online therapy via web and app; insurance coverage varies by state and plan', 'BetterHelp pricing page', 'https://www.betterhelp.com/advice/psychology/betterhelp-pricing-what-you-can-expect-to-pay-for-therapy/'),
      'safety.privacy': f('FTC final order (July 2023, $7.8M): BetterHelp allegedly shared emails, IP addresses and health questionnaire answers with Facebook, Snapchat, Criteo and Pinterest for ads despite privacy promises. Order bans sharing health data for advertising and personal data for retargeting, and requires express consent, a privacy program and deletion by third parties.', 'FTC press release', 'https://www.ftc.gov/news-events/news/press-releases/2023/07/ftc-gives-final-approval-order-banning-betterhelp-sharing-sensitive-health-data-advertising?', 'regulatory'),
      'safety.regulatory_status': f('Online counseling platform matching users with licensed therapists', 'BetterHelp pricing page', 'https://www.betterhelp.com/advice/psychology/betterhelp-pricing-what-you-can-expect-to-pay-for-therapy/'),
      'safety.recalls': f('FTC enforcement action (2023) over health data sharing for advertising; see privacy.', 'FTC press release', 'https://www.ftc.gov/news-events/news/press-releases/2023/07/ftc-gives-final-approval-order-banning-betterhelp-sharing-sensitive-health-data-advertising?', 'regulatory'),
      'health.intended_use': f('Online talk therapy with licensed therapists (messaging, phone, video)', 'BetterHelp pricing page', 'https://www.betterhelp.com/advice/psychology/betterhelp-pricing-what-you-can-expect-to-pay-for-therapy/'),
      'evidence.sources': f([
        { title: 'FTC: final order banning BetterHelp from sharing health data for advertising (2023)', url: 'https://www.ftc.gov/news-events/news/press-releases/2023/07/ftc-gives-final-approval-order-banning-betterhelp-sharing-sensitive-health-data-advertising?', evidence_type: 'regulatory', supports: 'Privacy enforcement history' },
      ], 'FTC', 'https://www.ftc.gov/news-events/news/press-releases/2023/07/ftc-gives-final-approval-order-banning-betterhelp-sharing-sensitive-health-data-advertising?', 'regulatory'),
    },
  },

  'd-headspace': {
    ...head('in_review', 'none_found', 'Checked US App Store listing: free with subscription $12.99/month or $69.99/year (matches catalog), Headspace Plus also listed. App also offers therapy and coaching (pricing varies; insurance partnerships) and an AI companion. App Store label: health, location, contact info, search history and identifiers linked to you. Brand claim "increase happiness and reduce stress in 10 days" is manufacturer information. No regulator action found.', SAFETY_DUE),
    facts: {
      'identity.brand': f('Headspace Inc.', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'identity.purchase_url': f('https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'pricing.price': f('Free download; subscription $12.99/month or $69.99/year (US); therapy and coaching priced separately by subscription', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'pricing.availability': f('iOS App Store (also Android and web)', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'safety.privacy': f('App Store label: health and fitness, purchases, location, contact info, user content, search history, identifiers, usage and diagnostics linked to you. Full privacy policy not reviewed.', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'safety.regulatory_status': f('Wellness (meditation and sleep) app; therapy offered through licensed therapists', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'safety.age_restriction': f('Rated 13+', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'safety.recalls': f('No regulator action found (web search, Oct 2026).', 'Web search', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'health.intended_use': f('Guided meditation, sleep and stress tools, plus coaching and therapy', 'App Store listing', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
      'evidence.claims': f([
        { claim: 'Increases happiness and reduces stress in 10 days', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008', product_specific: true },
      ], 'App Store listing (manufacturer claim)', 'https://apps.apple.com/us/app/headspace-com-meditation-mindfulness/id493145008'),
    },
  },
};
// Products whose catalog entry carries no source links at all: their source
// list is the distinct pages cited by this review.
const EV = { regulatory: 'regulatory', research: 'ingredient_research', clinical_guidance: 'clinical_guideline' };
const EV_LABEL = { regulatory: 'Regulatory information', ingredient_research: 'Ingredient research', clinical_guideline: 'Clinical guideline', manufacturer: 'Manufacturer information' };
const NO_CATALOG_SOURCES = new Set(['p-portable-heating']);
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

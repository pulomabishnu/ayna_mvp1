// Research pass 4 (AI-assisted, sourced). See ../reviews.js for the format.
// Batch 4: apps/trackers, sex tech, menopause telehealth, pads, liners,
// tampons, cups, discs and period underwear. Every fact cites the page it
// came from. Facts not found are left out on purpose (unknown, never "no").

const D = '2026-10-13';
const NEXT = '2026-10-27'; // pricing refresh, REVIEW_INTERVAL_DAYS.pricing = 14
const BY = 'ayna research pass (AI-assisted), needs human sign-off';

/** One sourced fact. */
const f = (value, source, source_url, source_type = 'brand') => ({ value, source, source_url, source_type, verified_at: D });

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

// Reused regulator pages
const FDA = {
  tampons: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/tampons',
  cups: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups',
  pads: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-pads-and-liners',
  cupClass: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfPCD/classification.cfm?ID=HHE',
};

/** FDA guidance facts shared by every tampon. */
const tamponFda = () => ({
  'safety.side_effects': f('Toxic shock syndrome (TSS) is rare but serious and is linked to leaving tampons in too long; symptoms include sudden high fever, vomiting, diarrhea, rash, dizziness or fainting. Remove the tampon and seek care if they appear.', 'FDA: Tampons', FDA.tampons, 'regulatory'),
  'safety.regulatory_status': f('FDA-regulated medical device; tampons must receive FDA authorization before sale (21 CFR 884.5460/884.5470)', 'FDA: Tampons', FDA.tampons, 'regulatory'),
});
const tamponWarnFda = 'FDA: change every 4 to 8 hours, never wear one tampon more than 8 hours, use the lowest absorbency you need; tampons carry a TSS warning.';

/** FDA guidance facts shared by every cup or disc (FDA treats discs as menstrual cups). */
const cupFda = () => ({
  'safety.regulatory_status': f('FDA class II medical device (menstrual cup, 21 CFR 884.5400, product code HHE), 510(k) exempt; makers must register and list with FDA. FDA says a menstrual disc is covered as a menstrual cup.', 'FDA classification database + FDA: Menstrual Cups', FDA.cupClass, 'regulatory'),
});
const cupWarnFda = 'FDA: empty as the label says (typically every 8 to 12 hours); talk to a gynecologist first if you have an IUD; stop and see a provider for itching, rash, pain or swelling; not for non-period bleeding (infection, after pregnancy or childbirth).';

/** FDA guidance facts shared by every pad, liner and period underwear. */
const padFda = () => ({
  'safety.regulatory_status': f('FDA-regulated medical device (menstrual pad); makers must register and list with FDA and meet device labeling rules', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
});
const padWarnFda = 'FDA: change pads every few hours (more often on heavy days); wearing one too long may irritate skin; some people react to scents or other materials; stop and see a provider for itching, rash, pain or swelling.';

const R = {
  // ---------------------------------------------------------------- apps
  'd-calm': {
    ...head('in_review', 'unknown', 'Checked Calm privacy policy (updated Dec 12 2024), a 2026 third-party price breakdown, and the 2019 Calm RCT (PubMed). Catalog "$15/month" differs: monthly plan is $16.99 via app stores; annual $69.99-$79.99. Calm is a wellness app, not a medical device; no recall applies. Privacy policy does not mention HIPAA and says ad activity may count as "sale/sharing" under state laws (opt-out offered).'),
    corrections: [
      { field: 'pricing.price', catalog: '$15/month or $70/year', source_says: '$16.99/month (app stores) or $69.99-$79.99/year; family $99.99/year', source_url: 'https://carepaths.com/calm-app-pricing/' },
    ],
    facts: {
      'pricing.price': f('$16.99/month or $69.99-$79.99/year (7-day free trial on annual); family plan $99.99/year for up to 6', 'Third-party 2026 price breakdown (not Calm)', 'https://carepaths.com/calm-app-pricing/', 'retailer'),
      'pricing.availability': f('iOS App Store, Google Play and web', 'Calm support: yearly subscription', 'https://support.calm.com/hc/en-us/articles/115002473687-How-to-Purchase-a-Yearly-Calm-Premium-Subscription'),
      'safety.privacy': f('Collects sleep data from Apple Health / Health Connect (with permission), moods and check-in reflections, inferred age/gender; says it does not infer health characteristics. Advertising partners use cookies and hashed emails; policy says this may count as "sale" or "sharing" under some state laws and offers opt-out. No HIPAA statement. Does not knowingly sell or share data of under-16s.', 'Calm privacy policy (Dec 12 2024)', 'https://www.calm.com/privacy-policy'),
      'safety.regulatory_status': f('Consumer wellness app (meditation, sleep stories); not an FDA-cleared treatment', 'Calm privacy policy (describes services)', 'https://www.calm.com/privacy-policy'),
      'health.intended_use': f('Guided meditation, sleep stories and relaxation content for stress and sleep (consumer wellness)', 'Calm support', 'https://support.calm.com/hc/en-us/articles/115002473687-How-to-Purchase-a-Yearly-Calm-Premium-Subscription'),
      'evidence.sources': f([
        { title: 'Huberty et al. 2019, Efficacy of the Calm app to reduce stress among college students: RCT (JMIR mHealth uHealth)', url: 'https://pubmed.ncbi.nlm.nih.gov/31237569/', evidence_type: 'product_study', supports: '8-week use of Calm reduced self-reported stress vs waitlist in 88 stressed college students' },
      ], 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/31237569/', 'research'),
      'evidence.claims': f([
        { claim: 'Using Calm for 8 weeks lowered self-reported stress in stressed college students vs waitlist', strength: 'limited', evidence_type: 'product_study', source_url: 'https://pubmed.ncbi.nlm.nih.gov/31237569/', product_specific: true },
      ], 'PubMed', 'https://pubmed.ncbi.nlm.nih.gov/31237569/', 'research'),
    },
  },
  'd-oura': {
    ...head('needs_correction', 'unknown', 'Oura Ring Gen 3 was discontinued in late 2025 and is no longer sold by Oura (Wareable, updated 2026); Oura now sells Ring 4 (from $349) and promotes Ring 5. Catalog "$299 + $6/month" is out of date: membership is $5.99/month or $69.99/year. Oura says the ring is not a medical device. Checked Oura privacy blog (Aug 2025), Oura FSA/HSA article (modified Oct 8 2026) and Oura ovulation validation summary (JMIR 2025). No FDA recall search applicable to a non-device wellness wearable; no recall found in news.'),
    corrections: [
      { field: 'pricing.availability', catalog: 'Oura Ring Gen 3 listed as current', source_says: 'Ring 3 discontinued late 2025, no longer sold directly by Oura; Ring 4 from $349', source_url: 'https://www.wareable.com/wearable-tech/oura-ring-4-vs-ring-3-key-differences-compared' },
      { field: 'pricing.price', catalog: '$299 + $6/month', source_says: 'Ring 4 from $349; membership $5.99/month or $69.99/year', source_url: 'https://www.wareable.com/wearable-tech/oura-ring-4-vs-ring-3-key-differences-compared' },
    ],
    facts: {
      'identity.variant': f('Oura Ring Gen 3 (discontinued); current models Oura Ring 4 / Ring 4 Ceramic, Ring 5 promoted', 'Wareable + Oura blog navigation', 'https://www.wareable.com/wearable-tech/oura-ring-4-vs-ring-3-key-differences-compared', 'retailer'),
      'pricing.price': f('Ring 4 from $349 (gold/rose gold $499) plus membership $5.99/month or $69.99/year; Gen 3 only via resellers', 'Wareable (third party, updated 2026)', 'https://www.wareable.com/wearable-tech/oura-ring-4-vs-ring-3-key-differences-compared', 'retailer'),
      'pricing.availability': f('Gen 3 discontinued late 2025; no longer sold directly by Oura', 'Wareable (third party, updated 2026)', 'https://www.wareable.com/wearable-tech/oura-ring-4-vs-ring-3-key-differences-compared', 'retailer'),
      'pricing.fsa_hsa': f('Ring and membership are FSA/HSA reimbursable for purchases from 2023 on (per brand); pay with FSA/HSA card or submit receipt; depends on your plan', 'Oura blog: Oura Ring FSA/HSA', 'https://ouraring.com/blog/?p=936723'),
      'safety.regulatory_status': f('Oura says the ring is not a medical device and is not intended to diagnose, treat, cure, monitor or prevent disease', 'Oura ovulation validation summary', 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis'),
      'safety.privacy': f('Oura says member data is not for sale, it will never sell or rent health data (including to government), will not share sensitive data with third parties without explicit consent, and will oppose legal requests used for individual surveillance or prosecution.', 'Oura blog: health data privacy (Aug 2025)', 'https://ouraring.com/blog/health-data-privacy/'),
      'safety.warnings': f('Not a medical device; not intended to diagnose, treat, cure, monitor or prevent medical conditions (per brand)', 'Oura ovulation validation summary', 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis'),
      'health.intended_use': f('Wellness wearable for sleep, activity, heart rate and skin-temperature trends, including cycle and ovulation insights', 'Oura validation summary', 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis'),
      'evidence.sources': f([
        { title: 'Oura ovulation detection validation (JMIR, Jan 31 2025), Oura summary', url: 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis', evidence_type: 'product_study', supports: '1,155 cycles / 964 people: temperature algorithm detected 96.4% of ovulations, mean error 1.26 days, vs calendar method (manufacturer-run study)' },
      ], 'Oura resources', 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis'),
      'evidence.claims': f([
        { claim: 'Ring temperature data estimates ovulation day more accurately than the calendar method (retrospective)', strength: 'moderate', evidence_type: 'product_study', source_url: 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis', product_specific: true },
      ], 'Oura resources', 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis'),
    },
  },
  'd-apple-health': {
    ...head('in_review', 'unknown', 'Checked apple.com/health and Apple Health Privacy Overview (May 2023 PDF). Free on iPhone; ovulation estimates need Apple Watch Series 8+/SE 3/Ultra. Apple says not for birth control or diagnosis. No recall applicable (software feature).'),
    facts: {
      'identity.variant': f('Cycle Tracking in the built-in Health app (iPhone; Apple Watch optional for wrist temperature)', 'Apple Health page', 'https://www.apple.com/nz/health/'),
      'pricing.price': f('Free, built into iPhone Health app', 'Apple Health page', 'https://www.apple.com/nz/health/'),
      'safety.warnings': f('Apple says Cycle Tracking should not be used for birth control or to diagnose a health condition; wrist temperature is not intended for medical use.', 'Apple Health page', 'https://www.apple.com/nz/health/'),
      'safety.regulatory_status': f('Consumer software feature; Apple says not for medical use or contraception (no FDA clearance mentioned)', 'Apple Health page', 'https://www.apple.com/nz/health/'),
      'safety.privacy': f('Health data encrypted on device; with two-factor auth it is end-to-end encrypted in iCloud and Apple says it cannot read it. Cycle predictions are computed on device. Never shared with third parties without explicit permission; HealthKit apps may not use data for ads or sell it to data brokers.', 'Apple Health Privacy Overview (May 2023)', 'https://apple.com.cn/health/pdf/Health_Privacy_Overview_May_2023.pdf'),
      'health.intended_use': f('Log periods, symptoms and cycle factors; period and fertile-window predictions; cycle deviation alerts; perimenopause notifications for 40+; pregnancy tracking; retrospective ovulation estimates with Apple Watch wrist temperature', 'Apple Health page', 'https://www.apple.com/nz/health/'),
      'evidence.sources': f([
        { title: 'Apple Health: Cycle Tracking overview', url: 'https://www.apple.com/nz/health/', evidence_type: 'manufacturer', supports: 'Features, Women\'s Health Study input to predictions, not-for-contraception statement' },
      ], 'Apple Health page', 'https://www.apple.com/nz/health/'),
      'evidence.claims': f([
        { claim: 'Wrist temperature gives a retrospective ovulation estimate', strength: 'limited', evidence_type: 'manufacturer', source_url: 'https://www.apple.com/nz/health/', product_specific: true },
      ], 'Apple Health page', 'https://www.apple.com/nz/health/'),
    },
  },
  'd-peanut': {
    ...head('in_review', 'unknown', 'Checked the App Store listing (price, age rating, privacy label). Free with optional Peanut Plus in-app purchases. Rated 18+. App Store privacy label says Purchases and Sensitive Info may be used to track users and lists Sensitive Info among data linked to identity (developer-provided, not verified by Apple). Brand site (peanut-app.io) could not be opened from this environment. Community app, not a medical service; no recall applicable.'),
    facts: {
      'identity.purchase_url': f('https://apps.apple.com/app/peanut-find-friends-support/id1178656034', 'App Store listing', 'https://apps.apple.com/app/peanut-find-friends-support/id1178656034', 'retailer'),
      'pricing.price': f('Free to download; optional Peanut Plus in-app purchases listed at $8.99, $14.99 and $29.99', 'App Store listing', 'https://apps.apple.com/app/id1178656034', 'retailer'),
      'pricing.availability': f('iOS App Store (seller: Peanut App Limited)', 'App Store listing', 'https://apps.apple.com/app/id1178656034', 'retailer'),
      'safety.age_restriction': f('App Store rating 18+', 'App Store listing', 'https://apps.apple.com/app/id1178656034', 'retailer'),
      'safety.privacy': f('App Store privacy label (developer-reported): Purchases and Sensitive Info "used to track you"; data linked to you includes location, contact info, user content, search history, identifiers, usage, sensitive info and diagnostics, used for developer advertising/marketing, analytics and personalization.', 'App Store privacy label', 'https://apps.apple.com/app/id1178656034', 'retailer'),
      'safety.warnings': f('User-generated community content and messaging with strangers; App Store lists content controls for messaging, user-generated content and health topics. Not medical advice.', 'App Store listing', 'https://apps.apple.com/app/id1178656034', 'retailer'),
      'safety.regulatory_status': f('Social/community app; not a medical service', 'App Store listing', 'https://apps.apple.com/app/id1178656034', 'retailer'),
      'health.intended_use': f('Community app to find local mom friends, ask questions and get peer support', 'App Store listing', 'https://apps.apple.com/app/id1178656034', 'retailer'),
    },
  },
  'p-gennev-care': {
    ...head('needs_clinician_review', 'unknown', 'Checked Gennev plans page, How Gennev works page and privacy policy (updated Jan 1 2024). Catalog "$199/consult" is the doctor follow-up price; the initial doctor visit is $250 self-pay. Insurance in-network with Aetna, Anthem, UHC and others. Prescribes hormone therapy, so clinician review. Gennev says it is a HIPAA-covered provider; the website privacy policy uses advertising cookies (interest-based ads).'),
    corrections: [
      { field: 'pricing.price', catalog: '$199/consult', source_says: 'Doctor initial visit $250, follow-up $199 (self-pay); dietitian $199 initial / $119 follow-up; insurance accepted', source_url: 'https://gennev.com/plans' },
    ],
    facts: {
      'identity.purchase_url': f('https://gennev.com/plans', 'Gennev plans page', 'https://gennev.com/plans'),
      'identity.variant': f('Virtual menopause care: 30-minute visits with menopause-trained doctors, plus dietitians, health coaching and mental health care', 'How Gennev works', 'https://www.gennev.com/how-gennev-works'),
      'pricing.price': f('Self-pay: doctor initial $250, follow-up $199; dietitian initial $199, follow-up $119. Insured: usual copay/deductible', 'Gennev plans page', 'https://gennev.com/plans'),
      'pricing.availability': f('Video visits in all 50 states; in-network with Aetna, Anthem, S&S Healthcare and United/UHC; Cigna, EmblemHealth and GHI out-of-network', 'Gennev plans page', 'https://gennev.com/plans'),
      'composition.ingredients': f('Telehealth service; doctors may prescribe hormone therapy or FDA-approved non-hormonal medications and recommend supplements', 'Gennev plans page', 'https://gennev.com/plans'),
      'safety.privacy': f('Gennev says it is a healthcare provider that must comply with HIPAA; health information is covered by a separate Notice of Privacy Practices. Website policy: uses advertising cookies for interest-based ads (opt-out offered); does not currently disclose personal info to third parties for their direct marketing.', 'Gennev privacy policy (Jan 1 2024)', 'https://gennev.com/legal/privacy-policy'),
      'safety.regulatory_status': f('Telehealth medical practice with licensed, board-certified doctors (per brand)', 'How Gennev works', 'https://www.gennev.com/how-gennev-works'),
      'safety.medication_interactions': f('Prescriptions are made by a clinician after a health history questionnaire and visit; follow-ups review dosing (per brand). Share all medications with the doctor.', 'How Gennev works', 'https://www.gennev.com/how-gennev-works'),
      'health.intended_use': f('Care for perimenopause through post-menopause symptoms: doctor visits, prescriptions (including HRT), nutrition and coaching', 'Gennev plans page', 'https://gennev.com/plans'),
    },
  },
  // ------------------------------------------------------------ sex tech
  'p-maude-vibe': {
    ...head('in_review', 'unknown', 'Checked Free People listing ($52, specs) and a Shopify retailer listing carrying Maude product copy. Brand site getmaude.com could not be opened from this environment. Runtime claims differ slightly between retailers (Free People: up to 2.5 h; other retailer: 45 min high / 1.5 h low). Personal massager, not marketed as a medical device; no recall found in a web search.'),
    facts: {
      'identity.variant': f('Maude Vibe external personal massager (3 speeds, USB rechargeable), one size', 'Free People listing', 'https://www.freepeople.com/shop/maude-vibe/?color=004', 'retailer'),
      'pricing.price': f('$52', 'Free People listing', 'https://www.freepeople.com/shop/maude-vibe/?color=004', 'retailer'),
      'pricing.size_count': f('1 device, about 1.54 in diameter x 4.87 in long, with canvas pouch', 'Retailer listing (Maude copy)', 'https://pinkarrowboutique.com/products/vibe-personal-massager', 'retailer'),
      'pricing.availability': f('Sold by Maude and retailers including Free People and Bloomingdale\'s', 'Free People + Bloomingdale\'s listings', 'https://www.bloomingdales.com/shop/product/maude-vibe-personal-massager?ID=4016669', 'retailer'),
      'composition.ingredients': f('100% platinum-grade silicone body; lithium-ion battery; canvas pouch. Listed as phthalate- and latex-free.', 'Free People listing', 'https://www.freepeople.com/shop/maude-vibe/?color=004', 'retailer'),
      'composition.allergens': f('Listed as latex-free and phthalate-free', 'Free People listing', 'https://www.freepeople.com/shop/maude-vibe/?color=004', 'retailer'),
      'safety.warnings': f('Water-resistant only: do not fully submerge. Use water-based lube only; silicone and oil lubes degrade the silicone. Clean before and after each use with mild unscented soap and water.', 'Retailer listing (Maude copy)', 'https://pinkarrowboutique.com/products/vibe-personal-massager', 'retailer'),
      'health.intended_use': f('External personal massager for sexual pleasure', 'Free People listing', 'https://www.freepeople.com/shop/maude-vibe/?color=004', 'retailer'),
    },
  },
  // ------------------------------------------------------- cups and discs
  'p-intimina-lily': {
    ...head('in_review', 'none_found', 'Checked Period Nirvana listing (Intimina copy, $30, sizes A/B, both sold out there), FDA menstrual cup classification and FDA device database (no recalls listed under product code HHE). Brand site intimina.com did not surface in search. Catalog does not say size A or B or Lily Cup vs Lily Cup Compact; variant is ambiguous.'),
    facts: {
      'identity.variant': f('Lily Cup, size A (under 30, no full-term birth) or size B (over 30 or after full-term birth); catalog does not specify. Separate Lily Cup Compact line exists.', 'Period Nirvana listing (Intimina copy)', 'https://shop.periodnirvana.com/products/lily-cup-by-intimina', 'retailer'),
      'pricing.price': f('$30', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/lily-cup-by-intimina', 'retailer'),
      'pricing.size_count': f('1 reusable cup (size A or B)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/lily-cup-by-intimina', 'retailer'),
      'pricing.availability': f('Both sizes showed sold out at Period Nirvana on check date; also sold by Natural Cycles shop, Thrive Market and others', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/lily-cup-by-intimina', 'retailer'),
      'composition.ingredients': f('Medical-grade silicone', 'Period Nirvana listing (Intimina copy)', 'https://shop.periodnirvana.com/products/lily-cup-by-intimina', 'retailer'),
      'safety.warnings': f(`Wear up to 12 hours; empty more often on heavy days. IUD users: keep strings out of the way and do not pull them on removal. Boil monthly. ${cupWarnFda}`, 'Period Nirvana listing + FDA: Menstrual Cups', FDA.cups, 'regulatory'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE (menstrual cup) in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow', 'FDA menstrual cup definition', FDA.cupClass, 'regulatory'),
    },
  },
  'p-hello-disc': {
    ...head('in_review', 'none_found', 'Checked Period Nirvana listing ($38, 50 mL, all colors sold out there), Hello listing on theperiod.co (68 mm, 50 mL), NIH AccessGUDID (Hello Cup Company, product code HHE, non-latex) and FDA device database (no HHE recalls). Catalog price $38 matches.'),
    facts: {
      'identity.variant': f('Hello Disc, one size (68 mm diameter, 48 mm loop tab), reusable', 'Hello Menstrual Disc listing (The Period Co)', 'https://www.theperiod.co/products/hello-menstrual-disc', 'retailer'),
      'pricing.price': f('$38', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/cups-and-discs/products/hello-disc', 'retailer'),
      'pricing.size_count': f('1 reusable disc; holds 50 mL (brand: about 3-5 tampons)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/cups-and-discs/products/hello-disc', 'retailer'),
      'pricing.availability': f('All colors showed sold out at Period Nirvana on check date; also sold at Target and Hello stores', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/cups-and-discs/products/hello-disc', 'retailer'),
      'composition.ingredients': f('Medical-grade silicone (listed as BPA-free); device record says non-latex', 'Period Nirvana listing + NIH AccessGUDID', 'https://accessgudid.nlm.nih.gov/devices/09421907199177', 'regulatory'),
      'composition.allergens': f('Non-latex (FDA GUDID device record)', 'NIH AccessGUDID', 'https://accessgudid.nlm.nih.gov/devices/09421907199177', 'regulatory'),
      'safety.warnings': f(`Up to 12 hours; empty more often on heavy days. A very low cervix may need a smaller disc. Brand says it can be worn with an IUD. ${cupWarnFda}`, 'Period Nirvana listing + FDA: Menstrual Cups', FDA.cups, 'regulatory'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow (disc sits under the pubic bone)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/cups-and-discs/products/hello-disc', 'retailer'),
    },
  },
  'p-saalt-disc': {
    ...head('in_review', 'none_found', 'Checked Saalt product page ($35, Regular 66 mm/50 mL, Small 56 mm/30 mL, both sold out on check date) and FDA device database (no HHE recalls). Catalog does not name the size.'),
    facts: {
      'identity.variant': f('Saalt Disc Regular (66 mm, 50 mL, normal-heavy flow) or Small (56 mm, 30 mL, light-normal); catalog does not specify', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
      'identity.purchase_url': f('https://saalt.com/products/saalt-disc', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
      'pricing.price': f('$35 (either size)', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
      'pricing.size_count': f('1 reusable disc + carry bag; reusable up to 10 years (per brand)', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
      'pricing.availability': f('Both sizes showed sold out on saalt.com on check date; a two-pack (Saalt Disc Duo) is listed separately', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
      'composition.ingredients': f('100% medical-grade silicone; made in the USA', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
      'composition.allergens': f('Listed as BPA-free and latex-free', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
      'safety.warnings': f(`Up to 12 hours. Replace if you see tearing or silicone breakdown. Boil 4-5 minutes (not more than 7) to sanitize. Brand says it can be worn with an IUD when used as directed. ${cupWarnFda}`, 'Saalt product page + FDA: Menstrual Cups', FDA.cups, 'regulatory'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow, day or night', 'Saalt product page', 'https://saalt.com/products/saalt-disc'),
    },
  },
  // ----------------------------------------------------- period underwear
  'p-knix-underwear': {
    ...head('needs_correction', 'none_found', 'Catalog "Knix Leakproof Underwear" does not name a style or absorbency (Knix sells Light, Super Leakproof, Overnight, cotton lines). Used Super Leakproof No-Show High Rise on knix.ca as the reference: CA$36, absorbs about 6 super tampons; its gusset is modal, Supima cotton, polyester and nylon/spandex with PBT backing, so the catalog "Polyester gusset" is incomplete. US price not confirmed (knix.com did not surface). Knix settled a class action ($1.4M) over claims its products were 100% PFAS-free (Consumer Action). No recall found.'),
    corrections: [
      { field: 'identity.variant', catalog: 'Knix Leakproof Underwear (no style/absorbency)', source_says: 'Knix sells several absorbencies (Light about 1 regular tampon; Super Leakproof about 6 super tampons); style must be chosen', source_url: 'https://knix.ca/products/super-leakproof-no-show-high-rise' },
      { field: 'composition.ingredients', catalog: 'Nylon, Spandex, Polyester gusset.', source_says: 'Body 70% nylon/30% spandex; gusset modal/nylon/spandex, 100% Supima cotton, 100% polyester, nylon/spandex with PBT back (Super Leakproof High Rise)', source_url: 'https://knix.ca/products/super-leakproof-no-show-high-rise' },
    ],
    facts: {
      'identity.variant': f('Reference style: Super Leakproof No-Show High Rise (heavy; about 6 super tampons). Catalog style unspecified.', 'Knix product page (knix.ca)', 'https://knix.ca/products/super-leakproof-no-show-high-rise'),
      'pricing.price': f('CA$36 per pair on knix.ca (3+ save 15%, 5+ save 20%); US price not checked', 'Knix product page (knix.ca)', 'https://knix.ca/products/super-leakproof-no-show-high-rise'),
      'pricing.size_count': f('1 pair; sizes XS to 4XL', 'Knix product page (knix.ca)', 'https://knix.ca/products/super-leakproof-no-show-high-rise'),
      'composition.ingredients': f('Body 70% nylon, 30% spandex. Gusset: 88% modal/2% nylon/10% spandex; 100% Supima cotton; 100% polyester; 85% nylon/15% spandex face with polybutylene terephthalate back', 'Knix product page (knix.ca)', 'https://knix.ca/products/super-leakproof-no-show-high-rise'),
      'safety.warnings': f(`Machine wash cold, gentle; no bleach, fabric softener, dryer heat or ironing. ${padWarnFda}`, 'Knix product page + FDA: Pads and Liners', 'https://knix.ca/products/super-leakproof-no-show-high-rise'),
      'safety.recalls': f('No recall found. Separate matter: Knix settled a $1.4M class action alleging its "PFAS-free" marketing was misleading (purchases 2020-2022).', 'Consumer Action lawsuit summary', 'https://www.consumer-action.org/lawsuits/article/knix-wear', 'regulatory'),
      ...padFda(),
      'health.intended_use': f('Reusable absorbent underwear for periods and light bladder leaks', 'Knix product page (knix.ca)', 'https://knix.ca/products/leak-proof-high-rise'),
    },
  },
  'p-bambody-underwear': {
    ...head('in_review', 'unknown', 'Bambody is sold mainly on Amazon (blocked here); no brand site found. Only a 2022 BestReviews roundup describes it (bamboo and spandex, XS-4XL). Catalog lists "bamboo viscose, spandex, cotton"; cotton not confirmed. Price and pack size not confirmed. No recall search result found.'),
    facts: {
      'composition.ingredients': f('Bamboo and spandex blend (third-party roundup; cotton not confirmed)', 'BestReviews roundup (2022)', 'https://bestreviews.com/beauty-and-personal-care/tampons-pads-cups/best-menstrual-underwear', 'retailer'),
      'pricing.size_count': f('Sizes XS to 4XL; pack size not confirmed', 'BestReviews roundup (2022)', 'https://bestreviews.com/beauty-and-personal-care/tampons-pads-cups/best-menstrual-underwear', 'retailer'),
      'pricing.availability': f('Sold via Amazon', 'BestReviews roundup (2022)', 'https://bestreviews.com/beauty-and-personal-care/tampons-pads-cups/best-menstrual-underwear', 'retailer'),
      'safety.warnings': f(padWarnFda, 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      'health.intended_use': f('Reusable absorbent period underwear', 'BestReviews roundup (2022)', 'https://bestreviews.com/beauty-and-personal-care/tampons-pads-cups/best-menstrual-underwear', 'retailer'),
    },
  },
  'p-dame-arc': {
    ...head('in_review', 'unknown', 'Brand site dame.com did not surface in search. Checked Superdrug UK listing (specs; main listing no longer available online) and a Refinery29 shop listing ($115 at Anthropologie). Catalog $119 vs $115 seen: prices vary by retailer, not a correction. No recall found in a web search.'),
    facts: {
      'identity.variant': f('Dame Arc G-spot vibrator, USB-C rechargeable, 5 intensities x 5 patterns', 'Superdrug listing', 'https://www.superdrug.com/health/sexual-health/vibrators-adult-toys/vibrators/dame-arc-g-spot-vibrator/p/mp-00513148', 'retailer'),
      'pricing.price': f('$115 at Anthropologie (retailer; varies)', 'Refinery29 shop listing', 'https://www.refinery29.com/en-us/shop/product/dame-arc-vibrator-10050594', 'retailer'),
      'pricing.size_count': f('1 device', 'Superdrug listing', 'https://www.superdrug.com/health/sexual-health/vibrators-adult-toys/vibrators/dame-arc-g-spot-vibrator/p/mp-00513148', 'retailer'),
      'composition.ingredients': f('Body-safe medical-grade silicone', 'Superdrug listing', 'https://www.superdrug.com/health/sexual-health/vibrators-adult-toys/vibrators/dame-arc-g-spot-vibrator/p/mp-00513148', 'retailer'),
      'safety.warnings': f('Fully charge before first use. Listed as 100% waterproof. No other safety warnings were listed by the retailer.', 'Superdrug listing', 'https://www.superdrug.com/health/sexual-health/vibrators-adult-toys/vibrators/dame-arc-g-spot-vibrator/p/mp-00513148', 'retailer'),
      'health.intended_use': f('Internal G-spot vibrator for sexual pleasure', 'Superdrug listing', 'https://www.superdrug.com/health/sexual-health/vibrators-adult-toys/vibrators/dame-arc-g-spot-vibrator/p/mp-00513148', 'retailer'),
    },
  },
  'p-lelo-sona': {
    ...head('needs_correction', 'unknown', 'Catalog name "SONA Cruise" points to the first-generation model; retailers now list SONA 2 Cruise (12 modes, sonic waves, 2-year warranty). Checked Lookfantastic AU (specs, sold out) and a Refinery29 shop listing ($99.99 sale from $158.99 at Ella Paradis). Catalog $129 not confirmed. No recall found in a web search.'),
    corrections: [
      { field: 'identity.variant', catalog: 'LELO SONA Cruise', source_says: 'Current retail model is LELO SONA 2 Cruise', source_url: 'https://lookfantastic.com.au/products/lelo-sona-2-cruise-various-shades' },
    ],
    facts: {
      'identity.variant': f('LELO SONA 2 Cruise sonic clitoral massager (12 modes, Cruise Control)', 'Lookfantastic listing', 'https://lookfantastic.com.au/products/lelo-sona-2-cruise-various-shades', 'retailer'),
      'pricing.price': f('$99.99 sale (list $158.99) at Ella Paradis; varies by retailer', 'Refinery29 shop listing', 'https://www.refinery29.com/en-us/shop/product/lelo-sona-2-cruise-10504255', 'retailer'),
      'pricing.size_count': f('1 device, 99 x 87 x 56 mm, 116 g', 'Lookfantastic listing', 'https://lookfantastic.com.au/products/lelo-sona-2-cruise-various-shades', 'retailer'),
      'composition.ingredients': f('ABS plastic and silicone; Li-ion battery (up to 1 hour use, 90 days standby)', 'Lookfantastic + Refinery29 listings', 'https://lookfantastic.com.au/products/lelo-sona-2-cruise-various-shades', 'retailer'),
      'safety.warnings': f('Use water-based lube. If stimulation is too intense, take a break or use next to rather than on the clitoris. Clean with soap and water before and after use. 2-year warranty.', 'Lookfantastic + Refinery29 listings', 'https://lookfantastic.com.au/products/lelo-sona-2-cruise-various-shades', 'retailer'),
      'health.intended_use': f('External sonic clitoral stimulator for sexual pleasure', 'Refinery29 shop listing', 'https://www.refinery29.com/en-us/shop/product/lelo-sona-2-cruise-10504255', 'retailer'),
    },
  },
  'p-mystery-vibe': {
    ...head('needs_clinician_review', 'unknown', 'Checked MysteryVibe Crescendo 2 page and FAQ. Regular price $329 (sale $165 on check date); catalog $229 matches neither. Brand says all MV devices are FDA-registered Class II therapeutic vibrators (21 CFR 884.5960, KXQ) for erectile dysfunction and not cleared for any other condition, while Crescendo 2 is marketed for arousal, lubrication and pelvic wellness with "clinically proven / 95% efficacy" badges and no cited study: clinician review of claims. FSA/HSA eligible per brand.'),
    corrections: [
      { field: 'pricing.price', catalog: '$229', source_says: '$329 regular, $165 on sale (Oct 2026)', source_url: 'https://mysteryvibe.com/pages/crescendo2-health' },
    ],
    facts: {
      'identity.variant': f('Crescendo 2 bendable smart vibrator', 'MysteryVibe Crescendo 2 page', 'https://mysteryvibe.com/pages/crescendo2-health'),
      'pricing.price': f('$329 regular; $165 sale on check date', 'MysteryVibe Crescendo 2 page', 'https://mysteryvibe.com/pages/crescendo2-health'),
      'pricing.fsa_hsa': f('FSA/HSA eligible, no prescription needed (per brand)', 'MysteryVibe Crescendo 2 page', 'https://mysteryvibe.com/pages/crescendo2-health'),
      'composition.ingredients': f('Body-safe silicone', 'MysteryVibe Crescendo 2 page', 'https://mysteryvibe.com/pages/crescendo2-health'),
      'safety.regulatory_status': f('Brand: MV devices are FDA-registered Class II therapeutic vibrators (21 CFR 884.5960, product code KXQ) for erectile dysfunction; not cleared or approved for any other condition', 'MysteryVibe FAQ', 'https://mysteryvibe.com/faq'),
      'safety.warnings': f('Water-resistant, shower-safe, do not submerge for long periods. Use water-based lube. 24-month warranty only when bought from mysteryvibe.com. Not cleared to treat any condition other than erectile dysfunction (per brand).', 'MysteryVibe Crescendo 2 page + FAQ', 'https://mysteryvibe.com/pages/crescendo2-health'),
      'health.intended_use': f('Manufacturer: for adults to boost arousal and intimacy, support natural lubrication and pelvic wellness', 'MysteryVibe Crescendo 2 page (manufacturer claims)', 'https://mysteryvibe.com/pages/crescendo2-health'),
      'evidence.claims': f([
        { claim: '"Clinically proven", "95% efficacy" (manufacturer badges; no study named on the page)', strength: 'none', evidence_type: 'manufacturer', source_url: 'https://mysteryvibe.com/pages/crescendo2-health', product_specific: true },
      ], 'MysteryVibe Crescendo 2 page', 'https://mysteryvibe.com/pages/crescendo2-health'),
    },
  },
  // --------------------------------------------------------------- pads
  'p-kotex-security': {
    ...head('needs_correction', 'none_found', 'H-E-B lists "Kotex Security Ultra Thin Regular Pads with Wings" 18 ct at $4.18 but "not sold at store"; the current line on shelves is "Kotex Ultra Thin Pads with Wings, Regular" 36 ct at $6.99 (made without fragrance, FSA/HSA eligible, partial ingredient list). Catalog "$7 for 24" matches neither count. FDA recall Z-1182-2026 (Gold Star Distribution, MN, rodent exposure in a distributor warehouse) covered Kotex Freedom Maxi only, not this pad. No manufacturer recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$7 for 24', source_says: 'Kotex Security Ultra Thin Regular w/ Wings 18 ct $4.18 (not sold in store); current Kotex Ultra Thin Regular w/ Wings 36 ct $6.99 at H-E-B', source_url: 'https://www.heb.com/product-detail/kotex-ultra-thin-pads-with-wings-regular-absorbency/16041052' },
    ],
    facts: {
      'identity.variant': f('Kotex Ultra Thin Pads with Wings, Regular absorbency, unscented (successor shelf name for Kotex Security Ultra Thin Regular)', 'H-E-B listing', 'https://www.heb.com/product-detail/kotex-ultra-thin-pads-with-wings-regular-absorbency/16041052', 'retailer'),
      'pricing.price': f('$6.99 for 36 at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/kotex-ultra-thin-pads-with-wings-regular-absorbency/16041052', 'retailer'),
      'pricing.size_count': f('36 pads (Security-branded 18 ct also listed)', 'H-E-B listings', 'https://www.heb.com/product-detail/kotex-security-ultra-thin-regular-pads-with-wings/115530', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'H-E-B listing', 'https://www.heb.com/product-detail/kotex-ultra-thin-pads-with-wings-regular-absorbency/16041052', 'retailer'),
      'composition.ingredients': f('Includes cellulose, polyethylene, polyester, polypropylene, sodium polyacrylate, polymers, surfactants, phosphates and pigments such as titanium dioxide; free of elemental chlorine (partial list as shown by retailer)', 'H-E-B listing', 'https://www.heb.com/product-detail/kotex-ultra-thin-pads-with-wings-regular-absorbency/16041052', 'retailer'),
      'composition.fragrance': f('Made without fragrance', 'H-E-B listing', 'https://www.heb.com/product-detail/kotex-ultra-thin-pads-with-wings-regular-absorbency/16041052', 'retailer'),
      'composition.allergens': f('Security-branded listing: not made with natural rubber latex, hypoallergenic, no fragrance or lotion added', 'H-E-B listing', 'https://www.heb.com/product-detail/kotex-security-ultra-thin-regular-pads-with-wings/115530', 'retailer'),
      'safety.warnings': f(padWarnFda, 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      ...padFda(),
      'safety.recalls': f('No manufacturer recall found. FDA recall Z-1182-2026 (Jan 2026) covered other Kotex/Always/Stayfree/Tampax items stocked by one Minnesota distributor (rodent exposure), not this pad.', 'FDA recall database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Disposable pad for regular menstrual flow', 'H-E-B listing', 'https://www.heb.com/product-detail/kotex-ultra-thin-pads-with-wings-regular-absorbency/16041052', 'retailer'),
    },
  },
  'p-u-kotex-pad': {
    ...head('needs_correction', 'none_found', 'H-E-B lists U by Kotex CleanWear Ultra Thin Regular Pads with Wings, 32 ct, $7.29, unscented, FSA/HSA eligible, full ingredient list (not sold in the checked store). Catalog "$8 for 18" count not confirmed. Not in the Jan 2026 distributor recall. No manufacturer recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$8 for 18', source_says: '$7.29 for 32 at H-E-B', source_url: 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030' },
    ],
    facts: {
      'identity.variant': f('U by Kotex CleanWear Ultra Thin Regular Pads with Wings, unscented', 'H-E-B listing', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
      'pricing.price': f('$7.29 for 32 at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
      'pricing.size_count': f('32 pads', 'H-E-B listing', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA/HRA eligible', 'H-E-B listing', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
      'pricing.availability': f('Listed at H-E-B but not sold at the checked store (find in-stock nearby)', 'H-E-B listing', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
      'composition.ingredients': f('Wood pulp, polypropylene, polyethylene, hydrocarbon resin, sodium polyacrylate, pigment white 6, styrene/isoprene copolymer, water, hydrogenated mineral oil, synthetic beeswax, tris(2,4-ditert-butylphenyl) phosphite, kaolin, PEG-10 castor oil, PEG-15 cocoate, diethylhexyl sodium sulfosuccinate, sorbitan oleate, pigment red 122, solvent blue 104, PEG-10 oleate, pigment black 7, pigment violet 23, pigment blue 15', 'H-E-B listing (label text)', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
      'composition.fragrance': f('Unscented', 'H-E-B listing', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
      'safety.warnings': f(padWarnFda, 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      ...padFda(),
      'safety.recalls': f('No manufacturer recall found; not listed in FDA recall Z-1182-2026 (Jan 2026 distributor recall).', 'FDA recall database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Disposable pad for regular menstrual flow', 'H-E-B listing', 'https://www.heb.com/product-detail/u-by-kotex-cleanwear-ultra-thin-regular-feminine-pads-with-wings/1428030', 'retailer'),
    },
  },
  'p-stayfree-ultra': {
    ...head('needs_correction', 'none_found', 'Checked Stayfree product page (Ultra Thin Regular with Wings, 36 ct, ingredients, warning) and H-E-B ($6.38 for 36, FSA/HSA, label ingredients). Catalog "$6 for 24" count not confirmed. Brand page does not say scented or unscented; ingredients include an "odor neutralizer" (ethylene brassylate, a musk-type aroma chemical) so fragrance-free cannot be assumed. FDA recall Z-1182-2026 covered "Stay Free Reg./Super" stock at one Minnesota distributor only (rodent exposure); no manufacturer recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$6 for 24', source_says: '$6.38 for 36 at H-E-B', source_url: 'https://www.heb.com/product-detail/stayfree-ultra-thin-regular-pads-with-wings-36-ct/1588020' },
    ],
    facts: {
      'identity.variant': f('Stayfree Ultra Thin Regular Pads with Wings (light to moderate flow)', 'Stayfree product page', 'https://stayfree.com/products/stayfree-ultra-thin-pads-regular-with-wings'),
      'identity.purchase_url': f('https://stayfree.com/products/stayfree-ultra-thin-pads-regular-with-wings', 'Stayfree product page', 'https://stayfree.com/products/stayfree-ultra-thin-pads-regular-with-wings'),
      'pricing.price': f('$6.38 for 36 at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/stayfree-ultra-thin-regular-pads-with-wings-36-ct/1588020', 'retailer'),
      'pricing.size_count': f('36 pads', 'Stayfree product page', 'https://stayfree.com/products/stayfree-ultra-thin-pads-regular-with-wings'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'H-E-B listing', 'https://www.heb.com/product-detail/stayfree-ultra-thin-regular-pads-with-wings-36-ct/1588020', 'retailer'),
      'composition.ingredients': f('Cellulose, polyethylene, polypropylene, sodium polyacrylate, vinyl acetate-ethylene, hydrocarbon resin, polyethylene terephthalate, naphthenic oil, titanium dioxide, styrene isoprene styrene copolymer, dioctyl sodium sulfosuccinate, silica, pentaerythritol tetrakis, butylated hydroxytoluene, ethylene brassylate, triethyl citrate', 'Stayfree product page', 'https://stayfree.com/products/stayfree-ultra-thin-pads-regular-with-wings'),
      'composition.fragrance': f('Not labeled scented or unscented; contains an odor neutralizer (ethylene brassylate, phenoxyethanol, triethyl citrate per retailer label text)', 'H-E-B listing + Stayfree page', 'https://www.heb.com/product-detail/stayfree-ultra-thin-regular-pads-with-wings-36-ct/1588020', 'retailer'),
      'safety.warnings': f(`Label: if irritation develops, discontinue use; consult a physician if it persists. Do not flush. ${padWarnFda}`, 'Stayfree product page + FDA', 'https://stayfree.com/products/stayfree-ultra-thin-pads-regular-with-wings'),
      ...padFda(),
      'safety.recalls': f('No manufacturer recall found. FDA recall Z-1182-2026 (Jan 2026) covered Stayfree Regular/Super packs held by one Minnesota distributor (Gold Star Distribution) after rodent exposure in storage.', 'FDA recall database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Disposable pad for light to moderate period flow, bladder leaks and moisture (per brand)', 'Stayfree product page', 'https://stayfree.com/products/stayfree-ultra-thin-pads-regular-with-wings'),
    },
  },
  'p-seventh-gen-pad': {
    ...head('needs_correction', 'none_found', 'Checked King Soopers (Kroger) listing ($3.79 for 18, regular absorbency with wings, 0% chlorine bleaching, FSA/HSA) and Whole Foods listing (made without fragrances, deodorants or chlorine processing). Catalog "$8 for 14" and "plant-derived materials" not confirmed; no ingredient list found on retailer pages and seventhgeneration.com did not surface. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$8 for 14', source_says: '$3.79 for 18 at King Soopers (Kroger)', source_url: 'https://www.kingsoopers.com/p/seventh-generation-regular-absorbency-ultra-thin-pads/0073291345002' },
    ],
    facts: {
      'identity.variant': f('Seventh Generation Ultra Thin Pads with Wings, Regular absorbency, individually wrapped', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-regular-absorbency-ultra-thin-pads/0073291345002', 'retailer'),
      'pricing.price': f('$3.79 for 18 at King Soopers (retailer; varies)', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-regular-absorbency-ultra-thin-pads/0073291345002', 'retailer'),
      'pricing.size_count': f('18 pads (36 ct also sold)', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-regular-absorbency-ultra-thin-pads/0073291345002', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-regular-absorbency-ultra-thin-pads/0073291345002', 'retailer'),
      'composition.fragrance': f('Made without fragrances or deodorants', 'Whole Foods listing', 'https://www.wholefoodsmarket.com/grocery/product/seventh-generation-pads-ultra-thin-regular-18-count-b000ncc1kc', 'retailer'),
      'composition.ingredients': f('No ingredient list on retailer pages. Stated: 0% chlorine bleaching; hypoallergenic; no fragrance or deodorant', 'King Soopers + Whole Foods listings', 'https://www.kingsoopers.com/p/seventh-generation-regular-absorbency-ultra-thin-pads/0073291345002', 'retailer'),
      'safety.warnings': f(padWarnFda, 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      ...padFda(),
      'safety.recalls': f('No recall found (FDA recall search, Oct 2026).', 'FDA recall database search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Disposable pad for regular menstrual flow, marketed for sensitive skin', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-regular-absorbency-ultra-thin-pads/0073291345002', 'retailer'),
    },
  },
  'p-bodyform-pad': {
    ...head('needs_correction', 'unknown', 'Bodyform is a UK/Ireland brand (Essity). The catalog purchase link is an Amazon search page, not a product, and the catalog "$6 for 14" is not a price we could confirm in the US. UK grocer Ocado lists Bodyform Ultra Normal Sanitary Towels Wings 12-pack at GBP 1.75 (origin UK); a separate scented version exists, so scent must be specified. No ingredient list found. No recall search result found (UK product, not in FDA database checks).'),
    corrections: [
      { field: 'identity.purchase_url', catalog: 'Amazon search results page for Bodyform', source_says: 'Not a product page; Bodyform is sold mainly in the UK/Ireland (e.g. Ocado)', source_url: 'https://www.ocado.com/products/bodyform-ultra-normal-sanitary-towels-wings/608236011' },
      { field: 'pricing.price', catalog: '$6 for 14', source_says: 'GBP 1.75 for 12 (Ultra Normal Wings, Ocado UK)', source_url: 'https://www.ocado.com/products/bodyform-ultra-normal-sanitary-towels-wings/608236011' },
    ],
    facts: {
      'identity.variant': f('Bodyform Ultra Normal Sanitary Towels with Wings (unscented line; a scented version is sold separately)', 'Ocado listings', 'https://www.ocado.com/products/bodyform-ultra-normal-sanitary-towels-wings/608236011', 'retailer'),
      'pricing.price': f('GBP 1.75 for 12 at Ocado (UK)', 'Ocado listing', 'https://www.ocado.com/products/bodyform-ultra-normal-sanitary-towels-wings/608236011', 'retailer'),
      'pricing.size_count': f('12 pads', 'Ocado listing', 'https://www.ocado.com/products/bodyform-ultra-normal-sanitary-towels-wings/608236011', 'retailer'),
      'pricing.availability': f('UK grocers (Ocado, Waitrose and others); US availability not confirmed', 'Ocado listing', 'https://www.ocado.com/products/bodyform-ultra-normal-sanitary-towels-wings/608236011', 'retailer'),
      'safety.warnings': f(padWarnFda, 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      'health.intended_use': f('Disposable pad for normal menstrual flow', 'Ocado listing', 'https://www.ocado.com/products/bodyform-ultra-normal-sanitary-towels-wings/608236011', 'retailer'),
    },
  },
  'p-rael-overnight': {
    ...head('needs_correction', 'none_found', 'Checked Vitacost listing (Organic Cotton Cover Pads with Leak Locker, Overnight, 12 ct, $9.34, label materials). Catalog "100% organic cotton" is wrong: only the cover/top sheet is organic cotton; the core is chlorine-free wood pulp with superabsorbent polymer and the back sheet is polyethylene/polypropylene. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: '100% organic cotton.', source_says: 'Organic cotton cover only; core is elemental chlorine-free wood pulp with super absorbent polymers; polyethylene/polypropylene back sheet', source_url: 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295' },
    ],
    facts: {
      'identity.variant': f('Rael Organic Cotton Cover Pads with Leak Locker, Overnight, unscented', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295', 'retailer'),
      'pricing.price': f('$9.34 for 12 at Vitacost (retailer; varies)', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295', 'retailer'),
      'pricing.size_count': f('12 pads', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295', 'retailer'),
      'pricing.availability': f('Vitacost, Target, Walmart, Publix and others', 'Retailer listings', 'https://www.target.com/p/rael-organic-cotton-cover-regular-38-overnight-pads-duopack-unscented-28ct/-/A-85923721', 'retailer'),
      'composition.ingredients': f('Cover: certified organic cotton. Core: elemental chlorine-free wood pulp with super absorbent polymers. Back sheet: polyethylene, polypropylene', 'Vitacost listing (label text)', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295', 'retailer'),
      'composition.fragrance': f('No fragrance', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295', 'retailer'),
      'safety.warnings': f(`Label: do not flush; for external use only. ${padWarnFda}`, 'Vitacost listing + FDA', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295', 'retailer'),
      ...padFda(),
      'health.intended_use': f('Disposable overnight pad for heavy or overnight menstrual flow', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-pads-with-leak-locker-overnight-12-count-101295', 'retailer'),
    },
  },
  'p-rael-liners': {
    ...head('needs_correction', 'none_found', 'Checked Vitacost listing (Organic Cotton Cover Panty Liners, Regular, 20 ct, $5.65, label materials). Catalog "$8 for 30" count not found (20 regular, 18 long, 70 micro thin). Catalog "Organic cotton" is incomplete: organic cotton cover, chlorine-free wood pulp core, polyethylene backing. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$8 for 30', source_says: '$5.65 for 20 (Regular) at Vitacost; also 18 Long or 70 Micro Thin at $8.74', source_url: 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889' },
      { field: 'composition.ingredients', catalog: 'Organic cotton.', source_says: 'Organic cotton cover, elemental chlorine-free wood pulp core, waterproof polyethylene backing', source_url: 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889' },
    ],
    facts: {
      'identity.variant': f('Rael Organic Cotton Cover Panty Liners, Regular (6 in), unscented', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889', 'retailer'),
      'pricing.price': f('$5.65 for 20 at Vitacost (retailer; varies)', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889', 'retailer'),
      'pricing.size_count': f('20 liners (Regular); Long 18 ct and Micro Thin 70 ct also sold', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889', 'retailer'),
      'composition.ingredients': f('Cover: certified organic cotton (Texas, USA). Core: elemental chlorine-free wood pulp. Backing: waterproof polyethylene', 'Vitacost listing (label text)', 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889', 'retailer'),
      'composition.fragrance': f('No fragrance', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889', 'retailer'),
      'safety.warnings': f(`Label: do not flush; external use only; keep plastic bag away from children (suffocation). ${padWarnFda}`, 'Vitacost listing + FDA', 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889', 'retailer'),
      ...padFda(),
      'health.intended_use': f('Daily liner for light flow, spotting or discharge', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-cover-panty-liners-regular-20-count-89889', 'retailer'),
    },
  },
  // ------------------------------------------------------------ tampons
  'p-rael-tampon': {
    ...head('in_review', 'none_found', 'Checked Vitacost listing (Organic Cotton Tampons, Regular, 18 ct, $8.49, temporarily unavailable there; label materials and TSS warning) and FDA 510(k) K182814 (Rael Tampon, cleared Jul 15 2019, Regular and Super). Catalog "$10 for 18" close to retail; absorbency not specified in catalog. No recall found.'),
    facts: {
      'identity.variant': f('Rael Organic Cotton Tampons, Regular (6-9 g), compact BPA-free plastic applicator, fragrance free; Super (9-12 g) also sold', 'Vitacost listing + FDA 510(k) K182814', 'https://www.vitacost.com/products/rael-organic-cotton-tampons-regular-fragrance-free-18-count-145896', 'retailer'),
      'pricing.price': f('$8.49 for 18 at Vitacost (retailer; varies)', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-tampons-regular-fragrance-free-18-count-145896', 'retailer'),
      'pricing.size_count': f('18 tampons (16 ct also sold)', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-tampons-regular-fragrance-free-18-count-145896', 'retailer'),
      'pricing.availability': f('Temporarily unavailable at Vitacost on check date; also sold at Walmart and Good Eggs', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-tampons-regular-fragrance-free-18-count-145896', 'retailer'),
      'composition.ingredients': f('Absorbent core, cover and withdrawal cord: certified organic cotton; cotton sewing thread; water-repellent wax coating on string and thread; BPA-free plastic applicator; paper wrapper', 'Vitacost listing (label text)', 'https://www.vitacost.com/products/rael-organic-cotton-tampons-regular-fragrance-free-18-count-145896', 'retailer'),
      'composition.fragrance': f('Fragrance free (FDA 510(k) summary: unscented)', 'Vitacost listing + FDA 510(k)', 'https://fda.innolitics.com/device/K182814', 'regulatory'),
      'safety.warnings': f(`Label: tampons are associated with TSS, rare but potentially fatal; use the lowest absorbency for your flow and wear no more than 8 hours. ${tamponWarnFda}`, 'Vitacost listing (label) + FDA', 'https://www.vitacost.com/products/rael-organic-cotton-tampons-regular-fragrance-free-18-count-145896', 'retailer'),
      ...tamponFda(),
      'safety.regulatory_status': f('FDA 510(k) cleared: K182814, Rael Tampon (product code HEB), Jul 15 2019, Regular and Super absorbencies', 'FDA 510(k) record (via Innolitics)', 'https://fda.innolitics.com/device/K182814', 'regulatory'),
      'safety.recalls': f('No recall found (FDA recall search, Oct 2026).', 'FDA recall database search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Internal absorption of light to medium menstrual flow (Regular)', 'Vitacost listing', 'https://www.vitacost.com/products/rael-organic-cotton-tampons-regular-fragrance-free-18-count-145896', 'retailer'),
    },
  },
  'p-cora-overnight': {
    ...head('needs_correction', 'none_found', 'Checked ShopRite (Peace-of-Mind Overnight Pad, 28 ct, $11.99, full material list) and Walmart (Overnight 14 ct, HSA/FSA eligible, no chlorine/fragrance/dyes). Catalog "$10 for 20" count not found. Catalog "Organic cotton" is incomplete: only the topsheet is organic cotton; core has chlorine-free wood pulp and sodium polyacrylate; polyethylene backsheet. Catalog URL is the Cora homepage. No recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$10 for 20', source_says: '$11.99 for 28 at ShopRite (14 ct also sold)', source_url: 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643' },
      { field: 'composition.ingredients', catalog: 'Organic cotton.', source_says: 'Organic cotton topsheet; chlorine-free wood pulp and sodium polyacrylate core; polyethylene, polyester, cotton, calcium carbonate, hot melt adhesive', source_url: 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643' },
    ],
    facts: {
      'identity.variant': f('Cora 100% Organic Cotton Topsheet Peace-of-Mind Overnight Pad, unscented', 'ShopRite listing', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'pricing.price': f('$11.99 for 28 at ShopRite (retailer; varies)', 'ShopRite listing', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'pricing.size_count': f('28 pads (14 ct also sold)', 'ShopRite + Walmart listings', 'https://www.walmart.com/ip/Cora-Organic-Cotton-Topsheet-Pads-Unscented-Overnight-14-Count/398231938', 'retailer'),
      'pricing.fsa_hsa': f('HSA/FSA eligible', 'Walmart listing', 'https://www.walmart.com/ip/Cora-Organic-Cotton-Topsheet-Pads-Unscented-Overnight-14-Count/398231938', 'retailer'),
      'composition.ingredients': f('Chlorine-free wood pulp, organic cotton (topsheet), sodium polyacrylate, polyethylene, cotton (side barriers, wings), calcium carbonate, hot melt adhesive (petroleum resin, rubber, mineral oil), polyester', 'ShopRite listing (label text)', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'composition.fragrance': f('Made without fragrance, dyes or chlorine', 'ShopRite + Walmart listings', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'composition.allergens': f('Adhesive is listed as containing rubber (type not stated)', 'ShopRite listing (label text)', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
      'safety.warnings': f(padWarnFda, 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
      ...padFda(),
      'health.intended_use': f('Disposable overnight pad for heavy or overnight flow', 'ShopRite listing', 'https://www.shoprite.com/product/cora-100-organic-cotton-topsheet-the-peaceofmind-overnight-pad-28-count-id-00810042480643', 'retailer'),
    },
  },
  'p-carefree-liners': {
    ...head('needs_correction', 'none_found', 'H-E-B says Carefree liners were "formerly packaged as Carefree Acti-Fresh"; current name "Carefree Panty Liners, Regular, Wrapped, Unscented" (148 ct $7.96). Stop & Shop label for Acti-Fresh Body Shape Unscented Regular: "unscented*" but contains odor control (Hedione, phenoxyethanol, triethyl citrate). Catalog "$5 for 48" not confirmed and scent not specified (scented Fresh Scent versions exist). No recall found.'),
    corrections: [
      { field: 'identity.name', catalog: 'Carefree Acti-Fresh Liners', source_says: 'Now sold as Carefree Panty Liners (formerly Acti-Fresh)', source_url: 'https://www.heb.com/product-detail/carefree-panty-liners-regular-liners-wrapped-unscented/6235518' },
      { field: 'pricing.price', catalog: '$5 for 48', source_says: '$7.96 for 148 (Regular, Wrapped, Unscented) at H-E-B', source_url: 'https://www.heb.com/product-detail/carefree-panty-liners-regular-liners-wrapped-unscented/6235518' },
    ],
    facts: {
      'identity.variant': f('Carefree Panty Liners, Regular, Unscented (formerly Acti-Fresh); scented versions sold separately', 'H-E-B listing', 'https://www.heb.com/product-detail/carefree-panty-liners-regular-liners-wrapped-unscented/6235518', 'retailer'),
      'pricing.price': f('$7.96 for 148 at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/carefree-panty-liners-regular-liners-wrapped-unscented/6235518', 'retailer'),
      'pricing.size_count': f('148 liners (120 ct and smaller packs also sold)', 'H-E-B + Stop & Shop listings', 'https://stopandshop.com/groceries/product/carefree-acti-fresh-body-shape-unscented-regular-liners-120-ct-box/343529', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'H-E-B listing', 'https://www.heb.com/product-detail/carefree-panty-liners-regular-liners-wrapped-unscented/6235518', 'retailer'),
      'composition.ingredients': f('Absorbent cellulose fibers, polypropylene, sodium polyacrylate, polyethylene, adhesive (styrene isoprene styrene copolymer, vinyl acetate and ethylene, hydrocarbon resin, naphthenic oil), polyester, titanium dioxide, odor control (Hedione, phenoxyethanol, triethyl citrate)', 'Stop & Shop listing (label text)', 'https://stopandshop.com/groceries/product/carefree-acti-fresh-body-shape-unscented-regular-liners-120-ct-box/343529', 'retailer'),
      'composition.fragrance': f('Labeled "unscented*" with footnote: contains odor control ingredient (Hedione, an aroma chemical)', 'Stop & Shop listing', 'https://stopandshop.com/groceries/product/carefree-acti-fresh-body-shape-unscented-regular-liners-120-ct-box/343529', 'retailer'),
      'safety.warnings': f(`Label: if irritation develops, discontinue use; consult a physician if it persists. ${padWarnFda}`, 'Stop & Shop listing + FDA', 'https://stopandshop.com/groceries/product/carefree-acti-fresh-body-shape-unscented-regular-liners-120-ct-box/343529', 'retailer'),
      ...padFda(),
      'health.intended_use': f('Daily liner for light flow and freshness', 'H-E-B listing', 'https://www.heb.com/product-detail/carefree-panty-liners-regular-liners-wrapped-unscented/6235518', 'retailer'),
    },
  },
  'p-always-liners': {
    ...head('needs_correction', 'none_found', 'Catalog "Always Liners" does not name the line, length or scent. Used Always Thin No Feel Protection Daily Liners, Regular, Unscented (H-E-B: 120 ct $6.97, label ingredients, FSA/HSA). Catalog "$6 for 42" count not confirmed. FDA recall Z-1182-2026 (Jan 2026) included Always Thin Liners 12 ct held by one Minnesota distributor (rodent exposure in storage); no manufacturer recall found.'),
    corrections: [
      { field: 'identity.variant', catalog: 'Always Liners (no line/scent)', source_says: 'Always sells Thin, Daily Fresh, Xtra Protection lines in scented and unscented; reference used: Thin No Feel Protection Regular Unscented', source_url: 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408' },
    ],
    facts: {
      'identity.variant': f('Always Thin No Feel Protection Daily Liners, Regular, Unscented (reference variant)', 'H-E-B listing', 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408', 'retailer'),
      'pricing.price': f('$6.97 for 120 at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408', 'retailer'),
      'pricing.size_count': f('120 liners (20, 72, 162, 216 ct also sold)', 'H-E-B + Stop & Shop listings', 'https://stopandshop.com/groceries/product/always-no-feel-protection-unscented-thin-daily-liners-162-ct-pkg/166519', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'H-E-B listing', 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408', 'retailer'),
      'composition.ingredients': f('Cellulose, polypropylene, hot melt adhesive, polyethylene, polyester, ethylene vinyl acetate copolymer, titanium dioxide, pigment blue 15, pigment red 122', 'H-E-B listing (label text)', 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408', 'retailer'),
      'composition.fragrance': f('Unscented variant (no fragrance in listed ingredients); scented versions exist', 'H-E-B listing', 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408', 'retailer'),
      'safety.warnings': f(`Label: keep plastic bag away from babies and children (suffocation). ${padWarnFda}`, 'H-E-B listing + FDA', 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408', 'retailer'),
      ...padFda(),
      'safety.recalls': f('No manufacturer recall found. FDA recall Z-1182-2026 (Jan 2026) covered Always Thin Liners 12 ct (scented and unscented) held by Gold Star Distribution, Minnesota, after rodent exposure in storage; consumers told to destroy those units.', 'FDA recall database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Daily liner for light flow and discharge', 'H-E-B listing', 'https://www.heb.com/product-detail/always-thin-no-feel-protection-daily-liners-regular-absorbency-unscented/1865408', 'retailer'),
    },
  },
  'p-playtex-sport': {
    ...head('in_review', 'none_found', 'Checked ShopRite (Sport Regular Fragrance-Free 18 ct, $5.49 regular, $4.12 sale Oct 11-17 2026, ingredients) and Stop & Shop (label ingredients, Regular 6-9 g, TSS warning). Catalog "$8 for 18" is above observed retail but prices vary; absorbency not specified in catalog. No recall found for Playtex Sport.'),
    facts: {
      'identity.variant': f('Playtex Sport Tampons, Regular (6-9 g), unscented/fragrance-free, plastic applicator', 'Stop & Shop + ShopRite listings', 'https://stopandshop.com/groceries/product/playtex-sport-unscented-regular-tampons-18-ct-box/145499', 'retailer'),
      'pricing.price': f('$5.49 for 18 at ShopRite (sale $4.12 Oct 11-17 2026; retailer, varies)', 'ShopRite listing', 'https://www.shoprite.com/product/playtex-sport-regular-fragrancefree-tampons-18-count-id-00078300081098', 'retailer'),
      'pricing.size_count': f('18 tampons (32 and 48 ct also sold)', 'ShopRite + Stop & Shop listings', 'https://www.shoprite.com/product/playtex-sport-regular-fragrancefree-tampons-18-count-id-00078300081098', 'retailer'),
      'pricing.fsa_hsa': f('Shown with FSA/HSA marker at ShopRite', 'ShopRite listing', 'https://www.shoprite.com/product/playtex-sport-regular-fragrancefree-tampons-18-count-id-00078300081098', 'retailer'),
      'composition.ingredients': f('Rayon and/or cotton fiber, polyester, polysorbate 20, wax blend (paraffin, butyl stearate, carnauba wax), polymer wax dispersion; plastic applicator', 'Stop & Shop listing (label text)', 'https://stopandshop.com/groceries/product/playtex-sport-unscented-regular-tampons-18-ct-box/145499', 'retailer'),
      'composition.fragrance': f('Unscented / fragrance-free', 'ShopRite listing', 'https://www.shoprite.com/product/playtex-sport-regular-fragrancefree-tampons-18-count-id-00078300081098', 'retailer'),
      'safety.warnings': f(`Label: tampons are associated with TSS (rare, can be fatal); use the lowest absorbency for your flow; single use; keep away from children; read enclosed leaflet. ${tamponWarnFda}`, 'Stop & Shop listing (label) + FDA', 'https://stopandshop.com/groceries/product/playtex-sport-unscented-regular-tampons-18-ct-box/145499', 'retailer'),
      ...tamponFda(),
      'safety.recalls': f('No recall found for Playtex Sport (FDA recall search, Oct 2026).', 'FDA recall database search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Internal absorption of menstrual flow, marketed for active use', 'ShopRite listing', 'https://www.shoprite.com/product/playtex-sport-regular-fragrancefree-tampons-18-count-id-00078300081098', 'retailer'),
    },
  },
  'p-kotex-tampon': {
    ...head('needs_correction', 'none_found', 'Checked Stop & Shop (label ingredients, Regular 6-9 g, TSS warning, 8 h max) and Walmart ($5.18 for 16, FSA/HSA/HRA eligible, made without fragrance, BPA free). Catalog says "Cotton, plastic applicator" but the label lists rayon, polyester, cellulose, polyethylene, polypropylene, paraffin wax, titanium dioxide (no cotton). Catalog "$8 for 18" not confirmed (16 ct). The 2018 Kimberly-Clark recall covered U by Kotex Sleek Regular tampons, not Click; no Click recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Cotton, plastic applicator.', source_says: 'Rayon, polyester, cellulose, polyethylene, polypropylene, paraffin wax, titanium dioxide', source_url: 'https://stopandshop.com/groceries/product/u-by-kotex-click-unscented-regular-compact-tampons-16-ct-box/310159' },
      { field: 'pricing.price', catalog: '$8 for 18', source_says: '$5.18 for 16 at Walmart', source_url: 'https://www.walmart.com/ip/508565470' },
    ],
    facts: {
      'identity.variant': f('U by Kotex Click Compact Tampons, Regular (6-9 g), unscented, compact plastic applicator', 'Stop & Shop listing', 'https://stopandshop.com/groceries/product/u-by-kotex-click-unscented-regular-compact-tampons-16-ct-box/310159', 'retailer'),
      'pricing.price': f('$5.18 for 16 at Walmart (retailer; varies)', 'Walmart listing', 'https://www.walmart.com/ip/508565470', 'retailer'),
      'pricing.size_count': f('16 tampons (45 ct also sold)', 'Walmart + Stop & Shop listings', 'https://www.walmart.com/ip/508565470', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA/HRA eligible', 'Walmart listing', 'https://www.walmart.com/ip/508565470', 'retailer'),
      'composition.ingredients': f('Rayon, polyester, cellulose, polyethylene, polypropylene, paraffin wax, titanium dioxide', 'Stop & Shop listing (label text)', 'https://stopandshop.com/groceries/product/u-by-kotex-click-unscented-regular-compact-tampons-16-ct-box/310159', 'retailer'),
      'composition.fragrance': f('Made without fragrance', 'Stop & Shop + Walmart listings', 'https://stopandshop.com/groceries/product/u-by-kotex-click-unscented-regular-compact-tampons-16-ct-box/310159', 'retailer'),
      'safety.warnings': f(`Label: TSS is rare but serious and may cause death; use 8 hours maximum; do not use if wrapper is open or damaged. ${tamponWarnFda}`, 'Stop & Shop listing (label) + FDA', 'https://stopandshop.com/groceries/product/u-by-kotex-click-unscented-regular-compact-tampons-16-ct-box/310159', 'retailer'),
      ...tamponFda(),
      'safety.recalls': f('No recall found for Click. Dec 2018 Kimberly-Clark recall covered U by Kotex Sleek Regular tampons (unraveling), a different product.', 'FDA company announcement (2018)', 'https://www.fda.gov/safety/recalls/ucm628237.htm', 'regulatory'),
      'health.intended_use': f('Internal absorption of light to medium menstrual flow (Regular)', 'Stop & Shop listing', 'https://stopandshop.com/groceries/product/u-by-kotex-click-unscented-regular-compact-tampons-16-ct-box/310159', 'retailer'),
    },
  },
  'p-ob-tampon': {
    ...head('needs_correction', 'none_found', 'Checked H-E-B (o.b. Non-Applicator Tampons Regular 40 ct, $7.96, label ingredients, TSS warning, FSA/HSA) and o.b. TSS page. Catalog "Cotton, compact design" is incomplete: label lists rayon and/or cotton fiber, polyester, polyethylene, titanium dioxide, PEG-100 stearate, fatty acid polyglycol ester, dyed waxed string. Catalog does not name absorbency (Regular, Super, Super Plus, Ultra and multipacks exist). No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Cotton, compact design.', source_says: 'Rayon and/or cotton fiber, polyester, polyethylene, titanium dioxide, PEG-100 stearate, fatty acid polyglycol ester; string with C.I. Vat Red 10, C.I. Orange 15, C.I. Vat Green 1, paraffin wax', source_url: 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008' },
      { field: 'pricing.price', catalog: '$6 for 40', source_says: '$7.96 for 40 (Regular) at H-E-B', source_url: 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008' },
    ],
    facts: {
      'identity.variant': f('o.b. Original Non-Applicator (digital) Tampons, Regular (catalog absorbency unspecified)', 'H-E-B listing', 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008', 'retailer'),
      'pricing.price': f('$7.96 for 40 at H-E-B (retailer; varies)', 'H-E-B listing', 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008', 'retailer'),
      'pricing.size_count': f('40 tampons', 'H-E-B listing', 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'H-E-B listing', 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008', 'retailer'),
      'composition.ingredients': f('Rayon and/or cotton fiber, polyester, polyethylene, titanium dioxide, PEG-100 stearate, fatty acid polyglycol ester; string: C.I. Vat Red 10, C.I. Orange 15, C.I. Vat Green 1, paraffin wax. No applicator.', 'H-E-B listing (label text)', 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008', 'retailer'),
      'composition.fragrance': f('Free from fragrance and elemental chlorine', 'H-E-B listing', 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008', 'retailer'),
      'safety.warnings': f(`Label: discontinue if sensitivity or irritation occurs; tampons are associated with TSS. o.b.: risk reported higher under 30 and in teens; if you have had TSS warning signs before, ask a doctor before using tampons again. ${tamponWarnFda}`, 'H-E-B listing + o.b. TSS page', 'https://www.ob-tampons.com/pages/tss'),
      ...tamponFda(),
      'safety.recalls': f('No recall found (FDA recall search, Oct 2026).', 'FDA recall database search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Applicator-free internal absorption of menstrual flow', 'H-E-B listing', 'https://www.heb.com/product-detail/o-b-non-applicator-tampons-regular/10969008', 'retailer'),
    },
  },
  'p-tampax-radiant': {
    ...head('needs_correction', 'none_found', 'Checked Walmart (Radiant Regular 28 ct $8.37, made without perfume, FSA/HSA) and H-E-B (Radiant Duo Pack Regular/Super 28 ct $7.94, label ingredients, TSS warning). Catalog "Cotton, flexible braid design" is incomplete: label lists rayon, cotton, polypropylene, polyethylene, polyester, glycerin, paraffin, ethoxylated fatty acid esters, PEG-100 stearate. Catalog "$9 for 18" count not confirmed. FDA recall Z-1182-2026 covered "Tampax Reg./Super 10ct" units held by one Minnesota distributor (not Radiant by name); no manufacturer recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Cotton, flexible braid design.', source_says: 'Rayon, cotton, polypropylene, polyethylene, polyester, glycerin, paraffin, ethoxylated fatty acid esters, PEG-100 stearate', source_url: 'https://www.heb.com/product-detail/tampax-radiant-tampons-duo-pack-regular-super-absorbency-unscented/1542732' },
      { field: 'pricing.price', catalog: '$9 for 18', source_says: '$8.37 for 28 (Regular) at Walmart', source_url: 'https://www.walmart.com/ip/526812598' },
    ],
    facts: {
      'identity.variant': f('Tampax Radiant Tampons with LeakGuard Braid, Regular, unscented, plastic applicator (catalog absorbency unspecified)', 'Walmart listing', 'https://www.walmart.com/ip/526812598', 'retailer'),
      'pricing.price': f('$8.37 for 28 at Walmart (retailer; varies)', 'Walmart listing', 'https://www.walmart.com/ip/526812598', 'retailer'),
      'pricing.size_count': f('28 tampons', 'Walmart listing', 'https://www.walmart.com/ip/526812598', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'Walmart listing', 'https://www.walmart.com/ip/526812598', 'retailer'),
      'composition.ingredients': f('Rayon, cotton, polypropylene, polyethylene, polyester, glycerin, paraffin, ethoxylated fatty acid esters, PEG-100 stearate', 'H-E-B listing (label text)', 'https://www.heb.com/product-detail/tampax-radiant-tampons-duo-pack-regular-super-absorbency-unscented/1542732', 'retailer'),
      'composition.fragrance': f('Made without perfume (unscented)', 'Walmart + H-E-B listings', 'https://www.walmart.com/ip/526812598', 'retailer'),
      'safety.warnings': f(`Label: tampons are associated with TSS, rare but serious and may cause death; read and save the enclosed leaflet. ${tamponWarnFda}`, 'H-E-B listing (label) + FDA', 'https://www.heb.com/product-detail/tampax-radiant-tampons-duo-pack-regular-super-absorbency-unscented/1542732', 'retailer'),
      ...tamponFda(),
      'safety.recalls': f('No manufacturer recall found. FDA recall Z-1182-2026 (Jan 2026) covered Tampax Regular/Super 10 ct units held by Gold Star Distribution, Minnesota (rodent exposure in storage).', 'FDA recall database', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Internal absorption of menstrual flow', 'Walmart listing', 'https://www.walmart.com/ip/526812598', 'retailer'),
    },
  },
  'p-seventh-gen-tampon': {
    ...head('needs_correction', 'none_found', 'FDA GUDID record (via beudamed) describes "Organic Cotton Comfort Applicator Tampons, Regular (plant-based plastic applicator)", product code HEB, in commercial distribution. Catalog says "cardboard applicator", which conflicts. King Soopers lists the 18 ct at $7.29 (certified organic cotton, no added fragrance, FSA/HSA). Catalog "$8 for 18" close. Full ingredient list and absorbency grams not found. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Organic cotton, cardboard applicator.', source_says: 'Organic cotton tampon with plant-based plastic applicator (FDA GUDID description)', source_url: 'https://beudamed.com/fda_udis/00732913451081' },
    ],
    facts: {
      'identity.variant': f('Seventh Generation Organic Cotton Comfort Applicator Tampons, Regular (plant-based plastic applicator)', 'FDA GUDID record via beudamed', 'https://beudamed.com/fda_udis/00732913451081', 'regulatory'),
      'pricing.price': f('$7.29 for 18 at King Soopers (retailer; varies)', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-free-clear-super-tampons/0073291345109', 'retailer'),
      'pricing.size_count': f('18 tampons', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-free-clear-super-tampons/0073291345109', 'retailer'),
      'pricing.fsa_hsa': f('FSA/HSA eligible', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-free-clear-super-tampons/0073291345109', 'retailer'),
      'composition.ingredients': f('Certified organic cotton tampon; plant-based plastic applicator (full ingredient list not found)', 'King Soopers listing + FDA GUDID', 'https://beudamed.com/fda_udis/00732913451081', 'regulatory'),
      'composition.fragrance': f('Without added fragrances', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-free-clear-super-tampons/0073291345109', 'retailer'),
      'safety.warnings': f(tamponWarnFda, 'FDA: Tampons', FDA.tampons, 'regulatory'),
      ...tamponFda(),
      'safety.regulatory_status': f('FDA class II device, unscented menstrual tampon (21 CFR 884.5470, product code HEB), in commercial distribution', 'FDA GUDID record via beudamed', 'https://beudamed.com/fda_udis/00732913451081', 'regulatory'),
      'safety.recalls': f('No recall found (FDA recall search, Oct 2026).', 'FDA recall database search', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfres/res.cfm?id=217953', 'regulatory'),
      'health.intended_use': f('Internal absorption of menstrual flow', 'King Soopers listing', 'https://www.kingsoopers.com/p/seventh-generation-free-clear-super-tampons/0073291345109', 'retailer'),
    },
  },
  'p-lena-cup': {
    ...head('in_review', 'none_found', 'Checked Grove listing (Lena Small 25 mL / Large 30 mL, $27.99 list, $19.99 sale, all variants out of stock there; 100% medical-grade silicone, fragrance-free, up to 12 h). Brand site lenacup.com did not surface. Catalog "$30 (reusable 10 years)": 10-year life not confirmed on the checked page. No HHE recalls in FDA database.'),
    facts: {
      'identity.variant': f('Lena Menstrual Cup, Small (25 mL, normal flow; 41 mm diameter) or Large (30 mL, heavier flow); catalog size unspecified', 'Grove listing', 'https://grove.co/products/lena-cup', 'retailer'),
      'pricing.price': f('$27.99 list ($19.99 sale) at Grove; all variants out of stock there on check date', 'Grove listing', 'https://grove.co/products/lena-cup', 'retailer'),
      'pricing.size_count': f('1 reusable cup + cotton storage bag', 'Grove listing', 'https://grove.co/products/lena-cup', 'retailer'),
      'composition.ingredients': f('100% medical-grade silicone; cotton storage bag', 'Grove listing', 'https://grove.co/products/lena-cup', 'retailer'),
      'composition.fragrance': f('Fragrance-free', 'Grove listing', 'https://grove.co/products/lena-cup', 'retailer'),
      'composition.allergens': f('Listed as BPA-free and hypoallergenic', 'Grove listing', 'https://grove.co/products/lena-cup', 'retailer'),
      'safety.warnings': f(`Wear up to 12 hours; wash cup and hands with mild soap and water before and after use; store in breathable bag. ${cupWarnFda}`, 'Grove listing + FDA: Menstrual Cups', FDA.cups, 'regulatory'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow', 'Grove listing', 'https://grove.co/products/lena-cup', 'retailer'),
    },
  },
  'p-ruby-cup': {
    ...head('in_review', 'unknown', 'Ruby Cup is a UK brand (Ruby Life Ltd). Checked Friendly Turtle UK listing (Small, GBP 23.95, sold out/unavailable; up to 8 h; up to 10 years; buy-one-give-one) and TechXLab profile (USD 30-40, 100% medical-grade silicone). Brand site did not surface; US price not confirmed. Ruby Cup says wear up to 8 hours, shorter than many cups (12 h). FDA recall check not applicable to a non-US listing; no recall found in news.'),
    facts: {
      'identity.variant': f('Ruby Cup, Small or Medium (chosen by cervix height and flow); catalog size unspecified', 'Friendly Turtle listing', 'https://friendlyturtle.com/products/eco-friendly-period-cup', 'retailer'),
      'pricing.price': f('GBP 23.95 (Small) at Friendly Turtle UK; about USD 30-40 per TechXLab profile', 'Friendly Turtle + TechXLab', 'https://techxlab.org/solutions/ruby-cup-menstrual-cup/', 'retailer'),
      'pricing.size_count': f('1 reusable cup; holds about 3 super tampons; up to 10 years of use (per brand)', 'Friendly Turtle listing', 'https://friendlyturtle.com/products/eco-friendly-period-cup', 'retailer'),
      'pricing.availability': f('Showed sold out / unavailable at Friendly Turtle UK on check date', 'Friendly Turtle listing', 'https://friendlyturtle.com/products/eco-friendly-period-cup', 'retailer'),
      'composition.ingredients': f('100% medical-grade soft silicone', 'Friendly Turtle listing', 'https://friendlyturtle.com/products/eco-friendly-period-cup', 'retailer'),
      'composition.allergens': f('Listed as latex-free (TechXLab profile)', 'TechXLab profile', 'https://techxlab.org/solutions/ruby-cup-menstrual-cup/', 'retailer'),
      'safety.warnings': f(`Brand: wear up to 8 hours. ${cupWarnFda}`, 'Friendly Turtle listing + FDA: Menstrual Cups', FDA.cups, 'regulatory'),
      ...cupFda(),
      'health.intended_use': f('Reusable internal collection of menstrual flow; one cup donated per cup sold (per brand)', 'Friendly Turtle listing', 'https://friendlyturtle.com/products/eco-friendly-period-cup', 'retailer'),
    },
  },
  'p-organicup': {
    ...head('needs_correction', 'unknown', 'OrganiCup is now sold under the AllMatters brand ("OrganiCup Menstrual Cup" on allmatters.com). Checked AllMatters product page: EUR 27, sizes Mini 19 mL / A 27 mL / B 33 mL, 100% medical-grade silicone made in Germany, free of BPA, latex and dyes, up to 12 h. US price not confirmed; catalog $28 roughly consistent. No HHE recall in FDA database.'),
    corrections: [
      { field: 'identity.brand', catalog: 'OrganiCup', source_says: 'Sold as OrganiCup Menstrual Cup by AllMatters', source_url: 'https://allmatters.com/products/menstrual-cup' },
    ],
    facts: {
      'identity.brand': f('AllMatters (formerly OrganiCup)', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
      'identity.variant': f('OrganiCup Menstrual Cup, Mini (19 mL), A (27 mL, no vaginal birth) or B (33 mL, heavier flow or after vaginal birth); catalog size unspecified', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
      'identity.purchase_url': f('https://allmatters.com/products/menstrual-cup', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
      'pricing.price': f('EUR 27 on allmatters.com (US price not confirmed)', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
      'pricing.size_count': f('1 reusable cup + organic cotton bag', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
      'composition.ingredients': f('100% medical-grade silicone, made in Germany', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
      'composition.allergens': f('Free of BPA, latex and dyes (per brand)', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
      'safety.warnings': f(`Up to 12 hours depending on flow; boil 3-5 minutes after each period; use perfume-free, pH-balanced soap if any. ${cupWarnFda}`, 'AllMatters product page + FDA', 'https://allmatters.com/products/menstrual-cup'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow', 'AllMatters product page', 'https://allmatters.com/products/menstrual-cup'),
    },
  },
  'p-femmycycle': {
    ...head('in_review', 'unknown', 'Brand site did not surface in search. Only a Put A Cup In It comparison table was found: Petite (formerly Teen) 17-20 mL, Regular 25-30 mL, Low Cervix 25-30 mL with short ring stem; medical-grade silicone; the brand Amazon listing (quoted there) says Low Cervix cannot be used with a very low cervix or any prolapse. Price not confirmed. No HHE recall in FDA database.'),
    facts: {
      'identity.variant': f('FemmyCycle Regular, Low Cervix or Petite (formerly Teen); catalog size unspecified', 'Put A Cup In It comparison', 'https://putacupinit.com/low-cervix-menstrual-cups/', 'retailer'),
      'pricing.size_count': f('1 reusable cup; Regular 43 mm long x 36 mm, about 30 mL; Petite 38 x 31 mm, about 17-20 mL', 'Put A Cup In It comparison', 'https://putacupinit.com/low-cervix-menstrual-cups/', 'retailer'),
      'composition.ingredients': f('Medical-grade silicone', 'Put A Cup In It comparison', 'https://putacupinit.com/low-cervix-menstrual-cups/', 'retailer'),
      'safety.warnings': f(`Brand listing (as quoted by Put A Cup In It): Low Cervix model not for a very low cervix or any degree of prolapse. ${cupWarnFda}`, 'Put A Cup In It + FDA: Menstrual Cups', FDA.cups, 'regulatory'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow', 'FDA menstrual cup definition', FDA.cupClass, 'regulatory'),
    },
  },
  'p-flex-cup': {
    ...head('needs_correction', 'none_found', 'Checked Flex how-to page (100% medical-grade silicone, free of BPA, phthalates and natural rubber latex; Slim Fit and Full Fit; pull-tab; up to 12 h) and HSA Store listing ($39.99 Full Fit incl. 2 disposable discs, HSA eligible). Catalog "$30 (reusable)" not confirmed. Flex blog says the cup is "FDA-approved" for 12 h wear; menstrual cups are actually 510(k)-exempt class II devices, so "FDA-approved" is not accurate wording. No HHE recall found.'),
    corrections: [
      { field: 'pricing.price', catalog: '$30 (reusable)', source_says: '$39.99 (Full Fit, includes 2 free disposable discs) at HSA Store', source_url: 'https://hsastore.com/flex-menstrual-cup-full-fit-includes-2-free-menstrual-discs/28072.html' },
    ],
    facts: {
      'identity.variant': f('Flex Cup, Slim Fit (start here if unsure) or Full Fit (after vaginal birth); catalog fit unspecified', 'Flex how-to page', 'https://flexfits.com/blog/how-to-use-flex-cup/'),
      'pricing.price': f('$39.99 (Full Fit with 2 free discs) at HSA Store', 'HSA Store listing', 'https://hsastore.com/flex-menstrual-cup-full-fit-includes-2-free-menstrual-discs/28072.html', 'retailer'),
      'pricing.size_count': f('1 reusable cup (holds up to about 3 super tampons per brand) plus 2 disposable discs in this bundle', 'Flex how-to + HSA Store', 'https://flexfits.com/blog/how-to-use-flex-cup/'),
      'pricing.fsa_hsa': f('HSA eligible', 'HSA Store listing', 'https://hsastore.com/flex-menstrual-cup-full-fit-includes-2-free-menstrual-discs/28072.html', 'retailer'),
      'composition.ingredients': f('100% medical-grade silicone', 'Flex how-to page', 'https://flexfits.com/blog/how-to-use-flex-cup/'),
      'composition.allergens': f('Free of BPA, phthalates and natural rubber latex (per brand)', 'Flex how-to page', 'https://flexfits.com/blog/how-to-use-flex-cup/'),
      'safety.warnings': f(`Remove, empty and wash at least every 12 hours. Boil 10 minutes before first use without touching the pot sides (can melt silicone). ${cupWarnFda}`, 'Flex how-to page + FDA', 'https://flexfits.com/blog/how-to-use-flex-cup/'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable menstrual cup with pull-tab removal', 'Flex how-to page', 'https://flexfits.com/blog/how-to-use-flex-cup/'),
    },
  },
  'p-ziggy-disc': {
    ...head('needs_correction', 'none_found', 'Ziggy Cup is made by Intimina; current model is Ziggy Cup 2 (flat-fit reusable disc, sizes A and B). Period Nirvana lists it at $45 (both sizes showed sold out/unavailable). Catalog "$40" and unnamed size not confirmed. Medical-grade silicone. No HHE recall in FDA database.'),
    corrections: [
      { field: 'identity.variant', catalog: 'Ziggy Cup (Menstrual Disc)', source_says: 'Intimina Ziggy Cup 2, size A (low cervix) or B (average cervix)', source_url: 'https://shop.periodnirvana.com/products/ziggy-2' },
      { field: 'pricing.price', catalog: '$40 (reusable)', source_says: '$45 at Period Nirvana', source_url: 'https://shop.periodnirvana.com/products/ziggy-2' },
    ],
    facts: {
      'identity.brand': f('Intimina', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
      'identity.variant': f('Ziggy Cup 2 flat-fit reusable menstrual disc, size A (small, low cervix) or B (most people, average cervix)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
      'identity.purchase_url': f('https://shop.periodnirvana.com/products/ziggy-2', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
      'pricing.price': f('$45', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
      'pricing.size_count': f('1 reusable disc + drawstring pouch; lasts 5+ years with care (per retailer)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
      'composition.ingredients': f('Medical-grade silicone', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
      'safety.warnings': f(`Remove and wash every 12 hours; boil monthly. Removal can be messy (try in the shower first). ${cupWarnFda}`, 'Period Nirvana listing + FDA', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow; retailer says suitable with an IUD and for mess-free period sex', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/ziggy-2', 'retailer'),
    },
  },
  'p-lumma-disc': {
    ...head('in_review', 'unknown', 'Lumma is a Brazil-based brand. Put A Cup In It: Lumma Unique is a reusable silicone disc in S (30 mL), M (55 mL), L (60 mL), sold in the US via Amazon. Period Nirvana lists Lumma Disc S or M at $29 (all variants sold out on check date). Catalog "$35" and unnamed size not confirmed. No HHE recall found in FDA database.'),
    facts: {
      'identity.variant': f('Lumma Unique reusable disc, Small 30 mL / Medium 55 mL / Large 60 mL; catalog size unspecified', 'Put A Cup In It review', 'https://putacupinit.com/lummaunique/', 'retailer'),
      'pricing.price': f('$29 (Short or Medium) at Period Nirvana', 'Period Nirvana listing', 'https://shop.periodnirvana.com/collections/lumma/products/lumma-disc-s-or-m', 'retailer'),
      'pricing.size_count': f('1 reusable disc with silicone case', 'Put A Cup In It review', 'https://putacupinit.com/lummaunique/', 'retailer'),
      'pricing.availability': f('All sizes/colors sold out at Period Nirvana on check date; US sales also via Amazon; Lumma site ships worldwide', 'Period Nirvana + Put A Cup In It', 'https://shop.periodnirvana.com/collections/lumma/products/lumma-disc-s-or-m', 'retailer'),
      'composition.ingredients': f('Silicone disc with removable silicone pull string', 'Put A Cup In It review', 'https://putacupinit.com/lummaunique/', 'retailer'),
      'safety.warnings': f(cupWarnFda, 'FDA: Menstrual Cups', FDA.cups, 'regulatory'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Reusable internal collection of menstrual flow', 'Put A Cup In It review', 'https://putacupinit.com/lummaunique/', 'retailer'),
    },
  },
  'p-softdisc': {
    ...head('in_review', 'none_found', 'Checked Period Nirvana listing ($17 for 14, single-use, medical-grade polymer, no latex or silicone, BPA and phthalate free, up to 12 h) and NIH AccessGUDID (Softdisc, The Flex Company, product code HHE, single use, premarket-exempt). Catalog "$16 for 14" consistent. No HHE recall in FDA database.'),
    facts: {
      'identity.brand': f('Softdisc (The Flex Company)', 'NIH AccessGUDID', 'https://accessgudid.nlm.nih.gov/devices/00851906007477', 'regulatory'),
      'identity.variant': f('Softdisc disposable menstrual disc, one size, 14 count', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/soft-disc', 'retailer'),
      'pricing.price': f('$17 for 14', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/soft-disc', 'retailer'),
      'pricing.size_count': f('14 single-use discs', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/soft-disc', 'retailer'),
      'pricing.fsa_hsa': f('HSA/FSA payment accepted at retailer (via Flex)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/soft-disc', 'retailer'),
      'composition.ingredients': f('Medical-grade polymer blend; made without natural rubber latex or silicone', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/soft-disc', 'retailer'),
      'composition.allergens': f('No natural rubber latex; BPA- and phthalate-free; non-latex per FDA GUDID term', 'Period Nirvana listing + NIH AccessGUDID', 'https://accessgudid.nlm.nih.gov/devices/00851906007477', 'regulatory'),
      'safety.warnings': f(`Single use; up to 12 hours. ${cupWarnFda}`, 'Period Nirvana listing + FDA', FDA.cups, 'regulatory'),
      ...cupFda(),
      'safety.recalls': f('No recall listed under FDA product code HHE in the FDA device database on check date.', 'FDA TPLC database, product code HHE', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
      'health.intended_use': f('Disposable internal collection of menstrual flow, including overnight, swimming and during sex (per retailer)', 'Period Nirvana listing', 'https://shop.periodnirvana.com/products/soft-disc', 'retailer'),
    },
  },
  'p-period-nirvana-disc': {
    ...head('needs_correction', 'unknown', 'Period Nirvana is a retailer of cups and discs, not a disc maker. Its disc collection lists 14 discs from other brands; the only item under the "Period Nirvana" brand is the Fillow Disc and Applicator ($55 Small; Large out of stock). No "Period Nirvana Disc" at $42 was found. The catalog entry likely mislabels a product; needs a human to decide what it should point to.'),
    corrections: [
      { field: 'identity.name', catalog: 'Period Nirvana Disc, $42 (reusable)', source_says: 'No such product found; Period Nirvana sells other brands. Only Period Nirvana-branded disc listed: Fillow Disc and Applicator, $55 (Small)', source_url: 'https://shop.periodnirvana.com/collections/menstrual-discs-1.oembed?page=2' },
    ],
    facts: {
      'pricing.availability': f('No Period Nirvana-branded reusable disc at $42 found; Fillow Disc and Applicator (listed under Period Nirvana) $55 Small, Large out of stock', 'Period Nirvana disc collection', 'https://shop.periodnirvana.com/collections/menstrual-discs-1.oembed?page=2', 'retailer'),
      ...cupFda(),
      'safety.warnings': f(cupWarnFda, 'FDA: Menstrual Cups', FDA.cups, 'regulatory'),
    },
  },
  'p-aisle-underwear': {
    ...head('needs_correction', 'none_found', 'Checked Aisle FAQ (organic cotton + TENCEL, recycled polyester/TPU gusset; prices $34-$55 regular, e.g. Super Boxer $55, Essential Thong $34) and Essential High Rise page (fabric content, PFAS statement, FSA/HSA at checkout). Catalog "Organic cotton, PFAS-free absorbent layer" is incomplete: the body is TENCEL Modal/elastane; only the on-body gusset is organic cotton; leakproof layer is polyester PUL. Catalog does not name a style or absorbency. No recall found.'),
    corrections: [
      { field: 'composition.ingredients', catalog: 'Organic cotton, PFAS-free absorbent layer.', source_says: 'Essential High Rise: body 92% TENCEL Modal/8% elastane; gusset 95% organic cotton/5% elastane; leakproof lining 100% polyester PUL', source_url: 'https://periodaisle.com/products/essential-high-rise' },
    ],
    facts: {
      'identity.variant': f('Reference style: Aisle Essential High Rise (moderate flow, up to about 4 regular tampons); catalog style unspecified (Super, Boost, Essential lines)', 'Aisle product page', 'https://periodaisle.com/products/essential-high-rise'),
      'pricing.price': f('About $34-$55 per pair regular depending on style (e.g. Essential Thong $34, Super Boxer $55); sales vary', 'Aisle FAQ', 'https://periodaisle.com/blogs/all/period-underwear-faq'),
      'pricing.size_count': f('1 pair; sizes XXS to 5X', 'Aisle product page', 'https://periodaisle.com/products/essential-high-rise'),
      'pricing.fsa_hsa': f('FSA/HSA accepted at checkout (US)', 'Aisle product page', 'https://periodaisle.com/products/essential-high-rise'),
      'composition.ingredients': f('Body 92% TENCEL Modal, 8% elastane; on-body gusset 95% organic cotton, 5% elastane; leakproof lining 100% polyester PUL', 'Aisle product page', 'https://periodaisle.com/products/essential-high-rise'),
      'composition.allergens': f('Brand: no added PFAS; OEKO-TEX certified materials; third-party testing found no detectable PFAS at 1 ppm limit', 'Aisle product page', 'https://periodaisle.com/products/essential-high-rise'),
      'safety.warnings': f(`Rinse gusset in cool water, machine wash; no fabric softener or bleach (they degrade absorbency and the leakproof layer). ${padWarnFda}`, 'Aisle product page + FDA', 'https://periodaisle.com/products/essential-high-rise'),
      ...padFda(),
      'health.intended_use': f('Reusable period and leak underwear; brand says a pair replaces pads, tampons and cups (heavier styles hold about 4-8 tampons)', 'Aisle FAQ (manufacturer claims)', 'https://periodaisle.com/blogs/all/period-underwear-faq'),
    },
  },
  'p-period-co-underwear': {
    ...head('in_review', 'none_found', 'Checked Period. (period.co) Junior Boyshort page ($12, heavy, 95% organic cotton/5% spandex body, polyester absorbent and PUL layers) and Period. PFAS page (Intertek Prop 65 + PFAS panel pre-production, UL testing, claims UL "PFAS not detected" listing; no detection limits stated). Adult style prices not confirmed; catalog $12-$18 consistent with the junior style. No recall found.'),
    facts: {
      'identity.variant': f('Reference style: Period. Boyshort (Juniors), heavy absorbency; catalog style unspecified', 'Period. product page', 'https://period.co/products/the-boyshort-juniors'),
      'pricing.price': f('$12 per pair (Juniors Boyshort)', 'Period. product page', 'https://period.co/products/the-boyshort-juniors'),
      'pricing.size_count': f('1 pair; holds up to about 9 tampons / 5 pads of flow (per brand)', 'Period. product page', 'https://period.co/products/the-boyshort-juniors'),
      'composition.ingredients': f('Body 95% organic cotton, 5% spandex; absorbent layer 100% polyester (4 layers); leakproof layer 100% polyester PUL', 'Period. product page', 'https://period.co/products/the-boyshort-juniors'),
      'composition.allergens': f('Brand: fabrics pass Prop 65 and PFAS panels (Intertek) and UL testing with a "PFAS not detected" listing; detection limits not stated', 'Period. PFAS page', 'https://period.co/pages/are-period-underwear-made-without-pfas'),
      'safety.warnings': f(`Rinse, then wash on a regular cycle without bleach; tumble dry low or hang dry. Test at home to learn your own wear time. ${padWarnFda}`, 'Period. product page + FDA', 'https://period.co/products/the-boyshort-juniors'),
      ...padFda(),
      'health.intended_use': f('Reusable period underwear, including first periods (juniors line)', 'Period. product page', 'https://period.co/products/the-boyshort-juniors'),
    },
  },
  //@@NEXT@@
};

// ------------------------------------------------------------------ shared
// Category-level evidence and side effects from FDA / systematic reviews.
// These never overwrite a product-specific fact written above.
const LSTM_CUPS = 'https://lstmed.ac.uk/news/lstm-systematic-review-menstrual-cups-safe-cost-effective-and-enable-waste-saving/';
const CUPS = ['p-intimina-lily', 'p-hello-disc', 'p-saalt-disc', 'p-lena-cup', 'p-ruby-cup', 'p-organicup', 'p-femmycycle', 'p-flex-cup', 'p-ziggy-disc', 'p-lumma-disc', 'p-softdisc', 'p-period-nirvana-disc'];
const TAMPONS = ['p-playtex-sport', 'p-kotex-tampon', 'p-ob-tampon', 'p-tampax-radiant', 'p-seventh-gen-tampon', 'p-rael-tampon'];
const PADS = ['p-kotex-security', 'p-stayfree-ultra', 'p-seventh-gen-pad', 'p-u-kotex-pad', 'p-bodyform-pad', 'p-rael-overnight', 'p-cora-overnight', 'p-carefree-liners', 'p-always-liners', 'p-rael-liners', 'p-knix-underwear', 'p-bambody-underwear', 'p-aisle-underwear', 'p-period-co-underwear'];

const shared = {
  cup: {
    'safety.side_effects': f('FDA: stop and see a provider for itching, rash, pain, swelling or discomfort; latex-sensitive users should choose silicone. FDA adverse event reports for menstrual cups (2021-2026) most often describe device-patient interaction problems and a device stuck in the body.', 'FDA: Menstrual Cups + FDA TPLC (product code HHE)', 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfTPLC/tplc.cfm?id=HHE', 'regulatory'),
    'evidence.sources': f([
      { title: 'FDA: Menstrual Cups, facts and safe use', url: FDA.cups, evidence_type: 'regulatory', supports: 'Regulation, wear time, IUD caution, symptoms to watch' },
      { title: 'van Eijk et al. 2019, Lancet Public Health systematic review (LSTM summary)', url: LSTM_CUPS, evidence_type: 'clinical_guideline', supports: '43 studies, 3,300 people: cups leak similar to or less than pads and tampons and are safe; much data low quality' },
    ], 'FDA + LSTM', FDA.cups, 'regulatory'),
    'evidence.claims': f([
      { claim: 'Menstrual cups (category) leak about the same or less than pads or tampons and are safe for menstrual collection', strength: 'moderate', evidence_type: 'ingredient_research', source_url: LSTM_CUPS, product_specific: false },
    ], 'LSTM summary of Lancet Public Health review', LSTM_CUPS, 'research'),
    'evidence.strength': f('moderate for the category (systematic review, mostly low-quality studies); this product not studied', 'ayna evidence review of cited sources', LSTM_CUPS, 'research'),
  },
  tampon: {
    'evidence.sources': f([
      { title: 'FDA: Tampons, facts and safe use', url: FDA.tampons, evidence_type: 'regulatory', supports: 'FDA authorization, absorbency labeling, TSS warning signs, 4-8 hour change guidance, 2026 metals study' },
    ], 'FDA: Tampons', FDA.tampons, 'regulatory'),
    'evidence.claims': f([
      { claim: 'FDA-authorized tampons absorb menstrual flow; TSS risk is reduced by using the lowest absorbency and changing every 4-8 hours', strength: 'strong', evidence_type: 'regulatory', source_url: FDA.tampons, product_specific: false },
    ], 'FDA: Tampons', FDA.tampons, 'regulatory'),
    'evidence.strength': f('strong for safe-use guidance (FDA); product-specific performance not independently studied', 'ayna evidence review of cited sources', FDA.tampons, 'regulatory'),
  },
  pad: {
    'safety.side_effects': f('FDA: wearing a pad too long may irritate skin; some people react to scents, deodorants or other materials; stop and see a provider for itching, rash, pain or swelling.', 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
    'evidence.sources': f([
      { title: 'FDA: Menstrual Pads and Liners, facts and safe use', url: FDA.pads, evidence_type: 'regulatory', supports: 'Regulation as medical devices, change frequency, irritation and sensitivity' },
    ], 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
    'evidence.claims': f([
      { claim: 'External pads and period underwear absorb menstrual flow; change often to limit skin irritation', strength: 'strong', evidence_type: 'regulatory', source_url: FDA.pads, product_specific: false },
    ], 'FDA: Menstrual Pads and Liners', FDA.pads, 'regulatory'),
    'evidence.strength': f('strong for safe-use guidance (FDA); absorbency and leak claims are manufacturer information', 'ayna evidence review of cited sources', FDA.pads, 'regulatory'),
  },
};

const fill = (ids, facts) => {
  for (const id of ids) {
    if (!R[id]) continue;
    for (const [k, v] of Object.entries(facts)) if (!R[id].facts[k]) R[id].facts[k] = v;
  }
};
fill(CUPS, shared.cup);
fill(TAMPONS, shared.tampon);
fill(PADS, shared.pad);

const STRENGTH = {
  'd-calm': ['limited: one manufacturer-adjacent RCT in college students (stress)', 'https://pubmed.ncbi.nlm.nih.gov/31237569/', 'research'],
  'd-oura': ['moderate for retrospective ovulation detection (manufacturer-run validation, JMIR 2025); not a medical device', 'https://resources.ouraring.com/oura-ring-ovulation-detection-validation-analysis', 'brand'],
  'd-apple-health': ['limited: manufacturer information only; not for contraception or diagnosis', 'https://www.apple.com/nz/health/', 'brand'],
  'p-mystery-vibe': ['none cited: "clinically proven" badge without a named study', 'https://mysteryvibe.com/pages/crescendo2-health', 'brand'],
};
for (const [id, [value, url, type]] of Object.entries(STRENGTH)) {
  if (R[id] && !R[id].facts['evidence.strength']) R[id].facts['evidence.strength'] = f(value, 'ayna evidence review of cited sources', url, type);
}

// Products whose catalog entry carries no source links: their source list is
// the distinct pages cited above (others keep the catalog list).
const EV = { regulatory: 'regulatory', research: 'ingredient_research', clinical_guidance: 'clinical_guideline' };
const EV_LABEL = { regulatory: 'Regulatory information', ingredient_research: 'Ingredient research', clinical_guideline: 'Clinical guideline', manufacturer: 'Manufacturer information' };
const NO_CATALOG_SOURCES = new Set(['p-u-kotex-pad', 'p-rael-overnight', 'p-flex-cup', 'p-softdisc', 'p-aisle-underwear']);
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

// ============================================================
// Ayna Product Database — Brand Catalog Entries
// Smaller/newer brands, added so their products surface reliably in
// Discovery search regardless of whether the AI-suggestion fallback
// recognizes the brand name (see naturalLanguageSearch.js). These are
// NOT partnership relationships — just catalog entries for real brands.
// VERIFICATION: every entry below was confirmed against the brand's own
// live site before being added — see api/_officialSiteFetch.js, which
// grounds the Ask Ayna chat in these same official-site url fields.
// ============================================================

export const BRAND_PRODUCTS = [
    {
        id: 'p-winx-uti-test-treat',
        name: 'Winx Health UTI Test + Treat',
        brand: 'Winx Health',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['uti-prevention', 'telehealth'],
        tags: ['uti', 'safety-concern', 'privacy'],
        price: '$15',
        whereToBuy: ['Walgreens'],
        url: 'https://hellowinx.com/products/uti-tests', // was the bare homepage; this is the actual product page
        faqUrl: 'https://hellowinx.com/pages/faq',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/UTITest_Treat_1.png?v=1771347569',
        summary: 'An at-home UTI test paired with Winx Rx, the brand\'s own telehealth service. Check symptoms with a rapid test, then connect to a licensed provider for prescription treatment if needed. Recognized as a TIME Best Invention.',
        safety: {
            fdaStatus: 'Consumer diagnostic test; any prescription treatment is issued by a licensed telehealth provider, not the test itself.',
            materials: 'See product packaging for full test component and ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself; any treatment side effects depend on the medication a provider prescribes.',
            opinionAlerts: 'Winx Health markets this as "OBGYN approved" on its own site. Verify current claims and availability directly at hellowinx.com.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Winx Health\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Winx Health describes its UTI Test + Treat as "OBGYN approved," with Winx Rx able to deliver prescription treatment results in about 4 hours.',
        effectiveness: 'Combines an at-home rapid test with telehealth access to prescription treatment; the underlying test was recognized as a TIME Best Invention.',
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    // Winx Health's real remaining standalone catalog (2026-08-24) — the
    // search-experience gap this closes: searching "winx" only ever
    // surfaced this one product even though the brand sells several.
    // Pulled from hellowinx.com's own Shopify products.json feed, same
    // verification standard as Oboo. Skipped: 5 "Online Prescription" SKUs
    // (Ayna doesn't dispense or name specific prescriptions), the merch
    // crewneck, the Restart(TM) morning-after-pill line and its bundles
    // (prescription-adjacent, same reasoning), and bundle/value-pack SKUs
    // that just repackage these same standalone products.
    {
        id: 'p-winx-vaginal-health-test-treat',
        name: 'Winx Health Vaginal Health Test + Treat',
        brand: 'Winx Health',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'telehealth'],
        tags: ['privacy', 'safety-concern'],
        price: '$15',
        whereToBuy: [],
        url: 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/Vaginal_Health_Test_Treat_Graphic.png?v=1771347513',
        summary: 'An at-home vaginal pH test to help tell a yeast infection, BV, or something else apart, with same-day prescription treatment available via Winx\'s own telehealth service if needed.',
        safety: {
            fdaStatus: 'Consumer diagnostic test; any prescription treatment is issued by a licensed telehealth provider, not the test itself.',
            materials: 'See product packaging for full test component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself; any treatment side effects depend on the medication a provider prescribes.',
            opinionAlerts: 'Marketed by Winx Health as its own product; verify current claims and availability directly at hellowinx.com.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Winx Health\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Winx Health positions this as a way to tell yeast infection, BV, or other causes apart at home before deciding whether treatment is needed.',
        effectiveness: 'Combines an at-home pH test with telehealth access to prescription treatment when appropriate; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-winx-pregnancy-tests',
        name: 'Winx Health Early Pregnancy Tests',
        brand: 'Winx Health',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['fertility'],
        tags: ['privacy'],
        price: '$13',
        whereToBuy: [],
        url: 'https://hellowinx.com/products/pregnancy-tests',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/Early_Pregnancy_Tests.png?v=1775185073',
        summary: 'Early pregnancy tests from Winx Health (formerly Stix), the brand states are over 99% accurate, with discreet packaging and delivery.',
        safety: {
            fdaStatus: 'Over-the-counter home pregnancy test.',
            materials: 'See product packaging.',
            recalls: 'No recalls found.',
            sideEffects: 'None.',
            opinionAlerts: 'Accuracy claim ("over 99% accurate") is the brand\'s own; not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Winx Health\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'A standard at-home pregnancy test; Winx Health emphasizes discreet packaging and privacy.',
        effectiveness: 'Positioned as an accurate, private at-home pregnancy test; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-winx-uti-pain-relief',
        name: 'Winx Health UTI Fast-Acting Pain Relief',
        brand: 'Winx Health',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['uti-prevention'],
        tags: ['uti'],
        price: '$10.50',
        whereToBuy: [],
        url: 'https://hellowinx.com/products/uti-fast-acting-pain-relief',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/01WinxUTIPainReliefHero.png?v=1771347535',
        summary: 'An over-the-counter supplement from Winx Health marketed for fast-acting relief of UTI-related discomfort.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA.',
            materials: 'See product packaging for full ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications; UTI pain relief products can mask symptoms of a worsening infection.',
            opinionAlerts: 'No clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Winx Health\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Positioned by the brand for short-term relief of UTI discomfort, not as a substitute for diagnosis or treatment.',
        effectiveness: 'Positioned as fast-acting symptom relief; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-winx-vaginal-probiotic',
        name: 'Winx Health Vaginal Health Probiotic',
        brand: 'Winx Health',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['comfort'],
        price: '$28',
        whereToBuy: [],
        url: 'https://hellowinx.com/products/vaginal-health-probiotic',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/01_Winx_probiotic_Hero.png?v=1771347498',
        summary: 'A daily probiotic supplement the brand describes as supporting vaginal health with "good bacteria" that can help crowd out bacteria and yeast linked to BV and yeast infections.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA.',
            materials: 'See product packaging for full ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications.',
            opinionAlerts: 'No clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Winx Health\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Positioned as daily maintenance support for vaginal flora balance, not a treatment for an active infection.',
        effectiveness: 'Positioned as a daily preventive supplement; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-winx-uti-daily-defense',
        name: 'Winx Health Urinary Daily Defense',
        brand: 'Winx Health',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['uti-prevention'],
        tags: ['uti'],
        price: '$28',
        whereToBuy: [],
        url: 'https://hellowinx.com/products/uti-daily-protection-supplement',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/01WinxDailyDefenseHero.png?v=1771339808',
        summary: 'A daily supplement the brand states was designed with urologists, using science-backed natural ingredients intended to help protect against UTIs before they start.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA.',
            materials: 'See product packaging for full ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications.',
            opinionAlerts: 'The "designed with urologists" claim is the brand\'s own; not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Winx Health\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Positioned as a daily preventive supplement for recurrent UTI risk, not a treatment for an active infection.',
        effectiveness: 'Positioned as a daily preventive supplement; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-neycher-vaginal-moisturizer',
        name: 'Neycher Vaginal Moisturizer',
        brand: 'Neycher',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'organic', 'comfort'],
        price: '$32.91',
        whereToBuy: ['helloneycher.com', 'Amazon'],
        url: 'https://www.helloneycher.com/product/vaginal-moisturizer',
        faqUrl: 'https://www.helloneycher.com/faq',
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/686eb5fcdbbd35b6fc957602_Frame%201000011567.jpg',
        summary: 'A hormone-free vaginal suppository that pairs hyaluronic acid with a bioadhesive gel to moisturize from the inside, holding moisture at the vaginal wall for days rather than hours. Positioned for the dryness, irritation, and pain during sex common in perimenopause, menopause, postpartum, and after cancer treatment or a hysterectomy.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            // Full packaging ingredient list lives here (not truncated — see
            // buildFactRows in ProductModal.jsx) so it shows in full under
            // "Materials" on the Evidence view, instead of the leftover-space
            // ingredient science paragraphs below.
            materials: '10 suppositories per box, 2 g each. Ingredients (from the box): hyaluronic acid (sodium hyaluronate, 10 mg per suppository), polycarbophil, glycyrrhetinic acid (from licorice root), vitamin E (tocopheryl acetate), vitamin A (retinyl palmitate), tea tree oil, phosphatidylcholine, and lactic acid, in a caprylic/capric triglyceride base.',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation or burning. One ingredient, polycarbophil, can cause a white, clumpy discharge as old tissue sheds — that looks like a yeast infection but isn\'t one, and it usually lessens with regular use. Full warnings are listed below.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher states its formulas are developed with input from "scientists, doctors, and researchers" and are "OB/GYN and real people-approved," per the brand\'s own site.\n\nNeycher also cites its own clinical evaluation: 20 women (ages 29-74) with vulvovaginal symptoms used the product for about a month, assessed with the Vulvovaginal Symptoms Questionnaire (VSQ) — a real, peer-reviewed tool (Erekson et al., Menopause, 2013) — analyzed by paired t-test (brand-reported as p<0.001 on every measure).\n\nResults: mean VSQ symptom score dropped from 9.22 to 0.61 (p<0.001), with complete symptom remission in 65% of participants and a greater than 50% reduction in discomfort in 89%, with improvement reported after just one week. No adverse events were recorded.\n\nNeycher\'s own site doesn\'t publish this study as a standalone paper — the closest verifiable public source is Gruppo FarmaImpresa (the manufacturer named on Neycher\'s own technical documentation, doc ref FT.CE.110), whose hyaluronic acid + polycarbophil + lactic acid ovule — the same formulation profile as this product — matches this exact study design and these exact numbers on their own site. This is the manufacturer\'s own published summary of its clinical evaluation, not an independently peer-reviewed journal article; the VSQ instrument it used is real and independently validated.',
        // Shorter, results-first version for the Evidence view's rail card
        // (ProductEvidenceRail.jsx), which has much less horizontal room
        // than the ayna-summary tab's full-width Clinician opinion card —
        // that one keeps the full walkthrough above.
        doctorOpinionShort: 'Neycher cites its own 20-woman clinical evaluation: mean VSQ symptom score dropped from 9.22 to 0.61 (p<0.001), with complete symptom remission in 65% of participants and improvement reported within one week. No adverse events were recorded. This is the manufacturer\'s own funded evaluation, not an independently peer-reviewed study.',
        // Kept separate from verificationLinks.scientific/doctor on purpose —
        // that data also feeds the Scientific literature tab's citation
        // list, and these two links belong only on the clinical-study claim
        // above, not mixed into that list.
        doctorOpinionCitations: [
            { url: 'https://farmaimpresa.com/en/hyaluronic-acid-eggs-clinical-study-shows-positive-effects-on-vulvovaginal-symptoms/', label: 'Farmaimpresa: the study\'s actual source' },
            { url: 'https://helloneycher.com/products/vaginal-moisturizer?Title=Default', label: 'Helloneycher: where Neycher presents this claim' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women in perimenopause and menopause',
            'Women after a hysterectomy or removal of the ovaries (surgical menopause)',
            'Postpartum women, once their doctor has cleared them (usually at the 6-week checkup), and breastfeeding women',
            'Breast cancer survivors and anyone who can\'t or doesn\'t want to use hormone therapy',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches the
        // "Application" section on Neycher's own live product page (updated
        // from the earlier brand-guidelines PDF, which said "2 to 3 times a
        // week" instead of "every 3 to 5 nights" — the live site is the more
        // current source).
        howToUse: {
            intro: 'Lie down and insert one suppository into the vagina. Stay lying down for about 30 minutes so it absorbs fully, which makes bedtime the easiest time to use it.',
            steps: [
                'For the first 10 nights, use one each night.',
                'After that, every 3 to 5 nights is enough for most, or adjust to your comfort and your doctor\'s guidance.',
                'Don\'t use it more than 30 days in a row. Some customers cut a suppository in half.',
                'Don\'t use it during your period. A thin pad can help with any discharge.',
            ],
            sourceUrl: 'https://helloneycher.com/products/vaginal-moisturizer?Title=Default',
            sourceLabel: 'helloneycher.com: Vaginal Moisturizer — Application',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'No oral sex during the course: tea tree oil must not be swallowed.',
            'Oil-based: can weaken latex condoms.',
            'After giving birth: only once her doctor clears it, usually at 6 weeks.',
            'Pregnant or breastfeeding: check with a doctor first.',
            'Irritation or burning: stop and see a doctor.',
        ],
        communityReview: 'Neycher.com and Amazon both carry customer reviews for this moisturizer; visible feedback centers on noticeably improved day-to-day comfort after adding it to a routine. A specific rating/review count wasn\'t independently verifiable at time of writing. Amazon blocked automated access, and the badge shown on Neycher\'s own product pages is identical across multiple different products, so it isn\'t trustworthy as a per-product figure.',
        effectiveness: 'Vaginal moisturizers as a category are supported by systematic-review evidence for improving dryness versus placebo (low certainty); no independent clinical study of this specific product was found.',
        // Plain-text ingredient summary — kept as a string since search
        // indexing (naturalLanguageSearch.js), the interaction checker
        // (interactions.js), DoctorPrep.jsx, and the Ask Ayna context
        // builder (productHowToUse.js) all read this field as a string.
        // Changing its shape would break all four.
        ingredients: 'Hyaluronic acid (10 mg), polycarbophil, glycyrrhetinic acid (from licorice root), lactic acid, vitamins E and A, tea tree oil.',
        // Per-ingredient science claims, each paired with its own credible
        // source (NIH-hosted: PMC/PubMed or an NIH institute's own fact
        // sheet) — not the plain-string `ingredients` above, so this can
        // carry structured citations without changing that field's shape.
        // Rendered on the Scientific literature tab.
        ingredientScience: [
            {
                name: 'Hyaluronic acid (10 mg)',
                text: 'Binds large amounts of water. It draws moisture into the vaginal lining, holds it there, and supports tissue repair.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13160248/', label: 'NIH (PMC): Real-world effectiveness of a hyaluronic acid-based vaginal moisturizer' },
                ],
            },
            {
                name: 'Polycarbophil',
                text: 'A bioadhesive gel that sticks to the vaginal wall and holds water against it for days, so the effect lasts much longer than a lubricant. It also helps the tissue renew — as it does, old, dry cells that have built up come away, so some women notice a white, clumpy discharge that looks like a yeast infection. It isn\'t one; it\'s the old cells leaving, and it usually lessens with regular use.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7838131/', label: 'NIH (PMC): Polycarbophil-based cream for genitourinary syndrome of menopause' },
                ],
            },
            {
                name: 'Glycyrrhetinic acid (from licorice root)',
                text: 'Calms irritation, redness, and burning.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9025446/', label: 'NIH (PMC): Anti-inflammatory properties of licorice (Glycyrrhiza glabra)' },
                ],
            },
            {
                name: 'Lactic acid',
                text: 'The same acid healthy vaginal bacteria produce. It keeps pH in its natural acidic range (3.8 to 4.5).',
                citations: [
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6332693/', label: 'NIH (PMC): Vaginal pH measured in vivo — lactobacilli determine pH and lactic acid concentration' },
                ],
            },
            {
                name: 'Vitamins E and A',
                text: 'Vitamin E is an antioxidant that protects and softens the tissue; vitamin A supports renewal of the vaginal lining.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Vitamin E' },
                    { url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Vitamin A' },
                ],
            },
            {
                name: 'Tea tree oil',
                text: 'Used in a small, carefully chosen amount — pure tea tree oil at high concentrations can irritate, but here it sits inside a formula built to hydrate and calm (hyaluronic acid, polycarbophil, glycyrrhetinic acid, vitamin E), not as a stand-alone antiseptic.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH NCCIH: Tea Tree Oil — Usefulness and Safety' },
                ],
            },
        ],
        // Curated so the Scientific literature tab always has real citations on
        // file, instead of depending on api/product-insights.js's live LLM call
        // succeeding (which needs its own API key configured — silently comes
        // back empty on an environment, like a fresh localhost checkout, that
        // doesn't have one set).
        // Category-level citations shown only on the Scientific literature
        // tab (merged there with the per-ingredient citations below) — kept
        // out of verificationLinks so they don't also pool onto the
        // Clinician opinion card's chip row, which only wants
        // doctorOpinionCitations (the two clinical-study-specific links).
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/39250810/',
                text: 'Hormonal Treatments and Vaginal Moisturizers for Genitourinary Syndrome of Menopause: A Systematic Review',
                summary: 'A systematic review (Danan et al., Annals of Internal Medicine, 2024) of randomized trials found vaginal moisturizers may improve dryness versus placebo (low certainty of evidence). This is intervention-level evidence and does not validate a specific moisturizer product.',
            },
            {
                url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                text: 'ACOG: Vulvovaginal Health',
                summary: 'ACOG notes that over-the-counter vaginal moisturizers and lubricants can help relieve vaginal dryness and painful sex. This is clinical-guidance-level evidence, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [],
            },
            community: {
                links: [
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/HealthyHooha/search/?q=neycher&restrict_sr=1',
                        text: 'Reddit r/HealthyHooha: Neycher',
                        summary: 'Community discussions on Neycher\'s intimate-care line, including this moisturizer.',
                    },
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0DMTDP1J7?lv=shuf&channelId=500&plpRedirect=mhFallback&th=1',
                        text: 'Amazon: Neycher Vaginal Moisturizer reviews',
                        summary: 'Visible feedback centers on noticeably improved day-to-day comfort after adding it to a routine. A specific rating/review count wasn\'t independently verifiable at time of writing — Amazon blocks automated access.',
                    },
                    {
                        platform: 'website',
                        url: 'https://helloneycher.com/products/goodbye-dryness-bundle?Title=Default',
                        text: 'helloneycher.com: Customer reviews',
                        summary: 'Neycher\'s own site carries customer reviews across its intimate-care line, including this moisturizer.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    {
        id: 'p-neycher-odor-be-gone',
        name: 'Neycher Odor Be Gone',
        brand: 'Neycher',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'non-hormonal'],
        price: '$29.97 (10 suppositories)',
        whereToBuy: ['helloneycher.com'],
        url: 'https://helloneycher.com/products/odor-be-gone',
        faqUrl: 'https://www.helloneycher.com/faq',
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/6a0b3e76d248803f468a5c1e_Frame%201000011416%20(1).webp',
        summary: 'Vaginal odor, unusual discharge, and irritation often mean the vagina\'s pH has shifted, letting BV or yeast overgrow. This boric acid suppository (10 count, 2 g each) uses half the usual dose, paired with hyaluronic acid, lactic acid, and calming plant extracts, so it works without the dryness and burning pure boric acid products are known for.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            // Full packaging ingredient list — shown in full under
            // "Materials" on the Evidence view (see buildFactRows in
            // ProductModal.jsx, which doesn't truncate this field).
            materials: '10 suppositories per box, 2 g each. Ingredients (from the box): boric acid (300 mg), hyaluronic acid (20 mg), lactic acid, tea tree oil, vitamin E, glycyrrhetinic acid (from licorice root), and chlorhexidine (stabilizer), in a semi-synthetic triglyceride base.',
            recalls: 'No recalls found.',
            sideEffects: 'Boric acid suppositories are for vaginal use only and are toxic if swallowed — keep away from children. Discontinue and see a doctor if you notice irritation, or if symptoms don\'t improve, keep coming back, or come with fever, pain, or bleeding. Full warnings are listed below.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher states this formula "helps decrease your pH, preventing the formation of bacteria and yeast overgrowth," per the brand\'s own site. Boric acid is a recognized, commonly used option for recurrent vaginal odor and BV/yeast-related complaints generally — talk to a clinician before starting it. No clinical trial or study specific to this product was found on the brand\'s site.',
        doctorOpinionShort: 'Boric acid is a recognized, commonly used option for recurrent vaginal odor and BV/yeast complaints generally. No clinical trial specific to this product was found on Neycher\'s site.',
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with odor, unusual discharge, itching, or irritation',
            'Women whose symptoms keep coming back after a period, sex, or antibiotics',
            'Women who\'ve tried boric acid capsules and found them drying or burning',
            'Women in perimenopause and menopause who notice their scent has changed',
        ],
        // Rendered as a bulleted list on the Evidence view.
        howToUse: {
            intro: 'With clean, dry hands, peel open the blister and insert one suppository into the vagina with your fingers, preferably at bedtime — no applicator needed.',
            steps: [
                'One a night for 10 nights in a row, or occasionally as needed.',
                'Don\'t use it during your period. A thin pad can help with any discharge.',
            ],
            sourceUrl: 'https://helloneycher.com/products/odor-be-gone',
            sourceLabel: 'helloneycher.com: Odor Be Gone',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not for dryness on its own (that\'s the Vaginal Moisturizer or HydroBloom Gel), or for STIs, which can cause similar odor and discharge.',
            'No oral sex during the course: boric acid and tea tree oil must not be swallowed.',
            'Oil-based: can weaken latex condoms.',
            'Never recommended in pregnancy. Breastfeeding: check with a doctor first.',
            'See a doctor if symptoms don\'t improve, keep coming back, or come with fever, pain, or bleeding.',
        ],
        communityReview: 'Neycher.com and Amazon both carry customer reviews for this product; a specific rating/review count wasn\'t independently verifiable at time of writing — Amazon blocks automated access.',
        effectiveness: 'Used nightly for about ten nights, it\'s meant to bring odor and discharge back under control gently rather than all at once.',
        // Plain-text summary — kept as a string since search indexing,
        // the interaction checker, and DoctorPrep.jsx all read this as text.
        ingredients: 'Boric acid (300 mg), hyaluronic acid (20 mg), lactic acid, tea tree oil, vitamin E, glycyrrhetinic acid (from licorice root), chlorhexidine.',
        // Per-ingredient science claims, each paired with a credible source
        // (NIH-hosted or ACOG). Rendered on the Scientific literature tab.
        ingredientScience: [
            {
                name: 'Boric acid (300 mg)',
                text: 'A mild acid that brings pH back down to its natural range. Half the usual dose, to avoid the burning and dryness pure boric acid products cause.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/21774671/', label: 'NIH: Boric acid for recurrent vulvovaginal candidiasis — the clinical evidence (Iavazzo et al., 2011)' },
                ],
            },
            {
                name: 'Lactic acid',
                text: 'The same acid healthy lactobacilli produce. It helps restore the acidic environment they need to take over again.',
                citations: [
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6332693/', label: 'NIH (PMC): Vaginal pH measured in vivo — lactobacilli determine pH and lactic acid concentration' },
                ],
            },
            {
                name: 'Hyaluronic acid (20 mg)',
                text: 'Binds water and keeps the vaginal lining hydrated, so the tissue doesn\'t dry out while the pH resets.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13160248/', label: 'NIH (PMC): Real-world effectiveness of a hyaluronic acid-based vaginal moisturizer' },
                ],
            },
            {
                name: 'Tea tree oil',
                text: 'Used in a small, carefully chosen amount — pure tea tree oil at high concentrations can irritate, but here it sits inside a formula built to hydrate and calm.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH NCCIH: Tea Tree Oil — Usefulness and Safety' },
                ],
            },
            {
                name: 'Glycyrrhetinic acid (from licorice root) and vitamin E',
                text: 'Calm irritation, redness, and burning, and protect the tissue.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9025446/', label: 'NIH (PMC): Anti-inflammatory properties of licorice (Glycyrrhiza glabra)' },
                    { url: 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Vitamin E' },
                ],
            },
        ],
        // Category-level citation shown only on the Scientific literature
        // tab, kept out of verificationLinks so it doesn't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://www.acog.org/womens-health/faqs/vaginitis',
                text: 'ACOG: Vaginitis',
                summary: 'ACOG on bacterial vaginosis, yeast infections, and how vaginal pH relates to odor and discharge. This is clinical-guidance-level evidence, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/HealthyHooha/search/?q=neycher+odor&restrict_sr=1',
                        text: 'Reddit r/HealthyHooha: Neycher Odor Be Gone',
                        summary: 'Community discussions on Neycher\'s intimate-care line, including this product.',
                    },
                    {
                        platform: 'website',
                        url: 'https://helloneycher.com/products/odor-be-gone',
                        text: 'helloneycher.com: Customer reviews',
                        summary: 'Neycher\'s own product page for this product.',
                    },
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/Neycher-Suppositories-Acting-Inserts-Control/dp/B0HJ6GYKQC/ref=sr_1_2?crid=CL8QR8MLEMBV&dib=eyJ2IjoiMSJ9.yS5SRCyC9xJWjRHdGllkk97WIdbc8H7L1ZMCfNqpBh8jS4oGVW5GRpYa44XUWbjO-UEgm558Qlbesdl8GD7mpTXDyri-D4sm363-_ltDEXU.hNeWuaJaBMbUQ16VIWoL0JF28q6iezfdZncHiVJ1xDk&dib_tag=se&keywords=neycher&qid=1790103716&sprefix=neyche%2Caps%2C158&sr=8-2',
                        text: 'Amazon: Neycher Odor Be Gone reviews',
                        // Amazon blocks automated access, so this isn't a
                        // summary of actual review text — just confirms this
                        // is the real, current product listing. Read the
                        // reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-neycher-hydrobloom-gel',
        name: 'Neycher HydroBloom Moisturizing Gel',
        brand: 'Neycher',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'organic', 'non-hormonal'],
        price: '$25.97',
        whereToBuy: ['helloneycher.com', 'Amazon'],
        url: 'https://helloneycher.com/products/hydrobloom-moisturizing-gel?Title=Default',
        faqUrl: 'https://www.helloneycher.com/faq',
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/69b007753e5c0c33308cc349_hand.webp',
        summary: 'Vulvar dryness and irritation are common from hormonal changes, friction, or harsh soaps. This hormone-free, pH-balanced gel pairs hyaluronic acid and glycerin to hydrate outside on the vulva and inside the vagina, non-sticky and fast-absorbing.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            materials: '30 ml tube with applicator. Ingredients (from the box): water, glycerin, aloe leaf juice, black currant fruit extract, lavender flower water, hyaluronic acid (sodium hyaluronate), chamomile flower extract, calendula flower extract, lactic acid, vitamin E (tocopheryl acetate), linseed oil, vitamin A (retinyl palmitate), in a hydroxyethylcellulose gel base, with preservatives (imidazolidinyl urea, potassium sorbate, disodium EDTA) and solubilizers (PEG-40 hydrogenated castor oil, polysorbate 20).',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation or an allergic reaction. Contains chamomile and calendula — if you have a daisy-family allergy (such as ragweed), test on a small area first. Full warnings are listed below.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher states the formula "creates a protective hydrating layer that supports long-lasting moisture and comfort," per the brand\'s own site. No clinical trial or study specific to this gel was found on the brand\'s site.',
        // Shorter version for the Evidence view's narrower rail card — see
        // the Vaginal Moisturizer entry for why these are split.
        doctorOpinionShort: 'No clinical trial specific to this gel was found on Neycher\'s site.',
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Anyone whose vulva feels dry, tight, itchy, or irritated, at any age',
            'Women in perimenopause and menopause who feel dryness on the outside (pairs with the Vaginal Moisturizer for inside-plus-outside care)',
            'Postpartum women once stitches or tears have healed (inside use only after a doctor clears it), and breastfeeding women',
            'Women with irritation from shaving, waxing, workouts, cycling, tight clothes, or sex',
            'Women who prefer a gel to suppositories, or want quick comfort during the day',
        ],
        // Rendered as a bulleted list on the Evidence view.
        howToUse: {
            intro: 'Outside: with clean hands, apply a fingertip amount to clean skin around the vulva, daily or as often as needed.',
            steps: [
                'Inside: take the applicator out of its sachet and screw it onto the tube.',
                'Gently insert the applicator into the vagina and squeeze the tube lightly until a comfortable amount of gel comes out.',
                'Unscrew the applicator after use and rinse it well with warm water.',
            ],
            sourceUrl: 'https://helloneycher.com/products/hydrobloom-moisturizing-gel?Title=Default',
            sourceLabel: 'helloneycher.com: HydroBloom Gel',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not for odor, unusual discharge, or itching inside the vagina — that can signal an infection; Neycher\'s Odor Be Gone is for that instead.',
            'After giving birth: outside only on healed skin; inside only once a doctor clears it.',
            'Daisy-family allergy (such as ragweed): test on a small area first — contains chamomile and calendula.',
            'Irritation or an allergic reaction: stop using it.',
        ],
        communityReview: 'Neycher.com and Amazon both carry customer reviews for this gel; a specific rating/review count wasn\'t independently verifiable at time of writing.',
        effectiveness: 'No clinical trial specific to this gel was found on the brand\'s site.',
        // Plain-text summary — kept as a string since search indexing,
        // the interaction checker, and DoctorPrep.jsx all read this as text.
        ingredients: 'Hyaluronic acid (sodium hyaluronate), glycerin, aloe leaf juice, black currant fruit extract, lavender flower water, chamomile flower extract, calendula flower extract, lactic acid, vitamin E, linseed oil, vitamin A.',
        // Per-ingredient science claims, each paired with a credible source
        // (NIH-hosted or ACOG). Rendered on the Scientific literature tab.
        ingredientScience: [
            {
                name: 'Hyaluronic acid and glycerin',
                text: 'Both bind water and draw moisture into the skin and mucosa, so they stay soft and hydrated.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13160248/', label: 'NIH (PMC): Real-world effectiveness of a hyaluronic acid-based vaginal moisturizer' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9205919/', label: 'NIH (PMC): Moisture retention of glycerin solutions' },
                ],
            },
            {
                name: 'Linseed oil',
                text: 'Rich in omega-3 fatty acids. It softens the skin and helps the skin barrier hold on to moisture.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/21088453/', label: 'NIH: Flaxseed oil diminishes skin sensitivity and improves skin barrier function' },
                ],
            },
            {
                name: 'Lactic acid',
                text: 'The same acid healthy vaginal bacteria produce. It keeps intimate skin at its natural acidic pH.',
                citations: [
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6332693/', label: 'NIH (PMC): Vaginal pH measured in vivo — lactobacilli determine pH and lactic acid concentration' },
                ],
            },
            {
                name: 'Vitamin E',
                text: 'An antioxidant that protects the skin barrier and softens the skin.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Vitamin E' },
                ],
            },
            {
                name: 'Vitamin A',
                text: 'Supports skin renewal, so irritated skin recovers faster.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Vitamin A' },
                ],
            },
            {
                name: 'Aloe vera',
                text: 'Cools and soothes irritated skin.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/18253066/', label: 'NIH: Anti-inflammatory potential of Aloe vera gel in the ultraviolet erythema test' },
                ],
            },
            {
                name: 'Calendula and chamomile',
                text: 'Classic calming plants for sensitive skin. They reduce redness and sensitivity and support skin recovery.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31145533/', label: 'NIH: Systematic review of Calendula officinalis extract for wound healing' },
                ],
            },
            {
                name: 'Lavender flower water',
                text: 'A gentle floral water (not the essential oil) that soothes and calms redness.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13466918/', label: 'NIH (PMC): Pharmacological properties of lavender essential oil — background on the active compound family, not a hydrosol-specific study' },
                ],
            },
            {
                name: 'Black currant fruit extract',
                text: 'Rich in antioxidants that protect the skin.',
                citations: [
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12899128/', label: 'NIH (PMC): Antioxidant and antiproliferative properties of black currant (Ribes nigrum) extracts' },
                ],
            },
        ],
        // Category-level citation shown only on the Scientific literature
        // tab, kept out of verificationLinks so it doesn't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://www.acog.org/womens-health/faqs/disorders-of-the-vulva-common-causes-of-vulvar-pain-burning-and-itching',
                text: 'ACOG: Disorders of the Vulva — Common Causes of Vulvar Pain, Burning, and Itching',
                summary: 'ACOG on why vulvar skin is especially prone to dryness, friction, and irritation, and general management guidance. This is clinical-guidance-level evidence, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/HealthyHooha/search/?q=neycher+hydrobloom&restrict_sr=1',
                        text: 'Reddit r/HealthyHooha: Neycher HydroBloom',
                        summary: 'Community discussions on Neycher\'s intimate-care line, including this gel.',
                    },
                    {
                        platform: 'website',
                        url: 'https://helloneycher.com/products/hydrobloom-moisturizing-gel?Title=Default',
                        text: 'helloneycher.com: Customer reviews',
                        summary: 'Neycher\'s own product page for this gel.',
                    },
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/Neycher-Hyaluronic-Vaginal-Moisturizing-Calendula/dp/B0G822S3QN?ref_=ast_sto_dp',
                        text: 'Amazon: Neycher HydroBloom reviews',
                        // Amazon blocks automated access, so this isn't a
                        // summary of actual review text — just confirms
                        // this is the real, current product listing (Made
                        // in Italy, 20 mg hyaluronic acid, ranked in
                        // Amazon's Vaginal Moisturizers category at time of
                        // writing). Read the reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-neycher-botanical-vulva-balm',
        name: 'Neycher Botanical Vulva Balm',
        brand: 'Neycher',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'organic', 'non-hormonal'],
        price: '$23.45',
        whereToBuy: ['helloneycher.com'],
        // url previously pointed to /product/botanical-vulva-balm, which 404s
        // (2026-08-24) — removed rather than left dead; falls back to the
        // brand homepage via whereToBuy above.
        faqUrl: 'https://www.helloneycher.com/faq',
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/686ecba35751d51959233c9e_botanical%20vulva%20balm.jpg',
        summary: 'An external, hormone-free balm for vulvar skin, made with 11 botanicals. Applied topically to the outer intimate area. Not inserted.',
        ingredients: '11 botanicals including grape seed oil, beeswax, lavender, jojoba seed oil, shea butter, rosehip seed oil, meadowfoam seed oil, calendula flower extract, olive oil, tea tree leaf oil, and chamomile.',
        safety: {
            fdaStatus: 'Cosmetic/topical product; not an FDA-cleared medical device.',
            materials: 'Contains beeswax (not vegan) and botanical oils including tea tree and lavender. Patch-test first if you have plant or fragrance sensitivities.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher describes this as a "hormone-free moisturizer [that] is gynecologist-tested to hydrate, condition, and replenish the delicate vulvar skin," per the brand\'s own site.',
        communityReview: 'Repeat customers on Amazon describe quick relief from dryness-related burning and itching, and several called out a recent formula/packaging change (a smoother, less waxy texture and a metal rather than plastic cap) as an improvement.',
        effectiveness: 'Brand cites its own consumer trial in which 92% reported reduced dryness and 96% reported decreased burning or stinging within four weeks; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-neycher-goodbye-dryness-bundle',
        name: 'Neycher Goodbye, Dryness Bundle',
        brand: 'Neycher',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'organic', 'non-hormonal', 'cost'],
        price: '$49.97 (bundle; $61.97 separately)',
        whereToBuy: ['helloneycher.com'],
        url: 'https://www.helloneycher.com/product/goodbye-dryness-bundle',
        faqUrl: 'https://www.helloneycher.com/faq',
        // Neycher's own site is inconsistent about what's in this bundle: the product
        // page text names the Vaginal Moisturizer + HydroBloom Gel, while their official
        // bundle photo (used below, taken from their shop listing) shows the Vaginal
        // Moisturizer + Botanical Everyday Balm. Summary deliberately doesn't name the
        // contents so it can't contradict the image. Confirm with Neycher before
        // asserting either pairing.
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/68650ca0d383b3c169e56331_6.webp',
        summary: 'Neycher\'s dryness bundle. Two of their intimate-care products sold together at a discount versus buying them separately. Check the product page for the current pairing.',
        ingredients: 'See the individual Neycher product entries for full ingredient lists.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            materials: 'See product packaging for the full ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'Contains an internally used product. Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher positions this as an "inside-outside" pairing, per the brand\'s own site. See the individual products for their respective claims.',
        effectiveness: 'Bundle of two products; see the individual entries for the brand\'s cited results. No independent clinical study of the bundle was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        // Not yet an ayna brand partner — isEmergingBrand only adds the
        // "Brand" tag on Discovery. The "ayna Partner" badge is driven
        // entirely by src/utils/partnerBrands.js's PARTNER_BRAND_PATTERNS
        // allowlist, which gina isn't in, so it won't show here.
        // Brand name is styled lowercase ("gina"), matching its own
        // packaging/wordmark — same convention this app already uses for
        // "ayna" itself.
        id: 'p-gina-vaginal-moisturizing-glides',
        name: 'gina Vaginal Moisturizing Glides',
        brand: 'gina',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        // 'cruelty-free', 'non-toxic', 'ph-neutral', 'single-use', and
        // 'clinician-informed' are gina's own stated Key Benefits (per the
        // brand's site) — feeds both the Discovery "Preferences" filter
        // (matchesPreference in Discovery.jsx) and the ecosystem
        // preference matcher (preferenceLabelMatchesProduct in
        // products.js), both of which scan this tags array as text.
        tags: ['discomfort', 'comfort', 'organic', 'non-hormonal', 'cruelty-free', 'non-toxic', 'ph-neutral', 'single-use', 'clinician-informed'],
        price: '$101.00',
        whereToBuy: ['getgina.com'],
        url: 'https://getgina.com/products/vaginal-moisturizing-glides',
        image: '/products/gina/vaginal-moisturizing-glides.webp',
        summary: 'Vaginal dryness, irritation, or discomfort during intimacy can happen at any life stage — perimenopause, menopause, postpartum, or day to day. This single-ingredient suppository (12 per box, 1.72 g each) is 100% pure, extra virgin, unrefined, cold-pressed coconut oil, inserted directly or with gina\'s optional reusable applicator to hydrate and soothe.',
        safety: {
            // No FDA-registered-facility claim was found on gina's site
            // (unlike Neycher's), so fdaStatus is left off rather than
            // assumed.
            // Full packaging text — shown in full under "Materials" on
            // the Evidence view (see buildFactRows in ProductModal.jsx,
            // which doesn't truncate this field).
            materials: 'Box of 12 vaginal moisturizing glides. Ingredients (from the box): 100% pure, extra virgin, unrefined, cold-pressed coconut oil. Net weight per glide: 0.061 oz (1.72 g). Chill before use.',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation or an allergic reaction. Coconut oil is oil-based and can weaken latex condoms. Full warnings are listed below.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from gina\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'gina positions its coconut-oil glides as pure, simple, and effective — developed without hormones or harsh additives, non-irritating, non-toxic, pH-neutral, cruelty-free, pre-portioned for single use, and clinician-informed — per the brand\'s own site.\n\nThere\'s real clinical evidence behind coconut oil for this specific use: a 2023 pilot study followed 53 women using virgin coconut oil for vaginal dryness and painful sex over 6 months, and found most reported real improvement (83% improved dryness, 87% improved moisture duration) — though it wasn\'t placebo-controlled and didn\'t test this specific product.\n\nLab evidence is more mixed: one study found coconut oil, unlike several other commercial vaginal products, didn\'t inhibit the growth of E. coli in vitro. Coconut oil\'s natural pH (roughly 7 to 8) is also more alkaline than the vagina\'s normal acidic range (3.8 to 4.5), and a separate cohort study found intravaginal oil use was linked to a much higher rate of yeast colonization — a documented reason intravaginal oil use is linked to a higher risk of bacterial vaginosis or a yeast infection in some people.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'A 2023 pilot study found most of 53 women using coconut oil for vaginal dryness over 6 months reported real improvement, though it wasn\'t placebo-controlled. Coconut oil is also naturally alkaline (pH roughly 7 to 8) versus the vagina\'s normal acidic range, which can raise BV/yeast risk in some people. No independent clinical study of this specific product was found.',
        // Backs specific claims made in doctorOpinion with direct links,
        // same as Neycher's doctorOpinionCitations — kept out of
        // verificationLinks so it doesn't pool with the Scientific
        // literature tab's citation list (the first is also listed there,
        // in scientificCitations below, since it backs a general claim too).
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7203152/', label: 'NIH (PMC): Effect of Commercial Vaginal Products on the Growth of Uropathogenic and Commensal Vaginal Bacteria' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/23635677/', label: 'PubMed: Intravaginal Practices and Risk of Bacterial Vaginosis and Candidiasis Infection Among a Cohort of Women in the United States' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with vaginal dryness or irritation at any life stage — perimenopause, menopause, postpartum, or day to day',
            'Women who prefer a single-ingredient, hormone-free option over multi-ingredient formulas',
            'Women who want a precision applicator rather than applying oil by hand',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // getgina.com/pages/how-to-use-moisturizing-glides.
        howToUse: {
            intro: 'Per gina\'s own site: insert up to 3 times a week before bedtime or intercourse for ongoing hydration.',
            steps: [
                'Empty your bladder, clean the area, and wash your hands.',
                'Separate a single chilled glide, wait 1 to 3 minutes, then peel back the foil.',
                'Squeeze to pop the glide out onto a clean surface.',
                'Insert while lying on your back, with your knees raised.',
                'Wait 3 minutes, or until it\'s fully melted.',
            ],
            sourceUrl: 'https://getgina.com/pages/how-to-use-moisturizing-glides',
            sourceLabel: 'getgina.com: How to Use Moisturizing Glides',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Oil-based: can weaken latex condoms.',
            'Coconut oil\'s natural pH is more alkaline than the vagina\'s — introducing it can shift vaginal pH and, in some people, raise the risk of bacterial vaginosis or a yeast infection.',
            'Chill before use, per the box.',
            'Pregnant or breastfeeding: check with a doctor first.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'gina\'s own product page shows three customer testimonials: "The moisturizing glide melts instantly and feels so clean and natural," "I love that it\'s one ingredient and pre-measured. No more mess, just long lasting hydration and comfort," and "The glide melts instantly and gives a precise, soothing dose of hydration. The relief was immediate." No star rating or review count was shown alongside them, and no independent (non-brand) review data was found at time of writing — gina launched in April 2026.',
        // Kept short and product-focused — the pilot-study specifics (who,
        // how many, over how long) live on the Clinician opinion tab, which
        // has room for that detail; this field feeds the ayna-summary card
        // alongside `summary` above, so it stays to the point.
        effectiveness: 'Real clinical evidence supports coconut oil for vaginal dryness generally, though no independent study has tested this specific product.',
        // Plain-text ingredient summary — kept as a string since search
        // indexing, the interaction checker, DoctorPrep.jsx, and the Ask
        // Ayna context builder all read this field as a string.
        ingredients: 'Coconut oil (100% pure, extra virgin, unrefined, cold-pressed).',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed). Rendered on the Scientific
        // literature tab.
        ingredientScience: [
            {
                name: 'Coconut oil (100% pure, extra virgin, unrefined, cold-pressed)',
                text: 'A natural moisturizer rich in lauric acid. In a randomized, double-blind clinical trial, topical virgin coconut oil improved skin barrier function (lower transepidermal water loss, higher skin capacitance) more than mineral oil.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/24320105/', label: 'PubMed: Topical virgin coconut oil in pediatric atopic dermatitis — a randomized, double-blind clinical trial' },
                ],
            },
        ],
        // Category-level citation shown only on the Scientific literature
        // tab, kept out of verificationLinks so it doesn't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7203152/',
                text: 'Effect of Commercial Vaginal Products on the Growth of Uropathogenic and Commensal Vaginal Bacteria',
                summary: 'A lab study (Scientific Reports) compared five commercial vaginal products, including coconut oil, for effects on E. coli and Lactobacillus growth — coconut oil, unlike the others, didn\'t inhibit E. coli growth in vitro. This is ingredient-level lab evidence, not a clinical study of this specific product.',
            },
            {
                url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                text: 'ACOG: Vulvovaginal Health',
                summary: 'ACOG notes that over-the-counter vaginal moisturizers and lubricants can help relieve vaginal dryness and painful sex. This is clinical-guidance-level evidence, not product-specific validation.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/37594604/',
                text: 'Antimicrobial Potential of Cocos nucifera (Coconut) Oil on Bacterial Isolates',
                summary: 'An in vitro lab study testing coconut oil against clinical and reference bacterial isolates — Streptococcus species showed the highest susceptibility, E. coli the least, attributed to coconut oil\'s lauric acid content. This is ingredient-level lab evidence, not a clinical study of this specific product.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/28707186/',
                text: 'Natural Oils for Skin-Barrier Repair: Ancient Compounds Now Backed by Modern Science',
                summary: 'A 2018 review (Vaughn et al., American Journal of Clinical Dermatology) of natural plant oils — including coconut oil — for repairing skin-barrier function, covering antimicrobial, antioxidant, and anti-inflammatory properties. This is general dermatology evidence about the oil, not a clinical study of this specific product or vaginal use.',
            },
            {
                // Same paper as PubMed 37461787 (PMC is the full-text
                // mirror) — included once, under its PMC link, rather than
                // as two separate entries for the same study.
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10350307/',
                text: 'Virgin Coconut Oil in Paste Form as Treatment for Dyspareunia and Vaginal Dryness in Patients With and Without Rheumatic Autoimmune Diseases: An Efficacy and Safety Assessment Pilot Study',
                summary: 'A 2023 pilot study (Cureus) followed 53 women using virgin coconut oil for vaginal dryness and painful sex over 6 months — 83% reported improved dryness and 87% reported improved moisture duration. Real clinical outcomes, but not placebo-controlled and not a study of this specific product.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://getgina.com/products/vaginal-moisturizing-glides',
                        text: 'getgina.com: Customer testimonials',
                        summary: 'gina\'s own product page shows three customer testimonials (see the Community summary above). No star rating or review count is shown alongside them.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        // See the note on the Glides entry above re: partner status and
        // gina's lowercase brand styling.
        id: 'p-gina-insertion-applicator-refills',
        name: 'gina Insertion Applicator Refills',
        brand: 'gina',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['comfort', 'non-hormonal'],
        // Exact refill-pack count wasn't confirmed.
        price: '$10.00',
        whereToBuy: ['getgina.com'],
        url: 'https://getgina.com/products/insertion-applicator-refills',
        image: '/products/gina/insertion-applicator-refills.png',
        summary: 'A reusable, BPA-free applicator designed exclusively for gina\'s Vaginal Moisturizing Glides, for smooth, precise, and deeper placement. This refill replaces a worn or lost applicator — exact pack size wasn\'t confirmed at time of writing.',
        safety: {
            materials: 'BPA-free reusable applicator, designed exclusively for gina Vaginal Moisturizing Glides.',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation. Rinse well and air-dry before storing.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from gina\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'gina states this applicator allows for smooth, precise, and deeper placement of its Glide, per the brand\'s own site. It\'s a delivery accessory, not an active ingredient — see the Vaginal Moisturizing Glides entry for the product it\'s used with.',
        // Rendered as a bulleted list on the Evidence view.
        howToUse: {
            intro: 'Unwrap the applicator and moisten the tip with water or lubricant. Pull the plunger down to stop, then load a gina glide rounded side first.',
            steps: [
                'Lie back with your knees raised and insert to a comfortable depth, then press the plunger to release the glide and remove the applicator.',
                'Rinse the applicator well and air-dry it before storing — it\'s reusable.',
            ],
            sourceUrl: 'https://getgina.com/pages/how-to-use-moisturizing-glides',
            sourceLabel: 'getgina.com: How to Use Moisturizing Glides',
        },
        warnings: [
            'Designed exclusively for use with gina Vaginal Moisturizing Glides.',
            'Rinse well and air-dry between uses.',
            'Irritation or discomfort: stop using it and see a doctor.',
        ],
        communityReview: 'No independent customer review data was found for this product at time of writing — gina launched in April 2026.',
        effectiveness: 'A reusable delivery accessory rather than an active ingredient; effectiveness depends on the Vaginal Moisturizing Glide it\'s used with.',
        ingredients: 'BPA-free applicator (plastic components; no active ingredients).',
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: { links: [] },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-good-kitty-uti-biome-shield',
        name: 'Good Kitty UTI Biome Shield',
        brand: 'Good Kitty Co',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['uti-prevention'],
        tags: ['uti', 'safety-concern'],
        price: '$99 starter kit (or $84.15/mo subscription)',
        whereToBuy: [], // direct-to-consumer only; the url field above covers the official site link
        url: 'https://goodkittyco.com/',
        image: 'https://cdn.prod.website-files.com/66dc11fd6ea52df0b92e5e5c/670589c8dcbf01c1fa271073_Frame%201000001813%20(1).png',
        summary: 'A daily UTI-prevention capsule combining D-mannose, soluble cranberry PACs, vitamin D3, and zinc. Designed for people prone to recurrent UTIs who want a preventive daily routine rather than only reactive treatment.',
        safety: {
            fdaStatus: 'Dietary supplement; not FDA-evaluated for disease treatment (standard supplement disclaimer).',
            materials: '38mg soluble PACs (cranberry proanthocyanidins), 500mg D-mannose, vitamin D3, zinc, polyphenols. Per the brand\'s site.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; consult a clinician before starting any new supplement, especially if pregnant, breastfeeding, or on medication.',
            opinionAlerts: 'Brand states these claims have "not been evaluated by the FDA" and the product is "not intended to diagnose, treat, cure, or prevent any disease". Standard supplement disclaimer.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Good Kitty Co\'s own site; co-founded by a physician (Dr. Meghan Blake), with formulation input from urogynecologist Dr. Sharon Knight.',
        doctorOpinion: 'Good Kitty Co describes UTI Biome Shield as "doctor-formulated" with a "patent-pending," "clinically dosed" combination of D-mannose and soluble PACs, developed with urogynecologist Dr. Sharon Knight.',
        effectiveness: 'Uses UTI-prevention ingredients (D-mannose, cranberry PACs) at stated doses that are individually well-studied; no independent clinical trial of the finished product itself was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    {
        id: 'p-oboo-woosh-warming-wand',
        name: 'Oboo Woosh Warming Wand',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy'],
        price: '$119',
        whereToBuy: [], // direct-to-consumer only; the url field above covers the official site link
        url: 'https://oboo.love/',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/WooshOpt1.webp?v=1776054530',
        summary: 'A warming pleasure wand designed for perimenopausal and menopausal women navigating changes in arousal and vaginal dryness. Part of Oboo\'s "midlife-friendly, body-smart, shame-free" intimate wellness line, which also includes daily and arousal moisturizers.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe, phthalate-free silicone, per the brand\'s site.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site. Marketed on materials/design safety and menopause-specific positioning, not clinical evidence.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        communityReview: 'Named a 2026 Oprah Daily Menopause O-Ward Winner; featured in Wellness Magazine, Oprah Daily, The Pause Life, and Flow Space.',
        effectiveness: 'Positioned to address menopause-related changes in arousal and vaginal dryness; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    // The rest of Oboo's real, standalone (non-bundle) catalog — Ayna previously
    // only carried Woosh. Pulled from oboo.love's own Shopify products.json feed
    // (2026-08-24), same verification standard as Woosh: real price/image/URL,
    // no clinical or independent-review claims beyond what the brand itself says.
    {
        id: 'p-oboo-nook',
        name: 'Nook Clitoral Massager',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy', 'external-only'],
        price: '$99',
        whereToBuy: [],
        url: 'https://oboo.love/products/nook',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/nook-1.webp?v=1776109186',
        summary: 'A precision external massager with a curved hook tip, long ergonomic handle, and 10 vibration modes, designed to stay in play during intercourse for more mutual stimulation.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned for use during partnered intercourse; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-smooch',
        name: 'Smooch Sonic Stimulator',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy', 'gentle'],
        price: '$79',
        whereToBuy: [],
        url: 'https://oboo.love/products/smooch',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/smooch-1_c677b43e-a1a0-4e15-9b19-9c729e6eef5c.webp?v=1776111135',
        summary: 'Uses sonic stimulation rather than direct buzz for a gentler sensation, marketed for women whose bodies feel more sensitive or different than before — an easier, softer starting point.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as a gentler re-entry point to intimacy for sensitive or changing bodies; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-woo',
        name: 'Woo Bullet',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy', 'external-only', 'travel-friendly'],
        price: '$39',
        whereToBuy: [],
        url: 'https://oboo.love/products/woo',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/woo-1.webp?v=1776111204',
        summary: 'A small, clitoral-focused external bullet vibrator, marketed as an easy, discreet entry point for midlife women exploring pleasure without penetration.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as an entry-level external vibrator; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-shoop',
        name: 'Shoop Gentle Dual Massager',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy', 'dual-stimulation', 'beginner-friendly'],
        price: '$59',
        whereToBuy: [],
        url: 'https://oboo.love/products/shoop',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/shoop-1.webp?v=1776110893',
        summary: 'A slim, dual-stimulation massager with subtle, adjustable sensations, marketed for easing back into intimacy gradually — including for people new to toys.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as a gradual, low-intensity re-entry to intimacy; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-moon',
        name: 'Moon Anal Training Kit',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health'],
        tags: ['comfort', 'privacy', 'beginner-friendly', 'graduated-set'],
        price: '$119',
        whereToBuy: [],
        url: 'https://oboo.love/products/moon',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/moon-1.webp?v=1776110735',
        summary: 'A three-piece graduated-size training set with a smooth, body-safe finish, marketed for beginners; the largest plug includes an optional remote-controlled vibration mode.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as a beginner-paced training set; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-oooh',
        name: 'Oooh Palm Massager',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy', 'external-only', 'travel-friendly'],
        price: '$79',
        whereToBuy: [],
        url: 'https://oboo.love/products/oooh',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/oooh-1.webp?v=1776110805',
        summary: 'A compact, palm-sized clitoral stimulator shaped to follow the body\'s curves, marketed as a discreet external option at any stage of midlife.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as a compact, discreet external stimulator; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-groove',
        name: 'Groove Dual-Action Massager',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy', 'dual-stimulation'],
        price: '$119',
        whereToBuy: [],
        url: 'https://oboo.love/products/groove',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/groove-1.webp?v=1776110671',
        summary: 'A dual-stimulation massager with two independently controlled motors, marketed for midlife bodies exploring or returning to sensation at their own pace.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned for independently adjustable dual stimulation; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-boom',
        name: 'Boom Dual-End Wand',
        brand: 'Oboo',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'perimenopause'],
        tags: ['comfort', 'privacy', 'dual-stimulation', 'warming'],
        price: '$119',
        whereToBuy: [],
        url: 'https://oboo.love/products/boom',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/boom-1.webp?v=1776110193',
        summary: 'A dual-ended wand with two motors — one in the rounded external head, one in the curved internal tail — plus an optional warming feature for added comfort and blood flow.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe materials per the brand\'s site; exact composition not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned for combined internal/external stimulation with added warmth; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-smooth-daily',
        name: 'Smooth Daily Vulva Balm',
        brand: 'Oboo',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['organic', 'hormone-free', 'comfort'],
        price: '$36',
        whereToBuy: [],
        url: 'https://oboo.love/products/smooth-daily-vulva-balm',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/1_SmoothDOpt.webp?v=1777050035',
        summary: 'A daily vulva balm the brand describes as "100% clean, plant-based" and hormone-free, meant to hydrate, calm, and protect skin that often gets overlooked.',
        safety: {
            fdaStatus: 'Cosmetic/personal-care product; not FDA-cleared as a drug.',
            materials: 'Brand states "100% clean, plant-based" ingredients; full ingredient list not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'Patch test recommended; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No clinical-study claims found on the brand site beyond ingredient sourcing.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as a daily hydrating balm for vulvar skin; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-smooth-arousal',
        name: 'Smooth Arousal Vulva Balm',
        brand: 'Oboo',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'sexual-health'],
        tags: ['organic', 'hormone-free', 'comfort'],
        price: '$36',
        whereToBuy: [],
        url: 'https://oboo.love/products/smooth-arousal-vulva-balm',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/Smooth_Arousal_2048_Opt.webp?v=1777049060',
        summary: 'A vulva balm the brand describes as "100% natural, organic" and hormone-free, with a mild cooling tingle intended to hydrate, soothe, and gently stimulate.',
        safety: {
            fdaStatus: 'Cosmetic/personal-care product; not FDA-cleared as a drug.',
            materials: 'Brand states "100% natural, organic" ingredients; full ingredient list not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'Cooling/tingling sensation reported by design; patch test recommended, discontinue use if irritation occurs.',
            opinionAlerts: 'No clinical-study claims found on the brand site beyond ingredient sourcing.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as a hydrating balm with a mild arousal-supporting sensation; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-loob-daily',
        name: 'Loob Daily Moisturizer',
        brand: 'Oboo',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'perimenopause'],
        tags: ['organic', 'hormone-free', 'comfort'],
        price: '$28',
        whereToBuy: [],
        url: 'https://oboo.love/products/loob-daily',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/LoobDaily1_1_1.webp?v=1776815937',
        summary: 'A water-based daily vaginal moisturizer formulated for dryness during perimenopause and menopause; the brand states it contains no harsh chemicals or parabens.',
        safety: {
            fdaStatus: 'Cosmetic/personal-care product; not FDA-cleared as a drug.',
            materials: 'Brand states water-based formula, no parabens or harsh chemicals; full ingredient list not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'Patch test recommended; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No clinical-study claims found on the brand site beyond ingredient sourcing.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned for daily vaginal dryness relief during perimenopause/menopause; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-loob-arousal',
        name: 'Loob Arousal Moisturizer',
        brand: 'Oboo',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'sexual-health'],
        tags: ['organic', 'hormone-free', 'comfort'],
        price: '$28',
        whereToBuy: [],
        url: 'https://oboo.love/products/loob-arousal',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/1_LoobAOpt.webp?v=1777048741',
        summary: 'A water-based intimate lubricant/moisturizer with a mint-cool tingle, marketed for perimenopausal and menopausal women wanting clean-ingredient daily comfort during play.',
        safety: {
            fdaStatus: 'Cosmetic/personal-care product; not FDA-cleared as a drug.',
            materials: 'Brand states "100% organic" ingredients; full ingredient list not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'Cooling/tingling sensation reported by design; patch test recommended, discontinue use if irritation occurs.',
            opinionAlerts: 'No clinical-study claims found on the brand site beyond ingredient sourcing.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as an arousal-supporting intimate moisturizer; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-mood-drops',
        name: 'In the Mood Drops',
        brand: 'Oboo',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health'],
        tags: ['herbal', 'hormone-free'],
        price: '$28',
        whereToBuy: [],
        url: 'https://oboo.love/products/in-the-mood-libido-drops',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/1_MoodOpt_1.webp?v=1777323933',
        summary: 'A daily herbal tincture the brand describes as formulated to gently support libido, ease stress, and help you feel more present in your body, without synthetic stimulants.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA.',
            materials: 'Herbal tincture; full ingredient list not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications that may interact with herbal supplements.',
            opinionAlerts: 'No clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as a daily libido and stress-support tincture; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-oboo-cool-spray',
        name: 'Cool Spray for Hot Flashes',
        brand: 'Oboo',
        category: 'menopause',
        type: 'physical',
        internal: false,
        healthFunctions: ['perimenopause'],
        tags: ['organic', 'hormone-free'],
        price: '$20',
        whereToBuy: [],
        url: 'https://oboo.love/products/cool-spray-for-hot-flashes',
        image: 'https://cdn.shopify.com/s/files/1/0620/2726/8149/files/Cool_Spray_2048_Opt.webp?v=1777066860',
        summary: 'A mist the brand describes as made with organic herbs and essential oils, marketed for quick cooling relief and mood support during a hot flash — shake, spray, and go.',
        safety: {
            fdaStatus: 'Cosmetic/personal-care product; not FDA-cleared as a drug.',
            materials: 'Brand states "100% organic herbs and essential oils"; full ingredient list not independently verified.',
            recalls: 'No recalls found.',
            sideEffects: 'Essential oils may irritate sensitive skin; patch test recommended.',
            opinionAlerts: 'No clinical-study claims found on the brand site.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        effectiveness: 'Positioned as an on-the-spot cooling mist for hot flashes; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'd-connect-pelvic-floor-fitness',
        name: 'Connect Pelvic Floor Fitness',
        brand: 'Connect Pelvic Floor Fitness',
        category: 'pelvic-floor',
        type: 'digital',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['pelvic-floor', 'leaks', 'discomfort', 'fitness'],
        price: 'Subscription',
        whereToBuy: ['Connect Pelvic Floor Fitness'],
        platform: 'Web, app',
        url: 'https://www.connectpelvicfloorfitness.com/',
        affiliateUrl: 'https://goto.connectpelvicfloorfitness.com/YVk7WO',
        image: '',
        summary: 'A DPT-led pelvic floor fitness program with 500+ guided workouts for women, designed to build pelvic floor and whole-body strength and help reduce common pelvic floor symptoms.',
        safety: {
            fdaStatus: 'Fitness and education service; not a medical device.',
            materials: 'N/A',
            recalls: 'N/A',
            sideEffects: 'Exercise programs may not be appropriate for every pelvic floor condition. Stop if exercises cause pain or worsen symptoms and consult a pelvic floor physical therapist or clinician when needed.',
            opinionAlerts: 'Program information is based on the brand\'s own description.'
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Program is led by a Doctor of Physical Therapy. Description sourced from Connect Pelvic Floor Fitness.',
        effectiveness: 'Provides guided pelvic floor and whole-body exercise programming. Individual results vary by condition and adherence.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-vio2-mouth-tape',
        name: 'VIO2 Partial-Coverage Mouth Tape',
        brand: 'VIO2',
        category: 'sleep',
        type: 'physical',
        internal: false,
        healthFunctions: ['sleep-energy'],
        tags: ['sleep', 'comfort'],
        price: '$29.95 (48 strips)',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://www.vio2tape.com/',
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://go.shopmy.us/p-83948920',
        image: 'https://www.vio2tape.com/cdn/shop/files/vio2tape-health-beauty-1-pack-try-it-vio2-unscented-mouth-tape-33555330531505_1024x874.png?v=1781819129',
        summary: 'A patented partial-coverage mouth tape, designed by a dentist, meant to encourage a gentle lip seal during sleep while still allowing natural airflow — intended to support nasal breathing, reduce snoring, and cut down on dry mouth.',
        safety: {
            fdaStatus: 'Personal-care product; not an FDA-cleared medical device.',
            materials: 'Breathable cotton fabric with hypoallergenic medical-grade adhesive. Free from latex, PFAS, and gluten. Unscented. Made in USA.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states this is not intended for children under 6, or for anyone with a breathing disorder, heart condition, nasal congestion, risk of vomiting, who has used alcohol or sedatives, or who is unable to remove the tape themselves. Single-use; discard after each application.',
            opinionAlerts: 'Brand markets this as "the only mouth tape on the market designed, created & approved by a doctor" — a brand claim, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from VIO2\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'VIO2 states the tape was created by a dentist and designed to promote nasal breathing over mouth breathing during sleep, which the brand links to better sleep quality, oral/jaw muscle tone, and recovery.',
        effectiveness: 'Positioned as a gentler, partial-coverage alternative to full-seal mouth tape; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    // Proov brand partnership (2026-09-07) — 5 real, priced catalog entries
    // pulled from proovtest.com's own product pages, each with its own Ayna
    // affiliate link (proov.pxf.io). This replaces the old single generic
    // "Proov" entry that lived in startups.js with an outdated affiliate URL
    // and a single stock photo — see startups.js for the removal note.
    {
        id: 'p-proov-complete',
        name: 'Proov Complete Fertility Testing System',
        brand: 'Proov',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['fertility'],
        tags: ['fertility', 'irregular', 'pcos'],
        price: '$99.99',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://proovtest.com/products/complete-testing-system',
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://proov.pxf.io/9VjJQj',
        image: 'https://proovtest.com/cdn/shop/files/Complete-PDP-HSA_FSA_3.png?v=1767377529&width=1920',
        summary: 'An at-home fertility testing system that tracks FSH, E1G, LH, and PdG across a full cycle to identify up to a 6-day fertile window and confirm ovulation, rather than only predicting it.',
        safety: {
            fdaStatus: 'Physician-grade at-home urine test; verify current FDA clearance status directly on proovtest.com.',
            materials: '20 test strips (3 FSH + 17 multi-hormone) plus the Proov Insight app for automatic reading. See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself.',
            opinionAlerts: 'Brand states "women who track their whole cycle get pregnant 3x faster" than those tracking ovulation timing alone — a brand claim, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Proov positions Complete as covering a full-cycle hormone picture (ovarian reserve, fertile window, ovulation confirmation) in one kit, with a Progesterone Score and access to fertility coaching for follow-up.',
        effectiveness: 'Tracks four hormones across a full cycle rather than a single ovulation-prediction hormone; no independent clinical study of the finished product itself was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-proov-his-hers',
        name: 'Proov His & Hers Fertility Kit',
        brand: 'Proov',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['fertility'],
        tags: ['fertility', 'irregular'],
        price: '$179.99 (2 cycles)',
        whereToBuy: [],
        url: 'https://proovtest.com/products/his-and-hers-fertility-starter-kit',
        affiliateUrl: 'https://proov.pxf.io/NGv6mb',
        image: 'https://proovtest.com/cdn/shop/files/His_Hers-PDP-HSA_FSA_1.png?v=1771351002&width=1920',
        summary: 'A couples\' fertility kit pairing Proov\'s Complete testing (ovarian reserve, fertile window, ovulation confirmation) for her with an at-home motile sperm concentration test for him, plus early pregnancy tests — covering both sides of a fertility picture at once.',
        safety: {
            fdaStatus: 'Physician-grade at-home urine and semen tests; verify current FDA clearance status directly on proovtest.com.',
            materials: 'Includes Complete for Her, an at-home sperm test for Him, and Check for Her (early pregnancy tests). See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the tests themselves.',
            opinionAlerts: 'Brand states results are "99% accurate" and that "up to 60% of fertility challenges" involve a male factor — brand claims, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Proov positions this as a lower-cost, at-home alternative to a first fertility clinic visit by screening both partners for common fertility factors together, with an optional expedited telehealth consult for male-factor results.',
        effectiveness: 'Combines female hormone testing with a male sperm test across two cycles; no independent clinical study of the finished kit itself was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-proov-empower',
        name: 'Proov Empower Hormone Tracker',
        brand: 'Proov',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['perimenopause'],
        tags: ['perimenopause', 'irregular'],
        price: '$59.99',
        whereToBuy: [],
        url: 'https://proovtest.com/products/empower-perimenopause-test-kit',
        affiliateUrl: 'https://proov.pxf.io/9VjJrj',
        image: 'https://proovtest.com/cdn/shop/files/Empower-PDP-HSA_FSA.png?v=1759414142&width=1920',
        summary: 'An at-home hormone testing system for women 35+ that measures FSH, LH, E1G, and PdG at four points in the cycle, aimed at explaining perimenopause-linked symptoms like brain fog, anxiety, and sleep disturbance and offering personalized next steps.',
        safety: {
            fdaStatus: 'At-home urine hormone test; verify current FDA clearance status directly on proovtest.com.',
            materials: 'Non-invasive urine test strips read via the Proov Insights app. See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself.',
            opinionAlerts: 'Brand states "85% of women have hormone imbalances that cause symptoms like anxiety, weight gain, brain fog" — a brand claim, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Proov positions Empower as a way to see which hormones are actually shifting during perimenopause, then connect to medical professionals for prescriptions or the brand\'s own Cycle Wisely supplement recommendations.',
        effectiveness: 'Tracks four hormones across multiple cycle timepoints rather than a single snapshot; no independent clinical study of the finished product itself was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-proov-balance-bundle',
        name: 'Proov Balance Bundle',
        brand: 'Proov',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['fertility'],
        tags: ['fertility', 'hormone-support'],
        price: '$49.99 (2-month supply)',
        whereToBuy: [],
        url: 'https://proovtest.com/products/balance-bundle',
        affiliateUrl: 'https://proov.pxf.io/1GMWVx',
        image: 'https://proovtest.com/cdn/shop/files/BalanceSupplementBundle_2.png?v=1781538761&width=1920',
        summary: 'A two-month supplement bundle pairing a bioidentical-progesterone topical oil with a luteal-phase support capsule (chasteberry, ashwagandha, maca), aimed at overall hormonal balance for people trying to conceive or supporting implantation.',
        ingredients: 'Balancing Oil: bioidentical progesterone (3,000mg), vitamin E, MCT oil, lemon essence. Pro capsules: chasteberry (vitex), ashwagandha, maca.',
        safety: {
            fdaStatus: 'Dietary supplement / topical cosmetic; not evaluated by the FDA.',
            materials: 'See ingredients above; full formulation on product packaging.',
            recalls: 'No recalls found.',
            sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications, especially given the bioidentical progesterone content.',
            opinionAlerts: 'No clinical-study claims found on the brand site for this specific bundle.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Proov markets the Balancing Oil\'s progesterone as absorbed via nanoemulsion technology for topical delivery, paired with herbal luteal-phase support in the Pro capsules.',
        effectiveness: 'Combines a topical progesterone product with an herbal supplement; no independent clinical study of the bundle itself was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-proov-path-to-pregnancy',
        name: 'Proov Clinical: F.A.S.T. Method — Path to Pregnancy',
        brand: 'Proov',
        category: 'telehealth',
        type: 'physical',
        internal: false,
        healthFunctions: ['fertility', 'telehealth'],
        tags: ['fertility', 'irregular'],
        price: '$399 (3-month program)',
        whereToBuy: [],
        url: 'https://proovtest.com/products/path-to-pregnancy',
        affiliateUrl: 'https://proov.pxf.io/zz52BW',
        image: 'https://proovtest.com/cdn/shop/files/PPP-PDP-HSA_FSA_1.png',
        summary: 'A 3-month at-home fertility optimization program combining monthly Proov Complete and Check kits with review by a reproductive endocrinologist (Dr. Aimee\'s F.A.S.T. Method), including prescription support (capped cost) if a user qualifies.',
        safety: {
            fdaStatus: 'Combines at-home test kits with prescription medication support issued by a licensed provider, not the kits themselves.',
            materials: '3 Proov Complete kits (hormone tests) + 3 Proov Check kits (early pregnancy tests) + clinician-reviewed protocol.',
            recalls: 'No recalls found.',
            sideEffects: 'Any medication side effects depend on what a provider prescribes (letrozole, progesterone, or metformin per the brand).',
            opinionAlerts: 'Brand states eligibility excludes anyone with a history of cancer, unexplained vaginal bleeding, liver disease, BMI over 49.9, or who is more than 10 weeks pregnant. Verify current eligibility criteria on proovtest.com.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Reviewed per the brand by a reproductive endocrinologist as part of Dr. Aimee\'s F.A.S.T. Method; not independently verified here.',
        doctorOpinion: 'Proov positions this as a lower-cost, at-home alternative to a fertility clinic, combining hormone monitoring with clinician-reviewed, capped-cost prescription support over three cycles.',
        effectiveness: 'Bundles three months of hormone/pregnancy testing with clinician review and possible prescription support; no independent clinical study of program-level outcomes was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // Elitone brand partnership (2026-09-07) — one general affiliate link
    // (elitone.com/?af=aynahealth) covers both devices; there's no
    // per-product affiliate link, so affiliateUrl is the same on each entry.
    {
        id: 'p-elitone',
        name: 'Elitone (Stress + Mixed Incontinence)',
        brand: 'Elitone',
        category: 'incontinence',
        type: 'physical',
        internal: false,
        healthFunctions: ['bladder-leak-protection'],
        tags: ['bladder-leaks', 'incontinence', 'urinary', 'menopause', 'postpartum'],
        price: 'From $359',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://elitone.com/product/elitone/',
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://elitone.com/?af=aynahealth',
        image: 'https://elitone.com/wp-content/uploads/2021/05/SUI-Hero-2-1200x1000-AVIF.avif',
        summary: 'An external, at-home pelvic floor stimulation device for stress and mixed urinary incontinence. A gel pad worn near the pubic bone delivers gentle electrical stimulation to contract and relax pelvic floor muscles for you during 20-minute sessions — the brand describes it as "doing Kegels for you."',
        safety: {
            fdaStatus: 'FDA-cleared (over-the-counter) for the treatment of stress and mixed urinary incontinence, per the brand.',
            materials: 'Reusable GelPads (rated for 3+ uses), controller with belt clip, charging cable.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states contraindications are available on request; consult a clinician before use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, or recent pelvic surgery.',
            opinionAlerts: 'Brand cites a 3.7% return rate for non-improvement and offers a 60-day money-back guarantee — brand claims, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Elitone\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Elitone uses a proprietary high-frequency PMW waveform delivered through an external adhesive pad, positioned as a no-prescription-needed alternative to doing pelvic floor exercises manually — the brand states it performs roughly 100 contractions per 20-minute session.',
        effectiveness: 'FDA-cleared, claim-specific device for stress/mixed incontinence per the brand; no independently conducted clinical study of the device was found here.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-elitone-urge',
        name: 'Elitone URGE (Overactive Bladder)',
        brand: 'Elitone',
        category: 'incontinence',
        type: 'physical',
        internal: false,
        healthFunctions: ['bladder-leak-protection'],
        tags: ['bladder-leaks', 'incontinence', 'urinary', 'menopause', 'postpartum'],
        price: 'From $359',
        whereToBuy: [],
        url: 'https://elitone.com/product/elitone-urge/',
        affiliateUrl: 'https://elitone.com/?af=aynahealth',
        image: 'https://elitone.com/wp-content/uploads/2023/02/UUI-Hero-071426.avif',
        summary: 'An external, at-home device for overactive bladder (OAB) and urge incontinence. The same GelPad-and-controller system as Elitone, but tuned to send calming signals that aim to reduce sudden urges, frequent bathroom trips, and urge-related leaks, without medication or a procedure.',
        safety: {
            fdaStatus: 'FDA-cleared (over-the-counter) medical device for overactive bladder / urge incontinence, per the brand.',
            materials: 'Reusable GelPads (rated for 3+ uses), controller with belt clip, charging cable, storage case.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states do not use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, recent pelvic surgery, or urinary retention issues.',
            opinionAlerts: 'Brand cites "95% of users reported reduced leaks," a 70% average leak reduction, and 85% reduction in pad use — brand-reported figures, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Elitone\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Elitone URGE uses the same proprietary PMW waveform technology as the original Elitone, tuned to calm unwanted bladder-muscle contractions from misfiring nerve signals rather than to strengthen pelvic floor muscles directly.',
        effectiveness: 'FDA-cleared device for OAB/urge incontinence per the brand; no independently conducted clinical study of the device was found here.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // My Pelvic Bra brand partnership (2026-09-07) — affiliate links redirect
    // through pelvic-bra.myshopify.com to the brand's real storefront at
    // mypelvicbra.shop.
    {
        id: 'p-mypelvicbra-classic',
        name: 'Classic Pelvic Bra',
        brand: 'My Pelvic Bra',
        category: 'pelvic-floor',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['pelvic-floor', 'postpartum', 'comfort', 'bladder-leaks'],
        price: '€69.95',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE',
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://pelvic-bra.myshopify.com/nlbs3u',
        image: 'https://www.mypelvicbra.shop/cdn/shop/files/ClassicPelvicBra.jpg',
        summary: 'A 4-way adjustable, everyday pelvic support garment with a compressive bikini-style fit, designed to ease sensations of heaviness, pressure, and bulging by giving gentle compressive lift to the pelvic floor and perineal tissue.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device. Brand states it is not designed to correct prolapse.',
            materials: 'Breathable, skin-friendly, high-stretch compression fabric with a creaseless gusset and sweat-wicking liner, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand recommends removing before sleep and using the minimum compression needed for symptom relief; suggests working with a pelvic floor physical therapist for personalized guidance.',
            opinionAlerts: 'Store pricing defaults to EUR; a US/USD option is available via the site\'s own country selector. Verify current pricing directly at mypelvicbra.shop.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from My Pelvic Bra\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'My Pelvic Bra positions this as a discreet, wearable support option for pelvic heaviness, pressure, bulging, and leakage symptoms — worn during activities that stress the pelvic floor (walking, lifting, running), not as a substitute for pelvic floor therapy or a prolapse treatment.',
        effectiveness: 'Positioned as symptom-management support wear, not a corrective device; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // BUNI Body — verified against bunibody.com and the supplied Amazon
    // Associates links (2026-09-11). BUNI is NOT an ayna brand partner;
    // affiliateUrl is used only as the exact Amazon purchase destination.
    {
        id: 'p-buni-rejuvenate-vulva-balm',
        name: 'REJUVENATE: Vulva Balm',
        brand: 'BUNI',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'menopause', 'postpartum', 'hormone-free', 'organic', 'cruelty-free', 'vegan'],
        price: '$42',
        whereToBuy: ['Amazon', 'BUNI Body'],
        url: 'https://www.bunibody.com/products/buni-vulva-balm',
        affiliateUrl: 'https://amzn.to/4yE7pZH',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/4yE7pZH',
            'BUNI Body': 'https://www.bunibody.com/products/buni-vulva-balm',
        },
        image: 'https://cdn.shopify.com/s/files/1/0661/0432/8271/files/buni-vulva-balm-product-page-main.webp?v=1776773714',
        summary: 'A hormone-free external vulva moisturizer in an airless pump, formulated for dryness, friction, itching, and everyday vulvar skin comfort. BUNI positions it for menopause and perimenopause, pregnancy and postpartum, grooming, exercise, and intimate activity.',
        ingredients: 'Key ingredients listed by BUNI include organic avocado oil, honey and propolis, chamomile, lavender, shea butter, cacao butter, hyaluronic acid, and sea buckthorn oil.',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the balm itself is a cosmetic / external personal-care product, not an FDA-cleared drug or medical device.',
            // Full packaging/formula description — shown in full under
            // "Materials" on the Evidence view (see buildFactRows in
            // ProductModal.jsx, which doesn't truncate this field).
            materials: 'Airless pump dispenser. Formula is hormone-free, paraben-free, phthalate-free, dye-free, and made with 99.5–100% natural ingredients, per BUNI. Key ingredients: organic avocado oil, honey and propolis, organic chamomile, organic lavender, shea butter, cacao butter, hyaluronic acid, and sea buckthorn oil.',
            recalls: 'No recalls found.',
            sideEffects: 'For external vulvar use only — not intended for internal vaginal use, per the brand. Discontinue and see a doctor if you notice irritation or an allergic reaction. Full warnings are listed below.',
            opinionAlerts: 'Benefit and ingredient claims are from BUNI; no independent clinical trial of the finished product was identified.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'BUNI states the product was developed by board-certified OB/GYNs and dermatologists; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions REJUVENATE as a gynecologist- and dermatologist-developed, hormone-free external moisturizer for vulvar dryness, friction, and irritation — pure, simple, and effective, per the brand\'s own site.\n\nSeveral of its named ingredients have real supporting research, though none of it tested this finished product. Honey and propolis have documented antibacterial, antifungal, and wound-healing properties in general skin studies, and propolis specifically has shown antifungal activity against vaginal Candida albicans in lab research. Hyaluronic acid is a well-studied humectant that draws and holds moisture in tissue. Avocado oil has shown skin-barrier-repair and wound-healing effects in review literature covering several plant oils.\n\nSea buckthorn oil has real clinical evidence for vaginal dryness specifically — a randomized, placebo-controlled trial found daily oral sea buckthorn oil improved vaginal epithelium integrity in postmenopausal women over 3 months. That trial tested oral intake, though, not a topical balm like this one, so it doesn\'t directly validate this product\'s use.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'Several named ingredients (honey, propolis, hyaluronic acid, avocado oil, sea buckthorn oil) have real supporting research individually, including one placebo-controlled trial on oral sea buckthorn oil for vaginal dryness — though that tested oral intake, not a topical balm. No independent clinical study of this specific product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4359870/', label: 'NIH (PMC): Propolis Is an Efficient Fungicide and Inhibitor of Biofilm Production by Vaginal Candida albicans' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with vulvar dryness, friction, or itching from menopause or perimenopause',
            'Postpartum women, once cleared by their doctor',
            'Women dealing with irritation from shaving, waxing, tight clothing, or exercise',
            'Women who want a hormone-free, external-only option',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // bunibody.com/products/buni-vulva-balm.
        howToUse: {
            intro: 'Per BUNI\'s own site: apply daily for lasting hydration and comfort — morning or night, wherever it fits.',
            steps: [
                'Dispensed through an airless pump, so the product is never exposed to air or direct hand contact between uses.',
                'For external vulvar use only.',
            ],
            sourceUrl: 'https://www.bunibody.com/products/buni-vulva-balm',
            sourceLabel: 'bunibody.com: REJUVENATE Vulva Balm',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'External vulvar use only — not intended for internal vaginal use, per the brand.',
            'Pregnant or breastfeeding: check with a doctor first.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'One customer review on BUNI\'s site: "I use Rejuvenate after every spin class. No more irritation from the seat, no more dryness from tight leggings." No star rating or review count was shown alongside it, and no independent (non-brand) review data was found at time of writing.',
        effectiveness: 'Formulated by board-certified OB/GYNs and dermatologists to moisturize and reduce friction on external vulvar skin; no independent clinical study of the finished product was found.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed). Rendered on the Scientific
        // literature tab.
        ingredientScience: [
            {
                name: 'Honey and propolis',
                text: 'Honey has documented antibacterial, immune-modulating properties useful in wound care; propolis (a resin bees make from plant compounds) adds antibacterial, antifungal, and anti-inflammatory activity.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7700082/', label: 'NIH (PMC): Honey Combination Therapies for Skin and Wound Infections — a systematic review' },
                ],
            },
            {
                name: 'Hyaluronic acid',
                text: 'Binds large amounts of water. It draws moisture into tissue and holds it there.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13160248/', label: 'NIH (PMC): Real-world effectiveness of a hyaluronic acid-based vaginal moisturizer' },
                ],
            },
            {
                name: 'Avocado oil',
                text: 'A plant oil shown to support skin-barrier repair and reduce inflammation in topical-oil review literature.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils' },
                ],
            },
            {
                name: 'Sea buckthorn oil',
                text: 'In a placebo-controlled trial, daily oral sea buckthorn oil improved vaginal epithelium integrity in postmenopausal women over 3 months. That trial tested oral intake, not a topical balm.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/25104582/', label: 'PubMed: Effects of sea buckthorn oil intake on vaginal atrophy in postmenopausal women — a randomized, double-blind, placebo-controlled study' },
                ],
            },
        ],
        // Category-level citation shown only on the Scientific literature
        // tab, kept out of verificationLinks so it doesn't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                text: 'ACOG: Vulvovaginal Health',
                summary: 'ACOG on vulvovaginal dryness, irritation, and general management guidance. This is clinical-guidance-level evidence, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.bunibody.com/products/buni-vulva-balm',
                        text: 'bunibody.com: Customer reviews',
                        summary: 'BUNI\'s own product page shows a customer testimonial about post-workout relief (see the Community summary above). No star rating or review count is shown alongside it.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-buni-soothe-nipple-lip-balm',
        name: 'SOOTHE: Nipple and Lip Balm',
        brand: 'BUNI',
        category: 'postpartum',
        type: 'physical',
        internal: false,
        healthFunctions: ['comfort'],
        tags: ['postpartum', 'pregnancy', 'comfort', 'cruelty-free', 'vegan'],
        price: '$25',
        whereToBuy: ['Amazon', 'BUNI Body'],
        url: 'https://www.bunibody.com/products/buni-nipple-balm',
        affiliateUrl: 'https://amzn.to/4xnutuF',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/4xnutuF',
            'BUNI Body': 'https://www.bunibody.com/products/buni-nipple-balm',
        },
        image: 'https://cdn.shopify.com/s/files/1/0661/0432/8271/files/buni-nipple-lip-balm-product-page-main_1.webp?v=1776774214',
        summary: 'A lanolin-free balm for nipples, lips, cuticles, and other dry skin, positioned for nursing and pumping comfort as well as pregnancy and postpartum care.',
        ingredients: 'BUNI lists organic olive oil, kokum butter, beeswax, shea butter, cacao seed butter, calendula, avocado oil, and other botanical oils and butters.',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the balm itself is a cosmetic / personal-care product, not an FDA-cleared drug or medical device.',
            materials: 'Lanolin-free balm, made with no animal-derived ingredients (safe for wool/lanolin sensitivities). Ingredients per BUNI: organic olive fruit oil, organic beeswax, organic shea butter, organic cocoa seed butter, organic avocado oil, organic kokum seed butter, organic tocopherol (vitamin E), and organic calendula flower extract.',
            recalls: 'No recalls found.',
            sideEffects: 'People with sensitivities or allergies to botanical ingredients or beeswax should review the ingredient list before use and stop if irritation develops. Full warnings are listed below.',
            opinionAlerts: 'BUNI markets the balm as suitable around nursing and states no wipe-off is needed; users should follow current label directions and their clinician or lactation professional’s guidance.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product positioning and safety statements are sourced from BUNI; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions SOOTHE as a lanolin-free option for reducing friction and moisturizing sore or dry nipple skin during nursing and pumping, formulated by board-certified OB/GYNs and dermatologists, per the brand\'s own site.\n\nCalendula, one of its named ingredients, has real supporting research: a systematic review of animal and clinical studies found evidence for calendula extract improving acute wound healing and reducing venous ulcer size, though the review also called for larger, better-designed trials. Shea butter and beeswax are traditional occlusive moisturizers with a long history of topical use, though less formal clinical-trial evidence exists for either specifically.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'Calendula, one of its named ingredients, has supporting evidence from a systematic review of wound-healing studies, though that review also called for larger trials. No independent clinical study of this specific product was found.',
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Nursing and pumping mothers with sore, dry, or cracked nipples',
            'Women with wool/lanolin sensitivities who want a lanolin-free option',
            'Anyone wanting a multi-use balm for lips, cuticles, elbows, or other dry skin',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // bunibody.com/products/buni-nipple-balm.
        howToUse: {
            intro: 'Per BUNI\'s own site: dab onto nipples for nursing relief, or use as a daily lip balm.',
            steps: [
                'Safe to nurse right after applying — no wipe-off needed.',
                'A small amount before pumping can reduce friction between skin and the pump flange.',
                'Also works on lips, cuticles, elbows, or anywhere dry skin needs relief.',
            ],
            sourceUrl: 'https://www.bunibody.com/products/buni-nipple-balm',
            sourceLabel: 'bunibody.com: SOOTHE Nipple and Lip Balm',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Allergy or sensitivity to a botanical ingredient or beeswax: review the ingredient list before use.',
            'Irritation or an allergic reaction: stop using it and see a doctor or lactation professional.',
        ],
        communityReview: 'Customer reviews on BUNI\'s site describe fast relief for cracked, sore nipples during breastfeeding — for example: "Wouldn\'t have reached my breastfeeding goal without this. Healed every crack." and "Apply after last feed. Wake up with softer healed skin. The overnight healing is incredible." No star rating or review count was shown alongside them, and no independent (non-brand) review data was found at time of writing.',
        effectiveness: 'Provides an occlusive moisturizing layer for dry or irritated skin; no independent clinical study of the finished product was found.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed). Rendered on the Scientific
        // literature tab.
        ingredientScience: [
            {
                name: 'Calendula',
                text: 'A traditional wound-care botanical. A systematic review of animal and clinical studies found evidence for calendula extract speeding acute wound healing and reducing venous ulcer surface area, though it also called for larger, better-designed trials.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31145533/', label: 'PubMed: A systematic review of Calendula officinalis extract for wound healing' },
                ],
            },
            {
                name: 'Avocado oil',
                text: 'A plant oil shown to support skin-barrier repair and reduce inflammation in topical-oil review literature.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/BUNI-Balance-Your-Beautiful-Soothe/dp/B0G45C6G8S',
                        text: 'Amazon: BUNI SOOTHE Nipple and Lip Balm reviews',
                        // Amazon blocks automated access, so this isn't a
                        // summary of actual review text — just confirms this
                        // is the real, current product listing. Read the
                        // reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.bunibody.com/products/buni-nipple-balm',
                        text: 'BUNI: SOOTHE Nipple and Lip Balm customer reviews',
                        summary: 'BUNI\'s own product page displays customer testimonials, including the two quoted above. No star rating or aggregate review count was shown at time of writing.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-buni-transform-scar-body-oil',
        name: 'TRANSFORM: Scar+Body Treatment Oil',
        brand: 'BUNI',
        category: 'postpartum',
        type: 'physical',
        internal: false,
        healthFunctions: ['comfort'],
        tags: ['postpartum', 'comfort', 'cruelty-free', 'vegan'],
        price: '$35',
        whereToBuy: ['Amazon', 'BUNI Body'],
        url: 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil',
        affiliateUrl: 'https://amzn.to/3UOVTfk',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/3UOVTfk',
            'BUNI Body': 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil',
        },
        image: 'https://cdn.shopify.com/s/files/1/0661/0432/8271/files/buni-transform-oil-product-page-main_6-2.webp?v=1776774797',
        summary: 'A 1.7 oz scar and body treatment oil with a rollerball applicator and included onyx gua sha tool, marketed for the appearance of scars, stretch marks, and postpartum body care.',
        ingredients: 'Per BUNI\'s own "What\'s Inside" list: snail secretion filtrate (scar healing + regeneration, stimulates collagen), retinyl palmitate (cell turnover + renewal), organic avocado oil (deep moisture + elasticity), apricot oil (lightweight hydration), chamomile & lavender (calming + soothing, reduces inflammation and redness), and vitamin E & sunflower oil (antioxidant protection, shields healing skin from environmental damage).',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the oil itself is a cosmetic / personal-care product, not an FDA-cleared scar treatment.',
            materials: 'Topical oil with rollerball applicator, plus an included onyx gua sha massage tool. Per BUNI\'s own "What\'s Inside" list: snail secretion filtrate (scar healing + regeneration), retinyl palmitate (cell turnover + renewal), organic avocado oil (deep moisture + elasticity), apricot oil (lightweight hydration), chamomile & lavender (calming + soothing), and vitamin E & sunflower oil (antioxidant protection).',
            recalls: 'No recalls found.',
            sideEffects: 'BUNI instructs users to obtain medical approval before using it on a new scar or C-section scar. Do not apply to an open or unhealed surgical wound unless specifically directed by a clinician. Full warnings are listed below.',
            opinionAlerts: 'Scar-improvement and massage claims are from BUNI; no independent clinical trial of the finished product was identified.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims and usage guidance are sourced from BUNI; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI\'s own site lists what\'s inside this oil and why: snail secretion filtrate for scar healing and regeneration (BUNI says it stimulates collagen and smooths texture), retinyl palmitate for cell turnover and renewal, organic avocado oil for deep moisture and elasticity, apricot oil for lightweight hydration, chamomile and lavender for calming and soothing (reducing inflammation and redness), and vitamin E with sunflower oil for antioxidant protection — shielding healing skin from environmental damage. BUNI advises medical approval before using the oil on a new or C-section scar.\n\nSeveral of these ingredients have real, independent research behind the specific mechanism BUNI claims for them. A controlled mouse study found snail secretion filtrate significantly improved wound-area closure speed and collagen deposition compared to untreated wounds — a real effect, though in an animal model rather than a human scar trial. Chamomile and lavender both have supporting evidence: a controlled study found topical chamomile extract reduced inflammation, and a rat study found lavender oil accelerated wound healing and increased collagen via TGF-β signaling.\n\nRetinyl palmitate converts to retinoic acid in skin, which is well documented to speed epidermal cell turnover — the mechanism behind BUNI\'s cell-turnover and renewal claim, though as a milder retinoid ester it acts more slowly than prescription-strength forms. Vitamin E is one of skin\'s primary lipid-soluble antioxidants, well documented to help protect skin from oxidative and environmental stress — the basis for BUNI\'s antioxidant-protection claim here. Topical vitamin E can still cause contact dermatitis in some people, so it\'s worth patch-testing first.\n\nGua sha massage itself has real supporting research: a pilot study found it measurably increased microcirculation (blood flow) at the treated area for at least 25 minutes, one proposed mechanism behind how massage may help soften scar tissue and improve skin appearance over time — though that study measured circulation in healthy skin, not scar-specific outcomes.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'BUNI\'s ingredient claims for this oil — scar healing/regeneration (snail secretion filtrate), cell turnover (retinyl palmitate), moisture (avocado + apricot oil), calming (chamomile + lavender), and antioxidant protection (vitamin E) — are each backed by real independent research on the underlying mechanism. Gua sha massage also has real evidence for boosting local circulation. No independent clinical study of this specific finished product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the Response of Skin to Oxidative Stress — Vitamin E as a Key Indicator' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/17905355/', label: 'PubMed: The Effect of Gua Sha Treatment on the Microcirculation of Surface Tissue — a pilot study in healthy subjects' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women wanting a moisturizing routine for the appearance of scars or stretch marks after skin has fully healed',
            'C-section or postpartum recovery, once a doctor has cleared scar massage',
            'Anyone wanting a rollerball + gua sha massage routine for general dry skin',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // bunibody.com/products/buni-natural-scar-body-treatment-oil.
        howToUse: {
            intro: 'Per BUNI\'s own site: roll the oil directly onto scars, stretch marks, or dry patches using the rollerball applicator.',
            steps: [
                'Gently massage it in with the rollerball or the included onyx gua sha tool to help absorption and circulation.',
                'Use 1 to 2 times daily.',
                'For scar care, start only once the skin is fully healed.',
                'Consistent use for 3 to 6 months is what BUNI says shows the most visible improvement.',
            ],
            sourceUrl: 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil',
            sourceLabel: 'bunibody.com: TRANSFORM Scar+Body Treatment Oil',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Get medical approval before using on a new scar or a C-section scar.',
            'Do not apply to an open or unhealed surgical wound unless a clinician directs it.',
            'Vitamin E can cause contact dermatitis or itching in some people — patch test first.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'One customer review on BUNI\'s site: "Transform literally changed my C-section scar. 6 weeks in and the difference is wild. I also use it on old stretch marks — they\'re visibly fading." No star rating or review count was shown alongside it, and no independent (non-brand) review data was found at time of writing.',
        effectiveness: 'May moisturize and soothe skin as part of a regular scar-massage routine after appropriate wound healing. Each named ingredient — snail secretion filtrate, retinyl palmitate, avocado oil, chamomile, lavender, and vitamin E — has real independent research behind the specific mechanism BUNI claims for it, and the gua sha component has real evidence for boosting local circulation. Product-specific clinical benefit for visible scarring has not been independently established.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed) where independent research
        // exists. Rendered on the Scientific literature tab. Matches
        // BUNI's own "What's Inside" ingredient list and stated purposes.
        ingredientScience: [
            {
                name: 'Snail secretion filtrate',
                text: 'BUNI states this stimulates collagen and smooths texture for scar healing and regeneration. A controlled mouse study found snail secretion filtrate significantly improved wound-area closure speed and collagen deposition compared to untreated wounds — a real effect, though from an animal model rather than a human scar trial.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8402640/', label: 'NIH (PMC): The Protective Effect of Snail Secretion Filtrate in an Experimental Model of Excisional Wounds in Mice' },
                ],
            },
            {
                name: 'Retinyl palmitate',
                text: 'BUNI states this promotes cell turnover and renewal. Retinyl palmitate converts to retinoic acid in skin through a two-step process, and retinoic acid is well documented to speed epidermal cell turnover — the mechanism behind BUNI\'s claim. Because of that extra conversion step, it\'s a milder, slower-acting retinoid than prescription-strength forms.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10622759/', label: 'NIH (PMC): Efficacy and mechanism of retinyl palmitate against UVB-induced skin photoaging' },
                ],
            },
            {
                name: 'Organic avocado oil',
                text: 'BUNI states this gives deep moisture and elasticity. A plant oil shown to support skin-barrier repair, collagen synthesis, and wound healing in review and lab literature.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils' },
                ],
            },
            {
                name: 'Apricot oil',
                text: 'BUNI states this gives lightweight hydration that absorbs without a greasy residue. Apricot kernel oil is rich in oleic and linoleic fatty acids, known to reinforce the skin\'s own barrier lipids. No independent clinical trial specifically testing this oil for scar or body-oil use was found.',
            },
            {
                name: 'Chamomile & lavender',
                text: 'BUNI states these calm and soothe skin, reducing inflammation and redness. Both have supporting evidence: a controlled study found topical chamomile extract reduced inflammation, and a rat study found lavender oil accelerated wound healing and increased collagen deposition via TGF-β signaling.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/6505092/', label: 'PubMed: Evaluation of antiinflammatory activity of a chamomile extract topical application' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27229681/', label: 'PubMed: Wound healing potential of lavender oil by acceleration of granulation and wound contraction through induction of TGF-β in a rat model' },
                ],
            },
            {
                name: 'Vitamin E & sunflower oil',
                text: 'BUNI positions this as antioxidant protection, shielding healing skin from environmental damage. Vitamin E is one of skin\'s primary lipid-soluble antioxidants — a classic review found it accumulates in the stratum corneum and cell membranes, where it helps protect skin from oxidative and environmental stress, which is the mechanism behind BUNI\'s claim. Topical vitamin E can still cause contact dermatitis in some people, so it\'s worth patch-testing first.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the Response of Skin to Oxidative Stress — Vitamin E as a Key Indicator' },
                ],
            },
            {
                name: 'Gua sha massage',
                text: 'A pilot study using laser Doppler imaging found gua sha caused a measurable, sustained increase in microcirculation (blood flow) at the treated area, one proposed mechanism behind massage-based scar and tissue work. The study measured healthy skin, not scar-specific outcomes.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/17905355/', label: 'PubMed: The Effect of Gua Sha Treatment on the Microcirculation of Surface Tissue — a pilot study in healthy subjects' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/BUNI-Premium-Scar-Oil-Gua/dp/B0G45CR6TP',
                        text: 'Amazon: BUNI TRANSFORM Scar Oil reviews',
                        // Amazon blocks automated access, so this isn't a
                        // summary of actual review text — just confirms this
                        // is the real, current product listing. Read the
                        // reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil',
                        text: 'BUNI: TRANSFORM Scar+Body Treatment Oil customer reviews',
                        summary: 'BUNI\'s own product page displays customer testimonials, including the C-section scar review quoted above. No star rating or aggregate review count was shown at time of writing.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-buni-bundle',
        name: 'BUNI Bundle',
        brand: 'BUNI',
        category: 'postpartum',
        type: 'physical',
        internal: false,
        healthFunctions: ['comfort', 'vaginal-health'],
        tags: ['postpartum', 'pregnancy', 'menopause', 'comfort', 'hormone-free', 'cruelty-free', 'vegan'],
        price: '$98',
        whereToBuy: ['Amazon', 'BUNI Body'],
        url: 'https://www.bunibody.com/products/buni-bundle',
        affiliateUrl: 'https://amzn.to/4xSUqDt',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/4xSUqDt',
            'BUNI Body': 'https://www.bunibody.com/products/buni-bundle',
        },
        image: 'https://cdn.shopify.com/s/files/1/0661/0432/8271/files/buni-bundle-product-page-main.webp?v=1776772005',
        summary: 'BUNI’s complete body-care set containing REJUVENATE Vulva Balm, SOOTHE Nipple and Lip Balm, TRANSFORM Scar+Body Treatment Oil, and an onyx gua sha tool.',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the products themselves are cosmetic / personal-care items, not FDA-cleared medical treatments.',
            materials: 'Contains the three BUNI topical products plus an onyx gua sha tool. See each product\'s own entry for its full ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Follow the individual product directions and ingredient warnings. TRANSFORM should not be used on a new or C-section scar without medical approval.',
            opinionAlerts: 'Product benefits are based on BUNI’s descriptions; no independent clinical study of the bundle was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Bundle contents and product positioning are sourced from BUNI; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'The bundle combines BUNI’s intimate moisturizer, nipple/lip balm, and scar/body oil into one postpartum and body-care set, formulated by board-certified OB/GYNs and dermatologists, per the brand\'s own site. See each individual product\'s entry for its own ingredient-level evidence and citations.',
        effectiveness: 'Convenience bundle containing three distinct topical products; effectiveness depends on the individual product and use case.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/BUNI-Bundle-Moisturizing-Plant-Derived-Fragrance-Free/dp/B0G53D19CK',
                        text: 'Amazon: BUNI Bundle reviews',
                        summary: 'Real, current Amazon listing for this exact bundle. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.bunibody.com/products/buni-bundle',
                        text: 'BUNI: Bundle customer reviews',
                        summary: 'BUNI\'s own site hosts reviews for the bundle and for each individual product it contains — see each product\'s own entry for specific customer quotes. No star rating or aggregate review count was shown for the bundle itself at time of writing.',
                    },
                ],
            },
        },
        isEmergingBrand: true,
    },

    // Additional My Pelvic Bra partnership products supplied 2026-09-11.
    {
        id: 'p-mypelvicbra-prolapse-chicken',
        name: 'myPelvicBra® Pink Prolapse Chicken',
        brand: 'My Pelvic Bra',
        category: 'pelvic-floor',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['pelvic-floor', 'education'],
        price: '€6.95',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/mypelvicbra%C2%AE-pink-prolapse-chicken',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/mypelvicbra%C2%AE-pink-prolapse-chicken?bg_ref=bZYYwMBpTa',
        image: 'https://cdn.shopify.com/s/files/1/0640/1513/8877/files/36.png?v=1788468282',
        summary: 'A soft, squeezable pelvic-health demonstration tool designed to make pelvic organ prolapse education easier to visualize, including how external perineal compression can provide support from below.',
        safety: {
            fdaStatus: 'Educational demonstration item; not an FDA-cleared medical device or treatment.',
            materials: 'Soft squeezable demonstration tool; exact material composition was not listed on the product page.',
            recalls: 'No recalls found.',
            sideEffects: 'For education and demonstration only. It does not diagnose, treat, or correct pelvic organ prolapse.',
            opinionAlerts: 'The educational explanation is sourced from My Pelvic Bra’s product page.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Educational positioning is sourced from My Pelvic Bra; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'The product is intended as a hands-on teaching aid for explaining prolapse and external support concepts, not as a therapeutic device.',
        effectiveness: 'Educational demonstration tool only; it is not intended to provide a clinical treatment effect.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-mypelvicbra-waistband-extenders',
        name: 'Pelvic Bra® Waistband Extenders',
        brand: 'My Pelvic Bra',
        category: 'pelvic-floor',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['pelvic-floor', 'postpartum', 'comfort'],
        price: '€7.95',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/waistband-extenders',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/waistband-extenders?bg_ref=bZYYwMBpTa',
        image: 'https://cdn.shopify.com/s/files/1/0640/1513/8877/files/WaistbandExtenders_4.jpg?v=1766335111',
        summary: 'A set of two removable waistband extenders that adds extra room to a Pelvic Bra® while preserving its intended support and compression. S-series fits the Classic; L-series fits the wider Classic Plus waistband.',
        safety: {
            fdaStatus: 'Garment accessory; not an FDA-cleared medical device.',
            materials: 'Hook-on waistband extenders sold as a set of two; select the series that matches the Pelvic Bra® style.',
            recalls: 'No recalls found.',
            sideEffects: 'S-series and L-series extenders are not interchangeable. Use the correct style and avoid excessive compression or an uncomfortable fit.',
            opinionAlerts: 'Fit and support descriptions are sourced from My Pelvic Bra’s product page.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Fit guidance is sourced from My Pelvic Bra; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'These extenders adjust waistband length; they do not provide pelvic support independently of the compatible Pelvic Bra® garment.',
        effectiveness: 'Designed to improve waistband fit while retaining the garment’s intended compression; not a standalone pelvic-floor treatment.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-mypelvicbra-classic-plus',
        name: 'Classic Plus Pelvic Bra®',
        brand: 'My Pelvic Bra',
        category: 'pelvic-floor',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['pelvic-floor', 'postpartum', 'comfort', 'bladder-leaks'],
        price: '€77.95',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE-classic-plus',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/classic-pelvic-bra%C2%AE-classic-plus?bg_ref=bZYYwMBpTa',
        image: 'https://cdn.shopify.com/s/files/1/0640/1513/8877/files/6.png?v=1788247226',
        summary: 'The fuller-coverage Pelvic Bra® style, with a wider adjustable waistband and reinforced supportive hammock for people wanting more substantial external pelvic-floor and perineal support during daily activity.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device and not a corrective treatment for prolapse.',
            materials: 'Breathable, skin-friendly stretch fabric with reinforced hammock, creaseless gusset, sweat-wicking liner, and wider adjustable hook-and-eye waistband, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Use the minimum compression needed for comfort and support. Remove for sleep and reduce or stop use if the garment causes pain, numbness, skin irritation, or worsening symptoms.',
            opinionAlerts: 'Support and symptom-relief descriptions are sourced from My Pelvic Bra; product-specific clinical outcomes have not been independently established.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from My Pelvic Bra’s own product and educational materials; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'My Pelvic Bra positions Classic Plus as its maximum-support, fuller-coverage adjustable option for external pelvic-floor and perineal support during standing, walking, lifting, exercise, pregnancy, and postpartum activity.',
        effectiveness: 'Positioned as external symptom-management support wear rather than a corrective device; no independent clinical study of the Classic Plus product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

];

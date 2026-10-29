// ============================================================
// Ayna Product Database, Brand Catalog Entries
// Smaller/newer brands, added so their products surface reliably in
// Discovery search regardless of whether the AI-suggestion fallback
// recognizes the brand name (see naturalLanguageSearch.js). These are
// NOT partnership relationships, just catalog entries for real brands.
// VERIFICATION: every entry below was confirmed against the brand's own
// live site before being added, see api/_officialSiteFetch.js, which
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
        summary: 'An at-home UTI test that reads urine for the same nitrite and leukocyte-esterase markers used on standard clinical dipsticks, giving an immediate digital result instead of color-matching a strip. A positive result (or symptoms that persist despite a negative one) connects you through Winx Rx, the brand\'s own telehealth service, to a board-certified doctor for a video visit and, if appropriate, a same-day prescription. Named to TIME\'s 2024 Best Inventions list as the only OTC test-plus-telehealth UTI kit of its kind sold in the US.',
        safety: {
            fdaStatus: 'Sold over-the-counter as a consumer diagnostic aid; not a substitute for a lab urine culture. Any prescription treatment is issued by a licensed telehealth provider via Winx Rx, not the test itself.',
            materials: 'See product packaging for full test component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None from the test itself. A home UTI test is a screening aid, not a diagnosis: persistent, worsening, or recurrent symptoms need in-person evaluation regardless of the result.',
            opinionAlerts: 'Winx Health markets this as "OBGYN approved" and cites that roughly half of US counties lack a practicing OB-GYN as the access gap this closes: both figures are from the brand\'s own site and TIME\'s coverage, not independently re-verified here.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'A home test with an immediate result and telehealth access to prescription treatment is a real improvement in access for a condition where roughly half of US counties don\'t have a practicing OB-GYN, and where a several-day wait for an in-person appointment often means days of untreated discomfort. UTIs are also genuinely common, with public-health estimates putting diagnoses in the hundreds of millions per year in the US, so an accessible screening option has real value.\n\nWhat this test doesn\'t do is replace a urine culture for recurrent, complicated, or atypical symptoms. Home UTI tests like this one generally screen for nitrites and/or leukocyte esterase, the same markers used on standard urine dipsticks, which have documented real-world sensitivity and specificity limits: a normal result doesn\'t fully rule out infection if symptoms are clearly present, and a positive result still benefits from culture-guided antibiotic choice if symptoms don\'t resolve or keep recurring. Fever, flank/back pain, or visible blood in urine are reasons to seek in-person care regardless of what a home test shows.',
        doctorOpinionShort: 'A real access improvement for uncomplicated UTI symptoms, especially where in-person OB-GYN care is scarce, but it\'s a screening aid built on standard dipstick-style markers, not a lab culture, and doesn\'t replace in-person care for fever, flank pain, or recurrent infections.',
        doctorOpinionCitations: [
            { url: 'https://time.com/collections/best-inventions-2024/7094898/winx-health-uti-test-and-treat/', label: 'TIME: 2024 Best Inventions, Winx Health UTI Test + Treat' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6754830/', label: 'PMC: Diagnostic value of dipstick testing in adult UTI' },
        ],
        whoItsFor: [
            'People with classic UTI symptoms (burning, urgency, frequency) who want a fast home read before deciding whether to seek treatment',
            'Anyone in one of the many US counties without a nearby OB-GYN, or who can\'t get a same-day in-person appointment',
            'Not a replacement for in-person or lab-based care if you have fever, flank/back pain, blood in urine, or symptoms that keep recurring',
        ],
        howToUse: {
            intro: 'Per Winx Health\'s own instructions:',
            steps: [
                'Urinate on the test strip pad as directed.',
                'Read the digital result via the Winx app.',
                'If positive (or symptoms persist despite a negative result) start a video visit with a board-certified doctor through Winx Rx.',
                'Pick up same-day prescription treatment if the provider prescribes one.',
            ],
            sourceUrl: 'https://hellowinx.com/products/uti-tests',
            sourceLabel: 'hellowinx.com: UTI Test + Treat',
        },
        warnings: [
            'Seek in-person or emergency care for fever, chills, flank/back pain, nausea, or vomiting: these can signal a kidney infection, which a home test won\'t catch.',
            'A negative result doesn\'t fully rule out infection if you have clear symptoms; a positive result still benefits from a follow-up culture if symptoms don\'t resolve or keep recurring.',
            'Frequent recurrent UTIs (3+ per year) warrant an in-person workup, not repeated home testing alone.',
        ],
        communityReview: 'Winx\'s UTI Test + Treat was named to TIME\'s 2024 Best Inventions list, and the brand has highlighted it as the only OTC test-plus-telehealth kit of its kind sold in the US. Independent (non-brand) review volume specific to this exact kit is still limited outside retailer star ratings; broader Winx/Stix community sentiment on Reddit and TikTok is generally positive on convenience and discretion.',
        ingredients: 'Test strip pad for nitrite/leukocyte-esterase-style urinalysis screening; any prescribed treatment is separate and determined by a Winx Rx provider.',
        effectiveness: 'Gives a same-day path from symptom to (if appropriate) prescription treatment, a real access improvement, especially where nearby OB-GYN care is scarce. Home urine screening for nitrites/leukocyte esterase has documented real-world sensitivity and specificity limits in the published dipstick-testing literature, so a home negative result in someone with clear symptoms is not the same as a lab-confirmed negative.',
        // Category-level citations shown only on the Scientific literature tab,
        // kept out of verificationLinks so they don't also pool onto the
        // Clinician opinion card's chip row (already surfaced via doctorOpinionCitations).
        scientificCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6754830/', text: 'PMC: Diagnostic value of dipstick test in adult symptomatic urinary tract infections', summary: 'Cross-sectional study quantifying real sensitivity/specificity limits of the nitrite/leukocyte-esterase dipstick testing that home UTI tests are generally built on.' },
        ],
        integrations: [],
        badges: ['Female-Founded', 'TIME Best Invention 2024'],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/UTI/search/?q=winx', text: 'Reddit r/UTI: Winx search', summary: 'User discussion of the Winx UTI test and telehealth experience.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=winx%20health%20uti%20test', text: 'TikTok: Winx Health UTI test', summary: 'Unboxing and real-use videos.' },
                { platform: 'instagram', url: 'https://www.instagram.com/hellowinx/', text: 'Winx Health on Instagram', summary: 'Brand content and community posts.' },
                { platform: 'wikipedia', url: 'https://en.wikipedia.org/wiki/Winx_Health', text: 'Wikipedia: Winx Health', summary: 'Independent background on the brand\'s history, founders, and rebrand from Stix.' },
            ] },
        },
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    // Winx Health's real remaining standalone catalog (2026-08-24), the
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
        summary: 'An at-home vaginal pH test: wipe the included swab, press it to the test strip, and match the color to a chart to read your vaginal pH in under a minute. Marketed to help flag whether symptoms point toward BV, a yeast infection, or something else, with same-day prescription treatment available through Winx Rx if a provider agrees it\'s needed.',
        safety: {
            fdaStatus: 'Consumer diagnostic test; any prescription treatment is issued by a licensed telehealth provider, not the test itself.',
            materials: 'See product packaging for full test component list.',
            recalls: '⚠️ Marketing-accuracy note (not a recall): this is a single-marker pH strip test. Published research comparing pH testing to the lab-standard Nugent score found pH alone caught only about 22% of true BV cases, and yeast infections typically don\'t raise vaginal pH at all, so a normal result doesn\'t rule out a yeast infection, despite the product being marketed to help tell the two apart.',
            sideEffects: 'None from the test itself; any treatment side effects depend on the medication a provider prescribes.',
            opinionAlerts: 'A pH strip is a real but limited signal, mainly useful for flagging possible BV or trichomoniasis: not for ruling out a yeast infection. See Clinician opinion for the specifics.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Vaginal pH testing is a real, commonly used first clue in evaluating vaginitis: bacterial vaginosis and trichomoniasis typically raise vaginal pH above 4.5, and that\'s genuinely useful information. What this product\'s marketing (helping you "tell a yeast infection, BV, or something else apart") oversells is how much a pH strip alone can actually distinguish: published research comparing pH testing to the lab-standard Nugent score found pH alone caught only about 22% of true BV cases, and vulvovaginal candidiasis (yeast infection) typically does not raise pH at all, staying in the same range you\'d see in a healthy vagina.\n\nIn practice, that means an elevated pH is a real, weak-but-real signal to consider BV or trichomoniasis and seek treatment or testing, while a normal pH result tells you comparatively little: it does not rule out a yeast infection. If symptoms persist regardless of what the strip shows, in-person testing (which can look at more than pH) is the more reliable next step, and Winx Rx is one route to a same-day prescription if a provider agrees treatment is warranted.',
        doctorOpinionShort: 'A pH strip is a real but weak signal, mainly for BV, published data show it catches only around 22% of true BV cases, and it typically won\'t flag a yeast infection at all since those don\'t raise pH. A normal result doesn\'t rule much out.',
        doctorOpinionCitations: [
            { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5331313/', label: 'PMC: Colorimetric vaginal pH vs. Nugent score for BV detection' },
        ],
        whoItsFor: [
            'People who want a quick first clue (elevated vs. normal pH) before deciding whether to seek care',
            'Not a reliable stand-alone way to rule out a yeast infection: a normal pH doesn\'t mean "no yeast infection"',
            'Best paired with in-person testing or a Winx Rx telehealth visit if symptoms persist regardless of the reading',
        ],
        howToUse: {
            intro: 'Per Winx Health\'s own instructions:',
            steps: [
                'Wipe the cotton swab across the vaginal opening as directed.',
                'Press the swab onto the test strip\'s test area.',
                'Compare the color to the included chart within the stated time window.',
                'If elevated (or if symptoms persist regardless of the reading) use Winx Rx for a telehealth visit.',
            ],
            sourceUrl: 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections',
            sourceLabel: 'hellowinx.com: Vaginal Health Test + Treat',
        },
        warnings: [
            'A normal pH result does not rule out a yeast infection: candidiasis typically does not raise vaginal pH.',
            'Recurrent or persistent symptoms, unusual odor, fever, or pelvic pain warrant in-person evaluation regardless of the pH result.',
            'Not a test for STIs other than trichomoniasis-associated pH changes; it does not screen for chlamydia, gonorrhea, or other STIs.',
        ],
        communityReview: 'Community discussion of Winx\'s standalone vaginal pH test specifically is limited outside retailer reviews; broader Winx/Stix brand sentiment on Reddit and TikTok is generally positive on convenience and discretion, though pH-test accuracy for BV vs. yeast isn\'t something home-test users can typically verify themselves.',
        ingredients: 'pH-indicator test strip and cotton swab; no active treatment ingredient in the test itself.',
        effectiveness: 'Useful as a rough first signal (elevated vs. not), materially better at flagging possible BV/trichomoniasis than at ruling out a yeast infection. No independent clinical accuracy study of this specific Winx test was found; the pH-based limitations above come from the broader clinical literature on vaginal pH testing generally.',
        scientificCitations: [
            { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5331313/', text: 'PMC: A Comparison of Colorimetric Assessment of Vaginal pH with Nugent Score for the Detection of Bacterial Vaginosis', summary: 'Found vaginal pH alone has poor sensitivity (~22%) for detecting BV against the lab-standard Nugent score, and doesn\'t reliably flag yeast infections, which don\'t elevate pH.' },
        ],
        integrations: [],
        badges: [],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=winx%20vaginal%20ph', text: 'Reddit r/WomensHealth: Winx vaginal pH search', summary: 'User discussion of the Winx vaginal pH test.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=winx%20health%20vaginal%20ph%20test', text: 'TikTok: Winx Health vaginal pH test', summary: 'Real-use videos of the test kit.' },
                { platform: 'instagram', url: 'https://www.instagram.com/hellowinx/', text: 'Winx Health on Instagram', summary: 'Brand content and community posts.' },
            ] },
        },
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
        summary: 'A standard at-home urine hCG pregnancy test, read in minutes, that the brand states is over 99% accurate starting the day of a missed period. Ships in discreet, unbranded packaging.',
        safety: {
            fdaStatus: 'Over-the-counter home pregnancy test.',
            materials: 'See product packaging.',
            recalls: 'No recalls found.',
            sideEffects: 'None.',
            opinionAlerts: 'The "over 99% accurate" claim is standard phrasing across the home pregnancy test category (most OTC and store brands cite similar figures for testing on or after the day of a missed period) and is the brand\'s own claim, not independently verified product-by-product here.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Home urine hCG pregnancy tests are a well-established, reliable technology when used as directed: accuracy is highest starting the day of a missed period, and testing earlier increases the chance of a false negative simply because hCG may not yet be detectable, not because the test itself is unreliable. A single test, taken correctly at the right time, is genuinely accurate for most people; if a period doesn\'t start and a test reads negative, retesting in a few days or seeing a clinician is the standard next step, not assuming the first result is final.',
        doctorOpinionShort: 'A standard, well-established hCG urine test. Timing matters more than brand, testing on or after the day of a missed period is when accuracy is highest; a too-early negative can just mean hCG isn\'t detectable yet.',
        doctorOpinionCitations: [
            { url: 'https://www.fda.gov/medical-devices/home-use-tests/pregnancy', label: 'FDA: Pregnancy (Home Use Tests)' },
        ],
        whoItsFor: [
            'Anyone wanting a private, at-home pregnancy test with discreet packaging',
            'Best used on or after the day of a missed period for the most reliable result',
            'Not a substitute for a blood test or clinician follow-up if timing is uncertain or results are ambiguous',
        ],
        howToUse: {
            intro: 'Per FDA guidance for home pregnancy tests generally (Winx does not publish unique instructions beyond standard use):',
            steps: [
                'Test on or after the first day of a missed period for the most reliable result.',
                'Use first-morning urine when possible, since hCG is most concentrated then.',
                'Read the result within the test\'s stated time window: reading too early or too late can distort results.',
                'If negative but your period still doesn\'t start, retest in a few days or see a clinician.',
            ],
            sourceUrl: 'https://www.fda.gov/medical-devices/home-use-tests/pregnancy',
            sourceLabel: 'FDA: Pregnancy (Home Use Tests)',
        },
        communityReview: 'Winx Health\'s pregnancy tests trace back to the brand\'s original 2019 launch as Stix; community sentiment (Reddit, TikTok) on the brand\'s test-strip products is generally positive on discretion and ease of ordering, consistent with reviews of most mainstream at-home hCG test strips.',
        ingredients: 'Standard urine hCG (human chorionic gonadotropin) lateral-flow test strip.',
        effectiveness: 'Performs like standard hCG test strips generally do: most reliable starting the day of a missed period. No independent, brand-specific accuracy study of Winx\'s test was found; the "99% accurate" figure is the brand\'s claim, consistent with the category norm when tests are used as directed and timed correctly.',
        scientificCitations: [
            { url: 'https://www.fda.gov/medical-devices/home-use-tests/pregnancy', text: 'FDA: Pregnancy (Home Use Tests)', summary: 'Federal guidance on how home pregnancy tests work and how timing affects accuracy.' },
        ],
        integrations: [],
        badges: [],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/tryingtoconceive/search/?q=winx%20OR%20stix%20pregnancy%20test', text: 'Reddit r/tryingtoconceive: Winx/Stix pregnancy test search', summary: 'User discussion of the test.' },
                { platform: 'instagram', url: 'https://www.instagram.com/hellowinx/', text: 'Winx Health on Instagram', summary: 'Brand content and community posts.' },
            ] },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-winx-uti-pain-relief',
        name: 'Winx Health UTI Fast-Acting Pain Relief',
        brand: 'Winx Health',
        category: 'medication',
        type: 'physical',
        internal: false,
        healthFunctions: ['uti-prevention'],
        tags: ['uti'],
        price: '$10.50',
        whereToBuy: [],
        url: 'https://hellowinx.com/products/uti-fast-acting-pain-relief',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/01WinxUTIPainReliefHero.png?v=1771347535',
        summary: 'An over-the-counter phenazopyridine hydrochloride tablet (99.5mg) that targets UTI-related burning, urgency, and discomfort directly at the bladder and urethra: the same active ingredient sold under brand names like AZO. Most users feel relief within an hour; expect urine to temporarily turn reddish-orange, a normal and harmless effect of the medication.',
        safety: {
            fdaStatus: 'Over-the-counter urinary analgesic; active ingredient (phenazopyridine hydrochloride) has FDA-reviewed OTC status but with a real, documented safety profile below.',
            materials: 'Active ingredient: Phenazopyridine Hydrochloride 99.5mg per tablet. Inactive: corn starch, croscarmellose sodium, hypromellose, lactose, magnesium stearate, microcrystalline cellulose, polyethylene glycol, polyvinylpyrrolidone, pregelatinized starch, silicon dioxide, sodium starch glycolate, talc, triacetin.',
            recalls: '⚠️ Not a recall, but a real FDA-labeled concern worth knowing: phenazopyridine\'s FDA-reviewed label carries a carcinogenicity warning based on tumors seen in long-term animal studies (rats/mice), and rare cases of methemoglobinemia (a blood disorder) have been reported, more so in people with kidney disease. The label caps use at 2 days when taken alongside an antibiotic.',
            sideEffects: 'Turns urine reddish-orange (harmless, expected, but can stain fabric/contact lenses). Rare: methemoglobinemia (bluish skin/lips, unusual tiredness, shortness of breath: seek care immediately if these occur), especially with kidney disease. Masks the burning/urgency symptoms that would otherwise signal a worsening infection: it treats discomfort, not the infection itself.',
            opinionAlerts: 'This is a symptom-relief product, not an antibiotic: it does not treat the underlying infection. The FDA-reviewed label limits use alongside an antibiotic to 2 days, and it should not be used as a way to avoid or delay treating the infection itself.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Phenazopyridine is a genuinely effective, fast-acting urinary analgesic: it\'s the same active ingredient in AZO and similar store brands, has been used since the 1920s, and does provide real short-term relief from the burning and urgency of a UTI. That said, it treats the symptom, not the infection: taking it without also getting antibiotic treatment, if a UTI is actually present, risks masking symptoms while an untreated infection progresses.\n\nThe FDA-reviewed label also carries findings worth knowing before use: long-term animal studies found tumors associated with phenazopyridine, which is why the label includes a carcinogenicity warning and why the drug is meant for short-term use only: no more than 2 days alongside an antibiotic. Rare cases of methemoglobinemia, a blood disorder that reduces oxygen delivery, have also been reported, with higher risk in people with kidney disease. None of this makes an occasional, short course of a UTI pain reliever unreasonable (it\'s a real, useful product) but "short-term" is doing real work in that sentence.',
        doctorOpinionShort: 'A genuinely effective, fast-acting symptom reliever (same active ingredient as AZO), but it treats discomfort, not the infection, and the FDA label caps use at 2 days alongside an antibiotic due to a carcinogenicity warning from animal studies and rare methemoglobinemia risk.',
        doctorOpinionCitations: [
            { url: 'https://www.ncbi.nlm.nih.gov/books/NBK580545/', label: 'NCBI StatPearls: Phenazopyridine' },
        ],
        whoItsFor: [
            'Short-term relief (1-2 days) of UTI-related burning, urgency, and discomfort, ideally alongside (not instead of) actual infection treatment',
            'Not for anyone with kidney disease without a clinician\'s okay, given the methemoglobinemia risk',
            'Not a substitute for diagnosing or treating the underlying infection',
        ],
        howToUse: {
            intro: 'Per the FDA-reviewed label for phenazopyridine hydrochloride products:',
            steps: [
                'Take only as directed on the package; do not exceed the labeled dose.',
                'Limit use to 2 days if also taking an antibacterial for a UTI, per the FDA-reviewed label.',
                'Expect reddish-orange urine: this is normal and expected, not a sign of a problem.',
                'Seek immediate medical attention for bluish/gray skin or lips, unusual tiredness, or shortness of breath.',
            ],
            sourceUrl: 'https://www.ncbi.nlm.nih.gov/books/NBK580545/',
            sourceLabel: 'NCBI StatPearls: Phenazopyridine',
        },
        warnings: [
            'FDA-reviewed label carries a carcinogenicity warning based on long-term animal studies; the drug is intended for short-term use only.',
            'Rare but serious: methemoglobinemia. Seek immediate care for bluish/gray skin, lips, or nails, unusual fatigue, rapid heartbeat, or shortness of breath: risk is higher with kidney disease.',
            'Do not use longer than 2 days when also taking an antibiotic, per the FDA-reviewed label, and don\'t use it as a substitute for actual infection treatment.',
        ],
        communityReview: 'Community reviews (Reddit, retailer sites) of phenazopyridine-based UTI relief products generally describe fast, real relief from burning and urgency, consistent across brands (AZO, store brands, Winx) since they share the same active ingredient; the main recurring complaint across the category is the orange-red urine color surprising first-time users despite label warnings.',
        ingredients: 'Phenazopyridine Hydrochloride 99.5mg per tablet, plus standard tablet excipients (corn starch, lactose, microcrystalline cellulose, and others: see full list above).',
        effectiveness: 'Reliable, well-established short-term symptom relief; this is a decades-old, widely used active ingredient, not a novel or unproven formulation. Its real limitation is that it treats discomfort, not infection.',
        scientificCitations: [
            { url: 'https://www.ncbi.nlm.nih.gov/books/NBK580545/', text: 'NCBI StatPearls: Phenazopyridine', summary: 'Comprehensive clinical reference covering phenazopyridine\'s mechanism, FDA carcinogenicity warning from animal studies, methemoglobinemia risk, and the 2-day use limit alongside antibiotics.' },
        ],
        integrations: [],
        badges: [],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/UTI/search/?q=phenazopyridine%20OR%20winx%20pain%20relief', text: 'Reddit r/UTI: phenazopyridine / Winx pain relief search', summary: 'User discussion of fast-acting UTI pain relief tablets.' },
                { platform: 'instagram', url: 'https://www.instagram.com/hellowinx/', text: 'Winx Health on Instagram', summary: 'Brand content and community posts.' },
            ] },
        },
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
        whereToBuy: ['Walgreens'],
        url: 'https://hellowinx.com/products/vaginal-health-probiotic',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/01_Winx_probiotic_Hero.png?v=1771347498',
        summary: 'A daily capsule combining Lactobacillus acidophilus, Lactobacillus rhamnosus, Lactobacillus reuteri, and Bifidobacterium lactis with inulin as a prebiotic: 15 billion CFU per serving. Marketed to support a healthy, acidic vaginal pH and help crowd out the bacteria and yeast linked to BV and yeast infections.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA for safety or efficacy claims.',
            materials: 'Lactobacillus acidophilus, Lactobacillus rhamnosus, Lactobacillus reuteri, Bifidobacterium lactis Bi-07, inulin (prebiotic fiber), 15 billion CFU per serving. See product packaging for the full excipient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Generally well tolerated; mild bloating or GI upset is possible when starting any new probiotic. Consult a clinician before use if pregnant, nursing, immunocompromised, or taking medications.',
            opinionAlerts: 'Oral Lactobacillus probiotics for vaginal health are a real, actively studied area with genuinely promising (though still evolving) evidence for specific strains and doses: not settled science, but not just marketing either. See Clinician opinion for the honest state of that research.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'This is one of the more evidence-backed categories in vaginal wellness supplements, worth saying plainly since so much of this space is under-studied. Lactobacillus dominance is genuinely associated with a healthier vaginal microbiome and lower rates of BV and UTIs, and specific Lactobacillus strains (rhamnosus and reuteri among them) have real randomized-trial support for helping restore or maintain that balance, whether taken orally or vaginally.\n\nThe honest caveats: strain, dose, and duration matter a lot in this literature: results don\'t generalize cleanly across every Lactobacillus product, and reviews consistently call for more standardized, larger trials before this can be called settled. This product\'s specific 4-strain, 15-billion-CFU blend has not itself been through an independent published clinical trial that ayna could find; the evidence above is for the strain category and related formulations, not proof of this exact product\'s outcomes. It\'s a reasonable, biologically plausible daily supplement for someone maintaining vaginal health: not a proven treatment for an active infection.',
        doctorOpinionShort: 'Lactobacillus probiotics for vaginal health are a genuinely promising, actively researched area with real trial support for specific strains, this product\'s exact 4-strain blend hasn\'t itself been independently trialed, but the underlying strain category has real evidence behind it.',
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11318795/', label: 'PMC: Probiotics for the Prevention of Vaginal Infections, Systematic Review' },
        ],
        whoItsFor: [
            'People wanting daily maintenance support for vaginal microbiome balance, not treatment of an active infection',
            'Those prone to recurrent BV or yeast infections who\'ve discussed probiotic strategies with a clinician',
            'Not a substitute for treating a current, symptomatic infection',
        ],
        howToUse: {
            intro: 'Per Winx Health\'s own instructions:',
            steps: [
                'Take one capsule daily with water.',
                'Take consistently: probiotic effects on the vaginal microbiome are cumulative, not immediate.',
                'Store as directed on the label (many probiotics are moisture- and heat-sensitive).',
            ],
            sourceUrl: 'https://hellowinx.com/products/vaginal-health-probiotic',
            sourceLabel: 'hellowinx.com: Vaginal Health Probiotic',
        },
        communityReview: 'Community discussion of vaginal-health probiotics broadly (Reddit r/WomensHealth) is generally favorable for daily maintenance and odor concerns, though individual response varies and this specific 4-strain Winx formulation doesn\'t yet have a large independent review base outside retailer star ratings.',
        ingredients: 'Lactobacillus acidophilus, Lactobacillus rhamnosus, Lactobacillus reuteri, Bifidobacterium lactis Bi-07, inulin. 15 billion CFU per serving.',
        effectiveness: 'Grounded in a genuinely active, promising research area for the strain category; this exact product blend has not been independently clinically trialed. Best understood as daily maintenance support, not treatment.',
        scientificCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11318795/', text: 'PMC: Probiotics for the Prevention of Vaginal Infections: A Systematic Review', summary: 'Reviews Lactobacillus strain evidence for vaginal infection prevention, genuine, growing support for specific strains, with a continued need for larger, more standardized trials.' },
        ],
        integrations: [],
        badges: [],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=winx%20probiotic', text: 'Reddit r/WomensHealth: Winx probiotic search', summary: 'User discussion of the Winx vaginal health probiotic.' },
                { platform: 'instagram', url: 'https://www.instagram.com/hellowinx/', text: 'Winx Health on Instagram', summary: 'Brand content and community posts.' },
            ] },
        },
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
        summary: 'A daily capsule (two per day) combining cranberry extract (proanthocyanidins), D-mannose, turmeric, and vitamin C, meant to make it harder for E. coli to stick to the bladder wall before a UTI can take hold. The brand states the formula was designed with input from urologists.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA for safety or efficacy claims.',
            materials: 'Cranberry extract (proanthocyanidins/PACs), D-mannose, turmeric, vitamin C. See product packaging for exact amounts and full excipient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Generally well tolerated. D-mannose can cause mild GI upset in some people; high-dose vitamin C can cause stomach upset or, rarely, kidney stone risk in predisposed individuals. Consult a clinician before use if pregnant, nursing, or managing kidney issues or diabetes (D-mannose is a sugar).',
            opinionAlerts: 'The two headline ingredients have real but different evidence bases: cranberry PACs have decent supporting evidence from a large, recent Cochrane review, while D-mannose\'s evidence has gotten weaker with newer, larger trials. See Clinician opinion for specifics.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Cranberry and D-mannose are the two most-studied "natural" UTI-prevention ingredients, and it\'s worth being specific about how the evidence for each actually stacks up, because it\'s genuinely different. Cranberry\'s active compounds (A-type proanthocyanidins, or PACs) interfere with E. coli\'s ability to stick to the bladder wall, and a large 2023 Cochrane review (50 studies, nearly 9,000 participants) found cranberry products reduced UTI risk by about 30% in women with recurrent UTIs: real, moderate-certainty evidence, though the review also found no clear dose-response relationship and didn\'t support use in pregnant women, the elderly, or people with bladder-emptying problems.\n\nD-mannose is the weaker story right now: it works on paper the same way, binding E. coli so it can\'t adhere to the bladder wall, and some smaller, earlier studies looked promising, but the most recent, larger systematic reviews and meta-analyses of randomized trials (including a major UK primary-care trial) have not found a significant reduction in recurrent UTI risk compared to placebo. That\'s a meaningfully different evidence picture than cranberry, and worth knowing if D-mannose is the ingredient someone is buying this product for specifically.',
        doctorOpinionShort: 'Cranberry PACs have real, moderate-certainty support from a large 2023 Cochrane review (~30% UTI risk reduction in recurrent-UTI-prone women). D-mannose\'s evidence is weaker than commonly believed, recent larger trials haven\'t found a significant benefit over placebo.',
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', label: 'Cochrane: Cranberries for preventing urinary tract infections (2023)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41004704/', label: 'PubMed: D-mannose for recurrent UTI, systematic review & meta-analysis' },
        ],
        whoItsFor: [
            'People prone to recurrent UTIs looking for a daily preventive supplement, particularly for the cranberry-PAC component',
            'Not a treatment for an active, symptomatic UTI: this is prevention, not treatment',
            'Worth knowing: the D-mannose component has weaker trial support than the cranberry component',
        ],
        howToUse: {
            intro: 'Per Winx Health\'s own instructions:',
            steps: [
                'Take two capsules daily with water.',
                'Take consistently for preventive effect: this is not a fast-acting treatment.',
                'Stay well hydrated, which independently supports urinary tract health.',
            ],
            sourceUrl: 'https://hellowinx.com/products/uti-daily-protection-supplement',
            sourceLabel: 'hellowinx.com: Urinary Daily Defense',
        },
        warnings: [
            'Not a treatment for an active UTI: seek care for burning, urgency, fever, or back pain.',
            'D-mannose is a sugar; people managing diabetes or blood sugar should factor that in.',
            'High-dose vitamin C can raise kidney stone risk in people already predisposed: check with a clinician if you have a stone history.',
        ],
        communityReview: 'Community sentiment on cranberry/D-mannose UTI-prevention supplements broadly (Reddit r/UTI) is mixed and often anecdotal, split between people who feel real preventive benefit and people, often those with more complex recurrent-UTI histories, who don\'t notice a difference: consistent with the split clinical evidence between the two headline ingredients.',
        ingredients: 'Cranberry extract (proanthocyanidins), D-mannose, turmeric, vitamin C.',
        effectiveness: 'Cranberry PAC component has real, moderate-certainty supporting evidence; D-mannose component\'s evidence has weakened in more recent, larger trials. No independent trial of this exact combined formulation was found.',
        scientificCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', text: 'Cochrane: Cranberries for preventing urinary tract infections', summary: '2023 update, 50 studies / ~8,857 participants: cranberry products reduced UTI risk (RR 0.70) in women with recurrent UTIs, children, and people with UTI susceptibility from an intervention; moderate-certainty evidence.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41004704/', text: 'PubMed: Efficacy of D-mannose as prophylaxis of recurrent urinary tract infection, systematic review and meta-analysis of RCTs', summary: '6 RCTs, 1,167 participants: D-mannose was not associated with a significant reduction in recurrent UTI risk compared with control.' },
        ],
        integrations: [],
        badges: [],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/UTI/search/?q=d-mannose%20OR%20cranberry%20winx', text: 'Reddit r/UTI: D-mannose/cranberry/Winx search', summary: 'User discussion of daily UTI-prevention supplements.' },
                { platform: 'instagram', url: 'https://www.instagram.com/hellowinx/', text: 'Winx Health on Instagram', summary: 'Brand content and community posts.' },
            ] },
        },
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
        // Ayna affiliate link, affiliateUrl wins over `url` for the Buy Now /
        // Visit Site destination (see getBuyUrl in ProductModal.jsx). Verified
        // 2026-09-08: the site's real path is singular "/product/", not the
        // "/products/" path from the affiliate program's own link table.
        affiliateUrl: 'https://helloneycher.com/product/vaginal-moisturizer?sca_ref=12276038.vwBYOKCYa7&utm_source=affiliate&utm_medium=socialmedia&utm_campaign=affiliate',
        faqUrl: 'https://www.helloneycher.com/faq',
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/686eb5fcdbbd35b6fc957602_Frame%201000011567.jpg',
        summary: 'A hormone-free vaginal suppository that pairs hyaluronic acid with a bioadhesive gel to moisturize from the inside, holding moisture at the vaginal wall for days rather than hours. Positioned for the dryness, irritation, and pain during sex common in perimenopause, menopause, postpartum, and after cancer treatment or a hysterectomy.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            // Full packaging ingredient list lives here (not truncated, see
            // buildFactRows in ProductModal.jsx) so it shows in full under
            // "Materials" on the Evidence view, instead of the leftover-space
            // ingredient science paragraphs below.
            materials: '10 suppositories per box, 2 g each. Ingredients (from the box): hyaluronic acid (sodium hyaluronate, 10 mg per suppository), polycarbophil, glycyrrhetinic acid (from licorice root), vitamin E (tocopheryl acetate), vitamin A (retinyl palmitate), tea tree oil, phosphatidylcholine, and lactic acid, in a caprylic/capric triglyceride base.',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation or burning. One ingredient, polycarbophil, can cause a white, clumpy discharge as old tissue sheds: that looks like a yeast infection but isn\'t one, and it usually lessens with regular use. Full warnings are listed below.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher states its formulas are developed with input from "scientists, doctors, and researchers" and are "OB/GYN and real people-approved," per the brand\'s own site.\n\nNeycher also cites its own clinical evaluation: 20 women (ages 29-74) with vulvovaginal symptoms used the product for about a month, assessed with the Vulvovaginal Symptoms Questionnaire (VSQ): a real, peer-reviewed tool (Erekson et al., Menopause, 2013): analyzed by paired t-test (brand-reported as p<0.001 on every measure).\n\nResults: mean VSQ symptom score dropped from 9.22 to 0.61 (p<0.001), with complete symptom remission in 65% of participants and a greater than 50% reduction in discomfort in 89%, with improvement reported after just one week. No adverse events were recorded.\n\nNeycher\'s own site doesn\'t publish this study as a standalone paper: the closest verifiable public source is Gruppo FarmaImpresa (the manufacturer named on Neycher\'s own technical documentation, doc ref FT.CE.110), whose hyaluronic acid + polycarbophil + lactic acid ovule (the same formulation profile as this product) matches this exact study design and these exact numbers on their own site. This is the manufacturer\'s own published summary of its clinical evaluation, not an independently peer-reviewed journal article; the VSQ instrument it used is real and independently validated.',
        // Shorter, results-first version for the Evidence view's rail card
        // (ProductEvidenceRail.jsx), which has much less horizontal room
        // than the ayna-summary tab's full-width Clinician opinion card,
        // that one keeps the full walkthrough above.
        doctorOpinionShort: 'Neycher cites its own 20-woman clinical evaluation: mean VSQ symptom score dropped from 9.22 to 0.61 (p<0.001), with complete symptom remission in 65% of participants and improvement reported within one week. No adverse events were recorded. This is the manufacturer\'s own funded evaluation, not an independently peer-reviewed study.',
        // Kept separate from verificationLinks.scientific/doctor on purpose,
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
        // "Application" section on Neycher's own live product page.
        howToUse: {
            intro: 'Lie down and insert one suppository into the vagina. Stay lying down for about 30 minutes so it absorbs fully, which makes bedtime the easiest time to use it.',
            steps: [
                'For the first 10 nights, use one each night.',
                'After that, every 3 to 5 nights is enough for most, or adjust to your comfort and your doctor\'s guidance.',
                'Don\'t use it more than 30 days in a row. Some customers cut a suppository in half.',
                'Don\'t use it during your period. A thin pad can help with any discharge.',
            ],
            sourceUrl: 'https://helloneycher.com/products/vaginal-moisturizer?Title=Default',
            sourceLabel: 'helloneycher.com: Vaginal Moisturizer: Application',
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
        // Plain-text ingredient summary, kept as a string since search
        // indexing (naturalLanguageSearch.js), the interaction checker
        // (interactions.js), DoctorPrep.jsx, and the Ask Ayna context
        // builder (productHowToUse.js) all read this field as a string.
        // Changing its shape would break all four.
        ingredients: 'Hyaluronic acid (10 mg), polycarbophil, glycyrrhetinic acid (from licorice root), lactic acid, vitamins E and A, tea tree oil.',
        // Per-ingredient science claims, each paired with its own credible
        // source (NIH-hosted: PMC/PubMed or an NIH institute's own fact
        // sheet), not the plain-string `ingredients` above, so this can
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
                text: 'A bioadhesive gel that sticks to the vaginal wall and holds water against it for days, so the effect lasts much longer than a lubricant. It also helps the tissue renew, as it does, old, dry cells that have built up come away, so some women notice a white, clumpy discharge that looks like a yeast infection. It isn\'t one; it\'s the old cells leaving, and it usually lessens with regular use.',
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
                text: 'The same acid healthy vaginal bacteria produce. It keeps pH in its natural acidic range (about 3.8 on average in the cited study).',
                citations: [
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6332693/', label: 'NIH (PMC): Vaginal pH measured in vivo, lactobacilli determine pH and lactic acid concentration' },
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
                text: 'Used in a small, carefully chosen amount, pure tea tree oil at high concentrations can irritate, but here it sits inside a formula built to hydrate and calm (hyaluronic acid, polycarbophil, glycyrrhetinic acid, vitamin E), not as a stand-alone antiseptic.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH NCCIH: Tea Tree Oil, Usefulness and Safety' },
                ],
            },
        ],
        // Category-level citations shown only on the Scientific literature
        // tab (merged there with the per-ingredient citations above), kept
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
            scientific: { links: [] },
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
                        summary: 'Visible feedback centers on noticeably improved day-to-day comfort after adding it to a routine. A specific rating/review count wasn\'t independently verifiable at time of writing, Amazon blocks automated access.',
                    },
                    {
                        platform: 'website',
                        url: 'https://helloneycher.com/products/vaginal-moisturizer?Title=Default',
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
        whereToBuy: ['helloneycher.com', 'Amazon'],
        url: 'https://www.helloneycher.com/product/odor-be-gone',
        // Ayna affiliate link, affiliateUrl wins over `url` for the Buy Now /
        // Visit Site destination (see getBuyUrl in ProductModal.jsx). Verified
        // 2026-09-08: the site's real path is singular "/product/", not the
        // "/products/" path from the affiliate program's own link table.
        // Note: this product showed "Notify when available" (out of stock) at
        // verification time; the affiliate link still resolves to the real page.
        affiliateUrl: 'https://helloneycher.com/product/odor-be-gone?sca_ref=12276038.vwBYOKCYa7&utm_source=affiliate&utm_medium=socialmedia&utm_campaign=affiliate',
        faqUrl: 'https://www.helloneycher.com/faq',
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/6a0b3e76d248803f468a5c1e_Frame%201000011416%20(1).webp',
        summary: 'Vaginal odor, unusual discharge, and irritation often mean the vagina\'s pH has shifted, letting BV or yeast overgrow. This boric acid suppository (10 count, 2 g each) uses half the usual dose, paired with hyaluronic acid, lactic acid, and calming plant extracts, so it works without the dryness and burning pure boric acid products are known for.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            // Full packaging ingredient list, shown in full under
            // "Materials" on the Evidence view (see buildFactRows in
            // ProductModal.jsx, which doesn't truncate this field).
            materials: '10 suppositories per box, 2 g each. Ingredients (from the box): boric acid (300 mg), hyaluronic acid (20 mg), lactic acid, tea tree oil, vitamin E, glycyrrhetinic acid (from licorice root), and chlorhexidine (stabilizer), in a semi-synthetic triglyceride base.',
            recalls: 'No recalls found.',
            sideEffects: 'Boric acid suppositories are for vaginal use only and are toxic if swallowed: keep away from children. Discontinue and see a doctor if you notice irritation, or if symptoms don\'t improve, keep coming back, or come with fever, pain, or bleeding. Full warnings are listed below.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher states this formula "helps decrease your pH, preventing the formation of bacteria and yeast overgrowth," per the brand\'s own site. Boric acid is a recognized, commonly used option for recurrent vaginal odor and BV/yeast-related complaints generally: talk to a clinician before starting it. No clinical trial or study specific to this product was found on the brand\'s site.',
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
            intro: 'With clean, dry hands, peel open the blister and insert one suppository into the vagina with your fingers, preferably at bedtime: no applicator needed.',
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
        communityReview: 'Neycher.com and Amazon both carry customer reviews for this product; a specific rating/review count wasn\'t independently verifiable at time of writing: Amazon blocks automated access.',
        effectiveness: 'Used nightly for about ten nights, it\'s meant to bring odor and discharge back under control gently rather than all at once.',
        // Plain-text summary, kept as a string since search indexing,
        // the interaction checker, and DoctorPrep.jsx all read this as text.
        ingredients: 'Boric acid (300 mg), hyaluronic acid (20 mg), lactic acid, tea tree oil, vitamin E, glycyrrhetinic acid (from licorice root), chlorhexidine.',
        // Per-ingredient science claims, each paired with a credible source
        // (NIH-hosted or ACOG). Rendered on the Scientific literature tab.
        ingredientScience: [
            {
                name: 'Boric acid (300 mg)',
                text: 'A mild acid that brings pH back down to its natural range. Half the usual dose, to avoid the burning and dryness pure boric acid products cause.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/21774671/', label: 'NIH: Boric acid for recurrent vulvovaginal candidiasis, the clinical evidence (Iavazzo et al., 2011)' },
                ],
            },
            {
                name: 'Lactic acid',
                text: 'The same acid healthy lactobacilli produce. It helps restore the acidic environment they need to take over again.',
                citations: [
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6332693/', label: 'NIH (PMC): Vaginal pH measured in vivo, lactobacilli determine pH and lactic acid concentration' },
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
                text: 'Used in a small, carefully chosen amount, pure tea tree oil at high concentrations can irritate, but here it sits inside a formula built to hydrate and calm.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH NCCIH: Tea Tree Oil, Usefulness and Safety' },
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
                        // summary of actual review text, just confirms this
                        // is the real, current product listing. Read the
                        // reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
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
        url: 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel',
        // Ayna affiliate link, affiliateUrl wins over `url` for the Buy Now /
        // Visit Site destination (see getBuyUrl in ProductModal.jsx). Verified
        // 2026-09-08: the site's real path is singular "/product/", not the
        // "/products/" path from the affiliate program's own link table.
        affiliateUrl: 'https://helloneycher.com/product/hydrobloom-moisturizing-gel?sca_ref=12276038.vwBYOKCYa7&utm_source=affiliate&utm_medium=socialmedia&utm_campaign=affiliate',
        faqUrl: 'https://www.helloneycher.com/faq',
        image: 'https://cdn.prod.website-files.com/66dc3b9581bf97e670861652/69b007753e5c0c33308cc349_hand.webp',
        summary: 'Vulvar dryness and irritation are common from hormonal changes, friction, or harsh soaps. This hormone-free, pH-balanced gel pairs hyaluronic acid and glycerin to hydrate outside on the vulva and inside the vagina, non-sticky and fast-absorbing.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            materials: '30 ml tube with applicator. Ingredients (from the box): water, glycerin, aloe leaf juice, black currant fruit extract, lavender flower water, hyaluronic acid (sodium hyaluronate), chamomile flower extract, calendula flower extract, lactic acid, vitamin E (tocopheryl acetate), linseed oil, vitamin A (retinyl palmitate), in a hydroxyethylcellulose gel base, with preservatives (imidazolidinyl urea, potassium sorbate, disodium EDTA) and solubilizers (PEG-40 hydrogenated castor oil, polysorbate 20).',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation or an allergic reaction. Contains chamomile and calendula: if you have a daisy-family allergy (such as ragweed), test on a small area first. Full warnings are listed below.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease". Standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher states the formula "creates a protective hydrating layer that supports long-lasting moisture and comfort," per the brand\'s own site. No clinical trial or study specific to this gel was found on the brand\'s site.',
        // Shorter version for the Evidence view's narrower rail card, see
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
            'Not for odor, unusual discharge, or itching inside the vagina: that can signal an infection; Neycher\'s Odor Be Gone is for that instead.',
            'After giving birth: outside only on healed skin; inside only once a doctor clears it.',
            'Daisy-family allergy (such as ragweed): test on a small area first: contains chamomile and calendula.',
            'Irritation or an allergic reaction: stop using it.',
        ],
        communityReview: 'Neycher.com and Amazon both carry customer reviews for this gel; a specific rating/review count wasn\'t independently verifiable at time of writing.',
        effectiveness: 'No clinical trial specific to this gel was found on the brand\'s site.',
        // Plain-text summary, kept as a string since search indexing,
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
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6332693/', label: 'NIH (PMC): Vaginal pH measured in vivo, lactobacilli determine pH and lactic acid concentration' },
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
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13466918/', label: 'NIH (PMC): Pharmacological properties of lavender essential oil, background on the active compound family, not a hydrosol-specific study' },
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
                text: 'ACOG: Disorders of the Vulva, Common Causes of Vulvar Pain, Burning, and Itching',
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
                        // summary of actual review text, just confirms
                        // this is the real, current product listing. Read
                        // the reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                ],
            },
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
        url: 'https://goodkittyco.com/products/uti-biome-shield',
        image: '',
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
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Menopause-related changes can include vaginal dryness, discomfort, and changes in sexual response. Sexual aids may be used as part of sexual wellness, but this device should not be presented as a treatment for genitourinary syndrome of menopause or other medical conditions.',
        communityReview: 'Named a 2026 Oprah Daily Menopause O-Ward Winner; featured in Wellness Magazine, Oprah Daily, The Pause Life, and Flow Space.',
        effectiveness: 'Vibrator use has limited category-level evidence related to sexual function and genitourinary health. No independent clinical study of the Oboo Woosh itself was identified here.',
        verificationLinks: {
            doctor: { links: [
                { url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health', text: 'ACOG: Vulvovaginal Health', summary: 'ACOG describes menopause-related vaginal dryness and genitourinary changes and discusses evidence-based options for symptom management.' },
                { url: 'https://www.acog.org/womens-health/faqs/your-sexual-health', text: 'ACOG: Your Sexual Health', summary: 'ACOG includes sex toys among options people may try for sexual stimulation while distinguishing sexual wellness from medical treatment.' }
            ] },
            scientific: { links: [
                { url: 'https://pubmed.ncbi.nlm.nih.gov/38668760/', text: 'Vibrator Use and Women\'s Pelvic Health: Prospective Pilot Study', summary: 'A small prospective pilot found associations between regular vibrator use and improvements in several sexual and genitourinary outcomes. This is category-level evidence and does not validate the Oboo Woosh specifically.', justification: 'Peer-reviewed PubMed-indexed prospective pilot study; limited category-level evidence.' }
            ] }
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    // The rest of Oboo's real, standalone (non-bundle) catalog, Ayna previously
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
        summary: 'Uses sonic stimulation rather than direct buzz for a gentler sensation, marketed for women whose bodies feel more sensitive or different than before, an easier, softer starting point.',
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
        summary: 'A slim, dual-stimulation massager with subtle, adjustable sensations, marketed for easing back into intimacy gradually, including for people new to toys.',
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
        summary: 'A dual-ended wand with two motors, one in the rounded external head, one in the curved internal tail, plus an optional warming feature for added comfort and blood flow.',
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
        summary: 'A mist the brand describes as made with organic herbs and essential oils, marketed for quick cooling relief and mood support during a hot flash, shake, spray, and go.',
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
        tags: ['pelvic-floor', 'leaks', 'discomfort', 'postpartum', 'fitness', 'prolapse'],
        price: '$30/month or $180/year (14-day free trial; HSA/FSA eligible)',
        userRating: 4.9,
        whereToBuy: [], platform: 'Web, app, Roku, Amazon Fire TV, Apple TV',
// membership site + app; affiliateUrl below covers it
        url: 'https://connectpelvicfloorfitness.com/',
        // Ayna affiliate partnership, affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://goto.connectpelvicfloorfitness.com/YVk7WO',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/b1/39/0f/b1390fbf-2c51-b7ff-af3b-b9a7660f4b9c/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg',
        summary: 'A pelvic-floor-informed fitness program founded by Caroline Packard, DPT, after her own postpartum stress incontinence and prolapse. Combines pelvic floor rehab principles with real strength training, HIIT, yoga, and mobility work to build pelvic floor and whole-body strength.',
        ingredients: 'Not a physical product: see "How it works" below for what the membership includes.',
        safety: {
            fdaStatus: 'Fitness and education service; not a medical device.',
            materials: 'N/A',
            recalls: 'N/A',
            sideEffects: 'Exercise programs may not be appropriate for every pelvic floor condition. Stop if exercises cause pain or worsen symptoms and consult a pelvic floor physical therapist or clinician when needed. Diastasis recti evidence for exercise alone is limited (see Clinician opinion below): anyone with a significant abdominal separation should be evaluated by a clinician before relying on exercise as a sole treatment.',
            opinionAlerts: 'Program information is based on the brand\'s own description; individual results depend on the specific condition, adherence, and guidance from a clinician when needed.'
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Program is designed by Caroline Packard, DPT, a pelvic floor physical therapist with 15+ years of clinical experience. Description sourced from Connect Pelvic Floor Fitness; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'This program\'s core approach (pelvic floor muscle training (PFMT)) has real, strong independent evidence behind it for two of the conditions it targets. A Cochrane systematic review of 31 trials in 1,817 women found PFMT can cure or improve stress and other types of urinary incontinence, and is recommended as part of first-line conservative management. A separate systematic review and meta-analysis of 13 trials in 2,340 women found PFMT produced greater subjective and objective improvement in pelvic organ prolapse symptoms and stage compared to controls.\n\nEvidence for exercise specifically correcting diastasis recti (abdominal separation) is more limited. A recent systematic review and meta-analysis found no clear evidence that exercise-based interventions alone reduce inter-recti distance in postpartum women, though exercise may still provide functional or symptomatic benefit even without measurably closing the gap.\n\nThese citations are for pelvic floor muscle training and postpartum exercise generally: no independent study of this specific program\'s protocol was found.',
        doctorOpinionShort: 'Pelvic floor muscle training (the program\'s core approach) has strong independent evidence for improving urinary incontinence and pelvic organ prolapse symptoms specifically. Evidence for exercise alone correcting diastasis recti is more limited. No independent study of this specific program\'s protocol was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/25408383/', label: 'PubMed: Pelvic floor muscle training for urinary incontinence in women, a Cochrane systematic review' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/26407564/', label: 'PubMed: The efficacy of pelvic floor muscle training for pelvic organ prolapse, a systematic review and meta-analysis' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Postpartum women dealing with leakage, prolapse symptoms, or diastasis recti',
            'Women who want strength training that\'s built around pelvic floor function rather than around it',
            'Anyone told their only options were "live with it" or surgery, who wants to try a structured conservative program first',
            'Women wanting DPT-designed programming without needing to attend in-person physical therapy',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // connectpelvicfloorfitness.com/membership and /faqs.
        howToUse: {
            intro: 'Per Connect\'s own site: start with a 14-day free trial, then continue on a monthly or annual membership.',
            steps: [
                'Access a growing library of strength training, HIIT, advanced core, yoga, and mobility workouts, each 35–45 minutes and fully guided, with instruction on form, breathing, and modifications.',
                'Use built-in self-assessments throughout to track progress and guide what to do next.',
                'Join monthly live Q&A sessions with Caroline Packard, DPT.',
                'Get access to a private members-only community and pelvic floor educational resources.',
                'Stream on the website, the iOS/Android app, or Roku, Amazon Fire TV, and Apple TV.',
                'HSA/FSA eligible through Connect\'s partner Flex, per the brand\'s site.',
            ],
            sourceUrl: 'https://connectpelvicfloorfitness.com/membership',
            sourceLabel: 'connectpelvicfloorfitness.com: Membership',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not a substitute for an in-person pelvic floor physical therapy evaluation, especially for significant prolapse, diastasis recti, or persistent leakage.',
            'Stop any exercise that causes pain or worsens symptoms and consult a pelvic floor physical therapist or clinician.',
            'Cancel at least 24 hours before renewal to avoid being charged for the next billing period, per the brand\'s site.',
        ],
        communityReview: 'Reviews on Connect\'s own site and app store listings include: "How Caroline explains things and how this app is set up is 100 out of 10," and "I wholeheartedly recommend this program to anyone who has been told to live with symptoms or that surgery is the only option. It has transformed my approach to fitness and my overall well-being." No independently verifiable aggregate star rating was found on the Apple App Store at time of writing.',
        effectiveness: 'Built on pelvic floor muscle training, which has strong independent evidence for improving urinary incontinence and pelvic organ prolapse; evidence for exercise alone correcting diastasis recti is more limited. Individual results vary, and no independent study of this specific program was found.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/25408383/',
                text: 'PubMed: Pelvic floor muscle training for urinary incontinence in women, a Cochrane systematic review',
                summary: '21 trials, 1,281 women. Found PFMT is associated with cure or improvement of stress and other types of urinary incontinence, general evidence for the training approach, not this specific program.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/26407564/',
                text: 'PubMed: The efficacy of pelvic floor muscle training for pelvic organ prolapse, a systematic review and meta-analysis',
                summary: '13 trials, 2,340 women. Found PFMT improved both subjective prolapse symptoms and objective prolapse severity versus controls.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/41995773/',
                text: 'PubMed: What is the evidence for abdominal and pelvic floor muscle training to treat diastasis recti abdominis postpartum?, an updated systematic review and meta-analysis',
                summary: 'Found no clear evidence that exercise-based interventions alone reduce inter-recti distance, though exercise may still help function/symptoms. Included for balance, this is a more cautious finding than the incontinence/prolapse evidence above.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://connectpelvicfloorfitness.com/faqs',
                        text: 'connectpelvicfloorfitness.com: FAQs',
                        summary: 'Connect\'s own FAQ page, covering membership details, cancellation, and program logistics.',
                    },
                    {
                        platform: 'website',
                        url: 'https://apps.apple.com/us/app/connect-pelvic-floor-fitness/id6475697994',
                        text: 'Apple App Store: Connect Pelvic Floor Fitness',
                        summary: 'Real, current App Store listing. Review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://play.google.com/store/apps/details?id=com.VidApp.ConnectPelvicFloor',
                        text: 'Google Play: Connect Pelvic Floor Fitness',
                        summary: 'Real, current Google Play listing. Review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                ],
            },
        },
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
        // Ayna affiliate partnership, affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://go.shopmy.us/p-83948920',
        image: 'https://www.vio2tape.com/cdn/shop/files/vio2tape-health-beauty-1-pack-try-it-vio2-unscented-mouth-tape-33555330531505_1024x874.png?v=1781819129',
        summary: 'A patented, partial-coverage mouth tape designed by dentist Dr. Vincent Ip and his wife Lindsey Ip after their young son was diagnosed with a breathing disorder and open-mouth posture. Meant to encourage a gentle lip seal during sleep while still allowing natural airflow: intended to support nasal breathing and reduce snoring.',
        safety: {
            fdaStatus: 'Personal-care product; not an FDA-cleared medical device.',
            materials: 'Breathable cotton-and-spandex blend fabric with hypoallergenic medical-grade adhesive, in a patented I-shaped, partial-coverage design (U.S. Design Patent No. D1,047,152). Free from latex, PFAS, and gluten. Unscented. Made in USA.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states this is not intended for children under 6, or for anyone with a breathing disorder, heart condition, nasal congestion, risk of vomiting, who has used alcohol or sedatives, or who is unable to remove the tape themselves. Single-use; discard after each application. Independent sleep and ENT specialists separately caution that mouth taping in general is not recommended for anyone with untreated or undiagnosed sleep apnea, significant nasal obstruction, GERD, or a heart or lung condition (including asthma), since forcing the mouth closed can worsen airway resistance if nasal breathing is already blocked.',
            opinionAlerts: 'Brand markets this as "the only mouth tape on the market designed, created & approved by a doctor" and "the #1 recommended mouth tape by medical professionals": brand claims, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from VIO2\'s own site; Dr. Vincent Ip, DDS, is a real, practicing dentist in Austin, TX, but no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'Independent research on mouth taping generally is real but still limited and mixed. A 2024 scoping review found only 9 studies (4 randomized controlled trials) on the topic, described the evidence as markedly heterogeneous, and noted many of the touted benefits aren\'t grounded in the literature. A separate preliminary study specifically in mouth-breathers with mild obstructive sleep apnea found mouth-taping roughly halved measures of apnea severity (AHI) and snoring: a real, positive finding, but from a small, preliminary study, and not a test of this specific product.\n\nSeparately, several sleep and ENT specialists have publicly cautioned against mouth taping for people with untreated sleep apnea or nasal obstruction, since it doesn\'t address the underlying airway issue and could worsen it. No independent clinical study of this specific product was found.',
        doctorOpinionShort: 'Independent research on mouth taping is real but limited: a 2024 scoping review found the evidence heterogeneous and many claimed benefits not literature-backed, while a small preliminary study in mild OSA mouth-breathers found roughly a 50% reduction in apnea severity. Sleep and ENT specialists caution against it for anyone with untreated sleep apnea or nasal obstruction. No independent study of this specific product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/39662104/', label: 'PubMed: Nocturnal mouth-taping and social media, a scoping review of the evidence' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/36141367/', label: 'PubMed: The Impact of Mouth-Taping in Mouth-Breathers with Mild Obstructive Sleep Apnea, a preliminary study' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Adults who want to try partial-coverage mouth taping as a gentler alternative to full-seal tape',
            'People with mild, occasional mouth-breathing or snoring who have no diagnosed sleep apnea or nasal obstruction',
            'Anyone curious about mouth taping who wants an easy-to-remove, emergency-breathable design over a full seal',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // vio2tape.com/products/vio2-unscented-mouth-tape.
        howToUse: {
            intro: 'Per VIO2\'s own site: remove one strip from the backing paper and apply nightly.',
            steps: [
                'Choose your preferred orientation: the patented design can be worn two ways.',
                'Close your mouth, apply the tape over the lips, and press gently to secure.',
                'Leave on overnight; the partial-coverage shape leaves room for natural lip movement and emergency mouth breathing if needed.',
                'Remove and discard in the morning: single-use, one strip per night.',
            ],
            sourceUrl: 'https://www.vio2tape.com/products/vio2-unscented-mouth-tape',
            sourceLabel: 'vio2tape.com: Partial-Coverage Mouth Tape',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not for anyone with untreated or undiagnosed sleep apnea, significant nasal obstruction, GERD, or a heart or lung condition (including asthma): get evaluated by a doctor first.',
            'Not intended for children under 6, or for anyone who has used alcohol or sedatives, or who is unable to remove the tape themselves.',
            'Single-use: discard after each night.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'Customer reviews across retailers describe the tape as staying securely in place overnight while remaining comfortable, with the flexible two-way design and adhesive that holds well but removes easily in the morning cited as pluses; some reviews mention removal can feel sticky or mildly uncomfortable. No independently verified aggregate star rating was found at time of writing.',
        effectiveness: 'Positioned as a gentler, partial-coverage alternative to full-seal mouth tape. Independent research on mouth taping generally is limited but shows some promise specifically for mild OSA mouth-breathers; evidence for snorers without diagnosed sleep apnea is less clear, and no independent clinical study of this specific product was found.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/39662104/',
                text: 'PubMed: Nocturnal mouth-taping and social media, a scoping review of the evidence',
                summary: 'Found only 9 studies (4 RCTs) on mouth taping as of 2024; called the evidence markedly heterogeneous and noted many popular claims aren\'t literature-backed.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/36141367/',
                text: 'PubMed: The Impact of Mouth-Taping in Mouth-Breathers with Mild Obstructive Sleep Apnea, a preliminary study',
                summary: 'Found mouth-taping roughly halved apnea-severity (AHI) and snoring measures in mouth-breathers with mild OSA, a real but small, preliminary finding.',
            },
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7153879/',
                text: 'NIH (PMC): The effect of nasal and oral breathing on airway collapsibility in obstructive sleep apnea, computational fluid dynamics analyses',
                summary: 'Mechanistic evidence that oral breathing is associated with greater airway collapsibility than nasal breathing, general physiology, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'tiktok',
                        url: 'https://www.tiktok.com/discover/vio2-mouth-tape-review',
                        text: 'TikTok: VIO2 mouth tape reviews',
                        summary: 'Real, current TikTok discover page aggregating VIO2 mouth tape review content. Individual video claims are user-generated and not independently verified here.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.ulta.com/p/unscented-partial-coverage-mouth-tape-mkt77007521?sku=77011678',
                        text: 'Ulta Beauty: VIO2 Unscented Partial-Coverage Mouth Tape',
                        summary: 'Real, current retail listing. Review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.vio2tape.com/products/vio2-partial-coverage-mouth-tape-for-sleep-unscented?variant=40800110837937&utm_source=ShopMy&utm_medium=affiliate&utm_campaign=Puloma%20Bishnu&utm_content=Quick%20Link&utm_referrer=shopmy.us&smsclickid=fd2d10e7-a850-4203-9d74-4bcb9c91f6bd&utm_term=fd2d10e7-a850-4203-9d74-4bcb9c91f6bd',
                        text: 'vio2tape.com: Customer reviews',
                        summary: 'VIO2\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
    // Proov brand partnership (2026-09-07), 5 real, priced catalog entries
    // pulled from proovtest.com's own product pages, each with its own Ayna
    // affiliate link (proov.pxf.io). This replaces the old single generic
    // "Proov" entry that lived in startups.js with an outdated affiliate URL
    // and a single stock photo, see startups.js for the removal note.
    {
        id: 'p-proov-complete',
        name: 'Proov Complete Fertility Testing System',
        brand: 'Proov',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['fertility'],
        tags: ['fertility', 'irregular'],
        price: '$99.99',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://proovtest.com/products/complete-testing-system',
        // Ayna affiliate partnership, affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://proov.pxf.io/9VjJQj',
        image: 'https://proovtest.com/cdn/shop/files/Complete-PDP-HSA_FSA_3.png?v=1767377529&width=1920',
        summary: 'Proov was founded by Amy Beckley, PhD (pharmacology), after years of infertility and seven miscarriages she traced to a luteal phase defect: low progesterone after ovulation. She invented the PdG test at home to track her own hormones, founded MFB Fertility, and the resulting Proov PdG test received FDA clearance in 2020 (510(k) K191462) as the first at-home test cleared to confirm ovulation. This kit tracks FSH, E1G, LH, and PdG across a full cycle to identify up to a 6-day fertile window and confirm ovulation, rather than only predicting it.',
        safety: {
            fdaStatus: 'The core PdG (progesterone metabolite) test technology in this kit received FDA 510(k) clearance in 2020 (K191462, MFB Fertility, Inc.) as the first at-home test cleared to confirm ovulation; verify current clearance status for the full Complete kit directly on proovtest.com.',
            materials: '20 test strips (3 FSH + 17 multi-hormone) plus the Proov Insight app for automatic reading. See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself.',
            opinionAlerts: 'Brand states "women who track their whole cycle get pregnant 3x faster" than those tracking ovulation timing alone, a brand claim, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site; founder Amy Beckley, PhD, is a real pharmacologist, but no independent clinician endorsement of this specific kit has been verified by ayna.',
        doctorOpinion: 'A published pilot study of the PdG test (13 women, 34 cycles) found it could confirm ovulation using a validated urine PdG threshold, building on prior ultrasound-validated research. Proov has also published its own later study (in Obstetrics & Gynecology Research, 2022) linking sustained elevated PdG across a cycle to higher clinical pregnancy rates and lower first-trimester loss: a real, notable finding, though it\'s the brand\'s own sponsored research rather than a fully independent trial.\n\nComplete adds FSH and estrogen (E1G) tracking on top of the core PdG technology, covering ovarian reserve and the fertile window in the same kit; no independent study of the full Complete kit specifically (versus the standalone PdG test) was found.',
        doctorOpinionShort: 'The core PdG technology in this kit is FDA-cleared (2020) and has real, published, if still limited, evidence behind it, a pilot study and the brand\'s own larger follow-up study linking PdG patterns to pregnancy outcomes. No independent study of the full Complete kit (FSH + estrogen + PdG together) was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6614355/', label: 'NIH (PMC): Pilot Evaluation of a New Urine Progesterone Test to Confirm Ovulation in Women Using a Fertility Monitor' },
            { url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462', label: 'FDA: 510(k) clearance K191462, MFB Fertility, Inc. (Proov)' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women trying to conceive who want to confirm ovulation actually happened, not just predict when it might',
            'Anyone with irregular cycles or suspected luteal phase issues who wants a fuller hormone picture before a fertility clinic visit',
            'Women wanting ovarian reserve (FSH), fertile-window (E1G), and ovulation-confirmation (PdG) tracking in one kit',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // proovtest.com/products/complete-testing-system.
        howToUse: {
            intro: 'Per Proov\'s own site: test FSH early in the cycle, then track E1G and PdG through the rest of the cycle using the Proov Insight app to read results.',
            steps: [
                'Use the 3 FSH strips near the start of your cycle to check ovarian reserve.',
                'Use the multi-hormone strips to track E1G (estrogen) daily to identify your fertile window.',
                'Continue testing PdG after ovulation to confirm it actually occurred.',
                'Scan each strip with the Proov Insight app for an automatic, unbiased reading.',
            ],
            sourceUrl: 'https://proovtest.com/products/complete-testing-system',
            sourceLabel: 'proovtest.com: Complete Testing System',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'A single cycle of testing doesn\'t diagnose infertility: talk to a doctor about persistent irregular results, or if you don\'t conceive after 6–12 months of trying (standard fertility guidance).',
            'Follow the app\'s testing-window and strip-reading instructions closely; urine concentration and timing affect hormone test accuracy.',
        ],
        communityReview: 'Proov has 181 reviews on the independent platform reviews.io, averaging 4.43/5 stars (138 rated "excellent"). Feedback is mixed: many highlight the app-based reading and full-cycle hormone picture as genuinely useful, while others report frustration with test accuracy or customer service.',
        effectiveness: 'Tracks four hormones across a full cycle rather than a single ovulation-prediction hormone. The underlying PdG technology is FDA-cleared and has real published validation; the full 3-hormone Complete kit itself hasn\'t been independently studied as a unit.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6614355/',
                text: 'NIH (PMC): Pilot Evaluation of a New Urine Progesterone Test to Confirm Ovulation in Women Using a Fertility Monitor',
                summary: '13 women, 34 cycles, an early, small pilot validation of the PdG test technology at the heart of this kit.',
            },
            {
                url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462',
                text: 'FDA 510(k) K191462, MFB Fertility, Inc.',
                summary: 'The FDA clearance record for the Proov PdG test, cleared in 2020 as the first at-home test to confirm ovulation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.reviews.io/company-reviews/store/proov-test',
                        text: 'reviews.io: Proov Test reviews',
                        summary: 'Independent, third-party review platform, 181 reviews, 4.43/5 average at time of writing.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.trustpilot.com/review/proovtest.com',
                        text: 'Trustpilot: proovtest.com reviews',
                        summary: 'Real, current Trustpilot listing. Review content/aggregate rating weren\'t independently re-verified beyond the reviews.io figure above, read them directly on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/tryingtoconceive/comments/1h6ruhz/proovworth_it/',
                        text: 'Reddit r/tryingtoconceive: "Proov...worth it?"',
                        summary: 'Real, current Reddit thread discussing whether Proov is worth buying. Reddit couldn\'t be fetched directly, so individual comment content wasn\'t independently verified here, read them on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/TryingForABaby/comments/1spmq1x/proov_pdg_tests/',
                        text: 'Reddit r/TryingForABaby: "Proov PdG tests"',
                        summary: 'Real, current Reddit thread discussing Proov\'s PdG test strips, the same underlying technology used in this kit. Content wasn\'t independently verified here, read it on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/TryingForABaby/comments/1m327gy/field_report_proov_test_strips_are_not_reliable/',
                        text: 'Reddit r/TryingForABaby: "Field Report: Proov test strips are not reliable"',
                        summary: 'Real, current Reddit thread reporting reliability concerns with Proov\'s test strips. This is a genuine user complaint worth reading directly, ayna couldn\'t independently verify the specifics behind the claim.',
                    },
                    {
                        platform: 'tiktok',
                        url: 'https://www.tiktok.com/tag/proov',
                        text: 'TikTok: #proov',
                        summary: 'Real, current TikTok hashtag page aggregating Proov-related content. Individual video claims are user-generated and not independently verified here.',
                    },
                ],
            },
        },
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
        summary: 'A couples\' fertility kit pairing Proov\'s Complete testing (ovarian reserve, fertile window, ovulation confirmation) for her with an at-home motile sperm concentration test for him, plus early pregnancy tests, covering both sides of a fertility picture at once.',
        safety: {
            fdaStatus: 'Uses the same FDA-cleared PdG ovulation test as Proov Complete (510(k) K191462) plus the FDA-cleared YO Home Sperm Test for the male-fertility component; verify current clearance status for the combined kit directly on proovtest.com.',
            materials: 'Includes Complete for Her, an at-home YO sperm test for Him, and Check for Her (early pregnancy tests). See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the tests themselves.',
            opinionAlerts: 'Brand states results are "99% accurate" and that "up to 60% of fertility challenges" involve a male factor: brand claims, not independently verified here. Independent ASRM/WHO data put male factor as sole or contributing cause in roughly 40–50% of infertile couples, somewhat lower than the brand\'s figure.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'The male-fertility component of this kit uses the YO Home Sperm Test, an FDA-cleared at-home device that reads a semen sample through a phone-connected microscope to measure motile sperm concentration: the brand states 97% accuracy for the device, a manufacturer claim not independently verified here. The female-fertility component reuses Proov\'s FDA-cleared PdG ovulation-confirmation technology (see Proov Complete\'s entry for that validation).\n\nMale-factor issues are a real, commonly under-tested part of fertility: ASRM and WHO data put male factor as the sole or contributing cause in roughly 40–50% of infertile couples: somewhat lower than the brand\'s "up to 60%" figure, but still a substantial share. Testing both partners together, as this kit does, reflects real clinical guidance to evaluate male factor alongside female factor rather than only after female testing is exhausted.\n\nNo independent study of this specific combined kit was found.',
        doctorOpinionShort: 'Combines Proov\'s FDA-cleared PdG ovulation test with the FDA-cleared YO home sperm test. Real ASRM/WHO data support testing male factor early, it\'s the sole or contributing cause in roughly 40–50% of infertile couples, though the brand\'s "up to 60%" figure runs a bit higher than that commonly cited range. No independent study of the combined kit itself was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://www.asrm.org/news-and-events/asrm-news/press-releasesbulletins/half-of-infertility-cases-involve-men.-why-does-care-still-treat-it-as-a-womens-issue/', label: 'ASRM: Half of Infertility Cases Involve Men' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Couples wanting to test both partners for common fertility factors at the same time, before or instead of a first clinic visit',
            'Couples who\'ve only pursued female-side testing so far and want to rule a male-factor contribution in or out',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // proovtest.com/products/his-and-hers-fertility-starter-kit.
        howToUse: {
            intro: 'Per Proov\'s own site: she completes the Complete kit and Check tests across a cycle, he completes the YO sperm test.',
            steps: [
                'He collects a semen sample at home, ideally 2–5 days after his last ejaculation for the most reliable result.',
                'The YO device and app read motile sperm concentration from the sample.',
                'She tests FSH, E1G, and PdG across her cycle as in Proov Complete, and uses Check tests to test for pregnancy.',
                'Results for both partners are viewable in their respective apps.',
            ],
            sourceUrl: 'https://proovtest.com/products/his-and-hers-fertility-starter-kit',
            sourceLabel: 'proovtest.com: His & Hers Fertility Kit',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'At-home semen analysis has real limitations (sample collection technique, transport time to the reader) versus a lab-based semen analysis: consult a doctor for a full clinical work-up if results are abnormal or concerning.',
            'A single cycle of female hormone testing or one semen sample doesn\'t diagnose infertility on its own.',
        ],
        communityReview: 'No independently verified rating specific to this combined kit was found; see Proov\'s general reviews (181 reviews, 4.43/5 on reviews.io) for the Complete component, and the YO Home Sperm Test\'s own listings for the male-test component.',
        effectiveness: 'Combines FDA-cleared female ovulation-confirmation technology with an FDA-cleared home sperm test, reflecting real clinical guidance to evaluate both partners together; no independent study of the combined kit itself was found.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://www.asrm.org/news-and-events/asrm-news/press-releasesbulletins/half-of-infertility-cases-involve-men.-why-does-care-still-treat-it-as-a-womens-issue/',
                text: 'ASRM: Half of Infertility Cases Involve Men',
                summary: 'Real-world data on how common male-factor infertility is, general clinical context, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.reviews.io/company-reviews/store/proov-test',
                        text: 'reviews.io: Proov Test reviews',
                        summary: 'Independent, third-party review platform, 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this kit specifically).',
                    },
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/YO-Analysis-Concentration-Motility-Progressive/dp/B0DWXGG9M8',
                        text: 'Amazon: YO Home Sperm Test',
                        summary: 'Real, current Amazon listing for the sperm-test device used in this kit\'s male-fertility component. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                    {
                        platform: 'tiktok',
                        url: 'https://www.tiktok.com/tag/proov',
                        text: 'TikTok: #proov',
                        summary: 'Real, current TikTok hashtag page aggregating Proov-related content (brand-wide, not specific to this kit). Individual video claims are user-generated and not independently verified here.',
                    },
                ],
            },
        },
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
            fdaStatus: 'Uses the same FDA-cleared PdG ovulation-test technology as Proov Complete (510(k) K191462), repositioned for perimenopause tracking; verify current clearance status for this specific kit directly on proovtest.com.',
            materials: 'Non-invasive urine test strips read via the Proov Insights app. See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself.',
            opinionAlerts: 'Brand states "85% of women have hormone imbalances that cause symptoms like anxiety, weight gain, brain fog": this specific figure wasn\'t independently traceable to a clinical source and should be read as marketing language, not a verified statistic.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Empower repositions Proov\'s core hormone-strip technology (the same FSH, LH, E1G, and PdG tests used in Complete: see that entry for validation) for women 35+ navigating perimenopause, testing at four points across the cycle rather than a single day. Perimenopause hormone fluctuation is real and well documented in clinical literature (FSH and LH generally rise while estrogen and progesterone become more erratic in the years before menopause) but the brand\'s specific "85% of women have hormone imbalances" figure wasn\'t traceable to an independent source and should be read as marketing language rather than a clinical statistic.\n\nNo independent study of the Empower kit or protocol specifically was found.',
        doctorOpinionShort: 'Reuses the same FDA-cleared hormone-strip technology validated for Proov Complete, repositioned for perimenopause. The brand\'s "85% of women have hormone imbalances" statistic wasn\'t independently traceable, treat it as marketing language, not a clinical figure. No independent study of the Empower kit itself was found.',
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women 35+ noticing possible perimenopause symptoms (brain fog, anxiety, sleep disturbance, cycle changes) who want to see which hormones are actually shifting',
            'Women wanting objective, at-home hormone data to bring to a clinician conversation about perimenopause',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // proovtest.com/products/empower-perimenopause-test-kit.
        howToUse: {
            intro: 'Per Proov\'s own site: test FSH, LH, E1G, and PdG at four points across your cycle using the Proov Insights app to read results.',
            steps: [
                'Test at the four recommended cycle timepoints rather than on a single day.',
                'Scan each strip with the Proov Insights app for an automatic reading.',
                'Review your hormone pattern in the app and use it as a starting point for a clinician conversation.',
            ],
            sourceUrl: 'https://proovtest.com/products/empower-perimenopause-test-kit',
            sourceLabel: 'proovtest.com: Empower Perimenopause Test Kit',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'A home hormone-strip test doesn\'t replace a clinical perimenopause or menopause work-up: bring results to a doctor rather than self-diagnosing or self-treating.',
        ],
        communityReview: 'No independently verified rating specific to Empower was found; see Proov\'s general reviews (181 reviews, 4.43/5 on reviews.io) for feedback on the brand\'s hormone-strip technology overall.',
        effectiveness: 'Reuses FDA-cleared hormone-strip technology across four cycle timepoints; the underlying strips have real published validation for ovulation confirmation, though no independent study of the Empower kit/protocol for perimenopause specifically was found.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6614355/',
                text: 'NIH (PMC): Pilot Evaluation of a New Urine Progesterone Test to Confirm Ovulation in Women Using a Fertility Monitor',
                summary: 'Early, small pilot validation of the underlying PdG strip technology this kit reuses for perimenopause tracking.',
            },
            {
                url: 'https://www.acog.org/womens-health/faqs/the-menopause-years',
                text: 'ACOG: The Menopause Years',
                summary: 'ACOG on perimenopause hormone changes and symptoms, general clinical guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.reviews.io/company-reviews/store/proov-test',
                        text: 'reviews.io: Proov Test reviews',
                        summary: 'Independent, third-party review platform, 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this kit specifically).',
                    },
                    {
                        platform: 'tiktok',
                        url: 'https://www.tiktok.com/tag/proov',
                        text: 'TikTok: #proov',
                        summary: 'Real, current TikTok hashtag page aggregating Proov-related content (brand-wide, not specific to this kit). Individual video claims are user-generated and not independently verified here.',
                    },
                ],
            },
        },
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
            sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications, especially given the bioidentical progesterone and chasteberry content: chasteberry can interact with hormonal medications, including hormonal birth control.',
            opinionAlerts: 'No independent clinical-study claims found for this specific bundle; independent literature on transdermal progesterone specifically (see Clinician opinion) is more skeptical than the brand\'s absorption claim implies.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Proov markets the Balancing Oil\'s bioidentical progesterone as absorbed via nanoemulsion technology for topical delivery, paired with chasteberry (vitex), ashwagandha, and maca in the Pro capsules for broader hormonal and luteal-phase support.\n\nTransdermal progesterone specifically has real, documented skepticism in reproductive medicine: a review in Maturitas found insufficient evidence that topical progesterone reaches meaningful systemic levels, and identified vaginal or oral micronized progesterone (not transdermal) as the routes with proven efficacy for luteal-phase support in fertility care. That\'s a real gap between the brand\'s absorption claim and the independent literature.\n\nThe capsule ingredients have more independent support. A randomized, placebo-controlled study found chasteberry normalized luteal-phase length and progesterone synthesis in women with luteal phase defects, and a systematic review of clinical trials found supporting evidence for chasteberry across several reproductive conditions. Ashwagandha has a randomized, placebo-controlled trial showing improved estradiol/progesterone and reduced FSH/LH and stress scores, though that trial was in menopausal women, not luteal-phase support specifically, so it\'s supportive but indirect evidence here. Maca has a small pilot RCT showing a libido benefit and animal-model evidence for hormone effects, though human fertility-specific trials are limited.\n\nNo independent clinical study of this specific bundle was found.',
        doctorOpinionShort: 'Chasteberry has real RCT and systematic-review support for luteal-phase/progesterone effects; maca and ashwagandha have some supporting evidence, mostly outside a fertility-specific context. Topical progesterone specifically has real, documented skepticism in reproductive medicine, vaginal or oral routes, not transdermal, are the ones with proven efficacy for luteal support. No independent study of this bundle was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://doi.org/10.1016/j.maturitas.2014.07.009', label: 'Maturitas: Systemic progesterone therapy, oral, vaginal, injections, and even transdermal?' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/8369008/', label: 'PubMed: Vitex agnus castus extract for luteal phase defects, a randomized, placebo-controlled study' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women trying to conceive who want herbal luteal-phase and general hormone-balance support alongside (not instead of) medical care',
            'Anyone curious about chasteberry, ashwagandha, or maca specifically, given real independent research on each',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // proovtest.com/products/balance-bundle.
        howToUse: {
            intro: 'Per Proov\'s own site: use daily for a 2-month cycle.',
            steps: [
                'Apply the Balancing Oil topically as directed.',
                'Take the Pro capsules (chasteberry, ashwagandha, maca) daily.',
            ],
            sourceUrl: 'https://proovtest.com/products/balance-bundle',
            sourceLabel: 'proovtest.com: Balance Bundle',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Consult a clinician before use if pregnant, nursing, or taking medications: especially given the bioidentical progesterone content and chasteberry\'s hormonal effects.',
            'Don\'t rely on topical progesterone in place of clinician-prescribed vaginal or oral progesterone if you\'ve been told you need luteal-phase support: the independent evidence favors those routes, not transdermal.',
            'Chasteberry can interact with hormonal medications, including hormonal birth control: check with a doctor first.',
        ],
        communityReview: 'No independently verified rating specific to this bundle was found; see Proov\'s general reviews (181 reviews, 4.43/5 on reviews.io) for brand-level feedback.',
        effectiveness: 'Combines a topical progesterone product (evidence for transdermal absorption specifically is weak in independent literature) with an herbal supplement: chasteberry has the strongest independent evidence of the three herbs for luteal-phase/progesterone effects specifically. No independent clinical study of the bundle itself was found.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed) where independent research
        // exists. Rendered on the Scientific literature tab.
        ingredientScience: [
            {
                name: 'Chasteberry (Vitex agnus-castus)',
                text: 'A randomized, placebo-controlled study in women with luteal phase defects found Vitex normalized luteal-phase length and eliminated deficits in luteal progesterone synthesis. A systematic review of clinical trials found supporting evidence for Vitex across several reproductive conditions.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/8369008/', label: 'PubMed: Vitex agnus castus extract in the treatment of luteal phase defects, a randomized, placebo-controlled, double-blind study' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/23136064/', label: 'PubMed: Vitex agnus-castus extracts for female reproductive disorders, a systematic review of clinical trials' },
                ],
            },
            {
                name: 'Ashwagandha',
                text: 'A randomized, placebo-controlled trial found ashwagandha root extract improved estradiol and progesterone levels and reduced FSH, LH, and stress scores, though that trial was in menopausal women, not specifically for luteal-phase or fertility support.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12812913/', label: 'NIH (PMC): Efficacy and safety of Ashwagandha root extract for managing menopausal symptoms, a randomized, double-blind, placebo-controlled study' },
                ],
            },
            {
                name: 'Maca',
                text: 'A double-blind, randomized pilot study found a significant libido improvement with maca root. Animal studies suggest maca affects LH and reproductive hormone levels, but human fertility-specific trials are limited.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6494062/', label: 'NIH (PMC): A Double-Blind, Randomized, Pilot Dose-Finding Study of Maca Root for the Management of SSRI-Induced Sexual Dysfunction' },
                ],
            },
            {
                name: 'Bioidentical progesterone (topical)',
                text: 'Proov states this is delivered via nanoemulsion technology for topical absorption. Independent reproductive-medicine literature is skeptical of transdermal progesterone specifically, a review found insufficient evidence that it reaches meaningful systemic levels, and identifies vaginal and oral micronized progesterone, not transdermal, as the routes with proven efficacy for luteal-phase support.',
                citations: [
                    { url: 'https://doi.org/10.1016/j.maturitas.2014.07.009', label: 'Maturitas: Systemic progesterone therapy, oral, vaginal, injections, and even transdermal?' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.reviews.io/company-reviews/store/proov-test',
                        text: 'reviews.io: Proov Test reviews',
                        summary: 'Independent, third-party review platform, 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this bundle specifically).',
                    },
                    {
                        platform: 'tiktok',
                        url: 'https://www.tiktok.com/tag/proov',
                        text: 'TikTok: #proov',
                        summary: 'Real, current TikTok hashtag page aggregating Proov-related content (brand-wide, not specific to this bundle). Individual video claims are user-generated and not independently verified here.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-proov-path-to-pregnancy',
        name: 'Proov Clinical: F.A.S.T. Method, Path to Pregnancy',
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
            fdaStatus: 'Combines the FDA-cleared Proov PdG test technology (510(k) K191462) with prescription medication support issued by a licensed provider, not the kits themselves.',
            materials: '3 Proov Complete kits (hormone tests) + 3 Proov Check kits (early pregnancy tests) + clinician-reviewed protocol.',
            recalls: 'No recalls found.',
            sideEffects: 'Any medication side effects depend on what a provider prescribes (letrozole, progesterone, or metformin per the brand).',
            opinionAlerts: 'Brand states eligibility excludes anyone with a history of cancer, unexplained vaginal bleeding, liver disease, BMI over 49.9, or who is more than 10 weeks pregnant. Verify current eligibility criteria on proovtest.com.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Reviewed per the brand by Dr. Aimee Eyvazzadeh, MD, MPH, a real, practicing reproductive endocrinologist and Proov medical advisor, as part of the F.A.S.T. Method; ayna hasn\'t independently verified her direct review of individual program results.',
        doctorOpinion: 'This program is reviewed per the brand by Dr. Aimee Eyvazzadeh, MD, MPH: a real, practicing reproductive endocrinologist trained at UCLA, Harvard, and the University of Michigan, known publicly as "The Egg Whisperer," and a genuine medical advisor to Proov. That\'s a verifiable, legitimate credential, though ayna hasn\'t independently confirmed her personal, direct review of every individual program participant\'s results.\n\nThe program combines Proov\'s FDA-cleared PdG/hormone testing (see Proov Complete\'s entry for that technology\'s validation) with clinician-reviewed, capped-cost prescription support across three cycles. No independent study of program-level outcomes (pregnancy rates, time-to-conception) for this specific 3-month protocol was found.',
        doctorOpinionShort: 'Dr. Aimee Eyvazzadeh, the reviewing physician named by the brand, is a real, credentialed reproductive endocrinologist and a genuine Proov medical advisor. The underlying hormone-testing technology is FDA-cleared and independently validated; program-level outcomes for this specific 3-month protocol haven\'t been independently studied.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://eggwhisperer.com/about/', label: 'Dr. Aimee Eyvazzadeh (Egg Whisperer): credentials and background' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women wanting a lower-cost, at-home alternative to an initial fertility clinic workup, with real clinician review built in',
            'Anyone who wants monthly hormone/pregnancy testing plus a path to prescription support without starting at a full clinic',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // proovtest.com/products/path-to-pregnancy.
        howToUse: {
            intro: 'Per Proov\'s own site: complete monthly testing across 3 cycles while a reproductive endocrinologist reviews your results.',
            steps: [
                'Test each cycle with a Proov Complete kit (hormone tests) and Proov Check kit (early pregnancy tests).',
                'Results are reviewed against the F.A.S.T. Method protocol.',
                'If you qualify, get capped-cost prescription support (letrozole, progesterone, or metformin per the brand) through a licensed provider.',
                'Continue for up to 3 cycles.',
            ],
            sourceUrl: 'https://proovtest.com/products/path-to-pregnancy',
            sourceLabel: 'proovtest.com: Path to Pregnancy',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not eligible if you have a history of cancer, unexplained vaginal bleeding, liver disease, a BMI over 49.9, or are more than 10 weeks pregnant, per the brand: verify current eligibility on proovtest.com.',
            'Any prescribed medication (letrozole, progesterone, or metformin) carries its own real side-effect profile: discuss with the prescribing provider.',
            'Not a substitute for in-person fertility clinic care if you need procedures like IUI or IVF.',
        ],
        communityReview: 'No independently verified rating specific to this program was found; see Proov\'s general reviews (181 reviews, 4.43/5 on reviews.io) for brand-level feedback.',
        effectiveness: 'Bundles three months of FDA-cleared hormone/pregnancy testing with review by a real, credentialed reproductive endocrinologist and possible capped-cost prescription support; no independent study of program-level outcomes was found.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462',
                text: 'FDA 510(k) K191462, MFB Fertility, Inc.',
                summary: 'The FDA clearance record for the Proov PdG test technology used across this program\'s monthly testing.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.reviews.io/company-reviews/store/proov-test',
                        text: 'reviews.io: Proov Test reviews',
                        summary: 'Independent, third-party review platform, 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this program specifically).',
                    },
                    {
                        platform: 'tiktok',
                        url: 'https://www.tiktok.com/tag/proov',
                        text: 'TikTok: #proov',
                        summary: 'Real, current TikTok hashtag page aggregating Proov-related content (brand-wide, not specific to this program). Individual video claims are user-generated and not independently verified here.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // Elitone brand partnership (2026-09-07), per-product affiliate links
    // (each product's own URL with ?af=aynahealth appended, corrected
    // 2026-09-15 from a single shared elitone.com/?af=aynahealth link).
    // Category stays 'incontinence' (its primary shopping aisle), but per
    // Ayna's taxonomy Elitone is clinically a "pelvic floor exerciser": an
    // FDA-cleared Class II device that contracts the pelvic floor FOR the
    // user (see CATEGORY_LABELS in products.js), it's included in the
    // 'pelvic' macro group and the pelvic-floor/kegel search nudge in
    // Discovery.jsx. Elitone URGE below is deliberately NOT an "exerciser":
    // it calms an overactive bladder rather than exercising the pelvic floor.
    {
        id: 'p-elitone',
        name: 'Elitone (Stress + Mixed Incontinence)',
        brand: 'Elitone',
        category: 'incontinence',
        type: 'physical',
        internal: false,
        healthFunctions: ['bladder-leak-protection'],
        tags: ['bladder-leaks', 'incontinence', 'urinary', 'pelvic-floor', 'menopause', 'postpartum'],
        price: 'From $399',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://elitone.com/product/elitone/',
        // Ayna affiliate partnership, affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://elitone.com/product/elitone/?af=aynahealth',
        image: 'https://elitone.com/wp-content/uploads/2021/05/SUI-Hero-2-1200x1000-AVIF.avif',
        summary: 'Elitone was created by Gloria Kolb, an MIT- and Stanford-trained engineer who co-founded Elidah, Inc. after developing stress incontinence following the birth of 13-pound twins and finding the available treatments too invasive or time-consuming. Elidah, Inc. is a Connecticut-based, woman-owned medical device company that has worked with medical professionals since 2014, partly funded by National Science Foundation grants. Elitone is an external, at-home pelvic floor stimulation device for stress and mixed urinary incontinence: a gel pad worn near the pubic bone delivers gentle electrical stimulation to contract and relax pelvic floor muscles automatically, roughly 100 contractions per 20-minute session.',
        safety: {
            fdaStatus: 'FDA 510(k)-cleared in 2019 (K183585) for over-the-counter, no-prescription-needed treatment of stress and mixed urinary incontinence.',
            materials: 'Reusable GelPads (rated for 3+ uses), controller with belt clip, charging cable.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states contraindications are available on request; consult a clinician before use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, or recent pelvic surgery.',
            opinionAlerts: 'Brand cites a 3.7% return rate for non-improvement and offers a 60-day money-back guarantee, brand claims, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Founder Gloria Kolb is a real MIT/Stanford-trained engineer and co-founder/CEO of Elidah, Inc.; the clinical studies cited below were run by the company, not a fully independent research group, and no independent clinician endorsement of this device has been verified by ayna.',
        doctorOpinion: 'Two real clinical studies back this device specifically. A published, peer-reviewed pilot study (20 women with mild/moderate stress incontinence, 20-minute daily sessions for 6 weeks, no control group) found a 75% reduction in incontinence episode frequency, an 85% reduction in pad usage, and a 67% improvement in quality-of-life scores (all statistically significant). A later randomized, sham-controlled trial (48 women, 12 weeks) found leaks reduced by 52.8% in the treatment group: notably higher than the roughly 32% improvement seen in a meta-analysis of intravaginal electrical stimulation studies, though that\'s a cross-study comparison, not a head-to-head trial.\n\nThis is more independent-style clinical evidence than most products in this catalog carry (the pilot study was peer-reviewed and published, and the larger trial was sham-controlled) though both were run by the device\'s own company rather than a fully independent research group.',
        doctorOpinionShort: 'Founded by engineer Gloria Kolb after her own postpartum incontinence. FDA-cleared (2019, 510(k) K183585) for OTC use. A published pilot study (20 women) found a 75% reduction in incontinence episodes and 85% reduction in pad use; a later sham-controlled RCT (48 women) found a 52.8% reduction in leaks, real, though company-run rather than fully independent, evidence.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://doi.org/10.1097/JWH.0000000000000147', label: 'Journal of Women\'s Health Physical Therapy: Surface-Applied Electrical Muscle Stimulation for Self-Administered Treatment of Female Stress Urinary Incontinence' },
            { url: 'https://clinicaltrials.gov/study/NCT03782116', label: 'ClinicalTrials.gov: Stress Incontinence Trial With Elitone Device (NCT03782116)' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with mild-to-moderate stress or mixed urinary incontinence wanting a no-prescription, at-home option',
            'Anyone who finds doing Kegels consistently difficult, or wants the muscle contractions done for them',
            'Not for anyone pregnant, with electronic implants, epilepsy, cancer, or recent pelvic surgery without a doctor\'s clearance first',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // elitone.com/product/elitone/.
        howToUse: {
            intro: 'Per Elitone\'s own site: wear the GelPad daily for 20-minute sessions.',
            steps: [
                'Position the reusable GelPad externally, near the pubic bone: no internal insertion.',
                'Attach the controller (clips to a belt or waistband) and start a session; the device delivers roughly 100 gentle contractions over 20 minutes.',
                'Use daily: the published pilot-study protocol was 20 minutes/day for 6 weeks to see results.',
                'Each GelPad is rated for 3+ uses before replacement.',
            ],
            sourceUrl: 'https://elitone.com/product/elitone/',
            sourceLabel: 'elitone.com: Elitone',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Consult a clinician before use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, or recent pelvic surgery, per the brand.',
            'Not a substitute for a clinical incontinence work-up if leaks are severe, sudden-onset, or accompanied by pain or blood.',
            'Irritation from the adhesive pad or electrical stimulation: stop use and consult a doctor.',
        ],
        communityReview: 'The brand\'s own site and major retailers report a 4.5/5 average with thousands of reviews and under 4% returns. A small Trustpilot sample (Canada, 3 reviews) shows a lower 2.8/5: too few reviews to be a reliable independent signal, but included here for balance rather than only citing the brand\'s more favorable numbers.',
        effectiveness: 'FDA-cleared (2019, 510(k) K183585) for stress/mixed incontinence.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://doi.org/10.1097/JWH.0000000000000147',
                text: 'Journal of Women\'s Health Physical Therapy: Surface-Applied Electrical Muscle Stimulation for Self-Administered Treatment of Female Stress Urinary Incontinence',
                summary: 'Published, peer-reviewed pilot study: 20 women with mild/moderate SUI, 6 weeks. Found a 75% reduction in incontinence episodes, 85% reduction in pad use, and 67% improvement in quality of life (all P<.001). Company-run, not independently replicated.',
            },
            {
                url: 'https://clinicaltrials.gov/study/NCT03782116',
                text: 'ClinicalTrials.gov: Stress Incontinence Trial With Elitone Device',
                summary: 'Randomized, sham-controlled trial, 48 women, 12 weeks. Found a 52.8% reduction in leaks in the treatment group.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://elitone.com/reviews/',
                        text: 'elitone.com: Customer reviews',
                        summary: 'Elitone\'s own reviews page (see the Community summary above for the brand-reported vs. independent Trustpilot rating comparison).',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.trustpilot.com/review/elitone.com',
                        text: 'Trustpilot: elitone.com reviews',
                        summary: 'Real, current Trustpilot listing. Small sample size at time of writing, read the reviews directly on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/Incontinence/comments/1c6peo9/has_anyone_tried_a_elitone_external_pelvic_floor/',
                        text: 'Reddit r/Incontinence: "Has anyone tried a Elitone external pelvic floor..."',
                        summary: 'Real, current Reddit thread asking about experiences with Elitone. Reddit couldn\'t be fetched directly, so individual comment content wasn\'t independently verified here, read them on the page.',
                    },
                ],
            },
        },
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
        tags: ['bladder-leaks', 'incontinence', 'urinary', 'pelvic-floor', 'menopause', 'postpartum'],
        price: 'From $399',
        whereToBuy: [],
        url: 'https://elitone.com/product/elitone-urge/',
        affiliateUrl: 'https://elitone.com/product/elitone-urge/?af=aynahealth',
        image: 'https://elitone.com/wp-content/uploads/2023/02/UUI-Hero-071426.avif',
        summary: 'Elitone URGE uses the same hardware as the original Elitone, from the same company (Elidah, Inc., founded by engineer Gloria Kolb: see the original Elitone entry for her story and the company\'s history), but with a different waveform aimed at calming overactive bladder-muscle signals rather than strengthening pelvic floor muscles directly. It\'s an external, at-home device for overactive bladder (OAB) and urge incontinence, tuned to send calming signals that aim to reduce sudden urges, frequent bathroom trips, and urge-related leaks, without medication or a procedure.',
        safety: {
            fdaStatus: 'FDA-cleared (over-the-counter) medical device for overactive bladder / urge incontinence, per the brand; unlike the original Elitone\'s 510(k) K183585, ayna could not independently confirm this device\'s specific FDA clearance number: verify current status on elitone.com.',
            materials: 'Reusable GelPads (rated for 3+ uses), controller with belt clip, charging cable, storage case.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states do not use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, recent pelvic surgery, or urinary retention issues. In the referenced clinical trial, mild urinary tract infection was the most commonly reported issue.',
            opinionAlerts: 'Brand cites "95% of users reported reduced leaks," a 70% average leak reduction, and 85% reduction in pad use: brand-reported figures. A company-run randomized trial independently found a real, if smaller, effect: roughly a 70% reduction in leaks and improvement on all 22 points of a standard quality-of-life questionnaire (see Clinician opinion).',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Same company (Elidah, Inc.) and founder (Gloria Kolb) as the original Elitone; the clinical trial cited below was run by the company, not a fully independent research group, and no independent clinician endorsement of this device has been verified by ayna.',
        doctorOpinion: 'A randomized trial (NCT04752709) evaluating this surface-stimulation approach for urge incontinence found real results: roughly a 70% reduction in leaks, improvement across all 22 points of the standard Incontinence Quality-of-Life questionnaire, and improved bladder-voiding measures (maximum urinary flow rate and voiding efficiency). The brand separately states 76% of study participants reached a clinically significant leak reduction within 6 weeks. Safety findings were reassuring, with mild urinary tract infection as the main reported issue.\n\nAs with the original Elitone, this research was run by the device\'s own company rather than a fully independent group, and ayna could not confirm the specific FDA clearance number for the URGE device: verify current clearance status on elitone.com.',
        doctorOpinionShort: 'Same hardware and company as the original Elitone, tuned for overactive bladder. A company-run randomized trial found roughly a 70% reduction in leaks and improvement on all 22 points of a standard quality-of-life questionnaire, real, if not independently replicated, evidence. FDA-cleared per the brand; ayna could not confirm the specific clearance number for this device.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://clinicaltrials.gov/study/NCT04752709', label: 'ClinicalTrials.gov: Efficacy of Surface Electrical Stimulation for Urge Urinary Incontinence in Women (NCT04752709)' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with overactive bladder (OAB) or urge incontinence: sudden urges, frequent bathroom trips, or urge-related leaks',
            'Anyone wanting a no-prescription, at-home option to try before medication',
            'Not for anyone pregnant, with electronic implants, epilepsy, cancer, recent pelvic surgery, or urinary retention issues without a doctor\'s clearance first',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // elitone.com/product/elitone-urge/.
        howToUse: {
            intro: 'Per Elitone\'s own site: wear the GelPad daily for 20-minute sessions: same hardware as the original Elitone, tuned for urge/OAB signals.',
            steps: [
                'Position the reusable GelPad externally, near the pubic bone: no internal insertion.',
                'Attach the controller and start a session.',
                'Use daily: the referenced trial ran 6 weeks to see clinically significant results.',
            ],
            sourceUrl: 'https://elitone.com/product/elitone-urge/',
            sourceLabel: 'elitone.com: Elitone URGE',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Do not use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, recent pelvic surgery, or urinary retention issues, per the brand.',
            'Mild urinary tract infection was the most commonly reported issue in the referenced trial: see a doctor if you develop UTI symptoms.',
            'Not a substitute for a clinical work-up if urgency is sudden-onset or accompanied by pain, blood, or fever.',
        ],
        communityReview: 'The brand\'s own site and major retailers report a 4.5/5 average across both Elitone devices with thousands of reviews. See the original Elitone entry for the independent Trustpilot comparison (2.8/5, small sample): no URGE-specific independent rating was found separately.',
        effectiveness: 'FDA-cleared device for OAB/urge incontinence per the brand (specific clearance number not independently confirmed).',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://clinicaltrials.gov/study/NCT04752709',
                text: 'ClinicalTrials.gov: Efficacy of Surface Electrical Stimulation for Urge Urinary Incontinence in Women',
                summary: 'Randomized trial evaluating this surface-stimulation approach for urge incontinence. Found roughly a 70% reduction in leaks, improvement on all 22 points of the Incontinence Quality-of-Life questionnaire, and improved bladder-voiding measures. Company-run, not independently replicated.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://elitone.com/reviews/',
                        text: 'elitone.com: Customer reviews',
                        summary: 'Elitone\'s own reviews page, covering both Elitone devices.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // My Pelvic Bra brand partnership (2026-09-07), affiliate links redirect
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
        price: 'About $78',
        priceNote: 'Sold in euros and converted to US dollars (October 2026 rate); your card may show a slightly different amount.',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE',
        // Ayna affiliate partnership, affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://pelvic-bra.myshopify.com/nlbs3u',
        image: 'https://www.mypelvicbra.shop/cdn/shop/files/ClassicPelvicBra.jpg',
        summary: 'My Pelvic Bra was created by Jeanice Mitchell, PT, MPT, WCS, BCB-PMD: a pelvic floor physical therapist who developed pelvic organ prolapse after the birth of her first child and spent nearly 25 years looking for a discreet, supportive external option before designing her own, launching in May 2024. The Classic Pelvic Bra is a 4-way adjustable, everyday pelvic support garment with a compressive bikini-style fit, designed to ease sensations of heaviness, pressure, and bulging by giving gentle compressive lift to the pelvic floor and perineal tissue.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device. Brand states it is not designed to correct prolapse.',
            materials: 'Breathable, skin-friendly, high-stretch compression fabric with a creaseless gusset and sweat-wicking liner, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand recommends removing before sleep and using the minimum compression needed for symptom relief; suggests working with a pelvic floor physical therapist for personalized guidance.',
            opinionAlerts: 'Store pricing defaults to EUR; a US/USD option is available via the site\'s own country selector. Verify current pricing directly at mypelvicbra.shop.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Founder Jeanice Mitchell is a real, credentialed pelvic floor physical therapist (PT, MPT, WCS, BCB-PMD) who also founded Integrity Rehab (2001) and the myPFM nonprofit pelvic-health campaign (2018); no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'Independent research on external pelvic compression garments as a category is real but mixed. A 2026 exploratory, randomized crossover study in 13 postpartum runners with pelvic floor dysfunction found that wearing a compression garment measurably smoothed running gait, reduced pelvic shock/jerk forces, and increased perceived pelvic floor and core support while reducing fear of symptoms: real, positive, if preliminary, findings. An earlier pilot study (13 women with prolapse) found no significant improvement on validated quality-of-life questionnaires from a similar supportive underwear product, though several participants subjectively felt some relief.\n\nThese studies are about the general category of external compression garments, not this specific product: no independent clinical study of the Classic Pelvic Bra itself was found. The brand\'s own honest positioning, that it\'s not designed to correct prolapse, lines up with what this research supports: possible symptom-management, biomechanical, and confidence benefits, not a structural fix.',
        doctorOpinionShort: 'Research on external pelvic compression garments as a category is mixed: a 2026 study found real biomechanical and perceived-support benefits while running; an earlier pilot study found no significant quality-of-life improvement from a similar product. No independent study of this specific garment was found, consistent with the brand\'s own "not a prolapse treatment" framing.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41586016/', label: 'PubMed: Pelvic compression garments alter running biomechanics, perceived support, and fear of symptoms in postpartum women with pelvic floor dysfunction' },
            { url: 'https://doi.org/10.1007/s00192-008-0676-x', label: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse, a pilot study' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with pelvic heaviness, pressure, bulging, or leakage symptoms wanting discreet external support during activity',
            'Runners or anyone doing weight-bearing activity (walking, lifting) who wants added pelvic support and confidence',
            'Not a substitute for pelvic floor physical therapy or a prolapse diagnosis/treatment plan: the brand recommends working with a pelvic floor PT alongside it',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // mypelvicbra.shop/products/classic-pelvic-bra.
        howToUse: {
            intro: 'Per My Pelvic Bra\'s own site: wear during activities that stress the pelvic floor, using the 4-way adjustment to find the minimum compression needed.',
            steps: [
                'Adjust the waistband and leg straps (4-way adjustable) for a comfortable, supportive fit.',
                'Wear during walking, lifting, running, or other activities that trigger heaviness or pressure symptoms.',
                'Use the minimum compression needed for symptom relief: more isn\'t necessarily better.',
                'Remove before sleep, per the brand.',
            ],
            sourceUrl: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE',
            sourceLabel: 'mypelvicbra.shop: Classic Pelvic Bra',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not designed to correct prolapse: this is symptom-management support wear, not a structural treatment, per the brand.',
            'Remove for sleep, and use the minimum compression needed for symptom relief.',
            'Stop use and see a doctor or pelvic floor PT if the garment causes pain, numbness, or worsening symptoms.',
        ],
        communityReview: 'No independently verified customer review data was found for this product at time of writing.',
        effectiveness: 'Positioned as symptom-management support wear, not a corrective device. Research on external compression garments as a category is real but mixed (some evidence for biomechanical and perceived-support benefits, some finding no significant quality-of-life change) and no independent clinical study of this specific product was found.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/41586016/',
                text: 'PubMed: Pelvic compression garments alter running biomechanics, perceived support, and fear of symptoms in postpartum women with pelvic floor dysfunction',
                summary: '2026 exploratory, randomized crossover study, 13 postpartum runners. Found real biomechanical improvements and increased perceived pelvic floor/core support. General category evidence, not product-specific.',
            },
            {
                url: 'https://doi.org/10.1007/s00192-008-0676-x',
                text: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse, a pilot study',
                summary: '13 women with prolapse. Found no significant quality-of-life improvement on validated questionnaires, though some participants subjectively felt relief. Included for balance, a real negative finding for a similar (not identical) product.',
            },
            {
                url: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2019/11/pelvic-organ-prolapse',
                text: 'ACOG Practice Bulletin 214: Pelvic Organ Prolapse',
                summary: 'Women in the US have a 13% lifetime risk of surgery for pelvic organ prolapse, general clinical context, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.mypelvicbra.shop/collections/all/products/classic-pelvic-bra%C2%AE',
                        text: 'mypelvicbra.shop: Classic Pelvic Bra, customer reviews',
                        summary: 'The Classic Pelvic Bra\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // BUNI Body, verified against bunibody.com (2026-09-11). BUNI is an ayna
    // brand partner; affiliateUrl is the direct BUNI affiliate link
    // (?ref=oxaevspm, supplied 2026-09-29). Amazon Associates links remain as
    // a secondary retailer.
    {
        id: 'p-buni-rejuvenate-vulva-balm',
        name: 'REJUVENATE: Vulva Balm',
        brand: 'BUNI',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'menopause', 'postpartum', 'hormone-free', 'organic', 'cruelty-free', 'vegan', 'ph-neutral'],
        price: '$42',
        whereToBuy: ['BUNI Body', 'Amazon'],
        url: 'https://www.bunibody.com/products/buni-vulva-balm?ref=oxaevspm',
        affiliateUrl: 'https://www.bunibody.com/products/buni-vulva-balm?ref=oxaevspm',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/4yE7pZH',
            'BUNI Body': 'https://www.bunibody.com/products/buni-vulva-balm?ref=oxaevspm',
        },
        image: 'https://cdn.shopify.com/s/files/1/0661/0432/8271/files/buni-vulva-balm-product-page-main.webp?v=1776773714',
        summary: 'A hormone-free, pH-balanced external vulva moisturizer in an airless pump, formulated to relieve dryness, reduce friction and chafing, soothe itching and irritation, and help prevent ingrown hairs. BUNI positions it for menopause and perimenopause, pregnancy and postpartum, grooming, exercise, and comfort during intimacy.',
        ingredients: 'Per BUNI\'s own "What\'s Inside" list: organic avocado oil (deep moisture + elasticity), honey & propolis (prebiotic + antioxidant, natural healing for stressed skin), chamomile & lavender (calming + soothing, reduces irritation and redness), shea & cacao (deep conditioning + antioxidant protection, locks in moisture), hyaluronic acid (intense hydration, holds up to 1,000x its weight in water), and sea buckthorn oil (rich in linoleic acid, supports elasticity and hydration).',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the balm itself is a cosmetic / external personal-care product, not an FDA-cleared drug or medical device.',
            // Full packaging/formula description, shown in full under
            // "Materials" on the Evidence view (see buildFactRows in
            // ProductModal.jsx, which doesn't truncate this field).
            materials: 'Dispensed through an airless pump: BUNI positions this against an open-jar format, saying it protects the formula from air and repeated contact, gives clean touch-free application, and keeps dosing more consistent; the packaging is also recyclable, per BUNI. Formula is hormone-free, paraben-free, phthalate-free, dye-free, pH-balanced, and made with 99.5–100% natural ingredients, per BUNI. Per BUNI\'s own "What\'s Inside" list: organic avocado oil (deep moisture + elasticity), honey & propolis (prebiotic + antioxidant), chamomile & lavender (calming + soothing), shea & cacao (deep conditioning + antioxidant protection), hyaluronic acid (intense hydration), and sea buckthorn oil (elasticity + hydration).',
            recalls: 'No recalls found.',
            sideEffects: 'For external vulvar use only: not intended for internal vaginal use, per the brand. Discontinue and see a doctor if you notice irritation or an allergic reaction. Full warnings are listed below.',
            opinionAlerts: 'Benefit and ingredient claims are from BUNI; no independent clinical trial of the finished product was identified.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'BUNI states the product was developed by board-certified OB/GYNs and dermatologists; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions REJUVENATE as a gynecologist- and dermatologist-developed, hormone-free, pH-balanced external moisturizer for vulvar dryness, friction, chafing, itching, and ingrown hairs, and for comfort during intimacy: pure, simple, and effective, per the brand\'s own site. It\'s dispensed through an airless pump, which BUNI says protects the formula from air and repeated contact and gives more consistent, touch-free dosing than an open-jar format.\n\nSeveral of its named ingredients have real supporting research, though none of it tested this finished product. Honey and propolis have documented antibacterial, antifungal, and wound-healing properties in general skin studies, and propolis specifically has shown antifungal activity against vaginal Candida albicans in lab research. Hyaluronic acid is a well-studied humectant that draws and holds moisture in tissue. Avocado oil has shown skin-barrier-repair and wound-healing effects in review literature covering several plant oils.\n\nChamomile and lavender both have supporting evidence for BUNI\'s calming and soothing claim: a controlled study found topical chamomile extract reduced inflammation, and a rat study found lavender oil accelerated wound healing and increased collagen via TGF-β signaling. Shea and cacao butter both have supporting evidence for BUNI\'s deep-conditioning and antioxidant claim: a clinical trial found a shea-butter-based cream performed comparably to a ceramide-based product for skin barrier repair, and cocoa (cacao) polyphenols have documented, measurable antioxidant activity after topical application.\n\nSea buckthorn oil has real clinical evidence for vaginal dryness specifically: a randomized, placebo-controlled trial found daily oral sea buckthorn oil improved vaginal epithelium integrity in postmenopausal women over 3 months. That trial tested oral intake, though, not a topical balm like this one, so it doesn\'t directly validate this product\'s use.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'BUNI positions this hormone-free, pH-balanced balm for vulvar dryness, friction, itching, ingrown hairs, and comfort during intimacy. Several named ingredients (honey, propolis, hyaluronic acid, avocado oil, chamomile, lavender, shea, cacao, sea buckthorn oil) have real supporting research individually, including one placebo-controlled trial on oral sea buckthorn oil for vaginal dryness, though that tested oral intake, not a topical balm. No independent clinical study of this specific product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4359870/', label: 'NIH (PMC): Propolis Is an Efficient Fungicide and Inhibitor of Biofilm Production by Vaginal Candida albicans' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with vulvar dryness, friction, or itching from menopause or perimenopause',
            'Postpartum women, once cleared by their doctor',
            'Women dealing with irritation, ingrown hairs, or chafing from shaving, waxing, tight clothing, or exercise',
            'Women wanting more comfort during intimacy',
            'Women who want a hormone-free, external-only, pH-balanced option',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // bunibody.com/products/buni-vulva-balm.
        howToUse: {
            intro: 'Per BUNI\'s own site: apply daily for lasting hydration and comfort: morning or night, wherever it fits.',
            steps: [
                'Dispensed through an airless pump, so the product is never exposed to air or direct hand contact between uses.',
                'For external vulvar use only.',
            ],
            sourceUrl: 'https://www.bunibody.com/products/buni-vulva-balm',
            sourceLabel: 'bunibody.com: REJUVENATE Vulva Balm',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'External vulvar use only: not intended for internal vaginal use, per the brand.',
            'Pregnant or breastfeeding: check with a doctor first.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'One customer review on BUNI\'s site: "I use Rejuvenate after every spin class. No more irritation from the seat, no more dryness from tight leggings." No star rating or review count was shown alongside it, and no independent (non-brand) review data was found at time of writing.',
        effectiveness: 'Formulated by board-certified OB/GYNs and dermatologists to moisturize vulvar skin and reduce friction, chafing, and irritation; each named ingredient has real independent research behind the specific mechanism BUNI claims for it. No independent clinical study of the finished product was found.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed). Rendered on the Scientific
        // literature tab.
        ingredientScience: [
            {
                name: 'Honey and propolis',
                text: 'Honey has documented antibacterial, immune-modulating properties useful in wound care; propolis (a resin bees make from plant compounds) adds antibacterial, antifungal, and anti-inflammatory activity.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7700082/', label: 'NIH (PMC): Honey Combination Therapies for Skin and Wound Infections, a systematic review' },
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
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/25104582/', label: 'PubMed: Effects of sea buckthorn oil intake on vaginal atrophy in postmenopausal women, a randomized, double-blind, placebo-controlled study' },
                ],
            },
            {
                name: 'Chamomile & lavender',
                text: 'BUNI states these calm and soothe skin, reducing irritation and redness. Both have supporting evidence: a controlled study found topical chamomile extract reduced inflammation, and a rat study found lavender oil accelerated wound healing and increased collagen deposition via TGF-β signaling.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/6505092/', label: 'PubMed: Evaluation of antiinflammatory activity of a chamomile extract topical application' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27229681/', label: 'PubMed: Wound healing potential of lavender oil by acceleration of granulation and wound contraction through induction of TGF-β in a rat model' },
                ],
            },
            {
                name: 'Shea & cacao',
                text: 'BUNI states these give deep conditioning and antioxidant protection, and lock in moisture. A clinical trial found a shea-butter-based cream performed comparably to a ceramide-based product for skin barrier repair and hydration, and cocoa (cacao) polyphenols have documented, measurable antioxidant activity after topical application.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/26314567/', label: 'PubMed: Patient acceptability, efficacy, and skin biophysiology of a cream containing shea butter extract versus a ceramide product' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/39429210/', label: 'PubMed: Topical Antioxidant Cocoa Polyphenol Skin Penetration' },
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
                    {
                        platform: 'amazon',
                        url: 'https://amzn.to/4yE7pZH',
                        text: 'Amazon: BUNI REJUVENATE Vulva Balm reviews',
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
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
        whereToBuy: ['BUNI Body', 'Amazon'],
        url: 'https://www.bunibody.com/products/buni-nipple-balm?ref=oxaevspm',
        affiliateUrl: 'https://www.bunibody.com/products/buni-nipple-balm?ref=oxaevspm',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/4xnutuF',
            'BUNI Body': 'https://www.bunibody.com/products/buni-nipple-balm?ref=oxaevspm',
        },
        image: 'https://cdn.shopify.com/s/files/1/0661/0432/8271/files/buni-nipple-lip-balm-product-page-main_1.webp?v=1776774214',
        summary: 'A lanolin-free balm for nipples, lips, cuticles, and other dry skin, positioned for nursing and pumping comfort as well as pregnancy and postpartum care.',
        ingredients: 'Per BUNI\'s own "What\'s Inside" list: organic olive oil (deep nourishment + protection, rich in antioxidants for barrier repair), organic kokum butter (non-greasy moisture, a protective layer without clogging pores), organic beeswax (a natural sealant that locks in moisture and shields against friction), organic shea butter (intensive healing for cracked and damaged skin), organic cacao seed butter (a rich emollient that softens and conditions rough, dry patches), and organic calendula (gentle, traditional healing for delicate skin). Also contains organic avocado oil and organic tocopherol (vitamin E), per BUNI.',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the balm itself is a cosmetic / personal-care product, not an FDA-cleared drug or medical device.',
            materials: 'Lanolin-free balm, made with no animal-derived ingredients (safe for wool/lanolin sensitivities): BUNI positions this against lanolin creams, describing a smooth, buttery, hypoallergenic formula that absorbs cleanly with no residue, versus a thick, sticky wax that can stain clothing and nursing pads. Per BUNI\'s own "What\'s Inside" list: organic olive oil (deep nourishment + protection), organic kokum butter (non-greasy moisture), organic beeswax (locks in moisture, shields against friction), organic shea butter (intensive healing), organic cacao seed butter (rich emollient), and organic calendula (gentle healing). Also contains organic avocado oil and organic tocopherol (vitamin E), per BUNI.',
            recalls: 'No recalls found.',
            sideEffects: 'People with sensitivities or allergies to botanical ingredients or beeswax should review the ingredient list before use and stop if irritation develops. Full warnings are listed below.',
            opinionAlerts: 'BUNI markets the balm as suitable around nursing and states no wipe-off is needed; users should follow current label directions and their clinician or lactation professional’s guidance.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'BUNI states the balm was crafted by herbalists with organic ingredients, per the brand\'s own site; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions SOOTHE as a lanolin-free, herbalist-formulated balm for healing cracked and sore nipples, protecting against friction, and supporting deep hydration and softening: safe for baby with no wipe-off needed, and multi-use for lips, cuticles, and other dry skin, per the brand\'s own site.\n\nSeveral of its named ingredients have real supporting research. Calendula has a systematic review of animal and clinical studies behind BUNI\'s "gentle healing" claim, showing evidence for calendula extract speeding acute wound healing and reducing venous ulcer size, though the review also called for larger, better-designed trials. Beeswax has real evidence for BUNI\'s "locks in moisture" claim: a 2023 review of clinical and lab studies found it functions as an effective occlusive that reduces water loss through skin. Shea butter has real evidence for BUNI\'s "intensive healing" claim, in a clinical trial where a shea-butter-based cream performed comparably to a ceramide-based product for skin barrier repair. Olive oil and cacao seed butter both have supporting antioxidant and barrier-repair evidence in plant-oil and cocoa-polyphenol review literature. Kokum butter has documented antioxidant, anti-inflammatory, and wound-healing pharmacological activity in an independent review, though the specific moisturizing and elasticity testing available for it comes from the ingredient supplier\'s own testing rather than independent peer-reviewed research.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'BUNI positions this herbalist-formulated, lanolin-free balm for healing cracked nipples, protecting against friction, and deep hydration. Calendula, beeswax, shea butter, olive oil, and cacao seed butter each have real supporting research for the specific claim BUNI makes; kokum butter\'s clinical testing comes mainly from its ingredient supplier rather than independent literature. No independent clinical study of this specific product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://www.bunibody.com/products/buni-nipple-balm', label: 'bunibody.com: SOOTHE Nipple and Lip Balm, ingredient list and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/31145533/', label: 'PubMed: A systematic review of Calendula officinalis extract for wound healing' },
        ],
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
                'Safe to nurse right after applying: no wipe-off needed.',
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
        communityReview: 'Customer reviews on BUNI\'s site describe fast relief for cracked, sore nipples during breastfeeding: for example: "Wouldn\'t have reached my breastfeeding goal without this. Healed every crack." and "Apply after last feed. Wake up with softer healed skin. The overnight healing is incredible." No star rating or review count was shown alongside them, and no independent (non-brand) review data was found at time of writing.',
        effectiveness: 'Provides an occlusive moisturizing layer for dry or irritated skin; several named ingredients (calendula, beeswax, shea butter, olive oil, cacao seed butter) have real independent research behind the specific mechanism BUNI claims for them. No independent clinical study of the finished product was found.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed) where independent research
        // exists. Rendered on the Scientific literature tab. Matches
        // BUNI's own "What's Inside" ingredient list and stated purposes.
        ingredientScience: [
            {
                name: 'Olive oil',
                text: 'BUNI states this gives deep nourishment and protection, rich in antioxidants for barrier repair. Plant oils including olive oil have shown anti-inflammatory and skin-barrier-repair effects, reducing water loss through skin, in review literature.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-Inflammatory and Skin Barrier Repair Effects of Topical Application of Some Plant Oils' },
                ],
            },
            {
                name: 'Kokum butter',
                text: 'BUNI states this gives non-greasy moisture and a protective layer without clogging pores. An independent review of Garcinia indica (kokum) found documented antioxidant, anti-inflammatory, and wound-healing pharmacological activity. The specific moisturizing and elasticity testing available for kokum butter comes from an ingredient supplier\'s own testing, not independent peer-reviewed research.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8708457/', label: 'NIH (PMC): Pharmacological Activity of Garcinia indica (Kokum), an updated review' },
                ],
            },
            {
                name: 'Beeswax',
                text: 'BUNI states this is a natural sealant that locks in moisture and shields against friction. A 2023 review of clinical and lab studies found beeswax functions as an effective occlusive that reduces water loss through skin and supports barrier integrity.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/36999457/', label: 'PubMed: A review of the use of beeswax in skincare' },
                ],
            },
            {
                name: 'Shea butter',
                text: 'BUNI states this gives intensive healing, deeply repairing cracked and damaged skin. A clinical trial found a shea-butter-based cream performed comparably to a ceramide-based product for skin barrier repair and hydration.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/26314567/', label: 'PubMed: Patient acceptability, efficacy, and skin biophysiology of a cream containing shea butter extract versus a ceramide product' },
                ],
            },
            {
                name: 'Cacao seed butter',
                text: 'BUNI states this is a rich emollient that softens and conditions rough, dry patches. Cocoa (cacao) polyphenols have documented, measurable antioxidant activity after topical application.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/39429210/', label: 'PubMed: Topical Antioxidant Cocoa Polyphenol Skin Penetration' },
                ],
            },
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
                        // summary of actual review text, just confirms this
                        // is the real, current product listing. Read the
                        // reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
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
        whereToBuy: ['BUNI Body', 'Amazon'],
        url: 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil?ref=oxaevspm',
        affiliateUrl: 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil?ref=oxaevspm',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/3UOVTfk',
            'BUNI Body': 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil?ref=oxaevspm',
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
        doctorOpinion: 'Several of BUNI\'s named ingredients for this oil have real, independent research behind the specific mechanism the brand claims for them (see BUNI\'s own ingredient list under "Materials" below). A controlled mouse study found snail secretion filtrate significantly improved wound-area closure speed and collagen deposition compared to untreated wounds: a real effect, though in an animal model rather than a human scar trial. Chamomile and lavender both have supporting evidence: a controlled study found topical chamomile extract reduced inflammation, and a rat study found lavender oil accelerated wound healing and increased collagen via TGF-β signaling.\n\nRetinyl palmitate converts to retinoic acid in skin, which is well documented to speed epidermal cell turnover: the mechanism behind BUNI\'s cell-turnover and renewal claim, though as a milder retinoid ester it acts more slowly than prescription-strength forms. Vitamin E is one of skin\'s primary lipid-soluble antioxidants, well documented to help protect skin from oxidative and environmental stress: the basis for BUNI\'s antioxidant-protection claim here. Topical vitamin E can still cause contact dermatitis in some people, so it\'s worth patch-testing first.\n\nGua sha massage itself has real supporting research: a pilot study found it measurably increased microcirculation (blood flow) at the treated area for at least 25 minutes, one proposed mechanism behind how massage may help soften scar tissue and improve skin appearance over time, though that study measured circulation in healthy skin, not scar-specific outcomes.\n\nBUNI advises medical approval before using the oil on a new or C-section scar. No independent clinical study of this specific product was found.',
        doctorOpinionShort: 'BUNI\'s ingredient claims for this oil, scar healing/regeneration (snail secretion filtrate), cell turnover (retinyl palmitate), moisture (avocado + apricot oil), calming (chamomile + lavender), and antioxidant protection (vitamin E), are each backed by real independent research on the underlying mechanism. Gua sha massage also has real evidence for boosting local circulation. No independent clinical study of this specific finished product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil', label: 'bunibody.com: TRANSFORM Scar+Body Treatment Oil, ingredient list and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the Response of Skin to Oxidative Stress, Vitamin E as a Key Indicator' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/17905355/', label: 'PubMed: The Effect of Gua Sha Treatment on the Microcirculation of Surface Tissue, a pilot study in healthy subjects' },
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
            'Vitamin E can cause contact dermatitis or itching in some people: patch test first.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'One customer review on BUNI\'s site: "Transform literally changed my C-section scar. 6 weeks in and the difference is wild. I also use it on old stretch marks: they\'re visibly fading." No star rating or review count was shown alongside it, and no independent (non-brand) review data was found at time of writing.',
        effectiveness: 'May moisturize and soothe skin as part of a regular scar-massage routine after appropriate wound healing. Each named ingredient (snail secretion filtrate, retinyl palmitate, avocado oil, chamomile, lavender, and vitamin E) has real independent research behind the specific mechanism BUNI claims for it, and the gua sha component has real evidence for boosting local circulation. Product-specific clinical benefit for visible scarring has not been independently established.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed) where independent research
        // exists. Rendered on the Scientific literature tab. Matches
        // BUNI's own "What's Inside" ingredient list and stated purposes.
        ingredientScience: [
            {
                name: 'Snail secretion filtrate',
                text: 'BUNI states this stimulates collagen and smooths texture for scar healing and regeneration. A controlled mouse study found snail secretion filtrate significantly improved wound-area closure speed and collagen deposition compared to untreated wounds, a real effect, though from an animal model rather than a human scar trial.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8402640/', label: 'NIH (PMC): The Protective Effect of Snail Secretion Filtrate in an Experimental Model of Excisional Wounds in Mice' },
                ],
            },
            {
                name: 'Retinyl palmitate',
                text: 'BUNI states this promotes cell turnover and renewal. Retinyl palmitate converts to retinoic acid in skin through a two-step process, and retinoic acid is well documented to speed epidermal cell turnover, the mechanism behind BUNI\'s claim. Because of that extra conversion step, it\'s a milder, slower-acting retinoid than prescription-strength forms.',
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
                text: 'BUNI positions this as antioxidant protection, shielding healing skin from environmental damage. Vitamin E is one of skin\'s primary lipid-soluble antioxidants, a classic review found it accumulates in the stratum corneum and cell membranes, where it helps protect skin from oxidative and environmental stress, which is the mechanism behind BUNI\'s claim. Topical vitamin E can still cause contact dermatitis in some people, so it\'s worth patch-testing first.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the Response of Skin to Oxidative Stress, Vitamin E as a Key Indicator' },
                ],
            },
            {
                name: 'Gua sha massage',
                text: 'A pilot study using laser Doppler imaging found gua sha caused a measurable, sustained increase in microcirculation (blood flow) at the treated area, one proposed mechanism behind massage-based scar and tissue work. The study measured healthy skin, not scar-specific outcomes.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/17905355/', label: 'PubMed: The Effect of Gua Sha Treatment on the Microcirculation of Surface Tissue, a pilot study in healthy subjects' },
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
                        // summary of actual review text, just confirms this
                        // is the real, current product listing. Read the
                        // reviews directly on Amazon.
                        summary: 'Real, current Amazon listing for this exact product. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
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
        whereToBuy: ['BUNI Body', 'Amazon'],
        url: 'https://www.bunibody.com/products/buni-bundle?ref=oxaevspm',
        affiliateUrl: 'https://www.bunibody.com/products/buni-bundle?ref=oxaevspm',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/4xSUqDt',
            'BUNI Body': 'https://www.bunibody.com/products/buni-bundle?ref=oxaevspm',
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
                        summary: 'Real, current Amazon listing for this exact bundle. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.bunibody.com/products/buni-bundle',
                        text: 'BUNI: Bundle customer reviews',
                        summary: 'BUNI\'s own site hosts reviews for the bundle and for each individual product it contains, see each product\'s own entry for specific customer quotes. No star rating or aggregate review count was shown for the bundle itself at time of writing.',
                    },
                ],
            },
        },
        isEmergingBrand: true,
    },

    // kieró, verified against us.kieroskincare.com (2026-09-30). Every
    // science claim below was re-checked against the cited abstract (NCBI
    // E-utilities) on 2026-10-02; study size and design are stated wherever
    // they limit what the finding shows. Not a brand
    // partner and no affiliate link yet, so there's no affiliateUrl; Buy Now
    // falls back to kieró's own product page (see resolveBuyUrl). Listed as
    // sold out on kieró's US site at time of writing.
    {
        id: 'p-kiero-refining-enzyme-cleanser',
        name: 'Refining Enzyme Cleanser',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'cleanser', 'exfoliation', 'vegan', 'fragrance-free'],
        price: '$11.99 for 50 g (1.76 oz)',
        whereToBuy: ['kieró'],
        url: 'https://us.kieroskincare.com/products/refining-enzyme-cleanser',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/refining-enzyme-cleanser',
        },
        image: 'https://us.kieroskincare.com/cdn/shop/files/kiero-_-05_9dcbb676-03a3-45a9-bb4e-ae5dd1708f23.jpg',
        summary: 'A powder face cleanser that turns into a creamy foam with water, made with papaya enzymes (papain), beta-glucan, and chia seed extract. kieró positions it as a gentle daily enzyme exfoliant that removes impurities and excess oil without drying and refines skin texture. It is step 1 of kieró\'s 5-step routine, which blends Korean-beauty formulation with Latin American botanicals.',
        ingredients: 'Full INCI list per kieró: Zea Mays (Corn) Starch, Sodium Cocoyl Isethionate, Microcrystalline Cellulose, Sodium Methyl Cocoyl Taurate, Potassium Laurate, Sodium Lauroyl Glutamate, Allantoin, Maltodextrin, Papain, Water, CI 77499, Glycerin, Salvia Hispanica Seed Extract, 1,2-Hexanediol, Butylene Glycol, Beta-Glucan, Ethylhexylglycerin.',
        safety: {
            fdaStatus: 'Cosmetic face cleanser; not an FDA-cleared drug or medical device. kieró states its products are vegan and cruelty-free and use EWG Green-graded ingredients; ayna did not independently verify those claims.',
            materials: 'Water-activated powder (50 g / 1.76 oz). Cleansing comes mainly from mild synthetic surfactants: sodium cocoyl isethionate, sodium methyl cocoyl taurate, and sodium lauroyl glutamate. It also contains potassium laurate, which is a true soap. The enzyme is papain. Supporting ingredients are allantoin, glycerin, beta-glucan, and chia (Salvia hispanica) seed extract. CI 77499 is black iron oxide, a colorant. No added fragrance, essential oils, or sulfates appear in the published ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Papain is a protein-digesting enzyme and a documented allergen. Published cases include workers who became allergic by breathing it in and a person who reacted to papain in a contact-lens solution; one case report also links papain allergy to kiwi and fig allergy. Anyone allergic to papaya, papain, kiwi, or fig should avoid it or patch test first. The AAD warns that exfoliating while using retinoids or benzoyl peroxide can worsen dryness. Full warnings are listed below.',
            opinionAlerts: 'Allergy note: contains papain (papaya enzyme), a known allergen. Avoid it if you\'re allergic to papaya, kiwi, or fig, or patch test first. Benefit claims (refined texture, radiance, barrier support) come from kieró, and no independent clinical study of the finished product was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says the papaya enzymes gently exfoliate, beta-glucan hydrates and soothes, and chia seed reinforces the skin barrier, and that the powder foams up to remove oil and impurities without drying. No independent study of this product was found, so what follows is what the research says about its main ingredients.\n\nThe main cleansing agent, sodium cocoyl isethionate, is the basis of "syndet" (synthetic detergent) cleansers. Reviews describe syndets as gentler on the skin barrier than soap, and lab work explains why: its micelles are too large to slip into the skin\'s outer layer. The formula also contains potassium laurate, which is a true soap, so it isn\'t entirely soap-free.\n\nPapain breaks down keratin and other skin proteins in lab tests, which is how enzyme exfoliants work. The evidence is thin, though. A review found only 11 published studies on enzyme exfoliation, with few clinical trials, and concluded that more robust studies are needed before it can be recommended as safe. The lab test took hours to break down skin proteins, and a cleanser is rinsed off within a minute, so any exfoliation is likely mild. Papain is also a documented allergen, mostly in workers who breathe it in. In human skin cells and in mice, it weakened the skin barrier and caused sensitization through the skin.\n\nThe supporting ingredients have early evidence, all from leave-on products rather than cleansers. For beta-glucan, a 20-patient split-face trial after laser treatment found that a beta-glucan skin-care regimen improved hydration and redness compared with a placebo cream, and an open-label eczema study of 105 patients found less itch and milder flare-ups. For chia seed oil, a 4% chia oil cream improved hydration and barrier function in an 8-week study of just 10 people, with no control group. Allantoin is recognized by the FDA as an over-the-counter skin protectant at 0.5–2%, but kieró doesn\'t list its concentration.\n\nThe American Academy of Dermatology advises gentle exfoliation for dry or sensitive skin, moisturizing afterward, and not exfoliating while using retinoids or benzoyl peroxide or on broken or sunburned skin.',
        doctorOpinionShort: 'A powder cleanser built on syndet surfactants, which are gentler on the skin barrier than soap, with papaya enzyme (papain) for exfoliation. Evidence for enzyme exfoliation is thin, and the beta-glucan and chia research comes from small studies of leave-on products, not rinse-off cleansers. Papain is a documented allergen, so avoid it if you\'re allergic to papaya, kiwi, or fig. No independent study of this product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/refining-enzyme-cleanser', label: 'kieroskincare.com: Refining Enzyme Cleanser, ingredient list and claims' },
            { url: 'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home', label: 'American Academy of Dermatology: How to safely exfoliate at home' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'People who want gentle, daily enzyme exfoliation instead of a scrub or acid',
            'Normal, oily, or combination skin looking for a cleanser that removes excess oil without a tight, stripped feeling',
            'People who prefer a fragrance-free, vegan formula',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // us.kieroskincare.com/products/refining-enzyme-cleanser.
        howToUse: {
            intro: 'Per kieró\'s own site: use daily as step 1 (cleanse) of the routine.',
            steps: [
                'Pour a small amount of powder into wet hands.',
                'Rub your hands together to create a creamy lather, then gently massage it into your skin.',
                'Rinse well and pat your face dry.',
                'Follow with moisturizer. The AAD recommends moisturizing right after any exfoliation.',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/refining-enzyme-cleanser',
            sourceLabel: 'kieroskincare.com: Refining Enzyme Cleanser',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Allergy to papaya, papain, kiwi, or fig: avoid it or patch test first. Papain is a known allergen.',
            'Using a prescription retinoid, retinol, or benzoyl peroxide: exfoliating on top of them can worsen dryness and irritation (AAD).',
            'Don\'t use on broken, cut, or sunburned skin.',
            'Keep out of eyes. If you get redness, burning, or an allergic reaction, stop using it and see a doctor.',
        ],
        communityReview: 'kieró\'s US site shows 251 customer reviews, and 233 of them (93%) are five stars. Most reviews are in Spanish and describe skin feeling very clean, soft, and hydrated, for example: "Muy recomendable, te deja la piel suave e hidratada" ("Highly recommend, it leaves your skin soft and hydrated"). On Amazon it has 4.6 out of 5 stars from 36 ratings as of October 2026. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s product page.',
        effectiveness: 'Cleanses with mild syndet surfactants. Papain may add light exfoliation, but enzyme exfoliation has few clinical trials and a cleanser is rinsed off quickly. Evidence for beta-glucan and chia comes from small studies of leave-on products. No independent study of the finished product was found.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed). Rendered on the Scientific
        // literature tab. Matches kieró's key-ingredient claims.
        ingredientScience: [
            {
                name: 'Papain (papaya enzyme)',
                text: 'kieró states this gently exfoliates. In a lab study, papain broke down keratin and collagen, and on pig skin it had an exfoliating effect, though breakdown took hours. A review (J Cosmet Dermatol, 2022) found only 11 studies on enzyme exfoliation, few of them clinical trials. It concluded that more robust studies are needed before enzyme exfoliation can be recommended as safe. Papain is also an allergen. In human skin cells and in mice it weakened the skin barrier and caused sensitization through the skin. In people, papain allergy is mostly documented in workers who breathe it in, and one case report links it to kiwi and fig allergy.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/34897928/', label: 'PubMed: An overview of the use of proteolytic enzymes as exfoliating agents' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/35892222/', label: 'PubMed: In vitro effect on the proteolytic activity of papain with proteins of the skin as substrate' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/25705851/', label: 'PubMed: Papain degrades tight junction proteins of human keratinocytes in vitro and sensitizes mice via the skin' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/26739411/', label: 'PubMed: Papain-induced occupational asthma with kiwi and fig allergy, case report and review of 13 cases' },
                ],
            },
            {
                name: 'Beta-glucan',
                text: 'kieró states this hydrates and soothes. In a split-face, double-blind trial of 20 patients after laser treatment, a beta-glucan skin-care regimen improved hydration and redness compared with a placebo cream. In an open-label study (no blinding or separate control group) of 105 people with mild-to-moderate eczema, a beta-glucan cream reduced itch and eczema severity on the treated side. Both tested leave-on products, not a rinse-off cleanser.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/33128496/', label: 'PubMed: Skin care regimens containing β-glucan for skin recovery after fractional laser therapy, split-face, double-blinded, vehicle-controlled study' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/26654776/', label: 'PubMed: β-Glucan-based cream in supportive treatment of mild-to-moderate atopic dermatitis' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12023766/', label: 'NIH (PMC): Exploring the properties and application potential of β-glucan in skin care' },
                ],
            },
            {
                name: 'Chia seed (Salvia hispanica) extract',
                text: 'kieró states this reinforces the skin barrier. In an 8-week study of 10 people with dry, itchy skin and no control group, a cream with 4% chia seed oil improved skin hydration and barrier function, with no side effects reported. The study was run by a company that makes skin products, and it tested a leave-on oil, not a rinse-off extract.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/20548903/', label: 'PubMed: Effectiveness of topical chia seed oil on pruritus of end-stage renal disease patients and healthy volunteers' },
                ],
            },
            {
                name: 'Sodium cocoyl isethionate',
                text: 'The main cleansing agent. Lab research found its micelles are too large to get into the skin\'s outer layer, which explains why it is milder than soap or sodium lauryl sulfate. A 2022 review concludes that syndet cleansers like this preserve the skin barrier better than soap.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/17598025/', label: 'PubMed: Why is sodium cocoyl isethionate (SCI) mild to the skin barrier?' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8954092/', label: 'NIH (PMC): Skin cleansing without or with compromise, soaps and syndets' },
                ],
            },
            {
                name: 'Allantoin',
                text: 'The FDA recognizes allantoin as an over-the-counter skin-protectant ingredient at 0.5–2%. kieró doesn\'t list how much this cleanser contains, and in a rinse-off product little stays on the skin.',
                citations: [
                    { url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-347/subpart-B/section-347.10', label: 'FDA (21 CFR 347.10): Skin protectant active ingredients, allantoin, 0.5 to 2 percent' },
                ],
            },
        ],
        // Category-level citation shown only on the Scientific literature
        // tab, kept out of verificationLinks so it doesn't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home',
                text: 'American Academy of Dermatology: How to safely exfoliate at home',
                summary: 'AAD guidance: people with dry, sensitive, or acne-prone skin should choose gentle exfoliation, moisturize afterward, and avoid exfoliating on broken or sunburned skin or while using retinoids or benzoyl peroxide. This is general guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0FRMDSSY6',
                        text: 'Amazon: kieró Refining Enzyme Cleanser reviews',
                        summary: '4.6 out of 5 stars from 36 ratings on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/refining-enzyme-cleanser',
                        text: 'kieroskincare.com: Refining Enzyme Cleanser customer reviews',
                        summary: 'kieró\'s own product page shows 251 reviews, 93% of them five stars, mostly in Spanish (see the Community summary above).',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // kieró Airy Sun Stick, verified against us.kieroskincare.com
    // (2026-09-30). Same situation as the cleanser above: no affiliate link
    // yet, sold out on kieró's US site at time of writing.
    {
        id: 'p-kiero-airy-sun-stick-spf50',
        name: 'Airy Sun Stick SPF 50+',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'spf', 'sunscreen', 'vegan'],
        price: '$11.99 for 20 g (0.7 oz)',
        whereToBuy: ['kieró'],
        url: 'https://us.kieroskincare.com/products/sun-stick-spf-50',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/sun-stick-spf-50',
        },
        image: 'https://us.kieroskincare.com/cdn/shop/files/kiero-_-05_a549ac4a-c417-4be1-8731-03d3c0ffddb8.jpg',
        summary: 'A broad-spectrum SPF 50+ / PA++++ sunscreen stick with chamomile, vitamin E, and madecassoside (from centella). kieró positions it for daily UV protection with a lightweight, non-greasy finish that can be swiped on over makeup, and says it soothes and supports the skin barrier. It uses chemical (organic) UV filters, not zinc or titanium.',
        ingredients: 'Full INCI list per kieró: Dimethicone, Synthetic Wax, Vinyl Dimethicone/Methicone Silsesquioxane Crosspolymer, Cetyl Ethylhexanoate, Octocrylene, Homosalate, Methyl Methacrylate Crosspolymer, Dibutyl Adipate, Butyloctyl Salicylate, Octisalate, Avobenzone, Pentylene Glycol, Polyglyceryl-4 Oleate, Helianthus Annuus (Sunflower) Seed Oil, Polyglyceryl-6 Oleate, Polyhydroxystearic Acid, Methylpropanediol, Persea Gratissima (Avocado) Oil, Ethylhexylglycerin, Caprylyl Glycol, Glycine Soja (Soybean) Oil, Tocopherol, Steareth-30, Lactobacillus Ferment Lysate, Butyrospermum Parkii (Shea) Butter Extract, Bixa Orellana Seed Oil, Water, Sodium Guaiazulene Sulfonate, Panthenol, Butylene Glycol, 1,2-Hexanediol, Anthemis Nobilis Flower Water, Madecassoside, Asiaticoside, Asiatic Acid, Madecassic Acid.',
        safety: {
            fdaStatus: 'In the US, sunscreens are regulated as over-the-counter drugs. kieró doesn\'t publish the percentage of each UV filter or say whether the product is water resistant. kieró states its products are vegan and cruelty-free; ayna did not independently verify that.',
            materials: 'Solid silicone-and-wax stick (20 g / 0.7 oz). UV filters: avobenzone (UVA), octocrylene, homosalate, octisalate, and butyloctyl salicylate, all chemical filters with no zinc oxide or titanium dioxide. The soothing ingredients are Roman chamomile flower water, sodium guaiazulene sulfonate (an azulene compound related to chamomile\'s blue oil), madecassoside with other centella compounds, panthenol, and vitamin E. Plant oils include sunflower, avocado, soybean, shea, and annatto (Bixa orellana).',
            recalls: 'No recalls found.',
            sideEffects: 'Octocrylene can cause photoallergic reactions (a rash after sun exposure), notably in people who have reacted to ketoprofen, an anti-inflammatory gel. The formula contains Roman chamomile, a daisy-family (Asteraceae) plant; this family is a known contact allergen and cross-reacts with ragweed, so people with those allergies should patch test first. Full warnings are listed below.',
            opinionAlerts: 'Safety note: sunscreen only reaches its labeled SPF when applied generously, and most people apply far less, so go over each area several times. Its chemical UV filters were absorbed into the bloodstream in an FDA study; the FDA researchers said that doesn\'t mean people should stop using sunscreen. Contains Roman chamomile, so patch test if you\'re allergic to ragweed or daisies. Soothing and barrier claims come from kieró, and no independent study of the finished product was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says the chamomile soothes, the vitamin E gives antioxidant defense, and the madecassoside strengthens the skin barrier, and that the stick can be swiped on over makeup. No independent study of this product was found, so what follows is what the research says about daily sunscreen and its ingredients.\n\nThe strongest evidence is for daily sunscreen use itself, from a randomized trial of 1,621 adults in Nambour, Australia, using an SPF 15+ sunscreen. People assigned to daily use had 24% less skin aging over 4.5 years than people who used sunscreen when they chose to. They also had about 39% fewer squamous cell carcinoma tumors, though the share of people who got one didn\'t differ significantly, and there was no effect on basal cell carcinoma. Ten years later, the daily group had 11 new melanomas versus 22, a difference just short of statistical significance overall, though the drop in invasive melanoma (3 vs 11) was significant.\n\nHow much you apply matters. SPF is tested at 2 mg/cm², while consumers typically apply 0.5–1 mg/cm², and lab studies show actual SPF drops steeply at those amounts. One study found SPF 30–50 products may not give enough protection at typical consumer amounts. The AAD and FDA advise applying 15 minutes before sun exposure and reapplying at least every two hours, and more often when swimming or sweating. kieró doesn\'t claim water resistance.\n\nThe UV filters in this stick (avobenzone, octocrylene, homosalate, octisalate) were all absorbed into the bloodstream in a 2020 FDA randomized trial of 48 people. Levels were above the point at which the FDA can waive further safety testing, and the FDA researchers said this does not mean people should stop using sunscreen. A separate lab study found benzophenone, which it calls a possible human carcinogen, in all 28 octocrylene-containing products tested, increasing with age and heat. People who want to avoid these filters can choose a mineral (zinc oxide) sunscreen.\n\nFor the soothing ingredients, a 6-month double-blind study of 20 women found that a cream combining 5% vitamin C with 0.1% madecassoside improved wrinkles, firmness, and hydration. Because the two were combined, the result can\'t be credited to madecassoside alone. In a separate study, madecassoside reduced UV-triggered inflammation in skin cells and reduced UV tanning on human skin over 8 weeks. Vitamin E is the main antioxidant naturally found in skin.',
        doctorOpinionShort: 'Daily sunscreen use slowed skin aging and reduced squamous cell carcinoma tumors in a large randomized trial, with a likely drop in invasive melanoma. Protection depends on applying enough, so go over each area several times and reapply every two hours. Its chemical filters are absorbed into the blood; the FDA researchers said that doesn\'t mean people should stop using sunscreen, and mineral sunscreen is an alternative. No independent study of this product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/sun-stick-spf-50', label: 'kieroskincare.com: Airy Sun Stick SPF 50+, ingredient list and claims' },
            { url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen', label: 'American Academy of Dermatology: How to apply sunscreen' },
            { url: 'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun', label: 'FDA: Sunscreen, how to help protect your skin from the sun' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/10475183/', label: 'PubMed: Daily sunscreen application in prevention of basal-cell and squamous-cell carcinomas, randomised controlled trial', chipLabel: 'Nambour sunscreen trial (Lancet 1999)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/23732711/', label: 'PubMed: Sunscreen and prevention of skin aging, a randomized trial (Ann Intern Med 2013)', chipLabel: 'Sunscreen and skin aging trial (2013)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/21135266/', label: 'PubMed: Reduced melanoma after regular sunscreen use, randomized trial follow-up (J Clin Oncol 2011)', chipLabel: 'Sunscreen and melanoma follow-up (2011)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/19614894/', label: 'PubMed: The influence of the amount of sunscreen applied on its sun protection factor', chipLabel: 'Sunscreen amount and SPF study' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/31961417/', label: 'PubMed: Effect of sunscreen application on plasma concentration of sunscreen active ingredients, randomized clinical trial (JAMA 2020)', chipLabel: 'FDA sunscreen absorption trial (JAMA 2020)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/33763894/', label: 'PubMed: The presence of benzophenone in sunscreens and cosmetics containing the organic UV filter octocrylene', chipLabel: 'Benzophenone in octocrylene products (2021)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/18503551/', label: 'PubMed: Long-term effects of topical ascorbic acid and madecassoside in photoaged human skin', chipLabel: 'Vitamin C + madecassoside trial, 20 women' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6290557/', label: 'NIH (PMC): Madecassoside inhibits melanin synthesis by blocking ultraviolet-induced inflammation', chipLabel: 'Madecassoside UV study' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the response of skin to oxidative stress, vitamin E as a key indicator', chipLabel: 'Vitamin E in skin (review)' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'People who want a mess-free daily SPF they can reapply over makeup',
            'Oily or combination skin looking for a non-greasy finish',
            'Touch-ups on the face, ears, nose, and around the eyes during the day',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // us.kieroskincare.com/products/sun-stick-spf-50, plus AAD/FDA
        // application guidance (marked as such).
        howToUse: {
            intro: 'Per kieró\'s own site: swipe the stick on as the last step of your morning routine, or over makeup, evenly covering all sun-exposed areas. Reapply through the day as needed.',
            steps: [
                'Go over each area several times (back and forth). A single light swipe won\'t deliver the labeled SPF.',
                'Apply about 15 minutes before going outside (AAD).',
                'Reapply at least every two hours, and right after swimming or sweating (AAD / FDA).',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/sun-stick-spf-50',
            sourceLabel: 'kieroskincare.com: Airy Sun Stick SPF 50+',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Allergy to ragweed, chamomile, or other daisy-family plants: patch test first.',
            'Have you reacted to ketoprofen (an anti-inflammatory gel)? Octocrylene can cause photoallergic reactions in people sensitized to it.',
            'Rash or irritation, especially after sun exposure: stop using it and see a doctor.',
            'Not stated as water resistant: reapply after swimming or sweating.',
            'Infants under 6 months: the FDA doesn\'t recommend sunscreen; keep them out of the sun instead.',
        ],
        communityReview: 'kieró\'s US site shows 657 customer reviews, and 593 of them (90%) are five stars; the rest are four stars. Most reviews are in Spanish and praise how easily it goes on, how fast it absorbs, and its non-greasy feel, including over makeup. For example: "No es grasoso y protege muy bien tu piel del sol" ("It\'s not greasy and protects your skin from the sun really well"). On Amazon it has 4.5 out of 5 stars from 28 ratings (69% five-star, 26% four-star, 5% one-star) as of October 2026. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s product page.',
        effectiveness: 'Labeled SPF 50+ / PA++++ broad spectrum, but real-world protection depends on how much you apply. Daily sunscreen use slowed skin aging and reduced squamous cell carcinoma tumors in a randomized trial. No independent study of the finished product was found.',
        // Per-ingredient / per-topic science, each paired with a credible
        // source (NIH-hosted or PubMed). Rendered on the Scientific
        // literature tab.
        ingredientScience: [
            {
                name: 'Daily broad-spectrum sunscreen',
                text: 'In the Nambour randomized trial (1,621 adults, SPF 15+), people assigned to daily sunscreen showed no detectable increase in skin aging over 4.5 years, 24% less aging than the discretionary-use group. They had 39% fewer squamous cell carcinoma tumors, though the share of people who got one didn\'t differ significantly, and there was no effect on basal cell carcinoma. Ten years later, the daily group had 11 new melanomas vs 22; that overall difference was just short of statistical significance (p = 0.051), while the drop in invasive melanoma (3 vs 11) was significant.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/10475183/', label: 'PubMed: Daily sunscreen application in prevention of basal-cell and squamous-cell carcinomas, a randomised controlled trial (Green et al., Lancet 1999)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/23732711/', label: 'PubMed: Sunscreen and prevention of skin aging, a randomized trial (Hughes et al., Ann Intern Med 2013)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/21135266/', label: 'PubMed: Reduced melanoma after regular sunscreen use, randomized trial follow-up (Green et al., J Clin Oncol 2011)' },
                ],
            },
            {
                name: 'How much you apply',
                text: 'SPF is measured at 2 mg/cm², but consumers typically apply 0.5–1 mg/cm². Lab studies on volunteers found actual SPF falls significantly at lower amounts. One found SPF 30–50 products may not give enough protection at typical consumer amounts.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/19614894/', label: 'PubMed: The influence of the amount of sunscreen applied on its sun protection factor' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/22463921/', label: 'PubMed: High-SPF sunscreens may compensate for lower user application amounts' },
                ],
            },
            {
                name: 'Chemical UV filters (avobenzone, octocrylene, homosalate, octisalate)',
                text: 'In a 2020 FDA randomized trial of 48 people, all of these filters were absorbed into the bloodstream after a single application, above the level at which the FDA can waive further safety testing. The researchers concluded this does not mean people should stop using sunscreen. A separate lab study found benzophenone, a possible human carcinogen, in all 28 octocrylene-containing products tested. Levels rose with time and heat.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31961417/', label: 'PubMed: Effect of sunscreen application on plasma concentration of sunscreen active ingredients, a randomized clinical trial (JAMA 2020)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/33763894/', label: 'PubMed: The presence of benzophenone in sunscreens and cosmetics containing the organic UV filter octocrylene' },
                ],
            },
            {
                name: 'Madecassoside (centella)',
                text: 'kieró states this strengthens the skin barrier. No study testing madecassoside alone for barrier strength was found. In a 6-month double-blind study of 20 women, a cream combining 5% vitamin C with 0.1% madecassoside improved wrinkles, firmness, and hydration, but the result can\'t be credited to madecassoside alone. In another study, madecassoside reduced UV-triggered inflammation in skin cells and reduced UV tanning on human skin over 8 weeks.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/18503551/', label: 'PubMed: Long-term effects of topical ascorbic acid and madecassoside in photoaged human skin' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6290557/', label: 'NIH (PMC): Madecassoside inhibits melanin synthesis by blocking ultraviolet-induced inflammation' },
                ],
            },
            {
                name: 'Roman chamomile',
                text: 'kieró states this soothes sensitive skin. No study of chamomile flower water for soothing was found. Chamomile is in the daisy (Asteraceae) family, whose compounds are known skin sensitizers that can cross-react with ragweed.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11847717/', label: 'NIH (PMC): Allergic potential of medicinal plants from the Asteraceae family (2025 review)' },
                ],
            },
            {
                name: 'Vitamin E',
                text: 'kieró states this gives antioxidant defense. Vitamin E is the main antioxidant naturally found in human skin, and UV exposure depletes it.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the Response of Skin to Oxidative Stress, Vitamin E as a Key Indicator' },
                ],
            },
        ],
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen',
                text: 'American Academy of Dermatology: How to apply sunscreen',
                summary: 'AAD guidance: use SPF 30+ broad-spectrum sunscreen, apply about 15 minutes before going out, and reapply every two hours and after swimming or sweating. This is general guidance, not product-specific validation.',
            },
            {
                url: 'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun',
                text: 'FDA: Sunscreen, how to help protect your skin from the sun',
                summary: 'FDA guidance: use broad-spectrum SPF 15+, apply 15 minutes before sun exposure, reapply at least every two hours, and keep infants under 6 months out of the sun rather than using sunscreen.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0HBVSP2QH',
                        text: 'Amazon: kieró Airy Sun Stick reviews',
                        summary: '4.5 out of 5 stars from 28 ratings (69% five-star, 26% four-star, 5% one-star) on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/sun-stick-spf-50',
                        text: 'kieroskincare.com: Airy Sun Stick SPF 50+ customer reviews',
                        summary: 'kieró\'s own product page shows 657 reviews, 90% of them five stars and the rest four stars, mostly in Spanish (see the Community summary above).',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // kieró Comfort Cleansing Balm, Prime Sun Gel SPF 40+, Essential Boost
    // Serum, verified against us.kieroskincare.com on 2026-10-06 (product
    // description, full INCI list, and review counts from each product page).
    // Every science claim below was read from its abstract via NCBI
    // E-utilities; the sun gel reuses the sun stick's already-verified
    // sunscreen sources because it has the same UV filters. Not a brand
    // partner and no affiliate link, so Buy Now goes to kieró's own page.
    {
        id: 'p-kiero-comfort-cleansing-balm',
        name: 'Comfort Cleansing Balm',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'cleanser', 'cleansing balm', 'makeup remover', 'oil cleanser', 'vegan', 'fragrance-free'],
        price: '$11.99 for 80 g (2.82 oz)',
        whereToBuy: ['kieró'],
        url: 'https://us.kieroskincare.com/products/comfort-cleansing-balm',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/comfort-cleansing-balm',
        },
        image: '/products/kiero/comfort-cleansing-balm.jpg', // supplied by ayna; same photo as kieró's product page
        summary: 'A cleansing balm with grape seed oil, macadamia oil and vitamin E that melts on contact to dissolve makeup and impurities. kieró positions it as a first cleanse that removes makeup without drying and protects the skin\'s moisture barrier. Massage it onto dry skin, then rinse with warm water. It is step 1 (cleanse) of kieró\'s 5-step routine.',
        ingredients: 'Full INCI list per kieró: Cetyl Ethylhexanoate, Caprylic/Capric Triglyceride, PEG-20 Glyceryl Triisostearate, PEG-10 Isostearate, Synthetic Wax, Sorbitan Sesquioleate, Glyceryl Caprylate, Ethylhexylglycerin, Vitis Vinifera (Grape) Seed Oil, Eclipta Prostrata Extract, Melia Azadirachta Leaf Extract, Melia Azadirachta Flower Extract, Coccinia Indica Fruit Extract, Solanum Melongena (Eggplant) Fruit Extract, Moringa Oleifera Seed Oil, Simmondsia Chinensis (Jojoba) Seed Oil, Corallina Officinalis Extract, Curcuma Longa (Turmeric) Root Extract, Ocimum Sanctum Leaf Extract, Macadamia Ternifolia Seed Oil, Tocopherol, Helianthus Annuus (Sunflower) Seed Oil, Vegetable Oil.',
        safety: {
            fdaStatus: 'Cosmetic cleanser; not an FDA-cleared drug or medical device. kieró states its products are vegan and cruelty-free; ayna did not independently verify that.',
            materials: 'Solid balm (80 g / 2.82 oz) made mostly of emollient esters, oils and wax, with grape seed, moringa, jojoba, macadamia and sunflower oils, vitamin E (tocopherol), and small amounts of plant extracts including neem (Melia azadirachta), turmeric, holy basil (Ocimum sanctum) and eggplant. No water, added fragrance or essential oils appear in the published ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'None reported by kieró. It contains several plant extracts and macadamia seed oil, so patch test first if you have sensitive skin or plant or nut allergies. Full warnings are listed below.',
            opinionAlerts: 'Claims that it soothes sensitive skin and strengthens the skin barrier come from kieró, and no independent study of the finished product was found. One reviewer noted it doesn\'t melt as quickly as expected.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says the balm dissolves makeup and impurities without drying, soothes and protects sensitive skin, and nourishes the skin barrier, crediting grape seed oil, macadamia oil and vitamin E.\n\nNo independent study of this product, or of cleansing balms as a category, was found, so these benefits rest on kieró\'s own claims. Vitamin E is the main antioxidant naturally found in skin, but in a rinse-off cleanser most of it is washed away. The formula lists no added fragrance or essential oils.',
        doctorOpinionShort: 'An oil-based makeup-removing balm with no added fragrance. Its soothing and barrier claims come from kieró, and no independent study of the product was found.',
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/comfort-cleansing-balm', label: 'kieroskincare.com: Comfort Cleansing Balm, ingredient list and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the response of skin to oxidative stress, vitamin E as a key indicator', chipLabel: 'Vitamin E in skin (review)' },
        ],
        whoItsFor: [
            'People who wear makeup or sunscreen and want a first cleanse that dissolves it without scrubbing',
            'Dry or normal skin that feels tight after foaming cleansers',
            'People who prefer a fragrance-free, vegan formula',
        ],
        howToUse: {
            intro: 'Per kieró\'s own site: use as step 1 (cleanse) of the routine.',
            steps: [
                'Scoop a small amount onto dry hands.',
                'Massage it onto a dry face in circular motions to dissolve makeup.',
                'Rinse with warm water.',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/comfort-cleansing-balm',
            sourceLabel: 'kieroskincare.com: Comfort Cleansing Balm',
        },
        warnings: [
            'Plant or nut allergies (it contains macadamia oil and several plant extracts): patch test first.',
            'Keep out of eyes. If you get redness, burning, or a rash, stop using it.',
        ],
        communityReview: 'kieró\'s US site shows 334 customer reviews, and 311 of them (93%) are five stars; the rest are four stars. Most reviews are in Spanish and praise how fully it removes makeup, including waterproof makeup and long-wear lipstick, and that it has no scent. For example: "Me encantó que removió todo el maquillaje de mi rostro" ("I loved that it removed all the makeup from my face"). One reviewer said it doesn\'t melt as quickly as expected. On Amazon it has 4.5 out of 5 stars from 58 ratings as of October 2026. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s product page.',
        effectiveness: 'Reviewers on kieró\'s site say it removes even waterproof makeup and long-wear lipstick without scrubbing.',
        ingredientScience: [
            {
                name: 'Vitamin E',
                text: 'kieró credits vitamin E for nourishing the skin. Vitamin E is the main antioxidant naturally found in human skin, and UV exposure depletes it. In a rinse-off cleanser, most of it is washed away.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/12239421/', label: 'PubMed: Antioxidants and the Response of Skin to Oxidative Stress, Vitamin E as a Key Indicator' },
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
                        url: 'https://www.amazon.com/dp/B0FRMXWM2M',
                        text: 'Amazon: kieró Comfort Cleansing Balm reviews',
                        summary: '4.5 out of 5 stars from 58 ratings on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/comfort-cleansing-balm',
                        text: 'kieroskincare.com: Comfort Cleansing Balm customer reviews',
                        summary: 'kieró\'s own product page shows 334 reviews, 93% of them five stars and the rest four stars, mostly in Spanish (see the Community summary above).',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-kiero-prime-sun-gel-spf40',
        name: 'Prime Sun Gel SPF 40+',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'spf', 'sunscreen', 'vegan'],
        price: '$12.99 for 50 ml (1.69 fl oz)',
        whereToBuy: ['kieró'],
        url: 'https://us.kieroskincare.com/products/sun-barrier',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/sun-barrier',
        },
        image: '/products/kiero/prime-sun-gel.jpg', // supplied by ayna; same photo as kieró's product page
        summary: 'A lightweight gel sunscreen labeled SPF 40+ / PA++++ broad spectrum, with chamomile, azulene and panthenol. kieró positions it for daily UV protection in a fast-absorbing, non-sticky texture that soothes sensitive skin and redness, hydrates, and wears alone or under makeup. It is the last step (protect) of kieró\'s morning routine.',
        ingredients: 'Full INCI list per kieró: Isododecane, Cyclopentasiloxane, Homosalate, Octocrylene, Cyclohexasiloxane, Dimethicone/Bis-Isobutyl PPG-20 Crosspolymer, Vinyl Dimethicone/Methicone Silsesquioxane Crosspolymer, Octisalate, Butyloctyl Salicylate, Avobenzone, 1,2-Hexanediol, Helianthus Annuus (Sunflower) Seed Oil, Polyglyceryl-4 Oleate, Water, C12-13 Pareth-9, Polyglyceryl-6 Oleate, Polyhydroxystearic Acid, Ethylhexylglycerin, Glycine Soja (Soybean) Oil, Caryodendron Orinocense Seed Oil, Tocopherol, Plukenetia Volubilis Seed Oil, Bixa Orellana Seed Oil, Sodium Guaiazulene Sulfonate, Panthenol, Butylene Glycol, Anthemis Nobilis Flower Water, Madecassoside, Asiaticoside, Asiatic Acid, Madecassic Acid, Fragrance.',
        safety: {
            fdaStatus: 'In the US, sunscreens are regulated as over-the-counter drugs. No FDA drug listing for this product was found in openFDA\'s NDC directory (checked 2026-10-06), so the SPF 40+ / PA++++ and broad-spectrum claims are per kieró. kieró doesn\'t publish the percentage of each UV filter or say whether it is water resistant. kieró states the formula is vegan and free of sulfates, parabens and phthalates; ayna did not independently verify that.',
            materials: 'Silicone-based gel (50 ml / 1.69 fl oz). UV filters: avobenzone (UVA), octocrylene, homosalate, octisalate, and butyloctyl salicylate, all chemical filters with no zinc oxide or titanium dioxide. Soothing ingredients are Roman chamomile flower water, sodium guaiazulene sulfonate (an azulene derivative), panthenol, and madecassoside (from centella). It also contains soybean oil, vitamin E, and added fragrance.',
            recalls: 'No recalls found.',
            sideEffects: 'Octocrylene can cause photoallergic reactions (a rash after sun exposure), notably in people who have reacted to ketoprofen, an anti-inflammatory gel. The formula contains Roman chamomile, a daisy-family (Asteraceae) plant; this family is a known contact allergen and cross-reacts with ragweed. It also contains added fragrance. People with those allergies or fragrance sensitivity should patch test first. Full warnings are listed below.',
            opinionAlerts: 'Safety note: sunscreen only reaches its labeled SPF when applied generously, and most people apply far less. Its chemical UV filters were absorbed into the bloodstream in an FDA study; the FDA researchers said that doesn\'t mean people should stop using sunscreen. Contains added fragrance and Roman chamomile, so patch test if you\'re fragrance-sensitive or allergic to ragweed or daisies. No FDA drug listing for this product was found. Soothing and redness claims come from kieró, and no independent study of the finished product was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says chamomile and azulene soothe sensitive skin and reduce redness, panthenol hydrates and strengthens the barrier, and the gel wears well alone or under makeup. No independent study of this product was found, and no FDA drug listing for it was found, so its SPF rating is per kieró.\n\nThe strongest evidence is for daily sunscreen use itself, from a randomized trial of 1,621 adults in Nambour, Australia, using an SPF 15+ sunscreen. People assigned to daily use had 24% less skin aging over 4.5 years than people who used sunscreen when they chose to. They also had about 39% fewer squamous cell carcinoma tumors, though the share of people who got one didn\'t differ significantly, and there was no effect on basal cell carcinoma. Ten years later, the daily group had 11 new melanomas versus 22, a difference just short of statistical significance overall, though the drop in invasive melanoma (3 vs 11) was significant.\n\nHow much you apply matters. SPF is tested at 2 mg/cm², while consumers typically apply 0.5–1 mg/cm², and lab studies show actual SPF drops steeply at those amounts. The AAD and FDA advise applying 15 minutes before sun exposure and reapplying at least every two hours, and more often when swimming or sweating. kieró doesn\'t claim water resistance.\n\nThe UV filters in this gel (avobenzone, octocrylene, homosalate, octisalate) were all absorbed into the bloodstream in a 2020 FDA randomized trial of 48 people, above the point at which the FDA can waive further safety testing; the FDA researchers said this does not mean people should stop using sunscreen. People who want to avoid these filters can choose a mineral (zinc oxide) sunscreen.\n\nFor the soothing ingredients: panthenol\'s active form, dexpanthenol, improved skin hydration and reduced water loss through the skin within 7 days in a small randomized, double-blind, placebo-controlled study. No human study of sodium guaiazulene sulfonate for redness was found; a 2003 lab study in bacteria found azulene and guaiazulene became mutagenic when exposed to UVA or visible light, which has not been tested in people. The gel also contains added fragrance, which can irritate sensitive skin.',
        doctorOpinionShort: 'Daily sunscreen use slowed skin aging and reduced squamous cell carcinoma tumors in a large randomized trial. Protection depends on applying enough and reapplying every two hours. No FDA drug listing for this product was found, so its SPF 40+ rating is per kieró. It contains added fragrance and chemical filters that are absorbed into the blood; mineral sunscreen is an alternative.',
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/sun-barrier', label: 'kieroskincare.com: Prime Sun Gel SPF 40+, ingredient list and claims' },
            { url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen', label: 'American Academy of Dermatology: How to apply sunscreen' },
            { url: 'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun', label: 'FDA: Sunscreen, how to help protect your skin from the sun' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/10475183/', label: 'PubMed: Daily sunscreen application in prevention of basal-cell and squamous-cell carcinomas, randomised controlled trial', chipLabel: 'Nambour sunscreen trial (Lancet 1999)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/23732711/', label: 'PubMed: Sunscreen and prevention of skin aging, a randomized trial (Ann Intern Med 2013)', chipLabel: 'Sunscreen and skin aging trial (2013)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/21135266/', label: 'PubMed: Reduced melanoma after regular sunscreen use, randomized trial follow-up (J Clin Oncol 2011)', chipLabel: 'Sunscreen and melanoma follow-up (2011)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/19614894/', label: 'PubMed: The influence of the amount of sunscreen applied on its sun protection factor', chipLabel: 'Sunscreen amount and SPF study' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/31961417/', label: 'PubMed: Effect of sunscreen application on plasma concentration of sunscreen active ingredients, randomized clinical trial (JAMA 2020)', chipLabel: 'FDA sunscreen absorption trial (JAMA 2020)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/10965426/', label: 'PubMed: Effect of topically applied dexpanthenol on epidermal barrier function and stratum corneum hydration', chipLabel: 'Dexpanthenol skin barrier trial (2000)' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3767376/', label: 'NIH (PMC): Photomutagenicity of cosmetic ingredient chemicals azulene and guaiazulene', chipLabel: 'Azulene lab study (2003)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/18503551/', label: 'PubMed: Long-term effects of topical ascorbic acid and madecassoside in photoaged human skin', chipLabel: 'Vitamin C + madecassoside trial, 20 women' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6290557/', label: 'NIH (PMC): Madecassoside inhibits melanin synthesis by blocking ultraviolet-induced inflammation', chipLabel: 'Madecassoside UV study' },
        ],
        whoItsFor: [
            'People who want a lightweight daily sunscreen that works under makeup',
            'Oily or combination skin looking for a non-sticky gel finish',
            'Not ideal for fragrance-sensitive skin, since it contains added fragrance',
        ],
        howToUse: {
            intro: 'Per kieró\'s own site: use alone or as the last step of your morning routine, before makeup.',
            steps: [
                'Apply evenly to all sun-exposed skin. Use enough: most people apply far less than the amount SPF is tested at.',
                'Apply about 15 minutes before going outside (AAD).',
                'Reapply at least every two hours, and right after swimming or sweating (AAD / FDA).',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/sun-barrier',
            sourceLabel: 'kieroskincare.com: Prime Sun Gel SPF 40+',
        },
        warnings: [
            'Contains added fragrance: patch test if you have fragrance-sensitive skin.',
            'Allergy to ragweed, chamomile, or other daisy-family plants: patch test first.',
            'Have you reacted to ketoprofen (an anti-inflammatory gel)? Octocrylene can cause photoallergic reactions in people sensitized to it.',
            'Not stated as water resistant: reapply after swimming or sweating.',
            'Infants under 6 months: the FDA doesn\'t recommend sunscreen; keep them out of the sun instead.',
        ],
        communityReview: 'kieró\'s US site shows 310 customer reviews, and 287 of them (93%) are five stars; 22 are four stars and one is one star. Most reviews are in Spanish and praise the light texture, fast absorption, and hydrated feel. For example: "Textura ligera y se siente muy bien en la piel" ("Light texture and it feels great on the skin"). On Amazon it has 4.5 out of 5 stars from 34 ratings (75% five-star; 5% two-star, none one-star) as of October 2026. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s product page.',
        effectiveness: 'Daily sunscreen use slowed skin aging and reduced squamous cell carcinoma tumors in a large randomized trial.',
        ingredientScience: [
            {
                name: 'Daily broad-spectrum sunscreen',
                text: 'In the Nambour randomized trial (1,621 adults, SPF 15+), people assigned to daily sunscreen showed no detectable increase in skin aging over 4.5 years, 24% less aging than the discretionary-use group. They had 39% fewer squamous cell carcinoma tumors, though the share of people who got one didn\'t differ significantly, and there was no effect on basal cell carcinoma. Ten years later, the daily group had 11 new melanomas vs 22; that overall difference was just short of statistical significance (p = 0.051), while the drop in invasive melanoma (3 vs 11) was significant.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/10475183/', label: 'PubMed: Daily sunscreen application in prevention of basal-cell and squamous-cell carcinomas, a randomised controlled trial (Green et al., Lancet 1999)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/23732711/', label: 'PubMed: Sunscreen and prevention of skin aging, a randomized trial (Hughes et al., Ann Intern Med 2013)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/21135266/', label: 'PubMed: Reduced melanoma after regular sunscreen use, randomized trial follow-up (Green et al., J Clin Oncol 2011)' },
                ],
            },
            {
                name: 'How much you apply',
                text: 'SPF is measured at 2 mg/cm², but consumers typically apply 0.5–1 mg/cm². Lab studies on volunteers found actual SPF falls significantly at lower amounts. One found SPF 30–50 products may not give enough protection at typical consumer amounts.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/19614894/', label: 'PubMed: The influence of the amount of sunscreen applied on its sun protection factor' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/22463921/', label: 'PubMed: High-SPF sunscreens may compensate for lower user application amounts' },
                ],
            },
            {
                name: 'Chemical UV filters (avobenzone, octocrylene, homosalate, octisalate)',
                text: 'In a 2020 FDA randomized trial of 48 people, all of these filters were absorbed into the bloodstream after a single application, above the level at which the FDA can waive further safety testing. The researchers concluded this does not mean people should stop using sunscreen. A separate lab study found benzophenone, a possible human carcinogen, in all 28 octocrylene-containing products tested. Levels rose with time and heat.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31961417/', label: 'PubMed: Effect of sunscreen application on plasma concentration of sunscreen active ingredients, a randomized clinical trial (JAMA 2020)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/33763894/', label: 'PubMed: The presence of benzophenone in sunscreens and cosmetics containing the organic UV filter octocrylene' },
                ],
            },
            {
                name: 'Panthenol',
                text: 'kieró states this hydrates and strengthens the skin barrier. In a small randomized, double-blind, placebo-controlled study, dexpanthenol (panthenol\'s active form) in two lipophilic creams improved skin hydration and reduced water loss through the skin after 7 days compared with the same creams without it. A 2017 review describes dexpanthenol\'s use as a moisturizer and barrier restorer; three of its four authors work for Bayer Consumer Care.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/10965426/', label: 'PubMed: Effect of topically applied dexpanthenol on epidermal barrier function and stratum corneum hydration (Gehring & Gloor, 2000)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28503966/', label: 'PubMed: Topical use of dexpanthenol, a 70th anniversary article (Proksch et al., 2017)' },
                ],
            },
            {
                name: 'Azulene (sodium guaiazulene sulfonate)',
                text: 'kieró states azulene reduces redness. No human study of sodium guaiazulene sulfonate for redness was found. A 2003 lab study in bacteria found azulene and guaiazulene became mutagenic when exposed to UVA or visible light, though not in the dark. That was not a study in people or skin, it tested guaiazulene rather than the sulfonate form used here, and its relevance to sunscreen use is unknown.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3767376/', label: 'NIH (PMC): Photomutagenicity of cosmetic ingredient chemicals azulene and guaiazulene (2003)' },
                ],
            },
            {
                name: 'Madecassoside (centella)',
                text: 'No study testing madecassoside alone for barrier strength was found. In a 6-month double-blind study of 20 women, a cream combining 5% vitamin C with 0.1% madecassoside improved wrinkles, firmness, and hydration, but the result can\'t be credited to madecassoside alone. In another study, madecassoside reduced UV-triggered inflammation in skin cells and reduced UV tanning on human skin over 8 weeks.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/18503551/', label: 'PubMed: Long-term effects of topical ascorbic acid and madecassoside in photoaged human skin' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6290557/', label: 'NIH (PMC): Madecassoside inhibits melanin synthesis by blocking ultraviolet-induced inflammation' },
                ],
            },
            {
                name: 'Roman chamomile',
                text: 'kieró states this soothes sensitive skin. No study of chamomile flower water for soothing was found. Chamomile is in the daisy (Asteraceae) family, whose compounds are known skin sensitizers that can cross-react with ragweed.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11847717/', label: 'NIH (PMC): Allergic potential of medicinal plants from the Asteraceae family (2025 review)' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/everyday-care/sun-protection/shade-clothing-sunscreen/how-to-apply-sunscreen',
                text: 'American Academy of Dermatology: How to apply sunscreen',
                summary: 'AAD guidance: use SPF 30+ broad-spectrum sunscreen, apply about 15 minutes before going out, and reapply every two hours and after swimming or sweating. This is general guidance, not product-specific validation.',
            },
            {
                url: 'https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun',
                text: 'FDA: Sunscreen, how to help protect your skin from the sun',
                summary: 'FDA guidance: use broad-spectrum SPF 15+, apply 15 minutes before sun exposure, reapply at least every two hours, and keep infants under 6 months out of the sun rather than using sunscreen.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0HBVTHQDG',
                        text: 'Amazon: kieró Prime Sun Gel reviews',
                        summary: '4.5 out of 5 stars from 34 ratings (75% five-star; 5% two-star, none one-star) on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/sun-barrier',
                        text: 'kieroskincare.com: Prime Sun Gel SPF 40+ customer reviews',
                        summary: 'kieró\'s own product page shows 310 reviews, 93% of them five stars, mostly in Spanish (see the Community summary above).',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-kiero-essential-boost-serum',
        name: 'Essential Boost Serum',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'serum', 'niacinamide', 'hyaluronic acid', 'peptides', 'hydration', 'hyperpigmentation', 'vegan'],
        price: '$11.99 for 30 ml (1.01 fl oz)',
        whereToBuy: ['kieró'],
        url: 'https://us.kieroskincare.com/products/essential-boost-serum',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/essential-boost-serum',
        },
        image: '/products/kiero/essential-boost-serum.jpg', // supplied by ayna; same photo as kieró's product page
        summary: 'A lightweight serum with prickly pear, peptides, niacinamide and panthenol, plus several forms of hyaluronic acid. kieró positions it to hydrate, improve firmness, even out skin tone and strengthen the skin barrier for a brighter complexion. Apply a small amount to clean face and neck, morning and night. It is step 3 (treat) of kieró\'s 5-step routine.',
        ingredients: 'Full INCI list per kieró: Water, Butylene Glycol, Glycerin, Panthenol, Dipropylene Glycol, Niacinamide, Benzyl Glycol, Hydroxyethyl Urea, Carbomer, Arginine, Methylpropanediol, Beta-Glucan, Betaine, Ethylhexylglycerin, Protease, Hydrolyzed Sclerotium Gum, Caprylyl Glycol, Adenosine, Mica (CI 77019), 1,2-Hexanediol, Opuntia Ficus-Indica Fruit Extract, Agar, Gellan Gum, Calcium Alginate, Phenoxyethanol, Steareth-30, Madecassoside, Asiaticoside, Asiatic Acid, Madecassic Acid, Sodium Hyaluronate, Hydrolyzed Hyaluronic Acid, Hydrolyzed Sodium Hyaluronate, Dimethylsilanol Hyaluronate, Potassium Hyaluronate, Hyaluronic Acid, Hydroxypropyltrimonium Hyaluronate, Sodium Hyaluronate Crosspolymer, Sodium Hyaluronate Dimethylsilanol, Sodium Acetylated Hyaluronate, Palmitoyl Tetrapeptide-7, Palmitoyl Tripeptide-1, Titanium Dioxide (CI 77891), Iron Oxides Red (CI 77491).',
        safety: {
            fdaStatus: 'Cosmetic serum; not an FDA-cleared drug or medical device. kieró states its products are vegan and cruelty-free; ayna did not independently verify that.',
            materials: 'Water-based gel serum (30 ml / 1.01 fl oz). Key ingredients: panthenol, niacinamide, hydroxyethyl urea, beta-glucan, prickly pear (Opuntia ficus-indica) extract, centella compounds (madecassoside, asiaticoside), ten forms of hyaluronic acid, and two peptides (palmitoyl tetrapeptide-7, palmitoyl tripeptide-1). It also contains a protease enzyme, phenoxyethanol as a preservative, and mica, titanium dioxide and red iron oxide as colorants. kieró doesn\'t list ingredient percentages. No added fragrance appears in the published ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'None reported by kieró. As with any new skincare product, patch test first if you have sensitive skin, and stop using it if you get redness, burning or a rash. Full warnings are listed below.',
            opinionAlerts: 'kieró doesn\'t list the niacinamide percentage, and its firmness and tone claims are its own: no independent study of the finished product, its peptides, or its prickly pear extract was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says the serum hydrates and protects with antioxidants, improves firmness, evens out skin tone, and soothes and strengthens the skin barrier. No independent study of this product was found, so what follows is what the research says about its main ingredients.\n\nNiacinamide has the best evidence. In two 12-week, double-blind, split-face trials, each with 50 women, 5% niacinamide improved fine lines and wrinkles, dark spots, red blotchiness, sallowness and elasticity compared with the same cream without it. Both trials were run by Procter & Gamble, and kieró doesn\'t say how much niacinamide this serum contains.\n\nFor hydration, a randomized trial of 76 women found that 0.1% hyaluronic acid eye creams improved skin hydration and elasticity over 60 days compared with a placebo cream, and the lower-molecular-weight forms also reduced wrinkle depth. Panthenol\'s active form, dexpanthenol, improved hydration and reduced water loss through the skin within 7 days in a small double-blind, placebo-controlled study.\n\nNo independent clinical trial of its two peptides (palmitoyl tetrapeptide-7 and palmitoyl tripeptide-1) or of prickly pear extract on skin was found, so the firmness claim rests on kieró.',
        doctorOpinionShort: 'Niacinamide improved wrinkles, dark spots and redness in two 12-week controlled trials at 5%, but kieró doesn\'t list this serum\'s percentage. Hyaluronic acid and panthenol have small controlled studies for hydration. No independent study of the product, its peptides, or its prickly pear extract was found.',
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/essential-boost-serum', label: 'kieroskincare.com: Essential Boost Serum, ingredient list and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/16029679/', label: 'PubMed: Niacinamide, a B vitamin that improves aging facial skin appearance', chipLabel: 'Niacinamide trial, 50 women (2005)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/18492135/', label: 'PubMed: Topical niacinamide reduces yellowing, wrinkling, red blotchiness, and hyperpigmented spots in aging facial skin', chipLabel: 'Niacinamide trial, 50 women (2004)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/22052267/', label: 'PubMed: Efficacy of cream-based formulations of hyaluronic acid of different molecular weights in anti-wrinkle treatment', chipLabel: 'Hyaluronic acid trial, 76 women (2011)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/10965426/', label: 'PubMed: Effect of topically applied dexpanthenol on epidermal barrier function and stratum corneum hydration', chipLabel: 'Dexpanthenol skin barrier trial (2000)' },
        ],
        whoItsFor: [
            'People who want a lightweight hydrating serum for morning and night',
            'People interested in niacinamide for uneven tone, dark spots or redness',
            'People who prefer a fragrance-free, vegan formula',
        ],
        howToUse: {
            intro: 'Per kieró\'s own site: use as step 3 (treat) of the routine, morning and night.',
            steps: [
                'Cleanse your face first.',
                'Apply a small amount to your face and neck.',
                'Follow with moisturizer, and sunscreen in the morning.',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/essential-boost-serum',
            sourceLabel: 'kieroskincare.com: Essential Boost Serum',
        },
        warnings: [
            'Sensitive skin: patch test first.',
            'Keep out of eyes. If you get redness, burning, or a rash, stop using it.',
        ],
        communityReview: 'kieró\'s US site shows 236 customer reviews, and 213 of them (90%) are five stars; the rest are four stars. Most reviews are in Spanish and describe skin looking hydrated and smoother. For example: "Llevo casi un mes usándolo y mi piel se ve muy hidratada y bonita" ("I\'ve been using it for almost a month and my skin looks very hydrated and pretty"). On Amazon it has 4.4 out of 5 stars from 37 ratings (69% five-star; 8% two-star, none one-star) as of October 2026. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s product page.',
        effectiveness: 'Niacinamide improved wrinkles, dark spots and redness in controlled trials at 5%, and hyaluronic acid and panthenol have small controlled studies for hydration.',
        ingredientScience: [
            {
                name: 'Niacinamide',
                text: 'kieró states this evens out skin tone. In two 12-week, double-blind, split-face trials of 50 women each, 5% niacinamide improved fine lines and wrinkles, dark spots, red blotchiness, sallowness and elasticity compared with the same cream without it, and was well tolerated. Both trials were run by Procter & Gamble. kieró doesn\'t list this serum\'s niacinamide percentage.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/16029679/', label: 'PubMed: Niacinamide, a B vitamin that improves aging facial skin appearance (Bissett et al., 2005)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/18492135/', label: 'PubMed: Topical niacinamide reduces yellowing, wrinkling, red blotchiness, and hyperpigmented spots in aging facial skin (Bissett et al., 2004)' },
                ],
            },
            {
                name: 'Hyaluronic acid',
                text: 'kieró states this hydrates. In a randomized trial of 76 women, eye creams with 0.1% hyaluronic acid applied twice daily for 60 days improved skin hydration and elasticity compared with a placebo cream on the other eye. Only the lower-molecular-weight forms also reduced wrinkle depth. This serum combines ten forms of hyaluronic acid at unlisted amounts.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/22052267/', label: 'PubMed: Efficacy of cream-based formulations of hyaluronic acid of different molecular weights in anti-wrinkle treatment (Pavicic et al., 2011)' },
                ],
            },
            {
                name: 'Panthenol',
                text: 'kieró states this soothes and strengthens the skin barrier. In a small randomized, double-blind, placebo-controlled study, dexpanthenol (panthenol\'s active form) improved skin hydration and reduced water loss through the skin after 7 days compared with the same creams without it. A 2017 review describes its use as a moisturizer and barrier restorer; three of its four authors work for Bayer Consumer Care.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/10965426/', label: 'PubMed: Effect of topically applied dexpanthenol on epidermal barrier function and stratum corneum hydration (Gehring & Gloor, 2000)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28503966/', label: 'PubMed: Topical use of dexpanthenol, a 70th anniversary article (Proksch et al., 2017)' },
                ],
            },
            {
                name: 'Madecassoside (centella)',
                text: 'No study testing madecassoside alone for barrier strength was found. In a 6-month double-blind study of 20 women, a cream combining 5% vitamin C with 0.1% madecassoside improved wrinkles, firmness, and hydration, but the result can\'t be credited to madecassoside alone.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/18503551/', label: 'PubMed: Long-term effects of topical ascorbic acid and madecassoside in photoaged human skin' },
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
                        url: 'https://www.amazon.com/dp/B0FRMCLFT1',
                        text: 'Amazon: kieró Essential Boost Serum reviews',
                        summary: '4.4 out of 5 stars from 37 ratings (69% five-star; 8% two-star, none one-star) on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/essential-boost-serum',
                        text: 'kieroskincare.com: Essential Boost Serum customer reviews',
                        summary: 'kieró\'s own product page shows 236 reviews, 90% of them five stars and the rest four stars, mostly in Spanish (see the Community summary above).',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // kieró Pure Radiant Eye Cream, verified against
    // us.kieroskincare.com/products/pure-radiant-eye-cream on 2026-10-07
    // (description, full INCI, review counts). Contains retinal (a retinoid),
    // so it carries a pregnancy note sourced to a meta-analysis read via NCBI
    // E-utilities. Amazon rating from Amazon's search listing for B0FRMQZRF3.
    {
        id: 'p-kiero-pure-radiant-eye-cream',
        name: 'Pure Radiant Eye Cream',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'eye cream', 'retinal', 'retinoid', 'niacinamide', 'dark circles', 'fine lines', 'vegan'],
        price: '$12.99 for 25 ml (0.85 fl oz)',
        whereToBuy: ['kieró'],
        url: 'https://us.kieroskincare.com/products/pure-radiant-eye-cream',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/pure-radiant-eye-cream',
        },
        image: '/products/kiero/pure-radiant-eye-cream.jpg', // supplied by ayna; same photo as kieró's product page
        summary: 'An eye cream with retinal, pink algae (Dunaliella salina), centella asiatica and niacinamide. kieró positions it to smooth fine lines, brighten dark circles and firm the eye area, in a lightweight formula that soothes delicate skin. Apply a small amount around the eyes once a day, preferably at night. It is step 3 (treat) of kieró\'s 5-step routine.',
        ingredients: 'Full INCI list per kieró: Water, Caprylic/Capric Triglyceride, Glycerin, Butylene Glycol, Pentaerythrityl Tetraethylhexanoate, Polyglyceryl-3 Methylglucose Distearate, Niacinamide, Cetearyl Alcohol, Glyceryl Stearate SE, 1,2-Hexanediol, Cetearyl Olivate, Betaine, Hydroxyacetophenone, Sorbitan Olivate, Glyceryl Stearate, Carbomer, Arginine, Sodium Polyacrylate, Hydrogenated Polydecene, Retinal, Tocopherol, Centella Asiatica Extract, Adenosine, Disodium EDTA, Trideceth-6, Dunaliella Salina Extract, Macadamia Integrifolia Seed Oil, Rosa Canina Fruit Oil, Olea Europaea (Olive) Fruit Oil, Lactobacillus Ferment Lysate, C11-13 Isoparaffin, Bambusa Vulgaris Sap Extract, Caprylyl Glycol, Moringa Oleifera Seed Extract, Thuja Orientalis Leaf Extract, Zanthoxylum Piperitum Fruit Extract, Polygonum Cuspidatum Root Extract, Madecassoside, Dipeptide Diaminobutyroyl Benzylamide Diacetate, Asiaticoside, Ethylhexylglycerin, Asiatic Acid, Madecassic Acid, Centaurea Cyanus Flower Extract, Paeonia Albiflora Flower Extract, Nymphaea Caerulea Flower Extract, Sophora Japonica Flower Extract, Crocus Sativus Flower Extract, Histidine, Taurine, Ornithine, Phenylalanine, Proline, Aspartic Acid, Serine, Alanine, Isoleucine, Methionine, Valine, Leucine, Glycine, Glutamic Acid.',
        safety: {
            fdaStatus: 'Cosmetic eye cream; not an FDA-cleared drug or medical device. kieró states its products are vegan and cruelty-free; ayna did not independently verify that.',
            materials: 'Cream (25 ml / 0.85 fl oz). Key ingredients: retinal (retinaldehyde, a retinoid), niacinamide, pink algae (Dunaliella salina) extract, centella compounds (madecassoside, asiaticoside), adenosine, a peptide (dipeptide diaminobutyroyl benzylamide diacetate), vitamin E, and macadamia, rosehip and olive oils, plus several botanical extracts. kieró doesn\'t list the retinal or niacinamide percentage. No added fragrance appears in the published ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Contains a retinoid. A 2015 meta-analysis found no significant increase in birth defects or miscarriage after topical retinoid use in early pregnancy, but said the data aren\'t strong enough to justify using retinoids while pregnant, so ask your clinician first if you\'re pregnant, trying to conceive or breastfeeding. It also contains macadamia oil and many plant extracts, so patch test first if you have sensitive skin or nut or plant allergies. Full warnings are listed below.',
            opinionAlerts: 'Contains retinal, a retinoid: ask your clinician before using it if you\'re pregnant, trying to conceive or breastfeeding. kieró doesn\'t list its retinal percentage.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says retinal smooths fine lines and wrinkles, the formula brightens dark circles, centella calms and strengthens the eye area, and niacinamide evens out tone. No independent study of this product was found, so what follows is what the research says about its main ingredients.\n\nRetinal (retinaldehyde) is the natural precursor of retinoic acid, the prescription retinoid. In a 3-month randomized, double-blind trial of 40 Korean women, retinal creams at 0.1% and 0.05% applied twice daily improved texture around the crow\'s feet and skin hydration, were well tolerated, and only the 0.1% cream improved pigmentation. The trial compared the two strengths and had no placebo group. kieró doesn\'t list this cream\'s retinal percentage.\n\nNiacinamide improved fine lines, dark spots and redness in two 12-week controlled trials at 5%, run by Procter & Gamble; this cream\'s percentage isn\'t listed. For the pink algae, a placebo-controlled study of a Dunaliella salina extract reported fewer wrinkles and spots under intense sun exposure, but it was run by the company that sells that extract, and it may not be the same extract used here.\n\nRetinoids and pregnancy: a 2015 meta-analysis of 654 pregnancies exposed to topical retinoids found no significant increase in birth defects or miscarriage, but its authors said the data aren\'t strong enough to justify using topical retinoids during pregnancy.',
        doctorOpinionShort: 'Retinal improved skin texture and hydration in a small 3-month trial, and niacinamide has good controlled-trial evidence at 5%, but kieró doesn\'t list either percentage. No independent study of this cream was found. It contains a retinoid, so ask your clinician first if you\'re pregnant, trying to conceive or breastfeeding.',
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/pure-radiant-eye-cream', label: 'kieroskincare.com: Pure Radiant Eye Cream, ingredient list and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29663701/', label: 'PubMed: Efficacy and safety of retinaldehyde 0.1% and 0.05% creams used to treat photoaged skin', chipLabel: 'Retinal trial, 40 women (2018)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/16029679/', label: 'PubMed: Niacinamide, a B vitamin that improves aging facial skin appearance', chipLabel: 'Niacinamide trial, 50 women (2005)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/18492135/', label: 'PubMed: Topical niacinamide reduces yellowing, wrinkling, red blotchiness, and hyperpigmented spots in aging facial skin', chipLabel: 'Niacinamide trial, 50 women (2004)' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8879334/', label: 'NIH (PMC): A Dunaliella salina extract counteracts skin aging under intense solar irradiation', chipLabel: 'Pink algae extract study (2022)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/26215715/', label: 'PubMed: Pregnancy outcomes following first-trimester exposure to topical retinoids, systematic review and meta-analysis', chipLabel: 'Retinoids in pregnancy meta-analysis (2015)' },
        ],
        whoItsFor: [
            'People looking for a gentle retinoid eye cream for fine lines',
            'People interested in niacinamide for dark circles or uneven tone around the eyes',
            'Not for use during pregnancy or while trying to conceive without checking with a clinician first',
        ],
        howToUse: {
            intro: 'Per kieró\'s own site: use once a day, preferably at night.',
            steps: [
                'Apply a small amount to the eye contour area.',
                'Massage gently until absorbed.',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/pure-radiant-eye-cream',
            sourceLabel: 'kieroskincare.com: Pure Radiant Eye Cream',
        },
        warnings: [
            'Pregnant, trying to conceive, or breastfeeding: contains a retinoid (retinal), so ask your clinician first.',
            'Nut or plant allergies (it contains macadamia oil and several plant extracts): patch test first.',
            'Keep out of eyes. If you get redness, burning, or a rash, stop using it.',
        ],
        communityReview: 'kieró\'s US site shows 325 customer reviews, and 291 of them (90%) are five stars; 33 are four stars and one is two stars. Most reviews are in Spanish, and several are from people who had only just started using it. One reviewer wrote that after less than a month: "aún no veo grandes cambios pero sí una mejora en la textura de la piel del contorno de mis ojos" ("I don\'t see big changes yet, but I do see better texture in the skin around my eyes"). On Amazon it has 3.8 out of 5 stars from 55 ratings as of October 2026, noticeably lower than on kieró\'s site. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s search listing.',
        effectiveness: 'Retinal improved skin texture and hydration around the crow\'s feet in a small 3-month trial, and niacinamide improved fine lines and dark spots in controlled trials at 5%.',
        ingredientScience: [
            {
                name: 'Retinal (retinaldehyde)',
                text: 'kieró states this smooths fine lines and wrinkles. In a 3-month randomized, double-blind trial of 40 Korean women, 0.1% and 0.05% retinal creams applied twice daily improved texture around the crow\'s feet (about 13%) and skin hydration, and were well tolerated; only the 0.1% cream improved pigmentation. The trial compared the two strengths and had no placebo group. kieró doesn\'t list this cream\'s retinal percentage.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/29663701/', label: 'PubMed: Efficacy and safety of retinaldehyde 0.1% and 0.05% creams used to treat photoaged skin (Kwon et al., 2018)' },
                ],
            },
            {
                name: 'Topical retinoids in pregnancy',
                text: 'A 2015 meta-analysis of 654 pregnant women exposed to topical retinoids in the first trimester, compared with 1,375 unexposed, found no significant increase in major birth defects, miscarriage, low birth weight or prematurity. Its authors said this can reassure people exposed by accident, but the data aren\'t strong enough to justify using topical retinoids during pregnancy.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/26215715/', label: 'PubMed: Pregnancy outcomes following first-trimester exposure to topical retinoids, systematic review and meta-analysis (Kaplan et al., 2015)' },
                ],
            },
            {
                name: 'Niacinamide',
                text: 'kieró states this evens out skin tone. In two 12-week, double-blind, split-face trials of 50 women each, 5% niacinamide improved fine lines and wrinkles, dark spots, red blotchiness, sallowness and elasticity compared with the same cream without it. Both trials were run by Procter & Gamble and tested the whole face, not the eye area. kieró doesn\'t list this cream\'s niacinamide percentage.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/16029679/', label: 'PubMed: Niacinamide, a B vitamin that improves aging facial skin appearance (Bissett et al., 2005)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/18492135/', label: 'PubMed: Topical niacinamide reduces yellowing, wrinkling, red blotchiness, and hyperpigmented spots in aging facial skin (Bissett et al., 2004)' },
                ],
            },
            {
                name: 'Pink algae (Dunaliella salina extract)',
                text: 'In a placebo-controlled study under intense sun exposure, a Dunaliella salina extract rich in colorless carotenoids reduced skin glycation scores and improved wrinkle counts and spots compared with placebo. The authors work for the company that sells that extract, and it may not be the same extract kieró uses.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8879334/', label: 'NIH (PMC): A Dunaliella salina extract counteracts skin aging under intense solar irradiation (Havas et al., 2022)' },
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
                        url: 'https://www.amazon.com/dp/B0FRMQZRF3',
                        text: 'Amazon: kieró Pure Radiant Eye Cream reviews',
                        summary: '3.8 out of 5 stars from 55 ratings on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/pure-radiant-eye-cream',
                        text: 'kieroskincare.com: Pure Radiant Eye Cream customer reviews',
                        summary: 'kieró\'s own product page shows 325 reviews, 90% of them five stars, mostly in Spanish (see the Community summary above).',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // Joylux, the company, split into its individual products (2026-10-02).
    // Replaces the single 's-joylux' startup entry, which described the whole
    // company as "FDA-cleared devices for vaginal rejuvenation" (false).
    // Sources: each product's page on joylux.com (product data via
    // joylux.com/products.json), the FDA 510(k) and device registration
    // databases (openFDA), and the two PubMed papers Joylux cites (abstracts
    // read via NCBI E-utilities). Bundles, color variants, refills, and
    // accessories (Photonic Gel, Photonic Wipes, chargers) are left out.
    // Not a brand partner; no affiliate links.
    {
        id: 'p-joylux-vfit',
        name: 'vFit® Device',
        brand: 'Joylux',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['menopause', 'discomfort'],
        price: '$395',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/vfit',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/vfit' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/vfit-plus-upgraded-device-259789.jpg?v=1745343867',
        summary: 'An at-home intimate wellness device that you insert into the vagina. It combines red light (six 662 nm LEDs), gentle heat, and vibration in sessions of 6 to 10 minutes. Joylux markets it to midlife women for more natural lubrication, sensation, and confidence, and says it supports pelvic floor strength.',
        safety: {
            fdaStatus: 'Not FDA-cleared or approved. Joylux says the FDA designated vFit a "low-risk general wellness device" in 2017. That category isn\'t reviewed for safety or effectiveness and can\'t claim to treat any condition, including dryness, incontinence, or pelvic floor problems.',
            materials: 'Rechargeable insertable device with six 662 nm red LEDs, heat, and vibration modes. Comes with a USB charging cable and power cube, a storage pouch, and a user guide, per Joylux.',
            recalls: 'No recalls found.',
            sideEffects: 'In the Joylux-funded 2017 study, 2 of 55 women (3.6%) had an adverse event: one urinary tract infection and one case of discomfort from too much warmth. Joylux\'s product page lists no contraindications, so check with your doctor first if you are pregnant, have an IUD or implanted device, or have a vaginal infection or unexplained bleeding.',
            opinionAlerts: 'This is a general wellness device, not an FDA-cleared treatment. The only published study was funded by Joylux, run by its consultants, and had no control group.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s. The study it cites was funded by Joylux and written by Joylux consultants, one of whom is Joylux\'s chief medical officer.',
        doctorOpinion: 'Joylux says vFit is Ob-Gyn designed, supports pelvic floor strength, and that users report more natural lubrication, more sensation, and more confidence.\n\nThe main published evidence, which Joylux cites, is a 2017 study in the International Urogynecology Journal of "multimodal vaginal toning" therapy. 55 women with stress urinary incontinence after childbirth did 24 ten-minute sessions at home over 50 days. Among the 48 who finished, leakage on a pad test and symptom and quality-of-life scores improved substantially. The study had no control group, so it can\'t separate the device\'s effect from placebo or the passage of time. Joylux funded it, and both authors were Joylux consultants.\n\nA 2019 review co-written by Joylux\'s chief medical officer argued that red-light therapy (photobiomodulation) is a plausible approach for vaginal symptoms of menopause, calling the evidence preliminary. It was not a trial of vFit.\n\nThe FDA classes vFit as a general wellness product, so it hasn\'t been reviewed as a treatment. For bothersome dryness, pain with sex, or bladder leaks, talk to a doctor or a pelvic floor physical therapist.',
        doctorOpinionShort: 'A red-light, heat, and vibration device sold for intimate wellness. It is an FDA "general wellness" product, not FDA-cleared. One Joylux-funded study with no control group reported less leakage in 48 women with postpartum stress incontinence.',
        doctorOpinionCitations: [
            { url: 'https://joylux.com/blogs/faq/are-vfit-or-vfit-plus-products-fda-approved', label: 'Joylux FAQ: Are vFit or vFit PLUS products FDA approved?' },
        ],
        whoItsFor: [
            'Midlife women curious about an at-home, drug-free wellness device for intimate comfort, who understand it is not an FDA-cleared treatment',
        ],
        howToUse: {
            intro: 'Per Joylux\'s product page:',
            steps: [
                'Use every other day, starting with 6-minute sessions and working up to 8, then 10 minutes.',
                'For the first 60 days use it 3 times a week, then 1 to 2 times a week to maintain.',
                'Joylux recommends a clear, water-based gel to help with insertion.',
            ],
            sourceUrl: 'https://joylux.com/products/vfit',
            sourceLabel: 'joylux.com: vFit Device',
        },
        warnings: [
            'Not an FDA-cleared treatment for dryness, incontinence, or pelvic floor problems.',
            'Joylux lists no contraindications on the product page. Check with a doctor first if you are pregnant, have an IUD or implanted device, have a vaginal infection, or have unexplained bleeding.',
            'Stop if it causes pain, burning, or too much warmth.',
        ],
        ingredientScience: [
            {
                name: 'The study behind vFit',
                text: 'A 2017 single-group study (no control group) of 55 women with postpartum stress urinary incontinence. They did 24 ten-minute home sessions over 50 days. Of the 38 who had measurable leakage at the start, 84% had more than 50% less leakage on a pad test, and among the 48 who finished, symptom and quality-of-life scores improved. Joylux funded the study, and both authors were Joylux consultants.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28035444/', label: 'PubMed: Multimodal vaginal toning for bladder symptoms and quality of life in stress urinary incontinence (Int Urogynecol J, 2017)' },
                ],
            },
            {
                name: 'Red light (photobiomodulation)',
                text: 'A 2019 review argued red-light therapy may help vaginal symptoms of menopause, calling the evidence preliminary. Its authors include Joylux\'s chief medical officer and a Joylux consultant. It is a review, not a trial of vFit.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31210575/', label: 'PubMed: The rationale for photobiomodulation therapy of vaginal tissue for genitourinary syndrome of menopause (2019 review)' },
                ],
            },
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-vfit-plus',
        name: 'vFit® PLUS',
        brand: 'Joylux',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['menopause', 'discomfort'],
        price: '$494',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/vfit-plus',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/vfit-plus' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/vfit-plus-upgraded-device-259789.jpg?v=1745343867',
        summary: 'The same red-light, heat, and vibration intimate wellness device as vFit, with the PLUS upgrade included: brighter LEDs, a 12-minute session option, and 4 more vibration modes, per Joylux.',
        safety: {
            fdaStatus: 'Not FDA-cleared or approved. Joylux says the FDA designated vFit and vFit PLUS "low-risk general wellness devices" in 2017. That category isn\'t reviewed for safety or effectiveness and can\'t claim to treat any condition.',
            materials: 'Rechargeable insertable device with red LEDs, heat, and vibration, per Joylux.',
            recalls: 'No recalls found.',
            sideEffects: 'Same device as vFit with stronger settings. See the vFit entry: in the Joylux-funded study, 2 of 55 women had an adverse event (one urinary tract infection, one too much warmth).',
            opinionAlerts: 'This is a general wellness device, not an FDA-cleared treatment. The only published study was funded by Joylux and had no control group.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'vFit PLUS is the vFit device with brighter LEDs, a longer session option, and more vibration modes. No study comparing PLUS with the standard vFit was found. The evidence is the same as for vFit: one Joylux-funded study of 55 women with postpartum stress incontinence, with no control group. See the vFit entry for details.',
        doctorOpinionShort: 'vFit with stronger settings. An FDA "general wellness" product, not FDA-cleared. No study compares it with the standard vFit.',
        doctorOpinionCitations: [
            { url: 'https://joylux.com/blogs/faq/are-vfit-or-vfit-plus-products-fda-approved', label: 'Joylux FAQ: Are vFit or vFit PLUS products FDA approved?' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/28035444/', label: 'PubMed: Multimodal vaginal toning for bladder symptoms and quality of life in stress urinary incontinence (Int Urogynecol J, 2017)' },
        ],
        warnings: [
            'Not an FDA-cleared treatment for dryness, incontinence, or pelvic floor problems.',
            'Check with a doctor first if you are pregnant, have an IUD or implanted device, have a vaginal infection, or have unexplained bleeding.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-juicy-like-a-peach',
        name: 'JUICY LIKE A PEACH® Vaginal Gel',
        brand: 'Joylux',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'sexual-health'],
        tags: ['menopause', 'discomfort', 'hormone-free'],
        price: '$59 for 30 applications',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/juicy-like-a-peach',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/juicy-like-a-peach' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/juicy-like-a-peach-3736266.jpg?v=1781733740',
        summary: 'A hormone-free vaginal gel (pH 3.8) applied inside the vagina once a day with an applicator. Joylux markets it for menopausal dryness and pain during sex, saying it forms a moisture barrier on vaginal tissue.',
        ingredients: 'Purified water, hypromellose, benzoic acid, lactic acid, sodium hydroxide, per Joylux.',
        safety: {
            fdaStatus: 'FDA-cleared as a personal lubricant (Class II). Joylux\'s FDA listing for this gel cites 510(k) K200098, a clearance held by Peptonic Medical for its VagiVital Aktivgel. A personal-lubricant clearance covers lubrication and moisture; it is not an FDA approval to treat menopause.',
            materials: '36 g tube with an applicator, 30 pre-measured 1 mL doses, per Joylux.',
            recalls: 'No recalls found.',
            sideEffects: 'Per Joylux: possible mild, short-lived itching, irritation, burning, or discharge; rarely severe irritation or urinary tract infection. Stop and see a doctor if symptoms persist.',
            opinionAlerts: 'Not compatible with natural rubber latex or polyurethane condoms, per Joylux. It is only compatible with polyisoprene condoms.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; regulatory status verified in the FDA 510(k) and registration databases.',
        doctorOpinion: 'Joylux says the gel relieves vaginal dryness and pain during sex and that comfort builds with daily use. It calls the product "clinically studied," but its page doesn\'t name or link a study, and ayna didn\'t find one for this product. Its FDA clearance is as a personal lubricant. If dryness or pain persists, talk to a doctor.',
        doctorOpinionShort: 'A hormone-free vaginal gel, FDA-cleared as a personal lubricant. Joylux markets it for menopausal dryness and pain with sex but doesn\'t cite a study. Not compatible with latex condoms.',
        doctorOpinionCitations: [
            { url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K200098', label: 'FDA 510(k) K200098: VagiVital Aktivgel (Peptonic Medical), personal lubricant, cleared 2020' },
        ],
        howToUse: {
            intro: 'Per Joylux\'s product page:',
            steps: [
                'Use once a day, preferably before bed.',
                'Attach the applicator, fill it to 1 mL, insert gently, and press the plunger.',
                'Rinse the applicator with warm water and antibacterial soap after each use.',
            ],
            sourceUrl: 'https://joylux.com/products/juicy-like-a-peach',
            sourceLabel: 'joylux.com: JUICY LIKE A PEACH',
        },
        warnings: [
            'Not compatible with natural rubber latex or polyurethane condoms.',
            'Stop and see a doctor if itching, burning, or irritation persists.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-lets-spin',
        name: 'LET\'S SPIN® Intimacy Gel',
        brand: 'Joylux',
        category: 'sex-tech',
        type: 'physical',
        internal: false,
        healthFunctions: ['sexual-health', 'vaginal-health'],
        tags: ['menopause', 'discomfort', 'hormone-free'],
        price: '$45 for 60 mL',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/lets-spin-intimacy-gel',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/lets-spin-intimacy-gel' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/lets-spin-intimacy-gel-422294.jpg?v=1727172815',
        summary: 'A water-based intimacy gel with hyaluronic acid and aloe, made with Respin (Halle Berry\'s brand). Joylux markets it to moisturize, supplement natural lubrication, and make sex more comfortable when dryness or hormonal changes get in the way.',
        ingredients: 'Water (Aqua), Sodium Hyaluronate, Propanediol, Hydroxyethylcellulose, Xanthan Gum, Sodium Hydroxide, Sodium Benzoate, Potassium Sorbate, Citric Acid, Aloe Vera 200X Powder, Gluconolactone, per Joylux.',
        safety: {
            fdaStatus: 'FDA-cleared as a personal lubricant (Class II): 510(k) K242958, "Joylux Intimacy Gel," cleared March 20, 2025. Joylux\'s FDA listing names it as LET\'S SPIN.',
            materials: '60 mL pump bottle (a mini tube is also sold), pH 4.0–5.0, per Joylux.',
            recalls: 'No recalls found.',
            sideEffects: 'Stop if irritation develops.',
            opinionAlerts: 'Compatible with natural rubber latex and polyisoprene condoms, but not polyurethane condoms, per Joylux.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; regulatory status verified in the FDA 510(k) database.',
        doctorOpinion: 'This is an FDA-cleared, water-based personal lubricant. Joylux also calls it "clinically proven," but its page doesn\'t name or link a study.',
        doctorOpinionShort: 'A water-based lubricant with hyaluronic acid and aloe, FDA-cleared as a personal lubricant (K242958). Latex-condom compatible.',
        doctorOpinionCitations: [
            { url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K242958', label: 'FDA 510(k) K242958: Joylux Intimacy Gel (PG3100), personal lubricant, cleared 2025' },
        ],
        howToUse: {
            intro: 'Per Joylux\'s product page: apply as much as you like to intimate areas and reapply as often as needed. Store at room temperature.',
            steps: [],
            sourceUrl: 'https://joylux.com/products/lets-spin-intimacy-gel',
            sourceLabel: 'joylux.com: LET\'S SPIN Intimacy Gel',
        },
        warnings: [
            'Not compatible with polyurethane condoms.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-reliefher',
        name: 'reliefHER™ Vaginal Hydration Melts',
        brand: 'Joylux',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['menopause', 'discomfort', 'hormone-free'],
        price: '$49 for 10 melts',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/reliefher',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/reliefher' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/reliefHER_10pack_HERO.jpg?v=1782326170',
        summary: 'Non-hormonal vaginal melts made with coconut oil, cocoa butter, vitamin E, and hyaluronic acid (15 mg per melt, per Joylux). You insert one at bedtime every 2 to 3 days for vaginal hydration.',
        ingredients: 'Coconut Oil, Vitamin E, Hyaluronic Acid, Silica, Cocoa Butter, per Joylux.',
        safety: {
            fdaStatus: 'Not listed with the FDA as a medical device (checked 2026-10-02); sold as a personal-care product.',
            materials: 'Solid melts that dissolve at body temperature. Store somewhere cool.',
            recalls: 'No recalls found.',
            sideEffects: 'Per Joylux: stop if irritation develops. Check with a doctor first if you have a vaginal infection, unusual bleeding, a recent procedure or childbirth, open sores, or an allergy to any ingredient.',
            opinionAlerts: 'Contains coconut oil and cocoa butter. The CDC warns that oil-based products can cause condoms to break, and Joylux\'s page doesn\'t address condom compatibility.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Joylux describes these as hyaluronic-acid melts for vaginal hydration, "backed by science," but doesn\'t name or link a study for this product, and ayna didn\'t find one.',
        doctorOpinionShort: 'Oil-based vaginal melts with hyaluronic acid. Not an FDA-listed medical device. No product-specific study found.',
        doctorOpinionCitations: [
            { url: 'https://www.cdc.gov/condom-use/resources/external.html', label: 'CDC: How to use an external condom (oil-based products can cause condoms to break)' },
        ],
        howToUse: {
            intro: 'Per Joylux\'s product page:',
            steps: [
                'Wash your hands, then insert 1 melt into the vagina, as deep as is comfortable, preferably at bedtime.',
                'Use every 2 to 3 days, or as needed.',
                'Store in a cool place; a chilled melt stays firm.',
            ],
            sourceUrl: 'https://joylux.com/products/reliefher',
            sourceLabel: 'joylux.com: reliefHER Vaginal Hydration Melts',
        },
        warnings: [
            'Vaginal infection, unusual bleeding, recent procedure or childbirth, or open sores: check with a doctor first.',
            'Contains oils; the CDC warns oil-based products can cause condoms to break.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-revitalizher',
        name: 'revitalizHER™ Hydrating Serum',
        brand: 'Joylux',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['menopause', 'discomfort'],
        price: '$49 for 30 mL',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/revitalizher',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/revitalizher' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/revitalizher-hydrating-serum-987054.jpg?v=1742591593',
        summary: 'An oil-based serum for the external vulva, made with coconut, sea buckthorn, and jojoba oils plus beeswax, vitamin E, vitamin C, and mandarin orange peel oil. Joylux markets it to shield against dryness.',
        ingredients: 'Caprylic/Capric Triglyceride, Cocos Nucifera (Coconut) Oil, Hippophae Rhamnoides (Sea Buckthorn) Oil, Beeswax, Simmondsia Chinensis (Jojoba) Oil, Tocopherol (Vitamin E), Tetrahexyldecyl Ascorbate (Vitamin C), Citrus Nobilis (Mandarin Orange) Peel Oil, per Joylux.',
        safety: {
            fdaStatus: 'Not listed with the FDA as a medical device (checked 2026-10-02); sold as a cosmetic.',
            materials: '30 mL serum.',
            recalls: 'No recalls found.',
            sideEffects: 'For external use on the vulva only. Do not use internally, per Joylux. It contains mandarin orange peel oil.',
            opinionAlerts: 'External use only, per Joylux.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'An oil-based external moisturizer. Joylux doesn\'t cite a study for this product, and ayna didn\'t find one.',
        doctorOpinionShort: 'An external vulvar oil serum. Cosmetic, not FDA-listed. No product-specific study found.',
        howToUse: {
            intro: 'Per Joylux\'s product page: after cleansing, pat dry and apply to the external vulva. Don\'t rinse. Don\'t use internally.',
            steps: [],
            sourceUrl: 'https://joylux.com/products/revitalizher',
            sourceLabel: 'joylux.com: revitalizHER Hydrating Serum',
        },
        warnings: [
            'External use only.',
            'Stop if it stings or irritates.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-shebar',
        name: 'SHEbar® Intimate Cleansing Bar',
        brand: 'Joylux',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['comfort'],
        price: '$13 for 3.2 oz',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/shebar',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/shebar' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/SHEbar_Packshot_2.jpg?v=1778785371',
        summary: 'A soap-free cleansing bar for intimate areas (pH about 4.5, per Joylux) with coconut, argan, and avocado oils. It contains added fragrance.',
        ingredients: 'Sodium Cocoyl Isethionate, Hydrogenated Vegetable Oil, Polyglyceryl-4 Laurate, Water, Glycerin, Fragrance, Titanium Dioxide (CI 77891), Cocos Nucifera (Coconut) Oil, Argania Spinosa Kernel Oil, Persea Gratissima (Avocado) Oil, Tetrasodium Glutamate Diacetate, per Joylux.',
        safety: {
            fdaStatus: 'Cosmetic cleanser; not an FDA-regulated medical device.',
            materials: '3.2 oz (90.7 g) bar.',
            recalls: 'No recalls found.',
            sideEffects: 'Contains added fragrance. Stop if it causes itching or burning.',
            opinionAlerts: 'Contains added fragrance.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'A soap-free bar built on sodium cocoyl isethionate, a syndet surfactant; reviews describe syndets as gentler on the skin barrier than soap. It does contain added fragrance. Joylux doesn\'t cite a study for this product.',
        doctorOpinionShort: 'A mild, soap-free bar, but it contains added fragrance.',
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8954092/', label: 'NIH (PMC): Skin cleansing without or with compromise, soaps and syndets (2022 review)' },
        ],
        warnings: [
            'Contains fragrance; stop if it causes itching or burning.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-ilyeo-body',
        name: 'ILYEO™ body',
        brand: 'Joylux',
        category: 'pain-relief',
        type: 'physical',
        internal: false,
        healthFunctions: ['comfort'],
        tags: ['menopause', 'discomfort'],
        price: '$199',
        fsaHsaEligible: true,
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/ilyeo-body',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/ilyeo-body' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/ilyeo-body-8041504.jpg?v=1789522687',
        summary: 'A flexible, cordless silicone wrap that combines red light, heat, and vibration for muscle and joint pain. Joylux markets it to midlife women; it is used for 10-minute sessions on areas like the shoulders or knees. Listed as a pre-order shipping the week of October 5 at time of writing.',
        safety: {
            fdaStatus: 'FDA-registered Class II therapeutic infrared heating lamp, exempt from 510(k) premarket review. Verified in the FDA device registration database (2026-10-02); Joylux\'s page says the same.',
            materials: 'Flexible medical-grade silicone wrap with red light, heat, and vibration, per Joylux.',
            recalls: 'No recalls found.',
            sideEffects: 'Per Joylux: don\'t use if you take medications or products that increase light sensitivity, have impaired sensation in the area, or have active skin cancer or suspicious lesions. Ask your doctor first if you are pregnant or have a history of skin cancer. On darker skin tones, start with 2-minute sessions and work up to 10.',
            opinionAlerts: 'Exempt devices like this aren\'t reviewed by the FDA for effectiveness. Joylux calls it "clinically proven" but doesn\'t name a study.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; regulatory status verified in the FDA registration database.',
        doctorOpinion: 'Joylux says ILYEO body is indicated for temporary relief of minor muscle and joint pain, arthritis pain and stiffness, and muscle spasms, and to temporarily increase local blood circulation. It is registered with the FDA but exempt from premarket review, so the FDA hasn\'t evaluated its effectiveness. Joylux calls it "clinically proven" without naming a study, and ayna didn\'t find one for this device.',
        doctorOpinionShort: 'A red-light, heat, and vibration wrap for minor muscle and joint pain. FDA-registered Class II and exempt from review; no product-specific study found.',
        howToUse: {
            intro: 'Per Joylux\'s product page: 10-minute sessions, daily or as needed, following the protocol in the ILYEO app for the area being treated.',
            steps: [
                'On darker skin tones, start with 2-minute sessions and gradually increase to 10.',
            ],
            sourceUrl: 'https://joylux.com/products/ilyeo-body',
            sourceLabel: 'joylux.com: ILYEO body',
        },
        warnings: [
            'Don\'t use if you take light-sensitizing medications or products, have impaired sensation in the area, or have active skin cancer or suspicious lesions.',
            'Pregnant, or a history of skin cancer: ask your doctor first.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-joylux-coldher',
        name: 'coldHER™ Cooling Bra Inserts',
        brand: 'Joylux',
        category: 'menopause',
        type: 'physical',
        internal: false,
        healthFunctions: ['perimenopause'],
        tags: ['menopause', 'comfort'],
        price: '$21 for 2 pads',
        whereToBuy: ['Joylux'],
        url: 'https://joylux.com/products/coldher',
        whereToBuyLinks: { Joylux: 'https://joylux.com/products/coldher' },
        image: 'https://cdn.shopify.com/s/files/1/1120/5174/files/coldher-cooling-bra-inserts-9258458.jpg?v=1753846926',
        summary: 'Reusable cooling pads made with phase-change material, which absorbs body heat as it melts. You tuck them into your bra for hot flashes, breast or nipple soreness, or cooling down after exercise. They re-harden at room temperature in about 30 minutes, or faster in the fridge.',
        safety: {
            fdaStatus: 'FDA-registered Class I reusable hot/cold pack, exempt from premarket review (verified in the FDA device registration database, 2026-10-02). Joylux sells it as a general wellness product.',
            materials: 'Two pads of phase-change material, per Joylux.',
            recalls: 'No recalls found.',
            sideEffects: 'Stop if your skin becomes irritated. Wipe clean with a damp cloth and mild soap.',
            opinionAlerts: 'Gives temporary cooling comfort; it doesn\'t treat the cause of hot flashes.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are Joylux\'s; regulatory status verified in the FDA registration database.',
        doctorOpinion: 'A simple reusable cooling pad for temporary comfort during hot flashes or breast soreness. If hot flashes are frequent or disrupt your sleep, talk to a doctor about treatments that reduce them.',
        doctorOpinionShort: 'Reusable cooling pads for temporary relief during hot flashes or breast soreness. FDA-registered Class I.',
        howToUse: {
            intro: 'Per Joylux\'s product page:',
            steps: [
                'Tuck the pads into your bra strap with the cooling material against your skin, at the top of the breasts, under the arms, or wherever you need it.',
                'For nipple soreness, place a pad directly over the nipple.',
                'Re-cool at room temperature (about 30 minutes) or in the fridge.',
            ],
            sourceUrl: 'https://joylux.com/products/coldher',
            sourceLabel: 'joylux.com: coldHER Cooling Bra Inserts',
        },
        warnings: [
            'Stop if your skin becomes irritated.',
        ],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [] } },
        integrations: [],
        badges: [],
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
        price: 'About $7.77',
        priceNote: 'Sold in euros and converted to US dollars (October 2026 rate); your card may show a slightly different amount.',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/mypelvicbra%C2%AE-pink-prolapse-chicken',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/mypelvicbra%C2%AE-pink-prolapse-chicken?bg_ref=bZYYwMBpTa',
        image: 'https://cdn.shopify.com/s/files/1/0640/1513/8877/files/36.png?v=1788468282',
        summary: 'A soft, squeezable pelvic-health demonstration tool from My Pelvic Bra, founded by pelvic floor physical therapist Jeanice Mitchell, PT, designed to make pelvic organ prolapse education easier to visualize, including how external perineal compression can provide support from below.',
        safety: {
            fdaStatus: 'Educational demonstration item; not an FDA-cleared medical device or treatment.',
            materials: 'Soft squeezable demonstration tool; exact material composition was not listed on the product page.',
            recalls: 'No recalls found.',
            sideEffects: 'For education and demonstration only. It does not diagnose, treat, or correct pelvic organ prolapse.',
            opinionAlerts: 'The educational explanation is sourced from My Pelvic Bra’s product page.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Educational positioning is sourced from My Pelvic Bra, founded by pelvic floor physical therapist Jeanice Mitchell, PT, MPT, WCS, BCB-PMD; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'The product is intended as a hands-on teaching aid for explaining prolapse and external support concepts, not as a therapeutic device. Pelvic organ prolapse is genuinely common, ACOG estimates women in the US have a 13% lifetime risk of undergoing surgery for it, so a visual, tactile teaching tool like this has real educational value for explaining a condition many people have never had described to them clearly.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/31651832/', label: 'ACOG Practice Bulletin 214: Pelvic Organ Prolapse' },
        ],
        effectiveness: 'Educational demonstration tool only; it is not intended to provide a clinical treatment effect.',
        // Category-level citation shown only on the Scientific literature
        // tab, kept out of verificationLinks so it doesn't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/31651832/',
                text: 'ACOG Practice Bulletin 214: Pelvic Organ Prolapse',
                summary: 'Women in the US have a 13% lifetime risk of surgery for pelvic organ prolapse, real epidemiological context for why prolapse education matters.',
            },
        ],
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
        price: 'About $8.88',
        priceNote: 'Sold in euros and converted to US dollars (October 2026 rate); your card may show a slightly different amount.',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/waistband-extenders',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/waistband-extenders?bg_ref=bZYYwMBpTa',
        image: 'https://cdn.shopify.com/s/files/1/0640/1513/8877/files/WaistbandExtenders_4.jpg?v=1766335111',
        summary: 'A set of two removable waistband extenders from My Pelvic Bra that adds extra room to a Pelvic Bra® while preserving its intended support and compression. S-series fits the Classic; L-series fits the wider Classic Plus waistband.',
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
        price: 'About $87',
        priceNote: 'Sold in euros and converted to US dollars (October 2026 rate); your card may show a slightly different amount.',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE-classic-plus',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/classic-pelvic-bra%C2%AE-classic-plus?bg_ref=bZYYwMBpTa',
        image: 'https://cdn.shopify.com/s/files/1/0640/1513/8877/files/6.png?v=1788247226',
        summary: 'The fuller-coverage Pelvic Bra® style from My Pelvic Bra (founded by pelvic floor physical therapist Jeanice Mitchell, PT (see the Classic Pelvic Bra entry for her story)) with a wider adjustable waistband and reinforced supportive hammock for people wanting more substantial external pelvic-floor and perineal support during daily activity.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device and not a corrective treatment for prolapse.',
            materials: 'Breathable, skin-friendly stretch fabric with reinforced hammock, creaseless gusset, sweat-wicking liner, and wider adjustable hook-and-eye waistband, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Use the minimum compression needed for comfort and support. Remove for sleep and reduce or stop use if the garment causes pain, numbness, skin irritation, or worsening symptoms.',
            opinionAlerts: 'Support and symptom-relief descriptions are sourced from My Pelvic Bra; product-specific clinical outcomes have not been independently established.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Same founder (Jeanice Mitchell, PT, MPT, WCS, BCB-PMD) and brand as the Classic Pelvic Bra; no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'My Pelvic Bra positions Classic Plus as its maximum-support, fuller-coverage adjustable option for external pelvic-floor and perineal support during standing, walking, lifting, exercise, pregnancy, and postpartum activity: the same fabric and design approach as the Classic Pelvic Bra, just wider coverage and a reinforced hammock for more substantial support.\n\nSee the Classic Pelvic Bra entry for the independent research on external pelvic compression garments as a category (a 2026 study found real biomechanical/perceived-support benefits; an earlier pilot study found no significant quality-of-life change from a similar product): that research applies to the garment category generally, not this specific style, and no independent clinical study of Classic Plus itself was found.',
        doctorOpinionShort: 'Same brand, founder, and fabric approach as the Classic Pelvic Bra, with wider coverage and a reinforced hammock for more support. See the Classic Pelvic Bra entry for the mixed independent research on external compression garments as a category. No independent study of this specific style was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41586016/', label: 'PubMed: Pelvic compression garments alter running biomechanics, perceived support, and fear of symptoms in postpartum women with pelvic floor dysfunction' },
            { url: 'https://doi.org/10.1007/s00192-008-0676-x', label: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse, a pilot study' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women wanting more substantial external pelvic-floor and perineal support than the Classic style provides',
            'Pregnancy and postpartum use, or anyone with more pronounced heaviness/pressure symptoms during standing, walking, lifting, or exercise',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // mypelvicbra.shop/products/classic-pelvic-bra-classic-plus.
        howToUse: {
            intro: 'Per My Pelvic Bra\'s own site: wear during activities that stress the pelvic floor, adjusting the wider hook-and-eye waistband for a comfortable, supportive fit.',
            steps: [
                'Adjust the wider hook-and-eye waistband for comfortable, supportive coverage.',
                'Wear during standing, walking, lifting, exercise, or other pelvic-floor-stressing activity.',
                'Use the minimum compression needed for comfort and support.',
                'Remove for sleep, per the brand.',
            ],
            sourceUrl: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE-classic-plus',
            sourceLabel: 'mypelvicbra.shop: Classic Plus Pelvic Bra',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not designed to correct prolapse: this is symptom-management support wear, not a structural treatment, per the brand.',
            'Remove for sleep, and use the minimum compression needed for comfort and support.',
            'Reduce or stop use if the garment causes pain, numbness, skin irritation, or worsening symptoms.',
        ],
        communityReview: 'No independently verified customer review data was found for this product at time of writing.',
        effectiveness: 'Positioned as external symptom-management support wear rather than a corrective device. See the Classic Pelvic Bra entry for the mixed independent research on external compression garments as a category; no independent clinical study of the Classic Plus product specifically was found.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/41586016/',
                text: 'PubMed: Pelvic compression garments alter running biomechanics, perceived support, and fear of symptoms in postpartum women with pelvic floor dysfunction',
                summary: '2026 exploratory, randomized crossover study, 13 postpartum runners. Found real biomechanical improvements and increased perceived pelvic floor/core support. General category evidence, not product-specific.',
            },
            {
                url: 'https://doi.org/10.1007/s00192-008-0676-x',
                text: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse, a pilot study',
                summary: '13 women with prolapse. Found no significant quality-of-life improvement on validated questionnaires, though some participants subjectively felt relief. Included for balance, a real negative finding for a similar (not identical) product.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.mypelvicbra.shop/collections/all/products/classic-pelvic-bra%C2%AE-classic-plus',
                        text: 'mypelvicbra.shop: Classic Plus Pelvic Bra, customer reviews',
                        summary: 'The Classic Plus Pelvic Bra\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-mypelvicbra-sports',
        name: 'Sports Pelvic Bra®',
        brand: 'My Pelvic Bra',
        category: 'pelvic-floor',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['pelvic-floor', 'postpartum', 'comfort', 'bladder-leaks', 'fitness'],
        price: '$49.00',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/sports-pelvic-bra%C2%AE',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/sports-pelvic-bra%C2%AE?bg_ref=bZYYwMBpTa',
        image: '/products/mypelvicbra/sports-pelvic-bra.webp',
        summary: 'From My Pelvic Bra: founded by pelvic floor physical therapist Jeanice Mitchell, PT (see the Classic Pelvic Bra entry for her story). The Sports Pelvic Bra is a lightweight, fully adjustable style with a snug bikini-style fit for activities where an extra pelvic-floor lift is wanted, per the brand\'s own site.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device and not a corrective treatment for prolapse.',
            materials: 'Premium, breathable, skin-friendly stretch fabric with a slim, seamless construction, creaseless gusset, reinforced hammock, sweat-wicking liner, and a fully adjustable, bra-like tightening system with a flexible contoured waistband that raises or lowers for the amount of support needed, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Use the minimum compression needed for comfort and support. Remove for sleep and reduce or stop use if the garment causes pain, numbness, skin irritation, or worsening symptoms.',
            opinionAlerts: 'Fit and support descriptions are sourced from My Pelvic Bra\'s product page; product-specific clinical outcomes have not been independently established.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Same founder (Jeanice Mitchell, PT, MPT, WCS, BCB-PMD) and brand as the Classic Pelvic Bra; no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'My Pelvic Bra positions the Sports style as its lightest-weight, most activity-focused option: a fully adjustable, seamless design meant to disappear under workout clothing while giving a custom, secure fit for sports and other movement.\n\nSee the Classic Pelvic Bra entry for the independent research on external pelvic compression garments as a category (a 2026 study found real biomechanical and perceived-support benefits specifically in postpartum runners; an earlier pilot study found no significant quality-of-life change from a similar product): that research applies to the garment category generally, not this specific style, and no independent clinical study of the Sports Pelvic Bra itself was found.',
        doctorOpinionShort: 'Same brand and founder as the Classic Pelvic Bra, in a lighter-weight, more activity-focused design. See the Classic Pelvic Bra entry for the mixed independent research on external compression garments as a category. No independent study of this specific style was found.',
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women wanting a lightweight, seamless option for sports, running, or other workouts',
            'Anyone who wants a custom, adjustable fit that disappears under athletic clothing',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // mypelvicbra.shop/products/sports-pelvic-bra.
        howToUse: {
            intro: 'Per My Pelvic Bra\'s own site: use the bra-like tightening system and contoured waistband to dial in support before activity.',
            steps: [
                'Adjust the bra-like tightening system for a custom, secure fit.',
                'Raise or lower the flexible, contoured waistband depending on how much support is needed.',
                'Wear during sports, running, or other movement where extra pelvic-floor lift is wanted.',
                'Remove for sleep, per the brand.',
            ],
            sourceUrl: 'https://www.mypelvicbra.shop/products/sports-pelvic-bra%C2%AE',
            sourceLabel: 'mypelvicbra.shop: Sports Pelvic Bra',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not designed to correct prolapse: this is symptom-management support wear, not a structural treatment, per the brand.',
            'Remove for sleep, and use the minimum compression needed for comfort and support.',
            'Reduce or stop use if the garment causes pain, numbness, skin irritation, or worsening symptoms.',
        ],
        communityReview: 'No independently verified customer review data was found for this product at time of writing.',
        effectiveness: 'Positioned as external symptom-management support wear rather than a corrective device. See the Classic Pelvic Bra entry for the mixed independent research on external compression garments as a category; no independent clinical study of the Sports Pelvic Bra specifically was found.',
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.mypelvicbra.shop/collections/all/products/sports-pelvic-bra%C2%AE',
                        text: 'mypelvicbra.shop: Sports Pelvic Bra, customer reviews',
                        summary: 'The Sports Pelvic Bra\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing, read them directly on the page.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // SootheHer brand partnership (2026-09-16), affiliate links supplied by
    // Ayna (collabs.shop short links carrying the AYNA discount/tracking
    // code); product facts, pricing, and safety details checked live against
    // sootheher.com on 2026-09-16. Category is 'cramp-relief', not a pelvic
    // floor trainer/exerciser: Elaris is a TENS device for menstrual cramp
    // pain, not a device that trains or contracts the pelvic floor.
    {
        id: 'p-sootheher-elaris-pod',
        name: "SootheHer's Elaris Pod",
        brand: 'SootheHer',
        category: 'cramp-relief',
        type: 'physical',
        internal: false,
        healthFunctions: ['cramp-relief'],
        tags: ['cramps', 'discomfort', 'wearable', 'drug-free'],
        price: '$89.99 (list $120)',
        whereToBuy: [], // direct-to-consumer only; affiliateUrl below covers it
        url: 'https://sootheher.com/',
        // Ayna affiliate partnership, affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://collabs.shop/jfue1u',
        image: 'https://sootheher.com/assets/elaris-butterfly-hero-DnUO3OIN.webp',
        summary: 'A discreet, wearable TENS (transcutaneous electrical nerve stimulation) device for menstrual cramps. A butterfly-shaped gel pad worn on the lower abdomen sends adjustable electrical pulses meant to block pain signals, prompt endorphin release, and relax uterine muscles, worn under clothing, drug-free.',
        safety: {
            fdaStatus: 'SootheHer says the Elaris Pod is FDA-cleared. ayna could not find it in the FDA\'s 510(k) or device-listing databases under the SootheHer or Elaris name (checked 2026-10-02). TENS devices are sometimes cleared under the manufacturer\'s name, so the clearance has not been confirmed either way.',
            materials: 'Device, reusable butterfly and circular gel pads, connecting wire, USB-C charging cable, user manual, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states not for use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition, consult a clinician first if any of these apply.',
            opinionAlerts: 'Brand cites a 4.8-star rating across 718 reviews and offers a 30-day money-back guarantee, brand-hosted figures, not independently verified here.',
        },
        // Per the Oct 15 product page audit: the opinion is ayna's summary of a
        // Cochrane review and a systematic review/meta-analysis, so it is independent.
        clinicianOpinionSource: 'independent',
        clinicianAttribution: "ayna's summary of a 2024 Cochrane review and a systematic review and meta-analysis of TENS for period pain. Not a direct clinician quote.",
        doctorOpinion: 'TENS (transcutaneous electrical nerve stimulation) has real supportive evidence for reducing primary dysmenorrhea pain via the gate-control mechanism the brand describes; this does not independently establish that the Elaris Pod specifically matches published TENS study outcomes. A 2024 Cochrane review found both high- and low-frequency TENS may reduce period pain compared with placebo or no treatment, though the reviewers downgraded their certainty because of risk of bias in the underlying trials, and a separate 2024 meta-analysis (10 RCTs, 469 women) found a statistically significant effect but with very high heterogeneity between studies: real evidence for the modality, with genuine uncertainty about how much relief to expect from any one device.',
        doctorOpinionCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013331.pub2/abstract', label: 'Cochrane: TENS for pain control in primary dysmenorrhea (2024)' },
            { url: 'https://doi.org/10.1080/17581869.2026.2714978', label: 'Pain Management: TENS for primary dysmenorrhea, systematic review & meta-analysis' },
        ],
        whoItsFor: [
            'People looking for a drug-free, reusable option for period cramp pain alongside or instead of OTC pain relievers',
            'Not recommended for anyone with a pacemaker, epilepsy, a heart rhythm condition, or who is pregnant, per the brand',
            'Best understood as a real but variable-benefit option: trial evidence for TENS generally is genuinely mixed on how much relief to expect',
        ],
        warnings: [
            'Do not use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition, per the brand.',
            'Persistent, severe, or worsening pelvic pain (or pain that doesn\'t respond to typical measures) warrants clinical evaluation.',
        ],
        effectiveness: 'Positioned by the brand as fast-acting, drug-free cramp relief; no independently conducted clinical study of this specific device was found here. TENS as a pain-relief category has supportive evidence for dysmenorrhea.',
        scientificCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013331.pub2/abstract', text: 'Cochrane: Transcutaneous electrical nerve stimulation (TENS) for pain control in women with primary dysmenorrhoea', summary: '2024 Cochrane review: both high- and low-frequency TENS may reduce pain vs. placebo/no treatment, though certainty was downgraded for risk of bias in the underlying trials.' },
            { url: 'https://doi.org/10.1080/17581869.2026.2714978', text: 'Pain Management: Transcutaneous electrical nerve stimulation in the relief of primary dysmenorrhea, systematic review and meta-analysis', summary: '10 RCTs, 469 women: statistically significant reduction in pain intensity favoring TENS, with very high heterogeneity between studies.' },
        ],
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-sootheher-gel-pad-refills',
        name: 'SootheHer Gel Pad Refills',
        brand: 'SootheHer',
        category: 'cramp-relief',
        type: 'physical',
        internal: false,
        healthFunctions: ['cramp-relief'],
        tags: ['cramps', 'accessory', 'reusable'],
        price: '$11.99 (list $16, pack of 4)',
        whereToBuy: [],
        url: 'https://sootheher.com/',
        affiliateUrl: 'https://collabs.shop/uj8q5x',
        image: '/products/sootheher/gel-pad-refills.png',
        summary: 'A 4-pack of replacement butterfly gel pads for the Elaris Pod. Each gel pad is rated for roughly 30-40 uses; store on the plastic backing between uses to extend pad life, per the brand.',
        safety: {
            fdaStatus: 'Accessory to the FDA-cleared Elaris Pod device, per the brand; not separately FDA-cleared.',
            materials: 'Reusable gel pad material, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Same use precautions as the Elaris Pod, brand states not for use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition.',
            opinionAlerts: 'Brand-hosted rating shown at time of listing was based on very few reviews, check current review volume before treating it as representative.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: "Sourced from SootheHer's own site marketing claims, not independent clinical literature.",
        doctorOpinion: 'A consumable accessory for the Elaris Pod rather than a standalone treatment; replacing worn gel pads maintains the skin contact needed for the device to deliver its stimulation effectively.',
        effectiveness: 'Maintenance accessory, not a standalone treatment, effectiveness depends on the Elaris Pod device itself.',
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        // Confirmed ayna brand partner (2026-09-23). isEmergingBrand only
        // adds the "Brand" tag on Discovery, the "ayna Partner" badge comes
        // from src/utils/partnerBrands.js's PARTNER_BRAND_PATTERNS allowlist,
        // which gina is now in.
        // Brand name is styled lowercase ("gina"), matching its own
        // packaging/wordmark, same convention this app already uses for
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
        // brand's site), feeds both the Discovery "Preferences" filter
        // (matchesPreference in Discovery.jsx) and the ecosystem
        // preference matcher (preferenceLabelMatchesProduct in
        // products.js), both of which scan this tags array as text.
        tags: ['discomfort', 'comfort', 'organic', 'non-hormonal', 'cruelty-free', 'non-toxic', 'ph-neutral', 'single-use', 'clinician-informed'],
        price: '$101.00',
        whereToBuy: ['getgina.com'],
        url: 'https://getgina.com/products/vaginal-moisturizing-glides',
        image: '/products/gina/vaginal-moisturizing-glides.webp',
        summary: 'Vaginal dryness, irritation, or discomfort during intimacy can happen at any life stage: perimenopause, menopause, postpartum, or day to day. This single-ingredient suppository (12 per box, 1.72 g each) is 100% pure, extra virgin, unrefined, cold-pressed coconut oil, inserted directly or with gina\'s optional reusable applicator to hydrate and soothe.',
        safety: {
            // No FDA-registered-facility claim was found on gina's site
            // (unlike Neycher's), so fdaStatus is left off rather than
            // assumed.
            // Full packaging text, shown in full under "Materials" on
            // the Evidence view (see buildFactRows in ProductModal.jsx,
            // which doesn't truncate this field).
            materials: 'Box of 12 vaginal moisturizing glides. Ingredients (from the box): 100% pure, extra virgin, unrefined, cold-pressed coconut oil. Net weight per glide: 0.061 oz (1.72 g). Chill before use.',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation or an allergic reaction. Coconut oil is oil-based and can weaken latex condoms. Full warnings are listed below.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from gina\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'gina positions its coconut-oil glides as pure, simple, and effective, developed without hormones or harsh additives, non-irritating, non-toxic, pH-neutral, cruelty-free, pre-portioned for single use, and clinician-informed, per the brand\'s own site.\n\nThere\'s real clinical evidence behind coconut oil for this specific use: a 2023 pilot study followed 53 women using virgin coconut oil for vaginal dryness and painful sex over 6 months, and found most reported real improvement (83% improved dryness, 87% improved moisture duration), though it wasn\'t placebo-controlled and didn\'t test this specific product.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'A 2023 pilot study found most of 53 women using coconut oil for vaginal dryness over 6 months reported real improvement, though it wasn\'t placebo-controlled. No independent clinical study of this specific product was found.',
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10350307/', label: 'Cureus (2023): Virgin coconut oil for dyspareunia and vaginal dryness, pilot study, 53 women', chipLabel: 'Read the 2023 study (NIH) →' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with vaginal dryness or irritation at any life stage: perimenopause, menopause, postpartum, or day to day',
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
            'Chill before use, per the box.',
            'Pregnant or breastfeeding: check with a doctor first.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'gina\'s own product page shows three customer testimonials: "The moisturizing glide melts instantly and feels so clean and natural," "I love that it\'s one ingredient and pre-measured. No more mess, just long lasting hydration and comfort," and "The glide melts instantly and gives a precise, soothing dose of hydration. The relief was immediate." No star rating or review count was shown alongside them, and no independent (non-brand) review data was found at time of writing: gina launched in April 2026.',
        // Kept short and product-focused, the pilot-study specifics (who,
        // how many, over how long) live on the Clinician opinion tab, which
        // has room for that detail; this field feeds the ayna-summary card
        // alongside `summary` above, so it stays to the point.
        effectiveness: 'Real clinical evidence supports coconut oil for vaginal dryness generally, though no independent study has tested this specific product.',
        // Plain-text ingredient summary, kept as a string since search
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
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/24320105/', label: 'PubMed: Topical virgin coconut oil in pediatric atopic dermatitis, a randomized, double-blind clinical trial' },
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
                summary: 'ACOG notes that over-the-counter vaginal moisturizers and lubricants can help relieve vaginal dryness and painful sex. This is clinical-guidance-level evidence, not product-specific validation.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/37594604/',
                text: 'Antimicrobial Potential of Cocos nucifera (Coconut) Oil on Bacterial Isolates',
                summary: 'An in vitro lab study testing coconut oil against clinical and reference bacterial isolates, Streptococcus species showed the highest susceptibility, E. coli the least, attributed to coconut oil\'s lauric acid content. This is ingredient-level lab evidence, not a clinical study of this specific product.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/28707186/',
                text: 'Natural Oils for Skin-Barrier Repair: Ancient Compounds Now Backed by Modern Science',
                summary: 'A 2018 review (Vaughn et al., American Journal of Clinical Dermatology) of natural plant oils, including coconut oil, for repairing skin-barrier function, covering antimicrobial, antioxidant, and anti-inflammatory properties. This is general dermatology evidence about the oil, not a clinical study of this specific product or vaginal use.',
            },
            {
                // Same paper as PubMed 37461787 (PMC is the full-text
                // mirror), included once, under its PMC link, rather than
                // as two separate entries for the same study.
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10350307/',
                text: 'Virgin Coconut Oil in Paste Form as Treatment for Dyspareunia and Vaginal Dryness in Patients With and Without Rheumatic Autoimmune Diseases: An Efficacy and Safety Assessment Pilot Study',
                summary: 'A 2023 pilot survey study (Cureus) of 53 women who used a virgin coconut oil paste for vaginal dryness and painful sex found dryness decreased by 55% and 66% in its two groups (women without and with rheumatic autoimmune disease), with no side effects reported. It was a survey without a control group, and it didn\'t test this product.',
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
        summary: 'A reusable, BPA-free applicator designed exclusively for gina\'s Vaginal Moisturizing Glides, for smooth, precise, and deeper placement. This refill replaces a worn or lost applicator: exact pack size wasn\'t confirmed at time of writing.',
        safety: {
            materials: 'BPA-free reusable applicator, designed exclusively for gina Vaginal Moisturizing Glides.',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation. Rinse well and air-dry before storing.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from gina\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'gina states this applicator allows for smooth, precise, and deeper placement of its Glide, per the brand\'s own site. It\'s a delivery accessory, not an active ingredient: see the Vaginal Moisturizing Glides entry for the product it\'s used with.',
        // Rendered as a bulleted list on the Evidence view.
        howToUse: {
            intro: 'Unwrap the applicator and moisten the tip with water or lubricant. Pull the plunger down to stop, then load a gina glide rounded side first.',
            steps: [
                'Lie back with your knees raised and insert to a comfortable depth, then press the plunger to release the glide and remove the applicator.',
                'Rinse the applicator well and air-dry it before storing: it\'s reusable.',
            ],
            sourceUrl: 'https://getgina.com/pages/how-to-use-moisturizing-glides',
            sourceLabel: 'getgina.com: How to Use Moisturizing Glides',
        },
        warnings: [
            'Designed exclusively for use with gina Vaginal Moisturizing Glides.',
            'Rinse well and air-dry between uses.',
            'Irritation or discomfort: stop using it and see a doctor.',
        ],
        communityReview: 'No independent customer review data was found for this product at time of writing, gina launched in April 2026.',
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
    // gina Starter Kit, verified against getgina.com/products/the-starter-kit
    // on 2026-10-07 (contents, price, how-to tip, review count). gina is a
    // confirmed brand partner, so it gets the "ayna Favorite" label via
    // src/utils/partnerBrands.js. The glides inside are the same product as
    // p-gina-vaginal-moisturizing-glides, so the evidence below reuses that
    // entry's already-verified coconut-oil sources.
    {
        id: 'p-gina-starter-kit',
        name: 'gina The Starter Kit',
        brand: 'gina',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'organic', 'non-hormonal', 'cruelty-free', 'non-toxic', 'ph-neutral', 'single-use', 'clinician-informed', 'starter kit', 'bundle'],
        price: '$48.00 (list $63)',
        whereToBuy: ['getgina.com'],
        url: 'https://getgina.com/products/the-starter-kit',
        image: '/products/gina/starter-kit.jpg', // supplied by ayna
        summary: 'gina\'s starter bundle for vaginal dryness, irritation, or discomfort during intimacy, at any life stage: perimenopause, menopause, postpartum, or day to day. It includes a one-month supply of its coconut-oil Vaginal Moisturizing Glides (pack of 12), plus disposable finger sleeves, an insertion applicator, a free cotton pouch, a brochure guide, and free wellness advice from gina\'s nurse practitioner team. The glides are non-hormonal, single-ingredient suppositories of 100% pure, extra virgin, unrefined, cold-pressed coconut oil, with no fillers or artificial ingredients.',
        safety: {
            materials: 'Contents per gina: 12 Vaginal Moisturizing Glides (100% pure, extra virgin, unrefined, cold-pressed coconut oil; 1.72 g each), disposable finger sleeves, an insertion applicator, a cotton pouch, and a brochure guide. gina doesn\'t state what the finger sleeves are made of.',
            recalls: 'No recalls found.',
            sideEffects: 'Discontinue and see a doctor if you notice irritation or an allergic reaction. Coconut oil is oil-based and can weaken latex condoms. Full warnings are listed below.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from gina\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'The Starter Kit bundles gina\'s coconut-oil Vaginal Moisturizing Glides with the tools for inserting them, at $48 compared with a $63 list price. gina says the glides hydrate and condition vaginal tissue and soothe discomfort, including during intimacy.\n\nThere\'s real clinical evidence behind coconut oil for this use: a 2023 pilot study followed 53 women using virgin coconut oil for vaginal dryness and painful sex over 6 months, and most reported real improvement. It wasn\'t placebo-controlled and didn\'t test this specific product. No independent clinical study of gina\'s glides was found.',
        doctorOpinionShort: 'A starter bundle of gina\'s single-ingredient coconut-oil glides plus insertion tools. A 2023 pilot study found most of 53 women using coconut oil for vaginal dryness reported improvement, though it wasn\'t placebo-controlled; no independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10350307/', label: 'Cureus (2023): Virgin coconut oil for dyspareunia and vaginal dryness, pilot study, 53 women', chipLabel: 'Read the 2023 study (NIH) →' },
        ],
        whoItsFor: [
            'People trying gina for the first time who want the glides and every insertion option in one box',
            'Vaginal dryness or discomfort at any life stage, including perimenopause, menopause and postpartum',
            'People who prefer a single-ingredient, hormone-free option',
        ],
        howToUse: {
            intro: 'Per gina\'s own site: if you\'re new to vaginal care or have extreme dryness, start with finger or finger-sleeve insertion for greater comfort, then try the applicator.',
            steps: [
                'Empty your bladder, clean the area, and wash your hands.',
                'Separate a single chilled glide, wait 1 to 3 minutes, then peel back the foil.',
                'Squeeze to pop the glide out onto a clean surface.',
                'Insert with a finger, a finger sleeve, or the applicator while lying on your back with your knees raised.',
                'Wait 3 minutes, or until it\'s fully melted.',
            ],
            sourceUrl: 'https://getgina.com/pages/how-to-use-moisturizing-glides',
            sourceLabel: 'getgina.com: How to Use Moisturizing Glides',
        },
        warnings: [
            'Oil-based: can weaken latex condoms.',
            'Latex allergy: gina doesn\'t say what the finger sleeves are made of, so check with gina before using them.',
            'Pregnant or breastfeeding: check with a doctor first.',
            'Irritation or an allergic reaction: stop using it and see a doctor.',
        ],
        communityReview: 'gina\'s product page lists 18 reviews for The Starter Kit, but no star rating is shown alongside the count. The glides inside the kit are reviewed separately on gina\'s glides page.',
        effectiveness: 'Clinical evidence supports coconut oil for vaginal dryness generally, though no independent study has tested gina\'s glides specifically.',
        ingredients: 'Glides: coconut oil (100% pure, extra virgin, unrefined, cold-pressed). Kit also includes finger sleeves, an applicator, a pouch and a guide.',
        ingredientScience: [
            {
                name: 'Coconut oil (100% pure, extra virgin, unrefined, cold-pressed)',
                text: 'A natural moisturizer rich in lauric acid. In a randomized, double-blind clinical trial, topical virgin coconut oil improved skin barrier function (lower transepidermal water loss, higher skin capacitance) more than mineral oil.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/24320105/', label: 'PubMed: Topical virgin coconut oil in pediatric atopic dermatitis, a randomized, double-blind clinical trial' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                text: 'ACOG: Vulvovaginal Health',
                summary: 'ACOG notes that over-the-counter vaginal moisturizers and lubricants can help relieve vaginal dryness and painful sex. This is clinical-guidance-level evidence, not product-specific validation.',
            },
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10350307/',
                text: 'Virgin Coconut Oil in Paste Form as Treatment for Dyspareunia and Vaginal Dryness in Patients With and Without Rheumatic Autoimmune Diseases: An Efficacy and Safety Assessment Pilot Study',
                summary: 'A 2023 pilot survey study (Cureus) of 53 women who used a virgin coconut oil paste for vaginal dryness and painful sex found dryness decreased in both of its groups, with no side effects reported. It had no control group and didn\'t test gina\'s product.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://getgina.com/products/the-starter-kit',
                        text: 'getgina.com: The Starter Kit reviews',
                        summary: 'gina\'s product page lists 18 reviews for the kit, without a star rating shown.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // The Good Bug, Gut Balance and Good To Glow, verified against
    // thegoodbug.com product pages on 2026-10-07. The store converts prices by
    // visitor location; US dollar prices to be filled in from the US storefront. Science
    // claims read from their abstracts via NCBI E-utilities. Not a brand
    // partner, no affiliate link.
    {
        id: 'p-goodbug-gut-balance',
        name: 'The Good Bug Gut Balance SuperGut Stick',
        brand: 'The Good Bug',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement'],
        tags: ['goodbug', 'tgb', 'gut', 'gut health', 'probiotic', 'synbiotic', 'digestion', 'bloating', 'supplement'],
        price: '$13 (list $14)',
        whereToBuy: ['thegoodbug.com'],
        url: 'https://thegoodbug.com/products/healthy-gut-balance',
        image: '/products/goodbug/gut-balance.jpg', // supplied by ayna
        summary: 'A daily synbiotic powder stick (probiotics plus prebiotic fiber) for gut and digestive health. The Good Bug says it eases bloating, gas and indigestion, supports regular digestion and immunity, and contains two of the most researched probiotic strains, Lacticaseibacillus rhamnosus LGG® and Bifidobacterium animalis subsp. lactis BB-12®, with an enzyme blend, vitamin C and inulin. The box lists 4 billion CFU. Mix one stick into 200 ml of water.',
        ingredients: 'Per The Good Bug\'s description and the box: L. rhamnosus LGG®, B. lactis BB-12®, enzyme blend (amylase, cellulase, lipase, lactase, protease), vitamin C, inulin; 4 billion CFU. The ingredient list on the same product page instead reads: Isomalt, Hydrolyzed Guar Gum, Polydextrose, Fructooligosaccharides, Lactobacillus Plantarum UALp-05, Bifidobacterium lactis UABla-12, Added Flavors (Nature Identical Flavors), Permitted Natural Color (INS 160a). 1.2 g per stick.',
        safety: {
            fdaStatus: 'Sold in India as a nutraceutical (per the box). In the US this would be a dietary supplement, which the FDA does not evaluate for safety or efficacy claims.',
            materials: 'Powder sticks, 1.2 g each; packs of 15, 30, 60 or 90. Made in India by Sundyota Numandis Probioceuticals for SevenTurns Private Limited. Best before 12 months from manufacture.',
            recalls: 'No recalls found.',
            sideEffects: 'Per The Good Bug, some people get mild bloating, gas or loose stools in the first few days; stop and see a doctor if it lasts more than 2 days. The Good Bug advises checking with a health practitioner first if you are pregnant or breastfeeding, or have IBS, diabetes or another medical condition. Full warnings are listed below.',
            opinionAlerts: 'Ingredient mismatch: The Good Bug\'s description and box name the strains LGG® and BB-12®, but the ingredient list on the same page names different strains (L. plantarum UALp-05 and B. lactis UABla-12) and no enzymes or vitamin C. It may be from the older formula; check the box you receive.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from The Good Bug; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'The Good Bug says Gut Balance eases bloating, gas and indigestion, and supports digestion and immunity, using LGG® and BB-12®, two well-studied probiotic strains. No independent study of this product was found.\n\nFor LGG, a 2025 meta-analysis of 69 randomized trials found it reduced the risk and length of diarrhea, with moderate-certainty evidence that was strongest in children. Its effects on bloating, abdominal pain and constipation were limited, and the authors said evidence in adults was limited.\n\nThe Good Bug cites two studies. The first, a 2015 randomized, double-blind, placebo-controlled trial of 650 people in Croatia, gave the same two strains (LGG® and BB-12®) or a placebo for 14 days alongside antibiotics for an H. pylori stomach infection. The probiotic group had a higher cure rate (87% vs 73%) and less bloating, flatulence and other treatment side effects. Those were people on antibiotics, not people with everyday bloating, and two authors worked for JGL, the company that sells that probiotic. The second, a 2024 study of 20 healthy adults with post-meal bloating, found that a single dose of a different company\'s supplement (18 digestive enzymes plus ginger, fennel and peppermint) reduced belly distension after one meal compared with a placebo. It was funded by HUM Nutrition, whose employee wrote it, and Gut Balance\'s enzyme blend doesn\'t include those herbs.\n\nOne thing to check: the ingredient list on The Good Bug\'s own page names different strains (L. plantarum UALp-05 and B. lactis UABla-12) than its description and box (LGG® and BB-12®). Research on one strain doesn\'t carry over to another, so it matters which formula you get.',
        doctorOpinionShort: 'Its main strain, LGG, reduces diarrhea in a large body of trials, mostly in children, but did little for bloating or constipation in a 2025 meta-analysis. The trial The Good Bug cites found less bloating only in people taking antibiotics for H. pylori. The product page lists different strains in its ingredient list than in its description, so check the box. No independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://thegoodbug.com/products/healthy-gut-balance', label: 'thegoodbug.com: Gut Balance, ingredients and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/40702885/', label: 'PubMed: Effects of Lacticaseibacillus rhamnosus GG on gastrointestinal and respiratory outcomes, systematic review and meta-analysis (2025)', chipLabel: 'LGG meta-analysis, 69 trials (2025)' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4603068/', label: 'NIH (PMC): Probiotics for standard triple Helicobacter pylori eradication, randomized, double-blind, placebo-controlled trial (Hauser et al., 2015)', chipLabel: 'H. pylori probiotic trial, 650 people (2015)' },
            { url: 'https://doi.org/10.2147/NDS.S453377', label: 'Nutrition and Dietary Supplements (2024): A multi-digestive enzyme and herbal dietary supplement reduces bloating in a single use in healthy adults', chipLabel: 'Enzyme + herbal bloating study, 20 people (2024)' },
        ],
        whoItsFor: [
            'Adults looking for a daily probiotic powder for general digestive support',
            'People who prefer a stick mixed into water over capsules',
            'Not a substitute for seeing a doctor about persistent bloating, diarrhea or changes in bowel habits',
        ],
        howToUse: {
            intro: 'The Good Bug sizes its packs at one stick a day (15 sticks for 15 days, 30 for a month) and says the best results came with 3 months of consistent use.',
            steps: [
                'Mix one stick into 200 ml of water.',
                'Avoid mixing it into carbonated drinks like soda.',
                'If you miss a dose, take it when you remember; don\'t double up.',
            ],
            sourceUrl: 'https://thegoodbug.com/products/healthy-gut-balance',
            sourceLabel: 'thegoodbug.com: Gut Balance',
        },
        warnings: [
            'Pregnant, breastfeeding, or managing IBS, diabetes or another medical condition: check with a doctor first (per The Good Bug).',
            'Loose stools or digestive changes lasting more than 2 days: stop and see a doctor (per The Good Bug).',
        ],
        communityReview: 'The Good Bug\'s product page shows 4.6 out of 5 stars from 119 reviews: 68% five stars, 22% four stars, 8% three stars and 2% two stars. The first reviews shown describe less bloating and acidity and better digestion after a few weeks or months. These are reviews on the brand\'s own site; no independent review data was found at time of writing.',
        effectiveness: 'LGG reduced diarrhea in many trials, mostly in children; effects on bloating and constipation were limited.',
        ingredientScience: [
            {
                name: 'LGG® + BB-12® with antibiotics (study cited by The Good Bug)',
                text: 'In a 2015 randomized, double-blind, placebo-controlled trial, 650 people taking standard antibiotic therapy for an H. pylori stomach infection also took LGG® and BB-12® (10⁸ to 10¹⁰ live bacteria per capsule) or a placebo, twice a day for 14 days. The probiotic group had a higher cure rate (87% vs 73%) and fewer treatment side effects, including less bloating and flatulence, in 7 of 10 tracked symptoms. Participants were on antibiotics, not people with everyday bloating, and two of the authors worked for JGL, which sells that probiotic.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4603068/', label: 'NIH (PMC): Probiotics for standard triple Helicobacter pylori eradication, randomized, double-blind, placebo-controlled trial (Hauser et al., Medicine 2015)' },
                ],
            },
            {
                name: 'Digestive enzymes (study cited by The Good Bug)',
                text: 'In a 2024 double-blind, placebo-controlled crossover study, 20 healthy adults with daily post-meal bloating took a single dose of a supplement with 18 digestive enzymes plus ginger, fennel and peppermint, or a placebo, before a test meal, then switched after a one-week washout. The supplement reduced waist distension by 58% at 30 minutes and 68% at 90 minutes compared with placebo. The study tested HUM Nutrition\'s product, was funded by HUM, and its author worked there. Gut Balance\'s enzyme blend doesn\'t include the herbs.',
                citations: [
                    { url: 'https://doi.org/10.2147/NDS.S453377', label: 'Nutrition and Dietary Supplements (2024): A multi-digestive enzyme and herbal dietary supplement reduces bloating in a single use in healthy adults' },
                ],
            },
            {
                name: 'Lacticaseibacillus rhamnosus GG (LGG)',
                text: 'The Good Bug calls this the world\'s most studied probiotic. A 2025 meta-analysis of 69 randomized trials found LGG reduced the risk of diarrhea and shortened it, with moderate-certainty evidence that was more consistent in children. It had limited effects on bloating, abdominal pain, constipation and nausea, and the authors said evidence in adults was limited.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/40702885/', label: 'PubMed: Effects of Lacticaseibacillus rhamnosus GG on gastrointestinal and respiratory outcomes, systematic review and meta-analysis (2025)' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://thegoodbug.com/products/healthy-gut-balance',
                        text: 'thegoodbug.com: Gut Balance customer reviews',
                        summary: 'The Good Bug\'s own product page shows 4.6 out of 5 stars from 119 reviews.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    {
        id: 'p-goodbug-good-to-glow',
        name: 'The Good Bug Good To Glow SuperGut Stick',
        brand: 'The Good Bug',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement', 'skin-hair'],
        tags: ['goodbug', 'tgb', 'skin', 'hair', 'nails', 'probiotic', 'synbiotic', 'glutathione', 'beauty supplement', 'supplement'],
        price: '$13 (list $14)',
        whereToBuy: ['thegoodbug.com'],
        url: 'https://thegoodbug.com/products/good-to-glow',
        image: '/products/goodbug/good-to-glow.jpg', // supplied by ayna
        summary: 'A daily synbiotic powder stick for skin, hair and nails "from within". It combines the probiotic Lactobacillus plantarum (5 billion CFU, per the box) with glutathione, trans-resveratrol, vitamin C, vitamin A, zinc, biotin, lycopene and inulin, in a berry flavor. The Good Bug says it brightens and hydrates skin, helps with sun damage, blemishes, dark spots and wrinkles, and strengthens hair and nails.',
        ingredients: 'Full ingredient list per The Good Bug: Stabilizer [Xylitol (INS 967)], Sweetener [Sorbitol (INS 420(i))], Glutathione, Zinc Gluconate, Vitamin C, Lactobacillus plantarum, Trans Resveratrol, Inulin, Lycopene, Sweetener [Steviol Glycoside (INS 960)], Anti-Sticking Agent [Magnesium Stearate (INS 470(iii))], Vitamin A, Biotin. Contains added berry flavor. 3 g per stick; 5 billion CFU per the box.',
        safety: {
            fdaStatus: 'Sold in India as a nutraceutical (per the box). In the US this would be a dietary supplement, which the FDA does not evaluate for safety or efficacy claims.',
            materials: 'Powder sticks, 3 g each; packs of 15, 30, 60 or 90. Sweetened with xylitol, sorbitol and stevia. The Good Bug doesn\'t list amounts of glutathione, vitamins or other actives. Made in India by Sundyota Numandis Probioceuticals for SevenTurns Private Limited. Best before 24 months from manufacture.',
            recalls: 'No recalls found.',
            sideEffects: 'The Good Bug says it isn\'t recommended for children, or for pregnant or breastfeeding women or anyone with a medical condition without checking with a healthcare professional first. It contains biotin, which the FDA warns can interfere with certain lab tests, so tell your doctor you take it before blood work. It also contains sugar alcohols (xylitol, sorbitol). Full warnings are listed below.',
            opinionAlerts: 'Skin claims come from The Good Bug, and no independent study of this product was found. The Good Bug doesn\'t list how much glutathione or vitamins each stick contains.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from The Good Bug; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'The Good Bug says Good To Glow brightens and hydrates skin, helps with sun damage, blemishes and dark spots, reduces the look of wrinkles, and strengthens hair and nails. No independent study of this product was found, so what follows is what the research says about its main ingredients.\n\nGlutathione has the most direct evidence. In a randomized, double-blind, placebo-controlled trial of 60 medical students in Thailand, 500 mg a day of oral glutathione for 4 weeks lightened skin at two of six measured sites compared with placebo. A 2024 systematic review found oral glutathione at 250–500 mg a day reduced the skin\'s melanin index in five randomized trials, but called the results unsustainable and noted long-term safety isn\'t established. The Good Bug doesn\'t list how much glutathione each stick contains.\n\nFor Lactobacillus plantarum, the human evidence found was for a different form: in a Korean study, candy containing dead-bacteria fragments (lysate) of one specific strain, L. plantarum K8, improved skin hydration over 8 weeks compared with plain candy. Good To Glow\'s label doesn\'t name its strain, and it uses live bacteria, so that result may not apply.',
        doctorOpinionShort: 'Oral glutathione lightened skin in small randomized trials, but long-term safety isn\'t established and this product doesn\'t list its dose. Evidence for its probiotic comes from a different form and strain. No independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://thegoodbug.com/products/good-to-glow', label: 'thegoodbug.com: Good To Glow, ingredients and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/20524875/', label: 'PubMed: Glutathione as an oral whitening agent, randomized, double-blind, placebo-controlled study', chipLabel: 'Oral glutathione trial, 60 people (2012)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/39444151/', label: 'PubMed: Glutathione as a skin-lightening agent and in melasma, systematic review', chipLabel: 'Glutathione systematic review (2024)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/25179904/', label: 'PubMed: Effects of oral intake of kimchi-derived Lactobacillus plantarum K8 lysates on skin moisturizing', chipLabel: 'L. plantarum K8 skin study (2015)' },
        ],
        whoItsFor: [
            'Adults interested in an ingestible skin, hair and nail supplement alongside their skincare',
            'People who prefer a flavored powder stick over capsules',
            'Not for children, or during pregnancy or breastfeeding without checking with a clinician (per The Good Bug)',
        ],
        howToUse: {
            intro: 'The Good Bug sizes its packs at one stick a day (15 sticks for 15 days, 30 for a month). Its Good To Glow page doesn\'t give mixing directions.',
            steps: [
                'Take one stick a day.',
                'Keep using sunscreen daily; The Good Bug\'s own page recommends it alongside the product.',
            ],
            sourceUrl: 'https://thegoodbug.com/products/good-to-glow',
            sourceLabel: 'thegoodbug.com: Good To Glow',
        },
        warnings: [
            'Pregnant, breastfeeding, or managing a medical condition: check with a doctor first (per The Good Bug). Not for children.',
            'Contains biotin: the FDA warns biotin can interfere with certain lab tests, so tell your doctor before blood work.',
        ],
        communityReview: 'The Good Bug\'s product page shows 4.3 out of 5 stars from 1,623 reviews: 36% five stars, 61% four stars, 2% three stars, and two one-star reviews. The first reviews shown describe brighter, glowing skin after about a month, for example: "within a month of using it, people started telling me that my skin is glowing." These are reviews on the brand\'s own site; no independent review data was found at time of writing.',
        effectiveness: 'Oral glutathione lightened skin in small randomized trials; the probiotic\'s skin evidence comes from a different form and strain.',
        ingredientScience: [
            {
                name: 'Glutathione (oral)',
                text: 'The Good Bug states this brightens skin. In a randomized, double-blind, placebo-controlled trial of 60 people, 500 mg a day of oral glutathione for 4 weeks lightened skin at two of six measured sites (the face and a sun-exposed forearm) compared with placebo. A 2024 systematic review found five randomized trials where oral glutathione at 250–500 mg a day reduced the melanin index, but described the effect as unsustainable. Long-term safety isn\'t established. This product\'s glutathione amount isn\'t listed.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/20524875/', label: 'PubMed: Glutathione as an oral whitening agent, randomized, double-blind, placebo-controlled study (2012)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/39444151/', label: 'PubMed: Glutathione as a skin-lightening agent and in melasma, systematic review (2024)' },
                ],
            },
            {
                name: 'Lactobacillus plantarum',
                text: 'The Good Bug states this revitalizes skin. In a Korean study, people who ate candy containing 2.1% dead-bacteria fragments (lysate) of L. plantarum strain K8 had better skin hydration after 4 and 8 weeks than people eating the same candy without it. Good To Glow uses live L. plantarum of an unnamed strain, so that result may not apply.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/25179904/', label: 'PubMed: Effects of oral intake of kimchi-derived Lactobacillus plantarum K8 lysates on skin moisturizing (2015)' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.fda.gov/medical-devices/in-vitro-diagnostics/biotin-interference-troponin-lab-tests-assays-subject-biotin-interference',
                text: 'FDA: Biotin interference with lab tests',
                summary: 'The FDA says biotin, often found in dietary supplements, can significantly interfere with certain lab tests and cause incorrect results that may go undetected.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://thegoodbug.com/products/good-to-glow',
                        text: 'thegoodbug.com: Good To Glow customer reviews',
                        summary: 'The Good Bug\'s own product page shows 4.3 out of 5 stars from 1,623 reviews.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // Happy Head Hair Growth Supplements, verified against
    // happyhead.com/products/hair-growth-supplements on 2026-10-07 (price,
    // dose, ingredient names, pregnancy note). Happy Head doesn't publish
    // ingredient amounts. Science read via NCBI E-utilities; ashwagandha
    // safety from NIH NCCIH. Not a brand partner, no affiliate link.
    {
        id: 'p-happyhead-hair-growth-supplements',
        name: 'Happy Head Hair Growth Supplements',
        brand: 'Happy Head',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement', 'skin-hair'],
        tags: ['happyhead', 'hair', 'hair growth', 'hair thinning', 'biotin', 'saw palmetto', 'ashwagandha', 'collagen', 'supplement', 'drug-free'],
        price: '$79 for 60 capsules (1 month); $67/month with a subscription',
        whereToBuy: ['happyhead.com'],
        url: 'https://www.happyhead.com/products/hair-growth-supplements',
        image: '/products/happyhead/hair-growth-supplements.jpg', // supplied by ayna
        summary: 'A daily, drug-free hair supplement from Happy Head, a hair-loss company that also offers dermatologist-prescribed treatments. The blend\'s headline ingredients are biotin, collagen, keratin, saw palmetto, ashwagandha, and vitamins A and D (full list under Ingredients). Happy Head says it supports healthier hair and scalp and visibly thicker hair in 3 to 6 months. Take 2 capsules daily with a meal; a jar of 60 capsules lasts a month. No prescription needed.',
        ingredients: 'Per Happy Head: biotin, collagen, keratin, saw palmetto, ashwagandha, probiotics, vitamin A, vitamin D. Happy Head doesn\'t publish the amount of each ingredient on its product page.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA for safety or efficacy claims.',
            materials: '60 capsules per jar (2 a day, 1-month supply). Happy Head doesn\'t publish a Supplement Facts panel with ingredient amounts on its product page. Store in a cool, dry place; no refrigeration needed.',
            recalls: 'No recalls found.',
            sideEffects: 'Contains ashwagandha. The NIH says ashwagandha should be avoided during pregnancy and breastfeeding, isn\'t recommended for people with thyroid or autoimmune disorders or before surgery, has been linked to rare cases of liver injury, and may interact with medicines for diabetes, blood pressure, thyroid, seizures and immune suppression, and with sedatives. Happy Head says to consult a physician if you are pregnant, nursing or planning to become pregnant. It also contains biotin, which the FDA warns can interfere with certain lab tests. Full warnings are listed below.',
            opinionAlerts: 'Contains ashwagandha, which the NIH says to avoid during pregnancy and breastfeeding and with thyroid or autoimmune conditions. Happy Head doesn\'t publish ingredient amounts, so its doses can\'t be compared with the studies below.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Happy Head; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Happy Head says this dermatologist-developed blend supports fuller, thicker, stronger hair in 3 to 6 months. No independent study of this product was found, and Happy Head doesn\'t publish its ingredient amounts, so what follows is what the research says about its main ingredients.\n\nA 2023 JAMA Dermatology systematic review of 30 studies of supplements for hair loss in people without a known nutritional deficiency found the best evidence for specific products (Viviscal, Nourkrin, Nutrafol and others) and some single ingredients, with rare, mild side effects. It called for larger trials with active comparators.\n\nBiotin is the most popular hair ingredient but has the weakest case: a 2017 review found it helped only in people with an underlying cause such as biotin deficiency, and found no good evidence for healthy people. Saw palmetto has more support: a 2020 systematic review of 5 randomized trials and 2 other studies found oral or topical saw palmetto (100–320 mg) improved hair quality and density in people with pattern hair loss or shedding, though high-quality data are lacking. Saw palmetto is anti-androgenic.\n\nAshwagandha is the main safety concern for women: the NIH says to avoid it during pregnancy and breastfeeding, and with thyroid or autoimmune disorders.',
        doctorOpinionShort: 'Saw palmetto has modest evidence for pattern hair loss; biotin helps only if you\'re deficient. Happy Head doesn\'t publish ingredient amounts, and no independent study of this product was found. It contains ashwagandha, which the NIH says to avoid during pregnancy, breastfeeding, and with thyroid or autoimmune conditions.',
        doctorOpinionCitations: [
            { url: 'https://www.happyhead.com/products/hair-growth-supplements', label: 'happyhead.com: Hair Growth Supplements, ingredients and claims' },
            { url: 'https://www.nccih.nih.gov/health/ashwagandha', label: 'NIH NCCIH: Ashwagandha, safety' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/36449274/', label: 'PubMed: Evaluation of the safety and effectiveness of nutritional supplements for treating hair loss, systematic review (JAMA Dermatol 2023)', chipLabel: 'Hair supplements review, JAMA Derm (2023)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/28879195/', label: 'PubMed: A review of the use of biotin for hair loss', chipLabel: 'Biotin for hair loss review (2017)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/33313047/', label: 'PubMed: Natural hair supplement, friend or foe? Saw palmetto, a systematic review in alopecia', chipLabel: 'Saw palmetto systematic review (2020)' },
        ],
        whoItsFor: [
            'Adults with thinning hair looking for a drug-free supplement, ideally after a clinician has checked for causes like iron or thyroid problems',
            'Not for pregnancy, breastfeeding, or trying to conceive, or for people with thyroid or autoimmune conditions (ashwagandha)',
        ],
        howToUse: {
            intro: 'Per Happy Head: take consistently for 3 to 6 months to see results.',
            steps: [
                'Take 2 capsules by mouth daily with a meal.',
                'Store in a cool, dry place with the lid tightly closed.',
            ],
            sourceUrl: 'https://www.happyhead.com/products/hair-growth-supplements',
            sourceLabel: 'happyhead.com: Hair Growth Supplements',
        },
        warnings: [
            'Pregnant, breastfeeding, or trying to conceive: the NIH says to avoid ashwagandha; Happy Head says to consult your physician first.',
            'Thyroid or autoimmune condition, or surgery coming up: the NIH doesn\'t recommend ashwagandha.',
            'Taking medicine for diabetes, blood pressure, thyroid, seizures, or immune suppression, or sedatives: ashwagandha may interact, so check with your doctor.',
            'Contains biotin: the FDA warns biotin can interfere with certain lab tests, so tell your doctor before blood work.',
            'Signs of liver problems: stop and see a doctor; the NIH notes rare liver injury linked to ashwagandha.',
        ],
        communityReview: 'Happy Head\'s product page shows a company-wide Trustpilot widget but no reviews specific to this supplement, and Trustpilot blocks automated access, so no product-specific review data was found at time of writing.',
        effectiveness: 'Saw palmetto has modest, low-quality evidence for pattern hair loss and shedding; biotin hasn\'t been shown to help people who aren\'t deficient.',
        ingredientScience: [
            {
                name: 'Supplements for hair loss (overall evidence)',
                text: 'A 2023 JAMA Dermatology systematic review of 30 studies (17 randomized trials) in people without a known nutritional deficiency found the highest-quality evidence for specific branded supplements and some single ingredients. Side effects were rare and mild. The authors called for larger trials against active treatments.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/36449274/', label: 'PubMed: Evaluation of the safety and effectiveness of nutritional supplements for treating hair loss, systematic review (Drake et al., JAMA Dermatol 2023)' },
                ],
            },
            {
                name: 'Biotin',
                text: 'A 2017 review found 18 reported cases where biotin improved hair or nails, all in people with an underlying problem such as biotin deficiency. The authors concluded there isn\'t enough evidence for biotin supplements in healthy people. The FDA also warns biotin can interfere with certain lab tests.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28879195/', label: 'PubMed: A review of the use of biotin for hair loss (Patel et al., 2017)' },
                    { url: 'https://www.fda.gov/medical-devices/in-vitro-diagnostics/biotin-interference-troponin-lab-tests-assays-subject-biotin-interference', label: 'FDA: Biotin interference with lab tests' },
                ],
            },
            {
                name: 'Saw palmetto',
                text: 'A 2020 systematic review of 5 randomized trials and 2 other studies found oral or topical saw palmetto (100–320 mg) improved overall hair quality, hair count and density in people with pattern hair loss and shedding, and was well tolerated. The authors said high-quality data are lacking and larger trials are needed. Saw palmetto is anti-androgenic.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/33313047/', label: 'PubMed: Natural hair supplement, friend or foe? Saw palmetto, a systematic review in alopecia (Evron et al., 2020)' },
                ],
            },
            {
                name: 'Ashwagandha (safety)',
                text: 'The NIH says ashwagandha may be safe short term (up to 3 months), long-term safety is unknown, and rare cases of liver injury have been linked to it. It should be avoided during pregnancy and breastfeeding, isn\'t recommended for people with thyroid or autoimmune disorders or before surgery, and may interact with several medications.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/ashwagandha', label: 'NIH NCCIH: Ashwagandha' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: { links: [] },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    // Magnum Solace Nighttime Magnesium Cream, verified against
    // magnumsolace.com/products/nighttime-magnesium-cream on 2026-10-07
    // (description, full ingredients, scents, price, how-to). Walmart
    // listing supplied by ayna; Walmart blocks automated access, so no
    // rating is quoted. Science read via NCBI E-utilities. Not a brand
    // partner, no affiliate link.
    {
        id: 'p-magnumsolace-nighttime-magnesium-cream',
        name: 'Magnum Solace Nighttime Magnesium Cream',
        brand: 'Magnum Solace',
        category: 'sleep',
        type: 'physical',
        internal: false,
        healthFunctions: ['sleep'],
        tags: ['sleep', 'magnesium', 'magnesium cream', 'muscle', 'restless legs', 'relaxation', 'lavender', 'unscented option', 'magnumsolace'],
        price: '$27.99 for 5 oz (list $39.99)',
        whereToBuy: ['magnumsolace.com', 'Walmart'],
        url: 'https://www.magnumsolace.com/products/nighttime-magnesium-cream',
        image: '/products/magnumsolace/nighttime-magnesium-cream.jpg', // supplied by ayna
        summary: 'A magnesium chloride body cream with shea butter and grapeseed oil, meant to be massaged into the legs, feet, arms or chest before bed. Magnum Solace says it eases muscle tension and restless legs and promotes relaxation and sleep, with 250 mg of magnesium per teaspoon. It comes in nine scents, including lavender, chamomile & lavender, and unscented. Made in small batches in Houston, Texas.',
        ingredients: 'Full ingredient list per Magnum Solace: Purified Water (Aqua), Magnesium Chloride, Emulsifying Wax, Organic Butyrospermum Parkii (Shea Butter), Vitis Vinifera (Grape) Seed Oil, Tocopheryl Acetate (Vitamin E), Organic Helianthus Annuus (Sunflower) Oil, Phenoxyethanol. This published list contains no scent ingredients, so scented versions (such as Lavender) likely add essential oils or fragrance not listed here; check the jar.',
        safety: {
            fdaStatus: 'Cosmetic body cream; not an FDA-cleared drug or medical device. Magnum Solace\'s claims that it relieves restless legs, muscle tension and sleep problems have not been evaluated by the FDA.',
            materials: '5 oz jar. Magnesium chloride (250 mg magnesium per teaspoon, per Magnum Solace) in a cream base of water, emulsifying wax, shea butter, grapeseed and sunflower oils, and vitamin E, preserved with phenoxyethanol.',
            recalls: 'No recalls found.',
            sideEffects: 'Magnum Solace says to avoid broken skin and freshly shaved areas. Scented versions add scent ingredients that aren\'t in the published ingredient list; if you have sensitive skin, the unscented version avoids them. Full warnings are listed below.',
            opinionAlerts: 'Magnum Solace says the cream delivers "100% absorbable" magnesium "directly to the cellular level." A 2017 scientific review concluded that claims of magnesium absorption through the skin are scientifically unsupported. It may still feel soothing to massage in as a moisturizing bedtime cream.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Magnum Solace; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Magnum Solace says the cream eases muscle tension and restless legs and helps with sleep, because magnesium is absorbed through the skin, "100% absorbable" and delivered "directly to the cellular level."\n\nThe evidence for that absorption is weak. A 2017 review in Nutrients concluded that the promotion of transdermal magnesium is scientifically unsupported, while oral magnesium is well documented for treating deficiency. The only human trial found was a 2017 pilot of 25 people: a magnesium cream (56 mg a day for two weeks) raised blood magnesium slightly compared with a placebo cream, but the change was statistically significant only in a subgroup of non-athletes. One author has a financial interest in a different magnesium cream.\n\nNo study of this product, or of magnesium cream for sleep or restless legs, was found. Massaging in a rich cream at bedtime may still feel relaxing. If you have ongoing restless legs or trouble sleeping, it\'s worth talking to a clinician.',
        doctorOpinionShort: 'Its central claim, that magnesium absorbs through the skin, is unsupported according to a 2017 review; a small 2017 pilot found only a slight rise in blood magnesium. No study of this product or of magnesium cream for sleep was found. It may still work as a soothing bedtime massage cream.',
        doctorOpinionCitations: [
            { url: 'https://www.magnumsolace.com/products/nighttime-magnesium-cream', label: 'magnumsolace.com: Nighttime Magnesium Cream, ingredients and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/28788060/', label: 'PubMed: Myth or reality, transdermal magnesium? (Nutrients 2017)', chipLabel: 'Transdermal magnesium review (2017)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/28403154/', label: 'PubMed: Effect of transdermal magnesium cream on serum and urinary magnesium levels, pilot study', chipLabel: 'Magnesium cream pilot trial, 25 people (2017)' },
        ],
        whoItsFor: [
            'People who like a rich, moisturizing massage cream as part of a bedtime routine',
            'People who want an unscented option (one of its nine versions)',
            'Not a substitute for seeing a clinician about ongoing restless legs, cramps or insomnia',
        ],
        howToUse: {
            intro: 'Per Magnum Solace: use every night for at least two weeks for best results.',
            steps: [
                'Massage generously onto your legs, arms, chest or feet before going to sleep.',
                'For restless legs, apply to your legs and the bottoms of your feet before bed.',
                'Avoid broken skin and freshly shaved areas.',
            ],
            sourceUrl: 'https://www.magnumsolace.com/products/nighttime-magnesium-cream',
            sourceLabel: 'magnumsolace.com: Nighttime Magnesium Cream',
        },
        warnings: [
            'Don\'t apply to broken skin or freshly shaved areas (per Magnum Solace).',
            'Sensitive skin or scent sensitivity: choose the unscented version or patch test first; scented versions\' added ingredients aren\'t listed.',
            'Ongoing restless legs, cramps or trouble sleeping: see a clinician to check for underlying causes.',
        ],
        communityReview: 'Magnum Solace\'s product page shows six featured five-star testimonials from verified buyers, mentioning better sleep, eased restless legs and cramps, and a non-greasy feel, for example: "It helps with cramping and restless legs, feels wonderful!" The page doesn\'t show a total review count or average. It is also sold on Walmart, but Walmart blocks automated access, so no rating could be confirmed at time of writing.',
        effectiveness: 'No study of this cream, or of magnesium cream for sleep or restless legs, was found.',
        ingredientScience: [
            {
                name: 'Magnesium chloride (transdermal)',
                text: 'Magnum Solace states its magnesium is absorbed through the skin. A 2017 review concluded that the promotion of transdermal magnesium is scientifically unsupported. A 2017 pilot of 25 people found a magnesium cream (56 mg a day for two weeks) raised blood magnesium slightly versus placebo, significant only in a subgroup of non-athletes; one author has a financial interest in a different magnesium cream.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28788060/', label: 'PubMed: Myth or reality, transdermal magnesium? (Gröber et al., Nutrients 2017)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28403154/', label: 'PubMed: Effect of transdermal magnesium cream on serum and urinary magnesium levels in humans, pilot study (Kass et al., 2017)' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.walmart.com/ip/17531958604',
                        text: 'Walmart: Magnum Solace Nighttime Magnesium Cream reviews',
                        summary: 'Customer reviews on Walmart. A rating couldn\'t be confirmed at time of writing because Walmart blocks automated access.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.magnumsolace.com/products/nighttime-magnesium-cream',
                        text: 'magnumsolace.com: featured customer testimonials',
                        summary: 'Six featured five-star testimonials from verified buyers; no total count or average shown.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // InfiniWell PTD-DBM + Methyl Vanillate, verified against
    // infiniwell.com/products/ptd-dbm-methyl-vanillate on 2026-10-07 (price,
    // description, FAQ, how-to, review stats). Image supplied by ayna.
    // Studies read via NCBI E-utilities. Not a brand partner, no affiliate link.
    {
        id: 'p-infiniwell-ptd-dbm',
        name: 'InfiniWell PTD-DBM + Methyl Vanillate',
        brand: 'InfiniWell',
        category: 'hair',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['infiniwell', 'ptd-dbm', 'methyl vanillate', 'hair', 'scalp', 'hair serum', 'peptide', 'thinning', 'cosmetic'],
        price: '$69.95 for 25 mL',
        whereToBuy: ['infiniwell.com', 'Amazon'],
        url: 'https://infiniwell.com/products/ptd-dbm-methyl-vanillate',
        whereToBuyLinks: {
            'infiniwell.com': 'https://infiniwell.com/products/ptd-dbm-methyl-vanillate',
            Amazon: 'https://www.amazon.com/InfiniWell-Hair-Growth-Serum-Restoration/dp/B09J97Z29F',
        },
        image: '/products/infiniwell/ptd-dbm.webp', // supplied by ayna
        summary: 'A leave-in scalp serum in a 25 mL dropper bottle, pairing the peptide PTD-DBM with methyl vanillate, a compound derived from vanillin. InfiniWell calls it physician-formulated and sells it as a cosmetic for fuller-looking hair, not as a hair-loss treatment. Apply to the scalp once a day; no rinsing. The research on PTD-DBM has only been done in cells and mice so far. InfiniWell offers a refund if you don\'t feel a difference in 30 days.',
        ingredients: 'Per InfiniWell: PTD-DBM (a peptide) and methyl vanillate. InfiniWell doesn\'t list the full ingredients or the amount of either active as text on its product page.',
        safety: {
            fdaStatus: 'Sold as a cosmetic; not an FDA-approved drug for hair loss. InfiniWell says its statements haven\'t been evaluated by the FDA and that the product isn\'t formulated to treat hair loss.',
            materials: '25 mL serum with a dropper. InfiniWell says it is made in a cGMP facility in the USA and third-party tested by ISO-certified labs.',
            recalls: 'No recalls found.',
            sideEffects: 'For external use only; avoid contact with eyes. InfiniWell says to consult a physician first if you take prescription medication, have a medical condition, or are pregnant or nursing, and to check with a professional if you also use medicated hair treatments. Not for children.',
            opinionAlerts: 'No human trial of PTD-DBM or of this serum was found. InfiniWell describes methyl vanillate two ways: as nourishing hair follicles, and as an ingredient that helps the serum spread and absorb.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from InfiniWell; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'InfiniWell says PTD-DBM supports the Wnt/β-catenin pathway, a signaling pathway involved in hair follicle growth, and that the serum aims for visible results in less than 30 days. No study of this product was found.\n\nPTD-DBM comes from a 2017 Journal of Investigative Dermatology study. Researchers found a protein called CXXC5 that slows hair regrowth and is raised in balding human scalp. In human hair cells, CXXC5 slowed cell growth; in mice, a peptide that blocks it sped up hair regrowth. A 2023 study by the same group found the peptide also reversed hair loss caused by DHT and prostaglandin D2 in mice. The senior researcher is CEO of a company licensed to develop the peptide. So far, PTD-DBM research has only been done in cells and mice.\n\nThe human evidence is for methyl vanillate: a 2016 uncontrolled, open-label study of 20 women with female pattern hair loss used a 0.2% methyl vanillate spray for 6 months. Hair count rose 6% and hair mass index 12% from baseline, with no dropouts for side effects. There was no placebo group, and InfiniWell doesn\'t say how much methyl vanillate its serum contains.\n\nIf you have thinning hair, a dermatologist can check for causes and discuss treatments with stronger evidence, such as minoxidil.',
        doctorOpinionShort: 'PTD-DBM has been tested only in cells and mice so far. Methyl vanillate has one small, uncontrolled study in 20 women (6% more hairs after 6 months). No study of this serum was found, and InfiniWell doesn\'t publish its ingredient amounts.',
        doctorOpinionCitations: [
            { url: 'https://infiniwell.com/products/ptd-dbm-methyl-vanillate', label: 'infiniwell.com: PTD-DBM + Methyl Vanillate, claims and FAQ' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/28595998/', label: 'PubMed: Targeting of CXXC5 by a competing peptide stimulates hair regrowth and wound-induced hair neogenesis (J Invest Dermatol 2017)', chipLabel: 'PTD-DBM cell and mouse study (2017)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/36831222/', label: 'PubMed: CXXC5 mediates DHT-induced androgenetic alopecia via PGD2 (Cells 2023)', chipLabel: 'PTD-DBM mouse study (2023)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/27121450/', label: 'PubMed: Topical methyl vanillate increases hair count and hair mass index in women with androgenetic alopecia (J Cosmet Dermatol 2016)', chipLabel: 'Methyl vanillate open-label study, 20 women (2016)' },
        ],
        whoItsFor: [
            'People with thinning hair who want a non-drug cosmetic scalp serum and are comfortable with early-stage evidence',
            'Not a substitute for seeing a dermatologist about new or fast hair loss',
            'Pregnant or nursing: InfiniWell says to check with your physician first',
        ],
        howToUse: {
            intro: 'Per InfiniWell: use daily.',
            steps: [
                'Apply evenly to the affected areas of the scalp once a day.',
                'No need to rinse; it can be used with your usual shampoo and conditioner.',
                'Avoid contact with eyes.',
            ],
            sourceUrl: 'https://infiniwell.com/products/ptd-dbm-methyl-vanillate',
            sourceLabel: 'infiniwell.com: PTD-DBM + Methyl Vanillate',
        },
        warnings: [
            'External use only; avoid contact with eyes.',
            'Pregnant, nursing, on prescription medication, or have a medical condition: consult your physician before use (per InfiniWell).',
            'Using medicated hair-loss treatments such as minoxidil: check with a healthcare professional first (per InfiniWell).',
            'Not for children.',
        ],
        communityReview: 'InfiniWell\'s page shows two sets of numbers. A stats card says 217 verified customers rated it 4.6 out of 5 on average, and 20% (about 1 in 5) mentioned thicker- or fuller-looking hair without being asked. InfiniWell says these reviews were collected by post-purchase email through July 2026 and that most reviewers received an incentive. Separately, the page header shows 4.9 stars from 1,136 reviews, which appear to cover InfiniWell\'s products more broadly. On Amazon it has 3.3 out of 5 stars from 37 ratings.',
        effectiveness: 'One small, uncontrolled study supports methyl vanillate in women with pattern hair loss.',
        ingredientScience: [
            {
                name: 'PTD-DBM',
                text: 'A peptide that blocks CXXC5, a protein that slows Wnt/β-catenin signaling and is raised in balding human scalp. In a 2017 study, CXXC5 slowed the growth of human hair follicle cells, and blocking it with the peptide sped up hair regrowth in mice. A 2023 study by the same group found it reversed hair loss caused by DHT and prostaglandin D2 in mice. The senior researcher is CEO of a company licensed to develop the peptide. So far, the research has only been done in cells and mice.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28595998/', label: 'PubMed: Targeting of CXXC5 by a competing peptide stimulates hair regrowth and wound-induced hair neogenesis (Lee et al., J Invest Dermatol 2017)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/36831222/', label: 'PubMed: CXXC5 mediates DHT-induced androgenetic alopecia via PGD2 (Ryu et al., Cells 2023)' },
                ],
            },
            {
                name: 'Methyl vanillate',
                text: 'In a 2016 uncontrolled, open-label study, 20 women aged 25 to 57 with female pattern hair loss used a spray with 0.2% methyl vanillate for 6 months. Hair count rose 6% and hair mass index 12% compared with baseline, and no one stopped because of side effects. There was no placebo group. InfiniWell doesn\'t publish its serum\'s methyl vanillate concentration.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27121450/', label: 'PubMed: Topical application of the Wnt/β-catenin activator methyl vanillate increases hair count and hair mass index in women with androgenetic alopecia (Tosti et al., 2016)' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://infiniwell.com/products/ptd-dbm-methyl-vanillate',
                        text: 'infiniwell.com: PTD-DBM customer reviews',
                        summary: '217 verified buyers average 4.6 out of 5, collected by post-purchase email; most reviewers received an incentive.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.amazon.com/InfiniWell-Hair-Growth-Serum-Restoration/dp/B09J97Z29F',
                        text: 'Amazon: InfiniWell PTD-DBM Peptide Hair Serum reviews',
                        summary: '3.3 out of 5 stars from 37 ratings at time of writing.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // Lilyeve Grow:Turn Ampoule, verified against
    // lilyeveus.com/products/lilyeve-antihairloss-growturn-ampoule100 on
    // 2026-10-07 (price, full ingredients, how-to, claim images, review
    // breakdown) and the Amazon listing B0DXPGSDZJ (rating, price). Image
    // supplied by ayna. Studies read via NCBI E-utilities. Not a brand
    // partner, no affiliate link.
    {
        id: 'p-lilyeve-growturn-ampoule',
        name: 'Lilyeve Grow:Turn Ampoule (Hair Serum with Brush)',
        brand: 'Lilyeve',
        category: 'hair',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['lilyeve', 'growturn', 'grow:turn', 'hair', 'scalp', 'hair serum', 'thinning', 'shedding', 'caffeine', 'heartleaf', 'exosome', 'korean', 'cosmetic'],
        price: '$29.70',
        whereToBuy: ['lilyeveus.com', 'Amazon'],
        url: 'https://www.lilyeveus.com/products/lilyeve-antihairloss-growturn-ampoule100',
        whereToBuyLinks: {
            'lilyeveus.com': 'https://www.lilyeveus.com/products/lilyeve-antihairloss-growturn-ampoule100',
            Amazon: 'https://www.amazon.com/dp/B0DXPGSDZJ',
        },
        image: '/products/lilyeve/growturn-ampoule.png', // supplied by ayna
        summary: 'A Korean leave-in scalp serum in a 100 mL tube with a built-in 38-bristle brush head for massaging it in. Lilyeve says it reduces hair shedding and flakes and soothes the scalp, using caffeine, heartleaf (which it calls exosome-derived) and a herbal blend it calls Scalp Clera. Apply to a damp scalp after shampooing, morning and evening. It\'s sold for both men and women.',
        ingredients: 'Full ingredient list per Lilyeve: Water, Alcohol Denat., Butylene Glycol, Caffeine, 1,2-Hexanediol, Hydroxyacetophenone, PEG-60 Hydrogenated Castor Oil, Carbomer, Tromethamine, Menthol, Trideceth-10, Betaine, Disodium EDTA, Glycerin, Eucalyptus Globulus Leaf Oil, Camellia Japonica Flower Extract, Prunus Mume Flower Extract, Prunus Persica (Peach) Flower Extract, Althaea Rosea Flower Extract, Viola Mandshurica Flower Extract, Helianthus Annuus (Sunflower) Flower Extract, Houttuynia Cordata (Heartleaf) Extract, Cyananthus Atratus Extract, Inula Britannica Flower Extract, Lysimachia Foenum-graecum Extract. No exosome ingredient is named in this list, and two of the three Scalp Clera herbs Lilyeve names (Cimicifuga heracleifolia and Pogostemon cablin) aren\'t in it either. The Amazon listing mentions biotin and peptides, which also aren\'t in this list.',
        safety: {
            fdaStatus: 'Sold as a cosmetic; not an FDA-approved drug for hair loss.',
            materials: '100 mL tube with a twist-lock brush head (38 bristles). The second ingredient is denatured alcohol, and it contains menthol and eucalyptus leaf oil even though Lilyeve markets it as fragrance-free.',
            recalls: 'No recalls found.',
            sideEffects: 'No warnings are published on Lilyeve\'s product page. It contains denatured alcohol, menthol and eucalyptus oil, so patch test first if you have a sensitive scalp.',
            opinionAlerts: 'Lilyeve\'s results (75.61% less hair fall after 4 weeks, 89.04% less flaking) are from its own unpublished testing, with no details on how many people took part or whether there was a comparison group.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Lilyeve; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Lilyeve says that, "based on clinical testing," four weeks of use cut hair fall by 75.61%, scalp flakiness by 89.04% and scalp irritation by 62.89%, and raised scalp hydration by 113.70%. It doesn\'t say how many people were tested, whether there was a comparison group, or who ran the test, and no published study of this product was found.\n\nCaffeine is the best-studied ingredient here. In a 2017 open-label randomized trial of 210 men with pattern hair loss, a 0.2% caffeine scalp liquid did about as well as 5% minoxidil after 6 months (anagen hairs improved 10.59% vs 11.68%). That trial was in men, and Lilyeve doesn\'t publish its caffeine concentration.\n\nHeartleaf (Houttuynia cordata) extract helped cultured human hair cells grow and kept lab-grown hair follicles in their growth phase longer in a 2019 lab study by a cosmetics company; it hasn\'t been tested on people\'s hair loss. Exosomes are a new area: a 2025 review found only 125 patients across the clinical studies of exosomes for hair loss and called for larger, well-designed trials. Lilyeve\'s ingredient list doesn\'t name an exosome ingredient.\n\nIf you have thinning hair, a dermatologist can check for causes and discuss treatments with stronger evidence, such as minoxidil.',
        doctorOpinionShort: 'Lilyeve\'s results come from its own unpublished testing. Topical caffeine has one notable trial in 210 men, where it did about as well as minoxidil; heartleaf has been tested only in lab-grown hair cells, and exosomes for hair loss are still early. No published study of this serum was found.',
        doctorOpinionCitations: [
            { url: 'https://www.lilyeveus.com/products/lilyeve-antihairloss-growturn-ampoule100', label: 'lilyeveus.com: Grow:Turn Ampoule, ingredients and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29055953/', label: 'PubMed: Caffeine-based topical liquid 0.2% vs minoxidil 5% in male androgenetic alopecia, open-label randomized trial (Skin Pharmacol Physiol 2017)', chipLabel: 'Caffeine vs minoxidil trial, 210 men (2017)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/31582654/', label: 'PubMed: Hair growth promoting effect of Houttuynia cordata extract in cultured human hair follicle dermal papilla cells (Biol Pharm Bull 2019)', chipLabel: 'Heartleaf lab study (2019)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/39447204/', label: 'PubMed: Exosomes for treating hair loss, a review of clinical studies (Dermatol Surg 2025)', chipLabel: 'Exosomes for hair loss review (2025)' },
        ],
        whoItsFor: [
            'People with thinning hair or shedding who want a non-drug scalp serum with a built-in massage brush',
            'People with a flaky or itchy scalp looking for a cooling, leave-in serum',
            'Not a substitute for seeing a dermatologist about new or fast hair loss',
        ],
        howToUse: {
            intro: 'Per Lilyeve: use twice daily, morning and evening.',
            steps: [
                'After shampooing, gently towel-dry your hair until damp.',
                'Twist the brush head counterclockwise to unlock.',
                'Apply directly to the scalp, focusing on thinning areas.',
                'Twist the brush head clockwise to lock, then massage the scalp with the brush.',
            ],
            sourceUrl: 'https://www.lilyeveus.com/products/lilyeve-antihairloss-growturn-ampoule100',
            sourceLabel: 'lilyeveus.com: Grow:Turn Ampoule',
        },
        warnings: [
            'Contains denatured alcohol, menthol and eucalyptus oil: patch test first if you have a sensitive scalp.',
            'Using medicated hair-loss treatments such as minoxidil: check with a healthcare professional before combining.',
        ],
        communityReview: 'On lilyeveus.com, 1,434 of 1,642 reviews (87%) are five stars, and 35 are one or two stars. On Amazon it has 4.1 out of 5 stars from 954 ratings. Reviews on Lilyeve\'s site range from "seems to be working after a month" to "roots feel stronger but not like dramatic changes yet like in ads."',
        effectiveness: 'No published study of this serum was found. Its best-studied ingredient, topical caffeine, did about as well as minoxidil in one trial in men.',
        ingredientScience: [
            {
                name: 'Caffeine',
                text: 'In a 2017 open-label, randomized trial of 210 men with pattern hair loss, a 0.2% caffeine scalp liquid was not inferior to 5% minoxidil after 6 months: the share of hairs in the growth (anagen) phase improved 10.59% with caffeine and 11.68% with minoxidil. The trial was in men only and wasn\'t blinded. Lilyeve doesn\'t publish its caffeine concentration.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/29055953/', label: 'PubMed: An open-label randomized multicenter study assessing the noninferiority of a caffeine-based topical liquid 0.2% versus minoxidil 5% solution in male androgenetic alopecia (Dhurat et al., 2017)' },
                ],
            },
            {
                name: 'Heartleaf (Houttuynia cordata)',
                text: 'In a 2019 lab study by researchers at LG Household & Healthcare, heartleaf extract made cultured human hair papilla cells multiply and kept lab-grown human hair follicles in their growth phase longer. It hasn\'t been tested for hair loss in people.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31582654/', label: 'PubMed: Hair growth promoting effect of Houttuynia cordata extract in cultured human hair follicle dermal papilla cells (Kim et al., 2019)' },
                ],
            },
            {
                name: 'Exosomes',
                text: 'A 2025 review of exosomes for hair loss found nine relevant clinical studies covering 125 patients in total. Side effects were rare, but the authors called for larger, well-designed trials and consistent manufacturing standards. Lilyeve says its exosomes come from heartleaf, but its ingredient list doesn\'t name an exosome ingredient.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/39447204/', label: 'PubMed: Exosomes for treating hair loss, a review of clinical studies (Queen & Avram, Dermatol Surg 2025)' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.amazon.com/dp/B0DXPGSDZJ',
                        text: 'Amazon: lilyeve GROWTURN Hair Growth Serum reviews',
                        summary: '4.1 out of 5 stars from 954 ratings at time of writing.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.lilyeveus.com/products/lilyeve-antihairloss-growturn-ampoule100',
                        text: 'lilyeveus.com: Grow:Turn customer reviews',
                        summary: '1,642 reviews; 87% are five stars.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // HerAuré HerMag Magnesium 20-in-1 Complex, verified against
    // heraure.com/products/hermag-magnesium-20-in-1-complex on 2026-10-07
    // (price, ingredient facts, usage, FAQ). Image supplied by ayna. NIH ODS
    // magnesium fact sheet read in a browser (it blocks curl); studies read
    // via NCBI E-utilities. Not a brand partner, no affiliate link.
    {
        id: 'p-heraure-hermag-magnesium',
        name: 'HerAuré HerMag Magnesium 20-in-1 Complex',
        brand: 'HerAuré',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement', 'sleep'],
        tags: ['heraure', 'hermag', 'magnesium', 'magnesium glycinate', 'l-theanine', 'lions mane', 'sleep', 'stress', 'relaxation', 'focus', 'supplement'],
        price: '$29.99 for 90 capsules (list $49.99)',
        whereToBuy: ['heraure.com'],
        url: 'https://heraure.com/products/hermag-magnesium-20-in-1-complex',
        image: '/products/heraure/hermag-magnesium.webp', // supplied by ayna
        summary: 'A daily magnesium capsule made for women, combining 12 forms of magnesium (led by magnesium glycinate) with a brain blend of L-theanine, lion\'s mane, alpha-GPC, phosphatidylserine, PQQ, vitamin B6 and zinc, plus slippery elm. HerAuré says it supports relaxation, restful sleep, calm focus and steady energy. Take 2 capsules a day, which gives 300 mg of magnesium; a bottle lasts 45 days.',
        ingredients: 'Per serving (2 capsules), per HerAuré: HerMag™ Magnesium Complex 800 mg (magnesium glycinate, malate, taurate, orotate, aspartate, lactate, ascorbate, gluconate, sulfate heptahydrate, citrate, oxide and chloride), providing 300 mg magnesium (71% DV). NeuroRadiance™ Blend 135 mg: L-theanine, lion\'s mane mushroom extract, alpha-GPC, phosphatidylserine, PQQ (disodium salt), vitamin B6, zinc (as zinc picolinate). Slippery elm bark extract 50 mg. Other ingredients: HPMC vegetarian capsules, rice flour, magnesium stearate, silicon dioxide. The amounts of each magnesium form and each blend ingredient aren\'t listed.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA for safety or efficacy claims.',
            materials: '90 vegan capsules (2 a day, 45-day supply). Made in the USA, per the label.',
            recalls: 'No recalls found.',
            sideEffects: 'Each serving has 300 mg of magnesium, under the NIH\'s 350 mg daily upper limit for magnesium from supplements; if you take other magnesium products, the total can go over it. The NIH says high supplement intakes can cause diarrhea, nausea and abdominal cramping. Full warnings are listed below.',
            opinionAlerts: 'The label\'s "1685 mg" and "12x absorption" claims aren\'t explained on HerAuré\'s product page, which lists 800 mg of magnesium compounds giving 300 mg of magnesium per serving.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from HerAuré; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'HerAuré says this formula supports relaxation, restful sleep, calm focus and steady energy. No study of this product was found, and HerAuré doesn\'t list how much of each ingredient is in its blends, so what follows is what the research says about its main ingredients.\n\nThe evidence for magnesium and sleep is weak. A 2026 systematic review of 12 randomized trials concluded that current evidence doesn\'t support oral magnesium as a routine treatment for insomnia; it may modestly help some people, but results were inconsistent and the certainty of evidence was low to very low. An earlier 2021 review of 3 trials in 151 older adults found people fell asleep about 17 minutes faster on magnesium than placebo, also with low-quality evidence.\n\nL-theanine has somewhat more support: a 2025 meta-analysis of 18 trials (897 people) found small improvements in self-reported sleep quality and how quickly people fell asleep, though many studies didn\'t test L-theanine alone. This product\'s whole 7-ingredient brain blend is 135 mg, so its L-theanine dose is unknown.\n\nIf you have ongoing trouble sleeping, it\'s worth talking to a clinician.',
        doctorOpinionShort: 'Evidence that magnesium helps sleep is low quality and inconsistent; L-theanine has small benefits for self-reported sleep. HerAuré doesn\'t publish the amount of each ingredient, and no study of this product was found. Its 300 mg of magnesium is under the NIH\'s 350 mg daily supplement limit.',
        doctorOpinionCitations: [
            { url: 'https://heraure.com/products/hermag-magnesium-20-in-1-complex', label: 'heraure.com: Magnesium 20-in-1 Complex, ingredients and claims' },
            { url: 'https://ods.od.nih.gov/factsheets/Magnesium-Consumer/', label: 'NIH Office of Dietary Supplements: Magnesium, upper limits and interactions' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/42661485/', label: 'PubMed: Magnesium supplementation for sleep in adults, systematic review of randomized controlled trials (J Diet Suppl 2026)', chipLabel: 'Magnesium for sleep review, 12 trials (2026)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/33865376/', label: 'PubMed: Oral magnesium supplementation for insomnia in older adults, systematic review and meta-analysis (BMC Complement Med Ther 2021)', chipLabel: 'Magnesium for insomnia meta-analysis, 151 people (2021)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/40056718/', label: 'PubMed: The effects of L-theanine consumption on sleep outcomes, systematic review and meta-analysis (Sleep Med Rev 2025)', chipLabel: 'L-theanine sleep meta-analysis, 897 people (2025)' },
        ],
        whoItsFor: [
            'Adults who want a magnesium supplement as part of a bedtime or daily routine',
            'Pregnant, breastfeeding, on medication or managing a medical condition: HerAuré says to check with your healthcare professional first',
            'Not a substitute for seeing a clinician about ongoing insomnia, anxiety or low energy',
        ],
        howToUse: {
            intro: 'Per HerAuré: take it consistently; any time of day works, though many people take it in the evening.',
            steps: [
                'Take 2 capsules daily, with or without food.',
            ],
            sourceUrl: 'https://heraure.com/products/hermag-magnesium-20-in-1-complex',
            sourceLabel: 'heraure.com: Magnesium 20-in-1 Complex',
        },
        warnings: [
            'Pregnant, breastfeeding, taking medication or managing a medical condition: talk with your healthcare professional first (per HerAuré).',
            'Taking other magnesium supplements or magnesium-containing medicines: the NIH\'s upper limit for magnesium from supplements and medications is 350 mg a day for adults, and this product alone has 300 mg.',
            'Taking a bisphosphonate for osteoporosis: the NIH says these aren\'t well absorbed when taken too close to a magnesium supplement, so ask about timing.',
            'Diarrhea, nausea or cramping: the NIH lists these as effects of too much supplemental magnesium.',
        ],
        communityReview: 'HerAuré\'s product page shows no customer reviews for this product yet.',
        effectiveness: 'Evidence that magnesium improves sleep is low quality and inconsistent; L-theanine shows small benefits for self-reported sleep.',
        ingredientScience: [
            {
                name: 'Magnesium (for sleep)',
                text: 'A 2026 systematic review of 12 randomized trials found inconsistent results and low to very low certainty of evidence, and concluded that oral magnesium isn\'t supported as a routine insomnia treatment, though it may modestly help some people. A 2021 meta-analysis of 3 trials in 151 older adults found magnesium cut the time to fall asleep by about 17 minutes versus placebo; total sleep time didn\'t change significantly, and the evidence was low quality.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/42661485/', label: 'PubMed: Magnesium supplementation for sleep in adults, a systematic review of randomized controlled trials (Lopresti et al., J Diet Suppl 2026)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/33865376/', label: 'PubMed: Oral magnesium supplementation for insomnia in older adults, a systematic review & meta-analysis (Mah & Pitre, 2021)' },
                ],
            },
            {
                name: 'Magnesium (safety)',
                text: 'The NIH sets the upper limit for magnesium from supplements and medications at 350 mg a day for adults. Too much can cause diarrhea, nausea and abdominal cramping, and magnesium supplements can interfere with some medicines, such as bisphosphonates for osteoporosis.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/Magnesium-Consumer/', label: 'NIH Office of Dietary Supplements: Magnesium fact sheet for consumers' },
                ],
            },
            {
                name: 'L-theanine',
                text: 'A 2025 meta-analysis of 18 randomized trials (897 people) found L-theanine made small improvements in self-reported sleep quality, time to fall asleep and daytime functioning. The authors noted few studies tested L-theanine on its own. HerAuré doesn\'t list its L-theanine dose.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/40056718/', label: 'PubMed: The effects of L-theanine consumption on sleep outcomes, a systematic review and meta-analysis (Bulman et al., Sleep Med Rev 2025)' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: { links: [] },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // Liv Labs (Pippa Resistance Spring), catalog entries only, NOT an ayna
    // brand partner: deliberately left out of src/utils/partnerBrands.js and
    // the Brand Partnerships page. Distinct from LiM Method (limmethod.com),
    // a different company: Liv Labs (livlabsfitness.com) makes the
    // internally worn Pippa resistance spring.
    //
    // Rewritten 2026-10-29 at Eliz's request from what Liv Labs (Carly Price)
    // sent the team, plus the sources she pointed to, all read that day:
    // livlabsfitness.com (both kit pages, incl. their reviews), the Pippa
    // listing on My Pelvizen (app.mypelvizen.com/marketplace_items/22, which
    // has the Quick Start Plan), the Pippa listing on mypelvicbra.shop, and
    // the ICS 2026 abstract (ics.org/2026/abstract/105). NIH SBIR grant
    // R44HD105574 checked on NIH RePORTER; openFDA has no 510(k) or
    // registration for Liv Labs or Pippa (checked 2026-10-29).
    //
    // HIDDEN 2026-10-17 (not deleted) at Eliz's request: not visible anywhere
    // on the site. To make it live again, follow "Hidden products" in CLAUDE.md.
    {
        id: 'p-livlabs-pippa-starter-kit',
        hidden: true,
        name: 'Pippa Resistance Spring Starter Kit',
        brand: 'Liv Labs',
        category: 'pelvic-floor',
        type: 'physical',
        internal: true,
        healthFunctions: ['pelvic-floor'],
        tags: ['fitness', 'pelvic-floor', 'comfort'],
        price: '$119.00',
        whereToBuy: ['livlabsfitness.com'],
        url: 'https://livlabsfitness.com/products/pippa-resistance-spring-starter-kit',
        image: '/products/livlabs/pippa-starter-kit.webp',
        // Who Liv Labs builds Pippa for (their ideal customer profile, from
        // Carly Price's email to the team, 2026-10-29). Backend only: nothing
        // on the site displays this field; it's here so matching and the team
        // know who the product suits.
        idealCustomers: [
            'Runners, power lifters, triathletes, Ironman competitors, gymnasts, dancers and other athletes',
            'Postpartum moms who are very physically active',
            'Women over 40 who are very physically active',
        ],
        // What Liv Labs says about the product's classification (same email).
        brandNotes: 'Liv Labs classes Pippa as a fitness/wellness product and ships it under the code for resistance bands. Brand disclaimer: "This product is not intended to diagnose, treat, cure, or prevent any disease." Liv Labs is preparing Starter and Fit Kit versions that come with a storage pouch; images to follow.',
        summary: 'The first wearable product designed to boost pelvic floor fitness, just by wearing it while you move, per Liv Labs. Pippa is a soft spring of platinum-catalyzed biomedical silicone, worn internally like a tampon; its spring-form gently engages the pelvic floor, creating continual light resistance that helps the brain better recruit the right muscles, at the right time, and with the right amount of force. Liv Labs\' comparison: a resistance band, but for the pelvic floor. The Starter Kit has one light-resistance spring (42 mm) and a reusable applicator, and is meant for women who have never had children and have been advised to do kegels. Developed over 7 years by female designers, engineers, athletes and clinical experts.',
        safety: {
            fdaStatus: 'Sold as a fitness/wellness product, not a medical device, per Liv Labs ("not intended to diagnose, treat, cure, or prevent any disease"). ayna found no FDA 510(k) clearance or FDA registration for Liv Labs or Pippa (openFDA, checked 2026-10-29). Its NIH grant was awarded for testing toward a 510(k) clearance, which has not been found.',
            materials: 'Starter Kit: one light-resistance (42 mm) spring and one reusable applicator. Springs are made in the USA of premium, platinum-catalyzed biomedical silicone, free of BPAs and microplastics, per Liv Labs. Each spring is safe for up to 92 uses if used as directed, per Liv Labs.',
            recalls: 'No recalls found.',
            sideEffects: 'Liv Labs says Pippa has been safety-tested, including for use during pregnancy and menstruation. One Starter Kit reviewer said wearing it every day almost gave her sore pelvic floor muscles, and switched to about three times a week.',
            opinionAlerts: 'It is worn internally, so follow the cleaning steps every time (wash with a cleanser and air dry between uses). If you can feel it during use and can\'t insert it further, Liv Labs suggests seeing a healthcare provider.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'From Liv Labs and the ICS 2026 abstract of a study Liv Labs funded, plus one independent review of a related device category (weighted vaginal cones).',
        doctorOpinion: 'Liv Labs funded a mechanistic study at Baylor University\'s Institute for Musculoskeletal Advancement, led by Dr. Laurel Proulx, a pelvic health physical therapist and researcher. Its abstract was published by the International Continence Society (ICS 2026, abstract 105). Fifteen women aged 20 to 39 with no pelvic floor symptoms were imaged with and without Pippa inserted (ultrasound and shear wave elastography), in a single group, before-and-after design. With Pippa in place, normal lifting and lowering of the pelvic floor was unchanged, and the puborectalis muscle became stiffer from rest to bearing down (change-score analysis, p=0.03). During a voluntary squeeze, stiffness was lower with the device (p=0.04), which the authors say is not well understood. The study measured muscle mechanics in one session, not symptoms; the authors say research in women with symptoms, during and after pregnancy, and in perimenopause is needed to know whether it helps. The abstract states the funder had no role in the design, analysis or writing.\n\nDr. Mallory Willis, a pelvic health physical therapist and owner of Peak Pelvic Health, wrote in a review on Liv Labs\' site: "These are a great, comfortable and easy to use option especially for postpartum recovery!"\n\nFor context, a related device category, weighted vaginal cones, has a Cochrane review: 23 small trials (1,806 women) found cones better than no treatment for stress urinary incontinence and about as good as pelvic floor muscle training. Cones work differently (holding a weight in place), so this doesn\'t test Pippa itself.',
        doctorOpinionShort: 'A Liv Labs-funded study of 15 women without symptoms (ICS 2026) found Pippa left normal pelvic floor movement unchanged and stiffened a key pelvic floor muscle during bearing down. It didn\'t measure symptoms. A pelvic health PT calls it a comfortable, easy option for postpartum recovery.',
        doctorOpinionCitations: [
            { url: 'https://www.ics.org/2026/abstract/105', label: 'ICS 2026 abstract 105: Neuromuscular effects of an OTC vaginal support device (Baylor University; funded by Liv Labs)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/23836411/', label: 'PubMed (NIH): Weighted vaginal cones for urinary incontinence (Cochrane review, 2013)' },
        ],
        whoItsFor: [
            'Physically active women who want the benefits of pelvic floor exercise without a kegel routine: group classes, running, dancing, weight lifting, military training and sports (per Liv Labs)',
            'Starter Kit: women who have never had children and have been advised to do kegels. If you\'ve had children, Liv Labs recommends the Fit Kit.',
            'Liv Labs\' three uses: worn during workouts for a passive pelvic floor boost; as a recovery tool for biofeedback and retraining after childbirth or injury; and for added resistance during pelvic floor exercises',
        ],
        howToUse: {
            intro: 'Per Liv Labs\' Quick Start Plan:',
            steps: [
                'Insert it with the applicator, much like a tampon. A water-based lubricant can make insertion more comfortable.',
                'Check placement: after a few moments you shouldn\'t feel it. If you do, insert it further up. If that isn\'t possible, consider seeing a healthcare provider.',
                'Then move as usual: walk, hike, run, work out or do yard work. No squeeze-and-relax drills are needed, and kegels done with Pippa in place will feel harder.',
                'Remove it any time. Wash with cleanser and air dry between uses. Each spring is good for up to 92 uses if used as directed.',
            ],
            sourceUrl: 'https://app.mypelvizen.com/marketplace_items/22',
            sourceLabel: 'My Pelvizen: Pippa Resistance Spring (Liv Labs\' Quick Start Plan)',
        },
        warnings: [
            'Worn internally: wash it with a cleanser and air dry between every use (Liv Labs).',
            'Not intended to diagnose, treat, cure or prevent any disease (Liv Labs). For leaking, prolapse or pelvic pain, see a clinician or pelvic floor physical therapist.',
            'Pregnant or postpartum: Liv Labs says it\'s safety-tested for use in pregnancy; check with your clinician first.',
            'Stop and seek care for pain, bleeding, unusual discharge or signs of infection.',
        ],
        communityReview: 'On livlabsfitness.com the Starter Kit has 2 reviews, both 5 stars (checked October 29, 2026). One reviewer found daily wear almost made her muscles sore and now wears it about three times a week; another, using it to stay ahead of problems as she ages, wears it on the treadmill and on walks and praised a customer-care call that walked her through insertion. The Fit Kit page has more reviews (13), most from women who have had children. Pippa was named a Fast Company 2025 Innovation by Design honoree, per Liv Labs.',
        ingredients: 'Platinum-catalyzed biomedical silicone resistance spring (light, 42 mm); reusable applicator.',
        effectiveness: 'A Liv Labs-funded mechanistic study in 15 women without symptoms (ICS 2026 abstract) found Pippa preserved normal pelvic floor movement and increased puborectalis stiffness during bearing down. It did not measure symptoms such as leaking, and no trial in women with symptoms has been published yet. Full results are expected in the journal Continence, per Liv Labs.',
        scientificCitations: [
            { url: 'https://www.ics.org/2026/abstract/105', text: 'ICS 2026 abstract 105: Neuromuscular Effects of an Over-the-Counter Vaginal Support Device: A Mechanistic Evaluation in Asymptomatic Women', summary: 'Single-group, before-and-after imaging study of 15 women aged 20 to 39 without symptoms (Baylor University). Pippa preserved normal pelvic floor movement and increased puborectalis stiffness during bearing down; stiffness during a voluntary squeeze was lower with the device. Funded by Liv Labs. Continence 19S (2026) 102582.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/23836411/', text: 'Cochrane: Weighted vaginal cones for urinary incontinence (2013)', summary: '23 small trials, 1,806 women: cones were better than no treatment for stress urinary incontinence and about as good as pelvic floor muscle training. A related device category, not Pippa itself.' },
        ],
        integrations: [],
        badges: ['Female-Founded', 'Fast Company 2025 Innovation by Design Honoree'],
        verificationLinks: {
            community: { links: [
                { platform: 'website', url: 'https://livlabsfitness.com/products/pippa-resistance-spring-starter-kit', text: 'livlabsfitness.com: Pippa Starter Kit reviews', summary: '2 reviews, both 5 stars, as of October 29, 2026.' },
                { platform: 'website', url: 'https://app.mypelvizen.com/marketplace_items/22', text: 'My Pelvizen: Pippa Resistance Spring', summary: 'Liv Labs\' Quick Start Plan, quotes from users and a PT, and a summary of the research.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/pelvicfloor/search/?q=pippa%20liv%20labs', text: 'Reddit r/pelvicfloor: Pippa/Liv Labs search', summary: 'User discussion of the Pippa resistance spring.' },
            ] },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-livlabs-pippa-fit-kit',
        hidden: true,
        name: 'Pippa Resistance Spring Fit Kit',
        brand: 'Liv Labs',
        category: 'pelvic-floor',
        type: 'physical',
        internal: true,
        healthFunctions: ['pelvic-floor'],
        tags: ['fitness', 'pelvic-floor', 'postpartum', 'comfort'],
        price: '$149.00',
        whereToBuy: ['livlabsfitness.com', 'mypelvicbra.shop'],
        url: 'https://livlabsfitness.com/products/pippa-fit-kit',
        image: '/products/livlabs/pippa-fit-kit.webp',
        // Liv Labs' ideal customer profile (backend only, see the Starter Kit).
        idealCustomers: [
            'Runners, power lifters, triathletes, Ironman competitors, gymnasts, dancers and other athletes',
            'Postpartum moms who are very physically active',
            'Women over 40 who are very physically active',
        ],
        brandNotes: 'Liv Labs classes Pippa as a fitness/wellness product and ships it under the code for resistance bands. Brand disclaimer: "This product is not intended to diagnose, treat, cure, or prevent any disease." Liv Labs is preparing Starter and Fit Kit versions that come with a storage pouch; images to follow.',
        summary: 'The first wearable product designed to boost pelvic floor fitness, just by wearing it while you move, per Liv Labs. Pippa is a soft spring of platinum-catalyzed biomedical silicone, worn internally like a tampon; its spring-form gently engages the pelvic floor, creating continual light resistance that helps the brain better recruit the right muscles, at the right time, and with the right amount of force. The Fit Kit has two sizes, a light (42 mm) and a medium (50 mm) resistance spring, plus a reusable applicator, and is recommended for women who have had children and have been advised to do kegels. You may need to try both sizes to find your fit. Developed over 7 years by female designers, engineers, athletes and clinical experts.',
        safety: {
            fdaStatus: 'Sold as a fitness/wellness product, not a medical device, per Liv Labs ("not intended to diagnose, treat, cure, or prevent any disease"). ayna found no FDA 510(k) clearance or FDA registration for Liv Labs or Pippa (openFDA, checked 2026-10-29). Its NIH grant was awarded for testing toward a 510(k) clearance, which has not been found.',
            materials: 'Fit Kit: one light (42 mm) and one medium (50 mm) resistance spring and one reusable applicator. Springs are made in the USA of premium, platinum-catalyzed biomedical silicone, free of BPAs and microplastics, per Liv Labs. Each spring is safe for up to 92 uses if used as directed, per Liv Labs.',
            recalls: 'No recalls found.',
            sideEffects: 'Liv Labs says Pippa has been safety-tested, including for use during pregnancy and menstruation. A Starter Kit reviewer said daily wear almost gave her sore pelvic floor muscles, and switched to about three times a week.',
            opinionAlerts: 'It is worn internally, so follow the cleaning steps every time (wash with a cleanser and air dry between uses). If you can feel it during use and can\'t insert it further, Liv Labs suggests seeing a healthcare provider.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'From Liv Labs and the ICS 2026 abstract of a study Liv Labs funded, plus one independent review of a related device category (weighted vaginal cones).',
        doctorOpinion: 'Liv Labs funded a mechanistic study at Baylor University\'s Institute for Musculoskeletal Advancement, led by Dr. Laurel Proulx, a pelvic health physical therapist and researcher. Its abstract was published by the International Continence Society (ICS 2026, abstract 105). Fifteen women aged 20 to 39 with no pelvic floor symptoms were imaged with and without Pippa inserted (ultrasound and shear wave elastography), in a single group, before-and-after design. With Pippa in place, normal lifting and lowering of the pelvic floor was unchanged, and the puborectalis muscle became stiffer from rest to bearing down (change-score analysis, p=0.03). During a voluntary squeeze, stiffness was lower with the device (p=0.04), which the authors say is not well understood. The study measured muscle mechanics in one session, not symptoms; the authors say research in women with symptoms, during and after pregnancy, and in perimenopause is needed to know whether it helps. The abstract states the funder had no role in the design, analysis or writing.\n\nDr. Mallory Willis, a pelvic health physical therapist and owner of Peak Pelvic Health, wrote in a review of the Fit Kit on Liv Labs\' site: "These are a great, comfortable and easy to use option especially for postpartum recovery!"\n\nFor context, a related device category, weighted vaginal cones, has a Cochrane review: 23 small trials (1,806 women) found cones better than no treatment for stress urinary incontinence and about as good as pelvic floor muscle training. Cones work differently (holding a weight in place), so this doesn\'t test Pippa itself.',
        doctorOpinionShort: 'A Liv Labs-funded study of 15 women without symptoms (ICS 2026) found Pippa left normal pelvic floor movement unchanged and stiffened a key pelvic floor muscle during bearing down. It didn\'t measure symptoms. A pelvic health PT calls it a comfortable, easy option for postpartum recovery.',
        doctorOpinionCitations: [
            { url: 'https://www.ics.org/2026/abstract/105', label: 'ICS 2026 abstract 105: Neuromuscular effects of an OTC vaginal support device (Baylor University; funded by Liv Labs)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/23836411/', label: 'PubMed (NIH): Weighted vaginal cones for urinary incontinence (Cochrane review, 2013)' },
        ],
        whoItsFor: [
            'Physically active women who want the benefits of pelvic floor exercise without a kegel routine: group classes, running, dancing, weight lifting, military training and sports (per Liv Labs)',
            'Fit Kit: women who have had children and have been advised to do kegels (Liv Labs\' recommendation)',
            'Liv Labs\' three uses: worn during workouts for a passive pelvic floor boost; as a recovery tool for biofeedback and retraining after childbirth or injury; and for added resistance during pelvic floor exercises',
        ],
        howToUse: {
            intro: 'Per Liv Labs\' Quick Start Plan:',
            steps: [
                'Insert it with the applicator, much like a tampon. A water-based lubricant can make insertion more comfortable.',
                'Check placement: after a few moments you shouldn\'t feel it. If you do, insert it further up. If that isn\'t possible, consider seeing a healthcare provider.',
                'Then move as usual: walk, hike, run, work out or do yard work. No squeeze-and-relax drills are needed, and kegels done with Pippa in place will feel harder.',
                'Try both springs: Liv Labs suggests experimenting, or using each for different activities.',
                'Remove it any time. Wash with cleanser and air dry between uses. Each spring is good for up to 92 uses if used as directed.',
            ],
            sourceUrl: 'https://app.mypelvizen.com/marketplace_items/22',
            sourceLabel: 'My Pelvizen: Pippa Resistance Spring (Liv Labs\' Quick Start Plan)',
        },
        warnings: [
            'Worn internally: wash it with a cleanser and air dry between every use (Liv Labs).',
            'Not intended to diagnose, treat, cure or prevent any disease (Liv Labs). For leaking, prolapse or pelvic pain, see a clinician or pelvic floor physical therapist.',
            'Pregnant or postpartum: Liv Labs says it\'s safety-tested for use in pregnancy; check with your clinician first.',
            'Stop and seek care for pain, bleeding, unusual discharge or signs of infection.',
            'Bought from myPelvicBra: products for internal use can\'t be returned once the package is opened.',
        ],
        communityReview: 'On livlabsfitness.com the Fit Kit has 13 reviews: 11 five-star and 2 four-star (checked October 29, 2026). Several reviewers, many of them mothers, describe running, jumping classes and long runs without leaking, and one, years after a large vaginal birth, says she regained sensation and control within a week. Others note it\'s comfortable, stays put and that you may need to try both sizes. On mypelvicbra.shop, its 2 reviews are both 2 stars; one says it would have worked better with flat ends. Pippa was named a Fast Company 2025 Innovation by Design honoree, per Liv Labs.',
        ingredients: 'Platinum-catalyzed biomedical silicone resistance springs (light 42 mm and medium 50 mm); reusable applicator.',
        effectiveness: 'A Liv Labs-funded mechanistic study in 15 women without symptoms (ICS 2026 abstract) found Pippa preserved normal pelvic floor movement and increased puborectalis stiffness during bearing down. It did not measure symptoms such as leaking, and no trial in women with symptoms has been published yet. Full results are expected in the journal Continence, per Liv Labs.',
        scientificCitations: [
            { url: 'https://www.ics.org/2026/abstract/105', text: 'ICS 2026 abstract 105: Neuromuscular Effects of an Over-the-Counter Vaginal Support Device: A Mechanistic Evaluation in Asymptomatic Women', summary: 'Single-group, before-and-after imaging study of 15 women aged 20 to 39 without symptoms (Baylor University). Pippa preserved normal pelvic floor movement and increased puborectalis stiffness during bearing down; stiffness during a voluntary squeeze was lower with the device. Funded by Liv Labs. Continence 19S (2026) 102582.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/23836411/', text: 'Cochrane: Weighted vaginal cones for urinary incontinence (2013)', summary: '23 small trials, 1,806 women: cones were better than no treatment for stress urinary incontinence and about as good as pelvic floor muscle training. A related device category, not Pippa itself.' },
        ],
        integrations: [],
        badges: ['Female-Founded', 'Fast Company 2025 Innovation by Design Honoree'],
        verificationLinks: {
            community: { links: [
                { platform: 'website', url: 'https://livlabsfitness.com/products/pippa-fit-kit', text: 'livlabsfitness.com: Pippa Fit Kit reviews', summary: '13 reviews (11 five-star, 2 four-star) as of October 29, 2026.' },
                { platform: 'website', url: 'https://www.mypelvicbra.shop/collections/all/products/pippa%C2%AE-resistance-spring', text: 'mypelvicbra.shop: Pippa Resistance Spring', summary: 'myPelvicBra\'s listing of the Fit Kit, with 2 reviews (both 2 stars) as of October 29, 2026.' },
                { platform: 'website', url: 'https://app.mypelvizen.com/marketplace_items/22', text: 'My Pelvizen: Pippa Resistance Spring', summary: 'Liv Labs\' Quick Start Plan, quotes from users and a PT, and a summary of the research.' },
            ] },
        },
        isEmergingBrand: true,
    },
    // Alubri (alubri.com). ayna brand partner since 2026-10-17 (team request),
    // listed in src/utils/partnerBrands.js and on the Brand Partnerships page.
    // Shopify Collabs affiliate links (collabs.shop) added 2026-10-18 for all six.
    //
    // Sourcing rule for these six entries: alubri.com ONLY (product pages,
    // /pages/faq, /pages/science, /pages/about), fetched 2026-09-29. Prices,
    // sizes, ingredient lists, directions, warnings, and clinical-study
    // figures are all as alubri.com states them; no retailer listings,
    // press releases, or Reddit are used as sources. Every clinical figure
    // is the brand's own report, labeled as such. Two exceptions:
    // ingredientScience (Scientific Literature tab) cites NIH sources
    // (PubMed/PMC, NCCIH, MedlinePlus) for what each ingredient can do,
    // ingredient-level evidence, not validation of Alubri's products; and
    // every product's community links include its own Amazon listing (one
    // ASIN per product, found 2026-09-29), plus Reddit threads on the Gel and
    // Serum, as places to read real reviews. These sites block automated
    // access, so no rating or quote is taken from them.
    // whereToBuy is the retailer list from alubri.com's FAQ ("alubri.com and
    // select retailers including Amazon, Walmart.com, Target.com, and
    // Grove.com"); the site doesn't break that down per product. The
    // Rejuvenate & Restore Kit (added to alubri.com 2026-09-28) lists
    // alubri.com and Amazon, where its own listing (B0H73846JQ) exists.
    // Product photos stored under public/products/alubri/.
    {
        id: 'p-alubri-vaginal-moisturizing-gel',
        name: 'Alubri Vaginal Moisturizing Gel',
        brand: 'Alubri',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'menopause', 'hormone-free'],
        price: '$29.99 (50 mL, 8 applicators)',
        whereToBuy: ['alubri.com', 'Amazon', 'Walmart', 'Target', 'Grove'],
        url: 'https://alubri.com/products/vaginal-moisturizing-gel',
        affiliateUrl: 'https://collabs.shop/d0dtyn', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://alubri.com/pages/faq',
        image: '/products/alubri/vaginal-moisturizing-gel.webp',
        summary: 'A hormone-free, fragrance-free internal vaginal moisturizer that Alubri says delivers up to 72 hours of hydration from one application. It pairs hyaluronic acid (sodium hyaluronate) and lactic acid with Alubri\'s proprietary "Activated Oil Complex" (pre-activated coconut and rosehip oils), which the brand says balances the vaginal microbiome. Each box is a 50 mL tube with 8 single-use applicators; used twice a week, one box lasts about 4 weeks.',
        safety: {
            fdaStatus: 'alubri.com presents it as a hormone-free personal-care moisturizer and does not describe it as an FDA-cleared device or drug.',
            // Full ingredient list as printed on alubri.com, shown in full
            // under "Materials" on the Evidence view (see buildFactRows in
            // ProductModal.jsx, which doesn't truncate this field).
            materials: '50 mL (1.7 fl oz) tube with 8 single-use applicators. Ingredients: aqua (water), glucomannan, hydrolyzed Rosa canina (rosehip) fruit oil, hydrolyzed Cocos nucifera (coconut) oil, sodium hyaluronate, lactic acid, Hylocereus undatus (dragon fruit) fruit extract, Aloe barbadensis leaf juice, propanediol, xanthan gum, potassium sorbate, sodium benzoate, benzyl alcohol, benzoic acid. Fragrance-free and hormone-free.',
            recalls: 'No recalls are mentioned on alubri.com; check current regulator and manufacturer recall notices.',
            sideEffects: 'Alubri says some women feel a mild warming or blushing sensation on first use, or brief stinging from the lactic acid, that usually fades within minutes. If discomfort persists, stop and see a doctor. Full warnings are listed below.',
            opinionAlerts: 'The clinical figures (72-hour hydration, microbiome changes) come from a study Alubri describes on its own site; the full study isn\'t published there.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced only from Alubri\'s own site (alubri.com), not independent clinical literature.',
        doctorOpinion: 'Alubri says the gel was developed by Dr. Nicole Kerner, its co-founder and Chief Medical Officer, a board-certified, menopause-certified OB-GYN with more than 20 years in women\'s health.\n\nThe brand cites an independent, third-party, IRB-approved study run under ISO Good Laboratory Practices: 51 symptomatic menopausal women used the gel twice a week for one month. Brand-reported results: one application raised vaginal hydration by 64% at 72 hours, and 94% said their vagina felt moisturized, 94% hydrated, and 92% soothed.\n\nAlubri also reports that a single application measurably increased Lactobacillus (the "good" vaginal bacteria) and decreased Gardnerella vaginalis, with the changes sustained over four weeks. These are brand-reported results; the full study isn\'t published on alubri.com.',
        doctorOpinionShort: 'Alubri cites a third-party study of 51 menopausal women: one application raised vaginal hydration 64% at 72 hours, and 94% said they felt moisturized. Developed by a menopause-certified OB-GYN. Brand-reported results.',
        doctorOpinionCitations: [
            { url: 'https://alubri.com/products/vaginal-moisturizing-gel', label: 'alubri.com: where Alubri presents these results' },
            { url: 'https://alubri.com/pages/science', label: 'alubri.com: Science (microbiome results)' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        // From the "Ideal for" list on alubri.com.
        whoItsFor: [
            'Vaginal dryness from perimenopause, menopause, or postmenopause',
            'Hormone-related dryness from surgical menopause, breastfeeding, or certain medications (including aromatase inhibitors and anti-estrogen therapies)',
            'Women who want a hormone-free option, including those with a history of estrogen-receptor-positive breast cancer',
            'Anyone looking to support vaginal microbiome balance',
        ],
        // Rendered as a bulleted list on the Evidence view.
        howToUse: {
            intro: 'Per Alubri\'s own directions:',
            steps: [
                'Attach a single-use applicator to the tube and squeeze to fill to 3 grams.',
                'Insert the applicator into the vagina and push to release the gel.',
                'Remove the applicator and throw it away.',
                'Use twice a week, ideally at bedtime, or as needed. For best absorption, lie flat for about 10 minutes afterward.',
                'Using it during the day? Wait at least 10 minutes before swimming or bathing.',
                'Also using vaginal estrogen? Alubri suggests using the gel on alternate nights (for example, estrogen Monday and Thursday, gel Tuesday and Friday).',
            ],
            sourceUrl: 'https://alubri.com/products/vaginal-moisturizing-gel',
            sourceLabel: 'alubri.com: Vaginal Moisturizing Gel',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'A mild warming or blushing feeling on first use is normal per Alubri. If discomfort persists, stop and see a doctor.',
            'Alubri says a slight increase in discharge is normal at first and should ease within a few uses.',
            'Itching or irritation that persists despite a moisturizer can be a sign of infection. See a doctor.',
            'Not tested for compatibility with condoms, per Alubri.',
        ],
        communityReview: 'Customer reviews for this gel are on its Amazon listing, and a Reddit r/AskONLYWomenOver30 thread has women comparing the vaginal moisturizers they\'ve tried (both linked below). Neither site allows automated access, so ayna hasn\'t pulled a rating or quotes from them; read them directly. alubri.com itself shows no star rating, only the brand\'s own study results: 94% of participants said the fragrance-free gel smells good and 88% said it stayed put.',
        effectiveness: 'Alubri reports a 64% increase in vaginal hydration 72 hours after one application, plus favorable microbiome changes, in its own study of 51 menopausal women. No independent study of this product is cited on alubri.com.',
        // Plain-text ingredient summary, kept as a string since search
        // indexing, the interaction checker, and DoctorPrep.jsx all read it.
        ingredients: 'Sodium hyaluronate (hyaluronic acid), lactic acid, Activated Oil Complex (hydrolyzed coconut and rosehip oils), dragon fruit extract, aloe, glucomannan.',
        // Only the key ingredients alubri.com highlights for this product
        // (not the full list, which is in safety.materials), each backed by
        // ingredient-level NIH evidence (PubMed/PMC, NCCIH, MedlinePlus):
        // what research says the ingredient can do, not proof this product works.
        ingredientScienceNote: 'These are the key ingredients Alubri highlights on its site, not the full ingredient list. The complete list is under Materials on the Evidence view.',
        ingredientScience: [
            {
                name: 'Coconut and rosehip oils (Activated Oil Complex)',
                text: 'Applied to dry skin twice a day for 2 weeks, virgin coconut oil improved hydration as well as mineral oil in a randomized, double-blind trial. An NIH-indexed review notes rosehip oil is rich in linoleic acid and antioxidants that may help calm skin inflammation. These studies used ordinary oils on skin, not Alubri\'s "pre-activated" blend, so the brand\'s microbiome claims aren\'t tested by them.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/15724344/', label: 'PubMed (NIH): Virgin coconut oil vs. mineral oil for dry skin, randomized trial (Dermatitis, 2004)' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-inflammatory and skin barrier effects of plant oils, incl. rosehip (Int J Mol Sci, 2017)' },
                ],
            },
            {
                name: 'Lactic acid',
                text: 'In a healthy vagina dominated by Lactobacillus, those bacteria make lactic acid, which keeps vaginal pH low and may help protect against infection. A 2021 systematic review found there isn\'t yet high-quality evidence that lactic acid products cure bacterial vaginosis or shift the vaginal microbiome, so they\'re best seen as pH support.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3819307/', label: 'NIH (PMC): Vaginal pH and lactic acid when lactobacilli dominate (PLoS One, 2013)' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7877752/', label: 'NIH (PMC): Lactic acid products for bacterial vaginosis, systematic review (PLoS One, 2021)' },
                ],
            },
            {
                name: 'Sodium hyaluronate (hyaluronic acid)',
                text: 'Hyaluronic acid holds water in tissue. In a randomized trial of 144 postmenopausal women with vaginal dryness, a hyaluronic acid vaginal gel used every 3 days for 30 days improved dryness symptoms in 84% of women, about the same as estriol (estrogen) cream at 89%. That trial tested a different gel, so it supports the ingredient, not Alubri\'s product specifically.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/23574713/', label: 'PubMed (NIH): Hyaluronic acid vaginal gel vs. estriol cream for vaginal dryness (J Sex Med, 2013)' },
                ],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/AskONLYWomenOver30/comments/1wcgjzy/best_vaginal_moisturizer_youve_tried/', text: 'Reddit r/AskONLYWomenOver30: Best vaginal moisturizer you\'ve tried?', summary: 'A community thread where women over 30 share the vaginal moisturizers they\'ve used. Reddit blocks automated access, so ayna couldn\'t check which products are mentioned; read the thread directly.' },
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0G4SG1WJY', text: 'Amazon: Alubri Vaginal Moisturizer, 72-Hour Hydration, Hormone-Free', summary: 'This gel\'s Amazon listing (1-month supply), with customer ratings and reviews. Amazon blocks automated access, so no rating is quoted here; read the reviews directly on the page.' },
                    { platform: 'website', url: 'https://alubri.com/products/vaginal-moisturizing-gel', text: 'alubri.com: Vaginal Moisturizing Gel', summary: 'Alubri\'s own product page, with the brand\'s study results and directions.' },
                    { platform: 'website', url: 'https://alubri.com/pages/faq', text: 'alubri.com: FAQ', summary: 'Alubri\'s answers on first-use sensations, discharge, condoms, and using the gel with vaginal estrogen.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    {
        id: 'p-alubri-intimate-serum',
        name: 'Alubri Intimate Serum',
        brand: 'Alubri',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'menopause', 'postpartum', 'hormone-free', 'external-only'],
        price: '$24.99 (50 mL) · $12.99 (1.0 fl oz trial size)',
        whereToBuy: ['alubri.com', 'Amazon', 'Walmart', 'Target', 'Grove'],
        url: 'https://alubri.com/products/intimate-serum',
        affiliateUrl: 'https://collabs.shop/jseteg', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://alubri.com/pages/faq',
        image: '/products/alubri/intimate-serum.webp',
        summary: 'A lightweight, water-based serum for external intimate skin: the vulva, labia, and vaginal opening. It pairs hyaluronic acid (sodium hyaluronate) with inulin, which Alubri says also supports a healthy skin microbiome, plus aloe, green tea, and chamomile. The brand says it absorbs with no oily residue, feels cooling, and helps the skin hold on to its natural moisture. Hormone-free and fragrance-free. Sold in a 50 mL bottle or a 1.0 fl oz trial size.',
        safety: {
            fdaStatus: 'alubri.com presents it as a hormone-free personal-care serum and does not describe it as an FDA-cleared device or drug.',
            materials: '50 mL (1.7 fl oz) pump bottle, or 1.0 fl oz trial size. Ingredients: aqua (water), betaine, inulin, sodium lactate, lactic acid, sodium hyaluronate, Aloe barbadensis leaf juice, Camellia sinensis (green tea) leaf extract, Chamomilla recutita (chamomile) flower extract, tocopherol, ethylhexylglycerin, hydroxyethylcellulose, xanthan gum, disodium phosphate, sodium phosphate, citric acid, phenoxyethanol, potassium sorbate, sodium benzoate, sodium hydroxide. Fragrance-free, hormone-free, hypoallergenic.',
            recalls: 'No recalls are mentioned on alubri.com; check current regulator and manufacturer recall notices.',
            sideEffects: 'For external use. Stop and see a doctor if irritation develops. Full warnings are listed below.',
            opinionAlerts: 'Clinical figures (including the 152% hydration increase) come from studies Alubri describes on its own site; the full studies aren\'t published there.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced only from Alubri\'s own site (alubri.com), not independent clinical literature.',
        doctorOpinion: 'Alubri says the serum was developed with Dr. Nicole Kerner, its co-founder and Chief Medical Officer, a board-certified, menopause-certified OB-GYN, and that it is gynecologist- and dermatologist-tested.\n\nThe brand reports that in an IRB-approved study run under ISO Good Laboratory Practices, one application raised vulvar hydration by 152% versus baseline, measured 72 hours later. In a separate independent, third-party study of 50 women using the serum for 2 weeks, 94% said their skin felt hydrated, 92% protected and moisturized, 90% soothed and nourished, and 90% said the hydration was long-lasting. These are brand-reported results.',
        doctorOpinionShort: 'Alubri reports one application raised vulvar hydration 152% versus baseline, and in a 2-week study of 50 women, 94% said skin felt hydrated. Brand-reported results.',
        doctorOpinionCitations: [
            { url: 'https://alubri.com/products/intimate-serum', label: 'alubri.com: where Alubri presents these results' },
            { url: 'https://alubri.com/pages/science', label: 'alubri.com: Science (vulvar hydration)' },
        ],
        // From the "Ideal for" list on alubri.com.
        whoItsFor: [
            'Daily vulvar dryness or discomfort from menopause, perimenopause, hormonal shifts, or medications',
            'Skin recovery after shaving, waxing, or laser hair removal',
            'Postpartum and breastfeeding dryness',
            'Women who prefer non-hormonal intimate care, including those with a history of breast cancer or on anti-estrogen therapies',
        ],
        howToUse: {
            intro: 'Per Alubri\'s own directions:',
            steps: [
                'First use: pump 10 to 15 times to prime the dispenser.',
                'Dispense a small amount onto your fingertips.',
                'Apply over the vulva, labia, and vaginal opening, and massage until absorbed. No need to rinse.',
                'Use daily, or as needed: morning, evening, before or after intimacy, or after grooming.',
            ],
            sourceUrl: 'https://alubri.com/products/intimate-serum',
            sourceLabel: 'alubri.com: Intimate Serum',
        },
        warnings: [
            'For external intimate skin. For internal dryness, Alubri\'s internal product is the Vaginal Moisturizing Gel.',
            'Itching or irritation that persists despite a moisturizer can be a sign of infection. See a doctor.',
            'Not tested for compatibility with condoms, per Alubri.',
        ],
        communityReview: 'Customer reviews for this serum are on its Amazon listing, and there\'s a Reddit post about it in r/Influenster (both linked below). Influenster is a product-testing community whose members often get products free to review, so weigh posts there with that in mind. Neither site allows automated access, so ayna hasn\'t pulled a rating or quotes; read them directly. alubri.com itself shows no star rating, only the brand\'s own study results (above).',
        effectiveness: 'Alubri reports a 152% increase in vulvar hydration after one application, and high self-reported hydration after 2 weeks of use, in its own studies. No independent study of this product is cited on alubri.com.',
        ingredients: 'Sodium hyaluronate (hyaluronic acid), inulin, betaine, lactic acid / sodium lactate, aloe, green tea extract, chamomile extract, vitamin E (tocopherol).',
        // Only the key ingredients alubri.com highlights for this product
        // (not the full list, which is in safety.materials), each backed by
        // ingredient-level NIH evidence (PubMed/PMC, NCCIH, MedlinePlus):
        // what research says the ingredient can do, not proof this product works.
        ingredientScienceNote: 'These are the key ingredients Alubri highlights on its site, not the full ingredient list. The complete list is under Materials on the Evidence view.',
        ingredientScience: [
            {
                name: 'Inulin',
                text: 'Inulin is a plant fiber best known as a prebiotic that feeds beneficial gut bacteria when eaten; an NIH-indexed review covers how ingested prebiotics may affect distant sites, including skin. ayna found no studies of inulin applied directly to skin, so Alubri\'s skin-microbiome claim for this serum hasn\'t been tested independently.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5037510/', label: 'NIH (PMC): Distant site effects of ingested prebiotics, incl. inulin (Nutrients, 2016)' },
                ],
            },
            {
                name: 'Sodium hyaluronate (hyaluronic acid)',
                text: 'In a double-blind randomized trial of 36 older adults with dry skin, a lotion with low-molecular-weight hyaluronic acid raised skin hydration more than a plain lotion after 4 weeks, with no side effects. The study was on leg skin, not vulvar skin.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/38829483/', label: 'PubMed (NIH): Topical hyaluronic acid for dry skin in older adults, randomized trial (Arch Dermatol Res, 2024)' },
                ],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/Influenster/comments/1pnf635/alubri_intinate_serum/', text: 'Reddit r/Influenster: Alubri Intimate Serum', summary: 'A post about this serum in the Influenster community, where members often receive products free to review. Reddit blocks automated access, so read the post directly.' },
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0G2N2TY1K', text: 'Amazon: Alubri Intimate Serum for Women, Water-Based, Fragrance-Free, 1.7oz', summary: 'This serum\'s Amazon listing (1.7 oz full size), with customer ratings and reviews for this specific product. Amazon blocks automated access, so no rating is quoted here; read the reviews directly on the page.' },
                    { platform: 'website', url: 'https://alubri.com/products/intimate-serum', text: 'alubri.com: Intimate Serum', summary: 'Alubri\'s own product page, with the brand\'s study results and directions.' },
                    { platform: 'website', url: 'https://alubri.com/pages/faq', text: 'alubri.com: FAQ', summary: 'Alubri\'s answers on sensitive skin, condoms, and how long a bottle lasts.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    {
        id: 'p-alubri-calming-cream',
        name: 'Alubri Calming Cream',
        brand: 'Alubri',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'menopause', 'hormone-free', 'external-only'],
        price: '$29.99 (50 mL)',
        whereToBuy: ['alubri.com', 'Amazon', 'Walmart', 'Target', 'Grove'],
        url: 'https://alubri.com/products/calming-cream',
        affiliateUrl: 'https://collabs.shop/wnwjkw', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://alubri.com/pages/faq',
        image: '/products/alubri/calming-cream.png',
        summary: 'An over-the-counter anti-itch cream for external intimate skin, with 0.25% hydrocortisone to relieve itching and irritation. The base adds shea butter, hyaluronic acid, lactic acid, oat, aloe, and Alubri\'s Activated Oil Complex, which the brand says supports a balanced vulvar microbiome. Alubri positions it as giving the relief of an OTC ointment in a lightweight, non-greasy cream. Hormone-free and fragrance-free.',
        safety: {
            fdaStatus: 'An over-the-counter external analgesic (hydrocortisone 0.25%), per alubri.com. External use only.',
            materials: '50 mL (1.7 fl oz) tube. Active ingredient: hydrocortisone 0.25% (external analgesic). Inactive ingredients: aqua (water), propanediol, cetearyl alcohol, isopropyl palmitate, Butyrospermum parkii (shea) butter, caprylic/capric triglycerides, dimethicone, Cocos nucifera (coconut) oil, glyceryl stearate, hydrolyzed Rosa canina (rosehip) fruit oil, hydrolyzed Cocos nucifera (coconut) oil, sodium hyaluronate, lactic acid, Avena sativa (oat) meal extract, tocopherol, Aloe barbadensis leaf juice, Lactobacillus ferment lysate, hydrogenated lecithin, cetearyl glucoside, sclerotium gum, dimethicone crosspolymer, xanthan gum, ethylhexylglycerin, butylene glycol, phenoxyethanol, isododecane.',
            recalls: 'No recalls are mentioned on alubri.com; check current regulator and manufacturer recall notices.',
            sideEffects: 'For external use only. Alubri says to check with a healthcare professional first if you have specific sensitivities or use prescription topical products. Full warnings are listed below.',
            opinionAlerts: 'This is an OTC drug; alubri.com doesn\'t reproduce the full Drug Facts label, so read the warnings on the package before use. Clinical figures are brand-reported.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced only from Alubri\'s own site (alubri.com), not independent clinical literature.',
        doctorOpinion: 'Alubri says the cream was developed with Dr. Nicole Kerner, its co-founder and Chief Medical Officer, a board-certified, menopause-certified OB-GYN. The brand says it chose 0.25% hydrocortisone as a strength that gives fast relief while staying gentle on sensitive skin.\n\nIn an independent, third-party study of 53 menopausal women who used the cream for 24 hours, Alubri reports that 94% said their skin felt soothed after one application, 94% protected, 96% nourished and conditioned, and 98% said it was easy to use. These are brand-reported results.\n\nAlubri\'s professional FAQ says the cream isn\'t intended to treat skin conditions, but may be used alongside doctor-prescribed treatment for conditions such as lichen sclerosus to help soothe and support comfort.',
        doctorOpinionShort: 'An OTC 0.25% hydrocortisone cream. In Alubri\'s study of 53 menopausal women, 94% said skin felt soothed after one application. Brand-reported results.',
        doctorOpinionCitations: [
            { url: 'https://alubri.com/products/calming-cream', label: 'alubri.com: where Alubri presents these results' },
            { url: 'https://alubri.com/pages/faq', label: 'alubri.com: FAQ (why 0.25% hydrocortisone)' },
        ],
        // From the "Ideal for" list on alubri.com.
        whoItsFor: [
            'Temporary relief of external feminine itching',
            'Vulvar irritation from menopause, perimenopause, or hormonal changes',
            'Itching and sensitivity from shaving, waxing, or friction',
            'Itching and sensitivity after exercise or sex',
        ],
        howToUse: {
            intro: 'Per Alubri\'s own directions:',
            steps: [
                'Apply a pea-size amount to the external vulvar area with clean fingers.',
                'Add more as needed to cover the affected area in a thin layer.',
                'Use up to 3 to 4 times a day as needed, or as directed by a healthcare provider.',
                'Tip: use after intimacy, exercise, or friction. If certain activities tend to irritate your skin, Alubri suggests applying it beforehand.',
            ],
            sourceUrl: 'https://alubri.com/products/calming-cream',
            sourceLabel: 'alubri.com: Calming Cream',
        },
        warnings: [
            'External use only.',
            'Contains hydrocortisone, a topical steroid. Read the Drug Facts label on the package before use.',
            'Itching or irritation that persists can be a sign of infection. See a doctor.',
            'Not tested for compatibility with condoms, per Alubri.',
        ],
        communityReview: 'Customer reviews for this cream are on its own Amazon listing (linked below). Amazon blocks automated access, so ayna hasn\'t pulled a rating or quotes; read them directly. alubri.com itself shows no star rating. The only customer feedback on the site is the brand\'s own study results: 92% said it isn\'t greasy and 100% said it was easy to use.',
        effectiveness: 'Hydrocortisone is the active ingredient for itch relief. Alubri\'s own study of 53 women reports that 94% felt soothed after one application. No independent study of this product is cited on alubri.com.',
        ingredients: 'Hydrocortisone 0.25% (active). Inactive highlights: shea butter, sodium hyaluronate (hyaluronic acid), lactic acid, oat extract, aloe, Activated Oil Complex (hydrolyzed coconut and rosehip oils), vitamin E (tocopherol).',
        // Only the key ingredients alubri.com highlights for this product
        // (not the full list, which is in safety.materials), each backed by
        // ingredient-level NIH evidence (PubMed/PMC, NCCIH, MedlinePlus):
        // what research says the ingredient can do, not proof this product works.
        ingredientScienceNote: 'These are the key ingredients Alubri highlights on its site, not the full ingredient list. The complete list is under Materials on the Evidence view.',
        ingredientScience: [
            {
                name: 'Coconut and rosehip oils (Activated Oil Complex)',
                text: 'Applied to dry skin twice a day for 2 weeks, virgin coconut oil improved hydration as well as mineral oil in a randomized, double-blind trial. An NIH-indexed review notes rosehip oil is rich in linoleic acid and antioxidants that may help calm skin inflammation. These studies used ordinary oils on skin, not Alubri\'s "pre-activated" blend, so the brand\'s microbiome claims aren\'t tested by them.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/15724344/', label: 'PubMed (NIH): Virgin coconut oil vs. mineral oil for dry skin, randomized trial (Dermatitis, 2004)' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-inflammatory and skin barrier effects of plant oils, incl. rosehip (Int J Mol Sci, 2017)' },
                ],
            },
            {
                name: 'Hydrocortisone 0.25%',
                text: 'NIH\'s MedlinePlus describes topical hydrocortisone as a corticosteroid used to treat redness, swelling, itching, and discomfort of skin conditions. It works by activating natural substances in the skin that reduce swelling, redness, and itching.',
                citations: [
                    { url: 'https://medlineplus.gov/druginfo/meds/a682793.html', label: 'NIH MedlinePlus: Hydrocortisone Topical' },
                ],
            },
            {
                name: 'Shea butter',
                text: 'In a study of 34 children with eczema, a cream containing shea butter extract was well accepted and performed comparably to a ceramide-based product. Shea butter\'s triterpenes, tocopherols, and sterols have shown anti-inflammatory activity in lab studies.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/26314567/', label: 'PubMed (NIH): Shea butter extract cream vs. ceramide product for eczema (Hong Kong Med J, 2015)' },
                ],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0G4SDS8Z5', text: 'Amazon: Alubri Calming Hydrocortisone Cream for Women, Feminine Itch, 1.7oz', summary: 'This cream\'s Amazon listing (1.7 oz), with customer ratings and reviews for this specific product. Amazon blocks automated access, so no rating is quoted here; read the reviews directly on the page.' },
                    { platform: 'website', url: 'https://alubri.com/products/calming-cream', text: 'alubri.com: Calming Cream', summary: 'Alubri\'s own product page, with the brand\'s study results and directions.' },
                    { platform: 'website', url: 'https://alubri.com/pages/faq', text: 'alubri.com: FAQ', summary: 'Alubri\'s answers on the hydrocortisone strength and use alongside prescribed treatment.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    {
        id: 'p-alubri-vulva-balm',
        name: 'Alubri Vulva Balm',
        brand: 'Alubri',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'menopause', 'hormone-free', 'external-only'],
        price: '$24.99 (50 g)',
        whereToBuy: ['alubri.com', 'Amazon', 'Walmart', 'Target', 'Grove'],
        url: 'https://alubri.com/products/vulva-balm',
        affiliateUrl: 'https://collabs.shop/frt2q3', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://alubri.com/pages/faq',
        image: '/products/alubri/vulva-balm.png',
        summary: 'A non-greasy daily moisturizer for the vulva that Alubri says hydrates, soothes, protects against dryness, and calms sensitive skin. It combines hyaluronic acid (sodium hyaluronate), a peptide, and Alubri\'s Activated Oil Complex with oat, green tea, dragon fruit, and Tasmanian pepperberry extracts. The brand describes a rich but lightweight balm that absorbs quickly to a soft, powdery finish. Hormone-free, fragrance-free, and hypoallergenic.',
        safety: {
            fdaStatus: 'alubri.com presents it as a hormone-free personal-care moisturizer and does not describe it as an FDA-cleared device or drug.',
            materials: '50 g (1.7 oz) jar. Ingredients: aqua (water), dimethicone, isododecane, caprylic/capric triglyceride, ozokerite, propanediol, sorbitan oleate, dimethicone crosspolymer, ceresin, hydrolyzed Rosa canina (rosehip) fruit oil, hydrolyzed Cocos nucifera (coconut) oil, sodium hyaluronate, palmitoyl hexapeptide-52, Hylocereus undatus (dragon fruit) fruit extract, Tasmannia lanceolata (Tasmanian pepperberry) fruit extract, Avena sativa (oat) kernel extract, Camellia sinensis (green tea) leaf extract, Passiflora incarnata flower extract, tocopherol, alpha-glucan oligosaccharide, tocopheryl acetate, Lactobacillus ferment lysate, biosaccharide gum-4, adenosine, ethylhexylglycerin, phenoxyethanol, sodium chloride, benzyl alcohol, potassium sorbate, benzoic acid.',
            recalls: 'No recalls are mentioned on alubri.com; check current regulator and manufacturer recall notices.',
            sideEffects: 'For external use only. Alubri suggests testing a small amount on external skin first. Full warnings are listed below.',
            opinionAlerts: 'Clinical figures (including the vulvar pH result) come from a study Alubri describes on its own site; the full study isn\'t published there.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced only from Alubri\'s own site (alubri.com), not independent clinical literature.',
        doctorOpinion: 'Alubri says the balm was developed with Dr. Nicole Kerner, its co-founder and Chief Medical Officer, a board-certified, menopause-certified OB-GYN, and that it is gynecologist- and dermatologist-tested.\n\nIn an independent, third-party study of 50 women who used the balm daily for two weeks, Alubri reports that vulvar pH in menopausal women dropped significantly (from 6.3 to 6.0) at both 24 hours and two weeks. The brand notes that postmenopausal vaginal pH is typically well above the 3.8 to 4.5 range of reproductive-age women. Participants also reported that skin felt more hydrated (90%) and more conditioned (92%). These are brand-reported results.\n\nAlubri\'s professional FAQ says the balm isn\'t intended to treat skin conditions, but may be used alongside doctor-prescribed treatment for conditions such as lichen sclerosus.',
        doctorOpinionShort: 'In Alubri\'s 2-week study of 50 women, vulvar pH fell from 6.3 to 6.0 and 90% said skin felt more hydrated. Developed by a menopause-certified OB-GYN. Brand-reported results.',
        doctorOpinionCitations: [
            { url: 'https://alubri.com/products/vulva-balm', label: 'alubri.com: where Alubri presents these results' },
            { url: 'https://alubri.com/pages/science', label: 'alubri.com: Science (pH results)' },
        ],
        // From the "Ideal for" list on alubri.com.
        whoItsFor: [
            'Vulvar dryness from menopause, perimenopause, or hormonal changes',
            'Women who want daily microbiome and pH support for intimate skin',
            'Anyone who needs hormone-free vulvar care',
            'A daily protective layer under clothing, or before workouts, beach days, or tight clothing',
        ],
        howToUse: {
            intro: 'Per Alubri\'s own directions:',
            steps: [
                'Scoop a small amount onto your fingertips.',
                'Apply over the vulva, labia, and surrounding external intimate skin.',
                'Use daily, morning or evening, and reapply whenever skin feels dry.',
                'Tip: apply after a shower, while skin is clean and slightly damp, to help lock in moisture.',
            ],
            sourceUrl: 'https://alubri.com/products/vulva-balm',
            sourceLabel: 'alubri.com: Vulva Balm',
        },
        warnings: [
            'For external use only.',
            'Itching or irritation that persists despite a moisturizer can be a sign of infection. See a doctor.',
            'Not tested for compatibility with condoms, per Alubri.',
        ],
        communityReview: 'Customer reviews for this balm are on its own Amazon listing (linked below). Amazon blocks automated access, so ayna hasn\'t pulled a rating or quotes; read them directly. alubri.com itself shows no star rating. The only customer feedback on the site is the brand\'s own study results: 92% said it isn\'t greasy and 100% said it was easy to use.',
        effectiveness: 'Alubri reports a significant drop in vulvar pH (6.3 to 6.0) after 24 hours and two weeks, plus high self-reported hydration, in its own study of 50 women. No independent study of this product is cited on alubri.com.',
        ingredients: 'Sodium hyaluronate (hyaluronic acid), palmitoyl hexapeptide-52 (peptide), Activated Oil Complex (hydrolyzed coconut and rosehip oils), dragon fruit extract, Tasmanian pepperberry extract, oat kernel extract, green tea extract, vitamin E (tocopherol).',
        // Only the key ingredients alubri.com highlights for this product
        // (not the full list, which is in safety.materials), each backed by
        // ingredient-level NIH evidence (PubMed/PMC, NCCIH, MedlinePlus):
        // what research says the ingredient can do, not proof this product works.
        ingredientScienceNote: 'These are the key ingredients Alubri highlights on its site, not the full ingredient list. The complete list is under Materials on the Evidence view.',
        ingredientScience: [
            {
                name: 'Coconut and rosehip oils (Activated Oil Complex)',
                text: 'Applied to dry skin twice a day for 2 weeks, virgin coconut oil improved hydration as well as mineral oil in a randomized, double-blind trial. An NIH-indexed review notes rosehip oil is rich in linoleic acid and antioxidants that may help calm skin inflammation. These studies used ordinary oils on skin, not Alubri\'s "pre-activated" blend, so the brand\'s microbiome claims aren\'t tested by them.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/15724344/', label: 'PubMed (NIH): Virgin coconut oil vs. mineral oil for dry skin, randomized trial (Dermatitis, 2004)' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-inflammatory and skin barrier effects of plant oils, incl. rosehip (Int J Mol Sci, 2017)' },
                ],
            },
            {
                name: 'Allantoin',
                text: 'Alubri lists allantoin as a key ingredient for softening and soothing skin, but it doesn\'t appear in the balm\'s published ingredient list on alubri.com. In an NIH-indexed study in rats, a 5% allantoin lotion sped wound healing by calming inflammation and supporting new tissue growth; ayna found no human studies of allantoin for vulvar skin.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/20877959/', label: 'PubMed (NIH): Wound healing profile of topical allantoin, rat study (Acta Cir Bras, 2010)' },
                ],
            },
            {
                name: 'Sodium hyaluronate (hyaluronic acid)',
                text: 'In a double-blind randomized trial of 36 older adults with dry skin, a lotion with low-molecular-weight hyaluronic acid raised skin hydration more than a plain lotion after 4 weeks, with no side effects. The study was on leg skin, not vulvar skin.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/38829483/', label: 'PubMed (NIH): Topical hyaluronic acid for dry skin in older adults, randomized trial (Arch Dermatol Res, 2024)' },
                ],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0G4SHBN1T', text: 'Amazon: Alubri Vulva Balm, Intimate Moisturizer, Non-Greasy, Fragrance-Free, 1.7oz', summary: 'This balm\'s Amazon listing (1.7 oz full size), with customer ratings and reviews for this specific product. Amazon blocks automated access, so no rating is quoted here; read the reviews directly on the page.' },
                    { platform: 'website', url: 'https://alubri.com/products/vulva-balm', text: 'alubri.com: Vulva Balm', summary: 'Alubri\'s own product page, with the brand\'s study results and directions.' },
                    { platform: 'website', url: 'https://alubri.com/pages/faq', text: 'alubri.com: FAQ', summary: 'Alubri\'s answers on daily use, use with vaginal estrogen, and how long a jar lasts.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    {
        id: 'p-alubri-vaginal-wellness-kit',
        name: 'Alubri Vaginal Wellness Kit',
        brand: 'Alubri',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'menopause', 'hormone-free', 'travel-friendly'],
        price: '$19.99 (2-week trial)',
        whereToBuy: ['alubri.com', 'Amazon', 'Walmart', 'Target', 'Grove'],
        url: 'https://alubri.com/products/vaginal-wellness-kit-bag-version',
        affiliateUrl: 'https://collabs.shop/a8b3sb', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://alubri.com/pages/faq',
        image: '/products/alubri/vaginal-wellness-kit.webp',
        summary: 'A 2-week trial kit of Alubri\'s two core moisturizers in trial sizes: the Vaginal Moisturizing Gel (30 mL, with single-use applicators) for internal hydration and microbiome balance, and the Intimate Serum (30 mL) for external vulvar hydration. Alubri pitches it as an easy introduction to the brand.',
        safety: {
            fdaStatus: 'alubri.com presents both products as hormone-free personal-care moisturizers and does not describe either as an FDA-cleared device or drug.',
            materials: '1 × 30 mL (1.0 fl oz) Vaginal Moisturizing Gel with single-use applicators, and 1 × 30 mL (1.0 fl oz) Intimate Serum. Full ingredient lists are on the Alubri Vaginal Moisturizing Gel and Alubri Intimate Serum entries. Hormone-free and fragrance-free.',
            recalls: 'No recalls are mentioned on alubri.com; check current regulator and manufacturer recall notices.',
            sideEffects: 'Alubri says some women feel mild warming or brief stinging on first use of the gel, which usually fades. If discomfort persists, stop and see a doctor. Full warnings are listed below.',
            opinionAlerts: 'Clinical figures for each product are brand-reported (see the full-size Gel and Serum entries).',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced only from Alubri\'s own site (alubri.com), not independent clinical literature.',
        doctorOpinion: 'The same two formulas as Alubri\'s full-size Vaginal Moisturizing Gel and Intimate Serum, developed with Dr. Nicole Kerner, Alubri\'s co-founder and Chief Medical Officer, a board-certified, menopause-certified OB-GYN.\n\nAlubri reports that in its study of 51 women using the gel twice a week for a month, 94% said their vagina felt moisturized and hydrated, 92% soothed, and 88% said the gel stayed put. In its 2-week study of 50 women using the serum, 94% said their skin felt hydrated and 90% said the hydration was long-lasting. These are brand-reported results.',
        doctorOpinionShort: 'A 2-week trial of Alubri\'s internal gel and external serum. In the brand\'s studies, 94% said the gel left them feeling moisturized and 94% said the serum left skin hydrated. Brand-reported results.',
        doctorOpinionCitations: [
            { url: 'https://alubri.com/products/vaginal-wellness-kit-bag-version', label: 'alubri.com: Vaginal Wellness Kit' },
        ],
        // From the "Ideal for" list on alubri.com.
        whoItsFor: [
            'Women with dryness or discomfort tied to perimenopause, menopause, or hormonal shifts',
            'Painful intimacy linked to dryness',
            'Anyone who wants to try Alubri\'s internal and external moisturizers before buying full sizes',
        ],
        howToUse: {
            intro: 'Per Alubri\'s own directions for each product:',
            steps: [
                'Gel (internal): attach a single-use applicator, squeeze to fill to 3 grams, insert, and push to release. Throw the applicator away. Use twice a week or as needed, ideally before bed, and lie flat for 10 minutes afterward.',
                'Serum (external): apply over the vulva, clitoris, labia, and vaginal opening for daily hydration or intimate massage. Can also be used after grooming.',
            ],
            sourceUrl: 'https://alubri.com/products/vaginal-wellness-kit-bag-version',
            sourceLabel: 'alubri.com: Vaginal Wellness Kit',
        },
        warnings: [
            'A mild warming or blushing feeling on first use of the gel is normal per Alubri. If discomfort persists, stop and see a doctor.',
            'Itching or irritation that persists despite a moisturizer can be a sign of infection. See a doctor.',
            'Not tested for compatibility with condoms, per Alubri.',
        ],
        communityReview: 'Customer reviews for this kit are on its own Amazon listing (linked below). Amazon blocks automated access, so ayna hasn\'t pulled a rating or quotes; read them directly. alubri.com itself shows no star rating. The only customer feedback on the site is the brand\'s own study results for each product (above).',
        effectiveness: 'Each product\'s results come from Alubri\'s own studies (see the full-size Gel and Serum entries). No independent study of either product is cited on alubri.com.',
        ingredients: 'Gel: sodium hyaluronate, lactic acid, Activated Oil Complex (hydrolyzed coconut and rosehip oils), dragon fruit extract, aloe. Serum: sodium hyaluronate, inulin, betaine, lactic acid, aloe, green tea, chamomile.',
        // Only the key ingredients alubri.com highlights for this product
        // (not the full list, which is in safety.materials), each backed by
        // ingredient-level NIH evidence (PubMed/PMC, NCCIH, MedlinePlus):
        // what research says the ingredient can do, not proof this product works.
        ingredientScienceNote: 'These are the key ingredients Alubri highlights on its site, not the full ingredient list. The complete list is under Materials on the Evidence view.',
        ingredientScience: [
            {
                name: 'Coconut and rosehip oils (Activated Oil Complex)',
                text: 'Applied to dry skin twice a day for 2 weeks, virgin coconut oil improved hydration as well as mineral oil in a randomized, double-blind trial. An NIH-indexed review notes rosehip oil is rich in linoleic acid and antioxidants that may help calm skin inflammation. These studies used ordinary oils on skin, not Alubri\'s "pre-activated" blend, so the brand\'s microbiome claims aren\'t tested by them.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/15724344/', label: 'PubMed (NIH): Virgin coconut oil vs. mineral oil for dry skin, randomized trial (Dermatitis, 2004)' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-inflammatory and skin barrier effects of plant oils, incl. rosehip (Int J Mol Sci, 2017)' },
                ],
            },
            {
                name: 'Inulin',
                text: 'Inulin is a plant fiber best known as a prebiotic that feeds beneficial gut bacteria when eaten; an NIH-indexed review covers how ingested prebiotics may affect distant sites, including skin. ayna found no studies of inulin applied directly to skin, so Alubri\'s skin-microbiome claim for this serum hasn\'t been tested independently.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5037510/', label: 'NIH (PMC): Distant site effects of ingested prebiotics, incl. inulin (Nutrients, 2016)' },
                ],
            },
            {
                name: 'Aloe',
                text: 'NIH\'s National Center for Complementary and Integrative Health says aloe gel on the skin is generally well tolerated, and small studies suggest it may speed burn healing and help some skin conditions. Evidence for other uses, like eczema, is too limited to say. Burning, itching, or rash have occasionally been reported.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/aloe-vera', label: 'NIH NCCIH: Aloe Vera' },
                ],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0G4SFS9YN', text: 'Amazon: Alubri Vaginal Wellness Kit, Moisturizing Gel & Intimate Serum, 1 Fl Oz Ea', summary: 'This kit\'s Amazon listing, with customer ratings and reviews for this specific product. Amazon blocks automated access, so no rating is quoted here; read the reviews directly on the page.' },
                    { platform: 'website', url: 'https://alubri.com/products/vaginal-wellness-kit-bag-version', text: 'alubri.com: Vaginal Wellness Kit', summary: 'Alubri\'s own product page, with kit contents, directions, and the brand\'s study results.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    // alubri.com's tagline for this kit names Vulva Balm, but its "Kit
    // Contents", ingredient lists, directions, and product photo all show
    // Intimate Serum + Calming Cream, the entry follows the contents.
    {
        id: 'p-alubri-rejuvenate-restore-kit',
        name: 'Alubri Rejuvenate & Restore Kit',
        brand: 'Alubri',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'menopause', 'hormone-free', 'external-only', 'travel-friendly'],
        price: '$19.99 (trial sizes)',
        whereToBuy: ['alubri.com', 'Amazon'],
        url: 'https://alubri.com/products/rejuvenate-restore-kit',
        affiliateUrl: 'https://collabs.shop/xbngwb', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://alubri.com/pages/faq',
        image: '/products/alubri/rejuvenate-restore-kit.png',
        summary: 'A trial-size pair of Alubri\'s two external products for comfort before and after intimacy: the Intimate Serum (28 mL) for daily water-based hydration, and the Calming Cream (30 mL), an OTC 0.25% hydrocortisone cream for itching and irritation. Both are hormone-free and fragrance-free.',
        safety: {
            fdaStatus: 'The Calming Cream is an over-the-counter external analgesic (hydrocortisone 0.25%), per alubri.com. The Intimate Serum is presented as a personal-care serum and is not described as an FDA-cleared device or drug.',
            materials: '1 × 28 mL (0.9 fl oz) Intimate Serum and 1 × 30 mL (1.0 fl oz) Calming Cream. Full ingredient lists are on the Alubri Intimate Serum and Alubri Calming Cream entries. Hormone-free and fragrance-free.',
            recalls: 'No recalls are mentioned on alubri.com; check current regulator and manufacturer recall notices.',
            sideEffects: 'Both products are for external use only. The cream contains hydrocortisone; read the Drug Facts label on the package before use. Full warnings are listed below.',
            opinionAlerts: 'Clinical figures for each product are brand-reported (see the full-size Serum and Calming Cream entries).',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced only from Alubri\'s own site (alubri.com), not independent clinical literature.',
        doctorOpinion: 'The same two formulas as Alubri\'s full-size Intimate Serum and Calming Cream, developed with Dr. Nicole Kerner, Alubri\'s co-founder and Chief Medical Officer, a board-certified, menopause-certified OB-GYN.\n\nAlubri reports that in its 2-week study of 50 women using the serum, 94% said their skin felt hydrated and 92% protected and moisturized. In its study of 53 women using the cream for 24 hours, 94% said their skin felt soothed and 96% nourished and conditioned. These are brand-reported results.',
        doctorOpinionShort: 'Trial sizes of Alubri\'s external serum and 0.25% hydrocortisone cream. In the brand\'s studies, 94% said the serum left skin hydrated and 94% said the cream soothed. Brand-reported results.',
        doctorOpinionCitations: [
            { url: 'https://alubri.com/products/rejuvenate-restore-kit', label: 'alubri.com: Rejuvenate & Restore Kit' },
        ],
        // From the "Ideal for" list on alubri.com.
        whoItsFor: [
            'Tender, sensitive, dry, or itchy external intimate skin',
            'Relief from discomfort after intimacy',
            'Women whose skin needs are changing through menopause',
        ],
        howToUse: {
            intro: 'Per Alubri\'s own directions for each product:',
            steps: [
                'Serum: with clean fingers, apply over the vulva (clitoris, labia, and vaginal opening) for hydration or intimate massage.',
                'Cream: apply a pea-size amount to the external vulvar area with clean fingers, adding more as needed for a thin layer. Use up to 3 to 4 times a day as needed.',
                'Tip: use the cream after intimacy, exercise, or anytime friction leaves skin tender.',
            ],
            sourceUrl: 'https://alubri.com/products/rejuvenate-restore-kit',
            sourceLabel: 'alubri.com: Rejuvenate & Restore Kit',
        },
        warnings: [
            'External use only.',
            'The Calming Cream contains hydrocortisone, a topical steroid. Read the Drug Facts label on the package before use.',
            'Itching or irritation that persists can be a sign of infection. See a doctor.',
            'Not tested for compatibility with condoms, per Alubri.',
        ],
        communityReview: 'Customer reviews for this kit are on its own Amazon listing (linked below). Amazon blocks automated access, so ayna hasn\'t pulled a rating or quotes; read them directly. alubri.com itself shows no star rating. The only customer feedback on the site is the brand\'s own study results for each product (above).',
        effectiveness: 'Each product\'s results come from Alubri\'s own studies (see the full-size Serum and Calming Cream entries). No independent study of either product is cited on alubri.com.',
        ingredients: 'Serum: sodium hyaluronate, inulin, betaine, lactic acid, aloe, green tea, chamomile. Cream: hydrocortisone 0.25% (active), shea butter, sodium hyaluronate, lactic acid, oat extract, aloe, Activated Oil Complex (hydrolyzed coconut and rosehip oils).',
        // Only the key ingredients alubri.com highlights for this product
        // (not the full list, which is in safety.materials), each backed by
        // ingredient-level NIH evidence (PubMed/PMC, NCCIH, MedlinePlus):
        // what research says the ingredient can do, not proof this product works.
        ingredientScienceNote: 'These are the key ingredients Alubri highlights on its site, not the full ingredient list. The complete list is under Materials on the Evidence view.',
        ingredientScience: [
            {
                name: 'Hydrocortisone 0.25%',
                text: 'NIH\'s MedlinePlus describes topical hydrocortisone as a corticosteroid used to treat redness, swelling, itching, and discomfort of skin conditions. It works by activating natural substances in the skin that reduce swelling, redness, and itching.',
                citations: [
                    { url: 'https://medlineplus.gov/druginfo/meds/a682793.html', label: 'NIH MedlinePlus: Hydrocortisone Topical' },
                ],
            },
            {
                name: 'Aloe',
                text: 'NIH\'s National Center for Complementary and Integrative Health says aloe gel on the skin is generally well tolerated, and small studies suggest it may speed burn healing and help some skin conditions. Evidence for other uses, like eczema, is too limited to say. Burning, itching, or rash have occasionally been reported.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/aloe-vera', label: 'NIH NCCIH: Aloe Vera' },
                ],
            },
            {
                name: 'Coconut and rosehip oils (Activated Oil Complex)',
                text: 'Applied to dry skin twice a day for 2 weeks, virgin coconut oil improved hydration as well as mineral oil in a randomized, double-blind trial. An NIH-indexed review notes rosehip oil is rich in linoleic acid and antioxidants that may help calm skin inflammation. These studies used ordinary oils on skin, not Alubri\'s "pre-activated" blend, so the brand\'s microbiome claims aren\'t tested by them.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/15724344/', label: 'PubMed (NIH): Virgin coconut oil vs. mineral oil for dry skin, randomized trial (Dermatitis, 2004)' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-inflammatory and skin barrier effects of plant oils, incl. rosehip (Int J Mol Sci, 2017)' },
                ],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0H73846JQ', text: 'Amazon: Alubri Rejuvenate & Restore Kit, Serum 0.9 Fl Oz & Calming Cream 1 Fl Oz', summary: 'This kit\'s Amazon listing, with customer ratings and reviews for this specific product. Amazon blocks automated access, so no rating is quoted here; read the reviews directly on the page.' },
                    { platform: 'website', url: 'https://alubri.com/products/rejuvenate-restore-kit', text: 'alubri.com: Rejuvenate & Restore Kit', summary: 'Alubri\'s own product page, with kit contents, directions, and the brand\'s study results.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    // VPod (hervpod.com, Cool Comforts Co.), catalog entries only, NOT an
    // ayna brand partner unless added to src/utils/partnerBrands.js. The four
    // pod products on hervpod.com (fetched 2026-09-29): Everyday Comfort
    // (sold as "VPod") and Postpartum & Menopause Comfort (sold as "VPod
    // Elite"), each as a single and a 3-pack. The V Pocket cover is sold out
    // and left out. Product facts come from hervpod.com only; the Scientific
    // Literature tab and the ayna Summary's source chips cite a Cochrane
    // review and ACOG for cold therapy as a category (verificationLinks.
    // scientific). Retailer links were supplied by VPod; Walmart listings were
    // matched to products by their URL names, since Walmart blocks
    // automated access. Product photos supplied by ayna, stored under
    // public/products/vpod/. affiliateUrl values are Ayna's Shopify Collabs
    // short links (2026-10-16), each verified to redirect to its own product.
    //
    // Hidden 2026-10-17 so Eliz could fix the descriptions; live again
    // 2026-10-29 at Eliz's request after the fix: per Dr. K (VPod's CEO), the
    // 20 minutes is how long the pod touches the skin, not how long relief
    // lasts, so the summaries no longer state a relief time (the 20-minute
    // wear limit stays in How to use). hervpod.com re-read 2026-10-29: the
    // pods are now listed as reusable everywhere (replace every 30 days).
    {
        id: 'p-vpod-everyday-comfort-single',
        name: 'VPod Everyday Single Pod',
        brand: 'VPod',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'comfort'],
        tags: ['discomfort', 'comfort', 'menopause', 'postpartum', 'external-only', 'reusable', 'hormone-free'],
        price: '$19.99 (1 pod)',
        whereToBuy: ['hervpod.com', 'Amazon', 'Walmart'],
        url: 'https://hervpod.com/products/vpod-regular-single-pack',
        affiliateUrl: 'https://collabs.shop/bxd4fg',
        faqUrl: 'https://hervpod.com/pages/faq',
        image: '/products/vpod/everyday-comfort-single.webp',
        summary: 'A reusable, drug-free cooling gel pod you freeze and place in your underwear to relieve external vulvar and vaginal itching, burning, dryness, irritation, or swelling. Clean it after each use and refreeze it; VPod recommends replacing each pod every 30 days. The curved, flexible pod has a 100% medical-grade silicone exterior that stays in place without adhesive. VPod markets it for yeast infections, BV, allergies, perimenopause and menopause, pregnancy and postpartum, and after sex or workouts; it eases symptoms but doesn’t treat their cause. One pod per pack.',
        safety: {
            fdaStatus: 'Registered with the FDA as an over-the-counter medical product, per hervpod.com. FDA registration means the company and product are listed with the FDA; it is not FDA clearance or approval.',
            materials: 'Each pod is 3 in long x 2.5 in wide, with a 100% medical-grade silicone exterior and a flexible gel interior (the gel itself isn\'t disclosed). Hypoallergenic, odor-free, and sterile when packaged. Made in China for Cool Comforts Co. (Cincinnati, OH).',
            recalls: 'No recalls are mentioned on hervpod.com; check current FDA and manufacturer recall notices.',
            sideEffects: 'Cold can feel too intense on sensitive skin, so VPod says to test the temperature first and limit each use to 20 minutes. Full warnings are listed below.',
            opinionAlerts: 'VPod is reusable: clean it after each use, disinfect it at least daily, and replace each pod every 30 days or sooner if damaged (VPod\'s instructions).',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of ACOG guidance and a Cochrane review; not a direct clinician quote. Product details are from hervpod.com.',
        doctorOpinion: 'Cold therapy is a standard, low-risk way to ease vulvar and perineal soreness: ACOG recommends an ice pack or cold gel pack on the perineal area for 10 to 20 minutes at a time after birth, and a Cochrane review found cooling may reduce perineal pain in the first days postpartum (low-certainty evidence). VPod packages that idea as a curved silicone pod that stays in place in underwear.\n\nCooling only eases symptoms. It doesn\'t treat yeast infections, BV, allergies, or menopause-related dryness, so it should be used alongside the right treatment, not instead of it. See a doctor for itching or burning that doesn\'t go away, unusual discharge, or odor. VPod says it was developed with gynecologists; no study of VPod itself was found.',
        doctorOpinionShort: 'Cold packs are an ACOG-recommended way to ease perineal soreness, and a Cochrane review found cooling may reduce postpartum perineal pain. VPod relieves symptoms but doesn\'t treat their cause. No study of VPod itself was found.',
        whoItsFor: [
            'Short-term relief from external vulvar itching, burning, swelling, or soreness',
            'Discomfort from a yeast infection or BV while treatment starts working',
            'Perimenopause and menopause discomfort, and irritation after sex, workouts, or on hot days',
            'Anyone who wants drug-free, mess-free relief instead of creams or padsicles',
        ],
        howToUse: {
            intro: 'Per VPod\'s full instructions:',
            steps: [
                'Put the unopened foil pack in the freezer for at least 1 hour, until the pod feels stiff.',
                'Take it out and let it rest 3 to 5 minutes, then wash your hands and open the pack.',
                'Touch the pod gently to your vulva first to check the temperature is comfortable.',
                'Place it between the inner and outer labia (labia minora and majora), or in the center crotch of your underwear.',
                'Wear it for up to 20 minutes, up to 3 times a day, waiting at least 10 minutes between uses.',
                'After each use, rinse with warm water, wash with mild soap, and air dry; wipe with 70% isopropyl alcohol at least daily. Replace the pod after 30 days or if damaged.',
            ],
            sourceUrl: 'https://hervpod.com/pages/usage-instructions',
            sourceLabel: 'hervpod.com: Instructions for Use',
        },
        warnings: [
            'External use only. Do not insert into the vagina or anus, and do not ingest.',
            'For temporary symptom relief only; it does not treat yeast infections, BV, or other conditions. See a doctor for itching or burning that doesn’t go away, unusual discharge, or odor.',
            'Remove before urinating, and don’t flush it.',
            'Don’t use with other silicone-based products.',
            'If the pod ruptures, clean the skin and throw the pod away (the gel may be slippery).',
        ],
        communityReview: 'hervpod.com shows 6 customer reviews for this pod, all 5 stars; reviewers describe instant, mess-free relief while waiting for yeast-infection treatment to work, and one wished extra covers were easier to order. These are reviews on the brand’s own site. Amazon and Walmart listings are linked below; both block automated access, so ayna hasn’t pulled their ratings.',
        effectiveness: 'Cold therapy has category-level support for easing perineal pain (Cochrane; ACOG, linked below). No independent study of VPod was found, and cooling relieves symptoms only, not their underlying cause.',
        ingredients: 'Medical-grade silicone exterior with a gel interior (gel not disclosed). Drug-free; no active ingredients.',
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary (NIH, ACOG).
            scientific: {
                links: [
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8094618/',
                        text: 'Local cooling for relieving pain from perineal trauma sustained during childbirth (Cochrane review, 2020)',
                        summary: 'A Cochrane review of 10 randomized trials (1,233 women) found that cooling with an ice pack or cold gel pad may reduce perineal pain in the first two days after birth, but the evidence is low to very low certainty. This is evidence for cold therapy in general, not for VPod specifically.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/postpartum-pain-management',
                        text: 'ACOG: Postpartum Pain Management',
                        summary: 'ACOG recommends applying an ice pack or cold gel pack to the perineal area for 10 to 20 minutes at a time to relieve discomfort after birth. This is clinical guidance for cold therapy as a category, not validation of a specific product.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                        text: 'ACOG: Vulvovaginal Health',
                        summary: 'ACOG suggests cold packs for perineal pain and advises seeing an ob-gyn for itching, burning, or swelling that doesn’t go away, since yeast infections, BV, and other causes need their own treatment. Cooling eases symptoms but doesn’t treat the cause.',
                    },
                ],
            },
            community: {
                links: [
                    { platform: 'tiktok', url: 'https://www.tiktok.com/tag/vpod', text: 'TikTok: #vpod', summary: 'TikTok posts tagged #vpod. The hashtag isn\'t exclusive to this brand, so some posts may be about unrelated products; TikTok blocks automated access, so ayna hasn\'t reviewed them.' },
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0F9YXP4MR', text: 'Amazon: VPod Reusable Feminine Cooling Gel Pods, 1 Count', summary: 'This pod’s Amazon listing, with customer ratings and reviews. Amazon blocks automated access, so no rating is quoted here; read the reviews directly.' },
                    { platform: 'walmart', url: 'https://www.walmart.com/ip/Vpod-Single-Pack/17868111516', text: 'Walmart: VPod Single Pack', summary: 'This pod’s Walmart listing, with customer reviews. The site blocks automated access, so no rating is quoted here; read the reviews directly.' },
                    { platform: 'website', url: 'https://hervpod.com/products/vpod-regular-single-pack', text: 'hervpod.com: VPod Everyday Comfort Single Pack', summary: 'VPod’s own product page, which shows 6 customer reviews, all 5 stars.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    {
        id: 'p-vpod-everyday-comfort-3-pack',
        name: 'VPod Everyday 3-Pack',
        brand: 'VPod',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'comfort'],
        tags: ['discomfort', 'comfort', 'menopause', 'postpartum', 'external-only', 'reusable', 'hormone-free', 'cost'],
        price: '$53.99 (3 pods)',
        whereToBuy: ['hervpod.com', 'Walmart'],
        url: 'https://hervpod.com/products/vpod-regular-multipack',
        affiliateUrl: 'https://collabs.shop/dozcta',
        faqUrl: 'https://hervpod.com/pages/faq',
        image: '/products/vpod/everyday-comfort-3-pack.webp',
        summary: 'A reusable, drug-free cooling gel pod you freeze and place in your underwear to relieve external vulvar and vaginal itching, burning, dryness, irritation, or swelling. Clean it after each use and refreeze it; VPod recommends replacing each pod every 30 days. The curved, flexible pod has a 100% medical-grade silicone exterior that stays in place without adhesive. VPod markets it for yeast infections, BV, allergies, perimenopause and menopause, pregnancy and postpartum, and after sex or workouts; it eases symptoms but doesn’t treat their cause. Three pods per pack.',
        safety: {
            fdaStatus: 'Registered with the FDA as an over-the-counter medical product, per hervpod.com. FDA registration means the company and product are listed with the FDA; it is not FDA clearance or approval.',
            materials: 'Each pod is 3 in long x 2.5 in wide, with a 100% medical-grade silicone exterior and a flexible gel interior (the gel itself isn\'t disclosed). Hypoallergenic, odor-free, and sterile when packaged. Made in China for Cool Comforts Co. (Cincinnati, OH).',
            recalls: 'No recalls are mentioned on hervpod.com; check current FDA and manufacturer recall notices.',
            sideEffects: 'Cold can feel too intense on sensitive skin, so VPod says to test the temperature first and limit each use to 20 minutes. Full warnings are listed below.',
            opinionAlerts: 'VPod is reusable: clean it after each use, disinfect it at least daily, and replace each pod every 30 days or sooner if damaged (VPod\'s instructions).',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of ACOG guidance and a Cochrane review; not a direct clinician quote. Product details are from hervpod.com.',
        doctorOpinion: 'Cold therapy is a standard, low-risk way to ease vulvar and perineal soreness: ACOG recommends an ice pack or cold gel pack on the perineal area for 10 to 20 minutes at a time after birth, and a Cochrane review found cooling may reduce perineal pain in the first days postpartum (low-certainty evidence). VPod packages that idea as a curved silicone pod that stays in place in underwear.\n\nCooling only eases symptoms. It doesn\'t treat yeast infections, BV, allergies, or menopause-related dryness, so it should be used alongside the right treatment, not instead of it. See a doctor for itching or burning that doesn\'t go away, unusual discharge, or odor. VPod says it was developed with gynecologists; no study of VPod itself was found.',
        doctorOpinionShort: 'Cold packs are an ACOG-recommended way to ease perineal soreness, and a Cochrane review found cooling may reduce postpartum perineal pain. VPod relieves symptoms but doesn\'t treat their cause. No study of VPod itself was found.',
        whoItsFor: [
            'Short-term relief from external vulvar itching, burning, swelling, or soreness',
            'Discomfort from a yeast infection or BV while treatment starts working',
            'Perimenopause and menopause discomfort, and irritation after sex, workouts, or on hot days',
            'Anyone who wants drug-free, mess-free relief instead of creams or padsicles',
        ],
        howToUse: {
            intro: 'Per VPod\'s full instructions:',
            steps: [
                'Put the unopened foil pack in the freezer for at least 1 hour, until the pod feels stiff.',
                'Take it out and let it rest 3 to 5 minutes, then wash your hands and open the pack.',
                'Touch the pod gently to your vulva first to check the temperature is comfortable.',
                'Place it between the inner and outer labia (labia minora and majora), or in the center crotch of your underwear.',
                'Wear it for up to 20 minutes, up to 3 times a day, waiting at least 10 minutes between uses.',
                'After each use, rinse with warm water, wash with mild soap, and air dry; wipe with 70% isopropyl alcohol at least daily. Replace the pod after 30 days or if damaged.',
            ],
            sourceUrl: 'https://hervpod.com/pages/usage-instructions',
            sourceLabel: 'hervpod.com: Instructions for Use',
        },
        warnings: [
            'External use only. Do not insert into the vagina or anus, and do not ingest.',
            'For temporary symptom relief only; it does not treat yeast infections, BV, or other conditions. See a doctor for itching or burning that doesn’t go away, unusual discharge, or odor.',
            'Remove before urinating, and don’t flush it.',
            'Don’t use with other silicone-based products.',
            'If the pod ruptures, clean the skin and throw the pod away (the gel may be slippery).',
        ],
        communityReview: 'Customer reviews for this 3-pack are on its Walmart listings (linked below). Walmart blocks automated access, so ayna hasn’t pulled a rating; read them directly. hervpod.com shows no reviews on this pack’s page.',
        effectiveness: 'Cold therapy has category-level support for easing perineal pain (Cochrane; ACOG, linked below). No independent study of VPod was found, and cooling relieves symptoms only, not their underlying cause.',
        ingredients: 'Medical-grade silicone exterior with a gel interior (gel not disclosed). Drug-free; no active ingredients.',
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary (NIH, ACOG).
            scientific: {
                links: [
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8094618/',
                        text: 'Local cooling for relieving pain from perineal trauma sustained during childbirth (Cochrane review, 2020)',
                        summary: 'A Cochrane review of 10 randomized trials (1,233 women) found that cooling with an ice pack or cold gel pad may reduce perineal pain in the first two days after birth, but the evidence is low to very low certainty. This is evidence for cold therapy in general, not for VPod specifically.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/postpartum-pain-management',
                        text: 'ACOG: Postpartum Pain Management',
                        summary: 'ACOG recommends applying an ice pack or cold gel pack to the perineal area for 10 to 20 minutes at a time to relieve discomfort after birth. This is clinical guidance for cold therapy as a category, not validation of a specific product.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                        text: 'ACOG: Vulvovaginal Health',
                        summary: 'ACOG suggests cold packs for perineal pain and advises seeing an ob-gyn for itching, burning, or swelling that doesn’t go away, since yeast infections, BV, and other causes need their own treatment. Cooling eases symptoms but doesn’t treat the cause.',
                    },
                ],
            },
            community: {
                links: [
                    { platform: 'tiktok', url: 'https://www.tiktok.com/tag/vpod', text: 'TikTok: #vpod', summary: 'TikTok posts tagged #vpod. The hashtag isn\'t exclusive to this brand, so some posts may be about unrelated products; TikTok blocks automated access, so ayna hasn\'t reviewed them.' },
                    { platform: 'walmart', url: 'https://www.walmart.com/ip/VPOD-MULTI-3CT/19585123681', text: 'Walmart: VPod Multi 3 Count', summary: 'This 3-pack’s Walmart listing, with customer reviews. The site blocks automated access, so no rating is quoted here; read the reviews directly.' },
                    { platform: 'walmart', url: 'https://www.walmart.com/ip/2-pack-VPod-Instant-Cooling-Relief-for-Vaginal-Discomfort-3-Cooling-Gel-Pods-for-Symptom-Relief/20452465708', text: 'Walmart: 2-pack of VPod 3-pod boxes (6 pods)', summary: 'A Walmart listing for two of these 3-pod boxes, with its own customer reviews. The site blocks automated access, so no rating is quoted here; read the reviews directly.' },
                    { platform: 'website', url: 'https://hervpod.com/products/vpod-regular-multipack', text: 'hervpod.com: VPod Everyday Comfort 3 Pack', summary: 'VPod’s own product page.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    {
        id: 'p-vpod-elite-single',
        name: 'VPod Elite Single Pod',
        brand: 'VPod',
        category: 'postpartum',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'comfort'],
        tags: ['discomfort', 'comfort', 'postpartum', 'pregnancy', 'menopause', 'external-only', 'reusable', 'hormone-free'],
        price: '$21.99 (1 pod)',
        whereToBuy: ['hervpod.com'],
        url: 'https://hervpod.com/products/vpod-elite-single-pack',
        affiliateUrl: 'https://collabs.shop/y6b4i1',
        faqUrl: 'https://hervpod.com/pages/faq',
        image: '/products/vpod/elite-single.webp',
        summary: 'VPod’s extra-soft cooling gel pod designed for new moms, for targeted relief of tearing, bruising, swelling, dryness, and irritation before and after birth, and for menopause-related discomfort. Like the Everyday pod, it\'s reusable: you freeze it and place it in your underwear, then clean and refreeze it, and VPod recommends replacing each pod every 30 days. It has a 100% medical-grade silicone exterior and is drug-free. It eases symptoms but doesn’t treat their cause. One pod per pack; sold as VPod Elite.',
        safety: {
            fdaStatus: 'Registered with the FDA as an over-the-counter medical product, per hervpod.com. FDA registration means the company and product are listed with the FDA; it is not FDA clearance or approval.',
            materials: 'Each pod is 3 in long x 2.5 in wide, with a 100% medical-grade silicone exterior and a flexible gel interior (the gel itself isn\'t disclosed). Hypoallergenic, odor-free, and sterile when packaged. Made in China for Cool Comforts Co. (Cincinnati, OH).',
            recalls: 'No recalls are mentioned on hervpod.com; check current FDA and manufacturer recall notices.',
            sideEffects: 'Cold can feel too intense on sensitive skin, so VPod says to test the temperature first and limit each use to 20 minutes. Full warnings are listed below.',
            opinionAlerts: 'VPod is reusable: clean it after each use, disinfect it at least daily, and replace each pod every 30 days or sooner if damaged (VPod\'s instructions).',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of ACOG guidance and a Cochrane review; not a direct clinician quote. Product details are from hervpod.com.',
        doctorOpinion: 'Cold therapy is a standard, low-risk way to ease vulvar and perineal soreness: ACOG recommends an ice pack or cold gel pack on the perineal area for 10 to 20 minutes at a time after birth, and a Cochrane review found cooling may reduce perineal pain in the first days postpartum (low-certainty evidence). VPod packages that idea as a curved silicone pod that stays in place in underwear.\n\nCooling only eases symptoms. It doesn\'t treat yeast infections, BV, allergies, or menopause-related dryness, so it should be used alongside the right treatment, not instead of it. See a doctor for itching or burning that doesn\'t go away, unusual discharge, or odor. VPod says it was developed with gynecologists; no study of VPod itself was found.',
        doctorOpinionShort: 'Cold packs are an ACOG-recommended way to ease perineal soreness, and a Cochrane review found cooling may reduce postpartum perineal pain. VPod relieves symptoms but doesn\'t treat their cause. No study of VPod itself was found.',
        whoItsFor: [
            'Prepartum and postpartum soreness, including perineal tears, episiotomy, bruising, and swelling',
            'Menopause-related vulvar discomfort',
            'Anyone wanting an extra-soft pod for very tender areas',
        ],
        howToUse: {
            intro: 'Per VPod\'s full instructions:',
            steps: [
                'Put the unopened foil pack in the freezer for at least 1 hour, until the pod feels stiff.',
                'Take it out and let it rest 3 to 5 minutes, then wash your hands and open the pack.',
                'Touch the pod gently to your vulva first to check the temperature is comfortable.',
                'Place it between the inner and outer labia (labia minora and majora), or in the center crotch of your underwear.',
                'Wear it for up to 20 minutes, up to 3 times a day, waiting at least 10 minutes between uses.',
                'After each use, rinse with warm water, wash with mild soap, and air dry; wipe with 70% isopropyl alcohol at least daily. Replace the pod after 30 days or if damaged.',
            ],
            sourceUrl: 'https://hervpod.com/pages/usage-instructions',
            sourceLabel: 'hervpod.com: Instructions for Use',
        },
        warnings: [
            'External use only. Do not insert into the vagina or anus, and do not ingest.',
            'For temporary symptom relief only; it does not treat yeast infections, BV, or other conditions. See a doctor for itching or burning that doesn’t go away, unusual discharge, or odor.',
            'Remove before urinating, and don’t flush it.',
            'Don’t use with other silicone-based products.',
            'If the pod ruptures, clean the skin and throw the pod away (the gel may be slippery).',
        ],
        communityReview: 'No customer reviews are shown on hervpod.com for this pack, and ayna didn’t find a retailer listing for the Elite single.',
        effectiveness: 'Cold therapy has category-level support for easing perineal pain (Cochrane; ACOG, linked below). No independent study of VPod was found, and cooling relieves symptoms only, not their underlying cause.',
        ingredients: 'Medical-grade silicone exterior with a gel interior (gel not disclosed). Drug-free; no active ingredients.',
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary (NIH, ACOG).
            scientific: {
                links: [
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8094618/',
                        text: 'Local cooling for relieving pain from perineal trauma sustained during childbirth (Cochrane review, 2020)',
                        summary: 'A Cochrane review of 10 randomized trials (1,233 women) found that cooling with an ice pack or cold gel pad may reduce perineal pain in the first two days after birth, but the evidence is low to very low certainty. This is evidence for cold therapy in general, not for VPod specifically.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/postpartum-pain-management',
                        text: 'ACOG: Postpartum Pain Management',
                        summary: 'ACOG recommends applying an ice pack or cold gel pack to the perineal area for 10 to 20 minutes at a time to relieve discomfort after birth. This is clinical guidance for cold therapy as a category, not validation of a specific product.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                        text: 'ACOG: Vulvovaginal Health',
                        summary: 'ACOG suggests cold packs for perineal pain and advises seeing an ob-gyn for itching, burning, or swelling that doesn’t go away, since yeast infections, BV, and other causes need their own treatment. Cooling eases symptoms but doesn’t treat the cause.',
                    },
                ],
            },
            community: {
                links: [
                    { platform: 'tiktok', url: 'https://www.tiktok.com/tag/vpod', text: 'TikTok: #vpod', summary: 'TikTok posts tagged #vpod. The hashtag isn\'t exclusive to this brand, so some posts may be about unrelated products; TikTok blocks automated access, so ayna hasn\'t reviewed them.' },
                    { platform: 'website', url: 'https://hervpod.com/products/vpod-elite-single-pack', text: 'hervpod.com: VPod Postpartum & Menopause Comfort Single Pack', summary: 'VPod’s own product page.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    {
        id: 'p-vpod-elite-3-pack',
        name: 'VPod Elite 3-Pack',
        brand: 'VPod',
        category: 'postpartum',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'comfort'],
        tags: ['discomfort', 'comfort', 'postpartum', 'pregnancy', 'menopause', 'external-only', 'reusable', 'hormone-free', 'cost'],
        price: '$55.99 (3 pods)',
        whereToBuy: ['hervpod.com', 'Walmart'],
        url: 'https://hervpod.com/products/vpod-elite-multi-pack',
        affiliateUrl: 'https://collabs.shop/i776ti',
        faqUrl: 'https://hervpod.com/pages/faq',
        image: '/products/vpod/elite-3-pack.webp',
        summary: 'VPod’s extra-soft cooling gel pod designed for new moms, for targeted relief of tearing, bruising, swelling, dryness, and irritation before and after birth, and for menopause-related discomfort. Like the Everyday pod, it\'s reusable: you freeze it and place it in your underwear, then clean and refreeze it, and VPod recommends replacing each pod every 30 days. It has a 100% medical-grade silicone exterior and is drug-free. It eases symptoms but doesn’t treat their cause. Three pods per pack; sold as VPod Elite.',
        safety: {
            fdaStatus: 'Registered with the FDA as an over-the-counter medical product, per hervpod.com. FDA registration means the company and product are listed with the FDA; it is not FDA clearance or approval.',
            materials: 'Each pod is 3 in long x 2.5 in wide, with a 100% medical-grade silicone exterior and a flexible gel interior (the gel itself isn\'t disclosed). Hypoallergenic, odor-free, and sterile when packaged. Made in China for Cool Comforts Co. (Cincinnati, OH).',
            recalls: 'No recalls are mentioned on hervpod.com; check current FDA and manufacturer recall notices.',
            sideEffects: 'Cold can feel too intense on sensitive skin, so VPod says to test the temperature first and limit each use to 20 minutes. Full warnings are listed below.',
            opinionAlerts: 'VPod is reusable: clean it after each use, disinfect it at least daily, and replace each pod every 30 days or sooner if damaged (VPod\'s instructions).',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of ACOG guidance and a Cochrane review; not a direct clinician quote. Product details are from hervpod.com.',
        doctorOpinion: 'Cold therapy is a standard, low-risk way to ease vulvar and perineal soreness: ACOG recommends an ice pack or cold gel pack on the perineal area for 10 to 20 minutes at a time after birth, and a Cochrane review found cooling may reduce perineal pain in the first days postpartum (low-certainty evidence). VPod packages that idea as a curved silicone pod that stays in place in underwear.\n\nCooling only eases symptoms. It doesn\'t treat yeast infections, BV, allergies, or menopause-related dryness, so it should be used alongside the right treatment, not instead of it. See a doctor for itching or burning that doesn\'t go away, unusual discharge, or odor. VPod says it was developed with gynecologists; no study of VPod itself was found.',
        doctorOpinionShort: 'Cold packs are an ACOG-recommended way to ease perineal soreness, and a Cochrane review found cooling may reduce postpartum perineal pain. VPod relieves symptoms but doesn\'t treat their cause. No study of VPod itself was found.',
        whoItsFor: [
            'Prepartum and postpartum soreness, including perineal tears, episiotomy, bruising, and swelling',
            'Menopause-related vulvar discomfort',
            'Anyone wanting an extra-soft pod for very tender areas',
        ],
        howToUse: {
            intro: 'Per VPod\'s full instructions:',
            steps: [
                'Put the unopened foil pack in the freezer for at least 1 hour, until the pod feels stiff.',
                'Take it out and let it rest 3 to 5 minutes, then wash your hands and open the pack.',
                'Touch the pod gently to your vulva first to check the temperature is comfortable.',
                'Place it between the inner and outer labia (labia minora and majora), or in the center crotch of your underwear.',
                'Wear it for up to 20 minutes, up to 3 times a day, waiting at least 10 minutes between uses.',
                'After each use, rinse with warm water, wash with mild soap, and air dry; wipe with 70% isopropyl alcohol at least daily. Replace the pod after 30 days or if damaged.',
            ],
            sourceUrl: 'https://hervpod.com/pages/usage-instructions',
            sourceLabel: 'hervpod.com: Instructions for Use',
        },
        warnings: [
            'External use only. Do not insert into the vagina or anus, and do not ingest.',
            'For temporary symptom relief only; it does not treat yeast infections, BV, or other conditions. See a doctor for itching or burning that doesn’t go away, unusual discharge, or odor.',
            'Remove before urinating, and don’t flush it.',
            'Don’t use with other silicone-based products.',
            'If the pod ruptures, clean the skin and throw the pod away (the gel may be slippery).',
        ],
        communityReview: 'Customer reviews for this 3-pack are on its Walmart listing (linked below). Walmart blocks automated access, so ayna hasn’t pulled a rating; read them directly. hervpod.com shows no reviews on this pack’s page.',
        effectiveness: 'Cold therapy has category-level support for easing perineal pain (Cochrane; ACOG, linked below). No independent study of VPod was found, and cooling relieves symptoms only, not their underlying cause.',
        ingredients: 'Medical-grade silicone exterior with a gel interior (gel not disclosed). Drug-free; no active ingredients.',
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary (NIH, ACOG).
            scientific: {
                links: [
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8094618/',
                        text: 'Local cooling for relieving pain from perineal trauma sustained during childbirth (Cochrane review, 2020)',
                        summary: 'A Cochrane review of 10 randomized trials (1,233 women) found that cooling with an ice pack or cold gel pad may reduce perineal pain in the first two days after birth, but the evidence is low to very low certainty. This is evidence for cold therapy in general, not for VPod specifically.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/postpartum-pain-management',
                        text: 'ACOG: Postpartum Pain Management',
                        summary: 'ACOG recommends applying an ice pack or cold gel pack to the perineal area for 10 to 20 minutes at a time to relieve discomfort after birth. This is clinical guidance for cold therapy as a category, not validation of a specific product.',
                    },
                    {
                        url: 'https://www.acog.org/womens-health/faqs/vulvovaginal-health',
                        text: 'ACOG: Vulvovaginal Health',
                        summary: 'ACOG suggests cold packs for perineal pain and advises seeing an ob-gyn for itching, burning, or swelling that doesn’t go away, since yeast infections, BV, and other causes need their own treatment. Cooling eases symptoms but doesn’t treat the cause.',
                    },
                ],
            },
            community: {
                links: [
                    { platform: 'tiktok', url: 'https://www.tiktok.com/tag/vpod', text: 'TikTok: #vpod', summary: 'TikTok posts tagged #vpod. The hashtag isn\'t exclusive to this brand, so some posts may be about unrelated products; TikTok blocks automated access, so ayna hasn\'t reviewed them.' },
                    { platform: 'walmart', url: 'https://www.walmart.com/ip/Vpod-Elite-Multi-pack/19824372766', text: 'Walmart: VPod Elite Multi-pack', summary: 'This 3-pack’s Walmart listing, with customer reviews. The site blocks automated access, so no rating is quoted here; read the reviews directly.' },
                    { platform: 'website', url: 'https://hervpod.com/products/vpod-elite-multi-pack', text: 'hervpod.com: VPod Postpartum & Menopause Comfort 3 Pack', summary: 'VPod’s own product page.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },
    // Soonr (soonr.health, Vespexx Inc.), catalog entries only, NOT an ayna
    // brand partner. Soonr sells two things, listed as two linked entries:
    // the Soonr couples' preconception app (digital tracker) and the Surearly
    // SMART hormone test reader it recommends, which is made by a different
    // company (Sugentech / Surearly), sold separately on Amazon, and syncs
    // to the app. soonr.health is a JavaScript app, so facts were read from
    // its page bundle (2026-09-30), plus the App Store listing, its privacy
    // policy, and the device's FDA GUDID record. App icon and device photo
    // supplied by ayna, stored under public/products/soonr/.
    {
        id: 'd-soonr',
        name: 'Soonr: Fertility App for Couples',
        brand: 'Soonr',
        category: 'tracker',
        type: 'digital',
        internal: false,
        healthFunctions: ['cycle-tracking', 'fertility'],
        tags: ['fertility', 'pregnancy', 'privacy'],
        price: 'Free; Premium $12.99/month or $9.16/month billed yearly (launch price $5.50/month billed yearly)',
        userRating: 4.7,
        userRatingSourceUrl: 'https://apps.apple.com/us/app/soonr-fertility-for-couples/id6756647515',
        whereToBuy: ['App Store', 'Google Play'],
        platform: 'iOS, Android',
        // Buy Now needs a page with a real path (not a bare homepage), so it
        // opens the App Store listing; whereToBuyLinks adds Google Play.
        url: 'https://apps.apple.com/us/app/soonr-fertility-for-couples/id6756647515',
        website: 'https://soonr.health/',
        whereToBuyLinks: { 'App Store': 'https://apps.apple.com/us/app/soonr-fertility-for-couples/id6756647515', 'Google Play': 'https://play.google.com/store/apps/details?id=com.health.soonr' },
        image: '/products/soonr/soonr-app.png',
        summary: 'A preconception app built for both partners. Each person logs their own health habits (exercise, meals, supplements, symptoms, and habits they’re avoiding), and both see each other’s progress; consistent logging fills a shared "Momentum Orb." It also tracks periods, discharge, ovulation test results, and basal body temperature, predicts the fertile window, and can sync Apple Watch wrist temperature through Apple Health. For hormone readings, it pairs with the separately sold Surearly SMART test reader.',
        safety: {
            fdaStatus: 'Not FDA-cleared. Soonr describes itself as a wellness tool, not medical advice.',
            materials: 'N/A (app)',
            recalls: 'N/A',
            allergens: 'N/A',
            sideEffects: 'N/A (software).',
            opinionAlerts: 'Fertile-window predictions from period and symptom logs are estimates; Soonr suggests the Surearly SMART reader for actual hormone readings. The app is new (App Store release February 2026), so there’s little long-term user feedback yet.',
        },
        privacy: {
            dataStorage: 'AWS servers in the United States and other countries, per Soonr’s privacy policy. Operated by Vespexx Inc.',
            sellsData: 'Says it does not sell personal data or share it for cross-context behavioral advertising.',
            hipaa: 'Not described as HIPAA-covered; consumer wellness app.',
            keyPolicy: 'Health data is shared with a connected partner only with your explicit consent, and disconnecting removes previously shared data from the partner’s app.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of ACOG guidance and a Cochrane review; not a direct clinician quote. App details are from soonr.health, its App Store listing, and its privacy policy.',
        doctorOpinion: 'Soonr’s focus on both partners matches clinical advice: ACOG’s prepregnancy guidance covers diet and a prenatal vitamin with folic acid, exercise, a healthy weight, and cutting out tobacco and alcohol, and partners’ habits matter too. An app that makes those habits shared and visible may help couples stay consistent, though no study of Soonr itself was found.\n\nFor timing, fertile-window predictions based on period logs are estimates. Urine LH testing is better supported: a 2023 Cochrane review found timing sex with ovulation tests probably improves pregnancy and live-birth rates, which is why pairing the app with a test reader can help. ACOG recommends a fertility evaluation after 1 year of trying, or 6 months if you’re over 35.',
        doctorOpinionShort: 'A couples’ preconception tracker built around ACOG-style healthy habits for both partners. Fertile-window predictions are estimates; pairing it with LH testing, which Cochrane evidence supports, is more precise. No study of the app itself was found.',
        whoItsFor: [
            'Couples planning a pregnancy who want to work on health habits together',
            'Partners who want to see each other’s cycle calendar, fertile window, and daily logs',
            'Anyone who wants to log ovulation tests and BBT alongside lifestyle habits',
        ],
        howToUse: {
            intro: 'Per Soonr’s own getting-started steps:',
            steps: [
                'Download the app and answer a few questions about your health, lifestyle, and goals.',
                'Invite your partner with a link; you both agree on what health data is shared.',
                'Log daily health factors (exercise, meals, symptoms, supplements, habits) in about 5 minutes a day.',
                'Track your cycle; Soonr predicts the fertile window and shows it on a shared calendar.',
                'Optional: connect the Surearly SMART reader (sold separately) for LH and progesterone-marker readings.',
            ],
            sourceUrl: 'https://soonr.health/',
            sourceLabel: 'soonr.health',
        },
        warnings: [
            'Soonr is a wellness tool, not medical advice or a diagnosis.',
            'Not a form of birth control.',
            'See a clinician if you haven’t conceived after 1 year of trying (6 months if you’re over 35), per ACOG.',
        ],
        communityReview: 'On the App Store, Soonr has a 4.7-star average from 21 ratings (as of September 30, 2026), a small number since the app launched in February 2026. Read the reviews directly on the App Store and Google Play listings linked below.',
        effectiveness: 'No independent study of the Soonr app was found. Its fertile-window predictions are estimates; urine ovulation testing, which it can log and sync, has moderate-quality Cochrane evidence for improving pregnancy rates.',
        integrations: ['Apple Health', 'Surearly SMART'],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary.
            scientific: {
                links: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10501857/', text: 'Timed intercourse for couples trying to conceive (Cochrane review, 2023)', summary: 'A Cochrane review of 7 randomized trials (2,464 women or couples) found that timing sex with urine ovulation (LH) tests probably increases the chance of pregnancy and live birth compared with not predicting ovulation (moderate-quality evidence). This supports ovulation testing in general, not a specific device or app.' },
                    { url: 'https://www.acog.org/womens-health/faqs/good-health-before-pregnancy-prepregnancy-care', text: 'ACOG: Good Health Before Pregnancy (Prepregnancy Care)', summary: 'ACOG recommends steps before pregnancy such as a healthy diet and prenatal vitamin with folic acid, regular exercise, reaching a healthy weight, and stopping tobacco, alcohol, and other substances, and notes partners shouldn’t smoke around you. These are the kinds of habits the Soonr app tracks; this is general guidance, not validation of the app.' },
                    { url: 'https://www.acog.org/womens-health/faqs/evaluating-infertility', text: 'ACOG: Evaluating Infertility', summary: 'ACOG explains that urine tests detect the rise in luteinizing hormone (LH) that comes before ovulation, and recommends a fertility evaluation after 1 year of trying (or 6 months if you’re over 35). This is clinical guidance for the category, not validation of a specific product.' },
                ],
            },
            community: {
                links: [
                    { url: 'https://apps.apple.com/us/app/soonr-fertility-for-couples/id6756647515', text: 'App Store: Soonr: Fertility for Couples', summary: 'The app’s App Store listing: 4.7 stars from 21 ratings as of September 30, 2026.' },
                    { url: 'https://play.google.com/store/apps/details?id=com.health.soonr', text: 'Google Play: Soonr', summary: 'The app’s Google Play listing, with Android user reviews.' },
                    { url: 'https://soonr.health/', text: 'soonr.health', summary: 'Soonr’s own site, with features and pricing.' },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-surearly-smart-ovulation-test',
        name: 'Surearly SMART Ovulation Test Reader (works with Soonr)',
        brand: 'Surearly',
        category: 'diagnostics',
        type: 'physical',
        internal: false,
        healthFunctions: ['fertility', 'cycle-tracking'],
        tags: ['fertility', 'pregnancy'],
        price: 'See Amazon for current price (reader + 20 test sticks)',
        whereToBuy: ['Amazon'],
        // Buy Now goes to Amazon, so it carries ayna's Associates tag (see buyLink.test.js).
        url: 'https://www.amazon.com/dp/B0H1BCL6NB?tag=aynahealth-20',
        image: '/products/soonr/surearly-smart-reader.webp',
        summary: 'A digital at-home urine test reader that measures two hormones from one stick: LH, whose surge predicts your fertile window, and P3G (a progesterone marker, also called PdG), which confirms ovulation happened. Results appear on the reader in about 5 minutes and sync by Bluetooth to the Soonr app (or Surearly’s own app), where you can see hormone trends across cycles and share them with a partner. Comes with 20 test sticks. Made by Sugentech (Surearly); Soonr sells it as its recommended hormone tester.',
        safety: {
            fdaStatus: 'Listed in the FDA’s device database (GUDID) as an over-the-counter LH test (product code NGE) made by Sugentech; no 510(k) clearance is listed. Soonr also describes it as CE-IVD marked.',
            materials: 'Digital test reader with Bluetooth, plus 20 single-use urine test sticks. Detects LH at 10 mIU/mL or above and progesterone metabolite (P3G) at 5 µg/mL or above, per its FDA device listing.',
            recalls: 'No recalls are listed in its FDA device record; check current FDA and manufacturer notices.',
            sideEffects: 'None expected (urine test). Full notes are listed below.',
            opinionAlerts: 'Accuracy figures (the box claims over 99% accuracy at detecting the LH surge) are the manufacturer’s. Surearly and Soonr are separate companies; Soonr promotes the device and its app syncs with it.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of ACOG guidance, a Cochrane review, and the device’s FDA listing; not a direct clinician quote.',
        doctorOpinion: 'Urine LH testing is one of the better-supported tools for trying to conceive: ACOG explains that these tests detect the LH rise before ovulation, and a 2023 Cochrane review found timing sex with ovulation tests probably increases pregnancy and live-birth rates (moderate-quality evidence). Adding a progesterone-marker (P3G/PdG) reading can help confirm that ovulation actually happened, which LH alone can’t show.\n\nThe reader’s digital result removes the guesswork of reading faint lines. No independent study of this specific reader was found, and ovulation tests can’t diagnose infertility; ACOG recommends an evaluation after 1 year of trying, or 6 months if you’re over 35.',
        doctorOpinionShort: 'LH ovulation testing has moderate-quality Cochrane evidence for improving pregnancy rates, and adding a progesterone-marker reading helps confirm ovulation. No study of this specific reader was found.',
        whoItsFor: [
            'People trying to conceive who want to pinpoint their fertile window',
            'Anyone who wants to confirm ovulation happened, not just predict it',
            'Soonr app users who want real hormone readings synced to their shared calendar',
        ],
        howToUse: {
            intro: 'Per Soonr and the device’s FDA listing:',
            steps: [
                'Insert a test stick into the reader and apply urine as directed on the package insert.',
                'Read the result on the reader in about 5 minutes.',
                'Results sync by Bluetooth to the Soonr app (or the Surearly SMART app), where you can track LH and P3G across cycles.',
            ],
            sourceUrl: 'https://soonr.health/',
            sourceLabel: 'soonr.health: Surearly SMART',
        },
        warnings: [
            'Follow the package insert for when in your cycle to start testing and what time of day to test.',
            'Ovulation tests predict and confirm ovulation; they can’t diagnose infertility or confirm pregnancy.',
            'See a clinician if you haven’t conceived after 1 year of trying (6 months if you’re over 35), per ACOG.',
        ],
        communityReview: 'Customer reviews for this reader are on its Amazon listing (linked below). Amazon blocks automated access, so ayna hasn’t pulled a rating; read them directly.',
        effectiveness: 'Urine LH testing probably improves pregnancy and live-birth rates when used to time sex (Cochrane 2023, moderate-quality evidence). No independent study of the Surearly SMART reader was found.',
        integrations: ['Soonr', 'Surearly SMART app'],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary.
            scientific: {
                links: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10501857/', text: 'Timed intercourse for couples trying to conceive (Cochrane review, 2023)', summary: 'A Cochrane review of 7 randomized trials (2,464 women or couples) found that timing sex with urine ovulation (LH) tests probably increases the chance of pregnancy and live birth compared with not predicting ovulation (moderate-quality evidence). This supports ovulation testing in general, not a specific device or app.' },
                    { url: 'https://www.acog.org/womens-health/faqs/evaluating-infertility', text: 'ACOG: Evaluating Infertility', summary: 'ACOG explains that urine tests detect the rise in luteinizing hormone (LH) that comes before ovulation, and recommends a fertility evaluation after 1 year of trying (or 6 months if you’re over 35). This is clinical guidance for the category, not validation of a specific product.' },
                ],
            },
            community: {
                links: [
                    { platform: 'amazon', url: 'https://www.amazon.com/dp/B0H1BCL6NB', text: 'Amazon: Surearly Digital Fertility Monitor, LH + PdG Ovulation Tracker with App', summary: 'This reader’s Amazon listing (reader + 20 test sticks), with customer reviews. Amazon blocks automated access, so no rating is quoted here; read the reviews directly.' },
                    { url: 'https://accessgudid.nlm.nih.gov/devices/08809408863482', text: 'FDA device listing (GUDID): Surearly SMART Ovulation Test', summary: 'The device’s entry in the FDA/NIH device database: over-the-counter LH test by Sugentech, in commercial distribution.' },
                ],
            },
        },
        isEmergingBrand: false,
    },
    // Tampon Tribe (tampontribe.com). ayna brand partner since 2026-10-17
    // (team request); Awin affiliate links added 2026-10-18 for tampons, pads,
    // reusable pads and teen pads (none supplied for the bulk liners). First batch (2026-09-30): the five products matching
    // the photos ayna supplied (stored under public/products/tampon-tribe/).
    // Facts are from tampontribe.com (Shopify products.json + product pages);
    // brand-site ratings are from its review widget. Options (absorbency,
    // counts) cost the same and share one photo, so they're listed in the
    // price text rather than as PRODUCT_VARIANTS; Buy Now opens the product
    // page to choose. The store also has many duplicate "-copy" listings,
    // masks, dispensers, and giveaway items, which aren't catalog products.
    // Certification (2026-10-01): manufacturer Cohitech states GOTS/ICEA
    // organic certification, and Tampon Tribe posts a June 2024 CALITEC LAB
    // report on the raw cotton. Neither posts the GOTS certificate number;
    // ayna is requesting it. When it arrives, link it in each product's
    // verificationLinks.scientific and drop the "certificate number isn't
    // posted" sentence from safety.opinionAlerts.
    {
        id: 'p-tampontribe-organic-tampons',
        name: 'Tampon Tribe Organic Tampons',
        brand: 'Tampon Tribe',
        category: 'tampon',
        type: 'physical',
        internal: true,
        healthFunctions: ['menstrual-collection'],
        tags: ['organic', 'sustainability', 'comfort', 'heavy-flow'],
        price: '$10.60 per box, as a monthly subscription (Regular 16, Super 14, Super Plus 12, or a mixed or heavy-flow pack)',
        userRating: 4.6,
        userRatingSourceUrl: 'https://tampontribe.com/products/tampons',
        whereToBuy: ['tampontribe.com'],
        url: 'https://tampontribe.com/products/tampons',
        affiliateUrl: 'https://www.awin1.com/cread.php?awinmid=91275&awinaffid=3082811&ued=https%3A%2F%2Ftampontribe.com%2Fproducts%2Ftampons%3Fselling_plan%3D626000030%26variant%3D44206457192706', // ayna affiliate link (2026-10-18)
        image: '/products/tampon-tribe/organic-tampons.webp',
        summary: 'Certified organic cotton tampons with a biodegradable cardboard "twist" applicator and no plastic anywhere, including the packaging. The absorbent core is wrapped in an organic cotton "safety veil" that the brand says keeps loose cotton strands from being left behind. No rayon/viscose, perfume, dyes, or chlorine bleaching. Sold as a monthly subscription you can customize, pause, or cancel, with free U.S. delivery; the first box arrives in a reusable jute bag, refills in recycled paper.',
        safety: {
            fdaStatus: 'Tampons are regulated by the FDA as medical devices; tampontribe.com doesn’t list this product’s FDA clearance details. The manufacturer, Cohitech, is FDA-registered and certified to ISO 13485 (medical-device quality management).',
            materials: '100% organic cotton absorbent core and cover (certified organic under GOTS by ICEA) with an organic cotton safety veil around the core; biodegradable cardboard twist applicator with a rounded tip; paper wrapper. No superabsorbents, glue, rayon/viscose, perfume, or chlorine/dioxin bleaching.',
            recalls: 'No recalls are mentioned on tampontribe.com; check current FDA and manufacturer recall notices.',
            allergens: 'Hypoallergenic (independently dermatologist-tested, per manufacturer Cohitech), fragrance-free, dye-free, and vegan.',
            sideEffects: 'Toxic shock syndrome (TSS) is rare but serious with any tampon: use the lowest absorbency you need and never wear one longer than 8 hours. Full warnings are listed below.',
            opinionAlerts: 'Organic cotton avoids fragrance, dyes, and chlorine bleaching, but "100% cotton" isn’t automatically lower TSS risk: a 2018 lab study found cotton/rayon blend tampons grew less S. aureus than cotton-only ones. Absorbency and wear time matter most (FDA). Certification and testing: Tampon Tribe’s manufacturer, Cohitech (Spain), states its products are certified organic under GOTS by ICEA, and a June 2024 independent lab report (CALITEC LAB, Barcelona) found no pesticide residues, glyphosate, GMOs, formaldehyde, or detectable heavy metals in its organic cotton. Two limits: the lab tested a sample of raw organic cotton, not finished tampons, and neither Tampon Tribe nor Cohitech posts the GOTS certificate number, so the certification rests on Cohitech’s public statement plus that report; ayna will link the certificate once it’s provided. Separately, Tampon Tribe calls itself the only totally plastic-free U.S. period product; that’s a marketing claim the certifications don’t cover, and ayna couldn’t verify it.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of FDA and ACOG guidance and peer-reviewed research; not a direct clinician quote. Product details are from tampontribe.com.',
        doctorOpinion: 'Organic cotton with no fragrance, dyes, or chlorine bleaching is a reasonable choice for people with vulvar irritation or who want fewer additives. What the evidence doesn’t support is treating "100% organic cotton" as a TSS safety upgrade: FDA’s guidance focuses on using the lowest absorbency you need and changing every 4 to 8 hours, and a 2018 lab study actually found cotton/rayon blend tampons grew less Staphylococcus aureus than cotton-only ones.\n\nTampon Tribe’s cotton "safety veil" around the core is designed to keep fibers from shedding on removal, a concern with some cotton tampons. No independent study of Tampon Tribe tampons was found.',
        doctorOpinionShort: 'A plastic-free, organic cotton tampon with a cardboard applicator. Organic cotton cuts additives but isn’t a proven TSS-risk downgrade; FDA says to use the lowest absorbency and change every 4 to 8 hours. No study of this brand was found.',
        whoItsFor: [
            'People who want organic cotton tampons with no plastic, fragrance, or dyes',
            'Anyone who wants a cardboard applicator instead of plastic',
            'Subscription shoppers who want a customizable monthly box with free U.S. delivery',
        ],
        howToUse: {
            intro: 'Per Tampon Tribe’s directions and FDA tampon guidance:',
            steps: [
                'Unwrap the paper wrap.',
                'Twist the top part of the applicator in the opposite direction from the base.',
                'Push the base up slightly so the tip of the tampon shows, then insert.',
                'Choose the lowest absorbency that handles your flow, and change every 4 to 8 hours; never longer than 8 hours (FDA).',
            ],
            sourceUrl: 'https://tampontribe.com/products/tampons',
            sourceLabel: 'tampontribe.com: Organic Tampons',
        },
        warnings: [
            'Toxic shock syndrome (TSS) is rare but serious. Remove the tampon and get emergency care for sudden high fever, vomiting, diarrhea, dizziness or fainting, or a sunburn-like rash during your period (FDA).',
            'Use only during your period, with the lowest absorbency you need.',
            'Not a form of contraception and does not protect against STIs.',
        ],
        communityReview: 'On tampontribe.com, Organic Tampons average 4.6 out of 5 from 401 reviews (reviews on the brand’s own site).',
        effectiveness: 'Absorbency comes in Regular, Super, and Super Plus. No independent lab comparison of Tampon Tribe tampons against other brands was found.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary.
            scientific: {
                links: [
                    { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety', text: 'FDA: Tampon Safety Facts', summary: 'FDA advises using the lowest absorbency tampon you need, changing every 4 to 8 hours and never wearing one longer than 8 hours, and knowing the signs of toxic shock syndrome (sudden high fever, vomiting, diarrhea, fainting or dizziness, or a sunburn-like rash). FDA also notes cleared tampons are made of cotton, rayon, or blends, bleached without elemental chlorine. This is category guidance, not validation of a specific product.' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5981080/', text: 'Impact of currently marketed tampons and menstrual cups on S. aureus growth and TSST-1 production in vitro (Nonfoux et al., 2018)', summary: 'In a lab study of 11 tampon types, tampons made of a cotton/rayon mix grew less Staphylococcus aureus than cotton-only tampons. It suggests "100% cotton" isn’t automatically lower TSS risk; absorbency and wear time matter more. Lab evidence, not a study of Tampon Tribe tampons.' },
                    { url: 'https://tampontribe.com/blogs/news/our-third-party-testing-and-certifications', text: 'Tampon Tribe: Third-Party Testing and Certifications', summary: 'Tampon Tribe’s testing page, linking its June 2024 independent lab analysis (CALITEC LAB, Barcelona) of its organic cotton: glyphosate and AMPA below 0.01 mg/kg, no multi-residue pesticides detected, GMO-negative, residual chlorine below 0.1 mg/L, formaldehyde below 0.01 mg/kg, and 9 heavy metals (including arsenic, lead, mercury, and cadmium) below detection limits. This tested a sample of raw organic cotton from manufacturer Cohitech, not finished products, and isn’t a clinical study.' },
                    { url: 'https://www.cohitech.net/en/', text: 'Cohitech (Cotton High Tech): manufacturer certifications', summary: 'Tampon Tribe’s manufacturer, the Spanish organic cotton producer named on its lab report. Cohitech states its products are certified organic under GOTS by ICEA and by Cotton Inc., that it is FDA-registered with ISO 13485/MDSAP medical-device quality certification, and that products are dermatologically tested by independent labs as hypoallergenic and non-irritating. Its site doesn’t post the GOTS certificate number.' },
                ],
            },
            community: {
                links: [
                    { url: 'https://tampontribe.com/products/tampons', text: 'tampontribe.com: Organic Tampons reviews', summary: 'The brand’s product page: 4.6/5 from 401 reviews as of September 30, 2026.' },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-tampontribe-organic-pads',
        name: 'Tampon Tribe Organic Pads',
        brand: 'Tampon Tribe',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection'],
        tags: ['organic', 'sustainability', 'comfort'],
        price: '$10.60 per box of 10, as a monthly subscription (Day, Night, or 7 Day + 3 Night)',
        userRating: 4.8,
        userRatingSourceUrl: 'https://tampontribe.com/products/pads',
        whereToBuy: ['tampontribe.com'],
        url: 'https://tampontribe.com/products/pads',
        affiliateUrl: 'https://tidd.ly/4zEjNsY', // ayna affiliate link (2026-10-18)
        image: '/products/tampon-tribe/organic-pads.webp',
        summary: 'Thin, winged pads made with certified organic cotton and no plastic. Day pads are 240 mm long with 100 ml absorbency; Night pads are 290 mm with 120 ml absorbency and double wings. "Gravity" anti-leak edges help keep you dry. Individually wrapped, with a plant-based backing and a vegan biopolymer adhesive instead of glue. Sold as a monthly subscription with free U.S. delivery.',
        safety: {
            fdaStatus: 'Menstrual pads are regulated by the FDA as medical devices; tampontribe.com doesn’t list this product’s FDA details. The manufacturer, Cohitech, is FDA-registered and certified to ISO 13485 (medical-device quality management).',
            materials: '100% organic cotton top layer and absorbent core (certified organic under GOTS by ICEA). No superabsorbent gel, perfume, dyes, or glue; plant-based backing with a vegan biopolymer adhesive. Vegan and hypoallergenic. Individually wrapped.',
            recalls: 'No recalls are mentioned on tampontribe.com; check current FDA and manufacturer recall notices.',
            allergens: 'Hypoallergenic (independently dermatologist-tested, per manufacturer Cohitech), fragrance-free, dye-free, and vegan.',
            sideEffects: 'None expected. Stop using if you notice irritation. Full notes are listed below.',
            opinionAlerts: 'Without superabsorbent gel, these rely on cotton alone, so they may need changing more often on heavy days. Certification and testing: Tampon Tribe’s manufacturer, Cohitech (Spain), states its products are certified organic under GOTS by ICEA, and a June 2024 independent lab report (CALITEC LAB, Barcelona) found no pesticide residues, glyphosate, GMOs, formaldehyde, or detectable heavy metals in its organic cotton. Two limits: the lab tested a sample of raw organic cotton, not finished pads, and neither Tampon Tribe nor Cohitech posts the GOTS certificate number, so the certification rests on Cohitech’s public statement plus that report; ayna will link the certificate once it’s provided. Separately, Tampon Tribe calls itself the only totally plastic-free U.S. period product; that’s a marketing claim the certifications don’t cover, and ayna couldn’t verify it.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of FDA and ACOG guidance and peer-reviewed research; not a direct clinician quote. Product details are from tampontribe.com.',
        doctorOpinion: 'Cotton pads without fragrance, dyes, or plastic top sheets are a sensible choice for people with vulvar irritation or sensitivity to synthetic materials. ACOG’s general advice applies: change a pad at least every 4 to 8 hours, or whenever it feels full or wet. Because they skip superabsorbent gel, they may need changing more often on heavy days. No independent study of these pads was found.',
        doctorOpinionShort: 'Organic cotton, plastic-free pads with wings. A reasonable pick for sensitive skin; change every 4 to 8 hours per ACOG. No study of this brand was found.',
        whoItsFor: [
            'People with vulvar irritation or sensitivity to plastic or synthetic pad materials',
            'Anyone who wants plastic-free, organic cotton pads',
            'Light to moderate flow (Day) and overnight use (Night)',
        ],
        howToUse: {
            intro: 'Per ACOG’s general pad guidance:',
            steps: [
                'Peel off the backing and press the pad into your underwear, folding the wings around the edges.',
                'Change at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable.',
                'Wrap the used pad and put it in the trash. Tampon Tribe says the pads will biodegrade, but it doesn’t recommend flushing them.',
            ],
            sourceUrl: 'https://www.acog.org/womens-health/faqs/your-first-period',
            sourceLabel: 'ACOG: Your First Period',
        },
        warnings: [
            'Don’t flush; Tampon Tribe itself doesn’t recommend it.',
            'Stop using if you notice irritation or a rash.',
        ],
        communityReview: 'On tampontribe.com, Organic Pads average 4.8 out of 5 from 163 reviews (reviews on the brand’s own site).',
        effectiveness: 'Day pads hold up to 100 ml and Night pads up to 120 ml, per the brand. No independent comparison with other pads was found.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary.
            scientific: {
                links: [
                    { url: 'https://www.acog.org/womens-health/faqs/your-first-period', text: 'ACOG: Your First Period', summary: 'ACOG advises changing a pad at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable, and explains how pads with wings stay in place. General guidance for any pad, not validation of a specific product.' },
                    { url: 'https://tampontribe.com/blogs/news/our-third-party-testing-and-certifications', text: 'Tampon Tribe: Third-Party Testing and Certifications', summary: 'Tampon Tribe’s testing page, linking its June 2024 independent lab analysis (CALITEC LAB, Barcelona) of its organic cotton: glyphosate and AMPA below 0.01 mg/kg, no multi-residue pesticides detected, GMO-negative, residual chlorine below 0.1 mg/L, formaldehyde below 0.01 mg/kg, and 9 heavy metals (including arsenic, lead, mercury, and cadmium) below detection limits. This tested a sample of raw organic cotton from manufacturer Cohitech, not finished products, and isn’t a clinical study.' },
                    { url: 'https://www.cohitech.net/en/', text: 'Cohitech (Cotton High Tech): manufacturer certifications', summary: 'Tampon Tribe’s manufacturer, the Spanish organic cotton producer named on its lab report. Cohitech states its products are certified organic under GOTS by ICEA and by Cotton Inc., that it is FDA-registered with ISO 13485/MDSAP medical-device quality certification, and that products are dermatologically tested by independent labs as hypoallergenic and non-irritating. Its site doesn’t post the GOTS certificate number.' },
                ],
            },
            community: {
                links: [
                    { url: 'https://tampontribe.com/products/pads', text: 'tampontribe.com: Organic Pads reviews', summary: 'The brand’s product page: 4.8/5 from 163 reviews as of September 30, 2026.' },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-tampontribe-pantyliners-bulk-buy',
        name: 'Tampon Tribe Organic Pantyliners Bulk Buy (48)',
        brand: 'Tampon Tribe',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection'],
        tags: ['organic', 'sustainability', 'comfort', 'cost'],
        price: '$20 for 48 pantyliners (one-time purchase)',
        whereToBuy: ['tampontribe.com'],
        url: 'https://tampontribe.com/products/organic-pantyliners-bulk-buy',
        image: '/products/tampon-tribe/pantyliners-bulk-buy.webp',
        summary: 'A one-time bulk pack of 48 ultrathin organic cotton pantyliners in a jute bag. Each liner is individually wrapped in a starch film (not plastic) and uses a biodegradable polymer adhesive. No perfume, superabsorbent, or chlorine bleaching. The same liners are also sold as a subscription (24 or 48 per box).',
        safety: {
            fdaStatus: 'Pantyliners are regulated by the FDA as medical devices; tampontribe.com doesn’t list this product’s FDA details. The manufacturer, Cohitech, is FDA-registered and certified to ISO 13485 (medical-device quality management).',
            materials: '100% organic cotton absorbent core (certified organic under GOTS by ICEA) with a cotton non-woven top sheet designed not to leave fibers on skin; individually wrapped in starch film; biodegradable polymer adhesive strip. Perfume-free, superabsorbent-free, no chlorine or dioxin bleaching.',
            recalls: 'No recalls are mentioned on tampontribe.com; check current FDA and manufacturer recall notices.',
            allergens: 'Hypoallergenic (independently dermatologist-tested, per manufacturer Cohitech), fragrance-free, and vegan.',
            sideEffects: 'None expected. Stop using if you notice irritation.',
            opinionAlerts: 'For light days, discharge, or backup only; not enough for a full period. Certification and testing: Tampon Tribe’s manufacturer, Cohitech (Spain), states its products are certified organic under GOTS by ICEA, and a June 2024 independent lab report (CALITEC LAB, Barcelona) found no pesticide residues, glyphosate, GMOs, formaldehyde, or detectable heavy metals in its organic cotton. Two limits: the lab tested a sample of raw organic cotton, not finished pantyliners, and neither Tampon Tribe nor Cohitech posts the GOTS certificate number, so the certification rests on Cohitech’s public statement plus that report; ayna will link the certificate once it’s provided. Separately, Tampon Tribe calls itself the only totally plastic-free U.S. period product; that’s a marketing claim the certifications don’t cover, and ayna couldn’t verify it.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of FDA and ACOG guidance and peer-reviewed research; not a direct clinician quote. Product details are from tampontribe.com.',
        doctorOpinion: 'Fragrance-free cotton liners are a good choice for daily discharge or light spotting, especially for people who react to scented or plastic-topped liners. Change them as they get damp. No independent study of these liners was found.',
        doctorOpinionShort: 'Unscented organic cotton liners for light days and discharge. A sensible choice for sensitive skin; no study of this brand was found.',
        whoItsFor: [
            'Daily discharge, spotting, or light days',
            'Backup with a tampon or cup',
            'People who react to scented or plastic-topped liners',
        ],
        howToUse: {
            intro: 'General guidance:',
            steps: [
                'Unwrap, peel off the backing, and press into your underwear.',
                'Change whenever it feels damp, and at least every 4 to 8 hours (ACOG’s pad guidance).',
                'Throw used liners in the trash; don’t flush.',
            ],
            sourceUrl: 'https://www.acog.org/womens-health/faqs/your-first-period',
            sourceLabel: 'ACOG: Your First Period',
        },
        warnings: [
            'For light flow or discharge only; use a pad or tampon for your period.',
            'Stop using if you notice irritation.',
        ],
        communityReview: 'This bulk listing shows no reviews of its own. The same liners’ regular Organic Pantyliners listing averages 4.5 out of 5 from 92 reviews on tampontribe.com.',
        effectiveness: 'Ultrathin, for light absorbency. No independent comparison with other liners was found.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary.
            scientific: {
                links: [
                    { url: 'https://www.acog.org/womens-health/faqs/your-first-period', text: 'ACOG: Your First Period', summary: 'ACOG advises changing a pad at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable, and explains how pads with wings stay in place. General guidance for any pad, not validation of a specific product.' },
                    { url: 'https://tampontribe.com/blogs/news/our-third-party-testing-and-certifications', text: 'Tampon Tribe: Third-Party Testing and Certifications', summary: 'Tampon Tribe’s testing page, linking its June 2024 independent lab analysis (CALITEC LAB, Barcelona) of its organic cotton: glyphosate and AMPA below 0.01 mg/kg, no multi-residue pesticides detected, GMO-negative, residual chlorine below 0.1 mg/L, formaldehyde below 0.01 mg/kg, and 9 heavy metals (including arsenic, lead, mercury, and cadmium) below detection limits. This tested a sample of raw organic cotton from manufacturer Cohitech, not finished products, and isn’t a clinical study.' },
                    { url: 'https://www.cohitech.net/en/', text: 'Cohitech (Cotton High Tech): manufacturer certifications', summary: 'Tampon Tribe’s manufacturer, the Spanish organic cotton producer named on its lab report. Cohitech states its products are certified organic under GOTS by ICEA and by Cotton Inc., that it is FDA-registered with ISO 13485/MDSAP medical-device quality certification, and that products are dermatologically tested by independent labs as hypoallergenic and non-irritating. Its site doesn’t post the GOTS certificate number.' },
                ],
            },
            community: {
                links: [
                    { url: 'https://tampontribe.com/products/organic-pantyliners-bulk-buy', text: 'tampontribe.com: Organic Pantyliners Bulk Buy', summary: 'The brand’s bulk-buy page.' },
                    { url: 'https://tampontribe.com/products/pantyliners', text: 'tampontribe.com: Organic Pantyliners reviews', summary: 'The same liners’ subscription listing: 4.5/5 from 92 reviews as of September 30, 2026.' },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-tampontribe-reusable-pads',
        name: 'Tampon Tribe Reusable Pads, Organic Cotton (2-Pack)',
        brand: 'Tampon Tribe',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection'],
        tags: ['organic', 'sustainability', 'reusable', 'cost'],
        price: '$16.80 for 2 pads',
        whereToBuy: ['tampontribe.com'],
        url: 'https://tampontribe.com/products/reusable-pads-2-pack',
        affiliateUrl: 'https://tidd.ly/4hTD188', // ayna affiliate link (2026-10-18)
        image: '/products/tampon-tribe/reusable-pads-2-pack.webp',
        summary: 'Washable cloth pads made with ultra-soft certified organic cotton, sold in a 2-pack. Rated for medium flow, holding up to 3 tampons’ worth; change more often on heavy days. Three layers with odor control, a super-absorbent inner layer, "gravity" leak-guard edges, and V-shaped straps that fasten with a metal clasp behind your underwear. The brand says they’re PFAS-free, plant-based, and vegan, and offers a money-back guarantee.',
        safety: {
            fdaStatus: 'Reusable menstrual pads are regulated by the FDA as medical devices; tampontribe.com doesn’t list this product’s FDA details.',
            materials: 'Organic cotton top layer, 3-layer construction with an odor-control layer and an absorbent inner layer; V-shaped straps with a metal clasp. PFAS-free, plant-based, and vegan, per the brand.',
            recalls: 'No recalls are mentioned on tampontribe.com; check current FDA and manufacturer recall notices.',
            allergens: 'Hypoallergenic, per the brand.',
            sideEffects: 'None expected with proper washing. Stop using if you notice irritation.',
            opinionAlerts: 'The absorbent layer’s material isn’t specified, and the site calls the product plastic-free. Tampon Tribe publishes GOTS/ICEA certification (through its manufacturer Cohitech) and a June 2024 lab report for its organic cotton, but that lab tested raw cotton for the disposable line, not these cloth pads, and the GOTS certificate number isn’t posted; ayna will link the certificate once it’s provided. The PFAS-free claim specific to these reusable pads isn’t covered by that testing, and ayna couldn’t verify it. Tampon Tribe also calls itself the only totally plastic-free U.S. period product; that’s a marketing claim the certifications don’t cover.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of FDA and ACOG guidance and peer-reviewed research; not a direct clinician quote. Product details are from tampontribe.com.',
        doctorOpinion: 'Washable cloth pads are a reasonable, lower-waste option for light to medium flow and for people sensitive to disposable pad materials. The key is hygiene: change them as often as a disposable pad (ACOG suggests every 4 to 8 hours), and wash and fully dry them between uses. The "PFAS-free" claim is the brand’s own, without published test results. No independent study of these pads was found.',
        doctorOpinionShort: 'Organic cotton cloth pads for medium flow. Lower waste and gentle on sensitive skin if washed and dried well between uses. PFAS-free claim is the brand’s own; no study of these pads was found.',
        whoItsFor: [
            'Light to medium flow, or backup',
            'People who want to cut disposable waste',
            'People sensitive to disposable pad materials',
        ],
        howToUse: {
            intro: 'Per Tampon Tribe’s directions:',
            steps: [
                'Place the pad in your underwear and fasten the metal clasp behind your underwear.',
                'Change at least every 4 to 8 hours, or sooner on heavy days (it holds about 3 tampons’ worth).',
                'Rinse in cold water, wash with gentle soap, and hang to dry completely before reusing.',
            ],
            sourceUrl: 'https://tampontribe.com/products/reusable-pads-2-pack',
            sourceLabel: 'tampontribe.com: Reusable Pads',
        },
        warnings: [
            'Wash and dry completely between uses to avoid irritation and odor.',
            'For medium flow; change more often, or pair with another product, on heavy days.',
        ],
        communityReview: 'No customer rating is shown for this pad on tampontribe.com. The brand offers a money-back guarantee if you’re unhappy with it.',
        effectiveness: 'Holds up to about 3 tampons’ worth, per the brand. No independent absorbency or PFAS test was found.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary.
            scientific: {
                links: [
                    { url: 'https://www.acog.org/womens-health/faqs/your-first-period', text: 'ACOG: Your First Period', summary: 'ACOG advises changing a pad at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable, and explains how pads with wings stay in place. General guidance for any pad, not validation of a specific product.' },
                    { url: 'https://tampontribe.com/blogs/news/our-third-party-testing-and-certifications', text: 'Tampon Tribe: Third-Party Testing and Certifications', summary: 'Tampon Tribe’s testing page, linking its June 2024 independent lab analysis (CALITEC LAB, Barcelona) of its organic cotton: glyphosate and AMPA below 0.01 mg/kg, no multi-residue pesticides detected, GMO-negative, residual chlorine below 0.1 mg/L, formaldehyde below 0.01 mg/kg, and 9 heavy metals (including arsenic, lead, mercury, and cadmium) below detection limits. This tested a sample of raw organic cotton from manufacturer Cohitech, not finished products, and isn’t a clinical study.' },
                ],
            },
            community: {
                links: [
                    { url: 'https://tampontribe.com/products/reusable-pads-2-pack', text: 'tampontribe.com: Reusable Pads (2-Pack)', summary: 'The brand’s product page, with care instructions and its money-back guarantee.' },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-tampontribe-teen-pads',
        name: 'Tampon Tribe Organic Teen Pads',
        brand: 'Tampon Tribe',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection'],
        tags: ['organic', 'sustainability', 'comfort', 'beginner-friendly'],
        price: '$10 for 18 pads (individually boxed, or in a jute bag)',
        whereToBuy: ['tampontribe.com'],
        url: 'https://tampontribe.com/products/organic-teen-pads',
        affiliateUrl: 'https://tidd.ly/4k3ndRp', // ayna affiliate link (2026-10-18)
        image: '/products/tampon-tribe/organic-teen-pads.webp',
        summary: 'Smaller winged pads made for teens and tweens, sized to fit smaller bodies and underwear: 7.2 inches long with 40 ml absorbency. Made with certified organic cotton and no plastic, fragrance, or dyes, with "gravity" anti-leak edges. Individually wrapped, and available individually boxed so they’re easy to keep in a school bag.',
        safety: {
            fdaStatus: 'Menstrual pads are regulated by the FDA as medical devices; tampontribe.com doesn’t list this product’s FDA details. The manufacturer, Cohitech, is FDA-registered and certified to ISO 13485 (medical-device quality management).',
            materials: 'Certified organic cotton (GOTS, certified by ICEA). No superabsorbent gel, perfume, dyes, or glue; plant-based backing with a vegan biopolymer adhesive. Vegan and hypoallergenic. Individually wrapped; optional individual boxes.',
            recalls: 'No recalls are mentioned on tampontribe.com; check current FDA and manufacturer recall notices.',
            allergens: 'Hypoallergenic (independently dermatologist-tested, per manufacturer Cohitech), fragrance-free, dye-free, and vegan.',
            sideEffects: 'None expected. Stop using if you notice irritation.',
            opinionAlerts: 'At 40 ml, these are for lighter days; heavier flow may need a full-size pad. Certification and testing: Tampon Tribe’s manufacturer, Cohitech (Spain), states its products are certified organic under GOTS by ICEA, and a June 2024 independent lab report (CALITEC LAB, Barcelona) found no pesticide residues, glyphosate, GMOs, formaldehyde, or detectable heavy metals in its organic cotton. Two limits: the lab tested a sample of raw organic cotton, not finished pads, and neither Tampon Tribe nor Cohitech posts the GOTS certificate number, so the certification rests on Cohitech’s public statement plus that report; ayna will link the certificate once it’s provided. Separately, Tampon Tribe calls itself the only totally plastic-free U.S. period product; that’s a marketing claim the certifications don’t cover, and ayna couldn’t verify it.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of FDA and ACOG guidance and peer-reviewed research; not a direct clinician quote. Product details are from tampontribe.com.',
        doctorOpinion: 'Smaller, unscented cotton pads are a gentle way to start, since first periods are often irregular and lighter pads fit younger bodies better. ACOG’s advice for first periods applies: change a pad at least every 4 to 8 hours, or whenever it feels full or wet. Very heavy periods (soaking a pad every hour or two) are worth mentioning to a doctor. No independent study of these pads was found.',
        doctorOpinionShort: 'Teen-sized, unscented organic cotton pads for lighter flow. Change every 4 to 8 hours per ACOG. No study of this brand was found.',
        whoItsFor: [
            'Teens and tweens starting their periods',
            'Anyone with a smaller body or lighter flow who finds standard pads bulky',
            'Keeping a discreet pad in a school bag',
        ],
        howToUse: {
            intro: 'Per ACOG’s first-period guidance:',
            steps: [
                'Peel off the backing, press the pad into your underwear, and fold the wings around the edges.',
                'Change at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable.',
                'Wrap the used pad and put it in the trash; don’t flush.',
            ],
            sourceUrl: 'https://www.acog.org/womens-health/faqs/your-first-period',
            sourceLabel: 'ACOG: Your First Period',
        },
        warnings: [
            'Lighter absorbency (40 ml): switch to a larger pad on heavy days.',
            'Stop using if you notice irritation or a rash.',
        ],
        communityReview: 'No customer rating is shown for the teen pads on tampontribe.com. Tampon Tribe’s regular Organic Pads average 4.8/5 from 163 reviews on its site.',
        effectiveness: 'Holds up to 40 ml, per the brand. No independent comparison with other teen pads was found.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: { links: [] },
            // Also feeds the source chips under the ayna Summary.
            scientific: {
                links: [
                    { url: 'https://www.acog.org/womens-health/faqs/your-first-period', text: 'ACOG: Your First Period', summary: 'ACOG advises changing a pad at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable, and explains how pads with wings stay in place. General guidance for any pad, not validation of a specific product.' },
                    { url: 'https://tampontribe.com/blogs/news/our-third-party-testing-and-certifications', text: 'Tampon Tribe: Third-Party Testing and Certifications', summary: 'Tampon Tribe’s testing page, linking its June 2024 independent lab analysis (CALITEC LAB, Barcelona) of its organic cotton: glyphosate and AMPA below 0.01 mg/kg, no multi-residue pesticides detected, GMO-negative, residual chlorine below 0.1 mg/L, formaldehyde below 0.01 mg/kg, and 9 heavy metals (including arsenic, lead, mercury, and cadmium) below detection limits. This tested a sample of raw organic cotton from manufacturer Cohitech, not finished products, and isn’t a clinical study.' },
                    { url: 'https://www.cohitech.net/en/', text: 'Cohitech (Cotton High Tech): manufacturer certifications', summary: 'Tampon Tribe’s manufacturer, the Spanish organic cotton producer named on its lab report. Cohitech states its products are certified organic under GOTS by ICEA and by Cotton Inc., that it is FDA-registered with ISO 13485/MDSAP medical-device quality certification, and that products are dermatologically tested by independent labs as hypoallergenic and non-irritating. Its site doesn’t post the GOTS certificate number.' },
                ],
            },
            community: {
                links: [
                    { url: 'https://tampontribe.com/products/organic-teen-pads', text: 'tampontribe.com: Organic Teen Pads', summary: 'The brand’s product page.' },
                ],
            },
        },
        isEmergingBrand: false,
    },

    // Momotaro Apotheca (momotaroapotheca.com). ayna brand partner since
    // 2026-10-17 (Eliz's request; Shopify Collabs affiliate links added
    // 2026-10-18). The six core
    // products matching the photos Eliz supplied; expanded 2026-10-18 to the
    // depth of the other partner cards, at Eliz's request.
    //
    // Sources, all read directly:
    // - Product facts (prices, sizes, ingredients, directions, warnings) and
    //   the founder story: momotaroapotheca.com product pages, /pages/about,
    //   /pages/faq, /pages/ingredients, /pages/homeopathic-medicine, and two
    //   brand blog posts (Hydrosol, Tonic), fetched 2026-10-17/18.
    // - Reviews: the brand's own Junip review feed (849 reviews, pulled
    //   2026-10-18), grouped by product. The feed marks each review
    //   "rewarded" (the reviewer got a reward) and "verified buyer"; the
    //   shares are stated on each card.
    // - Regulation: openFDA (only the suppository is listed: NDC 83385-001,
    //   "unapproved homeopathic") and FDA's homeopathic products page.
    // - Safety: NIH NCCIH pages (goldenseal, tea tree oil, cranberry,
    //   probiotics).
    // - Studies: abstracts read via NCBI E-utilities; each card states the
    //   design and size, and that none tested a Momotaro product.
    // The brand's claims about yeast infections, BV and UTIs stay "the brand
    // says", never stated as fact.
    {
        id: 'p-momotaro-salve',
        name: 'Momotaro Apotheca Soothe & Restore Salve',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'comfort', 'organic', 'hormone-free', 'cruelty-free', 'external-only'],
        price: '$37 (30 mL)',
        userRating: 4.9,
        userRatingSourceUrl: 'https://momotaroapotheca.com/products/salve',
        whereToBuy: ['momotaroapotheca.com'],
        url: 'https://momotaroapotheca.com/products/salve',
        affiliateUrl: 'https://collabs.shop/kydydp', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://momotaroapotheca.com/pages/faq',
        image: '/products/momotaro/salve.webp',
        summary: 'Momotaro Apotheca was started in Portland, Oregon by Lindsay Wynn and Taylor Samuelsen. Wynn, a former beauty photographer, says she started making her own products after years of recurring yeast infections and BV, when drugstore options either didn\'t work or made things worse. The Salve is a certified organic balm for the vulva with a coconut and jojoba base, plus goldenseal, Oregon grape, echinacea, calendula and tea tree. The brand says it comforts dryness, itching and irritation, including irritation that comes with yeast infections and BV, and calms friction from sex, sweat and tight clothing. Free of alcohol, parabens, phthalates, silicone, sulfates and synthetic fragrance.',
        safety: {
            fdaStatus: 'Sold as a topical cosmetic: the brand\'s FAQ says its products are cosmetics, not medicine. It does not appear in FDA\'s drug listings under Momotaro Apotheca (checked on openFDA 2026-10-17).',
            materials: '30 mL (1 oz) jar. Ingredients: organic coconut oil, organic kokum butter, organic beeswax, organic jojoba, organic tea tree, organic goldenseal, organic echinacea, organic calendula, organic Oregon grape. Certified organic (the brand says its suppliers are Oregon Tilth certified) and cruelty-free.',
            recalls: 'No recalls found.',
            sideEffects: 'Tea tree oil can cause redness or irritation in some people, per NIH, and a few reviewers on the brand\'s site say it burned or irritated their skin. Contains goldenseal, which NIH says people who are pregnant or breastfeeding should not use. Full warnings are listed below.',
            opinionAlerts: 'The brand markets the salve for yeast infections, BV and UTIs, and calls it "doctor recommended" without naming a doctor. Those are its own claims; momotaroapotheca.com cites no study of this product. About 4 in 10 of its on-site reviews were left in exchange for a reward.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of NIH (NCCIH) safety information and peer-reviewed studies of the ingredients. Not a direct clinician quote; none of the studies tested this product.',
        doctorOpinion: 'A plant-oil balm can be a gentle way to protect dry, chafed or irritated vulvar skin. Coconut and jojoba oils are both used in dermatology for their moisturizing and skin-barrier effects.\n\nThe brand\'s bigger claim is that goldenseal and Oregon grape, both sources of berberine, "target bacteria and yeast at the source". In lab studies, berberine slows Candida growth and stops it from sticking to vaginal cells, and tea tree oil and coconut oil also kill Candida in a dish. Calendula has the only human trials: in an Iranian trial of 150 women with yeast infections, a calendula vaginal cream cleared fewer infections than clotrimazole at 10 to 15 days (49% vs. 74%) but more at 30 to 35 days (77% vs. 34%). Those were lab studies or creams made for vaginal use, not this salve, which is for the outside only.\n\nTwo ingredient notes from NIH: tea tree oil can cause redness or irritation in some people, and people who are pregnant or breastfeeding should not use goldenseal.\n\nItching, burning or unusual discharge can come from a yeast infection, BV or an STI, and each needs a different treatment. If symptoms are new, keep coming back, or don\'t clear up, see a clinician for a diagnosis.',
        doctorOpinionShort: 'A plant-oil balm for dry, irritated vulvar skin. Its antifungal ingredients work in lab studies and calendula has small vaginal trials, but none tested this salve. Tea tree can irritate, and NIH says to avoid goldenseal in pregnancy and breastfeeding.',
        doctorOpinionCitations: [
            { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH (NCCIH): Tea Tree Oil' },
            { url: 'https://www.nccih.nih.gov/health/goldenseal', label: 'NIH (NCCIH): Goldenseal' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', label: 'PubMed (NIH): Calendula vs. clotrimazole vaginal cream for yeast infection, randomized trial, n=150 (Women Health, 2017)' },
        ],
        // From the "Organic support for" list on momotaroapotheca.com.
        whoItsFor: [
            'Vulvar dryness, itching, irritation or burning',
            'Chafing and sensitivity from sex, tight clothing, sweat or exercise',
            'Comfort alongside treatment for yeast infections or BV, per the brand',
            'Post-shave irritation and ingrown hairs, per customer reviews',
            'Not the pick if you are pregnant or breastfeeding (it contains goldenseal), or if tea tree oil irritates your skin',
        ],
        howToUse: {
            intro: 'Per Momotaro Apotheca\'s own directions:',
            steps: [
                'With clean hands, apply a pea-sized amount around the vulva or affected area.',
                'Use as needed, for everyday support or during flare-ups. The brand says it is safe for daily use.',
                'The brand recommends use over 60 to 90 days for best results.',
                'External use only. The brand\'s Vaginal Suppository is its internal option.',
            ],
            sourceUrl: 'https://momotaroapotheca.com/products/salve',
            sourceLabel: 'momotaroapotheca.com: Soothe & Restore Salve',
        },
        warnings: [
            'For external use only. Avoid contact with eyes.',
            'Stop using it if irritation occurs. Contains tea tree oil, which can irritate some people.',
            'Pregnant, breastfeeding, or under medical care: talk to your provider first. NIH says not to use goldenseal while pregnant or breastfeeding.',
            'If symptoms persist or worsen, see a healthcare professional.',
            'Keep out of reach of children.',
        ],
        communityReview: 'Rated 4.93 out of 5 from 507 reviews on the brand\'s own site (483 five-star, 9 three-star or lower). 39% of those reviews were left in exchange for a reward; 89% are from verified buyers. Many reviewers describe years of recurring yeast infections or BV and say the salve calms flare-ups: "I use almost daily, and this seems to have decrease the frequency with which I develop any sort of infection. Best for post-coitus." Others use it after shaving: "It\'s perfect for preventing irritation and ingrown hairs post shave!" The critical reviews mostly come back to the tea tree: "The tea tree in it was burning and I did not like it," "Irritated my skin terrible," and one long-time customer who said a newer batch smelled different. One three-star reviewer wrote that it soothed but "has not stopped my regular yeast infections."',
        effectiveness: 'No study of this product is cited on momotaroapotheca.com. Its key ingredients show antifungal activity in lab studies (berberine, tea tree oil, coconut oil), and calendula vaginal cream has small randomized trials against standard yeast and BV treatments. None of that research used this salve or tested a balm applied only to the outside.',
        ingredients: 'Organic coconut oil, kokum butter, beeswax, jojoba, tea tree, goldenseal, echinacea, calendula, Oregon grape.',
        ingredientScienceNote: 'These are the ingredients Momotaro Apotheca highlights. The studies show what each ingredient can do, mostly in lab dishes, not that this salve works.',
        ingredientScience: [
            {
                name: 'Goldenseal and Oregon grape (berberine)',
                text: 'Both plants contain berberine. In lab studies, berberine slowed the growth of several Candida species, including drug-resistant ones, broke down their biofilms, and kept Candida albicans from sticking to vaginal cells. These were cell and lab studies, not trials in people. NIH says people who are pregnant or breastfeeding should not use goldenseal.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6957002/', label: 'NIH (PMC): Berberine against Candida in planktonic and biofilm conditions, lab study (Drug Des Devel Ther, 2020)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/35295335/', label: 'PubMed (NIH): Berberine inhibits Candida adhesion to vaginal epithelial cells, cell study (Front Pharmacol, 2022)' },
                    { url: 'https://www.nccih.nih.gov/health/goldenseal', label: 'NIH (NCCIH): Goldenseal' },
                ],
            },
            {
                name: 'Calendula',
                text: 'In a triple-blind Iranian trial of 150 women with yeast infections, a calendula vaginal cream used for 7 nights cleared fewer infections than clotrimazole at the first check (49% vs. 74%) but more by 30 to 35 days (77% vs. 34%). In a separate trial of 80 women with BV, symptoms cleared in everyone in both the calendula and metronidazole groups. Both trials used creams inserted in the vagina, not an external balm.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', label: 'PubMed (NIH): Calendula vs. clotrimazole for vaginal candidiasis, randomized trial, n=150 (Women Health, 2017)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/29441319/', label: 'PubMed (NIH): Calendula vs. metronidazole for BV, randomized trial, n=80 (J Adv Pharm Technol Res, 2018)' },
                ],
            },
            {
                name: 'Tea tree oil',
                text: 'In lab tests on more than 100 Candida samples, tea tree oil stopped 90% of them from growing at a 0.25% concentration. NIH says tea tree oil on the skin is usually fine but can cause redness or irritation, especially if the product is old or has been exposed to heat, light or air, and that it should never be swallowed.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/9848442/', label: 'PubMed (NIH): Tea tree oil against Candida, lab study (J Antimicrob Chemother, 1998)' },
                    { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH (NCCIH): Tea Tree Oil' },
                ],
            },
            {
                name: 'Coconut and jojoba oils',
                text: 'A review of plant oils used on skin describes coconut and jojoba oils as moisturizing and skin-barrier supporting, with anti-inflammatory effects. In a lab study of 52 Candida samples, virgin coconut oil killed every Candida albicans sample, though at much higher concentrations than the drug fluconazole.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-inflammatory and skin barrier repair effects of topical plant oils, review (Int J Mol Sci, 2017)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/17651080/', label: 'PubMed (NIH): Coconut oil against Candida species, lab study (J Med Food, 2007)' },
                ],
            },
        ],
        scientificCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', text: 'Calendula vs. clotrimazole for vaginal candidiasis (Women Health, 2017)', summary: 'Triple-blind randomized trial in 150 women: calendula vaginal cream was slower than clotrimazole but more women were clear of infection at 30 to 35 days. Tests a vaginal cream, not this salve.' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6957002/', text: 'Berberine against Candida (Drug Des Devel Ther, 2020)', summary: 'Lab study showing berberine slows Candida growth and biofilms. Not a human study.' },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', text: 'Calendula vs. clotrimazole, randomized trial (2017)', summary: 'Iranian trial of 150 women with vaginal yeast infections; vaginal cream, not this salve.' },
                    { url: 'https://www.nccih.nih.gov/health/goldenseal', text: 'NIH (NCCIH): Goldenseal', summary: 'Safety: not for use while pregnant or breastfeeding.' },
                ],
            },
            community: {
                links: [
                    { platform: 'website', url: 'https://momotaroapotheca.com/products/salve', text: 'momotaroapotheca.com: Soothe & Restore Salve', summary: 'The brand\'s product page, with ingredients, directions, warnings and 500+ customer reviews (about 4 in 10 rewarded).' },
                    { platform: 'website', url: 'https://momotaroapotheca.com/pages/about', text: 'momotaroapotheca.com: About', summary: 'Founder Lindsay Wynn\'s story and the brand\'s organic sourcing.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/@momotaroapotheca', text: 'TikTok: @momotaroapotheca', summary: 'The brand\'s own TikTok account (brand content, not independent reviews).' },
                ],
            },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-daily-probiotic',
        name: 'Momotaro Apotheca Daily Probiotic',
        brand: 'Momotaro Apotheca',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'supplement'],
        tags: ['supplement', 'vegan', 'cruelty-free'],
        price: '$49 (30 capsules)',
        userRating: 5.0,
        userRatingSourceUrl: 'https://momotaroapotheca.com/products/probiotic',
        whereToBuy: ['momotaroapotheca.com'],
        url: 'https://momotaroapotheca.com/products/probiotic',
        affiliateUrl: 'https://collabs.shop/vgem4q', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://momotaroapotheca.com/pages/faq',
        image: '/products/momotaro/daily-probiotic.webp',
        summary: 'A once-a-day probiotic from Momotaro Apotheca, the Portland vulvovaginal care brand started by Lindsay Wynn after her own years of recurring yeast infections and BV. Each capsule has 25 billion cultures from 10 strains of Lactobacillus and Bifidobacterium, including L. crispatus, L. gasseri, L. rhamnosus and L. reuteri, in an acid- and bile-resistant capsule. The brand says it supports the gut, the immune system and the vaginal microbiome, and recommends at least 90 days of daily use. Vegan, shelf-stable, and free of gluten, soy and preservatives. 30 capsules, a one-month supply.',
        safety: {
            fdaStatus: 'Sold as a dietary supplement. The label says its statements have not been evaluated by the FDA and that it is not intended to diagnose, treat, cure, or prevent any disease.',
            materials: '30 capsules. Strains: Lactobacillus acidophilus, L. plantarum, L. reuteri, L. crispatus, Bifidobacterium lactis, L. gasseri, L. paracasei, L. rhamnosus, L. brevis, B. longum. Other ingredients: microcrystalline cellulose, vegetable cellulose (capsule), silica. Strain codes and the amount of each strain aren\'t listed.',
            recalls: 'No recalls found.',
            sideEffects: 'Intended for adults. Talk to your provider before use if pregnant, breastfeeding, or taking medication, per the brand. Full warnings are listed below.',
            opinionAlerts: 'The brand says its strains are "clinically proven" for vaginal and gut health and help protect against BV, UTIs and yeast infections. No study of this blend is cited, and the label doesn\'t give strain codes, so it can\'t be matched to published trials. 61% of its on-site reviews were left in exchange for a reward.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of NIH (NCCIH) information on probiotics and peer-reviewed trials of related strains. Not a direct clinician quote; none of the studies tested this product.',
        doctorOpinion: 'This probiotic includes Lactobacillus crispatus, L. gasseri and other strains found in a healthy vagina, which is the idea behind the brand\'s claims. There is some real research behind oral lactobacilli: in a placebo-controlled trial of 166 women just treated for BV, a daily capsule of L. crispatus, L. brevis and L. acidophilus cut BV recurrence over 4 months (18% vs. 32%). A Cochrane review found probiotics added to antifungal treatment helped short-term cure of yeast infections, but the evidence was low quality and the benefit didn\'t last at later checks.\n\nThe catch, as NIH notes, is that probiotic effects depend on the exact strain. Those trials used specific, named strains; this label doesn\'t give strain codes, and no study of this blend is cited. A probiotic is also not a treatment for an active infection. If you have symptoms of BV, a yeast infection or a UTI, see a clinician for a diagnosis.',
        doctorOpinionShort: 'Some oral lactobacillus blends cut BV recurrence in trials, but effects depend on the exact strain, and this label doesn\'t name strain codes or cite a study of the blend. Not a treatment for an active infection.',
        doctorOpinionCitations: [
            { url: 'https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know', label: 'NIH (NCCIH): Probiotics, what you need to know' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/32091443/', label: 'PubMed (NIH): Oral lactobacilli and BV recurrence, randomized placebo-controlled trial, n=166 (J Low Genit Tract Dis, 2020)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29168557/', label: 'Cochrane (2017): Probiotics for vulvovaginal candidiasis in non-pregnant women' },
        ],
        whoItsFor: [
            'Adults who want a daily probiotic aimed at both gut and vaginal health',
            'People with recurring BV or yeast infections who want to try a probiotic alongside their clinician\'s plan',
            'People who prefer a vegan, shelf-stable capsule',
            'Not a treatment for an active infection: see a clinician if you have symptoms',
        ],
        howToUse: {
            intro: 'Per Momotaro Apotheca\'s own directions:',
            steps: [
                'Take one capsule a day with a meal, or within 30 minutes of eating.',
                'Take it at about the same time each day; the brand says consistency matters more than timing.',
                'The brand says to use it for at least 90 days to notice most benefits.',
            ],
            sourceUrl: 'https://momotaroapotheca.com/products/probiotic',
            sourceLabel: 'momotaroapotheca.com: Daily Probiotic',
        },
        warnings: [
            'Intended for adults. Keep out of reach of children.',
            'Pregnant, breastfeeding, or taking medication: talk to your provider before use.',
            'A probiotic doesn\'t treat an active infection. See a clinician for symptoms of BV, a yeast infection or a UTI.',
            'Swallow only. The brand\'s FAQ says the probiotic is to be taken by mouth.',
        ],
        communityReview: 'Rated 4.96 out of 5 from 46 reviews on the brand\'s own site (44 five-star, 2 four-star, none lower). 61% of those reviews were left in exchange for a reward; 91% are from verified buyers. Reviewers with recurring BV report fewer flare-ups: "I\'m on my second month of this probiotic after having BV in December. So far no recurrence of the BV. It helps keep me regular as well." Another wrote, "For the past two years I\'ve alternated between a yeast infection or BV every other month... since taking this I have had neither!" There are no critical reviews to quote; the lowest, at four stars, called it "one of the better probiotics I have tried."',
        effectiveness: 'No study of this blend is cited on momotaroapotheca.com. Related research: a 166-woman trial of a different oral lactobacillus blend cut BV recurrence after antibiotics (18% vs. 32%), and a Cochrane review rated the evidence for probiotics in yeast infections as low quality. Effects are strain-specific, per NIH.',
        ingredients: '25 billion cultures: L. acidophilus, L. plantarum, L. reuteri, L. crispatus, B. lactis, L. gasseri, L. paracasei, L. rhamnosus, L. brevis, B. longum.',
        ingredientScienceNote: 'These studies used specific, named strains. This label lists species but not strain codes, so the results show what similar probiotics can do, not that this one works.',
        ingredientScience: [
            {
                name: 'Lactobacillus crispatus, L. brevis and L. acidophilus',
                text: 'In a placebo-controlled trial at 7 centers, 166 women who had just been treated for BV took a capsule of these three species (specific strains) daily for 4 months. BV came back in 18% of them vs. 32% on placebo. In a smaller Estonian trial, oral L. crispatus capsules (other strains) also reduced BV and yeast infection symptoms over 3 months.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/32091443/', label: 'PubMed (NIH): Oral lactobacilli and BV recurrence, randomized trial, n=166 (J Low Genit Tract Dis, 2020)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/36856121/', label: 'PubMed (NIH): Oral and vaginal L. crispatus for BV and yeast infections, randomized trial (Benef Microbes, 2023)' },
                ],
            },
            {
                name: 'Probiotics for yeast infections',
                text: 'A Cochrane review of 10 trials (1,656 women) found that probiotics added to antifungal medicine raised short-term cure rates and cut relapse at one month, but the evidence was low to very low quality and the benefit didn\'t hold at later follow-ups. Every trial used probiotics alongside antifungals, not on their own.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/29168557/', label: 'Cochrane (2017): Probiotics for vulvovaginal candidiasis in non-pregnant women' },
                ],
            },
            {
                name: 'Why the strain matters',
                text: 'NIH notes that different probiotics can have different effects: if one kind of Lactobacillus helps, that doesn\'t mean another kind, or a Bifidobacterium, will do the same.',
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know', label: 'NIH (NCCIH): Probiotics, what you need to know' },
                ],
            },
        ],
        scientificCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/32091443/', text: 'Oral lactobacilli and BV recurrence (J Low Genit Tract Dis, 2020)', summary: 'Placebo-controlled trial in 166 women after BV treatment: recurrence 18% vs. 32% over 4 months. Different strains from this product.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29168557/', text: 'Probiotics for vulvovaginal candidiasis (Cochrane, 2017)', summary: 'Low-quality evidence of short-term benefit when added to antifungals; no lasting benefit shown.' },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/32091443/', text: 'Oral lactobacilli and BV recurrence, randomized trial (2020)', summary: '166 women; different strains from this product.' },
                    { url: 'https://www.nccih.nih.gov/health/probiotics-what-you-need-to-know', text: 'NIH (NCCIH): Probiotics', summary: 'Effects depend on the specific strain.' },
                ],
            },
            community: {
                links: [
                    { platform: 'website', url: 'https://momotaroapotheca.com/products/probiotic', text: 'momotaroapotheca.com: Daily Probiotic', summary: 'The brand\'s product page, with the strain list, directions, label statements and its customer reviews (61% rewarded).' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/@momotaroapotheca', text: 'TikTok: @momotaroapotheca', summary: 'The brand\'s own TikTok account (brand content, not independent reviews).' },
                ],
            },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-urinary-tract-supplement',
        name: 'Momotaro Apotheca Urinary Tract & Pelvic Health Super Supplement',
        brand: 'Momotaro Apotheca',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['uti-prevention', 'supplement'],
        tags: ['uti', 'supplement', 'vegan', 'organic'],
        price: '$35 (60 capsules)',
        userRating: 4.9,
        userRatingSourceUrl: 'https://momotaroapotheca.com/products/the-uti-supplement',
        whereToBuy: ['momotaroapotheca.com'],
        url: 'https://momotaroapotheca.com/products/the-uti-supplement',
        affiliateUrl: 'https://collabs.shop/4zbsop', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://momotaroapotheca.com/pages/faq',
        image: '/products/momotaro/urinary-tract-supplement.webp',
        summary: 'A plant-based capsule from Momotaro Apotheca, the Portland vulvovaginal care brand started by Lindsay Wynn. It combines D-mannose, a cranberry fruit concentrate (12:1, 3,000 mg per the brand), Oregon grape root, uva ursi (bearberry leaf) and marshmallow root, made with certified organic ingredients. The brand designed it for times of urinary discomfort and says it supports UTIs, recurring bladder discomfort, interstitial cystitis, BV and yeast imbalance. It is meant for short stretches, not continuous long-term use. 60 vegan capsules.',
        safety: {
            fdaStatus: 'Sold as a dietary supplement. The brand says its statements have not been evaluated by the FDA and that it is not intended to diagnose, treat, cure, or prevent any disease.',
            materials: '60 vegetarian capsules. Ingredients: D-mannose, cranberry fruit (Vaccinium macrocarpon), Oregon grape (Mahonia aquifolium), bearberry (Arctostaphylos uva-ursi), marshmallow root (Althaea officinalis), brown rice flour, rice hulls, vegetarian capsule. Per-capsule amounts other than the cranberry figure aren\'t listed on the product page.',
            recalls: 'No recalls found.',
            sideEffects: 'The brand says it is meant for times of urinary discomfort, not continuous long-term use, because of the uva ursi. Cranberry may interact with the blood thinner warfarin, per NIH. Full warnings are listed below.',
            opinionAlerts: 'The brand says it "supports UTIs" and is "effective for both acute and recurrent symptoms." NIH says cranberry may help prevent repeat UTIs in some women but is not a treatment for an existing UTI, and a large 2024 trial found D-mannose didn\'t prevent repeat UTIs. Only 37% of its on-site reviews are marked as verified buyers, and many recent ones are just a few words long.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of NIH (NCCIH) information and peer-reviewed trials of the ingredients. Not a direct clinician quote; none of the studies tested this product.',
        doctorOpinion: 'The main ingredients have been tested on their own, with mixed results. Cranberry has the best evidence: a 2023 Cochrane review of 50 trials found cranberry products probably lower the risk of repeat UTIs in women who get them (about 26% fewer). NIH stresses that cranberry is not a treatment for an existing UTI.\n\nD-mannose looked promising in small early trials, but a large 2024 placebo-controlled trial of 598 women with recurring UTIs found 2 grams a day for 6 months didn\'t reduce UTIs, and the authors said it shouldn\'t be recommended for prevention. Uva ursi was tested as a UTI treatment in a German trial of 398 women: it cut antibiotic use but symptoms were worse and lasted longer than with an antibiotic, and more women developed kidney infections (8 vs. 2). The brand itself says uva ursi is for short-term use. Oregon grape is a source of berberine, and NIH warns that berberine (in goldenseal) can be harmful to newborns.\n\nAn untreated UTI can spread to the kidneys. Burning when you pee with fever, back or side pain, or blood in your urine needs medical care right away, not a supplement.',
        doctorOpinionShort: 'Cranberry probably lowers repeat UTIs in women who get them, but doesn\'t treat an existing one. A large trial found D-mannose didn\'t prevent UTIs, and uva ursi did worse than an antibiotic as a treatment. Short-term use only.',
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', label: 'Cochrane (2023): Cranberries for preventing urinary tract infections, 50 trials' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/', label: 'PubMed (NIH): D-mannose for recurrent UTI, randomized placebo-controlled trial, n=598 (JAMA Intern Med, 2024)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/34111592/', label: 'PubMed (NIH): Uva ursi vs. fosfomycin for uncomplicated UTI, randomized trial, n=398 (Clin Microbiol Infect, 2021)' },
            { url: 'https://www.nccih.nih.gov/health/cranberry', label: 'NIH (NCCIH): Cranberry' },
        ],
        whoItsFor: [
            'Adults with repeat UTIs who want a cranberry-based supplement alongside their clinician\'s plan',
            'Short stretches of urinary discomfort, per the brand',
            'Not a replacement for antibiotics if you have a UTI: see a provider for diagnosis and treatment',
            'Not for long-term daily use, per the brand, because it contains uva ursi',
            'Ask a provider first if you are pregnant, breastfeeding, or take warfarin',
        ],
        howToUse: {
            intro: 'Per Momotaro Apotheca\'s own directions:',
            steps: [
                'For acute discomfort, take "up to 8x with a large glass of water 2-3 times a day," as the brand puts it, or as directed by your healthcare practitioner.',
                'Use it during times of urinary discomfort, not continuously over a long period.',
                'If symptoms keep coming back, the brand recommends talking to a healthcare provider.',
            ],
            sourceUrl: 'https://momotaroapotheca.com/products/the-uti-supplement',
            sourceLabel: 'momotaroapotheca.com: Urinary Tract & Pelvic Health Super Supplement',
        },
        warnings: [
            'Not a treatment for an existing UTI. Fever, back or side pain, or blood in your urine need medical care right away.',
            'Designed for short-term use, not continuous long-term use (it contains uva ursi), per the brand.',
            'Taking warfarin or other medicines: ask your provider first; NIH notes cranberry may interact with warfarin.',
            'Pregnant or breastfeeding: ask your provider first. NIH warns berberine, found in Oregon grape, can be harmful to newborns.',
            'Intended for adults. Keep out of reach of children.',
        ],
        communityReview: 'Rated 4.94 out of 5 from 68 reviews on the brand\'s own site (64 five-star, 4 four-star). Read these with care: only 37% are marked as verified buyers, 32% were rewarded, and many from 2024 and 2025 are just a few words ("plant magic," "steady and real"). Earlier, longer reviews describe catching UTIs early: "I started to get a tingly feeling a couple days ago, so i took two of these with lots of water and it was gone!" One reviewer with UTIs every few months wrote that she went almost 5 months without one. Another said her doctor kept finding no UTI behind her symptoms, and the supplement helped.',
        effectiveness: 'No study of this blend is cited on momotaroapotheca.com. Ingredient by ingredient: cranberry probably lowers repeat UTIs in women who get them (Cochrane, 2023); D-mannose didn\'t prevent repeat UTIs in a 598-woman trial (2024); uva ursi did worse than an antibiotic as a UTI treatment in a 398-woman trial (2021).',
        ingredients: 'D-mannose, cranberry fruit concentrate, Oregon grape root, uva ursi (bearberry leaf), marshmallow root.',
        ingredientScienceNote: 'These studies tested single ingredients, mostly at set doses. This product\'s per-capsule amounts aren\'t listed (except cranberry), so the results show what each ingredient can do, not what this blend does.',
        ingredientScience: [
            {
                name: 'Cranberry',
                text: 'A 2023 Cochrane review of 50 trials (8,857 people) found cranberry products probably reduce symptomatic, culture-confirmed UTIs in women with recurring UTIs (risk ratio 0.74), in children, and after procedures that raise UTI risk, but showed little or no benefit in elderly people in care homes or in pregnancy. NIH says cranberry shouldn\'t be used instead of a proven treatment for a UTI.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', label: 'Cochrane (2023): Cranberries for preventing urinary tract infections' },
                    { url: 'https://www.nccih.nih.gov/health/cranberry', label: 'NIH (NCCIH): Cranberry' },
                ],
            },
            {
                name: 'D-mannose',
                text: 'In a double-blind trial across 99 UK primary care practices, 598 women with recurring UTIs took 2 grams of D-mannose or placebo daily for 6 months. 51% on D-mannose vs. 56% on placebo had another UTI, not a real difference, and the authors concluded it should not be recommended for prevention.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/', label: 'PubMed (NIH): D-mannose for recurrent UTI, randomized placebo-controlled trial, n=598 (JAMA Intern Med, 2024)' },
                ],
            },
            {
                name: 'Uva ursi (bearberry)',
                text: 'In a double-blind German trial, 398 women with uncomplicated UTIs got uva ursi or the antibiotic fosfomycin. Uva ursi cut antibiotic use by 64%, but symptoms were heavier and 8 women developed kidney infections vs. 2 on the antibiotic. The authors concluded uva ursi led to more symptoms and more safety concerns.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/34111592/', label: 'PubMed (NIH): Uva ursi vs. fosfomycin, randomized trial, n=398 (Clin Microbiol Infect, 2021)' },
                ],
            },
            {
                name: 'Oregon grape (berberine)',
                text: 'Oregon grape is a source of berberine, per the brand. Berberine slows Candida in lab studies, but there are no human UTI trials of it cited here. NIH warns that berberine (in goldenseal) can be harmful to newborns.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6957002/', label: 'NIH (PMC): Berberine against Candida, lab study (Drug Des Devel Ther, 2020)' },
                    { url: 'https://www.nccih.nih.gov/health/goldenseal', label: 'NIH (NCCIH): Goldenseal (berberine and newborns)' },
                ],
            },
        ],
        scientificCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', text: 'Cranberries for preventing UTIs (Cochrane, 2023)', summary: '50 trials: cranberry probably lowers repeat UTIs in women who get them; not a treatment.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/', text: 'D-mannose for recurrent UTI (JAMA Intern Med, 2024)', summary: 'Placebo-controlled trial of 598 women: no reduction in UTIs.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/34111592/', text: 'Uva ursi vs. fosfomycin (Clin Microbiol Infect, 2021)', summary: '398 women: fewer antibiotics but more symptoms and more kidney infections than with the antibiotic.' },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', text: 'Cochrane (2023): Cranberries for preventing UTIs', summary: 'The strongest evidence for any ingredient in this blend.' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/', text: 'D-mannose trial (2024)', summary: 'No benefit for preventing repeat UTIs.' },
                    { url: 'https://www.nccih.nih.gov/health/cranberry', text: 'NIH (NCCIH): Cranberry', summary: 'Prevention only, not treatment; possible warfarin interaction.' },
                ],
            },
            community: {
                links: [
                    { platform: 'website', url: 'https://momotaroapotheca.com/products/the-uti-supplement', text: 'momotaroapotheca.com: Urinary Tract & Pelvic Health Super Supplement', summary: 'The brand\'s product page, with ingredients, directions, its uva ursi note and customer reviews (37% verified buyers).' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/@momotaroapotheca', text: 'TikTok: @momotaroapotheca', summary: 'The brand\'s own TikTok account (brand content, not independent reviews).' },
                ],
            },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-vaginal-suppository',
        name: 'Momotaro Apotheca Vaginal Suppository',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: ['vaginal-health'],
        tags: ['discomfort', 'organic', 'hormone-free', 'cruelty-free'],
        price: '$48 (14 suppositories)',
        userRating: 4.9,
        userRatingSourceUrl: 'https://momotaroapotheca.com/products/the-suppository',
        whereToBuy: ['momotaroapotheca.com'],
        url: 'https://momotaroapotheca.com/products/the-suppository',
        affiliateUrl: 'https://collabs.shop/tso57q', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://momotaroapotheca.com/pages/homeopathic-medicine',
        image: '/products/momotaro/vaginal-suppository.webp',
        summary: 'A homeopathic vaginal suppository that Momotaro Apotheca, the Portland brand started by Lindsay Wynn after her own recurring yeast infections and BV, says it developed over three years. The brand markets it for yeast infections, BV and vaginal irritation and calls it "a natural alternative to antibiotics and antifungals." The homeopathic actives are echinacea, wood creosote (beechwood) and northern white cedar (thuja) at 12X dilution, in a base of cocoa butter, coconut oil, beeswax and jojoba with Oregon grape, calendula and tea tree. 14 suppositories, 2 mL each. The brand suggests storing it somewhere cool, like the fridge.',
        safety: {
            fdaStatus: 'Listed with the FDA as an unapproved homeopathic over-the-counter drug (NDC 83385-001; active ingredients Echinacea purpurea, wood creosote and Thuja occidentalis, each at 12X). FDA says homeopathic products sold in the US have not been reviewed by the FDA for safety or effectiveness.',
            materials: '14 suppositories, 2 mL each. Ingredients: organic beechwood (Kreosotum), organic beeswax, organic calendula, organic cocoa butter, organic coconut oil, organic echinacea, organic jojoba oil, organic northern white cedar (Thuja occidentalis), organic Oregon grape, organic tea tree oil. Made without parabens, phthalates, silicone, sulfates or synthetic fragrance.',
            recalls: 'No recalls found.',
            sideEffects: 'Contains tea tree oil, which can cause redness or irritation in some people, per NIH. A reviewer notes it can leak and recommends wearing a pantyliner. The product page lists no warnings; read the carton. Full warnings are listed below.',
            opinionAlerts: 'FDA warns that people may use unapproved homeopathic drugs instead of proven treatments, which can delay care that works. The brand\'s own FAQ says its products are "for external use only" and "topical cosmetics", which doesn\'t match this product, a vaginal suppository listed with the FDA as a drug; ayna reads that FAQ as out of date. 71% of its on-site reviews were left in exchange for a reward.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of FDA guidance on homeopathic products, NIH (NCCIH) information on tea tree oil, and peer-reviewed studies of the base ingredients. Not a direct clinician quote; none of the studies tested this product.',
        doctorOpinion: 'This is a homeopathic drug. FDA lists it as unapproved, and FDA says homeopathic products have not been reviewed for safety or effectiveness. At 12X, the homeopathic actives are diluted a trillion-fold. FDA also warns that using an unapproved homeopathic product instead of a proven treatment can delay care that works.\n\nThe base has more going on than the homeopathic part. Calendula vaginal cream has small trials: in 150 Iranian women with yeast infections, it cleared fewer infections than clotrimazole at 10 to 15 days but more at 30 to 35 days, and in 80 women with BV, symptoms cleared in both the calendula and metronidazole groups. Berberine (from Oregon grape) and tea tree oil slow Candida in lab studies. None of this was tested in this suppository.\n\nYeast infections and BV have similar symptoms but need different treatments, and proven over-the-counter and prescription options exist for both. If this is your first infection, symptoms keep coming back, or they don\'t clear up within a week, see a clinician for a diagnosis. One reviewer found her problem "wasn\'t yeast or BV" at all.',
        doctorOpinionShort: 'An FDA-listed but unapproved homeopathic drug; FDA hasn\'t reviewed homeopathic products for safety or effectiveness. Its calendula base has small vaginal trials, but nothing tested this product. Don\'t let it delay a diagnosis or a proven treatment.',
        doctorOpinionCitations: [
            { url: 'https://www.fda.gov/drugs/information-drug-class/homeopathic-products', label: 'FDA: Homeopathic Products' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', label: 'PubMed (NIH): Calendula vs. clotrimazole vaginal cream, randomized trial, n=150 (Women Health, 2017)' },
            { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH (NCCIH): Tea Tree Oil' },
        ],
        whoItsFor: [
            'People with a diagnosed yeast infection who want a plant-based, hormone-free option and have talked it through with a clinician',
            'People who react badly to standard antifungal creams, per several reviewers',
            'Not the pick for a first-time or recurring infection without a diagnosis: yeast infections and BV need different, proven treatments',
            'Pregnant or breastfeeding: talk to your provider first',
        ],
        howToUse: {
            intro: 'Per Momotaro Apotheca\'s own directions:',
            steps: [
                'For acute issues, insert one vaginally twice a day for 5 to 7 days until symptoms clear.',
                'It can also be used as needed for discomfort.',
                'The brand suggests pairing it with its Salve for the outside.',
                'Store somewhere cool and dry, like the refrigerator; the natural ingredients can separate.',
            ],
            sourceUrl: 'https://momotaroapotheca.com/products/the-suppository',
            sourceLabel: 'momotaroapotheca.com: Vaginal Suppository',
        },
        warnings: [
            'A homeopathic product the FDA has not reviewed for safety or effectiveness. Don\'t use it instead of a proven treatment.',
            'First infection, symptoms that come back, or symptoms that don\'t clear in a week: see a clinician.',
            'Fever, pelvic pain, or unusual discharge with a bad smell: see a clinician.',
            'Pregnant or breastfeeding: talk to your provider before using any vaginal product.',
            'Contains tea tree oil: stop using it if irritation occurs. NIH says tea tree oil must never be swallowed.',
        ],
        communityReview: 'Rated 4.94 out of 5 from 31 reviews on the brand\'s own site (29 five-star, 2 four-star). 71% of those reviews were left in exchange for a reward; 90% are from verified buyers. Reviewers with chronic yeast infections describe fast relief: "I get chronic yeast infections and this is the ONLY thing that helps them." Several say they can\'t use standard creams: "I can\'t use Monistat. This saved me. Feels like a concentrated version of salve." One compared it to the drug miconazole and felt it "took a little more time to kick in." Practical notes: it can leak (wear a liner), and a 4-star reviewer said it didn\'t help because "my issue wasn\'t yeast or BV," a reminder to get a diagnosis first.',
        effectiveness: 'No study of this product is cited on momotaroapotheca.com, and FDA has not reviewed it for safety or effectiveness. Its calendula base has small randomized vaginal trials, and berberine and tea tree oil are antifungal in lab studies; none of that research tested this suppository.',
        ingredients: 'Homeopathic actives (12X): Echinacea purpurea, wood creosote (beechwood), Thuja occidentalis. Base: cocoa butter, coconut oil, beeswax, jojoba, Oregon grape, calendula, tea tree.',
        ingredientScienceNote: 'Homeopathic actives at 12X are diluted a trillion-fold, so the studies below are about the base ingredients. They show what those ingredients can do, not that this suppository works.',
        ingredientScience: [
            {
                name: 'Homeopathic actives (echinacea, wood creosote, thuja at 12X)',
                text: 'FDA says homeopathic products have not been reviewed for safety or effectiveness, and warns that relying on them instead of FDA-approved treatment can delay care that works.',
                citations: [
                    { url: 'https://www.fda.gov/drugs/information-drug-class/homeopathic-products', label: 'FDA: Homeopathic Products' },
                ],
            },
            {
                name: 'Calendula',
                text: 'In a triple-blind trial of 150 women with yeast infections, calendula vaginal cream used for 7 nights was slower than clotrimazole (49% vs. 74% clear at 10 to 15 days) but more women were clear at 30 to 35 days (77% vs. 34%). In 80 women with BV, symptoms cleared in everyone in both the calendula and metronidazole groups. Both were small trials of creams, not this suppository.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', label: 'PubMed (NIH): Calendula vs. clotrimazole for vaginal candidiasis, randomized trial, n=150 (Women Health, 2017)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/29441319/', label: 'PubMed (NIH): Calendula vs. metronidazole for BV, randomized trial, n=80 (J Adv Pharm Technol Res, 2018)' },
                ],
            },
            {
                name: 'Oregon grape (berberine) and tea tree oil',
                text: 'In lab studies, berberine slowed Candida growth and kept it from sticking to vaginal cells, and tea tree oil stopped 90% of Candida samples from growing at a 0.25% concentration. These are lab results, not trials in people. NIH notes tea tree oil can irritate and must never be swallowed.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/35295335/', label: 'PubMed (NIH): Berberine inhibits Candida adhesion to vaginal epithelial cells, cell study (Front Pharmacol, 2022)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/9848442/', label: 'PubMed (NIH): Tea tree oil against Candida, lab study (J Antimicrob Chemother, 1998)' },
                ],
            },
        ],
        scientificCitations: [
            { url: 'https://www.fda.gov/drugs/information-drug-class/homeopathic-products', text: 'FDA: Homeopathic Products', summary: 'Homeopathic products have not been reviewed by FDA for safety or effectiveness.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', text: 'Calendula vs. clotrimazole for vaginal candidiasis (Women Health, 2017)', summary: 'Randomized trial in 150 women; a calendula cream, not this suppository.' },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://www.fda.gov/drugs/information-drug-class/homeopathic-products', text: 'FDA: Homeopathic Products', summary: 'Why homeopathic products are not FDA-reviewed, and the risk of delaying proven treatment.' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27880086/', text: 'Calendula vs. clotrimazole trial (2017)', summary: '150 women with vaginal yeast infections.' },
                ],
            },
            community: {
                links: [
                    { platform: 'website', url: 'https://momotaroapotheca.com/products/the-suppository', text: 'momotaroapotheca.com: Vaginal Suppository', summary: 'The brand\'s product page, with ingredients, directions and customer reviews (71% rewarded).' },
                    { platform: 'website', url: 'https://momotaroapotheca.com/pages/homeopathic-medicine', text: 'momotaroapotheca.com: Homeopathic Medicine', summary: 'The brand\'s explanation of why it made a homeopathic formula.' },
                ],
            },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-hydrosol-toner',
        name: 'Momotaro Apotheca Organic Hydrosol Toner',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'skin-hair'],
        tags: ['comfort', 'organic', 'vegan', 'cruelty-free', 'external-only'],
        price: '$56 (100 mL)',
        userRating: 4.9,
        userRatingSourceUrl: 'https://momotaroapotheca.com/products/hydrosol',
        whereToBuy: ['momotaroapotheca.com'],
        url: 'https://momotaroapotheca.com/products/hydrosol',
        affiliateUrl: 'https://collabs.shop/762eiq', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://momotaroapotheca.com/blogs/vaginal-wellness/hydrosol-what-is-it-how-do-i-use-it',
        image: '/products/momotaro/hydrosol-toner.webp',
        summary: 'An alcohol-free micromist from Momotaro Apotheca, the Portland vulvovaginal care brand started by Lindsay Wynn. It is made from steam-distilled organic orange blossom, rose, rosemary and lavender waters, which the brand explains are far more diluted, and so gentler, than essential oils. Momotaro Apotheca says it soothes irritation, neutralizes odor and hydrates the face, body and external pelvic area, for use after a shower, workout, period or sex. Customers also use it as a face toner and on body breakouts. Certified organic, vegan and cruelty-free; 100 mL, per the label shown on the brand\'s site.',
        safety: {
            fdaStatus: 'Sold as a cosmetic body mist: the brand\'s FAQ says its products are topical cosmetics, not medicine. It does not appear in FDA\'s drug listings under Momotaro Apotheca (checked on openFDA 2026-10-17).',
            materials: 'Ingredients: organic orange blossom (Citrus aurantium amara), organic rose water (Rosa damascena), organic rosemary distillate, organic lavender distillate, glyceryl caprylate, glyceryl undecylenate (both derived from coconut and castor). No alcohol, parabens, phthalates, silicone, sulfates or synthetic fragrance.',
            recalls: 'No recalls found.',
            sideEffects: 'One reviewer said it burned when sprayed directly on already-irritated skin. The brand says not to spray it on broken skin and to patch test new products. Full warnings are listed below.',
            opinionAlerts: 'Claims about calming inflammation and odor-causing bacteria are the brand\'s own; momotaroapotheca.com cites no study of this product. 44% of its on-site reviews were left in exchange for a reward.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of the brand\'s own information and a review of rose (Rosa damascena) research. Not a direct clinician quote; no study tested this product.',
        doctorOpinion: 'A water-based floral mist for external skin, including the outer pelvic area, with no alcohol or synthetic fragrance, per the brand. Floral waters are very dilute, which the brand points to as the reason they are gentler than essential oils. A review of rose (Rosa damascena) research describes antibacterial and antioxidant effects in lab studies, but there are no studies of this mist, so its odor and irritation claims are the brand\'s own.\n\nA change in vaginal odor, especially a fishy smell or with unusual discharge, can be a sign of BV or another infection. A mist won\'t treat that; see a clinician.',
        doctorOpinionShort: 'An alcohol-free floral mist for external skin. Rose extracts show antibacterial effects in lab studies, but its odor and irritation claims are the brand\'s own; a new odor with discharge needs a clinician, not a spray.',
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3586833/', label: 'NIH (PMC): Pharmacological effects of Rosa damascena, review (Iran J Basic Med Sci, 2011)' },
            { url: 'https://momotaroapotheca.com/blogs/vaginal-wellness/hydrosol-what-is-it-how-do-i-use-it', label: 'momotaroapotheca.com: What is a hydrosol (the brand\'s explanation)' },
        ],
        whoItsFor: [
            'People who want a refreshing, alcohol-free mist after showering, exercise, a period or sex',
            'Skin folds and areas prone to sweat, chafing, ingrown hairs or breakouts, per the brand and reviewers',
            'People who avoid synthetic fragrance: it has none, per the brand, only light floral waters',
            'For external use: not for inside the vagina',
        ],
        howToUse: {
            intro: 'Per Momotaro Apotheca\'s own directions:',
            steps: [
                'Hold a few inches from clean skin and mist the face, body or external pelvic area.',
                'Spray into skin folds and areas prone to sweat or irritation. Don\'t spray on broken skin.',
                'Let it air dry. Use daily or as needed, after a shower, workout, period or sex.',
            ],
            sourceUrl: 'https://momotaroapotheca.com/products/hydrosol',
            sourceLabel: 'momotaroapotheca.com: Organic Hydrosol Toner',
        },
        warnings: [
            'For external use only. Don\'t spray on broken skin.',
            'Patch test first, per the brand. Stop using it if irritation occurs.',
            'A new vaginal odor with unusual discharge can mean an infection: see a clinician.',
        ],
        communityReview: 'Rated 4.85 out of 5 from 34 reviews on the brand\'s own site (30 five-star, 1 three-star). 44% of those reviews were left in exchange for a reward; 91% are from verified buyers. Reviewers use it after the gym and sex ("This has been a godsend after I get sweaty... I stop worrying about my smell"), and many have found other uses: as a face toner, on armpits, and on butt breakouts and folliculitis. The critical notes: one bottle\'s plastic sprayer arrived broken, and one reviewer said it burned when sprayed directly on irritated skin, though she still found it useful sprayed on underwear.',
        effectiveness: 'No study of this product is cited on momotaroapotheca.com. Rose extracts show antibacterial and antioxidant effects in lab studies; that doesn\'t show this mist reduces odor or irritation.',
        ingredients: 'Organic orange blossom, rose, rosemary and lavender distillates; glyceryl caprylate and glyceryl undecylenate.',
        ingredientScienceNote: 'These are the ingredients Momotaro Apotheca highlights. The research is on the plants, mostly in lab studies, not on this mist.',
        ingredientScience: [
            {
                name: 'Rose water (Rosa damascena)',
                text: 'A review of Rosa damascena research describes antibacterial, antioxidant and anti-inflammatory effects, mostly from lab and animal studies. It doesn\'t include trials of rose water on vulvar skin.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3586833/', label: 'NIH (PMC): Pharmacological effects of Rosa damascena, review (Iran J Basic Med Sci, 2011)' },
                ],
            },
            {
                name: 'Hydrosols vs. essential oils',
                text: 'The brand explains that hydrosols are the water left from steam-distilling plants, holding only trace amounts of the plants\' compounds, which is why they are gentler than essential oils. It still recommends a patch test on the inner forearm before using a new product on sensitive skin.',
                citations: [
                    { url: 'https://momotaroapotheca.com/blogs/vaginal-wellness/hydrosol-what-is-it-how-do-i-use-it', label: 'momotaroapotheca.com: What is a hydrosol' },
                ],
            },
        ],
        scientificCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3586833/', text: 'Pharmacological effects of Rosa damascena (Iran J Basic Med Sci, 2011)', summary: 'Review of mostly lab and animal research on rose; not a study of this product.' },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3586833/', text: 'Rosa damascena review (2011)', summary: 'Lab and animal research on rose extracts.' },
                ],
            },
            community: {
                links: [
                    { platform: 'website', url: 'https://momotaroapotheca.com/products/hydrosol', text: 'momotaroapotheca.com: Organic Hydrosol Toner', summary: 'The brand\'s product page, with ingredients, directions and customer reviews (44% rewarded).' },
                    { platform: 'website', url: 'https://momotaroapotheca.com/blogs/vaginal-wellness/hydrosol-what-is-it-how-do-i-use-it', text: 'momotaroapotheca.com: What is a hydrosol', summary: 'The brand\'s guide to what it is and six ways to use it.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/@momotaroapotheca', text: 'TikTok: @momotaroapotheca', summary: 'The brand\'s own TikTok account (brand content, not independent reviews).' },
                ],
            },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-bath-body-tonic',
        name: 'Momotaro Apotheca Nourishing Bath & Body Tonic',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'skin-hair'],
        tags: ['comfort', 'organic', 'vegan', 'cruelty-free', 'external-only'],
        price: '$48 (55 mL)',
        userRating: 4.9,
        userRatingSourceUrl: 'https://momotaroapotheca.com/products/tonic',
        whereToBuy: ['momotaroapotheca.com'],
        url: 'https://momotaroapotheca.com/products/tonic',
        affiliateUrl: 'https://collabs.shop/ilr3bp', // ayna affiliate link (2026-10-18)
        faqUrl: 'https://momotaroapotheca.com/blogs/vaginal-wellness/8-ways-to-use-our-tonic-for-oil-your-needs',
        image: '/products/momotaro/bath-body-tonic.webp',
        summary: 'A jojoba-oil concentrate from Momotaro Apotheca, the Portland vulvovaginal care brand started by Lindsay Wynn. It has six ingredients: jojoba oil, tea tree, cedarwood and sweet orange essential oils, and infusions of goldenseal and Oregon grape, both sources of berberine. Momotaro Apotheca says to add it to a warm bath or use it as a spot treatment for irritation, ingrown hairs and razor burn, and markets it for discomfort from yeast and bacterial infections. Not for internal use. Certified organic and vegan; 55 mL (1.9 fl oz).',
        safety: {
            fdaStatus: 'Sold as a bath and body oil (a topical cosmetic, per the brand\'s FAQ). It does not appear in FDA\'s drug listings under Momotaro Apotheca (checked on openFDA 2026-10-17).',
            materials: '55 mL (1.9 fl oz). Ingredients: organic jojoba oil, organic tea tree essential oil, cedarwood Virginia (Juniperus virginiana) essential oil, organic sweet orange essential oil, infusion of goldenseal leaf, Oregon grape. No alcohol, fragrance or fillers; the oils can separate, so shake before use.',
            recalls: 'No recalls found.',
            sideEffects: 'Tea tree oil can cause redness or irritation in some people, and should never be swallowed, per NIH. Contains goldenseal, which NIH says people who are pregnant or breastfeeding should not use. Full warnings are listed below.',
            opinionAlerts: 'The brand markets it as a spot treatment for discomfort from yeast and bacterial infections and calls it antimicrobial and antifungal. Those are its own claims; momotaroapotheca.com cites no study of this product. 43% of its on-site reviews were left in exchange for a reward.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of NIH (NCCIH) safety information and peer-reviewed studies of the ingredients. Not a direct clinician quote; none of the studies tested this product.',
        doctorOpinion: 'A jojoba-based oil for the bath or for spot use on skin, including after shaving. Jojoba is used in dermatology for its moisturizing and skin-barrier effects. The brand says its goldenseal and Oregon grape help with yeast and bacterial infections; berberine and tea tree oil do slow Candida in lab studies, but nothing tested this oil, and a few drops in a bath is very diluted.\n\nNIH notes that tea tree oil can irritate skin and should never be swallowed, and that people who are pregnant or breastfeeding should not use goldenseal. The brand itself says it is not for internal use and to avoid broken skin and mucous membranes. One reviewer developed cysts after using it post-shave, so try a small area first.',
        doctorOpinionShort: 'A jojoba bath and spot oil. Its antifungal ingredients work in lab studies but nothing tested this product. Tea tree can irritate, NIH says to avoid goldenseal in pregnancy and breastfeeding, and it\'s not for internal use.',
        doctorOpinionCitations: [
            { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH (NCCIH): Tea Tree Oil' },
            { url: 'https://www.nccih.nih.gov/health/goldenseal', label: 'NIH (NCCIH): Goldenseal' },
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Topical plant oils for skin barrier repair, review (Int J Mol Sci, 2017)' },
        ],
        whoItsFor: [
            'People who want an organic bath oil that is alcohol-, fragrance- and filler-free, per the brand',
            'Spot care for ingrown hairs, razor burn and post-shave bumps, per the brand and reviewers',
            'A body oil for dry skin after the shower',
            'Not the pick if you are pregnant or breastfeeding (it contains goldenseal), or if tea tree oil irritates your skin',
        ],
        howToUse: {
            intro: 'Per Momotaro Apotheca\'s own directions:',
            steps: [
                'Add 5 to 10 droppers-full to a clean, warm bath and soak.',
                'Or apply as a spot treatment for blemishes or ingrown hairs, or as a pre-, during- or post-shave oil.',
                'Shake gently before use; the oils can separate naturally.',
                'Not for internal use. Avoid broken skin and mucous membranes.',
            ],
            sourceUrl: 'https://momotaroapotheca.com/products/tonic',
            sourceLabel: 'momotaroapotheca.com: Nourishing Bath & Body Tonic',
        },
        warnings: [
            'For external use only. Not for internal use; avoid broken skin and mucous membranes.',
            'Avoid contact with eyes. Stop using it if irritation occurs.',
            'Never swallow: it contains tea tree oil.',
            'Pregnant, breastfeeding, or under medical care: talk to your provider first. NIH says not to use goldenseal while pregnant or breastfeeding.',
            'Keep out of reach of children.',
        ],
        communityReview: 'Rated 4.90 out of 5 from 58 reviews on the brand\'s own site (52 five-star, 6 four-star). 43% of those reviews were left in exchange for a reward; 90% are from verified buyers. Reviewers use it most after shaving and in the bath: "This makes my skin feel so silky! Amazing for post shave soothing!" and "I use this after every shower and I swear it helps keep chronic BV and yeast infections at bay." One credits it, with the salve, for easing her vulvodynia. Critical notes: several dislike the smell, one said a bottle goes fast at the recommended dose, and one developed "3 large cysts" after using it post-shave.',
        effectiveness: 'No study of this product is cited on momotaroapotheca.com. Berberine (from goldenseal and Oregon grape) and tea tree oil are antifungal in lab studies, and jojoba is a well-tolerated skin oil; none of that research tested this tonic.',
        ingredients: 'Organic jojoba oil, tea tree, cedarwood and sweet orange essential oils, goldenseal leaf infusion, Oregon grape.',
        ingredientScienceNote: 'These are the ingredients Momotaro Apotheca highlights. The studies show what each ingredient can do, mostly in lab dishes, not that this tonic works.',
        ingredientScience: [
            {
                name: 'Goldenseal and Oregon grape (berberine)',
                text: 'In lab studies, berberine slowed the growth of several Candida species, including drug-resistant ones, and broke down their biofilms. These were lab studies, not trials in people. NIH says people who are pregnant or breastfeeding should not use goldenseal.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6957002/', label: 'NIH (PMC): Berberine against Candida, lab study (Drug Des Devel Ther, 2020)' },
                    { url: 'https://www.nccih.nih.gov/health/goldenseal', label: 'NIH (NCCIH): Goldenseal' },
                ],
            },
            {
                name: 'Tea tree oil',
                text: 'Tea tree oil stopped 90% of Candida samples from growing at a 0.25% concentration in lab tests. NIH says a small amount of evidence suggests it may help acne and athlete\'s foot, that it can cause redness or irritation, and that it should never be swallowed.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/9848442/', label: 'PubMed (NIH): Tea tree oil against Candida, lab study (J Antimicrob Chemother, 1998)' },
                    { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', label: 'NIH (NCCIH): Tea Tree Oil' },
                ],
            },
            {
                name: 'Jojoba oil',
                text: 'A review of plant oils used on skin includes jojoba among the oils with anti-inflammatory and skin-barrier repair effects, which is why it is a common base for skin oils.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', label: 'NIH (PMC): Anti-inflammatory and skin barrier repair effects of topical plant oils, review (Int J Mol Sci, 2017)' },
                ],
            },
        ],
        scientificCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/', text: 'Topical plant oils and the skin barrier (Int J Mol Sci, 2017)', summary: 'Review including jojoba oil; not a study of this product.' },
            { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', text: 'NIH (NCCIH): Tea Tree Oil', summary: 'Evidence and safety for tea tree oil on skin.' },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://www.nccih.nih.gov/health/tea-tree-oil', text: 'NIH (NCCIH): Tea Tree Oil', summary: 'Can irritate; never swallow.' },
                    { url: 'https://www.nccih.nih.gov/health/goldenseal', text: 'NIH (NCCIH): Goldenseal', summary: 'Not for use while pregnant or breastfeeding.' },
                ],
            },
            community: {
                links: [
                    { platform: 'website', url: 'https://momotaroapotheca.com/products/tonic', text: 'momotaroapotheca.com: Nourishing Bath & Body Tonic', summary: 'The brand\'s product page, with ingredients, directions, warnings and customer reviews (43% rewarded).' },
                    { platform: 'website', url: 'https://momotaroapotheca.com/blogs/vaginal-wellness/8-ways-to-use-our-tonic-for-oil-your-needs', text: 'momotaroapotheca.com: 8 ways to use the Tonic', summary: 'The brand\'s guide to bath, shave and spot uses.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/@momotaroapotheca', text: 'TikTok: @momotaroapotheca', summary: 'The brand\'s own TikTok account (brand content, not independent reviews).' },
                ],
            },
        },
        isEmergingBrand: true,
    },
    // Alubri Moisture Renewal Kit (added 2026-10-18 at Eliz's request, with
    // her photo). Facts from alubri.com/products/moisture-renewal-kit; study
    // results are the brand's own, as on the full-size Gel and Balm entries.
    {
        id: 'p-alubri-moisture-renewal-kit',
        name: 'Alubri Moisture Renewal Kit',
        brand: 'Alubri',
        category: 'intimate-care',
        type: 'physical',
        internal: true,
        healthFunctions: [
            'vaginal-health',
        ],
        tags: [
            'discomfort',
            'comfort',
            'menopause',
            'hormone-free',
        ],
        price: '$19.99 (30 mL gel with 4 applicators + 15 g balm)',
        whereToBuy: [
            'alubri.com',
        ],
        url: 'https://alubri.com/products/moisture-renewal-kit',
        affiliateUrl: 'https://collabs.shop/f4isvs',
        faqUrl: 'https://alubri.com/pages/faq',
        image: '/products/alubri/moisture-renewal-kit.webp',
        summary: 'A two-week trial kit of Alubri\'s two dryness products: a 30 mL Vaginal Moisturizing Gel with 4 single-use applicators for inside, and a 15 g Vulva Balm for outside. Alubri says the gel gives up to 72 hours of hydration and balances the vaginal microbiome, and the balm relieves and prevents external dryness. Both are hormone-free and fragrance-free, and the brand describes them as gynecologist- and dermatologist-tested. A smaller, lower-cost way to try both before buying full sizes.',
        safety: {
            fdaStatus: 'alubri.com presents both products as hormone-free personal-care moisturizers and does not describe either as an FDA-cleared device or drug.',
            materials: 'Kit: 30 mL (1 fl oz) Vaginal Moisturizing Gel with 4 applicators, and 15 g (0.5 oz) Vulva Balm. Gel ingredients: aqua (water), glucomannan, hydrolyzed Rosa canina (rosehip) fruit oil, hydrolyzed Cocos nucifera (coconut) oil, sodium hyaluronate, lactic acid, Hylocereus undatus (dragon fruit) fruit extract, Aloe barbadensis leaf juice, propanediol, xanthan gum, potassium sorbate, sodium benzoate, benzyl alcohol, benzoic acid. Balm ingredients: aqua (water), dimethicone, isododecane, caprylic/capric triglyceride, ozokerite, propanediol, sorbitan oleate, dimethicone crosspolymer, ceresin, hydrolyzed Rosa canina (rosehip) fruit oil, hydrolyzed Cocos nucifera (coconut) oil, sodium hyaluronate, palmitoyl hexapeptide-52, Hylocereus undatus (dragon fruit) fruit extract, Tasmannia lanceolata (Tasmanian pepperberry) fruit extract, Avena sativa (oat) kernel extract, Camellia sinensis (green tea) leaf extract, Passiflora incarnata flower extract, tocopherol, alpha-glucan oligosaccharide, tocopheryl acetate, Lactobacillus ferment lysate, biosaccharide gum-4, adenosine, ethylhexylglycerin, phenoxyethanol, sodium chloride, benzyl alcohol, potassium sorbate, benzoic acid.',
            recalls: 'No recalls are mentioned on alubri.com; check current regulator and manufacturer recall notices.',
            sideEffects: 'Alubri says some women feel a mild warming or blushing sensation on first use, or brief stinging from the lactic acid, that usually fades within minutes. If discomfort persists, stop and see a doctor. Full warnings are listed below.',
            opinionAlerts: 'The clinical figures (72-hour hydration, microbiome changes, vulvar pH) come from studies Alubri describes on its own site for the full-size products; the full studies aren\'t published there.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced only from Alubri\'s own site (alubri.com), not independent clinical literature. The kit contains the same two products as the full-size Gel and Balm.',
        doctorOpinion: 'This kit is trial sizes of two products already on ayna, so the same evidence applies. For the gel, Alubri cites an independent, third-party study of 51 menopausal women who used it twice a week for a month: one application raised vaginal hydration by 64% at 72 hours, and 94% said they felt moisturized. For the balm, Alubri reports that vulvar pH in menopausal women dropped from 6.3 to 6.0 in its own 2-week study of 50 women. Both were developed with Dr. Nicole Kerner, Alubri\'s co-founder and Chief Medical Officer, a board-certified, menopause-certified OB-GYN. These are brand-reported results; the full studies aren\'t published on alubri.com.\n\nThe 4 gel applicators cover about two weeks at the brand\'s twice-a-week schedule, which is enough to tell whether the gel suits you before buying the full size.',
        doctorOpinionShort: 'Trial sizes of Alubri\'s gel and balm. Brand-reported studies: the gel raised vaginal hydration 64% at 72 hours in 51 menopausal women. About two weeks of use.',
        doctorOpinionCitations: [
            {
                url: 'https://alubri.com/products/moisture-renewal-kit',
                label: 'alubri.com: Moisture Renewal Kit',
            },
            {
                url: 'https://alubri.com/pages/science',
                label: 'alubri.com: Science (study results)',
            },
        ],
        whoItsFor: [
            'Vaginal and vulvar dryness from perimenopause, menopause, postpartum or breastfeeding',
            'Anyone who wants to try Alubri\'s internal gel and external balm before buying full sizes',
            'People who want hormone-free, fragrance-free options',
        ],
        howToUse: {
            intro: 'Per Alubri\'s own directions:',
            steps: [
                'Gel: attach a single-use applicator to the tube and squeeze to fill it to 3 grams.',
                'Insert the applicator into the vagina, push to release the gel, then remove and throw the applicator away.',
                'Lie flat for about 10 minutes so the gel absorbs. Use twice a week, ideally at bedtime, or as needed.',
                'Balm: apply over the vulva (clitoris, labia and vaginal opening) daily or as needed, for example after grooming.',
            ],
            sourceUrl: 'https://alubri.com/products/moisture-renewal-kit',
            sourceLabel: 'alubri.com: Moisture Renewal Kit',
        },
        warnings: [
            'A mild warming or blushing feeling on first use is normal per Alubri. If discomfort persists, stop and see a doctor.',
            'Alubri says a slight increase in discharge is normal at first and should ease within a few uses.',
            'Itching or irritation that persists despite a moisturizer can be a sign of infection. See a doctor.',
            'Not tested for compatibility with condoms, per Alubri.',
            'The balm is for external use only.',
        ],
        communityReview: 'alubri.com shows no customer reviews for this kit. Reviews for the full-size products are on their Amazon listings (linked from the Vaginal Moisturizing Gel and Vulva Balm pages on ayna).',
        effectiveness: 'Same products as the full sizes: Alubri reports a 64% increase in vaginal hydration 72 hours after one gel application in its study of 51 menopausal women, and a vulvar pH drop with the balm in a 50-woman study. No independent study is cited on alubri.com.',
        ingredients: 'Gel: sodium hyaluronate (hyaluronic acid), lactic acid, Activated Oil Complex (hydrolyzed coconut and rosehip oils), aloe, glucomannan. Balm: sodium hyaluronate, a peptide, Activated Oil Complex, oat, green tea and dragon fruit extracts.',
        ingredientScienceNote: 'The same key ingredients as the full-size Gel and Balm. These studies show what each ingredient can do, not that this kit works.',
        ingredientScience: [
            {
                name: 'Coconut and rosehip oils (Activated Oil Complex)',
                text: 'Applied to dry skin twice a day for 2 weeks, virgin coconut oil improved hydration as well as mineral oil in a randomized, double-blind trial. An NIH-indexed review notes rosehip oil is rich in linoleic acid and antioxidants that may help calm skin inflammation. These studies used ordinary oils on skin, not Alubri\'s "pre-activated" blend, so the brand\'s microbiome claims aren\'t tested by them.',
                citations: [
                    {
                        url: 'https://pubmed.ncbi.nlm.nih.gov/15724344/',
                        label: 'PubMed (NIH): Virgin coconut oil vs. mineral oil for dry skin, randomized trial (Dermatitis, 2004)',
                    },
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/',
                        label: 'NIH (PMC): Anti-inflammatory and skin barrier effects of plant oils, incl. rosehip (Int J Mol Sci, 2017)',
                    },
                ],
            },
            {
                name: 'Lactic acid',
                text: 'In a healthy vagina dominated by Lactobacillus, those bacteria make lactic acid, which keeps vaginal pH low and may help protect against infection. A 2021 systematic review found there isn\'t yet high-quality evidence that lactic acid products cure bacterial vaginosis or shift the vaginal microbiome, so they\'re best seen as pH support.',
                citations: [
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3819307/',
                        label: 'NIH (PMC): Vaginal pH and lactic acid when lactobacilli dominate (PLoS One, 2013)',
                    },
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7877752/',
                        label: 'NIH (PMC): Lactic acid products for bacterial vaginosis, systematic review (PLoS One, 2021)',
                    },
                ],
            },
            {
                name: 'Sodium hyaluronate (hyaluronic acid)',
                text: 'Hyaluronic acid holds water in tissue. In a randomized trial of 144 postmenopausal women with vaginal dryness, a hyaluronic acid vaginal gel used every 3 days for 30 days improved dryness symptoms in 84% of women, about the same as estriol (estrogen) cream at 89%. That trial tested a different gel, so it supports the ingredient, not Alubri\'s product specifically.',
                citations: [
                    {
                        url: 'https://pubmed.ncbi.nlm.nih.gov/23574713/',
                        label: 'PubMed (NIH): Hyaluronic acid vaginal gel vs. estriol cream for vaginal dryness (J Sex Med, 2013)',
                    },
                ],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: {
                links: [],
            },
            scientific: {
                links: [],
            },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://alubri.com/products/moisture-renewal-kit',
                        text: 'alubri.com: Moisture Renewal Kit',
                        summary: 'The brand\'s kit page, with contents, ingredients and directions.',
                    },
                    {
                        platform: 'website',
                        url: 'https://alubri.com/pages/science',
                        text: 'alubri.com: Science',
                        summary: 'Where Alubri presents its study results for the gel and balm.',
                    },
                ],
            },
        },
        isEmergingBrand: true,
    },
    // Momotaro Apotheca additions (2026-10-18, Eliz's request). Body Oil is
    // shown (Eliz's photo; facts from momotaroapotheca.com/products/body-oil;
    // reviews from the brand's Junip feed). The rest are HIDDEN (not deleted):
    // kept with their affiliate links but not shown anywhere until asked.
    {
        id: 'p-momotaro-body-oil',
        name: 'Momotaro Apotheca Organic Body Oil',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        type: 'physical',
        internal: false,
        healthFunctions: [
            'skin-hair',
        ],
        tags: [
            'comfort',
            'organic',
            'vegan',
            'cruelty-free',
            'external-only',
        ],
        price: '$58 (177 mL / 6 oz)',
        userRating: 5,
        userRatingSourceUrl: 'https://momotaroapotheca.com/products/body-oil',
        whereToBuy: [
            'momotaroapotheca.com',
        ],
        url: 'https://momotaroapotheca.com/products/body-oil',
        affiliateUrl: 'https://collabs.shop/4fet6y',
        faqUrl: 'https://momotaroapotheca.com/pages/faq',
        image: '/products/momotaro/body-oil.webp',
        summary: 'A head-to-toe body oil from Momotaro Apotheca, the Portland brand started by Lindsay Wynn. It blends cold-pressed organic sunflower, sweet almond, argan and jojoba oils with sea buckthorn, and a light scent from sandalwood, black pepper and grapefruit essential oils. The brand says it hydrates, softens and supports the skin barrier, absorbs to a non-greasy finish, and can be used on the body, face, hair and scalp. Certified organic, vegan and cruelty-free; no alcohol, parabens, phthalates or synthetic fragrance. 177 mL (6 oz).',
        safety: {
            fdaStatus: 'Sold as a cosmetic body oil (the brand\'s FAQ says its products are cosmetics, not medicine). It does not appear in FDA\'s drug listings under Momotaro Apotheca (checked on openFDA 2026-10-17).',
            materials: '177 mL (6 oz). Ingredients: sunflower seed oil (Helianthus annuus), sweet almond (Prunus amygdalus dulcis), argan (Argania spinosa), jojoba seed (Simmondsia chinensis), black pepper essential oil (Piper nigrum), sandalwood (Santalum album), grapefruit peel (Citrus paradisi), sea buckthorn fruit oil (Hippophae rhamnoides). No alcohol, parabens, phthalates, silicone, sulfates or synthetic fragrance.',
            recalls: 'No recalls found.',
            sideEffects: 'Contains essential oils and sweet almond oil. The brand recommends patch testing new products on the inner forearm before using them on sensitive areas. Full warnings are listed below.',
            opinionAlerts: 'Claims about skin-barrier support and inflammation are the brand\'s own; momotaroapotheca.com cites no study of this product. 38% of its on-site reviews were left in exchange for a reward.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of a peer-reviewed review of plant oils used on skin. Not a direct clinician quote; no study tested this product.',
        doctorOpinion: 'A simple plant-oil moisturizer. Its base oils, sunflower, sweet almond, argan and jojoba, are all covered in a review of plant oils used on skin, which describes moisturizing, anti-inflammatory and skin-barrier repair effects for them. The brand says applying it to damp skin after a shower helps seal in hydration.\n\nUnlike Momotaro\'s Salve and Tonic, it has no tea tree, goldenseal or Oregon grape, so it is aimed at everyday dryness rather than infection-related irritation. It does contain essential oils for scent, so patch test first if your skin is sensitive. No study of this product was found.',
        doctorOpinionShort: 'A plant-oil body moisturizer with sunflower, almond, argan and jojoba, all oils with skin-barrier research behind them. No study of this product; it has essential oils for scent, so patch test first.',
        doctorOpinionCitations: [
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/',
                label: 'NIH (PMC): Anti-inflammatory and skin barrier repair effects of topical plant oils, review (Int J Mol Sci, 2017)',
            },
        ],
        whoItsFor: [
            'Dry skin anywhere on the body, used after a shower',
            'People who want a moisturizer with no synthetic fragrance or alcohol, per the brand',
            'Chafing, coarse hair and ingrown hairs, per the brand and reviewers',
            'Not for internal use',
        ],
        howToUse: {
            intro: 'Per Momotaro Apotheca\'s own directions:',
            steps: [
                'Apply generously to clean, damp skin after showering to lock in moisture.',
                'Massage in with broad, upward strokes.',
                'Use daily on the body, face, hair or scalp; smooth onto dry spots like hands and heels, or onto hair ends.',
                'Let it absorb for a few moments before dressing.',
            ],
            sourceUrl: 'https://momotaroapotheca.com/products/body-oil',
            sourceLabel: 'momotaroapotheca.com: Organic Body Oil',
        },
        warnings: [
            'For external use only.',
            'Patch test first, per the brand, especially if you have sensitive skin; it contains essential oils.',
            'Contains sweet almond oil.',
            'Stop using it if irritation occurs.',
        ],
        communityReview: 'Rated 4.97 out of 5 from 34 reviews on the brand\'s own site (33 five-star, 1 four-star). 38% of those reviews were left in exchange for a reward; 76% are from verified buyers. Reviewers like that it is light and not greasy: "Not greasy, can put clothes on or get in bed right after using." One switched to it after developing an allergy to standard body creams, and another said it worked on her winter eczema. Critical notes: one reviewer\'s bottle leaked, a few wished for a stronger or different scent, and one said it took a while to soak in.',
        effectiveness: 'No study of this product is cited on momotaroapotheca.com. Its base oils are described in research reviews as moisturizing and skin-barrier supporting.',
        ingredients: 'Organic sunflower, sweet almond, argan and jojoba oils; sea buckthorn fruit oil; sandalwood, black pepper and grapefruit essential oils.',
        ingredientScienceNote: 'These are the base oils Momotaro Apotheca highlights. The research is on the oils, not on this product.',
        ingredientScience: [
            {
                name: 'Sunflower, sweet almond, argan and jojoba oils',
                text: 'A review of plant oils used on skin covers all four, describing moisturizing, antioxidant, anti-inflammatory and skin-barrier repair effects. The review summarizes many smaller studies and doesn\'t test this blend.',
                citations: [
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/',
                        label: 'NIH (PMC): Anti-inflammatory and skin barrier repair effects of topical plant oils, review (Int J Mol Sci, 2017)',
                    },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/',
                text: 'Topical plant oils and the skin barrier (Int J Mol Sci, 2017)',
                summary: 'Review covering sunflower, almond, argan and jojoba oils; not a study of this product.',
            },
        ],
        verificationLinks: {
            doctor: {
                links: [],
            },
            scientific: {
                links: [
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5796020/',
                        text: 'Plant oils for skin review (2017)',
                        summary: 'Research behind the base oils.',
                    },
                ],
            },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://momotaroapotheca.com/products/body-oil',
                        text: 'momotaroapotheca.com: Organic Body Oil',
                        summary: 'The brand\'s product page, with ingredients, directions and customer reviews (38% rewarded).',
                    },
                    {
                        platform: 'tiktok',
                        url: 'https://www.tiktok.com/@momotaroapotheca',
                        text: 'TikTok: @momotaroapotheca',
                        summary: 'The brand\'s own TikTok account (brand content, not independent reviews).',
                    },
                ],
            },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-suppository-weekender',
        hidden: true,
        name: 'Momotaro Apotheca Suppository Weekender (sample pack)',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        internal: true,
        healthFunctions: [
            'vaginal-health',
        ],
        tags: [
            'organic',
        ],
        price: '$15 (sample pack)',
        url: 'https://momotaroapotheca.com/products/suppository-weekender-sample-pak',
        affiliateUrl: 'https://collabs.shop/obornf',
        image: 'https://cdn.shopify.com/s/files/1/1935/6703/files/weekender_1680x_4df539a4-6881-4ca4-800c-ae743046efce.webp?v=1685046173',
        summary: 'A sample pack of Momotaro Apotheca\'s homeopathic Vaginal Suppository (see the full Vaginal Suppository entry for ingredients, FDA status and evidence).',
        safety: {
            fdaStatus: 'Same product as the Vaginal Suppository: listed with the FDA as an unapproved homeopathic drug (NDC 83385-001, sold in 3-packet pouches as well as 14-count cartons).',
        },
        type: 'physical',
        whereToBuy: [
            'momotaroapotheca.com',
        ],
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-partner-preview-kit',
        hidden: true,
        name: 'Momotaro Apotheca Partner Preview Kit',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        healthFunctions: [
            'vaginal-health',
        ],
        tags: [
            'organic',
        ],
        price: '$158',
        url: 'https://momotaroapotheca.com/products/partner-preview-kit',
        affiliateUrl: 'https://collabs.shop/4df4sg',
        image: 'https://cdn.shopify.com/s/files/1/1935/6703/files/Dyspareunia.webp?v=1739905121',
        summary: 'A preview kit of Momotaro Apotheca products, which the brand pitches as a way to get to know the line. The product page doesn\'t list the kit\'s contents.',
        safety: {
            fdaStatus: 'momotaroapotheca.com doesn\'t list this kit\'s contents, so its regulatory status depends on what\'s inside (see the individual Momotaro entries).',
        },
        type: 'physical',
        internal: false,
        whereToBuy: [
            'momotaroapotheca.com',
        ],
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-bath-soak',
        hidden: true,
        name: 'Momotaro Apotheca Organic Botanical Bath Soak',
        brand: 'Momotaro Apotheca',
        category: 'intimate-care',
        healthFunctions: [
            'skin-hair',
        ],
        tags: [
            'organic',
            'external-only',
        ],
        price: '$28 (about 10 oz, roughly two soaks)',
        url: 'https://momotaroapotheca.com/products/organic-botanical-bath-soak',
        affiliateUrl: 'https://collabs.shop/fkbgym',
        image: 'https://cdn.shopify.com/s/files/1/1935/6703/files/bathsoakbagcopy.webp?v=1763748643',
        summary: 'A mineral and botanical bath soak that Momotaro Apotheca says eases irritation and calms skin. About 10 oz per bag, roughly two soaks, per the brand.',
        safety: {
            fdaStatus: 'Sold as a bath soak: the brand\'s FAQ says its products are topical cosmetics, not medicine.',
        },
        type: 'physical',
        internal: false,
        whereToBuy: [
            'momotaroapotheca.com',
        ],
        isEmergingBrand: true,
    },
    {
        id: 'p-momotaro-pill-case',
        hidden: true,
        name: 'Momotaro Apotheca Pill Case',
        brand: 'Momotaro Apotheca',
        category: 'supplement',
        healthFunctions: [
            'supplement',
        ],
        tags: [],
        price: '$15',
        url: 'https://momotaroapotheca.com/products/pill-case',
        affiliateUrl: 'https://collabs.shop/8fblaw',
        image: 'https://cdn.shopify.com/s/files/1/1935/6703/files/pillcase_white.png?v=1684246050',
        summary: 'A six-compartment slide-open pill case sized for Momotaro Apotheca\'s Probiotic and urinary supplement. BPA-free ABS and PP plastic, recyclable, hand wash only, per the brand.',
        safety: {
            fdaStatus: 'A storage case, not a health product.',
        },
        type: 'physical',
        internal: false,
        whereToBuy: [
            'momotaroapotheca.com',
        ],
        isEmergingBrand: true,
    },
    // Tampon Tribe additions (2026-10-18, Eliz's request). The two bulk buys
    // are shown (Eliz's photos; facts from their tampontribe.com pages; the
    // rest copied from the matching subscription entries). The pantyliner
    // subscription and sample are HIDDEN (not deleted); the menstrual cup is
    // shown (Eliz asked for it later the same day).
    {
        id: 'p-tampontribe-tampons-bulk-buy',
        name: 'Tampon Tribe Organic Tampons Bulk Buy',
        brand: 'Tampon Tribe',
        category: 'tampon',
        type: 'physical',
        internal: true,
        healthFunctions: [
            'menstrual-collection',
        ],
        tags: [
            'organic',
            'sustainability',
            'comfort',
            'heavy-flow',
        ],
        price: '$20 one-time purchase (28 Regular, 28 Super, 24 Super Plus, Day + Night 16 Regular + 12 Super Plus, or Mixed 16 Regular + 6 Super + 6 Super Plus)',
        whereToBuy: [
            'tampontribe.com',
        ],
        url: 'https://tampontribe.com/products/organic-tampons-bulk-buy',
        affiliateUrl: 'https://tidd.ly/481nNrK',
        image: '/products/tampon-tribe/tampons-bulk-buy.webp',
        summary: 'A one-time bulk bag of Tampon Tribe\'s certified organic cotton tampons: 24 to 28 per bag, in one absorbency or a mix, delivered in an up-cycled jute bag. Same tampons as the subscription: GOTS and ICEA certified organic cotton, a biodegradable cardboard "twist" applicator with a rounded tip, and a safety layer around the core that the brand says keeps fibers from being left behind. No plastic, viscose, perfume, superabsorbents or chlorine bleaching. No subscription needed.',
        safety: {
            fdaStatus: 'Tampons are regulated by the FDA as medical devices; tampontribe.com doesn’t list this product’s FDA clearance details. The manufacturer, Cohitech, is FDA-registered and certified to ISO 13485 (medical-device quality management).',
            materials: '100% organic cotton absorbent core and cover (certified organic under GOTS by ICEA) with an organic cotton safety veil around the core; biodegradable cardboard twist applicator with a rounded tip; paper wrapper. No superabsorbents, glue, rayon/viscose, perfume, or chlorine/dioxin bleaching.',
            recalls: 'No recalls are mentioned on tampontribe.com; check current FDA and manufacturer recall notices.',
            allergens: 'Hypoallergenic (independently dermatologist-tested, per manufacturer Cohitech), fragrance-free, dye-free, and vegan.',
            sideEffects: 'Toxic shock syndrome (TSS) is rare but serious with any tampon: use the lowest absorbency you need and never wear one longer than 8 hours. Full warnings are listed below.',
            opinionAlerts: 'Organic cotton avoids fragrance, dyes, and chlorine bleaching, but "100% cotton" isn’t automatically lower TSS risk: a 2018 lab study found cotton/rayon blend tampons grew less S. aureus than cotton-only ones. Absorbency and wear time matter most (FDA). Certification and testing: Tampon Tribe’s manufacturer, Cohitech (Spain), states its products are certified organic under GOTS by ICEA, and a June 2024 independent lab report (CALITEC LAB, Barcelona) found no pesticide residues, glyphosate, GMOs, formaldehyde, or detectable heavy metals in its organic cotton. Two limits: the lab tested a sample of raw organic cotton, not finished tampons, and neither Tampon Tribe nor Cohitech posts the GOTS certificate number, so the certification rests on Cohitech’s public statement plus that report; ayna will link the certificate once it’s provided. Separately, Tampon Tribe calls itself the only totally plastic-free U.S. period product; that’s a marketing claim the certifications don’t cover, and ayna couldn’t verify it.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of FDA and ACOG guidance and peer-reviewed research; not a direct clinician quote. Product details are from tampontribe.com.',
        doctorOpinion: 'Organic cotton with no fragrance, dyes, or chlorine bleaching is a reasonable choice for people with vulvar irritation or who want fewer additives. What the evidence doesn’t support is treating "100% organic cotton" as a TSS safety upgrade: FDA’s guidance focuses on using the lowest absorbency you need and changing every 4 to 8 hours, and a 2018 lab study actually found cotton/rayon blend tampons grew less Staphylococcus aureus than cotton-only ones.\n\nTampon Tribe’s cotton "safety veil" around the core is designed to keep fibers from shedding on removal, a concern with some cotton tampons. No independent study of Tampon Tribe tampons was found.',
        doctorOpinionShort: 'A plastic-free, organic cotton tampon with a cardboard applicator. Organic cotton cuts additives but isn’t a proven TSS-risk downgrade; FDA says to use the lowest absorbency and change every 4 to 8 hours. No study of this brand was found.',
        whoItsFor: [
            'People who want organic cotton tampons with no plastic, fragrance or dyes',
            'Anyone who prefers to buy in bulk once instead of a monthly subscription',
            'People who want a cardboard applicator instead of plastic',
        ],
        howToUse: {
            intro: 'Per Tampon Tribe’s directions and FDA tampon guidance:',
            steps: [
                'Unwrap the paper wrap.',
                'Twist the top part of the applicator in the opposite direction from the base.',
                'Push the base up slightly so the tip of the tampon shows, then insert.',
                'Choose the lowest absorbency that handles your flow, and change every 4 to 8 hours; never longer than 8 hours (FDA).',
            ],
            sourceUrl: 'https://tampontribe.com/products/organic-tampons-bulk-buy',
            sourceLabel: 'tampontribe.com: Organic Tampons Bulk Buy',
        },
        warnings: [
            'Toxic shock syndrome (TSS) is rare but serious. Remove the tampon and get emergency care for sudden high fever, vomiting, diarrhea, dizziness or fainting, or a sunburn-like rash during your period (FDA).',
            'Use only during your period, with the lowest absorbency you need.',
            'Not a form of contraception and does not protect against STIs.',
        ],
        communityReview: 'Reviews for these tampons are on the regular Organic Tampons listing: 4.6 out of 5 from 401 reviews on tampontribe.com (as of September 30, 2026).',
        effectiveness: 'Same tampons as the subscription, in Regular, Super and Super Plus. No independent lab comparison of Tampon Tribe tampons against other brands was found.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: {
                links: [],
            },
            scientific: {
                links: [
                    {
                        url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-tampon-safety',
                        text: 'FDA: Tampon Safety Facts',
                        summary: 'FDA advises using the lowest absorbency tampon you need, changing every 4 to 8 hours and never wearing one longer than 8 hours, and knowing the signs of toxic shock syndrome (sudden high fever, vomiting, diarrhea, fainting or dizziness, or a sunburn-like rash). FDA also notes cleared tampons are made of cotton, rayon, or blends, bleached without elemental chlorine. This is category guidance, not validation of a specific product.',
                    },
                    {
                        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5981080/',
                        text: 'Impact of currently marketed tampons and menstrual cups on S. aureus growth and TSST-1 production in vitro (Nonfoux et al., 2018)',
                        summary: 'In a lab study of 11 tampon types, tampons made of a cotton/rayon mix grew less Staphylococcus aureus than cotton-only tampons. It suggests "100% cotton" isn’t automatically lower TSS risk; absorbency and wear time matter more. Lab evidence, not a study of Tampon Tribe tampons.',
                    },
                    {
                        url: 'https://tampontribe.com/blogs/news/our-third-party-testing-and-certifications',
                        text: 'Tampon Tribe: Third-Party Testing and Certifications',
                        summary: 'Tampon Tribe’s testing page, linking its June 2024 independent lab analysis (CALITEC LAB, Barcelona) of its organic cotton: glyphosate and AMPA below 0.01 mg/kg, no multi-residue pesticides detected, GMO-negative, residual chlorine below 0.1 mg/L, formaldehyde below 0.01 mg/kg, and 9 heavy metals (including arsenic, lead, mercury, and cadmium) below detection limits. This tested a sample of raw organic cotton from manufacturer Cohitech, not finished products, and isn’t a clinical study.',
                    },
                    {
                        url: 'https://www.cohitech.net/en/',
                        text: 'Cohitech (Cotton High Tech): manufacturer certifications',
                        summary: 'Tampon Tribe’s manufacturer, the Spanish organic cotton producer named on its lab report. Cohitech states its products are certified organic under GOTS by ICEA and by Cotton Inc., that it is FDA-registered with ISO 13485/MDSAP medical-device quality certification, and that products are dermatologically tested by independent labs as hypoallergenic and non-irritating. Its site doesn’t post the GOTS certificate number.',
                    },
                ],
            },
            community: {
                links: [
                    {
                        url: 'https://tampontribe.com/products/organic-tampons-bulk-buy',
                        text: 'tampontribe.com: Organic Tampons Bulk Buy',
                        summary: 'The brand\'s bulk-buy page.',
                    },
                    {
                        url: 'https://tampontribe.com/products/tampons',
                        text: 'tampontribe.com: Organic Tampons reviews',
                        summary: 'The same tampons\' subscription listing: 4.6/5 from 401 reviews as of September 30, 2026.',
                    },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-tampontribe-pads-bulk-buy',
        name: 'Tampon Tribe Organic Pads Bulk Buy (20)',
        brand: 'Tampon Tribe',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: [
            'menstrual-collection',
        ],
        tags: [
            'organic',
            'sustainability',
            'comfort',
            'cost',
        ],
        price: '$20 for 20 pads (14 Day + 6 Night), one-time purchase',
        whereToBuy: [
            'tampontribe.com',
        ],
        url: 'https://tampontribe.com/products/organic-pads-bulk-buy',
        affiliateUrl: 'https://tidd.ly/4i2KEt3',
        image: '/products/tampon-tribe/pads-bulk-buy.webp',
        summary: 'A one-time bulk bag of 20 of Tampon Tribe\'s ultrathin certified organic cotton pads: 14 Day and 6 Night, in a jute bag. Each pad is individually wrapped in a starch film, not plastic, and uses a biodegradable polymer adhesive. No plastic, perfume, superabsorbents or chlorine bleaching. Same pads as the subscription, with no subscription needed.',
        safety: {
            fdaStatus: 'Menstrual pads are regulated by the FDA as medical devices; tampontribe.com doesn’t list this product’s FDA details. The manufacturer, Cohitech, is FDA-registered and certified to ISO 13485 (medical-device quality management).',
            materials: '100% organic cotton top layer and absorbent core (certified organic under GOTS by ICEA). No superabsorbent gel, perfume, dyes, or glue; plant-based backing with a vegan biopolymer adhesive. Vegan and hypoallergenic. Individually wrapped.',
            recalls: 'No recalls are mentioned on tampontribe.com; check current FDA and manufacturer recall notices.',
            allergens: 'Hypoallergenic (independently dermatologist-tested, per manufacturer Cohitech), fragrance-free, dye-free, and vegan.',
            sideEffects: 'None expected. Stop using if you notice irritation. Full notes are listed below.',
            opinionAlerts: 'Without superabsorbent gel, these rely on cotton alone, so they may need changing more often on heavy days. Certification and testing: Tampon Tribe’s manufacturer, Cohitech (Spain), states its products are certified organic under GOTS by ICEA, and a June 2024 independent lab report (CALITEC LAB, Barcelona) found no pesticide residues, glyphosate, GMOs, formaldehyde, or detectable heavy metals in its organic cotton. Two limits: the lab tested a sample of raw organic cotton, not finished pads, and neither Tampon Tribe nor Cohitech posts the GOTS certificate number, so the certification rests on Cohitech’s public statement plus that report; ayna will link the certificate once it’s provided. Separately, Tampon Tribe calls itself the only totally plastic-free U.S. period product; that’s a marketing claim the certifications don’t cover, and ayna couldn’t verify it.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of FDA and ACOG guidance and peer-reviewed research; not a direct clinician quote. Product details are from tampontribe.com.',
        doctorOpinion: 'Cotton pads without fragrance, dyes, or plastic top sheets are a sensible choice for people with vulvar irritation or sensitivity to synthetic materials. ACOG’s general advice applies: change a pad at least every 4 to 8 hours, or whenever it feels full or wet. Because they skip superabsorbent gel, they may need changing more often on heavy days. No independent study of these pads was found.',
        doctorOpinionShort: 'Organic cotton, plastic-free pads with wings. A reasonable pick for sensitive skin; change every 4 to 8 hours per ACOG. No study of this brand was found.',
        whoItsFor: [
            'People with vulvar irritation or sensitivity to plastic or synthetic pad materials',
            'Anyone who prefers to buy in bulk once instead of a monthly subscription',
            'A mix of day and overnight use',
        ],
        howToUse: {
            intro: 'Per ACOG’s general pad guidance:',
            steps: [
                'Peel off the backing and press the pad into your underwear, folding the wings around the edges.',
                'Change at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable.',
                'Wrap the used pad and put it in the trash. Tampon Tribe says the pads will biodegrade, but it doesn’t recommend flushing them.',
            ],
            sourceUrl: 'https://www.acog.org/womens-health/faqs/your-first-period',
            sourceLabel: 'ACOG: Your First Period',
        },
        warnings: [
            'Don’t flush; Tampon Tribe itself doesn’t recommend it.',
            'Stop using if you notice irritation or a rash.',
        ],
        communityReview: 'Reviews for these pads are on the regular Organic Pads listing: 4.8 out of 5 from 163 reviews on tampontribe.com (as of September 30, 2026).',
        effectiveness: 'Same pads as the subscription: Day pads hold up to 100 ml and Night pads up to 120 ml, per the brand. No independent comparison with other pads was found.',
        integrations: [],
        badges: [],
        verificationLinks: {
            doctor: {
                links: [],
            },
            scientific: {
                links: [
                    {
                        url: 'https://www.acog.org/womens-health/faqs/your-first-period',
                        text: 'ACOG: Your First Period',
                        summary: 'ACOG advises changing a pad at least every 4 to 8 hours, or whenever it feels full, wet, or uncomfortable, and explains how pads with wings stay in place. General guidance for any pad, not validation of a specific product.',
                    },
                    {
                        url: 'https://tampontribe.com/blogs/news/our-third-party-testing-and-certifications',
                        text: 'Tampon Tribe: Third-Party Testing and Certifications',
                        summary: 'Tampon Tribe’s testing page, linking its June 2024 independent lab analysis (CALITEC LAB, Barcelona) of its organic cotton: glyphosate and AMPA below 0.01 mg/kg, no multi-residue pesticides detected, GMO-negative, residual chlorine below 0.1 mg/L, formaldehyde below 0.01 mg/kg, and 9 heavy metals (including arsenic, lead, mercury, and cadmium) below detection limits. This tested a sample of raw organic cotton from manufacturer Cohitech, not finished products, and isn’t a clinical study.',
                    },
                    {
                        url: 'https://www.cohitech.net/en/',
                        text: 'Cohitech (Cotton High Tech): manufacturer certifications',
                        summary: 'Tampon Tribe’s manufacturer, the Spanish organic cotton producer named on its lab report. Cohitech states its products are certified organic under GOTS by ICEA and by Cotton Inc., that it is FDA-registered with ISO 13485/MDSAP medical-device quality certification, and that products are dermatologically tested by independent labs as hypoallergenic and non-irritating. Its site doesn’t post the GOTS certificate number.',
                    },
                ],
            },
            community: {
                links: [
                    {
                        url: 'https://tampontribe.com/products/organic-pads-bulk-buy',
                        text: 'tampontribe.com: Organic Pads Bulk Buy',
                        summary: 'The brand\'s bulk-buy page.',
                    },
                    {
                        url: 'https://tampontribe.com/products/pads',
                        text: 'tampontribe.com: Organic Pads reviews',
                        summary: 'The same pads\' subscription listing: 4.8/5 from 163 reviews as of September 30, 2026.',
                    },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-tampontribe-pantyliners-subscription',
        hidden: true,
        name: 'Tampon Tribe Organic Pantyliners (subscription)',
        brand: 'Tampon Tribe',
        category: 'pad',
        healthFunctions: [
            'menstrual-collection',
        ],
        tags: [
            'organic',
            'sustainability',
            'comfort',
        ],
        price: '$10.60 for 24 or $20 for 48, as a subscription',
        url: 'https://tampontribe.com/products/pantyliners',
        affiliateUrl: 'https://tidd.ly/4yYEiAX',
        image: 'https://cdn.shopify.com/s/files/1/0048/6971/8083/products/organic-pantyliners-4568288.jpg?v=1783121130',
        summary: 'The subscription version of Tampon Tribe\'s ultrathin certified organic cotton pantyliners (see the Pantyliners Bulk Buy entry). Pause, change or cancel anytime, with free U.S. delivery, per the brand.',
        safety: {
            fdaStatus: 'Pantyliners are regulated by the FDA as medical devices; tampontribe.com doesn\'t list this product\'s FDA details (see the Pantyliners Bulk Buy entry).',
        },
        type: 'physical',
        internal: false,
        whereToBuy: [
            'tampontribe.com',
        ],
        isEmergingBrand: false,
    },
    // Shown (Eliz, 2026-10-18), with the brand photo she picked.
    {
        id: 'p-tampontribe-menstrual-cup',
        name: 'Tampon Tribe Menstrual Cup',
        brand: 'Tampon Tribe',
        category: 'cup',
        type: 'physical',
        internal: true,
        healthFunctions: [
            'menstrual-collection',
        ],
        tags: [
            'sustainability',
            'cost',
            'comfort',
            'heavy-flow',
        ],
        price: '$39.99 (Medium or Large) or $69.99 for both sizes',
        whereToBuy: [
            'tampontribe.com',
        ],
        url: 'https://tampontribe.com/products/menstrual-cup',
        affiliateUrl: 'https://tidd.ly/4hViLDa',
        image: '/products/tampon-tribe/menstrual-cup.webp',
        summary: 'A reusable menstrual cup made of medical-grade TPE (thermoplastic elastomer) instead of silicone, with no latex, BPA or phthalates; the brand says it is made in Germany and lasts up to 10 years with normal care. Tampon Tribe says TPE warms to body temperature and molds to your shape, and the cup has rounded edges, an easy-grip stem and a patented design meant to reduce leaks and avoid suction on removal. Worn for up to 12 hours depending on flow. Medium (25 mL) is for people under 25 who haven\'t given birth vaginally; Large (30 mL) is for everyone else.',
        safety: {
            fdaStatus: 'Menstrual cups are regulated by the FDA, which requires makers to register and list them and follow good manufacturing practices. Tampon Tribe says its TPE is compliant with FDA, RoHS, REACH and Prop 65 standards; tampontribe.com doesn\'t list the cup\'s FDA registration details.',
            materials: 'Medical-grade TPE (thermoplastic elastomer). Silicone-free, latex-free, BPA-free and phthalate-free, per the brand. Medium: 25 mL capacity, 43 mm wide, 67 mm long. Large: 30 mL, 46 mm wide, 66 mm long. Recyclable, per the brand.',
            recalls: 'No recalls found.',
            allergens: 'Latex-free and silicone-free, per the brand, which may suit people who react to either.',
            sideEffects: 'A systematic review of cup studies found rare reports of pain or vaginal wounds, rashes or allergies, urinary complaints and toxic shock syndrome. FDA says to stop using a cup and contact your provider if you get itching, a rash, pain, swelling or discomfort. Full warnings are listed below.',
            opinionAlerts: 'Tampon Tribe says the cup is "endorsed by MDs and leading researchers" and that TPE is more comfortable than silicone; neither claim is backed by a study on tampontribe.com. Most cup research is on silicone cups, not TPE.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of FDA guidance on menstrual cups and a systematic review of cup studies. Not a direct clinician quote; no study tested this cup.',
        doctorOpinion: 'Menstrual cups as a category have reasonable evidence. A 2019 Lancet Public Health review of 43 studies (3,319 people) found cups leaked about the same as or less than pads and tampons, didn\'t harm vaginal bacteria, and 73% of users wanted to keep using one. Most people needed a few cycles to get used to inserting and removing it.\n\nThe review also logged rare problems: 5 reports of toxic shock syndrome, 13 IUDs dislodged, and a few cases of pain, wounds or rashes. FDA advises talking to your gynecologist before using a cup with an IUD, and emptying and washing it every 8 to 12 hours.\n\nThis cup is made of TPE rather than the more common silicone. Tampon Tribe says that makes it softer and more comfortable, but most cup research used silicone cups, and no study of this cup was found.',
        doctorOpinionShort: 'Cups leak about as much as or less than pads and tampons and are generally safe (2019 review of 43 studies), with rare TSS and IUD dislodgement. TPE rather than silicone; no study of this cup was found.',
        doctorOpinionCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/31324419/',
                label: 'PubMed (NIH): Menstrual cup use, leakage, acceptability and safety, systematic review and meta-analysis (Lancet Public Health, 2019)',
            },
            {
                url: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups',
                label: 'FDA: Menstrual Cups',
            },
        ],
        whoItsFor: [
            'People who want a reusable, lower-waste alternative to tampons and pads',
            'Anyone sensitive to latex or silicone, since this cup is TPE',
            'Medium for under 25 and no vaginal birth; Large for over 25 or after a vaginal birth, per the brand',
            'Have an IUD? Talk to your gynecologist first (FDA)',
            'Not for bleeding after childbirth, or for discharge from an infection (FDA)',
        ],
        howToUse: {
            intro: 'Per FDA guidance and Tampon Tribe\'s tips:',
            steps: [
                'Wash your hands, and wash the cup following the instructions before inserting it (FDA).',
                'Fold the cup and insert it. Tampon Tribe says it should sit a bit lower than a tampon.',
                'To help it open and seal, push the stem up slightly, rotate the cup, or gently squeeze its base. Run a finger around the base to check for folds.',
                'Empty and wash it every 8 to 12 hours; never longer than 12 hours.',
                'At the end of your period, wash it and place it in boiling water for 1 to 2 minutes, or follow the cleaning instructions in the box (FDA).',
            ],
            sourceUrl: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups',
            sourceLabel: 'FDA: Menstrual Cups',
        },
        warnings: [
            'Toxic shock syndrome has been reported with menstrual cups, though rarely. Remove the cup and get emergency care for sudden high fever, vomiting, a sunburn-like rash or dizziness during your period.',
            'Have an IUD? Talk to your gynecologist first: cups can dislodge an IUD (FDA; the 2019 review found 13 cases).',
            'Not for bleeding after childbirth or for discharge from an infection (FDA).',
            'Stop using it and contact your provider if you get itching, a rash, pain, swelling or discomfort (FDA).',
            'Not a form of contraception and does not protect against STIs.',
        ],
        communityReview: 'tampontribe.com loads its customer reviews with a script ayna can\'t read automatically, so no rating is quoted here; read them on the product page. In the 2019 review of cup studies, 73% of participants wanted to keep using a cup after trying one.',
        effectiveness: 'No study of this cup was found. For cups in general, a 2019 review of 43 studies found leakage similar to or lower than pads and tampons. Capacity is 25 mL (Medium) or 30 mL (Large), per the brand.',
        ingredients: 'Medical-grade TPE (thermoplastic elastomer); no silicone, latex, BPA or phthalates.',
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/31324419/',
                text: 'Menstrual cup use, leakage, acceptability and safety (Lancet Public Health, 2019)',
                summary: 'Systematic review of 43 studies (3,319 people): cups leaked the same as or less than pads and tampons; rare TSS, IUD dislodgement and injury reports.',
            },
            {
                url: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups',
                text: 'FDA: Menstrual Cups',
                summary: 'How to use and clean cups, IUD caution, and when to stop and call a provider.',
            },
        ],
        verificationLinks: {
            doctor: {
                links: [],
            },
            scientific: {
                links: [
                    {
                        url: 'https://pubmed.ncbi.nlm.nih.gov/31324419/',
                        text: 'Menstrual cup systematic review (2019)',
                        summary: '43 studies on leakage, acceptability and safety; most used silicone cups.',
                    },
                    {
                        url: 'https://www.fda.gov/medical-devices/menstrual-product-options-facts-and-safe-use/menstrual-cups',
                        text: 'FDA: Menstrual Cups',
                        summary: 'Use, cleaning and safety guidance.',
                    },
                ],
            },
            community: {
                links: [
                    {
                        url: 'https://tampontribe.com/products/menstrual-cup',
                        text: 'tampontribe.com: Menstrual Cup',
                        summary: 'The brand\'s product page, with sizes, materials, troubleshooting tips and customer reviews.',
                    },
                ],
            },
        },
        isEmergingBrand: false,
    },
    {
        id: 'p-tampontribe-sample',
        hidden: true,
        name: 'Tampon Tribe Sample Pack',
        brand: 'Tampon Tribe',
        category: 'pad',
        healthFunctions: [
            'menstrual-collection',
        ],
        tags: [
            'organic',
        ],
        price: '$10 including U.S. delivery, one-time',
        url: 'https://tampontribe.com/products/secret-sample',
        affiliateUrl: 'https://www.awin1.com/cread.php?awinmid=91275&awinaffid=3082811&ued=https%3A%2F%2Ftampontribe.com%2Fproducts%2Fsecret-sample',
        image: 'https://cdn.shopify.com/s/files/1/0048/6971/8083/products/sample-us-10-3328589.jpg?v=1783121228',
        summary: 'A one-time sample of Tampon Tribe\'s organic cotton products: 6 tampons (Regular, Super, Super Plus), 4 Day pads, 2 Night pads and 4 pantyliners in a jute bag, per the brand.',
        safety: {
            fdaStatus: 'Tampons, pads and pantyliners are regulated by the FDA as medical devices; tampontribe.com doesn\'t list FDA details for these (see the matching Tampon Tribe entries).',
        },
        type: 'physical',
        internal: false,
        whereToBuy: [
            'tampontribe.com',
        ],
        isEmergingBrand: false,
    },
    // Rèsa brand partnership (2026-10-05), PRE-LAUNCH. Rèsa hasn't shipped
    // yet: the only thing a user can do today is reserve a spot on the
    // waitlist with a $9.90 early deposit. `prelaunch: true` drives the
    // distinct "ayna Favorite · Waitlist" badge, the waitlist CTA, and the
    // no-commission partner disclosure (see src/utils/partnerBrands.js).
    // ayna earns NO commission on the deposit, the partnership is groundwork
    // for the future wearable dashboard. affiliateUrl is the UTM-tagged
    // shop link Rèsa supplied so referrals are trackable on their side.
    // Facts below come from resa-labs.com, shop.resa-labs.com and Rèsa's
    // 2026 product-intro deck, checked 2026-10-05; nothing is independently
    // verified because there is no shipped device to verify yet.
    {
        id: 'p-resa-rhythm-bracelet',
        name: 'Rèsa Rhythm Bracelet',
        brand: 'Rèsa',
        category: 'tracker',
        type: 'physical',
        internal: false,
        prelaunch: true,
        waitlistCtaLabel: 'Join waitlist · $9.90 deposit',
        healthFunctions: ['cycle-tracking', 'fitness-cycle'],
        tags: ['resa', 'wearable', 'jewelry', 'waitlist', 'pre-launch', 'sleep', 'stress', 'hrv', 'cycle', 'irregular', 'privacy'],
        price: '$9.90 waitlist deposit',
        whereToBuy: [], // pre-launch, direct-to-consumer reservation only
        url: 'https://www.resa-labs.com/',
        affiliateUrl: 'https://shop.resa-labs.com/?utm_source=ayna_partner&utm_medium=referral&utm_campaign=market_test',
        image: '/products/resa/rhythm-bracelet.webp', // supplied by ayna 2026-10-05
        summary: 'Rèsa is an 18K gold-plated bracelet that doubles as a wellness wearable built for female physiology. It continuously tracks heart-rate variability, resting heart rate, skin temperature, sleep, respiration and activity, combines that with your cycle information, and reads it against your personal baseline to make sense of three rhythms at once: hormonal, circadian and stress. Instead of scores, the Rèsa app gives one plain-language read and one suggestion for the day, then checks in on whether it helped.',
        safety: {
            fdaStatus: 'Consumer wellness wearable, not a medical device; not FDA-cleared, and not intended to diagnose or treat any condition.',
            materials: '18K gold-plated bracelet, about 15g, 100% waterproof, roughly 7 days of battery per charge, per the brand.',
            recalls: 'Not yet released, no recalls.',
            sideEffects: 'None expected from wearing it. As with any metal jewelry, people with plating or metal sensitivities should check final material details at launch.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: "Sourced from Rèsa's own site and product-intro materials, not independent clinical literature.",
        doctorOpinion: 'HRV, resting heart rate, skin temperature and sleep are well-established wearable signals, and skin and wrist temperature in particular track the post-ovulation temperature shift across the menstrual cycle. Rèsa\'s pitch is interpreting those signals together, against your own baseline, instead of one metric at a time. The device has not launched, so there is no published validation of its accuracy or of its hormone-trend ("Hormone Rhythm") estimates yet. Its scientific advisory board includes Prof. Tory Eisenlohr-Moul (hormone, mood and autonomic research), Prof. Sarah E. Hill (Texas Christian University, reproductive hormone neuroscience) and Dr. Daniela Avila-Varela (Universitat Pompeu Fabra, menstrual-cycle brain dynamics), per the brand.',
        doctorOpinionShort: 'A promising idea built on established wearable signals, but pre-launch, so its accuracy and hormone-trend estimates are not yet validated.',
        whoItsFor: [
            'People who want wearable insight into how their cycle, sleep and stress interact, without wearing something that looks like a fitness tracker',
            'Early adopters comfortable reserving a product before it ships',
            'Not a substitute for clinical cycle, fertility or hormone testing',
        ],
        warnings: [
            'Pre-launch: specs, final price and ship date are not final.',
            'Wellness insights only. It is not contraception and does not diagnose hormonal conditions.',
        ],
        // The four papers Rèsa cites on shop.resa-labs.com for its claim that
        // HRV, heart rate and skin temperature have to be read against the
        // cycle. Links and findings checked 2026-10-05. They support the
        // premise, not the accuracy of the (unreleased) Rèsa device itself.
        scientificCitations: [
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/33526880/',
                text: 'Pierson et al. Daily, weekly, seasonal and menstrual cycles in women\'s mood, behaviour and vital signs. Nature Human Behaviour (2021)',
                summary: 'Analyzed 241 million observations from 3.3 million women in 109 countries using the Clue period-tracking app. Of the daily, weekly, seasonal and menstrual cycles, the menstrual cycle had the largest effect on most measures of mood, behaviour and vital signs, while sleep and exercise stayed more constant.',
            },
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11666598/',
                text: 'Jasinski et al. A novel method for quantifying fluctuations in wearable-derived daily cardiovascular parameters across the menstrual cycle. npj Digital Medicine (2024)',
                summary: 'Wearable data from 11,590 people across 45,811 menstrual cycles. Resting heart rate and HRV rose and fell in a regular pattern through the cycle: resting heart rate lowest and HRV highest around day 5, resting heart rate highest around day 26 and HRV lowest around day 27. The swing was smaller in older participants and those using birth control.',
            },
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7141121/',
                text: 'Schmalenberger et al. Menstrual cycle changes in vagally-mediated heart rate variability are associated with progesterone. Journal of Clinical Medicine (2020)',
                summary: 'Two within-person studies that measured hormones and HRV repeatedly across the cycle. Higher-than-usual progesterone predicted lower-than-usual HRV, and HRV was lowest in the mid-luteal phase; estradiol showed no significant effect. A practical example of why the same HRV number can mean different things depending on cycle phase.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/38767963/',
                text: 'Gombert-Labedens et al. Using wearable skin temperature data to advance tracking and characterization of the menstrual cycle in a real-world setting. Journal of Biological Rhythms (2024)',
                summary: 'Minute-by-minute wearable skin temperature from 120 women over a menstrual cycle. Temperature across the cycle was better described as a smooth rhythm (a cosinor model) than as a simple two-phase low/high step, which lets wearables measure the cycle\'s temperature rhythm in everyday life.',
            },
        ],
        integrations: [],
        badges: ['Pre-launch', 'Waitlist', 'Female-Founded'],
        isEmergingBrand: true,
    },

    // ---- PR haul products added 2026-10-19 (vaginal health and skin supplements), requested by Ameera. ----
    // The Good Bug, Good Down There, verified against thegoodbug.com on 2026-10-19
    // (product page, read with WebFetch and in a browser from a US location, plus the
    // store's product .json for variants and images). The store shows INR by default and
    // US dollars to US visitors: $14 for 15 sticks was read from the US view. No Amazon US
    // listing was found (amazon.com search, 2026-10-19), so there is no ASIN for this one.
    // The page names four Lactobacillus species but no strain codes and no CFU, so no
    // strain-level study could be matched. D-mannose and cranberry studies read from their
    // abstracts via NCBI E-utilities. openFDA food recall search: no matches.
    // Not a brand partner, no affiliate link.
    {
        id: 'p-goodbug-good-down-there',
        name: 'The Good Bug Good Down There Vaginal Health Stick',
        brand: 'The Good Bug',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'supplement'],
        tags: ['goodbug', 'tgb', 'vaginal health', 'probiotic', 'synbiotic', 'cranberry', 'd-mannose', 'uti', 'ph balance', 'supplement'],
        price: '$14 (15 sticks)',
        whereToBuy: ['thegoodbug.com'],
        url: 'https://thegoodbug.com/products/good-down-there-for-vaginal-health',
        image: 'https://cdn.shopify.com/s/files/1/0657/8225/1745/products/GoodDownThere_3.jpg?width=500', // from ayna's sheet; loads
        summary: "A daily powder stick for vaginal and urinary health. It combines four Lactobacillus species (L. crispatus, L. gasseri, L. jensenii and L. rhamnosus) with D-mannose, cranberry extract, zinc, vitamin C and inulin, in a cranberry flavor. The Good Bug says it promotes a healthy vaginal pH, balances good bacteria, supports urinary tract health and helps reduce UTI recurrence. The page says it is not designed to treat UTIs, BV or yeast infections. Sold in packs of 15, 30, 60 or 90 sticks.",
        ingredients: "Full ingredient list per The Good Bug: Sweetener [Sorbitol (INS 420(i))], Stabilizer [Xylitol (INS 967)], D-Mannose, Cranberry Extract, Lactobacillus crispatus, Lactobacillus gasseri, Lactobacillus jensenii (spelled \"jenseni\" in the list), Lactobacillus rhamnosus, Zinc Gluconate, Vitamin C, Inulin, Acidity Regulator [Citric Acid (INS 330)], Sweetener [Steviol Glycoside (INS 960)], Anti-Sticking Agent [Magnesium Stearate (INS 470(iii))]. Added cranberry flavor. The page doesn't give strain codes, CFU, or the amount of D-mannose, cranberry or any other ingredient.",
        safety: {
            fdaStatus: "Sold in India as a nutraceutical; the product page lists an FSSAI license. In the US this would be a dietary supplement, which the FDA does not evaluate for safety or efficacy. The page shows a \"US FDA Licensed\" badge; the FDA does not license or approve dietary supplements, and ayna found no FDA record for this product.",
            materials: 'Powder sticks; packs of 15, 30, 60 or 90. Sweetened with sorbitol, xylitol and stevia. Made in India by Sundyota Numandis Probioceuticals for SevenTurns Private Limited, Mumbai. Best before 18 months from manufacture. The page leaves the net quantity blank.',
            recalls: 'No recalls found.',
            sideEffects: "The Good Bug says to check with a healthcare practitioner first if you are pregnant or breastfeeding, take prescription medicine for a neurological condition, have allergies to any ingredient, or recently had surgery. It contains sugar alcohols (sorbitol, xylitol). Full warnings are listed below.",
            opinionAlerts: "The page names four Lactobacillus species but no strain codes or CFU, and gives no amounts for D-mannose or cranberry, so it can't be matched to published trials. It also says D-mannose is more effective than antibiotics at preventing repeat infections; no source is given, and a 598-woman placebo-controlled trial found D-mannose did not prevent repeat UTIs. No study of this product was found.",
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of NIH (NCCIH) information on probiotics and peer-reviewed research on cranberry and D-mannose. Not a direct clinician quote; none of the studies tested this product.',
        doctorOpinion: "The Good Bug says Good Down There promotes a healthy vaginal pH, balances good bacteria, supports urinary tract health and helps reduce UTI recurrence. No study of this product was found, and the page doesn't cite one.\n\nThe probiotic part can't be checked against research. L. crispatus, L. gasseri, L. jensenii and L. rhamnosus are species found in a healthy vagina, but the page lists no strain codes and no CFU count. NIH notes that the effects of a probiotic depend on the specific strain: one kind of Lactobacillus helping doesn't mean another will.\n\nFor the urinary claims, the evidence on the two other actives points in different directions. A 2023 Cochrane review of 50 trials (8,857 people) found cranberry products probably lower the risk of symptomatic, culture-confirmed UTIs in women with recurrent UTIs (8 trials, 1,555 women), with moderate-certainty evidence overall. For D-mannose, a 2024 double-blind, placebo-controlled trial of 598 women with recurrent UTIs across 99 UK primary care practices found 2 g a day for 6 months did not reduce repeat UTIs (51% vs 56%, not a significant difference), and the authors said it should not be recommended for prevention in that group. The page doesn't list how much cranberry or D-mannose each stick contains.",
        doctorOpinionShort: "Cranberry products probably lower repeat UTIs in women prone to them, but a large 2024 trial found D-mannose did not. The probiotic species are vaginal ones, but no strain codes or CFU are given, so they can't be matched to research. No study of this product was found.",
        doctorOpinionCitations: [
            { url: 'https://thegoodbug.com/products/good-down-there-for-vaginal-health', label: 'thegoodbug.com: Good Down There, ingredients and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', label: 'PubMed: Cranberries for preventing urinary tract infections, Cochrane review (2023)', chipLabel: 'Cranberry Cochrane review, 50 trials (2023)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/', label: 'PubMed: d-Mannose for prevention of recurrent urinary tract infection among women, randomized clinical trial (JAMA Intern Med, 2024)', chipLabel: 'D-mannose trial, 598 women (2024)' },
            { url: 'https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety', label: 'NIH (NCCIH): Probiotics, usefulness and safety' },
        ],
        whoItsFor: [
            'Adults who want a daily powder aimed at vaginal and urinary health',
            'People who prefer a stick mixed into water over capsules',
            'Not a treatment for an active UTI, BV or yeast infection: see a clinician if you have symptoms',
        ],
        howToUse: {
            intro: "The Good Bug sizes its packs at one stick a day (15 sticks for 15 days, 30 for a month). The product page doesn't give mixing directions; its other sticks are mixed into water, so check the box.",
            steps: [
                'Take one stick a day, going by the pack sizes.',
                'The Good Bug also suggests fiber, plenty of water, less sugar and refined carbs, wiping front to back and urinating after sex.',
            ],
            sourceUrl: 'https://thegoodbug.com/products/good-down-there-for-vaginal-health',
            sourceLabel: 'thegoodbug.com: Good Down There',
        },
        warnings: [
            'Pregnant or breastfeeding, taking prescription medicine for a neurological condition, allergic to any ingredient, or recently had surgery: check with a doctor first (per The Good Bug).',
            'Not a treatment for a UTI, BV or yeast infection (per The Good Bug). See a clinician for burning, unusual discharge, odor or fever.',
            'Contains sugar alcohols (sorbitol, xylitol), which can loosen stools in some people.',
        ],
        communityReview: "The Good Bug's product page shows 4.3 out of 5 stars from 1,629 reviews. The first reviews shown talk about glowing skin, stronger nails and PMOS symptoms rather than vaginal or urinary health, so the reviews may be pooled across the brand's products. These are reviews on the brand's own site; no independent review data was found at time of writing.",
        effectiveness: 'No study of this product was found. Cranberry products probably lower repeat UTIs in women prone to them; D-mannose did not in a 598-woman trial. The probiotic strains are not named, so their effect is unknown.',
        ingredientScienceNote: "These studies tested cranberry and D-mannose on their own, not this product. The page doesn't give amounts, so it isn't known whether a stick matches the doses studied.",
        ingredientScience: [
            {
                name: 'Cranberry',
                text: 'A 2023 Cochrane review of 50 randomized trials (8,857 people) found cranberry products reduced symptomatic, culture-confirmed UTIs overall (moderate-certainty evidence). In women with recurrent UTIs (8 trials, 1,555 women) they probably lowered the risk by about a quarter. They showed little or no benefit in pregnant women or older adults in care homes. Stomach side effects were similar to placebo.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', label: 'PubMed: Cranberries for preventing urinary tract infections (Cochrane Database Syst Rev, 2023)' },
                ],
            },
            {
                name: 'D-mannose',
                text: 'In a 2024 double-blind, placebo-controlled trial at 99 UK primary care practices, 598 women with recurrent UTIs took 2 g of D-mannose powder or a placebo daily for 6 months. 51% of the D-mannose group and 56% of the placebo group saw a doctor for a suspected UTI, a difference that was not statistically significant, and no secondary outcome differed. The authors concluded D-mannose should not be recommended for UTI prevention in this group.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/', label: 'PubMed: d-Mannose for prevention of recurrent UTI among women, randomized clinical trial (JAMA Intern Med, 2024)' },
                ],
            },
            {
                name: 'Why the strain matters',
                text: "NIH notes that different probiotics can have different effects: if one kind of Lactobacillus helps, that doesn't mean another kind will do the same. Good Down There lists species (L. crispatus, L. gasseri, L. jensenii, L. rhamnosus) but no strain codes, so no study can be matched to it.",
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety', label: 'NIH (NCCIH): Probiotics, usefulness and safety' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', text: 'Cranberries for preventing UTIs (Cochrane, 2023)', summary: '50 trials; probably fewer repeat UTIs in women prone to them.' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/38587819/', text: 'D-mannose for recurrent UTI, randomized trial (2024)', summary: '598 women; no reduction in repeat UTIs vs placebo.' },
                ],
            },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://thegoodbug.com/products/good-down-there-for-vaginal-health',
                        text: 'thegoodbug.com: Good Down There customer reviews',
                        summary: "The Good Bug's own product page shows 4.3 out of 5 stars from 1,629 reviews; the reviews shown first are about skin and nails, so they may be pooled across products.",
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // CBB (Curvy Body Bears), Perfect PH Probiotic Gummies, verified against the Amazon
    // listing (ASIN B0F7QXCGR5, read in a browser on 2026-10-19: title, ingredients text,
    // description, bottle images, product details, reviews). The brand's own site,
    // curvybodybears.com, loads but does not sell this product (its catalog has the Perfect PH
    // Feminine Wash and other gummies only), so `url` is the Amazon dp link. The only
    // probiotic named is Bacillus coagulans, with no strain code and no CFU; the listing
    // shows no Supplement Facts panel. openFDA food recall search: no matches.
    // Not a brand partner, no affiliate link.
    {
        id: 'p-cbb-perfect-ph-probiotic-gummies',
        name: 'CBB Perfect PH Probiotic Gummies',
        brand: 'CBB (Curvy Body Bears)',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['vaginal-health', 'supplement'],
        tags: ['cbb', 'curvy body bears', 'vaginal health', 'probiotic', 'gummies', 'ph balance', 'bacillus coagulans', 'vegan', 'supplement'],
        price: '$17.99 on Amazon (60 gummies)',
        userRating: 4.5,
        userRatingSourceUrl: 'https://www.amazon.com/dp/B0F7QXCGR5',
        whereToBuy: ['Amazon'],
        url: 'https://www.amazon.com/dp/B0F7QXCGR5',
        image: 'https://m.media-amazon.com/images/I/41qCKV-R2gL._AC_SL500_.jpg', // from ayna's sheet; loads
        summary: "Pineapple-flavored gummies sold as \"vaginal probiotics\". The bottle says they help maintain a healthy vaginal pH, support yeast balance and keep odor away, and lists odor control, healthy pH, yeast balance and vaginal flow. The only probiotic named is Bacillus coagulans, a spore-forming gut bacterium, not one of the Lactobacillus species that dominate a healthy vagina. The Amazon title also lists vitamin C. 60 gummies, which the listing calls a 30-day supply. Vegan, gluten-free, soy-free and non-GMO per the listing.",
        ingredients: "Per the Amazon listing: Natural Pineapple Flavor, Orange juice concentrate, Bacillus Coagulans. The bottle's key ingredients are Bacillus coagulans (probiotic) and pineapple fruit powder. The listing title and description also mention vitamin C, but it isn't in the ingredient text. No strain code, CFU count or Supplement Facts panel was shown.",
        safety: {
            fdaStatus: 'Sold as a dietary supplement. The listing says its statements have not been evaluated by the FDA and that it is not intended to diagnose, treat, cure, or prevent any disease.',
            materials: '60 gummies (30-day supply per the listing). Manufacturer listed as Curvy Body Bears; country of manufacture not stated. Labeled vegan, gluten-free, halal and allergen-free on the bottle.',
            recalls: 'No recalls found.',
            sideEffects: "No warnings or directions were shown on the Amazon listing. Check the bottle before use, and ask a clinician first if you are pregnant, breastfeeding or have a medical condition.",
            opinionAlerts: "Labeled \"vaginal probiotics\", but the only probiotic named is Bacillus coagulans, with no strain code or CFU, so it can't be matched to any study. Vitamin C is in the title but not the ingredient list. No study of this product was found.",
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of NIH (NCCIH) information on probiotics. Not a direct clinician quote; no study of this product or its strain was found.',
        doctorOpinion: "CBB says Perfect PH gummies help maintain a healthy vaginal pH, support yeast balance and keep odor away. No study of this product was found, and the listing doesn't cite one.\n\nThe only probiotic named is Bacillus coagulans, a spore-forming bacterium mostly studied for the gut. A healthy vagina is usually dominated by Lactobacillus species, and this product contains none. The label gives no strain code and no CFU count, so there is no way to match it to published research. NIH notes that effects depend on the specific strain, so research on one kind of probiotic doesn't carry over to another.\n\nThe listing also names vitamin C in its title but not in the ingredient list, so it isn't clear how much, if any, each gummy contains.",
        doctorOpinionShort: "Sold as a vaginal probiotic, but its only named probiotic is Bacillus coagulans, a gut bacterium, with no strain code or CFU, so it can't be matched to any research. No study of this product was found.",
        doctorOpinionCitations: [
            { url: 'https://www.amazon.com/dp/B0F7QXCGR5', label: 'Amazon: CBB Perfect PH Probiotic Gummies, ingredients and claims' },
            { url: 'https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety', label: 'NIH (NCCIH): Probiotics, usefulness and safety' },
        ],
        whoItsFor: [
            'Adults who want a flavored gummy instead of a capsule and accept that the evidence is thin',
            'Not a treatment for BV, a yeast infection or a UTI: see a clinician if you have symptoms such as odor, itching or unusual discharge',
        ],
        warnings: [
            'A probiotic doesn\'t treat an active infection. See a clinician for symptoms of BV, a yeast infection or a UTI.',
            'Pregnant, breastfeeding, or managing a medical condition: check with a clinician before use.',
            'The listing shows no dose directions; follow the bottle.',
        ],
        communityReview: "Rated 4.5 out of 5 from 139 ratings on Amazon (81% five-star, 7% four-star, 4% three-star, 3% two-star, 5% one-star). Most of the reviews shown praise the pineapple taste and the gummy format; a few say it helps them feel balanced. One reviewer whose spouse took them for a while noticed no improvements or side effects, and said the gummies stuck together over time.",
        effectiveness: 'No study of this product or its strain was found. The label names Bacillus coagulans without a strain code or CFU, so its effect is unknown.',
        ingredientScience: [
            {
                name: 'Why the strain matters',
                text: "NIH notes that different probiotics can have different effects, and the most common probiotics are Lactobacillus and Bifidobacterium. This product's only named probiotic is Bacillus coagulans, with no strain code, so no study can be matched to it.",
                citations: [
                    { url: 'https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety', label: 'NIH (NCCIH): Probiotics, usefulness and safety' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://www.nccih.nih.gov/health/probiotics-usefulness-and-safety', text: 'NIH (NCCIH): Probiotics', summary: 'Effects depend on the specific strain.' },
                ],
            },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.amazon.com/dp/B0F7QXCGR5',
                        text: 'Amazon: CBB Perfect PH Probiotic Gummies reviews',
                        summary: '4.5 out of 5 from 139 ratings on Amazon.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // ESTHER FORMULA, Esther Lyuh Ceramide Strips (sold on Amazon US as "Hyaluronic Acid &
    // Ceramide Strips (15ct)"), identified from the Amazon listing for ASIN B0FQN7VN4R, read in
    // a browser on 2026-10-19: title, ingredients, directions, product details, all gallery
    // images (box front reads "Esther Lyuh Ceramide Strips, Dietary Supplement, 15 Strips /
    // Net Wt. 0.16 oz (4.5g)"; Supplement Facts panel), and reviews. estherformula.com did not
    // load (browser error page). Cross-checked against the Olive Young US product page for the
    // same box. No PubMed record for "activeCera" or for this product. openFDA food recall
    // search: no matches. Not a brand partner, no affiliate link.
    {
        id: 'p-estherformula-ceramide-strips',
        name: 'ESTHER FORMULA Esther Lyuh Ceramide Strips (Hyaluronic Acid & Ceramide)',
        brand: 'ESTHER FORMULA',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement', 'skin-hair'],
        tags: ['esther formula', 'esther lyuh', 'skin', 'hydration', 'ceramide', 'hyaluronic acid', 'gotu kola', 'oral strip', 'k-beauty', 'beauty supplement', 'supplement'],
        price: '$24.99 on Amazon (15 strips)',
        userRating: 4.4,
        userRatingSourceUrl: 'https://www.amazon.com/dp/B0FQN7VN4R',
        whereToBuy: ['Amazon', 'Olive Young US'],
        url: 'https://www.amazon.com/dp/B0FQN7VN4R',
        whereToBuyLinks: {
            Amazon: 'https://www.amazon.com/dp/B0FQN7VN4R',
            'Olive Young US': 'https://us.oliveyoung.com/products/UA99304443',
        },
        image: 'https://m.media-amazon.com/images/I/51q39aFdEdL._AC_SL500_.jpg', // from ayna's sheet; loads
        summary: "Apple-flavored strips that dissolve on the roof of the mouth, from the Korean supplement brand ESTHER FORMULA. Each strip has 960 mcg of plant ceramides (activeCera, fermented from fruit and vegetable extract), 90 mg of hyaluronic acid (Hi-Aqua) and 10 mg of gotu kola extract. The brand says it supports skin hydration, elasticity and the skin barrier. 15 individually wrapped strips. Vegan and sugar-free; sweetened with aspartame.",
        ingredients: "Supplement Facts per strip (0.3 g), from the Amazon listing images: Ceramides (from Fruits and Vegetable Extract) 960 mcg, Hyaluronic Acid 90 mg, Gotu Kola Extract 10 mg, Sodium 5 mg, 0 calories. Other ingredients per Olive Young US: Pullulan, Calcium Lactate, Beta-Cyclodextrin, Fruit and Vegetable Extract, Glycerin, Hydroxypropyl Methylcellulose, Citric Acid, Aspartame, Apple Flavor.",
        safety: {
            fdaStatus: 'Sold as a dietary supplement, which the FDA does not evaluate for safety or efficacy. The listing says its statements have not been evaluated by the FDA.',
            materials: '15 individually wrapped oral strips, 0.3 g each (4.5 g total). Manufacturer listed on Amazon as ESTHER FORMULA USA Corporation; country of manufacture not stated on the pages read.',
            recalls: 'No recalls found.',
            sideEffects: "Contains phenylalanine (from aspartame), which matters for people with phenylketonuria (PKU). For adults only; check with a doctor before use if pregnant, nursing, taking medication or managing a medical condition (per Olive Young US). Full warnings are listed below.",
            opinionAlerts: "The \"clinically proven\" numbers (+60% hydration, +35% or +50% elasticity) come from trials of the activeCera ingredient, footnoted as 12 people over 8 weeks, not of these strips, and ayna couldn't find that trial published. The listing's images give two different elasticity numbers and two different doses (1 to 2 strips vs 1 to 4 strips a day). No study of this product was found.",
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna summary of a peer-reviewed meta-analysis of oral skin-moisturizing supplements. Not a direct clinician quote; no study of this product was found.',
        doctorOpinion: "ESTHER FORMULA says these strips support skin hydration, elasticity and the skin barrier. Its listing shows \"clinically proven\" gains of 60% in hydration and 35% in elasticity, but its own footnotes say those come from an 8-week trial of the activeCera ingredient in 12 people, not of these strips. ayna couldn't find that trial published, and the listing doesn't say whether it had a placebo group. A separate +50% skin barrier protein figure is footnoted as a cell-culture (lab) study, and the claim that the strip absorbs through the mouth lining is footnoted as lab and rat work on hyaluronic acid only. No study of this product was found.\n\nThere is some broader research on oral skin supplements. A 2022 meta-analysis of 66 randomized trials found that oral ceramides and oral hyaluronan both improved skin hydration compared with placebo in healthy adults, and that ceramides also reduced water loss through the skin. Those trials used other ceramide and hyaluronan products at their own doses, so they show what the ingredients can do, not that this product does. One of the four authors worked for a pharmaceutical company.",
        doctorOpinionShort: "Oral ceramides and hyaluronan improved skin hydration in a 2022 meta-analysis of randomized trials. The brand's own numbers come from a 12-person ingredient trial ayna couldn't find published. No study of this product was found.",
        doctorOpinionCitations: [
            { url: 'https://www.amazon.com/dp/B0FQN7VN4R', label: 'Amazon: ESTHER FORMULA Hyaluronic Acid & Ceramide Strips, ingredients and claims' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/35719159/', label: 'PubMed: Effectiveness of dietary supplements for skin moisturizing in healthy adults, systematic review and meta-analysis of RCTs (Front Nutr, 2022)', chipLabel: 'Oral skin supplements meta-analysis, 66 trials (2022)' },
        ],
        whoItsFor: [
            'Adults with dry or dehydrated skin who want to try an oral supplement alongside topical care',
            'People who prefer a dissolving strip to capsules',
            'Not for people with phenylketonuria (PKU): it contains aspartame',
        ],
        howToUse: {
            intro: 'Per ESTHER FORMULA on Amazon. The listing gives two different amounts: the text says 1 to 4 strips daily, and the how-to image says 1 to 2 daily for maintenance.',
            steps: [
                'Place one strip on the roof of your mouth.',
                'Let it dissolve completely. No water needed.',
                'Take 1 to 2 strips a day (image) or up to 4 (listing text); check the box you receive.',
            ],
            sourceUrl: 'https://www.amazon.com/dp/B0FQN7VN4R',
            sourceLabel: 'Amazon: ESTHER FORMULA Ceramide Strips',
        },
        warnings: [
            'Phenylketonurics: contains phenylalanine (aspartame).',
            'For adults only. Keep out of reach of children.',
            'Pregnant, nursing, taking medication, or managing a medical condition: check with a doctor before use.',
        ],
        communityReview: "Rated 4.4 out of 5 from 63 ratings on Amazon (75% five-star, 8% four-star, 7% three-star, 1% two-star, 9% one-star). Reviewers mostly mention easy use, taste and softer, more hydrated skin; one 4-star reviewer said results weren't dramatic, and a 3-star reviewer said the strips were stale and crunchy. At least one top review was an Amazon Vine review of a free product.",
        effectiveness: 'Oral ceramides and hyaluronan improved skin hydration in a meta-analysis of randomized trials of other products. No study of these strips was found.',
        ingredientScienceNote: "These results come from trials of other oral ceramide and hyaluronan products. This product's own figures come from an unpublished ingredient trial.",
        ingredientScience: [
            {
                name: 'Oral ceramides and hyaluronan',
                text: 'A 2022 systematic review and meta-analysis of 66 randomized controlled trials in healthy adults found oral ceramides increased skin hydration and reduced water loss through the skin compared with placebo, and oral hyaluronan increased skin hydration (too few trials to judge water loss). All the supplements studied were safe over the trial periods, usually 24 weeks or less. One author worked for a pharmaceutical company.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/35719159/', label: 'PubMed: Effectiveness of dietary supplements for skin moisturizing in healthy adults (Front Nutr, 2022)' },
                ],
            },
            {
                name: 'activeCera (brand-cited trial)',
                text: "ESTHER FORMULA cites an 8-week human trial of 12 people for its +60% hydration and +35% elasticity figures. The trial tested the activeCera ingredient, not these strips, and ayna couldn't find it published in PubMed.",
                citations: [
                    { url: 'https://www.amazon.com/dp/B0FQN7VN4R', label: 'Amazon: ESTHER FORMULA listing images and footnotes' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/35719159/', text: 'Oral skin-moisturizing supplements, meta-analysis (2022)', summary: '66 trials; oral ceramides and hyaluronan improved hydration. Not this product.' },
                ],
            },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://www.amazon.com/dp/B0FQN7VN4R',
                        text: 'Amazon: ESTHER FORMULA Ceramide Strips reviews',
                        summary: '4.4 out of 5 from 63 ratings on Amazon.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.oliveyoung.com/products/UA99304443',
                        text: 'Olive Young US: Esther Lyuh Ceramide Strips',
                        summary: 'Retailer page with the full ingredient list and warnings.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // ---- PR haul products added 2026-10-19 (acne), requested by Ameera. ----
    // Hero Cosmetics, Mighty Patch Original, verified against
    // herocosmetics.us/products/mighty-patch-original on 2026-10-19.
    // Regulatory status from openFDA device registration/listing (Church &
    // Dwight, registration 2280705, product codes NAD and NAC, Class I).
    // openFDA 510(k) searches (applicant "hero", applicant "church dwight",
    // device_name "mighty") returned no Mighty Patch or hydrocolloid clearance.
    // Science: Chao et al., J Cosmet Sci 2006 (read on library.scconline.org).
    // Not a brand partner, no affiliate link.
    {
        id: 'p-hero-mighty-patch-original',
        name: 'Mighty Patch Original Pimple Patch',
        brand: 'Hero Cosmetics',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['acne', 'skin', 'pcos', 'pimple patch', 'hydrocolloid', 'drug-free'],
        price: '$12.99 for 36 patches on herocosmetics.us',
        whereToBuy: ['Hero Cosmetics'],
        url: 'https://herocosmetics.us/products/mighty-patch-original',
        image: 'https://m.media-amazon.com/images/I/61p+1+md+8L._AC_SL500_.jpg', // from ayna's sheet; loads (checked 2026-10-19)
        summary: 'A drug-free hydrocolloid patch (12 mm) that you stick on a pimple overnight. Hero says it absorbs gunk in about 6 hours, shrinks the look of a pimple in one use, and keeps you from picking at it. It has no acne medicine in it, so it works as a covering, not a treatment.',
        ingredients: 'Hero names hydrocolloid as the key ingredient and calls it medical-grade. The product page does not publish a full material list.',
        safety: {
            fdaStatus: 'Listed with the FDA as a Class I wound dressing (occlusive dressing, product code NAD, and hydrophilic dressing, product code NAC) under Church & Dwight\'s registration, per openFDA. No 510(k) clearance was found for it. It is not a drug and has no Drug Facts label.',
            materials: '12 mm round hydrocolloid patches, 36 per pack (also sold in 72). Hero describes them as drug-free.',
            recalls: 'No recalls found. openFDA device recall searches for Church & Dwight and for "Mighty Patch" returned no patch recalls.',
            sideEffects: 'The product page lists no warnings or side effects. In the one small trial of a similar hydrocolloid acne dressing (not this brand), no significant side effects were seen in either group.',
            opinionAlerts: 'Contains no acne medicine. Hydrocolloid patches were studied on inflamed, red bumps; the small trial did not test blackheads, whiteheads or deep cysts. Wear time is stated as about 6 hours in one place and 6 to 8 hours in another on Hero\'s page.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Hero Cosmetics; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Hero says Mighty Patch absorbs gunk in about 6 hours, shrinks the look of a pimple in one use, and protects it from picking and popping. It also says the patch is drug-free, derm-tested and suitable for sensitive skin. No independent study of this product was found.\n\nThe main evidence for hydrocolloid on pimples is one small pilot trial from 2006. In Taiwan, 20 people with mild to moderate acne were randomized to a hydrocolloid acne dressing (made by 3M, not Hero) or plain skin tape on inflamed bumps for 7 days, with the dressing changed every 2 days. The authors report that the hydrocolloid group had a significantly greater drop in acne severity and redness, and their inflamed bumps healed in about 3.2 days compared with 4.3 days with tape. No significant side effects were found. With only 10 people per group and one week of follow-up, the authors called it a pilot and asked for a larger study.\n\nRegulatory status: openFDA lists Mighty Patch as a Class I wound dressing under Church & Dwight. That is a listing, not an FDA clearance or approval, and no 510(k) clearance was found.',
        doctorOpinionShort: 'A drug-free hydrocolloid sticker for single pimples. One 2006 pilot trial of 20 people found a similar hydrocolloid dressing (made by 3M) helped inflamed bumps heal faster than plain tape over a week. FDA-listed as a Class I wound dressing; no 510(k) clearance found. No independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://herocosmetics.us/products/mighty-patch-original', label: 'herocosmetics.us: Mighty Patch Original, claims and directions' },
            { url: 'https://library.scconline.org/v057n02/1', label: 'J Cosmet Sci (2006): Chao et al., randomized double-blind pilot trial of a hydrocolloid acne dressing vs skin tape', chipLabel: 'Hydrocolloid pilot trial, 20 people (2006)' },
            { url: 'https://api.fda.gov/device/registrationlisting.json?search=proprietary_name:patch+AND+registration.name:church&limit=10', label: 'openFDA: device registration and listing for Mighty Patch (Church & Dwight, Class I, codes NAD and NAC)', chipLabel: 'FDA device listing' },
        ],
        whoItsFor: [
            'People with a single red, inflamed pimple who want to cover it overnight and stop picking',
            'People who want a drug-free option or are already using another acne medicine',
            'Not a treatment for blackheads, whiteheads, deep cysts, or widespread acne',
        ],
        howToUse: {
            intro: 'Per Hero\'s product page.',
            steps: [
                'Cleanse your face and let it dry.',
                'Apply a patch to the blemish.',
                'Leave it on for about 6 to 8 hours (overnight), then peel it off.',
            ],
            sourceUrl: 'https://herocosmetics.us/products/mighty-patch-original',
            sourceLabel: 'herocosmetics.us: Mighty Patch Original',
        },
        warnings: [
            'Contains no acne medicine (Hero describes it as drug-free). Hero\'s page lists no other warnings.',
        ],
        communityReview: 'Hero\'s own product page shows 5,460 reviews but no numeric average rating. On Amazon the 36-count listing shows 4.6 out of 5 stars from 186,714 ratings (read 2026-10-19).',
        effectiveness: 'One 20-person, one-week pilot trial found a hydrocolloid acne dressing (not this brand) helped inflamed bumps heal faster than plain tape. No study of Mighty Patch itself was found.',
        ingredientScience: [
            {
                name: 'Hydrocolloid dressing on inflamed pimples',
                text: 'In a 2006 randomized, double-blind pilot trial at a hospital dermatology department in Taiwan, 20 people aged 11 to 35 with mild to moderate acne were split into two groups of 10. One group used a hydrocolloid acne dressing made by 3M on inflamed bumps and the other used skin tape, for 7 days. The authors report a significantly greater drop in acne severity and in redness, oiliness and dark marks with the hydrocolloid dressing, and inflamed bumps healed in about 3.2 days vs 4.3 days. No significant side effects were found. It was a small, short pilot study of a different brand\'s dressing, and the authors called for a larger trial.',
                citations: [
                    { url: 'https://library.scconline.org/v057n02/1', label: 'J Cosmet Sci (2006): A pilot study on efficacy treatment of acne vulgaris using a new method, randomized double-blind trial with Acne Dressing (Chao et al.)' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://herocosmetics.us/products/mighty-patch-original',
                        text: 'herocosmetics.us: Mighty Patch Original customer reviews',
                        summary: 'Hero\'s own product page shows 5,460 reviews; no average rating was shown.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },

    // Hero Cosmetics, Pimple Correct (salicylic acid 2% gel pen), verified
    // against herocosmetics.us/products/pimple-correct and the DailyMed Drug
    // Facts (setid 869afe67-edae-4778-b990-08c2313d5aad, Church & Dwight,
    // NDC 10237-003-00, 10 mL) on 2026-10-19. openFDA drug label search
    // (generic salicylic acid, manufacturer Church & Dwight) returned this
    // label. No openFDA drug enforcement (recall) record for Church & Dwight
    // mentions Hero. Not a brand partner, no affiliate link.
    {
        id: 'p-hero-pimple-correct',
        name: 'Pimple Correct Acne Clearing Gel Pen',
        brand: 'Hero Cosmetics',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['acne', 'skin', 'pcos', 'salicylic acid', 'spot treatment'],
        price: '$19.99 for 10 ml (0.34 fl oz) on herocosmetics.us',
        whereToBuy: ['Hero Cosmetics'],
        url: 'https://herocosmetics.us/products/pimple-correct',
        image: 'https://m.media-amazon.com/images/I/61Le1S+bw0L._AC_SL500_.jpg', // from ayna's sheet; loads (checked 2026-10-19)
        summary: 'A 2% salicylic acid spot-treatment gel in a twist pen, sold as an over-the-counter acne drug. Hero says it targets early-stage pimples to help stop them getting bigger and helps prevent new ones. Apply a thin layer to clean, dry spots, starting once a day and building up to three times a day if your skin tolerates it.',
        ingredients: 'Active: salicylic acid 2% (acne treatment). Inactive, per the Drug Facts label: water/aqua/eau, butylene glycol, nigella sativa seed extract, isopentyldiol, sodium polyacrylate, lactic acid, hydroxyethylcellulose, melaleuca alternifolia (tea tree) leaf oil, niacinamide, polydextrose, caffeine, maltodextrin, xanthan gum, allantoin, ceratonia siliqua gum, sodium hydroxide, opuntia ficus-indica stem extract, agar, aloe barbadensis leaf juice powder, glycerin, biosaccharide gum-1, melia azadirachta leaf extract, melia azadirachta flower extract, 1,2-hexanediol, caprylyl glycol, sodium levulinate, glyceryl caprylate, tocopherol, tocopheryl acetate, coccinia indica fruit extract, disodium phosphate, polysorbate 60, ammonium acryloyldimethyltaurate/VP copolymer, gellan gum, sodium anisate, aloe barbadensis flower extract, solanum melongena fruit extract, azelaic acid, corallina officinalis extract, curcuma longa root extract, ocimum sanctum leaf extract, simmondsia chinensis seed oil, sodium phosphate, sebacic acid, limonene.',
        safety: {
            fdaStatus: 'FDA-regulated over-the-counter acne drug with a Drug Facts label (DailyMed, Church & Dwight Co., Inc.; distributed by Hero Cosmetics). Salicylic acid 0.5% to 2% is an allowed acne active ingredient under the FDA\'s OTC acne rules.',
            materials: 'Gel in a 10 ml (0.34 fl oz) twist pen with applicator.',
            recalls: 'No recalls found. No openFDA drug recall record for Church & Dwight mentions Hero or Pimple Correct.',
            allergens: 'Contains tea tree leaf oil and limonene. Hero says it has no added fragrance.',
            sideEffects: 'Dryness, peeling and irritation are possible, and more likely if you use another topical acne medicine at the same time.',
            opinionAlerts: 'Azelaic acid and niacinamide are listed as inactive ingredients, so their amounts are not given and they should not be counted as treatment doses. Hero\'s FAQ says to check with a doctor before use if pregnant; the Drug Facts label itself has no pregnancy line.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Hero Cosmetics; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Hero calls Pimple Correct a max-strength, derm-tested spot treatment that penetrates to help stop early-stage breakouts and helps prevent new ones. No independent study of this product was found.\n\nThe active ingredient is salicylic acid at 2%, the highest strength the FDA allows in over-the-counter acne products. In the American Academy of Dermatology\'s 2024 acne guidelines, topical salicylic acid gets a conditional recommendation, a weaker grade than the strong recommendations given to benzoyl peroxide and topical retinoids such as adapalene. The AAD suggests giving acne treatments 6 to 8 weeks to work.\n\nThe gel also lists azelaic acid, niacinamide and tea tree oil, but only as inactive ingredients with no amounts given, so they should not be thought of as treatment doses.',
        doctorOpinionShort: 'A 2% salicylic acid spot gel, the top OTC strength. The AAD\'s 2024 guidelines give salicylic acid a conditional (weaker) recommendation than benzoyl peroxide or adapalene. Extra ingredients like azelaic acid and niacinamide are listed as inactive, with no amounts. No independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://herocosmetics.us/products/pimple-correct', label: 'herocosmetics.us: Pimple Correct, claims and directions' },
            { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=869afe67-edae-4778-b990-08c2313d5aad', label: 'DailyMed: Hero Cosmetics Pimple Correct Drug Facts (salicylic acid 2%)', chipLabel: 'Drug Facts label' },
            { url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:38300170%20AND%20SRC:MED&resultType=core&format=json', label: 'J Am Acad Dermatol (2024): Guidelines of care for the management of acne vulgaris (Reynolds et al.), abstract via Europe PMC', chipLabel: 'AAD acne guidelines (2024)' },
        ],
        whoItsFor: [
            'People with a few new, early pimples who want an OTC spot treatment',
            'People who prefer a precise pen applicator over a full-face product',
            'Not a substitute for a clinician visit for widespread, painful or hormonal acne that doesn\'t improve',
        ],
        howToUse: {
            intro: 'Per the Drug Facts label and Hero\'s product page.',
            steps: [
                'Cleanse skin thoroughly and let it dry.',
                'Twist the bottom of the pen to release the gel.',
                'Apply a thin layer over the affected area. Start once a day, then go up to two or three times a day if needed.',
                'If dryness or peeling is bothersome, cut back to once a day or every other day.',
            ],
            sourceUrl: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=869afe67-edae-4778-b990-08c2313d5aad',
            sourceLabel: 'DailyMed: Pimple Correct Drug Facts',
        },
        warnings: [
            'For external use only.',
            'Skin irritation and dryness are more likely if you use another topical acne medicine at the same time. If irritation occurs, use only one topical acne medicine at a time.',
            'Avoid contact with eyes; if contact occurs, rinse thoroughly with water.',
            'Do not use on open or irritated skin.',
            'Stop use and ask a doctor if irritation becomes severe.',
            'Pregnant: check with a doctor first (per Hero\'s FAQ).',
            'Keep out of reach of children. If swallowed, get medical help or contact a Poison Control Center right away.',
        ],
        communityReview: 'Hero\'s own product page shows 539 reviews but no numeric average rating. On Amazon the 0.34 fl oz listing shows 4.3 out of 5 stars from 177 ratings (read 2026-10-19).',
        effectiveness: 'Salicylic acid 2% is an FDA-allowed OTC acne ingredient with a conditional recommendation in the AAD\'s 2024 guidelines. No study of this product was found.',
        ingredientScience: [
            {
                name: 'Salicylic acid 2%',
                text: 'The FDA\'s OTC acne rules allow salicylic acid at 0.5% to 2%, so this is the top over-the-counter strength. The American Academy of Dermatology\'s 2024 guidelines, built on a systematic review, give topical salicylic acid a conditional recommendation, weaker than the strong recommendations for benzoyl peroxide, topical retinoids and topical antibiotics.',
                citations: [
                    { url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-333/subpart-D/section-333.310', label: 'FDA (21 CFR 333.310): Acne active ingredients, salicylic acid 0.5 to 2 percent' },
                    { url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:38300170%20AND%20SRC:MED&resultType=core&format=json', label: 'J Am Acad Dermatol (2024): Guidelines of care for the management of acne vulgaris, abstract via Europe PMC' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/diseases/acne/DIY/types-breakouts',
                text: 'American Academy of Dermatology: How to treat different types of acne',
                summary: 'AAD guidance: for papules, wash twice daily with a benzoyl peroxide or salicylic acid acne wash, and give treatment 6 to 8 weeks to work. General guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://herocosmetics.us/products/pimple-correct',
                        text: 'herocosmetics.us: Pimple Correct customer reviews',
                        summary: 'Hero\'s own product page shows 539 reviews; no average rating was shown.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },

    // Hero Cosmetics, Mighty Cleanser (salicylic acid 2% face wash), verified
    // against herocosmetics.us/products/mighty-cleanser and the DailyMed Drug
    // Facts (setid 5597df54-2e58-0d6a-e063-6394a90a1697, Church & Dwight,
    // NDC 10237-002-50, 150 mL) on 2026-10-19. It IS an OTC acne drug, so it
    // qualifies. No openFDA drug recall record for Church & Dwight mentions
    // Hero. Not a brand partner, no affiliate link.
    {
        id: 'p-hero-mighty-cleanser',
        name: 'Mighty Cleanser 2% Salicylic Acid Acne Face Wash',
        brand: 'Hero Cosmetics',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['acne', 'skin', 'pcos', 'cleanser', 'salicylic acid'],
        price: '$10.99 for 150 ml (5.07 fl oz) on herocosmetics.us',
        whereToBuy: ['Hero Cosmetics'],
        url: 'https://herocosmetics.us/products/mighty-cleanser',
        image: 'https://m.media-amazon.com/images/I/6140V0SQHdL._AC_SL500_.jpg', // from ayna's sheet; loads (checked 2026-10-19)
        summary: 'A 2% salicylic acid face wash sold as an over-the-counter acne drug. Hero says it clears active pimples, reduces the amount and severity of acne, and helps prevent new breakouts. Use it once or twice a day, massage onto wet skin, and rinse.',
        ingredients: 'Active: salicylic acid 2% (acne treatment). Inactive, per the Drug Facts label: water, propanediol, cocamidopropylamine oxide, cocamidopropyl betaine, potassium cocoate, glycerin, polyacrylate crosspolymer-6, sodium PCA, polyepsilon-lysine, 1,2-hexanediol, styrene/acrylates copolymer, coco-glucoside, caprylhydroxamic acid, trisodium ethylenediamine disuccinate, sodium benzoate, benzoic acid, citric acid, sodium hydroxide, sodium chloride.',
        safety: {
            fdaStatus: 'FDA-regulated over-the-counter acne drug with a Drug Facts label (DailyMed, Church & Dwight Co., Inc.). Salicylic acid 0.5% to 2% is an allowed acne active ingredient under the FDA\'s OTC acne rules.',
            materials: 'Rinse-off face wash in a 150 ml (5.07 fl oz) tube.',
            recalls: 'No recalls found. No openFDA drug recall record for Church & Dwight mentions Hero or Mighty Cleanser.',
            sideEffects: 'Dryness and irritation are possible, and more likely if you use another topical acne medicine at the same time.',
            opinionAlerts: 'Hero\'s "89% say skin feels soft" style numbers come from a consumer self-assessment of 171 people, not a clinical trial.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Hero Cosmetics; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Hero says Mighty Cleanser clears active pimples, reduces the amount and severity of acne, and helps prevent new breakouts. Its other numbers (for example 89% saying skin feels soft and 88% saying it feels less oily) come from a consumer self-assessment of 171 people, which measures how skin feels, not acne counts. No independent study of this product was found.\n\nThe active ingredient is salicylic acid at 2%, the highest strength the FDA allows in over-the-counter acne products. The American Academy of Dermatology suggests washing twice a day with a benzoyl peroxide or salicylic acid acne wash for red bumps, and giving treatment 6 to 8 weeks to work. Its 2024 guidelines give topical salicylic acid a conditional recommendation, weaker than the strong recommendations for benzoyl peroxide and topical retinoids.',
        doctorOpinionShort: 'A 2% salicylic acid acne face wash, the top OTC strength. The AAD lists salicylic acid washes as an option for red bumps but gives salicylic acid a weaker (conditional) recommendation than benzoyl peroxide or adapalene. Hero\'s percentages come from a 171-person self-assessment of how skin feels. No independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://herocosmetics.us/products/mighty-cleanser', label: 'herocosmetics.us: Mighty Cleanser, claims and consumer self-assessment' },
            { url: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5597df54-2e58-0d6a-e063-6394a90a1697', label: 'DailyMed: Hero Mighty Cleanser Drug Facts (salicylic acid 2%)', chipLabel: 'Drug Facts label' },
            { url: 'https://www.aad.org/public/diseases/acne/DIY/types-breakouts', label: 'American Academy of Dermatology: How to treat different types of acne' },
        ],
        whoItsFor: [
            'People with mild acne or oily, breakout-prone skin who want an OTC acne face wash',
            'Not a substitute for a clinician visit for widespread, painful or hormonal acne that doesn\'t improve',
        ],
        howToUse: {
            intro: 'Per the Drug Facts label.',
            steps: [
                'Use 1 to 2 times a day.',
                'Wet your hands and face.',
                'Gently massage onto the face, avoiding the eyes, and rinse thoroughly.',
                'If dryness or irritation occurs, use it less often; if it continues, stop using it.',
            ],
            sourceUrl: 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=5597df54-2e58-0d6a-e063-6394a90a1697',
            sourceLabel: 'DailyMed: Mighty Cleanser Drug Facts',
        },
        warnings: [
            'For external use only.',
            'Skin irritation and dryness are more likely if you use another topical acne medicine at the same time. If irritation occurs, use only one topical acne medicine at a time.',
            'Avoid the eyes.',
            'Keep out of reach of children. If swallowed, get medical help or contact a Poison Control Center right away.',
        ],
        communityReview: 'Hero\'s own product page shows 83 reviews but no numeric average rating. On Amazon the 5.07 fl oz listing shows 4.7 out of 5 stars from 53 ratings (read 2026-10-19).',
        effectiveness: 'Salicylic acid 2% is an FDA-allowed OTC acne ingredient with a conditional recommendation in the AAD\'s 2024 guidelines. Hero\'s own data is a 171-person self-assessment of skin feel. No study of this product was found.',
        ingredientScience: [
            {
                name: 'Salicylic acid 2%',
                text: 'The FDA\'s OTC acne rules allow salicylic acid at 0.5% to 2%, so this is the top over-the-counter strength. The American Academy of Dermatology\'s 2024 guidelines, built on a systematic review, give topical salicylic acid a conditional recommendation, weaker than the strong recommendations for benzoyl peroxide, topical retinoids and topical antibiotics. The AAD\'s patient guidance lists a salicylic acid or benzoyl peroxide wash, twice a day, as a first step for red bumps.',
                citations: [
                    { url: 'https://www.ecfr.gov/current/title-21/chapter-I/subchapter-D/part-333/subpart-D/section-333.310', label: 'FDA (21 CFR 333.310): Acne active ingredients, salicylic acid 0.5 to 2 percent' },
                    { url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EXT_ID:38300170%20AND%20SRC:MED&resultType=core&format=json', label: 'J Am Acad Dermatol (2024): Guidelines of care for the management of acne vulgaris, abstract via Europe PMC' },
                    { url: 'https://www.aad.org/public/diseases/acne/DIY/types-breakouts', label: 'American Academy of Dermatology: How to treat different types of acne' },
                ],
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'website',
                        url: 'https://herocosmetics.us/products/mighty-cleanser',
                        text: 'herocosmetics.us: Mighty Cleanser customer reviews',
                        summary: 'Hero\'s own product page shows 83 reviews; no average rating was shown.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },

    // ---- PR haul products added 2026-10-19 (hair thinning and scalp care), requested by Ameera. ----
    // Coco & Eve Tripeptide Hair Density Serum, verified against
    // cocoandeve.com/products/tripeptide-hair-density-serum (price, claims,
    // full ingredient list, how-to, FAQ, review count), the brand's blog post
    // cocoandeve.com/blogs/news/clinically-tested-hair-serum, and Amazon
    // B0DF2G14KF (2.03 fl oz, price, rating), all on 2026-10-19. Image from
    // ayna's sheet (loads). Studies read via NCBI E-utilities. openFDA drug
    // label, drug/food enforcement and device recall searches for the brand
    // returned no matches. Not a brand partner, no affiliate link.
    {
        id: 'p-cocoandeve-tripeptide-hair-density-serum',
        name: 'Coco & Eve Tripeptide Hair Density Serum',
        brand: 'Coco & Eve',
        category: 'hair',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['coco & eve', 'coco and eve', 'boost therapy', 'hair', 'scalp', 'hair serum', 'thinning', 'shedding', 'peptide', 'caffeine', 'redensyl', 'procapil', 'cosmetic'],
        price: '$35 for 2.03 fl oz (60 ml) on cocoandeve.com and on Amazon',
        whereToBuy: ['cocoandeve.com', 'Amazon'],
        url: 'https://www.cocoandeve.com/products/tripeptide-hair-density-serum',
        whereToBuyLinks: {
            'cocoandeve.com': 'https://www.cocoandeve.com/products/tripeptide-hair-density-serum',
            Amazon: 'https://www.amazon.com/dp/B0DF2G14KF',
        },
        image: 'https://m.media-amazon.com/images/I/51xmpBxUvcL._AC_SL500_.jpg', // from ayna's sheet
        summary: 'A lightweight, leave-in scalp serum in a 2.03 fl oz (60 ml) bottle from Coco & Eve\'s Boost Therapy line. Coco & Eve says it uses two branded ingredient blends, Redensyl and Procapil, plus caffeine, panthenol and a probiotic ferment to reduce thinning and shedding and make hair look denser. Apply a few drops to a clean, dry scalp once a day, ideally at bedtime, and don\'t rinse. It is sold as a cosmetic for both women and men.',
        ingredients: 'Full ingredient list per Coco & Eve: Aqua (Water), Butylene Glycol, Glycerin, Propanediol, Panthenol, 1,2-Hexanediol, Caffeine, Trisodium Ethylenediamine Disuccinate, PPG-26-Buteth-26, PEG-40 Hydrogenated Castor Oil, Caprylhydroxamic Acid, Sorbitol, Lactic Acid, Cocos Nucifera Oil, Xanthan Gum, Ceratonia Siliqua Gum, Larix Europaea Wood Extract, Glycine, Sodium Metabisulfite, Zinc Chloride, Camellia Sinensis Leaf Extract, Apigenin, Oleanolic Acid, Lactobacillus Ferment Lysate, Biotinoyl Tripeptide-1, Sodium Benzoate, Potassium Sorbate. Coco & Eve\'s FAQ also mentions red clover extract, which is not in this list.',
        safety: {
            fdaStatus: 'Sold as a cosmetic; not an FDA-approved drug for hair loss. The FDA-approved over-the-counter treatment for women is minoxidil (see below).',
            materials: '2.03 fl oz (60 ml) dropper bottle, leave-in. Coco & Eve says it has no added fragrance and is vegan, sulfate-free, silicone-free and paraben-free; ayna did not independently verify those claims. It contains coconut oil and a small amount of sodium metabisulfite (a sulfite preservative).',
            recalls: 'No recalls found.',
            sideEffects: 'Coco & Eve\'s product page lists no warnings. Patch test first if you have a sensitive scalp, and stop if you get redness or itching.',
            opinionAlerts: 'The headline numbers (+214% hair growth in 10 days, +10,200 new hairs in 3 months, +29% denser hair) are labeled by Coco & Eve as "Redensyl testing," meaning tests of the ingredient, not of this serum. Coco & Eve also calls the serum "clinically proven" but doesn\'t say how many people were tested, for how long, or whether there was a comparison group.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Coco & Eve; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Coco & Eve says the serum is clinically proven to visibly increase hair density in four weeks and to stimulate hair growth activity in 10 days, and that it reduces hair loss and gives thicker hair bulbs after 4 months. The specific percentages on the page come from testing of Redensyl, one of its ingredient blends, not of this serum. Coco & Eve doesn\'t publish how many people tested the serum itself or whether there was a comparison group, and no published study of this product was found.\n\nThe best human evidence for Redensyl is a 2020 Greek trial of 44 adults with pattern hair loss (41 finished, 23 of them women). They used a lotion combining Redensyl with a second active (Sepicontrol A5) or a vehicle lotion twice a day for 24 weeks. In the active group, the ratio of growing to resting hairs rose from 2.25 to 6.02 and most people rated themselves moderately improved. It was single-blinded, tested a combination product rather than Redensyl alone, and the abstract doesn\'t report how the active group compared with the vehicle group.\n\nCaffeine has one notable trial: in 210 men with pattern hair loss, a 0.2% caffeine scalp liquid did about as well as 5% minoxidil after 6 months. That trial was in men and wasn\'t blinded, and Coco & Eve doesn\'t publish its caffeine concentration. No published study of Procapil on its own, in women, was found that ayna could read.\n\nIf you have thinning hair, a dermatologist can check for causes and discuss treatments with stronger evidence. Minoxidil is the over-the-counter hair-loss treatment the FDA has approved for women.',
        doctorOpinionShort: 'The big percentages are from tests of one ingredient (Redensyl), not this serum. Redensyl\'s best human study was a 44-person trial of a combination lotion, and caffeine\'s best trial was in men. No published study of this serum was found. Minoxidil is the FDA-approved OTC option for women.',
        doctorOpinionCitations: [
            { url: 'https://www.cocoandeve.com/products/tripeptide-hair-density-serum', label: 'cocoandeve.com: Tripeptide Hair Density Serum, ingredients and claims' },
            { url: 'https://www.cocoandeve.com/blogs/news/clinically-tested-hair-serum', label: 'cocoandeve.com: 10 Days, 214% Fuller Hair (brand blog post)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/32473084/', label: 'PubMed: A randomized, single-blinded, vehicle-controlled study of a topical active blend (Redensyl + Sepicontrol A5) in androgenetic alopecia (Dermatol Ther 2020)', chipLabel: 'Redensyl combination lotion, 44 adults (2020)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29055953/', label: 'PubMed: Caffeine-based topical liquid 0.2% vs minoxidil 5% in male androgenetic alopecia, open-label randomized trial (Skin Pharmacol Physiol 2017)', chipLabel: 'Caffeine vs minoxidil trial, 210 men (2017)' },
            { url: 'https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=021812', label: 'FDA (Drugs@FDA): NDA 021812, Women\'s Rogaine 5% minoxidil foam, over-the-counter', chipLabel: 'FDA: minoxidil for women' },
        ],
        whoItsFor: [
            'People with thinning hair or extra shedding who want a non-drug, leave-in cosmetic scalp serum',
            'People who prefer a formula with no added fragrance',
            'Not a substitute for seeing a dermatologist about new, sudden or patchy hair loss',
        ],
        howToUse: {
            intro: 'Per Coco & Eve: use once a day, ideally at bedtime.',
            steps: [
                'Apply a few drops to a clean, dry scalp, focusing on the areas that need extra care.',
                'Gently massage it into the scalp.',
                'Don\'t rinse it off.',
            ],
            sourceUrl: 'https://www.cocoandeve.com/products/tripeptide-hair-density-serum',
            sourceLabel: 'cocoandeve.com: Tripeptide Hair Density Serum',
        },
        warnings: [
            'Contains coconut oil and sodium metabisulfite (a sulfite): patch test first if you react to either.',
            'Already using minoxidil or another medicated hair-loss treatment: check with a healthcare professional before combining.',
            'Sudden, patchy or postpartum hair loss: see a dermatologist rather than self-treating.',
        ],
        communityReview: 'On cocoandeve.com it shows 4.8 out of 5 stars from 317 reviews. On Amazon it has 4.4 out of 5 stars from 297 ratings; 71% are five stars and 7% are one star. Amazon reviews range from "my hair is NOTICEABLY thicker" after a couple of weeks to "Doesn\'t work" and "makes it soo greasy."',
        effectiveness: 'No published study of this serum was found. Its headline numbers come from tests of Redensyl, whose best human study tested a combination lotion in 44 adults. Caffeine did about as well as minoxidil in one trial in men.',
        ingredientScience: [
            {
                name: 'Redensyl',
                text: 'Coco & Eve says Redensyl targets hair follicle stem cells and that Redensyl testing showed +214% hair growth in 10 days and +29% denser hair; those are ingredient tests, not tests of this serum. In a 2020 single-blinded trial, 44 adults with pattern hair loss (41 finished: 18 men, 23 women) used a lotion with Redensyl plus a second active, Sepicontrol A5, or a vehicle lotion twice daily for 24 weeks. In the active group (n = 26), the ratio of growing to resting hairs rose from 2.25 to 6.02, 7.7% had great improvement and 73.1% moderate improvement, with no significant side effects. The product combined two actives, and the abstract doesn\'t compare the active group with the vehicle group.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/32473084/', label: 'PubMed: A randomized, single-blinded, vehicle-controlled study of a topical active blend in the treatment of androgenetic alopecia (Katoulis et al., Dermatol Ther 2020)' },
                ],
            },
            {
                name: 'Caffeine',
                text: 'In a 2017 open-label, randomized trial of 210 men with pattern hair loss, a 0.2% caffeine scalp liquid was not inferior to 5% minoxidil after 6 months: the share of hairs in the growth phase improved 10.59% with caffeine and 11.68% with minoxidil. The trial was in men only and wasn\'t blinded. Coco & Eve doesn\'t publish its caffeine concentration.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/29055953/', label: 'PubMed: An open-label randomized multicenter study assessing the noninferiority of a caffeine-based topical liquid 0.2% versus minoxidil 5% solution in male androgenetic alopecia (Dhurat et al., 2017)' },
                ],
            },
            {
                name: 'Procapil (biotinoyl tripeptide-1, apigenin, oleanolic acid)',
                text: 'Coco & Eve says Procapil combats follicle aging and prevents hair loss, and that it gives thicker hair bulbs after 4 months. All three Procapil components appear in the ingredient list. ayna did not find a published study of Procapil on its own, in women, that it could read, so this claim is the brand\'s.',
                citations: [
                    { url: 'https://www.cocoandeve.com/products/tripeptide-hair-density-serum', label: 'cocoandeve.com: Tripeptide Hair Density Serum, Procapil claim' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/diseases/hair-loss/types/female-pattern',
                text: 'American Academy of Dermatology: Female pattern hair loss',
                summary: 'The AAD says the FDA has approved 2% and 5% minoxidil as a non-prescription treatment for female pattern hair loss and calls it the most-recommended treatment. This is general guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0DF2G14KF',
                        text: 'Amazon: Coco & Eve Tripeptide Hair Density Serum reviews',
                        summary: '4.4 out of 5 stars from 297 ratings on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.cocoandeve.com/products/tripeptide-hair-density-serum',
                        text: 'cocoandeve.com: Tripeptide Hair Density Serum customer reviews',
                        summary: '4.8 out of 5 stars from 317 reviews on Coco & Eve\'s own site.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },

    // Najeau Follicle Drops, verified against Amazon B0FM1JK11M (title,
    // bullets, description, safety info, directions, price, unit price,
    // rating) and the SalonCentric listing 6039-NAJ1003 (full ingredient list,
    // sold by Najeau) on 2026-10-19. najeau.com/products/follicle-drops
    // redirected to najeau.com/lander, so there is no brand product page to
    // link and `url` is the Amazon listing. Size 1.7 fl oz is worked out from
    // Amazon's own unit price ($49.00 at $28.82/fl oz). Image from ayna's
    // sheet (loads). openFDA searches for the brand returned no matches. Not
    // a brand partner, no affiliate link.
    {
        id: 'p-najeau-follicle-drops',
        name: 'Najeau Follicle Drops Pre-Shampoo Scalp Oil',
        brand: 'Najeau',
        category: 'hair',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['najeau', 'follicle drops', 'hair', 'scalp', 'scalp oil', 'pre-shampoo', 'dry scalp', 'buildup', 'olive oil', 'cosmetic'],
        price: '$49.00 for 1.7 fl oz on Amazon',
        whereToBuy: ['Amazon'],
        url: 'https://www.amazon.com/dp/B0FM1JK11M',
        image: 'https://m.media-amazon.com/images/I/512842JgyVL._AC_SL500_.jpg', // from ayna's sheet
        summary: 'A pre-shampoo scalp oil in a glass dropper bottle, made from cold-pressed olive, castor, soybean, basil and neem seed oils with aloe. You apply it to a dry scalp, leave it on for several minutes, then shampoo it out, 1 to 3 times a week. Najeau says it breaks down oil and product buildup and leaves the scalp hydrated and pH balanced, and also that it increases blood flow to the follicle and stimulates hair growth.',
        ingredients: 'Full ingredient list per Najeau\'s SalonCentric listing: Olea Europaea (Olive) Fruit Oil, Ricinus Communis (Castor) Seed Oil, Glycine Soja (Soybean) Oil, Ocimum Basilicum (Basil) Oil, Aloe Barbadensis Leaf Juice, Azadirachta Indica Seed Oil, Tocopherol, Linalool, Geraniol, Eugenol, Citral, Limonene. The Amazon listing names rosemary oil as a key ingredient, but rosemary is not in this list.',
        safety: {
            fdaStatus: 'Sold as a cosmetic; not an FDA-approved drug for hair loss.',
            materials: 'Plant-oil blend in a glass dropper bottle, rinsed out with shampoo. Amazon\'s title calls it fragrance-free, but the ingredient list ends with linalool, geraniol, eugenol, citral and limonene, which are fragrance allergens (likely from the basil oil). It also contains soybean oil.',
            recalls: 'No recalls found.',
            sideEffects: 'Per Najeau\'s Amazon safety information: for external use only, avoid the eyes, patch test before use, and ask a physician first if pregnant, nursing or under medical treatment.',
            opinionAlerts: 'Najeau\'s Amazon listing says it is "consumer tested for visible results in 4 weeks" but gives no numbers or study details. Its growth claims (more blood flow to the follicle, stimulates growth) have no study behind them that ayna could find.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Najeau; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Najeau says Follicle Drops break down product and oil buildup at the root, leave the scalp pH balanced and hydrated, increase blood flow to the hair bulb and follicle, and stimulate hair growth. It says consumer testing showed a less dry, itchy and oily scalp in 4 weeks, but gives no numbers, sample size or method. No study of this product was found.\n\nThis is a rinse-off oil used 1 to 3 times a week, so it is best thought of as a scalp-conditioning and cleansing step. ayna did not find research it could read showing that the oils in it (olive, castor, soybean, basil, neem) grow hair or reduce hair loss in people, so the growth claims are the brand\'s. The rosemary oil named on Amazon is not in the published ingredient list.\n\nThe ingredient list also contains linalool, geraniol, eugenol, citral and limonene, which are common fragrance allergens, even though the product is sold as fragrance-free. If you have a fragrance or soy allergy, check with a dermatologist first.\n\nIf you have thinning hair, a dermatologist can check for causes and discuss treatments with stronger evidence. Minoxidil is the over-the-counter hair-loss treatment the FDA has approved for women.',
        doctorOpinionShort: 'A rinse-off pre-shampoo oil for dry scalp and buildup. Its hair-growth claims have no study behind them that ayna could find, the rosemary named on Amazon isn\'t in the ingredient list, and it contains fragrance allergens despite a fragrance-free label.',
        doctorOpinionCitations: [
            { url: 'https://www.amazon.com/dp/B0FM1JK11M', label: 'Amazon: Najeau Follicle Drops, claims, directions and safety information' },
            { url: 'https://www.saloncentric.com/6039-NAJ1003.html', label: 'SalonCentric: Najeau Follicle Drops, full ingredient list' },
            { url: 'https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=021812', label: 'FDA (Drugs@FDA): NDA 021812, Women\'s Rogaine 5% minoxidil foam, over-the-counter', chipLabel: 'FDA: minoxidil for women' },
        ],
        whoItsFor: [
            'People with a dry scalp or product buildup who like a pre-wash scalp oil routine',
            'Not a hair-loss treatment: for thinning hair, see a dermatologist about options with evidence',
            'Not a good fit if you\'re allergic to soy or to common fragrance allergens such as linalool or limonene',
        ],
        howToUse: {
            intro: 'Per Najeau: use 1 to 3 times a week, or as needed, before shampooing.',
            steps: [
                'Shake well.',
                'Part dry hair into sections and apply 3 to 6 drops in each section.',
                'Massage gently into the scalp with your fingers or a scalp massager.',
                'Leave on for several minutes, then double shampoo and condition as usual.',
            ],
            sourceUrl: 'https://www.amazon.com/dp/B0FM1JK11M',
            sourceLabel: 'Amazon: Najeau Follicle Drops',
        },
        warnings: [
            'External use only. Avoid the eyes; if contact occurs, rinse thoroughly with water (per Najeau).',
            'Patch test before use (per Najeau). Contains soybean oil and the fragrance allergens linalool, geraniol, eugenol, citral and limonene.',
            'Pregnant, nursing or under medical treatment: consult a physician before use (per Najeau).',
            'Keep out of reach of children.',
        ],
        communityReview: 'On Amazon it has 4.5 out of 5 stars from 25 ratings; 57% are five stars and none are one or two stars. All of the reviews shown on the page are Amazon Vine reviews of a free product. Reviewers mostly describe a less dry scalp and an oil that rinses clean, and several say the herbal smell is strong. No reviews were found on a Najeau brand site.',
        effectiveness: 'A cleansing and conditioning scalp oil. No study of this product was found, and ayna found no human evidence it could read that its oils grow hair.',
        ingredientScience: [],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/diseases/hair-loss/types/female-pattern',
                text: 'American Academy of Dermatology: Female pattern hair loss',
                summary: 'The AAD says the FDA has approved 2% and 5% minoxidil as a non-prescription treatment for female pattern hair loss and calls it the most-recommended treatment. This is general guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0FM1JK11M',
                        text: 'Amazon: Najeau Follicle Drops reviews',
                        summary: '4.5 out of 5 stars from 25 ratings as of October 2026; the reviews shown are Vine reviews of a free product.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // Refilled Hair Recovery Cytokine Effector Plus (Amazon title: "cADPR
    // Effector Plus Hair Growth Spot Serum"), verified against Amazon
    // B0GMRT3ZLD (title, bullets, ingredients and safety info as Amazon shows
    // them, price, unit price, rating, manufacturer cnf Co., Ltd.) and Ulta
    // (ulta.com/p/hair-recovery-cytokine-effector-plus-pimprod2057765: full
    // ingredient list, claims, how-to, 0.51 oz, $29.00) on 2026-10-19. No
    // Refilled brand product page was found, so `url` is the Amazon listing.
    // Image from ayna's sheet (loads). PubMed has no study of cyclic ADP-ribose
    // and hair (one unrelated hit). openFDA searches returned no matches. Not
    // a brand partner, no affiliate link.
    {
        id: 'p-refilled-cytokine-effector-plus',
        name: 'Refilled Hair Recovery Cytokine Effector Plus (Spot Serum)',
        brand: 'Refilled',
        category: 'hair',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['refilled', 'effector plus', 'cadpr', 'cytokine', 'hair', 'scalp', 'hair serum', 'thinning', 'hairline', 'edges', 'roll-on', 'korean', 'cosmetic'],
        price: '$27.99 for 0.51 fl oz (15 ml) on Amazon; $29.00 at Ulta',
        whereToBuy: ['Amazon', 'Ulta'],
        url: 'https://www.amazon.com/dp/B0GMRT3ZLD',
        whereToBuyLinks: {
            Amazon: 'https://www.amazon.com/dp/B0GMRT3ZLD',
            Ulta: 'https://www.ulta.com/p/hair-recovery-cytokine-effector-plus-pimprod2057765',
        },
        image: 'https://m.media-amazon.com/images/I/61AgTzHlPLL._AC_SL500_.jpg', // from ayna's sheet
        summary: 'A small Korean roll-on scalp serum (0.51 fl oz, 15 ml) with a stainless steel roller, meant for spot use on the hairline, part, crown or brows. Refilled builds it around cADPR (cyclic adenosine diphosphate ribose), which it calls patented technology, plus salicylic acid, menthol, biotin and botanical extracts. Refilled says to use it 2 to 4 times a day without rinsing. It is sold as a cosmetic.',
        ingredients: 'Full ingredient list per Ulta: Water, Alcohol Denat., Glycerin, Dipropylene Glycol, Butylene Glycol, Lecithin, Dioscorea Japonica Root Extract, Viola Mandshurica Flower Extract, Aloe Barbadensis Leaf Extract, Ulmus Davidiana Root Extract, Laminaria Japonica Extract, Menthol, 1,2-Hexanediol, Salicylic Acid, Panthenol, Fragrance, Arginine, Caprylyl Glycol, Polysorbate 20, Caprylic/Capric Triglyceride, Nicotinic Acid Adenine Dinucleotide Phosphate, Xylitol, Cannabis Sativa Seed Oil, Houttuynia Cordata Extract, Ginkgo Biloba Leaf Extract, Citrus Limon (Lemon) Fruit Extract, Chamaecyparis Obtusa Leaf Extract, Bambusa Vulgaris Extract, Pinus Densiflora Leaf Extract, Thuja Orientalis Extract, Glycine, Propolis Extract, Citrus Nobilis (Mandarin Orange) Oil, Serine, Glutamic Acid, Glutathione, Zingiber Officinale (Ginger) Root Oil, Cyclic Adenosine Diphosphate Ribose, Aspartic Acid, Leucine, Polyglyceryl-4 Caprate, Alanine, Lysine, Tyrosine, Phenylalanine, Proline, Threonine, Valine, Isoleucine, Histidine, Cysteine, Methionine, Niacinamide, Biotin, Inositol, Sodium Ascorbyl Phosphate, Tocopherol, Limonene, Linalool. Amazon lists the ingredients only as "cADPR. NAD+. Salicylic Acid. Biotin. Cytokine." The full list has no ingredient named cytokine and no NAD+ (it has a related compound, nicotinic acid adenine dinucleotide phosphate).',
        safety: {
            fdaStatus: 'Sold as a cosmetic; not an FDA-approved drug for hair loss.',
            materials: '0.51 fl oz (15 ml) glass roll-on bottle with a stainless steel roller. The second ingredient is denatured alcohol, and it contains salicylic acid, menthol, added fragrance, limonene and linalool. Amazon says it is non-returnable and shipped as a hazardous material.',
            recalls: 'No recalls found.',
            sideEffects: 'Per Refilled\'s Amazon safety information: external use only; stop if rash or irritation occurs when the skin is exposed to direct sunlight and see a doctor if it continues; don\'t apply on wounds; rinse right away if it gets in your eyes. Ulta adds: stop if you get excessive discomfort or irritation, and don\'t use on damaged or broken skin.',
            opinionAlerts: 'Refilled\'s results (89.90% less hair fall in concentrated areas, 11.65% less scalp redness and irritation, visible improvement after 2 weeks) are described only as "clinical testing with dermatologist supervision," with no details on how many people took part or whether there was a comparison group. No published research on cADPR for hair was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Refilled; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Refilled says, based on clinical testing with dermatologist supervision, that this serum reduced hair fall along the hairline, crown and part by 89.90%, reduced scalp redness and irritation by 11.65%, and visibly improved problem areas after 2 weeks. It doesn\'t say how many people were tested, for how long, or whether there was a comparison group, and no published study of this product was found.\n\nThe ingredient Refilled builds the product around, cADPR (cyclic adenosine diphosphate ribose), has no published hair research that ayna could find: a PubMed search for it with hair returned one unrelated study. The listing also says the serum contains cytokines and NAD+, but neither appears by name in the full ingredient list on Ulta. Biotin is a common hair ingredient, but a 2017 review found evidence for it only in people with a deficiency or specific hair and nail conditions, and that review was about biotin taken by mouth, not on the scalp.\n\nThe formula is alcohol-based and contains salicylic acid, menthol and fragrance, and Refilled says to use it up to 4 times a day. That is a lot of exposure for a sensitive scalp or hairline, so patch test first.\n\nIf you have thinning hair, a dermatologist can check for causes and discuss treatments with stronger evidence. Minoxidil is the over-the-counter hair-loss treatment the FDA has approved for women.',
        doctorOpinionShort: 'Refilled\'s results come from unpublished testing with no details. Its headline ingredient, cADPR, has no published hair research ayna could find, and the "cytokine" and "NAD+" on Amazon aren\'t named in the full ingredient list. Alcohol-based with salicylic acid, menthol and fragrance.',
        doctorOpinionCitations: [
            { url: 'https://www.ulta.com/p/hair-recovery-cytokine-effector-plus-pimprod2057765', label: 'Ulta: Refilled Hair Recovery Cytokine Effector Plus, ingredients, claims and directions' },
            { url: 'https://www.amazon.com/dp/B0GMRT3ZLD', label: 'Amazon: Refilled cADPR Effector Plus, listing and safety information' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/28879195/', label: 'PubMed: A review of the use of biotin for hair loss (Skin Appendage Disord 2017)', chipLabel: 'Biotin review (2017)' },
            { url: 'https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=021812', label: 'FDA (Drugs@FDA): NDA 021812, Women\'s Rogaine 5% minoxidil foam, over-the-counter', chipLabel: 'FDA: minoxidil for women' },
        ],
        whoItsFor: [
            'People who want a small, cooling roll-on for a thinning hairline, part or crown and are comfortable with brand-only evidence',
            'Not ideal for a sensitive scalp: it contains alcohol, salicylic acid, menthol and fragrance',
            'Not a substitute for seeing a dermatologist about new, sudden or patchy hair loss',
        ],
        howToUse: {
            intro: 'Per Refilled (Ulta listing): use 2 to 4 times a day, about every 3 to 4 hours, day or evening.',
            steps: [
                'Apply directly to thinning areas: hairline, crown, part line or eyebrows.',
                'Gently massage into the scalp with your fingertips in circular motions.',
                'Let it absorb fully. No rinsing needed.',
            ],
            sourceUrl: 'https://www.ulta.com/p/hair-recovery-cytokine-effector-plus-pimprod2057765',
            sourceLabel: 'Ulta: Refilled Hair Recovery Cytokine Effector Plus',
        },
        warnings: [
            'External use only. Rinse right away if it gets in your eyes (per Refilled).',
            'Stop using it if you get a rash or irritation, including with sun exposure, and see a doctor if it continues (per Refilled).',
            'Don\'t apply on wounds, damaged or broken skin (per Refilled).',
            'Contains alcohol, salicylic acid, menthol and fragrance: patch test first if you have a sensitive scalp.',
            'Keep away from children under 3 (per Refilled).',
        ],
        communityReview: 'On Amazon it has 4.6 out of 5 stars from 29 ratings; 72% are five stars and none are one or two stars. All of the reviews shown on the page are Amazon Vine reviews of a free product. Reviewers mostly mention the cooling feel, the easy roller and less itching; a few say they see a little new growth after a few weeks, and others haven\'t noticed a change in density yet. ayna did not capture review numbers from Ulta.',
        effectiveness: 'No published study of this serum or of cADPR for hair was found. Refilled\'s results come from unpublished testing with no details on size or design.',
        ingredientScience: [
            {
                name: 'cADPR (cyclic adenosine diphosphate ribose)',
                text: 'Refilled calls this patented Korean scalp technology that supports healthier-looking hair and stronger-looking roots. A PubMed search for cyclic ADP-ribose and hair returned one study, about hair cells in the inner ear, not scalp hair. ayna found no published research on it for hair loss.',
                citations: [
                    { url: 'https://www.ulta.com/p/hair-recovery-cytokine-effector-plus-pimprod2057765', label: 'Ulta: Refilled Effector Plus, ingredient claims' },
                ],
            },
            {
                name: 'Biotin',
                text: 'Refilled says biotin helps hair look thicker and fuller. A 2017 review of biotin for hair and nails found 18 reported cases where it helped, all in people with an underlying problem such as biotin deficiency, and concluded there isn\'t enough evidence to support it in healthy people. The review covered biotin taken by mouth, not applied to the scalp.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28879195/', label: 'PubMed: A review of the use of biotin for hair loss (Patel et al., Skin Appendage Disord 2017)' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/diseases/hair-loss/types/female-pattern',
                text: 'American Academy of Dermatology: Female pattern hair loss',
                summary: 'The AAD says the FDA has approved 2% and 5% minoxidil as a non-prescription treatment for female pattern hair loss and calls it the most-recommended treatment. This is general guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0GMRT3ZLD',
                        text: 'Amazon: Refilled cADPR Effector Plus reviews',
                        summary: '4.6 out of 5 stars from 29 ratings as of October 2026; the reviews shown are Vine reviews of a free product.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // BIGVITA Scalp Serum+, verified against bigvita.com/products/scalp-serum
    // (price, claims incl. "4% AnaGain", how-to, FAQ, review stats), Amazon
    // B0D82212P3 (title, bullets, price, unit price, rating, manufacturer
    // LUNA INC) and H-E-B (heb.com/product-detail/.../15992170: full
    // ingredient list, 1.02 oz) on 2026-10-19. Size: Amazon's unit price
    // ($39.00 at $38.24/fl oz) and H-E-B both give 1.02 oz; BIGVITA says a box
    // holds three bottles. Image from ayna's sheet (loads). Studies read via
    // NCBI E-utilities. openFDA searches returned no matches. Not a brand
    // partner, no affiliate link.
    {
        id: 'p-bigvita-scalp-serum-plus',
        name: 'BIGVITA Scalp Serum+',
        brand: 'BIGVITA',
        category: 'hair',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['bigvita', 'scalp serum+', 'anagain', 'pea sprout', 'hair', 'scalp', 'hair serum', 'thinning', 'shedding', 'biotin', 'centella', 'cosmetic'],
        price: '$39.00 for a box of three bottles (1.02 fl oz total) on bigvita.com and Amazon',
        whereToBuy: ['bigvita.com', 'Amazon'],
        url: 'https://www.bigvita.com/products/scalp-serum',
        whereToBuyLinks: {
            'bigvita.com': 'https://www.bigvita.com/products/scalp-serum',
            Amazon: 'https://www.amazon.com/dp/B0D82212P3',
        },
        image: 'https://m.media-amazon.com/images/I/51O7+TsgxZL._AC_SL500_.jpg', // from ayna's sheet
        summary: 'A leave-in, water-based scalp serum that comes as a box of three small bottles (1.02 fl oz in total) with a massaging applicator tip. BIGVITA says it contains 4% AnaGain (a pea sprout extract) plus centella, Biota orientalis leaf extract, biotin and niacinamide, and that it reduces shedding and supports thicker-looking hair. BIGVITA says each bottle lasts about 5 to 10 days, so a box lasts roughly 2 to 4 weeks. It is sold as a cosmetic.',
        ingredients: 'Full ingredient list per H-E-B: Water/Aqua/Eau, Ethyl Alcohol, Butylene Glycol, Niacinamide, Pentylene Glycol, Allantoin, Centella Asiatica Leaf Extract, Pisum Sativum (Pea) Sprout Extract, Biotin, Biota Orientalis Leaf Extract, PEG-40, Hydrogenated Castor Oil, Betaine, Disodium EDTA, Fragrance/Parfum, Citric Acid, Phenoxyethanol, Ethylhexylglycerin. BIGVITA says the pea sprout extract (AnaGain) is at 4%.',
        safety: {
            fdaStatus: 'Sold as a cosmetic; not an FDA-approved drug for hair loss.',
            materials: 'Three small bottles plus a massaging applicator tip. The second ingredient is alcohol, and it contains added fragrance (BIGVITA describes a "citron noir" scent). BIGVITA calls it clean, non-toxic and hormone-free; ayna did not independently verify those claims. BIGVITA says it is made in Canada.',
            recalls: 'No recalls found.',
            sideEffects: 'Per the H-E-B and Amazon listings: external use only, avoid contact with eyes. Contains alcohol and fragrance, so patch test first if you have a sensitive scalp.',
            opinionAlerts: 'BIGVITA says AnaGain is "clinically studied." The study ayna read applied a 2% pea sprout fluid to 10 volunteers and measured hair-related gene activity, not hair growth, and was run by the ingredient\'s maker. The hair-loss result in that paper came from a pea sprout supplement taken by mouth, not a scalp serum.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from BIGVITA; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BIGVITA says 4% AnaGain is clinically studied to reactivate hair growth by shortening the resting phase and extending the growth phase, that centella improves scalp circulation, that Biota orientalis supports the growth cycle, and that the serum reduces shedding. No study of this product was found.\n\nThe main human study of pea sprout extract is a 2020 short report by researchers at Mibelle, the company that makes AnaGain. Applying a fluid with 2% pea sprout extract to the scalp of 10 volunteers raised the activity of two hair-related genes (FGF7 and noggin). That measured gene activity, not hair growth. In a separate pilot of 21 people, a 100 mg pea sprout supplement taken by mouth for 8 weeks reduced hair loss. A 2025 study found pea sprout extract supported hair growth signals in human hair cells and in mice. None of this tested a scalp serum for hair growth in people.\n\nCentella has lab evidence only: in a 2017 study, a centella extract helped lab-grown human hair papilla cells. Biotin helps hair mainly in people who are deficient, according to a 2017 review of oral biotin. ayna did not read a study of Biota orientalis for hair loss in people; BIGVITA\'s own page says more human studies are needed.\n\nIf you have thinning hair, a dermatologist can check for causes and discuss treatments with stronger evidence. Minoxidil is the over-the-counter hair-loss treatment the FDA has approved for women.',
        doctorOpinionShort: 'Pea sprout extract (AnaGain) has a 10-person scalp study that measured gene activity, not hair growth, run by the ingredient\'s maker; its hair-loss result came from a supplement taken by mouth. Centella has lab evidence only. No study of this serum was found.',
        doctorOpinionCitations: [
            { url: 'https://www.bigvita.com/products/scalp-serum', label: 'bigvita.com: Scalp Serum+, claims, FAQ and how to use' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/31680356/', label: 'PubMed: Clinical evaluation of pea sprout extract in the treatment of hair loss (Phytother Res 2020)', chipLabel: 'Pea sprout extract, 10 + 21 people (2020)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41309367/', label: 'PubMed: Pea sprout extract promotes hair follicle regeneration, cell and mouse study (J Microbiol Biotechnol 2025)', chipLabel: 'Pea sprout cell and mouse study (2025)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29032741/', label: 'PubMed: Titrated extract of Centella asiatica in cultured human dermal papilla cells (Biosci Biotechnol Biochem 2017)', chipLabel: 'Centella lab study (2017)' },
            { url: 'https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=021812', label: 'FDA (Drugs@FDA): NDA 021812, Women\'s Rogaine 5% minoxidil foam, over-the-counter', chipLabel: 'FDA: minoxidil for women' },
        ],
        whoItsFor: [
            'People with shedding or thinning hair who want a light, non-greasy cosmetic scalp serum with a massaging tip',
            'People comfortable with early-stage ingredient evidence',
            'Not a substitute for seeing a dermatologist about new, sudden or patchy hair loss',
        ],
        howToUse: {
            intro: 'Per BIGVITA: use daily. A bottle lasts about 7 to 10 days with daily use.',
            steps: [
                'Remove the cap from the serum bottle and attach the included applicator.',
                'Apply the serum directly to your scalp.',
                'Gently massage it in. No rinsing needed.',
            ],
            sourceUrl: 'https://www.bigvita.com/products/scalp-serum',
            sourceLabel: 'bigvita.com: Scalp Serum+',
        },
        warnings: [
            'External use only; avoid contact with eyes (per the H-E-B listing).',
            'Contains alcohol and added fragrance: patch test first if you have a sensitive scalp.',
            'Already using minoxidil or another medicated hair-loss treatment: check with a healthcare professional before combining.',
        ],
        communityReview: 'On bigvita.com it shows 4.69 out of 5 stars from 70 reviews (48 five-star and 22 four-star). On Amazon it has 3.7 out of 5 stars from 34 ratings; 53% are five stars and 18% are one star. Reviews on BIGVITA\'s site include "less shedding and even some baby hairs growing in" and "noticed a slight change" after a week.',
        effectiveness: 'No study of this serum was found. Pea sprout extract has a small scalp study that measured gene activity, plus a small oral-supplement pilot, both from the ingredient\'s maker.',
        ingredientScience: [
            {
                name: 'Pea sprout extract (AnaGain)',
                text: 'BIGVITA says 4% AnaGain is clinically studied to shorten the resting phase and extend the growth phase. In a 2020 short report by Mibelle, AnaGain\'s maker, a fluid with 2% pea sprout extract applied to a scalp zone of 10 volunteers raised the activity of two hair-related genes, FGF7 by 56% and noggin by 85%. That measured gene activity, not hair growth. A separate pilot in 21 people found a 100 mg daily pea sprout supplement taken by mouth reduced hair loss after 28 days. A 2025 study found pea sprout extract activated hair growth signaling in human hair papilla cells and in mice.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31680356/', label: 'PubMed: Short communication, clinical evaluation of pea sprout extract in the treatment of hair loss (Grothe et al., Phytother Res 2020)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/41309367/', label: 'PubMed: Pea sprout extract promotes hair follicle regeneration via anagen phase prolongation (Kim et al., J Microbiol Biotechnol 2025)' },
                ],
            },
            {
                name: 'Centella asiatica',
                text: 'BIGVITA says centella improves scalp circulation and nutrient delivery to follicles. In a 2017 lab study, a titrated centella extract increased the growth and size of human hair papilla cells grown as 3D spheres. It hasn\'t been tested for hair loss in people in any study ayna read.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/29032741/', label: 'PubMed: Titrated extract of Centella asiatica increases hair inductive property in 3D spheroid cultured human dermal papilla cells (2017)' },
                ],
            },
            {
                name: 'Biotin',
                text: 'BIGVITA says biotin supports hair strength. A 2017 review of biotin for hair and nails found 18 reported cases where it helped, all in people with an underlying problem such as biotin deficiency, and concluded there isn\'t enough evidence to support it in healthy people. The review covered biotin taken by mouth, not applied to the scalp.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28879195/', label: 'PubMed: A review of the use of biotin for hair loss (Patel et al., Skin Appendage Disord 2017)' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/diseases/hair-loss/types/female-pattern',
                text: 'American Academy of Dermatology: Female pattern hair loss',
                summary: 'The AAD says the FDA has approved 2% and 5% minoxidil as a non-prescription treatment for female pattern hair loss and calls it the most-recommended treatment. This is general guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0D82212P3',
                        text: 'Amazon: BIGVITA Scalp Serum+ reviews',
                        summary: '3.7 out of 5 stars from 34 ratings as of October 2026; 18% are one star.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.bigvita.com/products/scalp-serum',
                        text: 'bigvita.com: Scalp Serum+ customer reviews',
                        summary: '4.69 out of 5 stars from 70 reviews on BIGVITA\'s own site.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // ---- PR haul products added 2026-10-19 (kieró skincare and supplements), requested by Ameera. ----
    // kieró Moisturizing Barrier Cream, verified against
    // us.kieroskincare.com/products/moisturizing-barrier-cream on 2026-10-19
    // (price, INCI list, claims, how-to, review stats, read in a browser) and the
    // Amazon listing B0FRMRCRBP (title, size, price, rating, safety text, read in a
    // browser). Science claims read from abstracts via NCBI E-utilities; AAD page
    // read directly. openFDA drug enforcement search for "kiero": no matches.
    // Not a brand partner and no affiliate link. Sold out on kieró's US site at
    // time of writing; in stock on Amazon. Image is kieró's own product photo
    // (loads, 1080x1080), matching the other kieró entries; ayna's sheet photo
    // https://m.media-amazon.com/images/I/41vDShxlGZL._AC_SL500_.jpg also loads.
    {
        id: 'p-kiero-moisturizing-barrier-cream',
        name: 'Moisturizing Barrier Cream',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'moisturizer', 'barrier', 'ceramides', 'squalane', 'hyaluronic acid', 'vegan', 'fragrance-free'],
        price: '$12.99 for 50 g (1.76 oz) on kieró\'s US site; $13.99 on Amazon',
        whereToBuy: ['kieró', 'Amazon'],
        url: 'https://us.kieroskincare.com/products/moisturizing-barrier-cream',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/moisturizing-barrier-cream',
            Amazon: 'https://www.amazon.com/dp/B0FRMRCRBP',
        },
        image: 'https://us.kieroskincare.com/cdn/shop/files/kiero_c1ec7bd0-990c-4bb7-a6f3-c6fd338869fe.jpg',
        summary: 'A face and neck cream with squalane, panthenol, several forms of hyaluronic acid, ceramide NP, and blue agave extract. kieró says it strengthens the skin barrier, prevents moisture loss, and hydrates dull skin without a greasy feel. It is step 4 (hydrate) of kieró\'s 5-step routine, which blends Korean-beauty formulation with Latin American botanicals. Use morning and night.',
        ingredients: 'Full INCI list per kieró: Water, Squalane, Butylene Glycol, 1,2-Hexanediol, Panthenol, Ammonium Acryloyldimethyltaurate/VP Copolymer, Acrylates/C10-30 Alkyl Acrylate Crosspolymer, Arginine, Allantoin, Ethylhexylglycerin, Dextrin, Sodium Acrylate/Sodium Acryloyldimethyl Taurate Copolymer, Polyisobutene, Disodium EDTA, Gardenia Florida Fruit Extract, Sodium Hyaluronate, Caprylyl/Capryl Glucoside, Sorbitan Oleate, Glycerin, Hyaluronic Acid, Hydrolyzed Hyaluronic Acid, Hydrolyzed Sodium Hyaluronate, Hydroxypropyltrimonium Hyaluronate, Potassium Hyaluronate, Sodium Hyaluronate Crosspolymer, Hydrogenated Lecithin, Agave Tequilana Leaf Extract (1 ppm), Ceramide NP, Pentylene Glycol, Sodium Acetylated Hyaluronate.',
        safety: {
            fdaStatus: 'Sold as a cosmetic moisturizer; not an FDA-approved drug. kieró states the formula is vegan and free of sulfates, parabens, and phthalates; ayna did not independently verify those claims.',
            materials: 'Cream in a 50 g (1.76 oz) jar. The main moisturizing ingredients are squalane (second on the list), glycerin, panthenol, and eight forms of hyaluronic acid. Ceramide NP and the blue agave (Agave tequilana) leaf extract are near the end of the list, and kieró lists the agave at 1 ppm (0.0001%). No added fragrance or essential oils appear in the published ingredient list. Amazon lists the manufacturer as GreenCos Co., Ltd.',
            recalls: 'No recalls found.',
            sideEffects: 'kieró\'s page lists no warnings. The Amazon listing advises stopping and seeing a specialist if redness or itching appears, not applying it to wounds or irritated skin, and rinsing right away if it gets in your eyes. Full warnings are listed below.',
            opinionAlerts: 'Blue agave is the headline ingredient, but kieró\'s own ingredient list gives it at 1 ppm (0.0001%), and ceramide NP is listed near the end, so it is likely present in a small amount. Benefit claims (barrier repair, less moisture loss) come from kieró, and no study of the finished product was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says this cream strengthens the skin barrier and prevents moisture loss, with blue agave for hydration, ceramides for the barrier, and squalane for a smooth finish. No independent study of this product was found, so what follows is what the research says about its main ingredients.\n\nCeramides are the best-studied barrier ingredient here. In a 12-week, double-blind study of people using a prescription acne gel (adapalene with benzoyl peroxide), those who also used a ceramide cleanser and lotion kept lower water loss through the skin and had less dryness than those using a basic face wash. That tested a different brand\'s ceramide routine in people on irritating acne medicine. kieró lists ceramide NP near the end of its ingredient list and doesn\'t give its amount.\n\nThe blue agave that kieró features is listed at 1 ppm, or 0.0001% of the formula. ayna found no study of agave leaf extract on skin.\n\nThe bulk of the hydration likely comes from ingredients higher on the list: squalane, glycerin, panthenol, and eight forms of hyaluronic acid. A review written by Bayer (which sells dexpanthenol creams) says studies support panthenol\'s moisturizing and barrier benefits. A review co-written by L\'Oréal scientists says many studies support topical hyaluronic acid for skin hydration. The American Academy of Dermatology lists hyaluronic acid and glycerin among the ingredients to look for in a moisturizer for dry skin and recommends fragrance-free products.',
        doctorOpinionShort: 'A fragrance-free cream built on squalane, glycerin, panthenol, and hyaluronic acid, ingredients the AAD recommends for dry skin. Ceramides have good evidence for barrier repair, but ceramide NP is near the end of the list here, and the featured blue agave is listed at just 1 ppm. No independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/moisturizing-barrier-cream', label: 'kieroskincare.com: Moisturizing Barrier Cream, ingredient list and claims' },
            { url: 'https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin', label: 'American Academy of Dermatology: Dermatologists\' tips for relieving dry skin' },
        ],
        whoItsFor: [
            'Normal, dry, or combination skin looking for a light daily moisturizer',
            'People who prefer a fragrance-free, vegan formula',
            'People using drying acne treatments who want a simple moisturizer (ceramide moisturizers helped in one study of a different brand)',
        ],
        howToUse: {
            intro: 'Per kieró\'s own site: use morning and night as step 4 (hydrate) of the routine.',
            steps: [
                'Cleanse and prepare your skin first.',
                'Spread an even amount over your face and neck.',
                'Use morning and night to seal in moisture. The AAD suggests applying moisturizer while skin is still damp.',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/moisturizing-barrier-cream',
            sourceLabel: 'kieroskincare.com: Moisturizing Barrier Cream',
        },
        warnings: [
            'Redness or itching after use: stop and see a doctor (per the Amazon listing).',
            'Don\'t apply to wounds or irritated skin (per the Amazon listing).',
            'Keep out of eyes; if it gets in, rinse right away (per the Amazon listing).',
        ],
        communityReview: 'kieró\'s US site shows 4.91 out of 5 from 213 reviews; its rating bars show 194 reviews (91%) in the top row and 19 (9%) in the second, with none lower. On Amazon it has 4.0 out of 5 stars from 54 ratings as of October 2026. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s product page.',
        effectiveness: 'Moisturizes with squalane, glycerin, panthenol, and hyaluronic acid. Ceramides have good evidence for barrier repair, but ceramide NP is near the end of the list and the featured agave is at 1 ppm. No independent study of the finished product was found.',
        ingredientScience: [
            {
                name: 'Ceramide NP',
                text: 'kieró states ceramides help maintain the skin barrier. In a 12-week, double-blind study, people using a prescription acne gel (adapalene 0.3% with benzoyl peroxide 2.5%) who also used a ceramide-containing cleanser and lotion had lower water loss through the skin and less dryness, redness, and scaling than those using a basic face wash. That study tested a different brand\'s ceramide routine. kieró lists ceramide NP second to last and doesn\'t give its amount.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/37276158/', label: 'PubMed: Ceramide-containing adjunctive skin care for skin barrier restoration during acne vulgaris treatment (2023)' },
                ],
            },
            {
                name: 'Panthenol (provitamin B5)',
                text: 'Fifth on the ingredient list. A review written with Bayer, which makes dexpanthenol creams, says various studies confirm its moisturizing and barrier-supporting effects. kieró doesn\'t list its concentration.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28503966/', label: 'PubMed: Topical use of dexpanthenol, a 70th anniversary article (2017)' },
                ],
            },
            {
                name: 'Hyaluronic acid (eight forms)',
                text: 'kieró\'s formula contains eight forms of hyaluronic acid and its salts. A review co-written by L\'Oréal scientists says many studies support topical hyaluronic acid for skin hydration. The American Academy of Dermatology lists hyaluronic acid and glycerin among the ingredients to look for in a moisturizer for dry skin.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/36200921/', label: 'PubMed: Benefits of topical hyaluronic acid for skin quality and signs of skin aging (2022)' },
                    { url: 'https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin', label: 'American Academy of Dermatology: Dermatologists\' tips for relieving dry skin' },
                ],
            },
            {
                name: 'Blue agave (Agave tequilana) leaf extract',
                text: 'kieró features blue agave for lasting hydration, but its ingredient list gives the extract at 1 ppm (0.0001% of the formula). ayna found no study of agave leaf extract on skin.',
                citations: [
                    { url: 'https://us.kieroskincare.com/products/moisturizing-barrier-cream', label: 'kieroskincare.com: Moisturizing Barrier Cream ingredient list' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/everyday-care/skin-care-basics/dry/dermatologists-tips-relieve-dry-skin',
                text: 'American Academy of Dermatology: Dermatologists\' tips for relieving dry skin',
                summary: 'AAD guidance: choose a fragrance-free cream or ointment, look for ingredients such as hyaluronic acid and glycerin, and apply while skin is still damp. This is general guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0FRMRCRBP',
                        text: 'Amazon: kieró Moisturizing Barrier Cream reviews',
                        summary: '4.0 out of 5 stars from 54 ratings on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/moisturizing-barrier-cream',
                        text: 'kieroskincare.com: Moisturizing Barrier Cream customer reviews',
                        summary: 'kieró\'s own product page shows 4.91 out of 5 from 213 reviews.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // kieró Balance Toner Pads, verified against
    // us.kieroskincare.com/products/balance-toner-pads on 2026-10-19 (price, INCI
    // list, claims, how-to, review stats, read in a browser) and the Amazon listing
    // B0FRM64YB5 (title, 60 pads / 6.26 fl oz, price, rating, directions, safety
    // text, read in a browser). FDA's AHA page and the AAD exfoliation page read
    // directly; science claims read from abstracts via NCBI E-utilities. openFDA
    // drug enforcement and drug label searches for "kiero": no matches. Not a brand
    // partner and no affiliate link. Sold out on kieró's US site at time of
    // writing; in stock on Amazon. Image is kieró's own product photo (loads,
    // 1080x1080); ayna's sheet photo
    // https://m.media-amazon.com/images/I/61+AE4eQd+L._AC_SL500_.jpg also loads.
    {
        id: 'p-kiero-balance-toner-pads',
        name: 'Balance Toner Pads',
        brand: 'kieró',
        category: 'skincare',
        type: 'physical',
        internal: false,
        healthFunctions: ['skin-hair'],
        tags: ['skin', 'toner', 'exfoliation', 'aha', 'pha', 'glycolic acid', 'vegan', 'fragrance-free'],
        price: '$12.99 for 60 pads (185 ml / 6.26 fl oz) on kieró\'s US site; $13.99 on Amazon',
        whereToBuy: ['kieró', 'Amazon'],
        url: 'https://us.kieroskincare.com/products/balance-toner-pads',
        whereToBuyLinks: {
            'kieró': 'https://us.kieroskincare.com/products/balance-toner-pads',
            Amazon: 'https://www.amazon.com/dp/B0FRM64YB5',
        },
        image: 'https://us.kieroskincare.com/cdn/shop/files/kiero-_-_-05.jpg',
        summary: 'Pre-soaked toner pads with glycolic acid (an AHA), gluconolactone (a PHA), passion fruit extract, panthenol, and hyaluronic acid. kieró says they gently exfoliate, renew skin texture, fade dark spots, minimize the look of pores, and hydrate. It is step 2 (balance) of kieró\'s 5-step routine. Wipe over the face after cleansing, avoiding the eyes. Because it contains an AHA, the FDA advises daily sunscreen while using it.',
        ingredients: 'Full INCI list per kieró: Water, Melaleuca Alternifolia (Tea Tree) Leaf Water, Butylene Glycol, 1,2-Hexanediol, Glycerin, Glycolic Acid, Potassium Hydroxide, Allantoin, Gluconolactone, Panthenol, Sodium Hyaluronate, Cyanocobalamin, Passiflora Edulis Fruit Extract, Hydrolyzed Hyaluronic Acid, Hydroxypropyltrimonium Hyaluronate, Pentylene Glycol, Sodium Hyaluronate Crosspolymer, Sodium Acetylated Hyaluronate.',
        safety: {
            fdaStatus: 'Sold as a cosmetic toner; not an FDA-approved drug. kieró doesn\'t publish the glycolic acid percentage or the product\'s pH. kieró states the formula is vegan and free of sulfates, parabens, and phthalates; ayna did not independently verify those claims.',
            materials: '60 cotton pads in 185 ml (6.26 fl oz) of toner. Exfoliating acids: glycolic acid (AHA) and gluconolactone (PHA), with potassium hydroxide to adjust pH. The second ingredient is tea tree leaf water (a water distilled from the leaves, not tea tree oil). Also contains glycerin, allantoin, panthenol, hyaluronic acid, passion fruit extract, and cyanocobalamin (vitamin B12, which is pink). No added fragrance appears in the published ingredient list. Amazon lists the manufacturer as Natuzen Co., Ltd.',
            recalls: 'No recalls found.',
            sideEffects: 'Glycolic acid makes skin more sensitive to the sun. In a study the FDA cites, 4 weeks of 10% glycolic acid increased sunburn cells and lowered the UV dose needed to redden skin; the effect was gone a week after stopping. The FDA recommends AHA products carry a sunburn alert telling users to wear sunscreen; kieró\'s page and the Amazon listing don\'t include one. The AAD warns that exfoliating while using retinoids or benzoyl peroxide can worsen dryness. Full warnings are listed below.',
            opinionAlerts: 'Sun sensitivity: contains glycolic acid, so use sunscreen daily while using these and for a week after stopping (FDA). kieró doesn\'t give the acid strength or pH. Benefit claims (fading dark spots, smaller-looking pores, oil control) come from kieró, and no study of the finished product was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from kieró; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'kieró says these pads gently exfoliate with AHA and PHA, renew texture, fade dark spots, minimize the look of pores, and hydrate, and that passion fruit extract helps control excess oil. No independent study of this product was found, so what follows is what the research and regulators say about its main ingredients.\n\nGlycolic acid is the most common alpha hydroxy acid (AHA). The FDA says AHAs make skin more sensitive to the sun: in a study of 29 people that the FDA cites, applying 10% glycolic acid for 4 weeks increased sunburn cells and lowered the amount of UV needed to redden the skin. The effect went away within a week of stopping. The FDA recommends AHA products carry a "Sunburn Alert" and that users wear sunscreen during use and for a week after. kieró\'s page doesn\'t include this alert, and it doesn\'t say how much glycolic acid the pads contain or what their pH is. The FDA notes that an expert safety panel considers glycolic acid products safe at 10% or less with a pH of 3.5 or higher, when they protect against sun sensitivity or tell users to use sun protection daily.\n\nGluconolactone is a polyhydroxy acid (PHA). In lab tests it gave some protection against UV damage, and in a small human test it did not significantly increase sunburn cells, but the authors said more research is needed.\n\nThe second ingredient is tea tree leaf water, which is different from tea tree oil. A safety review of tea tree oil says topical use is relatively safe and adverse events are minor, but some people are allergic to it. ayna found no study of the leaf water or of the passion fruit extract on skin.\n\nThe American Academy of Dermatology says people with sensitive, dry, or acne-prone skin may do best with a mild chemical exfoliant, should moisturize right after, and shouldn\'t exfoliate on broken or sunburned skin or while using retinoids or benzoyl peroxide.',
        doctorOpinionShort: 'Toner pads with glycolic acid (an AHA) and gluconolactone (a PHA) for gentle chemical exfoliation. kieró doesn\'t say how strong the acid is, and AHAs make skin more sun-sensitive, so the FDA advises daily sunscreen while using them and for a week after. No independent study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://us.kieroskincare.com/products/balance-toner-pads', label: 'kieroskincare.com: Balance Toner Pads, ingredient list and claims' },
            { url: 'https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids', label: 'FDA: Alpha hydroxy acids in cosmetics' },
            { url: 'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home', label: 'American Academy of Dermatology: How to safely exfoliate at home' },
        ],
        whoItsFor: [
            'People who want gentle chemical exfoliation in a quick wipe-on step',
            'Normal, oily, or combination skin looking to smooth rough texture',
            'People who already wear sunscreen every day (needed with any AHA product)',
        ],
        howToUse: {
            intro: 'Per kieró\'s own site and the Amazon listing: use daily, morning or night, as step 2 (balance) of the routine.',
            steps: [
                'Cleanse your skin first.',
                'Gently wipe one pad over your face and neck, avoiding the eye area.',
                'Follow with serum and moisturizer. The AAD recommends moisturizing right after exfoliating.',
                'Wear sunscreen every day while using these and for a week after you stop. The FDA recommends this for any AHA product.',
            ],
            sourceUrl: 'https://us.kieroskincare.com/products/balance-toner-pads',
            sourceLabel: 'kieroskincare.com: Balance Toner Pads',
        },
        warnings: [
            'Sun sensitivity: contains glycolic acid (an AHA). Use sunscreen, cover up, and limit sun exposure while using it and for a week after (FDA).',
            'Using a prescription retinoid, retinol, or benzoyl peroxide: exfoliating on top of them can worsen dryness and irritation (AAD).',
            'Don\'t use on broken, cut, or sunburned skin (AAD).',
            'Contains tea tree leaf water. Some people are allergic to tea tree; stop if you get redness or itching.',
            'Keep out of eyes; if it gets in, rinse right away (per the Amazon listing).',
        ],
        communityReview: 'kieró\'s US site shows 4.92 out of 5 from 420 reviews; its rating bars show 391 reviews (93%) in the top row, 26 (6%) in the second, 2 in the third, none in the fourth, and 1 in the lowest. On Amazon it has 4.3 out of 5 stars from 56 ratings as of October 2026. The first set of reviews is on kieró\'s own site; the Amazon rating is from Amazon\'s product page.',
        effectiveness: 'Glycolic acid and gluconolactone exfoliate chemically; the strength isn\'t disclosed. Claims about dark spots, pores, and oil control come from kieró. No independent study of the finished product was found.',
        ingredientScience: [
            {
                name: 'Glycolic acid (AHA)',
                text: 'kieró states AHA refines texture and unclogs pores. In a randomized, double-blind study of 29 people, cited by the FDA, 10% glycolic acid applied for 4 weeks increased sunburn cells and lowered the UV dose needed to redden the skin; the effect was gone a week after stopping. The FDA recommends AHA products carry a sunburn alert and notes that an expert panel considers glycolic acid products safe at 10% or less with a pH of 3.5 or higher, with daily sun protection. kieró doesn\'t list the concentration or pH.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/12713551/', label: 'PubMed: Topical glycolic acid enhances photodamage by ultraviolet light (2003)' },
                    { url: 'https://www.fda.gov/cosmetics/cosmetic-ingredients/alpha-hydroxy-acids', label: 'FDA: Alpha hydroxy acids in cosmetics' },
                ],
            },
            {
                name: 'Gluconolactone (PHA)',
                text: 'kieró states PHA gently exfoliates. In a lab model, gluconolactone gave up to 50% protection against UV damage, and in a small human test it did not significantly increase sunburn cells. The authors said more research is needed. This was not a test of exfoliation or of this product.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/14756648/', label: 'PubMed: The polyhydroxy acid gluconolactone protects against ultraviolet radiation in an in vitro model of cutaneous photoaging (2004)' },
                ],
            },
            {
                name: 'Tea tree (Melaleuca alternifolia) leaf water',
                text: 'The second ingredient. It is a water distilled from tea tree leaves, not the essential oil. A safety review of tea tree oil found topical use relatively safe, with minor and occasional side effects, but allergic reactions occur in some people. ayna found no study of the leaf water itself.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/16243420/', label: 'PubMed: A review of the toxicity of Melaleuca alternifolia (tea tree) oil (2006)' },
                ],
            },
        ],
        scientificCitations: [
            {
                url: 'https://www.aad.org/public/everyday-care/skin-care-secrets/routine/safely-exfoliate-at-home',
                text: 'American Academy of Dermatology: How to safely exfoliate at home',
                summary: 'AAD guidance: people with dry, sensitive, or acne-prone skin should choose gentle exfoliation, moisturize afterward, and avoid exfoliating on broken or sunburned skin or while using retinoids or benzoyl peroxide. This is general guidance, not product-specific validation.',
            },
        ],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: {
                links: [
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/dp/B0FRM64YB5',
                        text: 'Amazon: kieró Balance Toner Pads reviews',
                        summary: '4.3 out of 5 stars from 56 ratings on Amazon as of October 2026.',
                    },
                    {
                        platform: 'website',
                        url: 'https://us.kieroskincare.com/products/balance-toner-pads',
                        text: 'kieroskincare.com: Balance Toner Pads customer reviews',
                        summary: 'kieró\'s own product page shows 4.92 out of 5 from 420 reviews.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },

    // Arrae MB-1, verified on 2026-10-19 against arrae.com/products/mb-1 (price,
    // claims, how-to, ingredients, review stats, read in a browser) and the Amazon
    // listing B0DCQC1DNS (title, variants, bullets, safety text, and the Supplement
    // Facts panel image, read in a browser). Supplement Facts below are from the
    // Amazon label image, which matches the "Ingredients" section of Arrae's page.
    // NOTE: ASIN B0DCQC1DNS is the 60-capsule variant; ayna's sheet says 40
    // capsules (Amazon's 40-count variant is a different ASIN, B0FZV4LDX2). Arrae's
    // page also shows a second, different ingredient list (see report). Studies read
    // from abstracts via NCBI E-utilities; NIH ODS fact sheets read directly. openFDA
    // food and drug enforcement searches for "arrae": no matches. Not a brand
    // partner, no affiliate link. Image: ayna's sheet photo (loads, 385x500).
    {
        id: 'p-arrae-mb-1',
        name: 'Arrae MB-1 Metabolism Support',
        brand: 'Arrae',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement'],
        tags: ['arrae', 'mb-1', 'metabolism', 'weight management', 'cravings', 'african mango', 'cissus', 'green tea', 'chromium', 'probiotic', 'caffeine', 'supplement'],
        price: '$55 for a 1-month supply on arrae.com ($44 a month by subscription); on Amazon $52.49 for 60 capsules or $27.99 for 40',
        whereToBuy: ['arrae.com', 'Amazon'],
        url: 'https://arrae.com/products/mb-1',
        whereToBuyLinks: {
            'arrae.com': 'https://arrae.com/products/mb-1',
            Amazon: 'https://www.amazon.com/dp/B0DCQC1DNS',
        },
        image: 'https://m.media-amazon.com/images/I/51cUawzhbWL._AC_SL500_.jpg', // from ayna's sheet; loads
        summary: 'A daily capsule sold for metabolism, cravings, and weight management. It combines African mango seed extract (IGOB131), Cissus leaf extract (CQR-300), green tea extract, grains of paradise, chromium, vitamin B6, and the probiotic Bifidobacterium lactis B420. Arrae claims body weight reductions of up to 12%, fewer cravings, more daily calorie burn, and healthy blood sugar, and footnotes that these figures are based on research on individual ingredients, not on MB-1 itself. Contains caffeine from green tea. The serving is 2 capsules a day.',
        ingredients: 'Supplement Facts per the label shown on Amazon. Serving size 2 capsules; 30 servings per container (60 capsules). Vitamin B6 (as pyridoxal 5-phosphate 68%) 5 mg (294% DV). Chromium (as chromium picolinate) 500 mcg (1428% DV). Proprietary blend 895 mg: Cissus leaf extract (CQR-300), green tea extract, African mango seed extract (IGOB131), grains of paradise seed extract; amounts of each not disclosed. Probiotic 25 mg (10 billion CFU): Bifidobacterium lactis B420. Other ingredients: vegetable capsule (HPMC), rice hull (ground). Distributed by Arrae Inc, Dayton, NJ. Arrae\'s own page lists the same formula in its Ingredients section, but its "Full Ingredients List" panel shows a different one (10 mg B6, a 1.35 g blend with African pepper, green tea, African mango and grains of paradise, and a 27 mg blend of three other probiotic strains), possibly for MB-1 Max or MB-1 45+.',
        safety: {
            fdaStatus: 'A dietary supplement, which the FDA does not evaluate for safety or efficacy. The label says its statements have not been evaluated by the FDA and that it is not intended to diagnose, treat, cure, or prevent any disease.',
            materials: 'Vegetable capsules; 2 a day. Amazon sells 40- and 60-capsule bottles; Arrae sells a 1-month supply. Contains caffeine from green tea extract; the amount isn\'t stated. Arrae says it is third-party tested and links a certificate of analysis.',
            recalls: 'No recalls found.',
            sideEffects: 'Per the label on Amazon: don\'t take it if you are pregnant or nursing, under 18, have a medical condition, take any medications, have a history of liver problems, or on an empty stomach, or on a day you take other green tea products. Don\'t exceed 1 serving a day. Green tea extract has been linked to rare liver injury, with higher risk on an empty stomach, and chromium can lower blood sugar with diabetes medicines (NIH). Full warnings are listed below.',
            opinionAlerts: 'Weight-loss claims: Arrae\'s "up to 12%" figure comes from ingredient research, not from a study of MB-1. The main study behind it was a 10-week trial of 72 people by one research group, and reviews of African mango call the evidence limited by small, flawed trials. The blend\'s amounts are not disclosed, so the doses can\'t be compared with the studies. Liver caution: contains green tea extract. Not for anyone pregnant, nursing, under 18, on medications, or with liver problems (per the label).',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims are sourced from Arrae; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'Arrae says MB-1 reduces body weight by up to 12%, curbs cravings, raises daily calorie burn, and supports healthy blood sugar, and footnotes that these figures are "based on individual ingredient research." No study of MB-1 itself was found, so what follows is what the research says about its ingredients.\n\nThe weight claims trace mainly to African mango (IGOB131) combined with Cissus (CQR-300). In a 10-week, double-blind, placebo-controlled trial by a research group in Cameroon, 72 adults with overweight or obesity took Cissus alone, Cissus with African mango, or a placebo, with no diet or exercise changes. Both active groups lost more weight and body fat and had lower cholesterol and blood sugar than placebo, with larger changes for the combination. NIH\'s Office of Dietary Supplements (ODS) notes that the African mango trials were all run by the same group of authors. A 2013 systematic review found three such trials, all with flaws in how they were reported, and concluded the effect was unproven and African mango can\'t be recommended for weight loss. A 2020 meta-analysis of five trials rated four as having a high risk of bias, and the one well-run trial found no significant difference. MB-1 lists both extracts inside an 895 mg blend without saying how much of each it contains, so its doses can\'t be compared with the trials.\n\nFor the other ingredients, the evidence is small. ODS says chromium produced only about 1 kg more weight loss than placebo in reviews of trials, and green tea\'s effect on weight is small and probably not clinically relevant. Grains of paradise raised energy use and slightly reduced belly (visceral) fat in a 4-week study of 19 young, non-obese women, but total body fat didn\'t change. The probiotic B420, at the same 10 billion CFU dose used here, was tested for 6 months in 225 adults with overweight; in the main analysis no group differed from placebo in body fat, and benefits appeared only in a narrower analysis of people who followed the protocol. That trial was run by the company that makes B420.\n\nSafety matters more than usual here. ODS reports at least 50 cases of liver damage linked to green tea extracts, with risk appearing higher on an empty stomach, and Arrae\'s own label says not to take MB-1 on an empty stomach or with a history of liver problems. Chromium may cause low blood sugar with insulin or metformin and may reduce absorption of levothyroxine. One person with chronic kidney disease had kidney failure associated with African mango.',
        doctorOpinionShort: 'A metabolism blend whose "up to 12%" weight-loss claim comes from small ingredient studies, mainly one 10-week trial of 72 people, not from MB-1 itself. Reviews call the African mango evidence limited, and the blend\'s doses aren\'t disclosed. Contains green tea extract (rare liver injury) and chromium (can lower blood sugar with diabetes drugs). Not for pregnancy, nursing, under 18, or anyone on medication, per the label.',
        doctorOpinionCitations: [
            { url: 'https://arrae.com/products/mb-1', label: 'arrae.com: MB-1, ingredients and claims' },
            { url: 'https://www.amazon.com/dp/B0DCQC1DNS', label: 'Amazon: Arrae MB-1 listing, Supplement Facts and safety information' },
            { url: 'https://ods.od.nih.gov/factsheets/WeightLoss-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Dietary supplements for weight loss', chipLabel: 'NIH ODS: weight-loss supplements' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/18377661/', label: 'PubMed: Cissus quadrangularis/Irvingia gabonensis combination in weight loss, double-blind, placebo-controlled study (2008)', chipLabel: 'Cissus + African mango trial, 72 people (2008)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/31855111/', label: 'PubMed: Effects of Irvingia gabonensis seed extract supplementation, systematic review and meta-analysis (2020)', chipLabel: 'African mango meta-analysis, 5 trials (2020)' },
        ],
        whoItsFor: [
            'Healthy adults 18 and older, not pregnant or nursing, who want to try a supplement alongside diet and exercise and understand the evidence is limited',
            'Not for anyone taking medications, with a medical condition, or with a history of liver problems (per the label)',
            'Not a substitute for talking to a doctor about weight, blood sugar, or metabolism',
        ],
        howToUse: {
            intro: 'Per Arrae\'s site and the Amazon listing: 2 capsules a day. Arrae recommends 3 months of daily use alongside a balanced diet and active lifestyle.',
            steps: [
                'Take 2 capsules with your first meal of the day. The label says not to take it on an empty stomach.',
                'If you are sensitive to caffeine, Arrae suggests taking one capsule at breakfast and one at lunch.',
                'Take it earlier in the day, since it contains caffeine from green tea.',
                'Don\'t take more than 1 serving a day, and skip other green tea products that day (per the label).',
            ],
            sourceUrl: 'https://arrae.com/products/mb-1',
            sourceLabel: 'arrae.com: MB-1',
        },
        warnings: [
            'Pregnant, nursing, or under 18: don\'t use (per the label).',
            'Taking any medication or have a medical condition: don\'t use unless your doctor approves (per the label). Chromium may cause low blood sugar with insulin or metformin and may reduce levothyroxine absorption (NIH ODS).',
            'History of liver problems: don\'t use (per the label). Green tea extract has been linked to rare liver injury (NIH ODS).',
            'Don\'t take it on an empty stomach or with other green tea products the same day (per the label).',
            'Kidney disease: one case of kidney failure has been associated with African mango (NIH ODS); check with your doctor first.',
            'Contains caffeine.',
        ],
        communityReview: 'Arrae\'s product page shows 4.68 out of 5 from 3,613 reviews. On Amazon it has 4.0 out of 5 stars from 274 ratings as of October 2026: 61% five stars, 12% four, 9% three, 5% two, and 13% one star; the Amazon reviews cover both the 40- and 60-capsule bottles. The first rating is from Arrae\'s own site; the second is from Amazon\'s product page.',
        effectiveness: 'No study of MB-1 was found. Its main ingredients have small, short trials with mixed quality; reviews call the African mango evidence limited, and chromium and green tea produce only about 1 kg more weight loss than placebo.',
        ingredientScience: [
            {
                name: 'African mango (IGOB131) with Cissus (CQR-300)',
                text: 'Arrae\'s "up to 12%" body weight, blood sugar, and waist figures cite these two together. In a 10-week, randomized, double-blind, placebo-controlled trial by a research group in Cameroon, 72 adults with overweight or obesity took Cissus alone, Cissus with African mango, or a placebo. Both active groups had significantly lower body weight, body fat, waist size, cholesterol, and blood sugar than placebo, with larger changes for the combination. MB-1 doesn\'t disclose how much of either extract it contains.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/18377661/', label: 'PubMed: The use of a Cissus quadrangularis/Irvingia gabonensis combination in the management of weight loss, double-blind, placebo-controlled study (2008)' },
                ],
            },
            {
                name: 'African mango (Irvingia gabonensis)',
                text: 'A 2013 systematic review found three trials, all by the same authors and all with reporting flaws; each reported weight loss, but the reviewers concluded the effect was unproven and that it can\'t be recommended as a weight-loss aid. A 2020 meta-analysis of five trials rated four as having a high risk of bias, and the only low-risk trial found no significant difference in weight. NIH ODS says it appears well tolerated (headache, sleep trouble, and gas were reported) but human safety hasn\'t been rigorously studied, and one person with chronic kidney disease had kidney failure associated with it.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/23419021/', label: 'PubMed: The efficacy of Irvingia gabonensis supplementation in the management of overweight and obesity, systematic review (2013)' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/31855111/', label: 'PubMed: Effects of Irvingia gabonensis seed extract supplementation on anthropometric and cardiovascular outcomes, systematic review and meta-analysis (2020)' },
                    { url: 'https://ods.od.nih.gov/factsheets/WeightLoss-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Dietary supplements for weight loss' },
                ],
            },
            {
                name: 'Green tea extract',
                text: 'Arrae states it supports metabolism. NIH ODS concludes any weight effect of green tea is small and probably not clinically relevant (about 1 kg more than placebo in a review of 14 trials, with no difference in the studies done outside Japan). ODS also reports at least 50 cases of liver damage linked to green tea extracts since 2006, with risk appearing higher when taken on an empty stomach.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/WeightLoss-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Dietary supplements for weight loss' },
                ],
            },
            {
                name: 'Chromium (500 mcg as chromium picolinate)',
                text: 'Arrae states it supports metabolic function and blood sugar. NIH ODS says a review of 9 trials found about 1.1 kg more weight loss than placebo, of debatable clinical relevance, and that clinical trials found only a very small benefit. Chromium may cause low blood sugar when taken with insulin or metformin and may reduce absorption of levothyroxine. People with kidney or liver disease should be cautious with high amounts.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/Chromium-Consumer/', label: 'NIH Office of Dietary Supplements: Chromium fact sheet for consumers' },
                    { url: 'https://ods.od.nih.gov/factsheets/WeightLoss-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Dietary supplements for weight loss' },
                ],
            },
            {
                name: 'Grains of paradise (Aframomum melegueta)',
                text: 'Arrae states it boosts daily calorie burn. In a 4-week, single-blind, placebo-controlled crossover study of 19 non-obese women aged 20 to 22, a daily 30 mg extract increased whole-body energy use and slightly reduced belly (visceral) fat, but total and under-the-skin fat didn\'t change. MB-1 doesn\'t disclose how much it contains.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/24759256/', label: 'PubMed: Daily ingestion of grains of paradise (Aframomum melegueta) extract increases whole-body energy expenditure and decreases visceral fat in humans (2014)' },
                ],
            },
            {
                name: 'Bifidobacterium lactis B420 (10 billion CFU)',
                text: 'Arrae calls it a clinically studied strain for bloating and gut balance. In a 6-month, double-blind trial of 225 adults with overweight, B420 at the same 10 billion CFU daily dose did not change body fat compared with placebo in the main analysis. Among the people who followed the protocol, B420 with fiber reduced body fat by 4.5% relative to placebo, while B420 alone did not differ significantly. The study was run by DuPont, which makes B420.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/27810310/', label: 'PubMed: Probiotic with or without fiber controls body fat mass, associated with serum zonulin, in overweight and obese adults, randomized controlled trial (2016)' },
                ],
            },
            {
                name: 'Vitamin B6 (5 mg as P5P)',
                text: 'This is 294% of the daily value. NIH ODS sets the adult upper limit at 100 mg a day (Europe\'s food safety agency set a lower limit of 12 mg in 2023), so 5 mg is well below both.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/VitaminB6-Consumer/', label: 'NIH Office of Dietary Supplements: Vitamin B6 fact sheet for consumers' },
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
                        url: 'https://www.amazon.com/dp/B0DCQC1DNS',
                        text: 'Amazon: Arrae MB-1 reviews',
                        summary: '4.0 out of 5 stars from 274 ratings on Amazon as of October 2026; 13% of ratings are one star.',
                    },
                    {
                        platform: 'website',
                        url: 'https://arrae.com/products/mb-1',
                        text: 'arrae.com: MB-1 customer reviews',
                        summary: 'Arrae\'s own product page shows 4.68 out of 5 from 3,613 reviews.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: false,
    },

    // CBB (Curvy Body Bears) Women's 13 in 1 Supplement Gummies (blue bottle, berry
    // flavor), verified on 2026-10-19 against the Amazon listing B0BWSMCMTZ (title,
    // price, variant, bullets, ingredient text, rating, and the Supplement Facts
    // panel on the bottle image, read in a browser) and the brand page
    // curvybodybears.com (Blue Gummies, $29.99, sold out, no Supplement Facts).
    // Supplement Facts below are from the bottle image on Amazon. NIH ODS fact
    // sheets read directly. openFDA food enforcement search for Curvy Body / C.B.B.:
    // no matches. Not a brand partner, no affiliate link. Image: ayna's sheet photo
    // (loads, 259x500). A separate researcher is handling CBB's Perfect PH probiotic
    // gummies; brand string matches that entry.
    {
        id: 'p-cbb-13-in-1-womens-gummies',
        name: 'CBB Women\'s 13 in 1 Supplement Gummies',
        brand: 'CBB (Curvy Body Bears)',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement'],
        tags: ['cbb', 'curvy body bears', 'multivitamin', 'gummies', 'herbal', 'black cohosh', 'maca', 'ginseng', 'vegan', 'supplement'],
        price: '$17.99 for 60 gummies on Amazon; $29.99 on the brand\'s site (sold out)',
        whereToBuy: ['curvybodybears.com', 'Amazon'],
        url: 'https://curvybodybears.com/products/cbb-gummies-womens-support-supplement-berry-flavored-60-gummies-1-month-supply',
        whereToBuyLinks: {
            'curvybodybears.com': 'https://curvybodybears.com/products/cbb-gummies-womens-support-supplement-berry-flavored-60-gummies-1-month-supply',
            Amazon: 'https://www.amazon.com/dp/B0BWSMCMTZ',
        },
        image: 'https://m.media-amazon.com/images/I/51slr4TLhVL._AC_SL500_.jpg', // from ayna's sheet; loads
        summary: 'Berry-flavored gummies with four vitamins (A, C, E, and B6) and a 450 mg blend of nine herbs: maca, Asian ginseng, anise, motherwort, saw palmetto, fenugreek, black cohosh, kelp, and ginger. The listing describes it as a daily women\'s multivitamin with botanicals "traditionally included in women\'s wellness routines" and makes no specific health claims. The vitamin doses are low for a multivitamin, and the amount of each herb isn\'t disclosed. 2 gummies a day; 60 gummies (30 servings) per bottle.',
        ingredients: 'Supplement Facts per the bottle shown on Amazon. Serving size 2 gummies (5 g); 30 servings per container. Calories 15; total carbohydrates 4 g (1% DV); sugars 3 g. Vitamin A (as retinol acetate) 35 mcg RAE (4% DV). Vitamin C (as ascorbic acid) 25 mg (28% DV). Vitamin E (as alpha tocopherol acetate) 15 mg (100% DV). Vitamin B6 (as pyridoxine HCl) 1 mg (59% DV). Proprietary herbal blend 450 mg: maca root, Panax ginseng root, star anise fruit, motherwort herb, saw palmetto fruit, fenugreek seed, black cohosh root, kelp, ginger root; amounts of each not disclosed. Other ingredients: glucose syrup, white granulated sugar, isomalt, pectin, DL-malic acid, trisodium citrate, natural flavor, color (Blue 1). Distributed by C.B.B. LLC, Hoboken, NJ; country of origin China. The Amazon ingredient text lists slightly different forms (vitamin A as retinyl palmitate, vitamin E as d-alpha tocopheryl succinate, anise seed instead of star anise) and omits Blue 1.',
        safety: {
            fdaStatus: 'A dietary supplement, which the FDA does not evaluate for safety or efficacy. The label says its statements have not been evaluated by the FDA and that it is not intended to diagnose, treat, cure, or prevent any disease.',
            materials: 'Pectin gummies (vegan, gluten-free, soy-free, non-GMO per the listing), berry flavored, colored with Blue 1. Each 2-gummy serving has 3 g of sugar. Made in China for C.B.B. LLC.',
            recalls: 'No recalls found.',
            sideEffects: 'The label\'s only direction is to take two gummies a day and not exceed that dose; no warnings were shown. It contains black cohosh, which has been linked to rare liver injury; the US Pharmacopeia recommends a warning for people with liver disorders, and pregnant women are advised not to take it without supervision (NIH). It also contains kelp, a source of iodine, but the label doesn\'t say how much. Full warnings are listed below.',
            opinionAlerts: 'Herb amounts are hidden in a 450 mg blend split across nine herbs, so it\'s not possible to know whether any is present at a studied dose. Contains black cohosh (rare liver injury reports) and kelp (iodine, amount not listed). The Amazon ingredient text and the bottle\'s Supplement Facts don\'t fully match. No study of this product was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product description is sourced from CBB\'s Amazon listing; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'CBB describes these as daily women\'s multivitamin gummies that pair vitamins A, C, E, and B6 with nine botanicals "traditionally included in women\'s wellness routines." The listing doesn\'t claim any specific health benefit. No study of this product was found.\n\nThe vitamin amounts are modest: 100% of the daily value for vitamin E, 59% for B6, 28% for C, and 4% for A, with no minerals. As a multivitamin it covers less than most.\n\nThe nine herbs share a single 450 mg blend, an average of 50 mg each, and the label doesn\'t say how much of any one is in it. That makes it impossible to compare with studies of those herbs.\n\nTwo of the herbs carry safety notes from NIH\'s Office of Dietary Supplements (ODS). Black cohosh, usually taken for menopause symptoms, has been linked to at least 83 reports of liver damage worldwide. ODS says a causal link hasn\'t been shown, but the US Pharmacopeia recommends a warning for people with liver disorders, and pregnant women are advised not to take it unless a provider supervises. ODS also notes that trials, including a 2016 meta-analysis of 4 trials in 511 women, found it didn\'t reliably reduce hot flashes. Kelp is a source of iodine. ODS says too much iodine can cause thyroid problems, and kelp is usually avoided on low-iodine diets such as before radioactive iodine treatment. The label doesn\'t list the iodine content.',
        doctorOpinionShort: 'Low-dose vitamins A, C, E, and B6 plus nine herbs in an undisclosed 450 mg blend, with no specific health claims. Contains black cohosh, linked to rare liver injury and not advised in pregnancy without supervision, and kelp, an unmeasured iodine source. No study of this product was found.',
        doctorOpinionCitations: [
            { url: 'https://www.amazon.com/dp/B0BWSMCMTZ', label: 'Amazon: CBB 13 in 1 Women\'s Gummies listing and Supplement Facts' },
            { url: 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Black cohosh fact sheet', chipLabel: 'NIH ODS: black cohosh' },
            { url: 'https://ods.od.nih.gov/factsheets/Iodine-Consumer/', label: 'NIH Office of Dietary Supplements: Iodine fact sheet for consumers', chipLabel: 'NIH ODS: iodine' },
        ],
        whoItsFor: [
            'Adults who want a low-dose vitamin gummy and are comfortable with an undisclosed herbal blend',
            'Not for pregnancy (unless a provider supervises), liver problems, or thyroid conditions without a doctor\'s OK (black cohosh and kelp)',
            'Not a substitute for a full multivitamin if you need minerals such as iron, calcium, or vitamin D',
        ],
        howToUse: {
            intro: 'Per the label shown on Amazon: adults take two gummies a day.',
            steps: [
                'Chew 2 gummies thoroughly before swallowing.',
                'Don\'t take more than the recommended dose.',
            ],
            sourceUrl: 'https://www.amazon.com/dp/B0BWSMCMTZ',
            sourceLabel: 'Amazon: CBB 13 in 1 Women\'s Gummies',
        },
        warnings: [
            'Liver disorders, or symptoms like abdominal pain, dark urine, or yellowing skin: avoid or stop and see a doctor. Contains black cohosh (US Pharmacopeia recommendation, via NIH ODS).',
            'Pregnant: don\'t take black cohosh unless a provider supervises (American Herbal Products Association, via NIH ODS).',
            'Thyroid conditions, a low-iodine diet, or thyroid medication: contains kelp, an iodine source, in an unlisted amount (NIH ODS).',
            'Contains 3 g of sugar per serving and Blue 1 dye.',
        ],
        communityReview: 'On Amazon it has 4.4 out of 5 stars from 1,300 ratings as of October 2026: 78% five stars, 4% four, 6% three, 5% two, and 7% one star. The brand\'s own product page shows no reviews and lists the product as sold out.',
        effectiveness: 'Low-dose vitamins with nine herbs in an undisclosed blend. No study of this product was found, and the herb amounts can\'t be compared with research.',
        ingredientScience: [
            {
                name: 'Black cohosh',
                text: 'Usually taken for menopause symptoms. NIH ODS reports at least 83 cases of liver damage worldwide, though a causal link hasn\'t been shown; the US Pharmacopeia recommends a caution for people with liver disorders. For hot flashes, a 2012 Cochrane review of 16 trials (2,027 women) found insufficient evidence for or against it, and a 2016 meta-analysis of 4 trials (511 women) found no significant reduction. This product doesn\'t disclose how much it contains.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/BlackCohosh-HealthProfessional/', label: 'NIH Office of Dietary Supplements: Black cohosh fact sheet for health professionals' },
                ],
            },
            {
                name: 'Kelp (iodine source)',
                text: 'Kelp supplements contain iodine. NIH ODS sets the adult upper limit at 1,100 mcg of iodine a day from all sources and says too much can cause goiter, thyroid inflammation, and other thyroid problems. High-dose iodine can interact with antithyroid drugs such as methimazole. The label doesn\'t list the kelp or iodine amount.',
                citations: [
                    { url: 'https://ods.od.nih.gov/factsheets/Iodine-Consumer/', label: 'NIH Office of Dietary Supplements: Iodine fact sheet for consumers' },
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
                        url: 'https://www.amazon.com/dp/B0BWSMCMTZ',
                        text: 'Amazon: CBB 13 in 1 Women\'s Gummies reviews',
                        summary: '4.4 out of 5 stars from 1,300 ratings on Amazon as of October 2026.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // GoodCycle (formerly DailyBasis): confirmed brand partner, added
    // 2026-10-27 at Eliz's request, 10th in the team's partner order.
    // Sources, all read for this entry: Eliz's copy (the description below,
    // used as written); GoodCycle's sell sheet and 2024 consumer focus-group
    // summary (PDFs from GoodCycle, supplied by Eliz); and takegoodcycle.com
    // (product page, Ingredients, Science, FAQ, References), read 2026-10-27.
    // Replenish and Balance are two formulas inside one box, not separate
    // purchases, so they are described here rather than set up as `variants`
    // (which in this catalog are buyable size/pack options).
    // Ingredient forms and amounts come from the Supplement Facts panels on the
    // sell sheet. takegoodcycle.com's Ingredients page differs in places
    // (it lists beta carotene, chromium picolinate and boron; the label lists
    // vitamin A palmitate, chromium amino acid chelate and no boron), so the
    // label is used. Reported to the team rather than resolved here.
    // Photos saved under public/products/goodcycle/.
    {
        id: 'p-goodcycle-dailybasis',
        name: 'DailyBasis by GoodCycle',
        brand: 'GoodCycle',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement', 'hormone-balance'],
        tags: ['irregular', 'cramps'],
        price: '$80 (14 Replenish + 14 Balance stick packs); $64 if you subscribe, per takegoodcycle.com',
        whereToBuy: ['takegoodcycle.com'],
        // Temporary link until GoodCycle's ayna affiliate link is ready. When it
        // is, add it as `affiliateUrl` (utils/buyLink.js prefers it over `url`).
        url: 'https://takegoodcycle.com/products/daily-basis',
        faqUrl: 'https://takegoodcycle.com/pages/faq',
        // Partner discount code, stored but NOT shown anywhere yet: GoodCycle is
        // testing it with their rebrand. Nothing in the app reads this field;
        // set live: true (and add the display) once GoodCycle confirms.
        discountCode: { code: 'AYNAHEALTH', percentOff: 30, live: false, note: 'Pending GoodCycle testing after the rebrand (2026-10-27).' },
        // Cover photo supplied by Eliz (2026-10-29); the rest from takegoodcycle.com.
        image: '/products/goodcycle/daily-basis-cover.webp',
        gallery: [
            '/products/goodcycle/daily-basis-both.webp',
            '/products/goodcycle/daily-basis-replenish.webp',
            '/products/goodcycle/daily-basis-balance.webp',
            '/products/goodcycle/daily-basis-replenish-facts.webp',
            '/products/goodcycle/daily-basis-balance-facts.webp',
        ],
        // Eliz's copy, as written.
        summary: 'The first daily multi powder supplement with two cycle-aligned formulas, Replenish and Balance. Each day, one stick pack mixes into 8 to 10 oz of cold water or a beverage of choice, with a light lemon-citrus flavor on a greens base. Both formulas are built on the same foundation: core vitamins and minerals in bioavailable forms, amino acids, probiotics, herbs and botanicals, and a greens blend.\n\nReplenish is taken from the first day of the period through ovulation (about 14 days). It is formulated around the nutrient needs of the first half of the cycle.\n\nBalance is taken from ovulation through the start of the next period (about 14 days). It is formulated around the nutrient needs of the second half of the cycle.\n\nQuality: OB/GYN formulated, manufactured in a GMP-certified facility, made with GRAS ingredients, and third-party tested. Incoming ingredients are tested for heavy metals, toxins and microorganisms.',
        safety: {
            fdaStatus: 'Dietary supplement. The FDA does not approve dietary supplements before they are sold; GoodCycle says it is made in a GMP-certified facility.',
            materials: '28 single-serve stick packs per box: 14 Replenish (7 g each) and 14 Balance (6.7 g each). Per the Supplement Facts on GoodCycle\'s sell sheet:\n\nReplenish (per stick pack): vitamin A (as palmitate) 80 mcg, vitamin C 123 mg, vitamin D3 37.5 mcg, vitamin E 13.9 mg, vitamin K2 (MK-7) 60 mcg, thiamin 4.3 mg, riboflavin 6.2 mg, niacin 30.8 mg, vitamin B6 (P-5-P) 6.2 mg, folate (5-MTHF) 700 mcg DFE, vitamin B12 (methylcobalamin) 50 mcg, biotin 308 mcg, pantothenic acid 8 mg, calcium (citrate) 160 mg, iron (bisglycinate chelate) 18 mg, iodine 123 mcg, magnesium (bisglycinate chelate) 60 mg, zinc 12 mg, selenium 95 mcg, manganese 2 mg, chromium 123 mcg, molybdenum 62 mcg, CoQ10 31.5 mg; greens blend 2,676 mg (organic barley grass, oat grass juice, wheat grass and alfalfa powders); botanicals and herbs blend 590 mg (organic broccoli powder, green tea leaf extract, lutein esters); amino acid blend 944 mg (N-acetyl L-cysteine, taurine, L-leucine, L-isoleucine, L-valine); probiotic blend 205 mg (L. rhamnosus, L. plantarum, L. reuteri, B. bifidum).\n\nBalance (per stick pack): vitamin A (as palmitate) 80 mcg, vitamin C 303 mg, vitamin D3 37.5 mcg, vitamin E 27.4 mg, vitamin K2 (MK-7) 60 mcg, thiamin 6.1 mg, riboflavin 6.1 mg, niacin 15.2 mg, vitamin B6 (P-5-P) 20 mg, folate (5-MTHF) 700 mcg DFE, vitamin B12 (methylcobalamin) 65 mcg, biotin 152 mcg, pantothenic acid 8 mg, calcium (citrate) 310 mg, iron (bisglycinate chelate) 12.3 mg, iodine 121 mcg, magnesium (bisglycinate chelate) 150 mg, zinc 11 mg, selenium 95 mcg, manganese 2 mg, chromium 60 mcg, molybdenum 61 mcg, CoQ10 15.2 mg; greens blend 909 mg; botanicals and herbs blend 786 mg (quercetin dihydrate, organic broccoli powder, alpha lipoic acid, phosphatidylcholine); amino acid blend 545 mg (N-acetyl L-cysteine, taurine, L-leucine, L-isoleucine, L-valine); probiotic blend 197 mg (L. rhamnosus, L. plantarum, L. reuteri, B. bifidum).\n\nOther ingredients (both): citric acid, natural flavor, monk fruit extract, sunflower lecithin.',
            allergens: 'GoodCycle says DailyBasis is certified gluten-free and its ingredients contain no dairy, gluten, lactose, egg, peanuts or coconut. The greens blend includes wheat grass and barley grass.',
            recalls: 'No recalls are mentioned on takegoodcycle.com; check current FDA recall notices.',
            sideEffects: 'In GoodCycle\'s 2024 focus group, many participants noted mild stomach upset in the first few days, which they said resolved quickly; GoodCycle suggests starting with half a serving and taking it with food at first.',
            opinionAlerts: 'Contains iron (18 mg in Replenish, 12.3 mg in Balance). GoodCycle says not to take more than one stick pack a day, and not to take it on top of a prenatal vitamin without a doctor\'s direction.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from GoodCycle\'s own materials (takegoodcycle.com, its sell sheet and its 2024 consumer study summary), not independent clinical literature.',
        doctorOpinion: 'GoodCycle says DailyBasis was formulated by an OB/GYN and functional medicine practitioner, with input from a registered dietitian, a nutritionist and a dermatologist. Its consumer study summary names the formulator as OB/GYN Dr. Christy Evans.\n\nThe brand describes Replenish (cycle days 1 to 14) as supporting replenishment after the period, energy, and follicle development, and Balance (days 14 to 28) as supporting mood and focus and easing PMS symptoms and cycle-related inflammation. These are the brand\'s descriptions; GoodCycle\'s site notes they have not been evaluated by the FDA.\n\nGoodCycle\'s own consumer study (2024, run by the brand, not a clinical trial): 45 people across life stages used the Cycle Routine for a full cycle (30+ days each) and reported their own results, with no placebo or comparison group. 98% were in their reproductive years or perimenopause, and participants included regular and irregular cycles, hormonal and copper IUDs, the pill, coming off the pill, PCOS, PMDD, perimenopause, trying to conceive and early postpartum. Self-reported results: 89% better digestion and regularity, 78% fewer PMS symptoms (less cramping, mood swings and fatigue), 71% more energy, 67% better sleep (reported by participants with PMDD and PCOS), 64% more cycle awareness and 44% better mood and mental clarity. Many noted mild stomach upset in the first few days that resolved quickly. All 45 said they were open to continued use. GoodCycle notes these are self-reported results, individual results may vary, and the statements have not been evaluated by the FDA.',
        doctorOpinionShort: 'Formulated by an OB/GYN, per GoodCycle. Replenish is built for the first half of the cycle and Balance for the second half, as the brand describes them.',
        doctorOpinionCitations: [
            { url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients (who formulated it, and why each ingredient)' },
            { url: 'https://takegoodcycle.com/pages/science', label: 'takegoodcycle.com: Science' },
        ],
        whoItsFor: [
            'Adults who menstruate and want one daily routine timed to the two halves of the cycle (per GoodCycle)',
            'Irregular, shorter or longer cycles: GoodCycle says to match each formula to where you are in your own cycle',
            'On hormonal birth control: GoodCycle says it can be used, and to check with a doctor if you don\'t get a period, since it contains iron',
        ],
        howToUse: {
            intro: 'Per GoodCycle\'s directions:',
            steps: [
                'Mix one stick pack into 8 to 10 oz of cold water or another cold drink. Take it with food if you\'re new to supplements.',
                'Replenish: start on the first day of your period and take it daily through ovulation, about 14 days.',
                'Balance: switch at ovulation and take it daily until your next period starts, about 14 days.',
                'When your next period begins, go back to Replenish. You can start at any point in your cycle with the matching formula.',
                'Take one stick pack a day, not more, unless a clinician tells you otherwise.',
            ],
            sourceUrl: 'https://takegoodcycle.com/pages/faq',
            sourceLabel: 'takegoodcycle.com: FAQ',
        },
        warnings: [
            'Pregnant, postpartum or breastfeeding: GoodCycle says it isn\'t formulated for pregnancy and to ask your clinician before starting.',
            'Trying to conceive: GoodCycle says not to take it in addition to a prenatal vitamin without a doctor\'s direction, to avoid too much of any nutrient.',
            'Taking prescription medicines, or have PCOS, endometriosis, PMDD or another diagnosed condition: talk with your clinician first (GoodCycle and the FDA both advise this).',
            'Not menstruating or menopausal: GoodCycle says it may not be the right fit, and to check with a clinician because it contains iron.',
            'Teens: GoodCycle says it is formulated for adults and to ask a pediatrician first.',
        ],
        communityReview: 'On takegoodcycle.com\'s reviews page, DailyBasis has 4.8 out of 5 stars from 48 reviews (checked October 29, 2026). Reviewers most often mention lighter cramps, better digestion, steadier energy and mood across the cycle, and an easy routine; several mix it into smoothies, and one says it tastes like greens. In their words: "I just finished my first month and I noticed my period cramps seem lighter!" (Emily); "It has noticeably improved my digestion and I\'ve been looking forward to the light energy boost" (Tessa); "I\'ve felt more stable and consistent levels of energy, mood, and hunger throughout the month, even on my period" (Nicolette); "No negative side effects for me, and I really enjoy the flavor" (Molly); and a reviewer with PMDD symptoms wrote that after a month of daily use, "those symptoms went away for my following cycle" (Dana). These reviews are on GoodCycle\'s own site, which chooses how reviews are shown: every review ayna could read there was 5 stars, and 4 were marked Verified.',
        effectiveness: 'No clinical trial of DailyBasis itself is cited by GoodCycle; its evidence is a 45-person self-reported focus group and published research on individual ingredients.',
        ingredients: 'Vitamins A, C, D3, E, K2 and B vitamins (incl. P-5-P B6, 5-MTHF folate, methyl B12), calcium, iron, iodine, magnesium, zinc, selenium, manganese, chromium, molybdenum, CoQ10, greens blend, botanicals (broccoli, green tea extract, lutein in Replenish; quercetin, alpha lipoic acid, phosphatidylcholine in Balance), amino acids (NAC, taurine, BCAAs), probiotics.',
        ingredientScienceNote: 'Every ingredient GoodCycle lists, with GoodCycle\'s own explanation of why it\'s there (from takegoodcycle.com/pages/ingredients). Where published research on an ingredient exists, it follows; those studies tested the ingredient on its own, often at a different dose, not DailyBasis. GoodCycle\'s explanations are the brand\'s claims, not checked by ayna.',
        ingredientScience: [
            {
                name: 'Vitamin B6',
                text: 'Per GoodCycle: We use pyridoxal 5\' phosphate, the active form of Vitamin B6, to help the body use its amino acids, metabolize excess hormones, and support energy and neurotransmitter production. Vitamin B6 paired with magnesium may help support easing common PMS symptoms.\n\nResearch: a systematic review of nine trials (940 women) found vitamin B6 at doses up to 100 mg a day likely helps premenstrual symptoms, though most of the trials were low quality. In a small trial, magnesium plus B6 lowered PMS scores the most of three groups, but scores also fell with placebo. Balance has 20 mg of B6 per serving (Replenish 6.2 mg), lower than many of the doses studied.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/10334745/', label: 'PubMed (NIH): Vitamin B-6 for premenstrual syndrome, systematic review (BMJ, 1999)' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3208934/', label: 'NIH (PMC): Magnesium, and magnesium plus vitamin B6, on PMS severity (Iran J Nurs Midwifery Res, 2010)' },
                    { url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' },
                ],
            },
            {
                name: 'Magnesium',
                text: 'Per GoodCycle: We use magnesium bisglycinate, a highly absorbable form of magnesium bound to the amino acid glycine. This form is less likely to cause gastrointestinal issues compared to other types of magnesium. Magnesium bisglycinate helps support heart and circulation health, supports blood sugar levels already within a normal range, supports relaxation, and aids in cellular energy production.\n\nResearch: in a small trial, magnesium plus vitamin B6 lowered PMS scores the most of three groups (magnesium alone, magnesium plus B6, placebo), but scores also fell with placebo. Balance has 150 mg of magnesium per serving (Replenish 60 mg).',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3208934/', label: 'NIH (PMC): Magnesium, and magnesium plus vitamin B6, on PMS severity (Iran J Nurs Midwifery Res, 2010)' },
                    { url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' },
                ],
            },
            {
                name: 'Calcium',
                text: 'Per GoodCycle: We use calcium citrate, a more absorbable form of calcium that works alongside Vitamin D3 to help contribute to bone growth and maintenance. Calcium is especially important for women, whose bone density needs shift as they age.\n\nResearch: in a double-blind trial of 66 students with PMS, 500 mg of calcium a day for two months reduced PMS symptom scores, including mood symptoms, compared with placebo. Balance has 310 mg of calcium per serving (Replenish 160 mg).',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28217679/', label: 'PubMed (NIH): Calcium for premenstrual syndrome, double-blind randomized trial (Obstet Gynecol Sci, 2017)' },
                    { url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' },
                ],
            },
            {
                name: 'Iron',
                text: 'Per GoodCycle: We use iron bisglycinate, a form of iron that minimizes nausea and gastrointestinal side effects sometimes associated with iron supplements. Iron is critical for the health of red blood cells and for the transport of oxygen throughout the body. Iron needs may increase for menstruating people due to monthly blood loss.\n\nResearch: in a 16-week study of teen girls in Indonesia, iron tablets improved iron levels compared with placebo whether taken weekly or for four days during the period, but weekly dosing raised hemoglobin more. Replenish has 18 mg of iron and Balance 12.3 mg, so DailyBasis provides iron every day of the cycle.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/11890637/', label: 'PubMed (NIH): Iron during menstruation vs. weekly iron supplementation (Asia Pac J Clin Nutr, 2002)' },
                    { url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' },
                ],
            },
            {
                name: 'Vitamin A',
                text: 'Per GoodCycle: We use beta carotene, a natural pigment found in plants and fruits like carrots, which the body converts into Vitamin A - an antioxidant that supports the immune system and supports skin and vision health. The Supplement Facts label lists vitamin A as palmitate, not beta carotene.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Vitamin C',
                text: 'Per GoodCycle: We use Vitamin C (ascorbic acid), which the body cannot produce naturally and is essential in helping to support immune health, promoting collagen formation, and supporting normal liver function.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Vitamin D3',
                text: 'Per GoodCycle: We use Vitamin D3 (cholecalciferol), the same form of Vitamin D produced by the skin when exposed to sunlight. In the body, Vitamin D3 supports calcium absorption for bone health, supports healthy blood sugar levels already within a normal range, and supports mood balance.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Vitamin E',
                text: 'Per GoodCycle: We use D-Alpha tocopherol, the most active, fat-soluble form of Vitamin E found in many seeds, nuts, and leafy green vegetables, which helps support the immune system and protects cells from harmful molecules called free radicals.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Vitamin K2',
                text: 'Per GoodCycle: We use menaquinone-7, a form of Vitamin K2, which supports bone health by helping direct calcium to where it\'s needed in the body.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Thiamin (vitamin B1)',
                text: 'Per GoodCycle: We use thiamin (also known as Vitamin B1) as energy-balancing support. Thiamin helps convert carbohydrates into energy and metabolize fats and proteins.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Riboflavin (vitamin B2)',
                text: 'Per GoodCycle: We use riboflavin 5-phosphate sodium (also known as Vitamin B2), which supports the metabolism of sugars and fats in the body, and helps the body convert and activate other B vitamins into active forms to help support hormone balance.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Niacin (vitamin B3)',
                text: 'Per GoodCycle: We use niacin, (also known as Vitamin B3), a vitamin that can help with energy levels, brain health, and bone/ joint health.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Folate (5-MTHF)',
                text: 'Per GoodCycle: We use 5-MTHF, the active version of folate (also known as Vitamin B9), a B vitamin that helps ease common PMS symptoms by supporting metabolism, brain function, and cellular energy production.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Vitamin B12',
                text: 'Per GoodCycle: We use methylcobalamin, the most active form of Vitamin B12, to help with healthy red blood cell production and the regulation of the nervous system.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Biotin (vitamin B7)',
                text: 'Per GoodCycle: Biotin (also known as Vitamin B7) helps the body break down fats, carbohydrates, and amino acids and can help with hair growth, nail strength, and skin health.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Pantothenic acid (vitamin B5)',
                text: 'Per GoodCycle: Pantothenic acid (also known as Vitamin B5), helps break down fatty acids by making a substance called co-enzyme A (CoA). CoA processes the other essential fatty acids found in DailyBasis, making them more effective in the body while also aiding in the breakdown of fatty acids from the diet.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Iodine',
                text: 'Per GoodCycle: We use potassium iodide, a salt of iodine, that supports thyroid function which is critical for regulating metabolism and energy levels.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Zinc',
                text: 'Per GoodCycle: We use zinc bisglycinate chelate, a highly absorbable form of zinc, to support immune function and reproductive health. Zinc bisglycinate chelate helps metabolize testosterone and support white blood cells in responding to immune challenges. It also has antioxidant properties that protect the body from oxidative stress.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Selenium',
                text: 'Per GoodCycle: We use selenium to support cell function, metabolism, and thyroid health, while supporting healthy circulation. Selenium may also help support balanced progesterone and estrogen levels.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Manganese',
                text: 'Per GoodCycle: Manganese bisglycinate, an absorbable form of manganese, helps the body metabolize carbohydrates, supports mitochondrial function, supports joint, bone, and organ health, and helps protect the body against oxidative damage.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Chromium',
                text: 'Per GoodCycle: Chromium picolinate, a more absorbable form of chromium, is a nutrient that supports metabolic health, supports a healthy inflammatory response after intense exercise, supports blood sugar levels already within a normal range, and can helps ease cravings for sugar and carbohydrates, particularly during the luteal phase of the cycle when these cravings tend to increase. The Supplement Facts label lists chromium as an amino acid chelate, not picolinate.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Molybdenum',
                text: 'Per GoodCycle: Molybdenum glycinate, an absorbable form of molybdenum, helps support hormonal balance by helping support normal liver function and the metabolism of progesterone and estrogen. It also aids in the metabolism of sulfur-containing amino acids, which supports thyroid hormone production.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'CoQ10',
                text: 'Per GoodCycle: We use CoQ10 to support mitochondrial function, helping support energy levels.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Quercetin (Balance)',
                text: 'Per GoodCycle: We use quercetin to help support immune health and a healthy inflammatory response in the body.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Alpha lipoic acid (Balance)',
                text: 'Per GoodCycle: We use Alpha Lipoic Acid, an antioxidant that helps protect from oxidative stress, can help support normal liver function, and helps support nerve health and energy production.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Phosphatidylcholine (Balance)',
                text: 'Per GoodCycle: Phosphatidylcholine is a component of the membranes that surround liver cells, that can help support normal liver cell structure and function.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Broccoli powder',
                text: 'Per GoodCycle: We use broccoli sprouts, which are rich in phytonutrients that support a healthy inflammatory response and can support hormone balance. They are also high in fiber, which aids in digestion and gut health.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Green tea leaf extract (Replenish)',
                text: 'Per GoodCycle: We use green tea extract to help support healthy blood sugar metabolism already within a normal range, which plays a role in energy, digestion, and overall balance.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Lutein esters (Replenish)',
                text: 'Per GoodCycle: We use lutein to support healthy circulation, which plays a role in supporting healthy follicle development.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'N-acetyl L-cysteine (NAC)',
                text: 'Per GoodCycle: N-Acetylcysteine (NAC) is an amino acid with antioxidant properties that can help support a healthy inflammatory response. NAC may help support the body\'s antioxidant defenses and glutathione production, which helps maintain cellular balance.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Taurine',
                text: 'Per GoodCycle: Taurine is an amino acid known for its role in helping support heart and brain health.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Branched-chain amino acids (leucine, valine, isoleucine)',
                text: 'Per GoodCycle: Branch Chain Amino Acids (BCAAs) are comprised of Leucine, Valine, and Isoleucine, which are essential nutrients typically found in animal products and legumes. BCAAs aid in protein synthesis and help support muscle maintenance.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Probiotics (L. rhamnosus, L. plantarum, L. reuteri, B. bifidum)',
                text: 'Per GoodCycle: We use a combination of potent diverse probiotics to support intestinal microbiome balance.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
            {
                name: 'Greens blend (oat grass, barley grass, wheatgrass, alfalfa)',
                text: 'Per GoodCycle: A high-fiber, antioxidant-rich greens blend designed to support active follicular development and help eliminate hormonal byproducts like excess estrogen.',
                citations: [{ url: 'https://takegoodcycle.com/pages/ingredients', label: 'takegoodcycle.com: Ingredients' }],
            },
        ],
        scientificCitations: [],
        verificationLinks: {
            doctor: { links: [] },
            scientific: {
                links: [
                    { platform: 'website', url: 'https://www.fda.gov/food/information-consumers-using-dietary-supplements/questions-and-answers-dietary-supplements', text: 'FDA: Questions and answers on dietary supplements', summary: 'The FDA does not have the authority to approve dietary supplements before they are marketed, and advises talking with a clinician before using one.' },
                ],
            },
            community: {
                links: [
                    { platform: 'website', url: 'https://takegoodcycle.com/pages/reviews', text: 'takegoodcycle.com: Customer reviews', summary: 'GoodCycle\'s reviews page: 4.8 out of 5 from 48 reviews as of October 29, 2026.' },
                    { platform: 'website', url: 'https://takegoodcycle.com/products/daily-basis', text: 'takegoodcycle.com: DailyBasis', summary: 'GoodCycle\'s product page, with customer quotes and directions.' },
                    { platform: 'website', url: 'https://takegoodcycle.com/pages/faq', text: 'takegoodcycle.com: FAQ', summary: 'GoodCycle\'s answers on cycle timing, birth control, pregnancy, allergens and medicines.' },
                    { platform: 'website', url: 'https://takegoodcycle.com/pages/references', text: 'takegoodcycle.com: Scientific references', summary: 'The research list GoodCycle cites for its ingredients.' },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
];

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
        summary: 'An at-home UTI test that reads urine for the same nitrite and leukocyte-esterase markers used on standard clinical dipsticks, giving an immediate digital result instead of color-matching a strip. A positive result — or symptoms that persist despite a negative one — connects you through Winx Rx, the brand\'s own telehealth service, to a board-certified doctor for a video visit and, if appropriate, a same-day prescription. Named to TIME\'s 2024 Best Inventions list as the only OTC test-plus-telehealth UTI kit of its kind sold in the US.',
        safety: {
            fdaStatus: 'Sold over-the-counter as a consumer diagnostic aid; not a substitute for a lab urine culture. Any prescription treatment is issued by a licensed telehealth provider via Winx Rx, not the test itself.',
            materials: 'See product packaging for full test component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None from the test itself. A home UTI test is a screening aid, not a diagnosis — persistent, worsening, or recurrent symptoms need in-person evaluation regardless of the result.',
            opinionAlerts: 'Winx Health markets this as "OBGYN approved" and cites that roughly half of US counties lack a practicing OB-GYN as the access gap this closes — both figures are from the brand\'s own site and TIME\'s coverage, not independently re-verified here.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'A home test with an immediate result and telehealth access to prescription treatment is a real improvement in access for a condition where roughly half of US counties don\'t have a practicing OB-GYN, and where a several-day wait for an in-person appointment often means days of untreated discomfort. UTIs are also genuinely common, with public-health estimates putting diagnoses in the hundreds of millions per year in the US, so an accessible screening option has real value.\n\nWhat this test doesn\'t do is replace a urine culture for recurrent, complicated, or atypical symptoms. Home UTI tests like this one generally screen for nitrites and/or leukocyte esterase, the same markers used on standard urine dipsticks, which have documented real-world sensitivity and specificity limits — a normal result doesn\'t fully rule out infection if symptoms are clearly present, and a positive result still benefits from culture-guided antibiotic choice if symptoms don\'t resolve or keep recurring. Fever, flank/back pain, or visible blood in urine are reasons to seek in-person care regardless of what a home test shows.',
        doctorOpinionShort: 'A real access improvement for uncomplicated UTI symptoms, especially where in-person OB-GYN care is scarce — but it\'s a screening aid built on standard dipstick-style markers, not a lab culture, and doesn\'t replace in-person care for fever, flank pain, or recurrent infections.',
        doctorOpinionCitations: [
            { url: 'https://time.com/collections/best-inventions-2024/7094898/winx-health-uti-test-and-treat/', label: 'TIME: 2024 Best Inventions — Winx Health UTI Test + Treat' },
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
                'If positive — or symptoms persist despite a negative result — start a video visit with a board-certified doctor through Winx Rx.',
                'Pick up same-day prescription treatment if the provider prescribes one.',
            ],
            sourceUrl: 'https://hellowinx.com/products/uti-tests',
            sourceLabel: 'hellowinx.com: UTI Test + Treat',
        },
        warnings: [
            'Seek in-person or emergency care for fever, chills, flank/back pain, nausea, or vomiting — these can signal a kidney infection, which a home test won\'t catch.',
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
        summary: 'An at-home vaginal pH test: wipe the included swab, press it to the test strip, and match the color to a chart to read your vaginal pH in under a minute. Marketed to help flag whether symptoms point toward BV, a yeast infection, or something else, with same-day prescription treatment available through Winx Rx if a provider agrees it\'s needed.',
        safety: {
            fdaStatus: 'Consumer diagnostic test; any prescription treatment is issued by a licensed telehealth provider, not the test itself.',
            materials: 'See product packaging for full test component list.',
            recalls: '⚠️ Marketing-accuracy note (not a recall): this is a single-marker pH strip test. Published research comparing pH testing to the lab-standard Nugent score found pH alone caught only about 22% of true BV cases, and yeast infections typically don\'t raise vaginal pH at all — so a normal result doesn\'t rule out a yeast infection, despite the product being marketed to help tell the two apart.',
            sideEffects: 'None from the test itself; any treatment side effects depend on the medication a provider prescribes.',
            opinionAlerts: 'A pH strip is a real but limited signal, mainly useful for flagging possible BV or trichomoniasis — not for ruling out a yeast infection. See Clinician opinion for the specifics.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Vaginal pH testing is a real, commonly used first clue in evaluating vaginitis — bacterial vaginosis and trichomoniasis typically raise vaginal pH above 4.5, and that\'s genuinely useful information. What this product\'s marketing (helping you "tell a yeast infection, BV, or something else apart") oversells is how much a pH strip alone can actually distinguish: published research comparing pH testing to the lab-standard Nugent score found pH alone caught only about 22% of true BV cases, and vulvovaginal candidiasis (yeast infection) typically does not raise pH at all, staying in the same range you\'d see in a healthy vagina.\n\nIn practice, that means an elevated pH is a real, weak-but-real signal to consider BV or trichomoniasis and seek treatment or testing, while a normal pH result tells you comparatively little — it does not rule out a yeast infection. If symptoms persist regardless of what the strip shows, in-person testing (which can look at more than pH) is the more reliable next step, and Winx Rx is one route to a same-day prescription if a provider agrees treatment is warranted.',
        doctorOpinionShort: 'A pH strip is a real but weak signal, mainly for BV — published data show it catches only around 22% of true BV cases, and it typically won\'t flag a yeast infection at all since those don\'t raise pH. A normal result doesn\'t rule much out.',
        doctorOpinionCitations: [
            { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5331313/', label: 'PMC: Colorimetric vaginal pH vs. Nugent score for BV detection' },
        ],
        whoItsFor: [
            'People who want a quick first clue (elevated vs. normal pH) before deciding whether to seek care',
            'Not a reliable stand-alone way to rule out a yeast infection — a normal pH doesn\'t mean "no yeast infection"',
            'Best paired with in-person testing or a Winx Rx telehealth visit if symptoms persist regardless of the reading',
        ],
        howToUse: {
            intro: 'Per Winx Health\'s own instructions:',
            steps: [
                'Wipe the cotton swab across the vaginal opening as directed.',
                'Press the swab onto the test strip\'s test area.',
                'Compare the color to the included chart within the stated time window.',
                'If elevated — or if symptoms persist regardless of the reading — use Winx Rx for a telehealth visit.',
            ],
            sourceUrl: 'https://hellowinx.com/products/vaginal-ph-test-for-yeast-infections',
            sourceLabel: 'hellowinx.com: Vaginal Health Test + Treat',
        },
        warnings: [
            'A normal pH result does not rule out a yeast infection — candidiasis typically does not raise vaginal pH.',
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
        doctorOpinion: 'Home urine hCG pregnancy tests are a well-established, reliable technology when used as directed — accuracy is highest starting the day of a missed period, and testing earlier increases the chance of a false negative simply because hCG may not yet be detectable, not because the test itself is unreliable. A single test, taken correctly at the right time, is genuinely accurate for most people; if a period doesn\'t start and a test reads negative, retesting in a few days or seeing a clinician is the standard next step, not assuming the first result is final.',
        doctorOpinionShort: 'A standard, well-established hCG urine test. Timing matters more than brand — testing on or after the day of a missed period is when accuracy is highest; a too-early negative can just mean hCG isn\'t detectable yet.',
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
                'Read the result within the test\'s stated time window — reading too early or too late can distort results.',
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
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['uti-prevention'],
        tags: ['uti'],
        price: '$10.50',
        whereToBuy: [],
        url: 'https://hellowinx.com/products/uti-fast-acting-pain-relief',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/01WinxUTIPainReliefHero.png?v=1771347535',
        summary: 'An over-the-counter phenazopyridine hydrochloride tablet (99.5mg) that targets UTI-related burning, urgency, and discomfort directly at the bladder and urethra — the same active ingredient sold under brand names like AZO. Most users feel relief within an hour; expect urine to temporarily turn reddish-orange, a normal and harmless effect of the medication.',
        safety: {
            fdaStatus: 'Over-the-counter urinary analgesic; active ingredient (phenazopyridine hydrochloride) has FDA-reviewed OTC status but with a real, documented safety profile below.',
            materials: 'Active ingredient: Phenazopyridine Hydrochloride 99.5mg per tablet. Inactive: corn starch, croscarmellose sodium, hypromellose, lactose, magnesium stearate, microcrystalline cellulose, polyethylene glycol, polyvinylpyrrolidone, pregelatinized starch, silicon dioxide, sodium starch glycolate, talc, triacetin.',
            recalls: '⚠️ Not a recall, but a real FDA-labeled concern worth knowing: phenazopyridine\'s FDA-reviewed label carries a carcinogenicity warning based on tumors seen in long-term animal studies (rats/mice), and rare cases of methemoglobinemia (a blood disorder) have been reported, more so in people with kidney disease. The label caps use at 2 days when taken alongside an antibiotic.',
            sideEffects: 'Turns urine reddish-orange (harmless, expected, but can stain fabric/contact lenses). Rare: methemoglobinemia (bluish skin/lips, unusual tiredness, shortness of breath — seek care immediately if these occur), especially with kidney disease. Masks the burning/urgency symptoms that would otherwise signal a worsening infection — it treats discomfort, not the infection itself.',
            opinionAlerts: 'This is a symptom-relief product, not an antibiotic — it does not treat the underlying infection. The FDA-reviewed label limits use alongside an antibiotic to 2 days, and it should not be used as a way to avoid or delay treating the infection itself.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Phenazopyridine is a genuinely effective, fast-acting urinary analgesic — it\'s the same active ingredient in AZO and similar store brands, has been used since the 1920s, and does provide real short-term relief from the burning and urgency of a UTI. That said, it treats the symptom, not the infection: taking it without also getting antibiotic treatment, if a UTI is actually present, risks masking symptoms while an untreated infection progresses.\n\nThe FDA-reviewed label also carries findings worth knowing before use: long-term animal studies found tumors associated with phenazopyridine, which is why the label includes a carcinogenicity warning and why the drug is meant for short-term use only — no more than 2 days alongside an antibiotic. Rare cases of methemoglobinemia, a blood disorder that reduces oxygen delivery, have also been reported, with higher risk in people with kidney disease. None of this makes an occasional, short course of a UTI pain reliever unreasonable — it\'s a real, useful product — but "short-term" is doing real work in that sentence.',
        doctorOpinionShort: 'A genuinely effective, fast-acting symptom reliever (same active ingredient as AZO) — but it treats discomfort, not the infection, and the FDA label caps use at 2 days alongside an antibiotic due to a carcinogenicity warning from animal studies and rare methemoglobinemia risk.',
        doctorOpinionCitations: [
            { url: 'https://www.ncbi.nlm.nih.gov/books/NBK580545/', label: 'NCBI StatPearls: Phenazopyridine' },
        ],
        whoItsFor: [
            'Short-term relief (1-2 days) of UTI-related burning, urgency, and discomfort, ideally alongside — not instead of — actual infection treatment',
            'Not for anyone with kidney disease without a clinician\'s okay, given the methemoglobinemia risk',
            'Not a substitute for diagnosing or treating the underlying infection',
        ],
        howToUse: {
            intro: 'Per the FDA-reviewed label for phenazopyridine hydrochloride products:',
            steps: [
                'Take only as directed on the package; do not exceed the labeled dose.',
                'Limit use to 2 days if also taking an antibacterial for a UTI, per the FDA-reviewed label.',
                'Expect reddish-orange urine — this is normal and expected, not a sign of a problem.',
                'Seek immediate medical attention for bluish/gray skin or lips, unusual tiredness, or shortness of breath.',
            ],
            sourceUrl: 'https://www.ncbi.nlm.nih.gov/books/NBK580545/',
            sourceLabel: 'NCBI StatPearls: Phenazopyridine',
        },
        warnings: [
            'FDA-reviewed label carries a carcinogenicity warning based on long-term animal studies; the drug is intended for short-term use only.',
            'Rare but serious: methemoglobinemia. Seek immediate care for bluish/gray skin, lips, or nails, unusual fatigue, rapid heartbeat, or shortness of breath — risk is higher with kidney disease.',
            'Do not use longer than 2 days when also taking an antibiotic, per the FDA-reviewed label, and don\'t use it as a substitute for actual infection treatment.',
        ],
        communityReview: 'Community reviews (Reddit, retailer sites) of phenazopyridine-based UTI relief products generally describe fast, real relief from burning and urgency, consistent across brands (AZO, store brands, Winx) since they share the same active ingredient; the main recurring complaint across the category is the orange-red urine color surprising first-time users despite label warnings.',
        ingredients: 'Phenazopyridine Hydrochloride 99.5mg per tablet, plus standard tablet excipients (corn starch, lactose, microcrystalline cellulose, and others — see full list above).',
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
        summary: 'A daily capsule combining Lactobacillus acidophilus, Lactobacillus rhamnosus, Lactobacillus reuteri, and Bifidobacterium lactis with inulin as a prebiotic — 15 billion CFU per serving. Marketed to support a healthy, acidic vaginal pH and help crowd out the bacteria and yeast linked to BV and yeast infections.',
        safety: {
            fdaStatus: 'Dietary supplement; not evaluated by the FDA for safety or efficacy claims.',
            materials: 'Lactobacillus acidophilus, Lactobacillus rhamnosus, Lactobacillus reuteri, Bifidobacterium lactis Bi-07, inulin (prebiotic fiber), 15 billion CFU per serving. See product packaging for the full excipient list.',
            recalls: 'No recalls found.',
            sideEffects: 'Generally well tolerated; mild bloating or GI upset is possible when starting any new probiotic. Consult a clinician before use if pregnant, nursing, immunocompromised, or taking medications.',
            opinionAlerts: 'Oral Lactobacillus probiotics for vaginal health are a real, actively studied area with genuinely promising (though still evolving) evidence for specific strains and doses — not settled science, but not just marketing either. See Clinician opinion for the honest state of that research.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'This is one of the more evidence-backed categories in vaginal wellness supplements, worth saying plainly since so much of this space is under-studied. Lactobacillus dominance is genuinely associated with a healthier vaginal microbiome and lower rates of BV and UTIs, and specific Lactobacillus strains — rhamnosus and reuteri among them — have real randomized-trial support for helping restore or maintain that balance, whether taken orally or vaginally.\n\nThe honest caveats: strain, dose, and duration matter a lot in this literature — results don\'t generalize cleanly across every Lactobacillus product, and reviews consistently call for more standardized, larger trials before this can be called settled. This product\'s specific 4-strain, 15-billion-CFU blend has not itself been through an independent published clinical trial that ayna could find; the evidence above is for the strain category and related formulations, not proof of this exact product\'s outcomes. It\'s a reasonable, biologically plausible daily supplement for someone maintaining vaginal health — not a proven treatment for an active infection.',
        doctorOpinionShort: 'Lactobacillus probiotics for vaginal health are a genuinely promising, actively researched area with real trial support for specific strains — this product\'s exact 4-strain blend hasn\'t itself been independently trialed, but the underlying strain category has real evidence behind it.',
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11318795/', label: 'PMC: Probiotics for the Prevention of Vaginal Infections — Systematic Review' },
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
                'Take consistently — probiotic effects on the vaginal microbiome are cumulative, not immediate.',
                'Store as directed on the label (many probiotics are moisture- and heat-sensitive).',
            ],
            sourceUrl: 'https://hellowinx.com/products/vaginal-health-probiotic',
            sourceLabel: 'hellowinx.com: Vaginal Health Probiotic',
        },
        communityReview: 'Community discussion of vaginal-health probiotics broadly (Reddit r/WomensHealth) is generally favorable for daily maintenance and odor concerns, though individual response varies and this specific 4-strain Winx formulation doesn\'t yet have a large independent review base outside retailer star ratings.',
        ingredients: 'Lactobacillus acidophilus, Lactobacillus rhamnosus, Lactobacillus reuteri, Bifidobacterium lactis Bi-07, inulin. 15 billion CFU per serving.',
        effectiveness: 'Grounded in a genuinely active, promising research area for the strain category; this exact product blend has not been independently clinically trialed. Best understood as daily maintenance support, not treatment.',
        scientificCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11318795/', text: 'PMC: Probiotics for the Prevention of Vaginal Infections: A Systematic Review', summary: 'Reviews Lactobacillus strain evidence for vaginal infection prevention — genuine, growing support for specific strains, with a continued need for larger, more standardized trials.' },
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
        doctorOpinion: 'Cranberry and D-mannose are the two most-studied "natural" UTI-prevention ingredients, and it\'s worth being specific about how the evidence for each actually stacks up, because it\'s genuinely different. Cranberry\'s active compounds (A-type proanthocyanidins, or PACs) interfere with E. coli\'s ability to stick to the bladder wall, and a large 2023 Cochrane review — 50 studies, nearly 9,000 participants — found cranberry products reduced UTI risk by about 30% in women with recurrent UTIs: real, moderate-certainty evidence, though the review also found no clear dose-response relationship and didn\'t support use in pregnant women, the elderly, or people with bladder-emptying problems.\n\nD-mannose is the weaker story right now: it works on paper the same way, binding E. coli so it can\'t adhere to the bladder wall, and some smaller, earlier studies looked promising, but the most recent, larger systematic reviews and meta-analyses of randomized trials — including a major UK primary-care trial — have not found a significant reduction in recurrent UTI risk compared to placebo. That\'s a meaningfully different evidence picture than cranberry, and worth knowing if D-mannose is the ingredient someone is buying this product for specifically.',
        doctorOpinionShort: 'Cranberry PACs have real, moderate-certainty support from a large 2023 Cochrane review (~30% UTI risk reduction in recurrent-UTI-prone women). D-mannose\'s evidence is weaker than commonly believed — recent larger trials haven\'t found a significant benefit over placebo.',
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', label: 'Cochrane: Cranberries for preventing urinary tract infections (2023)' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41004704/', label: 'PubMed: D-mannose for recurrent UTI — systematic review & meta-analysis' },
        ],
        whoItsFor: [
            'People prone to recurrent UTIs looking for a daily preventive supplement, particularly for the cranberry-PAC component',
            'Not a treatment for an active, symptomatic UTI — this is prevention, not treatment',
            'Worth knowing: the D-mannose component has weaker trial support than the cranberry component',
        ],
        howToUse: {
            intro: 'Per Winx Health\'s own instructions:',
            steps: [
                'Take two capsules daily with water.',
                'Take consistently for preventive effect — this is not a fast-acting treatment.',
                'Stay well hydrated, which independently supports urinary tract health.',
            ],
            sourceUrl: 'https://hellowinx.com/products/uti-daily-protection-supplement',
            sourceLabel: 'hellowinx.com: Urinary Daily Defense',
        },
        warnings: [
            'Not a treatment for an active UTI — seek care for burning, urgency, fever, or back pain.',
            'D-mannose is a sugar; people managing diabetes or blood sugar should factor that in.',
            'High-dose vitamin C can raise kidney stone risk in people already predisposed — check with a clinician if you have a stone history.',
        ],
        communityReview: 'Community sentiment on cranberry/D-mannose UTI-prevention supplements broadly (Reddit r/UTI) is mixed and often anecdotal, split between people who feel real preventive benefit and people, often those with more complex recurrent-UTI histories, who don\'t notice a difference — consistent with the split clinical evidence between the two headline ingredients.',
        ingredients: 'Cranberry extract (proanthocyanidins), D-mannose, turmeric, vitamin C.',
        effectiveness: 'Cranberry PAC component has real, moderate-certainty supporting evidence; D-mannose component\'s evidence has weakened in more recent, larger trials. No independent trial of this exact combined formulation was found.',
        scientificCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/37068952/', text: 'Cochrane: Cranberries for preventing urinary tract infections', summary: '2023 update, 50 studies / ~8,857 participants: cranberry products reduced UTI risk (RR 0.70) in women with recurrent UTIs, children, and people with UTI susceptibility from an intervention; moderate-certainty evidence.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41004704/', text: 'PubMed: Efficacy of D-mannose as prophylaxis of recurrent urinary tract infection — systematic review and meta-analysis of RCTs', summary: '6 RCTs, 1,167 participants: D-mannose was not associated with a significant reduction in recurrent UTI risk compared with control.' },
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
    // SootheHer — confirmed Ayna brand partner (added 2026-09-23). Product
    // facts checked against sootheher.com and its own product-page copy via
    // web search (direct fetch of sootheher.com is blocked in this
    // environment). No independently confirmed FDA 510(k) clearance number
    // was found; the "FDA cleared" claim below is the brand's own and is
    // flagged as such, consistent with how unverified brand claims are
    // handled elsewhere in this file.
    {
        id: 'p-sootheher-elaris-pod',
        name: 'SootheHer Elaris Pod',
        brand: 'SootheHer',
        category: 'cramp-relief',
        type: 'physical',
        internal: false,
        healthFunctions: ['cramp-relief'],
        tags: ['cramps', 'discomfort', 'drug-free', 'safety-concern'],
        price: '$89.99',
        whereToBuy: ['sootheher.com'],
        url: 'https://sootheher.com/',
        image: '',
        summary: 'A wearable TENS (transcutaneous electrical nerve stimulation) device from SootheHer designed for drug-free period cramp relief. The slim pod pairs with a butterfly-shaped gel pad worn under clothing, delivering adjustable electrical pulses the brand says interrupt cramp pain signals and prompt the body to release its own endorphins. Comes with a 30-day return window.',
        safety: {
            fdaStatus: 'Marketed by the brand as FDA cleared; ayna was not able to independently confirm a specific 510(k) clearance number in the FDA database at time of writing — verify current regulatory status directly with SootheHer.',
            materials: 'Reusable electronic pod; single-use adhesive gel pads (each gel pad rated for roughly 30–40 uses, about 12 cycles, per the brand).',
            recalls: 'No recalls found.',
            sideEffects: 'TENS therapy is generally well tolerated. Published trials report mild skin redness or irritation at the electrode site as the main side effect; no serious adverse events have been reported in the dysmenorrhea TENS literature, though safety reporting in that literature is limited.',
            opinionAlerts: 'TENS devices should not be used by people with a pacemaker or other implanted electrical device, over broken or irritated skin, or — per general TENS guidance — during pregnancy without a clinician\'s okay. Confirm current contraindications directly with SootheHer or the product manual.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'TENS for period pain is a genuinely well-studied, non-pharmacological option, which puts it on firmer footing than a lot of period-pain gadgets. A 2024 Cochrane review found both high- and low-frequency TENS may reduce pain compared with placebo or no treatment, and a separate 2024 meta-analysis of 10 randomized trials (469 women) found a statistically significant reduction in pain intensity. The mechanism is plausible and established: TENS is thought to work by blocking pain-signal transmission at the spinal level and prompting the body to release its own endorphins.\n\nThe honest caveat is about evidence quality, not the concept: the Cochrane reviewers downgraded their certainty because of risk of bias in the underlying trials, and the newer meta-analysis found very high heterogeneity between studies, meaning results varied a lot from trial to trial, which makes it hard to say precisely how much relief to expect. Safety data is reassuring — mild skin irritation is the main reported side effect, with no serious adverse events across trials — though as with the efficacy data, safety reporting in these trials wasn\'t always rigorous. This SootheHer-branded pod itself has not been through an independent published clinical trial that ayna could find; the evidence above is for TENS as a category/modality, not proof of this exact product\'s results.',
        doctorOpinionShort: 'TENS for period cramps has real, if imperfect, evidence: a 2024 Cochrane review found it may reduce pain vs. placebo, and a separate meta-analysis found a significant effect — but both flag meaningful study-quality and heterogeneity concerns. This specific pod hasn\'t been independently trialed itself.',
        doctorOpinionCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013331.pub2/abstract', label: 'Cochrane: TENS for pain control in primary dysmenorrhea (2024)' },
            { url: 'https://doi.org/10.1080/17581869.2026.2714978', label: 'Pain Management: TENS for primary dysmenorrhea — systematic review & meta-analysis' },
        ],
        whoItsFor: [
            'People looking for a drug-free, reusable option for period cramp pain alongside or instead of OTC pain relievers',
            'Not recommended for anyone with a pacemaker or other implanted electrical device, or over broken/irritated skin',
            'Best understood as a real but variable-benefit option — trial evidence is genuinely mixed on how much relief to expect',
        ],
        howToUse: {
            intro: 'Per SootheHer\'s own instructions:',
            steps: [
                'Attach the pod to a fresh gel pad and place the butterfly pad on clean, dry skin (typically lower abdomen).',
                'Select a treatment mode and intensity level — sensations range from tingling to tapping to pulsing.',
                'Adjust intensity to find a comfortable, effective level; most users report feeling relief within minutes.',
                'Replace the gel pad after roughly 30–40 uses (about 12 cycles), or sooner if adhesion or sensation weakens.',
            ],
            sourceUrl: 'https://sootheher.com/',
            sourceLabel: 'sootheher.com: Elaris Pod',
        },
        warnings: [
            'Do not use if you have a pacemaker or other implanted electrical medical device.',
            'Do not apply over broken, irritated, or numb skin.',
            'Check with a clinician before use during pregnancy, per general TENS guidance.',
            'Persistent, severe, or worsening pelvic pain — or pain that doesn\'t respond to typical measures — warrants clinical evaluation; conditions like endometriosis can present as "just bad cramps."',
        ],
        communityReview: 'Independent (non-brand) review volume specific to the SootheHer Elaris Pod is limited at time of writing; the brand offers a 30-day no-questions-asked return window. Broader TENS-for-period-pain community sentiment (Reddit, TikTok) is generally positive for the concept, with individual results varying — consistent with the high heterogeneity seen in the clinical trial literature.',
        ingredients: 'Reusable electronic TENS pod with adjustable intensity levels; single-use adhesive gel pads.',
        effectiveness: 'TENS as a modality has real, if heterogeneous, trial support for reducing dysmenorrhea pain. This specific product has not been independently clinically trialed; expect the same trial-to-trial variability seen in the broader TENS literature rather than a guaranteed result.',
        scientificCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013331.pub2/abstract', text: 'Cochrane: Transcutaneous electrical nerve stimulation (TENS) for pain control in women with primary dysmenorrhoea', summary: '2024 Cochrane review: both high- and low-frequency TENS may reduce pain vs. placebo/no treatment, though certainty was downgraded for risk of bias in the underlying trials.' },
            { url: 'https://doi.org/10.1080/17581869.2026.2714978', text: 'Pain Management: Transcutaneous electrical nerve stimulation in the relief of primary dysmenorrhea — systematic review and meta-analysis', summary: '10 RCTs, 469 women: statistically significant reduction in pain intensity favoring TENS, with very high heterogeneity between studies.' },
        ],
        integrations: [],
        badges: ['Drug-Free'],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/PeriodProblems/search/?q=TENS%20OR%20elaris%20OR%20sootheher', text: 'Reddit r/PeriodProblems: TENS/Elaris/SootheHer search', summary: 'User discussion of TENS devices for period pain.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=sootheher%20elaris%20pod', text: 'TikTok: SootheHer Elaris Pod', summary: 'Real-use videos and reviews.' },
                { platform: 'instagram', url: 'https://www.instagram.com/sootheher/', text: 'SootheHer on Instagram', summary: 'Brand content and community posts.' },
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
        // Confirmed ayna brand partner (2026-09-23). isEmergingBrand only
        // adds the "Brand" tag on Discovery — the "ayna Partner" badge comes
        // from src/utils/partnerBrands.js's PARTNER_BRAND_PATTERNS allowlist,
        // which gina is now in.
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
        tags: ['pelvic-floor', 'leaks', 'discomfort', 'fitness', 'postpartum', 'prolapse'],
        price: '$30/month or $180/year (14-day free trial)',
        whereToBuy: ['Connect Pelvic Floor Fitness'],
        platform: 'Web, app, Roku, Amazon Fire TV, Apple TV',
        url: 'https://www.connectpelvicfloorfitness.com/',
        affiliateUrl: 'https://goto.connectpelvicfloorfitness.com/YVk7WO',
        image: '',
        summary: 'A pelvic-floor-informed fitness program founded by Caroline Packard, DPT, after her own postpartum stress incontinence and prolapse. Combines pelvic floor rehab principles with real strength training, HIIT, yoga, and mobility work to build pelvic floor and whole-body strength.',
        ingredients: 'Not a physical product — see "How it works" below for what the membership includes.',
        safety: {
            fdaStatus: 'Fitness and education service; not a medical device.',
            materials: 'N/A',
            recalls: 'N/A',
            sideEffects: 'Exercise programs may not be appropriate for every pelvic floor condition. Stop if exercises cause pain or worsen symptoms and consult a pelvic floor physical therapist or clinician when needed. Diastasis recti evidence for exercise alone is limited (see Clinician opinion below) — anyone with a significant abdominal separation should be evaluated by a clinician before relying on exercise as a sole treatment.',
            opinionAlerts: 'Program information is based on the brand\'s own description; individual results depend on the specific condition, adherence, and guidance from a clinician when needed.'
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Program is designed by Caroline Packard, DPT — a pelvic floor physical therapist with 15+ years of clinical experience. Description sourced from Connect Pelvic Floor Fitness; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'This program\'s core approach — pelvic floor muscle training (PFMT) — has real, strong independent evidence behind it for two of the conditions it targets. A Cochrane systematic review of 31 trials in 1,817 women found PFMT can cure or improve stress and other types of urinary incontinence, and is recommended as part of first-line conservative management. A separate systematic review and meta-analysis of 13 trials in 2,340 women found PFMT produced greater subjective and objective improvement in pelvic organ prolapse symptoms and stage compared to controls.\n\nEvidence for exercise specifically correcting diastasis recti (abdominal separation) is more limited. A recent systematic review and meta-analysis found no clear evidence that exercise-based interventions alone reduce inter-recti distance in postpartum women, though exercise may still provide functional or symptomatic benefit even without measurably closing the gap.\n\nThese citations are for pelvic floor muscle training and postpartum exercise generally — no independent study of this specific program\'s protocol was found.',
        doctorOpinionShort: 'Pelvic floor muscle training (the program\'s core approach) has strong independent evidence for improving urinary incontinence and pelvic organ prolapse symptoms specifically. Evidence for exercise alone correcting diastasis recti is more limited. No independent study of this specific program\'s protocol was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/25408383/', label: 'PubMed: Pelvic floor muscle training for urinary incontinence in women — a Cochrane systematic review' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/26407564/', label: 'PubMed: The efficacy of pelvic floor muscle training for pelvic organ prolapse — a systematic review and meta-analysis' },
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
                text: 'PubMed: Pelvic floor muscle training for urinary incontinence in women — a Cochrane systematic review',
                summary: '31 trials, 1,817 women. Found PFMT can cure or improve stress and other types of urinary incontinence — general evidence for the training approach, not this specific program.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/26407564/',
                text: 'PubMed: The efficacy of pelvic floor muscle training for pelvic organ prolapse — a systematic review and meta-analysis',
                summary: '13 trials, 2,340 women. Found PFMT improved both subjective prolapse symptoms and objective prolapse severity versus controls.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/41995773/',
                text: 'PubMed: What is the evidence for abdominal and pelvic floor muscle training to treat diastasis recti abdominis postpartum? — an updated systematic review and meta-analysis',
                summary: 'Found no clear evidence that exercise-based interventions alone reduce inter-recti distance, though exercise may still help function/symptoms. Included for balance — this is a more cautious finding than the incontinence/prolapse evidence above.',
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
                        summary: 'Real, current App Store listing. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://play.google.com/store/apps/details?id=com.VidApp.ConnectPelvicFloor',
                        text: 'Google Play: Connect Pelvic Floor Fitness',
                        summary: 'Real, current Google Play listing. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
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
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://go.shopmy.us/p-83948920',
        image: 'https://www.vio2tape.com/cdn/shop/files/vio2tape-health-beauty-1-pack-try-it-vio2-unscented-mouth-tape-33555330531505_1024x874.png?v=1781819129',
        summary: 'A patented, partial-coverage mouth tape designed by dentist Dr. Vincent Ip and his wife Lindsey Ip after their young son was diagnosed with a breathing disorder and open-mouth posture. Meant to encourage a gentle lip seal during sleep while still allowing natural airflow — intended to support nasal breathing and reduce snoring.',
        safety: {
            fdaStatus: 'Personal-care product; not an FDA-cleared medical device.',
            materials: 'Breathable cotton-and-spandex blend fabric with hypoallergenic medical-grade adhesive, in a patented I-shaped, partial-coverage design (U.S. Design Patent No. D1,047,152). Free from latex, PFAS, and gluten. Unscented. Made in USA.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states this is not intended for children under 6, or for anyone with a breathing disorder, heart condition, nasal congestion, risk of vomiting, who has used alcohol or sedatives, or who is unable to remove the tape themselves. Single-use; discard after each application. Independent sleep and ENT specialists separately caution that mouth taping in general is not recommended for anyone with untreated or undiagnosed sleep apnea, significant nasal obstruction, GERD, or a heart or lung condition (including asthma), since forcing the mouth closed can worsen airway resistance if nasal breathing is already blocked.',
            opinionAlerts: 'Brand markets this as "the only mouth tape on the market designed, created & approved by a doctor" and "the #1 recommended mouth tape by medical professionals" — brand claims, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from VIO2\'s own site; Dr. Vincent Ip, DDS, is a real, practicing dentist in Austin, TX, but no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'Independent research on mouth taping generally is real but still limited and mixed. A 2024 scoping review found only 9 studies (4 randomized controlled trials) on the topic, described the evidence as markedly heterogeneous, and noted many of the touted benefits aren\'t grounded in the literature. A separate preliminary study specifically in mouth-breathers with mild obstructive sleep apnea found mouth-taping roughly halved measures of apnea severity (AHI) and snoring — a real, positive finding, but from a small, preliminary study, and not a test of this specific product.\n\nSeparately, several sleep and ENT specialists have publicly cautioned against mouth taping for people with untreated sleep apnea or nasal obstruction, since it doesn\'t address the underlying airway issue and could worsen it. No independent clinical study of this specific product was found.',
        doctorOpinionShort: 'Independent research on mouth taping is real but limited: a 2024 scoping review found the evidence heterogeneous and many claimed benefits not literature-backed, while a small preliminary study in mild OSA mouth-breathers found roughly a 50% reduction in apnea severity. Sleep and ENT specialists caution against it for anyone with untreated sleep apnea or nasal obstruction. No independent study of this specific product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/39662104/', label: 'PubMed: Nocturnal mouth-taping and social media — a scoping review of the evidence' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/36141367/', label: 'PubMed: The Impact of Mouth-Taping in Mouth-Breathers with Mild Obstructive Sleep Apnea — a preliminary study' },
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
                'Choose your preferred orientation — the patented design can be worn two ways.',
                'Close your mouth, apply the tape over the lips, and press gently to secure.',
                'Leave on overnight; the partial-coverage shape leaves room for natural lip movement and emergency mouth breathing if needed.',
                'Remove and discard in the morning — single-use, one strip per night.',
            ],
            sourceUrl: 'https://www.vio2tape.com/products/vio2-unscented-mouth-tape',
            sourceLabel: 'vio2tape.com: Partial-Coverage Mouth Tape',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not for anyone with untreated or undiagnosed sleep apnea, significant nasal obstruction, GERD, or a heart or lung condition (including asthma) — get evaluated by a doctor first.',
            'Not intended for children under 6, or for anyone who has used alcohol or sedatives, or who is unable to remove the tape themselves.',
            'Single-use — discard after each night.',
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
                text: 'PubMed: Nocturnal mouth-taping and social media — a scoping review of the evidence',
                summary: 'Found only 9 studies (4 RCTs) on mouth taping as of 2024; called the evidence markedly heterogeneous and noted many popular claims aren\'t literature-backed.',
            },
            {
                url: 'https://pubmed.ncbi.nlm.nih.gov/36141367/',
                text: 'PubMed: The Impact of Mouth-Taping in Mouth-Breathers with Mild Obstructive Sleep Apnea — a preliminary study',
                summary: 'Found mouth-taping roughly halved apnea-severity (AHI) and snoring measures in mouth-breathers with mild OSA — a real but small, preliminary finding.',
            },
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7153879/',
                text: 'NIH (PMC): The effect of nasal and oral breathing on airway collapsibility in obstructive sleep apnea — computational fluid dynamics analyses',
                summary: 'Mechanistic evidence that oral breathing is associated with greater airway collapsibility than nasal breathing — general physiology, not product-specific validation.',
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
                        summary: 'Real, current retail listing. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.vio2tape.com/products/vio2-partial-coverage-mouth-tape-for-sleep-unscented?variant=40800110837937&utm_source=ShopMy&utm_medium=affiliate&utm_campaign=Puloma%20Bishnu&utm_content=Quick%20Link&utm_referrer=shopmy.us&smsclickid=fd2d10e7-a850-4203-9d74-4bcb9c91f6bd&utm_term=fd2d10e7-a850-4203-9d74-4bcb9c91f6bd',
                        text: 'vio2tape.com: Customer reviews',
                        summary: 'VIO2\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                ],
            },
        },
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
        summary: 'Proov was founded by Amy Beckley, PhD (pharmacology), after years of infertility and seven miscarriages she traced to a luteal phase defect — low progesterone after ovulation. She invented the PdG test at home to track her own hormones, founded MFB Fertility, and the resulting Proov PdG test received FDA clearance in 2020 (510(k) K191462) as the first at-home test cleared to confirm ovulation. This kit tracks FSH, E1G, LH, and PdG across a full cycle to identify up to a 6-day fertile window and confirm ovulation, rather than only predicting it.',
        safety: {
            fdaStatus: 'The core PdG (progesterone metabolite) test technology in this kit received FDA 510(k) clearance in 2020 (K191462, MFB Fertility, Inc.) as the first at-home test cleared to confirm ovulation; verify current clearance status for the full Complete kit directly on proovtest.com.',
            materials: '20 test strips (3 FSH + 17 multi-hormone) plus the Proov Insight app for automatic reading. See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself.',
            opinionAlerts: 'Brand states "women who track their whole cycle get pregnant 3x faster" than those tracking ovulation timing alone — a brand claim, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site; founder Amy Beckley, PhD, is a real pharmacologist, but no independent clinician endorsement of this specific kit has been verified by ayna.',
        doctorOpinion: 'A published pilot study of the PdG test (13 women, 34 cycles) found it could confirm ovulation using a validated urine PdG threshold, building on prior ultrasound-validated research. Proov has also published its own later study (in Obstetrics & Gynecology Research, 2022) linking sustained elevated PdG across a cycle to higher clinical pregnancy rates and lower first-trimester loss — a real, notable finding, though it\'s the brand\'s own sponsored research rather than a fully independent trial.\n\nComplete adds FSH and estrogen (E1G) tracking on top of the core PdG technology, covering ovarian reserve and the fertile window in the same kit; no independent study of the full Complete kit specifically (versus the standalone PdG test) was found.',
        doctorOpinionShort: 'The core PdG technology in this kit is FDA-cleared (2020) and has real, published, if still limited, evidence behind it — a pilot study and the brand\'s own larger follow-up study linking PdG patterns to pregnancy outcomes. No independent study of the full Complete kit (FSH + estrogen + PdG together) was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6614355/', label: 'NIH (PMC): Pilot Evaluation of a New Urine Progesterone Test to Confirm Ovulation in Women Using a Fertility Monitor' },
            { url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462', label: 'FDA: 510(k) clearance K191462 — MFB Fertility, Inc. (Proov)' },
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
            'A single cycle of testing doesn\'t diagnose infertility — talk to a doctor about persistent irregular results, or if you don\'t conceive after 6–12 months of trying (standard fertility guidance).',
            'Follow the app\'s testing-window and strip-reading instructions closely; urine concentration and timing affect hormone test accuracy.',
        ],
        communityReview: 'Proov has 181 reviews on the independent platform reviews.io, averaging 4.43/5 stars (138 rated "excellent"). Feedback is mixed — many highlight the app-based reading and full-cycle hormone picture as genuinely useful, while others report frustration with test accuracy or customer service.',
        effectiveness: 'Tracks four hormones across a full cycle rather than a single ovulation-prediction hormone. The underlying PdG technology is FDA-cleared and has real published validation; the full 3-hormone Complete kit itself hasn\'t been independently studied as a unit.',
        // Category-level citations shown only on the Scientific literature
        // tab, kept out of verificationLinks so they don't also pool onto
        // the Clinician opinion card's chip row.
        scientificCitations: [
            {
                url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6614355/',
                text: 'NIH (PMC): Pilot Evaluation of a New Urine Progesterone Test to Confirm Ovulation in Women Using a Fertility Monitor',
                summary: '13 women, 34 cycles — an early, small pilot validation of the PdG test technology at the heart of this kit.',
            },
            {
                url: 'https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfpmn/pmn.cfm?ID=K191462',
                text: 'FDA 510(k) K191462 — MFB Fertility, Inc.',
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
                        summary: 'Independent, third-party review platform — 181 reviews, 4.43/5 average at time of writing.',
                    },
                    {
                        platform: 'website',
                        url: 'https://www.trustpilot.com/review/proovtest.com',
                        text: 'Trustpilot: proovtest.com reviews',
                        summary: 'Real, current Trustpilot listing. Review content/aggregate rating weren\'t independently re-verified beyond the reviews.io figure above — read them directly on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/tryingtoconceive/comments/1h6ruhz/proovworth_it/',
                        text: 'Reddit r/tryingtoconceive: "Proov...worth it?"',
                        summary: 'Real, current Reddit thread discussing whether Proov is worth buying. Reddit couldn\'t be fetched directly, so individual comment content wasn\'t independently verified here — read them on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/TryingForABaby/comments/1spmq1x/proov_pdg_tests/',
                        text: 'Reddit r/TryingForABaby: "Proov PdG tests"',
                        summary: 'Real, current Reddit thread discussing Proov\'s PdG test strips — the same underlying technology used in this kit. Content wasn\'t independently verified here — read it on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/TryingForABaby/comments/1m327gy/field_report_proov_test_strips_are_not_reliable/',
                        text: 'Reddit r/TryingForABaby: "Field Report: Proov test strips are not reliable"',
                        summary: 'Real, current Reddit thread reporting reliability concerns with Proov\'s test strips. This is a genuine user complaint worth reading directly — ayna couldn\'t independently verify the specifics behind the claim.',
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
        summary: 'A couples\' fertility kit pairing Proov\'s Complete testing (ovarian reserve, fertile window, ovulation confirmation) for her with an at-home motile sperm concentration test for him, plus early pregnancy tests — covering both sides of a fertility picture at once.',
        safety: {
            fdaStatus: 'Uses the same FDA-cleared PdG ovulation test as Proov Complete (510(k) K191462) plus the FDA-cleared YO Home Sperm Test for the male-fertility component; verify current clearance status for the combined kit directly on proovtest.com.',
            materials: 'Includes Complete for Her, an at-home YO sperm test for Him, and Check for Her (early pregnancy tests). See packaging for full component list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the tests themselves.',
            opinionAlerts: 'Brand states results are "99% accurate" and that "up to 60% of fertility challenges" involve a male factor — brand claims, not independently verified here. Independent ASRM/WHO data put male factor as sole or contributing cause in roughly 40–50% of infertile couples, somewhat lower than the brand\'s figure.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'The male-fertility component of this kit uses the YO Home Sperm Test, an FDA-cleared at-home device that reads a semen sample through a phone-connected microscope to measure motile sperm concentration — the brand states 97% accuracy for the device, a manufacturer claim not independently verified here. The female-fertility component reuses Proov\'s FDA-cleared PdG ovulation-confirmation technology (see Proov Complete\'s entry for that validation).\n\nMale-factor issues are a real, commonly under-tested part of fertility: ASRM and WHO data put male factor as the sole or contributing cause in roughly 40–50% of infertile couples — somewhat lower than the brand\'s "up to 60%" figure, but still a substantial share. Testing both partners together, as this kit does, reflects real clinical guidance to evaluate male factor alongside female factor rather than only after female testing is exhausted.\n\nNo independent study of this specific combined kit was found.',
        doctorOpinionShort: 'Combines Proov\'s FDA-cleared PdG ovulation test with the FDA-cleared YO home sperm test. Real ASRM/WHO data support testing male factor early — it\'s the sole or contributing cause in roughly 40–50% of infertile couples — though the brand\'s "up to 60%" figure runs a bit higher than that commonly cited range. No independent study of the combined kit itself was found.',
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
            'At-home semen analysis has real limitations (sample collection technique, transport time to the reader) versus a lab-based semen analysis — consult a doctor for a full clinical work-up if results are abnormal or concerning.',
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
                summary: 'Real-world data on how common male-factor infertility is — general clinical context, not product-specific validation.',
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
                        summary: 'Independent, third-party review platform — 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this kit specifically).',
                    },
                    {
                        platform: 'amazon',
                        url: 'https://www.amazon.com/YO-Analysis-Concentration-Motility-Progressive/dp/B0DWXGG9M8',
                        text: 'Amazon: YO Home Sperm Test',
                        summary: 'Real, current Amazon listing for the sperm-test device used in this kit\'s male-fertility component. Amazon blocks automated access, so review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
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
            opinionAlerts: 'Brand states "85% of women have hormone imbalances that cause symptoms like anxiety, weight gain, brain fog" — this specific figure wasn\'t independently traceable to a clinical source and should be read as marketing language, not a verified statistic.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Empower repositions Proov\'s core hormone-strip technology (the same FSH, LH, E1G, and PdG tests used in Complete — see that entry for validation) for women 35+ navigating perimenopause, testing at four points across the cycle rather than a single day. Perimenopause hormone fluctuation is real and well documented in clinical literature — FSH and LH generally rise while estrogen and progesterone become more erratic in the years before menopause — but the brand\'s specific "85% of women have hormone imbalances" figure wasn\'t traceable to an independent source and should be read as marketing language rather than a clinical statistic.\n\nNo independent study of the Empower kit or protocol specifically was found.',
        doctorOpinionShort: 'Reuses the same FDA-cleared hormone-strip technology validated for Proov Complete, repositioned for perimenopause. The brand\'s "85% of women have hormone imbalances" statistic wasn\'t independently traceable — treat it as marketing language, not a clinical figure. No independent study of the Empower kit itself was found.',
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
            'A home hormone-strip test doesn\'t replace a clinical perimenopause or menopause work-up — bring results to a doctor rather than self-diagnosing or self-treating.',
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
                summary: 'ACOG on perimenopause hormone changes and symptoms — general clinical guidance, not product-specific validation.',
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
                        summary: 'Independent, third-party review platform — 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this kit specifically).',
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
            sideEffects: 'Consult a clinician before use if pregnant, nursing, or taking medications, especially given the bioidentical progesterone and chasteberry content — chasteberry can interact with hormonal medications, including hormonal birth control.',
            opinionAlerts: 'No independent clinical-study claims found for this specific bundle; independent literature on transdermal progesterone specifically (see Clinician opinion) is more skeptical than the brand\'s absorption claim implies.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Proov\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Proov markets the Balancing Oil\'s bioidentical progesterone as absorbed via nanoemulsion technology for topical delivery, paired with chasteberry (vitex), ashwagandha, and maca in the Pro capsules for broader hormonal and luteal-phase support.\n\nTransdermal progesterone specifically has real, documented skepticism in reproductive medicine: a review in Maturitas found insufficient evidence that topical progesterone reaches meaningful systemic levels, and identified vaginal or oral micronized progesterone — not transdermal — as the routes with proven efficacy for luteal-phase support in fertility care. That\'s a real gap between the brand\'s absorption claim and the independent literature.\n\nThe capsule ingredients have more independent support. A randomized, placebo-controlled study found chasteberry normalized luteal-phase length and progesterone synthesis in women with luteal phase defects, and a systematic review of clinical trials found supporting evidence for chasteberry across several reproductive conditions. Ashwagandha has a randomized, placebo-controlled trial showing improved estradiol/progesterone and reduced FSH/LH and stress scores — though that trial was in menopausal women, not luteal-phase support specifically, so it\'s supportive but indirect evidence here. Maca has a small pilot RCT showing a libido benefit and animal-model evidence for hormone effects, though human fertility-specific trials are limited.\n\nNo independent clinical study of this specific bundle was found.',
        doctorOpinionShort: 'Chasteberry has real RCT and systematic-review support for luteal-phase/progesterone effects; maca and ashwagandha have some supporting evidence, mostly outside a fertility-specific context. Topical progesterone specifically has real, documented skepticism in reproductive medicine — vaginal or oral routes, not transdermal, are the ones with proven efficacy for luteal support. No independent study of this bundle was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://doi.org/10.1016/j.maturitas.2014.07.009', label: 'Maturitas: Systemic progesterone therapy — oral, vaginal, injections, and even transdermal?' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/8369008/', label: 'PubMed: Vitex agnus castus extract for luteal phase defects — a randomized, placebo-controlled study' },
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
            'Consult a clinician before use if pregnant, nursing, or taking medications — especially given the bioidentical progesterone content and chasteberry\'s hormonal effects.',
            'Don\'t rely on topical progesterone in place of clinician-prescribed vaginal or oral progesterone if you\'ve been told you need luteal-phase support — the independent evidence favors those routes, not transdermal.',
            'Chasteberry can interact with hormonal medications, including hormonal birth control — check with a doctor first.',
        ],
        communityReview: 'No independently verified rating specific to this bundle was found; see Proov\'s general reviews (181 reviews, 4.43/5 on reviews.io) for brand-level feedback.',
        effectiveness: 'Combines a topical progesterone product (evidence for transdermal absorption specifically is weak in independent literature) with an herbal supplement — chasteberry has the strongest independent evidence of the three herbs for luteal-phase/progesterone effects specifically. No independent clinical study of the bundle itself was found.',
        // Per-ingredient science claims, each paired with a credible
        // source (NIH-hosted or PubMed) where independent research
        // exists. Rendered on the Scientific literature tab.
        ingredientScience: [
            {
                name: 'Chasteberry (Vitex agnus-castus)',
                text: 'A randomized, placebo-controlled study in women with luteal phase defects found Vitex normalized luteal-phase length and eliminated deficits in luteal progesterone synthesis. A systematic review of clinical trials found supporting evidence for Vitex across several reproductive conditions.',
                citations: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/8369008/', label: 'PubMed: Vitex agnus castus extract in the treatment of luteal phase defects — a randomized, placebo-controlled, double-blind study' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/23136064/', label: 'PubMed: Vitex agnus-castus extracts for female reproductive disorders — a systematic review of clinical trials' },
                ],
            },
            {
                name: 'Ashwagandha',
                text: 'A randomized, placebo-controlled trial found ashwagandha root extract improved estradiol and progesterone levels and reduced FSH, LH, and stress scores — though that trial was in menopausal women, not specifically for luteal-phase or fertility support.',
                citations: [
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12812913/', label: 'NIH (PMC): Efficacy and safety of Ashwagandha root extract for managing menopausal symptoms — a randomized, double-blind, placebo-controlled study' },
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
                text: 'Proov states this is delivered via nanoemulsion technology for topical absorption. Independent reproductive-medicine literature is skeptical of transdermal progesterone specifically — a review found insufficient evidence that it reaches meaningful systemic levels, and identifies vaginal and oral micronized progesterone, not transdermal, as the routes with proven efficacy for luteal-phase support.',
                citations: [
                    { url: 'https://doi.org/10.1016/j.maturitas.2014.07.009', label: 'Maturitas: Systemic progesterone therapy — oral, vaginal, injections, and even transdermal?' },
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
                        summary: 'Independent, third-party review platform — 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this bundle specifically).',
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
            fdaStatus: 'Combines the FDA-cleared Proov PdG test technology (510(k) K191462) with prescription medication support issued by a licensed provider, not the kits themselves.',
            materials: '3 Proov Complete kits (hormone tests) + 3 Proov Check kits (early pregnancy tests) + clinician-reviewed protocol.',
            recalls: 'No recalls found.',
            sideEffects: 'Any medication side effects depend on what a provider prescribes (letrozole, progesterone, or metformin per the brand).',
            opinionAlerts: 'Brand states eligibility excludes anyone with a history of cancer, unexplained vaginal bleeding, liver disease, BMI over 49.9, or who is more than 10 weeks pregnant. Verify current eligibility criteria on proovtest.com.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Reviewed per the brand by Dr. Aimee Eyvazzadeh, MD, MPH — a real, practicing reproductive endocrinologist and Proov medical advisor — as part of the F.A.S.T. Method; ayna hasn\'t independently verified her direct review of individual program results.',
        doctorOpinion: 'This program is reviewed per the brand by Dr. Aimee Eyvazzadeh, MD, MPH — a real, practicing reproductive endocrinologist trained at UCLA, Harvard, and the University of Michigan, known publicly as "The Egg Whisperer," and a genuine medical advisor to Proov. That\'s a verifiable, legitimate credential, though ayna hasn\'t independently confirmed her personal, direct review of every individual program participant\'s results.\n\nThe program combines Proov\'s FDA-cleared PdG/hormone testing (see Proov Complete\'s entry for that technology\'s validation) with clinician-reviewed, capped-cost prescription support across three cycles. No independent study of program-level outcomes (pregnancy rates, time-to-conception) for this specific 3-month protocol was found.',
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
            'Not eligible if you have a history of cancer, unexplained vaginal bleeding, liver disease, a BMI over 49.9, or are more than 10 weeks pregnant, per the brand — verify current eligibility on proovtest.com.',
            'Any prescribed medication (letrozole, progesterone, or metformin) carries its own real side-effect profile — discuss with the prescribing provider.',
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
                text: 'FDA 510(k) K191462 — MFB Fertility, Inc.',
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
                        summary: 'Independent, third-party review platform — 181 reviews, 4.43/5 average at time of writing (covers Proov overall, not this program specifically).',
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
        summary: 'Elitone was created by Gloria Kolb, an MIT- and Stanford-trained engineer who co-founded Elidah, Inc. after developing stress incontinence following the birth of 13-pound twins and finding the available treatments too invasive or time-consuming. Elidah, Inc. is a Connecticut-based, woman-owned medical device company that has worked with medical professionals since 2014, partly funded by National Science Foundation grants. Elitone is an external, at-home pelvic floor stimulation device for stress and mixed urinary incontinence — a gel pad worn near the pubic bone delivers gentle electrical stimulation to contract and relax pelvic floor muscles automatically, roughly 100 contractions per 20-minute session.',
        safety: {
            fdaStatus: 'FDA 510(k)-cleared in 2019 (K183585) for over-the-counter, no-prescription-needed treatment of stress and mixed urinary incontinence.',
            materials: 'Reusable GelPads (rated for 3+ uses), controller with belt clip, charging cable.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states contraindications are available on request; consult a clinician before use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, or recent pelvic surgery.',
            opinionAlerts: 'Brand cites a 3.7% return rate for non-improvement and offers a 60-day money-back guarantee — brand claims, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Founder Gloria Kolb is a real MIT/Stanford-trained engineer and co-founder/CEO of Elidah, Inc.; the clinical studies cited below were run by the company, not a fully independent research group, and no independent clinician endorsement of this device has been verified by ayna.',
        doctorOpinion: 'Two real clinical studies back this device specifically. A published, peer-reviewed pilot study (20 women with mild/moderate stress incontinence, 20-minute daily sessions for 6 weeks, no control group) found a 75% reduction in incontinence episode frequency, an 85% reduction in pad usage, and a 67% improvement in quality-of-life scores (all statistically significant). A later randomized, sham-controlled trial (48 women, 12 weeks) found leaks reduced by 52.8% in the treatment group — notably higher than the roughly 32% improvement seen in a meta-analysis of intravaginal electrical stimulation studies, though that\'s a cross-study comparison, not a head-to-head trial.\n\nThis is more independent-style clinical evidence than most products in this catalog carry — the pilot study was peer-reviewed and published, and the larger trial was sham-controlled — though both were run by the device\'s own company rather than a fully independent research group.',
        doctorOpinionShort: 'Founded by engineer Gloria Kolb after her own postpartum incontinence. FDA-cleared (2019, 510(k) K183585) for OTC use. A published pilot study (20 women) found a 75% reduction in incontinence episodes and 85% reduction in pad use; a later sham-controlled RCT (48 women) found a 52.8% reduction in leaks — real, though company-run rather than fully independent, evidence.',
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
                'Position the reusable GelPad externally, near the pubic bone — no internal insertion.',
                'Attach the controller (clips to a belt or waistband) and start a session; the device delivers roughly 100 gentle contractions over 20 minutes.',
                'Use daily — the published pilot-study protocol was 20 minutes/day for 6 weeks to see results.',
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
        communityReview: 'The brand\'s own site and major retailers report a 4.5/5 average with thousands of reviews and under 4% returns. A small Trustpilot sample (Canada, 3 reviews) shows a lower 2.8/5 — too few reviews to be a reliable independent signal, but included here for balance rather than only citing the brand\'s more favorable numbers.',
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
                        summary: 'Real, current Trustpilot listing. Small sample size at time of writing — read the reviews directly on the page.',
                    },
                    {
                        platform: 'reddit',
                        url: 'https://www.reddit.com/r/Incontinence/comments/1c6peo9/has_anyone_tried_a_elitone_external_pelvic_floor/',
                        text: 'Reddit r/Incontinence: "Has anyone tried a Elitone external pelvic floor..."',
                        summary: 'Real, current Reddit thread asking about experiences with Elitone. Reddit couldn\'t be fetched directly, so individual comment content wasn\'t independently verified here — read them on the page.',
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
        tags: ['bladder-leaks', 'incontinence', 'urinary', 'menopause', 'postpartum'],
        price: 'From $359',
        whereToBuy: [],
        url: 'https://elitone.com/product/elitone-urge/',
        affiliateUrl: 'https://elitone.com/?af=aynahealth',
        image: 'https://elitone.com/wp-content/uploads/2023/02/UUI-Hero-071426.avif',
        summary: 'Elitone URGE uses the same hardware as the original Elitone, from the same company (Elidah, Inc., founded by engineer Gloria Kolb — see the original Elitone entry for her story and the company\'s history), but with a different waveform aimed at calming overactive bladder-muscle signals rather than strengthening pelvic floor muscles directly. It\'s an external, at-home device for overactive bladder (OAB) and urge incontinence, tuned to send calming signals that aim to reduce sudden urges, frequent bathroom trips, and urge-related leaks, without medication or a procedure.',
        safety: {
            fdaStatus: 'FDA-cleared (over-the-counter) medical device for overactive bladder / urge incontinence, per the brand; unlike the original Elitone\'s 510(k) K183585, ayna could not independently confirm this device\'s specific FDA clearance number — verify current status on elitone.com.',
            materials: 'Reusable GelPads (rated for 3+ uses), controller with belt clip, charging cable, storage case.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states do not use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, recent pelvic surgery, or urinary retention issues. In the referenced clinical trial, mild urinary tract infection was the most commonly reported issue.',
            opinionAlerts: 'Brand cites "95% of users reported reduced leaks," a 70% average leak reduction, and 85% reduction in pad use — brand-reported figures. A company-run randomized trial independently found a real, if smaller, effect: roughly a 70% reduction in leaks and improvement on all 22 points of a standard quality-of-life questionnaire (see Clinician opinion).',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Same company (Elidah, Inc.) and founder (Gloria Kolb) as the original Elitone; the clinical trial cited below was run by the company, not a fully independent research group, and no independent clinician endorsement of this device has been verified by ayna.',
        doctorOpinion: 'A randomized trial (NCT04752709) evaluating this surface-stimulation approach for urge incontinence found real results: roughly a 70% reduction in leaks, improvement across all 22 points of the standard Incontinence Quality-of-Life questionnaire, and improved bladder-voiding measures (maximum urinary flow rate and voiding efficiency). The brand separately states 76% of study participants reached a clinically significant leak reduction within 6 weeks. Safety findings were reassuring, with mild urinary tract infection as the main reported issue.\n\nAs with the original Elitone, this research was run by the device\'s own company rather than a fully independent group, and ayna could not confirm the specific FDA clearance number for the URGE device — verify current clearance status on elitone.com.',
        doctorOpinionShort: 'Same hardware and company as the original Elitone, tuned for overactive bladder. A company-run randomized trial found roughly a 70% reduction in leaks and improvement on all 22 points of a standard quality-of-life questionnaire — real, if not independently replicated, evidence. FDA-cleared per the brand; ayna could not confirm the specific clearance number for this device.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://clinicaltrials.gov/study/NCT04752709', label: 'ClinicalTrials.gov: Efficacy of Surface Electrical Stimulation for Urge Urinary Incontinence in Women (NCT04752709)' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with overactive bladder (OAB) or urge incontinence — sudden urges, frequent bathroom trips, or urge-related leaks',
            'Anyone wanting a no-prescription, at-home option to try before medication',
            'Not for anyone pregnant, with electronic implants, epilepsy, cancer, recent pelvic surgery, or urinary retention issues without a doctor\'s clearance first',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // elitone.com/product/elitone-urge/.
        howToUse: {
            intro: 'Per Elitone\'s own site: wear the GelPad daily for 20-minute sessions — same hardware as the original Elitone, tuned for urge/OAB signals.',
            steps: [
                'Position the reusable GelPad externally, near the pubic bone — no internal insertion.',
                'Attach the controller and start a session.',
                'Use daily — the referenced trial ran 6 weeks to see clinically significant results.',
            ],
            sourceUrl: 'https://elitone.com/product/elitone-urge/',
            sourceLabel: 'elitone.com: Elitone URGE',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Do not use if pregnant, or if you have electronic implants (e.g. a pacemaker), epilepsy, cancer, recent pelvic surgery, or urinary retention issues, per the brand.',
            'Mild urinary tract infection was the most commonly reported issue in the referenced trial — see a doctor if you develop UTI symptoms.',
            'Not a substitute for a clinical work-up if urgency is sudden-onset or accompanied by pain, blood, or fever.',
        ],
        communityReview: 'The brand\'s own site and major retailers report a 4.5/5 average across both Elitone devices with thousands of reviews. See the original Elitone entry for the independent Trustpilot comparison (2.8/5, small sample) — no URGE-specific independent rating was found separately.',
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
        summary: 'My Pelvic Bra was created by Jeanice Mitchell, PT, MPT, WCS, BCB-PMD — a pelvic floor physical therapist who developed pelvic organ prolapse after the birth of her first child and spent nearly 25 years looking for a discreet, supportive external option before designing her own, launching in May 2024. The Classic Pelvic Bra is a 4-way adjustable, everyday pelvic support garment with a compressive bikini-style fit, designed to ease sensations of heaviness, pressure, and bulging by giving gentle compressive lift to the pelvic floor and perineal tissue.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device. Brand states it is not designed to correct prolapse.',
            materials: 'Breathable, skin-friendly, high-stretch compression fabric with a creaseless gusset and sweat-wicking liner, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand recommends removing before sleep and using the minimum compression needed for symptom relief; suggests working with a pelvic floor physical therapist for personalized guidance.',
            opinionAlerts: 'Store pricing defaults to EUR; a US/USD option is available via the site\'s own country selector. Verify current pricing directly at mypelvicbra.shop.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Founder Jeanice Mitchell is a real, credentialed pelvic floor physical therapist (PT, MPT, WCS, BCB-PMD) who also founded Integrity Rehab (2001) and the myPFM nonprofit pelvic-health campaign (2018); no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'Independent research on external pelvic compression garments as a category is real but mixed. A 2026 exploratory, randomized crossover study in 13 postpartum runners with pelvic floor dysfunction found that wearing a compression garment measurably smoothed running gait, reduced pelvic shock/jerk forces, and increased perceived pelvic floor and core support while reducing fear of symptoms — real, positive, if preliminary, findings. An earlier pilot study (13 women with prolapse) found no significant improvement on validated quality-of-life questionnaires from a similar supportive underwear product, though several participants subjectively felt some relief.\n\nThese studies are about the general category of external compression garments, not this specific product — no independent clinical study of the Classic Pelvic Bra itself was found. The brand\'s own honest positioning, that it\'s not designed to correct prolapse, lines up with what this research supports: possible symptom-management, biomechanical, and confidence benefits, not a structural fix.',
        doctorOpinionShort: 'Research on external pelvic compression garments as a category is mixed: a 2026 study found real biomechanical and perceived-support benefits while running; an earlier pilot study found no significant quality-of-life improvement from a similar product. No independent study of this specific garment was found — consistent with the brand\'s own "not a prolapse treatment" framing.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41586016/', label: 'PubMed: Pelvic compression garments alter running biomechanics, perceived support, and fear of symptoms in postpartum women with pelvic floor dysfunction' },
            { url: 'https://doi.org/10.1007/s00192-008-0676-x', label: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse — a pilot study' },
        ],
        // Rendered as a bulleted list on the Evidence view, under "Best for".
        whoItsFor: [
            'Women with pelvic heaviness, pressure, bulging, or leakage symptoms wanting discreet external support during activity',
            'Runners or anyone doing weight-bearing activity (walking, lifting) who wants added pelvic support and confidence',
            'Not a substitute for pelvic floor physical therapy or a prolapse diagnosis/treatment plan — the brand recommends working with a pelvic floor PT alongside it',
        ],
        // Rendered as a bulleted list on the Evidence view. Matches
        // mypelvicbra.shop/products/classic-pelvic-bra.
        howToUse: {
            intro: 'Per My Pelvic Bra\'s own site: wear during activities that stress the pelvic floor, using the 4-way adjustment to find the minimum compression needed.',
            steps: [
                'Adjust the waistband and leg straps (4-way adjustable) for a comfortable, supportive fit.',
                'Wear during walking, lifting, running, or other activities that trigger heaviness or pressure symptoms.',
                'Use the minimum compression needed for symptom relief — more isn\'t necessarily better.',
                'Remove before sleep, per the brand.',
            ],
            sourceUrl: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE',
            sourceLabel: 'mypelvicbra.shop: Classic Pelvic Bra',
        },
        // Rendered as a red warning box on the Evidence view.
        warnings: [
            'Not designed to correct prolapse — this is symptom-management support wear, not a structural treatment, per the brand.',
            'Remove for sleep, and use the minimum compression needed for symptom relief.',
            'Stop use and see a doctor or pelvic floor PT if the garment causes pain, numbness, or worsening symptoms.',
        ],
        communityReview: 'No independently verified customer review data was found for this product at time of writing.',
        effectiveness: 'Positioned as symptom-management support wear, not a corrective device. Research on external compression garments as a category is real but mixed — some evidence for biomechanical and perceived-support benefits, some finding no significant quality-of-life change — and no independent clinical study of this specific product was found.',
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
                text: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse — a pilot study',
                summary: '13 women with prolapse. Found no significant quality-of-life improvement on validated questionnaires, though some participants subjectively felt relief. Included for balance — a real negative finding for a similar (not identical) product.',
            },
            {
                url: 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2019/11/pelvic-organ-prolapse',
                text: 'ACOG Practice Bulletin 214: Pelvic Organ Prolapse',
                summary: 'Women in the US have a 13% lifetime risk of surgery for pelvic organ prolapse — general clinical context, not product-specific validation.',
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
                        text: 'mypelvicbra.shop: Classic Pelvic Bra — customer reviews',
                        summary: 'The Classic Pelvic Bra\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                ],
            },
        },
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
        tags: ['discomfort', 'menopause', 'postpartum', 'hormone-free', 'organic', 'cruelty-free', 'vegan', 'ph-neutral'],
        price: '$42',
        whereToBuy: ['Amazon', 'BUNI Body'],
        url: 'https://www.bunibody.com/products/buni-vulva-balm',
        affiliateUrl: 'https://amzn.to/4yE7pZH',
        whereToBuyLinks: {
            Amazon: 'https://amzn.to/4yE7pZH',
            'BUNI Body': 'https://www.bunibody.com/products/buni-vulva-balm',
        },
        image: 'https://cdn.shopify.com/s/files/1/0661/0432/8271/files/buni-vulva-balm-product-page-main.webp?v=1776773714',
        summary: 'A hormone-free, pH-balanced external vulva moisturizer in an airless pump, formulated to relieve dryness, reduce friction and chafing, soothe itching and irritation, and help prevent ingrown hairs. BUNI positions it for menopause and perimenopause, pregnancy and postpartum, grooming, exercise, and comfort during intimacy.',
        ingredients: 'Per BUNI\'s own "What\'s Inside" list: organic avocado oil (deep moisture + elasticity), honey & propolis (prebiotic + antioxidant, natural healing for stressed skin), chamomile & lavender (calming + soothing, reduces irritation and redness), shea & cacao (deep conditioning + antioxidant protection, locks in moisture), hyaluronic acid (intense hydration, holds up to 1,000x its weight in water), and sea buckthorn oil (rich in linoleic acid, supports elasticity and hydration).',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the balm itself is a cosmetic / external personal-care product, not an FDA-cleared drug or medical device.',
            // Full packaging/formula description — shown in full under
            // "Materials" on the Evidence view (see buildFactRows in
            // ProductModal.jsx, which doesn't truncate this field).
            materials: 'Dispensed through an airless pump — BUNI positions this against an open-jar format, saying it protects the formula from air and repeated contact, gives clean touch-free application, and keeps dosing more consistent; the packaging is also recyclable, per BUNI. Formula is hormone-free, paraben-free, phthalate-free, dye-free, pH-balanced, and made with 99.5–100% natural ingredients, per BUNI. Per BUNI\'s own "What\'s Inside" list: organic avocado oil (deep moisture + elasticity), honey & propolis (prebiotic + antioxidant), chamomile & lavender (calming + soothing), shea & cacao (deep conditioning + antioxidant protection), hyaluronic acid (intense hydration), and sea buckthorn oil (elasticity + hydration).',
            recalls: 'No recalls found.',
            sideEffects: 'For external vulvar use only — not intended for internal vaginal use, per the brand. Discontinue and see a doctor if you notice irritation or an allergic reaction. Full warnings are listed below.',
            opinionAlerts: 'Benefit and ingredient claims are from BUNI; no independent clinical trial of the finished product was identified.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'BUNI states the product was developed by board-certified OB/GYNs and dermatologists; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions REJUVENATE as a gynecologist- and dermatologist-developed, hormone-free, pH-balanced external moisturizer for vulvar dryness, friction, chafing, itching, and ingrown hairs, and for comfort during intimacy — pure, simple, and effective, per the brand\'s own site. It\'s dispensed through an airless pump, which BUNI says protects the formula from air and repeated contact and gives more consistent, touch-free dosing than an open-jar format.\n\nSeveral of its named ingredients have real supporting research, though none of it tested this finished product. Honey and propolis have documented antibacterial, antifungal, and wound-healing properties in general skin studies, and propolis specifically has shown antifungal activity against vaginal Candida albicans in lab research. Hyaluronic acid is a well-studied humectant that draws and holds moisture in tissue. Avocado oil has shown skin-barrier-repair and wound-healing effects in review literature covering several plant oils.\n\nChamomile and lavender both have supporting evidence for BUNI\'s calming and soothing claim: a controlled study found topical chamomile extract reduced inflammation, and a rat study found lavender oil accelerated wound healing and increased collagen via TGF-β signaling. Shea and cacao butter both have supporting evidence for BUNI\'s deep-conditioning and antioxidant claim: a clinical trial found a shea-butter-based cream performed comparably to a ceramide-based product for skin barrier repair, and cocoa (cacao) polyphenols have documented, measurable antioxidant activity after topical application.\n\nSea buckthorn oil has real clinical evidence for vaginal dryness specifically — a randomized, placebo-controlled trial found daily oral sea buckthorn oil improved vaginal epithelium integrity in postmenopausal women over 3 months. That trial tested oral intake, though, not a topical balm like this one, so it doesn\'t directly validate this product\'s use.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'BUNI positions this hormone-free, pH-balanced balm for vulvar dryness, friction, itching, ingrown hairs, and comfort during intimacy. Several named ingredients (honey, propolis, hyaluronic acid, avocado oil, chamomile, lavender, shea, cacao, sea buckthorn oil) have real supporting research individually, including one placebo-controlled trial on oral sea buckthorn oil for vaginal dryness — though that tested oral intake, not a topical balm. No independent clinical study of this specific product was found.',
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
        effectiveness: 'Formulated by board-certified OB/GYNs and dermatologists to moisturize vulvar skin and reduce friction, chafing, and irritation; each named ingredient has real independent research behind the specific mechanism BUNI claims for it. No independent clinical study of the finished product was found.',
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
        ingredients: 'Per BUNI\'s own "What\'s Inside" list: organic olive oil (deep nourishment + protection, rich in antioxidants for barrier repair), organic kokum butter (non-greasy moisture, a protective layer without clogging pores), organic beeswax (a natural sealant that locks in moisture and shields against friction), organic shea butter (intensive healing for cracked and damaged skin), organic cacao seed butter (a rich emollient that softens and conditions rough, dry patches), and organic calendula (gentle, traditional healing for delicate skin). Also contains organic avocado oil and organic tocopherol (vitamin E), per BUNI.',
        safety: {
            fdaStatus: 'Made in an FDA-registered, GMP facility in the USA and third-party lab tested, per BUNI\'s site; the balm itself is a cosmetic / personal-care product, not an FDA-cleared drug or medical device.',
            materials: 'Lanolin-free balm, made with no animal-derived ingredients (safe for wool/lanolin sensitivities) — BUNI positions this against lanolin creams, describing a smooth, buttery, hypoallergenic formula that absorbs cleanly with no residue, versus a thick, sticky wax that can stain clothing and nursing pads. Per BUNI\'s own "What\'s Inside" list: organic olive oil (deep nourishment + protection), organic kokum butter (non-greasy moisture), organic beeswax (locks in moisture, shields against friction), organic shea butter (intensive healing), organic cacao seed butter (rich emollient), and organic calendula (gentle healing). Also contains organic avocado oil and organic tocopherol (vitamin E), per BUNI.',
            recalls: 'No recalls found.',
            sideEffects: 'People with sensitivities or allergies to botanical ingredients or beeswax should review the ingredient list before use and stop if irritation develops. Full warnings are listed below.',
            opinionAlerts: 'BUNI markets the balm as suitable around nursing and states no wipe-off is needed; users should follow current label directions and their clinician or lactation professional’s guidance.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'BUNI states the balm was crafted by herbalists with organic ingredients, per the brand\'s own site; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions SOOTHE as a lanolin-free, herbalist-formulated balm for healing cracked and sore nipples, protecting against friction, and supporting deep hydration and softening — safe for baby with no wipe-off needed, and multi-use for lips, cuticles, and other dry skin, per the brand\'s own site.\n\nSeveral of its named ingredients have real supporting research. Calendula has a systematic review of animal and clinical studies behind BUNI\'s "gentle healing" claim, showing evidence for calendula extract speeding acute wound healing and reducing venous ulcer size, though the review also called for larger, better-designed trials. Beeswax has real evidence for BUNI\'s "locks in moisture" claim: a 2023 review of clinical and lab studies found it functions as an effective occlusive that reduces water loss through skin. Shea butter has real evidence for BUNI\'s "intensive healing" claim, in a clinical trial where a shea-butter-based cream performed comparably to a ceramide-based product for skin barrier repair. Olive oil and cacao seed butter both have supporting antioxidant and barrier-repair evidence in plant-oil and cocoa-polyphenol review literature. Kokum butter has documented antioxidant, anti-inflammatory, and wound-healing pharmacological activity in an independent review, though the specific moisturizing and elasticity testing available for it comes from the ingredient supplier\'s own testing rather than independent peer-reviewed research.\n\nNo independent clinical study of this specific product was found.',
        doctorOpinionShort: 'BUNI positions this herbalist-formulated, lanolin-free balm for healing cracked nipples, protecting against friction, and deep hydration. Calendula, beeswax, shea butter, olive oil, and cacao seed butter each have real supporting research for the specific claim BUNI makes; kokum butter\'s clinical testing comes mainly from its ingredient supplier rather than independent literature. No independent clinical study of this specific product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://www.bunibody.com/products/buni-nipple-balm', label: 'bunibody.com: SOOTHE Nipple and Lip Balm — ingredient list and claims' },
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
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8708457/', label: 'NIH (PMC): Pharmacological Activity of Garcinia indica (Kokum) — an updated review' },
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
        doctorOpinion: 'Several of BUNI\'s named ingredients for this oil have real, independent research behind the specific mechanism the brand claims for them (see BUNI\'s own ingredient list under "Materials" below). A controlled mouse study found snail secretion filtrate significantly improved wound-area closure speed and collagen deposition compared to untreated wounds — a real effect, though in an animal model rather than a human scar trial. Chamomile and lavender both have supporting evidence: a controlled study found topical chamomile extract reduced inflammation, and a rat study found lavender oil accelerated wound healing and increased collagen via TGF-β signaling.\n\nRetinyl palmitate converts to retinoic acid in skin, which is well documented to speed epidermal cell turnover — the mechanism behind BUNI\'s cell-turnover and renewal claim, though as a milder retinoid ester it acts more slowly than prescription-strength forms. Vitamin E is one of skin\'s primary lipid-soluble antioxidants, well documented to help protect skin from oxidative and environmental stress — the basis for BUNI\'s antioxidant-protection claim here. Topical vitamin E can still cause contact dermatitis in some people, so it\'s worth patch-testing first.\n\nGua sha massage itself has real supporting research: a pilot study found it measurably increased microcirculation (blood flow) at the treated area for at least 25 minutes, one proposed mechanism behind how massage may help soften scar tissue and improve skin appearance over time — though that study measured circulation in healthy skin, not scar-specific outcomes.\n\nBUNI advises medical approval before using the oil on a new or C-section scar. No independent clinical study of this specific product was found.',
        doctorOpinionShort: 'BUNI\'s ingredient claims for this oil — scar healing/regeneration (snail secretion filtrate), cell turnover (retinyl palmitate), moisture (avocado + apricot oil), calming (chamomile + lavender), and antioxidant protection (vitamin E) — are each backed by real independent research on the underlying mechanism. Gua sha massage also has real evidence for boosting local circulation. No independent clinical study of this specific finished product was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://www.bunibody.com/products/buni-natural-scar-body-treatment-oil', label: 'bunibody.com: TRANSFORM Scar+Body Treatment Oil — ingredient list and claims' },
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
        summary: 'A soft, squeezable pelvic-health demonstration tool from My Pelvic Bra — founded by pelvic floor physical therapist Jeanice Mitchell, PT — designed to make pelvic organ prolapse education easier to visualize, including how external perineal compression can provide support from below.',
        safety: {
            fdaStatus: 'Educational demonstration item; not an FDA-cleared medical device or treatment.',
            materials: 'Soft squeezable demonstration tool; exact material composition was not listed on the product page.',
            recalls: 'No recalls found.',
            sideEffects: 'For education and demonstration only. It does not diagnose, treat, or correct pelvic organ prolapse.',
            opinionAlerts: 'The educational explanation is sourced from My Pelvic Bra’s product page.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Educational positioning is sourced from My Pelvic Bra, founded by pelvic floor physical therapist Jeanice Mitchell, PT, MPT, WCS, BCB-PMD; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'The product is intended as a hands-on teaching aid for explaining prolapse and external support concepts, not as a therapeutic device. Pelvic organ prolapse is genuinely common — ACOG estimates women in the US have a 13% lifetime risk of undergoing surgery for it — so a visual, tactile teaching tool like this has real educational value for explaining a condition many people have never had described to them clearly.',
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
                summary: 'Women in the US have a 13% lifetime risk of surgery for pelvic organ prolapse — real epidemiological context for why prolapse education matters.',
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
        price: '€7.95',
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
        price: '€77.95',
        whereToBuy: [],
        url: 'https://www.mypelvicbra.shop/products/classic-pelvic-bra%C2%AE-classic-plus',
        affiliateUrl: 'https://pelvic-bra.myshopify.com/products/classic-pelvic-bra%C2%AE-classic-plus?bg_ref=bZYYwMBpTa',
        image: 'https://cdn.shopify.com/s/files/1/0640/1513/8877/files/6.png?v=1788247226',
        summary: 'The fuller-coverage Pelvic Bra® style from My Pelvic Bra — founded by pelvic floor physical therapist Jeanice Mitchell, PT (see the Classic Pelvic Bra entry for her story) — with a wider adjustable waistband and reinforced supportive hammock for people wanting more substantial external pelvic-floor and perineal support during daily activity.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device and not a corrective treatment for prolapse.',
            materials: 'Breathable, skin-friendly stretch fabric with reinforced hammock, creaseless gusset, sweat-wicking liner, and wider adjustable hook-and-eye waistband, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Use the minimum compression needed for comfort and support. Remove for sleep and reduce or stop use if the garment causes pain, numbness, skin irritation, or worsening symptoms.',
            opinionAlerts: 'Support and symptom-relief descriptions are sourced from My Pelvic Bra; product-specific clinical outcomes have not been independently established.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Same founder (Jeanice Mitchell, PT, MPT, WCS, BCB-PMD) and brand as the Classic Pelvic Bra; no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'My Pelvic Bra positions Classic Plus as its maximum-support, fuller-coverage adjustable option for external pelvic-floor and perineal support during standing, walking, lifting, exercise, pregnancy, and postpartum activity — the same fabric and design approach as the Classic Pelvic Bra, just wider coverage and a reinforced hammock for more substantial support.\n\nSee the Classic Pelvic Bra entry for the independent research on external pelvic compression garments as a category (a 2026 study found real biomechanical/perceived-support benefits; an earlier pilot study found no significant quality-of-life change from a similar product) — that research applies to the garment category generally, not this specific style, and no independent clinical study of Classic Plus itself was found.',
        doctorOpinionShort: 'Same brand, founder, and fabric approach as the Classic Pelvic Bra, with wider coverage and a reinforced hammock for more support. See the Classic Pelvic Bra entry for the mixed independent research on external compression garments as a category. No independent study of this specific style was found.',
        // Kept out of verificationLinks so it doesn't pool with the
        // Scientific literature tab's citation list.
        doctorOpinionCitations: [
            { url: 'https://pubmed.ncbi.nlm.nih.gov/41586016/', label: 'PubMed: Pelvic compression garments alter running biomechanics, perceived support, and fear of symptoms in postpartum women with pelvic floor dysfunction' },
            { url: 'https://doi.org/10.1007/s00192-008-0676-x', label: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse — a pilot study' },
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
            'Not designed to correct prolapse — this is symptom-management support wear, not a structural treatment, per the brand.',
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
                text: 'Lammers et al., Int Urogynecol J 2008: The effectiveness of supportive underwear in women with pelvic organ prolapse — a pilot study',
                summary: '13 women with prolapse. Found no significant quality-of-life improvement on validated questionnaires, though some participants subjectively felt relief. Included for balance — a real negative finding for a similar (not identical) product.',
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
                        text: 'mypelvicbra.shop: Classic Plus Pelvic Bra — customer reviews',
                        summary: 'The Classic Plus Pelvic Bra\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
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
        image: '',
        summary: 'From My Pelvic Bra — founded by pelvic floor physical therapist Jeanice Mitchell, PT (see the Classic Pelvic Bra entry for her story). The Sports Pelvic Bra is a lightweight, fully adjustable style with a snug bikini-style fit for activities where an extra pelvic-floor lift is wanted, per the brand\'s own site.',
        safety: {
            fdaStatus: 'Compression support garment; not an FDA-cleared medical device and not a corrective treatment for prolapse.',
            materials: 'Premium, breathable, skin-friendly stretch fabric with a slim, seamless construction, creaseless gusset, reinforced hammock, sweat-wicking liner, and a fully adjustable, bra-like tightening system with a flexible contoured waistband that raises or lowers for the amount of support needed, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Use the minimum compression needed for comfort and support. Remove for sleep and reduce or stop use if the garment causes pain, numbness, skin irritation, or worsening symptoms.',
            opinionAlerts: 'Fit and support descriptions are sourced from My Pelvic Bra\'s product page; product-specific clinical outcomes have not been independently established.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Same founder (Jeanice Mitchell, PT, MPT, WCS, BCB-PMD) and brand as the Classic Pelvic Bra; no independent clinician endorsement of this specific product has been verified by ayna.',
        doctorOpinion: 'My Pelvic Bra positions the Sports style as its lightest-weight, most activity-focused option — a fully adjustable, seamless design meant to disappear under workout clothing while giving a custom, secure fit for sports and other movement.\n\nSee the Classic Pelvic Bra entry for the independent research on external pelvic compression garments as a category (a 2026 study found real biomechanical and perceived-support benefits specifically in postpartum runners; an earlier pilot study found no significant quality-of-life change from a similar product) — that research applies to the garment category generally, not this specific style, and no independent clinical study of the Sports Pelvic Bra itself was found.',
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
            'Not designed to correct prolapse — this is symptom-management support wear, not a structural treatment, per the brand.',
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
                        text: 'mypelvicbra.shop: Sports Pelvic Bra — customer reviews',
                        summary: 'The Sports Pelvic Bra\'s own product page, which displays customer reviews directly on the listing. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
                    },
                ],
            },
        },
        integrations: [],
        badges: [],
        isEmergingBrand: true,
    },
    // Liv Labs (Pippa Resistance Spring) — catalog entry only, NOT yet an
    // ayna brand partner (as of 2026-09-23). isEmergingBrand still shows the
    // "Brand" tag on Discovery, but it's deliberately left out of
    // src/utils/partnerBrands.js's PARTNER_BRAND_PATTERNS allowlist and off
    // the Brand Partnerships page until a partnership is confirmed. Distinct
    // from LiM Method (limmethod.com) elsewhere in this catalog — similarly
    // named but a different company: Liv Labs (livlabsfitness.com) makes the
    // internally-worn Pippa resistance spring, invented by Carly Price.
    // Product facts checked via web search (direct fetch of
    // livlabsfitness.com is blocked in this environment).
    {
        id: 'p-livlabs-pippa-starter-kit',
        name: 'Pippa Resistance Spring Starter Kit',
        brand: 'Liv Labs',
        category: 'pelvic-floor',
        type: 'physical',
        internal: false,
        healthFunctions: ['pelvic-floor'],
        tags: ['incontinence', 'fitness', 'comfort', 'safety-concern'],
        price: '$99.00',
        whereToBuy: ['livlabsfitness.com'],
        url: 'https://livlabsfitness.com/products/pippa-resistance-spring-starter-kit',
        image: '/products/livlabs/pippa-starter-kit.webp',
        summary: 'A soft, conforming silicone resistance spring worn internally (like a tampon) that gently activates the pelvic floor with everyday movement — no batteries, screens, or scheduled exercises required. Invented by Carly Price, previously known for reimagining the pillow at Casper and holding 41 patents, in consultation with Bay Area pelvic health specialists; she co-founded Liv Labs with longtime collaborator Melody Roberts to bring it to market. Backed by Y Combinator and recognized in Fast Company\'s 2025 Innovation by Design Awards.',
        safety: {
            fdaStatus: 'Marketed as a general wellness/fitness product, not an FDA-cleared medical device. The brand states the springs are made from high-purity biomedical silicone (the type used in implants) and have been tested to medical device standards — including biocompatibility, microbiological, chemical, and cleaning-validation testing — by an ISO 13485:2016-certified manufacturer, though ayna could not independently confirm a specific FDA clearance or registration.',
            materials: 'High-purity biomedical-grade silicone spring; reusable plastic applicator, similar in concept to a tampon applicator.',
            recalls: 'No recalls found.',
            sideEffects: 'Worn internally, like a tampon or menstrual cup, so the same general hygiene and infection-risk considerations apply: wash hands before handling, clean the spring after every use as directed, and don\'t share it. Unlike a tampon, it isn\'t absorbent, so it doesn\'t carry the same toxic shock syndrome risk profile tied to absorbency — but any object worn internally for extended periods still carries some infection risk if hygiene guidance isn\'t followed.',
            opinionAlerts: 'The brand states Pippa can be worn during pregnancy and menses and that wear duration is "a matter of individual preference," with some users reportedly wearing it all day. Ayna was not able to independently verify a brand-recommended maximum daily wear time or independent clinical guidance specific to extended internal wear of this device; check current guidance directly with Liv Labs and, if pregnant or postpartum, with a clinician first.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Pippa\'s underlying idea — an internally worn object that gives the pelvic floor something to respond to during normal movement — sits in the same conceptual family as weighted vaginal cones, a pelvic-floor training method with real clinical backing. A Cochrane review found weighted vaginal cones are more effective than no treatment for stress urinary incontinence, and may work about as well as standard pelvic floor muscle training (Kegels), though the evidence that cones outperform standard PFMT specifically is inconclusive. Cones and Pippa aren\'t identical — cones rely on gravity and the sensation of "losing" a weight, while Pippa\'s spring relies on gentle conforming resistance — but the shared mechanism, internal proprioceptive/resistance feedback prompting a pelvic floor contraction, is a real, studied approach, not a novel unproven idea.',
        doctorOpinionShort: 'Conceptually similar to weighted vaginal cones, a pelvic-floor training method with real Cochrane-level evidence (better than no treatment, roughly comparable to standard Kegels) — but Pippa\'s specific spring design hasn\'t itself been independently clinically trialed, even though its materials and manufacturing claims are reassuring on safety.',
        doctorOpinionCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD002114.pub2/full', label: 'Cochrane: Weighted vaginal cones for urinary incontinence' },
        ],
        whoItsFor: [
            'People wanting a passive, no-routine-required way to engage the pelvic floor during everyday movement or exercise',
            'Those who\'ve tried standard Kegels/PFMT and want to try a device-assisted alternative in the same general category as vaginal cones',
            'Not a substitute for an individualized pelvic floor PT evaluation for significant or persistent incontinence or prolapse symptoms',
        ],
        howToUse: {
            intro: 'Per Liv Labs\' own instructions:',
            steps: [
                'Wash hands and the spring before first use and before/after each use going forward.',
                'Insert using the included reusable applicator, similar to inserting a tampon.',
                'Wear during daily movement, exercise, or as preferred — the brand describes wear duration as a matter of individual preference.',
                'Remove, clean, and store as directed; keep away from children and pets.',
            ],
            sourceUrl: 'https://livlabsfitness.com/products/pippa-resistance-spring-starter-kit',
            sourceLabel: 'livlabsfitness.com: Pippa Starter Kit',
        },
        warnings: [
            'This is worn internally — follow the brand\'s hygiene instructions closely (wash hands and the device before and after each use) to reduce infection risk.',
            'If pregnant, postpartum, or managing a diagnosed pelvic floor condition (prolapse, significant incontinence), check with a clinician or pelvic floor PT before use.',
            'Stop use and seek care for pain, unusual discharge, bleeding, or signs of infection.',
        ],
        communityReview: 'Pippa has real outside validation as a product — Fast Company\'s 2025 Innovation by Design Awards recognized it, and Liv Labs is Y Combinator-backed. Independent (non-brand) user review volume is still limited at time of writing outside the brand\'s own Kickstarter and site, consistent with an early-stage startup product.',
        ingredients: 'High-purity biomedical-grade silicone resistance spring (light resistance in the Starter Kit); reusable applicator.',
        effectiveness: 'Works on the same general principle as weighted vaginal cones, a related device category with real Cochrane-level evidence for pelvic floor training.',
        scientificCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD002114.pub2/full', text: 'Cochrane: Weighted vaginal cones for urinary incontinence', summary: 'Found weighted vaginal cones more effective than no active treatment for stress urinary incontinence, and possibly comparable to standard pelvic floor muscle training — the closest independently studied device category to Pippa\'s internal-resistance mechanism, though not identical to it.' },
        ],
        integrations: [],
        badges: ['Female-Founded', 'Fast Company 2025 Innovation Award'],
        verificationLinks: {
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/pelvicfloor/search/?q=pippa%20liv%20labs', text: 'Reddit r/pelvicfloor: Pippa/Liv Labs search', summary: 'User discussion of the Pippa resistance spring.' },
                { platform: 'instagram', url: 'https://www.instagram.com/livlabsfitness/', text: 'Liv Labs on Instagram', summary: 'Brand content and community posts.' },
                { platform: 'press', url: 'https://www.prweb.com/releases/pippa-by-liv-labs-recognized-in-fast-companys-2025-innovation-by-design-awards-302566602.html', text: 'PRWeb: Pippa recognized in Fast Company 2025 Innovation by Design Awards', summary: 'Independent press recognition of the product.' },
            ] },
        },
        isEmergingBrand: true,
    },
    {
        id: 'p-livlabs-pippa-fit-kit',
        name: 'Pippa Resistance Spring Fit Kit',
        brand: 'Liv Labs',
        category: 'pelvic-floor',
        type: 'physical',
        internal: false,
        healthFunctions: ['pelvic-floor'],
        tags: ['incontinence', 'fitness', 'comfort'],
        price: '$149.00',
        whereToBuy: ['livlabsfitness.com'],
        url: 'https://livlabsfitness.com/products/pippa-fit-kit',
        image: '/products/livlabs/pippa-fit-kit.webp',
        summary: 'From Liv Labs (see the Pippa Starter Kit entry for the brand\'s founder story) — includes both a light- and a medium-resistance Pippa spring plus applicator, letting users progress to a stronger resistance level as pelvic floor engagement builds.',
        safety: {
            fdaStatus: 'Marketed as a general wellness/fitness product, not an FDA-cleared medical device. See the Pippa Starter Kit entry for the brand\'s materials and manufacturing claims.',
            materials: 'High-purity biomedical-grade silicone springs (light and medium resistance); reusable applicator.',
            recalls: 'No recalls found.',
            sideEffects: 'Same internal-wear hygiene considerations as the Starter Kit — wash hands and the spring before and after each use.',
            opinionAlerts: 'Same as the Starter Kit: wear-duration guidance is described by the brand as a matter of preference; ayna could not independently verify a specific maximum recommended wear time.',
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Same underlying device category and evidence picture as the Pippa Starter Kit (see that entry for the fuller discussion of the related vaginal-cone research) — this kit simply adds a medium-resistance spring so users can progress in resistance level as pelvic floor engagement builds, similar in concept to progressing to a heavier weighted cone in that literature.',
        doctorOpinionShort: 'Same evidence and caveats as the Pippa Starter Kit; this kit adds a medium-resistance spring for progression.',
        doctorOpinionCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD002114.pub2/full', label: 'Cochrane: Weighted vaginal cones for urinary incontinence' },
        ],
        communityReview: 'See the Pippa Starter Kit entry — independent (non-brand) review volume for this specific kit is limited at time of writing.',
        ingredients: 'High-purity biomedical-grade silicone resistance springs (light and medium resistance); reusable applicator.',
        effectiveness: 'Same underlying evidence picture as the Starter Kit; the added medium-resistance spring is a progression option, not a separately studied variant.',
        scientificCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD002114.pub2/full', text: 'Cochrane: Weighted vaginal cones for urinary incontinence', summary: 'Found weighted vaginal cones more effective than no active treatment for stress urinary incontinence, and possibly comparable to standard pelvic floor muscle training.' },
        ],
        integrations: [],
        badges: [],
        verificationLinks: {
            community: { links: [
                { platform: 'instagram', url: 'https://www.instagram.com/livlabsfitness/', text: 'Liv Labs on Instagram', summary: 'Brand content and community posts.' },
            ] },
        },
        isEmergingBrand: true,
    },
];

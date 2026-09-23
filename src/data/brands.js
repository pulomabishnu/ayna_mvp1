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
        // Ayna affiliate link — affiliateUrl wins over `url` for the Buy Now /
        // Visit Site destination (see getBuyUrl in ProductModal.jsx). Verified
        // 2026-09-08: the site's real path is singular "/product/", not the
        // "/products/" path from the affiliate program's own link table.
        affiliateUrl: 'https://helloneycher.com/product/vaginal-moisturizer?sca_ref=12276038.vwBYOKCYa7&utm_source=affiliate&utm_medium=socialmedia&utm_campaign=affiliate',
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
        // Category-level citations shown only on the Scientific literature
        // tab (merged there with the per-ingredient citations above) — kept
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
                        summary: 'Visible feedback centers on noticeably improved day-to-day comfort after adding it to a routine. A specific rating/review count wasn\'t independently verifiable at time of writing — Amazon blocks automated access.',
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
        // Ayna affiliate link — affiliateUrl wins over `url` for the Buy Now /
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
        url: 'https://www.helloneycher.com/product/hydrobloom-moisturizing-gel',
        // Ayna affiliate link — affiliateUrl wins over `url` for the Buy Now /
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
                        // this is the real, current product listing. Read
                        // the reviews directly on Amazon.
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
        tags: ['pelvic-floor', 'leaks', 'discomfort', 'postpartum'],
        price: '$30/month or $180/year (14-day free trial; HSA/FSA eligible)',
        userRating: 4.9,
        whereToBuy: [], // membership site + app; affiliateUrl below covers it
        url: 'https://connectpelvicfloorfitness.com/',
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://goto.connectpelvicfloorfitness.com/YVk7WO',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/b1/39/0f/b1390fbf-2c51-b7ff-af3b-b9a7660f4b9c/AppIcon-0-0-1x_U007emarketing-0-8-0-85-220.png/512x512bb.jpg',
        platform: 'iOS, Android, web, Apple TV, Amazon Fire TV, Roku',
        summary: '850+ guided workouts (strength, HIIT, yoga, mobility) built specifically to train with the pelvic floor rather than against it. Developed by Caroline Packard, DPT, a pelvic floor physical therapist.',
        safety: {
            fdaStatus: 'N/A (fitness/wellness app, not a medical device)',
            materials: 'N/A',
            recalls: 'N/A',
            allergens: 'N/A',
            sideEffects: 'No physical side effects from the app itself. As with any pelvic floor exercise program, working too hard too fast can cause temporary soreness or symptom flare-ups.',
        },
        privacy: { dataStorage: 'Check app', sellsData: 'Check policy', hipaa: 'N/A', keyPolicy: 'Check the brand\'s privacy policy for health-data handling.' },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Developed by Caroline Packard, DPT, a licensed pelvic floor physical therapist; positioning per the brand\'s own site.',
        doctorOpinion: 'Structured, PT-designed pelvic floor programs with progressive difficulty and form cues can improve consistency and technique versus generic Kegel advice.',
        communityReview: 'Monthly live Q&As with the founder and a members-only community are part of the membership, per the brand\'s own site.',
        effectiveness: 'Offers 850+ guided workouts and 10+ specialized programs with self-assessments to track progress; no independent clinical study of the program was found.',
        integrations: [],
        badges: ['Pelvic Health', 'PT-Developed'],
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/PelvicFloor/search/?q=connect+pelvic+floor&restrict_sr=1', text: 'Reddit r/PelvicFloor', summary: 'Community discussions on pelvic floor training apps.' }] } },
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
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
    // Elitone brand partnership (2026-09-07) — per-product affiliate links
    // (each product's own URL with ?af=aynahealth appended, corrected
    // 2026-09-15 from a single shared elitone.com/?af=aynahealth link).
    // Category stays 'incontinence' (its primary shopping aisle), but per
    // Ayna's taxonomy Elitone is clinically a "pelvic floor exerciser": an
    // FDA-cleared Class II device that contracts the pelvic floor FOR the
    // user (see CATEGORY_LABELS in products.js) — it's included in the
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
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://elitone.com/product/elitone/?af=aynahealth',
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
        doctorOpinion: 'This is a pelvic floor EXERCISER, not a trainer: it is FDA-cleared to electrically contract your pelvic floor for you, unlike a biofeedback-only trainer (e.g. Elvie, weighted Kegel balls) which only helps you perform your own contractions correctly. Elitone uses a proprietary high-frequency PMW waveform delivered through an external adhesive pad, positioned as a no-prescription-needed alternative to doing pelvic floor exercises manually — the brand states it performs roughly 100 contractions per 20-minute session.',
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
        tags: ['bladder-leaks', 'incontinence', 'urinary', 'pelvic-floor', 'menopause', 'postpartum'],
        price: 'From $399',
        whereToBuy: [],
        url: 'https://elitone.com/product/elitone-urge/',
        affiliateUrl: 'https://elitone.com/product/elitone-urge/?af=aynahealth',
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
        doctorOpinion: 'Unlike the original Elitone, this is NOT a pelvic floor exerciser: it calms unwanted bladder-muscle contractions rather than strengthening the pelvic floor, so it doesn\'t fit either the "trainer" (biofeedback) or "exerciser" (contracts the pelvic floor for you) category. Elitone URGE uses the same proprietary PMW waveform technology as the original Elitone, tuned to calm unwanted bladder-muscle contractions from misfiring nerve signals rather than to strengthen pelvic floor muscles directly.',
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
        tags: ['discomfort', 'menopause', 'postpartum', 'hormone-free'],
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
            fdaStatus: 'Cosmetic / external personal-care product; not an FDA-cleared drug or medical device.',
            materials: 'BUNI describes the formula as hormone-free and made with 99.5–100% natural ingredients.',
            recalls: 'No recalls found.',
            sideEffects: 'External vulvar use only; the brand states it is not intended for internal vaginal use. Stop use if irritation develops and check with a clinician before use during pregnancy or breastfeeding.',
            opinionAlerts: 'Benefit and ingredient claims are from BUNI; no independent clinical trial of the finished product was identified.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'BUNI states the product was developed by OB/GYNs and dermatologists; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions REJUVENATE as a gynecologist-developed, hormone-free external moisturizer for vulvar dryness, friction, and irritation.',
        effectiveness: 'Designed to moisturize and reduce friction on external vulvar skin; no independent clinical study of the finished product was found.',
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
        tags: ['postpartum', 'pregnancy', 'comfort'],
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
            fdaStatus: 'Cosmetic / personal-care product; not an FDA-cleared drug or medical device.',
            materials: 'Lanolin-free balm made with botanical oils, butters, and beeswax.',
            recalls: 'No recalls found.',
            sideEffects: 'People with sensitivities or allergies to botanical ingredients or beeswax should review the ingredient list before use and stop if irritation develops.',
            opinionAlerts: 'BUNI markets the balm as suitable around nursing and states no wipe-off is needed; users should follow current label directions and their clinician or lactation professional’s guidance.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product positioning and safety statements are sourced from BUNI; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI positions SOOTHE as a lanolin-free option for reducing friction and moisturizing sore or dry nipple skin during nursing and pumping.',
        effectiveness: 'Provides an occlusive moisturizing layer for dry or irritated skin; no independent clinical study of the finished product was found.',
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
        tags: ['postpartum', 'comfort'],
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
        ingredients: 'BUNI highlights retinyl palmitate, snail secretion filtrate, organic avocado oil, apricot oil, chamomile, lavender, vitamin E, and sunflower oil.',
        safety: {
            fdaStatus: 'Cosmetic / personal-care product; not an FDA-cleared scar treatment.',
            materials: 'Topical oil with rollerball applicator plus an onyx gua sha massage tool.',
            recalls: 'No recalls found.',
            sideEffects: 'BUNI instructs users to obtain medical approval before using it on a new scar or C-section scar. Do not apply to an open or unhealed surgical wound unless specifically directed by a clinician.',
            opinionAlerts: 'Scar-improvement and massage claims are from BUNI; no independent clinical trial of the finished product was identified.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Product claims and usage guidance are sourced from BUNI; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'BUNI combines a topical body oil with rollerball and gua sha massage and advises medical approval before use on new or C-section scars.',
        effectiveness: 'May moisturize skin and support a regular scar-massage routine after appropriate wound healing; product-specific clinical benefit has not been independently established.',
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
        tags: ['postpartum', 'pregnancy', 'menopause', 'comfort', 'hormone-free'],
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
            fdaStatus: 'Bundle of cosmetic / personal-care products; not an FDA-cleared medical treatment.',
            materials: 'Contains the three BUNI topical products plus an onyx gua sha tool.',
            recalls: 'No recalls found.',
            sideEffects: 'Follow the individual product directions and ingredient warnings. TRANSFORM should not be used on a new or C-section scar without medical approval.',
            opinionAlerts: 'Product benefits are based on BUNI’s descriptions; no independent clinical study of the bundle was found.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Bundle contents and product positioning are sourced from BUNI; no independent clinician endorsement verified by ayna.',
        doctorOpinion: 'The bundle combines BUNI’s intimate moisturizer, nipple/lip balm, and scar/body oil into one postpartum and body-care set.',
        effectiveness: 'Convenience bundle containing three distinct topical products; effectiveness depends on the individual product and use case.',
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

    // SootheHer brand partnership (2026-09-16) — affiliate links supplied by
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
        // Ayna affiliate partnership — affiliateUrl wins over `url` for the
        // Buy Now / Visit Site destination (see getBuyUrl in ProductModal.jsx).
        affiliateUrl: 'https://collabs.shop/jfue1u',
        image: 'https://sootheher.com/assets/elaris-butterfly-hero-DnUO3OIN.webp',
        summary: 'A discreet, wearable TENS (transcutaneous electrical nerve stimulation) device for menstrual cramps. A butterfly-shaped gel pad worn on the lower abdomen sends adjustable electrical pulses meant to block pain signals, prompt endorphin release, and relax uterine muscles — worn under clothing, drug-free.',
        safety: {
            fdaStatus: 'FDA-cleared, per the brand.',
            materials: 'Device, reusable butterfly and circular gel pads, connecting wire, USB-C charging cable, user manual, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Brand states not for use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition — consult a clinician first if any of these apply.',
            opinionAlerts: 'Brand cites a 4.8-star rating across 718 reviews and offers a 30-day money-back guarantee — brand-hosted figures, not independently verified here.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: "Sourced from SootheHer's own site marketing claims, not independent clinical literature.",
        doctorOpinion: 'TENS (transcutaneous electrical nerve stimulation) has real supportive evidence for reducing primary dysmenorrhea pain via the gate-control mechanism the brand describes; this does not independently establish that the Elaris Pod specifically matches published TENS study outcomes. A 2024 Cochrane review found both high- and low-frequency TENS may reduce period pain compared with placebo or no treatment, though the reviewers downgraded their certainty because of risk of bias in the underlying trials, and a separate 2024 meta-analysis (10 RCTs, 469 women) found a statistically significant effect but with very high heterogeneity between studies — real evidence for the modality, with genuine uncertainty about how much relief to expect from any one device.',
        doctorOpinionCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013331.pub2/abstract', label: 'Cochrane: TENS for pain control in primary dysmenorrhea (2024)' },
            { url: 'https://doi.org/10.1080/17581869.2026.2714978', label: 'Pain Management: TENS for primary dysmenorrhea — systematic review & meta-analysis' },
        ],
        whoItsFor: [
            'People looking for a drug-free, reusable option for period cramp pain alongside or instead of OTC pain relievers',
            'Not recommended for anyone with a pacemaker, epilepsy, a heart rhythm condition, or who is pregnant, per the brand',
            'Best understood as a real but variable-benefit option — trial evidence for TENS generally is genuinely mixed on how much relief to expect',
        ],
        warnings: [
            'Do not use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition, per the brand.',
            'Persistent, severe, or worsening pelvic pain — or pain that doesn\'t respond to typical measures — warrants clinical evaluation.',
        ],
        effectiveness: 'Positioned by the brand as fast-acting, drug-free cramp relief; no independently conducted clinical study of this specific device was found here. TENS as a pain-relief category has supportive evidence for dysmenorrhea.',
        scientificCitations: [
            { url: 'https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD013331.pub2/abstract', text: 'Cochrane: Transcutaneous electrical nerve stimulation (TENS) for pain control in women with primary dysmenorrhoea', summary: '2024 Cochrane review: both high- and low-frequency TENS may reduce pain vs. placebo/no treatment, though certainty was downgraded for risk of bias in the underlying trials.' },
            { url: 'https://doi.org/10.1080/17581869.2026.2714978', text: 'Pain Management: Transcutaneous electrical nerve stimulation in the relief of primary dysmenorrhea — systematic review and meta-analysis', summary: '10 RCTs, 469 women: statistically significant reduction in pain intensity favoring TENS, with very high heterogeneity between studies.' },
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
        image: '',
        summary: 'A 4-pack of replacement butterfly gel pads for the Elaris Pod. Each gel pad is rated for roughly 30-40 uses; store on the plastic backing between uses to extend pad life, per the brand.',
        safety: {
            fdaStatus: 'Accessory to the FDA-cleared Elaris Pod device, per the brand; not separately FDA-cleared.',
            materials: 'Reusable gel pad material, per the brand.',
            recalls: 'No recalls found.',
            sideEffects: 'Same use precautions as the Elaris Pod — brand states not for use if pregnant, or if you have a pacemaker, epilepsy, or a heart rhythm condition.',
            opinionAlerts: 'Brand-hosted rating shown at time of listing was based on very few reviews — check current review volume before treating it as representative.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: "Sourced from SootheHer's own site marketing claims, not independent clinical literature.",
        doctorOpinion: 'A consumable accessory for the Elaris Pod rather than a standalone treatment; replacing worn gel pads maintains the skin contact needed for the device to deliver its stimulation effectively.',
        effectiveness: 'Maintenance accessory, not a standalone treatment — effectiveness depends on the Elaris Pod device itself.',
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

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
        url: 'https://hellowinx.com/',
        image: 'https://cdn.shopify.com/s/files/1/0077/8761/0171/files/UTITest_Treat_1.png?v=1771347569',
        summary: 'An at-home UTI test paired with Winx Rx, the brand\'s own telehealth service — check symptoms with a rapid test, then connect to a licensed provider for prescription treatment if needed. Recognized as a TIME Best Invention.',
        safety: {
            fdaStatus: 'Consumer diagnostic test; any prescription treatment is issued by a licensed telehealth provider, not the test itself.',
            materials: 'See product packaging for full test component and ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific to the test itself; any treatment side effects depend on the medication a provider prescribes.',
            opinionAlerts: 'Winx Health markets this as "OBGYN approved" on its own site — verify current claims and availability directly at hellowinx.com.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Winx Health\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Winx Health describes its UTI Test + Treat as "OBGYN approved," with Winx Rx able to deliver prescription treatment results in about 4 hours.',
        effectiveness: 'Combines an at-home rapid test with telehealth access to prescription treatment; the underlying test was recognized as a TIME Best Invention.',
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
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
        price: 'See retailer',
        whereToBuy: ['Amazon'],
        url: 'https://www.helloneycher.com/',
        summary: 'A non-hormonal vaginal moisturizer positioned as a natural alternative for dryness, irritation, and discomfort — part of Neycher\'s intimate-care line, which also includes suppositories and a vulva balm.',
        safety: {
            fdaStatus: 'Manufactured in FDA-registered facilities per the brand\'s site; not an FDA-cleared medical device.',
            materials: 'See product packaging for full ingredient list.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'Brand states products are "not intended to diagnose, treat, cure, or prevent any disease" — standard cosmetic/wellness disclaimer language.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Neycher\'s own site marketing claims, not independent clinical literature.',
        doctorOpinion: 'Neycher states its formulas are developed with input from "scientists, doctors, and researchers" and are "OB/GYN and real people-approved," per the brand\'s own site.',
        effectiveness: 'Positioned as a non-hormonal alternative to antibiotic, antifungal, or hormone treatments for vaginal dryness and irritation; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
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
        summary: 'A daily UTI-prevention capsule combining D-mannose, soluble cranberry PACs, vitamin D3, and zinc — designed for people prone to recurrent UTIs who want a preventive daily routine rather than only reactive treatment.',
        safety: {
            fdaStatus: 'Dietary supplement; not FDA-evaluated for disease treatment (standard supplement disclaimer).',
            materials: '38mg soluble PACs (cranberry proanthocyanidins), 500mg D-mannose, vitamin D3, zinc, polyphenols — per the brand\'s site.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; consult a clinician before starting any new supplement, especially if pregnant, breastfeeding, or on medication.',
            opinionAlerts: 'Brand states these claims have "not been evaluated by the FDA" and the product is "not intended to diagnose, treat, cure, or prevent any disease" — standard supplement disclaimer.',
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
        summary: 'A warming pleasure wand designed for perimenopausal and menopausal women navigating changes in arousal and vaginal dryness — part of Oboo\'s "midlife-friendly, body-smart, shame-free" intimate wellness line, which also includes daily and arousal moisturizers.',
        safety: {
            fdaStatus: 'Personal pleasure device; not a medical device.',
            materials: 'Body-safe, phthalate-free silicone, per the brand\'s site.',
            recalls: 'No recalls found.',
            sideEffects: 'None specific reported; discontinue use and consult a clinician if irritation occurs.',
            opinionAlerts: 'No FDA-clearance or clinical-study claims found on the brand site — marketed on materials/design safety and menopause-specific positioning, not clinical evidence.',
        },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Sourced from Oboo\'s own site; no independent clinician endorsement verified.',
        communityReview: 'Named a 2026 Oprah Daily Menopause O-Ward Winner; featured in Wellness Magazine, Oprah Daily, The Pause Life, and Flow Space.',
        effectiveness: 'Positioned to address menopause-related changes in arousal and vaginal dryness; no independent clinical study of the product was found.',
        integrations: [],
        badges: [],
        isEmergingBrand: true, // shows a 'Brand' tag on the Discovery card, next to the type badge
    },
];

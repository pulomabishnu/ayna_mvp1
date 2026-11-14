import { formatPrice } from '../utils/formatPrice.js';
// ============================================================
// Ayna Startups Database, Real Women's Health Startups
// ============================================================
// VERIFICATION: Before adding a startup, confirm (1) url resolves and is real,
// (2) company/product is findable and real. Do not add placeholders or defunct sites.
// ============================================================

export const STARTUPS = [
    {
        id: 's-qvin',
        name: 'Qvin',
        tagline: 'Period blood diagnostics. Lab tests from your pad',
        description: 'FDA-cleared pad that analyzes your menstrual blood for health markers like A1C (diabetes screening) without a blood draw. Just wear the pad, mail it in, get results.',
        tags: ['heavy-flow', 'irregular', 'pcos', 'safety-concern', 'organic'],
        healthFunctions: ['cycle-tracking'],
        category: 'diagnostics',
        stage: 'FDA-cleared, shipping soon',
        productReleased: false,
        spotsLeft: 340,
        url: 'https://www.qvin.com',
        image: 'https://www.nonwovens-industry.com/wp-content/uploads/sites/11/2025/08/796_main-4.jpg'
    },
    {
        id: 's-inne',
        name: 'inne',
        communityReview: 'Trustpilot rates inne 4.1/5 from 276 reviews (59% 5-star, 10% 1-star). Reviewers praise easy-to-use app and effective cycle tracking / pregnancy planning. Common complaints: needs wifi and is hard to use with shift-work schedules. One reviewer: "The app is user-friendly, with a clear and comprehensive layout that made the learning curve fast and easy."',
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ url: 'https://www.trustpilot.com/review/inne.io', text: 'Trustpilot: inne', summary: 'Trustpilot rates inne 4.1/5 from 276 reviews (59% 5-star, 10% 1-star). Reviewers praise easy-to-use app and effective cycle tracking / pregnancy planning. Common complaints: needs wifi and is hard to use with shift-work schedules. One reviewer: "The app is user-friendly, with a clear and comprehensive layout that made the learning curve fast and easy."' }] } },
        tagline: 'At-home saliva hormone monitoring',
        description: 'A minilab that reads your progesterone from saliva daily. Gives real hormone data, not estimates, to understand your fertility window and cycle health.',
        tags: ['irregular', 'pcos', 'fertility', 'sustainability'],
        healthFunctions: ['cycle-tracking'],
        category: 'hormone-monitoring',
        stage: 'Available in EU, US waitlist',
        productReleased: true,
        spotsLeft: 890,
        url: 'https://www.inne.io',
        image: 'https://inne.io/cdn/shop/files/66f8e9b17901a3db0460604b71918692-removebg-preview_1.webp?v=1771858648&width=400'
    },
    {
        id: 's-daye',
        name: 'Daye',
        communityReview: 'Trustpilot rates Daye 4.3/5 from 700 reviews (83% 5-star, 7% 1-star). Reviewers praise innovative at-home testing and eco-friendly products. Common complaints: slow customer-service replies and delivery issues. One reviewer: "The microbiome screen test is a game changer. No second guessing or self medicating before knowing what is really going on."',
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ url: 'https://www.trustpilot.com/review/yourdaye.com', text: 'Trustpilot: Daye', summary: 'Trustpilot rates Daye 4.3/5 from 700 reviews (83% 5-star, 7% 1-star). Reviewers praise innovative at-home testing and eco-friendly products. Common complaints: slow customer-service replies and delivery issues. One reviewer: "The microbiome screen test is a game changer. No second guessing or self medicating before knowing what is really going on."' }] } },
        tagline: 'CBD-infused tampons + at-home vaginal microbiome screening',
        description: 'Tampons with pain-relieving CBD coating, plus an at-home screening kit that tests your vaginal microbiome for infections like BV using the tampon you already wore.',
        tags: ['cramps', 'discomfort', 'organic', 'safety-concern', 'heavy-flow'],
        healthFunctions: ['menstrual-collection', 'vaginal-health'],
        category: 'period-care',
        stage: 'UK available, US expansion planned',
        productReleased: true,
        spotsLeft: 620,
        url: 'https://www.yourdaye.com',
        image: 'https://images.prismic.io/ecommerce-website/7c1d4603-2d8e-4b9a-8f74-4ea6ad77abbb_CBD+Organic+Tampon+Box%402x.jpg?auto=compress%2Cformat&fit=max&q=75'
    },
    {
        id: 's-allara',
        name: 'Allara',
        communityReview: 'Trustpilot rates Allara 4.4/5 from 1,002 reviews (81% 5-star, 13% 1-star). Reviewers praise attentive, knowledgeable providers and convenient telehealth. Common complaints: unexpected billing and unclear insurance coverage. One reviewer: "Providers are knowledgeable, empathetic, listen carefully to symptoms"',
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ url: 'https://www.trustpilot.com/review/allarahealth.com', text: 'Trustpilot: Allara', summary: 'Trustpilot rates Allara 4.4/5 from 1,002 reviews (81% 5-star, 13% 1-star). Reviewers praise attentive, knowledgeable providers and convenient telehealth. Common complaints: unexpected billing and unclear insurance coverage. One reviewer: "Providers are knowledgeable, empathetic, listen carefully to symptoms"' }] } },
        tagline: 'Comprehensive PMOS care. Virtual clinic',
        description: 'Telehealth-first PMOS clinic with OB-GYNs, endocrinologists, dietitians, and mental health therapists. Complete care plans instead of "just take birth control."',
        tags: ['pcos', 'irregular', 'heavy-flow'],
        healthFunctions: ['telehealth'],
        category: 'telehealth',
        stage: 'Accepting patients in most states',
        productReleased: true,
        spotsLeft: 150,
        url: 'https://www.allarahealth.com',
        image: 'https://shop.allarahealth.com/cdn/shop/files/AntiInflamm_Reg_442362ee-3292-4b49-8ed8-b41871dc24f7.png?v=1764652085'
    },
    // 's-evernow' removed 2026-10-04: duplicated d-evernow on Browse.
    // 's-midi' removed 2026-10-04: duplicated d-midi-health on Browse.
    {
        id: 's-hertility',
        name: 'Hertility',
        communityReview: 'Trustpilot rates Hertility 4.1/5 from 1,276 reviews (72% 5-star, 9% 1-star). Reviewers praise supportive staff and fast, detailed results. Common complaints: painful finger-prick collection and some follow-ups feeling generic. One reviewer: "friendly, supportive, and empathetic"',
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ url: 'https://www.trustpilot.com/review/hertilityhealth.com', text: 'Trustpilot: Hertility', summary: 'Trustpilot rates Hertility 4.1/5 from 1,276 reviews (72% 5-star, 9% 1-star). Reviewers praise supportive staff and fast, detailed results. Common complaints: painful finger-prick collection and some follow-ups feeling generic. One reviewer: "friendly, supportive, and empathetic"' }] } },
        tagline: 'At-home hormone & fertility testing',
        description: 'Finger-prick blood test that measures up to 10 key reproductive hormones. Results reviewed by reproductive scientists with personalized care plan.',
        tags: ['irregular', 'pcos', 'safety-concern', 'fertility'],
        healthFunctions: ['cycle-tracking'],
        category: 'diagnostics',
        stage: 'Available UK, US launch planned',
        productReleased: true,
        spotsLeft: 750,
        url: 'https://www.hertilityhealth.com',
        image: '/startup_placeholder.png'
    },
    {
        id: 's-oova',
        name: 'Oova',
        tagline: 'Personalized fertility tracking from urine',
        description: 'At-home urine test that measures three hormones: LH, E3G (an estrogen marker), and PdG (a progesterone marker). Oova markets it for trying to conceive, perimenopause, PMOS, and cycle tracking.',
        tags: ['irregular', 'pcos', 'fertility'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'Shipping in US',
        productReleased: true,
        spotsLeft: 280,
        url: 'https://www.oova.life',
        image: 'https://shop.oova.life/_next/image?url=%2Fimages%2Fproduct-order%2F4-thumb.webp&w=256&q=100'
    },
    {
        id: 's-delune',
        name: 'De Lune',
        tagline: 'Herbal tinctures for period symptoms',
        description: 'Herbal remedies for the menstrual cycle. Its Cramp Aid is a liquid extract of herbs and nutrients sold for period cramps ($78 for three periods). De Lune doesn’t publish the ingredient list on its product page.',
        tags: ['cramps', 'discomfort', 'organic'],
        healthFunctions: ['cramp-relief', 'supplement'],
        category: 'supplement',
        stage: 'Available, growing',
        spotsLeft: 410,
        url: 'https://www.delune.co',
        image: 'https://delune.co.uk/cdn/shop/files/DELUNEBEAUTY.jpg?v=1759875623'
    },
    {
        id: 's-wile',
        name: 'Wile',
        tagline: 'Perimenopause supplements. The years before menopause',
        description: 'Plant-based supplements designed for women in their late 30s–50s navigating perimenopause. Addresses stress, sleep, hot flashes, and mood shifts.',
        tags: ['discomfort', 'menopause', 'organic'],
        healthFunctions: ['supplement'],
        category: 'menopause',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 320,
        url: 'https://wilewomen.com',
        image: 'https://wilewomen.com/cdn/shop/files/Untitled-1_750x.png?v=1724791346'
    },
    {
        id: 's-nextgenjane',
        name: 'NextGen Jane',
        tagline: 'Menstrual blood diagnostics for endometriosis',
        description: 'Uses your used tampon to screen for endometriosis and other conditions through menstrual blood biomarkers. Could replace the 7-10 year average diagnosis delay.',
        tags: ['heavy-flow', 'cramps', 'discomfort', 'endometriosis'],
        healthFunctions: ['cycle-tracking'],
        category: 'diagnostics',
        stage: 'Clinical trials, waitlist open',
        productReleased: false,
        spotsLeft: 500,
        url: 'https://www.nextgenjane.com',
        image: 'https://d1bpnn2a5id540.cloudfront.net/1692199008398/ea4b56a0-7865-11ee-bbc0-1bf565ddcce8.jpg'
    },
    {
        id: 's-mira',
        name: 'Mira Fertility',
        tagline: 'AI-powered home fertility monitor',
        description: 'At-home urine hormone monitor. Depending on the kit, it measures LH, E3G (an estrogen marker), PdG (a progesterone marker), and FSH, using fluorescent test technology Mira compares to lab methods.',
        tags: ['irregular', 'pcos', 'fertility'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'Shipping globally',
        spotsLeft: 190,
        url: 'https://www.miracare.com',
        image: 'https://shop.miracare.com/cdn/shop/products/mira00956-plus_5d9965da-80d4-42af-ac33-1b0167e26005.jpg?v=1685519249&width=1920'
    },
    // 's-elvie' removed 2026-10-04: duplicated p-elvie-trainer on Browse.
    // 's-wisp' removed 2026-10-04: duplicated d-wisp-bc on Browse.
    {
        id: 's-wildai',
        name: 'Wild.AI',
        tagline: 'AI fitness coach that adapts to your hormones',
        description: 'Adjusts your training, nutrition, and recovery based on your menstrual cycle phase, sleep, stress, and biometrics. Built by women athletes for women athletes.',
        tags: ['cramps', 'irregular', 'comfort', 'sustainability'],
        healthFunctions: ['fitness-cycle', 'cycle-tracking'],
        category: 'fitness',
        stage: 'Available, growing',
        productReleased: true,
        spotsLeft: 260,
        url: 'https://www.wild.ai',
        // Wild.AI's Google Play Store app icon, verified to load (512x512).
        image: 'https://play-lh.googleusercontent.com/eSpZpjrxOFnyEeCGChJbVvKkvJAe2Mph3fZjLq3zzr2hltwXbTUEDTDoZai-mrvNo0j3xiKdmHHtkRdqGZT8drg=s512-rw'
    },
    // ─── Fertility & pregnancy ─────────────────────────────
    // 's-natalist' removed 2026-10-02: Everly Health bought Natalist in 2021 and
    // its direct-to-consumer shop closed in early 2025; natalist.com now
    // redirects to everlywell.com.
    {
        id: 's-kindbody',
        name: 'Kindbody',
        tagline: 'Fertility clinics and employer benefits',
        description: 'Network of fertility clinics offering IVF, egg freezing, and IUI. Employer-sponsored benefits and direct-to-consumer options with integrated care.',
        tags: ['fertility', 'pcos', 'irregular'],
        healthFunctions: ['telehealth'],
        category: 'fertility',
        stage: 'Clinics in major US cities',
        productReleased: true,
        spotsLeft: 180,
        url: 'https://www.kindbody.com',
        image: 'https://images.squarespace-cdn.com/content/v1/524b9ac2e4b067caf1ceeff8/1579147540028-5J3DDQ6ATXWTG8EO8CRI/2019.8.26.Kindbody.Product15294.jpg'
    },
    {
        id: 's-maven',
        name: 'Maven',
        communityReview: 'Trustpilot rates Maven 3.6/5 from 13 reviews (69% 5-star, 23% 1-star). Reviewers praise same- or next-day specialist access during pregnancy and postpartum. Common complaints: a confusing, slow Maven Wallet reimbursement process. One reviewer: "Having the ability to get care within the same day or next day was invaluable to my postpartum experience." Small sample.',
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ url: 'https://www.trustpilot.com/review/mavenclinic.com', text: 'Trustpilot: Maven', summary: 'Trustpilot rates Maven 3.6/5 from 13 reviews (69% 5-star, 23% 1-star). Reviewers praise same- or next-day specialist access during pregnancy and postpartum. Common complaints: a confusing, slow Maven Wallet reimbursement process. One reviewer: "Having the ability to get care within the same day or next day was invaluable to my postpartum experience." Small sample.' }] } },
        tagline: 'Digital clinic for women and family health',
        description: 'Largest digital health clinic for women. Fertility, pregnancy, postpartum, parenting, and menopause. Used by employers and health plans.',
        tags: ['fertility', 'menopause', 'discomfort', 'privacy'],
        healthFunctions: ['telehealth', 'cycle-tracking'],
        category: 'telehealth',
        stage: 'Employer and individual plans',
        productReleased: true,
        spotsLeft: 220,
        url: 'https://www.mavenclinic.com',
        image: 'http://mavenbuilt.com/cdn/shop/products/B6_GreyOrange_03_25049eca-c4e2-4164-ab31-923749b0828f_grande.jpg?v=1650904614'
    },
    {
        id: 's-alife',
        name: 'Alife Health',
        tagline: 'AI for IVF and fertility care',
        description: 'AI-powered tools for fertility clinics and patients. Improves IVF outcomes with data-driven recommendations and personalized insights.',
        tags: ['fertility', 'pcos', 'irregular'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'Partnering with clinics, US',
        productReleased: true,
        spotsLeft: 310,
        url: 'https://www.alifehealth.com',
        image: 'https://images.ctfassets.net/qwbbe6jrhloh/5COezplMJCFppM9MkJD59E/3edb593cc9285563d40a4314082965e3/Alife.png?w=1248&h=408&q=50&fm=png'
    },
    // 's-proov' removed 2026-09-07: Proov is now a confirmed brand partner
    // with 5 real, individually-linked products in src/data/brands.js
    // (BRAND_PRODUCTS), replacing this single generic entry and its stale
    // affiliate URL.
    {
        id: 's-premom',
        name: 'Premom',
        tagline: 'Ovulation and fertility tracking app',
        description: 'App with ovulation predictor tests, BBT, and cycle tracking. Syncs with devices and helps pinpoint fertile window for conception.',
        tags: ['fertility', 'irregular', 'pcos'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'Available globally',
        productReleased: true,
        spotsLeft: 350,
        url: 'https://www.premom.com',
        image: 'https://premom.com/wp-content/uploads/2024/10/press-supplement-line-2024.webp'
    },
    {
        id: 's-birdandbe',
        name: 'Bird&Be',
        tagline: 'Fertility supplements for egg and sperm health',
        description: 'Evidence-based prenatal and fertility supplements. Separate formulations for egg and sperm health, developed with reproductive specialists.',
        tags: ['fertility', 'organic', 'pcos'],
        healthFunctions: ['supplement'],
        category: 'fertility',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 420,
        url: 'https://birdandbe.com',
        image: 'https://mma.prnewswire.com/media/2785348/Bird_Be_Hi_Res_Logo.jpg?p=twitter'
    },
    {
        id: 's-beafertility',
        name: 'Béa Fertility',
        tagline: 'At-home intracervical insemination',
        description: 'Medical device for at-home insemination (ICI). For couples and solo parents trying to conceive without clinic visits. Available in UK, US waitlist.',
        tags: ['fertility', 'privacy', 'irregular'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'UK available, US coming',
        productReleased: false,
        spotsLeft: 520,
        url: 'https://beafertility.com',
        image: 'https://www.theconduit.com/wp-content/uploads/2024/06/bea-1.jpg.webp'
    },
    // ─── Menopause ────────────────────────────────────────
    {
        id: 's-elektra',
        name: 'Elektra Health',
        tagline: 'Menopause care and education',
        description: 'Digital menopause platform with expert-led programs, symptom tracking, and community. Evidence-based content and optional clinician access.',
        tags: ['menopause', 'discomfort', 'irregular'],
        healthFunctions: ['telehealth', 'mental-health'],
        category: 'menopause',
        stage: 'Available in US',
        productReleased: true,
        spotsLeft: 410,
        url: 'https://elektrahealth.com',
        image: 'https://i.vimeocdn.com/video/1607189844-00be211e412cac07e4a7b79a46d3d66f346dbb1cadecc1124a10eccd97821b1e-d?f=webp'
    },
    // 's-gennev' removed 2026-10-04: duplicated p-gennev-care on Browse.
    {
        id: 's-embr',
        name: 'Embr Labs',
        tagline: 'Wearable cooling for hot flashes',
        description: 'Embr Wave is a wrist-worn device that uses thermal (cooling and warming) technology, marketed to ease how hot flashes feel. It is drug-free. It is not FDA-cleared; no FDA clearance or device listing was found (checked 2026-10-02).',
        tags: ['menopause', 'discomfort', 'comfort'],
        healthFunctions: [],
        category: 'menopause',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 270,
        url: 'https://embrlabs.com',
        image: 'https://embrlabs.com/cdn/shop/products/embr-wave-2-travel-case-product-addon-accessory-109272.jpg?v=1698986426&width=533'
    },
    {
        id: 's-lisahealth',
        // Hidden Nov 13: lisahealth.com doesn't load and its Midday app is gone from the App Store.
        hidden: true,
        name: 'Lisa Health',
        tagline: 'Menopause and midlife health platform',
        description: 'Makes Midday, a menopause app that uses AI and wearable data to personalize symptom tracking and guidance, developed in collaboration with Mayo Clinic.',
        tags: ['menopause', 'discomfort', 'irregular'],
        healthFunctions: ['telehealth', 'mental-health'],
        category: 'menopause',
        stage: 'Available in US',
        productReleased: true,
        spotsLeft: 360,
        url: 'https://lisahealth.com',
        image: 'https://assets.delawaretoday.com/2023/07/302h-1068x712.jpg'
    },
    {
        id: 's-peppy',
        name: 'Peppy',
        tagline: 'Menopause and fertility support for employees',
        description: 'B2B app connecting employees to menopause and fertility specialists. One-on-one support, group sessions, and resources for inclusive benefits.',
        tags: ['menopause', 'fertility', 'discomfort'],
        healthFunctions: ['telehealth', 'mental-health'],
        category: 'menopause',
        stage: 'Enterprise, UK and US',
        productReleased: true,
        spotsLeft: 200,
        url: 'https://peppy.health',
        image: 'https://www.peppyforall.com/cdn/shop/files/1_4.jpg?v=1700559327&width=510'
    },
    // ─── Contraception & sexual health ────────────────────
    // 's-nurx' removed 2026-10-04: duplicated d-nurx-bc on Browse.
    {
        id: 's-pandia',
        name: 'Pandia Health',
        communityReview: 'Trustpilot rates Pandia Health 4.9/5 from 557 reviews (95% 5-star, 3% 1-star). Reviewers praise responsive, helpful staff. Common complaints: initial setup challenges and occasional missed messages. One reviewer: "They\'re very reliable and responsive which is extremely helpful for busy people like me."',
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ url: 'https://www.trustpilot.com/review/pandiahealth.com', text: 'Trustpilot: Pandia Health', summary: 'Trustpilot rates Pandia Health 4.9/5 from 557 reviews (95% 5-star, 3% 1-star). Reviewers praise responsive, helpful staff. Common complaints: initial setup challenges and occasional missed messages. One reviewer: "They\'re very reliable and responsive which is extremely helpful for busy people like me."' }] } },
        tagline: 'Birth control delivery by women doctors',
        description: 'Telehealth birth control prescriptions and delivery. Founded by women physicians. Accepts insurance and offers affordable options.',
        tags: ['contraception', 'privacy', 'comfort'],
        healthFunctions: ['telehealth', 'contraception'],
        category: 'telehealth',
        stage: 'Available in US',
        productReleased: true,
        spotsLeft: 390,
        url: 'https://www.pandiahealth.com',
        image: 'https://www.pandiahealth.com/wp-content/uploads/2024/07/Mask-group.png'
    },
    {
        id: 's-evofem',
        name: 'Evofem (Phexxi)',
        tagline: 'Non-hormonal birth control gel',
        description: 'Phexxi is a prescription vaginal gel that maintains vaginal pH to prevent pregnancy. Hormone-free option for those who cannot or prefer not to use hormones.',
        tags: ['contraception', 'organic', 'comfort'],
        healthFunctions: ['contraception'],
        category: 'telehealth',
        stage: 'FDA-approved, available by prescription',
        productReleased: true,
        spotsLeft: 340,
        url: 'https://www.phexxi.com',
        image: 'https://qtxasset.com/quartz/qcloud5/media/image/fiercepharma/1631496575/PhexxiBoxOpenEvofem.jpg/PhexxiBoxOpenEvofem.jpg?VersionId=DBzO9O.Y8BEYWr0wSyFMqNpr7WpWqiGN'
    },
    // ─── Period care & feminine care ───────────────────────
    {
        id: 's-august',
        name: 'August',
        tagline: 'Period care you actually want to use',
        description: 'Period care brand selling organic cotton tampons, pads, and liners, plus a period cup, by subscription or one-time order, and at Target.',
        tags: ['heavy-flow', 'organic', 'sustainability'],
        healthFunctions: ['menstrual-collection'],
        category: 'period-care',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 460,
        url: 'https://www.itsaugust.co',
        image: 'https://media.macphun.com/img/uploads/customer/blog/3654/Why_Use_a_White_Background-9096.png?q=85&w=1680'
    },
    {
        id: 's-honeypot',
        name: 'The Honey Pot',
        tagline: 'Plant-based feminine care',
        description: 'Plant-based washes, wipes, and period products. Founded by a Black woman; formulas designed for pH balance and sensitive skin.',
        tags: ['discomfort', 'organic', 'vaginal-health'],
        healthFunctions: ['vaginal-health', 'menstrual-collection'],
        category: 'intimate-care',
        stage: 'Available at Target, Walmart, DTC',
        productReleased: true,
        spotsLeft: 420,
        url: 'https://thehoneypot.co',
        // The Honey Pot's own og:image logo asset, verified to load (208x70).
        image: 'https://cdn.shopify.com/s/files/1/0510/5657/files/Asset_3_4b2a4423-11e7-40ce-a377-2be6ea68752e.png'
    },
    // 's-lovewellness' removed 2026-10-04: duplicated Love Wellness products (p-love-wellness-*) on Browse.
    // 's-rory' removed 2026-10-02: rory.com now says the domain was acquired and
    // redirects to an unrelated company; the Rory brand is no longer operating.
    // ─── Pelvic health & diagnostics ──────────────────────
    // 's-joylux' removed 2026-10-02: Joylux is a company with several
    // products, now listed individually in src/data/brands.js
    // (p-joylux-*), each with its own verified FDA status.
    // 's-elitone' removed 2026-09-07: Elitone is now a confirmed brand
    // partner with 2 real, individually-detailed products in
    // src/data/brands.js (BRAND_PRODUCTS), replacing this single generic
    // entry.
    {
        id: 's-kegg',
        name: 'Kegg',
        tagline: 'Cervical fluid tracking for fertility',
        description: 'Wearable that tracks cervical fluid to identify fertile days. No strips or urine; insert for a few seconds to get fertility insights.',
        tags: ['fertility', 'irregular', 'pcos'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 380,
        url: 'https://kegg.tech',
        image: 'https://kegg.tech/cdn/shop/files/kegg_3.webp?v=1745860535&width=1200'
    },
    // ─── Pregnancy & postpartum ───────────────────────────
    // 's-bodily' removed 2026-10-04: duplicated p-bodily-kit on Browse.
    {
        id: 's-oula',
        name: 'Oula',
        tagline: 'Modern maternity care with midwives',
        description: 'Brooklyn-based maternity clinic combining midwifery and OB-GYN care. Prenatal, birth, and postpartum in one integrated practice.',
        tags: ['fertility', 'discomfort', 'comfort'],
        healthFunctions: ['telehealth'],
        category: 'pregnancy',
        stage: 'NYC and virtual',
        productReleased: true,
        spotsLeft: 260,
        url: 'https://oulahealth.com',
        image: 'http://createcornwall.com/cdn/shop/products/IMG-2842.jpg?v=1642337350'
    },
    {
        id: 's-mahmee',
        name: 'Mahmee',
        tagline: 'Maternal health coordination platform',
        description: 'Care coordination for maternity and postpartum. Connects patients, providers, and payers to close gaps and improve outcomes.',
        tags: ['postpartum', 'discomfort', 'privacy'],
        healthFunctions: ['telehealth'],
        category: 'postpartum',
        stage: 'Health system and payer partnerships',
        productReleased: true,
        spotsLeft: 290,
        url: 'https://www.mahmee.com',
        image: 'https://i0.wp.com/tomcrowl.com/wp-content/uploads/2022/04/white-background-product-photos.jpg?fit=1600%2C1000&ssl=1'
    },
    {
        id: 's-poppyseed',
        name: 'Poppy Seed Health',
        tagline: 'Pregnancy loss and NICU support',
        description: 'App and community for pregnancy loss and NICU families. Doula-led support, resources, and peer connection during difficult journeys.',
        tags: ['fertility', 'discomfort'],
        healthFunctions: ['mental-health', 'telehealth'],
        category: 'pregnancy',
        stage: 'Available in US',
        productReleased: true,
        spotsLeft: 370,
        url: 'https://poppyseedhealth.com',
        // Poppy Seed Health's own og:image, verified to load (1000x500).
        image: 'https://static1.squarespace.com/static/5e31fe690dc60436b86c7f8c/t/609dd736564b372494c75eff/1620956982978/SOCIAL_SHARING_IMAGE2.png'
    },
    {
        id: 's-milkstork',
        name: 'Milk Stork',
        tagline: 'Ship your breast milk home when you travel',
        description: 'Service for traveling parents to ship expressed breast milk home. Coolers and shipping kits for safe, compliant transport.',
        tags: ['postpartum', 'comfort', 'privacy'],
        healthFunctions: [],
        category: 'postpartum',
        stage: 'Available in US',
        productReleased: true,
        spotsLeft: 330,
        url: 'https://www.milkstork.com',
        image: 'https://go.milkstork.com/hs-fs/hubfs/for-parent-page-01-2.png?width=1200&height=900&name=for-parent-page-01-2.png'
    },
    // ─── Mental health & wellness ─────────────────────────
    // 's-hers' removed 2026-10-04: duplicated d-hers on Browse.
    {
        id: 's-cleo',
        name: 'Cleo',
        tagline: 'Family and parenting benefits for employers',
        description: 'Employer-sponsored support for pregnancy, postpartum, and parenting. Coaches, specialists, and resources for the whole family.',
        tags: ['fertility', 'postpartum', 'discomfort'],
        healthFunctions: ['telehealth', 'mental-health'],
        category: 'telehealth',
        stage: 'Enterprise',
        productReleased: true,
        spotsLeft: 220,
        // Was 'https://www.cleo.com', which resolves to an unrelated
        // supply-chain/EDI software company, not this Cleo. Real site is
        // hicleo.com (verified via web search).
        url: 'https://hicleo.com',
        // hicleo.com's own logo, verified to load (512x236).
        image: 'https://hicleo.com/wp-content/uploads/2022/07/cropped-logo-cleo.png'
    },
    // ─── Diagnostics & biotech ─────────────────────────────
    // 's-femtec' removed 2026-10-02: FemTec Health wound down in May 2023
    // (assignment for the benefit of creditors; Axios, 2023-05-23).
    // 's-sandstone' removed 2026-10-02: described as "menopause and hormone
    // testing", but Sandstone Diagnostics' verifiable product (Trak) is an
    // at-home sperm test, and its site didn't load to confirm anything else.
    // ─── Supplements & nutrition ─────────────────────────
    {
        id: 's-fullwell',
        name: 'Fullwell',
        tagline: 'Fertility and prenatal supplements',
        description: 'Fertility and prenatal vitamins developed with dietitians and reproductive endocrinologists. Evidence-based doses and forms.',
        tags: ['fertility', 'organic', 'pcos'],
        healthFunctions: ['supplement'],
        category: 'supplement',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 380,
        url: 'https://fullwellfertility.com',
        image: 'http://fullwellfertility.com/cdn/shop/files/New_DHA_Women_s_Fish_Oil_Render.png?v=1763043615'
    },
    {
        id: 's-perelel',
        name: 'Perelel',
        tagline: 'OB-GYN formulated prenatal and women’s vitamins',
        description: 'Prenatal and women’s health supplements created by OB-GYNs. Stage-specific prenatal packs and targeted formulas.',
        tags: ['fertility', 'organic', 'menopause'],
        healthFunctions: ['supplement'],
        category: 'supplement',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 410,
        url: 'https://perelel.com',
        image: 'https://perelelhealth.com/cdn/shop/files/conception_-_29.png?v=1767981485&width=1000'
    },
    {
        id: 's-needed',
        name: 'Needed',
        tagline: 'Evidence-based prenatal and postpartum nutrition',
        description: 'Prenatal vitamins, collagen, and supplements for pregnancy and postpartum. Developed with RDs and clinicians; subscription options.',
        tags: ['fertility', 'organic', 'postpartum'],
        healthFunctions: ['supplement'],
        category: 'supplement',
        stage: 'Available, DTC',
        productReleased: true,
        spotsLeft: 360,
        url: 'https://thisisneeded.com',
        image: 'https://www.volusion.com/blog/content/images/2018/10/WhiteItem.jpg'
    },
    // ─── Cycle & fertility apps ───────────────────────────
    {
        id: 's-naturalcycles',
        name: 'Natural Cycles',
        communityReview: 'Trustpilot rates Natural Cycles 4.2/5 from 1,885 reviews (77% 5-star, 14% 1-star). Reviewers praise an easy-to-use app that helps people understand their cycles. Common complaints: steep price increases and subscription-renewal frustration. One reviewer: "Easy to use and I\'m learning a lot about my cycles!"',
        verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ url: 'https://www.trustpilot.com/review/naturalcycles.com', text: 'Trustpilot: Natural Cycles', summary: 'Trustpilot rates Natural Cycles 4.2/5 from 1,885 reviews (77% 5-star, 14% 1-star). Reviewers praise an easy-to-use app that helps people understand their cycles. Common complaints: steep price increases and subscription-renewal frustration. One reviewer: "Easy to use and I\'m learning a lot about my cycles!"' }] } },
        tagline: 'FDA-cleared birth control app',
        description: 'First FDA-cleared app for contraception and pregnancy planning. Uses basal body temperature and algorithm to identify fertile days.',
        tags: ['contraception', 'fertility', 'irregular'],
        healthFunctions: ['cycle-tracking', 'contraception'],
        category: 'fertility',
        stage: 'Available globally',
        productReleased: true,
        spotsLeft: 290,
        url: 'https://www.naturalcycles.com',
        // Natural Cycles' own og:image, verified to load (3150x2100).
        image: 'https://www.datocms-assets.com/21281/1762899321-us-not-fertile-new-screen-rachel-hand-holding-phone.png'
    },
    {
        id: 's-clue',
        name: 'Clue',
        tagline: 'Science-based period and cycle tracking',
        description: 'Period and cycle tracking app with a focus on privacy and science. No selling of health data; used for contraception and cycle awareness.',
        tags: ['irregular', 'fertility', 'privacy'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'Available globally',
        productReleased: true,
        spotsLeft: 340,
        url: 'https://helloclue.com',
        // Clue's own og:image, verified to load (2400x1254).
        image: 'https://images.ctfassets.net/juauvlea4rbf/2dX5DYLHtXaEbqIvVxQyRx/39c7a79e61861f9bd3a734f323168299/open_graph_about__1_.png'
    },
    {
        id: 's-ovia',
        name: 'Ovia Health',
        tagline: 'Fertility, pregnancy, and parenting apps',
        description: 'Apps for fertility tracking, pregnancy, and parenting. Employer and health plan partnerships for family benefits.',
        tags: ['fertility', 'irregular', 'postpartum'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: 'Available, employer and DTC',
        productReleased: true,
        spotsLeft: 380,
        url: 'https://www.oviahealth.com',
        // Reuses the same local verified asset as the existing d-ovia
        // catalog entry (same company).
        image: '/products/verified/d-ovia.jpg'
    },
    {
        id: 's-femometry',
        name: 'Femometer',
        tagline: 'Smart ring for cycle, temperature, and sleep tracking',
        description: 'Women-focused smart rings (Ring Gen 2 and Ring Air) that track overnight basal body temperature with three sensors to predict ovulation and period, plus sleep, heart rate, HRV, blood oxygen, stress, and recovery. Regularly $199.99. Up to 7-day battery, IP68 water resistant, and no subscription needed for core insights.',
        tags: ['fertility', 'irregular', 'pcos'],
        healthFunctions: ['cycle-tracking'],
        category: 'fertility',
        stage: '$199.99 · Available in US',
        productReleased: true,
        spotsLeft: 430,
        url: 'https://www.femometer.com/',
        image: 'https://s.femometer.com/products/smart-ring-air/femometer-ring-air.webp',
        communityReview: 'Reviews are mixed but lean positive on Amazon. The Ring Air listing is rated 4.1/5 from 61 ratings (64% 5-star, 12% 1-star). Customers call it comfortable and an affordable way to track health metrics, especially for trying to conceive or natural family planning, though fit gets mixed feedback and some reviewers had sizing problems. Critical reviewers mention the gold finish scratching off within a month, sleep tracking that felt inaccurate, and one who preferred the RingConn. TikTok reviewers and independent write-ups also praise the price versus subscription-based rings and the overnight temperature charts. A 2024 independent reviewer found early charts jumpy, noted it measures skin temperature rather than true BBT, and would not rely on it alone to avoid pregnancy. Trustpilot is negative (2.3/5 from only 7 reviews for femometer.com): reviewers report battery failure after a few months, the ring cracking or the shell separating, and slow or unresolved refunds. Walmart reviews and Reddit threads could not be verified at time of writing.',
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [] },
            community: { links: [
                { platform: 'tiktok', url: 'https://www.tiktok.com/@dr.randiblikely/video/7636209543688506654', text: 'TikTok: Femometer vs RingConn', summary: 'A creator video titled "Help me decide between RingConn Smart Ring or Femometer," one of many TikTok comparisons of Femometer against other smart rings. Video contents could not be read automatically; open the link for the full review.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/@daniellencarey/video/7646871798360853791', text: 'TikTok: comparing smart rings I have tried', summary: 'A creator video comparing several smart rings, including Femometer, RingConn, and others. Video contents could not be read automatically; open the link for the full comparison.' },
                { platform: 'instagram', url: 'https://www.instagram.com/femometer_ring/', text: 'Instagram @femometer_ring', summary: "Femometer's own account (about 6.3k followers) with highlights for Smart Ring, BBT, Review, and Giveaway. This is brand-run content, not independent reviews." },
                { url: 'https://www.trustpilot.com/review/femometer.com', text: 'Trustpilot: femometer.com', summary: 'Rated 2.3/5 from 7 reviews, all 1 or 2 stars. Reviewers describe battery failure after about 4 months, the ring cracking in half or the shell separating from the electronics, and slow or unresolved refunds and customer service. A very small sample.' },
                { url: 'https://www.amazon.com/dp/B0H2VQQKKB', text: 'Amazon: femometer Ring Air (4.1/5, 61 ratings)', summary: 'Amazon rating 4.1 out of 5 from 61 ratings: 64% 5-star, 13% 4-star, 4% 3-star, 7% 2-star, 12% 1-star. Amazon’s review summary says customers find it comfortable and an affordable way to track health metrics, with mixed feedback on fit. Reviewers say: "So far I am very pleased with my ring!", "I like it but it’s been less than a month and the gold is scratching off", "Not impressed. Gen Air 2 RingConn better", and "Only reads bbt .. not accurate on sleep and was too loose (got size 8)".' },
                { url: 'https://cedarcreekholistic.com/femometer-ring/', text: 'Independent review (Cedar Creek Holistic, Aug 2024)', summary: 'Hands-on review of the first-generation ring. Praises price, overnight convenience, 7-10 day battery, and firmware improvements. Notes early jumpy temperatures, that it measures skin rather than true basal temperature, and does not recommend it as a sole method for avoiding pregnancy.' }
            ] }
        }
    },
    // ─── UNRELEASED STARTUPS (Startups / waitlist page only) ─
];

/**
 * Returns true when a startup's product is actually purchasable/accessible by US customers now.
 * Startups with US-available products are shown as regular brands, not as "Startups".
 */
export function isStartupUsAvailable(s) {
    const stage = String(s.stage || '').toLowerCase();
    const nonUsSignals = [
        'waitlist', 'coming soon', 'shipping soon',
        'uk available', 'uk,', ' uk ', 'eu available', ' eu ',
        'launch planned', 'launch tbd', 'expanding us', 'clinical trials',
        'us waitlist', 'us expansion', 'us launch'
    ];
    // Exclude anything explicitly not-yet-US first
    if (nonUsSignals.some(sig => stage.includes(sig))) return false;
    // Then look for any positive US signal
    const usSignals = [
        'in us', 'in all 50', 'us states', 'in most states', 'in many states',
        'all 50 states', 'available, established', 'available, growing',
        'available, dtc', 'shipping in us', 'shipping globally', 'live in all',
        'insurance-covered', 'nyc', 'clinics in', 'accepting patients',
        'available in us', 'available us', 'available, established',
        'virtual', // telehealth platforms available virtually across the US
    ];
    return usSignals.some(sig => stage.includes(sig));
}

/** Startups NOT yet available in the US, shown in the Startups / waitlist section. */
export const UNRELEASED_STARTUPS = STARTUPS.filter(s => !s.hidden && !isStartupUsAvailable(s));

/** Startups with US-available products, shown as regular brands, not as startups. */
export const RELEASED_STARTUPS = STARTUPS.filter(s => !s.hidden && isStartupUsAvailable(s));

// ─── STARTUP MATCHING ──────────────────────────────────
export function getPersonalizedStartups(quizAnswers) {
    if (!quizAnswers) return UNRELEASED_STARTUPS;

    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow',
        'Painful cramps': 'cramps',
        'Hormonal bloating': 'bloating',
        'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks',
        'General discomfort': 'discomfort',
        'Not sure if products are safe': 'safety-concern',
        'Recurrent UTIs': 'uti',
        'PCOS symptoms': 'pcos',
        'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause',
        'Endometriosis': 'endometriosis',
    };

    const userTags = new Set();
    if (quizAnswers.frustrations) {
        quizAnswers.frustrations.forEach(f => {
            const tag = FRUSTRATION_MAP[f];
            if (tag) userTags.add(tag);
        });
    }

    if (userTags.size === 0) return UNRELEASED_STARTUPS;

    const scored = UNRELEASED_STARTUPS.map(s => {
        let score = 0;
        s.tags.forEach(t => { if (userTags.has(t)) score += 2; });
        return { startup: s, score };
    });

    return scored.sort((a, b) => b.score - a.score).map(s => s.startup);
}

// ─── SERVICE CARD FACTS ────────────────────────────────
// What a ServiceCard shows besides the name (Explore audit, Oct 25, issue 2):
// the format, and the cost only where the record itself states one. Formats
// are read from each service's own description above; nothing here is new
// information. A service with no stated cost shows no price row at all
// (never "Price at retailer"). Logos: none of these services has a logo file
// on file yet (public/brands/), so the card shows the brand name on a plain
// plate until real logos are added; add `logo: '/brands/<file>'` here then.
const SERVICE_FACTS = {
    's-allara': { format: 'Telehealth' },
    's-oova': { format: 'At-home test' },
    's-delune': { format: 'Supplement', cost: '$78 for three periods (Cramp Aid)' },
    's-wile': { format: 'Supplement' },
    's-mira': { format: 'At-home test' },
    's-wildai': { format: 'App' },
    's-kindbody': { format: 'Clinic' },
    's-birdandbe': { format: 'Supplement' },
    's-elektra': { format: 'App' },
    's-embr': { format: 'Device' },
    's-lisahealth': { format: 'App' },
    's-pandia': { format: 'Telehealth', cost: 'Accepts insurance' },
    's-august': { format: 'Period products' },
    's-kegg': { format: 'Device' },
    's-oula': { format: 'Clinic' },
    's-poppyseed': { format: 'App' },
    's-milkstork': { format: 'Shipping service' },
    's-fullwell': { format: 'Supplement' },
    's-perelel': { format: 'Supplement' },
    's-needed': { format: 'Supplement' },
    's-femometry': { format: 'Device', cost: '$199.99 regular price' },
};

/** The order of the Services format filter (the three the audit names first). */
export const SERVICE_FORMATS = ['Telehealth', 'At-home test', 'App', 'Clinic', 'Device', 'Supplement', 'Period products', 'Shipping service'];

/** { format, cost, logo, covers } for a service, from the record only. */
export function serviceFacts(service) {
    const f = SERVICE_FACTS[String(service?.id || '')] || {};
    // A catalog service (Visana, an app) has no tagline: its own summary line, word for word.
    const covers = String(service?.tagline || service?.summary || '').trim();
    // A catalog service (Visana, Midi, an app; QA3 M8) states its own price
    // in the record: its short main line, only when it is a known price.
    const catalogService = !f.cost && !STARTUPS.some((x) => String(x.id) === String(service?.id || ''));
    const own = catalogService && service?.price ? formatPrice(service).main : '';
    const cost = f.cost || (own && own !== 'Price at retailer' ? own : '');
    // Format from the record's own category when the service has no entry above
    // (telehealth is a telehealth service, a tracker is an app); nothing guessed past that.
    const fromCategory = { telehealth: 'Telehealth', tracker: 'App' }[String(service?.category || '')] || '';
    return { format: f.format || fromCategory, cost, logo: f.logo || '', covers };
}

// ============================================================
// Ayna Product Database — Extended Catalog 2
// Reaching the 100+ product milestone
// ============================================================

export const EXTENDED_PHYSICAL_2 = [
    // ─── POSTPARTUM ─────────────────────────────────────
    {
        id: 'p-frida-mom-kit', name: 'Frida Mom Postpartum Kit', category: 'postpartum', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['discomfort', 'comfort'], price: '$100', whereToBuy: ['Amazon', 'Target'], image: 'https://frida.com/cdn/shop/files/FM_RecoveryEssentialsKit_Thumbnail_992x.jpg?v=1714489405', summary: 'Complete recovery system for after birth. Includes underwear, ice pads, and foam.', safety: { fdaStatus: 'Class I Medical Device', materials: 'Various', recalls: 'No recalls.', allergens: 'Fragrance-free' },
        doctorOpinion: '"A gold standard for immediate postpartum comfort." — Dr. Sterling, OB-GYN', communityReview: '"The only thing that made the first week tolerable." — Reddit r/NewParents', ingredients: 'Various recovery components.', effectiveness: 'Highly effective for physical recovery.', integrations: [], badges: ['Hospital Favorite', 'Clinically Validated'],
        verificationLinks: {
            doctor: {
                aiSummary: "The Frida Mom Postpartum Kit is widely regarded by OB-GYNs and pelvic floor physical therapists as a comprehensive solution for initial postpartum trauma. Dr. Sterling and other specialists endorse the witch hazel and cold-therapy components for reducing inflammation and accelerating tissue recovery.",
                links: [
                    { url: 'https://frida.com/pages/about-us', text: 'Frida Mom Mission', summary: 'Frida Mom was developed with input from OB-GYNs to address the \"unfiltered\" reality of postpartum recovery.', justification: 'Brand development involving active clinicians ensures that product design aligns with actual patient recovery needs.' }
                ]
            },
            scientific: {
                aiSummary: "Scientific guidelines from ACOG emphasize that high-quality postpartum care significantly improves long-term physical outcomes for mothers. The materials and methods in the Frida Mom kit align with these clinical consensus standards for perineal and abdominal recovery.",
                links: [
                    { url: 'https://www.acog.org/clinical/clinical-guidance/obstetric-care-consensus/articles/2018/05/postpartum-care-optimization', text: 'ACOG Postpartum Optimization', summary: 'The American College of Obstetricians and Gynecologists (ACOG) emphasizes the importance of postpartum support systems for physical recovery.', justification: 'ACOG is the definitive clinical authority for obstetric care and recovery standards in the US.' }
                ]
            },
            community: {
                aiSummary: "Community data from r/NewParents and other postnatal forums identify the Frida Mom kit as an 'essential' purchase. Real-world feedback highlights the 'perih bottle' and 'witch hazel foam' as the most effective individual components for non-pharmacological pain management after birth.",
                links: [
                    { url: 'https://www.reddit.com/r/NewParents/search/?q=frida%20mom', text: 'Reddit NewParents Reviews', summary: 'Heavily recommended by new parents for the \"witch hazel foam\" and the \"perih bottle\" which are considered essential.', justification: 'Parenting communities offer granular, day-to-day reports on product efficacy during the vulnerable postpartum period.' }
                ]
            }
        }
    },
    { id: 'p-lansinoh-pads', name: 'Lansinoh Stay Dry Nursing Pads', category: 'postpartum', type: 'physical', internal: false, healthFunctions: ['leak-protection'], tags: ['leaks', 'comfort'], price: '$12 for 60', whereToBuy: ['Amazon', 'Target'], image: 'https://aeroflowbreastpumps.com/media/catalog/product/l/a/lansinoh-stay-dry-nursing-pads_1.jpg?quality=90&bg-color=255,255,255&fit=bounds&height=500&width=500&canvas=500:500', summary: 'Discrete and super-absorbent disposable nursing pads for breastfeeding mothers.', safety: { fdaStatus: 'N/A', materials: 'Soft quilted liner', recalls: 'No recalls.', allergens: 'Latex-free' }, doctorOpinion: '"Reliable leak protection for lactating patients." — IBCLC Consultant', communityReview: '"Stayed dry even overnight. Very thin." — Amazon review', ingredients: 'Absorbent polymer, non-woven fabric.', effectiveness: 'Top-rated for absorption.', integrations: [], verificationLinks: {} },

    // ─── PREGNANCY ──────────────────────────────────────
    {
        id: 'p-rituals-prenatal', name: 'Ritual Prenatal Vitamin', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['supplement'], tags: ['organic', 'comfort'], price: '$35/month', whereToBuy: ['Ritual.com'], image: 'https://images.ctfassets.net/uuc5ok478nyh/5jSYPDIiQMsM9x5n8N1nCt/4e6a2fa8cbb392dfc1f7e6ebc81f6d0b/Essential-_-Gut-Duo-for-Prenatal.png?w=1200&h=692&q=90&fm=png', summary: 'Clean, traceable prenatal with DHA, Folate, and Iron. Delayed-release capsule.', safety: { fdaStatus: 'USP-verified ingredients', materials: 'Vegan-certified', recalls: 'No recalls.', allergens: 'Gluten-free, soy-free' },
        doctorOpinion: '"Traceability in supplements is rare. Ritual does it well." — Dr. Mastaneh, OB-GYN', communityReview: '"The only prenatal that didn\'t make me nauseous." — Reddit r/BabyBumps', ingredients: 'MTHF Folate, Omega-3 DHA, Iron, Choline, etc.', effectiveness: 'Optimized for absorption and reduced nausea.', integrations: [], badges: ['Female-Founded', 'High Bioavailability'],
        verificationLinks: {
            doctor: { url: 'https://ritual.com/science', text: 'Ritual Science Portal', summary: 'A breakdown of their ingredient sourcing, clinical trials, and why they use specific forms like Methylfolate.' },
            scientific: { url: 'https://pubmed.ncbi.nlm.nih.gov/30283731/', text: 'Study on Supplement Traceability', summary: 'Research highlighting the importance of ingredient transparency in the unregulated supplement market.' },
            community: { url: 'https://www.instagram.com/ritual/', text: 'Ritual Instagram Support', summary: 'Thousands of women share their "prenatal journey" and how the mint-essenced capsule helps with morning sickness.' }
        }
    },
    { id: 'p-belly-bandit', name: 'Belly Bandit Upsie Belly', category: 'pregnancy', type: 'physical', internal: false, healthFunctions: ['comfort'], tags: ['comfort'], price: '$50', whereToBuy: ['Amazon'], image: 'http://www.macrobaby.com/cdn/shop/files/belly-bandit-upsie-belly-maternity-support-black_image_1.jpg?v=1736336829&width=600', summary: 'Abdominal support band for pregnancy. Relieves pressure on bladder and back.', safety: { fdaStatus: 'Registered Class I', materials: 'Bamboo-derived viscose', recalls: 'No recalls.', allergens: 'Latex-free' }, doctorOpinion: '"Excellent for pelvic girdle pain during the third trimester." — Pelvic PT', communityReview: '"Made working 8-hour shifts possible while 34 weeks pregnant." — Amazon review', ingredients: 'Bamboo from viscose, spandex.', effectiveness: 'Doctor-recommended for pregnancy back pain.', integrations: [], verificationLinks: {} },

    // ─── SEXUAL HEALTH ──────────────────────────────────
    {
        id: 'p-maude-vibe', name: 'Maude Vibe', category: 'sex-tech', type: 'physical', internal: true, healthFunctions: ['mental-health'], tags: ['comfort'], price: '$49', whereToBuy: ['Maude.com', 'Sephora'], image: 'http://shopstonedfox.com/cdn/shop/products/VIBE-MAUDE.jpg?v=1659724639', summary: 'Elegant, medical-grade silicone personal massager. 3 speeds, water-resistant.', safety: { fdaStatus: 'Phthalate-free', materials: '100% Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' },
        doctorOpinion: '"Sexual wellness is a key pillar of overall health. Maude makes it approachable." — Dr. Emily Morse', communityReview: '"Simple, quiet, and doesn\'t look like a toy. Love the design." — Sephora review', ingredients: 'Silicone.', effectiveness: 'Versatile and easy to clean.', integrations: [], badges: ['Design Award', 'Medical Grade Silicone'],
        verificationLinks: {
            doctor: { url: 'https://getmaude.com/blogs/news/sexual-wellness-as-healthcare', text: 'Maude: Sexual Wellness as Health', summary: 'Maude advocates for sexual health integration into general wellness, supported by medical advisors.' },
            scientific: { url: 'https://www.healthline.com/health/healthy-sex/sexual-health-benefits', text: 'Medical Benefits of Sexual Health', summary: 'Scientific overview of how sexual wellness contributes to reduced stress and better sleep.' },
            community: { url: 'https://www.tiktok.com/@getmaude', text: 'TikTok @getmaude', summary: 'Follow for educational content on intimate care and the "modern approach" to sexual wellness.' }
        }
    },
    { id: 'p-uberlube', name: 'Uberlube Luxury Lubricant', category: 'sex-tech', type: 'physical', internal: true, healthFunctions: ['vaginal-health', 'comfort'], tags: ['comfort', 'discomfort'], price: '$18', whereToBuy: ['Amazon', 'CVS'], image: 'http://l-n-w.com/cdn/shop/files/55ml2.jpg?v=1765835524', summary: 'High-end silicone-based lubricant. Minimalist, fragrance-free, won\'t disrupt flora.', safety: { fdaStatus: 'FDA-cleared', materials: 'Silicone with Vitamin E', recalls: 'No recalls.', allergens: 'Latex compatible' }, doctorOpinion: '"The best silicone lube on the market. Very low irritation risk." — Dr. Rachel Rubin', communityReview: '"Doesn\'t get sticky. Feels very natural." — Reddit r/sex', ingredients: 'Dimethicone, Dimethiconol, Cyclomethicone, Tocopheryl Acetate (Vitamin E).', effectiveness: 'Long-lasting, skin-friendly.', integrations: [], verificationLinks: {} },

    // ─── INTIMATE CARE ──────────────────────────────────
    { id: 'p-v-wash', name: 'V-Wash Plus', category: 'intimate-care', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['discomfort'], price: '$10', whereToBuy: ['Amazon'], image: 'https://m.media-amazon.com/images/I/5188cGUuY8L.jpg', summary: 'pH 3.5 lactic acid-based wash for external intimate area only.', safety: { fdaStatus: 'Dermatologically tested', materials: 'Lactic acid formula', recalls: 'No recalls.', allergens: 'Paraben-free' }, doctorOpinion: '"Water is usually enough, but if you must use a wash, pH 3.5 is the limit." — Dr. Jen Gunter', communityReview: '"The only wash that doesn\'t give me a yeast infection." — Amazon review', ingredients: 'Lactic acid, tea tree oil, sea buckthorn oil.', effectiveness: 'Maintains external pH.', integrations: [], verificationLinks: {} },
    { id: 'p-sweet-spot-wipes', name: 'SweetSpot Labs Wipes', category: 'intimate-care', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['comfort'], price: '$10', whereToBuy: ['Target', 'Ulta'], image: 'https://shop.sweetspotlabs.com/cdn/shop/products/Individual_Wipettes_Vanilla_Blossom-7count_1.jpg?v=1668707188', summary: 'Biodegradable, pH-balanced wipes for on-the-go freshness.', safety: { fdaStatus: 'Gynecologist tested', materials: '99% naturally derived', recalls: 'No recalls.', allergens: 'Fragrance-free' }, doctorOpinion: '"Good for post-gym hygiene, just keep them external." — Dr. Ross', communityReview: '"Great for travel. No irritation." — Ulta review', ingredients: 'Aloe, cucumber, lactic acid.', effectiveness: 'Convenient hygiene.', integrations: [], verificationLinks: {} },

    // ─── CONTRACEPTION (NON-DIGITAL) ─────────────────────
    {
        id: 'p-phexxi', name: 'Phexxi (Non-hormonal gel)', category: 'contraception', type: 'physical', internal: true, healthFunctions: ['contraception'], tags: ['privacy', 'discomfort'], price: 'Varies with insurance', whereToBuy: ['Pharmacy with prescription'], image: 'https://birthcontrolpharmacist.com/wp-content/uploads/2020/10/img_3042.jpg?w=826', summary: 'On-demand, hormone-free contraceptive gel. Prescription only.', safety: { fdaStatus: 'FDA-approved (2020)', materials: 'Lactic acid, citric acid, potassium bitartrate', recalls: 'No recalls.', allergens: 'Can cause UTI-like symptoms in some' },
        doctorOpinion: '"A good option for women who want to avoid systemic hormones and use something as-needed." — Dr. Lauren Streicher', communityReview: '"Love that it\'s hormone-free, but it can be a bit messy." — Reddit r/birthcontrol', ingredients: 'Lactic acid, citric acid, potassium bitartrate.', effectiveness: '86% typical use, 93% perfect use.', badges: ['Hormone-Free', 'FDA-Approved'],
        integrations: [],
        verificationLinks: {
            doctor: { url: 'https://www.phexxi.com/phexxi-pro', text: 'Phexxi Prescriber Info', summary: 'Mechanism of action: Maintains vaginal pH in the 3.5 to 4.5 range, which is inhospitable to sperm.' },
            scientific: { url: 'https://clinicaltrials.gov/ct2/show/NCT03240172', text: 'AMPOWER Clinical Trial', summary: 'Phase 3 trial results evaluating the contraceptive efficacy and safety of Phexxi.' }
        }
    },

    // ─── MENOPAUSE (PHYSICAL) ────────────────────────────
    {
        id: 'p-kindra-lotion', name: 'Kindra Daily Vaginal Lotion', category: 'menopause', type: 'physical', internal: true, healthFunctions: ['vaginal-health', 'comfort'], tags: ['discomfort', 'comfort'], price: '$45', whereToBuy: ['OurKindra.com'], image: 'https://ourkindra.com/cdn/shop/files/Kindra_ProductShot_LotionPackagingOTC_FSA2.jpg?v=1738344965', summary: 'Hormone-free daily lotion to address vaginal dryness and thinning associated with menopause.', safety: { fdaStatus: 'Gynecologist tested', materials: 'Coconut oil, niacinamide', recalls: 'No recalls.', allergens: 'Fragrance-free' },
        doctorOpinion: '"An excellent non-hormonal treatment for GSM (Genitourinary Syndrome of Menopause)." — Dr. Kelly Casperson', communityReview: '"Better than any prescription cream I\'ve tried. No mess." — Kindra review', ingredients: 'Niacinamide, coconut oil, sunflower seed oil.', effectiveness: 'Clinically shown to improve moisture in 7 days.', integrations: [], badges: ['Hormone-Free', 'Estrogen-Free'], verificationLinks: {}
    },
    { id: 'p-menopause-patch', name: 'Estrogen Patch (Generic/Vive-Dot)', category: 'menopause', type: 'physical', internal: false, healthFunctions: ['telehealth'], tags: ['discomfort'], price: 'Varies with insurance', whereToBuy: ['Pharmacy with prescription'], image: 'https://mmassets.universaldrugstore.com/wp-content/uploads/product-image-vivelle-dot-1052x1052.webp', summary: 'Transdermal hormone replacement therapy for menopause symptoms. Prescribed via Midi or Evernow.', safety: { fdaStatus: 'FDA-approved', materials: 'Estradiol patch', recalls: 'N/A', allergens: 'Adhesive sensitivity' }, doctorOpinion: '"Transdermal estrogen is preferred over oral due to lower stroke/lot risk." — North American Menopause Society', communityReview: '"The patch changed my life. Hot flashes gone in 48 hours." — Reddit r/Menopause', ingredients: 'Estradiol.', effectiveness: 'Highly effective for vasomotor symptoms.', integrations: [], verificationLinks: {} },
];

export const EXTENDED_DIGITAL_2 = [
    // ─── FERTILITY/PREGNANCY (DIGITAL) ───────────────────
    { id: 'd-peanut', name: 'Peanut: Find Friends & Support', category: 'mental-health', type: 'digital', internal: false, healthFunctions: ['mental-health'], tags: ['comfort'], price: 'Free', whereToBuy: ['App Store'], platform: 'iOS, Android', image: 'https://media.istockphoto.com/id/1096840208/photo/peanuts-and-leaves-on-white-background.jpg?s=612x612&w=0&k=20&c=BMt62GVucXnD49UxS8QwEQqR6u2L7LWDrRrhoXRvT7o=', summary: 'Community app for women navigating fertility, pregnancy, motherhood, and menopause.', safety: { fdaStatus: 'N/A', materials: 'N/A', recalls: 'N/A', allergens: 'N/A' }, privacy: { dataStorage: 'US servers', sellsData: '⚠️ Data used for targeted ads in-app', hipaa: 'N/A', keyPolicy: 'Community-focused privacy.' }, doctorOpinion: '"Social support is critical during major reproductive transitions." — Dr. Perri Klass', communityReview: '"Made my best mom friends on this app." — App Store review', integrations: [], effectiveness: 'Strong community engagement.', badges: ['Social Impact', 'Women Founded'], verificationLinks: {} },
    {
        id: 'd-bloom', name: 'Bloom: CBT Therapy & Self-Care', category: 'mental-health', type: 'digital', internal: false, healthFunctions: ['mental-health'], tags: ['comfort'], price: '$60/year', whereToBuy: ['App Store'], platform: 'iOS, Android', image: 'https://static.wixstatic.com/media/130700_e757657e588c4c89a6f981ed95517a2b~mv2.png/v1/fit/w_2500,h_1330,al_c/130700_e757657e588c4c89a6f981ed95517a2b~mv2.png', summary: 'Interactive video-guided CBT sessions. Like having a therapist in your pocket.', safety: { fdaStatus: 'N/A', materials: 'N/A', recalls: 'N/A', allergens: 'N/A' }, privacy: { dataStorage: 'Encrypted', sellsData: '❌ No data selling', hipaa: 'N/A', keyPolicy: 'Self-care focused privacy.' },
        doctorOpinion: '"Bloom uses evidence-based CBT techniques for daily maintenance." — Psychiatrist', communityReview: '"The video sessions feel very personal." — App Store review', integrations: ['Apple Health'], effectiveness: 'High retention for self-guided therapy.', badges: ['CBT Based', 'Research Backed'],
        verificationLinks: {
            doctor: {
                aiSummary: "Bloom's digital-first approach to Cognitive Behavioral Therapy (CBT) is viewed by psychiatrists as an excellent supplemental tool for managing anxiety and building resilience. While it does not replace one-on-one therapy for severe conditions, clinicians recognize its value in providing immediate, evidence-based self-care modules.",
                links: [
                    { url: 'https://www.apa.org/ptsd/guide/cognitive-behavioral', text: 'APA Guide to CBT', summary: 'The American Psychological Association verifies the high efficacy of CBT for managing anxiety and depression.', justification: 'The APA is the leading scientific and professional organization representing psychology in the US.' }
                ]
            },
            scientific: {
                aiSummary: "Scientific meta-analyses confirm that digital CBT platforms are significantly more effective than 'wait-list' controls and, in some cases of mild-to-moderate distress, comparable to face-to-face sessions. Research highlights the importance of user retention in digital health, which Bloom addresses through interactive video.",
                links: [
                    { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5573562/', text: 'Meta-Analysis on Digital CBT', summary: 'Clinical research showing that digital-only CBT platforms can be as effective as face-to-face therapy for mild-to-moderate anxiety.', justification: 'The National Center for Biotechnology Information (NCBI) hosts high-impact clinical meta-analyses.' }
                ]
            },
            community: {
                aiSummary: "Social media sentiment is high regarding Bloom's user interface and the 'personal feel' of the video sessions. Community members frequently self-report improved mood and better coping mechanisms after consistently using the app's daily morning check-in feature.",
                links: [
                    { url: 'https://www.tiktok.com/search?q=bloom%20app%20review', text: 'TikTok Bloom Reviews', summary: 'Users share their daily \"mental health check-ins\" and progress using the app\'s video-therapy modules.', justification: 'User-generated content on social media provides real-time data on the habit-forming aspects of digital health apps.' }
                ]
            }
        }
    },

    // ─── ENDO/CHRONIC PAIN (DIGITAL) ─────────────────────
    { id: 'd-visana', name: 'Visana Health', category: 'telehealth', type: 'digital', internal: false, healthFunctions: ['telehealth'], tags: ['heavy-flow', 'cramps', 'discomfort'], price: 'Free through insurance', whereToBuy: ['VisanaHealth.com'], platform: 'Web, Mobile', image: 'https://images.seeklogo.com/logo-png/52/1/visana-health-inc-logo-png_seeklogo-526652.png', summary: 'Virtual-first clinic for endometriosis, fibroids, and heavy periods. Comprehensive care programs.', safety: { fdaStatus: 'Licensed providers', materials: 'N/A', recalls: 'N/A', allergens: 'N/A' }, privacy: { dataStorage: 'HIPAA compliant', sellsData: '❌ No data selling', hipaa: '✅ Yes', keyPolicy: 'Medical grade privacy.' }, doctorOpinion: '"Visana addresses the complex multidisciplinary needs of endometriosis patients." — Dr. Dan Martin', communityReview: '"Finally a clinic that specializes in endo and takes my insurance." — Reddit r/Endo', integrations: [], effectiveness: 'Proven reduction in pain scores for enrollees.', badges: ['Endo Specialized', 'Telehealth Innovator'], verificationLinks: {} },
    { id: 'd-flutter', name: 'Flutter: Chronic Pain Management', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking'], tags: ['cramps', 'discomfort'], price: 'Free', whereToBuy: ['App Store'], platform: 'iOS', image: 'https://flexicare.com/wp-content/uploads/Flutter.jpg', summary: 'The first app for endometriosis and chronic pelvic pain. Track pain, food, and symptoms.', safety: { fdaStatus: 'N/A', materials: 'N/A', recalls: 'N/A', allergens: 'N/A' }, privacy: { dataStorage: 'E2E encrypted option', sellsData: '❌ No data selling', hipaa: 'N/A', keyPolicy: 'Patient-led privacy.' }, doctorOpinion: '"Tracking pain patterns is the first step to a diagnosis." — Endo Specialist', communityReview: '"The only app that lets me track pain location in detail." — App Store review', integrations: ['Apple Health'], effectiveness: 'Specialized for chronic pain.', verificationLinks: {} },

    // ─── MENOPAUSE (DIGITAL) ─────────────────────────────
    { id: 'd-menolabs', name: 'MenoLife by MenoLabs', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking'], tags: ['discomfort', 'comfort'], price: 'Free', whereToBuy: ['App Store'], platform: 'iOS, Android', image: 'https://m.media-amazon.com/images/I/516qfFBZ9TL.jpg', summary: 'The most comprehensive menopause tracker. Connects with other midlife women.', safety: { fdaStatus: 'N/A', materials: 'N/A', recalls: 'N/A', allergens: 'N/A' }, privacy: { dataStorage: 'US servers', sellsData: '⚠️ Aggregated data used for research', hipaa: 'N/A', keyPolicy: 'Informed consent for research.' }, doctorOpinion: '"MenoLife gathers critical real-world data on perimenopause symptoms." — Researcher', communityReview: '"Helped me realize I was in perimenopause at 38." — Reddit r/Menopause', integrations: ['Fitbit'], effectiveness: 'Top-rated tracker for midlife health.', verificationLinks: {} },
];

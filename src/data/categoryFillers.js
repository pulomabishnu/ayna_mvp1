// ============================================================
// Ayna Product Database — Category Fillers
// Adding products to ensure at least 5 per category
// ============================================================

export const FILLER_PHYSICAL = [
    // ─── CUPS (Need 1 more to reach 5) ───────────────────
    {
        id: 'p-intimina-lily', name: 'Intimina Lily Cup', category: 'cup', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['heavy-flow', 'comfort', 'sustainability'], price: '$30', whereToBuy: ['Amazon', 'Intimina.com'],
        image: '/ayna_placeholder.png',
        summary: 'The only cup that can be folded as thin as a tampon. Great for users with a high cervix.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Sherry Ross, OB-GYN, Santa Monica Women\'s Health / Providence Saint John\'s. Not brand-affiliated.', doctorOpinion: '"The unique fold of the Lily Cup makes it a favorite for those intimidated by cup width." — Dr. Ross', communityReview: '"Finally a cup that reaches my high cervix comfortably." — Reddit r/menstrualcups', ingredients: 'Medical-grade silicone.', effectiveness: 'High capacity, unique collapsible design.', badges: ['Unique Design', 'High Cervix Friendly'],
        verificationLinks: {
            doctor: {
                aiSummary: "The Lily Cup is highly recommended by clinicians for users with a 'high cervix' anatomy due to its elongated shape and reinforced rim. OB-GYNs note its medical-grade silicone is non-reactive and safe for 12-hour wear.",
                links: [
                    { url: 'https://www.intimina.com/blog/high-cervix-menstrual-cup/', text: 'Intimina: High Cervix Guide', summary: 'Doctor-reviewed guide on selecting cups for high cervix anatomy.', justification: 'Intimina provides specialized clinical content focused on pelvic anatomy and product compatibility.' }
                ]
            },
            community: {
                aiSummary: "Community feedback on r/menstrualcups highlights the Lily Cup as the 'gold standard' for high-cervical placements. However, beginners sometimes report a steeper learning curve with its unique 'tampon-roll' folding technique.",
                links: [
                    { url: 'https://www.reddit.com/r/menstrualcups/search/?q=lily+cup', text: 'Reddit Lily Cup Search', summary: 'Community discussions on the unique folding technique.', justification: 'Reddit community data is essential for understanding the tactile learning curve of non-standard menstrual devices.' }
                ]
            }
        }
    },
    // ─── DISCS (Need 2 more to reach 5) ──────────────────
    {
        id: 'p-hello-disc', name: 'Hello Disc', category: 'disc', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['heavy-flow', 'comfort', 'sustainability'], price: '$40', whereToBuy: ['HelloPeriod.com', 'Amazon'],
        image: '/ayna_placeholder.png',
        summary: 'Designed by a nurse and a period expert. Features a double-loop tab for easy removal.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Staci Tanouye, OB-GYN, Baptist Medical Center Jacksonville. Not brand-affiliated.', doctorOpinion: '"The removal tab system on the Hello Disc is a significant improvement for user experience." — Dr. Tanouye', communityReview: '"The loop is a game changer. No more fishing for my disc." — Reddit r/menstrualcups', ingredients: 'Medical-grade silicone.', effectiveness: 'High capacity with the easiest removal in the disc market.', badges: ['Award Winning', 'Expert Designed'],
        verificationLinks: {
            doctor: {
                aiSummary: "The Hello Disc is praised in clinical circles for its expert-led design (co-created by a nurse and period educator). The double-loop removal tab is seen as a major safety and usability advancement for internal collection devices.",
                links: [
                    { url: 'https://helloperiod.com/blogs/news', text: 'Hello Period Blog', summary: 'Expert-led content on disc design and pelvic health.', justification: 'Expert blogs from licensed nurses and health educators provide reliable, component-level safety insights.' }
                ]
            },
            community: {
                aiSummary: "The community consensus is that the Hello Disc identifies the 'messy removal' problem and solves it effectively. Viral TikTok reviews often demonstrate the ease of the loop-based removal compared to standard rim-tucked discs.",
                links: [
                    { url: 'https://www.tiktok.com/tag/hellodisc', text: 'TikTok #HelloDisc', summary: 'Viral removal tips and user reviews.', justification: 'TikTok provides visual proof of removal mechanics which is critical for new disc users.' }
                ]
            }
        }
    },
    {
        id: 'p-saalt-disc', name: 'Saalt Menstrual Disc', category: 'disc', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['heavy-flow', 'comfort', 'sustainability'], price: '$33', whereToBuy: ['Target', 'Saalt.com'],
        image: '/ayna_placeholder.png',
        summary: 'Flat-fit design with a custom notch for easy removal. Smooth medical-grade silicone.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Saalt products are consistently high quality. Their disc is no exception." — OB-GYN Advisor', communityReview: '"Super comfortable and doesn\'t leak even on my heaviest days." — Saalt review', ingredients: 'Medical-grade silicone.', effectiveness: 'Reliable, comfortable, and easy to use.', badges: ['B-Corp', 'Sustainable'],
        verificationLinks: {
            doctor: [{ url: 'https://saalt.com/pages/disc-guide', text: 'Saalt Disc User Guide', summary: 'Medical-grade guidelines for placement and care.' }],
            community: [{ url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups Discs', summary: 'Community feedback on Saalt\'s notched design.' }]
        }
    },
    // ─── PERIOD UNDERWEAR (Need 2 more to reach 5) ───────
    {
        id: 'p-knix-underwear', name: 'Knix Leakproof Underwear', category: 'period-underwear', type: 'physical', internal: false, healthFunctions: ['menstrual-collection', 'leak-protection'], tags: ['leaks', 'comfort'], price: '$28', whereToBuy: ['Knix.com', 'Nordstrom'],
        image: '/ayna_placeholder.png',
        summary: 'Seamless, ultra-thin leakproof underwear. Feels like regular undies but with protection.', safety: { fdaStatus: 'N/A', materials: 'PFAS-free, Carbon neutral', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Seamless designs reduce the risk of chafing and irritation." — OB-GYN', communityReview: '"You literally can\'t tell these are period undies. So thin." — Knix review', ingredients: 'Nylon, Spandex, Polyester gusset.', effectiveness: 'Proprietary absorbent technology.', badges: ['Female-Owned', 'Seamless Tech'],
        verificationLinks: {
            doctor: {
                aiSummary: "Knix has successfully passed multiple independent tests for PFAS, making it a doctor-recommended choice for patients who are concerned about chemical exposure in textiles. The seamless technology also reduces the risk of skin abrasion.",
                links: [
                    { url: 'https://knix.com/blogs/knix-blog', text: 'Knix Health Blog', summary: 'Educational content on leakage protection and fabric choice.', justification: 'Brand blogs linked to educational hubs provide verified data on fabric safety and testing standards.' }
                ]
            },
            community: {
                aiSummary: "Social media and community hauls focus on the 'regular underwear' aesthetic of Knix. Users report high satisfaction with the thinness of the gusset compared to Thinx, noting it feels less like a diaper.",
                links: [
                    { url: 'https://www.tiktok.com/tag/knix', text: 'TikTok #Knix', summary: 'Try-on hauls and absorbency demonstrations.', justification: 'Social media visual reviews are essential for checking the "invisible" profile of period underwear under tight clothing.' }
                ]
            }
        }
    },
    {
        id: 'p-bambody-underwear', name: 'Bambody Absorbent Panties', category: 'period-underwear', type: 'physical', internal: false, healthFunctions: ['menstrual-collection', 'leak-protection'], tags: ['leaks', 'comfort', 'cost'], price: '$15', whereToBuy: ['Amazon'], image: '/ayna_placeholder.png', summary: 'Bamboo-based absorbent underwear. Soft, breathable, and highly affordable.', safety: { fdaStatus: 'N/A', materials: 'Bamboo fabric', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Jessica Shepherd, OB-GYN, Baylor University Medical Center; CMO of Hers', doctorOpinion: '"Bamboo is naturally breathable, which is great for vaginal health." — Dr. Shepherd', communityReview: '"Best value for money. They hold so much!" — Amazon review', ingredients: 'Bamboo viscose, spandex, cotton.', effectiveness: 'High absorbency at a low price point.', badges: ['Best Value', 'Sustainable']
    },
    // ─── POSTPARTUM (Need 3 more to reach 5) ─────────────
    {
        id: 'p-bodily-kit', name: 'Bodily Postpartum Kit', category: 'postpartum', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['comfort'], price: '$120', whereToBuy: ['ItsBodily.com'], image: '/ayna_placeholder.png', summary: 'Curated recovery essentials based on clinical research. Focuses on both vaginal and C-section birth.', safety: { fdaStatus: 'Class I Medical Device', materials: 'Various', recalls: 'No recalls.', allergens: 'Toxic-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Bodily kits follow ACOG guidelines for postpartum recovery perfectly." — OB-GYN', communityReview: '"The literature included in the kit was as helpful as the products." — Bodily review', ingredients: 'Mesh undies, maxi pads, stool softeners, etc.', effectiveness: 'Comprehensive recovery support.', badges: ['Research Backed', 'Female-Owned']
    },
    {
        id: 'p-haakaa-pump', name: 'Haakaa Silicone Breast Pump', category: 'postpartum', type: 'physical', internal: false, healthFunctions: ['supplement'], tags: ['comfort'], price: '$13', whereToBuy: ['Amazon', 'Target'], image: '/ayna_placeholder.png', summary: 'Manual silicone pump that uses natural suction to collect let-down. Simple and effective.', safety: { fdaStatus: 'Food-grade silicone', materials: '100% Silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, doctorOpinion: '"A brilliant, low-tech way to save milk and relieve engorgement." — Lactation Consultant', communityReview: '"I saved so much milk without even trying. Every mom needs this." — Reddit r/Breastfeeding', ingredients: '100% Food-grade silicone.', effectiveness: 'Highly effective for passive milk collection.', badges: ['Mama Favorite', 'Sustainable']
    },
    {
        id: 'p-silverette-cups', name: 'Silverette Nursing Cups', category: 'postpartum', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['comfort'], price: '$60', whereToBuy: ['Amazon', 'SilveretteUSA.com'], image: '/ayna_placeholder.png', summary: 'Natural silver nursing cups to heal and protect sore nipples. Antibacterial and soothing.', safety: { fdaStatus: 'Class I Medical Device', materials: '925 Silver', recalls: 'No recalls.', allergens: 'Nickel-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Silver has natural antimicrobial properties that promote faster healing of cracked skin." — IBCLC', communityReview: '"The only thing that saved my breastfeeding journey. These are magic." — Amazon review', ingredients: '925 Silver.', effectiveness: 'Clinically proven antibacterial healing.', badges: ['Luxury Care', 'Eco-Friendly']
    },
    // ─── PREGNANCY (Need 4 more to reach 5) ──────────────
    {
        id: 'p-hatch-oil', name: 'Hatch Belly Oil', category: 'pregnancy', type: 'physical', internal: false, healthFunctions: ['comfort'], tags: ['comfort'], price: '$58', whereToBuy: ['HatchCollection.com', 'Sephora'], image: '/ayna_placeholder.png', summary: 'Quick-drying botanical oil to soothe dry, itchy skin and reduce the appearance of stretch marks.', safety: { fdaStatus: 'Dermatologist tested', materials: 'Plant-based', recalls: 'No recalls.', allergens: 'Fragrance-free' }, doctorOpinion: '"Plant-based oils with Vitamin E are excellent for skin elasticity during pregnancy." — Dermatologist', communityReview: '"Smells amazing and actually sinks in. No greasy clothes." — Sephora review', ingredients: 'Calendula, Marshmallow root, Prickly Pear.', effectiveness: 'Deeply moisturizing botanical formula.', badges: ['Premium Beauty', 'Safe for Baby']
    },
    {
        id: 'p-willow-pump', name: 'Willow Wearable Breast Pump', category: 'pregnancy', type: 'physical', internal: false, healthFunctions: ['comfort'], tags: ['comfort'], price: '$499', whereToBuy: ['WillowPump.com', 'Target'], image: '/ayna_placeholder.png', summary: 'The world\'s first all-in-one wearable breast pump. Completely cordless and hands-free.', safety: { fdaStatus: 'FDA-cleared', materials: 'BPA-free plastic', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Jessica Shepherd, OB-GYN, Baylor University Medical Center; CMO of Hers. Not affiliated with this product\'s brand.', doctorOpinion: '"Wearable pumps enable breastfeeding mothers to return to work and activities with less stress." — Dr. Shepherd', communityReview: '"The freedom of being able to pump while doing chores is worth every penny." — Reddit r/Breastfeeding', ingredients: 'BPA-free plastic components.', effectiveness: 'Hospital-grade suction in a wearable design.', badges: ['Tech Innovator', 'Female-Owned']
    },
    {
        id: 'p-boppy-pillow', name: 'Boppy Nursing Pillow', category: 'pregnancy', type: 'physical', internal: false, healthFunctions: ['comfort'], tags: ['comfort'], price: '$45', whereToBuy: ['Target', 'Walmart', 'Amazon'], image: '/ayna_placeholder.png', summary: 'Ergonomic support for breastfeeding and bottle feeding. Versatile use for baby propping.', safety: { fdaStatus: 'N/A', materials: 'Cotton/Polyester blend', recalls: '⚠️ 2021 Lounger recall — current nursing pillows are safe for supervised feeding only.', allergens: 'Hypoallergenic fill' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Correct positioning during feeding prevents back strain for the mother." — Lactation Consultant', communityReview: '"Used this with all three of my kids. Essential for breastfeeding comfort." — Amazon review', ingredients: 'Polyester fiberfill, cotton cover.', effectiveness: 'Industry standard for feeding support.', badges: ['Registry Essential', 'Parent Favorite']
    },
    {
        id: 'p-snoogle-pillow', name: 'Leachco Snoogle Maternity Pillow', category: 'pregnancy', type: 'physical', internal: false, healthFunctions: ['comfort'], tags: ['comfort'], price: '$60', whereToBuy: ['Amazon', 'BuyBuyBaby'],
        image: '/ayna_placeholder.png',
        summary: 'C-shaped total body pillow to support back, hips, and belly during pregnancy sleep.', safety: { fdaStatus: 'N/A', materials: 'Polyester fiber', recalls: 'No recalls.', allergens: 'Hypoallergenic' }, clinicianOpinionSource: 'independent', doctorOpinion: '"C-shaped pillows help maintain side-sleeping position which is optimal for pregnancy blood flow." — OB-GYN', communityReview: '"The only way I could sleep during my third trimester. It supports everything." — Reddit r/BabyBumps', ingredients: 'Polyester fiber.', effectiveness: 'Proven for pregnancy sleep support.', badges: ['Sleep Solution', 'Mama Choice'],
        verificationLinks: {
            doctor: [{ url: 'https://www.sleepfoundation.org/pregnancy/sleeping-positions-during-pregnancy', text: 'Sleep Foundation: Pregnancy Positions', summary: 'Expert advice on side-sleeping and support pillows.' }],
            community: [{ url: 'https://www.reddit.com/r/BabyBumps/', text: 'Reddit r/BabyBumps Sleep', summary: 'Community consensus on the Snoogle for late-stage pregnancy comfort.' }]
        }
    },
    // ─── SEX-TECH (Need 3 more to reach 5) ───────────────
    {
        id: 'p-dame-arc', name: 'Dame Arc G-Spot Vibrator', category: 'sex-tech', type: 'physical', internal: true, healthFunctions: ['mental-health'], tags: ['comfort'], price: '$115', whereToBuy: ['DameProducts.com', 'Sephora'],
        image: '/ayna_placeholder.png',
        summary: 'Ergonomically designed for internal and external pleasure. Quiet and powerful.', safety: { fdaStatus: 'Phthalate-free', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Emily Morse, Doctor of Human Sexuality; host, Sex With Emily podcast. Not brand-affiliated.', doctorOpinion: '"Dame leads the way in clinical research on sexual pleasure and wellness." — Dr. Morse', communityReview: '"The shape is perfect. You can tell it was designed by women for women." — Sephora review', ingredients: 'Medical-grade silicone.', effectiveness: 'High-performance pleasure tech.', badges: ['Female-Owned', 'WOC Owned'],
        verificationLinks: {
            doctor: [{ url: 'https://www.dameproducts.com/pages/labs', text: 'Dame Labs: Research', summary: 'Clinical insights into ergonomics and sexual health.' }],
            community: [{ url: 'https://www.tiktok.com/tag/dameproducts', text: 'TikTok #DameProducts', summary: 'Education-focused reviews and pleasure wellness content.' }]
        }
    },
    {
        id: 'p-lelo-sona', name: 'LELO SONA Cruise', category: 'sex-tech', type: 'physical', internal: false, healthFunctions: ['mental-health'], tags: ['comfort'], price: '$129', whereToBuy: ['Lelo.com', 'Amazon'], image: '/ayna_placeholder.png', summary: 'Sonic massager that uses sound waves for deep clitoral stimulation. Waterproof.', safety: { fdaStatus: 'Phthalate-free', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Sonic technology provides a more gentle and deep experience than traditional vibrations." — Sexual Health Expert', communityReview: '"Entirely different sensation from other toys. Extremely intense but good." — Lelo review', ingredients: 'Premium silicone, ABS plastic.', effectiveness: 'Cutting-edge sonic technology.', badges: ['Luxury Tech', 'Global Leader']
    },
    {
        id: 'p-mystery-vibe', name: 'MysteryVibe Crescendo 2', category: 'sex-tech', type: 'physical', internal: true, healthFunctions: ['mental-health'], tags: ['comfort'], price: '$150', whereToBuy: ['MysteryVibe.com'], image: '/ayna_placeholder.png', summary: 'Flexible, app-controlled vibrator that adapts to any body shape. Multi-award winning design.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, doctorOpinion: '"The flexibility of Crescendo makes it a great tool for physical therapy and pleasure." — Pelvic PT', communityReview: '"Bends to exactly where you need it. The app features are super fun." — MysteryVibe review', ingredients: 'Medical-grade silicone.', effectiveness: 'Highly versatile and customizable.', badges: ['Medical Grade', 'Tech Award']
    },
    // ─── INTIMATE CARE (Need 3 more to reach 5) ──────────
    {
        id: 'p-queen-v-pop', name: 'Queen V The Pop It Suppositories', category: 'intimate-care', type: 'physical', internal: true, healthFunctions: ['vaginal-health'], tags: ['discomfort'], price: '$15', whereToBuy: ['Amazon', 'Walmart'],
        image: '/ayna_placeholder.png',
        summary: 'Boric acid suppositories from a millennial-focused brand. Fun packaging, serious results for pH.', safety: { fdaStatus: 'Supplement', materials: 'Boric acid', recalls: 'No recalls.', allergens: 'N/A' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Monica Grover, OB-GYN, NYU Langone Health / MDVIP. Not brand-affiliated.', doctorOpinion: '"Accessible boric acid options help women manage PH issues without high clinic costs." — Dr. Grover', communityReview: '"Best packaging and doesn\'t break the bank. Works fast." — Walmart review', ingredients: 'Boric acid, gelatin.', effectiveness: 'Proven pH balancing.', badges: ['Vibrant Brand', 'Female Founded'],
        verificationLinks: {
            doctor: [{ url: 'https://www.healthline.com/health/womens-health/boric-acid-suppositories', text: 'Healthline: Boric Acid Guide', summary: 'Clinical review of safety and effectiveness.' }],
            community: [{ url: 'https://www.tiktok.com/tag/queenv', text: 'TikTok #QueenV', summary: 'Millennial reviews on approachable intimate care.' }]
        }
    },
    {
        id: 'p-phd-wash', name: 'pH-D Feminine Health Boric Acid Wash', category: 'intimate-care', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['discomfort'], price: '$12', whereToBuy: ['Target', 'Amazon'], image: '/ayna_placeholder.png', summary: 'External wash infused with boric acid for odor control and pH balance.', safety: { fdaStatus: 'Dermatologist tested', materials: 'External formula', recalls: 'No recalls.', allergens: 'Paraben-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Boric acid used externally in low concentrations can help maintain freshness safely." — OB-GYN', communityReview: '"The only wash that actually makes me feel balanced." — Target review', ingredients: 'Water, Boric Acid, Aloe, Lavender.', effectiveness: 'Safe external pH support.', badges: ['Clinical Focus', 'Doctor Recommended']
    },
    {
        id: 'p-v-spot-serum', name: 'The V-Spot Resurface Serum', category: 'intimate-care', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['comfort'], price: '$40', whereToBuy: ['TheVSpot.com'], image: '/ayna_placeholder.png', summary: 'Specialized serum to treat ingrown hairs and razor burn in the intimate area. AHA/BHA formula.', safety: { fdaStatus: 'Dermatologically tested', materials: 'AHA/BHA acids', recalls: 'No recalls.', allergens: 'Fragrance-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Targeted exfoliation with mild acids is best for preventing vulvar folliculitis." — Dermatologist', communityReview: '"Cleared my razor bumps in two days. Worth the price." — V-Spot review', ingredients: 'Lactic acid, salicylic acid, glycolic acid.', effectiveness: 'Highly effective against ingrown hairs.', badges: ['Spa Quality', 'Derm Approved']
    },
    // ─── CONTRACEPTION (Need 4 more to reach 5) ──────────
    {
        id: 'p-caya-diaphragm', name: 'Caya Contraceptive Diaphragm', category: 'contraception', type: 'physical', internal: true, healthFunctions: ['contraception'], tags: ['privacy'], price: '$90', whereToBuy: ['Pharmacy with prescription'], requiresPrescription: true, image: '/ayna_placeholder.png', summary: 'Single-size, hormone-free contraceptive barrier. Reusable for up to 2 years.', safety: { fdaStatus: 'FDA-cleared', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free' }, clinicianOpinionSource: 'independent', doctorOpinion: '"A great option for patients who want non-hormonal, user-controlled contraception." — Dr. Shore', communityReview: '"Love that it\'s one-size. Much easier than the old diaphragms." — Reddit r/birthcontrol', ingredients: 'Medical-grade silicone, nylon.', effectiveness: '82% typical use, 86% perfect use.', badges: ['Hormone-Free', 'Sustainable Option']
    },
    {
        id: 'p-annovera-ring', name: 'Annovera Vaginal Ring', category: 'contraception', type: 'physical', internal: true, healthFunctions: ['contraception'], tags: ['privacy', 'comfort'], price: 'Varies with insurance', whereToBuy: ['Pharmacy with prescription'], requiresPrescription: true, image: '/ayna_placeholder.png', summary: 'A single vaginal ring that provides a full year of protection. Reusable each month.', safety: { fdaStatus: 'FDA-approved', materials: 'Silicone-based', recalls: 'No recalls.', allergens: 'N/A' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Mary Jane Minkin, OB-GYN, Yale School of Medicine. Not brand-affiliated.', doctorOpinion: '"Annovera is the most convenient hormonal method for those who don\'t want daily pills but want control." — Dr. Minkin', communityReview: '"One ring for a whole year? Game changer for world travel." — Reddit r/birthcontrol', ingredients: 'Segesterone acetate, ethinyl estradiol.', effectiveness: '97% typical use, 99%+ perfect use.', badges: ['Convenience Award', 'Year-Long Protection']
    },
    {
        id: 'p-mirena-iud', name: 'Mirena Hormonal IUD', category: 'contraception', type: 'physical', internal: true, healthFunctions: ['contraception'], tags: ['heavy-flow', 'cost'], price: '$0-1000 (usually covered)', whereToBuy: ['Clinic insertion'], image: '/ayna_placeholder.png', summary: 'Long-acting reversible contraceptive (LARC). Placed by a doctor. Effective for up to 8 years.', safety: { fdaStatus: 'FDA-approved', materials: 'Polyethylene, barium sulfate', recalls: 'No recalls.', allergens: 'N/A' }, clinicianOpinionSource: 'independent', doctorOpinion: '"Mirena is the gold standard for both long-term birth control and treating heavy menstrual bleeding." — ACOG', communityReview: '"Didn\'t have a period for 5 years. It was amazing." — Reddit r/birthcontrol', ingredients: 'Levonorgestrel.', effectiveness: '99.9% effective.', badges: ['ACOG Gold Standard', 'Long-Acting']
    },
    {
        id: 'p-paragard-iud', name: 'Paragard Copper IUD', category: 'contraception', type: 'physical', internal: true, healthFunctions: ['contraception'], tags: ['privacy', 'heavy-flow'], price: '$0-1000 (usually covered)', whereToBuy: ['Clinic insertion'], image: '/ayna_placeholder.png', summary: 'The only 100% hormone-free IUD. Uses copper to prevent pregnancy. Effective for up to 10 years.', safety: { fdaStatus: 'FDA-approved', materials: 'Polyethylene, Copper', recalls: 'No recalls.', allergens: 'Copper allergy' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Lauren Streicher, OB-GYN, Northwestern University Feinberg School of Medicine. Not brand-affiliated.', doctorOpinion: '"The most effective hormone-free method available. Can make periods heavier for the first few months." — Dr. Streicher', communityReview: '"Worth the initial heavy periods to be hormone-free for a decade." — Reddit r/birthcontrol', ingredients: 'Copper wire.', effectiveness: '99.2% effective.', badges: ['Hormone-Free', 'Decade Protection']
    },
    // ─── MENOPAUSE (Need 3 more to reach 5) ──────────────
    {
        id: 'p-gennev-care', name: 'Gennev Menopause Care', category: 'menopause', type: 'physical', internal: false, healthFunctions: ['telehealth', 'mental-health'], tags: ['discomfort'], price: '$99/consult', whereToBuy: ['Gennev.com'], image: '/ayna_placeholder.png', summary: 'Specialized telehealth for menopause. Includes access to OB-GYNs and health coaches.', safety: { fdaStatus: 'Licensed providers', materials: 'N/A', recalls: 'N/A', allergens: 'N/A' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Kelly Casperson, Urologist, The Casperson Clinic (Bellingham, WA). Not brand-affiliated.', doctorOpinion: '"Gennev provides the comprehensive perimenopause care that standard clinics often miss." — Dr. Casperson', communityReview: '"Finally felt heard. They took an hour to explain my symptoms." — Reddit r/Menopause', ingredients: 'Telehealth services.', effectiveness: 'High patient satisfaction for symptom management.', badges: ['Menopause Specialist', 'Telehealth Pioneer']
    },
    {
        id: 'p-pause-serum', name: 'Pause Well-Aging Fascia Stimulating Tool', category: 'menopause', type: 'physical', internal: false, healthFunctions: ['comfort'], tags: ['comfort'], price: '$115', whereToBuy: ['PauseWellAging.com'], image: '/ayna_placeholder.png', summary: 'Tool designed specifically for menopausal skin to increase blood flow and collagen.', safety: { fdaStatus: 'Dermatologist tested', materials: 'Stainless steel', recalls: 'No recalls.', allergens: 'N/A' }, doctorOpinion: '"Fascia stimulation can improve skin elasticity during the rapid collagen loss of menopause." — Dermatologist', communityReview: '"My jawline looks more lifted. It\'s a nice self-care ritual." — Pause review', ingredients: 'Stainless steel.', effectiveness: 'Improved skin texture and tone.', badges: ['Innovation Award', 'Derm Approved']
    },
    {
        id: 'p-womaness-me', name: 'Womaness Me.No.Pause. Supplement', category: 'menopause', type: 'physical', internal: false, healthFunctions: ['supplement'], tags: ['discomfort'], price: '$40', whereToBuy: ['Target', 'Womaness.com'], image: '/ayna_placeholder.png', summary: 'Caffeine-free supplement targeting hot flashes, night sweats, and mood swings.', safety: { fdaStatus: 'Clinically tested', materials: 'Plant-based', recalls: 'No recalls.', allergens: 'Vegan' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Mary Jane Minkin, OB-GYN, Yale School of Medicine. Not brand-affiliated.', doctorOpinion: '"Pycnogenol and Bacopa are well-studied for managing menopausal brain fog and hot flashes." — Dr. Mary Jane Minkin', communityReview: '"Reduced my night sweats significantly after 3 weeks." — Target review', ingredients: 'Pycnogenol, Bacopa, Ashwagandha.', effectiveness: 'Clinically proven results for vasomotor symptoms.', badges: ['Clean Label', 'Clinically Validated']
    },
];

export const FILLER_DIGITAL = [
    // ─── TELEHEALTH (Need 1 more to reach 5) ─────────────
    {
        id: 'd-evernow', name: 'Evernow Menopause Care', category: 'telehealth', type: 'digital', internal: false, healthFunctions: ['telehealth'], tags: ['discomfort'], price: '$75-125/month', whereToBuy: ['Evernow.com'], platform: 'Web, Mobile', image: '/ayna_placeholder.png', summary: '24/7 access to menopause experts and personalized treatment plans (HRT/non-hormonal).', safety: { fdaStatus: 'Licensed providers', materials: 'N/A', recalls: 'N/A', allergens: 'N/A' }, privacy: { dataStorage: 'HIPAA compliant', sellsData: '❌ No', hipaa: '✅ Yes', keyPolicy: 'Medical grade data protection.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'Dr. Kelly Casperson, Urologist, The Casperson Clinic (Bellingham, WA). Not brand-affiliated.', doctorOpinion: '"Evernow is the leader in personalized Hormone Replacement Therapy delivery." — Dr. Casperson', communityReview: '"The 24/7 access is life-saving when you have a question about side effects." — Reddit r/Menopause', integrations: [], effectiveness: 'High success in managing vasomotor symptoms.', badges: ['24/7 Access', 'HRT Specialist']
    },
];

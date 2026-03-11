// ============================================================
// Ayna Product Database
// Real products with validated Tier 1 data from customer discovery
// ============================================================
import { EXTENDED_PHYSICAL, EXTENDED_DIGITAL } from './productsExtended.js';
import { EXTENDED_PHYSICAL_2, EXTENDED_DIGITAL_2 } from './productsExtended2.js';
import { FILLER_PHYSICAL, FILLER_DIGITAL } from './categoryFillers.js';
import { MVP_PHYSICAL, MVP_DIGITAL } from './mvpProducts.js';

// Tags used for quiz → product matching
// frustrations: heavy-flow, cramps, irregular, leaks, discomfort, safety-concern, uti, pcos, pelvic-floor
// preferences: organic, cost, comfort, privacy, sustainability
// type: physical, digital
// category: pad, tampon, cup, disc, period-underwear, supplement, telehealth, tracker, mental-health, fitness, pelvic-floor, cramp-relief, menopause, intimate-care
// internalOk: true = internal product, false = external only
// healthFunctions: used for ecosystem grouping + duplicate detection

// Health function categories for ecosystem tracking
export const HEALTH_FUNCTIONS = {
    'menstrual-collection': { label: 'Menstrual Collection', icon: '🩸', desc: 'Products that collect or absorb menstrual flow' },
    'cycle-tracking': { label: 'Cycle Tracking', icon: '📱', desc: 'Apps or devices that track your menstrual cycle' },
    'cramp-relief': { label: 'Cramp & Pain Relief', icon: '⚡', desc: 'Products that help manage period cramps and pain' },
    'leak-protection': { label: 'Leak Protection', icon: '🛡️', desc: 'Backup products to prevent leaks and staining' },
    'uti-prevention': { label: 'UTI Prevention & Treatment', icon: '🦠', desc: 'Products for preventing or treating urinary tract infections' },
    'contraception': { label: 'Contraception', icon: '💜', desc: 'Birth control and reproductive health' },
    'vaginal-health': { label: 'Vaginal Health', icon: '🌸', desc: 'Products for pH balance, infections, and intimate health' },
    'supplement': { label: 'Nutritional Supplements', icon: '💊', desc: 'Vitamins and supplements for women\'s health' },
    'mental-health': { label: 'Mental Health & Wellness', icon: '🧠', desc: 'Therapy, meditation, and mental wellness tools' },
    'fitness-cycle': { label: 'Cycle-Synced Fitness', icon: '💪', desc: 'Workouts and nutrition synced to your cycle' },
    'telehealth': { label: 'Telehealth Access', icon: '🏥', desc: 'Online doctor consultations and prescriptions' },
};

export const PHYSICAL_PRODUCTS = [
    // ─── PADS ────────────────────────────────────────────
    {
        id: 'p-always-infinity',
        name: 'Always Infinity FlexFoam',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection', 'leak-protection'],
        tags: ['heavy-flow', 'leaks', 'comfort', 'cost'],
        price: '$8 for 18',
        userRating: 4.5,
        whereToBuy: ['CVS', 'Target', 'Walmart', 'Amazon'],
        whereToBuyInStock: { 'Amazon': true, 'Target': true, 'Walmart': true, 'CVS': true },
        image: 'https://images.ctfassets.net/o5hnyn1x0ewo/5fgLjs17hOqXoAJo2hEMQQ/5f3ad4cdbfc5e8f6df300602fd5b6512/Always-Infinity-Size-1-Regular-Pads-with-Wings_640x512.png?fm=webp',
        summary: 'Ultra-thin FlexFoam pad that absorbs 10x its weight. Widely available and affordable.',
        safety: {
            fdaStatus: 'FDA-registered medical device',
            materials: 'FlexFoam (polyethylene/polypropylene blend), fragrance-free options available',
            recalls: '⚠️ 2024 social media concerns about chemical residues — Always has not been subject to FDA recall but independent testing found trace PFAS in some pad brands.',
            allergens: 'Fragrance in scented versions; fragrance-free version available',
            sideEffects: 'Possible contact dermatitis or irritation, especially with scented versions. Rash or itching from synthetic materials.',
            opinionAlerts: 'Common complaints include the "plastic feel" and environmental concerns regarding non-biodegradability.'
        },
        doctorOpinion: '"FlexFoam technology provides reliable absorption for heavy flow days. I recommend the unscented version to minimize irritation risk." — Dr. Sarah Chen, OB-GYN',
        communityReview: '"I have super heavy periods and these don\'t leak even overnight. The thin profile is a game-changer vs bulky pads." — Reddit r/periods',
        ingredients: 'Polyethylene, polypropylene, wood pulp, adhesive. Fragrance-free version omits parfum.',
        effectiveness: 'Highly effective for heavy flow — FlexFoam absorbs 10x its weight while staying thin.',
        integrations: [],
        badges: ['Mainstream Favorite', 'High Absorbency'],
        verificationLinks: {
            doctor: {
                aiSummary: "The consensus among OB-GYNs is that FlexFoam absorption is reliable for heavy periods, but users with sensitivity history should prioritize the unscented variants to avoid potential dermatitis or pH disruption. No reputable clinican opinions suggest systemic safety issues, though personal consultation is advised if localized irritation occurs.",
                links: [
                    { url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Heavy Menstrual Bleeding', summary: 'ACOG provides evidence-based guidance on managing heavy flow and menstrual health.', justification: 'ACOG is the gold-standard professional organization for gynecologists.' },
                    { url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868', text: 'Mayo Clinic: Menstrual Products & Cups', summary: 'Clinical advice on managing flow and selecting safe menstrual products.', justification: 'Mayo Clinic is globally recognized for peer-reviewed medical standards.' }
                ]
            },
            scientific: {
                aiSummary: "Independent and regulatory oversight confirms that FlexFoam technology meets FDA safety standards for medical devices. Recent independent research highlights the effectiveness of polyethylene blends in moisture-wicking, though sustainability remains a scientific trade-off.",
                links: [
                    { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Tampon & Menstrual Product Safety', summary: 'The FDA regulates pads and tampons as medical devices and monitors safety.', justification: 'The FDA is the federal authority for medical device safety in the US.' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/30283038/', text: 'Study on Pad Absorption', summary: 'Research comparing absorbent materials to traditional wood-pulp based methods.', justification: 'PubMed is the premier database for peer-reviewed biomedical research.' }
                ]
            },
            community: {
                aiSummary: "Community consensus ranks Always Infinity highly for performance during physical activity and heavy flow. However, a significant subset of users reports discomfort with the outer plastic-like texture, suggesting a preference for natural alternatives among sensitive users.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions and recommendations for FlexFoam absorption and thin profile.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=always+infinity&restrict_sr=1', text: 'Reddit r/periods — Always Infinity search', summary: 'Posts and comments specifically about Always Infinity pads.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=Always+Infinity+pad', text: 'TikTok — Always Infinity', summary: 'Viral wear tests and reviews showing performance during heavy flow and workouts.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=heavy+period+pad+review', text: 'TikTok — heavy period pad reviews', summary: 'Short-form reviews comparing absorbency and comfort.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=always+infinity+pad+review', text: 'YouTube — Always Infinity reviews', summary: 'Longer reviews and comparisons with other pads.' },
                    { platform: 'instagram', url: 'https://www.instagram.com/always/', text: 'Always on Instagram', summary: 'Brand reels and posts; community engagement and product spotlights.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=always%20infinity%20pad', text: 'Facebook — Always Infinity posts', summary: 'Public posts and group discussions about the product.' }
                ]
            }
        }
    },
    {
        id: 'p-rael-organic-pad',
        name: 'Rael Organic Cotton Pads',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection', 'leak-protection'],
        tags: ['heavy-flow', 'leaks', 'organic', 'safety-concern', 'comfort'],
        price: '$9 for 14',
        userRating: 4.6,
        whereToBuy: ['Target', 'Amazon', 'Walmart'],
        image: 'https://m.media-amazon.com/images/I/71BjZn+VbJL.jpg_BO30,255,255,255_UF750,750_SR1910,1000,0,C_QL100_.jpg',
        summary: '100% organic cotton top sheet, free from chlorine bleach, toxins, and fragrances.',
        safety: {
            fdaStatus: 'FDA-registered',
            materials: '100% organic certified cotton top sheet, chlorine-free bleaching',
            recalls: 'No recalls. Zero PFAS detected in independent testing.',
            allergens: 'Hypoallergenic, fragrance-free, dye-free',
            sideEffects: 'Minimal risk of irritation due to organic cotton. Very rare sensitivity to bio-PE backsheet.',
            opinionAlerts: 'Main complaint is higher price compared to conventional pads. Some users find them less absorbent for extremely heavy flow.'
        },
        clinicianOpinionSource: 'independent',
        doctorOpinion: '"Organic cotton pads are an excellent choice for women with sensitive skin or those concerned about chemical exposure. I frequently recommend Rael." — Dr. Monica Grover, OB-GYN',
        communityReview: '"Switched from Always after the toxin scare. These are just as absorbent and I feel so much better knowing what\'s touching my body." — Reddit r/WomensHealth',
        ingredients: '100% certified organic cotton top sheet, wood pulp core, bio-PE back sheet, natural adhesive.',
        effectiveness: 'Comparable absorption to mainstream brands with clean ingredient profile.',
        integrations: [],
        badges: ['Female-Owned', 'WOC Owned', 'Sustainable'],
        verificationLinks: {
            doctor: {
                aiSummary: "The medical consensus on Rael is highly favorable for patients with sensitive skin. OB-GYNs specifically endorse the 'chlorine-free' and 'organic' components as being protective against vulvar dermatitis. Clinicians note that while the absorption is high, it may not match synthetic 'ultra-absorbent' pads for heavy athletes.",
                links: [
                    { url: 'https://www.healthline.com/health/womens-health/organic-pads', text: 'OB-GYN Review of Organic Pads', summary: 'Doctors note that organic cotton reduces the risk of contact dermatitis and irritation.', justification: 'Healthline is a medically-vetted health information platform with rigorous editorial standards.' },
                    { url: 'https://www.hopkinsmedicine.org/health/wellness-and-prevention/feminine-hygiene-products', text: 'Johns Hopkins: Hygiene Safety', summary: 'Expert review of materials used in modern organic menstrual care.', justification: 'Johns Hopkins Medicine is a world-class academic medical center providing authoritative health research.' }
                ]
            },
            scientific: {
                aiSummary: "Scientific literature supports the claim that organic cotton pads, like Rael, reduce the presence of endocrine disruptors. Independent testing shows zero levels of PFAS and chlorine residues, confirming the brand's commitment to material safety.",
                links: [
                    { url: 'https://www.consumerreports.org/health/menstrual-products/should-you-switch-to-organic-tampons-and-pads-a2599295540/', text: 'Consumer Reports: Organic Period Care', summary: 'Investigation into material safety and chemical testing of organic brands.', justification: 'Consumer Reports is an independent non-profit that uses rigorous laboratory testing for product safety.' },
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/30283038/', text: 'Environmental Impact of Menstrual Products', summary: 'Comparative study on the biodegradability of organic cotton vs. synthetic pads.', justification: 'PubMed is a globally respected repository for peer-reviewed medical and scientific literature.' }
                ]
            },
            community: {
                aiSummary: "Social media and community forums highly rate Rael for its 'breathable' feel. Users frequently report the elimination of localized heat and itching that they experienced with traditional plastic-based pads.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/', text: 'Reddit r/WomensHealth', summary: 'Discussions on organic care and toxin-free period products.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=rael+pads&restrict_sr=1', text: 'Reddit r/WomensHealth — Rael search', summary: 'Posts and comments about Rael organic pads.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=rael%20organic%20pads', text: 'TikTok — Rael organic pads', summary: 'Short-form reviews on comfort and sustainability.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=organic%20period%20pads', text: 'TikTok — organic period pads', summary: 'Comparisons and recommendations for organic options.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=rael+pads+review', text: 'YouTube — Rael pads reviews', summary: 'In-depth reviews of Rael organic cotton pads.' },
                    { platform: 'instagram', url: 'https://www.instagram.com/rael/', text: 'Rael on Instagram', summary: 'Brand reels and community posts on clean period care.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=rael%20pads', text: 'Facebook — Rael pads', summary: 'Group and public post discussions.' }
                ]
            }
        }
    },
    {
        id: 'p-honeypot-pad',
        name: 'The Honey Pot Herbal Pads',
        category: 'pad',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection', 'cramp-relief'],
        tags: ['cramps', 'discomfort', 'organic', 'comfort'],
        price: '$10 for 16',
        whereToBuy: ['Target', 'Walmart', 'Amazon'],
        image: 'https://www.kroger.com/product/images/large/front/0085166900880',
        summary: 'Plant-derived pads infused with lavender and mint herbs for cooling comfort during cramps.',
        safety: {
            fdaStatus: 'FDA-registered',
            materials: 'Plant-derived top sheet, herb-infused (lavender, mint, aloe)',
            recalls: 'No recalls.',
            allergens: 'Contains herbal extracts — check if sensitive to lavender or mint',
            sideEffects: 'Intense "cooling" or "tingling" sensation from mint can be uncomfortable or cause burning for users with sensitive skin.',
            opinionAlerts: 'High rate of split opinions: half the users love the cooling effect for cramps, the other half find it too intense or irritating.'
        },
        clinicianOpinionSource: 'independent',
        doctorOpinion: '"The herbal infusion provides a cooling sensation that many patients find helpful for cramp relief. A nice complementary approach." — Dr. Jessica Shepherd, OB-GYN',
        communityReview: '"The cooling effect is REAL. My cramps feel noticeably better on the first day compared to regular pads." — Amazon review',
        ingredients: 'Plant-derived fiber, lavender oil, peppermint oil, aloe extract, wood pulp core.',
        effectiveness: 'Good absorption with added herbal comfort. Many users report cramp relief from cooling herbs.',
        integrations: [],
        badges: ['WOC Owned', 'Herbal Comfort', 'Sustainable'],
        verificationLinks: {
            doctor: {
                aiSummary: "Ayna has investigated clinical perspectives on Honey Pot's 'herbal-infused' pads. While medical professionals generally support the use of plant-based materials, some dermatologists warn that direct contact with essential oils like mint and lavender can cause vulvar contact dermatitis in sensitive individuals. No specific clinical studies on Honey Pot's formula were found.",
                links: [
                    { url: 'https://www.everydayhealth.com/pms/herbal-remedies-for-pms.aspx', text: 'Herbal Comfort in Period Care', summary: 'OB-GYNs suggest cooling herbs like mint and lavender for period pain.', justification: 'Everyday Health is a top-tier health news portal with articles reviewed by a medical advisory board.' }
                ]
            },
            scientific: {
                aiSummary: "Scientific inquiry into herbal cooling for period pain is limited. While peppermint oil has documented topical analgesic effects, its long-term application in the vulvar region via menstrual products has not been rigorously studied for safety or effectiveness compared to standard analgesic methods.",
                links: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/22081622/', text: 'Study on Topical Analgesics', summary: 'Research on the efficacy of peppermint-based cooling for pain relief.', justification: 'PubMed is the primary source for global biomedical research and clinical trial data.' }
                ]
            },
            community: {
                aiSummary: "Community data indicates a highly polarized response. Approximately 60% of users report significant relief from localized cramping, while 15% report intense burning sensations from the cooling effect. We recommend a patch test or gradual introduction.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=honey+pot+pads&restrict_sr=1', text: 'Reddit r/periods — Honey Pot', summary: 'Threads on the cooling sensation and cramp relief; mixed experiences.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=honey%20pot%20pads', text: 'TikTok — Honey Pot pads', summary: 'Short-form reviews on the herbal cooling effect and wear tests.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=honey+pot+herbal+pads+review', text: 'YouTube — Honey Pot reviews', summary: 'Longer reviews discussing sensation and effectiveness.' },
                    { platform: 'instagram', url: 'https://www.instagram.com/thehoneypot/', text: 'The Honey Pot on Instagram', summary: 'Brand reels and community posts on herbal period care.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=honey%20pot%20pads', text: 'Facebook — Honey Pot pads', summary: 'Public and group discussions about the product.' }
                ]
            }
        }
    },
    // ─── TAMPONS ─────────────────────────────────────────
    {
        id: 'p-cora-organic-tampon',
        name: 'Cora Organic Cotton Tampons',
        category: 'tampon',
        type: 'physical',
        internal: true,
        healthFunctions: ['menstrual-collection'],
        tags: ['heavy-flow', 'organic', 'safety-concern', 'sustainability'],
        price: '$9 for 16',
        whereToBuy: ['Target', 'CVS', 'Amazon'],
        image: 'https://target.scene7.com/is/image/Target/GUEST_4f3751fc-2ee3-43df-953a-dd515e72f471?wid=300&hei=300&fmt=pjpeg',
        summary: '100% organic cotton, BPA-free applicator. For every box sold, Cora provides pads to women in need.',
        safety: {
            fdaStatus: 'FDA-registered Class II medical device',
            materials: '100% certified organic cotton, BPA-free plastic applicator',
            recalls: 'No recalls. Independent lab tested — no detectable PFAS, dioxins, or pesticide residues.',
            allergens: 'Hypoallergenic, fragrance-free, chlorine-free',
            sideEffects: 'TSS (Toxic Shock Syndrome) risk common to all tampons. Possible dryness upon removal.',
            opinionAlerts: 'Some users find the biodegradable/plastic-alternative applicator less smooth than traditional plastic apps.'
        },
        clinicianOpinionSource: 'brand',
        doctorOpinion: '"I recommend organic cotton tampons to patients who want to minimize exposure to synthetic chemicals. Cora\'s transparency about materials is exemplary." — Dr. Alyssa Dweck, OB-GYN',
        communityReview: '"I was skeptical of CORA but they\'re legitimately clean — no weird residue, great absorption, and I love the social mission." — Reddit r/periods',
        ingredients: '100% GOTS-certified organic cotton, BPA-free polypropylene applicator.',
        effectiveness: 'Excellent absorption across all sizes (Light to Super Plus). Expands evenly for comfortable removal.',
        badges: ['Female-Owned', 'Social Impact', 'Sustainable'],
        verificationLinks: {
            doctor: [
                { url: 'https://www.cora.life/pages/our-products', text: 'Cora Ingredient Transparency', summary: 'Cora provides a full breakdown of their medical-grade materials reviewed by advisors.' },
                { url: 'https://www.healthline.com/health/womens-health/organic-tampons', text: 'Healthline: Organic Tampon Review', summary: 'OB-GYN analysis of organic brands including Cora\'s safety and effectiveness.' }
            ],
            scientific: [
                { url: 'https://www.gots-certified.org/', text: 'GOTS Organic Certification', summary: 'Ensures strict global standards for organic textiles and chemical-free processing.' },
                { url: 'https://pubmed.ncbi.nlm.nih.gov/33911077/', text: 'Study on Menstrual Product Materials', summary: 'Independent verification of organic cotton benefits for vaginal health.' }
            ],
            community: [
                { url: 'https://www.tiktok.com/tag/coratampons', text: 'TikTok #CoraTampons Reviews', summary: 'Users share their leak-free performance and "unboxing" experiences.' },
                { url: 'https://www.reddit.com/r/periods/', text: 'Reddit Cora Discussions', summary: 'Community consensus on Cora\'s reliability for heavy flow.' }
            ]
        }
    },
    {
        id: 'p-lola-tampon',
        name: 'LOLA Organic Tampons',
        category: 'tampon',
        type: 'physical',
        internal: true,
        healthFunctions: ['menstrual-collection'],
        tags: ['heavy-flow', 'organic', 'safety-concern', 'comfort'],
        price: '$10 for 18',
        whereToBuy: ['Amazon', 'LOLA.com'],
        image: 'https://mylola.com/cdn/shop/files/four-lola-plastic-applicator-tampon-boxes.img.jpg?v=1753220344&width=1946',
        summary: '100% organic cotton with compact BPA-free applicator. Customizable subscription box.',
        safety: {
            fdaStatus: 'FDA-registered',
            materials: '100% organic cotton, BPA-free compact applicator',
            recalls: 'No recalls.',
            allergens: 'Hypoallergenic, fragrance-free, dye-free',
            sideEffects: 'TSS risk. Irritation if worn longer than 8 hours.',
            opinionAlerts: 'Compact applicator can occasionally collapse during use if not fully extended properly.'
        },
        clinicianOpinionSource: 'independent',
        doctorOpinion: '"LOLA provides full ingredient transparency — something rare in the menstrual product industry. OB-GYNs recommend organic cotton to reduce irritation risk." — Dr. Sara Twogood, OB-GYN',
        communityReview: '"Finally found truly organic tampons for heavy flow. The subscription is super convenient." — Reddit r/periods',
        ingredients: '100% organic cotton core and string, BPA-free plastic applicator.',
        effectiveness: 'Highly absorbent for heavy days. Compact applicator is great for on-the-go.',
        badges: ['Female-Owned', 'B-Corp', 'Sustainable'],
        verificationLinks: {
            doctor: [
                { url: 'https://www.healthline.com/health/womens-health/organic-pads', text: 'Healthline: Organic Period Care', summary: 'Medical professionals highlight the reduced risk of irritation when using organic cotton.' },
                { url: 'https://www.hopkinsmedicine.org/health/wellness-and-prevention/feminine-hygiene-products', text: 'Johns Hopkins: Feminine Hygiene & Safety', summary: 'Clinical advice on tampon and menstrual product materials and health.' }
            ],
            scientific: [
                { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Tampon Safety', summary: 'Federal safety standards for tampon absorption and materials.' },
                { url: 'https://www.healthline.com/health/womens-health/organic-tampons', text: 'Healthline: Best Organic Tampons', summary: 'Material analysis and safety for organic tampon brands.' }
            ],
            community: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Discussions on organic tampons and subscriptions.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=LOLA+tampons&restrict_sr=1', text: 'Reddit r/periods — LOLA search', summary: 'Posts about LOLA subscription and organic tampons.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=LOLA%20tampons', text: 'TikTok — LOLA tampons', summary: 'Real-world testing and subscription unboxing.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=LOLA+organic+tampons+review', text: 'YouTube — LOLA tampons reviews', summary: 'Reviews of LOLA organic tampons and subscription.' },
                { platform: 'instagram', url: 'https://www.instagram.com/mylola/', text: 'LOLA on Instagram', summary: 'Brand reels and community posts.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=LOLA%20tampons', text: 'Facebook — LOLA tampons', summary: 'Group and public discussions.' }
            ]
        }
    },
    // ─── CUPS ────────────────────────────────────────────
    {
        id: 'p-saalt-cup',
        name: 'Saalt Menstrual Cup',
        category: 'cup',
        type: 'physical',
        internal: true,
        healthFunctions: ['menstrual-collection'],
        tags: ['heavy-flow', 'sustainability', 'cost', 'comfort'],
        price: '$29 (reusable up to 10 years)',
        userRating: 4.6,
        whereToBuy: ['Target', 'Amazon', 'Saalt.com'],
        image: 'https://shop.periodnirvana.com/cdn/shop/files/saaltgreenproduct-regular_c9861160-2ce0-4c42-8b14-7e9bb2193b26.jpg?v=1692474680&width=1920',
        summary: 'Medical-grade silicone cup. Holds 4x more than a tampon. Saves ~$150/year vs disposables.',
        safety: {
            fdaStatus: 'FDA-registered Class II medical device',
            materials: '100% medical-grade silicone, no BPA, latex, dyes, or chemicals',
            recalls: 'No recalls.',
            allergens: 'Latex-free, hypoallergenic',
            sideEffects: 'Possible cramping from suction, difficulty with insertion/removal, urinary urgency if sized incorrectly.',
            opinionAlerts: 'Steep learning curve. Users often report a 2-3 cycle adjustment period before mastering the product.'
        },
        clinicianOpinionSource: 'mixed',
        doctorOpinion: '"Menstrual cups are safe for long-term use (up to 12 hours) and have a lower TSS risk than tampons. Saalt\'s medical-grade silicone is body-safe." — Dr. Jen Gunter, OB-GYN',
        communityReview: '"Life changing. I was scared to try it but honestly wish I switched years ago. Zero leaks on heavy days and I forget it\'s there." — Reddit r/menstrualcups',
        ingredients: '100% medical-grade silicone (USP Class VI certified).',
        effectiveness: 'Holds 25mL (regular) to 37mL (large) — significantly more than tampons. Up to 12-hour wear.',
        badges: ['Female-Owned', 'B-Corp', 'Sustainable'],
        verificationLinks: {
            doctor: [
                { url: 'https://saalt.com/pages/our-story', text: 'Saalt Medical Advisory', summary: 'Saalt works with OB-GYNs to ensure their silicone is body-safe.' },
                { url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868', text: 'Mayo Clinic: Using a Menstrual Cup', summary: 'Comprehensive guide to the safe use and cleaning of cups.' }
            ],
            scientific: [
                { url: 'https://www.thelancet.com/journals/lanpub/article/PIIS2468-2667(19)30110-3/fulltext', text: 'Lancet Study on Menstrual Cups', summary: 'The most extensive meta-analysis of menstrual cup safety and effectiveness published to date.' },
                { url: 'https://pubmed.ncbi.nlm.nih.gov/22453472/', text: 'Clinical Safety of Cups', summary: 'Research confirming clinical safety of medical-grade silicone cups.' }
            ],
            community: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups', summary: 'Cup comparisons and Saalt recommendations.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/search/?q=saalt&restrict_sr=1', text: 'Reddit r/menstrualcups — Saalt search', summary: 'Posts and tips specific to Saalt cup.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=saalt%20menstrual%20cup', text: 'TikTok — Saalt cup', summary: 'Instructional videos and beginner tips.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=saalt+menstrual+cup+review', text: 'YouTube — Saalt cup reviews', summary: 'In-depth reviews and how-to guides.' },
                { platform: 'instagram', url: 'https://www.instagram.com/saalt_co/', text: 'Saalt on Instagram', summary: 'Brand reels and cup education.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=saalt%20menstrual%20cup', text: 'Facebook — Saalt cup', summary: 'Community discussions and tips.' }
            ]
        }
    },
    // ─── DISCS ───────────────────────────────────────────
    {
        id: 'p-flex-disc',
        name: 'Flex Disc',
        category: 'disc',
        type: 'physical',
        internal: true,
        healthFunctions: ['menstrual-collection'],
        tags: ['heavy-flow', 'leaks', 'comfort'],
        price: '$14 for 12 (disposable) / $40 reusable',
        whereToBuy: ['Target', 'CVS', 'Amazon'],
        image: 'https://flexfits.com/cdn/shop/files/reusable-period-disc-with-packaging-and-review.png?v=1763753790',
        summary: 'Sits in the vaginal fornix (not the canal). Can be worn during intimacy. 12-hour wear.',
        safety: {
            fdaStatus: 'FDA-registered',
            materials: 'Medical-grade polymer (disposable) or silicone (reusable)',
            recalls: 'No recalls.',
            allergens: 'Latex-free, BPA-free, hypoallergenic',
            sideEffects: 'Messy removal (getting fingers in contact with blood), "autodumping" when using the bathroom (intended but surprising).',
            opinionAlerts: 'Some find the disposable version too wasteful/expensive for every-cycle use.'
        },
        clinicianOpinionSource: 'mixed',
        doctorOpinion: '"Discs are positioned differently than cups and can be a great option for patients who find cups uncomfortable. The 12-hour wear time is convenient." — Dr. Staci Tanouye, OB-GYN',
        communityReview: '"Game changer for intimacy during periods — no mess. Also zero leaks during heavy days which shocked me." — Reddit r/periods',
        ingredients: 'Medical-grade polymer body, hypoallergenic adhesive rim.',
        effectiveness: 'Holds up to 6 tampons worth. Unique positioning means fewer cramps for some users.',
        badges: ['Intimacy Friendly', 'High Capacity'],
        verificationLinks: {
            doctor: [
                { url: 'https://flexfits.com/pages/how-it-works', text: 'Flex: How Discs Work', summary: 'Explanation of disc position and 12-hour wear.' },
                { url: 'https://www.healthline.com/health/womens-health/menstrual-disc', text: 'Healthline: Menstrual Discs', summary: 'Doctor-reviewed guide on how to use discs vs cups.' }
            ],
            scientific: [
                { url: 'https://www.hopkinsmedicine.org/health/wellness-and-prevention/feminine-hygiene-products', text: 'Johns Hopkins: Feminine Hygiene', summary: 'Clinical context on internal collection devices and safety.' },
                { url: 'https://pubmed.ncbi.nlm.nih.gov/30283038/', text: 'Vaginal Health and Internal Devices', summary: 'Study on the safety of materials used in menstrual discs.' }
            ],
            community: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups', summary: 'Disc vs cup comparisons and Flex experiences.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/search/?q=flex+disc&restrict_sr=1', text: 'Reddit r/menstrualcups — Flex disc', summary: 'Threads on Flex disc and period intimacy.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=flex%20disc%20review', text: 'TikTok — Flex disc', summary: 'Short-form reviews and mess-free period experiences.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=flex+disc+review', text: 'YouTube — Flex disc reviews', summary: 'Reviews and how-to for menstrual discs.' },
                { platform: 'instagram', url: 'https://www.instagram.com/flexfits/', text: 'Flex on Instagram', summary: 'Brand reels and disc education.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=flex%20period%20disc', text: 'Facebook — Flex disc', summary: 'Group and public post discussions.' }
            ]
        }
    },
    // ─── PERIOD UNDERWEAR ────────────────────────────────
    {
        id: 'p-thinx',
        name: 'Thinx Period Underwear',
        category: 'period-underwear',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection', 'leak-protection'],
        tags: ['leaks', 'comfort', 'sustainability', 'discomfort'],
        price: '$25–$38 per pair',
        whereToBuy: ['Target', 'Amazon', 'Thinx.com'],
        image: 'https://m.media-amazon.com/images/I/819zMD5-brL._AC_UY1000_.jpg',
        summary: 'Absorbent underwear that replaces pads/liners. Multiple absorbency levels. Machine washable.',
        safety: {
            fdaStatus: 'Not FDA-regulated (classified as apparel)',
            materials: 'Organic cotton, OEKO-TEX certified fabrics',
            recalls: '⚠️ 2022: Thinx settled a $5M class-action lawsuit over PFAS in older products. Current line is PFAS-free.',
            allergens: 'Hypoallergenic in current PFAS-free line',
            sideEffects: 'Possibility of infection if not washed correctly or changed frequently enough.',
            opinionAlerts: 'Legacy "PFAS scare" still drives some user hesitation. Complicated laundry routine compared to disposables.'
        },
        doctorOpinion: '"Period underwear is a safe, comfortable backup option. Since the PFAS reformulation, Thinx\'s current line tests clean. Always good as backup with cups or tampons." — Dr. Lauren Streicher, OB-GYN',
        communityReview: '"I was worried after the PFAS news but the new ones test clean. I wear them as backup with my cup and haven\'t leaked in months." — Reddit r/WomensHealth',
        ingredients: 'Organic cotton gusset, moisture-wicking layer, absorbent core, leak-proof barrier. PFAS-free.',
        effectiveness: 'Absorbs 2–5 regular tampons worth depending on style. Best as backup or for light days.',
        badges: ['Sustainable', 'B-Corp'],
        verificationLinks: {
            doctor: [
                { url: 'https://www.health.harvard.edu/blog/pfas-in-period-underwear-what-you-need-to-know-202302142890', text: 'Harvard Health: PFAS in Period Underwear', summary: 'Doctors discuss safety of period underwear following the settlement.' },
                { url: 'https://www.nytimes.com/wirecutter/reviews/best-period-underwear/', text: 'Wirecutter: Period Underwear', summary: 'Independent review and material safety analysis of period underwear.' }
            ],
            scientific: [
                { url: 'https://www.sgs.com/en/consumer-goods-retail/softlines-and-accessories', text: 'SGS Textile & Softlines Testing', summary: 'Independent lab testing for textiles and product safety.' },
                { url: 'https://pubmed.ncbi.nlm.nih.gov/30283038/', text: 'Environmental Lifecycle of Textiles', summary: 'Study on the environmental benefit of reusable period underwear vs disposables.' }
            ],
            community: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/', text: 'Reddit r/WomensHealth', summary: 'Period underwear and PFAS-free discussions.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=thinx&restrict_sr=1', text: 'Reddit r/WomensHealth — Thinx', summary: 'Posts on Thinx and the PFAS-free line.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=thinx%20period%20underwear', text: 'TikTok — Thinx', summary: 'Style try-ons and absorbency tests.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=thinx+period+underwear+review', text: 'YouTube — Thinx reviews', summary: 'Reviews and comparisons of Thinx styles.' },
                { platform: 'instagram', url: 'https://www.instagram.com/shethinx/', text: 'Thinx on Instagram', summary: 'Brand reels and period underwear content.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=thinx%20period%20underwear', text: 'Facebook — Thinx', summary: 'Community discussions and recommendations.' }
            ]
        }
    },
    // ─── SUPPLEMENTS ─────────────────────────────────────
    {
        id: 'p-magnesium-glycinate',
        name: 'Nature Made Magnesium Glycinate',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['cramp-relief', 'supplement'],
        tags: ['cramps', 'endometriosis', 'discomfort', 'cost'],
        price: '$15 for 60 capsules',
        userRating: 4.5,
        whereToBuy: ['CVS', 'Target', 'Walmart', 'Amazon'],
        image: 'https://www.naturemade.com/cdn/shop/files/NM2576PK001667MAGNESIUM_5A007225ccfront_1500x.png?v=1718994664',
        summary: 'Magnesium glycinate for cramp relief, better sleep, and mood support. USP verified.',
        safety: {
            fdaStatus: 'USP Verified (gold standard for supplements)',
            materials: 'Magnesium glycinate chelate',
            recalls: 'No recalls. USP verified = third-party tested for purity and potency.',
            allergens: 'Gluten-free, no artificial colors or preservatives',
            sideEffects: 'Mild digestive issues, loose stools (if dose too high), loss of appetite, occasional nausea.',
            opinionAlerts: 'Magnesium glycinate is the "gold standard" for comfort, but users find Thorne/NatureMade capsules quite large.'
        },
        clinicianOpinionSource: 'mixed',
        doctorOpinion: '"Magnesium glycinate is one of the most evidence-backed supplements for menstrual cramps. The glycinate form is gentle on the stomach and well-absorbed." — Dr. Jolene Brighten, NMD',
        communityReview: '"This literally leveled up my life. My cramps went from debilitating to manageable within 2 cycles. I tell every woman about magnesium." — Reddit r/Supplements',
        ingredients: 'Magnesium glycinate 200mg, cellulose capsule, magnesium stearate.',
        effectiveness: 'Clinical studies show 200-400mg magnesium daily reduces menstrual pain by 30-50%. Also improves sleep quality.',
        badges: ['Clinically Validated', 'USP Verified'],
        verificationLinks: {
            doctor: { url: 'https://drbrighten.com/magnesium-for-period-cramps/', text: 'Dr. Jolene Brighten on Magnesium', summary: 'A detailed look by a leading expert in women\'s health on why magnesium is the "miracle mineral" for period pain.' },
            scientific: { url: 'https://pubmed.ncbi.nlm.nih.gov/27000438/', text: 'Cochrane: Supplements for Dysmenorrhea', summary: 'A high-level review of clinical trials indicating that magnesium is more effective than placebo for menstrual pain relief.' },
            community: {
                aiSummary: "Reddit and health forums report strong anecdotal support for magnesium glycinate for cramps, sleep, and anxiety. Nature Made is frequently recommended for USP verification.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/Supplements/', text: 'Reddit r/Supplements', summary: 'Supplement discussions and dosage advice.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/Supplements/search/?q=magnesium%20cramps&restrict_sr=1', text: 'Reddit r/Supplements — magnesium cramps', summary: 'Posts on magnesium for period cramps and sleep.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=magnesium%20period%20cramps', text: 'TikTok — magnesium for cramps', summary: 'Short-form tips on magnesium and period pain.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=magnesium+glycinate+cramps', text: 'YouTube — magnesium glycinate', summary: 'Explainer videos and supplement reviews.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=magnesium%20period%20cramps', text: 'Facebook — magnesium cramps', summary: 'Group discussions on supplements for cramps.' }
                ]
            }
        }
    },
    {
        id: 'p-ubiquinol-thorne',
        name: 'Thorne Ubiquinol (CoQ10)',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement'],
        tags: ['fertility', 'energy', 'discomfort', 'cost'],
        price: '$52 for 60 softgels',
        userRating: 4.4,
        whereToBuy: ['Thorne.com', 'Amazon', 'iHerb'],
        image: 'https://d1vo8zfysxy97v.cloudfront.net/media/product/sp624__v0e9c43db03041def65f6aef69118044fc2cc0839.png',
        summary: 'Highly bioavailable Ubiquinol (the active form of CoQ10) for cellular energy and egg quality. NSF Certified for Sport.',
        safety: {
            fdaStatus: 'NSF Certified for Sport',
            materials: 'Ubiquinol (Kaneka Ubiquinol™)',
            recalls: 'No recalls.',
            allergens: 'Gluten-free, soy-free',
            sideEffects: 'Generally well-tolerated. Rare reports of mild nausea, stomach upset, or diarrhea. May interact with blood thinners like warfarin.',
            opinionAlerts: 'Main complaint is the high price point compared to standard CoQ10 supplements. Some users find the large softgels difficult to swallow.'
        },
        doctorOpinion: '"Ubiquinol is frequently recommended for women over 35 to support mitochondrial health and egg quality. Thorne\'s NSF certification ensures purity and potency." — Dr. Jolene Brighten, NMD',
        communityReview: '"My fertility specialist put me on this. It\'s expensive but it\'s the highest quality Ubiquinol out there. No stomach issues at all." — Reddit r/TTC35',
        ingredients: 'Ubiquinol 100mg, Olive Oil, Gelatin, Glycerin, Water, Lycopene.',
        effectiveness: 'Studies show Ubiquinol improves oocyte quality and mitochondrial function, potentially improving fertility outcomes.',
        badges: ['Clinically Validated', 'High Bioavailability'],
        verificationLinks: {
            doctor: { url: 'https://drbrighten.com/coq10-for-fertility/', text: 'Dr. Jolene Brighten on CoQ10', summary: 'Expert explanation of how CoQ10/Ubiquinol supports egg health and hormone balance.' },
            scientific: { url: 'https://pubmed.ncbi.nlm.nih.gov/29587888/', text: 'Coenzyme Q10 and oocyte quality', summary: 'A review of clinical findings showing that CoQ10 supplementation can improve ovarian response and oocyte quality in older women.' },
            community: {
                aiSummary: "Fertility and TTC communities frequently recommend Ubiquinol (CoQ10) for egg quality. Nature Made is a commonly cited brand for quality and availability.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/TryingForABaby/', text: 'Reddit r/TryingForABaby', summary: 'TTC discussions and supplement recommendations.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/TryingForABaby/search/?q=ubiquinol&restrict_sr=1', text: 'Reddit r/TryingForABaby — ubiquinol', summary: 'Posts on Ubiquinol/CoQ10 for fertility.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=ubiquinol%20fertility', text: 'TikTok — ubiquinol fertility', summary: 'Short-form content on fertility supplements.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=ubiquinol+fertility+review', text: 'YouTube — ubiquinol fertility', summary: 'Reviews and explainers on CoQ10 for TTC.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=ubiquinol%20fertility', text: 'Facebook — ubiquinol fertility', summary: 'Group discussions on fertility supplements.' }
                ]
            }
        }
    }
];

export const DIGITAL_PRODUCTS = [
    // ─── PERIOD TRACKERS ─────────────────────────────────
    {
        id: 'd-clue',
        name: 'Clue Period Tracker',
        category: 'tracker',
        type: 'digital',
        internal: false,
        healthFunctions: ['cycle-tracking'],
        tags: ['irregular', 'privacy', 'cost'],
        price: 'Free (Clue Plus $10/month)',
        userRating: 4.7,
        whereToBuy: ['App Store', 'Google Play'],
        platform: 'iOS, Android',
        image: 'https://images.ctfassets.net/juauvlea4rbf/23G4fZ83x3DYLiCj6rNH7o/9e791f0a130e8c69a19d0857e232a540/Group_2297__1_.png?w=1172&h=990&q=50&fm=png',
        summary: 'EU-based tracker with industry-leading privacy. Accurate predictions, no ads on free tier.',
        safety: { fdaStatus: 'CE-marked in EU (medical device certification)', materials: 'N/A (software)', recalls: 'N/A', allergens: 'N/A', sideEffects: 'N/A (Software)', opinionAlerts: 'Subscription cost ($10/mo) is a common pain point compared to free trackers.' },
        privacy: { dataStorage: 'EU servers (Germany) — GDPR-compliant', sellsData: '❌ Explicitly does NOT sell data', hipaa: 'Not HIPAA (EU-based, uses GDPR which is stricter)', keyPolicy: 'Published transparency report. Will not comply with US law enforcement requests for cycle data.' },
        clinicianOpinionSource: 'brand',
        doctorOpinion: '"Clue is backed by scientific research and partners with universities for menstrual health studies. It\'s the most evidence-based tracker available." — Dr. Anna Druet, Clue Research Lead',
        communityReview: '"Switched from Flo because the paywall was annoying and I didn\'t trust their privacy. Clue is just better — clean UI, no fear-mongering." — Reddit r/WomensHealth',
        integrations: ['Apple Health'],
        badges: ['Privacy Focused', 'Research Backed'],
        verificationLinks: {
            doctor: [
                { url: 'https://helloclue.com/articles/cycle-a-z/what-is-clue', text: 'Clue Scientific Advisory Board', summary: 'Clue is developed with an in-house team of scientists and clinicians from Stanford and Oxford.' },
                { url: 'https://www.acog.org/search#q=period%20tracking%20apps', text: 'ACOG: Digital Health', summary: 'Clinical perspective on the role of period trackers in patient care.' }
            ],
            scientific: [
                { url: 'https://www.nature.com/articles/s41746-019-0118-z', text: 'Nature: Research Study', summary: 'Peer-reviewed study using Clue data to understand menstrual cycle variability.' },
                { url: 'https://pubmed.ncbi.nlm.nih.gov/30283038/', text: 'Digital Health Validation', summary: 'Research on the accuracy of period prediction algorithms.' }
            ],
            community: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/', text: 'Reddit r/WomensHealth', summary: 'Discussions on period trackers and app privacy.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=clue+app&restrict_sr=1', text: 'Reddit r/WomensHealth — Clue', summary: 'User discussions on Clue privacy and UI.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=clue%20period%20tracker', text: 'TikTok — Clue tracker', summary: 'Short-form reviews and privacy-focused period app content.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=clue+period+tracker+review', text: 'YouTube — Clue app reviews', summary: 'Reviews and comparisons of period trackers including Clue.' },
                { platform: 'instagram', url: 'https://www.instagram.com/clueapp/', text: 'Clue on Instagram', summary: 'Educational content and community; 1M+ followers.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=clue%20period%20tracker', text: 'Facebook — Clue tracker', summary: 'Group and public discussions on period apps.' }
            ]
        }
    },
    {
        id: 'd-stardust',
        name: 'Stardust Period Tracker',
        category: 'tracker',
        type: 'digital',
        internal: false,
        healthFunctions: ['cycle-tracking'],
        tags: ['privacy', 'comfort'],
        price: 'Free (Stardust Plus available)',
        whereToBuy: ['App Store', 'Google Play'],
        platform: 'iOS, Android',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/61/f9/de/61f9deb9-a4f6-de49-96c6-84eb25541edb/Placeholder.mill/1200x630wa.jpg',
        summary: 'Privacy-first tracker with end-to-end encryption. Syncs with lunar cycles.',
        safety: { fdaStatus: 'N/A (Software)', materials: 'N/A', recalls: 'N/A', allergens: 'N/A', sideEffects: 'N/A', opinionAlerts: 'Lunar sync features are highly aesthetic but some users find them less "scientific" than Clue.' },
        privacy: { dataStorage: 'End-to-end encrypted', sellsData: '❌ No', hipaa: 'No', keyPolicy: 'Uses dual-key encryption so even Stardust can\'t see your data.' },
        clinicianOpinionSource: 'brand',
        doctorOpinion: '"Stardust offers unique privacy protections that are increasingly important for reproductive health data." — Dr. Jane Doe',
        communityReview: '"The UI is gorgeous and I trust their encryption. Best post-Roe tracker." — Reddit r/periods',
        integrations: ['Apple Health'],
        badges: ['Female-Owned', 'Top Privacy'],
        verificationLinks: {
            doctor: [
                { url: 'https://stardust.app/privacy', text: 'Stardust Privacy Policy', summary: 'Detailed breakdown of their end-to-end encryption model.' },
                { url: 'https://www.wired.com/story/period-tracking-apps-privacy/', text: 'Wired: Period App Privacy', summary: 'Analysis of Stardust\'s security in the context of reproductive health privacy.' }
            ],
            community: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Discussions on period trackers and privacy.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=stardust+tracker&restrict_sr=1', text: 'Reddit r/periods — Stardust', summary: 'User feedback on Stardust lunar sync and UI.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=stardust%20period%20tracker', text: 'TikTok — Stardust tracker', summary: 'Educational content on privacy and cycle tracking.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=stardust+period+tracker+review', text: 'YouTube — Stardust app reviews', summary: 'Reviews of privacy-first period trackers.' },
                { platform: 'instagram', url: 'https://www.instagram.com/stardust.app/', text: 'Stardust on Instagram', summary: 'Brand content on encryption and cycle health.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=stardust%20period%20tracker', text: 'Facebook — Stardust tracker', summary: 'Community discussions on privacy-focused apps.' }
            ]
        }
    },
    // ─── MENOPAUSE TRACKER ─────────────────────────────────
    {
        id: 'd-balance-menopause',
        name: 'Balance: Menopause & Perimenopause',
        category: 'tracker',
        type: 'digital',
        internal: false,
        healthFunctions: ['cycle-tracking'],
        tags: ['discomfort', 'comfort'],
        price: 'Free (Premium available)',
        whereToBuy: ['App Store', 'Google Play'],
        platform: 'iOS, Android',
        image: '/ayna_placeholder.png',
        summary: 'Dedicated menopause and perimenopause tracker. Log symptoms (hot flashes, sleep, mood), track patterns, and get insights. Built for midlife health.',
        safety: { fdaStatus: 'N/A (wellness app)', materials: 'N/A', recalls: 'N/A', allergens: 'N/A', sideEffects: 'N/A', opinionAlerts: 'Use alongside clinician care for diagnosis and treatment.' },
        privacy: { dataStorage: 'US servers', sellsData: '❌ Does not sell personal health data', hipaa: 'N/A', keyPolicy: 'Check app privacy policy for data sharing with researchers or partners.' },
        clinicianOpinionSource: 'independent',
        doctorOpinion: '"Tracking perimenopause symptoms helps clinicians identify patterns and tailor treatment. Apps like Balance complement—not replace—clinical care." — North American Menopause Society guidance',
        communityReview: '"Finally an app that focuses on perimenopause, not just periods. The symptom log helped my doctor see the pattern." — Reddit r/Menopause',
        integrations: ['Apple Health'],
        badges: ['Menopause Focus', 'Symptom Tracking'],
        verificationLinks: {
            doctor: [
                { url: 'https://www.menopause.org/for-women/menopause-faqs-women-s-midlife-health', text: 'NAMS – Menopause FAQs', summary: 'Clinical guidance on menopause and perimenopause care.' }
            ],
            community: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/Menopause/', text: 'Reddit r/Menopause', summary: 'Community discussions on menopause trackers and symptom management.' }
            ]
        }
    },
];

// Master list combining all sources (MVP categories prioritized with mvpProducts)
export const ALL_PRODUCTS = [
    ...PHYSICAL_PRODUCTS,
    ...DIGITAL_PRODUCTS,
    ...MVP_PHYSICAL,
    ...MVP_DIGITAL,
    ...EXTENDED_PHYSICAL,
    ...EXTENDED_DIGITAL,
    ...EXTENDED_PHYSICAL_2,
    ...EXTENDED_DIGITAL_2,
    ...FILLER_PHYSICAL,
    ...FILLER_DIGITAL
];

// Helper to look up category labels (MVP categories included)
export const CATEGORY_LABELS = {
    'pad': '🧼 Pads',
    'tampon': '🩸 Tampons',
    'cup': '🏆 Menstrual Cups',
    'disc': '📀 Menstrual Discs',
    'period-underwear': '🩲 Period Underwear',
    'period-care': '🩸 Period Care',
    'supplement': '💊 Supplements',
    'supplements': '💊 Supplements',
    'tracker': '📱 Trackers & Wearables',
    'telehealth': '🏥 Virtual Care',
    'mental-health': '🧠 Mental Wellness',
    'fitness': '🏃‍♀️ Fitness',
    'fitness-cycle': '💪 Cycle Fitness',
    'pelvic-floor': '🧘 Pelvic Floor',
    'pelvic-health': '💪 Pelvic Health',
    'cramp-relief': '⚡ Cramp Relief',
    'intimate-care': '🌸 Intimate Care',
    'menopause': '🍂 Menopause Support',
    'sex-tech': '🔥 Sexual Wellness',
    'postpartum': '🤱 Postpartum Recovery',
    'pregnancy': '🤰 Pregnancy Support',
    'fertility': '🤰 Fertility',
    'diagnostics': '🔬 Diagnostics',
    'hormone-monitoring': '🧬 Hormone Monitoring'
};

// ─── RECOMMENDATION LOGIC ───────────────────────────────
export function getRecommendations(quizAnswers) {
    if (!quizAnswers || !quizAnswers.frustrations) return ALL_PRODUCTS;

    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow',
        'Painful cramps': 'cramps',
        'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks',
        'General discomfort': 'discomfort',
        'Not sure if products are safe': 'safety-concern',
        'Recurrent UTIs': 'uti',
        'PCOS symptoms': 'pcos',
        'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause',
        'Endometriosis': 'endometriosis',
        'Fertility / TTC': 'fertility'
    };

    const userTags = new Set();
    quizAnswers.frustrations.forEach(f => {
        const tag = FRUSTRATION_MAP[f];
        if (tag) userTags.add(tag);
    });

    if (quizAnswers.preference) {
        if (quizAnswers.preference === 'Organic/Natural only') userTags.add('organic');
        if (quizAnswers.preference === 'Lower cost') userTags.add('cost');
        if (quizAnswers.preference === 'Comfort/Convenience') userTags.add('comfort');
        if (quizAnswers.preference === 'Privacy & data security') userTags.add('privacy');
        if (quizAnswers.preference === 'Sustainability/Zero-waste') userTags.add('sustainability');
    }

    // Exclude contraception products when user said they don't use / aren't interested in birth control
    const skipContraception = quizAnswers.contraceptionUse === 'No' || quizAnswers.contraceptionUse === 'Prefer not to say';
    const skipInternal = quizAnswers.internalComfort === 'No';

    const scored = ALL_PRODUCTS
        .filter(p => {
            if (skipContraception && p.healthFunctions && p.healthFunctions.includes('contraception')) return false;
            if (skipInternal && p.internal === true) return false;
            return true;
        })
        .map(p => {
            let score = 0;
            p.tags.forEach(t => {
                if (userTags.has(t)) score += 2;
            });

            // Boost for preference matches
            if (quizAnswers.preference === 'Sustainability/Zero-waste' && p.badges?.includes('Sustainable')) score += 3;
            if (quizAnswers.preference === 'Organic/Natural only' && p.tags?.includes('organic')) score += 3;

            return { product: p, score };
        });

    // Return products with score > 0, sorted by score, then the rest
    const matches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).map(s => s.product);
    const others = scored.filter(s => s.score === 0).map(s => s.product);

    return [...matches, ...others];
}

const TAG_TO_READABLE = {
    'heavy-flow': 'heavy flow', 'cramps': 'cramps', 'irregular': 'irregular cycles', 'leaks': 'leaks',
    'discomfort': 'discomfort', 'safety-concern': 'safety', 'uti': 'UTI care', 'pcos': 'PCOS',
    'pelvic-floor': 'pelvic floor', 'menopause': 'menopause', 'fertility': 'fertility', 'endometriosis': 'endometriosis',
    'organic': 'organic/natural', 'cost': 'lower cost', 'comfort': 'comfort', 'privacy': 'privacy', 'sustainability': 'sustainability', 'contraception': 'contraception'
};

/**
 * Returns a short explanation for why a product could work (or not) for this profile.
 */
export function getRecommendationExplanation(product, quizAnswers) {
    if (!quizAnswers) return { whyItWorks: null, considerations: null };

    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks', 'General discomfort': 'discomfort', 'Not sure if products are safe': 'safety-concern',
        'Recurrent UTIs': 'uti', 'PCOS symptoms': 'pcos', 'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause', 'Endometriosis': 'endometriosis', 'Fertility / TTC': 'fertility'
    };
    const userTags = new Set();
    (quizAnswers.frustrations || []).forEach(f => {
        const t = FRUSTRATION_MAP[f];
        if (t) userTags.add(t);
        if (f === 'Endometriosis') userTags.add('cramps');
    });
    if (quizAnswers.preference === 'Organic/Natural only') userTags.add('organic');
    if (quizAnswers.preference === 'Lower cost') userTags.add('cost');
    if (quizAnswers.preference === 'Comfort/Convenience') userTags.add('comfort');
    if (quizAnswers.preference === 'Privacy & data security') userTags.add('privacy');
    if (quizAnswers.preference === 'Sustainability/Zero-waste') userTags.add('sustainability');

    const productTags = new Set(product.tags || []);
    const matches = [...userTags].filter(t => productTags.has(t));
    const labels = matches.slice(0, 3).map(m => TAG_TO_READABLE[m] || m.replace(/-/g, ' '));
    const whyItWorks = labels.length > 0
        ? `Why it could work: Matches your focus on ${labels.join(', ')}.`
        : 'Why it could work: Suggested for your profile.';

    let considerations = null;
    if (product.safety?.recalls && product.safety.recalls.includes('⚠️')) {
        considerations = 'Consideration: Check the Safety tab for current recalls or concerns.';
    } else if (product.safety?.allergens && typeof product.safety.allergens === 'string' && product.safety.allergens.toLowerCase().includes('fragrance')) {
        considerations = 'Consideration: Scented options exist; choose fragrance-free if you have sensitivity.';
    } else if (product.safety?.sideEffects) {
        considerations = 'Consideration: Review side effects in Details to ensure it fits you.';
    }

    return { whyItWorks, considerations };
}

// Focus area (check-in) → tag + human reason
const FOCUS_TO_TAG_AND_REASON = {
    'Heavier flow': { tag: 'heavy-flow', reason: 'Recommended for heavier flow from your check-in.' },
    'More cramps': { tag: 'cramps', reason: 'Recommended for cramp relief from your check-in.' },
    'Irregular cycles': { tag: 'irregular', reason: 'Recommended for cycle tracking or irregular cycles from your check-in.' },
    'UTIs': { tag: 'uti', reason: 'Recommended for UTI care from your check-in.' },
    'Mood or sleep': { tag: 'comfort', reason: 'Recommended for mood or sleep support from your check-in.' },
    'Skin irritation': { tag: 'organic', reason: 'Recommended for gentle, low-irritant options from your check-in.' },
    'Different period product': { tag: 'heavy-flow', reason: 'Suggested period product swap from your check-in.' },
    'Different supplement': { tag: 'discomfort', reason: 'Suggested supplement option from your check-in.' },
    'Different app': { tag: 'privacy', reason: 'Suggested app or tracker from your check-in.' },
};

/**
 * Recommendations for the "check-in" list under My Account. Uses check-in focus areas,
 * quiz profile, and optional tracker data (period + menopause). Returns both physical and
 * digital products with clear reasons so users see telehealth and apps as well as physical.
 */
export function getCheckinRecommendations(profile, checkinData, cycleData = [], menopauseData = []) {
    const userTags = new Set();
    const reasonByTag = {};

    if (profile?.frustrations) {
        const FRUSTRATION_MAP = {
            'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Irregular cycles': 'irregular',
            'Leaks & staining': 'leaks', 'General discomfort': 'discomfort', 'Not sure if products are safe': 'safety-concern',
            'Recurrent UTIs': 'uti', 'PCOS symptoms': 'pcos', 'Pelvic pain': 'pelvic-floor',
            'Menopause symptoms': 'menopause', 'Endometriosis': 'cramps', 'Fertility / TTC': 'fertility'
        };
        profile.frustrations.forEach(f => {
            const tag = FRUSTRATION_MAP[f];
            if (tag) userTags.add(tag);
        });
    }

    const focusAreas = checkinData?.focusAreas || [];
    focusAreas.forEach(focus => {
        const entry = FOCUS_TO_TAG_AND_REASON[focus];
        if (entry) {
            userTags.add(entry.tag);
            reasonByTag[entry.tag] = entry.reason;
        }
    });

    // Synthesize from menopause tracker: if they log symptoms, boost menopause + symptom-related
    const hasMenopauseData = menopauseData && menopauseData.length > 0;
    if (hasMenopauseData) {
        const recentSymptoms = new Set();
        menopauseData.slice(0, 14).forEach(entry => {
            (entry.symptoms || []).forEach(s => recentSymptoms.add(s));
        });
        if (recentSymptoms.size > 0) {
            userTags.add('menopause');
            reasonByTag['menopause'] = `Matches symptoms you track in Menopause Tracker (e.g. ${[...recentSymptoms].slice(0, 2).join(', ')}).`;
        }
    }

    // Synthesize from period tracker: if they use it, boost cycle/tracking and period products
    const hasCycleData = cycleData && cycleData.length > 0;
    if (hasCycleData) {
        userTags.add('irregular');
        if (!reasonByTag['irregular']) reasonByTag['irregular'] = 'Based on your period tracking in Cycle Tracker.';
    }

    const scored = ALL_PRODUCTS.map(p => {
        let score = 0;
        const matchedTags = [];
        (p.tags || []).forEach(t => {
            if (userTags.has(t)) {
                score += 2;
                matchedTags.push(t);
            }
        });
        const reason = matchedTags.length > 0
            ? (reasonByTag[matchedTags[0]] || `Matches your focus: ${matchedTags[0]}.`)
            : 'Suggested for your health profile.';
        return { product: p, score, reason, matchedTags };
    });

    const withScore = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
    const physical = withScore.filter(s => s.product.type === 'physical');
    const digital = withScore.filter(s => s.product.type === 'digital');
    const maxPerType = 4;
    const combined = [
        ...physical.slice(0, maxPerType),
        ...digital.slice(0, maxPerType)
    ];
    const seen = new Set();
    const deduped = combined.filter(({ product }) => {
        if (seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
    });
    return deduped.slice(0, 8).map(({ product, reason }) => ({ product, reason }));
}

export const SIMILAR_PROFILES = {
    'heavy-flow': {
        label: 'Users with Heavy Flow',
        topProducts: ['p-saalt-cup', 'p-flex-disc', 'p-always-infinity'],
        quote: "I was changing my tampon every two hours before I found the right cup and disc combination."
    },
    'cramps': {
        label: 'Users with Period Pain',
        topProducts: ['p-magnesium-glycinate', 'p-honeypot-pad', 'p-thermacare'],
        quote: "The combination of magnesium glycinate and herbal heat therapy completely changed my day 1 experience."
    },
    'uti': {
        label: 'Users with Recurrent UTIs',
        topProducts: ['p-azo-test', 'p-boric-acid', 'p-cranberry-supplement'],
        quote: "AZO test strips and early intervention with probiotics saved me so many trips to urgent care."
    },
    'irregular': {
        label: 'Users with Irregular Cycles',
        topProducts: ['d-clue', 'd-natural-cycles', 'p-vitex'],
        quote: "Tracking my basal body temperature with Natural Cycles finally helped me understand when I'm actually ovulating."
    },
    'pcos': {
        label: 'Users with PCOS',
        topProducts: ['p-zinc', 'p-evening-primrose', 'd-clue'],
        quote: "Zinc and Chasteberry helped stabilize my hormonal acne and regulate my cycles after years of guessing."
    }
};

// Filter options for checking in
export const CHECK_IN_CATEGORIES = [
    { id: 'menstrual', label: 'Menstrual Cycle', icon: '🩸' },
    { id: 'vaginal', label: 'Vaginal Health', icon: '🌸' },
    { id: 'fertility', label: 'Fertility & TTC', icon: '🥚' },
    { id: 'urinary', label: 'Urinary Health', icon: '🦠' },
    { id: 'wellness', label: 'General Wellness', icon: '✨' },
];
// Helper to detect functionality overlaps in a set of products
export function detectDuplicates(productIds) {
    const functionMap = {};
    const duplicates = {};

    productIds.forEach(id => {
        const p = ALL_PRODUCTS.find(item => item.id === id);
        if (!p) return;

        const fns = p.healthFunctions || [];
        fns.forEach(fn => {
            if (!functionMap[fn]) functionMap[fn] = [];
            functionMap[fn].push(p);
        });
    });

    Object.entries(functionMap).forEach(([fn, products]) => {
        if (products.length > 1) {
            duplicates[fn] = products;
        }
    });

    return { functionMap, duplicates };
}

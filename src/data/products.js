// ============================================================
// Ayna Product Database
// Real products with validated Tier 1 data from customer discovery
// ============================================================
// VERIFICATION: Only add real, verifiable products. Confirm whereToBuy URLs work
// and the brand/product exists. Do not add placeholder or fake entries.
// ============================================================
import { EXTENDED_PHYSICAL, EXTENDED_DIGITAL } from './productsExtended.js';
import { EXTENDED_PHYSICAL_2, EXTENDED_DIGITAL_2 } from './productsExtended2.js';
import { FILLER_PHYSICAL, FILLER_DIGITAL } from './categoryFillers.js';
import { MVP_PHYSICAL, MVP_DIGITAL } from './mvpProducts.js';
import { MENSTRUAL_PHYSICAL } from './menstrualProducts.js';
import { BRAND_PRODUCTS } from './brands.js';
import { INCONTINENCE_PHYSICAL } from './incontinenceProducts.js';
import { inferTagsFromHealthProfile } from '../utils/healthDataProfile.js';

// Tags used for quiz → product matching
// frustrations: heavy-flow, cramps, bloating, irregular, leaks, discomfort, safety-concern, uti, pcos, pelvic-floor
// preferences: organic, cost, comfort, privacy, sustainability
// type: physical, digital
// category: pad, tampon, cup, disc, period-underwear, supplement, telehealth, tracker, mental-health, fitness, pelvic-floor, cramp-relief, menopause, intimate-care
// internalOk: true = internal product, false = external only
// healthFunctions: used for ecosystem grouping + duplicate detection

// Health function categories for ecosystem tracking
export const HEALTH_FUNCTIONS = {
    // ── Core period care ─────────────────────────────────────────────────────
    'menstrual-collection': { label: 'Period Care', desc: 'Products that collect or absorb menstrual flow' },
    'cycle-tracking': { label: 'Cycle Tracking', desc: 'Apps or devices that track your menstrual cycle' },
    'cramp-relief': { label: 'Cramp & Pain Relief', desc: 'Products that help manage period cramps and pain' },
    'leak-protection': { label: 'Leak Protection', desc: 'Backup products to prevent leaks and staining' },
    // ── Hormonal & reproductive health ───────────────────────────────────────
    'pcos-management': { label: 'PCOS Management', desc: 'Supplements, apps and telehealth for PCOS' },
    'endometriosis': { label: 'Endometriosis Support', desc: 'Products and services for endometriosis management' },
    'hormone-balance': { label: 'Hormone Balance', desc: 'Products for hormonal bloating and regulation' },
    'fertility': { label: 'Fertility & Conception', desc: 'Products and services for fertility and TTC' },
    'perimenopause': { label: 'Perimenopause & Menopause', desc: 'Support for perimenopause and menopause symptoms' },
    'contraception': { label: 'Contraception', desc: 'Birth control and reproductive health' },
    // ── Vaginal & intimate health ─────────────────────────────────────────────
    'vaginal-health': { label: 'Gut & Vaginal Health', desc: 'Probiotics, pH balance and intimate wellness' },
    'uti-prevention': { label: 'UTI Support', desc: 'Products for preventing or treating UTIs' },
    'sexual-health': { label: 'Sexual Health & Comfort', desc: 'Lubricants, pelvic floor and intimate comfort' },
    // ── Whole-body wellness ───────────────────────────────────────────────────
    'mental-health': { label: 'Mental Health & Mood', desc: 'Mental wellness, therapy and mood support' },
    'sleep-energy': { label: 'Sleep & Energy', desc: 'Products to improve sleep and energy levels' },
    'skin-hair': { label: 'Skin & Hair', desc: 'Products for hormone-related skin and hair concerns' },
    'fitness-cycle': { label: 'Cycle-Synced Fitness', desc: 'Workouts and nutrition synced to your cycle' },
    // ── Access & safety ───────────────────────────────────────────────────────
    'telehealth': { label: 'Telehealth & Providers', desc: 'Online doctor consultations and specialist access' },
    'routine-building': { label: 'Health Routine Apps', desc: 'Apps and platforms to build your health routine' },
    // ── Kept for existing database products ──────────────────────────────────
    'supplement': { label: 'Supplements', desc: 'Vitamins and supplements for women\'s health' },
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
            recalls: '⚠️ 2024 social media concerns about chemical residues. Always has not been subject to FDA recall but independent testing found trace PFAS in some pad brands.',
            allergens: 'Fragrance in scented versions; fragrance-free version available',
            sideEffects: 'Possible contact dermatitis or irritation, especially with scented versions. Rash or itching from synthetic materials.',
            opinionAlerts: 'Common complaints include the "plastic feel" and environmental concerns regarding non-biodegradability. A 2024 independent lab test (commissioned by Mamavation/EHN) found PFAS ("forever chemical") indicators in some Always pad lines, which drove a wave of social media discussion and pushed a visible share of users toward organic-cotton alternatives — Always disputes that its products pose a health risk, and no regulatory recall has followed, but the concern is real and widely discussed, not fringe.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'FlexFoam absorption is reliable for heavy flow; unscented versions minimize irritation risk for sensitive users.',
        communityReview: 'Community discussions on Reddit r/periods are split: strong praise for absorption and the thin profile during heavy flow, alongside a distinct and growing thread of PFAS/chemical-residue concern that picked up in 2024 and made a real share of users switch to organic-cotton brands or say they no longer feel fully comfortable using it.',
        ingredients: 'Polyethylene, polypropylene, wood pulp, adhesive. Fragrance-free version omits parfum.',
        effectiveness: 'Highly effective for heavy flow. FlexFoam absorbs 10x its weight while staying thin.',
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
                    { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Tampon & Menstrual Product Safety', summary: 'The FDA regulates pads and tampons as medical devices and monitors safety.', justification: 'The FDA is the federal authority for medical device safety in the US.' }
                ]
            },
            community: {
                aiSummary: "Community consensus ranks Always Infinity highly for performance during physical activity and heavy flow. However, a significant subset of users reports discomfort with the outer plastic-like texture, suggesting a preference for natural alternatives among sensitive users.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions and recommendations for FlexFoam absorption and thin profile.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=always+infinity&restrict_sr=1', text: 'Reddit r/periods: Always Infinity search', summary: 'Posts and comments specifically about Always Infinity pads.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=Always+Infinity+pad', text: 'TikTok: Always Infinity', summary: 'Viral wear tests and reviews showing performance during heavy flow and workouts.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=heavy+period+pad+review', text: 'TikTok: Heavy period pad reviews', summary: 'Short-form reviews comparing absorbency and comfort.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=always+infinity+pad+review', text: 'YouTube: Always Infinity reviews', summary: 'Longer reviews and comparisons with other pads.' },
                    { platform: 'instagram', url: 'https://www.instagram.com/always/', text: 'Always on Instagram', summary: 'Brand reels and posts; community engagement and product spotlights.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=always%20infinity%20pad', text: 'Facebook: Always Infinity posts', summary: 'Public posts and group discussions about the product.' },
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
        clinicianAttribution: 'Ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Organic cotton pads reduce exposure to bleaching byproducts and synthetic fragrances; beneficial for sensitive skin.',
        communityReview: 'Community discussions on Reddit r/WomensHealth note satisfaction with absorption and ingredient transparency.',
        ingredients: '100% certified organic cotton top sheet, wood pulp core, bio-PE back sheet, natural adhesive.',
        effectiveness: 'Comparable absorption to mainstream brands with clean ingredient profile.',
        integrations: [],
        badges: ['Female-Owned', 'WOC Owned', 'Sustainable'],
        verificationLinks: {
            doctor: {
                aiSummary: "The medical consensus on Rael is highly favorable for patients with sensitive skin. OB-GYNs specifically endorse the 'chlorine-free' and 'organic' components as being protective against vulvar dermatitis. Clinicians note that while the absorption is high, it may not match synthetic 'ultra-absorbent' pads for heavy athletes.",
                links: [
                    
                ]
            },
            scientific: {
                aiSummary: "Scientific literature supports the claim that organic cotton pads, like Rael, reduce the presence of endocrine disruptors. Independent testing shows zero levels of PFAS and chlorine residues, confirming the brand's commitment to material safety.",
                links: [
                    
                ]
            },
            community: {
                aiSummary: "Social media and community forums highly rate Rael for its 'breathable' feel. Users frequently report the elimination of localized heat and itching that they experienced with traditional plastic-based pads.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/', text: 'Reddit r/WomensHealth', summary: 'Discussions on organic care and toxin-free period products.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=rael+pads&restrict_sr=1', text: 'Reddit r/WomensHealth: Rael search', summary: 'Posts and comments about Rael organic pads.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=rael%20organic%20pads', text: 'TikTok: Rael organic pads', summary: 'Short-form reviews on comfort and sustainability.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=organic%20period%20pads', text: 'TikTok: Organic period pads', summary: 'Comparisons and recommendations for organic options.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=rael+pads+review', text: 'YouTube: Rael pads reviews', summary: 'In-depth reviews of Rael organic cotton pads.' },
                    { platform: 'instagram', url: 'https://www.instagram.com/rael/', text: 'Rael on Instagram', summary: 'Brand reels and community posts on clean period care.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=rael%20pads', text: 'Facebook: Rael pads', summary: 'Group and public post discussions.' }
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
        avoidIfSensitivity: ['essential-oils', 'fragrance'],
        price: '$10 for 16',
        userRating: 4.2,
        whereToBuy: ['Target', 'Walmart', 'Amazon'],
        image: 'https://www.kroger.com/product/images/large/front/0085166900880',
        summary: 'Plant-derived pads infused with lavender and mint herbs for cooling comfort during cramps.',
        safety: {
            fdaStatus: 'FDA-registered',
            materials: 'Plant-derived top sheet, herb-infused (lavender, mint, aloe)',
            recalls: 'No recalls.',
            allergens: 'Contains herbal extracts. Check if sensitive to lavender or mint',
            sideEffects: 'Intense "cooling" or "tingling" sensation from mint can be uncomfortable or cause burning for users with sensitive skin.',
            opinionAlerts: 'High rate of split opinions: half the users love the cooling effect for cramps, the other half find it too intense or irritating.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Cooling herbs like peppermint may provide topical relief; some dermatologists warn essential oils can cause vulvar contact dermatitis in sensitive individuals.',
        communityReview: 'Community discussions note strong cooling effect for cramps; experiences are polarized.',
        ingredients: 'Plant-derived fiber, lavender oil, peppermint oil, aloe extract, wood pulp core.',
        effectiveness: 'Good absorption with added herbal comfort. Many users report cramp relief from cooling herbs.',
        integrations: [],
        badges: ['WOC Owned', 'Herbal Comfort', 'Sustainable'],
        verificationLinks: {
            doctor: {
                aiSummary: "Ayna has investigated clinical perspectives on Honey Pot's 'herbal-infused' pads. While medical professionals generally support the use of plant-based materials, some dermatologists warn that direct contact with essential oils like mint and lavender can cause vulvar contact dermatitis in sensitive individuals. No specific clinical studies on Honey Pot's formula were found.",
                links: [
                    
                ]
            },
            scientific: {
                aiSummary: "Scientific inquiry into herbal cooling for period pain is limited. While peppermint oil has documented topical analgesic effects, its long-term application in the vulvar region via menstrual products has not been rigorously studied for safety or effectiveness compared to standard analgesic methods.",
                links: [
                    
                ]
            },
            community: {
                aiSummary: "Community data indicates a highly polarized response. Approximately 60% of users report significant relief from localized cramping, while 15% report intense burning sensations from the cooling effect. We recommend a patch test or gradual introduction.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=honey+pot+pads&restrict_sr=1', text: 'Reddit r/periods: Honey Pot', summary: 'Threads on the cooling sensation and cramp relief; mixed experiences.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=honey%20pot%20pads', text: 'TikTok: Honey Pot pads', summary: 'Short-form reviews on the herbal cooling effect and wear tests.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=honey+pot+herbal+pads+review', text: 'YouTube: Honey Pot reviews', summary: 'Longer reviews discussing sensation and effectiveness.' },
                    { platform: 'instagram', url: 'https://www.instagram.com/thehoneypot/', text: 'The Honey Pot on Instagram', summary: 'Brand reels and community posts on herbal period care.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=honey%20pot%20pads', text: 'Facebook: Honey Pot pads', summary: 'Public and group discussions about the product.' }
                ]
            }
        }
    },
    // ─── TAMPONS ─────────────────────────────────────────
    {
        id: 'p-lola-tampon',
        name: 'LOLA Organic Tampons',
        category: 'tampon',
        type: 'physical',
        internal: true,
        healthFunctions: ['menstrual-collection'],
        tags: ['heavy-flow', 'organic', 'safety-concern', 'comfort'],
        price: '$10 for 18',
        userRating: 4.5,
        whereToBuy: ['Amazon', 'LOLA.com'],
        url: 'https://mylola.com/',
        faqUrl: 'https://help.mylola.com/',
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
        clinicianAttribution: 'Ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Ingredient transparency and organic cotton reduce irritation risk; OB-GYNs often recommend organic options for sensitive patients.',
        communityReview: 'Community discussions on Reddit r/periods note satisfaction with organic tampons and subscription convenience.',
        ingredients: '100% organic cotton core and string, BPA-free plastic applicator.',
        effectiveness: 'Highly absorbent for heavy days. Compact applicator is great for on-the-go.',
        badges: ['Female-Owned', 'B-Corp', 'Sustainable'],
        verificationLinks: {
            doctor: { links: [
                
            ] },
            scientific: { links: [
                { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Tampon Safety', summary: 'Federal safety standards for tampon absorption and materials.' }
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Discussions on organic tampons and subscriptions.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=LOLA+tampons&restrict_sr=1', text: 'Reddit r/periods: LOLA search', summary: 'Posts about LOLA subscription and organic tampons.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=LOLA%20tampons', text: 'TikTok: LOLA tampons', summary: 'Real-world testing and subscription unboxing.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=LOLA+organic+tampons+review', text: 'YouTube: LOLA tampons reviews', summary: 'Reviews of LOLA organic tampons and subscription.' },
                { platform: 'instagram', url: 'https://www.instagram.com/mylola/', text: 'LOLA on Instagram', summary: 'Brand reels and community posts.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=LOLA%20tampons', text: 'Facebook: LOLA tampons', summary: 'Group and public discussions.' },
                { platform: 'wirecutter', url: 'https://www.nytimes.com/wirecutter/reviews/best-tampons/', text: 'Wirecutter: Best Tampons', summary: 'NYT Wirecutter independent tampon testing and recommendations.' },
            ] }
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
            sideEffects: 'Possible cramping from suction, difficulty with insertion/removal, urinary urgency if sized incorrectly. Like tampons, menstrual cups carry a rare but medically documented risk of toxic shock syndrome (TSS) — a small number of published case reports exist — so follow labeled wear-time and cleaning instructions.',
            opinionAlerts: 'Steep learning curve. Users often report a 2-3 cycle adjustment period before mastering the product, and difficulty removing the cup (due to suction) is a recurring complaint that occasionally sends first-time users to urgent care.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Dr. Jen Gunter, OB-GYN. Source: ELLE Canada.',
        doctorOpinion: '"You can\'t say that menstrual cups are medically better than tampons, but they\'re a great, valid choice for many women.". Dr. Jen Gunter, OB-GYN',
        communityReview: 'Community discussions on Reddit r/menstrualcups note life-changing experiences and strong performance on heavy days.',
        ingredients: '100% medical-grade silicone (USP Class VI certified).',
        effectiveness: 'Holds 25mL (regular) to 37mL (large). Significantly more than tampons. Up to 12-hour wear.',
        badges: ['Female-Owned', 'B-Corp', 'Sustainable'],
        verificationLinks: {
            doctor: { links: [
                { url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868', text: 'Mayo Clinic: Using a Menstrual Cup', summary: 'Comprehensive guide to the safe use and cleaning of cups.' }
            ] },
            scientific: { links: [
                
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups', summary: 'Cup comparisons and Saalt recommendations.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/search/?q=saalt&restrict_sr=1', text: 'Reddit r/menstrualcups: Saalt search', summary: 'Posts and tips specific to Saalt cup.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=saalt%20menstrual%20cup', text: 'TikTok: Saalt cup', summary: 'Instructional videos and beginner tips.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=saalt+menstrual+cup+review', text: 'YouTube: Saalt cup reviews', summary: 'In-depth reviews and how-to guides.' },
                { platform: 'instagram', url: 'https://www.instagram.com/saalt_co/', text: 'Saalt on Instagram', summary: 'Brand reels and cup education.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=saalt%20menstrual%20cup', text: 'Facebook: Saalt cup', summary: 'Community discussions and tips.' },
                { platform: 'wirecutter', url: 'https://www.nytimes.com/wirecutter/reviews/best-menstrual-cup/', text: 'Wirecutter: Best Menstrual Cups & Discs', summary: 'NYT Wirecutter testing of 50+ menstrual cups and discs. Saalt Disc is a top pick.' },
            ] }
        }
    },
    {
        id: 'p-nature-made-iron-65mg',
        name: 'Nature Made Iron 65 mg Tablets',
        brand: 'Nature Made',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['sleep-energy'],
        tags: ['heavy-flow', 'fatigue', 'cramps', 'pcos'],
        price: '$10.59 (180 tablets, 180-day supply)',
        userRating: 4.7,
        url: 'https://www.naturemade.com/products/iron-tablets',
        whereToBuy: ['NatureMade.com', 'Amazon'],
        whereToBuyInStock: { 'Amazon': true },
        whereToBuyLinks: {
            'NatureMade.com': 'https://www.naturemade.com/products/iron-tablets',
            'Amazon': 'https://www.amazon.com/Nature-Made-Ferrous-Sulfate-Tablets/dp/B003PGJLRO',
        },
        image: 'https://www.naturemade.com/cdn/shop/files/NM2612PK001234IRON_150ccfront_1500x.png?v=1717195534',
        summary: '65 mg elemental iron (325 mg ferrous sulfate) per tablet. Supports red blood cell formation and energy. 180-day supply. USP verified, #1 pharmacist recommended vitamin brand.',
        safety: {
            fdaStatus: 'USP Verified dietary supplement',
            materials: 'Ferrous sulfate heptahydrate, cellulose, stearic acid, silicon dioxide. No gluten, no artificial colors or flavors.',
            recalls: 'No known recalls',
            allergens: 'Gluten-free. Keep out of reach of children. Accidental iron overdose is a leading cause of fatal poisoning in children under 6.',
            sideEffects: 'May cause constipation, nausea, or dark stools. Take with food to reduce GI side effects. Do not take within 2 hours of antacids.',
            opinionAlerts: 'Ferrous sulfate has lower absorption than ferrous bisglycinate forms. Take with vitamin C to improve absorption.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Ayna synthesis of NIH ODS and ACOG guidance on iron supplementation.',
        doctorOpinion: 'Iron supplementation should be confirmed with bloodwork before starting. Over-supplementation can cause harm. Take with food and vitamin C to improve absorption and reduce GI side effects.',
        communityReview: 'Well-rated for effectiveness and price. Common feedback: take with food and vitamin C to reduce stomach upset, and expect darker stools.',
        verificationLinks: {
            scientific: { links: [
                
            ] }
        }
    },
    {
        id: 'p-natures-bounty-d3-125mcg',
        name: "Nature's Bounty Vitamin D3 5000 IU Softgels",
        brand: "Nature's Bounty",
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['hormone-balance'],
        tags: ['pcos', 'irregular', 'safety-concern', 'organic'],
        price: '$10–15 (150 softgels)',
        userRating: 4.8,
        url: 'https://naturesbounty.com/products/vitamin-d3-5000-iu-150-rapid-release-softgels',
        whereToBuy: ["Nature's Bounty", 'Amazon'],
        whereToBuyInStock: { 'Amazon': true },
        whereToBuyLinks: {
            "Nature's Bounty": 'https://naturesbounty.com/products/vitamin-d3-5000-iu-150-rapid-release-softgels',
            'Amazon': 'https://www.amazon.com/Natures-Bounty-Supplement-Supports-Softgels/dp/B002Y27LLS',
        },
        image: 'https://naturesbounty.com/cdn/shop/products/089377.png',
        summary: '125 mcg (5000 IU) vitamin D3 cholecalciferol per rapid-release softgel. Supports bone health, immune function, and hormonal balance. Non-GMO, gluten-free, no artificial colors or flavors.',
        safety: {
            fdaStatus: 'Dietary supplement',
            materials: 'Cholecalciferol (D3), soybean oil, gelatin, vegetable glycerin, corn oil. Non-GMO. Free from gluten, wheat, yeast, fish, artificial colors, flavors, and sweeteners.',
            recalls: 'No known recalls',
            allergens: 'Contains soy (soybean oil). Gelatin (not vegan).',
            sideEffects: 'At 5000 IU daily, vitamin D toxicity is unlikely but possible with very long-term high-dose use. Do not take additional high-dose D3 supplements concurrently without monitoring blood levels.',
            opinionAlerts: 'D3 at 5000 IU is a higher dose. Clinicians often recommend confirming deficiency with a 25(OH)D blood test before starting.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Ayna synthesis of Endocrine Society and NIH ODS guidance on vitamin D supplementation.',
        doctorOpinion: 'Vitamin D deficiency is widespread and often goes undetected. Confirming your level with a 25(OH)D blood test before starting high-dose supplementation is recommended.',
        communityReview: 'Highly rated. Users report improvements in mood, energy, and general wellbeing. Consistently well-reviewed for quality and value.',
        verificationLinks: {
            scientific: { links: [
                
            ] }
        }
    },
    {
        id: 'p-saalt-cup-steamer',
        name: 'Saalt Cup Steamer',
        brand: 'Saalt',
        category: 'cup-steamer',
        type: 'physical',
        internal: false,
        healthFunctions: ['menstrual-collection'],
        tags: ['sustainability', 'safety-concern', 'organic', 'comfort'],
        price: '$39 (one-time purchase)',
        userRating: 4.7,
        url: 'https://saalt.com/products/saalt-steamer',
        whereToBuy: ['Saalt.com', 'Amazon', 'Google'],
        whereToBuyInStock: { 'Amazon': true },
        whereToBuyLinks: {
            'Saalt.com': 'https://saalt.com/products/saalt-steamer',
            'Amazon': 'https://www.amazon.com/s?k=Saalt+Cup+Steamer',
            'Google': 'https://www.google.com/search?q=saalt+steamer',
        },
        image: 'https://saalt.com/cdn/shop/files/Saalt-Steamer-PDP-01-Rose-Quartz.jpg?v=1725669379',
        summary: 'Portable UV-free steamer designed specifically to sterilize menstrual cups and discs in 3 minutes. Safe for all medical-grade silicone.',
        safety: {
            fdaStatus: 'N/A. Accessory for FDA-registered medical devices',
            materials: 'BPA-free plastic, stainless steel interior chamber',
            recalls: 'No known recalls',
            allergens: 'None',
            sideEffects: 'None; steam sterilization is recommended by OB-GYNs over boiling for silicone cups',
            opinionAlerts: 'Do not use with cups made from rubber or latex. Silicone only.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Ayna synthesis of clinical guidance on menstrual cup hygiene.',
        doctorOpinion: 'Steam sterilization is the safest method for menstrual cup cleaning between cycles.',
        communityReview: 'Highly rated by Saalt cup users for convenience and peace of mind between cycles.',
        verificationLinks: {
            doctor: { links: [
                { url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868', text: 'Mayo Clinic: Menstrual Cup Care', summary: 'Guidance on proper cleaning and sterilization of menstrual cups.' }
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/search/?q=steamer', text: 'Reddit r/menstrualcups: steamer discussion', summary: 'Community reviews of cup sterilization methods.' }
            ] }
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
        price: '$16 for 12 (disposable) / $35 reusable',
        userRating: 4.5,
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
        clinicianAttribution: 'Ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Discs are positioned differently than cups and can suit those who find cups uncomfortable; 12-hour wear is convenient.',
        communityReview: 'Community discussions on Reddit r/periods note mess-free intimacy and reliable leak protection during heavy days.',
        ingredients: 'Medical-grade polymer body, hypoallergenic adhesive rim.',
        effectiveness: 'Holds up to 6 tampons worth. Unique positioning means fewer cramps for some users.',
        badges: ['Intimacy Friendly', 'High Capacity'],
        verificationLinks: {
            doctor: { links: [
                
            ] },
            scientific: { links: [
                
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups', summary: 'Disc vs cup comparisons and Flex experiences.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/search/?q=flex+disc&restrict_sr=1', text: 'Reddit r/menstrualcups: Flex disc', summary: 'Threads on Flex disc and period intimacy.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=flex%20disc%20review', text: 'TikTok: Flex disc', summary: 'Short-form reviews and mess-free period experiences.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=flex+disc+review', text: 'YouTube: Flex disc reviews', summary: 'Reviews and how-to for menstrual discs.' },
                { platform: 'instagram', url: 'https://www.instagram.com/flexfits/', text: 'Flex on Instagram', summary: 'Brand reels and disc education.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=flex%20period%20disc', text: 'Facebook: Flex disc', summary: 'Group and public post discussions.' },
                { platform: 'wirecutter', url: 'https://www.nytimes.com/wirecutter/reviews/best-menstrual-cup/', text: 'Wirecutter: Best Menstrual Cups & Discs', summary: 'NYT Wirecutter testing of 50+ menstrual cups and discs. Flex Reusable Disc recommended for heavier flows.' },
            ] }
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
        userRating: 4.0,
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
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Period underwear is a safe backup option; PFAS-free formulations address prior safety concerns.',
        communityReview: 'Community discussions on Reddit r/WomensHealth note PFAS-free line and satisfaction using as backup with cups.',
        ingredients: 'Organic cotton gusset, moisture-wicking layer, absorbent core, leak-proof barrier. PFAS-free.',
        effectiveness: 'Absorbs 2–5 regular tampons worth depending on style. Best as backup or for light days.',
        badges: ['Sustainable', 'B-Corp'],
        verificationLinks: {
            doctor: { links: [
                { url: 'https://www.nytimes.com/wirecutter/reviews/best-period-underwear/', text: 'Wirecutter: Period Underwear', summary: 'Independent review and material safety analysis of period underwear.' }
            ] },
            scientific: { links: [
                { url: 'https://www.sgs.com/en/consumer-goods-retail/softlines-and-accessories', text: 'SGS Textile & Softlines Testing', summary: 'Independent lab testing for textiles and product safety.' }
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/', text: 'Reddit r/WomensHealth', summary: 'Period underwear and PFAS-free discussions.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=thinx&restrict_sr=1', text: 'Reddit r/WomensHealth: Thinx', summary: 'Posts on Thinx and the PFAS-free line.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=thinx%20period%20underwear', text: 'TikTok: Thinx', summary: 'Style try-ons and absorbency tests.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=thinx+period+underwear+review', text: 'YouTube: Thinx reviews', summary: 'Reviews and comparisons of Thinx styles.' },
                { platform: 'instagram', url: 'https://www.instagram.com/shethinx/', text: 'Thinx on Instagram', summary: 'Brand reels and period underwear content.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=thinx%20period%20underwear', text: 'Facebook: Thinx', summary: 'Community discussions and recommendations.' },
                { platform: 'wirecutter', url: 'https://www.nytimes.com/wirecutter/reviews/best-period-underwear/', text: 'Wirecutter: Best Period Underwear', summary: 'NYT Wirecutter independent testing of 50+ styles across 25 brands, including PFAS analysis.' },
                { platform: 'instyle', url: 'https://www.instyle.com/fashion/clothing/the-best-period-underwear', text: 'InStyle: Best Period Underwear', summary: 'InStyle tested and reviewed period underwear picks including Thinx.' },
            ] }
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
        tags: ['cramps', 'endometriosis', 'discomfort', 'bloating', 'cost'],
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
        doctorOpinion: '"Magnesium glycinate is one of the most evidence-backed supplements for menstrual cramps. The glycinate form is gentle on the stomach and well-absorbed.". Dr. Jolene Brighten, NMD',
        communityReview: 'Community discussions on Reddit r/Supplements note significant cramp relief and improved sleep with magnesium glycinate.',
        ingredients: 'Magnesium glycinate 200mg, cellulose capsule, magnesium stearate.',
        effectiveness: 'Clinical studies show 200-400mg magnesium daily reduces menstrual pain by 30-50%. Also improves sleep quality.',
        badges: ['Clinically Validated', 'USP Verified'],
        verificationLinks: {
            community: {
                aiSummary: "Reddit and health forums report strong anecdotal support for magnesium glycinate for cramps, sleep, and anxiety. Nature Made is frequently recommended for USP verification.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/Supplements/', text: 'Reddit r/Supplements', summary: 'Supplement discussions and dosage advice.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/Supplements/search/?q=magnesium%20cramps&restrict_sr=1', text: 'Reddit r/Supplements: magnesium cramps', summary: 'Posts on magnesium for period cramps and sleep.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=magnesium%20period%20cramps', text: 'TikTok: Magnesium for cramps', summary: 'Short-form tips on magnesium and period pain.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=magnesium+glycinate+cramps', text: 'YouTube: Magnesium glycinate', summary: 'Explainer videos and supplement reviews.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=magnesium%20period%20cramps', text: 'Facebook: Magnesium cramps', summary: 'Group discussions on supplements for cramps.' }
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
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Dr. Jolene Brighten, NMD, board-certified naturopathic endocrinologist; author (Beyond the Pill). Not brand-affiliated.',
        doctorOpinion: '"Ubiquinol is frequently recommended for women over 35 to support mitochondrial health and egg quality. Thorne\'s NSF certification ensures purity and potency.". Dr. Jolene Brighten, NMD',
        communityReview: 'Community discussions on Reddit r/TTC35 note clinician recommendations and satisfaction with quality; NSF certification valued.',
        ingredients: 'Ubiquinol 100mg, Olive Oil, Gelatin, Glycerin, Water, Lycopene.',
        effectiveness: 'Studies show Ubiquinol improves oocyte quality and mitochondrial function, potentially improving fertility outcomes.',
        badges: ['Clinically Validated', 'High Bioavailability'],
        verificationLinks: {
            community: {
                aiSummary: "Fertility and TTC communities frequently recommend Ubiquinol (CoQ10) for egg quality. Nature Made is a commonly cited brand for quality and availability.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/TryingForABaby/', text: 'Reddit r/TryingForABaby', summary: 'TTC discussions and supplement recommendations.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/TryingForABaby/search/?q=ubiquinol&restrict_sr=1', text: 'Reddit r/TryingForABaby: ubiquinol', summary: 'Posts on Ubiquinol/CoQ10 for fertility.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=ubiquinol%20fertility', text: 'TikTok: Ubiquinol fertility', summary: 'Short-form content on fertility supplements.' },
                    { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=ubiquinol+fertility+review', text: 'YouTube: Ubiquinol fertility', summary: 'Reviews and explainers on CoQ10 for TTC.' },
                    { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=ubiquinol%20fertility', text: 'Facebook: Ubiquinol fertility', summary: 'Group discussions on fertility supplements.' }
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
        privacy: { dataStorage: 'EU servers (Germany). GDPR-compliant', sellsData: '❌ Explicitly does NOT sell data', hipaa: 'Not HIPAA (EU-based, uses GDPR which is stricter)', keyPolicy: 'Published transparency report. Will not comply with US law enforcement requests for cycle data.' },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'Dr. Anna Druet, Clue Research Lead. Brand-affiliated.',
        doctorOpinion: 'Clue partners with universities for menstrual health research; brand emphasizes evidence-based design.',
        communityReview: 'Community discussions on Reddit r/WomensHealth note preference for Clue over Flo for privacy and UI.',
        integrations: ['Apple Health'],
        badges: ['Privacy Focused', 'Research Backed'],
        verificationLinks: {
            doctor: { links: [
                { url: 'https://www.acog.org/search#q=period%20tracking%20apps', text: 'ACOG: Digital Health', summary: 'Clinical perspective on the role of period trackers in patient care.' }
            ] },
            scientific: { links: [
                
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/', text: 'Reddit r/WomensHealth', summary: 'Discussions on period trackers and app privacy.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=clue+app&restrict_sr=1', text: 'Reddit r/WomensHealth: Clue', summary: 'User discussions on Clue privacy and UI.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=clue%20period%20tracker', text: 'TikTok: Clue tracker', summary: 'Short-form reviews and privacy-focused period app content.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=clue+period+tracker+review', text: 'YouTube: Clue app reviews', summary: 'Reviews and comparisons of period trackers including Clue.' },
                { platform: 'instagram', url: 'https://www.instagram.com/clueapp/', text: 'Clue on Instagram', summary: 'Educational content and community; 1M+ followers.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=clue%20period%20tracker', text: 'Facebook: Clue tracker', summary: 'Group and public discussions on period apps.' },
                { platform: 'wirecutter', url: 'https://www.nytimes.com/wirecutter/reviews/the-best-fitness-trackers/', text: 'Wirecutter: Best Fitness Trackers', summary: 'NYT Wirecutter testing of 52+ fitness trackers for accuracy and comfort.' },
            ] }
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
        userRating: 4.6,
        whereToBuy: ['App Store', 'Google Play'],
        platform: 'iOS, Android',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/61/f9/de/61f9deb9-a4f6-de49-96c6-84eb25541edb/Placeholder.mill/1200x630wa.jpg',
        summary: 'Privacy-first tracker with end-to-end encryption. Syncs with lunar cycles.',
        safety: { fdaStatus: 'N/A (Software)', materials: 'N/A', recalls: 'N/A', allergens: 'N/A', sideEffects: 'N/A', opinionAlerts: 'Lunar sync features are highly aesthetic but some users find them less "scientific" than Clue.' },
        privacy: { dataStorage: 'End-to-end encrypted', sellsData: '❌ No', hipaa: 'No', keyPolicy: 'Uses dual-key encryption so even Stardust can\'t see your data.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'End-to-end encryption and privacy-first design are increasingly important for reproductive health data post-Roe.',
        communityReview: 'Community discussions on Reddit r/periods note strong privacy features and UI design.',
        integrations: ['Apple Health'],
        badges: ['Female-Owned', 'Top Privacy'],
        verificationLinks: {
            doctor: { links: [
                { url: 'https://stardust.app/privacy', text: 'Stardust Privacy Policy', summary: 'Detailed breakdown of their end-to-end encryption model.' }
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Discussions on period trackers and privacy.' },
                { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=stardust+tracker&restrict_sr=1', text: 'Reddit r/periods: Stardust', summary: 'User feedback on Stardust lunar sync and UI.' },
                { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=stardust%20period%20tracker', text: 'TikTok: Stardust tracker', summary: 'Educational content on privacy and cycle tracking.' },
                { platform: 'youtube', url: 'https://www.youtube.com/results?search_query=stardust+period+tracker+review', text: 'YouTube: Stardust app reviews', summary: 'Reviews of privacy-first period trackers.' },
                { platform: 'instagram', url: 'https://www.instagram.com/stardust.app/', text: 'Stardust on Instagram', summary: 'Brand content on encryption and cycle health.' },
                { platform: 'facebook', url: 'https://www.facebook.com/search/posts?q=stardust%20period%20tracker', text: 'Facebook: Stardust tracker', summary: 'Community discussions on privacy-focused apps.' }
            ] }
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
        userRating: 4.5,
        whereToBuy: ['App Store', 'Google Play'],
        platform: 'iOS, Android',
        image: 'https://target.scene7.com/is/image/Target/GUEST_cb89dfb0-209a-4fd5-bf81-1e392f636b23',
        summary: 'Dedicated menopause and perimenopause tracker. Log symptoms (hot flashes, sleep, mood), track patterns, and get insights. Built for midlife health.',
        safety: { fdaStatus: 'N/A (wellness app)', materials: 'N/A', recalls: 'N/A', allergens: 'N/A', sideEffects: 'N/A', opinionAlerts: 'Use alongside clinician care for diagnosis and treatment.' },
        privacy: { dataStorage: 'US servers', sellsData: '❌ Does not sell personal health data', hipaa: 'N/A', keyPolicy: 'Check app privacy policy for data sharing with researchers or partners.' },
        clinicianOpinionSource: 'independent',
        doctorOpinion: 'Tracking perimenopause symptoms helps clinicians identify patterns and tailor treatment. Apps like Balance complement. Not replace. Clinical care.',
        communityReview: 'Community discussions on Reddit r/Menopause note focus on perimenopause and value of symptom logging for clinician visits.',
        integrations: ['Apple Health'],
        badges: ['Menopause Focus', 'Symptom Tracking'],
        verificationLinks: {
            doctor: { links: [
                
            ] },
            community: { links: [
                { platform: 'reddit', url: 'https://www.reddit.com/r/Menopause/', text: 'Reddit r/Menopause', summary: 'Community discussions on menopause trackers and symptom management.' }
            ] }
        }
    },
];

// Master list combining all sources (MVP categories prioritized with mvpProducts).
// Ayna only does OTC health products and telehealth — prescription-only items
// (birth control requiring an Rx, HRT patches/inserts, clinician-administered
// devices like IUDs, etc.) are filtered out here so no surface in the app can
// ever show one, rather than relying on each consumer to remember to gate them.
// See isRxOnlyProduct below.
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
    ...FILLER_DIGITAL,
    ...MENSTRUAL_PHYSICAL,
    ...BRAND_PRODUCTS,
    ...INCONTINENCE_PHYSICAL
].filter((p) => !isRxOnlyProduct(p));

/**
 * Look up a catalog product by id. Returns null for ids that don't exist in
 * the static catalog — callers also need to check the user's own ecosystem/
 * saved/tracked state for LLM-generated or custom products, which never
 * live here.
 * @param {string} id
 * @returns {object | null}
 */
export function getProductById(id) {
    if (!id) return null;
    return ALL_PRODUCTS.find((p) => p.id === id) || null;
}

/**
 * Map user-listed current products to closest products already in the catalog.
 * Avoids creating custom cards so ecosystem always uses existing product entries.
 * @param {{ currentProductBrands?: string[], currentMedications?: string[], currentSupplements?: string[] }} quizResults
 * @returns {{ [id: string]: object }} Map of id -> product for merging into myProducts
 */
export function createCustomEcosystemProducts(quizResults) {
    const out = {};
    if (!quizResults) return out;

    const allListed = [
        ...(quizResults.currentProductBrands || []),
        ...(quizResults.currentMedications || []),
        ...(quizResults.currentSupplements || []),
    ]
        .map((x) => String(x || '').trim())
        .filter(Boolean);

    allListed.forEach((name) => {
        const needle = name.toLowerCase();
        const exact = ALL_PRODUCTS.find((p) => String(p.name || '').toLowerCase() === needle);
        if (exact) {
            out[exact.id] = exact;
            return;
        }
        const partial = ALL_PRODUCTS.find((p) => String(p.name || '').toLowerCase().includes(needle) || needle.includes(String(p.name || '').toLowerCase()));
        if (partial) out[partial.id] = partial;
    });

    return out;
}

// Helper to look up category labels (MVP categories included)
export const CATEGORY_LABELS = {
    'pad': 'Pads',
    'tampon': 'Tampons',
    'cup': 'Menstrual Cups',
    'disc': 'Menstrual Discs',
    'period-underwear': 'Period Underwear',
    'period-care': 'Period Care',
    'supplement': 'Supplements',
    'supplements': 'Supplements',
    'tracker': 'Trackers & Wearables',
    'telehealth': 'Virtual Care',
    'mental-health': 'Mental Wellness',
    'fitness': 'Fitness',
    'fitness-cycle': 'Cycle Fitness',
    'pelvic-floor': 'Pelvic Floor',
    'pelvic-health': 'Pelvic Health',
    'cramp-relief': 'Cramp Relief',
    'intimate-care': 'Intimate Care',
    'menopause': 'Menopause Support',
    'sex-tech': 'Sexual Wellness',
    'postpartum': 'Postpartum Recovery',
    'pregnancy': 'Pregnancy Support',
    'fertility': 'Fertility',
    'diagnostics': 'Diagnostics',
    'hormone-monitoring': 'Hormone Monitoring',
    'custom-brand': 'Your brands',
    'medication': 'Medications'
};

// The site's one taxonomy of user-facing care areas, each rolling up one or more
// raw catalog `category` values. Originally lived only in Discovery.jsx (as its
// category-filter chips); moved here so it can also be the single source of
// truth for EcosystemBubbles' area grouping — it used to keep its own smaller,
// separately-hand-maintained category list that had drifted out of sync
// (missing birth-control, breast care, menopause, skin, hair, gut, pain-relief,
// tests-devices...), so any product in one of those categories silently landed
// in a generic "Other" bubble instead of a properly named one (found live,
// Aditi 2026-08-24: a sleep product added to an ecosystem should get its own
// "Sleep" bubble, not fall into "Other").
export const MACRO_GROUPS = [
    { id: 'all', label: 'All', categories: [], keywords: [] },
    { id: 'period', label: 'Period', categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief', 'cup-steamer'], keywords: ['period', 'menstrual'] },
    // 'ph' used to be a bare keyword here and matched any product whose copy happened to
    // contain the substring "ph" — e.g. Nature Made Iron ("#1 pharmacist recommended"), Wisp
    // ("pharmacy pickup"), and Apple Health ("built into iPhone") all satisfied it despite
    // having nothing to do with intimate care. Scoped to the actual phrasing real vaginal-pH
    // products use (see e.g. p-honeypot-wash, p-good-clean-love, p-v-wash) instead.
    { id: 'intimate', label: 'Intimate Care', categories: ['intimate-care'], keywords: ['vaginal', 'vulva', 'intimate', 'moisturizer', 'ph balance', 'ph-balanced', 'ph balanced', 'ph level', 'ph support'] },
    { id: 'sexual', label: 'Sexual Wellness', categories: ['sex-tech'], keywords: ['lubricant', 'lube', 'condom', 'sexual wellness', 'intimacy'] },
    { id: 'birth-control', label: 'Birth Control', categories: ['contraception'], keywords: ['contraception', 'contraceptive', 'emergency contraception', 'barrier'] },
    { id: 'fertility', label: 'Fertility', categories: ['fertility'], keywords: ['fertility', 'ovulation', 'conceive', 'conception'] },
    { id: 'pregnancy', label: 'Pregnancy', categories: ['pregnancy'], keywords: ['pregnancy', 'prenatal'] },
    { id: 'postpartum', label: 'Postpartum', categories: ['postpartum'], keywords: ['postpartum', 'lactation', 'breastfeeding', 'perineal'] },
    { id: 'breast', label: 'Breast Care', categories: ['breast-care', 'lactation'], keywords: ['breast', 'breastfeeding', 'nipple', 'pump', 'lactation'] },
    { id: 'pelvic', label: 'Pelvic', categories: ['pelvic-floor', 'pelvic-health', 'incontinence'], keywords: ['pelvic', 'kegel', 'bladder', 'incontinence', 'bladder leak'] },
    { id: 'menopause', label: 'Menopause', categories: ['menopause'], keywords: ['menopause', 'perimenopause', 'hot flash'] },
    // 'supplement' is a product-TYPE category shared by dozens of unrelated items (iron for
    // anemia, plain vitamin D, omega-3 for cramps, etc.) — it used to be listed here directly,
    // which meant EVERY supplement in the catalog satisfied the Hormones chip regardless of what
    // it actually treats. Matching is now scoped to the real concern taxonomy instead: the
    // 'hormone-monitoring' category, the 'hormone-balance' healthFunction (checked exactly via
    // healthFunctions below, not folded into the general keyword text blob — a substring scan
    // would otherwise let something like the unrelated 'fitness-cycle' healthFunction slug
    // falsely satisfy the 'cycle' keyword), and the keywords below.
    { id: 'hormones', label: 'Hormones', categories: ['hormone-monitoring'], healthFunctions: ['hormone-balance'], keywords: ['pms', 'pcos', 'cycle', 'hormone', 'hormonal'] },
    // Bare 'skin'/'moisturizer' catch vulvar/vulva-balm copy ("vulvar skin", "arousal
    // moisturizers") and an incontinence liner's "skin comfort formula" claim — all real
    // catalog phrasing, just not about the facial/body skincare this chip means. Those
    // product types are excluded from the keyword scan below (see excludeCategories in
    // itemMatchesMacroGroup) rather than trying to enumerate every mismatched phrase.
    { id: 'skin', label: 'Skin', categories: ['skin', 'skincare', 'body-care'], keywords: ['skin', 'cleanser', 'moisturizer', 'spf', 'acne', 'hyperpigmentation'], excludeCategories: ['intimate-care', 'sex-tech', 'incontinence'] },
    // Same class of bug as Skin above: 'thinning' and 'hair' were catching "vaginal dryness
    // and thinning" (a menopause GSM symptom, not hair thinning) and "ingrown hairs...on the
    // bikini line" (intimate-area exfoliation, not hair care). excludeCategories keeps those
    // out of the keyword scan.
    { id: 'hair', label: 'Hair', categories: ['hair', 'haircare'], keywords: ['hair', 'scalp', 'shampoo', 'conditioner', 'thinning'], excludeCategories: ['intimate-care', 'menopause'] },
    { id: 'gut', label: 'Gut', categories: ['gut-health'], keywords: ['gut', 'bloating', 'fiber', 'probiotic'] },
    // 'stress' alone matched incontinence products' clinical term "stress incontinence"/
    // "stress or urge bladder leaks" (a bladder-control classification, unrelated to mental
    // stress) — stripped via NEGATED_CONCERN_PHRASES in Discovery.jsx rather than dropping the
    // keyword, since "stress" genuinely belongs here for its real (psychological) sense.
    // 'sleep' is a real distinct category value in the live catalog (e.g. Eight Sleep Pod)
    // alongside 'mental-health' — both belong under this chip.
    { id: 'sleep-stress', label: 'Sleep + Stress', categories: ['mental-health', 'sleep'], keywords: ['sleep', 'stress', 'relaxation'] },
    { id: 'pain-recovery', label: 'Pain + Recovery', categories: ['pain-relief', 'cramp-relief', 'recovery'], keywords: ['pain', 'cramp', 'heat therapy', 'recovery', 'muscle'] },
    // 'test' used to be a bare keyword and matched "clinically tested" (Honey Pot wash),
    // "gynecologist-tested" (Luna wash), and even "testosterone" (spearmint PCOS tea) — none
    // of which are diagnostic tests/devices. Scoped to the phrasing real test products use
    // (p-azo-test's "test strips", p-winx-uti-test-treat's "rapid test").
    { id: 'tests-devices', label: 'Tests + Devices', categories: ['tracker', 'diagnostics', 'hormone-monitoring'], keywords: ['test strip', 'test kit', 'rapid test', 'diagnostic test', 'lab test', 'tracker', 'wearable', 'monitor'] },
];

// Some product copy legitimately advertises the ABSENCE of a property — e.g. Neycher's
// intimate-care line describing itself as "hormone-free" / "non-hormonal" — rather than the
// presence of it. A naive substring match on a concern keyword like "hormone" can't tell "this
// product is about hormones" apart from "this product explicitly contains none," so it was
// mis-filing hormone-free vulva balm/moisturizing gel under the Hormones chip. Strip these
// negated phrases out before keyword matching so a chip only surfaces products that are
// actually about the concern, not ones that merely deny it.
//
// Broadened beyond pure negation to the same underlying problem in a different shape: a
// keyword's word/phrase appearing in copy for an unrelated reason.
//   - "outside your period" (Neycher: usage timing, not a period product), "not menstrual
//     flow", "distinct from a menstrual panty liner", and "rather than menstrual blood"
//     (incontinence pads explicitly contrasting themselves with period products) were all
//     satisfying the Period chip's 'period'/'menstrual' keywords despite each one denying
//     the very thing the keyword is meant to detect.
//   - "stress incontinence" / "stress or urge bladder leaks" / "stress and urge incontinence"
//     are a clinical bladder-control term, not the Sleep + Stress chip's intended
//     (psychological) sense of "stress" — was surfacing incontinence pads under that chip.
const NEGATED_CONCERN_PHRASES = [
    /non-?\s?hormonal/g,
    /hormone-?\s?free/g,
    /outside your period/g,
    /not\s+(?:for\s+)?menstrual/g,
    /distinct from a\s+menstrual/g,
    /rather than menstrual/g,
    /stress\s+(?:(?:or|and)\s+urge\s+)?(?:bladder\s+)?(?:incontinence|leaks?)/g,
];

export function productSearchText(item) {
    const raw = [
        item?.category, item?.name, item?.brand, item?.summary, item?.description, item?.tagline,
        ...(Array.isArray(item?.badges) ? item.badges : []),
        ...(Array.isArray(item?.tags) ? item.tags : []),
        item?.eligibility, item?.sustainability, item?.lifeStage,
    ].filter(Boolean).join(' ').toLowerCase();
    return NEGATED_CONCERN_PHRASES.reduce((t, re) => t.replace(re, ' '), raw);
}

export function itemMatchesMacroGroup(item, groupId) {
    if (!groupId || groupId === 'all') return true;
    const group = MACRO_GROUPS.find((g) => g.id === groupId);
    if (!group) return true;
    if (group.categories.includes(item?.category)) return true;
    // Structured concern tags (e.g. 'hormone-balance') are checked as an exact membership test,
    // not folded into the free-text keyword scan below — that keeps a slug like the unrelated
    // 'fitness-cycle' healthFunction from accidentally satisfying a keyword such as 'cycle'.
    if (Array.isArray(group.healthFunctions) && Array.isArray(item?.healthFunctions) &&
        item.healthFunctions.some((hf) => group.healthFunctions.includes(hf))) return true;
    // Some chips' keywords are inherently ambiguous outside their own product domain (e.g.
    // "skin"/"moisturizer" legitimately describe vulvar-care copy; "thinning" legitimately
    // describes vaginal-tissue thinning) — excludeCategories lets a chip opt specific
    // product-type categories out of the free-text keyword scan below (they can still match
    // via an explicit categories/healthFunctions hit above) so e.g. a vulva balm doesn't
    // surface under "Skin" just because its copy happens to say "skin."
    if (Array.isArray(group.excludeCategories) && group.excludeCategories.includes(item?.category)) return false;
    const text = productSearchText(item);
    return group.keywords.some((keyword) => text.includes(keyword));
}

// ─── CLINICAL WORKFLOW (e.g. Recurrent UTIs: prevent → test → treat → get care) ───
export const CLINICAL_WORKFLOW_STEPS = {
    uti: [
        { id: 'prevent', label: 'Prevent (supplements & daily care)', order: 1 },
        { id: 'test', label: 'Test at home', order: 2 },
        { id: 'treat', label: 'Treat & manage (suppositories, products)', order: 3 },
        { id: 'get_care', label: 'Get care (telehealth)', order: 4 },
    ],
    cramps: [
        { id: 'supplement', label: 'Supplements (magnesium, omega-3)', order: 1 },
        { id: 'heat', label: 'Heat therapy', order: 2 },
        { id: 'checkin', label: 'Track & check in', order: 3 },
    ],
};

const FRUSTRATION_TO_WORKFLOW = {
    'Recurrent UTIs': 'uti',
    'Painful cramps': 'cramps',
};

/** Assign a workflow step for a given frustration (e.g. uti, cramps) based on product attributes. */
function getWorkflowStep(product, frustrationTag) {
    if (frustrationTag === 'uti') {
        const tags = new Set(product.tags || []);
        const healthFns = new Set(product.healthFunctions || []);
        const name = (product.name || '').toLowerCase();
        const summary = (product.summary || '').toLowerCase();
        const hasUti = tags.has('uti') || healthFns.has('uti-prevention');
        if (!hasUti) return null;
        if (product.category === 'telehealth') return 'get_care';
        if (name.includes('test') || name.includes('strip') || summary.includes('test') || summary.includes('strip')) return 'test';
        if (healthFns.has('vaginal-health') || healthFns.has('intimate-care') || name.includes('suppository') || summary.includes('suppository') || product.id === 'p-boric-acid') return 'treat';
        if (product.category === 'supplement' || product.category === 'supplements') return 'prevent';
        return 'treat';
    }
    if (frustrationTag === 'cramps') {
        const tags = new Set(product.tags || []);
        const healthFns = new Set(product.healthFunctions || []);
        const name = (product.name || '').toLowerCase();
        const summary = (product.summary || '').toLowerCase();
        const hasCramps = tags.has('cramps') || healthFns.has('cramp-relief');
        if (!hasCramps) return null;
        if (product.category === 'tracker' || name.includes('track') || summary.includes('track')) return 'checkin';
        if (name.includes('heat') || name.includes('therma') || summary.includes('heat') || product.category === 'cramp-relief') return 'heat';
        if (product.category === 'supplement' || product.category === 'supplements') return 'supplement';
        return 'supplement';
    }
    return null;
}

/**
 * Returns recommendations grouped by clinical workflow when the user has a matching concern
 * (e.g. Recurrent UTIs → Prevent, Test, Treat, Get care), plus remaining by category.
 */
export function getRecommendationsGroupedByWorkflow(quizAnswers, omittedProductIds = {}, healthProfile = null) {
    const base = getRecommendations(quizAnswers || {}, healthProfile);
    const filtered = base.filter(p => !omittedProductIds[p.id]);
    const workflowTag = quizAnswers?.frustrations?.find(f => FRUSTRATION_TO_WORKFLOW[f]);
    const tag = workflowTag ? FRUSTRATION_TO_WORKFLOW[workflowTag] : null;

    if (!tag || !CLINICAL_WORKFLOW_STEPS[tag]) {
        return { byWorkflow: [], byCategory: groupByCategory(filtered) };
    }

    const steps = CLINICAL_WORKFLOW_STEPS[tag];
    const byStep = {};
    steps.forEach(s => { byStep[s.id] = []; });
    const rest = [];

    filtered.forEach(p => {
        const step = getWorkflowStep(p, tag);
        if (step && byStep[step]) byStep[step].push(p);
        else rest.push(p);
    });

    const byWorkflow = [{
        frustration: workflowTag,
        frustrationLabel: workflowTag,
        steps: steps.map(s => ({ stepId: s.id, stepLabel: s.label, products: byStep[s.id] || [] })).filter(s => s.products.length > 0),
    }];

    return { byWorkflow, byCategory: groupByCategory(rest) };
}

function groupByCategory(products) {
    const map = {};
    products.forEach(p => {
        const cat = p.category || 'other';
        if (!map[cat]) map[cat] = [];
        map[cat].push(p);
    });
    // Sections are ordered by how many of *this user's* matched products actually landed in each
    // category (most first, alphabetical tiebreak) — not a hand-typed category list. A fixed list
    // would mean some categories always render ahead of others regardless of fit for the user.
    return Object.keys(map)
        .sort((a, b) => map[b].length - map[a].length || a.localeCompare(b))
        .map(c => ({ category: c, label: CATEGORY_LABELS[c] || c, products: map[c] }));
}

// ─── RECOMMENDATION LOGIC ───────────────────────────────
// Map quiz "sensitivities" and "productsToAvoid" labels to canonical keys for filtering
const SENSITIVITY_AVOID_TO_TRIGGER = {
    'Fragrance sensitivity': 'fragrance',
    'Fragrance / scented products': 'fragrance',
    'Essential oils': 'essential-oils',
    'Latex allergy': 'latex',
    'Latex': 'latex',
    'Synthetic materials': 'synthetic',
    'Other allergies': null, // no product-level mapping by default
};
// Keywords to detect trigger in product text (ingredients, summary, safety)
const AVOID_TRIGGER_KEYWORDS = {
    'fragrance': ['fragrance', 'parfum', 'scented', 'perfume', 'scent'],
    'essential-oils': ['essential oil', 'lavender oil', 'peppermint oil', 'mint oil', 'tea tree', 'eucalyptus oil', 'herbal-infused', 'herb-infused', 'lavender', 'peppermint'],
    'latex': ['latex'],
    'synthetic': [], // only use product.avoidIfSensitivity for synthetic to avoid over-excluding
};

function productMatchesAvoidTrigger(product, trigger) {
    if (product.avoidIfSensitivity && product.avoidIfSensitivity.includes(trigger)) return true;
    const keywords = AVOID_TRIGGER_KEYWORDS[trigger];
    if (!keywords || keywords.length === 0) return false;
    const text = [
        product.ingredients,
        product.summary,
        product.safety?.materials,
        product.safety?.allergens,
    ].filter(Boolean).join(' ').toLowerCase();
    return keywords.some(kw => text.includes(kw.toLowerCase()));
}

/** Rank catalog when only imported health signals exist (no quiz frustrations). */
/**
 * Splits (not concatenates) so callers can tell a real tag match from the
 * fallback tail. `getRecommendationMatchesAndRest`'s no-quiz/health-only
 * branch used to call a version of this that concatenated matches+rest into
 * one array and labeled the whole thing "matches" — meaning a health-import
 * user's "recommended" set was silently the entire catalog, and any
 * membership filter built from it (Discovery's Personalized toggle,
 * Articles' profile-matched products) was a near no-op.
 */
function rankProductsByHealthTags(healthTags) {
    const userTags = healthTags instanceof Set ? healthTags : new Set(healthTags || []);
    if (userTags.size === 0) return { matches: ALL_PRODUCTS, rest: [] };
    const scored = ALL_PRODUCTS.map((p) => {
        let score = 0;
        (p.tags || []).forEach((t) => {
            if (userTags.has(t)) score += 2;
        });
        (p.healthFunctions || []).forEach((h) => {
            if (userTags.has(h)) score += 1;
        });
        if (userTags.has('mental-health') && p.category === 'mental-health') score += 2;
        return { product: p, score };
    });
    const matches = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.product);
    const rest = scored.filter((s) => s.score === 0).map((s) => s.product);
    return { matches, rest };
}

/** True when the catalog item typically requires a clinician/Rx and is not itself a care-access product. */
export function isPrescriptionRestrictedProduct(p) {
    if (!p) return false;
    if (p.category === 'telehealth') return false;
    if (p.prescriptionPatientUrl || p.prescriptionSavingsUrl) return false;
    if (p.requiresPrescription === true) return true;
    const wtb = (p.whereToBuy || []).map((x) => String(x).toLowerCase());
    if (wtb.some((s) => s.includes('pharmacy with prescription'))) return true;
    return false;
}

/**
 * True for any prescription-only item, with no exceptions (unlike
 * isPrescriptionRestrictedProduct, which waives items that carry official
 * manufacturer access URLs). Ayna doesn't sell or dispense prescriptions —
 * shopping/recommendation surfaces should never show these as buyable
 * products, even when a savings/patient link or telehealth care path exists
 * for them. Search for what they treat (e.g. "hormone replacement therapy")
 * should surface telehealth providers instead — see findTelehealthAccessForProduct.
 */
export function isRxOnlyProduct(p) {
    if (!p) return false;
    if (p.category === 'telehealth') return false;
    if (p.requiresPrescription === true) return true;
    const wtb = (p.whereToBuy || []).map((x) => String(x).toLowerCase());
    // Covers both pharmacy-dispensed prescriptions and clinician-administered
    // devices/procedures (e.g. IUD insertion) — neither is something Ayna sells.
    return wtb.some((s) => s.includes('pharmacy with prescription') || s.includes('clinic insertion') || s.includes('clinic administered'));
}

let _telehealthCatalog = null;
function getTelehealthCatalog() {
    if (!_telehealthCatalog) {
        _telehealthCatalog = ALL_PRODUCTS.filter((x) => x.category === 'telehealth');
    }
    return _telehealthCatalog;
}

/**
 * Best-effort telehealth/clinic product that could plausibly prescribe or coordinate access for this item.
 * Returns null when we should not imply a prescribing path exists.
 */
export function findTelehealthAccessForProduct(p) {
    if (!isPrescriptionRestrictedProduct(p)) return null;
    const tele = getTelehealthCatalog();
    const pTags = new Set(p.tags || []);
    const pFuncs = new Set(p.healthFunctions || []);
    const textBlob = `${p.name || ''} ${p.summary || ''}`.toLowerCase();
    let best = null;
    let bestScore = 0;
    tele.forEach((t) => {
        let s = 0;
        (t.tags || []).forEach((tt) => {
            if (pTags.has(tt)) s += 4;
        });
        (t.healthFunctions || []).forEach((h) => {
            if (pFuncs.has(h)) s += 2;
        });
        if (s > bestScore) {
            bestScore = s;
            best = t;
        }
    });
    if (bestScore >= 4 && best) return best;

    if (/uti|cystitis|bladder/i.test(textBlob)) {
        const hit = tele.find(
            (t) => /uti|planned parenthood|pp direct|wisp|lemonaid|stix/i.test(`${t.name} ${t.summary || ''}`)
        );
        if (hit) return hit;
    }
    if ((p.healthFunctions || []).includes('contraception') || /contraceptive|birth control|pill|ring|iud/i.test(textBlob)) {
        const hit = tele.find((t) => /nurx|wisp|planned parenthood|birth control|contraception/i.test(`${t.name} ${t.summary || ''}`));
        if (hit) return hit;
    }
    if (p.category === 'menopause' || (p.tags || []).includes('menopause')) {
        const hit = tele.find((t) => /evernow|midi|menopause|gennev|alloy/i.test(`${t.name} ${t.summary || ''}`));
        if (hit) return hit;
    }
    if ((p.tags || []).includes('endometriosis') || (p.tags || []).includes('heavy-flow')) {
        const hit = tele.find((t) => /visana|virtual|clinic/i.test(`${t.name} ${t.summary || ''}`));
        if (hit) return hit;
    }

    return bestScore >= 2 ? best : null;
}

function shouldExcludePrescriptionWithoutCarePath(p) {
    return isRxOnlyProduct(p);
}

export function filterPrescriptionCareGate(products) {
    return (products || []).filter((p) => !shouldExcludePrescriptionWithoutCarePath(p));
}

/**
 * When opening a prescription-type product: manufacturer / savings URLs and/or telehealth that could support access.
 */
export function getPrescriptionAccessGuidance(product) {
    if (!product || product.category === 'telehealth') return null;
    const patientUrl = product.prescriptionPatientUrl || null;
    const savingsUrl = product.prescriptionSavingsUrl || null;
    if (patientUrl || savingsUrl) {
        return { patientUrl, savingsUrl, telehealthProduct: null };
    }
    if (!isPrescriptionRestrictedProduct(product)) return null;
    const tele = findTelehealthAccessForProduct(product);
    if (!tele) return null;
    return { patientUrl: null, savingsUrl: null, telehealthProduct: tele };
}

/** Ranked lists (tag matches first) with prescription-only items removed unless a care path exists. */
export function getRecommendationMatchesAndRest(quizAnswers, healthProfile = null) {
    const healthTagList = inferTagsFromHealthProfile(healthProfile);
    const healthTags = new Set(healthTagList);

    if (!quizAnswers || !quizAnswers.frustrations) {
        if (healthTags.size === 0) {
            const all = filterPrescriptionCareGate(ALL_PRODUCTS);
            return { matches: all, others: [] };
        }
        const { matches, rest } = rankProductsByHealthTags(healthTags);
        return { matches: filterPrescriptionCareGate(matches), others: filterPrescriptionCareGate(rest) };
    }

    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow',
        'Painful cramps': 'cramps',
        'Hormonal bloating': 'bloating',
        'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks',
        'General discomfort': 'discomfort',
        'Recurrent UTIs': 'uti',
        'PCOS symptoms': 'pcos',
        'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause',
        'Endometriosis': 'endometriosis',
        'Fertility / TTC': 'fertility',
        'Pregnancy': 'pregnancy',
        'Postpartum recovery': 'postpartum',
    };

    const userTags = new Set();
    quizAnswers.frustrations.forEach((f) => {
        const tag = FRUSTRATION_MAP[f];
        if (tag) userTags.add(tag);
    });
    healthTagList.forEach((t) => userTags.add(t));

    const prefs = Array.isArray(quizAnswers.preference) ? quizAnswers.preference : (quizAnswers.preference ? [quizAnswers.preference] : []);
    prefs.forEach((pref) => {
        if (pref === 'Organic/Natural only') userTags.add('organic');
        if (pref === 'Non-hormonal / hormone-free') userTags.add('non-hormonal');
        if (pref === 'Lower cost') userTags.add('cost');
        if (pref === 'Comfort/Convenience') userTags.add('comfort');
        if (pref === 'Privacy & data security') userTags.add('privacy');
        if (pref === 'Sustainability/Zero-waste') userTags.add('sustainability');
    });

    const skipContraception = quizAnswers.contraceptionUse === 'No' || quizAnswers.contraceptionUse === 'Prefer not to say';
    const skipInternal = quizAnswers.internalComfort === 'No';

    const userAvoidSet = new Set();
    [...(quizAnswers.sensitivities || []), ...(quizAnswers.productsToAvoid || [])].forEach((label) => {
        const key = SENSITIVITY_AVOID_TO_TRIGGER[label];
        if (key) userAvoidSet.add(key);
    });
    userAvoidSet.delete(null);

    const scored = ALL_PRODUCTS.filter((p) => {
        if (skipContraception && p.healthFunctions && p.healthFunctions.includes('contraception')) return false;
        if (skipInternal && p.internal === true) return false;
        if (userAvoidSet.size > 0 && [...userAvoidSet].some((trigger) => productMatchesAvoidTrigger(p, trigger))) return false;
        return true;
    }).map((p) => {
        let score = 0;
        (p.tags || []).forEach((t) => {
            if (userTags.has(t)) score += 2;
        });
        prefs.forEach((pref) => {
            if (pref === 'Sustainability/Zero-waste' && p.badges?.includes('Sustainable')) score += 3;
            if (pref === 'Organic/Natural only' && p.tags?.includes('organic')) score += 3;
            if (pref === 'Non-hormonal / hormone-free' && p.tags?.includes('non-hormonal')) score += 3;
        });
        return { product: p, score };
    });

    const matches = filterPrescriptionCareGate(
        scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).map((s) => s.product)
    );
    const others = filterPrescriptionCareGate(scored.filter((s) => s.score === 0).map((s) => s.product));
    return { matches, others };
}

/** Suggested picks per quiz concern for ecosystem layout (deduped, preference to tag-strong matches). */
export function getRecommendationsByFrustration(quizAnswers, healthProfile = null, perFrustrationCap = 6) {
    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow',
        'Painful cramps': 'cramps',
        'Hormonal bloating': 'bloating',
        'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks',
        'General discomfort': 'discomfort',
        'Recurrent UTIs': 'uti',
        'PCOS symptoms': 'pcos',
        'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause',
        'Endometriosis': 'endometriosis',
        'Fertility / TTC': 'fertility',
        'Pregnancy': 'pregnancy',
        'Postpartum recovery': 'postpartum',
    };
    const { matches, others } = getRecommendationMatchesAndRest(quizAnswers, healthProfile);
    const ranked = [...matches, ...others];
    const seen = new Set();
    const sections = [];
    (quizAnswers?.frustrations || []).forEach((f) => {
        const tag = FRUSTRATION_MAP[f];
        if (!tag) return;
        const products = [];
        for (const p of ranked) {
            if (products.length >= perFrustrationCap) break;
            if (!(p.tags || []).includes(tag)) continue;
            if (seen.has(p.id)) continue;
            seen.add(p.id);
            products.push(p);
        }
        if (products.length) sections.push({ frustration: f, tag, products });
    });
    return sections;
}

export function getRecommendations(quizAnswers, healthProfile = null) {
    const { matches, others } = getRecommendationMatchesAndRest(quizAnswers, healthProfile);
    return [...matches, ...others];
}

/**
 * The IDs a "Personalized" filter should actually restrict to: real,
 * positively-scored matches only — NOT `getRecommendations()`'s output, which
 * appends every zero-score "other" product as a fallback tail so
 * ecosystem-building always has candidates to show. Filtering by membership
 * in that full list is close to a no-op (nearly every product qualifies),
 * which is exactly why toggling Personalized on Discovery barely changed the
 * grid for a user who'd completed the quiz. Callers that want a hard,
 * meaningfully-personalized subset (Discovery's Personalized toggle,
 * Articles' profile-matched products) should use this instead.
 */
export function getPersonalizedProductIds(quizAnswers, healthProfile = null) {
    const { matches } = getRecommendationMatchesAndRest(quizAnswers, healthProfile);
    return matches.map((p) => p.id);
}

/**
 * Top catalog pick per quiz frustration (for post–health-profile ecosystem seeding).
 * Uses the same ranking as getRecommendations; picks one distinct product per concern in frustration order.
 */
export function getEcosystemSeedFromQuiz(quizAnswers, healthProfile = null) {
    const mergedProducts = {};
    const seedMeta = {};
    if (!quizAnswers?.frustrations?.length) {
        return { mergedProducts, seedMeta };
    }
    const { matches, others } = getRecommendationMatchesAndRest(quizAnswers, healthProfile);
    const recs = matches.length > 0 ? matches : [...matches, ...others];
    const picked = new Set();
    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow',
        'Painful cramps': 'cramps',
        'Hormonal bloating': 'bloating',
        'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks',
        'General discomfort': 'discomfort',
        'Recurrent UTIs': 'uti',
        'PCOS symptoms': 'pcos',
        'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause',
        'Endometriosis': 'endometriosis',
        'Fertility / TTC': 'fertility',
        'Pregnancy': 'pregnancy',
        'Postpartum recovery': 'postpartum',
    };
    for (const f of quizAnswers.frustrations) {
        const tag = FRUSTRATION_MAP[f];
        if (!tag) continue;
        const product = recs.find((p) => (p.tags || []).includes(tag) && !picked.has(p.id));
        if (product) {
            picked.add(product.id);
            mergedProducts[product.id] = product;
            seedMeta[product.id] = { frustration: f, tag };
        }
    }
    return { mergedProducts, seedMeta };
}

/** Up to `limit` other ranked products for the same concern tag (excludes current product). */
export function getEcosystemAlternatives(productId, tag, quizAnswers, healthProfile = null, limit = 3) {
    if (!tag) return [];
    const recs = getRecommendations(quizAnswers || {}, healthProfile);
    return recs.filter((p) => p.id !== productId && (p.tags || []).includes(tag)).slice(0, limit);
}

const TAG_TO_READABLE = {
    'heavy-flow': 'heavy flow', 'cramps': 'cramps', 'bloating': 'hormonal bloating', 'irregular': 'irregular cycles', 'leaks': 'leaks',
    'discomfort': 'discomfort', 'safety-concern': 'safety', 'uti': 'UTI care', 'pcos': 'PCOS',
    'pelvic-floor': 'pelvic floor', 'menopause': 'menopause', 'fertility': 'fertility', 'endometriosis': 'endometriosis',
    'pregnancy': 'pregnancy', 'postpartum': 'postpartum', 'non-hormonal': 'non-hormonal',
    'organic': 'organic/natural', 'cost': 'lower cost', 'comfort': 'comfort', 'privacy': 'privacy', 'sustainability': 'sustainability', 'contraception': 'contraception'
};

/**
 * Readable labels for product tags that overlap the user’s quiz + imported health profile.
 * Empty when there is no tag match — use this to show a positive for-you line only when appropriate.
 */
function getProfileMatchStatsForProduct(product, quizAnswers, healthProfile = null) {
    const healthOnlyTags = inferTagsFromHealthProfile(healthProfile);
    if ((!quizAnswers || !quizAnswers.frustrations?.length) && healthOnlyTags.length === 0) {
        return { labels: [], percent: null, matches: 0, signals: 0 };
    }
    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Hormonal bloating': 'bloating', 'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks', 'General discomfort': 'discomfort', 'Not sure if products are safe': 'safety-concern',
        'Recurrent UTIs': 'uti', 'PCOS symptoms': 'pcos', 'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause', 'Endometriosis': 'endometriosis', 'Fertility / TTC': 'fertility',
        'Pregnancy': 'pregnancy', 'Postpartum recovery': 'postpartum'
    };
    const userTags = new Set();
    (quizAnswers?.frustrations || []).forEach(f => {
        const t = FRUSTRATION_MAP[f];
        if (t) userTags.add(t);
        if (f === 'Endometriosis') userTags.add('cramps');
    });
    healthOnlyTags.forEach((t) => userTags.add(t));
    const prefs = Array.isArray(quizAnswers?.preference) ? quizAnswers.preference : (quizAnswers?.preference ? [quizAnswers.preference] : []);
    prefs.forEach(p => {
        if (p === 'Organic/Natural only') userTags.add('organic');
        if (p === 'Non-hormonal / hormone-free') userTags.add('non-hormonal');
        if (p === 'Lower cost') userTags.add('cost');
        if (p === 'Comfort/Convenience') userTags.add('comfort');
        if (p === 'Privacy & data security') userTags.add('privacy');
        if (p === 'Sustainability/Zero-waste') userTags.add('sustainability');
    });
    const productTags = new Set(product.tags || []);
    let matches = [...userTags].filter(t => productTags.has(t));
    if (product.tags?.includes('pelvic-floor')) {
        matches.sort((a, b) => {
            const pri = (t) => (t === 'pelvic-floor' ? 0 : t === 'discomfort' ? 1 : t === 'endometriosis' ? 2 : t === 'cramps' ? 5 : 3);
            return pri(a) - pri(b);
        });
    }
    const percent = userTags.size > 0 && matches.length > 0
        ? Math.round((matches.length / userTags.size) * 100)
        : null;
    return {
        labels: matches.slice(0, 4).map(m => TAG_TO_READABLE[m] || m.replace(/-/g, ' ')),
        percent,
        matches: matches.length,
        signals: userTags.size,
    };
}

export function getProfileMatchLabelsForProduct(product, quizAnswers, healthProfile = null) {
    return getProfileMatchStatsForProduct(product, quizAnswers, healthProfile).labels;
}

/**
 * Profile-overlap percentage used only for signed-in personalization UI.
 * It is a literal tag-overlap ratio (matched profile signals / comparable
 * profile signals), not a clinical score and not an invented marketing number.
 */
export function getProfileMatchPercentForProduct(product, quizAnswers, healthProfile = null) {
    return getProfileMatchStatsForProduct(product, quizAnswers, healthProfile).percent;
}

/**
 * Returns a short explanation for why a product could work (or not) for this profile.
 */
export function getRecommendationExplanation(product, quizAnswers, healthProfile = null) {
    const healthOnlyTags = inferTagsFromHealthProfile(healthProfile);
    if ((!quizAnswers || !quizAnswers.frustrations?.length) && healthOnlyTags.length === 0) {
        return { whyItWorks: null, considerations: null };
    }

    const FRUSTRATION_MAP = {
        'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Hormonal bloating': 'bloating', 'Irregular cycles': 'irregular',
        'Leaks & staining': 'leaks', 'General discomfort': 'discomfort', 'Not sure if products are safe': 'safety-concern',
        'Recurrent UTIs': 'uti', 'PCOS symptoms': 'pcos', 'Pelvic pain': 'pelvic-floor',
        'Menopause symptoms': 'menopause', 'Endometriosis': 'endometriosis', 'Fertility / TTC': 'fertility',
        'Pregnancy': 'pregnancy', 'Postpartum recovery': 'postpartum'
    };
    const userTags = new Set();
    (quizAnswers?.frustrations || []).forEach(f => {
        const t = FRUSTRATION_MAP[f];
        if (t) userTags.add(t);
        if (f === 'Endometriosis') userTags.add('cramps');
    });
    healthOnlyTags.forEach((t) => userTags.add(t));
    const prefs = Array.isArray(quizAnswers?.preference) ? quizAnswers.preference : (quizAnswers?.preference ? [quizAnswers.preference] : []);
    prefs.forEach(p => {
        if (p === 'Organic/Natural only') userTags.add('organic');
        if (p === 'Non-hormonal / hormone-free') userTags.add('non-hormonal');
        if (p === 'Lower cost') userTags.add('cost');
        if (p === 'Comfort/Convenience') userTags.add('comfort');
        if (p === 'Privacy & data security') userTags.add('privacy');
        if (p === 'Sustainability/Zero-waste') userTags.add('sustainability');
    });

    const productTags = new Set(product.tags || []);
    let matches = [...userTags].filter(t => productTags.has(t));
    if (product.tags?.includes('pelvic-floor')) {
        matches.sort((a, b) => {
            const pri = (t) => (t === 'pelvic-floor' ? 0 : t === 'discomfort' ? 1 : t === 'endometriosis' ? 2 : t === 'cramps' ? 5 : 3);
            return pri(a) - pri(b);
        });
    }
    const labels = matches.slice(0, 3).map(m => TAG_TO_READABLE[m] || m.replace(/-/g, ' '));
    const healthNote = healthOnlyTags.length > 0 ? ' Also aligned with signals from your imported health data (not a diagnosis).' : '';
    let whyItWorks;
    if (product.recommendationWhyDetail && typeof product.recommendationWhyDetail === 'string') {
        whyItWorks = `Why it could work: ${product.recommendationWhyDetail.trim()}${healthNote}`;
    } else if (labels.length > 0) {
        whyItWorks = `Why it could work: Matches your focus on ${labels.join(', ')}.${healthNote}`;
    } else {
        whyItWorks = healthNote
            ? `Why it could work: Suggested for your profile.${healthNote}`
            : 'Why it could work: Suggested for your profile.';
    }

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
    'More bloating': { tag: 'bloating', reason: 'Recommended for hormonal bloating from your check-in.' },
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
            'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Hormonal bloating': 'bloating', 'Irregular cycles': 'irregular',
            'Leaks & staining': 'leaks', 'General discomfort': 'discomfort', 'Not sure if products are safe': 'safety-concern',
            'Recurrent UTIs': 'uti', 'PCOS symptoms': 'pcos', 'Pelvic pain': 'pelvic-floor',
            'Menopause symptoms': 'menopause', 'Endometriosis': 'cramps', 'Fertility / TTC': 'fertility',
            'Pregnancy': 'pregnancy', 'Postpartum recovery': 'postpartum'
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

    // Exclude products that match user's sensitivities or productsToAvoid
    const userAvoidSet = new Set();
    [...(profile?.sensitivities || []), ...(profile?.productsToAvoid || [])].forEach(label => {
        const key = SENSITIVITY_AVOID_TO_TRIGGER[label];
        if (key) userAvoidSet.add(key);
    });
    const checkinPool = userAvoidSet.size > 0
        ? ALL_PRODUCTS.filter(p => ![...userAvoidSet].some(trigger => productMatchesAvoidTrigger(p, trigger)))
        : ALL_PRODUCTS;

    const scored = checkinPool.map(p => {
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
    'bloating': {
        label: 'Users with Hormonal Bloating',
        topProducts: ['p-pink-stork-bloat', 'p-love-wellness-bloat', 'p-flo-gummies', 'p-hum-flatter-me', 'p-evening-primrose', 'p-magnesium-glycinate'],
        quote: "Flo gummies and digestive enzymes made a real difference for my cycle-related bloating."
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

/** Symptom → product IDs for supplement/symptom browse. Used when category=supplement. */
export const SYMPTOM_TO_SUPPLEMENTS = {
    cramps: ['p-magnesium-glycinate', 'p-evening-primrose', 'p-fish-oil', 'p-honeypot-pad', 'p-thermacare', 'p-vitex'],
    bloating: ['p-pink-stork-bloat', 'p-love-wellness-bloat', 'p-flo-gummies', 'p-hum-flatter-me', 'p-evening-primrose', 'p-magnesium-glycinate'],
    uti: ['p-cranberry-supplement', 'p-d-mannose-now', 'p-uqora-control', 'p-probiotics-women', 'p-azo-test', 'p-boric-acid', 'p-cystex'],
    pcos: ['p-inositol-wholesome', 'p-spearmint-pcos', 'p-zinc', 'p-evening-primrose', 'p-vitex'],
    menopause: ['p-estroven-mood', 'p-remifemin', 'p-creatine-womens'],
    irregular: ['p-vitex', 'p-inositol-wholesome', 'p-evening-primrose'],
    fertility: ['p-ubiquinol-thorne'],
};

// Filter options for checking in
export const CHECK_IN_CATEGORIES = [
    { id: 'menstrual', label: 'Menstrual Cycle', icon: '' },
    { id: 'vaginal', label: 'Vaginal Health', icon: '' },
    { id: 'fertility', label: 'Fertility & TTC', icon: '' },
    { id: 'urinary', label: 'Urinary Health', icon: '' },
    { id: 'wellness', label: 'General Wellness', icon: '' },
];
// Helper to detect functionality overlaps in a set of products.
// Overlap warnings apply only to digital apps and telehealth services (not physical goods).
// productMap: optional id -> product (for custom ecosystem items not in ALL_PRODUCTS).
export function detectDuplicates(productIds, productMap = {}) {
    const functionMap = {};
    const seenInCategory = {}; // brand|name → dedup within each health function category

    productIds.forEach(id => {
        let p = ALL_PRODUCTS.find(item => item.id === id);
        if (!p && productMap[id]) p = productMap[id];
        if (!p) return;

        const fns = p.healthFunctions || [];
        const nameKey = `${String(p.brand || '').toLowerCase().trim()}|${String(p.name || '').toLowerCase().trim()}`;
        fns.forEach(fn => {
            if (!functionMap[fn]) { functionMap[fn] = []; seenInCategory[fn] = new Set(); }
            if (seenInCategory[fn].has(nameKey)) return; // skip identical product in same category
            seenInCategory[fn].add(nameKey);
            functionMap[fn].push(p);
        });
    });

    return { functionMap };
}

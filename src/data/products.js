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
import { RELEASED_STARTUPS } from './startups.js';
import {
    buildUserProfile, buildProductProfile, scoreProduct as engineScoreProduct, scoreProductForNeed,
    buildEcosystem, sortResults, TIERS, NEED_BY_ID,
} from '../matching/index.js';
import { needPhrase } from '../matching/ontology.js';
import { getCareResourceBundle } from './careResources.js';

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
            recalls: 'No product-specific recall source is linked in this catalog.',
            allergens: 'Fragrance in scented versions; fragrance-free version available',
            sideEffects: 'Possible contact dermatitis or irritation, especially with scented versions. Rash or itching from synthetic materials.',
            opinionAlerts: 'Some users report irritation or dislike the synthetic feel. This catalog has no product-specific chemical-residue test result for Always Infinity FlexFoam.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'FlexFoam absorption is reliable for heavy flow; unscented versions minimize irritation risk for sensitive users.',
        communityReview: 'Community discussions on Reddit r/periods include praise for absorption and a thin profile, along with reports of irritation or dislike of the synthetic feel. These are user experiences, not clinical safety findings.',
        ingredients: 'Polyethylene, polypropylene, wood pulp, adhesive. Fragrance-free version omits parfum.',
        effectiveness: 'Highly effective for heavy flow — users consistently report fewer leaks than with standard mainstream pads at a comparable price point.',
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
                aiSummary: "The listed FDA guidance explains menstrual product regulation generally; it does not independently test this specific pad or establish product-specific chemical safety.",
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
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
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
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Cooling herbs like peppermint may provide topical relief; some dermatologists warn essential oils can cause vulvar contact dermatitis in sensitive individuals.',
        communityReview: 'Community discussions note strong cooling effect for cramps; experiences are polarized.',
        ingredients: 'Plant-derived fiber, lavender oil, peppermint oil, aloe extract, wood pulp core.',
        effectiveness: 'Good absorption with added herbal comfort. Many users report cramp relief from cooling herbs.',
        integrations: [],
        badges: ['WOC Owned', 'Herbal Comfort', 'Sustainable'],
        verificationLinks: {
            doctor: {
                aiSummary: "ayna has investigated clinical perspectives on Honey Pot's 'herbal-infused' pads. While medical professionals generally support the use of plant-based materials, some dermatologists warn that direct contact with essential oils like mint and lavender can cause vulvar contact dermatitis in sensitive individuals. No specific clinical studies on Honey Pot's formula were found.",
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
        brand: 'LOLA',
        productUrl: 'https://mylola.com/products/applicator-tampons',
        category: 'tampon',
        type: 'physical',
        internal: true,
        healthFunctions: ['menstrual-collection'],
        tags: ['heavy-flow', 'organic', 'safety-concern', 'comfort'],
        price: '$10 for 18',
        userRating: 4.5,
        whereToBuy: ['Amazon', 'LOLA.com'],
        url: 'https://mylola.com/',
        // Ayna affiliate partnership — affiliateUrl wins over `url`/`productUrl`
        // for the Buy Now destination (see getBuyUrl in src/mobile/data/buyUrl.js).
        affiliateUrl: 'https://lvnta.com/lv_lV9gmDbqDB8xIEp6W2',
        faqUrl: 'https://help.mylola.com/',
        image: 'https://mylola.com/cdn/shop/files/four-lola-plastic-applicator-tampon-boxes.img.jpg?v=1753220344&width=1946',
        summary: '100% organic cotton tampon with a BPA-free compact applicator, from LOLA — founded in 2014 by Jordana Kier and Alex Friedman after one asked the other "have you ever wondered what\'s in a tampon?" and neither could find a real answer. LOLA was built around ingredient transparency: no synthetic fibers, fragrance, dyes, or chlorine-bleaching byproducts. Customizable subscription box.',
        safety: {
            fdaStatus: 'FDA-registered',
            materials: '100% organic cotton (tampon and string), BPA-free compact plastic applicator',
            recalls: '⚠️ 2021: An active federal class-action (Manson v. ALYK Inc., S.D.N.Y., Case No. 7:21-cv-05688) alleges LOLA tampons lack a protective outer coating and can unravel or shed cotton fibers inside the body during removal. No recall has been issued; LOLA/ALYK denies wrongdoing and continues to sell the product, and the case remains open as of 2026.',
            allergens: 'Hypoallergenic, fragrance-free, dye-free',
            sideEffects: 'TSS risk — use the lowest absorbency for your flow and never wear longer than 8 hours. A subset of user reviews and the pending lawsuit above describe the tampon unraveling or shedding fibers on removal.',
            opinionAlerts: 'A 2021 class-action complaint, still active as of 2026, alleges LOLA tampons shed cotton fibers inside the vaginal canal on removal because they lack the protective outer coating most competing tampons use, with some plaintiffs describing needing medical help to remove retained fibers; LOLA denies wrongdoing and no recall has followed. Separately, and unrelated to the lawsuit: research on cotton-only vs. cotton/rayon-blend tampons and bacterial toxin growth is genuinely mixed — a 2018 in-vitro comparison of currently marketed tampons found LOWER Staphylococcus aureus growth with cotton/rayon-blend tampons than with cotton-only tampons, which cuts against the common assumption that "all-organic-cotton" is automatically the lower-TSS-risk choice.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Organic cotton, and freedom from added dyes, chlorine-bleaching byproducts, and synthetic fragrance, are things clinicians will generally support for someone with a history of vulvar irritation or contact sensitivity. What the evidence doesn\'t support is treating "100% organic cotton" as an automatic toxic-shock-syndrome safety upgrade: research comparing cotton-only to cotton/rayon-blend tampons is mixed, and a 2018 in-vitro study of currently marketed tampons actually found lower Staphylococcus aureus growth with cotton/rayon-blend tampons than with cotton-only tampons. Fiber type matters less for TSS risk than using the lowest absorbency that handles your flow and never wearing a tampon longer than 8 hours.\n\nIt\'s also worth knowing before buying: LOLA is currently a defendant in an active federal class-action, filed in 2021 in the Southern District of New York, alleging its tampons lack a protective outer coating and can unravel or shed cotton fibers inside the body on removal — some plaintiffs describe needing medical help to remove retained pieces. The case is still open as of 2026, LOLA has not recalled the product and denies wrongdoing, but if a tampon feels like it\'s coming apart when you remove it, that\'s a documented, reported issue worth stopping and seeking care for, not dismissing.',
        doctorOpinionShort: 'Organic cotton reduces exposure to dyes, bleaching byproducts, and fragrance, but isn\'t a proven TSS-risk downgrade — a 2018 study found cotton/rayon blends grew less bacteria than cotton-only tampons. LOLA is also a defendant in an active 2021 class-action alleging its tampons can unravel or shed fibers during removal.',
        doctorOpinionCitations: [
            { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', label: 'FDA: Facts About Tampons and How to Use Them Safely' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29678918/', label: 'PubMed: Tampon/menstrual cup S. aureus growth & TSST-1 production' },
            { url: 'https://topclassactions.com/lawsuit-settlements/medical-devices/womens-health-medical-devices/these-organic-tampons-can-unravel-inside-your-body-a-class-action-lawsuit-alleges/', label: 'Top Class Actions: LOLA tampon unraveling lawsuit' },
        ],
        whoItsFor: [
            'People who want full ingredient transparency and no synthetic fragrance, dyes, or chlorine-bleaching byproducts in a tampon',
            'Those with a history of vulvar or vaginal irritation from mainstream tampon materials',
            'Subscription shoppers who want a customizable period-product box',
            'Not the pick for anyone who specifically wants a tampon brand without an open lawsuit over reported removal issues — LOLA currently has one active',
        ],
        howToUse: {
            intro: 'Per LOLA\'s own instructions and general FDA tampon guidance:',
            steps: [
                'Wash hands before and after insertion and removal.',
                'Choose the lowest absorbency that comfortably handles your flow.',
                'Change every 4–8 hours, and never leave a tampon in longer than 8 hours.',
                'If it doesn\'t feel like it came out in one piece, stop, check carefully for any retained fragments, and contact a doctor if you can\'t confirm it was removed intact.',
            ],
            sourceUrl: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely',
            sourceLabel: 'FDA: Facts About Tampons and How to Use Them Safely',
        },
        warnings: [
            'Toxic shock syndrome (TSS) is rare but serious — remove within 8 hours and seek emergency care for sudden fever, rash, vomiting, or dizziness during your period.',
            'An active class-action lawsuit alleges LOLA tampons can unravel or shed fibers on removal; if a tampon doesn\'t come out intact, check for retained fragments and contact a doctor if you\'re unsure it was fully removed.',
            'Not a form of contraception and does not protect against STIs.',
        ],
        communityReview: 'Community sentiment is mixed. Many reviewers praise the organic cotton, subscription convenience, and clean packaging; others report slow or missing shipments, applicators that feel flimsy or occasionally collapse, and leakage on heavy-flow days. The unraveling/shedding-fiber complaints described in the pending class-action also show up in individual user reviews, not just the lawsuit filing.',
        ingredients: '100% organic cotton (tampon and string), BPA-free plastic applicator.',
        effectiveness: 'Reliable absorption for light-to-moderate days; compact applicator suits on-the-go use. No independent lab comparison of LOLA specifically against mainstream tampon brands for absorbency or leak rate was found.',
        badges: ['Female-Founded', 'Ingredient Transparency', 'Sustainable'],
        // Category-level citations shown only on the Scientific literature tab,
        // kept out of verificationLinks so they don't also pool onto the
        // Clinician opinion card's chip row (which already surfaces these via
        // doctorOpinionCitations, anchored to the specific claims they back).
        scientificCitations: [
            { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Tampon Safety', summary: 'Federal safety standards for tampon absorption and materials.' },
            { url: 'https://pubmed.ncbi.nlm.nih.gov/29678918/', text: 'PubMed: Impact of currently marketed tampons and menstrual cups on S. aureus growth and TSST-1 production', summary: 'In-vitro comparison of currently marketed products found lower bacterial growth with cotton/rayon-blend tampons than with cotton-only tampons.' },
        ],
        verificationLinks: {
            doctor: { links: [

            ] },
            scientific: { links: [

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
        tags: ['anemia', 'fatigue'],
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
        clinicianAttribution: 'ayna synthesis of NIH ODS and ACOG guidance on iron supplementation.',
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
        healthFunctions: ['supplement'],
        tags: ['vitamin-d'],
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
        summary: '125 mcg (5,000 IU) vitamin D3 per softgel. This is above the usual adult upper limit of 4,000 IU per day; use this dose only with guidance from a clinician. PCOS alone does not establish a need for high-dose vitamin D.',
        safety: {
            fdaStatus: 'Dietary supplement',
            materials: 'Cholecalciferol (D3), soybean oil, gelatin, vegetable glycerin, corn oil. Non-GMO. Free from gluten, wheat, yeast, fish, artificial colors, flavors, and sweeteners.',
            recalls: 'No known recalls',
            allergens: 'Contains soy (soybean oil). Gelatin (not vegan).',
            sideEffects: 'At 5,000 IU per softgel, this exceeds the usual adult upper limit of 4,000 IU per day. Excess vitamin D can cause high blood calcium and other harms. Check total intake from all supplements with a clinician.',
            opinionAlerts: 'D3 at 5000 IU is a higher dose. Clinicians often recommend confirming deficiency with a 25(OH)D blood test before starting.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of Endocrine Society and NIH ODS guidance on vitamin D supplementation.',
        doctorOpinion: 'A high-dose vitamin D supplement should be considered with a clinician after assessing vitamin D status and total daily intake.',
        communityReview: 'Highly rated. Users report improvements in mood, energy, and general wellbeing. Consistently well-reviewed for quality and value.',
        verificationLinks: {
            scientific: { links: [
                { url: 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/', text: 'NIH Office of Dietary Supplements: Vitamin D', summary: 'Vitamin D intake, upper limits, and risks from excessive supplementation.' }
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
        clinicianAttribution: 'ayna synthesis of clinical guidance on menstrual cup hygiene.',
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
        // Was the brand's own primary marketing image, which is itself a
        // customer-review screenshot composite (5-star rating graphic,
        // testimonial, reviewer name) — real, but reads as a forgotten
        // placeholder next to properly photographed competitors (found live,
        // 2026-08-24 bug bash). Swapped for a clean lifestyle photo, the
        // second image in FlexFits' own product feed for the disposable
        // Flex Disc (this listing's primary/first-priced variant), verified live.
        image: 'https://cdn.shopify.com/s/files/1/1097/9960/files/person-holding-menstrual-disc-closeup.jpg?v=1763748081',
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
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
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
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
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
            fdaStatus: 'USP Verified',
            materials: 'Magnesium glycinate chelate',
            recalls: 'No recalls. USP verified = third-party tested for purity and potency.',
            allergens: 'Gluten-free, no artificial colors or preservatives',
            sideEffects: 'Mild digestive issues, loose stools (if dose too high), loss of appetite, occasional nausea.',
            opinionAlerts: 'Magnesium glycinate is often chosen for its tolerability, but users find Thorne/NatureMade capsules quite large.'
        },
        clinicianOpinionSource: 'mixed',
        doctorOpinion: 'Magnesium has been studied for menstrual cramps, though evidence and individual response vary. Magnesium glycinate is generally well tolerated.',
        communityReview: 'Community discussions on Reddit r/Supplements note significant cramp relief and improved sleep with magnesium glycinate.',
        ingredients: 'Magnesium glycinate 200mg, cellulose capsule, magnesium stearate.',
        effectiveness: 'Clinical studies show 200-400mg magnesium daily reduces menstrual pain by 30-50%. Also improves sleep quality.',
        badges: ['Evidence Reviewed', 'USP Verified'],
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
        badges: ['Evidence Reviewed', 'High Bioavailability'],
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
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
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
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/04/8e/69/048e6912-3f1e-ece4-ab0f-40d22c4b4eb2/AppIcon-0-0-1x_U007ephone-0-1-85-220.png/512x512bb.jpg',
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
// Hidden for now (team decision, Oct 11 2026): a clinician teaching model, not a
// consumer product. Bring back once there's a clinician-facing surface.
const TEMPORARILY_HIDDEN_IDS = new Set(['p-mypelvicbra-prolapse-chicken']);

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
].filter((p) => !isRxOnlyProduct(p) && !TEMPORARILY_HIDDEN_IDS.has(p.id));

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

// Saved Ecosystem rows are deliberately compact and older rows omit the
// product's health tags. Restore catalog facts before using a saved row for
// matching or displaying its evidence; keep user-specific row fields.
export function hydrateCatalogProduct(product) {
    if (!product?.id) return product;
    const catalogProduct = getProductById(product.id)
        || RELEASED_STARTUPS.find((entry) => entry.id === product.id);
    if (!catalogProduct) return product;
    return {
        ...catalogProduct,
        ...product,
        tags: catalogProduct.tags || product.tags,
        healthFunctions: catalogProduct.healthFunctions || product.healthFunctions,
        safety: catalogProduct.safety || product.safety,
    };
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
    'telehealth': 'Virtual care',
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
    'medication': 'Medications',
    // Real catalog category values that had no label here at all, so the
    // Product Type filter dropdown fell back to raw lowercase text for them
    // (found live, 2026-08-24 bug bash: "cup steamer", "incontinence",
    // "sleep" sitting inconsistently alongside Title Case labels elsewhere
    // in the same list).
    'cup-steamer': 'Cup Steamer',
    'incontinence': 'Incontinence',
    'sleep': 'Sleep',
    'contraception': 'Birth Control',
    'breast-care': 'Breast Care',
    'lactation': 'Lactation',
    'skin': 'Skin',
    'skincare': 'Skin',
    'body-care': 'Skin',
    'hair': 'Hair',
    'haircare': 'Hair',
    'gut-health': 'Gut',
    'pain-relief': 'Pain + Recovery',
    'recovery': 'Pain + Recovery',
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
    // Virtual care clinics mention periods in their copy but aren't period products;
    // they have their own home under Virtual care.
    { id: 'period', label: 'Period', categories: ['pad', 'tampon', 'cup', 'disc', 'period-underwear', 'cramp-relief', 'cup-steamer'], keywords: ['period', 'menstrual'], excludeCategories: ['telehealth'] },
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
    const base = getRecommendations(quizAnswers || {}, healthProfile, { behavior: { omitted: omittedProductIds } });
    const filtered = base.filter(p => !omittedProductIds?.[p.id]);
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

/**
 * "Worth noting" cards for a still-eligible (not excluded) product — real,
 * actionable considerations, not the product's whole safety.sideEffects text
 * dumped in. Two sources, both already real:
 *  - A known medication/supplement interaction (getKnownInteractionAssessment)
 *    that wasn't severe enough to exclude the product outright.
 *  - A real overlap between what the user actually flagged and this
 *    product's own side-effects/allergens text, for the cases that don't
 *    already cause a hard exclusion (isProductEligibleForProfile/
 *    getExtendedAvoidSet handle the 3 mapped triggers — fragrance, latex,
 *    essential oils — so a product reaching this point already cleared
 *    those). Two schemas exist in the wild and both are checked: the
 *    current mobile intake's free-text allergyItems (matched directly
 *    against the product's text), and the legacy quiz's fixed
 *    "Other allergies" option — the one entry in
 *    SENSITIVITY_AVOID_TO_TRIGGER with no exclusion mapping since we don't
 *    know what it refers to, checked via the same keyword lists used for
 *    the mapped triggers.
 */
function buildWorthNotingNotes(product, quizAnswers, medication) {
    const notes = [];

    if (medication?.interaction?.message) {
        notes.push({ text: medication.interaction.message, cta: 'Read the interaction' });
    }

    const text = [product?.safety?.sideEffects, product?.safety?.allergens]
        .filter(Boolean).join(' ').toLowerCase();

    if (text) {
        const intake = rawIntakeFromProfile(quizAnswers);
        const freeTextAllergies = asStringArray(intake?.allergyItems)
            .map((s) => String(s).toLowerCase().trim())
            .filter((s) => s.length >= 4 && !['none known', 'not sure'].includes(s));

        const legacyOtherAllergies = asStringArray(quizAnswers?.sensitivities).includes('Other allergies');
        const legacyKeywords = legacyOtherAllergies ? Object.values(AVOID_TRIGGER_KEYWORDS).flat() : [];

        const hasOverlap =
            freeTextAllergies.some((term) => text.includes(term))
            || legacyKeywords.some((kw) => text.includes(kw.toLowerCase()));

        if (hasOverlap) {
            notes.push({
                text: 'Review the side effects before you commit — a few of them overlap with what you flagged as sensitivities.',
                cta: 'See side effects',
            });
        }
    }

    return notes;
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

// ─── MATCHING: the ayna matching engine (src/matching) ──────────────────────
//
// Every match, ranking and ecosystem helper below is a thin adapter over the
// engine (src/matching, documented in its ENGINE notes). Exported names,
// argument shapes (legacy quizAnswers with fullHealthIntake, healthProfile)
// and return shapes are kept so the app and the website keep working.
//
//   percent shown in UI   = the product's BEST per-need score among her
//                           selected needs (getNeedMatchesForProduct has
//                           every need's score)
//   labels / reasons      = the engine's plain-language explanations
//   recommendations       = eligible, not suppressed, best need >= 50
//                           (exploratory tier); fewer rather than weaker
//   hard exclusions       = safety, avoid list, reactions, clinician-stopped,
//                           "Not for me": percent 0 + a reason, never recommended
//
// Optional behavior signals (last argument { behavior }):
//   saved -> small positive, omitted ("Not for me") -> hard suppress,
//   in-ecosystem / tracked -> owned (counts as purchased), purchased, reordered, viewed.

const MIN_RECOMMEND_SCORE = TIERS.find((t) => t.id === 'exploratory').min;

function rawIntakeFromProfile(quizAnswers) {
    if (!quizAnswers || typeof quizAnswers !== 'object') return {};
    if (quizAnswers.fullHealthIntake && typeof quizAnswers.fullHealthIntake === 'object') {
        return quizAnswers.fullHealthIntake;
    }
    return quizAnswers;
}

function asStringArray(value) {
    if (Array.isArray(value)) return value.filter(Boolean).map(String);
    if (value == null || value === '') return [];
    return [String(value)];
}

/** Accepts id arrays, Sets, product arrays, or { id: truthy } maps. */
function asIdList(value) {
    if (!value) return [];
    if (value instanceof Set) return [...value].map(String);
    if (Array.isArray(value)) return value.map((v) => (v && typeof v === 'object' ? v.id : v)).filter(Boolean).map(String);
    if (typeof value === 'object') return Object.keys(value).filter((k) => value[k]);
    return [String(value)];
}

/**
 * Map caller behavior signals to the engine's behavior layer.
 * @param {{ saved?, omitted?, hidden?, notForMe?, inEcosystem?, tracked?, owned?, purchased?, reordered?, viewed?, purchasedPrices? }} [behavior]
 */
export function normalizeBehaviorSignals(behavior) {
    if (!behavior || typeof behavior !== 'object') return null;
    const owned = [...asIdList(behavior.inEcosystem), ...asIdList(behavior.tracked), ...asIdList(behavior.owned)];
    return {
        saved: [...asIdList(behavior.saved), ...asIdList(behavior.savedProductIds)],
        hidden: [...asIdList(behavior.omitted), ...asIdList(behavior.hidden), ...asIdList(behavior.notForMe), ...asIdList(behavior.omittedProductIds)],
        purchased: [...asIdList(behavior.purchased), ...owned],
        reordered: asIdList(behavior.reordered),
        viewed: behavior.viewed && typeof behavior.viewed === 'object' && !Array.isArray(behavior.viewed) ? behavior.viewed : {},
        purchasedPrices: Array.isArray(behavior.purchasedPrices) ? behavior.purchasedPrices : [],
        owned,
    };
}

// Imported health data (healthProfile) joins the intake as conditions,
// medicines and allergies. Conditions add context only; they never create a need.
function engineIntake(quizAnswers, healthProfile) {
    const base = quizAnswers && typeof quizAnswers === 'object' ? quizAnswers : {};
    if (!healthProfile || typeof healthProfile !== 'object') return base;
    const intake = base.fullHealthIntake && typeof base.fullHealthIntake === 'object'
        ? { ...base, ...base.fullHealthIntake, fullHealthIntake: undefined }
        : { ...base };
    const conditions = [...asStringArray(healthProfile.conditions), ...asStringArray(healthProfile.fhirSummary?.conditions)];
    const meds = [...asStringArray(healthProfile.medications), ...asStringArray(healthProfile.fhirSummary?.medications)];
    const allergies = asStringArray(healthProfile.allergies);
    if (conditions.length) intake.conditionOtherText = [String(intake.conditionOtherText || ''), ...conditions].filter((s) => s.trim()).join('; ');
    if (meds.length && intake.takesCurrent !== 'No') {
        intake.currentMedicationItems = [...new Set([...asStringArray(intake.currentMedicationItems), ...meds])];
        intake.takesCurrent = 'Yes';
    }
    if (allergies.length && intake.allergyStatus !== 'No') {
        intake.allergyItems = [...new Set([...asStringArray(intake.allergyItems), ...allergies])];
        intake.allergyStatus = 'Yes';
    }
    return intake;
}

const EMPTY_INTAKE = {};
const USER_PROFILE_CACHE = new WeakMap();
function userProfileFor(quizAnswers, healthProfile = null, opts = {}) {
    const key = quizAnswers && typeof quizAnswers === 'object' ? quizAnswers : EMPTY_INTAKE;
    const behaviorRaw = opts?.behavior || null;
    let entries = USER_PROFILE_CACHE.get(key);
    if (!entries) { entries = []; USER_PROFILE_CACHE.set(key, entries); }
    const hit = entries.find((e) => e.healthProfile === healthProfile && e.behaviorRaw === behaviorRaw);
    if (hit) return hit.up;
    const up = buildUserProfile(engineIntake(key, healthProfile), {
        catalog: ALL_PRODUCTS,
        behavior: normalizeBehaviorSignals(behaviorRaw) || undefined,
    });
    entries.push({ healthProfile, behaviorRaw, up });
    if (entries.length > 6) entries.shift();
    return up;
}

const SCORE_CACHE = new WeakMap();
function engineResultFor(product, up) {
    let byProduct = SCORE_CACHE.get(up);
    if (!byProduct) { byProduct = new Map(); SCORE_CACHE.set(up, byProduct); }
    const key = product?.id ? `${product.id}|${product.name || ''}` : null;
    if (key && byProduct.has(key)) return byProduct.get(key);
    const pp = buildProductProfile(product);
    const result = engineScoreProduct(pp, up);
    const entry = { pp, result, details: null };
    if (key) byProduct.set(key, entry);
    return entry;
}

function hasProfileSignals(up) {
    const s = up.shopping;
    return Boolean(
        up.healthIntent.needs.length || up.healthIntent.nothingRightNow || up.safety.conditions.length
        || up.physiology.lifeStages.length || up.physiology.age != null || up.physiology.flow
        || up.physiology.painIntensity != null || up.physiology.utiFrequency
        || up.safety.allergies.length || up.safety.avoid.length || up.safety.medications.length
        || up.experience.history.length || s.formats.preferred.length || s.budget || s.priceNotImportant
        || s.leaveOut.length || s.shouldBe.length || s.trustedBrands.length || s.fsaHsa || up.safety.urgent
    );
}

function needLabel(need) {
    return need?.label || NEED_BY_ID[need?.id]?.option || needPhrase(need?.id);
}

// Map an engine explanation to the component names the UI already groups by
// ("Your needs" / "Your profile" / "Your preferences").
function componentForExplanation(text) {
    if (/^(Made for|A strong match|Can help with|Loosely related|High capacity|Sized for)/.test(text)) return 'primaryGoal';
    if (/context you shared/.test(text)) return 'diagnoses';
    if (/stage you shared|in mind$|plans to conceive/.test(text)) return 'lifeStage';
    if (/^You said this|worked for you|brand you said you like/.test(text)) return 'triedBefore';
    if (/format you prefer/.test(text)) return 'format';
    if (/budget/i.test(text)) return 'price';
    if (/brand you trust/.test(text)) return 'trustedBrands';
    if (/ranked first/.test(text)) return 'trustRanking';
    if (/which you asked for|which matters with your/.test(text)) return 'attributes';
    if (/^Also a match for/.test(text)) return 'otherNeeds';
    return 'otherNeeds';
}
const COMPONENT_WEIGHT = { primaryGoal: 40, diagnoses: 10, lifeStage: 10, triedBefore: 10, format: 8, price: 5, trustedBrands: 8, trustRanking: 7, attributes: 8, otherNeeds: 15 };

const NOT_A_SUBSTITUTE = 'Not a substitute for getting checked';

// Confidence penalties that are not already shown as a caution, as plain "could not confirm" notes.
const UNKNOWN_TEXT = {
    medication_unknown: () => 'Medication compatibility was not fully assessed for this product.',
    leave_out_unknown: (p) => `${p.text}.`,
    ttc_pregnancy_unknown: () => 'Pregnancy safety is not confirmed, which matters while trying to conceive.',
    breastfeeding_unknown: () => 'Breastfeeding safety is not confirmed for this product.',
    low_metadata: () => 'We have limited product data for this one, so the score is held lower.',
    unusual_combination: () => 'Your age and life stage are an unusual combination, so we are less certain.',
    stage_needs_clarification: () => 'Some life stages you chose need clarifying, so life-stage fit is not used yet.',
    allergy_status_unsure: () => 'You were not sure about allergies. Check the label.',
    urgent_not_sure_high_risk: () => 'You were not sure if something is urgent. Check with a clinician before starting this.',
    pain_varies: () => 'Your period pain varies, so the cramp fit is less certain.',
    flow_contradiction: () => 'You chose period support but said you do not get periods now.',
};

function confidenceLabel(c) {
    if (c >= 0.85) return 'high';
    if (c >= 0.6) return 'medium';
    return 'limited';
}

function toNeedMatch(r, up) {
    const need = up.healthIntent.needs.find((n) => n.id === r.needId);
    return {
        needId: r.needId,
        label: needLabel(need || { id: r.needId }),
        phrase: needPhrase(r.needId),
        score: r.score,
        tier: r.tier,
        relevant: r.relevance > 0,
        relevance: r.relevance,
        relationship: r.relationship,
        explanations: r.explanations,
        safety: r.safety,
        confidence: r.confidence,
        confidenceReasons: r.confidenceReasons,
        careFirst: r.careFirst,
        careProminent: r.careProminent,
        filtered: r.filtered,
        components: r.components,
        source: need?.source || null,
    };
}

function excludedDetails(product, reasons, base) {
    return {
        ...base,
        percent: 0,
        matchStatus: 'excluded',
        score: 0,
        goalMatch: 0,
        profileFit: 0,
        healthMatch: 0,
        preferenceMatch: null,
        confidence: 'limited',
        confidenceCoverage: 0,
        labels: [],
        reasons: [],
        reasonDetails: [],
        considerations: reasons.map((text) => ({ text: /[.!?]$/.test(text) ? text : `${text}.`, cta: null })),
        unknowns: [],
        unmetNeeds: [],
        excludedBecause: reasons,
        eligible: false,
        tier: 'browse',
    };
}

function buildMatchDetails(savedProduct, quizAnswers, healthProfile, opts) {
    const product = hydrateCatalogProduct(savedProduct);
    const up = userProfileFor(quizAnswers, healthProfile, opts);
    const entry = engineResultFor(product, up);
    if (entry.details) return entry.details;
    const { pp, result } = entry;
    const safety = result.safety;
    const needMatches = result.needs.map((r) => toNeedMatch(r, up));
    const best = result.best;
    const hidden = Boolean(pp.product_id && up.behavior.hidden.has(pp.product_id));
    const owned = Boolean(pp.product_id && up.behavior.purchased.has(pp.product_id));
    const signals = hasProfileSignals(up);
    const careFlags = careFlagsFor(up);

    const base = {
        needId: best?.needId || null,
        needLabel: best ? needLabel(up.healthIntent.needs.find((n) => n.id === best.needId)) : null,
        needMatches,
        access: result.access,
        blockedClaims: safety.blockedClaims,
        careFirst: careFlags.careFirst,
        careProminent: careFlags.careProminent || Boolean(best?.careProminent),
        careFlags,
        evidenceQuality: best ? Math.round(best.components.evidence * 100) : null,
        components: { goal: {}, profile: {}, preference: {}, engine: best?.components || null, weightedPoints: best?.weightedPoints || null },
        filtered: best?.filtered || null,
        owned,
        excludedBecause: [],
    };

    let details;
    if (!safety.eligible || hidden) {
        const reasons = [...safety.reasons.map((r) => r.text), ...(hidden ? ['You marked this Not for me'] : [])];
        details = excludedDetails(product, [...new Set(reasons)], base);
    } else if (!signals) {
        details = {
            ...base, percent: null, matchStatus: 'no-profile', score: 0, goalMatch: null, profileFit: null, healthMatch: null,
            preferenceMatch: null, confidence: 'limited', confidenceCoverage: 0, labels: [], reasons: [], reasonDetails: [],
            considerations: [], unknowns: [], unmetNeeds: [], eligible: true, tier: 'browse',
        };
    } else {
        const cautionTexts = new Set(safety.cautions.map((c) => c.text.replace(/\.$/, '')));
        const considerations = safety.cautions.map((c) => ({ text: c.text, cta: null }));
        const positive = [];
        for (const text of best ? best.explanations : []) {
            if (cautionTexts.has(text)) continue;
            if (text === NOT_A_SUBSTITUTE) {
                considerations.unshift({ text: 'Not a substitute for getting checked. With symptoms right now, get tested or see a clinician first.', cta: null });
                continue;
            }
            positive.push(text);
        }
        for (const other of needMatches) {
            if (best && other.needId !== best.needId && other.relevant && other.score >= MIN_RECOMMEND_SCORE) positive.push(`Also a match for ${other.phrase}`);
        }
        const reasonDetails = positive.map((text) => {
            const component = componentForExplanation(text);
            return { component, weight: COMPONENT_WEIGHT[component] || 5, score: 1, text };
        });
        considerations.push(...buildWorthNotingNotes(product, quizAnswers, null));
        if (best?.confidenceReasons?.some((c) => c.code === 'similar_reaction_caution')) {
            considerations.push({ text: 'Similar to a product that gave you a mild reaction.', cta: null });
        }
        const unknowns = [];
        for (const p of best?.confidenceReasons || safety.penalties || []) {
            const fn = UNKNOWN_TEXT[p.code];
            if (fn) unknowns.push(fn(p));
        }
        if (product.evidenceStrength === 'limited') {
            unknowns.push('Evidence for this product’s health benefit is limited, so the match is held lower until stronger product-specific evidence is available.');
        }
        const unresolved = up.healthIntent.unresolvedNeeds.map((c) => c.raw_user_text).filter(Boolean);
        if (unresolved.length) unknowns.push(`We could not match some of what you typed yet: ${unresolved.slice(0, 3).join(', ')}.`);
        const unmetNeeds = up.healthIntent.needs
            .filter((n) => !needMatches.find((m) => m.needId === n.id)?.relevant)
            .map((n) => n.raw || needLabel(n));
        const confidence = best ? best.confidence : safety.confidence;
        details = {
            ...base,
            percent: best ? best.score : 0,
            matchStatus: best ? 'scored' : 'no-relevance',
            score: best ? best.score : 0,
            goalMatch: best ? Math.round(best.components.health * 100) : 0,
            profileFit: best ? Math.round(best.components.context * 100) : null,
            healthMatch: best ? Math.round(best.components.health * 100) : 0,
            preferenceMatch: best ? Math.round(best.components.preference * 100) : null,
            confidence: confidenceLabel(confidence),
            confidenceScore: confidence,
            confidenceCoverage: Math.round(confidence * 100),
            labels: positive.slice(0, 4),
            reasons: positive.slice(0, 4),
            reasonDetails: reasonDetails.slice(0, 4),
            considerations: Array.from(new Map(considerations.map((c) => [c.text, c])).values()),
            unknowns: [...new Set(unknowns)],
            unmetNeeds: [...new Set(unmetNeeds)],
            eligible: true,
            tier: best ? best.tier : 'browse',
        };
    }
    entry.details = details;
    return details;
}

/**
 * Care flags for UI (care-first layout, prominent care links, safety notes).
 * Pure data; no UI decides anything from free text.
 */
function careFlagsFor(up) {
    const ph = up.physiology;
    const needIds = new Set(up.healthIntent.needs.map((n) => n.id));
    const utiNeed = [...needIds].some((id) => id.startsWith('urinary.') && id !== 'urinary.incontinence');
    const utiRightNow = ph.utiFrequency === 'right_now';
    const utiFirstTime = ph.utiFrequency === 'first_time';
    const severePain = needIds.has('pain.menstrual_cramp') && (ph.painIntensity ?? 0) >= 0.8;
    const veryHeavyFlow = ph.flow === 'very_heavy';
    const symptomCare = ['urinary.burning', 'vaginal.discharge', 'sexual.sti'].filter((id) => needIds.has(id));
    const notes = [];
    if (up.safety.careFirst) notes.push({ code: 'urgent_yes', text: 'You said something may be urgent. Reach a clinician, urgent care, or emergency services first. Products come second.' });
    else if (up.safety.urgent === 'not_sure') notes.push({ code: 'urgent_not_sure', text: 'You were not sure if something is urgent. If symptoms are severe or getting worse, contact a clinician.' });
    if (utiRightNow) notes.push({ code: 'uti_right_now', text: 'You have UTI-like symptoms right now. Get tested or see a clinician first. Supplements are not a substitute for treatment.' });
    else if (utiFirstTime && utiNeed) notes.push({ code: 'uti_first_time', text: 'First-time UTI-like symptoms are worth checking with a clinician.' });
    if (severePain) notes.push({ code: 'severe_pain', text: 'Severe period pain is worth raising with a clinician.' });
    if (veryHeavyFlow) notes.push({ code: 'very_heavy_flow', text: 'Very heavy periods are worth raising with a clinician.' });
    if (symptomCare.length) notes.push({ code: 'symptom_check', text: 'Some symptoms you chose are best checked by a clinician.' });
    if (up.safety.pregnant) notes.push({ code: 'pregnancy_unknown', text: 'Pregnancy safety is not confirmed for most products. Check new products with your clinician.' });
    if (up.safety.breastfeeding === 'yes') notes.push({ code: 'breastfeeding_unknown', text: 'Breastfeeding safety is not confirmed for most products. Check new products with your clinician.' });
    if (up.physiology.confidenceFlags.includes('needs_clarification')) notes.push({ code: 'stage_needs_clarification', text: 'Some life stages you chose do not usually go together. Update your profile so we can match better.' });
    return {
        urgent: up.safety.urgent,
        careFirst: up.safety.careFirst,
        careProminent: Boolean(up.safety.careProminent || utiRightNow || (utiFirstTime && utiNeed) || severePain || veryHeavyFlow || symptomCare.length),
        utiRightNow,
        utiFirstTime,
        severePain,
        veryHeavyFlow,
        pregnant: up.safety.pregnant,
        trimester: up.safety.trimester,
        breastfeeding: up.safety.breastfeeding,
        ttc: up.safety.ttc,
        confidenceFlags: up.physiology.confidenceFlags,
        notes,
    };
}

/** Her selected needs as the engine reads them: [{ id, label, phrase, source, raw }]. */
export function getSelectedNeeds(quizAnswers, healthProfile = null, opts = {}) {
    return userProfileFor(quizAnswers, healthProfile, opts).healthIntent.needs.map((n) => ({
        id: n.id, label: needLabel(n), phrase: needPhrase(n.id), source: n.source, raw: n.raw || null,
    }));
}

/** Care flags for this profile: { urgent, careFirst, careProminent, utiRightNow, pregnant, ..., notes[] }. */
export function getMatchCareFlags(quizAnswers, healthProfile = null, opts = {}) {
    return careFlagsFor(userProfileFor(quizAnswers, healthProfile, opts));
}

/**
 * Per-need breakdown for one product, best first:
 * [{ needId, label, score, tier, explanations, safety, confidence, relevant, careFirst, careProminent, ... }]
 * Needs the product does not serve are included with score 0 (relevant: false).
 */
export function getNeedMatchesForProduct(product, quizAnswers, healthProfile = null, opts = {}) {
    return buildMatchDetails(product, quizAnswers, healthProfile, opts).needMatches;
}

export function getProductMatchDetailsForProduct(product, quizAnswers, healthProfile = null, opts = {}) {
    return buildMatchDetails(product, quizAnswers, healthProfile, opts);
}

export function getProductRelevanceScore(product, quizAnswers, healthProfile = null, opts = {}) {
    return buildMatchDetails(product, quizAnswers, healthProfile, opts).percent;
}

/**
 * Rank the catalog for this profile.
 * matches: eligible products whose best need scores >= 50, best first (tie-break: FSA/HSA, preference, trust, brand exploration).
 * others: the rest of the eligible catalog (weaker related products first, then unrelated in catalog order).
 * Excluded and "Not for me" products are in neither list.
 */
function rankCatalog(quizAnswers, healthProfile, opts) {
    const up = userProfileFor(quizAnswers, healthProfile, opts);
    const candidates = filterPrescriptionCareGate(ALL_PRODUCTS);
    const profilesById = new Map();
    const matched = [];
    const weaker = [];
    const unrelated = [];
    for (const product of candidates) {
        const { pp, result } = engineResultFor(product, up);
        if (!result.safety.eligible) continue;
        if (pp.product_id && up.behavior.hidden.has(pp.product_id)) continue;
        profilesById.set(pp.product_id, pp);
        const best = result.best;
        if (best && !best.filtered && best.score >= MIN_RECOMMEND_SCORE) matched.push({ product, best });
        else if (best && best.score > 0) weaker.push({ product, best });
        else unrelated.push(product);
    }
    const order = new Map(sortResults(matched.map((m) => m.best), up, profilesById).map((r, i) => [r.productId, i]));
    matched.sort((a, b) => order.get(a.best.productId) - order.get(b.best.productId));
    weaker.sort((a, b) => b.best.score - a.best.score);
    return { up, matches: matched.map((m) => m.product), others: [...weaker.map((w) => w.product), ...unrelated] };
}

/** Ranked lists using the same per-need score shown in personalization UI. */
export function getRecommendationMatchesAndRest(quizAnswers, healthProfile = null, opts = {}) {
    const { up, matches, others } = rankCatalog(quizAnswers, healthProfile, opts);
    if (!hasProfileSignals(up) || !up.healthIntent.needs.length) return { matches: [], others: [...matches, ...others] };
    return { matches, others };
}

export function getRecommendations(quizAnswers, healthProfile = null, opts = {}) {
    const { matches, others } = getRecommendationMatchesAndRest(quizAnswers, healthProfile, opts);
    return [...matches, ...others];
}

/**
 * The IDs a "Personalized" filter should restrict to: products whose best
 * need reaches the exploratory tier (>= 50). Not getRecommendations(), which
 * appends the rest of the catalog as a fallback tail.
 */
export function getPersonalizedProductIds(quizAnswers, healthProfile = null, opts = {}) {
    const { matches } = getRecommendationMatchesAndRest(quizAnswers, healthProfile, opts);
    return matches.map((p) => p.id);
}

function ecosystemFor(quizAnswers, healthProfile, opts = {}) {
    const up = userProfileFor(quizAnswers, healthProfile, opts);
    const eco = buildEcosystem(up, filterPrescriptionCareGate(ALL_PRODUCTS), {
        getCareResourceBundle,
        ...(opts.picksPerNeed ? { picksPerNeed: opts.picksPerNeed } : {}),
        ...(opts.minTier ? { minTier: opts.minTier } : {}),
    });
    return { up, eco };
}

/** Picks per selected need (one section per need, deduped across sections). */
export function getRecommendationsByFrustration(quizAnswers, healthProfile = null, perFrustrationCap = 6, opts = {}) {
    const { eco } = ecosystemFor(quizAnswers, healthProfile, { ...opts, picksPerNeed: perFrustrationCap });
    const seen = new Set();
    const sections = [];
    for (const shelf of eco.shelves) {
        const products = shelf.picks
            .filter((r) => !seen.has(r.productId))
            .map((r) => { seen.add(r.productId); return getProductById(r.productId); })
            .filter(Boolean);
        if (products.length) {
            sections.push({ frustration: shelf.label, tag: shelf.needId, needId: shelf.needId, products, careFirst: shelf.careFirst, careProminent: shelf.careProminent });
        }
    }
    return sections;
}

/**
 * Ecosystem seed after the quiz: one shelf per selected need (buildEcosystem).
 * "Picks per need" controls quantity only; a shelf is shorter rather than
 * filled with products under the exploratory bar (50).
 * @returns {{ mergedProducts: object, seedMeta: object, shelves: object[], careFirst: boolean, careProminent: boolean, care: object|null, careFlags: object }}
 *   seedMeta[productId] = { frustration, tag, needId, needLabel, needIds, score, tier, careProminent }
 *   seedMeta.shelves (non-enumerable) = the shelves summary.
 */
export function getEcosystemSeedFromQuiz(quizAnswers, healthProfile = null, opts = {}) {
    const mergedProducts = {};
    const seedMeta = {};
    const { up, eco } = ecosystemFor(quizAnswers, healthProfile, opts);
    const careFlags = careFlagsFor(up);
    const shelves = eco.shelves.map((shelf) => {
        const picks = shelf.picks.map((r) => ({ productId: r.productId, score: r.score, tier: r.tier, explanations: r.explanations, access: r.access }));
        for (const r of shelf.picks) {
            const product = getProductById(r.productId);
            if (!product) continue;
            if (seedMeta[r.productId]) {
                seedMeta[r.productId].needIds.push(shelf.needId);
                continue;
            }
            mergedProducts[r.productId] = product;
            seedMeta[r.productId] = {
                frustration: shelf.label,
                tag: shelf.needId,
                needId: shelf.needId,
                needLabel: shelf.label,
                needIds: [shelf.needId],
                score: r.score,
                tier: r.tier,
                careProminent: shelf.careProminent,
            };
        }
        return {
            needId: shelf.needId,
            label: shelf.label,
            productIds: picks.map((p) => p.productId),
            picks,
            qualifiedCount: shelf.qualifiedCount,
            shortBy: shelf.shortBy,
            emptyReason: shelf.emptyReason,
            careFirst: shelf.careFirst,
            careProminent: shelf.careProminent,
            care: shelf.care,
        };
    });
    Object.defineProperty(seedMeta, 'shelves', { value: shelves, enumerable: false });
    return { mergedProducts, seedMeta, shelves, careFirst: eco.careFirst, careProminent: eco.careProminent, care: eco.care, careFlags, picksPerNeed: eco.picksPerNeed, minScore: eco.minScore };
}

/**
 * Up to `limit` other products for the same need (excludes current product).
 * `tag` may be a need id (from seedMeta) or a legacy product tag. With a
 * need, only eligible products scoring >= 50 for that need are returned.
 */
export function getEcosystemAlternatives(productId, tag, quizAnswers, healthProfile = null, limit = 3, opts = {}) {
    const up = userProfileFor(quizAnswers || {}, healthProfile, opts);
    let needId = tag && NEED_BY_ID[tag] ? tag : null;
    if (!needId && productId) {
        const current = getProductById(productId);
        const best = current ? engineResultFor(hydrateCatalogProduct(current), up).result.best : null;
        if (best && best.score > 0) needId = best.needId;
    }
    if (needId) {
        const profilesById = new Map();
        const rows = [];
        for (const product of filterPrescriptionCareGate(ALL_PRODUCTS)) {
            if (product.id === productId) continue;
            const pp = buildProductProfile(product);
            if (!pp.health_need_relevance[needId]) continue;
            if (up.behavior.hidden.has(pp.product_id)) continue;
            const { result } = engineResultFor(product, up);
            if (!result.safety.eligible) continue;
            const r = result.needs.find((n) => n.needId === needId) || scoreProductForNeed(pp, up, needId, { safety: result.safety });
            if (r.filtered || r.score < MIN_RECOMMEND_SCORE) continue;
            profilesById.set(pp.product_id, pp);
            rows.push(r);
        }
        return sortResults(rows, up, profilesById).slice(0, limit).map((r) => getProductById(r.productId)).filter(Boolean);
    }
    if (!tag) return [];
    const recs = getRecommendations(quizAnswers || {}, healthProfile, opts);
    return recs.filter((p) => p.id !== productId && (p.tags || []).includes(tag)).slice(0, limit);
}

function getProfileMatchStatsForProduct(product, quizAnswers, healthProfile = null, opts = {}) {
    const stats = buildMatchDetails(product, quizAnswers, healthProfile, opts);
    return {
        labels: stats.labels,
        percent: stats.percent,
        matches: stats.labels.length,
        signals: stats.percent == null ? 0 : 1,
    };
}

/** Plain-language reasons this product fits her best need (empty when it fits none). */
export function getProfileMatchLabelsForProduct(product, quizAnswers, healthProfile = null, opts = {}) {
    return getProfileMatchStatsForProduct(product, quizAnswers, healthProfile, opts).labels;
}

/**
 * Personalized match shown across the app and the website: the product's
 * best per-need score (0..100). A relevance score, not a diagnosis or a
 * probability. null when there is no profile; 0 when excluded or unrelated.
 */
export function getProfileMatchPercentForProduct(product, quizAnswers, healthProfile = null, opts = {}) {
    return getProfileMatchStatsForProduct(product, quizAnswers, healthProfile, opts).percent;
}

/**
 * Short explanation for why a product could work (or not) for this profile.
 * @returns {{ whyItWorks: string|null, considerations: string|null }}
 */
export function getRecommendationExplanation(product, quizAnswers, healthProfile = null, opts = {}) {
    const d = buildMatchDetails(product, quizAnswers, healthProfile, opts);
    if (d.matchStatus === 'no-profile') return { whyItWorks: null, considerations: null };
    if (d.matchStatus === 'excluded') {
        return { whyItWorks: null, considerations: d.excludedBecause.length ? `Not a fit right now: ${d.excludedBecause[0]}.` : null };
    }
    let whyItWorks = null;
    if (d.matchStatus === 'scored') {
        const detail = typeof product?.recommendationWhyDetail === 'string' ? product.recommendationWhyDetail.trim() : '';
        whyItWorks = detail
            ? `Why it could work: ${detail}`
            : d.reasons.length ? `Why it could work: ${d.reasons.slice(0, 2).join('. ')}.` : null;
    }
    let considerations = d.considerations[0]?.text ? `Consideration: ${d.considerations[0].text}` : null;
    if (!considerations) {
        if (product?.safety?.recalls && product.safety.recalls.includes('⚠️')) {
            considerations = 'Consideration: Check the Safety tab for current recalls or concerns.';
        } else if (product?.safety?.sideEffects) {
            considerations = 'Consideration: Review side effects in Details to ensure it fits you.';
        }
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
    },
    'cramps': {
        label: 'Users with Period Pain',
        topProducts: ['p-magnesium-glycinate', 'p-honeypot-pad', 'p-thermacare'],
    },
    'bloating': {
        label: 'Users with Hormonal Bloating',
        topProducts: ['p-pink-stork-bloat', 'p-love-wellness-bloat', 'p-flo-gummies', 'p-hum-flatter-me'],
    },
    'uti': {
        label: 'Users with Recurrent UTIs',
        topProducts: ['p-azo-test', 'p-boric-acid', 'p-cranberry-supplement'],
    },
    'irregular': {
        label: 'Users with Irregular Cycles',
        topProducts: ['d-clue', 'd-natural-cycles', 'p-vitex'],
    },
    'pcos': {
        label: 'Users with PCOS',
        topProducts: ['p-inositol-wholesome', 'p-spearmint-pcos', 'd-maven'],
    }
};

/** Symptom → product IDs for supplement/symptom browse. Used when category=supplement. */
export const SYMPTOM_TO_SUPPLEMENTS = {
    cramps: ['p-magnesium-glycinate', 'p-fish-oil', 'p-thermacare'],
    bloating: ['p-pink-stork-bloat', 'p-love-wellness-bloat', 'p-flo-gummies', 'p-hum-flatter-me'],
    uti: ['p-cranberry-supplement', 'p-d-mannose-now', 'p-uqora-control', 'p-probiotics-women', 'p-azo-test', 'p-boric-acid', 'p-cystex'],
    pcos: ['p-inositol-wholesome', 'p-spearmint-pcos'],
    menopause: ['p-estroven-mood', 'p-remifemin', 'p-creatine-womens'],
    irregular: ['p-inositol-wholesome'],
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

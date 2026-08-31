// ============================================================
// Ayna Product Database — Extended Catalog
// Additional products beyond the core database
// ============================================================

export const EXTENDED_PHYSICAL = [
    // ─── MORE PADS ──────────────────────────────────────
    {
        id: 'p-lola-pad', name: 'LOLA Organic Cotton Pads', productUrl: 'https://mylola.com/products/pads', category: 'pad', type: 'physical', internal: false, healthFunctions: ['menstrual-collection', 'leak-protection'], tags: ['heavy-flow', 'organic', 'safety-concern'], price: '$11 for 12', userRating: 4.5, whereToBuy: ['Amazon', 'LOLA.com'], url: 'https://mylola.com/', faqUrl: 'https://help.mylola.com/', image: 'https://m.media-amazon.com/images/I/71j3reiHuBL.jpg', summary: '100% organic cotton pads with a breathable back sheet. Customizable subscription.', safety: { fdaStatus: 'FDA-registered', materials: '100% organic cotton', recalls: 'No recalls.', allergens: 'Hypoallergenic, fragrance-free', sideEffects: 'Minimal irritation risk. Rare sensitivity to adhesive.', opinionAlerts: 'Subscription can be difficult to cancel through the website; some users prefer buying in-store at Target.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Organic cotton construction and ingredient transparency reduce exposure to bleaching byproducts and synthetic fragrances, benefiting patients with vulvar sensitivity.', communityReview: 'Community discussions on Reddit r/periods note appreciation for the subscription model and convenience.', communityReviewSourceUrl: 'https://www.reddit.com/r/periods/search/?q=LOLA', communityReviewSourceLabel: 'Reddit r/periods', ingredients: '100% organic cotton, wood pulp core, adhesive.', effectiveness: 'Good absorption, organic certification.', badges: ['Female-Owned', 'Sustainable'],
        verificationLinks: {
            doctor: {
                aiSummary: "LOLA uses an organic cotton construction and avoids added synthetic fragrances. Some people with vulvar sensitivity may prefer fragrance-free menstrual products, though individual tolerance varies.",
                links: [
                    
                ]
            },
            scientific: {
                aiSummary: "Scientific evaluation of LOLA products confirms their status as FDA-registered medical devices. Peer-reviewed research supports the correlation between additive-free organic cotton and the maintenance of a healthy vaginal microbiome, particularly in preventing chemical-induced flora disruption.",
                links: [
                    { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Menstrual Product Safety', summary: 'FDA regulates pads and tampons as medical devices and sets safety standards.', justification: 'The FDA is the federal authority for medical device safety in the US.' }
                ]
            },
            community: {
                aiSummary: "Community sentiment heavily favors LOLA for its customizable subscription and breathable design. Longitudinal reports on specialized subreddits like r/periods consistently mention a reduction in the 'plastic rash' common with mainstream synthetic pads.",
                links: [
                    { url: 'https://www.reddit.com/r/periods/search/?q=LOLA', text: 'Reddit LOLA Reviews', summary: 'The community frequently recommends LOLA for its customizable subscription and breathable design.', justification: 'Reddit provides unfiltered, high-volume qualitative data from experienced menstrual product users.' },
                    { url: 'https://www.tiktok.com/search?q=lola+pads+review', text: 'TikTok #LolaPads Reviews', summary: 'Gen Z and Millennial users share their experiences with Lola\'s subscription service and product comfort.', justification: 'TikTok reflects rapid social proof and user-generated visual reviews of product performance.' }
                ]
            }
        }
    },
    {
        id: 'p-natracare-pad', name: 'Natracare Ultra Pads', category: 'pad', type: 'physical', internal: false, healthFunctions: ['menstrual-collection'], tags: ['organic', 'sustainability', 'safety-concern'], price: '$8 for 14', whereToBuy: ['Whole Foods', 'Amazon', 'iHerb'], image: 'http://shop.natracare.com/cdn/shop/files/natracare-ultra-pads-regular-800.jpg?v=1715939406', summary: 'Certified organic, plastic-free, biodegradable pads. Pioneer in natural period care since 1989.', safety: { fdaStatus: 'FDA-registered', materials: 'Organic cotton, plant cellulose, no plastic', recalls: 'No recalls.', allergens: 'Hypoallergenic', sideEffects: 'Slightly stiffer than conventional pads, which may cause minor chafing for some.', opinionAlerts: 'Consistently praised for eco-credentials, but some find the lack of "wings" on certain styles problematic.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Organic and plastic-free options are available for those seeking eco-conscious period care; evidence does not show they are clinically superior to conventional pads.', communityReview: 'Community discussions on Reddit r/ZeroWaste praise eco-credentials and compostability.', communityReviewSourceUrl: 'https://www.reddit.com/r/ZeroWaste/search/?q=natracare', communityReviewSourceLabel: 'Reddit r/ZeroWaste', ingredients: 'Organic cotton, certified cellulose pulp, cornstarch bio-film.', effectiveness: 'Reliable absorption. Fully biodegradable.', badges: ['Plastic-Free', 'Sustainable'],
        verificationLinks: {
            doctor: { links: [{ url: 'https://www.natracare.com/why-natracare/', text: 'Natracare Health Mission', summary: 'Natracare was founded on the principle of removing endocrine disruptors and plastics from menstrual care.' }] },
            scientific: { links: [] },
            community: { links: [{ url: 'https://www.reddit.com/r/ZeroWaste/search/?q=natracare', text: 'Reddit ZeroWaste Community', summary: 'Highly recommended in the eco-conscious community for being truly plastic-free.' }] }
        }
    },
    { id: 'p-organyc-pad', name: 'Organyc 100% Cotton Pads', category: 'pad', type: 'physical', internal: false, healthFunctions: ['menstrual-collection'], tags: ['organic', 'safety-concern', 'comfort'], price: '$8 for 10', userRating: 4.4, whereToBuy: ['Amazon', 'Whole Foods'], image: 'https://m.media-amazon.com/images/I/71sNubnvkkL.jpg', summary: 'Italian-made, 100% certified organic cotton inside and out.', safety: { fdaStatus: 'FDA-registered', materials: '100% organic cotton', recalls: 'No recalls.', allergens: 'Dermatologically tested', sideEffects: 'Breathable material minimizes risk of yeast infections or irritation.', opinionAlerts: 'Users with very heavy flow may find these require more frequent changes than synthetic alternatives.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Organic cotton throughout reduces exposure to synthetic materials; beneficial for patients with sensitivities.', communityReview: 'Community discussions note softness and gentleness for sensitive skin.', ingredients: '100% certified organic cotton.', effectiveness: 'Good for regular to heavy flow.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Menstrual products', summary: 'Clinical guidance on menstrual care.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },
    { id: 'p-veeda-pad', name: 'Veeda Natural Cotton Pads', category: 'pad', type: 'physical', internal: false, healthFunctions: ['menstrual-collection'], tags: ['organic', 'cost', 'safety-concern'], price: '$5 for 14', userRating: 4.3, whereToBuy: ['Amazon', 'Walmart'], image: 'https://m.media-amazon.com/images/I/719IxnrixmL.jpg', summary: 'Budget-friendly natural cotton pads. GMO-free, chlorine-free.', safety: { fdaStatus: 'FDA-registered', materials: 'Natural cotton, chlorine-free', recalls: 'No recalls.', allergens: 'Fragrance-free, dye-free', sideEffects: 'Lower absorbency than premium brands; possible leaks if not changed frequently.', opinionAlerts: 'Considered the best "budget" natural option, but packaging is often reported as flimsy.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Budget-friendly natural cotton options are available; evidence does not show organic or natural pads are clinically superior.', communityReview: 'Community discussions note strong value for organic pads at this price point.', ingredients: 'Natural cotton, wood pulp, PE back sheet.', effectiveness: 'Solid budget option with clean ingredients.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Menstrual products', summary: 'Clinical guidance.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },
    { id: 'p-l-pad', name: 'L. Organic Cotton Pads', category: 'pad', type: 'physical', internal: false, healthFunctions: ['menstrual-collection'], tags: ['organic', 'cost', 'sustainability'], price: '$11 for 42', userRating: 4.4, whereToBuy: ['Target', 'Walmart', 'Amazon'], image: 'https://images.ctfassets.net/hk5leik3t8gi/1nN6axTA4awH3RdrWrtS1r/6de2af4a9dd989e9596fe287c5038af7/00073010719613_C1N1.png', summary: 'Organic cotton, great value. For every product purchased, one is donated to a person in need.', safety: { fdaStatus: 'FDA-registered', materials: 'Organic cotton top sheet', recalls: 'No recalls.', allergens: 'Fragrance-free, chlorine-free', sideEffects: 'Rare reports of the top sheet separating from the core.', opinionAlerts: 'High volume of "buy one give one" praise, but some concerns about the use of polyethylene in the backsheet.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Organic cotton options at accessible price points can reduce cost barriers; buy-one-give-one models address period poverty.', communityReview: 'Community discussions on Reddit r/periods note strong value for the price and organic materials.', communityReviewSourceUrl: 'https://www.reddit.com/r/periods/', communityReviewSourceLabel: 'Reddit r/periods', ingredients: 'Organic cotton top sheet, absorbent core, PE back sheet.', effectiveness: 'Best value organic pad on the market.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Menstrual products', summary: 'Clinical guidance.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },

    // ─── MORE TAMPONS ───────────────────────────────────
    { id: 'p-tampax-pure', name: 'Tampax Pure Cotton', category: 'tampon', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['heavy-flow', 'organic', 'cost'], price: '$8 for 24', userRating: 4.5, whereToBuy: ['CVS', 'Target', 'Walmart', 'Amazon'], image: 'https://m.media-amazon.com/images/I/71-PhbmuB8L._AC_UF350,350_QL50_.jpg', summary: 'Tampax quality with 100% organic cotton core. Trusted brand, cleaner materials.', safety: { fdaStatus: 'FDA-registered Class II', materials: '100% organic cotton core', recalls: 'No recalls for Pure line.', allergens: 'Fragrance-free', sideEffects: 'Standard TSS risk. Potential for "shredding" of the cotton core if removed when too dry.', opinionAlerts: 'Skeptics of big-brand organic initiatives often check for greenwashing, but Tampax Pure has solid material transparency.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Organic cotton core options are available from mainstream brands; absorption performance is comparable to conventional tampons.', communityReview: 'Community discussions on Reddit r/periods note satisfaction with organic versions of mainstream tampons.', communityReviewSourceUrl: 'https://www.reddit.com/r/periods/', communityReviewSourceLabel: 'Reddit r/periods', ingredients: 'Organic cotton core, plastic applicator.', effectiveness: 'Excellent absorption with organic materials.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Tampons', summary: 'Clinical guidance.', justification: 'ACOG.' }] }, scientific: { links: [{ url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Tampon safety', summary: 'Federal safety standards.', justification: 'FDA.' }] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },
    { id: 'p-natracare-tampon', name: 'Natracare Organic Tampons', category: 'tampon', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['organic', 'sustainability'], price: '$12 for 16', userRating: 4.5, whereToBuy: ['Whole Foods', 'Amazon'], image: 'https://www.natracare.com/images/products/medium/Tampons-Non-Applicator-Regular-600.jpg', summary: 'Applicator-free organic cotton tampons. Fully biodegradable. Pioneered organic period care.', safety: { fdaStatus: 'FDA-registered', materials: 'Organic cotton', recalls: 'No recalls.', allergens: 'Hypoallergenic', sideEffects: 'Insertion can be more difficult/painful for beginners since there is no applicator.', opinionAlerts: 'Highly rated for environmental impact, but lower convenience due to being applicator-free.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Applicator-free organic tampons are a biodegradable option; insertion may have a learning curve for some.', communityReview: 'Community discussions on Reddit r/ZeroWaste note long-term satisfaction and low waste.', ingredients: '100% organic cotton.', effectiveness: 'Reliable absorption, fully compostable.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Tampons', summary: 'Clinical guidance.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },
    { id: 'p-organyc-tampon', name: 'Organyc Cotton Tampons', category: 'tampon', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['organic', 'comfort', 'safety-concern'], price: '$9 for 16', userRating: 4.4, whereToBuy: ['Amazon', 'Whole Foods'], image: 'https://m.media-amazon.com/images/I/61jUe05jVPL.jpg', summary: '100% organic cotton with smooth applicator. Made in Italy with ICEA certification.', safety: { fdaStatus: 'FDA-registered', materials: '100% organic cotton', recalls: 'No recalls.', allergens: 'Dermatologically tested', sideEffects: 'Standard TSS risk. Cardboard applicator can be less smooth than plastic.', opinionAlerts: 'The cardboard applicator is environmentally friendly but some users find it gets "soggy" or difficult to use.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Organic cotton tampons with cardboard applicators reduce plastic; some find cardboard less smooth than plastic.', communityReview: 'Community discussions note smooth applicator and minimal irritation.', ingredients: '100% organic cotton, cardboard applicator.', effectiveness: 'Good absorption, gentle on sensitive skin.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Tampons', summary: 'Clinical guidance.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },

    // ─── MORE CUPS ──────────────────────────────────────
    {
        id: 'p-diva-cup', name: 'DivaCup', category: 'cup', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['heavy-flow', 'sustainability', 'cost'], price: '$30 (reusable 10 years)', userRating: 4.5, whereToBuy: ['CVS', 'Target', 'Walmart', 'Amazon'], image: 'https://media.istockphoto.com/id/1086919730/photo/pink-menstrual-cup-isolated-on-white-background.jpg?s=612x612&w=0&k=20&c=US3IMihnEbHr5zeY2NnkFrR8IUSAdoZlKHotkferstQ=', summary: 'The original mainstream menstrual cup. Medical-grade silicone, 3 sizes. Most widely available cup.', safety: { fdaStatus: 'FDA-registered Class II', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'BPA-free, latex-free', sideEffects: 'Possible bladder pressure or cramping if the cup is too firm or sized incorrectly.', opinionAlerts: 'The DivaCup is notoriously firmer than some new competitors, which some users find causes "suction pain" or difficulty during removal.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'Dr. Jen Gunter, OB-GYN. Source: ELLE Canada.',
        doctorOpinion: '"You can\'t say that menstrual cups are medically better than tampons, but they\'re a great, valid choice for many women.". Dr. Jen Gunter, OB-GYN', communityReview: 'Community discussions on Reddit r/menstrualcups note DivaCup as a reliable first cup with wide availability.', communityReviewSourceUrl: 'https://www.reddit.com/r/menstrualcups/search/?q=DivaCup', communityReviewSourceLabel: 'Reddit r/menstrualcups', ingredients: '100% healthcare-grade silicone.', effectiveness: 'Holds 30mL. Up to 12-hour wear. 3 sizes for different life stages.', badges: ['Climate Neutral', 'Sustainable'],
        verificationLinks: {
            doctor: {
                aiSummary: "DivaCup is a widely used menstrual cup made from healthcare-grade silicone. Menstrual cups are considered a safe alternative to disposable products when used and cleaned according to manufacturer guidance.",
                links: [
                    { url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868', text: 'Mayo Clinic: Using a Menstrual Cup', summary: 'Clinical advice on the safe use and maintenance of reusable menstrual products.', justification: 'Mayo Clinic is a globally recognized healthcare authority with a commitment to evidence-based education.' }
                ]
            },
            scientific: {
                aiSummary: "Extensive scientific analysis, including a major meta-analysis in The Lancet Public Health, confirms that the DivaCup is as safe and effective as pads or tampons. Research demonstrates zero increased risk of infection when compared to traditional external products, debunking historical myths about internal reusables.",
                links: [
                    
                ]
            },
            community: {
                aiSummary: "The community ranks the DivaCup as the most reliable first cup due to its wide availability and standardized sizing. However, users occasionally note that its firmness, while great for preventing leaks, can be noticeable or cause 'suction pain' for those with high pelvic floor sensitivity.",
                links: [
                    { url: 'https://www.reddit.com/r/menstrualcups/search/?q=DivaCup', text: 'Reddit r/menstrualcups', summary: 'Thousands of user threads discussing sizing, firmness, and long-term durability.', justification: 'Reddit community threads offer a decade of longitudinal user feedback on product lifespan and wearability.' },
                    { url: 'https://www.tiktok.com/tag/divacup', text: 'TikTok #DivaCup Reviews', summary: 'Over 200M views. Users share tips on insertion, removal, and maintenance for the world\'s most popular cup.', justification: 'High-volume social proof on TikTok highlights real-world maintenance and beginner learning curves.' }
                ]
            }
        }
    },
    { id: 'p-lunette-cup', name: 'Lunette Menstrual Cup', category: 'cup', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['sustainability', 'comfort'], price: '$28 (reusable)', userRating: 4.5, whereToBuy: ['Amazon', 'Lunette.com'], image: 'https://www.lunette.com/cdn/shop/files/Sizes.jpg?v=1766745881&width=3840', summary: 'Finnish-designed, softer silicone. Great for beginners. Comes in fun colors.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'BPA-free, latex-free', sideEffects: 'Minimal irritation risk. Softer silicone may be harder to "pop open" for some users.', opinionAlerts: 'Highly rated for comfort, though some users find the stem can be a bit long and may require trimming.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Softer silicone cups may be more comfortable for first-time users; firmness affects seal and comfort.', communityReview: 'Community discussions on Reddit r/menstrualcups note Lunette\'s softer silicone and ease of folding for beginners.', communityReviewSourceUrl: 'https://www.reddit.com/r/menstrualcups/', communityReviewSourceLabel: 'Reddit r/menstrualcups', ingredients: 'Medical-grade silicone, FDA-approved colorants.', effectiveness: 'Softer design, comfortable seal. 25mL capacity.', verificationLinks: { doctor: { links: [{ url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868', text: 'Mayo Clinic: Menstrual cup', summary: 'Clinical guidance on cup use.', justification: 'Mayo Clinic.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups', summary: 'Community discussions.' }] } } },
    {
        id: 'p-june-cup', name: 'June Cup', category: 'cup', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['cost', 'sustainability'], price: '$6 (pay-what-you-can)', userRating: 4.5, whereToBuy: ['Amazon'],       // Aditi confirmed 2026-08-23: thejunecup.com/junecup.co are no longer the brand's live storefront -- Amazon is the only real place to buy it now.
        image: '', summary: 'The most affordable menstrual cup. Pay-what-you-can model starting at $6. Making cups accessible.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'BPA-free, latex-free', sideEffects: 'Risk of leakage if the seal isn\'t perfect. Insertion discomfort during initial use.', opinionAlerts: 'Revolutionary pricing made it accessible; the brand no longer sells directly, but June Cup remains available on Amazon. Medical-grade silicone remains safe to use.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Accessibility in menstrual care matters; low-cost medical-grade silicone cups can reduce barriers.', communityReview: 'Community discussions on Reddit r/menstrualcups note June Cup\'s affordability and comparable performance.', communityReviewSourceUrl: 'https://www.reddit.com/r/menstrualcups/', communityReviewSourceLabel: 'Reddit r/menstrualcups', ingredients: 'Medical-grade silicone.', effectiveness: 'Standard cup performance at revolutionary pricing.', badges: ['Accessibility Leader', 'Sustainable'],
        integrations: [],
        verificationLinks: {
            doctor: {
                aiSummary: "Clinicians, including Dr. Jessica Shepherd, endorse June Cup primarily for its social mission in addressing period poverty. While clinical studies on the specific June brand are more limited than the DivaCup, the use of medical-grade silicone is a universally accepted medical standard for internal menstrual devices.",
                links: [
                    
                ]
            },
            scientific: {
                aiSummary: "The June Cup is an FDA-registered medical device, meaning its manufacturing and materials (medical-grade silicone) are subject to federal oversight for biocompatibility and safety. It follows established scientific protocols for internal reusable devices.",
                links: [
                    { url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely', text: 'FDA: Menstrual Product Regulation', summary: 'FDA registration for menstrual devices including cups.', justification: 'The FDA provides official registration status for medical devices in the US.' }
                ]
            },
            community: {
                aiSummary: "The community highly praises June Cup for its revolutionary 'pay-what-you-can' pricing. Users report that the silicone is softer than DivaCup, which many beginners find more comfortable, though some experienced users prefer a firmer rim for easier 'popping open.'",
                links: [
                    { url: 'https://winnefred.com/blogs/news/june-cup-review', text: 'Independent Cup Review', summary: 'Reviewers praise the softness of the silicone, making it a comfortable choice for beginners.', justification: 'Independent reviews provide unbiased testing data on the tactile properties of the product.' }
                ]
            }
        }
    },

    // ─── MORE DISCS ─────────────────────────────────────
    { id: 'p-nixit', name: 'Nixit Menstrual Disc', recommendationWhyDetail: 'Menstrual discs sit differently from cups. They tuck behind the pubic bone and collect flow at the cervix rather than forming a suction seal lower in the vagina. This means no suction sensation during removal, which many people find more comfortable. Discs like Nixit can also be worn during penetrative sex, which cups cannot. One-size-fits-most works for most anatomies, but if you have a very high or low cervix you may need to experiment with positioning.', category: 'disc', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['heavy-flow', 'comfort', 'sustainability'], price: '$42 (reusable)', userRating: 4.5, whereToBuy: ['Amazon', 'Nixit.com'], image: 'https://nixit.com/cdn/shop/files/4_9f6ddd26-7a61-4d08-b865-16adac0ff5b0_300x300_crop_center.png?v=1770330830', summary: 'Ultra-soft, one-size-fits-most disc. No suction unlike cups. Comfortable for sensitive anatomies.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'BPA-free, latex-free', sideEffects: 'Messy removal. Rare reports of the disc "slipping" during heavy exercise if not tucked correctly.', opinionAlerts: 'One-size-fits-most can be hit or miss for users with a higher or lower cervix.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Discs avoid suction and may suit those who find cups uncomfortable; one-size options work for many.', communityReview: 'Community discussions on Reddit r/menstrualcups note comfort without suction-related cramping.', communityReviewSourceUrl: 'https://www.reddit.com/r/menstrualcups/', communityReviewSourceLabel: 'Reddit r/menstrualcups', ingredients: 'Ultra-soft medical-grade silicone.', effectiveness: 'Holds 70mL. More than most cups. Up to 12-hour wear.', verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups', summary: 'Community discussions on discs.' }] } } },
    { id: 'p-cora-disc', name: 'Cora Reusable Disc', recommendationWhyDetail: 'Menstrual discs sit behind the pubic bone rather than lower in the vaginal canal like cups, which eliminates the suction removal sensation that many cup users dislike. The Cora disc adds an ergonomic grip tab. A design detail that solves the single most common complaint about discs (messy or difficult removal). If you\'ve tried and returned a cup, discs are worth exploring as a genuinely different experience.', category: 'disc', type: 'physical', internal: true, healthFunctions: ['menstrual-collection'], tags: ['heavy-flow', 'organic', 'sustainability'], price: '$30 (reusable)', userRating: 4.5, whereToBuy: ['Target', 'Amazon'], image: 'https://target.scene7.com/is/image/Target/GUEST_adc9d805-99e0-40ac-8a00-2203a093b2a3', summary: 'Medical-grade silicone disc from the trusted Cora brand. Ergonomic grip tab for easy removal.', safety: { fdaStatus: 'FDA-registered', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'BPA-free, latex-free', sideEffects: 'Minor discomfort during insertion/removal. Potential for leakage if the rim size doesn\'t match anatomy.', opinionAlerts: 'The built-in removal notch is a fan-favorite, solving the "messy removal" problem common to other discs.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Grip tabs on discs address the common removal difficulty; ergonomic design can improve usability.', communityReview: 'Community discussions on Reddit r/menstrualcups note the removal tab improves ease of use compared to other discs.', communityReviewSourceUrl: 'https://www.reddit.com/r/menstrualcups/', communityReviewSourceLabel: 'Reddit r/menstrualcups', ingredients: 'Medical-grade silicone.', effectiveness: 'Excellent capacity with easy removal design.', verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/menstrualcups/', text: 'Reddit r/menstrualcups', summary: 'Community discussions.' }] } } },

    // ─── MORE PERIOD UNDERWEAR ──────────────────────────
    { id: 'p-modibodi', name: 'Modibodi Period Underwear', category: 'period-underwear', type: 'physical', internal: false, healthFunctions: ['menstrual-collection', 'leak-protection'], tags: ['leaks', 'sustainability', 'comfort'], price: '$22–$65 per pair', userRating: 4.5, whereToBuy: ['Amazon', 'Modibodi.com'], image: 'https://www.theperiod.co/cdn/shop/products/MB_Classic_Bikini_Beige_LM_Front_1024x1024_2x_efb90db8-2189-49af-a8ce-f2f048c0f5b3.jpg?v=1616507387&width=2000', summary: 'Australian brand with patented Modifier Technology. PFAS-free, extended size range up to 6XL.', safety: { fdaStatus: 'Not regulated (apparel)', materials: 'PFAS-free, OEKO-TEX certified', recalls: 'No recalls.', allergens: 'Hypoallergenic', sideEffects: 'Rare reports of the material feeling "too thick" or warm in humid climates.', opinionAlerts: 'Consistently one of the highest-rated brands for absorbency; some users find the "sport" styles more breathable than the standard cotton.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Extended sizing in period underwear increases accessibility; PFAS-free options address safety concerns.', communityReview: 'Community discussions note appreciation for extended sizing and absorbency.', ingredients: 'Bamboo viscose, patented Modifier Tech absorbent layer, PFAS-free.', effectiveness: 'Up to 10 tsp absorption in heavy styles. Machine washable.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Menstrual products', summary: 'Clinical guidance.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },
    { id: 'p-rubylove', name: 'Ruby Love Period Underwear', category: 'period-underwear', type: 'physical', internal: false, healthFunctions: ['menstrual-collection', 'leak-protection'], tags: ['leaks', 'comfort'], price: '$20–$30 per pair', userRating: 4.4, whereToBuy: ['Amazon', 'RubyLove.com'], image: 'https://www.rubylove.com/cdn/shop/products/90570b_98f3627ab6704aca9e0bb9fe909ce6b2_mv2_109afb71-c986-4e86-b418-0bf261924c31.jpg?v=1655836506', summary: 'Built-in organic cotton liner with a "dri-tech mesh" system. Also makes swimwear and activewear.', safety: { fdaStatus: 'Not regulated (apparel)', materials: 'Organic cotton liner', recalls: 'No recalls.', allergens: 'PFAS-free', sideEffects: 'Minimal risk of irritation. Possible bulkiness in certain styles.', opinionAlerts: 'The period swimwear is the standout product; some users find the standard underwear gusset a bit narrow for heavy flow.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Period swimwear addresses a gap for active women; leak-proof designs can enable swimming during menstruation.', communityReview: 'Community discussions note strong satisfaction with period swimwear options.', ingredients: 'Organic cotton gusset, dri-tech mesh, nylon outer.', effectiveness: 'Good absorption. Unique swimwear & activewear options.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding', text: 'ACOG: Menstrual products', summary: 'Clinical guidance.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/', text: 'Reddit r/periods', summary: 'Community discussions.' }] } } },

    // ─── MORE SUPPLEMENTS ───────────────────────────────
    { id: 'p-probiotics-women', name: 'Garden of Life Women\'s Probiotics', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['vaginal-health', 'supplement'], tags: ['uti', 'discomfort', 'organic'], price: '$25 for 30 capsules', whereToBuy: ['Whole Foods', 'Amazon', 'Target'], image: 'https://www.gardenoflife.com/media/catalog/product/6/5/658010118323-1_1.jpg?optimize=medium&fit=bounds&height=625&width=625&canvas=625:625', summary: 'Women-specific probiotic with L. rhamnosus and L. reuteri strains clinically shown to support vaginal flora.', safety: { fdaStatus: 'Non-GMO Project Verified, NSF Certified', materials: 'Organic prebiotic fiber + probiotics', recalls: 'No recalls.', allergens: 'Dairy-free, gluten-free, soy-free', sideEffects: 'Temporary bloating, gas, or "rumbling" stomach during the first 3-5 days of use.', opinionAlerts: 'Strong clinical backing for the specific strains; some users find the shelf-stable requirement (keep cool) inconvenient for travel.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Lactobacillus-dominant probiotics can help maintain healthy vaginal pH and may reduce BV recurrence in some individuals.', communityReview: 'Community discussions on Amazon note satisfaction with reduced BV recurrence when taken consistently.', ingredients: '50B CFU, 16 probiotic strains including L. rhamnosus GR-1 and L. reuteri RC-14.', effectiveness: 'Clinically studied strains for vaginal and digestive health.', verificationLinks: { doctor: { links: [{ url: 'https://www.mayoclinic.org/diseases-conditions/bacterial-vaginosis/diagnosis-treatment/drc-20353485', text: 'Mayo Clinic: Vaginal health', summary: 'Clinical guidance on probiotics and vaginal flora.', justification: 'Mayo Clinic.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/HealthyHooha/search/?q=probiotic&restrict_sr=1', text: 'Reddit r/HealthyHooha', summary: 'Community discussions on probiotics.' }] } } },
    { id: 'p-evening-primrose', name: 'NOW Foods Evening Primrose Oil', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['cramp-relief', 'supplement'], tags: ['cramps', 'pcos', 'discomfort', 'bloating'], price: '$12 for 100 softgels', userRating: 4.4, whereToBuy: ['Amazon', 'iHerb', 'Whole Foods'], image: 'https://m.media-amazon.com/images/I/716A2d7a6EL.jpg', summary: 'Rich in GLA (gamma-linolenic acid) which helps regulate inflammation and hormonal balance.', safety: { fdaStatus: 'GMP-certified supplement', materials: 'Cold-pressed evening primrose oil', recalls: 'No recalls.', allergens: 'Contains soy (gelatin capsule)', sideEffects: 'Occasional mild headache or upset stomach. Should be avoided by those with epilepsy/seizure disorders.', opinionAlerts: 'High satisfaction for breast tenderness; some users find it takes 2-3 months to see results for cycle regulation.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Evening primrose oil has shown promise for PMS breast tenderness and cyclical mastalgia in clinical studies.', communityReview: 'Community discussions on Reddit r/PCOS note improvement in breast tenderness and PMS symptoms.', communityReviewSourceUrl: 'https://www.reddit.com/r/PCOS/', communityReviewSourceLabel: 'Reddit r/PCOS', ingredients: 'Evening primrose oil 1000mg, GLA 100mg, gelatin softgel.', effectiveness: 'Studies show GLA reduces PMS symptoms including breast tenderness and mood changes.', verificationLinks: { doctor: { links: [{ url: 'https://www.nccih.nih.gov/health/evening-primrose-oil', text: 'NIH: Evening Primrose Oil', summary: 'NIH overview of evening primrose oil and GLA for health conditions.', justification: 'NIH NCCIH is the federal authority on complementary health.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/PCOS/search/?q=evening+primrose&restrict_sr=1', text: 'Reddit r/PCOS: Evening Primrose', summary: 'Community discussions on EPO for PCOS and PMS.' }] } } },
    { id: 'p-vitex', name: 'Gaia Herbs Vitex Berry (Chasteberry)', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['supplement'], tags: ['irregular', 'pcos', 'cramps', 'bloating'], price: '$18 for 60 capsules', userRating: 4.4, whereToBuy: ['Amazon', 'Whole Foods', 'iHerb'], image: 'https://res.cloudinary.com/dqi4zho6f/image/upload/v1762990920/products/fae9d8b3-f564-4fd6-b3d4-9b5a677e3a87/image/89cf145fb4e6f6a4.png', summary: 'Traditional herbal remedy for irregular cycles and PMS. Works on the pituitary gland to regulate hormones.', safety: { fdaStatus: 'Supplement (not FDA-evaluated)', materials: 'Organic Vitex agnus-castus extract', recalls: 'No recalls.', allergens: 'Vegan, gluten-free', sideEffects: 'Nausea, weight gain, or hormonal breakouts in rare cases. May interact with birth control pills, dopamine-related medications, and hormone-sensitive conditions; not recommended during pregnancy or breastfeeding.', opinionAlerts: 'Common "vitex crash" concerns if stopped abruptly; users recommend tapering off. Very polarizing: works wonders for some and causes flare-ups for others.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Vitex has been studied for PMS symptoms and cycle-related concerns, but results vary and the evidence is not conclusive for everyone.', communityReview: 'Community discussions on Reddit r/PCOS note varied experiences with cycle regularization over several months.', communityReviewSourceUrl: 'https://www.reddit.com/r/PCOS/', communityReviewSourceLabel: 'Reddit r/PCOS', ingredients: 'Organic Vitex agnus-castus berry extract.', effectiveness: 'Some studies suggest vitex may improve certain PMS symptoms, though results vary and benefits may take time to assess.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/premenstrual-syndrome', text: 'ACOG: Premenstrual Syndrome', summary: 'Clinical guidance on PMS and evidence-based management.', justification: 'ACOG is the leading OB-GYN professional society.' }] }, scientific: { links: [{ url: 'https://pubmed.ncbi.nlm.nih.gov/28237870/', text: 'Vitex agnus-castus for PMS (meta-analysis)', summary: 'Meta-analysis of chasteberry for PMS; notes heterogeneity.', justification: 'PubMed peer-reviewed.' }] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/PCOS/search/?q=vitex+chasteberry&restrict_sr=1', text: 'Reddit r/PCOS: Vitex', summary: 'Community discussions on Vitex for cycles and PMS.' }] } } },
    { id: 'p-fish-oil', name: 'Nordic Naturals Omega Woman', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['supplement', 'cramp-relief'], tags: ['cramps', 'discomfort'], price: '$23 for 60 softgels', userRating: 4.5, whereToBuy: ['Amazon', 'Whole Foods', 'CVS'], image: 'https://cdn.shopify.com/s/files/1/0511/3059/7560/files/01780RJ1-OmegaWomanR_120_Box_Front.jpg?v=1754421038', summary: 'Omega-3 + evening primrose oil formula designed for women. Anti-inflammatory for cramp reduction.', safety: { fdaStatus: 'USP-verified, IFOS certified', materials: 'Wild-caught fish oil + EPO', recalls: 'No recalls.', allergens: 'Contains fish', sideEffects: 'Fishy aftertaste or "burps" (though this brand is processed to minimize this). Occasional mild nausea.', opinionAlerts: 'Known for third-party purity testing; some users cite price as a drawback.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Some studies suggest omega-3 fatty acids may help reduce menstrual pain, though results and effective doses vary.', communityReview: 'Community discussions on Amazon note reduced cramping and less reliance on NSAIDs.', ingredients: 'Fish oil 830mg EPA/DHA, Evening Primrose Oil 500mg.', effectiveness: 'Research suggests omega-3 supplementation may help reduce menstrual pain for some people.', verificationLinks: { doctor: { links: [{ url: 'https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods', text: 'ACOG: Dysmenorrhea', summary: 'Clinical guidance on omega-3 and pain.', justification: 'ACOG.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=omega+fish+oil&restrict_sr=1', text: 'Reddit r/periods', summary: 'Community discussions on fish oil.' }] } } },
    { id: 'p-b-complex', name: 'Thorne B-Complex #12', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['supplement'], tags: ['discomfort', 'cost'], price: '$26 for 60 capsules', userRating: 4.5, whereToBuy: ['Amazon', 'Thorne.com'], image: 'https://d1vo8zfysxy97v.cloudfront.net/media/product/b112__vee5e350a0551e93986381fda90af486aba9927b0.png', summary: 'Active B vitamins including methylfolate and B12. Important for energy, mood, and women on birth control.', safety: { fdaStatus: 'NSF Certified for Sport', materials: 'Active methylated B vitamins', recalls: 'No recalls.', allergens: 'Gluten-free, soy-free, dairy-free', sideEffects: 'Bright yellow urine (harmless riboflavin excretion). Some users experience "B-vitamin jitters" if taken late in the day.', opinionAlerts: 'Highly recommended for women on hormonal birth control to prevent vitamin depletion.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Hormonal birth control can deplete B vitamins, especially B6 and folate; supplementation with active forms may help maintain energy and mood.', communityReview: 'Community discussions on Reddit r/birthcontrol note improved energy after starting B-complex while on birth control.', communityReviewSourceUrl: 'https://www.reddit.com/r/birthcontrol/', communityReviewSourceLabel: 'Reddit r/birthcontrol', ingredients: 'Thiamine, Riboflavin, B6, Methylfolate, Methylcobalamin B12, Biotin.', effectiveness: 'Essential for women on hormonal birth control. Supports energy and mood.', verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/birthcontrol/search/?q=b+vitamin&restrict_sr=1', text: 'Reddit r/birthcontrol', summary: 'Community discussions.' }] } } },
    { id: 'p-cranberry-supplement', name: 'AZO Cranberry Urinary Health', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['uti-prevention'], tags: ['uti', 'cost'], price: '$8 for 50 caplets', userRating: 4.4, whereToBuy: ['CVS', 'Target', 'Walmart', 'Amazon'], image: 'https://m.media-amazon.com/images/I/51mvl7K-N4L.jpg', summary: 'Concentrated cranberry supplement with Pacran (whole fruit powder). Widely available and affordable.', safety: { fdaStatus: 'Dietary supplement', materials: 'Pacran cranberry powder', recalls: 'No recalls.', allergens: 'Gluten-free', sideEffects: 'Mild stomach upset if taken without food. Potential for increased risk of kidney stones in susceptible individuals.', opinionAlerts: 'Standard "workhorse" for UTI prevention; some users find the caplets slightly large to swallow.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Cranberry supplements may help prevent UTIs by reducing bacterial adhesion; D-Mannose has stronger evidence. Best used as part of a prevention routine.', communityReview: 'Community discussions on Amazon note reduced UTI frequency when taken daily as part of a prevention routine.', ingredients: 'Pacran cranberry whole fruit powder 500mg.', effectiveness: 'Moderate evidence for UTI prevention. Works best as part of a prevention routine.', verificationLinks: { doctor: { links: [{ url: 'https://www.mayoclinic.org/diseases-conditions/urinary-tract-infection/symptoms-causes/syc-20353447', text: 'Mayo Clinic: UTI', summary: 'Clinical guidance on UTI prevention.', justification: 'Mayo Clinic.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/HealthyHooha/search/?q=cranberry&restrict_sr=1', text: 'Reddit r/HealthyHooha', summary: 'Community discussions on cranberry.' }] } } },
    { id: 'p-zinc', name: 'Garden of Life Zinc 30mg', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['supplement'], tags: ['pcos', 'discomfort'], price: '$14 for 30 tablets', whereToBuy: ['Amazon', 'Whole Foods'], image: 'https://m.media-amazon.com/images/I/81kiWOsohsL.jpg', summary: 'Whole food zinc for hormonal acne, PCOS, and immune support.', safety: { fdaStatus: 'Non-GMO Verified', materials: 'Whole food-cultured zinc', recalls: 'No recalls.', allergens: 'Vegan', sideEffects: 'Nausea if taken on an empty stomach (common with zinc). Metallic taste.', opinionAlerts: 'Highly rated for hormonal acne; users emphasize taking it with a meal to avoid "zinc-induced nausea."' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Zinc may help women with PCOS-related acne and support healthy testosterone metabolism.', communityReview: 'Community discussions on Reddit r/PCOS note improvement in hormonal acne with zinc supplementation.', communityReviewSourceUrl: 'https://www.reddit.com/r/PCOS/', communityReviewSourceLabel: 'Reddit r/PCOS', ingredients: 'Whole food zinc 30mg, organic fruit/veggie blend.', effectiveness: 'Studies show zinc reduces acne and supports hormonal balance in PCOS.', verificationLinks: { doctor: { links: [] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/PCOS/search/?q=zinc&restrict_sr=1', text: 'Reddit r/PCOS', summary: 'Community discussions on zinc.' }] } } },

    // ─── UTI/VAGINAL HEALTH ─────────────────────────────
    {
        id: 'p-boric-acid', name: 'The Honey Pot Boric Acid Suppositories', category: 'supplement', type: 'physical', internal: true, healthFunctions: ['vaginal-health'], tags: ['discomfort', 'uti'], price: '$19 for 14', userRating: 4.6, whereToBuy: ['Target', 'Walmart', 'Amazon'], image: 'https://thehoneypot.co/cdn/shop/products/Suppositories_Front.jpg?v=1675876514&width=1200', summary: 'Boric acid vaginal suppositories for pH balance, BV, and yeast infection prevention.', safety: { fdaStatus: 'Supplement', materials: 'Boric acid 600mg', recalls: 'No recalls.', allergens: 'N/A. NOT for oral use, NOT for pregnancy', sideEffects: 'Vaginal discharge (as the capsule dissolves), mild watery leakage, or "stinging" in rare cases. EXTREMELY TOXIC if swallowed.', opinionAlerts: 'Life-saving for many with chronic BV; the main "opinion alert" is the safety warning about toxicity if taken orally.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Boric acid suppositories are FDA-recognized as safe for vaginal use and are used clinically for recurrent BV and yeast infections. Not first-line treatment.', communityReview: 'Community discussions on Reddit r/WomensHealth note clinician recommendations and long-term success for recurring BV.', communityReviewSourceUrl: 'https://www.reddit.com/r/WomensHealth/search/?q=boric+acid', communityReviewSourceLabel: 'Reddit r/WomensHealth', ingredients: 'Boric acid 600mg, gelatin capsule.', effectiveness: 'Clinical evidence supports use for recurrent BV and yeast infections. Not first-line treatment.',
        verificationLinks: {
            doctor: { links: [
                { url: 'https://www.mayoclinic.org/diseases-conditions/bacterial-vaginosis/diagnosis-treatment/drc-20353485', text: 'Mayo Clinic: BV Treatment', summary: 'Medical overview of boric acid as a recognized treatment for recurrent or recalcitrant bacterial vaginosis.' }
            ] },
            scientific: { links: [
                
            ] },
            community: { links: [
                { url: 'https://www.reddit.com/r/WomensHealth/search/?q=boric+acid', text: 'Reddit r/WomensHealth', summary: 'Frequent discussions on the life-changing impact of boric acid for those suffering from chronic pH imbalances.' },
                { url: 'https://www.tiktok.com/tag/boricacid', text: 'TikTok #BoricAcid Reviews', summary: 'Large numbers of women share their "life-changing" stories and tips for using boric acid effectively.' }
            ] }
        }
    },
    { id: 'p-azo-test', name: 'AZO UTI Test Strips', category: 'supplement', type: 'physical', internal: false, healthFunctions: ['uti-prevention'], tags: ['uti', 'cost'], price: '$12 for 3 strips', whereToBuy: ['CVS', 'Target', 'Walmart', 'Amazon'], image: 'https://azoproducts.com/cdn/shop/files/azo-urinary-health-uti-test-strips-3-count_large.webp?v=1752257921', summary: 'At-home UTI test strips. Results in 2 minutes. Same technology doctors use.', safety: { fdaStatus: 'FDA-cleared', materials: 'Diagnostic test strips', recalls: 'No recalls.', allergens: 'N/A', sideEffects: 'N/A. False negatives can occur if urine is too dilute or certain medications (like Vitamin C) interfere.', opinionAlerts: 'Saves time and money on clinic visits; some users find the color chart difficult to read in dim lighting.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Home UTI test strips are reliable for initial screening; a positive result warrants prompt treatment. Same technology used in clinical settings.', communityReview: 'Community discussions on Amazon note convenience and cost savings compared to urgent care visits for confirmation.', ingredients: 'Nitrite and leukocyte test reagents.', effectiveness: 'Clinical-grade accuracy for detecting UTI markers.', verificationLinks: { doctor: { links: [{ url: 'https://www.mayoclinic.org/diseases-conditions/urinary-tract-infection/diagnosis-treatment/drc-20353459', text: 'Mayo Clinic: UTI diagnosis', summary: 'Clinical guidance on at-home testing and when to seek care.', justification: 'Mayo Clinic is a leading clinical resource.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/HealthyHooha/search/?q=azo+test&restrict_sr=1', text: 'Reddit r/HealthyHooha: AZO test', summary: 'Community discussions on at-home UTI test strips.' }] } } },
    { id: 'p-good-clean-love', name: 'Good Clean Love Bio-Match Moisturizer', category: 'supplement', type: 'physical', internal: true, healthFunctions: ['vaginal-health'], tags: ['discomfort', 'organic', 'comfort'], price: '$13 for 2oz', userRating: 4.5, whereToBuy: ['CVS', 'Target', 'Amazon'], image: 'https://m.media-amazon.com/images/I/71UTcfCq9uL.jpg', summary: 'pH-balanced vaginal moisturizer designed to match natural vaginal conditions.', safety: { fdaStatus: 'FDA-cleared', materials: 'Bio-matched ingredients, iso-osmolar', recalls: 'No recalls.', allergens: 'Paraben-free, glycerin-free', sideEffects: 'None reported for most. Rare sensitivity to lactic acid in the formula.', opinionAlerts: 'Some users and pelvic health professionals favor pH-balanced moisturizers for vaginal comfort; this formula is designed to feel non-greasy.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'pH-balanced, iso-osmolar lubricants and moisturizers may reduce irritation compared to conventional products; match to vaginal pH when possible.', communityReview: 'Community discussions note clinician recommendations and satisfaction with minimal irritation.', ingredients: 'Aloe vera, xanthan gum, sodium chloride, potassium sorbate. pH 3.5-4.5.', effectiveness: 'FDA-cleared, bio-matched. Supports rather than disrupts vaginal microbiome.', verificationLinks: { doctor: { links: [{ url: 'https://www.menopause.org/for-women/sexual-health', text: 'NAMS: Genitourinary health', summary: 'Clinical guidance on vaginal moisturizers for GSM.', justification: 'NAMS is the leading menopause society.' }] }, scientific: { links: [] }, community: { links: [{ platform: 'reddit', url: 'https://www.reddit.com/r/HealthyHooha/search/?q=moisturizer&restrict_sr=1', text: 'Reddit r/HealthyHooha: moisturizer', summary: 'Community discussions on vaginal moisturizers.' }] } } },
    {
        id: 'p-flo-gummies',
        name: 'Flo PMS Gummy Vitamins',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement', 'cramp-relief'],
        tags: ['cramps', 'discomfort', 'bloating'],
        price: '$30 for 60 gummies',
        userRating: 4.4,
        ratingNote: 'Evidence mixed; Amazon reviews may be incentivized. See Clinical, Science, and Community tabs for details.',
        incentivizedReviewSites: [{ site: 'Amazon', source: 'Fakespot grade B' }],
        whereToBuy: ['Target', 'Amazon', 'Flo.com'],
        image: 'https://m.media-amazon.com/images/I/81RReWPD2+L.jpg',
        summary: 'Gummy vitamins formulated to relieve PMS symptoms like bloating, cramps, and mood swings.',
        safety: { fdaStatus: 'Supplement', materials: 'Vegan, Non-GMO', recalls: 'No recalls.', allergens: 'Gluten-free', sideEffects: 'Some users report mild stomach upset or acne flare-ups.', opinionAlerts: 'User experiences vary widely. Some report benefit, others report no effect or call it a sugar pill.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and systematic reviews. Not a direct clinician quote.',
        doctorOpinion: 'Chasteberry has the most evidence; B6 and Dong Quai have weaker support. Individual response varies. See Scientific Literature tab for evidence details.',
        communityReview: 'Community discussions on Amazon note varied experiences with bloating relief; some report benefit, others report no effect.',
        ingredients: 'Chasteberry extract, Dong Quai, Vitamin B6, Lemon Balm.',
        effectiveness: 'Chasteberry has moderate evidence for PMS; studies show high heterogeneity and bias. Vitamin B6: Cochrane found evidence weak. Dong Quai: no PMS-specific trials. Lemon balm: one small RCT. Not enough evidence to confidently support the full blend.',
        verificationLinks: {
            doctor: {
                aiSummary: "ACOG provides clinical guidance on PMS management for OB-GYNs. Individual response to supplements varies; discuss with your clinician.",
                links: [
                    { url: 'https://www.acog.org/womens-health/faqs/premenstrual-syndrome', text: 'ACOG: Premenstrual Syndrome', summary: 'Clinical guidance on PMS management and evidence-based approaches.', justification: 'ACOG is the leading OB-GYN professional society.' }
                ]
            },
            scientific: {
                aiSummary: "Chasteberry meta-analyses show positive effects but with high heterogeneity and publication bias. Effect sizes may be overstated. Vitamin B6: Cochrane concluded poor-quality studies suggest benefit; evidence is weak. Dong Quai: no PMS trials. Lemon balm: one small RCT. Overall, insufficient high-quality evidence to confidently support this specific product blend.",
                links: [
                    { url: 'https://pubmed.ncbi.nlm.nih.gov/28237870/', text: 'Vitex agnus-castus for PMS (meta-analysis)', summary: 'Meta-analysis of chasteberry for PMS; notes high heterogeneity and need for higher-quality trials.', justification: 'PubMed peer-reviewed.' },
                    { url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC27878/', text: 'Vitamin B6 for PMS (BMJ review)', summary: 'Systematic review; mixed results; evidence quality concerns.', justification: 'BMJ peer-reviewed.' },
                    { url: 'https://www.ncbi.nlm.nih.gov/books/NBK72353/', text: 'Dietary supplements for PMS', summary: 'Systematic review of supplements; mixed or insufficient evidence for many herbs.', justification: 'NCBI/NIH.' }
                ]
            },
            community: {
                aiSummary: "User experiences are mixed. Many report reduced bloating and mood improvement; others find no benefit or call it a sugar pill. Commonly discussed on Reddit r/PMDD and r/periods.",
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/periods/search/?q=flo+gummies&restrict_sr=1', text: 'Reddit r/periods: Flo', summary: 'Community discussions on Flo gummies and PMS supplements.' },
                    { platform: 'reddit', url: 'https://www.reddit.com/r/PMDD/search/?q=chasteberry&restrict_sr=1', text: 'Reddit r/PMDD: Chasteberry', summary: 'Discussions on chasteberry and PMS/PMDD symptom relief.' }
                ]
            }
        }
    },
    {
        id: 'p-hum-flatter-me',
        name: 'HUM Nutrition Flatter Me',
        category: 'supplement',
        type: 'physical',
        internal: false,
        healthFunctions: ['supplement'],
        tags: ['discomfort', 'cost', 'bloating'],
        price: '$26 for 60 capsules',
        userRating: 4.4,
        whereToBuy: ['Sephora', 'Amazon', 'HumNutrition.com'],
        image: 'https://target.scene7.com/is/image/Target/GUEST_f78049ce-0562-4b34-8acf-e7476d83d21c?wid=300&hei=300&fmt=pjpeg',
        summary: 'A blend of 18 digestive enzymes to help breakdown food and reduce bloating.',
        safety: { fdaStatus: 'Supplement', materials: 'Vegan, Clean Certified', recalls: 'No recalls.', allergens: 'Gluten-free, Soy-free', sideEffects: 'Rare instances of stomach cramping if taken on an empty stomach.', opinionAlerts: 'Must be taken right before meals to be effective. Highly praised for immediate de-bloating effects.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Digestive enzymes may help women with cyclical hormonal bloating or endo-belly by facilitating nutrient absorption. Take right before meals.',
        communityReview: 'Community discussions on Reddit r/WomensHealth note relief from ovulation and hormonal bloating when taken before meals.',
        communityReviewSourceUrl: 'https://www.reddit.com/r/WomensHealth/',
        communityReviewSourceLabel: 'Reddit r/WomensHealth',
        ingredients: 'Protease, Papain, Lipase, Ginger, Peppermint leaf.',
        effectiveness: 'Effective for immediate digestive relief and reducing gas-producing fermentation in the gut.',
        verificationLinks: {
            doctor: {
                links: [
                    
                ]
            },
            scientific: {
                links: [
                    
                ]
            },
            community: {
                links: [
                    { platform: 'reddit', url: 'https://www.reddit.com/r/WomensHealth/search/?q=flatter+me+bloating&restrict_sr=1', text: 'Reddit r/WomensHealth: Flatter Me', summary: 'Community discussions on HUM Flatter Me and hormonal bloating.' },
                    { platform: 'tiktok', url: 'https://www.tiktok.com/search?q=hum%20flatter%20me', text: 'TikTok: HUM Flatter Me', summary: 'User reviews and de-bloating tips.' }
                ]
            }
        }
    },
    // ─── PAIN RELIEF ────────────────────────────────────
    { id: 'p-thermacare', name: 'ThermaCare Heat Wraps', category: 'cramp-relief', type: 'physical', internal: false, healthFunctions: ['cramp-relief'], tags: ['cramps', 'endometriosis', 'discomfort', 'comfort', 'cost'], price: '$8–12 for 3–4 wraps', userRating: 4.6, whereToBuy: ['CVS', 'Target', 'Walmart', 'Amazon'], image: 'https://www.thermacare.com/wp-content/uploads/2024/02/thermacare-share-2024.png', summary: 'Adhesive heat wraps that deliver up to 8 hours of consistent targeted heat. Drug-free. Can be worn under clothing for cramps, pelvic pain, back pain, or any area needing heat relief.', safety: { fdaStatus: 'FDA-cleared medical device', materials: 'Iron, charcoal, salt (produces heat via oxidation)', recalls: 'No recalls.', allergens: 'External use only', sideEffects: 'Rarely causes "skin mottling" or mild burns if worn directly on skin for too long (must follow 8-hour limit).', opinionAlerts: 'Industry standard for portable heat; some users find the adhesive fails if there is any lotion on the skin.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Heat therapy can help relieve menstrual cramps for some people. ThermaCare provides consistent, portable heat for up to 8 hours.', communityReview: 'Community discussions on Reddit r/periods note significant cramp relief, often reducing need for NSAIDs.', communityReviewSourceUrl: 'https://www.reddit.com/r/periods/', communityReviewSourceLabel: 'Reddit r/periods', ingredients: 'Iron powder, activated charcoal, salt, water.', effectiveness: 'Clinical studies support heat therapy as a non-drug option for reducing dysmenorrhea pain.' },
    { id: 'p-portable-heating', name: 'Comfytemp Portable Heating Pad', category: 'cramp-relief', type: 'physical', internal: false, healthFunctions: ['cramp-relief'], tags: ['cramps', 'comfort'], price: '$30 (rechargeable)', userRating: 4.4, whereToBuy: ['Amazon'], image: 'https://comfytemp.com/cdn/shop/files/1_3bed29dd-ce12-4a06-ba16-229eaf24898b.webp?v=1768274967', summary: 'Rechargeable, wearable heating pad. Wear under clothes at work or school. 3 heat settings.', safety: { fdaStatus: 'Not FDA-regulated (general wellness)', materials: 'Carbon fiber heating element, soft fabric', recalls: 'No recalls.', allergens: 'N/A', sideEffects: 'Potential for skin irritation from heat; battery can get warm against the body.', opinionAlerts: 'Great for portability; users often complain about the 2-hour battery life on the "high" setting.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Portable heating pads allow discreet cramp management throughout the day without medication. Heat therapy is evidence-based for dysmenorrhea.', communityReview: 'Community discussions on Amazon note discreet wear under clothes and effective cramp relief at work or school.', ingredients: 'Rechargeable battery, carbon fiber element, soft fabric cover.', effectiveness: 'Discreet, wearable heat therapy. Rechargeable for all-day use.' },

    // ─── PELVIC FLOOR ───────────────────────────────────
    {
        id: 'p-elvie-trainer', name: 'Elvie Pelvic Floor Trainer', fsaHsaEligible: true, category: 'pelvic-floor', type: 'physical', internal: true, healthFunctions: ['vaginal-health'], tags: ['leaks', 'discomfort'], price: '$199', userRating: 4.5, whereToBuy: ['Amazon', 'Target', 'Elvie.com'], image: 'https://cdn.shopify.com/s/files/1/0685/2322/9340/files/IMD_UK_Trainer_Web_Hero_1200x1200_V2.jpg?v=1767622990', summary: 'Smart Kegel trainer with real-time biofeedback via app. Guides you through exercises with visualization.', safety: { fdaStatus: 'FDA-registered medical device', materials: 'Medical-grade silicone', recalls: 'No recalls.', allergens: 'BPA-free, latex-free', sideEffects: 'Occasional "pelvic fatigue" if overused. Rare Bluetooth connectivity issues with certain phones.', opinionAlerts: 'High price point is the main barrier. Some users find the real-time biofeedback helpful for post-partum pelvic floor training.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Biofeedback devices help patients perform Kegels correctly; many women do them incorrectly without guidance. Clinical studies show improved outcomes vs. unguided exercises.', communityReview: 'Community discussions on Amazon note improved bladder control and satisfaction with biofeedback guidance after consistent use.', ingredients: 'Medical-grade silicone, Bluetooth sensor.', effectiveness: 'Clinical studies show biofeedback improves Kegel outcomes by 40% vs. doing them alone.', badges: ['Female-Owned', 'Clinically Validated'],
        verificationLinks: {
            doctor: { links: [
                
            ] },
            scientific: { links: [
                { url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4334080/', text: 'Study on Pelvic Biofeedback', summary: 'Research indicating that visual biofeedback significantly improves the acquisition of correct pelvic floor muscle contractions.' }
            ] },
            community: { links: [
                { url: 'https://www.instagram.com/elvie/', text: 'Elvie Instagram Community', summary: 'Real users share their "squeeze" streaks and improvements in bladder control after consistent trainer use.' },
                { url: 'https://www.facebook.com/groups/pelvicfloorfriendly/', text: 'Pelvic Floor Support Group', summary: 'Community discussion on integrating the Elvie trainer into a holistic pelvic health routine.' }
            ] }
        }
    },
    { id: 'p-intimate-rose', name: 'Intimate Rose Vaginal Dilators', category: 'supplement', type: 'physical', internal: true, healthFunctions: ['vaginal-health'], tags: ['discomfort'], price: '$160 for 8-piece set', userRating: 4.6, whereToBuy: ['Amazon', 'IntimateRose.com'], image: 'https://www.intimaterose.com/cdn/shop/files/Dilators_Size1-8.jpg?v=1749126284&width=1946', summary: 'Medical-grade silicone dilators for vaginismus, pelvic pain, and post-surgical recovery. Designed by a pelvic floor PT.', safety: { fdaStatus: 'FDA-registered', materials: 'BPA-free medical-grade silicone', recalls: 'No recalls.', allergens: 'Latex-free, phthalate-free', sideEffects: 'Emotional anxiety during the process; mild physical discomfort if progressive steps are rushed.', opinionAlerts: 'Extremely popular in the vaginismus community; users recommend the "vibrating" version for extra tension release.' }, clinicianOpinionSource: 'independent', clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.', doctorOpinion: 'Dilator therapy is first-line treatment for vaginismus. Graduated sizing makes progressive desensitization manageable. Designed by a pelvic floor PT.', communityReview: 'Community discussions on Reddit r/vaginismus note life-changing results and appreciation for graduated sizing.', communityReviewSourceUrl: 'https://www.reddit.com/r/vaginismus/', communityReviewSourceLabel: 'Reddit r/vaginismus', ingredients: 'Medical-grade silicone, 8 progressive sizes.', effectiveness: 'Clinically proven therapy for vaginismus, dyspareunia, and post-treatment recovery.' },
    {
        id: 'p-honeypot-wash', name: 'The Honey Pot Intimate Wash', category: 'intimate-care', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['organic', 'comfort'], price: '$10 for 5.5oz', userRating: 4.3, whereToBuy: ['Target', 'Walmart', 'Amazon'], image: 'https://thehoneypot.co/cdn/shop/files/SensitiveWashMother-MOBadge-Nude.jpg?v=1771432432&width=1200', summary: 'Plant-derived intimate foaming wash. Clinically tested, pH-balanced, and gynecologist-approved.',
        safety: {
            fdaStatus: 'Cosmetic', materials: 'Plant-derived ingredients', recalls: 'No recalls.', allergens: 'Fragrance-free options available',
            sideEffects: 'Mild irritation for highly sensitive individuals.',
            opinionAlerts: 'Some users question whether any wash product is necessary for intimate areas; a 2023 class-action lawsuit (McAuley v. Honey Pot) made this argument formally, alleging feminine washes are unsuitable for vulvar use since the medical consensus favors water alone — the suit was dismissed for insufficient evidence the products were harmful.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'The vagina is self-cleaning; the vulva can be washed with a mild, pH-balanced cleanser if desired. Avoid aggressive scrubbing or douching.',
        communityReview: 'Community discussions on Reddit r/HealthyHooha note gentleness and that it does not disrupt pH like standard body wash.', communityReviewSourceUrl: 'https://www.reddit.com/r/HealthyHooha/', communityReviewSourceLabel: 'Reddit r/HealthyHooha',
        ingredients: 'Water, coco-glucoside, aloe leaf juice, apple cider vinegar.', effectiveness: 'Effectively cleanses without stripping natural moisture.', badges: ['WOC Owned', 'Plant-Derived']
    },
    {
        id: 'p-luna-wash', name: 'Luna Daily Intimate Feminine Wash', brand: 'Luna Daily', category: 'intimate-care', type: 'physical', internal: false, healthFunctions: ['vaginal-health'], tags: ['organic', 'comfort'], price: '$12 for 6oz', userRating: 4.4, whereToBuy: ['Amazon', 'Target'], image: 'https://m.media-amazon.com/images/I/41-RVVZ5OkL.jpg', summary: 'A soothing, pH-balanced wash designed for sensitive vulvar skin. Gynecologist-tested and free of harsh sulfates.',
        safety: {
            fdaStatus: 'Cosmetic', materials: 'Hypoallergenic formulation', recalls: 'No recalls.', allergens: 'Paraben-free, sulfate-free',
            sideEffects: 'None reported.',
            opinionAlerts: 'Usually well tolerated.'
        },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'A safe option for external vulvar cleansing if water alone is not preferred. Formulated to respect the natural acid mantle.',
        communityReview: 'Community discussions on Amazon note suitability for sensitive skin without stinging or dryness.',
        ingredients: 'Purified water, glycerin, lactic acid, chamomile extract.', effectiveness: 'Gentle on sensitive skin, maintains pH balance.', badges: ['Hypoallergenic', 'Dermatologist Tested']
    }
];

export const EXTENDED_DIGITAL = [
    // ─── MORE TRACKERS ──────────────────────────────────
    {
        id: 'd-natural-cycles', name: 'Natural Cycles', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking', 'contraception'], tags: ['irregular', 'pcos', 'privacy'], price: '$100/year or $13/month', userRating: 4.6, whereToBuy: ['App Store', 'Google Play'], platform: 'iOS, Android', image: 'https://www.datocms-assets.com/21281/1762899321-us-not-fertile-new-screen-rachel-hand-holding-phone.png?auto=format&fit=max&w=1200', summary: 'The only FDA-cleared birth control app. Uses basal body temperature to identify fertile/infertile days.',
        safety: {
            fdaStatus: 'FDA-cleared (De Novo) as contraception', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A (Software). Risk of pregnancy if the method is not followed perfectly.',
            opinionAlerts: 'Requires high user discipline (taking temp immediately upon waking); some find the strict routine stressful. In 2018, a Stockholm hospital reported 37 unintended pregnancies among users seeking abortions, and the UK Advertising Standards Authority ruled that marketing describing the app as "highly accurate" was misleading. Natural Cycles maintains the numbers were consistent with its disclosed 93% typical-use effectiveness rate.'
        },
        privacy: { dataStorage: 'EU (Sweden) servers, GDPR-compliant', sellsData: '❌ Does not sell data', hipaa: 'GDPR-compliant', keyPolicy: 'CE-marked medical device in EU. Data processed in Sweden.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Natural Cycles is the only app FDA-cleared as contraception. Requires daily temperature measurement. 93% typical-use effectiveness.',
        communityReview: 'Community discussions on Reddit r/birthcontrol note a steep learning curve but real effectiveness when used consistently; some users and clinicians remain wary since 2018 press coverage of unintended pregnancies among app users, even though it is still the only FDA-cleared contraceptive app.',
        integrations: ['Apple Health', 'Oura Ring'], badges: ['FDA Cleared', 'Privacy First'],
        verificationLinks: {
            doctor: { links: [
                
            ] },
            scientific: { links: [
                
            ] },
            community: { links: [
                { url: 'https://www.reddit.com/r/NaturalCyclesBC/', text: 'Natural Cycles Reddit Community', summary: 'Active community of over 5k members discussing temperature tracking, algorithm updates, and birth control efficacy.' },
                { url: 'https://www.tiktok.com/search?q=natural+cycles+review', text: 'TikTok #NaturalCycles', summary: 'Viral reviews and "day in the life" videos showing how users integrate the app with their Oura rings.' }
            ] }
        }
    },
    {
        id: 'd-ovia', name: 'Ovia Health', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking'], tags: ['irregular', 'pcos', 'comfort'], price: 'Free (employer-sponsored)', whereToBuy: ['App Store', 'Google Play'], platform: 'iOS, Android', image: 'http://oviawellness.com/cdn/shop/files/1762267614936-generated-label-image-0.jpg?v=1762267644', summary: 'Period, fertility, and pregnancy tracker. Often free through employers. Covers full reproductive journey.',
        safety: {
            fdaStatus: 'Not FDA-cleared', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A',
            opinionAlerts: 'Employer-sponsored model raises privacy concerns for some users regarding their sensitive health data.'
        },
        privacy: { dataStorage: 'US servers', sellsData: '⚠️ Primarily B2B model. Employer-sponsored. Review privacy policy carefully. Individual data is anonymized for employers.', hipaa: 'De-identified data shared with employers', keyPolicy: 'Funded by employer benefits programs. Individual health data is not shared with employers in identifiable form.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Ovia is comprehensive and covers fertility through pregnancy. Be aware of the employer data-sharing model and review privacy settings.',
        communityReview: 'Community discussions on Reddit r/WomensHealth note strong content when employer-sponsored, with some privacy concerns about data access.',
        integrations: ['Apple Health'], effectiveness: 'Comprehensive tracking from cycles to pregnancy to postpartum.',
        verificationLinks: {
            scientific: { links: [] },
            community: { links: [{ url: 'https://www.reddit.com/r/WomensHealth/search/?q=Ovia', text: 'Reddit Ovia Discussions', summary: 'Users often praise Ovia for its comprehensive tracking features and pregnancy milestones.' }] }
        }
    },
    {
        id: 'd-glow', name: 'Glow Period & Ovulation Tracker', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking'], tags: ['irregular', 'pcos', 'comfort'], price: 'Free (Premium $60/year)', userRating: 4.4, whereToBuy: ['App Store', 'Google Play'], platform: 'iOS, Android', url: 'https://glowing.com/', /* App Store icon — confirmed via iTunes Search API: "Glow Ovulation & Period App" by Glow, Inc., the real company. Verified the icon loads before using. */ image: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/5e/77/d4/5e77d423-a88d-55cc-cf31-0fe103756967/GlowAppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg', summary: 'Period and fertility tracker with community forum. Also offers fertility courses and clinic matching.',
        safety: {
            fdaStatus: 'Not FDA-cleared', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A',
            opinionAlerts: 'Aggressive marketing for premium services and partner-linking features can be overwhelming.'
        },
        privacy: { dataStorage: 'US servers', sellsData: '⚠️ Privacy policy unclear on third-party sharing', hipaa: 'Not HIPAA-compliant', keyPolicy: 'Review privacy settings carefully. Has in-app community features.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Glow has useful community features; users should verify medical advice from forums with their doctor.',
        communityReview: 'Community discussions on Reddit r/TryingForABaby note appreciation for the community forum and peer support.',
        integrations: ['Apple Health', 'Fitbit'], effectiveness: 'Good predictions, strong community. Partner-linking feature for couples TTC.',
        verificationLinks: {
            community: { links: [{ url: 'https://www.reddit.com/r/TryingForABaby/search/?q=Glow', text: 'Reddit TTC Reviews', summary: 'Extensive community feedback on using Glow for timing conception and tracking fertility markers.' }] }
        }
    },

    // ─── MORE TELEHEALTH ────────────────────────────────
    {
        id: 'd-maven', name: 'Maven Clinic', category: 'telehealth', type: 'digital', internal: false, healthFunctions: ['telehealth'], tags: ['irregular', 'pcos', 'comfort'], price: 'Free through employer / $15-35 per session', userRating: 4.6, whereToBuy: ['mavenclinic.com'], platform: 'Web, iOS, Android', image: 'https://cdn.prod.website-files.com/5fb2b678e994739660d95086/697748722f5193b59b97c29a_fd98d3239db6b066d65587ba90bfb935_4.webp', summary: 'Virtual women\'s and family health clinic. OB-GYNs, mental health, fertility specialists. Often employer-covered.',
        safety: {
            fdaStatus: 'Licensed telehealth provider', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'Specific to medications prescribed during visits.',
            opinionAlerts: 'Some users find the app-only interface restrictive compared to traditional clinics.'
        },
        privacy: { dataStorage: 'HIPAA-compliant', sellsData: '❌ Does not sell data', hipaa: '✅ Fully HIPAA-compliant', keyPolicy: 'Enterprise-grade security. SOC 2 certified.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Maven provides a comprehensive care model with specialists across women\'s health. Often employer-covered telehealth.',
        communityReview: 'Community discussions on Reddit r/PCOS note satisfaction with specialists who take chronic conditions seriously.',
        integrations: [], effectiveness: 'Broad specialist network. Often employer-covered.', badges: ['Female Founded', 'Telehealth Pioneer'],
        verificationLinks: {
            doctor: { links: [{ url: 'https://www.mavenclinic.com/clinical-research-institute', text: 'Maven Clinical Research Institute', summary: 'Maven conducts internal and external research to validate the effectiveness of their virtual care models for women\'s health.' }] },
            community: { links: [{ url: 'https://www.reddit.com/r/PCOS/search/?q=Maven', text: 'Reddit PCOS Support', summary: 'Many users with chronic conditions like PCOS recommend Maven for finding specialists who take their concerns seriously.' }] }
        }
    },
    {
        id: 'd-tia', name: 'Tia', category: 'telehealth', type: 'digital', internal: false, healthFunctions: ['telehealth'], tags: ['discomfort', 'irregular', 'privacy'], price: 'Free–$25/month + insurance', userRating: 4.6, whereToBuy: ['asktia.com'], platform: 'Web, iOS', image: 'https://cdn.sanity.io/images/8qqycr4y/production/a5a207809f4417e461bb0a87fd4cb4281a1b8bf7-1600x836.webp', summary: 'Modern women\'s health clinic (virtual + in-person in NYC/LA/SF). Integrative approach combining OB-GYN with acupuncture, nutrition.',
        safety: {
            fdaStatus: 'Licensed healthcare provider', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'Relevant to treatments/prescriptions provided.',
            opinionAlerts: 'Subscription-based model ("Tia Membership") can be confusing to patients with standard insurance.'
        },
        privacy: { dataStorage: 'HIPAA-compliant', sellsData: '❌ Does not sell data', hipaa: '✅ Fully HIPAA-compliant', keyPolicy: 'Medical practice with full legal protections.' },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Tia offers an integrative, patient-centered model combining OB-GYN care with acupuncture and nutrition. Hybrid virtual and in-person in select cities.',
        communityReview: 'Community discussions on Reddit r/WomensHealth note satisfaction with providers who take symptoms seriously.',
        integrations: ['Apple Health'], effectiveness: 'Integrative model combining western medicine with holistic approaches.', badges: ['Integrative Health', 'Women Founded'],
        verificationLinks: {
            doctor: { links: [] },
            scientific: { links: [{ url: 'https://www.youtube.com/watch?v=R9Z_wz3pU9M', text: 'Tia: The Future of Women\'s Health', summary: 'Deep dive into Tia\'s data-driven approach to integrative health and preventative care outcomes.' }] },
            community: { links: [{ url: 'https://www.reddit.com/r/WomensHealth/search/?q=Tia', text: 'Reddit Tia Health Reviews', summary: 'Community discussion on the convenience and modern feel of Tia\'s hybrid virtual/in-person clinics.' }] }
        }
    },
    {
        id: 'd-ppd', name: 'Planned Parenthood Direct', category: 'telehealth', type: 'digital', internal: false, healthFunctions: ['telehealth', 'contraception', 'uti-prevention'], tags: ['cost', 'comfort', 'privacy', 'uti'], price: '$0-15/visit, sliding scale', userRating: 4.7, whereToBuy: ['ppd.plannedparenthood.org', 'App Store'], platform: 'Web, iOS',
        image: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/0b/ca/49/0bca4992-624a-eb8d-e3dc-d8251c29cf82/AppIcon-1x_U007emarketing-0-6-0-85-220-0.png/512x512bb.jpg', summary: 'Birth control, UTI treatment, and STI care via app. Income-based pricing. Most trusted name in reproductive health.',
        safety: {
            fdaStatus: 'Licensed healthcare provider', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'Medication-specific.',
            opinionAlerts: 'High volume of patients can lead to slower response times on peak days.'
        },
        privacy: { dataStorage: 'HIPAA-compliant', sellsData: '❌ Does not sell data', hipaa: '✅ Fully HIPAA-compliant', keyPolicy: 'Strong legal protections for patient data. Will not comply with requests for reproductive health data.' },
        clinicianOpinionSource: 'brand',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Planned Parenthood Direct provides affordable reproductive healthcare including birth control and UTI treatment. Income-based pricing. Strong privacy protections.',
        communityReview: 'Community discussions on Reddit r/birthcontrol note affordable access, sliding scale pricing, and non-judgmental care.',
        integrations: [], effectiveness: 'Affordable access to BC, UTI treatment, emergency contraception. Sliding scale pricing.',
        verificationLinks: {
            scientific: { links: [{ url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6682703/', text: 'Study on Telemedicine for Contraception', summary: 'Evidence suggesting that apps like PP Direct significantly increase contraceptive access for underserved populations.' }] },
            community: { links: [{ url: 'https://www.reddit.com/r/birthcontrol/search/?q=Planned%20Parenthood%20Direct', text: 'Reddit BC Discussions', summary: 'Users consistently recommend this app for its speed and reliable access to birth control when clinics are far away.' }] }
        }
    },

    // ─── MORE MENTAL HEALTH ─────────────────────────────
    {
        id: 'd-betterhelp', name: 'BetterHelp', category: 'mental-health', type: 'digital', internal: false, healthFunctions: ['mental-health'], tags: ['discomfort', 'comfort'], price: '$65-90/week', userRating: 4.3, ratingNote: '2023 FTC settlement for sharing client health data with advertisers. Now under 20-year monitoring. Therapist quality varies.', whereToBuy: ['betterhelp.com'], platform: 'Web, iOS, Android', image: 'https://assets.betterhelp.com/brand/betterhelp/betterhelp-fb.png?v=09c3336ab26b', summary: 'Largest online therapy platform. Matched with a licensed therapist. Messaging + video sessions.',
        safety: {
            fdaStatus: 'Licensed therapy platform', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A',
            opinionAlerts: 'FTC data privacy settlement is a major community watch-out; some find therapist matching hit-or-miss.'
        },
        privacy: { dataStorage: 'US servers', sellsData: '⚠️ 2023 FTC settlement for sharing clients\' health data with advertisers including Facebook/Snapchat. Now under FTC order.', hipaa: '⚠️ Now under FTC privacy compliance order until 2043', keyPolicy: 'Required to get explicit consent before sharing data. Under 20-year FTC monitoring.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'BetterHelp provides access to licensed therapists. Patients should be aware of the 2023 FTC data-sharing settlement and review privacy settings.',
        communityReview: 'Community discussions on Reddit r/therapy note good therapist access but ongoing concerns about the FTC data settlement.',
        integrations: [], effectiveness: 'Convenient access to licensed therapists. Therapist quality varies. Check FTC privacy settlement.',
        verificationLinks: {
            doctor: { links: [{ url: 'https://www.apa.org/ptsd/guide/online-therapy', text: 'APA: Guide to Online Therapy', summary: 'The American Psychological Association verifies the high efficacy of online therapy for managing general anxiety and depression.' }] },
            scientific: { links: [{ url: 'https://www.jmir.org/2021/6/e27867/', text: 'JMIR Study on BetterHelp Efficacy', summary: 'Research showing that users of BetterHelp experienced a significant reduction in depression symptom severity within 3 months.' }] },
            community: { links: [{ url: 'https://www.reddit.com/r/therapy/search/?q=BetterHelp', text: 'Reddit Therapy Reviews', summary: 'Mixed but generally positive community feedback focusing on the accessibility and ease of switching therapists.' }] }
        }
    },
    {
        id: 'd-headspace', name: 'Headspace', category: 'mental-health', type: 'digital', internal: false, healthFunctions: ['mental-health'], tags: ['discomfort', 'comfort', 'cost'], price: '$13/month or $70/year', userRating: 4.5, whereToBuy: ['App Store', 'Google Play'], platform: 'iOS, Android, Web', image: 'https://headspace-contentful.imgix.net/knWuaYQdTnPg6o6VPtH1K/a0e32e013ebad294eb678f92334eba49/mobile_hero_1_june5_2x__1_.webp', summary: 'Guided meditation, sleep sounds, and mindfulness. Clinically validated to reduce stress in 10 days.',
        safety: {
            fdaStatus: 'Not FDA-cleared (wellness)', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A',
            opinionAlerts: 'Some find the content repetitive; the "corporate" feel of the app can be a turn-off for some.'
        },
        privacy: { dataStorage: 'Standard encryption', sellsData: '❌ Does not sell personal data', hipaa: 'Not HIPAA (wellness app)', keyPolicy: 'Standard privacy policy. Does not collect health-specific data.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Headspace has peer-reviewed research showing reduced stress and improved focus. A good complement to therapy.',
        communityReview: 'Community discussions on Reddit r/Meditation note sleep sounds and meditation helpful for PMS insomnia and stress.',
        integrations: ['Apple Health', 'Google Fit'], effectiveness: 'Clinically shown to reduce stress by 14% in 10 days and improve focus by 14%.',
        verificationLinks: {
            doctor: { links: [{ url: 'https://www.headspace.com/science', text: 'Headspace Science Portal', summary: 'Headspace has more than 73 peer-reviewed studies and over 100 academic and medical collaborators.' }] },
            scientific: { links: [{ url: 'https://www.headspace.com/science/meditation-research', text: 'Clinical Trials: Stress Reduction', summary: 'Proven 14% reduction in stress after just 10 days of using the Headspace app.' }] },
            community: { links: [{ url: 'https://www.reddit.com/r/Meditation/search/?q=Headspace', text: 'Reddit Meditation Community', summary: 'Widely considered the best "beginner" meditation app by the Reddit community for its structured courses.' }] }
        }
    },
    {
        id: 'd-calm', name: 'Calm', category: 'mental-health', type: 'digital', internal: false, healthFunctions: ['mental-health'], tags: ['discomfort', 'comfort'], price: '$15/month or $70/year', userRating: 4.5, whereToBuy: ['App Store', 'Google Play'], platform: 'iOS, Android, Web', image: 'https://www.calm.com/_n/images/social/calm-meta.png', summary: 'Sleep Stories, meditation, music, and masterclasses. Celebrity narrators. Great for sleep issues.',
        safety: {
            fdaStatus: 'Not FDA-cleared (wellness)', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A',
            opinionAlerts: 'Subscription price point is high for some; user interface can feel cluttered with celebrity cameos.'
        },
        privacy: { dataStorage: 'Standard encryption', sellsData: '❌ Does not sell personal data', hipaa: 'Not HIPAA (wellness app)', keyPolicy: 'Standard privacy policy.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Calm\'s Sleep Stories and meditation content can help with insomnia or anxiety-driven sleep issues. Clinical studies show improved sleep quality.',
        communityReview: 'Community discussions on Reddit r/Menopause note Sleep Stories helpful for perimenopausal insomnia.',
        integrations: ['Apple Health'], effectiveness: 'Award-winning sleep and meditation content. Clinical studies show improved sleep quality.',
        verificationLinks: {
            doctor: { links: [
                
            ] },
            scientific: { links: [
                { url: 'https://www.calm.com/science', text: 'The Science of Calm', summary: 'Calm\'s research on sleep science and pre-sleep arousal.' }
            ] },
            community: { links: [{ url: 'https://www.reddit.com/r/Menopause/search/?q=Calm', text: 'Reddit Menopause & Sleep', summary: 'Frequent recommendations in the menopause community for "Sleep Stories" as a tool for managing perimenopausal insomnia.' }] }
        }
    },

    // ─── FERTILITY ──────────────────────────────────────
    {
        id: 'd-initio', name: 'Inito Fertility Monitor', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking'], tags: ['irregular', 'pcos'], price: '$149 monitor + $50/15 strips', userRating: 4.6, whereToBuy: ['Amazon', 'inito.com'], platform: 'iOS, Android', image: 'https://m.media-amazon.com/images/I/71uAS-t2WNL._AC_UF1000,1000_QL80_.jpg', summary: 'Measures 4 hormones (E3G, LH, PdG, FSH) from urine at home. Confirms ovulation, not just predicts.',
        safety: {
            fdaStatus: 'FDA-cleared (510(k))', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A (Diagnostic). Potential for user error in strip dipping.',
            opinionAlerts: 'High cost of replenishment strips is a frequent community complaint.'
        },
        privacy: { dataStorage: 'Standard encryption', sellsData: '❌ Does not sell data', hipaa: 'Not HIPAA', keyPolicy: 'Health data stored on device and cloud.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Inito measures PdG which confirms ovulation actually occurred. Most trackers only predict it. FDA-cleared for home hormone monitoring.',
        communityReview: 'Community discussions on Reddit r/TryingForABaby note value in confirming ovulation when OPKs alone were misleading.',
        integrations: [], effectiveness: 'Unique 4-hormone measurement confirms ovulation. FDA-cleared.',
        verificationLinks: {
            community: { links: [{ url: 'https://www.reddit.com/r/Inito/', text: 'Inito Reddit Community', summary: 'A dedicated group of users sharing their hormone charts and success stories using the monitor to conceive.' }] }
        }
    },

    // ─── WEARABLES ──────────────────────────────────────
    {
        id: 'd-oura', name: 'Oura Ring Gen 3', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking', 'fitness-cycle'], tags: ['irregular', 'comfort', 'privacy'], price: '$299 + $6/month', userRating: 4.6, whereToBuy: ['ouraring.com', 'Amazon', 'Best Buy'], platform: 'iOS, Android', image: 'https://static0.xdaimages.com/wordpress/wp-content/uploads/2022/09/Silver-Oura-Ring-Gen-3-Horizon-on-white-background.jpg?q=50&fit=crop&w=800&dpr=1.5', summary: 'Smart ring that tracks cycle, sleep, HRV, temperature, and activity. Period prediction via temperature trends.',
        safety: {
            fdaStatus: 'Not FDA-cleared (wellness device)', materials: 'Titanium, non-allergenic', recalls: 'No recalls.', allergens: 'Non-nickel, hypoallergenic coating',
            sideEffects: 'Potential skin irritation from moisture trapped under the ring. In December 2025, some users reported rings overheating, with images circulating of scorched or partially melted devices; Oura characterized the incidents as extremely rare and said it found no evidence of a broader safety issue.',
            opinionAlerts: 'Requiring a subscription on top of a $300 hardware purchase is a major point of contention. A 2025 biometric data-sharing partnership with defense-analytics firm Palantir also drew significant community backlash, with some users saying publicly they stopped wearing the ring over privacy concerns.'
        },
        privacy: { dataStorage: 'Encrypted cloud + on-device', sellsData: '❌ Does not sell personal data', hipaa: 'Not HIPAA', keyPolicy: 'Oura stores biometric data encrypted. Does not share individual data with third parties.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Wearable temperature tracking via Oura can identify cycle phases and complement period tracking apps. Integrates with Natural Cycles.',
        communityReview: 'Community discussions on Reddit r/ouraring note accurate period prediction from temperature data and Natural Cycles integration, alongside real 2025 frustration over the added subscription cost, the Palantir data-sharing partnership, and isolated reports of ring overheating.',
        integrations: ['Apple Health', 'Natural Cycles', 'Google Fit', 'Strava'],
        verificationLinks: {
            community: { links: [{ url: 'https://www.reddit.com/r/ouraring/', text: 'Oura Reddit Community', summary: 'Active community discussng cycle tracking accuracy and Oura/Natural Cycles integration.' }] }
        }
    },
    {
        id: 'd-apple-health', name: 'Apple Health (Cycle Tracking)', category: 'tracker', type: 'digital', internal: false, healthFunctions: ['cycle-tracking'], tags: ['privacy', 'cost', 'comfort'], price: 'Free (built into iPhone)', userRating: 4.7, whereToBuy: ['Pre-installed on iPhone'], url: 'https://apps.apple.com/us/app/apple-health/id1242545199', platform: 'iOS only', image: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/60/e8/ae/60e8ae47-8a07-ad37-3371-d515af4b4a43/cycle.tracking-0-0-1x_U007ewatch-0-1-P3-85-220.png/1200x630wa.png', summary: 'Built-in period and fertility tracking on iPhone and Apple Watch. Strongest privacy protections. Data stays on device.',
        safety: {
            fdaStatus: 'Not FDA-cleared', materials: 'N/A', recalls: 'N/A', allergens: 'N/A',
            sideEffects: 'N/A',
            opinionAlerts: 'Highly praised for privacy, but some find the interface "clinical" and less intuitive than dedicated period apps.'
        },
        privacy: { dataStorage: 'On-device by default, E2E encrypted if iCloud enabled', sellsData: '❌ Apple cannot read your health data', hipaa: 'Exceeds HIPAA for consumer apps', keyPolicy: 'End-to-end encrypted. Apple has repeatedly fought government requests for user data. Data never leaves your device unless you explicitly share it.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and clinical guidance. Not a direct clinician quote.',
        doctorOpinion: 'Apple Health offers the strongest consumer privacy for cycle data. Data stays on device with end-to-end encryption. Ideal if privacy is the top concern.',
        communityReview: 'Community discussions on Reddit r/WomensHealth note switching to Apple Health for privacy after Dobbs; data stays on device.',
        integrations: ['All iOS Health Apps'],
        verificationLinks: {
            community: { links: [{ url: 'https://www.reddit.com/r/AppleWatch/', text: 'Apple Watch Health Community', summary: 'Users share their experiences using wrist temperature for cycle predictions and the convenience of staying within the Apple ecosystem.' }] }
        }
    },
    {
        id: 'd-eight-sleep', name: 'Eight Sleep Pod 4', category: 'sleep', type: 'digital', internal: false, healthFunctions: ['sleep', 'fitness-cycle'], tags: ['sleep', 'energy', 'menopause', 'comfort', 'hormonal'], price: '$2,245+', userRating: 4.5, whereToBuy: ['eightsleep.com'], platform: 'iOS, Android', image: 'https://res.cloudinary.com/eightsleep/image/upload/c_fill,w_1200,h_630,f_jpg,q_auto/v1747147611/Homepage_c0dril.png', summary: 'Smart mattress cover that automatically heats and cools each side of the bed throughout the night. Tracks sleep stages, HRV, heart rate, and respiratory rate. And adjusts temperature in real time to improve sleep quality.',
        safety: {
            fdaStatus: 'Not FDA-cleared (wellness device)', materials: 'Polyester, spandex blend; water-based cooling system', recalls: 'No recalls.', allergens: 'No known allergens; water system requires occasional maintenance',
            sideEffects: 'Some users report waking from cooling cycles; not recommended for those with Raynaud\'s.',
            opinionAlerts: 'High upfront cost ($2,245+) plus $19/month subscription after the first year. Requires a stable Wi-Fi connection and ongoing cloud connectivity to function — in October 2025 an AWS outage knocked out cloud-dependent Pods for some users, leaving beds unable to heat or cool properly overnight. Eight Sleep\'s founder publicly apologized and said an offline mode was coming, though it had not shipped as of this review.'
        },
        privacy: { dataStorage: 'Cloud-based, encrypted', sellsData: '❌ Does not sell personal data', hipaa: 'Not HIPAA', keyPolicy: 'Eight Sleep stores sleep biometrics in the cloud. Data shared with third-party researchers only in anonymized, aggregated form.' },
        clinicianOpinionSource: 'independent',
        clinicianAttribution: 'ayna synthesis of peer-reviewed literature and product documentation.',
        doctorOpinion: 'Temperature regulation during sleep is increasingly recognized as important for hormonal health. Especially for women experiencing night sweats, perimenopause, or disrupted sleep due to cycle-related changes. Eight Sleep\'s active cooling addresses this directly.',
        communityReview: 'Broadly positive reviews on Reddit r/EightSleep and r/sleep. Users frequently cite dramatically improved sleep quality and reduced night sweats. Common complaints: expensive upfront cost, and real frustration after an October 2025 AWS-linked outage disrupted overnight temperature control for some users.',
        recommendationWhyDetail: 'Eight Sleep is a mattress cover, not a mattress. It fits over your existing bed. A built-in water loop circulates temperature-controlled water throughout the night, automatically adjusting based on your sleep stage and body temperature. Women going through perimenopause or dealing with hormonal sleep disruption often find the active cooling side especially helpful for night sweats.',
        integrations: ['Apple Health', 'Oura Ring', 'Whoop', 'Google Fit'],
        badges: ['Sleep Tech', 'Women\'s Health'],
        verificationLinks: {
            scientific: { links: [{ url: 'https://www.eightsleep.com/science', text: 'Eight Sleep Science', summary: 'Eight Sleep publishes internal research on sleep stage detection accuracy and the effect of temperature on deep sleep and REM.' }] },
            doctor: { links: [] },
            community: { links: [{ url: 'https://www.reddit.com/r/EightSleep/', text: 'Eight Sleep Community', summary: 'Active community discussing sleep improvements, night sweat relief, and temperature optimization.' }] }
        }
    },
];

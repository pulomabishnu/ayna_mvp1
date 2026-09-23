// ============================================================
// LiM Method — confirmed Ayna brand partner.
// Affiliate links supplied by Ayna on 2026-09-11.
// Product facts/prices checked against LiM Method's official site.
// ============================================================

const LIM_EXERCISE_SAFETY = {
  fdaStatus: 'Wellness / exercise equipment; not an FDA-cleared medical device.',
  materials: 'See the current LiM Method product page for product-specific materials and specifications.',
  recalls: 'No product-specific recall is listed here; check the brand and regulator for current information.',
  sideEffects: 'Exercise can cause discomfort or injury if performed beyond your ability. Stop if you develop pain, dizziness, unusual bleeding, or worsening pelvic symptoms and seek medical guidance when appropriate. If Kegels alone haven\'t helped (or have made symptoms worse), that can be a sign of a hypertonic/non-relaxing pelvic floor — a real, documented condition where strengthening exercises can worsen symptoms — and is worth discussing with a pelvic floor physical therapist.',
  opinionAlerts: 'LiM Method describes the system as pelvic-floor wellness and exercise equipment. Product and outcome claims on the brand site are manufacturer claims, not independent clinical proof for every user.',
};

export const LIM_METHOD_PRODUCTS = [
  {
    id: 'p-lim-method-bundle',
    name: 'The LiM Bundle',
    brand: 'LiM Method',
    category: 'pelvic-floor',
    type: 'physical',
    internal: false,
    healthFunctions: ['pelvic-floor'],
    tags: ['pelvic-floor', 'fitness', 'postpartum', 'pregnancy', 'incontinence', 'reusable'],
    price: '$199.95',
    fsaHsaEligible: true,
    whereToBuy: ['LiM Method'],
    whereToBuyLinks: {
      'LiM Method': 'https://www.limmethod.com/products/the-lim-bundle-2?ref=Ayna_Health',
    },
    url: 'https://www.limmethod.com/products/the-lim-bundle-2',
    affiliateUrl: 'https://www.limmethod.com/products/the-lim-bundle-2?ref=Ayna_Health',
    image: '/products/limmethod/kneeling-pad-flatlay.webp',
    summary: 'The LiM Method was created by Jemila Medley, a Pelvic Floor Occupational Therapist, Pre- and Postnatal Exercise Specialist, and Diastasis Recti Expert who previously ran a private pelvic floor therapy practice. This pelvic-floor wellness starter kit includes the LiM Sliding Board, Number Mat, stability blocks, shoe covers, kneeling pad, and access to guided Movement Sessions with no subscription required.',
    safety: LIM_EXERCISE_SAFETY,
    clinicianOpinionSource: 'brand',
    clinicianAttribution: 'Founder Jemila Medley is a real, credentialed pelvic floor occupational therapist and former private-practice owner; the studies cited below are real but general pelvic-floor-exercise research, not independent trials of this specific bundle, and no independent clinician endorsement of the product has been verified by ayna.',
    doctorOpinion: 'LiM Method\'s philosophy pushes back on the idea that pelvic floor training just means Kegels. That distinction has real clinical grounding: a hypertonic, or "non-relaxing," pelvic floor is a real, documented condition where the muscles are already over-contracted, and conventional strengthening advice can worsen symptoms rather than help — pelvic floor physical therapy that includes relaxation and coordination work, not just contraction, is the first-line treatment for it. LiM\'s Movement Sessions are built around multidirectional, full-body motion on the Sliding Board (squats, lunges) meant to train the pelvic floor to both contract and relax in coordination with the rest of the body, rather than isolated repetitive squeezing.\n\nLiM Method\'s own citations page references real research: a randomized controlled trial found a high-low impact exercise program including pelvic floor muscle exercises improved pelvic floor muscle function in healthy pregnant women, and a separate randomized trial found pelvic floor muscle exercise improved pelvic floor muscle activity and voiding function during pregnancy and postpartum. Pelvic floor disorders are also genuinely common — a widely cited peer-reviewed study found roughly one in four adult US women has at least one symptomatic pelvic floor disorder.\n\nThese are real studies on pelvic floor exercise generally and during pregnancy specifically; none of them tested the LiM Bundle or Sliding Board as a specific product. No independent clinical study of this exact consumer bundle was found.',
    doctorOpinionShort: 'LiM\'s emphasis on multidirectional movement over Kegels-only training has real clinical grounding — a hypertonic pelvic floor is a documented condition where Kegels can worsen symptoms. The brand cites real studies on pelvic floor exercise during pregnancy; none tested this specific bundle. No independent study of the LiM Bundle itself was found.',
    // Kept out of verificationLinks so it doesn't pool with the
    // Scientific literature tab's citation list.
    doctorOpinionCitations: [
      { url: 'https://pubmed.ncbi.nlm.nih.gov/19932423/', label: 'PubMed: Pelvic floor hypertonic disorders — identification and management' },
      { url: 'https://pubmed.ncbi.nlm.nih.gov/30761019/', label: 'PubMed: High-Low Impact Exercise Program Including Pelvic Floor Muscle Exercises Improves Pelvic Floor Muscle Function in Healthy Pregnant Women — a randomized controlled trial' },
    ],
    // Rendered as a bulleted list on the Evidence view, under "Best for".
    whoItsFor: [
      'Women wanting a guided, at-home pelvic floor wellness program beyond isolated Kegels',
      'Pregnant or postpartum women wanting guided, multidirectional pelvic floor movement',
      'Anyone whose symptoms haven\'t improved (or have worsened) with Kegels alone — worth discussing a possible hypertonic/non-relaxing pelvic floor with a pelvic floor PT',
      'Anyone wanting equipment-guided sessions with no ongoing subscription required',
    ],
    // Rendered as a bulleted list on the Evidence view. Matches
    // limmethod.com/pages/how-it-works.
    howToUse: {
      intro: 'Per LiM Method\'s own site: use the Sliding Board with the included accessories for guided Movement Sessions.',
      steps: [
        'Set up the Sliding Board, Number Mat, and stability blocks as directed.',
        'Wear the shoe covers to enable smooth gliding on the board.',
        'Use the kneeling pad for cushioning during low-to-the-ground positions.',
        'Follow guided Movement Sessions combining multidirectional squats and lunges to train the pelvic floor in coordination with the rest of the body.',
      ],
      sourceUrl: 'https://www.limmethod.com/pages/how-it-works',
      sourceLabel: 'limmethod.com: How LiM Method Works',
    },
    // Rendered as a red warning box on the Evidence view.
    warnings: [
      'Stop and consult a pelvic floor physical therapist if you develop pain, dizziness, unusual bleeding, or worsening pelvic symptoms.',
      'If Kegels alone haven\'t helped (or made things worse), that can be a sign of a hypertonic/non-relaxing pelvic floor, which needs a different approach than general strengthening — talk to a pelvic floor PT.',
      'Persistent pelvic pain, prolapse symptoms, or incontinence warrant individualized clinical evaluation, not just a home exercise kit.',
    ],
    communityReview: 'LiM Method\'s own site reports that 98% of users agreed the program helped them feel more educated about connecting to their pelvic floor, and features testimonials from postpartum users describing regained confidence around leaking. No independently verified (non-brand) review data or aggregate rating was found at time of writing.',
    effectiveness: 'LiM Method positions the bundle as a guided, low-impact, multidirectional pelvic-floor training system. Its emphasis on training relaxation and coordination, not just contraction, has real clinical backing for people with a hypertonic pelvic floor, and the brand\'s cited studies show real benefits of pelvic floor exercise generally during pregnancy. No independent clinical trial of this exact consumer bundle was found.',
    // Category-level citations shown only on the Scientific literature
    // tab, kept out of verificationLinks so they don't also pool onto
    // the Clinician opinion card's chip row.
    scientificCitations: [
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/19932423/',
        text: 'PubMed: Pelvic floor hypertonic disorders — identification and management',
        summary: 'Real clinical grounding for LiM\'s core "not just Kegels" philosophy — strengthening exercises can worsen symptoms in a hypertonic, non-relaxing pelvic floor, which needs coordination/relaxation-focused training instead.',
      },
      {
        url: 'https://pubmed.ncbi.nlm.nih.gov/30761019/',
        text: 'PubMed: High-Low Impact Exercise Program Including Pelvic Floor Muscle Exercises Improves Pelvic Floor Muscle Function in Healthy Pregnant Women — a randomized controlled trial',
        summary: 'Cited by LiM Method\'s own site. RCT in healthy pregnant women; general pelvic floor exercise evidence, not a test of this specific product.',
      },
      {
        url: 'https://doi.org/10.1002/nau.22728',
        text: 'Kahyaoğlu Süt & Balkanlı Kaplan, Neurourol Urodyn 2016: Effect of pelvic floor muscle exercise on pelvic floor muscle activity and voiding functions during pregnancy and the postpartum period',
        summary: 'Also cited by LiM Method\'s own site. RCT (60 women) finding real benefit from pelvic floor muscle exercise during pregnancy/postpartum — general category evidence, not product-specific.',
      },
      {
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC2918416/',
        text: 'NIH (PMC): Prevalence of Symptomatic Pelvic Floor Disorders in US Women',
        summary: 'The peer-reviewed study behind the "roughly 1 in 4 women" pelvic floor disorder statistic — real epidemiological context, not product-specific validation.',
      },
    ],
    verificationLinks: {
      doctor: { links: [] },
      scientific: { links: [] },
      community: {
        links: [
          {
            platform: 'website',
            url: 'https://www.limmethod.com/pages/citations',
            text: 'limmethod.com: Citations',
            summary: 'LiM Method\'s own citations page, listing the research it references for its approach.',
          },
          {
            platform: 'website',
            url: 'https://www.limmethod.com/products/the-lim-bundle-2',
            text: 'limmethod.com: The LiM Bundle — customer reviews',
            summary: 'The Bundle\'s own product page, which displays customer testimonials. Review content/ratings weren\'t independently verifiable at time of writing — read them directly on the page.',
          },
        ],
      },
    },
    integrations: [],
    badges: [],
    isEmergingBrand: true,
  },
  {
    id: 'p-lim-method-shoe-covers',
    name: 'LiM Method Shoe Covers',
    brand: 'LiM Method',
    category: 'pelvic-floor',
    type: 'physical',
    internal: false,
    healthFunctions: ['pelvic-floor'],
    tags: ['pelvic-floor', 'fitness', 'accessory', 'reusable'],
    price: '$24.99',
    whereToBuy: ['LiM Method'],
    whereToBuyLinks: {
      'LiM Method': 'https://www.limmethod.com/collections/accessories/products/shoe-covers?ref=Ayna_Health',
    },
    url: 'https://www.limmethod.com/products/shoe-covers',
    affiliateUrl: 'https://www.limmethod.com/collections/accessories/products/shoe-covers?ref=Ayna_Health',
    image: 'https://www.limmethod.com/cdn/shop/files/IMG_2821.jpg?v=1696450654&width=1946',
    summary: 'One-size-fits-all elastic shoe covers from LiM Method — founded by pelvic floor occupational therapist Jemila Medley (see The LiM Bundle entry for her story) — designed to facilitate the gliding motions used with the LiM Sliding Board during LiM Method movement sessions.',
    safety: LIM_EXERCISE_SAFETY,
    clinicianOpinionSource: 'brand',
    clinicianAttribution: 'Product features are sourced from LiM Method’s official product information; this is not an independent clinician endorsement.',
    doctorOpinion: 'This is an accessory for the LiM exercise system rather than a standalone pelvic-floor treatment. Use it only as intended with a stable exercise setup and stop if movement causes pain or worsening symptoms.',
    effectiveness: 'Designed by the brand to help the user glide on the LiM Sliding Board; it is an equipment accessory and has not been independently studied as a standalone clinical intervention.',
    integrations: [],
    badges: [],
    isEmergingBrand: true,
  },
  {
    id: 'p-lim-method-kneeling-pad',
    name: 'LiM Method Kneeling Pad',
    brand: 'LiM Method',
    category: 'pelvic-floor',
    type: 'physical',
    internal: false,
    healthFunctions: ['pelvic-floor'],
    tags: ['pelvic-floor', 'fitness', 'accessory', 'comfort', 'reusable'],
    price: '$24.99',
    whereToBuy: ['LiM Method'],
    whereToBuyLinks: {
      'LiM Method': 'https://www.limmethod.com/collections/accessories/products/kneeling-pad?ref=Ayna_Health',
    },
    url: 'https://www.limmethod.com/products/kneeling-pad',
    affiliateUrl: 'https://www.limmethod.com/collections/accessories/products/kneeling-pad?ref=Ayna_Health',
    image: '/products/limmethod/lim-bundle-lunge.webp',
    summary: 'Compact one-inch-thick exercise kneeling pad from LiM Method — founded by pelvic floor occupational therapist Jemila Medley (see The LiM Bundle entry for her story) — that adds cushioning for low-to-the-ground positions used in LiM Method movement sessions.',
    safety: LIM_EXERCISE_SAFETY,
    clinicianOpinionSource: 'brand',
    clinicianAttribution: 'Product features are sourced from LiM Method’s official product information; this is not an independent clinician endorsement.',
    doctorOpinion: 'This is a cushioning accessory, not a pelvic-floor treatment on its own. Use enough support to keep kneeling comfortable and avoid positions that cause pain, numbness, or joint irritation.',
    effectiveness: 'Designed to provide knee cushioning during LiM Method exercise positions; no independent clinical study of this accessory as a standalone intervention is cited here.',
    integrations: [],
    badges: [],
    isEmergingBrand: true,
  },
];

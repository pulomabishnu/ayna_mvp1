/**
 * "How to use" content for product modals — merges Ayna database fields with
 * category templates and curated public links (brand sites, FDA, Mayo, YouTube search).
 * Per-product overrides: product.howToUse or HOW_TO_BY_PRODUCT_ID.
 */

function ytSearch(query) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function firstBrandishUrl(product) {
  const w = product?.whereToBuy;
  if (!Array.isArray(w) || !w[0]) return null;
  const s = String(w[0]).trim();
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9][a-z0-9.-]*\.(com|io|co|life|health|org|net)$/i.test(s.replace(/\s+/g, ''))) {
    return s.startsWith('http') ? s : `https://${s.replace(/\s+/g, '')}`;
  }
  return null;
}

/** @typedef {{ label: string; url: string; hint?: string }} HowToLink */
/** @typedef {{ label: string; url: string }} HowToVideo */

/**
 * @returns {{
 *   fromBrand: { paragraphs: string[] },
 *   steps: string[] | null,
 *   signupBullets: string[] | null,
 *   whatToExpectBullets: string[] | null,
 *   aggregatedIntro: string,
 *   tutorialLinks: HowToLink[],
 *   videoLinks: HowToVideo[],
 * }}
 */
export function getHowToUseContent(product) {
  if (!product) {
    return emptyContent();
  }

  const custom = product.howToUse || HOW_TO_BY_PRODUCT_ID[product.id];
  const cat = product.category || 'default';
  const name = product.name || 'This product';
  const brandUrl = firstBrandishUrl(product);

  const baseFromBrand = buildFromBrandParagraphs(product);
  const template = CATEGORY_HOW_TO[cat] || CATEGORY_HOW_TO.default;

  let steps = custom?.steps ?? template.steps?.(product) ?? null;
  let signupBullets = custom?.signupBullets ?? template.signupBullets?.(product) ?? null;
  let whatToExpectBullets = custom?.whatToExpectBullets ?? template.whatToExpectBullets?.(product) ?? null;
  let aggregatedIntro =
    custom?.aggregatedIntro ??
    template.aggregatedIntro(name, product) ??
    defaultAggregated(name, cat);

  /** @type {HowToLink[]} */
  let tutorialLinks = [...(custom?.tutorialLinks || [])];
  /** @type {HowToVideo[]} */
  let videoLinks = [...(custom?.videoLinks || [])];

  if (!custom?.skipCategoryExtras && template.extraTutorialLinks) {
    tutorialLinks = [...tutorialLinks, ...template.extraTutorialLinks(product, brandUrl)];
  }
  if (!custom?.skipCategoryExtras && template.extraVideoLinks) {
    videoLinks = [...videoLinks, ...template.extraVideoLinks(product)];
  }

  if (brandUrl && !tutorialLinks.some((l) => l.url === brandUrl)) {
    tutorialLinks.unshift({
      label: `${name.split(/[(\[]/)[0].trim()} — official site`,
      url: brandUrl,
      hint: 'Brand instructions, FAQs, and support.',
    });
  }

  const fromBrand = {
    paragraphs: custom?.fromBrandParagraphs?.length ? custom.fromBrandParagraphs : baseFromBrand,
  };

  if (custom?.merge) {
    const merged = custom.merge({
      fromBrand,
      steps,
      signupBullets,
      whatToExpectBullets,
      aggregatedIntro,
      tutorialLinks,
      videoLinks,
    });
    return { ...merged, disclaimer: DISCLAIMER };
  }

  return {
    fromBrand,
    steps,
    signupBullets,
    whatToExpectBullets,
    aggregatedIntro,
    tutorialLinks: dedupeLinks(tutorialLinks),
    videoLinks: dedupeVideos(videoLinks),
    disclaimer: DISCLAIMER,
  };
}

const DISCLAIMER =
  'Instructions combine Ayna’s product data with widely published guidance. Always follow the manufacturer’s label and your clinician’s advice. Links open third-party sites Ayna does not control.';

function emptyContent() {
  return {
    fromBrand: { paragraphs: [] },
    steps: null,
    signupBullets: null,
    whatToExpectBullets: null,
    aggregatedIntro: '',
    tutorialLinks: [],
    videoLinks: [],
    disclaimer: DISCLAIMER,
  };
}

function dedupeLinks(links) {
  const seen = new Set();
  return links.filter((l) => {
    if (!l?.url) return false;
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });
}

function dedupeVideos(vids) {
  const seen = new Set();
  return vids.filter((v) => {
    if (!v?.url) return false;
    if (seen.has(v.url)) return false;
    seen.add(v.url);
    return true;
  });
}

function buildFromBrandParagraphs(product) {
  const parts = [];
  if (product.summary) parts.push(product.summary);
  if (product.effectiveness && product.effectiveness !== product.summary) {
    parts.push(`Product notes: ${product.effectiveness}`);
  }
  if (product.ingredients) parts.push(`Ingredients / materials (from our database): ${product.ingredients}`);
  if (product.safety?.materials) parts.push(`Materials: ${product.safety.materials}`);
  if (product.stage && product.type === 'digital') parts.push(`Platform / stage: ${product.stage}`);
  if (product.platform) parts.push(`Available on: ${product.platform}`);
  return parts.length ? parts : [`${product.name || 'This product'} — see brand and regulatory details in the Safety tab.`];
}

function defaultAggregated(name, cat) {
  return `Below is practical guidance commonly shared for ${cat.replace(/-/g, ' ')} products like ${name}. It is educational only—not a substitute for the official instructions or your clinician.`;
}

const CUP_STEPS = (product) => [
  'Wash your hands. Rinse or boil the cup per brand directions before first use.',
  'Fold the cup (C-fold, punch-down, or 7-fold), relax, and insert toward the tailbone.',
  'Let the cup open fully; rotate slightly if needed to form a seal.',
  'Wear up to the time limit on the label (often 8–12 hours for many cups).',
  'To remove: pinch the base to break the seal, then gently pull out.',
  'Rinse with water or mild unscented soap; store in a breathable pouch when dry.',
];

const DISC_STEPS = (product) => [
  'Wash hands. Pinch the disc and insert toward the back of the vaginal canal (often sits below the cervix).',
  'Tuck the front rim up behind the pubic bone if your disc design uses that for retention.',
  'Some discs allow mess-free removal with a finger hook—follow brand diagrams.',
  'Remove, empty, rinse, and reinsert per label; replace disposable discs after one use.',
];

const PAD_TAM_STEPS = (isTampon) => [
  isTampon
    ? 'Wash hands. Unwrap the tampon; use the applicator or finger per package style.'
    : 'Wash hands. Unwrap the pad; remove backing from wings if present.',
  isTampon
    ? 'Insert at a comfortable angle toward the small of the back; leave the string outside.'
    : 'Press the pad into underwear; fold wings under for security.',
  'Change regularly (often every 4–8 hours for tampons; follow label to reduce TSS risk).',
  'Dispose of used product in the trash; do not flush applicators or pads.',
];

const CATEGORY_HOW_TO = {
  cup: {
    steps: () => CUP_STEPS(),
    aggregatedIntro: (name) =>
      `Menstrual cups create a seal to collect flow. Guidance below reflects common teaching from manufacturers and health organizations; ${name} may have size-specific steps—use the brand’s PDF or video first.`,
    extraTutorialLinks: (product, brandUrl) => [
      {
        label: 'FDA — menstrual tampons and pads (device basics)',
        url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely',
        hint: 'Federal consumer guidance on safe use of internal devices.',
      },
      {
        label: 'Mayo Clinic — menstrual cup overview',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868',
        hint: 'General insertion, care, and when to see a clinician.',
      },
    ],
    extraVideoLinks: (product) => [
      { label: `YouTube search: ${product.name} how to insert`, url: ytSearch(`${product.name} menstrual cup how to insert remove`) },
      { label: 'YouTube search: menstrual cup for beginners', url: ytSearch('menstrual cup beginners tutorial') },
    ],
  },
  disc: {
    steps: () => DISC_STEPS(),
    aggregatedIntro: (name) =>
      `Discs sit differently than cups and may use auto-dumping or pubic-bone retention depending on design. Follow ${name}’s diagrams; the steps below are typical patterns from public instructions.`,
    extraTutorialLinks: (product) => [
      {
        label: 'Mayo Clinic — menstrual disc vs cup',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cup/art-20045868',
        hint: 'Overview of internal collection options.',
      },
    ],
    extraVideoLinks: (product) => [
      { label: `YouTube search: ${product.name} insertion`, url: ytSearch(`${product.name} menstrual disc how to use`) },
    ],
  },
  pad: {
    steps: () => PAD_TAM_STEPS(false),
    aggregatedIntro: (name) =>
      `Pads are worn externally. Change on a schedule that matches your flow; overnight pads are usually longer/heavier absorbency.`,
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} review`, url: ytSearch(`${product.name} pad how to use`) }],
  },
  tampon: {
    steps: () => PAD_TAM_STEPS(true),
    aggregatedIntro: () =>
      `Tampons are worn inside the vagina. Use the lowest absorbency you need and change on the schedule printed on the box to reduce TSS risk.`,
    extraTutorialLinks: () => [
      {
        label: 'FDA — tampon safety facts',
        url: 'https://www.fda.gov/consumers/consumer-updates/facts-tampons-and-how-use-them-safely',
        hint: '',
      },
    ],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} applicator`, url: ytSearch(`${product.name} tampon how to insert`) }],
  },
  'period-underwear': {
    steps: () => [
      'Wear like regular underwear; choose absorbency for light, medium, or heavy days per product line.',
      'Rinse in cold water after use if the brand recommends it; then machine wash per label.',
      'Avoid fabric softener if the brand says it reduces absorbency.',
      'Replace when elasticity or absorbency declines.',
    ],
    aggregatedIntro: (name) =>
      `${name} relies on built-in layers. Care instructions vary by brand—always follow the sewn-in label.`,
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} care`, url: ytSearch(`${product.name} period underwear wash care`) }],
  },
  supplement: {
    steps: () => [
      'Read the Supplement Facts panel for serving size and timing (with food vs empty stomach).',
      'Start new supplements one at a time when possible so you can notice tolerance.',
      'Store as directed (cool, dry place; some need refrigeration).',
      'Tell your clinician and pharmacist everything you take to check interactions.',
    ],
    aggregatedIntro: () =>
      'Dietary supplements are not FDA-approved like drugs; quality varies by brand. Use verified products and professional guidance for dosing.',
    extraTutorialLinks: () => [
      {
        label: 'FDA — dietary supplements basics',
        url: 'https://www.fda.gov/food/dietary-supplements',
        hint: '',
      },
    ],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} how to take`, url: ytSearch(`${product.name} supplement how to take`) }],
  },
  telehealth: {
    steps: null,
    signupBullets: (product) => [
      `Download the app or open ${product.name}’s website in a supported browser.`,
      'Create an account with email or SSO; verify identity if required for prescriptions.',
      'Complete the health questionnaire honestly (medications, allergies, conditions).',
      'Add insurance or payment; some services offer income-based pricing.',
      'Book a video visit or start an async visit; join from a private space with good lighting.',
    ],
    whatToExpectBullets: () => [
      'A licensed clinician reviews your history; visits may be video, phone, or message-based.',
      'If prescribed, medication may go to a pharmacy you choose or mail-order.',
      'Follow-up and lab orders depend on your state and the service’s scope of practice.',
      'Emergency symptoms need urgent in-person or ER care—not telehealth alone.',
    ],
    aggregatedIntro: (name) =>
      `${name} and similar services vary by state, insurance, and specialty. The bullets below are typical; confirm on the official site before you sign up.`,
    extraTutorialLinks: (product, brandUrl) => {
      const links = [];
      if (brandUrl) {
        links.push({
          label: 'Get started / help center (search from official site)',
          url: brandUrl,
          hint: 'Look for “How it works,” pricing, and state availability.',
        });
      }
      return links;
    },
    extraVideoLinks: (product) => [
      { label: `YouTube search: ${product.name} how it works`, url: ytSearch(`${product.name} telehealth how it works sign up`) },
    ],
  },
  tracker: {
    steps: () => [
      'Install from the App Store or Google Play; create a private account.',
      'Allow only the permissions you are comfortable with (calendar, health sync, notifications).',
      'Log periods and symptoms consistently for better predictions.',
      'Review privacy settings and data export options in the app.',
    ],
    aggregatedIntro: () =>
      'Cycle trackers differ in what they store and share. Adjust privacy controls and read their HIPAA / data policy in the Safety tab.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} app tutorial`, url: ytSearch(`${product.name} app tutorial setup`) }],
  },
  'mental-health': {
    steps: () => [
      'Sign up through web or app; verify email and complete intake forms.',
      'Match with a therapist or coach per the service model; some offer crisis resources only.',
      'Attend sessions from a private space; test audio/video beforehand.',
      'If you have urgent safety concerns, use local emergency or crisis lines—not delayed chat.',
    ],
    aggregatedIntro: () =>
      'Digital mental health services vary (therapy vs coaching vs self-guided). Confirm licensure and scope for your needs.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} review`, url: ytSearch(`${product.name} app how to use`) }],
  },
  fitness: {
    steps: () => [
      'Install the app and create an account.',
      'Connect wearables only if you want cycle-synced or activity features.',
      'Follow program warm-ups and rest days to reduce injury risk.',
    ],
    aggregatedIntro: () =>
      'Fitness apps may sync health data; review permissions and your clinician’s advice before new programs.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} workout`, url: ytSearch(`${product.name} app workout tutorial`) }],
  },
  'pelvic-floor': {
    steps: () => [
      'Clean the device per instructions; use water-based lubricant if the brand allows.',
      'Start with the lowest intensity or shortest session recommended.',
      'Stop if you feel sharp pain, bleeding, or dizziness—contact a pelvic PT or clinician.',
    ],
    aggregatedIntro: () =>
      'Pelvic devices are often used with professional guidance; ask your OB-GYN or pelvic floor PT for a plan.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} how to use`, url: ytSearch(`${product.name} pelvic floor device tutorial`) }],
  },
  'cramp-relief': {
    steps: () => [
      'Read the label for where to apply (skin) or how to ingest (supplements) vs heat-only devices.',
      'Heat: use the temperature and duration limits on the pack or device.',
      'Discontinue if rash, burns, or worsening pain occurs.',
    ],
    aggregatedIntro: () =>
      'Cramp relief may combine heat, OTC meds, or devices—follow label limits and ask a clinician if pain is severe or new.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} how to use`, url: ytSearch(`${product.name} how to use`) }],
  },
  menopause: {
    steps: () => [
      'Complete intake for symptoms and health history; upload insurance if applicable.',
      'Attend visits as offered (video or async); ask about HRT vs non-hormonal options.',
      'Track symptoms over weeks so dosing can be adjusted safely.',
    ],
    aggregatedIntro: () =>
      'Menopause care should be individualized; telehealth services differ in prescribing rules by state.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name}`, url: ytSearch(`${product.name} menopause care how it works`) }],
  },
  'intimate-care': {
    steps: () => [
      'Patch-test new topical products if you have sensitive skin.',
      'Use only as directed on external vs internal areas.',
      'Stop if burning, swelling, or infection symptoms appear.',
    ],
    aggregatedIntro: () =>
      'Intimate care products should match your pH and sensitivity; when in doubt, ask a clinician.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name}`, url: ytSearch(`${product.name} how to use`) }],
  },
  pregnancy: {
    steps: () => [
      'Follow trimester-specific guidance on the label or app.',
      'Discuss any new product with your prenatal provider.',
    ],
    aggregatedIntro: () =>
      'Pregnancy product use should always be confirmed with your OB or midwife.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name}`, url: ytSearch(`${product.name} pregnancy how to use`) }],
  },
  postpartum: {
    steps: () => [
      'Use recovery products as directed for bleeding, nursing, or scar care.',
      'Watch for fever, heavy bleeding, or pain—seek urgent care if red-flag symptoms occur.',
    ],
    aggregatedIntro: () =>
      'Postpartum healing varies; follow your discharge instructions and pediatric/OB advice.',
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name}`, url: ytSearch(`${product.name} postpartum how to use`) }],
  },
  default: {
    steps: (product) => [
      `Read the full label and packaging for ${product.name}.`,
      'Start with the lowest frequency or dose suggested for new routines.',
      'Stop and seek advice if you have an allergic reaction or unexpected symptoms.',
    ],
    aggregatedIntro: (name) =>
      `We don’t have a dedicated template for this category yet. Use manufacturer directions first; ${name} may have PDFs or videos on the brand site.`,
    extraTutorialLinks: () => [],
    extraVideoLinks: (product) => [{ label: `YouTube search: ${product.name} how to use`, url: ytSearch(`${product.name} how to use tutorial`) }],
  },
};

/** Richer content for flagship / example products */
const HOW_TO_BY_PRODUCT_ID = {
  'p-diva-cup': {
    skipCategoryExtras: true,
    fromBrandParagraphs: [
      'DivaCup is a reusable medical-grade silicone cup with multiple sizes. Official instructions cover folding, insertion, rotation for seal, and cleaning between cycles.',
      'Many users watch short tutorials for fold techniques and removal without breaking the seal too abruptly.',
    ],
    steps: [
      'Wash hands. Boil or clean the cup per DivaCup’s guide before first use.',
      'Try a fold (C-fold or punch-down), insert toward the tailbone, and allow the cup to open.',
      'Rotate slightly if needed; run a finger around the rim to check the seal.',
      'Wear up to 12 hours as directed; empty sooner if you have a heavy flow.',
      'Pinch the base to release suction, remove, rinse with water or mild soap, reinsert or store dry in a breathable pouch.',
    ],
    aggregatedIntro:
      'These steps align with common DivaCup teaching and public health summaries. Always follow the insert included with your cup and DivaCup’s official sizing chart.',
    tutorialLinks: [
      {
        label: 'DivaCup — how to use (official)',
        url: 'https://divacup.com/pages/how-to-use',
        hint: 'Brand diagrams and care.',
      },
      {
        label: 'DivaCup — cleaning & care',
        url: 'https://divacup.com/pages/care-cleaning',
        hint: 'Between-cycle cleaning and storage.',
      },
    ],
    videoLinks: [
      { label: 'YouTube search: DivaCup insertion tutorial', url: ytSearch('DivaCup how to insert remove tutorial') },
      { label: 'YouTube search: menstrual cup folds', url: ytSearch('menstrual cup folds C fold punch down') },
    ],
  },
};

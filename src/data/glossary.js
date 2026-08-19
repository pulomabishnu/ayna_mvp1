/**
 * Plain-language explanations for medical terms, acronyms, and org names shown
 * across the site. Keyed by the exact string used as a UI label (case-sensitive) so
 * <GlossaryTerm> can look a definition up by what's on screen without needing every
 * caller to know a separate id.
 */
export const GLOSSARY = {
  // Diagnosed conditions (src/utils/healthIntake.js DIAGNOSED_CONDITIONS —
  // these values are matched elsewhere in the app, so we explain them here
  // instead of renaming them)
  'PCOS': 'A common hormone condition. It can cause irregular periods, acne, and extra hair growth.',
  'endometriosis': 'Tissue like the lining of the uterus grows outside it. This can cause bad pain, especially during your period.',
  'fibroids': 'Non-cancerous growths in or on the uterus. They can cause heavy periods or pelvic pain.',
  'adenomyosis': 'The uterus lining grows into the muscle wall of the uterus. This can cause heavy, painful periods.',
  'perimenopause': 'The years before menopause when your body starts making less estrogen. Periods often become irregular.',
  'menopause': 'When your periods stop for good, usually around age 45–55.',
  'thyroid disorder (hypothyroid)': 'Your thyroid gland makes too little hormone. This can cause tiredness and weight gain.',
  'thyroid disorder (hyperthyroid)': 'Your thyroid gland makes too much hormone. This can cause a fast heartbeat and weight loss.',
  'anemia / iron deficiency': 'Low iron in your blood. This can make you feel tired or short of breath.',
  'vaginismus': 'Muscles around the vagina tighten on their own. This can make sex or pelvic exams painful.',
  'vulvodynia': 'Ongoing pain around the vulva (outer genital area) with no clear cause.',
  'interstitial cystitis': 'Long-term bladder pain and a frequent need to pee, not caused by infection.',
  'PMDD': 'Premenstrual dysphoric disorder — a severe form of PMS with strong mood changes before your period.',
  'chronic pelvic pain': 'Pain in the lower belly area that lasts 6 months or longer.',
  'ovarian cysts': 'Fluid-filled sacs on an ovary. Most are harmless, but some cause pain.',
  'hypothalamic amenorrhea': 'Periods stop because of stress, low body weight, or too much exercise.',
  'premature ovarian insufficiency': "Ovaries stop working normally before age 40, so periods become irregular or stop early.",
  'MTHFR gene variant': 'A common gene change that can affect how your body processes a B vitamin called folate.',

  // Family history (src/components/HealthIntakeForm.jsx FAMILY_HISTORY_OPTIONS)
  'Uterine fibroids': 'Non-cancerous growths in or on the uterus. They can cause heavy periods or pelvic pain.',
  'BRCA1/BRCA2': 'Genes that, when changed, raise the risk of breast and ovarian cancer.',
  'Osteoporosis': 'Bones become weak and can break more easily.',
  'Premature ovarian insufficiency': "Ovaries stop working normally before age 40, so periods become irregular or stop early.",

  // Concern areas / acronyms (src/utils/healthIntake.js CONCERN_AREAS, and general UI)
  'UTI': 'Urinary tract infection — a bladder or urinary infection. Common signs are burning when you pee and needing to pee often.',
  'STI': 'Sexually transmitted infection — an infection passed through sexual contact.',
  'OB/GYN': "A doctor who cares for women's reproductive health and pregnancy.",
  'HRT': 'Hormone replacement therapy — medicine that replaces hormones your body makes less of, often used for menopause symptoms.',
  'IUD': 'Intrauterine device — a small birth control device placed inside the uterus.',
  'BMI': "Body mass index — a number based on your height and weight, sometimes used as a rough health screening tool.",
  'TTC': 'Trying to conceive — trying to get pregnant.',
  'telehealth': 'Seeing a doctor or nurse over video call or phone, instead of going to an office.',
  'probiotics': 'Live "good" bacteria, taken as a pill or food, that can help gut and vaginal health.',

  // Insurance terms (src/utils/healthIntake.js INSURANCE_TYPES, FSA_HSA_OPTIONS)
  'PPO': 'Preferred Provider Organization — an insurance plan that lets you see any doctor, no referral needed.',
  'HMO': "Health Maintenance Organization — an insurance plan where you pick a main doctor who refers you to specialists.",
  'ACA': "Affordable Care Act — the federal law behind the health insurance marketplace (healthcare.gov and state exchanges).",
  'Medicaid': 'Free or low-cost health insurance from the government, based on income.',
  'Medicare': 'Government health insurance, mainly for people 65 and older.',
  'Tricare': 'Health insurance for military members, veterans, and their families.',
  'FSA': 'Flexible Spending Account — money set aside from your paycheck, before taxes, to pay for medical costs.',
  'HSA': 'Health Savings Account — a tax-free savings account for medical costs, usually paired with certain insurance plans.',

  // National orgs referenced in copy elsewhere on the site
  'ACOG': 'American College of Obstetricians and Gynecologists — the main U.S. medical group setting guidelines for women’s health care.',
  'FDA': 'U.S. Food and Drug Administration — the government agency that approves and monitors medicines and medical products.',
  'CDC': 'Centers for Disease Control and Prevention — the U.S. government agency that tracks disease and gives public health guidance.',
  'NIH': 'National Institutes of Health — the main U.S. government agency for medical research.',
};

/** Case-insensitive fallback lookup, in case a caller's on-screen text doesn't exactly match a key's casing. */
export function lookupGlossaryTerm(term) {
  if (!term) return null;
  if (GLOSSARY[term]) return GLOSSARY[term];
  const lower = String(term).toLowerCase();
  const found = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === lower);
  return found ? GLOSSARY[found] : null;
}

const GLOSSARY_KEYS_BY_LENGTH = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

/**
 * Finds the first glossary term that appears as a whole word/phrase inside a longer
 * label (e.g. "PCOS management (supplements, telehealth, apps)" contains "PCOS") and
 * returns its definition. Used for options/labels we can't rename because the exact
 * string is a matching key elsewhere in the app — this adds an explanation without
 * touching the value. Longer keys are checked first so "endometriosis" doesn't get
 * shadowed by a shorter unrelated match.
 */
export function findGlossaryTermInText(text) {
  if (!text) return null;
  const haystack = String(text);
  for (const key of GLOSSARY_KEYS_BY_LENGTH) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(^|[^a-zA-Z])${escaped}([^a-zA-Z]|$)`, 'i');
    if (re.test(haystack)) return GLOSSARY[key];
  }
  return null;
}

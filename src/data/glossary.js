import { GLOSSARY as APP_GLOSSARY } from '../mobile/data/glossary.js';
/**
 * Plain-language explanations for medical terms, acronyms, and org names shown
 * across the site. Keyed by the exact string used as a UI label (case-sensitive) so
 * <GlossaryTerm> can look a definition up by what's on screen without needing every
 * caller to know a separate id.
 */
export const GLOSSARY = {
  // Diagnosed conditions (src/utils/healthIntake.js DIAGNOSED_CONDITIONS
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
  'PMDD': 'Premenstrual dysphoric disorder. A severe form of PMS with strong mood changes before your period.',
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
  'UTI': 'Urinary tract infection. A bladder or urinary infection. Common signs are burning when you pee and needing to pee often.',
  'STI': 'Sexually transmitted infection. An infection passed through sexual contact.',
  'OB/GYN': "A doctor who cares for women's reproductive health and pregnancy.",
  'PCP': 'Primary care provider. Your main doctor for everyday health, checkups, and referrals to specialists.',
  'STI screening': 'A test for sexually transmitted infections. Infections passed through sexual contact.',
  'Pap smear': "A quick test where a doctor swabs the cervix to check for cell changes that could lead to cervical cancer.",
  'OB-GYN': "A doctor who cares for women's reproductive health and pregnancy.",
  'HRT': 'Hormone replacement therapy. Medicine that replaces hormones your body makes less of, often used for menopause symptoms.',
  'IUD': 'Intrauterine device. A small birth control device placed inside the uterus.',
  'BMI': "Body mass index. A number based on your height and weight, sometimes used as a rough health screening tool.",
  'TTC': 'Trying to conceive. Trying to get pregnant.',
  'telehealth': 'Seeing a doctor or nurse over video call or phone, instead of going to an office.',
  'probiotics': 'Live "good" bacteria, taken as a pill or food, that can help gut and vaginal health.',

  // Insurance terms (src/utils/healthIntake.js INSURANCE_TYPES, FSA_HSA_OPTIONS)
  'PPO': 'Preferred Provider Organization. An insurance plan that lets you see any doctor, no referral needed.',
  'HMO': "Health Maintenance Organization. An insurance plan where you pick a main doctor who refers you to specialists.",
  'ACA': "Affordable Care Act. The federal law behind the health insurance marketplace (healthcare.gov and state exchanges).",
  'Medicaid': 'Free or low-cost health insurance from the government, based on income.',
  'Medicare': 'Government health insurance, mainly for people 65 and older.',
  'Tricare': 'Health insurance for military members, veterans, and their families.',
  'FSA': 'Flexible Spending Account. Money set aside from your paycheck, before taxes, to pay for medical costs.',
  'HSA': 'Health Savings Account. A tax-free savings account for medical costs, usually paired with certain insurance plans.',

  // National orgs referenced in copy elsewhere on the site
  'ACOG': 'American College of Obstetricians and Gynecologists. The main U.S. medical group setting guidelines for women’s health care.',
  'FDA': 'U.S. Food and Drug Administration. The government agency that approves and monitors medicines and medical products.',
  'CDC': 'Centers for Disease Control and Prevention. The U.S. government agency that tracks disease and gives public health guidance.',
  'NIH': 'National Institutes of Health. The main U.S. government agency for medical research.',
  'PFAS': '"Forever chemicals". Human-made chemicals that don\'t break down easily and can build up in the body over time.',
  'MedWatch': "The FDA's own system for reporting a serious problem with a drug, device, or other medical product.",
  'MedlinePlus': "A free, government-run health information site (from the National Library of Medicine) written for patients, not doctors.",
  'PubMed': 'A free, government-run search tool for medical research studies.',
};

/** Case-insensitive fallback lookup, in case a caller's on-screen text doesn't exactly match a key's casing. */
export function lookupGlossaryTerm(term) {
  if (!term) return null;
  if (GLOSSARY[term]) return GLOSSARY[term];
  const lower = String(term).toLowerCase();
  const found = Object.keys(GLOSSARY).find((k) => k.toLowerCase() === lower);
  if (found) return GLOSSARY[found];
  // Central entries (product terms like "NSAID") answer too.
  return getGlossaryEntry(term)?.short || null;
}

const GLOSSARY_KEYS_BY_LENGTH = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);

/**
 * Finds the first glossary term that appears as a whole word/phrase inside a longer
 * label (e.g. "PCOS management (supplements, telehealth, apps)" contains "PCOS") and
 * returns its definition. Used for options/labels we can't rename because the exact
 * string is a matching key elsewhere in the app, this adds an explanation without
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

/* ------------------------------------------------------------------------
 * Central glossary entries (founder spec 21-24).
 *
 * One definition per term, used everywhere (website, app, product pages).
 * Plain English first, short enough for a small sheet; `long` is the
 * optional "Learn more". `hard: true` marks the genuinely difficult terms
 * that product copy may underline automatically (spec 24: medical terms,
 * ingredient classes, safety terms, unfamiliar mechanisms). Everything else
 * is only explained where a screen asks for it explicitly.
 *
 * reviewed_by / last_reviewed stay null until a clinician reviews the entry.
 * Definitions are general education, not medical advice.
 * ------------------------------------------------------------------------ */

const entry = (term, short, opts = {}) => ({
  term,
  short,
  long: opts.long || null,
  aliases: opts.aliases || [],
  related: opts.related || [],
  hard: opts.hard !== false,
  caseSensitive: Boolean(opts.caseSensitive),
  reviewed_by: null,
  last_reviewed: null,
});

export const GLOSSARY_ENTRIES = [
  // Ingredient classes and actives
  entry('Inositol', 'A sugar-like compound your body makes and also gets from food. Myo-inositol and D-chiro-inositol are the two forms most often studied for PCOS.', {
    long: 'Inositol helps cells respond to insulin. Studies of inositol supplements in PCOS suggest possible benefits for cycle regularity and some metabolic markers, but results vary and many studies are small. As a supplement, the dose and quality depend on the brand.',
    aliases: ['myo-inositol', 'd-chiro-inositol', 'd-chiro inositol', 'myo inositol'], related: ['PCOS', 'Clinically studied'],
  }),
  entry('NSAID', 'Non-steroidal anti-inflammatory drug. Pain relievers like ibuprofen and naproxen that calm inflammation and the chemicals behind period cramps.', {
    long: 'NSAIDs lower prostaglandins, the chemicals that make the uterus cramp. They are not right for everyone: people with stomach ulcers or bleeding, kidney disease, some heart conditions, late pregnancy, or who take blood thinners should check with a clinician first.',
    aliases: ['nsaids', 'non-steroidal anti-inflammatory'], related: ['Contraindication'],
  }),
  entry('Adaptogen', 'A herbal-medicine term for plants said to help the body handle stress, like ashwagandha, rhodiola or maca. It is not a medical category, and the evidence is different for each plant.', {
    aliases: ['adaptogens', 'adaptogenic'],
  }),
  entry('Probiotic strain', 'A specific type of beneficial bacteria. Different strains can have different effects, so two probiotics are not automatically the same.', {
    long: 'A strain name has three parts, like Lactobacillus rhamnosus GR-1: the group, the species and the exact strain. Research on one strain does not carry over to another, even in the same species.',
    aliases: ['probiotic strains', 'strain-specific'], related: ['Lactobacillus', 'CFU'],
  }),
  entry('Phytoestrogen', 'A plant compound that can act a little like the hormone estrogen. Soy isoflavones and red clover are examples.', {
    long: 'Phytoestrogens are much weaker than the estrogen your body makes, and their effects vary between people. If you have a hormone-sensitive condition, ask a clinician before taking a concentrated phytoestrogen supplement.',
    aliases: ['phytoestrogens'], related: ['Isoflavones'],
  }),
  entry('Isoflavones', 'Plant compounds found in soy and red clover. They are a type of phytoestrogen.', { aliases: ['soy isoflavones', 'isoflavone'], related: ['Phytoestrogen'] }),
  entry('Hyaluronic acid', 'A substance that holds a lot of water. In vaginal moisturizers it helps keep tissue hydrated.', { aliases: ['sodium hyaluronate'] }),
  entry('Polycarbophil', 'A gel-like ingredient that sticks to the vaginal wall and holds water there, so moisture lasts longer than with a lubricant.', { aliases: ['bioadhesive'] }),
  entry('Boric acid', 'A mild acid used in vaginal suppositories, sometimes for repeat yeast infections or BV. It is poisonous if swallowed and is not for use in pregnancy.', {
    long: 'Boric acid suppositories go in the vagina only. Keep them away from children and pets. Ask a clinician before using them, especially for symptoms that keep coming back, since those can need a different treatment.',
    related: ['Suppository', 'BV'],
  }),
  entry('D-mannose', 'A simple sugar taken as a supplement for urinary tract health. Research on whether it stops repeat UTIs is mixed.', { related: ['UTI'] }),
  entry('PACs', 'Proanthocyanidins. Plant compounds in cranberries that are studied for whether they stop some bacteria from sticking to the bladder wall.', { aliases: ['proanthocyanidins', 'proanthocyanidin'], caseSensitive: false }),
  entry('Lactobacillus', 'A group of bacteria that are common in a healthy vagina and in some foods and probiotics.', { aliases: ['lactobacilli'], related: ['Probiotic strain', 'Microbiome'] }),
  entry('CFU', 'Colony-forming units. A count of the live bacteria in a probiotic. A bigger number is not automatically better.', { caseSensitive: true, related: ['Probiotic strain'] }),
  entry('Black cohosh', 'A plant root sold for hot flashes and other menopause symptoms. Research results are mixed, and rare liver problems have been reported.'),
  entry('Chasteberry', 'Also called vitex. A plant berry sold for PMS and cycle support. It may affect hormones, so ask a clinician first if you are pregnant, trying to conceive, or use hormonal birth control or fertility medicine.', { aliases: ['vitex', 'vitex agnus-castus', 'chaste tree'] }),
  entry('Methylfolate', 'An active form of folate (vitamin B9) that the body can use directly.', { aliases: ['l-methylfolate', '5-mthf'] }),
  entry('Phenazopyridine', 'A medicine that numbs urinary pain and burning. It does not treat the infection itself, and it turns urine orange.', { related: ['Methemoglobinemia', 'UTI'] }),
  entry('Methemoglobinemia', 'A rare blood problem where the blood carries less oxygen. It is a known rare side effect of some medicines, including phenazopyridine.'),
  entry('Bioidentical', 'Hormones made to have the same chemical structure as the ones your body makes. Bioidentical does not automatically mean safer or more natural.', { aliases: ['bioidentical hormones'] }),
  entry('Prebiotic', 'Fiber or other food for the good bacteria already living in your gut.', { aliases: ['prebiotics'], related: ['Microbiome'] }),
  entry('Microbiome', 'The community of bacteria and other microbes living in one part of the body, like the gut or the vagina.', { aliases: ['vaginal microbiome', 'gut microbiome'] }),

  // Body and conditions
  entry('Endometrium', 'The lining of the uterus. It thickens each cycle and sheds as your period.', { aliases: ['endometrial lining', 'uterine lining'] }),
  entry('Vulvovaginal', 'About the vulva (the outside genital area) and the vagina (the inside canal) together.'),
  entry('Vulvar', 'About the vulva, the outside genital area including the labia.', { aliases: ['vulva'] }),
  entry('Perineum', 'The skin between the vaginal opening and the anus.', { aliases: ['perineal'] }),
  entry('Pelvic floor', 'The group of muscles at the base of your pelvis that hold up the bladder, uterus and bowel.', { aliases: ['pelvic floor muscles'] }),
  entry('Kegel', 'A squeeze-and-release exercise for the pelvic floor muscles.', { aliases: ['kegels', 'kegel exercises'], related: ['Pelvic floor'] }),
  entry('Luteal phase', 'The part of your cycle after ovulation and before your period, usually about two weeks.'),
  entry('Vasomotor symptoms', 'Hot flashes and night sweats.', { aliases: ['vasomotor'] }),
  entry('Dyspareunia', 'Pain during or after sex.'),
  entry('Dysmenorrhea', 'The medical word for painful periods.'),
  entry('GSM', 'Genitourinary syndrome of menopause. Dryness, irritation and urinary symptoms caused by lower estrogen after menopause. Also called vaginal atrophy.', { aliases: ['genitourinary syndrome of menopause', 'vaginal atrophy'], caseSensitive: false }),
  entry('Toxic shock syndrome', 'TSS. A rare but serious illness caused by bacterial toxins, linked to tampons and other internal period products left in too long.', {
    long: 'Sudden high fever, a sunburn-like rash, vomiting, diarrhea, dizziness or fainting during or right after your period need urgent medical care. Remove the product and say you have been using it.',
    aliases: ['TSS'],
  }),
  entry('Contact dermatitis', 'An itchy, red skin rash from something touching the skin, like a fragrance, dye or material.', { aliases: ['dermatitis'] }),

  // Methods and mechanisms
  entry('Transdermal', 'Absorbed through the skin into the body, like a patch.'),
  entry('Suppository', 'A small solid dose you insert, here into the vagina, that melts at body temperature.', { aliases: ['suppositories', 'vaginal suppository'] }),
  entry('Myofascial release', 'Steady pressure, by hand or with a tool, to relax tight muscles and the tissue around them.', { aliases: ['myofascial'] }),
  entry('Biofeedback', 'A device or app that shows you what your muscles are doing, so you can learn to control them.'),

  // Safety, regulation and evidence words
  entry('Contraindication', 'A reason a product or treatment may not be safe or appropriate for someone.', { aliases: ['contraindications', 'contraindicated'] }),
  entry('Clinically studied', 'The product or one of its ingredients has been tested in people. It does not mean it was proven to work: the study may be small, short, or about the ingredient rather than this exact product.', { aliases: ['clinically tested', 'clinically validated'] }),
  entry('FDA-cleared', 'The FDA reviewed this device and agreed it is similar enough to one already sold legally. Cleared is not the same as FDA-approved.', { aliases: ['fda cleared', '510(k) cleared'], related: ['510(k)', 'FDA-registered'] }),
  entry('FDA-registered', 'The company has listed its facility or device with the FDA. Registration alone does not mean the FDA reviewed or tested the product.', { aliases: ['fda registered'], related: ['FDA-cleared'] }),
  entry('510(k)', 'The FDA review path for many medical devices, based on showing a device is similar to one already sold legally.', { related: ['FDA-cleared'] }),
  entry('pH', 'A scale for how acidic something is. A healthy vagina is usually mildly acidic, around 3.8 to 4.5.', { caseSensitive: true, related: ['pH-balanced'] }),
  entry('pH-balanced', 'Made to roughly match the natural acidity of skin or the vagina. It is a marketing term with no set standard.', { aliases: ['ph balanced'], related: ['pH'] }),
  entry('Hypoallergenic', 'Made to be less likely to cause an allergic reaction. There is no legal standard for the word, so it is not a guarantee.'),
  entry('BPA', 'Bisphenol A. A chemical used in some hard plastics. Many personal-care and baby products are now made BPA-free.', { caseSensitive: true, aliases: ['BPA-free'] }),
  entry('Placebo', 'A dummy treatment with no active ingredient, used in studies to see whether the real thing does better.'),
  entry('Randomized controlled trial', 'A study where people are randomly given the real treatment or a comparison. It is one of the more reliable kinds of study.', { aliases: ['randomized', 'RCT', 'randomised controlled trial'] }),
  entry('Meta-analysis', 'A study that pools the results of many earlier studies to look for an overall answer.', { aliases: ['meta-analyses'] }),
  entry('In vitro', 'Done in a lab dish or test tube, not in people. Results may not carry over to the body.', { aliases: ['in-vitro'] }),
  // Product page audit, Oct 21: words the product pages used without explaining them.
  entry('Systematic review', 'A study that gathers the good studies on one question and weighs them together.', { aliases: ['systematic reviews'] }),
  entry('Double-blind', 'Neither the people in a study nor the researchers know who got the real treatment, so expectations can’t sway the result.', { aliases: ['double blind'] }),
  entry('TSST-1', 'Toxic shock syndrome toxin 1. A toxin some Staphylococcus aureus bacteria make. It causes most cases of toxic shock syndrome linked to tampons.', { caseSensitive: true, related: ['Toxic shock syndrome'] }),
  entry('SPF', 'Sun protection factor. How well a sunscreen blocks the UVB rays that cause sunburn, when you apply the full amount it was tested with.', { caseSensitive: true }),
  entry('Broad spectrum', 'A sunscreen that protects against both UVA and UVB rays.', { aliases: ['broad-spectrum'] }),
  entry('PA++++', 'A UVA protection rating used in Asia. More plus signs mean more UVA protection, and four is the highest. It is not an FDA rating.', { caseSensitive: true }),
  entry('CE-marked', 'Carries the CE mark, which says a product meets EU safety rules. It is a European mark, not an FDA review.', { aliases: ['CE marked', 'CE mark', 'CE-marking'] }),
  entry('HIPAA', 'The US law that protects health information held by doctors, hospitals and health insurers. It usually doesn’t cover apps you use on your own.', { caseSensitive: true }),
  entry('GDPR', 'The EU’s data protection law. It sets rules for how companies collect, use, share and delete personal data.', { caseSensitive: true }),
  entry('Photoallergic', 'An allergic skin reaction that only happens when sunlight hits skin after something was put on it.', { aliases: ['photoallergic reaction', 'photoallergic reactions'] }),
];

// The app's quiz glossary (src/mobile/data/glossary.js) and the site glossary
// above both become entries, so every surface reads one list. They are only
// explained where a screen asks (hard: false), never auto-underlined.
for (const [term, short] of [...Object.entries(GLOSSARY), ...Object.entries(APP_GLOSSARY)]) {
  const lower = term.toLowerCase();
  const exists = GLOSSARY_ENTRIES.some((e) => e.term.toLowerCase() === lower || e.aliases.some((a) => a.toLowerCase() === lower));
  if (!exists) GLOSSARY_ENTRIES.push(entry(term, short, { hard: false }));
}

const ENTRY_BY_KEY = new Map();
for (const e of GLOSSARY_ENTRIES) {
  for (const k of [e.term, ...e.aliases]) {
    const key = k.toLowerCase();
    if (!ENTRY_BY_KEY.has(key)) ENTRY_BY_KEY.set(key, e);
  }
}

/** Full entry for a term or alias (case-insensitive), or null. */
export function getGlossaryEntry(term) {
  if (!term) return null;
  return ENTRY_BY_KEY.get(String(term).trim().toLowerCase()) || null;
}

const escapeRe = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const HARD_KEYS = GLOSSARY_ENTRIES.filter((e) => e.hard).flatMap((e) => [e.term, ...e.aliases].map((k) => ({ k, e })))
  .sort((a, b) => b.k.length - a.k.length);
const HARD_RE_I = new RegExp(`(?<![A-Za-z0-9-])(${HARD_KEYS.filter((x) => !x.e.caseSensitive).map((x) => escapeRe(x.k)).join('|')})(?![A-Za-z0-9])`, 'gi');
const HARD_RE_CS = new RegExp(`(?<![A-Za-z0-9-])(${HARD_KEYS.filter((x) => x.e.caseSensitive).map((x) => escapeRe(x.k)).join('|')})(?![A-Za-z0-9])`, 'g');

/**
 * Hard glossary terms in a text: [{ index, length, text, entry }], in order,
 * without overlaps. Only `hard` entries are found (spec 24).
 */
export function findHardTerms(text) {
  const t = String(text || '');
  if (!t) return [];
  const hits = [];
  for (const re of [HARD_RE_I, HARD_RE_CS]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(t))) {
      const e = getGlossaryEntry(m[1]);
      if (e) hits.push({ index: m.index, length: m[1].length, text: m[1], entry: e });
    }
  }
  hits.sort((a, b) => a.index - b.index || b.length - a.length);
  const out = [];
  let end = -1;
  for (const h of hits) {
    if (h.index < end) continue;
    out.push(h);
    end = h.index + h.length;
  }
  return out;
}

/**
 * Decide which terms to underline on a page, so each term is underlined once
 * (its first appearance) and the page never gets more than `max` (spec 24).
 * @param {{ key: string, text: string }[]} blocks in reading order
 * @returns {Record<string, string[]>} block key -> entry terms to underline there
 */
export function planGlossaryTerms(blocks, max = 6) {
  const plan = {};
  const used = new Set();
  for (const { key, text } of blocks) {
    for (const hit of findHardTerms(text)) {
      if (used.size >= max) return plan;
      if (used.has(hit.entry.term)) continue;
      used.add(hit.entry.term);
      (plan[key] ||= []).push(hit.entry.term);
    }
  }
  return plan;
}

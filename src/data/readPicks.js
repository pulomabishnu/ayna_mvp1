import { inferTagsFromHealthProfile } from '../utils/healthDataProfile';

/* Library reads that have topic tags, kept small so Home can pick one for her
   without loading the whole Library. Titles and teasers are copied from
   ARTICLES in components/Articles.jsx; readPicks.test.js keeps them in sync. */
export const ARTICLE_TOPIC_TAGS = {
  'intimate-wash': ['vaginal-health', 'intimate-care'],
  'heavy-bleeding': ['heavy-flow', 'cramps'],
  'menopause-basics': ['menopause'],
  'uti-prevention': ['uti'],
  'yeast-infection-basics': ['vaginal-health'],
  'period-pain-when-to-seek-care': ['cramps', 'heavy-flow'],
  'pcos-basics': ['pcos', 'irregular'],
  'pelvic-floor-dysfunction': ['pelvic-floor', 'pelvic-health'],
  'endometriosis-basics': ['endometriosis', 'cramps'],
  'bacterial-vaginosis': ['vaginal-health', 'intimate-care'],
  'pmdd': ['cramps', 'irregular'],
  'fibroids': ['heavy-flow', 'cramps'],
  'iron-deficiency-anemia': ['heavy-flow'],
  'ovarian-cysts': ['cramps', 'pelvic-floor'],
  'hormonal-birth-control': ['irregular', 'cramps', 'pcos'],
  'genitourinary-syndrome-of-menopause': ['menopause', 'vaginal-health', 'uti'],
};

export const FRUSTRATION_TO_TAG = {
  'Heavy flow': 'heavy-flow',
  'Painful cramps': 'cramps',
  'Hormonal bloating': 'bloating',
  'Irregular cycles': 'irregular',
  'Recurrent UTIs': 'uti',
  'Menopause symptoms': 'menopause',
  'General discomfort': 'discomfort',
  'Pelvic pain': 'pelvic-floor',
  'Endometriosis': 'endometriosis',
  'PCOS symptoms': 'pcos',
  'Leaks & staining': 'leaks',
};

export const READ_SUMMARIES = {
  "intimate-wash": { title: "Intimate Washes", teaser: "Why the vagina is self-cleaning, when to use (or skip) cleansers, and what OB-GYNs recommend for external care." },
  "heavy-bleeding": { title: "Heavy Menstrual Bleeding", teaser: "What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated and treated." },
  "menopause-basics": { title: "Menopause & Perimenopause", teaser: "What perimenopause and menopause are, common symptoms, and how hormone therapy and lifestyle changes can help." },
  "uti-prevention": { title: "UTI Prevention", teaser: "Evidence-backed ways to reduce UTI risk and when to see a clinician for recurrent infections." },
  "yeast-infection-basics": { title: "Yeast Infection Basics", teaser: "What causes yeast infections, how to recognize them, when to treat at home vs. see a clinician, and how to prevent recurrence." },
  "period-pain-when-to-seek-care": { title: "Period Pain: When to Seek Care", teaser: "Normal cramps vs. signs that something else may be going on, and what treatments and workups clinicians may suggest." },
  "pcos-basics": { title: "PMOS: What It Is and How It's Managed", teaser: "Polyendocrine metabolic ovarian syndrome explained. Diagnosis, symptoms, and evidence-based treatment options including lifestyle and medication." },
  "pelvic-floor-dysfunction": { title: "Pelvic Floor Dysfunction", teaser: "What the pelvic floor does, common symptoms of dysfunction, and how pelvic floor physical therapy and at-home tools can help." },
  "endometriosis-basics": { title: "Endometriosis: Symptoms, Diagnosis, and Care", teaser: "What endometriosis is, how it's diagnosed, and treatment options. From pain management to surgery and fertility support." },
  "bacterial-vaginosis": { title: "Bacterial Vaginosis (BV)", teaser: "What causes BV, how it differs from a yeast infection, treatment options, and why it tends to recur." },
  "pmdd": { title: "PMDD: Premenstrual Dysphoric Disorder", teaser: "How PMDD differs from PMS, what causes it, and evidence-based treatments including SSRIs, hormonal options, and lifestyle support." },
  "fibroids": { title: "Uterine Fibroids", teaser: "What fibroids are, why they cause heavy bleeding and pain, and the range of treatment options from watchful waiting to surgery." },
  "iron-deficiency-anemia": { title: "Iron Deficiency & Anemia from Heavy Periods", teaser: "How heavy periods deplete iron, symptoms to watch for, and how to address deficiency through diet, supplements, and treating the root cause." },
  "ovarian-cysts": { title: "Ovarian Cysts", teaser: "Most ovarian cysts are harmless and resolve on their own. Here's how to tell when monitoring is enough and when to seek care." },
  "hormonal-birth-control": { title: "Hormonal Birth Control: Types, Benefits & Side Effects", teaser: "A plain-language guide to pills, patches, rings, shots, implants, and hormonal IUDs. How they work, what side effects to expect, and how to choose." },
  "genitourinary-syndrome-of-menopause": { title: "What Is Vaginal Atrophy / Genitourinary Syndrome of Menopause (GSM)?", teaser: "Why falling estrogen causes GSM, its most common symptoms, and the treatments that help, from moisturizers and lubricants to vaginal estrogen." },
};

// Words from her quiz answers (the web quiz stores labels, not tags).
const ANSWER_TAGS = [
  [/cramp|period pain|painful period/i, 'cramps'],
  [/heavy (period|flow|bleed)/i, 'heavy-flow'],
  [/irregular/i, 'irregular'],
  [/\buti\b|urinary tract/i, 'uti'],
  [/discharge|odou?r|itch|yeast|\bbv\b|vaginal/i, 'vaginal-health'],
  [/pelvic (pain|floor)/i, 'pelvic-floor'],
  [/menopaus/i, 'menopause'],
  [/pcos|pmos|polycystic|polyendocrine/i, 'pcos'],
  [/endometriosis/i, 'endometriosis'],
];

function answerText(quizResults) {
  if (!quizResults) return '';
  const i = quizResults.fullHealthIntake || quizResults;
  const parts = [i.supportSelections, i.diagnoses, i.diagnosisSelections, i.symptoms, i.primaryConcerns, i.conditions, quizResults.frustrations];
  return parts.flat().filter((x) => typeof x === 'string').join(' ');
}

/** The one Library read that best fits her answers, or null when nothing fits. */
export function pickReadForYou(quizResults, healthProfile = null) {
  const tags = new Set((quizResults?.frustrations || []).map((f) => FRUSTRATION_TO_TAG[f]).filter(Boolean));
  try { inferTagsFromHealthProfile(healthProfile).forEach((t) => tags.add(t)); } catch { /* no profile */ }
  const text = answerText(quizResults);
  ANSWER_TAGS.forEach(([re, t]) => { if (re.test(text)) tags.add(t); });
  if (!tags.size) return null;
  let best = null;
  for (const [id, topic] of Object.entries(ARTICLE_TOPIC_TAGS)) {
    const score = topic.filter((t) => tags.has(t)).length;
    if (score > 0 && READ_SUMMARIES[id] && (!best || score > best.score)) best = { id, score };
  }
  return best ? { id: best.id, ...READ_SUMMARIES[best.id] } : null;
}

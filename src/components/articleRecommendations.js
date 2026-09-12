import { inferTagsFromHealthProfile } from '../utils/healthDataProfile';

// Lightweight metadata used by the recommendations screen. Keep this list in
// the same order as the full article library; the heavy article bodies stay in
// ArticlesPage.jsx so they do not have to ship in the initial app bundle.
const ARTICLE_SUMMARIES = [
  {
    id: 'intimate-wash',
    title: 'Intimate Washes',
    teaser: 'Why the vagina is self-cleaning, when to use (or skip) cleansers, and what OB-GYNs recommend for external care.',
  },
  {
    id: 'heavy-bleeding',
    title: 'Heavy Menstrual Bleeding',
    teaser: 'What counts as heavy bleeding, possible causes, when to seek care, and how it’s evaluated and treated.',
  },
  {
    id: 'menopause-basics',
    title: 'Menopause & Perimenopause',
    teaser: 'What perimenopause and menopause are, common symptoms, and how hormone therapy and lifestyle changes can help.',
  },
  {
    id: 'uti-prevention',
    title: 'UTI Prevention',
    teaser: 'Evidence-backed ways to reduce UTI risk and when to see a clinician for recurrent infections.',
  },
  {
    id: 'yeast-infection-basics',
    title: 'Yeast Infection Basics',
    teaser: 'What causes yeast infections, how to recognize them, when to treat at home vs. see a clinician, and how to prevent recurrence.',
  },
  {
    id: 'period-pain-when-to-seek-care',
    title: 'Period Pain: When to Seek Care',
    teaser: 'Normal cramps vs. signs that something else may be going on, and what treatments and workups clinicians may suggest.',
  },
  {
    id: 'pcos-basics',
    title: "PCOS: What It Is and How It's Managed",
    teaser: 'Polycystic ovary syndrome explained. Diagnosis, symptoms, and evidence-based treatment options including lifestyle and medication.',
  },
  {
    id: 'pelvic-floor-dysfunction',
    title: 'Pelvic Floor Dysfunction',
    teaser: 'What the pelvic floor does, common symptoms of dysfunction, and how pelvic floor physical therapy and at-home tools can help.',
  },
  {
    id: 'endometriosis-basics',
    title: 'Endometriosis: Symptoms, Diagnosis, and Care',
    teaser: "What endometriosis is, how it's diagnosed, and treatment options. From pain management to surgery and fertility support.",
  },
  {
    id: 'bacterial-vaginosis',
    title: 'Bacterial Vaginosis (BV)',
    teaser: 'What causes BV, how it differs from a yeast infection, treatment options, and why it tends to recur.',
  },
  {
    id: 'pmdd',
    title: 'PMDD: Premenstrual Dysphoric Disorder',
    teaser: 'How PMDD differs from PMS, what causes it, and evidence-based treatments including SSRIs, hormonal options, and lifestyle support.',
  },
  {
    id: 'fibroids',
    title: 'Uterine Fibroids',
    teaser: 'What fibroids are, why they cause heavy bleeding and pain, and the range of treatment options from watchful waiting to surgery.',
  },
  {
    id: 'iron-deficiency-anemia',
    title: 'Iron Deficiency & Anemia from Heavy Periods',
    teaser: 'How heavy periods deplete iron, symptoms to watch for, and how to address deficiency through diet, supplements, and treating the root cause.',
  },
  {
    id: 'ovarian-cysts',
    title: 'Ovarian Cysts',
    teaser: "Most ovarian cysts are harmless and resolve on their own. Here's how to tell when monitoring is enough and when to seek care.",
  },
  {
    id: 'hormonal-birth-control',
    title: 'Hormonal Birth Control: Types, Benefits & Side Effects',
    teaser: 'A plain-language guide to pills, patches, rings, shots, implants, and hormonal IUDs. How they work, what side effects to expect, and how to choose.',
  },
];

const ARTICLE_FOCUS_TAGS = {
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
  pmdd: ['cramps', 'irregular'],
  fibroids: ['heavy-flow', 'cramps'],
  'iron-deficiency-anemia': ['heavy-flow'],
  'ovarian-cysts': ['cramps', 'pelvic-floor'],
  'hormonal-birth-control': ['irregular', 'cramps', 'pcos'],
};

const FRUSTRATION_TO_TAG = {
  'Heavy flow': 'heavy-flow',
  'Painful cramps': 'cramps',
  'Hormonal bloating': 'bloating',
  'Irregular cycles': 'irregular',
  'Recurrent UTIs': 'uti',
  'Menopause symptoms': 'menopause',
  'General discomfort': 'discomfort',
  'Pelvic pain': 'pelvic-floor',
  Endometriosis: 'endometriosis',
  'PCOS symptoms': 'pcos',
  'Leaks & staining': 'leaks',
};

export function getRecommendedArticles(quizAnswers, healthProfile = null) {
  const userTags = new Set([
    ...(quizAnswers?.frustrations || []).map((f) => FRUSTRATION_TO_TAG[f]).filter(Boolean),
    ...inferTagsFromHealthProfile(healthProfile),
  ]);

  const prefs = Array.isArray(quizAnswers?.preference)
    ? quizAnswers.preference
    : (quizAnswers?.preference ? [quizAnswers.preference] : []);
  if (prefs.includes('Privacy & data security')) userTags.add('privacy');

  if (userTags.size === 0) return ARTICLE_SUMMARIES.slice(0, 3);

  const scored = ARTICLE_SUMMARIES.map((article) => ({
    article,
    score: (ARTICLE_FOCUS_TAGS[article.id] || []).filter((tag) => userTags.has(tag)).length,
  }));
  const withScore = scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ article }) => article);
  const rest = scored.filter(({ score }) => score === 0).map(({ article }) => article);
  return [...withScore, ...rest].slice(0, 5);
}

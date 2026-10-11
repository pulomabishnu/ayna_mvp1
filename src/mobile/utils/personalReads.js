import { ARTICLE_TOPIC_TAGS } from '../../components/Articles.jsx';
import { ARTICLE_CATEGORIES } from '../data/articleRows.js';

// Topic tags from the mobile intake (fullHealthIntake) plus legacy quiz
// frustrations. The website's getArticlesByProfileRelevance only reads
// `frustrations`, which the mobile intake rarely fills — so reads looked
// generic. This reads the answers people actually give on mobile.
const RULES = [
  [/heavy|flood|clot|bleed/, ['heavy-flow']],
  [/cramp|period pain|painful period/, ['cramps']],
  [/menopaus|hot flash|night sweat/, ['menopause']],
  [/\buti\b|urinat|urinary|bladder/, ['uti']],
  [/vaginal|\bbv\b|yeast|discharge|odor|itch/, ['vaginal-health', 'intimate-care']],
  [/pcos|excess facial|polycystic/, ['pcos']],
  [/irregular|cycle-related|missed period/, ['irregular']],
  [/pelvic|pain .*during sex|incontinence|prolapse/, ['pelvic-floor', 'pelvic-health']],
  [/endometriosis|\bendo\b/, ['endometriosis']],
  [/fibroid/, ['heavy-flow']],
];
const FRUSTRATION_TAGS = {
  'Heavy flow': 'heavy-flow', 'Painful cramps': 'cramps', 'Irregular cycles': 'irregular', 'Recurrent UTIs': 'uti',
  'Menopause symptoms': 'menopause', 'Pelvic pain': 'pelvic-floor', Endometriosis: 'endometriosis', 'PCOS symptoms': 'pcos',
};

export function readTagsFor(quizAnswers) {
  const tags = new Set();
  (quizAnswers?.frustrations || []).forEach((f) => FRUSTRATION_TAGS[f] && tags.add(FRUSTRATION_TAGS[f]));
  const intake = quizAnswers?.fullHealthIntake || {};
  const text = [
    ...(intake.supportSelections || []), intake.supportOtherText,
    ...(intake.diagnosisSelections || []), intake.conditionOtherText,
    ...(intake.lifeStageSelections || []), intake.lifeStage,
  ].filter(Boolean).join(' | ').toLowerCase();
  RULES.forEach(([re, out]) => { if (re.test(text)) out.forEach((t) => tags.add(t)); });
  if (/heavy/i.test(intake.periodFlow || '')) tags.add('heavy-flow');
  if (/moderate|severe/i.test(intake.periodPain || '')) tags.add('cramps');
  return tags;
}

/** { forYou: articles that match the profile (best first), rows: remaining categories with no repeats } */
export function buildLibrary(articles, quizAnswers) {
  const byId = new Map(articles.map((a) => [a.id, a]));
  const tags = readTagsFor(quizAnswers);
  const forYou = tags.size ? articles
    .map((a) => ({ a, score: (ARTICLE_TOPIC_TAGS[a.id] || []).filter((t) => tags.has(t)).length }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a) : [];
  const seen = new Set(forYou.map((a) => a.id));
  const rows = ARTICLE_CATEGORIES.map((cat) => {
    const items = cat.articleIds.filter((id) => !seen.has(id) && byId.has(id)).map((id) => byId.get(id));
    items.forEach((a) => seen.add(a.id));
    return { ...cat, items };
  }).filter((row) => row.items.length > 0);
  const leftovers = articles.filter((a) => !seen.has(a.id));
  if (leftovers.length) rows.push({ id: 'more', label: 'More', items: leftovers });
  return { forYou, rows, hasProfile: tags.size > 0 };
}

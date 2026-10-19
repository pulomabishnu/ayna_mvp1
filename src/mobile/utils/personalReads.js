import { ARTICLE_TOPIC_TAGS } from '../../components/Articles.jsx';
import { ARTICLE_CATEGORIES } from '../data/articleRows.js';

// Topic tags from the mobile intake (fullHealthIntake) plus legacy quiz
// frustrations. The website's getArticlesByProfileRelevance only reads
// `frustrations`, which the mobile intake rarely fills, so reads looked
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

// The app's own quiz nests her answers under fullHealthIntake; older and
// restored sessions keep the same fields at the top level. Read both.
function intakeOf(quizAnswers) {
  if (!quizAnswers || typeof quizAnswers !== 'object') return {};
  const nested = quizAnswers.fullHealthIntake && typeof quizAnswers.fullHealthIntake === 'object' ? quizAnswers.fullHealthIntake : {};
  return { ...quizAnswers, ...nested };
}

const list = (v) => (Array.isArray(v) ? v : v ? [v] : []).filter((x) => typeof x === 'string');

/** True when she has any saved quiz answers at all (even ones no read is tagged for). */
export function hasQuizAnswers(quizAnswers) {
  const intake = intakeOf(quizAnswers);
  return Boolean(
    list(intake.supportSelections).length || list(intake.lifeStageSelections).length || list(intake.lifeStage).length
    || list(quizAnswers?.frustrations).length || list(intake.primaryConcerns).length || (intake.age != null && intake.age !== ''),
  );
}

// Reads written for one life stage. A read is moved to the end (never
// hidden) only when her answers clearly place her somewhere else: e.g. the
// menopause read for a 24-year-old who picked regular periods.
const STAGE_READS = {
  'menopause-basics': { stage: /menopaus/i, need: /menopaus|hot flash|night sweat/i, minAge: 40 },
  'postpartum-stretch-marks': { stage: /pregnan|postpartum/i, need: /pregnan|postpartum|stretch mark/i },
};

/** false when the read is clearly for a different life stage than hers; true otherwise. */
export function readFitsStage(article, quizAnswers) {
  const rule = STAGE_READS[article?.id];
  if (!rule) return true;
  const intake = intakeOf(quizAnswers);
  const stages = [...list(intake.lifeStageSelections), ...list(intake.lifeStage)].filter((st) => !/not sure|none of these|prefer not/i.test(st));
  const needs = [...list(intake.supportSelections), ...list(intake.primaryConcerns), ...list(quizAnswers?.frustrations), intake.supportOtherText].filter(Boolean).join(' | ');
  if (stages.some((st) => rule.stage.test(st)) || rule.need.test(needs)) return true;
  const age = Number(intake.age);
  if (rule.minAge && intake.age != null && intake.age !== '' && Number.isFinite(age)) return age >= rule.minAge;
  return stages.length === 0;
}

/**
 * Every read, best first for her: reads matching her answers, then the
 * rest in library order, with reads for a different life stage last.
 * Without answers this is the library order.
 */
export function rankReadsForProfile(articles, quizAnswers) {
  const tags = readTagsFor(quizAnswers);
  const scored = articles.map((a, i) => ({ a, i, fits: readFitsStage(a, quizAnswers), score: (ARTICLE_TOPIC_TAGS[a.id] || []).filter((t) => tags.has(t)).length }));
  return scored.sort((x, y) => (Number(y.fits) - Number(x.fits)) || (y.score - x.score) || (x.i - y.i)).map((x) => x.a);
}

export function readTagsFor(quizAnswers) {
  const tags = new Set();
  (quizAnswers?.frustrations || []).forEach((f) => FRUSTRATION_TAGS[f] && tags.add(FRUSTRATION_TAGS[f]));
  const intake = intakeOf(quizAnswers);
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
    .filter((x) => x.score > 0 && readFitsStage(x.a, quizAnswers))
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
  return { forYou, rows, hasProfile: tags.size > 0, hasAnswers: hasQuizAnswers(quizAnswers) };
}

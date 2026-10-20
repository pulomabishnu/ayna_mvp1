import { useCallback, useMemo, useState } from 'react';
import { COMMUNITY_TOPICS, isKnownTopic } from '../../utils/community/topics.js';
import { getSelectedNeeds, getMatchCareFlags } from '../../data/products.js';

// Followed Community topics ("pods"). Stored on this device only: there is
// no existing Supabase column for community preferences, and adding one
// needs a schema change. Keyed per account so two people on one phone keep
// their own lists.
const STORAGE_KEY = 'ayna_community_topics_v1';

// Engine need id prefix (or exact id) -> Community topic key.
const NEED_TOPICS = [
  ['condition_support.pcos', 'pcos'],
  ['condition_support.endometriosis', 'endometriosis'],
  ['condition_support.adenomyosis', 'endometriosis'],
  ['condition_support.fibroids', 'periods'],
  ['hormonal.', 'hormones'],
  ['cycle.pms', 'hormones'],
  ['cycle.breast_tenderness', 'hormones'],
  ['bloating.cycle_related', 'hormones'],
  ['cycle.', 'cycle-tracking'],
  ['skin.', 'acne'],
  ['hair.', 'hair'],
  ['fitness.', 'fitness'],
  ['fertility.', 'fertility'],
  ['pregnancy.', 'pregnancy'],
  ['postpartum.', 'postpartum'],
  ['pain.postpartum', 'postpartum'],
  ['vasomotor.', 'menopause'],
  ['menopause.', 'menopause'],
  ['bone.', 'bone-health'],
  ['mood.', 'mental-health'],
  ['cognition.', 'mental-health'],
  ['energy.', 'sleep'],
  ['sleep.', 'sleep'],
  ['pain.menstrual_cramp', 'cramps'],
  ['pain.pelvic', 'pelvic-floor'],
  ['pain.sexual', 'sexual-health'],
  ['period.', 'periods'],
  ['vaginal.', 'vaginal-health'],
  ['urinary.incontinence', 'pelvic-floor'],
  ['urinary.', 'uti'],
  ['sexual.contraception', 'contraception'],
  ['sexual.', 'sexual-health'],
];

const LIFE_STAGE_TOPICS = [
  [/perimenopaus/i, 'perimenopause'],
  [/(^|[^i])menopaus|postmenopaus|hot flash/i, 'menopause'],
  [/postpartum|after birth|breastfeed/i, 'postpartum'],
  [/pregnan/i, 'pregnancy'],
  [/trying to conceive|\bttc\b|fertility|get pregnant/i, 'fertility'],
  [/regular periods|i have periods|period/i, 'periods'],
];

function topicForNeed(id) {
  const exact = NEED_TOPICS.find(([key]) => key === id);
  if (exact) return exact[1];
  const prefix = NEED_TOPICS.find(([key]) => key.endsWith('.') && id.startsWith(key));
  return prefix ? prefix[1] : null;
}

/** Topics to follow by default from her quiz: her needs, then her life stage. */
export function defaultTopicsFromQuiz(quizAnswers) {
  if (!quizAnswers || typeof quizAnswers !== 'object') return [];
  const out = [];
  const add = (key) => { if (key && isKnownTopic(key) && !out.includes(key)) out.push(key); };
  try {
    getSelectedNeeds(quizAnswers).forEach((need) => add(topicForNeed(String(need.id || ''))));
  } catch { /* incomplete profile: fall through to life stage */ }
  try {
    const flags = getMatchCareFlags(quizAnswers);
    if (flags?.pregnant) add('pregnancy');
    if (flags?.ttc) add('fertility');
  } catch { /* same */ }
  const intake = quizAnswers.fullHealthIntake || {};
  const stageText = [quizAnswers.lifeStageSelections, intake.lifeStageSelections, intake.lifeStage, quizAnswers.lifeStage]
    .flat().filter((v) => typeof v === 'string').join(' | ');
  LIFE_STAGE_TOPICS.forEach(([re, key]) => { if (re.test(stageText)) add(key); });
  return out.slice(0, 6);
}

function readStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch { return {}; }
}

function writeStore(store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* storage unavailable */ }
}

/**
 * [followed, toggle, { isDefault }]. Until she changes anything, follows
 * are derived from her quiz, so retaking the quiz updates them too.
 */
export function useFollowedTopics(ownerId, quizAnswers) {
  const owner = ownerId || 'guest';
  const [store, setStore] = useState(readStore);
  const saved = Array.isArray(store[owner]?.follows) ? store[owner].follows.filter(isKnownTopic) : null;
  const defaults = useMemo(() => defaultTopicsFromQuiz(quizAnswers), [quizAnswers]);
  const followed = saved ?? defaults;

  const setFollowed = useCallback((next) => {
    setStore((prev) => {
      const current = Array.isArray(prev[owner]?.follows) ? prev[owner].follows : followed;
      const list = typeof next === 'function' ? next(current) : next;
      const ordered = COMMUNITY_TOPICS.map((t) => t.key).filter((key) => list.includes(key));
      const updated = { ...prev, [owner]: { follows: ordered, updatedAt: Date.now() } };
      writeStore(updated);
      return updated;
    });
  }, [owner, followed]);

  const toggle = useCallback((key) => {
    setFollowed((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));
  }, [setFollowed]);

  return [followed, toggle, { isDefault: saved === null }];
}

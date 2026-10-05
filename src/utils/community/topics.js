/**
 * Community topics.
 *
 * Every topic maps onto the SAME tag vocabulary the match engine uses
 * (src/data/products.js — tagsForHealthLabel / normalizeProfileSignals), so a
 * viewer whose intake mentions PCOS lines up with posts tagged "PCOS" without
 * a second, separate interpretation of their profile.
 *
 * `cycle: true` marks topics that are only relevant while someone has periods;
 * the For You ranking pushes them down for people who told ayna they're
 * pregnant, postmenopausal or don't currently get periods.
 */
export const COMMUNITY_TOPICS = [
  { key: 'periods', label: 'Periods', tags: ['menstrual-collection', 'heavy-flow', 'leaks', 'leak-protection', 'liner'], cycle: true },
  { key: 'cramps', label: 'Cramps', tags: ['cramps', 'cramp-relief'], cycle: true },
  { key: 'pcos', label: 'PCOS', tags: ['pcos', 'pcos-management'] },
  { key: 'endometriosis', label: 'Endometriosis', tags: ['endometriosis'] },
  { key: 'hormones', label: 'Hormones', tags: ['hormone-balance', 'bloating', 'hormone-support'] },
  { key: 'cycle-tracking', label: 'Cycle tracking', tags: ['cycle-tracking', 'irregular'], cycle: true },
  { key: 'acne', label: 'Skin & acne', tags: ['skin', 'skin-hair'] },
  { key: 'hair', label: 'Hair', tags: ['hair'] },
  { key: 'fertility', label: 'Fertility', tags: ['fertility'] },
  { key: 'pregnancy', label: 'Pregnancy', tags: ['pregnancy'] },
  { key: 'postpartum', label: 'Postpartum', tags: ['postpartum'] },
  { key: 'menopause', label: 'Menopause', tags: ['menopause', 'perimenopause'] },
  { key: 'vaginal-health', label: 'Vaginal health', tags: ['vaginal-health'] },
  { key: 'uti', label: 'UTIs', tags: ['uti', 'uti-prevention', 'urinary'] },
  { key: 'sexual-health', label: 'Sexual health', tags: ['sexual-health'] },
  { key: 'contraception', label: 'Birth control', tags: ['contraception'] },
  { key: 'pelvic-floor', label: 'Pelvic floor', tags: ['pelvic-floor', 'bladder-leaks', 'bladder-leak-protection', 'incontinence'] },
  { key: 'mental-health', label: 'Mood & mental health', tags: ['mental-health'] },
  { key: 'sleep', label: 'Sleep & energy', tags: ['sleep', 'sleep-energy', 'energy', 'fatigue'] },
  { key: 'fitness', label: 'Fitness', tags: ['fitness-cycle', 'fitness'] },
  { key: 'bone-health', label: 'Bone health', tags: ['bone-health'] },
  { key: 'college', label: 'College life', tags: [] },
  { key: 'budget', label: 'On a budget', tags: ['cost'] },
];

const BY_KEY = new Map(COMMUNITY_TOPICS.map((t) => [t.key, t]));

export function topicLabel(key) {
  return BY_KEY.get(key)?.label || String(key || '').replace(/-/g, ' ');
}

export function isKnownTopic(key) {
  return BY_KEY.has(key);
}

/** Topics whose tags overlap a set of engine tags (a viewer's interests or a product's tags). */
export function topicsForTags(tags) {
  const set = tags instanceof Set ? tags : new Set(tags || []);
  return COMMUNITY_TOPICS.filter((t) => t.tags.some((tag) => set.has(tag))).map((t) => t.key);
}

export function isCycleTopic(key) {
  return Boolean(BY_KEY.get(key)?.cycle);
}

/** Suggested topics for a new post from the products the author tagged. */
export function suggestTopicsForProducts(products = []) {
  const tags = new Set();
  products.forEach((p) => (p?.tags || []).forEach((t) => tags.add(t)));
  return topicsForTags(tags).slice(0, 3);
}

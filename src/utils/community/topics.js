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

// ── Hashtags ───────────────────────────────────────────────────────────────
// A topic's hashtag is its key without hyphens (#cycletracking). Typed tags
// are matched against the key, the label ("#birthcontrol" → contraception) and
// a few everyday aliases, so people don't have to guess the exact spelling.
const squash = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const HASHTAG_ALIASES = {
  period: 'periods', cramp: 'cramps', endo: 'endometriosis', hormone: 'hormones', acne: 'acne', skin: 'acne',
  pregnant: 'pregnancy', ttc: 'fertility', ivf: 'fertility', perimenopause: 'menopause', peri: 'menopause',
  meno: 'menopause', uti: 'uti', bc: 'contraception', birthcontrol: 'contraception', pill: 'contraception',
  mentalhealth: 'mental-health', mood: 'mental-health', anxiety: 'mental-health', energy: 'sleep',
  pelvicfloor: 'pelvic-floor', bones: 'bone-health', gym: 'fitness', workout: 'fitness', student: 'college',
  cheap: 'budget', budgetfriendly: 'budget',
};

export function hashtagFor(key) {
  return `#${squash(key)}`;
}

/** Topic key for a typed hashtag (with or without '#'), or null. */
export function topicForHashtag(tag) {
  const t = squash(tag);
  if (!t) return null;
  for (const topic of COMMUNITY_TOPICS) {
    if (squash(topic.key) === t || squash(topic.label) === t) return topic.key;
  }
  return HASHTAG_ALIASES[t] && BY_KEY.has(HASHTAG_ALIASES[t]) ? HASHTAG_ALIASES[t] : null;
}

/** Suggestions while typing "#par…": prefix matches first, then contains. */
export function suggestHashtags(partial, limit = 6) {
  const p = squash(partial);
  const scored = [];
  for (const topic of COMMUNITY_TOPICS) {
    const k = squash(topic.key);
    const l = squash(topic.label);
    let score = 0;
    if (!p) score = 1;
    else if (k.startsWith(p) || l.startsWith(p)) score = 3;
    else if (k.includes(p) || l.includes(p)) score = 2;
    if (score) scored.push({ key: topic.key, label: topic.label, tag: hashtagFor(topic.key), score });
  }
  if (p) {
    for (const [alias, key] of Object.entries(HASHTAG_ALIASES)) {
      if (alias.startsWith(p) && !scored.some((s) => s.key === key) && BY_KEY.has(key)) {
        scored.push({ key, label: BY_KEY.get(key).label, tag: hashtagFor(key), score: 1 });
      }
    }
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** Known topic keys mentioned as #hashtags in a text. */
export function extractHashtagTopics(text) {
  const out = [];
  for (const m of String(text || '').matchAll(/(^|[^\w#])#([A-Za-z][\w-]{1,30})/g)) {
    const key = topicForHashtag(m[2]);
    if (key && !out.includes(key)) out.push(key);
  }
  return out;
}

/** Split text into plain strings and {tag, key} hashtag parts for rendering. */
export function splitHashtags(text) {
  const parts = [];
  const s = String(text || '');
  let last = 0;
  for (const m of s.matchAll(/(^|[^\w#])(#[A-Za-z][\w-]{1,30})/g)) {
    const start = m.index + m[1].length;
    if (start > last) parts.push(s.slice(last, start));
    parts.push({ tag: m[2], key: topicForHashtag(m[2]) });
    last = start + m[2].length;
  }
  if (last < s.length) parts.push(s.slice(last));
  return parts;
}

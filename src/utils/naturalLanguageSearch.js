/**
 * Natural-language friendly search for Discovery: long spoken sentences
 * should still surface relevant products (scored relevance vs. requiring every token to hit).
 */

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'as', 'at', 'by', 'for', 'from', 'in', 'into',
  'of', 'on', 'to', 'with', 'about', 'after', 'again', 'against', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once', 'well',
  'even', 'back', 'over', 'out', 'up', 'down', 'off',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose',
  'where', 'when', 'why', 'how', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'me',
  'him', 'us', 'them', 'im', 'ive', 'ill', 'youre', 'theyre', 'were', 'dont', "don't", 'doesnt',
  "doesn't", 'didnt', "didn't", 'wont', "won't", 'cant', "can't", 'isnt', "isn't",
  'best', 'good', 'top', 'great', 'really', 'actually', 'maybe', 'probably', 'please',
  'looking', 'need', 'needs', 'want', 'wants', 'wanna', 'help', 'find', 'getting', 'get', 'got',
  'give', 'show', 'shows', 'tell', 'tells', 'use', 'using', 'used', 'make', 'makes',
  'something', 'anything', 'everything', 'nothing', 'someone', 'anyone', 'everyone',
  'think', 'know', 'knew', 'like', 'mean', 'means', 'way', 'ways', 'thing', 'things', 'stuff',
  'right', 'maybe', 'sure', 'okay', 'ok', 'yes', 'yeah', 'no', 'nah',
]);

/** Flatten item fields used for matching */
export function buildSearchTextForItem(item, categoryLabels = {}) {
  const safetyStr = item.safety && typeof item.safety === 'object'
    ? [item.safety.fdaStatus, item.safety.materials, item.safety.recalls, item.safety.allergens].filter(Boolean).join(' ')
    : '';
  return [
    item.name,
    item.summary,
    item.tagline,
    item.doctorOpinion,
    item.communityReview,
    item.ingredients,
    item.effectiveness,
    safetyStr,
    (item.tags || []).join(' '),
    item.category,
    categoryLabels[item.category],
    (item.badges || []).join(' '),
    (item.healthFunctions || []).join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
}

function wordMatchesInHaystack(word, haystack) {
  if (!word || word.length < 2) return false;
  if (haystack.includes(word)) return true;
  if (word.endsWith('s') && word.length > 3 && haystack.includes(word.slice(0, -1))) return true;
  if (!word.endsWith('s') && haystack.includes(`${word}s`)) return true;
  return false;
}

/** Spoken language often differs from product copy — treat related words as a hit for the same term */
const TERM_ALIASES = {
  period: ['menstrual', 'menstruation', 'cycle', 'menses'],
  periods: ['menstrual', 'menstruation', 'cycle', 'menses'],
  menstrual: ['period', 'menstruation'],
  pregnant: ['pregnancy', 'prenatal', 'maternity'],
  pregnancy: ['pregnant', 'prenatal', 'maternity'],
  nursing: ['breastfeed', 'breastfeeding', 'lactation', 'nipple'],
  breastfeed: ['breastfeeding', 'nursing', 'lactation'],
  breastfeeding: ['nursing', 'lactation', 'breastfeed'],
  baby: ['postpartum', 'newborn', 'infant'],
  uti: ['urinary', 'bladder', 'infection'],
  pcos: ['polycystic', 'ovarian'],
  cramps: ['cramp', 'dysmenorrhea', 'painful'],
  cramp: ['cramps', 'dysmenorrhea'],
  organic: ['cotton', 'natural', 'chemical-free'],
  menopause: ['perimenopause', 'hot', 'flash', 'vasomotor'],
  hormone: ['hormonal', 'estrogen', 'progesterone'],
  hormones: ['hormonal', 'estrogen', 'progesterone'],
  nonhormonal: ['hormone-free', 'copper', 'barrier'],
  'hormone-free': ['non-hormonal', 'nonhormonal', 'copper'],
  pad: ['pads', 'liner', 'maxi'],
  pads: ['pad', 'liner', 'maxi'],
  tampon: ['tampons'],
  cup: ['menstrual'],
  underwear: ['period-underwear', 'panty', 'panties', 'briefs', 'absorbent', 'leak-proof', 'leakproof'],
  panty: ['panties', 'underwear', 'period-underwear', 'briefs'],
  panties: ['panty', 'underwear', 'period-underwear', 'briefs'],
  /** Underwear-shaped / minimal coverage — product copy rarely says "thong" */
  thong: ['thongs', 'bikini', 'g-string', 'underwear', 'liner', 'liners', 'discreet', 'narrow', 'gusset', 'invisible', 'mini', 'light', 'string'],
  thongs: ['thong', 'bikini', 'g-string', 'underwear', 'liner', 'liners', 'discreet', 'narrow', 'gusset', 'invisible', 'mini', 'light', 'string'],
};

function termMatchesWithVariants(term, haystack) {
  if (wordMatchesInHaystack(term, haystack)) return true;
  const aliases = TERM_ALIASES[term];
  if (aliases) {
    for (const a of aliases) {
      if (wordMatchesInHaystack(a, haystack)) return true;
    }
  }
  return false;
}

/**
 * Tokenizes query, drops stop words and punctuation, keeps meaningful terms.
 */
function meaningfulTerms(query) {
  const q = query.toLowerCase().trim().replace(/[^\w\s'-]/g, ' ');
  return q.split(/\s+/).map((w) => w.replace(/^'+|'+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w));
}

/**
 * Minimum term hits: long questions need a fraction of terms; single-word queries need that term;
 * two-word queries need at least one match (e.g. category + niche use case).
 */
function minHitsForMatch(termCount) {
  if (termCount <= 0) return 0;
  if (termCount === 1) return 1;
  /** Two-word questions (e.g. "pads thongs") often pair a category word with a rare use case — require one strong hit */
  if (termCount === 2) return 1;
  return Math.max(2, Math.ceil(termCount * 0.35));
}

/**
 * Score how well `query` matches product text. Higher is better.
 */
export function scoreQueryAgainstProduct(query, haystackLower) {
  const raw = query.toLowerCase().trim();
  if (!raw) return 0;

  const terms = meaningfulTerms(query);
  if (terms.length === 0) {
    return haystackLower.includes(raw) ? 3 : 0;
  }

  let hits = 0;
  for (const term of terms) {
    if (termMatchesWithVariants(term, haystackLower)) hits += 1;
  }

  const minH = minHitsForMatch(terms.length);
  if (hits < minH) {
    const collapsed = raw.replace(/\s+/g, ' ');
    if (collapsed.length >= 8 && haystackLower.includes(collapsed)) {
      return minH + 1;
    }
    return 0;
  }

  let score = hits;
  const collapsed = raw.replace(/\s+/g, ' ');
  if (collapsed.length >= 10 && haystackLower.includes(collapsed)) score += terms.length;

  for (let i = 0; i < terms.length - 1; i++) {
    const bigram = `${terms[i]} ${terms[i + 1]}`;
    if (haystackLower.includes(bigram)) score += 1.5;
  }

  return score;
}

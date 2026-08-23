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
    item.brand,
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

/**
 * Identity-only subset of buildSearchTextForItem: name/brand/category/tags/
 * healthFunctions/badges, deliberately excluding prose fields (summary,
 * doctorOpinion, communityReview, ingredients, effectiveness, safety text).
 *
 * WHY THIS EXISTS: a query like "vitamins" used to score a pregnancy skin oil
 * (whose doctorOpinion happens to mention "Vitamin E" in passing) identically
 * to an actual "Ritual Prenatal Vitamin" product — buildSearchTextForItem's
 * flattened haystack can't tell an incidental prose mention from a product's
 * actual identity. scoreQueryAgainstProduct uses this second, narrower
 * haystack to weight identity-field matches above prose-only ones.
 */
export function buildIdentityTextForItem(item, categoryLabels = {}) {
  return [
    item.name,
    item.brand,
    (item.tags || []).join(' '),
    item.category,
    categoryLabels[item.category],
    (item.badges || []).join(' '),
    (item.healthFunctions || []).join(' '),
  ].filter(Boolean).join(' ').toLowerCase();
}

function wordMatchesInHaystack(word, haystack) {
  if (!word) return false;
  // A single character (vitamin C/D/E/B/K, the "3" in "omega 3") can't use a
  // plain substring check — haystack.includes('c') matches almost any product
  // (it's inside "cup", "cream", "clinician"...), which would make the term
  // meaningless as a distinguishing signal. Require it to appear as its own
  // token instead.
  if (word.length === 1) {
    return new RegExp(`(^|[^a-z0-9])${word}([^a-z0-9]|$)`, 'i').test(haystack);
  }
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
  heating: ['heat', 'heated', 'thermal', 'warming', 'warm'],
  heat: ['heating', 'heated', 'thermal', 'warming'],
  warming: ['heat', 'heating', 'thermal', 'warm'],
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
  // Single-character tokens used to be dropped outright (w.length > 1), which
  // silently collapsed "vitamin c" into a bare "vitamin" search — the "c" was
  // never tokenized at all, so C/D/E/B/K-specific vitamin queries (and things
  // like "omega 3") couldn't distinguish themselves from the generic term.
  // Now kept, since wordMatchesInHaystack requires a real word-boundary match
  // for single characters rather than a substring check — "a"/"i" (the only
  // single letters that are themselves common noise words) are still caught
  // by STOP below.
  return q.split(/\s+/).map((w) => w.replace(/^'+|'+$/g, '')).filter((w) => w.length > 0 && !STOP.has(w));
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
 *
 * `identityHaystackLower` (optional, from buildIdentityTextForItem) lets a
 * term that hits in name/brand/category/tags/healthFunctions score above one
 * that only hits somewhere in prose (doctorOpinion, ingredients, etc). Without
 * it, hit-counting alone can't distinguish a product that genuinely IS what
 * the query asked for from one that just mentions the word in passing —
 * omitting this argument preserves the exact old (pre-identity-weighting)
 * scoring behavior, so existing callers/tests that only pass the full
 * haystack are unaffected.
 */
export function scoreQueryAgainstProduct(query, haystackLower, identityHaystackLower = '') {
  const raw = query.toLowerCase().trim();
  if (!raw) return 0;

  const terms = meaningfulTerms(query);
  if (terms.length === 0) {
    return haystackLower.includes(raw) ? 3 : 0;
  }

  let hits = 0;
  let identityHits = 0;
  for (const term of terms) {
    if (termMatchesWithVariants(term, haystackLower)) hits += 1;
    if (identityHaystackLower && termMatchesWithVariants(term, identityHaystackLower)) identityHits += 1;
  }

  const minH = minHitsForMatch(terms.length);
  if (hits < minH) {
    const collapsed = raw.replace(/\s+/g, ' ');
    if (collapsed.length >= 8 && haystackLower.includes(collapsed)) {
      return minH + 1;
    }
    return 0;
  }

  // Short queries (1-2 terms) are the highest-risk case for a weak, purely
  // incidental prose mention passing as a real "match": a 1-word query only
  // needs that one word to appear ANYWHERE in the flattened haystack
  // (name/summary/doctorOpinion/ingredients/safety text/etc. all mashed
  // together), and a 2-word query only needs ONE of the two ("vitamin c" and
  // "pads thongs" both use this same 1-of-2 threshold). Confirmed against the
  // real catalog: "vitamins" matched a lubricant, a UTI product, and a
  // maternity pillow (all mentioning "vitamin" once, in passing); "stress"
  // matched a Kegel exerciser and a breast pump; "iron" matched a heating
  // pad — none of these are what the product actually IS, they just contain
  // the word somewhere in several paragraphs of copy. Reject a match like
  // that unless it's backed by SOME identity-field signal (the product's own
  // name/brand/category/tags/healthFunctions really is about this term, not
  // just a passing prose mention) or, for 2-term queries, by genuine full
  // coverage (both terms present somewhere, even in prose — a much stronger
  // signal than either alone). Longer natural-language queries (3+ terms)
  // are deliberately left alone: minHitsForMatch already requires multiple
  // independent term hits there, a much weaker coincidence risk, and this
  // file's whole design intent is that a long spoken sentence can still
  // match on partial prose coverage without also needing a tag/category hit.
  // Only enforced when a caller actually supplied identity text — without it
  // there's no way to tell "genuinely no identity signal" apart from "this
  // caller doesn't distinguish identity from prose at all" (a few tests, and
  // any future caller, intentionally use the simpler 2-arg form and get the
  // older, more permissive behavior).
  if (identityHaystackLower) {
    if (terms.length === 1 && identityHits === 0) {
      return 0;
    }
    if (terms.length === 2 && identityHits === 0 && hits < terms.length) {
      return 0;
    }
  }

  let score = hits;
  // A term matching in an identity field means the product IS about that
  // term, not just mentioning it somewhere in a paragraph — weight it well
  // above a plain prose hit (which is worth 1 point via `hits` above).
  const IDENTITY_BONUS_PER_TERM = 2.5;
  score += identityHits * IDENTITY_BONUS_PER_TERM;

  const collapsed = raw.replace(/\s+/g, ' ');
  if (collapsed.length >= 10 && haystackLower.includes(collapsed)) score += terms.length;

  for (let i = 0; i < terms.length - 1; i++) {
    const bigram = `${terms[i]} ${terms[i + 1]}`;
    if (haystackLower.includes(bigram)) score += 1.5;
  }

  return score;
}

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

/** True when `w` appears in `haystack` as its own word, not as a run inside a longer one. */
function boundaryMatch(w, haystack) {
  const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(haystack);
}

function wordMatchesInHaystack(word, haystack) {
  if (!word) return false;
  // Every word length used to go through this word-boundary check ONLY for
  // single characters — the comment here explained exactly why ("c" inside
  // "cup"/"cream") but the same failure mode exists for any word length: a
  // plain haystack.includes(word) matches "hair" inside "chair" ("Emsella
  // Chair Treatment" topping a search for "hair", found live) exactly the
  // same way "c" matched inside "cup". word-boundary matching is required
  // at every length, not just one.
  if (boundaryMatch(word, haystack)) return true;
  if (word.endsWith('s') && word.length > 3 && boundaryMatch(word.slice(0, -1), haystack)) return true;
  if (!word.endsWith('s') && boundaryMatch(`${word}s`, haystack)) return true;
  return false;
}

/** Spoken language often differs from product copy — treat related words as a hit for the same term */
const TERM_ALIASES = {
  period: ['menstrual', 'menstruation', 'cycle', 'menses'],
  periods: ['menstrual', 'menstruation', 'cycle', 'menses'],
  menstrual: ['period', 'menstruation'],
  pregnant: ['pregnancy', 'prenatal', 'maternity'],
  pregnancy: ['pregnant', 'prenatal', 'maternity'],
  // "conceive"/"conceiving"/"TTC" (a very common fertility-community
  // abbreviation for "trying to conceive") had no alias entry at all, so a
  // query as plain as "conceive" — or the natural phrase "trying to
  // conceive" — scored 0 even though "fertility" alone matches real
  // products (Thorne Ubiquinol, Wholesome Story Inositol, Pomelo Care).
  fertility: ['fertile', 'ovulation', 'conceive', 'conceiving', 'ttc'],
  conceive: ['fertility', 'fertile', 'ovulation', 'conceiving', 'ttc'],
  conceiving: ['fertility', 'fertile', 'ovulation', 'conceive', 'ttc'],
  ttc: ['fertility', 'fertile', 'conceive', 'conceiving', 'ovulation'],
  nursing: ['breastfeed', 'breastfeeding', 'lactation', 'nipple'],
  breastfeed: ['breastfeeding', 'nursing', 'lactation'],
  breastfeeding: ['nursing', 'lactation', 'breastfeed'],
  baby: ['postpartum', 'newborn', 'infant'],
  uti: ['urinary', 'bladder', 'infection'],
  pcos: ['polycystic', 'ovarian'],
  /** Live bug: "sti" returned nothing even though Wisp/Planned Parenthood
   * Direct genuinely offer STI care — their summaries said "STI" but their
   * tags/healthFunctions (the identity fields) didn't, so the single-term
   * identity-hit gate below rejected the match as a passing prose mention.
   * The real fix is tagging those products (see supabase/seed) — this alias
   * is defense-in-depth so "std" also finds a product tagged only "sti"
   * and vice versa, without needing every spelling duplicated in every tag. */
  sti: ['std', 'stds', 'stis', 'sexually-transmitted', 'sexual-health'],
  std: ['sti', 'stds', 'stis', 'sexually-transmitted', 'sexual-health'],
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

/** Standard edit distance (insert/delete/substitute), iterative single-row DP. */
function levenshteinDistance(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const prevRow = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prevRow[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prevDiag = prevRow[0];
    prevRow[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const temp = prevRow[j];
      prevRow[j] = a[i - 1] === b[j - 1]
        ? prevDiag
        : 1 + Math.min(prevDiag, prevRow[j], prevRow[j - 1]);
      prevDiag = temp;
    }
  }
  return prevRow[b.length];
}

// For words this short, only a SAME-LENGTH edit (a substitution, e.g.
// "poize"->"poise") is trusted as a typo. Allowing a shorter/longer word
// within the same edit distance lets a single inserted/deleted letter turn
// one real word into a completely different real word — "hair" -> "chair"
// via one inserted "c" is exactly this failure mode, and is covered by this
// file's own regression test (naturalLanguageSearch.test.js). Longer words
// are safe to compare across a length difference too, since an accidental
// real-word collision gets far less likely as words get longer.
const FUZZY_SAME_LENGTH_MAX = 5;

/**
 * Typo tolerance: only reached when the exact word-boundary check (and its
 * alias list) already missed. Compares the query term against every word in
 * the haystack and accepts a close-enough edit distance — catches ordinary
 * misspellings like "concieve"/"conceive" or "endometriosis"/"endometreosis"
 * without needing every typo hardcoded as an alias.
 */
function fuzzyWordMatchesInHaystack(word, haystack) {
  if (!word || word.length < 4) return false;
  const maxDist = word.length <= 7 ? 1 : 2;
  const requireSameLength = word.length <= FUZZY_SAME_LENGTH_MAX;
  const haystackWords = haystack.split(/[^a-z0-9]+/i).filter(Boolean);
  for (const hw of haystackWords) {
    if (requireSameLength ? hw.length !== word.length : Math.abs(hw.length - word.length) > maxDist) continue;
    if (levenshteinDistance(word, hw) <= maxDist) return true;
  }
  return false;
}

const TERM_ALIAS_KEYS = Object.keys(TERM_ALIASES);

/**
 * A typo can land on a term whose CORRECT spelling has an alias list, but
 * the alias lookup is a plain dictionary keyed by exact spelling — "conceive"
 * has aliases, "concieve" (typo) does not. This finds the closest known
 * alias key to a misspelled term and returns that key's real aliases, so
 * "concieve" still resolves to conceive's aliases (fertility/ovulation/ttc)
 * even though the literal word "conceive" never appears in any product's
 * text (only those alias terms do).
 */
function fuzzyCanonicalAliases(term) {
  if (!term || term.length < 4) return null;
  const maxDist = term.length <= 7 ? 1 : 2;
  const requireSameLength = term.length <= FUZZY_SAME_LENGTH_MAX;
  for (const key of TERM_ALIAS_KEYS) {
    if (requireSameLength ? key.length !== term.length : Math.abs(key.length - term.length) > maxDist) continue;
    if (levenshteinDistance(term, key) <= maxDist) return TERM_ALIASES[key];
  }
  return null;
}

function termMatchesWithVariants(term, haystack) {
  if (wordMatchesInHaystack(term, haystack)) return true;
  const aliases = TERM_ALIASES[term];
  if (aliases) {
    for (const a of aliases) {
      if (wordMatchesInHaystack(a, haystack)) return true;
    }
  } else {
    const fuzzyAliases = fuzzyCanonicalAliases(term);
    if (fuzzyAliases) {
      for (const a of fuzzyAliases) {
        if (wordMatchesInHaystack(a, haystack)) return true;
      }
    }
  }
  if (fuzzyWordMatchesInHaystack(term, haystack)) return true;
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

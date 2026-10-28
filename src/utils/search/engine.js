/**
 * Shared search engine (one engine for every search box on the website and
 * in the app).
 *
 *   analyze(query)        -> per-word status (known / corrected / unknown),
 *                            a corrected query, "Did you mean", health needs,
 *                            categories and filters the words point at.
 *   scoreProduct(q, item) -> relevance (0 = not a match). Drop-in for the old
 *                            scoreQueryAgainstProduct(q, haystack, identity).
 *   searchArticles(q, articles), rankOptions(q, strings), suggest(q, ...)
 *
 * Everything runs client-side on a vocabulary built once (catalog names,
 * brands, categories, tags, ingredients, ontology needs, medications,
 * article titles, a hand-written misspelling list and generated variants).
 * Results are cached per query, so calling scoreProduct for every product on
 * every render costs one analysis plus a cheap per-product score.
 *
 * Safety: a symptom only maps to products for that symptom (ontology needs);
 * nothing here infers a diagnosis. Partnerships play no part in relevance.
 */
import { normalizeText, bareWord, tokenize, stemCandidates, damerauDistance, hasPhrase, escapeRegExp } from './text.js';
import { generateTypoVariants } from './variants.js';
import {
  MISSPELLINGS, ABBREVIATIONS, PHRASE_JOINS, TERM_NEEDS, NEED_SHORT_LABELS, CATEGORY_TERMS,
  QUERY_FILLER, COMMON_WORDS, KNOWN_BRANDS, POPULAR_SEARCHES, curatedCanonicalTerms,
} from '../../data/searchSynonyms.js';

const FILLER = new Set(QUERY_FILLER);

/** Weights: how strongly a vocabulary word is preferred as a correction target. */
export const WEIGHT = { CURATED: 5, ONTOLOGY: 4, BRAND: 4, IDENTITY: 3, ARTICLE: 2, KNOWN_BRAND: 2, COMMON: 1 };

const PRICE_MAX_RE = /(?:under|below|less than|lower than|cheaper than|up to|max(?:imum)?|at most|no more than|<|<=|within)\s*\$?\s*(\d+(?:\.\d+)?)\s*(?:dollars|bucks|usd|\$)?/;
const PRICE_MAX_TAIL_RE = /\$\s*(\d+(?:\.\d+)?)\s*(?:or less|or under|and under|and below|max)/;
const PRICE_MIN_RE = /(?:over|above|more than|at least|min(?:imum)?|>|>=)\s*\$?\s*(\d+(?:\.\d+)?)/;
const FILTER_RULES = [
  ['budget', /\b(cheap|cheaper|cheapest|budget|affordable|inexpensive|low[- ]cost|bargain|less expensive)\b/],
  ['fragranceFree', /\b(fragrance[- ]?free|unscented|scent[- ]?free|no (?:fragrance|scent|perfume)|without (?:fragrance|scent|perfume)|perfume[- ]free)\b/],
  ['pregnancy', /\b(pregnancy[- ]?(?:safe|friendly|ok)|safe (?:for|during|in|while|when) (?:pregnancy|pregnant|expecting)|safe while pregnant|pregnant[- ]safe|ok (?:for|during) pregnancy)\b/],
  ['breastfeeding', /\b(breastfeeding[- ]?(?:safe|friendly)|safe (?:for|during|while) (?:breastfeeding|nursing))\b/],
  ['organic', /\borganic\b/],
  ['vegan', /\b(vegan|plant[- ]based)\b/],
  ['reusable', /\b(reusable|re-usable|washable)\b/],
  ['crueltyFree', /\bcruelty[- ]?free\b/],
  ['fsaHsa', /\b(hsa|fsa)\b/],
  ['latexFree', /\blatex[- ]?free\b/],
  ['nonHormonal', /\b(non[- ]?hormonal|hormone[- ]?free|no hormones|without hormones)\b/],
];
// "Not a pill", "isn't a pill", "no pills", "pill-free", "non-pill": a format she
// wants left out (UX 26, TD 40). Ids are the ontology FORMATS the product
// profile carries (profile.formats).
const NEG_FORMAT_WORDS = [
  ['pill_capsule', 'pills?|tablets?|capsules?|caplets?|softgels?|gel ?caps?'],
  ['gummy', 'gumm(?:y|ies)'],
  ['powder', 'powders?'],
  ['drink_tea', 'teas?|drinks?'],
  ['patch', 'patch(?:es)?'],
  ['topical', 'creams?|lotions?|gels?'],
  ['suppository', 'suppositor(?:y|ies)'],
  ['device', 'devices?|gadgets?'],
  ['app_service', 'apps?'],
];
const NEGATOR = "(?:not|no|non|without|isn'?t|is not|aren'?t|are not|nothing|never|avoid(?:ing)?|skip(?:ping)?|other than|instead of)";
const NEG_FORMAT_RES = NEG_FORMAT_WORDS.map(([id, words]) => [id,
  new RegExp(`\\b${NEGATOR}[\\s-]+(?:(?:a|an|any|the|more|taking|swallowing|another)\\s+)?(?:${words})\\b|\\b(?:${words})[\\s-]?free\\b`, 'g')]);
/** Formats the query asks to leave out, and the words that said so. */
export function negatedFormats(text) {
  const t = normalizeText(text);
  const ids = [];
  const words = new Set();
  for (const [id, re] of NEG_FORMAT_RES) {
    re.lastIndex = 0;
    const hits = t.match(re);
    if (!hits) continue;
    ids.push(id);
    for (const h of hits) for (const w of h.split(/[^a-z']+/)) if (w) { words.add(w); words.add(w.replace(/'/g, '')); }
  }
  return { ids, words };
}
// Words that only express a filter; dropped from the text part of the query.
const FILTER_WORDS = new Set(['cheap', 'cheaper', 'cheapest', 'budget', 'affordable', 'inexpensive', 'bargain', 'expensive', 'fragrance', 'unscented', 'scent', 'scented', 'perfume', 'free', 'safe', 'friendly', 'reusable', 'washable', 'vegan', 'organic', 'cruelty', 'hsa', 'fsa', 'eligible', 'latex', 'non', 'nonhormonal', 'hormone', 'hormonal', 'hormones', 'under', 'below', 'over', 'above', 'dollars', 'bucks', 'usd', 'max', 'less', 'more', 'than', 'cost', 'low']);
// Filter words that are ALSO the thing being searched when nothing else is.
const KEEP_IF_ALONE = new Set(['organic', 'vegan', 'reusable', 'hormone', 'hormonal', 'hormones']);

const LIFE_STAGE_NEEDS = {
  pregnant: ['pregnancy.prenatal', 'pregnancy.safe_discovery'],
  postpartum: ['postpartum.recovery'],
  breastfeeding: ['postpartum.lactation'],
  perimenopause: ['menopause.body_changes', 'vasomotor.hot_flashes'],
  menopause: ['menopause.body_changes', 'vasomotor.hot_flashes'],
  postmenopause: ['menopause.body_changes'],
  ttc: ['fertility.ttc'],
};

function pushUnique(arr, v) { if (v && !arr.includes(v)) arr.push(v); }

/**
 * @param {{ ontology?: { rules?: object[], conditionNeeds?: object, needLabels?: object } }} [config]
 */
export function createSearchEngine(config = {}) {
  const known = new Set();
  const targets = new Map(); // word -> weight
  const misspell = new Map(); // variant -> canonical (may contain spaces)
  const phrases = new Map(); // multi-word variant -> canonical
  let byLen = null;
  let sortedKnown = null;
  let variantsBuilt = false;
  let generatedCount = 0;
  const analysisCache = new Map();
  const resolveCache = new Map();
  const productCache = new WeakMap();
  const registeredArticleSets = new WeakSet();
  const suggestIndex = []; // { kind, label, query, norm, id?, weight }
  const ontologyRules = (config.ontology?.rules || []).filter((r) => ['need', 'condition', 'life_stage'].includes(r.kind) && !r.contextual_only && r.confidence >= 0.7);
  const conditionNeeds = config.ontology?.conditionNeeds || {};
  let productProfileFn = config.productProfile || null;
  let identityTextFn = config.identityText || null;
  let fullTextFn = config.fullText || null;
  let baseScoreFn = config.baseScore || null;
  let priceFn = config.price || null;

  const dirty = () => { byLen = null; sortedKnown = null; analysisCache.clear(); resolveCache.clear(); };

  function addWord(word, weight = 0) {
    const w = bareWord(word);
    if (!w || w.length < 2) return;
    known.add(w);
    if (weight > 0 && /[a-z]/.test(w)) {
      if ((targets.get(w) || 0) < weight) targets.set(w, weight);
    }
  }

  /** Add every word in `text` to the vocabulary; weight > 0 also makes them correction targets. */
  function addText(text, weight = 0) {
    if (!text) return;
    for (const t of tokenize(String(text))) {
      addWord(t.word, weight);
      // hyphenated / slashed parts count on their own too ("ob-gyn", "myo-inositol")
      if (/[-/.]/.test(t.word)) t.word.split(/[-/.]+/).forEach((p) => addWord(p, weight));
    }
    dirty();
  }

  function addSuggestion(kind, label, query = label, extra = {}) {
    if (!label) return;
    suggestIndex.push({ kind, label, query, norm: normalizeText(label).replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(), ...extra });
  }

  // ── Seed: curated data ────────────────────────────────────────────────────
  for (const w of COMMON_WORDS) addWord(w, WEIGHT.COMMON);
  for (const w of QUERY_FILLER) addWord(w, WEIGHT.COMMON);
  for (const b of KNOWN_BRANDS) addText(b, WEIGHT.KNOWN_BRAND);
  for (const w of curatedCanonicalTerms()) addWord(w, WEIGHT.CURATED);
  for (const [canonical, variants] of Object.entries(MISSPELLINGS)) {
    for (const v of variants) {
      const n = normalizeText(v).trim();
      if (n.includes(' ')) phrases.set(n, canonical);
      else misspell.set(bareWord(n), canonical);
    }
  }
  for (const [variant, canonical] of Object.entries(PHRASE_JOINS)) {
    const n = normalizeText(variant).trim();
    if (n.includes(' ') || n.includes('-')) phrases.set(n.replace(/-/g, ' '), canonical);
    else misspell.set(bareWord(n), canonical);
  }
  for (const [id, label] of Object.entries(NEED_SHORT_LABELS)) addSuggestion('need', `Products for ${label}`, label, { needId: id, weight: 3 });

  /** Generated variants are built lazily, once the whole vocabulary is known. */
  function buildVariants() {
    if (variantsBuilt) return;
    variantsBuilt = true;
    const important = new Set([...Object.keys(MISSPELLINGS), ...curatedCanonicalTerms()]);
    for (const [w, weight] of targets) if (weight >= WEIGHT.ONTOLOGY && w.length >= 6) important.add(w);
    for (const term of important) {
      const canonical = bareWord(term);
      if (canonical.length < 5) continue;
      for (const v of generateTypoVariants(canonical)) {
        if (known.has(v) || misspell.has(v) || targets.has(v)) continue;
        misspell.set(v, term);
        generatedCount += 1;
      }
    }
  }

  function lengthIndex() {
    if (byLen) return byLen;
    byLen = new Map();
    for (const [w, weight] of targets) {
      if (!byLen.has(w.length)) byLen.set(w.length, []);
      byLen.get(w.length).push([w, weight]);
    }
    return byLen;
  }

  function knownPrefix(prefix) {
    if (!sortedKnown) sortedKnown = [...new Set([...known, ...targets.keys()])].sort();
    let lo = 0;
    let hi = sortedKnown.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sortedKnown[mid] < prefix) lo = mid + 1; else hi = mid; }
    // Best completion: highest weight among the next few that share the prefix.
    let best = null;
    for (let i = lo; i < Math.min(sortedKnown.length, lo + 400) && sortedKnown[i].startsWith(prefix); i += 1) {
      const w = sortedKnown[i];
      const weight = targets.get(w) || 0;
      if (!best || weight > best.weight || (weight === best.weight && w.length < best.word.length)) best = { word: w, weight };
    }
    return best;
  }

  /** Allowed edit distance for a typed word of this length against a candidate. */
  function allowedDistance(len, candidate, weight) {
    if (len < 4) return 0;
    if (len === 4) return candidate.length === 4 ? 1 : 0; // "poize"->"poise" ok, "hair"->"chair" never
    if (len <= 6) return 1;
    if (len <= 8) return weight >= WEIGHT.ONTOLOGY ? 2 : 1;
    if (len <= 11) return 2;
    return weight >= WEIGHT.ONTOLOGY ? 3 : 2;
  }

  function fuzzyFind(w) {
    const L = w.length;
    if (L < 4) return null;
    const index = lengthIndex();
    const maxD = L >= 12 ? 3 : L >= 7 ? 2 : 1;
    let best = null;
    for (let len = L - maxD; len <= L + maxD; len += 1) {
      const bucket = index.get(len);
      if (!bucket) continue;
      for (const [cand, weight] of bucket) {
        const allowed = allowedDistance(L, cand, weight);
        if (!allowed || Math.abs(len - L) > allowed) continue;
        const d = damerauDistance(w, cand, allowed);
        if (d > allowed) continue;
        // Lower is better: distance first, then prefer curated/ontology words,
        // same first letter, and a close length.
        const rank = d * 10 - weight - (cand[0] === w[0] ? 3 : 0) + Math.abs(len - L) * 0.5;
        if (!best || rank < best.rank) best = { word: cand, d, rank, weight };
      }
    }
    if (!best) return null;
    // A different first letter needs a strong target and distance 1.
    // ...and the same length ("xramps"->"cramps"), never an added/dropped first letter ("chair"->"hair").
    if (best.word[0] !== w[0] && (best.d > 1 || best.weight < WEIGHT.IDENTITY || best.word.length !== w.length)) return null;
    return best;
  }

  /**
   * One word -> { status, to?, expand?, confidence }
   *   known | number | partial (still typing) | corrected | unknown
   */
  function resolveWord(word, { typingLast = false, isLastWord = false } = {}) {
    const key = `${word}|${typingLast ? 1 : 0}${isLastWord ? 1 : 0}`;
    if (resolveCache.has(key)) return resolveCache.get(key);
    buildVariants();
    const w = bareWord(word);
    let res;
    if (!w) res = { status: 'known' };
    else if (/\d/.test(w) || /^\$/.test(word)) res = { status: 'number' };
    else if (ABBREVIATIONS[w] || ABBREVIATIONS[word]) res = { status: 'known', expand: ABBREVIATIONS[w] || ABBREVIATIONS[word] };
    else if (known.has(w)) res = { status: 'known' };
    else if (misspell.has(w)) {
      const to = misspell.get(w);
      // Pure spacing variants ("periodunderwear") are fixed silently.
      res = bareWord(to) === w ? { status: 'known', expand: to, replace: true } : { status: 'corrected', to, confidence: 0.95 };
    } else {
      const stem = stemCandidates(w).find((s) => known.has(s));
      const stemTypo = !stem && stemCandidates(w).find((s) => misspell.has(s));
      if (stem) res = { status: 'known' };
      else if (stemTypo) res = { status: 'corrected', to: misspell.get(stemTypo), confidence: 0.85 };
      else if (w.length <= 2) res = { status: 'known' };
      else {
        let split = null;
        for (let i = 3; i <= w.length - 3 && !split; i += 1) {
          const a = w.slice(0, i);
          const b = w.slice(i);
          if ((targets.get(a) || 0) >= WEIGHT.ONTOLOGY && (targets.get(b) || 0) >= WEIGHT.ONTOLOGY) split = `${a} ${b}`;
        }
        if (split) res = { status: 'known', expand: split, replace: true };
        else {
          const prefix = (typingLast && w.length >= 2) || (isLastWord && w.length >= 3) ? knownPrefix(w) : null;
          if (prefix) res = { status: 'partial', completion: prefix.word };
          else {
            const hit = fuzzyFind(w);
            if (hit) res = { status: 'corrected', to: hit.word, confidence: hit.d === 1 ? 0.8 : 0.65 };
            else res = { status: 'unknown' };
          }
        }
      }
    }
    if (resolveCache.size > 5000) resolveCache.clear();
    resolveCache.set(key, res);
    return res;
  }

  const NEED_PHRASES = Object.keys(TERM_NEEDS).sort((x, y) => y.length - x.length);
  const CATEGORY_PHRASES = Object.keys(CATEGORY_TERMS).sort((x, y) => y.length - x.length);
  const INTENT_WORDS = new Set([...NEED_PHRASES, ...CATEGORY_PHRASES].filter((p) => !p.includes(' ')));

  /** Each word swapped for a base form the intent tables know ("cramping" -> "cramp"). */
  function stemmedForIntent(text) {
    return text.split(' ').map((w) => (INTENT_WORDS.has(w) ? w : stemCandidates(w).find((s) => INTENT_WORDS.has(s)) || w)).join(' ');
  }

  /** Match phrases longest first; a matched phrase is masked so "heating pad" is not also "pad". */
  function matchPhrases(text, phrases, onHit) {
    let rest = ` ${text} `;
    for (const p of phrases) {
      if (!hasPhrase(rest, p)) continue;
      onHit(p);
      rest = rest.replace(new RegExp(`(^|[^a-z0-9])${escapeRegExp(p)}(?=[^a-z0-9]|$)`, 'g'), '$1 _ ');
    }
  }

  function detectIntent(rawText) {
    const needs = [];
    const categories = [];
    const filters = {};
    const text = `${rawText} | ${stemmedForIntent(rawText)}`;
    matchPhrases(text, NEED_PHRASES, (p) => TERM_NEEDS[p].forEach((id) => pushUnique(needs, id)));
    for (const rule of ontologyRules) {
      if (!rule.re.test(text)) continue;
      if (rule.kind === 'need') pushUnique(needs, rule.id);
      else if (rule.kind === 'condition') pushUnique(needs, conditionNeeds[rule.id]);
      else if (rule.kind === 'life_stage') (LIFE_STAGE_NEEDS[rule.id] || []).forEach((id) => pushUnique(needs, id));
    }
    matchPhrases(text, CATEGORY_PHRASES, (p) => pushUnique(categories, CATEGORY_TERMS[p]));
    const max = text.match(PRICE_MAX_RE) || text.match(PRICE_MAX_TAIL_RE);
    if (max) filters.maxPrice = Number(max[1]);
    const min = text.match(PRICE_MIN_RE);
    if (min) filters.minPrice = Number(min[1]);
    for (const [name, re] of FILTER_RULES) if (re.test(text)) filters[name] = true;
    const negated = negatedFormats(rawText).ids;
    if (negated.length) filters.excludeFormats = negated;
    if (filters.pregnancy) { pushUnique(needs, 'pregnancy.safe_discovery'); }
    if (filters.breastfeeding) pushUnique(needs, 'postpartum.lactation');
    // "pads" is a category, not a need: a category word alone never brings in need products.
    return { needs, categories, filters };
  }

  /**
   * Analyze a query.
   * @param {string} query
   * @param {{ typing?: boolean }} [opts] typing: the last word may still be half-typed
   */
  function analyze(query, opts = {}) {
    const raw = String(query ?? '');
    const typing = Boolean(opts.typing) && !/\s$/.test(raw);
    const cacheKey = `${typing ? 't' : 'f'}|${raw}`;
    if (analysisCache.has(cacheKey)) return analysisCache.get(cacheKey);
    buildVariants();
    const toks = tokenize(raw);
    const tokens = [];
    for (let i = 0; i < toks.length; i += 1) {
      const t = toks[i];
      const next = toks[i + 1];
      // Two-word spacing variants and misspellings ("post partum", "peri menopause").
      if (next) {
        const pair = `${t.word} ${next.word}`.replace(/-/g, ' ');
        const joined = phrases.get(pair);
        const concat = bareWord(t.word) + bareWord(next.word);
        const concatTarget = (targets.get(concat) || 0) >= WEIGHT.IDENTITY && !known.has(bareWord(next.word));
        if (joined || concatTarget) {
          const to = joined || concat;
          const silent = bareWord(to) === concat;
          tokens.push({ raw: raw.slice(t.start, next.end), word: pair, start: t.start, end: next.end, status: silent ? 'known' : 'corrected', to: silent ? undefined : to, expand: silent ? to : undefined, replace: silent, confidence: 0.95 });
          i += 1;
          continue;
        }
      }
      const isLast = i === toks.length - 1 && t.end === raw.length;
      const r = resolveWord(t.word, { typingLast: typing && isLast, isLastWord: i === toks.length - 1 });
      tokens.push({ ...t, ...r });
    }

    const correctedParts = [];
    const searchParts = [];
    const unknown = [];
    let corrected = false;
    for (const t of tokens) {
      const out = t.status === 'corrected' ? t.to : t.word;
      if (t.status === 'corrected') corrected = true;
      if (t.status === 'unknown') unknown.push(t.raw);
      correctedParts.push(out);
      const base = t.status === 'partial' && t.completion && bareWord(t.word).length >= 3 ? t.completion : out;
      if (!t.replace) searchParts.push(base);
      if (t.expand) searchParts.push(t.expand);
    }
    const correctedQuery = correctedParts.join(' ');
    // "Did you mean" only offers words we know: an unknown word is flagged on its own.
    const knownCorrected = tokens.filter((t) => t.status !== 'unknown').map((t) => (t.status === 'corrected' ? t.to : t.word)).join(' ');
    const intentText = normalizeText(searchParts.join(' ')).replace(/\s+/g, ' ');
    // Format exclusions are read from what she typed (spelling fixes can split "isn't").
    const negated = negatedFormats(raw);
    const intent = detectIntent(intentText);
    if (negated.ids.length) intent.filters.excludeFormats = negated.ids;
    else delete intent.filters.excludeFormats;
    const NEG_WORDS = new Set(['not', 'no', 'non', 'without', 'isn', 'isnt', 't', 'is', 'aren', 'arent', 'are', 'nothing', 'never', 'avoid', 'avoiding', 'skip', 'skipping', 'free', 'a', 'an', 'any', 'more', 'taking', 'swallowing', 'another', 'other', 'instead', 'of']);
    let words = intentText.split(' ').filter((w) => w && !FILLER.has(w) && !FILTER_WORDS.has(w) && !/^\$?\d/.test(w)
      && !(negated.ids.length && (negated.words.has(w) || negated.words.has(w.replace(/'/g, '')) || (NEG_WORDS.has(w.replace(/'/g, '')) && negated.words.has(w.replace(/'/g, ''))))));
    if (!words.length) words = intentText.split(' ').filter((w) => KEEP_IF_ALONE.has(w));
    const searchText = [...new Set(words)].join(' ');
    const result = {
      query: raw,
      tokens,
      correctedQuery,
      didYouMean: corrected ? knownCorrected : null,
      unknown,
      searchText,
      needs: intent.needs,
      categories: intent.categories,
      filters: intent.filters,
      hasFilters: Object.keys(intent.filters).length > 0,
      isEmpty: !tokens.length,
    };
    if (analysisCache.size > 300) analysisCache.clear();
    analysisCache.set(cacheKey, result);
    return result;
  }

  // ── Products ──────────────────────────────────────────────────────────────
  function productEntry(item) {
    if (!item || typeof item !== 'object') return null;
    let e = productCache.get(item);
    if (!e) {
      e = { hay: fullTextFn ? fullTextFn(item) : '', identity: identityTextFn ? identityTextFn(item) : '', profile: undefined, price: undefined };
      productCache.set(item, e);
    }
    return e;
  }
  function profileOf(item, e) {
    if (e.profile === undefined) {
      try { e.profile = productProfileFn ? productProfileFn(item) : null; } catch { e.profile = null; }
    }
    return e.profile;
  }
  function priceOf(item, e) {
    if (e.price === undefined) {
      const p = profileOf(item, e);
      e.price = p?.price?.amount ?? (priceFn ? priceFn(item) : null);
      if (p?.price?.is_free) e.price = 0;
    }
    return e.price;
  }

  function passesFilters(item, e, f) {
    if (f.maxPrice != null || f.minPrice != null) {
      const price = priceOf(item, e);
      if (price == null) return false;
      if (f.maxPrice != null && price > f.maxPrice) return false;
      if (f.minPrice != null && price < f.minPrice) return false;
    }
    if (f.excludeFormats?.length) {
      const formats = profileOf(item, e)?.formats || [];
      if (f.excludeFormats.some((id) => formats.includes(id))) return false;
    }
    const p = (f.fragranceFree || f.pregnancy || f.organic || f.vegan || f.reusable || f.crueltyFree || f.latexFree || f.nonHormonal) ? profileOf(item, e) : null;
    if (f.fragranceFree && p && p.safety?.fragrance !== 'no') return false;
    if (f.latexFree && p && p.safety?.latex === 'yes') return false;
    if (f.nonHormonal && p && p.safety?.hormones === 'yes') return false;
    if (f.pregnancy && p && ['contraindicated', 'caution'].includes(p.pregnancy?.overall)) return false;
    if (f.organic && p && p.values?.organic !== 'yes') return false;
    if (f.vegan && p && p.values?.vegan !== 'yes') return false;
    if (f.reusable && p && p.values?.reusable !== 'yes') return false;
    if (f.crueltyFree && p && p.values?.cruelty_free !== 'yes') return false;
    if (f.fsaHsa) {
      const eligible = ['pad', 'tampon', 'cup', 'disc'].includes(item.category) || item.fsaHsaEligible === true || item.fsa_hsa_eligible === true || item.fsaEligible === true || item.hsaEligible === true || (p || profileOf(item, e))?.fsa_hsa === 'yes';
      if (!eligible) return false;
    }
    return true;
  }

  /**
   * Relevance of `item` for `query` (0 = not a match). Spelling-tolerant,
   * understands broad asks ("something for cramps", "under $25").
   */
  function scoreProduct(query, item) {
    const q = String(query || '').trim();
    if (!q) return 0;
    const a = analyze(q);
    const e = productEntry(item);
    if (!e) return 0;
    if (a.hasFilters && !passesFilters(item, e, a.filters)) return 0;
    let s = 0;
    if (baseScoreFn) {
      if (a.searchText) s = baseScoreFn(a.searchText, e.hay, e.identity);
      // The old scorer on the literal query still counts (never worse than before).
      if (!a.didYouMean && !a.hasFilters) s = Math.max(s, baseScoreFn(q, e.hay, e.identity));
    }
    if (a.needs.length) {
      const rel = profileOf(item, e)?.health_need_relevance || {};
      let best = 0;
      for (const n of a.needs) best = Math.max(best, rel[n]?.score || 0);
      if (best >= 0.55) s += 3 + best * 4;
      else if (best >= 0.3 && s > 0) s += best * 2;
    }
    if (s > 0 && a.categories.length && a.categories.includes(item.category)) s += 2;
    // A word typed exactly as the product's name or brand says it beats a near miss ("Proov" vs "Proof").
    if (s > 0 && a.searchText) {
      const nameText = normalizeText(`${item.name || ''} ${item.brand || ''}`);
      for (const w of a.searchText.split(' ')) if (w.length > 2 && hasPhrase(nameText, w)) s += 1.5;
    }
    if (a.filters.fragranceFree && s > 0 && profileOf(item, e)?.safety?.fragrance === 'no') s += 1;
    if (!s && !a.searchText && !a.needs.length && !a.categories.length && a.hasFilters) s = 1;
    if (s > 0 && a.filters.budget) {
      const price = priceOf(item, e);
      if (price != null) s += Math.max(0, 3 - price / 15);
    }
    return s;
  }

  // ── Articles (reads) ──────────────────────────────────────────────────────
  function registerArticles(articles) {
    if (!Array.isArray(articles) || registeredArticleSets.has(articles)) return;
    registeredArticleSets.add(articles);
    for (const art of articles) {
      addText(art?.title, WEIGHT.ARTICLE);
      addText((art?.tags || []).join(' '), WEIGHT.ARTICLE);
      addText(art?.teaser, 0);
      if (art?.title) addSuggestion('article', art.title, art.title, { id: art.id, weight: 1 });
    }
  }

  function wordHits(word, text) {
    if (!word) return false;
    if (hasPhrase(text, word)) return true;
    return stemCandidates(word).some((s) => s.length > 2 && hasPhrase(text, s));
  }

  /** Reads matching `query`, best first. */
  function searchArticles(query, articles) {
    const list = Array.isArray(articles) ? articles : [];
    registerArticles(list);
    const q = String(query || '').trim();
    if (q.length < 2) return [];
    const a = analyze(q);
    const words = a.searchText.split(' ').filter(Boolean);
    const needWords = a.needs.flatMap((n) => [NEED_SHORT_LABELS[n], ...Object.entries(TERM_NEEDS).filter(([, ids]) => ids.includes(n)).map(([k]) => k)]).filter(Boolean).map((w) => normalizeText(w));
    const literal = normalizeText(q);
    return list.map((art, idx) => {
      const title = normalizeText(art.title || '');
      const tags = normalizeText((art.tags || []).join(' ').replace(/-/g, ' '));
      const teaser = normalizeText(art.teaser || '');
      let s = 0;
      for (const w of words) {
        if (wordHits(w, title)) s += 3;
        else if (wordHits(w, tags)) s += 2;
        else if (wordHits(w, teaser)) s += 1;
      }
      for (const w of needWords) if (hasPhrase(`${title} ${tags} ${teaser}`, w)) { s += 1.5; break; }
      if (`${title} ${tags} ${teaser}`.includes(literal)) s += 2;
      return { art, s, idx };
    }).filter((x) => x.s > 0).sort((x, y) => y.s - x.s || x.idx - y.idx).map((x) => x.art);
  }

  // ── Pick lists (medications, products you've used, community picker) ─────
  function optionScore(qb, qWords, option) {
    const n = bareWord(option);
    if (!n) return Infinity;
    if (n === qb) return 0;
    if (n.startsWith(qb)) return 1 + (n.length - qb.length) / 100;
    const words = normalizeText(option).split(/[^a-z0-9]+/).filter(Boolean);
    if (words.some((w) => w.startsWith(qb))) return 1.5 + n.indexOf(qb[0]) / 100;
    if (qb.length >= 3 && n.includes(qb)) return 2 + n.indexOf(qb) / 100;
    if (qWords.length > 1 && qWords.every((qw) => words.some((w) => w.startsWith(qw)))) return 2.5;
    // Typo tolerance: whole option, its start (still typing), or any of its words.
    const allowed = qb.length <= 3 ? 0 : qb.length <= 5 ? 1 : qb.length <= 9 ? 2 : 3;
    if (!allowed) return Infinity;
    let d = damerauDistance(qb, n, allowed);
    d = Math.min(d, damerauDistance(qb, n.slice(0, qb.length), allowed));
    for (const w of words) if (w.length >= 3) d = Math.min(d, damerauDistance(qb, w, allowed), damerauDistance(qb, w.slice(0, qb.length), allowed));
    return d <= allowed ? 10 + d + Math.abs(n.length - qb.length) / 100 : Infinity;
  }

  /** Rank a list of strings (or objects via `getText`) against what is typed, typo tolerant. */
  function rankOptions(query, options = [], limit = 6, getText = (o) => o) {
    const raw = String(query || '').trim();
    const qb = bareWord(raw);
    if (qb.length < 2) return [];
    const a = analyze(raw);
    const alt = a.didYouMean ? bareWord(a.correctedQuery) : null;
    const qWords = normalizeText(raw).split(/[^a-z0-9]+/).filter(Boolean);
    const altWords = a.didYouMean ? normalizeText(a.correctedQuery).split(/[^a-z0-9]+/).filter(Boolean) : null;
    const scored = [];
    options.forEach((option, idx) => {
      const text = String(getText(option) ?? '');
      let s = optionScore(qb, qWords, text);
      if (alt && alt !== qb) s = Math.min(s, optionScore(alt, altWords, text) + 0.5);
      if (Number.isFinite(s)) scored.push({ option, s, idx, text });
    });
    scored.sort((x, y) => x.s - y.s || x.text.localeCompare(y.text) || x.idx - y.idx);
    return scored.slice(0, limit).map((x) => x.option);
  }

  // ── Suggestions (dropdown / chips) ────────────────────────────────────────
  function registerSuggestions(kind, labels, extra = {}) {
    for (const l of labels) {
      if (typeof l === 'string') addSuggestion(kind, l, l, extra);
      else if (l?.label) addSuggestion(kind, l.label, l.query || l.label, { ...extra, ...l });
    }
  }

  /**
   * Suggestions for what is typed: "Products for PMS", categories, brands,
   * products and reads. Each: { kind, label, query, id?, needId? }.
   */
  function suggest(query, { products = [], articles = null, limit = 7, kinds = null } = {}) {
    const raw = String(query || '');
    if (raw.trim().length < 2) return [];
    if (articles) registerArticles(articles);
    const a = analyze(raw, { typing: true });
    const allow = (k) => !kinds || kinds.includes(k);
    const out = [];
    const seen = new Set();
    const push = (s) => {
      const key = s.label.toLowerCase();
      if (seen.has(key) || out.length >= limit * 2) return;
      seen.add(key);
      out.push(s);
    };
    if (allow('need')) for (const n of a.needs.slice(0, 2)) if (NEED_SHORT_LABELS[n]) push({ kind: 'need', label: `Products for ${NEED_SHORT_LABELS[n]}`, query: NEED_SHORT_LABELS[n], needId: n });
    // Prefix / word matches against the suggestion index, using the corrected words.
    const lastTok = a.tokens[a.tokens.length - 1];
    const typed = a.tokens.map((t) => bareWord(t.status === 'corrected' ? t.to : t.status === 'partial' ? t.word : t.word)).filter(Boolean);
    const words = typed.filter((w) => !FILLER.has(w));
    if (words.length) {
      const last = words[words.length - 1];
      const head = words.slice(0, -1);
      const lastPartial = lastTok?.status === 'partial';
      const matches = [];
      for (const s of suggestIndex) {
        if (!allow(s.kind)) continue;
        const sw = s.norm.split(' ');
        const lastOk = sw.some((w) => (lastPartial ? w.startsWith(last) : (w === last || w.startsWith(last) || stemCandidates(last).includes(w))));
        if (!lastOk) continue;
        if (!head.every((h) => sw.some((w) => w === h || w.startsWith(h) || stemCandidates(h).includes(w)))) continue;
        const starts = s.norm.startsWith(words.join(' ')) ? 0 : 1;
        matches.push({ s, rank: starts * 10 - (s.weight || 0) + s.norm.length / 100 });
      }
      matches.sort((x, y) => x.rank - y.rank);
      for (const m of matches.slice(0, limit)) push({ kind: m.s.kind, label: m.s.label, query: m.s.query, id: m.s.id, needId: m.s.needId });
    }
    if (allow('product') && products.length && a.tokens.some((t) => t.status !== 'partial')) {
      const top = products.map((p) => ({ p, s: scoreProduct(a.correctedQuery || raw, p) })).filter((x) => x.s > 0).sort((x, y) => y.s - x.s).slice(0, 3);
      for (const { p } of top) push({ kind: 'product', label: p.name, query: p.name, id: p.id, sub: p.brand && !normalizeText(p.name).includes(normalizeText(p.brand)) ? p.brand : undefined });
    }
    const order = { need: 0, category: 1, brand: 2, product: 3, article: 4 };
    return out.sort((x, y) => (order[x.kind] ?? 5) - (order[y.kind] ?? 5)).slice(0, limit);
  }

  /** Short list of things to try when a word is not recognised. */
  function fallbackSuggestions(query, limit = 4) {
    const a = analyze(query);
    const out = [];
    for (const t of a.tokens) {
      if (t.status !== 'unknown') continue;
      const w = bareWord(t.word);
      if (w.length < 6) continue;
      // Slightly looser look-around than auto-correct, same first letter only.
      const maxD = w.length >= 8 ? 2 : 1;
      let best = null;
      for (const [cand, weight] of targets) {
        if (Math.abs(cand.length - w.length) > maxD || weight < WEIGHT.IDENTITY || cand[0] !== w[0]) continue;
        const d = damerauDistance(w, cand, maxD);
        if (d <= maxD && (!best || d < best.d || (d === best.d && weight > best.weight))) best = { cand, d, weight };
      }
      if (best) out.push(best.cand);
    }
    for (const p of POPULAR_SEARCHES) if (out.length < limit) out.push(p);
    return [...new Set(out)].slice(0, limit);
  }

  function stats() {
    buildVariants();
    return { knownWords: known.size, targets: targets.size, misspellings: misspell.size, generated: generatedCount, phrases: phrases.size, suggestions: suggestIndex.length };
  }

  return {
    addText,
    registerArticles,
    registerSuggestions,
    setProductScoring({ profile, identityText, fullText, baseScore, price } = {}) {
      if (profile) productProfileFn = profile;
      if (identityText) identityTextFn = identityText;
      if (fullText) fullTextFn = fullText;
      if (baseScore) baseScoreFn = baseScore;
      if (price) priceFn = price;
    },
    analyze,
    resolveWord,
    scoreProduct,
    searchArticles,
    rankOptions,
    suggest,
    fallbackSuggestions,
    stats,
    isKnownWord: (w) => known.has(bareWord(w)),
  };
}

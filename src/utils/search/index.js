/**
 * The one search engine every search box uses (website Shop + landing hero,
 * app Browse, Library on both, Community, quiz pick lists, community product
 * picker). Built lazily on first use from the catalog, the matching ontology
 * (read-only), medications and the curated synonym list.
 *
 *   import { scoreSearchMatch, analyzeSearch, searchArticles, rankSearchOptions, searchSuggestions } from '../utils/search';
 */
import { createSearchEngine, WEIGHT } from './engine.js';
import { ALL_PRODUCTS, CATEGORY_LABELS } from '../../data/products.js';
import { NEEDS, CONDITIONS, LIFE_STAGES, FORMATS, VALUES, ALLERGENS, LEAVE_OUT, SYNONYM_RULES, CONDITION_SUPPORT_NEED } from '../../matching/ontology.js';
import { MEDICATIONS } from '../../matching/medications.js';
import { buildProductProfile } from '../../matching/productProfile.js';
import { buildSearchTextForItem, buildIdentityTextForItem, scoreQueryAgainstProduct } from '../naturalLanguageSearch.js';

export { createSearchEngine } from './engine.js';
export { tokenize, normalizeText, damerauDistance } from './text.js';
export { generateTypoVariants } from './variants.js';

let ENGINE = null;
const registeredCatalogs = new WeakSet();

function registerCatalog(engine, products) {
  if (!Array.isArray(products) || registeredCatalogs.has(products)) return;
  registeredCatalogs.add(products);
  const brands = new Set();
  for (const p of products) {
    if (!p || typeof p !== 'object') continue;
    engine.addText(p.name, WEIGHT.IDENTITY);
    engine.addText(p.brand, WEIGHT.BRAND);
    engine.addText((p.tags || []).join(' ').replace(/-/g, ' '), WEIGHT.IDENTITY);
    engine.addText((p.healthFunctions || []).join(' ').replace(/-/g, ' '), WEIGHT.IDENTITY);
    engine.addText((p.badges || []).join(' '), WEIGHT.IDENTITY);
    engine.addText(CATEGORY_LABELS[p.category] || p.category, WEIGHT.IDENTITY);
    // Prose: recognised as real words, but never a correction target.
    engine.addText([p.summary, p.tagline, p.ingredients, p.whoItsFor, p.effectiveness, typeof p.safety === 'object' ? p.safety?.materials : null].filter(Boolean).join(' '), 0);
    if (p.brand) brands.add(p.brand);
  }
  engine.registerSuggestions('brand', [...brands].sort());
  engine.registerSuggestions('product', products.filter((p) => p?.name).map((p) => ({ label: p.name, query: p.name, id: p.id, weight: 0 })));
}

export function getSearchEngine() {
  if (ENGINE) return ENGINE;
  const engine = createSearchEngine({ ontology: { rules: SYNONYM_RULES, conditionNeeds: CONDITION_SUPPORT_NEED } });
  for (const n of NEEDS) { engine.addText(n.option, WEIGHT.ONTOLOGY); engine.addText(n.phrase, WEIGHT.ONTOLOGY); }
  for (const list of [CONDITIONS, LIFE_STAGES, FORMATS, VALUES, ALLERGENS, LEAVE_OUT]) for (const x of list) { engine.addText(x.option, WEIGHT.ONTOLOGY); engine.addText(x.phrase, WEIGHT.ONTOLOGY); }
  for (const m of MEDICATIONS) { engine.addText(m.generic, WEIGHT.IDENTITY); engine.addText((m.brands || []).join(' '), WEIGHT.IDENTITY); }
  const seenCats = new Set();
  const cats = [];
  for (const [id, label] of Object.entries(CATEGORY_LABELS)) {
    engine.addText(label, WEIGHT.ONTOLOGY);
    if (!seenCats.has(label) && id !== 'custom-brand') { seenCats.add(label); cats.push({ label, query: label, catId: id, weight: 2 }); }
  }
  engine.registerSuggestions('category', cats);
  engine.setProductScoring({
    profile: buildProductProfile,
    fullText: (item) => buildSearchTextForItem(item, CATEGORY_LABELS),
    identityText: (item) => buildIdentityTextForItem(item, CATEGORY_LABELS),
    baseScore: scoreQueryAgainstProduct,
  });
  registerCatalog(engine, ALL_PRODUCTS);
  ENGINE = engine;
  return engine;
}

/** Full analysis of a query: tokens with status, didYouMean, unknown words, needs, filters. */
export function analyzeSearch(query, opts) { return getSearchEngine().analyze(query, opts); }

/** The spelling-corrected query ("menstral crmps" -> "menstrual cramps"). */
export function correctedSearchQuery(query) {
  const a = getSearchEngine().analyze(query);
  return a.didYouMean || String(query || '').trim();
}

/**
 * Drop-in replacement for scoreQueryAgainstProduct(q, buildSearchTextForItem(item), buildIdentityTextForItem(item)):
 * same "higher is better, 0 = no match" contract, plus spelling tolerance,
 * health-need intent ("things for PMS") and filters ("under $25").
 */
export function scoreSearchMatch(query, item) { return getSearchEngine().scoreProduct(query, item); }

/** Products matching a query, best first (scores attached as `_searchScore`). */
export function searchProducts(query, products = ALL_PRODUCTS) {
  const engine = getSearchEngine();
  registerCatalog(engine, products);
  return products.map((p) => ({ p, s: engine.scoreProduct(query, p) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.p);
}

export function searchArticles(query, articles) { return getSearchEngine().searchArticles(query, articles); }

export function rankSearchOptions(query, options, limit = 6, getText) { return getSearchEngine().rankOptions(query, options, limit, getText); }

export function searchSuggestions(query, opts = {}) {
  const engine = getSearchEngine();
  if (opts.products) registerCatalog(engine, opts.products);
  return engine.suggest(query, { products: ALL_PRODUCTS, ...opts });
}

export function searchFallbacks(query, limit) { return getSearchEngine().fallbackSuggestions(query, limit); }

const registeredVocab = new WeakSet();
export function registerSearchVocabulary(texts = []) {
  if (!Array.isArray(texts) || registeredVocab.has(texts)) return;
  registeredVocab.add(texts);
  const engine = getSearchEngine();
  for (const t of texts) engine.addText(t, WEIGHT.ARTICLE);
}

/** True when `text` is a match for what was typed (substring or typo-tolerant). For filtering short lists in place. */
export function matchesSearchOption(query, text) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const t = String(text || '');
  if (!t) return false;
  if (t.toLowerCase().includes(q)) return true;
  return getSearchEngine().rankOptions(q, [t], 1).length > 0;
}

let warmed = false;
/** Build the engine (and product need profiles) during idle time. Returns a cancel function. */
export function warmSearchEngine() {
  if (warmed || typeof window === 'undefined') return () => {};
  const run = () => { if (warmed) return; warmed = true; try { getSearchEngine().scoreProduct('pms', ALL_PRODUCTS[0]); searchProducts('pms'); } catch { /* best effort */ } };
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: 3000 });
    return () => window.cancelIdleCallback?.(id);
  }
  const t = setTimeout(run, 1200);
  return () => clearTimeout(t);
}

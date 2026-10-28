// The search engine, loaded after first paint.
//
// utils/search/index.js reads the whole catalog (products, research, matching
// ontology), so importing it directly put about 3MB of data in front of every
// page's first paint (the search box is on Home and Shop). The search box
// imports these wrappers instead: they load the engine on first use and act as
// "nothing to suggest yet" until it arrives; useSearchReady() re-renders the
// caller once it has.
import { useSyncExternalStore } from 'react';
import { searchNow, subscribeSearch } from './searchRegistry.js';

let engine = null;
let pending = null;
const adopt = () => { engine = searchNow(); };
subscribeSearch(adopt);
adopt();

export function loadSearch() {
  if (engine) return Promise.resolve(engine);
  if (!pending) {
    pending = import('./index.js').then(() => { adopt(); return engine; }).catch((err) => { pending = null; throw err; });
  }
  return pending;
}

const isReady = () => engine !== null;

/** True once the engine has loaded (starts loading it). */
export function useSearchReady() {
  if (!engine && !pending) loadSearch().catch(() => {});
  return useSyncExternalStore(subscribeSearch, isReady, isReady);
}

/** Underline analysis of what was typed, or null until the engine loads. */
export function analyzeSearch(query, opts) { return engine ? engine.analyzeSearch(query, opts) : null; }

/** Suggestions for what was typed ([] until the engine loads). */
export function searchSuggestions(query, opts) { return engine ? engine.searchSuggestions(query, opts) : []; }

/** How well an item matches the query (0 until the engine loads). */
export function scoreSearchMatch(query, item) { return engine ? engine.scoreSearchMatch(query, item) : 0; }

/** The spelling-corrected query (the query as typed until the engine loads). */
export function correctedSearchQuery(query) { return engine ? engine.correctedSearchQuery(query) : String(query || '').trim(); }

/** Reads matching the query ([] until the engine loads). */
export function searchArticles(query, articles) { return engine ? engine.searchArticles(query, articles) : []; }

/** Other searches to try ([] until the engine loads). */
export function searchFallbacks(query, limit) { return engine ? engine.searchFallbacks(query, limit) : []; }

/** Adds page words to the vocabulary (now, or once the engine loads). */
export function registerSearchVocabulary(texts) {
  if (engine) { engine.registerSearchVocabulary(texts); return; }
  loadSearch().then((m) => m.registerSearchVocabulary(texts)).catch(() => {});
}

/** Builds the engine while the browser is idle; returns a cancel function. */
export function warmSearchEngine() {
  let cancelled = false;
  let cancelWarm = null;
  loadSearch().then((m) => { if (!cancelled) cancelWarm = m.warmSearchEngine(); }).catch(() => {});
  return () => { cancelled = true; cancelWarm?.(); };
}

/**
 * Explore's search (UX spec 11 and 26): one query, results grouped as
 * Health topics, Products, Services, Resources (and Community, fetched by the
 * caller because it needs the network). Built only on the existing engine
 * (searchProducts, searchArticles, matchesSearchOption), so it spells, stems
 * and understands needs exactly like the Shop and the Library do.
 */
import { searchProducts, searchArticles, matchesSearchOption } from './index.js';
import { COMMUNITY_TOPICS } from '../community/topics.js';
import { STARTUPS } from '../../data/startups.js';

const STARTUP_IDS = new Set(STARTUPS.map((s) => String(s.id)));
// Community topics that are about life, not health.
const NOT_HEALTH = new Set(['college', 'budget']);

/** The health topics Explore lists: the same topic graph Community uses. */
export const HEALTH_TOPICS = COMMUNITY_TOPICS.filter((t) => !NOT_HEALTH.has(t.key));

/** Services: telehealth, at-home tests, apps and programs from women's health companies (src/data/startups.js). */
export function isService(item) {
  return Boolean(item && STARTUP_IDS.has(String(item.id)));
}

export function splitCatalog(items = []) {
  const products = [];
  const services = [];
  for (const item of items) (isService(item) ? services : products).push(item);
  return { products, services };
}

/** Topics a query names: by label, or by any of the topic's engine tags. */
export function matchTopics(query, topics = HEALTH_TOPICS) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  return topics.filter((t) => matchesSearchOption(q, t.label) || t.tags.some((tag) => matchesSearchOption(q, tag.replace(/-/g, ' '))));
}

/**
 * Grouped results for one query. `items` is the catalog the page already
 * holds (products and services together), `articles` the reads.
 */
export function searchExplore(query, { items = [], articles = [] } = {}) {
  const q = String(query || '').trim();
  if (q.length < 2) return { query: q, topics: [], products: [], services: [], resources: [], total: 0 };
  const found = searchProducts(q, items);
  const { products, services } = splitCatalog(found);
  const resources = searchArticles(q, articles);
  const topics = matchTopics(q);
  return { query: q, topics, products, services, resources, total: topics.length + products.length + services.length + resources.length };
}

import { ALL_PRODUCTS, CATEGORY_LABELS } from '../../data/products.js';

/**
 * What a search box offers on focus, before she types (founder, Oct 29:
 * "when you click on the search all the categories should pop up").
 * Every category that has products, `first` ones on top.
 */
export function categoryStarterOptions(first = [], products = ALL_PRODUCTS) {
  const has = new Set((products || []).map((p) => p?.category).filter(Boolean));
  const lead = [...new Set(first)].filter((c) => CATEGORY_LABELS[c] && has.has(c));
  const rest = Object.keys(CATEGORY_LABELS).filter((c) => !lead.includes(c) && has.has(c));
  return [...lead, ...rest].map((c) => ({ kind: 'category', label: CATEGORY_LABELS[c], query: CATEGORY_LABELS[c] }));
}
